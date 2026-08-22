"""Integration tests for the profile-management endpoints added on top of
auth.py: PATCH/DELETE /api/auth/me, the onboarding/username re-entry guard,
and the complete-signup rate limit.

Unlike the rest of this test suite, these hit the real running app (FastAPI
TestClient) against the database configured by DATABASE_URL -- there is no
separate test database in this project yet, so these run against the same
dev DB the app itself uses. Every test creates its own throwaway user under
a unique, uuid-suffixed email/username and deletes it again in tearDown
(directly, or by letting the endpoint under test do it), so the suite is
safe to run repeatedly against a dev database that already has real rows in
it -- it never touches a row it didn't create itself.
"""
from __future__ import annotations

import unittest
import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.user import User, AuthSession
from app.models.progress import Progress, MasteryScore
from app.models.curriculum import Batch, UserBatchProgress, XpLedger, UserStreak
from app.rate_limit import limiter
from app.routers.auth import make_access_token


def _unique_email() -> str:
    return f"pytest-{uuid.uuid4().hex[:12]}@example.com"


def _unique_username() -> str:
    return f"pytest{uuid.uuid4().hex[:12]}"


def _delete_user_by_email(email: str) -> None:
    db = SessionLocal()
    try:
        db.query(User).filter(User.email == email).delete()
        db.commit()
    finally:
        db.close()


class _SignedUpUserTestCase(unittest.TestCase):
    """Base: signs up one real user per test through the actual wizard
    endpoints (request-otp -> verify-otp -> complete-signup), so tests
    exercise PATCH/DELETE exactly the way a real session would reach them --
    an authenticated cookie session, not a hand-rolled token."""

    PASSWORD = "TestPass123"

    def setUp(self) -> None:
        limiter.reset()
        self.client = TestClient(app)
        self.email = _unique_email()
        self.username = _unique_username()
        self.user_id = self._signup()

    def tearDown(self) -> None:
        _delete_user_by_email(self.email)  # no-op if a test already deleted it
        limiter.reset()

    def _signup(self) -> str:
        otp_resp = self.client.post("/api/auth/email/request-otp", json={"email": self.email})
        self.assertEqual(otp_resp.status_code, 200, otp_resp.text)
        otp = otp_resp.json()["dev_otp"]

        verify_resp = self.client.post(
            "/api/auth/email/verify-otp", json={"email": self.email, "otp": otp}
        )
        self.assertEqual(verify_resp.status_code, 200, verify_resp.text)
        signup_token = verify_resp.json()["signup_token"]

        signup_resp = self.client.post(
            "/api/auth/complete-signup",
            json={
                "signup_token": signup_token,
                "password": self.PASSWORD,
                "first_name": "Test",
                "last_name": "User",
                "username": self.username,
            },
        )
        self.assertEqual(signup_resp.status_code, 200, signup_resp.text)
        # TestClient persists the httpOnly cookie set here across subsequent
        # requests made through the same client instance.
        return signup_resp.json()["user"]["id"]


class PatchProfileTests(_SignedUpUserTestCase):
    def test_updates_first_and_last_name(self) -> None:
        resp = self.client.patch(
            "/api/auth/me", json={"first_name": "Updated", "last_name": "Name"}
        )
        self.assertEqual(resp.status_code, 200, resp.text)
        user = resp.json()["user"]
        self.assertEqual(user["first_name"], "Updated")
        self.assertEqual(user["last_name"], "Name")
        # Untouched.
        self.assertEqual(user["email"], self.email)
        self.assertEqual(user["username"], self.username)

    def test_rejects_email_field_with_422(self) -> None:
        resp = self.client.patch(
            "/api/auth/me",
            json={"first_name": "X", "last_name": "Y", "email": "attacker@example.com"},
        )
        self.assertEqual(resp.status_code, 422)

    def test_rejects_username_field_with_422(self) -> None:
        resp = self.client.patch(
            "/api/auth/me",
            json={"first_name": "X", "last_name": "Y", "username": "hacked"},
        )
        self.assertEqual(resp.status_code, 422)

    def test_rejected_patch_leaves_stored_name_untouched(self) -> None:
        self.client.patch(
            "/api/auth/me",
            json={"first_name": "X", "last_name": "Y", "email": "attacker@example.com"},
        )
        me = self.client.get("/api/auth/me").json()["user"]
        self.assertEqual(me["first_name"], "Test")
        self.assertEqual(me["last_name"], "User")

    def test_empty_name_is_rejected_with_400(self) -> None:
        resp = self.client.patch("/api/auth/me", json={"first_name": "  ", "last_name": "Y"})
        self.assertEqual(resp.status_code, 400)


