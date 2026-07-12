// pages/naming/naming.js — 起名改名
Page({
  data: {
    title: '起名改名',
    icon: '✏️',
    desc: '五行用字 · 五格数理 · 三才配置',
    result: null,
    loading: false
  },
  onLoad() {
    wx.setNavigationBarTitle({ title: '起名改名' });
  },
  onCalculate() {
    this.setData({ loading: true });
    setTimeout(() => {
      this.setData({ loading: false, result: { text: '分析结果生成中，请稍后体验完整功能' } });
    }, 1500);
  },
  onShareAppMessage() {
    return { title: '命理宝鉴 · 起名改名', path: '/pages/naming/naming' };
  }
});
