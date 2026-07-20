# app/services/onedrive_service.py
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
        Check if a token is a valid JWT format
        
        Args:
            token: The token to validate
            
        Returns:
            True if token is valid JWT format, False otherwise
        """
        if not token:
            return False
        
        parts = token.split('.')
        is_valid = len(parts) == 3
        
        if not is_valid:
            logger.error(f"❌ Invalid token format! Token parts: {len(parts)}")
            logger.error(f"Token starts with: {token[:50]}...")
        
        return is_valid
    
    def _refresh_token_if_needed(self) -> bool:
        """
        Refresh the access token if it's expired or about to expire
        
        Returns:
            True if token is valid after refresh, False otherwise
        """
        if not self.user:
            return False
        
        # First check if the current token is valid JWT format
        if self.access_token and not self._is_token_valid(self.access_token):
            logger.warning("Token is not valid JWT format, attempting refresh...")
            return self._refresh_token()
        
        # Check if token is expired or will expire in next 5 minutes
        if self.user.onedrive_token_expiry:
            current_time = datetime.utcnow().timestamp()
            # Refresh if token expires in less than 5 minutes
            if self.user.onedrive_token_expiry - current_time < 300:
                logger.info("Token is expired or about to expire, refreshing...")
                return self._refresh_token()
        
        return True
    
    def _refresh_token(self) -> bool:
        """
        Refresh the access token using refresh token
        
        Returns:
            True if refresh successful, False otherwise
        """
        if not self.user or not self.user.onedrive_refresh_token:
            logger.error("No refresh token available")
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
            
            logger.info("Attempting to refresh OneDrive token...")
            
            response = requests.post(
                token_url,
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code != 200:
                logger.error(f"Token refresh failed with status {response.status_code}: {response.text}")
                return False
            
            token_info = response.json()
            new_access_token = token_info.get('access_token')
            
            # ✅ Validate the new token format
            if not self._is_token_valid(new_access_token):
                logger.error("❌ New token from refresh is invalid format!")
                return False
            
            # Update tokens in database
            self.user.onedrive_access_token = new_access_token
            if token_info.get('refresh_token'):
                self.user.onedrive_refresh_token = token_info['refresh_token']
            expires_in = token_info.get('expires_in', 3600)
            self.user.onedrive_token_expiry = datetime.utcnow().timestamp() + expires_in
            
            if self.db:
                try:
                    self.db.commit()
                    logger.info("✅ Tokens updated in database")
                except Exception as e:
                    logger.error(f"Failed to commit token refresh to database: {str(e)}")
                    self.db.rollback()
                    return False
            
            # Update local access token
            self.access_token = new_access_token
            logger.info(f"✅ Token refreshed successfully. New token length: {len(new_access_token)}")
            return True
            
        except Exception as e:
            logger.error(f"Error refreshing token: {str(e)}")
            return False
    
    def _get_valid_token(self) -> Optional[str]:
        """
        Get a valid access token, refreshing if needed
        
        Returns:
            Valid access token or None if no valid token available
        """
        if not self.access_token:
            logger.error("No access token available")
            return None
        
        # ✅ Validate token format
        if not self._is_token_valid(self.access_token):
            logger.warning("Token is not valid JWT format")
            
            # Try to refresh the token
            if self.user and self.user.onedrive_refresh_token:
                logger.info("Attempting to refresh token due to invalid format...")
                if self._refresh_token():
                    # After refresh, validate again
                    if self.access_token and self._is_token_valid(self.access_token):
                        return self.access_token
                    else:
                        logger.error("❌ Refreshed token is still invalid!")
                        return None
            return None
        
        # Try to refresh if needed (expired or about to expire)
        if self.user:
            self._refresh_token_if_needed()
            # Update access_token from user object if it was refreshed
            if self.user.onedrive_access_token:
                self.access_token = self.user.onedrive_access_token
                # Validate again after potential refresh
                if not self._is_token_valid(self.access_token):
                    logger.error("❌ Token became invalid after refresh attempt")
                    return None
        
        # Final validation
        if self.access_token and self._is_token_valid(self.access_token):
            return self.access_token
        else:
            logger.error("❌ No valid token available after all attempts")
            return None
    
    def _get_headers(self) -> Dict[str, str]:
        """
        Get headers with valid token
        
        Returns:
            Headers dict with Authorization bearer token
        
        Raises:
            ValueError: If no valid access token available
        """
        token = self._get_valid_token()
        if not token:
            raise ValueError("No valid access token available. Please reconnect OneDrive.")
        
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    
    def create_folder(self, path: str) -> Dict[str, Any]:
        """
        Create a folder in OneDrive
        
        Args:
            path: Folder path (e.g., "EazyTax/CA_1/Client_2")
            
        Returns:
            Folder metadata from Microsoft Graph
            
        Raises:
            Exception: If folder creation fails
        """
        try:
            # Split path into parts
            parts = path.split('/')
            folder_name = parts[-1]
            parent_path = '/'.join(parts[:-1]) if len(parts) > 1 else ""
            
            # Check if folder exists first
            existing = self.get_item_by_path(path)
            if existing:
                logger.info(f"Folder already exists: {path}")
                return existing
            
            # Create the folder
            url = f"{self.base_url}/me/drive/root"
            if parent_path:
                url = f"{self.base_url}/me/drive/root:/{parent_path}:/children"
            else:
                url = f"{self.base_url}/me/drive/root/children"
            
            data = {
                "name": folder_name,
                "folder": {},
                "@microsoft.graph.conflictBehavior": "rename"
            }
            
            headers = self._get_headers()
            response = requests.post(
                url,
                headers=headers,
                json=data
            )
            
            if response.status_code in [200, 201]:
                logger.info(f"✅ Folder created: {path}")
                return response.json()
            else:
                error_msg = f"Failed to create folder: {response.text}"
                logger.error(error_msg)
                raise Exception(error_msg)
                
        except Exception as e:
            logger.error(f"Error creating folder: {str(e)}")
            raise
    
    def get_item_by_path(self, path: str) -> Optional[Dict[str, Any]]:
        """
        Get an item by its path
        
        Args:
            path: Path to the item
            
        Returns:
            Item metadata or None if not found
        """
        try:
            url = f"{self.base_url}/me/drive/root:/{path}"
            headers = self._get_headers()
            response = requests.get(
                url,
                headers=headers
            )
            
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
        """
        Upload a file to OneDrive
        
        Args:
            content: File content as bytes
            file_name: Name of the file
            folder_path: Optional folder path
            
        Returns:
            Uploaded file metadata
            
        Raises:
            Exception: If upload fails
        """
        try:
            full_path = f"{folder_path}/{file_name}" if folder_path else file_name
            url = f"{self.base_url}/me/drive/root:/{full_path}:/content"
            
            headers = self._get_headers()
            headers["Content-Type"] = "application/octet-stream"
            
            logger.info(f"Uploading file: {full_path} ({len(content)} bytes)")
            
            response = requests.put(
                url,
                headers=headers,
                data=content
            )
            
            if response.status_code in [200, 201]:
                logger.info(f"✅ File uploaded: {full_path}")
                return response.json()
            else:
                error_msg = f"Failed to upload file: {response.text}"
                logger.error(error_msg)
                raise Exception(error_msg)
                
        except Exception as e:
            logger.error(f"Error uploading file: {str(e)}")
            raise
    
    def get_shareable_link(self, path: str) -> str:
        """
        Get a shareable link for a file or folder
        
        Args:
            path: Path to the item
            
        Returns:
            Shareable link URL or empty string if failed
        """
        try:
            url = f"{self.base_url}/me/drive/root:/{path}/createLink"
            data = {
                "type": "view",
                "scope": "anonymous"
            }
            
            headers = self._get_headers()
            response = requests.post(
                url,
                headers=headers,
                json=data
            )
            
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
    
    def list_files(self, folder_path: str = "") -> List[Dict[str, Any]]:
        """
        List files in a folder
        
        Args:
            folder_path: Path to the folder (empty for root)
            
        Returns:
            List of file/folder metadata
        """
        try:
            url = f"{self.base_url}/me/drive/root:/{folder_path}:/children" if folder_path else f"{self.base_url}/me/drive/root/children"
            
            headers = self._get_headers()
            response = requests.get(
                url,
                headers=headers
            )
            
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
        """
        Delete a file or folder from OneDrive
        
        Args:
            path: Path to the item
            
        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            url = f"{self.base_url}/me/drive/root:/{path}"
            
            headers = self._get_headers()
            response = requests.delete(
                url,
                headers=headers
            )
            
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
        """
        Get current drive information
        
        Returns:
            Drive metadata
            
        Raises:
            Exception: If request fails
        """
        try:
            url = f"{self.base_url}/me/drive"
            headers = self._get_headers()
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                logger.info("✅ Retrieved drive info")
                return response.json()
            else:
                error_msg = f"Failed to get drive info: {response.text}"
                logger.error(error_msg)
                raise Exception(error_msg)
                
        except Exception as e:
            logger.error(f"Error getting drive info: {str(e)}")
            raise
    
    def get_file_content(self, path: str) -> bytes:
        """
        Download file content from OneDrive
        
        Args:
            path: Path to the file
            
        Returns:
            File content as bytes
            
        Raises:
            Exception: If download fails
        """
        try:
            url = f"{self.base_url}/me/drive/root:/{path}/content"
            headers = self._get_headers()
            
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                logger.info(f"✅ Downloaded file: {path} ({len(response.content)} bytes)")
                return response.content
            else:
                error_msg = f"Failed to download file: {response.text}"
                logger.error(error_msg)
                raise Exception(error_msg)
                
        except Exception as e:
            logger.error(f"Error downloading file: {str(e)}")
            raise
    
    def search_files(self, query: str, folder_path: str = "") -> List[Dict[str, Any]]:
        """
        Search for files in OneDrive
        
        Args:
            query: Search query
            folder_path: Optional folder to search in
            
        Returns:
            List of matching files
        """
        try:
            if folder_path:
                url = f"{self.base_url}/me/drive/root:/{folder_path}:/search(q='{query}')"
            else:
                url = f"{self.base_url}/me/drive/root/search(q='{query}')"
            
            headers = self._get_headers()
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                items = response.json().get("value", [])
                logger.info(f"✅ Found {len(items)} items matching: {query}")
                return items
            else:
                logger.error(f"Failed to search files: {response.text}")
                return []
                
        except Exception as e:
            logger.error(f"Error searching files: {str(e)}")
            return []