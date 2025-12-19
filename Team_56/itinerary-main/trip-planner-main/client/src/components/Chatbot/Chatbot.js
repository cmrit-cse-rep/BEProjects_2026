// import React, { useState } from "react";
// import { FiSend } from "react-icons/fi";
// import { FaUserCircle } from "react-icons/fa";
// import { RiRobotFill } from "react-icons/ri";
// import "./Chatbot.scss";

// const destinations = [
//   { name: "Paris", activities: ["Museums", "Eiffel Tower"], bestTime: "Spring", budget: "Medium" },
//   { name: "Tokyo", activities: ["Temples", "Sushi Tasting"], bestTime: "Autumn", budget: "High" },
//   { name: "Sydney", activities: ["Beaches", "Opera House"], bestTime: "Summer", budget: "Medium" },
//   { name: "Rome", activities: ["Colosseum", "Pasta Tasting"], bestTime: "Autumn", budget: "Low" },
//   { name: "Bali", activities: ["Beaches", "Nature Trails"], bestTime: "Summer", budget: "Low" },
// ];

// // Recommendation based on user input
// const recommendDestination = (criteria) => {
//   return destinations.filter(
//     (dest) =>
//       (criteria.budget && dest.budget.toLowerCase() === criteria.budget.toLowerCase()) ||
//       (criteria.bestTime && dest.bestTime.toLowerCase() === criteria.bestTime.toLowerCase())
//   );
// };

// const Chatbot = ({ botName = "TravelBot" }) => {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");

//   const generateBotResponse = (userMessage) => {
//     const lowerCaseMessage = userMessage.toLowerCase();

//     // Parse user input for recommendations
//     if (lowerCaseMessage.includes("recommend")) {
//       const criteria = {};
//       if (lowerCaseMessage.includes("low budget")) criteria.budget = "Low";
//       if (lowerCaseMessage.includes("medium budget")) criteria.budget = "Medium";
//       if (lowerCaseMessage.includes("high budget")) criteria.budget = "High";
//       if (lowerCaseMessage.includes("summer")) criteria.bestTime = "Summer";
//       if (lowerCaseMessage.includes("autumn")) criteria.bestTime = "Autumn";
//       if (lowerCaseMessage.includes("spring")) criteria.bestTime = "Spring";

//       const recommendations = recommendDestination(criteria);
//       if (recommendations.length > 0) {
//         return `Based on your preferences, I recommend: ${recommendations
//           .map((r) => r.name)
//           .join(", ")}. Let me know if you'd like more details!`;
//       } else {
//         return "I couldn't find any matching destinations. Could you specify your preferences more clearly?";
//       }
//     }

//     // Travel activities
//     if (lowerCaseMessage.includes("activities")) {
//       return "Popular activities include exploring historical landmarks, local cuisines, nature trails, and adventure sports. What are you interested in?";
//     }

//     // Advice
//     if (lowerCaseMessage.includes("advice")) {
//       return "Always pack light, keep important documents handy, and research your destination's local customs.";
//     }

//     // Greetings
//     if (lowerCaseMessage.includes("hello") || lowerCaseMessage.includes("hi")) {
//       return "Hello! How can I assist you with your travel plans today?";
//     }

//     // Goodbye
//     if (lowerCaseMessage.includes("bye")) {
//       return "Goodbye! Have a wonderful trip and safe travels!";
//     }

//     // Fallback
//     return "I'm sorry, I didn't quite catch that. Could you rephrase or specify what you need help with?";
//   };

//   const handleSend = () => {
//     if (!input.trim()) return;

//     const userMessage = { sender: "user", text: input };
//     setMessages((prevMessages) => [...prevMessages, userMessage]);
//     setInput("");

//     setTimeout(() => {
//       const botMessage = { sender: "bot", text: generateBotResponse(input) };
//       setMessages((prevMessages) => [...prevMessages, botMessage]);
//     }, 1000);
//   };

//   return (
//     <div className="chatbot-container">
//       <div className="chatbot-header">
//         <h2>{botName}</h2>
//       </div>
//       <div className="chatbot-messages">
//         {messages.map((message, index) => (
//           <div
//             key={index}
//             className={`message ${message.sender === "user" ? "user-message" : "bot-message"}`}
//           >
//             <div className="message-icon">
//               {message.sender === "user" ? <FaUserCircle size={30} /> : <RiRobotFill size={30} />}
//             </div>
//             <div className="message-text">{message.text}</div>
//           </div>
//         ))}
//       </div>
//       <div className="chatbot-input">
//         <input
//           type="text"
//           placeholder="Type a message..."
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           onKeyDown={(e) => e.key === "Enter" && handleSend()}
//         />
//         <button onClick={handleSend}>
//           <FiSend size={20} />
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Chatbot;


import React, { useState } from 'react';
import axios from 'axios';
import './Chatbot.scss';

const Chatbot = () => {
  // The initial message is now in the info panel, so we start with an empty array
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { from: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await axios.post('https://trip-planner-major.onrender.com/chat', {
        message: input,
      });

      const botMessage = { from: 'bot', text: response.data.reply };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error communicating with the chatbot API:", error);
      const errorMessage = { from: 'bot', text: 'Sorry, I am having trouble connecting.' };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  return (
    // This new container holds both the chatbot and the info panel
    <div className="chatbot-page-container">
      
      {/* --- Left Column: The Chatbot --- */}
      <div className="chatbot-container">
        <div className="chatbot-header">
          <h2>AI Travel Assistant</h2>
        </div>
        <div className="chatbot-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message-wrapper ${msg.from}`}>
              <div className="message-content">
                {msg.text}
              </div>
            </div>
          ))}
        </div>
        <form className="chatbot-input-form" onSubmit={sendMessage}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
          />
          <button type="submit">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
            </svg>
          </button>
        </form>
      </div>

      {/* --- Right Column: The Info Panel --- */}
      <div className="info-panel">
        <h3>Welcome!</h3>
        <p>I'm your personal AI travel assistant. I can help you plan your next adventure.</p>
        <p>Try asking me things like:</p>
        <ul>
          <li>"Tell me about Paris"</li>
          <li>"Suggest a hotel in London"</li>
          <li>"What are the top attractions in Tokyo?"</li>
        </ul>
      </div>

    </div>
  );
};

export default Chatbot;