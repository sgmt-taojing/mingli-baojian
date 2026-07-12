// pages/naming/naming.js — 起名改名
const H5_URL = 'https://sgmt-taojing.github.io/mingli-baojian/#section-xingming'

Page({
  data: {
    title: '起名改名',
    icon: '✏️',
    desc: '五行用字 · 五格数理 · 三才配置',
    h5Url: H5_URL,
    tips: [
      '完整版功能请在 H5 网页版体验',
      '网页版支持完整输入参数与详细报告',
      '可随时复制链接发给亲友',
    ],
  },
  onLoad() {
    wx.setNavigationBarTitle({ title: '起名改名' })
  },
  copyH5Url() {
    wx.setClipboardData({
      data: H5_URL,
      success: () => wx.showToast({ title: '链接已复制', icon: 'success' })
    })
  },
  onShareAppMessage() {
    return { title: '命理宝鉴 · 起名改名', path: '/pages/naming/naming' }
  },
})
