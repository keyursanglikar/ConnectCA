from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime
import os
import shutil
from pathlib import Path

from app.models.document import Document, DocumentStatus
from app.models.client import ClientMaster
from app.models.fy_master import FYMaster
from app.schemas.document import DocumentUploadRequest


class DocumentService:
    """Document management service - Classification is stored once and never re-calculated"""

    @staticmethod
    def create_document_request(
        db: Session,
        user_id: int,
        document_data: DocumentUploadRequest
    ) -> Document:
        """Create a document request for a client with classification results"""
        # Verify client exists and belongs to CA
        client = db.query(ClientMaster).filter(
            ClientMaster.id == document_data.client_id,
            ClientMaster.user_id == user_id
        ).first()
        
        if not client:
            raise ValueError("Client not found or not authorized")
        
        # Get financial year
        fy = db.query(FYMaster).filter(FYMaster.id == document_data.fy_id).first()
        if not fy:
            raise ValueError("Financial year not found")
        
        # ⭐ Create document record with classification results
        db_doc = Document(
            user_id=user_id,
            client_id=document_data.client_id,
            fy_id=document_data.fy_id,
            document_type=document_data.document_type,
            file_title=document_data.file_title,
            file_name="",  # Will be updated when uploaded
            status=DocumentStatus.PENDING_UPLOAD,
            remarks=document_data.remarks,
            # ⭐ Store classification results from frontend
            bill_as=document_data.bill_as or "ignore",
            detected_label=document_data.detected_label,
            confidence=document_data.confidence
        )
        
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)
        
        # Update client's documents_required list
        if document_data.document_type not in client.documents_required:
            required = client.documents_required or []
            required.append(document_data.document_type)
            client.documents_required = required
            db.commit()
        
        return db_doc

    @staticmethod
    def upload_document(
        db: Session,
        document_id: int,
        user_id: int,
        file_data: dict,
        uploaded_by: str = "client"
    ) -> Optional[Document]:
        """Upload a document file - preserves existing classification"""
        doc = db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == user_id
        ).first()
        
        if not doc:
            return None
        
        # Update document with file details (preserve bill_as, detected_label, confidence)
        doc.file_name = file_data.get('filename', '')
        doc.file_size = file_data.get('size', 0)
        doc.file_type = file_data.get('type', '')
        doc.gdrive_file_id = file_data.get('gdrive_file_id')
        doc.gdrive_web_link = file_data.get('gdrive_web_link')
        doc.local_path = file_data.get('local_path')
        doc.status = DocumentStatus.UPLOADED
        doc.uploaded_at = datetime.utcnow()
        doc.uploaded_by = uploaded_by
        
        db.commit()
        db.refresh(doc)
        
        # Update client's documents_uploaded list
        client = db.query(ClientMaster).filter(ClientMaster.id == doc.client_id).first()
        if client:
            uploaded = client.documents_uploaded or []
            if doc.document_type not in uploaded:
                uploaded.append(doc.document_type)
                client.documents_uploaded = uploaded
                db.commit()
        
        return doc

    @staticmethod
    def update_document_status(
        db: Session,
        document_id: int,
        user_id: int,
        status: DocumentStatus,
        remarks: Optional[str] = None
    ) -> Optional[Document]:
        """Update document status"""
        doc = db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == user_id
        ).first()
        
        if not doc:
            return None
        
        doc.status = status
        if remarks:
            doc.remarks = remarks
        doc.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(doc)
        return doc

    @staticmethod
    def get_client_documents(
        db: Session,
        client_id: int,
        user_id: int
    ) -> List[Document]:
        """Get all documents for a client - returns classification results from database"""
        # Verify client belongs to CA
        client = db.query(ClientMaster).filter(
            ClientMaster.id == client_id,
            ClientMaster.user_id == user_id
        ).first()
        
        if not client:
            return []
        
        # ⭐ Simply return documents with their stored classification
        # No re-classification happens here
        return db.query(Document).filter(Document.client_id == client_id).all()

    @staticmethod
    def get_document(
        db: Session,
        document_id: int,
        user_id: int
    ) -> Optional[Document]:
        """Get a specific document"""
        return db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == user_id
        ).first()

    @staticmethod
    def delete_document(
        db: Session,
        document_id: int,
        user_id: int
    ) -> bool:
        """Delete a document"""
        doc = db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == user_id
        ).first()
        
        if not doc:
            return False
        
        # Delete physical file if exists
        if doc.local_path and os.path.exists(doc.local_path):
            try:
                os.remove(doc.local_path)
            except:
                pass
        
        db.delete(doc)
        db.commit()
        return True

    @staticmethod
    def confirm_fee_for_document(
        db: Session,
        document_id: int,
        user_id: int
    ) -> Optional[Document]:
        """Mark document fee as confirmed"""
        doc = db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == user_id
        ).first()
        
        if not doc:
            return None
        
        doc.fee_confirmed = True
        doc.fee_confirmed_at = datetime.utcnow()
        
        db.commit()
        db.refresh(doc)
        return doc