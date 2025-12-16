# Team_19 – Monkeypox Disease Classification System

## Project Title
Classification of Monkey Pox Disease from Various Skin Images Using Deep Learning Models

## Team Number
Team_19

## Branch
Computer Science and Engineering (CSE)

---

## 📌 Project Description
This project presents an intelligent deep learning–based system to classify skin disease images into
four categories:
- Chickenpox
- Measles
- Monkeypox
- Normal Skin

The system uses multiple deep learning architectures including a Custom CNN, VGG16, ResNet50,
and a Hybrid model (ResNet50 + VGG16).  
A Flask-based web application is developed to allow users to upload images and receive
predictions along with confidence scores and basic precautionary steps.

---

## 🧠 Models Implemented
1. **Custom CNN Model**
2. **VGG16 (Transfer Learning)**
3. **ResNet50 (Transfer Learning)**
4. **Hybrid Model (ResNet50 + VGG16)**

All models are evaluated using:
- Accuracy
- Precision
- Recall
- F1-Score

---

## ⚙️ Technologies Used
- Python
- TensorFlow & Keras
- Flask (Web Framework)
- OpenCV & Pillow
- NumPy, Scikit-learn, Matplotlib
- SQLite (for user authentication)

---

## 📂 Project Structure
Team_19/
│── app.py
│── train.py
│── testing.py
│── vgg16_train.py
│── resnet_train.py
│── hybrid.py
│── requirements.txt
│
├── templates/
├── static/
├── uploads/
│
├── dataset/
│ └── README.md
│
├── model/
│ └── README.md


---

## 🚫 Large Files (Dataset & Models)
Due to GitHub file size limitations, the dataset and trained model files (`.h5`) are not uploaded
to this repository.

### 🔗 Google Drive Link (Dataset + Trained Models)
  https://drive.google.com/drive/folders/1EvWey9HT9TC_F-o2jT2i8HK6iA-wny4J?usp=drive_link

**Drive Contents:**
- Dataset (Skin disease images)
- Trained CNN, VGG16, ResNet50, and Hybrid model files

---

## ▶️ How to Run the Project
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   
2. Run the Flask application:
   python app.py


3. Open browser and visit:
   http://127.0.0.1:5000

4. Register → Login → Upload image → Select model → Predict

⚠️ Disclaimer
    This system is developed for academic and research purposes only.
    It is not a substitute for professional medical diagnosis.
