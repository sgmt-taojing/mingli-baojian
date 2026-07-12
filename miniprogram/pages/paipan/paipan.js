// pages/paipan/paipan.js
const api = require('../../utils/api.js')

const SHICHEN_LIST = [
  '子时(23-1点)', '丑时(1-3点)', '寅时(3-5点)', '卯时(5-7点)',
  '辰时(7-9点)', '巳时(9-11点)', '午时(11-13点)', '未时(13-15点)',
  '申时(15-17点)', '酉时(17-19点)', '戌时(19-21点)', '亥时(21-23点)'
]

Page({
  data: {
    // 表单
    name: '',
    sex: '男',
    sexIndex: 0,
    sexOptions: ['男', '女'],
    birthDate: '2000-01-01',
    birthHourIndex: 0,
    birthHourOptions: SHICHEN_LIST,
    birthplace: '',
    // 状态
    loading: false,
    hasResult: false,
    paipanResult: null,
    // 历史
    history: [],
    showHistory: false,
  },

  onLoad() {
    // 预设默认日期为2000年1月1日
    const today = new Date()
    const defaultDate = '2000-01-01'
    this.setData({ birthDate: defaultDate })
    this.loadHistory()
  },

  onShow() {
    this.loadHistory()
  },

  // ===== 表单事件 =====
  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  onSexChange(e) {
    const idx = e.detail.value
    this.setData({ sexIndex: idx, sex: this.data.sexOptions[idx] })
  },

  onDateChange(e) {
    this.setData({ birthDate: e.detail.value })
  },

  onHourChange(e) {
    this.setData({ birthHourIndex: e.detail.value })
  },

  onBirthplaceInput(e) {
    this.setData({ birthplace: e.detail.value })
  },

  // ===== 提交排盘 =====
  async onStartPaipan() {
    const { name, sex, birthDate, birthHourIndex, birthplace } = this.data

    if (!name.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }

    this.setData({ loading: true, hasResult: false })

    const payload = {
      name: name.trim(),
      sex,
      birthDate,
      birthHour: birthHourIndex,
      birthplace: birthplace.trim() || '',
    }

    try {
      const res = await api.post('/api/paipan/calculate', payload)
      if (res && res.data) {
        const result = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
        this.setData({
          paipanResult: result,
          hasResult: true,
          loading: false,
        })
        // 滚动到结果
        wx.pageScrollTo({ scrollTop: 9999, duration: 300 })
      } else {
        throw new Error('排盘结果为空')
      }
    } catch (err) {
      console.error('排盘失败:', err)
      // 如果 calculate 接口不存在，尝试直接用 save 接口（后端计算+保存）
      try {
        const saveRes = await api.post('/api/paipan/save', {
          ...payload,
          paipanResult: null,
        })
        if (saveRes && saveRes.data) {
          const result = typeof saveRes.data === 'string' ? JSON.parse(saveRes.data) : saveRes.data
          this.setData({
            paipanResult: result,
            hasResult: true,
            loading: false,
          })
          wx.pageScrollTo({ scrollTop: 9999, duration: 300 })
        } else {
          throw err
        }
      } catch (saveErr) {
        console.error('保存排盘也失败:', saveErr)
        this.setData({ loading: false })
        wx.showModal({
          title: '排盘失败',
          content: '无法连接到服务器，请检查网络后重试。',
          showCancel: false,
        })
      }
    }
  },

  // ===== 历史记录 =====
  async loadHistory() {
    try {
      const res = await api.get('/api/paipan/history')
      if (res && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.list || [])
        this.setData({ history: list })
      }
    } catch (err) {
      console.error('加载历史失败:', err)
    }
  },

  toggleHistory() {
    this.setData({ showHistory: !this.data.showHistory })
  },

  onHistoryItemTap(e) {
    const idx = e.currentTarget.dataset.index
    const item = this.data.history[idx]
    if (item && item.paipanResult) {
      const result = typeof item.paipanResult === 'string' ? JSON.parse(item.paipanResult) : item.paipanResult
      this.setData({
        paipanResult: result,
        hasResult: true,
        name: item.name || '',
        sex: item.sex || '男',
        sexIndex: item.sex === '女' ? 1 : 0,
        birthDate: item.birthDate || '2000-01-01',
        birthHourIndex: item.birthHour != null ? item.birthHour : 0,
        birthplace: item.birthplace || '',
      })
      wx.pageScrollTo({ scrollTop: 9999, duration: 300 })
    }
  },

  // ===== 工具 =====
  getWuxingColor(element) {
    const colors = {
      '金': '#d4af37',
      '木': '#4caf50',
      '水': '#2196f3',
      '火': '#f44336',
      '土': '#8d6e63',
    }
    return colors[element] || '#e6c86e'
  },
})
