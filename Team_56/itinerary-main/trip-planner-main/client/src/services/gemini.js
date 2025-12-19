import { GoogleGenerativeAI } from "@google/generative-ai";

// ⚠️ Ideally, move this to an environment variable (process.env.REACT_APP_GEMINI_KEY)
const API_KEY = ""; 
const genai = new GoogleGenerativeAI(API_KEY);

export const generateItinerary = async (formData) => {
  try {
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const diffTime = Math.abs(end - start);
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 

    const prompt = `
      Act as an expert travel planner. Create a ${days}-day trip to ${formData.destination} from ${formData.source}.
      Travelers: ${formData.adults} Adults, ${formData.children} Children.
      Budget: ${formData.budget}. Interests: ${formData.interests.join(', ')}.

      **CRITICAL: Return the response in strict JSON format ONLY. Do not add markdown formatting.**
      
      Structure the JSON like this:
      {
        "itinerary_html": "<h3>Day 1: Title</h3><ul><li>Activity 1</li>...</ul>...", 
        "expenses": [
          { "category": "Flights", "cost": "₹5000", "notes": "Avg round trip" },
          { "category": "Accommodation", "cost": "₹10000", "notes": "3-star hotels" },
          { "category": "Food", "cost": "₹...", "notes": "..." },
          { "category": "Activities", "cost": "₹...", "notes": "..." },
          { "category": "Transport", "cost": "₹...", "notes": "..." }
        ],
        "total_cost": "₹25000"
      }
      
      For "itinerary_html", use <h3> for days, <ul> for lists, and <b> for highlights. Do NOT use <html> or <body> tags.
    `;

    const model = genai.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Cleanup: Remove markdown code blocks if the AI adds them accidentally
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(text); // Return a JavaScript Object, not string
    
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to generate itinerary. Please try again.");
  }
};