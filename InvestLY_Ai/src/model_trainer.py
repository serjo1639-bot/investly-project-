"""
model_trainer.py — Investly Summarizer
Fine-tunes UBC-NLP/AraT5v2-base-1024 for Arabic investment-text summarisation.

Improvements over v1:
• Upgraded model: AraT5v2-base-1024 (longer context, better Arabic)
• Correct learning rate (5e-5) for fine-tuning
• ROUGE-L evaluation after every epoch
• EarlyStoppingCallback (patience = 2)
• Warmup ratio instead of fixed warmup_steps
• Automatic mixed precision (fp16 on CUDA, bf16 on Ampere+)
• Larger effective batch via gradient accumulation
• Best-model checkpoint saved automatically
"""

import sys
import os
import shutil
sys.stdout.reconfigure(encoding="utf-8")
import numpy as np
import pandas as pd
import torch
torch.backends.cuda.matmul.allow_tf32 = True
torch.backends.cudnn.allow_tf32 = True
from packaging import version
from transformers import (
    AutoModelForSeq2SeqLM,
    AutoTokenizer,
    DataCollatorForSeq2Seq,
    EarlyStoppingCallback,
    Seq2SeqTrainer,
    Seq2SeqTrainingArguments,
)
import transformers
from torch.utils.data import Dataset

from config import (
    MODEL_SAVE_PATH, HF_MODEL_NAME, PROCESSED_DATA_PATH,
    MAX_INPUT_TOKENS, MAX_TARGET_TOKENS,
    TRAIN_EPOCHS, TRAIN_BATCH_SIZE, GRAD_ACCUMULATION,
    LEARNING_RATE, WARMUP_RATIO, WEIGHT_DECAY,
)

print("=" * 60)
print("Python:", sys.executable)
print("Torch:", torch.__version__)
print("CUDA Available:", torch.cuda.is_available())
print("CUDA Version:", torch.version.cuda)

if torch.cuda.is_available():
    print("GPU:", torch.cuda.get_device_name(0))

print("=" * 60)

# ── try to import rouge_score; install hint if missing ──────────
try:
    from rouge_score import rouge_scorer as _rouge_scorer_mod
    _HAS_ROUGE = True
except ImportError:
    _HAS_ROUGE = False
    print("⚠️  rouge_score غير مثبّت — سيتم تخطي حساب ROUGE.\n"
          "   لتثبيته: pip install rouge-score")

_NEW_TF = version.parse(transformers.__version__) >= version.parse("4.46.0")


# ──────────────────────────────────────────────────────────────
# Dataset
# ──────────────────────────────────────────────────────────────
class InvestmentDataset(Dataset):
    def __init__(self, df: pd.DataFrame, tokenizer,
                 max_input: int = MAX_INPUT_TOKENS,
                 max_target: int = MAX_TARGET_TOKENS):
        self.tokenizer  = tokenizer
        self.inputs     = df["full_text"].tolist()
        self.targets    = df["summary"].tolist()
        self.max_input  = max_input
        self.max_target = max_target

    def __len__(self):
        return len(self.inputs)

    def __getitem__(self, idx):
        src = "لخص: " + str(self.inputs[idx])
        tgt = str(self.targets[idx])

        # No padding here — DataCollatorForSeq2Seq handles dynamic padding
        enc = self.tokenizer(
            src, max_length=self.max_input,
            truncation=True,
        )
        dec = self.tokenizer(
            text_target=tgt, max_length=self.max_target,
            truncation=True,
        )

        labels = dec["input_ids"]
        # DataCollator will handle the -100 masking

        return {
            "input_ids":      enc["input_ids"],
            "attention_mask": enc["attention_mask"],
            "labels":         labels,
        }


