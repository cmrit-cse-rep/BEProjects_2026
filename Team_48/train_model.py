import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import joblib

# Sample training data (balanced)
data = {
    "description": [
        "DDoS attack detected",
        "User login attempt failed multiple times",
        "Phishing email reported",
        "Minor system misconfiguration",
        "Unauthorized access attempt",
        "System breach detected",
        "Potential data leakage detected",
        "User attempted unauthorized access",
        "Weak password identified",
        "Suspicious activity logged",
        "Account locked after multiple failed login attempts",
        "Suspicious login from unknown IP address",
        "User tried accessing restricted resources",
        "Alert raised for potential SQL injection",
        "System files altered without authorization",
    ],
    "severity": [
        "High", "Medium", "High", "Low", "High", "High", "Medium", "Medium", "Low", "Medium",
        "High", "High", "Medium", "High", "Low",
    ]
}

# Ensure the lengths are the same
assert len(data["description"]) == len(data["severity"]), "The lengths of description and severity are not the same."

# Create a DataFrame
df = pd.DataFrame(data)

# Vectorize the text descriptions
vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(df["description"])
y = df["severity"]

# Create and train the Logistic Regression model with class weights
model = LogisticRegression(class_weight="balanced")

# Train the model
print("Training the model...")  # Debugging line
model.fit(X, y)
print("Model training complete.")  # Debugging line

# Save the model and vectorizer
try:
    joblib.dump(model, "smodel.pkl")
    joblib.dump(vectorizer, "vectorizer.pkl")
    print("✅ Logistic Regression model and vectorizer saved.")
except Exception as e:
    print(f"Error saving the model: {e}")

# Optionally: Test the model (for example, using cross-validation or some test data)
from sklearn.metrics import classification_report

y_pred = model.predict(X)
print(classification_report(y, y_pred))
