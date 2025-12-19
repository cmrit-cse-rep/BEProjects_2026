"""
Enhanced Scene Description with Face Recognition Integration
Combines scene understanding with face identification for personalized descriptions
"""

from dotenv import load_dotenv
load_dotenv()

import cv2
import numpy as np
import base64
import requests
import sqlite3
import os
import time
import speech_recognition as sr
from insightface.app import FaceAnalysis

from elevenlabs.client import ElevenLabs
from elevenlabs import play

client = ElevenLabs(
    api_key=os.getenv("ELEVEN_LABS_API_KEY")
)

def speak(text, pause=0.7):
    """Text-to-speech using ElevenLabs"""
    print(f"🔊 {text}")
    try:
        audio = client.text_to_speech.convert(
            text=text,
            voice_id="JBFqnCBsd6RMkjVDRZzb",
            model_id="eleven_multilingual_v2",
            output_format="mp3_44100_128",
        )
        play(audio)
        time.sleep(pause)
    except Exception as e:
        print(f"[TTS ERROR] {e}")

def listen_command():
    """Voice recognition"""
    r = sr.Recognizer()
    with sr.Microphone() as source:
        speak("Listening...", pause=0.2)
        audio = r.listen(source, timeout=5, phrase_time_limit=5)
    try:
        command = r.recognize_google(audio).lower()
        print(f"🗣️ Heard: {command}")
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

def get_faces_in_scene(image_path):
    """
    Detect and recognize faces in the scene
    
    Returns:
        List of recognized people with their positions and confidence scores
    """
    try:
        # Initialize InsightFace
        app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
        app.prepare(ctx_id=0, det_size=(640, 640))
        
        # Load image
        img = cv2.imread(image_path)
        if img is None:
            print("❌ Failed to load image")
            return []
        
        # Detect faces
        faces = app.get(img)
        
        if len(faces) == 0:
            print("ℹ️ No faces detected in the scene")
            return []
        
        print(f"👤 Detected {len(faces)} face(s)")
        
        # Connect to face database
        conn = sqlite3.connect('faces.db')
        c = conn.cursor()
        c.execute('SELECT name, embedding FROM faces')
        stored_faces = c.fetchall()
        conn.close()
        
        if not stored_faces:
            print("ℹ️ No faces in database to compare")
            return []
        
        recognized_people = []
        img_height, img_width = img.shape[:2]
        
        for idx, face in enumerate(faces):
            detected_embedding = face.embedding.astype(np.float32)
            best_match = None
            best_similarity = 0.0
            
            # Compare with stored faces
            for name, stored_embedding_blob in stored_faces:
                stored_embedding = np.frombuffer(stored_embedding_blob, dtype=np.float32)
                
                # Cosine similarity
                similarity = np.dot(detected_embedding, stored_embedding) / (
                    np.linalg.norm(detected_embedding) * np.linalg.norm(stored_embedding)
                )
                
                if similarity > best_similarity and similarity > 0.5:
                    best_similarity = similarity
                    best_match = name
            
            if best_match:
                # Get face bounding box
                bbox = face.bbox.astype(int)
                x, y, w, h = bbox[0], bbox[1], bbox[2] - bbox[0], bbox[3] - bbox[1]
                
                # Determine position in image
                position = "center"
                if x < img_width / 3:
                    position = "left"
                elif x > 2 * img_width / 3:
                    position = "right"
                
                # Determine vertical position
                vertical_pos = "middle"
                if y < img_height / 3:
                    vertical_pos = "upper"
                elif y > 2 * img_height / 3:
                    vertical_pos = "lower"
                
                recognized_people.append({
                    "name": best_match,
                    "position": position,
                    "vertical_position": vertical_pos,
                    "confidence": float(best_similarity)
                })
                
                print(f"✅ Recognized: {best_match} (confidence: {best_similarity:.2f}) at {position} {vertical_pos}")
            else:
                print(f"❓ Face {idx+1} not recognized (best similarity: {best_similarity:.2f})")
        
        return recognized_people
        
    except Exception as e:
        print(f"❌ Error in face recognition: {e}")
        return []

