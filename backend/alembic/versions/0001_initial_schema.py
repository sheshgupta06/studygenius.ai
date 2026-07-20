"""Initial schema

Revision ID: 0001_initial
Revises: 
Create Date: 2026-07-20 00:00:00
"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create all tables defined in the SQLAlchemy metadata."""
    bind = op.get_bind()
    # Import inside function to ensure application settings are available
    from app.models.orm import Base

    # Use metadata.create_all with the migration bind
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    """Drop all tables created by the upgrade."""
    bind = op.get_bind()
    from app.models.orm import Base

    Base.metadata.drop_all(bind=bind)
