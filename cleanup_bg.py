import cv2
import numpy as np
import os
from PIL import Image, ImageOps

def cleanup_transparency(img_path):
    print(f"Cleaning up {img_path}...")
    try:
        # Load image with alpha
        img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
        if img is None or img.shape[2] < 4:
            print(f"Skip {img_path}: no alpha or invalid.")
            return

        # Simple threshold on alpha to remove partial pixels
        # And erode/dilate to remove white fringes
        alpha = img[:,:,3]
        
        # If the background was white and aliased, small threshold on alpha helps.
        # But even better, if RGB is close to white AND alpha is low, make it zero.
        # Wait, let's just make alpha binary (0 or 255) if it's very low.
        _, alpha_binary = cv2.threshold(alpha, 128, 255, cv2.THRESH_BINARY)
        
        img[:,:,3] = alpha_binary
        
        # To handle white fringes, we can try to contract (erode) the alpha mask.
        kernel = np.ones((2,2), np.uint8)
        alpha_eroded = cv2.erode(alpha_binary, kernel, iterations=1)
        img[:,:,3] = alpha_eroded
        
        # Save back
        cv2.imwrite(img_path, img) 
        print(f"Done cleaning {img_path}")
    except Exception as e:
        print(f"Error {e}")

paths = ["public/logo.png", "public/q1.png", "public/q2.png", "public/q3.png", "public/q4.png"]
for p in paths:
    cleanup_transparency(p)
