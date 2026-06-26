import os
import glob

PUBLIC_DIR = r"c:\Users\saavi\OneDrive\Desktop\kridaz\kridaz\client\user\public"

deleted_count = 0
deleted_size = 0

def delete_file(file_path):
    global deleted_count, deleted_size
    if os.path.exists(file_path):
        try:
            size = os.path.getsize(file_path)
            os.remove(file_path)
            deleted_count += 1
            deleted_size += size
            print(f"Deleted: {os.path.basename(file_path)} ({size / (1024*1024):.2f} MB)")
        except Exception as e:
            print(f"Error deleting {file_path}: {e}")

# Find all webp files in public directory
webp_files = glob.glob(os.path.join(PUBLIC_DIR, '**', '*.webp'), recursive=True)

for webp_path in webp_files:
    base, _ = os.path.splitext(webp_path)
    # Check if a corresponding .png, .jpg, or .jpeg exists and delete it
    for ext in ['.png', '.jpg', '.jpeg', '.svg']:
        orig_path = base + ext
        if os.path.exists(orig_path):
            delete_file(orig_path)
            
# Manually delete Phase 1 SVGs and PNGs that might have different names
manual_deletions = [
    os.path.join(PUBLIC_DIR, "3d_whistle.svg"),
    os.path.join(PUBLIC_DIR, "3d_map_location.svg"),
    os.path.join(PUBLIC_DIR, "3d_scoreboard_v2.png"),
    os.path.join(PUBLIC_DIR, "sports", "3d_professional_v2.png"),
    os.path.join(PUBLIC_DIR, "3d_whistle.png"),
    os.path.join(PUBLIC_DIR, "3d_map_location.png")
]

for p in manual_deletions:
    delete_file(p)

print(f"\n--- Summary ---")
print(f"Total files deleted: {deleted_count}")
print(f"Total space saved: {deleted_size / (1024*1024):.2f} MB")
