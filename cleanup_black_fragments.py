import cv2
import numpy as np

def clean_corners(path):
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if img is None: return
    if img.shape[2] == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    
    # Identify area that is almost pure black (background remnants)
    # The user mentioned "Black circle fragment in top right"
    h, w = img.shape[:2]
    
    # Let's target the exact black (#000000) or very close to it
    lower_black = np.array([0, 0, 0, 0])
    upper_black = np.array([15, 15, 15, 255]) # Tight range for black
    
    mask = cv2.inRange(img, lower_black, upper_black)
    
    # Only clean if it's near the edges to avoid touching icon details
    # But since it's a crop of an icon, usually the edges are the problem.
    img[mask != 0] = [0, 0, 0, 0]
    
    cv2.imwrite(path, img)

for p in ["public/logo.png", "public/q1.png", "public/q2.png", "public/q3.png", "public/q4.png"]:
    clean_corners(p)
