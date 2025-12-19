import json
import random
import tkinter as tk
from tkinter import scrolledtext, messagebox
import numpy as np
from tensorflow import keras
import pickle

# Load necessary files (model, tokenizer, label encoder, intents)
with open('csv.json') as file:
    data = json.load(file)

# Load trained model
model = keras.models.load_model('chat_model.h5')

# Load tokenizer object
with open('tokenizer.pickle', 'rb') as handle:
    tokenizer = pickle.load(handle)

# Load label encoder object
with open('label_encoder.pickle', 'rb') as enc:
    lbl_encoder = pickle.load(enc)

# Define parameters
max_len = 20

# Function to get travel recommendations based on the query
def get_travel_package_response(query):
    for item in data:
        # Check if the cleaned_query matches user query (case-insensitive)
        if query.lower() == item["cleaned_query"].lower():
            return item["response"]
    return "Sorry, I couldn't find any travel package for that location."

# Initialize the Tkinter window
root = tk.Tk()
root.title("AI Travel Assistant")
root.geometry("500x600")
root.config(bg="#f5f5f5")

# Set the font and styling
font_header = ('Helvetica', 16, 'bold')
font_chat = ('Helvetica', 12)
font_input = ('Helvetica', 14)

# Create a header label
header_label = tk.Label(root, text="Welcome to Your Travel Assistant", font=font_header, bg="#4CAF50", fg="white", pady=10)
header_label.pack(fill="x")

# Create a scrolling text widget for the chat history
chat_history = scrolledtext.ScrolledText(root, state='disabled', width=60, height=20, font=font_chat, bg="#f4f4f4", fg="#333333", wrap=tk.WORD, bd=2, relief="solid")
chat_history.pack(padx=10, pady=10)

# Create a text entry box for user input
user_input = tk.Entry(root, width=60, font=font_input, bd=2, relief="solid", fg="#333333")
user_input.pack(padx=10, pady=10)

# Function to handle user input and bot response
def get_response():
    user_message = user_input.get()
    if user_message.lower() == "quit":
        root.quit()

    # Display user's message
    chat_history.config(state='normal')
    chat_history.insert(tk.END, f"You: {user_message}\n")
    chat_history.yview(tk.END)
    user_input.delete(0, tk.END)

    # Get bot's response based on the message
    result = model.predict(keras.preprocessing.sequence.pad_sequences(tokenizer.texts_to_sequences([user_message]),
                                                                         truncating='post', maxlen=max_len))
    tag = lbl_encoder.inverse_transform([np.argmax(result)])

    # Generate response based on the tag
    for intent in data:
        if intent['cleaned_query'] == user_message.lower():
            bot_response = intent['response']
            break
    else:
        # If the message doesn't match any predefined query, we use the general response logic
        bot_response = "Sorry, I don't understand your query."

    # Display bot's response
    chat_history.insert(tk.END, f"ChatBot: {bot_response}\n")
    chat_history.yview(tk.END)
    chat_history.config(state='disabled')

# Create a send button that calls the get_response function
send_button = tk.Button(root, text="Send", width=20, font=('Helvetica', 12, 'bold'), fg="white", bg="#4CAF50", relief="solid", command=get_response)
send_button.pack(pady=10)

# Function to handle 'Quit' button
def quit_chatbot():
    if messagebox.askokcancel("Quit", "Do you want to exit the chatbot?"):
        root.quit()

# Add a quit button to exit the chatbot
quit_button = tk.Button(root, text="Quit", width=20, font=('Helvetica', 12, 'bold'), fg="white", bg="#FF6347", relief="solid", command=quit_chatbot)
quit_button.pack(pady=5)

# Start the Tkinter event loop
root.mainloop()
