/**
typeof window.escapeHtml === "function" || (window.escapeHtml = function(s) { if(!s) return ""; return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); });
 * AI智能解读模块 - 易道智鉴
 * 在规则推演基础上叠加AI能力，提供自然语言深度解读
 * 
 * 功能：
 * 1. AI深度解读 - 对排盘结果进行自然语言解读
 * 2. AI智能问答 - 针对排盘结果提问
 * 3. AI报告生成 - 生成完整命理报告
 * 
 * API: https://api.g2claw.com/v1/chat/completions
 * 模型: auto
 */

// ════════════════════════════════════════════════════════════════
//  API调用封装
// ════════════════════════════════════════════════════════════════

/**
 * 统一调用 g2claw API
 * @param {Array} messages - OpenAI格式消息数组
 * @param {Object} options - 可选参数 {max_tokens, temperature}
 * @returns {Promise<string>} AI回复文本
 */
async function callG2ClawAPI(messages, options) {
  var opts = options || {};
  var maxTokens = opts.max_tokens || 2000;
  var temperature = opts.temperature || 0.7;

  var controller = new AbortController();
  var timeoutId = setTimeout(function() { controller.abort(); }, 30000);

  try {
    var response = await fetch('https://api.g2claw.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer b720753afe0845f5a7611a1b56b6d77c',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'auto',
        messages: messages,
        max_tokens: maxTokens,
        temperature: temperature
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('API返回状态码: ' + response.status);
    }

    var data = await response.json();
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('API返回数据格式异常');
    }

    return data.choices[0].message.content;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('AI解读请求超时（30秒），请稍后重试');
    }
    throw err;
  }
}

// ════════════════════════════════════════════════════════════════
//  Prompt构建
// ════════════════════════════════════════════════════════════════

/**
 * 获取三元九运上下文文本
 */
function _aiGetSanyuanContext() {
  try {
    var year = new Date().getFullYear();
    var yy = getCurrentYuanYun(year);
    var data = yy.data || {};
    var ctx = '【三元九运框架】\n';
    ctx += '当前大运：' + (yy.name || '九紫离火运') + ' (' + (yy.periodInThisCycle || '2024-2043') + ')\n';
    ctx += '五行：' + (yy.wuxing || '火') + ' | 卦象：' + (yy.gua || '离') + ' | 方位：' + (yy.direction || '正南') + '\n';
    ctx += '星曜：' + (yy.star || '九紫右弼') + ' | 元：' + (yy.yuan || '下元') + ' | 第' + (yy.yunYear || 1) + '年/20年\n';
    if (data.characteristics) ctx += '特征：' + data.characteristics + '\n';
    if (data.industries) ctx += '旺运行业：' + data.industries + '\n';
    if (data.social) ctx += '社会趋势：' + data.social + '\n';
    if (data.health) ctx += '健康关注：' + data.health + '\n';
    if (data.favorable) ctx += '顺势而为：' + data.favorable + '\n';
    if (data.unfavorable) ctx += '需防陷阱：' + data.unfavorable + '\n';
    return ctx;
  } catch (e) {
    return '【三元九运框架】\n当前处于九紫离火运(2024-2043)，离卦为火，主文化、科技、女性、光明。';
  }
}

/**
 * 获取排盘数据文本
 * @param {string} type - 排盘类型
 * @param {Object} data - 排盘数据
 */
