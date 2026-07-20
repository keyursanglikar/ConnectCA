from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Any, List, Optional
from pathlib import Path
import os
from datetime import datetime
from pydantic import BaseModel
from decimal import Decimal

from app.core.database import get_db
from app.core.dependencies import get_current_client
from app.models.user import User
from app.models.client import ClientMaster
from app.models.fy_master import FYMaster
from app.models.document import Document
from app.models.client_submission import ClientSubmission, SubmissionStatus
from app.models.notification import Notification
from app.schemas.document import DocumentResponse, DocumentUploadRequest
from app.services.document_service import DocumentService
from app.services.fee_matching_service import FeeMatchingService
from app.services.fee_service import FeeService
from app.services.email_service import EmailService
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/client", tags=["Client"])


# ============ SCHEMAS FOR SEND TO CA ============
class AdjustmentData(BaseModel):
    house_properties: int = 0
    residential_status: str = "resident"
    missed_streams: List[str] = []


class BillLineData(BaseModel):
    label: str
    amount: float
    kind: str
    source: Optional[str] = None


class EstimatedBillData(BaseModel):
    lines: List[BillLineData]
    total: float


class SendToCARequest(BaseModel):
    document_ids: List[int] = []  # Send document IDs instead of full data
    adjustments: AdjustmentData
    estimated_bill: EstimatedBillData


