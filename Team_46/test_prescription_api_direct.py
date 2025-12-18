#!/usr/bin/env python3
"""
Test prescription API directly by calling the extraction functions
"""

import sys
import os
sys.path.append('main medicine_ocr updated')

# Mock Flask session for testing
class MockSession:
    def get(self, key, default=None):
        if key == 'logged_in':
            return True
        return default

# Mock the session
import builtins
builtins.session = MockSession()

def test_prescription_extraction_pipeline():
    """Test the complete prescription extraction pipeline"""
    
    print("=== Testing Prescription Extraction Pipeline ===")
    
    # Import the extraction function
    from app import extract_medicines_from_prescription
    
    # Create a simple test image (white background with black text)
    from PIL import Image, ImageDraw, ImageFont
    import io
    
    # Create prescription-like image
    img = Image.new('RGB', (800, 1000), color='white')
    draw = ImageDraw.Draw(img)
    
    # Try to use a basic font
    try:
        font = ImageFont.truetype("arial.ttf", 20)
    except:
        font = ImageFont.load_default()
    
    # Draw prescription text
    prescription_text = [
        "Kinder Women's Hospital and Fertility Centre",
        "PRESCRIPTION",
        "",
        "PATIENT ID: KHB111175",
        "PATIENT NAME: Ms SHREYA GOENKA",
        "",
        "# Drug Name                    Dosage  Route",
        "",
        "ITRACOE 200 MG CAPS          1 NOS   ORAL",
        "(ITRACONAZOLE 200 MG)",
        "",
        "ONABET CREAM 30GM            1 MG    Topical",
        "(SERTACONAZOLE)",
        "",
        "LACTACYD LOTION 100 ML       1 ML    Topical",
        "(LAURYL GLUCOSIDE + LACTIC ACID)",
        "",
        "Dr. LAKSHMI DEVI M",
        "END OF PRESCRIPTION"
    ]
    
    y_position = 50
    for line in prescription_text:
        draw.text((50, y_position), line, fill='black', font=font)
        y_position += 30
    
    # Convert to bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    image_content = img_bytes.getvalue()
    
    print(f"Created test image: {len(image_content)} bytes")
    
    # Test the extraction
    try:
        medicines = extract_medicines_from_prescription(image_content)
        print(f"Extraction result: {medicines}")
        
        if medicines is None:
            print("❌ Extraction returned None - check logs above")
            return False
        elif not medicines:
            print("❌ Extraction returned empty list")
            return False
        else:
            expected = ['ITRACOE', 'ONABET', 'LACTACYD']
            found = [med for med in medicines if any(exp.upper() in med.upper() for exp in expected)]
            
            print(f"Expected: {expected}")
            print(f"Found: {found}")
            
            if len(found) >= 2:  # At least 2 out of 3
                print("✅ Extraction working correctly")
                return True
            else:
                print("❌ Not enough medicines found")
                return False
                
    except Exception as e:
        print(f"❌ Exception during extraction: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_prescription_extraction_pipeline()