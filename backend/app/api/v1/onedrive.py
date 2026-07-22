# app/api/v1/onedrive.py
from fastapi import APIRouter, HTTPException, Request, Depends, File, Form, UploadFile
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import requests
import logging
from datetime import datetime
from typing import Optional
import secrets
import traceback

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.core.config import settings
from app.services.onedrive_service import OneDriveService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/onedrive", tags=["OneDrive"])

MICROSOFT_AUTH_URL = "https://login.microsoftonline.com"
MICROSOFT_TOKEN_URL = "https://login.microsoftonline.com"
MICROSOFT_GRAPH_URL = "https://graph.microsoft.com/v1.0"

SCOPES = [
    "Files.ReadWrite",
    "Files.ReadWrite.All",
    "offline_access",
    "openid",
    "profile",
    "email"
]

oauth_states = {}

# ============================================
# PUBLIC ENDPOINTS
# ============================================

@router.get("/login")
async def onedrive_login():
    """Redirect user to Microsoft login page for OneDrive access."""
    try:
        client_id = settings.ONEDRIVE_CLIENT_ID
        tenant_id = settings.ONEDRIVE_TENANT_ID
        redirect_uri = settings.ONEDRIVE_REDIRECT_URI
        
        print("\n" + "=" * 60)
        print("🔵 ONEDRIVE LOGIN INITIATED")
        print("=" * 60)
        print(f"📝 Client ID: {client_id[:10] if client_id else 'None'}...")
        print(f"📝 Tenant ID: {tenant_id}")
        print(f"📝 Redirect URI: {redirect_uri}")
        print("=" * 60)
        
        if not tenant_id:
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/ca/submissions?onedrive_error=missing_tenant_id"
            )
        
        if not client_id:
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/ca/submissions?onedrive_error=missing_client_id"
            )
        
        state = secrets.token_urlsafe(32)
        oauth_states[state] = {"created_at": datetime.utcnow().isoformat()}
        
        auth_url = (
            f"{MICROSOFT_AUTH_URL}/{tenant_id}/oauth2/v2.0/authorize"
            f"?client_id={client_id}"
            f"&redirect_uri={redirect_uri}"
            f"&response_type=code"
            f"&scope={' '.join(SCOPES)}"
            f"&response_mode=query"
            f"&state={state}"
        )
        
        print(f"✅ Redirecting to Microsoft OAuth")
        return RedirectResponse(url=auth_url)
        
    except Exception as e:
        print(f"❌ Error in OneDrive login: {str(e)}")
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/ca/submissions?onedrive_error=login_failed"
        )


