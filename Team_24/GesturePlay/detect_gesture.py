import cv2
import mediapipe as mp

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=1)
mp_draw = mp.solutions.drawing_utils

cap = cv2.VideoCapture(0)  
if not cap.isOpened():
    print("Error: Could not access the camera")
else:
    print("Camera is working")

def count_fingers(hand_landmarks):
    finger_tips = [8, 12, 16, 20]
    count = 0
    for tip in finger_tips:
        if hand_landmarks.landmark[tip].y < hand_landmarks.landmark[tip - 2].y:
            count += 1
    return count

while True:
    success, frame = cap.read()
    if not success:
        print("Error: Could not read frame")
        break

    frame = cv2.flip(frame, 1)  
    img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = hands.process(img_rgb)

    if result.multi_hand_landmarks:
        for hand in result.multi_hand_landmarks:
            mp_draw.draw_landmarks(frame, hand, mp_hands.HAND_CONNECTIONS)
            finger_count = count_fingers(hand)

            if finger_count == 0:
                gesture = "Fist"
            elif finger_count == 2:
                gesture = "Peace"
            elif finger_count == 5:
                gesture = "Open Palm"
            else:
                gesture = f"{finger_count} fingers"

            cv2.putText(frame, f"Gesture: {gesture}", (10, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)

    cv2.imshow("Gesture Detection", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
