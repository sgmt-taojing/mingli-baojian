
async function checkHealth(){
  try{
    const r = await fetch('http://127.0.0.1:8913/health',{mode:'cors',signal:AbortSignal.timeout(15000)}));
    const d = await r.json();
    const engines = d.engines || {};
    const html = Object.entries(engines).map(([k,v])=>{
      const cls = v ? 'ok' : 'bad';
      const sign = v ? '✅' : '❌';
      return `<div class="pill">
        <div class="pill-label">${k}</div>
        <div class="pill-value ${cls}">${sign} ${v?'已配置':'未配置'}</div>
      </div>`;
    }).join('');
    document.getElementById('engines').innerHTML = html || '<div class="pill warn">无引擎数据</div>';
    document.getElementById('rawOut').textContent = JSON.stringify(d, null, 2);
  }catch(e){
    document.getElementById('engines').innerHTML = '<div class="pill bad">⚠️ 8913 不通（face-ocr-server 未启动？）</div>';
  }
}
checkHealth();
setInterval(checkHealth, 10000);
