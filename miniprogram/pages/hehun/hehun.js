// pages/hehun/hehun.js — 合婚匹配
// 生肖：子鼠 丑牛 寅虎 卯兔 辰龙 巳蛇 午马 未羊 申猴 酉鸡 戌狗 亥猪
const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

// 生肖地支序号：0-子 1-丑 2-寅 3-卯 4-辰 5-巳 6-午 7-未 8-申 9-酉 10-戌 11-亥
function yearToZodiacIndex(year) {
  return (year - 4) % 12
}

// 六合：子丑合 寅亥合 卯戌合 辰酉合 巳申合 午未合
const LIUHE = [[0,1],[2,11],[3,10],[4,9],[5,8],[6,7]]
// 三合：申子辰 亥卯未 寅午戌 巳酉丑
const SANHE = [[8,0,4],[11,3,7],[2,6,10],[5,9,1]]
// 相冲：子午 丑未 寅申 卯酉 辰戌 巳亥
const CHONG = [[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]]
// 相刑：子卯 寅巳申 丑戌未 辰午酉亥（自刑）
const XING = [[0,3],[2,5,1],[1,10,4],[8,6,9,11]]
// 相害：子未 丑午 寅巳 卯辰 申亥 酉戌
const HAI = [[0,7],[1,6],[2,5],[3,4],[8,11],[9,10]]

function zodiacRelation(a, b) {
  const relations = []
  // 六合
  for (const pair of LIUHE) {
    if ((pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a)) {
      relations.push({ type: '六合', desc: '生肖六合，天作之合', score: 20, good: true })
    }
  }
  // 三合
  for (const trio of SANHE) {
    if (trio.indexOf(a) >= 0 && trio.indexOf(b) >= 0 && a !== b) {
      relations.push({ type: '三合', desc: '生肖三合，和谐美满', score: 15, good: true })
    }
  }
  // 相冲
  for (const pair of CHONG) {
    if ((pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a)) {
      relations.push({ type: '相冲', desc: '生肖相冲，易有矛盾', score: -20, good: false })
    }
  }
  // 相刑
  for (const group of XING) {
    if (group.indexOf(a) >= 0 && group.indexOf(b) >= 0 && a !== b) {
      relations.push({ type: '相刑', desc: '生肖相刑，需多包容', score: -15, good: false })
    }
  }
  // 相害
  for (const pair of HAI) {
    if ((pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a)) {
      relations.push({ type: '相害', desc: '生肖相害，注意沟通', score: -10, good: false })
    }
  }
  if (relations.length === 0) {
    relations.push({ type: '中性', desc: '生肖无特殊合冲，关系平稳', score: 0, good: true })
  }
  return relations
}

Page({
  data: {
    date1: '1990-01-01',
    date2: '1992-06-15',
    result: null,
    loading: false,
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '合婚匹配' })
  },

  onDate1Change(e) { this.setData({ date1: e.detail.value }) },
  onDate2Change(e) { this.setData({ date2: e.detail.value }) },

  onCalculate() {
    const y1 = parseInt(this.data.date1.split('-')[0])
    const y2 = parseInt(this.data.date2.split('-')[0])
    if (!y1 || !y2) {
      wx.showToast({ title: '请选择有效日期', icon: 'none' })
      return
    }
    this.setData({ loading: true })

    const z1 = yearToZodiacIndex(y1)
    const z2 = yearToZodiacIndex(y2)
    const relations = zodiacRelation(z1, z2)

    let score = 60
    relations.forEach(r => { score += r.score })
    if (score > 99) score = 99
    if (score < 20) score = 20

    const level = score >= 80 ? '大吉' : score >= 65 ? '吉' : score >= 50 ? '中' : score >= 35 ? '凶' : '大凶'
    const advice = score >= 80
      ? '天生一对，珍惜缘分，共同努力经营美好家庭'
      : score >= 65
      ? '整体匹配不错，注意日常沟通，互相理解即可'
      : score >= 50
      ? '关系中等，需要双方更多包容与努力，可通过风水调理'
      : '匹配度较低，建议慎重考量，如已有感情需多沟通化解'

    this.setData({
      loading: false,
      result: {
        z1: ZODIAC[z1], z2: ZODIAC[z2],
        score, level, advice, relations,
      }
    })
  },

  onShareAppMessage() {
    return { title: '命理宝鉴 · 合婚匹配', path: '/pages/hehun/hehun' }
  },
})
