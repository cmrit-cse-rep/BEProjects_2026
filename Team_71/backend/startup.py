"""
Startup script for automatic database initialization
This runs automatically when the container starts
"""

import os
import sys
import time
from database import SessionLocal, User, init_db
from populate_database import populate_users, populate_activities

def wait_for_database(max_retries=30, delay=2):
    """Wait for database to be ready"""
    print("Waiting for database to be ready...")
    for i in range(max_retries):
        try:
            db = SessionLocal()
            db.execute("SELECT 1")
            db.close()
            print("✅ Database is ready!")
            return True
        except Exception as e:
            if i < max_retries - 1:
                print(f"⏳ Database not ready yet (attempt {i+1}/{max_retries})...")
                time.sleep(delay)
            else:
                print(f"❌ Database connection failed after {max_retries} attempts: {e}")
                return False
    return False

def initialize_database():
    """Initialize database schema and populate if empty"""
    print("=" * 60)
    print("Initializing SentinelIQ Database")
    print("=" * 60)
    
    # Wait for database
    if not wait_for_database():
        print("⚠️  Warning: Database not ready, but continuing...")
    
    try:
        # Initialize schema
        print("\n📊 Creating database tables...")
        try:
            init_db()
            print("✅ Database tables created successfully")
        except Exception as e:
            print(f"⚠️  Warning: Table creation: {e} (may already exist)")
        
        # Check if database is empty
        db = SessionLocal()
        try:
            user_count = db.query(User).count()
            print(f"\n📈 Current user count: {user_count}")
            
            if user_count == 0:
                print("\n🌱 Database is empty, populating with demo data...")
                print("-" * 60)
                
                try:
                    # Populate users
                    populate_users()
                    
                    # Populate activities
                    populate_activities()
                    
                    print("-" * 60)
                    print("✅ Database population complete!")
                    
                    # Verify
                    final_count = db.query(User).count()
                    print(f"📊 Total users in database: {final_count}")
                except Exception as e:
                    print(f"⚠️  Warning: Error populating data: {e}")
                    import traceback
                    traceback.print_exc()
            else:
                print(f"✅ Database already has {user_count} users, skipping population")
        finally:
            db.close()
            
        print("=" * 60)
        print("✅ Database initialization complete!")
        print("=" * 60)
        return True
        
    except Exception as e:
        print(f"❌ Error during database initialization: {e}")
        import traceback
        traceback.print_exc()
        # Don't fail startup - let the app try to run anyway
        print("⚠️  Continuing with server startup despite initialization errors...")
        return False

if __name__ == "__main__":
    success = initialize_database()
    sys.exit(0 if success else 1)

