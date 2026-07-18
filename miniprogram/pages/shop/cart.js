// pages/shop/cart.js — 购物车
const api = require('../../utils/api.js');

Page({
  data: {
    cartItems: [],
    selectedIds: [],
    totalPrice: 0,
    allSelected: false,
    loading: true
  },

  onLoad() { this.loadCart(); },
  onShow() { this.loadCart(); },

  async loadCart() {
    this.setData({ loading: true });
    try {
      const res = await api.getCart();
      const items = res.data || res || [];
      this.setData({ cartItems: items, loading: false });
      this.calcTotal();
    } catch (e) {
      // fallback: localStorage
      const local = wx.getStorageSync('cart') || [];
      this.setData({ cartItems: local, loading: false });
      this.calcTotal();
    }
  },

  onToggleItem(e) {
    const id = e.currentTarget.dataset.id;
    let ids = this.data.selectedIds;
    if (ids.includes(id)) {
      ids = ids.filter(i => i !== id);
    } else {
      ids = [...ids, id];
    }
    this.setData({ selectedIds: ids });
    this.checkAllSelected();
    this.calcTotal();
  },

  onToggleAll() {
    if (this.data.allSelected) {
      this.setData({ selectedIds: [], allSelected: false });
    } else {
      const ids = this.data.cartItems.map(i => i.id);
      this.setData({ selectedIds: ids, allSelected: true });
    }
    this.calcTotal();
  },

  onQtyChange(e) {
    const id = e.currentTarget.dataset.id;
    const delta = parseInt(e.currentTarget.dataset.delta);
    let items = this.data.cartItems;
    const idx = items.findIndex(i => i.id === id);
    if (idx < 0) return;
    items[idx].qty = Math.max(1, items[idx].qty + delta);
    this.setData({ cartItems: items });
    this.saveCart();
    this.calcTotal();
  },

  onRemove(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要移除该商品吗？',
      success: (res) => {
        if (res.confirm) {
          let items = this.data.cartItems.filter(i => i.id !== id);
          this.setData({ cartItems: items });
          this.saveCart();
          this.calcTotal();
        }
      }
    });
  },

  calcTotal() {
    let total = 0;
    this.data.cartItems.forEach(i => {
      if (this.data.selectedIds.includes(i.id)) {
        total += i.price * i.qty;
      }
    });
    this.setData({ totalPrice: total });
  },

  checkAllSelected() {
    const all = this.data.cartItems.length > 0 && this.data.cartItems.every(i => this.data.selectedIds.includes(i.id));
    this.setData({ allSelected: all });
  },

  saveCart() {
    wx.setStorageSync('cart', this.data.cartItems);
  },

  onCheckout() {
    if (this.data.selectedIds.length === 0) {
      wx.showToast({ title: '请选择商品', icon: 'none' });
      return;
    }
    const selected = this.data.cartItems.filter(i => this.data.selectedIds.includes(i.id));
    wx.setStorageSync('checkoutItems', selected);
    wx.navigateTo({ url: '/pages/shop/orders?from=checkout' });
  },

  onContinueShopping() {
    wx.navigateBack();
  },

  onShareAppMessage() {
    return { title: '命理宝鉴 · 开运商城', path: '/pages/shop/shop' };
  }
});
