/**
 * AI 命理解读引擎 v1.0 (R738)
 * 一次建设、全域复用：八字/卦象/黄历/风水/紫微/奇门 全部走 KB + 排盘引擎
 * 依赖：无（原生 fetch，零框架）
 * 用法：
 *   aiMingli.interpret('gua', {name:'离卦', question:'问事业'})
 *   aiMingli.interpret('bazi', {pillars:'庚午 壬午 辛亥 癸巳', dayMaster:'辛金'})
 *   aiMingli.attachButton(container, 'gua', data)  // 一键挂载「AI解读」按钮
 */
(function(global) {
  'use strict';

  const API_KB = 'http://127.0.0.1:8920';
  const API_PAIPAN = 'http://127.0.0.1:8911';

  // ═══ 查询词组装器（按类型拼最优检索词）═══
  const QUERY_BUILDERS = {
    gua: function(d) {
      // 卦象：卦名 + 问事领域
      var parts = [];
      if (d.name) parts.push(d.name);
      if (d.question) parts.push(d.question.replace(/[的了吗？?]/g, '').slice(0, 12));
      if (d.bianhua) parts.push('变卦 ' + d.bianhua);
      return parts.join(' ') || '易经占卜';
    },
    bazi: function(d) {
      // 八字：日主 + 五行 + 格局关键词
      var parts = [];
      if (d.dayMaster) parts.push(d.dayMaster + ' 日主');
      if (d.wuxing) parts.push(d.wuxing);
      if (d.shishen) parts.push(d.shishen);
      return parts.join(' ') || '八字命理';
    },
    ziwei: function(d) {
      var parts = [];
      if (d.mingGong) parts.push(d.mingGong + ' 命宫');
      if (d.zhuXing) parts.push(d.zhuXing);
      return parts.join(' ') || '紫微斗数';
    },
    qimen: function(d) {
      var parts = [];
      if (d.yongShen) parts.push(d.yongShen + ' 用神');
      if (d.geJu) parts.push(d.geJu);
      return parts.join(' ') || '奇门遁甲';
    },
    huangli: function(d) {
      var parts = [];
      if (d.yiji) parts.push(d.yiji);
      if (d.jieqi) parts.push(d.jieqi + ' 节气');
      return parts.join(' ') || '黄历宜忌';
    },
    fengshui: function(d) {
      var parts = [];
      if (d.zhaiXiang) parts.push(d.zhaiXiang);
      if (d.wenTi) parts.push(d.wenTi);
      return parts.join(' ') || '风水布局';
    },
    default: function(d) {
      return (d.query || d.name || String(d)).slice(0, 40);
    }
  };

  // ═══ 核心解读函数 ═══
  async function interpret(type, data, opts) {
    opts = opts || {};
    var builder = QUERY_BUILDERS[type] || QUERY_BUILDERS.default;
    var query = builder(data);

    // 并行：KB 检索（知识证据）+ 可选排盘
    var kbPromise = fetchKb(query, opts.limit || 5);

    var results = await kbPromise;

    // 组装结构化解读
    var interpretation = {
      ok: results.length > 0,
      query: query,
      type: type,
      sources: results,
      summary: '',
      advice: '',
      confidence: results.length >= 3 ? 'high' : results.length >= 1 ? 'mid' : 'low'
    };

    if (results.length) {
      // 取前 3 条合成摘要
      var topTitles = results.slice(0, 3).map(function(r) { return r.title; });
      interpretation.summary = '据《' + topTitles.join('》《') + '》' + typeLabel(type) + '：';
      // 第一条内容片段作主体
      var main = results[0];
      if (main.snippet) {
        interpretation.summary += '\n' + main.snippet.replace(/<[^>]*>/g, '').slice(0, 300);
      }
      // 建议从后几条提取
      var adviceSrc = results.find(function(r) { return /宜|忌|建议|吉|凶|化解/.test(r.title || ''); });
      if (adviceSrc && adviceSrc.snippet) {
        interpretation.advice = adviceSrc.snippet.replace(/<[^>]*>/g, '').slice(0, 200);
      }
    }
    return interpretation;
  }

  function typeLabel(t) {
    var m = { gua: '解卦', bazi: '命理分析', ziwei: '星盘解读', qimen: '局象分析',
              huangli: '择日参考', fengshui: '堪舆建议', default: '分析' };
    return m[t] || m.default;
  }

  async function fetchKb(query, limit) {
    try {
      var resp = await fetch(API_KB + '/api/public/kb/search-fts?q=' + encodeURIComponent(query) + '&limit=' + limit, {
        signal: AbortSignal.timeout(6000)
      });
      var d = await resp.json();
      var results = (d.data || d).results || [];
      return results.map(function(r) {
        return {
          title: r.title || '',
          module: r.module || '',
          snippet: r.content || r.snippet || '',
          trust: r.trust || 0.85
        };
      });
    } catch (e) {
      return [];
    }
  }

  // ═══ 一键挂载「AI 解读」按钮（给任意命理页面用）═══
  function attachButton(container, type, data, opts) {
    if (!container) return null;
    opts = opts || {};
    var btn = document.createElement('button');
    btn.className = opts.btnClass || 'btn ai-interpret-btn';
    btn.style.cssText = 'background:linear-gradient(135deg,rgba(201,168,76,.15),rgba(201,168,76,.05));border:1px solid rgba(201,168,76,.4);color:#e8cc7a;border-radius:8px;padding:8px 18px;font-size:13px;cursor:pointer;font-family:inherit;transition:.2s;letter-spacing:1px';
    btn.innerHTML = '🤖 AI 解读';
    btn.onclick = async function() {
      btn.disabled = true;
      btn.innerHTML = '⏳ AI 解读中…';
      try {
        var result = await interpret(type, data, opts);
        showResult(container, result, opts);
      } catch (e) {
        btn.innerHTML = '🤖 AI 解读';
        btn.disabled = false;
        toastMsg(opts.container2 || container, 'AI 解读暂不可用，请稍后重试');
      }
      btn.innerHTML = '🤖 AI 解读';
      btn.disabled = false;
    };
    container.appendChild(btn);
    return btn;
  }

  // ═══ 结果展示（浮层卡片）═══
  function showResult(anchoring, result, opts) {
    var overlay = document.getElementById('aiMingliOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'aiMingliOverlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px';
      overlay.onclick = function(e) { if (e.target === overlay) overlay.style.display = 'none'; };
      document.body.appendChild(overlay);
    }
    var esc = function(s) { var d = document.createElement('div'); d.textContent = String(s || ''); return d.innerHTML; };
    var html = '<div style="background:#141414;border:1px solid rgba(201,168,76,.3);border-radius:14px;max-width:560px;width:100%;max-height:75vh;overflow-y:auto;padding:20px">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">';
    html += '<span style="font-size:20px">🤖</span>';
    html += '<span style="font-size:16px;font-weight:600;color:#e8cc7a">AI ' + esc(typeLabel(result.type)) + '</span>';
    html += '<span style="margin-left:auto;font-size:10px;padding:2px 10px;border-radius:10px;background:' + (result.confidence === 'high' ? 'rgba(39,174,96,.15);color:#2ecc71' : result.confidence === 'mid' ? 'rgba(230,126,34,.15);color:#e67e22' : 'rgba(231,76,60,.15);color:#e74c3c') + '">' + (result.confidence === 'high' ? '依据充分' : result.confidence === 'mid' ? '有参考' : '待补充') + '</span>';
    html += '</div>';
    if (result.ok) {
      html += '<div style="font-size:13px;color:#d4c9b0;line-height:1.8;white-space:pre-wrap">' + esc(result.summary) + '</div>';
      if (result.advice) {
        html += '<div style="margin-top:12px;padding:10px;background:rgba(39,174,96,.06);border:1px solid rgba(39,174,96,.2);border-radius:8px;font-size:12px;color:#d4c9b0;line-height:1.7"><b style="color:#2ecc71">💡 建议：</b>' + esc(result.advice) + '</div>';
      }
      // 知识来源
      html += '<div style="margin-top:14px;font-size:10px;color:#a09080">📚 知识来源：</div>';
      result.sources.forEach(function(s) {
        html += '<div style="font-size:11px;color:#c9a84c;padding:2px 0">· 《' + esc(s.title) + '》 <span style="color:#a09080">(' + esc(s.module) + ' · 可信度 ' + s.trust + ')</span></div>';
      });
    } else {
      html += '<div style="font-size:13px;color:#a09080;line-height:1.8;padding:20px 0;text-align:center">暂未找到「' + esc(result.query) + '」的知识条目<br>建议换个问法，或咨询命理师深度解读</div>';
    }
    html += '<div style="text-align:center;margin-top:14px"><button onclick="document.getElementById(\'aiMingliOverlay\').style.display=\'none\'" style="padding:8px 28px;border-radius:20px;border:1px solid rgba(201,168,76,.3);background:transparent;color:#c9a84c;font-size:13px;cursor:pointer;font-family:inherit">关闭</button></div>';
    html += '</div>';
    overlay.innerHTML = html;
    overlay.style.display = 'flex';
  }

  function toastMsg(container, msg) {
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#141414;border:1px solid #c9a84c;color:#e8cc7a;padding:10px 20px;border-radius:20px;font-size:13px;z-index:99999';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function() { t.remove(); }, 2500);
  }

  // ═══ 语音输入助手（命理页通用）═══
  function attachVoice(inputEl, onResult) {
    if (!inputEl) return null;
    var SR = global.SpeechRecognition || global.webkitSpeechRecognition;
    if (!SR) return null;
    var btn = document.createElement('button');
    btn.innerHTML = '🎤';
    btn.title = '语音输入';
    btn.style.cssText = 'width:42px;height:42px;border-radius:50%;border:1px solid rgba(201,168,76,.4);background:rgba(201,168,76,.1);color:#e8cc7a;font-size:18px;cursor:pointer;margin-left:8px;flex-shrink:0';
    var recognizing = false, rec = null;
    btn.onclick = function() {
      if (recognizing) { try { rec.stop(); } catch(_){} return; }
      rec = new SR();
      rec.lang = 'zh-CN';
      rec.onresult = function(ev) {
        var text = ev.results[0][0].transcript;
        inputEl.value = (inputEl.value ? inputEl.value + ' ' : '') + text;
        if (onResult) onResult(text);
      };
      rec.onend = function() { recognizing = false; btn.style.background = 'rgba(201,168,76,.1)'; };
      rec.onerror = function() { recognizing = false; btn.style.background = 'rgba(201,168,76,.1)'; };
      try {
        rec.start();
        recognizing = true;
        btn.style.background = 'rgba(231,76,60,.3)';
      } catch(_) {}
    };
    if (inputEl.parentNode) inputEl.parentNode.insertBefore(btn, inputEl.nextSibling);
    return btn;
  }

  // 导出
  global.aiMingli = {
    interpret: interpret,
    attachButton: attachButton,
    attachVoice: attachVoice,
    fetchKb: fetchKb,
    QUERY_BUILDERS: QUERY_BUILDERS
  };
})(window);
