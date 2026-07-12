/**
 * 易道智鉴 · 商家入驻逻辑
 * merchant.js — 商家入驻申请、商家登录、商家商品管理、分成结算
 * 依赖：shop-data.js
 */

(function() {
'use strict';

// ==================== 存储键 ====================
var MERCHANT_KEY = 'mingli_merchant_data';      // 商家入驻申请数据
var MERCHANT_SESSION = 'mingli_merchant_session'; // 商家登录会话
var ORDER_KEY = 'mingli_shop_orders';             // 订单数据（含分成信息）
var DEFAULT_SPLIT_RATE = 0.8; // 商家默认分成80%

// ==================== 数据操作 ====================
function loadMerchants() {
  var stored = localStorage.getItem(MERCHANT_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch(e) {}
  }
  return { merchants: [] };
}

function saveMerchants(data) {
  localStorage.setItem(MERCHANT_KEY, JSON.stringify(data));
}

function loadOrders() {
  var stored = localStorage.getItem(ORDER_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch(e) {}
  }
  return { orders: [] };
}

function saveOrders(data) {
  localStorage.setItem(ORDER_KEY, JSON.stringify(data));
}

function getSession() {
  var stored = sessionStorage.getItem(MERCHANT_SESSION);
  if (stored) {
    try { return JSON.parse(stored); } catch(e) {}
  }
  return null;
}

function setSession(merchant) {
  sessionStorage.setItem(MERCHANT_SESSION, JSON.stringify({
    merchantId: merchant.id,
    merchantName: merchant.name,
    phone: merchant.phone,
    loginTime: Date.now()
  }));
}

function clearSession() {
  sessionStorage.removeItem(MERCHANT_SESSION);
}

// ==================== ID 生成（禁止Math.random） ====================
function genMerchantId() {
  var data = loadMerchants();
  var max = 0;
  data.merchants.forEach(function(m) {
    if (m.id && m.id.indexOf('m') === 0) {
      var n = parseInt(m.id.substring(1));
      if (n > max) max = n;
    }
  });
  return 'm' + String(max + 1).padStart(3, '0');
}

function genProductId(merchantId) {
  var shopData = window._shopAdmin ? window._shopAdmin.getData() : (window.SHOP_DATA || { products: [] });
  var prefix = merchantId + '-';
  var max = 0;
  (shopData.products || []).forEach(function(p) {
    if (p.id && p.id.indexOf(prefix) === 0) {
      var n = parseInt(p.id.substring(prefix.length));
      if (n > max) max = n;
    }
  });
  return prefix + String(max + 1).padStart(3, '0');
}

// ==================== 商家入驻申请 ====================
function submitApply(form) {
  var data = loadMerchants();
  
  var merchant = {
    id: genMerchantId(),
    name: form.name,
    school: form.school,         // 佛教/道教/儒家/民间
    type: form.type,             // 寺庙/道观/书院/工作室/个人大师
    contactName: form.contactName,
    phone: form.phone,
    license: form.license,
    certification: form.certification,
    master: form.master,         // 法人/住持法名
    categories: form.categories, // 供应商品类别
    processDesc: form.processDesc,
    agreement: form.agreement,
    status: 'pending',           // pending / approved / rejected
    splitRate: DEFAULT_SPLIT_RATE,
    applyTime: new Date().toISOString(),
    reviewTime: null,
    reviewNote: ''
  };
  
  // 检查手机号是否已申请
  var existing = data.merchants.find(function(m) { return m.phone === merchant.phone; });
  if (existing) {
    return { success: false, message: '该手机号已提交过入驻申请，请勿重复提交' };
  }
  
  data.merchants.push(merchant);
  saveMerchants(data);
  
  return { success: true, merchantId: merchant.id, message: '入驻申请提交成功！审核结果将在3个工作日内通知您。' };
}

// ==================== 商家登录 ====================
function login(phone, code) {
  // 简化版：验证码固定为手机号后4位
  var expectedCode = phone.length >= 4 ? phone.slice(-4) : '0000';
  if (code !== expectedCode) {
    return { success: false, message: '验证码错误（提示：验证码为手机号后4位）' };
  }
  
  var data = loadMerchants();
  var merchant = data.merchants.find(function(m) { return m.phone === phone && m.status === 'approved'; });
  if (!merchant) {
    return { success: false, message: '未找到已通过审核的商家账号，请确认手机号或联系管理员' };
  }
  
  setSession(merchant);
  return { success: true, merchant: merchant };
}

function logout() {
  clearSession();
}

function getCurrentMerchant() {
  var session = getSession();
  if (!session) return null;
  var data = loadMerchants();
  return data.merchants.find(function(m) { return m.id === session.merchantId; }) || null;
}

// ==================== 商家商品管理 ====================
function getMerchantProducts(merchantId) {
  var shopData = window._shopAdmin ? window._shopAdmin.getData() : (window.SHOP_DATA || { products: [] });
  return (shopData.products || []).filter(function(p) { return p.merchantId === merchantId; });
}

function addMerchantProduct(merchantId, product) {
  var adminData = window._shopAdmin ? window._shopAdmin.getData() : null;
  if (!adminData) return { success: false, message: '数据未加载' };
  
  var merchant = getCurrentMerchant();
  if (!merchant) return { success: false, message: '请先登录' };
  
  var newProduct = {
    id: genProductId(merchantId),
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice || '',
    categoryId: product.categoryId || 'mingli-huajie',
    subcategoryId: product.subcategoryId || '',
    status: product.status || 'online',
    stock: parseInt(product.stock) || 0,
    sales: 0,
    material: product.material || '',
    size: product.size || '',
    origin: merchant.name,
    author: product.author || merchant.master,
    rating: 4.5,
    tags: product.tags || [],
    description: product.description || '',
    effects: product.effects || '',
    suitable: product.suitable || '',
    reason: product.reason || '',
    image: product.image || '📦',
    images: product.images || [],
    // 商家字段
    merchantId: merchantId,
    merchantName: merchant.name,
    certified: merchant.certification ? merchant.certification + '监制' : '',
    master: merchant.master || '',
    premium: false,
    masterwork: merchant.status === 'approved',
    custom: product.custom || false,
    splitRate: merchant.splitRate || DEFAULT_SPLIT_RATE
  };
  
  adminData.products.push(newProduct);
  if (window._shopAdmin) {
    window._shopAdmin._persistData();
  }
  
  return { success: true, productId: newProduct.id };
}

function updateMerchantProduct(productId, updates) {
  var adminData = window._shopAdmin ? window._shopAdmin.getData() : null;
  if (!adminData) return { success: false, message: '数据未加载' };
  
  var product = adminData.products.find(function(p) { return p.id === productId; });
  if (!product) return { success: false, message: '商品不存在' };
  
  var session = getSession();
  if (!session || product.merchantId !== session.merchantId) {
    return { success: false, message: '无权操作此商品' };
  }
  
  Object.keys(updates).forEach(function(key) {
    product[key] = updates[key];
  });
  
  if (window._shopAdmin) {
    window._shopAdmin._persistData();
  }
  
  return { success: true };
}

function deleteMerchantProduct(productId) {
  var adminData = window._shopAdmin ? window._shopAdmin.getData() : null;
  if (!adminData) return { success: false, message: '数据未加载' };
  
  var session = getSession();
  if (!session) return { success: false, message: '请先登录' };
  
  var idx = adminData.products.findIndex(function(p) { return p.id === productId && p.merchantId === session.merchantId; });
  if (idx < 0) return { success: false, message: '商品不存在或无权操作' };
  
  adminData.products.splice(idx, 1);
  if (window._shopAdmin) {
    window._shopAdmin._persistData();
  }
  
  return { success: true };
}

// ==================== 订单与分成 ====================
function createOrder(items) {
  var orders = loadOrders();
  var adminData = window._shopAdmin ? window._shopAdmin.getData() : (window.SHOP_DATA || { products: [] });
  
  var order = {
    id: 'ord-' + Date.now(),
    items: [],
    totalAmount: 0,
    platformIncome: 0,
    merchantIncomes: {},
    createTime: new Date().toISOString(),
    status: 'paid'
  };
  
  items.forEach(function(item) {
    var product = (adminData.products || []).find(function(p) { return p.id === item.id; });
    if (!product) return;
    
    var price = parsePrice(product.price);
    var qty = item.qty || 1;
    var subtotal = price * qty;
    var splitRate = product.splitRate || DEFAULT_SPLIT_RATE;
    var merchantIncome = Math.round(subtotal * splitRate * 100) / 100;
    var platformIncome = Math.round((subtotal - merchantIncome) * 100) / 100;
    
    var orderItem = {
      productId: product.id,
      productName: product.name,
      price: product.price,
      qty: qty,
      subtotal: subtotal,
      merchantId: product.merchantId || '',
      merchantName: product.merchantName || '',
      splitRate: splitRate,
      merchantIncome: merchantIncome,
      platformIncome: platformIncome
    };
    
    order.items.push(orderItem);
    order.totalAmount += subtotal;
    order.platformIncome += platformIncome;
    
    if (product.merchantId) {
      if (!order.merchantIncomes[product.merchantId]) {
        order.merchantIncomes[product.merchantId] = { name: product.merchantName, amount: 0 };
      }
      order.merchantIncomes[product.merchantId].amount += merchantIncome;
    }
    
    // 更新销量
    product.sales = (product.sales || 0) + qty;
    if (product.stock !== undefined) {
      product.stock = Math.max(0, product.stock - qty);
    }
  });
  
  if (window._shopAdmin) {
    window._shopAdmin._persistData();
  }
  
  orders.orders.push(order);
  saveOrders(orders);
  
  return order;
}

function getMerchantOrders(merchantId) {
  var orders = loadOrders();
  var result = [];
  orders.orders.forEach(function(order) {
    var merchantItems = order.items.filter(function(item) { return item.merchantId === merchantId; });
    if (merchantItems.length > 0) {
      result.push({
        orderId: order.id,
        createTime: order.createTime,
        items: merchantItems,
        totalIncome: merchantItems.reduce(function(s, i) { return s + i.merchantIncome; }, 0)
      });
    }
  });
  return result;
}

function getMerchantIncomeStats(merchantId) {
  var orders = getMerchantOrders(merchantId);
  var now = new Date();
  var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  var weekStart = todayStart - (now.getDay() || 7) * 86400000 + 86400000; // 周一
  var monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  
  var todayIncome = 0, weekIncome = 0, monthIncome = 0, totalIncome = 0;
  
  orders.forEach(function(order) {
    var ts = new Date(order.createTime).getTime();
    var income = order.totalIncome;
    totalIncome += income;
    if (ts >= todayStart) todayIncome += income;
    if (ts >= weekStart) weekIncome += income;
    if (ts >= monthStart) monthIncome += income;
  });
  
  return {
    today: todayIncome,
    week: weekIncome,
    month: monthIncome,
    total: totalIncome,
    orderCount: orders.length
  };
}

// ==================== 超管审核 ====================
function getPendingMerchants() {
  var data = loadMerchants();
  return data.merchants.filter(function(m) { return m.status === 'pending'; });
}

function getAllMerchants() {
  var data = loadMerchants();
  return data.merchants;
}

function approveMerchant(merchantId, splitRate) {
  var data = loadMerchants();
  var merchant = data.merchants.find(function(m) { return m.id === merchantId; });
  if (!merchant) return { success: false, message: '商家不存在' };
  
  merchant.status = 'approved';
  merchant.reviewTime = new Date().toISOString();
  if (splitRate !== undefined) {
    merchant.splitRate = splitRate;
  }
  
  // 给商家已有商品打"大师之作"标签
  var adminData = window._shopAdmin ? window._shopAdmin.getData() : null;
  if (adminData) {
    adminData.products.forEach(function(p) {
      if (p.merchantId === merchantId) {
        p.masterwork = true;
        p.merchantName = merchant.name;
        p.certified = merchant.certification ? merchant.certification + '监制' : '';
        p.master = merchant.master || '';
        p.splitRate = merchant.splitRate;
      }
    });
    if (window._shopAdmin) window._shopAdmin._persistData();
  }
  
  saveMerchants(data);
  return { success: true };
}

function rejectMerchant(merchantId, note) {
  var data = loadMerchants();
  var merchant = data.merchants.find(function(m) { return m.id === merchantId; });
  if (!merchant) return { success: false, message: '商家不存在' };
  
  merchant.status = 'rejected';
  merchant.reviewTime = new Date().toISOString();
  merchant.reviewNote = note || '';
  
  saveMerchants(data);
  return { success: true };
}

function setSplitRate(merchantId, rate) {
  var data = loadMerchants();
  var merchant = data.merchants.find(function(m) { return m.id === merchantId; });
  if (!merchant) return { success: false, message: '商家不存在' };
  
  merchant.splitRate = rate;
  saveMerchants(data);
  
  // 更新该商家所有商品的分成比例
  var adminData = window._shopAdmin ? window._shopAdmin.getData() : null;
  if (adminData) {
    adminData.products.forEach(function(p) {
      if (p.merchantId === merchantId) {
        p.splitRate = rate;
      }
    });
    if (window._shopAdmin) window._shopAdmin._persistData();
  }
  
  return { success: true };
}

function getAllOrdersWithSplit() {
  var orders = loadOrders();
  return orders.orders;
}

function getPlatformStats() {
  var orders = loadOrders();
  var totalPlatform = 0;
  var totalMerchant = 0;
  var merchantMap = {};
  
  orders.orders.forEach(function(order) {
    totalPlatform += order.platformIncome || 0;
    Object.keys(order.merchantIncomes || {}).forEach(function(mid) {
      var info = order.merchantIncomes[mid];
      totalMerchant += info.amount;
      if (!merchantMap[mid]) merchantMap[mid] = { name: info.name, amount: 0, orders: 0 };
      merchantMap[mid].amount += info.amount;
      merchantMap[mid].orders += 1;
    });
  });
  
  return {
    totalPlatform: totalPlatform,
    totalMerchant: totalMerchant,
    totalOrders: orders.orders.length,
    merchantStats: merchantMap
  };
}

// ==================== 工具函数 ====================
function parsePrice(str) {
  if (!str) return 0;
  var m = String(str).match(/\d+/);
  return m ? parseInt(m[0]) : 0;
}

// ==================== 暴露接口 ====================
window._merchant = {
  // 数据
  loadMerchants: loadMerchants,
  saveMerchants: saveMerchants,
  loadOrders: loadOrders,
  saveOrders: saveOrders,
  // 入驻
  submitApply: submitApply,
  // 登录
  login: login,
  logout: logout,
  getCurrentMerchant: getCurrentMerchant,
  getSession: getSession,
  // 商品
  getMerchantProducts: getMerchantProducts,
  addMerchantProduct: addMerchantProduct,
  updateMerchantProduct: updateMerchantProduct,
  deleteMerchantProduct: deleteMerchantProduct,
  // 订单分成
  createOrder: createOrder,
  getMerchantOrders: getMerchantOrders,
  getMerchantIncomeStats: getMerchantIncomeStats,
  // 超管
  getPendingMerchants: getPendingMerchants,
  getAllMerchants: getAllMerchants,
  approveMerchant: approveMerchant,
  rejectMerchant: rejectMerchant,
  setSplitRate: setSplitRate,
  getAllOrdersWithSplit: getAllOrdersWithSplit,
  getPlatformStats: getPlatformStats,
  // 常量
  DEFAULT_SPLIT_RATE: DEFAULT_SPLIT_RATE
};

})();
