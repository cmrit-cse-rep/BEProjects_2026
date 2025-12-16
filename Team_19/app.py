import os
import sqlite3
import numpy as np
from flask import Flask, render_template, request, redirect, url_for, session, flash
from werkzeug.security import generate_password_hash, check_password_hash

# TensorFlow / Keras imports
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from tensorflow.keras.applications.resnet50 import preprocess_input as res_preprocess
from tensorflow.keras.applications.vgg16 import preprocess_input as vgg_preprocess

# ---------------------------
# FLASK APP INITIALIZATION
# ---------------------------
app = Flask(__name__)
app.secret_key = os.urandom(24)

# ---------------------------
# DATABASE (SQLite3)
# ---------------------------
DB_NAME = "users.db"


def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create users table."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            number TEXT,
            password TEXT NOT NULL,
            location TEXT
        )
        """
    )
    conn.commit()
    cursor.close()
    conn.close()


# ---------------------------
# INIT DB FOR FLASK 3.x
# ---------------------------
with app.app_context():
    init_db()

def login_required():
    if "email" not in session:
        flash("You must log in first", "warning")
        return False
    return True

# ---------------------------
# MODEL CONFIGURATION
# ---------------------------
CLASS_NAMES = ["Chickenpox", "Measles", "MonkeyPox", "Normal"]

MODEL_CONFIG = {
    "resnet": {
        "name": "ResNet50 (Transfer Learning)",
        "path": "resnet50_best.h5",
        "preprocess": "resnet"
    },
    "vgg": {
        "name": "VGG16 (Transfer Learning)",
        "path": "vgg16_best.h5",
        "preprocess": "vgg"
    },
    "hybrid": {
        "name": "Hybrid Model (ResNet50 + VGG16)",
        "path": "hybrid_best.h5",
        "preprocess": "vgg"
    },
    "cnn": {
        "name": "Custom CNN Model",
        "path": "best_cnn_model.h5",
        "preprocess": "cnn"
    }
}

LOADED_MODELS = {}


def get_model(model_key):
    """Load model lazily."""
    if model_key not in MODEL_CONFIG:
        raise ValueError("Invalid model choice")

    if model_key not in LOADED_MODELS:
        path = MODEL_CONFIG[model_key]["path"]
        if not os.path.exists(path):
            raise FileNotFoundError(f"Model file missing: {path}")
        LOADED_MODELS[model_key] = load_model(path)

    return LOADED_MODELS[model_key], MODEL_CONFIG[model_key]["preprocess"]


# ---------------------------
# IMAGE PREPROCESSING
# ---------------------------
def preprocess_image(img_path, preprocess_type, img_size=224):
    img = load_img(img_path, target_size=(img_size, img_size))
    img = img_to_array(img)
    img = np.expand_dims(img, axis=0)

    if preprocess_type == "resnet":
        img = res_preprocess(img)
    elif preprocess_type == "vgg":
        img = vgg_preprocess(img)
    else:
        img = img / 255.0

    return img


# ---------------------------
# HOME REMEDY STEPS
# ---------------------------
REMEDY_STEPS = {
    "Chickenpox": [
        "Stay isolated to avoid spreading infection.",
        "Avoid scratching the blisters.",
        "Use cool baths & calamine lotion.",
        "Drink plenty of fluids.",
        "Consult a doctor if fever is high."
    ],
    "Measles": [
        "Rest in a dim room.",
        "Drink warm fluids to soothe throat.",
        "Use a humidifier to ease cough.",
        "Avoid close contact with others.",
        "Visit a doctor if breathing issues occur."
    ],
    "MonkeyPox": [
        "Self-isolate immediately.",
        "Cover and clean lesions.",
        "Use pain-relief medicines safely.",
        "Stay hydrated.",
        "Seek urgent care if symptoms worsen."
    ],
    "Normal": [
        "Skin seems normal but not a medical diagnosis.",
        "Monitor for any rashes or changes.",
        "Maintain good hygiene.",
        "If discomfort occurs, consult a doctor.",
        "Always get medically verified."
    ]
}


# ---------------------------
# ROUTES
# ---------------------------
@app.route('/')
def home():
    return render_template('home.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        number = request.form.get('number')
        password = request.form.get('password')
        location = request.form.get('location')

        if not (name and email and password):
            flash("Name, Email, Password required", "danger")
            return redirect(url_for('register'))

        hashed = generate_password_hash(password)

        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            cursor.execute(
                'INSERT INTO users (name, email, number, password, location) VALUES (?, ?, ?, ?, ?)',
                (name, email, number, hashed, location)
            )
            conn.commit()
            flash("Registration Successful", "success")
            return redirect(url_for('login'))

        except sqlite3.IntegrityError:
            flash("Email already exists", "danger")

        finally:
            cursor.close()
            conn.close()

    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if user and check_password_hash(user["password"], password):
            session["email"] = user["email"]
            flash("Login Successful", "success")
            return redirect(url_for('home'))
        else:
            flash("Invalid email or password", "danger")

    return render_template('login.html')


@app.route('/logout')
def logout():
    session.clear()
    flash("Logged out", "info")
    return redirect(url_for('login'))


# ---------------------------
# PREDICTION ROUTE
# ---------------------------
@app.route('/predict', methods=['GET', 'POST'])
def predict():
    if not login_required():
        return redirect(url_for('login'))

    if request.method == 'POST':
        model_choice = request.form.get("model_choice")
        image_file = request.files.get("image")

        if not model_choice:
            flash("Select a model", "danger")
            return redirect(url_for('predict'))

        if not image_file:
            flash("Upload an image", "danger")
            return redirect(url_for('predict'))

        upload_folder = "uploads"
        os.makedirs(upload_folder, exist_ok=True)
        img_path = os.path.join(upload_folder, image_file.filename)
        image_file.save(img_path)

        try:
            model, preprocess_type = get_model(model_choice)
            img = preprocess_image(img_path, preprocess_type)
            preds = model.predict(img)[0]

            class_index = int(np.argmax(preds))
            confidence = round(float(preds[class_index] * 100), 2)
            predicted_class = CLASS_NAMES[class_index]
            steps = REMEDY_STEPS[predicted_class]

            return render_template(
                "result.html",
                predicted_class=predicted_class,
                confidence=confidence,
                steps=steps,
                model_name=MODEL_CONFIG[model_choice]["name"]
            )

        except Exception as e:
            print("Error:", e)
            flash("Prediction failed", "danger")
            return redirect(url_for("predict"))

    return render_template("predict.html", models=MODEL_CONFIG)


@app.route('/graphs')
def graphs():
    if not login_required():
        return redirect(url_for('login'))

    img_folder = os.path.join('static', 'images')

    images = [
        f for f in os.listdir(img_folder)
        if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))
    ]

    return render_template('graphs.html', images=images)


# ---------------------------
# RUN APP
# ---------------------------
if __name__ == '__main__':
    os.makedirs("uploads", exist_ok=True)
    app.run(debug=True)
