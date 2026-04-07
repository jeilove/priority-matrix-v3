from PIL import Image
import os

def target_yo_cleanup(original_path, target_path):
    print(f"Targeted Cleanup (Q4 Only) for {target_path} from {original_path}...")
    
    with Image.open(original_path) as img:
        img = img.convert("RGBA")
        datas = img.getdata()

        new_data = []
        for item in datas:
            r, g, b, a = item
            
            # Neutral check
            is_neutral = abs(r - g) < 20 and abs(g - b) < 20 and abs(r - b) < 20
            brightness = (r + g + b) / 3
            
            # Target both light background and the specific DARK residue for YO
            if is_neutral and (brightness > 210 or brightness < 45):
                new_data.append((r, g, b, 0))
            else:
                new_data.append(item)

        img.putdata(new_data)
        img.save(target_path, "PNG")

# ONLY PROCESS "요"
original_yo = "아이콘/요 아이콘.png"
target_yo = "public/q4.png"

if os.path.exists(original_yo):
    target_yo_cleanup(original_yo, target_yo)
else:
    print("Error: Yo icon not found!")

# NOTE: OTHER ICONS ARE NOT TOUCHED IN THIS SCRIPT.
