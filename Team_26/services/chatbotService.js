const OpenAI = require('openai');
require('dotenv').config();
console.log("✅ OpenAI API Key loaded successfully");

if (!process.env.OPENAI_API_KEY) {
    console.error('ERROR: OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

class ChatbotService {
    async generateResponse(question) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OpenAI API key is not configured');
        }

        console.log('Attempting to generate response for question:', question);

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful educational assistant. Provide clear, concise, and accurate answers to academic questions."
                },
                {
                    role: "user",
                    content: question
                }
            ]
        });

        console.log("OpenAI raw completion result:", completion);

        return completion.choices[0].message.content;

    } catch (error) {
        console.error('Error in OpenAI call:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            responseData: error.response?.data
        });

        throw new Error(`Failed to generate response: ${error.message}`);
    }
}

}

module.exports = new ChatbotService(); 