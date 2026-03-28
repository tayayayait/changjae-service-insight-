import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f === 'node_modules' || f === '.git' || f === '.next') continue;
    const dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  }
}

const dirs = [
  'c:\\Users\\dbcdk\\Desktop\\사주사이트창재\\src',
  'c:\\Users\\dbcdk\\Desktop\\사주사이트창재\\supabase'
];

const results = [];
dirs.forEach(targetDir => {
  walkDir(targetDir, (filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.json') || filePath.endsWith('.md')) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        // Actually look for exact sequences we saw in the screenshot or uFFFD near Korean characters
        const hasUfffd = content.includes('\uFFFD');
        const hasUfffdCharacter = content.includes(''); // the literal character if pasted
        const hasCp949 = /[寃遺浚]/.test(content);
        
        if (hasUfffd || hasUfffdCharacter || hasCp949) {
          results.push(filePath);
        }
      } catch (e) {
      }
    }
  });
});

fs.writeFileSync('c:\\Users\\dbcdk\\Desktop\\사주사이트창재\\garbled_files.json', JSON.stringify(results, null, 2));
console.log('Done, found ' + results.length + ' files');
