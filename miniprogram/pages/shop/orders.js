// pages/shop/orders.js — 我的订单
const api = require('../../utils/api.js');

Page({
  data: {
    orders: [],
    currentTab: 'all',
    loading: true,
    tabs: [
      { id: 'all', name: '全部' },
      { id: 'pending', name: '待付款' },
      { id: 'paid', name: '已付款' },
      { id: 'shipped', name: '已发货' }
    ]
  },

  onLoad(options) {
    if (options.from === 'checkout') {
      this.createFromCheckout();
    }
    this.loadOrders();
  },

  onShow() { this.loadOrders(); },

  createFromCheckout() {
    const items = wx.getStorageSync('checkoutItems') || [];
    if (items.length === 0) return;
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    const newOrder = {
      id: 'ORD' + Date.now(),
      items: items.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
      total: total,
      status: 'pending',
      statusText: '待付款',
      time: new Date().toLocaleString('zh-CN')
    };
    let orders = wx.getStorageSync('orders') || [];
    orders.unshift(newOrder);
    wx.setStorageSync('orders', orders);
    wx.removeStorageSync('checkoutItems');
    wx.setStorageSync('cart', []);
  },

  async loadOrders() {
    this.setData({ loading: true });
    try {
      const res = await api.getOrders(this.data.currentTab);
      this.setData({ orders: res.data || res || [], loading: false });
    } catch (e) {
      const local = wx.getStorageSync('orders') || this.getSampleOrders();
      const filtered = this.data.currentTab === 'all' ? local : local.filter(o => o.status === this.data.currentTab);
      this.setData({ orders: filtered, loading: false });
    }
  },

  getSampleOrders() {
    return [
      { id: 'ORD20260718001', items: [{ name: '黑曜石本命佛吊坠', qty: 1, price: 198 }], total: 198, status: 'paid', statusText: '已付款', time: '2026-07-17 14:30' },
      { id: 'ORD20260718002', items: [{ name: '五行手串', qty: 2, price: 88 }], total: 176, status: 'shipped', statusText: '已发货', time: '2026-07-16 10:15' },
      { id: 'ORD20260718003', items: [{ name: '沉香线香礼盒', qty: 1, price: 128 }], total: 128, status: 'pending', statusText: '待付款', time: '2026-07-18 09:00' }
    ];
  },

  onTabChange(e) {
    const tab = e.currentTarget.dataset.id;
    this.setData({ currentTab: tab });
    this.loadOrders();
  },

  onOrderTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.showToast({ title: '订单详情开发中', icon: 'none' });
  },

  onPayOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认付款',
      content: '确定要付款吗？',
      success: (res) => {
        if (res.confirm) {
          let orders = this.data.orders;
          const idx = orders.findIndex(o => o.id === id);
          if (idx >= 0) {
            orders[idx].status = 'paid';
            orders[idx].statusText = '已付款';
            this.setData({ orders });
            wx.setStorageSync('orders', orders);
            wx.showToast({ title: '付款成功', icon: 'success' });
          }
        }
      }
    });
  },

  onShareAppMessage() {
    return { title: '命理宝鉴 · 我的订单', path: '/pages/shop/shop' };
  }
});
