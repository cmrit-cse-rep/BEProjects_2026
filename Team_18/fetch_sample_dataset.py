from __future__ import annotations

import hashlib
import mimetypes
import os
import shutil
import sys
from pathlib import Path
from typing import Iterable, Tuple

import requests


LANDSLIDE_URLS = [
    # Public domain/CC images from Wikimedia Commons (availability may vary)
    "https://upload.wikimedia.org/wikipedia/commons/1/1d/San_Clemente_landslide.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/5f/Small_landslide_in_Kashmir.jpg",
]

NOLANDSLIDE_URLS = [
    # Hills/green slopes/valleys without obvious slides
    "https://upload.wikimedia.org/wikipedia/commons/3/3b/Green_hills_%28Unsplash%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/47/Meadow_in_mountains.jpg",
]


def ensure_dirs(root: Path) -> Tuple[Path, Path]:
    landslide = root / "Landslide"
    nolandslide = root / "NoLandslide"
    landslide.mkdir(parents=True, exist_ok=True)
    nolandslide.mkdir(parents=True, exist_ok=True)
    return landslide, nolandslide


def filename_for(url: str, content_type: str | None) -> str:
    h = hashlib.sha256(url.encode("utf-8")).hexdigest()[:12]
    ext = mimetypes.guess_extension(content_type or "") or ".jpg"
    # some servers return .jpe extension, prefer .jpg
    if ext == ".jpe":
        ext = ".jpg"
    return f"{h}{ext}"


def download_many(urls: Iterable[str], out_dir: Path) -> int:
    saved = 0
    for url in urls:
        try:
            resp = requests.get(url, timeout=20, headers={"User-Agent": "landslide-demo/1.0"})
            if resp.status_code != 200:
                print(f"skip {url} -> HTTP {resp.status_code}")
                continue
            ct = resp.headers.get("content-type", "").lower()
            if "image" not in ct:
                print(f"skip {url} -> not an image ({ct})")
                continue
            name = filename_for(url, ct)
            path = out_dir / name
            with open(path, "wb") as f:
                f.write(resp.content)
            saved += 1
            print(f"saved {path}")
        except Exception as exc:
            print(f"skip {url} -> {exc}")
    return saved


def seed_with_local_samples(repo_root: Path, dataset_root: Path) -> None:
    # Use bundled sample images to ensure non-empty dataset
    samples = [
        (repo_root / "brown_edges.jpg", dataset_root / "Landslide" / "sample_brown_edges.jpg"),
        (repo_root / "flat_green.jpg", dataset_root / "NoLandslide" / "sample_flat_green.jpg"),
        (repo_root / "dummy.jpg", dataset_root / "NoLandslide" / "sample_dummy.jpg"),
    ]
    for src, dst in samples:
        if src.exists():
            dst.parent.mkdir(parents=True, exist_ok=True)
            try:
                shutil.copyfile(src, dst)
                print(f"copied {src.name} -> {dst}")
            except Exception as exc:
                print(f"skip copy {src} -> {exc}")


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    dataset_root = Path(os.environ.get("IMAGE_DATASET_DIR", repo_root / "dataset"))
    landslide_dir, nolandslide_dir = ensure_dirs(dataset_root)

    seed_with_local_samples(repo_root, dataset_root)

    print("downloading Landslide images…")
    dl1 = download_many(LANDSLIDE_URLS, landslide_dir)
    print("downloading NoLandslide images…")
    dl2 = download_many(NOLANDSLIDE_URLS, nolandslide_dir)

    total = dl1 + dl2
    print(f"done. downloaded {total} images into {dataset_root}")
    if total == 0:
        print("warning: no remote images downloaded; local samples only.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)


