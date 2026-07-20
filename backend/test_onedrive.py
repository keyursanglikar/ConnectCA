# backend/test_onedrive.py
import requests
import webbrowser
import time

def test_onedrive_flow():
    print("=" * 50)
    print("OneDrive Personal Setup - Authorization Code Flow")
    print("=" * 50)
    
    print("\n📋 Step 1: Open this URL in your browser:")
    login_url = "http://localhost:8000/api/v1/onedrive/login"
    print(f"   {login_url}")
    print("\n📋 Step 2: Login with your Microsoft account")
    print("📋 Step 3: Grant permissions to the app")
    print("📋 Step 4: Copy the access_token from the response")
    print("\n📋 Step 5: Run this curl command:")
    print("   curl -X POST http://localhost:8000/api/v1/onedrive/test-upload")
    print("\n📋 Step 6: Check OneDrive for uploaded files")
    print("   Visit: https://onedrive.live.com")
    print("\n" + "=" * 50)

if __name__ == "__main__":
    test_onedrive_flow()
    webbrowser.open("http://localhost:8000/api/v1/onedrive/login")