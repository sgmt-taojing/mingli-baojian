/**
 * 易道智鉴 · 缺失知识库板块补全
 * 包含：十二生肖、西方星座、六十甲子与纳音、二十四节气、周易入门
 * 版本：2026.06.18
 */

(function() {
  // 注入 CSS（防止重复）
  if (document.getElementById('kb-missing-css')) return;
  var style = document.createElement('style');
  style.id = 'kb-missing-css';
  style.textContent = `
    .kb-card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin:16px 0}
    .kb-card{background:rgba(201,168,76,.05);border:1px solid rgba(201,168,76,.12);border-radius:12px;padding:16px;transition:all .3s}
    .kb-card:hover{border-color:rgba(201,168,76,.35);background:rgba(201,168,76,.1)}
    .kb-card-icon{font-size:32px;margin-bottom:8px}
    .kb-card-title{font-size:16px;font-weight:600;color:var(--gold);margin-bottom:6px}
    .kb-card-item{display:flex;justify-content:space-between;font-size:13px;padding:4px 0;border-bottom:1px solid rgba(201,168,76,.06)}
    .kb-card-item:last-child{border-bottom:none}
    .kb-card-label{color:var(--paper3)}
    .kb-card-value{color:var(--paper)}
    .tip-box{background:rgba(201,168,76,.05);border:1px solid rgba(201,168,76,.12);border-radius:8px;padding:16px;margin:16px 0}
    .tip-box h5{color:var(--gold);font-size:14px;margin-bottom:8px;font-family:'Ma Shan Zheng',serif}
    .tip-box p{font-size:13px;color:var(--paper2);line-height:1.8}
    .warn-box{background:rgba(192,57,43,.08);border:1px solid rgba(192,57,43,.2);border-radius:8px;padding:16px;margin:16px 0}
    .warn-box h5{color:var(--cinn);font-size:14px;margin-bottom:8px;font-family:'Ma Shan Zheng',serif}
    .warn-box p{font-size:13px;color:var(--paper2);line-height:1.8}
    .sx-match{display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:4px;text-align:center;margin:8px 0}
    .sx-match-item{font-size:12px;padding:6px 4px;border-radius:6px}
    .sx-good{background:rgba(39,174,96,.1);border:1px solid rgba(39,174,96,.2);color:#2ecc71}
    .sx-bad{background:rgba(192,57,43,.08);border:1px solid rgba(192,57,43,.15);color:#e74c3c}
    .sx-neutral{background:rgba(201,168,76,.06);border:1px solid rgba(201,168,76,.12);color:var(--paper)}
    .jieqi-card{display:flex;gap:16px;padding:12px 0;border-bottom:1px solid rgba(201,168,76,.08)}
    .jieqi-card:last-child{border-bottom:none}
    .jieqi-icon{font-size:28px;flex-shrink:0;width:48px;text-align:center}
    .jieqi-info{flex:1}
    .jieqi-name{font-size:15px;font-weight:600;color:var(--gold);margin-bottom:4px}
    .jieqi-date{font-size:12px;color:var(--paper3);margin-bottom:4px}
    .jieqi-detail{font-size:13px;color:var(--paper2);line-height:1.7}
    .bagua-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}
    .bagua-card{background:rgba(201,168,76,.05);border:1px solid rgba(201,168,76,.12);border-radius:10px;padding:14px;text-align:center;transition:all .3s}
    .bagua-card:hover{border-color:rgba(201,168,76,.35)}
    .bagua-symbol{font-size:28px;margin-bottom:6px}
    .bagua-name{font-size:16px;font-weight:600;color:var(--gold);margin-bottom:4px;font-family:'Ma Shan Zheng',serif}
    .bagua-detail{font-size:12px;color:var(--paper2);line-height:1.6}
    .nayn-card{background:rgba(201,168,76,.05);border:1px solid rgba(201,168,76,.12);border-radius:8px;padding:12px;margin-bottom:10px}
    .nayn-card h5{color:var(--gold);font-size:14px;margin-bottom:4px;font-family:'Ma Shan Zheng',serif}
    .nayn-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
    .nayn-tag{font-size:11px;padding:2px 8px;border-radius:10px;background:rgba(201,168,76,.1);color:var(--gold2);border:1px solid rgba(201,168,76,.2)}
    .const-card{background:rgba(201,168,76,.04);border:1px solid rgba(201,168,76,.1);border-radius:12px;padding:16px;margin-bottom:12px}
    .const-header{display:flex;align-items:center;gap:12px;margin-bottom:10px}
    .const-symbol{font-size:28px}
    .const-name{font-size:17px;font-weight:600;color:var(--gold)}
    .const-date{font-size:12px;color:var(--paper3)}
    .const-tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
    .const-tag{font-size:11px;padding:2px 8px;border-radius:10px;background:rgba(201,168,76,.1);color:var(--gold2)}
    .const-attr{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px}
    .const-attr-item{font-size:12px;padding:4px 8px;background:rgba(201,168,76,.05);border-radius:6px}
    .const-attr-label{color:var(--paper3)}
    .const-desc{font-size:13px;color:var(--paper2);line-height:1.8;margin-bottom:8px}
    .const-match{display:flex;gap:8px;flex-wrap:wrap}
    .const-match-item{font-size:12px;padding:3px 10px;border-radius:12px}
    .const-match-best{background:rgba(39,174,96,.12);border:1px solid rgba(39,174,96,.3);color:#2ecc71}
    .const-match-worst{background:rgba(192,57,43,.08);border:1px solid rgba(192,57,43,.2);color:#e74c3c}
    .gua-table tr:hover td{background:rgba(201,168,76,.05)}
    @media(max-width:600px){.bagua-grid{grid-template-columns:repeat(2,1fr)}.kb-card-grid{grid-template-columns:1fr 1fr}.jieqi-card{flex-direction:column}.jieqi-icon{width:auto;text-align:left}}
  `;
  document.head.appendChild(style);

  // ============================================================
  // 板块1：十二生肖
  // ============================================================
  window.KNOWLEDGE_DETAILS.shengxiao = `
<div class="chapter">
  <h3 class="chapter-title">一、生肖起源与文化</h3>
  <div class="chapter-content">
    <p>十二生肖是中华传统文化的重要组成部分，源于<span style="color:var(--gold)">干支纪年法</span>，与十二地支（子、丑、寅、卯、辰、巳、午、未、申、酉、戌、亥）一一对应，形成子鼠、丑牛、寅虎、卯兔、辰龙、巳蛇、午马、未羊、申猴、酉鸡、戌狗、亥猪的完整体系。</p>
    <p>早在先秦时期，《诗经·小雅》已有"吉日庚午"等以生肖纪日的记载。东汉王充《论衡·物势篇》是现存最早完整记载十二生肖的文献："寅，木也，其禽虎也……午，马也……亥，豕也"。</p>
    <p>生肖文化融合了天文、地理、五行、阴阳哲学，成为中华民族独特的生命符号体系。每个生肖不仅代表一种动物，更蕴含着丰富的哲学意蕴和人生智慧。</p>
    <div class="tip-box">
      <h5>📜 历史文献记载</h5>
      <p>《诗经·小雅》载"吉日庚午"，以午对马，与今之午马相合；甘肃天水放马滩秦简、湖北云梦睡虎地秦简均有完整生肖记载，可证战国时期生肖体系已相当成熟。</p>
    </div>
  </div>
</div>

<div class="chapter">
  <h3 class="chapter-title">二、十二生肖与地支完整对照</h3>
  <div class="chapter-content">
    <table class="kb-table">
      <thead><tr><th>地支</th><th>生肖</th><th>时辰</th><th>五行</th><th>阴阳</th><th>本命佛</th></tr></thead>
      <tbody>
        <tr><td><strong>子</strong></td><td>🐭 鼠</td><td>23:00–01:00</td><td>水</td><td>阳</td><td>千手观音菩萨</td></tr>
        <tr><td><strong>丑</strong></td><td>🐮 牛</td><td>01:00–03:00</td><td>土</td><td>阴</td><td>虚空藏菩萨</td></tr>
        <tr><td><strong>寅</strong></td><td>🐯 虎</td><td>03:00–05:00</td><td>木</td><td>阳</td><td>虚空藏菩萨</td></tr>
        <tr><td><strong>卯</strong></td><td>🐰 兔</td><td>05:00–07:00</td><td>木</td><td>阴</td><td>文殊菩萨</td></tr>
        <tr><td><strong>辰</strong></td><td>🐉 龙</td><td>07:00–09:00</td><td>土</td><td>阳</td><td>普贤菩萨</td></tr>
        <tr><td><strong>巳</strong></td><td>🐍 蛇</td><td>09:00–11:00</td><td>火</td><td>阴</td><td>普贤菩萨</td></tr>
        <tr><td><strong>午</strong></td><td>🐴 马</td><td>11:00–13:00</td><td>火</td><td>阳</td><td>大势至菩萨</td></tr>
        <tr><td><strong>未</strong></td><td>🐑 羊</td><td>13:00–15:00</td><td>土</td><td>阴</td><td>大日如来</td></tr>
        <tr><td><strong>申</strong></td><td>🐵 猴</td><td>15:00–17:00</td><td>金</td><td>阳</td><td>大日如来</td></tr>
        <tr><td><strong>酉</strong></td><td>🐔 鸡</td><td>17:00–19:00</td><td>金</td><td>阴</td><td>不动明王</td></tr>
        <tr><td><strong>戌</strong></td><td>🐶 狗</td><td>19:00–21:00</td><td>土</td><td>阳</td><td>阿弥陀佛</td></tr>
        <tr><td><strong>亥</strong></td><td>🐷 猪</td><td>21:00–23:00</td><td>水</td><td>阴</td><td>阿弥陀佛</td></tr>
      </tbody>
    </table>
  </div>
</div>

<div class="chapter">
  <h3 class="chapter-title">三、十二生肖性格详解</h3>
  <div class="chapter-content">
    <div class="kb-card-grid">
      <div class="kb-card">
        <div class="kb-card-icon">🐭</div>
        <div class="kb-card-title">🐭 鼠</div>
        <div class="kb-card-item"><span class="kb-card-label">性格关键词</span><span class="kb-card-value">机敏、适应力强、务实</span></div>
        <div class="kb-card-item"><span class="kb-card-label">优势</span><span class="kb-card-value">聪明伶俐、财运佳、社交能力强</span></div>
        <div class="kb-card-item"><span class="kb-card-label">弱点</span><span class="kb-card-value">易贪小便宜、略显急躁</span></div>
        <div class="kb-card-item"><span class="kb-card-label">贵人方位</span><span class="kb-card-value">东北方、正北方</span></div>
        <div class="kb-card-item"><span class="kb-card-label">幸运数字</span><span class="kb-card-value">2、3</span></div>
        <div class="kb-card-item"><span class="kb-card-label">幸运颜色</span><span class="kb-card-value">金色、蓝灰色</span></div>
        <div class="kb-card-item"><span class="kb-card-label">开运食物</span><span class="kb-card-value">花生、核桃</span></div>
      </div>
      <div class="kb-card">
        <div class="kb-card-icon">🐮</div>
        <div class="kb-card-title">🐮 牛</div>
        <div class="kb-card-item"><span class="kb-card-label">性格关键词</span><span class="kb-card-value">勤恳、稳重、固执</span></div>
        <div class="kb-card-item"><span class="kb-card-label">优势</span><span class="kb-card-value">吃苦耐劳、忠诚可靠、财运稳定</span></div>
        <div class="kb-card-item"><span class="kb-card-label">弱点</span><span class="kb-card-value">过于固执、不善变通</span></div>
        <div class="kb-card-item"><span class="kb-card-label">贵人方位</span><span class="kb-card-value">东南方、西北方</span></div>
        <div class="kb-card-item"><span class="kb-card-label">幸运数字</span><span class="kb-card-value">5、9</span></div>
        <div class="kb-card-item"><span class="kb-card-label">幸运颜色</span><span class="kb-card-value">青绿色、棕黄色</span></div>
        <div class="kb-card-item"><span class="kb-card-label">开运食物</span><span class="kb-card-value">莲藕、山药</span></div>
      </div>
      <div class="kb-card">
        <div class="kb-card-icon">🐯</div>
        <div class="kb-card-title">🐯 虎</div>
        <div class="kb-card-item"><span class="kb-card-label">性格关键词</span><span class="kb-card-value">勇敢、威严、领导力强</span></div>
        <div class="kb-card-item"><span class="kb-card-label">优势</span><span class="kb-card-value">魄力十足、正义感强、事业心重</span></div>
        <div class="kb-card-item"><span class="kb-card-label">弱点</span><span class="kb-card-value">冲动易怒、占有欲强</span></div>
        <div class="kb-card-item"><span class="kb-card-label">贵人方位</span><span class="kb-card-value">正东方、正南方</span></div>
        <div class="kb-card-item"><span class="kb-card-label">幸运数字</span><span class="kb-card-value">1、3</span></div>
        <div class="kb-card-item"><span class="kb-card-label">幸运颜色</span><span class="kb-card-value">蓝色、白色</span></div>
        <div class="kb-card-item"><span class="kb-card-label">开运食物</span><span class="kb-card-value">鸡肉、鱼肉</span></div>
      </div>
      <div class="kb-card">
        <div class="kb-card-icon">🐰</div>
        <div class="kb-card-title">🐰 兔</div>
        <div class="kb-card-item"><span class="kb-card-label">性格关键词</span><span class="kb-card-value">温和、细腻、善良</span></div>
        <div class="kb-card-item"><span class="kb-card-label">优势</span><span class="kb-card-value">人缘极佳、财运平稳、艺术天赋</span></div>
        <div class="kb-card-item"><span class="kb-card-label">弱点</span><span class="kb-card-value">易优柔寡断、过于敏感</span></div>
        <div class="kb-card-item"><span class="kb-card-label">贵人方位</span><span class="kb-card-value">正北方、西北方</span></div>
        <div class="kb-card-item"><span class="kb-card-label">幸运数字</span><span class="kb-card-value">3、4、9</span></div>
        <div class="kb-card-item"><span class="kb-card-label">幸运颜色</span><span class="kb-card-value">粉色、绿色</span></div>
        <div class="kb-card-item"><span class="kb-card-label">开运食物</span><span class="kb-card-value">胡萝卜、青菜</span></div>
      </div>
      <div class="kb-card">
        <div class="kb-card-icon">🐉</div>
        <div class="kb-card-title">🐉 龙</div>
        <div class="kb-card-item"><span class="kb-card-label">性格关键词</span><span class="kb-card-value">卓越、自信、理想主义</span></div>
        <div class="kb-card-item"><span class="kb-card-label">优势</span><span class="kb-card-value">领导力强、财运亨通、事业腾飞</span></div>
        <div class="kb-card-item"><span class="kb-card-label">弱点</span><span class="kb-card-value">好高骛远、略显傲慢</span></div>
        <div class="kb-card-item"><span class="kb-card-label">贵人方位</span><span class="kb-card-value">正西方、正北方</span></div>
        <div class="kb-card-item"><span class="kb-card-label">幸运数字</span><span class="kb-card-value">5、6</span></div>
        <div class="kb-card-item"><span class="kb-card-label">幸运颜色</span><span class="kb-card-value">金色、银白色</span></div>
        <div class="kb-card-item"><span class="kb-card-label">开运食物</span><span class="kb-card-value">鱼虾、燕窝</span></div>
      </div>
      <div class="kb-card">
        <div class="kb-card-icon">🐍</div>
        <div class="kb-card-title">🐍 蛇</div>
        <div class="kb-card-item"><span class="kb-card-label">性格关键词</span><span class="kb-card-value">智慧、神秘、直觉敏锐</span></div>
        <div class="kb-card-item"><span class="kb-card-label">优势</span><span class="kb-card-value">第六感强、理财高手、心思缜密</span></div>
        <div class="kb-card-item"><span class="kb-card-label">弱点</span><span class="kb-card-value">多疑善猜、略显冷漠</span></div>
        <div class="kb-card-item"><span class="kb-card-label">贵人方位</span><span class="kb-card-value">正东方、正西方</span></div>
        <div class="kb-card-item"><span class="kb-card-label">幸运数字</span><span class="kb-card-value">2、8</span></div>
        <div class="kb-card-item"><span class="kb-card-label">幸运颜色</span><span class="kb-card-value">黑色、红色</span></div>
        <div class="kb-card-item"><span class="kb-card-label">开运食物</span><span class="kb-card-value">枸杞、乌鸡汤</span></div>
      </div>
      <div class="kb-card">
        <div class="kb-card-icon">🐴</div>
        <div class="kb-card-title">🐴 马</div>
        <div class="kb-card-item"><span class="kb-card-label">性格关键词</span><span class="kb-card-value">热情、奔放、开朗</span></div>
        <div class="kb-card-item"><span class="kb-card-label">优势</span><span class="kb-card-value">财运广进、人脉广阔、行动力强</span></div>
        <div class="kb-card-item"><span class="kb-card-label">弱点</span><span class="kb-card-value">易三分钟热度、缺乏耐心</span></div>
        <div class="kb-card-item"><span class="kb-card-label">贵人方位</span><span class="kb-card-value">正东方、正南方</span></div>
        <div class="kb-card-item"><span class="kb-card-label">幸运数字</span><span class="kb-card-value">2、3、7</span></div>
        <div class="kb-card-item"><span class="kb-card-label">幸运颜色</span><span class="kb-card-value">棕色、绿色</span></div>
        <div class="kb-card-item"><span class="kb-card-label">开运食物</span><span class="kb-card-value">羊肉、红枣</span></div>
      </div>
      <div class="kb-card">
        <div class="kb-card-icon">🐑</div>
        <div class="kb-card-title">🐑 羊</div>
        <div class="kb-card-item"><span class="kb-card-label">性格关键词</span><span class="kb-card-value">温柔、善良、包容</span></div>
        <div class="kb-card-item"><span class="kb-card-label">优势</span><span class="kb-card-value">艺术气质、人缘极佳、财运稳定</span></div>
        <div class="kb-card-item"><span class="kb-card-label">弱点</span><span class="kb-card-label">易依赖他人、意志不够坚定</span></div>
        <div class="kb-card-item"><span class="kb-card-label">贵人方位</span><span class="kb-card-value">正北方、正东方</span></div>
        <div class="kb-card-item"><span class="kb-card-label">幸运数字</span><span class="kb-card-value">2、7</span></div>
        <div class="kb-card-item"><span class="kb-card-label">幸运颜色</span><span class="kb-card-value">绿色、米色</span></div>
        <div class="kb-card-item"><span class="kb-card-label">开运食物</span><span class="kb-card-value">草头、甘草</span></div>
      </div>
      <div class="kb-card">
        <div class="kb-card-icon">🐵</div>
        <div class="kb-card-title">🐵 猴</div>
        <div class="kb-card-item"><span class="kb-card-label">性格关键词</span><span class="kb-card-value">机智、灵活、幽默</span></div>
        <div class="kb-card-item"><span class="kb-card-label">优势</span><span class="kb-card-value">聪明过人、适应力强、财运不错</span></div>
        <div class="kb-card-item"><span class="kb-card-label">弱点</span><span class="kb-card-label">易投机取巧、不够专注</span></div>
        <div class="kb-card-item"><span class="kb-card-label">贵人方位</span><span class="kb-card-value">正北方、正西方</span></div>
        <div class="kb-card-item"><span class="kb-card-label">幸运数字</span><span class="kb-card-value">1、8</span></div>
        <div class="kb-card-item"><span class="kb-card-label">幸运颜色</span><span class="kb-card-value">白色、金色</span></div>
        <div class="kb-card-item"><span class="kb-card-label">开运食物</span><span class="kb-card-value">桃子、蜂蜜</span></div>
      </div>
      <div class="kb-card">
        <div class="kb-card-icon">🐔</div>
        <div class="kb-card-title">🐔 鸡</div>
        <div class="kb-card-item"><span class="kb-card-label">性格关键词</span><span class="kb-card-value">勤劳、守时、观察力强</span></div>
        <div class="kb-card-item"><span class="kb-card-label">优势</span><span class="kb-card-value">理财有道、事业心强、财运佳</span></div>
        <div class="kb-card-item"><span class="kb-card-label">弱点</span><span class="kb-card-value">过于挑剔、言辞犀利</span></div>
        <div class="kb-card-item"><span class="kb-card-label">贵人方位</span><span class="kb-card-value">正南方、正西方</span></div>
        <div class="kb-card-item"><span class="kb-card-label">幸运数字</span><span class="kb-card-value">5、8</span></div>
        <div class="kb-card-item"><span class="kb-card-label">幸运颜色</span><span class="kb-card-value">金色、黄色</span></div>
        <div class="kb-card-item"><span class="kb-card-label">开运食物</span><span class="kb-card-value">黄豆、玉米</span></div>
      </div>
      <div class="kb-card">
        <div class="kb-card-icon">🐶</div>
        <div class="kb-card-title">🐶 狗</div>
        <div class="kb-card-item"><span class="kb-card-label">性格关键词</span><span class="kb-card-value">忠诚、正直、坦率</span></div>
        <div class="kb-card-item"><span class="kb-card-label">优势</span><span class="kb-card-value">忠诚可靠、人缘好、正义感强</span></div>
        <div class="kb-card-item"><span class="kb-card-label">弱点</span><span class="kb-card-value">易轻信他人、过度操心</span></div>
        <div class="kb-card-item"><span class="kb-card-label">贵人方位</span><span class="kb-card-value">正东方、正南方</span></div>
        <div class="kb-card-item"><span class="kb-card-label">幸运数字</span><span class="kb-card-value">3、4</span></div>
        <div class="kb-card-item"><span class="kb-card-label">幸运颜色</span><span class="kb-card-value">红色、紫红色</span></div>
        <div class="kb-card-item"><span class="kb-card-label">开运食物</span><span class="kb-card-value">骨头汤、瘦肉</span></div>
      </div>
      <div class="kb-card">
        <div class="kb-card-icon">🐷</div>
        <div class="kb-card-title">🐷 猪</div>
        <div class="kb-card-item"><span class="kb-card-label">性格关键词</span><span class="kb-card-value">真诚、善良、豁达</span></div>
        <div class="kb-card-item"><span class="kb-card-label">优势</span><span class="kb-card-value">财运极好、人缘极佳、心胸宽广</span></div>
        <div class="kb-card-item"><span class="kb-card-label">弱点</span><span class="kb-card-label">易轻信、缺乏主见、贪图享乐</span></div>
        <div class="kb-card-item"><span class="kb-card-label">贵人方位</span><span class="kb-card-value">正北方、正东方</span></div>
        <div class="kb-card-item"><span class="kb-card-label">幸运数字</span><span class="kb-card-value">2、5</span></div>
        <div class="kb-card-item"><span class="kb-card-label">幸运颜色</span><span class="kb-card-value">黄色、灰色</span></div>
        <div class="kb-card-item"><span class="kb-card-label">开运食物</span><span class="kb-card-value">猪蹄、黑豆</span></div>
      </div>
    </div>
  </div>
</div>

<div class="chapter">
  <h3 class="chapter-title">四、生肖相合·相冲·相害·相刑</h3>
  <div class="chapter-content">
    <table class="kb-table">
      <thead><tr><th>关系</th><th>组合</th><th>含义</th></tr></thead>
      <tbody>
        <tr><td><strong>六合</strong></td><td>鼠—牛、虎—猪、龙—鸡、蛇—猴、兔—狗、马—羊</td><td>相合程度最高，互为贵人，合作顺利</td></tr>
        <tr><td><strong>三合</strong></td><td>鼠—龙—猴（申子辰水局）、牛—蛇—鸡（巳酉丑金局）<br>虎—马—狗（寅午戌火局）、兔—猪—羊（亥卯未木局）</td><td>三合吉配，互为助力，遇难呈祥</td></tr>
        <tr><td><strong>相冲</strong></td><td>鼠—马、牛—羊、虎—猴、兔—鸡、龙—狗、蛇—猪</td><td>对宫相冲，意见相左，慎密合作</td></tr>
        <tr><td><strong>相害</strong></td><td>鼠—羊、牛—马、虎—蛇、兔—龙、猴—猪、鸡—狗</td><td>暗中相害，口舌是非，防小人暗算</td></tr>
        <tr><td><strong>相刑</strong></td><td>寅—巳—申（三刑）、丑—戌—未（三刑）<br>子—卯（相刑）、辰—辰/午—午等（自刑）</td><td>易生矛盾纠纷，须注意调理化解</td></tr>
      </tbody>
    </table>
    <div class="tip-box">
      <h5>💡 关系应用</h5>
      <p>合则两利：合作伙伴、婚恋对象宜选六合、三合格局；冲则对立：合作前需谨慎斟酌；害刑则需化解：可借助五行通关或风水调整。</p>
    </div>
  </div>
</div>

<div class="chapter">
  <h3 class="chapter-title">五、犯太岁详解</h3>
  <div class="chapter-content">
    <p><strong>何为太岁？</strong>太岁是当年轮值的岁君，六十甲子各有一位太岁神君掌当年之事。俗话说"太岁当头坐，无喜必有祸"，冲犯太岁者该年运势波动较大。</p>
    <table class="kb-table">
      <thead><tr><th>犯太岁类型</th><th>定义</th><th>代表生肖（2026丙午年）</th><th>影响</th></tr></thead>
      <tbody>
        <tr><td><strong>值太岁</strong></td><td>本人属相与当年太岁相同</td><td>🐴 马</td><td>事业停滞、压力增大</td></tr>
        <tr><td><strong>冲太岁</strong></td><td>属相与太岁相冲（对宫）</td><td>🐭 鼠</td><td>变动较大、破财风险</td></tr>
        <tr><td><strong>刑太岁</strong></td><td>属相与太岁相刑</td><td>🐔 鸡、🐮 牛</td><td>口舌是非、纠纷困扰</td></tr>
        <tr><td><strong>害太岁</strong></td><td>属相与太岁相害</td><td>🐔 鸡</td><td>小人暗算、身体欠佳</td></tr>
        <tr><td><strong>破太岁</strong></td><td>属相与太岁相破</td><td>🐵 猴</td><td>感情波折、破耗财</td></tr>
      </tbody>
    </table>
    <div class="warn-box">
      <h5>🪬 化解方法</h5>
      <p>① 佩戴本命佛吊坠或手串；② 供奉太岁符/太岁牌位；③ 农历正月初八到庙里拜太岁（谢太岁）；④ 身上常带红绳或化太岁锦囊；⑤ 多做善事积累阴德；⑥ 属相相冲者可于床头挂六帝古钱。</p>
    </div>
  </div>
</div>

<div class="chapter">
  <h3 class="chapter-title">六、生肖配对速查表</h3>
  <div class="chapter-content">
    <table class="kb-table">
      <thead><tr><th>生肖</th><th>最佳配对</th><th>中吉配对</th><th>避免配对</th></tr></thead>
      <tbody>
        <tr><td>🐭 鼠</td><td>龙、猴、牛</td><td>蛇、猪</td><td>马、羊、鸡</td></tr>
        <tr><td>🐮 牛</td><td>蛇、鸡、鼠</td><td>兔、虎</td><td>羊、马、狗</td></tr>
        <tr><td>🐯 虎</td><td>马、狗、猪</td><td>兔、蛇</td><td>猴、蛇（刑）</td></tr>
        <tr><td>🐰 兔</td><td>羊、猪、狗</td><td>马、虎</td><td>鸡、龙、鼠</td></tr>
        <tr><td>🐉 龙</td><td>鼠、猴、鸡</td><td>虎、蛇</td><td>狗、兔</td></tr>
        <tr><td>🐍 蛇</td><td>牛、鸡、猴</td><td>龙、虎</td><td>猪、虎（刑）</td></tr>
        <tr><td>🐴 马</td><td>虎、羊、狗</td><td>蛇、兔</td><td>鼠、牛、鼠</td></tr>
        <tr><td>🐑 羊</td><td>兔、猪、马</td><td>蛇、虎</td><td>牛、鼠、狗</td></tr>
        <tr><td>🐵 猴</td><td>鼠、龙、蛇</td><td>鸡、猪</td><td>虎、猪、虎（冲）</td></tr>
        <tr><td>🐔 鸡</td><td>牛、龙、蛇</td><td>猴、猪</td><td>兔、狗、鼠</td></tr>
        <tr><td>🐶 狗</td><td>虎、兔、马</td><td>龙、蛇</td><td>龙、鸡、牛</td></tr>
        <tr><td>🐷 猪</td><td>兔、羊、虎</td><td>蛇、鼠</td><td>蛇、猴、虎（冲）</td></tr>
      </tbody>
    </table>
    <div class="tip-box"><h5>💡 婚恋建议</h5><p>最佳配对基于六合、三合原则；中吉配对为一般相生相帮；避免配对需双方多包容理解，或通过五行互补化解。</p></div>
  </div>
</div>

<div class="chapter">
  <h3 class="chapter-title">七、生肖取名建议</h3>
  <div class="chapter-content">
    <table class="kb-table">
      <thead><tr><th>生肖</th><th>宜用偏旁/字根</th><th>宜用五行属性</th><th>忌用偏旁/字根</th></tr></thead>
      <tbody>
        <tr><td>🐭 鼠</td><td>宀、米、豆、鱼、艹、金、玉、月</td><td>金、水</td><td>火（午）、马（午）、羊（未）</td></tr>
        <tr><td>🐮 牛</td><td>艹、豆、禾、米、宀、田、车</td><td>土、金</td><td>马（午）、羊（未）、心、忄</td></tr>
        <tr><td>🐯 虎</td><td>山、木、巾、衣、王、令、氵</td><td>木、水</td><td>申（猴）、巳（蛇）、口、戈</td></tr>
        <tr><td>🐰 兔</td><td>艹、豆、麦、米、宀、木、月、亻</td><td>木、水</td><td>酉（鸡）、辰（龙）、刀、刂</td></tr>
        <tr><td>🐉 龙</td><td>氵、王、玉、月、日、星、雨、辰</td><td>金、水</td><td>戌（狗）、寅（虎）、山、石</td></tr>
        <tr><td>🐍 蛇</td><td>艹、虫、豆、米、马（午）、木、月</td><td>火、土</td><td>亥（猪）、寅（虎）、戈、刀</td></tr>
        <tr><td>🐴 马</td><td>艹、忄、糸、车、氵、目、宝盖</td><td>火、木</td><td>子（鼠）、丑（牛）、氵（太寒）</td></tr>
        <tr><td>🐑 羊</td><td>艹、豆、米、木、月、心、忄</td><td>土、金</td><td>丑（牛）、子（鼠）、辰（龙）</td></tr>
        <tr><td>🐵 猴</td><td>木、山、米、豆、金、王、丝、纟</td><td>金、水</td><td>寅（虎）、亥（猪）、艹（弱）</td></tr>
        <tr><td>🐔 鸡</td><td>米、豆、禾、艹、宀、玉、金、酉</td><td>金、土</td><td>卯（兔）、辰（龙）、刀、刂</td></tr>
        <tr><td>🐶 狗</td><td>艹、豆、米、氵、忄、心、月</td><td>土、金</td><td>辰（龙）、酉（鸡）、午（马）</td></tr>
        <tr><td>🐷 猪</td><td>艹、豆、米、氵、木、忄、心</td><td>水、木</td><td>巳（蛇）、申（猴）、刀、刂</td></tr>
      </tbody>
    </table>
  </div>
</div>
  `;

  // ============================================================
  // 板块2：西方星座
  // ============================================================
  window.KNOWLEDGE_DETAILS.constellation = `
<div class="chapter">
  <h3 class="chapter-title">一、星座起源与四象分类</h3>
  <div class="chapter-content">
    <p>西方星座起源于<span style="color:var(--gold)">古巴比伦</span>（约公元前2000年），后经古希腊天文学家整理完善，形成黄道十二宫体系。1928年国际天文学联合会正式确立88个星座，其中黄道十二宫是命理学的核心参考。</p>
    <p>星座以<span style="color:var(--gold)">四象</span>（Elements）分类，每个象限包含三个星座：</p>
    <table class="kb-table">
      <thead><tr><th>四象</th><th>性质</th><th>包含星座</th><th>共同特质</th></tr></thead>
      <tbody>
        <tr><td><strong>火象</strong></td><td>热烈·主动</td><td>白羊座、狮子座、射手座</td><td>热情、冲动、领导力、自信、积极主动</td></tr>
        <tr><td><strong>土象</strong></td><td>沉稳·务实</td><td>金牛座、处女座、摩羯座</td><td>踏实、可靠、有耐心、重实际、保守</td></tr>
        <tr><td><strong>风象</strong></td><td>灵动·理智</td><td>双子座、天秤座、水瓶座</td><td>理性、善于沟通、社交能力强、好奇心强</td></tr>
        <tr><td><strong>水象</strong></td><td>柔情·敏感</td><td>巨蟹座、天蝎座、双鱼座</td><td>情感细腻、直觉敏锐、富有同理心、神秘</td></tr>
      </tbody>
    </table>
  </div>
</div>

<div class="chapter">
  <h3 class="chapter-title">二、十二星座详解</h3>
  <div class="chapter-content">

    <div class="const-card">
      <div class="const-header">
        <div class="const-symbol">♈</div>
        <div><div class="const-name">白羊座 Aries</div><div class="const-date">3月21日 — 4月19日</div></div>
      </div>
      <div class="const-tags"><span class="const-tag">火象</span><span class="const-tag">守护星：火星</span><span class="const-tag">本位星座</span></div>
      <div class="const-attr"><div class="const-attr-item"><span class="const-attr-label">幸运石：</span>红宝石</div><div class="const-attr-item"><span class="const-attr-label">幸运色：</span>红色</div><div class="const-attr-item"><span class="const-attr-label">幸运日：</span>星期二</div><div class="const-attr-item"><span class="const-attr-label">幸运数字：</span>9</div></div>
      <div class="const-desc">白羊座是十二星座之首，代表生命力的爆发与勇气的开端。他们是天生的领导者，敢于冒险，不怕失败，浑身散发着蓬勃的青春气息。思维直接，行动迅速，讨厌拖泥带水，喜欢竞争并渴望胜利。恋爱时热情奔放，敢爱敢恨，但有时会因为冲动而伤害自己和他人。缺点是耐心不足，容易三分钟热度，过于以自我为中心。适合从事需要魄力和决策力的工作。</div>
      <div class="const-match"><strong>最佳配对：</strong><span class="const-match-item const-match-best">狮子座</span><span class="const-match-item const-match-best">射手座</span><span class="const-match-item const-match-best">双子座</span><strong style="margin-left:8px;color:var(--cinn)">最不合：</strong><span class="const-match-item const-match-worst">巨蟹座</span><span class="const-match-item const-match-worst">摩羯座</span></div>
    </div>

    <div class="const-card">
      <div class="const-header">
        <div class="const-symbol">♉</div>
        <div><div class="const-name">金牛座 Taurus</div><div class="const-date">4月20日 — 5月20日</div></div>
      </div>
      <div class="const-tags"><span class="const-tag">土象</span><span class="const-tag">守护星：金星</span><span class="const-tag">固定星座</span></div>
      <div class="const-attr"><div class="const-attr-item"><span class="const-attr-label">幸运石：</span>祖母绿</div><div class="const-attr-item"><span class="const-attr-label">幸运色：</span>绿色</div><div class="const-attr-item"><span class="const-attr-label">幸运日：</span>星期五</div><div class="const-attr-item"><span class="const-attr-label">幸运数字：</span>6</div></div>
      <div class="const-desc">金牛座是黄道十二宫中最为务实稳重的星座，象征着稳定、可靠与永恒的价值。他们拥有出色的艺术鉴赏力和审美品味，追求生活品质，懂得享受美食与美酒。性格温和但固执，一旦下定决心就很难改变。理财能力极强，善于积累财富。工作踏实认真，有耐心和毅力。缺点是过于保守，不喜欢变化，贪图物质享受，有时显得慢半拍。在感情中忠诚专一，但表达方式较为含蓄内敛。</div>
      <div class="const-match"><strong>最佳配对：</strong><span class="const-match-item const-match-best">处女座</span><span class="const-match-item const-match-best">摩羯座</span><span class="const-match-item const-match-best">巨蟹座</span><strong style="margin-left:8px;color:var(--cinn)">最不合：</strong><span class="const-match-item const-match-worst">狮子座</span><span class="const-match-item const-match-worst">水瓶座</span></div>
    </div>

    <div class="const-card">
      <div class="const-header">
        <div class="const-symbol">♊</div>
        <div><div class="const-name">双子座 Gemini</div><div class="const-date">5月21日 — 6月21日</div></div>
      </div>
      <div class="const-tags"><span class="const-tag">风象</span><span class="const-tag">守护星：水星</span><span class="const-tag">变动星座</span></div>
      <div class="const-attr"><div class="const-attr-item"><span class="const-attr-label">幸运石：</span>玛瑙</div><div class="const-attr-item"><span class="const-attr-label">幸运色：</span>黄色</div><div class="const-attr-item"><span class="const-attr-label">幸运日：</span>星期三</div><div class="const-attr-item"><span class="const-attr-label">幸运数字：</span>5</div></div>
      <div class="const-desc">双子座是十二星座中最具灵活性和多面性的星座，思维敏捷，好奇心旺盛，兴趣广泛，喜欢接收各种新鲜资讯。他们是天生的沟通高手，语言天赋突出，善于社交，人脉广泛。性格具有双面性，有时活泼开朗，有时又显得深沉内省。缺点是容易三心二意，缺乏恒心和耐心，注意力容易分散。恋爱时追求新鲜感，喜欢调情，但可能显得不够专一。适合从事媒体、传播、教育等需要沟通能力的工作。</div>
      <div class="const-match"><strong>最佳配对：</strong><span class="const-match-item const-match-best">天秤座</span><span class="const-match-item const-match-best">水瓶座</span><span class="const-match-item const-match-best">白羊座</span><strong style="margin-left:8px;color:var(--cinn)">最不合：：</strong><span class="const-match-item const-match-worst">处女座</span><span class="const-match-item const-match-worst">双鱼座</span></div>
    </div>

    <div class="const-card">
      <div class="const-header">
        <div class="const-symbol">♋</div>
        <div><div class="const-name">巨蟹座 Cancer</div><div class="const-date">6月22日 — 7月22日</div></div>
      </div>
      <div class="const-tags"><span class="const-tag">水象</span><span class="const-tag">守护星：月亮</span><span class="const-tag">本位星座</span></div>
      <div class="const-attr"><div class="const-attr-item"><span class="const-attr-label">幸运石：</span>月光石</div><div class="const-attr-item"><span class="const-attr-label">幸运色：</span>银色</div><div class="const-attr-item"><span class="const-attr-label">幸运日：</span>星期一</div><div class="const-attr-item"><span class="const-attr-label">幸运数字：</span>2</div></div>
      <div class="const-desc">巨蟹座是最具母性光辉的星座，温柔细腻，极度重视家庭和亲情，拥有强烈的保护欲。他们敏感而富有同理心，能够敏锐地感知他人的情绪变化。记忆力和第六感都极为出色，往往能预感到即将发生的事情。忠诚度极高，对家人和朋友绝对忠诚。缺点是过于敏感脆弱，情绪起伏大，容易因小事耿耿于怀，有时显得占有欲过强。恋爱中追求安全感，渴望被呵护，但也容易因为过度依赖而失去自我。</div>
      <div class="const-match"><strong>最佳配对：</strong><span class="const-match-item const-match-best">天蝎座</span><span class="const-match-item const-match-best">双鱼座</span><span class="const-match-item const-match-best">金牛座</span><strong style="margin-left:8px;color:var(--cinn)">最不合：</strong><span class="const-match-item const-match-worst">白羊座</span><span class="const-match-item const-match-worst">天秤座</span></div>
    </div>

    <div class="const-card">
      <div class="const-header">
        <div class="const-symbol">♌</div>
        <div><div class="const-name">狮子座 Leo</div><div class="const-date">7月23日 — 8月22日</div></div>
      </div>
      <div class="const-tags"><span class="const-tag">火象</span><span class="const-tag">守护星：太阳</span><span class="const-tag">固定星座</span></div>
      <div class="const-attr"><div class="const-attr-item"><span class="const-attr-label">幸运石：</span>琥珀</div><div class="const-attr-item"><span class="const-attr-label">幸运色：</span>金色</div><div class="const-attr-item"><span class="const-attr-label">幸运日：</span>星期日</div><div class="const-attr-item"><span class="const-attr-label">幸运数字：</span>1</div></div>
      <div class="const-desc">狮子座是十二星座中的王者，天生具有领袖气质和强大的个人魅力，走到哪儿都是焦点。他们自信满满，浑身散发着太阳般的光芒，喜欢成为众人瞩目的中心。慷慨大方，讲义气，喜欢照顾他人，极具号召力。艺术天赋出众，品味不凡，追求高端大气的生活方式。缺点是虚荣心较强，过于在意面子，有时会显得霸道和控制欲强。恋爱中热烈浪漫，喜欢掌控全局，希望伴侣绝对忠诚和仰慕自己。</div>
      <div class="const-match"><strong>最佳配对：</strong><span class="const-match-item const-match-best">白羊座</span><span class="const-match-item const-match-best">射手座</span><span class="const-match-item const-match-best">天秤座</span><strong style="margin-left:8px;color:var(--cinn)">最不合：</strong><span class="const-match-item const-match-worst">天蝎座</span><span class="const-match-item const-match-worst">金牛座</span></div>
    </div>

    <div class="const-card">
      <div class="const-header">
        <div class="const-symbol">♍</div>
        <div><div class="const-name">处女座 Virgo</div><div class="const-date">8月23日 — 9月22日</div></div>
      </div>
      <div class="const-tags"><span class="const-tag">土象</span><span class="const-tag">守护星：水星</span><span class="const-tag">变动星座</span></div>
      <div class="const-attr"><div class="const-attr-item"><span class="const-attr-label">幸运石：</span>蓝宝石</div><div class="const-attr-item"><span class="const-attr-label">幸运色：</span>米色</div><div class="const-attr-item"><span class="const-attr-label">幸运日：</span>星期三</div><div class="const-attr-item"><span class="const-attr-label">幸运数字：</span>5</div></div>
      <div class="const-desc">处女座是十二星座中最具分析能力和追求完美的星座。他们注重细节，挑剔而严谨，做事有条理、有计划，追求精益求精。聪明务实，善于分析和解决问题，具有出色的学习和研究能力。乐于助人，服务意识强，但有时会过分追求完美而陷入焦虑。缺点是容易过度批判，吹毛求疵，过于担忧未发生的事，有时显得不够灵活和浪漫。恋爱中含蓄内敛，对伴侣要求较高，但一旦认定就会全心全意付出。</div>
      <div class="const-match"><strong>最佳配对：</strong><span class="const-match-item const-match-best">金牛座</span><span class="const-match-item const-match-best">摩羯座</span><span class="const-match-item const-match-best">天蝎座</span><strong style="margin-left:8px;color:var(--cinn)">最不合：</strong><span class="const-match-item const-match-worst">双子座</span><span class="const-match-item const-match-worst">射手座</span></div>
    </div>

    <div class="const-card">
      <div class="const-header">
        <div class="const-symbol">♎</div>
        <div><div class="const-name">天秤座 Libra</div><div class="const-date">9月23日 — 10月23日</div></div>
      </div>
      <div class="const-tags"><span class="const-tag">风象</span><span class="const-tag">守护星：金星</span><span class="const-tag">本位星座</span></div>
      <div class="const-attr"><div class="const-attr-item"><span class="const-attr-label">幸运石：</span>橄榄石</div><div class="const-attr-item"><span class="const-attr-label">幸运色：</span>淡蓝色</div><div class="const-attr-item"><span class="const-attr-label">幸运日：</span>星期五</div><div class="const-attr-item"><span class="const-attr-label">幸运数字：</span>6</div></div>
      <div class="const-desc">天秤座是十二星座中最具优雅气质和社交能力的星座，象征着和谐、公正与美。他们追求平衡与美感，审美眼光极高，在艺术和设计领域往往有出色的表现。性格温和友善，善于社交，人缘极佳，喜欢和平，讨厌冲突和争吵。理性客观，善于权衡利弊，在决策时考虑周全。缺点是选择困难症，容易优柔寡断，有时过于在意他人的看法而失去自我。恋爱中追求浪漫与和谐，但有时会为了避免冲突而隐藏真实想法。</div>
      <div class="const-match"><strong>最佳配对：</strong><span class="const-match-item const-match-best">双子座</span><span class="const-match-item const-match-best">水瓶座</span><span class="const-match-item const-match-best">狮子座</span><strong style="margin-left:8px;color:var(--cinn)">最不合：</strong><span class="const-match-item const-match-worst">摩羯座</span><span class="const-match-item const-match-worst">白羊座</span></div>
    </div>

    <div class="const-card">
      <div class="const-header">
        <div class="const-symbol">♏</div>
        <div><div class="const-name">天蝎座 Scorpio</div><div class="const-date">10月24日 — 11月22日</div></div>
      </div>
      <div class="const-tags"><span class="const-tag">水象</span><span class="const-tag">守护星：冥王星</span><span class="const-tag">固定星座</span></div>
      <div class="const-attr"><div class="const-attr-item"><span class="const-attr-label">幸运石：</span>绿松石</div><div class="const-attr-item"><span class="const-attr-label">幸运色：</span>深红色</div><div class="const-attr-item"><span class="const-attr-label">幸运日：</span>星期二</div><div class="const-attr-item"><span class="const-attr-label">幸运数字：</span>8</div></div>
      <div class="const-desc">天蝎座是十二星座中最具深度和神秘感的星座，象征着重生、转化和潜意识的力量。他们意志坚定，目标明确，一旦下定决心就会全力以赴，不达目的不罢休。洞察力极强，能看穿人心，具有出色的分析和研究能力。感情深沉而专注，一旦爱上就会全情投入，忠诚度极高。缺点是占有欲和控制欲较强，嫉妒心强，有时显得记仇和报复心重。恋爱中热烈而神秘，追求灵魂层面的深度连接，但在信任建立之前很难敞开心扉。</div>
      <div class="const-match"><strong>最佳配对：</strong><span class="const-match-item const-match-best">巨蟹座</span><span class="const-match-item const-match-best">双鱼座</span><span class="const-match-item const-match-best">处女座</span><strong style="margin-left:8px;color:var(--cinn)">最不合：</strong><span class="const-match-item const-match-worst">狮子座</span><span class="const-match-item const-match-worst">水瓶座</span></div>
    </div>

    <div class="const-card">
      <div class="const-header">
        <div class="const-symbol">♐</div>
        <div><div class="const-name">射手座 Sagittarius</div><div class="const-date">11月23日 — 12月21日</div></div>
      </div>
      <div class="const-tags"><span class="const-tag">火象</span><span class="const-tag">守护星：木星</span><span class="const-tag">变动星座</span></div>
      <div class="const-attr"><div class="const-attr-item"><span class="const-attr-label">幸运石：</span>紫水晶</div><div class="const-attr-item"><span class="const-attr-label">幸运色：</span>紫色</div><div class="const-attr-item"><span class="const-attr-label">幸运日：</span>星期四</div><div class="const-attr-item"><span class="const-attr-label">幸运数字：</span>3</div></div>
      <div class="const-desc">射手座是十二星座中最具冒险精神和乐观主义精神的星座，象征着自由、探索和智慧。他们热爱自由，不喜欢被束缚，渴望不断探索新的领域和体验。性格开朗直率，心胸宽广，喜欢结交朋友，幽默感强。哲学思想浓厚，喜欢思考人生意义，追求精神层面的成长。缺点是说话直接，不够圆滑，容易得罪人，有时过于乐观而不够务实，缺乏耐心和恒心。恋爱中追求新鲜感，喜欢追求和被追求的过程，但一旦确定关系就会变得专一忠诚。</div>
      <div class="const-match"><strong>最佳配对：</strong><span class="const-match-item const-match-best">白羊座</span><span class="const-match-item const-match-best">狮子座</span><span class="const-match-item const-match-best">双子座</span><strong style="margin-left:8px;color:var(--cinn)">最不合：</strong><span class="const-match-item const-match-worst">处女座</span><span class="const-match-item const-match-worst">双鱼座</span></div>
    </div>

    <div class="const-card">
      <div class="const-header">
        <div class="const-symbol">♑</div>
        <div><div class="const-name">摩羯座 Capricorn</div><div class="const-date">12月22日 — 1月19日</div></div>
      </div>
      <div class="const-tags"><span class="const-tag">土象</span><span class="const-tag">守护星：土星</span><span class="const-tag">本位星座</span></div>
      <div class="const-attr"><div class="const-attr-item"><span class="const-attr-label">幸运石：</span>石榴石</div><div class="const-attr-item"><span class="const-attr-label">幸运色：</span>深棕色</div><div class="const-attr-item"><span class="const-attr-label">幸运日：</span>星期六</div><div class="const-attr-item"><span class="const-attr-label">幸运数字：</span>4</div></div>
      <div class="const-desc">摩羯座是十二星座中最具责任感和野心的星座，象征着纪律、成就和长远的规划。他们脚踏实地，勤奋刻苦，有明确的人生目标和坚定的意志力。工作态度严谨认真，善于规划和管理，是天生的管理者和创业者。性格成熟稳重，独立性强，不喜欢依赖他人。缺点是过于严肃，不苟言笑，有时显得冷漠和疏离，不擅长表达情感。恋爱中较为保守谨慎，需要很长时间才能敞开心扉，但一旦认定就会非常认真和投入，渴望建立稳定长久的关系。</div>
      <div class="const-match"><strong>最佳配对：</strong><span class="const-match-item const-match-best">金牛座</span><span class="const-match-item const-match-best">处女座</span><span class="const-match-item const-match-best">天蝎座</span><strong style="margin-left:8px;color:var(--cinn)">最不合：</strong><span class="const-match-item const-match-worst">天秤座</span><span class="const-match-item const-match-worst">白羊座</span></div>
    </div>

    <div class="const-card">
      <div class="const-header">
        <div class="const-symbol">♒</div>
        <div><div class="const-name">水瓶座 Aquarius</div><div class="const-date">1月20日 — 2月18日</div></div>
      </div>
      <div class="const-tags"><span class="const-tag">风象</span><span class="const-tag">守护星：天王星</span><span class="const-tag">固定星座</span></div>
      <div class="const-attr"><div class="const-attr-item"><span class="const-attr-label">幸运石：</span>海蓝宝石</div><div class="const-attr-item"><span class="const-attr-label">幸运色：</span>天蓝色</div><div class="const-attr-item"><span class="const-attr-label">幸运日：</span>星期六</div><div class="const-attr-item"><span class="const-attr-label">幸运数字：</span>4</div></div>
      <div class="const-desc">水瓶座是十二星座中最具独创性和人道主义精神的星座，象征着革新、智慧和超前的思维方式。他们思维独特，不走寻常路，善于从独特的角度看待问题，往往能提出令人惊叹的创新想法。博爱主义，关注社会问题，热心公益，追求人人平等。性格独立而自由，重视精神交流，渴望灵魂层面的理解和共鸣。缺点是情感上较为疏离，有时显得冷漠和难以接近，不喜欢被规则束缚，有时过于理想化而脱离现实。</div>
      <div class="const-match"><strong>最佳配对：</strong><span class="const-match-item const-match-best">双子座</span><span class="const-match-item const-match-best">天秤座</span><span class="const-match-item const-match-best">白羊座</span><strong style="margin-left:8px;color:var(--cinn)">最不合：</strong><span class="const-match-item const-match-worst">金牛座</span><span class="const-match-item const-match-worst">天蝎座</span></div>
    </div>

    <div class="const-card">
      <div class="const-header">
        <div class="const-symbol">♓</div>
        <div><div class="const-name">双鱼座 Pisces</div><div class="const-date">2月19日 — 3月20日</div></div>
      </div>
      <div class="const-tags"><span class="const-tag">水象</span><span class="const-tag">守护星：海王星</span><span class="const-tag">变动星座</span></div>
      <div class="const-attr"><div class="const-attr-item"><span class="const-attr-label">幸运石：</span>海纹石</div><div class="const-attr-item"><span class="const-attr-label">幸运色：</span>海绿色</div><div class="const-attr-item"><span class="const-attr-label">幸运日：</span>星期四</div><div class="const-attr-item"><span class="const-attr-label">幸运数字：</span>7</div></div>
      <div class="const-desc">双鱼座是十二星座中最具浪漫情怀和艺术气质的星座，象征着梦想、直觉和超越界限的灵性。他们拥有异常丰富的内心世界和强烈的艺术创造力，直觉敏锐，第六感极强，往往能感知到他人无法察觉的东西。性格温柔善良，极具同理心，善于理解他人的感受和处境。富有牺牲精神，愿意为他人付出。缺点是容易逃避现实，沉迷于幻想，边界感不强，容易被他人利用或陷入不良情绪中。恋爱中追求灵魂的契合和浪漫的体验，但有时会过度理想化伴侣关系。</div>
      <div class="const-match"><strong>最佳配对：</strong><span class="const-match-item const-match-best">巨蟹座</span><span class="const-match-item const-match-best">天蝎座</span><span class="const-match-item const-match-best">金牛座</span><strong style="margin-left:8px;color:var(--cinn)">最不合：</strong><span class="const-match-item const-match-worst">双子座</span><span class="const-match-item const-match-worst">射手座</span></div>
    </div>

  </div>
</div>

<div class="chapter">
  <h3 class="chapter-title">三、星座配对速查表</h3>
  <div class="chapter-content">
    <table class="kb-table">
      <thead><tr><th>星座</th><th>最佳配对（★★★★★）</th><th>良好配对（★★★★☆）</th><th>一般配对（★★★☆☆）</th><th>需磨合配对（★★☆☆☆）</th></tr></thead>
      <tbody>
        <tr><td>白羊</td><td>狮子、射手</td><td>双子、水瓶</td><td>金牛、处女、天蝎</td><td>巨蟹、摩羯、双鱼</td></tr>
        <tr><td>金牛</td><td>处女、摩羯</td><td>巨蟹、天蝎</td><td>白羊、狮子、双鱼</td><td>双子、天秤</td></tr>
        <tr><td>双子</td><td>天秤、水瓶</td><td>白羊、狮子</td><td>金牛、处女、天蝎</td><td>巨蟹、摩羯、双鱼</td></tr>
        <tr><td>巨蟹</td><td>天蝎、双鱼</td><td>金牛</td><td>处女、摩羯</td><td>白羊、狮子、天秤</td></tr>
        <tr><td>狮子</td><td>白羊、射手</td><td>双子、天秤</td><td>巨蟹、天蝎、双鱼</td><td>处女、摩羯</td></tr>
        <tr><td>处女</td><td>金牛、摩羯</td><td>天蝎</td><td>双子、狮子、双鱼</td><td>白羊、天秤、射手</td></tr>
        <tr><td>天秤</td><td>双子、水瓶</td><td>狮子</td><td>金牛、处女、天蝎</td><td>白羊、巨蟹、摩羯</td></tr>
        <tr><td>天蝎</td><td>巨蟹、双鱼</td><td>金牛、处女</td><td>狮子、天秤</td><td>白羊、双子、射手</td></tr>
        <tr><td>射手</td><td>白羊、狮子</td><td>双子、水瓶</td><td>处女、摩羯</td><td>金牛、巨蟹、天蝎、双鱼</td></tr>
        <tr><td>摩羯</td><td>金牛、处女</td><td>天蝎</td><td>巨蟹、双鱼</td><td>白羊、狮子、双子、天秤、射手</td></tr>
        <tr><td>水瓶</td><td>双子、天秤</td><td>白羊、狮子</td><td>金牛、处女、天蝎</td><td>巨蟹、摩羯、双鱼</td></tr>
        <tr><td>双鱼</td><td>巨蟹、天蝎</td><td>金牛</td><td>处女、摩羯</td><td>白羊、狮子、双子、天秤、射手、水瓶</td></tr>
      </tbody>
    </table>
  </div>
</div>

<div class="chapter">
  <h3 class="chapter-title">四、2026年各星座年度运势</h3>
  <div class="chapter-content">
    <table class="kb-table">
      <thead><tr><th>星座</th><th>事业运势</th><th>爱情运势</th><th>财运</th></tr></thead>
      <tbody>
        <tr><td>♈ 白羊</td><td>上半年贵人运强，下半年面临重要抉择，宜稳中求进</td><td>单身者桃花运旺盛，已有伴侣者需注意沟通</td><td>正财稳定，偏财有惊喜，合伙人收益佳</td></tr>
        <tr><td>♉ 金牛</td><td>工作压力增大，宜调整策略，稳扎稳打</td><td>感情趋于稳定，家庭关系和谐美满</td><td>正财佳，偏财需谨慎，避免大额投资</td></tr>
        <tr><td>♊ 双子</td><td>事业突破期，有新项目机会，适合拓展</td><td>社交活跃，烂桃花需警惕，正缘出现</td><td>财务流动大，理财有道，适合学习投资</td></tr>
        <tr><td>♋ 巨蟹</td><td>职场上需低调积累，年底有晋升机会</td><td>感情升温期，已婚者添丁之喜，单身者宜相亲</td><td>财运平稳，注意身体健康带来的支出</td></tr>
        <tr><td>♌ 狮子</td><td>事业蒸蒸日上，领导力得以展现，适合创业</td><td>魅力四射，感情生活丰富，注意烂桃花</td><td>正偏财皆佳，适合购置不动产或大件物品</td></tr>
        <tr><td>♍ 处女</td><td>稳中有升，适合深化专业能力，学习进修</td><td>感情内敛而深沉，适合老夫老妻的相处</td><td>财务积累期，适合长期理财和储蓄</td></tr>
        <tr><td>♎ 天秤</td><td>人脉整合期，合作运势佳，注意法律合同</td><td>感情面临抉择年，不宜闪婚，需深思熟虑</td><td>横财运一般，正财靠努力，合伙财务需明算账</td></tr>
        <tr><td>♏ 天蝎</td><td>事业转折年，有换工作或创业机会，宜主动出击</td><td>感情深刻浓烈，已有伴侣者关系升华</td><td>偏财运佳，尤其水象月份（6、10月）</td></tr>
        <tr><td>♐ 射手</td><td>远方运势旺，有出差、出国、搬迁之象</td><td>感情稳定，单身者远方桃花旺，宜旅行邂逅</td><td>财运整体向好，注意小人导致的破财</td></tr>
        <tr><td>♑ 摩羯</td><td>事业进入收获期，贵人相助，地位稳固</td><td>感情内敛务实，已有伴侣者适合谈婚论嫁</td><td>正财极佳，宜储蓄和稳健投资</td></tr>
        <tr><td>♒ 水瓶</td><td>创新突破年，适合颠覆性思维和新领域探索</td><td>感情多元，社交广泛，注意烂桃花纠缠</td><td>财运波动大，不宜投机，适合多元化配置</td></tr>
        <tr><td>♓ 双鱼</td><td>事业上需防小人，贵人运在下半年显现</td><td>感情细腻敏感，单身者桃花运在春夏季</td><td>财务需谨慎管理，年底有意外之财</td></tr>
      </tbody>
    </table>
  </div>
</div>

<div class="chapter">
  <h3 class="chapter-title">五、星座健康倾向</h3>
  <div class="chapter-content">
    <table class="kb-table">
      <thead><tr><th>星座</th><th>需重点关注的器官/系统</th><th>健康建议</th></tr></thead>
      <tbody>
        <tr><td>♈ 白羊</td><td>头部（偏头痛）、眼睛、肌肉拉伤</td><td>避免过度竞争和情绪激动，运动前充分热身</td></tr>
        <tr><td>♉ 金牛</td><td>咽喉、甲状腺、颈部、肩部</td><td>注意饮食清淡，多做颈部拉伸和发声练习</td></tr>
        <tr><td>♊ 双子</td><td>肺部、呼吸系统、手臂、神经系统</td><td>保持室内空气流通，避免长时间用手机电脑</td></tr>
        <tr><td>♋ 巨蟹</td><td>胸部、乳房、胃部、消化系统</td><td>保持情绪稳定，注意规律饮食，忌暴饮暴食</td></tr>
        <tr><td>♌ 狮子</td><td>心脏、脊柱、背部、眼睛</td><td>避免熬夜，控制情绪，多做户外活动和有氧运动</td></tr>
        <tr><td>♍ 处女</td><td>腹部、肠道、肝脏、免疫系统</td><td>规律饮食作息，注意食物卫生，适当放松压力</td></tr>
        <tr><td>♎ 天秤</td><td>肾脏、腰部、皮肤、下背部</td><td>保持充足睡眠，多喝水，注意皮肤保养</td></tr>
        <tr><td>♏ 天蝎</td><td>生殖系统、泌尿系统、鼻子、喉咙</td><td>注意私密部位卫生，规律作息，忌过度劳累</td></tr>
        <tr><td>♐ 射手</td><td>肝脏、大腿、臀部、坐骨神经</td><td>适度运动，久坐后起身活动，注意腿部保暖</td></tr>
        <tr><td>♑ 摩羯</td><td>骨骼、膝盖、牙齿、皮肤</td><td>补充钙质，注意关节保暖，定期体检</td></tr>
        <tr><td>♒ 水瓶</td><td>小腿、脚踝、血液循环、视神经</td><td>注意腿部保暖，多泡脚，促进血液循环</td></tr>
        <tr><td>♓ 双鱼</td><td>脚趾、淋巴系统、神经系统、药物过敏</td><td>避免药物滥用，保持心理平衡，多做冥想</td></tr>
      </tbody>
    </table>
  </div>
</div>
  `;

  // ============================================================
  // 板块3：六十甲子与纳音
  // ============================================================
  window.KNOWLEDGE_DETAILS.jiazi = `
<div class="chapter">
  <h3 class="chapter-title">一、十天干详解</h3>
  <div class="chapter-content">
    <p>十天干是中国古代的计数符号体系：<span style="color:var(--gold)">甲、乙、丙、丁、戊、己、庚、辛、壬、癸</span>。天干属阳，地支属阴，阳干配阳支，阴干配阴支，形成六十甲子循环。</p>
    <table class="kb-table">
      <thead><tr><th>天干</th><th>五行</th><th>阴阳</th><th>脏腑</th><th>方位</th><th>季节</th><th>象征意义</th></tr></thead>
      <tbody>
        <tr><td><strong>甲</strong></td><td>木</td><td>阳</td><td>胆</td><td>东</td><td>春</td><td>栋梁之材，阳刚进取，如参天大树</td></tr>
        <tr><td><strong>乙</strong></td><td>木</td><td>阴</td><td>肝</td><td>东</td><td>春</td><td>花草之木，柔韧顺变，如藤萝蔓草</td></tr>
        <tr><td><strong>丙</strong></td><td>火</td><td>阳</td><td>小肠</td><td>南</td><td>夏</td><td>太阳之火，光明炽热，如烈日当空</td></tr>
        <tr><td><strong>丁</strong></td><td>火</td><td>阴</td><td>心</td><td>南</td><td>夏</td><td>灯烛之火，温暖明亮，如星火燎原</td></tr>
        <tr><td><strong>戊</strong></td><td>土</td><td>阳</td><td>胃</td><td>中</td><td>季末</td><td>城墙之土，厚重稳固，如高丘厚土</td></tr>
        <tr><td><strong>己</strong></td><td>土</td><td>阴</td><td>脾</td><td>中</td><td>季末</td><td>田园之土，承载生化，如大地万物</td></tr>
        <tr><td><strong>庚</strong></td><td>金</td><td>阳</td><td>大肠</td><td>西</td><td>秋</td><td>刀斧之金，刚毅果断，如利刃霜雪</td></tr>
        <tr><td><strong>辛</strong></td><td>金</td><td>阴</td><td>肺</td><td>西</td><td>秋</td><td>珠玉之金，精美珍贵，如玉石金银</td></tr>
        <tr><td><strong>壬</strong></td><td>水</td><td>阳</td><td>膀胱</td><td>北</td><td>冬</td><td>江河之水，奔涌不息，如大海汪洋</td></tr>
        <tr><td><strong>癸</strong></td><td>水</td><td>阴</td><td>肾</td><td>北</td><td>冬</td><td>雨露之水，滋润万物，如甘霖霜雪</td></tr>
      </tbody>
    </table>
    <div class="tip-box">
      <h5>💡 天干合化规律</h5>
      <p>甲己合土（中正之合）、乙庚合金（仁义之合）、丙辛合水（威制之合）、丁壬合木（淫昵之合）、戊癸合火（无情之合）。合化后的五行对命局产生重要影响。</p>
    </div>
  </div>
</div>

<div class="chapter">
  <h3 class="chapter-title">二、十二地支详解</h3>
  <div class="chapter-content">
    <p>十二地支：<span style="color:var(--gold)">子、丑、寅、卯、辰、巳、午、未、申、酉、戌、亥</span>。地支配生肖、时辰、五行、月份，构成命理基础框架。</p>
    <table class="kb-table">
      <thead><tr><th>地支</th><th>生肖</th><th>时辰</th><th>五行</th><th>阴阳</th><th>月份（节）</th><th>脏腑</th><th>方位</th></tr></thead>
      <tbody>
        <tr><td><strong>子</strong></td><td>鼠</td><td>23:00–01:00</td><td>水</td><td>阳</td><td>十一月（大雪—小寒）</td><td>膀胱</td><td>北</td></tr>
        <tr><td><strong>丑</strong></td><td>牛</td><td>01:00–03:00</td><td>土</td><td>阴</td><td>十二月（小寒—立春）</td><td>脾</td><td>东北</td></tr>
        <tr><td><strong>寅</strong></td><td>虎</td><td>03:00–05:00</td><td>木</td><td>阳</td><td>正月（立春—惊蛰）</td><td>胆</td><td>东北</td></tr>
        <tr><td><strong>卯</strong></td><td>兔</td><td>05:00–07:00</td><td>木</td><td>阴</td><td>二月（惊蛰—清明）</td><td>肝</td><td>东</td></tr>
        <tr><td><strong>辰</strong></td><td>龙</td><td>07:00–09:00</td><td>土</td><td>阳</td><td>三月（清明—立夏）</td><td>胃</td><td>东南</td></tr>
        <tr><td><strong>巳</strong></td><td>蛇</td><td>09:00–11:00</td><td>火</td><td>阴</td><td>四月（立夏—芒种）</td><td>心</td><td>东南</td></tr>
        <tr><td><strong>午</strong></td><td>马</td><td>11:00–13:00</td><td>火</td><td>阳</td><td>五月（芒种—小暑）</td><td>小肠</td><td>南</td></tr>
        <tr><td><strong>未</strong></td><td>羊</td><td>13:00–15:00</td><td>土</td><td>阴</td><td>六月（小暑—立秋）</td><td>脾</td><td>西南</td></tr>
        <tr><td><strong>申</strong></td><td>猴</td><td>15:00–17:00</td><td>金</td><td>阳</td><td>七月（立秋—白露）</td><td>大肠</td><td>西南</td></tr>
        <tr><td><strong>酉</strong></td><td>鸡</td><td>17:00–19:00</td><td>金</td><td>阴</td><td>八月（白露—寒露）</td><td>肺</td><td>西</td></tr>
        <tr><td><strong>戌</strong></td><td>狗</td><td>19:00–21:00</td><td>土</td><td>阳</td><td>九月（寒露—立冬）</td><td>胃</td><td>西北</td></tr>
        <tr><td><strong>亥</strong></td><td>猪</td><td>21:00–23:00</td><td>水</td><td>阴</td><td>十月（立冬—大雪）</td><td>膀胱</td><td>西北</td></tr>
      </tbody>
    </table>
    <div class="tip-box">
      <h5>💡 地支六合与三合</h5>
      <p><strong>六合：</strong>子丑合土、寅亥合木、卯戌合火、辰酉合金、巳申合水、午未合火（太阳火）/土（太阴土）<br><strong>三合：</strong>申子辰（水局）、巳酉丑（金局）、寅午戌（火局）、亥卯未（木局）。三合力量大于六合。</p>
    </div>
  </div>
</div>

<div class="chapter">
  <h3 class="chapter-title">三、六十甲子纳音完整表</h3>
  <div class="chapter-content">
    <p>六十甲子是十天干与十二地支按顺序两两相配（阳配阳，阴配阴），从甲子到癸亥，共60个组合，每60年循环一次。纳音五行是根据音律与五行的对应关系推算而来。</p>
    <div style="overflow-x:auto">
    <table class="kb-table" style="font-size:12px">
      <thead><tr><th>#</th><th>干支</th><th>纳音五行</th><th>代表年份</th><th>#</th><th>干支</th><th>纳音五行</th><th>代表年份</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>甲子</td><td>海中金</td><td>1924,1984,2044</td><td>31</td><td>甲戌</td><td>山头火</td><td>1954,2014</td></tr>
        <tr><td>2</td><td>乙丑</td><td>海中金</td><td>1925,1985,2045</td><td>32</td><td>乙亥</td><td>山头火</td><td>1955,2015</td></tr>
        <tr><td>3</td><td>丙寅</td><td>炉中火</td><td>1926,1986,2046</td><td>33</td><td>丙子</td><td>涧下水</td><td>1956,2016</td></tr>
        <tr><td>4</td><td>丁卯</td><td>炉中火</td><td>1927,1987,2047</td><td>34</td><td>丁丑</td><td>涧下水</td><td>1957,2017</td></tr>
        <tr><td>5</td><td>戊辰</td><td>大林木</td><td>1928,1988,2048</td><td>35</td><td>戊寅</td><td>城头土</td><td>1958,2018</td></tr>
        <tr><td>6</td><td>己巳</td><td>大林木</td><td>1929,1989,2049</td><td>36</td><td>己卯</td><td>城头土</td><td>1959,2019</td></tr>
        <tr><td>7</td><td>庚午</td><td>路旁土</td><td>1930,1990,2050</td><td>37</td><td>庚辰</td><td>白蜡金</td><td>1960,2020</td></tr>
        <tr><td>8</td><td>辛未</td><td>路旁土</td><td>1931,1991,2051</td><td>38</td><td>辛巳</td><td>白蜡金</td><td>1961,2021</td></tr>
        <tr><td>9</td><td>壬申</td><td>剑锋金</td><td>1932,1992,2052</td><td>39</td><td>壬午</td><td>杨柳木</td><td>1962,2022</td></tr>
        <tr><td>10</td><td>癸酉</td><td>剑锋金</td><td>1933,1993,2053</td><td>40</td><td>癸未</td><td>杨柳木</td><td>1963,2023</td></tr>
        <tr><td>11</td><td>甲戌</td><td>山头火</td><td>1934,1994,2054</td><td>41</td><td>甲申</td><td>井泉水</td><td>1964,2024</td></tr>
        <tr><td>12</td><td>乙亥</td><td>山头火</td><td>1935,1995,2055</td><td>42</td><td>乙酉</td><td>井泉水</td><td>1965,2025</td></tr>
        <tr><td>13</td><td>丙子</td><td>涧下水</td><td>1936,1996,2056</td><td>43</td><td>丙戌</td><td>屋上土</td><td>1966,2026</td></tr>
        <tr><td>14</td><td>丁丑</td><td>涧下水</td><td>1937,1997,2057</td><td>44</td><td>丁亥</td><td>屋上土</td><td>1967,2027</td></tr>
        <tr><td>15</td><td>戊寅</td><td>城头土</td><td>1938,1998,2058</td><td>45</td><td>戊子</td><td>霹雳火</td><td>1968,2028</td></tr>
        <tr><td>16</td><td>己卯</td><td>城头土</td><td>1939,1999,2059</td><td>46</td><td>己丑</td><td>霹雳火</td><td>1969,2029</td></tr>
        <tr><td>17</td><td>庚辰</td><td>白蜡金</td><td>1940,2000,2060</td><td>47</td><td>庚寅</td><td>松柏木</td><td>1970,2030</td></tr>
        <tr><td>18</td><td>辛巳</td><td>白蜡金</td><td>1941,2001,2061</td><td>48</td><td>辛卯</td><td>松柏木</td><td>1971,2031</td></tr>
        <tr><td>19</td><td>壬午</td><td>杨柳木</td><td>1942,2002,2062</td><td>49</td><td>壬辰</td><td>长流水</td><td>1972,2032</td></tr>
        <tr><td>20</td><td>癸未</td><td>杨柳木</td><td>1943,2003,2063</td><td>50</td><td>癸巳</td><td>长流水</td><td>1973,2033</td></tr>
        <tr><td>21</td><td>甲申</td><td>井泉水</td><td>1944,2004,2064</td><td>51</td><td>甲午</td><td>砂石金</td><td>1974,2034</td></tr>
        <tr><td>22</td><td>乙酉</td><td>井泉水</td><td>1945,2005,2065</td><td>52</td><td>乙未</td><td>砂石金</td><td>1975,2035</td></tr>
        <tr><td>23</td><td>丙戌</td><td>屋上土</td><td>1946,2006,2066</td><td>53</td><td>丙申</td><td>山下火</td><td>1976,2036</td></tr>
        <tr><td>24</td><td>丁亥</td><td>屋上土</td><td>1947,2007,2067</td><td>54</td><td>丁酉</td><td>山下火</td><td>1977,2037</td></tr>
        <tr><td>25</td><td>戊子</td><td>霹雳火</td><td>1948,2008,2068</td><td>55</td><td>戊戌</td><td>平地木</td><td>1978,2038</td></tr>
        <tr><td>26</td><td>己丑</td><td>霹雳火</td><td>1949,2009,2069</td><td>56</td><td>己亥</td><td>平地木</td><td>1979,2039</td></tr>
        <tr><td>27</td><td>庚寅</td><td>松柏木</td><td>1950,2010,2070</td><td>57</td><td>庚子</td><td>壁上土</td><td>1980,2040</td></tr>
        <tr><td>28</td><td>辛卯</td><td>松柏木</td><td>1951,2011,2071</td><td>58</td><td>辛丑</td><td>壁上土</td><td>1981,2041</td></tr>
        <tr><td>29</td><td>壬辰</td><td>长流水</td><td>1952,2012,2072</td><td>59</td><td>壬寅</td><td>金箔金</td><td>1982,2042</td></tr>
        <tr><td>30</td><td>癸巳</td><td>长流水</td><td>1953,2013,2073</td><td>60</td><td>癸卯</td><td>金箔金</td><td>1983,2043</td></tr>
      </tbody>
    </table>
    </div>
  </div>
</div>

<div class="chapter">
  <h3 class="chapter-title">四、三十种纳音五行详解</h3>
  <div class="chapter-content">
    <div class="nayn-card">
      <h5>金类纳音（五种）</h5>
      <div style="margin-top:8px"><span class="nayn-tag">海中金</span><span class="nayn-tag">剑锋金</span><span class="nayn-tag">白蜡金</span><span class="nayn-tag">砂石金</span><span class="nayn-tag">金箔金</span></div>
      <p style="margin-top:6px;font-size:13px;color:var(--paper2)"><strong style="color:var(--gold)">海中金（甲子、乙丑）：</strong>沉睡海底之金，需火炼方显其用。命主内敛含蓄，潜力深厚，早年运程平淡，中年后渐入佳境。适合佩金饰，忌埋没才能。</p>
      <p style="font-size:13px;color:var(--paper2)"><strong style="color:var(--gold)">剑锋金（壬申、癸酉）：</strong>锋利之剑，性刚强果断。命主意志坚定，敢于决断，但棱角分明需打磨。忌与火过旺者共事，宜以柔克刚。</p>
      <p style="font-size:13px;color:var(--paper2)"><strong style="color:var(--gold)">白蜡金（庚辰、辛巳）：</strong>温润如蜡之金，需精心雕琢。命主外表柔弱，内心坚强，适合艺术、精细工艺。忌粗放式管理，宜循序渐进。</p>
      <p style="font-size:13px;color:var(--paper2)"><strong style="color:var(--gold)">砂石金（甲午、乙未）：</strong>混杂砂石之金，须反复提炼。命主早年多磨砺，中年后逐渐成器，宜在动荡中磨炼意志，忌急功近利。</p>
      <p style="font-size:13px;color:var(--paper2)"><strong style="color:var(--gold)">金箔金（壬寅、癸卯）：</strong>薄金装饰之金，外表光鲜。命主善于包装和营销，适合服务业、公关、表演艺术。忌空有其表，宜充实内涵。</p>
    </div>

    <div class="nayn-card">
      <h5>木类纳音（五种）</h5>
      <div style="margin-top:8px"><span class="nayn-tag">大林木</span><span class="nayn-tag">松柏木</span><span class="nayn-tag">杨柳木</span><span class="nayn-tag">平地木</span><span class="nayn-tag">枯木</span></div>
      <p style="margin-top:6px;font-size:13px;color:var(--paper2)"><strong style="color:var(--gold)">大林木（戊辰、己巳）：</strong>茂盛森林之木，生命力顽强。命主包容性强，人脉广，但独立决策能力需加强。适合团队协作，忌独断专行。</p>
      <p style="font-size:13px;color:var(--paper2)"><strong style="color:var(--gold)">松柏木（庚寅、辛卯）：</strong>常青挺拔之木，坚强独立。命主意志坚定，不怕困难，寿命较长，事业稳固。适合长期规划，忌投机取巧。</p>
      <p style="font-size:13px;color:var(--paper2)"><strong style="color:var(--gold)">杨柳木（壬午、癸未）：</strong>随风摇曳之木，柔韧可变。命主适应力强，善于变通，但根基欠稳。适合需要灵活应变的行业，忌立场不稳。</p>
      <p style="font-size:13px;color:var(--paper2)"><strong style="color:var(--gold)">平地木（戊戌、己亥）：</strong>平地上之木，格局有限。命主需借助他人或平台才能发挥，忌孤高自傲，宜学会借势。</p>
    </div>

    <div class="nayn-card">
      <h5>水类纳音（五种）</h5>
      <div style="margin-top:8px"><span class="nayn-tag">涧下水</span><span class="nayn-tag">井泉水</span><span class="nayn-tag">长流水</span><span class="nayn-tag">大溪水</span><span class="nayn-tag">大海水</span></div>
      <p style="margin-top:6px;font-size:13px;color:var(--paper2)"><strong style="color:var(--gold)">涧下水（丙子、丁丑）：</strong>山涧细流之水，清澈纯净。命主聪明灵秀，才华出众，但运势局限在小范围内。适合精细领域，忌盲目扩张。</p>
      <p style="font-size:13px;color:var(--paper2)"><strong style="color:var(--gold)">井泉水（甲申、乙酉）：</strong>井中清泉之水，源源不断。命主耐力持久，善于积累，但格局受井口限制。适合稳步积累型行业，忌冒险突进。</p>
      <p style="font-size:13px;color:var(--paper2)"><strong style="color:var(--gold)">长流水（壬辰、癸巳）：</strong>江河长流之水，奔涌不息。命主志向远大，财运亨通，但须有明确方向。适合长线投资，忌朝三暮四。</p>
      <p style="font-size:13px;color:var(--paper2)"><strong style="color:var(--gold)">大海水（壬戌、癸亥）：</strong>汪洋大海之水，包容万物。命主胸怀宽广，财运极佳，但需防泛滥成灾。忌贪多求全，宜专注核心目标。</p>
    </div>

    <div class="nayn-card">
      <h5>火类纳音（五种）</h5>
      <div style="margin-top:8px"><span class="nayn-tag">炉中火</span><span class="nayn-tag">山头火</span><span class="nayn-tag">霹雳火</span><span class="nayn-tag">山下火</span><span class="nayn-tag">天上火</span></div>
      <p style="margin-top:6px;font-size:13px;color:var(--paper2)"><strong style="color:var(--gold)">炉中火（丙寅、丁卯）：</strong>炉中燃火，温和而持久。命主热情好客，适合需要温暖氛围的行业。忌过于激进，宜文火慢炖。</p>
      <p style="font-size:13px;color:var(--paper2)"><strong style="color:var(--gold)">山头火（甲戌、乙亥）：</strong>山巅之火，燃烧猛烈。命主眼光高远，魄力十足，但易燃易灭。适合爆发力强的工作，忌虎头蛇尾。</p>
      <p style="font-size:13px;color:var(--paper2)"><strong style="color:var(--gold)">霹雳火（戊子、己丑）：</strong>雷电交加之火，声势浩大。命主行动迅速果断，有爆发力，但脾气暴躁。忌与土重者相冲，宜以水济火。</p>
      <p style="font-size:13px;color:var(--paper2)"><strong style="color:var(--gold)">山下火（丙申、丁酉）：</strong>太阳落山之火，余晖犹存。命主外表低调，内心炽热，适合幕后工作，忌锋芒毕露。</p>
      <p style="font-size:13px;color:var(--paper2)"><strong style="color:var(--gold)">天上火（戊午、己巳）：</strong>太阳当空之火，光明普照。命主光辉照耀四方，人缘极佳，但燥热之性需水来调候。忌孤独求败，宜众人拾柴。</p>
    </div>

    <div class="nayn-card">
      <h5>土类纳音（五种）</h5>
      <div style="margin-top:8px"><span class="nayn-tag">路旁土</span><span class="nayn-tag">城头土</span><span class="nayn-tag">屋上土</span><span class="nayn-tag">壁上土</span><span class="nayn-tag">大驿土</span></div>
      <p style="margin-top:6px;font-size:13px;color:var(--paper2)"><strong style="color:var(--gold)">路旁土（庚午、辛未）：</strong>道路旁边之土，承载行人往来。命主脚踏实地，适应力强，但需被人所用才能显其价值。忌孤芳自赏，宜融入社会。</p>
      <p style="font-size:13px;color:var(--paper2)"><strong style="color:var(--gold)">城头土（戊寅、己卯）：</strong>城墙之上之土，稳固防护。命主责任心强，适合守护和管理工作。忌墨守成规，宜在稳固中寻求创新。</p>
      <p style="font-size:13px;color:var(--paper2)"><strong style="color:var(--gold)">屋上土（丙戌、丁亥）：</span></td><td>屋顶之上之土，高处不胜寒。命主有一定地位，但高处不胜寒，需注意人际关系。忌脱离群众，宜谦逊低调。</p>
      <p style="font-size:13px;color:var(--paper2)"><strong style="color:var(--gold)">壁上土（庚子、辛丑）：</strong>墙壁之土，遮风挡雨。命主善于保护他人，适合安全和保障类工作。忌固执己见，宜灵活变通。</p>
      <p style="font-size:13px;color:var(--paper2)"><strong style="color:var(--gold)">大驿土（戊申、己酉）：</strong>驿站道路之土，沟通四方。命主人脉广泛，善于外交，适合贸易、物流行业。忌漂泊不定，宜建立稳固根基。</p>
    </div>
  </div>
</div>

<div class="chapter">
  <h3 class="chapter-title">五、流年干支计算方法</h3>
  <div class="chapter-content">
    <p><strong>方法一：六十甲子顺推</strong></p>
    <p>已知某年干支，往后推N年：天干顺数N位（甲→乙→丙…癸循环），地支顺数N位（子→丑→寅…亥循环）。例如：2024年为甲辰年，2025年则甲+1=乙，辰+1=巳，故2025年为乙巳年。</p>
    <div class="tip-box">
      <h5>🔢 快速记忆口诀</h5>
      <p><strong>年干起算口诀：</strong>甲己之年丙作首（甲年/己年起于丙寅），乙庚之岁戊为头（乙年/庚年起于戊寅），丙辛必定寻庚起（丙年/辛年起于庚寅），丁壬壬位顺行流（丁年/壬年起于壬寅），更看何方更信谁（戊年/癸年起于甲寅）。</p>
    </div>
    <p><strong>方法二：干支代数法</strong></p>
    <p>以1984年（甲子）为基准，设甲子=0。干支序号+1＝下一年。例如：甲辰＝（0+40）mod60＝40位，即1984+40=2024年。</p>
    <table class="kb-table">
      <thead><tr><th>已知年份</th><th>干支</th><th>下一年干支</th><th>后年干支</th></tr></thead>
      <tbody>
        <tr><td>2024</td><td>甲辰</td><td>2025 乙巳</td><td>2026 丙午</td></tr>
        <tr><td>2025</td><td>乙巳</td><td>2026 丙午</td><td>2027 丁未</td></tr>
        <tr><td>2026</td><td>丙午</td><td>2027 丁未</td><td>2028 戊申</td></tr>
        <tr><td>2027</td><td>丁未</td><td>2028 戊申</td><td>2029 己酉</td></tr>
        <tr><td>2028</td><td>戊申</td><td>2029 己酉</td><td>2030 庚戌</td></tr>
      </tbody>
    </table>
  </div>
</div>
  `;

  // ============================================================
  // 板块4：二十四节气
  // ============================================================
  window.KNOWLEDGE_DETAILS.jieqi = `
<div class="chapter">
  <h3 class="chapter-title">一、节气起源与文化</h3>
  <div class="chapter-content">
    <p>二十四节气是中国古代劳动人民通过观察太阳周年运动，将一年划分为24个时节，是中华农耕文明的结晶。2016年被列入联合国教科文组织人类非物质文化遗产代表作名录。</p>
    <p>节气的制定以<span style="color:var(--gold)">太阳黄经</span>为标准：每15度一个节气，360度÷24=15度。春季从立春（315度）开始，经雨水、惊蛰、春分、清明、谷雨；夏季从立夏开始，经小满、芒种、夏至、小暑、大暑；秋季从立秋开始，经处暑、白露、秋分、寒露、霜降；冬季从立冬开始，经小雪、大雪、冬至、小寒、大寒。</p>
    <div class="tip-box">
      <h5>💡 节气与养生</h5>
      <p>春生、夏长、秋收、冬藏是四季养生的总纲。每个节气天地气场发生变化，人体需顺应时节调养：春养肝、夏养心、秋养肺、冬养肾，乃中医养生之精要。</p>
    </div>
  </div>
</div>

<div class="chapter">
  <h3 class="chapter-title">二、春季六节气</h3>
  <div class="chapter-content">

    <div class="jieqi-card">
      <div class="jieqi-icon">🌱</div>
      <div class="jieqi-info">
        <div class="jieqi-name">立春（2月3-5日，太阳黄经315°）</div>
        <div class="jieqi-date">正月节 | 木气初生 | 五行：木（阳）</div>
        <div class="jieqi-detail"><strong>物候：</strong>东风解冻、蛰虫始振、鱼上冰</div>
        <div class="jieqi-detail"><strong>养生要点：</strong>春捂秋冻，宜早起散步舒展阳气，忌过早减衣；多食辛甘发散之物如葱、姜、韭菜；宜梳头百下，疏通气血。</div>
        <div class="jieqi-detail"><strong>饮食建议：</strong>春饼（面粉+春菜）、萝卜（理气）、韭菜炒鸡蛋；宜饮菊花茶、玫瑰花茶疏肝。</div>
        <div class="jieqi-detail" style="color:var(--cinn)"><strong>禁忌：</strong>忌熬夜伤肝，忌情绪抑郁，忌食酸涩收敛之物。</div>
      </div>
    </div>

    <div class="jieqi-card">
      <div class="jieqi-icon">💧</div>
      <div class="jieqi-info">
        <div class="jieqi-name">雨水（2月18-20日，太阳黄经330°）</div>
        <div class="jieqi-date">正月中 | 冰雪融化 | 五行：水</div>
        <div class="jieqi-detail"><strong>物候：</strong>獭祭鱼、鸿雁来、草木萌动</div>
        <div class="jieqi-detail"><strong>养生要点：</strong>空气湿度渐增，宜祛湿健脾；多晒太阳，提升阳气；春捂依然重要，下厚上薄，腿脚保暖。</div>
        <div class="jieqi-detail"><strong>饮食建议：</strong>健脾祛湿汤（薏米+赤小豆+茯苓）、山药粥、鲫鱼豆腐汤；少吃生冷油腻，以免伤脾。</div>
        <div class="jieqi-detail" style="color:var(--cinn)"><strong>禁忌：</strong>忌居住潮湿之地，忌过量饮酒，忌盲目进补。</div>
      </div>
    </div>

    <div class="jieqi-card">
      <div class="jieqi-icon">⚡</div>
      <div class="jieqi-info">
        <div class="jieqi-name">惊蛰（3月5-7日，太阳黄经345°）</div>
        <div class="jieqi-date">二月节 | 雷鸣惊醒 | 五行：木</div>
        <div class="jieqi-detail"><strong>物候：</strong>桃始华、仓庚鸣、鹰化为鸠</div>
        <div class="jieqi-detail"><strong>养生要点：</strong>肝气最旺，宜疏肝理气；惊蛰后流感多发，注意个人卫生；早起敲胆经（大腿外侧）可助阳气升发。</div>
        <div class="jieqi-detail"><strong>饮食建议：</strong>惊蛰吃梨（润肺止咳）、菠菜猪肝汤（养肝明目）、枸杞菊花茶；宜清淡少酸多甘。</div>
        <div class="jieqi-detail" style="color:var(--cinn)"><strong>禁忌：</strong>忌暴躁发怒伤肝，忌食用羊肉、鸡肉等动风发物（易诱发过敏），忌熬夜。</div>
      </div>
    </div>

    <div class="jieqi-card">
      <div class="jieqi-icon">🌸</div>
      <div class="jieqi-info">
        <div class="jieqi-name">春分（3月20-22日，太阳黄经0°）</div>
        <div class="jieqi-date>二月的中气 | 昼夜平分 | 五行：木</div>
        <div class="jieqi-detail"><strong>物候：</strong>玄鸟至、雷乃发声、始电</div>
        <div class="jieqi-detail"><strong>养生要点：</strong>阴阳平衡最重要，宜早睡早起；春分节气平阴阳，梳头养生好时机（从额前梳至后颈）；踏青郊游，抒发肝气。</div>
        <div class="jieqi-detail"><strong>饮食建议：</strong>春分竖蛋（民俗）、香椿炒蛋、荠菜饺子；宜喝茉莉花茶疏肝解郁。</div>
        <div class="jieqi-detail" style="color:var(--cinn)"><strong>禁忌：</strong>忌大热大寒（宜平调），忌忧郁、思虑过度，忌不运动久坐。</div>
      </div>
    </div>

    <div class="jieqi-card">
      <div class="jieqi-icon">🌿</div>
      <div class="jieqi-info">
        <div class="jieqi-name">清明（4月4-6日，太阳黄经15°）</div>
        <div class="jieqi-date">三月节 | 天清气明 | 五行：木</div>
        <div class="jieqi-detail"><strong>物候：</strong>桐始华、田鼠化为鴽、虹始见</div>
        <div class="jieqi-detail"><strong>养生要点：</strong>清明祭祖寄哀思，情绪调护尤为重要；宜踏青放风筝，舒展身心；多接触绿色养眼养肝。</div>
        <div class="jieqi-detail"><strong>饮食建议：</strong>青团（艾草+糯米+豆沙）、清明螺、荠菜煮鸡蛋；宜饮明前龙井绿茶，清肝火。</div>
        <div class="jieqi-detail" style="color:var(--cinn)"><strong>禁忌：</strong>忌室内久居，忌悲伤过度（伤心），忌过量食用"发物"（海鱼、虾蟹）。</div>
      </div>
    </div>

    <div class="jieqi-card">
      <div class="jieqi-icon">🌾</div>
      <div class="jieqi-info">
        <div class="jieqi-name">谷雨（4月19-21日，太阳黄经30°）</div>
        <div class="jieqi-date">三月中 | 雨生百谷 | 五行：土</div>
        <div class="jieqi-detail"><strong>物候：</strong>萍始生、鸣鸠拂其羽、戴胜降于桑</div>
        <div class="jieqi-detail"><strong>养生要点：</strong>谷雨后降雨增多，湿气渐重，宜健脾祛湿；过敏高发期，过敏体质者减少户外活动；谷雨茶（雨前茶）正当季。</div>
        <div class="jieqi-detail"><strong>饮食建议：</strong>谷雨茶、香椿拌豆腐、冬瓜薏米排骨汤；少吃辛辣刺激食物以免胃火。</div>
        <div class="jieqi-detail" style="color:var(--cinn)"><strong>禁忌：</strong>忌涉水淋雨后不换衣，忌饮食过于油腻，忌思虑过度伤脾。</div>
      </div>
    </div>

  </div>
</div>

<div class="chapter">
  <h3 class="chapter-title">三、夏季六节气</h3>
  <div class="chapter-content">

    <div class="jieqi-card">
      <div class="jieqi-icon">🌾</div>
      <div class="jieqi-info">
        <div class="jieqi-name">立夏（5月5-7日，太阳黄经45°）</div>
        <div class="jieqi-date">四月节 | 夏季开始 | 五行：火（阳）</div>
        <div class="jieqi-detail"><strong>物候：</strong>蝼蝈鸣、蚯蚓出、王瓜生</div>
        <div class="jieqi-detail"><strong>养生要点：</strong>立夏养心，宜午睡小憩（11-13点），养心安神；开始进入"夏长"阶段，宜适度运动，微微出汗即可；立夏秤人（民俗）测体重变化。</div>
        <div class="jieqi-detail"><strong>饮食建议：</strong>立夏饭（红豆+黑豆+绿豆+黄豆+白米，五豆补五脏）、鸭蛋、苦瓜炒蛋；宜饮酸梅汤消暑开胃。</div>
        <div class="jieqi-detail" style="color:var(--cinn)"><strong>禁忌：</strong>忌贪凉饮冷伤脾胃，忌午饭后立即剧烈运动，忌情绪暴躁伤心。</div>
      </div>
    </div>

    <div class="jieqi-card">
      <div class="jieqi-icon">🌾</div>
      <div class="jieqi-info">
        <div class="jieqi-name">小满（5月20-22日，太阳黄经60°）</div>
        <div class="jieqi-date">四月中 | 谷粒初满 | 五行：火</div>
        <div class="jieqi-detail"><strong>物候：</strong>苦菜秀、靡草死、麦秋至</div>
        <div class="jieqi-detail"><strong>养生要点：</strong>小满江河满，注意祛湿清热；湿热体质者更需健脾利湿；小满见三鲜（樱桃、枇杷、桑葚）正当季。</div>
        <div class="jieqi-detail"><strong>饮食建议：</strong>冬瓜薏米汤、薏米红豆粥、苦菜饼；少吃羊肉、火锅等热性食物。</div>
        <div class="jieqi-detail" style="color:var(--cinn)"><strong>禁忌：</strong>忌心火过旺（口舌生疮），忌贪凉（伤脾胃阳气），忌大量出汗后立即喝冷饮。</div>
      </div>
    </div>

    <div class="jieqi-card">
      <div class="jieqi-icon">🌾</div>
      <div class="jieqi-info">
        <div class="jieqi-name">芒种（6月5-7日，太阳黄经75°）</div>
        <div class="jieqi-date">五月节 | 麦类成熟 | 五行：火</div>
        <div class="jieqi-detail"><strong>物候：</strong>螳螂生、鵙始鸣、反舌无声</div>
        <div class="jieqi-detail"><strong>养生要点：</strong>芒种忙种，是农忙时节，也是心脑血管疾病高发期；宜午休养心，避免过度劳累；芒种湿热盛，宜清热利湿。</div>
        <div class="jieqi-detail"><strong>饮食建议：</strong>芒种煮梅（青梅+冰糖）、薏米绿豆汤、百合莲子粥；吃苦味食物（苦瓜、莲子心）清心火。</div>
        <div class="jieqi-detail" style="color:var(--cinn)"><strong>禁忌：</strong>忌不午休耗伤心气，忌大量吃冷饮，忌淋雨不换衣。</div>
      </div>
    </div>

    <div class="jieqi-card">
      <div class="jieqi-icon">☀️</div>
      <div class="jieqi-info">
        <div class="jieqi-name">夏至（6月21-22日，太阳黄经90°）</div>
        <div class="jieqi-date">五月中气 | 阳极阴生 | 五行：火</div>
        <div class="jieqi-detail"><strong>物候：</strong>鹿角解、蜩始鸣、半夏生</div>
        <div class="jieqi-detail"><strong>养生要点：</strong>夏至一阴生，宜静心养神，减少剧烈运动；夏至晒后背是传统养生法（补阳气），上午9-11点为佳；夏至面（民俗）开胃解暑。</div>
        <div class="jieqi-detail"><strong>饮食建议：</strong>夏至面（手擀面+时蔬）、绿豆汤、冬瓜丸子汤；宜食苦味清热（苦瓜、苦菊）；忌过夜食物以防腹泻。</div>
        <div class="jieqi-detail" style="color:var(--cinn)"><strong>禁忌：</strong>忌贪凉直吹空调（尤其是睡眠时），忌户外暴晒（易中暑），忌情绪激动。</div>
      </div>
    </div>

    <div class="jieqi-card">
      <div class="jieqi-icon">🔥</div>
      <div class="jieqi-info">
        <div class="jieqi-name">小暑（7月6-8日，太阳黄经105°）</div>
        <div class="jieqi-date">六月节 | 暑气渐盛 | 五行：火</div>
        <div class="jieqi-detail"><strong>物候：</strong>温风至、蟋蟀居壁、鹰乃学习</div>
        <div class="jieqi-detail"><strong>养生要点：</strong>小暑尚未大暑，但已暑气逼人；宜心静自然凉，情绪稳定不中暑；可练"呵"字功养心（清晨面对东方缓缓发出"呵"音）。</div>
        <div class="jieqi-detail"><strong>饮食建议：</strong>小暑三宝（黄鳝、蜜汁藕、绿豆芽）、莲子百合粥、荷叶茯苓粥；宜多喝白开水、淡盐水补充津液。</div>
        <div class="jieqi-detail" style="color:var(--cinn)"><strong>禁忌：</strong>忌烈日下剧烈运动，忌长期依赖空调（空调病），忌食用腐败食物。</div>
      </div>
    </div>

    <div class="jieqi-card">
      <div class="jieqi-icon">🔥</div>
      <div class="jieqi-info">
        <div class="jieqi-name">大暑（7月22-24日，太阳黄经120°）</div>
        <div class="jieqi-date">六月中气 | 酷热至极 | 五行：火（伏）</div>
        <div class="jieqi-detail"><strong>物候：</strong>腐草为萤、土润溽暑、大雨时行</div>
        <div class="jieqi-detail"><strong>养生要点：</strong>一年最热时节，防中暑是重中之重；宜在清晨或傍晚运动，避免中午烈日；大暑天灸、艾灸可祛寒湿（冬病夏治）。</div>
        <div class="jieqi-detail"><strong>饮食建议：</strong>大暑喝伏茶（薄荷、甘草煮水）、烧仙草（凉粉）、羊肉汤（伏羊一碗汤，不用神医开药方）；宜食清淡易消化食物。</div>
        <div class="jieqi-detail" style="color:var(--cinn)"><strong>禁忌：</strong>忌不补充水分（易脱水），忌直接食用冰冷食物（伤脾胃），忌长时间户外暴晒。</div>
      </div>
    </div>

  </div>
</div>

<div class="chapter">
  <h3 class="chapter-title">四、秋季六节气</h3>
  <div class="chapter-content">

    <div class="jieqi-card">
      <div class="jieqi-icon">🍂</div>
      <div class="jieqi-info">
        <div class="jieqi-name">立秋（8月7-9日，太阳黄经135°）</div>
        <div class="jieqi-date">七月节 | 秋季开始 | 五行：金（阳）</div>
        <div class="jieqi-detail"><strong>物候：</strong>凉风至、白露生、寒蝉鸣</div>
        <div class="jieqi-detail"><strong>养生要点：</strong>立秋虽至，暑气未消，"秋老虎"来袭；宜收敛神气，早睡早起；宜养肺润燥，少辛多酸。</div>
        <div class="jieqi-detail"><strong>饮食建议：</strong>立秋贴秋膘（红烧肉等）、莲子百合粥、蜂蜜蒸梨；宜饮菊花茶、罗汉果茶清肺润燥。</div>
        <div class="jieqi-detail" style="color:var(--cinn)"><strong>禁忌：</strong>忌过早进食温补（易生内热），忌悲秋情绪，忌辛辣刺激食物伤肺。</div>
      </div>
    </div>

    <div class="jieqi-card">
      <div class="jieqi-icon">🍂</div>
      <div class="jieqi-info">
        <div class="jieqi-name">处暑（8月22-24日，太阳黄经150°）</div>
        <div class="jieqi-date>七月中气 | 暑气消退 | 五行：土</div>
        <div class="jieqi-detail"><strong>物候：</strong>鹰乃祭鸟、天地始肃、禾乃登</div>
        <div class="jieqi-detail"><strong>养生要点：</strong>处暑出伏，秋燥渐显；宜滋阴润肺，多食白色食物（银耳、百合、梨）；加强户外运动，登高望远舒展肺气。</div>
        <div class="jieqi-detail"><strong>饮食建议：</strong>处暑百合鸭、沙参麦冬粥、酸萝卜老鸭汤；宜饮沙参玉竹茶滋阴润燥。</div>
        <div class="jieqi-detail" style="color:var(--cinn)"><strong>禁忌：</strong>忌秋冻过度（不宜过早穿太厚），忌饮食过于温热，忌悲秋忧郁。</div>
      </div>
    </div>

    <div class="jieqi-card">
      <div class="jieqi-icon">🍂</div>
      <div class="jieqi-info">
        <div class="jieqi-name">白露（9月7-9日，太阳黄经165°）</div>
        <div class="jieqi-date">八月节 | 露凝而白 | 五行：金</div>
        <div class="jieqi-detail"><strong>物候：</strong>鸿雁来、玄鸟归、群鸟养羞</div>
        <div class="jieqi-detail"><strong>养生要点：</strong>白露身不露（不赤膊），早晚温差大，添衣防寒；秋燥伤肺，宜润肺生津；过敏性鼻炎高发期，注意防护。</div>
        <div class="jieqi-detail"><strong>饮食建议：</strong>白露米酒（糯米酒）、龙眼肉、红枣山药粥；宜饮枸杞菊花茶养肝明目。</div>
        <div class="jieqi-detail" style="color:var(--cinn)"><strong>禁忌：</strong>忌裸露足部（寒从脚起），忌生食海鲜（秋蟹性寒），忌悲伤肺。</div>
      </div>
    </div>

    <div class="jieqi-card">
      <div class="jieqi-icon">🍂</div>
      <div class="jieqi-info">
        <div class="jieqi-name">秋分（9月22-24日，太阳黄经180°）</div>
        <div class="jieqi-date">八月中气 | 昼夜平分 | 五行：金</div>
        <div class="jieqi-detail"><strong>物候：</strong>雷始收声、蛰虫坯户、水始涸</div>
        <div class="jieqi-detail"><strong>养生要点：</strong>秋分后阴气渐盛，宜收养之道，早睡以顺应阴精收藏；秋分竖蛋（民俗），疏通气血；登高赏秋，抒发肺气。</div>
        <div class="jieqi-detail"><strong>饮食建议：</strong>秋分蟹（螃蟹肥美）、桂花糯米藕、银耳红枣羹；宜食酸味收敛肺气（山楂、柚子）。</div>
        <div class="jieqi-detail" style="color:var(--cinn)"><strong>禁忌：</strong>忌过食辛辣发散，忌不润燥（便秘高发），忌情绪波动大。</div>
      </div>
    </div>

    <div class="jieqi-card">
      <div class="jieqi-icon">🍂</div>
      <div class="jieqi-info">
        <div class="jieqi-name">寒露（10月8-9日，太阳黄经195°）</div>
        <div class="jieqi-date">九月节 | 露气寒冷 | 五行：金</div>
        <div class="jieqi-detail"><strong>物候：</strong>鸿雁来宾、雀入大水为蛤、菊有黄华</div>
        <div class="jieqi-detail"><strong>养生要点：</strong>寒露不露脚（防寒气入侵），宜热水泡脚；深秋燥邪加重，润肺养阴是关键；预防秋季抑郁，多晒太阳。</div>
        <div class="jieqi-detail"><strong>饮食建议：</strong>寒露芝麻粥、柿子、菊花酒；宜饮枸杞红枣茶暖胃润燥。</div>
        <div class="jieqi-detail" style="color:var(--cinn)"><strong>禁忌：</strong>忌赤脚踩凉地板，忌过量食用柿子（空腹易结石），忌过度悲秋。</div>
      </div>
    </div>

    <div class="jieqi-card">
      <div class="jieqi-icon">🍂</div>
      <div class="jieqi-info">
        <div class="jieqi-name">霜降（10月23-24日，太阳黄经210°）</div>
        <div class="jieqi-date">九月中气 | 霜始降 | 五行：土</div>
        <div class="jieqi-detail"><strong>物候：</strong>豺乃祭兽、草木黄落、蛰虫咸俯</div>
        <div class="jieqi-detail"><strong>养生要点：</strong>霜降是秋季向冬季过渡的节气，健脾养胃是重点；宜进补（牛肉、羊肉），为冬季储备能量；注意预防感冒和心脑血管疾病。</div>
        <div class="jieqi-detail"><strong>饮食建议：</strong>霜降吃柿子（"霜降吃丁柿，不会流鼻涕"）、萝卜炖牛肉、栗子鸡；宜饮红茶温中暖胃。</div>
        <div class="jieqi-detail" style="color:var(--cinn)"><strong>禁忌：</strong>忌秋冻过度（御寒准备），忌过度进补（脾胃虚弱者），忌悲秋伤肺。</div>
      </div>
    </div>

  </div>
</div>

<div class="chapter">
  <h3 class="chapter-title">五、冬季六节气</h3>
  <div class="chapter-content">

    <div class="jieqi-card">
      <div class="jieqi-icon">❄️</div>
      <div class="jieqi-info">
        <div class="jieqi-name">立冬（11月7-8日，太阳黄经225°）</div>
        <div class="jieqi-date">十月节 | 冬季开始 | 五行：水（阳）</div>
        <div class="jieqi-detail"><strong>物候：</strong>水始冰、地始冻、雉入大水为蜃</div>
        <div class="jieqi-detail"><strong>养生要点：</strong>冬，终也，万物收藏。宜早睡晚起（必待日光），避寒就温；立冬补冬（北方饺子，南方鸡鸭鱼肉）；宜适度锻炼，避免大汗。</div>
        <div class="jieqi-detail"><strong>饮食建议：</strong>立冬饺子（羊肉白菜馅）、萝卜炖羊肉、当归生姜羊肉汤；宜饮红茶、普洱熟茶温补。</div>
        <div class="jieqi-detail" style="color:var(--cinn)"><strong>禁忌：</strong>忌晚睡（耗伤阳气），忌过度运动大汗（伤阴），忌受寒不添衣。</div>
      </div>
    </div>

    <div class="jieqi-card">
      <div class="jieqi-icon">❄️</div>
      <div class="jieqi-info">
        <div class="jieqi-name">小雪（11月22-23日，太阳黄经240°）</div>
        <div class="jieqi-date">十月中气 | 初雪降临 | 五行：水</div>
        <div class="jieqi-detail"><strong>物候：</strong>虹藏不见、天气上升、地气下降、闭塞成冬</div>
        <div class="jieqi-detail"><strong>养生要点：</strong>小雪封地，防寒保暖是首位；宜养肾，黑色食物入肾（黑芝麻、黑豆、黑米）；多晒太阳，尤其是后背督脉，补阳气。</div>
        <div class="jieqi-detail"><strong>饮食建议：</strong>小雪腌菜（芥菜、雪里红）、红枣桂圆粥、黑木耳炒山药；宜饮黑茶温肾助阳。</div>
        <div class="jieqi-detail" style="color:var(--cinn)"><strong>禁忌：</strong>忌过早外出晨练（天未亮阳气未生），忌情绪低落（冬季抑郁），忌过热保暖（室内温度22℃左右为宜）。</div>
      </div>
    </div>

    <div class="jieqi-card">
      <div class="jieqi-icon">❄️</div>
      <div class="jieqi-info">
        <div class="jieqi-name">大雪（12月6-8日，太阳黄经255°）</div>
        <div class="jieqi-date">十一月节 | 雪量增大 | 五行：水</div>
        <div class="jieqi-detail"><strong>物候：</strong>鹖鴠不鸣、虎始交、荔挺出</div>
        <div class="jieqi-detail"><strong>养生要点：</strong>大雪进补，开春打虎；宜温补肾阳，食补为主；大雪时节心脑血管疾病高发，注意头部保暖；每晚热水泡脚（15-20分钟）暖身助眠。</div>
        <div class="jieqi-detail"><strong>饮食建议：</strong>大雪喝参茸汤（人参、鹿茸炖鸡）、羊肉萝卜汤、核桃芝麻糊；宜饮黄酒、红酒温饮。</div>
        <div class="jieqi-detail" style="color:var(--cinn)"><strong>禁忌：</strong>忌不戴帽子外出（头为诸阳之会），忌过度进补伤阴，忌门窗紧闭不通风。</div>
      </div>
    </div>

    <div class="jieqi-card">
      <div class="jieqi-icon">❄️</div>
      <div class="jieqi-info">
        <div class="jieqi-name">冬至（12月21-23日，太阳黄经270°）</div>
        <div class="jieqi-date>十一月中气 | 阴极阳生 | 五行：水</div>
        <div class="jieqi-detail"><strong>物候：</strong>蚯蚓结、麋角解、水泉动</div>
        <div class="jieqi-detail"><strong>养生要点：</strong>冬至一阳生，是最重要的养生节气；三九贴（冬至后第一个九天开始）温阳散寒；宜静养，少劳累，早睡晚起；冬至灸（艾灸关元、神阙）补肾固元。</div>
        <div class="jieqi-detail"><strong>饮食建议：</strong>冬至吃饺子（"冬至不端饺子碗，冻掉耳朵没人管"）、汤圆、八珍汤（补气养血）；宜饮当归红枣茶温补。</div>
        <div class="jieqi-detail" style="color:var(--cinn)"><strong>禁忌：</strong>忌熬夜晚起过度，忌在冬至前后过度劳累，忌寒凉饮食伤阳。</div>
      </div>
    </div>

    <div class="jieqi-card">
      <div class="jieqi-icon">❄️</div>
      <div class="jieqi-info">
        <div class="jieqi-name">小寒（1月5-7日，太阳黄经285°）</div>
        <div class="jieqi-date">十二月节 | 寒气渐盛 | 五行：水</div>
        <div class="jieqi-detail"><strong>物候：</strong>雁北乡、鹊始巢、雉始雊</div>
        <div class="jieqi-detail"><strong>养生要点：</strong>小寒大寒，冷成冰团；一年最冷时期，防寒保暖是重点；宜温补肾阳，多吃羊肉、鸡肉；每晚热水泡脚加生姜或艾叶。</div>
        <div class="jieqi-detail"><strong>饮食建议：</strong>小寒喝腊八粥（糯米+红豆+花生+红枣+栗子）、当归羊肉汤、乌鸡汤；宜饮姜枣茶暖身。</div>
        <div class="jieqi-detail" style="color:var(--cinn)"><strong>禁忌：</strong>忌不戴手套围巾，忌脚部受寒，忌过度食用寒凉食物。</div>
      </div>
    </div>

    <div class="jieqi-card">
      <div class="jieqi-icon">❄️</div>
      <div class="jieqi-info">
        <div class="jieqi-name">大寒（1月20-21日，太阳黄经300°）</div>
        <div class="jieqi-date">十二月中气 | 寒气至极 | 五行：水</div>
        <div class="jieqi-detail"><strong>物候：</strong>鸡始乳、征鸟厉疾、水泽腹坚</div>
        <div class="jieqi-detail"><strong>养生要点：</strong>大寒是冬春交替之节，注意"外防寒、内防火"（内热易上火）；大寒节气寒气至极，防冻伤是重点；宜静养，积蓄力量，迎接新春；大寒时节流感高发，注意个人卫生和居室通风。</div>
        <div class="jieqi-detail"><strong>饮食建议：</strong>大寒吃消寒糕（年糕）、八宝饭、羊肉萝卜汤；宜饮红茶温中暖胃，适当进补但忌过度。</div>
        <div class="jieqi-detail" style="color:var(--cinn)"><strong>禁忌：</strong>忌熬夜晚起（耗伤阳气），忌过度进补伤脾，忌大寒节气发脾气（伤阳气）。</div>
      </div>
    </div>

  </div>
</div>

<div class="chapter">
  <h3 class="chapter-title">六、节气与五行对应表</h3>
  <div class="chapter-content">
    <table class="kb-table">
      <thead><tr><th>季节</th><th>节气</th><th>五行</th><th>对应脏腑</th><th>养生重点</th><th>推荐颜色</th></tr></thead>
      <tbody>
        <tr><td rowspan="6"><strong>春</strong></td><td>立春</td><td>木（阳）</td><td>肝（胆）</td><td>养肝疏肝</td><td>青绿</td></tr>
        <tr><td>雨水</td><td>木</td><td>脾</td><td>健脾祛湿</td><td>黄白</td></tr>
        <tr><td>惊蛰</td><td>木</td><td>肝</td><td>疏肝理气</td><td>青绿</td></tr>
        <tr><td>春分</td><td>木</td><td>肝</td><td>平衡阴阳</td><td>青绿</td></tr>
        <tr><td>清明</td><td>木</td><td>肝</td><td>清肝明目</td><td>青绿</td></tr>
        <tr><td>谷雨</td><td>土</td><td>脾</td><td>健脾利湿</td><td>黄</td></tr>
        <tr><td rowspan="6"><strong>夏</strong></td><td>立夏</td><td>火（阳）</td><td>心（小肠）</td><td>养心安神</td><td>红</td></tr>
        <tr><td>小满</td><td>火</td><td>心</td><td>清热利湿</td><td>红</td></tr>
        <tr><td>芒种</td><td>火</td><td>心</td><td>养心清热</td><td>赤</td></tr>
        <tr><td>夏至</td><td>火</td><td>心</td><td>养护阳气</td><td>红</td></tr>
        <tr><td>小暑</td><td>火</td><td>心</td><td>清心降火</td><td>赤</td></tr>
        <tr><td>大暑</td><td>火（伏）</td><td>心</td><td>防暑降温</td><td>红</td></tr>
        <tr><td rowspan="6"><strong>秋</strong></td><td>立秋</td><td>金（阳）</td><td>肺（大肠）</td><td>润肺养阴</td><td>白</td></tr>
        <tr><td>处暑</td><td>土</td><td>肺</td><td>滋阴润燥</td><td>白</td></tr>
        <tr><td>白露</td><td>金</td><td>肺</td><td>养肺益气</td><td>白</td></tr>
        <tr><td>秋分</td><td>金</td><td>肺</td><td>收敛肺气</td><td>白</td></tr>
        <tr><td>寒露</td><td>金</td><td>肺</td><td>养阴润肺</td><td>灰白</td></tr>
        <tr><td>霜降</td><td>土</td><td>脾</td><td>健脾养胃</td><td>黄</td></tr>
        <tr><td rowspan="6"><strong>冬</strong></td><td>立冬</td><td>水（阳）</td><td>肾（膀胱）</td><td>温补肾阳</td><td>黑</td></tr>
        <tr><td>小雪</td><td>水</td><td>肾</td><td>养肾固精</td><td>黑</td></tr>
        <tr><td>大雪</td><td>水</td><td>肾</td><td>大补肾阳</td><td>黑</td></tr>
        <tr><td>冬至</td><td>水</td><td>肾</td><td>一阳来复</td><td>黑</td></tr>
        <tr><td>小寒</td><td>水</td><td>肾</td><td>温肾驱寒</td><td>黑</td></tr>
        <tr><td>大寒</td><td>水</td><td>肾</td><td>温肾固本</td><td>黑</td></tr>
      </tbody>
    </table>
  </div>
</div>

<div class="chapter">
  <h3 class="chapter-title">七、节气养生总则</h3>
  <div class="chapter-content">
    <p>二十四节气养生是中国传统医学"天人合一"思想的体现，人应顺应自然界气候变化调摄身心：</p>
    <table class="kb-table">
      <thead><tr><th>季节</th><th>养生总则</th><th>情志调摄</th><th>起居建议</th></tr></thead>
      <tbody>
        <tr><td><strong>春</strong></td><td>春养肝，疏肝解郁，多户外踏青</td><td>戒怒，保持心情舒畅；踏青郊游抒发肝气</td><td>早睡早起，广步于庭，披发缓行</td></tr>
        <tr><td><strong>夏</strong></td><td>夏养心，清心降火，安神定志</td><td>戒怒，静心养神；心静自然凉</td><td>晚睡早起，中午小憩；适度出汗</td></tr>
        <tr><td><strong>秋</strong></td><td>秋养肺，滋阴润燥，收敛神气</td><td>戒悲，收敛肺气；登高望远</td><td>早睡早起，与鸡俱兴；秋冻有度</td></tr>
        <tr><td><strong>冬</strong></td><td>冬养肾，温阳驱寒，早卧晚起</td><td>戒恐，藏精养神；减少户外活动</td><td>早睡晚起，必待日光；避寒就温</td></tr>
      </tbody>
    </table>
    <div class="warn-box">
      <h5>⚠️ 节气交替注意事项</h5>
      <p>节气交替的前后三天为"危象期"，体弱者和慢性病患者应特别注意保养。节气当日若出现不明原因的不适，应及时就医。节气养生贵在坚持，顺应自然，方能健康长寿。</p>
    </div>
  </div>
</div>
  `;
  // ============================================================
  // 板块5：周易入门
  // ============================================================
  window.KNOWLEDGE_DETAILS.zhouyi = `
<div class="chapter">
  <h3 class="chapter-title">一、周易起源与核心思想</h3>
  <div class="chapter-content">
    <p>《易经》是中国最古老的典籍之一，位列"群经之首"。据传伏羲创制八卦，周文王演为六十四卦，孔子作《易传》十翼，形成今天所见的《周易》。</p>
    <p>《易经》的核心是<span style="color:var(--gold)">三易</span>：变易（万物时刻在变）、不易（变化有不变规律）、简易（大道至简）。以阴阳为根本，以八卦为基元，通过六十四卦的演绎，揭示宇宙人生的运行规律。</p>
    <div class="quote">
      <p class="quote-text">一阴一阳之谓道，继之者善也，成之者性也。</p>
      <p class="quote-author">——《系辞上》</p>
    </div>
    <p>《易经》不仅是占卜之书，更是哲学、自然科学、社会科学的源头活水。儒家尊之为群经之首，道家以之为修真指南，中医、兵法、建筑、风水皆源于此。</p>
  </div>
</div>

<div class="chapter">
  <h3 class="chapter-title">二、太极图与阴阳之道</h3>
  <div class="chapter-content">
    <div style="margin:24px 0;padding:24px;background:rgba(201,168,76,.04);border:1px solid rgba(201,168,76,.1);border-radius:12px;text-align:center">
      <svg width="160" height="160" viewBox="0 0 200 200" style="display:inline-block;vertical-align:middle">
        <circle cx="100" cy="100" r="95" fill="none" stroke="#c9a84c" stroke-width="2"/>
        <path d="M100,5 A95,95 0 0,1 100,195 A47.5,47.5 0 0,1 100,100 A47.5,47.5 0 0,0 100,5" fill="#f0e8d8"/>
        <path d="M100,5 A95,95 0 0,0 100,195 A47.5,47.5 0 0,0 100,100 A47.5,47.5 0 0,1 100,5" fill="#1a1a1a"/>
        <circle cx="100" cy="52.5" r="12" fill="#1a1a1a"/>
        <circle cx="100" cy="147.5" r="12" fill="#f0e8d8"/>
      </svg>
      <div style="display:inline-block;text-align:left;margin-left:24px;vertical-align:middle">
        <p style="font-size:14px;color:var(--paper2);line-height:2"><strong style="color:var(--gold)">太极生两仪：</strong>阴（⚋）与阳（☰）是宇宙最基本的两股力量。</p>
        <p style="font-size:14px;color:var(--paper2);line-height:2"><strong style="color:var(--gold)">阴阳关系：</strong>对立统一，互根互用，消长转化。</p>
        <p style="font-size:14px;color:var(--paper2);line-height:2"><strong style="color:var(--gold)">阴阳特性：</strong>阳主动、主热、主外、主刚；阴主静、主寒、主内、主柔。</p>
      </div>
    </div>
    <div class="tip-box">
      <h5>☯️ 阴阳在命理中的应用</h5>
      <p>日干为阳则刚健主动，为阴则柔顺内敛；命局阳盛则燥热需水调候，阴盛则寒湿需火温暖。阴阳平衡是命局和谐的关键，失衡则需用神来补。</p>
    </div>
  </div>
</div>

<div class="chapter">
  <h3 class="chapter-title">三、八卦详解</h3>
  <div class="chapter-content">
    <p>八卦由三个爻组成，每卦三爻，共八个卦象。八卦代表自然界八种基本现象，是《易经》的基石。</p>
    <div class="bagua-grid">
      <div class="bagua-card">
        <div class="bagua-symbol">☰</div>
        <div class="bagua-name">乾（qián）</div>
        <div class="bagua-detail"><strong>卦象：</strong>三阳爻，纯阳<br><strong>自然：</strong>天<br><strong>方位：</strong>西北<br><strong>五行：</strong>金<br><strong>家人：</strong>父<br><strong>象征：</strong>刚健、创造、领导</div>
      </div>
      <div class="bagua-card">
        <div class="bagua-symbol">☷</div>
        <div class="bagua-name">坤（kūn）</div>
        <div class="bagua-detail"><strong>卦象：</strong>三阴爻，纯阴<br><strong>自然：</strong>地<br><strong>方位：</strong>西南<br><strong>五行：</strong>土<br><strong>家人：</strong>母<br><strong>象征：</strong>柔顺、承载、包容</div>
      </div>
      <div class="bagua-card">
        <div class="bagua-symbol">☳</div>
        <div class="bagua-name">震（zhèn）</div>
        <div class="bagua-detail"><strong>卦象：</strong>一阳在下<br><strong>自然：</strong>雷<br><strong>方位：</strong>东<br><strong>五行：</strong>木<br><strong>家人：</strong>长男<br><strong>象征：</strong>震动、行动、觉醒</div>
      </div>
      <div class="bagua-card">
        <div class="bagua-symbol">☴</div>
        <div class="bagua-name">巽（xùn）</div>
        <div class="bagua-detail"><strong>卦象：</strong>一阴在下<br><strong>自然：</strong>风<br><strong>方位：</strong>东南<br><strong>五行：</strong>木<br><strong>家人：</strong>长女<br><strong>象征：</strong>顺从、渗透、谦逊</div>
      </div>
      <div class="bagua-card">
        <div class="bagua-symbol">☵</div>
        <div class="bagua-name">坎（kǎn）</div>
        <div class="bagua-detail"><strong>卦象：</strong>一阳包二阴<br><strong>自然：</strong>水<br><strong>方位：</strong>北<br><strong>五行：</strong>水<br><strong>家人：</strong>中男<br><strong>象征：</strong>险陷、智慧、流动</div>
      </div>
      <div class="bagua-card">
        <div class="bagua-symbol">☲</div>
        <div class="bagua-name">离（lí）</div>
        <div class="bagua-detail"><strong>卦象：</strong>一阴包二阳<br><strong>自然：</strong>火<br><strong>方位：</strong>南<br><strong>五行：</strong>火<br><strong>家人：</strong>中女<br><strong>象征：</strong>光明、依附、文明</div>
      </div>
      <div class="bagua-card">
        <div class="bagua-symbol">☶</div>
        <div class="bagua-name">艮（gèn）</div>
        <div class="bagua-detail"><strong>卦象：</strong>一阳在顶<br><strong>自然：</strong>山<br><strong>方位：</strong>东北<br><strong>五行：</strong>土<br><strong>家人：</strong>少男<br><strong>象征：</strong>止息、稳重、坚守</div>
      </div>
      <div class="bagua-card">
        <div class="bagua-symbol">☱</div>
        <div class="bagua-name">兑（duì）</div>
        <div class="bagua-detail"><strong>卦象：</strong>一阴在顶<br><strong>自然：</strong>泽<br><strong>方位：</strong>西<br><strong>五行：</strong>金<br><strong>家人：</strong>少女<br><strong>象征：</strong>喜悦、口舌、柔和</div>
      </div>
    </div>
    <div class="tip-box">
      <h5>📜 八卦记忆口诀</h5>
      <p><strong>乾三连，坤六断；震仰盂，艮覆碗；离中虚，坎中满；兑上缺，巽下断。</strong></p>
      <p>乾卦三爻皆为阳爻（连）；坤卦三爻皆为阴爻（断）；震卦似仰着的盂；艮卦似倒扣的碗；离卦中间阴爻（虚）；坎卦中间阳爻（满）；兑卦上爻为阴（缺）；巽卦下爻为阴（断）。</p>
    </div>
  </div>
</div>

<div class="chapter">
  <h3 class="chapter-title">四、先天八卦与后天八卦</h3>
  <div class="chapter-content">
    <table class="kb-table">
      <thead><tr><th>对比项</th><th>先天八卦（伏羲）</th><th>后天八卦（文王）</th></tr></thead>
      <tbody>
        <tr><td><strong>起源</strong></td><td>伏羲仰观天文、俯察地理而作</td><td>周文王被囚羑里时演绎</td></tr>
        <tr><td><strong>主要用途</strong></td><td>代表宇宙本体，自然规律</td><td>代表实际应用，生活方位</td></tr>
        <tr><td><strong>乾位</strong></td><td>正南（上方）</td><td>西北</td></tr>
        <tr><td><strong>坤位</strong></td><td>正北（下方）</td><td>西南</td></tr>
        <tr><td><strong>离位</strong></td><td>正东</td><td>正南</td></tr>
        <tr><td><strong>坎位</strong></td><td>正西</td><td>正北</td></tr>
        <tr><td><strong>震位</strong></td><td>东北</td><td>正东</td></tr>
        <tr><td><strong>兑位</strong></td><td>东南</td><td>正西</td></tr>
        <tr><td><strong>巽位</strong></td><td>西南</td><td>东南</td></tr>
        <tr><td><strong>艮位</strong></td><td>西北</td><td>东北</td></tr>
        <tr><td><strong>核心规律</strong></td><td>对待关系（阴阳相对）</td><td>流行关系（五行相生）</td></tr>
      </tbody>
    </table>
    <div class="tip-box">
      <h5>💡 应用区别</h5>
      <p>先天八卦用于论"体"（本体、本质），后天八卦用于论"用"（应用、变化）。风水学中，峦头用先天，理气用后天；命理学中，日干为体，大运流年为用；起卦时，上卦先天方位，下卦后天方位，可知来龙去脉。</p>
    </div>
  </div>
</div>

<div class="chapter">
  <h3 class="chapter-title">五、六十四卦总表</h3>
  <div class="chapter-content">
    <p>六十四卦由八卦两两相叠（8×8=64）而成，每卦六爻。上下各有三爻，上三爻为上卦（外卦），下三爻为下卦（内卦）。</p>
    <div style="overflow-x:auto">
    <table class="kb-table gua-table" style="font-size:11px">
      <thead><tr><th>#</th><th>卦名</th><th>卦象</th><th>上卦</th><th>下卦</th><th>核心卦辞摘要</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>乾</td><td>☰☰</td><td>乾</td><td>乾</td><td>元亨利贞（刚健纯粹，大吉之卦）</td></tr>
        <tr><td>2</td><td>坤</td><td>☷☷</td><td>坤</td><td>坤</td><td>元亨，利牝马之贞（柔顺厚重，含章可贞）</td></tr>
        <tr><td>3</td><td>屯</td><td>☵☳</td><td>坎</td><td>震</td><td>元亨利贞，勿用有攸往（初生艰难，慎行）</td></tr>
        <tr><td>4</td><td>蒙</td><td>☶☵</td><td>艮</td><td>坎</td><td>亨，匪我求童蒙，童蒙求我（启蒙发智）</td></tr>
        <tr><td>5</td><td>需</td><td>☵☰</td><td>坎</td><td>乾</td><td>有孚，光亨贞吉（耐心等待，光明在前）</td></tr>
        <tr><td>6</td><td>讼</td><td>☰☵</td><td>乾</td><td>坎</td><td>有孚窒，惕中吉终凶（慎争止讼）</td></tr>
        <tr><td>7</td><td>师</td><td>☵☷</td><td>坎</td><td>坤</td><td>贞，丈人吉，无咎（统兵有方，师出有名）</td></tr>
        <tr><td>8</td><td>比</td><td>☷☵</td><td>坤</td><td>坎</td><td>吉，原筮元永贞，无咎（亲比辅佐）</td></tr>
        <tr><td>9</td><td>小畜</td><td>☴☰</td><td>巽</td><td>乾</td><td>亨，密云不雨，自我西郊（积累阶段）</td></tr>
        <tr><td>10</td><td>履</td><td>☰☴</td><td>乾</td><td>巽</td><td>履虎尾，不咥人，亨（谨慎行事）</td></tr>
        <tr><td>11</td><td>泰</td><td>☷☰</td><td>坤</td><td>乾</td><td>小往大来，吉亨（天地交泰，大吉）</td></tr>
        <tr><td>12</td><td>否</td><td>☰☷</td><td>乾</td><td>坤</td><td>否之匪人，不利君子贞（大往小来，闭塞）</td></tr>
        <tr><td>13</td><td>同人</td><td>☰☲</td><td>乾</td><td>离</td><td>同人于野，亨，利涉大川（志同道合）</td></tr>
        <tr><td>14</td><td>大有</td><td>☲☰</td><td>离</td><td>乾</td><td>元亨（大丰收，大有所获）</td></tr>
        <tr><td>15</td><td>谦</td><td>☶☷</td><td>艮</td><td>坤</td><td>亨，君子有终（谦受益，满招损）</td></tr>
        <tr><td>16</td><td>豫</td><td>☳☷</td><td>震</td><td>坤</td><td>利建侯行师（和乐备豫，顺势而动）</td></tr>
        <tr><td>17</td><td>随</td><td>☳☰</td><td>震</td><td>乾</td><td>元亨利贞，无咎（随从有道）</td></tr>
        <tr><td>18</td><td>蛊</td><td>☶☴</td><td>艮</td><td>巽</td><td>元亨，利涉大川，先甲三日，后甲三日（整饬弊乱）</td></tr>
        <tr><td>19</td><td>临</td><td>☷☳</td><td>坤</td><td>震</td><td>元亨利贞，至于八月有凶（临下有恩）</td></tr>
        <tr><td>20</td><td>观</td><td>☴☷</td><td>巽</td><td>坤</td><td>盥而不荐，有孚颙若（观仰化育）</td></tr>
        <tr><td>21</td><td>噬嗑</td><td>☲☳</td><td>离</td><td>震</td><td>亨，利用狱（明罚敕法，去梗通阻）</td></tr>
        <tr><td>22</td><td>贲</td><td>☶☲</td><td>艮</td><td>离</td><td>亨，小利有攸往（文饰美化）</td></tr>
        <tr><td>23</td><td>剥</td><td>☷☶</td><td>坤</td><td>艮</td><td>不利有攸往（小人道长，剥落衰败）</td></tr>
        <tr><td>24</td><td>复</td><td>☳☷</td><td>震</td><td>坤</td><td>亨，出入无疾，朋来无咎（复返正道）</td></tr>
        <tr><td>25</td><td>无妄</td><td>☰☳</td><td>乾</td><td>震</td><td>元亨利贞，其匪正有眚（不妄为则吉）</td></tr>
        <tr><td>26</td><td>大畜</td><td>☶☰</td><td>艮</td><td>乾</td><td>利贞，不家食吉，利涉大川（积蓄涵养）</td></tr>
        <tr><td>27</td><td>颐</td><td>☶☳</td><td>艮</td><td>震</td><td>贞吉，观颐，自求口实（养身养德）</td></tr>
        <tr><td>28</td><td>大过</td><td>☴☱</td><td>巽</td><td>兑</td><td>栋挠，利有攸往，亨（大过人事）</td></tr>
        <tr><td>29</td><td>坎</td><td>☵☵</td><td>坎</td><td>坎</td><td>习坎，有孚，维心亨（重重险难）</td></tr>
        <tr><td>30</td><td>离</td><td>☲☲</td><td>离</td><td>离</td><td>畜牝牛，吉（光明附丽）</td></tr>
        <tr><td>31</td><td>咸</td><td>☱☶</td><td>兑</td><td>艮</td><td>亨利贞，取女吉（交感相感）</td></tr>
        <tr><td>32</td><td>恒</td><td>☳☴</td><td>震</td><td>巽</td><td>亨，无咎，利贞，利有攸往（恒久之道）</td></tr>
        <tr><td>33</td><td>遁</td><td>☰☶</td><td>乾</td><td>艮</td><td>亨，小利贞（退隐待时）</td></tr>
        <tr><td>34</td><td>大壮</td><td>☳☰</td><td>震</td><td>乾</td><td>利贞（阳刚壮盛，慎防过刚）</td></tr>
        <tr><td>35</td><td>晋</td><td>☲☷</td><td>离</td><td>坤</td><td>康侯用锡马蕃庶，昼日三接（日出地上，进取）</td></tr>
        <tr><td>36</td><td>明夷</td><td>☷☲</td><td>坤</td><td>离</td><td>利艰贞（明入地中，晦而光明）</td></tr>
        <tr><td>37</td><td>家人</td><td>☴☲</td><td>巽</td><td>离</td><td>利女贞（风自火出，齐家之道）</td></tr>
        <tr><td>38</td><td>睽</td><td>☲☴</td><td>离</td><td>巽</td><td>小事吉（二女同居，睽违乖离）</td></tr>
        <tr><td>39</td><td>蹇</td><td>☶☵</td><td>艮</td><td>坎</td><td>利西南，不利东北，利见大人（蹇难在前）</td></tr>
        <tr><td>40</td><td>解</td><td>☵☶</td><td>坎</td><td>艮</td><td>利西南，无所往，其来复吉（有攸往，夙吉）</td></tr>
        <tr><td>41</td><td>损</td><td>☶☱</td><td>艮</td><td>兑</td><td>有孚，元吉，无咎，可贞，利有攸往（损下益上）</td></tr>
        <tr><td>42</td><td>益</td><td>☴☳</td><td>巽</td><td>震</td><td>利有攸往，利涉大川（损上益下）</td></tr>
        <tr><td>43</td><td>夬</td><td>☱☰</td><td>兑</td><td>乾</td><td>扬于王庭，孚号有厉，告自邑不利即戎（决去小人）</td></tr>
        <tr><td>44</td><td>姤</td><td>☰☴</td><td>乾</td><td>巽</td><td>女壮，勿用取女（天下有风，邂逅相遇）</td></tr>
        <tr><td>45</td><td>萃</td><td>☱☷</td><td>兑</td><td>坤</td><td>亨，王假有庙，利见大人，亨利贞，用大牲吉（聚也）</td></tr>
        <tr><td>46</td><td>升</td><td>☷☴</td><td>坤</td><td>巽</td><td>南征吉，地中生木升（地中生木，渐长上升）</td></tr>
        <tr><td>47</td><td>困</td><td>☱☵</td><td>兑</td><td>坎</td><td>亨，贞，大人吉，无咎，有言不信（穷而不屈）</td></tr>
        <tr><td>48</td><td>井</td><td>☵☴</td><td>坎</td><td>巽</td><td>改邑不改井，无丧无得，往来井井（养人无穷）</td></tr>
        <tr><td>49</td><td>革</td><td>☱☲</td><td>兑</td><td>离</td><td>巳日乃孚，元亨利贞，悔亡（变革之道）</td></tr>
        <tr><td>50</td><td>鼎</td><td>☲☴</td><td>离</td><td>巽</td><td>元吉，亨（鼎新立业）</td></tr>
        <tr><td>51</td><td>震</td><td>☳☳</td><td>震</td><td>震</td><td>亨，震来虩虩，笑言哑哑（震惊百里）</td></tr>
        <tr><td>52</td><td>艮</td><td>☶☶</td><td>艮</td><td>艮</td><td>艮其背，不获其身，行其庭，不见其人，无咎（止其所止）</td></tr>
        <tr><td>53</td><td>渐</td><td>☴☶</td><td>巽</td><td>艮</td><td>女归吉，利贞（山上有木，渐进有理）</td></tr>
        <tr><td>54</td><td>归妹</td><td>☱☳</td><td>兑</td><td>震</td><td>征凶，无攸利（少女归长男，不当）</td></tr>
        <tr><td>55</td><td>丰</td><td>☲☳</td><td>离</td><td>震</td><td>亨，王假之，勿忧，宜日中（雷电皆至，盛大）</td></tr>
        <tr><td>56</td><td>旅</td><td>☶☲</td><td>艮</td><td>离</td><td>小亨，旅贞吉（山上有火，旅次他乡）</td></tr>
        <tr><td>57</td><td>巽</td><td>☴☴</td><td>巽</td><td>巽</td><td>小亨，利有攸往，利见大人（随风巽顺）</td></tr>
        <tr><td>58</td><td>兑</td><td>☱☱</td><td>兑</td><td>兑</td><td>亨，利贞（丽泽兑，喜悦之道）</td></tr>
        <tr><td>59</td><td>涣</td><td>☵☴</td><td>坎</td><td>巽</td><td>亨，王假有庙，利涉大川，利贞（风行水上，散）</td></tr>
        <tr><td>60</td><td>节</td><td>☶☵</td><td>艮</td><td>坎</td><td>亨，苦节不可贞（泽上有水，节以制度）</td></tr>
        <tr><td>61</td><td>中孚</td><td>☴☱</td><td>巽</td><td>兑</td><td>豚鱼吉，利涉大川，利贞（泽上有风，中孚）</td></tr>
        <tr><td>62</td><td>小过</td><td>☶☳</td><td>艮</td><td>震</td><td>亨，利贞，可小事，不可大事（山上有雷，小过）</td></tr>
        <tr><td>63</td><td>既济</td><td>☵☲</td><td>坎</td><td>离</td><td>亨小，利贞，初吉终乱（火在水上，已成定局）</td></tr>
        <tr><td>64</td><td>未济</td><td>☲☵</td><td>离</td><td>坎</td><td>亨，小狐汔济，濡其尾，无攸利（火水未济，事未成）</td></tr>
      </tbody>
    </table>
    </div>
  </div>
</div>

<div class="chapter">
  <h3 class="chapter-title">六、起卦方法</h3>
  <div class="chapter-content">
    <div style="margin-bottom:20px">
      <h4 style="color:var(--gold);font-family:'Ma Shan Zheng',serif;margin-bottom:8px">🪙 方法一：铜钱法（蓍草法）</h4>
      <p>这是最传统、最正统的起卦方法，需用三枚铜钱（或硬币）。</p>
      <p><strong>步骤：</strong></p>
      <p>① 净手静心，专心想着所测之事；② 将三枚铜钱放于掌心，双手合拢，摇动数次；③ 将铜钱撒在桌上（或平面上），记录其正反：背面（字面）为正面，记一个"━"（阳爻），正面（花面）为背面，记一个"⚋"（阴爻）；④ 如此摇六次，从下往上记录爻象，得到一个六爻卦；⑤ 若三枚铜钱均为同一面（全是阳或全是阴），称为"老阳/老阴"，为动爻，变卦处理。</p>
      <p><strong>记录方法：</strong>背面（字）= 阳爻 ☰；正面（花）= 阴爻 ⚋。老阳变阴爻，老阴变阳爻；其余不变。</p>
    </div>
    <div style="margin-bottom:20px">
      <h4 style="color:var(--gold);font-family:'Ma Shan Zheng',serif;margin-bottom:8px">🕐 方法二：时间法</h4>
      <p>以问卦时的年、月、日、时起卦，年用天干地支，月日用农历或节气时间。</p>
      <p><strong>步骤：</strong></p>
      <p>① 年数＋月数＋日数之和，除以8，余数为上卦；② 上数＋时数之和除以8，余数为下卦；③ 年数＋月数＋日数＋时数之和除以6，余数为动爻；④ 按余数对应八卦：1乾2兑3离4震5巽6坎7艮8坤，0视为8。</p>
      <p><strong>示例：</strong>2026年6月18日11点（午时）起卦：年数（2026 mod 8=2）+月6+日18=26，上卦26 mod 8=2（兑）；年数+月+日+时=26+7（午为7）=33，下卦33 mod 8=1（乾）；动爻=33 mod 6=3。得泽天夬卦，三爻动。</p>
    </div>
    <div>
      <h4 style="color:var(--gold);font-family:'Ma Shan Zheng',serif;margin-bottom:8px">🔢 方法三：数字法</h4>
      <p>最简便的起卦方法，心中随意想两个数字（1-9），第一个数除以8余数为上卦，第二个数除以8余数为下卦，两数之和除以6余数为动爻。</p>
      <p><strong>步骤：</strong></p>
      <p>① 心中随意想两个数字（1-9），如想8和3；② 上卦：8 mod 8=0→8（坤）；③ 下卦：3 mod 8=3（震）；④ 动爻：(8+3) mod 6=5（5爻动）；⑤ 得地雷复卦，五爻动。</p>
      <p><strong>注意事项：</strong>数字超过9时取个位数（如10→1，11→2）；也可以报三位数，第一位为上卦，前两位之和为下卦，三位数之和为动爻。</p>
    </div>
  </div>
</div>

<div class="chapter">
  <h3 class="chapter-title">七、周易在命理中的应用</h3>
  <div class="chapter-content">
    <p>《易经》不仅是占卜之书，更是命理学的理论基础。以下列举周易在命理中的核心应用：</p>
    <table class="kb-table">
      <thead><tr><th>应用领域</th><th>原理</th><th>核心内容</th></tr></thead>
      <tbody>
        <tr><td><strong>八字命理</strong></td><td>以日干为太极点，论五行生克与阴阳平衡</td><td>日干为体，财官印比为用；六爻、大运、流年参照卦象变化</td></tr>
        <tr><td><strong>六爻占卜</strong></td><td>以六爻卦象模拟事物发展全过程</td><td>世应为用神，六亲为人事，卦象变化推流年流月</td></tr>
        <tr><td><strong>梅花易数</strong></td><td>以卦象+时间+方位推人事吉凶</td><td>体用关系、旺相休囚死、五行生克比和</td></tr>
        <tr><td><strong>奇门遁甲</strong></td><td>以九宫八卦为框架排布三奇六仪</td><td>天盘、地盘、人盘三盘合一；以八卦象意解读格局</td></tr>
        <tr><td><strong>风水堪舆</strong></td><td>以八卦五行论山水形局</td><td>后天八卦方位定吉凶，玄空飞星排布挨星</td></tr>
        <tr><td><strong>姓名学</strong></td><td>以姓名笔画配八卦五行论吉凶</td><td>先天八卦数（伏羲序数1-8）配姓名笔画数</td></tr>
      </tbody>
    </table>
    <div class="tip-box">
      <h5>📚 学习周易的建议</h5>
      <p>① 先读《周易本义》（朱熹）和《周易正义》（孔颖达）奠定基础；② 熟背八卦象意和六十四卦卦辞爻辞；③ 结合实际占卜案例积累经验；④ 学习《易传》（十翼）理解义理；⑤ 研读《梅花易数》体悟象数之道。</p>
    </div>
    <div class="quote">
      <p class="quote-text">仁者见之谓之仁，智者见之谓之智，百姓日用而不知，故君子之道鲜矣。</p>
      <p class="quote-author">——《系辞上》</p>
    </div>
  </div>
</div>
  `;

  // ============================================================
  // 创建缺失的 KB section DOM 节点
  // ============================================================
  function initMissingSections() {
    var container = document.querySelector('.container');
    if (!container) return;

    var sections = ['shengxiao', 'constellation', 'jiazi', 'jieqi', 'zhouyi'];
    sections.forEach(function(id) {
      var existing = document.getElementById('kb-' + id);
      if (!existing) {
        var sec = document.createElement('div');
        sec.className = 'kb-section';
        sec.id = 'kb-' + id;
        container.appendChild(sec);
      }
    });
  }

  // DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMissingSections);
  } else {
    initMissingSections();
  }

})();
