/**
 * region-config.js — 出海合规分层配置（按地区自动切换免责/方剂/措辞策略）
 *
 * 地区代码：
 *   cn  — 中国大陆（完整版：命理+中医全功能）
 *   sg  — 新加坡/东南亚华人（命理+TCM wellness，需 PDPA + 文化参考免责）
 *   jp  — 日本（四柱推命+漢方，需薬機法 + 健康参考免责）
 *   us  — 美国（Eastern Astrology + Wellness，去诊断/处方，FDA wellness）
 *   eu  — 欧洲（Eastern Astrology + Wellness，GDPR + 去诊断）
 */
'use strict';

const REGION_CONFIG = {
  cn: {
    name: '中国大陆',
    locale: 'zh-CN',
    features: {
      fortuneTelling: true,      // 命理排盘
      tcmDiagnosis: true,        // 中医辨证
      prescription: true,        // 方剂建议
      aiVision: true,            // AI 视觉诊断
      autopilot: true,           // 无人化自主
      voiceInput: true,          // 语音输入
    },
    disclaimer: {
      level: 'light',            // 轻量免责
      text: '传统文化参考，不构成专业建议',
      showOnEveryPage: false,
    },
    terminology: 'standard-zh',  // 标准中文术语
    dataPrivacy: { law: 'PIPL', consentRequired: false },
  },

  sg: {
    name: 'Singapore / SEA',
    locale: 'en-SG',
    features: {
      fortuneTelling: true,
      tcmDiagnosis: true,
      prescription: true,        // 保留方剂（标注需注册中医师）
      aiVision: true,
      autopilot: true,
      voiceInput: true,
    },
    disclaimer: {
      level: 'medium',
      text: 'For cultural education and wellness reference only. Not a substitute for professional medical advice.',
      showOnEveryPage: true,
      tcmNote: 'Formula suggestions require review by a licensed TCM practitioner registered with the TCM Practitioners Board.',
    },
    terminology: 'who-en',       // WHO 标准英译
    dataPrivacy: { law: 'PDPA', consentRequired: true, dataLocalization: false },
  },

  jp: {
    name: '日本',
    locale: 'ja-JP',
    features: {
      fortuneTelling: true,      // 四柱推命
      tcmDiagnosis: 'kampo',     // 漢方知識（不诊断）
      prescription: false,       // 不出方剂（薬機法）
      aiVision: true,            // AI 視覚（改"体质分析"）
      autopilot: false,          // 不无人化（日本厳格）
      voiceInput: true,
    },
    disclaimer: {
      level: 'strict',
      text: '健康参考として提供されています。医療行為ではありません。',
      showOnEveryPage: true,
      pharmaceuticalLaw: '薬機法遵守：効果・効能の表示は行いません。',
    },
    terminology: 'kampo-ja',     // 漢方术语
    dataPrivacy: { law: 'APPI', consentRequired: true, dataLocalization: false },
  },

  us: {
    name: 'United States',
    locale: 'en-SG',             // 先用 en-SG（后续出 en-US）
    features: {
      fortuneTelling: 'astrology', // 去命理化 → Eastern Astrology
      tcmDiagnosis: 'wellness',    // 体质/养生（不诊断）
      prescription: false,         // 不出方剂（FDA）
      aiVision: 'wellness-scan',   // 改"Wellness Scan"
      autopilot: false,            // 不无人化
      voiceInput: true,
    },
    disclaimer: {
      level: 'maximum',
      text: 'For entertainment and cultural education purposes only. This is not a medical device and does not provide diagnosis or treatment.',
      showOnEveryPage: true,
      fdaNote: 'These statements have not been evaluated by the FDA.',
      aiDisclosure: 'AI-assisted content. Results should be reviewed by qualified professionals.',
    },
    terminology: 'fda-en',       // FDA 合规术语
    dataPrivacy: { law: 'HIPAA/state', consentRequired: true, dataLocalization: false },
  },

  eu: {
    name: 'Europe',
    locale: 'en-SG',
    features: {
      fortuneTelling: 'astrology',
      tcmDiagnosis: 'wellness',
      prescription: false,
      aiVision: 'wellness-scan',
      autopilot: false,
      voiceInput: true,
    },
    disclaimer: {
      level: 'maximum',
      text: 'For entertainment and cultural education purposes only.',
      showOnEveryPage: true,
      gdprNotice: 'Your data is processed in accordance with GDPR. You have the right to access, rectify, and delete your data.',
      aiDisclosure: 'AI-assisted content disclosed per EU AI Act.',
    },
    terminology: 'who-en',
    dataPrivacy: { law: 'GDPR', consentRequired: true, dataLocalization: true, rightToBeForgotten: true },
  },

  kr: {
    name: '한국 (Korea)',
    locale: 'ko-KR',
    features: {
      fortuneTelling: true,
      tcmDiagnosis: 'hanbang',
      prescription: false,
      aiVision: true,
      autopilot: false,
      voiceInput: true,
    },
    disclaimer: {
      level: 'medium',
      text: '전통 의학 문화 참고용입니다. 전문의 상담을 권장합니다.',
      showOnEveryPage: true,
    },
    terminology: 'hanbang-ko',
    dataPrivacy: { law: 'PIPA', consentRequired: true, dataLocalization: false },
  },

  vn: {
    name: 'Việt Nam',
    locale: 'vi-VN',
    features: {
      fortuneTelling: true,
      tcmDiagnosis: true,
      prescription: true,
      aiVision: true,
      autopilot: false,
      voiceInput: true,
    },
    disclaimer: {
      level: 'medium',
      text: 'Tham khảo văn hóa y học cổ truyền. Không thay thế tư vấn y tế chuyên nghiệp.',
      showOnEveryPage: true,
    },
    terminology: 'tcm-vi',
    dataPrivacy: { law: 'PDPD', consentRequired: true, dataLocalization: false },
  },
};

