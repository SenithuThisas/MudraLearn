"""Practice path HTTP API — Batch Map, Overview, Challenge."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.services import practice_flow

router = APIRouter()


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class PracticedBody(CamelModel):
    sign_id: str


class ChallengeAttemptBody(CamelModel):
    sign_id: str
    sequence: list[list[float]]
    response_ms: int = 0


@router.get("/practice/map")
def practice_map(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return practice_flow.serialize_map(db, current_user.id)


@router.get("/practice/continue")
def practice_continue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    batch_id = practice_flow.continue_target(db, current_user.id)
    return {"batch_id": batch_id}


@router.get("/practice/batches/{batch_id}")
def practice_overview(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return practice_flow.serialize_overview(db, current_user.id, batch_id)


@router.post("/practice/batches/{batch_id}/practiced")
def practice_mark(
    batch_id: int,
    body: PracticedBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return practice_flow.mark_practiced(db, current_user.id, batch_id, body.sign_id)


@router.post("/practice/batches/{batch_id}/restart")
def practice_restart(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return practice_flow.restart_batch(db, current_user.id, batch_id)


@router.post("/practice/batches/{batch_id}/challenge/start")
def practice_challenge_start(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return practice_flow.start_challenge(db, current_user.id, batch_id)


@router.get("/practice/batches/{batch_id}/challenge")
def practice_challenge_get(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return practice_flow.get_challenge(db, current_user.id, batch_id)


@router.post("/practice/batches/{batch_id}/challenge/hint")
def practice_challenge_hint(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return practice_flow.use_hint(db, current_user.id, batch_id)


@router.post("/practice/batches/{batch_id}/challenge/skip")
def practice_challenge_skip(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return practice_flow.advance_after_retry(db, current_user.id, batch_id)


@router.post("/practice/batches/{batch_id}/challenge/attempt")
def practice_challenge_attempt(
    batch_id: int,
    body: ChallengeAttemptBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return practice_flow.challenge_attempt(
        db, current_user.id, batch_id, body.sign_id, body.sequence, body.response_ms,
    )
