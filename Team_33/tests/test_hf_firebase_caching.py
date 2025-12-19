#!/usr/bin/env python3
"""
Test script for HuggingFace Spaces Firebase Caching Integration
Tests the /scrape-stream endpoint with Firebase cache functionality
"""

import requests
import json
import time
from typing import Dict, List
import sys
import os

# Fix Unicode encoding on Windows
if os.name == 'nt':
    sys.stdout.reconfigure(encoding='utf-8')

# ============================================================================
# CONFIGURATION
# ============================================================================

# HuggingFace Spaces API URL - Change to http://localhost:7860 for local testing
HF_API_URL = "http://localhost:7860"

# Test package
TEST_PACKAGE = "com.netflix.mediaclient"

# Disable SSL verification for testing (use with caution!)
VERIFY_SSL = False

# Set to True to test against HuggingFace Spaces, False for localhost
TEST_ON_HF_SPACES = False

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def parse_sse_event(line: str) -> Dict:
    """Parse a Server-Sent Event (SSE) line into a dictionary"""
    if not line or not line.startswith("data: "):
        return None
    
    try:
        json_str = line.replace("data: ", "").strip()
        return json.loads(json_str)
    except json.JSONDecodeError:
        return None


def print_event(event_data: Dict, event_number: int):
    """Pretty print an event"""
    if not event_data:
        return
    
    event_type = event_data.get("type", "unknown")
    data = event_data.get("data", {})
    
    # Color codes for terminal output
    colors = {
        "cache_hit": "\033[92m",      # Green
        "cache_miss": "\033[93m",     # Yellow
        "cache_save_complete": "\033[94m",  # Blue
        "complete": "\033[95m",       # Magenta
        "error": "\033[91m",          # Red
        "scrape_start": "\033[96m",   # Cyan
        "policy_content": "\033[97m", # White
    }
    
    reset = "\033[0m"
    color = colors.get(event_type, "")
    
    print(f"\n{color}[Event {event_number}] {event_type}{reset}")
    
    # Print relevant data based on event type
    if event_type == "cache_hit":
        print(f"  ✓ Package found in cache!")
        print(f"    Message: {data.get('message')}")
    
    elif event_type == "cache_miss":
        print(f"  ✗ Package not in cache")
        print(f"    Message: {data.get('message')}")
    
    elif event_type == "scrape_start":
        print(f"  Mode: {data.get('mode')}")
        if data.get('package_name'):
            print(f"  Package: {data.get('package_name')}")
    
    elif event_type == "scrape_complete":
        print(f"  Content length: {data.get('content_length')} chars")
        print(f"  Content words: {data.get('content_words')} words")
        print(f"  Source URL: {data.get('source_url')}")
    
    elif event_type == "policy_content":
        word_count = data.get('word_count', 0)
        char_count = data.get('char_count', 0)
        from_cache = data.get('from_cache', False)
        
        cache_label = " (CACHED)" if from_cache else " (FRESH)"
        print(f"  Policy{cache_label}:")
        print(f"    Words: {word_count}")
        print(f"    Chars: {char_count}")
        print(f"    Preview: {data.get('content', '')[:100]}...")
    
    elif event_type == "chunk_summary":
        from_cache = data.get('from_cache', False)
        cache_label = " (CACHED)" if from_cache else " (FRESH)"
        print(f"  Summary{cache_label}:")
        print(f"    Words: {data.get('words', 0)}")
        print(f"    Preview: {data.get('summary', '')[:100]}...")
    
    elif event_type == "cache_save_complete":
        print(f"  ✓ Package saved to Firebase!")
        print(f"    Message: {data.get('message')}")
    
    elif event_type == "complete":
        print(f"  ✓ Completed!")
        print(f"    From cache: {data.get('from_cache', False)}")
        print(f"    Message: {data.get('message')}")
    
    elif event_type == "error":
        print(f"  ✗ Error: {data.get('error_message')}")
    
    elif event_type in ["iteration_complete", "chunk_summary"]:
        if event_type == "iteration_complete":
            print(f"  Words: {data.get('combined_words')}")
            print(f"  Compression: {data.get('compression_ratio', 0):.2%}")
        else:
            print(f"  Chunk {data.get('chunk_index', '?')} of {data.get('total_chunks', '?')}")


