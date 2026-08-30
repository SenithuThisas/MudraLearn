"""Unit tests for Translate/free-form attempt filtering."""

from __future__ import annotations

import unittest

from app.services.progress_filters import is_free_form


class IsFreeFormTests(unittest.TestCase):
    def test_unknown_target_is_free_form(self) -> None:
        self.assertTrue(is_free_form("unknown", "Greetings"))

    def test_free_category_is_free_form(self) -> None:
        self.assertTrue(is_free_form("Hello", "free"))

    def test_case_and_whitespace_insensitive(self) -> None:
        self.assertTrue(is_free_form(" Unknown ", "Greetings"))
        self.assertTrue(is_free_form("Hello", " FREE "))

    def test_scored_practice_is_not_free_form(self) -> None:
        self.assertFalse(is_free_form("Hello", "Greetings"))


if __name__ == "__main__":
    unittest.main()
