"""Unit tests for XP math, batch unlock, leftover exclusion, and Challenge eligibility."""

from __future__ import annotations

import unittest

from app.services.curriculum_builder import build_seed_payload, form_batches, split_unbatched
from app.services.curriculum_config import BATCH_FIRST_PASS_XP, NEEDS_REVIEW_PASS_XP, PERFECT_BATCH_XP
from app.services.xp_rules import (
    base_xp,
    batch_bonus_entries,
    batch_completed,
    can_challenge_sign,
    score_challenge_results,
    sign_xp,
    verdict_for,
)


def _sign(name: str, category: str, f1: float, rank: int) -> dict:
    return {
        "sign_id": name,
        "f1": f1,
        "accuracy": f1,
        "support": 1,
        "gate_passed": True,
        "category": category,
        "difficulty_rank": rank,
    }


class BaseXpTests(unittest.TestCase):
    def test_level_one_is_ten(self) -> None:
        self.assertEqual(base_xp(1), 10)

    def test_level_scales_by_two(self) -> None:
        self.assertEqual(base_xp(5), 18)


class SignXpTests(unittest.TestCase):
    def test_great_no_hint_is_full_base(self) -> None:
        self.assertEqual(sign_xp("great", False, 1), 10)

    def test_okay_no_hint_is_seventy_percent(self) -> None:
        self.assertEqual(sign_xp("okay", False, 1), 7)

    def test_hint_zeroes_any_verdict(self) -> None:
        self.assertEqual(sign_xp("great", True, 3), 0)
        self.assertEqual(sign_xp("okay", True, 3), 0)
        self.assertEqual(sign_xp("retry", True, 3), 0)

    def test_retry_without_hint_is_zero(self) -> None:
        self.assertEqual(sign_xp("retry", False, 1), 0)


class BatchUnlockTests(unittest.TestCase):
    def test_three_of_five_completes(self) -> None:
        self.assertTrue(batch_completed(3))
        self.assertFalse(batch_completed(2))

    def test_first_pass_bonus(self) -> None:
        entries = batch_bonus_entries(4, hints_used=1, is_needs_review_pass=False)
        self.assertEqual(entries, [("batch_first_pass", BATCH_FIRST_PASS_XP)])

    def test_perfect_batch_adds_bonus(self) -> None:
        entries = dict(batch_bonus_entries(5, hints_used=0, is_needs_review_pass=False))
        self.assertEqual(entries["batch_first_pass"], BATCH_FIRST_PASS_XP)
        self.assertEqual(entries["perfect_batch"], PERFECT_BATCH_XP)

    def test_needs_review_pass_is_flat_ten(self) -> None:
        entries = batch_bonus_entries(5, hints_used=0, is_needs_review_pass=True)
        self.assertEqual(entries, [("needs_review_pass", NEEDS_REVIEW_PASS_XP)])

    def test_failed_batch_has_no_bonus(self) -> None:
        self.assertEqual(batch_bonus_entries(2, 0, False), [])


class ChallengeGuardTests(unittest.TestCase):
    def test_gate_passed_in_batch_allowed(self) -> None:
        self.assertTrue(can_challenge_sign(gate_passed=True, assigned_to_batch=True))

    def test_unbatched_gate_passed_blocked(self) -> None:
        self.assertFalse(can_challenge_sign(gate_passed=True, assigned_to_batch=False))

    def test_gate_failed_blocked(self) -> None:
        self.assertFalse(can_challenge_sign(gate_passed=False, assigned_to_batch=True))


