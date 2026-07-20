from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.email_service import EmailService
from pydantic import BaseModel

router = APIRouter(prefix="/email-test", tags=["Email Test"])


class TestEmailRequest(BaseModel):
    to_email: str
    subject: Optional[str] = "Test Email from CA Firm Management"
    message: Optional[str] = "This is a test email from the CA Firm Management System."


@router.post("/send")
async def send_test_email(
    request: TestEmailRequest,
    current_user: User = Depends(get_current_user)
) -> Any:
    """Send a test email to verify configuration"""
    
    result = await EmailService.send_test_email(
        to_email=request.to_email,
        subject=request.subject,
        message=request.message
    )
    
    if result:
        return {"message": "Test email sent successfully", "to": request.to_email}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send test email. Check SendGrid configuration."
        )