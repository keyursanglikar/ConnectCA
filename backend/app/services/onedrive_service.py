# # backend/app/services/onedrive_service.py
# import requests
# import msal
# import logging
# from typing import Optional, Dict, Any, List
# from datetime import datetime
# from fastapi import HTTPException
# from sqlalchemy.orm import Session

# from app.core.config import settings
# from app.models.user import User

# logger = logging.getLogger(__name__)

# MICROSOFT_GRAPH_URL = "https://graph.microsoft.com/v1.0"


# class OneDriveService:
#     def __init__(self, user: User = None, access_token: str = None, db: Session = None):
#         """
#         Initialize OneDrive service with user and optional access token
        
#         Args:
#             user: User object with OneDrive tokens
#             access_token: Optional access token (overrides user token)
#             db: Database session for token refresh
#         """
#         self.user = user
#         self.db = db
#         self.access_token = access_token or (user.onedrive_access_token if user else None)
#         self.base_url = MICROSOFT_GRAPH_URL
        
#         # Initialize MSAL if we have tenant ID
#         self.app = None
#         if settings.ONEDRIVE_TENANT_ID:
#             try:
#                 authority = f"https://login.microsoftonline.com/{settings.ONEDRIVE_TENANT_ID}"
#                 self.app = msal.ConfidentialClientApplication(
#                     client_id=settings.ONEDRIVE_CLIENT_ID,
#                     client_credential=settings.ONEDRIVE_CLIENT_SECRET,
#                     authority=authority
#                 )
#                 logger.info(f"OneDrive service initialized with tenant: {settings.ONEDRIVE_TENANT_ID}")
#             except Exception as e:
#                 logger.error(f"Failed to initialize MSAL: {str(e)}")
#                 self.app = None
#         else:
#             logger.warning("ONEDRIVE_TENANT_ID not set. OneDrive service will use direct token auth only.")
        
#         if not self.access_token:
#             logger.warning("OneDrive service initialized without access token")
    
#     def _is_token_valid(self, token: str) -> bool:
#         """
#         Check if a token is a valid JWT format
        
#         Args:
#             token: The token to validate
            
#         Returns:
#             True if token is valid JWT format, False otherwise
#         """
#         if not token:
#             return False
        
#         parts = token.split('.')
#         is_valid = len(parts) == 3
        
#         if not is_valid:
#             logger.error(f"❌ Invalid token format! Token parts: {len(parts)}")
#             if len(token) < 100:
#                 logger.error(f"Token content: {token}")
        
#         return is_valid
    
#     def _is_token_expired_or_expiring(self) -> bool:
#         """
#         Check if token is expired or will expire soon
        
#         Returns:
#             True if token is expired or will expire in next 5 minutes
#         """
#         if not self.user or not self.user.onedrive_token_expiry:
#             return True
        
#         current_time = datetime.utcnow().timestamp()
#         expiry_time = self.user.onedrive_token_expiry
        
#         # ✅ Check if token is expired (expiry < current_time)
#         if expiry_time < current_time:
#             minutes_expired = int((current_time - expiry_time) / 60)
#             logger.info(f"Token is already expired (expired {minutes_expired} minutes ago)")
#             return True
        
#         # ✅ Check if token is expiring soon (within 5 minutes)
#         time_until_expiry = expiry_time - current_time
#         if time_until_expiry < 300:
#             logger.info(f"Token is expiring soon (in {int(time_until_expiry)} seconds)")
#             return True
        
#         return False
    
#     def _refresh_token_if_needed(self) -> bool:
#         """
#         Refresh the access token if it's expired or about to expire
        
#         Returns:
#             True if token is valid after refresh, False otherwise
#         """
#         if not self.user:
#             return False
        
#         # First check if the current token is valid JWT format
#         if self.access_token:
#             if not self._is_token_valid(self.access_token):
#                 logger.warning("Token is not valid JWT format, attempting refresh...")
#                 return self._refresh_token()
        
#         # ✅ Check if token is expired or about to expire
#         if self._is_token_expired_or_expiring():
#             return self._refresh_token()
        
#         return True
    
#     def _refresh_token(self) -> bool:
#         """
#         Refresh the access token using refresh token
#         ✅ FIXED: Properly handles refresh token renewal with debug logging
        
#         Returns:
#             True if refresh successful, False otherwise
#         """
#         if not self.user or not self.user.onedrive_refresh_token:
#             logger.error("No refresh token available")
#             print("❌ No refresh token available")
#             return False
        
#         try:
#             tenant_id = settings.ONEDRIVE_TENANT_ID
#             token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
            
#             token_data = {
#                 "client_id": settings.ONEDRIVE_CLIENT_ID,
#                 "client_secret": settings.ONEDRIVE_CLIENT_SECRET,
#                 "refresh_token": self.user.onedrive_refresh_token,
#                 "grant_type": "refresh_token"
#             }
            
#             logger.info("🔄 Attempting to refresh OneDrive token...")
#             print(f"🔄 Refreshing OneDrive token for {self.user.email}")
            
#             response = requests.post(
#                 token_url,
#                 data=token_data,
#                 headers={"Content-Type": "application/x-www-form-urlencoded"}
#             )
            
#             # ✅ Debug logging
#             print(f"📊 Refresh Response Status: {response.status_code}")
            
#             if response.status_code != 200:
#                 logger.error(f"Token refresh failed with status {response.status_code}: {response.text}")
#                 print(f"❌ Token refresh failed: {response.text[:200]}")
#                 return False
            
#             token_info = response.json()
#             new_access_token = token_info.get('access_token')
#             new_refresh_token = token_info.get('refresh_token')
#             expires_in = token_info.get('expires_in', 3600)
            
#             # ✅ Validate the new token format
#             if not new_access_token:
#                 logger.error("No access token in refresh response")
#                 print("❌ No access token in refresh response")
#                 return False
            
#             if not self._is_token_valid(new_access_token):
#                 logger.error("❌ New token from refresh is invalid format!")
#                 print("❌ New token from refresh is invalid format!")
#                 return False
            
#             # ✅ Update tokens in database
#             self.user.onedrive_access_token = new_access_token
            
#             # ✅ Update refresh token if a new one is provided
#             if new_refresh_token:
#                 self.user.onedrive_refresh_token = new_refresh_token
#                 logger.info("✅ New refresh token received")
#                 print("✅ New refresh token received")
            
#             # ✅ Update expiry
#             new_expiry = datetime.utcnow().timestamp() + expires_in
#             self.user.onedrive_token_expiry = new_expiry
            
#             if self.db:
#                 try:
#                     self.db.commit()
#                     logger.info(f"✅ Tokens refreshed successfully, expires in {expires_in}s")
#                     print(f"✅ Token refreshed, new expiry: {datetime.fromtimestamp(new_expiry)}")
#                 except Exception as e:
#                     logger.error(f"Failed to commit token refresh: {str(e)}")
#                     self.db.rollback()
#                     return False
            
#             # Update local access token
#             self.access_token = new_access_token
#             logger.info(f"✅ Token refreshed successfully. New token length: {len(new_access_token)}")
#             return True
            
#         except Exception as e:
#             logger.error(f"Error refreshing token: {str(e)}")
#             print(f"❌ Refresh error: {str(e)}")
#             import traceback
#             traceback.print_exc()
#             return False
    
#     def _get_valid_token(self) -> Optional[str]:
#         """
#         Get a valid access token, refreshing if needed
        
#         Returns:
#             Valid access token or None if no valid token available
#         """
#         # ✅ If no token at all, return None
#         if not self.access_token:
#             logger.error("No access token available")
#             return None
        
#         # ✅ Validate token format
#         if not self._is_token_valid(self.access_token):
#             logger.warning("Token is not valid JWT format")
            
#             # Try to refresh the token
#             if self.user and self.user.onedrive_refresh_token:
#                 logger.info("Attempting to refresh token due to invalid format...")
#                 if self._refresh_token():
#                     # After refresh, validate again
#                     if self.access_token and self._is_token_valid(self.access_token):
#                         return self.access_token
#                     else:
#                         logger.error("❌ Refreshed token is still invalid!")
#                         return None
#             return None
        
#         # ✅ Try to refresh if needed (expired or about to expire)
#         if self.user:
#             self._refresh_token_if_needed()
#             # Update access_token from user object if it was refreshed
#             if self.user.onedrive_access_token:
#                 self.access_token = self.user.onedrive_access_token
#                 # Validate again after potential refresh
#                 if not self._is_token_valid(self.access_token):
#                     logger.error("❌ Token became invalid after refresh attempt")
#                     return None
        
#         # Final validation
#         if self.access_token and self._is_token_valid(self.access_token):
#             return self.access_token
#         else:
#             logger.error("❌ No valid token available after all attempts")
#             return None
    
#     def _get_headers(self) -> Dict[str, str]:
#         """
#         Get headers with valid token
        
#         Returns:
#             Headers dict with Authorization bearer token
        
#         Raises:
#             ValueError: If no valid access token available
#         """
#         token = self._get_valid_token()
#         if not token:
#             raise ValueError("No valid access token available. Please reconnect OneDrive.")
        
#         return {
#             "Authorization": f"Bearer {token}",
#             "Content-Type": "application/json"
#         }
    
#     def check_and_refresh_token(self) -> Dict[str, Any]:
#         """
#         Check token status and refresh if needed (without making API calls)
#         Used during login to ensure token is valid
        
#         Returns:
#             Dict with token status information
#         """
#         if not self.user:
#             return {
#                 "connected": False, 
#                 "refreshed": False,
#                 "has_refresh_token": False,
#                 "has_access_token": False,
#                 "message": "No user"
#             }
        
#         result = {
#             "connected": False,
#             "refreshed": False,
#             "has_refresh_token": bool(self.user.onedrive_refresh_token),
#             "has_access_token": bool(self.user.onedrive_access_token),
#             "token_valid": False,
#             "message": ""
#         }
        
#         # ✅ Check if token exists and is valid format
#         if self.user.onedrive_access_token:
#             if self._is_token_valid(self.user.onedrive_access_token):
#                 # Check expiry
#                 if self.user.onedrive_token_expiry:
#                     current_time = datetime.utcnow().timestamp()
#                     if self.user.onedrive_token_expiry > current_time:
#                         # Token is valid
#                         result["connected"] = True
#                         result["token_valid"] = True
#                         result["message"] = "Token is valid"
#                         return result
#                     else:
#                         # Token expired
#                         result["message"] = "Token is expired"
#                 else:
#                     # No expiry date - assume valid
#                     result["connected"] = True
#                     result["token_valid"] = True
#                     result["message"] = "Token exists (no expiry)"
#                     return result
#             else:
#                 # Invalid token format
#                 result["message"] = "Token format is invalid"
#         else:
#             result["message"] = "No access token"
        
#         # ✅ Try to refresh if expired or invalid and has refresh token
#         if self.user.onedrive_refresh_token:
#             print(f"🔄 Auto-refreshing OneDrive token for {self.user.email} (check_and_refresh)")
#             refresh_success = self._refresh_token()
            
