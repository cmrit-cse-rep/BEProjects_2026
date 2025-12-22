# backend/app.py
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from preprocess import preprocess_csv

app = Flask(__name__, static_folder="static", static_url_path="/static")
CORS(app)

@app.route("/")
def index():
    # Serves backend/static/index.html
    return send_from_directory(app.static_folder, "index.html")

@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    temp_file = os.path.join("temp_" + file.filename)
    file.save(temp_file)

    try:
        df = preprocess_csv(temp_file)
        preview = [df.columns.tolist()] + df.head(10).values.tolist()
        shape = [int(df.shape[0]), int(df.shape[1])]

        return jsonify({
            "shape": shape,
            "preview": preview
        })
    finally:
        # cleanup
        try:
            os.remove(temp_file)
        except Exception:
            pass

if __name__ == "__main__":
    app.run(debug=True, port=5000)
