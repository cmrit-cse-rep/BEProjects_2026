import os
import praw
from flask import Flask, render_template, redirect, url_for, request, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import (
    LoginManager,
    login_user,
    login_required,
    logout_user,
    current_user,
    UserMixin,
)
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from sentiment_model import predict_sentiments, count_labels
# In-memory store of latest results per user (for now)
user_results_cache = {}  # {user_id: {"query": str, "counts": {...}, "posts": [...]}}

# In-memory Q&A history per user
# {user_id: [ {"user": "<question>", "ai": "<answer>"}, ... ]}
user_qna_history = {}
from llm_agents import route_or_answer


# --------------------------------
# Reddit credentials from .env
# --------------------------------
REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT")
REDDIT_USERNAME = os.getenv("REDDIT_USERNAME")
REDDIT_PASSWORD = os.getenv("REDDIT_PASSWORD")
# --------------------------------
# Flask setup
# --------------------------------
app = Flask(__name__)
app.config["SECRET_KEY"] = "change-this-secret-key"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = "login"


# --------------------------------
# Helper to get Reddit instance
# --------------------------------
def get_reddit_instance():
    """Return a Reddit API instance using global credentials."""
    return praw.Reddit(
        client_id=REDDIT_CLIENT_ID,
        client_secret=REDDIT_CLIENT_SECRET,
        user_agent=REDDIT_USER_AGENT,
        username=REDDIT_USERNAME,
        password=REDDIT_PASSWORD,
    )

def fetch_reddit_posts(query: str, limit: int = 100):
    """
    Fetch Reddit posts matching the query across all subreddits.
    Returns a list of dicts with text ready for sentiment analysis.
    """
    reddit = get_reddit_instance()
    subreddit = reddit.subreddit("all")

    posts = []
    for submission in subreddit.search(query=query, sort="relevance", limit=limit):
        text_parts = []
        if submission.title:
            text_parts.append(submission.title)
        if submission.selftext:
            text_parts.append(submission.selftext)

        full_text = "\n\n".join(text_parts).strip()
        if not full_text:
            continue

        posts.append(
            {
                "id": submission.id,
                "title": submission.title,
                "selftext": submission.selftext,
                "subreddit": str(submission.subreddit),
                "score": submission.score,
                "created_utc": submission.created_utc,
                "url": submission.url,  # original outbound URL (could be an article, etc.)
                "permalink": f"https://www.reddit.com{submission.permalink}",  # direct Reddit post link
                "text": full_text,
            }
        )

    return posts


# -------------------------
# Database Models
# -------------------------
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)

    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    # Gemini API key (per user)
    gemini_api_key = db.Column(db.String(255), nullable=True)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)



@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# -------------------------
# CLI helper to init DB
# -------------------------
@app.cli.command("init-db")
def init_db():
    """Initialize the database tables."""
    db.create_all()
    print("Initialized the database.")


