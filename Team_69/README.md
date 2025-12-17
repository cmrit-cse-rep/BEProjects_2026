# 🌾 AgroCare AI

## 🌱 Overview
**AgroCare AI** is an intelligent web-based system that detects plant leaf diseases using **Deep Learning**.  
It empowers farmers and agricultural experts to identify crop diseases early, ensuring healthier yields and sustainable farming practices.

---

## 🧠 Machine Learning Phase
- **Frameworks:** Python, TensorFlow, Keras  
- **Model:** Convolutional Neural Network (CNN) trained on images of **Tomato**, **Potato**, and **Capsicum** leaves.  
- **Features:**
  - Efficient data loading and preprocessing using `tf.data`
  - Data augmentation (random rotation, flipping)
  - High-accuracy image classification with CNN
- **Deployment:** FastAPI for serving the trained model

---

## 💻 Web Application
- **Stack:** MERN (MongoDB, Express.js, React.js, Node.js)  
- **Authentication:** Auth0 for secure user login  
- **Features:**
  - User dashboard for personalized interaction  
  - Leaf image upload for real-time disease prediction  
  - Backend-frontend communication through REST APIs  

---

## ☁️ Deployment
- **Frontend:** Deployed on [Vercel](https://agro-care-ai-final.vercel.app) with SSL support  
- **Backend:** Deployed on [Render](https://agroaibackend-f1p9.onrender.com) using FastAPI  
> ⚠️ *Note:* The backend may take up to 5 minutes to start if idle.

---

## 🚀 Future Enhancements
- Integrate **AWS EC2** / **Elastic Beanstalk** for better scalability  
- Use **TensorFlow Serving** + **Docker** for efficient model deployment  
- Add input validation to verify uploaded leaf images  
- Expand to include more crop types  

---

## 🌾 Conclusion
AgroCare AI leverages artificial intelligence to promote smarter and healthier agriculture — helping farmers detect plant diseases early and improve productivity.

🔗 **Live Website:** [AgroCare AI](https://agro-care-ai-final.vercel.app/)
