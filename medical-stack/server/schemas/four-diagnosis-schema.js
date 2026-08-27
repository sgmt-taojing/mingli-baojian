/**
 * 五诊数据 JSON Schema V1.1
 * 舌诊 / 面诊 / 眼诊 / 唇诊 / 手诊 / 问诊 六套标准数据结构
 * 依据《中医诊断学》教材标准化
 */

const SZ_TONGUE = {
  "image_quality": {
    "natural_light": true,        // 自然光
    "no_beauty_filter": true,     // 无美颜
    "no_photo_filter": true,      // 无滤镜
    "no_makeup": true,            // 无妆容
    "no_occlusion": true,         // 无遮挡
    "no_backlight": true,         // 无逆光
    "no_blur": true,              // 无模糊
    "confidence": 0.92            // 图像质量置信度
  },
  "tongue_features": {
    "tongue_body": {
      "color": "淡红",            // 淡白/淡红/红/绛/紫/青
      "shape": "正常",            // 正常/胖大/瘦薄/齿痕/裂纹/芒刺/肿胀
      "mobility": "正常",         // 正常/歪斜/僵硬/痿软/颤动/吐弄
      "moisture": "润"            // 润/滑/燥/糙
    },
    "tongue_coating": {
      "color": "白",              // 白/黄/灰/黑
      "texture": "薄",            // 薄/厚/腻/腐/剥/无苔
      "distribution": "均匀"      // 均匀/根部/中部/舌尖/偏左/偏右
    },
    "sublingual": {
      "veins": "正常",            // 正常/怒张/瘀紫
      "color": "淡紫"             // 淡紫/紫暗/青紫
    },
    "special_signs": []           // [瘀斑, 溃疡, 齿痕]
  },
  "ocr_confidence": 0.88,        // OCR 识别置信度
  "pending_kb_reasoning": [      // 待知识库推理字段
    "tongue_body.color",
    "tongue_coating.texture"
  ],
  "rejection_reason": null       // 拒识时填写原因
};

const SZ_FACE = {
  "image_quality": { /* 同舌诊 */ },
  "face_features": {
    "complexion": "明润",         // 明润/晦暗/潮红/苍白/萎黄/黧黑
    "brightness": "有光泽",       // 有光泽/无光泽/油光
    "regions": {
      "forehead": "正常",         // 额→心
      "left_cheek": "正常",       // 左颊→肝
      "right_cheek": "正常",      // 右颊→肺
      "nose": "正常",             // 鼻→脾
      "chin": "正常",             // 下颏→肾
      "between_eyes": "正常"      // 印堂
    },
    "expression": "自然"          // 自然/萎靡/烦躁/痛苦
  },
  "ocr_confidence": 0.85,
  "pending_kb_reasoning": [
    "face_features.complexion",
    "face_features.regions"
  ],
  "rejection_reason": null
};

// 眼诊独立 schema（拆分自 SZ_FACE，子端点可单独调用）
const SZ_EYE = {
  "image_quality": { /* 同舌诊 */ },
  "eye_features": {
    "sclera": {
      "color": "白净",            // 白净/黄染/红丝/浑浊/充血
      "blood_vessels": "无",      // 无/充血/迂曲
      "pigmentation": "无"        // 无/斑痣/翳障
    },
    "eyelids": {
      "upper": "正常",            // 正常/浮肿/色黑/下垂
      "lower": "正常",            // 正常/浮肿(眼袋)/暗沉/青紫
      "edges": "正常"             // 正常/红赤/溃烂
    },
    "cornea": {
      "clarity": "清晰",          // 清晰/浑浊/云翳
      "pupil_reflection": "正常"  // 正常/散大/缩小/不等
    },
    "peri_eye": {
      "darkness": "无",           // 无/黑眼圈/青黑
      "puffiness": "无",          // 无/轻度/中度/重度
      "wrinkles": "无"            // 无/细纹/鱼尾纹
    },
    "special_signs": []           // [目赤, 目黄, 眼眦, 瞳仁]
  },
  "ocr_confidence": 0.85,
  "pending_kb_reasoning": [
    "eye_features.sclera.color",
    "eye_features.eyelids.lower"
  ],
  "rejection_reason": null
};

// 唇诊独立 schema（拆分自 SZ_FACE，参考《中医诊断学》九版教材标准）
const SZ_LIP = {
  "image_quality": { /* 同舌诊 */ },
  "lip_features": {
    "color": "淡红",              // 淡红/淡白/红/绛/紫/青/紫暗
    "moisture": "润",             // 润/滑/燥/干裂/脱屑
    "texture": "饱满",            // 饱满/瘦薄/肿胀/皲裂
    "edges": {                    // 唇边
      "color_match": true,        // 唇色与舌色一致
      "redness": "无"             // 无/潮红/绛红/紫暗
    },
    "special_signs": []           // [唇色暗, 唇周青紫, 口角糜烂]
  },
  "ocr_confidence": 0.85,
  "pending_kb_reasoning": [
    "lip_features.color",
    "lip_features.moisture"
  ],
  "rejection_reason": null
};

