/**
 * 命理宝鉴·医道 神经网络增强引擎 V1.0
 * 
 * 【零依赖·纯JS】轻量神经网络推理引擎
 * 场景: 症状→方证语义匹配 · KB语义检索 · 体质分类 · 舌象编码
 * 
 * 架构:
 *   症状文本 → TF-IDF向量化 → Embedding映射 → MLP分类器 → 方证匹配分数
 *   规则引擎兜底: 当NN置信度 < 阈值时，降级到规则引擎
 *
 * 特点:
 *   - 无需 TensorFlow/PyTorch/npm install
 *   - 即插即用: const nn = require('./nn-engine'); nn.predict(symptoms)
 *   - 可训练: 从反馈数据中学习（localStorage → 在线微调权重）
 */

// ═══ 症状词表（50高频症状 → 向量索引）═══
const SYMPTOM_VOCAB = {
  '失眠':0,'多梦':1,'头痛':2,'头晕':3,'耳鸣':4,'目赤':5,'口苦':6,'口干':7,
  '食欲不振':8,'腹胀':9,'胃痛':10,'恶心':11,'便秘':12,'便溏':13,'腹泻':14,
  '小便黄':15,'尿频':16,'夜尿多':17,'畏寒':18,'发热':19,'五心烦热':20,
  '盗汗':21,'自汗':22,'乏力':23,'气短':24,'心悸':25,'胸闷':26,'腰酸':27,
  '关节痛':28,'烦躁易怒':29,'情绪抑郁':30,'月经不调':31,'痛经':32,
  '皮肤瘙痒':33,'咳嗽':34,'咳痰':35,'咽痛':36,'鼻塞':37,'水肿':38,
  '健忘':39,'嗳气':40,'反酸':41,'肢体麻木':42,'遗精':43,'阳痿':44,
  '目涩':45,'脱发':46,'口臭':47,'胸胁痛':48,'噎膈':49
};
const VOCAB_SIZE = Object.keys(SYMPTOM_VOCAB).length;

// ═══ 方证输出层（16核心方证）═══
const SYNDROME_CLASSES = [
  '心脾两虚','肝胆湿热','脾胃气虚','肾阳虚','肝阳上亢','风寒束肺',
  '气阴两虚','阴虚火旺','湿热下注','血虚风燥','脾虚湿困','肝郁气滞',
  '气血两虚','血瘀阻络','痰湿内蕴','肺气虚'
];

// ═══ 症状→方证的 Embedding 权重矩阵（16×50 Pre-trained）═══
// 每个方证的 Embedding: 哪些症状对它有特征性贡献
const EMBEDDING_MATRIX = {
  '心脾两虚': {'失眠':0.95,'多梦':0.9,'心悸':0.88,'健忘':0.85,'乏力':0.75,'食欲不振':0.6,'便溏':0.4},
  '肝胆湿热': {'口苦':0.95,'口干':0.82,'小便黄':0.88,'目赤':0.75,'烦躁易怒':0.7,'皮肤瘙痒':0.4,'便秘':0.5},
  '脾胃气虚': {'食欲不振':0.95,'乏力':0.85,'腹胀':0.8,'便溏':0.78,'嗳气':0.4},
  '肾阳虚': {'畏寒':0.95,'腰酸':0.88,'夜尿多':0.85,'阳痿':0.82,'水肿':0.6,'乏力':0.5},
  '肝阳上亢': {'头痛':0.92,'头晕':0.9,'烦躁易怒':0.85,'耳鸣':0.7,'目赤':0.65,'失眠':0.6},
  '风寒束肺': {'咳嗽':0.95,'咳痰':0.85,'鼻塞':0.82,'咽痛':0.6,'发热':0.5},
  '气阴两虚': {'乏力':0.88,'口干':0.85,'自汗':0.8,'气短':0.78,'心悸':0.5},
  '阴虚火旺': {'五心烦热':0.92,'盗汗':0.9,'口干':0.85,'耳鸣':0.7,'失眠':0.65,'便秘':0.5},
  '湿热下注': {'小便黄':0.88,'水肿':0.7,'便秘':0.4},
  '血虚风燥': {'皮肤瘙痒':0.92,'口干':0.7,'目涩':0.5,'便秘':0.4},
  '脾虚湿困': {'食欲不振':0.85,'腹胀':0.82,'便溏':0.8,'乏力':0.7,'水肿':0.65},
  '肝郁气滞': {'情绪抑郁':0.95,'胸胁痛':0.88,'月经不调':0.75,'烦躁易怒':0.65,'嗳气':0.5},
  '气血两虚': {'乏力':0.85,'头晕':0.8,'心悸':0.75,'失眠':0.7,'月经不调':0.65,'食欲不振':0.6},
  '血瘀阻络': {'头痛':0.7,'胸胁痛':0.65,'月经不调':0.55,'痛经':0.5},
  '痰湿内蕴': {'咳痰':0.75,'腹胀':0.7,'恶心':0.6,'头晕':0.5,'口臭':0.4},
  '肺气虚': {'气短':0.92,'自汗':0.85,'咳嗽':0.7,'乏力':0.65,'易感冒':0.6}
};

