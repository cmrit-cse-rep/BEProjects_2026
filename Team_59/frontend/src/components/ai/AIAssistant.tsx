import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Send, 
  X, 
  Bot, 
  User, 
  Volume2, 
  VolumeX, 
  Minimize2,
  Maximize2,
  Loader2
} from 'lucide-react';
import { generateAIResponse } from '../../services/gemini';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface AIAssistantProps {
  currentModelName: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ currentModelName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      text: `Hello! I'm your medical assistant. I see you're studying the ${currentModelName}. Ask me anything about it!`,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // --- NEW: Mute State ---
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synth = window.speechSynthesis;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Update context greeting when model changes
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant') {
       setMessages([{
         id: '1',
         role: 'assistant',
         text: `Hello! I see you're now studying the ${currentModelName}. How can I help?`,
         timestamp: new Date()
       }]);
    }
  }, [currentModelName]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputText(transcript);
            handleSendMessage(transcript);
        };

        recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [currentModelName]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  // --- CHANGED: Toggle Mute Logic ---
  const toggleMute = () => {
    if (isSpeaking) {
        // If currently speaking, stop immediately
        synth.cancel();
        setIsSpeaking(false);
    }
    setIsMuted(!isMuted);
  };

  const speakText = (text: string) => {
    // Don't speak if muted
    if (isMuted) return;

    if (synth.speaking) {
        synth.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    synth.speak(utterance);
  };

  const handleSendMessage = async (text: string = inputText) => {
    if (!text.trim()) return;

    const newUserMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        text: text,
        timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');
    setIsLoading(true);

    try {
        const aiText = await generateAIResponse(text, currentModelName);
        const newAiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            text: aiText,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newAiMsg]);
        
        // Only auto-speak if not muted
        if (!isMuted) {
            speakText(aiText); 
        }
    } catch (error) {
        // Error handling handled inside service
    } finally {
        setIsLoading(false);
    }
  };

  // --- Minimized State ---
  if (!isOpen) {
    return (
        <button
            onClick={() => setIsOpen(true)}
            className="absolute bottom-6 right-6 z-50 p-4 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-full shadow-2xl hover:scale-105 transition-transform flex items-center gap-2"
            aria-label="Open AI Assistant"
            title="Open AI Assistant"
        >
            <Bot className="w-6 h-6" />
            <span className="font-bold hidden md:inline">AI Tutor</span>
        </button>
    );
  }

  // --- Full Chat State ---
  return (
    <div className={`absolute z-50 bg-gray-900/95 backdrop-blur-md border border-white/10 shadow-2xl transition-all duration-300 overflow-hidden flex flex-col
        ${isMinimized 
            ? 'bottom-6 right-6 w-72 h-14 rounded-2xl cursor-pointer' 
            : 'bottom-6 right-6 w-80 md:w-96 h-[500px] rounded-2xl'
        }`}
    >
        {/* Header */}
        <div 
            className="flex items-center justify-between p-4 bg-white/5 border-b border-white/10 cursor-pointer"
            onClick={() => isMinimized && setIsMinimized(false)}
        >
            <div className="flex items-center gap-2 text-white">
                <div className="p-1.5 bg-purple-600 rounded-lg">
                    <Bot className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-sm">MedAI Tutor</span>
                    {!isMinimized && <span className="text-[10px] text-purple-300">Connected to {currentModelName}</span>}
                </div>
            </div>
            <div className="flex items-center gap-1">
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                    aria-label={isMinimized ? "Maximize Chat" : "Minimize Chat"}
                    title={isMinimized ? "Maximize Chat" : "Minimize Chat"}
                >
                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                    className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-gray-400 transition-colors"
                    aria-label="Close Chat"
                    title="Close Chat"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* Chat Area */}
        {!isMinimized && (
            <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-purple-900/50 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-4 h-4 text-purple-300" />
                                </div>
                            )}
                            <div 
                                className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                                    msg.role === 'user' 
                                        ? 'bg-purple-600 text-white rounded-tr-none' 
                                        : 'bg-white/10 text-gray-100 rounded-tl-none border border-white/5'
                                }`}
                            >
                                {msg.text}
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-gray-300" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-900/50 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-purple-300" />
                            </div>
                            <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                                <span className="text-xs text-gray-400">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-white/10 bg-black/20">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleListening}
                            className={`p-2 rounded-full transition-all ${
                                isListening 
                                    ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/50' 
                                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                            title="Voice Input"
                            aria-label="Start Voice Input"
                        >
                            <Mic className="w-5 h-5" />
                        </button>
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ask about the anatomy..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white/10 transition-all"
                            aria-label="Message Input"
                        />
                        <button
                            onClick={() => handleSendMessage()}
                            disabled={!inputText.trim() || isLoading}
                            className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            aria-label="Send Message"
                            title="Send Message"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex justify-between items-center mt-2 px-1">
                        <span className="text-[10px] text-gray-500">Powered by Gemini AI</span>
                        {/* --- FIX: Button now properly toggles mute state --- */}
                        <button 
                            onClick={toggleMute}
                            className={`text-[10px] flex items-center gap-1 transition-colors ${
                                isMuted 
                                  ? 'text-red-400 hover:text-red-300' 
                                  : isSpeaking 
                                    ? 'text-green-400 hover:text-green-300' 
                                    : 'text-gray-400 hover:text-white'
                            }`}
                            title={isMuted ? "Unmute Voice" : "Mute Voice"}
                        >
                            {isMuted ? (
                                <><VolumeX className="w-3 h-3" /> Muted</>
                            ) : isSpeaking ? (
                                <><Volume2 className="w-3 h-3 animate-pulse" /> Speaking</>
                            ) : (
                                <><Volume2 className="w-3 h-3" /> Sound On</>
                            )}
                        </button>
                    </div>
                </div>
            </>
        )}
    </div>
  );
};