# app/schemas/fee.py
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Any
from datetime import datetime
from decimal import Decimal


# ============ Fee Category Schemas ============

class FeeCategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    code: str = Field(..., min_length=2, max_length=50)
    description: Optional[str] = None
    base_fee: Decimal = Field(..., ge=0)
    gst_rate: Decimal = Field(18.00, ge=0, le=100)
    keywords: List[str] = []
    fee_type: str = Field("basic", description="basic, capital_gains, business, nri, foreign_income")
    is_active: bool = True


class FeeCategoryCreate(FeeCategoryBase):
    is_system_default: bool = False


class FeeCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    code: Optional[str] = Field(None, min_length=2, max_length=50)
    description: Optional[str] = None
    base_fee: Optional[Decimal] = Field(None, ge=0)
    gst_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    keywords: Optional[List[str]] = None
    fee_type: Optional[str] = None
    is_active: Optional[bool] = None


class FeeCategoryResponse(BaseModel):
    id: int
    user_id: int
    name: str
    code: str
    description: Optional[str] = None
    base_fee: Decimal
    gst_rate: Decimal
    keywords: List[str] = []
    fee_type: str
    is_active: bool
    is_system_default: bool
    is_published: bool
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ Client Fee Match Schemas ============

class ClientFeeMatchBase(BaseModel):
    client_id: int
    fee_category_id: int
    document_id: Optional[int] = None
    fee_amount: Decimal
    gst_amount: Decimal
    total_amount: Decimal
    matched_keywords: List[str] = []
    match_confidence: Decimal = Field(0.00, ge=0, le=100)
    is_auto_matched: bool = True


class ClientFeeMatchCreate(ClientFeeMatchBase):
    pass


class ClientFeeMatchResponse(ClientFeeMatchBase):
    id: int
    is_applied: bool
    created_at: datetime
    updated_at: datetime
    fee_category: Optional[FeeCategoryResponse] = None

    class Config:
        from_attributes = True


# ============ Document Match Schemas ============

class DocumentFeeMatchRequest(BaseModel):
    document_id: int
    client_id: int


class FeeMatchResult(BaseModel):
    matched_categories: List[ClientFeeMatchResponse]
    total_fee: Decimal
    total_gst: Decimal
    grand_total: Decimal
    matched_keywords: List[str]


# ============ Published Fee Pamplate Schemas ============

class PublishedFeeItem(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str] = None
    base_fee: Decimal
    gst_rate: Decimal
    fee_type: str
    keywords: List[str] = []
    created_at: Optional[datetime] = None  # For tracking when item was added


class PublishFeePamplateRequest(BaseModel):
    client_id: int
    fee_ids: List[int]


class PublishedFeePamplateResponse(BaseModel):
    id: int
    client_id: int
    user_id: int
    fee_data: List[PublishedFeeItem]
    total_fee: Decimal
    total_gst: Decimal
    grand_total: Decimal
    is_active: bool
    is_viewed: bool
    viewed_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    version: int = 1  # Track pamphlet versions
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ Enhanced Client Fee Pamplate Response ============

class ClientFeePamplateResponse(BaseModel):
    id: int
    client_id: int
    client_name: str
    client_email: str
    published_at: datetime
    fee_data: List[PublishedFeeItem]
    total_fee: Decimal
    total_gst: Decimal
    grand_total: Decimal
    is_viewed: bool
    is_accepted: bool
    accepted_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None

    class Config:
        from_attributes = True
# ============ Fee Pamplate Status Response ============

class FeePamplateStatusResponse(BaseModel):
    has_pamplate: bool = False
    has_accepted: bool = False
    has_rejected: bool = False
    pamplate_id: Optional[int] = None
    accepted_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    version: int = 1
    new_items_count: int = 0
    total_items_count: int = 0

    class Config:
        from_attributes = True


# ============ Fee Pamplate Accept/Reject Response ============

class FeePamplateActionResponse(BaseModel):
    success: bool
    message: str
    pamplate_id: int
    action: str  # 'accepted' or 'rejected'
    action_at: datetime
    version: int


# ============ Fee Pamplate History ============

class FeePamplateHistoryItem(BaseModel):
    id: int
    version: int
    published_at: datetime
    accepted_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    total_fee: Decimal
    total_gst: Decimal
    grand_total: Decimal
    fee_count: int

    class Config:
        from_attributes = True


class FeePamplateHistoryResponse(BaseModel):
    current: Optional[FeePamplateHistoryItem] = None
    history: List[FeePamplateHistoryItem] = []


# ============ Document Classification Helper ============

class DocumentClassificationResult(BaseModel):
    status: str  # 'recognized', 'unrecognized', 'comprehensive', 'scanned', 'password', 'unsupported', 'error'
    def_label: Optional[str] = None
    confidence: Optional[str] = None  # 'high', 'medium', 'low'
    evidence: List[str] = []
    near_misses: Optional[List[dict]] = None
    bill_as: Optional[str] = None


# ============ Fee Estimate Schemas ============

class FeeEstimateLine(BaseModel):
    kind: str  # 'base', 'detected', 'manual'
    label: str
    reason: Optional[str] = None
    source: Optional[str] = None
    amount: Decimal


class FeeEstimateResponse(BaseModel):
    lines: List[FeeEstimateLine]
    total: Decimal
    document_count: int
    missed_streams_count: int
    house_properties_count: int
    residential_status: str


class ClientAdjustments(BaseModel):
    house_properties: int = 0
    residential_status: str = "resident"  # 'resident', 'nri', 'residentForeign'
    missed_streams: List[str] = []


# ============ Client Send to CA ============

class SendToCARequest(BaseModel):
    document_ids: List[int]
    adjustments: ClientAdjustments
    estimated_bill: Optional[dict] = None


class SendToCAResponse(BaseModel):
    success: bool
    message: str
    submission_id: int
    document_count: int
    estimated_total: Decimal


# ============ Bill As Options (Frontend Helper) ============

class BillAsOption(BaseModel):
    value: str
    label: str
    base: Optional[bool] = False
    component: Optional[str] = None


class MissedStreamOption(BaseModel):
    id: str
    label: str
    amount: Decimal