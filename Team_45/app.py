import os
import json
import torch
import numpy as np
import pandas as pd
import torch.nn as nn
from werkzeug.utils import secure_filename
from sklearn.preprocessing import LabelEncoder
from flask import Flask, request, jsonify, render_template
import cv2
import mediapipe as mp

# Flask app setup
app = Flask(__name__, template_folder="templates", static_folder="static")
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 50MB max file size

# Configuration
MODEL_PATH = "cnnbigru_model.pth"
CLASS_SAVE = "label_classes.npy"
FIXED_FRAMES = 30
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Model architecture (same as training)
class CNN1D_BiGRU(nn.Module):
    def __init__(self, in_channels=99, conv_channels=128, gru_hidden=256, gru_layers=2, num_classes=5, dropout=0.4):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv1d(in_channels, conv_channels//2, kernel_size=3, padding=1),
            nn.BatchNorm1d(conv_channels//2),
            nn.ReLU(),
            nn.Conv1d(conv_channels//2, conv_channels, kernel_size=3, padding=1),
            nn.BatchNorm1d(conv_channels),
            nn.ReLU()
        )
        self.gru = nn.GRU(input_size=conv_channels, hidden_size=gru_hidden, num_layers=gru_layers,
                          batch_first=True, bidirectional=True, dropout=0.2 if gru_layers > 1 else 0.0)
        self.fc = nn.Sequential(
            nn.Linear(gru_hidden*2, 256),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(256, num_classes)
        )

    def forward(self, x):
        x = self.conv(x)             # -> (B, conv_channels, T)
        x = x.permute(0, 2, 1)       # -> (B, T, conv_channels)
        outputs, _ = self.gru(x)     # -> (B, T, 2*gru_hidden)
        pooled = outputs.mean(dim=1) # (B, 2*gru_hidden)
        out = self.fc(pooled)        # (B, num_classes)
        return out

# Global variables
model = None
label_classes = None

def load_model():
    """Load trained model and class labels"""
    global model, label_classes
    
    try:
        # Load labels
        if os.path.exists(CLASS_SAVE):
            label_classes = np.load(CLASS_SAVE, allow_pickle=True)
        elif os.path.exists("labels2.csv"):
            df = pd.read_csv("labels2.csv")
            pose_column = 'pose' if 'pose' in df.columns else 'poses'
            label_enc = LabelEncoder()
            label_enc.fit(df[pose_column])
            label_classes = label_enc.classes_
            np.save(CLASS_SAVE, label_classes)
        else:
            label_classes = np.array([
                'chair', 'cobra', 'downward-dog', 'happy-baby', 'standing-big-toe-hold'
            ])

        # Load model
        checkpoint = torch.load(MODEL_PATH, map_location=DEVICE, weights_only=False)
        num_classes = len(label_classes)
        model = CNN1D_BiGRU(in_channels=33*3, num_classes=num_classes)
        model.load_state_dict(checkpoint['model_state'])
        model.to(DEVICE)
        model.eval()
        return True
    except Exception as e:
        print(f"Error loading model: {e}")
        return False

mp_pose = mp.solutions.pose

def extract_keypoints_from_video(video_path, frame_start=None, frame_end=None):
    """
    Extract pose keypoints from a video using MediaPipe.
    If frame_start and frame_end are provided, only extract frames in that range (inclusive).
    Returns a numpy array of shape (frames, 33, 3).
    """
    cap = cv2.VideoCapture(video_path)
    pose = mp_pose.Pose(static_image_mode=False,
                        model_complexity=1,
                        enable_segmentation=False,
                        min_detection_confidence=0.5,
                        min_tracking_confidence=0.5)

    keypoints_list = []
    frame_num = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Skip frames before start
        if frame_start is not None and frame_num < frame_start:
            frame_num += 1
            continue

        # Stop after end
        if frame_end is not None and frame_num > frame_end:
            break

        # Process frame
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb)

        if results.pose_world_landmarks:
            kps = [[lm.x, lm.y, lm.z] for lm in results.pose_world_landmarks.landmark]
            keypoints_list.append(kps)
        else:
            keypoints_list.append(np.zeros((33, 3)))

        frame_num += 1

    cap.release()
    pose.close()

    extracted_keypoints = np.array(keypoints_list, dtype=np.float32)

    return extracted_keypoints

def preprocess_keypoints(keypoints_data):
    x = keypoints_data.copy()
    if x.shape[0] < FIXED_FRAMES:
        pad_len = FIXED_FRAMES - x.shape[0]
        pad = np.zeros((pad_len, x.shape[1], x.shape[2]), dtype=x.dtype)
        x = np.concatenate([x, pad], axis=0)
    elif x.shape[0] > FIXED_FRAMES:
        x = x[:FIXED_FRAMES]

    mean = x.mean()
    std = x.std() if x.std() > 0 else 1.0
    x = (x - mean) / std
    T, J, C = x.shape
    x = x.reshape(T, J*C).astype(np.float32)  # (T, 99)
    x = np.transpose(x, (1, 0))               # (99, T)
    return x

def predict_pose(keypoints_data):
    if model is None or label_classes is None:
        return {"error": "Model not loaded"}
    try:
        processed_data = preprocess_keypoints(keypoints_data)
        input_tensor = torch.from_numpy(processed_data).unsqueeze(0).to(DEVICE)
        with torch.no_grad():
            outputs = model(input_tensor)
            probabilities = torch.softmax(outputs, dim=1)
            predicted_class_idx = torch.argmax(outputs, dim=1).item()
            confidence = probabilities[0][predicted_class_idx].item()
        predicted_pose = label_classes[predicted_class_idx]
        top3_probs, top3_indices = torch.topk(probabilities[0], min(3, len(label_classes)))
        top3_predictions = []
        for i in range(len(top3_indices)):
            pose_name = label_classes[top3_indices[i].item()]
            prob = top3_probs[i].item()
            top3_predictions.append({"pose": pose_name, "confidence": prob})
        return {
            "predicted_pose": predicted_pose,
            "confidence": confidence,
            "top3_predictions": top3_predictions
        }
    except Exception as e:
        return {"error": f"Prediction error: {str(e)}"}

@app.route('/')
def home():
    pose_classes = list(label_classes) if label_classes is not None else []
    return render_template("index.html", pose_classes=pose_classes)

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    if not file.filename.lower().endswith('.mp4'):
        return jsonify({"error": "Only .mp4 files are supported"}), 400

    frame_start = int(request.form['frame_start'])
    frame_end = int(request.form['frame_end'])
    if frame_start is None or frame_end is None:
        return jsonify({"error": "frame_start and frame_end are required"}), 400
    
    try:
        temp_path = "temp_video.mp4"
        file.save(temp_path)

        # Extract keypoints
        keypoints_data = extract_keypoints_from_video(temp_path, frame_start, frame_end)

        if keypoints_data.shape[1:] != (33, 3):
            return jsonify({"error": f"Invalid shape: {keypoints_data.shape}. Expected (frames, 33, 3)"}), 400

        result = predict_pose(keypoints_data)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Processing error: {str(e)}"}), 500

@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "device": str(DEVICE),
        "classes_loaded": label_classes is not None
    })

if __name__ == '__main__':
    print("Starting Yoga Pose Classifier App...")
    if load_model():
        print("Model loaded successfully!")
        port = int(os.environ.get("PORT", 5000))
        app.run(host='0.0.0.0', port=port)