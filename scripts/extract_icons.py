from PIL import Image
import os

img_path = '/Users/Amir/.gemini/antigravity-ide/brain/ed3138c1-b565-4dff-9a50-37b50ad2eb5e/media__1782128554932.jpg'
img = Image.open(img_path)
w, h = img.size
print(f"Image size: {w}x{h}")