def test_scrape_stream_with_caching(package_name: str, test_number: int = 1) -> Dict:
    """
    Test the /scrape-stream endpoint with Firebase caching
    
    Args:
        package_name: Android package to scrape
        test_number: Test number (for labeling)
    
    Returns:
        Dictionary with test results
    """
    print(f"\n{'='*70}")
    print(f"TEST {test_number}: SCRAPE-STREAM WITH FIREBASE CACHING")
    print(f"{'='*70}")
    print(f"Package: {package_name}")
    print(f"API URL: {HF_API_URL}/scrape-stream")
    print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Prepare request
    url = f"{HF_API_URL}/scrape-stream"
    payload = {
        "package_name": package_name,
        "use_javascript": True,
        "wait_time": 15
    }
    headers = {"Content-Type": "application/json"}
    
    print(f"\nRequest payload:")
    print(json.dumps(payload, indent=2))
    
    # Track results
    results = {
        "package": package_name,
        "test_number": test_number,
        "start_time": time.time(),
        "events": [],
        "event_counts": {},
        "cache_hit": False,
        "cache_miss": False,
        "cache_saved": False,
        "final_summary": None,
        "policy_content": None,
        "error": None,
        "duration": 0,
        "success": False,
    }
    
    try:
        print(f"\nConnecting to HuggingFace API...")
        
        # Stream the response
        response = requests.post(
            url,
            json=payload,
            stream=True,
            verify=VERIFY_SSL,
            timeout=180  # 3 minute timeout for long operations
        )
        
        if response.status_code != 200:
            results["error"] = f"HTTP {response.status_code}: {response.text}"
            print(f"\n✗ Error: {results['error']}")
            return results
        
        print(f"✓ Connected! Streaming events...\n")
        
        # Parse SSE stream
        event_number = 0
        for line in response.iter_lines():
            if not line:
                continue
            
            try:
                line_str = line.decode('utf-8') if isinstance(line, bytes) else line
                event_data = parse_sse_event(line_str)
                
                if event_data:
                    event_number += 1
                    event_type = event_data.get("type", "unknown")
                    
                    # Track event counts
                    results["event_counts"][event_type] = results["event_counts"].get(event_type, 0) + 1
                    results["events"].append({
                        "number": event_number,
                        "type": event_type,
                        "data": event_data.get("data", {})
                    })
                    
                    # Print event
                    print_event(event_data, event_number)
                    
                    # Track specific events
                    if event_type == "cache_hit":
                        results["cache_hit"] = True
                    elif event_type == "cache_miss":
                        results["cache_miss"] = True
                    elif event_type == "cache_save_complete":
                        results["cache_saved"] = True
                    elif event_type == "complete":
                        data = event_data.get("data", {})
                        results["final_summary"] = data.get("final_summary")
                    elif event_type == "policy_content":
                        data = event_data.get("data", {})
                        results["policy_content"] = data.get("content")
                    elif event_type == "error":
                        results["error"] = event_data.get("data", {}).get("error_message")
            
            except Exception as e:
                print(f"[Warning] Failed to parse event: {e}")
                continue
        
        results["duration"] = time.time() - results["start_time"]
        results["success"] = results["error"] is None
        
    except requests.exceptions.Timeout:
        results["error"] = "Request timeout (>3 minutes)"
        results["success"] = False
    except requests.exceptions.ConnectionError as e:
        results["error"] = f"Connection error: {str(e)}"
        results["success"] = False
    except Exception as e:
        results["error"] = f"Unexpected error: {str(e)}"
        results["success"] = False
    
    return results


