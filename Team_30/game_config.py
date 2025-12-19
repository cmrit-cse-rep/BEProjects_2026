# game_config.py - Configuration for game-to-web integration

import os
import json

class GameConfig:
    """Configuration manager for pygame games"""
    
    def __init__(self):
        self.config_file = 'game_session_config.json'
        self.load_config()
    
    def load_config(self):
        """Load configuration from file"""
        try:
            if os.path.exists(self.config_file):
                with open(self.config_file, 'r') as f:
                    config = json.load(f)
                    self.user_id = config.get('user_id', 1)
                    self.api_url = config.get('api_url', 'http://localhost:5000/api')
            else:
                self.user_id = 1
                self.api_url = 'http://localhost:5000/api'
        except Exception as e:
            print(f"Error loading config: {e}")
            self.user_id = 1
            self.api_url = 'http://localhost:5000/api'
    
    def save_config(self, user_id, api_url='http://localhost:5000/api'):
        """Save configuration to file"""
        try:
            with open(self.config_file, 'w') as f:
                json.dump({
                    'user_id': user_id,
                    'api_url': api_url
                }, f)
        except Exception as e:
            print(f"Error saving config: {e}")
    def get_user_id(self):
        """Return the current user id"""
        return getattr(self, "user_id", 1)

    def get_api_url(self):
        """Return the API base URL"""
        return getattr(self, "api_url", "http://localhost:5000/api")


# Global config instance
game_config = GameConfig()
