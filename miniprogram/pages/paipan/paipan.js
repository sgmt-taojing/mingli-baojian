// pages/paipan/paipan.js — 多术数排盘
const api = require('../../utils/api.js')

const TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
const DI_ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']

const SHICHEN_LIST = [
  '子时(23-1点)', '丑时(1-3点)', '寅时(3-5点)', '卯时(5-7点)',
  '辰时(7-9点)', '巳时(9-11点)', '午时(11-13点)', '未时(13-15点)',
  '申时(15-17点)', '酉时(17-19点)', '戌时(19-21点)', '亥时(21-23点)'
]

const TYPES = [
  { id: 'bazi', name: '八字排盘', icon: '🔮' },
  { id: 'ziwei', name: '紫微斗数', icon: '⭐' },
  { id: 'qimen', name: '奇门遁甲', icon: '🧭' },
  { id: 'liuren', name: '大六壬', icon: '🌊' },
  { id: 'liuyao', name: '六爻占卜', icon: '🪙' },
  { id: 'meihua', name: '梅花易数', icon: '🌸' }
]

const QUESTION_TYPES = ['事业', '财运', '感情', '健康', '学业', '其他']

function toJDN(y, m, d) {
  const a = Math.floor((14 - m) / 12)
  const yy = y + 4800 - a
  const mm = m + 12 * a - 3
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045
}

function getYearGZ(y, m, d) {
  let year = y
  if (m < 2 || (m === 2 && d < 4)) year = y - 1
  const idx = ((year - 1984) % 60 + 60) % 60
  return TIAN_GAN[idx % 10] + DI_ZHI[idx % 12]
}

function getMonthGZ(y, m, d) {
  const yearGZ = getYearGZ(y, m, d)
  const yearGan = TIAN_GAN.indexOf(yearGZ[0])
  const base = [2, 4, 6, 8, 0]
  const startGan = base[yearGan % 5]
  const monthZhiIdx = m >= 2 ? m - 2 : m + 10
  const ganIdx = (startGan + monthZhiIdx) % 10
  const zhiIdx = (monthZhiIdx + 2) % 12
  return TIAN_GAN[ganIdx] + DI_ZHI[zhiIdx]
}

function getDayGZ(y, m, d) {
  const jdn = toJDN(y, m, d)
  const ref = 2460431
  const diff = jdn - ref
  const idx = ((diff % 60) + 60) % 60
  return TIAN_GAN[idx % 10] + DI_ZHI[idx % 12]
}

Page({
  data: {
    types: TYPES,
    currentType: 'bazi',
    currentTypeName: '八字排盘',
    questionTypes: QUESTION_TYPES,
    form: {
      name: '',
      sex: 'male',
      birthDate: '1990-01-01',
      birthHour: 0,
      birthplace: '',
      questionType: '事业',
      question: '',
      meihuaNum: ''
    },
    result: null,
    loading: false,
    history: [],
    shichenList: SHICHEN_LIST
  },

  onLoad(options) {
    if (options.type) {
      const t = TYPES.find(t => t.id === options.type)
      if (t) {
        this.setData({ currentType: t.id, currentTypeName: t.name })
      }
    }
    if (options.type !== 'history') {
      this.loadHistory()
    }
  },

  onTypeTap(e) {
    const id = e.currentTarget.dataset.id
    const t = TYPES.find(t => t.id === id)
    this.setData({ currentType: id, currentTypeName: t ? t.name : '', result: null })
  },

  onInput(e) {
    const key = e.currentTarget.dataset.key
    this.setData({ [`form.${key}`]: e.detail.value })
  },

  onSexChange(e) {
    this.setData({ 'form.sex': e.detail.value })
  },

  onDateChange(e) {
    this.setData({ 'form.birthDate': e.detail.value })
  },

  onHourChange(e) {
    this.setData({ 'form.birthHour': parseInt(e.detail.value) })
  },

  onQuestionTypeChange(e) {
    this.setData({ 'form.questionType': QUESTION_TYPES[e.detail.value] })
  },

  async onCalculate() {
    const f = this.data.form
    if (this.data.currentType === 'bazi' || this.data.currentType === 'ziwei') {
      if (!f.name) { wx.showToast({ title: '请输入姓名', icon: 'none' }); return }
    }

    this.setData({ loading: true, result: null })

    // 前端计算八字四柱
    if (this.data.currentType === 'bazi') {
      const [y, m, d] = f.birthDate.split('-').map(Number)
      const yearGZ = getYearGZ(y, m, d)
      const monthGZ = getMonthGZ(y, m, d)
      const dayGZ = getDayGZ(y, m, d)
      const hourGZ = (() => {
        const dayGanIdx = TIAN_GAN.indexOf(dayGZ[0])
        const hourGanIdx = (dayGanIdx % 5 * 2 + f.birthHour) % 10
        const hourZhiIdx = f.birthHour
        return TIAN_GAN[hourGanIdx] + DI_ZHI[hourZhiIdx]
      })()

      this.setData({
        loading: false,
        result: {
          type: 'bazi',
          basic: { name: f.name, sex: f.sex === 'male' ? '男' : '女', date: f.birthDate, hour: SHICHEN_LIST[f.birthHour] },
          pillars: { year: yearGZ, month: monthGZ, day: dayGZ, hour: hourGZ },
          interpretation: `日主为${dayGZ[0]}（${dayGZ[0] === '甲' || dayGZ[0] === '乙' ? '木' : dayGZ[0] === '丙' || dayGZ[0] === '丁' ? '火' : dayGZ[0] === '戊' || dayGZ[0] === '己' ? '土' : dayGZ[0] === '庚' || dayGZ[0] === '辛' ? '金' : '水'}），生于${monthGZ[1]}月。`
        }
      })
      return
    }

    // 其他术数类型 — 尝试调用后端或显示占位
    setTimeout(() => {
      this.setData({
        loading: false,
        result: {
          type: this.data.currentType,
          basic: { name: f.name || '缘主', date: f.birthDate, question: f.questionType },
          interpretation: `${this.data.currentTypeName}盘面分析功能正在加载中，当前可使用八字排盘体验完整功能。其他术数排盘即将上线，敬请期待。`
        }
      })
    }, 1500)
  },

  async loadHistory() {
    try {
      const res = await api.getPaipanHistory()
      if (res && res.length) {
        this.setData({ history: res.slice(0, 5) })
      }
    } catch (e) {}
  },

  async onSave() {
    if (!this.data.result) return
    const app = getApp()
    if (!app.checkLogin()) return
    try {
      await api.savePaipan({
        name: this.data.form.name,
        sex: this.data.form.sex,
        birthDate: this.data.form.birthDate,
        birthHour: this.data.form.birthHour,
        birthplace: this.data.form.birthplace,
        paipanResult: JSON.stringify(this.data.result)
      })
      wx.showToast({ title: '保存成功', icon: 'success' })
      this.loadHistory()
    } catch (e) {
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  onShareAppMessage() {
    return { title: `命理宝鉴 · ${this.data.currentTypeName}`, path: '/pages/paipan/paipan' }
  }
})
