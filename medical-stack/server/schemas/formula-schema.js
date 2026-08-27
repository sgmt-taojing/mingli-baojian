/**
 * 方剂数据结构与禁忌检测规则 V1.0
 */

const FORMULA_SCHEMA = {
  "id": "F001",
  "name": "桂枝汤",                // 方名
  "source": "伤寒论",              // 出处典籍
  "class": "解表剂",                // 分类
  "subclass": "辛温解表",          // 子分类
  "composition": [
    { "herb": "桂枝", "dosage_g": 9, "dosage_text": "三两" },
    { "herb": "芍药", "dosage_g": 9, "dosage_text": "三两" },
    { "herb": "甘草", "dosage_g": 6, "dosage_text": "炙，二两" },
    { "herb": "生姜", "dosage_g": 9, "dosage_text": "三两" },
    { "herb": "大枣", "dosage_g": 12, "dosage_text": "十二枚", "pieces": 12 }
  ],
  "indications": [
    "外感风寒表虚证",
    "头痛发热",
    "汗出恶风",
    "鼻鸣干呕"
  ],
  "tongue_pulse": {
    "tongue": "苔白不渴",
    "pulse": "脉浮缓或浮弱"
  },
  "contraindications": [
    "表实无汗者禁用",
    "温病初起禁用",
    "湿热内蕴者慎用"
  ],
  "pregnancy_safety": "慎用",      // 安全/慎用/禁用
  "pediatric_use": "可按比例减量",
  "elderly_use": "常规用量",
  "drug_interactions": [],
  "modifications": [
    { "condition": "项背强几几", "add": "葛根", "new_name": "桂枝加葛根汤" },
    { "condition": "喘", "add": "厚朴、杏仁", "new_name": "桂枝加厚朴杏子汤" }
  ]
};

// 中药数据库条目
const HERB_SCHEMA = {
  "id": "H001",
  "name_cn": "桂枝",
  "name_latin": "Cinnamomi Ramulus",
  "category": "解表药",
  "subcategory": "发散风寒药",
  "nature": "温",                  // 寒/凉/平/温/热
  "flavors": ["辛", "甘"],         // 酸/苦/甘/辛/咸/淡/涩
  "meridian_tropism": ["肺", "心", "膀胱"],
  "toxicity": "无毒",
  "dosage_range_g": "3-10",
  "contraindications": [
    "阴虚火旺者忌用",
    "孕妇慎用",
    "血热妄行者忌用"
  ],
  "functions": [
    "发汗解肌",
    "温通经脉",
    "助阳化气"
  ],
  "common_combinations": [
    { "herb": "白芍", "effect": "调和营卫" }
  ]
};

// 禁忌检测器规则
const CONTRAINDICATION_RULES = {
  // 十八反
  "eighteen_antagonisms": [
    { "a": "甘草", "antagonizes": ["甘遂", "大戟", "芫花", "海藻"] },
    { "a": "乌头", "antagonizes": ["贝母", "瓜蒌", "半夏", "白蔹", "白及"] },
    { "a": "藜芦", "antagonizes": ["人参", "沙参", "丹参", "玄参", "细辛", "芍药"] }
  ],
  // 十九畏
  "nineteen_incompatibilities": [
    { "herb": "硫黄", "fears": "朴硝" },
    { "herb": "水银", "fears": "砒霜" },
    { "herb": "狼毒", "fears": "密陀僧" },
    { "herb": "巴豆", "fears": "牵牛" },
    { "herb": "丁香", "fears": "郁金" },
    { "herb": "牙硝", "fears": "三棱" },
    { "herb": "川乌", "fears": "犀角" },
    { "herb": "草乌", "fears": "犀角" },
    { "herb": "人参", "fears": "五灵脂" },
    { "herb": "官桂", "fears": "赤石脂" }
  ],
  // 妊娠禁忌
  "pregnancy_contraindicated": [
    "巴豆", "牵牛", "大戟", "斑蝥", "商陆", "麝香",
    "三棱", "莪术", "水蛭", "虻虫", "芫花", "甘遂"
  ],
  "pregnancy_caution": [
    "桃仁", "红花", "大黄", "枳实", "附子", "干姜",
    "肉桂", "半夏", "冬葵子", "瞿麦"
  ]
};

// 四诊→方剂 相似度匹配权重
const DIAGNOSIS_FORMULA_WEIGHTS = {
  "chief_complaint": 0.30,
  "tongue": 0.25,
  "pulse": 0.20,
  "concomitant_symptoms": 0.15,
  "constitution": 0.10
};

module.exports = {
  FORMULA_SCHEMA,
  HERB_SCHEMA,
  CONTRAINDICATION_RULES,
  DIAGNOSIS_FORMULA_WEIGHTS
};
