# app/alembic/versions/b5932cf9bbca_add_document_submission_fields.py
"""add_document_submission_fields

Revision ID: b5932cf9bbca
Revises: 20240716_add_version_and_accepted_item_ids
Create Date: 2024-07-16 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import JSON

# revision identifiers, used by Alembic.
revision: str = 'b5932cf9bbca'
down_revision: Union[str, None] = '20240716_add_version_and_accepted_item_ids'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ============ Add new columns to client_submissions ============
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Get existing columns in client_submissions
    columns = [col['name'] for col in inspector.get_columns('client_submissions')]
    
    # Add computation_link
    if 'computation_link' not in columns:
        op.add_column('client_submissions', 
            sa.Column('computation_link', sa.String(500), nullable=True)
        )
    
    # Add computation_uploaded_at
    if 'computation_uploaded_at' not in columns:
        op.add_column('client_submissions', 
            sa.Column('computation_uploaded_at', sa.DateTime(), nullable=True)
        )
    
    # Add computation_file_name
    if 'computation_file_name' not in columns:
        op.add_column('client_submissions', 
            sa.Column('computation_file_name', sa.String(255), nullable=True)
        )
    
    # Add bill_draft_data
    if 'bill_draft_data' not in columns:
        op.add_column('client_submissions', 
            sa.Column('bill_draft_data', JSON, nullable=True)
        )
    
    # Add bill_final_data
    if 'bill_final_data' not in columns:
        op.add_column('client_submissions', 
            sa.Column('bill_final_data', JSON, nullable=True)
        )
    
    # Add bill_generated_at
    if 'bill_generated_at' not in columns:
        op.add_column('client_submissions', 
            sa.Column('bill_generated_at', sa.DateTime(), nullable=True)
        )
    
    # Add bill_confirmed_at
    if 'bill_confirmed_at' not in columns:
        op.add_column('client_submissions', 
            sa.Column('bill_confirmed_at', sa.DateTime(), nullable=True)
        )
    
    # Add bill_confirmed_by_client
    if 'bill_confirmed_by_client' not in columns:
        op.add_column('client_submissions', 
            sa.Column('bill_confirmed_by_client', sa.Boolean(), default=False, nullable=True)
        )
    
    # ============ Add new columns to documents ============
    doc_columns = [col['name'] for col in inspector.get_columns('documents')]
    
    # Add source column
    if 'source' not in doc_columns:
        op.add_column('documents', 
            sa.Column('source', sa.String(20), default='client', nullable=True)
        )
    
    # Add onedrive_link
    if 'onedrive_link' not in doc_columns:
        op.add_column('documents', 
            sa.Column('onedrive_link', sa.String(500), nullable=True)
        )
    
    # Add onedrive_file_id
    if 'onedrive_file_id' not in doc_columns:
        op.add_column('documents', 
            sa.Column('onedrive_file_id', sa.String(255), nullable=True)
        )
    
    # Add is_view_only
    if 'is_view_only' not in doc_columns:
        op.add_column('documents', 
            sa.Column('is_view_only', sa.Boolean(), default=True, nullable=True)
        )
    
    # Add submission_id
    if 'submission_id' not in doc_columns:
        op.add_column('documents', 
            sa.Column('submission_id', sa.Integer(), nullable=True)
        )
        # Add foreign key constraint
        op.create_foreign_key(
            'fk_documents_submission_id', 
            'documents', 
            'client_submissions', 
            ['submission_id'], 
            ['id'],
            ondelete='SET NULL'
        )


def downgrade() -> None:
    # Drop foreign key first
    op.drop_constraint('fk_documents_submission_id', 'documents', type_='foreignkey')
    
    # Drop columns from documents
    op.drop_column('documents', 'submission_id')
    op.drop_column('documents', 'is_view_only')
    op.drop_column('documents', 'onedrive_file_id')
    op.drop_column('documents', 'onedrive_link')
    op.drop_column('documents', 'source')
    
    # Drop columns from client_submissions
    op.drop_column('client_submissions', 'bill_confirmed_by_client')
    op.drop_column('client_submissions', 'bill_confirmed_at')
    op.drop_column('client_submissions', 'bill_generated_at')
    op.drop_column('client_submissions', 'bill_final_data')
    op.drop_column('client_submissions', 'bill_draft_data')
    op.drop_column('client_submissions', 'computation_file_name')
    op.drop_column('client_submissions', 'computation_uploaded_at')
    op.drop_column('client_submissions', 'computation_link')