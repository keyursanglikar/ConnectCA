import asyncio
import logging
from typing import Optional
from datetime import datetime
from app.services.email_service import EmailService
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailQueueService:
    """Email queue service for reliable email delivery"""

    @staticmethod
    async def send_email_with_retry(
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        from_name: str = "CA Firm Management",
        max_retries: int = 3,
        retry_delay: int = 5
    ) -> bool:
        """Send email with retry mechanism"""
        
        # Send email with retries
        for attempt in range(max_retries):
            try:
                result = await EmailService.send_email(
                    to_email=to_email,
                    subject=subject,
                    html_content=html_body or body,
                    from_name=from_name
                )
                
                if result:
                    logger.info(f"✅ Email sent to {to_email} on attempt {attempt + 1}")
                    return True
                else:
                    logger.warning(f"⚠️ Email attempt {attempt + 1} failed for {to_email}")
                    
            except Exception as e:
                logger.error(f"❌ Email attempt {attempt + 1} error: {str(e)}")
            
            # Wait before retry
            if attempt < max_retries - 1:
                await asyncio.sleep(retry_delay * (attempt + 1))
        
        logger.error(f"❌ Failed to send email to {to_email} after {max_retries} attempts")
        return False

    @staticmethod
    async def send_client_credentials_with_queue(
        email: str,
        name: str,
        username: str,
        password: str,
        ca_name: str = "CA Firm",
        ca_email: str = None
    ) -> bool:
        """Send client credentials using email queue"""
        
        login_url = f"{settings.FRONTEND_URL}/login"
        system_name = settings.SYSTEM_NAME or "CA Firm Management"
        
        subject = f"Welcome to {system_name} - Your Login Credentials"
        
        body = f"""
Dear {name},

Welcome to {system_name}!

Your account has been created by {ca_name}. Please find your login credentials below:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔑 LOGIN CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Email    : {email}
  Username : {username}
  Password : {password}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 Login Link: {login_url}

⚠️  IMPORTANT: Please login and change your password immediately for security purposes.

Best regards,
{ca_name}
{system_name} Team
        """
        
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #1B2A4A; padding: 20px; color: white; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ padding: 20px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }}
        .credentials {{ background-color: #f5f7fa; padding: 20px; border-radius: 8px; margin: 20px 0; }}
        .button {{ background-color: #1B2A4A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }}
        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }}
    </style>
</head>
<body>
    <div class="header">
        <h2>Welcome to {system_name}</h2>
    </div>
    <div class="content">
        <p>Dear <strong>{name}</strong>,</p>
        <p>Welcome to {system_name}!</p>
        <p>Your account has been created by <strong>{ca_name}</strong>.</p>
        
        <div class="credentials">
            <h3 style="margin-top: 0; color: #1B2A4A;">🔑 Login Credentials</h3>
            <p><strong>📧 Email:</strong> {email}</p>
            <p><strong>👤 Username:</strong> {username}</p>
            <p><strong>🔒 Password:</strong> <span style="background: #e5e7eb; padding: 2px 8px; border-radius: 4px;">{password}</span></p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{login_url}" class="button">🔗 Login Now</a>
        </div>
        
        <div class="footer">
            <p>Best regards,<br><strong>{ca_name}</strong></p>
        </div>
    </div>
</body>
</html>
        """
        
        return await EmailQueueService.send_email_with_retry(
            to_email=email,
            subject=subject,
            body=body,
            html_body=html_body,
            from_name=ca_name
        )