from PIL import Image
import os

PUBLIC_DIR = os.path.dirname(os.path.abspath(__file__))

# Convert 3d_stadium.jpeg to webp
stadium_jpeg = os.path.join(PUBLIC_DIR, "3d_stadium.jpeg")
stadium_webp = os.path.join(PUBLIC_DIR, "3d_stadium.webp")

if os.path.exists(stadium_jpeg):
    img = Image.open(stadium_jpeg)
    img.save(stadium_webp, "WEBP", quality=80)
    print(f"Converted 3d_stadium.jpeg ({os.path.getsize(stadium_jpeg)} bytes) -> 3d_stadium.webp ({os.path.getsize(stadium_webp)} bytes)")
else:
    print("3d_stadium.jpeg not found")

# Convert remaining large PNGs to webp for sport icons
sport_pngs = [
    "Table-tennis_transparent.png",
    "Tennis_transparent.png",
    "Pickleball_transparent.png",
    "Volleyball_transparent.png",
    "tennis_icon_transparent.png",
    "Badminton_transparent.png",
]

for png_name in sport_pngs:
    png_path = os.path.join(PUBLIC_DIR, png_name)
    if os.path.exists(png_path):
        webp_name = png_name.replace(".png", ".webp")
        webp_path = os.path.join(PUBLIC_DIR, webp_name)
        img = Image.open(png_path)
        img.save(webp_path, "WEBP", quality=85)
        print(f"Converted {png_name} ({os.path.getsize(png_path)} bytes) -> {webp_name} ({os.path.getsize(webp_path)} bytes)")

print("\nDone!")
