/**
 * 针灸穴位数据标准 V1.0
 * 14经络 + 361经穴 + 常用经外奇穴
 */

const ACUPOINT_SCHEMA = {
  "id": "LU1",                     // 标准ID (经络缩写+序号)
  "name_cn": "中府",               // 中文名
  "name_pinyin": "zhōng fǔ",       // 拼音
  "meridian": "手太阴肺经",        // 所属经络
  "meridian_abbr": "LU",           // 经络缩写
  "number": 1,                     // 序号
  "category": "经穴",              // 经穴/经外奇穴/阿是穴
  "location": {
    "anatomical": "在胸前壁外上方，前正中线旁开6寸，平第1肋间隙处",
    "cun_measurement": "距前正中线6寸",
    "landmark": "第1肋间隙"
  },
  "needling": {
    "depth_cun": 0.5,              // 针刺深度(寸)
    "depth_mm_min": 5,             // 最低深度mm
    "depth_mm_max": 8,             // 最高深度mm
    "angle": "斜刺或平刺",         // 直刺/斜刺/平刺
    "moxibustion": "可灸",
    "contraindications": ["不可深刺，避免伤及肺脏"]
  },
  "indications": [
    "咳嗽", "气喘", "胸痛", "肩背痛"
  ],
  "functions": [
    "宣肺理气", "止咳平喘"
  ],
  "five_elements": {
    "point_type": "募穴",          // 五输穴/原穴/络穴/郄穴/背俞穴/募穴/八会穴/八脉交会穴/下合穴
    "wuxing": "土"                 // 井荥输经合对应的五行
  },
  "combinations": [
    { "point": "LU7", "effect": "配列缺治咳嗽" },
    { "point": "UB13", "effect": "配肺俞治哮喘" }
  ]
};

// 14 经络
const MERIDIANS = {
  "LU": { "cn": "手太阴肺经", "yin_yang": "阴", "element": "金", "zang_fu": "肺", "points": 11, "flow_time": "寅时3-5点" },
  "LI": { "cn": "手阳明大肠经", "yin_yang": "阳", "element": "金", "zang_fu": "大肠", "points": 20, "flow_time": "卯时5-7点" },
  "ST": { "cn": "足阳明胃经", "yin_yang": "阳", "element": "土", "zang_fu": "胃", "points": 45, "flow_time": "辰时7-9点" },
  "SP": { "cn": "足太阴脾经", "yin_yang": "阴", "element": "土", "zang_fu": "脾", "points": 21, "flow_time": "巳时9-11点" },
  "HT": { "cn": "手少阴心经", "yin_yang": "阴", "element": "火", "zang_fu": "心", "points": 9, "flow_time": "午时11-13点" },
  "SI": { "cn": "手太阳小肠经", "yin_yang": "阳", "element": "火", "zang_fu": "小肠", "points": 19, "flow_time": "未时13-15点" },
  "UB": { "cn": "足太阳膀胱经", "yin_yang": "阳", "element": "水", "zang_fu": "膀胱", "points": 67, "flow_time": "申时15-17点" },
  "KI": { "cn": "足少阴肾经", "yin_yang": "阴", "element": "水", "zang_fu": "肾", "points": 27, "flow_time": "酉时17-19点" },
  "PC": { "cn": "手厥阴心包经", "yin_yang": "阴", "element": "火", "zang_fu": "心包", "points": 9, "flow_time": "戌时19-21点" },
  "SJ": { "cn": "手少阳三焦经", "yin_yang": "阳", "element": "火", "zang_fu": "三焦", "points": 23, "flow_time": "亥时21-23点" },
  "GB": { "cn": "足少阳胆经", "yin_yang": "阳", "element": "木", "zang_fu": "胆", "points": 44, "flow_time": "子时23-1点" },
  "LR": { "cn": "足厥阴肝经", "yin_yang": "阴", "element": "木", "zang_fu": "肝", "points": 14, "flow_time": "丑时1-3点" },
  "CV": { "cn": "任脉", "yin_yang": "阴", "element": null, "zang_fu": null, "points": 24, "flow_time": null },
  "GV": { "cn": "督脉", "yin_yang": "阳", "element": null, "zang_fu": null, "points": 28, "flow_time": null }
};

// 五输穴规律
const WUSHU_RULES = {
  "阴经": { "井": "木", "荥": "火", "输": "土", "经": "金", "合": "水" },
  "阳经": { "井": "金", "荥": "水", "输": "木", "经": "火", "合": "土" }
};

