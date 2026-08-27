/**
 * 命理宝鉴·医道 患者诊所 API
 * 纯中医诊疗：建档 → 辨证 → 处方 → 复诊
 *
 * 角色映射：
 * - 患者(patient) — 中医诊疗
 * - 医生(doctor) — 辨证开方
 * - 药房(pharmacy) — 抓药煎药
 */
const express = require('express');
const router = express.Router();
const db = require('./db');

// ===== 1. 患者档案（纯中医）=====
router.post('/api/clinic/patient/create', (req, res) => {
  const { name, gender, age, phone, constitution, chief_complaint } = req.body;
  if (!name) return res.status(400).json({ error: '姓名不能为空' });
  const result = db.prepare(`
    INSERT INTO patients (name, gender, age, phone, constitution, chief_complaint, created_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(name, gender, age, phone, constitution, chief_complaint);
  res.json({ ok: true, patient_id: result.lastInsertRowid });
});

// GET /api/clinic/patient/:id — 获取患者完整档案（中医）
router.get('/api/clinic/patient/:id', (req, res) => {
  const patientId = req.params.id;
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
  if (!patient) return res.status(404).json({ error: '患者不存在' });
  const medicalHistory = db.prepare(`
    SELECT m.*, d.name AS doctor_name
    FROM medical_records m
    LEFT JOIN doctors d ON m.doctor_id = d.id
    WHERE m.patient_id = ?
    ORDER BY m.created_at DESC LIMIT 20
  `).all(patientId);
  const prescriptions = db.prepare(`
    SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY created_at DESC LIMIT 20
  `).all(patientId);
  res.json({ ok: true, patient, medicalHistory, prescriptions });
});

// ===== 2. 创建诊疗记录（中医辨证）=====
router.post('/api/clinic/record/create', (req, res) => {
  const { patient_id, doctor_id, syndrome, treatment, tongue, pulse } = req.body;
  if (!patient_id || !doctor_id || !syndrome) {
    return res.status(400).json({ error: '缺少必要字段' });
  }
  const result = db.prepare(`
    INSERT INTO medical_records (patient_id, doctor_id, syndrome, treatment, tongue, pulse, created_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(patient_id, doctor_id, syndrome, treatment, tongue, pulse);
  res.json({ ok: true, record_id: result.lastInsertRowid });
});

// ===== 3. 处方（中医方剂）=====
router.post('/api/clinic/prescription/create', (req, res) => {
  const { record_id, patient_id, doctor_id, formula_name, herbs, dosage, notes } = req.body;
  if (!record_id || !patient_id || !formula_name || !herbs) {
    return res.status(400).json({ error: '缺少必要字段' });
  }
  const result = db.prepare(`
    INSERT INTO prescriptions (record_id, patient_id, doctor_id, formula_name, herbs, dosage, notes, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, '待抓', CURRENT_TIMESTAMP)
  `).run(record_id, patient_id, doctor_id, formula_name, JSON.stringify(herbs), dosage, notes);
  res.json({ ok: true, prescription_id: result.lastInsertRowid });
});

module.exports = router;
