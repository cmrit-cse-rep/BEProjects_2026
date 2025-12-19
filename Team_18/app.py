from __future__ import annotations

import os
import math
import random
from typing import Dict, Any, Optional, List

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from geopy.geocoders import Nominatim
import joblib
import numpy as np
from PIL import Image
from model.image_features import extract_image_features

app = Flask(__name__)
CORS(app)

geocoder = Nominatim(user_agent="landslide-risk-app")

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "risk_model.joblib")
IMAGE_MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "image_model.joblib")
_loaded_artifact: Optional[Dict[str, Any]] = None
if os.path.exists(MODEL_PATH):
    try:
        _loaded_artifact = joblib.load(MODEL_PATH)
        app.logger.info("Loaded ML model from %s", MODEL_PATH)
    except Exception as exc:
        app.logger.warning("Failed to load model: %s", exc)
        _loaded_artifact = None

_loaded_image_artifact: Optional[Dict[str, Any]] = None
if os.path.exists(IMAGE_MODEL_PATH):
    try:
        _loaded_image_artifact = joblib.load(IMAGE_MODEL_PATH)
        app.logger.info("Loaded image model from %s", IMAGE_MODEL_PATH)
    except Exception as exc:
        app.logger.warning("Failed to load image model: %s", exc)
        _loaded_image_artifact = None

SOIL_TYPES = ["Clay", "Sandy", "Loamy", "Silt", "Peaty", "Chalky"]
SOIL_RISK_FACTOR = {
    "Clay": 1.10,
    "Sandy": 0.90,
    "Loamy": 1.00,
    "Silt": 1.05,
    "Peaty": 1.15,
    "Chalky": 0.95,
}

# Hardcoded dummy outputs for quick demos
DUMMY_RESPONSES = {
    "darjeeling": {
        "location": "Darjeeling",
        "latitude": 27.041000,
        "longitude": 88.266000,
        "rainfall_mm": 320.5,
        "slope_deg": 28.6,
        "vegetation_index": 0.42,
        "soil_type": "Loamy",
        "risk_level": "High",
        "risk_score": 0.82,
        "history": [
            {"date": "2017-06-12", "casualties": 4, "description": "Rain-triggered landslide near hillside settlement."},
            {"date": "2019-08-03", "casualties": 0, "description": "Small slide after continuous rainfall."}
        ],
    },
    # Support both spellings
    "bangalore": {
        "location": "Bangalore",
        "latitude": 12.971600,
        "longitude": 77.594600,
        "rainfall_mm": 110.3,
        "slope_deg": 5.2,
        "vegetation_index": 0.55,
        "soil_type": "Sandy",
        "risk_level": "Low",
        "risk_score": 0.28,
        "history": [],
    },
    "bengaluru": {
        "location": "Bangalore",
        "latitude": 12.971600,
        "longitude": 77.594600,
        "rainfall_mm": 110.3,
        "slope_deg": 5.2,
        "vegetation_index": 0.55,
        "soil_type": "Sandy",
        "risk_level": "Low",
        "risk_score": 0.28,
        "history": [],
    },
    "mysore": {
        "location": "Mysore",
        "latitude": 12.295800,
        "longitude": 76.639400,
        "rainfall_mm": 220.8,
        "slope_deg": 12.3,
        "vegetation_index": 0.38,
        "soil_type": "Silt",
        "risk_level": "Medium",
        "risk_score": 0.57,
        "history": [
            {"date": "2018-09-21", "casualties": 0, "description": "Localized slope slip after heavy showers."}
        ],
    },
    "mysuru": {
        "location": "Mysore",
        "latitude": 12.295800,
        "longitude": 76.639400,
        "rainfall_mm": 220.8,
        "slope_deg": 12.3,
        "vegetation_index": 0.38,
        "soil_type": "Silt",
        "risk_level": "Medium",
        "risk_score": 0.57,
        "history": [
            {"date": "2018-09-21", "casualties": 0, "description": "Localized slope slip after heavy showers."}
        ],
    },
}

def stable_rng(lat: float, lon: float) -> random.Random:
    seed = int((lat + 90.0) * 1000) * 100000 + int((lon + 180.0) * 1000)
    return random.Random(seed)

def simulate_environment(lat: float, lon: float) -> Dict[str, float | str]:
    rng = stable_rng(lat, lon)
    rainfall = rng.uniform(50.0, 500.0)
    slope = min(60.0, max(0.0, abs(math.sin(math.radians(lat)) * 40.0 + rng.uniform(-5.0, 5.0) + 15.0)))
    vegetation = min(1.0, max(0.0, rng.uniform(0.1, 0.9)))
    soil = rng.choice(SOIL_TYPES)
    return {
        "rainfall_mm": round(rainfall, 1),
        "slope_deg": round(slope, 1),
        "vegetation_index": round(vegetation, 2),
        "soil_type": soil,
    }

