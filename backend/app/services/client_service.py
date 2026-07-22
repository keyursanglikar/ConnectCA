# from typing import Optional, List
# from sqlalchemy.orm import Session
# from sqlalchemy import or_
# from decimal import Decimal
# import secrets
# import string
# from datetime import datetime
# import logging

# from app.models.client import ClientMaster, ClientStatus, ClientType, FeeStatus
# from app.models.user import User, UserRole
# from app.models.fy_master import FYMaster
# from app.models.document import Document
# from app.schemas.client import ClientCreate, ClientUpdate
# from app.core.security import get_password_hash

# logger = logging.getLogger(__name__)


# class ClientService:
#     """Client management service"""

#     @staticmethod
#     def create_client(
#         db: Session,
#         ca_user: User,
#         client_data: ClientCreate
#     ) -> tuple:
#         """Create a new client for a CA"""
#         # Generate username from email
#         username = client_data.email.split('@')[0]
        
#         # Check if user already exists with this email
#         existing_user = db.query(User).filter(
#             or_(
#                 User.email == client_data.email,
#                 User.username == username
#             )
#         ).first()
        
#         if existing_user:
#             raise ValueError("User with this email already exists")
        
#         # ✅ Generate random password (8 characters for simplicity)
#         password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(8))
#         hashed_password = get_password_hash(password)
        
#         # ✅ LOG the password for debugging
#         logger.info(f"🔑 CLIENT CREATED: {client_data.email}")
#         logger.info(f"   Password: {password}")
#         logger.info(f"   Hash: {hashed_password[:30]}...")
        
#         # Create the client user account
#         client_user = User(
#             username=username,
#             name=client_data.name,
#             email=client_data.email,
#             hashed_password=hashed_password,
#             role=UserRole.CLIENT,
#             is_active=True,
#             is_verified=True,  # ✅ Auto-verify client on creation
#             phone=client_data.phone
#         )
#         db.add(client_user)
#         db.commit()
#         db.refresh(client_user)
        
#         # Create client_master
#         db_client = ClientMaster(
#             user_id=client_user.id,
#             ca_user_id=ca_user.id,
#             client_type=client_data.client_type,
#             pan_number=client_data.pan_number,
#             aadhaar_number=client_data.aadhaar_number,
#             address=client_data.address,
#             business_name=client_data.business_name,
#             gst_number=client_data.gst_number,
#             dob=client_data.dob,
#             status=ClientStatus.PENDING,
#             is_verified=True,  # ✅ Auto-verify client on creation
#             documents_required=client_data.documents_required or [],
#             total_fee=client_data.fee_amount or Decimal('0.00'),
#             pending_fee=client_data.fee_amount or Decimal('0.00'),
#             fee_status=FeeStatus.PENDING if client_data.fee_amount else FeeStatus.PENDING
#         )
        
#         db.add(db_client)
#         db.commit()
#         db.refresh(db_client)
        
#         logger.info(f"✅ Client created: {client_data.email} (ID: {client_user.id})")
        
#         return db_client, password

#     @staticmethod
#     def get_client(db: Session, client_id: int, ca_user_id: int) -> Optional[ClientMaster]:
#         """Get a client by ID for a specific CA"""
#         return db.query(ClientMaster).filter(
#             ClientMaster.id == client_id,
#             ClientMaster.ca_user_id == ca_user_id
#         ).first()

#     @staticmethod
#     def get_clients(
#         db: Session,
#         ca_user_id: int,
#         skip: int = 0,
#         limit: int = 100,
#         search: Optional[str] = None,
#         status: Optional[ClientStatus] = None,
#         fee_status: Optional[FeeStatus] = None
#     ) -> List[ClientMaster]:
#         """Get all clients for a CA with filters"""
#         query = db.query(ClientMaster).filter(ClientMaster.ca_user_id == ca_user_id)
        
#         # Join with User table for search
#         if search:
#             query = query.join(User, User.id == ClientMaster.user_id).filter(
#                 or_(
#                     User.name.ilike(f"%{search}%"),
#                     User.email.ilike(f"%{search}%"),
#                     User.phone.ilike(f"%{search}%"),
#                     ClientMaster.pan_number.ilike(f"%{search}%"),
#                     ClientMaster.business_name.ilike(f"%{search}%")
#                 )
#             )
        
#         if status:
#             query = query.filter(ClientMaster.status == status)
        
#         if fee_status:
#             query = query.filter(ClientMaster.fee_status == fee_status)
        
#         return query.offset(skip).limit(limit).all()

#     @staticmethod
#     def update_client(
#         db: Session,
#         client_id: int,
#         ca_user_id: int,
#         client_data: ClientUpdate
#     ) -> Optional[ClientMaster]:
#         """Update a client"""
#         db_client = ClientService.get_client(db, client_id, ca_user_id)
#         if not db_client:
#             return None
        
