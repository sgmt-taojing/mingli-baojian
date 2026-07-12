// pages/phone/phone.js — 手机号测评
const H5_URL = 'https://sgmt-taojing.github.io/mingli-baojian/#section-xingming'

Page({
  data: {
    title: '手机号测评',
    icon: '📱',
    desc: '数字能量 · 吉凶分析',
    h5Url: H5_URL,
    tips: [
      '完整版功能请在 H5 网页版体验',
      '网页版支持完整输入参数与详细报告',
      '可随时复制链接发给亲友',
    ],
  },
  onLoad() {
    wx.setNavigationBarTitle({ title: '手机号测评' })
  },
  copyH5Url() {
    wx.setClipboardData({
      data: H5_URL,
      success: () => wx.showToast({ title: '链接已复制', icon: 'success' })
    })
  },
  onShareAppMessage() {
    return { title: '命理宝鉴 · 手机号测评', path: '/pages/phone/phone' }
  },
})
