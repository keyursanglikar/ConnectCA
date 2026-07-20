from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from decimal import Decimal
from datetime import datetime
import secrets
import string

from app.models.bills import Bill, BillStatus, BillItem
from app.models.client import ClientMaster
from app.models.client_submission import ClientSubmission
from app.models.user import User
from app.schemas.bill import BillCreate, BillUpdate, BillItemCreate


class BillService:
    """Bill management service"""

    @staticmethod
    def generate_bill_number(db: Session) -> str:
        """Generate a unique bill number"""
        last_bill = db.query(Bill).order_by(Bill.id.desc()).first()
        if last_bill:
            try:
                last_num = int(last_bill.bill_number.split('-')[1])
                new_num = last_num + 1
            except:
                new_num = 1
        else:
            new_num = 1
        return f"BILL-{new_num:05d}"

    @staticmethod
    def create_bill(
        db: Session,
        user_id: int,
        bill_data: BillCreate
    ) -> Bill:
        """Create a new bill"""
        client = db.query(ClientMaster).filter(
            ClientMaster.id == bill_data.client_id,
            ClientMaster.ca_user_id == user_id
        ).first()
        
        if not client:
            raise ValueError("Client not found or not authorized")
        
        bill_number = BillService.generate_bill_number(db)
        
        total_amount = Decimal('0.00')
        gst_amount = Decimal('0.00')
        grand_total = Decimal('0.00')
        
        items = []
        for item_data in bill_data.items:
            total_amount += item_data.amount
            gst_amount += item_data.gst_amount
            grand_total += item_data.total_amount
            items.append(item_data)
        
        bill = Bill(
            client_id=bill_data.client_id,
            user_id=user_id,
            bill_number=bill_number,
            status=BillStatus.PENDING,
            total_amount=total_amount,
            gst_amount=gst_amount,
            grand_total=grand_total,
            notes=bill_data.notes,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(bill)
        db.commit()
        db.refresh(bill)
        
        for item_data in items:
            bill_item = BillItem(
                bill_id=bill.id,
                description=item_data.description,
                amount=item_data.amount,
                gst_amount=item_data.gst_amount,
                total_amount=item_data.total_amount,
                fee_category_id=item_data.fee_category_id,
                document_id=item_data.document_id,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(bill_item)
        
        db.commit()
        db.refresh(bill)
        return bill

    @staticmethod
    def create_bill_from_submission(
        db: Session,
        ca_user_id: int,
        submission: ClientSubmission,
        notes: Optional[str] = None
    ) -> Bill:
        """Create a bill from a client submission"""
        client = db.query(ClientMaster).filter(
            ClientMaster.id == submission.client_id
        ).first()
        
        if not client:
            raise ValueError("Client not found")
        
        bill_number = BillService.generate_bill_number(db)
        
        # Calculate totals from estimated bill
        total_amount = Decimal('0.00')
        gst_amount = Decimal('0.00')
        grand_total = Decimal('0.00')
        
        # Get estimated bill data
        estimated_bill = submission.estimated_bill or {}
        lines = estimated_bill.get('lines', [])
        
        for line in lines:
            amount = Decimal(str(line.get('amount', 0)))
            # Calculate GST (assuming 18% unless specified)
            gst_rate = Decimal('0.18')
            line_gst = amount * gst_rate
            line_total = amount + line_gst
            
            total_amount += amount
            gst_amount += line_gst
            grand_total += line_total
        
        # Create bill
        bill = Bill(
            client_id=client.id,
            user_id=ca_user_id,
            bill_number=bill_number,
            status=BillStatus.PENDING,
            total_amount=total_amount,
            gst_amount=gst_amount,
            grand_total=grand_total,
            notes=notes or f"Generated from submission #{submission.id}",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(bill)
        db.commit()
        db.refresh(bill)
        
        # Create bill items
        for line in lines:
            amount = Decimal(str(line.get('amount', 0)))
            gst_rate = Decimal('0.18')
            line_gst = amount * gst_rate
            line_total = amount + line_gst
            
            bill_item = BillItem(
                bill_id=bill.id,
                description=line.get('label', 'Service'),
                amount=amount,
                gst_amount=line_gst,
                total_amount=line_total,
                fee_category_id=None,
                document_id=None,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(bill_item)
        
        db.commit()
        db.refresh(bill)
        return bill

    @staticmethod
    def get_client_bills(
        db: Session,
        client_id: int,
        ca_user_id: int,
        status: Optional[BillStatus] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Bill]:
        """Get all bills for a client"""
        query = db.query(Bill).filter(
            Bill.client_id == client_id,
            Bill.user_id == ca_user_id
        )
        if status:
            query = query.filter(Bill.status == status)
        return query.order_by(Bill.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_ca_bills(
        db: Session,
        ca_user_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[BillStatus] = None
    ) -> List[Bill]:
        """Get all bills for a CA"""
        query = db.query(Bill).filter(Bill.user_id == ca_user_id)
        if status:
            query = query.filter(Bill.status == status)
        return query.order_by(Bill.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_bill(
        db: Session,
        bill_id: int,
        user_id: int,
        is_ca: bool = True
    ) -> Optional[Bill]:
        """Get a specific bill"""
        query = db.query(Bill).filter(Bill.id == bill_id)
        if is_ca:
            query = query.filter(Bill.user_id == user_id)
        else:
            client = db.query(ClientMaster).filter(
                ClientMaster.user_id == user_id
            ).first()
            if client:
                query = query.filter(
                    Bill.client_id == client.id,
                    Bill.user_id == client.ca_user_id
                )
            else:
                return None
        return query.first()

    @staticmethod
    def update_bill(
        db: Session,
        bill_id: int,
        user_id: int,
        bill_data: BillUpdate
    ) -> Optional[Bill]:
        """Update a bill"""
        bill = db.query(Bill).filter(
            Bill.id == bill_id,
            Bill.user_id == user_id
        ).first()
        if not bill:
            return None
        if bill.status != BillStatus.PENDING:
            raise ValueError("Only pending bills can be updated")
        
        update_data = bill_data.dict(exclude_unset=True)
        
        if 'items' in update_data and update_data['items']:
            db.query(BillItem).filter(BillItem.bill_id == bill_id).delete()
            
            total_amount = Decimal('0.00')
            gst_amount = Decimal('0.00')
            grand_total = Decimal('0.00')
            
            for item_data in update_data['items']:
                total_amount += item_data.amount
                gst_amount += item_data.gst_amount
                grand_total += item_data.total_amount
                
                bill_item = BillItem(
                    bill_id=bill.id,
                    description=item_data.description,
                    amount=item_data.amount,
                    gst_amount=item_data.gst_amount,
                    total_amount=item_data.total_amount,
                    fee_category_id=item_data.fee_category_id,
                    document_id=item_data.document_id
                )
                db.add(bill_item)
            
            bill.total_amount = total_amount
            bill.gst_amount = gst_amount
            bill.grand_total = grand_total
        
        for key, value in update_data.items():
            if key != 'items':
                setattr(bill, key, value)
        
        bill.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(bill)
        return bill

    @staticmethod
    def delete_bill(
        db: Session,
        bill_id: int,
        user_id: int
    ) -> bool:
        """Delete a bill"""
        bill = db.query(Bill).filter(
            Bill.id == bill_id,
            Bill.user_id == user_id
        ).first()
        if not bill:
            return False
        if bill.status != BillStatus.PENDING:
            raise ValueError("Only pending bills can be deleted")
        
        db.query(BillItem).filter(BillItem.bill_id == bill_id).delete()
        db.delete(bill)
        db.commit()
        return True

    @staticmethod
    def get_bill_items(
        db: Session,
        bill_id: int
    ) -> List[BillItem]:
        """Get all items for a bill"""
        return db.query(BillItem).filter(
            BillItem.bill_id == bill_id
        ).order_by(BillItem.id).all()

    @staticmethod
    def get_bill_stats(
        db: Session,
        ca_user_id: int
    ) -> dict:
        """Get bill statistics for a CA"""
        bills = db.query(Bill).filter(Bill.user_id == ca_user_id).all()
        
        total_bills = len(bills)
        pending_bills = len([b for b in bills if b.status == BillStatus.PENDING])
        accepted_bills = len([b for b in bills if b.status == BillStatus.ACCEPTED])
        rejected_bills = len([b for b in bills if b.status == BillStatus.REJECTED])
        paid_bills = len([b for b in bills if b.status == BillStatus.PAID])
        
        total_amount = sum(b.grand_total for b in bills if b.status in [BillStatus.ACCEPTED, BillStatus.PAID])
        pending_amount = sum(b.grand_total for b in bills if b.status == BillStatus.PENDING)
        
        return {
            "total_bills": total_bills,
            "pending_bills": pending_bills,
            "accepted_bills": accepted_bills,
            "rejected_bills": rejected_bills,
            "paid_bills": paid_bills,
            "total_amount": float(total_amount) if total_amount else 0,
            "pending_amount": float(pending_amount) if pending_amount else 0
        }

    @staticmethod
    def mark_bill_paid(
        db: Session,
        bill_id: int,
        user_id: int
    ) -> Optional[Bill]:
        """Mark a bill as paid"""
        bill = db.query(Bill).filter(
            Bill.id == bill_id,
            Bill.user_id == user_id
        ).first()
        if not bill:
            return None
        if bill.status != BillStatus.ACCEPTED:
            raise ValueError("Bill must be accepted before marking as paid")
        
        bill.status = BillStatus.PAID
        bill.paid_at = datetime.utcnow()
        bill.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(bill)
        return bill