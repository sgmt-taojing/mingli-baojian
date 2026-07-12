// pages/zeri/zeri.js — 择日服务
Page({
  data: {
    title: '择日服务',
    icon: '📅',
    desc: '搬家装修 · 开业签约',
    result: null,
    loading: false
  },
  onLoad() {
    wx.setNavigationBarTitle({ title: '择日服务' });
  },
  onCalculate() {
    this.setData({ loading: true });
    setTimeout(() => {
      this.setData({ loading: false, result: { text: '分析结果生成中，请稍后体验完整功能' } });
    }, 1500);
  },
  onShareAppMessage() {
    return { title: '命理宝鉴 · 择日服务', path: '/pages/zeri/zeri' };
  }
});
