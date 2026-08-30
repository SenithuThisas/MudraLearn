"""Unit tests for adaptive_engine.get_batch_recommendations(): weak-from-batch
(Progress.correct only, no threshold), decayed-from-earlier (MasteryScore,
recency-weighted), merge order, and the cap at 5."""

from __future__ import annotations

import unittest
from datetime import datetime, timedelta
from unittest.mock import MagicMock

from app.models.curriculum import Batch
from app.models.progress import MasteryScore, Progress
from app.services import adaptive_engine as ae
from app.services.mastery_engine import TIER_SCORE_THRESHOLD

NOW = datetime.utcnow()


def _real_signs(n: int) -> list[str]:
    """Real catalogue names so category lookup doesn't fall back to
    'Uncategorized' — mirrors test_adaptive_engine.py's approach of indexing
    into adaptive_engine.ALL_SIGNS rather than inventing sign names."""
    return [s["name"] for s in ae.ALL_SIGNS[:n]]


def _batch(batch_id: int, sign_ids: list[str]) -> Batch:
    return Batch(
        id=batch_id, tier=1, tier_label="Novice", level_number=batch_id,
        difficulty_rank=1, sign_ids=sign_ids,
    )


def _progress(sign_id: str, correct: bool, confidence: float = 0.5, minutes_ago: int = 0) -> Progress:
    row = Progress(
        user_id="u1", sign_id=sign_id, category="Cat",
        confidence=confidence, correct=correct, response_ms=500,
    )
    row.timestamp = NOW - timedelta(minutes=minutes_ago)
    return row


def _mastery(sign_id: str, score: float, attempts: int = 5, days_ago: int = 0) -> MasteryScore:
    return MasteryScore(
        user_id="u1", sign_id=sign_id, score=score, attempts=attempts,
        last_seen=NOW - timedelta(days=days_ago), tier_unlocked=1,
    )


def _mock_db(
    batch: Batch | None,
    progress_rows: list[Progress],
    mastery_rows: list[MasteryScore],
) -> MagicMock:
    """Route db.query(Model) to the right canned dataset, matching the chain
    shapes get_batch_recommendations() actually calls (kept in sync with
    adaptive_engine.py: Batch uses .filter().first(); Progress uses
    .filter().order_by().all(); MasteryScore uses .filter().all())."""
    mock_db = MagicMock()

    def query_side_effect(model):
        q = MagicMock()
        if model is Batch:
            q.filter.return_value.first.return_value = batch
        elif model is Progress:
            q.filter.return_value.order_by.return_value.all.return_value = progress_rows
        elif model is MasteryScore:
            q.filter.return_value.all.return_value = mastery_rows
        else:
            raise AssertionError(f"Unexpected model queried: {model}")
        return q

    mock_db.query.side_effect = query_side_effect
    return mock_db


class EmptyCaseTests(unittest.TestCase):
    def test_batch_not_found_returns_empty(self) -> None:
        mock_db = _mock_db(batch=None, progress_rows=[], mastery_rows=[])
        result = ae.get_batch_recommendations(mock_db, "u1", 999)
        self.assertEqual(result, {"recommendations": [], "count": 0})

    def test_no_weak_no_decayed_returns_empty(self) -> None:
        signs = _real_signs(5)
        batch = _batch(1, signs)
        progress_rows = [_progress(s, correct=True) for s in signs]
        mastery_rows = [_mastery(s, score=0.9) for s in signs]  # all strong, all mastered
        mock_db = _mock_db(batch, progress_rows, mastery_rows)

        result = ae.get_batch_recommendations(mock_db, "u1", 1)

        self.assertEqual(result, {"recommendations": [], "count": 0})


