import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend for headless environments

from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import pandas as pd

# DeepForest import (latest version)
from deepforest import main

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Enable CORS for all routes

print("Loading models...")

# ------------------- FOREST SEGMENTATION -------------------
forest_model = tf.keras.models.load_model('forest_segmentation_best.h5', compile=False)

# ------------------- PLANT SPECIES -------------------
plant_model = tf.keras.models.load_model('mangrove_species_best.h5', compile=False)
with open('mangrove_class_names.txt', 'r') as f:
    plant_classes = [line.strip() for line in f.readlines()]

# ------------------- TREE COUNTING (DeepForest) -------------------
tree_model = main.deepforest()  # Latest API
print("Loading DeepForest pretrained weights...")

print("DeepForest model loaded!")

# ------------------- FOREST COVER ROUTE -------------------
@app.route('/analyze/forest', methods=['POST'])
def analyze_forest():
    try:
        file = request.files['image']
        img = Image.open(io.BytesIO(file.read())).convert('RGB')
        img = img.resize((224, 224))
        img_array = np.expand_dims(np.array(img) / 255.0, axis=0)

        prediction = forest_model.predict(img_array)[0]
        forest_pixels = np.sum(prediction > 0.5)
        total_pixels = prediction.shape[0] * prediction.shape[1]
        percentage = float(forest_pixels / total_pixels * 100)

        return jsonify({
            'forest_coverage': round(percentage, 1),
            'non_forest': round(100 - percentage, 1),
            'total_pixels': int(total_pixels)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ------------------- PLANT SPECIES ROUTE -------------------
@app.route('/analyze/plant', methods=['POST'])
def analyze_plant():
    try:
        file = request.files['image']
        img = Image.open(io.BytesIO(file.read())).convert('RGB')
        img = img.resize((224, 224))
        img_array = np.expand_dims((np.array(img).astype('float32') / 127.5 - 1.0), axis=0)

        predictions = plant_model.predict(img_array)[0]
        top_3 = np.argsort(predictions)[-3:][::-1]

        results = [{'class': plant_classes[idx], 'confidence': float(predictions[idx] * 100)} for idx in top_3]

        return jsonify({'predictions': results})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ------------------- TREE COUNTING ROUTE (DeepForest) -------------------
# ------------------- TREE COUNTING ROUTE (DeepForest) -------------------
@app.route('/analyze/trees', methods=['POST'])
def analyze_trees():
    try:
        # Read image from request and convert to NumPy array
        file = request.files['image']
        img = Image.open(file.stream).convert("RGB")
        img_np = np.array(img).astype("float32")

        # Run DeepForest prediction
        predictions: pd.DataFrame = tree_model.predict_image(img_np)

        # Parse detections
        detections = []
        for _, row in predictions.iterrows():
            x_min, y_min, x_max, y_max = float(row['xmin']), float(row['ymin']), float(row['xmax']), float(row['ymax'])
            score, label = float(row['score']), str(row['label'])

            # Ignore very small boxes (optional)
            if (x_max - x_min) < 10 or (y_max - y_min) < 10:
                continue

            detections.append({
                "xmin": x_min,
                "ymin": y_min,
                "xmax": x_max,
                "ymax": y_max,
                "confidence": score,
                "class": label
            })

        # Return only the count and optional detection boxes
        return jsonify({
            "tree_count": len(detections),
            "detections": detections
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500



# ------------------- MAIN -------------------
if __name__ == '__main__':
    app.run(port=5000, debug=True)
