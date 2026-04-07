import cv2
import numpy as np
import os
from PIL import Image

def rebuild_from_original(original_path, target_path):
    print(f"Rebuilding {target_path} from {original_path}...")
    
    # Read original with PIL (handles Hangeul better)
    with Image.open(original_path) as pil_img:
        img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGBA2BGRA)

    h, w = img.shape[:2]
    
    # Create empty alpha channel
    alpha = np.zeros((h, w), dtype=np.uint8)
    
    # 1. Circle Mask: Keep only the center circle area
    # Usually icons are roughly central.
    center = (w // 2, h // 2)
    radius = min(h, w) // 2 - 5 # 5% margin
    cv2.circle(alpha, center, radius, 255, -1)
    
    # 2. Color Mask: Remove the light gray background (223, 223, 223)
    # Convert to BGR for color range
    bgr = img[:,:,:3]
    lower = np.array([210, 210, 210])
    upper = np.array([235, 235, 235])
    
    # Invert the gray area mask
    gray_mask = cv2.inRange(bgr, lower, upper)
    alpha[gray_mask != 0] = 0
    
    # Apply alpha to img
    img[:,:,3] = alpha
    
    # 3. Final cleanup: Erosion of alpha to remove any fringe
    kernel = np.ones((3,3), np.uint8)
    img[:,:,3] = cv2.erode(img[:,:,3], kernel, iterations=1)
    
    cv2.imwrite(target_path, img)

# Map original files to public targets
mapping = {
    "아이콘/해 아이콘.png": "public/q1.png",
    "아이콘/바 아이콘.png": "public/q2.png", 
    "아이콘/줘 아이콘.png": "public/q3.png",
    "아이콘/요 아이콘.png": "public/q4.png",
    "아이콘/해줘바요 아이콘.png": "public/logo.png"
}

for src, dst in mapping.items():
    if os.path.exists(src):
        rebuild_from_original(src, dst)
    else:
        print(f"Error: {src} not found!")
