from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class DocumentStatus(str, Enum):
    PENDING_UPLOAD = "PENDING_UPLOAD"
    UPLOADED = "UPLOADED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    RE_UPLOAD_REQUIRED = "RE_UPLOAD_REQUIRED"


class DocumentBase(BaseModel):
    client_id: int
    fy_id: int
    document_type: str = Field(..., min_length=2, max_length=100)
    file_title: str = Field(..., min_length=2, max_length=255)
    remarks: Optional[str] = None


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    status: Optional[DocumentStatus] = None
    remarks: Optional[str] = None
    gdrive_file_id: Optional[str] = None
    gdrive_web_link: Optional[str] = None


class DocumentUploadRequest(BaseModel):
    client_id: int
    fy_id: int
    document_type: str
    file_title: str
    remarks: Optional[str] = None
    # ⭐ Classification results from frontend
    bill_as: Optional[str] = "ignore"
    detected_label: Optional[str] = None
    confidence: Optional[str] = None


class DocumentResponse(BaseModel):
    id: int
    user_id: int
    client_id: int
    fy_id: int
    document_type: str
    file_title: str
    file_name: str
    file_size: Optional[int] = None
    file_type: Optional[str] = None
    status: DocumentStatus
    gdrive_file_id: Optional[str] = None
    gdrive_web_link: Optional[str] = None
    local_path: Optional[str] = None
    remarks: Optional[str] = None
    uploaded_at: datetime
    updated_at: datetime
    uploaded_by: str
    # ⭐ Classification results - read from database
    bill_as: str = "ignore"
    detected_label: Optional[str] = None
    confidence: Optional[str] = None
    fee_confirmed: bool
    fee_confirmed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DocumentStatusUpdate(BaseModel):
    status: DocumentStatus
    remarks: Optional[str] = None