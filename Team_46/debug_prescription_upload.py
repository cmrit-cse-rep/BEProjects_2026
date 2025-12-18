#!/usr/bin/env python3
"""
Debug script to test prescription upload and see what's being extracted
"""

import requests
import json
from PIL import Image
import io

def test_prescription_upload():
    """Test prescription upload to debug the extraction"""
    
    # Create a simple test image with prescription text
    # This simulates your prescription image
    img = Image.new('RGB', (800, 600), color='white')
    
    # Convert to bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes = img_bytes.getvalue()
    
    # Test the API endpoint
    url = 'http://127.0.0.1:5000/api/analyze_prescription'
    
    # Prepare the file upload
    files = {
        'prescription': ('test_prescription.png', img_bytes, 'image/png')
    }
    
    # Make request with session (simulate logged in user)
    session = requests.Session()
    
    # First login (simulate)
    login_data = {
        'username': 'test_user',
        'password': 'test_pass',
        'user_type': 'user'
    }
    
    try:
        # Try to upload prescription
        print("Testing prescription upload...")
        response = session.post(url, files=files)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 401:
            print("❌ Unauthorized - need to login first")
            return False
        elif response.status_code == 200:
            try:
                result = response.json()
                print(f"✅ Success: {result}")
                return True
            except json.JSONDecodeError:
                print(f"❌ Invalid JSON response: {response.text}")
                return False
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - make sure Flask app is running on http://127.0.0.1:5000")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_direct_extraction():
    """Test the extraction functions directly"""
    
    print("\n=== Testing Direct Extraction ===")
    
    # Simulate prescription text that would be extracted by OCR
    prescription_text = """
    Kinder Women's Hospital and Fertility Centre
    PRESCRIPTION
    
    PATIENT ID: KHB111175
    PATIENT NAME: Ms SHREYA GOENKA
    
    # Drug Name                    Dosage  Route  Frequency/Instruction
    
    ITRACOE 200 MG CAPS          1 NOS   ORAL   Once Daily (Night)
    (ITRACONAZOLE 200 MG)
    
    ONABET CREAM 30GM            1 MG    Topical  Twice Daily
    (SERTACONAZOLE)
    
    LACTACYD LOTION 100 ML       1 ML    Topical  Once Daily
    (LAURYL GLUCOSIDE + LACTIC ACID)
    """
    
    # Test the extraction function
    import sys
    sys.path.append('main medicine_ocr updated')
    
    from free_ocr import extract_medicine_names_from_text
    
    medicines = extract_medicine_names_from_text(prescription_text)
    print(f"Extracted medicines: {medicines}")
    
    # Check if we got the expected medicines
    expected = ['ITRACOE', 'ONABET', 'LACTACYD']
    found = [med for med in medicines if any(exp.upper() in med.upper() for exp in expected)]
    
    print(f"Expected: {expected}")
    print(f"Found: {found}")
    
    if len(found) >= 3:
        print("✅ Direct extraction working correctly")
        return True
    else:
        print("❌ Direct extraction not finding all medicines")
        return False

if __name__ == "__main__":
    print("=== Prescription Upload Debug ===")
    
    # Test direct extraction first
    direct_ok = test_direct_extraction()
    
    # Test API upload
    api_ok = test_prescription_upload()
    
    if direct_ok and not api_ok:
        print("\n🔍 Issue is likely in the Flask API or authentication")
    elif not direct_ok:
        print("\n🔍 Issue is in the extraction logic itself")
    else:
        print("\n✅ Everything working correctly")