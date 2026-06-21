import os
from PIL import Image

def make_background_black(img_path, threshold=50):
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # Check if pixel is near black
            # We can use a combination of max value and distance from center to be safe,
            # but simple thresholding works extremely well for studio isolated shots.
            if r < threshold and g < threshold and b < threshold:
                pixels[x, y] = (0, 0, 0, a)
                
    img.save(img_path, "PNG")
    print(f"Successfully processed {os.path.basename(img_path)}")

if __name__ == "__main__":
    dir_path = "assets/images/calorie"
    for file in os.listdir(dir_path):
        if file.endswith(".png"):
            full_path = os.path.join(dir_path, file)
            make_background_black(full_path)
