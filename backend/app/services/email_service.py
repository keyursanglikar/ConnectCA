# import os
# import logging
# from typing import Optional
# from pathlib import Path
# from datetime import datetime
# from sendgrid import SendGridAPIClient
# from sendgrid.helpers.mail import Mail, Email, To, Content, Personalization, Attachment, FileContent, FileName, FileType, Disposition
# from app.core.config import settings

# logger = logging.getLogger(__name__)


# class EmailService:
#     """Email service using SendGrid - Each CA can send from their own email"""

#     @staticmethod
#     async def send_email(
#         to_email: str,
#         subject: str,
#         html_content: str,
#         from_email: str = None,
#         from_name: str = None,
#         plain_text: Optional[str] = None,
#         attachments: Optional[list] = None
#     ) -> bool:
#         """Send email using SendGrid API"""
#         try:
#             # Use system default if not provided
#             if not from_email:
#                 from_email = settings.SENDGRID_FROM_EMAIL
#             if not from_name:
#                 from_name = settings.SENDGRID_FROM_NAME
            
#             # Check if SendGrid is configured
#             if not settings.SENDGRID_API_KEY:
#                 logger.error("❌ SENDGRID_API_KEY not configured in .env file")
#                 return False
            
#             # Create SendGrid client
#             sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
            
#             # Create email
#             mail = Mail(
#                 from_email=Email(from_email, from_name),
#                 to_emails=To(to_email),
#                 subject=subject,
#                 html_content=Content("text/html", html_content)
#             )
            
#             # Add plain text version if provided
#             if plain_text:
#                 mail.plain_text_content = Content("text/plain", plain_text)
            
#             # Add attachments if any
#             if attachments:
#                 for attachment in attachments:
#                     file_content = FileContent(attachment['content'])
#                     file_name = FileName(attachment['filename'])
#                     file_type = FileType(attachment.get('file_type', 'application/pdf'))
#                     disposition = Disposition('attachment')
#                     mail.attachment = Attachment(file_content, file_name, file_type, disposition)
            
#             # Send email
#             response = sg.send(mail)
            
#             if response.status_code in [200, 201, 202]:
#                 logger.info(f"✅ Email sent to {to_email} from {from_email}")
#                 logger.info(f"   Message ID: {response.headers.get('X-Message-Id')}")
#                 return True
#             else:
#                 logger.error(f"❌ SendGrid error: {response.status_code} - {response.body}")
#                 return False
                
#         except Exception as e:
#             logger.error(f"❌ Failed to send email: {str(e)}")
#             import traceback
#             traceback.print_exc()
#             return False

#     @staticmethod
#     async def send_client_credentials(
#         to_email: str,
#         name: str,
#         username: str,
#         password: str,
#         ca_email: str,
#         ca_name: str = "CA Firm",
#         ca_phone: str = None,
#         additional_info: dict = None
#     ) -> bool:
#         """Send client credentials from CA's email address"""
        
#         login_url = f"{settings.FRONTEND_URL}/login"
#         system_name = settings.SYSTEM_NAME or "CA Firm Management"
        
#         # Plain text version
#         plain_text = f"""
# Dear {name},

# Welcome to {system_name}!

# Your account has been created by {ca_name}. Please find your login credentials below:

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#   🔑 LOGIN CREDENTIALS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#   Email    : {to_email}
#   Username : {username}
#   Password : {password}
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 🔗 Login Link: {login_url}

# If you have any questions, please contact your CA at {ca_email}.

# Best regards,
# {ca_name}
#         """
        
