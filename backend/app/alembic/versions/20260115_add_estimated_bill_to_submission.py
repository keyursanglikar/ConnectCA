"""Add estimated_bill to submission

Revision ID: 20260115_add_estimated_bill
Revises: 
Create Date: 2026-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20260115_add_estimated_bill'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Add estimated_bill column to submissions table
    op.add_column('submissions',
        sa.Column('estimated_bill', postgresql.JSONB, server_default='{}', nullable=False)
    )
    
    # Add total_estimate column for quick access
    op.add_column('submissions',
        sa.Column('total_estimate', sa.Float, server_default='0', nullable=False)
    )
    
    # Add onedrive_upload_status column
    op.add_column('submissions',
        sa.Column('onedrive_upload_status', sa.String(50), server_default='PENDING', nullable=False)
    )
    
    # Add document_links column
    op.add_column('submissions',
        sa.Column('document_links', postgresql.JSONB, server_default='[]', nullable=False)
    )
    
    # Add onedrive_folder_url column
    op.add_column('submissions',
        sa.Column('onedrive_folder_url', sa.String(500), nullable=True)
    )

def downgrade():
    op.drop_column('submissions', 'estimated_bill')
    op.drop_column('submissions', 'total_estimate')
    op.drop_column('submissions', 'onedrive_upload_status')
    op.drop_column('submissions', 'document_links')
    op.drop_column('submissions', 'onedrive_folder_url')