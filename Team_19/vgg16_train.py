import numpy as np
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications.vgg16 import preprocess_input, VGG16
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import matplotlib.pyplot as plt

# --------------------
# DATASET
# --------------------
train_dir = "./dataset/"
img_size = 224
batch_size = 16
num_classes = 4

datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    validation_split=0.3,
    rotation_range=20,
    width_shift_range=0.1,
    height_shift_range=0.1,
    zoom_range=0.2,
    horizontal_flip=True
)

train_data = datagen.flow_from_directory(
    train_dir,
    target_size=(img_size, img_size),
    batch_size=batch_size,
    class_mode="categorical",
    subset="training"
)

val_data = datagen.flow_from_directory(
    train_dir,
    target_size=(img_size, img_size),
    batch_size=batch_size,
    class_mode="categorical",
    shuffle=False,
    subset="validation"
)

# --------------------
# VGG16 MODEL
# --------------------
base = VGG16(
    weights=None,
    include_top=False,
    input_shape=(224, 224, 3)
)

# load manually downloaded NOTOP weights
base.load_weights("vgg16_weights_tf_dim_ordering_tf_kernels_notop.h5")

# --------------------
# CUSTOM CLASSIFIER
# --------------------
x = base.output
x = GlobalAveragePooling2D()(x)
x = Dense(256, activation='relu')(x)
x = Dropout(0.5)(x)
output = Dense(num_classes, activation='softmax')(x)

model = Model(inputs=base.input, outputs=output)

# freeze VGG16
for layer in base.layers:
    layer.trainable = False

model.compile(
    optimizer=Adam(1e-4),
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

# --------------------
# TRAINING
# --------------------
early = EarlyStopping(monitor='val_accuracy', patience=6, restore_best_weights=True)
check = ModelCheckpoint("vgg16_best.h5", monitor='val_accuracy', save_best_only=True)

history_vgg = model.fit(
    train_data,
    validation_data=val_data,
    epochs=30,
    callbacks=[early, check],
    verbose=1
)

# --------------------
# FINAL ACCURACY
# --------------------
loss, acc = model.evaluate(val_data)
print(f"Final Validation Accuracy: {acc*100:.2f}%")

# --------------------
# ACCURACY GRAPH
# --------------------
plt.figure(figsize=(10,5))
plt.plot(history_vgg.history['accuracy'], label='Train Accuracy')
plt.plot(history_vgg.history['val_accuracy'], label='Validation Accuracy')
plt.title("VGG16 Training Accuracy")
plt.xlabel("Epochs")
plt.ylabel("Accuracy")
plt.legend()
plt.grid()
plt.show()

# ==========================================================
# 🔥 AUTOMATIC METRICS + BAR GRAPH (Accuracy, Precision, Recall, F1)
# ==========================================================

# Get predictions
y_true = val_data.classes
y_pred = np.argmax(model.predict(val_data), axis=1)

# Compute metrics
accuracy  = accuracy_score(y_true, y_pred)
precision = precision_score(y_true, y_pred, average='macro')
recall    = recall_score(y_true, y_pred, average='macro')
f1        = f1_score(y_true, y_pred, average='macro')

print("\n----- METRICS -----")
print(f"Accuracy : {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall   : {recall:.4f}")
print(f"F1 Score : {f1:.4f}")

# BAR GRAPH
metrics = [accuracy, precision, recall, f1]
names = ["Accuracy", "Precision", "Recall", "F1-Score"]

plt.figure(figsize=(8,5))
bars = plt.bar(names, metrics)

plt.ylim(0, 1)
plt.title("VGG16 Performance Metrics")
plt.ylabel("Score (0 - 1)")
plt.grid(axis='y')

# add values on bars
for bar, value in zip(bars, metrics):
    plt.text(bar.get_x() + bar.get_width()/2, value + 0.02, f"{value:.2f}", ha='center')

plt.show()
