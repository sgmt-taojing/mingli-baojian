// pages/zhanbu/zhanbu.js — 周易占卜
// 64卦数据（简化版）
const BAGUA = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'] // 先天序号1-8

const GUA64 = [
  { num: 1, name: '乾为天', symbol: '䷀', ci: '元亨利贞', desc: '大吉之卦，刚健中正，万事亨通', advice: '宜积极进取，把握时机' },
  { num: 2, name: '坤为地', symbol: '䷁', ci: '元亨，利牝马之贞', desc: '柔顺包容，厚德载物', advice: '宜顺从配合，以柔克刚' },
  { num: 3, name: '水雷屯', symbol: '䷂', ci: '元亨利贞，勿用有攸往', desc: '万事开头难，需耐心坚持', advice: '宜守不宜进，积蓄力量' },
  { num: 4, name: '山水蒙', symbol: '䷃', ci: '亨，匪我求童蒙', desc: '蒙昧待启，需请教学习', advice: '宜虚心学习，寻求指导' },
  { num: 5, name: '水天需', symbol: '䷄', ci: '有孚，光亨贞吉', desc: '等待时机，耐心准备', advice: '宜静待时机，不可急躁' },
  { num: 6, name: '天水讼', symbol: '䷅', ci: '有孚窒惕，中吉终凶', desc: '争讼不利，以和为贵', advice: '宜和解避争，避免冲突' },
  { num: 7, name: '地水师', symbol: '䷆', ci: '贞，丈人吉无咎', desc: '用兵之道，纪律严明', advice: '宜有组织有计划地行动' },
  { num: 8, name: '水地比', symbol: '䷇', ci: '吉，原筮元永贞', desc: '亲密团结，辅佐相助', advice: '宜合作互助，团结他人' },
  { num: 11, name: '地天泰', symbol: '䷊', ci: '小往大来，吉亨', desc: '天地交泰，通达安泰', advice: '大吉之时，宜积极行动' },
  { num: 12, name: '天地否', symbol: '䷋', ci: '否之匪人，不利君子贞', desc: '天地不交，闭塞不通', advice: '宜守正待变，不可冒进' },
  { num: 13, name: '天火同人', symbol: '䷌', ci: '同人于野，亨', desc: '同心同德，与人和同', advice: '宜坦诚合作，广结善缘' },
  { num: 14, name: '火天大有', symbol: '䷍', ci: '元亨', desc: '大有收获，丰盛富有', advice: '宜把握机遇，盛大事业' },
  { num: 15, name: '地山谦', symbol: '䷎', ci: '亨，君子有终', desc: '谦虚受益，君子有终', advice: '宜谦虚谨慎，不可张扬' },
  { num: 16, name: '雷地豫', symbol: '䷏', ci: '利建侯行师', desc: '欢乐愉悦，顺势而为', advice: '宜顺势而行，快乐做事' },
  { num: 17, name: '泽雷随', symbol: '䷐', ci: '元亨利贞，无咎', desc: '随顺时势，随机应变', advice: '宜灵活变通，顺应变化' },
  { num: 18, name: '山风蛊', symbol: '䷑', ci: '元亨，利涉大川', desc: '积弊需治，革新图强', advice: '宜整顿改革，解决问题' },
  { num: 23, name: '山地剥', symbol: '䷖', ci: '不利有攸往', desc: '剥落衰败，需防小人', advice: '宜守不宜进，保护自身' },
  { num: 24, name: '地雷复', symbol: '䷗', ci: '亨，出入无疾', desc: '否极泰来，一阳复始', advice: '宜重新开始，抓住转机' },
  { num: 25, name: '天雷无妄', symbol: '䷘', ci: '元亨利贞', desc: '无妄之灾，守正则吉', advice: '宜顺其自然，不可妄为' },
  { num: 26, name: '山天大畜', symbol: '䷙', ci: '利贞，不家食吉', desc: '大有积蓄，刚健笃实', advice: '宜积蓄实力，厚积薄发' },
  { num: 27, name: '山雷颐', symbol: '䷚', ci: '贞吉，观颐自求口实', desc: '颐养正道，慎言节食', advice: '宜注重修养，节制自律' },
  { num: 28, name: '泽风大过', symbol: '䷛', ci: '栋桡，利有攸往', desc: '过度负荷，需量力而行', advice: '宜量力而行，不可勉强' },
  { num: 29, name: '坎为水', symbol: '䷜', ci: '习坎，有孚维心', desc: '重险陷溺，需诚信脱困', advice: '宜诚信坚定，迎难而上' },
  { num: 30, name: '离为火', symbol: '䷝', ci: '利贞，亨，畜牝牛吉', desc: '光明附丽，文明之象', advice: '宜光明正大，依附正道' },
  { num: 34, name: '雷天大壮', symbol: '䷡', ci: '利贞', desc: '大壮刚强，壮盛有力', advice: '宜正大光明，不可恃强' },
  { num: 35, name: '火地晋', symbol: '䷢', ci: '康侯用锡马蕃庶', desc: '晋升之象，光明前进', advice: '宜积极上进，争取进步' },
  { num: 36, name: '地火明夷', symbol: '䷣', ci: '利艰贞', desc: '光明受损，韬光养晦', advice: '宜隐忍退守，待时而动' },
  { num: 37, name: '风火家人', symbol: '䷤', ci: '利女贞', desc: '家人和睦，各司其职', advice: '宜和睦相处，做好本职' },
  { num: 38, name: '火泽睽', symbol: '䷥', ci: '小事吉', desc: '乖违背离，求同存异', advice: '宜求同存异，化解分歧' },
  { num: 41, name: '山泽损', symbol: '䷨', ci: '有孚元吉无咎', desc: '损下益上，损中有益', advice: '宜适当舍弃，以退为进' },
  { num: 42, name: '风雷益', symbol: '䷩', ci: '利有攸往，利涉大川', desc: '损上益下，受益匪浅', advice: '宜把握良机，积极行动' },
  { num: 45, name: '泽地萃', symbol: '䷬', ci: '亨，王假有庙', desc: '聚集汇合，群英荟萃', advice: '宜团结聚力，共谋发展' },
  { num: 46, name: '地风升', symbol: '䷭', ci: '元亨，用见大人', desc: '上升之象，步步高升', advice: '宜循序渐进，稳步上升' },
  { num: 47, name: '泽水困', symbol: '䷮', ci: '亨，贞，大人吉', desc: '困窘艰难，需坚忍不拔', advice: '宜坚守正道，等待脱困' },
  { num: 48, name: '水风井', symbol: '䷯', ci: '改邑不改井，无丧无得', desc: '井养万物，源源不断', advice: '宜修养内在，持续努力' },
  { num: 51, name: '震为雷', symbol: '䷲', ci: '亨，震来虩虩', desc: '震动惊惧，临危不乱', advice: '宜临危不乱，镇定应对' },
  { num: 52, name: '艮为山', symbol: '䷳', ci: '艮其背，不获其身', desc: '适可而止，动静适时', advice: '宜知止则止，把握分寸' },
  { num: 53, name: '风山渐', symbol: '䷴', ci: '女归吉，利贞', desc: '循序渐进，稳步前进', advice: '宜按部就班，不可急躁' },
  { num: 54, name: '雷泽归妹', symbol: '䷵', ci: '征凶，无攸利', desc: '归妹不正，需守本分', advice: '宜守本分，不可越位' },
  { num: 55, name: '雷火丰', symbol: '䷶', ci: '亨，王假之', desc: '丰收盛大，极盛之象', advice: '宜把握盛时，居安思危' },
  { num: 56, name: '火山旅', symbol: '䷷', ci: '小亨，旅贞吉', desc: '旅行在外，小心谨慎', advice: '宜谨慎行事，入乡随俗' },
  { num: 61, name: '风泽中孚', symbol: '䷼', ci: '豚鱼吉，利涉大川', desc: '诚信中实，感化万物', advice: '宜以诚待人，信守承诺' },
  { num: 62, name: '雷山小过', symbol: '䷽', ci: '亨利贞，可小事不可大事', desc: '小有过越，宜小不宜大', advice: '宜从小处着手，不可贪大' },
  { num: 63, name: '水火既济', symbol: '䷾', ci: '亨小，利贞', desc: '既济完成，万事皆成', advice: '宜守成防骄，居安思危' },
  { num: 64, name: '火水未济', symbol: '䷿', ci: '亨，小狐汔济', desc: '未济未成，待完成之', advice: '宜坚持到底，完成最后一步' },
]

