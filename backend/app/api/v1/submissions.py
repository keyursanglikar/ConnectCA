# # app/api/v1/submissions.py
# from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile
# from sqlalchemy.orm import Session
# from typing import Any, List, Optional, Dict
# from datetime import datetime
# import json
# import logging
# import os
# import traceback

# from app.core.database import get_db
# from app.core.dependencies import get_current_ca, get_current_client, get_current_user
# from app.models.user import User
# from app.models.client import ClientMaster
# from app.models.client_submission import ClientSubmission, SubmissionStatus
# from app.models.document import Document
# from app.models.bills import Bill, BillStatus, BillItem
# from app.models.notification import Notification
# from app.services.onedrive_service import OneDriveService
# from app.services.computation_bill_service import ComputationBillService
# from app.services.computation_bill_parser import parse_computation_bill
# from app.schemas.submission import (
#     SubmissionResponse,
#     SubmissionListResponse,
#     SubmissionStatusUpdate,
#     BillGenerateRequest,
#     ClientSubmissionCreate,
#     UploadComputationRequest,
#     EditBillRequest,
#     SubmissionStatusResponse
# )
# from app.services.bill_service import BillService
# from app.core.config import settings
# from app.services.onedrive_service import OneDriveService

# SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".doc"}

# logger = logging.getLogger(__name__)

# router = APIRouter(prefix="/submissions", tags=["Submissions"])
# onedrive_service = OneDriveService()


# # ============ CREATE SUBMISSION (Client) ============
# @router.post("/", response_model=SubmissionResponse)
# async def create_submission(
#     submission_data: ClientSubmissionCreate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_client)
# ) -> Any:
#     """Client creates a new submission"""
#     client = db.query(ClientMaster).filter(
#         ClientMaster.user_id == current_user.id
#     ).first()
    
#     if not client:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Client not found"
#         )
    
#     submission = ClientSubmission(
#         client_id=client.id,
#         ca_user_id=client.ca_user_id,
#         documents_data=submission_data.documents_data,
#         adjustments=submission_data.adjustments.dict() if submission_data.adjustments else {},
#         estimated_bill=submission_data.estimated_bill.dict() if submission_data.estimated_bill else {},
#         total_estimate=submission_data.total_estimate,
#         status=SubmissionStatus.PENDING,
#         created_at=datetime.utcnow(),
#         updated_at=datetime.utcnow()
#     )
    
#     db.add(submission)
#     db.commit()
#     db.refresh(submission)
    
#     for doc_data in submission_data.documents_data:
#         doc_id = doc_data.get('document_id')
#         if doc_id:
#             doc = db.query(Document).filter(Document.id == doc_id).first()
#             if doc:
#                 doc.submission_id = submission.id
#                 db.commit()
    
#     notification = Notification(
#         user_id=client.ca_user_id,
#         type="submission_received",
#         message=f"New submission received from {current_user.name}",
#         is_read=False,
#         data={
#             "submission_id": submission.id,
#             "client_id": client.id,
#             "client_name": current_user.name
#         }
#     )
#     db.add(notification)
#     db.commit()
    
#     return {
#         "id": submission.id,
#         "client_id": submission.client_id,
#         "client_name": current_user.name,
#         "client_email": current_user.email,
#         "status": submission.status,
#         "documents": submission.documents_data,
#         "adjustments": submission.adjustments,
#         "estimated_bill": submission.estimated_bill,
#         "total_estimate": submission.total_estimate,
#         "ca_notes": submission.ca_notes,
#         "bill_id": submission.bill_id,
#         "created_at": submission.created_at,
#         "updated_at": submission.updated_at,
#         "reviewed_at": submission.reviewed_at
#     }


# # ============ GET ALL SUBMISSIONS (CA) ============
# @router.get("/", response_model=List[SubmissionListResponse])
# async def get_submissions(
#     status: Optional[str] = None,
#     skip: int = Query(0, ge=0),
#     limit: int = Query(50, ge=1, le=100),
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_ca)
# ) -> Any:
#     query = db.query(ClientSubmission).filter(
#         ClientSubmission.ca_user_id == current_user.id
#     )
    
#     if status:
#         query = query.filter(ClientSubmission.status == status)
    
#     submissions = query.order_by(
#         ClientSubmission.created_at.desc()
#     ).offset(skip).limit(limit).all()
    
#     result = []
#     for sub in submissions:
#         client = db.query(ClientMaster).filter(ClientMaster.id == sub.client_id).first()
#         client_user = db.query(User).filter(User.id == client.user_id).first() if client else None
        
#         result.append({
#             "id": sub.id,
#             "client_id": sub.client_id,
#             "client_name": client_user.name if client_user else "Unknown",
#             "client_email": client_user.email if client_user else "",
#             "status": sub.status,
#             "total_estimate": sub.total_estimate,
#             "document_count": len(sub.documents_data or []),
#             "created_at": sub.created_at,
#             "updated_at": sub.updated_at,
#             "bill_id": sub.bill_id
#         })
    
#     return result


# # ============ GET SUBMISSION DETAILS ============
# @router.get("/{submission_id}", response_model=SubmissionResponse)
# async def get_submission(
#     submission_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ) -> Any:
#     submission = db.query(ClientSubmission).filter(
#         ClientSubmission.id == submission_id
#     ).first()
    
#     if not submission:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Submission not found"
#         )
    
#     if current_user.role == 'CA':
#         if submission.ca_user_id != current_user.id:
#             raise HTTPException(
#                 status_code=status.HTTP_403_FORBIDDEN,
#                 detail="Not authorized to view this submission"
#             )
#     elif current_user.role == 'CLIENT':
#         client = db.query(ClientMaster).filter(ClientMaster.user_id == current_user.id).first()
#         if not client or submission.client_id != client.id:
#             raise HTTPException(
#                 status_code=status.HTTP_403_FORBIDDEN,
#                 detail="Not authorized to view this submission"
#             )
#     else:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Not authorized"
#         )
    
#     client = db.query(ClientMaster).filter(ClientMaster.id == submission.client_id).first()
#     client_user = db.query(User).filter(User.id == client.user_id).first() if client else None
    
#     return {
#         "id": submission.id,
#         "client_id": submission.client_id,
#         "client_name": client_user.name if client_user else "Unknown",
#         "client_email": client_user.email if client_user else "",
#         "status": submission.status,
#         "documents": submission.documents_data or [],
#         "adjustments": submission.adjustments or {},
#         "estimated_bill": submission.estimated_bill or {},
#         "total_estimate": submission.total_estimate,
#         "ca_notes": submission.ca_notes,
#         "bill_id": submission.bill_id,
#         "created_at": submission.created_at,
#         "updated_at": submission.updated_at,
#         "reviewed_at": submission.reviewed_at,
#         "onedrive_folder_path": submission.onedrive_folder_path,
#         "onedrive_folder_url": submission.onedrive_folder_url,
#         "document_links": submission.document_links,
#         "onedrive_upload_status": submission.onedrive_upload_status,
#         "computation_link": submission.computation_link,
#         "computation_file_name": submission.computation_file_name,
#         "computation_uploaded_at": submission.computation_uploaded_at
#     }


# # ============ UPDATE SUBMISSION STATUS (CA) ============
# @router.patch("/{submission_id}/status", response_model=SubmissionStatusResponse)
# async def update_submission_status(
#     submission_id: int,
#     status_data: SubmissionStatusUpdate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_ca)
# ) -> Any:
#     submission = db.query(ClientSubmission).filter(
#         ClientSubmission.id == submission_id,
#         ClientSubmission.ca_user_id == current_user.id
#     ).first()
    
#     if not submission:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Submission not found"
#         )
    
#     submission.status = status_data.status
#     submission.ca_notes = status_data.notes
#     submission.reviewed_at = datetime.utcnow()
#     db.commit()
    
#     client = db.query(ClientMaster).filter(ClientMaster.id == submission.client_id).first()
#     if client:
#         notification = Notification(
#             user_id=client.user_id,
#             type="submission_update",
#             message=f"Your submission status has been updated to {status_data.status}",
#             is_read=False,
#             data={
#                 "submission_id": submission.id,
#                 "status": status_data.status,
#                 "notes": status_data.notes
#             }
#         )
#         db.add(notification)
#         db.commit()
    
#     return {
#         "id": submission.id,
#         "status": submission.status,
#         "updated_at": submission.updated_at,
#         "message": f"Submission status updated to {status_data.status}"
#     }


# # ============ UPLOAD COMPUTATION BILL (CA) ============
# # app/api/v1/submissions.py (add/modify these endpoints)

