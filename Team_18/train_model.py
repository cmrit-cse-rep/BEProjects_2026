from __future__ import annotations

import os
from typing import Dict, Any

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

RNG = np.random.default_rng(42)
SOIL_TYPES = ["Clay", "Sandy", "Loamy", "Silt", "Peaty", "Chalky"]
SOIL_RISK_FACTOR = {
    "Clay": 1.10,
    "Sandy": 0.90,
    "Loamy": 1.00,
    "Silt": 1.05,
    "Peaty": 1.15,
    "Chalky": 0.95,
}

def synthesize_dataset(n: int = 6000) -> pd.DataFrame:
    rainfall = RNG.uniform(20, 520, size=n)
    slope = np.clip(np.abs(RNG.normal(22, 12, size=n)), 0, 60)
    vegetation = np.clip(RNG.uniform(0.05, 0.95, size=n), 0, 1)
    soils = RNG.choice(SOIL_TYPES, size=n, replace=True)
    base = 0.45 * (rainfall / 500.0) + 0.35 * (slope / 60.0) + 0.20 * (1.0 - vegetation)
    soil_mult = np.vectorize(lambda s: SOIL_RISK_FACTOR[s])(soils)
    score = base * soil_mult
    labels = np.where(score >= 0.66, "High", np.where(score >= 0.40, "Medium", "Low"))
    df = pd.DataFrame({
        "rainfall_mm": rainfall.round(1),
        "slope_deg": slope.round(1),
        "vegetation_index": vegetation.round(2),
        "soil_type": soils,
        "label": labels
    })
    return df


def main() -> None:
    df = synthesize_dataset(10000)
    le = LabelEncoder()
    y = le.fit_transform(df["label"])
    soil_to_index: Dict[str, int] = {soil: idx for idx, soil in enumerate(SOIL_TYPES)}
    X = np.column_stack([
        df["rainfall_mm"].to_numpy(),
        df["slope_deg"].to_numpy(),
        df["vegetation_index"].to_numpy(),
        df["soil_type"].map(soil_to_index).to_numpy(),
    ])
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=7, stratify=y)
    model = RandomForestClassifier(
        n_estimators=240,
        max_depth=None,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=7,
        n_jobs=-1,
        class_weight=None
    )
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    report = classification_report(y_test, y_pred, target_names=list(le.classes_))
    print(report)

    artifact: Dict[str, Any] = {
        "model": model,
        "classes": list(le.classes_),
        "soil_to_index": soil_to_index,
        "feature_order": ["rainfall_mm", "slope_deg", "vegetation_index", "soil_index"]
    }

    models_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    os.makedirs(models_dir, exist_ok=True)
    out_path = os.path.join(models_dir, "risk_model.joblib")
    joblib.dump(artifact, out_path)
    print(f"Saved model to: {os.path.abspath(out_path)}")


if __name__ == "__main__":
    main()
