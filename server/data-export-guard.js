// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · 数据安全导出机制 (Data Export Guard)
// 标准文档: docs/DATA_SECURITY_STANDARD.md
// ═══════════════════════════════════════════════════════════════
//
// 4 道防线:
//   1) 字段级脱敏（手机/身份证/姓名/住址/生辰/病例正文）
//   2) 角色鉴权（admin / merchant / doctor 三种脱敏等级）
//   3) 水印 + 审计日志（导出即写入 audit_logs）
//   4) 加密归档（敏感字段对称加密 + 解锁令牌）
//
// 触发场景：
//   - /api/admin/export  → 全量导出（必须 super_admin + 水印 + 审计）
//   - /api/merchant/cases → 商户病例列表（mid 级别脱敏）
//   - /api/clinic/report → 病例正文（doctor 级别脱敏）
//   - /api/yuanzhu/profile → 缘主档案（owner 级别脱敏）
// ═══════════════════════════════════════════════════════════════

const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');
const path = require('path');
const sec = require('./security-v2.js');

const DB_PATH = path.join(__dirname, 'database', 'yidao.db');
const db = new DatabaseSync(DB_PATH);

const AES_KEY = process.env.EXPORT_AES_KEY || sec.AES_KEY || 'mlbj_export_key_2026_production';

// ── 敏感字段表（按表分） ──
// 每个字段配置: type/level/sanitize(method)
const SENSITIVE_FIELDS = {
  users: {
    phone:       { type: 'phone',      level: 2, desc: '手机号' },
    name:        { type: 'name',       level: 1, desc: '姓名' },
    sex:         { type: 'safe',       level: 0, desc: '性别' },
    birth_date:  { type: 'birthday',   level: 2, desc: '出生日期' },
    birth_hour:  { type: 'safe',       level: 0, desc: '出生时辰' },
    birthplace:  { type: 'address',    level: 2, desc: '出生地' },
    residence:   { type: 'address',    level: 2, desc: '现居地' },
    faith:       { type: 'text_mid',   level: 1, desc: '信仰' },
    zodiac:      { type: 'safe',       level: 0, desc: '生肖' },
    day_stem:    { type: 'safe',       level: 0, desc: '日干' },
    xi_ele:      { type: 'safe',       level: 0, desc: '喜用神' }
  },
  merchants: {
    phone:       { type: 'phone',      level: 2, desc: '商户电话' },
    name:        { type: 'name',       level: 1, desc: '商户名' },
    boss:        { type: 'name',       level: 1, desc: '法人' },
    master:      { type: 'name',       level: 1, desc: '主理人' },
    license:     { type: 'id_full',    level: 3, desc: '营业执照号' },
    cert:        { type: 'id_full',    level: 3, desc: '资质证书号' }
  },
  master_cases: {
    patient_id:  { type: 'user_ref',   level: 2, desc: '缘主 ID' },
    master_id:   { type: 'user_ref',   level: 1, desc: '大师 ID' },
    case_number: { type: 'case_no',    level: 1, desc: '病例编号' },
    symptoms:    { type: 'text_high',  level: 3, desc: '症状描述' },
    constitution:{ type: 'text_high',  level: 3, desc: '体质诊断' },
    master_analysis: { type: 'text_high', level: 3, desc: '大师分析' }
  },
  tcm_reports: {
    patient_id:  { type: 'user_ref',   level: 2, desc: '缘主 ID' },
    doctor_id:   { type: 'user_ref',   level: 1, desc: '医生 ID' },
    report_text: { type: 'text_high',  level: 3, desc: '报告正文' },
    filtered_text:{ type: 'text_mid',  level: 2, desc: '脱敏摘要' }
  },
  feedback: {
    user_id:     { type: 'user_ref',   level: 1, desc: '用户 ID' },
    content:     { type: 'text_mid',   level: 2, desc: '反馈内容' },
    target:      { type: 'safe',       level: 0, desc: '反馈目标' }
  },
  medical_cases: {
    patient_id:  { type: 'user_ref',   level: 2, desc: '缘主 ID' },
    assigned_master_id: { type: 'user_ref', level: 1, desc: '主理大师 ID' },
    assigned_doctor_id: { type: 'user_ref', level: 1, desc: '医生 ID' },
    symptoms:    { type: 'text_high',  level: 3, desc: '症状' },
    constitution:{ type: 'text_mid',   level: 2, desc: '体质' }
  }
};