/** 获取当前地区配置（从环境变量或 localStorage 读取） */
function getRegion() {
  const stored = (typeof localStorage !== 'undefined' && localStorage.getItem('mbj_region')) || null;
  const env = (typeof process !== 'undefined' && process.env && process.env.MBJ_REGION) || null;
  const code = stored || env || 'cn';
  return { code, config: REGION_CONFIG[code] || REGION_CONFIG.cn };
}

/** 设置地区（前端） */
function setRegion(code) {
  if (!REGION_CONFIG[code]) return;
  if (typeof localStorage !== 'undefined') localStorage.setItem('mbj_region', code);
  if (typeof document !== 'undefined') document.dispatchEvent(new CustomEvent('region-changed', { detail: { code } }));
}

/** 按地区过滤功能（前端 UI 开关 + 后端 API 网关共用） */
function filterFeatures(regionCode) {
  const cfg = REGION_CONFIG[regionCode] || REGION_CONFIG.cn;
  return {
    showFortune: !!cfg.features.fortuneTelling,
    showTCM: !!cfg.features.tcmDiagnosis,
    showPrescription: cfg.features.prescription === true,
    showAIVision: !!cfg.features.aiVision,
    showAutopilot: cfg.features.autopilot === true,
    showVoice: !!cfg.features.voiceInput,
    disclaimerText: cfg.disclaimer.text,
    disclaimerLevel: cfg.disclaimer.level,
    showDisclaimerEveryPage: cfg.disclaimer.showOnEveryPage,
    terminology: cfg.terminology,
    privacyLaw: cfg.dataPrivacy.law,
  };
}

// CommonJS + 浏览器双兼容
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { REGION_CONFIG, getRegion, setRegion, filterFeatures };
}
if (typeof window !== 'undefined') {
  window.RegionConfig = { REGION_CONFIG, getRegion, setRegion, filterFeatures };
}
