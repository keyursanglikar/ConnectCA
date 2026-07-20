"""Fix published_fee_pamplate dates

Revision ID: 624615381a4e
Revises: 2a85777eaafb
Create Date: 2026-07-14 14:50:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '624615381a4e'
down_revision = '2a85777eaafb'
branch_labels = None
depends_on = None


def upgrade():
    # Only alter the columns to add default values and NOT NULL
    # Don't drop indexes or tables
    
    # Alter created_at column
    op.alter_column('published_fee_pamplate', 'created_at',
                    existing_type=sa.DateTime(),
                    nullable=False,
                    server_default=sa.text('CURRENT_TIMESTAMP'))
    
    # Alter updated_at column
    op.alter_column('published_fee_pamplate', 'updated_at',
                    existing_type=sa.DateTime(),
                    nullable=False,
                    server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))


def downgrade():
    # Revert the changes
    op.alter_column('published_fee_pamplate', 'created_at',
                    existing_type=sa.DateTime(),
                    nullable=True,
                    server_default=None)
    
    op.alter_column('published_fee_pamplate', 'updated_at',
                    existing_type=sa.DateTime(),
                    nullable=True,
                    server_default=None)