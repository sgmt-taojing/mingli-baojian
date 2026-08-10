/* ===== R89-P2 黄历日历热力图 ===== */
(function () {
  'use strict';
  // 12 建除映射（决定每日吉凶能量）
  const JIANCHU_LV = {
    '建': 70, '除': 60, '满': 80, '平': 50, '定': 85, '执': 75,
    '破': 20, '危': 25, '成': 80, '收': 70, '开': 90, '闭': 30
  };
  const HEAT_COLORS = {
    90: '#2c5e2e', 80: '#3d8a3d', 75: '#5fa85f', 70: '#8bc58b',
    60: '#a8b894', 50: '#a8a394', 30: '#c8806b', 25: '#a8483a',
    20: '#7a1f15', 0: '#3a1810'
  };

  function lvColor(lv) {
    if (lv >= 85) return HEAT_COLORS[90];
    if (lv >= 75) return HEAT_COLORS[80];
    if (lv >= 70) return HEAT_COLORS[75];
    if (lv >= 60) return HEAT_COLORS[70];
    if (lv >= 50) return HEAT_COLORS[50];
    if (lv >= 30) return HEAT_COLORS[30];
    if (lv >= 20) return HEAT_COLORS[20];
    return HEAT_COLORS[0];
  }

  // 节气近似表（年）
  function jieqiOf(y, m, d) {
    const JIEQI = {
      2026: { 1:[5,20], 2:[4,19], 3:[6,21], 4:[5,20], 5:[6,21], 6:[6,21], 7:[7,23], 8:[8,23], 9:[8,23], 10:[8,24], 11:[7,22], 12:[7,22] },
      2027: { 1:[5,20], 2:[4,19], 3:[6,20], 4:[5,20], 5:[6,21], 6:[6,22], 7:[7,23], 8:[8,23], 9:[8,23], 10:[8,24], 11:[7,22], 12:[7,22] }
    };
    const yData = JIEQI[y];
    if (!yData) return null;
    const days = yData[m];
    if (!days) return null;
    if (Math.abs(d - days[0]) <= 1) return '节';
    if (Math.abs(d - days[1]) <= 1) return '气';
    return null;
  }

  // 简化的建除算法（与后端 _zeriComputeGZ 一致）
  function jianchuOf(y, m, d) {
    const JIANCHU = ['建','除','满','平','定','执','破','危','成','收','开','闭'];
    const utc = Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 31);
    const dayGzIdx = ((40 + Math.floor(utc / 86400000)) % 60 + 60) % 60;
    const monthGzIdx = ((y - 1900) * 12 + m + 13) % 60;
    const idx = (monthGzIdx % 12 - dayGzIdx % 12 + 12) % 12;
    return JIANCHU[idx];
  }

  function buildHeatmap() {
    const root = document.getElementById('heatmapMonths');
    const detail = document.getElementById('heatmapDetail');
    if (!root || !detail) return;
    const year = 2026; // 当前年（固定，可按系统年动态）
    const today = new Date();
    const isCurrentYear = today.getFullYear() === year;
    const todayDay = isCurrentYear ? today.getMonth() * 0 + today.getDate() : -1; // 简化
    const monthsCount = 12;
    root.innerHTML = '';
    for (let m = 1; m <= monthsCount; m++) {
      const monthEl = document.createElement('div');
      monthEl.className = 'hm-month';
      const title = document.createElement('div');
      title.className = 'hm-month-title';
      title.textContent = m + '月';
      monthEl.appendChild(title);
      const grid = document.createElement('div');
      grid.className = 'hm-grid';
      const daysInMonth = new Date(year, m, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const jc = jianchuOf(year, m, d);
        const lv = JIANCHU_LV[jc] || 50;
        const jq = jieqiOf(year, m, d);
        // 节气日能量 +20
        const finalLv = jq ? Math.min(95, lv + 20) : lv;
        const cell = document.createElement('div');
        cell.className = 'hm-cell';
        if (jq) cell.classList.add('hm-jieqi');
        cell.style.background = lvColor(finalLv);
        cell.title = year + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0') + ' ' + jc + (jq ? ' · ' + jq : '') + ' (能量' + finalLv + ')';
        cell.setAttribute('role', 'button');
        cell.setAttribute('tabindex', '0');
        cell.setAttribute('aria-label', cell.title);
        cell.addEventListener('click', function () { showDetail(year, m, d, jc, finalLv, jq); });
        cell.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            showDetail(year, m, d, jc, finalLv, jq);
          }
        });
        grid.appendChild(cell);
      }
      monthEl.appendChild(grid);
      root.appendChild(monthEl);
    }

    function showDetail(y, m, d, jc, lv, jq) {
      const dateStr = y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const yiji = {
        '建': { yi: '祭祀、祈福', ji: '动土、嫁娶' },
        '除': { yi: '扫舍、沐浴', ji: '开业、安葬' },
        '满': { yi: '祭祀、纳财', ji: '动土、开仓' },
        '平': { yi: '一般日常', ji: '重大决策' },
        '定': { yi: '签约、嫁娶、开业', ji: '诉讼、出行' },
        '执': { yi: '捕捉、诉讼', ji: '开张、嫁娶' },
        '破': { yi: '拆除、清理', ji: '嫁娶、开业' },
        '危': { yi: '高危作业', ji: '出行、动土' },
        '成': { yi: '开业、嫁娶、签约', ji: '诉讼、解除' },
        '收': { yi: '纳财、收藏', ji: '开业、嫁娶' },
        '开': { yi: '开业、入学、出行', ji: '安葬、诉讼' },
        '闭': { yi: '安葬、收藏', ji: '开业、嫁娶' }
      };
      const yi = (yiji[jc] && yiji[jc].yi) || '—';
      const ji = (yiji[jc] && yiji[jc].ji) || '—';
      detail.innerHTML =
        '<div class="hd-card">' +
          '<div class="hd-date">' + dateStr + (jq ? ' <span class="hd-jieqi">' + jq + '</span>' : '') + '</div>' +
          '<div class="hd-jianchu">建除：<strong>' + jc + '</strong></div>' +
          '<div class="hd-energy">能量：<span class="hd-energy-num" style="color:' + lvColor(lv) + '">' + lv + '</span> / 100</div>' +
          '<div class="hd-yi"><span class="hd-label">宜</span>' + yi + '</div>' +
          '<div class="hd-ji"><span class="hd-label">忌</span>' + ji + '</div>' +
        '</div>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildHeatmap);
  } else {
    buildHeatmap();
  }
})();