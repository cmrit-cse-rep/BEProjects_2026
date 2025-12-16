# app.py (patched for Render deployment)
# Use USE_CAMERA env var to enable local webcam. On Render, leave unset or set false.

import base64
import io
import os
import json
import random
import atexit
from datetime import timedelta
from PIL import Image as PILImage

from flask import Flask, redirect, render_template, request, jsonify, session, url_for, Response
from flask_cors import CORS

import cv2
import numpy as np
# Try to import mediapipe (server may not have it); fall back gracefully.
try:
    import mediapipe as mp
    MP_AVAILABLE = True
    print("MediaPipe available on server")
except Exception as e:
    mp = None
    MP_AVAILABLE = False
    print("MediaPipe not available on server:", e)


# Optional: TensorFlow is used elsewhere in your app; keep imports ready
try:
    from tensorflow.keras.models import load_model
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import Dense, Flatten, Input
    TF_AVAILABLE = True
except Exception:
    TF_AVAILABLE = False

# -------------------- Directories --------------------
DATA_DIR = "collected_data"
SHAPE_DATA_DIR = "shape_dataset"
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(SHAPE_DATA_DIR, exist_ok=True)

PROGRESS_FILE = "progress.json"

# -------------------- Gesture model (dummy fallback) --------------------
if TF_AVAILABLE:
    model = Sequential([
        Input(shape=(100, 100, 3), name="input_layer"),
        Flatten(),
        Dense(10, activation='softmax')
    ])
else:
    model = None

print("App starting — TF available:", TF_AVAILABLE)

# -------------------- Helper: progress save/load --------------------
def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    return {"stars": 0, "badge_unlocked": False}

def save_progress(data):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(data, f)

def save_user_progress(user_id, data):
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r') as f:
            all_progress = json.load(f)
    else:
        all_progress = {}
    all_progress[user_id] = data
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(all_progress, f, indent=4)

def load_user_progress(user_id):
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r') as f:
            all_progress = json.load(f)
        return all_progress.get(user_id, {})
    return {}

# -------------------- Flask app --------------------
app = Flask(__name__)
CORS(app)
app.secret_key = os.environ.get("FLASK_SECRET", "supersecretkey")
app.permanent_session_lifetime = timedelta(days=1)

# -------------------- Camera control (safe for cloud) --------------------
# Set environment variable USE_CAMERA=true (or "1") on local machine to enable webcam.
# On Render (or any server) leave it unset or set to false.
USE_CAMERA = os.environ.get("USE_CAMERA", "false").lower() in ("1", "true", "yes")

camera = None
if USE_CAMERA:
    try:
        camera = cv2.VideoCapture(0)
        if not camera.isOpened():
            print("Warning: camera could not be opened.")
            camera = None
        else:
            print("Local camera initialized.")
    except Exception as e:
        camera = None
        print("Camera initialization failed:", e)
else:
    print("Camera disabled (USE_CAMERA is false).")

@atexit.register
def _release_camera():
    try:
        if camera is not None:
            camera.release()
            print("Camera released at exit.")
    except Exception:
        pass

# -------------------- Memory-Matching and other pages ----------------------------
@app.route("/games/memory")
def memory_game():
    return render_template("memory_game.html")

@app.route("/games/simon-says")
def simon_says():
    return render_template("simon_says.html")

