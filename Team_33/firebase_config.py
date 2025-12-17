#!/usr/bin/env python3
"""
Firebase Configuration and Database Management
Handles caching of scraped privacy policies and summaries
"""

import firebase_admin
from firebase_admin import credentials, db
import os
import json
from typing import Dict, Optional

# ============================================================================
# FIREBASE CONFIGURATION
# ============================================================================

# Firebase configuration dictionary
# IMPORTANT: Replace these placeholder values with your actual Firebase credentials

FIREBASE_CONFIG = {
    "apiKey": os.getenv("FIREBASE_API_KEY", "YOUR_API_KEY_HERE"),
    "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN", "your-project.firebaseapp.com"),
    "databaseURL": os.getenv("FIREBASE_DATABASE_URL", "https://your-project.firebaseio.com"),
    "projectId": os.getenv("FIREBASE_PROJECT_ID", "your-project-id"),
    "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET", "your-project.appspot.com"),
    "messagingSenderId": os.getenv("FIREBASE_MESSAGING_SENDER_ID", "1234567890"),
    "appId": os.getenv("FIREBASE_APP_ID", "1:1234567890:web:abcdef1234567890")
}


# Service account key file path (for server-side authentication)
SERVICE_ACCOUNT_KEY_FILE = os.getenv(
    "FIREBASE_SERVICE_ACCOUNT_FILE",
    "serviceAccountKey.json"
)

# ============================================================================
# FIREBASE KEY ENCODING (Handle dots in package names)
# ============================================================================

def encode_package_name(package_name: str) -> str:
    """
    Encode package name for Firebase (replace dots with underscores)
    Firebase RTDB doesn't allow dots in keys
    """
    return package_name.replace(".", "_")

def decode_package_name(encoded_name: str) -> str:
    """Decode Firebase-safe package name back to original"""
    return encoded_name.replace("_", ".")

# ============================================================================
# FIREBASE INITIALIZATION
# ============================================================================

