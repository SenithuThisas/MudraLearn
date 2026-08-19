"""Shared rules for which predict attempts count as scored practice."""

from __future__ import annotations

from datetime import date, timedelta

FREE_FORM_SIGN_ID = "unknown"
FREE_FORM_CATEGORY = "free"


def is_free_form(target_sign: str, category: str) -> bool:
    """True for Translate / untargeted recordings that must not affect progress."""
    return (
        target_sign.strip().lower() == FREE_FORM_SIGN_ID
        or category.strip().lower() == FREE_FORM_CATEGORY
    )


def compute_streak_stats(days: set[date], today: date) -> dict:
    """Pure streak math — current run, longest run, and whether today is in the set."""
    practiced_today = today in days
    cursor = today if practiced_today else today - timedelta(days=1)
    current_streak = 0
    if cursor in days:
        while cursor in days:
            current_streak += 1
            cursor -= timedelta(days=1)

    longest_streak = 0
    if days:
        ordered = sorted(days)
        run = 1
        longest_streak = 1
        for prev, nxt in zip(ordered, ordered[1:]):
            if nxt == prev + timedelta(days=1):
                run += 1
                longest_streak = max(longest_streak, run)
            else:
                run = 1

    return {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "practiced_today": practiced_today,
    }
