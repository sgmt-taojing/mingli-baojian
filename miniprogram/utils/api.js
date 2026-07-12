// utils/api.js — 命理宝鉴 API 封装

const app = getApp();

const BASE_URL = 'http://127.0.0.1:8920';

function request(path, options = {}) {
  const token = wx.getStorageSync('token');
  const url = path.startsWith('http') ? path : BASE_URL + path;

  const header = {
    'Content-Type': 'application/json',
    ...options.header
  };

  if (token) {
    header['Authorization'] = 'Bearer ' + token;
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: options.method || 'GET',
      data: options.data,
      header,
      timeout: 15000,
      success(res) {
        if (res.statusCode === 401) {
          // token 过期
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          app.globalData.token = null;
          app.globalData.isLogin = false;
          wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
          reject(new Error('未授权'));
          return;
        }
        if (res.statusCode >= 400) {
          reject(new Error(res.data?.error || '请求失败'));
          return;
        }
        resolve(res.data);
      },
      fail(err) {
        reject(new Error(err.errMsg || '网络错误'));
      }
    });
  });
}

// 用户相关
function login(phone) {
  return request('/api/user/login', { method: 'POST', data: { phone } });
}

function getProfile() {
  return request('/api/user/profile');
}

function updateProfile(data) {
  return request('/api/user/profile', { method: 'POST', data });
}

// 排盘相关
function savePaipan(data) {
  return request('/api/paipan/save', { method: 'POST', data });
}

function getPaipanHistory() {
  return request('/api/paipan/history');
}

// 黄历
function getAlmanac(date) {
  const q = date ? '?date=' + date : '';
  return request('/api/almanac/today' + q);
}

// 知识库
function getKnowledgeList(category, keyword, page) {
  let q = '?';
  if (category) q += 'category=' + category + '&';
  if (keyword) q += 'keyword=' + encodeURIComponent(keyword) + '&';
  if (page) q += 'page=' + page + '&';
  return request('/api/knowledge/list' + q);
}

// 商城
function getProducts() {
  return request('/api/shop/products');
}

function createOrder(data) {
  return request('/api/order/create', { method: 'POST', data });
}

// 反馈
function submitFeedback(data) {
  return request('/api/feedback/submit', { method: 'POST', data });
}

function getPoints() {
  return request('/api/feedback/points');
}

module.exports = {
  request,
  login,
  getProfile,
  updateProfile,
  savePaipan,
  getPaipanHistory,
  getAlmanac,
  getKnowledgeList,
  getProducts,
  createOrder,
  submitFeedback,
  getPoints,
  BASE_URL
};
