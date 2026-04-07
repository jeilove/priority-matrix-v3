from PIL import Image
import os

def rename_and_clean_yo(original_path, target_path):
    print(f"Renaming and Cleaning Q4 to bypass cache. Target: {target_path}")
    
    with Image.open(original_path) as img:
        img = img.convert("RGBA")
        width, height = img.size
        pixels = list(img.getdata())

        new_pixels = []
        for i, item in enumerate(pixels):
            r, g, b, a = item
            x = i % width
            y = i // width
            
            # Use aggressive cleanup again for the final new file
            brightness = (r + g + b) / 3
            is_background = (brightness > 210)
            is_black_residue = (brightness < 110) # High threshold to catch all dark noise
            margin = width * 0.15
            is_border = (x < margin or x > (width - margin) or y < margin or y > (height - margin))
            
            if is_background or (is_border and is_black_residue):
                new_pixels.append((r, g, b, 0))
            else:
                new_pixels.append(item)

        img.putdata(new_pixels)
        img.save(target_path, "PNG")

# NEW FILENAME TO BYPASS CACHE
rename_and_clean_yo("아이콘/요 아이콘.png", "public/q4_final_v2.png")
# ALSO RE-CLEAN LOGO just in case it's also cached
rename_and_clean_yo("아이콘/해줘바요 아이콘.png", "public/logo_final_v2.png")
