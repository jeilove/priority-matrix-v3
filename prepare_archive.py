from PIL import Image
import os

def prepare_archive_icon(src, dst):
    print(f"Preparing Archive icon: {dst} from {src}...")
    with Image.open(src) as img:
        img = img.convert("RGBA")
        datas = img.getdata()
        
        new_data = []
        for item in datas:
            r, g, b, a = item
            # If it's pure white background, make it transparent
            if r > 245 and g > 245 and b > 245:
                new_data.append((r, g, b, 0))
            else:
                new_data.append(item)
        
        img.putdata(new_data)
        img.save(dst, "PNG")

if os.path.exists("아이콘/보관함.png"):
    prepare_archive_icon("아이콘/보관함.png", "public/archive.png")
else:
    print("Error: 보관함.png not found!")
