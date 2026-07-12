function renderHetuLuoshuAnalysis(input, type) {
  var result = analyzeByHetuLuoshu(input, type);
  var accessPct = _hlGetAccessPercent();
  var html = '';
  html += '<div style="background:linear-gradient(135deg,rgba(52,152,219,0.04),rgba(231,76,60,0.04));border:1px solid rgba(201,168,76,0.15);border-radius:12px;padding:18px;margin-bottom:12px">';
  html += '<h5 style="font-size:13px;letter-spacing:4px;color:var(--gold);margin-bottom:14px;text-align:center">河洛数理深度分析</h5>';
  return html;
}