#             if refresh_success:
#                 result["connected"] = True
#                 result["refreshed"] = True
#                 result["token_valid"] = True
#                 result["message"] = "Token refreshed successfully"
#                 return result
#             else:
#                 result["message"] = "Failed to refresh token"
#                 return result
        
#         # No refresh token available
#         result["message"] = "No refresh token available. Please reconnect OneDrive."
#         return result
    
#     def create_folder(self, path: str) -> Dict[str, Any]:
#         """Create a folder in OneDrive with nested path support"""
#         try:
#             parts = path.split('/')
#             current_path = ""
#             last_created_folder = None
            
#             print(f"📁 Creating folder structure: {path}")
            
#             for i, folder_name in enumerate(parts):
#                 if i == 0:
#                     current_path = folder_name
#                     existing = self.get_item_by_path(current_path)
                    
#                     if not existing:
#                         url = f"{self.base_url}/me/drive/root/children"
#                         data = {
#                             "name": folder_name,
#                             "folder": {},
#                             "@microsoft.graph.conflictBehavior": "rename"
#                         }
#                         headers = self._get_headers()
#                         response = requests.post(url, headers=headers, json=data)
                        
#                         if response.status_code not in [200, 201]:
#                             error_msg = f"Failed to create folder: {folder_name} - {response.text}"
#                             logger.error(error_msg)
#                             raise Exception(error_msg)
                        
#                         existing = response.json()
#                         logger.info(f"✅ Created folder: {folder_name}")
#                         last_created_folder = existing
#                     else:
#                         logger.info(f"📁 Folder already exists: {folder_name}")
#                         last_created_folder = existing
#                 else:
#                     parent_path = current_path
#                     current_path = f"{parent_path}/{folder_name}"
#                     existing = self.get_item_by_path(current_path)
                    
#                     if not existing:
#                         url = f"{self.base_url}/me/drive/root:/{parent_path}:/children"
#                         data = {
#                             "name": folder_name,
#                             "folder": {},
#                             "@microsoft.graph.conflictBehavior": "rename"
#                         }
#                         headers = self._get_headers()
#                         response = requests.post(url, headers=headers, json=data)
                        
#                         if response.status_code not in [200, 201]:
#                             error_msg = f"Failed to create subfolder: {folder_name} in {parent_path} - {response.text}"
#                             logger.error(error_msg)
#                             raise Exception(error_msg)
                        
#                         existing = response.json()
#                         logger.info(f"✅ Created subfolder: {folder_name} in {parent_path}")
#                         last_created_folder = existing
#                     else:
#                         logger.info(f"📁 Subfolder already exists: {folder_name}")
#                         last_created_folder = existing
            
#             result = self.get_item_by_path(path)
#             if result:
#                 return result
#             elif last_created_folder:
#                 return last_created_folder
#             else:
#                 raise Exception(f"Failed to create or find folder: {path}")
                
#         except Exception as e:
#             logger.error(f"Error creating folder: {str(e)}")
#             raise
    
#     def get_item_by_path(self, path: str) -> Optional[Dict[str, Any]]:
#         """Get an item by its path"""
#         try:
#             url = f"{self.base_url}/me/drive/root:/{path}"
#             headers = self._get_headers()
#             response = requests.get(url, headers=headers)
            
#             if response.status_code == 200:
#                 return response.json()
#             elif response.status_code == 404:
#                 return None
#             else:
#                 logger.error(f"Failed to get item: {response.text}")
#                 return None
                
#         except Exception as e:
#             logger.error(f"Error getting item: {str(e)}")
#             return None
    
#     def upload_file(self, content: bytes, file_name: str, folder_path: str = "") -> Dict[str, Any]:
#         """Upload a file to OneDrive"""
#         try:
#             import re
#             clean_file_name = re.sub(r'[^\w\s.-]', '_', file_name)
            
#             if folder_path:
#                 full_path = f"{folder_path}/{clean_file_name}"
#             else:
#                 full_path = clean_file_name
            
#             url = f"{self.base_url}/me/drive/root:/{full_path}:/content"
            
#             headers = self._get_headers()
#             headers["Content-Type"] = "application/octet-stream"
            
#             logger.info(f"Uploading file: {full_path} ({len(content)} bytes)")
#             print(f"📤 Uploading: {full_path}")
            
#             response = requests.put(
#                 url,
#                 headers=headers,
#                 data=content
#             )
            
#             if response.status_code in [200, 201]:
#                 logger.info(f"✅ File uploaded: {full_path}")
#                 print(f"✅ Uploaded: {full_path}")
#                 return response.json()
#             else:
#                 error_msg = f"Failed to upload file: {response.text}"
#                 logger.error(error_msg)
#                 raise Exception(error_msg)
                
#         except Exception as e:
#             logger.error(f"Error uploading file: {str(e)}")
#             raise
    
#     def upload_multiple_files(self, files: List[Dict[str, Any]], folder_path: str) -> List[Dict[str, Any]]:
#         """Upload multiple files to OneDrive"""
#         uploaded_files = []
        
#         for file_info in files:
#             try:
#                 content = file_info.get('content')
#                 file_name = file_info.get('name')
#                 metadata = file_info.get('metadata', {})
                
#                 if not content or not file_name:
#                     logger.error(f"Missing content or name for file: {file_info}")
#                     continue
                
#                 result = self.upload_file(content, file_name, folder_path)
                
#                 uploaded_files.append({
#                     "name": file_name,
#                     "metadata": metadata,
#                     "web_url": result.get('webUrl'),
#                     "download_url": result.get('downloadUrl'),
#                     "id": result.get('id')
#                 })
                
#             except Exception as e:
#                 logger.error(f"Error uploading file {file_info.get('name')}: {str(e)}")
#                 uploaded_files.append({
#                     "name": file_info.get('name'),
#                     "error": str(e),
#                     "uploaded": False
#                 })
        
#         return uploaded_files
    
#     def get_shareable_link(self, path: str) -> str:
#         """Get a shareable link for a file or folder"""
#         try:
#             url = f"{self.base_url}/me/drive/root:/{path}/createLink"
#             data = {
#                 "type": "view",
#                 "scope": "anonymous"
#             }
            
#             headers = self._get_headers()
#             response = requests.post(url, headers=headers, json=data)
            
#             if response.status_code == 200:
#                 link_data = response.json()
#                 link_url = link_data.get("link", {}).get("webUrl", "")
#                 logger.info(f"✅ Created shareable link for: {path}")
#                 return link_url
#             else:
#                 logger.error(f"Failed to create shareable link: {response.text}")
#                 return ""
                
#         except Exception as e:
#             logger.error(f"Error creating shareable link: {str(e)}")
#             return ""
    
#     def list_files(self, folder_path: str = "") -> List[Dict[str, Any]]:
#         """List files in a folder"""
#         try:
#             url = f"{self.base_url}/me/drive/root:/{folder_path}:/children" if folder_path else f"{self.base_url}/me/drive/root/children"
            
#             headers = self._get_headers()
#             response = requests.get(url, headers=headers)
            
#             if response.status_code == 200:
#                 items = response.json().get("value", [])
#                 logger.info(f"✅ Listed {len(items)} items in folder: {folder_path or 'root'}")
#                 return items
#             else:
#                 logger.error(f"Failed to list files: {response.text}")
#                 return []
                
#         except Exception as e:
#             logger.error(f"Error listing files: {str(e)}")
#             return []
    
#     def delete_file(self, path: str) -> bool:
#         """Delete a file or folder from OneDrive"""
#         try:
#             url = f"{self.base_url}/me/drive/root:/{path}"
            
#             headers = self._get_headers()
#             response = requests.delete(url, headers=headers)
            
#             if response.status_code in [200, 204]:
#                 logger.info(f"✅ Deleted: {path}")
#                 return True
#             else:
#                 logger.error(f"Failed to delete: {response.text}")
#                 return False
                
#         except Exception as e:
#             logger.error(f"Error deleting: {str(e)}")
#             return False
    
#     def get_drive_info(self) -> Dict[str, Any]:
#         """Get current drive information"""
#         try:
#             url = f"{self.base_url}/me/drive"
#             headers = self._get_headers()
#             response = requests.get(url, headers=headers)
            
#             if response.status_code == 200:
#                 logger.info("✅ Retrieved drive info")
#                 return response.json()
#             else:
#                 error_msg = f"Failed to get drive info: {response.text}"
#                 logger.error(error_msg)
#                 raise Exception(error_msg)
                
#         except Exception as e:
#             logger.error(f"Error getting drive info: {str(e)}")
#             raise
    
#     def get_file_content(self, path: str) -> bytes:
#         """Download file content from OneDrive"""
#         try:
#             url = f"{self.base_url}/me/drive/root:/{path}/content"
#             headers = self._get_headers()
            
#             response = requests.get(url, headers=headers)
            
#             if response.status_code == 200:
#                 logger.info(f"✅ Downloaded file: {path} ({len(response.content)} bytes)")
#                 return response.content
#             else:
#                 error_msg = f"Failed to download file: {response.text}"
#                 logger.error(error_msg)
#                 raise Exception(error_msg)
                
#         except Exception as e:
#             logger.error(f"Error downloading file: {str(e)}")
#             raise
    
#     def search_files(self, query: str, folder_path: str = "") -> List[Dict[str, Any]]:
#         """Search for files in OneDrive"""
#         try:
#             if folder_path:
#                 url = f"{self.base_url}/me/drive/root:/{folder_path}:/search(q='{query}')"
#             else:
#                 url = f"{self.base_url}/me/drive/root/search(q='{query}')"
            
#             headers = self._get_headers()
#             response = requests.get(url, headers=headers)
            
#             if response.status_code == 200:
#                 items = response.json().get("value", [])
#                 logger.info(f"✅ Found {len(items)} items matching: {query}")
#                 return items
#             else:
#                 logger.error(f"Failed to search files: {response.text}")
#                 return []
                
#         except Exception as e:
#             logger.error(f"Error searching files: {str(e)}")
#             return []
    
#     def get_token_status(self) -> Dict[str, Any]:
#         """Get current token status with auto-refresh if needed"""
#         if not self.user:
#             return {"connected": False, "message": "No user"}
        
#         is_connected = False
#         expires_in = None
#         was_refreshed = False
        
#         # ✅ Check if token exists
#         if self.user.onedrive_access_token and self.user.onedrive_refresh_token:
#             current_time = datetime.utcnow().timestamp()
#             token_expiry = self.user.onedrive_token_expiry or 0
            
#             if token_expiry > current_time:
#                 # Token is valid
#                 is_connected = True
#                 expires_in = token_expiry - current_time
#             else:
#                 # ✅ Token expired - try to refresh automatically
#                 try:
#                     logger.info(f"🔄 Auto-refreshing OneDrive token for {self.user.email}")
#                     refresh_success = self._refresh_token()
                    
