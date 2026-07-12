// pages/yunshi/yunshi.js — 每日运势
// 基于当前日期干支 → 12生肖运势

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

// 确定性伪随机：用日期+生肖索引做种子
function seededRand(seed) {
  let x = seed
  return function() {
    x = (x * 9301 + 49297) % 233280
    return x / 233280
  }
}

// 生肖关系评分调整
function zodiacAdjust(dayZhi, myIdx) {
  const dayZhiIdx = DI_ZHI.indexOf(dayZhi)
  // 六合
  const liuhe = [[0,1],[2,11],[3,10],[4,9],[5,8],[6,7]]
  // 六冲
  const chong = [[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]]
  // 三合
  const sanhe = [[8,0,4],[11,3,7],[2,6,10],[5,9,1]]

  let adjust = 0
  for (const pair of liuhe) {
    if ((pair[0] === dayZhiIdx && pair[1] === myIdx) || (pair[1] === dayZhiIdx && pair[0] === myIdx)) adjust += 15
  }
  for (const pair of chong) {
    if ((pair[0] === dayZhiIdx && pair[1] === myIdx) || (pair[1] === dayZhiIdx && pair[0] === myIdx)) adjust -= 15
  }
  for (const trio of sanhe) {
    if (trio.indexOf(dayZhiIdx) >= 0 && trio.indexOf(myIdx) >= 0 && dayZhiIdx !== myIdx) adjust += 8
  }
  if (dayZhiIdx === myIdx) adjust -= 5 // 本命日
  return adjust
}

function getFortune(score) {
  if (score >= 85) return { star: '★★★★★', level: '大吉', color: '#4ade80' }
  if (score >= 70) return { star: '★★★★☆', level: '吉', color: '#a3e635' }
  if (score >= 55) return { star: '★★★☆☆', level: '中吉', color: '#e6c86e' }
  if (score >= 40) return { star: '★★☆☆☆', level: '小凶', color: '#fbbf24' }
  return { star: '★☆☆☆☆', level: '凶', color: '#f87171' }
}

const ADVICE = {
  career: ['宜积极进取，把握机会', '工作顺利，贵人相助', '稳扎稳打，不宜冒进', '保持低调，避免冲突', '事业受阻，需耐心等待'],
  wealth: ['财运亨通，宜投资理财', '有偏财运，可小试身手', '财运平稳，量入为出', '注意控制开支', '不宜大额消费，防破财'],
  love: ['感情甜蜜，宜表达心意', '桃花旺盛，单身有缘', '关系平稳，多沟通', '注意情绪管理', '易有矛盾，需冷静处理'],
  health: ['精力充沛，注意休息', '身体良好，适当运动', '注意饮食规律', '易疲劳，早睡早起', '注意保暖，防小疾'],
}

function getAdvice(score) {
  if (score >= 85) return 0
  if (score >= 70) return 1
  if (score >= 55) return 2
  if (score >= 40) return 3
  return 4
}

Page({
  data: {
    today: '',
    dayGanZhi: '',
    allFortunes: [],
    loading: false,
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '每日运势' })
    this.calculate()
  },

  calculate() {
    this.setData({ loading: true })
    const today = new Date()
    const y = today.getFullYear()
    const m = today.getMonth() + 1
    const d = today.getDate()

    const baseDate = new Date(1900, 0, 1)
    const diffDays = Math.floor((today - baseDate) / 86400000)
    const ganIdx = diffDays % 10
    const zhiIdx = diffDays % 12
    const dayGanZhi = TIAN_GAN[ganIdx] + DI_ZHI[zhiIdx]

    const seed = y * 10000 + m * 100 + d
    const rng = seededRand(seed)

    const fortunes = []
    for (let i = 0; i < 12; i++) {
      const adjust = zodiacAdjust(DI_ZHI[zhiIdx], i)
      const base = 40 + Math.floor(rng() * 40)
      let score = base + adjust
      if (score > 99) score = 99
      if (score < 20) score = 20

      const fort = getFortune(score)
      const advIdx = getAdvice(score)

      // 四维评分
      const career = Math.min(99, Math.max(20, score + Math.floor(rng() * 20 - 10)))
      const wealth = Math.min(99, Math.max(20, score + Math.floor(rng() * 20 - 10)))
      const love = Math.min(99, Math.max(20, score + Math.floor(rng() * 20 - 10)))
      const health = Math.min(99, Math.max(20, score + Math.floor(rng() * 20 - 10)))

      fortunes.push({
        zodiac: ZODIAC[i],
        score,
        star: fort.star,
        level: fort.level,
        color: fort.color,
        career, wealth, love, health,
        careerAdvice: ADVICE.career[advIdx],
        wealthAdvice: ADVICE.wealth[advIdx],
        loveAdvice: ADVICE.love[advIdx],
        healthAdvice: ADVICE.health[advIdx],
      })
    }

    this.setData({
      loading: false,
      today: y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0'),
      dayGanZhi,
      allFortunes: fortunes,
    })
  },

  onShareAppMessage() {
    return { title: '命理宝鉴 · 每日运势', path: '/pages/yunshi/yunshi' }
  },
})
