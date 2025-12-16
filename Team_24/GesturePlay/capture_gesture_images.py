import cv2
import os

# === EDIT THIS BEFORE RUNNING EACH TIME ===
gesture_class = 'nothing'  # Change to: one, two, three, four, thumbs_down, stop, nothing

# === Save Directory Setup ===
save_dir = os.path.join('gesture_dataset', gesture_class)
os.makedirs(save_dir, exist_ok=True)

cap = cv2.VideoCapture(0)
print(f"📷 Capturing images for class: '{gesture_class}'")
print("Press 's' to save image | 'q' to quit")

count = 0
while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)  # Flip horizontally for mirror view
    cv2.putText(frame, f"Gesture: {gesture_class}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    cv2.imshow("Capture Gesture", frame)

    key = cv2.waitKey(1)
    if key == ord('s'):
        img_path = os.path.join(save_dir, f"{gesture_class}_{count}.jpg")
        cv2.imwrite(img_path, frame)
        print(f"[+] Saved {img_path}")
        count += 1
    elif key == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
print(f"[✔] Collected {count} images in '{save_dir}'")
