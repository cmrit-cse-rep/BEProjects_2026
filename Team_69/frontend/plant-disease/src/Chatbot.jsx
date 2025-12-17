import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './Chatbot.css';

// const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const API_BASE="https://agroaibackend-f1p9.onrender.com";

// Agriculture keywords
const agroKeywords = [
  'crop','disease','plant','agriculture','blight','mosaic','leaf','fungus','pest',
  'potato','tomato','capsicum','soil','fertilizer','yield','harvest','farm','farmer',
  'irrigation','weather','cure','symptom','treatment','healthy','infected'
];

// Basic allowed phrases
const generalPhrases = [
  'hi','hello','hey','good morning','good afternoon','good evening',
  'thank you','thanks','bye','good night'
];

const isAgroQuery = (query) => agroKeywords.some(w => query.toLowerCase().includes(w));
const isGeneralQuery = (query) => generalPhrases.some(p => query.toLowerCase() === p);

const greetingResponses = {
  'hi': 'Hello! 👋 How can I help you with agriculture today?',
  'hello': 'Hi there! Ask me about crops or diseases.',
  'hey': 'Hey! I can answer agriculture-related queries.',
  'good morning': 'Good morning! 🌱 Ready to learn about crops?',
  'good afternoon': 'Good afternoon! Ask me about plant health.',
  'good evening': 'Good evening! Need help with your farm?',
  'thank you': 'You’re welcome! 😊',
  'thanks': 'Anytime! 👍',
  'bye': 'Goodbye! Take care of your plants! 🌿',
  'good night': 'Good night! Sweet dreams 🌙'
};

const followUpKeywords = [
  'explain in short', 'short', 'in short', 'tell me in short', 'summarize', 'summarize this', 'bullet points', 'list', 'make it brief', 'short answer', 'quick summary', 'in points', 'in brief', 'in bullets', 'make it concise'
];
const isFollowUpQuery = (query) => followUpKeywords.some(k => query.toLowerCase().includes(k));

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: '👋 Hello! I’m your Agro Assistant. Ask me about crop diseases, treatments, or farming tips.' },
    { sender: 'bot', text: '💡 For example, try asking: "What are the symptoms of potato blight?"' }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [lastAgroAnswer, setLastAgroAnswer] = useState(false);
  const [lastAgroQuery, setLastAgroQuery] = useState('');
  const bodyRef = useRef(null);

  useEffect(() => {
    if (open && bodyRef.current) {
      bodyRef.current.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, typing, open]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessages(prev => [...prev, { sender: 'user', text: trimmed }]);
    setInput('');

    // Greetings / basic phrases
    if (isGeneralQuery(trimmed)) {
      setTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'bot', text: greetingResponses[trimmed.toLowerCase()] }]);
        setTyping(false);
        setLastAgroAnswer(false);
      }, 800);
      return;
    }

    // Agro query
    if (isAgroQuery(trimmed)) {
      setTyping(true);
      try {
        const res = await axios.post(`${API_BASE}/chatbot`, { query: trimmed, agro: true }, {
          headers: { 'Content-Type': 'application/json' }
        });
        setMessages(prev => [...prev, { sender: 'bot', text: res.data.answer }]);
        setLastAgroAnswer(true);
        setLastAgroQuery(trimmed);
      } catch (err) {
        setMessages(prev => [...prev, { sender: 'bot', text: '⚠️ Error fetching answer.' }]);
        setLastAgroAnswer(false);
      } finally {
        setTyping(false);
      }
      return;
    }

    // Follow-up query (summarize, bullet points, etc.)
    if (isFollowUpQuery(trimmed) && lastAgroAnswer && lastAgroQuery) {
      setTyping(true);
      try {
        // Combine follow-up with last agro query for context
        const followUpCombined = `${trimmed} about ${lastAgroQuery}`;
        const res = await axios.post(`${API_BASE}/chatbot`, { query: followUpCombined, agro: true }, {
          headers: { 'Content-Type': 'application/json' }
        });
        setMessages(prev => [...prev, { sender: 'bot', text: res.data.answer }]);
      } catch (err) {
        setMessages(prev => [...prev, { sender: 'bot', text: '⚠️ Error fetching answer.' }]);
      } finally {
        setTyping(false);
      }
      return;
    }

    // Completely unrelated query
    setTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'bot', text: '⚠️ Sorry, I only answer agriculture-related queries.' }]);
      setTyping(false);
      setLastAgroAnswer(false);
    }, 800);
  };

  return (
    <>
      <div className="chatbot-icon" onClick={() => setOpen(v => !v)}>🤖</div>

      {open && (
        <div className="chatbot-modal">
          <div className="chatbot-header">
            <span>Agro Chatbot</span>
            <button onClick={() => setOpen(false)}>×</button>
          </div>

          <div className="chatbot-body" ref={bodyRef}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`chatbot-msg chatbot-msg-${msg.sender}`}>{msg.text}</div>
            ))}

            {typing && (
              <div className="chatbot-msg chatbot-msg-bot typing"><span></span><span></span><span></span></div>
            )}
          </div>

          <div className="chatbot-footer">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your query..."
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} disabled={!input.trim() || typing}>Send</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
