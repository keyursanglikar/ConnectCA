# app/api/v1/fees.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Any, List, Optional
from decimal import Decimal
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_ca, get_current_user, get_current_client
from app.models.user import User
from app.models.client import ClientMaster
from app.models.fee import FeeCategory, PublishedFeePamplate
from app.schemas.fee import (
    FeeCategoryCreate,
    FeeCategoryUpdate,
    FeeCategoryResponse,
    PublishFeePamplateRequest,
    PublishedFeePamplateResponse,
    ClientFeePamplateResponse,
    PublishedFeeItem,
    FeePamplateStatusResponse
)
from app.services.fee_service import FeeService

router = APIRouter(prefix="/fees", tags=["Fees"])


# ============ Fee Category Management ============

@router.post("/initialize")
async def initialize_fees(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Initialize default fee categories for the CA - safe to call multiple times"""
    result = FeeService.initialize_default_fees(db, current_user.id)
    
    return {
        "message": "Default fees initialized successfully",
        "created_count": result["created_count"],
        "existing_count": result["existing_count"],
        "total_default_fees": result["total"]
    }


@router.post("/categories", response_model=FeeCategoryResponse)
async def create_fee_category(
    fee_data: FeeCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Create a new fee category"""
    try:
        fee = FeeService.create_fee_category(db, current_user.id, fee_data)
        return fee
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/categories", response_model=List[FeeCategoryResponse])
async def get_fee_categories(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_published: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Get all fee categories for the CA"""
    fees = FeeService.get_fee_categories(
        db, 
        current_user.id, 
        skip=skip, 
        limit=limit,
        search=search,
        is_active=is_active,
        is_published=is_published
    )
    return fees


@router.get("/categories/{fee_id}", response_model=FeeCategoryResponse)
async def get_fee_category(
    fee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Get a specific fee category"""
    fee = FeeService.get_fee_category(db, fee_id, current_user.id)
    if not fee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fee category not found"
        )
    return fee


@router.put("/categories/{fee_id}", response_model=FeeCategoryResponse)
async def update_fee_category(
    fee_id: int,
    fee_data: FeeCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Update a fee category"""
    fee = FeeService.update_fee_category(db, fee_id, current_user.id, fee_data)
    if not fee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fee category not found"
        )
    return fee


@router.delete("/categories/{fee_id}")
async def delete_fee_category(
    fee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Delete a fee category (only custom fees can be deleted)"""
    try:
        deleted = FeeService.delete_fee_category(db, fee_id, current_user.id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fee category not found"
            )
        return {"message": "Fee category deleted successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ============ Fee Pamplate Publishing ============

@router.post("/publish", response_model=PublishedFeePamplateResponse)
async def publish_fee_pamplate(
    request: PublishFeePamplateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Publish fee pamplate for a client"""
    try:
        published = FeeService.publish_fee_pamplate(
            db, 
            current_user.id, 
            request.client_id, 
            request.fee_ids
        )
        
        # Convert fee_data to PublishedFeeItem objects
        fee_items = []
        for item in published.fee_data:
            fee_items.append(
                PublishedFeeItem(
                    id=item["id"],
                    name=item["name"],
                    code=item["code"],
                    description=item.get("description"),
                    base_fee=Decimal(str(item["base_fee"])),
                    gst_rate=Decimal(str(item["gst_rate"])),
                    fee_type=item["fee_type"],
                    keywords=item.get("keywords", [])
                )
            )
        
        return PublishedFeePamplateResponse(
            id=published.id,
            client_id=published.client_id,
            user_id=published.user_id,
            fee_data=fee_items,
            total_fee=published.total_fee,
            total_gst=published.total_gst,
            grand_total=published.grand_total,
            is_active=published.is_active,
            is_viewed=published.is_viewed,
            viewed_at=published.viewed_at,
            accepted_at=published.accepted_at,
            rejected_at=published.rejected_at,
            created_at=published.created_at,
            updated_at=published.updated_at
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/client/{client_id}/pamplate", response_model=PublishedFeePamplateResponse)
async def get_client_published_pamplate(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Get latest published fee pamplate for a client"""
    pamplate = FeeService.get_client_published_pamplate(db, client_id, current_user.id)
    if not pamplate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No published fee pamplate found for this client"
        )
    
    fee_items = []
    for item in pamplate.fee_data:
        fee_items.append(
            PublishedFeeItem(
                id=item["id"],
                name=item["name"],
                code=item["code"],
                description=item.get("description"),
                base_fee=Decimal(str(item["base_fee"])),
                gst_rate=Decimal(str(item["gst_rate"])),
                fee_type=item["fee_type"],
                keywords=item.get("keywords", [])
            )
        )
    
    return PublishedFeePamplateResponse(
        id=pamplate.id,
        client_id=pamplate.client_id,
        user_id=pamplate.user_id,
        fee_data=fee_items,
        total_fee=pamplate.total_fee,
        total_gst=pamplate.total_gst,
        grand_total=pamplate.grand_total,
        is_active=pamplate.is_active,
        is_viewed=pamplate.is_viewed,
        viewed_at=pamplate.viewed_at,
        accepted_at=pamplate.accepted_at,
        rejected_at=pamplate.rejected_at,
        created_at=pamplate.created_at,
        updated_at=pamplate.updated_at
    )


@router.get("/client/{client_id}/pamplates", response_model=List[PublishedFeePamplateResponse])
async def get_client_published_pamplates(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Get all published fee pamplates for a client"""
    pamplates = FeeService.get_client_published_pamplates(db, client_id, current_user.id)
    results = []
    
    for pamplate in pamplates:
        fee_items = []
        for item in pamplate.fee_data:
            fee_items.append(
                PublishedFeeItem(
                    id=item["id"],
                    name=item["name"],
                    code=item["code"],
                    description=item.get("description"),
                    base_fee=Decimal(str(item["base_fee"])),
                    gst_rate=Decimal(str(item["gst_rate"])),
                    fee_type=item["fee_type"],
                    keywords=item.get("keywords", [])
                )
            )
        
        results.append(
            PublishedFeePamplateResponse(
                id=pamplate.id,
                client_id=pamplate.client_id,
                user_id=pamplate.user_id,
                fee_data=fee_items,
                total_fee=pamplate.total_fee,
                total_gst=pamplate.total_gst,
                grand_total=pamplate.grand_total,
                is_active=pamplate.is_active,
                is_viewed=pamplate.is_viewed,
                viewed_at=pamplate.viewed_at,
                accepted_at=pamplate.accepted_at,
                rejected_at=pamplate.rejected_at,
                created_at=pamplate.created_at,
                updated_at=pamplate.updated_at
            )
        )
    
    return results


# ============ Client Viewing ============

@router.get("/my-pamplate/status", response_model=FeePamplateStatusResponse)
async def get_my_fee_pamplate_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_client)
) -> Any:
    """Get the status of fee pamplate for the logged-in client"""
    # Find client by user_id
    client = db.query(ClientMaster).filter(
        ClientMaster.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Get the latest pamplate
    pamplate = FeeService.get_client_published_pamplate(db, client.id, client.ca_user_id)
    
    if not pamplate:
        return FeePamplateStatusResponse(
            has_pamplate=False,
            has_accepted=False,
            has_rejected=False,
            pamplate_id=None,
            accepted_at=None,
            rejected_at=None,
            version=0,
            new_items_count=0,
            total_items_count=0
        )
    
    return FeePamplateStatusResponse(
        has_pamplate=True,
        has_accepted=pamplate.accepted_at is not None,
        has_rejected=pamplate.rejected_at is not None,
        pamplate_id=pamplate.id,
        accepted_at=pamplate.accepted_at,
        rejected_at=pamplate.rejected_at,
        version=1,  # You can add version tracking later
        new_items_count=0,
        total_items_count=len(pamplate.fee_data)
    )


@router.get("/my-pamplate", response_model=ClientFeePamplateResponse)
async def get_my_fee_pamplate(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_client)
) -> Any:
    """Get the latest fee pamplate for the logged-in client"""
    # Find client by user_id
    client = db.query(ClientMaster).filter(
        ClientMaster.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Get published pamplate
    pamplate = FeeService.get_client_published_pamplate(db, client.id, client.ca_user_id)
    
    if not pamplate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No fee pamplate published for you yet"
        )
    
    # Mark as viewed
    FeeService.mark_pamplate_viewed(db, pamplate.id, client.id)
    
    # Convert fee_data to PublishedFeeItem objects
    fee_items = []
    for item in pamplate.fee_data:
        fee_items.append(
            PublishedFeeItem(
                id=item["id"],
                name=item["name"],
                code=item["code"],
                description=item.get("description"),
                base_fee=Decimal(str(item["base_fee"])),
                gst_rate=Decimal(str(item["gst_rate"])),
                fee_type=item["fee_type"],
                keywords=item.get("keywords", [])
            )
        )
    
    # Get client name and email
    client_user = db.query(User).filter(User.id == client.user_id).first()
    client_name = client_user.name if client_user else client.business_name or "Client"
    client_email = client_user.email if client_user else ""
    
    # Build response
    return ClientFeePamplateResponse(
        id=pamplate.id,
        client_id=client.id,
        client_name=client_name,
        client_email=client_email,
        published_at=pamplate.created_at,
        fee_data=fee_items,
        total_fee=pamplate.total_fee,
        total_gst=pamplate.total_gst,
        grand_total=pamplate.grand_total,
        is_viewed=pamplate.is_viewed,
        is_accepted=pamplate.accepted_at is not None,
        accepted_at=pamplate.accepted_at,
        rejected_at=pamplate.rejected_at
    )


@router.post("/my-pamplate/{pamplate_id}/accept")
async def accept_my_fee_pamplate(
    pamplate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_client)
) -> Any:
    """Accept the fee pamplate by client"""
    # Find client by user_id
    client = db.query(ClientMaster).filter(
        ClientMaster.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    pamplate = FeeService.accept_fee_pamplate(db, pamplate_id, client.id)
    if not pamplate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fee pamplate not found"
        )
    
    return {"message": "Fee pamplate accepted successfully"}


@router.post("/my-pamplate/{pamplate_id}/reject")
async def reject_my_fee_pamplate(
    pamplate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_client)
) -> Any:
    """Reject the fee pamplate by client"""
    # Find client by user_id
    client = db.query(ClientMaster).filter(
        ClientMaster.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    pamplate = FeeService.reject_fee_pamplate(db, pamplate_id, client.id)
    if not pamplate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fee pamplate not found"
        )
    
    return {"message": "Fee pamplate rejected successfully"}