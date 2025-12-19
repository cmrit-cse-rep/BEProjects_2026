#!/usr/bin/env python3
"""
Test script to verify Dolo-650 strip extraction improvements
"""

import sys
import os
sys.path.append('main medicine_ocr updated')

from advanced_strip_ocr_lite import AdvancedStripOCRLite

def test_dolo_patterns():
    """Test the improved patterns for Dolo-650 extraction"""
    
    # Sample text that might be extracted from Dolo-650 strip
    sample_text = """
    Paracetamol Tablets IP
    Dolo-650
    Each uncoated tablet contains:
    Paracetamol IP 650 mg
    Store in a dry & dark place
    at a temperature not exceeding 30°C
    Dosage: As directed by the Physician
    Over dose may be injurious to Liver
    
    Mfg. Lic. No.: AM000/2012
    Made in India by:
    MICRO LABS LIMITED
    Namring, Namthang Road,
    Namchi-737 132, Sikkim
    
    MFG: JAN 2024
    EXP: DEC 2026
    M.R.P. Rs. 189.00
    """
    
    ocr = AdvancedStripOCRLite()
    info = ocr.extract_medicine_info(sample_text)
    
    print("=== Dolo-650 Extraction Test Results ===")
    print(f"Medicine Name: {info.get('medicine_name', 'NOT FOUND')}")
    print(f"Batch Number: {info.get('batch_number', 'NOT FOUND')}")
    print(f"MFG Date: {info.get('manufacture_date', 'NOT FOUND')}")
    print(f"EXP Date: {info.get('expiry_date', 'NOT FOUND')}")
    print(f"MRP: {info.get('mrp', 'NOT FOUND')}")
    
    # Expected results
    expected = {
        'batch_number': 'AM000/2012',
        'manufacture_date': '01/2024',  # JAN 2024
        'expiry_date': '12/2026',       # DEC 2026
        'mrp': 189.0
    }
    
    print("\n=== Validation ===")
    for key, expected_value in expected.items():
        actual_value = info.get(key)
        status = "✓ PASS" if actual_value == expected_value else "✗ FAIL"
        print(f"{key}: {status} (Expected: {expected_value}, Got: {actual_value})")

if __name__ == "__main__":
    test_dolo_patterns()