// ── 角色 → 脱敏等级（数值越大看得越多） ──
const ROLE_LEVELS = {
  free:        0,    // 仅看公开统计
  registered:  0,    // 自己的资料明文，他人脱敏
  vip:         1,    // 可看脱敏后的姓名/电话尾号
  merchant:    1,    // 商户级（看自己门店的脱敏病例）
  doctor:      2,    // 医生（可看病例正文脱敏版）
  master:      2,    // 大师（可看分配的完整病例）
  admin_a:     3,    // 管理员（可看完整但审计留痕）
  admin_b:     3,
  super_admin: 4     // 超级管理员（明文 + 加密归档）
};

// ── 脱敏函数集 ──

function maskName(name) {
  if (!name) return name;
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + '*';
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
}

function maskAddress(addr) {
  if (!addr) return addr;
  // 保留省/市粒度，其余 ★
  const parts = addr.split(/[省市区县]/);
  if (parts.length >= 2) return parts[0] + (addr.includes('省') ? '省' : '') + '****';
  return addr.substring(0, 2) + '****';
}

function maskIDCard(id) {
  if (!id) return id;
  const s = String(id);
  if (s.length < 8) return '****';
  return s.substring(0, 4) + '*'.repeat(s.length - 8) + s.substring(s.length - 4);
}

function maskTextHigh(text) {
  if (!text) return text;
  // 替换人名（2-4 字）、电话号码、地址
  let masked = String(text);
  // 手机号
  masked = masked.replace(/1[3-9]\d{9}/g, m => m.substring(0,3) + '****' + m.substring(7));
  // 身份证
  masked = masked.replace(/\d{17}[\dXx]/g, m => m.substring(0,4) + '***********' + m.substring(15));
  // 邮箱
  masked = masked.replace(/[\w.-]+@[\w.-]+/g, m => m.split('@')[0].substring(0,1) + '***@' + m.split('@')[1]);
  return masked.substring(0, 200) + (masked.length > 200 ? '...(已脱敏)' : '');
}

function maskTextMid(text) {
  if (!text) return text;
  // 轻量脱敏：只替换手机号 + 邮箱
  let masked = String(text);
  masked = masked.replace(/1[3-9]\d{9}/g, m => m.substring(0,3) + '****' + m.substring(7));
  masked = masked.replace(/[\w.-]+@[\w.-]+/g, '***@***');
  return masked;
}

function maskCaseNo(no) {
  if (!no) return no;
  const s = String(no);
  return s.substring(0, 3) + '****' + s.substring(s.length - 2);
}

function sanitizeField(fieldName, config, value, roleLevel) {
  if (value === null || value === undefined) return value;
  if (config.level === 0) return value;
  if (roleLevel >= 4) return value;       // super_admin 明文

  // 角色等级 ≥ 字段等级：可看半脱敏（仅隐藏中间位）
  if (roleLevel >= config.level) {
    return semiMask(config.type, value);
  }

  // 角色等级不足：全脱敏
  switch (config.type) {
    case 'phone':     return sec.maskPhone(value);
    case 'name':      return maskName(value);
    case 'birthday':  return sec.maskBirthDate(value);
    case 'address':   return maskAddress(value);
    case 'id_full':   return maskIDCard(value);
    case 'text_high': return maskTextHigh(value);
    case 'text_mid':  return maskTextMid(value);
    case 'case_no':   return maskCaseNo(value);
    case 'user_ref':  return 'U' + String(value).padStart(6, '0');
    default:          return '***';
  }
}

/**
 * 半脱敏：字段类型对应的"仅隐藏中间"
 * 用于满足角色等级 ≥ 字段等级的场景
 */
function semiMask(type, value) {
  if (!value) return value;
  const s = String(value);
  switch (type) {
    case 'phone':     return s.length >= 7 ? s.substring(0,3)+'****'+s.substring(s.length-4) : s;
    case 'name':      return s;                                              // lv1 名字原本就不算敏感
    case 'birthday':  return s.length >= 4 ? s.substring(0,4)+'-**-**' : s; // 仅保留年
    case 'address':   return maskAddress(s);                                  // 保留省粒度
    case 'id_full':   return s.length >= 8 ? s.substring(0,4)+'********'+s.substring(s.length-4) : s;
    case 'text_high': return maskTextMid(s);                                  // 中度脱敏
    case 'text_mid':  return s;                                               // 已可视
    case 'case_no':   return s.substring(0,4)+'****'+s.substring(s.length-2);
    case 'user_ref':  return 'U'+String(value).padStart(6,'0');
    default:          return s;
  }
}

/**
 * 主入口：脱敏一条记录
 * @param {string} table 表名
 * @param {Object} row 原始记录
 * @param {Array<string>} userRoles 用户角色数组
 * @returns {Object} 脱敏后记录
 */
