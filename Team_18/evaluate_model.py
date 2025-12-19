import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import json

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_curve, auc, precision_recall_curve
)

# ------------------------------------------------------
# 1️⃣ Create folders if not exist
# ------------------------------------------------------
os.makedirs("data", exist_ok=True)
os.makedirs("results", exist_ok=True)

# ------------------------------------------------------
# 2️⃣ Generate synthetic dataset
# ------------------------------------------------------
print("🧩 Generating synthetic dataset...")

np.random.seed(42)
n_samples = 500

data = pd.DataFrame({
    'rainfall': np.random.uniform(50, 500, n_samples),
    'slope_angle': np.random.uniform(5, 60, n_samples),
    'soil_moisture': np.random.uniform(0.1, 1.0, n_samples),
    'vegetation_index': np.random.uniform(0.1, 0.9, n_samples),
    'temperature': np.random.uniform(10, 35, n_samples),
    'rock_strength': np.random.uniform(0.2, 1.0, n_samples),
})

# Generate target variable (higher rainfall + slope = more landslides)
prob = (
    0.5 * (data['rainfall'] / 500)
    + 0.3 * (data['slope_angle'] / 60)
    + 0.2 * (1 - data['vegetation_index'])
)
data['landslide_occurred'] = (prob + np.random.normal(0, 0.1, n_samples) > 0.5).astype(int)

data_path = "data/landslide_data.csv"
data.to_csv(data_path, index=False)
print(f"✅ Dataset saved to {data_path}")

# ------------------------------------------------------
# 3️⃣ Split data
# ------------------------------------------------------
X = data.drop(columns=['landslide_occurred'])
y = data['landslide_occurred']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

# ------------------------------------------------------
# 4️⃣ Train model
# ------------------------------------------------------
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# ------------------------------------------------------
# 5️⃣ Predictions & metrics
# ------------------------------------------------------
y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

metrics = {
    "accuracy": round(accuracy, 3),
    "precision": round(precision, 3),
    "recall": round(recall, 3),
    "f1_score": round(f1, 3)
}

# Save metrics to JSON file
with open("results/metrics.json", "w") as f:
    json.dump(metrics, f, indent=4)

print("\n📊 Evaluation Metrics:")
for k, v in metrics.items():
    print(f"{k.capitalize():<10}: {v}")

# ------------------------------------------------------
# 6️⃣ Confusion Matrix
# ------------------------------------------------------
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(5, 4))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False)
plt.title("Confusion Matrix")
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.tight_layout()
plt.savefig("results/confusion_matrix.png")
plt.close()

# ------------------------------------------------------
# 7️⃣ ROC Curve
# ------------------------------------------------------
fpr, tpr, _ = roc_curve(y_test, y_prob)
roc_auc = auc(fpr, tpr)
plt.figure()
plt.plot(fpr, tpr, label=f"AUC = {roc_auc:.2f}")
plt.plot([0, 1], [0, 1], "k--")
plt.xlabel("False Positive Rate")
plt.ylabel("True Positive Rate")
plt.title("ROC Curve")
plt.legend(loc="lower right")
plt.tight_layout()
plt.savefig("results/roc_curve.png")
plt.close()

# ------------------------------------------------------
# 8️⃣ Precision–Recall Curve
# ------------------------------------------------------
precision_vals, recall_vals, _ = precision_recall_curve(y_test, y_prob)
plt.figure()
plt.plot(recall_vals, precision_vals, color="green")
plt.xlabel("Recall")
plt.ylabel("Precision")
plt.title("Precision–Recall Curve")
plt.tight_layout()
plt.savefig("results/precision_recall_curve.png")
plt.close()

# ------------------------------------------------------
# 9️⃣ Feature Importance
# ------------------------------------------------------
importances = pd.Series(model.feature_importances_, index=X.columns).sort_values(ascending=False)
plt.figure(figsize=(6, 4))
sns.barplot(x=importances, y=importances.index, palette="viridis")
plt.title("Feature Importance")
plt.xlabel("Importance")
plt.tight_layout()
plt.savefig("results/feature_importance.png")
plt.close()

# Save feature importance to JSON too
importance_dict = importances.to_dict()
with open("results/feature_importance.json", "w") as f:
    json.dump(importance_dict, f, indent=4)

print("\n🖼️ Graphs saved in 'results/' folder:")
print("  - confusion_matrix.png")
print("  - roc_curve.png")
print("  - precision_recall_curve.png")
print("  - feature_importance.png")
print("  - metrics.json")
print("  - feature_importance.json")

print("\n✅ Evaluation complete.")