function _aiGetPaipanDataText(type, data) {
  if (!data) return '排盘数据未获取到';

  var text = '';
  try {
    switch (type) {
      case 'bazi':
        text += '【八字排盘数据】\n';
        if (data.name) text += '姓名：' + data.name + '\n';
        if (data.gender) text += '性别：' + (data.gender === 'male' ? '男' : '女') + '\n';
        if (data.birthStr) text += '出生：' + data.birthStr + '\n';
        if (data.fourPillars) {
          text += '四柱：';
          if (data.fourPillars.year) text += '年柱 ' + data.fourPillars.year.gan + data.fourPillars.year.zhi + ' ';
          if (data.fourPillars.month) text += '月柱 ' + data.fourPillars.month.gan + data.fourPillars.month.zhi + ' ';
          if (data.fourPillars.day) text += '日柱 ' + data.fourPillars.day.gan + data.fourPillars.day.zhi + ' ';
          if (data.fourPillars.hour) text += '时柱 ' + data.fourPillars.hour.gan + data.fourPillars.hour.zhi;
          text += '\n';
        }
        if (data.dayMaster) text += '日主：' + data.dayMaster + '\n';
        if (data.dayMasterElement) text += '日主五行：' + data.dayMasterElement + '\n';
        if (data.tenGods) text += '十神：' + JSON.stringify(data.tenGods) + '\n';
        if (data.geju) text += '格局：' + data.geju + '\n';
        if (data.shensha && data.shensha.length) text += '神煞：' + data.shensha.join('、') + '\n';
        if (data.changsheng) text += '长生阶段：' + JSON.stringify(data.changsheng) + '\n';
        if (data.dayun && data.dayun.length) {
          text += '大运：';
          for (var i = 0; i < Math.min(data.dayun.length, 8); i++) {
            var dy = data.dayun[i];
            text += (dy.ganzhi || dy.name || '') + '(' + (dy.startAge || dy.age || '') + '岁) ';
          }
          text += '\n';
        }
        if (data.wuxing) text += '五行分布：' + JSON.stringify(data.wuxing) + '\n';
        if (data.xiyong) text += '喜用神：' + (typeof data.xiyong === 'string' ? data.xiyong : JSON.stringify(data.xiyong)) + '\n';
        if (data.nayin) text += '纳音：' + (typeof data.nayin === 'string' ? data.nayin : JSON.stringify(data.nayin)) + '\n';
        break;

      case 'qimen':
        text += '【奇门遁甲排盘数据】\n';
        if (data.time) text += '起局时间：' + data.time + '\n';
        if (data.dunType) text += '遁类型：' + data.dunType + '\n';
        if (data.ju) text += '局数：' + data.ju + '\n';
        if (data.palaces) {
          text += '九宫信息：\n';
          for (var p in data.palaces) {
            var pal = data.palaces[p];
            text += '  ' + p + ': 天盘' + (pal.tianPan || '') + ' 地盘' + (pal.diPan || '') + ' 八门' + (pal.bamen || '') + ' 九星' + (pal.jiuxing || '') + ' 八神' + (pal.bashen || '') + '\n';
          }
        }
        if (data.geju) text += '格局：' + (typeof data.geju === 'string' ? data.geju : JSON.stringify(data.geju)) + '\n';
        if (data.kongwang) text += '空亡：' + data.kongwang + '\n';
        if (data.maXing) text += '马星：' + data.maXing + '\n';
        break;

      case 'ziwei':
        text += '【紫微斗数排盘数据】\n';
        if (data.name) text += '姓名：' + data.name + '\n';
        if (data.gender) text += '性别：' + (data.gender === 'male' ? '男' : '女') + '\n';
        if (data.birthStr) text += '出生：' + data.birthStr + '\n';
        if (data.mingGong) text += '命宫：' + (typeof data.mingGong === 'string' ? data.mingGong : JSON.stringify(data.mingGong)) + '\n';
        if (data.shenGong) text += '身宫：' + (typeof data.shenGong === 'string' ? data.shenGong : JSON.stringify(data.shenGong)) + '\n';
        if (data.mainStars) text += '主要星曜：' + JSON.stringify(data.mainStars) + '\n';
        if (data.palaces) {
          text += '十二宫：\n';
          for (var pg in data.palaces) {
            text += '  ' + pg + ': ' + JSON.stringify(data.palaces[pg]) + '\n';
          }
        }
        if (data.daguan) text += '大限：' + JSON.stringify(data.daguan) + '\n';
        break;

      case 'meihua':
        text += '【梅花易数排盘数据】\n';
        if (data.time) text += '起卦时间：' + data.time + '\n';
        if (data.bengua) text += '本卦：' + data.bengua + '\n';
        if (data.biangua) text += '变卦：' + data.biangua + '\n';
        if (data.hugua) text += '互卦：' + data.hugua + '\n';
        if (data.cuagua) text += '错卦：' + data.cuagua + '\n';
        if (data.zonggua) text += '综卦：' + data.zonggua + '\n';
        if (data.dongyao) text += '动爻：' + data.dongyao + '\n';
        if (data.tiganDizhi) text += '天干地支：' + data.tiganDizhi + '\n';
        if (data.tiYong) text += '体用：' + data.tiYong + '\n';
        if (data.wuxing) text += '五行：' + JSON.stringify(data.wuxing) + '\n';
        break;

      case 'liuren':
        text += '【大六壬排盘数据】\n';
        if (data.time) text += '起课时间：' + data.time + '\n';
        if (data.rigan) text += '日干：' + data.rigan + '\n';
        if (data.rizhi) text += '日支：' + data.rizhi + '\n';
        if (data.chuMen) text += '初传：' + data.chuMen + '\n';
        if (data.zhongMen) text += '中传：' + data.zhongMen + '\n';
        if (data.moMen) text += '末传：' + data.moMen + '\n';
        if (data.tianJiang) text += '天将：' + JSON.stringify(data.tianJiang) + '\n';
        if (data.keTi) text += '课体：' + data.keTi + '\n';
        if (data.geju) text += '格局：' + data.geju + '\n';
        break;

      case 'huajie':
        text += '【开运化解数据】\n';
        if (data.name) text += '姓名：' + data.name + '\n';
        if (data.issue) text += '化解事项：' + data.issue + '\n';
        if (data.bazi) text += '八字信息：' + JSON.stringify(data.bazi) + '\n';
        if (data.suggestions) text += '化解建议：' + JSON.stringify(data.suggestions) + '\n';
        if (data.fangshui) text += '风水调整：' + data.fangshui + '\n';
        if (data.peishi) text += '佩饰建议：' + data.peishi + '\n';
        if (data.fangwei) text += '方位建议：' + data.fangwei + '\n';
        if (data.shuzi) text += '幸运数字：' + data.shuzi + '\n';
        if (data.yanse) text += '幸运颜色：' + data.yanse + '\n';
        break;

      case 'lifeplan':
        text += '【人生规划数据】\n';
        if (data.name) text += '姓名：' + data.name + '\n';
        if (data.bazi) text += '八字信息：' + JSON.stringify(data.bazi) + '\n';
        if (data.career) text += '事业建议：' + JSON.stringify(data.career) + '\n';
        if (data.marriage) text += '婚姻建议：' + JSON.stringify(data.marriage) + '\n';
        if (data.health) text += '健康建议：' + JSON.stringify(data.health) + '\n';
        if (data.hobbies) text += '兴趣爱好：' + JSON.stringify(data.hobbies) + '\n';
        if (data.cities) text += '宜居城市：' + JSON.stringify(data.cities) + '\n';
        if (data.study) text += '学习方向：' + JSON.stringify(data.study) + '\n';
        if (data.timing) text += '时机建议：' + JSON.stringify(data.timing) + '\n';
        break;

      case 'jiazi':
        text += '【六十甲子周期数据】\n';
        if (data.birthYear) text += '出生年份：' + data.birthYear + '\n';
        if (data.jiazi) text += '甲子定位：' + data.jiazi + '\n';
        if (data.cycle) text += '周期信息：' + JSON.stringify(data.cycle) + '\n';
        if (data.yunshi) text += '运势评级：' + JSON.stringify(data.yunshi) + '\n';
        if (data.keyYears) text += '关键年份：' + JSON.stringify(data.keyYears) + '\n';
        if (data.nayin) text += '纳音五行：' + data.nayin + '\n';
        if (data.forecast) text += '长期预测：' + data.forecast + '\n';
        break;

      default:
        text += '【排盘数据】\n' + JSON.stringify(data) + '\n';
    }
  } catch (e) {
    text += '排盘数据解析异常，使用原始数据：\n' + (typeof data === 'string' ? data : JSON.stringify(data)) + '\n';
  }

  return text;
}

