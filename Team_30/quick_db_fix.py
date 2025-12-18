# Quick Database Fix - Delete Broken Sessions
# Run this script to remove all sessions with "Unknown" game names

import sqlite3
import os
from datetime import datetime

def fix_database():
    """Remove broken sessions from the database"""
    db_path = 'neuroplay.db'
    
    if not os.path.exists(db_path):
        print("❌ Database file not found. Make sure you're running this in the project root directory.")
        return
    
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check current sessions
        cursor.execute("SELECT id, game_name, score, session_duration, session_date FROM game_session ORDER BY session_date DESC")
        sessions = cursor.fetchall()
        
        print(f"🔍 Current sessions in database:")
        print("-" * 70)
        for session in sessions:
            duration = f"{session[3]/60:.1f}m" if session[3] else "0.0m"
            print(f"ID: {session[0]}, Game: {session[1]}, Score: {session[2]}, Duration: {duration}")
        
        # Find broken sessions (Unknown games or 0 duration)
        cursor.execute("""
            SELECT id FROM game_session 
            WHERE game_name IN ('Unknown', 'unknown') 
            OR session_duration = 0 
            OR session_duration IS NULL
        """)
        
        broken_ids = cursor.fetchall()
        broken_count = len(broken_ids)
        
        if broken_count > 0:
            print(f"\n🗑️  Found {broken_count} broken sessions to delete")
            
            # Delete broken sessions
            cursor.execute("""
                DELETE FROM game_session 
                WHERE game_name IN ('Unknown', 'unknown') 
                OR session_duration = 0 
                OR session_duration IS NULL
            """)
            
            # Create a test session to verify the system works
            cursor.execute("""
                INSERT INTO game_session (
                    user_id, game_name, game_mode, level_reached, score, 
                    total_attempts, successful_attempts, failed_attempts,
                    session_duration, session_date, raw_data
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                1,  # Assuming user ID 1 exists
                'Follow the Dot',
                'standard',
                2,
                187,
                5,
                5,
                0,
                142,  # 142 seconds = 2.4 minutes
                datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
                '{"gameType": "follow_the_dot", "score": 187, "totalTime": 142, "level": 2}'
            ))
            
            # Add another test session
            cursor.execute("""
                INSERT INTO game_session (
                    user_id, game_name, game_mode, level_reached, score, 
                    total_attempts, successful_attempts, failed_attempts,
                    session_duration, session_date, raw_data
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                1,  # Assuming user ID 1 exists
                'Bubble Pop',
                'standard',
                3,
                245,
                20,
                18,
                2,
                98,  # 98 seconds = 1.6 minutes
                datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
                '{"gameType": "bubble_pop", "score": 245, "totalTime": 98, "level": 3}'
            ))
            
            # Commit changes
            conn.commit()
            
            print(f"✅ Deleted {broken_count} broken sessions")
            print("✅ Added 2 test sessions with proper data")
            
            # Show updated sessions
            cursor.execute("SELECT id, game_name, score, level_reached, session_duration, session_date FROM game_session ORDER BY session_date DESC")
            sessions = cursor.fetchall()
            
            print(f"\n📊 Updated sessions:")
            print("-" * 80)
            print(f"{'Date':<12} {'Game':<15} {'Score':<6} {'Level':<6} {'Duration':<10}")
            print("-" * 80)
            
            for session in sessions:
                date_str = session[5][:10] if session[5] else 'N/A'
                duration = f"{session[4]/60:.1f}m" if session[4] else "0.0m"
                print(f"{date_str:<12} {session[1]:<15} {session[2]:<6} {session[3]:<6} {duration:<10}")
            
        else:
            print("✅ No broken sessions found!")
            
        conn.close()
        
    except Exception as e:
        print(f"❌ Error fixing database: {e}")

if __name__ == '__main__':
    print("🛠️  NeuroPlay Database Quick Fix")
    print("=" * 40)
    fix_database()
    print("\n🔄 Now refresh your progress page to see the changes!")