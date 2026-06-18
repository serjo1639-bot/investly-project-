"""
config.py — Investly Summarizer
Centralised paths and constants shared across all modules.
"""

from pathlib import Path

# ── Project root (one level above src/) ─────────────────────────
ROOT_DIR = Path(__file__).resolve().parent.parent

# ── Data paths ──────────────────────────────────────────────────
DATA_DIR            = ROOT_DIR / "data"
RAW_DATA_PATH       = DATA_DIR / "raw_data.csv"
PROCESSED_DATA_PATH = DATA_DIR / "processed_data.csv"

# ── Model paths ─────────────────────────────────────────────────
MODELS_DIR      = ROOT_DIR / "models"
MODEL_SAVE_PATH = MODELS_DIR / "summarizer_model"

# ── HuggingFace model identifier ────────────────────────────────
HF_MODEL_NAME = r"D:\Programming Projects\Pycharm-Projects\Investly_Ai\models\AraT5v2-base-1024"
# ── Training hyper-parameters ───────────────────────────────────
MAX_INPUT_TOKENS  = 512     # model supports up to 1024
MAX_TARGET_TOKENS = 128

TRAIN_EPOCHS       = 3
TRAIN_BATCH_SIZE   = 1
GRAD_ACCUMULATION  = 4
LEARNING_RATE      = 5e-5
WARMUP_RATIO       = 0.06
WEIGHT_DECAY       = 0.01

# ── Data generation ─────────────────────────────────────────────
DEFAULT_SAMPLE_COUNT = 5_000
