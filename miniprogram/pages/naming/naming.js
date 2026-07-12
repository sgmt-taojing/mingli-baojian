// pages/naming/naming.js — 起名改名
// 五格数理：天格=姓笔画+1，人格=姓笔画+名第一字笔画，地格=名第一字笔画+名第二字笔画，总格=所有字笔画和，外格=总格-人格+1

// 常见姓氏笔画（简化版）
const XING_BIHUA = {
  '李': 7, '王': 4, '张': 11, '刘': 6, '陈': 7, '杨': 7, '赵': 9, '黄': 12,
  '周': 8, '吴': 7, '徐': 10, '孙': 6, '胡': 9, '朱': 6, '高': 10, '林': 8,
  '何': 7, '郭': 10, '马': 3, '罗': 8, '梁': 11, '宋': 7, '郑': 8, '谢': 12,
  '韩': 12, '唐': 10, '冯': 5, '于': 3, '董': 12, '萧': 11, '程': 12, '曹': 11,
  '袁': 10, '邓': 4, '许': 6, '傅': 12, '沈': 8, '曾': 12, '彭': 12, '吕': 6,
  '苏': 7, '卢': 5, '蒋': 12, '蔡': 14, '贾': 10, '丁': 2, '魏': 13, '薛': 16,
  '叶': 5, '阎': 11, '余': 7, '潘': 12, '杜': 7, '戴': 13, '夏': 10, '钟': 9,
  '汪': 8, '田': 5, '任': 6, '姜': 9, '范': 8, '方': 4, '石': 5, '姚': 9,
  '谭': 14, '盛': 11, '邹': 7, '熊': 14, '金': 8, '陆': 7, '郝': 9, '孔': 4,
  '白': 5, '崔': 11, '康': 11, '毛': 4, '邱': 7, '秦': 10, '江': 6, '史': 5,
  '顾': 10, '侯': 9, '邵': 7, '孟': 8, '龙': 5, '万': 3, '段': 9, '雷': 13,
  '钱': 10, '汤': 6, '尹': 4, '黎': 15, '易': 8, '常': 11, '武': 8, '乔': 6,
  '贺': 9, '赖': 16, '龚': 11, '文': 4, '施': 9, '洪': 10, '侯': 9, '倪': 10,
}

// 常用名用字笔画（简化版）
const MING_BIHUA = {
  '明': 8, '华': 6, '伟': 6, '芳': 7, '娜': 9, '敏': 11, '静': 14, '丽': 7,
  '强': 12, '磊': 15, '军': 6, '洋': 10, '勇': 9, '艳': 10, '杰': 8, '娟': 10,
  '涛': 10, '明': 8, '超': 12, '霞': 17, '平': 5, '刚': 6, '桂': 10, '英': 8,
  '华': 6, '宇': 6, '泽': 8, '鑫': 24, '浩': 11, '然': 12, '子': 3, '俊': 9,
  '健': 11, '康': 11, '安': 6, '心': 4, '思': 9, '文': 4, '玉': 5, '婷': 12,
  '雪': 11, '梦': 14, '洁': 10, '颖': 13, '慧': 15, '妍': 7, '薇': 16, '雯': 12,
  '嘉': 14, '乐': 5, '晨': 11, '轩': 7, '豪': 14, '瑞': 14, '博': 12, '诚': 8,
  '信': 9, '佳': 8, '欣': 8, '可': 5, '悦': 11, '怡': 9, '瑶': 14, '玲': 10,
}

// 81数理吉凶（简化版，返回1-81的吉凶）
function numJiXiong(n) {
  const lucky = [1,3,5,6,7,8,11,13,15,16,17,18,21,23,24,25,29,31,32,33,35,37,39,41,45,47,48,52,57,61,63,65,67,68,81]
  if (n > 81) n = ((n - 1) % 80) + 1
  if (lucky.indexOf(n) >= 0) return { lucky: true, desc: '吉' }
  return { lucky: false, desc: '凶' }
}

