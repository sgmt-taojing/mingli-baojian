/**
 * 命理宝鉴·医道 处方与药房系统 V1.0
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PRESCRIPTIONS_FILE = path.join(DATA_DIR, 'prescriptions.json');
const PHARMACY_ORDERS_FILE = path.join(DATA_DIR, 'pharmacy-orders.json');

// ═══ 数据加载 ═══
function loadJSON(file) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); return JSON.parse(fs.readFileSync(file, 'utf-8')); }
  catch { return []; }
}

function saveJSON(file, data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ═══ 处方模板 ═══
const FORMULA_TEMPLATES = [
  { name: '桂枝汤', herbs: [{ name: '桂枝', dosage: '9g' }, { name: '芍药', dosage: '9g' }, { name: '甘草', dosage: '6g', note: '炙' }, { name: '生姜', dosage: '9g' }, { name: '大枣', dosage: '12枚' }], source: '伤寒论', category: '解表剂', indications: ['外感风寒表虚证', '头痛发热', '汗出恶风'] },
  { name: '小柴胡汤', herbs: [{ name: '柴胡', dosage: '24g' }, { name: '黄芩', dosage: '9g' }, { name: '人参', dosage: '9g' }, { name: '半夏', dosage: '9g' }, { name: '甘草', dosage: '9g', note: '炙' }, { name: '生姜', dosage: '9g' }, { name: '大枣', dosage: '12枚' }], source: '伤寒论', category: '和解剂', indications: ['少阳证', '往来寒热', '胸胁苦满'] },
  { name: '归脾汤', herbs: [{ name: '白术', dosage: '9g' }, { name: '当归', dosage: '9g' }, { name: '茯苓', dosage: '9g' }, { name: '黄芪', dosage: '12g' }, { name: '龙眼肉', dosage: '9g' }, { name: '远志', dosage: '6g' }, { name: '酸枣仁', dosage: '12g', note: '炒' }, { name: '人参', dosage: '6g' }, { name: '木香', dosage: '6g' }, { name: '甘草', dosage: '6g', note: '炙' }], source: '济生方', category: '补益剂', indications: ['心脾两虚', '失眠', '心悸', '食少'] },
  { name: '逍遥散', herbs: [{ name: '柴胡', dosage: '9g' }, { name: '当归', dosage: '9g' }, { name: '白芍', dosage: '9g' }, { name: '白术', dosage: '9g' }, { name: '茯苓', dosage: '9g' }, { name: '甘草', dosage: '6g', note: '炙' }, { name: '生姜', dosage: '6g' }, { name: '薄荷', dosage: '6g' }], source: '太平惠民和剂局方', category: '和解剂', indications: ['肝郁血虚', '胁痛', '月经不调'] },
  { name: '六味地黄丸', herbs: [{ name: '熟地黄', dosage: '24g' }, { name: '山茱萸', dosage: '12g' }, { name: '山药', dosage: '12g' }, { name: '泽泻', dosage: '9g' }, { name: '牡丹皮', dosage: '9g' }, { name: '茯苓', dosage: '9g' }], source: '小儿药证直诀', category: '补益剂', indications: ['肾阴虚', '腰膝酸软', '头晕耳鸣'] },
  { name: '银翘散', herbs: [{ name: '金银花', dosage: '15g' }, { name: '连翘', dosage: '15g' }, { name: '桔梗', dosage: '9g' }, { name: '薄荷', dosage: '9g' }, { name: '竹叶', dosage: '6g' }, { name: '荆芥穗', dosage: '6g' }, { name: '淡豆豉', dosage: '9g' }, { name: '牛蒡子', dosage: '9g' }, { name: '甘草', dosage: '6g' }], source: '温病条辨', category: '解表剂', indications: ['风热感冒', '发热', '咽痛'] }
];

// ═══ 创建处方 ═══
function createPrescription(data) {
  const { doctor_id, doctor_name, patient_id, patient_name, diagnosis, formula_template, herbs, custom_herbs, notes, ai_suggested } = data;

  const prescriptions = loadJSON(PRESCRIPTIONS_FILE);
  const now = new Date().toISOString();
  
  const prescription = {
    id: 'RX' + Date.now().toString(36).toUpperCase(),
    doctor_id,
    doctor_name,
    patient_id,
    patient_name,
    diagnosis,
    herbs: herbs || (formula_template ? FORMULA_TEMPLATES.find(f => f.name === formula_template)?.herbs : []) || custom_herbs || [],
    formula_name: formula_template || '自定义方',
    notes: notes || '',
    ai_suggested: ai_suggested || false,
    status: 'pending_review', // pending_review → verified → dispensed → completed
    created_at: now,
    reviewed_at: null,
    reviewed_by: null,
    dispensed_at: null,
    dispensed_by: null,
    payment_status: 'unpaid',
    delivery_method: null, // self_pickup / mail / hospital_decoct / self_decoct
    delivery_address: null
  };

  prescriptions.unshift(prescription);
  saveJSON(PRESCRIPTIONS_FILE, prescriptions);
  return { ok: true, prescription };
}

// ═══ 药师审核 ═══
function reviewPrescription(prescriptionId, reviewedBy, action, notes) {
  const prescriptions = loadJSON(PRESCRIPTIONS_FILE);
  const idx = prescriptions.findIndex(p => p.id === prescriptionId);
  if (idx === -1) return { ok: false, error: '处方不存在' };

  const p = prescriptions[idx];
  if (action === 'approve') {
    p.status = 'verified';
  } else if (action === 'reject') {
    p.status = 'rejected';
    p.reject_reason = notes;
  }
  p.reviewed_at = new Date().toISOString();
  p.reviewed_by = reviewedBy;
  p.review_notes = notes || '';
  
  prescriptions[idx] = p;
  saveJSON(PRESCRIPTIONS_FILE, prescriptions);
  return { ok: true, prescription: p };
}

// ═══ 药房接方 ═══
function dispensePrescription(prescriptionId, dispensedBy, deliveryMethod, deliveryAddress) {
  const prescriptions = loadJSON(PRESCRIPTIONS_FILE);
  const idx = prescriptions.findIndex(p => p.id === prescriptionId);
  if (idx === -1) return { ok: false, error: '处方不存在' };

  const p = prescriptions[idx];
  if (p.status !== 'verified') return { ok: false, error: '处方未审核' };

  p.status = 'dispensed';
  p.dispensed_at = new Date().toISOString();
  p.dispensed_by = dispensedBy;
  p.delivery_method = deliveryMethod || 'self_pickup';
  p.delivery_address = deliveryAddress || null;

  prescriptions[idx] = p;
  saveJSON(PRESCRIPTIONS_FILE, prescriptions);

  // 创建药房订单
  createPharmacyOrder(p);

  return { ok: true, prescription: p };
}

// ═══ 药房订单 ═══
function createPharmacyOrder(prescription) {
  const orders = loadJSON(PHARMACY_ORDERS_FILE);
  
  const order = {
    id: 'PH' + Date.now().toString(36).toUpperCase(),
    prescription_id: prescription.id,
    patient_id: prescription.patient_id,
    patient_name: prescription.patient_name,
    herbs: prescription.herbs,
    status: 'preparing', // preparing → ready → delivered / picked_up
    delivery_method: prescription.delivery_method,
    delivery_address: prescription.delivery_address,
    tracking_number: prescription.delivery_method === 'mail' ? 'SF' + crypto.randomBytes(6).toString('hex').toUpperCase() : null,
    decoction_type: prescription.delivery_method === 'hospital_decoct' ? 'hospital' : 
                    prescription.delivery_method === 'self_decoct' ? 'self' : null,
    created_at: new Date().toISOString(),
    estimated_ready: estimateReadyTime(prescription.delivery_method),
    total_price: calculatePrice(prescription)
  };

  orders.unshift(order);
  saveJSON(PHARMACY_ORDERS_FILE, orders);
  return order;
}

function estimateReadyTime(method) {
  const now = new Date();
  switch (method) {
    case 'self_pickup': return new Date(now.getTime() + 30 * 60000).toISOString(); // 30分钟
    case 'hospital_decoct': return new Date(now.getTime() + 120 * 60000).toISOString(); // 2小时
    case 'mail': return new Date(now.getTime() + 48 * 3600000).toISOString(); // 2天
    case 'self_decoct': return new Date(now.getTime() + 5 * 60000).toISOString(); // 5分钟
    default: return new Date(now.getTime() + 60 * 60000).toISOString();
  }
}

function calculatePrice(prescription) {
  const herbPrices = {
    '桂枝': 3, '芍药': 4, '甘草': 2, '生姜': 1, '大枣': 2,
    '柴胡': 5, '黄芩': 4, '人参': 15, '半夏': 6, '当归': 8,
    '白术': 5, '茯苓': 4, '黄芪': 7, '龙眼肉': 10, '远志': 6,
    '酸枣仁': 8, '木香': 5, '熟地黄': 8, '山茱萸': 7, '山药': 5,
    '泽泻': 4, '牡丹皮': 5, '金银花': 4, '连翘': 4, '桔梗': 3,
    '薄荷': 2, '竹叶': 2, '荆芥穗': 3, '淡豆豉': 2, '牛蒡子': 3,
    '白芍': 5, '川芎': 5, '阿胶': 20, '麦冬': 6, '五味子': 5
  };

  let totalHerb = 0;
  for (const herb of (prescription.herbs || [])) {
    const dosage = parseInt(herb.dosage) || 9;
    const unitPrice = herbPrices[herb.name] || 5;
    totalHerb += unitPrice * (dosage / 9);
  }

  let serviceFee = 10; // 诊查费
  if (prescription.delivery_method === 'hospital_decoct') serviceFee += 20; // 煎药费
  if (prescription.delivery_method === 'mail') serviceFee += 15; // 快递费

  return {
    herb_total: Math.round(totalHerb * 100) / 100,
    service_fee: serviceFee,
    total: Math.round((totalHerb + serviceFee) * 100) / 100,
    currency: 'CNY',
    insurance_covered: false
  };
}

/**
 * 更新药房订单状态
 */
