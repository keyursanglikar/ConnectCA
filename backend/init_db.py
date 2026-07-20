"""
Database initialization script
Run this after migrations to create super admin and default data
"""
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.fy_master import FYMaster
from app.core.security import get_password_hash
from app.core.config import settings


def init_database():
    """Initialize database with default data"""
    db = SessionLocal()
    
    try:
        # Create Super Admin
        print("👤 Creating Super Admin...")
        admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if not admin:
            hashed_password = get_password_hash(settings.ADMIN_PASSWORD)
            admin = User(
                email=settings.ADMIN_EMAIL,
                username=settings.ADMIN_EMAIL,
                name="Super Admin",
                hashed_password=hashed_password,
                role="SuperAdmin",
                is_super_admin=True,
                is_verified=True,
                is_active=True
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print(f"✅ Super Admin created: {settings.ADMIN_EMAIL}")
            print(f"   Password: {settings.ADMIN_PASSWORD}")
        else:
            print(f"✅ Super Admin already exists: {settings.ADMIN_EMAIL}")

        # Create Financial Years
        print("\n📅 Creating Financial Years...")
        years = ["2023-24", "2024-25", "2025-26", "2026-27"]
        for year in years:
            existing = db.query(FYMaster).filter(FYMaster.year == year).first()
            if not existing:
                fy = FYMaster(year=year, status=True)
                db.add(fy)
        db.commit()
        print(f"✅ Financial Years created: {', '.join(years)}")

        print("\n" + "=" * 60)
        print("✅ Database initialization completed successfully!")
        print("=" * 60)
        print(f"\n🔑 Login Credentials:")
        print(f"   Email: {settings.ADMIN_EMAIL}")
        print(f"   Password: {settings.ADMIN_PASSWORD}")
        print("\n🚀 Start the server:")
        print("   python -m uvicorn app.main:app --reload")
        print("=" * 60)

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_database()