def rule_based_risk(rainfall_mm: float, slope_deg: float, vegetation_index: float, soil_type: str) -> Dict[str, Any]:
    soil_factor = SOIL_RISK_FACTOR.get(soil_type, 1.0)
    rainfall_component = (rainfall_mm / 500.0)  # 0..1
    slope_component = (slope_deg / 60.0)        # 0..1
    vegetation_component = (1.0 - vegetation_index)  # 0..1
    weighted_score = (
        0.45 * rainfall_component +
        0.35 * slope_component +
        0.20 * vegetation_component
    ) * soil_factor
    risk_level = "Low"
    if weighted_score >= 0.66:
        risk_level = "High"
    elif weighted_score >= 0.40:
        risk_level = "Medium"
    return {"risk_level": risk_level, "risk_score": round(float(weighted_score), 2)}

def ml_predict(rainfall_mm: float, slope_deg: float, vegetation_index: float, soil_type: str) -> Optional[Dict[str, Any]]:
    if not _loaded_artifact:
        return None
    model = _loaded_artifact["model"]
    soil_to_index = _loaded_artifact["soil_to_index"]
    classes = _loaded_artifact["classes"]
    soil_idx = soil_to_index.get(soil_type, soil_to_index.get("Loamy", 0))
    features = [[rainfall_mm, slope_deg, vegetation_index, soil_idx]]
    predicted_idx = model.predict(features)[0]
    predicted_label = classes[predicted_idx]
    proba = model.predict_proba(features)[0].max()
    return {"risk_level": str(predicted_label), "risk_score": round(float(proba), 2)}

def simulate_history(lat: float, lon: float) -> list[Dict[str, Any]]:
    rng = stable_rng(lat, lon)
    n = rng.randint(1, 3)
    events = []
    for i in range(n):
        events.append({
            "date": f"{rng.randint(2015, 2024)}-{rng.randint(1,12):02d}-{rng.randint(1,28):02d}",
            "casualties": rng.choice([0, 0, 1, 2, rng.randint(3, 12)]),
            "description": rng.choice([
                "Rain-triggered slope failure near settlement.",
                "Shallow landslide after prolonged rainfall.",
                "Roadside embankment slide; debris on road.",
                "Small-scale slide on steep hillside.",
                "Debris flow reported on mountain road after heavy rain."
            ])
        })
    return events


# ---------------------------- Image-based prediction ----------------------------


