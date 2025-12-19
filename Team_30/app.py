# Fixed and Enhanced Flask Application (app.py)

from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    session,
    jsonify,
    flash,
    abort,
)
from flask_sqlalchemy import SQLAlchemy
from flask_login import (
    LoginManager,
    login_user,
    logout_user,
    login_required,
    current_user,
)
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import json
import os
import subprocess
import threading

from models import db, User, GameSession, ProgressData, AIInsight
from ai_analysis import AnalysisEngine
from game_config import GameConfig
import re
import requests



GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

if not GEMINI_API_KEY:
    print("⚠ GEMINI_API_KEY is not set – Gemini chatbot/report will be disabled.")

# -----------------------------
# Gemini helpers
# -----------------------------

def call_gemini(prompt: str, model: str = "gemini-3-pro", timeout: float = 8.0) -> str:
    """
    Call the Gemini API over simple HTTPS (REST) instead of the Python SDK.
    Returns the text of the first candidate, or raises an error.
    """
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not set")

    url = f"{GEMINI_API_BASE}/{model}:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 512,
        },
    }

    resp = requests.post(url, json=payload, timeout=timeout)
    if resp.status_code != 200:
        # This will show in Railway logs if the key/permissions are wrong
        raise RuntimeError(f"Gemini HTTP {resp.status_code}: {resp.text[:300]}")

    data = resp.json()
    candidates = data.get("candidates") or []
    if not candidates:
        raise RuntimeError(f"No candidates in Gemini response: {data}")

    parts = candidates[0].get("content", {}).get("parts") or []
    if not parts:
        raise RuntimeError(f"No parts in Gemini response: {data}")

    return (parts[0].get("text") or "").strip()


app = Flask(__name__)
app.config["SECRET_KEY"] = "neuroplay-secret-key-2025"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///neuroplay.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False




