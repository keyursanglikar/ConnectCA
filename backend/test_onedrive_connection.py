# backend/test_onedrive_simple.py
import mysql.connector
import requests
import json
from datetime import datetime

def test_onedrive_direct():
    try:
        # Connect to database directly with correct password
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='Creed@sk2024',  # ✅ Use @ instead of %40
            database='ca_firm_db'
        )
        cursor = conn.cursor()
        
        # Get CA user
        cursor.execute("""
            SELECT id, email, role, 
                   onedrive_access_token, 
                   onedrive_refresh_token,
                   onedrive_token_expiry
            FROM users 
            WHERE email = 'sanglikarkeyur@gmail.com'
        """)
        
        user = cursor.fetchone()
        if not user:
            print("❌ User not found")
            return
        
        user_id, email, role, access_token, refresh_token, token_expiry = user
        
        print("=" * 60)
        print("🔍 ONEDRIVE CONNECTION TEST")
        print("=" * 60)
        print(f"📧 Email: {email}")
        print(f"🔑 Has Access Token: {bool(access_token)}")
        print(f"🔑 Has Refresh Token: {bool(refresh_token)}")
        print(f"⏰ Token Expiry: {token_expiry}")
        print(f"⏰ Current Time: {datetime.utcnow().timestamp()}")
        print("=" * 60)
        
        if not access_token:
            print("\n❌ CA does not have OneDrive connected!")
            print("\n🔧 Please reconnect OneDrive:")
            print("   1. Login as CA: sanglikarkeyur@gmail.com")
            print("   2. Go to Dashboard")
            print("   3. Click 'Connect OneDrive'")
            print("   4. Authorize with Microsoft")
            return
        
        # Check if token is expired
        if token_expiry and token_expiry < datetime.utcnow().timestamp():
            print("\n⚠️ Token is expired!")
            print(f"   Expired at: {datetime.fromtimestamp(token_expiry)}")
            print(f"   Current time: {datetime.utcnow()}")
            print("   Auto-refresh should handle this on next request")
        else:
            print("\n✅ Token is still valid!")
            if token_expiry:
                time_left = token_expiry - datetime.utcnow().timestamp()
                print(f"   Time left: {time_left / 60:.0f} minutes")
        
        # Test the token directly
        print("\n🔄 Testing token with Microsoft Graph API...")
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        # Test drive info
        response = requests.get(
            "https://graph.microsoft.com/v1.0/me/drive",
            headers=headers
        )
        
        if response.status_code == 200:
            drive_info = response.json()
            print(f"\n✅ OneDrive is connected and working!")
            print(f"   Drive Name: {drive_info.get('name')}")
            print(f"   Drive Type: {drive_info.get('driveType')}")
            print(f"   Total Space: {drive_info.get('quota', {}).get('total', 0) / 1024 / 1024 / 1024:.2f} GB")
        else:
            print(f"\n❌ OneDrive test failed with status: {response.status_code}")
            print(f"   Response: {response.text}")
            
            if response.status_code == 401:
                print("\n🔧 Token is invalid or expired.")
                print("   Please reconnect OneDrive from the CA dashboard.")
            elif response.status_code == 403:
                print("\n🔧 Permission denied. Check the scopes in Azure App Registration.")
                
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as e:
        print(f"❌ Database error: {e}")
        print("\n💡 Make sure MySQL is running and the password is correct.")
        print("   Password in .env: Creed%40sk2024 (URL encoded)")
        print("   Actual password: Creed@sk2024")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_onedrive_direct()