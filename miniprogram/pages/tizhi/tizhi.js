// pages/tizhi/tizhi.js — 体质辨识
const TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
const GAN_WUXING = ['木','木','火','火','土','土','金','金','水','水']
const DI_ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']
const ZHI_WUXING = ['水','土','木','木','土','火','火','土','金','金','土','水']

const TIZHI_INFO = {
  '木': {
    name: '木型体质', desc: '木主肝，性格向上、有朝气，易怒',
    features: ['精力旺盛','有创造力','易急躁发怒','肝气偏旺'],
    diet: ['多吃绿色蔬菜','少食酸味','适量枸杞菊花茶','忌过辣'],
    exercise: ['散步、慢跑','太极、瑜伽','避免剧烈运动'],
    acupoints: ['太冲穴（疏肝）','行间穴（泻火）','风池穴（明目）'],
    season: '春季养肝为主，多到户外踏青，保持心情舒畅',
    shichen: '丑时(1-3点)熟睡养肝血，寅时(3-5点)深睡养肺气',
    taboo: '忌过量饮酒、忌暴怒、忌熬夜伤肝',
    foods: ['菠菜','芹菜','西兰花','绿豆','枸杞','菊花']
  },
  '火': {
    name: '火型体质', desc: '火主心，热情活泼，易心火旺盛',
    features: ['热情开朗','思维敏捷','易失眠多梦','心火偏旺'],
    diet: ['多吃红色食物','少食苦味','莲子心茶安神','忌辛辣油腻'],
    exercise: ['游泳、散步','冥想放松','避免中午剧烈运动'],
    acupoints: ['神门穴（安神）','内关穴（护心）','少府穴（清心）'],
    season: '夏季养心为主，午休片刻，避免烈日下运动',
    shichen: '午时(11-13点)小憩养心气，未时(13-15点)午餐消化',
    taboo: '忌大喜伤心、忌暴晒、忌过食辛辣',
    foods: ['苦瓜','莲子','百合','红豆','绿豆','西瓜']
  },
  '土': {
    name: '土型体质', desc: '土主脾，稳重踏实，易消化不良',
    features: ['性格稳重','包容力强','易腹胀湿重','脾胃偏弱'],
    diet: ['多吃黄色食物','山药薏米健脾','少食甜腻','忌生冷'],
    exercise: ['快走、爬山','八段锦','饭后百步走'],
    acupoints: ['足三里（健脾胃）','中脘穴（消食）','阴陵泉（祛湿）'],
    season: '长夏健脾祛湿，饮食有节，避免久坐湿地',
    shichen: '辰时(7-9点)吃好早餐养胃，巳时(9-11点)脾经最旺',
    taboo: '忌生冷油腻、忌暴饮暴食、忌久坐不动',
    foods: ['山药','薏米','扁豆','红枣','南瓜','小米']
  },
  '金': {
    name: '金型体质', desc: '金主肺，果断坚毅，易呼吸道问题',
    features: ['性格坚毅','执行力强','易咳嗽气短','肺气偏弱'],
    diet: ['多吃白色食物','百合银耳润肺','少食辛辣','忌寒凉'],
    exercise: ['慢跑、爬山','深呼吸练习','扩胸运动'],
    acupoints: ['太渊穴（补肺）','列缺穴（宣肺）','膻中穴（宽胸）'],
    season: '秋季养肺为主，防燥润肺，适当秋冻',
    shichen: '寅时(3-5点)肺经最旺宜深睡，卯时(5-7点)大肠经宜排便',
    taboo: '忌吸烟、忌寒凉食物、忌悲伤过度',
    foods: ['百合','银耳','雪梨','白萝卜','莲藕','蜂蜜']
  },
  '水': {
    name: '水型体质', desc: '水主肾，深沉内敛，易腰膝酸软',
    features: ['性格沉静','意志坚定','易畏寒腰冷','肾气偏弱'],
    diet: ['多吃黑色食物','黑豆核桃补肾','少食盐','忌寒凉'],
    exercise: ['慢跑、太极','腰部锻炼','泡脚温阳'],
    acupoints: ['涌泉穴（补肾）','太溪穴（滋阴）','命门穴（温阳）'],
    season: '冬季养肾为主，早睡晚起，注意保暖',
    shichen: '酉时(17-19点)肾经最旺宜休息，亥时(21-23点)宜安睡',
    taboo: '忌过咸、忌寒凉、忌过度劳累、忌惊恐伤肾',
    foods: ['黑豆','黑芝麻','核桃','枸杞','羊肉','桂圆']
  }
}

function calcWuxing(year, month, day) {
  const yStem = TIAN_GAN[(year - 4) % 10]
  const mStem = TIAN_GAN[(year * 12 + month + 1) % 10]
  const dStem = TIAN_GAN[(year * 365 + month * 30 + day) % 10]
  const stems = [yStem, mStem, dStem]
  const wxCount = {木:0,火:0,土:0,金:0,水:0}
  stems.forEach(s => { wxCount[GAN_WUXING[TIAN_GAN.indexOf(s)]]++ })
  const mainWx = Object.keys(wxCount).reduce((a,b) => wxCount[a] >= wxCount[b] ? a : b)
  return { mainWx, wxCount }
}

Page({
  data: { birthDate: '1990-01-01', loading: false, result: null },

  onLoad() {
    const today = new Date()
    const defaultDate = '1990-01-01'
    this.setData({ birthDate: defaultDate })
  },

  onDateChange(e) { this.setData({ birthDate: e.detail.value }) },

  onCalculate() {
    this.setData({ loading: true })
    const [year, month, day] = this.data.birthDate.split('-').map(Number)
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
        season: info.season,
        shichen: info.shichen,
        taboo: info.taboo,
        foods: info.foods,
        wxCount: Object.keys(wxCount).map(k => ({ name: k, count: wxCount[k] })),
      }
    })
  },

  onShareAppMessage() {
    return { title: '命理宝鉴 · 体质辨识', path: '/pages/tizhi/tizhi' }
  },
})
