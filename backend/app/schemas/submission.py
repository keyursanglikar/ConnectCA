# from pydantic import BaseModel
# from typing import Optional, List
# from datetime import datetime
# from decimal import Decimal


# class SubmissionStatus(str):
#     PENDING = "PENDING"
#     REVIEWING = "REVIEWING"
#     APPROVED = "APPROVED"
#     REJECTED = "REJECTED"
#     BILL_SENT = "BILL_SENT"
#     BILL_ACCEPTED = "BILL_ACCEPTED"
#     BILL_REJECTED = "BILL_REJECTED"


# class DocumentSubmissionData(BaseModel):
#     id: Optional[int] = None
#     file_title: str
#     document_type: str
#     bill_as: str = "ignore"
#     detected_label: Optional[str] = None
#     confidence: Optional[str] = None


# class AdjustmentData(BaseModel):
#     house_properties: int = 0
#     residential_status: str = "resident"
#     missed_streams: List[str] = []


# class EstimatedBillLine(BaseModel):
#     label: str
#     amount: float
#     kind: str
#     source: Optional[str] = None


# class EstimatedBillData(BaseModel):
#     lines: List[EstimatedBillLine]
#     total: float


# class SubmissionListResponse(BaseModel):
#     id: int
#     client_id: int
#     client_name: str
#     client_email: str
#     status: str
#     total_estimate: Decimal
#     document_count: int
#     created_at: datetime
#     updated_at: datetime
#     bill_id: Optional[int] = None


# class SubmissionResponse(BaseModel):
#     id: int
#     client_id: int
#     client_name: str
#     client_email: str
#     status: str
#     documents: List[dict] = []
#     adjustments: dict = {}
#     estimated_bill: dict = {}
#     total_estimate: Decimal
#     ca_notes: Optional[str] = None
#     bill_id: Optional[int] = None
#     created_at: datetime
#     updated_at: datetime
#     reviewed_at: Optional[datetime] = None


# class SubmissionStatusUpdate(BaseModel):
#     status: str
#     notes: Optional[str] = None


# class BillGenerateRequest(BaseModel):
#     notes: Optional[str] = None







# app/schemas/submission.py
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal


class SubmissionStatus(str):
    PENDING = "PENDING"
    REVIEWING = "REVIEWING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    BILL_GENERATED = "BILL_GENERATED"
    BILL_SENT = "BILL_SENT"
    BILL_CONFIRMED = "BILL_CONFIRMED"
    CONFIRMED = "CONFIRMED"


# ============ Document Submission Data ============
class DocumentSubmissionData(BaseModel):
    document_id: Optional[int] = None
    file_title: str
    document_type: str
    bill_as: str = "ignore"
    detected_label: Optional[str] = None
    confidence: Optional[str] = None
    status: Optional[str] = None
    uploaded_at: Optional[datetime] = None


class AdjustmentData(BaseModel):
    house_properties: int = 0
    residential_status: str = "resident"
    missed_streams: List[str] = []


class EstimatedBillLine(BaseModel):
    label: str
    amount: float
    kind: str
    source: Optional[str] = None


class EstimatedBillData(BaseModel):
    lines: List[EstimatedBillLine]
    total: float


# ============ Create Submission ============
class ClientSubmissionCreate(BaseModel):
    client_id: int
    documents_data: List[Dict[str, Any]] = []
    adjustments: AdjustmentData = AdjustmentData()
    estimated_bill: EstimatedBillData = EstimatedBillData(lines=[], total=0)
    total_estimate: Decimal = Decimal('0.00')


# ============ Update Submission Status ============
class SubmissionStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


# ============ Bill Generate Request ============
class BillGenerateRequest(BaseModel):
    notes: Optional[str] = None
    items: Optional[List[Dict[str, Any]]] = None


# ============ Submission List Response ============
class SubmissionListResponse(BaseModel):
    id: int
    client_id: int
    client_name: str
    client_email: str
    status: str
    total_estimate: Decimal
    document_count: int
    created_at: datetime
    updated_at: datetime
    bill_id: Optional[int] = None

    class Config:
        from_attributes = True


# ============ Submission Detail Response ============
class SubmissionResponse(BaseModel):
    id: int
    client_id: int
    client_name: str
    client_email: str
    status: str
    documents: List[Dict[str, Any]] = []
    adjustments: Dict[str, Any] = {}
    estimated_bill: Dict[str, Any] = {}
    total_estimate: Decimal
    ca_notes: Optional[str] = None
    bill_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============ Upload Computation Request ============
class UploadComputationRequest(BaseModel):
    submission_id: int
    computation_link: str
    file_name: Optional[str] = None


# ============ Edit Bill Request ============
class EditBillRequest(BaseModel):
    bill_id: int
    items: List[Dict[str, Any]]
    notes: Optional[str] = None


# ============ Submission Status Response ============
class SubmissionStatusResponse(BaseModel):
    id: int
    status: str
    updated_at: datetime
    message: str


# ============ Client Submission Response (for client view) ============
class ClientSubmissionResponse(BaseModel):
    id: int
    status: str
    documents: List[Dict[str, Any]]
    estimated_bill: Dict[str, Any]
    total_estimate: Decimal
    bill_id: Optional[int] = None
    bill_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True