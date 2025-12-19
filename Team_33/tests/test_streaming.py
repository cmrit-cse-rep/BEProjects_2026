#!/usr/bin/env python3
"""
Test client for streaming endpoints
Tests the /summarize-stream and /scrape-stream endpoints with real-time event handling
"""

import requests
import json
import time

BASE_URL = "http://localhost:7860"

def test_summarize_stream():
    """Test the /summarize-stream endpoint"""
    
    # Sample text to summarize
    with open("privacy_policy_clean.txt", 'r', encoding='utf-8') as f:
            html_content = f.read()
    
    print("=" * 70)
    print("Testing /summarize-stream endpoint")
    print("=" * 70)
    print(f"Text length: {len(html_content.split())} words\n")
    
    try:
        response = requests.post(
            f"{BASE_URL}/summarize-stream",
            json={"text": html_content},
            stream=True,
            timeout=300
        )
        
        response.raise_for_status()
        
        iteration_count = 0
        chunk_count_total = 0
        
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8') if isinstance(line, bytes) else line
                
                if line_str.startswith('data: '):
                    try:
                        event_data = json.loads(line_str[6:])
                        event_type = event_data.get('type')
                        data = event_data.get('data', {})
                        iteration = event_data.get('iteration')
                        
                        # Print event based on type
                        if event_type == 'start':
                            print(f"[START] {data.get('message')}")
                            print(f"  Initial length: {data.get('initial_words')} words")
                        
                        elif event_type == 'chunking_complete':
                            print(f"[CHUNKING] {data.get('message')}")
                        
                        elif event_type == 'chunk_summary':
                            chunk_count_total += 1
                            print(f"  Chunk {data.get('chunk_index')+1}/{data.get('total_chunks')} | "
                                  f"Iter {iteration}: {data.get('summary')[:60]}...")
                        
                        elif event_type == 'iteration_complete':
                            iteration_count += 1
                            print(f"\n[ITERATION {iteration}]")
                            print(f"  Combined length: {data.get('combined_words')} words")
                            print(f"  Compression ratio: {data.get('compression_ratio'):.2%}")
                            print(f"  Avg compression ratio: {data.get('avg_compression_ratio'):.2%}")
                        
                        elif event_type == 'prediction':
                            print(f"[PREDICTION]")
                            print(f"  Current length: {data.get('current_length')} words")
                            print(f"  Predicted next: {data.get('predicted_next_length'):.0f} words")
                            print(f"  Likely final: {data.get('likely_final_iteration')} "
                                  f"({data.get('confidence')} confidence)")
                        
                        elif event_type == 'rechunking':
                            print(f"[RECHUNKING] {data.get('message')}")
                        
                        elif event_type == 'complete':
                            print(f"\n[COMPLETE]")
                            print(f"  Final summary ({data.get('final_length')} words):")
                            print(f"  {data.get('final_summary')}")
                            print(f"  Total iterations: {data.get('total_iterations')}")
                            print(f"  Overall compression rate: {data.get('compression_rate'):.2%}")
                        
                        elif event_type == 'error':
                            print(f"[ERROR] {data.get('error_message')}")
                        
                    except json.JSONDecodeError:
                        print(f"Failed to parse JSON: {line_str}")
        
        print("\n" + "=" * 70)
        print(f"Streaming completed successfully!")
        print(f"Total chunks processed: {chunk_count_total}")
        print(f"Total iterations: {iteration_count}")
        print("=" * 70 + "\n")
        
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
    except Exception as e:
        print(f"Error: {e}")

def test_scrape_stream(url):
    """Test the /scrape-stream endpoint"""
    
    print("=" * 70)
    print(f"Testing /scrape-stream endpoint")
    print(f"URL: {url}")
    print("=" * 70 + "\n")
    
    try:
        response = requests.post(
            f"{BASE_URL}/scrape-stream",
            json={
                "url": url,
                "use_javascript": True,
                "wait_time": 15
            },
            stream=True,
            timeout=300
        )
        
        response.raise_for_status()
        
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8') if isinstance(line, bytes) else line
                
                if line_str.startswith('data: '):
                    try:
                        event_data = json.loads(line_str[6:])
                        event_type = event_data.get('type')
                        data = event_data.get('data', {})
                        iteration = event_data.get('iteration')
                        
                        if event_type == 'scrape_start':
                            print(f"[SCRAPE START] Mode: {data.get('mode')}")
                        
                        elif event_type == 'scrape_complete':
                            print(f"[SCRAPE COMPLETE]")
                            print(f"  Content length: {data.get('content_length')} chars")
                            print(f"  Content words: {data.get('content_words')} words")
                        
                        elif event_type == 'chunk_summary':
                            print(f"  Chunk {data.get('chunk_index')+1}: {data.get('summary')[:50]}...")
                        
                        elif event_type == 'iteration_complete':
                            print(f"\n[ITERATION {iteration}]")
                            print(f"  Combined words: {data.get('combined_words')}")
                        
                        elif event_type == 'complete':
                            print(f"\n[FINAL SUMMARY]")
                            print(f"  {data.get('final_summary')[:200]}...")
                        
                        elif event_type == 'error':
                            print(f"[ERROR] {data.get('error_message')}")
                        
                    except json.JSONDecodeError:
                        pass
        
        print("\n" + "=" * 70)
        print("Scraping and summarization completed!")
        print("=" * 70 + "\n")
        
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Test summarization streaming
    test_summarize_stream()
    
    # Test scraping and summarization streaming
    # Uncomment to test with a real URL
    # test_scrape_stream("https://example.com/privacy-policy")