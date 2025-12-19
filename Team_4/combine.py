import cv2
from deepface import DeepFace

# Load face cascade classifier
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

import telepot
bot=telepot.Bot('8304515213:AAGPRC957iOtQxi0ANRW_UIBnf05JefrbiM')


# ---------------------------
# Image-based detection
# ---------------------------
def File(input_path):
    output_path = "out.jpg"

    # Load the image
    frame = cv2.imread(input_path)
    if frame is None:
        print("Error: Could not read the image file.")
        return

    # Convert frame to grayscale
    gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Convert grayscale frame to RGB format
    rgb_frame = cv2.cvtColor(gray_frame, cv2.COLOR_GRAY2RGB)

    # Detect faces in the frame
    faces = face_cascade.detectMultiScale(gray_frame, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

    for (x, y, w, h) in faces:
        # Extract the face ROI (Region of Interest)
        face_roi = rgb_frame[y:y + h, x:x + w]

        # Perform emotion analysis on the face ROI
        result = DeepFace.analyze(face_roi, actions=['emotion'], enforce_detection=False)

        # Determine the dominant emotion
        emotion = result[0]['dominant_emotion']
        print("Image Emotion:", emotion)

        # Draw rectangle around face and label with predicted emotion
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)
        cv2.putText(frame, emotion, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)

    # Save the output image
    cv2.imwrite(output_path, frame)
    cv2.imshow('Emotion Detection', frame)
    cv2.waitKey(0)
    print(f"Output saved at {output_path}")
    bot.sendMessage('5788884211',str("EMOTION DETECTION  Status: Completed"))
    bot.sendPhoto('5788884211',photo=open("out.jpg","rb"))
    bot.sendLocation('5788884211',latitude=13.032674274514838, longitude=77.59203816475915)


# ---------------------------
# Real-time video detection
# ---------------------------
def Start(input_path=0):
    print(f"Starting real-time detection with camera: {input_path}")
    
    # Start capturing video
    cap = cv2.VideoCapture(input_path)

    if not cap.isOpened():
        print("Error: Could not access the camera.")
        return

    while True:
        # Capture frame-by-frame
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame")
            break

        # Convert frame to grayscale
        gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Convert grayscale frame to RGB format
        rgb_frame = cv2.cvtColor(gray_frame, cv2.COLOR_GRAY2RGB)

        # Detect faces in the frame
        faces = face_cascade.detectMultiScale(gray_frame, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

        for (x, y, w, h) in faces:
            # Extract the face ROI (Region of Interest)
            face_roi = rgb_frame[y:y + h, x:x + w]

            # Perform emotion analysis on the face ROI
            result = DeepFace.analyze(face_roi, actions=['emotion'], enforce_detection=False)

            # Determine the dominant emotion
            emotion = result[0]['dominant_emotion']
            print("Video Emotion:", emotion)

            # Draw rectangle around face and label with predicted emotion
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)
            cv2.putText(frame, emotion, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
            cv2.imwrite("out.jpg", frame)
            bot.sendMessage('5788884211',"EMOTION DETECTION  Status: {}".format(emotion))
            bot.sendPhoto('5788884211',photo=open("out.jpg","rb"))
            bot.sendLocation('5788884211',latitude=13.032674274514838, longitude=77.59203816475915)

        # Display the resulting frame
        cv2.imshow('Real-time Emotion Detection', frame)

        # Press 'q' to exit
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Release the capture and close all windows
    cap.release()
    cv2.destroyAllWindows()



f = open('temp.txt', 'r')
name = f.read()
f.close()

print(f"Read from temp.txt: {name}")
if name.strip().endswith((".png", ".jpg", ".jpeg")):
    File(name)
elif name == "0":
    print("Starting real-time detection...")
    Start()

else:
    print("Invalid choice! Exiting...")