#                     if refresh_success:
#                         is_connected = True
#                         was_refreshed = True
#                         if self.user.onedrive_token_expiry:
#                             expires_in = self.user.onedrive_token_expiry - datetime.utcnow().timestamp()
#                         logger.info(f"✅ OneDrive token auto-refreshed for {self.user.email}")
#                     else:
#                         logger.warning(f"❌ Failed to auto-refresh OneDrive token for {self.user.email}")
#                 except Exception as e:
#                     logger.error(f"❌ Auto-refresh error: {e}")
        
#         return {
#             "connected": is_connected,
#             "refreshed": was_refreshed,
#             "expires_in": int(expires_in) if expires_in and expires_in > 0 else 0,
#             "has_refresh_token": bool(self.user.onedrive_refresh_token),
#             "connected_at": self.user.onedrive_connected_at,
#             "email": self.user.onedrive_email,
#             "user_email": self.user.email
#         }















# # backend/app/services/onedrive_service.py
# import requests
# import msal
# import logging
# from typing import Optional, Dict, Any, List
# from datetime import datetime
# from fastapi import HTTPException
# from sqlalchemy.orm import Session

# from app.core.config import settings
# from app.models.user import User

# logger = logging.getLogger(__name__)

# MICROSOFT_GRAPH_URL = "https://graph.microsoft.com/v1.0"


# class OneDriveService:
#     def __init__(self, user: User = None, access_token: str = None, db: Session = None):
#         """
#         Initialize OneDrive service with user and optional access token
        
#         Args:
#             user: User object with OneDrive tokens
#             access_token: Optional access token (overrides user token)
#             db: Database session for token refresh
#         """
#         self.user = user
#         self.db = db
#         self.access_token = access_token or (user.onedrive_access_token if user else None)
#         self.base_url = MICROSOFT_GRAPH_URL
        
#         # Initialize MSAL if we have tenant ID
#         self.app = None
#         if settings.ONEDRIVE_TENANT_ID:
#             try:
#                 authority = f"https://login.microsoftonline.com/{settings.ONEDRIVE_TENANT_ID}"
#                 self.app = msal.ConfidentialClientApplication(
#                     client_id=settings.ONEDRIVE_CLIENT_ID,
#                     client_credential=settings.ONEDRIVE_CLIENT_SECRET,
#                     authority=authority
#                 )
#                 logger.info(f"OneDrive service initialized with tenant: {settings.ONEDRIVE_TENANT_ID}")
#             except Exception as e:
#                 logger.error(f"Failed to initialize MSAL: {str(e)}")
#                 self.app = None
#         else:
#             logger.warning("ONEDRIVE_TENANT_ID not set. OneDrive service will use direct token auth only.")
        
#         if not self.access_token:
#             logger.warning("OneDrive service initialized without access token")
    
#     def _is_token_valid(self, token: str) -> bool:
#         """
#         Check if a token is a valid JWT format
        
#         Args:
#             token: The token to validate
            
#         Returns:
#             True if token is valid JWT format, False otherwise
#         """
#         if not token:
#             return False
        
#         parts = token.split('.')
#         is_valid = len(parts) == 3
        
#         if not is_valid:
#             logger.error(f"❌ Invalid token format! Token parts: {len(parts)}")
#             if len(token) < 100:
#                 logger.error(f"Token content: {token}")
        
#         return is_valid
    
#     def _is_token_expired_or_expiring(self) -> bool:
#         """
#         Check if token is expired or will expire soon
        
#         Returns:
#             True if token is expired or will expire in next 5 minutes
#         """
#         if not self.user or not self.user.onedrive_token_expiry:
#             return True
        
#         current_time = datetime.utcnow().timestamp()
#         expiry_time = self.user.onedrive_token_expiry
        
#         # ✅ Check if token is expired (expiry < current_time)
#         if expiry_time < current_time:
#             minutes_expired = int((current_time - expiry_time) / 60)
#             logger.info(f"Token is already expired (expired {minutes_expired} minutes ago)")
#             return True
        
#         # ✅ Check if token is expiring soon (within 5 minutes)
#         time_until_expiry = expiry_time - current_time
#         if time_until_expiry < 300:
#             logger.info(f"Token is expiring soon (in {int(time_until_expiry)} seconds)")
#             return True
        
#         return False
    
#     def _refresh_token_if_needed(self) -> bool:
#         """
#         Refresh the access token if it's expired or about to expire
        
#         Returns:
#             True if token is valid after refresh, False otherwise
#         """
#         if not self.user:
#             return False
        
#         # First check if the current token is valid JWT format
#         if self.access_token:
#             if not self._is_token_valid(self.access_token):
#                 logger.warning("Token is not valid JWT format, attempting refresh...")
#                 return self._refresh_token()
        
#         # ✅ Check if token is expired or about to expire
#         if self._is_token_expired_or_expiring():
#             return self._refresh_token()
        
#         return True
    
#     def _refresh_token(self) -> bool:
#         """
#         Refresh the access token using refresh token
#         ✅ FIXED: Properly handles refresh token renewal with debug logging
        
#         Returns:
#             True if refresh successful, False otherwise
#         """
#         if not self.user or not self.user.onedrive_refresh_token:
#             logger.error("No refresh token available")
#             print("❌ No refresh token available")
#             return False
        
#         try:
#             tenant_id = settings.ONEDRIVE_TENANT_ID
#             token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
            
#             token_data = {
#                 "client_id": settings.ONEDRIVE_CLIENT_ID,
#                 "client_secret": settings.ONEDRIVE_CLIENT_SECRET,
#                 "refresh_token": self.user.onedrive_refresh_token,
#                 "grant_type": "refresh_token"
#             }
            
#             logger.info("🔄 Attempting to refresh OneDrive token...")
#             print(f"🔄 Refreshing OneDrive token for {self.user.email}")
            
#             response = requests.post(
#                 token_url,
#                 data=token_data,
#                 headers={"Content-Type": "application/x-www-form-urlencoded"}
#             )
            
#             # ✅ Debug logging
#             print(f"📊 Refresh Response Status: {response.status_code}")
            
#             if response.status_code != 200:
#                 logger.error(f"Token refresh failed with status {response.status_code}: {response.text}")
#                 print(f"❌ Token refresh failed: {response.text[:200]}")
#                 return False
            
#             token_info = response.json()
#             new_access_token = token_info.get('access_token')
#             new_refresh_token = token_info.get('refresh_token')
#             expires_in = token_info.get('expires_in', 3600)
            
#             # ✅ Validate the new token format
#             if not new_access_token:
#                 logger.error("No access token in refresh response")
#                 print("❌ No access token in refresh response")
#                 return False
            
#             if not self._is_token_valid(new_access_token):
#                 logger.error("❌ New token from refresh is invalid format!")
#                 print("❌ New token from refresh is invalid format!")
#                 return False
            
#             # ✅ Update tokens in database
#             self.user.onedrive_access_token = new_access_token
            
#             # ✅ Update refresh token if a new one is provided
#             if new_refresh_token:
#                 self.user.onedrive_refresh_token = new_refresh_token
#                 logger.info("✅ New refresh token received")
#                 print("✅ New refresh token received")
            
#             # ✅ Update expiry
#             new_expiry = datetime.utcnow().timestamp() + expires_in
#             self.user.onedrive_token_expiry = new_expiry
            
#             if self.db:
#                 try:
#                     self.db.commit()
#                     logger.info(f"✅ Tokens refreshed successfully, expires in {expires_in}s")
#                     print(f"✅ Token refreshed, new expiry: {datetime.fromtimestamp(new_expiry)}")
#                 except Exception as e:
#                     logger.error(f"Failed to commit token refresh: {str(e)}")
#                     self.db.rollback()
#                     return False
#             else:
#                 # No database session, just log
#                 logger.info("No database session provided, token refreshed in memory only")
#                 print("📝 No database session, token refreshed in memory only")
            
#             # Update local access token
#             self.access_token = new_access_token
#             logger.info(f"✅ Token refreshed successfully. New token length: {len(new_access_token)}")
#             return True
            
#         except Exception as e:
#             logger.error(f"Error refreshing token: {str(e)}")
#             print(f"❌ Refresh error: {str(e)}")
#             import traceback
#             traceback.print_exc()
#             return False
    
#     def _get_valid_token(self) -> Optional[str]:
#         """
#         Get a valid access token, refreshing if needed
        
#         Returns:
#             Valid access token or None if no valid token available
#         """
#         # ✅ If no token at all, return None
#         if not self.access_token:
#             logger.error("No access token available")
#             return None
        
#         # ✅ Validate token format
#         if not self._is_token_valid(self.access_token):
#             logger.warning("Token is not valid JWT format")
            
#             # Try to refresh the token
#             if self.user and self.user.onedrive_refresh_token:
#                 logger.info("Attempting to refresh token due to invalid format...")
#                 if self._refresh_token():
#                     # After refresh, validate again
#                     if self.access_token and self._is_token_valid(self.access_token):
#                         return self.access_token
#                     else:
#                         logger.error("❌ Refreshed token is still invalid!")
#                         return None
#             return None
        
#         # ✅ Try to refresh if needed (expired or about to expire)
#         if self.user:
#             self._refresh_token_if_needed()
#             # Update access_token from user object if it was refreshed
#             if self.user.onedrive_access_token:
#                 self.access_token = self.user.onedrive_access_token
#                 # Validate again after potential refresh
#                 if not self._is_token_valid(self.access_token):
#                     logger.error("❌ Token became invalid after refresh attempt")
#                     return None
        
#         # Final validation
#         if self.access_token and self._is_token_valid(self.access_token):
#             return self.access_token
#         else:
#             logger.error("❌ No valid token available after all attempts")
#             return None
    
#     def _get_headers(self) -> Dict[str, str]:
#         """
#         Get headers with valid token
        
#         Returns:
#             Headers dict with Authorization bearer token
        
#         Raises:
#             ValueError: If no valid access token available
#         """
#         token = self._get_valid_token()
#         if not token:
#             raise ValueError("No valid access token available. Please reconnect OneDrive.")
        
#         return {
#             "Authorization": f"Bearer {token}",
#             "Content-Type": "application/json"
#         }
    
#     def check_and_refresh_token(self) -> Dict[str, Any]:
#         """
#         Check token status and refresh if needed (without making API calls)
#         Used during login to ensure token is valid
        
#         Returns:
#             Dict with token status information
#         """
#         if not self.user:
#             return {
#                 "connected": False, 
#                 "refreshed": False,
#                 "has_refresh_token": False,
#                 "has_access_token": False,
#                 "message": "No user"
#             }
        
#         result = {
#             "connected": False,
#             "refreshed": False,
#             "has_refresh_token": bool(self.user.onedrive_refresh_token),
#             "has_access_token": bool(self.user.onedrive_access_token),
#             "token_valid": False,
#             "message": ""
#         }
        
