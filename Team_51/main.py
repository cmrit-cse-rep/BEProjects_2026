# app.py (Flask + Grad-CAM - full)
import os
from datetime import datetime
from functools import wraps
import cv2
import numpy as np
import tensorflow as tf

from flask import Flask, render_template, request, send_from_directory, redirect, url_for, flash, session
from werkzeug.utils import secure_filename
from tensorflow.keras.models import load_model, Model
from tensorflow.keras.applications import VGG16
from tensorflow.keras.layers import Flatten, Dense, Dropout
from keras.preprocessing.image import load_img, img_to_array
from PIL import Image

try:
    from matplotlib import cm as mpl_cm
except Exception:
    mpl_cm = None

import database as db

# ---------------------------
# Config
# ---------------------------
APP_ROOT = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(APP_ROOT, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXT = {'png', 'jpg', 'jpeg'}
MODEL_PATH = os.path.join(APP_ROOT, 'models', 'vgg16_brain_tumor.h5')

# Make both prediction and Grad-CAM use 224x224 (VGG16 base)
IMAGE_SIZE = 224
GRADCAM_INPUT_SIZE = 224

# ---------------------------
# Flask init
# ---------------------------
app = Flask(__name__)
app.secret_key = 'a_secret_key'  # replace for production
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# ---------------------------
# Database init
# ---------------------------
db.init_db()

# ---------------------------
# Auth decorator
# ---------------------------
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'username' not in session:
            flash('Please log in to access this page.', 'danger')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# ---------------------------
# Load sequential model (used for prediction)
# ---------------------------
seq_model = None
try:
    seq_model = load_model(MODEL_PATH)
    print("Sequential model loaded from:", MODEL_PATH)
except Exception as e:
    print(f"Error loading sequential model from {MODEL_PATH}: {e}")
    seq_model = None

# ---------------------------
# Rebuild VGG16 functional model (for Grad-CAM) and try to load weights
# ---------------------------
func_model = None
last_conv_layer = None
FUNC_WEIGHTS_LOADED = False
try:
    base_model = VGG16(weights='imagenet', include_top=False, input_shape=(GRADCAM_INPUT_SIZE, GRADCAM_INPUT_SIZE, 3))
    # Freeze all but last 4 layers (same as in Colab)
    for layer in base_model.layers[:-4]:
        layer.trainable = False

    x = Flatten()(base_model.output)
    x = Dense(256, activation='relu')(x)
    x = Dropout(0.5)(x)
    output = Dense(4, activation='softmax')(x)  # change if number of classes differs
    func_model = Model(inputs=base_model.input, outputs=output)

    if seq_model is not None:
        try:
            func_model.set_weights(seq_model.get_weights())
            FUNC_WEIGHTS_LOADED = True
            print("✅ Functional VGG16 rebuilt and weights loaded from sequential model.")
        except Exception as e:
            FUNC_WEIGHTS_LOADED = False
            print("⚠️ Could not transfer weights to functional VGG16 (shapes differ).", e)

    # pick last conv layer from base_model
    for layer in reversed(base_model.layers):
        if 'conv' in layer.name:
            last_conv_layer = layer
            break
    if last_conv_layer is not None:
        print("✅ Last conv layer (VGG16 base):", last_conv_layer.name)
    else:
        print("⚠️ No conv layer found in reconstructed VGG16 base.")
except Exception as e:
    print("Could not build VGG16 functional model:", e)
    func_model = None
    last_conv_layer = None
    FUNC_WEIGHTS_LOADED = False

# ---------------------------
# Labels - ensure order matches your training labels
# ---------------------------
class_labels = ['glioma', 'meningioma', 'notumor', 'pituitary']

# ---------------------------
# Utilities
# ---------------------------
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXT

def unique_filename(original_name: str) -> str:
    base = secure_filename(original_name)
    name, ext = os.path.splitext(base)
    ts = datetime.now().strftime('%Y%m%d_%H%M%S%f')
    return f"{name}_{ts}{ext}"

# ---------------------------
# Prediction (uses IMAGE_SIZE which is 224)
# ---------------------------
def predict_tumor(image_path):
    if seq_model is None:
        return "Model not available.", 0.0

    try:
        img = load_img(image_path, target_size=(IMAGE_SIZE, IMAGE_SIZE))
        img_array = img_to_array(img).astype('float32') / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        preds = seq_model.predict(img_array)
        print("Debug - raw predictions:", preds.tolist())
        predicted_class_index = int(np.argmax(preds, axis=1)[0])
        confidence_score = float(np.max(preds, axis=1)[0])

        label = class_labels[predicted_class_index] if 0 <= predicted_class_index < len(class_labels) else str(predicted_class_index)
        if label == 'notumor':
            return "No Tumor", confidence_score
        else:
            return f"Tumor: {label}", confidence_score
    except Exception as e:
        print("Prediction error:", repr(e))
        return "Prediction error", 0.0

# ---------------------------
# Grad-CAM helpers
# ---------------------------
def prepare_image_for_model_cv_from_bgr(img_bgr, target_size=GRADCAM_INPUT_SIZE):
    """Take BGR numpy image (cv2) -> RGB resize -> scale 0..1 -> return (1,H,W,3)"""
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    img_resized = cv2.resize(img_rgb, (target_size, target_size))
    img_array = np.expand_dims(img_resized.astype(np.float32) / 255.0, axis=0)
    return img_array

def make_gradcam_heatmap(img_tensor, model_for_gradcam, last_conv_layer_local):
    """Colab-style heatmap: model_for_gradcam must accept input shape of img_tensor"""
    grad_model = Model(inputs=model_for_gradcam.input, outputs=[last_conv_layer_local.output, model_for_gradcam.output])
    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(img_tensor)
        pred_index = tf.argmax(predictions[0])
        class_channel = predictions[:, pred_index]
    grads = tape.gradient(class_channel, conv_outputs)
    pooled_grads = tf.reduce_mean(grads, axis=(0,1,2))
    conv_outputs = conv_outputs[0]  # H x W x channels
    heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)
    heatmap = tf.maximum(heatmap, 0)
    max_val = tf.math.reduce_max(heatmap)
    if tf.math.equal(max_val, 0.0):
        heatmap = tf.zeros_like(heatmap)
    else:
        heatmap = heatmap / max_val
    return heatmap.numpy(), int(pred_index.numpy())