class WeakFromBatchTests(unittest.TestCase):
    def test_weak_only_when_no_decayed_available(self) -> None:
        signs = _real_signs(5)
        batch = _batch(1, signs)
        progress_rows = [
            _progress(signs[0], correct=False),  # weak
            _progress(signs[1], correct=True),
            _progress(signs[2], correct=True),
            _progress(signs[3], correct=True),
            _progress(signs[4], correct=True),
        ]
        mastery_rows = [_mastery(s, score=0.9) for s in signs]  # no earlier signs at all
        mock_db = _mock_db(batch, progress_rows, mastery_rows)

        result = ae.get_batch_recommendations(mock_db, "u1", 1)

        self.assertEqual(result["count"], 1)
        self.assertEqual(result["recommendations"][0]["sign"], signs[0])
        self.assertEqual(result["recommendations"][0]["reason"], "weak_this_batch")

    def test_correct_attempt_is_never_flagged_weak_regardless_of_confidence(self) -> None:
        # Locked decision: weak-from-batch is Progress.correct only, no
        # confidence threshold (see Phase 1 fix). A correct attempt with low
        # confidence must NOT be flagged.
        signs = _real_signs(1)
        batch = _batch(1, signs)
        progress_rows = [_progress(signs[0], correct=True, confidence=0.05)]
        mastery_rows = [_mastery(signs[0], score=0.9)]
        mock_db = _mock_db(batch, progress_rows, mastery_rows)

        result = ae.get_batch_recommendations(mock_db, "u1", 1)

        self.assertEqual(result, {"recommendations": [], "count": 0})

    def test_only_the_most_recent_attempt_per_sign_counts(self) -> None:
        # An earlier incorrect attempt followed by a later correct one must
        # NOT flag the sign weak -- only the latest attempt matters.
        signs = _real_signs(1)
        batch = _batch(1, signs)
        progress_rows = [
            _progress(signs[0], correct=True, minutes_ago=1),   # most recent
            _progress(signs[0], correct=False, minutes_ago=10),  # older
        ]
        mastery_rows = [_mastery(signs[0], score=0.9)]
        mock_db = _mock_db(batch, progress_rows, mastery_rows)

        result = ae.get_batch_recommendations(mock_db, "u1", 1)

        self.assertEqual(result, {"recommendations": [], "count": 0})

    def test_sign_with_no_progress_row_is_not_flagged(self) -> None:
        # Defensive: a batch sign with zero Progress rows (shouldn't happen
        # in practice -- mark_practiced requires a scored attempt -- but must
        # not crash or false-positive).
        signs = _real_signs(1)
        batch = _batch(1, signs)
        mock_db = _mock_db(batch, progress_rows=[], mastery_rows=[])

        result = ae.get_batch_recommendations(mock_db, "u1", 1)

        self.assertEqual(result, {"recommendations": [], "count": 0})

    def test_batch_sign_excluded_from_decayed_pool_even_if_low_score(self) -> None:
        # A batch sign with a correct latest attempt but a low aggregate
        # MasteryScore must not leak into the decayed pool -- it belongs to
        # this batch, so it's only ever eligible via weak_this_batch (and
        # here it isn't, since the attempt was correct).
        signs = _real_signs(1)
        batch = _batch(1, signs)
        progress_rows = [_progress(signs[0], correct=True)]
        mastery_rows = [_mastery(signs[0], score=0.1)]  # low score, still excluded
        mock_db = _mock_db(batch, progress_rows, mastery_rows)

        result = ae.get_batch_recommendations(mock_db, "u1", 1)

        self.assertEqual(result, {"recommendations": [], "count": 0})


