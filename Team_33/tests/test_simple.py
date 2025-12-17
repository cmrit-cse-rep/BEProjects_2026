#!/usr/bin/env python3
"""Simple test to diagnose Space connectivity"""

import requests
import json

# Test just the health endpoint without trailing slash variants
urls_to_test = [
    "https://ashjohto-privacy-policy-api.hf.space",
    "https://ashjohto-privacy-policy-api.hf.space/",
    "https://ashjohto-privacy-policy-api.hf.space/docs",
]

print("Testing Space connectivity...\n")

for url in urls_to_test:
    print(f"Testing: {url}")
    try:
        response = requests.get(url, timeout=10)
        print(f"  Status: {response.status_code}")
        if response.status_code == 200 and "json" in response.headers.get("content-type", ""):
            print(f"  Body: {response.json()}")
        else:
            print(f"  Content-Type: {response.headers.get('content-type', 'N/A')}")
            if len(response.text) > 200:
                print(f"  Body preview: {response.text[:200]}...")
            else:
                print(f"  Body: {response.text}")
    except Exception as e:
        print(f"  ERROR: {e}")
    print()
