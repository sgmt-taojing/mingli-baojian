// pages/shop/favorites.js — 我的收藏
const api = require('../../utils/api.js');

Page({
  data: {
    favorites: [],
    loading: true
  },

  onLoad() { this.loadFavorites(); },
  onShow() { this.loadFavorites(); },

  async loadFavorites() {
    this.setData({ loading: true });
    try {
      const res = await api.getFavorites();
      this.setData({ favorites: res.data || res || [], loading: false });
    } catch (e) {
      const local = wx.getStorageSync('favorites') || this.getSampleFavorites();
      this.setData({ favorites: local, loading: false });
    }
  },

  getSampleFavorites() {
    return [
      { id: 1, name: '黑曜石本命佛吊坠', price: 198, category: 'crystal', desc: '辟邪化煞，护身保平安' },
      { id: 2, name: '和田玉平安扣', price: 368, category: 'jade', desc: '温润养人，聚气纳财' },
      { id: 5, name: '五行手串', price: 88, category: 'crystal', desc: '五行平衡，运势调和' }
    ];
  },

  onRemoveFavorite(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '取消收藏',
      content: '确定要取消收藏该商品吗？',
      success: (res) => {
        if (res.confirm) {
          let favs = this.data.favorites.filter(f => f.id !== id);
          this.setData({ favorites: favs });
          wx.setStorageSync('favorites', favs);
          wx.showToast({ title: '已取消收藏', icon: 'none' });
        }
      }
    });
  },

  onProductTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/shop/detail?id=' + id });
  },

  onShareAppMessage() {
    return { title: '命理宝鉴 · 我的收藏', path: '/pages/shop/shop' };
  }
});
