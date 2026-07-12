// pages/shop/shop.js — 开运商城
const api = require('../../utils/api.js');

Page({
  data: {
    products: [],
    loading: true,
    categories: [
      { id: 'all', name: '全部' },
      { id: 'crystal', name: '水晶' },
      { id: 'jade', name: '玉石' },
      { id: 'incense', name: '香品' },
      { id: 'talisman', name: '法器' },
      { id: 'book', name: '书籍' }
    ],
    currentCategory: 'all'
  },

  onLoad() {
    this.loadProducts();
  },

  async loadProducts() {
    this.setData({ loading: true });
    try {
      const res = await api.getProducts();
      this.setData({ products: res.data || res || [], loading: false });
    } catch (e) {
      // 内置示例数据
      this.setData({
        products: [
          { id: 1, name: '黑曜石本命佛吊坠', price: 198, category: 'crystal', desc: '辟邪化煞，护身保平安', image: '' },
          { id: 2, name: '和田玉平安扣', price: 368, category: 'jade', desc: '温润养人，聚气纳财', image: '' },
          { id: 3, name: '沉香线香礼盒', price: 128, category: 'incense', desc: '安神定心，净化磁场', image: '' },
          { id: 4, name: '铜葫芦摆件', price: 258, category: 'talisman', desc: '化病挡煞，镇宅辟邪', image: '' },
          { id: 5, name: '五行手串', price: 88, category: 'crystal', desc: '五行平衡，运势调和', image: '' },
          { id: 6, name: '《滴天髓》注解版', price: 68, category: 'book', desc: '命理经典，入门必读', image: '' }
        ],
        loading: false
      });
    }
  },

  onCategoryTap(e) {
    const cat = e.currentTarget.dataset.id;
    this.setData({ currentCategory: cat });
  },

  onProductTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.showToast({ title: '商品详情开发中', icon: 'none' });
  },

  onShareAppMessage() {
    return { title: '命理宝鉴 · 开运商城', path: '/pages/shop/shop' };
  }
});
