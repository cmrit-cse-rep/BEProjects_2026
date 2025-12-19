from typing import TypedDict, Literal, Optional, Any, Callable
from pydantic import BaseModel, Field
import speech_recognition as sr
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate
import time
import requests
import json
from face.face_recognition_voice import face_services
import os
from dotenv import load_dotenv
load_dotenv()
from elevenlabs.client import ElevenLabs
from elevenlabs import play

client = ElevenLabs(
    api_key=os.getenv("ELEVEN_LABS_API_KEY")
)

def speak_llm(text, pause=0.7):
    audio = client.text_to_speech.convert(
        text=text,
        voice_id="JBFqnCBsd6RMkjVDRZzb",
        model_id="eleven_multilingual_v2",
        output_format="mp3_44100_128",
    )
    play(audio)

def speak_google(text):
    try:
        import pyttsx3
        engine = pyttsx3.init()
        engine.say(text)
        engine.runAndWait()
    except Exception as e:
        print(f"TTS Error: {e}")

# Import your existing modules
from OCR import ocr_services
from scene_describe import scene_describe_service
from currency import currency_services
import cv2

# Pydantic Models for Router
class RouterDecision(BaseModel):
    intent: Literal["ocr", "currency", "face", "scene", "gemini"] = Field(
        description="The classified intent from user input"
    )
    reasoning: str = Field(description="Brief explanation of why this intent was chosen")

# State Definition
class AgentState(TypedDict):
    user_input: str
    intent: Optional[str]
    reasoning: Optional[str]
    result: Optional[str]
    messages: list
    error: Optional[str]