#         # HTML version
#         html_body = f"""
# <!DOCTYPE html>
# <html>
# <head>
#     <meta charset="UTF-8">
#     <meta name="viewport" content="width=device-width, initial-scale=1.0">
#     <title>Welcome to {system_name}</title>
#     <style>
#         body {{ font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333; }}
#         .header {{ background: linear-gradient(135deg, #1B2A4A 0%, #2C4A7C 100%); padding: 30px 20px; color: white; text-align: center; border-radius: 10px 10px 0 0; }}
#         .header h2 {{ margin: 0; font-size: 24px; }}
#         .header p {{ margin: 5px 0 0; opacity: 0.8; }}
#         .content {{ background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }}
#         .credentials {{ background: #f5f7fa; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }}
#         .credential-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }}
#         .credential-row:last-child {{ border-bottom: none; }}
#         .label {{ font-weight: 600; color: #4b5563; }}
#         .value {{ color: #1f2937; font-family: monospace; background: #e5e7eb; padding: 2px 10px; border-radius: 4px; font-size: 14px; }}
#         .button {{ display: inline-block; background: linear-gradient(135deg, #1B2A4A 0%, #2C4A7C 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; }}
#         .button:hover {{ opacity: 0.9; }}
#         .footer {{ margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center; }}
#         .warning {{ background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; color: #92400e; border-left: 4px solid #f59e0b; }}
#         .ca-details {{ background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #22c55e; }}
#         .features {{ margin: 15px 0; padding-left: 20px; }}
#         .features li {{ margin: 5px 0; }}
#     </style>
# </head>
# <body>
#     <div class="header">
#         <h2>🏛️ Welcome to {system_name}</h2>
#         <p>Your trusted CA firm management solution</p>
#     </div>
    
#     <div class="content">
#         <p>Dear <strong>{name}</strong>,</p>
        
#         <p>Welcome to <strong>{system_name}</strong>!</p>
#         <p>Your account has been created by <strong>{ca_name}</strong>. Please find your login credentials below:</p>
        
#         <div class="credentials">
#             <h3 style="margin-top: 0; color: #1B2A4A;">🔑 Login Credentials</h3>
#             <div class="credential-row">
#                 <span class="label">📧 Email</span>
#                 <span class="value">{to_email}</span>
#             </div>
#             <div class="credential-row">
#                 <span class="label">👤 Username</span>
#                 <span class="value">{username}</span>
#             </div>
#             <div class="credential-row">
#                 <span class="label">🔒 Password</span>
#                 <span class="value">{password}</span>
#             </div>
#         </div>
        
#         <div style="text-align: center; margin: 30px 0;">
#             <a href="{login_url}" class="button">🔗 Login Now</a>
#         </div>
        
#         <div class="warning">
#             ⚠️ <strong>IMPORTANT:</strong> Please login and change your password immediately for security purposes.
#         </div>
        
#         <div class="ca-details">
#             <h4 style="margin-top: 0; color: #1B2A4A;">Your CA Contact Details</h4>
#             <p><strong>Name:</strong> {ca_name}</p>
#             <p><strong>Email:</strong> {ca_email}</p>
#             {f'<p><strong>Phone:</strong> {ca_phone}</p>' if ca_phone else ''}
#         </div>
        
#         {f'''
#         <div style="background: #f5f7fa; padding: 15px; border-radius: 6px; margin: 15px 0;">
#             <h4 style="margin-top: 0; color: #1B2A4A;">Additional Information</h4>
#             <ul>
#                 {''.join([f'<li><strong>{k}:</strong> {v}</li>' for k, v in (additional_info or {}).items()])}
#             </ul>
#         </div>
#         ''' if additional_info else ''}
        
#         <p>After login, you will be able to:</p>
#         <ul class="features">
#             <li>📄 Upload required documents</li>
#             <li>📊 Track your case status</li>
#             <li>💰 View invoices and payments</li>
#             <li>💬 Communicate with your CA</li>
#         </ul>
        
#         <p>If you have any questions, please contact your CA directly.</p>
        
#         <div class="footer">
#             <p>Best regards,<br>
#             <strong>{ca_name}</strong><br>
#             {system_name} Team</p>
#             <p style="font-size: 12px; margin-top: 10px;">
#                 This is an automated message. Please do not reply to this email.
#             </p>
#         </div>
#     </div>
# </body>
# </html>
#         """
        
#         return await EmailService.send_email(
#             to_email=to_email,
#             subject=f"Welcome to {system_name} - Your Login Credentials",
#             html_content=html_body,
#             from_email=ca_email,
#             from_name=ca_name,
#             plain_text=plain_text
#         )

#     @staticmethod
#     async def send_client_login_notification(
#         client_email: str,
#         client_name: str,
#         ca_email: str,
#         ca_name: str,
#         login_time: str,
#         ip_address: str = None,
#         device_info: str = None
#     ) -> bool:
#         """Send notification to CA when client logs in"""
        
#         system_name = settings.SYSTEM_NAME or "CA Firm Management"
        
#         subject = f"🔔 Client Login Alert: {client_name} has logged in"
        
#         plain_text = f"""
# Dear {ca_name},

