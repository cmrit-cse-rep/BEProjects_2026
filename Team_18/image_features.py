from __future__ import annotations

from typing import List

import numpy as np
from PIL import Image, ImageFilter, ImageOps


def _ensure_rgb(img: Image.Image) -> Image.Image:
    if img.mode != "RGB":
        return img.convert("RGB")
    return img


def extract_image_features(img: Image.Image) -> List[float]:
    """Extract richer features for landslide detection heuristics/ML.

    Returns list in order:
    [0] mean_r, [1] mean_g, [2] mean_b,
    [3] std_r, [4] std_g, [5] std_b,
    [6] edge_density,
    [7] mean_s, [8] mean_v,
    [9] gray_entropy,
    [10] laplacian_variance,
    [11] diagonal_edge_ratio,
    [12] grad_mag_mean,
    [13] grad_mag_std,
    [14] green_fraction,
    [15] blue_fraction,
    [16] brown_fraction,
    [17] brown_hue_fraction
    """
    img = _ensure_rgb(img).resize((256, 256))
    img = ImageOps.autocontrast(img, cutoff=2)
    arr = np.asarray(img, dtype=np.float32)
    h, w, _ = arr.shape
    flat = arr.reshape(-1, 3)
    means = flat.mean(axis=0)
    stds = flat.std(axis=0)

    # HSV channels (true hue from PIL HSV)
    hsv = np.asarray(img.convert("HSV"), dtype=np.float32)
    hch = hsv[:, :, 0]  # 0..255 ~ 0..360deg
    sch = hsv[:, :, 1] / 255.0
    vch = hsv[:, :, 2] / 255.0

    # Also compute S,V from RGB for robustness (not used for hue)
    rgb01 = arr / 255.0
    maxc = rgb01.max(axis=2)
    minc = rgb01.min(axis=2)
    v = maxc
    s = np.where(maxc == 0, 0.0, (maxc - minc) / np.maximum(maxc, 1e-6))
    mean_s = float(s.mean())
    mean_v = float(v.mean())

    # Edges and edge density
    edges = img.filter(ImageFilter.FIND_EDGES).convert("L")
    edges_arr = np.asarray(edges, dtype=np.float32) / 255.0
    edge_density = float((edges_arr > 0.25).mean())

    # Grayscale for gradients
    gray = (0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2])

    # Entropy of grayscale histogram
    hist, _ = np.histogram(np.clip(gray, 0, 255), bins=256, range=(0, 255), density=False)
    p = hist.astype(np.float64)
    p_sum = p.sum()
    if p_sum > 0:
        p /= p_sum
        nz = p[p > 0]
        gray_entropy = float(-(nz * np.log2(nz)).sum())
    else:
        gray_entropy = 0.0

    # Laplacian variance (texture/focus measure)
    # 3x3 Laplacian kernel
    kernel = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], dtype=np.float32)
    lap = _convolve2d(gray, kernel)
    lap_var = float(lap.var())

    # Sobel gradients for magnitude/orientation
    sobel_x = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], dtype=np.float32)
    sobel_y = np.array([[-1, -2, -1], [0, 0, 0], [1, 2, 1]], dtype=np.float32)
    gx = _convolve2d(gray, sobel_x)
    gy = _convolve2d(gray, sobel_y)
    mag = np.hypot(gx, gy)
    ang = (np.degrees(np.arctan2(gy, gx)) + 180.0) % 180.0  # 0..180
    grad_mag_mean = float(mag.mean())
    grad_mag_std = float(mag.std())
    # Diagonal edges: near 45 or 135 degrees
    diag_mask = ((ang >= 25.0) & (ang <= 65.0)) | ((ang >= 115.0) & (ang <= 155.0))
    # Consider only strong gradients for ratio
    thr = np.percentile(mag, 75)
    strong = mag > max(thr, 1e-6)
    denom = float(strong.sum()) if strong.sum() > 0 else 1.0
    diagonal_edge_ratio = float((diag_mask & strong).sum()) / denom

    # Color fractions (simple channel-dominance heuristics)
    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]
    # thresholds tuned lightly; values in 0..255
    green_mask = (g > r + 10) & (g > b + 10) & (s > 0.20)
    blue_mask = (b > r + 10) & (b > g + 10) & (v > 0.40)
    # brown: red slightly >= green, both >> blue, medium S and V
    brown_mask = (r >= g - 10) & (r > b + 20) & (g > b + 10) & (s > 0.15) & (s < 0.85) & (v > 0.15) & (v < 0.9)
    # Hue-based brown (approx 10..45 degrees)
    h_deg = hch * (360.0 / 255.0)
    brown_hue_mask = (h_deg >= 10.0) & (h_deg <= 45.0) & (sch > 0.20) & (vch > 0.15) & (vch < 0.9)

    denom_px = float(h * w)
    green_fraction = float(green_mask.sum()) / denom_px
    blue_fraction = float(blue_mask.sum()) / denom_px
    brown_fraction = float(brown_mask.sum()) / denom_px
    brown_hue_fraction = float(brown_hue_mask.sum()) / denom_px

    return [
        float(means[0]), float(means[1]), float(means[2]),
        float(stds[0]), float(stds[1]), float(stds[2]),
        float(edge_density),
        float(mean_s), float(mean_v),
        float(gray_entropy),
        float(lap_var),
        float(diagonal_edge_ratio),
        float(grad_mag_mean),
        float(grad_mag_std),
        float(green_fraction),
        float(blue_fraction),
        float(brown_fraction),
        float(brown_hue_fraction),
    ]



def _convolve2d(src: np.ndarray, kernel: np.ndarray) -> np.ndarray:
    """Simple 2D convolution with zero padding for small kernels.
    src: 2D array, kernel: 2D array
    """
    kh, kw = kernel.shape
    pad_h = kh // 2
    pad_w = kw // 2
    src_p = np.pad(src, ((pad_h, pad_h), (pad_w, pad_w)), mode="edge")
    out = np.zeros_like(src, dtype=np.float32)
    for i in range(out.shape[0]):
        for j in range(out.shape[1]):
            region = src_p[i:i+kh, j:j+kw]
            out[i, j] = float(np.sum(region * kernel))
    return out


