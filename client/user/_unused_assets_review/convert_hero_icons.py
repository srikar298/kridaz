import base64
import re
import os

try:
    from PIL import Image
    import io
except ImportError:
    print("Pillow not installed. Installing...")
    import subprocess
    subprocess.check_call(["pip", "install", "Pillow"])
    from PIL import Image
    import io

PUBLIC_DIR = os.path.dirname(os.path.abspath(__file__))

files_map = {
    os.path.join(PUBLIC_DIR, "3d_whistle.svg"): os.path.join(PUBLIC_DIR, "3d-whistle.webp"),
    os.path.join(PUBLIC_DIR, "3d_map_location.svg"): os.path.join(PUBLIC_DIR, "3d-map-location.webp"),
}

for svg_path, webp_path in files_map.items():
    if not os.path.exists(svg_path):
        print(f"SKIP: File not found: {svg_path}")
        continue

    print(f"Processing: {svg_path} ({os.path.getsize(svg_path)} bytes)")

    with open(svg_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    match = re.search(r'data:image/png;base64,([A-Za-z0-9+/=\s]+)', content)
    if not match:
        print(f"  ERROR: No base64 PNG data found in {svg_path}")
        continue

    b64_data = match.group(1).replace("\n", "").replace("\r", "").replace(" ", "")
    img_data = base64.b64decode(b64_data)
    img = Image.open(io.BytesIO(img_data))
    print(f"  Original size: {img.size}")

    img = img.resize((160, 160), Image.LANCZOS)
    img.save(webp_path, "WEBP", quality=85)
    print(f"  Saved: {webp_path} ({os.path.getsize(webp_path)} bytes)")

print("\nDone!")
