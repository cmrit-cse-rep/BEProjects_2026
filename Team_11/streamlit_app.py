import streamlit as st
from PIL import Image
import torch
from torchvision import transforms

# Load your trained model
# (adjust path & model-loading code as per your training script)
model = torch.load("../models/plant_classifier.pth", map_location="cpu")
model.eval()

# Define same transforms you used during training
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

st.title("Medicinal Plant Recognizer 🌿")

# File uploader
uploaded_file = st.file_uploader("Upload a plant image", type=["jpg", "jpeg", "png"])

if uploaded_file is not None:
    # Show the image
    image = Image.open(uploaded_file).convert("RGB")
    st.image(image, caption="Uploaded Image", use_container_width=True)

    # Predict button
    if st.button("Predict"):
        with st.spinner("Analyzing..."):
            img_tensor = transform(image).unsqueeze(0)
            with torch.no_grad():
                outputs = model(img_tensor)
                _, predicted = outputs.max(1)
            # Map predicted index to class name
            class_names = ['Class1', 'Class2', 'Class3']  # replace with your classes
            st.success(f"Prediction: **{class_names[predicted.item()]}**")