#         # ✅ Check if token exists and is valid format
#         if self.user.onedrive_access_token:
#             if self._is_token_valid(self.user.onedrive_access_token):
#                 # Check expiry
#                 if self.user.onedrive_token_expiry:
#                     current_time = datetime.utcnow().timestamp()
#                     if self.user.onedrive_token_expiry > current_time:
#                         # Token is valid
#                         result["connected"] = True
#                         result["token_valid"] = True
#                         result["message"] = "Token is valid"
#                         return result
#                     else:
#                         # Token expired
#                         result["message"] = "Token is expired"
#                 else:
#                     # No expiry date - assume valid
#                     result["connected"] = True
#                     result["token_valid"] = True
#                     result["message"] = "Token exists (no expiry)"
#                     return result
#             else:
#                 # Invalid token format
#                 result["message"] = "Token format is invalid"
#         else:
#             result["message"] = "No access token"
        
#         # ✅ Try to refresh if expired or invalid and has refresh token
#         if self.user.onedrive_refresh_token:
#             print(f"🔄 Auto-refreshing OneDrive token for {self.user.email} (check_and_refresh)")
#             refresh_success = self._refresh_token()
            
#             if refresh_success:
#                 result["connected"] = True
#                 result["refreshed"] = True
#                 result["token_valid"] = True
#                 result["message"] = "Token refreshed successfully"
#                 return result
#             else:
#                 result["message"] = "Failed to refresh token"
#                 return result
        
#         # No refresh token available
#         result["message"] = "No refresh token available. Please reconnect OneDrive."
#         return result
    
#     def create_folder(self, path: str) -> Dict[str, Any]:
#         """Create a folder in OneDrive with nested path support"""
#         try:
#             parts = path.split('/')
#             current_path = ""
#             last_created_folder = None
            
#             print(f"📁 Creating folder structure: {path}")
            
#             for i, folder_name in enumerate(parts):
#                 if i == 0:
#                     current_path = folder_name
#                     existing = self.get_item_by_path(current_path)
                    
#                     if not existing:
#                         url = f"{self.base_url}/me/drive/root/children"
#                         data = {
#                             "name": folder_name,
#                             "folder": {},
#                             "@microsoft.graph.conflictBehavior": "rename"
#                         }
#                         headers = self._get_headers()
#                         response = requests.post(url, headers=headers, json=data)
                        
#                         if response.status_code not in [200, 201]:
#                             error_msg = f"Failed to create folder: {folder_name} - {response.text}"
#                             logger.error(error_msg)
#                             raise Exception(error_msg)
                        
#                         existing = response.json()
#                         logger.info(f"✅ Created folder: {folder_name}")
#                         last_created_folder = existing
#                     else:
#                         logger.info(f"📁 Folder already exists: {folder_name}")
#                         last_created_folder = existing
#                 else:
#                     parent_path = current_path
#                     current_path = f"{parent_path}/{folder_name}"
#                     existing = self.get_item_by_path(current_path)
                    
#                     if not existing:
#                         url = f"{self.base_url}/me/drive/root:/{parent_path}:/children"
#                         data = {
#                             "name": folder_name,
#                             "folder": {},
#                             "@microsoft.graph.conflictBehavior": "rename"
#                         }
#                         headers = self._get_headers()
#                         response = requests.post(url, headers=headers, json=data)
                        
#                         if response.status_code not in [200, 201]:
#                             error_msg = f"Failed to create subfolder: {folder_name} in {parent_path} - {response.text}"
#                             logger.error(error_msg)
#                             raise Exception(error_msg)
                        
#                         existing = response.json()
#                         logger.info(f"✅ Created subfolder: {folder_name} in {parent_path}")
#                         last_created_folder = existing
#                     else:
#                         logger.info(f"📁 Subfolder already exists: {folder_name}")
#                         last_created_folder = existing
            
#             result = self.get_item_by_path(path)
#             if result:
#                 return result
#             elif last_created_folder:
#                 return last_created_folder
#             else:
#                 raise Exception(f"Failed to create or find folder: {path}")
                
#         except Exception as e:
#             logger.error(f"Error creating folder: {str(e)}")
#             raise
    
#     def get_item_by_path(self, path: str) -> Optional[Dict[str, Any]]:
#         """Get an item by its path"""
#         try:
#             url = f"{self.base_url}/me/drive/root:/{path}"
#             headers = self._get_headers()
#             response = requests.get(url, headers=headers)
            
#             if response.status_code == 200:
#                 return response.json()
#             elif response.status_code == 404:
#                 return None
#             else:
#                 logger.error(f"Failed to get item: {response.text}")
#                 return None
                
#         except Exception as e:
#             logger.error(f"Error getting item: {str(e)}")
#             return None
    
#     def upload_file(self, content: bytes, file_name: str, folder_path: str = "") -> Dict[str, Any]:
#         """Upload a file to OneDrive"""
#         try:
#             import re
#             clean_file_name = re.sub(r'[^\w\s.-]', '_', file_name)
            
#             if folder_path:
#                 full_path = f"{folder_path}/{clean_file_name}"
#             else:
#                 full_path = clean_file_name
            
#             url = f"{self.base_url}/me/drive/root:/{full_path}:/content"
            
#             headers = self._get_headers()
#             headers["Content-Type"] = "application/octet-stream"
            
#             logger.info(f"Uploading file: {full_path} ({len(content)} bytes)")
#             print(f"📤 Uploading: {full_path}")
            
#             response = requests.put(
#                 url,
#                 headers=headers,
#                 data=content
#             )
            
#             if response.status_code in [200, 201]:
#                 logger.info(f"✅ File uploaded: {full_path}")
#                 print(f"✅ Uploaded: {full_path}")
#                 return response.json()
#             else:
#                 error_msg = f"Failed to upload file: {response.text}"
#                 logger.error(error_msg)
#                 raise Exception(error_msg)
                
#         except Exception as e:
#             logger.error(f"Error uploading file: {str(e)}")
#             raise
    
#     def upload_multiple_files(self, files: List[Dict[str, Any]], folder_path: str) -> List[Dict[str, Any]]:
#         """Upload multiple files to OneDrive"""
#         uploaded_files = []
        
#         for file_info in files:
#             try:
#                 content = file_info.get('content')
#                 file_name = file_info.get('name')
#                 metadata = file_info.get('metadata', {})
                
#                 if not content or not file_name:
#                     logger.error(f"Missing content or name for file: {file_info}")
#                     continue
                
#                 result = self.upload_file(content, file_name, folder_path)
                
#                 uploaded_files.append({
#                     "name": file_name,
#                     "metadata": metadata,
#                     "web_url": result.get('webUrl'),
#                     "download_url": result.get('downloadUrl'),
#                     "id": result.get('id')
#                 })
                
#             except Exception as e:
#                 logger.error(f"Error uploading file {file_info.get('name')}: {str(e)}")
#                 uploaded_files.append({
#                     "name": file_info.get('name'),
#                     "error": str(e),
#                     "uploaded": False
#                 })
        
#         return uploaded_files
    
#     def get_shareable_link(self, path: str) -> str:
#         """Get a shareable link for a file or folder"""
#         try:
#             url = f"{self.base_url}/me/drive/root:/{path}/createLink"
#             data = {
#                 "type": "view",
#                 "scope": "anonymous"
#             }
            
#             headers = self._get_headers()
#             response = requests.post(url, headers=headers, json=data)
            
#             if response.status_code == 200:
#                 link_data = response.json()
#                 link_url = link_data.get("link", {}).get("webUrl", "")
#                 logger.info(f"✅ Created shareable link for: {path}")
#                 return link_url
#             else:
#                 logger.error(f"Failed to create shareable link: {response.text}")
#                 return ""
                
#         except Exception as e:
#             logger.error(f"Error creating shareable link: {str(e)}")
#             return ""
    
#     def list_files(self, folder_path: str = "") -> List[Dict[str, Any]]:
#         """List files in a folder"""
#         try:
#             url = f"{self.base_url}/me/drive/root:/{folder_path}:/children" if folder_path else f"{self.base_url}/me/drive/root/children"
            
#             headers = self._get_headers()
#             response = requests.get(url, headers=headers)
            
#             if response.status_code == 200:
#                 items = response.json().get("value", [])
#                 logger.info(f"✅ Listed {len(items)} items in folder: {folder_path or 'root'}")
#                 return items
#             else:
#                 logger.error(f"Failed to list files: {response.text}")
#                 return []
                
#         except Exception as e:
#             logger.error(f"Error listing files: {str(e)}")
#             return []
    
#     def delete_file(self, path: str) -> bool:
#         """Delete a file or folder from OneDrive"""
#         try:
#             url = f"{self.base_url}/me/drive/root:/{path}"
            
#             headers = self._get_headers()
#             response = requests.delete(url, headers=headers)
            
#             if response.status_code in [200, 204]:
#                 logger.info(f"✅ Deleted: {path}")
#                 return True
#             else:
#                 logger.error(f"Failed to delete: {response.text}")
#                 return False
                
#         except Exception as e:
#             logger.error(f"Error deleting: {str(e)}")
#             return False
    
#     def get_drive_info(self) -> Dict[str, Any]:
#         """Get current drive information"""
#         try:
#             url = f"{self.base_url}/me/drive"
#             headers = self._get_headers()
#             response = requests.get(url, headers=headers)
            
#             if response.status_code == 200:
#                 logger.info("✅ Retrieved drive info")
#                 return response.json()
#             else:
#                 error_msg = f"Failed to get drive info: {response.text}"
#                 logger.error(error_msg)
#                 raise Exception(error_msg)
                
#         except Exception as e:
#             logger.error(f"Error getting drive info: {str(e)}")
#             raise
    
#     def get_file_content(self, path: str) -> bytes:
#         """Download file content from OneDrive"""
#         try:
#             url = f"{self.base_url}/me/drive/root:/{path}/content"
#             headers = self._get_headers()
            
#             response = requests.get(url, headers=headers)
            
#             if response.status_code == 200:
#                 logger.info(f"✅ Downloaded file: {path} ({len(response.content)} bytes)")
#                 return response.content
#             else:
#                 error_msg = f"Failed to download file: {response.text}"
#                 logger.error(error_msg)
#                 raise Exception(error_msg)
                
#         except Exception as e:
#             logger.error(f"Error downloading file: {str(e)}")
#             raise
    
#     def search_files(self, query: str, folder_path: str = "") -> List[Dict[str, Any]]:
#         """Search for files in OneDrive"""
#         try:
#             if folder_path:
#                 url = f"{self.base_url}/me/drive/root:/{folder_path}:/search(q='{query}')"
#             else:
#                 url = f"{self.base_url}/me/drive/root/search(q='{query}')"
            
#             headers = self._get_headers()
#             response = requests.get(url, headers=headers)
            
#             if response.status_code == 200:
#                 items = response.json().get("value", [])
#                 logger.info(f"✅ Found {len(items)} items matching: {query}")
#                 return items
#             else:
#                 logger.error(f"Failed to search files: {response.text}")
#                 return []
                
