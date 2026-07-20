"""
Reset Super Admin user
Run this to fix the Super Admin role
"""
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.core.config import settings


def reset_super_admin():
    """Reset the super admin user"""
    db = SessionLocal()
    
    try:
        print("🔧 Resetting Super Admin...")
        
        # Find admin user
        admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        
        if admin:
            print(f"✅ Found admin user: {admin.email}")
            print(f"   Current Role: {admin.role}")
            print(f"   Is Super Admin: {admin.is_super_admin}")
            
            # Update to Super Admin
            admin.role = UserRole.SUPER_ADMIN
            admin.is_super_admin = True
            admin.is_verified = True
            admin.is_active = True
            
            # Reset password
            admin.hashed_password = get_password_hash(settings.ADMIN_PASSWORD)
            
            db.commit()
            db.refresh(admin)
            
            print(f"\n✅ Super Admin updated successfully!")
            print(f"   Email: {admin.email}")
            print(f"   Role: {admin.role}")
            print(f"   Is Super Admin: {admin.is_super_admin}")
            print(f"   Password: {settings.ADMIN_PASSWORD}")
        else:
            print("❌ Admin user not found. Creating new one...")
            
            # Create new admin
            hashed_password = get_password_hash(settings.ADMIN_PASSWORD)
            admin = User(
                email=settings.ADMIN_EMAIL,
                username=settings.ADMIN_EMAIL,
                name="Super Admin",
                hashed_password=hashed_password,
                role=UserRole.SUPER_ADMIN,
                is_super_admin=True,
                is_verified=True,
                is_active=True
            )
            
            db.add(admin)
            db.commit()
            db.refresh(admin)
            
            print(f"\n✅ Super Admin created successfully!")
            print(f"   Email: {admin.email}")
            print(f"   Role: {admin.role}")
            print(f"   Password: {settings.ADMIN_PASSWORD}")
        
        # Check all users
        print("\n📋 All users in database:")
        users = db.query(User).all()
        for user in users:
            print(f"   - {user.email}: {user.role} (Super Admin: {user.is_super_admin})")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("🔄 Reset Super Admin")
    print("=" * 60)
    reset_super_admin()
    print("\n" + "=" * 60)
    print("✅ Done! You can now login as Super Admin:")
    print(f"   Email: {settings.ADMIN_EMAIL}")
    print(f"   Password: {settings.ADMIN_PASSWORD}")
    print("=" * 60)