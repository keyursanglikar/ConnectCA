from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from decimal import Decimal
from datetime import datetime
import re

from app.models.fee import FeeCategory, ClientFeeMatch
from app.models.document import Document
from app.models.client import ClientMaster
from app.models.bills import Bill, BillItem


class FeeMatchingService:
    """Service for matching documents with fee categories"""

    @staticmethod
    def match_document_fees(
        db: Session,
        document_id: int,
        client_id: int,
        user_id: int
    ) -> Dict:
        """Match a document with fee categories based on keywords"""
        
        # Get the document
        document = db.query(Document).filter(
            Document.id == document_id,
            Document.client_id == client_id
        ).first()
        
        if not document:
            raise ValueError("Document not found")
        
        # Get all active fee categories for this CA
        fee_categories = db.query(FeeCategory).filter(
            FeeCategory.user_id == user_id,
            FeeCategory.is_active == True
        ).all()
        
        # Get document text for matching
        doc_text = f"{document.file_title} {document.document_type} {document.file_name or ''}".lower()
        
        matched_fees = []
        matched_keywords = []
        
        for fee in fee_categories:
            matched_for_doc = []
            for keyword in fee.keywords or []:
                if keyword.lower() in doc_text:
                    matched_for_doc.append(keyword)
            
            if matched_for_doc:
                # Calculate fee with GST
                fee_amount = fee.base_fee
                gst_amount = (fee_amount * fee.gst_rate) / 100
                total_amount = fee_amount + gst_amount
                
                # Check if match already exists
                existing_match = db.query(ClientFeeMatch).filter(
                    ClientFeeMatch.document_id == document_id,
                    ClientFeeMatch.fee_category_id == fee.id
                ).first()
                
                if not existing_match:
                    # Create fee match record
                    fee_match = ClientFeeMatch(
                        client_id=client_id,
                        fee_category_id=fee.id,
                        document_id=document_id,
                        fee_amount=fee_amount,
                        gst_amount=gst_amount,
                        total_amount=total_amount,
                        matched_keywords=matched_for_doc,
                        match_confidence=Decimal('100.00'),
                        is_auto_matched=True,
                        is_applied=False
                    )
                    db.add(fee_match)
                    matched_fees.append({
                        "fee": fee,
                        "match": fee_match,
                        "keywords": matched_for_doc
                    })
                    matched_keywords.extend(matched_for_doc)
        
        db.commit()
        
        # Calculate totals
        total_fee = sum(m["fee"].base_fee for m in matched_fees)
        total_gst = sum((m["fee"].base_fee * m["fee"].gst_rate) / 100 for m in matched_fees)
        
        return {
            "matched_fees": matched_fees,
            "total_fee": total_fee,
            "total_gst": total_gst,
            "grand_total": total_fee + total_gst,
            "matched_keywords": list(set(matched_keywords))
        }

    @staticmethod
    def generate_bill_from_matches(
        db: Session,
        client_id: int,
        user_id: int
    ) -> Dict:
        """Generate a bill from matched fees"""
        
        # Get all fee matches for this client that are not applied
        fee_matches = db.query(ClientFeeMatch).filter(
            ClientFeeMatch.client_id == client_id,
            ClientFeeMatch.is_applied == False
        ).all()
        
        if not fee_matches:
            return {"message": "No pending fee matches found"}
        
        # Get client
        client = db.query(ClientMaster).filter(
            ClientMaster.id == client_id,
            ClientMaster.user_id == user_id
        ).first()
        
        if not client:
            raise ValueError("Client not found")
        
        # Generate bill number
        bill_number = f"BILL-{datetime.now().strftime('%Y%m%d')}-{client_id:04d}"
        
        # Create bill
        bill = Bill(
            client_id=client_id,
            user_id=user_id,
            bill_number=bill_number,
            status="pending",
            total_amount=Decimal('0.00'),
            gst_amount=Decimal('0.00'),
            grand_total=Decimal('0.00')
        )
        db.add(bill)
        db.commit()
        db.refresh(bill)
        
        total_fee = Decimal('0.00')
        total_gst = Decimal('0.00')
        
        # Create bill items
        for match in fee_matches:
            bill_item = BillItem(
                bill_id=bill.id,
                fee_category_id=match.fee_category_id,
                document_id=match.document_id,
                description=match.fee_category.name,
                amount=match.fee_amount,
                gst_amount=match.gst_amount,
                total_amount=match.total_amount
            )
            db.add(bill_item)
            
            # Mark match as applied
            match.is_applied = True
            
            total_fee += match.fee_amount
            total_gst += match.gst_amount
        
        # Update bill totals
        bill.total_amount = total_fee
        bill.gst_amount = total_gst
        bill.grand_total = total_fee + total_gst
        
        db.commit()
        db.refresh(bill)
        
        return {
            "bill": bill,
            "items": bill_items,
            "total_fee": total_fee,
            "total_gst": total_gst,
            "grand_total": total_fee + total_gst
        }

    @staticmethod
    def get_client_pending_matches(
        db: Session,
        client_id: int,
        user_id: int
    ) -> List[ClientFeeMatch]:
        """Get pending fee matches for a client"""
        return db.query(ClientFeeMatch).filter(
            ClientFeeMatch.client_id == client_id,
            ClientFeeMatch.is_applied == False
        ).all()

    @staticmethod
    def get_client_bills(
        db: Session,
        client_id: int,
        user_id: int
    ) -> List:
        """Get all bills for a client"""
        return db.query(Bill).filter(
            Bill.client_id == client_id,
            Bill.user_id == user_id
        ).order_by(Bill.created_at.desc()).all()