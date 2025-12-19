#!/usr/bin/env python3
"""
Test script to verify the Dolo-650 OCR fixes
"""
import sys
import os

# Add the main app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'main medicine_ocr updated'))

def test_dolo_extraction():
    """Test the enhanced medicine info extraction for Dolo-650"""
    print("\n" + "=" * 60)
    print("TESTING ENHANCED DOLO-650 OCR EXTRACTION")
    print("=" * 60)
    
    try:
        from advanced_strip_ocr import AdvancedStripOCR
        
        ocr = AdvancedStripOCR()
        
        # Test text that should be extracted from Dolo-650 strip
        # This simulates what OCR should extract from a clear image
        test_text = """
        Paracetamol Tablets IP
        Dolo-650
        Each uncoated tablet contains:
        Paracetamol IP 650 mg
        Store in a dry & dark place
        at a temperature not exceeding 30°C
        Dosage: As directed by the Physician
        Over dose may be injurious to Liver
        WARNING: Taking Paracetamol more than daily
        dose may cause serious liver damage or allergic
        reactions (eg. swelling of the face, mouth and
        throat, difficulty in breathing, itching or rash).
        Mfg. Lic. No.: AM000/2012
        Made in India by:
        MICRO LABS LIMITED
        Namkum, Namthang Road,
        Namchi-737 132, Sikkim
        Regd. Trade Mark
        M.R.P. Rs. 189.00
        B.No. AM000/2012
        MFG. DT. JAN.24
        EXP. DT. DEC.26
        """
        
        print("Input text (simulated OCR output):")
        print("-" * 40)
        print(test_text.strip())
        print("-" * 40)
        
        print("\nExtracting medicine information...")
        info = ocr.extract_medicine_info(test_text)
        
        print("\nExtracted Information:")
        print("-" * 40)
        for key, value in info.items():
            print(f"{key:15}: {value}")
        
        # Test expected results
        expected = {
            'medicine_name': 'Dolo-650',
            'dosage': '650 MG',
            'batch_number': 'AM000/2012',
            'manufacture_date': 'JAN.24',
            'expiry_date': 'DEC.26',
            'manufacturer': 'MICRO LABS LIMITED',
            'mrp': 189.0
        }
        
        print("\nValidation Results:")
        print("-" * 40)
        all_pass = True
        for key, expected_val in expected.items():
            actual_val = info.get(key, 'NOT FOUND')
            if key == 'mrp':
                # For MRP, check if it's close to expected
                try:
                    actual_num = float(str(actual_val).replace('Rs.', '').replace('₹', '').strip())
                    status = "✓" if abs(actual_num - expected_val) < 1 else "✗"
                except:
                    status = "✗"
            else:
                # For other fields, check if expected is contained in actual
                status = "✓" if str(expected_val).upper() in str(actual_val).upper() else "✗"
            
            if status == "✗":
                all_pass = False
            
            print(f"{status} {key:15}: Expected '{expected_val}' -> Got '{actual_val}'")
        
        print("\n" + "=" * 60)
        if all_pass:
            print("🎉 ALL TESTS PASSED! OCR extraction is working correctly.")
        else:
            print("⚠️  Some tests failed. OCR extraction needs improvement.")
        print("=" * 60)
        
        return all_pass
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure the advanced_strip_ocr module is available.")
        return False
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_poor_ocr_recovery():
    """Test recovery from poor OCR text like the user's issue"""
    print("\n" + "=" * 60)
    print("TESTING POOR OCR TEXT RECOVERY")
    print("=" * 60)
    
    try:
        from advanced_strip_ocr import AdvancedStripOCR
        
        ocr = AdvancedStripOCR()
        
        # Simulate the poor OCR text from the user's issue
        poor_ocr_text = """
        ty Paracetamol more ip Ne a3 4
        Dolo 650
        Each tablet contains
        Paracetamol IP 650 mg
        Store in dry place
        Batch No a
        MFD Dec 2025
        EXP Dec 2026
        MRP ₹0.00
        Manufacturer an
        """
        
        print("Poor OCR Input (like user's issue):")
        print("-" * 40)
        print(poor_ocr_text.strip())
        print("-" * 40)
        
        print("\nExtracting medicine information from poor OCR...")
        info = ocr.extract_medicine_info(poor_ocr_text)
        
        print("\nRecovered Information:")
        print("-" * 40)
        for key, value in info.items():
            print(f"{key:15}: {value}")
        
        # Check if we can recover key information
        recovery_tests = [
            ('medicine_name', ['DOLO', 'PARACETAMOL']),
            ('dosage', ['650']),
        ]
        
        print("\nRecovery Test Results:")
        print("-" * 40)
        recovery_success = True
        for key, expected_parts in recovery_tests:
            actual_val = str(info.get(key, '')).upper()
            found_parts = [part for part in expected_parts if part in actual_val]
            status = "✓" if found_parts else "✗"
            if status == "✗":
                recovery_success = False
            print(f"{status} {key:15}: Found {found_parts} in '{actual_val}'")
        
        print("\n" + "=" * 60)
        if recovery_success:
            print("🎉 OCR RECOVERY SUCCESSFUL! Can extract key info from poor OCR.")
        else:
            print("⚠️  OCR recovery needs improvement.")
        print("=" * 60)
        
        return recovery_success
        
    except Exception as e:
        print(f"❌ Error during recovery testing: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🔬 Testing Enhanced OCR for Medicine Strips")
    
    # Test 1: Good OCR text extraction
    test1_pass = test_dolo_extraction()
    
    # Test 2: Poor OCR recovery
    test2_pass = test_poor_ocr_recovery()
    
    print("\n" + "=" * 60)
    print("FINAL RESULTS")
    print("=" * 60)
    print(f"Good OCR Test: {'PASS' if test1_pass else 'FAIL'}")
    print(f"Poor OCR Recovery: {'PASS' if test2_pass else 'FAIL'}")
    
    if test1_pass and test2_pass:
        print("\n🎉 ALL TESTS PASSED! The OCR fixes should resolve the user's issue.")
    else:
        print("\n⚠️  Some tests failed. Additional improvements may be needed.")
    print("=" * 60)