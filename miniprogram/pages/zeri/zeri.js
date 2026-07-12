// pages/zeri/zeri.js — 择日服务
// 基于干支计算吉日（简化版：用日期确定性种子计算）

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

// 黄道吉日：建除十二神（简化版）
// 建除满平定执破危成收开闭
const JIAN_CHU = ['建', '除', '满', '平', '定', '执', '破', '危', '成', '收', '开', '闭']
const JIAN_CHU_LUCKY = {
  '建': false, '除': true, '满': true, '平': false,
  '定': true, '执': false, '破': false, '危': false,
  '成': true, '收': true, '开': true, '闭': false,
}

// 事项宜忌（简化）
const EVENT_YI = {
  '搬家': ['移徙', '入宅', '安床'],
  '开业': ['开市', '交易', '立券'],
  '签约': ['签约', '交易', '纳财'],
  '结婚': ['嫁娶', '订盟', '纳采'],
}

const EVENT_JI = {
  '搬家': ['安葬', '破土'],
  '开业': ['归宁', '出行'],
  '签约': ['诉讼', '动土'],
  '结婚': ['安葬', '破土', '开仓'],
}

function dateToGanZhi(year, month, day) {
  // 简化计算：以1900-01-01为基准（甲子日）
  const baseDate = new Date(1900, 0, 1)
  const target = new Date(year, month - 1, day)
  const diffDays = Math.floor((target - baseDate) / 86400000)
  const ganIdx = (diffDays + 0) % 10
  const zhiIdx = (diffDays + 0) % 12
  return {
    gan: TIAN_GAN[ganIdx],
    zhi: DI_ZHI[zhiIdx],
    ganIdx,
    zhiIdx,
    zodiac: ZODIAC[zhiIdx],
  }
}

function getJianChu(year, month, day) {
  const baseDate = new Date(1900, 0, 1)
  const target = new Date(year, month - 1, day)
  const diffDays = Math.floor((target - baseDate) / 86400000)
  return JIAN_CHU[diffDays % 12]
}

// 冲煞：地支六冲
const CHONG_MAP = { '子': '午', '丑': '未', '寅': '申', '卯': '酉', '辰': '戌', '巳': '亥', '午': '子', '未': '丑', '申': '寅', '酉': '卯', '戌': '辰', '亥': '巳' }

Page({
  data: {
    eventType: '搬家',
    eventIndex: 0,
    eventOptions: ['搬家', '开业', '签约', '结婚'],
    luckyDays: [],
    loading: false,
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '择日服务' })
    this.onCalculate()
  },

  onEventChange(e) {
    this.setData({ eventIndex: e.detail.value, eventType: this.data.eventOptions[e.detail.value] })
    this.onCalculate()
  },

  onCalculate() {
    this.setData({ loading: true })
    const eventType = this.data.eventType
    const today = new Date()
    const days = []

    for (let i = 0; i < 30; i++) {
      const d = new Date(today.getTime() + i * 86400000)
      const y = d.getFullYear()
      const m = d.getMonth() + 1
      const day = d.getDate()

      const gz = dateToGanZhi(y, m, day)
      const jc = getJianChu(y, m, day)
      const isLucky = JIAN_CHU_LUCKY[jc]
      const chong = CHONG_MAP[gz.zhi]
      const chongZodiac = ZODIAC[DI_ZHI.indexOf(chong)]

      const yi = EVENT_YI[eventType] || []
      const ji = EVENT_JI[eventType] || []

      // 简化评分：建除吉 + 日干支与事项匹配
      let score = 50
      if (isLucky) score += 25
      // 成日最适合开业签约
      if (jc === '成' && (eventType === '开业' || eventType === '签约')) score += 15
      // 除日适合搬家
      if (jc === '除' && eventType === '搬家') score += 15
      // 满日适合结婚
      if (jc === '满' && eventType === '结婚') score += 15
      // 定日适合签约
      if (jc === '定' && eventType === '签约') score += 10

      if (score >= 70) {
        days.push({
          date: y + '-' + String(m).padStart(2, '0') + '-' + String(day).padStart(2, '0'),
          dateLabel: m + '月' + day + '日',
          weekDay: ['日', '一', '二', '三', '四', '五', '六'][d.getDay()],
          ganzhi: gz.gan + gz.zhi,
          zodiac: gz.zodiac,
          jianchu: jc,
          lucky: isLucky,
          score,
          chong: '冲' + chongZodiac + '(' + chong + ')',
          yi: yi.join('、'),
          ji: ji.join('、'),
        })
      }
    }

    days.sort((a, b) => b.score - a.score)

    this.setData({
      loading: false,
      luckyDays: days,
    })
  },

  onShareAppMessage() {
    return { title: '命理宝鉴 · 择日服务', path: '/pages/zeri/zeri' }
  },
})
