// pages/fengshui/fengshui.js — 阳宅风水分析

const HOUSE_TYPES = [
  { key: 'square', name: '方正形', desc: '四正方圆，格局端正' },
  { key: 'L', name: 'L形', desc: '缺角形，需补角' },
  { key: 'T', name: 'T形', desc: '凸出形，气场不均' },
  { key: 'knife', name: '刀把形', desc: '形似刀把，需化解' },
  { key: 'triangle', name: '三角形', desc: '尖角形，火气重' },
  { key: 'missing', name: '缺角形', desc: '有方位缺角' },
]

const DIRECTIONS = [
  { key: 'south', name: '坐北朝南', desc: '正阳向，采光最佳' },
  { key: 'southeast', name: '坐西北朝东南', desc: '紫气东来，文昌旺' },
  { key: 'east', name: '坐西朝东', desc: '朝阳入户，生机旺' },
  { key: 'north', name: '坐南朝北', desc: '阴气偏重，需补阳' },
  { key: 'west', name: '坐东朝西', desc: '西晒重，需遮阳' },
  { key: 'southwest', name: '坐东北朝西南', desc: '坤位厚重，稳财' },
]

// 八方位吉凶（基于八宅明镜简化版）
const FANGWEI = [
  { dir: '正北', element: '水', body: '肾脏/泌尿', topic: '事业' },
  { dir: '东北', element: '土', body: '脾胃/消化', topic: '子孙/学业' },
  { dir: '正东', element: '木', body: '肝胆/四肢', topic: '健康/家庭' },
  { dir: '东南', element: '木', body: '肝胆/神经', topic: '财运/文昌' },
  { dir: '正南', element: '火', body: '心脏/眼目', topic: '名声/桃花' },
  { dir: '西南', element: '土', body: '脾胃/妇科', topic: '婚姻/稳定' },
  { dir: '正西', element: '金', body: '肺/呼吸', topic: '子孙/口才' },
  { dir: '西北', element: '金', body: '肺/头部', topic: '贵人/事业' },
]

// 缺角影响
const QUEJIAO = {
  'north': '正北缺角 → 影响肾脏、事业运，宜放水属性物品化解',
  'northeast': '东北缺角 → 影响子孙运、学业，宜放陶瓷物品补角',
  'east': '正东缺角 → 影响健康、家庭运，宜放绿色植物化解',
  'southeast': '东南缺角 → 影响财运、文昌，宜放木属性物品补角',
  'south': '正南缺角 → 影响名声、桃花，宜放红色物品化解',
  'southwest': '西南缺角 → 影响婚姻、稳定，宜放黄水晶化解',
  'west': '正西缺角 → 影响子孙、口才，宜放金属物品补角',
  'northwest': '西北缺角 → 影响贵人、男主人运，宜放金属物品化解',
}

function getQuejiaoByType(type) {
  switch (type) {
    case 'L': return ['north', 'east']
    case 'T': return ['southwest']
    case 'knife': return ['northeast']
    case 'triangle': return ['northwest', 'southwest']
    case 'missing': return ['southeast']
    default: return []
  }
}

Page({
  data: {
    houseType: 'square',
    houseTypeIndex: 0,
    houseTypeOptions: HOUSE_TYPES.map(t => t.name),
    direction: 'south',
    directionIndex: 0,
    directionOptions: DIRECTIONS.map(d => d.name),
    result: null,
    loading: false,
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '阳宅风水' })
  },

  onHouseTypeChange(e) {
    const idx = e.detail.value
    this.setData({ houseTypeIndex: idx, houseType: HOUSE_TYPES[idx].key })
  },

  onDirectionChange(e) {
    const idx = e.detail.value
    this.setData({ directionIndex: idx, direction: DIRECTIONS[idx].key })
  },

  onAnalyze() {
    this.setData({ loading: true })

    const houseType = HOUSE_TYPES[this.data.houseTypeIndex]
    const direction = DIRECTIONS[this.data.directionIndex]
    const quejiaoDirs = getQuejiaoByType(houseType.key)
    const quejiaoList = quejiaoDirs.map(d => ({
      dir: d,
      impact: QUEJIAO[d] || '需专业风水师实地勘察',
    }))

    // 方位吉凶分析（简化：基于朝向判断）
    const fangweiAnalysis = FANGWEI.map(fw => {
      let level = '中'
      let reason = '方位平稳'
      // 简化：朝南则北方为吉，朝东则西方为吉等
      if (this.data.direction === 'south') {
        if (fw.dir === '正南') { level = '吉'; reason = '主向位，采光佳' }
        if (fw.dir === '正北') { level = '中'; reason = '背向位，宜静' }
        if (fw.dir === '东南') { level = '吉'; reason = '文昌位旺' }
      } else if (this.data.direction === 'east') {
        if (fw.dir === '正东') { level = '吉'; reason = '朝阳入户' }
        if (fw.dir === '正西') { level = '凶'; reason = '西晒过重' }
      } else if (this.data.direction === 'southeast') {
        if (fw.dir === '东南') { level = '吉'; reason = '紫气东来' }
        if (fw.dir === '西北') { level = '中'; reason = '背向位' }
      } else {
        if (fw.dir === '正南') { level = '中'; reason = '侧向位' }
      }
      // 缺角降级
      const dirKey = fw.dir === '正北' ? 'north' : fw.dir === '东北' ? 'northeast' : fw.dir === '正东' ? 'east' : fw.dir === '东南' ? 'southeast' : fw.dir === '正南' ? 'south' : fw.dir === '西南' ? 'southwest' : fw.dir === '正西' ? 'west' : 'northwest'
      if (quejiaoDirs.indexOf(dirKey) >= 0) {
        level = '凶'
        reason = '此方位缺角，需化解'
      }
      return { ...fw, level, reason }
    })

    // 化解建议
    const remedies = []
    if (quejiaoDirs.length > 0) {
      remedies.push('缺角方位建议摆放对应五行物品化解')
      remedies.push('可在缺角处放置泰山石或八卦镜补角')
    }
    if (this.data.direction === 'north') {
      remedies.push('坐南朝北采光不足，建议增加照明、暖色调装饰')
    }
    if (this.data.direction === 'west') {
      remedies.push('西晒严重，建议安装遮光窗帘，阳台种植绿色植物')
    }
    if (houseType.key === 'knife') {
      remedies.push('刀把形户型建议在刀把处设置屏风或植物隔断')
    }
    if (houseType.key === 'triangle') {
      remedies.push('三角形户型火气重，建议在尖角处放圆形鱼缸化解')
    }
    remedies.push('保持玄关整洁明亮，利于纳气入宅')
    remedies.push('卧室避免镜子正对床铺')

    this.setData({
      loading: false,
      result: {
        houseType, direction,
        quejiaoList,
        fangweiAnalysis,
        remedies,
      }
    })
  },

  onShareAppMessage() {
    return { title: '命理宝鉴 · 阳宅风水', path: '/pages/fengshui/fengshui' }
  },
})
