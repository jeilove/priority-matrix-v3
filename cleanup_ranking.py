from PIL import Image
import os

def cleanup_ranking_icon(src_path, dst_path):
    print(f"Cleaning {src_path} -> {dst_path} using PIL...")
    with Image.open(src_path) as img:
        img = img.convert("RGBA")
        datas = img.getdata()
        
        new_data = []
        # Get background color from corner
        bg_r, bg_g, bg_b, _ = datas[0] # Assume top-left corner is background
        print(f"Detected top-left color: ({bg_r}, {bg_g}, {bg_b})")

        for item in datas:
            r, g, b, a = item
            # If it's near the background color, make it transparent
            # Using same tolerance logic as prepare_archive.py plus some range
            if abs(r - bg_r) < 15 and abs(g - bg_g) < 15 and abs(b - bg_b) < 15:
                new_data.append((r, g, b, 0))
            else:
                new_data.append(item)
        
        img.putdata(new_data)
        img.save(dst_path, "PNG")

if __name__ == "__main__":
    src = "아이콘/랭킹.png"
    dst = "public/ranking.png"
    if os.path.exists(src):
        cleanup_ranking_icon(src, dst)
    else:
        print(f"Error: {src} not found!")
