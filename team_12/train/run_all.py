"""
Master script to run the entire ML pipeline
"""
import sys
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent

def run_script(script_name):
    """Run a Python script and handle errors"""
    script_path = BASE_DIR / "train" / script_name
    print(f"\n{'='*60}")
    print(f"Running: {script_name}")
    print(f"{'='*60}\n")
    
    try:
        result = subprocess.run(
            [sys.executable, str(script_path)],
            check=True,
            cwd=str(BASE_DIR)
        )
        print(f"\n✓ {script_name} completed successfully\n")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n✗ {script_name} failed with error: {e}\n")
        return False
    except Exception as e:
        print(f"\n✗ Error running {script_name}: {e}\n")
        return False

def main():
    """Run the entire ML pipeline"""
    print("\n" + "="*60)
    print("SEPSIS DETECTION - ML PIPELINE")
    print("="*60 + "\n")
    
    scripts = [
        "download_data.py",
        "preprocess.py",
        "train_original_model.py",
        "train_vae.py",
        "generate_synthetic_data.py",
        "train_combined_model.py"
    ]
    
    for script in scripts:
        success = run_script(script)
        if not success:
            print(f"\n⚠ Warning: {script} failed, but continuing...\n")
    
    print("\n" + "="*60)
    print("ML PIPELINE COMPLETE!")
    print("="*60 + "\n")
    print("Models saved in: ml/models/")
    print("You can now start the backend server.\n")

if __name__ == "__main__":
    main()


