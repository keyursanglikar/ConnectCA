from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Any, List, Optional
from decimal import Decimal
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_ca, get_current_client, get_current_user
from app.models.user import User
from app.models.client import ClientMaster
from app.models.bills import Bill, BillStatus, BillItem
from app.schemas.bill import (
    BillResponse,
    BillItemResponse,
    BillStatusUpdate,
    BillCreate,
    BillUpdate
)
from app.services.fee_matching_service import FeeMatchingService
from app.services.email_service import EmailService
from app.services.bill_service import BillService
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bills", tags=["Bills"])


# ============ Bill Generation ============

@router.post("/generate/{client_id}")
async def generate_bill_for_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Generate a bill for a client from fee matches"""
    try:
        result = FeeMatchingService.generate_bill_from_matches(
            db, client_id, current_user.id
        )
        
        if "message" in result:
            return result
        
        # Notify client about new bill
        client = db.query(ClientMaster).filter(
            ClientMaster.id == client_id
        ).first()
        
        if client:
            # Get client user details
            client_user = db.query(User).filter(User.id == client.user_id).first()
            
            if client_user:
                # Send email notification
                try:
                    await EmailService.send_email(
                        to_email=client_user.email,
                        subject="New Bill Generated",
                        html_content=f"""
                        <h2>New Bill Generated</h2>
                        <p>Dear {client_user.name or 'Client'},</p>
                        <p>A new bill has been generated for you. Please login to view and accept it.</p>
                        <p>Bill Number: {result['bill'].bill_number}</p>
                        <p>Total Amount: ₹{result['grand_total']:.2f}</p>
                        <p><a href="{settings.FRONTEND_URL}/client/bills">View Bill</a></p>
                        """
                    )
                except Exception as e:
                    logger.error(f"Failed to send bill notification email: {e}")
        
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/", response_model=BillResponse)
async def create_bill(
    bill_data: BillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Create a new bill manually"""
    try:
        bill = BillService.create_bill(db, current_user.id, bill_data)
        return bill
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ============ Client Bill Views ============

@router.get("/client/my-bills", response_model=List[BillResponse])
async def get_my_bills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_client)
) -> Any:
    """Get all bills for the logged-in client"""
    # ✅ FIXED: Find client by user_id instead of email
    client = db.query(ClientMaster).filter(
        ClientMaster.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    bills = BillService.get_client_bills(db, client.id, client.ca_user_id)
    return bills


@router.get("/client/{client_id}", response_model=List[BillResponse])
async def get_client_bills(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Get all bills for a client (CA view)"""
    bills = BillService.get_client_bills(db, client_id, current_user.id)
    return bills


@router.get("/client/{client_id}/pending", response_model=List[BillResponse])
async def get_pending_client_bills(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Get pending bills for a client"""
    bills = BillService.get_client_bills(db, client_id, current_user.id, status=BillStatus.PENDING)
    return bills


# ============ Bill CRUD Operations ============

@router.get("/", response_model=List[BillResponse])
async def get_all_bills(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[BillStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Get all bills for the CA"""
    bills = BillService.get_ca_bills(db, current_user.id, skip, limit, status)
    return bills


@router.get("/{bill_id}", response_model=BillResponse)
async def get_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get a specific bill"""
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found"
        )
    
    # Check authorization
    if current_user.role == "CLIENT":
        client = db.query(ClientMaster).filter(
            ClientMaster.user_id == current_user.id
        ).first()
        if not client or bill.client_id != client.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
    elif bill.user_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    return bill


@router.put("/{bill_id}", response_model=BillResponse)
async def update_bill(
    bill_id: int,
    bill_data: BillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Update a bill"""
    bill = BillService.update_bill(db, bill_id, current_user.id, bill_data)
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found"
        )
    return bill


@router.delete("/{bill_id}")
async def delete_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Delete a bill (only if pending)"""
    bill = db.query(Bill).filter(
        Bill.id == bill_id,
        Bill.user_id == current_user.id
    ).first()
    
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found"
        )
    
    if bill.status != BillStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending bills can be deleted"
        )
    
    db.delete(bill)
    db.commit()
    
    return {"message": "Bill deleted successfully"}


# ============ Bill Status Updates ============

@router.patch("/{bill_id}/status")
async def update_bill_status(
    bill_id: int,
    status_data: BillStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_client)
) -> Any:
    """Update bill status (client accepts/rejects)"""
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found"
        )
    
    # ✅ FIXED: Verify client owns the bill using user_id
    client = db.query(ClientMaster).filter(
        ClientMaster.user_id == current_user.id
    ).first()
    
    if not client or bill.client_id != client.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    if status_data.status == BillStatus.ACCEPTED:
        bill.status = BillStatus.ACCEPTED
        bill.accepted_at = datetime.utcnow()
        
        # Notify CA
        ca_user = db.query(User).filter(User.id == bill.user_id).first()
        if ca_user:
            try:
                await EmailService.send_email(
                    to_email=ca_user.email,
                    subject=f"Bill {bill.bill_number} Accepted",
                    html_content=f"""
                    <h2>Bill Accepted</h2>
                    <p>Dear {ca_user.name or 'CA'},</p>
                    <p>Client has accepted the bill {bill.bill_number}.</p>
                    <p>Total Amount: ₹{bill.grand_total:.2f}</p>
                    <p><a href="{settings.FRONTEND_URL}/ca/bills">View Bill</a></p>
                    """
                )
            except Exception as e:
                logger.error(f"Failed to send bill acceptance email: {e}")
    
    elif status_data.status == BillStatus.REJECTED:
        bill.status = BillStatus.REJECTED
        bill.rejected_at = datetime.utcnow()
        
        # Notify CA
        ca_user = db.query(User).filter(User.id == bill.user_id).first()
        if ca_user:
            try:
                await EmailService.send_email(
                    to_email=ca_user.email,
                    subject=f"Bill {bill.bill_number} Rejected",
                    html_content=f"""
                    <h2>Bill Rejected</h2>
                    <p>Dear {ca_user.name or 'CA'},</p>
                    <p>Client has rejected the bill {bill.bill_number}.</p>
                    <p>Please contact the client for more details.</p>
                    """
                )
            except Exception as e:
                logger.error(f"Failed to send bill rejection email: {e}")
    
    db.commit()
    db.refresh(bill)
    
    return {"message": f"Bill {status_data.status.value} successfully"}


