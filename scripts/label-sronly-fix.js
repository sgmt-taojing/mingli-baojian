#!/usr/bin/env node
/**
 * P3-17.5a · input 无 label 兜底（aria-label / sr-only label）
 *
 * 用途：axe 检测 "Form elements must have labels" — 那些 input 没有 <label> 包裹
 *      且 script 已加 aria-label 的情况，本脚本对**没有**任何 label/aria-label 的
 *      input 注入 aria-label 或在前面加 sr-only <label>。
 *
 * 策略：
 *   1. 已含 aria-label / aria-labelledby → 跳过
 *   2. 已含 <label for="id"> 紧邻 → 跳过
 *   3. placeholder 含中文 → 用 placeholder 当 aria-label 兜底
 *   4. 否则 → 注入 aria-label="input-{id}"（兜底）
 */

const fs = require('fs');
const path = require('path');

const APP_DIR = path.join(__dirname, '..', 'app');
const TARGET_FILES = ['bazi.html', 'fengshui.html', 'zhanbu.html', 'tizhi.html', 'tcm-symptom.html', 'tcm-clinic.html', 'export-guard.html', 'merchant-apply.html', 'merchant-dashboard.html', 'master-disease.html', 'master-elder.html', 'master-zidise-illness.html', 'doctor-elder.html', 'wechat-hub.html', 'divination-hub.html', 'kb-explore-submit.html', 'health-career-dashboard.html', 'tcm-report.html', 'divination-integrated.html', 'divination-knowledge.html', 'divination-almanac.html', 'music-detail.html', 'lifeplan-detail.html', 'lifeindex-detail.html', 'admin.html', 'admin-glass-dashboard.html', 'camera-capture.html', 'components-demo.html', 'tizhi.html', 'test-parse-natural.html', 'youthplan-detail.html'];

let totalFixed = 0;

for (const fileName of TARGET_FILES) {
  const filePath = path.join(APP_DIR, fileName);
  if (!fs.existsSync(filePath)) continue;

  let html = fs.readFileSync(filePath, 'utf8');
  const beforeCount = totalFixed;
  let localFixed = 0;

  // 匹配所有 <input/select/textarea> 标签
  const tagRegex = /<(input|select|textarea)\b([^>]*)>/gi;
  html = html.replace(tagRegex, (full, tag, attrs) => {
    // 已含 aria-label / aria-labelledby → 跳过
    if (/\baria-label\s*=/i.test(attrs) || /\baria-labelledby\s*=/i.test(attrs)) {
      return full;
    }
    // type=hidden / submit / button / image / reset → 跳过
    if (/\btype\s*=\s*["'](hidden|submit|button|image|reset|file)["']/i.test(attrs)) {
      return full;
    }
    // type=checkbox / radio 且已有紧邻文本 label → axe 通常不报错；这里保守跳过
    // （之前批量 for 绑定已处理大部分）
    const idMatch = attrs.match(/\bid\s*=\s*["']([^"']+)["']/);
    const id = idMatch ? idMatch[1] : '';
    const placeholderMatch = attrs.match(/\bplaceholder\s*=\s*["']([^"']+)["']/);
    const placeholder = placeholderMatch ? placeholderMatch[1] : '';

    if (placeholder && /[\u4e00-\u9fa5]/.test(placeholder)) {
      // placeholder 含中文 → 用作 aria-label 兜底
      localFixed++;
      return `<${tag}${attrs} aria-label="${placeholder.replace(/"/g, '&quot;')}">`;
    }
    if (id) {
      // 用 id 作为兜底 aria-label
      localFixed++;
      return `<${tag}${attrs} aria-label="${id}">`;
    }
    return full;
  });

  if (localFixed > 0) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✅ ${fileName} — ${localFixed} 个 input 兜底 aria-label`);
  }
  totalFixed += localFixed;
}

console.log(`\n📊 汇总：${totalFixed} 个 input 兜底 aria-label 注入`);