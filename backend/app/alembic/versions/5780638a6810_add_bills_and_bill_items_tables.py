"""Add bills and bill_items tables

Revision ID: 5780638a6810
Revises: 624615381a4e
Create Date: 2026-07-14 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '5780638a6810'
down_revision = '624615381a4e'
branch_labels = None
depends_on = None


def upgrade():
    # ============================================
    # Create bills table first
    # ============================================
    op.create_table('bills',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('bill_number', sa.String(length=50), nullable=False),
        sa.Column('status', sa.Enum('draft', 'pending', 'accepted', 'rejected', 'paid', 'cancelled'), nullable=True),
        sa.Column('total_amount', sa.DECIMAL(precision=10, scale=2), nullable=True),
        sa.Column('gst_amount', sa.DECIMAL(precision=10, scale=2), nullable=True),
        sa.Column('grand_total', sa.DECIMAL(precision=10, scale=2), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('accepted_at', sa.DateTime(), nullable=True),
        sa.Column('rejected_at', sa.DateTime(), nullable=True),
        sa.Column('paid_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['client_id'], ['client_masters.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_bills_id', 'bills', ['id'])
    op.create_index('ix_bills_bill_number', 'bills', ['bill_number'], unique=True)
    op.create_index('ix_bills_client_id', 'bills', ['client_id'])
    op.create_index('ix_bills_user_id', 'bills', ['user_id'])
    
    # ============================================
    # Create bill_items table WITHOUT foreign keys first
    # Then add foreign keys separately
    # ============================================
    op.create_table('bill_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('bill_id', sa.Integer(), nullable=False),
        sa.Column('fee_category_id', sa.Integer(), nullable=True),
        sa.Column('document_id', sa.Integer(), nullable=True),
        sa.Column('description', sa.String(length=500), nullable=False),
        sa.Column('amount', sa.DECIMAL(precision=10, scale=2), nullable=False),
        sa.Column('gst_amount', sa.DECIMAL(precision=10, scale=2), nullable=False),
        sa.Column('total_amount', sa.DECIMAL(precision=10, scale=2), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_bill_items_id', 'bill_items', ['id'])
    op.create_index('ix_bill_items_bill_id', 'bill_items', ['bill_id'])
    op.create_index('ix_bill_items_fee_category_id', 'bill_items', ['fee_category_id'])
    op.create_index('ix_bill_items_document_id', 'bill_items', ['document_id'])
    
    # Now add foreign keys separately
    op.create_foreign_key(
        'fk_bill_items_bill_id',
        'bill_items', 'bills',
        ['bill_id'], ['id'],
        ondelete='CASCADE'
    )
    op.create_foreign_key(
        'fk_bill_items_fee_category_id',
        'bill_items', 'fee_categories',
        ['fee_category_id'], ['id'],
        ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_bill_items_document_id',
        'bill_items', 'documents',
        ['document_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade():
    # Drop foreign keys first
    op.drop_constraint('fk_bill_items_document_id', 'bill_items', type_='foreignkey')
    op.drop_constraint('fk_bill_items_fee_category_id', 'bill_items', type_='foreignkey')
    op.drop_constraint('fk_bill_items_bill_id', 'bill_items', type_='foreignkey')
    
    # Drop tables in reverse order
    op.drop_index('ix_bill_items_document_id', table_name='bill_items')
    op.drop_index('ix_bill_items_fee_category_id', table_name='bill_items')
    op.drop_index('ix_bill_items_bill_id', table_name='bill_items')
    op.drop_index('ix_bill_items_id', table_name='bill_items')
    op.drop_table('bill_items')
    
    op.drop_index('ix_bills_user_id', table_name='bills')
    op.drop_index('ix_bills_client_id', table_name='bills')
    op.drop_index('ix_bills_bill_number', table_name='bills')
    op.drop_index('ix_bills_id', table_name='bills')
    op.drop_table('bills')