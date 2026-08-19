"""Practice-mode auto-hint rules — pure functions, no I/O.

Suggest a reference hint after AUTO_HINT_STREAK consecutive attempts where either:
- the target is in top-3 but not top-1, or
- top-1 confidence is below the Okay threshold.
"""

from __future__ import annotations

from app.services.curriculum_config import AUTO_HINT_STREAK, OKAY_CONFIDENCE

KIND_OK = "ok"
KIND_NEAR_MISS = "near_miss"
KIND_LOW_CONF = "low_conf"
KIND_OTHER = "other"

HINT_KINDS = frozenset({KIND_NEAR_MISS, KIND_LOW_CONF})


def classify_practice_attempt(
    target_sign: str,
    top3: list[dict],
    confidence: float,
    okay_confidence: float = OKAY_CONFIDENCE,
) -> str:
    names = [str(row.get("sign", "")) for row in top3]
    top = names[0] if names else ""
    if top == target_sign and confidence >= okay_confidence:
        return KIND_OK
    if target_sign in names[1:]:
        return KIND_NEAR_MISS
    if confidence < okay_confidence:
        return KIND_LOW_CONF
    return KIND_OTHER


def should_auto_hint(history: list[str], streak: int = AUTO_HINT_STREAK) -> bool:
    if streak < 1 or len(history) < streak:
        return False
    window = history[-streak:]
    first = window[0]
    return first in HINT_KINDS and all(kind == first for kind in window)
