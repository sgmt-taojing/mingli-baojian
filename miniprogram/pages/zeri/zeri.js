// pages/zeri/zeri.js — 择日服务
const H5_URL = 'https://sgmt-taojing.github.io/mingli-baojian/#section-jiuri'

Page({
  data: {
    title: '择日服务',
    icon: '🗓️',
    desc: '婚嫁搬家 · 择吉日',
    h5Url: H5_URL,
    tips: [
      '完整版功能请在 H5 网页版体验',
      '网页版支持完整输入参数与详细报告',
      '可随时复制链接发给亲友',
    ],
  },
  onLoad() {
    wx.setNavigationBarTitle({ title: '择日服务' })
  },
  copyH5Url() {
    wx.setClipboardData({
      data: H5_URL,
      success: () => wx.showToast({ title: '链接已复制', icon: 'success' })
    })
  },
  onShareAppMessage() {
    return { title: '命理宝鉴 · 择日服务', path: '/pages/zeri/zeri' }
  },
})