#         except Exception as e:
#             logger.error(f"Error searching files: {str(e)}")
#             return []
    
#     def get_token_status(self) -> Dict[str, Any]:
#         """Get current token status with auto-refresh if needed"""
#         if not self.user:
#             return {"connected": False, "message": "No user"}
        
#         is_connected = False
#         expires_in = None
#         was_refreshed = False
        
#         # ✅ Check if token exists
#         if self.user.onedrive_access_token and self.user.onedrive_refresh_token:
#             current_time = datetime.utcnow().timestamp()
#             token_expiry = self.user.onedrive_token_expiry or 0
            
#             if token_expiry > current_time:
#                 # Token is valid
#                 is_connected = True
#                 expires_in = token_expiry - current_time
#             else:
#                 # ✅ Token expired - try to refresh automatically
#                 try:
#                     logger.info(f"🔄 Auto-refreshing OneDrive token for {self.user.email}")
#                     refresh_success = self._refresh_token()
                    
#                     if refresh_success:
#                         is_connected = True
#                         was_refreshed = True
#                         if self.user.onedrive_token_expiry:
#                             expires_in = self.user.onedrive_token_expiry - datetime.utcnow().timestamp()
#                         logger.info(f"✅ OneDrive token auto-refreshed for {self.user.email}")
#                     else:
#                         logger.warning(f"❌ Failed to auto-refresh OneDrive token for {self.user.email}")
#                 except Exception as e:
#                     logger.error(f"❌ Auto-refresh error: {e}")
        
#         return {
#             "connected": is_connected,
#             "refreshed": was_refreshed,
#             "expires_in": int(expires_in) if expires_in and expires_in > 0 else 0,
#             "has_refresh_token": bool(self.user.onedrive_refresh_token),
#             "connected_at": self.user.onedrive_connected_at,
#             "email": self.user.onedrive_email,
#             "user_email": self.user.email
#         }

#     def get_user_drive_info(self) -> Dict[str, Any]:
#         """
#         Get drive info for the current user (wrapper for get_drive_info)
#         """
#         return self.get_drive_info()











# # backend/app/services/onedrive_service.py
# import requests
# import msal
# import logging
# from typing import Optional, Dict, Any, List
# from datetime import datetime
# from fastapi import HTTPException
# from sqlalchemy.orm import Session

# from app.core.config import settings
# from app.models.user import User

# logger = logging.getLogger(__name__)

# MICROSOFT_GRAPH_URL = "https://graph.microsoft.com/v1.0"


# class OneDriveService:
#     def __init__(self, user: User = None, access_token: str = None, db: Session = None):
#         """
#         Initialize OneDrive service with user and optional access token
        
#         Args:
#             user: User object with OneDrive tokens
#             access_token: Optional access token (overrides user token)
#             db: Database session for token refresh
#         """
#         self.user = user
#         self.db = db
#         self.access_token = access_token or (user.onedrive_access_token if user else None)
#         self.base_url = MICROSOFT_GRAPH_URL
        
#         # Initialize MSAL if we have tenant ID
#         self.app = None
#         if settings.ONEDRIVE_TENANT_ID:
#             try:
#                 authority = f"https://login.microsoftonline.com/{settings.ONEDRIVE_TENANT_ID}"
#                 self.app = msal.ConfidentialClientApplication(
#                     client_id=settings.ONEDRIVE_CLIENT_ID,
#                     client_credential=settings.ONEDRIVE_CLIENT_SECRET,
#                     authority=authority
#                 )
#                 logger.info(f"OneDrive service initialized with tenant: {settings.ONEDRIVE_TENANT_ID}")
#             except Exception as e:
#                 logger.error(f"Failed to initialize MSAL: {str(e)}")
#                 self.app = None
#         else:
#             logger.warning("ONEDRIVE_TENANT_ID not set. OneDrive service will use direct token auth only.")
        
#         if not self.access_token:
#             logger.warning("OneDrive service initialized without access token")
    
#     def _is_token_valid(self, token: str) -> bool:
#         """
#         Check if a token is a valid JWT format
        
#         Args:
#             token: The token to validate
            
#         Returns:
#             True if token is valid JWT format, False otherwise
#         """
#         if not token:
#             return False
        
#         parts = token.split('.')
#         is_valid = len(parts) == 3
        
#         if not is_valid:
#             logger.error(f"❌ Invalid token format! Token parts: {len(parts)}")
#             if len(token) < 100:
#                 logger.error(f"Token content: {token}")
        
#         return is_valid
    
#     def _is_token_expired_or_expiring(self) -> bool:
#         """
#         Check if token is expired or will expire soon
        
#         Returns:
#             True if token is expired or will expire in next 5 minutes
#         """
#         if not self.user or not self.user.onedrive_token_expiry:
#             return True
        
#         current_time = datetime.utcnow().timestamp()
#         expiry_time = self.user.onedrive_token_expiry
        
#         # ✅ Check if token is expired (expiry < current_time)
#         if expiry_time < current_time:
#             minutes_expired = int((current_time - expiry_time) / 60)
#             logger.info(f"Token is already expired (expired {minutes_expired} minutes ago)")
#             return True
        
#         # ✅ Check if token is expiring soon (within 5 minutes)
#         time_until_expiry = expiry_time - current_time
#         if time_until_expiry < 300:
#             logger.info(f"Token is expiring soon (in {int(time_until_expiry)} seconds)")
#             return True
        
#         return False
    
#     def _refresh_token_if_needed(self) -> bool:
#         """
#         Refresh the access token if it's expired or about to expire
        
#         Returns:
#             True if token is valid after refresh, False otherwise
#         """
#         if not self.user:
#             return False
        
#         # First check if the current token is valid JWT format
#         if self.access_token:
#             if not self._is_token_valid(self.access_token):
#                 logger.warning("Token is not valid JWT format, attempting refresh...")
#                 return self._refresh_token()
        
#         # ✅ Check if token is expired or about to expire
#         if self._is_token_expired_or_expiring():
#             return self._refresh_token()
        
#         return True
    
#     def _refresh_token(self) -> bool:
#         """
#         Refresh the access token using refresh token
#         ✅ FIXED: Properly handles refresh token renewal with debug logging
        
#         Returns:
#             True if refresh successful, False otherwise
#         """
#         if not self.user or not self.user.onedrive_refresh_token:
#             logger.error("No refresh token available")
#             print("❌ No refresh token available")
#             return False
        
#         try:
#             tenant_id = settings.ONEDRIVE_TENANT_ID
#             token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
            
#             token_data = {
#                 "client_id": settings.ONEDRIVE_CLIENT_ID,
#                 "client_secret": settings.ONEDRIVE_CLIENT_SECRET,
#                 "refresh_token": self.user.onedrive_refresh_token,
#                 "grant_type": "refresh_token"
#             }
            
#             logger.info("🔄 Attempting to refresh OneDrive token...")
#             print(f"🔄 Refreshing OneDrive token for {self.user.email}")
            
#             response = requests.post(
#                 token_url,
#                 data=token_data,
#                 headers={"Content-Type": "application/x-www-form-urlencoded"}
#             )
            
#             # ✅ Debug logging
#             print(f"📊 Refresh Response Status: {response.status_code}")
            
#             if response.status_code != 200:
#                 logger.error(f"Token refresh failed with status {response.status_code}: {response.text}")
#                 print(f"❌ Token refresh failed: {response.text[:200]}")
#                 return False
            
#             token_info = response.json()
#             new_access_token = token_info.get('access_token')
#             new_refresh_token = token_info.get('refresh_token')
#             expires_in = token_info.get('expires_in', 3600)
            
#             # ✅ Validate the new token format
#             if not new_access_token:
#                 logger.error("No access token in refresh response")
#                 print("❌ No access token in refresh response")
#                 return False
            
#             if not self._is_token_valid(new_access_token):
#                 logger.error("❌ New token from refresh is invalid format!")
#                 print("❌ New token from refresh is invalid format!")
#                 return False
            
#             # ✅ Update tokens in database
#             self.user.onedrive_access_token = new_access_token
            
#             # ✅ Update refresh token if a new one is provided
#             if new_refresh_token:
#                 self.user.onedrive_refresh_token = new_refresh_token
#                 logger.info("✅ New refresh token received")
#                 print("✅ New refresh token received")
            
#             # ✅ Update expiry
#             new_expiry = datetime.utcnow().timestamp() + expires_in
#             self.user.onedrive_token_expiry = new_expiry
            
#             if self.db:
#                 try:
#                     self.db.commit()
#                     logger.info(f"✅ Tokens refreshed successfully, expires in {expires_in}s")
#                     print(f"✅ Token refreshed, new expiry: {datetime.fromtimestamp(new_expiry)}")
#                 except Exception as e:
#                     logger.error(f"Failed to commit token refresh: {str(e)}")
#                     self.db.rollback()
#                     return False
#             else:
#                 # No database session, just log
#                 logger.info("No database session provided, token refreshed in memory only")
#                 print("📝 No database session, token refreshed in memory only")
            
#             # Update local access token
#             self.access_token = new_access_token
#             logger.info(f"✅ Token refreshed successfully. New token length: {len(new_access_token)}")
#             return True
            
#         except Exception as e:
#             logger.error(f"Error refreshing token: {str(e)}")
#             print(f"❌ Refresh error: {str(e)}")
#             import traceback
#             traceback.print_exc()
#             return False
    
#     def _ensure_valid_token(self) -> bool:
#         """
#         ✅ CRITICAL: Ensure token is valid - refresh if expired
#         This is called before EVERY OneDrive API call
        
#         Returns:
#             True if token is valid, False otherwise
#         """
#         if not self.user:
#             print("❌ No user for token validation")
#             return False
        
#         # Check if token exists
#         if not self.user.onedrive_access_token:
#             print("❌ No access token available")
#             return False
        
#         # Check if token is valid format
#         if not self._is_token_valid(self.user.onedrive_access_token):
#             print("❌ Token format is invalid, attempting refresh...")
#             return self._refresh_token()
        
#         # Check if token is expired or expiring soon
#         if self.user.onedrive_token_expiry:
#             current_time = datetime.utcnow().timestamp()
#             time_until_expiry = self.user.onedrive_token_expiry - current_time
            
#             if time_until_expiry < 0:
#                 # Token is expired
#                 print(f"🔄 Token expired {abs(time_until_expiry):.0f} seconds ago, refreshing...")
#                 return self._refresh_token()
#             elif time_until_expiry < 300:
#                 # Token expiring soon (within 5 minutes)
#                 print(f"🔄 Token expiring in {time_until_expiry:.0f} seconds, refreshing proactively...")
#                 return self._refresh_token()
#             else:
#                 # Token is valid
#                 print(f"✅ Token is valid (expires in {time_until_expiry:.0f} seconds)")
#                 return True
#         else:
#             # No expiry date, assume valid
#             print("✅ No expiry date, assuming token is valid")
#             return True
    
