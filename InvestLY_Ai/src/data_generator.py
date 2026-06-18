"""
data_generator.py — Investly Summarizer
Generates a rich, diverse Arabic investment dataset (5 000 samples by default).
"""

import sys
import os
import random
import pandas as pd

sys.stdout.reconfigure(encoding="utf-8")

from config import RAW_DATA_PATH, DATA_DIR, DEFAULT_SAMPLE_COUNT

# ──────────────────────────────────────────────────────────────
# Reference tables
# ──────────────────────────────────────────────────────────────
SECTORS = [
    "الطاقة المتجددة", "العقارات التجارية", "الزراعة الحديثة",
    "تكنولوجيا التعليم", "الرعاية الصحية", "الذكاء الاصطناعي",
    "الخدمات اللوجستية", "التجارة الإلكترونية", "السياحة البيئية",
    "التصنيع الغذائي", "البنية التحتية الرقمية", "الاستشارات المالية",
    "صناعة الدواء", "الطاقة الشمسية", "تقنية المعلومات",
    "التجزئة الحديثة", "النقل والمواصلات", "الصناعات الخفيفة",
]

REGIONS = [
    "طرابلس", "بنغازي", "مصراتة", "سبها", "الزاوية",
    "الخمس", "درنة", "البيضاء", "سرت", "زوارة",
    "طبرق", "غريان", "ترهونة", "يفرن", "الكفرة",
]

COMPANY_PREFIXES = [
    "شركة الأفق", "مجموعة الريادة", "شركة الإنماء",
    "مؤسسة النور", "شركة الساحل", "شركة الواحة",
    "مجموعة التطوير", "ائتلاف المستثمرين", "شركة المدى",
    "مجموعة الفجر", "مؤسسة الرواد", "شركة البناء والتنمية",
]

RISK_LEVELS = ["منخفضة", "متوسطة", "مرتفعة"]
FINANCING   = ["تمويل ذاتي", "قرض مصرفي", "شراكة استثمارية", "تمويل مختلط"]

# ──────────────────────────────────────────────────────────────
# Noise sentences (irrelevant to financial summary)
# ──────────────────────────────────────────────────────────────
NOISE_POOL = [
    "تأسست الشركة المنفذة عام 2010 ولديها خبرة واسعة في هذا المجال.",
    "عُقدت عدة اجتماعات مع الجهات الحكومية لضمان توافق المشروع مع اللوائح التنفيذية.",
    "يؤكد الخبراء الاقتصاديون أن هذا التوجه يتماشى مع التطورات العالمية الحديثة.",
    "شارك في إعداد دراسة الجدوى فريق متكامل من المهندسين والمستشارين الماليين والقانونيين.",
    "تعاني المنطقة من نقص ملحوظ في الاستثمارات المماثلة منذ سنوات بسبب الظروف المحيطة.",
    "سيتم الاعتماد على موردين محليين لدعم عجلة الاقتصاد الوطني.",
    "تم تخصيص مساحة أرض مناسبة بعد مفاوضات مع الملاك.",
    "المشروع سيراعي كافة المعايير البيئية الدولية.",
    "أُجريت دراسات السوق على مدى ستة أشهر متواصلة قبل صياغة الخطة النهائية.",
    "تتوافر البنية التحتية اللازمة في المنطقة المستهدفة مما يُقلل تكاليف التأسيس.",
    "ستُستخدم أحدث التقنيات العالمية في تنفيذ هذا المشروع لضمان أعلى مستويات الجودة.",
    "يتوقع المحللون أن يكون للمشروع أثر إيجابي واضح على المستوى الاجتماعي والثقافي.",
    "وقّعت الجهة المنفذة عدة مذكرات تفاهم مع جهات دولية متخصصة في هذا القطاع.",
    "ستخضع جميع مراحل التنفيذ لرقابة دورية من قِبل مكاتب تدقيق محايدة معتمدة.",
    "يُعدّ هذا المشروع امتداداً طبيعياً لاستراتيجية التنويع الاقتصادي الوطنية الشاملة.",
]


