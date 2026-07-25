// ================================================================
//  EXPORT & SHOP LINKS FUNCTIONS
// ================================================================

function exportReport(title, contentHtml) {
  const timestamp = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const style = 'body { font-family: "Noto Serif SC", serif; background: #080808; color: #f0e8d8; padding: 40px; line-height: 1.8; } h1, h2, h3 { font-family: "Ma Shan Zheng", serif; color: #c9a84c; letter-spacing: 6px; } h1 { text-align: center; border-bottom: 1px solid rgba(201,168,76,0.2); padding-bottom: 20px; margin-bottom: 30px; } .container { max-width: 800px; margin: 0 auto; } .meta { text-align: center; font-size: 12px; opacity: 0.5; margin-bottom: 40px; letter-spacing: 2px; } .section { margin-bottom: 40px; padding: 28px; background: rgba(255,255,255,0.02); border: 1px solid rgba(201,168,76,0.08); } .ele-bar { display: flex; height: 6px; border-radius: 3px; overflow: hidden; gap: 2px; margin: 12px 0; } .ele-seg { border-radius: 2px; }';
  
  const html = '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n<title>命理通鉴 · ' + title + '</title>\n<style>' + style + '</style>\n</head>\n<body>\n  <div class="container">\n    <h1>命理通鉴 · ' + title + '</h1>\n    <p style="text-align:center;font-size:12px;opacity:0.5;letter-spacing:2px">生成时间：' + timestamp + ' | 命理通鉴 AI 占卜平台</p>\n    ' + contentHtml + '\n    <div style="text-align:center;margin-top:60px;padding-top:20px;border-top:1px solid rgba(201,168,76,0.15)">\n      <p style="font-size:11px;opacity:0.4;letter-spacing:2px">命理通鉴 · 古老预测术集成 · AI驱动</p>\n      <p style="font-size:10px;opacity:0.3;margin-top:8px">本报告由AI算法生成，仅供参考，不构成专业命理建议</p>\n    </div>\n  </div>\n</body>\n</html>';
  
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '命理通鉴_' + title.replace(/ /g,'_') + '.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportBaziReport() {
  const name = document.getElementById('baziNameOut').textContent || '命盘报告';
  const resultDiv = document.getElementById('baziResult');
  if (!resultDiv) { showToast('请先生成八字报告'); return; }
  const tempDiv = resultDiv.cloneNode(true);
  const backRow = tempDiv.querySelector('.back-row');
  if (backRow) backRow.remove();
  exportReport(name, tempDiv.innerHTML);
}

function exportHuajieReport() {
  const name = '化解方案';
  const hjOutput = document.getElementById('hjOutput');
  if (!hjOutput) { showToast('请先生成化解方案'); return; }
  exportReport(name, hjOutput.innerHTML);
}

function getShopLinks(keywords) {
  if (!keywords || !keywords.length) return '';
  let html = '<div class="shop-links">';
  for (const kw of keywords) {
    html += '<a class="shop-link" href="https://s.taobao.com/search?q=' + encodeURIComponent(kw) + '" target="_blank" rel="noopener">淘宝选购：' + kw + '</a>';
    html += '<a class="shop-link jd" href="https://search.jd.com/Search?keyword=' + encodeURIComponent(kw) + '" target="_blank" rel="noopener">京东选购：' + kw + '</a>';
  }
  html += '</div>';
  return html;
}

// ================================================================
//  纳音五行
// ================================================================

