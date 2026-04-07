import cv2
import numpy as np
import os
from PIL import Image

def hybrid_cleanup(original_path, target_path, is_logo=False):
    print(f"Hybrid Cleanup for {target_path} from {original_path}...")
    
    with Image.open(original_path) as pil_img:
        img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGBA2BGRA)

    h, w = img.shape[:2]
    img[:,:,3] = 255
    
    img_bgr = img[:,:,:3].copy()
    mask = np.zeros((h + 2, w + 2), np.uint8)
    seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    
    # Corrected tuple assignment
    diff_val = (25, 25, 25) if is_logo else (15, 15, 15)
    
    for seed in seeds:
        cv2.floodFill(img_bgr, mask, seed, (0, 0, 0), diff_val, diff_val, flags=8 | cv2.FLOODFILL_MASK_ONLY)
    
    bg_mask = mask[1:-1, 1:-1]
    img[bg_mask != 0, 3] = 0
    
    if not is_logo:
        lower = np.array([218, 218, 218])
        upper = np.array([228, 228, 228])
        extra_mask = cv2.inRange(img[:,:,:3], lower, upper)
        border = 20
        border_mask = np.zeros((h, w), dtype=np.uint8)
        border_mask[:border, :] = 1
        border_mask[h-border:, :] = 1
        border_mask[:, :border] = 1
        border_mask[:, w-border:] = 1
        img[(extra_mask != 0) & (border_mask != 0), 3] = 0

    cv2.imwrite(target_path, img)

target_mapping = {
    "아이콘/해줘바요 아이콘.png": ("public/logo.png", True),
    "아이콘/바 아이콘.png": ("public/q2.png", False)
}

for src, (dst, is_logo) in target_mapping.items():
    if os.path.exists(src):
        hybrid_cleanup(src, dst, is_logo=is_logo)