def heuristic_image_predict(features: List[float], sensitivity: str = "normal", mode: str = "standard") -> Dict[str, Any]:
    # Feature indices (see model/image_features.py):
    mean_r = float(features[0]); mean_g = float(features[1]); mean_b = float(features[2])
    std_r = float(features[3]); std_g = float(features[4]); std_b = float(features[5])
    edge_density = float(features[6])
    mean_s = float(features[7]); mean_v = float(features[8])
    gray_entropy = float(features[9])
    lap_var = float(features[10])
    diag_ratio = float(features[11])
    grad_mag_mean = float(features[12]); grad_mag_std = float(features[13])
    green_fraction = float(features[14])
    blue_fraction = float(features[15])
    brown_fraction = float(features[16])
    brown_hue_fraction = float(features[17])

    # Color/soil indicator: brown-ish (R/G higher than B)
    brown_score = ((mean_r + mean_g) / 2.0 - mean_b) / 128.0
    brown_score = max(0.0, min(1.0, brown_score))

    # Texture indicators
    edge = max(0.0, min(1.0, edge_density * 1.2))
    lap = lap_var / (lap_var + 200.0) if lap_var >= 0 else 0.0
    lap = max(0.0, min(1.0, lap))
    gmean = grad_mag_mean / (grad_mag_mean + 20.0) if grad_mag_mean >= 0 else 0.0
    gmean = max(0.0, min(1.0, gmean))
    gstd = grad_mag_std / (grad_mag_std + 20.0) if grad_mag_std >= 0 else 0.0
    gstd = max(0.0, min(1.0, gstd))
    diag = max(0.0, min(1.0, diag_ratio))
    entro = max(0.0, min(1.0, gray_entropy / 7.5))

    # Vegetation/sky penalties: high green or blue areas reduce landslide probability
    vegetation_penalty = min(0.35, green_fraction * 0.35)
    sky_penalty = min(0.25, blue_fraction * 0.30)

    # Sensitivity handling (increase recall): lower penalties and thresholds when high
    sens = (sensitivity or "normal").strip().lower()
    high_sensitivity = sens in ("high", "recall", "sensitive", "hi", "on", "true", "1")
    if high_sensitivity:
        vegetation_penalty *= 0.7  # reduce penalty impact by 30%
        sky_penalty *= 0.8         # reduce penalty impact by 20%

    # Satellite mode handling: blurred/low-texture images
    m = (mode or "standard").strip().lower()
    satellite_mode = m in ("sat", "satellite", "remote", "overhead")

    # Combine
    if satellite_mode:
        # De-emphasize texture/edges; emphasize chroma/hue cues typical of scarp/soil patches
        raw = (
            0.38 * brown_score +
            0.08 * edge +
            0.08 * lap +
            0.12 * gmean +
            0.06 * gstd +
            0.12 * diag +
            0.16 * entro
        )
    else:
        raw = (
            0.25 * brown_score +
            0.15 * edge +
            0.20 * lap +
            0.15 * gmean +
            0.10 * gstd +
            0.10 * diag +
            0.05 * entro
        )
    # Brightness adjustment: very bright and low texture -> reduce
    if mean_v > 0.85 and lap < 0.3:
        raw *= 0.85
    # Boost if both brown chroma and hue agree
    brown_blend = (0.5 * brown_fraction + 0.5 * brown_hue_fraction)
    # Avoid boosting on tiny brown hints (reduces FP on grassy/flat scenes)
    if brown_blend < 0.06:
        brown_boost = 0.0
    else:
        brown_boost = (0.18 if satellite_mode else 0.12) * brown_blend
    # If very low texture (common in blurred satellite), rely more on color/hue
    texture_strength = 0.5 * (lap + gmean)
    if satellite_mode and texture_strength < 0.30:
        brown_boost += 0.05 * (0.30 - texture_strength)
    prob = max(0.0, min(1.0, raw - vegetation_penalty - sky_penalty + brown_boost))

    # Dynamic threshold: lower if strong brown evidence and texture present
    dyn_thresh = 0.54 if satellite_mode else 0.60
    if (brown_fraction + brown_hue_fraction) > 0.25 and (lap + gmean) > 0.8:
        dyn_thresh = 0.50
    if high_sensitivity:
        dyn_thresh = max(0.40, dyn_thresh - 0.08)
    if satellite_mode and texture_strength < 0.30:
        dyn_thresh = max(0.38, dyn_thresh - 0.04)
    # Extra conservatism on green/blue-dominant scenes
    if not high_sensitivity and not satellite_mode:
        if green_fraction > 0.35:
            dyn_thresh = min(0.85, dyn_thresh + 0.06)
            vegetation_penalty = min(0.45, green_fraction * 0.45)
        if blue_fraction > 0.25:
            dyn_thresh = min(0.85, dyn_thresh + 0.04)
            sky_penalty = min(0.35, blue_fraction * 0.35)
    label = "Landslide" if prob >= dyn_thresh else "NoLandslide"
    risk_level = "Low"
    if prob >= 0.70:
        risk_level = "High"
    elif prob >= 0.45:
        risk_level = "Medium"
    return {
        "label": label,
        "probability": round(float(prob), 2),
        "risk_level": risk_level,
        "risk_score": round(float(prob), 2),
    }


def ml_image_predict(features: List[float]) -> Optional[Dict[str, Any]]:
    if not _loaded_image_artifact:
        return None
    model = _loaded_image_artifact.get("model")
    classes = _loaded_image_artifact.get("classes", ["NoLandslide", "Landslide"])
    expected = _loaded_image_artifact.get("feature_order")
    # Guard against feature length mismatch
    if isinstance(expected, list) and len(expected) != len(features):
        return None
    X = np.asarray(features, dtype=np.float32).reshape(1, -1)
    try:
        proba = model.predict_proba(X)[0]
        pred_idx = int(np.argmax(proba))
        label = str(classes[pred_idx])
        confidence = float(np.max(proba))
    except Exception:
        # Fallback if model lacks predict_proba
        try:
            pred_idx = int(model.predict(X)[0])
            label = str(classes[pred_idx])
            confidence = 0.5
        except Exception:
            return None

    risk_level = "Low"
    if confidence >= 0.66 and label == "Landslide":
        risk_level = "High"
    elif confidence >= 0.40 and label == "Landslide":
        risk_level = "Medium"
    return {
        "label": label,
        "probability": round(confidence, 2),
        "risk_level": risk_level,
        "risk_score": round(confidence, 2),
    }


