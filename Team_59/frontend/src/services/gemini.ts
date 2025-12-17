// Access the API key from Vite environment variables
// For local development, ensure you have a .env file with VITE_GEMINI_API_KEY=your_key
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

export const generateAIResponse = async (
  userQuery: string, 
  currentModelContext: string
): Promise<string> => {
  const systemPrompt = `
    You are an expert medical AI tutor inside a WebXR Healthcare Learning Management System.
    The student is currently examining a 3D anatomical model of the: ${currentModelContext}.
    
    Your goal is to:
    1. Answer anatomy and physiology questions accurately but concisely.
    2. Keep responses short (2-3 sentences) to fit in a chat bubble, unless asked for details.
    3. Use simple, encouraging language.
    4. If the user asks to "highlight" or "show" a part, explain where it is located relative to the model.
    
    Current Context: The user is looking at ${currentModelContext}.
  `;

  // Quick check to prevent API calls if key is missing
  if (!apiKey) {
    console.error("Gemini API Key is missing. Please create a .env file in your frontend folder with VITE_GEMINI_API_KEY=your_actual_api_key");
    return "I am missing my API key configuration. Please check the console for setup instructions.";
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userQuery }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Gemini API Error:", response.status, response.statusText, errorData);
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("AI Service Connection Error:", error);
    return "I'm having trouble connecting to the medical database right now. Please try again.";
  }
};