// 常用经外奇穴+高频经穴（可检索池）
const EXTRA_POINTS = [
  // 经外奇穴
  { name: "四神聪", location: "百会前后左右各1寸", indications: ["头痛", "失眠", "健忘"] },
  { name: "印堂", location: "两眉头连线中点", indications: ["头痛", "鼻塞", "失眠"] },
  { name: "太阳", location: "眉梢与目外眦中点后1寸", indications: ["头痛", "目疾", "牙痛"] },
  { name: "安眠", location: "翳风与风池连线中点", indications: ["失眠", "心悸", "头痛"] },
  { name: "定喘", location: "大椎旁开0.5寸", indications: ["哮喘", "咳嗽", "落枕"] },
  { name: "夹脊", location: "T1-L5棘突下旁开0.5寸", indications: ["相应脏腑病", "脊柱病"] },
  { name: "腰痛点", location: "手背第2-3/4-5掌骨间", indications: ["急性腰扭伤"] },
  // 高频经穴（ST·足阳明胃经）
  { name: "足三里", location: "犊鼻下3寸，胫骨前嵴外1横指", indications: ["胃痛", "呕吐", "腹胀", "泄泻", "便秘", "水肿", "虚劳"], meridian: "足阳明胃经" },
  { name: "丰隆", location: "外踝尖上8寸，胫骨前嵴外2横指", indications: ["痰多", "咳嗽", "眩晕", "便秘"], meridian: "足阳明胃经" },
  // 高频经穴（LI·手阳明大肠经）
  { name: "合谷", location: "第1-2掌骨间，第2掌骨桡侧中点", indications: ["头痛", "齿痛", "目赤", "鼻衄", "口眼歪斜", "便秘"], meridian: "手阳明大肠经" },
  // 高频经穴（LR·足厥阴肝经）
  { name: "太冲", location: "足背第1-2跖骨结合部前方凹陷", indications: ["头痛", "眩晕", "目赤", "疝气", "月经不调", "惊风"], meridian: "足厥阴肝经" },
  // 高频经穴（PC·手厥阴心包经）
  { name: "内关", location: "腕横纹上2寸，掌长肌腱与桡侧腕屈肌腱间", indications: ["心悸", "心痛", "失眠", "胸闷", "胃痛", "呕吐"], meridian: "手厥阴心包经" },
  // 高频经穴（HT·手少阴心经）
  { name: "神门", location: "腕横纹尺侧端，尺侧腕屈肌腱桡侧", indications: ["心悸", "失眠", "健忘", "痴呆", "癫狂"], meridian: "手少阴心经" },
  // 高频经穴（UB·足太阳膀胱经·背俞）
  { name: "肺俞", location: "第3胸椎棘突下旁开1.5寸", indications: ["咳嗽", "气喘", "盗汗", "骨蒸"], meridian: "足太阳膀胱经" },
  { name: "肾俞", location: "第2腰椎棘突下旁开1.5寸", indications: ["腰痛", "耳鸣", "遗精", "阳痿", "月经不调"], meridian: "足太阳膀胱经" },
  { name: "肝俞", location: "第9胸椎棘突下旁开1.5寸", indications: ["胁痛", "黄疸", "目赤", "眩晕"], meridian: "足太阳膀胱经" },
  { name: "脾俞", location: "第11胸椎棘突下旁开1.5寸", indications: ["腹胀", "泄泻", "水肿", "黄疸"], meridian: "足太阳膀胱经" },
  { name: "心俞", location: "第5胸椎棘突下旁开1.5寸", indications: ["心悸", "失眠", "健忘", "癫狂"], meridian: "足太阳膀胱经" },
  // 高频经穴（KI·足少阴肾经）
  { name: "三阴交", location: "内踝尖上3寸，胫骨后缘", indications: ["月经不调", "遗精", "失眠", "腹胀", "泄泻", "水肿"], meridian: "足太阴脾经" },
  { name: "涌泉", location: "足底第2-3趾趾缝纹头端与足跟连线前1/3", indications: ["头痛", "失眠", "咽痛", "便秘", "小便不利"], meridian: "足少阴肾经" },
  // 高频经穴（GV·督脉）
  { name: "百会", location: "头部正中线与两耳尖连线交点", indications: ["头痛", "眩晕", "失眠", "健忘", "脱肛", "阴挺"], meridian: "督脉" },
  { name: "大椎", location: "第7颈椎棘突下", indications: ["发热", "咳嗽", "项强", "骨蒸"], meridian: "督脉" },
  { name: "命门", location: "第2腰椎棘突下", indications: ["腰痛", "阳痿", "遗精", "月经不调"], meridian: "督脉" },
  // 高频经穴（CV·任脉）
  { name: "关元", location: "脐下3寸", indications: ["遗尿", "遗精", "月经不调", "虚劳"], meridian: "任脉" },
  { name: "中脘", location: "脐上4寸", indications: ["胃痛", "呕吐", "腹胀", "泄泻", "呃逆"], meridian: "任脉" },
  { name: "气海", location: "脐下1.5寸", indications: ["虚脱", "腹痛", "泄泻", "月经不调"], meridian: "任脉" }
];

module.exports = {
  ACUPOINT_SCHEMA,
  MERIDIANS,
  WUSHU_RULES,
  EXTRA_POINTS
};
