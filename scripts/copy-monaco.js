const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../node_modules/monaco-editor/min/vs');
const dest = path.join(__dirname, '../public/monaco-editor/vs');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log(`Copying Monaco Editor files from ${src} to ${dest}...`);
try {
    copyDir(src, dest);
    console.log('Monaco Editor files copied successfully!');
} catch (err) {
    console.error('Error copying files:', err);
    process.exit(1);
}