#     def _get_valid_token(self) -> Optional[str]:
#         """
#         Get a valid access token, refreshing if needed
#         ✅ This is called before every API call
        
#         Returns:
#             Valid access token or None if no valid token available
#         """
#         # ✅ CRITICAL: Ensure token is valid before proceeding
#         if not self._ensure_valid_token():
#             logger.error("No valid token available")
#             return None
        
#         # Return the current access token
#         return self.access_token or self.user.onedrive_access_token
    
#     def _get_headers(self) -> Dict[str, str]:
#         """
#         Get headers with valid token - auto-refresh if expired
        
#         Returns:
#             Headers dict with Authorization bearer token
        
#         Raises:
#             ValueError: If no valid access token available
#         """
#         token = self._get_valid_token()
#         if not token:
#             raise ValueError("No valid access token available. Please reconnect OneDrive.")
        
#         return {
#             "Authorization": f"Bearer {token}",
#             "Content-Type": "application/json"
#         }
    
#     def check_and_refresh_token(self) -> Dict[str, Any]:
#         """
#         Check token status and refresh if needed (without making API calls)
#         Used during login to ensure token is valid
        
#         Returns:
#             Dict with token status information
#         """
#         if not self.user:
#             return {
#                 "connected": False, 
#                 "refreshed": False,
#                 "has_refresh_token": False,
#                 "has_access_token": False,
#                 "message": "No user"
#             }
        
#         result = {
#             "connected": False,
#             "refreshed": False,
#             "has_refresh_token": bool(self.user.onedrive_refresh_token),
#             "has_access_token": bool(self.user.onedrive_access_token),
#             "token_valid": False,
#             "message": ""
#         }
        
#         # ✅ Check if token exists and is valid format
#         if self.user.onedrive_access_token:
#             if self._is_token_valid(self.user.onedrive_access_token):
#                 # Check expiry
#                 if self.user.onedrive_token_expiry:
#                     current_time = datetime.utcnow().timestamp()
#                     if self.user.onedrive_token_expiry > current_time:
#                         # Token is valid
#                         result["connected"] = True
#                         result["token_valid"] = True
#                         result["message"] = "Token is valid"
#                         return result
#                     else:
#                         # Token expired
#                         result["message"] = "Token is expired"
#                 else:
#                     # No expiry date - assume valid
#                     result["connected"] = True
#                     result["token_valid"] = True
#                     result["message"] = "Token exists (no expiry)"
#                     return result
#             else:
#                 # Invalid token format
#                 result["message"] = "Token format is invalid"
#         else:
#             result["message"] = "No access token"
        
#         # ✅ Try to refresh if expired or invalid and has refresh token
#         if self.user.onedrive_refresh_token:
#             print(f"🔄 Auto-refreshing OneDrive token for {self.user.email} (check_and_refresh)")
#             refresh_success = self._refresh_token()
            
#             if refresh_success:
#                 result["connected"] = True
#                 result["refreshed"] = True
#                 result["token_valid"] = True
#                 result["message"] = "Token refreshed successfully"
#                 return result
#             else:
#                 result["message"] = "Failed to refresh token"
#                 return result
        
#         # No refresh token available
#         result["message"] = "No refresh token available. Please reconnect OneDrive."
#         return result
    
#     def create_folder(self, path: str) -> Dict[str, Any]:
#         """Create a folder in OneDrive with nested path support"""
#         try:
#             parts = path.split('/')
#             current_path = ""
#             last_created_folder = None
            
#             print(f"📁 Creating folder structure: {path}")
            
#             for i, folder_name in enumerate(parts):
#                 if i == 0:
#                     current_path = folder_name
#                     existing = self.get_item_by_path(current_path)
                    
#                     if not existing:
#                         url = f"{self.base_url}/me/drive/root/children"
#                         data = {
#                             "name": folder_name,
#                             "folder": {},
#                             "@microsoft.graph.conflictBehavior": "rename"
#                         }
#                         headers = self._get_headers()
#                         response = requests.post(url, headers=headers, json=data)
                        
#                         if response.status_code not in [200, 201]:
#                             error_msg = f"Failed to create folder: {folder_name} - {response.text}"
#                             logger.error(error_msg)
#                             raise Exception(error_msg)
                        
#                         existing = response.json()
#                         logger.info(f"✅ Created folder: {folder_name}")
#                         last_created_folder = existing
#                     else:
#                         logger.info(f"📁 Folder already exists: {folder_name}")
#                         last_created_folder = existing
#                 else:
#                     parent_path = current_path
#                     current_path = f"{parent_path}/{folder_name}"
#                     existing = self.get_item_by_path(current_path)
                    
#                     if not existing:
#                         url = f"{self.base_url}/me/drive/root:/{parent_path}:/children"
#                         data = {
#                             "name": folder_name,
#                             "folder": {},
#                             "@microsoft.graph.conflictBehavior": "rename"
#                         }
#                         headers = self._get_headers()
#                         response = requests.post(url, headers=headers, json=data)
                        
#                         if response.status_code not in [200, 201]:
#                             error_msg = f"Failed to create subfolder: {folder_name} in {parent_path} - {response.text}"
#                             logger.error(error_msg)
#                             raise Exception(error_msg)
                        
#                         existing = response.json()
#                         logger.info(f"✅ Created subfolder: {folder_name} in {parent_path}")
#                         last_created_folder = existing
#                     else:
#                         logger.info(f"📁 Subfolder already exists: {folder_name}")
#                         last_created_folder = existing
            
#             result = self.get_item_by_path(path)
#             if result:
#                 return result
#             elif last_created_folder:
#                 return last_created_folder
#             else:
#                 raise Exception(f"Failed to create or find folder: {path}")
                
#         except Exception as e:
#             logger.error(f"Error creating folder: {str(e)}")
#             raise
    
#     def get_item_by_path(self, path: str) -> Optional[Dict[str, Any]]:
#         """Get an item by its path"""
#         try:
#             url = f"{self.base_url}/me/drive/root:/{path}"
#             headers = self._get_headers()
#             response = requests.get(url, headers=headers)
            
#             if response.status_code == 200:
#                 return response.json()
#             elif response.status_code == 404:
#                 return None
#             else:
#                 logger.error(f"Failed to get item: {response.text}")
#                 return None
                
#         except Exception as e:
#             logger.error(f"Error getting item: {str(e)}")
#             return None
    
#     def upload_file(self, content: bytes, file_name: str, folder_path: str = "") -> Dict[str, Any]:
#         """Upload a file to OneDrive"""
#         try:
#             import re
#             clean_file_name = re.sub(r'[^\w\s.-]', '_', file_name)
            
#             if folder_path:
#                 full_path = f"{folder_path}/{clean_file_name}"
#             else:
#                 full_path = clean_file_name
            
#             url = f"{self.base_url}/me/drive/root:/{full_path}:/content"
            
#             headers = self._get_headers()
#             headers["Content-Type"] = "application/octet-stream"
            
#             logger.info(f"Uploading file: {full_path} ({len(content)} bytes)")
#             print(f"📤 Uploading: {full_path}")
            
#             response = requests.put(
#                 url,
#                 headers=headers,
#                 data=content
#             )
            
#             if response.status_code in [200, 201]:
#                 logger.info(f"✅ File uploaded: {full_path}")
#                 print(f"✅ Uploaded: {full_path}")
#                 return response.json()
#             else:
#                 error_msg = f"Failed to upload file: {response.text}"
#                 logger.error(error_msg)
#                 raise Exception(error_msg)
                
#         except Exception as e:
#             logger.error(f"Error uploading file: {str(e)}")
#             raise
    
#     def upload_multiple_files(self, files: List[Dict[str, Any]], folder_path: str) -> List[Dict[str, Any]]:
#         """Upload multiple files to OneDrive"""
#         uploaded_files = []
        
#         for file_info in files:
#             try:
#                 content = file_info.get('content')
#                 file_name = file_info.get('name')
#                 metadata = file_info.get('metadata', {})
                
#                 if not content or not file_name:
#                     logger.error(f"Missing content or name for file: {file_info}")
#                     continue
                
#                 result = self.upload_file(content, file_name, folder_path)
                
#                 uploaded_files.append({
#                     "name": file_name,
#                     "metadata": metadata,
#                     "web_url": result.get('webUrl'),
#                     "download_url": result.get('downloadUrl'),
#                     "id": result.get('id')
#                 })
                
#             except Exception as e:
#                 logger.error(f"Error uploading file {file_info.get('name')}: {str(e)}")
#                 uploaded_files.append({
#                     "name": file_info.get('name'),
#                     "error": str(e),
#                     "uploaded": False
#                 })
        
#         return uploaded_files
    
#     def get_shareable_link(self, path: str) -> str:
#         """Get a shareable link for a file or folder"""
#         try:
#             url = f"{self.base_url}/me/drive/root:/{path}/createLink"
#             data = {
#                 "type": "view",
#                 "scope": "anonymous"
#             }
            
#             headers = self._get_headers()
#             response = requests.post(url, headers=headers, json=data)
            
#             if response.status_code == 200:
#                 link_data = response.json()
#                 link_url = link_data.get("link", {}).get("webUrl", "")
#                 logger.info(f"✅ Created shareable link for: {path}")
#                 return link_url
#             else:
#                 logger.error(f"Failed to create shareable link: {response.text}")
#                 return ""
                
#         except Exception as e:
#             logger.error(f"Error creating shareable link: {str(e)}")
#             return ""
    
#     def list_files(self, folder_path: str = "") -> List[Dict[str, Any]]:
#         """List files in a folder"""
#         try:
#             url = f"{self.base_url}/me/drive/root:/{folder_path}:/children" if folder_path else f"{self.base_url}/me/drive/root/children"
            
#             headers = self._get_headers()
#             response = requests.get(url, headers=headers)
            
#             if response.status_code == 200:
#                 items = response.json().get("value", [])
#                 logger.info(f"✅ Listed {len(items)} items in folder: {folder_path or 'root'}")
#                 return items
#             else:
#                 logger.error(f"Failed to list files: {response.text}")
#                 return []
                
#         except Exception as e:
#             logger.error(f"Error listing files: {str(e)}")
#             return []
    
#     def delete_file(self, path: str) -> bool:
#         """Delete a file or folder from OneDrive"""
#         try:
#             url = f"{self.base_url}/me/drive/root:/{path}"
            
#             headers = self._get_headers()
#             response = requests.delete(url, headers=headers)
            
#             if response.status_code in [200, 204]:
#                 logger.info(f"✅ Deleted: {path}")
#                 return True
#             else:
#                 logger.error(f"Failed to delete: {response.text}")
#                 return False
                
#         except Exception as e:
#             logger.error(f"Error deleting: {str(e)}")
#             return False
    
