"""password auth: user password/lockout columns + auth_sessions signup-token support

Idempotent first migration. The dev DB was historically built by
`Base.metadata.create_all()` (no Alembic baseline), so this uses Postgres
`IF [NOT] EXISTS` guards to be safe whether or not the columns/tables already
exist. `create_all()` still creates any missing tables on startup; this
migration only fills the gaps `create_all()` cannot (new columns on existing
tables, dropping an old NOT NULL).

Revision ID: 0001_password_auth
Revises:
"""
from alembic import op

revision = '0001_password_auth'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # users: password auth + lockout
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_step VARCHAR DEFAULT 'email'")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP")

    # auth_sessions: signup tokens exist before any user row, so carry an email
    # and allow a NULL user_id. Table may not exist yet if the app has never
    # started — ALTER TABLE IF EXISTS makes that a safe no-op.
    op.execute("ALTER TABLE IF EXISTS auth_sessions ADD COLUMN IF NOT EXISTS email VARCHAR")
    op.execute("ALTER TABLE IF EXISTS auth_sessions ALTER COLUMN user_id DROP NOT NULL")


def downgrade():
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS password_hash")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS signup_step")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS failed_login_attempts")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS locked_until")
    op.execute("ALTER TABLE IF EXISTS auth_sessions DROP COLUMN IF EXISTS email")
