// pages/mine/mine.js
const API_BASE = 'http://127.0.0.1:8920'

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

  doLogin() {
    const phone = this.data.phoneInput.trim()
    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: '请输入正确手机号', icon: 'none' })
      return
    }
    this.setData({ loading: true })
    wx.request({
      url: API_BASE + '/api/user/login',
      method: 'POST',
      data: { phone },
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        if (res.statusCode === 200 && res.data.token) {
          wx.setStorageSync('token', res.data.token)
          wx.setStorageSync('userInfo', res.data.user || {})
          // 设置同步客户端token，触发自动同步
          const app = getApp()
          if (app.globalData.syncClient) {
            app.globalData.syncClient.setToken(res.data.token)
            app.globalData.syncClient.autoSync().catch(() => {})
            app.globalData.syncClient.startAutoSync()
          }
          this.setData({
            isLoggedIn: true,
            showLogin: false,
            userInfo: res.data.user || null
          })
          wx.showToast({ title: '登录成功', icon: 'success' })
          this.loadProfile()
          this.loadHistory()
          this.loadPoints()
        } else {
          wx.showToast({ title: '登录失败，请重试', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' })
      },
      complete: () => {
        this.setData({ loading: false })
      }
    })
  },

  // ---- 加载用户信息 ----
  loadProfile() {
    const token = wx.getStorageSync('token')
    wx.request({
      url: API_BASE + '/api/user/profile',
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + token },
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const d = res.data
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
      }
    })
  },

  // ---- 排盘历史 ----
  loadHistory() {
    const token = wx.getStorageSync('token')
    wx.request({
      url: API_BASE + '/api/paipan/history',
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + token },
      success: (res) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          this.setData({ history: res.data.slice(0, 5) })
        }
      }
    })
  },

  // ---- 积分 ----
  loadPoints() {
    const token = wx.getStorageSync('token')
    wx.request({
      url: API_BASE + '/api/feedback/points',
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + token },
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.setData({ points: res.data.points || 0 })
        }
      }
    })
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

  saveBirthInfo() {
    const token = wx.getStorageSync('token')
    const form = this.data.editForm
    if (!form.birthDate) {
      wx.showToast({ title: '请填写出生日期', icon: 'none' })
      return
    }
    wx.request({
      url: API_BASE + '/api/user/profile',
      method: 'POST',
      data: form,
      header: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode === 200) {
          wx.showToast({ title: '保存成功', icon: 'success' })
          this.setData({ editingBirth: false })
          this.loadProfile()
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
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
