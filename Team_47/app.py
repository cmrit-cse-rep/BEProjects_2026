import os
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from flask import Flask, render_template, request, redirect, url_for
from werkzeug.utils import secure_filename

# ------------------------------
# Config
# ------------------------------
UPLOAD_FOLDER = "static/uploads/"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "dcm"}
CLASS_NAMES = ["Normal", "Benign", "Malignant"]

# Create folders if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load model
model = load_model("resnet50_lung_cancer.h5")

# Flask app
app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# ------------------------------
# Utility functions
# ------------------------------
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def preprocess_image(img):
    img = cv2.resize(img, (224, 224))
    img = img / 255.0
    img = np.expand_dims(img, axis=0)
    return img

def grad_cam_heatmap(model, img, pred_index=None):
    img_tensor = tf.convert_to_tensor(img)
    last_conv_layer = model.get_layer("conv5_block3_out")  # Adjust for your model
    grad_model = tf.keras.models.Model([model.inputs], [last_conv_layer.output, model.output])
    
    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(img_tensor)
        if pred_index is None:
            pred_index = tf.argmax(predictions[0])
        loss = predictions[:, pred_index]

    grads = tape.gradient(loss, conv_outputs)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
    conv_outputs = conv_outputs[0]
    heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)
    heatmap = tf.maximum(heatmap, 0) / tf.math.reduce_max(heatmap)
    heatmap = cv2.resize(heatmap.numpy(), (img.shape[2], img.shape[1]))
    heatmap = np.uint8(255 * heatmap)
    return heatmap

def predict_and_visualize(image_path):
    # Read image
    img = cv2.imread(image_path)
    if len(img.shape) == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
    orig_img = img.copy()
    
    preprocessed = preprocess_image(img)
    preds = model.predict(preprocessed)
    pred_class = np.argmax(preds)
    class_name = CLASS_NAMES[pred_class]
    prob_scores = {CLASS_NAMES[i]: float(preds[0][i]) for i in range(3)}

    # Grad-CAM
    heatmap = grad_cam_heatmap(model, preprocessed, pred_class)
    heatmap_color = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
    overlayed = cv2.addWeighted(orig_img, 0.7, heatmap_color, 0.3, 0)

    # Draw rectangle
    thresh = cv2.threshold(heatmap, 128, 255, cv2.THRESH_BINARY)[1]
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        color = (0, 255, 0) if class_name=="Normal" else (0, 255, 255) if class_name=="Benign" else (0, 0, 255)
        cv2.rectangle(overlayed, (x, y), (x+w, y+h), color, 2)
        cv2.putText(overlayed, class_name, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
    
    # Save overlayed image
    output_path = os.path.join(UPLOAD_FOLDER, "result.png")
    cv2.imwrite(output_path, overlayed)
    
    return "result.png", prob_scores

# ------------------------------
# Routes

# In predict_and_visualize function, return uploaded filename too
def predict_and_visualize(image_path):
    img = cv2.imread(image_path)
    if len(img.shape) == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
    orig_img = img.copy()
    
    preprocessed = preprocess_image(img)
    preds = model.predict(preprocessed)
    pred_class = np.argmax(preds)
    class_name = CLASS_NAMES[pred_class]
    prob_scores = {CLASS_NAMES[i]: float(preds[0][i]) for i in range(3)}

    heatmap = grad_cam_heatmap(model, preprocessed, pred_class)
    heatmap_color = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
    overlayed = cv2.addWeighted(orig_img, 0.7, heatmap_color, 0.3, 0)

    thresh = cv2.threshold(heatmap, 128, 255, cv2.THRESH_BINARY)[1]
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        color = (0, 255, 0) if class_name=="Normal" else (0, 255, 255) if class_name=="Benign" else (0, 0, 255)
        cv2.rectangle(overlayed, (x, y), (x+w, y+h), color, 2)
        cv2.putText(overlayed, class_name, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
    
    output_path = os.path.join(UPLOAD_FOLDER, "result.png")
    cv2.imwrite(output_path, overlayed)
    
    return "result.png", prob_scores, os.path.basename(image_path)

# Update route
@app.route("/", methods=["GET", "POST"])
def index():
    result_img = None
    prob_scores = None
    uploaded_img = None
    if request.method == "POST":
        if "file" not in request.files:
            return redirect(request.url)
        file = request.files["file"]
        if file.filename == "" or not allowed_file(file.filename):
            return redirect(request.url)
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(filepath)
        result_img, prob_scores, uploaded_img = predict_and_visualize(filepath)
    return render_template("index.html", result_img=result_img, prob_scores=prob_scores, uploaded_img=uploaded_img)

# ------------------------------
# Run app
# ------------------------------
if __name__ == "__main__":
    app.run(debug=True)