def get_basic_scene_description(image_path):
    """Get basic scene description from SmolVLM"""
    VLM_URL = os.getenv("VLM_URL", "http://localhost:1234")
    
    with open(image_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    
    URL = f"{VLM_URL}/v1/chat/completions"
    headers = {"Content-Type": "application/json"}
    
    data = {
        "model": "smolvlm2-2.2b-instruct",
        "messages": [
            {
                "role": "user", 
                "content": [
                    {
                        "type": "text",
                        "text": "Describe this scene in detail. Focus on: what people are doing, objects present, the environment, and any notable activities or interactions."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{encoded_string}"
                        }
                    }
                ]
            }
        ],
        "temperature": 0.7,
        "max_tokens": -1,
        "stream": False
    }
    
    try:
        response = requests.post(URL, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        
        description = result["choices"][0]["message"]["content"]
        return description
        
    except Exception as e:
        print(f"❌ Error getting scene description: {e}")
        return "Unable to describe the scene at this moment."

def enhance_description_with_faces(scene_description, recognized_people):
    """
    Enhance scene description by adding personalized face information using Gemini
    """
    if not recognized_people:
        return scene_description
    
    # Build context about recognized people
    people_list = []
    for person in recognized_people:
        location = f"{person['vertical_position']} {person['position']}"
        people_list.append(f"{person['name']} (located at {location} of the image)")
    
    people_context = ", ".join(people_list)
    
    # Use Gemini to create natural enhanced description
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    
    prompt = f"""Given this scene description and the identified people, create a natural, personalized description.

Scene Description: {scene_description}

Identified People: {people_context}

Create a cohesive description that:
1. Mentions the identified people by name naturally
2. Describes what they are doing based on the scene description
3. Includes their positions if relevant
4. Maintains a conversational tone suitable for audio output

Keep the description concise (2-3 sentences) and focus on the most important details."""

    headers = {"Content-Type": "application/json"}
    data = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 150
        }
    }
    
    try:
        response = requests.post(URL, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        
        enhanced_description = result["candidates"][0]["content"]["parts"][0]["text"]
        return enhanced_description.strip()
        
    except Exception as e:
        print(f"❌ Error enhancing description: {e}")
        # Fallback to simple concatenation
        names = [p['name'] for p in recognized_people]
        return f"I can see {', '.join(names)} in this scene. {scene_description}"

def enhanced_scene_description(image_path):
    """
    Main function: Get complete scene description with face recognition
    """
    print("\n" + "="*50)
    print("🎬 ENHANCED SCENE ANALYSIS")
    print("="*50)
    
    # Step 1: Recognize faces
    print("\n👤 Step 1: Face Recognition...")
    recognized_people = get_faces_in_scene(image_path)
    
    # Step 2: Get basic scene description
    print("\n🖼️ Step 2: Scene Understanding...")
    scene_description = get_basic_scene_description(image_path)
    
    # Step 3: Enhance with face information
    print("\n✨ Step 3: Creating Personalized Description...")
    if recognized_people:
        final_description = enhance_description_with_faces(scene_description, recognized_people)
    else:
        final_description = scene_description
    
    print("\n" + "="*50)
    print("📝 FINAL DESCRIPTION:")
    print("="*50)
    print(final_description)
    print("="*50 + "\n")
    
    return final_description

def scene_describe_service(speak_func):
    """
    Service function for enhanced scene description with face recognition
    Can be called from agent.py or run standalone
    """
    while True:
        #speak_func("Welcome to Scene Description ")
        speak_func("Please say 'start' to analyze a scene or 'stop' to exit.")
        
        command = listen_command()
        if command is None:
            continue
            
        if 'stop' in command or 'exit' in command:
            speak_func("Exiting the scene description system. Goodbye!", pause=1.5)
            break
            
        elif 'start' in command:
            speak_func("Get ready to show the scene to the camera. Capturing in 3 seconds.")
            time.sleep(3)
            
            # Capture image
            cap = cv2.VideoCapture(0)
            ret, frame = cap.read()
            cap.release()
            
            if not ret:
                speak_func("Failed to capture image from webcam.")
                continue
            
            # Save image
            image_path = 'temp/enhanced_scene.jpg'
            os.makedirs('temp', exist_ok=True)
            cv2.imwrite(image_path, frame)
            
            # Get enhanced description
            description = enhanced_scene_description(image_path)
            
            # Speak the description
            speak_func(description)
            speak_func("Scene analysis complete.")
            return
            
        else:
            speak_func("Invalid command. Please say 'start' or 'stop'.")

def main():
    """Standalone execution"""
    os.makedirs('temp', exist_ok=True)
    scene_describe_service(speak)

if __name__ == "__main__":
    speak("Welcome to Enhanced Scene Description.")
    main()
