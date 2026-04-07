import cv2
import numpy as np
import os
from PIL import Image

def restore_square_from_original(original_path, target_path):
    print(f"Restoring {target_path} (Square) from {original_path}...")
    
    # Read original with PIL
    with Image.open(original_path) as pil_img:
        img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGBA2BGRA)

    h, w = img.shape[:2]
    
    # In this version, WE DO NOT MASK WITH CIRCLE.
    # We only remove the background color.
    
    # Target Background: Light Gray (223, 223, 223)
    bgr = img[:,:,:3]
    lower = np.array([210, 210, 210])
    upper = np.array([245, 245, 245]) # Wider range for light gray noise
    
    # Add another range for PURE BLACK if there were black fragments
    lower_black = np.array([0, 0, 0])
    upper_black = np.array([30, 30, 30])
    
    gray_mask = cv2.inRange(bgr, lower, upper)
    black_mask = cv2.inRange(bgr, lower_black, upper_black)
    
    # Combined Mask
    combined_mask = cv2.bitwise_or(gray_mask, black_mask)
    
    img[:,:,3] = 255 # Start with full alpha
    img[combined_mask != 0, 3] = 0 # Make background and black fragments transparent
    
    # Optional edge cleanup (very light)
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
        restore_square_from_original(src, dst)
    else:
        print(f"Error: {src} not found!")
