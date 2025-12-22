print("Testing imports...")
try:
    from fastapi import FastAPI
    print("✓ FastAPI imported")
except Exception as e:
    print(f"✗ FastAPI error: {e}")

try:
    from groq import Groq
    print("✓ Groq imported")
except Exception as e:
    print(f"✗ Groq error: {e}")

try:
    from feature_config import get_config
    print("✓ feature_config imported")
except Exception as e:
    print(f"✗ feature_config error: {e}")

try:
    from advanced_features import run_selected_features
    print("✓ advanced_features imported")
except Exception as e:
    print(f"✗ advanced_features error: {e}")

print("\nAll imports successful! Starting server...")
from main import app
import uvicorn
uvicorn.run(app, host="0.0.0.0", port=8000)