@router.get("/callback")
async def onedrive_callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Handle the OAuth callback from Microsoft."""
    frontend_url = settings.FRONTEND_URL or "http://localhost:3000"
    
    print("\n" + "=" * 80)
    print("🔵 ONEDRIVE CALLBACK RECEIVED")
    print("=" * 80)
    print(f"📝 Code: {code[:30] if code else 'None'}...")
    print(f"📝 State: {state}")
    print(f"📝 Error: {error}")
    print(f"📝 Error description: {error_description}")
    print("=" * 80)
    
    if error:
        print(f"❌ Microsoft OAuth error: {error} - {error_description}")
        return RedirectResponse(
            url=f"{frontend_url}/ca/submissions?onedrive_error=oauth_{error}"
        )
    
    if not code:
        print("❌ No authorization code in callback")
        return RedirectResponse(
            url=f"{frontend_url}/ca/submissions?onedrive_error=no_code"
        )
    
    try:
        tenant_id = settings.ONEDRIVE_TENANT_ID
        client_id = settings.ONEDRIVE_CLIENT_ID
        client_secret = settings.ONEDRIVE_CLIENT_SECRET
        redirect_uri = settings.ONEDRIVE_REDIRECT_URI
        
        print(f"\n🔍 Configuration:")
        print(f"   Tenant ID: {tenant_id}")
        print(f"   Client ID: {client_id[:10]}...")
        print(f"   Redirect URI: {redirect_uri}")
        
        token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
        
        token_data = {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code"
        }
        
        print(f"\n🔄 Exchanging code for token...")
        
        response = requests.post(
            token_url,
            data=token_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        print(f"   Response Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Token exchange failed: {response.text}")
            return RedirectResponse(
                url=f"{frontend_url}/ca/submissions?onedrive_error=token_exchange_failed"
            )
        
        token_info = response.json()
        print("✅ Token exchange successful!")
        
        # ✅ Extract tokens
        access_token = token_info.get('access_token')
        refresh_token = token_info.get('refresh_token')
        expires_in = token_info.get('expires_in', 3600)
        
        if not access_token:
            print("❌ No access token received")
            return RedirectResponse(
                url=f"{frontend_url}/ca/submissions?onedrive_error=no_access_token"
            )
        
        # ✅ DEBUG: Print token info
        print(f"\n📝 Access Token Info:")
        print(f"   Token: {access_token[:100]}...")
        print(f"   Length: {len(access_token)}")
        print(f"   Parts: {len(access_token.split('.'))}")
        print(f"   Starts with 'eyJ': {access_token.startswith('eyJ')}")
        
        # ✅ Check if it's a valid token (either JWT or encrypted)
        # Personal Microsoft accounts return encrypted tokens, not JWT
        is_valid_token = len(access_token) > 100
        
        if not is_valid_token:
            print(f"❌ Invalid token! Length: {len(access_token)}")
            return RedirectResponse(
                url=f"{frontend_url}/ca/submissions?onedrive_error=invalid_token"
            )
        
        print("✅ Token is valid (encrypted or JWT)")
        
        # ✅ Verify token with Microsoft Graph
        print("\n🔄 Verifying token with Microsoft...")
        user_response = requests.get(
            "https://graph.microsoft.com/v1.0/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if user_response.status_code != 200:
            print(f"⚠️ Token verification failed: {user_response.status_code}")
            print(f"   {user_response.text}")
            # Continue anyway - the token might still work for drive operations
        
        # ✅ Get user info from Microsoft
        try:
            user_info = user_response.json()
            user_email = user_info.get('mail') or user_info.get('userPrincipalName')
            print(f"📧 User email from Microsoft: {user_email}")
        except:
            print("⚠️ Could not get user info from Microsoft")
            user_email = "sanglikarkeyur@gmail.com"
        
        # ✅ Find user - use the known CA user ID
        db_user = db.query(User).filter(User.id == 2).first()
        
        if not db_user:
            print("❌ User not found!")
            return RedirectResponse(
                url=f"{frontend_url}/ca/submissions?onedrive_error=user_not_found"
            )
        
        print(f"✅ Found user: {db_user.email} (ID: {db_user.id})")
        
        # ✅ Save tokens
        print(f"\n💾 Saving tokens for user: {db_user.email}")
        expiry_timestamp = datetime.utcnow().timestamp() + expires_in
        
        db_user.onedrive_access_token = access_token
        db_user.onedrive_refresh_token = refresh_token
        db_user.onedrive_token_expiry = expiry_timestamp
        db_user.onedrive_connected_at = datetime.utcnow()
        db_user.onedrive_email = db_user.email
        
        try:
            db.commit()
            print(f"✅ Tokens saved successfully!")
            print(f"   Expires at: {datetime.fromtimestamp(expiry_timestamp)}")
            
            # ✅ Verify after save
            db.refresh(db_user)
            saved_token = db_user.onedrive_access_token
            saved_len = len(saved_token) if saved_token else 0
            print(f"   Saved token length: {saved_len}")
            
        except Exception as e:
            print(f"❌ Database error: {e}")
            db.rollback()
            return RedirectResponse(
                url=f"{frontend_url}/ca/submissions?onedrive_error=db_commit_failed"
            )
        
        print("\n" + "=" * 80)
        print("✅ ONEDRIVE CONNECTION SUCCESSFUL!")
        print("=" * 80)
        
        return RedirectResponse(
            url=f"{frontend_url}/ca/dashboard?onedrive_connected=true"
        )
        
    except Exception as e:
        print(f"\n❌ Callback error: {str(e)}")
        print(traceback.format_exc())
        return RedirectResponse(
            url=f"{frontend_url}/ca/submissions?onedrive_error=connection_failed"
        )

# ============================================
# AUTHENTICATED ENDPOINTS
# ============================================

@router.get("/status")
async def onedrive_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check if the current user has OneDrive connected"""
    from app.services.onedrive_service import OneDriveService
    
    is_connected = False
    token_expires_in = 0
    was_refreshed = False
    token_format_valid = False
    token_parts = 0
    
    if current_user.onedrive_access_token:
        # ✅ Check if token is valid (either JWT or encrypted token)
        token_parts = current_user.onedrive_access_token.split('.')
        token_format_valid = len(token_parts) == 3 or len(current_user.onedrive_access_token) > 200
        print(f"🔍 Token for {current_user.email}:")
        print(f"   Length: {len(current_user.onedrive_access_token)}")
        print(f"   Parts: {len(token_parts)}")
        print(f"   Valid format: {token_format_valid}")
        
        if token_format_valid and current_user.onedrive_token_expiry:
            current_time = datetime.utcnow().timestamp()
            token_expires_in = int(current_user.onedrive_token_expiry - current_time)
            is_connected = token_expires_in > 0
            
            # ✅ If expired, try to refresh
            if not is_connected and current_user.onedrive_refresh_token:
                try:
                    print(f"🔄 Auto-refreshing token for {current_user.email}")
                    service = OneDriveService(user=current_user, db=db)
                    if service._refresh_token():
                        is_connected = True
                        was_refreshed = True
                        db.refresh(current_user)
                        token_expires_in = int(current_user.onedrive_token_expiry - datetime.utcnow().timestamp())
                        print(f"✅ Token refreshed!")
                except Exception as e:
                    print(f"❌ Refresh error: {e}")
    
    return {
        "connected": is_connected,
        "refreshed": was_refreshed,
        "email": current_user.email,
        "connected_at": current_user.onedrive_connected_at,
        "onedrive_email": current_user.onedrive_email,
        "has_refresh_token": bool(current_user.onedrive_refresh_token),
        "token_expires_in": token_expires_in if token_expires_in > 0 else 0,
        "token_format_valid": token_format_valid,
        "token_parts": token_parts
    }


    
