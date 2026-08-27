/**
 * 命理宝鉴·医道 · 医审闭环引擎 v1.0
 * 所有 AI 输出必须医生签字 → 病历归档
 */
const fs = require('fs');
const path = require('path');

const AUDIT_DIR = path.join(__dirname, '..', '..', 'data', 'audit');
if (!fs.existsSync(AUDIT_DIR)) fs.mkdirSync(AUDIT_DIR, { recursive: true });

function createDraft(aiOutput, patientId, doctorId) {
  const id = 'AUD-' + Date.now().toString(36).toUpperCase();
  const draft = {
    id,
    patientId,
    doctorId,
    aiOutput,
    status: 'pending', // pending → approved | rejected | modified
    createdAt: new Date().toISOString(),
    signature: null
  };
  fs.writeFileSync(path.join(AUDIT_DIR, id + '.json'), JSON.stringify(draft, null, 2));
  return draft;
}

function signDecision(auditId, decision, doctorSig, modification = null) {
  const file = path.join(AUDIT_DIR, auditId + '.json');
  if (!fs.existsSync(file)) return { ok: false, error: '审核单不存在' };
  const draft = JSON.parse(fs.readFileSync(file, 'utf-8'));
  draft.status = decision; // approved/rejected/modified
  draft.signature = { doctorSig, signedAt: new Date().toISOString() };
  if (modification) draft.modification = modification;
  fs.writeFileSync(file, JSON.stringify(draft, null, 2));
  return draft;
}

function listPending(patientId) {
  if (!fs.existsSync(AUDIT_DIR)) return [];
  return fs.readdirSync(AUDIT_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(AUDIT_DIR, f), 'utf-8')))
    .filter(d => d.status === 'pending' && (!patientId || d.patientId === patientId));
}

module.exports = { createDraft, signDecision, listPending };
