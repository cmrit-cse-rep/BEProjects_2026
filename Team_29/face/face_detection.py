import cv2
from mtcnn import MTCNN

print("[DEBUG] Script started.")

# Initialize face detector
face_detector = MTCNN()

# Try to open the webcam
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("[ERROR] Could not open webcam.")
    exit(1)
print("[DEBUG] Webcam opened successfully.")

while True:
    ret, frame = cap.read()
    if not ret:
        print("[ERROR] Failed to read frame from webcam.")
        break
    faces = face_detector.detect_faces(frame)
    print(f"[DEBUG] Faces detected: {len(faces)}")
    for face in faces:
        x, y, w, h = face['box']
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
    cv2.imshow('Face Detection', frame)
    key = cv2.waitKey(1)
    if key == ord('q'):
        print("[DEBUG] Quit key pressed.")
        break

cap.release()
cv2.destroyAllWindows()
print("[DEBUG] Webcam and windows released.")
