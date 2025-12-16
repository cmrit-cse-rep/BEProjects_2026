import pyttsx3
import os

# Initialize the TTS engine
engine = pyttsx3.init()

# Optional voice settings
engine.setProperty('rate', 150)  # Words per minute
engine.setProperty('volume', 1.0)  # Max volume

# List of quiz questions
questions = [
    "Your friend gives you a surprise gift. How do you feel?",
    "You lost your favorite toy. What emotion fits best?",
    "You see a scary shadow in your room. What might you feel?",
    "It is your birthday and everyone sings for you!",
    "You spilled juice on your homework. How would that make you feel?"
]

# Output folder inside /static/sounds/
output_folder = "static/sounds/emotion_quiz"
os.makedirs(output_folder, exist_ok=True)

# Generate audio files
for idx, question in enumerate(questions, start=1):
    filename = os.path.join(output_folder, f"q{idx}.wav")
    engine.save_to_file(question, filename)
    print(f"Saved: {filename}")

engine.runAndWait()
print("✅ All audio files generated successfully.")
