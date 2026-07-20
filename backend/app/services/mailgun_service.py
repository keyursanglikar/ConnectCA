import requests
import logging
from typing import Optional
from pathlib import Path
from datetime import datetime
import json

from app.core.config import settings

logger = logging.getLogger(__name__)


class MailgunService:
    """Email service using Mailgun API"""

    @staticmethod
    def get_base_url() -> str:
        """Get Mailgun API base URL"""
        region = settings.MAILGUN_REGION or "us"
        if region == "eu":
            return f"https://api.eu.mailgun.net/v3/{settings.MAILGUN_DOMAIN}"
        return f"https://api.mailgun.net/v3/{settings.MAILGUN_DOMAIN}"

    @staticmethod
    def get_auth() -> tuple:
        """Get Mailgun authentication"""
        return ("api", settings.MAILGUN_API_KEY)

    @staticmethod
    async def send_email(
        to_email: str,
        subject: str,
        html_content: str,
        from_email: Optional[str] = None,
        from_name: str = "CA Firm",
        reply_to: Optional[str] = None,
        cc: Optional[list] = None,
        bcc: Optional[list] = None,
        attachments: Optional[list] = None
    ) -> bool:
        """
        Send email using Mailgun API
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML content of the email
            from_email: Sender email (must be authorized in Mailgun)
            from_name: Sender name
            reply_to: Reply-to email address
            cc: CC recipients
            bcc: BCC recipients
            attachments: List of file paths to attach
        
        Returns:
            bool: True if sent successfully, False otherwise
        """
        try:
            # Validate configuration
            if not settings.MAILGUN_API_KEY:
                logger.error("❌ MAILGUN_API_KEY not configured")
                await MailgunService.save_email_to_file(to_email, subject, html_content, error="MAILGUN_API_KEY not configured")
                return False

            if not settings.MAILGUN_DOMAIN:
                logger.error("❌ MAILGUN_DOMAIN not configured")
                await MailgunService.save_email_to_file(to_email, subject, html_content, error="MAILGUN_DOMAIN not configured")
                return False

            # Use system from email if not provided
            from_email = from_email or settings.MAILGUN_FROM_EMAIL
            
            if not from_email:
                logger.error("❌ No from email configured")
                await MailgunService.save_email_to_file(to_email, subject, html_content, error="No from email configured")
                return False

            # Prepare data
            data = {
                "from": f"{from_name} <{from_email}>",
                "to": [to_email],
                "subject": subject,
                "html": html_content
            }

            # Add optional fields
            if reply_to:
                data["h:Reply-To"] = reply_to
            
            if cc:
                data["cc"] = cc
            
            if bcc:
                data["bcc"] = bcc

            # Prepare files for attachments
            files = []
            if attachments:
                for file_path in attachments:
                    if Path(file_path).exists():
                        files.append(("attachment", open(file_path, "rb")))

            # Log email attempt
            logger.info(f"📧 Sending email via Mailgun")
            logger.info(f"   To: {to_email}")
            logger.info(f"   From: {from_name} <{from_email}>")
            logger.info(f"   Subject: {subject}")
            logger.info(f"   Domain: {settings.MAILGUN_DOMAIN}")

            # Send request
            url = MailgunService.get_base_url() + "/messages"
            auth = MailgunService.get_auth()

            response = requests.post(
                url,
                auth=auth,
                data=data,
                files=files,
                timeout=30
            )

            # Close file handles
            for f in files:
                f[1].close()

            # Check response
            if response.status_code in [200, 202]:
                logger.info(f"✅ Email sent successfully to {to_email}")
                
                # Log response details
                try:
                    response_data = response.json()
                    logger.info(f"   Message ID: {response_data.get('id', 'N/A')}")
                except:
                    pass
                
                return True
            else:
                logger.error(f"❌ Mailgun error: {response.status_code}")
                logger.error(f"   Response: {response.text}")
                
                await MailgunService.save_email_to_file(
                    to_email, 
                    subject, 
                    html_content, 
                    error=f"Mailgun error: {response.status_code} - {response.text}"
                )
                return False

        except requests.exceptions.Timeout:
            logger.error(f"❌ Mailgun request timeout for {to_email}")
            await MailgunService.save_email_to_file(to_email, subject, html_content, error="Request timeout")
            return False

        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Mailgun request error: {str(e)}")
            await MailgunService.save_email_to_file(to_email, subject, html_content, error=str(e))
            return False

        except Exception as e:
            logger.error(f"❌ Failed to send email: {str(e)}")
            await MailgunService.save_email_to_file(to_email, subject, html_content, error=str(e))
            return False

    @staticmethod
    async def send_email_with_template(
        to_email: str,
        template_id: str,
        template_data: dict,
        from_email: Optional[str] = None,
        from_name: str = "CA Firm"
    ) -> bool:
        """
        Send email using Mailgun template
        
        Args:
            to_email: Recipient email address
            template_id: Mailgun template ID
            template_data: Data for template variables
            from_email: Sender email
            from_name: Sender name
        """
        try:
            if not settings.MAILGUN_API_KEY or not settings.MAILGUN_DOMAIN:
                logger.error("❌ Mailgun not configured")
                return False

            from_email = from_email or settings.MAILGUN_FROM_EMAIL
            
            data = {
                "from": f"{from_name} <{from_email}>",
                "to": [to_email],
                "template": template_id,
                "h:X-Mailgun-Variables": json.dumps(template_data)
            }

            url = MailgunService.get_base_url() + "/messages"
            auth = MailgunService.get_auth()

            response = requests.post(url, auth=auth, data=data, timeout=30)

            if response.status_code in [200, 202]:
                logger.info(f"✅ Template email sent to {to_email}")
                return True
            else:
                logger.error(f"❌ Mailgun template error: {response.status_code} - {response.text}")
                return False

        except Exception as e:
            logger.error(f"❌ Failed to send template email: {str(e)}")
            return False

    @staticmethod
    async def send_client_credentials(
        to_email: str,
        name: str,
        username: str,
        password: str,
        ca_email: str,
        ca_name: str = "CA Firm",
        ca_phone: Optional[str] = None
    ) -> bool:
        """
        Send client credentials from CA's email address via Mailgun
        
        Note: ca_email must be authorized in Mailgun (added as authorized sender)
        """
        login_url = f"{settings.FRONTEND_URL}/login"
        system_name = settings.SYSTEM_NAME or "CA Firm Management"
        
        # HTML email content
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ 
            background: linear-gradient(135deg, #1B2A4A 0%, #2c4a6e 100%);
            padding: 30px 20px; 
            color: white; 
            text-align: center; 
            border-radius: 12px 12px 0 0; 
        }}
        .content {{ 
            padding: 30px 25px; 
            background: #ffffff; 
            border: 1px solid #e5e7eb; 
            border-top: none; 
            border-radius: 0 0 12px 12px;
        }}
        .credentials {{ 
            background: linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%);
            padding: 25px; 
            border-radius: 12px; 
            margin: 20px 0;
            border-left: 4px solid #1B2A4A;
        }}
        .credential-item {{
            display: flex; 
            justify-content: space-between; 
            padding: 10px 0; 
            border-bottom: 1px solid #e5e7eb;
        }}
        .credential-item:last-child {{
            border-bottom: none;
        }}
        .label {{ font-weight: bold; color: #4b5563; }}
        .value {{ 
            color: #1f2937; 
            font-family: 'Courier New', monospace; 
            background: #e5e7eb; 
            padding: 2px 12px; 
            border-radius: 4px;
            font-weight: 600;
        }}
        .button {{ 
            background: linear-gradient(135deg, #1B2A4A 0%, #2c4a6e 100%);
            color: white; 
            padding: 14px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block;
            font-weight: 600;
            transition: transform 0.2s;
        }}
        .button:hover {{
            transform: translateY(-2px);
        }}
        .footer {{ 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 2px solid #e5e7eb; 
            font-size: 14px; 
            color: #6b7280; 
        }}
        .warning {{ 
            background: #fef3c7; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 20px 0; 
            color: #92400e; 
            border-left: 4px solid #f59e0b;
        }}
        .ca-info {{
            background: #f0fdf4;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #22c55e;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h2 style="margin: 0; font-size: 24px;">Welcome to {system_name}</h2>
        <p style="margin: 8px 0 0 0; opacity: 0.9;">Your Professional CA Firm Management System</p>
    </div>
    <div class="content">
        <p>Dear <strong>{name}</strong>,</p>
        <p>Welcome to <strong>{system_name}</strong>! Your account has been successfully created by <strong>{ca_name}</strong>.</p>
        
        <div class="credentials">
            <h3 style="margin-top: 0; color: #1B2A4A;">🔑 Your Login Credentials</h3>
            <div class="credential-item">
                <span class="label">📧 Email Address</span>
                <span class="value">{to_email}</span>
            </div>
            <div class="credential-item">
                <span class="label">👤 Username</span>
                <span class="value">{username}</span>
            </div>
            <div class="credential-item">
                <span class="label">🔒 Password</span>
                <span class="value">{password}</span>
            </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{login_url}" class="button">🔗 Login to Your Account</a>
        </div>
        
        <div class="warning">
            ⚠️ <strong>IMPORTANT:</strong> For security, please change your password immediately after your first login.
        </div>
        
        <div class="ca-info">
            <p style="margin: 0; font-weight: bold;">📌 Your CA Details:</p>
            <p style="margin: 5px 0 0 0;">
                <strong>Name:</strong> {ca_name}<br>
                <strong>Email:</strong> {ca_email}
                {f'<br><strong>Phone:</strong> {ca_phone}' if ca_phone else ''}
            </p>
        </div>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact your CA.</p>
        
        <div class="footer">
            <p>Best regards,<br>
            <strong>{ca_name}</strong><br>
            <span style="color: #9ca3af;">{system_name}</span></p>
        </div>
    </div>
</body>
</html>
        """

        # Send email using Mailgun
        return await MailgunService.send_email(
            to_email=to_email,
            subject=f"Welcome to {system_name} - Your Login Credentials",
            html_content=html_body,
            from_email=ca_email,  # CA's email (must be authorized in Mailgun)
            from_name=ca_name,
            reply_to=ca_email
        )

    @staticmethod
    async def save_email_to_file(to_email: str, subject: str, html_content: str, error: str = None):
        """Save email to file for debugging"""
        try:
            email_dir = Path("emails_debug")
            email_dir.mkdir(exist_ok=True)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = email_dir / f"email_{timestamp}_{to_email.replace('@', '_')}.html"
            
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(f"<!-- TO: {to_email} -->\n")
                f.write(f"<!-- SUBJECT: {subject} -->\n")
                if error:
                    f.write(f"<!-- ERROR: {error} -->\n")
                f.write("\n")
                f.write(html_content)
            
            logger.info(f"📧 Email saved to: {filename}")
        except Exception as e:
            logger.error(f"❌ Failed to save email: {str(e)}")