# -------------------- Utility: base64 -> cv2 image --------------------
def b64_to_cv2(img_b64):
    if ',' in img_b64:
        header, encoded = img_b64.split(',', 1)
    else:
        encoded = img_b64
    data = base64.b64decode(encoded)
    arr = np.frombuffer(data, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise ValueError("Could not decode image")
    if img.ndim == 3 and img.shape[2] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
    return img

# -------------------- Simple gesture-prediction stub --------------------
class_labels = ['one', 'two', 'three', 'four', 'thumbs_down', 'stop', 'nothing']

def predict_gesture(frame):
    # frame: BGR image (numpy)
    if model is None:
        return 'nothing'
    img = cv2.resize(frame, (100, 100))
    img = img.astype('float32') / 255.0
    img = np.expand_dims(img, axis=0)
    preds = model.predict(img)
    gesture = class_labels[np.argmax(preds)]
    return gesture

# -------------------- Video feed generator --------------------
def gen_frames():
    # If no camera (e.g., running on Render), provide a stable blank frame so endpoint works.
    if camera is None:
        blank = np.zeros((480, 640, 3), dtype=np.uint8)
        cv2.putText(blank, 'Camera disabled on server', (10, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255,255,255), 2)
        ret, buffer = cv2.imencode('.jpg', blank)
        frame_bytes = buffer.tobytes()
        while True:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    # Camera is available (local/dev)
    while True:
        success, frame = camera.read()
        if not success:
            # If camera failed mid-run, yield a blank frame to keep stream alive
            blank = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(blank, 'Camera read failed', (10, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255,255,255), 2)
            ret, buffer = cv2.imencode('.jpg', blank)
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            continue
        frame = cv2.flip(frame, 1)
        gesture = predict_gesture(frame)
        cv2.putText(frame, f'Gesture: {gesture}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)
        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

# -------------------- Shape recognition endpoints --------------------
@app.route('/sketch')
def sketch():
    return render_template('sketch.html')

@app.route('/api/save_sample', methods=['POST'])
def save_shape_sample():
    data = request.json
    img_b64 = data.get('image')
    label = data.get('label', 'unknown')
    if not img_b64:
        return jsonify({'error': 'no image provided'}), 400
    folder = os.path.join(SHAPE_DATA_DIR, label)
    os.makedirs(folder, exist_ok=True)
    try:
        img = b64_to_cv2(img_b64)
    except Exception as e:
        return jsonify({'error': 'bad image', 'detail': str(e)}), 400
    fname = f"{label}_{random.randint(1000,9999)}.png"
    path = os.path.join(folder, fname)
    cv2.imwrite(path, img)
    return jsonify({'path': path})

@app.route('/api/recognize', methods=['POST'])
def recognize_shape():
    data = request.json
    img_b64 = data.get('image')
    if not img_b64:
        return jsonify({'error': 'no image provided'}), 400
    try:
        img = b64_to_cv2(img_b64)
    except Exception as e:
        return jsonify({'error': 'bad image', 'detail': str(e)}), 400

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (7,7), 0)
    _, th = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    contours, _ = cv2.findContours(th, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return jsonify({})

    c = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(c)
    if area < 1000:
        return jsonify({})

    H, W = img.shape[:2]
    x,y,w,h = cv2.boundingRect(c)
    norm_x, norm_y, norm_w, norm_h = x/W, y/H, w/W, h/H

    peri = cv2.arcLength(c, True)
    approx = cv2.approxPolyDP(c, 0.03 * peri, True)

    shape = 'unknown'
    params = {}

    circularity = (4 * np.pi * area) / (peri*peri + 1e-9)

    if len(approx) == 3:
        shape = 'triangle'
        pts = approx.reshape(-1,2).tolist()
        params['points'] = [{'x': p[0]/W, 'y': p[1]/H} for p in pts]
    elif len(approx) == 4:
        ar = w / float(h)
        shape = 'square' if 0.9 <= ar <= 1.1 else 'rectangle'
        params = {'x': norm_x, 'y': norm_y, 'w': norm_w, 'h': norm_h}
    else:
        if circularity > 0.6:
            shape = 'circle'
            (cx,cy), radius = cv2.minEnclosingCircle(c)
            params = {'cx': cx/W, 'cy': cy/H, 'r': radius / max(W,H)}
        else:
            if len(approx) > 4 and len(approx) < 10:
                shape = 'polygon'
                params = {'x': norm_x, 'y': norm_y, 'w': norm_w, 'h': norm_h}
            else:
                shape = 'unknown'

    return jsonify({'shape': shape, 'params': params})

# -------------------- Other app endpoints --------------------
@app.route('/api/meta', methods=['GET'])
def meta():
    return jsonify({"project":"Gesture Learning Demo","version":"1.0","status":"running"})

users = []
@app.route('/api/user', methods=['POST'])
def create_user():
    data = request.get_json() or {}
    user_id = len(users) + 1
    user = {"id": user_id, "name": data.get("name"), "age": data.get("age")}
    users.append(user)
    return jsonify(user)

@app.route('/api/gesture/predict', methods=['POST'])
def gesture_predict():
    """
    Accepts JSON:
    - {"label": "thumbs_up"}  OR
    - {"landmarks": [...]}  OR
    - (if client sends images) {"image": "data:image/png;base64,..."}  (not used here)
    Returns JSON: { "label": "...", "source": "client" } or processed result.
    """
    data = request.get_json() or {}
    # If client sent a precomputed label:
    if 'label' in data:
        return jsonify({"label": data['label'], "source": "client"})

    # If client sent landmarks and you want server-side logic:
    if 'landmarks' in data:
        landmarks = data['landmarks']
        # you could implement a classifier using landmarks here
        # For now, return the raw landmarks as an acknowledgement:
        return jsonify({"label": "from_landmarks", "landmark_count": len(landmarks), "source": "client_landmarks"})

    # Fallback if server has mediapipe and image processing is desired:
    if MP_AVAILABLE and 'image' in data:
        # (optional) decode image and run mediapipe server-side
        # left as future work
        return jsonify({"error": "server-side image processing not implemented"}), 501

    return jsonify({"error": "no valid input provided"}), 400

@app.route('/api/data/save', methods=['POST'])
def save_data_landmarks():
    data = request.json or {}
    label = data.get('label')
    landmarks = data.get('landmarks')
    if not label or not landmarks:
        return jsonify({"error": "Missing label or landmarks"}), 400
    label_dir = os.path.join(DATA_DIR, label)
    os.makedirs(label_dir, exist_ok=True)
    existing_files = [f for f in os.listdir(label_dir) if f.endswith('.json')]
    sample_id = len(existing_files) + 1
    filepath = os.path.join(label_dir, f"sample_{sample_id}.json")
    with open(filepath, 'w') as f:
        json.dump({'landmarks': landmarks, 'label': label}, f)
    return jsonify({'message': 'Sample saved', 'filepath': filepath}), 200

# Video feed endpoints
@app.route('/')
def index():
    return render_template('home.html')

@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/get_gesture')
def get_gesture():
    return jsonify({'gesture': 'none'})

@app.route('/gesture_control', methods=['POST'])
def gesture_control_file():
    if 'frame' not in request.files:
        return jsonify({'error': 'No frame provided'}), 400
    file = request.files['frame']
    img = PILImage.open(file.stream).convert('RGB')
    img = np.array(img)[:, :, ::-1]  # to BGR
    gesture = predict_gesture(img)
    return jsonify({'gesture': gesture})

# -------------------- Math & emotion quiz endpoints --------------------
if MP_AVAILABLE:
    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=1,
        min_detection_confidence=0.5
    )
else:
    mp_hands = None
    hands = None
    print("MediaPipe HANDS disabled on server (MP_AVAILABLE=False)")

@app.route('/api/new_math_question')
def new_math_question():
    def generate_math_question():
        num1 = random.randint(1, 10)
        num2 = random.randint(1, 10)
        operation = random.choice(['+', '-', '*'])
        if operation == '+':
            correct_answer = num1 + num2
            question = f"What is {num1} + {num2}?"
        elif operation == '-':
            correct_answer = num1 - num2
            question = f"What is {num1} - {num2}?"
        else:
            correct_answer = num1 * num2
            question = f"What is {num1} * {num2}?"
        options = [correct_answer,
                   correct_answer + random.randint(1, 3),
                   correct_answer - random.randint(1, 3),
                   random.randint(1, 20)]
        random.shuffle(options)
        return {"question": question, "options": options, "correct_answer": correct_answer}
    return jsonify(generate_math_question())

@app.route('/games/math_quiz')
def math_quiz():
    question = {
        'question': 'Loading...',
        'options': ['-','-','-','-'],
        'correct_answer': None
    }
    return render_template('math_quiz.html', question=question)

@app.route('/games/emotion-quiz')
def quiz_alias():
    return redirect(url_for('emotion_quiz'))

@app.route('/quiz/emotion')
def emotion_quiz():
    if 'score' not in session:
        session['score'] = 0
    questions = [
        {"text": "Your friend gives you a surprise gift. How do you feel?", "image": "questions/happy_gift.png", "options": ["Sad","Angry","Happy","Scared"], "answer": "Happy"},
        {"text": "You lost your toy at the park. How do you feel?", "image": "questions/lost_toy.png", "options": ["Excited","Surprised","Sad","Happy"], "answer": "Sad"},
        {"text": "You are about to go on stage to perform. What might you feel?", "image": "questions/stage.png", "options": ["Scared","Excited","Sleepy","Bored"], "answer": "Scared"}
    ]
    question = random.choice(questions)
    session['answer'] = question['answer']
    return render_template('emotion_quiz.html', question=question, score=session['score'])

@app.route('/quiz/emotion/submit', methods=['POST'])
def emotion_submit():
    answer = request.form.get('answer')
    if answer == session.get('answer'):
        session['score'] = session.get('score', 0) + 1
    return redirect(url_for('emotion_quiz'))

# Additional page endpoints required by templates
@app.route('/gesture')
def gesture_page():
    try:
        return render_template('gesture.html')
    except Exception:
        return "<h3>Gesture learning page coming soon.</h3><p>Visit /gesture_control or use the Sketch & Quizzes for hands-on practice.</p>"

@app.route('/progress')
def progress_page():
    user_id = "child_1"
    user_data = load_user_progress(user_id)
    try:
        return render_template('progress.html', user=user_data)
    except Exception:
        return jsonify(user_data)

@app.route('/games/face-match')
def face_match():
    items = [
        {"image": "images/emotions/happy.png", "name": "Happy"},
        {"image": "images/emotions/sad.png", "name": "Sad"},
        {"image": "images/emotions/angry.png", "name": "Angry"},
        {"image": "images/emotions/surprised.png", "name": "Surprised"}
    ]
    images = random.sample(items, len(items))
    words = [item["name"] for item in images]
    random.shuffle(words)
    progress = load_progress()
    try:
        return render_template('face_match.html', images=images, words=words, badge=progress.get("badge_unlocked", False))
    except Exception:
        return jsonify({"images": images, "words": words, "badge": progress.get("badge_unlocked", False)})

@app.route('/games/color-match')
def color_match():
    colors = [
        {"name": "Red", "code": "#FF0000"},
        {"name": "Green", "code": "#00FF00"},
        {"name": "Blue", "code": "#0000FF"},
        {"name": "Yellow", "code": "#FFFF00"},
        {"name": "Purple", "code": "#800080"},
    ]
    target_color = random.choice(colors)
    options = random.sample(colors, 3)
    if target_color not in options:
        options[random.randint(0, 2)] = target_color
    try:
        return render_template('color_match.html', target=target_color, options=options)
    except Exception:
        return jsonify({"target": target_color, "options": options})

@app.route('/sketch-demo')
def sketch_demo_redirect():
    return redirect(url_for('sketch'))

@app.route('/games')
def games():
    try:
        return render_template('games.html')
    except Exception:
        return "<h3>Games</h3><p>Open /games/math_quiz, /quiz/emotion, /sketch etc.</p>"

@app.route('/activities')
def activities():
    try:
        return render_template('activities.html')
    except Exception:
        return "<h3>Activities</h3><p>Various activities will appear here.</p>"

# -------------------- Health endpoint --------------------
@app.route('/health')
def health():
    return 'ok', 200

# -------------------- Run (for local development) --------------------
if __name__ == '__main__':
    try:
        # If you want to enable camera locally, run with USE_CAMERA=true
        app.run(host='0.0.0.0', port=5000, debug=True)
    finally:
        try:
            if camera is not None:
                camera.release()
        except Exception:
            pass
