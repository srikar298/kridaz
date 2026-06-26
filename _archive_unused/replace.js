const fs = require("fs");
const path = require("path");

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  const btnRegex =
    /<button[^>]*onClick=\{[^}]*navigate\(-1\)[^}]*\}[^>]*>[\s\S]*?<\/button>/gi;

  let modified = false;

  let newContent = content.replace(btnRegex, (match) => {
    modified = true;
    return `<GlobalBackButton />`;
  });

  if (modified) {
    // Add import if not present
    if (!newContent.includes("import GlobalBackButton")) {
      const importStmt =
        "import GlobalBackButton from '@/shared/components/GlobalBackButton';\n";
      const lastImportIdx = newContent.lastIndexOf("import ");
      if (lastImportIdx !== -1) {
        const endOfLine = newContent.indexOf("\n", lastImportIdx);
        newContent =
          newContent.slice(0, endOfLine + 1) +
          importStmt +
          newContent.slice(endOfLine + 1);
      } else {
        newContent = importStmt + newContent;
      }
    }

    fs.writeFileSync(filePath, newContent, "utf8");
    console.log("Updated: " + filePath);
  }
}

function walkSync(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkSync(fullPath);
    } else if (fullPath.endsWith(".jsx")) {
      processFile(fullPath);
    }
  }
}

const targetDir = path.join(__dirname, "client", "user", "src");
console.log("Starting replacement in: " + targetDir);
walkSync(targetDir);
