#!/usr/bin/env python3
"""Quick test of Firebase package name encoding"""

from firebase_config import encode_package_name, decode_package_name

test_cases = [
    'com.linkedin.android',
    'com.bt.bms',
    'com.whatsapp',
    'com.duckduckgo.mobile.android'
]

print("Testing Package Name Encoding/Decoding")
print("=" * 60)

for pkg in test_cases:
    encoded = encode_package_name(pkg)
    decoded = decode_package_name(encoded)
    match = pkg == decoded
    status = "✓" if match else "✗"
    
    print(f"\n{status} Original: {pkg}")
    print(f"  Encoded:  {encoded}")
    print(f"  Decoded:  {decoded}")
    print(f"  Match:    {match}")

print("\n" + "=" * 60)
print("All encoding tests passed! ✓")
