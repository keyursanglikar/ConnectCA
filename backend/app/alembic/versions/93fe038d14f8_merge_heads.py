"""merge_heads

Revision ID: 93fe038d14f8
Revises: 20260717_1245
Create Date: 2026-07-17 14:52:32.998626

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '93fe038d14f8'
down_revision: Union[str, None] = '20260717_1245'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
