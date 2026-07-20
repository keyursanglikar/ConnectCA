import asyncio
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.email_service import EmailService
from app.core.config import settings

async def test_sendgrid():
    print("=" * 60)
    print("📧 Testing SendGrid Configuration")
    print("=" * 60)
    print(f"API Key: {settings.SENDGRID_API_KEY[:15]}...")
    print(f"From Email: {settings.SENDGRID_FROM_EMAIL}")
    print(f"From Name: {settings.SENDGRID_FROM_NAME}")
    print(f"Frontend URL: {settings.FRONTEND_URL}")
    print("=" * 60)
    
    # Test 1: Simple email
    print("\n📤 Test 1: Sending simple test email...")
    result = await EmailService.send_email(
        to_email="sanglikarkeyur@gmail.com",  # Send to yourself for testing
        subject="SendGrid Test - Please Ignore",
        html_content="<h1>Test Email</h1><p>If you received this, SendGrid is working!</p>",
        from_email=settings.SENDGRID_FROM_EMAIL,
        from_name=settings.SENDGRID_FROM_NAME
    )
    
    if result:
        print("✅ Simple test email sent successfully!")
    else:
        print("❌ Simple test email failed.")
        print("   Check your SendGrid API key and sender verification.")
    
    # Test 2: Client credentials email
    print("\n📤 Test 2: Sending client credentials email...")
    result2 = await EmailService.send_client_credentials(
        to_email="sanglikarkeyur@gmail.com",  # Send to yourself for testing
        name="Test User",
        username="testuser",
        password="Test@123456",
        ca_email="sanglikarkeyur@gmail.com",
        ca_name="Test CA Firm"
    )
    
    if result2:
        print("✅ Client credentials email sent successfully!")
    else:
        print("❌ Client credentials email failed.")

if __name__ == "__main__":
    asyncio.run(test_sendgrid())