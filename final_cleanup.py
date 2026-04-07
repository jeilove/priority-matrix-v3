import cv2
import numpy as np
import os
from PIL import Image

def final_point_cleanup(original_path, target_path, fix_black=False):
    print(f"Final Point Cleanup for {target_path} from {original_path}...")
    
    with Image.open(original_path) as pil_img:
        img_raw = np.array(pil_img)
        # Ensure RGBA
        if img_raw.shape[2] == 3:
            img = cv2.cvtColor(img_raw, cv2.COLOR_RGB2BGRA)
        else:
            img = cv2.cvtColor(img_raw, cv2.COLOR_RGBA2BGRA)

    h, w = img.shape[:2]
    
    # 1. Background Mask using Flood Fill from corners
    # We must use a contiguous copy for floodFill
    img_bgr = img[:,:,:3].copy()
    mask = np.zeros((h + 2, w + 2), np.uint8)
    seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    
    for seed in seeds:
        cv2.floodFill(img_bgr, mask, seed, (0, 0, 0), (25, 25, 25), (25, 25, 25), flags=8 | cv2.FLOODFILL_MASK_ONLY)
    
    bg_mask = mask[1:-1, 1:-1]
    
    # 2. Assign Alpha
    img[:,:,3] = 255 # Reset to opaque internally
    img[bg_mask != 0, 3] = 0 # Corners/Background to transparent

    # 3. Special handling for BLACK residues (e.g. for Q4/Yo)
    if fix_black:
        # User mentioned black circle in top-right
        # Let's target very dark pixels (RGB < 100) specifically in the OUTER areas
        border = 25
        # Search pixels with RGB < 100 in border region
        dark_pixels = (img[:,:,0] < 100) & (img[:,:,1] < 100) & (img[:,:,2] < 100)
        
        # Only apply in border
        border_mask = np.zeros((h, w), dtype=np.bool_)
        border_mask[:border, :] = True
        border_mask[h-border:, :] = True
        border_mask[:, :border] = True
        border_mask[:, w-border:] = True
        
        # Combine
        img[dark_pixels & border_mask, 3] = 0

    # 4. Refinement
    kernel = np.ones((2,2), np.uint8)
    img[:,:,3] = cv2.erode(img[:,:,3], kernel, iterations=1)
    
    cv2.imwrite(target_path, img)

# Limited mapping only for PROBLEMATIC icons
mapping = {
    # "아이콘/해 아이콘.png": "public/q1.png", # SKIP AS PER USER
    "아이콘/바 아이콘.png": "public/q2.png", # Problematic
    # "아이콘/줘 아이콘.png": "public/q3.png", # SKIP AS PER USER
    "아이콘/요 아이콘.png": "public/q4.png", # Problematic (Black circle)
    "아이콘/해줘바요 아이콘.png": "public/logo.png" # Problematic (Checkerboard)
}

for src, dst in mapping.items():
    if os.path.exists(src):
        fix_black = ("요" in src or "logo" in src)
        final_point_cleanup(src, dst, fix_black=fix_black)
