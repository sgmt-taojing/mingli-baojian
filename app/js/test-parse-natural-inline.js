
function runtest(){
  const text = document.getElementById('in').value.trim();
  if(!text)return;
  const r = parse_natural_query(text);
  const html = `<div style="margin-bottom:8px">输入：<b>${text}</b></div>
    <div>模块：<b>${r.module || '⚠️ 未识别'}</b></div>
    <div>命中分：${r.confidence}</div>
    <div>提取：<code>${JSON.stringify(r.data)}</code></div>
    <div style="margin-top:8px;color:${r.module?'#7ad97a':'#ff6b6b'}">
      ${r.module?'✅ 已路由到「'+r.module+'」模块':'❌ 需引导用户明确意图'}
    </div>`;
  document.getElementById('result').innerHTML = html;
}

const cases = [
  'LIU套5815','刘师傅测一下','我的手机13800138000怎么样',
  '车牌京A12345好不好','我想算八字','我要择日结婚','起名王小明',
  '我的事业','犯太岁如何化解','2026年运势','刘青云 13579',
  '测算风水布局','紫微命盘','六爻排卦','奇门遁甲'
];

let hits = 0;
const batch = document.getElementById('batch');
cases.forEach(t => {
  const r = parse_natural_query(t);
  const ok = r.module !== null;
  if(ok)hits++;
  const row = document.createElement('div');
  row.className = 'row';
  row.innerHTML = `${ok?'<span class="ok">✅</span>':'<span class="miss">⚠️</span>'} <b>${t.padEnd(20)}</b> → ${r.module || 'null'} (conf:${r.confidence})`;
  batch.appendChild(row);
});
document.getElementById('hitCount').textContent = hits;
runtest();
