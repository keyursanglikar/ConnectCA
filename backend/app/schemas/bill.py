from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from enum import Enum


class BillStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    PAID = "paid"
    CANCELLED = "cancelled"


# ============ Bill Item Schemas ============

class BillItemBase(BaseModel):
    description: str = Field(..., min_length=1, max_length=500)
    amount: Decimal = Field(..., ge=0)
    gst_amount: Decimal = Field(..., ge=0)
    total_amount: Decimal = Field(..., ge=0)
    fee_category_id: Optional[int] = None
    document_id: Optional[int] = None


class BillItemCreate(BillItemBase):
    pass


class BillItemResponse(BillItemBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ Bill Schemas ============

class BillBase(BaseModel):
    client_id: int
    bill_number: str = Field(..., min_length=1, max_length=50)
    status: BillStatus = BillStatus.PENDING
    total_amount: Decimal = Field(0.00, ge=0)
    gst_amount: Decimal = Field(0.00, ge=0)
    grand_total: Decimal = Field(0.00, ge=0)
    notes: Optional[str] = None


class BillCreate(BaseModel):
    client_id: int
    items: List[BillItemCreate] = []
    notes: Optional[str] = None


class BillUpdate(BaseModel):
    status: Optional[BillStatus] = None
    notes: Optional[str] = None
    items: Optional[List[BillItemCreate]] = None


class BillResponse(BillBase):
    id: int
    user_id: int
    accepted_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    items: List[BillItemResponse] = []

    class Config:
        from_attributes = True


class BillStatusUpdate(BaseModel):
    status: BillStatus


class BillAcceptRequest(BaseModel):
    accept: bool
    notes: Optional[str] = None