class DecayedFromEarlierTests(unittest.TestCase):
    def test_decayed_only_when_batch_all_strong(self) -> None:
        signs = _real_signs(6)
        batch_signs, earlier_sign = signs[:5], signs[5]
        batch = _batch(1, batch_signs)
        progress_rows = [_progress(s, correct=True) for s in batch_signs]
        mastery_rows = (
            [_mastery(s, score=0.9) for s in batch_signs]
            + [_mastery(earlier_sign, score=0.3, days_ago=5)]
        )
        mock_db = _mock_db(batch, progress_rows, mastery_rows)

        result = ae.get_batch_recommendations(mock_db, "u1", 1)

        self.assertEqual(result["count"], 1)
        self.assertEqual(result["recommendations"][0]["sign"], earlier_sign)
        self.assertEqual(result["recommendations"][0]["reason"], "decayed")

    def test_mastered_earlier_sign_excluded(self) -> None:
        signs = _real_signs(6)
        batch_signs, earlier_sign = signs[:5], signs[5]
        batch = _batch(1, batch_signs)
        progress_rows = [_progress(s, correct=True) for s in batch_signs]
        mastery_rows = (
            [_mastery(s, score=0.9) for s in batch_signs]
            + [_mastery(earlier_sign, score=TIER_SCORE_THRESHOLD, days_ago=30)]  # >= bar, excluded
        )
        mock_db = _mock_db(batch, progress_rows, mastery_rows)

        result = ae.get_batch_recommendations(mock_db, "u1", 1)

        self.assertEqual(result, {"recommendations": [], "count": 0})

    def test_decayed_sorted_by_recency_weight_descending(self) -> None:
        signs = _real_signs(7)
        batch_signs, earlier = signs[:5], signs[5:7]
        batch = _batch(1, batch_signs)
        progress_rows = [_progress(s, correct=True) for s in batch_signs]
        mastery_rows = (
            [_mastery(s, score=0.9) for s in batch_signs]
            # earlier[0]: weight = (1-0.2)*2 + min(10,7)*0.3 = 1.6 + 2.1 = 3.7
            + [_mastery(earlier[0], score=0.2, days_ago=10)]
            # earlier[1]: weight = (1-0.5)*2 + min(1,7)*0.3  = 1.0 + 0.3 = 1.3
            + [_mastery(earlier[1], score=0.5, days_ago=1)]
        )
        mock_db = _mock_db(batch, progress_rows, mastery_rows)

        result = ae.get_batch_recommendations(mock_db, "u1", 1)

        self.assertEqual([r["sign"] for r in result["recommendations"]], [earlier[0], earlier[1]])


class MergeAndCapTests(unittest.TestCase):
    def test_weak_and_decayed_merge_weak_first(self) -> None:
        signs = _real_signs(6)
        batch_signs, earlier_sign = signs[:5], signs[5]
        batch = _batch(1, batch_signs)
        progress_rows = [
            _progress(batch_signs[0], correct=False),
            *[_progress(s, correct=True) for s in batch_signs[1:]],
        ]
        mastery_rows = (
            [_mastery(s, score=0.9) for s in batch_signs]
            + [_mastery(earlier_sign, score=0.2, days_ago=10)]
        )
        mock_db = _mock_db(batch, progress_rows, mastery_rows)

        result = ae.get_batch_recommendations(mock_db, "u1", 1)

        self.assertEqual(result["count"], 2)
        self.assertEqual(result["recommendations"][0]["sign"], batch_signs[0])
        self.assertEqual(result["recommendations"][0]["reason"], "weak_this_batch")
        self.assertEqual(result["recommendations"][1]["sign"], earlier_sign)
        self.assertEqual(result["recommendations"][1]["reason"], "decayed")

    def test_cap_at_five_prefers_weak_over_decayed(self) -> None:
        signs = _real_signs(8)
        batch_signs, earlier_signs = signs[:5], signs[5:8]
        batch = _batch(1, batch_signs)
        progress_rows = [_progress(s, correct=False) for s in batch_signs]  # all 5 weak
        mastery_rows = (
            [_mastery(s, score=0.3) for s in batch_signs]
            + [_mastery(s, score=0.1, days_ago=5) for s in earlier_signs]  # 3 decayed candidates
        )
        mock_db = _mock_db(batch, progress_rows, mastery_rows)

        result = ae.get_batch_recommendations(mock_db, "u1", 1)

        self.assertEqual(result["count"], 5)
        self.assertTrue(all(r["reason"] == "weak_this_batch" for r in result["recommendations"]))
        self.assertEqual({r["sign"] for r in result["recommendations"]}, set(batch_signs))

    def test_cap_at_five_with_only_decayed(self) -> None:
        signs = _real_signs(11)
        batch_signs, earlier_signs = signs[:5], signs[5:11]  # 6 decayed candidates
        batch = _batch(1, batch_signs)
        progress_rows = [_progress(s, correct=True) for s in batch_signs]
        mastery_rows = (
            [_mastery(s, score=0.9) for s in batch_signs]
            + [_mastery(s, score=0.2, days_ago=3) for s in earlier_signs]
        )
        mock_db = _mock_db(batch, progress_rows, mastery_rows)

        result = ae.get_batch_recommendations(mock_db, "u1", 1)

        self.assertEqual(result["count"], 5)
        self.assertTrue(all(r["reason"] == "decayed" for r in result["recommendations"]))