#     def get_drive_info(self) -> Dict[str, Any]:
#         """Get current drive information"""
#         try:
#             url = f"{self.base_url}/me/drive"
#             headers = self._get_headers()
#             response = requests.get(url, headers=headers)
            
#             if response.status_code == 200:
#                 logger.info("✅ Retrieved drive info")
#                 return response.json()
#             else:
#                 error_msg = f"Failed to get drive info: {response.text}"
#                 logger.error(error_msg)
#                 raise Exception(error_msg)
                
#         except Exception as e:
#             logger.error(f"Error getting drive info: {str(e)}")
#             raise
    
#     def get_file_content(self, path: str) -> bytes:
#         """Download file content from OneDrive"""
#         try:
#             url = f"{self.base_url}/me/drive/root:/{path}/content"
#             headers = self._get_headers()
            
#             response = requests.get(url, headers=headers)
            
#             if response.status_code == 200:
#                 logger.info(f"✅ Downloaded file: {path} ({len(response.content)} bytes)")
#                 return response.content
#             else:
#                 error_msg = f"Failed to download file: {response.text}"
#                 logger.error(error_msg)
#                 raise Exception(error_msg)
                
#         except Exception as e:
#             logger.error(f"Error downloading file: {str(e)}")
#             raise
    
#     def search_files(self, query: str, folder_path: str = "") -> List[Dict[str, Any]]:
#         """Search for files in OneDrive"""
#         try:
#             if folder_path:
#                 url = f"{self.base_url}/me/drive/root:/{folder_path}:/search(q='{query}')"
#             else:
#                 url = f"{self.base_url}/me/drive/root/search(q='{query}')"
            
#             headers = self._get_headers()
#             response = requests.get(url, headers=headers)
            
#             if response.status_code == 200:
#                 items = response.json().get("value", [])
#                 logger.info(f"✅ Found {len(items)} items matching: {query}")
#                 return items
#             else:
#                 logger.error(f"Failed to search files: {response.text}")
#                 return []
                
#         except Exception as e:
#             logger.error(f"Error searching files: {str(e)}")
#             return []
    
#     def get_token_status(self) -> Dict[str, Any]:
#         """Get current token status with auto-refresh if needed"""
#         if not self.user:
#             return {"connected": False, "message": "No user"}
        
#         is_connected = False
#         expires_in = None
#         was_refreshed = False
        
#         # ✅ Check if token exists
#         if self.user.onedrive_access_token and self.user.onedrive_refresh_token:
#             current_time = datetime.utcnow().timestamp()
#             token_expiry = self.user.onedrive_token_expiry or 0
            
#             if token_expiry > current_time:
#                 # Token is valid
#                 is_connected = True
#                 expires_in = token_expiry - current_time
#             else:
#                 # ✅ Token expired - try to refresh automatically
#                 try:
#                     logger.info(f"🔄 Auto-refreshing OneDrive token for {self.user.email}")
#                     refresh_success = self._refresh_token()
                    
#                     if refresh_success:
#                         is_connected = True
#                         was_refreshed = True
#                         if self.user.onedrive_token_expiry:
#                             expires_in = self.user.onedrive_token_expiry - datetime.utcnow().timestamp()
#                         logger.info(f"✅ OneDrive token auto-refreshed for {self.user.email}")
#                     else:
#                         logger.warning(f"❌ Failed to auto-refresh OneDrive token for {self.user.email}")
#                 except Exception as e:
#                     logger.error(f"❌ Auto-refresh error: {e}")
        
#         return {
#             "connected": is_connected,
#             "refreshed": was_refreshed,
#             "expires_in": int(expires_in) if expires_in and expires_in > 0 else 0,
#             "has_refresh_token": bool(self.user.onedrive_refresh_token),
#             "connected_at": self.user.onedrive_connected_at,
#             "email": self.user.onedrive_email,
#             "user_email": self.user.email
#         }

#     def get_user_drive_info(self) -> Dict[str, Any]:
#         """
#         Get drive info for the current user (wrapper for get_drive_info)
#         """
#         return self.get_drive_info()





# backend/app/services/onedrive_service.py
import requests
import msal
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)

MICROSOFT_GRAPH_URL = "https://graph.microsoft.com/v1.0"