function getBiHua(char) {
  if (XING_BIHUA[char]) return XING_BIHUA[char]
  if (MING_BIHUA[char]) return MING_BIHUA[char]
  // 默认笔画（按常见字估算）
  return char.charCodeAt(0) % 15 + 2
}

// 推荐用字（按五行）
const RECOMMEND_WORDS = {
  '木': ['林', '森', '松', '柏', '桐', '楷', '楠', '柳', '栋', '杰'],
  '火': ['炎', '灿', '炜', '煜', '熙', '然', '晨', '曦', '明', '光'],
  '土': ['坤', '城', '坚', '培', '坦', '均', '佳', '怡', '融', '磊'],
  '金': ['鑫', '锐', '钧', '钰', '铭', '铮', '锦', '镇', '瑞', '诚'],
  '水': ['泽', '浩', '海', '洋', '涛', '涵', '洁', '润', '淳', '源'],
}

Page({
  data: {
    surname: '',
    gender: 'male',
    genderIndex: 0,
    genderOptions: ['男', '女'],
    nameChars: '',
    result: null,
    loading: false,
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '起名改名' })
  },

  onSurnameInput(e) { this.setData({ surname: e.detail.value.trim() }) },
  onGenderChange(e) { this.setData({ genderIndex: e.detail.value, gender: e.detail.value === 0 ? 'male' : 'female' }) },
  onNameInput(e) { this.setData({ nameChars: e.detail.value.trim() }) },

  onCalculate() {
    const surname = this.data.surname
    const nameStr = this.data.nameChars
    if (!surname || surname.length < 1) {
      wx.showToast({ title: '请输入姓氏', icon: 'none' })
      return
    }
    if (!nameStr || nameStr.length < 1) {
      wx.showToast({ title: '请输入名字', icon: 'none' })
      return
    }
    this.setData({ loading: true })

    const xingBh = getBiHua(surname[0])
    const mingChars = nameStr.split('')
    const mingBh = mingChars.map(getBiHua)

    // 五格计算
    const tianGe = xingBh + 1
    const renGe = xingBh + (mingBh[0] || 0)
    const diGe = (mingBh[0] || 0) + (mingBh[1] || mingBh[0] || 0)
    const zongGe = xingBh + mingBh.reduce((a, b) => a + b, 0)
    const waiGe = zongGe - renGe + 1

    const gegeList = [
      { name: '天格', value: tianGe, ...numJiXiong(tianGe) },
      { name: '人格', value: renGe, ...numJiXiong(renGe), main: true },
      { name: '地格', value: diGe, ...numJiXiong(diGe) },
      { name: '总格', value: zongGe, ...numJiXiong(zongGe), main: true },
      { name: '外格', value: waiGe, ...numJiXiong(waiGe) },
    ]

    // 综合评分
    let score = 60
    gegeList.forEach(g => {
      if (g.lucky) score += 6
      else score -= 4
    })
    if (score > 99) score = 99
    if (score < 40) score = 40

    // 推荐用字（基于人格五行）
    const wuxingByNum = {}
    const wxArr = ['木', '火', '土', '金', '水']
    // 简化：尾数1-2木 3-4火 5-6土 7-8金 9-0水
    const numToWx = (n) => {
      const last = n % 10
      if (last === 1 || last === 2) return '木'
      if (last === 3 || last === 4) return '火'
      if (last === 5 || last === 6) return '土'
      if (last === 7 || last === 8) return '金'
      return '水'
    }
    const needWx = numToWx(renGe)
    const recommend = RECOMMEND_WORDS[needWx] || RECOMMEND_WORDS['木']

    this.setData({
      loading: false,
      result: {
        score,
        gegeList,
        needWx,
        recommend,
      }
    })
  },

  onShareAppMessage() {
    return { title: '命理宝鉴 · 起名改名', path: '/pages/naming/naming' }
  },
})
