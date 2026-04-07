from PIL import Image
import os

def final_uniform_cleanup(original_path, target_path):
    print(f"Final Precise Uniform Cleanup for {target_path} from {original_path}...")
    
    with Image.open(original_path) as img:
        img = img.convert("RGBA")
        datas = img.getdata()

        new_data = []
        for item in datas:
            r, g, b, a = item
            
            # 1. Gray-ish check (R, G, B are similar)
            is_neutral = abs(r - g) < 20 and abs(g - b) < 20 and abs(r - b) < 20
            brightness = (r + g + b) / 3
            
            # 2. Target Ranges:
            # - Bright background (White/Gray > 210)
            # - Dark residue (Black < 45) -> TARGET FOR Q4
            is_background = (brightness > 210)
            is_black_residue = (brightness < 45)
            
            if is_neutral and (is_background or is_black_residue):
                new_data.append((r, g, b, 0)) # Fully transparent
            else:
                new_data.append(item)

        img.putdata(new_data)
        img.save(target_path, "PNG")

mapping = {
    "아이콘/해 아이콘.png": "public/q1.png",
    "아이콘/바 아이콘.png": "public/q2.png", 
    "아이콘/줘 아이콘.png": "public/q3.png",
    "아이콘/요 아이콘.png": "public/q4.png",
    "아이콘/해줘바요 아이콘.png": "public/logo.png"
}

for src, dst in mapping.items():
    if os.path.exists(src):
        final_uniform_cleanup(src, dst)
