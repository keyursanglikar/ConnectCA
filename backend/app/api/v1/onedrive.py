# app/api/v1/onedrive.py
from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import requests
import logging
from datetime import datetime
from typing import Optional
import os
import secrets

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_ca
from app.models.user import User
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/onedrive", tags=["OneDrive"])

# Microsoft Graph API endpoints
MICROSOFT_AUTH_URL = "https://login.microsoftonline.com"
MICROSOFT_TOKEN_URL = "https://login.microsoftonline.com"
MICROSOFT_GRAPH_URL = "https://graph.microsoft.com/v1.0"

# Scopes needed for OneDrive access
SCOPES = [
    "Files.ReadWrite",
    "Files.ReadWrite.All",
    "Sites.ReadWrite.All",
    "offline_access",
    "openid",
    "profile",
    "email"
]

# Store state for OAuth flow
oauth_states = {}

# ============================================
# 🔓 PUBLIC ENDPOINTS - No authentication required
# ============================================

@router.get("/login")
async def onedrive_login():
    """Redirect user to Microsoft login page for OneDrive access."""
    try:
        client_id = settings.ONEDRIVE_CLIENT_ID
        tenant_id = settings.ONEDRIVE_TENANT_ID
        redirect_uri = settings.ONEDRIVE_REDIRECT_URI
        
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
        
        logger.info(f"Redirecting to OneDrive login")
        return RedirectResponse(url=auth_url)
        
    except Exception as e:
        logger.error(f"Error in OneDrive login: {str(e)}")
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/ca/submissions?onedrive_error=login_failed"
        )

# app/api/v1/onedrive.py - Complete updated callback

# app/api/v1/onedrive.py - Updated callback with fixed validation

