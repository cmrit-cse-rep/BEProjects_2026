#!/usr/bin/env python3
"""
Test streaming endpoints with Play Store package scraping
Tests the /scrape-stream endpoint with package_name parameter
"""

import requests
import json
import time

BASE_URL = "URL_HERE"
PACKAGE_NAME = "com.bt.bms"

def test_scrape_stream_play_store():
    """Test the /scrape-stream endpoint with Play Store package"""
    
    print("=" * 80)
    print("Testing /scrape-stream endpoint with Play Store")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print(f"Package Name: {PACKAGE_NAME}\n")
    
    try:
        response = requests.post(
            f"{BASE_URL}/scrape-stream",
            json={
                "package_name": PACKAGE_NAME,
                "use_javascript": True,
                "wait_time": 15
            },
            stream=True,
            timeout=300,
            verify=False  # For ngrok, ignore SSL verification
        )
        
        response.raise_for_status()
        
        # Event tracking
        events_received = []
        event_counts = {}
        policy_content = None
        final_summary = None
        start_time = time.time()
        
        print("Streaming events:\n")
        
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8') if isinstance(line, bytes) else line
                
                if line_str.startswith('data: '):
                    try:
                        event_data = json.loads(line_str[6:])
                        event_type = event_data.get('type')
                        data = event_data.get('data', {})
                        iteration = event_data.get('iteration')
                        
                        # Count event types
                        event_counts[event_type] = event_counts.get(event_type, 0) + 1
                        events_received.append(event_type)
                        
                        # Print event based on type
                        if event_type == 'scrape_start':
                            print(f"[SCRAPE START]")
                            print(f"  Mode: {data.get('mode')}")
                            print(f"  Package: {data.get('package_name')}\n")
                        
                        elif event_type == 'scrape_complete':
                            print(f"[SCRAPE COMPLETE]")
                            print(f"  Content length: {data.get('content_length')} chars")
                            print(f"  Content words: {data.get('content_words')} words")
                            print(f"  Source URL: {data.get('source_url')}\n")
                        
                        elif event_type == 'policy_content':
                            policy_content = data.get('content')
                            print(f"[POLICY CONTENT RECEIVED]")
                            print(f"  Word count: {data.get('word_count')} words")
                            print(f"  Char count: {data.get('char_count')} chars")
                            print(f"  Preview: {data.get('content')[:200]}...\n")
                        
                        elif event_type == 'start':
                            print(f"[START] Summarization beginning")
                            print(f"  Initial length: {data.get('initial_words')} words\n")
                        
                        elif event_type == 'chunking_complete':
                            print(f"[CHUNKING] {data.get('message')}\n")
                        
                        elif event_type == 'chunk_summary':
                            chunk_idx = data.get('chunk_index')
                            total_chunks = data.get('total_chunks')
                            summary = data.get('summary')
                            iter_num = iteration
                            print(f"  Iter {iter_num} | Chunk {chunk_idx+1}/{total_chunks}: {summary[:60]}...")
                        
                        elif event_type == 'iteration_complete':
                            print(f"\n[ITERATION {iteration} COMPLETE]")
                            print(f"  Combined words: {data.get('combined_words')} words")
                            print(f"  Compression ratio: {data.get('compression_ratio'):.2%}")
                            print(f"  Avg compression: {data.get('avg_compression_ratio'):.2%}\n")
                        
                        elif event_type == 'prediction':
                            print(f"[PREDICTION]")
                            print(f"  Current length: {data.get('current_length')} words")
                            print(f"  Predicted next: {data.get('predicted_next_length'):.0f} words")
                            print(f"  Likely final: {data.get('likely_final_iteration')}")
                            print(f"  Confidence: {data.get('confidence')}\n")
                        
                        elif event_type == 'rechunking':
                            print(f"[RECHUNKING] {data.get('message')}\n")
                        
                        elif event_type == 'complete':
                            final_summary = data.get('final_summary')
                            print(f"\n[COMPLETE] ✅")
                            print(f"  Final summary ({data.get('final_length')} words):")
                            print(f"  {data.get('final_summary')}")
                            print(f"  Total iterations: {data.get('total_iterations')}")
                            print(f"  Overall compression rate: {data.get('compression_rate'):.2%}\n")
                        
                        elif event_type == 'error':
                            print(f"[ERROR] {data.get('error_message')}\n")
                    
                    except json.JSONDecodeError:
                        print(f"[WARNING] Failed to parse JSON: {line_str[:80]}")
        
        # Print summary
        elapsed_time = time.time() - start_time
        print("=" * 80)
        print("STREAMING SUMMARY")
        print("=" * 80)
        print(f"\nTotal events received: {len(events_received)}")
        print(f"Unique event types: {len(event_counts)}")
        print(f"\nEvent breakdown:")
        for event_type, count in sorted(event_counts.items()):
            print(f"  {event_type}: {count}")
        
        print(f"\nTotal time: {elapsed_time:.1f}s")
        
        if policy_content:
            print(f"\n✅ Policy content received: {len(policy_content)} chars")
            print(f"   Word count: {len(policy_content.split())} words")
        
        if final_summary:
            print(f"\n✅ Final summary received: {len(final_summary)} chars")
            print(f"   Word count: {len(final_summary.split())} words")
        
        print("\n" + "=" * 80)
        print("✅ STREAMING TEST COMPLETED SUCCESSFULLY!")
        print("=" * 80 + "\n")
        
        return True
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}\n")
        return False
    except Exception as e:
        print(f"❌ Error: {e}\n")
        return False


def test_scrape_stream_play_store_verbose():
    """Verbose test - prints all raw events"""
    
    print("\n" + "=" * 80)
    print("VERBOSE TEST - All Raw Events")
    print("=" * 80 + "\n")
    
    try:
        response = requests.post(
            f"{BASE_URL}/scrape-stream",
            json={
                "package_name": PACKAGE_NAME,
                "use_javascript": True,
                "wait_time": 15
            },
            stream=True,
            timeout=300,
            verify=False
        )
        
        response.raise_for_status()
        
        event_num = 0
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8') if isinstance(line, bytes) else line
                
                if line_str.startswith('data: '):
                    event_num += 1
                    try:
                        event_data = json.loads(line_str[6:])
                        print(f"Event #{event_num}: {event_data['type']}")
                        print(json.dumps(event_data, indent=2)[:500] + "...\n")
                    except json.JSONDecodeError:
                        print(f"Event #{event_num}: [Parse Error]\n")
        
        print("=" * 80)
        print(f"✅ Total events: {event_num}")
        print("=" * 80 + "\n")
        
    except Exception as e:
        print(f"❌ Error: {e}\n")


if __name__ == "__main__":
    import sys
    
    # Run main test
    success = test_scrape_stream_play_store()
    
    # Ask to run verbose test
    if success:
        try:
            response = input("\nRun verbose test showing all raw events? (y/n): ").strip().lower()
            if response == 'y':
                test_scrape_stream_play_store_verbose()
        except KeyboardInterrupt:
            print("\n\nTest cancelled by user")