def overlay_and_save_cv(orig_bgr, heatmap_2d, out_path, alpha=0.45, cmap=cv2.COLORMAP_JET):
    """
    Simpler high-contrast overlay:
      - heatmap_2d: 2D float array in [0,1]
      - orig_bgr: original BGR image (cv2.imread)
      - saves RGBA/PNG overlay to out_path
    """
    try:
        h, w = orig_bgr.shape[:2]
        hm_uint8 = np.uint8(255 * np.clip(heatmap_2d, 0, 1))
        heatmap_color = cv2.applyColorMap(hm_uint8, cmap)  # BGR colors
        heatmap_color = cv2.resize(heatmap_color, (w, h), interpolation=cv2.INTER_LINEAR)
        # Blend
        blended = cv2.addWeighted(orig_bgr, 1.0 - alpha, heatmap_color, alpha, 0)
        # Save as PNG
        cv2.imwrite(out_path, blended)
        return out_path
    except Exception as e:
        print("overlay_and_save_cv error:", e)
        return None

# ---------------------------
# Master Grad-CAM generator
# ---------------------------
def generate_gradcam(image_path, keras_model, output_path):
    """
    Try in order:
      1) functional VGG16 (func_model + last_conv_layer) if weights loaded
      2) fallback conv-layer CAM on the provided keras_model (seq_model)
      3) saliency (input-gradient) fallback
    Returns path to saved overlay PNG or None
    """
    print("generate_gradcam: starting for", image_path)
    # Helper to save overlay using cv2 overlay method
    def _save_overlay_from_heatmap(hm2d):
        orig_bgr = cv2.imread(image_path)
        if orig_bgr is None:
            print("cv2.imread failed for", image_path)
            return None
        return overlay_and_save_cv(orig_bgr, hm2d, output_path, alpha=0.45)

    # 1) Preferred: use reconstructed func_model (requires functional weights loaded)
    if func_model is not None and last_conv_layer is not None and FUNC_WEIGHTS_LOADED:
        try:
            bgr = cv2.imread(image_path)
            if bgr is None:
                raise RuntimeError("cv2.imread failed for image_path")
            x = prepare_image_for_model_cv_from_bgr(bgr, target_size=GRADCAM_INPUT_SIZE)
            heatmap, pred_idx = make_gradcam_heatmap(x, func_model, last_conv_layer)
            out = _save_overlay_from_heatmap(heatmap)
            if out:
                print(f"Grad-CAM (VGG functional) created -> {out}; pred_idx={pred_idx}")
                return out
            else:
                print("VGG functional gradcam produced no output after overlay.")
        except Exception as e:
            print("VGG functional Grad-CAM failed:", repr(e))

    # 2) Fallback: find last conv layer in keras_model and compute CAM
    try:
        # nested recursive search
        def _find_last_conv_layer_recursive(keras_m):
            last_found = None
            for layer in keras_m.layers:
                if isinstance(layer, tf.keras.Model):
                    nested_last = _find_last_conv_layer_recursive(layer)
                    if nested_last is not None:
                        last_found = nested_last
                try:
                    if isinstance(layer, tf.keras.layers.Conv2D):
                        last_found = layer
                except Exception:
                    continue
            return last_found

        last_conv = None
        if keras_model is not None:
            try:
                last_conv = keras_model.get_layer('block5_conv3')
            except Exception:
                last_conv = None

            if last_conv is None:
                eligible = []
                for layer in keras_model.layers:
                    try:
                        out = layer.output
                        if hasattr(out, 'shape') and len(out.shape) == 4:
                            eligible.append(layer)
                    except Exception:
                        continue
                if eligible:
                    last_conv = eligible[-1]

            if last_conv is None:
                last_conv = _find_last_conv_layer_recursive(keras_model)

        if last_conv is not None:
            print("Fallback conv chosen:", getattr(last_conv, 'name', 'unknown'))
            # prepare input at IMAGE_SIZE (used for seq_model)
            pil = load_img(image_path, target_size=(IMAGE_SIZE, IMAGE_SIZE))
            arr = img_to_array(pil).astype('float32') / 255.0
            inp = np.expand_dims(arr, axis=0)
            tf_input = tf.convert_to_tensor(inp)
            grad_model = tf.keras.models.Model([keras_model.inputs], [last_conv.output, keras_model.output])
            with tf.GradientTape() as tape:
                conv_outputs, predictions = grad_model(tf_input, training=False)
                tape.watch(conv_outputs)
                pred_index = tf.argmax(predictions[0])
                class_channel = predictions[:, pred_index]
            grads = tape.gradient(class_channel, conv_outputs)
            if grads is None:
                raise RuntimeError('gradients are None in fallback conv path')
            pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
            conv_outputs = conv_outputs[0]
            heatmap = tf.reduce_sum(tf.multiply(pooled_grads, conv_outputs), axis=-1)
            heatmap = tf.maximum(heatmap, 0)
            denom = tf.reduce_max(heatmap)
            heatmap = heatmap / (denom + 1e-8)
            heatmap = heatmap.numpy()
            out = _save_overlay_from_heatmap(heatmap)
            if out:
                print("Grad-CAM (fallback conv) generated ->", out)
                return out
            else:
                print("Fallback conv produced no overlay output.")
    except Exception as e:
        print("Fallback conv error:", repr(e))

    # 3) Last-resort: input-gradient saliency
    try:
        print("Trying saliency fallback...")
        pil = load_img(image_path, target_size=(IMAGE_SIZE, IMAGE_SIZE))
        arr = img_to_array(pil).astype('float32') / 255.0
        inp = np.expand_dims(arr, axis=0)
        tf_input = tf.convert_to_tensor(inp)
        with tf.GradientTape() as tape:
            tape.watch(tf_input)
            preds = keras_model(tf_input, training=False)
            pred_index = tf.argmax(preds[0])
            class_channel = preds[:, pred_index]
        grads = tape.gradient(class_channel, tf_input)
        if grads is None:
            raise RuntimeError("Saliency gradients are None")
        heatmap = tf.reduce_mean(tf.abs(grads), axis=-1)[0]
        heatmap = tf.maximum(heatmap, 0)
        heatmap = heatmap / (tf.reduce_max(heatmap) + 1e-8)
        heatmap = heatmap.numpy()
        out = _save_overlay_from_heatmap(heatmap)
        if out:
            print("Grad-CAM (saliency) generated ->", out)
            return out
    except Exception as e:
        print("Saliency fallback error:", repr(e))

    print("All Grad-CAM attempts failed for", image_path)
    return None

