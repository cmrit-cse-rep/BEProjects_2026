# AI-Based Pothole Detection and Analysis using YOLOv11 and MiDaS

## 📌 Overview
This project implements an AI-driven system to detect potholes from road images or videos and recommend safer travel routes by avoiding high-severity pothole zones. The system uses deep learning–based computer vision techniques for pothole detection and depth estimation, combined with map-based routing APIs for safe route planning.  
All processing is performed **on-demand and per session**, without any database or persistent storage.

---

## 🚀 Features
- Automatic pothole detection from images and videos
- Real-world size estimation (area, depth, volume)
- Severity classification and repair cost estimation
- Safe route recommendation based on pothole severity
- Interactive Streamlit-based user interface
- Downloadable CSV reports (temporary)
- No database integration (session-based processing)

---

## 🧠 System Architecture
The project is divided into **two independent modules**, each with its own frontend interface:

### 1️⃣ Pothole Analysis Module (`app.py`)
- Upload road images or videos
- Detect potholes using YOLOv11
- Estimate depth using MiDaS
- Compute area, volume, severity, and repair cost
- Display annotated images and analytical results
- Optionally download CSV reports

### 2️⃣ Route Planning Module (`city_map.py`)
- Enter source and destination
- Use BBMP KML datasets and OSRM API
- Compute safest route by avoiding high-severity potholes
- Visualize route on map
- Optional CSV export

👉 Image analysis and route planning are **independent user actions**.

---

## 🛠️ Technologies Used
- **Frontend:** Streamlit
- **Pothole Detection:** YOLOv11
- **Depth Estimation:** MiDaS
- **Route Planning:** OSRM API
- **Geospatial Data:** BBMP KML Dataset
- **Programming Language:** Python

---

## 📂 Project Structure
├── app.py # Pothole detection & analysis module
├── city_map.py # Safe route planning module
├── models/ # YOLOv11 and MiDaS models
├── utils/ # Helper functions
├── requirements.txt # Project dependencies
├── README.md # Project documentation


## ⚙️ How It Works

### Pothole Analysis Flow
1. User uploads an image or video
2. Input is preprocessed (frame extraction, resizing)
3. YOLOv11 detects potholes (bounding boxes)
4. MiDaS estimates depth
5. Post-processing computes:
   - Area
   - Depth
   - Volume
   - Severity
   - Repair cost
6. Results are displayed instantly on the UI

### Safe Route Planning Flow
1. User enters source and destination
2. OSRM API generates multiple routes
3. BBMP KML data provides pothole locations
4. Routes are scored based on pothole severity
5. Safest route is visualized on the map

---

## 🧾 Data Handling Policy
- ❌ No database is used
- ✔ All processing is **temporary and session-based**
- ✔ Results are cleared when a new input is provided
- ✔ CSV files are generated only for download

---

## 👥 User Roles
- **Public User:** Upload images, view analysis, request safe routes
- **Municipal Authority:** View detailed analytics, download reports, plan safer routes

*(Both users have access to both modules.)*

---

## 📦 Installation

```bash
pip install -r requirements.txt
Run pothole analysis:

streamlit run app.py
Run route planning:

streamlit run city_map.py
📈 Applications
Smart city road monitoring

Municipal infrastructure management

Safer navigation for commuters

Automated road condition assessment

🔮 Future Enhancements
Database integration for historical analysis

Real-time video stream processing

Mobile application support

Automatic repair prioritization dashboard

📜 License
This project is developed for academic purposes as a final-year engineering project.
