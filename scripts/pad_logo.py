from PIL import Image

def resize_with_padding(filepath, padding_percentage=0.25):
    img = Image.open(filepath).convert("RGBA")
    w, h = img.size
    
    # New size
    new_w = int(w * (1 + padding_percentage))
    new_h = int(h * (1 + padding_percentage))
    
    # Create new transparent image
    new_img = Image.new("RGBA", (new_w, new_h), (255, 255, 255, 0))
    
    # Paste old image into center
    offset = ((new_w - w) // 2, (new_h - h) // 2)
    new_img.paste(img, offset)
    
    # Resize back to original size just to keep standard icon dimensions
    final_img = new_img.resize((w, h), Image.Resampling.LANCZOS)
    
    final_img.save(filepath, "PNG")
    print(f"Padded and saved {filepath}")

resize_with_padding('assets/icon.png')
resize_with_padding('assets/fridos.png')
