const chatbotService = require('../services/chatbotService');

class ChatbotController {
    async handleQuestion(req, res) {
        try {
            const { question } = req.body;
            
            if (!question) {
                return res.status(400).json({ error: 'Question is required' });
            }

            const response = await chatbotService.generateResponse(question);
            return res.json({ answer: response });
        } catch (error) {
            console.error('Error in chatbot controller:', error);
            return res.status(500).json({ error: 'Failed to process your question' });
        }
    }
}

module.exports = new ChatbotController(); 