# @router.post("/{submission_id}/upload-computation-bill")
# async def upload_computation_bill(
#     submission_id: int,
#     file: UploadFile = File(...),
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Upload a computation bill and auto-generate fee components"""
    
#     # Validate user is CA
#     if current_user.role != UserRole.CA:
#         raise HTTPException(status_code=403, detail="Only CA can upload computation bills")
    
#     # Get submission
#     submission = db.query(ClientSubmission).filter(
#         ClientSubmission.id == submission_id,
#         ClientSubmission.ca_user_id == current_user.id
#     ).first()
    
#     if not submission:
#         raise HTTPException(status_code=404, detail="Submission not found")
    
#     # Validate file type
#     if not file.filename.endswith(('.pdf', '.docx', '.doc')):
#         raise HTTPException(status_code=400, detail="Only PDF and DOCX files are allowed")
    
#     # Save file
#     upload_dir = Path("uploads/computation_bills")
#     upload_dir.mkdir(parents=True, exist_ok=True)
    
#     file_path = upload_dir / f"submission_{submission_id}_{file.filename}"
    
#     with open(file_path, "wb") as f:
#         content = await file.read()
#         f.write(content)
    
#     try:
#         # Parse the computation bill
#         from app.services.computation_bill_parser import parse_computation_bill
#         parsed_data = parse_computation_bill(str(file_path), file.filename)
        
#         # Initialize the computation bill service
#         from app.services.computation_bill_service import ComputationBillService
#         bill_service = ComputationBillService(db)
        
#         # Option 1: Generate bill from fee categories (keyword matching)
#         bill_data = bill_service.generate_bill_from_computation_file(
#             submission_id=submission_id,
#             ca_user_id=current_user.id,
#             parsed_data=parsed_data
#         )
        
#         # Option 2: Or generate from published pamplate
#         # bill_data = bill_service.generate_bill_from_published_pamplate(
#         #     submission_id=submission_id,
#         #     ca_user_id=current_user.id,
#         #     parsed_data=parsed_data
#         # )
        
#         # Save file info to submission
#         submission.computation_bill_file_path = str(file_path)
#         submission.computation_bill_file_name = file.filename
#         submission.computation_bill_status = "DRAFT"
#         db.commit()
        
#         return {
#             "message": "Computation bill uploaded and parsed successfully",
#             "submission_id": submission_id,
#             "file_name": file.filename,
#             "detected": parsed_data.get('detected', {}),
#             "detected_count": sum(1 for v in parsed_data.get('detected', {}).values() if v),
#             "bill_data": bill_data,
#             "parsed_info": {
#                 "client_name": parsed_data.get('client_name'),
#                 "pan": parsed_data.get('pan'),
#                 "income_amounts": parsed_data.get('income_amounts', {})
#             }
#         }
        
#     except Exception as e:
#         logger.error(f"Error parsing computation bill: {e}")
#         raise HTTPException(status_code=500, detail=f"Failed to parse bill: {str(e)}")



# # ============ GET COMPUTATION FILES ============
# @router.get("/{submission_id}/computation-files")
# async def get_computation_files(
#     submission_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ) -> Any:
#     """List computation bill files uploaded for this submission"""
#     submission = db.query(ClientSubmission).filter(
#         ClientSubmission.id == submission_id
#     ).first()
 
#     if not submission:
#         raise HTTPException(status_code=404, detail="Submission not found")
 
#     if current_user.role == 'CA':
#         if submission.ca_user_id != current_user.id:
#             raise HTTPException(status_code=403, detail="Not authorized")
#     elif current_user.role == 'CLIENT':
#         client = db.query(ClientMaster).filter(ClientMaster.user_id == current_user.id).first()
#         if not client or submission.client_id != client.id:
#             raise HTTPException(status_code=403, detail="Not authorized")
 
#     bill_data = submission.computation_bill_data or {}
#     return bill_data.get("files", [])
 

# @router.delete("/{submission_id}/computation-files/{file_id}")
# async def delete_computation_file(
#     submission_id: int,
#     file_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_ca)
# ) -> Any:
#     """Remove an uploaded computation bill file and clear the associated bill"""
#     submission = db.query(ClientSubmission).filter(
#         ClientSubmission.id == submission_id,
#         ClientSubmission.ca_user_id == current_user.id
#     ).first()

#     if not submission:
#         raise HTTPException(status_code=404, detail="Submission not found")

#     bill_data = submission.computation_bill_data or {}
    
#     # Check if there are files
#     if not bill_data or not bill_data.get("files"):
#         raise HTTPException(status_code=404, detail="No files found")

#     # Remove the file from the list
#     files = bill_data.get("files", [])
#     updated_files = [f for f in files if f.get("id") != file_id]

#     if len(updated_files) == len(files):
#         raise HTTPException(status_code=404, detail="File not found")

#     # CRITICAL FIX: If no files remain or this is the main file, COMPLETELY CLEAR the bill
#     should_clear_bill = len(updated_files) == 0 or (bill_data.get("file_name") and bill_data.get("file_name") == files[0].get("file_name") if files else False)

#     if should_clear_bill or len(updated_files) == 0:
#         # COMPLETELY CLEAR all computation bill data
#         submission.computation_bill_data = None
#         submission.computation_bill_status = None
#         submission.computation_bill_sent_at = None
#         submission.computation_bill_confirmed_at = None
#         submission.computation_bill_finalized_at = None
        
#         logger.info(f"Computation bill completely cleared for submission {submission_id}")
#     else:
#         # Update the files list
#         bill_data["files"] = updated_files
#         # Clear main file references
#         if bill_data.get("file_name"):
#             main_file_exists = any(f.get("file_name") == bill_data.get("file_name") for f in updated_files)
#             if not main_file_exists:
#                 bill_data["file_name"] = None
#                 bill_data["file_path"] = None
#                 bill_data["file_size"] = 0
#                 bill_data["fee_components"] = []
#                 bill_data["total"] = 0
#                 bill_data["detected"] = {}
#                 bill_data["detected_info"] = {}
#         submission.computation_bill_data = bill_data

#     db.commit()

#     return {
#         "message": "File removed successfully",
#         "cleared": should_clear_bill or len(updated_files) == 0,
#         "files_remaining": len(updated_files)
#     }


# # ============ CONFIRM COMPUTATION BILL (Client) ============
# @router.post("/{submission_id}/computation-bill/confirm")
# async def confirm_computation_bill(
#     submission_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_client)
# ) -> Any:
#     """Client confirms the computation bill"""
#     client = db.query(ClientMaster).filter(
#         ClientMaster.user_id == current_user.id
#     ).first()
    
#     if not client:
#         raise HTTPException(status_code=404, detail="Client not found")
    
#     submission = db.query(ClientSubmission).filter(
#         ClientSubmission.id == submission_id,
#         ClientSubmission.client_id == client.id
#     ).first()
    
#     if not submission:
#         raise HTTPException(status_code=404, detail="Submission not found")
    
#     if not submission.computation_bill_data:
#         raise HTTPException(
#             status_code=400,
#             detail="No computation bill found for this submission"
#         )
    
#     current_status = submission.computation_bill_status or 'DRAFT'
    
#     if current_status in ['CONFIRMED_BY_CLIENT', 'CONFIRMED']:
#         return {
#             "message": "Computation bill already confirmed",
#             "submission_id": submission.id,
#             "status": current_status
#         }
    
#     if current_status not in ['SENT_TO_CLIENT', 'SENT']:
#         raise HTTPException(
#             status_code=400,
#             detail="Computation bill has not been sent to you yet"
#         )
    
#     # Confirm the bill
#     submission.computation_bill_status = 'CONFIRMED_BY_CLIENT'
#     submission.computation_bill_confirmed_at = datetime.utcnow()
#     db.commit()
    
#     # Notify CA
#     notification = Notification(
#         user_id=submission.ca_user_id,
#         type="computation_bill_confirmed",
#         message=f"Client has confirmed the computation bill for submission #{submission.id}",
#         is_read=False,
#         data={
#             "submission_id": submission.id,
#             "client_id": client.id,
#             "client_name": current_user.name
#         }
#     )
#     db.add(notification)
#     db.commit()
    
#     return {
#         "message": "Computation bill confirmed successfully",
#         "submission_id": submission.id,
#         "status": submission.computation_bill_status
#     }


# # ============ CANCEL COMPUTATION BILL (Client) ============
# @router.post("/{submission_id}/cancel")
# async def cancel_computation_bill(
#     submission_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_client)
# ) -> Any:
#     """Client cancels the computation bill"""
#     client = db.query(ClientMaster).filter(
#         ClientMaster.user_id == current_user.id
#     ).first()
    
#     if not client:
#         raise HTTPException(status_code=404, detail="Client not found")
    
#     submission = db.query(ClientSubmission).filter(
#         ClientSubmission.id == submission_id,
#         ClientSubmission.client_id == client.id
#     ).first()
    
#     if not submission:
#         raise HTTPException(status_code=404, detail="Submission not found")
    
#     if not submission.computation_bill_data:
#         raise HTTPException(
#             status_code=400,
#             detail="No computation bill found for this submission"
#         )
    
#     current_status = submission.computation_bill_status or 'DRAFT'
    
#     if current_status in ['CANCELLED_BY_CLIENT']:
#         return {
#             "message": "Computation bill already cancelled",
#             "submission_id": submission.id,
#             "status": current_status
#         }
    
#     if current_status not in ['SENT_TO_CLIENT', 'SENT']:
#         raise HTTPException(
#             status_code=400,
#             detail="Computation bill is not in a cancellable state"
#         )
    
#     # Update status
#     submission.computation_bill_status = 'CANCELLED_BY_CLIENT'
#     submission.computation_bill_cancelled_at = datetime.utcnow()
#     db.commit()
    
#     # Notify CA
#     notification = Notification(
#         user_id=submission.ca_user_id,
#         type="computation_bill_cancelled",
#         message=f"Client has cancelled the computation bill for submission #{submission.id}",
#         is_read=False,
#         data={
#             "submission_id": submission.id,
#             "client_id": client.id,
#             "client_name": current_user.name
#         }
#     )
#     db.add(notification)
#     db.commit()
    
#     return {
#         "message": "Computation bill cancelled successfully",
#         "submission_id": submission.id,
#         "status": submission.computation_bill_status
#     }


# # ============ PROCEED FURTHER (Client) ============
# @router.post("/{submission_id}/proceed")
# async def proceed_further(
#     submission_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_client)
# ) -> Any:
#     """Client confirms the computation bill and proceeds to CA for final processing"""
#     client = db.query(ClientMaster).filter(
#         ClientMaster.user_id == current_user.id
#     ).first()
    
#     if not client:
#         raise HTTPException(status_code=404, detail="Client not found")
    
#     submission = db.query(ClientSubmission).filter(
#         ClientSubmission.id == submission_id,
#         ClientSubmission.client_id == client.id
#     ).first()
    
#     if not submission:
#         raise HTTPException(status_code=404, detail="Submission not found")
    
#     # Check if computation bill exists
#     if not submission.computation_bill_data:
#         raise HTTPException(
#             status_code=400,
#             detail="No computation bill found for this submission"
#         )
    
#     # Check the current status
#     current_status = submission.computation_bill_status or 'DRAFT'
    
#     # If already confirmed, just proceed
#     if current_status in ['CONFIRMED_BY_CLIENT', 'CONFIRMED']:
#         # Already confirmed, just update submission status if needed
#         if submission.status != SubmissionStatus.CONFIRMED:
#             submission.status = SubmissionStatus.CONFIRMED
#             db.commit()
        
#         # Trigger OneDrive upload
#         try:
#             await trigger_onedrive_upload(submission_id, db)
#         except Exception as e:
#             logger.error(f"OneDrive upload failed: {str(e)}")
        
#         return {
#             "message": "Proceeded successfully. Documents and computation bill have been sent to your CA.",
#             "submission_id": submission.id,
#             "status": submission.status,
#             "computation_bill_status": submission.computation_bill_status
#         }
    
#     # If not confirmed, require confirmation first
#     if current_status not in ['SENT_TO_CLIENT', 'SENT']:
#         raise HTTPException(
#             status_code=400,
#             detail="Computation bill has not been sent to you yet. Please wait for your CA to send the bill."
#         )
    
#     # Confirm the computation bill
#     submission.computation_bill_status = 'CONFIRMED_BY_CLIENT'
#     submission.computation_bill_confirmed_at = datetime.utcnow()
#     submission.status = SubmissionStatus.CONFIRMED
#     db.commit()
    
#     # Notify CA
#     notification = Notification(
#         user_id=submission.ca_user_id,
#         type="computation_bill_confirmed",
#         message=f"Client has confirmed the computation bill for submission #{submission.id}",
#         is_read=False,
#         data={
#             "submission_id": submission.id,
#             "client_id": client.id,
#             "client_name": current_user.name
#         }
#     )
#     db.add(notification)
#     db.commit()
    
#     # Trigger OneDrive upload
#     try:
#         await trigger_onedrive_upload(submission_id, db)
#     except Exception as e:
#         logger.error(f"OneDrive upload failed: {str(e)}")
#         # Don't fail the request, just log the error
    
#     return {
#         "message": "Proceeded successfully. Documents and computation bill have been sent to your CA.",
#         "submission_id": submission.id,
#         "status": submission.status,
#         "computation_bill_status": submission.computation_bill_status
#     }


# # ============ UPLOAD TO ONEDRIVE ============
# async def trigger_onedrive_upload(submission_id: int, db: Session):
#     """Helper function to upload submission to OneDrive"""
#     submission = db.query(ClientSubmission).filter(
#         ClientSubmission.id == submission_id
#     ).first()
    
#     if not submission:
#         return
    
#     # Get the CA user
#     ca_user = db.query(User).filter(User.id == submission.ca_user_id).first()
#     if not ca_user or not ca_user.onedrive_access_token:
#         logger.warning(f"CA user {submission.ca_user_id} has no OneDrive access token")
#         return
    
#     try:
#         service = OneDriveService(user=ca_user)
#         client = db.query(ClientMaster).filter(ClientMaster.id == submission.client_id).first()
        
#         folder_path = f"EazyTax/CA_{submission.ca_user_id}/Client_{submission.client_id}/Submission_{submission.id}_{datetime.utcnow().strftime('%Y%m%d')}"
        
#         # Create folder structure
#         folder_info = service.create_folder(folder_path)
#         document_links = []
        
#         # Upload client documents
#         if submission.documents_data:
#             docs_folder = f"{folder_path}/Documents"
#             service.create_folder(docs_folder)
            
#             for idx, doc_data in enumerate(submission.documents_data or []):
#                 file_name = doc_data.get('file_title', f"document_{idx+1}")
#                 file_name = "".join(c for c in file_name if c.isalnum() or c in " ._-")
                
#                 try:
#                     # Get file from storage
#                     doc_id = doc_data.get('document_id')
#                     if doc_id:
#                         doc = db.query(Document).filter(Document.id == doc_id).first()
#                         if doc and doc.file_path:
#                             with open(doc.file_path, 'rb') as f:
#                                 file_content = f.read()
                            
#                             result = service.upload_file(file_content, file_name, docs_folder)
#                             link = service.get_shareable_link(f"{docs_folder}/{file_name}")
#                             document_links.append({
#                                 "name": file_name,
#                                 "type": doc.document_type or 'Document',
#                                 "link": link,
#                                 "path": f"{docs_folder}/{file_name}"
#                             })
#                 except Exception as e:
#                     logger.error(f"Failed to upload {file_name}: {str(e)}")
        
#         # Upload computation bill
#         if submission.computation_bill_data:
#             comp_folder = f"{folder_path}/Computation_Bill"
#             service.create_folder(comp_folder)
            
#             # Generate PDF of the computation bill
#             try:
#                 from app.services.computation_bill_service import generate_computation_bill_pdf
#                 bill_pdf = generate_computation_bill_pdf(submission)
#                 if bill_pdf:
#                     result = service.upload_file(bill_pdf, f"Computation_Bill_{submission.id}.pdf", comp_folder)
#                     link = service.get_shareable_link(f"{comp_folder}/Computation_Bill_{submission.id}.pdf")
#                     document_links.append({
#                         "name": f"Computation_Bill_{submission.id}.pdf",
#                         "type": "Computation Bill",
#                         "link": link,
#                         "path": f"{comp_folder}/Computation_Bill_{submission.id}.pdf"
#                     })
#             except Exception as e:
#                 logger.error(f"Failed to generate computation bill PDF: {str(e)}")
        
#         # Update submission with OneDrive info
#         submission.onedrive_folder_path = folder_path        
#         submission.onedrive_folder_url = folder_info.get("webUrl")
#         submission.document_links = document_links
#         submission.onedrive_upload_status = "COMPLETED"
#         db.commit()
        
#         logger.info(f"Auto-uploaded to OneDrive for submission {submission.id}")
        
#     except Exception as e:
#         logger.error(f"Auto-upload to OneDrive failed: {str(e)}")
#         submission.onedrive_upload_status = "FAILED"
#         db.commit()
#         raise


# # ============ COMPUTATION BILL ENDPOINTS ============

# @router.post("/{submission_id}/computation-bill/create")
# async def create_computation_bill(
#     submission_id: int,
#     request: dict,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_ca)
# ) -> Any:
#     submission = db.query(ClientSubmission).filter(
#         ClientSubmission.id == submission_id,
#         ClientSubmission.ca_user_id == current_user.id
#     ).first()
    
#     if not submission:
#         raise HTTPException(status_code=404, detail="Submission not found")
    
#     try:
#         service = ComputationBillService(db)
#         bill_data = service.create_computation_bill_from_documents(
#             submission_id,
#             current_user.id,
#             request.get('adjustments', {})
#         )
        
#         return {
#             "message": "Computation bill created successfully",
#             "bill_data": bill_data
#         }
        
#     except ValueError as e:
#         raise HTTPException(status_code=400, detail=str(e))
#     except Exception as e:
#         logger.error(f"Error creating computation bill: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


# @router.get("/{submission_id}/computation-bill")
# async def get_computation_bill(
#     submission_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ) -> Any:
#     submission = db.query(ClientSubmission).filter(
#         ClientSubmission.id == submission_id
#     ).first()
    
#     if not submission:
#         raise HTTPException(status_code=404, detail="Submission not found")
    
#     if current_user.role == 'CA':
#         if submission.ca_user_id != current_user.id:
#             raise HTTPException(status_code=403, detail="Not authorized")
#     elif current_user.role == 'CLIENT':
#         client = db.query(ClientMaster).filter(ClientMaster.user_id == current_user.id).first()
#         if not client or submission.client_id != client.id:
#             raise HTTPException(status_code=403, detail="Not authorized")
    
#     if not submission.computation_bill_data:
#         return {
#             "has_bill": False,
#             "message": "No computation bill exists"
#         }
    
#     return {
#         "has_bill": True,
#         "bill_data": submission.computation_bill_data,
#         "status": submission.computation_bill_status
#     }


# @router.put("/{submission_id}/computation-bill/update")
# async def update_computation_bill(
#     submission_id: int,
#     request: dict,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_ca)
# ) -> Any:
#     submission = db.query(ClientSubmission).filter(
#         ClientSubmission.id == submission_id,
#         ClientSubmission.ca_user_id == current_user.id
#     ).first()
    
#     if not submission:
#         raise HTTPException(status_code=404, detail="Submission not found")
    
#     try:
#         service = ComputationBillService(db)
#         bill_data = service.update_computation_bill(
#             submission_id,
#             request.get('fee_components', []),
#             request.get('notes')
#         )
        
#         return {
#             "message": "Computation bill updated successfully",
#             "bill_data": bill_data
#         }
        
#     except ValueError as e:
#         raise HTTPException(status_code=400, detail=str(e))


# @router.post("/{submission_id}/computation-bill/send")
# async def send_computation_bill_to_client(
#     submission_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_ca)
# ) -> Any:
#     submission = db.query(ClientSubmission).filter(
#         ClientSubmission.id == submission_id,
#         ClientSubmission.ca_user_id == current_user.id
#     ).first()
    
#     if not submission:
#         raise HTTPException(status_code=404, detail="Submission not found")
    
#     try:
#         service = ComputationBillService(db)
#         bill_data = service.send_computation_bill_to_client(submission_id)
        
#         return {
#             "message": "Computation bill sent to client successfully",
#             "bill_data": bill_data
#         }
        
#     except ValueError as e:
#         raise HTTPException(status_code=400, detail=str(e))


# @router.post("/{submission_id}/computation-bill/finalize")
# async def finalize_computation_bill(
#     submission_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_ca)
# ) -> Any:
#     submission = db.query(ClientSubmission).filter(
#         ClientSubmission.id == submission_id,
#         ClientSubmission.ca_user_id == current_user.id
#     ).first()
    
#     if not submission:
#         raise HTTPException(status_code=404, detail="Submission not found")
    
#     try:
#         service = ComputationBillService(db)
#         bill_data = service.finalize_computation_bill(submission_id)
        
#         submission.status = SubmissionStatus.CONFIRMED
#         db.commit()
        
#         return {
#             "message": "Computation bill finalized successfully",
#             "bill_data": bill_data
#         }
        
#     except ValueError as e:
#         raise HTTPException(status_code=400, detail=str(e))


# # ============ DOCUMENT UPLOAD ENDPOINTS ============

# @router.post("/{submission_id}/upload-documents")
# async def upload_documents(
#     submission_id: int,
#     files: List[UploadFile] = File(...),
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_ca)
# ) -> Any:
#     submission = db.query(ClientSubmission).filter(
#         ClientSubmission.id == submission_id,
#         ClientSubmission.ca_user_id == current_user.id
#     ).first()
    
#     if not submission:
#         raise HTTPException(status_code=404, detail="Submission not found")
    
#     uploaded_docs = []
#     for file in files:
#         file_path = f"uploads/documents/submission_{submission_id}/{file.filename}"
#         os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
#         content = await file.read()
#         with open(file_path, "wb") as f:
#             f.write(content)
        
#         doc = {
#             "id": len(uploaded_docs) + 1,
#             "file_name": file.filename,
#             "file_size": len(content),
#             "file_path": file_path,
#             "uploaded_at": datetime.utcnow().isoformat(),
#             "submission_id": submission_id,
#             "uploaded_by": current_user.id,
#             "uploaded_by_name": current_user.name
#         }
#         uploaded_docs.append(doc)
    
#     submission.documents_data = submission.documents_data or []
#     for doc in uploaded_docs:
#         submission.documents_data.append({
#             "document_id": doc["id"],
#             "file_title": doc["file_name"],
#             "file_path": doc["file_path"],
#             "uploaded_at": doc["uploaded_at"],
#             "uploaded_by": doc["uploaded_by_name"],
#             "source": "ca"
#         })
    
#     db.commit()
    
#     return {
#         "message": f"Uploaded {len(uploaded_docs)} documents",
#         "documents": uploaded_docs
#     }


# @router.get("/{submission_id}/documents")
# async def get_documents(
#     submission_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ) -> Any:
#     submission = db.query(ClientSubmission).filter(
#         ClientSubmission.id == submission_id
#     ).first()
    
#     if not submission:
#         raise HTTPException(status_code=404, detail="Submission not found")
    
#     documents = []
#     for doc_data in submission.documents_data or []:
#         documents.append({
#             "id": doc_data.get("document_id"),
#             "file_name": doc_data.get("file_title"),
#             "file_path": doc_data.get("file_path"),
#             "uploaded_at": doc_data.get("uploaded_at"),
#             "uploaded_by": doc_data.get("uploaded_by", "Client"),
#             "source": doc_data.get("source", "client")
#         })
    
#     return documents


# @router.delete("/{submission_id}/documents/{document_id}")
# async def delete_document(
#     submission_id: int,
#     document_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_ca)
# ) -> Any:
#     submission = db.query(ClientSubmission).filter(
#         ClientSubmission.id == submission_id,
#         ClientSubmission.ca_user_id == current_user.id
#     ).first()
    
#     if not submission:
#         raise HTTPException(status_code=404, detail="Submission not found")
    
#     submission.documents_data = [
#         doc for doc in submission.documents_data or []
#         if doc.get("document_id") != document_id
#     ]
    
#     db.commit()
    
#     return {"message": "Document deleted successfully"}


# # ============ GENERATE BILL (CA) ============
# @router.post("/{submission_id}/generate-bill")
# async def generate_bill(
#     submission_id: int,
#     request: BillGenerateRequest,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_ca)
# ) -> Any:
#     submission = db.query(ClientSubmission).filter(
#         ClientSubmission.id == submission_id,
#         ClientSubmission.ca_user_id == current_user.id
#     ).first()
    
#     if not submission:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Submission not found"
#         )
    
#     try:
#         if request.items:
#             bill = BillService.create_bill_from_items(
#                 db, 
#                 current_user.id, 
#                 submission.client_id, 
#                 request.items, 
#                 request.notes
#             )
#         else:
#             bill = BillService.create_bill_from_submission(db, current_user.id, submission, request.notes)
        
#         submission.bill_id = bill.id
#         submission.bill_draft_data = {
#             "bill_id": bill.id,
#             "bill_number": bill.bill_number,
#             "total_amount": float(bill.total_amount),
#             "gst_amount": float(bill.gst_amount),
#             "grand_total": float(bill.grand_total),
#             "items": [
#                 {
#                     "id": item.id,
#                     "description": item.description,
#                     "amount": float(item.amount),
#                     "gst_amount": float(item.gst_amount),
#                     "total_amount": float(item.total_amount)
#                 } for item in bill.items
#             ],
#             "notes": bill.notes
#         }
#         submission.status = SubmissionStatus.BILL_GENERATED
#         submission.bill_generated_at = datetime.utcnow()
#         db.commit()
        
#         client = db.query(ClientMaster).filter(ClientMaster.id == submission.client_id).first()
#         if client:
#             notification = Notification(
#                 user_id=client.user_id,
#                 type="bill_generated",
#                 message=f"CA has generated a bill for you. Please review and confirm.",
#                 is_read=False,
#                 data={
#                     "submission_id": submission.id,
#                     "bill_id": bill.id,
#                     "bill_number": bill.bill_number
#                 }
#             )
#             db.add(notification)
#             db.commit()
        
#         return {
#             "message": "Bill generated successfully",
#             "bill_id": bill.id,
#             "bill_number": bill.bill_number,
#             "grand_total": bill.grand_total,
#             "submission_id": submission.id
#         }
        
#     except ValueError as e:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=str(e)
#         )


# # ============ SEND BILL TO CLIENT (CA) ============
# @router.post("/{submission_id}/send-bill")
# async def send_bill_to_client(
#     submission_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_ca)
# ) -> Any:
#     submission = db.query(ClientSubmission).filter(
#         ClientSubmission.id == submission_id,
#         ClientSubmission.ca_user_id == current_user.id
#     ).first()
    
#     if not submission:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Submission not found"
#         )
    
#     if not submission.bill_id:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="No bill generated for this submission"
#         )
    
#     bill = db.query(Bill).filter(Bill.id == submission.bill_id).first()
#     if not bill:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Bill not found"
#         )
    
#     submission.status = SubmissionStatus.BILL_SENT
#     submission.bill_sent_at = datetime.utcnow()
#     submission.bill_final_data = {
#         "bill_id": bill.id,
#         "bill_number": bill.bill_number,
#         "total_amount": float(bill.total_amount),
#         "gst_amount": float(bill.gst_amount),
#         "grand_total": float(bill.grand_total),
#         "items": [
#             {
#                 "id": item.id,
#                 "description": item.description,
#                 "amount": float(item.amount),
#                 "gst_amount": float(item.gst_amount),
#                 "total_amount": float(item.total_amount)
#             } for item in bill.items
#         ],
#         "notes": bill.notes,
#         "sent_at": datetime.utcnow().isoformat()
#     }
#     db.commit()
    
#     client = db.query(ClientMaster).filter(ClientMaster.id == submission.client_id).first()
#     if client:
#         notification = Notification(
#             user_id=client.user_id,
#             type="bill_received",
#             message=f"CA has sent you a bill. Please review and confirm.",
#             is_read=False,
#             data={
#                 "submission_id": submission.id,
#                 "bill_id": bill.id,
#                 "bill_number": bill.bill_number,
#                 "grand_total": float(bill.grand_total)
#             }
#         )
#         db.add(notification)
#         db.commit()
    
#     return {
#         "message": "Bill sent to client successfully",
#         "bill_id": bill.id,
#         "bill_number": bill.bill_number
#     }


# # ============ CLIENT CONFIRMS BILL ============
# @router.post("/{submission_id}/confirm-bill")
# async def confirm_bill(
#     submission_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_client)
# ) -> Any:
#     client = db.query(ClientMaster).filter(
#         ClientMaster.user_id == current_user.id
#     ).first()
    
#     if not client:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Client not found"
#         )
    
#     submission = db.query(ClientSubmission).filter(
#         ClientSubmission.id == submission_id,
#         ClientSubmission.client_id == client.id
#     ).first()
    
#     if not submission:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Submission not found"
#         )
    
#     if submission.status != SubmissionStatus.BILL_SENT:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="No bill sent for this submission"
#         )
    
#     submission.status = SubmissionStatus.BILL_CONFIRMED
#     submission.bill_confirmed_at = datetime.utcnow()
#     submission.bill_confirmed_by_client = True
#     db.commit()
    
#     if submission.bill_id:
#         bill = db.query(Bill).filter(Bill.id == submission.bill_id).first()
#         if bill:
#             bill.status = BillStatus.ACCEPTED
#             bill.accepted_at = datetime.utcnow()
#             db.commit()
    
#     notification = Notification(
#         user_id=submission.ca_user_id,
#         type="bill_confirmed",
#         message=f"Client has confirmed the bill for submission #{submission.id}",
#         is_read=False,
#         data={
#             "submission_id": submission.id,
#             "client_id": client.id,
#             "client_name": current_user.name
#         }
#     )
#     db.add(notification)
#     db.commit()
    
#     # Trigger OneDrive upload
#     try:
#         await trigger_onedrive_upload(submission_id, db)
#         return {
#             "message": "Bill confirmed successfully and uploaded to OneDrive",
#             "submission_id": submission.id,
#             "status": "CONFIRMED"
#         }
#     except Exception as e:
#         logger.error(f"Auto-upload to OneDrive failed: {str(e)}")
#         return {
#             "message": "Bill confirmed successfully. OneDrive upload will be processed shortly.",
#             "submission_id": submission.id,
#             "status": "CONFIRMED",
#             "onedrive_upload_status": submission.onedrive_upload_status
#         }


# # ============ CLIENT GETS THEIR SUBMISSIONS ============
# @router.get("/client/my-submissions", response_model=List[SubmissionListResponse])
# async def get_my_submissions(
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_client)
# ) -> Any:
#     client = db.query(ClientMaster).filter(
#         ClientMaster.user_id == current_user.id
#     ).first()
    
#     if not client:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Client not found"
#         )
    
#     submissions = db.query(ClientSubmission).filter(
#         ClientSubmission.client_id == client.id
#     ).order_by(
#         ClientSubmission.created_at.desc()
#     ).all()
    
#     result = []
#     for sub in submissions:
#         result.append({
#             "id": sub.id,
#             "client_id": sub.client_id,
#             "client_name": current_user.name,
#             "client_email": current_user.email,
#             "status": sub.status,
#             "total_estimate": sub.total_estimate,
#             "document_count": len(sub.documents_data or []),
#             "created_at": sub.created_at,
#             "updated_at": sub.updated_at,
#             "bill_id": sub.bill_id
#         })
    
#     return result

# @router.post("/{submission_id}/upload-to-onedrive")
# async def upload_submission_to_onedrive(
#     submission_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_ca)
# ):
#     if not current_user.onedrive_access_token:
#         raise HTTPException(
#             status_code=400,
#             detail="Please connect OneDrive first: /api/v1/onedrive/login"
#         )
    
#     submission = db.query(ClientSubmission).filter(
#         ClientSubmission.id == submission_id,
#         ClientSubmission.ca_user_id == current_user.id
#     ).first()
    
#     if not submission:
#         raise HTTPException(status_code=404, detail="Submission not found")
    
#     # ✅ Pass db session to OneDriveService for token refresh
#     service = OneDriveService(user=current_user, db=db)
#     client = db.query(ClientMaster).filter(ClientMaster.id == submission.client_id).first()
    
#     folder_path = f"EazyTax/CA_{current_user.id}/Client_{submission.client_id}/Submission_{submission_id}_{datetime.utcnow().strftime('%Y%m%d')}"
    
#     try:
#         submission.onedrive_upload_status = "UPLOADING"
#         db.commit()
        
#         folder_info = service.create_folder(folder_path)
#         document_links = []
        
#         if submission.documents_data:
#             docs_folder = f"{folder_path}/Documents"
#             service.create_folder(docs_folder)
            
#             for idx, doc_data in enumerate(submission.documents_data):
#                 file_name = doc_data.get('file_title', f"document_{idx+1}.pdf")
#                 file_name = "".join(c for c in file_name if c.isalnum() or c in " ._-")
#                 file_content = doc_data.get('content', b'Placeholder content')
                
#                 try:
#                     result = service.upload_file(file_content, file_name, docs_folder)
#                     link = service.get_shareable_link(f"{docs_folder}/{file_name}")
#                     document_links.append({
#                         "name": file_name,
#                         "type": doc_data.get('document_type', 'Document'),
#                         "link": link,
#                         "path": f"{docs_folder}/{file_name}"
#                     })
#                 except Exception as e:
#                     logger.error(f"Failed to upload {file_name}: {str(e)}")
        
#         if submission.computation_bill_data and submission.computation_bill_data.get('file_name'):
#             comp_folder = f"{folder_path}/Computation"
#             service.create_folder(comp_folder)
#             comp_name = submission.computation_bill_data.get('file_name', 'computation.xlsx')
#             document_links.append({
#                 "name": comp_name,
#                 "type": "Computation",
#                 "link": submission.computation_bill_data.get('file_path', ''),
#                 "path": f"{comp_folder}/{comp_name}"
#             })
        
#         submission.onedrive_folder_path = folder_path
#         submission.onedrive_folder_url = folder_info.get("webUrl")
#         submission.document_links = document_links
#         submission.onedrive_upload_status = "COMPLETED"
#         submission.status = SubmissionStatus.CONFIRMED
#         db.commit()
        
#         return {
#             "message": "✅ Uploaded to OneDrive successfully!",
#             "folder_path": folder_path,
#             "folder_url": submission.onedrive_folder_url,
#             "documents_count": len(document_links),
#             "document_links": document_links
#         }
        
#     except Exception as e:
#         submission.onedrive_upload_status = "FAILED"
#         db.commit()
#         logger.error(f"OneDrive upload failed: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")









# backend/app/api/v1/submissions.py
from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile
from sqlalchemy.orm import Session
from typing import Any, List, Optional, Dict
from datetime import datetime
import json
import logging
import os
import shutil
from pathlib import Path

from app.core.database import get_db
from app.core.dependencies import get_current_ca, get_current_client, get_current_user
from app.models.user import User, UserRole
from app.models.client import ClientMaster
from app.models.client_submission import ClientSubmission, SubmissionStatus
from app.models.document import Document
from app.models.bills import Bill, BillStatus, BillItem
from app.models.notification import Notification
from app.services.onedrive_service import OneDriveService
from app.services.computation_bill_service import ComputationBillService
from app.services.computation_bill_parser import parse_computation_bill
from app.schemas.submission import (
    SubmissionResponse,
    SubmissionListResponse,
    SubmissionStatusUpdate,
    BillGenerateRequest,
    ClientSubmissionCreate,
    UploadComputationRequest,
    EditBillRequest,
    SubmissionStatusResponse
)
from app.services.bill_service import BillService
from app.core.config import settings

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".doc"}

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/submissions", tags=["Submissions"])
onedrive_service = OneDriveService()


# ============ CREATE SUBMISSION (Client) ============
@router.post("/", response_model=SubmissionResponse)
async def create_submission(
    submission_data: ClientSubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_client)
) -> Any:
    """Client creates a new submission"""
    client = db.query(ClientMaster).filter(
        ClientMaster.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    submission = ClientSubmission(
        client_id=client.id,
        ca_user_id=client.ca_user_id,
        documents_data=submission_data.documents_data,
        adjustments=submission_data.adjustments.dict() if submission_data.adjustments else {},
        estimated_bill=submission_data.estimated_bill.dict() if submission_data.estimated_bill else {},
        total_estimate=submission_data.total_estimate,
        status=SubmissionStatus.PENDING,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    for doc_data in submission_data.documents_data:
        doc_id = doc_data.get('document_id')
        if doc_id:
            doc = db.query(Document).filter(Document.id == doc_id).first()
            if doc:
                doc.submission_id = submission.id
                db.commit()
    
    notification = Notification(
        user_id=client.ca_user_id,
        type="submission_received",
        message=f"New submission received from {current_user.name}",
        is_read=False,
        data={
            "submission_id": submission.id,
            "client_id": client.id,
            "client_name": current_user.name
        }
    )
    db.add(notification)
    db.commit()
    
    return {
        "id": submission.id,
        "client_id": submission.client_id,
        "client_name": current_user.name,
        "client_email": current_user.email,
        "status": submission.status,
        "documents": submission.documents_data,
        "adjustments": submission.adjustments,
        "estimated_bill": submission.estimated_bill,
        "total_estimate": submission.total_estimate,
        "ca_notes": submission.ca_notes,
        "bill_id": submission.bill_id,
        "created_at": submission.created_at,
        "updated_at": submission.updated_at,
        "reviewed_at": submission.reviewed_at
    }


# ============ GET ALL SUBMISSIONS (CA) ============
@router.get("/", response_model=List[SubmissionListResponse])
async def get_submissions(
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    query = db.query(ClientSubmission).filter(
        ClientSubmission.ca_user_id == current_user.id
    )
    
    if status:
        query = query.filter(ClientSubmission.status == status)
    
    submissions = query.order_by(
        ClientSubmission.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    result = []
    for sub in submissions:
        client = db.query(ClientMaster).filter(ClientMaster.id == sub.client_id).first()
        client_user = db.query(User).filter(User.id == client.user_id).first() if client else None
        
        result.append({
            "id": sub.id,
            "client_id": sub.client_id,
            "client_name": client_user.name if client_user else "Unknown",
            "client_email": client_user.email if client_user else "",
            "status": sub.status,
            "total_estimate": sub.total_estimate,
            "document_count": len(sub.documents_data or []),
            "created_at": sub.created_at,
            "updated_at": sub.updated_at,
            "bill_id": sub.bill_id
        })
    
    return result


# ============ GET SUBMISSION DETAILS ============
@router.get("/{submission_id}", response_model=SubmissionResponse)
async def get_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    submission = db.query(ClientSubmission).filter(
        ClientSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    if current_user.role == 'CA':
        if submission.ca_user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this submission"
            )
    elif current_user.role == 'CLIENT':
        client = db.query(ClientMaster).filter(ClientMaster.user_id == current_user.id).first()
        if not client or submission.client_id != client.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this submission"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    client = db.query(ClientMaster).filter(ClientMaster.id == submission.client_id).first()
    client_user = db.query(User).filter(User.id == client.user_id).first() if client else None
    
    return {
        "id": submission.id,
        "client_id": submission.client_id,
        "client_name": client_user.name if client_user else "Unknown",
        "client_email": client_user.email if client_user else "",
        "status": submission.status,
        "documents": submission.documents_data or [],
        "adjustments": submission.adjustments or {},
        "estimated_bill": submission.estimated_bill or {},
        "total_estimate": submission.total_estimate,
        "ca_notes": submission.ca_notes,
        "bill_id": submission.bill_id,
        "created_at": submission.created_at,
        "updated_at": submission.updated_at,
        "reviewed_at": submission.reviewed_at,
        "onedrive_folder_path": submission.onedrive_folder_path,
        "onedrive_folder_url": submission.onedrive_folder_url,
        "document_links": submission.document_links,
        "onedrive_upload_status": submission.onedrive_upload_status,
        "computation_link": submission.computation_link,
        "computation_file_name": submission.computation_file_name,
        "computation_uploaded_at": submission.computation_uploaded_at,
        "computation_bill_data": submission.computation_bill_data,
        "computation_bill_status": submission.computation_bill_status
    }


# ============ UPDATE SUBMISSION STATUS (CA) ============
@router.patch("/{submission_id}/status", response_model=SubmissionStatusResponse)
async def update_submission_status(
    submission_id: int,
    status_data: SubmissionStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    submission = db.query(ClientSubmission).filter(
        ClientSubmission.id == submission_id,
        ClientSubmission.ca_user_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    submission.status = status_data.status
    submission.ca_notes = status_data.notes
    submission.reviewed_at = datetime.utcnow()
    db.commit()
    
    client = db.query(ClientMaster).filter(ClientMaster.id == submission.client_id).first()
    if client:
        notification = Notification(
            user_id=client.user_id,
            type="submission_update",
            message=f"Your submission status has been updated to {status_data.status}",
            is_read=False,
            data={
                "submission_id": submission.id,
                "status": status_data.status,
                "notes": status_data.notes
            }
        )
        db.add(notification)
        db.commit()
    
    return {
        "id": submission.id,
        "status": submission.status,
        "updated_at": submission.updated_at,
        "message": f"Submission status updated to {status_data.status}"
    }


# ============ UPLOAD COMPUTATION BILL (CA) ============
# backend/app/api/v1/submissions.py (upload endpoint only - paste this in your existing file)

@router.post("/{submission_id}/upload-computation-bill")
async def upload_computation_bill(
    submission_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a computation bill and auto-generate fee components"""
    
    try:
        # Validate user is CA
        if current_user.role != UserRole.CA:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Only CA can upload computation bills"
            )
        
        # Get submission
        submission = db.query(ClientSubmission).filter(
            ClientSubmission.id == submission_id,
            ClientSubmission.ca_user_id == current_user.id
        ).first()
        
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Submission not found"
            )
        
        # Validate file type
        file_extension = Path(file.filename).suffix.lower()
        SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".doc"}
        
        if file_extension not in SUPPORTED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Only {', '.join(SUPPORTED_EXTENSIONS)} files are allowed"
            )
        
        # Create upload directory
        upload_dir = Path("uploads/computation_bills")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate safe filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"submission_{submission_id}_{timestamp}_{file.filename.replace(' ', '_')}"
        file_path = upload_dir / safe_filename
        
        # Save file
        try:
            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)
            logger.info(f"✅ File saved: {file_path}")
        except Exception as e:
            logger.error(f"Error saving file: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save file: {str(e)}"
            )
        
        try:
            # Parse the computation bill
            logger.info(f"📄 Parsing computation bill: {file_path}")
            from app.services.computation_bill_parser import parse_computation_bill
            parsed_data = parse_computation_bill(str(file_path), file.filename)
            
            logger.info(f"📊 Parsed data: detected={parsed_data.get('detected', {})}")
            
            # Initialize the computation bill service
            from app.services.computation_bill_service import ComputationBillService
            bill_service = ComputationBillService(db)
            
            # Generate bill from fee categories (keyword matching)
            bill_data = bill_service.generate_bill_from_computation_file(
                submission_id=submission_id,
                ca_user_id=current_user.id,
                parsed_data=parsed_data
            )
            
            # Save file info to submission
            submission.computation_bill_file_path = str(file_path)
            submission.computation_bill_file_name = file.filename
            submission.computation_bill_status = "DRAFT"
            
            # Store parsed data
            if not submission.computation_bill_data:
                submission.computation_bill_data = {}
            
            submission.computation_bill_data.update({
                "file_name": file.filename,
                "file_path": str(file_path),
                "file_size": len(content),
                "uploaded_at": datetime.utcnow().isoformat(),
                "parsed_data": parsed_data,
                "fee_components": bill_data.get("fee_components", []),
                "total": bill_data.get("grand_total", 0),
                "detected": parsed_data.get("detected", {}),
                "detected_info": parsed_data.get("detected_info", {}),
                "client_name": parsed_data.get("client_name"),
                "pan": parsed_data.get("pan"),
                "files": [{
                    "id": 1,
                    "file_name": file.filename,
                    "file_size": len(content),
                    "file_path": str(file_path),
                    "uploaded_at": datetime.utcnow().isoformat(),
                    "uploaded_by": "CA"
                }]
            })
            
            db.commit()
            
            # Prepare response
            detected_count = sum(1 for v in parsed_data.get('detected', {}).values() if v)
            
            return {
                "message": "Computation bill uploaded and parsed successfully",
                "submission_id": submission_id,
                "file_name": file.filename,
                "detected": parsed_data.get('detected', {}),
                "detected_count": detected_count,
                "bill_data": {
                    "fee_components": bill_data.get("fee_components", []),
                    "total_base_fee": bill_data.get("total_base_fee", 0),
                    "total_gst": bill_data.get("total_gst", 0),
                    "grand_total": bill_data.get("grand_total", 0),
                    "status": "DRAFT",
                    "files": [{
                        "id": 1,
                        "file_name": file.filename,
                        "file_size": len(content),
                        "uploaded_at": datetime.utcnow().isoformat()
                    }]
                },
                "parsed_info": {
                    "client_name": parsed_data.get('client_name'),
                    "pan": parsed_data.get('pan'),
                    "assessment_year": parsed_data.get('assessment_year'),
                    "income_amounts": parsed_data.get('income_amounts', {})
                }
            }
            
        except Exception as e:
            logger.error(f"Error parsing computation bill: {e}", exc_info=True)
            # Clean up the file if parsing failed
            try:
                if file_path.exists():
                    file_path.unlink()
                    logger.info(f"🗑️ Removed failed file: {file_path}")
            except:
                pass
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to parse bill: {str(e)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in upload_computation_bill: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

# ============ GET COMPUTATION FILES ============
@router.get("/{submission_id}/computation-files")
async def get_computation_files(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """List computation bill files uploaded for this submission"""
    submission = db.query(ClientSubmission).filter(
        ClientSubmission.id == submission_id
    ).first()
 
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
 
    if current_user.role == 'CA':
        if submission.ca_user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role == 'CLIENT':
        client = db.query(ClientMaster).filter(ClientMaster.user_id == current_user.id).first()
        if not client or submission.client_id != client.id:
            raise HTTPException(status_code=403, detail="Not authorized")
 
    bill_data = submission.computation_bill_data or {}
    
    # Return files list
    files = []
    if bill_data.get("file_name"):
        files.append({
            "id": 1,
            "file_name": bill_data.get("file_name"),
            "file_size": bill_data.get("file_size", 0),
            "file_path": bill_data.get("file_path"),
            "uploaded_at": bill_data.get("uploaded_at"),
            "uploaded_by": "CA"
        })
    
    return files


@router.delete("/{submission_id}/computation-files/{file_id}")
async def delete_computation_file(
    submission_id: int,
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Remove an uploaded computation bill file and clear the associated bill"""
    submission = db.query(ClientSubmission).filter(
        ClientSubmission.id == submission_id,
        ClientSubmission.ca_user_id == current_user.id
    ).first()

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    bill_data = submission.computation_bill_data or {}
    
    # Check if there's a file
    if not bill_data or not bill_data.get("file_name"):
        raise HTTPException(status_code=404, detail="No files found")

    # Get the file path to delete
    file_path = bill_data.get("file_path")
    if file_path and Path(file_path).exists():
        try:
            Path(file_path).unlink()
            logger.info(f"🗑️ Deleted file: {file_path}")
        except Exception as e:
            logger.error(f"Error deleting file: {e}")

    # COMPLETELY CLEAR all computation bill data
    submission.computation_bill_data = None
    submission.computation_bill_status = None
    submission.computation_bill_sent_at = None
    submission.computation_bill_confirmed_at = None
    submission.computation_bill_finalized_at = None
    submission.computation_bill_file_path = None
    submission.computation_bill_file_name = None
    
    db.commit()

    return {
        "message": "File removed successfully",
        "cleared": True,
        "files_remaining": 0
    }


# ============ CONFIRM COMPUTATION BILL (Client) ============
@router.post("/{submission_id}/computation-bill/confirm")
async def confirm_computation_bill(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_client)
) -> Any:
    """Client confirms the computation bill"""
    client = db.query(ClientMaster).filter(
        ClientMaster.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    submission = db.query(ClientSubmission).filter(
        ClientSubmission.id == submission_id,
        ClientSubmission.client_id == client.id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    if not submission.computation_bill_data:
        raise HTTPException(
            status_code=400,
            detail="No computation bill found for this submission"
        )
    
    current_status = submission.computation_bill_status or 'DRAFT'
    
    if current_status in ['CONFIRMED_BY_CLIENT', 'CONFIRMED']:
        return {
            "message": "Computation bill already confirmed",
            "submission_id": submission.id,
            "status": current_status
        }
    
    if current_status not in ['SENT_TO_CLIENT', 'SENT']:
        raise HTTPException(
            status_code=400,
            detail="Computation bill has not been sent to you yet"
        )
    
    # Confirm the bill
    submission.computation_bill_status = 'CONFIRMED_BY_CLIENT'
    submission.computation_bill_confirmed_at = datetime.utcnow()
    db.commit()
    
    # Notify CA
    notification = Notification(
        user_id=submission.ca_user_id,
        type="computation_bill_confirmed",
        message=f"Client has confirmed the computation bill for submission #{submission.id}",
        is_read=False,
        data={
            "submission_id": submission.id,
            "client_id": client.id,
            "client_name": current_user.name
        }
    )
    db.add(notification)
    db.commit()
    
    return {
        "message": "Computation bill confirmed successfully",
        "submission_id": submission.id,
        "status": submission.computation_bill_status
    }


# ============ PROCEED FURTHER (Client) ============
@router.post("/{submission_id}/proceed")
async def proceed_further(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_client)
) -> Any:
    """Client confirms the computation bill and proceeds to CA for final processing"""
    client = db.query(ClientMaster).filter(
        ClientMaster.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    submission = db.query(ClientSubmission).filter(
        ClientSubmission.id == submission_id,
        ClientSubmission.client_id == client.id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Check if computation bill exists
    if not submission.computation_bill_data:
        raise HTTPException(
            status_code=400,
            detail="No computation bill found for this submission"
        )
    
    # Check the current status
    current_status = submission.computation_bill_status or 'DRAFT'
    
    # If already confirmed, just proceed
    if current_status in ['CONFIRMED_BY_CLIENT', 'CONFIRMED']:
        if submission.status != SubmissionStatus.CONFIRMED:
            submission.status = SubmissionStatus.CONFIRMED
            db.commit()
        
        # Trigger OneDrive upload
        try:
            await trigger_onedrive_upload(submission_id, db)
        except Exception as e:
            logger.error(f"OneDrive upload failed: {str(e)}")
        
        return {
            "message": "Proceeded successfully. Documents and computation bill have been sent to your CA.",
            "submission_id": submission.id,
            "status": submission.status,
            "computation_bill_status": submission.computation_bill_status
        }
    
    # If not confirmed, require confirmation first
    if current_status not in ['SENT_TO_CLIENT', 'SENT']:
        raise HTTPException(
            status_code=400,
            detail="Computation bill has not been sent to you yet. Please wait for your CA to send the bill."
        )
    
    # Confirm the computation bill
    submission.computation_bill_status = 'CONFIRMED_BY_CLIENT'
    submission.computation_bill_confirmed_at = datetime.utcnow()
    submission.status = SubmissionStatus.CONFIRMED
    db.commit()
    
    # Notify CA
    notification = Notification(
        user_id=submission.ca_user_id,
        type="computation_bill_confirmed",
        message=f"Client has confirmed the computation bill for submission #{submission.id}",
        is_read=False,
        data={
            "submission_id": submission.id,
            "client_id": client.id,
            "client_name": current_user.name
        }
    )
    db.add(notification)
    db.commit()
    
    # Trigger OneDrive upload
    try:
        await trigger_onedrive_upload(submission_id, db)
    except Exception as e:
        logger.error(f"OneDrive upload failed: {str(e)}")
    
    return {
        "message": "Proceeded successfully. Documents and computation bill have been sent to your CA.",
        "submission_id": submission.id,
        "status": submission.status,
        "computation_bill_status": submission.computation_bill_status
    }


# ============ UPLOAD TO ONEDRIVE ============
async def trigger_onedrive_upload(submission_id: int, db: Session):
    """Helper function to upload submission to OneDrive"""
    submission = db.query(ClientSubmission).filter(
        ClientSubmission.id == submission_id
    ).first()
    
    if not submission:
        return
    
    # Get the CA user
    ca_user = db.query(User).filter(User.id == submission.ca_user_id).first()
    if not ca_user or not ca_user.onedrive_access_token:
        logger.warning(f"CA user {submission.ca_user_id} has no OneDrive access token")
        return
    
    try:
        service = OneDriveService(user=ca_user, db=db)
        client = db.query(ClientMaster).filter(ClientMaster.id == submission.client_id).first()
        
        folder_path = f"EazyTax/CA_{submission.ca_user_id}/Client_{submission.client_id}/Submission_{submission.id}_{datetime.utcnow().strftime('%Y%m%d')}"
        
        # Create folder structure
        folder_info = service.create_folder(folder_path)
        document_links = []
        
        # Upload client documents
        if submission.documents_data:
            docs_folder = f"{folder_path}/Documents"
            service.create_folder(docs_folder)
            
            for idx, doc_data in enumerate(submission.documents_data or []):
                file_name = doc_data.get('file_title', f"document_{idx+1}")
                file_name = "".join(c for c in file_name if c.isalnum() or c in " ._-")
                
                try:
                    # Get file from storage
                    doc_id = doc_data.get('document_id')
                    if doc_id:
                        doc = db.query(Document).filter(Document.id == doc_id).first()
                        if doc and doc.file_path:
                            with open(doc.file_path, 'rb') as f:
                                file_content = f.read()
                            
                            result = service.upload_file(file_content, file_name, docs_folder)
                            link = service.get_shareable_link(f"{docs_folder}/{file_name}")
                            document_links.append({
                                "name": file_name,
                                "type": doc.document_type or 'Document',
                                "link": link,
                                "path": f"{docs_folder}/{file_name}"
                            })
                except Exception as e:
                    logger.error(f"Failed to upload {file_name}: {str(e)}")
        
        # Upload computation bill
        if submission.computation_bill_data:
            comp_folder = f"{folder_path}/Computation_Bill"
            service.create_folder(comp_folder)
            
            # Upload the computation bill file if it exists
            if submission.computation_bill_file_path:
                file_path = Path(submission.computation_bill_file_path)
                if file_path.exists():
                    try:
                        with open(file_path, 'rb') as f:
                            file_content = f.read()
                        
                        result = service.upload_file(
                            file_content, 
                            file_path.name, 
                            comp_folder
                        )
                        link = service.get_shareable_link(f"{comp_folder}/{file_path.name}")
                        document_links.append({
                            "name": file_path.name,
                            "type": "Computation Bill",
                            "link": link,
                            "path": f"{comp_folder}/{file_path.name}"
                        })
                    except Exception as e:
                        logger.error(f"Failed to upload computation bill: {str(e)}")
        
        # Update submission with OneDrive info
        submission.onedrive_folder_path = folder_path        
        submission.onedrive_folder_url = folder_info.get("webUrl")
        submission.document_links = document_links
        submission.onedrive_upload_status = "COMPLETED"
        db.commit()
        
        logger.info(f"✅ Auto-uploaded to OneDrive for submission {submission.id}")
        
    except Exception as e:
        logger.error(f"Auto-upload to OneDrive failed: {str(e)}")
        submission.onedrive_upload_status = "FAILED"
        db.commit()
        raise


# ============ COMPUTATION BILL ENDPOINTS ============

@router.post("/{submission_id}/computation-bill/create")
async def create_computation_bill(
    submission_id: int,
    request: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    submission = db.query(ClientSubmission).filter(
        ClientSubmission.id == submission_id,
        ClientSubmission.ca_user_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    try:
        service = ComputationBillService(db)
        bill_data = service.create_computation_bill_from_documents(
            submission_id,
            current_user.id,
            request.get('adjustments', {})
        )
        
        return {
            "message": "Computation bill created successfully",
            "bill_data": bill_data
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating computation bill: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.get("/{submission_id}/computation-bill")
async def get_computation_bill(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    submission = db.query(ClientSubmission).filter(
        ClientSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    if current_user.role == 'CA':
        if submission.ca_user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role == 'CLIENT':
        client = db.query(ClientMaster).filter(ClientMaster.user_id == current_user.id).first()
        if not client or submission.client_id != client.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    if not submission.computation_bill_data:
        return {
            "has_bill": False,
            "message": "No computation bill exists"
        }
    
    return {
        "has_bill": True,
        "bill_data": submission.computation_bill_data,
        "status": submission.computation_bill_status
    }


# backend/app/api/v1/submissions.py - Updated update endpoint

@router.put("/{submission_id}/computation-bill/update")
async def update_computation_bill(
    submission_id: int,
    request: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    """Update the computation bill with manual edits"""
    
    submission = db.query(ClientSubmission).filter(
        ClientSubmission.id == submission_id,
        ClientSubmission.ca_user_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Submission not found"
        )
    
    if not submission.computation_bill_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No computation bill exists. Please upload a bill first."
        )
    
    try:
        # Get fee components and notes from request
        fee_components = request.get('fee_components', [])
        notes = request.get('notes', '')
        
        # Validate fee components
        if not fee_components or len(fee_components) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Fee components cannot be empty"
            )
        
        # Validate each component
        for idx, comp in enumerate(fee_components):
            if not comp.get('label') or comp.get('label').strip() == '':
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Component {idx + 1}: Label is required"
                )
            if comp.get('amount') is None or comp.get('amount') < 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Component {idx + 1}: Valid amount is required"
                )
        
        # Initialize the computation bill service
        from app.services.computation_bill_service import ComputationBillService
        service = ComputationBillService(db)
        
        # Update the bill - this will completely replace the components with the new ones
        bill_data = service.update_computation_bill(
            submission_id,
            fee_components,
            notes
        )
        
        logger.info(f"✅ Updated computation bill for submission {submission_id}")
        logger.info(f"   Components: {len(bill_data.get('fee_components', []))}")
        logger.info(f"   Total: {bill_data.get('grand_total', 0)}")
        
        return {
            "message": "Computation bill updated successfully",
            "submission_id": submission.id,
            "status": submission.computation_bill_status,
            "bill_data": bill_data
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating computation bill: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update bill: {str(e)}"
        )


@router.post("/{submission_id}/computation-bill/send")
async def send_computation_bill_to_client(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    submission = db.query(ClientSubmission).filter(
        ClientSubmission.id == submission_id,
        ClientSubmission.ca_user_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    try:
        service = ComputationBillService(db)
        bill_data = service.send_computation_bill_to_client(submission_id)
        
        return {
            "message": "Computation bill sent to client successfully",
            "bill_data": bill_data
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{submission_id}/computation-bill/finalize")
async def finalize_computation_bill(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    submission = db.query(ClientSubmission).filter(
        ClientSubmission.id == submission_id,
        ClientSubmission.ca_user_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    try:
        service = ComputationBillService(db)
        bill_data = service.finalize_computation_bill(submission_id)
        
        submission.status = SubmissionStatus.CONFIRMED
        db.commit()
        
        return {
            "message": "Computation bill finalized successfully",
            "bill_data": bill_data
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{submission_id}/upload-to-onedrive")
async def upload_submission_to_onedrive(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
):
    if not current_user.onedrive_access_token:
        raise HTTPException(
            status_code=400,
            detail="Please connect OneDrive first: /api/v1/onedrive/login"
        )
    
    submission = db.query(ClientSubmission).filter(
        ClientSubmission.id == submission_id,
        ClientSubmission.ca_user_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    service = OneDriveService(user=current_user, db=db)
    client = db.query(ClientMaster).filter(ClientMaster.id == submission.client_id).first()
    
    folder_path = f"EazyTax/CA_{current_user.id}/Client_{submission.client_id}/Submission_{submission_id}_{datetime.utcnow().strftime('%Y%m%d')}"
    
    try:
        submission.onedrive_upload_status = "UPLOADING"
        db.commit()
        
        folder_info = service.create_folder(folder_path)
        document_links = []
        
        # Upload documents
        if submission.documents_data:
            docs_folder = f"{folder_path}/Documents"
            service.create_folder(docs_folder)
            
            for idx, doc_data in enumerate(submission.documents_data or []):
                file_name = doc_data.get('file_title', f"document_{idx+1}")
                file_name = "".join(c for c in file_name if c.isalnum() or c in " ._-")
                
                try:
                    doc_id = doc_data.get('document_id')
                    if doc_id:
                        doc = db.query(Document).filter(Document.id == doc_id).first()
                        if doc and doc.file_path:
                            with open(doc.file_path, 'rb') as f:
                                file_content = f.read()
                            
                            result = service.upload_file(file_content, file_name, docs_folder)
                            link = service.get_shareable_link(f"{docs_folder}/{file_name}")
                            document_links.append({
                                "name": file_name,
                                "type": doc.document_type or 'Document',
                                "link": link,
                                "path": f"{docs_folder}/{file_name}"
                            })
                except Exception as e:
                    logger.error(f"Failed to upload {file_name}: {str(e)}")
        
        # Upload computation bill
        if submission.computation_bill_file_path:
            comp_folder = f"{folder_path}/Computation_Bill"
            service.create_folder(comp_folder)
            
            file_path = Path(submission.computation_bill_file_path)
            if file_path.exists():
                try:
                    with open(file_path, 'rb') as f:
                        file_content = f.read()
                    
                    result = service.upload_file(file_content, file_path.name, comp_folder)
                    link = service.get_shareable_link(f"{comp_folder}/{file_path.name}")
                    document_links.append({
                        "name": file_path.name,
                        "type": "Computation Bill",
                        "link": link,
                        "path": f"{comp_folder}/{file_path.name}"
                    })
                except Exception as e:
                    logger.error(f"Failed to upload computation bill: {str(e)}")
        
        submission.onedrive_folder_path = folder_path
        submission.onedrive_folder_url = folder_info.get("webUrl")
        submission.document_links = document_links
        submission.onedrive_upload_status = "COMPLETED"
        submission.status = SubmissionStatus.CONFIRMED
        db.commit()
        
        return {
            "message": "✅ Uploaded to OneDrive successfully!",
            "folder_path": folder_path,
            "folder_url": submission.onedrive_folder_url,
            "documents_count": len(document_links),
            "document_links": document_links
        }
        
    except Exception as e:
        submission.onedrive_upload_status = "FAILED"
        db.commit()
        logger.error(f"OneDrive upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


# ============ DOCUMENT UPLOAD ENDPOINTS ============

@router.post("/{submission_id}/upload-documents")
async def upload_documents(
    submission_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    submission = db.query(ClientSubmission).filter(
        ClientSubmission.id == submission_id,
        ClientSubmission.ca_user_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    uploaded_docs = []
    for file in files:
        file_path = f"uploads/documents/submission_{submission_id}/{file.filename}"
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        doc = {
            "id": len(uploaded_docs) + 1,
            "file_name": file.filename,
            "file_size": len(content),
            "file_path": file_path,
            "uploaded_at": datetime.utcnow().isoformat(),
            "submission_id": submission_id,
            "uploaded_by": current_user.id,
            "uploaded_by_name": current_user.name
        }
        uploaded_docs.append(doc)
    
    submission.documents_data = submission.documents_data or []
    for doc in uploaded_docs:
        submission.documents_data.append({
            "document_id": doc["id"],
            "file_title": doc["file_name"],
            "file_path": doc["file_path"],
            "uploaded_at": doc["uploaded_at"],
            "uploaded_by": doc["uploaded_by_name"],
            "source": "ca"
        })
    
    db.commit()
    
    return {
        "message": f"Uploaded {len(uploaded_docs)} documents",
        "documents": uploaded_docs
    }


@router.get("/{submission_id}/documents")
async def get_documents(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    submission = db.query(ClientSubmission).filter(
        ClientSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    documents = []
    for doc_data in submission.documents_data or []:
        documents.append({
            "id": doc_data.get("document_id"),
            "file_name": doc_data.get("file_title"),
            "file_path": doc_data.get("file_path"),
            "uploaded_at": doc_data.get("uploaded_at"),
            "uploaded_by": doc_data.get("uploaded_by", "Client"),
            "source": doc_data.get("source", "client")
        })
    
    return documents


@router.delete("/{submission_id}/documents/{document_id}")
async def delete_document(
    submission_id: int,
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    submission = db.query(ClientSubmission).filter(
        ClientSubmission.id == submission_id,
        ClientSubmission.ca_user_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    submission.documents_data = [
        doc for doc in submission.documents_data or []
        if doc.get("document_id") != document_id
    ]
    
    db.commit()
    
    return {"message": "Document deleted successfully"}
    


# ============ GENERATE BILL (CA) ============
@router.post("/{submission_id}/generate-bill")
async def generate_bill(
    submission_id: int,
    request: BillGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    submission = db.query(ClientSubmission).filter(
        ClientSubmission.id == submission_id,
        ClientSubmission.ca_user_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    try:
        if request.items:
            bill = BillService.create_bill_from_items(
                db, 
                current_user.id, 
                submission.client_id, 
                request.items, 
                request.notes
            )
        else:
            bill = BillService.create_bill_from_submission(db, current_user.id, submission, request.notes)
        
        submission.bill_id = bill.id
        submission.bill_draft_data = {
            "bill_id": bill.id,
            "bill_number": bill.bill_number,
            "total_amount": float(bill.total_amount),
            "gst_amount": float(bill.gst_amount),
            "grand_total": float(bill.grand_total),
            "items": [
                {
                    "id": item.id,
                    "description": item.description,
                    "amount": float(item.amount),
                    "gst_amount": float(item.gst_amount),
                    "total_amount": float(item.total_amount)
                } for item in bill.items
            ],
            "notes": bill.notes
        }
        submission.status = SubmissionStatus.BILL_GENERATED
        submission.bill_generated_at = datetime.utcnow()
        db.commit()
        
        client = db.query(ClientMaster).filter(ClientMaster.id == submission.client_id).first()
        if client:
            notification = Notification(
                user_id=client.user_id,
                type="bill_generated",
                message=f"CA has generated a bill for you. Please review and confirm.",
                is_read=False,
                data={
                    "submission_id": submission.id,
                    "bill_id": bill.id,
                    "bill_number": bill.bill_number
                }
            )
            db.add(notification)
            db.commit()
        
        return {
            "message": "Bill generated successfully",
            "bill_id": bill.id,
            "bill_number": bill.bill_number,
            "grand_total": bill.grand_total,
            "submission_id": submission.id
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ============ SEND BILL TO CLIENT (CA) ============
@router.post("/{submission_id}/send-bill")
async def send_bill_to_client(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ca)
) -> Any:
    submission = db.query(ClientSubmission).filter(
        ClientSubmission.id == submission_id,
        ClientSubmission.ca_user_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    if not submission.bill_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No bill generated for this submission"
        )
    
    bill = db.query(Bill).filter(Bill.id == submission.bill_id).first()
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found"
        )
    
    submission.status = SubmissionStatus.BILL_SENT
    submission.bill_sent_at = datetime.utcnow()
    submission.bill_final_data = {
        "bill_id": bill.id,
        "bill_number": bill.bill_number,
        "total_amount": float(bill.total_amount),
        "gst_amount": float(bill.gst_amount),
        "grand_total": float(bill.grand_total),
        "items": [
            {
                "id": item.id,
                "description": item.description,
                "amount": float(item.amount),
                "gst_amount": float(item.gst_amount),
                "total_amount": float(item.total_amount)
            } for item in bill.items
        ],
        "notes": bill.notes,
        "sent_at": datetime.utcnow().isoformat()
    }
    db.commit()
    
    client = db.query(ClientMaster).filter(ClientMaster.id == submission.client_id).first()
    if client:
        notification = Notification(
            user_id=client.user_id,
            type="bill_received",
            message=f"CA has sent you a bill. Please review and confirm.",
            is_read=False,
            data={
                "submission_id": submission.id,
                "bill_id": bill.id,
                "bill_number": bill.bill_number,
                "grand_total": float(bill.grand_total)
            }
        )
        db.add(notification)
        db.commit()
    
    return {
        "message": "Bill sent to client successfully",
        "bill_id": bill.id,
        "bill_number": bill.bill_number
    }


# ============ CLIENT CONFIRMS BILL ============
@router.post("/{submission_id}/confirm-bill")
async def confirm_bill(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_client)
) -> Any:
    client = db.query(ClientMaster).filter(
        ClientMaster.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    submission = db.query(ClientSubmission).filter(
        ClientSubmission.id == submission_id,
        ClientSubmission.client_id == client.id
    ).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    if submission.status != SubmissionStatus.BILL_SENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No bill sent for this submission"
        )
    
    submission.status = SubmissionStatus.BILL_CONFIRMED
    submission.bill_confirmed_at = datetime.utcnow()
    submission.bill_confirmed_by_client = True
    db.commit()
    
    if submission.bill_id:
        bill = db.query(Bill).filter(Bill.id == submission.bill_id).first()
        if bill:
            bill.status = BillStatus.ACCEPTED
            bill.accepted_at = datetime.utcnow()
            db.commit()
    
    notification = Notification(
        user_id=submission.ca_user_id,
        type="bill_confirmed",
        message=f"Client has confirmed the bill for submission #{submission.id}",
        is_read=False,
        data={
            "submission_id": submission.id,
            "client_id": client.id,
            "client_name": current_user.name
        }
    )
    db.add(notification)
    db.commit()
    
    # Trigger OneDrive upload
    try:
        await trigger_onedrive_upload(submission_id, db)
        return {
            "message": "Bill confirmed successfully and uploaded to OneDrive",
            "submission_id": submission.id,
            "status": "CONFIRMED"
        }
    except Exception as e:
        logger.error(f"Auto-upload to OneDrive failed: {str(e)}")
        return {
            "message": "Bill confirmed successfully. OneDrive upload will be processed shortly.",
            "submission_id": submission.id,
            "status": "CONFIRMED",
            "onedrive_upload_status": submission.onedrive_upload_status
        }


# ============ CLIENT GETS THEIR SUBMISSIONS ============
@router.get("/client/my-submissions", response_model=List[SubmissionListResponse])
async def get_my_submissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_client)
) -> Any:
    client = db.query(ClientMaster).filter(
        ClientMaster.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    submissions = db.query(ClientSubmission).filter(
        ClientSubmission.client_id == client.id
    ).order_by(
        ClientSubmission.created_at.desc()
    ).all()
    
    result = []
    for sub in submissions:
        result.append({
            "id": sub.id,
            "client_id": sub.client_id,
            "client_name": current_user.name,
            "client_email": current_user.email,
            "status": sub.status,
            "total_estimate": sub.total_estimate,
            "document_count": len(sub.documents_data or []),
            "created_at": sub.created_at,
            "updated_at": sub.updated_at,
            "bill_id": sub.bill_id
        })
    
    return result