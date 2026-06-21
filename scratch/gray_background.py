import os
from PIL import Image

def make_background_gray(img_path, target_rgb=(26, 30, 28), threshold=50):
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    tr, tg, tb = target_rgb
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # Replace pure black or very dark pixels with the target background color
            if r < threshold and g < threshold and b < threshold:
                pixels[x, y] = (tr, tg, tb, a)
                
    img.save(img_path, "PNG")
    print(f"Converted {os.path.basename(img_path)} background to dark gray {target_rgb}")

if __name__ == "__main__":
    dir_path = "assets/images/calorie"
    # Target color: #1A1E1C which is RGB(26, 30, 28)
    for file in os.listdir(dir_path):
        if file.endswith(".png"):
            full_path = os.path.join(dir_path, file)
            make_background_gray(full_path, target_rgb=(26, 30, 28))
