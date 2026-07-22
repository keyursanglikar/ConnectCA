# backend/test_password_direct.py
from passlib.context import CryptContext

# Initialize the same context as your app
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# The hash from your database
stored_hash = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyF5A8oLw6wy"
password = "Admin@123"

print("=" * 50)
print("🔐 PASSWORD VERIFICATION TEST")
print("=" * 50)

print(f"\n📝 Password to test: {password}")
print(f"🔑 Stored hash: {stored_hash}")
print(f"📏 Hash length: {len(stored_hash)}")

# Test verification
try:
    print("\n🔍 Attempting verification...")
    is_valid = pwd_context.verify(password, stored_hash)
    print(f"✅ Result: {is_valid}")
    
    if is_valid:
        print("\n🎉 Password is VALID! Login should work.")
    else:
        print("\n❌ Password is INVALID!")
        
except Exception as e:
    print(f"\n❌ Error during verification: {e}")
    print(f"Error type: {type(e).__name__}")

# Generate a new hash for comparison
print("\n" + "=" * 50)
print("🔄 GENERATING NEW HASH FOR COMPARISON")
print("=" * 50)

try:
    new_hash = pwd_context.hash(password)
    print(f"\n📝 New hash for '{password}':")
    print(f"{new_hash}")
    print(f"\n📏 New hash length: {len(new_hash)}")
    
    # Check if the new hash matches the stored hash
    print(f"\n🔍 Are the hashes identical? {new_hash == stored_hash}")
    print(f"📊 New hash type: {'bcrypt' if new_hash.startswith('$2b$') else 'other'}")
    print(f"📊 Stored hash type: {'bcrypt' if stored_hash.startswith('$2b$') else 'other'}")
    
except Exception as e:
    print(f"\n❌ Error generating new hash: {e}")

print("\n" + "=" * 50)
print("✅ TEST COMPLETE")
print("=" * 50)