#         update_data = client_data.dict(exclude_unset=True)
#         for key, value in update_data.items():
#             if key == 'total_fee':
#                 # Update fee tracking
#                 old_fee = db_client.total_fee
#                 db_client.total_fee = value
#                 db_client.pending_fee = value - db_client.paid_fee
#                 if db_client.pending_fee == 0:
#                     db_client.fee_status = FeeStatus.PAID
#                 elif db_client.pending_fee < old_fee:
#                     db_client.fee_status = FeeStatus.PARTIAL
#             elif key == 'fee_status':
#                 db_client.fee_status = value
#             elif key in ['name', 'phone']:
#                 # Update User table for name and phone
#                 user = db.query(User).filter(User.id == db_client.user_id).first()
#                 if user:
#                     setattr(user, key, value)
#             else:
#                 setattr(db_client, key, value)
        
#         db.commit()
#         db.refresh(db_client)
#         return db_client

#     @staticmethod
#     def update_client_status(
#         db: Session,
#         client_id: int,
#         ca_user_id: int,
#         status: ClientStatus
#     ) -> Optional[ClientMaster]:
#         """Update client status"""
#         db_client = ClientService.get_client(db, client_id, ca_user_id)
#         if not db_client:
#             return None
        
#         db_client.status = status
#         db.commit()
#         db.refresh(db_client)
#         return db_client

#     @staticmethod
#     def confirm_fee(
#         db: Session,
#         client_id: int,
#         ca_user_id: int,
#         confirmed: bool
#     ) -> Optional[ClientMaster]:
#         """Confirm fee payment for client"""
#         db_client = ClientService.get_client(db, client_id, ca_user_id)
#         if not db_client:
#             return None
        
#         db_client.fee_confirmed = confirmed
#         db_client.fee_confirmed_at = datetime.utcnow() if confirmed else None
        
#         if confirmed:
#             db_client.status = ClientStatus.ACTIVE
        
#         db.commit()
#         db.refresh(db_client)
#         return db_client

#     @staticmethod
#     def delete_client(
#         db: Session,
#         client_id: int,
#         ca_user_id: int
#     ) -> bool:
#         """Delete a client"""
#         db_client = ClientService.get_client(db, client_id, ca_user_id)
#         if not db_client:
#             return False
        
#         # Also delete the associated user
#         user = db.query(User).filter(User.id == db_client.user_id).first()
#         if user:
#             db.delete(user)
        
#         db.delete(db_client)
#         db.commit()
#         return True






from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_
from decimal import Decimal
import secrets
import string
from datetime import datetime
import logging

from app.models.client import ClientMaster, ClientStatus, ClientType, FeeStatus
from app.models.user import User, UserRole
from app.models.fy_master import FYMaster
from app.models.document import Document
from app.schemas.client import ClientCreate, ClientUpdate
from app.core.security import get_password_hash, verify_password

logger = logging.getLogger(__name__)


