import os
import json
import pickle
import random
import traceback
import nltk
import numpy as np
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

# --- 1. Configuration & Setup ---
load_dotenv()
SECRET_KEY = os.environ.get("SECRET_KEY")

app = Flask(__name__)
# Enable CORS for all domains so your React frontend can connect
CORS(app, resources={r"/*": {"origins": "*"}})

# --- 2. Global Variables for Lazy Loading ---
# We initialize these as None and load them only when the first request comes in.
chat_model = None
words = None
classes = None
knowledge_base = None
lemmatizer = None

# --- 3. Helper Functions ---

def load_chatbot_resources():
    """Loads the heavy AI model and data files only when needed."""
    global chat_model, words, classes, knowledge_base, lemmatizer
    
    if chat_model is not None:
        return

    print("⏳ Loading Local Chatbot AI models...")
    
    from nltk.stem import WordNetLemmatizer
    from tensorflow import keras

    # Ensure NLTK data exists (Required for Render)
    try:
        nltk.data.find('tokenizers/punkt')
        nltk.data.find('tokenizers/punkt_tab')
        nltk.data.find('corpora/wordnet')
        nltk.data.find('corpora/omw-1.4')
    except LookupError:
        print("⬇️ Downloading missing NLTK data...")
        nltk.download('punkt')
        nltk.download('punkt_tab')
        nltk.download('wordnet')
        nltk.download('omw-1.4')

    lemmatizer = WordNetLemmatizer()
    
    try:
        # Load the trained model and helper files
        # Ensure these files are present in your project folder!
        chat_model = keras.models.load_model('chat_model.h5')
        with open('words.pickle', 'rb') as f:
            words = pickle.load(f)
        with open('classes.pickle', 'rb') as f:
            classes = pickle.load(f)
        
        # Load Knowledge Base (Combine intents and csv data)
        knowledge_base = []
        try:
            with open('intents.json') as file:
                knowledge_base.extend(json.load(file)['intents'])
        except FileNotFoundError:
            print("⚠️ intents.json not found.")

        try:
            with open('csv.json') as file:
                for item in json.load(file):
                    # We create tags for CSV items like 'paris_info' to match prediction logic
                    knowledge_base.append({
                        "tag": item['cleaned_query'].lower().replace(' ', '_') + "_info",
                        "patterns": [item['cleaned_query']],
                        "responses": [item['response']]
                    })
        except FileNotFoundError:
             print("⚠️ csv.json not found.")
             
        print("✅ Chatbot resources loaded successfully!")
    except Exception as e:
        print(f"❌ Error loading chatbot files: {e}")
        traceback.print_exc()


# ==========================================
#               CHATBOT ROUTE
# ==========================================

@app.route('/chat', methods=['POST'])
def chat():
    # 1. Load resources (only happens on the first request)
    load_chatbot_resources()
    
    if not chat_model:
        return jsonify({"reply": "Chatbot is initializing or failed to load. Please check server logs."})

    data = request.get_json()
    user_message = data.get("message")
    
    if not user_message:
        return jsonify({"reply": "Please send a message."})

    # 2. Define Prediction Helper Functions (Locally to use loaded modules)
    import nltk
    def clean_up_sentence(sentence):
        sentence_words = nltk.word_tokenize(sentence)
        sentence_words = [lemmatizer.lemmatize(word.lower()) for word in sentence_words]
        return sentence_words

    def bag_of_words(sentence, words):
        sentence_words = clean_up_sentence(sentence)
        bag = [0] * len(words)
        for s in sentence_words:
            for i, w in enumerate(words):
                if w == s:
                    bag[i] = 1
        return np.array(bag)

    try:
        # 3. Convert message to numbers (Bag of Words)
        bow = bag_of_words(user_message, words)
        
        # 4. Get Prediction from Model
        res = chat_model.predict(np.array([bow]), verbose=0)[0]
        
        # 5. Filter out low-confidence results
        ERROR_THRESHOLD = 0.25
        results = [[i, r] for i, r in enumerate(res) if r > ERROR_THRESHOLD]
        # Sort by strength of probability
        results.sort(key=lambda x: x[1], reverse=True)
        
        predicted_tag = classes[results[0][0]] if results else None
        bot_response = ""

        # 6. Find response in local knowledge base
        if predicted_tag:
            for intent in knowledge_base:
                if intent['tag'] == predicted_tag:
                    bot_response = random.choice(intent['responses'])
                    break
        
        # 7. Fallback if no response found
        if not bot_response:
            bot_response = "Sorry, I don't have information on that yet. Try asking about a specific city I know."

        return jsonify({"reply": bot_response})
        
    except Exception as e:
        print(f"Chatbot Error: {e}")
        traceback.print_exc()
        return jsonify({"reply": "I'm having a brain freeze. Please try again."})


if __name__ == "__main__":
    # Render sets the PORT environment variable
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)