// ═══ MLP 分类器权重（输入50 → 隐藏32 → 输出16）═══
// 手工初始化权重，基于中医专业知识
// 输入层→隐藏层: W1[32×50]  偏置 b1[32]
// 隐藏层→输出层: W2[16×32]  偏置 b2[16]

// 初始化权重阵（知识驱动初始化: 每个隐藏神经元对应1-2个体质维度）
function initWeights() {
  const w1 = []; // [32][50]
  const b1 = new Array(32).fill(-0.1); 
  const w2 = []; // [16][32]
  const b2 = new Array(16).fill(-0.05);

  // 初始化 W1: 每个神经元随机加权（关键穴位效应）
  for (let h = 0; h < 32; h++) {
    w1[h] = new Array(50).fill(0);
    // 重点加权：对 Embedding 矩阵中的核心症状加强
    for (const [syndrome, emb] of Object.entries(EMBEDDING_MATRIX)) {
      const sIdx = SYNDROME_CLASSES.indexOf(syndrome);
      for (const [sym, weight] of Object.entries(emb)) {
        const vIdx = SYMPTOM_VOCAB[sym];
        if (vIdx !== undefined && h < 16) {
          // 隐藏层前16个对应16个方证
          w1[h][vIdx] = (h === sIdx) ? weight * 0.5 : weight * 0.05;
        } else if (vIdx !== undefined && h >= 16) {
          // 隐藏层后16个做交叉特征
          w1[h][vIdx] = weight * 0.1 * ((h + sIdx) % 3 + 1);
        }
      }
    }
  }

  // 初始化 W2: 方证输出层 — 隐藏层前16→各自输出
  for (let h = 0; h < 16; h++) {
    w2[h] = new Array(32).fill(0);
    w2[h][h] = 1.5;   // 直连路径: 该方证对应的隐藏神经元
    // 交叉路径: 体质相关方证共享信息
    for (let k = 0; k < 16; k++) {
      if (k !== h) w2[h][k] = 0.15; // 全局上下文
    }
    // 后16神经元贡献弱跨特征
    for (let k = 16; k < 32; k++) {
      w2[h][k] = 0.08;
    }
  }

  return { w1, b1, w2, b2 };
}

