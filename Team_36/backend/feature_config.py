"""
Feature toggles and model selection for advanced NLP add-ons.
All features are optional and must degrade gracefully if disabled or if a model fails to load.
"""

from typing import Dict, Any
import os

# Base config with safe defaults; can be overridden via env vars.
DEFAULT_CONFIG: Dict[str, Any] = {
    "features": {
        "tts": False,
        "ner_reality_checker": False,
        # Removed problematic features: bias_sentiment, ai_writer, multi_style_summarizer, headline_generator
    },
    "models": {
        "tts": os.getenv("TTS_MODEL", "pyttsx3"),  # offline fallback
        "ner": os.getenv("NER_MODEL", "dslim/bert-base-NER"),
        # Removed model configs for problematic features
    },
    "performance": {
        "device": os.getenv("HF_DEVICE", "cpu"),
        "cache_max_entries": int(os.getenv("PIPELINE_CACHE_MAX", "2")),
        "timeout_seconds": int(os.getenv("FEATURE_TIMEOUT", "15")),
    },
}


def get_config() -> Dict[str, Any]:
    return DEFAULT_CONFIG.copy()

