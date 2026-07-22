# # backend/test_onedrive_complete.py
# import requests
# from app.core.config import settings

# print("=" * 60)
# print("🔑 ONEDRIVE CONNECTION TEST")
# print("=" * 60)

# # Check configuration
# print(f"\n📝 Configuration:")
# print(f"   Client ID: {settings.ONEDRIVE_CLIENT_ID[:10] if settings.ONEDRIVE_CLIENT_ID else 'None'}...")
# print(f"   Tenant ID: {settings.ONEDRIVE_TENANT_ID}")
# print(f"   Redirect URI: {settings.ONEDRIVE_REDIRECT_URI}")

# if settings.ONEDRIVE_TENANT_ID != "common":
#     print("\n⚠️ WARNING: Tenant ID is not 'common'")
#     print("   For personal OneDrive, use: ONEDRIVE_TENANT_ID=common")
#     print("   Please update your .env file")

# # Generate authorization URL
# auth_url = (
#     f"https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
#     f"?client_id={settings.ONEDRIVE_CLIENT_ID}"
#     f"&redirect_uri={settings.ONEDRIVE_REDIRECT_URI}"
#     f"&response_type=code"
#     f"&scope=Files.ReadWrite Files.ReadWrite.All offline_access openid profile email"
#     f"&response_mode=query"
# )

# print("\n" + "=" * 60)
# print("🔗 Open this URL in your browser:")
# print("=" * 60)
# print(auth_url)
# print("\n" + "=" * 60)
# print("📌 Steps:")
# print("1. Login with your personal Microsoft account (sanglikarkeyur@gmail.com)")
# print("2. Accept the permissions")
# print("3. After redirect, copy the 'code' parameter from the URL")
# print("4. The backend will handle the rest")
# print("=" * 60)









# backend/test_onedrive_upload_raw.py
import sys
import os
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

import pymysql
import requests
from datetime import datetime

# Import OneDriveService separately
from app.services.onedrive_service import OneDriveService
from app.core.config import settings

class SimpleUser:
    """Simple user class for OneDriveService"""
    def __init__(self, data):
        self.id = data['id']
        self.email = data['email']
        self.role = data['role']
        self.onedrive_access_token = data['onedrive_access_token']
        self.onedrive_refresh_token = data['onedrive_refresh_token']
        self.onedrive_token_expiry = data['onedrive_token_expiry']
        self.onedrive_connected_at = data['onedrive_connected_at']
        self.onedrive_email = data['email']

