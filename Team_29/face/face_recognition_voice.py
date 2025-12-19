
import cv2
import insightface
import numpy as np
import sqlite3
import os
import pyttsx3
import speech_recognition as sr
import time
# Initialize InsightFace for detection and embedding
embedder = insightface.app.FaceAnalysis(name='buffalo_l')
embedder.prepare(ctx_id=0, det_size=(640, 640))

def speak(text):
    tts_engine = pyttsx3.init()
    tts_engine.say(text)
    tts_engine.runAndWait()

def listen_command():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("Listening for command...")
        audio = recognizer.listen(source)
    try:
        command = recognizer.recognize_google(audio)
        print(f"Command: {command}")
        return command.lower()
    except Exception as e:
        print("Could not understand audio.")
        return None

def create_db():
    conn = sqlite3.connect('faces.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS faces (name TEXT, embedding BLOB)''')
    conn.commit()
    conn.close()

def save_face(name, embedding):
    conn = sqlite3.connect('faces.db')
    c = conn.cursor()
    c.execute('INSERT INTO faces (name, embedding) VALUES (?, ?)', (name, embedding.tobytes()))
    conn.commit()
    conn.close()

def load_faces():
    conn = sqlite3.connect('faces.db')
    c = conn.cursor()
    c.execute('SELECT name, embedding FROM faces')
    data = c.fetchall()
    conn.close()
    faces = []
    for name, emb_blob in data:
        emb = np.frombuffer(emb_blob, dtype=np.float32)
        faces.append((name, emb))
    return faces

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def face_services(speak):
    create_db()
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[ERROR] Could not open webcam.")
        return
    print("[DEBUG] Webcam opened successfully.")
    instructions = (
        "Welcome! You can say one of the following commands:\n"
        "- 'train' to enroll a new face,\n"
        "- 'identify' to recognize a person,\n"
        "- 'stop' or 'quit' to stop the model."
    )
    print(instructions)
    speak(instructions)
    waiting_msg = "Waiting for your next command. You can say 'train', 'identify', or 'stop'."
    while True:
        print(waiting_msg)
        speak(waiting_msg)
        command = listen_command()
        if command in ['stop', 'quit', 'exit']:
            speak("Exiting the model. Goodbye!")
            break
        elif command == 'train':
            speak("Get ready for photo in 3 seconds.")
            for i in range(3, 0, -1):
                print(f"Capturing photo in {i}...")
                speak(str(i))
                time.sleep(1)
            ret, frame = cap.read()
            faces = embedder.get(frame)
            if len(faces) == 0:
                speak("No face detected. Try again.")
            else:
                emb = faces[0].embedding.astype(np.float32)
                speak("Please say the name to save for this face.")
                name = listen_command()
                if name:
                    save_face(name, emb)
                    speak(f"Face for {name} saved.")
                else:
                    speak("Could not understand the name. Try again.")
        elif command == 'identify':
            speak("Get ready for photo in 3 seconds.")
            for i in range(3, 0, -1):
                print(f"Capturing photo in {i}...")
                speak(str(i))
                time.sleep(1)
            ret, frame = cap.read()
            faces = embedder.get(frame)
            if len(faces) == 0:
                speak("No face detected. Try again.")
            else:
                known_faces = load_faces()
                if not known_faces:
                    speak("No known faces in database.")
                else:
                    results = []
                    for i, face in enumerate(faces):
                        emb = face.embedding.astype(np.float32)
                        sims = [cosine_similarity(emb, k[1]) for k in known_faces]
                        best_idx = np.argmax(sims)
                        if sims[best_idx] > 0.5:
                            results.append(known_faces[best_idx][0])
                        else:
                            results.append("Unknown person")
                    for idx, name in enumerate(results):
                        print(f"Face {idx+1}: {name}")
                        speak(f"Face {idx+1}: {name}")
                    return
        else:
            speak("Unknown command. Please say 'train', 'identify', or 'stop'.")
    # No repeating of full instructions after the first time
    cap.release()
    cv2.destroyAllWindows()
    print("[DEBUG] Webcam and windows released.")
def main():
    face_services(speak=speak)
if __name__ == "__main__":
    main()
