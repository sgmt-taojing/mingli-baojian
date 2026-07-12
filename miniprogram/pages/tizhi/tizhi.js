// pages/tizhi/tizhi.js — 体质辨识
const H5_URL = 'https://sgmt-taojing.github.io/mingli-baojian/#section-more'

Page({
  data: {
    title: '体质辨识',
    icon: '🩺',
    desc: '五行体质 · 养生建议',
    h5Url: H5_URL,
    tips: [
      '完整版功能请在 H5 网页版体验',
      '网页版支持完整输入参数与详细报告',
      '可随时复制链接发给亲友',
    ],
  },
  onLoad() {
    wx.setNavigationBarTitle({ title: '体质辨识' })
  },
  copyH5Url() {
    wx.setClipboardData({
      data: H5_URL,
      success: () => wx.showToast({ title: '链接已复制', icon: 'success' })
    })
  },
  onShareAppMessage() {
    return { title: '命理宝鉴 · 体质辨识', path: '/pages/tizhi/tizhi' }
  },
})
