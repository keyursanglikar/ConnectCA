"""add version and accepted_item_ids to fee_pamplate

Revision ID: 20240716_add_version_and_accepted_item_ids
Revises: [your_revision_id]
Create Date: 2024-07-16 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import JSON

# revision identifiers, used by Alembic.
revision: str = '20240716_add_version_and_accepted_item_ids'
down_revision: Union[str, None] = '[your_revision_id]'  # Replace with your actual previous migration ID
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if columns exist before adding
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('published_fee_pamplate')]
    
    # Add version column if it doesn't exist
    if 'version' not in columns:
        op.add_column('published_fee_pamplate', 
            sa.Column('version', sa.Integer(), server_default='1', nullable=False)
        )
        print("✅ Added 'version' column to published_fee_pamplate")
    
    # Add accepted_item_ids column if it doesn't exist
    if 'accepted_item_ids' not in columns:
        op.add_column('published_fee_pamplate',
            sa.Column('accepted_item_ids', JSON, nullable=True)
        )
        print("✅ Added 'accepted_item_ids' column to published_fee_pamplate")
    
    # Check if index exists
    indexes = [idx['name'] for idx in inspector.get_indexes('published_fee_pamplate')]
    if 'ix_published_fee_pamplate_client_version' not in indexes:
        op.create_index('ix_published_fee_pamplate_client_version', 
            'published_fee_pamplate', 
            ['client_id', 'version']
        )
        print("✅ Created index on client_id and version")


def downgrade() -> None:
    # Drop index
    op.drop_index('ix_published_fee_pamplate_client_version', table_name='published_fee_pamplate')
    
    # Drop columns
    op.drop_column('published_fee_pamplate', 'accepted_item_ids')
    op.drop_column('published_fee_pamplate', 'version')