/**
 * 收集当前排盘数据（从DOM和全局变量中提取）
 */
function _aiCollectPaipanData(type) {
  try {
    switch (type) {
      case 'bazi':
        var baziEl = document.getElementById('baziResult');
        if (baziEl) {
          var data = {};
          data.name = (document.getElementById('baziNameOut') || {}).textContent || '';
          data.birthStr = (document.getElementById('baziMetaOut') || {}).textContent || '';
          // 从页面提取四柱信息
          var pillarEls = baziEl.querySelectorAll('.pillar-chart .pillar-gz, .pillar-cell .gz');
          if (pillarEls.length >= 4) {
            data.fourPillars = {
              year: { ganzhi: pillarEls[0] ? pillarEls[0].textContent.trim() : '' },
              month: { ganzhi: pillarEls[1] ? pillarEls[1].textContent.trim() : '' },
              day: { ganzhi: pillarEls[2] ? pillarEls[2].textContent.trim() : '' },
              hour: { ganzhi: pillarEls[3] ? pillarEls[3].textContent.trim() : '' }
            };
          }
          // 提取所有文本内容作为上下文
          data.fullText = baziEl.innerText.substring(0, 3000);
          return data;
        }
        break;

      case 'qimen':
        var qmEl = document.getElementById('qmResult');
        if (qmEl) {
          var data = {};
          data.time = (document.getElementById('qmMeta') || {}).textContent || '';
          data.fullText = qmEl.innerText.substring(0, 3000);
          return data;
        }
        break;

      case 'ziwei':
        var zwEl = document.getElementById('zwResult');
        if (zwEl) {
          var data = {};
          data.name = (document.getElementById('zwNameOut') || {}).textContent || '';
          data.birthStr = (document.getElementById('zwMetaOut') || {}).textContent || '';
          data.fullText = zwEl.innerText.substring(0, 3000);
          return data;
        }
        break;

      case 'meihua':
        var mhEl = document.getElementById('mhResult');
        if (mhEl) {
          var data = {};
          data.time = (document.getElementById('mhMeta') || {}).textContent || '';
          data.fullText = mhEl.innerText.substring(0, 3000);
          return data;
        }
        break;

      case 'liuren':
        var lrEl = document.getElementById('lrResult');
        if (lrEl) {
          var data = {};
          data.time = (document.getElementById('lrMeta') || {}).textContent || '';
          data.fullText = lrEl.innerText.substring(0, 3000);
          return data;
        }
        break;

      case 'huajie':
        var hjEl = document.getElementById('hjOutput');
        if (hjEl) {
          var data = {};
          data.fullText = hjEl.innerText.substring(0, 3000);
          return data;
        }
        break;

      case 'lifeplan':
        var lpEl = document.getElementById('lifeplanResult');
        if (lpEl) {
          var data = {};
          data.fullText = lpEl.innerText.substring(0, 3000);
          return data;
        }
        break;

      case 'jiazi':
        var jzEl = document.getElementById('jiaziResult');
        if (jzEl) {
          var data = {};
          data.fullText = jzEl.innerText.substring(0, 3000);
          return data;
        }
        break;
    }
  } catch (e) {
    console.error('收集排盘数据异常:', e);
  }
  return { fullText: '排盘数据获取异常' };
}

