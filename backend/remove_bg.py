import sys
from PIL import Image
import numpy as np

def process_image(input_path, output_path):
    # Open image
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img)
    
    # The checkerboard background has light colors: white and light gray.
    # We will identify pixels where R > 200, G > 200, B > 200 and make them transparent.
    # The purple hand logo (purple, black outline, white highlights).
    # Wait, the hand might have white eyes!
    # Let's check if there's any black outline. If the logo has a black outline,
    # we can just flood fill from the edges.
    
    # Let's do a simple flood fill from the 4 corners using a BFS queue.
    h, w = data.shape[:2]
    visited = np.zeros((h, w), dtype=bool)
    
    # We consider a pixel "background" if its RGB are all > 200.
    def is_bg(r, g, b):
        return r > 180 and g > 180 and b > 180
        
    queue = [(0,0), (0, w-1), (h-1, 0), (h-1, w-1)]
    for r, c in queue:
        if is_bg(*data[r, c, :3]):
            visited[r, c] = True
            
    head = 0
    while head < len(queue):
        r, c = queue[head]
        head += 1
        
        # Check neighbors
        for dr, dc in [(-1,0), (1,0), (0,-1), (0,1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < h and 0 <= nc < w and not visited[nr, nc]:
                if is_bg(*data[nr, nc, :3]):
                    visited[nr, nc] = True
                    queue.append((nr, nc))
                    
    # Set visited pixels to transparent
    data[visited, 3] = 0
    
    # Now find bounding box
    non_transparent = np.where(data[:, :, 3] > 0)
    if len(non_transparent[0]) > 0:
        min_y, max_y = np.min(non_transparent[0]), np.max(non_transparent[0])
        min_x, max_x = np.min(non_transparent[1]), np.max(non_transparent[1])
        
        cropped_data = data[min_y:max_y+1, min_x:max_x+1]
        
        # Add 5% padding
        ch, cw = cropped_data.shape[:2]
        pad = int(max(ch, cw) * 0.05)
        new_size = max(ch, cw) + pad * 2
        
        final_data = np.zeros((new_size, new_size, 4), dtype=np.uint8)
        
        start_y = (new_size - ch) // 2
        start_x = (new_size - cw) // 2
        
        final_data[start_y:start_y+ch, start_x:start_x+cw] = cropped_data
        
        final_img = Image.fromarray(final_data, "RGBA")
        final_img.save(output_path, "PNG")
        print(f"Saved cropped image to {output_path}")
    else:
        print("Empty image after background removal")

if __name__ == "__main__":
    process_image(sys.argv[1], sys.argv[2])
