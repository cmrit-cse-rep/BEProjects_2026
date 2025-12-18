# Fixed and Enhanced Flask Application (app.py)

from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import json
import os
from models import db, User, GameSession, ProgressData, AIInsight
from ai_analysis import AnalysisEngine
import re

app = Flask(__name__)
app.config['SECRET_KEY'] = 'neuroplay-secret-key-2025'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///neuroplay.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Register custom Jinja2 filter for JSON parsing
@app.template_filter('from_json')
def from_json_filter(s):
    """Convert JSON string to Python object for template use"""
    if not s:
        return {}
    try:
        return json.loads(s)
    except (json.JSONDecodeError, TypeError, ValueError):
        return {}

# Initialize extensions
db.init_app(app)
login_manager = LoginManager()
login_manager.login_view = 'login'
login_manager.init_app(app)

# Initialize AI Analysis Engine
analysis_engine = AnalysisEngine()

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Routes
@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return render_template('login.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        remember = True if request.form.get('remember') else False
        
        user = User.query.filter_by(email=email).first()
        
        if not user or not check_password_hash(user.password, password):
            flash('Please check your login details and try again.')
            return redirect(url_for('login'))
        
        login_user(user, remember=remember)
        return redirect(url_for('dashboard'))
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form.get('email')
        name = request.form.get('name')
        password = request.form.get('password')
        child_name = request.form.get('child_name')
        child_age = request.form.get('child_age')
        user_type = request.form.get('user_type', 'parent')
        
        user = User.query.filter_by(email=email).first()
        
        if user:
            flash('Email address already exists')
            return redirect(url_for('register'))
        
        new_user = User(
            email=email,
            name=name,
            password=generate_password_hash(password, method='pbkdf2:sha256'),
            child_name=child_name,
            child_age=int(child_age) if child_age else None,
            user_type=user_type,
            created_at=datetime.utcnow()
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        flash('Registration successful')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/dashboard')
@login_required
def dashboard():
    # Get recent sessions
    recent_sessions = GameSession.query.filter_by(user_id=current_user.id).order_by(GameSession.session_date.desc()).limit(5).all()
    
    # Get latest progress data
    latest_progress = ProgressData.query.filter_by(user_id=current_user.id).order_by(ProgressData.assessment_date.desc()).first()
    
    # Get AI insights
    latest_insights = AIInsight.query.filter_by(user_id=current_user.id).order_by(AIInsight.generated_date.desc()).first()
    
    return render_template('dashboard.html', 
                         user=current_user, 
                         recent_sessions=recent_sessions,
                         progress=latest_progress,
                         insights=latest_insights)

@app.route('/games')
@login_required
def games():
    return render_template('games.html', user=current_user)

@app.route('/play/<game_name>')
@login_required
def play_game(game_name):
    """Serve game with proper game information"""
    game_mapping = {
        'follow_dot': {
            'url': '/static/games/follow_dot/index.html',
            'title': 'Follow the Dot',
            'description': 'Hand-eye coordination training with webcam tracking',
            'icon': 'dot-circle',
            'id': 'follow_dot'
        },
        'bubble_pop': {
            'url': '/static/games/bubble_pop/index.html', 
            'title': 'Bubble Pop',
            'description': 'Reaction time and coordination training',
            'icon': 'circle',
            'id': 'bubble_pop'
        }
    }
    
    if game_name in game_mapping:
        game_info = game_mapping[game_name]
        return render_template('game_embed.html',
                             game_url=game_info['url'],
                             game_title=game_info['title'],
                             game_description=game_info['description'],
                             game_icon=game_info['icon'],
                             game_id=game_info['id'],
                             user=current_user)
    else:
        flash('Game not found')
        return redirect(url_for('games'))

@app.route('/api/record_session', methods=['POST'], strict_slashes=False)
@login_required
def record_session():
    """Enhanced API endpoint to record game session data with proper error handling"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'status': 'error', 'message': 'No data received'}), 400
        
        print(f"📊 Recording session data: {data}")
        
        # Map game types to proper names
        game_type_mapping = {
            'follow_the_dot': 'Follow the Dot',
            'follow_dot': 'Follow the Dot', 
            'bubble_pop': 'Bubble Pop',
            'bubble_pop_game': 'Bubble Pop'
        }
        
        # Get game name from multiple possible fields
        raw_game_name = (data.get('gameType') or 
                        data.get('game_type') or 
                        data.get('game_name') or 
                        'unknown')
        
        # Map to proper display name
        display_game_name = game_type_mapping.get(raw_game_name, raw_game_name.replace('_', ' ').title())
        
        # Calculate session duration from totalTime (in seconds)
        total_time = data.get('totalTime', 0)
        if total_time == 0:
            # Fallback to other duration fields
            total_time = data.get('duration', data.get('session_duration', 0))
        
        # Calculate attempts and successes
        total_attempts = data.get('totalBubbles', data.get('total_attempts', 0))
        if total_attempts == 0 and 'bubblesPopped' in data:
            # For bubble pop, estimate total attempts
            total_attempts = max(data.get('bubblesPopped', 0) * 2, data.get('bubblesPopped', 0))
        elif total_attempts == 0:
            # For follow dot, use number of dots as attempts
            total_attempts = data.get('successful_attempts', 5)  # Default 5 dots
        
        successful_attempts = data.get('bubblesPopped', data.get('successful_attempts', 0))
        
        # Get level and score
        level = data.get('level', 1)
        score = data.get('score', 0)
        
        # Create session record with comprehensive data mapping
        session_record = GameSession(
            user_id=current_user.id,
            game_name=display_game_name,
            game_mode=data.get('mode', 'standard'),
            level_reached=level,
            score=score,
            total_attempts=total_attempts,
            successful_attempts=successful_attempts,
            failed_attempts=max(0, total_attempts - successful_attempts),
            left_hand_usage=data.get('left_hand_count', 0),
            right_hand_usage=data.get('right_hand_count', 0),
            session_duration=total_time,  # Store in seconds
            session_date=datetime.utcnow(),
            raw_data=json.dumps(data)
        )
        
        db.session.add(session_record)
        db.session.commit()
        
        print(f"✅ Session recorded: Game={display_game_name}, Score={score}, Level={level}, Duration={total_time}s")
        
        # Trigger AI analysis for this session (optional)
        try:
            analysis_engine.analyze_session(session_record)
            print("🤖 AI analysis completed")
        except Exception as e:
            print(f"⚠️ AI analysis failed: {e}")
            # Continue even if AI analysis fails
        
        return jsonify({
            'status': 'success',
            'session_id': session_record.id,
            'message': 'Session recorded successfully',
            'recorded_data': {
                'game': display_game_name,
                'score': score,
                'level': level,
                'duration': total_time,
                'accuracy': round((successful_attempts / total_attempts * 100) if total_attempts > 0 else 0, 1)
            }
        })
        
    except Exception as e:
        print(f"❌ Error recording session: {e}")
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': f'Failed to record session: {str(e)}'
        }), 500

@app.route('/progress')
@login_required
def progress():
    """Display user progress and statistics with proper data serialization"""
    try:
        # Query game sessions for current user
        sessions = GameSession.query.filter_by(user_id=current_user.id).order_by(GameSession.session_date.desc()).all()
        
        # Query progress data for current user
        progress_data = ProgressData.query.filter_by(user_id=current_user.id).order_by(ProgressData.assessment_date.desc()).limit(5).all()
        
        # Get sessions from this week
        week_ago = datetime.utcnow() - timedelta(days=7)
        this_week_sessions = [s for s in sessions if s.session_date and s.session_date >= week_ago]
        
        return render_template('progress.html',
                             sessions=sessions,
                             progress_data=progress_data,
                             this_week_sessions=this_week_sessions,
                             user=current_user)
    
    except Exception as e:
        print(f"Error in progress route: {e}")
        # Return empty data to prevent crashes
        return render_template('progress.html',
                             sessions=[],
                             progress_data=[],
                             this_week_sessions=[],
                             user=current_user)

@app.route('/insights')
@login_required
def insights():
    """Display AI insights with safe list handling"""
    try:
        # Get AI insights
        user_insights = AIInsight.query.filter_by(user_id=current_user.id).order_by(AIInsight.generated_date.desc()).all()
        sessions = GameSession.query.filter_by(user_id=current_user.id).all()
        
        # Generate new insights if none exist or if last insight is > 7 days old
        if not user_insights or (user_insights[0].generated_date < datetime.utcnow() - timedelta(days=7)):
            analysis_engine.generate_comprehensive_insights(current_user.id)
            user_insights = AIInsight.query.filter_by(user_id=current_user.id).order_by(AIInsight.generated_date.desc()).all()
        
        # Ensure user_insights is always a list
        if not isinstance(user_insights, list):
            user_insights = [user_insights] if user_insights else []
            
    except Exception as e:
        print(f"Error generating insights: {e}")
        user_insights = AIInsight.query.filter_by(user_id=current_user.id).order_by(AIInsight.generated_date.desc()).all()
        if not isinstance(user_insights, list):
            user_insights = [user_insights] if user_insights else []
        sessions = GameSession.query.filter_by(user_id=current_user.id).all()
    
    return render_template('insights.html', insights=user_insights, sessions=sessions, user=current_user)

@app.route('/admin/clear_insights')
@login_required
def clear_insights():
    """Clear old AI insights to force regeneration with new format"""
    # Delete all existing insights for current user
    AIInsight.query.filter_by(user_id=current_user.id).delete()
    db.session.commit()
    
    flash('Old insights cleared. New insights will be generated on next visit.')
    return redirect(url_for('insights'))

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/api/update_progress', methods=['POST'])
@login_required
def update_progress():
    """API endpoint to update progress data"""
    data = request.get_json()
    
    try:
        progress = ProgressData(
            user_id=current_user.id,
            motor_skills_score=data.get('motor_skills', 0),
            cognitive_skills_score=data.get('cognitive_skills', 0),
            hand_eye_coordination=data.get('coordination', 0),
            reaction_time=data.get('reaction_time', 0),
            fine_motor_score=data.get('fine_motor', 0),
            gross_motor_score=data.get('gross_motor', 0),
            attention_score=data.get('attention', 0),
            memory_score=data.get('memory', 0),
            assessment_date=datetime.utcnow()
        )
        
        db.session.add(progress)
        db.session.commit()
        
        return jsonify({'status': 'success', 'message': 'Progress updated successfully'})
        
    except Exception as e:
        print(f"Error updating progress: {e}")
        return jsonify({'status': 'error', 'message': 'Failed to update progress'}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return render_template('error.html', 
                         error_code=404, 
                         error_message="Page not found"), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('error.html', 
                         error_code=500, 
                         error_message="Internal server error"), 500

if __name__ == '__main__':
    with app.app_context():
        try:
            db.create_all()
            print("✅ Database tables created successfully")
        except Exception as e:
            print(f"❌ Error creating database tables: {e}")
    
    print("🎮 Starting NeuroPlay Flask Application...")
    print("📍 Access your app at: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)