// ════════════════════════════════════════════════════════════════
//  AI解读核心函数
// ════════════════════════════════════════════════════════════════

/**
 * 通用AI解读函数
 * @param {string} type - 排盘类型 'bazi'|'qimen'|'ziwei'|'meihua'|'liuren'|'huajie'|'lifeplan'|'jiazi'
 * @param {Object} baziData - 排盘结果数据
 * @param {string} question - 缘主提问（选填）
 * @returns {Promise<string>} AI生成的解读文本
 */
async function aiDivineInterpret(type, baziData, question) {
  var typeNames = {
    'bazi': '八字命理',
    'qimen': '奇门遁甲',
    'ziwei': '紫微斗数',
    'meihua': '梅花易数',
    'liuren': '大六壬',
    'huajie': '开运化解',
    'lifeplan': '人生规划',
    'jiazi': '六十甲子周期'
  };

  var typeName = typeNames[type] || '命理推演';
  var sanyuanCtx = _aiGetSanyuanContext();
  var paipanText = _aiGetPaipanDataText(type, baziData);

  var systemPrompt = '你是一位精通八字命理、奇门遁甲、紫微斗数、梅花易数、大六壬等传统术数的资深命理师，基于中华古老智慧知识体系进行推演解读。\n\n';
  systemPrompt += '解读原则：\n';
  systemPrompt += '1. 专业准确：基于排盘数据，运用传统命理学理论进行解读\n';
  systemPrompt += '2. 通俗易懂：用现代语言解释，避免生涩术语堆砌\n';
  systemPrompt += '3. 实操指导性：给出明确的建议和方向，而非模糊说辞\n';
  systemPrompt += '4. 客观中立：避免绝对化判断，命理为参考而非宿命\n';
  systemPrompt += '5. 正向引导：鼓励缘主积极面对人生，趋吉避凶\n\n';
  systemPrompt += '禁止事项：\n';
  systemPrompt += '- 禁止封建迷信表述\n';
  systemPrompt += '- 禁止恐吓性语言\n';
  systemPrompt += '- 禁止绝对化判断（如"必定""一定"等）\n';
  systemPrompt += '- 禁止涉及医疗、法律等专业领域建议\n\n';
  systemPrompt += '免责声明：所有解读仅供参考，不构成专业建议，人生掌握在自己手中。';

  var userPrompt = sanyuanCtx + '\n';
  userPrompt += paipanText + '\n';

  if (question) {
    userPrompt += '【缘主提问】\n' + question + '\n\n';
    userPrompt += '请针对缘主的提问，结合上述排盘数据和三元九运框架，给出专业的命理解答。';
  } else {
    userPrompt += '请对以上' + typeName + '排盘结果进行深度解读，包括：\n';
    userPrompt += '1. 整体命盘/盘面分析\n';
    userPrompt += '2. 关键要素解读（主要星曜/格局/五行等）\n';
    userPrompt += '3. 结合三元九运的趋势分析\n';
    userPrompt += '4. 事业、财运、感情等方面的指导建议\n';
    userPrompt += '5. 需要注意的事项和化解方向\n';
    userPrompt += '\n请用专业而温暖的语言进行解读，字数800-1500字。';
  }

  var messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  return await callG2ClawAPI(messages, { max_tokens: 2500, temperature: 0.7 });
}

