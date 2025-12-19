// script.js - Handles chatbot and CBT report functionality

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const chatMessages = document.getElementById('chat-messages');
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  const micButton = document.getElementById('mic-button');
  const languageSelect = document.getElementById('language-select');
  const saveReportButton = document.getElementById('save-report');
  
  // CBT Report Fields
  const initialMoodField = document.getElementById('initial-mood');
  const situationField = document.getElementById('situation');
  const automaticThoughtField = document.getElementById('automatic-thought');
  const emotionsField = document.getElementById('emotions');
  const cognitiveDistortionField = document.getElementById('cognitive-distortion');
  const reframedThoughtField = document.getElementById('reframed-thought');
  const currentMoodField = document.getElementById('current-mood');
  
  // Chat state
  let chatHistory = [];
  let initialMoodRating = null;

  // Questionnaire modal handling: prevent full page submit and start session
  const questionnaireForm = document.getElementById('questionnaire-form');
  const questionnaireModal = document.getElementById('questionnaire-modal');
  if (questionnaireForm) {
    questionnaireForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const moodVal = document.getElementById('mood-rating')?.value;
      const mainConcernsVal = document.getElementById('main-concerns')?.value;
      const recentEventsVal = document.getElementById('recent-events')?.value;
      const sessionGoalsVal = document.getElementById('session-goals')?.value;

      // Set CBT fields
      if (moodVal) {
        initialMoodRating = moodVal;
        if (initialMoodField) initialMoodField.value = moodVal;
      }
      if (mainConcernsVal && situationField) situationField.value = mainConcernsVal;
      // optionally populate other fields if available
      if (recentEventsVal && automaticThoughtField) automaticThoughtField.value = recentEventsVal;
      if (sessionGoalsVal && cognitiveDistortionField) cognitiveDistortionField.value = sessionGoalsVal;

      // Close modal smoothly
      if (questionnaireModal) {
        questionnaireModal.classList.add('hiding');
        setTimeout(() => {
          questionnaireModal.style.display = 'none';
        }, 300);
      }

      // Start conversation with a friendly prompt
      addBotMessage('Thanks — I\'ve noted your responses. Let\'s begin. What would you like to focus on today?');
    });
  }
  
  // Check if user is logged in
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser || !currentUser.email) {
    addBotMessage('Please log in to use the chatbot and save your CBT reports.');
    return;
  }
  
  // Add welcome message
  addBotMessage('Hello! I\'m your CBT therapy assistant. How are you feeling today? (Please rate your mood from 1-10, with 1 being very low and 10 being excellent)');
  
  // Event listeners
  sendButton.addEventListener('click', sendMessage);
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  micButton?.addEventListener('click', handleMicClick);
  
  saveReportButton.addEventListener('click', saveCBTReport);
  
  // Auto-resize textarea
  userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = userInput.scrollHeight + 'px';
  });
  
  // Functions
  function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;
    
    // Add user message to chat
    addUserMessage(message);
    
    // Check if this is the initial mood rating
    if (initialMoodRating === null && !isNaN(message) && message >= 1 && message <= 10) {
      initialMoodRating = message;
      initialMoodField.value = message;
    }
    
    // Add to chat history
    chatHistory.push({ role: 'user', content: message });
    
    // Clear input
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Send to backend
    fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        email: currentUser.email,
        history: chatHistory,
        language: languageSelect?.value || 'auto'
      })
    })
    .then(response => response.json())
    .then(data => {
      // Remove typing indicator
      removeTypingIndicator();
      
      if (data.error) {
        addBotMessage('Sorry, I encountered an error. Please try again.');
        console.error('Error:', data.error);
        return;
      }
      
      // Add bot response to chat
      addBotMessage(data.reply);
      // Add to chat history
      chatHistory.push({ role: 'assistant', content: data.reply });
      
      // Auto-scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
    })
    .catch(error => {
      removeTypingIndicator();
      addBotMessage('Sorry, I encountered an error. Please try again.');
      console.error('Error:', error);
    });
  }

  // Speech-to-text using Web Speech API
  let recognition;
  let isListening = false;
  function getSpeechRecognition() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  function handleMicClick() {
    const SR = getSpeechRecognition();
    if (!SR) {
      alert('Speech recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    if (isListening) {
      recognition?.stop();
      return;
    }
    recognition = new SR();
    recognition.interimResults = true;
    recognition.continuous = false;
    const lang = languageSelect?.value;
    // Map BCP-47 codes (approx)
    const langMap = {
      auto: undefined,
      en: 'en-US', hi: 'hi-IN', te: 'te-IN', ta: 'ta-IN', bn: 'bn-IN', mr: 'mr-IN', pa: 'pa-IN', ur: 'ur-PK', kn: 'kn-IN', ml: 'ml-IN'
    };
    if (lang && lang !== 'auto') recognition.lang = langMap[lang] || 'en-US';

    recognition.onstart = () => {
      isListening = true;
      micButton.textContent = '🛑';
    };
    recognition.onend = () => {
      isListening = false;
      micButton.textContent = '🎤';
    };
    recognition.onerror = () => {
      isListening = false;
      micButton.textContent = '🎤';
    };
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      userInput.value = transcript.trim();
      userInput.dispatchEvent(new Event('input'));
    };
    recognition.start();
  }
  
  function addUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message user-message';
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageElement.innerHTML = `
      <div class="message-content">
        <div class="message-text">${formatMessage(message)}</div>
        <div class="message-timestamp">${timestamp}</div>
      </div>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  function addBotMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message bot-message';
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageElement.innerHTML = `
      <div class="message-content">
        <div class="message-text">${formatMessage(message)}</div>
        <div class="message-timestamp">${timestamp}</div>
      </div>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  function formatMessage(text) {
    // Convert URLs to links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, url => `<a href="${url}" target="_blank">${url}</a>`)
              .replace(/\n/g, '<br>');
  }
  
  // (response style helpers removed)
  
  function showTypingIndicator() {
    const typingElement = document.createElement('div');
    typingElement.className = 'message bot-message typing-message';
    typingElement.innerHTML = `
      <div class="message-content">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
    
    chatMessages.appendChild(typingElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  function removeTypingIndicator() {
    const typingMessage = document.querySelector('.typing-message');
    if (typingMessage) {
      typingMessage.remove();
    }
  }
  
  async function saveCBTReport() {
    // Validate fields
    if (!initialMoodField.value) {
      alert('Please complete your conversation to generate a mood rating.');
      return;
    }
    
    if (!situationField.value || !automaticThoughtField.value || !emotionsField.value || 
        !cognitiveDistortionField.value || !reframedThoughtField.value || !currentMoodField.value) {
      alert('Please fill in all fields of the CBT report.');
      return;
    }
    
    const report = {
      initialMood: initialMoodField.value,
      situation: situationField.value,
      automaticThought: automaticThoughtField.value,
      emotions: emotionsField.value,
      cognitiveDistortion: cognitiveDistortionField.value,
      reframedThought: reframedThoughtField.value,
      currentMood: currentMoodField.value,
      createdAt: new Date().toISOString()
    };
    
    try {
      const response = await fetch('http://localhost:3000/api/cbt-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: currentUser.email,
          report
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('CBT report saved successfully!');
        // Clear form fields
        situationField.value = '';
        automaticThoughtField.value = '';
        emotionsField.value = '';
        cognitiveDistortionField.value = '';
        reframedThoughtField.value = '';
        currentMoodField.value = '';
      } else {
        alert('Error saving report: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving CBT report:', error);
      alert('Failed to save CBT report. Please try again.');
    }
  }
  
  // Fetch CBT session summary from Google Gemini
  async function fetchCBTSummary() {
    try {
      const response = await fetch('/api/gemini/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatHistory })
      });

      const summary = await response.json();

      if (summary) {
        initialMoodField.value = summary.initialMood || '';
        situationField.value = summary.situation || '';
        automaticThoughtField.value = summary.automaticThought || '';
        emotionsField.value = summary.emotions || '';
        cognitiveDistortionField.value = summary.cognitiveDistortion || '';
        reframedThoughtField.value = summary.reframedThought || '';
        currentMoodField.value = summary.currentMood || '';
      } else {
        console.error('Failed to fetch summary: No data returned');
      }
    } catch (error) {
      console.error('Error fetching CBT summary:', error);
    }
  }

  // Trigger summary generation when chat ends
  function endChatSession() {
    addBotMessage('Thank you for sharing. Generating your CBT session summary...');
    fetchCBTSummary();
  }

  // Example: Call endChatSession when user ends the chat
  // You can replace this with the actual event where the chat ends
  const endChatButton = document.getElementById('end-chat-button');
  endChatButton?.addEventListener('click', endChatSession);
});