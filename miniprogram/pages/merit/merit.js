// pages/merit/merit.js — 功德系统
Page({
  data: {
    title: '功德系统',
    icon: '🙏',
    desc: '行善积德 · 每日打卡',
    result: null,
    loading: false
  },
  onLoad() {
    wx.setNavigationBarTitle({ title: '功德系统' });
  },
  onCalculate() {
    this.setData({ loading: true });
    setTimeout(() => {
      this.setData({ loading: false, result: { text: '分析结果生成中，请稍后体验完整功能' } });
    }, 1500);
  },
  onShareAppMessage() {
    return { title: '命理宝鉴 · 功德系统', path: '/pages/merit/merit' };
  }
});
