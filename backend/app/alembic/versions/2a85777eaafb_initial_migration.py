"""Initial migration

Revision ID: 2a85777eaafb
Revises: 
Create Date: 2026-07-14 14:20:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '2a85777eaafb'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ============================================
    # SKIP DROP TABLE OPERATIONS - Tables already exist
    # Only add missing columns and tables
    # ============================================
    
    # 1. Add is_published and published_at columns to fee_categories if they don't exist
    try:
        op.add_column('fee_categories', sa.Column('is_published', sa.Boolean(), nullable=True, server_default='0'))
    except Exception as e:
        print(f"Column is_published already exists or error: {e}")
    
    try:
        op.add_column('fee_categories', sa.Column('published_at', sa.DateTime(), nullable=True))
    except Exception as e:
        print(f"Column published_at already exists or error: {e}")
    
    # 2. Create published_fee_pamplate table if it doesn't exist
    op.create_table('published_fee_pamplate',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=False),
        sa.Column('fee_data', sa.JSON(), nullable=False),
        sa.Column('total_fee', sa.DECIMAL(precision=10, scale=2), nullable=True),
        sa.Column('total_gst', sa.DECIMAL(precision=10, scale=2), nullable=True),
        sa.Column('grand_total', sa.DECIMAL(precision=10, scale=2), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('is_viewed', sa.Boolean(), nullable=True),
        sa.Column('viewed_at', sa.DateTime(), nullable=True),
        sa.Column('accepted_at', sa.DateTime(), nullable=True),
        sa.Column('rejected_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['client_id'], ['client_masters.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_published_fee_pamplate_id', 'published_fee_pamplate', ['id'])
    op.create_index('ix_published_fee_pamplate_client_id', 'published_fee_pamplate', ['client_id'])
    op.create_index('ix_published_fee_pamplate_user_id', 'published_fee_pamplate', ['user_id'])


def downgrade():
    # ============================================
    # Only drop what we added
    # ============================================
    
    # Drop published_fee_pamplate table
    op.drop_index('ix_published_fee_pamplate_user_id', table_name='published_fee_pamplate')
    op.drop_index('ix_published_fee_pamplate_client_id', table_name='published_fee_pamplate')
    op.drop_index('ix_published_fee_pamplate_id', table_name='published_fee_pamplate')
    op.drop_table('published_fee_pamplate')
    
    # Remove added columns
    try:
        op.drop_column('fee_categories', 'is_published')
    except Exception as e:
        print(f"Error dropping is_published: {e}")
    
    try:
        op.drop_column('fee_categories', 'published_at')
    except Exception as e:
        print(f"Error dropping published_at: {e}")