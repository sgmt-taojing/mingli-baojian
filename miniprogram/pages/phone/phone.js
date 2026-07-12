// pages/phone/phone.js — 手机号测评
const { requireApi } = require('../../utils/api')

// 数字五行映射：1-6水、2-7火、3-8木、4-9金、5-0土
const WUXING_MAP = {
  '1': '水', '6': '水',
  '2': '火', '7': '火',
  '3': '木', '8': '木',
  '4': '金', '9': '金',
  '5': '土', '0': '土',
}

const WUXING_COLOR = {
  '水': '#60a5fa', '火': '#f87171', '木': '#4ade80',
  '金': '#e6c86e', '土': '#a78bfa',
}

// 八星组合（数字对）
const BAXING = [
  { pair: '14,41,67,76', name: '生气', desc: '乐观开朗、贵人相助', good: true },
  { pair: '13,31,68,86', name: '天医', desc: '聪明智慧、财运佳', good: true },
  { pair: '19,91,78,87', name: '延年', desc: '事业心强、领导力', good: true },
  { pair: '11,22,33,44,66,77,88,99,00', name: '伏位', desc: '稳重保守、耐力强', good: true },
  { pair: '12,21,69,96', name: '绝命', desc: '冲动冒险、需防破财', good: false },
  { pair: '17,71,89,98', name: '祸害', desc: '口舌是非、需慎言行', good: false },
  { pair: '18,81,79,97', name: '五鬼', desc: '变动多、才华横溢', good: false },
  { pair: '16,61,47,74', name: '六煞', desc: '感情丰富、人际敏感', good: false },
]

function matchBaxing(a, b) {
  const pair = a + '' + b
  for (const bx of BAXING) {
    if (bx.pair.split(',').indexOf(pair) >= 0) return bx
  }
  return null
}

function calcScore(digits) {
  let score = 60
  // 吉星加分，凶星减分
  for (let i = 0; i < digits.length - 1; i++) {
    const bx = matchBaxing(digits[i], digits[i + 1])
    if (bx) {
      if (bx.good) score += 4
      else score -= 3
    }
  }
  // 尾号权重
  const last = digits[digits.length - 1]
  if (['1', '3', '4', '6', '8'].indexOf(last) >= 0) score += 5
  if (score > 99) score = 99
  if (score < 30) score = 30
  return score
}

Page({
  data: {
    phoneInput: '',
    result: null,
    loading: false,
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '手机号测评' })
  },

  onInput(e) {
    this.setData({ phoneInput: e.detail.value.replace(/[^0-9]/g, '').slice(0, 11) })
  },

  onCalculate() {
    const phone = this.data.phoneInput
    if (phone.length < 7) {
      wx.showToast({ title: '请输入至少7位号码', icon: 'none' })
      return
    }
    this.setData({ loading: true })

    const digits = phone.split('')
    // 各位置五行
    const wuxingList = digits.map((d, i) => ({
      pos: i + 1,
      digit: d,
      wuxing: WUXING_MAP[d],
      color: WUXING_COLOR[WUXING_MAP[d]],
    }))

    // 五行统计
    const wxCount = {}
    digits.forEach(d => {
      const w = WUXING_MAP[d]
      wxCount[w] = (wxCount[w] || 0) + 1
    })

    // 八星组合
    const baxingResults = []
    for (let i = 0; i < digits.length - 1; i++) {
      const bx = matchBaxing(digits[i], digits[i + 1])
      if (bx) {
        baxingResults.push({
          pos: (i + 1) + '-' + (i + 2),
          name: bx.name,
          desc: bx.desc,
          good: bx.good,
        })
      }
    }

    const score = calcScore(digits)
    const lucky = score >= 70

    this.setData({
      loading: false,
      result: {
        score,
        lucky,
        level: lucky ? '吉' : '凶',
        wuxingList,
        wxCount: Object.keys(wxCount).map(k => ({ name: k, count: wxCount[k] })),
        baxingResults,
      }
    })
  },

  onShareAppMessage() {
    return { title: '命理宝鉴 · 手机号测评', path: '/pages/phone/phone' }
  },
})
