#!/usr/bin/env python3
"""
Test complete prescription processing pipeline
"""

import sys
import os
sys.path.append('main medicine_ocr updated')

# Mock the database and Flask components for testing
class MockMedicine:
    def __init__(self, name, available=True, quantity=10, price=100.0):
        self.medicine_name = name
        self.available = available
        self.quantity = quantity
        self.price = price

# Mock database query
class MockQuery:
    def with_entities(self, field):
        return self
    
    def distinct(self):
        return self
    
    def all(self):
        # Return some common medicine names
        return [
            MockMedicine('ITRACOE'),
            MockMedicine('ONABET'), 
            MockMedicine('LACTACYD'),
            MockMedicine('DOLO-650'),
            MockMedicine('PARACETAMOL'),
        ]

# Mock Medicine class
class Medicine:
    query = MockQuery()
    medicine_name = 'medicine_name'

# Add to sys.modules to mock the import
sys.modules['models'] = type('MockModule', (), {'Medicine': Medicine})()

from free_ocr import extract_medicines_from_prescription_free

def test_complete_prescription_processing():
    """Test the complete prescription processing pipeline"""
    
    print("=== Complete Prescription Processing Test ===")
    
    # Simulate image content (in real app this would be actual image bytes)
    # For testing, we'll simulate the OCR text extraction result
    
    # Mock known medicines from database
    known_medicines = ['ITRACOE', 'ONABET', 'LACTACYD', 'DOLO-650', 'PARACETAMOL']
    
    # Simulate prescription text that would be extracted by OCR
    prescription_text = """
    Kinder Women's Hospital and Fertility Centre
    PRESCRIPTION
    
    PATIENT ID: KHB111175                    DATE: 14-10-2024 09:38:11
    PATIENT NAME: Ms SHREYA GOENKA           CONSULTANT: Dr LAKSHMI DEVI M
    
    # Drug Name                    Dosage  Route  Frequency/Instruction        Duration
    
    ITRACOE 200 MG CAPS          1 NOS   ORAL   Once Daily (Night)           10
    (ITRACONAZOLE 200 MG)
    
    ONABET CREAM 30GM            1 MG    Topical  Twice Daily (Morning and Night)  1
    (SERTACONAZOLE)
    
    LACTACYD LOTION 100 ML       1 ML    Topical  Once Daily (Night)           1
    (LAURYL GLUCOSIDE + LACTIC ACID)
    
    Dr. LAKSHMI DEVI M
    END OF PRESCRIPTION
    """
    
    # Test the extraction
    from free_ocr import extract_medicine_names_from_text
    medicines = extract_medicine_names_from_text(prescription_text, known_medicines)
    
    print(f"Extracted medicines: {medicines}")
    
    # Simulate availability check
    def mock_check_availability(med_name):
        # Simulate database lookup
        available_meds = {
            'ITRACOE': {'available': True, 'quantity': 15, 'price': 250.0},
            'ONABET': {'available': True, 'quantity': 8, 'price': 180.0},
            'LACTACYD': {'available': False, 'quantity': 0, 'price': 0.0},
        }
        
        for available_med, info in available_meds.items():
            if available_med.upper() in med_name.upper():
                return {
                    'name': med_name,
                    'available': info['available'],
                    'quantity': info['quantity'],
                    'price': info['price']
                }
        
        return {
            'name': med_name,
            'available': False,
            'quantity': 0,
            'price': 0.0
        }
    
    # Check availability for each medicine
    results = []
    for med_name in medicines:
        availability = mock_check_availability(med_name)
        results.append(availability)
    
    print(f"\n=== Availability Results ===")
    for result in results:
        status = "✅ Available" if result['available'] else "❌ Not Available"
        print(f"{result['name']}: {status} (Qty: {result['quantity']}, Price: ₹{result['price']})")
    
    # Expected results
    expected_medicines = ['ITRACOE', 'ONABET', 'LACTACYD']
    found_medicines = [med for med in medicines if any(exp.upper() in med.upper() for exp in expected_medicines)]
    
    success_rate = len(found_medicines) / len(expected_medicines) * 100
    print(f"\n=== Test Results ===")
    print(f"Expected medicines: {expected_medicines}")
    print(f"Found medicines: {found_medicines}")
    print(f"Success rate: {success_rate:.1f}%")
    
    if success_rate >= 100:
        print("✅ PRESCRIPTION PROCESSING TEST PASSED!")
        return True
    else:
        print("❌ PRESCRIPTION PROCESSING TEST FAILED!")
        return False

if __name__ == "__main__":
    test_complete_prescription_processing()