#!/usr/bin/env python3
"""
Simple test to check what's happening with prescription extraction
"""

import sys
import os
sys.path.append('main medicine_ocr updated')

def test_gemini_extraction():
    """Test Gemini extraction directly"""
    
    print("=== Testing Gemini Extraction ===")
    
    # Create a simple test image
    from PIL import Image, ImageDraw, ImageFont
    import io
    
    img = Image.new('RGB', (600, 400), color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw simple text
    try:
        font = ImageFont.truetype("arial.ttf", 16)
    except:
        font = ImageFont.load_default()
    
    draw.text((50, 50), "PRESCRIPTION", fill='black', font=font)
    draw.text((50, 100), "ITRACOE 200 MG CAPS", fill='black', font=font)
    draw.text((50, 130), "ONABET CREAM 30GM", fill='black', font=font)
    draw.text((50, 160), "LACTACYD LOTION 100 ML", fill='black', font=font)
    
    # Convert to bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    image_content = img_bytes.getvalue()
    
    print(f"Created test image: {len(image_content)} bytes")
    
    # Test Gemini extraction
    try:
        import google.generativeai as genai
        import PIL.Image
        from io import BytesIO
        
        # Configure Gemini
        gemini_api_key = os.environ.get('GEMINI_API_KEY')
        if not gemini_api_key:
            print("❌ No Gemini API key found")
            return False
        
        genai.configure(api_key=gemini_api_key)
        model = genai.GenerativeModel('models/gemini-2.0-flash')
        
        # Convert to PIL Image
        image_pil = PIL.Image.open(BytesIO(image_content))
        
        # Test prompt
        prompt = """Look at this prescription image and extract all medicine names. 
        Return only a JSON array like ["Medicine1", "Medicine2"].
        Look for names like ITRACOE, ONABET, LACTACYD."""
        
        print("Sending to Gemini...")
        response = model.generate_content([prompt, image_pil])
        
        print(f"Gemini response: {response.text}")
        
        # Try to parse JSON
        import json
        import re
        
        response_text = response.text.strip().replace('```json', '').replace('```', '')
        
        # Try to find JSON array
        match = re.search(r'\[.*?\]', response_text, re.DOTALL)
        if match:
            try:
                medicines = json.loads(match.group(0))
                print(f"Parsed medicines: {medicines}")
                
                if len(medicines) >= 2:
                    print("✅ Gemini extraction working")
                    return True
                else:
                    print("❌ Not enough medicines found")
                    return False
            except json.JSONDecodeError as e:
                print(f"❌ JSON parsing failed: {e}")
                return False
        else:
            print("❌ No JSON array found in response")
            return False
            
    except Exception as e:
        print(f"❌ Gemini test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_free_ocr_extraction():
    """Test free OCR extraction"""
    
    print("\n=== Testing Free OCR Extraction ===")
    
    # Test with sample text
    sample_text = """
    Kinder Women's Hospital and Fertility Centre
    PRESCRIPTION
    
    # Drug Name                    Dosage  Route
    
    ITRACOE 200 MG CAPS          1 NOS   ORAL
    ONABET CREAM 30GM            1 MG    Topical  
    LACTACYD LOTION 100 ML       1 ML    Topical
    
    END OF PRESCRIPTION
    """
    
    try:
        from free_ocr import extract_medicine_names_from_text
        
        medicines = extract_medicine_names_from_text(sample_text)
        print(f"Free OCR extracted: {medicines}")
        
        expected = ['ITRACOE', 'ONABET', 'LACTACYD']
        found = [med for med in medicines if any(exp.upper() in med.upper() for exp in expected)]
        
        if len(found) >= 2:
            print("✅ Free OCR extraction working")
            return True
        else:
            print("❌ Free OCR not finding enough medicines")
            return False
            
    except Exception as e:
        print(f"❌ Free OCR test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=== Prescription Extraction Debug ===")
    
    gemini_ok = test_gemini_extraction()
    free_ocr_ok = test_free_ocr_extraction()
    
    if gemini_ok and free_ocr_ok:
        print("\n✅ Both extraction methods working - issue might be in Flask API")
    elif gemini_ok:
        print("\n⚠️  Gemini working, Free OCR has issues")
    elif free_ocr_ok:
        print("\n⚠️  Free OCR working, Gemini has issues")
    else:
        print("\n❌ Both extraction methods have issues")