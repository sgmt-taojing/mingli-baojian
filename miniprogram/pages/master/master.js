// pages/master/master.js — 大师课堂
Page({
  data: {
    title: '大师课堂',
    icon: '🎓',
    desc: '命理教学 · 入门进阶',
    result: null,
    loading: false
  },
  onLoad() {
    wx.setNavigationBarTitle({ title: '大师课堂' });
  },
  onCalculate() {
    this.setData({ loading: true });
    setTimeout(() => {
      this.setData({ loading: false, result: { text: '分析结果生成中，请稍后体验完整功能' } });
    }, 1500);
  },
  onShareAppMessage() {
    return { title: '命理宝鉴 · 大师课堂', path: '/pages/master/master' };
  }
});
