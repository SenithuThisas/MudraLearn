"""Integration tests for the Google ID-token sign-in flow: POST
/api/auth/google/callback (new-user creation, google_id-first login,
account linking, invalid-token rejection), plus DELETE /api/auth/me's
password_hash-based re-auth branch as it applies to a Google-linked account
that already has a password.

Mirrors test_profile_account_management.py's approach: hits the real
running app (FastAPI TestClient) against the dev DB configured by
DATABASE_URL. Only the network/signature-verification call itself
(google_id_token.verify_oauth2_token) is mocked -- there is no real Google
Cloud OAuth client to test against yet (see GOOGLE_AUTH_PHASE1_2026-08-22.md)
-- every other line of google_callback() runs for real. Every test creates
its own throwaway user under a unique, uuid-suffixed email and deletes it
in tearDown.
"""
from __future__ import annotations

import unittest
import uuid
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.rate_limit import limiter
from app.routers.auth import hash_password, make_access_token

TEST_CLIENT_ID = "test-client-id.apps.googleusercontent.com"


def _unique_email() -> str:
    return f"pytest-google-{uuid.uuid4().hex[:12]}@example.com"


def _unique_username() -> str:
    return f"pytest{uuid.uuid4().hex[:12]}"


def _unique_sub() -> str:
    return f"g-{uuid.uuid4().hex[:16]}"


def _fake_payload(sub: str, email: str, email_verified: bool = True) -> dict:
    return {
        "sub": sub,
        "email": email,
        "email_verified": email_verified,
        "given_name": "Test",
        "family_name": "User",
    }


def _delete_user_by_email(email: str) -> None:
    db = SessionLocal()
    try:
        db.query(User).filter(User.email == email).delete()
        db.commit()
    finally:
        db.close()


class _GoogleCallbackTestCase(unittest.TestCase):
    """Base: patches GOOGLE_CLIENT_ID so google_callback() doesn't 503, and
    tracks emails to clean up. verify_oauth2_token itself is patched
    per-call via _callback(), since each test needs a different payload."""

    def setUp(self) -> None:
        limiter.reset()
        self.client = TestClient(app)
        self.emails_to_clean: list[str] = []
        patcher = patch("app.routers.auth.GOOGLE_CLIENT_ID", TEST_CLIENT_ID)
        patcher.start()
        self.addCleanup(patcher.stop)

    def tearDown(self) -> None:
        for email in self.emails_to_clean:
            _delete_user_by_email(email)
        limiter.reset()

    def _callback(self, payload: dict):
        with patch("app.routers.auth.google_id_token.verify_oauth2_token", return_value=payload):
            return self.client.post("/api/auth/google/callback", json={"id_token": "fake"})


class NewUserCreationTests(_GoogleCallbackTestCase):
    def test_creates_user_with_expected_fields(self) -> None:
        email = _unique_email()
        self.emails_to_clean.append(email)
        sub = _unique_sub()

        resp = self._callback(_fake_payload(sub, email))
        self.assertEqual(resp.status_code, 200, resp.text)
        body = resp.json()
        user = body["user"]
        self.assertEqual(user["email"], email)
        self.assertEqual(user["auth_provider"], "google")
        self.assertIsNone(user["username"])
        self.assertFalse(user["onboarding_complete"])
        self.assertTrue(user["is_new"])
        self.assertFalse(user["has_password"])
        self.assertIn("access_token", body)

        db = SessionLocal()
        try:
            row = db.query(User).filter(User.email == email).first()
            self.assertIsNotNone(row)
            self.assertEqual(row.google_id, sub)
            self.assertEqual(row.auth_provider, "google")
            self.assertIsNotNone(row.email_verified_at)
            self.assertIsNone(row.username)
            # Default, not 'completed' -- onboarding_username() must still
            # force the username step before this account is considered done.
            self.assertEqual(row.signup_step, "email")
            self.assertIsNone(row.password_hash)
        finally:
            db.close()

    def test_unverified_email_does_not_set_email_verified_at(self) -> None:
        email = _unique_email()
        self.emails_to_clean.append(email)
        sub = _unique_sub()

        resp = self._callback(_fake_payload(sub, email, email_verified=False))
        self.assertEqual(resp.status_code, 200, resp.text)
        self.assertFalse(resp.json()["user"]["email_verified"])

        db = SessionLocal()
        try:
            row = db.query(User).filter(User.email == email).first()
            self.assertIsNone(row.email_verified_at)
        finally:
            db.close()


class GoogleIdFirstLoginTests(_GoogleCallbackTestCase):
    def test_repeat_sign_in_with_same_sub_logs_in_existing_user(self) -> None:
        email = _unique_email()
        self.emails_to_clean.append(email)
        sub = _unique_sub()

        first = self._callback(_fake_payload(sub, email))
        self.assertEqual(first.status_code, 200, first.text)
        first_id = first.json()["user"]["id"]

        second = self._callback(_fake_payload(sub, email))
        self.assertEqual(second.status_code, 200, second.text)
        self.assertEqual(second.json()["user"]["id"], first_id)
        # is_new is only ever set on the creation branch.
        self.assertNotIn("is_new", second.json()["user"])

        db = SessionLocal()
        try:
            self.assertEqual(db.query(User).filter(User.email == email).count(), 1)
        finally:
            db.close()


