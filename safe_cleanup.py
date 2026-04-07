from PIL import Image, ImageDraw
import os

def final_safe_cleanup(original_path, target_path, tolerance=30):
    print(f"Final Safe Cleanup for {target_path} from {original_path}...")
    
    # Open original
    with Image.open(original_path) as img:
        img = img.convert("RGBA")
        datas = img.getdata()

        # Target background color (sampled earlier: 223, 223, 223)
        # But for logo it might be checkerboard.
        # We'll target anything that is "Gray-ish" or "White-ish"
        
        new_data = []
        for item in datas:
            # item is (R, G, B, A)
            r, g, b, a = item
            
            # If color is close to light gray or white
            # AND it's not a colored pixel (where R, G, B are significantly different)
            is_gray = abs(r - g) < 15 and abs(g - b) < 15 and abs(r - b) < 15
            brightness = (r + g + b) / 3
            
            # If it's a very bright gray or pure white (> 210)
            if is_gray and brightness > 210:
                new_data.append((r, g, b, 0)) # Alpha 0 but keep RGB
            else:
                new_data.append(item)

        img.putdata(new_data)
        img.save(target_path, "PNG")

# TARGET ONLY LOGO AND Q2
target_mapping = {
    "아이콘/해줘바요 아이콘.png": "public/logo.png",
    "아이콘/바 아이콘.png": "public/q2.png"
}

for src, dst in target_mapping.items():
    if os.path.exists(src):
        final_safe_cleanup(src, dst)
