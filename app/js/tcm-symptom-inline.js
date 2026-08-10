
var KB = window.TCM_DIAGNOSIS_KB || {};
var FAMOUS_KB = window.TCM_FAMOUS_FORMULAS_KB || {};
var selectedSymptoms = [];

// 常见症状列表
var COMMON_SYMPTOMS = [
  '失眠多梦','口干口苦','心烦易怒','头痛头晕','胸闷气短','食欲不振',
  '腹胀腹泻','便秘','腰膝酸软','畏寒怕冷','手足冰凉','潮热盗汗',
  '月经不调','疲劳乏力','视力模糊','耳鸣耳聋','咳嗽痰多','皮肤瘙痒',
  '关节疼痛','面色苍白','容易感冒','情绪低落','夜尿频多','胃痛胃胀'
];

// 渲染症状选择
function renderSymptomGrid() {
  var grid = document.getElementById('symptomGrid');
  grid.innerHTML = COMMON_SYMPTOMS.map(function(s) {
    return '<ml-tap class="symptom-chip" onclick="toggleSymptom(this,\'' + s + '\')" variant="card" role="button" tabindex="0">' + s + '</ml-tap>';
  }).join('');
}

function toggleSymptom(el, symptom) {
  var idx = selectedSymptoms.indexOf(symptom);
  if (idx > -1) {
    selectedSymptoms.splice(idx, 1);
    el.classList.remove('selected');
  } else {
    selectedSymptoms.push(symptom);
    el.classList.add('selected');
  }
  // 同步到文本框
  var textEl = document.getElementById('symptomText');
  if (selectedSymptoms.length > 0 && (!textEl.value || textEl.value.trim().length < 5)) {
    textEl.value = selectedSymptoms.join('、');
  }
}

