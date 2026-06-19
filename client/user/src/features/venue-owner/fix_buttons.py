import os
import re

base_dir = r'c:\Users\saavi\OneDrive\Desktop\kridaz\kridaz\client\user\src\features\venue-owner'

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    original_content = content

    def repl_class(m):
        full_match = m.group(0)
        inner_class = m.group(1)
        # Primary buttons
        if 'bg-[#B3DC26]' in inner_class and 'text-black' in inner_class:
            if 'hover:' in inner_class or 'transition' in inner_class or 'shadow' in inner_class or 'rounded' in inner_class:
                new_class = re.sub(r'bg-\[#B3DC26\](/10)?', 'bg-gradient-to-r from-[#55DEE8] to-[#B3DC26] shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none', inner_class)
                new_class = re.sub(r'hover:bg-\[[^\]]+\]', 'hover:opacity-90', new_class)
                new_class = re.sub(r'hover:text-[^ ]+', '', new_class)
                new_class = re.sub(r'\bborder\b(?!-none)', '', new_class)
                new_class = re.sub(r'border-\[[^\]]+\](/[\d]+)?', '', new_class)
                new_class = new_class.replace('shadow-[0_10px_20px_rgba(204,255,0,0.1)]', '')
                return full_match.replace(inner_class, new_class)
        # Secondary buttons
        if ('bg-[#111]' in inner_class or 'bg-[#111111]' in inner_class) and 'border-white/10' in inner_class and 'hover:text-white' in inner_class:
            new_class = re.sub(r'bg-\[#111(111)?\]', 'bg-[#1B1B1B]', inner_class)
            return full_match.replace(inner_class, new_class)
        return full_match

    content = re.sub(r'className=["\']([^"\']+)["\']', repl_class, content)
    content = re.sub(r'className=\{`([^`]+)`\}', repl_class, content)

    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Buttons updated: {file_path}')

for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.endswith('.jsx'):
            process_file(os.path.join(root, file))
print('Button scan complete')