# ──────────────────────────────────────────────────────────────
# ROUGE metric
# ──────────────────────────────────────────────────────────────
def build_compute_metrics(tokenizer):
    """Returns a compute_metrics function for Seq2SeqTrainer."""
    if not _HAS_ROUGE:
        return None

    scorer = _rouge_scorer_mod.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=False)

    def compute_metrics(eval_preds):
        preds, labels = eval_preds

        if isinstance(preds, tuple):
            preds = preds[0]



        preds = np.where(preds < 0, tokenizer.pad_token_id, preds)
        labels = np.where(labels < 0, tokenizer.pad_token_id, labels)

        decoded_preds = tokenizer.batch_decode(
            preds,
            skip_special_tokens=True
        )

        decoded_labels = tokenizer.batch_decode(
            labels,
            skip_special_tokens=True
        )

        r1 = r2 = rl = 0.0

        for pred, ref in zip(decoded_preds, decoded_labels):
            scores = scorer.score(
                ref.strip(),
                pred.strip()
            )

            r1 += scores["rouge1"].fmeasure
            r2 += scores["rouge2"].fmeasure
            rl += scores["rougeL"].fmeasure

        n = max(len(decoded_preds), 1)

        return {
            "rouge1": round(r1 / n, 4),
            "rouge2": round(r2 / n, 4),
            "rougeL": round(rl / n, 4),
        }


# ──────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────
def _detect_precision(device: torch.device) -> dict:
    """Return fp16/bf16 flags based on GPU capability."""
    if device.type != "cuda":
        return {"fp16": False, "bf16": False}
    # Ampere (sm_80+) supports bf16 natively
    cap = torch.cuda.get_device_capability(device)
    if cap[0] >= 8:
        print(f"🔥 GPU Ampere+ ({cap}) — using bf16")
        return {"fp16": False, "bf16": True}
    print(f"⚡ GPU ({cap}) — using fp16")
    return {"fp16": True, "bf16": False}


def _clean_old_checkpoints(path: str):
    if not os.path.exists(path):
        return
    for item in os.listdir(path):
        if item.startswith("checkpoint-"):
            shutil.rmtree(os.path.join(path, item), ignore_errors=True)


