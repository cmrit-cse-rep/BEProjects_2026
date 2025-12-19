import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY!;

if (!API_KEY) {
  const isVercel = process.env.VERCEL === '1';
  const errorMessage = isVercel
    ? 'GEMINI_API_KEY is not set. Please add it in your Vercel project settings: Settings → Environment Variables → Add GEMINI_API_KEY'
    : 'Please define the GEMINI_API_KEY environment variable inside .env.local';
  throw new Error(errorMessage);
}

const genAI = new GoogleGenerativeAI(API_KEY);

export async function generateItinerary(
  destination: string,
  days: number,
  budget: string,
  interests: string[]
): Promise<string> {
  // Use available models based on the API - prioritize newer, stable models
  // Based on your available models: gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash, etc.
  // Note: Model names should NOT include "models/" prefix for the GoogleGenerativeAI library
  let model;
  const modelsToTry = [
    'gemini-2.5-flash',           // Fast and efficient (recommended)
    'gemini-flash-latest',        // Latest flash version
    'gemini-2.5-pro',             // More capable version
    'gemini-pro-latest',          // Latest pro version
    'gemini-2.0-flash',           // Alternative flash version
    'gemini-2.0-flash-001',       // Stable flash version
  ];

  let lastError: any = null;
  for (const modelName of modelsToTry) {
    try {
      model = genAI.getGenerativeModel({ model: modelName });
      console.log(`Successfully initialized model: ${modelName}`);
      break; // Successfully got a model, exit loop
    } catch (e: any) {
      console.log(`${modelName} failed: ${e.message || 'Unknown error'}`);
      lastError = e;
      continue;
    }
  }

  // If all models failed, throw an error with details
  if (!model) {
    console.error('All model attempts failed. Last error:', lastError?.message);
    throw new Error('No available Gemini model found. Please check your API key and available models. Last error: ' + (lastError?.message || 'Unknown'));
  }

  const interestsText = interests.length > 0 ? interests.join(', ') : 'general sightseeing';
  
  const interestsArray = interests.length > 0 ? interests.map(i => `"${i}"`).join(', ') : '"general sightseeing"';
  
  const prompt = `Create a detailed ${days}-day travel itinerary for ${destination} with a budget of ${budget}. 
The traveler is interested in: ${interestsText}.

IMPORTANT: Return ONLY valid JSON. No markdown, no explanations, no code blocks. Just pure JSON.

Format the itinerary as a JSON object with this exact structure:
{
  "destination": "${destination}",
  "totalDays": ${days},
  "budget": "${budget}",
  "interests": [${interestsArray}],
  "days": [
    {
      "day": 1,
      "date": "Day 1",
      "activities": [
        {
          "time": "09:00 AM",
          "title": "Activity name",
          "description": "Detailed description",
          "location": "Location name",
          "duration": "2 hours",
          "cost": "₹4,150",
          "category": "sightseeing"
        }
      ],
      "totalCost": "₹12,450",
      "notes": "Day 1 notes and tips"
    }
  ],
  "summary": {
    "totalEstimatedCost": "${budget}",
    "highlights": ["Highlight 1", "Highlight 2"],
    "tips": ["Tip 1", "Tip 2"]
  }
}

IMPORTANT: All costs must be in Indian Rupees (INR) using the ₹ symbol. Format costs as ₹X,XXX (e.g., ₹5,000, ₹12,500). Convert all costs to INR based on current exchange rates.

Make the itinerary detailed, practical, and well-organized. Include specific times, locations, descriptions, durations, and costs for each activity. Ensure activities are realistic and geographically logical.`;

  try {
    console.log('Calling Gemini API...');
    
    // Add a small delay to avoid hitting rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    console.log('Raw Gemini response length:', text.length);
    console.log('Raw Gemini response (first 500 chars):', text.substring(0, 500));
    
    // Clean up the response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Remove any leading/trailing whitespace or newlines
    text = text.trim();
    
    // If response doesn't start with {, try to find JSON object
    if (!text.startsWith('{')) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
        console.log('Extracted JSON from response');
      } else {
        console.error('No JSON object found in response');
        throw new Error('AI response does not contain valid JSON. Response: ' + text.substring(0, 200));
      }
    }
    
    // Validate it's valid JSON before returning
    try {
      const parsed = JSON.parse(text);
      console.log('Successfully parsed JSON response');
      return text;
    } catch (jsonError: any) {
      console.error('JSON parse error:', jsonError.message);
      console.error('Text that failed to parse:', text.substring(0, 500));
      throw new Error('Failed to parse AI response as JSON. Please try again.');
    }
    
  } catch (error: any) {
    console.error('Error generating itinerary:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Provide more helpful error messages
    if (error.message?.toLowerCase().includes('api key') || error.message?.toLowerCase().includes('api_key')) {
      const isVercel = process.env.VERCEL === '1';
      const errorMessage = isVercel
        ? 'Invalid API key. Please check your GEMINI_API_KEY in Vercel project settings: Settings → Environment Variables. Make sure it\'s set for Production, Preview, and Development environments.'
        : 'Invalid API key. Please check your GEMINI_API_KEY environment variable in .env.local';
      throw new Error(errorMessage);
    }
    if (error.message?.toLowerCase().includes('quota') || error.message?.toLowerCase().includes('limit') || error.message?.toLowerCase().includes('rate')) {
      throw new Error('API quota or rate limit exceeded. This can happen if:\n1. You\'ve used your free tier limit for today\n2. Too many requests were made quickly\n3. Your API key has usage restrictions\n\nSolutions:\n- Wait a few minutes and try again\n- Check your Google Cloud Console for quota limits\n- Verify your API key has the Gemini API enabled\n- Consider upgrading your API plan if needed');
    }
    if (error.message?.toLowerCase().includes('permission') || error.message?.toLowerCase().includes('forbidden')) {
      throw new Error('API permission denied. Please check your API key permissions.');
    }
    if (error.message?.toLowerCase().includes('model') || error.message?.toLowerCase().includes('not found')) {
      throw new Error('Gemini model not available. Please check the model name or your API access.');
    }
    if (error.message?.toLowerCase().includes('json') || error.name === 'SyntaxError') {
      throw new Error('Failed to parse AI response. The AI returned invalid JSON. Please try again.');
    }
    
    throw new Error(error.message || 'Failed to generate itinerary. Please try again.');
  }
}

