// pages/merit/merit.js — 功德系统
const MERIT_ITEMS = [
  { key: 'recite', icon: '📖', name: '诵经', points: 10, desc: '诵读经文，修心养性' },
  { key: 'kindness', icon: '🤝', name: '行善', points: 15, desc: '日行一善，积德行善' },
  { key: 'release', icon: '🕊️', name: '放生', points: 20, desc: '慈悲护生，积累功德' },
  { key: 'lamp', icon: '🪔', name: '供灯', points: 12, desc: '供灯祈福，光明普照' },
]

function todayStr() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

function getWeekDates() {
  const dates = []
  const today = new Date()
  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1 // 周一为0
  const monday = new Date(today)
  monday.setDate(today.getDate() - dayOfWeek)
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'))
  }
  return dates
}

Page({
  data: {
    meritItems: MERIT_ITEMS,
    todayDone: {},
    weekDates: [],
    weekRecords: [],
    totalPoints: 0,
    continuousDays: 1,
    todayDate: '',
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '功德系统' })
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const today = todayStr()
    const storage = wx.getStorageSync('merit_data') || {}
    const todayData = storage[today] || { done: {}, points: 0 }

    // 计算连续天数
    let continuous = 0
    let checkDate = new Date()
    while (true) {
      const ds = checkDate.getFullYear() + '-' + String(checkDate.getMonth() + 1).padStart(2, '0') + '-' + String(checkDate.getDate()).padStart(2, '0')
      if (storage[ds] && storage[ds].points > 0) {
        continuous++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
    if (continuous === 0) continuous = 1

    // 总积分
    let totalPoints = 0
    for (const k in storage) {
      totalPoints += (storage[k].points || 0)
    }

    // 本周记录
    const weekDates = getWeekDates()
    const weekRecords = weekDates.map(d => {
      const data = storage[d]
      const done = data ? data.done : {}
      const count = done ? Object.keys(done).filter(k => done[k]).length : 0
      const isToday = d === today
      return { date: d, label: d.slice(5), count, isToday }
    })

    this.setData({
      todayDone: todayData.done || {},
      totalPoints,
      continuousDays: continuous,
      todayDate: today,
      weekDates,
      weekRecords,
    })
  },

  onCheckIn(e) {
    const key = e.currentTarget.dataset.key
    const storage = wx.getStorageSync('merit_data') || {}
    const today = todayStr()
    if (!storage[today]) storage[today] = { done: {}, points: 0 }
    if (!storage[today].done) storage[today].done = {}

    if (storage[today].done[key]) {
      // 取消打卡
      storage[today].done[key] = false
      const item = MERIT_ITEMS.find(i => i.key === key)
      storage[today].points = Math.max(0, storage[today].points - item.points)
      wx.showToast({ title: '已取消', icon: 'none' })
    } else {
      storage[today].done[key] = true
      const item = MERIT_ITEMS.find(i => i.key === key)
      storage[today].points += item.points
      wx.showToast({ title: '+' + item.points + '功德', icon: 'success' })
    }

    wx.setStorageSync('merit_data', storage)
    this.loadData()
  },

  onShareAppMessage() {
    return { title: '命理宝鉴 · 功德系统', path: '/pages/merit/merit' }
  },
})