// 确定性种子：日期+问题hash
function seededRand(seed) {
  let x = seed
  return function() {
    x = (x * 9301 + 49297) % 233280
    return x / 233280
  }
}

function hashStr(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & 0x7fffffff
  }
  return hash
}

function castGua(rng) {
  // 模拟六爻：每次3枚铜钱，6次
  const yao = [] // 0=阴 1=阳 2=变阴 3=变阳
  for (let i = 0; i < 6; i++) {
    const r = rng()
    if (r < 0.125) yao.push(6) // 太阴
    else if (r < 0.375) yao.push(7) // 少阳
    else if (r < 0.625) yao.push(8) // 少阴
    else if (r < 0.875) yao.push(9) // 太阳
    else yao.push(7) // default
  }
  // 下卦（初二三）和上卦（四五上）
  const lowerYao = [yao[0], yao[1], yao[2]].map(y => y % 2 === 0 ? 0 : 1)
  const upperYao = [yao[3], yao[4], yao[5]].map(y => y % 2 === 0 ? 0 : 1)

  // 转八卦（先天序：乾1兑2离3震4巽5坎6艮7坤8）
  function yaoToGua(y) {
    // y[0]为初爻
    const val = y[0] * 1 + y[1] * 2 + y[2] * 4
    const map = [7, 4, 2, 6, 3, 5, 1, 0] // 0-7 → 先天序-1
    return map[val] + 1
  }
  const lower = yaoToGua(lowerYao)
  const upper = yaoToGua(upperYao)
  const guaNum = lower * 8 + upper // 简化编号

  // 找最接近的卦
  let gua = GUA64[0]
  let minDiff = 999
  for (const g of GUA64) {
    const diff = Math.abs(g.num - guaNum)
    if (diff < minDiff) {
      minDiff = diff
      gua = g
    }
  }

  // 变爻
  const bianYao = yao.findIndex(y => y === 6 || y === 9)

  return { gua, yao, bianYao }
}

