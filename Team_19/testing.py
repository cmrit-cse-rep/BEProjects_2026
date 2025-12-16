import os
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from tensorflow.keras.applications.resnet50 import preprocess_input as res_preprocess
from tensorflow.keras.applications.vgg16 import preprocess_input as vgg_preprocess

# ---------------------------
# CLASS LABELS
# ---------------------------
class_names = ["Chickenpox", "Measles", "MonkeyPox", "Normal"]

# ---------------------------
# PREPROCESS IMAGE
# ---------------------------
def preprocess_image(img_path, model_type, img_size=224):
    img = load_img(img_path, target_size=(img_size, img_size))
    img = img_to_array(img)
    img = np.expand_dims(img, axis=0)

    if model_type == "resnet":
        img = res_preprocess(img)

    elif model_type == "vgg":
        img = vgg_preprocess(img)

    else:   # CNN
        img = img / 255.0

    return img


# ---------------------------
# MODEL SELECTION
# ---------------------------
print("\nSelect Model for Testing:")
print("1 → ResNet50 (Transfer Learning)")
print("2 → VGG16 (Transfer Learning)")
print("3 → Hybrid Model (ResNet50 + VGG16)")
print("4 → Custom CNN Model")

choice = int(input("Enter model number: "))

if choice == 1:
    model_path = "resnet50_best.h5"
    model_type = "resnet"
elif choice == 2:
    model_path = "vgg16_best.h5"
    model_type = "vgg"
elif choice == 3:
    model_path = "hybrid_best.h5"
    model_type = "vgg"       # hybrid expects vgg preprocess
elif choice == 4:
    model_path = "best_cnn_model.h5"
    model_type = "cnn"
else:
    print("Invalid Choice!")
    exit()

print(f"\n📌 Loading Model: {model_path}\n")
model = load_model(model_path)


# ---------------------------
# FOLDER INPUT
# ---------------------------
folder_path = input("Enter folder path containing test images: ")

if not os.path.isdir(folder_path):
    print("❌ Invalid folder path!")
    exit()

image_files = [f for f in os.listdir(folder_path)
               if f.lower().endswith(('.jpg', '.jpeg', '.png'))]

if len(image_files) == 0:
    print("❌ No images found in folder!")
    exit()

print(f"\n📁 Total Images Found: {len(image_files)}\n")


# ---------------------------
# PREDICT EACH IMAGE
# ---------------------------
for img_name in image_files:
    img_path = os.path.join(folder_path, img_name)

    img = preprocess_image(img_path, model_type)
    pred = model.predict(img)[0]

    class_index = np.argmax(pred)
    confidence = pred[class_index] * 100

    print(f"🖼 {img_name}")
    print(f"   → Predicted: {class_names[class_index]}")
    print(f"   → Confidence: {confidence:.2f}%\n")
