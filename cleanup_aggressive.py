import cv2
import numpy as np

def aggressive_cleanup(path):
    print(f"Aggressive cleanup for {path}")
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if img is None: return
    if img.shape[2] == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    
    # Range of "background" to remove
    # Includes black, deep gray, almost anything that looks like a circular cutout background
    # We take anything with RGB intensity < 80 and make it transparent.
    # But only if it has some saturation? No, let's just use a color range.
    
    # Use hsv for better color filtering if needed, but RGB is fine for black/gray.
    # Convert to float to avoid overflow
    b, g, r, a = cv2.split(img)
    
    # Find pixels where R, G, B are all low
    mask = (r < 80) & (g < 80) & (b < 80)
    
    # Ensure we don't accidentally remove colored parts of the icon if they are dark.
    # But since these are mostly simple icons, it should be fine.
    # For extra safety, we can use a more specific mask if we know the background is gray.
    
    # Force transparency where mask matches
    img[mask, 3] = 0
    
    # Also, clean up edges using erosion
    alpha = img[:,:,3]
    kernel = np.ones((2,2), np.uint8)
    alpha = cv2.erode(alpha, kernel, iterations=1)
    img[:,:,3] = alpha
    
    cv2.imwrite(path, img)

for p in ["public/q1.png", "public/q2.png", "public/q3.png", "public/q4.png"]:
    aggressive_cleanup(p)
