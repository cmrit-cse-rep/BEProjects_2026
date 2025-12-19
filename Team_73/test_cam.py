import cv2

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ Cannot open camera on index 0, trying index 1...")
    cap = cv2.VideoCapture(1)

if not cap.isOpened():
    print("❌ No camera detected. Exiting.")
    exit()

print("✅ Camera opened. Press Q to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        print("❌ Failed to grab frame")
        break

    cv2.imshow("Camera Feed Test", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