class DeleteAccountTests(_SignedUpUserTestCase):
    def test_wrong_password_returns_401_and_does_not_delete(self) -> None:
        resp = self.client.request("DELETE", "/api/auth/me", json={"password": "WrongPassword"})
        self.assertEqual(resp.status_code, 401)

        me = self.client.get("/api/auth/me")
        self.assertEqual(me.status_code, 200)

        db = SessionLocal()
        try:
            self.assertIsNotNone(db.query(User).filter(User.email == self.email).first())
        finally:
            db.close()

    def test_missing_password_returns_401(self) -> None:
        resp = self.client.request("DELETE", "/api/auth/me", json={})
        self.assertEqual(resp.status_code, 401)

    def test_correct_password_deletes_account(self) -> None:
        resp = self.client.request("DELETE", "/api/auth/me", json={"password": self.PASSWORD})
        self.assertEqual(resp.status_code, 204)
        self.assertEqual(resp.content, b"")

        # Session is dead immediately after.
        me = self.client.get("/api/auth/me")
        self.assertEqual(me.status_code, 401)

        db = SessionLocal()
        try:
            self.assertIsNone(db.query(User).filter(User.email == self.email).first())
        finally:
            db.close()

    def test_delete_cascades_across_all_six_dependent_tables(self) -> None:
        db = SessionLocal()
        try:
            batch_id = db.query(Batch).first().id
            db.add(Progress(user_id=self.user_id, sign_id="TestSign", category="Test", confidence=0.9, correct=True))
            db.add(MasteryScore(user_id=self.user_id, sign_id="TestSign", score=0.5, attempts=1))
            db.add(UserBatchProgress(user_id=self.user_id, batch_id=batch_id, status="in_progress"))
            db.add(XpLedger(user_id=self.user_id, amount=10, reason="test"))
            db.add(UserStreak(user_id=self.user_id, current_streak=1, longest_streak=1))
            db.commit()

            counts_before = {
                "progress": db.query(Progress).filter(Progress.user_id == self.user_id).count(),
                "mastery_scores": db.query(MasteryScore).filter(MasteryScore.user_id == self.user_id).count(),
                "user_batch_progress": db.query(UserBatchProgress).filter(UserBatchProgress.user_id == self.user_id).count(),
                "xp_ledger": db.query(XpLedger).filter(XpLedger.user_id == self.user_id).count(),
                "user_streak": db.query(UserStreak).filter(UserStreak.user_id == self.user_id).count(),
            }
            self.assertTrue(all(v == 1 for v in counts_before.values()), counts_before)
        finally:
            db.close()

        resp = self.client.request("DELETE", "/api/auth/me", json={"password": self.PASSWORD})
        self.assertEqual(resp.status_code, 204)

        db = SessionLocal()
        try:
            self.assertEqual(db.query(Progress).filter(Progress.user_id == self.user_id).count(), 0)
            self.assertEqual(db.query(MasteryScore).filter(MasteryScore.user_id == self.user_id).count(), 0)
            self.assertEqual(db.query(UserBatchProgress).filter(UserBatchProgress.user_id == self.user_id).count(), 0)
            self.assertEqual(db.query(XpLedger).filter(XpLedger.user_id == self.user_id).count(), 0)
            # user_streak's user_id is ALSO its primary key -- the specific
            # edge case called out for this migration.
            self.assertEqual(db.query(UserStreak).filter(UserStreak.user_id == self.user_id).count(), 0)
        finally:
            db.close()

    def test_delete_nulls_rather_than_deletes_auth_sessions(self) -> None:
        db = SessionLocal()
        try:
            db.add(AuthSession(
                user_id=self.user_id, token_hash="pytest-deadbeef", purpose="login_temp",
                expires_at=datetime.now(timezone.utc),
            ))
            db.commit()
        finally:
            db.close()

        resp = self.client.request("DELETE", "/api/auth/me", json={"password": self.PASSWORD})
        self.assertEqual(resp.status_code, 204)

        db = SessionLocal()
        try:
            session = db.query(AuthSession).filter(AuthSession.token_hash == "pytest-deadbeef").first()
            self.assertIsNotNone(session, "auth_sessions row should survive (SET NULL), not be deleted")
            self.assertIsNone(session.user_id)
            db.delete(session)
            db.commit()
        finally:
            db.close()


