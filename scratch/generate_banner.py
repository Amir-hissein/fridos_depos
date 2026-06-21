import os
from PIL import Image, ImageDraw, ImageFilter, ImageOps

def create_banner():
    # Banner Dimensions
    width, height = 1200, 400
    
    # 1. Create base image with RGBA
    banner = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(banner)
    
    # 2. Draw a smooth premium linear gradient
    # Deep Forest Green gradient: #0A1910 -> #153823 -> #1C4D30 -> #09120D
    for x in range(width):
        t = x / float(width)
        if t < 0.25:
            # Gradient from #0A1910 to #153823
            t_scale = t / 0.25
            r = int(10 + (21 - 10) * t_scale)
            g = int(25 + (56 - 25) * t_scale)
            b = int(16 + (35 - 16) * t_scale)
        elif t < 0.75:
            # Gradient from #153823 to #1C4D30
            t_scale = (t - 0.25) / 0.50
            r = int(21 + (28 - 21) * t_scale)
            g = int(56 + (77 - 56) * t_scale)
            b = int(35 + (48 - 35) * t_scale)
        else:
            # Gradient from #1C4D30 to #09120D
            t_scale = (t - 0.75) / 0.25
            r = int(28 + (9 - 28) * t_scale)
            g = int(77 + (18 - 77) * t_scale)
            b = int(48 + (13 - 48) * t_scale)
        
        draw.line([(x, 0), (x, height)], fill=(r, g, b, 255))
        
    # 3. Add ambient glow effects (aurora style)
    glow_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)
    
    # Emerald green glow on the left behind food
    glow_draw.ellipse([(-100, -100), (500, 500)], fill=(59, 165, 105, 75))
    # Gold ambient glow in the middle-right
    glow_draw.ellipse([(600, -200), (1100, 300)], fill=(244, 183, 64, 45))
    
    # Apply Gaussian Blur to the glows
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(80))
    banner = Image.alpha_composite(banner, glow_layer)
    
    # Draw refreshed clean canvas draw reference
    draw = ImageDraw.Draw(banner)
    
    # 4. Prepare and place the Spaghetti Plate on the left
    spaghetti_path = "assets/images/calorie/500-600.png"
    if os.path.exists(spaghetti_path):
        spag_img = Image.open(spaghetti_path).convert("RGBA")
        
        # Crop to a perfect circle (remove flat background color)
        # Spaghetti in the image is centered. Let's find its center.
        # It is a 1024x1024 image. The plate is roughly in the center.
        mask = Image.new("L", (1024, 1024), 0)
        mask_draw = ImageDraw.Draw(mask)
        # The food plate is a circle of diameter approx 800 in the center of 1024x1024
        mask_draw.ellipse([(120, 120), (904, 904)], fill=255)
        
        # Apply mask
        cropped_spag = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
        cropped_spag.paste(spag_img, (0, 0), mask=mask)
        
        # Resize to 300x300
        plate_size = 280
        cropped_spag = cropped_spag.resize((plate_size, plate_size), Image.Resampling.LANCZOS)
        
        # Place it at x=80, y=60 (centered vertically at y=200)
        plate_x = 80
        plate_y = int((height - plate_size) / 2)
        banner.paste(cropped_spag, (plate_x, plate_y), mask=cropped_spag)
        
        # Draw scanning brackets around the plate
        bracket_pad = 20
        b_x1 = plate_x - bracket_pad
        b_y1 = plate_y - bracket_pad
        b_x2 = plate_x + plate_size + bracket_pad
        b_y2 = plate_y + plate_size + bracket_pad
        
        bracket_len = 30
        bracket_color = (255, 255, 255, 180)
        bracket_width = 3
        
        # Top-left bracket
        draw.line([(b_x1, b_y1), (b_x1 + bracket_len, b_y1)], fill=bracket_color, width=bracket_width)
        draw.line([(b_x1, b_y1), (b_x1, b_y1 + bracket_len)], fill=bracket_color, width=bracket_width)
        
        # Top-right bracket
        draw.line([(b_x2, b_y1), (b_x2 - bracket_len, b_y1)], fill=bracket_color, width=bracket_width)
        draw.line([(b_x2, b_y1), (b_x2, b_y1 + bracket_len)], fill=bracket_color, width=bracket_width)
        
        # Bottom-left bracket
        draw.line([(b_x1, b_y2), (b_x1 + bracket_len, b_y2)], fill=bracket_color, width=bracket_width)
        draw.line([(b_x1, b_y2), (b_x1, b_y2 - bracket_len)], fill=bracket_color, width=bracket_width)
        
        # Bottom-right bracket
        draw.line([(b_x2, b_y2), (b_x2 - bracket_len, b_y2)], fill=bracket_color, width=bracket_width)
        draw.line([(b_x2, b_y2), (b_x2, b_y2 - bracket_len)], fill=bracket_color, width=bracket_width)
        
        # Draw a subtle high-tech scanning line cutting through the plate (horizontal)
        scan_line_y = int(height / 2) + 20
        scan_line_x1 = plate_x - 10
        scan_line_x2 = plate_x + plate_size + 10
        # draw soft gradient scan line
        draw.line([(scan_line_x1, scan_line_y), (scan_line_x2, scan_line_y)], fill=(59, 165, 105, 220), width=3)
        draw.line([(scan_line_x1, scan_line_y - 1), (scan_line_x2, scan_line_y - 1)], fill=(255, 255, 255, 150), width=1)
        
        # Draw calorie tag indicators on the image to make it look hyper-professional
        # Badge 1: 18g Protein (Top-Left)
        badge_y1 = plate_y + 15
        draw.rounded_rectangle([plate_x - 70, badge_y1, plate_x - 10, badge_y1 + 35], radius=6, fill=(38, 43, 40, 220), outline=(255, 255, 255, 40))
        # Badge 2: 610 Kcal (Top-Right)
        badge_y2 = plate_y + 15
        draw.rounded_rectangle([plate_x + plate_size + 10, badge_y2, plate_x + plate_size + 70, badge_y2 + 35], radius=6, fill=(38, 43, 40, 220), outline=(255, 255, 255, 40))
        # Badge 3: 75g Carbs (Bottom-Left)
        badge_y3 = plate_y + plate_size - 50
        draw.rounded_rectangle([plate_x - 70, badge_y3, plate_x - 10, badge_y3 + 35], radius=6, fill=(38, 43, 40, 220), outline=(255, 255, 255, 40))
        # Badge 4: 25g Fat (Bottom-Right)
        badge_y4 = plate_y + plate_size - 50
        draw.rounded_rectangle([plate_x + plate_size + 10, badge_y4, plate_x + plate_size + 70, badge_y4 + 35], radius=6, fill=(38, 43, 40, 220), outline=(255, 255, 255, 40))
        
        # Draw simple text inside the badges
        # Since we don't know the font file path, we'll draw simple text (or we'll load default/Helvetica if available)
        # Pillow default font is tiny, but we can search for a system font
        font = None
        font_bold = None
        font_paths = [
            "/System/Library/Fonts/Helvetica.ttc",
            "/System/Library/Fonts/Cache/Helvetica.ttc",
            "/System/Library/Fonts/Supplemental/Arial.ttf"
        ]
        from PIL import ImageFont
        for fp in font_paths:
            if os.path.exists(fp):
                try:
                    font = ImageFont.truetype(fp, 13)
                    font_bold = ImageFont.truetype(fp, 14)
                    break
                except:
                    pass
        
        if font:
            draw.text((plate_x - 60, badge_y1 + 10), "🍖 18g", fill=(255, 255, 255, 255), font=font)
            draw.text((plate_x + plate_size + 20, badge_y2 + 10), "🔥 610", fill=(255, 255, 255, 255), font=font)
            draw.text((plate_x - 60, badge_y3 + 10), "🍞 75g", fill=(255, 255, 255, 255), font=font)
            draw.text((plate_x + plate_size + 20, badge_y4 + 10), "💧 25g", fill=(255, 255, 255, 255), font=font)
            
    # 5. Crop, resize, and place the Fridos Logo on the right
    logo_path = "assets/fridos.png"
    if os.path.exists(logo_path):
        logo_img = Image.open(logo_path).convert("RGBA")
        
        # BBox of logo: (195, 164, 844, 966)
        logo_cropped = logo_img.crop((195, 164, 844, 966))
        
        # Let's resize it to height of 150
        logo_h = 150
        aspect = logo_cropped.width / float(logo_cropped.height)
        logo_w = int(logo_h * aspect)
        logo_resized = logo_cropped.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
        
        # Place it near the right edge
        logo_x = width - logo_w - 90
        logo_y = int((height - logo_h) / 2)
        
        # Let's make the logo pop out with a subtle white drop shadow or ambient glow
        logo_glow = Image.new("RGBA", (logo_w + 40, logo_h + 40), (0, 0, 0, 0))
        logo_glow.paste(logo_resized, (20, 20), mask=logo_resized)
        
        # We can extract alpha channel and blur it to make a beautiful drop glow
        r, g, b, a = logo_glow.split()
        glow_alpha = a.filter(ImageFilter.GaussianBlur(15))
        glow_color = Image.new("RGBA", (logo_w + 40, logo_h + 40), (59, 165, 105, 140)) # soft green glow
        logo_glow_shadow = Image.new("RGBA", (logo_w + 40, logo_h + 40), (0, 0, 0, 0))
        logo_glow_shadow.paste(glow_color, (0, 0), mask=glow_alpha)
        
        # Paste glow then the logo
        banner.paste(logo_glow_shadow, (logo_x - 20, logo_y - 20), mask=logo_glow_shadow)
        banner.paste(logo_resized, (logo_x, logo_y), mask=logo_resized)
        
        # Write "Fridos" brand name below or next to the logo
        # Let's see: we can write it in a beautiful typography.
        # We will write it in React Native or directly in image. Writing it in React Native is great,
        # but let's draw a nice subtle watermark-like "FRIDOS" or let React Native do it.
        # Actually, let's keep the logo clean on the right.
        
    # 6. Save the composite image
    output_dir = "assets/images"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "recipes_header.png")
    
    # Save image
    banner.save(output_path, "PNG")
    print("Successfully generated professional recipes header banner at:", output_path)

if __name__ == "__main__":
    create_banner()
