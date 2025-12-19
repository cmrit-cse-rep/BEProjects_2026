from __future__ import annotations

import os
from typing import List, Tuple, Dict, Any

import numpy as np
from PIL import Image
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

from .image_features import extract_image_features


def load_images_from_dir(root: str) -> Tuple[List[List[float]], List[str]]:
    X: List[List[float]] = []
    y: List[str] = []
    # Expect structure:
    # root/
    #   Landslide/
    #   NoLandslide/
    for label in ["Landslide", "NoLandslide"]:
        label_dir = os.path.join(root, label)
        if not os.path.isdir(label_dir):
            continue
        for fname in os.listdir(label_dir):
            path = os.path.join(label_dir, fname)
            if not os.path.isfile(path):
                continue
            try:
                with Image.open(path) as img:
                    feats = extract_image_features(img)
                    X.append(feats)
                    y.append(label)
            except Exception:
                # Skip unreadable images
                continue
    return X, y


def main() -> None:
    dataset_dir = os.environ.get("IMAGE_DATASET_DIR", "./dataset")
    X, y = load_images_from_dir(dataset_dir)
    if not X:
        print("No images found. Provide dataset at IMAGE_DATASET_DIR with labels 'Landslide' and 'NoLandslide'.")
        return

    X_arr = np.asarray(X, dtype=np.float32)
    y_arr = np.asarray(y)

    # Handle tiny or imbalanced datasets gracefully
    unique, counts = np.unique(y_arr, return_counts=True)
    too_small = (len(unique) < 2) or (counts.min() < 2) or (len(y_arr) < 6)

    model = RandomForestClassifier(n_estimators=300, random_state=7, n_jobs=-1)
    if too_small:
        # Train on all data and skip validation if we can't stratify
        print("[warn] Dataset is too small/imbalanced for stratified split; training on all samples.")
        model.fit(X_arr, y_arr)
    else:
        X_train, X_test, y_train, y_test = train_test_split(
            X_arr, y_arr, test_size=0.2, random_state=7, stratify=y_arr
        )
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        print(classification_report(y_test, y_pred))

    artifact: Dict[str, Any] = {
        "model": model,
        "classes": ["NoLandslide", "Landslide"],
        "feature_order": [
            "mean_r", "mean_g", "mean_b",
            "std_r", "std_g", "std_b",
            "edge_density",
            "mean_s", "mean_v",
            "gray_entropy",
            "laplacian_variance",
            "diagonal_edge_ratio",
            "grad_mag_mean",
            "grad_mag_std",
            "green_fraction",
            "blue_fraction",
            "brown_fraction",
            "brown_hue_fraction"
        ]
    }
    models_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    os.makedirs(models_dir, exist_ok=True)
    out_path = os.path.join(models_dir, "image_model.joblib")
    joblib.dump(artifact, out_path)
    print(f"Saved image model to: {os.path.abspath(out_path)}")


if __name__ == "__main__":
    main()