const SZ_HAND = {
  "image_quality": { /* 同舌诊 */ },
  "hand_features": {
    "palm_color": "淡红",          // 淡红/潮红/苍白/紫暗
    "palm_temperature": "温",      // 温/热/凉/冷
    "palm_moisture": "润",         // 润/干/汗出
    "fingernails": {
      "color": "淡红",             // 淡红/苍白/青紫/黄
      "shape": "正常",             // 正常/勺状/杵状/反甲
      "moons": "6-8个",            // 月牙数
      "ridges": "无"               // 无/纵嵴/横沟
    },
    "thenar_eminence": "正常",     // 大鱼际: 正常/萎缩/红赤
    "hypothenar_eminence": "正常"  // 小鱼际
  },
  "ocr_confidence": 0.80,
  "pending_kb_reasoning": [
    "hand_features.palm_color",
    "hand_features.fingernails"
  ],
  "rejection_reason": null
};

const SZ_INQUIRY = {
  "chief_complaint": "",           // 主诉（自然语言）
  "structured": {
    "chills_fever": null,          // 恶寒/发热/恶寒发热/但热不寒/但寒不热/寒热往来
    "sweating": null,              // 无汗/自汗/盗汗/战汗/黄汗
    "pain": {
      "location": null,            // 头痛/胸痛/胁痛/腹痛/腰痛/关节痛
      "nature": null,              // 刺痛/胀痛/隐痛/重痛/灼痛/冷痛
      "severity": null             // 1-5
    },
    "head_body": {
      "dizziness": false,
      "tinnitus": false,
      "palpitations": false,
      "chest_tightness": false
    },
    "sleep": {
      "quality": null,             // 正常/失眠/多梦/易醒/嗜睡
      "hours_per_night": null
    },
    "appetite_digestion": {
      "appetite": null,            // 正常/减退/亢进/厌食
      "taste": null,               // 正常/口苦/口淡/口甜/口酸/口咸
      "thirst": null,              // 不渴/口渴欲饮/渴不欲饮
      "bowel": null,               // 正常/便秘/便溏/腹泻/便血
      "urine": null                // 正常/清长/短赤/频数/涩痛
    },
    "emotions": {
      "primary": null,             // 喜/怒/忧/思/悲/恐/惊
      "irritability": false,
      "anxiety": false,
      "depression": false
    },
    "menstruation": {              // 女性专属
      "cycle_days": null,
      "regular": true,
      "flow": null,                // 正常/量多/量少/崩漏/闭经
      "color": null,               // 红/暗红/淡红/紫黑
      "pain": false,
      "clots": false
    }
  },
  "extracted_tcm_terms": [],       // 提取的中医术语
  "kb_relevance_score": 0,
  "urgency_level": null            // P0紧急/P1建议就医/P2健康提示/P3正常
};

const SZ_DIAGNOSIS_REPORT = {
  "patient_id": "",
  "timestamp": "",
  "five_methods": {
    "tongue": null,                // SZ_TONGUE 或拒识标记
    "face": null,                  // SZ_FACE 或拒识标记
    "eye": null,                   // SZ_EYE 或拒识标记
    "lip": null,                   // SZ_LIP 或拒识标记
    "hand": null,                  // SZ_HAND 或拒识标记
    "inquiry": null                // SZ_INQUIRY
  },
  "kb_multischool_opinions": {     // 多流派观点
    "shanghan": { "opinion": "", "reference": "", "confidence": 0 },
    "wenbing": { "opinion": "", "reference": "", "confidence": 0 },
    "fuyang": { "opinion": "", "reference": "", "confidence": 0 },
    "piwei": { "opinion": "", "reference": "", "confidence": 0 },
    "jingfang": { "opinion": "", "reference": "", "confidence": 0 }
  },
  "suggested_formula": {           // 仅供医生参考
    "name": "",
    "source": "",
    "confidence": 0,
    "contraindications": [],
    "alternatives": []
  },
  "similar_cases": [],
  "disclaimer": "本报告为辅助参考，供执业中医师结合临床判断使用，不构成诊断或处方建议。"
};

// 诊断分级标准
const URGENCY_LEVELS = {
  "P0_EMERGENCY": {
    "label": "紧急就医",
    "triggers": [
      "剧烈胸痛", "呼吸困难", "意识障碍", "大出血",
      "高热>39.5°C持续不退", "急性腹痛板状腹",
      "中风征兆(口眼歪斜/半身不遂)"
    ],
    "action": "立即就医或拨打急救电话"
  },
  "P1_SUGGEST_VISIT": {
    "label": "建议就诊",
    "triggers": [
      "持续症状>2周", "疼痛影响日常生活",
      "不明原因体重下降>5kg/月", "反复发热"
    ],
    "action": "近期安排门诊"
  },
  "P2_HEALTH_TIP": {
    "label": "健康提示",
    "triggers": [
      "轻微症状", "亚健康状态", "体质偏颇"
    ],
    "action": "生活方式调整+随访观察"
  },
  "P3_NORMAL": {
    "label": "正常",
    "triggers": [],
    "action": "保持良好生活习惯"
  }
};

module.exports = {
  SZ_TONGUE, SZ_FACE, SZ_EYE, SZ_LIP, SZ_HAND, SZ_INQUIRY,
  SZ_DIAGNOSIS_REPORT, URGENCY_LEVELS
};
