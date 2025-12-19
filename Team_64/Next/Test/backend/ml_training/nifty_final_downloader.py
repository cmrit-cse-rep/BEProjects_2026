import yfinance as yf
import pandas as pd
import json
from datetime import datetime, timedelta
import os

def download_nifty50_final():
    """
    Final working version of Nifty 50 data downloader
    """
    
    print("Downloading 2 years of Nifty 50 data...")
    
    # Calculate dates
    end_date = datetime.now()
    start_date = end_date - timedelta(days=2*365)
    
    try:
        # Download data
        nifty_data = yf.download("^NSEI", start=start_date, end=end_date, interval='1d')
        
        if len(nifty_data) == 0:
            print("No data found")
            return None
            
        print(f"Downloaded {len(nifty_data)} days of data")
        print(f"Columns: {list(nifty_data.columns)}")
        
        # Convert to JSON format
        data_records = []
        
        # Reset index to get dates as column
        df = nifty_data.reset_index()
        
        for i in range(len(df)):
            try:
                row = df.iloc[i]
                
                # Extract values safely
                date_val = row['Date']
                open_val = row['Open']
                high_val = row['High'] 
                low_val = row['Low']
                close_val = row['Close']
                
                # Handle Adj Close column name variations
                if 'Adj Close' in df.columns:
                    adj_close_val = row['Adj Close']
                elif ('Adj Close',) in df.columns:
                    adj_close_val = row[('Adj Close',)]
                else:
                    adj_close_val = close_val
                
                # Handle Volume
                if 'Volume' in df.columns:
                    volume_val = row['Volume']
                elif ('Volume',) in df.columns:
                    volume_val = row[('Volume',)]
                else:
                    volume_val = 0
                
                record = {
                    'date': date_val.strftime('%Y-%m-%d') if hasattr(date_val, 'strftime') else str(date_val)[:10],
                    'open': float(open_val),
                    'high': float(high_val),
                    'low': float(low_val),
                    'close': float(close_val),
                    'adj_close': float(adj_close_val),
                    'volume': int(float(volume_val)) if not pd.isna(volume_val) else 0
                }
                
                data_records.append(record)
                
            except Exception as e:
                print(f"Error processing row {i}: {e}")
                continue
        
        # Create final structure
        data_dict = {
            'symbol': 'NIFTY50',
            'download_date': datetime.now().isoformat(),
            'period': '2 years',
            'total_records': len(data_records),
            'start_date': data_records[0]['date'] if data_records else None,
            'end_date': data_records[-1]['date'] if data_records else None,
            'data': data_records
        }
        
        # Save to file
        data_dir = os.path.join(os.path.dirname(__file__), 'data')
        os.makedirs(data_dir, exist_ok=True)
        
        filepath = os.path.join(data_dir, "nifty50_2year_data.json")
        
        with open(filepath, 'w') as f:
            json.dump(data_dict, f, indent=2)
        
        print(f"Data saved to: {filepath}")
        print(f"Records: {len(data_records)}")
        print(f"Date range: {data_dict['start_date']} to {data_dict['end_date']}")
        
        if data_records:
            closes = [r['close'] for r in data_records]
            print(f"\nSummary:")
            print(f"Highest: ₹{max(closes):,.2f}")
            print(f"Lowest: ₹{min(closes):,.2f}")
            print(f"Average: ₹{sum(closes)/len(closes):,.2f}")
            print(f"Latest: ₹{closes[-1]:,.2f}")
            
            print(f"\nFirst 3 records:")
            for i in range(min(3, len(data_records))):
                r = data_records[i]
                print(f"{i+1}. {r['date']}: ₹{r['close']:,.2f}")
            
            print(f"\nLast 3 records:")
            for i in range(max(0, len(data_records)-3), len(data_records)):
                r = data_records[i]
                print(f"{i+1}. {r['date']}: ₹{r['close']:,.2f}")
        
        return data_dict
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return None

if __name__ == "__main__":
    print("=== Nifty 50 Final Downloader ===")
    result = download_nifty50_final()
    
    if result:
        print("\n🎉 Success! Nifty 50 data downloaded and saved as JSON.")
    else:
        print("\n❌ Failed to download data.")