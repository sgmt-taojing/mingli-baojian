const fs = require('fs');
const vm = require('vm');

let code = fs.readFileSync('.openclaw/tmp/fengshui_core_block.txt', 'utf-8');

// 替换 IIFE 调用参数为 globalThis（在 vm context 中可用）
code = code.replace("typeof window !== 'undefined' ? window : this", "globalThis");

const ctx = { console: console };
ctx.window = ctx;
ctx.global = ctx;
ctx.globalThis = ctx;
vm.createContext(ctx);

try {
  vm.runInContext(code, ctx, { displayErrors: true });
  console.log('=== FENGSHUI ENGINE TEST ===');
  const results = ctx.FENGSHUI.runTests();
  results.forEach(r => {
    console.log((r.pass ? '✓' : '✗') + ' ' + r.name);
    if (!r.pass) console.log('  detail: ' + r.detail);
  });
  const sum = ctx.FENGSHUI.summaryTests(results);
  console.log('\nTotal: ' + sum.passed + '/' + sum.total + ' passed');
  if (sum.failed > 0) process.exit(1);
} catch (e) {
  console.error('ERROR:', e.message);
  console.error(e.stack);
  process.exit(1);
}
