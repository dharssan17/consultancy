const fs = require('fs');
const path = require('path');

const checkDir = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.js')) {
      try {
        console.log(`Checking ${file}...`);
        require(path.join(dir, file));
      } catch (e) {
        console.error(`Error in ${file}:`, e.message);
      }
    }
  }
};

console.log('--- Models ---');
checkDir(path.join(__dirname, '../models'));
console.log('--- Controllers ---');
checkDir(path.join(__dirname, '../controllers'));
console.log('--- Routes ---');
checkDir(path.join(__dirname, '../routes'));
