import os
from typing import List, Tuple

import torch
import numpy as np
from torch import nn
from transformers import AutoModelForSequenceClassification, AutoTokenizer

# Path to folder that contains hybrid_model_state.pth, tokenizer files, etc.
BASE_DIR = os.path.dirname(__file__)
MODEL_DIR = os.path.join(BASE_DIR, "model")

# Use GPU if available, otherwise CPU
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

BASE_MODEL_NAME = "microsoft/deberta-v3-base"

LOCAL_DEBERTA_DIR = os.path.join(MODEL_DIR, "deberta-v3-base")

# Label mapping (same as training)
ID2LABEL = {0: "negative", 1: "neutral", 2: "positive"}
LABEL2ID = {v: k for k, v in ID2LABEL.items()}


class HybridCNNModel(nn.Module):
    def __init__(self, transformer_name: str = BASE_MODEL_NAME, num_labels: int = 3):
        super().__init__()

        # Load base DeBERTa model from HuggingFace hub
        self.transformer = AutoModelForSequenceClassification.from_pretrained(
            transformer_name,
            num_labels=num_labels,
        )

        hidden_size = self.transformer.config.hidden_size

        self.conv1 = nn.Conv1d(
            in_channels=hidden_size,
            out_channels=256,
            kernel_size=3,
            padding=1,
        )
        self.pool = nn.MaxPool1d(kernel_size=2)
        self.dropout = nn.Dropout(0.3)

        # You used sequence length 128, then MaxPool1d(kernel_size=2) -> 128 / 2 = 64
        self.classifier = nn.Linear(256 * 64, num_labels)

    def forward(self, input_ids, attention_mask):
        outputs = self.transformer(
            input_ids=input_ids,
            attention_mask=attention_mask,
            output_hidden_states=True,
        )

        sequence_output = outputs.hidden_states[-1].permute(0, 2, 1)  # [batch, hidden, seq]
        conv_out = torch.relu(self.conv1(sequence_output))             # [batch, 256, seq]
        pooled_out = self.pool(conv_out)                               # [batch, 256, seq/2]
        flattened = pooled_out.view(pooled_out.size(0), -1)            # [batch, 256 * seq/2]
        pooled_output = self.dropout(flattened)
        logits = self.classifier(pooled_output)

        return logits



# -------------------------------
# Global lazy-loaded model/tokenizer
# -------------------------------
_model = None
_tokenizer = None


def load_sentiment_model():
    """
    Lazily load model & tokenizer once, reuse for all requests.
    """
    global _model, _tokenizer

    if _model is None or _tokenizer is None:
        _tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)

        # Start from base model name (original working setup)
        model = HybridCNNModel(BASE_MODEL_NAME, num_labels=3)

        state_path = os.path.join(MODEL_DIR, "hybrid_model_state.pth")
        state_dict = torch.load(state_path, map_location=DEVICE)
        model.load_state_dict(state_dict)

        model.to(DEVICE)
        model.eval()

        _model = model

    return _model, _tokenizer


def predict_sentiments(
    texts: List[str],
    max_length: int = 128,
) -> Tuple[List[str], List[List[float]]]:
    """
    Run sentiment prediction on a list of texts.

    Returns:
      - labels: list of "negative" | "neutral" | "positive"
      - probabilities: list of [p_neg, p_neu, p_pos] for each text
    """
    model, tokenizer = load_sentiment_model()

    # Handle empty list early
    if not texts:
        return [], []

    # Ensure all texts are strings
    texts = [t if isinstance(t, str) else "" for t in texts]

    # Tokenize
    encoded = tokenizer(
        texts,
        padding="max_length",
        truncation=True,
        max_length=max_length,
        return_tensors="pt",
    )

    input_ids = encoded["input_ids"].to(DEVICE)
    attention_mask = encoded["attention_mask"].to(DEVICE)

    with torch.inference_mode():
        logits = model(input_ids=input_ids, attention_mask=attention_mask)
        probs = torch.softmax(logits, dim=-1)  # [batch, 3]

    probs_np = probs.cpu().numpy()
    pred_ids = np.argmax(probs_np, axis=1)

    labels = [ID2LABEL[int(idx)] for idx in pred_ids]
    probabilities = probs_np.tolist()

    return labels, probabilities


def count_labels(labels: List[str]) -> dict:
    """
    Helper to get counts for the chart:
      {"positive": n, "negative": n, "neutral": n}
    """
    counts = {"positive": 0, "negative": 0, "neutral": 0}
    for lbl in labels:
        if lbl in counts:
            counts[lbl] += 1
    return counts