class OneDriveService:
    def __init__(self, user: User = None, access_token: str = None, db: Session = None):
        """
        Initialize OneDrive service with user and optional access token
        
        Args:
            user: User object with OneDrive tokens
            access_token: Optional access token (overrides user token)
            db: Database session for token refresh
        """
        self.user = user
        self.db = db
        self.access_token = access_token or (user.onedrive_access_token if user else None)
        self.base_url = MICROSOFT_GRAPH_URL
        
        # Initialize MSAL if we have tenant ID
        self.app = None
        if settings.ONEDRIVE_TENANT_ID:
            try:
                authority = f"https://login.microsoftonline.com/{settings.ONEDRIVE_TENANT_ID}"
                self.app = msal.ConfidentialClientApplication(
                    client_id=settings.ONEDRIVE_CLIENT_ID,
                    client_credential=settings.ONEDRIVE_CLIENT_SECRET,
                    authority=authority
                )
                logger.info(f"OneDrive service initialized with tenant: {settings.ONEDRIVE_TENANT_ID}")
            except Exception as e:
                logger.error(f"Failed to initialize MSAL: {str(e)}")
                self.app = None
        else:
            logger.warning("ONEDRIVE_TENANT_ID not set. OneDrive service will use direct token auth only.")
        
        if not self.access_token:
            logger.warning("OneDrive service initialized without access token")
    
    def _is_token_valid(self, token: str) -> bool:
        """
        Check if a token looks valid.
        Microsoft Graph tokens for personal / some org accounts are OPAQUE strings,
        not standard 3-part JWTs — so we can't require the JWT shape.
        Accept either: a real 3-part JWT, OR a sufficiently long opaque token.
        """
        if not token:
            return False
        parts = token.split('.')
        is_valid = len(parts) == 3 or len(token) > 100
        if not is_valid:
            logger.error(f"❌ Invalid token format! Parts: {len(parts)}, length: {len(token)}")
        return is_valid
    
    def _is_token_expired(self) -> bool:
        """
        Check if token is expired
        
        Returns:
            True if token is expired, False otherwise
        """
        if not self.user or not self.user.onedrive_token_expiry:
            return True
        
        current_time = datetime.utcnow().timestamp()
        expiry_time = self.user.onedrive_token_expiry
        
        if expiry_time < current_time:
            minutes_expired = int((current_time - expiry_time) / 60)
            logger.info(f"Token is expired (expired {minutes_expired} minutes ago)")
            return True
        
        return False
    
    def _refresh_token(self) -> bool:
        """
        Refresh the access token using refresh token
        ✅ FIXED: Properly handles refresh token renewal
        """
        if not self.user or not self.user.onedrive_refresh_token:
            logger.error("No refresh token available")
            print("❌ No refresh token available")
            return False
        
        try:
            tenant_id = settings.ONEDRIVE_TENANT_ID
            token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
            
            token_data = {
                "client_id": settings.ONEDRIVE_CLIENT_ID,
                "client_secret": settings.ONEDRIVE_CLIENT_SECRET,
                "refresh_token": self.user.onedrive_refresh_token,
                "grant_type": "refresh_token"
            }
            
            logger.info("🔄 Attempting to refresh OneDrive token...")
            print(f"🔄 Refreshing OneDrive token for {self.user.email}")
            
            response = requests.post(
                token_url,
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            print(f"📊 Refresh Response Status: {response.status_code}")
            
            if response.status_code != 200:
                logger.error(f"Token refresh failed: {response.text}")
                print(f"❌ Token refresh failed: {response.text[:200]}")
                return False
            
            token_info = response.json()
            new_access_token = token_info.get('access_token')
            new_refresh_token = token_info.get('refresh_token')
            expires_in = token_info.get('expires_in', 3600)
            
            if not new_access_token:
                logger.error("No access token in refresh response")
                return False
            
            if not self._is_token_valid(new_access_token):
                logger.error("❌ New token from refresh is invalid format!")
                return False
            
            # ✅ Update tokens in database
            self.user.onedrive_access_token = new_access_token
            
            if new_refresh_token:
                self.user.onedrive_refresh_token = new_refresh_token
                logger.info("✅ New refresh token received")
            
            new_expiry = datetime.utcnow().timestamp() + expires_in
            self.user.onedrive_token_expiry = new_expiry
            
            if self.db:
                try:
                    self.db.commit()
                    logger.info(f"✅ Tokens refreshed successfully, expires in {expires_in}s")
                    print(f"✅ Token refreshed, new expiry: {datetime.fromtimestamp(new_expiry)}")
                except Exception as e:
                    logger.error(f"Failed to commit token refresh: {str(e)}")
                    self.db.rollback()
                    return False
            
            self.access_token = new_access_token
            logger.info(f"✅ Token refreshed successfully. New token length: {len(new_access_token)}")
            return True
            
        except Exception as e:
            logger.error(f"Error refreshing token: {str(e)}")
            print(f"❌ Refresh error: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def _ensure_valid_token(self) -> bool:
        """
        ✅ CRITICAL: Ensure token is valid - refresh if expired
        Called before EVERY OneDrive API call
        """
        if not self.user:
            print("❌ No user for token validation")
            return False
        
        # Check if token exists
        if not self.user.onedrive_access_token:
            print("❌ No access token available")
            return False
        
        # Check if token is valid format
        if not self._is_token_valid(self.user.onedrive_access_token):
            print("❌ Token format is invalid, attempting refresh...")
            return self._refresh_token()
        
        # ✅ Check if token is expired - refresh if needed
        if self._is_token_expired():
            print(f"🔄 Token expired, refreshing...")
            return self._refresh_token()
        
        # ✅ Check if token is expiring soon (within 5 minutes)
        if self.user.onedrive_token_expiry:
            current_time = datetime.utcnow().timestamp()
            time_until_expiry = self.user.onedrive_token_expiry - current_time
            if time_until_expiry < 300:
                print(f"🔄 Token expiring in {time_until_expiry:.0f} seconds, refreshing proactively...")
                return self._refresh_token()
        
        print(f"✅ Token is valid (expires in {time_until_expiry:.0f} seconds)")
        return True
    
    def _get_valid_token(self) -> Optional[str]:
        """Get a valid access token, refreshing if needed"""
        if not self._ensure_valid_token():
            logger.error("No valid token available")
            return None
        return self.access_token or self.user.onedrive_access_token
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers with valid token - auto-refresh if expired"""
        token = self._get_valid_token()
        if not token:
            raise ValueError("No valid access token available. Please reconnect OneDrive.")
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    
    def check_and_refresh_token(self) -> Dict[str, Any]:
        """Check token status and refresh if needed"""
        if not self.user:
            return {
                "connected": False, 
                "refreshed": False,
                "has_refresh_token": False,
                "has_access_token": False,
                "message": "No user"
            }
        
        result = {
            "connected": False,
            "refreshed": False,
            "has_refresh_token": bool(self.user.onedrive_refresh_token),
            "has_access_token": bool(self.user.onedrive_access_token),
            "token_valid": False,
            "message": ""
        }
        
        if self.user.onedrive_access_token:
            if self._is_token_valid(self.user.onedrive_access_token):
                if self.user.onedrive_token_expiry:
                    current_time = datetime.utcnow().timestamp()
                    if self.user.onedrive_token_expiry > current_time:
                        result["connected"] = True
                        result["token_valid"] = True
                        result["message"] = "Token is valid"
                        return result
                    else:
                        result["message"] = "Token is expired"
                else:
                    result["connected"] = True
                    result["token_valid"] = True
                    result["message"] = "Token exists (no expiry)"
                    return result
            else:
                result["message"] = "Token format is invalid"
        else:
            result["message"] = "No access token"
        
        if self.user.onedrive_refresh_token:
            print(f"🔄 Auto-refreshing OneDrive token for {self.user.email} (check_and_refresh)")
            refresh_success = self._refresh_token()
            
            if refresh_success:
                result["connected"] = True
                result["refreshed"] = True
                result["token_valid"] = True
                result["message"] = "Token refreshed successfully"
                return result
            else:
                result["message"] = "Failed to refresh token"
                return result
        
        result["message"] = "No refresh token available. Please reconnect OneDrive."
        return result
    
    # ============================================================
    # CLIENT FOLDER METHODS
    # ============================================================
    
    def get_client_folder_path(self, client_id: int, client_name: str, client_email: str) -> str:
        """Get the OneDrive folder path for a specific client"""
        if not self.user:
            raise ValueError("No user available for OneDrive operations")
        
        ca_folder = f"EazyTax/CA_{self.user.id}"
        
        try:
            ca_items = self.list_files(ca_folder)
            search_prefix = f"Client_{client_id}_"
            for item in ca_items:
                if 'folder' in item:
                    folder_name = item.get('name', '')
                    if folder_name.startswith(search_prefix):
                        folder_path = f"{ca_folder}/{folder_name}"
                        print(f"✅ Found existing client folder: {folder_path}")
                        return folder_path
        except Exception as e:
            print(f"⚠️ Error searching for existing folder: {e}")
        
        date_suffix = datetime.utcnow().strftime('%Y%m%d')
        client_folder_name = f"Client_{client_id}_{client_name.replace(' ', '_')}_{client_email}_{date_suffix}"
        full_folder_path = f"{ca_folder}/{client_folder_name}"
        
        try:
            self.create_folder(ca_folder)
            self.create_folder(full_folder_path)
            print(f"✅ Created new client folder: {full_folder_path}")
            return full_folder_path
        except Exception as e:
            print(f"❌ Error creating client folder: {e}")
            raise
    
    def list_client_folders(self) -> List[Dict[str, Any]]:
        """List all client folders in OneDrive"""
        if not self.user:
            return []
        
        try:
            ca_folder = f"EazyTax/CA_{self.user.id}"
            items = self.list_files(ca_folder)
            folders = [item for item in items if 'folder' in item]
            return folders
        except Exception as e:
            print(f"📁 CA folder not found or empty: {e}")
            return []
    
    def get_client_documents(self, client_folder_path: str) -> List[Dict[str, Any]]:
        """Get all documents in a client's folder"""
        if not self.user:
            return []
        
        try:
            items = self.list_files(client_folder_path)
            files = [item for item in items if 'folder' not in item]
            return files
        except Exception as e:
            print(f"❌ Error getting client documents: {e}")
            return []
    
    # ============================================================
    # CORE ONEDRIVE METHODS
    # ============================================================
    
    def create_folder(self, path: str) -> Dict[str, Any]:
        """Create a folder in OneDrive with nested path support"""
        try:
            parts = path.split('/')
            current_path = ""
            last_created_folder = None
            
            print(f"📁 Creating folder structure: {path}")
            
            for i, folder_name in enumerate(parts):
                if i == 0:
                    current_path = folder_name
                    existing = self.get_item_by_path(current_path)
                    
                    if not existing:
                        url = f"{self.base_url}/me/drive/root/children"
                        data = {
                            "name": folder_name,
                            "folder": {},
                            "@microsoft.graph.conflictBehavior": "rename"
                        }
                        headers = self._get_headers()
                        response = requests.post(url, headers=headers, json=data)
                        
                        if response.status_code not in [200, 201]:
                            raise Exception(f"Failed to create folder: {folder_name}")
                        
                        existing = response.json()
                        logger.info(f"✅ Created folder: {folder_name}")
                        last_created_folder = existing
                    else:
                        logger.info(f"📁 Folder already exists: {folder_name}")
                        last_created_folder = existing
                else:
                    parent_path = current_path
                    current_path = f"{parent_path}/{folder_name}"
                    existing = self.get_item_by_path(current_path)
                    
                    if not existing:
                        url = f"{self.base_url}/me/drive/root:/{parent_path}:/children"
                        data = {
                            "name": folder_name,
                            "folder": {},
                            "@microsoft.graph.conflictBehavior": "rename"
                        }
                        headers = self._get_headers()
                        response = requests.post(url, headers=headers, json=data)
                        
                        if response.status_code not in [200, 201]:
                            raise Exception(f"Failed to create subfolder: {folder_name}")
                        
                        existing = response.json()
                        logger.info(f"✅ Created subfolder: {folder_name} in {parent_path}")
                        last_created_folder = existing
                    else:
                        logger.info(f"📁 Subfolder already exists: {folder_name}")
                        last_created_folder = existing
            
            result = self.get_item_by_path(path)
            if result:
                return result
            elif last_created_folder:
                return last_created_folder
            else:
                raise Exception(f"Failed to create or find folder: {path}")
                
        except Exception as e:
            logger.error(f"Error creating folder: {str(e)}")
            raise
    
    def get_item_by_path(self, path: str) -> Optional[Dict[str, Any]]:
        """Get an item by its path"""
        try:
            url = f"{self.base_url}/me/drive/root:/{path}"
            headers = self._get_headers()
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 404:
                return None
            else:
                logger.error(f"Failed to get item: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting item: {str(e)}")
            return None
    
    def upload_file(self, content: bytes, file_name: str, folder_path: str = "") -> Dict[str, Any]:
        """Upload a file to OneDrive"""
        try:
            import re
            clean_file_name = re.sub(r'[^\w\s.-]', '_', file_name)
            
            if folder_path:
                full_path = f"{folder_path}/{clean_file_name}"
            else:
                full_path = clean_file_name
            
            url = f"{self.base_url}/me/drive/root:/{full_path}:/content"
            
            headers = self._get_headers()
            headers["Content-Type"] = "application/octet-stream"
            
            logger.info(f"Uploading file: {full_path} ({len(content)} bytes)")
            print(f"📤 Uploading: {full_path}")
            
            response = requests.put(
                url,
                headers=headers,
                data=content
            )
            
            if response.status_code in [200, 201]:
                logger.info(f"✅ File uploaded: {full_path}")
                print(f"✅ Uploaded: {full_path}")
                return response.json()
            else:
                raise Exception(f"Failed to upload file: {response.text}")
                
        except Exception as e:
            logger.error(f"Error uploading file: {str(e)}")
            raise
    
    def list_files(self, folder_path: str = "") -> List[Dict[str, Any]]:
        """List files in a folder"""
        try:
            if folder_path:
                url = f"{self.base_url}/me/drive/root:/{folder_path}:/children"
            else:
                url = f"{self.base_url}/me/drive/root/children"
            
            headers = self._get_headers()
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                items = response.json().get("value", [])
                logger.info(f"✅ Listed {len(items)} items in folder: {folder_path or 'root'}")
                return items
            else:
                logger.error(f"Failed to list files: {response.text}")
                return []
                
        except Exception as e:
            logger.error(f"Error listing files: {str(e)}")
            return []
    
    def delete_file(self, path: str) -> bool:
        """Delete a file or folder from OneDrive"""
        try:
            url = f"{self.base_url}/me/drive/root:/{path}"
            headers = self._get_headers()
            response = requests.delete(url, headers=headers)
            
            if response.status_code in [200, 204]:
                logger.info(f"✅ Deleted: {path}")
                return True
            else:
                logger.error(f"Failed to delete: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error deleting: {str(e)}")
            return False
    
    def get_drive_info(self) -> Dict[str, Any]:
        """Get current drive information"""
        try:
            url = f"{self.base_url}/me/drive"
            headers = self._get_headers()
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                logger.info("✅ Retrieved drive info")
                return response.json()
            else:
                raise Exception(f"Failed to get drive info: {response.text}")
                
        except Exception as e:
            logger.error(f"Error getting drive info: {str(e)}")
            raise
    
    def get_shareable_link(self, path: str) -> str:
        """Get a shareable link for a file or folder"""
        try:
            url = f"{self.base_url}/me/drive/root:/{path}/createLink"
            data = {
                "type": "view",
                "scope": "anonymous"
            }
            
            headers = self._get_headers()
            response = requests.post(url, headers=headers, json=data)
            
            if response.status_code == 200:
                link_data = response.json()
                link_url = link_data.get("link", {}).get("webUrl", "")
                logger.info(f"✅ Created shareable link for: {path}")
                return link_url
            else:
                logger.error(f"Failed to create shareable link: {response.text}")
                return ""
                
        except Exception as e:
            logger.error(f"Error creating shareable link: {str(e)}")
            return ""
    
    def get_token_status(self) -> Dict[str, Any]:
        """Get current token status with auto-refresh if needed"""
        if not self.user:
            return {"connected": False, "message": "No user"}
        
        is_connected = False
        expires_in = None
        was_refreshed = False
        
        if self.user.onedrive_access_token and self.user.onedrive_refresh_token:
            current_time = datetime.utcnow().timestamp()
            token_expiry = self.user.onedrive_token_expiry or 0
            
            if token_expiry > current_time:
                is_connected = True
                expires_in = token_expiry - current_time
            else:
                try:
                    logger.info(f"🔄 Auto-refreshing OneDrive token for {self.user.email}")
                    refresh_success = self._refresh_token()
                    
                    if refresh_success:
                        is_connected = True
                        was_refreshed = True
                        if self.user.onedrive_token_expiry:
                            expires_in = self.user.onedrive_token_expiry - datetime.utcnow().timestamp()
                        logger.info(f"✅ OneDrive token auto-refreshed for {self.user.email}")
                    else:
                        logger.warning(f"❌ Failed to auto-refresh OneDrive token for {self.user.email}")
                except Exception as e:
                    logger.error(f"❌ Auto-refresh error: {e}")
        
        return {
            "connected": is_connected,
            "refreshed": was_refreshed,
            "expires_in": int(expires_in) if expires_in and expires_in > 0 else 0,
            "has_refresh_token": bool(self.user.onedrive_refresh_token),
            "connected_at": self.user.onedrive_connected_at,
            "email": self.user.onedrive_email,
            "user_email": self.user.email
        }