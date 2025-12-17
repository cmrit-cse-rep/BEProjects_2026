from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import requests
import os
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

@router.post("/chatbot")
async def chatbot(request: Request):
    data = await request.json()
    query = data.get("query", "")
    agro = data.get("agro", False)

    system_prompt = (
        "You are a helpful agriculture assistant. Answer queries about crops, diseases, and farming in detail."
        if agro else
        "You are a friendly assistant. Answer general queries politely and briefly."
    )

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query}
        ]
    }
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        groq_response = requests.post(GROQ_API_URL, json=payload, headers=headers)
        print(f"Groq API status: {groq_response.status_code}")
        print(f"Groq API response: {groq_response.text}")
        # Only use llama3-8b-8192; print error response if 400
        if groq_response.status_code == 400:
            print("Groq API 400 Bad Request. Check model name, API key, or payload.")
        # Only raise for status after fallback attempt
        groq_response.raise_for_status()
        result = groq_response.json()
        answer = result["choices"][0]["message"]["content"]
        return JSONResponse({"answer": answer})
    except Exception as e:
        import traceback
        print("Groq API error:", traceback.format_exc())
        if 'groq_response' in locals():
            print("Groq API error response:", groq_response.text)
        return JSONResponse({"answer": f"Error: {str(e)}"}, status_code=500)