# -------------------------
# Routes: Auth
# -------------------------
@app.route("/signup", methods=["GET", "POST"])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        username = request.form.get("username").strip()
        email = request.form.get("email").strip().lower()
        password = request.form.get("password")
        confirm_password = request.form.get("confirm_password")

        gemini_api_key = request.form.get("gemini_api_key").strip() or None

        # Basic validations
        if not username or not email or not password:
            flash("Please fill in all required fields.", "danger")
            return render_template("signup.html")

        if password != confirm_password:
            flash("Passwords do not match.", "danger")
            return render_template("signup.html")

        if User.query.filter_by(username=username).first():
            flash("Username already taken.", "danger")
            return render_template("signup.html")

        if User.query.filter_by(email=email).first():
            flash("Email already registered.", "danger")
            return render_template("signup.html")

        # Create user
        user = User(
            username=username,
            email=email,
            gemini_api_key=gemini_api_key,
        )
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        flash("Signup successful! Please log in.", "success")
        return redirect(url_for("login"))

    return render_template("signup.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        email_or_username = request.form.get("email_or_username").strip()
        password = request.form.get("password")

        # Allow login via username OR email
        user = User.query.filter(
            (User.username == email_or_username)
            | (User.email == email_or_username.lower())
        ).first()

        if user and user.check_password(password):
            login_user(user)
            flash("Logged in successfully.", "success")
            next_page = request.args.get("next")
            return redirect(next_page or url_for("dashboard"))
        else:
            flash("Invalid credentials.", "danger")

    return render_template("login.html")

def run_fetch_and_classify_workflow(query: str, limit: int = 100):
    """
    Core pipeline:
    - Fetch Reddit posts
    - Run sentiment model
    - Build counts & enrich posts
    - Store in user_results_cache
    Returns a dict suitable for JSON response.
    """
    try:
        posts = fetch_reddit_posts(query, limit=limit)
    except Exception as e:
        print("Error fetching Reddit posts:", e)
        raise RuntimeError("Failed to fetch posts from Reddit.") from e

    if not posts:
        return {
            "query": query,
            "sentiment_counts": {"positive": 0, "negative": 0, "neutral": 0},
            "posts": [],
        }

    texts = [p["text"] for p in posts]

    try:
        labels, probs = predict_sentiments(texts)
    except Exception as e:
        print("Error running sentiment model:", e)
        raise RuntimeError("Failed to run sentiment analysis.") from e

    counts = count_labels(labels)

    for p, lbl, prob in zip(posts, labels, probs):
        p["sentiment"] = lbl
        p["probabilities"] = prob

    # Save latest results for this user (for future QnA workflow)
    user_results_cache[current_user.id] = {
        "query": query,
        "counts": counts,
        "posts": posts,
    }

    return {
        "query": query,
        "sentiment_counts": counts,
        "posts": posts,
    }


@app.route("/api/fetch_and_classify", methods=["POST"])
@login_required
def api_fetch_and_classify():
    data = request.get_json() or {}
    query = (data.get("query") or "").strip()
    limit = data.get("limit", 100)

    try:
        limit = int(limit)
    except ValueError:
        limit = 100

    limit = max(10, min(limit, 200))

    if not query:
        return jsonify({"error": "Query is required."}), 400

    try:
        result = run_fetch_and_classify_workflow(query, limit=limit)
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 500

    if not result["posts"]:
        return jsonify({"error": "No posts found for this query."}), 404

    return jsonify(result)

@app.route("/api/chat", methods=["POST"])
@login_required
def api_chat():
    """
    Chat-style endpoint with a single LLM that routes + generates.

    - If user has NO Gemini API key -> always fetch_posts using user message.
    - If no previous results -> ask LLM, but it SHOULD choose fetch (we also allow fallback).
    - Else:
        * LLM decides:
            fetch:"search query" -> run fetch & classify workflow for that query
            answer:"answer text" -> return answer, no new fetch
    """
    data = request.get_json() or {}
    user_message = (data.get("message") or "").strip()
    limit = data.get("limit", 100)

    try:
        limit = int(limit)
    except ValueError:
        limit = 100

    limit = max(10, min(limit, 200))

    if not user_message:
        return jsonify({"error": "Message is required."}), 400

    gemini_api_key = current_user.gemini_api_key
    last_results = user_results_cache.get(current_user.id)
    qna_history = user_qna_history.get(current_user.id, [])

    # Case 1: No Gemini key -> we cannot use LLM; always fetch using raw message.
    if not gemini_api_key:
        result = run_fetch_and_classify_workflow(user_message, limit=limit)
        return jsonify(
            {
                "mode": "fetch_posts",
                "query": result["query"],
                "sentiment_counts": result["sentiment_counts"],
                "posts": result["posts"],
            }
        )

    # Case 2: We DO have Gemini; let the LLM decide (with context if available)
    try:
        decision = route_or_answer(
            api_key=gemini_api_key,
            user_message=user_message,
            last_results=last_results,
            qna_history=qna_history,
        )
    except Exception as e:
        print("Error in route_or_answer LLM:", e)
        # Fallback: fetch using the raw user message
        decision = {"mode": "fetch", "fetch_query": user_message}

    mode = decision.get("mode")

    if mode == "answer":
        # QnA path – no new fetch, just answer from existing analysis
        answer_text = decision.get("answer", "").strip()
        if not answer_text:
            answer_text = (
                "I couldn't generate a reliable answer from the current analysis."
            )

        # Store this Q&A turn in history
        qna_history.append({
            "user": user_message,
            "ai": answer_text,
        })
        # (optional) keep only last N turns, e.g., last 6
        qna_history = qna_history[-6:]
        user_qna_history[current_user.id] = qna_history

        return jsonify(
            {
                "mode": "qna",
                "answer": answer_text,
            }
        )

    # Default / fetch path: use the LLM-generated search query if present
    fetch_query = decision.get("fetch_query", "").strip() or user_message

    try:
        result = run_fetch_and_classify_workflow(fetch_query, limit=limit)
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 500

    # New Reddit analysis -> reset Q&A history for this user
    user_qna_history[current_user.id] = []
    
    return jsonify(
        {
            "mode": "fetch_posts",
            "query": result["query"],
            "sentiment_counts": result["sentiment_counts"],
            "posts": result["posts"],
        }
    )




@app.route("/logout")
@login_required
def logout():
    logout_user()
    flash("You have been logged out.", "info")
    return redirect(url_for("login"))


# -------------------------
# Routes: Main Dashboard
# -------------------------
@app.route("/")
@login_required
def dashboard():
    """
    Dashboard page:
    - Left: sentiment chart
    - Right: query + chat + results
    """

    cache = user_results_cache.get(current_user.id)
    if cache:
        sentiment_counts = cache["counts"]
    else:
        sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0}

    return render_template(
        "dashboard.html",
        sentiment_counts=sentiment_counts,
        user=current_user,
    )

# -------------------------
# Entry point
# -------------------------
if __name__ == "__main__":
    # Ensure DB exists
    if not os.path.exists("app.db"):
        with app.app_context():
            db.create_all()
            print("Created app.db and tables.")

    app.run(debug=True)
