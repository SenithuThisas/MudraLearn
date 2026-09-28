import sys
from PIL import Image

def analyze_image(filepath):
    img = Image.open(filepath).convert("RGB")
    w, h = img.size
    print(f"Size: {w}x{h}")
    corners = [
        img.getpixel((0, 0)),
        img.getpixel((w-1, 0)),
        img.getpixel((0, h-1)),
        img.getpixel((w-1, h-1))
    ]
    print(f"Corners: {corners}")
    
    # Check pixels along top edge
    top_edge = [img.getpixel((x, 0)) for x in range(0, w, max(1, w//10))]
    print(f"Top edge samples: {top_edge}")

if __name__ == "__main__":
    analyze_image(sys.argv[1])
