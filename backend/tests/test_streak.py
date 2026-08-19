"""Unit tests for UTC streak current/longest/practiced-today math."""

from __future__ import annotations

import unittest
from datetime import date, timedelta

from app.services.progress_filters import compute_streak_stats


class ComputeStreakStatsTests(unittest.TestCase):
    def test_empty_history(self) -> None:
        today = date(2026, 8, 19)
        result = compute_streak_stats(set(), today)
        self.assertEqual(result["current_streak"], 0)
        self.assertEqual(result["longest_streak"], 0)
        self.assertFalse(result["practiced_today"])

    def test_practiced_today_only(self) -> None:
        today = date(2026, 8, 19)
        result = compute_streak_stats({today}, today)
        self.assertEqual(result["current_streak"], 1)
        self.assertEqual(result["longest_streak"], 1)
        self.assertTrue(result["practiced_today"])

    def test_alive_streak_when_not_practiced_today_yet(self) -> None:
        today = date(2026, 8, 19)
        yesterday = today - timedelta(days=1)
        day_before = today - timedelta(days=2)
        result = compute_streak_stats({yesterday, day_before}, today)
        self.assertEqual(result["current_streak"], 2)
        self.assertEqual(result["longest_streak"], 2)
        self.assertFalse(result["practiced_today"])

    def test_broken_streak_after_missed_day(self) -> None:
        today = date(2026, 8, 19)
        two_days_ago = today - timedelta(days=2)
        result = compute_streak_stats({two_days_ago}, today)
        self.assertEqual(result["current_streak"], 0)
        self.assertEqual(result["longest_streak"], 1)
        self.assertFalse(result["practiced_today"])

    def test_longest_exceeds_current_after_gap(self) -> None:
        today = date(2026, 8, 19)
        days = {
            today,
            today - timedelta(days=1),
            date(2026, 8, 1),
            date(2026, 8, 2),
            date(2026, 8, 3),
            date(2026, 8, 4),
        }
        result = compute_streak_stats(days, today)
        self.assertEqual(result["current_streak"], 2)
        self.assertEqual(result["longest_streak"], 4)
        self.assertTrue(result["practiced_today"])


if __name__ == "__main__":
    unittest.main()