/**
 * AI生成完整命理报告
 * @param {string} type - 排盘类型
 * @param {Object} baziData - 排盘数据
 * @returns {Promise<string>} 完整AI命理报告
 */
async function aiGenerateReport(type, baziData) {
  var sanyuanCtx = _aiGetSanyuanContext();
  var paipanText = _aiGetPaipanDataText(type, baziData);

  var systemPrompt = '你是一位精通八字命理、奇门遁甲、紫微斗数等传统术数的资深命理师，现在需要为缘主生成一份完整的命理报告。\n\n';
  systemPrompt += '报告要求：\n';
  systemPrompt += '1. 语言专业而通俗，让非专业人士也能理解\n';
  systemPrompt += '2. 分析要全面深入，覆盖人生各主要方面\n';
  systemPrompt += '3. 建议要具体可操作\n';
  systemPrompt += '4. 态度温和客观，避免绝对化表述\n';
  systemPrompt += '5. 报告末尾加上免责声明\n\n';
  systemPrompt += '禁止：封建迷信、恐吓性语言、绝对化判断、医疗法律建议。';

  var userPrompt = sanyuanCtx + '\n';
  userPrompt += paipanText + '\n';
  userPrompt += '请生成一份完整的命理报告，包含以下章节：\n\n';
  userPrompt += '## 一、命盘总论\n（整体命局分析，五行强弱，格局特点）\n\n';
  userPrompt += '## 二、性格分析\n（基于命盘的性格特质解读）\n\n';
  userPrompt += '## 三、事业财运\n（适合的行业、事业方向、财运特点）\n\n';
  userPrompt += '## 四、感情婚姻\n（感情特点、婚姻建议）\n\n';
  userPrompt += '## 五、健康提示\n（需关注的健康方向，日常养生建议）\n\n';
  userPrompt += '## 六、年度运势\n（结合三元九运，分析近1-3年运势走向）\n\n';
  userPrompt += '## 七、化解建议\n（趋吉避凶的具体建议）\n\n';
  userPrompt += '---\n*免责声明：本报告由AI基于传统命理学理论生成，仅供参考娱乐，不构成专业建议。人生掌握在自己手中，命理仅为参考。*\n\n';
  userPrompt += '请确保报告内容详实，字数2000-4000字。';

  var messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  return await callG2ClawAPI(messages, { max_tokens: 4000, temperature: 0.7 });
}

// ════════════════════════════════════════════════════════════════
//  UI交互函数
// ════════════════════════════════════════════════════════════════

/**
 * AI深度解读 - 按钮点击触发
 * @param {string} type - 排盘类型
 */
async function aiInterpret(type) {
  var btn = document.querySelector('[data-ai-btn="' + type + '"]');
  var section = document.getElementById('aiSection_' + type);
  var content = document.getElementById('aiContent_' + type);

  if (!section || !content) return;

  // 收集排盘数据
  var paipanData = _aiCollectPaipanData(type);

  // 显示区域
  section.style.display = 'block';
  content.innerHTML = '<div class="ai-loading">🤖 AI命理师正在深度解读中...</div>';

  // 按钮状态
  if (btn) {
    btn.disabled = true;
    btn.textContent = '🤖 AI解读中...';
  }

  try {
    var result = await aiDivineInterpret(type, paipanData, '');
    content.innerHTML = '<div class="ai-result-text">' + _aiFormatText(result) + '</div>';
    content.innerHTML += '<div class="ai-actions">' +
      '<button class="ai-action-btn" onclick="aiCopyText(\'' + type + '\')">📋 复制解读</button>' +
      '<button class="ai-action-btn" onclick="aiGenerateFullReport(\'' + type + '\')">📄 生成完整报告</button>' +
      '</div>';
  } catch (err) {
    content.innerHTML = '<div class="ai-error">⚠️ AI解读暂时不可用，请稍后重试或查看规则推演结果。<br><span style="font-size:12px;opacity:0.6">' + escapeHtml(err.message || '') + '</span></div>';
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🤖 AI深度解读';
    }
  }
}

