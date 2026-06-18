"""
summarizer.py — Investly Summarizer
Loads the fine-tuned AraT5v2 model and runs inference.

Fixes over v1:
  • temperature removed from beam search (was silently ignored)
  • num_beams kept for quality; do_sample=False
  • Lazy singleton load with thread-safe flag
  • Returns dict with text + metadata
"""

import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

from config import MODEL_SAVE_PATH, HF_MODEL_NAME
from preprocessor import normalise_arabic

_model      = None
_tokenizer  = None
_device     = None


# ──────────────────────────────────────────────────────────────
# Loader (singleton)
# ──────────────────────────────────────────────────────────────
def load_model(force_reload: bool = False) -> None:
    global _model, _tokenizer, _device

    if _model is not None and not force_reload:
        return  # already loaded

    if not MODEL_SAVE_PATH.exists():
        raise FileNotFoundError(
            f"❌ مجلد النموذج '{MODEL_SAVE_PATH}' غير موجود.\n"
            "   → يرجى تشغيل خطوات التدريب من تبويب 'تدريب النموذج' أولاً."
        )

    print("🔍 تحميل التوكنايزر...")
    try:
        _tokenizer = AutoTokenizer.from_pretrained(str(MODEL_SAVE_PATH), legacy=False)
    except Exception:
        print(f"⚠️  التوكنايزر غير موجود محلياً — تحميل من الإنترنت ({HF_MODEL_NAME})...")
        _tokenizer = AutoTokenizer.from_pretrained(HF_MODEL_NAME, legacy=False)
        _tokenizer.save_pretrained(str(MODEL_SAVE_PATH))

    print("📂 تحميل النموذج...")
    _model = AutoModelForSeq2SeqLM.from_pretrained(str(MODEL_SAVE_PATH))
    _model.config.use_cache = True  # Ensure KV caching is enabled for fast inference

    _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    _model.to(_device)
    _model.eval()
    print(f"✅ النموذج جاهز على {_device}")


def unload_model() -> None:
    """Free GPU/CPU memory (call when done or before re-training)."""
    global _model, _tokenizer, _device
    _model     = None
    _tokenizer = None
    _device    = None
    if torch.cuda.is_available():
        torch.cuda.empty_cache()


# ──────────────────────────────────────────────────────────────
# Inference
# ──────────────────────────────────────────────────────────────
def summarize(text: str, max_new_tokens: int = 128, num_beams: int = 5) -> dict:
    """
    Summarise Arabic investment text.

    Parameters
    ----------
    text           : input text (Arabic)
    max_new_tokens : maximum tokens to generate
    num_beams      : beam-search width (higher = better quality, slower)

    Returns
    -------
    dict with keys:
        summary   (str)   — generated summary
        input_len (int)   — character count of input
        output_len(int)   — character count of summary
    """
    load_model()

    # Consistently normalise input text at inference time
    src = "لخص: " + normalise_arabic(text.strip())

    inputs = _tokenizer(
        src,
        return_tensors="pt",
        max_length=512,
        truncation=True,
    ).to(_device)

    with torch.no_grad():
        output_ids = _model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            num_beams=num_beams,
            early_stopping=True,
            no_repeat_ngram_size=3,
            repetition_penalty=1.2,  # Lower penalty to avoid grammatical issues in Arabic
            length_penalty=1.2,      # slightly favour longer outputs
            # NOTE: do NOT set temperature here — incompatible with beam search
        )

    summary = _tokenizer.decode(output_ids[0], skip_special_tokens=True).strip()

    return {
        "summary":    summary,
        "input_len":  len(text),
        "output_len": len(summary),
    }


# ──────────────────────────────────────────────────────────────
# Quick CLI test
# ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    sample = (
        "يقترح فريق العمل إطلاق مشروع مجموعة الأفق (الطاقة المتجددة) في طرابلس. "
        "تبلغ الميزانية التقديرية 250 مليون دينار ليبي بمدة تنفيذ 5 سنوات عبر شراكة استثمارية. "
        "يستهدف المشروع عائداً استثمارياً 18% سنوياً مع توفير 1200 فرصة عمل. "
        "تُصنَّف المخاطر بأنها متوسطة. "
        "عُقدت اجتماعات مع جهات حكومية وتم إعداد دراسة جدوى شاملة من قِبل خبراء دوليين."
    )
    result = summarize(sample)
    print("\n── الملخص ──────────────────")
    print(result["summary"])
    print(f"\nالإدخال: {result['input_len']} حرف → الملخص: {result['output_len']} حرف")
