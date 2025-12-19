from flask import Flask, render_template, request, jsonify, redirect, session
from sklearn.tree import DecisionTreeClassifier
import joblib
import torch
import librosa
from faster_whisper import WhisperModel
from transformers import (
    Wav2Vec2FeatureExtractor,
    AutoModelForAudioClassification,
    AutoTokenizer,
    AutoModelForSeq2SeqLM
)
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

# =====================================================
# FLASK APP + SESSION CONFIG
# =====================================================
app = Flask(__name__)

# 🔐 Secret key for sessions
app.secret_key = "your_super_secret_key"

# Session cookie config (important for Chrome/localhost)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_COOKIE_SECURE"] = False       # OK for localhost (HTTP)
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_NAME"] = "interview_session"
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["PERMANENT_SESSION_LIFETIME"] = 3600   # 1 hour

AUDIO_FILE = "answer.wav"

# =====================================================
# DB HELPER
# =====================================================
def get_connection():
    # check_same_thread=False so same connection can be used across threads
    return sqlite3.connect("results.db", check_same_thread=False)

# =====================================================
# DATABASE SETUP
# =====================================================
def init_db():
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS user_results (
        user_id TEXT PRIMARY KEY,
        aptitude_score REAL,
        aptitude_weak_topic TEXT,
        technical_score REAL,
        technical_feedback TEXT,
        voice_transcript TEXT,
        voice_improved TEXT,
        voice_emotion TEXT
    )
    """)
    conn.commit()
    conn.close()

# import sqlite3
# conn = sqlite3.connect("results.db")
# c = conn.cursor()
# c.execute("ALTER TABLE user_results ADD COLUMN voice_data TEXT")
# conn.commit()
# conn.close()


def init_user_db():
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT
    )
    """)
    conn.commit()
    conn.close()


init_db()
init_user_db()


def update_result(user_id, **kwargs):
    """Insert if not exists, then update the given columns for that user."""
    if not user_id:
        return  # safety: no user, no update

    conn = get_connection()
    c = conn.cursor()

    columns = ", ".join([f"{k} = ?" for k in kwargs])
    values = list(kwargs.values())

    # Ensure row exists (SQLite 3.24+ supports DO NOTHING)
    c.execute("""
        INSERT INTO user_results (user_id)
        VALUES (?)
        ON CONFLICT(user_id) DO NOTHING
    """, (user_id,))

    # Update given fields
    c.execute(f"""
        UPDATE user_results
        SET {columns}
        WHERE user_id = ?
    """, values + [user_id])

    conn.commit()
    conn.close()


def get_results(user_id):
    conn = get_connection()
    c = conn.cursor()

    c.execute("""
        SELECT users.name,
               user_results.aptitude_score,
               user_results.aptitude_weak_topic,
               user_results.technical_score,
               user_results.technical_feedback,
               user_results.voice_data
        FROM users
        LEFT JOIN user_results ON users.user_id = user_results.user_id
        WHERE users.user_id = ?
    """, (user_id,))

    data = c.fetchone()
    conn.close()
    return data




# =====================================================
# AUTH: LOGIN REQUIRED DECORATOR
# =====================================================
def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            return redirect("/login")
        return f(*args, **kwargs)
    return wrapper


# =====================================================
# LOAD MODELS
# =====================================================
print("🔁 Loading Whisper BASE model...")
whisper_model = WhisperModel("base", device="cpu", compute_type="int8")

print("🔁 Loading Emotion Model...")
emotion_processor = Wav2Vec2FeatureExtractor.from_pretrained("models/hubert_emotion")
emotion_model = AutoModelForAudioClassification.from_pretrained("models/hubert_emotion")

print("🔁 Loading Grammar Correction Model...")
GC_MODEL_NAME = "vennify/t5-base-grammar-correction"
tokenizer_gc = AutoTokenizer.from_pretrained(GC_MODEL_NAME)
model_gc = AutoModelForSeq2SeqLM.from_pretrained(GC_MODEL_NAME)


# =====================================================
# SPEECH → TEXT (Whisper)
# =====================================================
def speech_to_text(path):
    """
    Use faster-whisper to transcribe the saved WAV file.
    """
    segments, _ = whisper_model.transcribe(
        path,
        language="en",
        task="transcribe",
        beam_size=1,
        without_timestamps=True
    )
    # segments is a generator – join all text parts
    return " ".join([seg.text.strip() for seg in segments])


