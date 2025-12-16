import os
import numpy as np
from glob import glob
from tqdm import tqdm
from sklearn.datasets import load_files
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout, Activation
from tensorflow.keras.optimizers import RMSprop
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import matplotlib.pyplot as plt
from PIL import ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True

# ---------------------------------------------------------
# LOAD DATASET (4 CLASSES)
# ---------------------------------------------------------

def load_dataset(path):
    data = load_files(path)
    files = np.array(data['filenames'])
    targets = to_categorical(np.array(data['target']), num_classes=4)
    return files, targets

dataset_path = './dataset/'   # Chickenpox, Measles, MonkeyPox, Normal
all_files, all_targets = load_dataset(dataset_path)

# Shuffle
from sklearn.utils import shuffle
all_files, all_targets = shuffle(all_files, all_targets, random_state=42)

# ---------------------------------------------------------
# IMAGE PREPROCESSING
# ---------------------------------------------------------

def path_to_tensor(img_path, width=224, height=224):
    img = load_img(img_path, target_size=(width, height))
    x = img_to_array(img)
    x = np.expand_dims(x, axis=0)
    return x / 255.0

def paths_to_tensor(img_paths):
    list_of_tensors = [path_to_tensor(p) for p in tqdm(img_paths)]
    return np.vstack(list_of_tensors)

tensors = paths_to_tensor(all_files).astype('float32')

# ---------------------------------------------------------
# TRAIN / TEST SPLIT
# ---------------------------------------------------------

X_train, X_val, y_train, y_val = train_test_split(
    tensors, all_targets, test_size=0.3, random_state=42
)

# ---------------------------------------------------------
# BUILD CNN MODEL
# ---------------------------------------------------------

def build_cnn_model(input_shape=(224, 224, 3), num_classes=4):
    model = Sequential()

    model.add(Conv2D(32, (3, 3), padding='same', input_shape=input_shape))
    model.add(Activation("relu"))
    model.add(MaxPooling2D(pool_size=(2, 2)))

    model.add(Conv2D(64, (3, 3), padding='same'))
    model.add(Activation("relu"))
    model.add(MaxPooling2D(pool_size=(2, 2)))

    model.add(Conv2D(128, (3, 3), padding='same'))
    model.add(Activation("relu"))
    model.add(MaxPooling2D(pool_size=(2, 2)))

    model.add(Flatten())
    model.add(Dense(256, activation='relu'))
    model.add(Dropout(0.5))
    model.add(Dense(num_classes, activation='softmax'))

    model.compile(
        loss='categorical_crossentropy',
        optimizer=RMSprop(learning_rate=0.0004),
        metrics=['accuracy']
    )
    return model

# ---------------------------------------------------------
# TRAIN
# ---------------------------------------------------------

model = build_cnn_model()

early_stop = EarlyStopping(monitor='val_accuracy', patience=5, restore_best_weights=True)
checkpoint = ModelCheckpoint('best_cnn_model.h5', monitor='val_accuracy', save_best_only=True)

history = model.fit(
    X_train, y_train,
    validation_data=(X_val, y_val),
    epochs=25,
    batch_size=16,
    callbacks=[early_stop, checkpoint],
    verbose=1
)

# ---------------------------------------------------------
# FINAL ACCURACY
# ---------------------------------------------------------

loss, acc = model.evaluate(X_val, y_val, verbose=0)
print(f"\nFinal Validation Accuracy: {acc*100:.2f}%")

# ---------------------------------------------------------
# PLOT ACCURACY AND LOSS
# ---------------------------------------------------------

plt.figure(figsize=(12, 5))

plt.subplot(1, 2, 1)
plt.plot(history.history['accuracy'], label='Train Acc')
plt.plot(history.history['val_accuracy'], label='Val Acc')
plt.title('Training vs Validation Accuracy')
plt.xlabel('Epoch')
plt.ylabel('Accuracy')
plt.legend()
plt.grid()

plt.subplot(1, 2, 2)
plt.plot(history.history['loss'], label='Train Loss')
plt.plot(history.history['val_loss'], label='Val Loss')
plt.title('Training vs Validation Loss')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.legend()
plt.grid()

plt.show()

# ---------------------------------------------------------
# AUTOMATIC METRICS (Precision, Recall, F1)
# ---------------------------------------------------------

y_true = np.argmax(y_val, axis=1)
y_pred = np.argmax(model.predict(X_val), axis=1)

accuracy  = accuracy_score(y_true, y_pred)
precision = precision_score(y_true, y_pred, average='macro')
recall    = recall_score(y_true, y_pred, average='macro')
f1        = f1_score(y_true, y_pred, average='macro')

print("\n----- MODEL METRICS -----")
print(f"Accuracy : {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall   : {recall:.4f}")
print(f"F1 Score : {f1:.4f}")

# ---------------------------------------------------------
# BAR GRAPH FOR METRICS
# ---------------------------------------------------------

metrics = [accuracy, precision, recall, f1]
names = ["Accuracy", "Precision", "Recall", "F1 Score"]

plt.figure(figsize=(8, 5))
bars = plt.bar(names, metrics)

plt.ylim(0, 1)
plt.title("Model Performance Metrics (0 - 1 Scale)")
plt.ylabel("Score")
plt.grid(axis='y')

# Add values on top of bars
for bar, value in zip(bars, metrics):
    plt.text(bar.get_x() + bar.get_width()/2, value + 0.02, f"{value:.2f}", ha='center')

plt.show()
