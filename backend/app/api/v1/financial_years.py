from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.fy_master import FYMaster
from app.models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/financial-years", tags=["Financial Years"])


class FYResponse(BaseModel):
    id: int
    year: str
    status: bool

    class Config:
        from_attributes = True


@router.get("/", response_model=List[FYResponse])
async def get_financial_years(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get all financial years"""
    years = db.query(FYMaster).filter(FYMaster.status == True).order_by(FYMaster.year.desc()).all()
    return years