# # from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON, DECIMAL
# # from sqlalchemy.orm import relationship
# # from sqlalchemy.sql import func
# # from app.core.database import Base
# # import enum


# # class SubmissionStatus(str, enum.Enum):
# #     PENDING = "PENDING"
# #     REVIEWING = "REVIEWING"
# #     APPROVED = "APPROVED"
# #     REJECTED = "REJECTED"
# #     BILL_SENT = "BILL_SENT"
# #     BILL_ACCEPTED = "BILL_ACCEPTED"
# #     BILL_REJECTED = "BILL_REJECTED"


# # class ClientSubmission(Base):
# #     __tablename__ = "client_submissions"

# #     id = Column(Integer, primary_key=True, index=True)
# #     client_id = Column(Integer, ForeignKey("client_masters.id", ondelete="CASCADE"), nullable=False)
# #     ca_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
# #     # Submission data
# #     documents_data = Column(JSON, default=list)
# #     adjustments = Column(JSON, default=dict)
# #     estimated_bill = Column(JSON, default=dict)
# #     total_estimate = Column(DECIMAL(10, 2), default=0.00)
    
# #     # Status
# #     status = Column(String(50), default=SubmissionStatus.PENDING)
    
# #     # CA response
# #     ca_notes = Column(Text, nullable=True)
# #     reviewed_at = Column(DateTime, nullable=True)
    
# #     # Bill generation
# #     bill_id = Column(Integer, ForeignKey("bills.id", ondelete="SET NULL"), nullable=True)
# #     bill_sent_at = Column(DateTime, nullable=True)
    
# #     # Timestamps
# #     created_at = Column(DateTime, server_default=func.now())
# #     updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

# #     # Relationships - Use unique back_populates names
# #     client = relationship("ClientMaster", back_populates="client_submissions")
# #     ca_user = relationship("User", foreign_keys=[ca_user_id], back_populates="ca_submissions")
# #     bill = relationship("Bill", foreign_keys=[bill_id])

# #     def __repr__(self):
# #         return f"<ClientSubmission {self.id} - {self.status}>"






# # app/models/client_submission.py
# from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON, DECIMAL
# from sqlalchemy.orm import relationship
# from sqlalchemy.sql import func
# from app.core.database import Base
# import enum


# class SubmissionStatus(str, enum.Enum):
#     PENDING = "PENDING"
#     REVIEWING = "REVIEWING"
#     APPROVED = "APPROVED"
#     REJECTED = "REJECTED"
#     BILL_GENERATED = "BILL_GENERATED"
#     BILL_SENT = "BILL_SENT"
#     BILL_CONFIRMED = "BILL_CONFIRMED"
#     CONFIRMED = "CONFIRMED"


# class ClientSubmission(Base):
#     __tablename__ = "client_submissions"

#     id = Column(Integer, primary_key=True, index=True)
#     client_id = Column(Integer, ForeignKey("client_masters.id", ondelete="CASCADE"), nullable=False)
#     ca_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
#     # Submission data
#     documents_data = Column(JSON, default=list)  # ✅ This stores document data as JSON
#     adjustments = Column(JSON, default=dict)
#     estimated_bill = Column(JSON, default=dict)
#     total_estimate = Column(DECIMAL(10, 2), default=0.00)
    
#     # Status
#     status = Column(String(50), default=SubmissionStatus.PENDING)
    
#     # CA response
#     ca_notes = Column(Text, nullable=True)
#     reviewed_at = Column(DateTime, nullable=True)
    
#     # Computation/OneDrive integration
#     computation_link = Column(String(500), nullable=True)
#     computation_uploaded_at = Column(DateTime, nullable=True)
#     computation_file_name = Column(String(255), nullable=True)
    
#     # Bill tracking
#     bill_id = Column(Integer, ForeignKey("bills.id", ondelete="SET NULL"), nullable=True)
#     bill_draft_data = Column(JSON, nullable=True)
#     bill_final_data = Column(JSON, nullable=True)
#     bill_generated_at = Column(DateTime, nullable=True)
#     bill_confirmed_at = Column(DateTime, nullable=True)
#     bill_confirmed_by_client = Column(Boolean, default=False)
    
#     # Timestamps
#     created_at = Column(DateTime, server_default=func.now())
#     updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

#     # ✅ FIX: Remove the 'documents' relationship if it doesn't exist
#     # Instead, use the documents_data JSON field to store document references
#     # Relationships - Only define relationships that actually exist
#     client = relationship("ClientMaster", back_populates="client_submissions")
#     ca_user = relationship("User", foreign_keys=[ca_user_id], back_populates="ca_submissions")
#     bill = relationship("Bill", foreign_keys=[bill_id])

#     def __repr__(self):
#         return f"<ClientSubmission {self.id} - {self.status}>"







# backend/app/models/client_submission.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON, DECIMAL
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class SubmissionStatus(str, enum.Enum):
    PENDING = "PENDING"
    REVIEWING = "REVIEWING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    BILL_GENERATED = "BILL_GENERATED"
    BILL_SENT = "BILL_SENT"
    BILL_CONFIRMED = "BILL_CONFIRMED"
    CONFIRMED = "CONFIRMED"


class ClientSubmission(Base):
    __tablename__ = "client_submissions"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("client_masters.id", ondelete="CASCADE"), nullable=False)
    ca_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Submission data
    documents_data = Column(JSON, default=list)
    adjustments = Column(JSON, default=dict)
    estimated_bill = Column(JSON, default=dict)
    total_estimate = Column(DECIMAL(10, 2), default=0.00)
    
    # Status
    status = Column(String(50), default=SubmissionStatus.PENDING)
    
    # CA response
    ca_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    
    # Computation/OneDrive integration
    computation_link = Column(String(500), nullable=True)
    computation_uploaded_at = Column(DateTime, nullable=True)
    computation_file_name = Column(String(255), nullable=True)
    
    # OneDrive integration
    onedrive_folder_path = Column(String(500), nullable=True)
    onedrive_folder_id = Column(String(255), nullable=True)
    onedrive_folder_url = Column(String(1000), nullable=True)
    onedrive_uploaded_at = Column(DateTime, nullable=True)
    document_links = Column(JSON, nullable=True)  # Store all document links as JSON
    onedrive_upload_status = Column(String(50), default="PENDING")  # PENDING, UPLOADING, COMPLETED, FAILED
    
    
    # Computation Bill fields
    computation_bill_data = Column(JSON, nullable=True)  # Stores the computation bill details
    computation_bill_status = Column(String(50), default="DRAFT")  # DRAFT, SENT, CONFIRMED, FINALIZED
    computation_bill_sent_at = Column(DateTime, nullable=True)
    computation_bill_confirmed_at = Column(DateTime, nullable=True)
    computation_bill_finalized_at = Column(DateTime, nullable=True)
    computation_pdf_url = Column(String(500), nullable=True)  # U
    
    # Bill tracking
    bill_id = Column(Integer, ForeignKey("bills.id", ondelete="SET NULL"), nullable=True)
    bill_draft_data = Column(JSON, nullable=True)
    bill_final_data = Column(JSON, nullable=True)
    bill_generated_at = Column(DateTime, nullable=True)
    bill_sent_at = Column(DateTime, nullable=True)
    bill_confirmed_at = Column(DateTime, nullable=True)
    bill_confirmed_by_client = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    client = relationship("ClientMaster", back_populates="client_submissions")
    ca_user = relationship("User", foreign_keys=[ca_user_id], back_populates="ca_submissions")
    bill = relationship("Bill", foreign_keys=[bill_id])

    def __repr__(self):
        return f"<ClientSubmission {self.id} - {self.status}>"