function updatePharmacyOrder(orderId, status, tracking) {
  const orders = loadJSON(PHARMACY_ORDERS_FILE);
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return { ok: false, error: '订单不存在' };

  orders[idx].status = status;
  if (tracking) orders[idx].tracking_number = tracking;
  if (status === 'delivered' || status === 'picked_up') {
    orders[idx].completed_at = new Date().toISOString();
    
    // 更新处方状态
    const prescriptions = loadJSON(PRESCRIPTIONS_FILE);
    const pIdx = prescriptions.findIndex(p => p.id === orders[idx].prescription_id);
    if (pIdx !== -1) {
      prescriptions[pIdx].status = 'completed';
      saveJSON(PRESCRIPTIONS_FILE, prescriptions);
    }
  }

  orders[idx] = orders[idx];
  saveJSON(PHARMACY_ORDERS_FILE, orders);
  return { ok: true, order: orders[idx] };
}

/**
 * 获取处方列表
 */
function getPrescriptions(filters = {}) {
  let list = loadJSON(PRESCRIPTIONS_FILE);
  if (filters.doctor_id) list = list.filter(p => p.doctor_id === filters.doctor_id);
  if (filters.patient_id) list = list.filter(p => p.patient_id === filters.patient_id);
  if (filters.status) list = list.filter(p => p.status === filters.status);
  if (filters.today) {
    const today = new Date().toISOString().slice(0, 10);
    list = list.filter(p => p.created_at.slice(0, 10) === today);
  }
  return list;
}

/**
 * 获取药房订单列表
 */
function getPharmacyOrders(filters = {}) {
  let list = loadJSON(PHARMACY_ORDERS_FILE);
  if (filters.status) list = list.filter(o => o.status === filters.status);
  return list;
}

module.exports = {
  FORMULA_TEMPLATES,
  createPrescription,
  reviewPrescription,
  dispensePrescription,
  updatePharmacyOrder,
  getPrescriptions,
  getPharmacyOrders,
  createPharmacyOrder
};
