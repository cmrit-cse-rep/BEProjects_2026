"""
Train Original Random Forest Model
"""
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import joblib
import json

BASE_DIR = Path(__file__).parent.parent
PROCESSED_DIR = BASE_DIR / "data" / "processed"
MODELS_DIR = BASE_DIR / "models"

def load_processed_data():
    """Load preprocessed data"""
    print("Loading preprocessed data...")
    
    X_train = pd.read_csv(PROCESSED_DIR / "X_train.csv")
    X_test = pd.read_csv(PROCESSED_DIR / "X_test.csv")
    y_train = pd.read_csv(PROCESSED_DIR / "y_train.csv").values.ravel()
    y_test = pd.read_csv(PROCESSED_DIR / "y_test.csv").values.ravel()
    
    return X_train, X_test, y_train, y_test

def train_original_model():
    """Train Random Forest model"""
    print("=" * 50)
    print("TRAINING ORIGINAL RANDOM FOREST MODEL")
    print("=" * 50)
    
    # Load data
    X_train, X_test, y_train, y_test = load_processed_data()
    
    print(f"Training on {len(X_train)} samples...")
    
    # Train Random Forest
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=20,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Predictions
    y_pred = model.predict(X_test)
    
    # Calculate metrics
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    cm = confusion_matrix(y_test, y_pred)
    
    print("\n" + "=" * 50)
    print("ORIGINAL MODEL METRICS")
    print("=" * 50)
    print(f"Accuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print("\nConfusion Matrix:")
    print(cm)
    print("=" * 50)
    
    # Save model
    model_path = MODELS_DIR / "original_model.pkl"
    joblib.dump(model, model_path)
    print(f"\nModel saved to {model_path}")
    
    # Save metrics
    metrics = {
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1),
        "confusion_matrix": cm.tolist()
    }
    
    metrics_path = MODELS_DIR / "original_model_metrics.json"
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    
    print(f"Metrics saved to {metrics_path}")
    
    return model, metrics

if __name__ == "__main__":
    train_original_model()


