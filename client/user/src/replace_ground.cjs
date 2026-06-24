const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let replacedCount = 0;

function replaceInFile(filePath) {
  if (!filePath.match(/\.(jsx|js|tsx|ts)$/)) return;
  if (filePath.includes('replace_ground.js')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // We want to replace "Ground" or "ground" only in user-facing text.
  // 1. Text inside JSX: > something Ground something <
  content = content.replace(/>([^<]*)\b(G)round\b([^<]*)</g, '>$1enue$3<');
  content = content.replace(/>([^<]*)\b(G)rounds\b([^<]*)</g, '>$1enues$3<');
  content = content.replace(/>([^<]*)\b(g)round\b([^<]*)</g, '>$1enue$3<');
  content = content.replace(/>([^<]*)\b(g)rounds\b([^<]*)</g, '>$1enues$3<');
  
  // Repeat to handle multiple occurrences in same text node
  content = content.replace(/>([^<]*)\b(G)round\b([^<]*)</g, '>$1enue$3<');
  content = content.replace(/>([^<]*)\b(g)round\b([^<]*)</g, '>$1enue$3<');

  // 2. Text in Template literals that are likely user facing:
  // e.g. `"Local Ground"`
  // We'll replace specifically known phrases that appear in strings based on grep search:
  const phrases = [
    ["Local Ground", "Local Venue"],
    ["Custom Ground / Court", "Custom Venue / Court"],
    ["Cricket Ground", "Cricket Venue"],
    ["Outdoor Ground", "Outdoor Venue"],
    ["Indoor Ground", "Indoor Venue"],
    ["Ground DNA", "Venue DNA"],
    ["Ground Composition", "Venue Composition"],
    ["Ground Not Playable", "Venue Not Playable"],
    ["Ground Types", "Venue Types"],
    ["Ground detail link", "Venue detail link"],
    ["Share Ground", "Share Venue"],
    ["Choose Venue/Ground", "Choose Venue"],
    ["a ground", "a venue"],
    ["ground or capture", "venue or capture"],
    ["this ground:", "this venue:"]
  ];

  for (const [find, replace] of phrases) {
    content = content.split(find).join(replace);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    replacedCount++;
    console.log(`Updated: ${filePath}`);
  }
}

walkDir('c:\\Users\\saavi\\OneDrive\\Desktop\\kridaz\\kridaz\\client\\user\\src', replaceInFile);
console.log(`Total files updated: ${replacedCount}`);