# ---------------------------
# Routes
# ---------------------------
@app.route('/')
def root():
    if 'username' in session:
        return redirect(url_for('home'))
    else:
        return redirect(url_for('login'))

@app.route('/home')
@login_required
def home():
    return render_template('home.html')

@app.route('/about')
@login_required
def about():
    return render_template('about.html')

@app.route('/detect', methods=['GET', 'POST'])
@login_required
def detect_route():
    if request.method == 'POST':
        patient_name = request.form.get('patient_name', '')
        patient_age = request.form.get('patient_age', '')
        patient_gender = request.form.get('patient_gender', '')

        file = request.files.get('file')
        if not file or file.filename == '':
            flash('No file selected.', 'danger')
            return render_template('index.html', result=None, patient_name=patient_name, patient_age=patient_age, patient_gender=patient_gender)

        if not allowed_file(file.filename):
            flash('Allowed file types: png, jpg, jpeg', 'danger')
            return render_template('index.html', result=None)

        new_filename = unique_filename(file.filename)
        file_location = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        file.save(file_location)

        result, confidence = predict_tumor(file_location)
        report_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # Generate Grad-CAM only when a tumor is predicted (optional)
        gradcam_filename = f"gradcam_{os.path.splitext(new_filename)[0]}.png"
        gradcam_fs_path = os.path.join(app.config['UPLOAD_FOLDER'], gradcam_filename)
        out_path = None
        if result and "Tumor:" in result:
            out_path = generate_gradcam(file_location, seq_model if seq_model is not None else func_model, gradcam_fs_path)
        else:
            # Optionally still generate for "No Tumor" mapping if you want to visualize
            print("Skipping Grad-CAM generation because model predicted 'No Tumor' or prediction failed.")

        gradcam_web_path = None
        if out_path and os.path.exists(out_path):
            gradcam_web_path = f"/uploads/{os.path.basename(out_path)}"
            print(f'Grad-CAM ready for web at {gradcam_web_path}')
        else:
            print(f'Grad-CAM not generated for {new_filename}. out_path={out_path}, exists={os.path.exists(gradcam_fs_path)}')

        return render_template(
            'index.html',
            result=result,
            confidence=f"{confidence*100:.2f}%",
            file_path=f'/uploads/{new_filename}',
            file_name=new_filename,
            patient_name=patient_name,
            patient_age=patient_age,
            patient_gender=patient_gender,
            report_time=report_time,
            gradcam_path=gradcam_web_path
        )

    return render_template('index.html', result=None)

@app.route('/uploads/<filename>')
def get_uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = db.get_user(username)
        if user and user[2] == password:
            session['username'] = user[1]
            flash('Login successful!', 'success')
            return redirect(url_for('home'))
        else:
            flash('Invalid username or password.', 'danger')
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if db.add_user(username, password):
            flash('Registration successful! Please log in.', 'success')
            return redirect(url_for('login'))
        else:
            flash('Username already exists.', 'danger')
    return render_template('signup.html')

@app.route('/logout')
def logout():
    session.pop('username', None)
    flash('You have been logged out.', 'info')
    return redirect(url_for('login'))

# ---------------------------
# Run
# ---------------------------
if __name__ == '__main__':
    app.run(debug=True)
