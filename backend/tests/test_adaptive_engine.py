"""Unit tests for AdaptiveEngine: cold-start category balance, weighted-pool
floor, and the curriculum-complete terminal state."""

from __future__ import annotations

import unittest
from collections import Counter
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

from app.models.progress import MasteryScore
from app.services import adaptive_engine
from app.services.mastery_engine import TIER_ATTEMPT_THRESHOLD, TIER_SCORE_THRESHOLD


def _mastery(sign_id: str, score: float, attempts: int = 5, days_ago: int = 0) -> MasteryScore:
    return MasteryScore(
        user_id="u1",
        sign_id=sign_id,
        score=score,
        attempts=attempts,
        last_seen=datetime.utcnow() - timedelta(days=days_ago),
        tier_unlocked=1,
    )


class StarterPoolTests(unittest.TestCase):
    def test_starter_pool_is_fixed_size(self) -> None:
        self.assertEqual(len(adaptive_engine.STARTER_POOL), adaptive_engine.STARTER_SIGN_COUNT)

    def test_starter_pool_touches_multiple_categories(self) -> None:
        categories = {s["category"] for s in adaptive_engine.STARTER_POOL}
        self.assertGreater(len(categories), 1, "cold-start pool should not be a single category")

    def test_starter_pool_is_round_robin_not_flat_slice(self) -> None:
        # The old flat-slice bug served STARTER_SIGN_COUNT copies of whichever
        # category sorts first in signs_data.json (all "Adjectives"). A
        # round-robin pool must never let one category dominate like that.
        counts = Counter(s["category"] for s in adaptive_engine.STARTER_POOL)
        self.assertLess(max(counts.values()), adaptive_engine.STARTER_SIGN_COUNT)


class ColdStartTests(unittest.TestCase):
    def test_first_call_returns_a_starter_pool_sign(self) -> None:
        response = adaptive_engine._cold_start([])
        self.assertEqual(response["mode"], "cold_start")
        starter_names = {s["name"] for s in adaptive_engine.STARTER_POOL}
        self.assertIn(response["sign"], starter_names)

    def test_skips_already_seen_starter_signs(self) -> None:
        seen = adaptive_engine.STARTER_POOL[0]["name"]
        rows = [_mastery(seen, score=0.5, attempts=1)]
        response = adaptive_engine._cold_start(rows)
        self.assertNotEqual(response["sign"], seen)


class AdaptiveWeightFloorTests(unittest.TestCase):
    def test_fully_mastered_recent_sign_still_has_nonzero_weight(self) -> None:
        # score=1.0, days_since=0 -> raw weight = 0.0. Without the
        # `max(weight, 0.05)` floor, random.choices would raise
        # "Total of weights must be greater than zero" for a single candidate
        # whose only weight is 0.0 -- so this test fails loudly if the floor
        # is ever removed, rather than silently.
        # Use a real catalogue name so _SIGN_BY_NAME lookup succeeds.
        real_sign = adaptive_engine.ALL_SIGNS[0]["name"]  # e.g. "Bad"
        rows = [_mastery(real_sign, score=1.0, attempts=10, days_ago=0)]
        with patch("app.services.adaptive_engine.random.random", return_value=0.99):
            response = adaptive_engine._adaptive(rows)
        self.assertEqual(response["sign"], real_sign)
        self.assertEqual(response["mode"], "review")

    def test_low_mastery_sign_outweighs_high_mastery_sign(self) -> None:
        # Use real catalogue names so _SIGN_BY_NAME lookup succeeds and the
        # fallback random.choice path is never taken.
        weak_sign   = adaptive_engine.ALL_SIGNS[0]["name"]  # e.g. "Bad"
        strong_sign = adaptive_engine.ALL_SIGNS[1]["name"]  # e.g. "Beautiful"
        rows = [
            _mastery(weak_sign,   score=0.1, attempts=5,  days_ago=0),
            _mastery(strong_sign, score=1.0, attempts=10, days_ago=0),
        ]
        with patch("app.services.adaptive_engine.random.random", return_value=0.99):
            picks = Counter(adaptive_engine._adaptive(rows)["sign"] for _ in range(500))
        self.assertGreater(picks[weak_sign], picks[strong_sign])


class CurriculumCompleteTests(unittest.TestCase):
    def test_incomplete_when_rows_are_missing(self) -> None:
        rows = [
            _mastery(s["name"], score=1.0, attempts=10)
            for s in adaptive_engine.ALL_SIGNS[:-1]
        ]
        self.assertFalse(adaptive_engine._is_curriculum_complete(rows))

    def test_incomplete_when_any_score_below_threshold(self) -> None:
        rows = [
            _mastery(s["name"], score=TIER_SCORE_THRESHOLD, attempts=TIER_ATTEMPT_THRESHOLD)
            for s in adaptive_engine.ALL_SIGNS
        ]
        rows[0].score = TIER_SCORE_THRESHOLD - 0.01
        self.assertFalse(adaptive_engine._is_curriculum_complete(rows))

    def test_incomplete_when_any_attempts_below_threshold(self) -> None:
        rows = [
            _mastery(s["name"], score=TIER_SCORE_THRESHOLD, attempts=TIER_ATTEMPT_THRESHOLD)
            for s in adaptive_engine.ALL_SIGNS
        ]
        rows[0].attempts = TIER_ATTEMPT_THRESHOLD - 1
        self.assertFalse(adaptive_engine._is_curriculum_complete(rows))

    def test_complete_when_every_sign_meets_the_bar(self) -> None:
        rows = [
            _mastery(s["name"], score=TIER_SCORE_THRESHOLD, attempts=TIER_ATTEMPT_THRESHOLD)
            for s in adaptive_engine.ALL_SIGNS
        ]
        self.assertTrue(adaptive_engine._is_curriculum_complete(rows))

    def test_no_second_locally_defined_mastery_bar(self) -> None:
        # Guard against reintroducing a second "mastery" definition (e.g. a
        # MASTERY_COMPLETE_THRESHOLD constant) -- adaptive_engine must import
        # and reuse mastery_engine's own threshold, not redefine the number.
        self.assertFalse(hasattr(adaptive_engine, "MASTERY_COMPLETE_THRESHOLD"))
        self.assertIs(adaptive_engine.TIER_SCORE_THRESHOLD, TIER_SCORE_THRESHOLD)
        self.assertIs(adaptive_engine.TIER_ATTEMPT_THRESHOLD, TIER_ATTEMPT_THRESHOLD)


class GetNextSignCompleteWiringTests(unittest.TestCase):
    def test_get_next_sign_returns_complete_payload_when_curriculum_finished(self) -> None:
        rows = [
            _mastery(s["name"], score=TIER_SCORE_THRESHOLD, attempts=TIER_ATTEMPT_THRESHOLD)
            for s in adaptive_engine.ALL_SIGNS
        ]
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.all.return_value = rows

        response = adaptive_engine.get_next_sign(mock_db, "u1")

        self.assertEqual(
            response,
            {"sign": None, "category": None, "mode": "complete", "mastery": None},
        )

    def test_get_next_sign_stays_adaptive_when_curriculum_not_finished(self) -> None:
        rows = [
            _mastery(s["name"], score=TIER_SCORE_THRESHOLD, attempts=TIER_ATTEMPT_THRESHOLD)
            for s in adaptive_engine.ALL_SIGNS[:-1]
        ]
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.all.return_value = rows

        response = adaptive_engine.get_next_sign(mock_db, "u1")

        self.assertIn(response["mode"], {"review", "new"})


if __name__ == "__main__":
    unittest.main()
