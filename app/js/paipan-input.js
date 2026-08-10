/* ================================================================
 * P0 排盘三规范：出生地 + 出生时刻 + 性别
 * 必填校验 → 反馈缺失字段 → 阻断残缺报告
 * 复用：provinces.json（省份经纬度） + paipan-server /paipan 端点
 * 引用：综合术数智能体.docx §数据质量规范
 * ================================================================ */

// P0-1：省份经纬度映射（覆盖 31 省级行政区 + 港澳台）
const PROVINCES_LNG = {
  北京: 116.40, 天津: 117.20, 上海: 121.47, 重庆: 106.55,
  河北: 114.51, 山西: 112.55, 辽宁: 123.43, 吉林: 125.33,
  黑龙江: 126.63, 江苏: 118.78, 浙江: 120.15, 安徽: 117.27,
  福建: 119.30, 江西: 115.89, 山东: 117.00, 河南: 113.65,
  湖北: 114.30, 湖南: 112.98, 广东: 113.27, 海南: 110.32,
  四川: 104.07, 贵州: 106.71, 云南: 102.71, 陕西: 108.95,
  甘肃: 103.83, 青海: 101.78, 内蒙古: 110.53, 广西: 108.33,
  西藏: 91.13, 宁夏: 106.27, 新疆: 87.62,
  香港: 114.17, 澳门: 113.54, 台湾: 121.02,
  // 常见直辖市/自治州/海外
  深圳: 114.05, 广州: 113.26, 杭州: 120.15, 成都: 104.07,
  武汉: 114.30, 南京: 118.78, 西安: 108.95, 苏州: 120.62,
  厦门: 118.11, 青岛: 120.38, 大连: 121.62, 哈尔滨: 126.63,
  长春: 125.33, 沈阳: 123.43, 济南: 117.00, 郑州: 113.65,
  长沙: 112.98, 福州: 119.30, 合肥: 117.27, 南昌: 115.89,
  昆明: 102.71, 贵阳: 106.71, 南宁: 108.33, 海口: 110.32,
  兰州: 103.83, 西宁: 101.78, 乌鲁木齐: 87.62, 呼和浩特: 110.53,
  拉萨: 91.13, 银川: 106.27, 香港岛: 114.17, 台北: 121.02
};

// P0-2：时区映射（统一东八区为主，海外精确处理）
const PROVINCES_TZ = {
  新疆: 6, 西藏: 6, 北京: 8, 上海: 8, 香港: 8, 台北: 8,
  // 海外常见时区
  东京: 9, 首尔: 9, 新加坡: 8, 悉尼: 10, 纽约: -5, 伦敦: 0, 巴黎: 1
};

// P0-3：早晚子时区段（用于 23:00-01:00 子时归属）
const ZI_SECT_HOURS = {
  early: [23, 0],  // 晚子时（23-24）→ 当日
  late: [0, 1]     // 早子时（00-01）→ 次日
};

// P0-4：时辰可选列表（带时辰对应 2 小时段）
const SHI_CHEN = [
  { name: '子时', range: '23:00-01:00', start: 23, end: 1, idx: 0 },
  { name: '丑时', range: '01:00-03:00', start: 1, end: 3, idx: 1 },
  { name: '寅时', range: '03:00-05:00', start: 3, end: 5, idx: 2 },
  { name: '卯时', range: '05:00-07:00', start: 5, end: 7, idx: 3 },
  { name: '辰时', range: '07:00-09:00', start: 7, end: 9, idx: 4 },
  { name: '巳时', range: '09:00-11:00', start: 9, end: 11, idx: 5 },
  { name: '午时', range: '11:00-13:00', start: 11, end: 13, idx: 6 },
  { name: '未时', range: '13:00-15:00', start: 13, end: 15, idx: 7 },
  { name: '申时', range: '15:00-17:00', start: 15, end: 17, idx: 8 },
  { name: '酉时', range: '17:00-19:00', start: 17, end: 19, idx: 9 },
  { name: '戌时', range: '19:00-21:00', start: 19, end: 21, idx: 10 },
  { name: '亥时', range: '21:00-23:00', start: 21, end: 23, idx: 11 }
];

// P0-5：识别时段 → 时辰 + idx（用于自动填充）
function resolveShiChen(hour, minute) {
  const t = hour + minute / 60;
  for (const sc of SHI_CHEN) {
    if (sc.start <= sc.end) {
      if (t >= sc.start && t < sc.end) return sc;
    } else {
      // 跨午夜（子时）
      if (t >= sc.start || t < sc.end) return sc;
    }
  }
  return null;
}

