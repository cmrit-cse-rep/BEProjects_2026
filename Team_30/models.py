# Database Models (models.py)
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime, timedelta
import json

db = SQLAlchemy()

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    name = db.Column(db.String(1000), nullable=False)
    child_name = db.Column(db.String(100), nullable=True)
    child_age = db.Column(db.Integer, nullable=True)
    user_type = db.Column(db.String(20), default='parent')  # parent, therapist, child
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    game_sessions = db.relationship('GameSession', backref='user', lazy=True, cascade='all, delete-orphan')
    progress_data = db.relationship('ProgressData', backref='user', lazy=True, cascade='all, delete-orphan')
    ai_insights = db.relationship('AIInsight', backref='user', lazy=True, cascade='all, delete-orphan')

class GameSession(db.Model):
    __tablename__ = 'game_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    game_name = db.Column(db.String(100), nullable=False)  # 'follow_dot', 'bubble_pop'
    game_mode = db.Column(db.String(50), nullable=False)   # 'timed', 'free', 'easy', 'medium', 'hard'
    level_reached = db.Column(db.Integer, default=1)
    score = db.Column(db.Integer, default=0)
    total_attempts = db.Column(db.Integer, default=0)
    successful_attempts = db.Column(db.Integer, default=0)
    failed_attempts = db.Column(db.Integer, default=0)
    left_hand_usage = db.Column(db.Integer, default=0)
    right_hand_usage = db.Column(db.Integer, default=0)
    session_duration = db.Column(db.Float, default=0.0)  # in seconds
    session_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Advanced tracking data
    average_reaction_time = db.Column(db.Float, nullable=True)
    hand_coordination_score = db.Column(db.Float, nullable=True)
    movement_smoothness = db.Column(db.Float, nullable=True)
    accuracy_percentage = db.Column(db.Float, nullable=True)
    
    # Raw session data for detailed analysis
    raw_data = db.Column(db.Text, nullable=True)  # JSON string of detailed game data

class ProgressData(db.Model):
    __tablename__ = 'progress_data'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Motor Skills Assessments
    motor_skills_score = db.Column(db.Float, default=0.0)
    cognitive_skills_score = db.Column(db.Float, default=0.0)
    hand_eye_coordination = db.Column(db.Float, default=0.0)
    reaction_time = db.Column(db.Float, default=0.0)
    fine_motor_score = db.Column(db.Float, default=0.0)
    gross_motor_score = db.Column(db.Float, default=0.0)
    
    # Cognitive Skills Assessments
    attention_score = db.Column(db.Float, default=0.0)
    memory_score = db.Column(db.Float, default=0.0)
    executive_function_score = db.Column(db.Float, default=0.0)
    processing_speed_score = db.Column(db.Float, default=0.0)
    
    # Overall Development Metrics
    overall_development_score = db.Column(db.Float, default=0.0)
    improvement_rate = db.Column(db.Float, default=0.0)
    consistency_score = db.Column(db.Float, default=0.0)
    assessment_date = db.Column(db.DateTime, default=datetime.utcnow)

class AIInsight(db.Model):
    __tablename__ = 'ai_insights'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # AI Analysis Results
    insight_type = db.Column(db.String(50), nullable=False)  # 'weekly', 'monthly', 'session_specific'
    motor_analysis = db.Column(db.Text, nullable=True)  # JSON string of motor skill insights
    cognitive_analysis = db.Column(db.Text, nullable=True)  # JSON string of cognitive insights
    recommendations = db.Column(db.Text, nullable=True)  # JSON string of AI recommendations
    improvement_areas = db.Column(db.Text, nullable=True)  # JSON string of areas needing attention
    strengths = db.Column(db.Text, nullable=True)  # JSON string of identified strengths
    
    # Risk and Progress Indicators
    progress_trajectory = db.Column(db.String(20), nullable=True)  # 'improving', 'stable', 'declining'
    attention_risk_score = db.Column(db.Float, default=0.0)
    motor_risk_score = db.Column(db.Float, default=0.0)
    overall_development_risk = db.Column(db.Float, default=0.0)
    generated_date = db.Column(db.DateTime, default=datetime.utcnow)
    confidence_score = db.Column(db.Float, default=0.0)

# Utility functions for data access
def get_user_sessions(user_id, days=30):
    """Get user sessions for the last N days"""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    return GameSession.query.filter(
        GameSession.user_id == user_id,
        GameSession.session_date >= cutoff_date
    ).order_by(GameSession.session_date.asc()).all()

def get_user_progress_trend(user_id, skill_type='overall'):
    """Get progress trend for a specific skill"""
    if skill_type == 'motor':
        progress = db.session.query(ProgressData.assessment_date, ProgressData.motor_skills_score).filter_by(user_id=user_id).order_by(ProgressData.assessment_date.asc()).all()
    elif skill_type == 'cognitive':
        progress = db.session.query(ProgressData.assessment_date, ProgressData.cognitive_skills_score).filter_by(user_id=user_id).order_by(ProgressData.assessment_date.asc()).all()
    else:
        progress = db.session.query(ProgressData.assessment_date, ProgressData.overall_development_score).filter_by(user_id=user_id).order_by(ProgressData.assessment_date.asc()).all()
    
    return progress

def calculate_session_metrics(sessions):
    """Calculate aggregate metrics from session data"""
    if not sessions:
        return {}
    
    total_sessions = len(sessions)
    total_score = sum(s.score for s in sessions)
    total_time = sum(s.session_duration for s in sessions)
    avg_accuracy = sum(s.accuracy_percentage or 0 for s in sessions) / total_sessions
    
    return {
        'total_sessions': total_sessions,
        'average_score': total_score / total_sessions,
        'total_playtime': total_time,
        'average_accuracy': avg_accuracy,
        'improvement_trend': 'improving' if len(sessions) > 5 and sessions[-1].score > sessions[0].score else 'stable'
    }