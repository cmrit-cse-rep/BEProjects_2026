from flask import Flask, request, jsonify, render_template
from tensorflow.keras.models import load_model
import numpy as np
from PIL import Image
import os

app = Flask(__name__)

model = load_model("FinalMP_model.keras")

class_indices = np.load("final_classes.npy", allow_pickle=True).item()
index_to_class = {v: k for k, v in class_indices.items()}

IMG_SIZE = (224, 224)

@app.get("/")
def home():
    return render_template("index.html")

@app.post("/predict")
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file key in request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    temp_path = "temp.jpg"
    file.save(temp_path)

    try:
        img = Image.open(temp_path).convert("RGB").resize(IMG_SIZE)
        arr = np.array(img) / 255.0
        arr = np.expand_dims(arr, axis=0)

        pred = model.predict(arr, verbose=0)
        idx = int(np.argmax(pred))
        class_name = str(index_to_class.get(idx, "Unknown"))

        return jsonify({"prediction": class_name})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == "__main__":
    app.run(debug=True,host='0.0.0.0', port=5000)