/**
 * AI智能问答 - 提问按钮触发
 * @param {string} type - 排盘类型
 */
async function aiAsk(type) {
  var input = document.getElementById('aiQuestion_' + type);
  var content = document.getElementById('aiContent_' + type);
  var askBtn = document.querySelector('[data-ai-ask="' + type + '"]');

  if (!input || !input.value.trim()) return;

  var question = input.value.trim();
  input.value = '';

  // 如果AI区域没展开，先展开
  if (content && !content.innerHTML) {
    content.innerHTML = '<div class="ai-loading">🤖 AI命理师正在思考您的问题...</div>';
  } else if (content) {
    // 追加问题
    content.innerHTML += '<div class="ai-question">💬 ' + _aiEscapeHtml(question) + '</div>';
    content.innerHTML += '<div class="ai-loading">🤖 AI命理师正在思考...</div>';
  }

  if (askBtn) {
    askBtn.disabled = true;
    askBtn.textContent = '思考中...';
  }

  try {
    var paipanData = _aiCollectPaipanData(type);
    var result = await aiDivineInterpret(type, paipanData, question);

    // 移除loading
    var loading = content.querySelector('.ai-loading');
    if (loading) loading.remove();

    content.innerHTML += '<div class="ai-answer">' + _aiFormatText(result) + '</div>';
  } catch (err) {
    var loading = content.querySelector('.ai-loading');
    if (loading) loading.remove();
    content.innerHTML += '<div class="ai-error">⚠️ AI暂时无法回答，请稍后重试。<br><span style="font-size:12px;opacity:0.6">' + (err.message || '') + '</span></div>';
  } finally {
    if (askBtn) {
      askBtn.disabled = false;
      askBtn.textContent = '提问';
    }
  }
}

/**
 * 生成完整AI报告
 * @param {string} type - 排盘类型
 */
async function aiGenerateFullReport(type) {
  var content = document.getElementById('aiContent_' + type);
  if (!content) return;

  content.innerHTML += '<div class="ai-loading">🤖 AI正在生成完整命理报告，请稍候（约30秒）...</div>';

  try {
    var paipanData = _aiCollectPaipanData(type);
    var report = await aiGenerateReport(type, paipanData);

    var loading = content.querySelector('.ai-loading');
    if (loading) loading.remove();

    content.innerHTML += '<div class="ai-report">' + _aiFormatText(report) + '</div>';
    content.innerHTML += '<div class="ai-actions">' +
      '<button class="ai-action-btn" onclick="aiExportReport(\'' + type + '\')">📋 导出报告</button>' +
      '</div>';
  } catch (err) {
    var loading = content.querySelector('.ai-loading');
    if (loading) loading.remove();
    content.innerHTML += '<div class="ai-error">⚠️ 报告生成失败，请稍后重试。<br><span style="font-size:12px;opacity:0.6">' + (err.message || '') + '</span></div>';
  }
}

/**
 * 复制AI解读文本
 */
function aiCopyText(type) {
  var content = document.getElementById('aiContent_' + type);
  if (!content) return;
  var text = content.innerText;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function() {
      showToast('已复制到剪贴板');
    }).catch(function() {
      _aiFallbackCopy(text);
    });
  } else {
    _aiFallbackCopy(text);
  }
}

/**
 * 导出AI报告
 */