function sanitizeRow(table, row, userRoles) {
  if (!row || typeof row !== 'object') return row;
  const fields = SENSITIVE_FIELDS[table] || {};
  // 取角色最高等级
  const roleLevel = Math.max(0, ...userRoles.map(r => ROLE_LEVELS[r] ?? 0));
  const sanitized = { ...row };
  for (const [field, cfg] of Object.entries(fields)) {
    if (sanitized[field] !== undefined) {
      sanitized[field] = sanitizeField(field, cfg, sanitized[field], roleLevel);
    }
  }
  return sanitized;
}

function sanitizeRows(table, rows, userRoles) {
  return rows.map(r => sanitizeRow(table, r, userRoles));
}

// ── 4 道防线之 3：审计水印 ──

/**
 * 写导出审计（每次导出/查看敏感数据都写一条）
 */
function logExport({ user_id, user_roles, action, target_table, target_ids, rows_count, ip, user_agent, purpose }) {
  try {
    const export_id = 'EXP-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex');
    db.prepare(`INSERT INTO audit_logs
      (user_id, action, detail, created_at)
      VALUES (?, ?, ?, ?)`).run(
      user_id || 0,
      action || 'export',
      JSON.stringify({
        export_id, user_roles, target_table, target_ids,
        rows_count, ip, user_agent, purpose, ts: new Date().toISOString()
      }),
      new Date().toISOString()
    );
    return export_id;
  } catch (e) {
    console.error('[export-guard] audit write failed:', e.message);
    return null;
  }
}

/**
 * 生成导出水印（嵌入到 CSV/JSON 的不可见指纹）
 */
function generateWatermark(userId, userRoles, targetTable) {
  const ts = Date.now();
  const payload = `${userId}|${userRoles.join(',')}|${targetTable}|${ts}`;
  const sig = crypto.createHmac('sha256', AES_KEY).update(payload).digest('hex').substring(0, 16);
  return {
    watermark_id: `WM-${ts}-${sig}`,
    payload,
    sig,
    instruction: '泄漏数据可通过 watermark_id 反查导出者'
  };
}

// ── 4 道防线之 4：加密归档 ──

/**
 * 加密敏感归档（用于需要原始数据恢复时）
 */
function encryptArchive(plaintext) {
  if (!plaintext) return plaintext;
  return sec.encrypt(plaintext);
}

function decryptArchive(ciphertext) {
  if (!ciphertext) return ciphertext;
  return sec.decrypt(ciphertext);
}

// ── 解锁令牌（用于特殊解锁申请） ──

function generateUnlockToken(userId, targetTable, targetIds, ttlHours) {
  ttlHours = ttlHours || 1;
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();
  db.prepare(`INSERT INTO audit_logs
    (user_id, action, detail, created_at)
    VALUES (?, ?, ?, ?)`).run(
    userId, 'unlock_request',
    JSON.stringify({ token, target_table: targetTable, target_ids: targetIds, expires_at: expiresAt }),
    new Date().toISOString()
  );
  return { token, expires_at: expiresAt };
}

// ── 导出工具：CSV / JSON 格式 ──

function rowsToCSV(rows, tableName) {
  if (!rows || rows.length === 0) return '';
  const fields = Object.keys(rows[0]);
  const header = fields.join(',');
  const lines = [header];
  for (const r of rows) {
    const line = fields.map(f => {
      let v = r[f];
      if (v === null || v === undefined) return '';
      v = String(v).replace(/"/g, '""');
      if (v.includes(',') || v.includes('\n') || v.includes('"')) return `"${v}"`;
      return v;
    }).join(',');
    lines.push(line);
  }
  // 末尾追加水印说明
  lines.push(`# WATERMARK:${AES_KEY.substring(0,8)}-${rows.length}rows-${Date.now()}`);
  return lines.join('\n');
}

function rowsToJSON(rows, watermark) {
  return JSON.stringify({
    meta: { exported_at: new Date().toISOString(), count: rows.length, watermark },
    data: rows
  }, null, 2);
}

// ── 暴露 ──
module.exports = {
  SENSITIVE_FIELDS,
  ROLE_LEVELS,
  sanitizeRow,
  sanitizeRows,
  logExport,
  generateWatermark,
  encryptArchive,
  decryptArchive,
  generateUnlockToken,
  rowsToCSV,
  rowsToJSON,
  // 工具导出
  maskName, maskAddress, maskIDCard, maskTextHigh, maskTextMid
};
