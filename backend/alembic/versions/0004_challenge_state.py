"""challenge_state JSON on user_batch_progress

Revision ID: 0004_challenge_state
Revises: 0003_curriculum
"""
from alembic import op

revision = "0004_challenge_state"
down_revision = "0003_curriculum"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        "ALTER TABLE user_batch_progress "
        "ADD COLUMN IF NOT EXISTS challenge_state JSONB NOT NULL DEFAULT '{}'::jsonb"
    )


def downgrade():
    op.execute("ALTER TABLE user_batch_progress DROP COLUMN IF EXISTS challenge_state")
