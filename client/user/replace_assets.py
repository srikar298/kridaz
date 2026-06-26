import os
import glob
import re

SRC_DIR = r"c:\Users\saavi\OneDrive\Desktop\kridaz\kridaz\client\user\src"
FILES_TO_REPLACE = [
    "3d_glowing_shield",
    "ad_image",
    "almost_done_bg",
    "auth-bg",
    "banner-1",
    "community-bento-bg",
    "desktop-scoring-bg",
    "desktop-team-bg",
    "empty-pros",
    "feature-venues-bg",
    "gender_bg",
    "hero image",
    "hero-bg",
    "hero-desktop-new",
    "hero-mobile-new",
    "host-venue-bg-custom-2",
    "host-venue-bg-custom",
    "interests_bg",
    "login-background",
    "mobile-scoring-bg",
    "mobile-team-bg",
    "onboarding_bg",
    "pro-banner",
    "signup-background",
    "slide1",
    "slide2",
    "slide3",
    "slide4",
    "slide5",
    "streamlined-desktop",
    "streamlined-mobile",
    "tournament-bg-custom",
    "tournament-bg",
    "venue-hero-desktop",
    "venue-hero-mobile",
    "venue_banner",
    "React cricrket2"
]

def replace_in_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original_content = content
    for name in FILES_TO_REPLACE:
        # Regex to match the filename followed by .png, .jpg, or .jpeg
        # escaping name because it might contain spaces
        escaped_name = re.escape(name)
        pattern = re.compile(f'({escaped_name})\\.(png|jpg|jpeg|svg)', re.IGNORECASE)
        content = pattern.sub(r'\1.webp', content)
        
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {os.path.relpath(file_path, SRC_DIR)}")

all_files = []
for ext in ('*.js', '*.jsx', '*.ts', '*.tsx', '*.css'):
    all_files.extend(glob.glob(os.path.join(SRC_DIR, '**', ext), recursive=True))

for fp in all_files:
    replace_in_file(fp)

print("Done updating src files.")
