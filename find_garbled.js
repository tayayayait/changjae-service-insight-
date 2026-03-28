const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const targetDir = 'c:\\Users\\dbcdk\\Desktop\\사주사이트창재\\src';
console.log('Searching for corrupted files in: ' + targetDir);

walkDir(targetDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('\ufffd') || content.includes('')) {
      console.log('FOUND: ' + filePath);
    }
    // Also look for common CP949-as-UTF8 characters like 寃 (x5B83), 遺 (x907A), 浚 (x6D5A) etc.
    const cp949_as_utf8_regex = /[寃遺浚뚮궡瑜퉲덉쿂낆뿉뚮젰]/;
    if (cp949_as_utf8_regex.test(content)) {
       console.log('FOUND (Chinese characters from cp949 reading): ' + filePath);
    }
  }
});