def print_summary(results: Dict):
    """Print a summary of test results"""
    print(f"\n{'='*70}")
    print(f"TEST SUMMARY")
    print(f"{'='*70}")
    
    print(f"\nPackage: {results['package']}")
    print(f"Duration: {results['duration']:.2f} seconds")
    print(f"Success: {'✓ YES' if results['success'] else '✗ NO'}")
    
    if results['error']:
        print(f"Error: {results['error']}")
    
    print(f"\nEvent Counts:")
    for event_type, count in results['event_counts'].items():
        print(f"  - {event_type}: {count}")
    
    print(f"\nFirebase Cache Status:")
    print(f"  - Cache hit: {'✓ YES' if results['cache_hit'] else '✗ NO'}")
    print(f"  - Cache miss: {'✓ YES' if results['cache_miss'] else '✗ NO'}")
    print(f"  - Cache saved: {'✓ YES' if results['cache_saved'] else '✗ NO'}")
    
    if results['policy_content']:
        words = len(results['policy_content'].split())
        print(f"\nPolicy Content:")
        print(f"  - Words: {words}")
        print(f"  - Preview: {results['policy_content'][:100]}...")
    
    if results['final_summary']:
        words = len(results['final_summary'].split())
        print(f"\nFinal Summary:")
        print(f"  - Words: {words}")
        print(f"  - Preview: {results['final_summary'][:100]}...")


def main():
    """Main test function"""
    print("\n" + "="*70)
    print("HUGGINGFACE SPACES - FIREBASE CACHING TEST")
    print("="*70)
    print(f"HuggingFace URL: https://huggingface.co/spaces/ashjohto/pacter-policy-api")
    print(f"API Base URL: {HF_API_URL}")
    print(f"Test Package: {TEST_PACKAGE}")
    
    # Run first test (should be cache miss + save)
    print(f"\n\nPhase 1: First Request (Cache Miss → Scrape → Save)")
    print(f"-" * 70)
    results1 = test_scrape_stream_with_caching(TEST_PACKAGE, test_number=1)
    print_summary(results1)
    
    if not results1['success']:
        print(f"\n✗ Test 1 failed. Skipping Test 2.")
        return
    
    if not results1['cache_saved']:
        print(f"\n⚠ Warning: Cache not saved in Test 1. Test 2 may not show cache hit.")
    
    # Wait before second request
    print(f"\n\nWaiting 3 seconds before second request...")
    time.sleep(3)
    
    # Run second test (should be cache hit)
    print(f"\n\nPhase 2: Second Request (Cache Hit)")
    print(f"-" * 70)
    results2 = test_scrape_stream_with_caching(TEST_PACKAGE, test_number=2)
    print_summary(results2)
    
    # Compare results
    print(f"\n\n{'='*70}")
    print(f"COMPARISON")
    print(f"{'='*70}")
    
    print(f"\nTest 1 (First Request):")
    print(f"  - Duration: {results1['duration']:.2f}s")
    print(f"  - Cache hit: {results1['cache_hit']}")
    print(f"  - Cache miss: {results1['cache_miss']}")
    print(f"  - Cache saved: {results1['cache_saved']}")
    
    print(f"\nTest 2 (Second Request):")
    print(f"  - Duration: {results2['duration']:.2f}s")
    print(f"  - Cache hit: {results2['cache_hit']}")
    print(f"  - Cache miss: {results2['cache_miss']}")
    print(f"  - Cache saved: {results2['cache_saved']}")
    
    if results2['cache_hit']:
        speedup = results1['duration'] / results2['duration']
        print(f"\n✓ SUCCESS: Cache working!")
        print(f"  - Speedup: {speedup:.1f}x faster on cache hit")
        print(f"  - Time saved: {results1['duration'] - results2['duration']:.2f}s")
    else:
        print(f"\n⚠ WARNING: Second request did not show cache hit")
        print(f"  - Check Firebase Console to verify data was saved")
        print(f"  - Check server logs for any Firebase errors")
    
    print(f"\n{'='*70}\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n✗ Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