class GoogleAccountDeleteTests(unittest.TestCase):
    """auth_provider == 'google' users have no password_hash -- deletion must
    go through the confirmation-phrase branch, and a `password` field must
    never be able to substitute for it."""

    def setUp(self) -> None:
        limiter.reset()
        self.client = TestClient(app)
        self.user_id = uuid.uuid4()
        self.username = _unique_username()
        db = SessionLocal()
        try:
            db.add(User(
                id=self.user_id,
                email=f"pytest-google-{self.user_id}@example.com",
                username=self.username,
                first_name="Google",
                last_name="User",
                password_hash=None,
                auth_provider="google",
                signup_step="completed",
            ))
            db.commit()
        finally:
            db.close()
        token = make_access_token(str(self.user_id))
        self.client.headers.update({"Authorization": f"Bearer {token}"})

    def tearDown(self) -> None:
        db = SessionLocal()
        try:
            db.query(User).filter(User.id == self.user_id).delete()
            db.commit()
        finally:
            db.close()
        limiter.reset()

    def test_password_field_does_not_bypass_confirmation_check(self) -> None:
        resp = self.client.request("DELETE", "/api/auth/me", json={"password": "anything-at-all"})
        self.assertEqual(resp.status_code, 401)

    def test_wrong_confirmation_returns_401(self) -> None:
        resp = self.client.request("DELETE", "/api/auth/me", json={"confirmation": "not-my-username"})
        self.assertEqual(resp.status_code, 401)

    def test_correct_confirmation_deletes_account_case_insensitively(self) -> None:
        resp = self.client.request("DELETE", "/api/auth/me", json={"confirmation": self.username.upper()})
        self.assertEqual(resp.status_code, 204)

        db = SessionLocal()
        try:
            self.assertIsNone(db.query(User).filter(User.id == self.user_id).first())
        finally:
            db.close()


class OnboardingUsernameGuardTests(_SignedUpUserTestCase):
    def test_reentry_after_completed_signup_returns_409(self) -> None:
        resp = self.client.post("/api/auth/onboarding/username", json={"username": "somenewname"})
        self.assertEqual(resp.status_code, 409)

        me = self.client.get("/api/auth/me").json()["user"]
        self.assertEqual(me["username"], self.username)  # unchanged


class OnboardingUsernameFirstUseTests(unittest.TestCase):
    """Control test: proves the 409 guard only fires on RE-entry, not on a
    legitimate first-time call (the Google-onboarding path this endpoint
    exists for)."""

    def setUp(self) -> None:
        limiter.reset()
        self.client = TestClient(app)
        self.user_id = uuid.uuid4()
        db = SessionLocal()
        try:
            db.add(User(
                id=self.user_id,
                email=f"pytest-incomplete-{self.user_id}@example.com",
                username=None,
                first_name="Incomplete",
                last_name="User",
                password_hash=None,
                auth_provider="google",
                signup_step="otp_verified",  # not yet 'completed'
            ))
            db.commit()
        finally:
            db.close()
        token = make_access_token(str(self.user_id))
        self.client.headers.update({"Authorization": f"Bearer {token}"})

    def tearDown(self) -> None:
        db = SessionLocal()
        try:
            db.query(User).filter(User.id == self.user_id).delete()
            db.commit()
        finally:
            db.close()
        limiter.reset()

    def test_first_call_succeeds(self) -> None:
        username = _unique_username()
        resp = self.client.post("/api/auth/onboarding/username", json={"username": username})
        self.assertEqual(resp.status_code, 200, resp.text)
        self.assertEqual(resp.json()["user"]["username"], username)


class CompleteSignupRateLimitTests(unittest.TestCase):
    def setUp(self) -> None:
        limiter.reset()
        self.client = TestClient(app)

    def tearDown(self) -> None:
        limiter.reset()

    def test_eleventh_rapid_request_is_rate_limited(self) -> None:
        payload = {
            "signup_token": "not-a-real-token",
            "password": "whatever123",
            "first_name": "A",
            "last_name": "B",
            "username": "whatever",
        }
        statuses = [
            self.client.post("/api/auth/complete-signup", json=payload).status_code for _ in range(11)
        ]
        # First 10 reach the handler and fail on the (invalid) token lookup.
        self.assertTrue(all(s == 400 for s in statuses[:10]), statuses)
        # 11th is stopped by slowapi before the handler runs at all.
        self.assertEqual(statuses[10], 429, statuses)


if __name__ == "__main__":
    unittest.main()
