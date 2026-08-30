"""cascade user_id FKs so DELETE FROM users cleans up dependent rows

Constraint-only change: drops and recreates the 6 existing user_id foreign
keys with an ON DELETE behavior. No columns, tables, or data are touched, so
no existing row is affected until a users row is actually deleted.

- progress, mastery_scores, user_batch_progress, xp_ledger, user_streak:
  user_id is NOT NULL -> ondelete='CASCADE' (row is meaningless without the
  user, so it must go with it).
- auth_sessions: user_id is nullable (signup_temp rows carry no user yet) ->
  ondelete='SET NULL' (a consumed/expired temp-token row can outlive the
  user it was issued to without breaking anything).

Revision ID: 0005_user_delete_cascade
Revises: 0004_challenge_state
"""
from alembic import op

revision = "0005_user_delete_cascade"
down_revision = "0004_challenge_state"
branch_labels = None
depends_on = None

_CASCADE_TABLES = [
    "progress",
    "mastery_scores",
    "user_batch_progress",
    "xp_ledger",
    "user_streak",
]


def upgrade():
    for table in _CASCADE_TABLES:
        constraint = f"{table}_user_id_fkey"
        op.drop_constraint(constraint, table, type_="foreignkey")
        op.create_foreign_key(constraint, table, "users", ["user_id"], ["id"], ondelete="CASCADE")

    op.drop_constraint("auth_sessions_user_id_fkey", "auth_sessions", type_="foreignkey")
    op.create_foreign_key(
        "auth_sessions_user_id_fkey", "auth_sessions", "users", ["user_id"], ["id"], ondelete="SET NULL"
    )


def downgrade():
    for table in _CASCADE_TABLES:
        constraint = f"{table}_user_id_fkey"
        op.drop_constraint(constraint, table, type_="foreignkey")
        op.create_foreign_key(constraint, table, "users", ["user_id"], ["id"])

    op.drop_constraint("auth_sessions_user_id_fkey", "auth_sessions", type_="foreignkey")
    op.create_foreign_key("auth_sessions_user_id_fkey", "auth_sessions", "users", ["user_id"], ["id"])
