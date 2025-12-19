import yfinance as yf
import pandas as pd
import json
from datetime import datetime, timedelta
import os

def download_nifty50_simple():
    """
    Simple Nifty 50 data downloader that converts to JSON properly
    """
    
    # Nifty 50 symbol for Yahoo Finance
    nifty_symbol = "^NSEI"
    
    print("Downloading 2 years of Nifty 50 data...")
    
    # Calculate start date (2 years ago from today)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=2*365)
    
    try:
        # Download data
        nifty_data = yf.download(
            nifty_symbol, 
            start=start_date.strftime('%Y-%m-%d'), 
            end=end_date.strftime('%Y-%m-%d'),
            interval='1d'
        )
        
        if len(nifty_data) == 0:
            print("No data found for Nifty 50")
            return None
            
        print(f"Downloaded {len(nifty_data)} days of data")
        
        # Reset index to make Date a column
        nifty_data.reset_index(inplace=True)
        
        # Convert to JSON-friendly format
        data_records = []
        
        for index, row in nifty_data.iterrows():
            # Skip rows where any major data is missing
            try:
                close_val = float(row['Close'])
                open_val = float(row['Open'])
            except (ValueError, TypeError):
                continue
                
            record = {
                'date': row['Date'].strftime('%Y-%m-%d') if hasattr(row['Date'], 'strftime') else str(row['Date'])[:10],
                'open': open_val,  # We already validated this
                'high': float(row['High']),
                'low': float(row['Low']),
                'close': close_val,  # We already validated this  
                'adj_close': float(row['Adj Close']),
                'volume': int(float(row['Volume'])) if not pd.isna(row['Volume']) else 0
            }
            data_records.append(record)
        
        # Create final data structure
        data_dict = {
            'symbol': 'NIFTY50',
            'download_date': datetime.now().isoformat(),
            'period': '2 years',
            'total_records': len(data_records),
            'start_date': data_records[0]['date'] if data_records else None,
            'end_date': data_records[-1]['date'] if data_records else None,
            'data': data_records
        }
        
        # Create data directory if it doesn't exist
        data_dir = os.path.join(os.path.dirname(__file__), 'data')
        os.makedirs(data_dir, exist_ok=True)
        
        # Save to JSON file
        filename = "nifty50_2year_data.json"
        filepath = os.path.join(data_dir, filename)
        
        with open(filepath, 'w') as f:
            json.dump(data_dict, f, indent=2)
        
        print(f"Data saved successfully to: {filepath}")
        print(f"Data range: {data_dict['start_date']} to {data_dict['end_date']}")
        print(f"Total records: {data_dict['total_records']}")
        
        # Display summary statistics
        if data_records:
            closes = [record['close'] for record in data_records]
            print(f"\nSummary Statistics:")
            print(f"Highest Close: ₹{max(closes):,.2f}")
            print(f"Lowest Close: ₹{min(closes):,.2f}")
            print(f"Average Close: ₹{sum(closes)/len(closes):,.2f}")
            print(f"Latest Close: ₹{closes[-1]:,.2f}")
            
            # Show first few records
            print(f"\nFirst 3 records:")
            for i in range(min(3, len(data_records))):
                record = data_records[i]
                print(f"{i+1}. Date: {record['date']}, Close: ₹{record['close']:,.2f}")
            
            print(f"\nLast 3 records:")
            for i in range(max(0, len(data_records)-3), len(data_records)):
                record = data_records[i]
                print(f"{i+1}. Date: {record['date']}, Close: ₹{record['close']:,.2f}")
        
        return data_dict
        
    except Exception as e:
        print(f"Error downloading Nifty 50 data: {str(e)}")
        return None

if __name__ == "__main__":
    print("=== Nifty 50 Data Downloader (Simplified) ===")
    result = download_nifty50_simple()
    
    if result:
        print("\n=== Download completed successfully! ===")
    else:
        print("Failed to download Nifty 50 data")