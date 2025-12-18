#!/usr/bin/env python3
"""
Test script to verify prescription extraction improvements
"""

import sys
import os
sys.path.append('main medicine_ocr updated')

from free_ocr import extract_medicine_names_from_text

def test_prescription_extraction():
    """Test the improved prescription extraction with sample data"""
    
    # Sample text that might be extracted from your prescription
    sample_prescription_text = """
    Kinder Women's Hospital and Fertility Centre
    (A Unit of Kindercare Hospitals Healthcare Pvt Ltd)
    
    PRESCRIPTION
    
    PATIENT ID: KHB111175                    DATE: 14-10-2024 09:38:11
    PATIENT NAME: Ms SHREYA GOENKA           CONSULTANT: Dr LAKSHMI DEVI M
    GENDER/AGE: Female/19                    DEPARTMENT: GYNAECOLOGY
    
    # Drug Name                    Dosage  Route  Frequency/Instruction        Duration
    
    ITRACOE 200 MG CAPS          1 NOS   ORAL   Once Daily (Night)           10
    
    (ITRACONAZOLE 200 MG)
    
    ONABET CREAM 30GM            1 MG    Topical  Twice Daily (Morning and Night)  1
    
    (SERTACONAZOLE)
    
    LACTACYD LOTION 100 ML       1 ML    Topical  Once Daily (Night)           1
    
    (LAURYL GLUCOSIDE + LACTIC ACID)
    
    Dr. LAKSHMI DEVI M
    (GYNAECOLOGY)
    
    END OF PRESCRIPTION
    
    Printed Date: 14-10-2024    Principal Date: 10/25/16    Page 1 of 1
    """
    
    print("=== Prescription Extraction Test ===")
    print("Sample prescription text:")
    print(sample_prescription_text[:300] + "...")
    
    # Test extraction
    medicines = extract_medicine_names_from_text(sample_prescription_text)
    
    print(f"\n=== Extracted Medicines ===")
    for i, med in enumerate(medicines, 1):
        print(f"{i}. {med}")
    
    # Expected medicines
    expected = ['ITRACOE', 'ONABET', 'LACTACYD']
    
    print(f"\n=== Validation ===")
    print(f"Expected: {expected}")
    print(f"Found: {medicines}")
    
    # Check if we found the expected medicines
    found_expected = []
    for expected_med in expected:
        for found_med in medicines:
            if expected_med.upper() in found_med.upper():
                found_expected.append(expected_med)
                break
    
    print(f"Successfully found: {found_expected}")
    print(f"Missing: {[med for med in expected if med not in found_expected]}")
    
    success_rate = len(found_expected) / len(expected) * 100
    print(f"Success rate: {success_rate:.1f}%")
    
    if success_rate >= 100:
        print("✅ TEST PASSED - All expected medicines found!")
    elif success_rate >= 66:
        print("⚠️  TEST PARTIAL - Most medicines found")
    else:
        print("❌ TEST FAILED - Many medicines missing")

if __name__ == "__main__":
    test_prescription_extraction()