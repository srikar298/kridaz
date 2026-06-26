const fs = require('fs');
const path = require('path');

// Basic alias resolution from vite.config.js
const aliases = {
  "@app": "src/app",
  "@components": "src/shared/components",
  "@hooks/useAxiosInstance": "src/infrastructure/axios.js",
  "@user/hooks/useAxiosInstance": "src/infrastructure/axios.js",
  "@hooks": "src/shared/hooks",
  "@utils": "src/shared/utils",
  "@layouts": "src/shared/layouts",
  "@services": "src/shared/services",
  "@infrastructure": "src/infrastructure",
  "@lib": "src/shared/lib",
  "@redux": "src/redux",
  "@pages": "src/pages",
  "@features": "src/features",
  "@context": "src/context",
  "@user/components": "src/shared/components",
  "@user/pages": "src/pages",
  "@user/layouts": "src/shared/layouts",
  "@user/hooks": "src/shared/hooks",
  "@user/utils": "src/shared/utils",
  "@user/services": "src/shared/services",
  "@user": "src",
  "@": "src"
};

function walk(dir) {
  let r = [];
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory() && !f.startsWith('.') && f !== 'node_modules') {
      r.push(...walk(p));
    } else if (/\.(jsx?|tsx?)$/.test(f)) {
      r.push(p);
    }
  }
  return r;
}

const root = path.resolve('client/user');
const files = walk(path.join(root, 'src'));
let errs = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const importRegex = /(?:import|export)\s+(?:.*?\s+from\s+)?['"](.*?)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const imp = match[1];
    let target = null;
    let baseDir = null;

    if (imp.startsWith('.')) {
      baseDir = path.dirname(file);
      target = path.join(baseDir, imp);
    } else if (imp.startsWith('@')) {
      // Find matching alias
      for (const [alias, relPath] of Object.entries(aliases).sort((a,b) => b[0].length - a[0].length)) {
        if (imp.startsWith(alias)) {
          const rest = imp.slice(alias.length);
          if (rest === '' || rest.startsWith('/')) {
            target = path.join(root, relPath, rest);
            break;
          }
        }
      }
    }

    if (target) {
      const exts = ['', '.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.jsx', '/index.ts', '/index.tsx'];
      for (const ext of exts) {
        const p = target + ext;
        if (fs.existsSync(p) && fs.statSync(p).isFile()) {
          const realDir = path.dirname(p);
          const baseName = path.basename(p);
          try {
            const actualFiles = fs.readdirSync(realDir);
            if (!actualFiles.includes(baseName)) {
              console.log(`CASE MISMATCH in ${file}: import "${imp}" matches "${baseName}" but actual file is differently cased!`);
              errs++;
            }
          } catch(e) {}
          break; // Found it
        }
      }
    }
  }
});

if (errs === 0) {
  console.log('No import casing issues found (checked relative and aliased).');
} else {
  console.log(`Found ${errs} case mismatch issues.`);
}
