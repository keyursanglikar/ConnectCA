from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from enum import Enum
import re


class ClientStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    PENDING = "PENDING"
    SUSPENDED = "SUSPENDED"


class ClientType(str, Enum):
    INDIVIDUAL = "INDIVIDUAL"
    BUSINESS = "BUSINESS"
    HUF = "HUF"
    PARTNERSHIP = "PARTNERSHIP"
    COMPANY = "COMPANY"
    LLP = "LLP"


class FeeStatus(str, Enum):
    PENDING = "PENDING"
    PARTIAL = "PARTIAL"
    PAID = "PAID"
    OVERDUE = "OVERDUE"


# Base schema with common fields
class ClientBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    client_type: ClientType = ClientType.INDIVIDUAL
    pan_number: Optional[str] = Field(None, max_length=20)
    aadhaar_number: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None
    business_name: Optional[str] = Field(None, max_length=255)
    gst_number: Optional[str] = Field(None, max_length=50)
    dob: Optional[datetime] = None
    documents_required: Optional[List[str]] = []


class ClientCreate(ClientBase):
    send_credentials: bool = True
    financial_year: Optional[str] = None
    fee_amount: Optional[Decimal] = Field(None, ge=0)

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v is None or v == '':
            return v
        cleaned = re.sub(r'[\s\-\(\)\+]', '', v)
        if not re.match(r'^[0-9]{10}$', cleaned):
            raise ValueError('Phone number must be 10 digits')
        return v

    @field_validator('pan_number')
    @classmethod
    def validate_pan(cls, v):
        if v is None or v == '':
            return v
        cleaned = v.upper().strip()
        if not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', cleaned):
            raise ValueError('PAN number must be in format ABCDE1234F')
        return cleaned

    @field_validator('gst_number')
    @classmethod
    def validate_gst(cls, v):
        if v is None or v == '':
            return v
        cleaned = v.upper().strip()
        if not re.match(r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$', cleaned):
            raise ValueError('Invalid GST number format (e.g., 22ABCDE1234F1Z5)')
        return cleaned

    @field_validator('dob')
    @classmethod
    def validate_dob(cls, v):
        if v is None or v == '':
            return v
        if isinstance(v, str):
            try:
                if 'T' in v:
                    return datetime.fromisoformat(v)
                else:
                    return datetime.fromisoformat(f"{v}T00:00:00")
            except ValueError:
                raise ValueError('Invalid date format. Use YYYY-MM-DD')
        return v


class ClientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    client_type: Optional[ClientType] = None
    pan_number: Optional[str] = Field(None, max_length=20)
    aadhaar_number: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None
    business_name: Optional[str] = Field(None, max_length=255)
    gst_number: Optional[str] = Field(None, max_length=50)
    dob: Optional[datetime] = None
    status: Optional[ClientStatus] = None
    total_fee: Optional[Decimal] = None
    fee_status: Optional[FeeStatus] = None
    fee_confirmed: Optional[bool] = None


class ClientResponse(BaseModel):
    id: int
    user_id: int
    ca_user_id: int
    username: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    client_type: ClientType
    pan_number: Optional[str] = None
    aadhaar_number: Optional[str] = None
    address: Optional[str] = None
    business_name: Optional[str] = None
    gst_number: Optional[str] = None
    dob: Optional[datetime] = None
    status: ClientStatus
    is_verified: bool
    total_fee: Decimal
    paid_fee: Decimal
    pending_fee: Decimal
    fee_status: FeeStatus
    fee_confirmed: bool
    fee_confirmed_at: Optional[datetime] = None
    documents_required: List[str] = []
    documents_uploaded: List[str] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ClientStatusUpdate(BaseModel):
    status: ClientStatus


class ClientFeeUpdate(BaseModel):
    total_fee: Decimal = Field(..., ge=0)
    fee_status: Optional[FeeStatus] = None


class ClientFeeConfirmation(BaseModel):
    confirmed: bool