from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Any, List, Optional, Dict
from datetime import datetime, timedelta
from decimal import Decimal

from app.core.database import get_db
from app.core.dependencies import get_current_ca, get_current_super_admin
from app.models.user import User
from app.models.client import ClientMaster, ClientStatus
from app.models.document import Document, DocumentStatus
from app.models.bills import Bill, BillStatus
from app.models.fee import FeeCategory
from app.models.notification import Notification
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/ca")
async def get_ca_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Get CA dashboard statistics"""
    try:
        # Total clients
        total_clients = db.query(ClientMaster).filter(
            ClientMaster.ca_user_id == current_user.id
        ).count()
        
        # Active clients
        active_clients = db.query(ClientMaster).filter(
            ClientMaster.ca_user_id == current_user.id,
            ClientMaster.status == ClientStatus.ACTIVE
        ).count()
        
        # Pending documents
        pending_documents = db.query(Document).join(
            ClientMaster, ClientMaster.id == Document.client_id
        ).filter(
            ClientMaster.ca_user_id == current_user.id,
            Document.status.in_([DocumentStatus.PENDING_UPLOAD, DocumentStatus.UPLOADED])
        ).count()
        
        # Total revenue (from paid bills)
        total_revenue = db.query(Bill).join(
            ClientMaster, ClientMaster.id == Bill.client_id
        ).filter(
            ClientMaster.ca_user_id == current_user.id,
            Bill.status == BillStatus.PAID
        ).with_entities(Bill.grand_total).all()
        
        revenue_sum = sum(bill.grand_total for bill in total_revenue) if total_revenue else Decimal('0.00')
        
        # Recent activities (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        # Get recent client creations
        recent_clients = db.query(ClientMaster).filter(
            ClientMaster.ca_user_id == current_user.id,
            ClientMaster.created_at >= thirty_days_ago
        ).order_by(ClientMaster.created_at.desc()).limit(5).all()
        
        # Get recent document uploads
        recent_docs = db.query(Document).join(
            ClientMaster, ClientMaster.id == Document.client_id
        ).filter(
            ClientMaster.ca_user_id == current_user.id,
            Document.uploaded_at >= thirty_days_ago
        ).order_by(Document.uploaded_at.desc()).limit(5).all()
        
        # Get recent notifications
        recent_notifications = db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.created_at >= thirty_days_ago
        ).order_by(Notification.created_at.desc()).limit(10).all()
        
        # Build recent activities
        activities = []
        
        for client in recent_clients:
            activities.append({
                "type": "client_created",
                "title": f"New client: {client.user.name if client.user else 'Unknown'}",
                "time": client.created_at.isoformat(),
                "status": "completed"
            })
        
        for doc in recent_docs:
            client = db.query(ClientMaster).filter(ClientMaster.id == doc.client_id).first()
            activities.append({
                "type": "document_uploaded",
                "title": f"Document uploaded: {doc.file_title} by {client.user.name if client and client.user else 'Client'}",
                "time": doc.uploaded_at.isoformat(),
                "status": "pending"
            })
        
        # Sort activities by time (newest first)
        activities.sort(key=lambda x: x["time"], reverse=True)
        activities = activities[:10]
        
        # Get monthly stats (last 6 months)
        monthly_stats = []
        for i in range(6):
            month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(days=30*i)
            month_end = month_start + timedelta(days=30)
            
            clients_count = db.query(ClientMaster).filter(
                ClientMaster.ca_user_id == current_user.id,
                ClientMaster.created_at >= month_start,
                ClientMaster.created_at < month_end
            ).count()
            
            revenue = db.query(Bill).join(
                ClientMaster, ClientMaster.id == Bill.client_id
            ).filter(
                ClientMaster.ca_user_id == current_user.id,
                Bill.status == BillStatus.PAID,
                Bill.paid_at >= month_start,
                Bill.paid_at < month_end
            ).with_entities(Bill.grand_total).all()
            
            revenue_sum_month = sum(bill.grand_total for bill in revenue) if revenue else Decimal('0.00')
            
            monthly_stats.append({
                "month": month_start.strftime("%b %Y"),
                "clients": clients_count,
                "revenue": float(revenue_sum_month)
            })
        
        return {
            "total_clients": total_clients,
            "active_clients": active_clients,
            "pending_documents": pending_documents,
            "total_revenue": float(revenue_sum),
            "client_growth": active_clients - (total_clients - active_clients) if total_clients > 0 else 0,
            "revenue_growth": 0,  # Calculate from previous month
            "recent_activities": activities,
            "monthly_stats": monthly_stats,
            "notifications_count": len([n for n in recent_notifications if not n.read])
        }
        
    except Exception as e:
        logger.error(f"Error fetching CA dashboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch dashboard data"
        )


@router.get("/super-admin")
async def get_super_admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
) -> Any:
    """Get Super Admin dashboard statistics"""
    try:
        # Total users by role
        total_cas = db.query(User).filter(User.role == "CA").count()
        total_clients = db.query(User).filter(User.role == "CLIENT").count()
        total_users = db.query(User).count()
        
        # Total documents
        total_documents = db.query(Document).count()
        pending_documents = db.query(Document).filter(
            Document.status.in_([DocumentStatus.PENDING_UPLOAD, DocumentStatus.UPLOADED])
        ).count()
        
        # Total revenue
        total_revenue = db.query(Bill).filter(
            Bill.status == BillStatus.PAID
        ).with_entities(Bill.grand_total).all()
        revenue_sum = sum(bill.grand_total for bill in total_revenue) if total_revenue else Decimal('0.00')
        
        # Recent registrations
        recent_users = db.query(User).order_by(User.created_at.desc()).limit(10).all()
        
        return {
            "total_users": total_users,
            "total_cas": total_cas,
            "total_clients": total_clients,
            "total_documents": total_documents,
            "pending_documents": pending_documents,
            "total_revenue": float(revenue_sum),
            "recent_users": [
                {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "role": user.role,
                    "created_at": user.created_at.isoformat()
                }
                for user in recent_users
            ]
        }
        
    except Exception as e:
        logger.error(f"Error fetching Super Admin dashboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch dashboard data"
        )


@router.get("/notifications")
async def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca),
    limit: int = Query(20, ge=1, le=100),
    read: Optional[bool] = None,
    skip: int = Query(0, ge=0)
) -> Any:
    """Get notifications for the current user"""
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if read is not None:
        query = query.filter(Notification.read == read)
    
    notifications = query.order_by(
        Notification.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return [
        {
            "id": n.id,
            "type": n.type,
            "message": n.message,
            "data": n.data,
            "read": n.read,
            "created_at": n.created_at.isoformat()
        }
        for n in notifications
    ]


@router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Mark a notification as read"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    notification.read = True
    db.commit()
    
    return {"message": "Notification marked as read"}


@router.patch("/notifications/read-all")
async def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Mark all notifications as read"""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False
    ).update({"read": True})
    
    db.commit()
    
    return {"message": "All notifications marked as read"}