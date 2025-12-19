# src/split_data.py
import os, shutil, random
from pathlib import Path
from sklearn.model_selection import train_test_split

SOURCE_DIR = "plant_recognizer"  # change if needed
OUT_DIR = "data"   # will create data/train, data/val, data/test
TRAIN_RATIO = 0.7
VAL_RATIO = 0.15
TEST_RATIO = 0.15
RANDOM_SEED = 42

def make_dirs_for_class(base_dir, cls):
    for split in ["train", "val", "test"]:
        d = Path(base_dir) / split / cls
        d.mkdir(parents=True, exist_ok=True)

def copy_files(filepaths, dest_dir):
    for src in filepaths:
        dest = Path(dest_dir) / Path(src).name
        shutil.copy2(src, dest)

def main():
    random.seed(RANDOM_SEED)
    src = Path(SOURCE_DIR)
    out = Path(OUT_DIR)
    for cls in sorted([d.name for d in src.iterdir() if d.is_dir()]):
        cls_dir = src / cls
        files = [str(p) for p in cls_dir.iterdir() if p.suffix.lower() in {'.jpg','.jpeg','.png','.bmp'}]
        if not files:
            continue
        train_and_rest, test_files = train_test_split(files, test_size=TEST_RATIO, random_state=RANDOM_SEED, stratify=None)
        # compute val fraction relative to train_and_rest
        val_fraction = VAL_RATIO / (TRAIN_RATIO + VAL_RATIO)
        train_files, val_files = train_test_split(train_and_rest, test_size=val_fraction, random_state=RANDOM_SEED, stratify=None)

        make_dirs_for_class(out, cls)
        copy_files(train_files, out / "train" / cls)
        copy_files(val_files, out / "val" / cls)
        copy_files(test_files, out / "test" / cls)

    print("Done. Created folders under", out.resolve())

if __name__ == "__main__":
    main()
