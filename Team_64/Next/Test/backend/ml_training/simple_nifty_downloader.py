#!/usr/bin/env python3
"""
Simple Nifty 50 Data Downloader
Downloads 2 years of Nifty 50 data and saves as JSON
"""

import yfinance as yf
import json
from datetime import datetime, timedelta
import os

def download_nifty_data():
    """Download 2 years of Nifty 50 data and save as JSON"""
    
    # Calculate date range (2 years ago to today)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=730)  # 2 years
    
    print(f"Downloading Nifty 50 data from {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}...")
    
    try:
        # Download data using yfinance
        ticker = yf.Ticker("^NSEI")  # Nifty 50 symbol
        data = ticker.history(
            start=start_date.strftime('%Y-%m-%d'),
            end=end_date.strftime('%Y-%m-%d'),
            interval='1d'
        )
        
        if data.empty:
            print("❌ No data received from yfinance")
            return False
            
        print(f"📊 Downloaded {len(data)} records")
        
        # Convert to simple format
        json_data = []
        
        for date_index in data.index:
            try:
                # Get the row data
                row = data.loc[date_index]
                
                # Create record with simple column access
                record = {
                    'date': date_index.strftime('%Y-%m-%d'),
                    'open': float(row['Open']),
                    'high': float(row['High']),
                    'low': float(row['Low']),
                    'close': float(row['Close']),
                    'volume': int(row['Volume'])
                }
                
                json_data.append(record)
                
            except Exception as e:
                print(f"⚠️ Error processing row {date_index}: {e}")
                continue
        
        # Create data directory if it doesn't exist
        data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
        os.makedirs(data_dir, exist_ok=True)
        
        # Save to JSON file
        output_file = os.path.join(data_dir, 'nifty50_2year_data.json')
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump({
                'symbol': '^NSEI',
                'name': 'NIFTY 50',
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d'),
                'total_records': len(json_data),
                'data': json_data
            }, f, indent=2)
        
        print(f"💾 Data saved to: {output_file}")
        print(f"📈 Records: {len(json_data)}")
        
        if json_data:
            print(f"📅 Date range: {json_data[0]['date']} to {json_data[-1]['date']}")
        
        print("\n🎉 Success! Nifty 50 data downloaded and saved as JSON.")
        return True
        
    except Exception as e:
        print(f"❌ Error downloading data: {e}")
        return False

if __name__ == "__main__":
    download_nifty_data()