# launch_game.py - Helper script to launch games with proper configuration

import sys
import json
import subprocess
from game_config import GameConfig

def launch_game(game_script, user_id):
    """Launch a pygame game with proper user configuration"""
    
    # Save user configuration
    config = GameConfig()
    config.save_config(user_id)
    
    print(f"Launching {game_script} for user {user_id}")
    
    # Launch the game
    subprocess.Popen([sys.executable, game_script])

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python launch_game.py <game_script> <user_id>")
        sys.exit(1)
    
    game_script = sys.argv[1]
    user_id = int(sys.argv[2])
    
    launch_game(game_script, user_id)
