import sys
from PIL import Image
from rembg import remove

def crop_and_save(input_path, output_path):
    print("Opening image...")
    # Open the image
    img = Image.open(input_path).convert("RGBA")
    
    print("Removing background with rembg...")
    # Remove background
    img = remove(img)
    
    # Get bounding box of non-transparent pixels
    bbox = img.getbbox()
    if bbox:
        print(f"Original size: {img.size}")
        print(f"Bounding box: {bbox}")
        
        # Crop to the bounding box
        cropped = img.crop(bbox)
        
        # We can also add a small padding (e.g. 5%) so it doesn't touch the very edges of the tab
        w, h = cropped.size
        pad_size = int(max(w, h) * 0.05)
        new_w, new_h = w + pad_size*2, h + pad_size*2
        # Make a square image with transparent background
        size = max(new_w, new_h)
        padded = Image.new("RGBA", (size, size), (255, 255, 255, 0))
        # Paste the cropped image in the center
        offset = ((size - w) // 2, (size - h) // 2)
        padded.paste(cropped, offset)
        
        print(f"Saving cropped and padded image size: {size}x{size}")
        padded.save(output_path, "PNG")
    else:
        print("Image is entirely empty/transparent.")

if __name__ == "__main__":
    crop_and_save(sys.argv[1], sys.argv[2])