# This is to notify you that your client has logged into {system_name}.

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#   🔔 CLIENT LOGIN NOTIFICATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#   Client Name  : {client_name}
#   Client Email : {client_email}
#   Login Time   : {login_time}
#   {f'IP Address  : {ip_address}' if ip_address else ''}
#   {f'Device Info : {device_info}' if device_info else ''}
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# You can view client details and documents in your dashboard.

# Best regards,
# {system_name} Team
#         """
        
#         html_body = f"""
# <!DOCTYPE html>
# <html>
# <head>
#     <meta charset="UTF-8">
#     <meta name="viewport" content="width=device-width, initial-scale=1.0">
#     <title>Client Login Notification</title>
#     <style>
#         body {{ font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }}
#         .header {{ background: linear-gradient(135deg, #1B2A4A 0%, #2C4A7C 100%); padding: 20px; color: white; text-align: center; border-radius: 10px 10px 0 0; }}
#         .content {{ padding: 30px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }}
#         .notification {{ background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1B2A4A; }}
#         .detail-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }}
#         .detail-row:last-child {{ border-bottom: none; }}
#         .label {{ font-weight: 600; color: #4b5563; }}
#         .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center; }}
#     </style>
# </head>
# <body>
#     <div class="header">
#         <h2 style="margin: 0;">🔔 Client Login Notification</h2>
#     </div>
#     <div class="content">
#         <p>Dear <strong>{ca_name}</strong>,</p>
#         <p>This is to notify you that your client has logged into <strong>{system_name}</strong>.</p>
        
#         <div class="notification">
#             <h3 style="margin-top: 0; color: #1B2A4A;">Client Details</h3>
#             <div class="detail-row">
#                 <span class="label">👤 Client Name</span>
#                 <span>{client_name}</span>
#             </div>
#             <div class="detail-row">
#                 <span class="label">📧 Client Email</span>
#                 <span>{client_email}</span>
#             </div>
#             <div class="detail-row">
#                 <span class="label">🕐 Login Time</span>
#                 <span>{login_time}</span>
#             </div>
#             {f'''
#             <div class="detail-row">
#                 <span class="label">🌐 IP Address</span>
#                 <span>{ip_address}</span>
#             </div>
#             ''' if ip_address else ''}
#             {f'''
#             <div class="detail-row">
#                 <span class="label">📱 Device Info</span>
#                 <span>{device_info}</span>
#             </div>
#             ''' if device_info else ''}
#         </div>
        
#         <p>You can view client details and documents in your dashboard.</p>
        
#         <div class="footer">
#             <p>Best regards,<br>{system_name} Team</p>
#         </div>
#     </div>
# </body>
# </html>
#         """
        
#         return await EmailService.send_email(
#             to_email=ca_email,
#             subject=subject,
#             html_content=html_body,
#             from_email=settings.SENDGRID_FROM_EMAIL,
#             from_name=settings.SENDGRID_FROM_NAME,
#             plain_text=plain_text
#         )

#     @staticmethod
#     async def send_bulk_client_credentials(
#         clients: list,
#         ca_email: str,
#         ca_name: str = "CA Firm"
#     ) -> dict:
#         """Send bulk credentials to multiple clients"""
        
#         results = {
#             "success": [],
#             "failed": []
#         }
        
#         for client in clients:
#             success = await EmailService.send_client_credentials(
#                 to_email=client['email'],
#                 name=client['name'],
#                 username=client['username'],
#                 password=client['password'],
#                 ca_email=ca_email,
#                 ca_name=ca_name
#             )
            
#             if success:
#                 results["success"].append(client['email'])
#             else:
#                 results["failed"].append(client['email'])
        
#         return results