# ──────────────────────────────────────────────────────────────
# Main training function
# ──────────────────────────────────────────────────────────────
def train_model():
    print(f"🤗 Transformers: {transformers.__version__}")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"💻 Device: {device}")
    if device.type == "cuda":
        print(f"   GPU: {torch.cuda.get_device_name(0)}")
        print(f"   VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")

    save_path = str(MODEL_SAVE_PATH)
    data_path = str(PROCESSED_DATA_PATH)
    os.makedirs(save_path, exist_ok=True)

    # ── Load tokenizer & model ──────────────────────────────
    from pathlib import Path

    LOCAL_MODEL_PATH = Path(__file__).parent / "models" / "AraT5v2-base-1024"

    print(f"\n📥 تحميل النموذج...")

    if (LOCAL_MODEL_PATH / "config.json").exists():
        print("📂 تم العثور على النموذج المحلي")

        tokenizer = AutoTokenizer.from_pretrained(
            str(LOCAL_MODEL_PATH),
            legacy=False
        )

        model = AutoModelForSeq2SeqLM.from_pretrained(
            str(LOCAL_MODEL_PATH)
        )

    else:
        print("🌐 النموذج غير موجود، جاري التنزيل من Hugging Face...")

        tokenizer = AutoTokenizer.from_pretrained(
            HF_MODEL_NAME,
            legacy=False
        )

        model = AutoModelForSeq2SeqLM.from_pretrained(
            HF_MODEL_NAME
        )

        LOCAL_MODEL_PATH.mkdir(parents=True, exist_ok=True)

        model.save_pretrained(str(LOCAL_MODEL_PATH))
        tokenizer.save_pretrained(str(LOCAL_MODEL_PATH))

        print(f"✅ تم حفظ النموذج في: {LOCAL_MODEL_PATH}")


    torch.backends.cuda.matmul.allow_tf32 = True
    torch.backends.cudnn.allow_tf32 = True

    model.to(device)
    torch.set_float32_matmul_precision("high")
    model.gradient_checkpointing_enable()
    model.config.use_cache = False

    print(f"   Parameters: {sum(p.numel() for p in model.parameters()) / 1e6:.1f} M")
    # ── Load data ───────────────────────────────────────────
    if not os.path.exists(data_path):
        raise FileNotFoundError(
            f"❌ ملف البيانات غير موجود: {data_path}\n"
            "   → شغّل data_generator.py ثم preprocessor.py أولاً."
        )
    df = pd.read_csv(data_path, encoding="utf-8-sig").dropna()
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    print(f"📊 البيانات: {len(df)} صف")

    split    = int(0.85 * len(df))
    train_ds = InvestmentDataset(df[:split],  tokenizer)
    val_ds   = InvestmentDataset(df[split:],  tokenizer)
    print(f"   Train: {len(train_ds)} | Val: {len(val_ds)}")

    collator = DataCollatorForSeq2Seq(
        tokenizer=tokenizer, model=model, label_pad_token_id=-100, pad_to_multiple_of=8,
    )

    precision = _detect_precision(device)
    strategy_key = "eval_strategy" if _NEW_TF else "evaluation_strategy"

    args = Seq2SeqTrainingArguments(
        output_dir=save_path,
        save_safetensors=True,
        # Training schedule
        num_train_epochs=TRAIN_EPOCHS,
        per_device_train_batch_size=TRAIN_BATCH_SIZE,
        per_device_eval_batch_size=TRAIN_BATCH_SIZE,
        gradient_accumulation_steps=GRAD_ACCUMULATION,

        # Optimisation
        learning_rate=LEARNING_RATE,
        warmup_ratio=WARMUP_RATIO,
        weight_decay=WEIGHT_DECAY,
        lr_scheduler_type="cosine",         # cosine decay

        # Mixed precision
        **precision,

        # Evaluation & saving
        **{strategy_key: "epoch"},
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="rougeL" if _HAS_ROUGE else "eval_loss",
        greater_is_better=_HAS_ROUGE,

        # Generation (needed for compute_metrics with predict_with_generate)
        predict_with_generate=True,
        generation_max_length=MAX_TARGET_TOKENS,
        generation_num_beams=4,
        # Logging
        logging_steps=20,
        logging_dir=os.path.join(save_path, "logs"),
        report_to="none",

        # Misc
        dataloader_num_workers=4,
        save_total_limit=4,             # keep only 2 checkpoints
    )

    callbacks = [EarlyStoppingCallback(early_stopping_patience=2)]

    trainer = Seq2SeqTrainer(
        model=model,
        args=args,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        data_collator=collator,
        compute_metrics=build_compute_metrics(tokenizer),
        callbacks=callbacks,
    )

    print("\n🚀 بدء التدريب...")
    last_checkpoint = None

    if os.path.isdir(save_path):
        checkpoints = [
            os.path.join(save_path, d)
            for d in os.listdir(save_path)
            if d.startswith("checkpoint-")
        ]

        if checkpoints:
            last_checkpoint = max(checkpoints, key=os.path.getmtime)

    trainer.train(resume_from_checkpoint=last_checkpoint)

    # ── Save final model ────────────────────────────────────
    print("\n💾 حفظ النموذج النهائي...")
    model.config.use_cache = True  # Re-enable KV caching before saving so default config enables fast inference
    model.save_pretrained(save_path)
    tokenizer.save_pretrained(save_path)


    print("\n✅ اكتمل التدريب بنجاح!")
    pd.DataFrame(
        trainer.state.log_history
    ).to_csv(
        os.path.join(save_path, "training_history.csv"),
        index=False
    )
    if _HAS_ROUGE:
        print("   راجع درجات ROUGE أعلاه لتقييم جودة النموذج.")


if __name__ == "__main__":
    train_model()