# -----------------------------
# Extensions
# -----------------------------
db.init_app(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

# AI engine
analysis_engine = AnalysisEngine()

def build_ai_context_for_user(user: User) -> str:
    """
    Build a compact, structured text summary of recent sessions, progress data
    and AIInsight for this user. This is fed into Gemini so it can write
    friendly narrative explanations.
    """
    user_id = user.id

    # Last 10 game sessions
    sessions = (
        GameSession.query.filter_by(user_id=user_id)
        .order_by(GameSession.session_date.desc())
        .limit(10)
        .all()
    )

    # Last 3 progress entries
    progress_entries = (
        ProgressData.query.filter_by(user_id=user_id)
        .order_by(ProgressData.assessment_date.desc())
        .limit(3)
        .all()
    )

    # Latest AIInsight from your AnalysisEngine
    latest_insight = (
        AIInsight.query.filter_by(user_id=user_id)
        .order_by(AIInsight.generated_date.desc())
        .first()
    )

    parts: list[str] = []

    parts.append("Recent game sessions (up to 10):")
    if sessions:
        for s in sessions:
            parts.append(
                f"- {s.game_name or 'unknown'} on "
                f"{(s.session_date.strftime('%Y-%m-%d') if s.session_date else 'N/A')}; "
                f"score={s.score}, accuracy={round(s.accuracy_percentage or 0, 1)}%, "
                f"duration_s={round(s.session_duration or 0, 1)}"
            )
    else:
        parts.append("- No game sessions recorded yet.")

    parts.append("\nRecent progress assessments (up to 3):")
    if progress_entries:
        for p in progress_entries:
            parts.append(
                f"- {p.assessment_date.strftime('%Y-%m-%d') if p.assessment_date else 'N/A'}; "
                f"motor={p.motor_skills_score}, cognitive={p.cognitive_skills_score}, "
                f"coordination={p.hand_eye_coordination}, attention={p.attention_score}"
            )
    else:
        parts.append("- No progress assessments yet.")

    parts.append("\nLatest numeric AI insight from AnalysisEngine:")
    if latest_insight:
        parts.append(
            f"- trajectory={latest_insight.progress_trajectory or 'unknown'}, "
            f"motor_risk={latest_insight.motor_risk_score or 0}, "
            f"attention_risk={latest_insight.attention_risk_score or 0}, "
            f"overall_risk={latest_insight.overall_development_risk or 0}"
        )
    else:
        parts.append("- No AIInsight rows yet for this user.")

    return "\n".join(parts)


# -----------------------------
# Jinja helpers
# -----------------------------
@app.template_filter("from_json")
def from_json_filter(s):
    """Convert JSON string to Python object for template use"""
    if not s:
        return {}
    try:
        return json.loads(s)
    except (json.JSONDecodeError, TypeError, ValueError):
        return {}


# Make `user` always available in templates (maps to current_user)
@app.context_processor
def inject_user():
    return dict(user=current_user)


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


# -----------------------------
# Auth + Home
# -----------------------------
@app.route("/")
def index():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))
    return render_template("login.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    """User registration"""
    if request.method == "POST":
        email = request.form.get("email")
        name = request.form.get("name")
        password = request.form.get("password")
        user_type = request.form.get("user_type", "parent")
        child_name = request.form.get("child_name")
        child_age = request.form.get("child_age")

        if not email or not name or not password:
            flash("Please fill in all required fields", "error")
            return redirect(url_for("register"))

        existing = User.query.filter_by(email=email).first()
        if existing:
            flash("Email already exists", "error")
            return redirect(url_for("register"))

        new_user = User(
            email=email,
            name=name,
            password=generate_password_hash(password, method="pbkdf2:sha256"),
            user_type=user_type,
            child_name=child_name,
            child_age=int(child_age) if child_age else None,
            created_at=datetime.utcnow(),
        )

        db.session.add(new_user)
        db.session.commit()

        flash("Registration successful! Please login.", "success")
        return redirect(url_for("login"))

    return render_template("register.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    """User login"""
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        remember = True if request.form.get("remember") else False

        user = User.query.filter_by(email=email).first()

        if not user or not check_password_hash(user.password, password):
            flash("Invalid email or password", "error")
            return redirect(url_for("login"))

        user.last_login = datetime.utcnow()
        db.session.commit()

        login_user(user, remember=remember)
        return redirect(url_for("dashboard"))

    return render_template("login.html")


@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))


# -----------------------------
# Dashboard
# -----------------------------
@app.route("/dashboard")
@login_required
def dashboard():
    """User dashboard with statistics"""

    recent_sessions = (
        GameSession.query.filter_by(user_id=current_user.id)
        .order_by(GameSession.session_date.desc())
        .limit(5)
        .all()
    )

    latest_progress = (
        ProgressData.query.filter_by(user_id=current_user.id)
        .order_by(ProgressData.assessment_date.desc())
        .first()
    )

    latest_insights = (
        AIInsight.query.filter_by(user_id=current_user.id)
        .order_by(AIInsight.generated_date.desc())
        .first()
    )

    total_sessions = GameSession.query.filter_by(user_id=current_user.id).count()

    if total_sessions > 0:
        avg_score = (
            db.session.query(db.func.avg(GameSession.score))
            .filter_by(user_id=current_user.id)
            .scalar()
            or 0
        )
        avg_accuracy = (
            db.session.query(db.func.avg(GameSession.accuracy_percentage))
            .filter_by(user_id=current_user.id)
            .scalar()
            or 0
        )
        avg_accuracy = (
            db.session.query(db.func.avg(GameSession.accuracy_percentage))
            .filter_by(user_id=current_user.id)
            .scalar()
            or 0
        )
    else:
        avg_score = 0
        avg_accuracy = 0

    stats = {
        "total_sessions": total_sessions,
        "avg_score": round(avg_score, 1),
        "avg_accuracy": round(avg_accuracy, 1),
        
    }

    return render_template("dashboard.html",
                           user=current_user,
                           stats=stats,
                           recent_sessions=recent_sessions,
                           progress= latest_progress,
                           insights = latest_insights,
                           )


# -----------------------------
# Games
# -----------------------------
@app.route("/games")
@login_required
def games():
    """Games selection page"""
    games_list = [
        {
            "id": "follow_dot",
            "name": "Follow the Dot - Enhanced",
            "description": "Advanced hand-eye coordination training with AI analysis",
            "icon": "follow-dot.png",
            "route": "play_follow_dot_enhanced",
        },
        {
            "id": "bubble_pop",
            "name": "Bubble Pop - Enhanced",
            "description": "Reaction time and bilateral coordination with squeeze detection",
            "icon": "bubble-pop.png",
            "route": "play_bubble_pop_enhanced",
        },
    ]
    return render_template("games.html", games=games_list)


@app.route("/play/follow_dot_enhanced")
@login_required
def play_follow_dot_enhanced():
    """Play web Follow the Dot game (browser version)."""
    return render_template(
        "follow_dot_web.html",                # new template
        record_session_url=url_for("record_session"),
        user_id=current_user.id,
    )


@app.route("/play/bubble_pop_enhanced")
@login_required
def play_bubble_pop_enhanced():
    """Play web Bubble Pop game (browser version)."""
    return render_template(
        "bubble_pop_web.html",               # new template
        record_session_url=url_for("record_session"),
        user_id=current_user.id,
    )


@app.route("/play/<game_name>")
@login_required
def play_game(game_name):
    """Redirect to the correct enhanced game route based on game_name."""
    if game_name == "follow_dot":
        return redirect(url_for("play_follow_dot_enhanced"))
    elif game_name == "bubble_pop":
        return redirect(url_for("play_bubble_pop_enhanced"))
    else:
        abort(404)


# @app.route("/api/launch_game/<game_type>", methods=["POST"])
# @login_required
# def launch_game(game_type):
#     """API endpoint to launch pygame games"""
#     try:
#         game_scripts = {
#             "follow_dot": "enhanced_follow_dot.py",
#             "bubble_pop": "enhanced_bubble_pop.py",
#         }

#         if game_type not in game_scripts:
#             return jsonify({"status": "error", "message": "Invalid game type"}), 400

#         script_name = game_scripts[game_type]
#         script_path = os.path.join("games_src", script_name)

#         config = GameConfig()
#         config.save_config(current_user.id)

#         def run_game():
#             try:
#                 venv_python = os.path.join(os.getcwd(), "neuroplay-env", "Scripts", "python.exe")
#                 subprocess.Popen([venv_python, script_path])

#             except Exception as e:
#                 print(f"Error in game subprocess: {e}")

#         thread = threading.Thread(target=run_game)
#         thread.daemon = True
#         thread.start()

#         return jsonify(
#             {
#                 "status": "success",
#                 "message": f"Game {game_type} launched successfully",
#                 "user_id": current_user.id,
#             }
#         )

#     except Exception as e:
#         print(f"Error launching game: {e}")
#         return jsonify({"status": "error", "message": str(e)}), 500 


# -----------------------------
# API: record_session
# -----------------------------
@app.route("/api/record_session", methods=["POST"], strict_slashes=False)
def record_session():
    """Enhanced API endpoint to record game session data"""
    try:
        data = request.get_json(silent= True)
        if not data:
            return jsonify({"status": "error", "message": "No data received"}), 400

        print(f"📊 Recording session data: {data}")
        
        user_id = data.get("user_id")
        if not user_id and current_user.is_authenticated:
            user_id = current_user.id

        if not user_id:
            return jsonify(
                {"status": "error", "message": "user_id missing in request"}
            ), 400

        game_name = data.get("game_name", "unknown")

        game_display_names = {
            "follow_dot": "Follow the Dot",
            "bubble_pop": "Bubble Pop",
        }

        display_name = game_display_names.get(game_name, game_name)

        score = data.get("score", 0)
        level = data.get("level", 1)
        session_duration = data.get("session_duration", 0)

        total_attempts = data.get("total_tries", data.get("total_attempts", 0))
        successful_attempts = data.get(
            "right_tries", data.get("successful_attempts", 0)
        )
        failed_attempts = total_attempts - successful_attempts

        left_hand_usage = data.get("left_hand_count", 0)
        right_hand_usage = data.get("right_hand_count", 0)

        accuracy_percentage = (successful_attempts / max(1, total_attempts)) * 100

        reaction_times = data.get("reaction_times", [])
        avg_reaction_time = (
            sum(reaction_times) / len(reaction_times) if reaction_times else None
        )

        movement_analysis = data.get("movement_analysis", {})
        smoothness_scores = movement_analysis.get("smoothness_scores", [])
        precision_scores = movement_analysis.get("precision_scores", [])

        avg_smoothness = (
            sum(smoothness_scores) / len(smoothness_scores)
            if smoothness_scores
            else None
        )

        hand_coordination = data.get("hand_coordination", {})
        if hand_coordination:
            left_success = hand_coordination.get("left_success", 0)
            right_success = hand_coordination.get("right_success", 0)
            total_hand_attempts = (
                left_success
                + right_success
                + hand_coordination.get("left_miss", 0)
                + hand_coordination.get("right_miss", 0)
            )
            hand_coord_score = (
                (left_success + right_success) / max(1, total_hand_attempts)
            ) * 100
        else:
            hand_coord_score = None

        session_record = GameSession(
            user_id=int(user_id),
            game_name=display_name,
            game_mode=data.get("mode", data.get("difficulty", "standard")),
            level_reached=level,
            score=score,
            total_attempts=total_attempts,
            successful_attempts=successful_attempts,
            failed_attempts=failed_attempts,
            left_hand_usage=left_hand_usage,
            right_hand_usage=right_hand_usage,
            session_duration=session_duration,
            session_date=datetime.utcnow(),
            average_reaction_time=avg_reaction_time,
            hand_coordination_score=hand_coord_score,
            movement_smoothness=avg_smoothness,
            accuracy_percentage=accuracy_percentage,
            raw_data=json.dumps(data),
        )

        db.session.add(session_record)
        db.session.commit()

        print(f"✅ Session recorded: Game={display_name}, Score={score}, Level={level}")

        try:
            analysis_engine.analyze_session(session_record)
            print("🤖 AI analysis completed")
        except Exception as e:
            print(f"⚠️ AI analysis failed: {e}")

        return jsonify(
            {
                "status": "success",
                "session_id": session_record.id,
                "message": "Session recorded successfully",
                "recorded_data": {
                    "game": display_name,
                    "score": score,
                    "level": level,
                    "duration": session_duration,
                    "accuracy": round(accuracy_percentage, 1),
                },
            }
        )

    except Exception as e:
        print(f"❌ Error recording session: {e}")
        import traceback

        traceback.print_exc()
        db.session.rollback()
        return (
            jsonify(
                {"status": "error", "message": f"Failed to record session: {str(e)}"}
            ),
            500,
        )


# -----------------------------
# Progress & Insights pages
# -----------------------------
@app.route("/progress")
@login_required
def progress():
    """Progress tracking page"""
    try:
        sessions = (
            GameSession.query.filter_by(user_id=current_user.id)
            .order_by(GameSession.session_date.desc())
            .all()
        )
        progress_data = (
                ProgressData.query.filter_by(user_id=current_user.id)
                .order_by(ProgressData.assessment_date.desc())
                .limit(5)
                .all()
            )

            # Sessions from the last 7 days (for weekly stats)
        week_ago = datetime.utcnow() - timedelta(days=7)
        this_week_sessions = [
            s for s in sessions if s.session_date and s.session_date >= week_ago
        ]
        return render_template(
                "progress.html",
                sessions=sessions,
                progress_data=progress_data,
                this_week_sessions=this_week_sessions,
                user=current_user,   # optional if you also have inject_user()
        )
    except Exception as e:
        print(f"Error in progress route: {e}")
            # Fallback to avoid crashing the page
        return render_template(
            "progress.html",
            sessions=[],
            progress_data=[],
            this_week_sessions=[],
            user=current_user,
        )



@app.route("/insights")
@login_required
def insights():
    """AI insights page"""
    ai_insights = (
        AIInsight.query.filter_by(user_id=current_user.id)
        .order_by(AIInsight.generated_date.desc())
        .all()
    )
    sessions = GameSession.query.filter_by(user_id=current_user.id).all()

    # NOTE: template file is 'insights.html' in your /templates folder
    return render_template("insights.html", insights=ai_insights, sessions=sessions)


@app.route("/admin/clear_insights")
@login_required
def clear_insights():
    AIInsight.query.filter_by(user_id=current_user.id).delete()
    db.session.commit()
    flash("Old insights cleared. New insights will be generated on next visit.")
    return redirect(url_for("insights"))


@app.route("/profile")
@login_required
def profile():
    return render_template("profile.html")


@app.route("/api/update_progress", methods=["POST"])
@login_required
def update_progress():
    data = request.get_json()

    try:
        progress = ProgressData(
            user_id=current_user.id,
            motor_skills_score=data.get("motor_skills", 0),
            cognitive_skills_score=data.get("cognitive_skills", 0),
            hand_eye_coordination=data.get("coordination", 0),
            reaction_time=data.get("reaction_time", 0),
            fine_motor_score=data.get("fine_motor", 0),
            gross_motor_score=data.get("gross_motor", 0),
            attention_score=data.get("attention", 0),
            memory_score=data.get("memory", 0),
            assessment_date=datetime.utcnow(),
        )

        db.session.add(progress)
        db.session.commit()

        return jsonify({"status": "success", "message": "Progress updated successfully"})

    except Exception as e:
        print(f"Error updating progress: {e}")
        return (
            jsonify({"status": "error", "message": "Failed to update progress"}),
            500,
        )

#Gemini chatbot for parents / therapists

@app.route("/api/chat", methods=["POST"])
@login_required
def chat():
    """Parent/Therapist chatbot using Gemini – via REST."""

    data = request.get_json(silent=True) or {}
    user_message = (data.get("message") or "").strip()
    audience = data.get("audience", "parent")  # "parent" or "therapist"

    if not user_message:
        return jsonify({"error": "Empty message"}), 400

    context_text = build_ai_context_for_user(current_user)

    if audience == "therapist":
        system_role = (
            "You are a supportive assistant for pediatric therapists. "
            "You see structured game-based data from NeuroPlay, an autism-friendly therapeutic game platform. "
            "Help interpret the data trends, suggest discussion points for therapy sessions, "
            "but DO NOT provide diagnoses or medical treatment plans."
        )
    else:
        system_role = (
            "You are a calm, friendly assistant for parents of an autistic child. "
            "Explain NeuroPlay game results in simple, everyday language. "
            "Focus on strengths, gentle encouragement, and practical ideas for supportive activities. "
            "Do NOT give medical advice or diagnoses. Always encourage parents to talk to their therapist "
            "or doctor for serious concerns."
        )

    prompt = (
        f"{system_role}\n\n"
        f"Here is structured data about the child's recent NeuroPlay activity:\n"
        f"{context_text}\n\n"
        f"The parent/therapist says:\n\"{user_message}\"\n\n"
        f"Answer clearly and kindly in under about 250 words."
    )
    
  
    try:
        reply_text = call_gemini(prompt, model="gemini-3-pro", timeout=8.0)
        if not reply_text:
            raise RuntimeError("Empty response from Gemini")
        return jsonify({"reply": reply_text})
    except Exception as e:
        # This will show up in Railway logs
        print("Gemini chat error (REST):", repr(e))
        return jsonify({
            "error": "Sorry, I couldn't answer right now."
        }), 502

#Gemini narrative report

@app.route("/api/generate_report", methods=["POST"])
@login_required
def generate_report():

    data = request.get_json(silent=True) or {}
    audience = data.get("audience", "parent")  # "parent" or "therapist"

    context_text = build_ai_context_for_user(current_user)

    if audience == "therapist":
        system_role = (
            "You are generating a concise summary report for a pediatric therapist. "
            "Use the structured NeuroPlay data to describe trends in motor skills, coordination, "
            "attention and game engagement. Be professional but gentle. "
            "Do NOT diagnose or prescribe treatment. Suggest possible topics for discussion "
            "in the next therapy session."
        )
    else:
        system_role = (
            "You are generating a short, easy-to-read progress report for a parent of an autistic child. "
            "Use simple language. Focus on what is going well, where practice might help, and a few gentle "
            "activity ideas at home. Do NOT give medical advice or diagnoses. Encourage the parent to talk "
            "with their child's therapist or doctor for any serious concerns."
        )

    prompt = (
        f"{system_role}\n\n"
        f"Here is structured data about the child's recent NeuroPlay activity:\n"
        f"{context_text}\n\n"
        f"Write a friendly report with clear headings and short paragraphs. "
        f"Keep it under about 600 words."
    )

    try:
        report_text = call_gemini(prompt, model="gemini-3-pro", timeout=10.0)
        if not report_text:
            raise RuntimeError("Empty response from Gemini")
            
        # Optionally store this as a new AIInsight narrative
        new_insight = AIInsight(
            user_id=current_user.id,
            generated_date=datetime.utcnow(),
            summary="Gemini narrative progress report",
            detailed_insight=report_text,
        )
        db.session.add(new_insight)
        db.session.commit()

        return jsonify({"report": report_text, "insight_id": new_insight.id})
    except Exception as e:
        print("Gemini report error:", e)
        db.session.rollback()
        return jsonify({"error": "Failed to generate report"}), 500

# -----------------------------
# Misc & Error handlers
# -----------------------------
@app.route("/favicon.ico")
def favicon():
    return "", 204


@app.errorhandler(404)
def not_found(error):
    return (
        render_template(
            "error.html", error_code=404, error_message="Page not found"
        ),
        404,
    )


@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return (
        render_template(
            "error.html", error_code=500, error_message="Internal server error"
        ),
        500,
    )


# -----------------------------
# Entry point
# -----------------------------
if __name__ == "__main__":
    with app.app_context():
        try:
            db.create_all()
            print("✅ Database tables created successfully")
        except Exception as e:
            print(f"❌ Error creating database tables: {e}")

    print("🎮 Starting NeuroPlay Flask Application...")
    print("📍 Access your app at: http://localhost:5000")
    app.run(debug=True, host="0.0.0.0", port=5000)
