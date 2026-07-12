const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname);
const htmlPath = path.join(projectRoot, 'app/divination-hub.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// Extract all section IDs and check content length
const sectionRegex = /<section[^>]*id="(section-[^"]+)"[^>]*>/g;
let match;
const sections = [];
while ((match = sectionRegex.exec(html)) !== null) {
  const id = match[1];
  const startIdx = match.index;
  
  // Find closing </section>
  let depth = 1;
  let pos = startIdx + match[0].length;
  while (depth > 0 && pos < html.length) {
    const openIdx = html.indexOf('<section', pos);
    const closeIdx = html.indexOf('</section>', pos);
    if (closeIdx === -1) break;
    if (openIdx !== -1 && openIdx < closeIdx) {
      depth++;
      pos = openIdx + 1;
    } else {
      depth--;
      pos = closeIdx + '</section>'.length;
    }
  }
  
  const content = html.substring(startIdx + match[0].length, pos - '</section>'.length);
  const textContent = content.replace(/<[^>]+>/g, '').replace(/\s+/g, '').trim();
  
  sections.push({
    id,
    contentLength: content.length,
    textLength: textContent.length,
    hasContent: textContent.length > 20
  });
}

console.log('=== Section Content Check ===');
sections.forEach(s => {
  console.log(`  ${s.hasContent ? '✅' : '❌'} ${s.id} (text: ${s.textLength} chars, html: ${s.contentLength} chars)`);
});

// Check morePanel content
console.log('\n=== MorePanel Content Check ===');
const panelRegex = /<div[^>]*id="(morePanel-[^"]+)"[^>]*>/g;
while ((match = panelRegex.exec(html)) !== null) {
  const id = match[1];
  const startIdx = match.index;
  // Find closing tag
  let depth = 1;
  let pos = startIdx + match[0].length;
  const tagMatch = html.substring(startIdx).match(/<(\w+)/);
  if (!tagMatch) continue;
  const tag = tagMatch[1];
  const closeTag = `</${tag}>`;
  while (depth > 0 && pos < html.length) {
    const openIdx = html.indexOf(`<${tag}`, pos);
    const closeIdx = html.indexOf(closeTag, pos);
    if (closeIdx === -1) break;
    if (openIdx !== -1 && openIdx < closeIdx) {
      depth++;
      pos = openIdx + 1;
    } else {
      depth--;
      pos = closeIdx + closeTag.length;
    }
  }
  const content = html.substring(startIdx + match[0].length, pos - closeTag.length);
  const textContent = content.replace(/<[^>]+>/g, '').replace(/\s+/g, '').trim();
  console.log(`  ${textContent.length > 20 ? '✅' : '❌'} ${id} (text: ${textContent.length} chars)`);
}

// Check zhanbuSub content
console.log('\n=== ZhanbuSub Content Check ===');
const zbRegex = /<div[^>]*id="(zhanbuSub-[^"]+)"[^>]*>/g;
while ((match = zbRegex.exec(html)) !== null) {
  const id = match[1];
  const startIdx = match.index;
  let depth = 1;
  let pos = startIdx + match[0].length;
  const tagMatch = html.substring(startIdx).match(/<(\w+)/);
  if (!tagMatch) continue;
  const tag = tagMatch[1];
  const closeTag = `</${tag}>`;
  while (depth > 0 && pos < html.length) {
    const openIdx = html.indexOf(`<${tag}`, pos);
    const closeIdx = html.indexOf(closeTag, pos);
    if (closeIdx === -1) break;
    if (openIdx !== -1 && openIdx < closeIdx) {
      depth++;
      pos = openIdx + 1;
    } else {
      depth--;
      pos = closeIdx + closeTag.length;
    }
  }
  const content = html.substring(startIdx + match[0].length, pos - closeTag.length);
  const textContent = content.replace(/<[^>]+>/g, '').replace(/\s+/g, '').trim();
  console.log(`  ${textContent.length > 20 ? '✅' : '❌'} ${id} (text: ${textContent.length} chars)`);
}

// Check xingmingSub content
console.log('\n=== XingmingSub Content Check ===');
const xmRegex = /<div[^>]*id="(xingmingSub-[^"]+)"[^>]*>/g;
while ((match = xmRegex.exec(html)) !== null) {
  const id = match[1];
  const startIdx = match.index;
  let depth = 1;
  let pos = startIdx + match[0].length;
  const tagMatch = html.substring(startIdx).match(/<(\w+)/);
  if (!tagMatch) continue;
  const tag = tagMatch[1];
  const closeTag = `</${tag}>`;
  while (depth > 0 && pos < html.length) {
    const openIdx = html.indexOf(`<${tag}`, pos);
    const closeIdx = html.indexOf(closeTag, pos);
    if (closeIdx === -1) break;
    if (openIdx !== -1 && openIdx < closeIdx) {
      depth++;
      pos = openIdx + 1;
    } else {
      depth--;
      pos = closeIdx + closeTag.length;
    }
  }
  const content = html.substring(startIdx + match[0].length, pos - closeTag.length);
  const textContent = content.replace(/<[^>]+>/g, '').replace(/\s+/g, '').trim();
  console.log(`  ${textContent.length > 20 ? '✅' : '❌'} ${id} (text: ${textContent.length} chars)`);
}