class VoiceAgent:
    def __init__(self, speak_function: Callable[[str], None] = speak_llm):
        """
        Initialize Voice Agent with configurable speak function
        
        Args:
            speak_function: Either speak_llm or speak_google
        """
        self.speak = speak_function
        self.mistral_api_key = os.getenv("MISTRAL_API_KEY")
        self.mistral_model = os.getenv("MISTRAL_MODEL_NAME")
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        self.setup_graph()
        
    def setup_graph(self):
        """Initialize the LangGraph workflow"""
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("voice_input", self.voice_input_node)
        workflow.add_node("router", self.router_node)
        workflow.add_node("ocr_service", self.ocr_service_node)
        workflow.add_node("currency_service", self.currency_service_node)
        workflow.add_node("face_service", self.face_service_node)
        workflow.add_node("scene_service", self.scene_service_node)
        workflow.add_node("gemini_agent", self.gemini_agent_node)
        
        # Set entry point
        workflow.set_entry_point("voice_input")
        
        # Add edges
        workflow.add_edge("voice_input", "router")
        
        # Add conditional routing
        workflow.add_conditional_edges(
            "router",
            self.route_decision,
            {
                "ocr": "ocr_service",
                "currency": "currency_service",
                "face": "face_service",
                "scene": "scene_service",
                "gemini": "gemini_agent"
            }
        )
        
        # All nodes end after execution
        workflow.add_edge("ocr_service", END)
        workflow.add_edge("currency_service", END)
        workflow.add_edge("face_service", END)
        workflow.add_edge("scene_service", END)
        workflow.add_edge("gemini_agent", END)
        
        self.graph = workflow.compile()

    def listen_command(self) -> Optional[str]:
        """Voice recognition"""
        r = sr.Recognizer()
        with sr.Microphone() as source:
            print("🎤 Listening...")
            try:
                audio = r.listen(source, timeout=5, phrase_time_limit=5)
                command = r.recognize_google(audio).lower()
                print(f"🗣️ Heard: {command}")
                return command
            except Exception as e:
                print(f"❌ Voice recognition error: {e}")
                return None

    def call_mistral_router(self, prompt: str) -> dict:
        """Call Mistral API for routing decisions"""
        url = "https://api.mistral.ai/v1/chat/completions"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.mistral_api_key}"
        }
        
        data = {
            "model": self.mistral_model,
            "messages": [
                {
                    "role": "system", 
                    "content": """You are an intent classifier. Classify user input into these categories:
                    
                    - ocr: Text recognition, reading text from images
                    - currency: Money detection, bill recognition, cash identification
                    - face: Face detection, recognition, identification of people
                    - scene: Scene description, object detection, image understanding
                    - gemini: General questions, conversations, assistance
                    
                    Respond with valid JSON: {"intent": "category", "reasoning": "explanation"}"""
                },
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 100
        }
        
        try:
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:]  # Remove ```json
            if content.startswith("```"):
                content = content[3:]   # Remove ```
            if content.endswith("```"):
                content = content[:-3]  # Remove trailing ```
            content = content.strip()
            # Parse JSON response
            json_content = json.loads(content)
            return {"success": True, "data": RouterDecision(**json_content)}
            
        except Exception as e:
            print(f"❌ Mistral Router error: {e}")
            return {"success": False, "error": str(e)}

    def call_gemini_agent(self, user_input: str) -> str:
        """Call Gemini Flash 2.0 for general assistance"""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={self.gemini_api_key}"
        
        headers = {"Content-Type": "application/json"}
        
        data = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": f"You are a helpful AI assistant. Answer this question clearly and concisely: {user_input}"
                        }
                    ]
                }
            ]
        }
        
        try:
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            result = response.json()
            return result["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            return f"Sorry, I couldn't process your request: {str(e)}"

    # NODE IMPLEMENTATIONS
    
    def voice_input_node(self, state: AgentState) -> AgentState:
        """Capture voice input"""
        user_input = self.listen_command()
        
        if user_input:
            state["user_input"] = user_input
            state["messages"] = [HumanMessage(content=user_input)]
            state["error"] = None
        else:
            state["user_input"] = ""
            state["error"] = "Could not understand voice input"
            
        return state

    def router_node(self, state: AgentState) -> AgentState:
        """Route user input using Mistral"""
        user_input = state["user_input"]
        
        if state.get("error"):
            state["intent"] = "gemini"
            state["reasoning"] = "Fallback to Gemini due to voice input error"
            return state
        
        result = self.call_mistral_router(f"Classify this input: '{user_input}'")
        
        if result["success"]:
            state["intent"] = result["data"].intent
            state["reasoning"] = result["data"].reasoning
        else:
            state["intent"] = "gemini"
            state["reasoning"] = "Fallback to Gemini due to router error"
            
        print(f"🎯 Routed to: {state['intent']} - {state.get('reasoning', '')}")
        return state

    def route_decision(self, state: AgentState) -> str:
        """Decision function for conditional routing"""
        return state["intent"]

    def ocr_service_node(self, state: AgentState) -> AgentState:
        """OCR text recognition service"""
        try:
            ocr_services(self.speak)
            state["result"] = "OCR service completed"
        except Exception as e:
            state["error"] = str(e)
            self.speak(f"OCR service encountered an error: {str(e)}")
        return state

    def currency_service_node(self, state: AgentState) -> AgentState:
        """Currency detection service"""
        try:
            # Import and call currency detection if you have it separate from OCR
            # For now, using ocr_services as they might handle currency
            currency_services(self.speak)
            state["result"] = "Currency detection completed"
        except Exception as e:
            state["error"] = str(e)
            self.speak(f"Currency detection encountered an error: {str(e)}")
        return state

    def face_service_node(self, state: AgentState) -> AgentState:
        """Face recognition service"""
        try:
            face_services(self.speak)
            state["result"] = "Face recognition completed"
        except Exception as e:
            state["error"] = str(e)
            self.speak(f"Face recognition encountered an error: {str(e)}")
        return state

    def scene_service_node(self, state: AgentState) -> AgentState:
        """Scene detection service"""
        try:
            scene_describe_service(self.speak)
            state["result"] = "Scene detection completed"
        except Exception as e:
            state["error"] = str(e)
            self.speak(f"Scene detection encountered an error: {str(e)}")
        return state

    def gemini_agent_node(self, state: AgentState) -> AgentState:
        """Gemini AI assistant for general questions"""
        user_input = state["user_input"]
        
        if state.get("error"):
            self.speak("I'm sorry, I had trouble understanding your request.")
        else:
            response = self.call_gemini_agent(user_input)
            self.speak(response)
            
        state["result"] = "Gemini agent response completed"
        return state

    def run(self):
        """Main execution loop"""
        self.speak("Voice Agent initialized and ready to help!")
        
        while True:
            try:
                initial_state = {
                    "user_input": "",
                    "intent": None,
                    "reasoning": None,
                    "result": None,
                    "messages": [],
                    "error": None
                }
                
                # Run the graph
                result = self.graph.invoke(initial_state)
                
                # Check for exit commands
                user_input = result.get("user_input", "").lower()
                if any(word in user_input for word in ["exit", "quit", "goodbye", "stop", "bye"]):
                    self.speak("Goodbye! Have a great day!")
                    break
                
                # Brief pause before next interaction
                time.sleep(1)
                
            except KeyboardInterrupt:
                self.speak("Goodbye!")
                break
            except Exception as e:
                print(f"❌ Error in main loop: {e}")
                self.speak("Sorry, something went wrong. Let's try again.")

if __name__ == "__main__":
    # Make sure temp directory exists
    os.makedirs("temp", exist_ok=True)
    
    # Initialize agent with speak_llm (can also use speak_google)
    agent = VoiceAgent(speak_function=speak_google)
    agent.run()