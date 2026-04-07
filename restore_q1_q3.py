import cv2
import numpy as np
import os
from PIL import Image

def simple_restore(original_path, target_path):
    print(f"Simple Restore for {target_path} (Square) from {original_path}...")
    with Image.open(original_path) as pil_img:
        img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGBA2BGRA)
    
    # Just remove the basic gray background (223, 223, 223)
    bgr = img[:,:,:3]
    lower = np.array([210, 210, 210])
    upper = np.array([245, 245, 245])
    
    mask = cv2.inRange(bgr, lower, upper)
    img[:,:,3] = 255
    img[mask != 0, 3] = 0
    
    cv2.imwrite(target_path, img)

# RESTORE ONLY Q1 AND Q3 to their original square form
restore_mapping = {
    "아이콘/해 아이콘.png": "public/q1.png",
    "아이콘/줘 아이콘.png": "public/q3.png"
}

for src, dst in restore_mapping.items():
    if os.path.exists(src):
        simple_restore(src, dst)
