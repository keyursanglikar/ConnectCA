"""
Test script for Super Admin API
"""
import requests
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

class SuperAdminTest:
    def __init__(self):
        self.access_token = None
        self.refresh_token = None
        self.ca_user_id = None
        self.client_id = None

    def login(self, email: str = "admin@cafirm.com", password: str = "Admin@123"):
        """Login as Super Admin"""
        print("🔑 Logging in as Super Admin...")
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": email, "password": password}
        )
        
        if response.status_code == 200:
            data = response.json()
            self.access_token = data["access_token"]
            self.refresh_token = data["refresh_token"]
            print("✅ Login successful!")
            print(f"   Access Token: {self.access_token[:50]}...")
            return True
        else:
            print(f"❌ Login failed: {response.text}")
            return False

    def get_headers(self):
        """Get headers with bearer token"""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

    def create_ca_user(self):
        """Create a new CA user"""
        print("\n👤 Creating CA User...")
        ca_data = {
            "email": "ca_test@example.com",
            "password": "CA@123456",
            "name": "CA Test User",
            "phone": "+919876543210",
            "role": "CA"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/super-admin/ca-users",
            headers=self.get_headers(),
            json=ca_data
        )
        
        if response.status_code == 200:
            data = response.json()
            self.ca_user_id = data["id"]
            print(f"✅ CA User created successfully!")
            print(f"   ID: {self.ca_user_id}")
            print(f"   Email: {data['email']}")
            print(f"   Name: {data['name']}")
            return True
        else:
            print(f"❌ Failed to create CA user: {response.text}")
            return False

    def get_ca_users(self):
        """Get all CA users"""
        print("\n📋 Getting all CA users...")
        response = requests.get(
            f"{BASE_URL}/api/super-admin/ca-users",
            headers=self.get_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {len(data)} CA users")
            for user in data:
                print(f"   - {user['name']} ({user['email']})")
            return data
        else:
            print(f"❌ Failed to get CA users: {response.text}")
            return []

    def create_client_for_ca(self):
        """Create a client for a CA"""
        print("\n👤 Creating Client for CA...")
        client_data = {
            "name": "John Doe",
            "email": "john.doe@example.com",
            "phone": "+919876543211",
            "client_type": "Individual",
            "pan_number": "ABCDE1234F",
            "aadhaar_number": "123456789012",
            "address": "123, Main Street, City, State - 123456",
            "business_name": "",
            "gst_number": "",
            "dob": "1990-01-15T00:00:00",
            "send_credentials": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/super-admin/clients?ca_user_id={self.ca_user_id}",
            headers=self.get_headers(),
            json=client_data
        )
        
        if response.status_code == 200:
            data = response.json()
            self.client_id = data["id"]
            print(f"✅ Client created successfully!")
            print(f"   ID: {self.client_id}")
            print(f"   Name: {data['name']}")
            print(f"   Email: {data['email']}")
            print(f"   Status: {data['status']}")
            return True
        else:
            print(f"❌ Failed to create client: {response.text}")
            return False

    def get_all_clients(self):
        """Get all clients"""
        print("\n📋 Getting all clients...")
        response = requests.get(
            f"{BASE_URL}/api/super-admin/clients",
            headers=self.get_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {len(data)} clients")
            for client in data:
                print(f"   - {client['name']} ({client['email']}) - {client['status']}")
            return data
        else:
            print(f"❌ Failed to get clients: {response.text}")
            return []

    def get_stats(self):
        """Get dashboard statistics"""
        print("\n📊 Getting dashboard statistics...")
        response = requests.get(
            f"{BASE_URL}/api/super-admin/stats",
            headers=self.get_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Statistics:")
            print(f"   Total CAs: {data['total_cas']}")
            print(f"   Active CAs: {data['active_cas']}")
            print(f"   Total Clients: {data['total_clients']}")
            print(f"   Active Clients: {data['active_clients']}")
            print(f"   Pending Clients: {data['pending_clients']}")
            return data
        else:
            print(f"❌ Failed to get stats: {response.text}")
            return {}

    def run_all_tests(self):
        """Run all tests"""
        print("=" * 60)
        print("🚀 Super Admin API Testing")
        print("=" * 60)
        
        # Login
        if not self.login():
            return
        
        # Get stats
        self.get_stats()
        
        # Create CA user
        if not self.create_ca_user():
            return
        
        # Get CA users
        self.get_ca_users()
        
        # Create client
        if not self.create_client_for_ca():
            return
        
        # Get all clients
        self.get_all_clients()
        
        print("\n" + "=" * 60)
        print("✅ All tests completed successfully!")
        print("=" * 60)
        print(f"\n🔑 CA User Credentials:")
        print(f"   Email: ca_test@example.com")
        print(f"   Password: CA@123456")
        print(f"\n🔑 Client Credentials:")
        print(f"   Email: john.doe@example.com")
        print(f"   Password: (Check email or console for password)")
        print("\n📝 Note: Check your email for credentials (if SMTP is configured)")
        print("=" * 60)


if __name__ == "__main__":
    test = SuperAdminTest()
    test.run_all_tests()