/**
 * TCM-Agent 处方闭环中间件 V1.0
 * 医生→药师→患者 跨页面数据通道
 * 通过 localStorage 实现跨页面实时联动
 */

(function() {
  if (typeof window === 'undefined') return;

  var RX = window.TCM_RX = window.TCM_RX || {};

  // ─── 处方状态机 ───
  var STATUS = {
    draft:           { label: '草稿',     icon: '📝', color: '#9b8b7f' },
    pending_review:  { label: '待审核',   icon: '⏳', color: '#2563eb' },
    verified:        { label: '已审核',   icon: '✅', color: '#16a34a' },
    paid:            { label: '已支付',   icon: '💳', color: '#7c3aed' },
    dispensed:       { label: '调配中',   icon: '🔄', color: '#b8860b' },
    ready:           { label: '待取药',   icon: '📦', color: '#16a34a' },
    completed:       { label: '已完成',   icon: '✔️', color: '#6b3a1f' },
    rejected:        { label: '已退回',   icon: '❌', color: '#c0392b' },
    cancelled:       { label: '已取消',   icon: '🗑️', color: '#9b8b7f' }
  };

  // ─── 创建处方 ───
  RX.create = function(data) {
    var rx = {
      id: 'RX' + Date.now().toString(36).toUpperCase(),
      patient_name: data.patient_name || '',
      patient_id: data.patient_id || '',
      patient_age: data.patient_age || '',
      patient_gender: data.patient_gender || '',
      doctor_name: data.doctor_name || '',
      doctor_id: data.doctor_id || '',
      diagnosis: data.diagnosis || '',
      treatment: data.treatment || '',
      herbs: data.herbs || [],
      decoction_method: data.decoction_method || 'self_decoct',
      delivery_method: data.delivery_method || 'self_pickup',
      delivery_address: data.delivery_address || '',
      notes: data.notes || '',
      status: 'pending_review',
      created_at: new Date().toISOString(),
      reviewed_at: null,
      reviewed_by: null,
      paid_at: null,
      payment_method: null,
      dispensed_at: null,
      completed_at: null,
      total_price: calculatePrice(data.herbs, data.decoction_method, data.delivery_method)
    };

    TCM.store.push('prescriptions', rx);
    return rx;
  };

  function calculatePrice(herbs, decoction, delivery) {
    var herbTotal = (herbs || []).length * 25;
    var decoctFee = decoction === 'hospital_decoct' ? 20 : 0;
    var deliveryFee = delivery === 'mail' ? 15 : 0;
    return { herb_total: herbTotal, decoction_fee: decoctFee, delivery_fee: deliveryFee, total: 10 + herbTotal + decoctFee + deliveryFee };
  }

  // ─── 审核处方 ───
  RX.review = function(rxId, action, reviewer, notes) {
    var list = TCM.store.get('prescriptions') || [];
    var idx = list.findIndex(function(r) { return r.id === rxId; });
    if (idx === -1) return { ok: false, error: '处方不存在' };

    if (action === 'approve') {
      list[idx].status = 'verified';
    } else {
      list[idx].status = 'rejected';
      list[idx].reject_reason = notes;
    }
    list[idx].reviewed_at = new Date().toISOString();
    list[idx].reviewed_by = reviewer;

    TCM.store.set('prescriptions', list);
    return { ok: true, prescription: list[idx] };
  };

  // ─── 支付完成 ───
  RX.pay = function(rxId, method) {
    var list = TCM.store.get('prescriptions') || [];
    var idx = list.findIndex(function(r) { return r.id === rxId; });
    if (idx === -1) return { ok: false, error: '处方不存在' };

    list[idx].status = 'paid';
    list[idx].paid_at = new Date().toISOString();
    list[idx].payment_method = method;

    TCM.store.set('prescriptions', list);
    return { ok: true, prescription: list[idx] };
  };

  // ─── 调配完成 ───
  RX.dispense = function(rxId) {
    var list = TCM.store.get('prescriptions') || [];
    var idx = list.findIndex(function(r) { return r.id === rxId; });
    if (idx === -1) return { ok: false, error: '处方不存在' };

    list[idx].status = 'dispensed';
    list[idx].dispensed_at = new Date().toISOString();

    TCM.store.set('prescriptions', list);
    return { ok: true, prescription: list[idx] };
  };

  // ─── 标记就绪 ───
  RX.markReady = function(rxId) {
    var list = TCM.store.get('prescriptions') || [];
    var idx = list.findIndex(function(r) { return r.id === rxId; });
    if (idx === -1) return { ok: false, error: '处方不存在' };

    list[idx].status = 'ready';
    list[idx].ready_at = new Date().toISOString();

    TCM.store.set('prescriptions', list);
    return { ok: true, prescription: list[idx] };
  };

  // ─── 完成 ───
  RX.complete = function(rxId) {
    var list = TCM.store.get('prescriptions') || [];
    var idx = list.findIndex(function(r) { return r.id === rxId; });
    if (idx === -1) return { ok: false, error: '处方不存在' };

    list[idx].status = 'completed';
    list[idx].completed_at = new Date().toISOString();

    TCM.store.set('prescriptions', list);
    return { ok: true, prescription: list[idx] };
  };

  // ─── 查询 ───
  RX.getAll = function(filter) {
    var list = TCM.store.get('prescriptions') || [];
    if (!filter) return list;
    return list.filter(function(r) {
      if (filter.status && r.status !== filter.status) return false;
      if (filter.doctor_id && r.doctor_id !== filter.doctor_id) return false;
      if (filter.patient_id && r.patient_id !== filter.patient_id) return false;
      return true;
    });
  };

  RX.getById = function(id) {
    var list = TCM.store.get('prescriptions') || [];
    return list.find(function(r) { return r.id === id; }) || null;
  };

  RX.STATUS = STATUS;
})();
