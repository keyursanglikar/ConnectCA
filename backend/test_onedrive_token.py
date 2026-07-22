# backend/test_onedrive_token.py
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Your configuration
tenant_id = ""
client_id = ""
client_secret = ""
redirect_uri = "http://localhost:8000/api/onedrive/callback"

print("=" * 60)
print("🔧 ONEDRIVE CONFIGURATION TEST")
print("=" * 60)
print(f"Tenant ID: {tenant_id}")
print(f"Client ID: {client_id[:10]}...")
print(f"Client Secret: {client_secret[:10]}...")
print(f"Redirect URI: {redirect_uri}")
print("=" * 60)

# Step 1: Generate the authorization URL
auth_url = (
    f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize"
    f"?client_id={client_id}"
    f"&redirect_uri={redirect_uri}"
    f"&response_type=code"
    f"&scope=Files.ReadWrite Files.ReadWrite.All offline_access openid profile email"
    f"&response_mode=query"
)

print("\n📝 Step 1: Authorization URL")
print(f"Open this URL in your browser to get a code:")
print(auth_url)
print("\n" + "=" * 60)

# Step 2: After you get the code, paste it here
# You'll get the code from the URL after authorization
code = input("\n📝 Paste the authorization code from the URL: ")

if not code:
    print("❌ No code provided")
    exit()

print(f"\n📝 Code received: {code[:30]}...")

# Step 3: Exchange code for token
print("\n🔄 Step 2: Exchanging code for token...")

token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"

token_data = {
    "client_id": client_id,
    "client_secret": client_secret,
    "code": code,
    "redirect_uri": redirect_uri,
    "grant_type": "authorization_code"
}

print(f"Token URL: {token_url}")
print(f"Redirect URI: {redirect_uri}")

try:
    response = requests.post(
        token_url,
        data=token_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    print(f"\nResponse Status: {response.status_code}")
    
    if response.status_code == 200:
        print("✅ Token exchange successful!")
        token_info = response.json()
        print(f"Access Token: {token_info.get('access_token', 'N/A')[:30]}...")
        print(f"Refresh Token: {'Yes' if token_info.get('refresh_token') else 'No'}")
        print(f"Expires In: {token_info.get('expires_in', 'N/A')} seconds")
    else:
        print(f"❌ Token exchange failed!")
        print(f"Response: {response.text}")
        
        # Parse error
        try:
            error_data = response.json()
            print("\n🔍 Error Details:")
            print(f"  Error: {error_data.get('error')}")
            print(f"  Description: {error_data.get('error_description')}")
            
            if "redirect_uri" in error_data.get('error_description', '').lower():
                print("\n⚠️ REDIRECT_URI MISMATCH!")
                print(f"  Expected: {redirect_uri}")
                print("  Make sure this is exactly what's in Azure App Registration")
            
            if "invalid_grant" in error_data.get('error', ''):
                print("\n⚠️ INVALID GRANT!")
                print("  The authorization code may have expired or been used already.")
                print("  Generate a new code and try again.")
                
        except:
            pass
            
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 60)