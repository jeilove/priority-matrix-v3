from PIL import Image
import os

def uniform_conservative_cleanup(original_path, target_path):
    print(f"Uniform Cleanup for {target_path} (Square) from {original_path}...")
    
    with Image.open(original_path) as img:
        img = img.convert("RGBA")
        datas = img.getdata()

        new_data = []
        for item in datas:
            r, g, b, a = item
            
            # Target both Light Gray (223) AND White (255) - basically anything gray-ish above 210
            is_gray = abs(r - g) < 15 and abs(g - b) < 15 and abs(r - b) < 15
            brightness = (r + g + b) / 3
            
            # If it's a very bright gray or white (background noise)
            if is_gray and brightness > 210:
                new_data.append((r, g, b, 0)) # Fully transparent
            else:
                new_data.append(item)

        img.putdata(new_data)
        
        # Edge cleanup: If there was a specific black residue for YO or LOGO, 
        # we can define it very conservatively as true black (0,0,0)
        # But only if it's very small.
        
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
        uniform_conservative_cleanup(src, dst)