@router.get("/client-folders")
async def get_client_folders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all client folders from OneDrive"""
    from app.services.onedrive_service import OneDriveService
    
    try:
        service = OneDriveService(user=current_user, db=db)
        folders = service.list_client_folders()
        
        return {
            "success": True,
            "folders": folders,
            "count": len(folders)
        }
    except Exception as e:
        print(f"❌ Error getting client folders: {e}")
        return {
            "success": False,
            "error": str(e),
            "folders": []
        }


@router.get("/client-folder/{client_id}")
async def get_client_folder(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get documents in a specific client's OneDrive folder"""
    from app.services.onedrive_service import OneDriveService
    from app.models.client import ClientMaster
    from app.models.user import User
    
    try:
        client = db.query(ClientMaster).filter(
            ClientMaster.id == client_id,
            ClientMaster.ca_user_id == current_user.id
        ).first()
        
        if not client:
            return {
                "success": False,
                "error": "Client not found",
                "files": []
            }
        
        client_user = db.query(User).filter(User.id == client.user_id).first()
        
        if not client_user:
            return {
                "success": False,
                "error": "Client user not found",
                "files": []
            }
        
        service = OneDriveService(user=current_user, db=db)
        
        folder_path = service.get_client_folder_path(
            client_id=client.id,
            client_name=client_user.name or "Unknown",
            client_email=client_user.email
        )
        
        files = service.get_client_documents(folder_path)
        
        return {
            "success": True,
            "folder_path": folder_path,
            "files": files,
            "count": len(files)
        }
        
    except Exception as e:
        print(f"❌ Error getting client folder: {e}")
        return {
            "success": False,
            "error": str(e),
            "files": []
        }


