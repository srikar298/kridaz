import os
from PIL import Image
import glob

PUBLIC_DIR = r"c:\Users\saavi\OneDrive\Desktop\kridaz\kridaz\client\user\public"
SIZE_THRESHOLD = 500 * 1024  # 500 KB

def optimize(input_path, output_path):
    print(f"Processing {os.path.basename(input_path)} -> {os.path.basename(output_path)}")
    try:
        with Image.open(input_path) as img:
            img = img.convert("RGBA")
            # We don't resize because these are backgrounds/banners
            img.save(output_path, "WEBP", quality=80, method=6)
        size = os.path.getsize(output_path)
        print(f"Saved {os.path.basename(output_path)} (Size: {size / 1024:.2f} KB)")
        return True
    except Exception as e:
        print(f"Error processing {input_path}: {e}")
        return False

# Find files
all_files = []
for ext in ('*.png', '*.jpg', '*.jpeg'):
    all_files.extend(glob.glob(os.path.join(PUBLIC_DIR, ext)))

processed_files = []

for file_path in all_files:
    size = os.path.getsize(file_path)
    if size > SIZE_THRESHOLD:
        base, ext = os.path.splitext(file_path)
        out_path = base + ".webp"
        
        # Keep track of original name to help replace in codebase
        original_name = os.path.basename(file_path)
        new_name = os.path.basename(out_path)
        
        success = optimize(file_path, out_path)
        if success:
            processed_files.append((original_name, new_name))

print("\n--- Summary of conversions ---")
for orig, new in processed_files:
    print(f"{orig}|{new}")
