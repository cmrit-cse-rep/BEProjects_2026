# create_db.py
"""
Run this before starting the server in production to ensure all
database tables (users, game_sessions, progress_data, ai_insights, etc.)
are created.

On Railway, set the start command to:

    python create_db.py && gunicorn -b 0.0.0.0:8080 app:app
"""

from app import app          # Flask app with db.init_app(app) already called
from models import db        # SQLAlchemy instance used by your models


def main():
    with app.app_context():
        try:
            db.create_all()
            print("✅ Database tables created successfully.")
        except Exception as e:
            print("❌ Error creating database tables:")
            print(e)


if __name__ == "__main__":
    main()
