import cv2
import numpy as np
import os
from PIL import Image

def flood_fill_cleanup(original_path, target_path):
    print(f"Intelligent Flood Fill Cleanup for {target_path} from {original_path}...")
    
    with Image.open(original_path) as pil_img:
        # Convert to BGRA
        img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGBA2BGRA)

    h, w = img.shape[:2]
    
    # We will create a mask starting from the 4 corners
    # Background assumes Light Gray (223) or White (255)
    
    # Combine original alpha if present
    if img.shape[2] == 4:
        alpha = img[:,:,3].copy()
    else:
        alpha = np.ones((h,w), dtype=np.uint8) * 255
    
    # 1. Flood Fill from 4 Corners to detect background
    # We use a bit of tolerance (loDiff, upDiff) to catch the checkerboard
    mask = np.zeros((h + 2, w + 2), np.uint8)
    
    # Define seeds (corners)
    seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    
    # Background color is light gray (221~223) or white (255)
    # We'll do multiple fills if needed or a wide tolerance
    for seed in seeds:
        cv2.floodFill(img[:,:,:3], mask, seed, (0, 255, 0), (20, 20, 20), (20, 20, 20), flags=8 | cv2.FLOODFILL_MASK_ONLY)
    
    # The 'mask' now has background (filled with 1)
    # We offset by 1 because floodFill mask is larger
    bg_mask = mask[1:-1, 1:-1]
    
    # Also catch the DARK residues if they are at the edges
    # We do another flood fill but with a focus on dark colors if the corner was dark
    # But usually background is light.
    
    # 2. Aggressive Black-ish removal near edges (but not inside)
    # If the user saw a black circle in Q4, it's likely connected to the background or very outer.
    # We take any dark pixels (RGB < 100) that are also in our detected background mask?
    # Actually if they are NOT icons, a wide range of black removal is okay for outer 10% area.
    border = 20
    # Top edge
    img[0:border, :, 3][ (img[0:border, :, 0] < 100) & (img[0:border, :, 1] < 100) & (img[0:border, :, 2] < 100) ] = 0
    # Bottom
    img[h-border:h, :, 3][ (img[h-border:h, :, 0] < 100) & (img[h-border:h, :, 1] < 100) & (img[h-border:h, :, 2] < 100) ] = 0
    # Left
    img[:, 0:border, 3][ (img[:, 0:border, 0] < 100) & (img[:, 0:border, 1] < 100) & (img[:, 0:border, 2] < 100) ] = 0
    # Right
    img[:, w-border:w, 3][ (img[:, w-border:w, 0] < 100) & (img[:, w-border:w, 1] < 100) & (img[:, w-border:w, 2] < 100) ] = 0

    # 3. Final Step: Apply the Flood Fill mask to transparency
    img[bg_mask != 0, 3] = 0
    
    # Erosion to clean up fringes
    kernel = np.ones((2,2), np.uint8)
    img[:,:,3] = cv2.erode(img[:,:,3], kernel, iterations=1)
    
    cv2.imwrite(target_path, img)

mapping = {
    "아이콘/해 아이콘.png": "public/q1.png",
    "아이콘/바 아이콘.png": "public/q2.png", 
    "아이콘/줘 아이콘.png": "public/q3.png",
    "아이콘/요 아이콘.png": "public/q4.png",
    "아이콘/해줘바요 아이콘.png": "public/logo.png"
}

for src, dst in mapping.items():
    if os.path.exists(src):
        flood_fill_cleanup(src, dst)
