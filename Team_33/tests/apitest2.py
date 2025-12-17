import requests
import json

def call_summarize_api():
    url = "https://ashjohto-pacter-policy-api.hf.space/scrape"   # Replace with your actual ngrok URL
    headers = {
        "Content-Type": "application/json"
    }

    payload = {
        "package_name": "com.instagram.android",
        "use_javascript": True,  # Boolean, not string
        "wait_time": 15
    }

    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        print("Status Code:", response.status_code)
        print("Response:")
        print(response.text)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    call_summarize_api()
