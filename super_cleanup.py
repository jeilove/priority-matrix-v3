from PIL import Image
import os

def super_cleanup_checkerboard(src, dst):
    print(f"Super Cleanup for {dst} from {src}...")
    with Image.open(src) as img:
        img = img.convert("RGBA")
        datas = img.getdata()
        
        new_data = []
        for item in datas:
            r, g, b, a = item
            
            # Target the checkerboard patterns:
            # 1. Light gray/white squares
            # 2. Mid gray squares
            # Typically these are (255,255,255), (192,192,192), (204,204,204) etc.
            
            # If the pixel is very close to white BUT not 'Pure White' (which is the icon)
            # and if the RGB values are very similar (gray)
            
            is_pure_white = (r > 250 and g > 250 and b > 250)
            is_gray_ish = (abs(r - g) < 10 and abs(g - b) < 10 and abs(r - b) < 10)
            is_checker_dark = (r > 100 and r < 210 and is_gray_ish)
            is_checker_light = (r >= 210 and r < 255 and is_gray_ish)
            
            # The icon itself is pure white outline. 
            # In cases where the icon is pure white, we protect it.
            # But sometimes icons have subtle shades.
            
            # For this specific 'Archive' icon, let's target the background pattern:
            if (is_checker_dark or is_checker_light) and not (r > 253 and g > 253 and b > 253):
                new_data.append((r, g, b, 0))
            elif r > 240 and g > 240 and b > 240:
                # If it's very white but part of the checkerboard (not pure enough)
                 # Actually, let's be safe. If it's a square pattern, we check coordinates or just use tight range.
                 new_data.append((r, b, g, 0))
            else:
                new_data.append(item)
        
        img.putdata(new_data)
        img.save(dst, "PNG")

if os.path.exists("아이콘/보관함.png"):
    super_cleanup_checkerboard("아이콘/보관함.png", "public/archive.png")
else:
    print("Error: 보관함.png not found!")