def fuse_image_results(
    ml_result: Optional[Dict[str, Any]],
    heur_result: Dict[str, Any],
    *,
    sensitivity: str = "normal",
) -> Dict[str, Any]:
    """Conservative fusion to reduce false positives.
    - If ML is very confident (>=0.80) on Landslide → trust ML.
    - If both agree on Landslide → average probability.
    - Otherwise require stronger evidence to output Landslide.
    """
    if ml_result is None:
        fused = dict(heur_result)
        fused["fusion_used"] = False
        return fused

    ml_label = str(ml_result.get("label"))
    ml_p = float(ml_result.get("probability", 0.0))
    heur_label = str(heur_result.get("label"))
    heur_p = float(heur_result.get("probability", heur_result.get("risk_score", 0.0)))

    # Case 1: strong ML evidence (very high to avoid small-dataset overfit)
    if ml_label == "Landslide" and ml_p >= 0.95:
        fused = dict(ml_result)
        fused["fusion_used"] = True
        fused["fusion_rule"] = "ml_strong"
        return fused

    # Case 2: agreement on Landslide
    if ml_label == "Landslide" and heur_label == "Landslide":
        p = round(min(1.0, 0.5 * ml_p + 0.5 * heur_p), 2)
        fused = {
            "label": "Landslide",
            "probability": p,
            "risk_level": ("High" if p >= 0.70 else ("Medium" if p >= 0.45 else "Low")),
            "risk_score": p,
        }
        fused["fusion_used"] = True
        fused["fusion_rule"] = "agreement"
        return fused

    # Case 3: disagreement → default conservative, but relax when high sensitivity
    # Prefer NoLandslide unless ML is extremely high or heuristic is very high
    if ml_label == "Landslide" and heur_label != "Landslide" and ml_p >= 0.98:
        fused = dict(ml_result)
        fused["fusion_used"] = True
        fused["fusion_rule"] = "ml_very_strong"
        return fused

    if heur_label == "Landslide" and ml_label != "Landslide" and heur_p >= 0.75:
        fused = dict(heur_result)
        fused["fusion_used"] = True
        fused["fusion_rule"] = "heur_strong"
        return fused

    # High sensitivity mode: favor recall. If heuristic indicates Landslide moderately
    # and ML confidence for NoLandslide is not strong, choose heuristic.
    sens = (sensitivity or "normal").strip().lower()
    if sens in ("high", "recall", "sensitive", "hi", "on", "true", "1"):
        if heur_label == "Landslide" and ml_label != "Landslide":
            if heur_p >= 0.55 and ml_p <= 0.80:
                fused = dict(heur_result)
                fused["fusion_used"] = True
                fused["fusion_rule"] = "recall_bias"
                return fused

    # Default to NoLandslide using ML if available, else heuristic
    base = ml_result if ml_label == "NoLandslide" else heur_result
    fused = dict(base)
    fused["fusion_used"] = True
    fused["fusion_rule"] = "conservative_default"
    return fused


@app.post("/image/predict")
def image_predict():
    if "file" not in request.files:
        return jsonify({"error": "Missing 'file' in form-data"}), 400
    file = request.files["file"]
    if not file or file.filename == "":
        return jsonify({"error": "Empty file upload"}), 400
    try:
        img = Image.open(file.stream)
    except Exception as exc:
        return jsonify({"error": f"Invalid image: {exc}"}), 400

    try:
        features = extract_image_features(img)
        # Allow sensitivity/mode via form-data or query string
        sensitivity = request.form.get("sensitivity") or request.args.get("sensitivity") or "normal"
        mode = request.form.get("mode") or request.args.get("mode") or "standard"
        ml_result = ml_image_predict(features)
        heur_result = heuristic_image_predict(features, sensitivity=sensitivity, mode=mode)
        result = fuse_image_results(ml_result, heur_result, sensitivity=sensitivity)
        result["model_used"] = bool(ml_result is not None)
        result["source"] = "image"
        result["sensitivity"] = sensitivity
        result["mode"] = mode
        return jsonify(result)
    except Exception as exc:
        return jsonify({"error": f"Prediction failed: {exc}"}), 500


