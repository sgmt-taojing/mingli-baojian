/**
 * tongue-face-json.js · 舌面诊标准化 JSON 输出工具
 * 来源：私有化综合术数+AI舌面诊智能体 全套落地规范文档 V1.1 · 2.4 节
 *
 * 强制规范：
 * 1. 5 字段固定结构，不可增减
 * 2. 置信度硬性阈值 0.75，<0.75 直接判定识别失败、拒识输出
 * 3. 仅输出客观视觉特征，禁止任何体质/病机/病症判断
 * 4. 劣质不合格图片强制拒识（模糊/带滤镜/逆光/有遮挡）
 */

// === 全局统一标签池（文档 2.3）===
const TONGUE_TAGS = {
  shape: ['正常', '胖大', '瘦薄', '齿痕', '裂纹', '歪斜'],
  color: ['淡白', '淡红', '红', '绛红', '青紫', '局部瘀斑', '瘀点'],
  coating: ['无苔', '薄白苔', '厚白苔', '白腻苔', '薄黄苔', '黄厚苔', '黄腻苔', '灰黑苔'],
  moisture: ['水润', '水滑', '正常', '偏干', '干燥', '起刺']
};

const FACE_TAGS = {
  complexion: ['面色红润', '淡白', '萎黄', '潮红', '暗沉', '青灰'],
  local: ['眼袋明显', '眼周暗沉', '面色泛红', '两颊苍白', '唇色淡', '唇色红紫', '面部色斑', '面部青筋']
};

// 唇诊标准标签池（《中医诊断学》九版教材）
const LIP_TAGS = {
  color: ['淡红', '淡白', '苍白', '红', '绛红', '紫暗', '青紫'],
  moisture: ['润', '滑', '偏干', '干燥', '干裂', '脱屑'],
  texture: ['饱满', '瘦薄', '肿胀', '皲裂']
};

// 眼诊标准标签池（《中医眼诊学》五轮学说）
const EYE_TAGS = {
  sclera_color: ['白净', '黄染', '红丝', '充血', '浑浊'],
  eyelid: ['正常', '浮肿', '色黑', '下垂', '暗沉', '青紫'],
  peri_eye: ['无', '黑眼圈', '青黑', '眼袋'],
  cornea: ['清晰', '浑浊', '云翳']
};

const CONFIDENCE_THRESHOLD = 0.75;
const MIN_IMAGE_SIZE = 200; // 最小边长（像素）

// === 5 字段固定结构（不可增减）===
const JSON_SCHEMA = {
  图像质量判定: '',
  舌诊客观特征: [],
  面诊客观特征: [],
  置信度: '',
  待知识库推理字段: '已提取客观特征，等待中医知识库多流派辨证解析'
};

// === 拒识话术（标准兜底）===
const REJECTION_RESPONSES = {
  image_quality: '图像质量不合格，请按以下标准重新拍摄：自然光、无美颜、无滤镜、无逆光、无遮挡、无妆容；舌象需完整包含舌尖至舌根，面诊正面平视。',
  low_confidence: `置信度 ${CONFIDENCE_THRESHOLD} 以下，不符合识别标准。建议：1) 重新拍摄更清晰图片；2) 调整光线与角度；3) 可咨询执业中医师面诊。`,
  invalid_format: '图片格式不支持，请上传 JPG/PNG/JPEG 格式图片。',
  no_features: '未能识别到有效舌象或面象特征，请重新拍摄。'
};

/**
 * 校验图片质量（前置质检）
 * @param {Object} imgMeta { size: {width, height}, format, fileSize }
 * @returns {{pass: boolean, reason?: string}}
 */
function checkImageQuality(imgMeta) {
  if (!imgMeta || !imgMeta.size) {
    return { pass: false, reason: REJECTION_RESPONSES.invalid_format };
  }
  const { width, height, format } = imgMeta.size;
  if (!width || !height || width < MIN_IMAGE_SIZE || height < MIN_IMAGE_SIZE) {
    return { pass: false, reason: REJECTION_RESPONSES.image_quality };
  }
  const allowedFormats = ['jpg', 'jpeg', 'png'];
  if (format && !allowedFormats.includes(format.toLowerCase())) {
    return { pass: false, reason: REJECTION_RESPONSES.invalid_format };
  }
  return { pass: true };
}

/**
 * 校验置信度
 * @param {number} confidence 0-1
 * @returns {{pass: boolean, reason?: string}}
 */
function checkConfidence(confidence) {
  if (typeof confidence !== 'number' || confidence < CONFIDENCE_THRESHOLD) {
    return { pass: false, reason: REJECTION_RESPONSES.low_confidence };
  }
  return { pass: true };
}

