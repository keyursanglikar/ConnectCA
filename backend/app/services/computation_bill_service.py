from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from app.models.client_submission import ClientSubmission
from app.models.user import User
from app.models.client import ClientMaster

logger = logging.getLogger(__name__)

class ComputationBillService:
    """Service for creating and managing computation bills"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_computation_bill_from_documents(
        self, 
        submission_id: int, 
        ca_user_id: int,
        adjustments: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Create a computation bill based on client documents"""
        
        submission = self.db.query(ClientSubmission).filter(
            ClientSubmission.id == submission_id
        ).first()
        
        if not submission:
            raise ValueError("Submission not found")
        
        # Analyze documents to determine fee components
        fee_components = self._analyze_documents_for_fees(
            submission.documents_data or []
        )
        
        # Apply adjustments
        if adjustments:
            fee_components = self._apply_adjustments(fee_components, adjustments)
        
        # Calculate total
        total = sum(comp.get('amount', 0) for comp in fee_components)
        
        # Get client name
        client_name = "Unknown"
        if submission.client:
            client_name = submission.client.name if hasattr(submission.client, 'name') else "Unknown"
        
        computation_bill = {
            "submission_id": submission_id,
            "client_name": client_name,
            "created_at": datetime.utcnow().isoformat(),
            "fee_components": fee_components,
            "total": total,
            "adjustments": adjustments or {},
            "status": "DRAFT"
        }
        
        # Save to submission
        submission.computation_bill_data = computation_bill
        submission.computation_bill_status = "DRAFT"
        self.db.commit()
        
        return computation_bill
    
    def _analyze_documents_for_fees(
        self, 
        documents: List[Dict]
    ) -> List[Dict]:
        """Analyze documents and map to fee categories"""
        
        fee_components = []
        
        # Map document bill_as to fee components with amounts
        doc_fee_map = {
            "salary": {"category": "salary", "label": "Salary Income", "amount": 500, "base": True},
            "houseProperty": {"category": "house_property", "label": "House Property Income", "amount": 500, "base": True},
            "ifos": {"category": "ifos", "label": "Income from Other Sources", "amount": 500, "base": True},
            "cgEquity": {"category": "capital_gains", "label": "Capital Gains - Equity/MF", "amount": 300, "base": False},
            "cgImmovable": {"category": "capital_gains", "label": "Capital Gains - Immovable Property", "amount": 200, "base": False},
            "cgOther": {"category": "capital_gains", "label": "Capital Gains - Other", "amount": 300, "base": False},
            "bizPresumptive": {"category": "business", "label": "Business - Presumptive", "amount": 500, "base": False},
            "bizAccounts": {"category": "business", "label": "Business - With Accounts", "amount": 700, "base": False}
        }
        
        # Track which categories are used
        used_categories = set()
        has_base = False
        
        for doc in documents:
            bill_as = doc.get('bill_as', 'ignore')
            if bill_as != 'ignore' and bill_as in doc_fee_map:
                fee_info = doc_fee_map[bill_as]
                category = fee_info["category"]
                
                if fee_info.get("base", False):
                    has_base = True
                
                if category not in used_categories:
                    used_categories.add(category)
                    fee_components.append({
                        "document_id": doc.get('document_id'),
                        "document_name": doc.get('file_title', 'Unknown'),
                        "category": category,
                        "label": fee_info["label"],
                        "amount": fee_info["amount"],
                        "source": "document",
                        "bill_as": bill_as,
                        "is_base": fee_info.get("base", False)
                    })
        
        # Add base fee if not already present
        if not has_base and fee_components:
            fee_components.append({
                "document_id": None,
                "document_name": "Base Fee",
                "category": "base",
                "label": "Base Fee (ITR Filing)",
                "amount": 500,
                "source": "default",
                "is_base": True
            })
        
        return fee_components
    
    def _apply_adjustments(
        self, 
        fee_components: List[Dict], 
        adjustments: Dict[str, Any]
    ) -> List[Dict]:
        """Apply user adjustments to fee components"""
        
        # Add house properties adjustment
        house_properties = adjustments.get('house_properties', 0)
        if house_properties > 2:
            extra = house_properties - 2
            exists = False
            for comp in fee_components:
                if comp.get('category') == 'house_property_extra':
                    exists = True
                    comp['amount'] = extra * 100
                    comp['label'] = f"House Properties (extra {extra} beyond 2)"
                    break
            
            if not exists:
                fee_components.append({
                    "document_id": None,
                    "document_name": "Manual Adjustment",
                    "category": "house_property_extra",
                    "label": f"House Properties (extra {extra} beyond 2)",
                    "amount": extra * 100,
                    "source": "adjustment",
                    "is_extra": True
                })
        
        # Add residential status adjustment
        residential_status = adjustments.get('residential_status', 'resident')
        if residential_status == 'nri':
            exists = False
            for comp in fee_components:
                if comp.get('category') == 'residential_nri':
                    exists = True
                    break
            if not exists:
                fee_components.append({
                    "document_id": None,
                    "document_name": "Manual Adjustment",
                    "category": "residential_nri",
                    "label": "Non-Resident Indian",
                    "amount": 500,
                    "source": "adjustment",
                    "is_extra": True
                })
        elif residential_status == 'residentForeign':
            exists = False
            for comp in fee_components:
                if comp.get('category') == 'residential_foreign':
                    exists = True
                    break
            if not exists:
                fee_components.append({
                    "document_id": None,
                    "document_name": "Manual Adjustment",
                    "category": "residential_foreign",
                    "label": "Resident with Foreign Income",
                    "amount": 750,
                    "source": "adjustment",
                    "is_extra": True
                })
        
        # Add missed streams
        missed_streams = adjustments.get('missed_streams', [])
        fee_flow_map = {
            "cgImmovable": {"label": "Capital Gains - Immovable Property", "amount": 200},
            "cgEquity": {"label": "Capital Gains - Equity/MF", "amount": 300},
            "cgOther": {"label": "Capital Gains - Other/F&O", "amount": 300},
            "bizPresumptive": {"label": "Business - Presumptive", "amount": 500},
            "bizAccounts": {"label": "Business - With Accounts", "amount": 700}
        }
        
        for stream in missed_streams:
            if stream in fee_flow_map:
                fee_info = fee_flow_map[stream]
                exists = False
                for comp in fee_components:
                    if comp.get('category') == f"manual_{stream}":
                        exists = True
                        break
                if not exists:
                    fee_components.append({
                        "document_id": None,
                        "document_name": "Manual Addition",
                        "category": f"manual_{stream}",
                        "label": fee_info["label"],
                        "amount": fee_info["amount"],
                        "source": "manual",
                        "is_extra": True
                    })
        
        return fee_components
    
    def update_computation_bill(
        self, 
        submission_id: int, 
        fee_components: List[Dict],
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update the computation bill with manual edits"""
        
        submission = self.db.query(ClientSubmission).filter(
            ClientSubmission.id == submission_id
        ).first()
        
        if not submission:
            raise ValueError("Submission not found")
        
        if not submission.computation_bill_data:
            raise ValueError("No computation bill exists")
        
        # Update the bill data
        bill_data = submission.computation_bill_data
        bill_data['fee_components'] = fee_components
        bill_data['total'] = sum(comp.get('amount', 0) for comp in fee_components)
        
        if notes:
            bill_data['notes'] = notes
        
        bill_data['updated_at'] = datetime.utcnow().isoformat()
        bill_data['status'] = "EDITED"
        
        submission.computation_bill_data = bill_data
        submission.computation_bill_status = "EDITED"
        self.db.commit()
        
        return bill_data
    
    def send_computation_bill_to_client(self, submission_id: int) -> Dict[str, Any]:
        """Send the computation bill to client"""
        
        submission = self.db.query(ClientSubmission).filter(
            ClientSubmission.id == submission_id
        ).first()
        
        if not submission:
            raise ValueError("Submission not found")
        
        if not submission.computation_bill_data:
            raise ValueError("No computation bill exists")
        
        submission.computation_bill_status = "SENT"
        submission.computation_bill_sent_at = datetime.utcnow()
        
        bill_data = submission.computation_bill_data
        bill_data['status'] = "SENT"
        bill_data['sent_at'] = datetime.utcnow().isoformat()
        
        submission.computation_bill_data = bill_data
        self.db.commit()
        
        return bill_data
    
    def confirm_computation_bill(self, submission_id: int) -> Dict[str, Any]:
        """Client confirms the computation bill"""
        
        submission = self.db.query(ClientSubmission).filter(
            ClientSubmission.id == submission_id
        ).first()
        
        if not submission:
            raise ValueError("Submission not found")
        
        if submission.computation_bill_status != "SENT":
            raise ValueError("Bill has not been sent to client")
        
        submission.computation_bill_status = "CONFIRMED"
        submission.computation_bill_confirmed_at = datetime.utcnow()
        
        bill_data = submission.computation_bill_data
        bill_data['status'] = "CONFIRMED"
        bill_data['confirmed_at'] = datetime.utcnow().isoformat()
        
        submission.computation_bill_data = bill_data
        self.db.commit()
        
        return bill_data
    
    def finalize_computation_bill(self, submission_id: int) -> Dict[str, Any]:
        """CA finalizes the computation bill"""
        
        submission = self.db.query(ClientSubmission).filter(
            ClientSubmission.id == submission_id
        ).first()
        
        if not submission:
            raise ValueError("Submission not found")
        
        if submission.computation_bill_status not in ["SENT", "CONFIRMED"]:
            raise ValueError("Bill must be sent or confirmed before finalizing")
        
        submission.computation_bill_status = "FINALIZED"
        submission.computation_bill_finalized_at = datetime.utcnow()
        
        bill_data = submission.computation_bill_data
        bill_data['status'] = "FINALIZED"
        bill_data['finalized_at'] = datetime.utcnow().isoformat()
        
        submission.computation_bill_data = bill_data
        self.db.commit()
        
        return bill_data

    def proceed_further(self, submission_id: int) -> Dict[str, Any]:
        """Proceed further after bill confirmation"""
        
        submission = self.db.query(ClientSubmission).filter(
            ClientSubmission.id == submission_id
        ).first()
        
        if not submission:
            raise ValueError("Submission not found")
        
        if submission.computation_bill_status != "CONFIRMED":
            raise ValueError("Bill must be confirmed before proceeding")
        
        submission.status = "PROCEEDING"
        submission.proceeded_at = datetime.utcnow()
        self.db.commit()
        
        return {
            "submission_id": submission_id,
            "status": submission.status,
            "message": "Proceeding to next stage"
        }



def proceed_further(self, submission_id: int) -> Dict[str, Any]:
    """Client proceeds with the computation bill"""
    submission = self.db.query(ClientSubmission).filter(
        ClientSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise ValueError("Submission not found")
    
    if submission.computation_bill_status != 'SENT_TO_CLIENT':
        raise ValueError("Computation bill is not ready for confirmation")
    
    # Update status
    submission.computation_bill_status = 'CONFIRMED_BY_CLIENT'
    submission.computation_bill_confirmed_at = datetime.utcnow()
    submission.status = SubmissionStatus.CONFIRMED
    
    # Generate the final bill
    bill = self._generate_final_bill(submission)
    submission.bill_id = bill.id
    
    self.db.commit()
    self.db.refresh(submission)
    
    # Trigger OneDrive upload via background task or direct call
    self._trigger_onedrive_upload(submission)
    
    return {
        "submission_id": submission.id,
        "status": submission.status,
        "bill_id": bill.id,
        "message": "Submission confirmed and proceeding to CA"
    }


def _trigger_onedrive_upload(self, submission):
    """Trigger OneDrive upload for the submission"""
    # This can be implemented as a background task or direct call
    # The actual implementation is in the API layer
    pass        