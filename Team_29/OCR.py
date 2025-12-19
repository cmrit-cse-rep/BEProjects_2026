
import numpy as np
if not hasattr(np, 'sctypes'):
    # Restore np.sctypes for compatibility with older libraries
    np.sctypes = {
        'int': [np.int8, np.int16, np.int32, np.int64],
        'uint': [np.uint8, np.uint16, np.uint32, np.uint64],
        'float': [np.float16, np.float32, np.float64],
        'complex': [np.complex64, np.complex128],
        'others': [bool, object, bytes, str, np.void]
    }
from dotenv import load_dotenv
load_dotenv()
import requests 
import base64
import os
import cv2

import time
import speech_recognition as sr




def speak(text, pause=0.7):
    print(text)
    try:
        import pyttsx3
        engine = pyttsx3.init()
        engine.say(text)
        engine.runAndWait()
        time.sleep(pause)
    except Exception as e:
        print(f"[TTS ERROR] {e}")


def listen_command():
    r = sr.Recognizer()
    with sr.Microphone() as source:
        speak("Listening...", pause=0.2)
        audio = r.listen(source, timeout=5, phrase_time_limit=5)
    try:
        command = r.recognize_google(audio).lower()
        print(f"Heard: {command}")
        return command
    except sr.UnknownValueError:
        speak("Sorry, I did not understand. Please repeat.")
        return None
    except sr.RequestError:
        speak("Sorry, there was a problem with the speech recognition service.")
        return None
    except Exception as e:
        speak(f"Error: {str(e)}")
        return None
    


def pred_ocr_gemini(image_path):
    API_KEY = os.getenv("GEMINI_API_KEY")
    URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={API_KEY}"
    with open(image_path, "rb") as f:
        img_base64 = base64.b64encode(f.read()).decode("utf-8")
    headers = {
    "Content-Type": "application/json"
    }

    data = {
        "contents": [
            {
                "parts": [
                    {"text": "return me the OCR text in the image in a structured format, only the ocr text nothing else exactly how it is."},
                    {
                    "inline_data": {
                        "mime_type": "image/png",
                        "data": img_base64
                    }
                }
                ]
            }
        ]
    }

    response = requests.post(URL, headers=headers, json=data)
    result = response.json()

    # Print model response
    print(result["candidates"][0]["content"]["parts"][0]["text"])
    return result["candidates"][0]["content"]["parts"][0]["text"]



def ocr_services(speak):
    while True:
        speak("Welcome to text Recognition")
        speak("Please say 'start' to recognize text or 'stop' to exit.")
        command = listen_command()
        if command is None:
            continue
        if 'stop' in command:
            speak("Exiting the text recognition system. Goodbye!", pause=1)
            break
        elif 'start' in command:
            speak("Get ready to show the text to the webcam. Capturing in 3 seconds.")
            time.sleep(3)
            cap = cv2.VideoCapture(0)
            ret, frame = cap.read()
            cv2.imwrite('temp/captured_image.jpg', frame)
            
            cap.release()
            if not ret:
                speak("Failed to capture image from webcam.")
                continue
            pred_text = pred_ocr_gemini('temp/captured_image.jpg')
            if pred_text is not None:
                speak(f"Predicted text is {pred_text}")
                return
            else:
                speak("text not detected. Please try again.")
            # After recognition, always prompt again
            speak("Recognition complete.")
            return
        else:
            speak("Invalid command. Please say 'start' or 'stop'.")
def main():
    ocr_services(speak=speak)
if __name__ == "__main__":
    speak("Welcome to text Recognition. Say 'start' to begin or 'stop' to exit.")
    main()
