from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Any, List, Optional, Dict
from decimal import Decimal
from datetime import datetime
import asyncio
import os
import shutil
from pathlib import Path

from app.core.database import get_db
from app.core.dependencies import get_current_ca, get_current_user, get_current_client
from app.models.user import User
from app.models.client import ClientStatus, FeeStatus
from app.models.fy_master import FYMaster
from app.models.document import Document, DocumentStatus
from app.schemas.client import (
    ClientCreate, 
    ClientUpdate, 
    ClientResponse,
    ClientStatusUpdate,
    ClientFeeUpdate,
    ClientFeeConfirmation
)
from app.schemas.document import (
    DocumentResponse,
    DocumentUploadRequest,
    DocumentStatusUpdate
)
from app.services.client_service import ClientService
from app.services.document_service import DocumentService
from app.services.email_service import EmailService
from app.services.fee_matching_service import FeeMatchingService
import logging

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/clients", tags=["Clients"])


@router.post("/", response_model=ClientResponse)
async def create_client(
    client_data: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Create a new client for the CA"""
    try:
        # Check if financial year exists
        if client_data.financial_year:
            fy = db.query(FYMaster).filter(FYMaster.year == client_data.financial_year).first()
            if not fy:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Financial year {client_data.financial_year} not found"
                )
        
        client, password = ClientService.create_client(db, current_user, client_data)
        
        # Get user data for response
        user = db.query(User).filter(User.id == client.user_id).first()
        
        # Prepare response with user data
        response_data = {
            "id": client.id,
            "user_id": client.user_id,
            "ca_user_id": client.ca_user_id,
            "username": user.username if user else None,
            "name": user.name if user else None,
            "email": user.email if user else None,
            "phone": user.phone if user else None,
            "client_type": client.client_type,
            "pan_number": client.pan_number,
            "aadhaar_number": client.aadhaar_number,
            "address": client.address,
            "business_name": client.business_name,
            "gst_number": client.gst_number,
            "dob": client.dob,
            "status": client.status,
            "is_verified": client.is_verified,
            "total_fee": client.total_fee,
            "paid_fee": client.paid_fee,
            "pending_fee": client.pending_fee,
            "fee_status": client.fee_status,
            "fee_confirmed": client.fee_confirmed,
            "fee_confirmed_at": client.fee_confirmed_at,
            "documents_required": client.documents_required or [],
            "documents_uploaded": client.documents_uploaded or [],
            "created_at": client.created_at,
            "updated_at": client.updated_at
        }
        
        # Send credentials email if requested
        if client_data.send_credentials:
            # Send email asynchronously (non-blocking)
            asyncio.create_task(
                EmailService.send_client_credentials(
                    to_email=client_data.email,
                    name=client_data.name,
                    username=user.username,
                    password=password,
                    ca_email=current_user.email,
                    ca_name=current_user.name or "CA Firm",
                    ca_phone=current_user.phone
                )
            )
            logger.info(f"📧 Credentials queued for {client_data.email}")
        
        return response_data
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/", response_model=List[Dict[str, Any]])
async def get_clients(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    status: Optional[ClientStatus] = None,
    fee_status: Optional[FeeStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Get all clients for the CA with user details"""
    clients = ClientService.get_clients(
        db, 
        current_user.id, 
        skip=skip, 
        limit=limit,
        search=search,
        status=status,
        fee_status=fee_status
    )
    
    # Format response with user data
    result = []
    for client in clients:
        user = db.query(User).filter(User.id == client.user_id).first()
        result.append({
            "id": client.id,
            "user_id": client.user_id,
            "ca_user_id": client.ca_user_id,
            "username": user.username if user else None,
            "name": user.name if user else None,
            "email": user.email if user else None,
            "phone": user.phone if user else None,
            "client_type": client.client_type,
            "pan_number": client.pan_number,
            "aadhaar_number": client.aadhaar_number,
            "address": client.address,
            "business_name": client.business_name,
            "gst_number": client.gst_number,
            "dob": client.dob,
            "status": client.status,
            "is_verified": client.is_verified,
            "total_fee": client.total_fee,
            "paid_fee": client.paid_fee,
            "pending_fee": client.pending_fee,
            "fee_status": client.fee_status,
            "fee_confirmed": client.fee_confirmed,
            "fee_confirmed_at": client.fee_confirmed_at,
            "documents_required": client.documents_required or [],
            "documents_uploaded": client.documents_uploaded or [],
            "created_at": client.created_at,
            "updated_at": client.updated_at
        })
    
    return result


@router.get("/{client_id}", response_model=Dict[str, Any])
async def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Get a specific client with user details"""
    client = ClientService.get_client(db, client_id, current_user.id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    user = db.query(User).filter(User.id == client.user_id).first()
    
    return {
        "id": client.id,
        "user_id": client.user_id,
        "ca_user_id": client.ca_user_id,
        "username": user.username if user else None,
        "name": user.name if user else None,
        "email": user.email if user else None,
        "phone": user.phone if user else None,
        "client_type": client.client_type,
        "pan_number": client.pan_number,
        "aadhaar_number": client.aadhaar_number,
        "address": client.address,
        "business_name": client.business_name,
        "gst_number": client.gst_number,
        "dob": client.dob,
        "status": client.status,
        "is_verified": client.is_verified,
        "total_fee": client.total_fee,
        "paid_fee": client.paid_fee,
        "pending_fee": client.pending_fee,
        "fee_status": client.fee_status,
        "fee_confirmed": client.fee_confirmed,
        "fee_confirmed_at": client.fee_confirmed_at,
        "documents_required": client.documents_required or [],
        "documents_uploaded": client.documents_uploaded or [],
        "created_at": client.created_at,
        "updated_at": client.updated_at
    }


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: int,
    client_data: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Update a client"""
    client = ClientService.update_client(db, client_id, current_user.id, client_data)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    return client


@router.patch("/{client_id}/status", response_model=ClientResponse)
async def update_client_status(
    client_id: int,
    status_data: ClientStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Update client status"""
    client = ClientService.update_client_status(
        db, 
        client_id, 
        current_user.id, 
        status_data.status
    )
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    return client


@router.patch("/{client_id}/fee", response_model=ClientResponse)
async def update_client_fee(
    client_id: int,
    fee_data: ClientFeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Update client fee amount"""
    client = ClientService.update_client(
        db, 
        client_id, 
        current_user.id, 
        ClientUpdate(total_fee=fee_data.total_fee, fee_status=fee_data.fee_status)
    )
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    return client


@router.post("/{client_id}/confirm-fee", response_model=ClientResponse)
async def confirm_client_fee(
    client_id: int,
    confirmation: ClientFeeConfirmation,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Confirm fee payment for client"""
    client = ClientService.confirm_fee(db, client_id, current_user.id, confirmation.confirmed)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    return client


@router.delete("/{client_id}")
async def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Delete a client"""
    deleted = ClientService.delete_client(db, client_id, current_user.id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    return {"message": "Client deleted successfully"}