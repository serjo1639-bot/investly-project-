"""
evaluator.py — Investly Summarizer
تقييم جودة الملخصات بطريقتين:
  1. ROUGE-L  — مقياس علمي معياري
  2. Field Score — استخراج الحقول الاستثمارية الأساسية
"""

import sys
import re

sys.stdout.reconfigure(encoding="utf-8")

# ── ROUGE-L (اختياري — يتطلب rouge-score) ──────────────────────
try:
    from rouge_score import rouge_scorer as _rs
    _ROUGE_AVAILABLE = True
except ImportError:
    _ROUGE_AVAILABLE = False


# ══════════════════════════════════════════════════════════════
# 1. ROUGE-L
# ══════════════════════════════════════════════════════════════

def compute_rouge(reference: str, prediction: str) -> dict:
    """
    يحسب ROUGE-1, ROUGE-2, ROUGE-L بين ملخص مرجعي وملخص مُولَّد.

    المدخلات
    --------
    reference  : الملخص الصحيح (المرجعي)
    prediction : الملخص المُولَّد من النموذج

    المخرجات
    --------
    dict يحتوي على:
        rouge1, rouge2, rougeL  (float 0–1)
        available               (bool) — هل المكتبة مثبّتة؟
    """
    if not _ROUGE_AVAILABLE:
        return {
            "rouge1": None, "rouge2": None, "rougeL": None,
            "available": False,
            "error": "rouge-score غير مثبّت. شغّل: pip install rouge-score"
        }

    scorer = _rs.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=False)
    s = scorer.score(reference.strip(), prediction.strip())
    return {
        "rouge1":    round(s["rouge1"].fmeasure,  4),
        "rouge2":    round(s["rouge2"].fmeasure,  4),
        "rougeL":    round(s["rougeL"].fmeasure,  4),
        "available": True,
    }


def rouge_label(score: float) -> tuple[str, str]:
    """يُرجع (وصف نصي، لون hex) بناءً على درجة ROUGE-L."""
    if score >= 0.50: return "ممتاز",  "#10b981"
    if score >= 0.35: return "جيد",    "#3b82f6"
    if score >= 0.20: return "مقبول",  "#f59e0b"
    return                    "ضعيف",  "#ef4444"


# ══════════════════════════════════════════════════════════════
# 2. Field Score — استخراج الحقول الاستثمارية
# ══════════════════════════════════════════════════════════════

# الأنماط (regex) لكل حقل
_FIELDS = {
    "الميزانية":      (r"\d+\s*(?:(?:مليون|ألف|مليار)(?:\s*(?:دينار|ليبي|دولار|د\.ل))?|دينار|د\.ل|م\.د)", 2.0),
    "العائد (ROI)":   (r"\d+[\.,]?\d*\s*%", 1.5),
    "فرص العمل":      (r"\d+\s*(فرصة|وظيفة|منصب)", 1.5),
    "مدة التنفيذ":    (r"\d+\s*(سنة|سنوات|شهر|أشهر|عام|أعوام)", 1.0),
    "القطاع":         (r"(طاقة|عقار|زراع|تعليم|صح|ذكاء|لوجست|تجار|سياح|صناع|رقمي|دواء|استشار|مالي|تقن|معلوم|تجزئ|نقل|مواصل)", 1.0),
    "المنطقة":        (r"(طرابلس|بنغازي|مصراتة|سبها|الزاوية|الخمس|درنة|البيضاء|سرت|طبرق|غريان|زوارة|ترهونة|يفرن|الكفرة)", 1.0),
    "التمويل":        (r"(تمويل|قرض|شراكة|ذاتي|مختلط|مصرف)", 0.8),
    "مستوى المخاطر":  (r"(مخاطر|مخاطرة).{0,15}(منخفض|متوسط|مرتفع|عال)", 0.8),
}

_MAX_WEIGHT = sum(w for _, w in _FIELDS.values())


