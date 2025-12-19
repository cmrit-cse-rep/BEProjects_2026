#!/usr/bin/env python3
"""
Test script to verify API configuration and OCR fixes
"""
import sys
import os

# Add the main app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'main medicine_ocr updated'))

def test_api_configuration():
    """Test if the Gemini API is properly configured"""
    print("\n" + "=" * 60)
    print("TESTING API CONFIGURATION")
    print("=" * 60)
    
    try:
        # Load environment variables
        from dotenv import load_dotenv
        load_dotenv()
        
        gemini_key = os.environ.get('GEMINI_API_KEY')
        print(f"GEMINI_API_KEY found: {bool(gemini_key)}")
        if gemini_key:
            print(f"Key starts with: {gemini_key[:10]}...")
        
        # Test Gemini availability
        try:
            import google.generativeai as genai
            print("✓ google.generativeai library available")
            
            if gemini_key:
                genai.configure(api_key=gemini_key)
                
                # Try to list models
                try:
                    models = list(genai.list_models())
                    print(f"✓ API key works! Found {len(models)} models")
                    
                    # Show available models
                    flash_models = [m.name for m in models if 'flash' in m.name.lower()]
                    if flash_models:
                        print(f"✓ Flash models available: {flash_models[:3]}")
                    
                    return True
                except Exception as api_error:
                    print(f"✗ API key test failed: {api_error}")
                    return False
            else:
                print("✗ No API key found")
                return False
                
        except ImportError:
            print("✗ google.generativeai not available")
            return False
            
    except Exception as e:
        print(f"✗ Configuration test failed: {e}")
        return False

def test_ocr_modules():
    """Test if OCR modules are available"""
    print("\n" + "=" * 60)
    print("TESTING OCR MODULES")
    print("=" * 60)
    
    # Test Tesseract
    try:
        import pytesseract
        print("✓ Tesseract (pytesseract) available")
        tesseract_available = True
    except ImportError:
        print("✗ Tesseract not available")
        tesseract_available = False
    
    # Test EasyOCR
    try:
        import easyocr
        print("✓ EasyOCR available")
        easyocr_available = True
    except ImportError:
        print("✗ EasyOCR not available")
        easyocr_available = False
    
    # Test PaddleOCR
    try:
        from paddleocr import PaddleOCR
        print("✓ PaddleOCR available")
        paddleocr_available = True
    except ImportError:
        print("✗ PaddleOCR not available")
        paddleocr_available = False
    
    # Test OpenCV
    try:
        import cv2
        print("✓ OpenCV available")
        opencv_available = True
    except ImportError:
        print("✗ OpenCV not available (will use PIL fallback)")
        opencv_available = False
    
    any_ocr = tesseract_available or easyocr_available or paddleocr_available
    print(f"\nOCR Status: {'✓ At least one OCR method available' if any_ocr else '✗ No OCR methods available'}")
    
    return any_ocr

def test_enhanced_extraction():
    """Test the enhanced extraction with simulated medicine strip text"""
    print("\n" + "=" * 60)
    print("TESTING ENHANCED EXTRACTION")
    print("=" * 60)
    
    try:
        from advanced_strip_ocr import AdvancedStripOCR
        
        ocr = AdvancedStripOCR()
        
        # Test with the exact type of text that should come from a Dolo-650 strip
        dolo_text = """
        Paracetamol Tablets IP
        Dolo-650
        Each uncoated tablet contains:
        Paracetamol IP 650 mg
        Store in a dry & dark place
        at a temperature not exceeding 30°C
        Dosage: As directed by the Physician
        Mfg. Lic. No.: AM000/2012
        Made in India by:
        MICRO LABS LIMITED
        M.R.P. Rs. 189.00
        B.No. AM000/2012
        MFG. DT. JAN.24
        EXP. DT. DEC.26
        """
        
        print("Extracting from Dolo-650 text...")
        info = ocr.extract_medicine_info(dolo_text)
        
        # Check key extractions
        checks = [
            ('medicine_name', ['DOLO-650', 'DOLO', 'PARACETAMOL']),
            ('dosage', ['650']),
            ('batch_number', ['AM000/2012', 'AM000']),
            ('manufacturer', ['MICRO LABS LIMITED', 'MICRO LABS']),
            ('mrp', ['189']),
        ]
        
        print("\nExtraction Results:")
        print("-" * 40)
        all_good = True
        for key, expected_parts in checks:
            actual = str(info.get(key, 'NOT FOUND')).upper()
            found = any(part.upper() in actual for part in expected_parts)
            status = "✓" if found else "✗"
            if not found:
                all_good = False
            print(f"{status} {key:15}: {info.get(key, 'NOT FOUND')}")
        
        return all_good
        
    except Exception as e:
        print(f"✗ Enhanced extraction test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🔬 MEDICINE STRIP OCR DIAGNOSTIC TEST")
    print("Testing API configuration and OCR fixes...")
    
    # Test 1: API Configuration
    api_ok = test_api_configuration()
    
    # Test 2: OCR Modules
    ocr_ok = test_ocr_modules()
    
    # Test 3: Enhanced Extraction
    extraction_ok = test_enhanced_extraction()
    
    # Summary
    print("\n" + "=" * 60)
    print("DIAGNOSTIC SUMMARY")
    print("=" * 60)
    print(f"API Configuration: {'✓ PASS' if api_ok else '✗ FAIL'}")
    print(f"OCR Modules:       {'✓ PASS' if ocr_ok else '✗ FAIL'}")
    print(f"Enhanced Extract:  {'✓ PASS' if extraction_ok else '✗ FAIL'}")
    
    if api_ok and ocr_ok and extraction_ok:
        print("\n🎉 ALL SYSTEMS GO! The OCR fixes should resolve the user's issue.")
        print("\nRecommendations:")
        print("1. The Gemini API is working and will provide the best results")
        print("2. Enhanced preprocessing will handle reflective medicine strips")
        print("3. Multiple OCR methods ensure fallback options")
    elif api_ok and extraction_ok:
        print("\n✅ MOSTLY READY! API and extraction work, OCR modules could be improved.")
        print("\nRecommendations:")
        print("1. Gemini API will handle most cases effectively")
        print("2. Consider installing additional OCR libraries for better fallback")
        print("3. Enhanced extraction patterns will improve accuracy")
    else:
        print("\n⚠️  ISSUES DETECTED! Some components need attention.")
        print("\nRecommendations:")
        if not api_ok:
            print("1. Check Gemini API key configuration")
        if not ocr_ok:
            print("2. Install OCR libraries: pip install easyocr paddleocr pytesseract")
        if not extraction_ok:
            print("3. Check advanced_strip_ocr module")
    
    print("=" * 60)

if __name__ == "__main__":
    main()