function escapeHTML(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function setStep(stepNum) {
  for (var i = 1; i <= 5; i++) {
    var el = document.getElementById('step' + i);
    if (i < stepNum) { el.classList.remove('active'); el.classList.add('done'); }
    else if (i === stepNum) { el.classList.add('active'); el.classList.remove('done'); }
    else { el.classList.remove('active','done'); }
  }
}

function showSection(id) {
  var el = document.getElementById(id);
  if (el) el.classList.add('visible');
}

function analyzeSymptoms() {
  var btn = document.getElementById('analyzeBtn');
  var text = document.getElementById('symptomText').value.trim();
  if (!text && selectedSymptoms.length === 0) {
    showToast('请描述您的症状或选择常见症状');
    return;
  }

  btn.disabled = true;
  btn.textContent = '分析中...';

  // 合并症状
  var allSymptoms = text;
  if (selectedSymptoms.length > 0) {
    var extra = selectedSymptoms.filter(function(s) { return allSymptoms.indexOf(s) === -1; });
    if (extra.length > 0) allSymptoms += ' ' + extra.join('、');
  }

  setTimeout(function() {
    // Step 2: 证候分析
    analyzeSyndromes(allSymptoms);
    setStep(2);
    showSection('syndromeResult');

    // Step 3: 名医推荐
    recommendDoctors(allSymptoms);
    setStep(3);
    showSection('doctorResult');

    // Step 4: 命理预测
    mingliPredict();
    setStep(4);
    showSection('mingliResult');

    // Step 5: 周易方案
    hexagramSolution();
    setStep(5);
    showSection('solutionResult');
    showSection('exportSection');

    btn.disabled = false;
    btn.textContent = '🔍 重新分析';
    document.getElementById('solutionResult').scrollIntoView({behavior:'smooth'});
  }, 500);
}

// 证候分析
function analyzeSyndromes(text) {
  var body = document.getElementById('syndromeBody');
  var html = '';
  var matched = [];

  // 从KB匹配症状
  if (KB.symptom_engine && KB.symptom_engine.symptoms) {
    KB.symptom_engine.symptoms.forEach(function(s) {
      if (s.keywords) {
        var hit = s.keywords.some(function(k) { return text.indexOf(k) > -1; });
        if (hit) matched.push(s);
      }
    });
  }

  // 从证候库匹配
  var syndromeMatches = [];
  if (KB.syndrome_db && KB.syndrome_db.syndromes) {
    KB.syndrome_db.syndromes.forEach(function(syn) {
      var score = 0;
      if (syn.symptoms) {
        syn.symptoms.forEach(function(ss) {
          if (text.indexOf(ss) > -1) score++;
        });
      }
      if (score > 0) syndromeMatches.push({syn: syn, score: score});
    });
    syndromeMatches.sort(function(a, b) { return b.score - a.score; });
  }

  if (syndromeMatches.length === 0 && matched.length === 0) {
    html += '<p>未找到匹配的证候。请更详细地描述症状，或选择常见症状。</p>';
  } else {
    html += '<p style="margin-bottom:12px">基于症状描述，匹配到以下证候：</p>';
    syndromeMatches.slice(0, 5).forEach(function(m, i) {
      var syn = m.syn;
      html += '<div class="syndrome-card">';
      html += '<div class="syndrome-name">' + (i + 1) + '. ' + escapeHTML(syn.name || '') + ' <span style="font-size:11px;color:var(--jade2)">匹配度:' + '★'.repeat(Math.min(m.score, 5)) + '</span></div>';
      html += '<div class="syndrome-desc">' + escapeHTML(syn.description || syn.desc || '') + '</div>';
      if (syn.symptoms) {
        html += '<div style="font-size:11px;color:var(--paper3);margin-top:4px">相关症状：' + syn.symptoms.map(escapeHTML).join('、') + '</div>';
      }
      if (syn.principle) {
        html += '<div style="font-size:11px;color:var(--gold2);margin-top:4px">治则：' + escapeHTML(syn.principle) + '</div>';
      }
      html += '</div>';
    });
  }

  // 大白话总结
  html += '<div class="plain-summary"><div class="plain-title">💬 简单说就是</div><div class="plain-body">';
  if (syndromeMatches.length > 0) {
    var top = syndromeMatches[0].syn.name || '';
    html += '根据您的症状，最可能的证候是「' + escapeHTML(top) + '」。这意味着您身体的某个系统出现了失衡，建议找专业中医师面诊确认，配合生活方式调整。';
  } else {
    html += '症状信息不够充分，建议补充更多细节后重新分析，或直接咨询专业中医师。';
  }
  html += '</div></div>';

  body.innerHTML = html;
}

// 名医推荐
function recommendDoctors(text) {
  var body = document.getElementById('doctorBody');
  var html = '';
  var doctors = [];

  // 从KB匹配名医
  if (KB.doctor_recommendation && KB.doctor_recommendation.doctors) {
    KB.doctor_recommendation.doctors.forEach(function(d) {
      var score = 0;
      if (d.specialties) {
        d.specialties.forEach(function(sp) {
          if (text.indexOf(sp) > -1) score += 2;
        });
      }
      if (d.expertise) {
        d.expertise.forEach(function(ex) {
          if (text.indexOf(ex) > -1) score += 1;
        });
      }
      if (score > 0) doctors.push({doc: d, score: score});
    });
    doctors.sort(function(a, b) { return b.score - a.score; });
  }

  // 补充历史名医
  if (FAMOUS_KB.doctors && doctors.length < 5) {
    var extraDocs = FAMOUS_KB.doctors.slice(0, 5 - doctors.length);
    extraDocs.forEach(function(d) {
      doctors.push({doc: {
        name: d.name,
        dynasty: d.dynasty || d.era || '',
        specialties: d.specialties || [],
        expertise: d.expertise || d.contribution || '',
        work: d.work || ''
      }, score: 0});
    });
  }

  if (doctors.length === 0) {
    html += '<p>暂无匹配的名医推荐，建议前往「中医诊疗」页面咨询。</p>';
  } else {
    html += '<p style="margin-bottom:12px">根据症状推荐以下名医（历史名医供参考学习）：</p>';
    doctors.slice(0, 6).forEach(function(d) {
      var doc = d.doc;
      html += '<div class="doctor-card">';
      html += '<div class="doctor-info">';
      html += '<div class="doctor-name">' + escapeHTML(doc.name || '') + '</div>';
      if (doc.dynasty) html += '<div class="doctor-era">' + escapeHTML(doc.dynasty) + '</div>';
      var exp = doc.expertise;
      if (Array.isArray(exp)) exp = exp.join('、');
      if (exp) html += '<div class="doctor-expertise">' + escapeHTML(String(exp).substring(0, 80)) + '</div>';
      if (doc.work) html += '<div style="font-size:11px;color:var(--paper3);margin-top:2px">代表著作：' + escapeHTML(doc.work) + '</div>';
      html += '</div>';
      if (d.score > 0) html += '<div class="doctor-match">匹配度 ' + d.score + '</div>';
      html += '</div>';
    });
  }

  html += '<div class="plain-summary"><div class="plain-title">💡 就医建议</div><div class="plain-body">';
  html += '以上名医为历史名医，供学习参考。如需就医，建议寻找当地有资质的中医师，携带完整症状描述面诊。不同证候需要不同方剂，切勿自行用药。';
  html += '</div></div>';

  body.innerHTML = html;
}

// 命理疾病预测
function mingliPredict() {
  var body = document.getElementById('mingliBody');
  var html = '';
  var birthYear = document.getElementById('birthYear').value;
  var dayMaster = document.getElementById('dayMaster').value;

  // 推断日主五行
  var dayEle = dayMaster;
  if (!dayEle && birthYear) {
    var stems = ['庚','辛','壬','癸','甲','乙','丙','丁','戊','己'];
    var yearStem = stems[(parseInt(birthYear) - 4) % 10];
    var eleMap = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
    dayEle = eleMap[yearStem] || '木';
  }
  if (!dayEle) dayEle = '木';

  html += '<div class="mingli-section">';
  html += '<h4>🌟 日主五行：' + escapeHTML(dayEle) + '</h4>';

  // 五行对应脏腑风险
  if (KB.mingli_disease_prediction && KB.mingli_disease_prediction.element_organ_risk) {
    var risks = KB.mingli_disease_prediction.element_organ_risk;
    var matchedRisk = risks.filter(function(r) { return r.element === dayEle; });
    if (matchedRisk.length > 0) {
      html += '<p>日主属' + escapeHTML(dayEle) + '，对应脏腑：' + matchedRisk[0].organs.join('、') + '</p>';
      if (matchedRisk[0].risk) {
        html += '<p style="margin-top:6px">易感风险：' + matchedRisk[0].risk.map(function(r) { return escapeHTML(r); }).join('、') + '</p>';
      }
      if (matchedRisk[0].prevention) {
        html += '<p style="margin-top:6px;color:var(--jade2)">预防建议：' + escapeHTML(matchedRisk[0].prevention) + '</p>';
      }
    }
  }

  // 大运触发规则
  if (KB.mingli_disease_prediction && KB.mingli_disease_prediction.dayun_trigger_rules) {
    html += '<h4 style="margin-top:14px">📅 大运流年触发规则</h4>';
    KB.mingli_disease_prediction.dayun_trigger_rules.slice(0, 3).forEach(function(rule) {
      html += '<p style="font-size:12px;margin-bottom:4px">• ' + escapeHTML(rule.condition || rule.name || '') + '：' + escapeHTML(rule.effect || rule.risk || '') + '</p>';
    });
  }
  html += '</div>';

  // 大白话
  html += '<div class="plain-summary"><div class="plain-title">💬 简单说就是</div><div class="plain-body">';
  var organMap = {'木':'肝胆','火':'心血管','土':'脾胃','金':'肺大肠','水':'肾膀胱'};
  html += '您的日主属' + escapeHTML(dayEle) + '，对应' + (organMap[dayEle]||'相关') + '系统。这个系统是您的体质弱点，在特定大运流年下容易被触发。建议平时多注意' + (organMap[dayEle]||'相关') + '的保养，定期体检，有不适及时就医。';
  html += '</div></div>';

  body.innerHTML = html;
}

// 周易中医联合方案
function hexagramSolution() {
  var body = document.getElementById('solutionBody');
  var html = '';

  // 卦象健康对应
  if (KB.yijing_tcm_solution && KB.yijing_tcm_solution.hexagram_health) {
    html += '<div class="hexagram-solution">';
    html += '<h4>☰ 卦象健康对应</h4>';
    var hexHealth = KB.yijing_tcm_solution.hexagram_health;
    hexHealth.slice(0, 5).forEach(function(h) {
      html += '<p style="font-size:12px;margin-bottom:4px">• <b>' + escapeHTML(h.hexagram || h.name || '') + '</b>：' + escapeHTML(h.health || h.meaning || '') + '</p>';
    });
    html += '</div>';
  }

  // 卦象→证候链条
  if (KB.yijing_tcm_solution && KB.yijing_tcm_solution.hexagram_to_syndrome_chain) {
    html += '<div class="hexagram-solution">';
    html += '<h4>🔗 卦象→证候→方案</h4>';
    KB.yijing_tcm_solution.hexagram_to_syndrome_chain.slice(0, 4).forEach(function(chain) {
      html += '<p style="font-size:12px;margin-bottom:6px">• ' + escapeHTML(chain.hexagram || chain.name || '') + ' → ' + escapeHTML(chain.syndrome || '') + ' → ' + escapeHTML(chain.solution || chain.treatment || '') + '</p>';
    });
    html += '</div>';
  }

  // 预防阶段
  if (KB.yijing_tcm_solution && KB.yijing_tcm_solution.prevention_stages) {
    html += '<div class="hexagram-solution">';
    html += '<h4>🛡️ 分阶段预防方案</h4>';
    KB.yijing_tcm_solution.prevention_stages.forEach(function(stage) {
      html += '<p style="font-size:12px;margin-bottom:4px"><b>' + escapeHTML(stage.stage || stage.name || '') + '</b>：' + escapeHTML(stage.action || stage.method || '') + '</p>';
    });
    html += '</div>';
  }

  // 大白话
  html += '<div class="plain-summary"><div class="plain-title">☯️ 周易中医总结</div><div class="plain-body">';
  html += '周易认为疾病是阴阳失衡的表现。通过卦象可以理解疾病的发展趋势，中医则提供具体的调理方法。两者结合，既能从宏观把握疾病走向，又能从微观制定调理方案。核心原则：治未病 > 治欲病 > 治已病。日常注意顺应四时、调畅情志、饮食有节、起居有常。';
  html += '</div></div>';

  body.innerHTML = html;
}

// 导出/复制
function exportReport() {
  var html = '<html><head><meta charset="UTF-8"><title>症状分析报告</title>' +
    '<link rel="stylesheet" href="css/tcm-symptom-inline.css">' +
    '</head><body style="font-family:serif;max-width:800px;margin:auto;padding:20px">';
  ['syndromeResult','doctorResult','mingliResult','solutionResult'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el && el.classList.contains('visible')) {
      html += '<h2>' + el.querySelector('.result-title').textContent + '</h2>';
      html += el.querySelector('.result-body').innerHTML;
    }
  });
  html += '  \x3cscript src="js/a11y-divination-hub.js" defer><\/script>';
  html += '  </body></html>';
  var blob = new Blob([html], {type: 'text/html'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '症状分析报告_' + new Date().toISOString().slice(0,10) + '.html';
  a.click();
}

function copyReport() {
  var text = '';
  ['syndromeResult','doctorResult','mingliResult','solutionResult'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el && el.classList.contains('visible')) {
      text += '\n=== ' + el.querySelector('.result-title').textContent + ' ===\n';
      text += el.querySelector('.result-body').innerText + '\n';
    }
  });
  navigator.clipboard.writeText(text).then(function() {
    showToast('已复制到剪贴板');
  }).catch(function() {
    showToast('复制失败，请手动选择文本复制');
  });
}

function showToast(msg) {
  var t = document.createElement('div');
  t.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(20,18,14,.95);border:1px solid rgba(201,168,76,.3);color:var(--paper);font-family:Noto Serif SC,serif;font-size:14px;padding:14px 24px;border-radius:8px;z-index:99999;text-align:center';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function() { t.remove(); }, 2000);
}

// 初始化
renderSymptomGrid();