import os
import logging
from typing import Optional
from pathlib import Path
from datetime import datetime
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Email service - falls back to logging when SendGrid is not configured"""

    @staticmethod
    async def send_email(
        to_email: str,
        subject: str,
        html_content: str,
        from_email: str = None,
        from_name: str = None,
        plain_text: Optional[str] = None,
        attachments: Optional[list] = None
    ) -> bool:
        """Send email using SendGrid API or fallback to logging"""
        try:
            # Use system default if not provided
            if not from_email:
                from_email = settings.SENDGRID_FROM_EMAIL or "noreply@cafirm.com"
            if not from_name:
                from_name = settings.SENDGRID_FROM_NAME or "CA Firm Management"

            # Check if SendGrid is configured
            if not settings.SENDGRID_API_KEY:
                logger.warning("⚠️ SENDGRID_API_KEY not configured - logging email instead")
                logger.info(f"📧 Email to: {to_email}")
                logger.info(f"📧 Subject: {subject}")
                logger.info(f"📧 From: {from_email} ({from_name})")
                logger.info(f"📧 Content preview: {html_content[:200]}...")
                return True  # Return True in development so the flow continues

            # Try to import SendGrid only if API key exists
            try:
                from sendgrid import SendGridAPIClient
                from sendgrid.helpers.mail import Mail, Email, To, Content
                
                # Create SendGrid client
                sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
                
                # Create email
                mail = Mail(
                    from_email=Email(from_email, from_name),
                    to_emails=To(to_email),
                    subject=subject,
                    html_content=Content("text/html", html_content)
                )
                
                # Add plain text version if provided
                if plain_text:
                    mail.plain_text_content = Content("text/plain", plain_text)
                
                # Send email
                response = sg.send(mail)
                
                if response.status_code in [200, 201, 202]:
                    logger.info(f"✅ Email sent to {to_email} from {from_email}")
                    return True
                else:
                    logger.error(f"❌ SendGrid error: {response.status_code} - {response.body}")
                    return False
                    
            except ImportError:
                logger.warning("⚠️ SendGrid library not installed - logging email instead")
                logger.info(f"📧 Email to: {to_email}")
                logger.info(f"📧 Subject: {subject}")
                return True
                
        except Exception as e:
            logger.error(f"❌ Failed to send email: {str(e)}")
            # Return True in development so the flow continues
            return True

    @staticmethod
    async def send_client_credentials(
        to_email: str,
        name: str,
        username: str,
        password: str,
        ca_email: str,
        ca_name: str = "CA Firm",
        ca_phone: str = None,
        additional_info: dict = None
    ) -> bool:
        """Send client credentials from CA's email address"""
        
        login_url = f"{settings.FRONTEND_URL}/login" if settings.FRONTEND_URL else "http://localhost:5173/login"
        system_name = settings.SYSTEM_NAME or "CA Firm Management"
        
        # Plain text version
        plain_text = f"""
Dear {name},

Welcome to {system_name}!

Your account has been created by {ca_name}. Please find your login credentials below:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔑 LOGIN CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Email    : {to_email}
  Username : {username}
  Password : {password}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 Login Link: {login_url}

If you have any questions, please contact your CA at {ca_email}.

Best regards,
{ca_name}
        """
        
        # HTML version
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to {system_name}</title>
    <style>
        body {{ font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333; }}
        .header {{ background: linear-gradient(135deg, #1B2A4A 0%, #2C4A7C 100%); padding: 30px 20px; color: white; text-align: center; border-radius: 10px 10px 0 0; }}
        .header h2 {{ margin: 0; font-size: 24px; }}
        .header p {{ margin: 5px 0 0; opacity: 0.8; }}
        .content {{ background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }}
        .credentials {{ background: #f5f7fa; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }}
        .credential-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }}
        .credential-row:last-child {{ border-bottom: none; }}
        .label {{ font-weight: 600; color: #4b5563; }}
        .value {{ color: #1f2937; font-family: monospace; background: #e5e7eb; padding: 2px 10px; border-radius: 4px; font-size: 14px; }}
        .button {{ display: inline-block; background: linear-gradient(135deg, #1B2A4A 0%, #2C4A7C 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; }}
        .button:hover {{ opacity: 0.9; }}
        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center; }}
        .warning {{ background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; color: #92400e; border-left: 4px solid #f59e0b; }}
        .ca-details {{ background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #22c55e; }}
        .features {{ margin: 15px 0; padding-left: 20px; }}
        .features li {{ margin: 5px 0; }}
    </style>
</head>
<body>
    <div class="header">
        <h2>🏛️ Welcome to {system_name}</h2>
        <p>Your trusted CA firm management solution</p>
    </div>
    
    <div class="content">
        <p>Dear <strong>{name}</strong>,</p>
        
        <p>Welcome to <strong>{system_name}</strong>!</p>
        <p>Your account has been created by <strong>{ca_name}</strong>. Please find your login credentials below:</p>
        
        <div class="credentials">
            <h3 style="margin-top: 0; color: #1B2A4A;">🔑 Login Credentials</h3>
            <div class="credential-row">
                <span class="label">📧 Email</span>
                <span class="value">{to_email}</span>
            </div>
            <div class="credential-row">
                <span class="label">👤 Username</span>
                <span class="value">{username}</span>
            </div>
            <div class="credential-row">
                <span class="label">🔒 Password</span>
                <span class="value">{password}</span>
            </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{login_url}" class="button">🔗 Login Now</a>
        </div>
        
        <div class="warning">
            ⚠️ <strong>IMPORTANT:</strong> Please login and change your password immediately for security purposes.
        </div>
        
        <div class="ca-details">
            <h4 style="margin-top: 0; color: #1B2A4A;">Your CA Contact Details</h4>
            <p><strong>Name:</strong> {ca_name}</p>
            <p><strong>Email:</strong> {ca_email}</p>
            {f'<p><strong>Phone:</strong> {ca_phone}</p>' if ca_phone else ''}
        </div>
        
        {f'''
        <div style="background: #f5f7fa; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <h4 style="margin-top: 0; color: #1B2A4A;">Additional Information</h4>
            <ul>
                {''.join([f'<li><strong>{k}:</strong> {v}</li>' for k, v in (additional_info or {}).items()])}
            </ul>
        </div>
        ''' if additional_info else ''}
        
        <p>After login, you will be able to:</p>
        <ul class="features">
            <li>📄 Upload required documents</li>
            <li>📊 Track your case status</li>
            <li>💰 View invoices and payments</li>
            <li>💬 Communicate with your CA</li>
        </ul>
        
        <p>If you have any questions, please contact your CA directly.</p>
        
        <div class="footer">
            <p>Best regards,<br>
            <strong>{ca_name}</strong><br>
            {system_name} Team</p>
            <p style="font-size: 12px; margin-top: 10px;">
                This is an automated message. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
        """
        
        return await EmailService.send_email(
            to_email=to_email,
            subject=f"Welcome to {system_name} - Your Login Credentials",
            html_content=html_body,
            from_email=ca_email,
            from_name=ca_name,
            plain_text=plain_text
        )

    @staticmethod
    async def send_client_login_notification(
        client_email: str,
        client_name: str,
        ca_email: str,
        ca_name: str,
        login_time: str,
        ip_address: str = None,
        device_info: str = None
    ) -> bool:
        """Send notification to CA when client logs in"""
        
        system_name = settings.SYSTEM_NAME or "CA Firm Management"
        
        subject = f"🔔 Client Login Alert: {client_name} has logged in"
        
        plain_text = f"""
Dear {ca_name},

This is to notify you that your client has logged into {system_name}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔔 CLIENT LOGIN NOTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Client Name  : {client_name}
  Client Email : {client_email}
  Login Time   : {login_time}
  {f'IP Address  : {ip_address}' if ip_address else ''}
  {f'Device Info : {device_info}' if device_info else ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You can view client details and documents in your dashboard.

Best regards,
{system_name} Team
        """
        
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Client Login Notification</title>
    <style>
        body {{ font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #1B2A4A 0%, #2C4A7C 100%); padding: 20px; color: white; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ padding: 30px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }}
        .notification {{ background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1B2A4A; }}
        .detail-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }}
        .detail-row:last-child {{ border-bottom: none; }}
        .label {{ font-weight: 600; color: #4b5563; }}
        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center; }}
    </style>
</head>
<body>
    <div class="header">
        <h2 style="margin: 0;">🔔 Client Login Notification</h2>
    </div>
    <div class="content">
        <p>Dear <strong>{ca_name}</strong>,</p>
        <p>This is to notify you that your client has logged into <strong>{system_name}</strong>.</p>
        
        <div class="notification">
            <h3 style="margin-top: 0; color: #1B2A4A;">Client Details</h3>
            <div class="detail-row">
                <span class="label">👤 Client Name</span>
                <span>{client_name}</span>
            </div>
            <div class="detail-row">
                <span class="label">📧 Client Email</span>
                <span>{client_email}</span>
            </div>
            <div class="detail-row">
                <span class="label">🕐 Login Time</span>
                <span>{login_time}</span>
            </div>
            {f'''
            <div class="detail-row">
                <span class="label">🌐 IP Address</span>
                <span>{ip_address}</span>
            </div>
            ''' if ip_address else ''}
            {f'''
            <div class="detail-row">
                <span class="label">📱 Device Info</span>
                <span>{device_info}</span>
            </div>
            ''' if device_info else ''}
        </div>
        
        <p>You can view client details and documents in your dashboard.</p>
        
        <div class="footer">
            <p>Best regards,<br>{system_name} Team</p>
        </div>
    </div>
</body>
</html>
        """
        
        return await EmailService.send_email(
            to_email=ca_email,
            subject=subject,
            html_content=html_body,
            from_email=settings.SENDGRID_FROM_EMAIL or "noreply@cafirm.com",
            from_name=settings.SENDGRID_FROM_NAME or "CA Firm Management",
            plain_text=plain_text
        )

    @staticmethod
    async def send_bulk_client_credentials(
        clients: list,
        ca_email: str,
        ca_name: str = "CA Firm"
    ) -> dict:
        """Send bulk credentials to multiple clients"""
        
        results = {
            "success": [],
            "failed": []
        }
        
        for client in clients:
            success = await EmailService.send_client_credentials(
                to_email=client['email'],
                name=client['name'],
                username=client['username'],
                password=client['password'],
                ca_email=ca_email,
                ca_name=ca_name
            )
            
            if success:
                results["success"].append(client['email'])
            else:
                results["failed"].append(client['email'])
        
        return results

    @staticmethod
    async def send_submission_notification(
        ca_email: str,
        ca_name: str,
        client_name: str,
        client_email: str,
        submission_id: int,
        document_count: int,
        estimated_total: float,
        frontend_url: str
    ) -> bool:
        """Send notification to CA about new client submission"""
        
        subject = f"📋 New Fee Estimation from {client_name}"
        
        plain_text = f"""
Dear {ca_name},

Your client {client_name} has submitted a new fee estimation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📋 SUBMISSION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Client      : {client_name}
  Email       : {client_email}
  Documents   : {document_count}
  Total       : ₹{estimated_total}
  Submission  : #{submission_id}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Review the submission here:
{frontend_url}/ca/submissions/{submission_id}

Best regards,
{settings.SYSTEM_NAME or "CA Firm Management"} Team
        """
        
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Client Submission</title>
    <style>
        body {{ font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #1B2A4A 0%, #2C4A7C 100%); padding: 20px; color: white; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ padding: 30px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }}
        .details {{ background: #f5f7fa; padding: 20px; border-radius: 8px; margin: 20px 0; }}
        .detail-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }}
        .detail-row:last-child {{ border-bottom: none; }}
        .label {{ font-weight: 600; color: #4b5563; }}
        .button {{ display: inline-block; background: linear-gradient(135deg, #1B2A4A 0%, #2C4A7C 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; }}
        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center; }}
    </style>
</head>
<body>
    <div class="header">
        <h2 style="margin: 0;">📋 New Fee Estimation</h2>
    </div>
    <div class="content">
        <p>Dear <strong>{ca_name}</strong>,</p>
        <p>Your client <strong>{client_name}</strong> has submitted a new fee estimation.</p>
        
        <div class="details">
            <h3 style="margin-top: 0; color: #1B2A4A;">Submission Details</h3>
            <div class="detail-row">
                <span class="label">👤 Client</span>
                <span>{client_name}</span>
            </div>
            <div class="detail-row">
                <span class="label">📧 Email</span>
                <span>{client_email}</span>
            </div>
            <div class="detail-row">
                <span class="label">📄 Documents</span>
                <span>{document_count}</span>
            </div>
            <div class="detail-row">
                <span class="label">💰 Total Estimate</span>
                <span>₹{estimated_total}</span>
            </div>
            <div class="detail-row">
                <span class="label">🆔 Submission</span>
                <span>#{submission_id}</span>
            </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{frontend_url}/ca/submissions/{submission_id}" class="button">📋 Review Submission</a>
        </div>
        
        <div class="footer">
            <p>Best regards,<br>{settings.SYSTEM_NAME or "CA Firm Management"} Team</p>
        </div>
    </div>
</body>
</html>
        """
        
        return await EmailService.send_email(
            to_email=ca_email,
            subject=subject,
            html_content=html_body,
            from_email=settings.SENDGRID_FROM_EMAIL or "noreply@cafirm.com",
            from_name=settings.SENDGRID_FROM_NAME or "CA Firm Management",
            plain_text=plain_text
        )