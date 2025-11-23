import numpy as np
from PIL import Image
import cv2
from typing import Tuple, Dict, Any


def _to_rgb(img: Image.Image) -> Image.Image:
    """Ensure PIL image is in RGB mode."""
    if img.mode != "RGB":
        return img.convert("RGB")
    return img


def compute_heatmap(original: Image.Image, watermarked: Image.Image) -> Image.Image:
    """Return a heatmap the SAME SIZE as `original`, highlighting changed regions.

    - Converts both images to grayscale.
    - Resizes watermarked to match original if needed.
    - Computes absolute difference and normalises it.
    - Uses an OpenCV colormap for visibility.
    """
    original = _to_rgb(original)
    watermarked = _to_rgb(watermarked)

    ow, oh = original.size
    ww, wh = watermarked.size

    if (ow, oh) != (ww, wh):
        watermarked = watermarked.resize((ow, oh))

    orig_gray = np.array(original.convert("L"), dtype=np.float32)
    wm_gray = np.array(watermarked.convert("L"), dtype=np.float32)

    diff = np.abs(wm_gray - orig_gray)
    max_val = float(diff.max())
    if max_val > 0:
        scaled = (diff / max_val * 255.0).astype("uint8")
        diff_norm = cv2.equalizeHist(scaled)
    else:
        diff_norm = np.zeros_like(diff, dtype="uint8")

    heat_bgr = cv2.applyColorMap(diff_norm, cv2.COLORMAP_JET)
    heat_rgb = cv2.cvtColor(heat_bgr, cv2.COLOR_BGR2RGB)
    return Image.fromarray(heat_rgb, mode="RGB")


def side_by_side(left: Image.Image, right: Image.Image) -> Image.Image:
    """Return a side-by-side RGB image with both halves the same height.

    - Resizes `right` to match `left`'s height while preserving aspect ratio.
    """
    left = _to_rgb(left)
    right = _to_rgb(right)

    lw, lh = left.size
    rw, rh = right.size

    if rh != lh:
        new_rw = int(rw * (lh / float(rh)))
        if new_rw <= 0:
            new_rw = 1
        right = right.resize((new_rw, lh))
        rw, rh = right.size

    canvas = Image.new("RGB", (lw + rw, lh), (0, 0, 0))
    canvas.paste(left, (0, 0))
    canvas.paste(right, (lw, 0))
    return canvas


def create_watermark_location_map(
    img_shape: Tuple[int, int],
    metadata: Dict[str, Any],
    block_size: int = 8,
    band: str = "LH",
    wavelet: str = "haar"
) -> Image.Image:
    """Create a visualization showing watermark block locations on a black background.
    
    Args:
        img_shape: (height, width) of the original image
        metadata: Metadata dict from embed() containing params and message info
        block_size: Size of blocks used for embedding
        band: DWT band used ("LH" or "HL")
        wavelet: Wavelet used for DWT
        
    Returns:
        PIL Image with colored patches showing watermark locations
    """
    import pywt
    
    H, W = img_shape
    gray = np.zeros((H, W), dtype=np.float32)
    
    # Perform DWT to get band dimensions
    LL, (LH, HL, HH) = pywt.dwt2(gray, wavelet)
    band_data = LH if band == "LH" else HL
    bh, bw = band_data.shape
    
    # Calculate block grid
    nbh = bh // block_size
    nbw = bw // block_size
    num_blocks = nbh * nbw
    
    # Get block assignments from metadata
    params = metadata.get("params", {})
    redundancy = params.get("redundancy", 3)
    message_len_bytes = metadata.get("message_len_bytes", 0)
    message_bits = message_len_bytes * 8
    
    # Recreate the same random permutation
    block_indices = np.arange(num_blocks)
    np.random.seed(params.get("perm_seed", 0))
    np.random.shuffle(block_indices)
    
    # Find which blocks are used
    used_blocks = set()
    idx = 0
    for bit_idx in range(message_bits):
        for _ in range(redundancy):
            if idx >= num_blocks:
                break
            used_blocks.add(block_indices[idx])
            idx += 1
    
    # Create visualization: map DWT band blocks back to image coordinates
    # DWT bands are approximately half the size of the original image
    # Scale factor from DWT band to original image (approximately 2x)
    scale_h = H / bh if bh > 0 else 2.0
    scale_w = W / bw if bw > 0 else 2.0
    
    # Create colored patches on black background
    vis = np.zeros((H, W, 3), dtype=np.uint8)
    
    # Use different colors for different bit positions (cycling through colors)
    colors = [
        [255, 0, 0],      # Red
        [0, 255, 0],      # Green
        [0, 0, 255],      # Blue
        [255, 255, 0],    # Yellow
        [255, 0, 255],    # Magenta
        [0, 255, 255],    # Cyan
        [255, 128, 0],    # Orange
        [128, 0, 255],    # Purple
    ]
    
    idx = 0
    for bit_idx in range(message_bits):
        color = colors[bit_idx % len(colors)]
        for _ in range(redundancy):
            if idx >= num_blocks:
                break
            block_id = block_indices[idx]
            
            # Calculate block position in DWT band
            by_dwt = (block_id // nbw) * block_size
            bx_dwt = (block_id % nbw) * block_size
            
            # Map to original image coordinates (approximate)
            y_start = int(by_dwt * scale_h)
            y_end = int((by_dwt + block_size) * scale_h)
            x_start = int(bx_dwt * scale_w)
            x_end = int((bx_dwt + block_size) * scale_w)
            
            # Ensure within bounds
            y_start = max(0, min(y_start, H - 1))
            y_end = max(y_start + 1, min(y_end, H))
            x_start = max(0, min(x_start, W - 1))
            x_end = max(x_start + 1, min(x_end, W))
            
            # Draw colored patch (with some transparency effect)
            vis[y_start:y_end, x_start:x_end] = color
            idx += 1
    
    return Image.fromarray(vis, mode="RGB")


def triple_view(original: Image.Image, watermarked: Image.Image, location_map: Image.Image) -> Image.Image:
    """Create a three-panel view: original, watermarked, and location map.
    
    All three images are resized to the same height and placed side by side.
    """
    original = _to_rgb(original)
    watermarked = _to_rgb(watermarked)
    location_map = _to_rgb(location_map)
    
    # Get target height (use original's height)
    target_h = original.size[1]
    
    # Resize all to same height
    def resize_to_height(img, height):
        w, h = img.size
        new_w = int(w * (height / float(h)))
        return img.resize((new_w, height))
    
    orig_resized = resize_to_height(original, target_h)
    wm_resized = resize_to_height(watermarked, target_h)
    loc_resized = resize_to_height(location_map, target_h)
    
    # Create canvas
    total_w = orig_resized.size[0] + wm_resized.size[0] + loc_resized.size[0]
    canvas = Image.new("RGB", (total_w, target_h), (0, 0, 0))
    
    # Paste images
    x_offset = 0
    canvas.paste(orig_resized, (x_offset, 0))
    x_offset += orig_resized.size[0]
    canvas.paste(wm_resized, (x_offset, 0))
    x_offset += wm_resized.size[0]
    canvas.paste(loc_resized, (x_offset, 0))
    
    return canvas
