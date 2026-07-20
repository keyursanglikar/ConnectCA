"""add_onedrive_columns

Revision ID: 20260717_1245
Revises: b5932cf9bbca
Create Date: 2026-07-17 12:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '20260717_1245'
down_revision = 'b5932cf9bbca'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Check if columns exist before adding them
    connection = op.get_bind()
    
    # Get existing columns
    result = connection.execute(
        "SHOW COLUMNS FROM client_submissions"
    ).fetchall()
    
    existing_columns = [row[0] for row in result]
    
    # Add OneDrive columns if they don't exist
    if 'onedrive_folder_path' not in existing_columns:
        op.add_column('client_submissions', sa.Column('onedrive_folder_path', sa.String(length=500), nullable=True))
    
    if 'onedrive_folder_id' not in existing_columns:
        op.add_column('client_submissions', sa.Column('onedrive_folder_id', sa.String(length=255), nullable=True))
    
    if 'onedrive_folder_url' not in existing_columns:
        op.add_column('client_submissions', sa.Column('onedrive_folder_url', sa.String(length=1000), nullable=True))
    
    if 'onedrive_uploaded_at' not in existing_columns:
        op.add_column('client_submissions', sa.Column('onedrive_uploaded_at', sa.DateTime(), nullable=True))
    
    if 'document_links' not in existing_columns:
        op.add_column('client_submissions', sa.Column('document_links', sa.JSON(), nullable=True))
    
    if 'onedrive_upload_status' not in existing_columns:
        op.add_column('client_submissions', sa.Column('onedrive_upload_status', sa.String(length=50), nullable=True, server_default='PENDING'))
    
    # Add bill tracking columns if they don't exist
    if 'bill_sent_at' not in existing_columns:
        op.add_column('client_submissions', sa.Column('bill_sent_at', sa.DateTime(), nullable=True))
    
    if 'bill_confirmed_at' not in existing_columns:
        op.add_column('client_submissions', sa.Column('bill_confirmed_at', sa.DateTime(), nullable=True))
    
    if 'bill_confirmed_by_client' not in existing_columns:
        op.add_column('client_submissions', sa.Column('bill_confirmed_by_client', sa.Boolean(), nullable=True, server_default='0'))
    
    # Also add computation columns if missing
    if 'computation_link' not in existing_columns:
        op.add_column('client_submissions', sa.Column('computation_link', sa.String(length=500), nullable=True))
    
    if 'computation_uploaded_at' not in existing_columns:
        op.add_column('client_submissions', sa.Column('computation_uploaded_at', sa.DateTime(), nullable=True))
    
    if 'computation_file_name' not in existing_columns:
        op.add_column('client_submissions', sa.Column('computation_file_name', sa.String(length=255), nullable=True))


def downgrade() -> None:
    # Remove columns if needed
    op.drop_column('client_submissions', 'onedrive_upload_status')
    op.drop_column('client_submissions', 'document_links')
    op.drop_column('client_submissions', 'onedrive_uploaded_at')
    op.drop_column('client_submissions', 'onedrive_folder_url')
    op.drop_column('client_submissions', 'onedrive_folder_id')
    op.drop_column('client_submissions', 'onedrive_folder_path')
    op.drop_column('client_submissions', 'bill_confirmed_by_client')
    op.drop_column('client_submissions', 'bill_confirmed_at')
    op.drop_column('client_submissions', 'bill_sent_at')
    op.drop_column('client_submissions', 'computation_file_name')
    op.drop_column('client_submissions', 'computation_uploaded_at')
    op.drop_column('client_submissions', 'computation_link')