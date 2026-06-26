import os
from PIL import Image

def optimize(input_path, output_path):
    print(f"Processing {input_path} -> {output_path}")
    try:
        with Image.open(input_path) as img:
            # We want to maintain transparency, so we use RGBA
            img = img.convert("RGBA")
            # Thumbnail will preserve aspect ratio and fit within 160x160
            img.thumbnail((160, 160), Image.Resampling.LANCZOS)
            img.save(output_path, "WEBP", quality=80, method=6)
        size = os.path.getsize(output_path)
        print(f"Saved {output_path} (Size: {size / 1024:.2f} KB)")
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

assets = [
    ("3d_map_location.png", "3d-map-location.webp"),
    ("3d_whistle.png", "3d-whistle.webp"),
    ("3d_scoreboard_v2.png", "3d-scoreboard-v2.webp"),
    ("sports/3d_professional_v2.png", "sports/3d-professional-v2.webp"),
]

for in_file, out_file in assets:
    if os.path.exists(in_file):
        optimize(in_file, out_file)
    else:
        print(f"File not found: {in_file}")