const NAYIN_MAP = {
  // 甲子旬(0-9): 子丑寅卯辰巳午未申酉
  '0-0':'海中金','0-1':'海中金',
  '1-0':'海中金','1-1':'海中金',
  '2-2':'炉中火','2-3':'炉中火',
  '3-2':'炉中火','3-3':'炉中火',
  '4-4':'大林木','4-5':'大林木',
  '5-4':'大林木','5-5':'大林木',
  '6-6':'路旁土','6-7':'路旁土',
  '7-6':'路旁土','7-7':'路旁土',
  '8-8':'剑锋金','8-9':'剑锋金',
  '9-8':'剑锋金','9-9':'剑锋金',
  // 甲戌旬(10-9循环): 戌亥子丑寅卯辰巳午未
  '0-10':'山头火','0-11':'山头火',
  '1-10':'山头火','1-11':'山头火',
  '2-0':'涧下水','2-1':'涧下水',
  '3-0':'涧下水','3-1':'涧下水',
  '4-2':'城头土','4-3':'城头土',
  '5-2':'城头土','5-3':'城头土',
  '6-4':'白蜡金','6-5':'白蜡金',
  '7-4':'白蜡金','7-5':'白蜡金',
  '8-6':'杨柳木','8-7':'杨柳木',
  '9-6':'杨柳木','9-7':'杨柳木',
  // 甲申旬(8-7循环): 申酉戌亥子丑寅卯辰巳
  '0-8':'井泉水','0-9':'井泉水',
  '1-8':'井泉水','1-9':'井泉水',
  '2-10':'屋上土','2-11':'屋上土',
  '3-10':'屋上土','3-11':'屋上土',
  '4-0':'霹雳火','4-1':'霹雳火',
  '5-0':'霹雳火','5-1':'霹雳火',
  '6-2':'松柏木','6-3':'松柏木',
  '7-2':'松柏木','7-3':'松柏木',
  '8-4':'长流水','8-5':'长流水',
  '9-4':'长流水','9-5':'长流水',
  // 甲午旬(6-5循环): 午未申酉戌亥子丑寅卯
  '0-6':'砂石金','0-7':'砂石金',
  '1-6':'砂石金','1-7':'砂石金',
  '2-8':'山下火','2-9':'山下火',
  '3-8':'山下火','3-9':'山下火',
  '4-10':'平地木','4-11':'平地木',
  '5-10':'平地木','5-11':'平地木',
  '6-0':'壁上土','6-1':'壁上土',
  '7-0':'壁上土','7-1':'壁上土',
  '8-2':'金箔金','8-3':'金箔金',
  '9-2':'金箔金','9-3':'金箔金',
  // 甲辰旬(4-3循环): 辰巳午未申酉戌亥子丑
  '0-4':'覆灯火','0-5':'覆灯火',
  '1-4':'覆灯火','1-5':'覆灯火',
  '2-6':'天河水','2-7':'天河水',
  '3-6':'天河水','3-7':'天河水',
  '4-8':'大驿土','4-9':'大驿土',
  '5-8':'大驿土','5-9':'大驿土',
  '6-10':'钗钏金','6-11':'钗钏金',
  '7-10':'钗钏金','7-11':'钗钏金',
  '8-0':'桑柘木','8-1':'桑柘木',
  '9-0':'桑柘木','9-1':'桑柘木',
  // 甲寅旬(2-1循环): 寅卯辰巳午未申酉戌亥
  '0-2':'大溪水','0-3':'大溪水',
  '1-2':'大溪水','1-3':'大溪水',
  '2-4':'沙中金','2-5':'沙中金',
  '3-4':'沙中金','3-5':'沙中金',
  '4-6':'天上火','4-7':'天上火',
  '5-6':'天上火','5-7':'天上火',
  '6-8':'石榴木','6-9':'石榴木',
  '7-8':'石榴木','7-9':'石榴木',
  '8-10':'大海水','8-11':'大海水',
  '9-10':'大海水','9-11':'大海水'
};

const NAYIN_COLOR = {
  '海中金':'#95a5a6','炉中火':'#e74c3c','大林木':'#27ae60','路旁土':'#e67e22',
  '剑锋金':'#95a5a6','山头火':'#e74c3c','涧下水':'#2980b9','城头土':'#e67e22',
  '白蜡金':'#95a5a6','杨柳木':'#27ae60','井泉水':'#2980b9','屋上土':'#e67e22',
  '霹雳火':'#e74c3c','松柏木':'#27ae60','长流水':'#2980b9','砂石金':'#95a5a6',
  '山下火':'#e74c3c','平地木':'#27ae60','壁上土':'#e67e22','金箔金':'#95a5a6',
  '覆灯火':'#e74c3c','天河水':'#2980b9','大驿土':'#e67e22','钗钏金':'#95a5a6',
  '桑柘木':'#27ae60','大溪水':'#2980b9','沙中金':'#95a5a6','天上火':'#e74c3c',
  '石榴木':'#27ae60','大海水':'#2980b9'
};

function getNayin(stemIdx, branchIdx) {
  return NAYIN_MAP[stemIdx + '-' + branchIdx] || '未知';
}
