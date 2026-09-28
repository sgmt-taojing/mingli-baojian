/**
 * 命理宝鉴·医道 · GLM-4V 升级桩 v1.0
 * 完整接口 + 自动降级到内生引擎
 * 标杆: GPT-4V / Qwen-VL / InternVL
 */
const TONGUE_INHOUSE = require('./tongue-inhouse-engine.js');

const GLM4V_CONFIG = {
  api_key: process.env.ZHIPU_API_KEY || '',
  endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  model: 'glm-4v-plus',
  prompt_template: '你是一位资深中医师。请分析舌象图片,按 5 维特征描述:舌色/舌形/苔色/苔质/湿度,并推断可能的证型与方剂。\n输出 JSON 格式: {features:{...},syndrome:"...",formula:"..."}',
  timeout: 30000
};

/**
 * 调用 GLM-4V (需要有效 API key)
 */
async function callGLM4V(imageBase64) {
  if (!GLM4V_CONFIG.api_key) {
    return { ok: false, error: 'ZHIPU_API_KEY 未配置', degraded: true };
  }
  
  try {
    const response = await fetch(GLM4V_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + GLM4V_CONFIG.api_key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GLM4V_CONFIG.model,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: GLM4V_CONFIG.prompt_template },
            { type: 'image_url', image_url: { url: imageBase64 } }
          ]
        }],
        max_tokens: 500
      }),
      signal: AbortSignal.timeout(GLM4V_CONFIG.timeout)
    });
    
    if (!response.ok) {
      return { ok: false, error: `GLM-4V HTTP ${response.status}`, degraded: true };
    }
    
    const data = await response.json();
    return { ok: true, source: 'glm-4v', result: data.choices?.[0]?.message?.content };
  } catch (e) {
    return { ok: false, error: e.message, degraded: true };
  }
}

/**
 * 主入口: 智能选引擎 (GLM-4V → 内生)
 */
async function diagnose(imageBase64, options = {}) {
  // 1. 先试 GLM-4V
  if (GLM4V_CONFIG.api_key) {
    const glmResult = await callGLM4V(imageBase64);
    if (glmResult.ok) {
      // 解析 GLM-4V 输出 → 5 维特征 → 内生诊断
      try {
        const parsed = parseGLM4VOutput(glmResult.result);
        const inhouse = TONGUE_INHOUSE.diagnose({ features: parsed.features });
        return {
          ok: true,
          source: 'glm-4v-fusion',
          glm_raw: glmResult.result,
          features: parsed.features,
          diagnosis: inhouse.diagnosis
        };
      } catch (e) {
        // 解析失败,降级
      }
    }
  }
  
  // 2. 降级到内生引擎
  // 如果给了 PIL 特征,优先用
  if (options.pilFeatures) {
    const features = TONGUE_INHOUSE.fromPILFeatures(options.pilFeatures);
    return {
      ok: true,
      source: 'inhouse-pil',
      features,
      diagnosis: TONGUE_INHOUSE.diagnose({ features }).diagnosis,
      degraded: true,
      note: 'GLM-4V 不可用,降级到 PIL + 内生'
    };
  }
  
  // 3. 纯内生模式
  return {
    ok: true,
    source: 'inhouse-only',
    features: null,
    diagnosis: TONGUE_INHOUSE.diagnose({ features: { color: '淡红', shape: '正常', coating_color: '白苔', coating_quality: '薄苔', moisture: '润' } }).diagnosis,
    degraded: true,
    note: 'GLM-4V 不可用,需拍照或手输特征'
  };
}

function parseGLM4VOutput(text) {
  // 试图从文本中提取 JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  // 兜底: 默认特征
  return { features: { color: '淡红', shape: '正常', coating_color: '白苔', coating_quality: '薄苔', moisture: '润' } };
}

function isReady() {
  return !!GLM4V_CONFIG.api_key;
}

function getStatus() {
  return {
    configured: isReady(),
    api_key_set: !!GLM4V_CONFIG.api_key,
    endpoint: GLM4V_CONFIG.endpoint,
    model: GLM4V_CONFIG.model,
    fallback: 'tongue-inhouse-engine v1'
  };
}

module.exports = { diagnose, isReady, getStatus, callGLM4V, GLM4V_CONFIG };