// Check fengshui sub content
console.log('\n=== Fengshui Sub Content Check ===');
['fengshui-content', 'luopan-content'].forEach(id => {
  const idx = html.indexOf(`id="${id}"`);
  if (idx === -1) { console.log(`  ❌ ${id} NOT FOUND`); return; }
  const startIdx = html.lastIndexOf('<', idx);
  const tagMatch = html.substring(startIdx).match(/<(\w+)/);
  if (!tagMatch) return;
  const tag = tagMatch[1];
  const closeTag = `</${tag}>`;
  let depth = 1;
  let pos = idx + id.length + 2;
  while (depth > 0 && pos < html.length) {
    const openIdx = html.indexOf(`<${tag}`, pos);
    const closeIdx = html.indexOf(closeTag, pos);
    if (closeIdx === -1) break;
    if (openIdx !== -1 && openIdx < closeIdx) {
      depth++;
      pos = openIdx + 1;
    } else {
      depth--;
      pos = closeIdx + closeTag.length;
    }
  }
  const content = html.substring(startIdx, pos);
  const textContent = content.replace(/<[^>]+>/g, '').replace(/\s+/g, '').trim();
  console.log(`  ${textContent.length > 20 ? '✅' : '❌'} ${id} (text: ${textContent.length} chars)`);
});

// Check mastersPanel content
console.log('\n=== MastersPanel Content Check ===');
['mastersPanel-taoist','mastersPanel-buddhist','mastersPanel-tcm','mastersPanel-precepts'].forEach(id => {
  const idx = html.indexOf(`id="${id}"`);
  if (idx === -1) { console.log(`  ❌ ${id} NOT FOUND`); return; }
  const startIdx = html.lastIndexOf('<', idx);
  const tagMatch = html.substring(startIdx).match(/<(\w+)/);
  if (!tagMatch) return;
  const tag = tagMatch[1];
  const closeTag = `</${tag}>`;
  let depth = 1;
  let pos = idx + id.length + 2;
  while (depth > 0 && pos < html.length) {
    const openIdx = html.indexOf(`<${tag}`, pos);
    const closeIdx = html.indexOf(closeTag, pos);
    if (closeIdx === -1) break;
    if (openIdx !== -1 && openIdx < closeIdx) {
      depth++;
      pos = openIdx + 1;
    } else {
      depth--;
      pos = closeIdx + closeTag.length;
    }
  }
  const content = html.substring(startIdx, pos);
  const textContent = content.replace(/<[^>]+>/g, '').replace(/\s+/g, '').trim();
  console.log(`  ${textContent.length > 20 ? '✅' : '❌'} ${id} (text: ${textContent.length} chars)`);
});

// Check knowledge detail inline divs
console.log('\n=== Knowledge Detail Inline Div Check ===');
['kd-bagua','kd-liushisigua','kd-bazi','kd-qimen','kd-wuxing','kd-fengshui','kd-shishen','kd-nayin','kd-shensha','kd-hechong','kd-liuyao','kd-xingming'].forEach(id => {
  const idx = html.indexOf(`id="${id}"`);
  if (idx === -1) { console.log(`  ❌ ${id} NOT FOUND`); return; }
  const startIdx = html.lastIndexOf('<', idx);
  const tagMatch = html.substring(startIdx).match(/<(\w+)/);
  if (!tagMatch) return;
  const tag = tagMatch[1];
  const closeTag = `</${tag}>`;
  let depth = 1;
  let pos = idx + id.length + 2;
  while (depth > 0 && pos < html.length) {
    const openIdx = html.indexOf(`<${tag}`, pos);
    const closeIdx = html.indexOf(closeTag, pos);
    if (closeIdx === -1) break;
    if (openIdx !== -1 && openIdx < closeIdx) {
      depth++;
      pos = openIdx + 1;
    } else {
      depth--;
      pos = closeIdx + closeTag.length;
    }
  }
  const content = html.substring(startIdx, pos);
  const textContent = content.replace(/<[^>]+>/g, '').replace(/\s+/g, '').trim();
  console.log(`  ${textContent.length > 20 ? '✅' : '❌'} ${id} (text: ${textContent.length} chars)`);
});