/**
 * 校验标签是否在全局统一标签池内
 * @param {string} type 'tongue' | 'face'
 * @param {string} category shape|color|coating|moisture|complexion|local
 * @param {string[]} tags
 * @returns {string[]} 过滤后的合法标签
 */
function validateTags(type, category, tags) {
  if (!Array.isArray(tags)) return [];
  const pool = type === 'tongue' ? TONGUE_TAGS[category] : FACE_TAGS[category];
  if (!pool) return [];
  return tags.filter(t => pool.includes(t));
}

/**
 * 构建标准 JSON 输出（5 字段固定结构）
 * @param {Object} params
 * @param {string} params.quality '合格' | '不合格'
 * @param {string[]} params.tongueFeatures 舌诊客观特征
 * @param {string[]} params.faceFeatures 面诊客观特征
 * @param {number} params.confidence 0-1
 * @returns {Object} 标准 JSON
 */
function buildOutput({ quality, tongueFeatures = [], faceFeatures = [], confidence }) {
  // 5 字段固定结构，不可增减
  const output = {
    图像质量判定: quality,
    舌诊客观特征: tongueFeatures,
    面诊客观特征: faceFeatures,
    置信度: String(confidence || 0),
    待知识库推理字段: JSON_SCHEMA.待知识库推理字段
  };
  return output;
}

/**
 * 完整流程：图片质量 → 置信度 → 构建标准 JSON
 * @param {Object} imgMeta { size, format, features: {tongue: [], face: []}, confidence }
 * @returns {Object} 标准 JSON 或拒识响应
 */
function processTongueFace(imgMeta) {
  // 第 1 关：图片质量
  const qc = checkImageQuality(imgMeta);
  if (!qc.pass) {
    return {
      图像质量判定: '不合格',
      舌诊客观特征: [],
      面诊客观特征: [],
      置信度: '0',
      待知识库推理字段: qc.reason
    };
  }

  // 第 2 关：置信度
  const cc = checkConfidence(imgMeta.confidence);
  if (!cc.pass) {
    return {
      图像质量判定: '合格',
      舌诊客观特征: [],
      面诊客观特征: [],
      置信度: String(imgMeta.confidence || 0),
      待知识库推理字段: cc.reason
    };
  }

  // 第 3 关：标签校验
  const tongueShape = validateTags('tongue', 'shape', imgMeta.features?.tongue?.shape || []);
  const tongueColor = validateTags('tongue', 'color', imgMeta.features?.tongue?.color || []);
  const tongueCoating = validateTags('tongue', 'coating', imgMeta.features?.tongue?.coating || []);
  const tongueMoisture = validateTags('tongue', 'moisture', imgMeta.features?.tongue?.moisture || []);
  const tongueFeatures = [...tongueShape, ...tongueColor, ...tongueCoating, ...tongueMoisture];

  const faceComplexion = validateTags('face', 'complexion', imgMeta.features?.face?.complexion || []);
  const faceLocal = validateTags('face', 'local', imgMeta.features?.face?.local || []);
  const faceFeatures = [...faceComplexion, ...faceLocal];

  if (tongueFeatures.length === 0 && faceFeatures.length === 0) {
    return {
      图像质量判定: '合格',
      舌诊客观特征: [],
      面诊客观特征: [],
      置信度: String(imgMeta.confidence),
      待知识库推理字段: REJECTION_RESPONSES.no_features
    };
  }

  return buildOutput({
    quality: '合格',
    tongueFeatures,
    faceFeatures,
    confidence: imgMeta.confidence
  });
}

/**
 * 校验外部输出是否符合 5 字段固定结构
 * @param {Object} obj
 * @returns {{pass: boolean, missing?: string[], extra?: string[]}}
 */
function validateOutputSchema(obj) {
  if (!obj || typeof obj !== 'object') {
    return { pass: false, missing: Object.keys(JSON_SCHEMA) };
  }
  const required = Object.keys(JSON_SCHEMA);
  const present = Object.keys(obj);
  const missing = required.filter(k => !present.includes(k));
  const extra = present.filter(k => !required.includes(k));
  return { pass: missing.length === 0 && extra.length === 0, missing, extra };
}

module.exports = {
  JSON_SCHEMA,
  TONGUE_TAGS,
  FACE_TAGS,
  LIP_TAGS,
  EYE_TAGS,
  CONFIDENCE_THRESHOLD,
  MIN_IMAGE_SIZE,
  REJECTION_RESPONSES,
  checkImageQuality,
  checkConfidence,
  validateTags,
  buildOutput,
  processTongueFace,
  validateOutputSchema
};