@app.post("/predict/combined")
def predict_combined():
    location_name = request.form.get("location", "").strip()
    if not location_name:
        return jsonify({"error": "Missing 'location' in form-data"}), 400
    if "file" not in request.files:
        return jsonify({"error": "Missing 'file' in form-data"}), 400
    file = request.files["file"]
    if not file or file.filename == "":
        return jsonify({"error": "Empty file upload"}), 400

    # Image inference
    try:
        img = Image.open(file.stream)
        img_features = extract_image_features(img)
        sensitivity = request.form.get("sensitivity") or request.args.get("sensitivity") or "normal"
        mode = request.form.get("mode") or request.args.get("mode") or "standard"
        img_ml = ml_image_predict(img_features)
        img_heur = heuristic_image_predict(img_features, sensitivity=sensitivity, mode=mode)
        img_result = fuse_image_results(img_ml, img_heur, sensitivity=sensitivity)
        img_result["model_used"] = (img_ml is not None)
        img_result["source"] = "image"
        img_result["sensitivity"] = sensitivity
        img_result["mode"] = mode
    except Exception as exc:
        return jsonify({"error": f"Image prediction failed: {exc}"}), 400

    # Location risk + history
    key = location_name.lower()
    if key in DUMMY_RESPONSES:
        dummy = dict(DUMMY_RESPONSES[key])
        loc_lat = float(dummy.get("latitude"))
        loc_lon = float(dummy.get("longitude"))
        landslide_detected = bool(img_result.get("label") == "Landslide")
        image_probability = float(img_result.get("probability", img_result.get("risk_score", 0.0)))
        response_slim = {
            "risk_level": dummy.get("risk_level"),
            "landslide_detected": landslide_detected,
            "image_probability": round(image_probability, 2),
            "history": dummy.get("history", []),
        }
        return jsonify(response_slim)

    try:
        geocode = geocoder.geocode(location_name, addressdetails=False, timeout=10)
    except Exception as exc:
        return jsonify({"error": f"Geocoding failed: {exc}"}), 502
    if not geocode:
        return jsonify({"error": "Location not found"}), 404

    lat = float(geocode.latitude)
    lon = float(geocode.longitude)
    env = simulate_environment(lat, lon)
    rainfall_mm = float(env["rainfall_mm"])
    slope_deg = float(env["slope_deg"])
    vegetation_index = float(env["vegetation_index"])
    soil_type = str(env["soil_type"])

    ml_result = ml_predict(rainfall_mm, slope_deg, vegetation_index, soil_type)
    if ml_result:
        risk_level = ml_result["risk_level"]
        risk_score = ml_result["risk_score"]
    else:
        rule = rule_based_risk(rainfall_mm, slope_deg, vegetation_index, soil_type)
        risk_level = rule["risk_level"]
        risk_score = rule["risk_score"]

    landslide_detected = bool(img_result.get("label") == "Landslide")
    image_probability = float(img_result.get("probability", img_result.get("risk_score", 0.0)))
    response_slim = {
        "risk_level": risk_level,
        "landslide_detected": landslide_detected,
        "image_probability": round(image_probability, 2),
        "history": simulate_history(lat, lon),
    }
    return jsonify(response_slim)

@app.get("/predict")
def predict():
    location_name = request.args.get("location", "").strip()
    if not location_name:
        return jsonify({"error": "Missing 'location' query parameter"}), 400

    # Quick path: return dummy if the location is one of the predefined demo places
    key = location_name.lower()
    if key in DUMMY_RESPONSES:
        dummy = dict(DUMMY_RESPONSES[key])
        dummy["location"] = location_name  # echo back as provided
        return jsonify(dummy)

    try:
        geocode = geocoder.geocode(location_name, addressdetails=False, timeout=10)
    except Exception as exc:
        return jsonify({"error": f"Geocoding failed: {exc}"}), 502

    if not geocode:
        return jsonify({"error": "Location not found"}), 404

    lat = float(geocode.latitude)
    lon = float(geocode.longitude)

    env = simulate_environment(lat, lon)
    rainfall_mm = float(env["rainfall_mm"])
    slope_deg = float(env["slope_deg"])
    vegetation_index = float(env["vegetation_index"])
    soil_type = str(env["soil_type"])

    ml_result = ml_predict(rainfall_mm, slope_deg, vegetation_index, soil_type)
    if ml_result:
        risk_level = ml_result["risk_level"]
        risk_score = ml_result["risk_score"]
    else:
        rule = rule_based_risk(rainfall_mm, slope_deg, vegetation_index, soil_type)
        risk_level = rule["risk_level"]
        risk_score = rule["risk_score"]

    response = {
        "location": location_name,
        "latitude": round(lat, 6),
        "longitude": round(lon, 6),
        "rainfall_mm": round(rainfall_mm, 1),
        "slope_deg": round(slope_deg, 1),
        "vegetation_index": round(vegetation_index, 2),
        "soil_type": soil_type,
        "risk_level": risk_level,
        "risk_score": risk_score,
        "history": simulate_history(lat, lon),
    }
    return jsonify(response)

@app.get("/")
def index():
    return render_template("index.html")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)