Page({
  data: {
    divType: 'liuyao',
    typeIndex: 0,
    typeOptions: ['六爻占卜', '梅花易数'],
    question: '',
    result: null,
    loading: false,
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '周易占卜' })
  },

  onTypeChange(e) {
    this.setData({ typeIndex: e.detail.value, divType: e.detail.value === 0 ? 'liuyao' : 'meihua' })
  },
  onQuestionInput(e) {
    this.setData({ question: e.detail.value })
  },

  onDivine() {
    if (!this.data.question.trim()) {
      wx.showToast({ title: '请输入您要问的事', icon: 'none' })
      return
    }
    this.setData({ loading: true })

    const today = new Date()
    const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
    const qHash = hashStr(this.data.question)
    const seed = dateSeed + qHash
    const rng = seededRand(seed)

    const { gua, yao, bianYao } = castGua(rng)

    // 生成爻象显示
    const yaoDisplay = yao.map((y, i) => {
      const isYang = y % 2 === 1
      const isBian = y === 6 || y === 9
      return {
        pos: 6 - i,
        symbol: isYang ? '━━━━━━━' : '━　　━',
        type: isYang ? '阳' : '阴',
        bian: isBian ? '变' : '',
        isBian,
      }
    })

    this.setData({
      loading: false,
      result: {
        guaName: gua.name,
        guaSymbol: gua.symbol,
        guaCi: gua.ci,
        guaDesc: gua.desc,
        advice: gua.advice,
        yaoDisplay: yaoDisplay.reverse(), // 从初爻到上爻
        bianYao: bianYao >= 0 ? '第' + (bianYao + 1) + '爻动' : '无变爻',
        question: this.data.question,
      }
    })
  },

  onShareAppMessage() {
    return { title: '命理宝鉴 · 周易占卜', path: '/pages/zhanbu/zhanbu' }
  },
})
