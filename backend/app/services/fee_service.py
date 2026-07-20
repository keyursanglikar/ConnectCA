# app/services/fee_service.py
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional, Dict, Any
from decimal import Decimal
from datetime import datetime

from app.models.fee import FeeCategory, PublishedFeePamplate, ClientFeeMatch
from app.models.client import ClientMaster
from app.schemas.fee import FeeCategoryCreate, FeeCategoryUpdate


class FeeService:
    
    # ============ DEFAULT FEE DEFINITIONS (Matches HTML) ============
    DEFAULT_FEES = [
        {
            "name": "Basic ITR - Salary/House Property/Other Sources",
            "code": "BASIC_ITR",
            "description": "Basic ITR filing for salary, house property (up to 2), and other sources",
            "base_fee": 500,
            "gst_rate": 18,
            "fee_type": "basic",
            "keywords": ["salary", "house property", "other sources", "basic", "itr", "form 16"]
        },
        {
            "name": "Additional House Property (beyond 2)",
            "code": "HOUSE_PROPERTY_EXTRA",
            "description": "Each additional house property beyond the first 2",
            "base_fee": 100,
            "gst_rate": 18,
            "fee_type": "basic",
            "keywords": ["house property", "extra property", "third house", "beyond 2"]
        },
        {
            "name": "Capital Gains - Immovable Property",
            "code": "CAPITAL_GAINS_IMMOVABLE",
            "description": "Capital gains from sale of immovable property (land, building, etc.)",
            "base_fee": 200,
            "gst_rate": 18,
            "fee_type": "capital_gains",
            "keywords": ["property", "land", "building", "immovable", "capital gain", "sale deed"]
        },
        {
            "name": "Capital Gains - Equity/Debt/Mutual Funds",
            "code": "CAPITAL_GAINS_EQUITY",
            "description": "Capital gains from equity shares, debt securities, and mutual funds",
            "base_fee": 300,
            "gst_rate": 18,
            "fee_type": "capital_gains",
            "keywords": ["equity", "shares", "stocks", "mutual fund", "capital gain", "stcg", "ltcg"]
        },
        {
            "name": "Capital Gains - Other (F&O, etc.)",
            "code": "CAPITAL_GAINS_OTHER",
            "description": "Capital gains from futures and options (F&O) trading",
            "base_fee": 300,
            "gst_rate": 18,
            "fee_type": "capital_gains",
            "keywords": ["f&o", "futures", "options", "derivatives", "turnover", "mtm"]
        },
        {
            "name": "Business Income - Without Accounts",
            "code": "BUSINESS_NO_ACCOUNTS",
            "description": "Business income under presumptive taxation (without full accounts)",
            "base_fee": 500,
            "gst_rate": 18,
            "fee_type": "business",
            "keywords": ["presumptive", "business", "turnover", "gross receipt", "44ad", "44ada"]
        },
        {
            "name": "Business Income - With Accounts & Financials",
            "code": "BUSINESS_WITH_ACCOUNTS",
            "description": "Business income with full books of accounts and financials",
            "base_fee": 700,
            "gst_rate": 18,
            "fee_type": "business",
            "keywords": ["balance sheet", "profit and loss", "accounts", "financials", "audit"]
        },
        {
            "name": "Non-Resident Indian (NRI)",
            "code": "NRI",
            "description": "Additional fee for Non-Resident Indian clients",
            "base_fee": 500,
            "gst_rate": 18,
            "fee_type": "nri",
            "keywords": ["nri", "non-resident", "foreign", "overseas", "remittance"]
        },
        {
            "name": "Resident with Foreign Income",
            "code": "FOREIGN_INCOME",
            "description": "Resident with foreign income (DTAA / FTC / Form 67)",
            "base_fee": 750,
            "gst_rate": 18,
            "fee_type": "foreign_income",
            "keywords": ["foreign income", "dtaa", "ftc", "form 67", "global income", "foreign assets"]
        }
    ]

    @staticmethod
    def initialize_default_fees(db: Session, user_id: int) -> dict:
        """
        Initialize default fee categories for a CA.
        This will ONLY add fees that don't already exist.
        Safe to call multiple times - will not create duplicates.
        Returns dict with created_count and existing_count
        """
        created_count = 0
        existing_count = 0
        
        for fee_data in FeeService.DEFAULT_FEES:
            # Check if this default fee already exists for this user
            existing = db.query(FeeCategory).filter(
                FeeCategory.user_id == user_id,
                FeeCategory.code == fee_data["code"],
                FeeCategory.is_system_default == True
            ).first()
            
            if existing:
                existing_count += 1
                continue
            
            # Create new default fee
            fee = FeeCategory(
                user_id=user_id,
                name=fee_data["name"],
                code=fee_data["code"],
                description=fee_data.get("description", ""),
                base_fee=Decimal(str(fee_data["base_fee"])),
                gst_rate=Decimal(str(fee_data["gst_rate"])),
                keywords=fee_data.get("keywords", []),
                fee_type=fee_data["fee_type"],
                is_system_default=True,
                is_active=True,
                is_published=False
            )
            db.add(fee)
            created_count += 1
        
        db.commit()
        
        print(f"✅ Default fees initialized: {created_count} created, {existing_count} already existed")
        
        return {
            "created_count": created_count,
            "existing_count": existing_count,
            "total": created_count + existing_count
        }

    @staticmethod
    def get_default_fees(db: Session, user_id: int) -> List[FeeCategory]:
        """Get all default fees for a user"""
        return db.query(FeeCategory).filter(
            FeeCategory.user_id == user_id,
            FeeCategory.is_system_default == True
        ).order_by(FeeCategory.id).all()

    @staticmethod
    def get_custom_fees(db: Session, user_id: int) -> List[FeeCategory]:
        """Get all custom (non-default) fees for a user"""
        return db.query(FeeCategory).filter(
            FeeCategory.user_id == user_id,
            FeeCategory.is_system_default == False
        ).order_by(FeeCategory.created_at.desc()).all()

    @staticmethod
    def create_fee_category(db: Session, user_id: int, fee_data: FeeCategoryCreate) -> FeeCategory:
        """Create a new CUSTOM fee category (not default)"""
        # Check for existing fee with same code (default or custom)
        existing = db.query(FeeCategory).filter(
            FeeCategory.user_id == user_id,
            FeeCategory.code == fee_data.code
        ).first()
        
        if existing:
            raise ValueError(f"Fee category with code '{fee_data.code}' already exists")
        
        # Create as custom fee (not default)
        fee = FeeCategory(
            user_id=user_id,
            name=fee_data.name,
            code=fee_data.code,
            description=fee_data.description,
            base_fee=fee_data.base_fee,
            gst_rate=fee_data.gst_rate,
            keywords=fee_data.keywords,
            fee_type=fee_data.fee_type,
            is_active=fee_data.is_active,
            is_system_default=False,  # Custom fee
            is_published=False
        )
        
        db.add(fee)
        db.commit()
        db.refresh(fee)
        return fee

    @staticmethod
    def get_fee_categories(
        db: Session, 
        user_id: int, 
        skip: int = 0, 
        limit: int = 100,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        is_published: Optional[bool] = None
    ) -> List[FeeCategory]:
        """Get all fee categories for a CA with filters"""
        query = db.query(FeeCategory).filter(FeeCategory.user_id == user_id)
        
        if search:
            query = query.filter(
                or_(
                    FeeCategory.name.ilike(f"%{search}%"),
                    FeeCategory.code.ilike(f"%{search}%"),
                    FeeCategory.description.ilike(f"%{search}%")
                )
            )
        
        if is_active is not None:
            query = query.filter(FeeCategory.is_active == is_active)
        
        if is_published is not None:
            query = query.filter(FeeCategory.is_published == is_published)
        
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_fee_category(db: Session, fee_id: int, user_id: int) -> Optional[FeeCategory]:
        """Get a specific fee category"""
        return db.query(FeeCategory).filter(
            FeeCategory.id == fee_id,
            FeeCategory.user_id == user_id
        ).first()

    @staticmethod
    def update_fee_category(db: Session, fee_id: int, user_id: int, fee_data: FeeCategoryUpdate) -> Optional[FeeCategory]:
        """Update a fee category (both default and custom)"""
        fee = db.query(FeeCategory).filter(
            FeeCategory.id == fee_id,
            FeeCategory.user_id == user_id
        ).first()
        
        if not fee:
            return None
        
        update_data = fee_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(fee, key, value)
        
        db.commit()
        db.refresh(fee)
        return fee

    @staticmethod
    def delete_fee_category(db: Session, fee_id: int, user_id: int) -> bool:
        """Delete a fee category (only custom fees can be deleted)"""
        fee = db.query(FeeCategory).filter(
            FeeCategory.id == fee_id,
            FeeCategory.user_id == user_id
        ).first()
        
        if not fee:
            return False
        
        # Prevent deletion of default fees
        if fee.is_system_default:
            raise ValueError("Default fees cannot be deleted")
        
        db.delete(fee)
        db.commit()
        return True

    # ============ Fee Pamplate Publishing ============

    @staticmethod
    def get_client_published_pamplate(db: Session, client_id: int, ca_user_id: int) -> Optional[PublishedFeePamplate]:
        """Get the latest published fee pamplate for a client"""
        return db.query(PublishedFeePamplate).filter(
            PublishedFeePamplate.client_id == client_id,
            PublishedFeePamplate.user_id == ca_user_id,
            PublishedFeePamplate.is_active == True
        ).order_by(PublishedFeePamplate.created_at.desc()).first()

    @staticmethod
    def get_client_published_pamplates(db: Session, client_id: int, ca_user_id: int) -> List[PublishedFeePamplate]:
        """Get all published fee pamplates for a client"""
        return db.query(PublishedFeePamplate).filter(
            PublishedFeePamplate.client_id == client_id,
            PublishedFeePamplate.user_id == ca_user_id
        ).order_by(PublishedFeePamplate.created_at.desc()).all()

    @staticmethod
    def publish_fee_pamplate(db: Session, user_id: int, client_id: int, fee_ids: List[int]) -> PublishedFeePamplate:
        """Publish fee pamplate for a client"""
        # Get client
        client = db.query(ClientMaster).filter(
            ClientMaster.id == client_id,
            ClientMaster.ca_user_id == user_id
        ).first()
        
        if not client:
            raise ValueError("Client not found")
        
        # Get selected fees
        fees = db.query(FeeCategory).filter(
            FeeCategory.id.in_(fee_ids),
            FeeCategory.user_id == user_id,
            FeeCategory.is_active == True
        ).all()
        
        if not fees:
            raise ValueError("No valid fees selected")
        
        # Calculate totals
        total_fee = Decimal('0')
        total_gst = Decimal('0')
        grand_total = Decimal('0')
        fee_data = []
        
        for fee in fees:
            gst_amount = fee.base_fee * (fee.gst_rate / 100)
            total = fee.base_fee + gst_amount
            
            fee_data.append({
                "id": fee.id,
                "name": fee.name,
                "code": fee.code,
                "description": fee.description,
                "base_fee": float(fee.base_fee),
                "gst_rate": float(fee.gst_rate),
                "fee_type": fee.fee_type,
                "keywords": fee.keywords,
                "is_default": fee.is_system_default
            })
            
            total_fee += fee.base_fee
            total_gst += gst_amount
            grand_total += total
        
        # Create pamplate
        pamplate = PublishedFeePamplate(
            user_id=user_id,
            client_id=client_id,
            fee_data=fee_data,
            total_fee=total_fee,
            total_gst=total_gst,
            grand_total=grand_total,
            is_active=True
        )
        
        db.add(pamplate)
        
        # Mark fees as published
        for fee in fees:
            fee.is_published = True
            fee.published_at = datetime.now()
        
        db.commit()
        db.refresh(pamplate)
        
        return pamplate

    @staticmethod
    def mark_pamplate_viewed(db: Session, pamplate_id: int, client_id: int) -> None:
        """Mark a pamplate as viewed"""
        pamplate = db.query(PublishedFeePamplate).filter(
            PublishedFeePamplate.id == pamplate_id,
            PublishedFeePamplate.client_id == client_id
        ).first()
        
        if pamplate and not pamplate.is_viewed:
            pamplate.is_viewed = True
            pamplate.viewed_at = datetime.now()
            db.commit()

    @staticmethod
    def accept_fee_pamplate(db: Session, pamplate_id: int, client_id: int) -> Optional[PublishedFeePamplate]:
        """Accept the fee pamplate by client"""
        pamplate = db.query(PublishedFeePamplate).filter(
            PublishedFeePamplate.id == pamplate_id,
            PublishedFeePamplate.client_id == client_id
        ).first()
        
        if not pamplate:
            return None
        
        if pamplate.accepted_at:
            return pamplate
        
        pamplate.accepted_at = datetime.now()
        pamplate.rejected_at = None
        
        db.commit()
        db.refresh(pamplate)
        return pamplate

    @staticmethod
    def reject_fee_pamplate(db: Session, pamplate_id: int, client_id: int) -> Optional[PublishedFeePamplate]:
        """Reject the fee pamplate by client"""
        pamplate = db.query(PublishedFeePamplate).filter(
            PublishedFeePamplate.id == pamplate_id,
            PublishedFeePamplate.client_id == client_id
        ).first()
        
        if not pamplate:
            return None
        
        pamplate.rejected_at = datetime.now()
        pamplate.accepted_at = None
        
        db.commit()
        db.refresh(pamplate)
        return pamplate