# src/train.py
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, models, transforms
from torch.utils.data import DataLoader
from pathlib import Path
import time
import os

# --- Configuration ---
DATA_DIR = Path("data")
MODEL_SAVE_PATH = Path("models/plant_classifier.pth")
NUM_CLASSES = len(os.listdir(DATA_DIR / "train")) # Auto-detect number of classes
BATCH_SIZE = 32
NUM_EPOCHS = 10 # Start with 10, you can increase this for better accuracy
LEARNING_RATE = 0.001

def train_model():
    print("Initializing training...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # --- Data Transforms ---
    data_transforms = {
        'train': transforms.Compose([
            transforms.RandomResizedCrop(224),
            transforms.RandomHorizontalFlip(),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
        'val': transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
    }

    # --- Dataloaders ---
    image_datasets = {x: datasets.ImageFolder(DATA_DIR / x, data_transforms[x]) for x in ['train', 'val']}
    dataloaders = {x: DataLoader(image_datasets[x], batch_size=BATCH_SIZE, shuffle=True, num_workers=4) for x in ['train', 'val']}
    dataset_sizes = {x: len(image_datasets[x]) for x in ['train', 'val']}
    print(f"Found {NUM_CLASSES} classes.")
    print(f"Training data size: {dataset_sizes['train']}")
    print(f"Validation data size: {dataset_sizes['val']}")


    # --- Model Setup ---
    model = models.resnet18(weights='ResNet18_Weights.DEFAULT')
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, NUM_CLASSES) # Replace the final layer
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

    # --- Training Loop ---
    start_time = time.time()
    for epoch in range(NUM_EPOCHS):
        print(f'Epoch {epoch+1}/{NUM_EPOCHS}')
        print('-' * 10)

        for phase in ['train', 'val']:
            if phase == 'train':
                model.train()
            else:
                model.eval()

            running_loss = 0.0
            running_corrects = 0

            for inputs, labels in dataloaders[phase]:
                inputs = inputs.to(device)
                labels = labels.to(device)

                optimizer.zero_grad()

                with torch.set_grad_enabled(phase == 'train'):
                    outputs = model(inputs)
                    _, preds = torch.max(outputs, 1)
                    loss = criterion(outputs, labels)

                    if phase == 'train':
                        loss.backward()
                        optimizer.step()

                running_loss += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)

            epoch_loss = running_loss / dataset_sizes[phase]
            epoch_acc = running_corrects.double() / dataset_sizes[phase]

            print(f'{phase} Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}')

    time_elapsed = time.time() - start_time
    print(f'\nTraining complete in {time_elapsed // 60:.0f}m {time_elapsed % 60:.0f}s')

    # --- Save the Model ---
    MODEL_SAVE_PATH.parent.mkdir(parents=True, exist_ok=True)
    torch.save(model, MODEL_SAVE_PATH)
    print(f"✅ Model saved to {MODEL_SAVE_PATH}")


if __name__ == '__main__':
    train_model()