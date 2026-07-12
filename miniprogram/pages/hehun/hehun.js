// pages/hehun/hehun.js — 合婚匹配
Page({
  data: {
    title: '合婚匹配',
    icon: '💑',
    desc: '夫妻八字匹配度分析',
    result: null,
    loading: false
  },
  onLoad() {
    wx.setNavigationBarTitle({ title: '合婚匹配' });
  },
  onCalculate() {
    this.setData({ loading: true });
    setTimeout(() => {
      this.setData({ loading: false, result: { text: '分析结果生成中，请稍后体验完整功能' } });
    }, 1500);
  },
  onShareAppMessage() {
    return { title: '命理宝鉴 · 合婚匹配', path: '/pages/hehun/hehun' };
  }
});