class FirebaseDatabase:
    """Manages Firebase Realtime Database connections and operations"""
    
    def __init__(self, use_service_account=True):
        """
        Initialize Firebase connection
        
        Args:
            use_service_account: If True, uses service account file for authentication
                               If False, uses REST API with API key
        """
        self.db = None
        self.initialized = False
        self.use_service_account = use_service_account
        
        try:
            self._initialize_firebase()
        except Exception as e:
            print(f"[FIREBASE] Warning: Firebase initialization failed: {str(e)}")
            print("[FIREBASE] Caching will be disabled. Set up Firebase for production use.")
            self.initialized = False
    
    def _initialize_firebase(self):
        """Initialize Firebase with service account or REST API"""
        
        if self.use_service_account and os.path.exists(SERVICE_ACCOUNT_KEY_FILE):
            # Server-side authentication with service account
            print(f"[FIREBASE] Initializing with service account: {SERVICE_ACCOUNT_KEY_FILE}")
            
            cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_FILE)
            firebase_admin.initialize_app(cred, {
                'databaseURL': FIREBASE_CONFIG['databaseURL']
            })
            
            self.db = db.reference()
            self.initialized = True
            print("[FIREBASE] ✓ Connected to Firebase Realtime Database (Service Account)")
        
        else:
            # REST API authentication with API key
            print("[FIREBASE] Service account file not found. Using REST API (limited access).")
            print("[FIREBASE] For production, set FIREBASE_SERVICE_ACCOUNT_FILE env variable.")
            self.initialized = False
    
    def check_connection(self) -> bool:
        """Check if Firebase is properly initialized"""
        return self.initialized
    
    def get_cached_policy(self, package_name: str) -> Optional[Dict]:
        """
        Retrieve cached privacy policy and summary from Firebase
        
        Args:
            package_name: Android package name (e.g., 'com.bt.bms')
        
        Returns:
            Dictionary with 'policy' and 'summary' if found, None otherwise
        """
        if not self.initialized:
            return None
        
        try:
            # Encode package name (replace dots with underscores for Firebase compatibility)
            encoded_name = encode_package_name(package_name)
            ref = db.reference(f'policies/{encoded_name}')
            data = ref.get()
            
            if data:
                print(f"[FIREBASE] ✓ Found cached policy for: {package_name}")
                return {
                    'policy': data.get('policy'),
                    'summary': data.get('summary'),
                    'cached_at': data.get('cached_at'),
                    'source_url': data.get('source_url')
                }
            
            print(f"[FIREBASE] No cached policy found for: {package_name}")
            return None
        
        except Exception as e:
            print(f"[FIREBASE] Error retrieving cached policy: {str(e)}")
            return None
    
    def save_policy(self, package_name: str, policy_content: str, 
                   summary: str, source_url: str) -> bool:
        """
        Save privacy policy and summary to Firebase
        
        Args:
            package_name: Android package name
            policy_content: Full cleaned privacy policy text
            summary: Final compressed summary
            source_url: URL where policy was scraped from
        
        Returns:
            True if save successful, False otherwise
        """
        if not self.initialized:
            print("[FIREBASE] Firebase not initialized. Skipping cache save.")
            return False
        
        try:
            import time
            
            data = {
                'package_name': package_name,
                'policy': policy_content,
                'summary': summary,
                'source_url': source_url,
                'cached_at': int(time.time()),
                'policy_length': len(policy_content),
                'policy_words': len(policy_content.split()),
                'summary_length': len(summary),
                'summary_words': len(summary.split()),
                'compression_ratio': len(summary) / len(policy_content) if policy_content else 0
            }
            
            # Encode package name (replace dots with underscores for Firebase compatibility)
            encoded_name = encode_package_name(package_name)
            ref = db.reference(f'policies/{encoded_name}')
            ref.set(data)
            
            print(f"[FIREBASE] ✓ Saved policy for {package_name}")
            print(f"[FIREBASE]   - Policy: {data['policy_words']} words")
            print(f"[FIREBASE]   - Summary: {data['summary_words']} words")
            print(f"[FIREBASE]   - Compression: {data['compression_ratio']:.2%}")
            
            return True
        
        except Exception as e:
            print(f"[FIREBASE] Error saving policy: {str(e)}")
            return False
    
    def delete_policy(self, package_name: str) -> bool:
        """
        Delete a cached policy from Firebase
        
        Args:
            package_name: Android package name
        
        Returns:
            True if delete successful, False otherwise
        """
        if not self.initialized:
            return False
        
        try:
            # Encode package name (replace dots with underscores for Firebase compatibility)
            encoded_name = encode_package_name(package_name)
            ref = db.reference(f'policies/{encoded_name}')
            ref.delete()
            print(f"[FIREBASE] ✓ Deleted policy for: {package_name}")
            return True
        
        except Exception as e:
            print(f"[FIREBASE] Error deleting policy: {str(e)}")
            return False
    
    def list_cached_policies(self) -> Optional[Dict]:
        """
        List all cached policies metadata
        
        Returns:
            Dictionary with all package names and metadata
        """
        if not self.initialized:
            return None
        
        try:
            ref = db.reference('policies')
            data = ref.get()
            
            if data:
                metadata = {}
                for package_name, policy_data in data.items():
                    metadata[package_name] = {
                        'cached_at': policy_data.get('cached_at'),
                        'policy_words': policy_data.get('policy_words'),
                        'summary_words': policy_data.get('summary_words'),
                        'source_url': policy_data.get('source_url')
                    }
                
                print(f"[FIREBASE] Found {len(metadata)} cached policies")
                return metadata
            
            return {}
        
        except Exception as e:
            print(f"[FIREBASE] Error listing policies: {str(e)}")
            return None
    
    def get_cache_stats(self) -> Optional[Dict]:
        """
        Get statistics about cached policies
        
        Returns:
            Dictionary with cache statistics
        """
        if not self.initialized:
            return None
        
        try:
            policies = self.list_cached_policies()
            
            if not policies:
                return {
                    'total_cached': 0,
                    'total_policy_words': 0,
                    'total_summary_words': 0,
                    'avg_compression': 0
                }
            
            stats = {
                'total_cached': len(policies),
                'total_policy_words': sum(p.get('policy_words', 0) for p in policies.values()),
                'total_summary_words': sum(p.get('summary_words', 0) for p in policies.values()),
                'packages': list(policies.keys())
            }
            
            if stats['total_policy_words'] > 0:
                stats['avg_compression'] = stats['total_summary_words'] / stats['total_policy_words']
            
            return stats
        
        except Exception as e:
            print(f"[FIREBASE] Error getting cache stats: {str(e)}")
            return None


# ============================================================================
# GLOBAL FIREBASE INSTANCE
# ============================================================================

# Initialize Firebase database instance
firebase_db = None

def initialize_firebase():
    """Initialize Firebase database on startup"""
    global firebase_db
    try:
        firebase_db = FirebaseDatabase(use_service_account=True)
        return firebase_db
    except Exception as e:
        print(f"[FIREBASE] Failed to initialize: {str(e)}")
        return None


def get_firebase_db() -> Optional[FirebaseDatabase]:
    """Get Firebase database instance"""
    global firebase_db
    if firebase_db is None:
        initialize_firebase()
    return firebase_db


# ============================================================================
# HELPER FUNCTIONS FOR SERVER
# ============================================================================

def check_cache(package_name: str) -> Optional[Dict]:
    """
    Check if policy exists in cache
    
    Args:
        package_name: Android package name
    
    Returns:
        Cached data if found, None otherwise
    """
    db_instance = get_firebase_db()
    if db_instance and db_instance.check_connection():
        return db_instance.get_cached_policy(package_name)
    return None


def save_to_cache(package_name: str, policy: str, summary: str, url: str) -> bool:
    """
    Save policy and summary to cache
    
    Args:
        package_name: Android package name
        policy: Full privacy policy text
        summary: Final summary
        url: Source URL
    
    Returns:
        True if saved successfully
    """
    db_instance = get_firebase_db()
    if db_instance and db_instance.check_connection():
        return db_instance.save_policy(package_name, policy, summary, url)
    return False