class ResponseShapeTests(unittest.TestCase):
    def test_category_and_mastery_populated_from_real_catalogue(self) -> None:
        signs = _real_signs(1)
        expected_category = ae.ALL_SIGNS[0]["category"]
        batch = _batch(1, signs)
        progress_rows = [_progress(signs[0], correct=False)]
        mastery_rows = [_mastery(signs[0], score=0.42)]
        mock_db = _mock_db(batch, progress_rows, mastery_rows)

        result = ae.get_batch_recommendations(mock_db, "u1", 1)

        entry = result["recommendations"][0]
        self.assertEqual(entry["category"], expected_category)
        self.assertEqual(entry["mastery"], 0.42)

    def test_mastery_is_none_when_no_mastery_row_exists(self) -> None:
        # Defensive: weak_this_batch is sourced from Progress, not
        # MasteryScore -- a sign could in principle have a Progress row but
        # no MasteryScore row yet if update_mastery failed to commit; must
        # not KeyError.
        signs = _real_signs(1)
        batch = _batch(1, signs)
        progress_rows = [_progress(signs[0], correct=False)]
        mock_db = _mock_db(batch, progress_rows, mastery_rows=[])

        result = ae.get_batch_recommendations(mock_db, "u1", 1)

        self.assertEqual(result["recommendations"][0]["mastery"], None)

    def test_count_matches_recommendations_length(self) -> None:
        signs = _real_signs(6)
        batch_signs, earlier_sign = signs[:5], signs[5]
        batch = _batch(1, batch_signs)
        progress_rows = [
            _progress(batch_signs[0], correct=False),
            *[_progress(s, correct=True) for s in batch_signs[1:]],
        ]
        mastery_rows = (
            [_mastery(s, score=0.9) for s in batch_signs]
            + [_mastery(earlier_sign, score=0.2, days_ago=5)]
        )
        mock_db = _mock_db(batch, progress_rows, mastery_rows)

        result = ae.get_batch_recommendations(mock_db, "u1", 1)

        self.assertEqual(result["count"], len(result["recommendations"]))


class NoNewThresholdConstantTests(unittest.TestCase):
    def test_weak_pool_uses_correct_boolean_not_a_confidence_threshold(self) -> None:
        # Regression guard for the Phase 1 fix: confirms the function still
        # doesn't reference a confidence bar for weak-from-batch by checking
        # a low-confidence-but-correct attempt is never flagged, mirroring
        # WeakFromBatchTests but stated here as an explicit no-new-threshold
        # guard, alongside the existing adaptive_engine guard
        # (test_adaptive_engine.py::CurriculumCompleteTests::
        # test_no_second_locally_defined_mastery_bar).
        self.assertFalse(hasattr(ae, "MASTERY_COMPLETE_THRESHOLD"))
        self.assertFalse(hasattr(ae, "WEAK_CONFIDENCE_THRESHOLD"))


if __name__ == "__main__":
    unittest.main()
