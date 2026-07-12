// pages/louceng/louceng.js — 楼层推荐
// 河图数：1-6水、2-7火、3-8木、4-9金、5-0土
const HE_MAP = {
  '1': '水', '6': '水',
  '2': '火', '7': '火',
  '3': '木', '8': '木',
  '4': '金', '9': '金',
  '5': '土', '0': '土',
}

// 命卦计算（东四命/西四命）
// 男：(100 - 年后两位) / 9 取余；女：(年后两位 - 4) / 9 取余
function calcMingua(year, gender) {
  const last2 = year % 100
  let num
  if (gender === 'male') {
    num = (100 - last2) % 9
  } else {
    num = (last2 - 4) % 9
  }
  if (num === 0) num = 9
  // 东四命：1坎、3震、4巽、9离
  // 西四命：2坤、5男坤女艮、6乾、7兑、8艮
  const east = [1, 3, 4, 9]
  const west = [2, 5, 6, 7, 8]
  const isEast = east.indexOf(num) >= 0
  const guaName = {
    1: '坎', 2: '坤', 3: '震', 4: '巽',
    5: gender === 'male' ? '坤' : '艮',
    6: '乾', 7: '兑', 8: '艮', 9: '离',
  }
  return { num, name: guaName[num] || '?', group: isEast ? '东四命' : '西四命' }
}

// 根据命卦五行推荐楼层
const GUA_WUXING = {
  '坎': '水', '坤': '土', '震': '木', '巽': '木',
  '乾': '金', '兑': '金', '艮': '土', '离': '火',
}

// 楼层尾数对应河图五行
function floorWuxing(floor) {
  const last = String(floor).slice(-1)
  return HE_MAP[last] || '?'
}

// 相生关系
function isSheng(a, b) {
  const sheng = { '水': '木', '木': '火', '火': '土', '土': '金', '金': '水' }
  return sheng[a] === b
}
function isKe(a, b) {
  const ke = { '水': '火', '火': '金', '金': '木', '木': '土', '土': '水' }
  return ke[a] === b
}

Page({
  data: {
    birthYear: '1990',
    gender: 'male',
    genderIndex: 0,
    genderOptions: ['男', '女'],
    result: null,
    loading: false,
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '楼层推荐' })
  },

  onYearChange(e) {
    this.setData({ birthYear: e.detail.value })
  },
  onGenderChange(e) {
    this.setData({ genderIndex: e.detail.value, gender: e.detail.value === 0 ? 'male' : 'female' })
  },

  onCalculate() {
    const year = parseInt(this.data.birthYear)
    if (!year || year < 1900 || year > 2100) {
      wx.showToast({ title: '请输入有效年份', icon: 'none' })
      return
    }
    this.setData({ loading: true })

    const gua = calcMingua(year, this.data.gender)
    const myWx = GUA_WUXING[gua.name]

    const recommend = []
    const notRecommend = []
    const neutral = []

    for (let f = 1; f <= 33; f++) {
      const fw = floorWuxing(f)
      let level = 'neutral'
      let reason = ''
      if (fw === myWx) {
        level = 'best'
        reason = '楼层五行与命卦相同，助运'
      } else if (isSheng(fw, myWx)) {
        level = 'good'
        reason = '楼层生命卦，相生为吉'
      } else if (isSheng(myWx, fw)) {
        level = 'good'
        reason = '命卦生楼层，泄气但可用'
      } else if (isKe(fw, myWx)) {
        level = 'bad'
        reason = '楼层克命卦，不利'
      } else if (isKe(myWx, fw)) {
        level = 'ok'
        reason = '命卦克楼层，可控制'
      }
      const item = { floor: f, wuxing: fw, level, reason }
      if (level === 'best' || level === 'good') recommend.push(item)
      else if (level === 'bad') notRecommend.push(item)
      else neutral.push(item)
    }

    this.setData({
      loading: false,
      result: {
        gua, myWx,
        recommend: recommend.slice(0, 12),
        notRecommend: notRecommend.slice(0, 8),
        neutral: neutral.slice(0, 6),
      }
    })
  },

  onShareAppMessage() {
    return { title: '命理宝鉴 · 楼层推荐', path: '/pages/louceng/louceng' }
  },
})