@router.post("/{bill_id}/accept")
async def accept_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_client)
) -> Any:
    """Accept a bill"""
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found"
        )
    
    # ✅ FIXED: Verify client owns the bill using user_id
    client = db.query(ClientMaster).filter(
        ClientMaster.user_id == current_user.id
    ).first()
    
    if not client or bill.client_id != client.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    if bill.status != BillStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bill is not pending"
        )
    
    bill.status = BillStatus.ACCEPTED
    bill.accepted_at = datetime.utcnow()
    db.commit()
    db.refresh(bill)
    
    return {"message": "Bill accepted successfully"}


@router.post("/{bill_id}/reject")
async def reject_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_client)
) -> Any:
    """Reject a bill"""
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found"
        )
    
    # ✅ FIXED: Verify client owns the bill using user_id
    client = db.query(ClientMaster).filter(
        ClientMaster.user_id == current_user.id
    ).first()
    
    if not client or bill.client_id != client.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    if bill.status != BillStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bill is not pending"
        )
    
    bill.status = BillStatus.REJECTED
    bill.rejected_at = datetime.utcnow()
    db.commit()
    db.refresh(bill)
    
    return {"message": "Bill rejected successfully"}


@router.post("/{bill_id}/mark-paid")
async def mark_bill_paid(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Mark a bill as paid (CA only)"""
    bill = db.query(Bill).filter(
        Bill.id == bill_id,
        Bill.user_id == current_user.id
    ).first()
    
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found"
        )
    
    if bill.status != BillStatus.ACCEPTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bill must be accepted before marking as paid"
        )
    
    bill.status = BillStatus.PAID
    bill.paid_at = datetime.utcnow()
    db.commit()
    db.refresh(bill)
    
    return {"message": "Bill marked as paid successfully"}


@router.get("/stats")
async def get_bill_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Get bill statistics for the CA"""
    stats = BillService.get_bill_stats(db, current_user.id)
    return stats


# ============ Bill Items ============

@router.get("/{bill_id}/items", response_model=List[BillItemResponse])
async def get_bill_items(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get items for a bill"""
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found"
        )
    
    # Check authorization
    if current_user.role == "CLIENT":
        client = db.query(ClientMaster).filter(
            ClientMaster.user_id == current_user.id
        ).first()
        if not client or bill.client_id != client.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
    elif bill.user_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    items = BillService.get_bill_items(db, bill_id)
    return items