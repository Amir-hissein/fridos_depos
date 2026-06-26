from PIL import Image

def remove_background(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()

    new_data = []
    for item in data:
        # Check if the pixel is light gray / white (checkerboard colors)
        # We use a threshold of 230 to catch off-whites
        if item[0] > 230 and item[1] > 230 and item[2] > 230:
            # Change to transparent
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Saved {output_path}")

remove_background('assets/icon.png', 'assets/icon.png')
remove_background('assets/fridos.png', 'assets/fridos.png')
