# app/services/computation_bill_service.py
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
import re
from decimal import Decimal

from app.models.client_submission import ClientSubmission
from app.models.fee import FeeCategory, PublishedFeePamplate
from app.models.bills import Bill, BillItem
from app.models.client import ClientMaster

logger = logging.getLogger(__name__)


class ComputationBillService:
    """Service for managing computation bills with keyword matching to fee pamplate"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_bill_from_computation_file(
        self,
        submission_id: int,
        ca_user_id: int,
        parsed_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate a bill by matching parsed fee components with fee pamplate keywords."""
        
        submission = self.db.query(ClientSubmission).filter(
            ClientSubmission.id == submission_id
        ).first()
        
        if not submission:
            raise ValueError("Submission not found")
        
        client_id = submission.client_id
        
        # Get all active fee categories for this CA
        fee_categories = self.db.query(FeeCategory).filter(
            FeeCategory.user_id == ca_user_id,
            FeeCategory.is_active == True
        ).all()
        
        if not fee_categories:
            raise ValueError("No fee categories found. Please create fee pamplate first.")
        
        # Get the detected categories from parsed data
        detected_categories = parsed_data.get('detected', {})
        fee_components = []
        matched_fees = []
        total_base_fee = 0
        total_gst = 0
        
        # Track which categories have been matched
        matched_categories = set()
        
        # First pass: Match detected categories with fee pamplate
        for category_key, is_present in detected_categories.items():
            if not is_present:
                continue
            
            # Check if this category exists in fee pamplate
            matched_fee = self._find_matching_fee_category(
                category_key,
                parsed_data,
                fee_categories
            )
            
            if matched_fee:
                matched_categories.add(category_key)
                
                # Get amount details from parsed data
                amount_info = self._get_category_amount(category_key, parsed_data)
                label = self._get_fee_label(category_key, matched_fee, amount_info)
                
                # Calculate fee with GST
                base_fee = float(matched_fee.base_fee)
                gst_rate = float(matched_fee.gst_rate)
                gst_amount = (base_fee * gst_rate) / 100
                total = base_fee + gst_amount
                
                matched_fees.append({
                    "fee_category_id": matched_fee.id,
                    "fee_category_name": matched_fee.name,
                    "category_key": category_key,
                    "base_fee": base_fee,
                    "gst_amount": gst_amount,
                    "total": total,
                    "amount_info": amount_info
                })
                
                fee_components.append({
                    "id": f"fee-{matched_fee.id}",
                    "category": category_key,
                    "label": label,
                    "amount": base_fee,
                    "gst": gst_amount,
                    "total": total,
                    "fee_category_id": matched_fee.id,
                    "fee_name": matched_fee.name,
                    "fee_code": matched_fee.code,
                    "fee_type": matched_fee.fee_type,
                    "is_base": matched_fee.fee_type == "basic",
                    "source": "auto_matched",
                    "keywords": matched_fee.keywords or [],
                    "document_name": parsed_data.get('document_name', 'Computation Bill')
                })
                
                total_base_fee += base_fee
                total_gst += gst_amount
        
        # Second pass: Add default basic fees if no base fee was matched
        has_base = any(comp.get('is_base', False) for comp in fee_components)
        
        if not has_base and fee_components:
            # Find a basic/default fee category
            default_fee = self._find_default_fee_category(fee_categories)
            if default_fee:
                base_fee = float(default_fee.base_fee)
                gst_rate = float(default_fee.gst_rate)
                gst_amount = (base_fee * gst_rate) / 100
                total = base_fee + gst_amount
                
                fee_components.insert(0, {
                    "id": f"default-fee-{default_fee.id}",
                    "category": "basic",
                    "label": default_fee.name,
                    "amount": base_fee,
                    "gst": gst_amount,
                    "total": total,
                    "fee_category_id": default_fee.id,
                    "fee_name": default_fee.name,
                    "fee_code": default_fee.code,
                    "fee_type": default_fee.fee_type,
                    "is_base": True,
                    "source": "default",
                    "keywords": default_fee.keywords or [],
                    "document_name": "Base Fee"
                })
                
                total_base_fee += base_fee
                total_gst += gst_amount
        
        # Calculate grand total
        grand_total = total_base_fee + total_gst
        
        # Prepare bill data - ALL JSON SERIALIZABLE
        bill_data = {
            "submission_id": submission_id,
            "client_id": client_id,
            "ca_user_id": ca_user_id,
            "fee_components": fee_components,
            "matched_fees": matched_fees,
            "total_base_fee": total_base_fee,
            "total_gst": total_gst,
            "grand_total": grand_total,
            "status": "DRAFT",
            "created_at": datetime.utcnow().isoformat(),
            "detected_categories": detected_categories,
            "parsed_client_name": parsed_data.get('client_name'),
            "parsed_pan": parsed_data.get('pan'),
            "document_name": parsed_data.get('document_name'),
            "notes": "",
            "version": 1
        }
        
        # Save to submission
        submission.computation_bill_data = bill_data
        submission.computation_bill_status = "DRAFT"
        submission.computation_bill_file_name = parsed_data.get('document_name')
        self.db.commit()
        self.db.refresh(submission)
        
        return bill_data
    
    def update_computation_bill(
        self, 
        submission_id: int, 
        fee_components: List[Dict],
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update the computation bill with manual edits - COMPLETE REPLACEMENT"""
        
        submission = self.db.query(ClientSubmission).filter(
            ClientSubmission.id == submission_id
        ).first()
        
        if not submission:
            raise ValueError("Submission not found")
        
        if not submission.computation_bill_data:
            raise ValueError("No computation bill exists")
        
        # Get existing bill data as base
        existing_data = submission.computation_bill_data
        
        # Calculate totals from the provided components
        total_base_fee = 0
        total_gst = 0
        
        # Process each component to ensure it has all required fields
        processed_components = []
        for comp in fee_components:
            # Ensure amount is a number
            amount = float(comp.get('amount', 0))
            
            # Calculate GST (default 18%)
            gst_rate = float(comp.get('gst_rate', 18))
            gst = amount * (gst_rate / 100)
            total = amount + gst
            
            # Create a clean component with all fields
            processed_comp = {
                "id": comp.get('id', f"manual-{datetime.utcnow().timestamp()}-{len(processed_components)}"),
                "label": comp.get('label', 'Fee Component'),
                "amount": amount,
                "gst": gst,
                "total": total,
                "gst_rate": gst_rate,
                "category": comp.get('category', 'manual'),
                "is_base": comp.get('is_base', False),
                "is_extra": comp.get('is_extra', False),
                "source": comp.get('source', 'manual'),
                "document_name": comp.get('document_name', 'Manual Entry'),
                "fee_category_id": comp.get('fee_category_id'),
                "fee_name": comp.get('fee_name', comp.get('label', 'Fee Component')),
                "fee_code": comp.get('fee_code'),
                "fee_type": comp.get('fee_type'),
                "keywords": comp.get('keywords', [])
            }
            
            processed_components.append(processed_comp)
            total_base_fee += amount
            total_gst += gst
        
        # Calculate grand total
        grand_total = total_base_fee + total_gst
        
        # Create updated bill data - PRESERVE existing metadata
        updated_bill_data = {
            # Preserve existing fields
            "submission_id": existing_data.get('submission_id', submission_id),
            "client_id": existing_data.get('client_id'),
            "ca_user_id": existing_data.get('ca_user_id'),
            "detected_categories": existing_data.get('detected_categories', {}),
            "parsed_client_name": existing_data.get('parsed_client_name'),
            "parsed_pan": existing_data.get('parsed_pan'),
            "document_name": existing_data.get('document_name'),
            "file_name": existing_data.get('file_name'),
            "file_path": existing_data.get('file_path'),
            "file_size": existing_data.get('file_size'),
            "uploaded_at": existing_data.get('uploaded_at'),
            "files": existing_data.get('files', []),
            "matched_fees": existing_data.get('matched_fees', []),
            
            # Updated fields
            "fee_components": processed_components,
            "total_base_fee": total_base_fee,
            "total_gst": total_gst,
            "grand_total": grand_total,
            "notes": notes if notes is not None else existing_data.get('notes', ''),
            "status": "EDITED",
            "updated_at": datetime.utcnow().isoformat(),
            "version": existing_data.get('version', 0) + 1,
            "last_edited_by": "CA"
        }
        
        # Save to submission
        submission.computation_bill_data = updated_bill_data
        submission.computation_bill_status = "EDITED"
        submission.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(submission)
        
        return updated_bill_data
    
    def _find_matching_fee_category(
        self,
        category_key: str,
        parsed_data: Dict[str, Any],
        fee_categories: List[FeeCategory]
    ) -> Optional[FeeCategory]:
        """Find the best matching fee category for a detected category."""
        # Map detection category keys to fee types
        category_to_fee_type = {
            "salary_income": ["basic", "salary", "basic_itr"],
            "house_property_income": ["basic", "house", "basic_itr"],
            "other_sources_interest": ["basic", "interest", "basic_itr"],
            "other_sources_dividend": ["basic", "dividend", "basic_itr"],
            "capital_gains": ["capital_gains", "capital_gains_other"],
            "tds_reconciliation": ["tds", "reconciliation"],
            "advance_tax": ["advance_tax"],
            "brought_forward_losses": ["losses", "carry_forward"],
            "refund_or_demand": ["refund", "tax_payable"],
            "business_income": ["business", "business_no_accounts", "business_with_accounts"],
            "agricultural_income": ["agriculture"]
        }
        
        # Get preferred fee types for this category
        preferred_types = category_to_fee_type.get(category_key, [])
        
        # Also check for specific keywords in the fee name
        category_keywords = {
            "salary_income": ["salary", "form 16", "basic itr"],
            "house_property_income": ["house property", "rental", "property income"],
            "capital_gains": ["capital gain", "capital gains", "ltcg", "stcg"],
            "business_income": ["business", "profession", "turnover", "presumptive"],
            "tds_reconciliation": ["tds", "tcs", "reconciliation"],
            "other_sources_interest": ["interest", "savings", "deposit"],
            "other_sources_dividend": ["dividend", "mutual fund"],
            "advance_tax": ["advance tax", "tax paid"],
            "brought_forward_losses": ["loss", "carry forward"],
            "refund_or_demand": ["refund", "balance tax"],
            "agricultural_income": ["agricultural", "farm"]
        }
        
        keywords = category_keywords.get(category_key, [])
        
        # First pass: Try exact type match
        for fee in fee_categories:
            fee_type_lower = fee.fee_type.lower()
            fee_name_lower = fee.name.lower()
            fee_code_lower = fee.code.lower()
            
            # Check if fee type matches preferred types
            for pref_type in preferred_types:
                if pref_type.lower() in fee_type_lower:
                    return fee
            
            # Check if fee name contains category keywords
            if keywords:
                for keyword in keywords:
                    if keyword.lower() in fee_name_lower or keyword.lower() in fee_code_lower:
                        return fee
        
        # Second pass: Try keyword matching from fee keywords
        for fee in fee_categories:
            if not fee.keywords:
                continue
            
            fee_keywords = [k.lower() for k in fee.keywords]
            
            # Check if any category keyword matches fee keywords
            for keyword in keywords:
                if keyword.lower() in fee_keywords:
                    return fee
            
            # Check if category key matches any fee keyword
            category_parts = category_key.replace('_', ' ').split()
            for part in category_parts:
                if part.lower() in fee_keywords:
                    return fee
        
        # Third pass: Check fee name for category keywords
        for fee in fee_categories:
            fee_name_lower = fee.name.lower()
            fee_code_lower = fee.code.lower()
            
            for keyword in keywords:
                if keyword.lower() in fee_name_lower or keyword.lower() in fee_code_lower:
                    return fee
        
        return None
    
    def _find_default_fee_category(self, fee_categories: List[FeeCategory]) -> Optional[FeeCategory]:
        """Find a default/basic fee category"""
        for fee in fee_categories:
            if fee.fee_type.lower() in ['basic', 'basic_itr', 'default']:
                return fee
        return fee_categories[0] if fee_categories else None
    
    def _get_category_amount(self, category_key: str, parsed_data: Dict[str, Any]) -> Optional[str]:
        """Extract amount information for a category from parsed data"""
        income_amounts = parsed_data.get('income_amounts', {})
        
        category_to_income_key = {
            "salary_income": "salary",
            "house_property_income": "house_property",
            "capital_gains": "capital_gains",
            "other_sources_interest": "other_sources",
            "other_sources_dividend": "other_sources",
            "tds_reconciliation": "tds",
            "refund_or_demand": "refund"
        }
        
        income_key = category_to_income_key.get(category_key)
        if income_key and income_key in income_amounts:
            return income_amounts[income_key]
        
        return None
    
    def _get_fee_label(
        self,
        category_key: str,
        fee_category: FeeCategory,
        amount_info: Optional[str]
    ) -> str:
        """Generate a label for the fee component"""
        label = fee_category.name
        
        # Add amount info if available
        if amount_info:
            label = f"{label} (₹{amount_info})"
        
        return label
    
    def send_computation_bill_to_client(self, submission_id: int) -> Dict[str, Any]:
        """Send the computation bill to client"""
        
        submission = self.db.query(ClientSubmission).filter(
            ClientSubmission.id == submission_id
        ).first()
        
        if not submission:
            raise ValueError("Submission not found")
        
        if not submission.computation_bill_data:
            raise ValueError("No computation bill exists")
        
        bill_data = submission.computation_bill_data
        bill_data['status'] = "SENT_TO_CLIENT"
        bill_data['sent_at'] = datetime.utcnow().isoformat()
        
        submission.computation_bill_data = bill_data
        submission.computation_bill_status = "SENT_TO_CLIENT"
        submission.computation_bill_sent_at = datetime.utcnow()
        self.db.commit()
        
        return bill_data
    
    def confirm_computation_bill(self, submission_id: int) -> Dict[str, Any]:
        """Client confirms the computation bill"""
        
        submission = self.db.query(ClientSubmission).filter(
            ClientSubmission.id == submission_id
        ).first()
        
        if not submission:
            raise ValueError("Submission not found")
        
        if submission.computation_bill_status != "SENT_TO_CLIENT":
            raise ValueError("Bill has not been sent to client")
        
        bill_data = submission.computation_bill_data
        bill_data['status'] = "CONFIRMED_BY_CLIENT"
        bill_data['confirmed_at'] = datetime.utcnow().isoformat()
        
        submission.computation_bill_data = bill_data
        submission.computation_bill_status = "CONFIRMED_BY_CLIENT"
        submission.computation_bill_confirmed_at = datetime.utcnow()
        self.db.commit()
        
        return bill_data
    
    def finalize_computation_bill(self, submission_id: int) -> Dict[str, Any]:
        """CA finalizes the computation bill"""
        
        submission = self.db.query(ClientSubmission).filter(
            ClientSubmission.id == submission_id
        ).first()
        
        if not submission:
            raise ValueError("Submission not found")
        
        if submission.computation_bill_status not in ["SENT_TO_CLIENT", "CONFIRMED_BY_CLIENT"]:
            raise ValueError("Bill must be sent or confirmed before finalizing")
        
        bill_data = submission.computation_bill_data
        bill_data['status'] = "FINALIZED"
        bill_data['finalized_at'] = datetime.utcnow().isoformat()
        
        submission.computation_bill_data = bill_data
        submission.computation_bill_status = "FINALIZED"
        submission.computation_bill_finalized_at = datetime.utcnow()
        self.db.commit()
        
        return bill_data