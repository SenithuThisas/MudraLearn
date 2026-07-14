"""
dashboard.py
------------
GET /api/dashboard/summary — stats, mastery breakdown, needs-review, recent activity
GET /api/dashboard/signs   — paginated, searchable, filterable sign mastery table

Response models are internally snake_case (normal FastAPI/Python convention)
but serialize as camelCase on the wire via an alias_generator, to match
frontend/src/data/mockDashboard.ts's existing field naming.
"""

from __future__ import annotations

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.services import dashboard_service

router = APIRouter()


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class DashboardStatsModel(CamelModel):
    signs_mastered: int
    day_streak: int
    minutes_practiced_estimate: int


class NeedsReviewItemModel(CamelModel):
    sign: str
    category: str
    mastery: int


class ActivityItemModel(CamelModel):
    id: str
    type: str
    sign: str
    timestamp: str


class DashboardSummaryResponse(CamelModel):
    stats: DashboardStatsModel
    mastery_overall: int
    tier_breakdown: dict[str, int]
    needs_review: list[NeedsReviewItemModel]
    recent_activity: list[ActivityItemModel]


class SignMasteryRowModel(CamelModel):
    sign: str
    category: str
    tier: str
    mastery: int


class SignsPageResponse(CamelModel):
    signs: list[SignMasteryRowModel]
    page: int
    page_size: int
    total: int
    total_pages: int


@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return dashboard_service.build_summary(db, current_user.id)


@router.get("/dashboard/signs", response_model=SignsPageResponse)
def dashboard_signs(
    search: str = Query("", description="Case-insensitive substring match on sign name"),
    category: str = Query("", description="Exact category filter, empty = all"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return dashboard_service.build_signs_page(db, current_user.id, search, category, page, page_size)
