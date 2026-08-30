"""XP and Challenge eligibility rules — pure functions, no I/O."""

from __future__ import annotations

from app.services.curriculum_config import (
    BASE_XP_OFFSET,
    BASE_XP_PER_LEVEL,
    BATCH_FIRST_PASS_XP,
    CHALLENGE_PASS_CORRECT,
    GREAT_CONFIDENCE,
    GREAT_XP_FRACTION,
    HINT_XP,
    NEEDS_REVIEW_PASS_XP,
    OKAY_CONFIDENCE,
    OKAY_XP_FRACTION,
    PERFECT_BATCH_XP,
    RETRY_XP,
    SIGNS_PER_BATCH,
    XP_REASON_BATCH_FIRST_PASS,
    XP_REASON_NEEDS_REVIEW_PASS,
    XP_REASON_PERFECT_BATCH,
    XP_REASON_SIGN,
)


def base_xp(level_number: int) -> int:
    if level_number < 1:
        raise ValueError("level_number must be >= 1")
    return BASE_XP_OFFSET + BASE_XP_PER_LEVEL * (level_number - 1)


def sign_xp(verdict: str, hint_used: bool, level_number: int) -> int:
    """XP for one scored Challenge attempt."""
    if hint_used:
        return HINT_XP
    if verdict == "great":
        return round(base_xp(level_number) * GREAT_XP_FRACTION)
    if verdict == "okay":
        return round(base_xp(level_number) * OKAY_XP_FRACTION)
    return RETRY_XP


def batch_completed(correct_count: int) -> bool:
    return correct_count >= CHALLENGE_PASS_CORRECT


def batch_bonus_entries(
    correct_count: int,
    hints_used: int,
    is_needs_review_pass: bool,
) -> list[tuple[str, int]]:
    """Named XP ledger rows for finishing a Challenge pass. Empty if the batch failed."""
    if not batch_completed(correct_count):
        return []
    if is_needs_review_pass:
        return [(XP_REASON_NEEDS_REVIEW_PASS, NEEDS_REVIEW_PASS_XP)]
    entries = [(XP_REASON_BATCH_FIRST_PASS, BATCH_FIRST_PASS_XP)]
    if correct_count == SIGNS_PER_BATCH and hints_used == 0:
        entries.append((XP_REASON_PERFECT_BATCH, PERFECT_BATCH_XP))
    return entries


CORRECT_VERDICTS = frozenset({"great", "okay"})


def score_challenge_results(results: dict) -> tuple[int, int]:
    """Return (correct_count, hint_count) for a Challenge results map."""
    correct = sum(1 for r in results.values() if r.get("verdict") in CORRECT_VERDICTS)
    hints = sum(1 for r in results.values() if r.get("hint_used"))
    return correct, hints


def verdict_for(confidence: float, correct: bool) -> str:
    if correct and confidence >= GREAT_CONFIDENCE:
        return "great"
    if correct and confidence >= OKAY_CONFIDENCE:
        return "okay"
    return "retry"


def can_challenge_sign(*, gate_passed: bool, assigned_to_batch: bool) -> bool:
    """Graded Challenge is only for gate-passed signs that sit in a seeded batch."""
    return gate_passed and assigned_to_batch


def sign_xp_reason() -> str:
    return XP_REASON_SIGN
