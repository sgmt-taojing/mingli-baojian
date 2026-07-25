// ================================================================
//  PWA SERVICE WORKER & INSTALL BANNER
// ================================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}


// ================================================================
//  GLOBAL DATA
// ================================================================

let STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
let BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
let ELE = {甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
let ZHI_ELE = {子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'};

// 六十甲子纳音表
const NAYIN_TABLE = [
'海中金','海中金','炉中火','炉中火','大林木','大林木','路旁土','路旁土','剑锋金','剑锋金',
'山头火','山头火','涧下水','涧下水','城头土','城头土','白蜡金','白蜡金','杨柳木','杨柳木',
'泉中水','泉中水','屋上土','屋上土','霹雳火','霹雳火','松柏木','松柏木','长流水','长流水',
'沙中金','沙中金','山下火','山下火','平地木','平地木','壁上土','壁上土','金箔金','金箔金',
'覆灯火','覆灯火','天河水','天河水','大驿土','大驿土','钗钏金','钗钏金','桑柘木','桑柘木',
'大溪水','大溪水','沙中土','沙中土','天上火','天上火','石榴木','石榴木','大海水','大海水'
];


// ================================================================
//  EXPORT ENGINE (HTML / PDF / Word)
// ================================================================

function exportHTML() {
  let name = document.getElementById('baziNameOut') ? document.getElementById('baziNameOut').textContent : '乾元命理报告';
  let meta = document.getElementById('baziMetaOut') ? document.getElementById('baziMetaOut').textContent : '';
  let html = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>'+name+'</title>';
  html += '<style>body{font-family:"Songti SC","SimSun",serif;max-width:800px;margin:0 auto;padding:40px 20px;background:var(--paper);color:var(--ink3);line-height:1.8}';
  html += 'h1{text-align:center;color:var(--gold3);border-bottom:2px solid var(--gold);padding-bottom:16px}';
  html += 'h2{color:var(--gold3);margin-top:32px;border-left:4px solid var(--gold);padding-left:12px}';
  html += 'table{width:100%;border-collapse:collapse;margin:16px 0}';
  html += 'td,th{padding:8px 12px;border:1px solid var(--gold2);text-align:center}';
  html += '.gang{display:flex;justify-content:center;gap:8px;margin:16px 0;font-size:28px}';
  html += '.gz{background:var(--paper);padding:8px 16px;border-radius:8px;text-align:center}';
  html += '.g,.z{font-size:28px}';
  html += '.warn{background:var(--gold2);border:1px solid var(--warn);padding:16px;border-radius:8px;margin:16px 0}';
  html += '.section{margin:24px 0;padding:20px;background:var(--paper);border-radius:8px}';
  html += 'h3{color:var(--gold3);margin-top:0}';
  html += 'ul{padding-left:24px}';
  html += 'li{margin:6px 0}';
  html += 'footer{text-align:center;color:var(--paper3);font-size:12px;margin-top:40px;padding-top:20px;border-top:1px solid var(--border)}';
  html += '/* R36·健康事业双核 + 12 领域生活矩阵 */';
  html += '.life-dashboard{padding:18px;background:linear-gradient(135deg,rgba(74,154,110,.05),rgba(201,168,76,.05));border-radius:14px;margin:20px 0;border:1px solid var(--line)}';
  html += '.life-dual-core{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px}';
  html += '.life-core-card{padding:14px;border-radius:10px;border:1px solid var(--line);background:rgba(255,255,255,.04)}';
  html += '.life-core-card.health{border-left:4px solid #4a9a6e;background:linear-gradient(135deg,rgba(74,154,110,.08),rgba(255,255,255,.02))}';
  html += '.life-core-card.career{border-left:4px solid #4a8aa8;background:linear-gradient(135deg,rgba(74,138,168,.08),rgba(255,255,255,.02))}';
  html += '.life-core-title{font-size:14px;font-weight:600;margin-bottom:8px;display:flex;align-items:center;gap:6px}';
  html += '.life-core-card.health .life-core-title{color:#4a9a6e}';
  html += '.life-core-card.career .life-core-title{color:#4a8aa8}';
  html += '.life-core-score{font-size:28px;font-weight:700;letter-spacing:1px}';
  html += '.life-core-card.health .life-core-score{color:#4a9a6e}';
  html += '.life-core-card.career .life-core-score{color:#4a8aa8}';
  html += '.life-core-bar{height:6px;background:rgba(0,0,0,.3);border-radius:3px;overflow:hidden;margin:8px 0}';
  html += '.life-core-fill{height:100%;border-radius:3px;transition:.4s}';
  html += '.life-core-card.health .life-core-fill{background:linear-gradient(90deg,#4a9a6e,#7ab86e)}';
  html += '.life-core-card.career .life-core-fill{background:linear-gradient(90deg,#4a8aa8,#6ab0d0)}';
  html += '.life-core-meta{display:flex;justify-content:space-between;font-size:11px;opacity:.7;margin-top:6px}';
  html += '.life-core-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:10px}';
  html += '.life-core-tag{padding:3px 8px;background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.2);border-radius:10px;font-size:10px}';
  html += '.life-core-card.health .life-core-tag{background:rgba(74,154,110,.08);border-color:rgba(74,154,110,.3);color:#7ab86e}';
  html += '.life-core-card.career .life-core-tag{background:rgba(74,138,168,.08);border-color:rgba(74,138,168,.3);color:#6ab0d0}';
  html += '.life-12matrix{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}';
  html += '.life-12cell{padding:10px;background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:8px;cursor:pointer;transition:.2s}';
  html += '.life-12cell:hover{background:rgba(201,168,76,.08);border-color:var(--gold);transform:translateY(-1px)}';
  html += '.life-12icon{font-size:18px;display:block;margin-bottom:4px}';
  html += '.life-12name{font-size:12px;color:var(--gold);font-weight:600;margin-bottom:2px}';
  html += '.life-12score{font-size:11px;opacity:.7;line-height:1.5}';
  html += '.life-12stars{font-size:10px;margin-top:4px;letter-spacing:1px;color:var(--gold)}';
  html += '.life-12verdict{margin-top:14px;padding:12px;background:rgba(0,0,0,.2);border-radius:8px;border:1px dashed var(--gold);font-size:12px;line-height:1.9}';
  html += '.life-action-list{margin-top:12px;padding:10px 14px;background:rgba(201,168,76,.05);border-radius:8px;border-left:3px solid var(--gold)}';
  html += '.life-action-list b{color:var(--gold);margin-right:6px}';
  html += '.life-action-list li{margin-bottom:6px;font-size:12px;line-height:1.6;list-style:none}';
  html += '.life-source{font-size:10px;opacity:.4;margin-top:10px;padding-top:6px;border-top:1px dashed var(--line);letter-spacing:1px;text-align:right}';
  html += '@media(max-width:768px){.life-dual-core{grid-template-columns:1fr}.life-12matrix{grid-template-columns:repeat(2,1fr)}}';
  html += '<style>';
  html += '/* R41-A 双核速查块 */';
  html += '.dh-huajie4-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin:14px 0}';
  html += '.dh-huajie4-card{background:linear-gradient(135deg,rgba(212,175,55,.08),rgba(74,138,168,.05));border:1px solid rgba(212,175,55,.25);border-radius:12px;padding:16px;position:relative;overflow:hidden}';
  html += '.dh-huajie4-card::before{content:\'\';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#d4af37,#4a8aa8)}';
  html += '.dh-huajie4-head{display:flex;align-items:center;gap:8px;margin-bottom:10px}';
  html += '.dh-huajie4-icon{font-size:24px}';
  html += '.dh-huajie4-title{font-size:15px;font-weight:600;color:var(--gold,#d4af37);letter-spacing:1px}';
  html += '.dh-huajie4-score{margin-left:auto;font-size:13px;padding:3px 10px;border-radius:8px;background:rgba(74,154,110,.15);color:#4a9a6e;font-weight:600}';
  html += '.dh-huajie4-score.warn{background:rgba(212,80,80,.15);color:#d45050}';
  html += '.dh-huajie4-body{font-size:12px;color:var(--paper3,rgba(255,255,255,.7));line-height:1.7}';
  html += '.dh-huajie4-row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px dashed rgba(255,255,255,.06)}';
  html += '.dh-huajie4-row:last-child{border-bottom:none}';
  html += '.dh-huajie4-key{opacity:.75}';
  html += '.dh-huajie4-val{font-weight:500;color:var(--paper,rgba(255,255,255,.95))}';
  html += '.dh-huajie4-tips{margin-top:10px;padding:10px;background:rgba(212,175,55,.08);border-radius:8px;font-size:11.5px;line-height:1.7;border-left:3px solid var(--gold)}';
  html += '.dh-huajie4-tips b{color:var(--gold)}';
  html += '.dh-huajie4-classic{margin-top:10px;font-size:10.5px;opacity:.95;font-style:italic;text-align:right}';
  html += '@media(max-width:768px){.dh-huajie4-grid{grid-template-columns:1fr}}';
  html += '</style>';

  html += '</style>';
  html += '/* R41-A divination-hub 化解 4 宫 CSS */';
  html += '.dh-qianyi-section { background: linear-gradient(135deg, #1a2332 0%, #0f1820 100%); border: 1px solid rgba(255,180,77,0.3); border-radius: 12px; padding: 20px; margin: 16px 0; }';
  html += '.dh-qianyi-title { color: #ffb44d; font-size: 18px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }';
  html += '.dh-qianyi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }';
  html += '.dh-qianyi-card { background: rgba(255,180,77,0.08); border: 1px solid rgba(255,180,77,0.2); border-radius: 8px; padding: 12px; }';
  html += '.dh-qianyi-card-title { color: #ffb44d; font-size: 14px; font-weight: 600; margin-bottom: 8px; }';
  html += '.dh-qianyi-card-content { color: #c5d1de; font-size: 13px; line-height: 1.6; }';
  html += '.dh-qianyi-tag { display: inline-block; padding: 2px 8px; background: rgba(255,180,77,0.15); border-radius: 4px; font-size: 11px; margin-right: 4px; margin-top: 4px; }';

  html += '.dh-fude-section { background: linear-gradient(135deg, #2a1f3a 0%, #1a0f25 100%); border: 1px solid rgba(192,132,252,0.3); border-radius: 12px; padding: 20px; margin: 16px 0; }';
  html += '.dh-fude-title { color: #c084fc; font-size: 18px; font-weight: 700; margin-bottom: 12px; }';
  html += '.dh-fude-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }';
  html += '.dh-fude-card { background: rgba(192,132,252,0.08); border: 1px solid rgba(192,132,252,0.2); border-radius: 8px; padding: 12px; }';
  html += '.dh-fude-card-title { color: #c084fc; font-size: 14px; font-weight: 600; margin-bottom: 8px; }';
  html += '.dh-fude-card-content { color: #c5d1de; font-size: 13px; line-height: 1.6; }';

  html += '.dh-xiongdi-section { background: linear-gradient(135deg, #1f2a1f 0%, #0f1a0f 100%); border: 1px solid rgba(120,200,120,0.3); border-radius: 12px; padding: 20px; margin: 16px 0; }';
  html += '.dh-xiongdi-title { color: #78c878; font-size: 18px; font-weight: 700; margin-bottom: 12px; }';
  html += '.dh-xiongdi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }';
  html += '.dh-xiongdi-card { background: rgba(120,200,120,0.08); border: 1px solid rgba(120,200,120,0.2); border-radius: 8px; padding: 12px; }';
  html += '.dh-xiongdi-card-title { color: #78c878; font-size: 14px; font-weight: 600; margin-bottom: 8px; }';
  html += '.dh-xiongdi-card-content { color: #c5d1de; font-size: 13px; line-height: 1.6; }';

  html += '.dh-tianzhai-section { background: linear-gradient(135deg, #2a1a1f 0%, #1a0f15 100%); border: 1px solid rgba(248,113,113,0.3); border-radius: 12px; padding: 20px; margin: 16px 0; }';
  html += '.dh-tianzhai-title { color: #f87171; font-size: 18px; font-weight: 700; margin-bottom: 12px; }';
  html += '.dh-tianzhai-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }';
  html += '.dh-tianzhai-card { background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2); border-radius: 8px; padding: 12px; }';
  html += '.dh-tianzhai-card-title { color: #f87171; font-size: 14px; font-weight: 600; margin-bottom: 8px; }';
  html += '.dh-tianzhai-card-content { color: #c5d1de; font-size: 13px; line-height: 1.6; }';

  html += '.dh-huajie-stats { display: flex; justify-content: space-around; gap: 12px; margin: 16px 0; padding: 12px; background: rgba(99,179,237,0.05); border-radius: 8px; }';
  html += '.dh-huajie-stat { text-align: center; }';
  html += '.dh-huajie-stat-value { color: #63b3ed; font-size: 24px; font-weight: 700; }';
  html += '.dh-huajie-stat-label { color: #8a9bb0; font-size: 12px; margin-top: 4px; }';

  html += '.dh-huajie-search { background: rgba(99,179,237,0.08); border-radius: 8px; padding: 12px; margin: 16px 0; }';
  html += '.dh-huajie-search-input { width: 100%; padding: 8px 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(99,179,237,0.3); border-radius: 6px; color: #fff; font-size: 13px; }';
  html += '.dh-huajie-search-result { color: #c5d1de; font-size: 12px; margin-top: 8px; padding: 8px; background: rgba(99,179,237,0.05); border-radius: 4px; }';
  html += '</head><body>';

  html += '<h1>'+name+'</h1>';
  if (meta) html += '<p style="text-align:center;color:var(--steel);margin-top:-16px">'+meta+'</p>';

  // Pillar
  let pillerDiv = document.querySelector('.pillar-render') || document.querySelector('.baZi-output');
  if (pillerDiv) {
    html += '<div class="section"><h2>四柱八字</h2>';
    html += '<div class="gang">';
    for (let i=0;i<4;i++){
      let g=document.getElementById('bz'+i+'g');let z=document.getElementById('bz'+i+'z');
      if(g&&z) html+='<div class="gz"><div class="g">'+g.textContent+'</div><div class="z">'+z.textContent+'</div></div>';
    }
    html += '</div></div>';
  }

  // Analysis
  let cards = document.querySelectorAll('.analysis-card');
  if (cards.length > 0) {
    html += '<div class="section"><h2>命理分析</h2>';
    cards.forEach(function(c){
      let h=c.querySelector('h5');let p=c.querySelector('p');
      if(h&&p) html += '<h3>'+h.textContent+'</h3><p>'+p.textContent+'</p>';
    });
    html += '</div>';
  }

  // Warnings
  let warns = document.querySelectorAll('.warning-box,.risk-alert,.bazi-warn');
  if (warns.length > 0) {
    html += '<div class="warn"><h2 style="margin-top:0;border:none;padding:0">⚠️ 重点注意事项</h2>';
    warns.forEach(function(w){ html += '<p>'+w.textContent+'</p>'; });
    html += '</div>';
  }

  // Five elements bar
  let bar = document.getElementById('eleBar');
  if (bar) {
    let segs = bar.querySelectorAll('.ele-seg');
    if (segs.length > 0) {
      html += '<div class="section"><h2>五行分布</h2><div style="display:flex;height:24px;border-radius:12px;overflow:hidden">';
      segs.forEach(function(s){ html += '<div style="width:'+s.style.width+';background:'+s.style.background+';min-height:24px"></div>'; });
      html += '</div></div>';
    }
  }

  html += '<footer>易道智鉴 · 命理报告 · 生成时间：'+new Date().toLocaleString('zh-CN')+'</footer>';
  html += '<\/body><\/html>';

  downloadBlob(html, name+'.html', 'text/html;charset=utf-8');
  showToast('HTML 报告已下载');
}

function exportPDF() {
  exportHTML();
  setTimeout(function(){ showToast('HTML 已下载，请用浏览器打印为 PDF（Ctrl+P → 另存为PDF）'); }, 500);
}

function downloadBlob(content, filename, mimeType) {
  let blob = new Blob([content], {type: mimeType});
  let url = URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportCurrentSection() {
  let active = document.querySelector('.nav-btn.active');
  if (!active) { showToast('请先选择一个功能模块'); return; }
  let sectionId = active.getAttribute('data-section');
  let section = document.getElementById(sectionId);
  if (!section) { showToast('未找到对应内容'); return; }
  let html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + (active.textContent||'导出') + '</title>';
  html += '<style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px;background:#1a1a1a;color:#eee}';
  html += 'h1,h2,h3{color:#c9a84c}pre{background:#222;padding:12px;border-radius:8px;overflow:auto}</style>';
  html += '</head><body>' + section.innerHTML;
  html += '<h2>R41-A · 化解 4 宫</h2>';
  html += '<div id="dh-huajie-stats"></div>';
  html += '<div class="dh-huajie-search"><input placeholder="搜索化解建议..." oninput="window.searchDH4Gong && window.searchDH4Gong(this.value)"><div id="dh-huajie-search-result"></div></div>';
  html += '<div id="section-dh-qianyi"></div>';
  html += '<div id="section-dh-fude"></div>';
  html += '<div id="section-dh-xiongdi"></div>';
  html += '<div id="section-dh-tianzhai"></div>';
  html += '<script>window.searchDH4Gong = function(q){q=(q||"").trim();var r=document.getElementById("dh-huajie-search-result");if(!q){r.textContent="";return;}if(!window.DH_HUAJIE_4GONG){r.textContent="请先加载化解数据";return;}var hits=[];Object.entries(window.DH_HUAJIE_4GONG).forEach(function(kv){var g=kv[1];g.modules.forEach(function(m){if(m.title.indexOf(q)>=0||m.content.indexOf(q)>=0||m.tag.indexOf(q)>=0){hits.push("["+g.name+"] "+m.title+" · "+m.content.substring(0,40)+"...");}});});r.textContent=hits.length?"命中 "+hits.length+" 条: "+hits.slice(0,3).join(" | "):"未命中";};<\/script>';
  html += '<script src="js/rbac-client.js"><\/script>';
  html += '<script src="knowledge-models/classics-model.js"><\/script>';
  html += '<script src="knowledge-models/faith-model.js"><\/script>';
  html += '<script src="knowledge-models/fengshui-model.js"><\/script>';
  html += '<script src="knowledge-models/huajie-model.js"><\/script>';
  html += '<script src="knowledge-models/liuren-model.js"><\/script>';
  html += '<script src="knowledge-models/liuyao-model.js"><\/script>';
  html += '<script src="knowledge-models/mantra-model.js"><\/script>';
  html += '<script src="knowledge-models/meihua-model.js"><\/script>';
  html += '<script src="knowledge-models/nihaisha-model.js"><\/script>';
  html += '<script src="knowledge-models/qimen-model.js"><\/script>';
  html += '<script src="knowledge-models/shuhan-model.js"><\/script>';
  html += '<script src="knowledge-models/yanzhi-model.js"><\/script>';
  html += '<script src="knowledge-models/yijing-model.js"><\/script>';
  html += '<script src="knowledge-models/ziwei-model.js"><\/script>';
  html += '<script src="knowledge-models/zodiac-model.js"><\/script>';
  html += '<\/body><\/html>';
  let blob = new Blob([html], {type: 'text/html'});
  let url = URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url;
  a.download = (active.textContent || '导出') + '.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('已导出 HTML');
}