# =====================================================
# EMOTION DETECTION (Hubert + librosa)
# =====================================================
def detect_emotion(path):
    audio, _ = librosa.load(path, sr=16000)
    inputs = emotion_processor(audio, sampling_rate=16000, return_tensors="pt")

    with torch.no_grad():
        logits = emotion_model(**inputs).logits

    prediction = torch.argmax(logits).item()
    label = emotion_model.config.id2label[prediction]

    # 🔥 CUSTOM REPLACEMENTS HERE
    custom_map = {
        "sad": "sad",
        "neu": "neutral",
        "hap": "confident"
    }

    if label in custom_map:
        label = custom_map[label]

    return label


# =====================================================
# GRAMMAR IMPROVER (T5)
# =====================================================
def improve_text(text):
    """
    Use T5 grammar model to rewrite the transcript into cleaner English.
    """
    if not text.strip():
        return ""  # avoid sending empty text

    inp = "correct this to proper English: " + text
    tokens = tokenizer_gc(inp, return_tensors="pt", truncation=True)
    output = model_gc.generate(tokens.input_ids, num_beams=5, max_length=200)
    return tokenizer_gc.decode(output[0], skip_special_tokens=True)


# =====================================================
# VOICE INTERVIEW API
# =====================================================
import json

@app.route("/voice_interview", methods=["POST"])
@login_required
def voice_interview():

    if "audio" not in request.files:
        return jsonify({"error": "No audio file received"}), 400

    audio_file = request.files["audio"]
    audio_file.save(AUDIO_FILE)

    # 1. Transcribe
    transcript = speech_to_text(AUDIO_FILE)

    # 2. Emotion
    try:
        emotion = detect_emotion(AUDIO_FILE)
    except:
        emotion = "unknown"

    # 3. Improve grammar
    improved = improve_text(transcript)

    # Read the question asked
    question = request.form.get("question", "Unknown question")

    user_id = session.get("user_id")

    # Load previous stored voice_data
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT voice_data FROM user_results WHERE user_id=?", (user_id,))
    row = c.fetchone()
    conn.close()

    previous = json.loads(row[0]) if row and row[0] else []

    # Append this answer
    previous.append({
        "question": question,
        "transcript": transcript,
        "improved": improved,
        "emotion": emotion
    })

    # Save back to DB
    update_result(
        user_id=user_id,
        voice_data=json.dumps(previous)
    )

    # Return result to frontend
    return jsonify({
        "question": question,
        "transcript": transcript,
        "improved": improved,
        "emotion": emotion
    })



# =====================================================
# TRAIN APTITUDE MODEL (simple decision tree)
# =====================================================
def train_model():
    # small toy dataset – you can expand later
    data = [
        {"topic": "number_system", "score": 8, "total": 10, "label": 0},
        {"topic": "percentages", "score": 3, "total": 10, "label": 1},
        {"topic": "profit_and_loss", "score": 9, "total": 10, "label": 0},
        {"topic": "percentages", "score": 4, "total": 10, "label": 1},
        {"topic": "number_system", "score": 2, "total": 10, "label": 1},
        {"topic": "profit_and_loss", "score": 10, "total": 10, "label": 0},
    ]

    topic_map = {"number_system": 0, "percentages": 1, "profit_and_loss": 2}

    X, y = [], []
    for d in data:
        topic_vector = [0, 0, 0]
        topic_vector[topic_map[d["topic"]]] = 1
        score_pct = d["score"] / d["total"]
        X.append(topic_vector + [score_pct])
        y.append(d["label"])

    clf = DecisionTreeClassifier()
    clf.fit(X, y)
    joblib.dump(clf, "model.pkl")
    print("✅ Aptitude model trained and saved as model.pkl")


# Train once at startup
train_model()
model = joblib.load("model.pkl")


