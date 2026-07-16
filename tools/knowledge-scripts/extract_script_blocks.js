const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join('/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian', 'divination-hub.html'), 'utf8');
const lines = html.split('\n');

let count = 0;
let inScript = false;
let current = [];
let start = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('<script') && !line.includes('<script src')) {
    count++;
    inScript = true;
    current = [];
    start = i + 1;
  }
  if (inScript) {
    current.push(line);
    if (line.includes('</script>')) {
      inScript = false;
      if (count === 4 || count === 6) {
        const content = current.join('\n').replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
        fs.writeFileSync(path.join('/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian', `script_block_${count}.js`), content);
        console.log(`Saved script block ${count} starting at line ${start}`);
      }
    }
  }
}
