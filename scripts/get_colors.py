from PIL import Image

img = Image.open('assets/icon.png')
pixels = img.load()
for y in range(10):
    for x in range(10):
        print(pixels[x, y])
