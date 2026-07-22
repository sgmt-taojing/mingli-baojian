// skill-vetter v1
const fs = require('fs');
const path = require('path');

const SKILLS_DIRS = [
  '/Users/tom/.openclaw-autoclaw/skills',
  '/Users/tom/.openclaw-autoclaw/workspace/skills',
  '/Users/tom/.openclaw-autoclaw/plugin-skills',
  '/Users/tom/.agents/skills'
];

let totalSkills = 0;
let auditedSkills = 0;
let missingFrontmatter = 0;
let brokenRefs = 0;
let report = [];

SKILLS_DIRS.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const skills = fs.readdirSync(dir).filter(n => !n.startsWith('.'));
  skills.forEach(name => {
    const fp = path.join(dir, name, 'SKILL.md');
    if (!fs.existsSync(fp)) return;
    totalSkills++;
    const content = fs.readFileSync(fp, 'utf-8');
    const lines = content.split('\n').length;
    const size = content.length;
    const hasFront = content.startsWith('---');
    const hasVer = /^version:/m.test(content);
    if (!hasFront) missingFrontmatter++;
    // check references
    const refs = content.match(/`([a-zA-Z0-9_\-\.\/]+\.(?:js|py|md|json|html|css))`/g) || [];
    const broken = refs.filter(r => {
      const relPath = r.slice(1, -1);
      const absPath = path.join(path.dirname(fp), relPath);
      return !fs.existsSync(absPath);
    });
    if (broken.length) brokenRefs++;
    report.push({ name, dir, lines, size, hasFront, hasVer, broken: broken.length });
    auditedSkills++;
  });
});

const out = `# Skill 体检报告 (${new Date().toISOString().slice(0,10)})\n\n## 总览\n- **扫描目录**：${SKILLS_DIRS.length}\n- **总 skills**：${totalSkills}\n- **已审计**：${auditedSkills}\n- **缺 frontmatter**：${missingFrontmatter}\n- **引用断裂**：${brokenRefs}\n\n## 明细\n| Skill | 行 | 字节 | frontmatter | version | 断裂 |\n|-------|---|------|----|----|----|\n` + report.map(r => `| ${r.name} | ${r.lines} | ${r.size} | ${r.hasFront?'✅':'❌'} | ${r.hasVer?'✅':'❌'} | ${r.broken} |`).join('\n');

const outPath = `/Users/tom/.openclaw-autoclaw/workspace/docs/skill-audit-${new Date().toISOString().slice(0,10).replace(/-/g,'')}.md`;
fs.writeFileSync(outPath, out);
console.log(`✅ 报告已生成：${outPath}`);
console.log(`📊 总 ${totalSkills} skills，缺 frontmatter ${missingFrontmatter}，引用断裂 ${brokenRefs}`);
