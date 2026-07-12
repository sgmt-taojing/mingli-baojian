// pages/louceng/louceng.js — 楼层推荐
const H5_URL = 'https://sgmt-taojing.github.io/mingli-baojian/#section-more'

Page({
  data: {
    title: '楼层推荐',
    icon: '🏢',
    desc: '生肖五行 · 楼层吉凶',
    h5Url: H5_URL,
    tips: [
      '完整版功能请在 H5 网页版体验',
      '网页版支持完整输入参数与详细报告',
      '可随时复制链接发给亲友',
    ],
  },
  onLoad() {
    wx.setNavigationBarTitle({ title: '楼层推荐' })
  },
  copyH5Url() {
    wx.setClipboardData({
      data: H5_URL,
      success: () => wx.showToast({ title: '链接已复制', icon: 'success' })
    })
  },
  onShareAppMessage() {
    return { title: '命理宝鉴 · 楼层推荐', path: '/pages/louceng/louceng' }
  },
})
