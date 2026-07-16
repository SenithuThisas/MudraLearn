"""dashboard: role column on users + composite index for per-sign mastery lookups

Revision ID: 0002_dashboard
Revises: 0001_password_auth
"""
from alembic import op

revision = '0002_dashboard'
down_revision = '0001_password_auth'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'user'")
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_progress_user_sign_timestamp "
        "ON progress (user_id, sign_id, timestamp)"
    )


def downgrade():
    op.execute("DROP INDEX IF EXISTS ix_progress_user_sign_timestamp")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS role")
