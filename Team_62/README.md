Smart Handled Camera System
A web-based smart camera platform built using Flask and Picamera2, providing live video streaming, image
capture, and video recording through a browser-based dashboard. Captured media is automatically uploaded to a
remote PHP server and removed from local storage.

Overview
The Smart Handled Camera System allows users to remotely control a camera connected to a Raspberry Pi or
similar device. The system exposes a REST-based API and an MJPEG video stream, which are consumed by a
responsive HTML dashboard.

Key Features
- Live MJPEG camera streaming via browser
- Remote start and stop of camera
- Image capture with automatic upload
- Video recording with start and stop control
- User-based recording validation
- Automatic cleanup of local media files
- Web dashboard for real-time control and preview
- CORS-enabled API for cross-origin access
- Cloudflare tunnel support for public exposure

Technology Stack
Backend: Python 3, Flask, Flask-CORS, OpenCV, Picamera2, Requests
Frontend: HTML5, Bootstrap 5, JavaScript, Font Awesome
External Services: PHP Upload API, Cloudflare Tunnel
API Endpoints
POST /start_camera – Start camera
POST /stop_camera – Stop camera
GET /stream – Live MJPEG stream
POST /capture – Capture image and upload
POST /start_record – Start video recording
POST /stop_record – Stop recording and upload
All POST requests require:
{ "user_id": 1 }
Media Upload Flow
Media is captured locally, uploaded to the PHP server, a public URL is returned, and the local file is deleted to save
storage.

Upload endpoint:
https://aislyntech.com/Api/smart-camera/upload_api.php

Installation
Install dependencies:
pip install flask flask-cors opencv-python requests

Run server:
python app.py
Server runs on:
http://0.0.0.0:5000
Project URL: https://aislyntech.com/Api/smart-camera/index

Security Notes
Recording can only be stopped by the initiating user. CORS is enabled. Cloudflare tunnel is recommended for
exposure. Authentication is not implemented by default.

Authors
Vibhu D V, Sonal Edrick Veigas, Akshatha S
Smart Handled Camera System
Copyright 2025
License


