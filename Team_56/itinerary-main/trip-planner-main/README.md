# AI-Driven Travel Itinerary Generator

## Project Overview

The **Travel Itinerary Generator** simplifies trip planning by creating personalized travel schedules tailored to users' preferences, budgets, and travel dates. Built using Python and Flask as the backend framework, the application integrates powerful APIs to provide real-time weather forecasts and AI-driven itinerary generation.

Users input essential travel details, such as the source, destination, travel dates, and budget preferences, and receive comprehensive day-by-day itineraries. Using the **Visual Crossing Weather API**, users gain access to precise weather forecasts for their destination. At the same time, **Bard AI** generates personalized travel plans, ensuring an efficient and enjoyable trip experience.

## Key Features

### 1. Weather Forecast
- Displays accurate and real-time weather data for the destination during the travel period.
- Enables users to plan activities based on expected weather conditions.

### 2. Itinerary Generation
- Provides a day-by-day schedule, including recommendations for attractions, activities, and accommodations.
- Tailors itineraries to align with user preferences and budget constraints.

## Technical Highlights

### 1. Backend Framework
- Developed using **Flask**, ensuring a lightweight and scalable platform for web application development.

### 2. API Integration
- **Visual Crossing Weather API**: Supplies accurate weather forecasts for destinations.
- **Bard AI**: Crafts personalized travel plans based on user inputs, offering recommendations that align with user interests and budgets.

### 3. Security and Optimization
- Implements a **Content Security Policy (CSP)** to protect against security vulnerabilities.
- Ensures a seamless user experience with robust error handling and extensibility for future enhancements, such as sitemap generation and SEO optimization.

## Workflow

1. Users provide travel details, including the source, destination, travel dates, and budget preferences.
2. The application calculates the trip duration and fetches weather forecasts for the travel period using the **Visual Crossing Weather API**.
3. **Bard AI** generates a detailed itinerary, recommending attractions, activities, and accommodations for each day.
4. The results, including the itinerary and weather updates, are displayed on a user-friendly dashboard, making trip planning intuitive and hassle-free.

# AI Travel Assistant

The **AI Travel Assistant** is a Tkinter-based GUI chatbot designed to provide personalized travel recommendations, weather forecasts, and responses to general queries. It leverages various machine learning models, APIs, and regular expressions to interact with users and deliver relevant information.

## Main Features
- **Travel Recommendations**: Provides location-based travel suggestions using the Travel Advisor API.
- **Weather Forecasts**: Retrieves real-time weather information for specified locations using the OpenWeather API.
- **User Query Handling**: General queries are managed by a pre-trained TensorFlow model for intent recognition.

## Key Components & Steps

### Travel Recommendations
1. The user inputs a location.
2. The assistant queries the **Travel Advisor API** for location-based travel recommendations.
3. It parses and displays a list of suggested places for the user.

### Weather Forecast
1. The user queries about the weather for a specific location.
2. The assistant fetches the current weather from the **OpenWeather API**.
3. The bot displays the temperature and weather description.

### General Queries & AI Model
1. For non-specific queries, the assistant uses a **TensorFlow-based pre-trained model** (`chat_model.h5`) for intent classification.
2. The input is tokenized and processed by the model to determine the intent.
3. The model returns a probability distribution over possible intents (tags), and the highest probability intent is used to generate a response.

### Regular Expressions (Regex)
- Regex is used to extract location names from queries such as "weather in Paris" or "travel to Paris" to identify the relevant information.

### User Interface
- The chatbot operates through a **Tkinter-based GUI**, where users input queries, and the assistant responds in a chat history window.
- Additional buttons provide options like clearing the chat, accessing help, or quitting the chatbot.

## Algorithms & Models Used

### 1. **Natural Language Processing (NLP) Algorithm**
- **Text Preprocessing**: The user input is tokenized and cleaned for processing by the model.
- **Tokenization**: The text is split into tokens (words), allowing the model to interpret each word as a feature.
- **Intent Classification**: A pre-trained TensorFlow model classifies the user input into predefined intents.

### 2. **Machine Learning Model (TensorFlow)**
- The core of the assistant is a **deep learning model** (likely LSTM or Dense Neural Network) trained to classify user intents.
- **Training Process**: The model is trained on labeled data (queries and intents).
- **Prediction**: Upon user input, the tokenized text is passed through the trained model to predict the intent.