class ClientService:
    """Client management service"""

    @staticmethod
    def generate_secure_password(length: int = 10) -> str:
        """
        Generate a secure random password with mix of letters, digits, and special characters
        """
        # Mix of uppercase, lowercase, digits, and special characters
        characters = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(characters) for _ in range(length))
        return password

    @staticmethod
    def create_client(
        db: Session,
        ca_user: User,
        client_data: ClientCreate
    ) -> tuple:
        """Create a new client for a CA"""
        # Generate username from email
        username = client_data.email.split('@')[0]
        
        # Check if user already exists with this email
        existing_user = db.query(User).filter(
            or_(
                User.email == client_data.email,
                User.username == username
            )
        ).first()
        
        if existing_user:
            raise ValueError("User with this email already exists")
        
        # ✅ Generate secure password
        password = ClientService.generate_secure_password()
        
        # ✅ Hash the password
        hashed_password = get_password_hash(password)
        
        # ✅ CRITICAL: Verify the hash matches the password immediately
        if not verify_password(password, hashed_password):
            logger.error(f"❌ CRITICAL: Password hash verification failed for {client_data.email}")
            raise ValueError("Password hashing failed - please try again")
        
        # ✅ Log the credentials (for debugging - remove in production)
        logger.info(f"🔑 CLIENT CREATED: {client_data.email}")
        logger.info(f"   Password: {password}")
        logger.info(f"   Hash: {hashed_password[:30]}...")
        logger.info(f"   Hash verification: {'✅ Passed' if verify_password(password, hashed_password) else '❌ Failed'}")
        
        # Create the client user account
        client_user = User(
            username=username,
            name=client_data.name,
            email=client_data.email,
            hashed_password=hashed_password,
            role=UserRole.CLIENT,
            is_active=True,
            is_verified=True,  # ✅ Auto-verify client on creation
            phone=client_data.phone
        )
        db.add(client_user)
        db.commit()
        db.refresh(client_user)
        
        # Create client_master
        db_client = ClientMaster(
            user_id=client_user.id,
            ca_user_id=ca_user.id,
            client_type=client_data.client_type,
            pan_number=client_data.pan_number,
            aadhaar_number=client_data.aadhaar_number,
            address=client_data.address,
            business_name=client_data.business_name,
            gst_number=client_data.gst_number,
            dob=client_data.dob,
            status=ClientStatus.PENDING,
            is_verified=True,
            documents_required=client_data.documents_required or [],
            total_fee=client_data.fee_amount or Decimal('0.00'),
            pending_fee=client_data.fee_amount or Decimal('0.00'),
            fee_status=FeeStatus.PENDING if client_data.fee_amount else FeeStatus.PENDING
        )
        
        db.add(db_client)
        db.commit()
        db.refresh(db_client)
        
        logger.info(f"✅ Client created successfully: {client_data.email} (ID: {client_user.id})")
        
        return db_client, password

    @staticmethod
    def get_client(db: Session, client_id: int, ca_user_id: int) -> Optional[ClientMaster]:
        """Get a client by ID for a specific CA"""
        return db.query(ClientMaster).filter(
            ClientMaster.id == client_id,
            ClientMaster.ca_user_id == ca_user_id
        ).first()

    @staticmethod
    def get_clients(
        db: Session,
        ca_user_id: int,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        status: Optional[ClientStatus] = None,
        fee_status: Optional[FeeStatus] = None
    ) -> List[ClientMaster]:
        """Get all clients for a CA with filters"""
        query = db.query(ClientMaster).filter(ClientMaster.ca_user_id == ca_user_id)
        
        # Join with User table for search
        if search:
            query = query.join(User, User.id == ClientMaster.user_id).filter(
                or_(
                    User.name.ilike(f"%{search}%"),
                    User.email.ilike(f"%{search}%"),
                    User.phone.ilike(f"%{search}%"),
                    ClientMaster.pan_number.ilike(f"%{search}%"),
                    ClientMaster.business_name.ilike(f"%{search}%")
                )
            )
        
        if status:
            query = query.filter(ClientMaster.status == status)
        
        if fee_status:
            query = query.filter(ClientMaster.fee_status == fee_status)
        
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def update_client(
        db: Session,
        client_id: int,
        ca_user_id: int,
        client_data: ClientUpdate
    ) -> Optional[ClientMaster]:
        """Update a client"""
        db_client = ClientService.get_client(db, client_id, ca_user_id)
        if not db_client:
            return None
        
        update_data = client_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            if key == 'total_fee':
                # Update fee tracking
                old_fee = db_client.total_fee
                db_client.total_fee = value
                db_client.pending_fee = value - db_client.paid_fee
                if db_client.pending_fee == 0:
                    db_client.fee_status = FeeStatus.PAID
                elif db_client.pending_fee < old_fee:
                    db_client.fee_status = FeeStatus.PARTIAL
            elif key == 'fee_status':
                db_client.fee_status = value
            elif key in ['name', 'phone']:
                # Update User table for name and phone
                user = db.query(User).filter(User.id == db_client.user_id).first()
                if user:
                    setattr(user, key, value)
            else:
                setattr(db_client, key, value)
        
        db.commit()
        db.refresh(db_client)
        return db_client

    @staticmethod
    def update_client_status(
        db: Session,
        client_id: int,
        ca_user_id: int,
        status: ClientStatus
    ) -> Optional[ClientMaster]:
        """Update client status"""
        db_client = ClientService.get_client(db, client_id, ca_user_id)
        if not db_client:
            return None
        
        db_client.status = status
        db.commit()
        db.refresh(db_client)
        return db_client

    @staticmethod
    def confirm_fee(
        db: Session,
        client_id: int,
        ca_user_id: int,
        confirmed: bool
    ) -> Optional[ClientMaster]:
        """Confirm fee payment for client"""
        db_client = ClientService.get_client(db, client_id, ca_user_id)
        if not db_client:
            return None
        
        db_client.fee_confirmed = confirmed
        db_client.fee_confirmed_at = datetime.utcnow() if confirmed else None
        
        if confirmed:
            db_client.status = ClientStatus.ACTIVE
        
        db.commit()
        db.refresh(db_client)
        return db_client

    @staticmethod
    def delete_client(
        db: Session,
        client_id: int,
        ca_user_id: int
    ) -> bool:
        """Delete a client"""
        db_client = ClientService.get_client(db, client_id, ca_user_id)
        if not db_client:
            return False
        
        # Also delete the associated user
        user = db.query(User).filter(User.id == db_client.user_id).first()
        if user:
            db.delete(user)
        
        db.delete(db_client)
        db.commit()
        return True