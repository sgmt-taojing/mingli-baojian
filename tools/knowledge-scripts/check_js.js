const fs = require('fs');
const vm = require('vm');

const files = [
  'divination-hub.html',
  'divination-integrated.html',
  'divination-knowledge.html',
  'divination-almanac.html',
  'divination-shop.html',
  'divination-membership.html'
];

for (const f of files) {
  console.log(`=== ${f} ===`);
  try {
    const html = fs.readFileSync(f, 'utf8');
    const scripts = html.match(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi) || [];
    if (scripts.length === 0) {
      console.log('  No inline scripts found');
    } else {
      scripts.forEach((s, i) => {
        const code = s.replace(/<script(?![^>]*src)[^>]*>/i, '').replace(/<\/script>/gi, '').trim();
        if (!code) return;
        try {
          new vm.Script(code, { filename: f });
          console.log(`  Script ${i+1}: OK`);
        } catch (e) {
          console.log(`  Script ${i+1}: SYNTAX ERROR - ${e.message}`);
        }
      });
    }
  } catch (e) {
    console.log(`  FILE ERROR: ${e.message}`);
  }
}
