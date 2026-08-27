/**
 * 命理宝鉴·医道 · 合规日志引擎 v1.0
 * 数据脱敏 + 审计 trail + 法规标注
 */
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', '..', 'data', 'compliance.log');

function logOperation(op) {
  const entry = {
    timestamp: new Date().toISOString(),
    actor: op.actor,
    role: op.role,
    action: op.action,
    target: op.target,
    purpose: op.purpose || '未声明',
    consent_id: op.consentId || null,
    legal_basis: op.legalBasis || '临床需要',
    data_sensitivity: op.sensitivity || 'medium',
    ip: op.ip || 'unknown'
  };
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
  return entry;
}

function desensitize(patient) {
  if (!patient) return patient;
  return {
    ...patient,
    name: patient.name ? patient.name[0] + '*'.repeat(Math.max(0, patient.name.length - 1)) : '匿名',
    id_card: patient.id_card ? patient.id_card.replace(/(\d{4})\d{10}(\d{4})/, '$1**********$2') : null,
    phone: patient.phone ? patient.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null
  };
}

const REGULATIONS = {
  'PIPL': { name: '个人信息保护法', basis: '知情同意+最小必要' },
  'HIPAA': { name: 'HIPAA Privacy Rule', basis: 'PHI minimum necessary' },
  'GDPR': { name: 'GDPR Article 9', basis: '健康数据·明示同意' },
  'NMPA': { name: '医疗器械监督管理条例', basis: '器械备案+临床验证' }
};

module.exports = { logOperation, desensitize, REGULATIONS };
