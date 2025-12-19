#!/usr/bin/env python3
"""
Stress Detector - Launcher Script
Workaround for TensorFlow/Keras Windows compatibility issues
"""

import os
import sys
import subprocess

# Set environment variables to suppress TensorFlow issues
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'

# Suppress the inspect.py issue
os.environ['PYTHONWARNINGS'] = 'ignore::DeprecationWarning'

print("="*80)
print("Stress Detector Launcher")
print("="*80)
print()

if len(sys.argv) > 1 and sys.argv[1] == '--run-direct':
    # Run the main script directly
    print("Running main.py...")
    from main import main
    try:
        success = main()
        if success:
            print("\n✅ Execution completed successfully!")
        else:
            print("\n❌ Execution failed!")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n⏹️ Execution interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
else:
    # Show usage
    print("Usage:")
    print(f"  {sys.argv[0]} --run-direct [main.py options]")
    print()
    print("Example:")
    print(f"  {sys.argv[0]} --run-direct --test")
    print(f"  {sys.argv[0]} --run-direct --subjects 3 --epochs 10")
    print()
    print("Or run directly:")
    print("  python main.py [options]")
    print()
