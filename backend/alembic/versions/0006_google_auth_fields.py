"""google auth: defensively backfill auth_provider/google_id/email_verified_at

Idempotent, matching 0001_password_auth.py's pattern. These three columns
were already present on the User model from the original scaffold commit
(1432f69) but never had an Alembic migration of their own — the dev DB was
historically built by `Base.metadata.create_all()`. This backfills them with
`IF NOT EXISTS` guards for any DB where create_all() timing left them
missing, and adds the unique constraint on google_id if it isn't already
there (create_all() would have added it from the model's `unique=True`, but
an ADD COLUMN here would not).

Revision ID: 0006_google_auth_fields
Revises: 0005_user_delete_cascade
"""
from alembic import op

revision = '0006_google_auth_fields'
down_revision = '0005_user_delete_cascade'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR DEFAULT 'email'")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP")

    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'users_google_id_key'
            ) THEN
                ALTER TABLE users ADD CONSTRAINT users_google_id_key UNIQUE (google_id);
            END IF;
        END $$;
    """)


def downgrade():
    op.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_google_id_key")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS email_verified_at")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS google_id")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS auth_provider")
