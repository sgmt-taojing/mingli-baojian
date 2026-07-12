// pages/tizhi/tizhi.js — 体质辨识
Page({
  data: {
    title: '体质辨识',
    icon: '🏥',
    desc: '五行体质 · 养生方案',
    result: null,
    loading: false
  },
  onLoad() {
    wx.setNavigationBarTitle({ title: '体质辨识' });
  },
  onCalculate() {
    this.setData({ loading: true });
    setTimeout(() => {
      this.setData({ loading: false, result: { text: '分析结果生成中，请稍后体验完整功能' } });
    }, 1500);
  },
  onShareAppMessage() {
    return { title: '命理宝鉴 · 体质辨识', path: '/pages/tizhi/tizhi' };
  }
});
