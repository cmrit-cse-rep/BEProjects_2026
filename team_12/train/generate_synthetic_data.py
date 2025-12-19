"""
Generate synthetic data using trained VAE
"""
import pandas as pd
import numpy as np
from pathlib import Path
import tensorflow as tf
from tensorflow import keras
import json
import joblib

BASE_DIR = Path(__file__).parent.parent
PROCESSED_DIR = BASE_DIR / "data" / "processed"
SYNTHETIC_DIR = BASE_DIR / "data" / "synthetic"
MODELS_DIR = BASE_DIR / "models"

def load_vae_model():
    """Load trained VAE model"""
    import sys
    from pathlib import Path
    
    # Add parent directory to path to import VAE
    sys.path.insert(0, str(Path(__file__).parent))
    from train_vae import VAE
    
    # Load model info
    with open(MODELS_DIR / "vae_info.json", 'r') as f:
        model_info = json.load(f)
    
    # Create VAE
    vae = VAE(
        model_info['original_dim'],
        128,  # INTERMEDIATE_DIM
        model_info['latent_dim']
    )
    
    # Load weights
    vae.load_weights(str(MODELS_DIR / "vae_model"))
    
    return vae, model_info

def generate_synthetic_data(n_samples=1000):
    """Generate synthetic data using VAE"""
    print("=" * 50)
    print("GENERATING SYNTHETIC DATA")
    print("=" * 50)
    
    # Load VAE
    vae, model_info = load_vae_model()
    latent_dim = model_info['latent_dim']
    
    print(f"Generating {n_samples} synthetic samples...")
    
    # Generate random latent vectors
    latent_vectors = np.random.normal(0, 1, (n_samples, latent_dim))
    
    # Decode to generate synthetic data
    synthetic_data = vae.decode(tf.constant(latent_vectors, dtype=tf.float32))
    synthetic_data = synthetic_data.numpy()
    
    # Load feature columns
    X_train = pd.read_csv(PROCESSED_DIR / "X_train.csv")
    feature_columns = X_train.columns.tolist()
    
    # Create DataFrame
    synthetic_df = pd.DataFrame(synthetic_data, columns=feature_columns)
    
    # Save synthetic data
    SYNTHETIC_DIR.mkdir(parents=True, exist_ok=True)
    synthetic_df.to_csv(SYNTHETIC_DIR / "synthetic_data.csv", index=False)
    
    print(f"Synthetic data saved to {SYNTHETIC_DIR / 'synthetic_data.csv'}")
    print("=" * 50)
    
    return synthetic_df

if __name__ == "__main__":
    generate_synthetic_data()