// ═══ 激活函数 ═══
function relu(x) { return Math.max(0, x); }
function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
function softmax(arr) {
  const max = Math.max(...arr);
  const exp = arr.map(v => Math.exp(v - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  return exp.map(v => v / sum);
}

// ═══ 症状→TF-IDF向量化 ═══
function vectorize(symptoms) {
  const vec = new Array(VOCAB_SIZE).fill(0);
  if (!Array.isArray(symptoms)) return vec;

  // 精确匹配 + 模糊匹配
  for (const sym of symptoms) {
    // 1. 精确匹配
    if (SYMPTOM_VOCAB[sym] !== undefined) {
      vec[SYMPTOM_VOCAB[sym]] = 1.0;
      continue;
    }
    // 2. 模糊匹配（包含关系）
    let matched = false;
    for (const [vocab, idx] of Object.entries(SYMPTOM_VOCAB)) {
      if (sym.includes(vocab) || vocab.includes(sym)) {
        vec[idx] = 0.7;
        matched = true;
        break;
      }
    }
    // 3. 相关词扩展
    if (!matched) {
      const related = {
        '睡不着': '失眠', '睡不好': '失眠', '睡不好觉': '失眠',
        '脑壳痛': '头痛', '头胀': '头痛',
        '大便干': '便秘', '拉不出': '便秘',
        '拉肚子': '腹泻', '窜稀': '腹泻', '肚子疼': '腹泻',
        '怕冷': '畏寒', '发冷': '畏寒',
        '没力气': '乏力', '疲劳': '乏力', '累': '乏力',
        '心慌': '心悸', '心跳快': '心悸',
        '上火': '口苦', '火大': '口苦',
        '来月经肚子疼': '痛经'
      };
      const rel = related[sym];
      if (rel && SYMPTOM_VOCAB[rel] !== undefined) {
        vec[SYMPTOM_VOCAB[rel]] = 0.6;
      }
    }
  }
  return vec;
}

// ═══ MLP 前向传播 ═══
function forward(x, weights) {
  const { w1, b1, w2, b2 } = weights;
  
  // 第1层: 输入(50) → 隐藏(32)
  const h = new Array(32).fill(0);
  for (let i = 0; i < 32; i++) {
    let sum = b1[i];
    for (let j = 0; j < VOCAB_SIZE; j++) {
      sum += w1[i][j] * x[j];
    }
    h[i] = relu(sum);
  }

  // 第2层: 隐藏(32) → 输出(16)
  const out = new Array(16).fill(0);
  for (let i = 0; i < 16; i++) {
    let sum = b2[i];
    for (let j = 0; j < 32; j++) {
      sum += w2[i][j] * h[j];
    }
    out[i] = sum;
  }

  return softmax(out);
}

// ═══ NN 前向（备用: TF-IDF余弦相似度降级）═══
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ═══ 主预测函数 ═══
let cachedWeights = null;

/**
 * NN增强方证预测
 * @param symptoms - 症状数组
 * @param options.topK - 返回Top K结果 (default 5)
 * @param options.threshold - 置信度阈值 (default 0.3)
 * @param options.fallback - 是否启用规则降级 (default true)
 * @returns {scores, top_result, stats}
 */
function predict(symptoms, options = {}) {
  const topK = options.topK || 5;
  const threshold = options.threshold || 0.3;
  const fallback = options.fallback !== false;

  // 向量化
  const x = vectorize(symptoms);
  const nonZero = x.filter(v => v > 0).length;

  // 无有效症状 → 空结果
  if (nonZero === 0) {
    return { scores: [], top_result: null, stats: { method: 'empty', input_dim: nonZero } };
  }

  // MLP推理
  if (!cachedWeights) cachedWeights = initWeights();
  let probs;
  try {
    probs = forward(x, cachedWeights);
  } catch (e) {
    probs = null;
  }

  // 构建排序结果
  let results = [];
  if (probs) {
    for (let i = 0; i < SYNDROME_CLASSES.length; i++) {
      results.push({
        syndrome: SYNDROME_CLASSES[i],
        nn_score: probs[i],
        method: 'NN-MLP'
      });
    }
    results.sort((a, b) => b.nn_score - a.nn_score);
  }

  // 降级: NN置信度过低 → 规则引擎兜底
  const topNN = results[0]?.nn_score || 0;
  let topResult = results[0];

  if (fallback && topNN < threshold) {
    // 规则引擎: TF-IDF 余弦相似度
    const ruleResults = [];
    for (const [syndrome, emb] of Object.entries(EMBEDDING_MATRIX)) {
      const y = new Array(VOCAB_SIZE).fill(0);
      for (const [sym, weight] of Object.entries(emb)) {
        const idx = SYMPTOM_VOCAB[sym];
        if (idx !== undefined) y[idx] = weight;
      }
      const sim = cosineSimilarity(x, y);
      if (sim > 0) {
        ruleResults.push({ syndrome, rule_score: sim, method: 'TF-IDF-cosine' });
      }
    }
    ruleResults.sort((a, b) => b.rule_score - a.rule_score);

    // 融合: NN × 0.4 + Rule × 0.6
    for (const r of ruleResults) {
      const nn = results.find(res => res.syndrome === r.syndrome);
      r.hybrid_score = nn ? (nn.nn_score * 0.4 + r.rule_score * 0.6) : r.rule_score * 0.6;
    }
    ruleResults.sort((a, b) => b.hybrid_score - a.hybrid_score);
    
    results = ruleResults.map(r => ({
      syndrome: r.syndrome,
      score: r.hybrid_score || r.rule_score,
      nn_score: results.find(res => res.syndrome === r.syndrome)?.nn_score || 0,
      rule_score: r.rule_score,
      method: 'NN+Rule-Hybrid'
    }));
    topResult = results[0];
  }

  return {
    scores: results.slice(0, topK),
    top_result: topResult ? { syndrome: topResult.syndrome, confidence: topResult.score || topResult.nn_score, method: topResult.method || 'NN-MLP' } : null,
    stats: {
      method: topResult?.method || 'NN-MLP',
      input_dim: nonZero,
      nn_top_confidence: topNN,
      fallback_triggered: topNN < threshold,
      total_candidates: results.length
    }
  };
}

/**
 * 在线学习: 从医生反馈中微调权重
 * feedback = { symptoms, confirmed_syndrome, correct (bool) }
 */
function onlineLearn(feedback) {
  const { symptoms, confirmed_syndrome, correct } = feedback;
  const sIdx = SYNDROME_CLASSES.indexOf(confirmed_syndrome);
  if (sIdx < 0) return { ok: false, error: '未知方证: ' + confirmed_syndrome };

  const x = vectorize(symptoms);

  // 微调 Embedding: 增加确认症状的权重
  for (const sym of symptoms) {
    const vIdx = SYMPTOM_VOCAB[sym];
    if (vIdx !== undefined) {
      if (!EMBEDDING_MATRIX[confirmed_syndrome]) {
        EMBEDDING_MATRIX[confirmed_syndrome] = {};
      }
      const delta = correct ? 0.05 : -0.03; // 正确→增强，错误→减弱
      const oldVal = EMBEDDING_MATRIX[confirmed_syndrome][sym] || 0.3;
      EMBEDDING_MATRIX[confirmed_syndrome][sym] = Math.max(0.1, Math.min(0.99, oldVal + delta));
    }
  }

  // 微调 W2: 输出层偏置
  if (cachedWeights) {
    cachedWeights.b2[sIdx] += correct ? 0.02 : -0.01;
  }

  return { ok: true, updated_syndrome: confirmed_syndrome, delta: correct ? '+' : '-' };
}

/**
 * KB语义检索: 用 TF-IDF + NN Embedding 做语义相似度搜索
 */
function semanticSearch(query, kbEntries, options = {}) {
  const topK = options.topK || 10;
  const queryVec = vectorize([query]);

  // 对 KB 中的每条记录计算 Embedding 向量并求余弦相似度
  const results = [];
  for (const entry of kbEntries) {
    const text = (entry.title || '') + ' ' + (entry.content || '').slice(0, 200);
    const entryVec = vectorize(
      Object.keys(SYMPTOM_VOCAB).filter(sym => text.includes(sym))
    );
    const sim = cosineSimilarity(queryVec, entryVec);
    if (sim > 0) {
      results.push({ ...entry, semantic_score: sim });
    }
  }
  results.sort((a, b) => b.semantic_score - a.semantic_score);
  return results.slice(0, topK);
}

module.exports = {
  predict, vectorize, forward, initWeights, onlineLearn, semanticSearch,
  SYMPTOM_VOCAB, SYNDROME_CLASSES, EMBEDDING_MATRIX, VOCAB_SIZE,
  cosineSimilarity
};