// P0-6：核心校验 → 返回 { ok, missing[], warnings[], normalized{} }
function validatePaipanInput(input) {
  const missing = [];
  const warnings = [];
  const normalized = { ...input };

  // 校验 1：性别
  if (!input.gender || !['male', 'female'].includes(input.gender)) {
    missing.push({ field: 'gender', label: '性别', example: '男/女' });
  }

  // 校验 2：出生日期（公历/农历均需年月日）
  if (!input.year || !input.month || !input.day) {
    missing.push({ field: 'date', label: '出生年月日', example: '1990-10-28' });
  } else {
    const y = parseInt(input.year, 10);
    const m = parseInt(input.month, 10);
    const d = parseInt(input.day, 10);
    if (isNaN(y) || y < 1900 || y > 2100) {
      warnings.push({ field: 'year', msg: `年份 ${y} 超出合理范围 [1900-2100]` });
    }
    if (isNaN(m) || m < 1 || m > 12) {
      missing.push({ field: 'month', label: '出生月份', example: '1-12' });
    }
    if (isNaN(d) || d < 1 || d > 31) {
      missing.push({ field: 'day', label: '出生日期', example: '1-31' });
    }
  }

  // 校验 3：出生时刻（P0 必填 — 排盘时辰断命核心）
  if (input.hour === undefined || input.hour === null || input.hour === '') {
    missing.push({ field: 'hour', label: '出生时刻（时辰）', example: '07:00 或 辰时' });
  } else {
    const h = parseInt(input.hour, 10);
    const min = parseInt(input.minute || 0, 10);
    if (isNaN(h) || h < 0 || h > 23) {
      missing.push({ field: 'hour', label: '出生时刻（小时）', example: '0-23' });
    } else {
      normalized.hour = h;
      normalized.minute = isNaN(min) ? 0 : min;
      normalized.shiChen = resolveShiChen(h, normalized.minute);
      // 早晚子时提示
      if (normalized.shiChen && normalized.shiChen.name === '子时') {
        warnings.push({ field: 'zi_sect', msg: '子时横跨午夜，请确认是晚子（23-24）还是早子（00-01），影响日柱归属' });
      }
    }
  }

  // 校验 4：出生地（P0 推荐 — 真太阳时 + 流年方位核心）
  if (!input.birthPlace) {
    warnings.push({
      field: 'birthPlace',
      msg: '建议补充出生地（精确到城市/省份），否则使用北京时区 + 东八区默认，可能影响真太阳时与流年方位',
      severity: 'soft'
    });
  } else if (PROVINCES_LNG[input.birthPlace] !== undefined) {
    normalized.lng = PROVINCES_LNG[input.birthPlace];
    normalized.tz = PROVINCES_TZ[input.birthPlace] || 8;
    normalized.placeResolved = true;
  } else {
    warnings.push({
      field: 'birthPlace',
      msg: `出生地"${input.birthPlace}"未在已知经纬度表中，将使用默认（北京 116.4 / 东八区），请手动指定经度`,
      severity: 'soft'
    });
  }

  return {
    ok: missing.length === 0,
    missing,
    warnings,
    normalized
  };
}

// P0-7：反馈缺失字段（中文提示，按微信入口策略：直接反馈，不报错）
function buildMissingPrompt(validation) {
  if (validation.missing.length === 0) return null;
  const lines = ['⚠️ 排盘需要补充以下信息：', ''];
  validation.missing.forEach((m, i) => {
    lines.push(`${i + 1}. 【${m.label}】例如：${m.example}`);
  });
  if (validation.warnings.length) {
    lines.push('', '📋 可选补充（建议提供以提高精度）：');
    validation.warnings.forEach((w, i) => {
      lines.push(`• ${w.msg}`);
    });
  }
  lines.push('', '💡 排盘数据完整度直接决定报告准确度，请尽量补全');
  return lines.join('\n');
}

// P0-8：构建排盘 args（直接对接 paipan-server.py CLI）
function buildPaipanArgs(input) {
  const v = validatePaipanInput(input);
  if (!v.ok) throw new Error('排盘输入不完整：' + v.missing.map(m => m.label).join(', '));
  const n = v.normalized;
  const args = [
    String(n.year),
    String(n.month),
    String(n.day),
    String(n.hour),
    String(n.minute || 0),
    '--gender', n.gender
  ];
  if (n.lng !== undefined) args.push('--lng', String(n.lng));
  if (n.tz !== undefined) args.push('--tz', String(n.tz));
  if (n.lunar) args.push('--lunar');
  return args;
}

// 浏览器 / Node 双环境导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PROVINCES_LNG, PROVINCES_TZ, SHI_CHEN, ZI_SECT_HOURS,
    resolveShiChen, validatePaipanInput, buildMissingPrompt, buildPaipanArgs
  };
}
if (typeof window !== 'undefined') {
  window.PaipanInput = {
    PROVINCES_LNG, PROVINCES_TZ, SHI_CHEN, ZI_SECT_HOURS,
    resolveShiChen, validatePaipanInput, buildMissingPrompt, buildPaipanArgs
  };
}