class LeftoverAndMixTests(unittest.TestCase):
    def test_leftover_are_lowest_ranked(self) -> None:
        ranked = [
            _sign(f"s{i}", "Verbs" if i % 2 == 0 else "Nouns", 1.0 - i * 0.01, i + 1)
            for i in range(12)
        ]
        eligible, unbatched = split_unbatched(ranked, signs_per_batch=5)
        self.assertEqual(len(eligible), 10)
        self.assertEqual([s["sign_id"] for s in unbatched], ["s10", "s11"])

    def test_payload_marks_unbatched_not_in_batch(self) -> None:
        ranked = [
            _sign(f"s{i}", "Verbs" if i % 2 == 0 else "Nouns", 1.0 - i * 0.01, i + 1)
            for i in range(12)
        ]
        payload = build_seed_payload(ranked)
        self.assertEqual(payload["unbatched_gate_passed"], ["s10", "s11"])
        by_id = {s["sign_id"]: s for s in payload["signs"]}
        self.assertFalse(by_id["s10"]["in_batch"])
        self.assertFalse(by_id["s11"]["in_batch"])
        self.assertTrue(by_id["s0"]["in_batch"])
        self.assertEqual(len(payload["batches"]), 2)

    def test_form_batches_caps_same_category(self) -> None:
        ranked = [_sign(f"v{i}", "Verbs", 1.0 - i * 0.01, i + 1) for i in range(4)]
        ranked += [_sign(f"n{i}", "Nouns", 0.5 - i * 0.01, 10 + i) for i in range(4)]
        ranked += [_sign("adj", "Adjectives", 0.4, 20)]
        batches = form_batches(ranked, signs_per_batch=5, max_same_category=2)
        self.assertGreaterEqual(len(batches), 1)
        cats = [s["category"] for s in batches[0]]
        self.assertLessEqual(cats.count("Verbs"), 2)


class VerdictAndScoreTests(unittest.TestCase):
    def test_verdict_great_okay_retry(self) -> None:
        self.assertEqual(verdict_for(0.90, True), "great")
        self.assertEqual(verdict_for(0.70, True), "okay")
        self.assertEqual(verdict_for(0.90, False), "retry")
        self.assertEqual(verdict_for(0.50, True), "retry")

    def test_score_challenge_results_counts_correct_and_hints(self) -> None:
        correct, hints = score_challenge_results({
            "a": {"verdict": "great", "hint_used": False},
            "b": {"verdict": "okay", "hint_used": True},
            "c": {"verdict": "retry", "hint_used": False},
            "d": {"verdict": "great", "hint_used": False},
            "e": {"verdict": "retry", "hint_used": True},
        })
        self.assertEqual(correct, 3)
        self.assertEqual(hints, 2)
        self.assertTrue(batch_completed(correct))


class AutoHintTests(unittest.TestCase):
    def test_near_miss_twice_suggests_hint(self) -> None:
        from app.services.hint_rules import classify_practice_attempt, should_auto_hint

        top3 = [
            {"sign": "Hello", "confidence": 0.72},
            {"sign": "Thank you", "confidence": 0.18},
            {"sign": "Please", "confidence": 0.05},
        ]
        kind = classify_practice_attempt("Thank you", top3, 0.72)
        self.assertEqual(kind, "near_miss")
        self.assertFalse(should_auto_hint([kind]))
        self.assertTrue(should_auto_hint([kind, kind]))

    def test_low_confidence_twice_suggests_hint(self) -> None:
        from app.services.hint_rules import classify_practice_attempt, should_auto_hint

        top3 = [
            {"sign": "Hello", "confidence": 0.41},
            {"sign": "Bye", "confidence": 0.22},
            {"sign": "Please", "confidence": 0.10},
        ]
        kind = classify_practice_attempt("Thank you", top3, 0.41)
        self.assertEqual(kind, "low_conf")
        self.assertTrue(should_auto_hint([kind, kind]))

    def test_mixed_misses_do_not_hint(self) -> None:
        from app.services.hint_rules import should_auto_hint

        self.assertFalse(should_auto_hint(["near_miss", "low_conf"]))

    def test_success_does_not_hint(self) -> None:
        from app.services.hint_rules import classify_practice_attempt, should_auto_hint

        top3 = [
            {"sign": "Hello", "confidence": 0.91},
            {"sign": "Thank you", "confidence": 0.04},
            {"sign": "Please", "confidence": 0.02},
        ]
        kind = classify_practice_attempt("Hello", top3, 0.91)
        self.assertEqual(kind, "ok")
        self.assertFalse(should_auto_hint([kind, kind]))

    def test_confident_wrong_guess_is_other(self) -> None:
        from app.services.hint_rules import classify_practice_attempt, should_auto_hint

        top3 = [
            {"sign": "Hello", "confidence": 0.88},
            {"sign": "Bye", "confidence": 0.06},
            {"sign": "Please", "confidence": 0.03},
        ]
        kind = classify_practice_attempt("Thank you", top3, 0.88)
        self.assertEqual(kind, "other")
        self.assertFalse(should_auto_hint([kind, kind]))


if __name__ == "__main__":
    unittest.main()