class AccountLinkingTests(_GoogleCallbackTestCase):
    def test_matching_email_links_google_id_and_preserves_password(self) -> None:
        email = _unique_email()
        self.emails_to_clean.append(email)
        password_hash = hash_password("OriginalPass123")

        db = SessionLocal()
        try:
            db.add(User(
                email=email,
                password_hash=password_hash,
                first_name="Existing",
                last_name="User",
                username=_unique_username(),
                auth_provider="email",
                signup_step="completed",
            ))
            db.commit()
        finally:
            db.close()

        sub = _unique_sub()
        resp = self._callback(_fake_payload(sub, email))
        self.assertEqual(resp.status_code, 200, resp.text)
        user = resp.json()["user"]
        self.assertEqual(user["auth_provider"], "email")  # untouched by linking
        self.assertTrue(user["has_password"])
        self.assertTrue(user["onboarding_complete"])  # already had a username

        db = SessionLocal()
        try:
            row = db.query(User).filter(User.email == email).first()
            self.assertEqual(row.google_id, sub)
            self.assertEqual(row.password_hash, password_hash)  # untouched
            self.assertEqual(row.auth_provider, "email")  # untouched
        finally:
            db.close()

    def test_email_already_linked_to_different_google_id_returns_409(self) -> None:
        email = _unique_email()
        self.emails_to_clean.append(email)
        first_sub = _unique_sub()

        first = self._callback(_fake_payload(first_sub, email))
        self.assertEqual(first.status_code, 200, first.text)

        other_sub = _unique_sub()
        second = self._callback(_fake_payload(other_sub, email))
        self.assertEqual(second.status_code, 409, second.text)

        db = SessionLocal()
        try:
            row = db.query(User).filter(User.email == email).first()
            self.assertEqual(row.google_id, first_sub)  # unchanged by the conflict
        finally:
            db.close()


class InvalidTokenTests(_GoogleCallbackTestCase):
    def test_invalid_token_returns_401_without_leaking_verification_detail(self) -> None:
        with patch(
            "app.routers.auth.google_id_token.verify_oauth2_token",
            side_effect=ValueError("Token used too late, 1690000000 > 1689999000"),
        ):
            resp = self.client.post("/api/auth/google/callback", json={"id_token": "bad"})
        self.assertEqual(resp.status_code, 401)
        self.assertNotIn("1690000000", resp.text)
        self.assertNotIn("too late", resp.text)

    def test_missing_client_id_returns_503(self) -> None:
        with patch("app.routers.auth.GOOGLE_CLIENT_ID", None):
            resp = self.client.post("/api/auth/google/callback", json={"id_token": "whatever"})
        self.assertEqual(resp.status_code, 503)


class GoogleLinkedPasswordDeleteTests(unittest.TestCase):
    """The 'linked-google-with-password' half of the password_hash-based
    re-auth branch: an account with google_id set (Google-linked) but
    auth_provider still 'email' and a real password_hash (exactly the state
    AccountLinkingTests above produces). delete_me() must require this
    account's password, not a confirmation phrase.

    Note (see GOOGLE_AUTH_FIX_2026-08-23.md): auth_provider stays 'email'
    for a linked account, so the old auth_provider-based branch would also
    have required a password here -- this state cannot yet distinguish the
    fixed logic from the old logic, since nothing in this codebase creates
    an auth_provider='google' row with a password_hash. This test still
    guards the intended behavior and would catch a regression to a check
    that ignores password_hash entirely.
    """

    PASSWORD = "LinkedPass123"

    def setUp(self) -> None:
        limiter.reset()
        self.client = TestClient(app)
        self.user_id = uuid.uuid4()
        self.email = _unique_email()
        db = SessionLocal()
        try:
            db.add(User(
                id=self.user_id,
                email=self.email,
                username=_unique_username(),
                first_name="Linked",
                last_name="User",
                password_hash=hash_password(self.PASSWORD),
                auth_provider="email",
                google_id=_unique_sub(),
                signup_step="completed",
            ))
            db.commit()
        finally:
            db.close()
        token = make_access_token(str(self.user_id))
        self.client.headers.update({"Authorization": f"Bearer {token}"})

    def tearDown(self) -> None:
        _delete_user_by_email(self.email)
        limiter.reset()

    def test_wrong_password_is_rejected(self) -> None:
        resp = self.client.request("DELETE", "/api/auth/me", json={"password": "WrongPassword"})
        self.assertEqual(resp.status_code, 401)

        db = SessionLocal()
        try:
            self.assertIsNotNone(db.query(User).filter(User.id == self.user_id).first())
        finally:
            db.close()

    def test_correct_password_deletes_the_linked_account(self) -> None:
        resp = self.client.request("DELETE", "/api/auth/me", json={"password": self.PASSWORD})
        self.assertEqual(resp.status_code, 204)

        db = SessionLocal()
        try:
            self.assertIsNone(db.query(User).filter(User.id == self.user_id).first())
        finally:
            db.close()


# The other half of the password_hash-based branch -- a Google-only account
# with no password_hash at all, which must use the confirmation-phrase path
# -- is already covered by GoogleAccountDeleteTests in
# test_profile_account_management.py (test_password_field_does_not_bypass_
# confirmation_check, test_wrong_confirmation_returns_401,
# test_correct_confirmation_deletes_account_case_insensitively). Re-run as
# part of the full suite below rather than duplicated here.


if __name__ == "__main__":
    unittest.main()
