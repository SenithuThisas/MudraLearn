"""Named constants for the Practice Tier → Level → Batch path.

Tune these after real usage — do not scatter magic numbers in routers.
"""

from __future__ import annotations

# ── Capture / model (must match training) ────────────────────────────────────
SEQUENCE_LEN = 60
FEATURES_PER_FRAME = 126

# ── Verdict thresholds (same as existing predict._get_feedback) ───────────────
GREAT_CONFIDENCE = 0.85
OKAY_CONFIDENCE = 0.60

# ── Curriculum shape ──────────────────────────────────────────────────────────
SIGNS_PER_BATCH = 5
CHALLENGE_PASS_CORRECT = 3  # ≥3/5 completes the batch
MAX_SAME_CATEGORY_PER_BATCH = 2  # mix Dictionary categories inside a batch
AUTO_HINT_STREAK = 2  # consecutive near-miss or low-confidence Practice attempts

# ── XP ────────────────────────────────────────────────────────────────────────
BASE_XP_OFFSET = 10
BASE_XP_PER_LEVEL = 2  # base_xp = OFFSET + PER_LEVEL * (level_number - 1)
GREAT_XP_FRACTION = 1.0
OKAY_XP_FRACTION = 0.70
HINT_XP = 0
RETRY_XP = 0
BATCH_FIRST_PASS_XP = 25
PERFECT_BATCH_XP = 15
NEEDS_REVIEW_PASS_XP = 10
DAILY_STREAK_XP = 5

XP_REASON_SIGN = "sign_xp"
XP_REASON_BATCH_FIRST_PASS = "batch_first_pass"
XP_REASON_PERFECT_BATCH = "perfect_batch"
XP_REASON_NEEDS_REVIEW_PASS = "needs_review_pass"
XP_REASON_STREAK_DAILY = "streak_daily"

# ── Batch progress statuses ───────────────────────────────────────────────────
STATUS_LOCKED = "locked"
STATUS_IN_PROGRESS = "in_progress"
STATUS_NEEDS_REVIEW = "needs_review"
STATUS_COMPLETED = "completed"

# ── Tiers: (tier_number, level_from, level_to_inclusive | None, label) ────────
TIER_BANDS: list[tuple[int, int, int | None, str]] = [
    (1, 1, 10, "Novice"),
    (2, 11, 20, "Learner"),
    (3, 21, 30, "Skilled"),
    (4, 31, 40, "Advanced"),
    (5, 41, None, "Master"),
]


def tier_for_level(level_number: int) -> tuple[int, str]:
    """Return (tier_number, label) for a 1-based level/batch index."""
    for number, start, end, label in TIER_BANDS:
        if level_number < start:
            continue
        if end is None or level_number <= end:
            return number, label
    return TIER_BANDS[0][0], TIER_BANDS[0][3]