def _noise_block() -> str:
    """Return 1–3 noise sentences joined into a paragraph."""
    return " " + " ".join(random.sample(NOISE_POOL, random.randint(1, 3))) + " "


def _maybe_noise() -> str:
    """Return a noise block with ~70% probability, empty string otherwise."""
    return _noise_block() if random.random() < 0.7 else ""


# ──────────────────────────────────────────────────────────────
# Full-text templates
# ──────────────────────────────────────────────────────────────
def _intro(name: str, region: str, sector: str) -> str:
    templates = [
        f"يقترح فريق العمل إطلاق {name} في مدينة {region}، يندرج ضمن قطاع {sector} الواعد.",
        f"تشهد {region} نمواً اقتصادياً ملحوظاً، ومن هنا انبثقت فكرة إطلاق {name} في قطاع {sector}.",
        f"استجابةً للطلب المتزايد في {region}، أُعدّت خطة عمل شاملة لتنفيذ {name} المتخصص في {sector}.",
        f"في خطوة طموحة لتطوير {sector}، أعلنت جهات استثمارية عن إطلاق {name} في {region}.",
        f"تُقدّم هذه الوثيقة دراسة الجدوى الكاملة لمشروع {name} في {region} ضمن قطاع {sector}.",
    ]
    return random.choice(templates)


def _financials(budget: int, duration: int, financing: str) -> str:
    templates = [
        f"تبلغ الميزانية التقديرية {budget} مليون دينار ليبي بمدة تنفيذ {duration} {'سنة' if duration == 1 else 'سنوات'}. آلية التمويل: {financing}.",
        f"رُصد مبلغ {budget} مليون دينار لتغطية تكاليف التأسيس والتشغيل على مدى {duration} {'سنة' if duration == 1 else 'سنوات'}، عبر {financing}.",
        f"تُقدَّر التكلفة الإجمالية بـ{budget} مليون دينار بمدة إنجاز {duration} {'سنة' if duration == 1 else 'سنوات'} ({financing}).",
        f"يستوجب المشروع استثماراً يبلغ {budget} مليون دينار، يُموَّل عبر {financing}، ويُنجز خلال {duration} {'سنة' if duration == 1 else 'سنوات'}.",
    ]
    return random.choice(templates)


def _impact(roi: float, jobs: int, risk: str) -> str:
    templates = [
        f"يستهدف المشروع عائداً استثمارياً (ROI) بنسبة {roi}% سنوياً مع توفير {jobs} فرصة عمل. مستوى المخاطرة: {risk}.",
        f"من المتوقع تحقيق أرباح سنوية {roi}% وخلق {jobs} وظيفة. تُصنَّف درجة المخاطر بأنها {risk}.",
        f"اقتصادياً، سيوفر المشروع {jobs} وظيفة مع عائد {roi}% سنوياً. المخاطر المقدّرة: {risk}.",
        f"يُسهم المشروع في تقليل البطالة بتوفير {jobs} فرصة عمل، ويحقق عائداً {roi}% مع مخاطر {risk}.",
    ]
    return random.choice(templates)


def _generate_full_text(name, sector, region, budget, roi, duration, jobs, financing, risk) -> str:
    parts = [
        _maybe_noise(),                          # optional leading noise
        _intro(name, region, sector),
        _maybe_noise(),
    ]

    # Sometimes omit a field block to add variety (model should learn to handle this)
    if budget is not None and financing is not None and duration is not None:
        parts.append(_financials(budget, duration, financing))
        parts.append(_maybe_noise())
    if roi is not None and jobs is not None and risk is not None:
        parts.append(_impact(roi, jobs, risk))
        parts.append(_maybe_noise())

    # Shuffle core paragraphs (keep intro first, but randomise financial + impact order)
    core_start = 3  # after leading noise, intro, noise
    core_parts = parts[core_start:]
    if random.random() > 0.4:
        random.shuffle(core_parts)
    parts = parts[:core_start] + core_parts

    return " ".join(parts).replace("  ", " ").strip()


