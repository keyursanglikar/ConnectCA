from sqlalchemy.orm import Session
from datetime import datetime
from app.models.notification import Notification
from app.models.user import User


class NotificationService:
    """Notification service for creating and managing notifications"""

    @staticmethod
    def create_notification(
        db: Session,
        user_id: int,
        type: str,
        message: str,
        data: dict = None
    ) -> Notification:
        """Create a new notification"""
        notification = Notification(
            user_id=user_id,
            type=type,
            message=message,
            data=data or {}
        )
        
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    @staticmethod
    def create_client_login_notification(
        db: Session,
        ca_user_id: int,
        client_name: str,
        client_email: str
    ) -> Notification:
        """Create notification for CA when client logs in"""
        message = f"Client {client_name} has logged in"
        data = {
            "client_name": client_name,
            "client_email": client_email,
            "login_time": datetime.utcnow().isoformat()
        }
        return NotificationService.create_notification(
            db,
            ca_user_id,
            "login",
            message,
            data
        )

    @staticmethod
    def create_document_upload_notification(
        db: Session,
        ca_user_id: int,
        client_name: str,
        document_name: str
    ) -> Notification:
        """Create notification for CA when client uploads a document"""
        message = f"{client_name} uploaded document: {document_name}"
        data = {
            "client_name": client_name,
            "document_name": document_name,
            "upload_time": datetime.utcnow().isoformat()
        }
        return NotificationService.create_notification(
            db,
            ca_user_id,
            "document",
            message,
            data
        )

    @staticmethod
    def create_payment_notification(
        db: Session,
        ca_user_id: int,
        client_name: str,
        amount: float
    ) -> Notification:
        """Create notification for CA when client makes a payment"""
        message = f"Payment of ₹{amount} received from {client_name}"
        data = {
            "client_name": client_name,
            "amount": amount,
            "payment_time": datetime.utcnow().isoformat()
        }
        return NotificationService.create_notification(
            db,
            ca_user_id,
            "payment",
            message,
            data
        )

    @staticmethod
    def get_unread_count(db: Session, user_id: int) -> int:
        """Get count of unread notifications for a user"""
        return db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.read == False
        ).count()