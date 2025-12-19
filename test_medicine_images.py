#!/usr/bin/env python3
"""
Test script to extract information from actual medicine strip images
"""
import sys
import os
import base64
from io import BytesIO

# Add the main app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'main medicine_ocr updated'))

def test_image_extraction(image_path=None, image_data=None):
    """Test OCR extraction on actual medicine strip image"""
    print("\n" + "=" * 60)
    print("TESTING MEDICINE STRIP IMAGE EXTRACTION")
    print("=" * 60)
    
    try:
        # Load environment variables
        from dotenv import load_dotenv
        load_dotenv()
        
        # Import the enhanced OCR
        from advanced_strip_ocr import AdvancedStripOCR, process_medicine_strip_image
        
        # Get image content
        if image_path and os.path.exists(image_path):
            print(f"Loading image from: {image_path}")
            with open(image_path, 'rb') as f:
                image_content = f.read()
        elif image_data:
            print("Using provided image data")
            image_content = image_data
        else:
            print("❌ No image provided")
            return False
        
        print(f"Image size: {len(image_content)} bytes")
        
        # Test with advanced OCR
        print("\n🔬 Testing Advanced Strip OCR...")
        try:
            ocr = AdvancedStripOCR()
            result = ocr.process_medicine_strip(image_content)
            
            if result and isinstance(result, dict):
                print("✅ Advanced OCR Results:")
                print("-" * 40)
                for key, value in result.items():
                    if key != 'raw_text':  # Skip raw text for cleaner output
                        print(f"{key:15}: {value}")
                
                # Show a preview of raw text
                raw_text = result.get('raw_text', '')
                if raw_text:
                    preview = raw_text.replace('\n', ' ').strip()[:200]
                    print(f"{'raw_text':15}: {preview}...")
                
                return True
            else:
                print("❌ Advanced OCR returned no results")
        except Exception as e:
            print(f"❌ Advanced OCR failed: {e}")
        
        # Test with app's OCR function
        print("\n🔬 Testing App OCR Function...")
        try:
            # Import app OCR functions
            from app import ocr_extract_text
            
            text = ocr_extract_text(image_content)
            if text and len(text.strip()) > 10:
                print("✅ App OCR extracted text:")
                print("-" * 40)
                preview = text.replace('\n', ' ').strip()[:300]
                print(f"{preview}...")
                
                # Try to extract structured info from the text
                ocr = AdvancedStripOCR()
                info = ocr.extract_medicine_info(text)
                if info:
                    print("\n📋 Structured Information:")
                    print("-" * 40)
                    for key, value in info.items():
                        print(f"{key:15}: {value}")
                
                return True
            else:
                print("❌ App OCR returned insufficient text")
        except Exception as e:
            print(f"❌ App OCR failed: {e}")
        
        return False
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_with_sample_image():
    """Test with a sample image if available"""
    # Look for common image file names
    sample_paths = [
        'dolo_strip.jpg',
        'medicine_strip.jpg',
        'strip.jpg',
        'test_image.jpg',
        'sample.jpg'
    ]
    
    for path in sample_paths:
        if os.path.exists(path):
            print(f"Found sample image: {path}")
            return test_image_extraction(image_path=path)
    
    print("No sample images found. Please provide an image file.")
    return False

def create_test_with_base64():
    """Create a test function that can handle base64 image data"""
    print("\n" + "=" * 60)
    print("MEDICINE STRIP OCR TEST READY")
    print("=" * 60)
    print("To test with your medicine strip image:")
    print("1. Save your image as 'test_strip.jpg' in this directory, OR")
    print("2. Modify this script to include base64 image data")
    print("3. Run: python test_medicine_images.py")
    print("=" * 60)

def main():
    """Main test function"""
    print("🔬 MEDICINE STRIP OCR TESTING")
    
    # Check if we have a test image
    test_files = ['test_strip.jpg', 'dolo_strip.jpg', 'medicine.jpg', 'strip.jpg']
    found_image = None
    
    for test_file in test_files:
        if os.path.exists(test_file):
            found_image = test_file
            break
    
    if found_image:
        print(f"Testing with image: {found_image}")
        success = test_image_extraction(image_path=found_image)
        
        if success:
            print("\n🎉 SUCCESS! OCR extraction worked correctly.")
        else:
            print("\n⚠️ OCR extraction had issues. Check the logs above.")
    else:
        print("No test images found.")
        create_test_with_base64()
        
        # Test the system components anyway
        print("\n🔧 Testing System Components...")
        
        # Test API configuration
        try:
            gemini_key = os.environ.get('GEMINI_API_KEY')
            print(f"✅ GEMINI_API_KEY configured: {bool(gemini_key)}")
        except:
            print("❌ Environment configuration issue")
        
        # Test OCR modules
        try:
            from advanced_strip_ocr import TESSERACT_AVAILABLE, EASYOCR_AVAILABLE, CV2_AVAILABLE
            print(f"✅ Tesseract available: {TESSERACT_AVAILABLE}")
            print(f"✅ EasyOCR available: {EASYOCR_AVAILABLE}")
            print(f"✅ OpenCV available: {CV2_AVAILABLE}")
        except Exception as e:
            print(f"❌ OCR module test failed: {e}")

if __name__ == "__main__":
    main()