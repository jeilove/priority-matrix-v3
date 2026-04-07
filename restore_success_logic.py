import cv2
import numpy as np
import os
from PIL import Image

def restore_successful_yo_logic(original_path, target_path):
    print(f"Restoring Success Logic (Step 754) for {target_path}...")
    
    # Read original with PIL for Hangeul support
    with Image.open(original_path) as pil_img:
        img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGBA2BGRA)

    h, w = img.shape[:2]
    img[:,:,3] = 255 # Reset to full opaque
    
    # EXACT LOGIC FROM STEP 754
    # 1. Light Gray (223) Removal
    target_bg = [223, 223, 223]
    diff = 5 # Very strict tolerance from Step 754
    lower = np.array([target_bg[0]-diff, target_bg[1]-diff, target_bg[2]-diff])
    upper = np.array([target_bg[0]+diff, target_bg[1]+diff, target_bg[2]+diff])
    
    mask = cv2.inRange(img[:,:,:3], lower, upper)
    img[mask != 0, 3] = 0
    
    # 2. Pure Black (0-20) Removal - This was the key for Q4!
    black_mask = cv2.inRange(img[:,:,:3], np.array([0,0,0]), np.array([20,20,20]))
    img[black_mask != 0, 3] = 0
    
    # DO NOT ADD ANY NEW AGGRESSIVE FILTERING
    cv2.imwrite(target_path, img)

restore_successful_yo_logic("아이콘/요 아이콘.png", "public/q4_final_v2.png")
