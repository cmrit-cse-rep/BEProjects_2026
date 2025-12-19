"""
Train Variational Autoencoder (VAE) for synthetic data generation
"""
import pandas as pd
import numpy as np
from pathlib import Path
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import joblib
import json

BASE_DIR = Path(__file__).parent.parent
PROCESSED_DIR = BASE_DIR / "data" / "processed"
MODELS_DIR = BASE_DIR / "models"

# VAE parameters
LATENT_DIM = 20
INTERMEDIATE_DIM = 128
EPOCHS = 50
BATCH_SIZE = 32

class VAE(keras.Model):
    def __init__(self, original_dim, intermediate_dim, latent_dim, **kwargs):
        super(VAE, self).__init__(**kwargs)
        self.original_dim = original_dim
        self.latent_dim = latent_dim
        
        # Encoder
        self.encoder = keras.Sequential([
            layers.InputLayer(input_shape=(original_dim,)),
            layers.Dense(intermediate_dim, activation='relu'),
            layers.Dense(intermediate_dim // 2, activation='relu'),
            layers.Dense(latent_dim * 2)
        ])
        
        # Decoder
        self.decoder = keras.Sequential([
            layers.InputLayer(input_shape=(latent_dim,)),
            layers.Dense(intermediate_dim // 2, activation='relu'),
            layers.Dense(intermediate_dim, activation='relu'),
            layers.Dense(original_dim, activation='sigmoid')
        ])
    
    def encode(self, x):
        mean, logvar = tf.split(self.encoder(x), 2, axis=1)
        return mean, logvar
    
    def reparameterize(self, mean, logvar):
        eps = tf.random.normal(shape=tf.shape(mean))
        return eps * tf.exp(logvar * 0.5) + mean
    
    def decode(self, z):
        return self.decoder(z)
    
    def train_step(self, data):
        x = data  # Only input, no labels

        with tf.GradientTape() as tape:
            mean, logvar = self.encode(x)
            z = self.reparameterize(mean, logvar)
            reconstructed = self.decode(z)

            reconstruction_loss = tf.reduce_mean(
                keras.losses.binary_crossentropy(x, reconstructed)
            ) * self.original_dim

            kl_loss = -0.5 * tf.reduce_mean(
                logvar - tf.square(mean) - tf.exp(logvar) + 1
            )

            total_loss = reconstruction_loss + kl_loss

        grads = tape.gradient(total_loss, self.trainable_weights)
        self.optimizer.apply_gradients(zip(grads, self.trainable_weights))

        return {
            "loss": total_loss,
            "reconstruction_loss": reconstruction_loss,
            "kl_loss": kl_loss,
        }

def load_training_data():
    print("Loading training data...")
    df = pd.read_csv(PROCESSED_DIR / "X_train.csv")
    return df.values.astype("float32")

def train_vae():
    print("=" * 50)
    print("TRAINING VARIATIONAL AUTOENCODER")
    print("=" * 50)

    X_train = load_training_data()
    original_dim = X_train.shape[1]

    print(f"Training on {len(X_train)} samples with {original_dim} features")

    vae = VAE(original_dim, INTERMEDIATE_DIM, LATENT_DIM)
    vae.compile(optimizer="adam")

    print("\nTraining VAE...")
    history = vae.fit(
        X_train,
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        shuffle=True,
    )

    model_path = MODELS_DIR / "vae_weights"
    vae.save_weights(str(model_path))

    print(f"\nVAE weights saved to {model_path}")

    info = {
        "original_dim": original_dim,
        "latent_dim": LATENT_DIM,
        "intermediate_dim": INTERMEDIATE_DIM,
    }

    with open(MODELS_DIR / "vae_info.json", "w") as f:
        json.dump(info, f, indent=2)

    print("VAE info saved.")
    print("=" * 50)

if __name__ == "__main__":
    train_vae()