@router.get("/profile")
async def get_client_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_client)
) -> Any:
    """Get the profile of the logged-in client"""
    client = db.query(ClientMaster).filter(
        ClientMaster.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    return {
        "id": client.id,
        "user_id": client.user_id,
        "ca_user_id": client.ca_user_id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "username": current_user.username,
        "client_type": client.client_type,
        "pan_number": client.pan_number,
        "aadhaar_number": client.aadhaar_number,
        "address": client.address,
        "business_name": client.business_name,
        "gst_number": client.gst_number,
        "status": client.status,
        "created_at": client.created_at
    }


@router.get("/documents", response_model=List[DocumentResponse])
async def get_client_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_client)
) -> Any:
    """Get all documents for the logged-in client"""
    client = db.query(ClientMaster).filter(
        ClientMaster.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    docs = DocumentService.get_client_documents(db, client.id, client.user_id)
    return docs


@router.post("/upload-document")
async def upload_document_client(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    file_title: str = Form(...),
    bill_as: str = Form("ignore"),  # ⭐ Receive classification from frontend
    detected_label: Optional[str] = Form(None),  # ⭐ Receive detection label
    confidence: Optional[str] = Form(None),  # ⭐ Receive confidence
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_client)
) -> Any:
    """Upload a document as a client - Stores classification results once"""
    try:
        logger.info(f"Uploading document for user: {current_user.email}")
        logger.info(f"📋 Classification received - bill_as: {bill_as}, label: {detected_label}, confidence: {confidence}")
        
        client = db.query(ClientMaster).filter(
            ClientMaster.user_id == current_user.id
        ).first()
        
        if not client:
            logger.error(f"Client not found for user: {current_user.email}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client record not found. Please contact your CA."
            )
        
        logger.info(f"Client found: {client.id} - {current_user.name}")
        
        allowed_extensions = ['.pdf', '.xlsx', '.xls']
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Allowed: {', '.join(allowed_extensions)}"
            )
        
        current_fy = db.query(FYMaster).filter(
            FYMaster.status == True
        ).order_by(FYMaster.year.desc()).first()
        
        if not current_fy:
            current_fy = FYMaster(year="2024-25", status=True)
            db.add(current_fy)
            db.commit()
            db.refresh(current_fy)
        
        # ⭐ Create document with classification results
        doc_data = DocumentUploadRequest(
            client_id=client.id,
            fy_id=current_fy.id,
            document_type=document_type or file_ext.upper().replace('.', ''),
            file_title=file_title or file.filename,
            bill_as=bill_as,  # ⭐ Store classification
            detected_label=detected_label,  # ⭐ Store detection
            confidence=confidence  # ⭐ Store confidence
        )
        
        doc = DocumentService.create_document_request(db, current_user.id, doc_data)
        
        # Save file
        upload_dir = Path("uploads/documents")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        safe_filename = f"{doc.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        file_path = upload_dir / safe_filename
        
        content = await file.read()
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        file_data = {
            'filename': file.filename,
            'size': len(content),
            'type': file.content_type,
            'gdrive_file_id': None,
            'gdrive_web_link': None,
            'local_path': str(file_path)
        }
        
        updated_doc = DocumentService.upload_document(
            db, doc.id, current_user.id, file_data, uploaded_by="client"
        )
        
        # Try to match fees using the stored classification
        matched_fees = []
        try:
            match_result = FeeMatchingService.match_document_fees(
                db, doc.id, client.id, current_user.id
            )
            if match_result.get("matched_categories"):
                matched_fees = match_result["matched_categories"]
                logger.info(f"✅ Matched {len(matched_fees)} fees for document {doc.id}")
        except Exception as e:
            logger.error(f"Error matching fees: {e}")
        
        # ⭐ Return document with classification from database
        return {
            "id": updated_doc.id,
            "user_id": updated_doc.user_id,
            "client_id": updated_doc.client_id,
            "fy_id": updated_doc.fy_id,
            "document_type": updated_doc.document_type,
            "file_title": updated_doc.file_title,
            "file_name": updated_doc.file_name,
            "file_size": updated_doc.file_size,
            "file_type": updated_doc.file_type,
            "status": updated_doc.status.value if hasattr(updated_doc.status, 'value') else str(updated_doc.status),
            "gdrive_file_id": updated_doc.gdrive_file_id,
            "gdrive_web_link": updated_doc.gdrive_web_link,
            "local_path": updated_doc.local_path,
            "remarks": updated_doc.remarks,
            "uploaded_at": updated_doc.uploaded_at.isoformat() if updated_doc.uploaded_at else None,
            "updated_at": updated_doc.updated_at.isoformat() if updated_doc.updated_at else None,
            "uploaded_by": updated_doc.uploaded_by,
            # ⭐ Return stored classification
            "bill_as": updated_doc.bill_as,
            "detected_label": updated_doc.detected_label,
            "confidence": updated_doc.confidence,
            "fee_confirmed": updated_doc.fee_confirmed,
            "fee_confirmed_at": updated_doc.fee_confirmed_at.isoformat() if updated_doc.fee_confirmed_at else None,
            "matched_fees": [
                {
                    "id": mf.id,
                    "fee_category_id": mf.fee_category_id,
                    "fee_amount": float(mf.fee_amount),
                    "gst_amount": float(mf.gst_amount),
                    "total_amount": float(mf.total_amount),
                    "matched_keywords": mf.matched_keywords,
                    "match_confidence": float(mf.match_confidence),
                    "is_auto_matched": mf.is_auto_matched
                } for mf in matched_fees
            ] if matched_fees else []
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ============ SEND TO CA ENDPOINT ============
@router.post("/send-to-ca")
async def send_to_ca(
    request: SendToCARequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_client)
) -> Any:
    """Send the client's document selections and estimated bill to the CA"""
    try:
        # Get the client
        client = db.query(ClientMaster).filter(
            ClientMaster.user_id == current_user.id
        ).first()
        
        if not client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client not found"
            )
        
        ca_user = db.query(User).filter(User.id == client.ca_user_id).first()
        
        if not ca_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="CA not found for this client"
            )
        
        # ✅ Get the actual documents from the database using document_ids
        documents_data = []
        if request.document_ids:
            docs = db.query(Document).filter(
                Document.id.in_(request.document_ids),
                Document.client_id == client.id,
                Document.user_id == current_user.id
            ).all()
            
            for doc in docs:
                documents_data.append({
                    "document_id": doc.id,
                    "file_title": doc.file_title,
                    "document_type": doc.document_type,
                    "bill_as": getattr(doc, 'bill_as', 'ignore'),
                    "detected_label": getattr(doc, 'detected_label', None),
                    "confidence": getattr(doc, 'confidence', None),
                    "status": doc.status.value if hasattr(doc.status, 'value') else str(doc.status),
                    "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None
                })
        
        # ✅ CREATE SUBMISSION RECORD
        submission = ClientSubmission(
            client_id=client.id,
            ca_user_id=client.ca_user_id,
            documents_data=documents_data,
            adjustments=request.adjustments.dict(),
            estimated_bill={
                "lines": [line.dict() for line in request.estimated_bill.lines],
                "total": request.estimated_bill.total
            },
            total_estimate=request.estimated_bill.total,
            status=SubmissionStatus.PENDING,
            created_at=datetime.utcnow()
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)
        
        # ✅ Create notification for CA
        notification = Notification(
            user_id=client.ca_user_id,
            type="submission",
            message=f"New fee estimation from {current_user.name}",
            is_read=False,
            data={
                "submission_id": submission.id,
                "client_id": client.id,
                "client_name": current_user.name,
                "client_email": current_user.email,
                "total_estimate": float(request.estimated_bill.total),
                "document_count": len(documents_data)
            }
        )
        db.add(notification)
        db.commit()
        
        # Build email content
        documents_summary = "\n".join([
            f"  • {doc.get('file_title', 'Unknown')} - Bill as: {doc.get('bill_as', 'ignore')}"
            for doc in documents_data
        ]) or "No documents"
        
        bill_summary = "\n".join([
            f"  • {line.label}: ₹{line.amount}"
            for line in request.estimated_bill.lines
        ])
        
        email_body = f"""
        <h2>New Client Fee Estimation Submitted</h2>
        
        <p><strong>Client:</strong> {current_user.name} ({current_user.email})</p>
        
        <h3>📄 Documents ({len(documents_data)})</h3>
        <pre>{documents_summary}</pre>
        
        <h3>📊 Adjustments</h3>
        <ul>
            <li>House Properties: {request.adjustments.house_properties}</li>
            <li>Residential Status: {request.adjustments.residential_status}</li>
            <li>Missed Streams: {', '.join(request.adjustments.missed_streams) or 'None'}</li>
        </ul>
        
        <h3>💰 Estimated Bill</h3>
        <pre>{bill_summary}</pre>
        
        <p><strong>Total Estimate:</strong> ₹{request.estimated_bill.total}</p>
        
        <p style="margin-top: 20px;">
            <a href="{settings.FRONTEND_URL}/ca/submissions/{submission.id}" 
               style="background: #0E6E5C; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none;">
                Review Submission
            </a>
        </p>
        
        <p style="margin-top: 20px; font-size: 12px; color: #666;">
            This is an automated notification from the client fee estimator.
            Please review the documents and estimate in the system.
        </p>
        """
        
        # Send email to CA
        try:
            await EmailService.send_email(
                to_email=ca_user.email,
                subject=f"New Fee Estimation from {current_user.name}",
                html_content=email_body
            )
            logger.info(f"📧 Sent fee estimation email to CA: {ca_user.email}")
        except Exception as e:
            logger.error(f"Failed to send email to CA: {e}")
        
        return {
            "message": "Successfully sent to CA",
            "submission_id": submission.id,
            "ca_email": ca_user.email,
            "document_count": len(documents_data),
            "estimated_total": request.estimated_bill.total
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending to CA: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send to CA: {str(e)}"
        )


# ============ DELETE DOCUMENT ENDPOINT ============
@router.delete("/documents/{document_id}")
async def delete_client_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_client)
) -> Any:
    """Delete a client document"""
    # ✅ Find the document first
    doc = db.query(Document).filter(Document.id == document_id).first()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # ✅ Check if the document belongs to the client
    client = db.query(ClientMaster).filter(
        ClientMaster.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # ✅ Check if the document belongs to this client
    if doc.client_id != client.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this document"
        )
    
    # ✅ Also check if the document belongs to the user
    if doc.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this document"
        )
    
    # ✅ Delete the document file from storage
    if doc.local_path:
        try:
            file_path = Path(doc.local_path)
            if file_path.exists():
                file_path.unlink()
                logger.info(f"Deleted file: {doc.local_path}")
        except Exception as e:
            logger.error(f"Error deleting file: {e}")
    
    # ✅ Delete from database
    db.delete(doc)
    db.commit()
    
    return {"message": "Document deleted successfully"}