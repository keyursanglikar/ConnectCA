"""Add bill_as fields to documents

Revision ID: [your_revision_id]
Revises: 77eed2a2efc4
Create Date: 2026-07-15 15:02:43.921765

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '[your_revision_id]'  # This will be auto-generated
down_revision: Union[str, None] = '77eed2a2efc4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ✅ ONLY ADD THE MISSING COLUMNS - NOTHING ELSE!
    
    # Check if columns exist before adding
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('documents')]
    
    # Add bill_as column if it doesn't exist
    if 'bill_as' not in columns:
        op.add_column('documents', sa.Column('bill_as', sa.String(length=50), nullable=True, server_default='ignore'))
    
    # Add detected_label column if it doesn't exist
    if 'detected_label' not in columns:
        op.add_column('documents', sa.Column('detected_label', sa.String(length=255), nullable=True))
    
    # Add confidence column if it doesn't exist
    if 'confidence' not in columns:
        op.add_column('documents', sa.Column('confidence', sa.String(length=20), nullable=True))


def downgrade() -> None:
    # ✅ Only remove the columns we added
    op.drop_column('documents', 'confidence')
    op.drop_column('documents', 'detected_label')
    op.drop_column('documents', 'bill_as')