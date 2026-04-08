from PIL import Image
import os

def process(input_path, threshold):
    img = Image.open(input_path).convert('RGBA')
    new_data = []
    for p in img.getdata():
        avg = (p[0] + p[1] + p[2]) / 3
        if avg > threshold:
            new_data.append((0, 0, 0, 255)) # Make Black
        else:
            new_data.append(p)
    img.putdata(new_data)
    out_name = f"public/icons/q4_thresh_{threshold}.png"
    img.save(out_name)
    return out_name

input_file = 'public/icons/q4.png'
for t in [180, 150, 100, 50]:
    process(input_file, t)
