# Gesture Learning Platform 🧠✋

A Flask-based learning platform for children with autism.  
It uses **MediaPipe** and **TensorFlow** to recognize hand gestures and provides interactive learning activities such as **Emotion Quiz** and **Face Matching Game**.

---

## 🚀 Features
- Real-time gesture detection (MediaPipe + TensorFlow)
- Flask REST API for model inference
- Emotion Quiz & Face Matching mini-games
- Progress tracking and educational focus
- Unit-tested APIs and Docker support

---

## 🧩 Tech Stack
- **Backend:** Flask, Python
- **AI Models:** TensorFlow, MediaPipe, OpenCV
- **Frontend:** HTML, CSS, JS
- **Testing:** Pytest
- **Deployment:** Docker, GitHub Actions (CI)

---

## ⚙️ Installation
```bash
git clone https://github.com/<your-username>/gesture-learning-platform.git
cd gesture-learning-platform
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate (Windows)
pip install -r requirements.txt
python app.py
```

🧪 Run Tests
pytest

🐳 Docker Setup
docker build -t gesture-app .
docker run -p 5000:5000 gesture-app

📸 Screenshots

<img width="1896" height="903" alt="image" src="https://github.com/user-attachments/assets/c2650952-09fd-4daf-a56b-824d286c0ae7" />


🪄 Author & Contributor

Pratyush Kumar Singh\
Prattoy Dey


Commit and push:
```bash
git add README.md
git commit -m "docs: add project README"
git push