### 3. **Label Encoder**
- The **Label Encoder** converts numeric model outputs into human-readable intent labels.
  - **Training Label Encoder**: Maps intents to unique numeric values during training.
  - **Inference**: The encoder converts the model’s numeric output into a readable label.

### 4. **Pickle: Serialization for Saving and Loading Objects**
- **Pickle** is used to serialize (save) and deserialize (load) objects such as the trained model, tokenizer, and label encoder. This makes it easier to reuse these components without retraining them.

#### Steps for Using Pickle:
- **Saving Objects**:
  - **Model**: Saved as `chat_model.h5` using Keras.
  - **Tokenizer**: Saved using Pickle for consistent tokenization.
  - **Label Encoder**: Saved with Pickle for mapping output labels to human-readable intents.

  ```python
  with open('tokenizer.pickle', 'wb') as handle:
      pickle.dump(tokenizer, handle)
## Loading Objects

During the startup of the chatbot, the following objects are loaded:

1. **Model**: The pre-trained model (`chat_model.h5`) is loaded to use for making predictions.
2. **Tokenizer**: The tokenizer, which is used for processing user input, is loaded to ensure consistent tokenization.
3. **Label Encoder**: The label encoder is loaded to map the model's numeric output into human-readable intent labels.

## Workflow of the Algorithm & Model

The AI Travel Assistant follows a series of steps to process the user input, classify the intent, and generate a response.

1. **User Input**: 
   - The user enters a query, such as "weather in Paris."

2. **Text Preprocessing**: 
   - The input text is tokenized, and padding is applied to ensure that all inputs have uniform length, making it ready for the model.

3. **Intent Classification (Model Inference)**: 
   - The tokenized input is passed through the trained model (`chat_model.h5`), which predicts the most probable intent.

4. **Intent Mapping**: 
   - The numeric output from the model is mapped to a human-readable intent label using the label encoder (e.g., "weather query").

5. **Response Generation**: 
   - Based on the predicted intent, the assistant either fetches a response from a predefined set or makes an API call for specific data (e.g., weather or travel information).

6. **Display Output**: 
   - The assistant's response is displayed in the GUI chat history for the user to see.

### Example Code:
```python
# Tokenize and preprocess user input
tokenized_input = tokenizer.texts_to_sequences([user_input])
padded_input = pad_sequences(tokenized_input, padding='post', maxlen=20)

# Predict the intent using the trained model
predicted_probabilities = model.predict(padded_input)
predicted_intent = label_encoder.inverse_transform([predicted_probabilities.argmax()])

# Based on the predicted intent, fetch a response
if predicted_intent == 'weather query':
    # Fetch weather data
    weather_data = get_weather(location)
    response = f"The weather in {location} is {weather_data['description']} with a temperature of {weather_data['temp']}°C."
else:
    # Respond with a default or predefined message
    response = "I couldn't understand that. Can you please rephrase?"
```


## Home Page
![Screenshot (70)](https://github.com/user-attachments/assets/4adaa1aa-949f-42a7-b406-f4101a194f01)

![Screenshot (71)](https://github.com/user-attachments/assets/2c939652-a6ec-4200-b926-8c3351431c17)

![Screenshot (72)](https://github.com/user-attachments/assets/263b0178-b6f2-46c8-b798-4457a4500fa5)

![Screenshot (73)](https://github.com/user-attachments/assets/7c6b31a0-d999-49c0-8af3-de22efbf824d)

![Screenshot (74)](https://github.com/user-attachments/assets/830f209d-93aa-48d5-9bdb-6492cdf49ac7)

![Screenshot (75)](https://github.com/user-attachments/assets/bf41b86c-3076-4e91-9607-78e66712b1da)

![Screenshot (76)](https://github.com/user-attachments/assets/e298ca6c-e0b0-4a1e-a009-0ba7565d8228)

![Screenshot (77)](https://github.com/user-attachments/assets/ac043581-3404-44e7-83de-f4cc4e0bdca7)

![Screenshot (78)](https://github.com/user-attachments/assets/90c9ea99-29fc-48b6-97c5-3051d66eb1a1)

![Screenshot (79)](https://github.com/user-attachments/assets/294a2473-8154-4ca1-8e03-1f8328bba957)

![Screenshot (80)](https://github.com/user-attachments/assets/195802ff-dd61-4c70-ae7a-87144514568a)

![Screenshot (81)](https://github.com/user-attachments/assets/de2b308f-4ae5-46bb-a367-ae6c2867dfd2)


