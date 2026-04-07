from PIL import Image
import os

def brute_force_yo_cleanup(original_path, target_path):
    print(f"Brute Force Cleanup (Q4 Only) for {target_path} from {original_path}...")
    
    with Image.open(original_path) as img:
        img = img.convert("RGBA")
        width, height = img.size
        # Get pixels as a list of (r,g,b,a)
        pixels = list(img.getdata())

        new_pixels = []
        for i, item in enumerate(pixels):
            r, g, b, a = item
            
            # Identify coordinates
            x = i % width
            y = i // width
            
            # 1. Coordinate-based logic: 
            # If we are in the outer 12% of the image, we are more aggressive.
            margin_x = width * 0.12
            margin_y = height * 0.12
            is_border = (x < margin_x or x > (width - margin_x) or y < margin_y or y > (height - margin_y))
            
            # 2. Color-based logic:
            brightness = (r + g + b) / 3
            # If it's a typical bright background (Gray/White > 210)
            is_background = (brightness > 210)
            # If it's a dark residue (< 105) - significantly higher threshold than 45!
            is_residue = (brightness < 105)
            
            # 3. Decision:
            # If we are in the border AND it's dark or light background -> Clear it!
            # If we are anywhere AND it's a light background -> Clear it!
            if is_background or (is_border and is_residue):
                new_pixels.append((r, g, b, 0))
            else:
                new_pixels.append(item)

        img.putdata(new_pixels)
        img.save(target_path, "PNG")

original_yo = "아이콘/요 아이콘.png"
target_yo = "public/q4.png"

if os.path.exists(original_yo):
    brute_force_yo_cleanup(original_yo, target_yo)
else:
    print("Error: Yo icon not found!")
