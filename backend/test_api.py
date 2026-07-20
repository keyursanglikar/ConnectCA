"""
Test script to verify the API is working
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_root():
    """Test root endpoint"""
    response = requests.get(f"{BASE_URL}/")
    print(f"Root: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    print("-" * 40)

def test_health():
    """Test health endpoint"""
    response = requests.get(f"{BASE_URL}/health")
    print(f"Health: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    print("-" * 40)

def test_login():
    """Test login"""
    login_data = {
        "email": "admin@cafirm.com",
        "password": "Admin@123"
    }
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    print(f"Login: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Access Token: {data['access_token'][:50]}...")
        print(f"Refresh Token: {data['refresh_token'][:50]}...")
        return data
    else:
        print(f"Error: {response.text}")
    print("-" * 40)
    return None

def test_get_me(token):
    """Test get current user"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    print(f"Get Me: {response.status_code}")
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error: {response.text}")
    print("-" * 40)

if __name__ == "__main__":
    print("=" * 60)
    print("Testing CA Firm Management API")
    print("=" * 60)
    print()
    
    test_root()
    test_health()
    
    token_data = test_login()
    if token_data:
        test_get_me(token_data["access_token"])