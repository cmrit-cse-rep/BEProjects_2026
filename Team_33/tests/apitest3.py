import requests
import json

def call_scrape_api_play_store():
    """Test /scrape endpoint with Play Store package name"""

    url = 'https://ashjohto-pacter-policy-api.hf.space/scrape'   # Replace with your actual ngrok URL
    headers = {
        "Content-Type": "application/json"
    }

    payload = {
        "package_name": "com.grofers.customerapp",
        "use_javascript": True,  # Boolean, not string
        "wait_time": 15
    }

    print("="*70)
    print("TESTING /scrape ENDPOINT - Play Store Mode")
    print("="*70)
    print(f"\nURL: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print("\nSending request...")

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=180)  # 3 min timeout
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("\n✓ SUCCESS!")
            print(f"  Source URL: {result.get('source_url')}")
            print(f"  Policy length: {result['content_length']} words")
            print(f"  Summary length: {result['summary_length']} words")
            print(f"\n  Summary preview:")
            print(f"  {result['summary'][:300]}...")
        else:
            print("\n✗ FAILED")
            print("Response:")
            print(json.dumps(response.json(), indent=2))
    
    except requests.exceptions.Timeout:
        print("Error: Request timed out (scraping may take 1-2 minutes)")
    except Exception as e:
        print(f"Error: {e}")

def call_scrape_api_direct_url():
    """Test /scrape endpoint with direct URL"""
    url = "https://temika-uncomminuted-pseudocharitably.ngrok-free.dev/scrape"   # Replace with your actual ngrok URL
    headers = {
        "Content-Type": "application/json"
    }

    payload = {
        "url": "https://blinkit.com/privacy",
        "use_javascript": True,
        "wait_time": 15
    }

    print("\n" + "="*70)
    print("TESTING /scrape ENDPOINT - Direct URL Mode")
    print("="*70)
    print(f"\nURL: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print("\nSending request...")

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=180)
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("\n✓ SUCCESS!")
            print(f"  Source URL: {result.get('source_url')}")
            print(f"  Policy length: {result['content_length']} words")
            print(f"  Summary length: {result['summary_length']} words")
        else:
            print("\n✗ FAILED")
            print("Response:")
            print(json.dumps(response.json(), indent=2))
    
    except requests.exceptions.Timeout:
        print("Error: Request timed out")
    except Exception as e:
        print(f"Error: {e}")

def call_health_check():
    """Test health check endpoint"""
    url = "https://ashjohto-privacy-policy-api.hf.space/"
    
    print("\n" + "="*70)
    print("TESTING / ENDPOINT - Health Check")
    print("="*70)
    print(f"\nURL: {url}")
    print("Sending request...")
    
    try:
        response = requests.get(url, timeout=30)
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Text: {response.text[:500]}")
        
        if response.status_code == 200:
            try:
                result = response.json()
                print("\n✓ SUCCESS!")
                print(f"Status: {result['status']}")
                print(f"Available chatbots: {result['available_chatbots']}")
            except Exception as e:
                print(f"JSON parse error: {e}")
        else:
            print("\n✗ FAILED")
    
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Test health check first
    call_health_check()
    
    # Then test scrape
    print("\n\nNow testing scrape endpoint...")
    input("Press Enter to continue with scrape test...")
    call_scrape_api_play_store()
    # call_scrape_api_direct_url()
