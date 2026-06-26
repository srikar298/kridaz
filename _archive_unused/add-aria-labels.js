/**
 * Accessibility Sweep Script
 * Adds aria-label to icon-only <Button> and <button> elements.
 * This script scans JSX files and adds aria-label based on:
 * 1. Existing `title` attribute value
 * 2. Icon name inference from the child icon component
 * 
 * Run: node add-aria-labels.js
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'client', 'user', 'src');

// Map of icon component names to sensible aria-labels
const ICON_LABELS = {
  X: 'Close',
  Menu: 'Menu',
  Bell: 'Notifications',
  ArrowLeft: 'Go back',
  ArrowRight: 'Next',
  ChevronLeft: 'Previous',
  ChevronRight: 'Next',
  Plus: 'Add',
  Minus: 'Remove',
  Search: 'Search',
  Filter: 'Filter',
  Settings: 'Settings',
  Share: 'Share',
  Share2: 'Share',
  Heart: 'Like',
  Edit: 'Edit',
  Edit2: 'Edit',
  Edit3: 'Edit',
  Pencil: 'Edit',
  Trash: 'Delete',
  Trash2: 'Delete',
  MoreVertical: 'More options',
  MoreHorizontal: 'More options',
  Send: 'Send',
  Copy: 'Copy',
  Download: 'Download',
  Upload: 'Upload',
  RefreshCw: 'Refresh',
  Eye: 'Show',
  EyeOff: 'Hide',
  Check: 'Confirm',
  Close: 'Close',
  Home: 'Home',
  MapPin: 'Location',
  Phone: 'Call',
  Mail: 'Email',
  Calendar: 'Calendar',
  Clock: 'Time',
  Star: 'Favorite',
  Bookmark: 'Bookmark',
  Flag: 'Report',
  AlertTriangle: 'Warning',
  Info: 'Information',
  HelpCircle: 'Help',
  Lock: 'Lock',
  Unlock: 'Unlock',
  LogOut: 'Log out',
  User: 'Profile',
  Users: 'Users',
  Camera: 'Camera',
  Mic: 'Microphone',
  MicOff: 'Mute microphone',
  Play: 'Play',
  Pause: 'Pause',
  Volume2: 'Volume',
  VolumeX: 'Mute',
  Maximize: 'Maximize',
  Minimize: 'Minimize',
  ExternalLink: 'Open in new tab',
  Link: 'Link',
  Grid: 'Grid view',
  List: 'List view',
  Image: 'Image',
  Video: 'Video',
  File: 'File',
  Loader: 'Loading',
  RotateCcw: 'Undo',
  RotateCw: 'Redo',
  ZoomIn: 'Zoom in',
  ZoomOut: 'Zoom out',
  Move: 'Move',
  Shield: 'Security',
  Award: 'Achievement',
  Gift: 'Gift',
  CreditCard: 'Payment',
  ShoppingCart: 'Cart',
  Package: 'Package',
  ThumbsUp: 'Like',
  ThumbsDown: 'Dislike',
  MessageCircle: 'Chat',
  MessageSquare: 'Message',
  Hash: 'Tag',
  Paperclip: 'Attach',
  Save: 'Save',
  Code: 'Code',
  Globe: 'Web',
  Wifi: 'Network',
  Power: 'Power',
  Activity: 'Activity',
  Zap: 'Quick action',
  Layout: 'Layout',
  Layers: 'Layers',
  Monitor: 'Display',
  Smartphone: 'Mobile',
  ChevronDown: 'Expand',
  ChevronUp: 'Collapse',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  Crosshair: 'Target',
  Navigation: 'Navigate',
  Compass: 'Compass',
  Target: 'Target',
  Sliders: 'Adjust',
  ToggleLeft: 'Toggle off',
  ToggleRight: 'Toggle on',
  Repeat: 'Repeat',
  Shuffle: 'Shuffle',
  SkipBack: 'Previous',
  SkipForward: 'Next',
  Rewind: 'Rewind',
  FastForward: 'Fast forward',
  Crop: 'Crop',
  Scissors: 'Cut',
  Type: 'Text',
  Bold: 'Bold',
  Italic: 'Italic',
  Underline: 'Underline',
  AlignLeft: 'Align left',
  AlignCenter: 'Align center',
  AlignRight: 'Align right',
  TrendingUp: 'Trending up',
  TrendingDown: 'Trending down',
  BarChart: 'Chart',
  BarChart2: 'Chart',
  PieChart: 'Chart',
  Inbox: 'Inbox',
  Archive: 'Archive',
  CloudUpload: 'Upload',
  CloudDownload: 'Download',
  Key: 'Key',
  Aperture: 'Aperture',
  Sunset: 'Sunset',
  Sunrise: 'Sunrise',
  Moon: 'Dark mode',
  Sun: 'Light mode',
  CloudOff: 'Offline',
  WifiOff: 'Disconnected',
  BellOff: 'Notifications off',
  ShieldOff: 'Security off',
  UserPlus: 'Add user',
  UserMinus: 'Remove user',
  UserX: 'Remove user',
  UserCheck: 'Verified user',
};

let totalFixed = 0;
let filesModified = 0;

function getAllJsxFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllJsxFiles(fullPath));
    } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  let fixCount = 0;

  // Pattern: <Button ... > followed by only an icon component (possibly with whitespace)
  // We look for Button/button tags that:
  // 1. Don't already have aria-label
  // 2. Contain only an icon child (Lucide icons are PascalCase components)
  
  // Regex: Match <Button ...> or <button ...> that don't have aria-label
  // This is a simplified approach that handles the most common patterns
  
  const buttonPattern = /(<(?:Button|button)\b(?![^>]*aria-label)[^>]*)(>)/g;
  
  const newContent = content.replace(buttonPattern, (match, beforeClose, closeChar, offset) => {
    // Check if this button already has aria-label
    if (beforeClose.includes('aria-label')) return match;
    
    // Look at what follows the closing >
    const afterButton = content.substring(offset + match.length, offset + match.length + 200);
    
    // Check if the immediate child is ONLY an icon (no text content)
    // Pattern: whitespace, then <IconName ... />, then whitespace, then </Button>
    const iconOnlyPattern = /^\s*(?:\{[^}]*\}\s*)?<([A-Z][a-zA-Z]*)\s[^>]*\/>\s*(?:<\/(?:Button|button)>|\{)/;
    const iconMatch = afterButton.match(iconOnlyPattern);
    
    if (iconMatch) {
      const iconName = iconMatch[1];
      
      // Skip if it's not a known icon
      if (!ICON_LABELS[iconName]) return match;
      
      // Check if there's a title attribute we can use
      const titleMatch = beforeClose.match(/title="([^"]*)"/);
      const label = titleMatch ? titleMatch[1] : ICON_LABELS[iconName];
      
      fixCount++;
      totalFixed++;
      modified = true;
      
      return `${beforeClose} aria-label="${label}"${closeChar}`;
    }
    
    // Also check for ternary icon patterns like: {isOpen ? <X .../> : <Menu .../>}
    const ternaryIconPattern = /^\s*\{[^?]*\?\s*<([A-Z][a-zA-Z]*)\s/;
    const ternaryMatch = afterButton.match(ternaryIconPattern);
    
    if (ternaryMatch) {
      const iconName = ternaryMatch[1];
      if (!ICON_LABELS[iconName]) return match;
      
      const titleMatch = beforeClose.match(/title="([^"]*)"/);
      const label = titleMatch ? titleMatch[1] : 'Toggle menu';
      
      fixCount++;
      totalFixed++;
      modified = true;
      
      return `${beforeClose} aria-label="${label}"${closeChar}`;
    }
    
    return match;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    filesModified++;
    const relPath = path.relative(path.join(__dirname), filePath);
    console.log(`  ✓ ${relPath} (${fixCount} fix${fixCount > 1 ? 'es' : ''})`);
  }
}

console.log('Accessibility Sweep: Adding aria-label to icon-only buttons...\n');

const files = getAllJsxFiles(SRC_DIR);
console.log(`Scanning ${files.length} files...\n`);

for (const file of files) {
  try {
    processFile(file);
  } catch (err) {
    console.error(`  ✗ Error processing ${file}: ${err.message}`);
  }
}

console.log(`\nDone! Fixed ${totalFixed} icon-only button${totalFixed !== 1 ? 's' : ''} across ${filesModified} file${filesModified !== 1 ? 's' : ''}.`);
