import cv2
import numpy as np
import os
from PIL import Image

def conservative_cleanup(original_path, target_path):
    print(f"Conservative Cleanup for {target_path} (Square) from {original_path}...")
    
    # Read original
    with Image.open(original_path) as pil_img:
        img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGBA2BGRA)

    h, w = img.shape[:2]
    
    # 1. Start with Opaque
    img[:,:,3] = 255
    
    # 2. ONLY REMOVE THE IDENTIFIED LIGHT GRAY COLOR (223, 223, 223)
    # We use a very narrow range to avoid eating the icon colors.
    target_bg = [223, 223, 223]
    diff = 5 # Very conservative tolerance
    
    lower = np.array([target_bg[0]-diff, target_bg[1]-diff, target_bg[2]-diff])
    upper = np.array([target_bg[0]+diff, target_bg[1]+diff, target_bg[2]+diff])
    
    mask = cv2.inRange(img[:,:,:3], lower, upper)
    
    # Apply transparency to only this color
    img[mask != 0, 3] = 0
    
    # 3. Handle the BLACK residues for Q4 (요) very carefully
    if "요" in original_path:
        # Instead of 0-100, let's use 0-20 (pure dark)
        black_mask = cv2.inRange(img[:,:,:3], np.array([0,0,0]), np.array([20,20,20]))
        img[black_mask != 0, 3] = 0

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
        conservative_cleanup(src, dst)