function aiExportReport(type) {
  var content = document.getElementById('aiContent_' + type);
  if (!content) return;
  var reportEl = content.querySelector('.ai-report');
  if (!reportEl) return;

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>AI命理报告</title>';
  html += '<style>body{font-family:"Songti SC","SimSun",serif;max-width:800px;margin:0 auto;padding:40px 20px;background:#fdf6e3;color:#333;line-height:1.8}h1,h2,h3{color:#c9a84c}a{color:#c9a84c}</style>';
  html += '</head><body>';
  html += reportEl.innerHTML;
  html += '</body></html>';

  var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'AI命理报告_' + type + '_' + new Date().toISOString().slice(0,10) + '.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ════════════════════════════════════════════════════════════════
//  辅助函数
// ════════════════════════════════════════════════════════════════

function _aiFormatText(text) {
  if (!text) return '';
  // 转义HTML
  text = _aiEscapeHtml(text);
  // markdown标题
  text = text.replace(/^### (.+)$/gm, '<h4 class="ai-h4">$1</h4>');
  text = text.replace(/^## (.+)$/gm, '<h3 class="ai-h3">$1</h3>');
  text = text.replace(/^# (.+)$/gm, '<h2 class="ai-h2">$1</h2>');
  // 粗体
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // 列表
  text = text.replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>');
  text = text.replace(/^[-•]\s(.+)$/gm, '<li>$1</li>');
  // 段落
  text = text.replace(/\n\n/g, '</p><p>');
  text = text.replace(/\n/g, '<br>');
  return '<p>' + text + '</p>';
}

function _aiEscapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function _aiFallbackCopy(text) {
  var textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showToast('已复制到剪贴板');
  } catch (e) {
    showToast('复制失败，请手动选择文本复制');
  }
  document.body.removeChild(textarea);
}

// ════════════════════════════════════════════════════════════════
//  动态注入AI区域到各排盘结果后
// ════════════════════════════════════════════════════════════════

/**
 * 初始化AI解读区域 - 在每个排盘结果后注入AI交互区域
 */
function _aiInitSections() {
  var targets = [
    { id: 'baziResult', type: 'bazi' },
    { id: 'mhResult', type: 'meihua' },
    { id: 'qmResult', type: 'qimen' },
    { id: 'lrResult', type: 'liuren' },
    { id: 'zwResult', type: 'ziwei' },
    { id: 'hjOutput', type: 'huajie' },
    { id: 'lifeplanResult', type: 'lifeplan' },
    { id: 'jiaziResult', type: 'jiazi' }
  ];

  for (var i = 0; i < targets.length; i++) {
    var t = targets[i];
    var el = document.getElementById(t.id);
    if (!el) continue;
    if (el.getAttribute('data-ai-injected')) continue; // 避免重复注入

    el.setAttribute('data-ai-injected', '1');

    // 创建AI区域
    var aiSection = document.createElement('div');
    aiSection.className = 'ai-section';
    aiSection.id = 'aiSection_' + t.type;
    aiSection.style.cssText = 'display:none;margin-top:16px;padding:16px;border:1px solid rgba(201,168,76,0.2);border-radius:12px;background:rgba(201,168,76,0.04)';
    aiSection.innerHTML =
      '<div class="ai-header" style="font-size:15px;font-weight:600;color:var(--gold);margin-bottom:12px;letter-spacing:1px">🤖 AI命理师解读</div>' +
      '<div class="ai-content" id="aiContent_' + t.type + '" style="font-size:14px;line-height:1.8;color:var(--paper);max-height:600px;overflow-y:auto;padding:8px"></div>' +
      '<div class="ai-qa" style="display:flex;gap:8px;margin-top:12px">' +
        '<input type="text" id="aiQuestion_' + t.type + '" placeholder="向命理师提问..." style="flex:1;padding:8px 12px;border:1px solid rgba(201,168,76,0.2);border-radius:8px;background:rgba(0,0,0,0.3);color:var(--paper);font-size:13px">' +
        '<button data-ai-ask="' + t.type + '" onclick="aiAsk(\'' + t.type + '\')" style="padding:8px 16px;border:1px solid var(--gold);border-radius:8px;background:rgba(201,168,76,0.1);color:var(--gold);cursor:pointer;font-size:13px;white-space:nowrap">提问</button>' +
      '</div>';

    // 创建AI解读按钮
    var aiBtn = document.createElement('button');
    aiBtn.className = 'ai-btn';
    aiBtn.setAttribute('data-ai-btn', t.type);
    aiBtn.onclick = function(type) { return function() { aiInterpret(type); }; }(t.type);
    aiBtn.style.cssText = 'display:block;width:100%;margin-top:12px;padding:10px;border:1px solid var(--gold);border-radius:8px;background:rgba(201,168,76,0.08);color:var(--gold);cursor:pointer;font-size:14px;letter-spacing:2px;transition:all 0.3s';
    aiBtn.textContent = '🤖 AI深度解读';

    // 插入到排盘结果div之后
    el.parentNode.insertBefore(aiSection, el.nextSibling);
    el.parentNode.insertBefore(aiBtn, aiSection.nextSibling);
  }
}

// ════════════════════════════════════════════════════════════════
//  CSS样式注入
// ════════════════════════════════════════════════════════════════

function _aiInjectStyles() {
  if (document.getElementById('ai-interpreter-styles')) return;
  var style = document.createElement('style');
  style.id = 'ai-interpreter-styles';
  style.textContent = [
    '.ai-section { animation: aiFadeIn 0.3s ease; }',
    '@keyframes aiFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }',
    '.ai-loading { padding: 16px; text-align: center; color: var(--gold); font-size: 14px; opacity: 0.8; }',
    '.ai-loading::after { content: ""; display: inline-block; width: 12px; height: 12px; border: 2px solid var(--gold); border-top-color: transparent; border-radius: 50%; animation: aiSpin 0.8s linear infinite; margin-left: 8px; vertical-align: middle; }',
    '@keyframes aiSpin { to { transform: rotate(360deg); } }',
    '.ai-result-text, .ai-answer, .ai-report { padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px; margin-bottom: 8px; }',
    '.ai-result-text p, .ai-answer p, .ai-report p { margin: 8px 0; }',
    '.ai-h2 { font-size: 16px; color: var(--gold); margin: 16px 0 8px; font-weight: 600; }',
    '.ai-h3 { font-size: 15px; color: var(--gold2); margin: 14px 0 6px; font-weight: 600; }',
    '.ai-h4 { font-size: 14px; color: var(--paper); margin: 12px 0 4px; font-weight: 600; }',
    '.ai-result-text li, .ai-answer li, .ai-report li { margin: 4px 0 4px 20px; list-style: disc; }',
    '.ai-result-text strong, .ai-answer strong, .ai-report strong { color: var(--gold2); }',
    '.ai-question { padding: 8px 12px; background: rgba(142,68,173,0.1); border-radius: 8px; margin: 8px 0; font-size: 13px; color: var(--violet2); }',
    '.ai-error { padding: 12px; background: rgba(231,76,60,0.1); border-radius: 8px; color: var(--cinn2); font-size: 13px; text-align: center; }',
    '.ai-actions { display: flex; gap: 8px; margin-top: 12px; }',
    '.ai-action-btn { padding: 6px 14px; border: 1px solid rgba(201,168,76,0.3); border-radius: 6px; background: rgba(201,168,76,0.05); color: var(--gold); cursor: pointer; font-size: 12px; transition: all 0.3s; }',
    '.ai-action-btn:hover { background: rgba(201,168,76,0.15); }',
    '.ai-btn:hover { background: rgba(201,168,76,0.15) !important; }',
    '.ai-btn:disabled { opacity: 0.5; cursor: not-allowed; }',
    '.ai-content::-webkit-scrollbar { width: 4px; }',
    '.ai-content::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.3); border-radius: 2px; }',
    '.ai-content::-webkit-scrollbar-track { background: transparent; }'
  ].join('\n');
  document.head.appendChild(style);
}

// ════════════════════════════════════════════════════════════════
//  初始化
// ════════════════════════════════════════════════════════════════

try {
  document.addEventListener('DOMContentLoaded', function() {
    _aiInjectStyles();
    // 延迟注入，确保排盘结果DOM已就绪
    setTimeout(_aiInitSections, 500);

    // 监听section切换，延迟注入（处理动态显示的section）
    var origShowSection = window.showSection;
    if (typeof origShowSection === 'function') {
      window.showSection = function(name) {
        var result = origShowSection.apply(this, arguments);
        setTimeout(_aiInitSections, 200);
        return result;
      };
    }
  });
} catch (e) {
  console.error('AI解读模块初始化异常:', e);
}

// ════════════════════════════════════════════════════════════════
//  挂载到window
// ════════════════════════════════════════════════════════════════

try { window.callG2ClawAPI = callG2ClawAPI; } catch(e) {}
try { window.aiDivineInterpret = aiDivineInterpret; } catch(e) {}
try { window.aiGenerateReport = aiGenerateReport; } catch(e) {}
try { window.aiInterpret = aiInterpret; } catch(e) {}
try { window.aiAsk = aiAsk; } catch(e) {}
try { window.aiGenerateFullReport = aiGenerateFullReport; } catch(e) {}
try { window.aiCopyText = aiCopyText; } catch(e) {}
try { window.aiExportReport = aiExportReport; } catch(e) {}
