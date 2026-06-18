"""
preprocessor.py — Investly Summarizer
Cleans and normalises Arabic investment text before training.
"""

import sys
import os
import re
import pandas as pd

sys.stdout.reconfigure(encoding="utf-8")

from config import RAW_DATA_PATH, PROCESSED_DATA_PATH, DATA_DIR


# ──────────────────────────────────────────────────────────────
# Arabic normalisation helpers
# ──────────────────────────────────────────────────────────────

# Tashkeel (diacritics) Unicode range
_TASHKEEL = re.compile(r"[\u0610-\u061A\u064B-\u065F\u0670]")

# Repeated characters (e.g. مررررحباً → مرحباً) — keep max 2
_REPEAT = re.compile(r"(.)\1{2,}")


def normalise_arabic(text: str) -> str:
    """Apply standard Arabic normalisation steps (keep spelling letters intact)."""
    if not isinstance(text, str):
        return ""
    text = _TASHKEEL.sub("", text)          # remove diacritics
    text = _REPEAT.sub(r"\1\1", text)       # collapse repeated chars
    text = re.sub(r"\s+", " ", text).strip()# collapse whitespace
    return text


def clean_text(text: str) -> str:
    """Light cleaning: remove non-Arabic/numeric noise, then normalise."""
    if not isinstance(text, str):
        return ""
    # Keep Arabic letters, digits, common punctuation, spaces
    text = re.sub(r"[^\u0600-\u06FF\d\s\.\،\:\%\(\)\-]", " ", text)
    text = normalise_arabic(text)
    return text



# ──────────────────────────────────────────────────────────────
# Quality filters
# ──────────────────────────────────────────────────────────────

MIN_INPUT_LEN  = 80   # characters
MIN_TARGET_LEN = 30
MAX_INPUT_LEN  = 2000
MAX_TARGET_LEN = 400


def _is_valid(row: pd.Series) -> bool:
    ft, sm = row["full_text"], row["summary"]
    return (
        MIN_INPUT_LEN  <= len(ft) <= MAX_INPUT_LEN  and
        MIN_TARGET_LEN <= len(sm) <= MAX_TARGET_LEN
    )


# ──────────────────────────────────────────────────────────────
# Pipeline
# ──────────────────────────────────────────────────────────────

def load_and_prepare(
    raw_path: str       = None,
    output_path: str    = None,
) -> pd.DataFrame | None:

    raw_path = raw_path or str(RAW_DATA_PATH)
    output_path = output_path or str(PROCESSED_DATA_PATH)
    os.makedirs(str(DATA_DIR), exist_ok=True)
    print(f"🔍 البحث عن: {os.path.abspath(raw_path)}")

    if not os.path.exists(raw_path):
        print(f"❌ الملف غير موجود: {raw_path}\n   → يرجى تشغيل data_generator.py أولاً.")
        return None

    try:
        df = pd.read_csv(raw_path, encoding="utf-8-sig")
        before = len(df)

        # Clean
        df["full_text"] = df["full_text"].apply(clean_text)
        df["summary"]   = df["summary"].apply(clean_text)

        # Drop nulls & empty strings
        df.dropna(subset=["full_text", "summary"], inplace=True)
        df = df[df["full_text"].str.strip().ne("") & df["summary"].str.strip().ne("")]

        # Quality filter
        df = df[df.apply(_is_valid, axis=1)].reset_index(drop=True)

        # Shuffle
        df = df.sample(frac=1, random_state=42).reset_index(drop=True)

        df.to_csv(output_path, index=False, encoding="utf-8-sig")

        print(f"✅ تمت المعالجة: {before} → {len(df)} صف صالح")
        print(f"💾 محفوظ في: {os.path.abspath(output_path)}")
        return df

    except Exception as exc:
        print(f"❌ خطأ: {exc}")
        return None


if __name__ == "__main__":
    load_and_prepare()
