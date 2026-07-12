// pages/tizhi/tizhi.js — 体质辨识
// 基于出生日期推算五行体质

// 天干五行
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const GAN_WUXING = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水']

// 地支五行
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const ZHI_WUXING = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水']

// 体质特征
const TIZHI_INFO = {
  '木': {
    name: '木型体质',
    desc: '木主肝，性格向上、有朝气，易怒',
    features: ['精力旺盛', '有创造力', '易急躁发怒', '肝气偏旺'],
    diet: ['多吃绿色蔬菜', '少食酸味', '适量枸杞菊花茶', '忌过辣'],
    exercise: ['散步、慢跑', '太极、瑜伽', '避免剧烈运动'],
    acupoints: ['太冲穴（疏肝）', '行间穴（泻火）', '风池穴（明目）'],
  },
  '火': {
    name: '火型体质',
    desc: '火主心，热情活泼，易心火旺盛',
    features: ['热情开朗', '思维敏捷', '易失眠多梦', '心火偏旺'],
    diet: ['多吃红色食物', '少食苦味', '莲子心茶安神', '忌辛辣油腻'],
    exercise: ['游泳、散步', '冥想放松', '避免中午剧烈运动'],
    acupoints: ['神门穴（安神）', '内关穴（护心）', '少府穴（清心）'],
  },
  '土': {
    name: '土型体质',
    desc: '土主脾，稳重踏实，易消化不良',
    features: ['性格稳重', '包容力强', '易腹胀湿重', '脾胃偏弱'],
    diet: ['多吃黄色食物', '山药薏米健脾', '少食甜腻', '忌生冷'],
    exercise: ['快走、爬山', '八段锦', '饭后百步走'],
    acupoints: ['足三里（健脾胃）', '中脘穴（消食）', '阴陵泉（祛湿）'],
  },
  '金': {
    name: '金型体质',
    desc: '金主肺，果断坚毅，易呼吸道问题',
    features: ['意志坚定', '做事果断', '易咳嗽鼻塞', '肺气偏弱'],
    diet: ['多吃白色食物', '百合银耳润肺', '少食辛辣', '忌寒凉'],
    exercise: ['慢跑、骑行', '深呼吸练习', '扩胸运动'],
    acupoints: ['列缺穴（宣肺）', '太渊穴（补肺）', '肺俞穴（理气）'],
  },
  '水': {
    name: '水型体质',
    desc: '水主肾，聪明灵活，易腰膝酸软',
    features: ['聪明机智', '适应力强', '易畏寒怕冷', '肾气需养'],
    diet: ['多吃黑色食物', '黑豆黑芝麻补肾', '少食咸味', '忌冰冷'],
    exercise: ['太极拳', '腰部运动', '泡脚暖肾'],
    acupoints: ['涌泉穴（补肾）', '太溪穴（滋阴）', '肾俞穴（强腰）'],
  },
}

function calcWuxing(year, month, day) {
  // 年干五行
  const ganIdx = (year - 4) % 10
  const ganWx = GAN_WUXING[ganIdx]
  // 月支五行（简化：按月份）
  const zhiIdx = Math.floor((month + 1) % 12)
  const zhiWx = ZHI_WUXING[zhiIdx]
  // 日干（简化计算）
  const dayGanIdx = (year * 365 + month * 30 + day) % 10
  const dayWx = GAN_WUXING[dayGanIdx]

  // 综合五行（日干为主）
  const wxCount = {}
  wxCount[ganWx] = (wxCount[ganWx] || 0) + 2
  wxCount[zhiWx] = (wxCount[zhiWx] || 0) + 1
  wxCount[dayWx] = (wxCount[dayWx] || 0) + 3

  // 找最多的五行
  let maxWx = dayWx
  let maxCount = 0
  for (const k in wxCount) {
    if (wxCount[k] > maxCount) {
      maxCount = wxCount[k]
      maxWx = k
    }
  }

  return { mainWx: maxWx, wxCount, dayWx }
}

Page({
  data: {
    birthDate: '1990-06-15',
    result: null,
    loading: false,
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '体质辨识' })
  },

  onDateChange(e) { this.setData({ birthDate: e.detail.value }) },

  onCalculate() {
    const parts = this.data.birthDate.split('-')
    const year = parseInt(parts[0])
    const month = parseInt(parts[1])
    const day = parseInt(parts[2])
    if (!year) {
      wx.showToast({ title: '请选择有效日期', icon: 'none' })
      return
    }
    this.setData({ loading: true })

    const { mainWx, wxCount } = calcWuxing(year, month, day)
    const info = TIZHI_INFO[mainWx]

    this.setData({
      loading: false,
      result: {
        mainWx,
        tizhiName: info.name,
        desc: info.desc,
        features: info.features,
        diet: info.diet,
        exercise: info.exercise,
        acupoints: info.acupoints,
        wxCount: Object.keys(wxCount).map(k => ({ name: k, count: wxCount[k] })),
      }
    })
  },

  onShareAppMessage() {
    return { title: '命理宝鉴 · 体质辨识', path: '/pages/tizhi/tizhi' }
  },
})
