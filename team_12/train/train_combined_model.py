"""
Train Combined Model (Real + Synthetic Data) using Random Forest
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
SYNTHETIC_DIR = BASE_DIR / "data" / "synthetic"
MODELS_DIR = BASE_DIR / "models"

def load_combined_data():
    """Load real and synthetic data"""
    print("Loading real and synthetic data...")
    
    # Load real training data
    X_train_real = pd.read_csv(PROCESSED_DIR / "X_train.csv")
    y_train_real = pd.read_csv(PROCESSED_DIR / "y_train.csv").values.ravel()
    
    # Load synthetic data
    synthetic_df = pd.read_csv(SYNTHETIC_DIR / "synthetic_data.csv")
    
    # Generate synthetic labels (based on feature patterns)
    # Simple heuristic: higher HR, Temp, Lactate, WBC -> more likely sepsis
    synthetic_labels = (
        (synthetic_df['HR'] > 0.6).astype(int) |
        (synthetic_df['Temp'] > 0.7).astype(int) |
        (synthetic_df['Lactate'] > 0.6).astype(int) |
        (synthetic_df['WBC'] > 0.6).astype(int)
    ).astype(int)
    
    # Combine real and synthetic
    X_combined = pd.concat([X_train_real, synthetic_df], ignore_index=True)
    y_combined = np.concatenate([y_train_real, synthetic_labels])
    
    print(f"Real data: {len(X_train_real)} samples")
    print(f"Synthetic data: {len(synthetic_df)} samples")
    print(f"Combined: {len(X_combined)} samples")
    
    return X_combined, y_combined

def train_combined_model():
    """Train Random Forest on combined data"""
    print("=" * 50)
    print("TRAINING COMBINED MODEL (REAL + SYNTHETIC)")
    print("=" * 50)
    
    # Load combined data
    X_combined, y_combined = load_combined_data()
    
    # Load test data
    X_test = pd.read_csv(PROCESSED_DIR / "X_test.csv")
    y_test = pd.read_csv(PROCESSED_DIR / "y_test.csv").values.ravel()
    
    print(f"Training on {len(X_combined)} samples...")
    
    # Train Random Forest
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=20,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_combined, y_combined)
    
    # Predictions
    y_pred = model.predict(X_test)
    
    # Calculate metrics
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    cm = confusion_matrix(y_test, y_pred)
    
    print("\n" + "=" * 50)
    print("COMBINED MODEL METRICS")
    print("=" * 50)
    print(f"Accuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print("\nConfusion Matrix:")
    print(cm)
    print("=" * 50)
    
    # Save model (as VAE model since it's the enhanced version)
    model_path = MODELS_DIR / "vae_enhanced_model.pkl"
    joblib.dump(model, model_path)
    print(f"\nCombined model saved to {model_path}")
    
    # Also save as vae_model for consistency with API
    joblib.dump(model, MODELS_DIR / "vae_model.pkl")
    
    # Save metrics
    metrics = {
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1),
        "confusion_matrix": cm.tolist()
    }
    
    metrics_path = MODELS_DIR / "vae_model_metrics.json"
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    
    print(f"Metrics saved to {metrics_path}")
    
    return model, metrics

if __name__ == "__main__":
    train_combined_model()


