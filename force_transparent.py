import cv2
import numpy as np

def make_transparent(path):
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if img is None: return
    # If it's BGR, add Alpha
    if img.shape[2] == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    
    # Threshold white backgrounds to transparent
    # Define white-ish range
    lower_white = np.array([200, 200, 200, 0])
    upper_white = np.array([255, 255, 255, 255])
    
    # Create mask for white area
    mask = cv2.inRange(img, lower_white, upper_white)
    img[mask != 0] = [0, 0, 0, 0] # Make white area transparent
    
    cv2.imwrite(path, img)

make_transparent("public/logo.png")
make_transparent("public/q1.png")
make_transparent("public/q2.png")
make_transparent("public/q3.png")
make_transparent("public/q4.png")
