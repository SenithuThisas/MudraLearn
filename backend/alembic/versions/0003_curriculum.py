"""curriculum tables: batches, sign_difficulty, user_batch_progress, xp_ledger, user_streak

Revision ID: 0003_curriculum
Revises: 0002_dashboard
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0003_curriculum"
down_revision = "0002_dashboard"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "batches",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tier", sa.Integer(), nullable=False),
        sa.Column("tier_label", sa.String(), nullable=False),
        sa.Column("level_number", sa.Integer(), nullable=False),
        sa.Column("difficulty_rank", sa.Integer(), nullable=False),
        sa.Column("sign_ids", postgresql.ARRAY(sa.String()), nullable=False),
        sa.UniqueConstraint("level_number", name="uq_batches_level_number"),
    )
    op.create_table(
        "sign_difficulty",
        sa.Column("sign_id", sa.String(), primary_key=True),
        sa.Column("f1", sa.Float(), nullable=False),
        sa.Column("accuracy", sa.Float(), nullable=False),
        sa.Column("support", sa.Float(), nullable=False, server_default="0"),
        sa.Column("difficulty_rank", sa.Integer(), nullable=False),
        sa.Column("gate_passed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("category", sa.String(), nullable=False, server_default="Uncategorized"),
        sa.Column("batch_id", sa.Integer(), sa.ForeignKey("batches.id"), nullable=True),
    )
    op.create_table(
        "user_batch_progress",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("batch_id", sa.Integer(), sa.ForeignKey("batches.id"), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="locked"),
        sa.Column("best_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("practiced_sign_ids", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.UniqueConstraint("user_id", "batch_id", name="uq_user_batch_progress"),
    )
    op.create_index("ix_user_batch_progress_id", "user_batch_progress", ["id"])
    op.create_table(
        "xp_ledger",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(), nullable=False),
        sa.Column("batch_id", sa.Integer(), sa.ForeignKey("batches.id"), nullable=True),
        sa.Column("sign_id", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_xp_ledger_id", "xp_ledger", ["id"])
    op.create_index("ix_xp_ledger_user_id", "xp_ledger", ["user_id"])
    op.create_table(
        "user_streak",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("last_active_date", sa.Date(), nullable=True),
        sa.Column("current_streak", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("longest_streak", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade():
    op.drop_table("user_streak")
    op.drop_index("ix_xp_ledger_user_id", table_name="xp_ledger")
    op.drop_index("ix_xp_ledger_id", table_name="xp_ledger")
    op.drop_table("xp_ledger")
    op.drop_index("ix_user_batch_progress_id", table_name="user_batch_progress")
    op.drop_table("user_batch_progress")
    op.drop_table("sign_difficulty")
    op.drop_table("batches")
