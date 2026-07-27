/* ===== R89-P2 动态八卦生克图：宇宙能量场 ===== */
(function () {
  'use strict';
  // 八卦先天数 + 卦象字符（先天八卦序：乾兑离震巽坎艮坤）
  const BAGUA = [
    { name: '乾', wx: '金', idx: 1 },
    { name: '兑', wx: '金', idx: 2 },
    { name: '离', wx: '火', idx: 3 },
    { name: '震', wx: '木', idx: 4 },
    { name: '巽', wx: '木', idx: 5 },
    { name: '坎', wx: '水', idx: 6 },
    { name: '艮', wx: '土', idx: 7 },
    { name: '坤', wx: '土', idx: 8 }
  ];
  // 12 地支
  const DIZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

  function buildCosmic() {
    const arena = document.getElementById('cosmicArena');
    if (!arena) return;
    const circle = document.getElementById('baguaCircle');
    const rays = document.getElementById('dizhiRays');
    if (!circle || !rays) return;
    const R = 165; // 卦象圆心半径
    const RAY = 175; // 地支射线起点
    const RAY_END = 188;
    // 注入八卦（8 个圆 + 卦名）
    BAGUA.forEach((g, i) => {
      const angle = (Math.PI * 2 * i) / 8 - Math.PI / 2;
      const x = 200 + R * Math.cos(angle);
      const y = 200 + R * Math.sin(angle);
      const g1 = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g1.setAttribute('transform', `translate(${x} ${y})`);
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('r', '18');
      c.setAttribute('class', `gua-circle gua-${g.wx}`);
      g1.appendChild(c);
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('class', 'gua-char');
      t.setAttribute('x', '0');
      t.setAttribute('y', '0');
      t.textContent = g.name;
      g1.appendChild(t);
      circle.appendChild(g1);
    });
    // 注入 12 道地支射线
    DIZHI.forEach((dz, i) => {
      const angle = (Math.PI * 2 * i) / 12 - Math.PI / 2;
      const x1 = 200 + RAY * Math.cos(angle);
      const y1 = 200 + RAY * Math.sin(angle);
      const x2 = 200 + RAY_END * Math.cos(angle);
      const y2 = 200 + RAY_END * Math.sin(angle);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1); line.setAttribute('y1', y1);
      line.setAttribute('x2', x2); line.setAttribute('y2', y2);
      line.setAttribute('class', 'dizhi-ray');
      line.style.animationDelay = (i * 0.25) + 's';
      rays.appendChild(line);
    });
    // 鼠标悬停：八卦字符亮起
    const svg = document.getElementById('cosmicSvg');
    if (svg) {
      svg.addEventListener('mousemove', function (e) {
        const rect = svg.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const dx = (e.clientX - rect.left) - cx;
        const dy = (e.clientY - rect.top) - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const norm = Math.min(1, dist / (rect.width / 2));
        // 用 norm 调制八卦透明度（中央 1 → 边缘 0.5）
        svg.querySelectorAll('.gua-char').forEach(function (el, i) {
          el.style.opacity = (0.5 + 0.5 * (1 - norm)).toFixed(2);
        });
      });
      svg.addEventListener('mouseleave', function () {
        svg.querySelectorAll('.gua-char').forEach(function (el) {
          el.style.opacity = '0.9';
        });
      });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildCosmic);
  } else {
    buildCosmic();
  }
})();
