🧠 AI-Powered Skin Disease Detection System

An intelligent web-based application for multi-class skin disease classification using deep learning and explainable AI (Grad-CAM). The system assists early dermatological assessment by providing predictions, visual explanations, and automated diagnostic reports.

📌 Project Overview

This project presents an AI-powered dermatology support system that detects and classifies six common skin conditions from uploaded images. The core deep learning model, DermaNet50, is a fine-tuned CNN based on the residual learning architecture of ResNet50, enhanced with Grad-CAM for interpretability.
The system is deployed as a Flask web application, allowing users to upload images, view predictions with confidence scores, visualize affected regions, and download structured PDF reports.

🎯 Skin Conditions Supported

Acne
Eczema
Melanoma
Hair Loss (Alopecia)
Psoriasis
Normal Skin

✨ Key Features

📷 Image Upload & Webcam Capture
🧠 AI-Based Multi-Class Classification
🔍 Grad-CAM Explainability (visual heatmaps)
🧑‍⚕️ Patient Information Capture
📄 Automated PDF Report Generation
🌐 User-Friendly Web Interface
⚡ Fast Inference with Optimized CNN

🏗️ System Architecture

Frontend: HTML, CSS, JavaScript
Backend: Flask (Python)
Deep Learning: TensorFlow / Keras
DermaNet50 (ResNet50-based CNN)
Image Processing: OpenCV
Explainability: Grad-CAM
PDF Generation: xhtml2pdf
Deployment: Docket

🧠 Model Architecture

Model Name: DermaNet50
Base Architecture: ResNet50 (ImageNet pre-trained)

Custom Modifications:

Removed original classification head
Global Average Pooling layer
Dense layer (1024 units, ReLU)
Dropout (0.5) for regularization
Softmax output layer (6 classes)

Input Size: 224 × 224 RGB images

📊 Training Details

Dataset: DermNet (5,547 images)
Train–Validation Split: 80% / 20%
Batch Size: 32
Epochs: 100
Optimizer: Adam
Loss Function: Categorical Cross-Entropy
Data Augmentation:
Rotation
Zoom
Horizontal Flip
Brightness Adjustment

📈 Model Performance

Accuracy: 89.42%
Precision: > 89%
Recall: > 89%
F1-Score: > 89%

Grad-CAM visualizations confirm that the model focuses on clinically relevant regions, improving trust and transparency.

⚙️ Installation
1️⃣ Clone the Repository
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name

2️⃣ Install Dependencies
pip install -r requirements.txt

3️⃣ Run the Application
python app.py

🚀 Usage

Start the Flask server
Open browser and navigate to:
http://localhost:7860
Upload a skin image or use webcam capture
Enter patient details (optional)

View:

Predicted disease
Confidence score
Grad-CAM heatmap
Download the diagnostic PDF report

📄 Output

Predicted skin condition
Confidence score
Grad-CAM visualization
Patient details
Downloadable PDF diagnostic report

👩‍💻 Contributors

N. Varsha
Likhitha N. Swamy
Mahima Gowda R.
CMR Institute of Technology, Bangalore
