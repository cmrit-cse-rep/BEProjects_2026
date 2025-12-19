const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// Route to handle chat questions
router.post('/ask', chatbotController.handleQuestion.bind(chatbotController));

module.exports = router; 