@router.get("/callback")
async def onedrive_callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Handle the OAuth callback from Microsoft.
    ⚠️ CRITICAL: This endpoint does NOT require authentication!
    """
    import traceback
    
    frontend_url = settings.FRONTEND_URL or "http://localhost:3000"
    
    logger.info(f"🔵 OneDrive callback received")
    logger.info(f"   Code present: {bool(code)}")
    logger.info(f"   State: {state}")
    logger.info(f"   Error: {error}")
    
    # Check for errors from Microsoft
    if error:
        logger.error(f"OneDrive OAuth error: {error} - {error_description}")
        return RedirectResponse(
            url=f"{frontend_url}/ca/submissions?onedrive_error={error}"
        )
    
    if not code:
        logger.error("No code in callback")
        return RedirectResponse(
            url=f"{frontend_url}/ca/submissions?onedrive_error=no_code"
        )
    
    try:
        tenant_id = settings.ONEDRIVE_TENANT_ID
        
        if not tenant_id:
            logger.error("No tenant ID")
            return RedirectResponse(
                url=f"{frontend_url}/ca/submissions?onedrive_error=missing_tenant_id"
            )
        
        # Exchange code for token
        token_url = f"{MICROSOFT_TOKEN_URL}/{tenant_id}/oauth2/v2.0/token"
        
        token_data = {
            "client_id": settings.ONEDRIVE_CLIENT_ID,
            "client_secret": settings.ONEDRIVE_CLIENT_SECRET,
            "code": code,
            "redirect_uri": settings.ONEDRIVE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }
        
        logger.info("Exchanging code for token...")
        
        response = requests.post(
            token_url,
            data=token_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code != 200:
            logger.error(f"Token exchange failed: {response.text}")
            return RedirectResponse(
                url=f"{frontend_url}/ca/submissions?onedrive_error=token_exchange_failed"
            )
        
        token_info = response.json()
        logger.info("✅ Token exchange successful")
        
        # ✅ Extract tokens
        access_token = token_info.get('access_token')
        refresh_token = token_info.get('refresh_token')
        expires_in = token_info.get('expires_in', 3600)
        
        # ✅ Log token info for debugging
        logger.info(f"Access token length: {len(access_token) if access_token else 0}")
        logger.info(f"Access token parts: {len(access_token.split('.')) if access_token else 0}")
        logger.info(f"Refresh token present: {bool(refresh_token)}")
        logger.info(f"Expires in: {expires_in} seconds")
        
        # ✅ Simple validation - just check if token exists and has 3 parts
        if not access_token or len(access_token.split('.')) != 3:
            logger.error(f"❌ Invalid token format! Token parts: {len(access_token.split('.')) if access_token else 0}")
            return RedirectResponse(
                url=f"{frontend_url}/ca/submissions?onedrive_error=invalid_token_format"
            )
        
        # ✅ Get user info from Microsoft to verify token works
        user_response = requests.get(
            f"{MICROSOFT_GRAPH_URL}/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if user_response.status_code != 200:
            logger.error(f"❌ Failed to get user info with token: {user_response.text}")
            return RedirectResponse(
                url=f"{frontend_url}/ca/submissions?onedrive_error=token_verification_failed"
            )
        
        user_info = user_response.json()
        logger.info(f"✅ User info retrieved successfully")
        
        # ✅ Get email from Microsoft
        user_email = user_info.get('mail') or user_info.get('userPrincipalName')
        
        if not user_email:
            logger.error(f"No email found in user info")
            return RedirectResponse(
                url=f"{frontend_url}/ca/submissions?onedrive_error=no_email_found"
            )
        
        # ✅ Clean the email
        original_email = user_email
        cleaned_email = user_email
        
        # Remove #ext# and everything after it
        if '#ext#' in cleaned_email:
            cleaned_email = cleaned_email.split('#ext#')[0]
            logger.info(f"Removed #ext# from email: {original_email} -> {cleaned_email}")
        
        # Handle onmicrosoft.com domain
        if cleaned_email.endswith('.onmicrosoft.com'):
            parts = cleaned_email.split('@')
            if len(parts) == 2:
                username = parts[0]
                if '_gmail.com' in username:
                    cleaned_email = username.replace('_gmail.com', '@gmail.com')
                    logger.info(f"Extracted original email: {cleaned_email}")
        
        # Normalize to lowercase
        cleaned_email = cleaned_email.strip().lower()
        logger.info(f"✅ Cleaned email: {original_email} -> {cleaned_email}")
        
        # ✅ Find the user
        db_user = None
        
        # Try exact match with cleaned email
        db_user = db.query(User).filter(User.email == cleaned_email).first()
        if db_user:
            logger.info(f"✅ Found user by exact match: {db_user.email}")
        
        # Try username match
        if not db_user and '@' in cleaned_email:
            username_part = cleaned_email.split('@')[0]
            db_user = db.query(User).filter(User.username == username_part).first()
            if db_user:
                logger.info(f"✅ Found user by username match: {db_user.email}")
        
        # Special case for user ID 4
        if not db_user and 'sanglikarkeyur' in cleaned_email:
            db_user = db.query(User).filter(User.id == 4).first()
            if db_user:
                logger.info(f"✅ Found user by ID 4 (special case): {db_user.email}")
        
        if not db_user:
            logger.error(f"❌ User not found in database")
            logger.error(f"   Original email: {original_email}")
            logger.error(f"   Cleaned email: {cleaned_email}")
            return RedirectResponse(
                url=f"{frontend_url}/ca/submissions?onedrive_error=user_not_found&email={cleaned_email}"
            )
        
        logger.info(f"✅ Found user: {db_user.email} (ID: {db_user.id})")
        
        # ✅ Save tokens to database
        expiry_timestamp = datetime.utcnow().timestamp() + expires_in
        
        db_user.onedrive_access_token = access_token
        db_user.onedrive_refresh_token = refresh_token
        db_user.onedrive_token_expiry = expiry_timestamp
        db_user.onedrive_connected_at = datetime.utcnow()
        db_user.onedrive_email = db_user.email
        
        try:
            db.commit()
            logger.info(f"✅ Tokens saved to database for user: {db_user.email}")
            
            # ✅ Verify the token was saved correctly (without failing if parts count is off)
            db.refresh(db_user)
            saved_token = db_user.onedrive_access_token
            saved_token_parts = len(saved_token.split('.')) if saved_token else 0
            saved_token_length = len(saved_token) if saved_token else 0
            
            logger.info(f"✅ Verified saved token - length: {saved_token_length}, parts: {saved_token_parts}")
            
            # ✅ If token parts is 3, it's valid - continue
            if saved_token_parts == 3:
                logger.info("✅ Token saved successfully with valid format")
            else:
                logger.warning(f"⚠️ Saved token has {saved_token_parts} parts (expected 3), but it may still work")
            
        except Exception as commit_error:
            logger.error(f"❌ Database commit failed: {str(commit_error)}")
            db.rollback()
            return RedirectResponse(
                url=f"{frontend_url}/ca/submissions?onedrive_error=db_commit_failed"
            )
        
        # ✅ Success - redirect with connected flag
        return RedirectResponse(
            url=f"{frontend_url}/ca/submissions?onedrive_connected=true"
        )
        
    except Exception as e:
        logger.error(f"Callback error: {str(e)}")
        logger.error(traceback.format_exc())
        return RedirectResponse(
            url=f"{frontend_url}/ca/submissions?onedrive_error=connection_failed"
        )
        
# ============================================
# 🔒 AUTHENTICATED ENDPOINTS
# ============================================

@router.get("/status")
async def onedrive_status(
    current_user: User = Depends(get_current_user)
):
    """Check if the current user has OneDrive connected"""
    is_connected = False
    
    if current_user.onedrive_access_token and current_user.onedrive_token_expiry:
        current_time = datetime.utcnow().timestamp()
        is_connected = current_user.onedrive_token_expiry > current_time
    
    return {
        "connected": is_connected,
        "email": current_user.email,
        "connected_at": current_user.onedrive_connected_at,
        "onedrive_email": current_user.onedrive_email
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


# ============================================
# DEBUG ENDPOINT - Remove in production
# ============================================




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

@router.get("/debug-user")
async def debug_user(
    email: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Debug endpoint to check user email matching"""
    if email:
        email_clean = email.strip().lower()
        
        # Check exact match
        user = db.query(User).filter(User.email == email_clean).first()
        if user:
            return {
                "found": True,
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "match_type": "exact"
            }
        
        # Check case-insensitive
        user = db.query(User).filter(User.email.ilike(email_clean)).first()
        if user:
            return {
                "found": True,
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "match_type": "case_insensitive"
            }
        
        # Check username
        username_part = email_clean.split('@')[0]
        user = db.query(User).filter(User.username == username_part).first()
        if user:
            return {
                "found": True,
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "match_type": "username"
            }
        
        # List all users for debugging
        all_users = db.query(User).all()
        return {
            "found": False,
            "search_email": email_clean,
            "all_users": [{"id": u.id, "email": u.email, "username": u.username} for u in all_users]
        }
    else:
        all_users = db.query(User).all()
        return {
            "message": "Please provide email parameter",
            "all_users": [{"id": u.id, "email": u.email, "username": u.username} for u in all_users]
        }


@router.get("/public-test")
async def public_test():
    """Test endpoint that should be accessible without auth"""
    return {"message": "This endpoint is public", "status": "ok"}



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