# ──────────────────────────────────────────────────────────────
# Summary templates (ground truth)
# ──────────────────────────────────────────────────────────────
def _generate_summary(name, sector, region, budget, roi, duration, jobs, financing, risk) -> str:
    # Build list of available blocks
    intro = f"مشروع {name} في {region} ({sector})."
    
    # Financial details block - must match the block-level logic of _generate_full_text
    financials_str = ""
    if budget is not None and financing is not None and duration is not None:
        financial_parts = [
            f"التكلفة: {budget} مليون دينار",
            f"التمويل: {financing}",
            f"المدة: {duration} {'سنة' if duration == 1 else 'سنوات'}"
        ]
        financials_str = " | ".join(financial_parts)

    # Impact details block - must match the block-level logic of _generate_full_text
    impact_str = ""
    if roi is not None and jobs is not None and risk is not None:
        impact_parts = [
            f"العائد: {roi}%",
            f"الوظائف: {jobs}",
            f"المخاطر: {risk}"
        ]
        impact_str = " | ".join(impact_parts)

    summary_parts = [intro]
    if financials_str:
        summary_parts.append(financials_str)
    if impact_str:
        summary_parts.append(impact_str)

    # Let's support two styles dynamically to simulate natural diversity
    style = random.randint(1, 2)
    if style == 1:
        # Standard pipe-separated blocks
        return " | ".join(summary_parts).strip()
    else:
        # Sentence style
        sentence = f"يهدف {name} إلى تطوير قطاع {sector} في {region}."
        f_details = []
        if budget is not None and financing is not None and duration is not None:
            f_details.append(f"بتكلفة {budget} مليون دينار")
            f_details.append(f"عبر {financing}")
            f_details.append(f"لمدة {duration} {'سنة' if duration == 1 else 'سنوات'}")
        
        i_details = []
        if roi is not None and jobs is not None and risk is not None:
            i_details.append(f"توفير {jobs} وظيفة")
            i_details.append(f"تحقيق {roi}% عائداً سنوياً")
            i_details.append(f"بمخاطر {risk}")

        if f_details:
            sentence += " " + " ".join(f_details) + "."
        if i_details:
            sentence += " يهدف المشروع إلى " + " و".join(i_details) + "."
        
        # Clean double spaces
        while "  " in sentence:
            sentence = sentence.replace("  ", " ")
        return sentence.strip()


# ──────────────────────────────────────────────────────────────
# Main generator
# ──────────────────────────────────────────────────────────────
def generate_dataset(n: int = DEFAULT_SAMPLE_COUNT, output_path: str = None) -> None:
    output_path = output_path or str(RAW_DATA_PATH)
    os.makedirs(str(DATA_DIR), exist_ok=True)
    rows = []

    for i in range(n):
        sector   = random.choice(SECTORS)
        region   = random.choice(REGIONS)
        prefix   = random.choice(COMPANY_PREFIXES)
        name     = f"مشروع {prefix} ({sector}) رقم {i + 1}"
        budget   = random.randint(5, 600)
        roi      = round(random.uniform(7.0, 40.0), 1)
        duration = random.randint(1, 12)
        jobs     = random.randint(20, 3000)
        financing= random.choice(FINANCING)
        risk     = random.choice(RISK_LEVELS)

        # ~10% of samples omit some fields (teach the model to handle incomplete data)
        omit = random.random() < 0.10
        ft_budget    = None if omit and random.random() < 0.5 else budget
        ft_roi       = None if omit and random.random() < 0.5 else roi
        ft_jobs      = None if omit and random.random() < 0.5 else jobs
        ft_financing = None if omit and random.random() < 0.5 else financing
        ft_duration  = None if omit and random.random() < 0.5 else duration
        ft_risk      = None if omit and random.random() < 0.5 else risk

        rows.append({
            "full_text": _generate_full_text(name, sector, region, ft_budget, ft_roi, ft_duration, ft_jobs, ft_financing, ft_risk),
            "summary":   _generate_summary(name, sector, region, ft_budget, ft_roi, ft_duration, ft_jobs, ft_financing, ft_risk),
        })

    df = pd.DataFrame(rows)
    df.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"✅ تم إنشاء {n} عينة وحفظها في: {os.path.abspath(output_path)}")


if __name__ == "__main__":
    generate_dataset()