# =====================================================
# APTITUDE API
# =====================================================
@app.route("/predict", methods=["POST"])
@login_required
def predict():
    """
    Input JSON:
    {
        "topic": "number_system" | "percentages" | "profit_and_loss",
        "score": 7,
        "total": 10
    }
    Returns:
        { "weak_topic_predicted": 0 or 1 }
    """
    input_data = request.get_json()

    topic = input_data["topic"]
    score = float(input_data["score"])
    total = float(input_data["total"])

    topic_map = {"number_system": 0, "percentages": 1, "profit_and_loss": 2}

    topic_vector = [0, 0, 0]
    topic_idx = topic_map.get(topic, 0)
    topic_vector[topic_idx] = 1

    score_percent = score / total
    features = topic_vector + [score_percent]

    prediction = model.predict([features])[0]

    # Store in DB as aptitude performance
    user_id = session.get("user_id")
    update_result(
        user_id=user_id,
        aptitude_score=score_percent,
        aptitude_weak_topic=str(prediction)
    )

    return jsonify({"weak_topic_predicted": int(prediction)})


# =====================================================
# RESULTS PAGE
# =====================================================
@app.route("/results")
@login_required
def results():
    user_id = session.get("user_id")
    data = get_results(user_id)

    if not data:
        return "No results found."

    result_dict = {
    "name": data[0],
    "aptitude_score": data[1],
    "aptitude_weak_topic": data[2],
    "technical_score": data[3],
    "technical_feedback": data[4],
    "voice_data": json.loads(data[5]) if data[5] else []
}


    return render_template("results.html", results=result_dict)



# =====================================================
# TECHNICAL FEEDBACK API
# =====================================================
@app.route("/technical_submit", methods=["POST"])
@login_required
def technical_submit():
    """
    Receives:
        { "score": 8, "feedback": "Good in OOP, weak in DB" }
    Stores into DB.
    """
    data = request.get_json()
    score = data["score"]
    feedback = data["feedback"]

    user_id = session.get("user_id")
    update_result(
        user_id=user_id,
        technical_score=score,
        technical_feedback=feedback
    )

    return jsonify({"status": "success"})


# =====================================================
# AUTH ROUTES: SIGNUP, LOGIN, LOGOUT
# =====================================================
@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        name = request.form.get("name")
        email = request.form.get("email")
        password = request.form.get("password")

        if not name or not email or not password:
            return render_template("signup.html", error="All fields are required")

        hashed = generate_password_hash(password)

        conn = get_connection()
        c = conn.cursor()
        try:
            # Using email as user_id for simplicity
            c.execute(
                "INSERT INTO users (user_id, name, email, password) VALUES (?, ?, ?, ?)",
                (email, name, email, hashed)
            )
            conn.commit()
        except sqlite3.IntegrityError:
            conn.close()
            return render_template("signup.html", error="Email already exists!")
        conn.close()

        return redirect("/login")

    return render_template("signup.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")

        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT user_id, password FROM users WHERE email = ?", (email,))
        user = c.fetchone()
        conn.close()

        if user and check_password_hash(user[1], password):
            # Clear any previous session and set new
            session.clear()
            session["user_id"] = user[0]
            session.permanent = False   # use non-permanent session
            print("✅ LOGIN SUCCESS — session user_id =", session.get("user_id"))
            return redirect("/aptitude")   # redirect to protected page
        else:
            return render_template("login.html", error="Invalid email or password")

    return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()
    return redirect("/login")

@app.route("/voice_performance")
@login_required
def voice_performance():
    return render_template("voice_performance.html")

# =====================================================
# ROUTES (PAGES)
# =====================================================
@app.route("/")
def home():
    # Home can be public; if you want it protected, add @login_required above
    return render_template("index.html")


@app.route("/aptitude")
@login_required
def aptitude():
    return render_template("aptitude.html")


@app.route("/performance")
@login_required
def performance():
    return render_template("performance.html")


@app.route("/technical")
@login_required
def technical():
    return render_template("technical.html")


@app.route("/emotion")
@login_required
def emotion_page():
    return render_template("emotion.html")


@app.route("/voice_interview_page")
@login_required
def voice_interview_page():
    return render_template("voice_interview.html")


@app.route("/aptitude_performance")
@login_required
def aptitude_performance():
    return render_template("aptitude_performance.html")


# =====================================================
# RUN FLASK
# =====================================================
if __name__ == "__main__":
    print("\n🚀 Flask running at:")
    print("👉 http://127.0.0.1:5000")
    print("🎤 Voice Interview Page → http://127.0.0.1:5000/voice_interview_page\n")
    # debug=False avoids reloader clearing sessions
    app.run(debug=False)