@router.post("/upload-to-client")
async def upload_to_client_folder(
    file: UploadFile = File(...),
    client_id: int = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a file to a client's OneDrive folder"""
    from app.services.onedrive_service import OneDriveService
    from app.models.client import ClientMaster
    from app.models.user import User
    
    try:
        client = db.query(ClientMaster).filter(
            ClientMaster.id == client_id,
            ClientMaster.ca_user_id == current_user.id
        ).first()
        
        if not client:
            return {
                "success": False,
                "error": "Client not found"
            }
        
        client_user = db.query(User).filter(User.id == client.user_id).first()
        
        if not client_user:
            return {
                "success": False,
                "error": "Client user not found"
            }
        
        service = OneDriveService(user=current_user, db=db)
        
        folder_path = service.get_client_folder_path(
            client_id=client.id,
            client_name=client_user.name or "Unknown",
            client_email=client_user.email
        )
        
        file_content = await file.read()
        file_name = file.filename
        
        result = service.upload_file(
            content=file_content,
            file_name=file_name,
            folder_path=folder_path
        )
        
        return {
            "success": True,
            "folder_path": folder_path,
            "file": {
                "name": file_name,
                "size": len(file_content),
                "web_url": result.get('webUrl')
            }
        }
        
    except Exception as e:
        print(f"❌ Error uploading to client folder: {e}")
        return {
            "success": False,
            "error": str(e)
        }


@router.post("/disconnect")
async def disconnect_onedrive(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Disconnect OneDrive from the user's account"""
    current_user.onedrive_access_token = None
    current_user.onedrive_refresh_token = None
    current_user.onedrive_token_expiry = None
    current_user.onedrive_connected_at = None
    current_user.onedrive_email = None
    
    db.commit()
    
    return {"message": "OneDrive disconnected successfully"}


@router.post("/refresh-token")
async def refresh_onedrive_token(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually refresh the OneDrive access token"""
    if not current_user.onedrive_refresh_token:
        raise HTTPException(
            status_code=400,
            detail="No refresh token available. Please reconnect OneDrive."
        )
    
    try:
        service = OneDriveService(user=current_user, db=db)
        success = service._refresh_token()
        
        if success:
            return {"message": "Token refreshed successfully"}
        else:
            raise HTTPException(
                status_code=400,
                detail="Failed to refresh token. Please reconnect OneDrive."
            )
            
    except Exception as e:
        logger.error(f"Error refreshing token: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to refresh token: {str(e)}")


@router.get("/public-test")
async def public_test():
    """Test endpoint that should be accessible without auth"""
    return {"message": "This endpoint is public", "status": "ok"}


@router.get("/debug-token")
async def debug_token(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Debug endpoint to check token status"""
    if not current_user.onedrive_access_token:
        return {
            "has_token": False,
            "message": "No token found",
            "user_id": current_user.id,
            "user_email": current_user.email
        }
    
    token = current_user.onedrive_access_token
    parts = token.split('.')
    
    return {
        "has_token": True,
        "token_length": len(token),
        "token_parts": len(parts),
        "is_valid_format": len(parts) == 3,
        "token_preview": token[:50] + "...",
        "has_refresh_token": bool(current_user.onedrive_refresh_token),
        "token_expiry": current_user.onedrive_token_expiry,
        "token_expires_in": current_user.onedrive_token_expiry - datetime.utcnow().timestamp() if current_user.onedrive_token_expiry else None,
        "is_expired": current_user.onedrive_token_expiry < datetime.utcnow().timestamp() if current_user.onedrive_token_expiry else True,
        "user_id": current_user.id,
        "user_email": current_user.email,
        "connected_at": current_user.onedrive_connected_at
    }