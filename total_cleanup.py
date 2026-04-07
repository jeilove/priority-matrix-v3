import cv2
import numpy as np
import os
from PIL import Image

def total_cleanup_from_original(original_path, target_path):
    print(f"Total Cleanup for {target_path} from {original_path}...")
    
    with Image.open(original_path) as pil_img:
        img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGBA2BGRA)

    h, w = img.shape[:2]
    
    # We want to keep: The colorful rounded boxes and the white text.
    # We want to remove: The background (checkerboard/gray/black).
    
    # Strategy: Sampling the background from the corners
    # The corner pixel was (223, 223, 223).
    # But if there's a checkerboard, we need to target white (255) and gray (~223).
    
    bgr = img[:,:,:3]
    
    # 1. Mask for White-ish (Checkerboard part 1)
    lower_white = np.array([210, 210, 210])
    upper_white = np.array([255, 255, 255])
    white_mask = cv2.inRange(bgr, lower_white, upper_white)
    
    # 2. Mask for Black-ish / Deep Gray (Residues and Checkerboard part 2)
    lower_dark = np.array([0, 0, 0])
    upper_dark = np.array([80, 80, 80]) # Higher threshold to catch residues
    dark_mask = cv2.inRange(bgr, lower_dark, upper_dark)
    
    # 3. Combined mask for background removal
    background_mask = cv2.bitwise_or(white_mask, dark_mask)
    
    # Start with full alpha
    img[:,:,3] = 255
    # Apply transparency to background
    img[background_mask != 0, 3] = 0
    
    # 4. Refine edges (Erosion followed by Dilation or just Erosion)
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
        total_cleanup_from_original(src, dst)