def test_onedrive_upload():
    try:
        # Connect to database using pymysql
        conn = pymysql.connect(
            host='localhost',
            user='root',
            password='Creed@sk2024',
            database='ca_firm_db',
            cursorclass=pymysql.cursors.DictCursor
        )
        
        with conn.cursor() as cursor:
            # Get user data using raw SQL
            cursor.execute("""
                SELECT 
                    id, 
                    email, 
                    role, 
                    onedrive_access_token, 
                    onedrive_refresh_token, 
                    onedrive_token_expiry, 
                    onedrive_connected_at 
                FROM users 
                WHERE email = 'sanglikarkeyur@gmail.com'
            """)
            
            row = cursor.fetchone()
            
            if not row:
                print("❌ User not found")
                return
            
            print("=" * 60)
            print("📁 TESTING ONEDRIVE UPLOAD")
            print("=" * 60)
            print(f"📧 Email: {row['email']}")
            print(f"🔑 Has Token: {bool(row['onedrive_access_token'])}")
            print(f"🔑 Has Refresh: {bool(row['onedrive_refresh_token'])}")
            print("=" * 60)
            
            if not row['onedrive_access_token']:
                print("❌ No token found. Please reconnect OneDrive.")
                return
            
            # Create simple user object
            user = SimpleUser(row)
            
            # Initialize OneDrive service
            service = OneDriveService(user=user, db=None)
            
            # Step 1: Test connection directly
            print("\n🔄 Step 1: Testing connection...")
            headers = {
                "Authorization": f"Bearer {user.onedrive_access_token}",
                "Content-Type": "application/json"
            }
            
            drive_response = requests.get(
                "https://graph.microsoft.com/v1.0/me/drive",
                headers=headers
            )
            
            if drive_response.status_code == 200:
                drive_info = drive_response.json()
                print(f"✅ Connected to OneDrive!")
                print(f"   Drive Name: {drive_info.get('name')}")
                print(f"   Drive Type: {drive_info.get('driveType')}")
                quota = drive_info.get('quota', {})
                total = quota.get('total', 0)
                used = quota.get('used', 0)
                print(f"   Total Space: {total / 1024 / 1024 / 1024:.2f} GB")
                print(f"   Used Space: {used / 1024 / 1024 / 1024:.2f} GB")
                print(f"   Free Space: {(total - used) / 1024 / 1024 / 1024:.2f} GB")
            else:
                print(f"❌ Connection failed: {drive_response.status_code}")
                print(f"   {drive_response.text}")
                return
            
            # Step 2: Create a test folder
            test_path = f"EazyTax/Test_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            print(f"\n📁 Step 2: Creating test folder: {test_path}")
            
            try:
                folder_response = requests.post(
                    "https://graph.microsoft.com/v1.0/me/drive/root/children",
                    headers={
                        "Authorization": f"Bearer {user.onedrive_access_token}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "name": f"Test_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                        "folder": {},
                        "@microsoft.graph.conflictBehavior": "rename"
                    }
                )
                
                if folder_response.status_code in [200, 201]:
                    folder = folder_response.json()
                    print(f"✅ Folder created!")
                    print(f"   URL: {folder.get('webUrl')}")
                else:
                    print(f"❌ Folder creation failed: {folder_response.status_code}")
                    print(f"   {folder_response.text}")
                    return
            except Exception as e:
                print(f"❌ Error creating folder: {e}")
                return
            
            # Step 3: Upload a test file
            test_content = f"""================================================================================
TEST FILE - ONEDRIVE UPLOAD TEST
================================================================================
Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
This is a test file to verify OneDrive upload is working.

If you see this file, the upload is successful!
================================================================================
""".encode('utf-8')
            
            test_file_name = f"test_upload_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            folder_name = f"Test_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            print(f"\n📤 Step 3: Uploading test file: {test_file_name}")
            
            try:
                upload_url = f"https://graph.microsoft.com/v1.0/me/drive/root:/{folder_name}/{test_file_name}:/content"
                
                upload_response = requests.put(
                    upload_url,
                    headers={
                        "Authorization": f"Bearer {user.onedrive_access_token}",
                        "Content-Type": "text/plain"
                    },
                    data=test_content
                )
                
                if upload_response.status_code in [200, 201]:
                    file_info = upload_response.json()
                    print(f"✅ File uploaded successfully!")
                    print(f"   File Name: {file_info.get('name')}")
                    print(f"   File Size: {file_info.get('size', len(test_content))} bytes")
                    print(f"   File URL: {file_info.get('webUrl')}")
                else:
                    print(f"❌ Upload failed: {upload_response.status_code}")
                    print(f"   {upload_response.text}")
                    return
            except Exception as e:
                print(f"❌ Error uploading file: {e}")
                return
            
            # Step 4: List files in the folder
            print(f"\n📂 Step 4: Listing files in folder...")
            try:
                list_url = f"https://graph.microsoft.com/v1.0/me/drive/root:/{folder_name}:/children"
                
                list_response = requests.get(
                    list_url,
                    headers={
                        "Authorization": f"Bearer {user.onedrive_access_token}",
                        "Content-Type": "application/json"
                    }
                )
                
                if list_response.status_code == 200:
                    items = list_response.json().get('value', [])
                    print(f"✅ Found {len(items)} file(s) in folder:")
                    for item in items:
                        print(f"   - {item.get('name')} ({item.get('size', 0)} bytes)")
                else:
                    print(f"❌ Failed to list files: {list_response.status_code}")
            except Exception as e:
                print(f"❌ Error listing files: {e}")
            
            print("\n" + "=" * 60)
            print("✅ ONEDRIVE UPLOAD TEST PASSED!")
            print("=" * 60)
            print("\n📌 Summary:")
            print(f"   - Folder: {folder_name}")
            print(f"   - File: {test_file_name}")
            print(f"   - Status: ✅ Success")
            
            if folder.get('webUrl'):
                print("\n🔗 You can check your OneDrive at:")
                print(f"   {folder.get('webUrl')}")
            
    except pymysql.Error as e:
        print(f"❌ Database error: {e}")
        print("   Make sure MySQL is running and password is correct.")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    test_onedrive_upload()