def compute_field_score(summary: str) -> dict:
    """
    يفحص الملخص ويتحقق من وجود الحقول الاستثمارية الأساسية.

    المخرجات
    --------
    dict يحتوي على:
        fields   : {اسم_الحقل: {"found": bool, "match": str|None, "weight": float}}
        score    : درجة مئوية 0–100
        found    : عدد الحقول الموجودة
        total    : إجمالي الحقول
    """
    results = {}
    weighted_found = 0.0

    for field, (pattern, weight) in _FIELDS.items():
        m = re.search(pattern, summary, re.IGNORECASE)
        found = m is not None
        results[field] = {
            "found":  found,
            "match":  m.group(0) if found else None,
            "weight": weight,
        }
        if found:
            weighted_found += weight

    score = round((weighted_found / _MAX_WEIGHT) * 100, 1)
    found_count = sum(1 for v in results.values() if v["found"])

    return {
        "fields": results,
        "score":  score,
        "found":  found_count,
        "total":  len(_FIELDS),
    }


def field_label(score: float) -> tuple[str, str]:
    """يُرجع (وصف، لون) بناءً على نسبة الحقول المستخرجة."""
    if score >= 80: return "ممتاز",  "#10b981"
    if score >= 60: return "جيد",    "#3b82f6"
    if score >= 40: return "مقبول",  "#f59e0b"
    return                  "ضعيف",  "#ef4444"


# ══════════════════════════════════════════════════════════════
# 3. التقييم الشامل
# ══════════════════════════════════════════════════════════════

def evaluate(summary: str, reference: str = "") -> dict:
    """
    يُشغّل كلا التقييمين ويُرجع نتيجة موحّدة.

    المدخلات
    --------
    summary   : الملخص المُولَّد من النموذج (مطلوب)
    reference : الملخص المرجعي الصحيح (اختياري — لحساب ROUGE)
    """
    field  = compute_field_score(summary)
    rouge  = compute_rouge(reference, summary) if reference.strip() else None

    # الدرجة الكلية = field_score + rouge_L (إن توفّر) بأوزان متساوية
    if rouge and rouge.get("available") and rouge.get("rougeL") is not None:
        overall = round((field["score"] + rouge["rougeL"] * 100) / 2, 1)
    else:
        overall = field["score"]

    return {
        "field":   field,
        "rouge":   rouge,
        "overall": overall,
    }


# ══════════════════════════════════════════════════════════════
# CLI test
# ══════════════════════════════════════════════════════════════
if __name__ == "__main__":
    sample_summary = (
        "مشروع مجموعة الأفق (الطاقة المتجددة) في طرابلس. "
        "التكلفة: 250 مليون دينار | التمويل: شراكة استثمارية | المدة: 5 سنوات. "
        "العائد: 18% | الوظائف: 1200 فرصة | المخاطر: متوسطة."
    )
    sample_ref = (
        "مشروع الأفق للطاقة المتجددة بطرابلس بتكلفة 250 مليون دينار "
        "ومدة 5 سنوات وعائد 18% وفرص عمل 1200 ومخاطر متوسطة."
    )

    result = evaluate(sample_summary, sample_ref)

    print("\n── Field Score ─────────────────")
    for name, v in result["field"]["fields"].items():
        icon = "✅" if v["found"] else "❌"
        match = f'← "{v["match"]}"' if v["match"] else ""
        print(f"  {icon} {name:20s} {match}")
    print(f"\n  الدرجة: {result['field']['score']}% ({result['field']['found']}/{result['field']['total']} حقول)")

    if result["rouge"]:
        r = result["rouge"]
        print(f"\n── ROUGE ────────────────────────")
        print(f"  ROUGE-1 : {r['rouge1']:.3f}")
        print(f"  ROUGE-2 : {r['rouge2']:.3f}")
        print(f"  ROUGE-L : {r['rougeL']:.3f}")

    print(f"\n  الدرجة الكلية: {result['overall']}%")
