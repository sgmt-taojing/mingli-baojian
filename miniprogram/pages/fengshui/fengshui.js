// pages/fengshui/fengshui.js — 阳宅风水
Page({
  data: {
    title: '阳宅风水',
    icon: '🏠',
    desc: '户型分析 · 方位布局',
    result: null,
    loading: false
  },
  onLoad() {
    wx.setNavigationBarTitle({ title: '阳宅风水' });
  },
  onCalculate() {
    this.setData({ loading: true });
    setTimeout(() => {
      this.setData({ loading: false, result: { text: '分析结果生成中，请稍后体验完整功能' } });
    }, 1500);
  },
  onShareAppMessage() {
    return { title: '命理宝鉴 · 阳宅风水', path: '/pages/fengshui/fengshui' };
  }
});
