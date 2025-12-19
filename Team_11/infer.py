import torch
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from pathlib import Path
from sklearn.metrics import classification_report, confusion_matrix
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import time

# --- Configuration ---
MODEL_PATH = Path("models/plant_classifier.pth")
TEST_DATA_DIR = Path("data/test")
BATCH_SIZE = 32
IMAGE_SIZE = 224

def evaluate_model():
    """
    Loads the trained model, evaluates it on the test dataset,
    prints a classification report, and saves a confusion matrix plot.
    """
    print("Starting model evaluation...")
    if not MODEL_PATH.exists():
        print(f"❌ Error: Model file not found at {MODEL_PATH}")
        return

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # --- Data Loading ---
    transform = transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    test_dataset = datasets.ImageFolder(TEST_DATA_DIR, transform=transform)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False)
    class_names = test_dataset.classes
    print(f"Found {len(class_names)} classes in the test set.")

    # --- Load Model ---
    try:
        model = torch.load(MODEL_PATH, map_location=device, weights_only=False)
        model.eval()
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return

    # --- Get Predictions ---
    all_preds = []
    all_labels = []
    start_time = time.time()

    with torch.no_grad():
        for i, (inputs, labels) in enumerate(test_loader):
            inputs = inputs.to(device)
            labels = labels.to(device)
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            if (i + 1) % 20 == 0:
                print(f"  Processed batch {i+1}/{len(test_loader)}")

    end_time = time.time()
    print(f"Evaluation completed in {end_time - start_time:.2f} seconds.")

    # --- Print Classification Report ---
    print("\n" + "="*50)
    print("Classification Report")
    print("="*50)
    report = classification_report(all_labels, all_preds, target_names=class_names)
    print(report)

    # --- Generate and Save Confusion Matrix ---
    print("\nGenerating confusion matrix graph...")
    cm = confusion_matrix(all_labels, all_preds)
    
    plt.figure(figsize=(20, 20)) # Adjust size as needed for your number of classes
    sns.heatmap(cm, annot=False, fmt='d', cmap='Blues', 
                xticklabels=class_names, yticklabels=class_names)
    
    # Due to the high number of classes (185), annotations are turned off (annot=False)
    # to keep the plot readable. The color intensity shows the result.
    
    plt.title('Confusion Matrix for Plant Recognizer', fontsize=20)
    plt.ylabel('Actual Class', fontsize=16)
    plt.xlabel('Predicted Class', fontsize=16)
    plt.xticks(rotation=90)
    plt.yticks(rotation=0)
    plt.tight_layout() # Adjust layout to make room for labels

    save_path = "confusion_matrix.png"
    plt.savefig(save_path, dpi=150)
    print(f"✅ Confusion matrix graph saved to: {save_path}")

if __name__ == '__main__':
    evaluate_model()

