from PIL import Image

def process_image(img_path):
    img = Image.open(img_path).convert("RGBA")
    
    # Coordinates for the 4 quadrants
    quads = {
        'breakfast': (0, 0, 512, 512),
        'lunch': (512, 0, 1024, 512),
        'dinner': (0, 512, 512, 1024),
        'snack': (512, 512, 1024, 1024)
    }
    
    for name, box in quads.items():
        cropped = img.crop(box)
        
        # Remove pure black background
        data = cropped.getdata()
        new_data = []
        for item in data:
            # If the pixel is very dark (black background)
            if item[0] < 20 and item[1] < 20 and item[2] < 20:
                new_data.append((0, 0, 0, 0))
            else:
                new_data.append(item)
                
        cropped.putdata(new_data)
        
        # Crop the transparent bounding box so the icon is centered and scaled properly
        bbox = cropped.getbbox()
        if bbox:
            cropped = cropped.crop(bbox)
            
        out_path = f"assets/images/{name}_icon.png"
        cropped.save(out_path, "PNG")
        print(f"Saved {out_path}")

process_image('/Users/Amir/.gemini/antigravity-ide/brain/ed3138c1-b565-4dff-9a50-37b50ad2eb5e/flat_meal_icons_1782128777371.png')
