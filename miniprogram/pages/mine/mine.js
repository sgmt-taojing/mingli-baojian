// pages/mine/mine.js
const api = require('../../utils/api.js')

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    birthInfo: null,
    history: [],
    points: 0,
    showLogin: false,
    phoneInput: '',
    loading: false,
    editingBirth: false,
    editForm: {
      name: '',
      sex: '',
      birthDate: '',
      birthHour: '',
      birthplace: '',
      residence: '',
      occupation: '',
      faith: ''
    }
  },

  onLoad(options) {
    if (options && options.type === 'vip') {
      // 从首页"会员中心"入口进入，标记 VIP 视图模式
      this.setData({ showVipPanel: true })
    }
    this.checkLogin()
  },

  onShow() {
    this.checkLogin()
  },

  // ---- 登录态检查 ----
  checkLogin() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.setData({ isLoggedIn: true })
      this.loadProfile()
      this.loadHistory()
      this.loadPoints()
    } else {
      this.setData({ isLoggedIn: false, userInfo: null, history: [], points: 0 })
    }
  },

  // ---- 登录流程 ----
  showLoginPopup() {
    this.setData({ showLogin: true, phoneInput: '' })
  },

  hideLoginPopup() {
    this.setData({ showLogin: false })
  },

  onPhoneInput(e) {
    this.setData({ phoneInput: e.detail.value })
  },

  async doLogin() {
    const phone = this.data.phoneInput.trim()
    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: '请输入正确手机号', icon: 'none' })
      return
    }
    this.setData({ loading: true })
    try {
      const res = await api.login(phone)
      if (res && res.token) {
        wx.setStorageSync('token', res.token)
        wx.setStorageSync('userInfo', res.user || {})
        // 设置同步客户端token，触发自动同步
        const app = getApp()
        if (app.globalData.syncClient) {
          app.globalData.syncClient.setToken(res.token)
          app.globalData.syncClient.autoSync().catch(() => {})
          app.globalData.syncClient.startAutoSync()
        }
        this.setData({
          isLoggedIn: true,
          showLogin: false,
          userInfo: res.user || null
        })
        wx.showToast({ title: '登录成功', icon: 'success' })
        this.loadProfile()
        this.loadHistory()
        this.loadPoints()
      } else {
        wx.showToast({ title: '登录失败，请重试', icon: 'none' })
      }
    } catch (e) {
      wx.showToast({ title: e.message || '网络错误', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // ---- 加载用户信息 ----
  async loadProfile() {
    try {
      const d = await api.getProfile()
      if (d) {
        this.setData({
          userInfo: d,
          birthInfo: {
            birthDate: d.birthDate || '未填写',
            birthHour: d.birthHour || '未填写',
            birthplace: d.birthplace || '未填写'
          },
          editForm: {
            name: d.name || '',
            sex: d.sex || '',
            birthDate: d.birthDate || '',
            birthHour: d.birthHour || '',
            birthplace: d.birthplace || '',
            residence: d.residence || '',
            occupation: d.occupation || '',
            faith: d.faith || ''
          }
        })
      }
    } catch (e) { /* 静默失败 */ }
  },

  // ---- 排盘历史 ----
  async loadHistory() {
    try {
      const res = await api.getPaipanHistory()
      if (Array.isArray(res)) {
        this.setData({ history: res.slice(0, 5) })
      } else if (res && Array.isArray(res.data)) {
        this.setData({ history: res.data.slice(0, 5) })
      }
    } catch (e) { /* 静默失败 */ }
  },

  // ---- 积分 ----
  async loadPoints() {
    try {
      const res = await api.getPoints()
      if (res) {
        this.setData({ points: res.points || 0 })
      }
    } catch (e) { /* 静默失败 */ }
  },

  // ---- 脱敏手机号 ----
  maskPhone(phone) {
    if (!phone || phone.length < 11) return phone || '未绑定'
    return phone.slice(0, 3) + '****' + phone.slice(7)
  },

  // ---- 编辑生辰信息 ----
  startEditBirth() {
    this.setData({ editingBirth: true })
  },

  cancelEditBirth() {
    this.setData({ editingBirth: false })
  },

  onEditInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['editForm.' + field]: e.detail.value })
  },

  onSexChange(e) {
    this.setData({ 'editForm.sex': e.detail.value })
  },

  async saveBirthInfo() {
    const form = this.data.editForm
    if (!form.birthDate) {
      wx.showToast({ title: '请填写出生日期', icon: 'none' })
      return
    }
    try {
      await api.updateProfile(form)
      wx.showToast({ title: '保存成功', icon: 'success' })
      this.setData({ editingBirth: false })
      this.loadProfile()
    } catch (e) {
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  // ---- 历史记录跳转 ----
  onTapHistory(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/paipan/paipan?id=' + id,
      fail: () => {
        wx.showToast({ title: '排盘页未就绪', icon: 'none' })
      }
    })
  },

  // ---- 功能入口 ----
  onTapMenu(e) {
    if (!this.data.isLoggedIn) {
      this.showLoginPopup()
      return
    }
    const key = e.currentTarget.dataset.key
    const labels = {
      orders: '订单查看功能规划中，预计下版本上线',
      favorites: '我的收藏功能规划中，预计下版本上线',
      fortune: '每日运势详情规划中，预计下版本上线',
      settings: '账户设置规划中，预计下版本上线',
      about: '关于我们规划中，预计下版本上线'
    }
    const msg = labels[key] || '功能规划中，预计下版本上线'
    wx.showModal({
      title: '提示',
      content: msg + '。\n您可先使用 H5 版体验完整功能：\nhttps://sgmt-taojing.github.io/mingli-baojian/',
      confirmText: '去 H5',
      cancelText: '知道了',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({ data: 'https://sgmt-taojing.github.io/mingli-baojian/' })
        }
      }
    })
  },

  // ---- 退出登录 ----
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          this.setData({
            isLoggedIn: false,
            userInfo: null,
            history: [],
            points: 0,
            birthInfo: null
          })
          wx.showToast({ title: '已退出登录', icon: 'success' })
        }
      }
    })
  }
})
