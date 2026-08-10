/* lifeindex-section.js — 从 divination-hub.html 提取的外部 JS */
/* R340: LCP 优化 — 125KB 内联 JS 抽出为外部文件，defer 加载 */

// ===== 纵向平铺导航 (R335) =====
var NAV_DATA = {
  zhouyi: {
    name: '周易术数', icon: '☰', value: '探索命运规律·辅助人生决策',
    groups: [
      { name: '排盘推演', items: [
        { icon:'乾', name:'八字排盘', desc:'四柱八字·十神格局·大运流年', source:'《渊海子平》', url:"javascript:showSection('bazi')" },
        { icon:'紫', name:'紫微斗数', desc:'主星宫位·四化大限·命运推演', source:'《紫微斗数全书》', url:"javascript:location.hash='#section-ziwei'" },
        { icon:'宅', name:'风水排盘', desc:'玄空飞星·宅命配卦', source:'《沈氏玄空学》', url:"javascript:window.location.href='fengshui-chart.html'" }
      ]},
      { name: '占卜决疑', items: [
        { icon:'爻', name:'六爻占卜', desc:'六亲六神·卦辞断事', source:'《增删卜易》', url:"javascript:showSection('zhanbu');showZhanbuSub('yijing')" },
        { icon:'奇', name:'奇门遁甲', desc:'八门九星·三奇六仪', source:'《烟波钓叟歌》', url:"javascript:showSection('zhanbu');showZhanbuSub('qimen')" },
        { icon:'梅', name:'梅花易数', desc:'体用生克·外应卦象', source:'《梅花易数》', url:"javascript:showSection('zhanbu');showZhanbuSub('meihua')" },
        { icon:'壬', name:'大六壬', desc:'四课三传·天将九宗', source:'《六壬大全》', url:"javascript:showSection('zhanbu');showZhanbuSub('liuren')" },
        { icon:'字', name:'测字占卜', desc:'汉字五行·即时起卦', source:'《测字秘碟》', url:"javascript:showSection('cezi')" }
      ]},
      { name: '环境调理', items: [
        { icon:'风', name:'风水玄空', desc:'峦头理气·卦位择日', source:'《青囊经》', url:"javascript:showSection('fengshui')" }
      ]},
      { name: '命理人生', items: [
        { icon:'相', name:'颜值命理', desc:'面相五官·三停五岳', source:'《麻衣神相》', url:"javascript:showSection('yanzhi')" },
        { icon:'名', name:'起名改名', desc:'五行补益·姓名分析', source:'', url:"javascript:showSection('xingming')" },
        { icon:'命', name:'人生蓝图', desc:'十年阶段·十二领域', source:'', url:"javascript:window.location.href='lifeplan-detail.html'" },
        { icon:'运', name:'年度运势', desc:'流年流月·太岁方位', source:'', url:"javascript:showSection('annual-fortune')" },
        { icon:'流', name:'流年报告', desc:'跨维度联动·流月大运', source:'', url:"javascript:window.location.href='lifeflow-report.html'" },
        { icon:'月', name:'逐月运势', desc:'月度细化·吉凶日历', source:'', url:"javascript:window.location.href='monthly-report.html'" }
      ]}
    ]
  },
  tcm: {
    name: '中医诊疗', icon: '医', value: '传统智慧守护健康·望诊体质辨证',
    groups: [
      { name: '望诊采集', items: [
        { icon:'望', name:'望诊工作台', desc:'面部舌象·AI视觉', source:'', url:"javascript:window.location.href='wangzhen-clinical.html'" },
        { icon:'诊', name:'望诊中心', desc:'望诊知识库+临床', source:'', url:"javascript:window.location.href='wangzhen-center.html'" },
        { icon:'录', name:'报告OCR', desc:'体检报告识别', source:'', url:"javascript:window.location.href='report-ocr.html'" },
        { icon:'采', name:'患者采集', desc:'患者信息采集表', source:'', url:"javascript:window.location.href='patient-intake.html'" }
      ]},
      { name: '诊疗分析', items: [
        { icon:'质', name:'体质辨识', desc:'九种体质·辨识调养', source:'《中医体质分类》', url:"javascript:showSection('tizhi')" },
        { icon:'医', name:'中医诊所', desc:'健康咨询·症状分析', source:'', url:"javascript:window.location.href='tcm-clinic.html'" },
        { icon:'症', name:'症状分析', desc:'周易中医联合分析', source:'', url:"javascript:window.location.href='tcm-symptom.html'" },
        { icon:'调', name:'体质调理', desc:'综合体质调理方案', source:'', url:"javascript:window.location.href='divination-integrated.html'" }
      ]},
      { name: '患者管理', items: [
        { icon:'档', name:'人物档案', desc:'5身份管理·风险评级', source:'', url:"javascript:location.hash='#section-person-dashboard'" },
        { icon:'患', name:'患者门户', desc:'患者档案·诊疗·健康', source:'', url:"javascript:window.location.href='patient-portal.html'" },
        { icon:'解', name:'报告解读', desc:'24项生化·四维融合', source:'', url:"javascript:location.hash='#section-report-interpret'" }
      ]},
      { name: '健康管理', items: [
        { icon:'居', name:'居家诊疗', desc:'居家陪护·个性化推送', source:'', url:"javascript:window.location.href='home-care.html'" },
        { icon:'预', name:'健康预测', desc:'健康趋势预测分析', source:'', url:"javascript:window.location.href='health-forecast.html'" },
        { icon:'控', name:'健康监控', desc:'健康数据监控看板', source:'', url:"javascript:window.location.href='health-monitor.html'" },
        { icon:'导', name:'健康指导', desc:'个性化健康指导方案', source:'', url:"javascript:window.location.href='wellness-guide.html'" }
      ]},
      { name: '医生端', items: [
        { icon:'师', name:'医生端', desc:'综合诊断工作台', source:'', url:"javascript:window.location.href='doctor-panel.html'" },
        { icon:'长', name:'医生(大字版)', desc:'老年友好版', source:'', url:"javascript:window.location.href='doctor-elder.html'" }
      ]}
    ]
  },
  knowledge: {
    name: '知识文化', icon: '文', value: '传承经典·知识布施·普惠众生',
    groups: [
      { name: '知识库', items: [
        { icon:'库', name:'知识库', desc:'54模块·12000+条目·FTS5', source:'', url:"javascript:window.location.href='divination-knowledge.html'" },
        { icon:'览', name:'KB浏览器', desc:'知识库浏览中心', source:'', url:"javascript:window.location.href='kb-explorer.html'" },
        { icon:'图', name:'知识图谱', desc:'模块关系可视化', source:'', url:"javascript:window.location.href='kb-graph.html'" },
        { icon:'审', name:'KB质量审计', desc:'知识库质量审计', source:'', url:"javascript:window.location.href='kb-quality.html'" },
        { icon:'中', name:'KB命中', desc:'KB命中仪表盘', source:'', url:"javascript:window.location.href='kb-hit-dashboard.html'" }
      ]},
      { name: '名师传承', items: [
        { icon:'倪', name:'倪师知识库', desc:'倪海厦中医国学', source:'', url:"javascript:window.location.href='nihaisha-knowledge.html'" },
        { icon:'舒', name:'舒晗知识库', desc:'舒晗奇门遁甲', source:'', url:"javascript:window.location.href='shuhan-knowledge.html'" },
        { icon:'学', name:'倪师学堂', desc:'系统化中医课程', source:'', url:"javascript:window.location.href='nihaisha-learning.html'" },
        { icon:'堂', name:'名师课堂', desc:'54命理大师讲堂', source:'', url:"javascript:window.location.href='master-class.html'" },
        { icon:'师', name:'名师档案', desc:'54大师全量档案', source:'', url:"javascript:window.location.href='masters.html'" },
        { icon:'诀', name:'口诀库', desc:'8大领域口诀', source:'', url:"javascript:window.location.href='koujue-gallery.html'" }
      ]},
      { name: '文化生活', items: [
        { icon:'俗', name:'民俗生活', desc:'黄历门户·民俗工具', source:'', url:"javascript:window.location.href='folklore-portal.html'" },
        { icon:'修', name:'修行参学', desc:'修行参学文化门户', source:'', url:"javascript:window.location.href='practice-portal.html'" },
        { icon:'音', name:'疗愈音乐', desc:'五行音疗·疗愈诊断', source:'', url:"javascript:showSection('healing-music')" }
      ]}
    ]
  },
  ops: {
    name: '运营运维', icon: '运', value: '系统运维·保障服务稳定运行',
    groups: [
      { name: '后台管理', items: [
        { icon:'管', name:'后台管理', desc:'系统后台管理面板', source:'', url:"javascript:window.location.href='admin.html'" },
        { icon:'商', name:'商城管理', desc:'商城后台管理', source:'', url:"javascript:window.location.href='admin-shop.html'" },
        { icon:'知', name:'KB管理', desc:'知识库管理面板', source:'', url:"javascript:window.location.href='admin-kb-panel.html'" },
        { icon:'通', name:'通知日志', desc:'通知日志管理', source:'', url:"javascript:window.location.href='admin-notify.html'" },
        { icon:'工', name:'工单管理', desc:'工单管理后台', source:'', url:"javascript:window.location.href='admin-tickets.html'" }
      ]},
      { name: '监控运维', items: [
        { icon:'屏', name:'运营大屏', desc:'运营监控大屏', source:'', url:"javascript:window.location.href='monitor-dashboard.html'" },
        { icon:'监', name:'监控门户', desc:'监控运维平台健康', source:'', url:"javascript:window.location.href='monitor-portal.html'" },
        { icon:'评', name:'评估看板', desc:'AI评估看板', source:'', url:"javascript:window.location.href='eval-dashboard.html'" },
        { icon:'设', name:'设备运维', desc:'设备运维中心', source:'', url:"javascript:window.location.href='device-management.html'" }
      ]},
      { name: 'AI与服务', items: [
        { icon:'AI', name:'智能助手', desc:'AI命理助手', source:'', url:"javascript:window.location.href='ai-assistant.html'" },
        { icon:'配', name:'引擎配置', desc:'视觉引擎配置', source:'', url:"javascript:window.location.href='ai-engine-config.html'" },
        { icon:'API', name:'API文档', desc:'OpenAPI 3.0 文档', source:'', url:"javascript:window.location.href='api-docs.html'" },
        { icon:'眼', name:'智能眼镜', desc:'智能眼镜控制台', source:'', url:"javascript:window.location.href='glass-console.html'" }
      ]}
    ]
  },
  user: {
    name: '用户服务', icon: '服', value: '账户管理·消息推送·商城会员',
    groups: [
      { name: '账户中心', items: [
        { icon:'登', name:'登录', desc:'用户登录', source:'', url:"javascript:window.location.href='login.html'" },
        { icon:'份', name:'身份管理', desc:'身份管理中心', source:'', url:"javascript:window.location.href='person-center.html'" },
        { icon:'档', name:'人物看板', desc:'人物档案看板', source:'', url:"javascript:window.location.href='person-dashboard.html'" }
      ]},
      { name: '商城会员', items: [
        { icon:'购', name:'商城', desc:'命理商城', source:'', url:"javascript:window.location.href='divination-shop.html'" },
        { icon:'员', name:'会员', desc:'会员服务', source:'', url:"javascript:window.location.href='divination-membership.html'" }
      ]},
      { name: '消息推送', items: [
        { icon:'推', name:'年度推送', desc:'我的年度推送', source:'', url:"javascript:window.location.href='yuanzhu-inbox.html'" },
        { icon:'信', name:'站内消息', desc:'站内消息', source:'', url:"javascript:window.location.href='im.html'" },
        { icon:'馈', name:'反馈', desc:'意见反馈中心', source:'', url:"javascript:window.location.href='feedback-center.html'" }
      ]},
      { name: '工具其他', items: [
        { icon:'微', name:'缘主工具', desc:'微信缘主工具', source:'', url:"javascript:window.location.href='wechat-hub.html'" },
        { icon:'报', name:'报告中心', desc:'报告中心', source:'', url:"javascript:window.location.href='reports-hub.html'" },
        { icon:'享', name:'分享', desc:'分享中心', source:'', url:"javascript:window.location.href='share-center.html'" },
        { icon:'隐', name:'隐私中心', desc:'隐私管理中心', source:'', url:"javascript:window.location.href='privacy-center.html'" }
      ]}
    ]
  },
  ai: {
    name: '智能分析', icon: '智', value: '人工智能辅助·智慧赋能决策',
    groups: [
      { name: '智能助手', items: [
        { icon:'AI', name:'AI命理助手', desc:'22模块智能问答', source:'', url:"javascript:window.location.href='ai-assistant.html'" },
        { icon:'配', name:'引擎配置', desc:'视觉引擎配置', source:'', url:"javascript:window.location.href='ai-engine-config.html'" },
        { icon:'API', name:'API文档', desc:'OpenAPI 3.0文档', source:'', url:"javascript:window.location.href='api-docs.html'" },
        { icon:'眼', name:'智能眼镜', desc:'智能眼镜控制台', source:'', url:"javascript:window.location.href='glass-console.html'" }
      ]},
      { name: '智能分析', items: [
        { icon:'八', name:'八字命盘', desc:'AI八字智能分析', source:'', url:"javascript:showSection('bazi')" },
        { icon:'运', name:'运势分析', desc:'AI运势推演', source:'', url:"javascript:showSection('annual-fortune')" },
        { icon:'财', name:'财运分析', desc:'AI财运预测', source:'', url:"javascript:showSection('bazi')" },
        { icon:'情', name:'感情分析', desc:'AI感情推演', source:'', url:"javascript:showSection('bazi')" },
        { icon:'医', name:'中医诊断', desc:'AI中医辨识', source:'', url:"javascript:showSection('tizhi')" },
        { icon:'音', name:'五行音疗', desc:'AI疗愈音乐', source:'', url:"javascript:showSection('healing-music')" },
        { icon:'图', name:'人生规划', desc:'AI人生蓝图', source:'', url:"javascript:window.location.href='lifeplan-detail.html'" },
        { icon:'指', name:'命理指数', desc:'10维度评分', source:'', url:"javascript:showSection('annual-fortune')" }
      ]}
    ]
  }
};

function renderNavFlat(){
  var container = document.getElementById('navFlat');
  if(!container) return;
  var html = '';
  for(var key in NAV_DATA){
    var sys = NAV_DATA[key];
    html += '<div class="nf-section">';
    html += '<div class="nf-title"><span class="nf-icon">'+sys.icon+'</span><span>'+sys.name+'</span></div>';
    html += '<div class="nf-value">'+(sys.value||'')+'</div>';
    html += '<div class="nf-cards">';
    sys.groups.forEach(function(g){
      g.items.forEach(function(c){
        var source = c.source ? '<div class="nf-source">'+c.source+'</div>' : '';
        html += '<a class="nf-card" href="'+c.url+'" title="'+c.name+' — '+c.desc+'">'+
          '<span class="nf-card-icon">'+c.icon+'</span>'+
          '<span class="nf-card-name">'+c.name+'</span>'+
          '<span class="nf-card-desc">'+c.desc+'</span>'+
          source+
          '</a>';
      });
    });
    html += '</div></div>';
  }
  container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', renderNavFlat);

function initSectionFlow(sid){
  if(typeof FlowEngine === 'undefined') return;
  var stepsMap = {
    bazi: {steps:['填写信息','排盘演算','查看结果','深度分析'], hint:'填写出生日期和时辰，点击排盘演算按钮。'},
    zhanbu: {steps:['选择卜法','输入问题','起卦分析','查看解读'], hint:'选择占卜方式，心中默念所问之事。'},
    yanzhi: {steps:['拍摄面相','智能分析','查看面相报告'], hint:'请在自然光下拍摄正面照。'},
    xingming: {steps:['输入姓名','选择性别','补充生辰','查看分析'], hint:'输入需要分析的姓名信息。'},
    tizhi: {steps:['填写问卷','AI辨识','查看体质','调养建议'], hint:'根据真实感受回答问题。'},
    fengshui: {steps:['输入宅向','选择元运','排盘分析','查看建议'], hint:'输入房屋坐向和建造年代。'},
    cezi: {steps:['输入汉字','拆解字形','五行分析','查看解读'], hint:'输入一个汉字，系统将拆解字形分析五行。'}
  };
  var cfg = stepsMap[sid];
  if(!cfg) return;
  var s = document.getElementById('section-' + sid);
  if(!s || s.querySelector('.flow-steps')) return;
  var div = document.createElement('div');
  div.innerHTML = '<div class="flow-steps">' + cfg.steps.map(function(st,i){return '<div class="flow-step active"><span class="flow-step-num">'+(i+1)+'</span><span>'+st+'</span></div>'+(i<cfg.steps.length-1?'<span class="flow-step-arrow">→</span>':'')}).join('') + '</div><div class="flow-hint">' + cfg.hint + '</div>';
  s.insertBefore(div, s.firstChild);
}// ===== 导航分组下拉菜单 (R324) =====
(function(){
  document.addEventListener('click',function(e){
    var trigger=e.target.closest('.nav-group-trigger');
    if(trigger){
      var group=trigger.closest('.nav-group');
      group.classList.toggle('open');
      e.stopPropagation();
      return;
    }
    // 点击外部关闭所有打开的菜单
    if(!e.target.closest('.nav-group')){
      document.querySelectorAll('.nav-group.open').forEach(function(g){g.classList.remove('open');});
    }
  });
})();

// ===== 核心 showSection（Tab 切换 + section 显隐）=====
window.showSection = function(name){
  // 移除所有 tab active
  document.querySelectorAll('.nav-tab').forEach(function(t){
    t.classList.remove('active');
    t.setAttribute('aria-selected','false');
  });
  // 隐藏所有 section
  document.querySelectorAll('.section').forEach(function(s){ s.hidden = true; s.classList.remove('active'); });
  // 激活目标
  var tab = document.getElementById('tab-' + name);
  var sec = document.getElementById('section-' + name);
  if(tab){ tab.classList.add('active'); tab.setAttribute('aria-selected','true'); }
  if(sec){ sec.hidden = false; sec.classList.add('active'); }
  // 搜索栏
  var sb = document.getElementById('searchBar');
  if(sb) sb.hidden = (name !== 'search');
  // 滚动到顶
  window.scrollTo({top:0, behavior:'smooth'});
  // R255: 触发懒加载（仅当目标有 data-lazy 且未加载）
  if(sec && typeof window._loadHubSection === 'function') {
    window._loadHubSection(name);
  }
  if(name !== 'hero') initSectionFlow(name);
};

// ===== 子导航切换（占卜 / 姓名 / 风水）=====
function showZhanbuSub(sub, btn){
  var subs = ['yijing','meihua','qimen','liuren','ziwei','cezi'];
  subs.forEach(function(s){
    var el = document.getElementById('zhanbuSub-' + s);
    if(el) el.style.display = (s === sub) ? 'block' : 'none';
  });
  if(btn){
    document.querySelectorAll('#section-zhanbu .zhanbu-subtab').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
  }
}
function showXingmingSub(sub, btn){
  var subs = ['rename','company','mobile','analyze'];
  subs.forEach(function(s){
    var el = document.getElementById('xingmingSub-' + s);
    if(el) el.style.display = (s === sub) ? 'block' : 'none';
  });
  if(btn){
    document.querySelectorAll('#section-xingming .zhanbu-subtab').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
  }
  // 触发对应初始化
  if(sub === 'rename' && typeof initRename === 'function') initRename();
  if(sub === 'company' && typeof initCompany === 'function') initCompany();
  if(sub === 'mobile' && typeof initMobile === 'function') initMobile();
  if(sub === 'analyze' && typeof initNameAnalyze === 'function') initNameAnalyze();
}
function showFengshuiSub(sub, btn){
  var subs = ['fengshui-content','luopan-content'];
  subs.forEach(function(s){
    var el = document.getElementById(s);
    if(el) el.style.display = (s === sub) ? 'block' : 'none';
  });
  if(btn){
    document.querySelectorAll('#section-fengshui .zhanbu-subtab, .zhanbu-subtab').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
  }
}

// ===== 更多功能菜单 =====
function openMore(){
  const m = document.getElementById('moreMenu');
  const o = document.getElementById('moreOverlay');
  if(m) m.style.display = 'block';
  if(o) o.style.display = 'block';
}
function closeMore(){
  const m = document.getElementById('moreMenu');
  const o = document.getElementById('moreOverlay');
  if(m) m.style.display = 'none';
  if(o) o.style.display = 'none';
}
function toggleMore(){
  const m = document.getElementById('moreMenu');
  if(!m) return;
  if(m.style.display === 'block') closeMore(); else openMore();
}

// ===== 本地数据导入导出 =====
function exportLocalData(){
  const keys = [];
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(k && !k.startsWith('_kb_hit') && !k.startsWith('_kb_se')) keys.push(k);
  }
  const data = {};
  keys.forEach(k => { try { data[k] = JSON.parse(localStorage.getItem(k)); } catch { data[k] = localStorage.getItem(k); } });
  const blob = new Blob([JSON.stringify({exported_at:new Date().toISOString(),count:keys.length,data},null,2)],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'mingli-baojian-data-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a); a.click();
  setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},100);
  if(window._toast) window._toast('\ud83d\udce4 \u5df2\u5bfc\u51fa '+keys.length+' \u6761\u672c\u5730\u6570\u636e',2000);
}
function importLocalData(){
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const obj = JSON.parse(ev.target.result);
        if(!obj.data) throw new Error('invalid format');
        let cnt = 0;
        for(const [k,v] of Object.entries(obj.data)){
          localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
          cnt++;
        }
        if(window._toast) window._toast('\ud83d\udce5 \u5df2\u5bfc\u5165 '+cnt+' \u6761\u6570\u636e\uff0c\u5237\u65b0\u751f\u6548',2000);
        setTimeout(()=>location.reload(),1500);
      } catch(err){
        if(window._toast) window._toast('\u26a0\ufe0f \u5bfc\u5165\u5931\u8d25\uff1a'+err.message,2000);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}
function clearAllLocalData(){
  if(!confirm('\u786e\u5b9a\u6e05\u7a7a\u5168\u90e8\u672c\u5730\u6570\u636e\uff1f\u6b64\u64cd\u4f5c\u4e0d\u53ef\u64a4\u9500\uff01')) return;
  localStorage.clear();
  if(window._toast) window._toast('\ud83d\uddd1\u5df2\u6e05\u7a7a\u5168\u90e8\u6570\u636e\uff0c\u5373\u5c06\u5237\u65b0',2000);
  setTimeout(()=>location.reload(),1500);
}

// ===== \u4fe1\u4ef0\u9009\u62e9 =====
function selectFaith(faith){
  document.querySelectorAll('.faith-card').forEach(c => c.classList.remove('selected'));
  const el = document.querySelector('.faith-card[onclick*="'+faith+'"]');
  if(el) el.classList.add('selected');
  localStorage.setItem('userFaith', faith);
  if(window._toast) window._toast('\u2705 \u5df2\u9009\u62e9\u4fe1\u4ef0\uff1a'+{ru:'\u5112',dao:'\u9053',fo:'\u4f5b'}[faith]||faith, 1500);
}

// ===== \u5bfa\u5e99\u6d4f\u89c8 =====
function showTempleBrowser(){
  if(window._toast) window._toast('\ud83c\udfdb\u540d\u5c71\u5bfa\u5e99\u6d4f\u89c8\u529f\u80fd\u5f00\u53d1\u4e2d...',1500);
}

function matchMyMingua(btn, suitableStr) {
  const card = btn.closest('.plan-card');
  let resultDiv = card.querySelector('.plan-match-result');
  if (!resultDiv) {
    resultDiv = document.createElement('div');
    resultDiv.className = 'plan-match-result';
    btn.parentNode.insertBefore(resultDiv, btn.nextSibling);
  }

  // 从 localStorage 获取八字
  const bazi = safeGetJSON('userBazi', {});
  let birthYear = bazi.year || null;
  if (!birthYear && bazi.birthday) {
    birthYear = parseInt(bazi.birthday.split('-')[0]);
  }
  if (!birthYear) {
    // 再查输入字段
    const yearInput = document.getElementById('bzYear');
    if (yearInput && yearInput.value) {
      birthYear = parseInt(yearInput.value);
    }
  }

  if (!birthYear || isNaN(birthYear)) {
    resultDiv.className = 'plan-match-result show nomatch';
    resultDiv.innerHTML = '⚠️ 请先在「八宅风水·命卦分析」中输入出生年份，或先在信众中心绑定八字信息';
    return;
  }

  const sexInput = document.getElementById('bzSex');
  const sex = (sexInput && sexInput.value) || bazi.sex || 'male';

  if (!sexInput || !sexInput.value) {
    resultDiv.className = 'plan-match-result show nomatch';
    resultDiv.innerHTML = '⚠️ 请先在「八宅风水·命卦分析」中选择性别';
    return;
  }

  const mingGua = getMingGua(birthYear, sex);
  const minguaName = mingGua.guaName;
  const minguaType = mingGua.type;

  const suitable = suitableStr.split(',').map(s => s.trim().replace('命',''));
  const isMatch = suitable.some(s => s === minguaName || s === '');

  if (isMatch) {
    resultDiv.className = 'plan-match-result show match';
    resultDiv.innerHTML = '✅ <b>匹配!</b>您的命卦为「' + minguaName + '命」(' + minguaType + '),此户型推荐「' + suitableStr + '」,完美契合!';
  } else {
    resultDiv.className = 'plan-match-result show nomatch';
    resultDiv.innerHTML = '⚠️ 您的命卦为「' + minguaName + '命」(' + minguaType + '),此户型推荐「' + suitableStr + '」,不太匹配。<br>💡 可通过风水布局调化，仅供参考。';
  }
}

// ================================================================
//  HELPER FUNCTIONS FOR HUAJIE MODULE
// ================================================================

function getMonthlyReport(hj) {
  const monthNames = ['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','腊月'];
  // 流月天干地支表（丙午年为例，按年干推算月干）
  // 月支固定: 寅卯辰巳午未申酉戌亥子丑（正月~十二月）
  // 月干由年干推算（五虎遁）
  const yearStemIdx = STEMS.indexOf(hj.pillars[0].stem);
  const monthBranches = ['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'];
  // 五虎遁: 甲己起丙寅, 乙庚起戊寅, 丙辛起庚寅, 丁壬起壬寅, 戊癸起甲寅
  const startMonthStemIdx = [2, 4, 6, 8, 0][yearStemIdx % 5]; // 甲己->丙(2), 乙庚->戊(4), 丙辛->庚(6), 丁壬->壬(8), 戊癸->甲(0)

  // 日主五行
  const dayStem = hj.dayStem;
  const dayEle = ELE[dayStem] || '木';
  const xiEle = hj.xiEle || '木';
  const jiEle = hj.strongestEle || '金';

  // 五行生克关系
  const shengMap = {'木':'火','火':'土','土':'金','金':'水','水':'木'}; // 生
  const keMap = {'木':'土','土':'水','水':'火','火':'金','金':'木'}; // 克
  const beiShengMap = {'木':'水','火':'木','土':'火','金':'土','水':'金'}; // 被生(生我者)
  const beiKeMap = {'木':'金','土':'木','水':'土','火':'水','金':'火'}; // 被克(克我者)

  // 根据日主五行与流月干支五行关系计算吉凶
  function computeMonthLuck(monthStem, monthZhi) {
    const stemEle = ELE[monthStem];
    const zhiEle = ZHI_ELE[monthZhi];
    // 综合月干月支五行
    const monthEle = stemEle === zhiEle ? stemEle : (stemEle + '/' + zhiEle);

    let score = 0;
    let luckArea = '综合';
    let desc = '';

    // 判断月支五行与日主关系
    if (zhiEle === dayEle) {
      score += 2; desc += '比劫当令，竞争与机遇并存。';
      luckArea = '事业';
    } else if (shengMap[zhiEle] === dayEle) {
      score += 3; desc += '印星护身(' + zhiEle + '生' + dayEle + ')，贵人相助。';
      luckArea = '学业';
    } else if (shengMap[dayEle] === zhiEle) {
      score += 2; desc += '食伤泄秀(' + dayEle + '生' + zhiEle + ')，才华发挥。';
      luckArea = '事业';
    } else if (keMap[dayEle] === zhiEle) {
      score += 2; desc += '财星当令(' + dayEle + '克' + zhiEle + ')，财运显现。';
      luckArea = '财运';
    } else if (keMap[zhiEle] === dayEle) {
      score -= 2; desc += '官杀克身(' + zhiEle + '克' + dayEle + ')，压力较大。';
      luckArea = '健康';
    }

    // 判断月干五行与日主关系
    if (stemEle === xiEle) {
      score += 1; desc += '月干' + stemEle + '为喜用，助力运势。';
    } else if (stemEle === jiEle) {
      score -= 1; desc += '月干' + stemEle + '为忌神，需防不利。';
    }

    // 判断是否与喜用神一致
    if (zhiEle === xiEle) {
      score += 2; desc += '月支' + zhiEle + '为喜用神，运势上扬。';
    } else if (zhiEle === jiEle) {
      score -= 1; desc += '月支' + zhiEle + '为忌神，需谨慎。';
    }

    // 特殊地支关系
    if (monthZhi === '午' || monthZhi === '子') {
      desc += '注意心脏、血液循环健康。';
    } else if (monthZhi === '卯' || monthZhi === '酉') {
      desc += '桃花星动，感情方面需留意。';
      if (luckArea === '综合') luckArea = '感情';
    }

    let overall;
    if (score >= 3) overall = '吉';
    else if (score <= -2) overall = '凶';
    else overall = '平';

    return { overall, luck: luckArea, desc, score };
  }

  // 动态生成月度数据
  // 通用月度运势参考（基于节气五行生克，非个性化排盘）
    const monthData = [];
  for (let i = 0; i < 12; i++) {
    const mStemIdx = (startMonthStemIdx + i) % 10;
    const mStem = STEMS[mStemIdx];
    const mZhi = monthBranches[i];
    const luck = computeMonthLuck(mStem, mZhi);
    const monthDesc = luck.desc || (monthNames[i] + '·' + mStem + mZhi + '月，' + luck.luck + '方面需关注。');
    monthData.push({
      month: monthNames[i],
      stem: mStem,
      zhi: mZhi,
      overall: luck.overall,
      luck: luck.luck,
      desc: monthDesc
    });
  }

  let html = '<div class="huajie-calendar">';
  for (let i = 0; i < 12; i++) {
    const m = monthData[i];
    let colorClass = 'month-neutral';
    if (m.overall === '吉') colorClass = 'month-good';
    else if (m.overall === '凶') colorClass = 'month-bad';
    html += '<ml-tap role="button" tabindex="0" class="month-item ' + colorClass + ' d-block" onclick="showMonthDetail(' + i + ')"';
    html += '<div style="font-size:13px;font-weight:600">' + m.month + '</ml-tap>';
    html += '<div style="font-size:10px;opacity:.95;margin-top:2px">' + m.stem + m.zhi + '</div>';
    html += '<div style="font-size:10px;margin-top:4px">' + m.overall + '</div>';
    html += '<div style="font-size:9px;opacity:.95;margin-top:2px">重点:' + m.luck + '</div>';
    html += '</div>';
  }
  html += '</div>';

  // 详细文字版(折叠)
  html += '<div style="margin-top:20px">';
  html += '<ml-tap role="button" tabindex="0" class="huajie-alert" style="display:block;" onclick="toggleHuajieDetail(this)"';
  html += '<div class="alert-title">📖 逐月详细分析(点击展开)</ml-tap>';
  html += '<div class="month-detail-content" style="display:none;margin-top:12px">';
  for (let i = 0; i < 12; i++) {
    const m = monthData[i];
    let color = 'var(--gold)';
    if (m.overall === '吉') color = 'var(--success)';
    else if (m.overall === '凶') color = 'var(--cinn2)';
    html += '<div style="margin-bottom:16px;padding:12px;background:rgba(255,255,255,.02);border-radius:6px">';
    html += '<div style="color:var(--gold);font-size:14px;margin-bottom:6px">' + m.month + ' · ' + m.stem + m.zhi + '</div>';
    html += '<p style="font-size:13px;line-height:1.8;opacity:0.85">' + m.desc + '</p>';
    html += '<div style="margin-top:6px;font-size:12px"><span style="color:' + color + '">' + m.overall + '</span> · 重点:' + m.luck + '</div>';
    html += '</div>';
  }
  html += '</div></div></div>';

  return html;
}

function getDimensionAdvice(hj) {
  const dayStem = hj.dayStem;
  const dayEle = ELE[dayStem] || '木';
  const xiEle = hj.xiEle;
  const mingGua = hj.mingGua || {type:'东四命'};

  let html = '<div class="analysis-grid" style="grid-template-columns:1fr 1fr">';

  // 事业
  const shiye = {
    tips: [
      '今年事业有升迁机会，尤其在夏季(火旺)把握时机',
      '办公室东方放绿色植物(文昌位)有助事业升迁',
      '与属龙、属蛇、属马的同事合作更顺利',
      '重大决策避开农历六月(7月底至8月底)'
    ],
    amulet: '文昌塔、白水晶球、绿色印章',
    fengshui: mingGua.type === '东四命' ? '座位朝东或朝南，背后有靠山' : '座位朝西或朝西南，背后靠实墙',
    avoid: '农历六月不签重要合同；避免与属鼠的人合作重大事项'
  };

  // 财运
  let caiyunTip3 = '宜从事';
  if (xiEle === '木') caiyunTip3 += '贸易、物流、木材、家具行业';
  else if (xiEle === '火') caiyunTip3 += '互联网、能源、餐饮、娱乐行业';
  else if (xiEle === '土') caiyunTip3 += '房地产、建筑、农业、矿产行业';
  else if (xiEle === '金') caiyunTip3 += '金融、珠宝、金属加工、法律行业';
  else caiyunTip3 += '运输、贸易、水利、物流行业';

  const caiyun = {
    tips: [
      '正财稳定，偏财一般，稳健投资为上',
      '财位在东南(2026年文昌位同位),放聚宝盆+黄水晶',
      caiyunTip3,
      '子日(阴历十一前后)和酉日(阴历十七前后)财运最旺'
    ],
    amulet: '黄水晶聚宝盆、五帝钱、貔貅',
    fengshui: '东南方放聚宝盆；大门对角线位置保持整洁；避免放置带刺植物',
    avoid: '不宜在农历六月进行大额投资；避免借钱给人'
  };

  // 感情
  let ganqingTips = [];
  if (hj.dayBranchIdx % 2 === 0) {
    ganqingTips = [
      '今年桃花旺，感情机会多，已婚者需自我约束',
      '女性宜在东南方放粉色水晶球增强姻缘运',
      '男性宜在正北方放红色花瓶增强感情',
      '农历二月和八月是感情月，好好把握'
    ];
  } else {
    ganqingTips = [
      '今年感情运平稳，单身者可积极相亲',
      '佩戴粉水晶手链增强桃花运',
      '农历三月的亥日和卯日感情运最旺',
      '多参加社交活动，扩大交际圈'
    ];
  }

  const ganqing = {
    tips: ganqingTips,
    amulet: '粉水晶手链、鸳鸯摆件、粉色花瓶',
    fengshui: '卧室朝东南最佳，床头朝东或朝东南；避免镜子对床',
    avoid: '避免在农历六月约会；避免与前任藕断丝连'
  };

  // 健康
  let jiankangTip2 = '';
  if (dayEle === '木') jiankangTip2 = '肝胆容易出问题，忌熬夜，多运动';
  else if (dayEle === '火') jiankangTip2 = '心火旺，易失眠多梦，宜修身养性';
  else if (dayEle === '土') jiankangTip2 = '脾胃易弱，忌暴饮暴食，规律饮食';
  else if (dayEle === '金') jiankangTip2 = '呼吸系统弱，忌抽烟，减少外出雾霾天';
  else jiankangTip2 = '肾水不足，忌过度劳累，规律作息';

  const jiankang = {
    tips: [
      '今年火旺，注意心脏、眼睛、血液方面健康',
      jiankangTip2,
      '春季多运动排毒；冬季早睡养藏'
    ],
    amulet: '黑曜石手链、玉石平安扣、本命佛',
    fengshui: '床头朝东最佳；卧室保持通风；忌在卧室摆放尖锐物品',
    avoid: '忌深夜加班；忌在床头放置电子设备；忌空腹跑步'
  };

  // 学业
  const xueye = {
    tips: [
      '文昌星照命，今年学业运佳，利考试',
      '书桌朝东最佳，案头放文昌笔或绿植',
      '考试前在考场附近走动有利临场发挥',
      '农历三四月考试运最旺，全力冲刺'
    ],
    amulet: '文昌笔、文昌塔、魁星笔、孔子画像',
    fengshui: '书桌位置朝东或朝东南，座位背后有实墙不靠窗',
    avoid: '书桌忌对门、忌对窗、忌背后空旷；忌熬夜通宵'
  };

  const dims = [
    {icon:'🚀', title:'事业运', data:shiye, color:'var(--cyan)'},
    {icon:'财', title:'财运', data:caiyun, color:'var(--gold)'},
    {icon:'情', title:'感情运', data:ganqing, color:'var(--cinn2)'},
    {icon:'康', title:'健康运', data:jiankang, color:'var(--jade)'},
    {icon:'学', title:'学业运', data:xueye, color:'var(--violet2)'}
  ];

  for (let d = 0; d < dims.length; d++) {
    const dim = dims[d];
    html += '<div class="analysis-card" style="border-left:3px solid ' + dim.color + '">';
    html += '<h5 style="color:' + dim.color + '">' + dim.icon + ' ' + dim.title + '</h5>';
    html += '<ul class="huajie-checklist">';
    for (let t = 0; t < dim.data.tips.length; t++) {
      html += '<li>' + dim.data.tips[t] + '</li>';
    }
    html += '</ul>';
    html += '<div class="huajie-row"><span class="op-90">开运饰品</span><span>' + dim.data.amulet + '</span></div>';
    html += '<div class="huajie-row"><span class="op-90">风水调整</span><span>' + dim.data.fengshui + '</span></div>';
    html += '<div class="huajie-row"><span style="opacity:.95;color:var(--cinn2)">忌</span><span>' + dim.data.avoid + '</span></div>';
    html += '</div>';
  }

  html += '</div>';
  return html;
}

function getTempleRecommendation(hj) {
  let html = '';

  html += '<div class="huajie-alert" style="margin-bottom:16px">';
  html += '<div class="alert-title">🏛️ 道观寺庙化煞指南</div>';
  html += '<p>化煞解难，诚心拜祭为先。以下为全国知名道观寺庙，按类型与功效分类推荐。建议提前电话预约，了解拜祭流程。</p>';
  html += '</div>';

  const temples = [
    {type:'☯️ 道观', rank:'第1名', name:'北京白云观', location:'北京市西城区白云观街', reason:'道教全真派祖庭，化解太岁、求财、求学最灵。2026年值太岁/冲太岁者必去。', amulet:'太岁符、平安符', price:'随缘乐助'},
    {type:'☯️ 道观', rank:'第2名', name:'武汉长春观', location:'湖北省武汉市武昌区', reason:'丘处机开创，全真派胜地。化解小人、求学、延寿最灵。', amulet:'文昌符、长生符', price:'随缘乐助'},
    {type:'☯️ 道观', rank:'第3名', name:'龙虎山天师府', location:'江西省鹰潭市贵溪市', reason:'道教正一派祖庭，张天师道场。化煞、驱邪、治病最灵验。', amulet:'天师符、护身符', price:'¥200-2000'},
    {type:'☯️ 道观', rank:'第4名', name:'成都青羊宫', location:'四川省成都市青羊区', reason:'老子青羊肆所在地。求财、化煞、平安最灵。农历二月十五老子诞辰香火最旺。', amulet:'太上老君符', price:'随缘乐助'},
    {type:'☯️ 道观', rank:'第5名', name:'武当山紫霄宫', location:'湖北省十堰市丹江口市', reason:'道教四大名山之一，化解太岁、延寿、学业皆灵。', amulet:'武当平安符', price:'¥100-500'},
    {type:'🪷 寺庙', rank:'第1名', name:'普陀山南海观音', location:'浙江省舟山市普陀区', reason:'观音菩萨道场，消灾解难、有求必应。事业、感情、健康、学业皆可求。', amulet:'观音咒轮、平安符', price:'随缘乐助'},
    {type:'🪷 寺庙', rank:'第2名', name:'五台山文殊寺', location:'山西省忻州市五台县', reason:'文殊菩萨道场，开智增慧、学业考试最灵。学生必去。', amulet:'文昌笔、智慧香', price:'¥50-300'},
    {type:'🪷 寺庙', rank:'第3名', name:'九华山肉身殿', location:'安徽省池州市青阳县', reason:'地藏菩萨道场，超度先人、消业障最灵。农历七月地藏月香火最旺。', amulet:'地藏咒轮、往生符', price:'随缘乐助'},
    {type:'🪷 寺庙', rank:'第4名', name:'灵隐寺', location:'浙江省杭州市西湖区', reason:'济公活佛道场，求平安、化解小人最灵验。', amulet:'平安符、化解符', price:'¥30-200'},
    {type:'🪷 寺庙', rank:'第5名', name:'雍和宫', location:'北京市东城区', reason:'格鲁派藏传佛教寺院，求财、化解小人、求学皆灵。', amulet:'开光唐卡、转运珠', price:'¥100-1000'}
  ];

  // 道观部分
  html += '<h5 style="font-size:13px;color:var(--jade);margin-bottom:12px;letter-spacing:3px">☯️ 道观推荐(化解太岁、驱邪、延寿)</h5>';
  html += '<div class="analysis-grid" style="grid-template-columns:1fr 1fr;gap:12px">';
  const daoTemples = temples.filter(function(t){return t.type==='☯️ 道观';});
  for (let i = 0; i < daoTemples.length; i++) {
    const t = daoTemples[i];
    html += '<ml-tap role="button" tabindex="0" class="analysis-card" style="display:block;border-color:rgba(39,174,96,.15);" onclick="showTempleDetail(\'' + t.name + '\')">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
    html += '<h5 style="color:var(--jade);font-size:14px;margin:0">' + t.name + '</h5>';
    html += '<span style="font-size:11px;padding:2px 6px;background:rgba(39,174,96,.1);color:var(--jade);border-radius:4px">' + t.rank + '</span>';
    html += '</ml-tap>';
    html += '<div class="huajie-row"><span class="op-90">地址</span><span style="font-size:12px">' + t.location + '</span></div>';
    html += '<div class="huajie-row"><span class="op-90">功效</span><span style="font-size:12px">' + t.reason.substring(0,30) + '...</span></div>';
    html += '<div class="huajie-row"><span class="op-90">可请法物</span><span style="font-size:12px">' + t.amulet + '</span></div>';
    html += '<div style="margin-top:8px;text-align:center"><button class="huajie-renew-btn" style="font-size:12px;padding:8px 20px">📍 查看详情</button></div>';
    html += '</div>';
  }
  html += '</div>';

  // 寺庙部分
  html += '<h5 style="font-size:13px;color:var(--violet);margin:20px 0 12px;letter-spacing:3px">🪷 寺庙推荐(消业、增慧、求愿)</h5>';
  html += '<div class="analysis-grid" style="grid-template-columns:1fr 1fr;gap:12px">';
  const foTemples = temples.filter(function(t){return t.type==='🪷 寺庙';});
  for (let i = 0; i < foTemples.length; i++) {
    const t = foTemples[i];
    html += '<ml-tap role="button" tabindex="0" class="analysis-card" style="display:block;border-color:rgba(142,68,173,.15);" onclick="showTempleDetail(\'' + t.name + '\')">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
    html += '<h5 style="color:var(--violet);font-size:14px;margin:0">' + t.name + '</h5>';
    html += '<span style="font-size:11px;padding:2px 6px;background:rgba(142,68,173,.1);color:var(--violet);border-radius:4px">' + t.rank + '</span>';
    html += '</ml-tap>';
    html += '<div class="huajie-row"><span class="op-90">地址</span><span style="font-size:12px">' + t.location + '</span></div>';
    html += '<div class="huajie-row"><span class="op-90">功效</span><span style="font-size:12px">' + t.reason.substring(0,30) + '...</span></div>';
    html += '<div class="huajie-row"><span class="op-90">可请法物</span><span style="font-size:12px">' + t.amulet + '</span></div>';
    html += '<div style="margin-top:8px;text-align:center"><button class="huajie-renew-btn" style="font-size:12px;padding:8px 20px">📍 查看详情</button></div>';
    html += '</div>';
  }
  html += '</div>';

  // 还愿提醒
  html += '<div class="huajie-renew-box" style="margin-top:20px">';
  html += '<div class="renew-title">🙏 还愿提醒</div>';
  html += '<div class="renew-desc">';
  html += '愿望达成后必须还愿，否则运势反噬。建议:<br>';
  html += '• 愿望实现后一个月内到许愿的道观/寺庙还愿<br>';
  html += '• 还愿方式:供奉香火、添油、挂灯笼、写牌位<br>';
  html += '• 还愿时带齐当初许愿时承诺的物品，如数奉还<br>';
  html += '• 农历每月初一、十五是还愿吉日<br>';
  html += '• 可提前在年初制定还愿计划，年底前完成本年度所有许愿还愿';
  html += '</div></div>';

  return html;
}

function toggleHuajieDetail(el) {
  const content = el.querySelector('.month-detail-content');
  if (content.style.display === 'none') {
    content.style.display = 'block';
  } else {
    content.style.display = 'none';
  }
}

function showMonthDetail(idx) {
  const monthNames = ['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','腊月'];
  showToast('查看' + monthNames[idx] + '详细分析');
}

function showTempleDetail(name) {
  const details = {
    '北京白云观': '地址:北京市西城区白云观街9号 | 电话:010-63463511 | 开放时间:8:00-16:30 | 门票:10元 | 特色:太岁殿供奉60位太岁星君，每位太岁均有专属化解符。化解太岁请到太岁殿，求学请到文昌殿。',
    '龙虎山天师府': '地址:江西省鹰潭市贵溪市龙虎山镇 | 电话:0701-6651009 | 开放时间:7:30-17:30 | 门票:通票150元 | 特色:正一派祖庭，化煞、驱邪、治病最灵。可提前预约天师府道长进行个人科仪。',
    '普陀山南海观音': '地址:浙江省舟山市普陀区普陀山 | 电话:0580-6091024 | 开放时间:6:00-18:00 | 门票:淡季140元/旺季160元 | 特色:观音道场，有求必应。建议从南海观音立像开始参拜，一路向上至普济寺。'
  };
  const detail = details[name] || '详细信息请电话咨询或访问官网。';
  showToast('📍 ' + name + '\n' + detail);
}

// ===== 时辰功能升级 =====
function onCalendarModeChange() {
  const mode = document.querySelector('input[name="calendarMode"]:checked').value;
  const hint = document.getElementById('calendarHint');
  const solarDateInput = document.getElementById('baziDate');
  const lunarArea = document.getElementById('lunarInputArea');

  if (mode === 'lunar') {
    // Switching to lunar: try to convert existing solar date
    if (solarDateInput && solarDateInput.value) {
      let parts = solarDateInput.value.split('-');
      let sy = parseInt(parts[0]), sm = parseInt(parts[1]), sd = parseInt(parts[2]);
      let lunar = solarToLunar(sy, sm, sd);
      if (lunar) {
        let lyEl = document.getElementById('lunarYear');
        let lmEl = document.getElementById('lunarMonth');
        let ldEl = document.getElementById('lunarDay');
        let lpEl = document.getElementById('lunarLeapMonth');
        if (lyEl) lyEl.value = lunar.year;
        if (lmEl) lmEl.value = lunar.month;
        if (ldEl) ldEl.value = lunar.day;
        if (lpEl) lpEl.checked = lunar.isLeap;
        if (typeof onLunarInput === 'function') onLunarInput();
      }
    }
    if (solarDateInput) solarDateInput.style.display = 'none';
    if (lunarArea) lunarArea.style.display = 'flex';
    if (hint) hint.textContent = '当前:农历输入(农历以子时23:00为一日之始)';
  } else {
    // Switching to solar: try to convert existing lunar date
    let lyEl2 = document.getElementById('lunarYear');
    let lmEl2 = document.getElementById('lunarMonth');
    let ldEl2 = document.getElementById('lunarDay');
    let lpEl2 = document.getElementById('lunarLeapMonth');
    if (lyEl2 && lyEl2.value && lmEl2 && lmEl2.value && ldEl2 && ldEl2.value) {
      let solar = lunarToSolar(parseInt(lyEl2.value), parseInt(lmEl2.value), parseInt(ldEl2.value), lpEl2 ? lpEl2.checked : false);
      if (solar && solarDateInput) {
        let mm = String(solar.month).padStart(2, '0');
        let dd = String(solar.day).padStart(2, '0');
        solarDateInput.value = solar.year + '-' + mm + '-' + dd;
      }
    }
    if (solarDateInput) solarDateInput.style.display = '';
    if (lunarArea) lunarArea.style.display = 'none';
    if (hint) hint.textContent = '当前:公历输入';
  }
}

// 人生规划历法切换
function onLpCalModeChange() {
  let modeEl = document.querySelector('input[name="lifeplanCalMode"]:checked');
  if (!modeEl) return;
  let mode = modeEl.value;
  let hint = document.getElementById('lpCalHint');
  let solarInput = document.getElementById('lpSolarInput');
  let lunarInput = document.getElementById('lpLunarInput');
  if (mode === 'lunar') {
    // Convert solar to lunar
    let dateEl = document.getElementById('lifeplanDate');
    if (dateEl && dateEl.value) {
      let parts = dateEl.value.split('-');
      let lunar = solarToLunar(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
      if (lunar) {
        let ly = document.getElementById('lpLunarYear');
        let lm = document.getElementById('lpLunarMonth');
        let ld = document.getElementById('lpLunarDay');
        let lp = document.getElementById('lpLunarLeap');
        if (ly) ly.value = lunar.year;
        if (lm) lm.value = lunar.month;
        if (ld) ld.value = lunar.day;
        if (lp) lp.checked = lunar.isLeap;
      }
    }
    if (solarInput) solarInput.style.display = 'none';
    if (lunarInput) lunarInput.style.display = 'flex';
    if (hint) hint.textContent = '当前:农历输入';
  } else {
    // Convert lunar to solar
    let ly2 = document.getElementById('lpLunarYear');
    let lm2 = document.getElementById('lpLunarMonth');
    let ld2 = document.getElementById('lpLunarDay');
    let lp2 = document.getElementById('lpLunarLeap');
    if (ly2 && ly2.value && lm2 && lm2.value && ld2 && ld2.value) {
      let solar = lunarToSolar(parseInt(ly2.value), parseInt(lm2.value), parseInt(ld2.value), lp2 ? lp2.checked : false);
      if (solar) {
        let dateEl2 = document.getElementById('lifeplanDate');
        if (dateEl2) dateEl2.value = solar.year + '-' + String(solar.month).padStart(2,'0') + '-' + String(solar.day).padStart(2,'0');
      }
    }
    if (solarInput) solarInput.style.display = '';
    if (lunarInput) lunarInput.style.display = 'none';
    if (hint) hint.textContent = '当前:公历输入';
  }
}

function onYouthCalModeChange() {
  let modeEl = document.querySelector('input[name="youthCalMode"]:checked');
  if (!modeEl) return;
  let mode = modeEl.value;
  let hint = document.getElementById('youthCalHint');
  let solarInput = document.getElementById('youthSolarInput');
  let lunarInput = document.getElementById('youthLunarInput');
  if (mode === 'lunar') {
    let dateEl = document.getElementById('youthDate');
    if (dateEl && dateEl.value) {
      let parts = dateEl.value.split('-');
      let lunar = solarToLunar(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
      if (lunar) {
        let ly = document.getElementById('youthLunarYear');
        let lm = document.getElementById('youthLunarMonth');
        let ld = document.getElementById('youthLunarDay');
        let lp = document.getElementById('youthLunarLeap');
        if (ly) ly.value = lunar.year;
        if (lm) lm.value = lunar.month;
        if (ld) ld.value = lunar.day;
        if (lp) lp.checked = lunar.isLeap;
      }
    }
    if (solarInput) solarInput.style.display = 'none';
    if (lunarInput) lunarInput.style.display = 'flex';
    if (hint) hint.textContent = '当前:农历输入';
  } else {
    let ly2 = document.getElementById('youthLunarYear');
    let lm2 = document.getElementById('youthLunarMonth');
    let ld2 = document.getElementById('youthLunarDay');
    let lp2 = document.getElementById('youthLunarLeap');
    if (ly2 && ly2.value && lm2 && lm2.value && ld2 && ld2.value) {
      let solar = lunarToSolar(parseInt(ly2.value), parseInt(lm2.value), parseInt(ld2.value), lp2 ? lp2.checked : false);
      if (solar) {
        let dateEl2 = document.getElementById('youthDate');
        if (dateEl2) dateEl2.value = solar.year + '-' + String(solar.month).padStart(2,'0') + '-' + String(solar.day).padStart(2,'0');
      }
    }
    if (solarInput) solarInput.style.display = '';
    if (lunarInput) lunarInput.style.display = 'none';
    if (hint) hint.textContent = '当前:公历输入';
  }
}

// 命理全鉴历法切换
function onLiCalModeChange() {
  let modeEl = document.querySelector('input[name="liCalMode"]:checked');
  if (!modeEl) return;
  let mode = modeEl.value;
  let hint = document.getElementById('liCalHint');
  let solarInput = document.getElementById('liSolarInput');
  let lunarInput = document.getElementById('liLunarInput');
  if (mode === 'lunar') {
    let dateEl = document.getElementById('liDate');
    if (dateEl && dateEl.value) {
      let parts = dateEl.value.split('-');
      let lunar = solarToLunar(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
      if (lunar) {
        let ly = document.getElementById('liLunarYear');
        let lm = document.getElementById('liLunarMonth');
        let ld = document.getElementById('liLunarDay');
        let lp = document.getElementById('liLunarLeap');
        if (ly) ly.value = lunar.year;
        if (lm) lm.value = lunar.month;
        if (ld) ld.value = lunar.day;
        if (lp) lp.checked = lunar.isLeap;
      }
    }
    if (solarInput) solarInput.style.display = 'none';
    if (lunarInput) lunarInput.style.display = 'flex';
    if (hint) hint.textContent = '当前:农历输入';
  } else {
    let ly2 = document.getElementById('liLunarYear');
    let lm2 = document.getElementById('liLunarMonth');
    let ld2 = document.getElementById('liLunarDay');
    let lp2 = document.getElementById('liLunarLeap');
    if (ly2 && ly2.value && lm2 && lm2.value && ld2 && ld2.value) {
      let solar = lunarToSolar(parseInt(ly2.value), parseInt(lm2.value), parseInt(ld2.value), lp2 ? lp2.checked : false);
      if (solar) {
        let dateEl2 = document.getElementById('liDate');
        if (dateEl2) dateEl2.value = solar.year + '-' + String(solar.month).padStart(2,'0') + '-' + String(solar.day).padStart(2,'0');
      }
    }
    if (solarInput) solarInput.style.display = '';
    if (lunarInput) lunarInput.style.display = 'none';
    if (hint) hint.textContent = '当前:公历输入';
  }
}

/* === PRO-FIELDS PANEL LOGIC === */
function _pfGet(id){const el=document.getElementById(id);return el?el.value.trim():'';}
function _pfSet(id,v){const el=document.getElementById(id);if(el)el.value=v||'';}

function toggleProPanel(){
  const p=document.getElementById('proPanel');
  const t=document.getElementById('proExpandToggle');
  if(!p||!t)return;
  if(p.classList.contains('show')){p.classList.remove('show');t.classList.remove('open');}
  else{p.classList.add('show');t.classList.add('open');renderProConcerns();updateProProgress();}
}

function renderProConcerns(){
  const box=document.getElementById('pf_concerns');
  if(!box)return;
  if(box.dataset.rendered==='1')return;
  const list=(window.MLBJ_USER&&window.MLBJ_USER.ALL_CONCERNS)||['运势','健康','婚姻','事业','财运','学业','风物'];
  box.innerHTML=list.map(c=>`<span class="pro-concern" data-c="${c}">${c}</span>`).join('');
  box.querySelectorAll('.pro-concern').forEach(el=>{
    el.addEventListener('click',()=>{el.classList.toggle('active');});
  });
  box.dataset.rendered='1';
}

function updateProProgress(){
  const p=window.MLBJ_USER?window.MLBJ_USER.getCompleteness():0;
  const fill=document.getElementById('proProgressFill');
  const text=document.getElementById('proProgressText');
  const inline=document.getElementById('proProgressInline');
  if(fill)fill.style.width=p+'%';
  if(text)text.textContent=p+'%';
  if(inline)inline.textContent=p+'%';
}

function loadProFields(){
  if(!window.MLBJ_USER){console.warn('MLBJ_USER 未加载');return;}
  const p=window.MLBJ_USER.load();
  _pfSet('pf_timeUnknown',p.birth.timeUnknown?'1':'0');
  _pfSet('pf_minute',p.birth.minute);
  _pfSet('pf_realTime',''); /* 实时计算不在此处 */
  _pfSet('pf_bpFull',p.birthplace.fullName);
  _pfSet('pf_bpProvince',p.birthplace.province);
  _pfSet('pf_bpCity',p.birthplace.city);
  _pfSet('pf_bpLng',p.birthplace.lng);
  _pfSet('pf_bpLat',p.birthplace.lat);
  _pfSet('pf_bpAlt',p.birthplace.altitude);
  _pfSet('pf_rsFull',p.residence.fullName);
  _pfSet('pf_rsProvince',p.residence.province);
  _pfSet('pf_rsMovedAt',p.residence.movedAt);
  _pfSet('pf_faName',p.family.father.name);
  _pfSet('pf_faDate',p.family.father.birth.year?`${p.family.father.birth.year}-${String(p.family.father.birth.month).padStart(2,'0')}-${String(p.family.father.birth.day).padStart(2,'0')}`:'');
  _pfSet('pf_moName',p.family.mother.name);
  _pfSet('pf_moDate',p.family.mother.birth.year?`${p.family.mother.birth.year}-${String(p.family.mother.birth.month).padStart(2,'0')}-${String(p.family.mother.birth.day).padStart(2,'0')}`:'');
  _pfSet('pf_spName',p.family.spouse.name);
  _pfSet('pf_spDate',p.family.spouse.birth.year?`${p.family.spouse.birth.year}-${String(p.family.spouse.birth.month).padStart(2,'0')}-${String(p.family.spouse.birth.day).padStart(2,'0')}`:'');
  _pfSet('pf_industry',p.occupation.industry);
  _pfSet('pf_position',p.occupation.position);
  _pfSet('pf_isEntrepreneur',p.occupation.isEntrepreneur?'1':'0');
  _pfSet('pf_tizhi',p.health.tizhi);
  _pfSet('pf_height',p.health.height);
  _pfSet('pf_weight',p.health.weight);
  _pfSet('pf_chronic',(p.health.chronicDiseases||[]).join(','));
  _pfSet('pf_surname',p.naming.surname);
  _pfSet('pf_genChar',p.naming.generationChar);
  _pfSet('pf_isCompound',p.naming.isCompoundSurname?'1':'0');
  _pfSet('pf_avoidChars',p.naming.avoidChars);
  /* 关切 */
  renderProConcerns();
  setTimeout(()=>{
    const box=document.getElementById('pf_concerns');
    if(!box)return;
    box.querySelectorAll('.pro-concern').forEach(el=>{
      if(p.concerns.indexOf(el.dataset.c)>=0)el.classList.add('active');
    });
  },50);
  updateProProgress();
  showProTip('已从档案载入','var(--gold)');
}

function saveProFields(){
  if(!window.MLBJ_USER){console.warn('MLBJ_USER 未加载');return;}
  window.MLBJ_USER.mergeBirth({timeUnknown:_pfGet('pf_timeUnknown')==='1',minute:_pfGet('pf_minute')});
  window.MLBJ_USER.mergeBirthplace({fullName:_pfGet('pf_bpFull'),province:_pfGet('pf_bpProvince'),city:_pfGet('pf_bpCity'),lng:_pfGet('pf_bpLng'),lat:_pfGet('pf_bpLat'),altitude:_pfGet('pf_bpAlt')});
  window.MLBJ_USER.mergeResidence({fullName:_pfGet('pf_rsFull'),province:_pfGet('pf_rsProvince'),movedAt:_pfGet('pf_rsMovedAt')});
  const fa=_pfGet('pf_faDate').split('-');const mo=_pfGet('pf_moDate').split('-');const sp=_pfGet('pf_spDate').split('-');
  window.MLBJ_USER.mergeFamily({father:{name:_pfGet('pf_faName'),birth:{year:fa[0]||'',month:fa[1]||'',day:fa[2]||''}},mother:{name:_pfGet('pf_moName'),birth:{year:mo[0]||'',month:mo[1]||'',day:mo[2]||''}},spouse:{name:_pfGet('pf_spName'),birth:{year:sp[0]||'',month:sp[1]||'',day:sp[2]||''}}});
  window.MLBJ_USER.mergeOccupation({industry:_pfGet('pf_industry'),position:_pfGet('pf_position'),isEntrepreneur:_pfGet('pf_isEntrepreneur')==='1'});
  window.MLBJ_USER.mergeHealth({tizhi:_pfGet('pf_tizhi'),height:_pfGet('pf_height'),weight:_pfGet('pf_weight'),chronicDiseases:_pfGet('pf_chronic').split(/[,,]/).map(s=>s.trim()).filter(Boolean)});
  window.MLBJ_USER.mergeNaming({surname:_pfGet('pf_surname'),generationChar:_pfGet('pf_genChar'),isCompoundSurname:_pfGet('pf_isCompound')==='1',avoidChars:_pfGet('pf_avoidChars')});
  const box=document.getElementById('pf_concerns');
  const concerns=box?Array.from(box.querySelectorAll('.pro-concern.active')).map(el=>el.dataset.c):[];
  if(concerns.length)window.MLBJ_USER.mergeConcerns(concerns);
  updateProProgress();
  showProTip('✅ 已保存到本地档案','var(--jade)');
}

function applyPro2Bazi(){
  if(!window.MLBJ_USER){console.warn('MLBJ_USER 未加载');return;}
  const p=window.MLBJ_USER.fillBaziForm('bazi');
  if(p.birthplace.fullName||p.birthplace.city){
    _pfSet('baziBirthplace',p.birthplace.fullName||p.birthplace.city);
    _pfSet('baziLng',p.birthplace.lng);
  }
  if(p.residence.fullName||p.residence.city){
    _pfSet('baziResidence',p.residence.fullName||p.residence.city);
  }
  showProTip('✅ 八字段已录入','var(--jade)');
}

var _proTipTimer=null;
function showProTip(msg,color){
  const t=document.getElementById('proSavedTip');
  if(!t)return;
  t.textContent=msg;
  t.style.color=color||'var(--jade)';
  t.classList.add('show');
  clearTimeout(_proTipTimer);
  _proTipTimer=setTimeout(()=>t.classList.remove('show'),1800);
}

/* 页面加载后默认渲染进度与面板状态 */
window.addEventListener('DOMContentLoaded',()=>{
  // perf: pro 面板延后 idle
  const _proInit = () => { renderProConcerns(); updateProProgress(); };
  if ('requestIdleCallback' in window) requestIdleCallback(_proInit, { timeout: 2500 });
  else setTimeout(_proInit, 800);

  // R255 hash 路由：跳转后页面丢失样式修复
  // 支持 #section-bazi / #section-person-dashboard / #section-report-interpret
  // 外部跳转时附 #section-xxx 进入后自动跳对应子页
  setTimeout(()=>{
    const h=location.hash;
    if(h && h.startsWith('#section=')){
      const key=h.slice(9).trim();
      // 白名单：section key 或外链页
      const INTERNAL = ['hero','bazi','zhanbu','fengshui','xingming','jiuri','more','annual-fortune','healing-music','user','fengshui-pro','yanzhi','masters','lifeplan','tizhi','yijing','qimen','ziwei','meihua','liuren','tcm','cases','shop','push-plan'];
      const EXTERNAL = {
        'person-dashboard':'person-dashboard.html',
        'report-interpret':'report-interpret.html'
      };
      if(INTERNAL.includes(key)){
        try{showSection(key)}catch(e){console.warn('[hash] section 跳转失败',key,e)}
      }else if(EXTERNAL[key]){
        location.href = EXTERNAL[key];
      }
    }
  },50);
});

function onShichenChange() {
  const hourVal = document.getElementById('baziHour').value;
  if (!hourVal) return;
  const shichenNames = ['', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子'];
  const idx = parseInt(hourVal) >= 23 ? 0 : Math.floor(parseInt(hourVal) / 2) + 1;
  const sName = idx === 0 ? '子' : shichenNames[idx];
  showToast('已选择:' + sName + '时(' + hourVal + ':00-' + (parseInt(hourVal)+2)%24 + ':00)');
}

function toggleShichenTable() {
  const tbl = document.getElementById('shichenTable');
  tbl.style.display = tbl.style.display === 'none' ? 'block' : 'none';
}

// 大运天干地支组合专业解读
function getGanZhiDayunDesc(gan, zhi, dayStemIdx) {
  const ganEle = ELE[gan];
  const zhiEle = ELE[zhi];
  const rel = getTenGod(gan, zhi, STEMS[dayStemIdx]);
  const dayMaster = STEMS[dayStemIdx];
  const dayEle = ELE[dayMaster];

  // 天干地支生克关系
  const ganShengZhi = ganEle && zhiEle && (ganEle === getSheng(zhiEle));
  const zhiShengGan = zhiEle && ganEle && (zhiEle === getSheng(ganEle));
  const ganKeZhi = ganEle && zhiEle && (ganEle === getKe(zhiEle));
  const zhiKeGan = zhiEle && ganEle && (zhiEle === getKe(ganEle));

  let desc = '';
  if (ganShengZhi) desc = '天干生地支，运途顺畅，外力相助';
  else if (zhiShengGan) desc = '地支生天干，根基稳固，内在发力';
  else if (ganKeZhi) desc = '天干克地支，主动进取，但有阻碍';
  else if (zhiKeGan) desc = '地支克天干，压力较大，需守成';
  else desc = '干支比和，平稳过渡，宜静不宜动';

  // 加入十神解读
  const relDesc = {
    '正官': '事业有成，名声在外', '七杀': '竞争激烈，需防小人',
    '正印': '学业进步，贵人相助', '偏印': '智慧开启，但防孤僻',
    '正财': '财运亨通，正道求财', '偏财': '意外之财，但防冒进',
    '食神': '福禄双全，享受生活', '伤官': '才华横溢，但防傲气',
    '比肩': '朋友相助，但防分利', '劫财': '竞争加剧，需防破财'
  };
  desc += '。' + (relDesc[rel] || '运势平稳');

  return desc;
}

// 大运详细解读
function showDayunDetail(idx) {
  const dayun = window._currentDayun || [];
  if (!dayun[idx]) return;
  const d = dayun[idx];
  const dayStemIdx = window._currentDayStemIdx || 0;

  document.getElementById('dayunDetail').style.display = 'block';
  document.getElementById('dayunDetailTitle').textContent = `第${d.index}步大运 ${d.gan}${d.zhi}(${d.ageStart}-${d.ageEnd}岁)`;

  let html = '';

  // 1. 基本属性
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-bottom:16px">';
  html += `<div class="huajie-row"><span class="op-90">天干</span><span>${d.gan}(${d.ganEle})</span></div>`;
  html += `<div class="huajie-row"><span class="op-90">地支</span><span>${d.zhi}(${d.zhiEle})</span></div>`;
  html += `<div class="huajie-row"><span class="op-90">十神</span><span>${d.rel}</span></div>`;
  if (d.ganShen) html += `<div class="huajie-row"><span class="op-90">天干十神</span><span>${d.ganShen}</span></div>`;
  if (d.zhiShen) html += `<div class="huajie-row"><span class="op-90">藏干十神</span><span>${d.zhiShen}</span></div>`;
  if (d.dishi) html += `<div class="huajie-row"><span class="op-90">长生十二宫</span><span>${d.dishi}</span></div>`;
  if (d.qiyunDetail) html += `<div class="huajie-row"><span class="op-90">起运</span><span>${d.qiyunDetail}</span></div>`;
  html += `<div class="huajie-row"><span class="op-90">五行生克</span><span>${d.ganZhiDesc.split('。')[0]}</span></div>`;
  html += '</div>';

  // 2. 专业解读(5个维度)
  html += '<h6 style="color:var(--gold);letter-spacing:2px;margin:16px 0 8px">📊 五维解读</h6>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">';

  const dimensions = [
    {name:'事业', key:'career', tips:['官印相生，事业有成','食伤生财，创意变现','比劫争财，竞争压力','印星护身，贵人相助']},
    {name:'财运', key:'wealth', tips:['财星得地，财运亨通','财多身弱，需防破财','偏财透出，意外之财','正财稳固，勤劳得财']},
    {name:'婚姻', key:'marriage', tips:['财官双美，婚姻和谐','桃花星动，缘分将至','比劫争夫/妻，感情竞争','印星护婚，家庭稳定']},
    {name:'健康', key:'health', tips:['五行调和，身体健康','忌神肆虐，需防疾病','印星护身，逢凶化吉','食伤泄秀，注意饮食']},
    {name:'学业', key:'study', tips:['印星旺相，学业进步','食伤泄秀，才华横溢','官星得地，考试顺利','忌神克制，需防分心']}
  ];

  dimensions.forEach(dim => {
    const score = computeDimensionScore(d, dim.key, dayStemIdx);
    const stars = '★'.repeat(Math.floor(score/2)) + '☆'.repeat(5-Math.floor(score/2));
    const tip = dim.tips[new Date().getDate() % dim.tips.length];
    html += `<div style="padding:12px;background:rgba(255,255,255,.02);border-radius:8px">
      <div style="font-size:12px;opacity:.95;margin-bottom:4px">${dim.name}</div>
      <div style="font-size:14px;color:var(--gold);margin-bottom:4px">${stars}</div>
      <div style="font-size:11px;opacity:0.85;line-height:1.6">${tip}</div>
    </div>`;
  });
  html += '</div>';

  // 3. 年度重点
  html += '<h6 style="color:var(--gold);letter-spacing:2px;margin:16px 0 8px">📅 年度重点(此大运期间)</h6>';
  html += `<div style="font-size:12px;line-height:2;opacity:0.85">`;
  html += `<div>· ${d.yearStart}-${d.yearStart+4}年:奠基期，宜稳扎稳打，积累资源</div>`;
  html += `<div>· ${d.yearStart+5}-${d.yearStart+9}年:发展期，运势上扬，可大胆进取</div>`;
  html += `<div>· ${d.yearEnd-4}-${d.yearEnd}年:收获期，成果显现，但防盛极而衰</div>`;
  html += `</div>`;

  // 4. 化解建议
  html += '<h6 style="color:var(--gold);letter-spacing:2px;margin:16px 0 8px">🛡️ 化解建议</h6>';
  if (d.isJi) {
    html += `<div class="huajie-alert" style="border-color:rgba(231,76,60,.3);background:rgba(231,76,60,.06)">`;
    html += `<div class="alert-title">⚠️ 此步大运含忌神</div>`;
    html += `<p style="margin-top:8px;line-height:1.8">建议:佩戴${getKe(d.ganEle)}属性饰品化解，避免${d.ganEle}方位发展，多行善事积累福报。</p>`;
    html += `</div>`;
  } else if (d.isXi) {
    html += `<div class="huajie-alert" style="border-color:rgba(46,204,113,.3);background:rgba(46,204,113,.06)">`;
    html += `<div class="alert-title">★ 此步大运含喜用神</div>`;
    html += `<p style="margin-top:8px;line-height:1.8">建议:把握机遇，${d.ganEle}方位发展有利，佩戴${d.ganEle}属性饰品增强运势。</p>`;
    html += `</div>`;
  } else {
    html += `<div class="huajie-alert">`;
    html += `<div class="alert-title">平稳之运</div>`;
    html += `<p style="margin-top:8px;line-height:1.8">此步大运平吉，宜稳不宜激，积累为主，等待更好大运到来。</p>`;
    html += `</div>`;
  }

  document.getElementById('dayunDetailContent').innerHTML = html;
  window._currentDayunDetail = d;
}

// 维度评分辅助函数
function computeDimensionScore(dayun, dimension, dayStemIdx) {
  const rel = dayun.rel;
  const ganEle = dayun.ganEle;
  const zhiEle = dayun.zhiEle;

  let baseScore = 5;

  if (dimension === 'career') {
    if (rel === '正官' || rel === '七杀') baseScore += 2;
    if (ganEle === '金' || ganEle === '水') baseScore += 1;
  } else if (dimension === 'wealth') {
    if (rel === '正财' || rel === '偏财') baseScore += 2;
    if (ganEle === '金' || ganEle === '土') baseScore += 1;
  } else if (dimension === 'marriage') {
    if (rel === '正财' || rel === '正官') baseScore += 2;
    if (zhiEle === '土' || zhiEle === '火') baseScore += 1;
  } else if (dimension === 'health') {
    if (ganEle === ELE[STEMS[dayStemIdx]]) baseScore -= 1;
    if (getKe(ganEle) === ELE[STEMS[dayStemIdx]]) baseScore -= 2;
  } else if (dimension === 'study') {
    if (rel === '正印' || rel === '偏印') baseScore += 2;
    if (ganEle === '水' || ganEle === '木') baseScore += 1;
  }

  return Math.max(2, Math.min(10, baseScore));
}

// 五行生克辅助函数
function getSheng(ele) {
  const map = {木:'火',火:'土',土:'金',金:'水',水:'木'};
  return map[ele] || '';
}
function getXSheng(ele) {
  const sheng = {'木':'火','火':'土','土':'金','金':'水','水':'木'};
  return sheng[ele] || '';
}
function getKe(ele) {
  const map = {木:'土',火:'金',土:'水',金:'木',水:'火'};
  return map[ele] || '';
}

// ═══════════════════════════════════════════════════════════
//  吉日查询引擎
// ═══════════════════════════════════════════════════════════

// --- 60甲子循环常数 ---
var _HUB_J_STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
var _HUB_J_BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
var _HUB_J_ELE = {甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
var _HUB_J_ZHI_ELE = {子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'};

// --- 干支纪日（60甲子循环）---
// 基准：2025-01-01 = 辛丑日（第38个：stemIdx=7,branchIdx=1）
function getDayGz(date) {
  const base = new Date(2025,0,1); // 2025-01-01
  const diff = Math.round((date - base) / 86400000);
  const stemIdx = ((diff + 7) % 10 + 10) % 10;
  const branchIdx = ((diff + 1) % 12 + 12) % 12;
  return {
    stem: _HUB_J_STEMS[stemIdx], branch: _HUB_J_BRANCHES[branchIdx],
    stemIdx, branchIdx,
    ganzhi: _HUB_J_STEMS[stemIdx] + _HUB_J_BRANCHES[branchIdx]
  };
}

// --- 彭祖百忌（按天干索引）---
var _HUB_PENGZU_BAIJI = {
  0:  '甲日不开仓，乙日不栽植，丙日不纳程，丁日不剃头，戊日不受田，己日不破卷，庚日不评兵，辛日不合酱，壬日不汲水，癸日不接发',
  1:  '甲不开仓，乙不栽植，丙不纳粮，丁不剃头，戊不受田，己不破田，庚不评理，辛不合酱，壬不汲水，癸不接发',
  2:  '甲不搬迁，乙不伐木，丙不修灶，丁不词讼，戊不受债，己不词讼，庚不逃跑，辛不合帐，壬不娶妾，癸不治病',
  3:  '甲不修容，乙不伐树，丙不穿井，丁不设账，戊不远行，己不投宿，庚不验货，辛不买田，壬不嫁娶，癸不词讼',
  4:  '甲不迁居，乙不伐木，丙不入宅，丁不设宴，戊不词讼，己不买卖，庚不逃跑，辛不合和，壬不开业，癸不词讼',
  5:  '甲不修造，乙不迁移，丙不剃头，丁不设祭，戊不动土，己不破田，庚不评人，辛不合作，壬不取土，癸不远行',
  6:  '甲不迁徙，乙不伐木，丙不入宅，丁不剃头，戊不受田，己不设祭，庚不逃跑，辛不合酱，壬不娶妇，癸不动土',
  7:  '甲不搬迁，乙不栽植，丙不纳妾，丁不设宴，戊不受田，己不破卷，庚不评兵，辛不合和，壬不开业，癸不远行',
  8:  '甲不修灶，乙不伐木，丙不入宅，丁不剃头，戊不受田，己不合账，庚不逃跑，辛不合和，壬不娶妾，癸不祭祀',
  9:  '甲不迁居，乙不栽植，丙不入宅，丁不设祭，戊不受田，己不破卷，庚不逃跑，辛不合酱，壬不汲水，癸不词讼'
};

// --- 二十八星宿（按日期循环）---
var _HUB_XIU_NAMES_CN = ['角','亢','氐','房','心','尾','箕','斗','牛','女','虚','危','室','壁','奎','娄','胃','昴','毕','觜','参','井','鬼','柳','星','张','翼','轸'];
var _HUB_XIU_BANGS = ['木','金','金','日','月','火','水','木','金','火','日','月','火','水','土','金','木','日','月','火','水','木','金','金','日','月','火','水'];
var _HUB_XIU_FATE = ['吉','凶','凶','吉','凶','吉','凶','吉','吉','凶','凶','凶','吉','吉','吉','吉','凶','凶','大吉','凶','大吉','大吉','大吉','吉','大吉','凶','大吉','大吉'];
var _HUB_XIU_DESC = {
  '吉':'诸事皆宜，吉祥如意',凶:'口舌是非，谨慎行事',大吉:'大吉大利，福运临门'
};

// --- 建除十二神（按日期循环）---
var _HUB_JIANCHU = ['建','除','满','平','定','执','破','危','成','收','开','闭'];
var _HUB_JIANCHU_FATE = ['凶','吉','平','凶','吉','吉','凶','平','吉','凶','吉','平'];
var _HUB_JIANCHU_YI = {
  '建':'上梁、竖柱、出行', '除':'扫舍、求医、解除', '满':'祈福、祭祀、塞穴',
  '平':'修饰、垣墙、平治道涂', '定':'冠带、入学、酝酿', '执':'捕捉、入学、求嗣',
  '破':'求医、破屋、坏垣', '危':'安床、纳财、拆卸', '成':'入学、结婚姻、纳采',
  '收':'开市、交易、纳财', '开':'开业、竖柱、上梁', '闭':'补垣、塞穴、拆屋'
};
var _HUB_JIANCHU_JI = {
  '建':'动土、出兵', '除':'', '满':'移徙、出火', '平':'词讼、栽种',
  '定':'', '执':'祈福、词讼', '破':'求医、嫁娶', '危':'',
  '成':'词讼、出兵', '收':'安葬、破土', '开':'动土、诉讼', '闭':'祈福、塞穴'
};

// --- 黄道黑道（按地支索引）---
// 子午日:青龙=吉, 丑未日:明堂=吉, 寅申日:金匮=吉, 卯酉日:天德=吉, 辰戌日:玉堂=吉, 巳亥日:司命=吉
var _HUB_HUANGDAO_GOOD = {子:'青龙',丑:'明堂',寅:'金匮',卯:'天德',辰:'玉堂',巳:'司命',午:'青龙',未:'明堂',申:'金匮',酉:'天德',戌:'玉堂',亥:'司命'};
var _HUB_HEIDAO_BAD = {子:'白虎',丑:'天刑',寅:'朱雀',卯:'勾陈',辰:'青龙',巳:'明堂',午:'白虎',未:'天刑',申:'朱雀',酉:'勾陈',戌:'青龙',亥:'明堂'};
var _HUB_HUANGDAO_FATE = {青龙:'大吉',明堂:'吉',金匮:'吉',天德:'吉',玉堂:'吉',司命:'吉',白虎:'凶',天刑:'凶',朱雀:'凶',勾陈:'凶'};

// --- 宜忌数据库（按60甲子索引）---
var _HUB_YIJI_DB = [
  {yi:'祭祀 祈福 动土 开业 订盟 纳采',ji:'嫁娶 搬家 安葬',gz:'甲子'},{yi:'沐浴 扫舍 祭祀 纳财 捕捉 纳畜',ji:'开业 动土 出行 词讼',gz:'乙丑'},
  {yi:'出行 移徙 祭祀 祈福 开光 纳采',ji:'安葬 动土 嫁娶 词讼',gz:'丙寅'},{yi:'订盟 纳采 祭祀 祈福 嫁娶 动土',ji:'开市 置产 入宅 词讼',gz:'丁卯'},
  {yi:'开市 交易 立券 纳财 栽种 牧养',ji:'安葬 行丧 伐木 纳畜',gz:'戊辰'},{yi:'嫁娶 祭祀 祈福 纳采 订盟 动土',ji:'动土 破土 安葬 词讼',gz:'己巳'},
  {yi:'沐浴 冠笄 修饰 垣墙 扫舍 求医',ji:'开业 搬家 开市 词讼',gz:'庚午'},{yi:'祭祀 祈福 嫁娶 订盟 纳采 出行',ji:'动土 破土 安葬 栽种',gz:'辛未'},
  {yi:'开市 交易 立券 挂匾 栽种 祭祀',ji:'嫁娶 动土 破土 安葬',gz:'壬申'},{yi:'祭祀 祈福 嫁娶 纳采 订盟 出行',ji:'动土 破土 安葬 栽种',gz:'癸酉'},
  {yi:'沐浴 扫舍 修饰 垣墙 祭祀 祈福',ji:'开业 搬家 开市 纳财',gz:'甲戌'},{yi:'嫁娶 祭祀 祈福 纳采 订盟 出行',ji:'动土 破土 安葬 栽种',gz:'乙亥'},
  {yi:'开市 交易 立券 纳财 栽种 牧养',ji:'安葬 行丧 破土 动土',gz:'丙子'},{yi:'祭祀 祈福 嫁娶 订盟 纳采 动土',ji:'动土 破土 安葬 栽种',gz:'丁丑'},
  {yi:'出行 移徙 祭祀 祈福 开光 纳采',ji:'安葬 动土 嫁娶 栽种',gz:'戊寅'},{yi:'订盟 纳采 祭祀 祈福 嫁娶 动土',ji:'开市 置产 入宅 栽种',gz:'己卯'},
  {yi:'开市 交易 立券 纳财 栽种 牧养',ji:'安葬 行丧 伐木 破土',gz:'庚辰'},{yi:'嫁娶 祭祀 祈福 纳采 订盟 出行',ji:'动土 破土 安葬 栽种',gz:'辛巳'},
  {yi:'沐浴 冠笄 修饰 垣墙 扫舍 求医',ji:'开业 搬家 开市 词讼',gz:'壬午'},{yi:'祭祀 祈福 嫁娶 订盟 纳采 出行',ji:'动土 破土 安葬 栽种',gz:'癸未'},
  {yi:'开市 交易 立券 纳财 栽种 牧养',ji:'安葬 行丧 破土 动土',gz:'甲申'},{yi:'祭祀 祈福 嫁娶 纳采 订盟 出行',ji:'动土 破土 安葬 栽种',gz:'乙酉'},
  {yi:'沐浴 扫舍 修饰 垣墙 祭祀 祈福',ji:'开业 搬家 开市 纳财',gz:'甲戌'},{yi:'嫁娶 祭祀 祈福 纳采 订盟 出行',ji:'动土 破土 安葬 栽种',gz:'乙亥'},
  {yi:'开市 交易 立券 纳财 栽种 牧养',ji:'安葬 行丧 伐木 破土',gz:'丙子'},{yi:'祭祀 祈福 嫁娶 订盟 纳采 动土',ji:'动土 破土 安葬 栽种',gz:'丁丑'},
  {yi:'出行 移徙 祭祀 祈福 开光 纳采',ji:'安葬 动土 嫁娶 栽种',gz:'戊寅'},{yi:'订盟 纳采 祭祀 祈福 嫁娶 动土',ji:'开市 置产 入宅 栽种',gz:'己卯'},
  {yi:'开市 交易 立券 纳财 栽种 牧养',ji:'安葬 行丧 伐木 破土',gz:'庚辰'},{yi:'嫁娶 祭祀 祈福 纳采 订盟 出行',ji:'动土 破土 安葬 栽种',gz:'辛巳'},
  {yi:'沐浴 冠笄 修饰 垣墙 扫舍 求医',ji:'开业 搬家 开市 词讼',gz:'壬午'},{yi:'祭祀 祈福 嫁娶 订盟 纳采 出行',ji:'动土 破土 安葬 栽种',gz:'癸未'},
  {yi:'开市 交易 立券 纳财 栽种 牧养',ji:'安葬 行丧 破土 动土',gz:'甲申'},{yi:'祭祀 祈福 嫁娶 纳采 订盟 出行',ji:'动土 破土 安葬 栽种',gz:'乙酉'},
  {yi:'沐浴 扫舍 修饰 垣墙 祭祀 祈福',ji:'开业 搬家 开市 纳财',gz:'丙戌'},{yi:'嫁娶 祭祀 祈福 纳采 订盟 出行',ji:'动土 破土 安葬 栽种',gz:'丁亥'},
  {yi:'开市 交易 立券 纳财 栽种 牧养',ji:'安葬 行丧 伐木 破土',gz:'戊子'},{yi:'祭祀 祈福 嫁娶 订盟 纳采 动土',ji:'动土 破土 安葬 栽种',gz:'己丑'},
  {yi:'出行 移徙 祭祀 祈福 开光 纳采',ji:'安葬 动土 嫁娶 栽种',gz:'庚寅'},{yi:'订盟 纳采 祭祀 祈福 嫁娶 动土',ji:'开市 置产 入宅 栽种',gz:'辛卯'},
  {yi:'开市 交易 立券 纳财 栽种 牧养',ji:'安葬 行丧 伐木 破土',gz:'壬辰'},{yi:'嫁娶 祭祀 祈福 纳采 订盟 出行',ji:'动土 破土 安葬 栽种',gz:'癸巳'},
  {yi:'沐浴 冠笄 修饰 垣墙 扫舍 求医',ji:'开业 搬家 开市 词讼',gz:'甲午'},{yi:'祭祀 祈福 嫁娶 订盟 纳采 出行',ji:'动土 破土 安葬 栽种',gz:'乙未'},
  {yi:'开市 交易 立券 纳财 栽种 牧养',ji:'安葬 行丧 破土 动土',gz:'丙申'},{yi:'祭祀 祈福 嫁娶 纳采 订盟 出行',ji:'动土 破土 安葬 栽种',gz:'丁酉'},
  {yi:'沐浴 扫舍 修饰 垣墙 祭祀 祈福',ji:'开业 搬家 开市 纳财',gz:'戊戌'},{yi:'嫁娶 祭祀 祈福 纳采 订盟 出行',ji:'动土 破土 安葬 栽种',gz:'己亥'},
  {yi:'开市 交易 立券 纳财 栽种 牧养',ji:'安葬 行丧 伐木 破土',gz:'庚子'},{yi:'祭祀 祈福 嫁娶 订盟 纳采 动土',ji:'动土 破土 安葬 栽种',gz:'辛丑'},
  {yi:'出行 移徙 祭祀 祈福 开光 纳采',ji:'安葬 动土 嫁娶 栽种',gz:'壬寅'},{yi:'订盟 纳采 祭祀 祈福 嫁娶 动土',ji:'开市 置产 入宅 栽种',gz:'癸卯'},
  {yi:'开市 交易 立券 纳财 栽种 牧养',ji:'安葬 行丧 伐木 破土',gz:'甲辰'},{yi:'嫁娶 祭祀 祈福 纳采 订盟 出行',ji:'动土 破土 安葬 栽种',gz:'乙巳'},
  {yi:'沐浴 冠笄 修饰 垣墙 扫舍 求医',ji:'开业 搬家 开市 词讼',gz:'丙午'}
];

// --- 冲煞信息 ---
var _HUB_CHONG_SHA = {
  '子':'午', '丑':'未', '寅':'申', '卯':'酉', '辰':'戌', '巳':'亥',
  '午':'子', '未':'丑', '申':'寅', '酉':'卯', '戌':'辰', '亥':'巳'
};
var _HUB_SHA_FANGXIANG = {
  '子':'午', '丑':'未', '寅':'申', '卯':'酉', '辰':'戌', '巳':'亥',
  '午':'子', '未':'丑', '申':'寅', '酉':'卯', '戌':'辰', '亥':'巳'
};

// --- 农历月份名 ---
var _HUB_LUNAR_MONTH_NAME = ['','正','二','三','四','五','六','七','八','九','十','冬','腊'];
var _HUB_LUNAR_DAY_NAME = ['','初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
  '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
  '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];

// --- 时辰吉凶 ---
function getHourFate(stemIdx, branchIdx) {
  const stem = _HUB_J_STEMS[stemIdx];
  const branch = _HUB_J_BRANCHES[branchIdx];
  // 简单时辰判断：子丑寅卯辰巳午未申酉戌亥，各时辰本气旺衰
  const fateMap = {
    '子':'平', '丑':'平', '寅':'吉', '卯':'吉', '辰':'平', '巳':'平',
    '午':'吉', '未':'凶', '申':'平', '酉':'平', '戌':'吉', '亥':'平'
  };
  // 配合日干：日干为甲丙戊庚壬时，子午丑未寅申卯酉为吉
  const stemGoodHours = {
    '甲':['寅','卯','午','未','戌','亥'], '乙':['寅','卯','午','未','戌','亥'],
    '丙':['寅','卯','巳','午','戌','亥'], '丁':['寅','卯','巳','午','戌','亥'],
    '戊':['寅','卯','巳','午','戌','亥'], '己':['寅','卯','巳','午','戌','亥'],
    '庚':['丑','卯','辰','午','未','戌'], '辛':['丑','卯','辰','午','未','戌'],
    '壬':['寅','卯','辰','巳','午','未'], '癸':['寅','卯','辰','巳','午','未']
  };
  const shichen = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const goodHours = stemGoodHours[stem] || ['寅','卯','午','未'];
  return shichen.map(h => goodHours.includes(h) ? '吉' : '平');
}

// ================================================================
// 二十四节气计算与民俗知识库
// ================================================================
var _stBase = {
  '小寒':[0,5],'大寒':[0,20],'立春':[1,3],'雨水':[1,18],
  '惊蛰':[2,5],'春分':[2,20],'清明':[3,4],'谷雨':[3,19],
  '立夏':[4,5],'小满':[4,20],'芒种':[5,5],'夏至':[5,21],
  '小暑':[6,6],'大暑':[6,22],'立秋':[7,7],'处暑':[7,22],
  '白露':[8,7],'秋分':[8,22],'寒露':[9,8],'霜降':[9,23],
  '立冬':[10,7],'小雪':[10,22],'大雪':[11,6],'冬至':[11,21]
};
var _stOrder = ['冬至','小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'];

function getSolarTerm(date) {
  let year = date.getFullYear();
  let offset = year - 2026;
  let found = null;
  for (let i = 0; i < _stOrder.length; i++) {
    let name = _stOrder[i];
    let base = _stBase[name];
    if (!base) continue;
    let d = new Date(year, base[0], base[1] + offset);
    if (date >= d) found = { name: name, date: d };
  }
  if (found) {
    let isToday = found.date.getFullYear() === date.getFullYear() &&
      found.date.getMonth() === date.getMonth() &&
      found.date.getDate() === date.getDate();
    return { name: found.name, isTermDay: isToday };
  }
  return { name: null, isTermDay: false };
}

var SOLAR_TERM_INFO = {
  '小寒':{food:'腊八粥/羊肉汤',taboo:'忌吃生冷、忌懒散不动',health:'多吃温热，适当进补，早睡晚起',wisdom:'小寒小寒，防寒保暖；春打六九头，吃穿不用愁'},
  '大寒':{food:'八宝饭/糯米饭',taboo:'忌房屋破漏、忌与人争执',health:'冬藏宜静养心神，适当锻炼',wisdom:'大寒大寒，无风自寒；年关将近，备年迎春'},
  '立春':{food:'春饼/萝卜/韭菜',taboo:'忌搬家、忌看病、忌争吵',health:'养肝护阳，早起梳头，适量运动',wisdom:'立春一年端，种地早盘算；春捂秋冻'},
  '雨水':{food:'罐罐肉/桂圆红枣粥',taboo:'忌动土、忌破土动工',health:'健脾祛湿，少酸多甘，适度春捂',wisdom:'雨水落雨润万物，春耕春播好时节'},
  '惊蛰':{food:'梨/春笋/炒虫',taboo:'忌杀生、忌口舌是非',health:'养肝明目，多伸懒腰早起散步',wisdom:'惊蛰一雷百虫出，养生防病正当时'},
  '春分':{food:'春菜/萝卜/汤圆',taboo:'忌婚嫁、忌大兴土木',health:'阴阳平衡，多晒太阳，疏肝理气',wisdom:'春分秋分，日夜平分；吃了春分饭，一天长一线'},
  '清明':{food:'青团/清明果/润饼菜',taboo:'忌婚嫁、忌动火、忌穿红',health:'疏肝清火，踏青郊游，登高望远',wisdom:'清明前后，种瓜点豆；植树造林，莫过清明'},
  '谷雨':{food:'香椿/茶叶蛋/薏米粥',taboo:'忌暴怒、忌熬夜',health:'祛湿健脾，防春火，过敏体质少外出',wisdom:'谷雨前后，种瓜点豆；谷雨三朝看牡丹'},
  '立夏':{food:'立夏饭/茶叶蛋/三鲜',taboo:'忌贪凉、忌午睡过久',health:'养心护阳，清淡饮食，午间小憩',wisdom:'立夏三天遍地锄；立夏不下，犁耙高挂'},
  '小满':{food:'苦菜/冬瓜/薏仁',taboo:'忌过度进补、忌贪食生冷',health:'清热祛湿，健脾养胃，防苦夏',wisdom:'小满动三车，水车、油车、丝车'},
  '芒种':{food:'梅子/粽子/酸梅汤',taboo:'忌阴湿久留、忌午时暴晒',health:'清热解暑，心平气和，午时避阳',wisdom:'芒种火烧天，夏至水满田；栽秧割麦两头忙'},
  '夏至':{food:'面条/馄饨/绿豆汤',taboo:'忌行房事、忌暴晒、忌烦躁',health:'养心安神，清淡饮食，午间小睡',wisdom:'吃了夏至面，一天短一线；冬至饺子夏至面'},
  '小暑':{food:'黄鳝/莲藕/绿豆粥',taboo:'忌长时间吹空调、忌贪凉饮冷',health:'清热解暑，健脾祛湿，心静自然凉',wisdom:'小暑一声雷，倒转做黄梅'},
  '大暑':{food:'仙草冻/凉粉/冬瓜汤',taboo:'忌烈日暴晒、忌过度劳累',health:'防暑降温，多补水，适度午休',wisdom:'大暑三候：腐草为萤、土润溽暑、大雨时行'},
  '立秋':{food:'西瓜/蒸茄夹/肉末豆腐',taboo:'忌暴饮暴食、忌过度悲伤',health:'润燥养肺，少辛多酸，早睡早起',wisdom:'立秋处暑正当暑，秋老虎还需防'},
  '处暑':{food:'鸭子/龙眼/银耳羹',taboo:'忌秋冻过早、忌辛辣刺激',health:'养阴润燥，适度秋冻，预防秋燥',wisdom:'处暑出伏，凉风渐起；处暑十八盆，白露身不露'},
  '白露':{food:'龙眼/白扁豆/红薯',taboo:'忌露宿、忌贪凉、忌裸露',health:'润肺益气，秋冻适度，早卧早起',wisdom:'白露身不露，寒露脚不露'},
  '秋分':{food:'汤圆/野苋菜/秋蟹',taboo:'忌婚嫁、忌大兴土木、忌争吵',health:'阴阳平衡，收敛神气，登高望远',wisdom:'秋分昼夜平，养生重平衡'},
  '寒露':{food:'芝麻/螃蟹/柿子',taboo:'忌脚受凉、忌悲秋、忌辛辣',health:'养阴润燥，足部保暖，登高赏菊',wisdom:'寒露脚不露，养生先养脚'},
  '霜降':{food:'柿子/鸭子/萝卜',taboo:'忌秋冻过度、忌晚睡、忌悲叹',health:'平补润燥，防寒保暖，养胃健脾',wisdom:'霜降杀百草；霜降见霜，米烂成仓'},
  '立冬':{food:'饺子/羊肉/萝卜炖排骨',taboo:'忌盲目进补、忌住所破漏',health:'温补为主，早睡晚起，养藏阳气',wisdom:'立冬补冬，补嘴空；立冬晴，一冬凌'},
  '小雪':{food:'糍粑/腊肉/黑豆茶',taboo:'忌过早外出、忌紧闭门窗',health:'温补肾气，适度运动，晒晒太阳',wisdom:'小雪腌菜大雪腌肉'},
  '大雪':{food:'腌肉/红薯粥/羊肉汤',taboo:'忌紧闭窗户不通风、忌大喜大悲',health:'防寒保暖，适度温补，宜静养',wisdom:'大雪封河，腊雪兆丰年'},
  '冬至':{food:'饺子/汤圆/馄饨',taboo:'忌婚嫁、忌搬家、忌动土、忌深夜外出',health:'数九寒天，宜静养，补肾藏精',wisdom:'冬至大如年；吃了冬至面，一天长一线；冬至一阳生'}
};

var DAILY_WISDOM_TIPS = [
  '早起晒太阳，顺应天时，一整天精力充沛',
  '睡前泡脚15分钟，引火归元，安眠又养生',
  '辰时（7-9点）胃经当令，此刻吃早餐最养脾胃',
  '午睡20-30分钟最理想，睡太久反而昏沉',
  '子时（23点）前入睡，是最天然的美容方',
  '梳头100下，刺激头部经络，提神醒脑',
  '春捂秋冻，不可过早减衣，尤其注意背部保暖',
  '每天大笑三声，疏肝解郁，比吃逍遥丸还管用',
  '怒伤肝，喜伤心，思伤脾，忧伤肺，恐伤肾——情志养生是第一要义',
  '睡前1小时不看手机，让大脑自然进入休息状态',
  '白天多晒后背，温通督脉，阳气充足精神好',
  '久站伤骨，久坐伤肉，久卧伤气——动静结合才是养生',
  '汗后不宜立即洗澡，等汗干了再洗以免受寒',
  '闭目养神10分钟，相当于深度睡眠1小时',
  '空调房里放一盆水，避免干燥上火',
  '春天多吃辛：葱姜蒜香菜，发散冬季伏寒',
  '夏天吃苦（苦瓜、莲子心）清热泻火正当时',
  '秋天宜平补，鸭肉莲子最润燥',
  '冬天进补首选黑色食物：黑豆黑芝麻黑木耳',
  '冬吃萝卜夏吃姜，不用医生开药方',
  '饭前喝汤苗条健康，饭后喝汤肠胃遭殃',
  '饭吃七分饱，留三分饥饿感，脾胃从容运化',
  '细嚼慢咽每口食物不少于20下，减轻脾胃负担',
  '早晨第一杯水要喝温的，不要喝凉的',
  '最好的喝水方式是渴了再喝，小口慢饮',
  '五色入五脏：青赤黄白黑，对应心肝脾肺肾',
  '饮食有节：定时定量不偏不挑',
  '少吃腌制品，多吃新鲜蔬果，减少亚硝酸盐摄入',
  '少吃反季节蔬菜水果，当令食材最养人',
  '感冒期间饮食清淡，粥类最养脾胃',
  '感冒初起喝葱白姜汤，趁热发汗可截断病程',
  '咳嗽有痰少吃甜腻，甜腻生痰',
  '体质偏寒者少吃西瓜香蕉梨等寒性水果',
  '体质偏热者少吃辛辣，多吃凉润食物平衡',
  '湿气重的人少吃甜腻油炸生冷食物',
  '胃以温为养，早起一杯温开水比什么都养胃',
  '早餐要吃好，午餐要吃饱，晚餐要吃少',
  '晚上少吃盐少油，晚餐七八分饱最健康',
  '吃饭时心情不好，脾胃运化减半，生气莫进食',
  '叩齿36下，固肾健齿，预防牙龈萎缩',
  '常按足三里穴，健脾和胃，养生第一要穴',
  '常按三阴交穴，女性调经止痛，男可补肾壮阳',
  '常按太冲穴，疏肝理气，缓解焦虑情绪',
  '常按涌泉穴，肾精充足，头发乌黑，牙齿坚固',
  '揉腹顺时针消食，逆时针补虚，每天100下',
  '泡脚水里加艾叶，温经散寒，祛湿止痒',
  '太极拳柔和缓慢，是最安全的心肺锻炼方式',
  '八段锦晨练10分钟，胜过跑步半小时',
  '广播体操是最适合国人体质的全身运动',
  '拉伸比跑步更重要，运动前后各做5分钟',
  '踮脚跟100下，刺激肾经，温补肾阳',
  '原地高抬腿1分钟，提高心肺功能',
  '深蹲起立每天30个，锻炼下肢，预防心脑血管病',
  '每天踮脚尖走路，锻炼肾气，延年益寿',
  '拍打胆经（大腿外侧）疏通肝胆，燃脂排毒',
  '俯卧撑每天20个，男性增强上肢力量',
  '仰卧起坐每天30个，锻炼核心肌群',
  '瑜伽腹式呼吸，每天10分钟等于深度睡眠',
  '快走是最好的有氧运动，每天六千步延年益寿',
  '游泳是最好的全身运动，对关节伤害最小',
  '骑车上班，健康又环保，一石二鸟',
  '放风筝是极好的户外运动，疏肝解郁，仰头明目',
  '爬山是最好的心肺锻炼，膝盖不好可走缓坡',
  '跳绳是全身运动，每天十分钟效果惊人',
  '每天晒手心5分钟，温阳散寒'
];

function getDailyWisdom(date, stemIdx) {
  let dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  let idx = (dayOfYear + stemIdx * 3) % DAILY_WISDOM_TIPS.length;
  return DAILY_WISDOM_TIPS[idx];
}



// --- 综合评分 ---
// calcJiuriScore 已由第二定义（基于建除/值神/星宿/吉神凶神的传统规则版）覆盖

// --- 月历渲染 ---
// [TEST_DATA] _jiuriYear/_jiuriMonth 已在 divination-core.js 中声明，此处不再重复声明
// 如果 divination-core.js 未加载（defer），使用 var fallback
var _jiuriYear = _jiuriYear || new Date().getFullYear();
var _jiuriMonth = _jiuriMonth || new Date().getMonth();

function jiuriInit() {
  const sel = document.getElementById('jiuriYearSelect');
  if (!sel) return;
  sel.innerHTML = '';
  for (let y = new Date().getFullYear() - 2; y <= new Date().getFullYear() + 5; y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y + '年';
    if (y === new Date().getFullYear()) opt.selected = true;
    sel.appendChild(opt);
  }
  const dateInput = document.getElementById('jiuriDateInput');
  if (dateInput) {
    const t = new Date();
    dateInput.value = t.getFullYear() + '-' + String(t.getMonth()+1).padStart(2,'0') + '-' + String(t.getDate()).padStart(2,'0');
  }
  _jiuriYear = new Date().getFullYear();
  _jiuriMonth = new Date().getMonth();
  jiuriRenderCal();
}

function jiuriToday() {
  const t = new Date();
  _jiuriYear = t.getFullYear();
  _jiuriMonth = t.getMonth();
  const sel = document.getElementById('jiuriYearSelect');
  if (sel) sel.value = _jiuriYear;
  const di = document.getElementById('jiuriDateInput');
  if (di) di.value = t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
  jiuriRenderCal();
  jiuriShowDate();
}

function jiuriPrevMonth() {
  if (--_jiuriMonth < 0) { _jiuriMonth = 11; _jiuriYear--; }
  const sel = document.getElementById('jiuriYearSelect');
  if (sel) sel.value = _jiuriYear;
  jiuriRenderCal();
}

function jiuriNextMonth() {
  if (++_jiuriMonth > 11) { _jiuriMonth = 0; _jiuriYear++; }
  const sel = document.getElementById('jiuriYearSelect');
  if (sel) sel.value = _jiuriYear;
  jiuriRenderCal();
}

function jiuriShowDate() {
  const dateInput = document.getElementById('jiuriDateInput');
  if (!dateInput || !dateInput.value) return;
  const d = new Date(dateInput.value + 'T00:00:00');
  _jiuriYear = d.getFullYear();
  _jiuriMonth = d.getMonth();
  const sel = document.getElementById('jiuriYearSelect');
  if (sel) sel.value = _jiuriYear;
  jiuriRenderCal();
  jiuriShowDetail(d);
}

function jiuriRenderCal() {
  const cal = document.getElementById('jiuriCalendar');
  const label = document.getElementById('jiuriMonthLabel');
  if (!cal) return;
  let WEEK = ['日','一','二','三','四','五','六'];
  const firstDay = new Date(_jiuriYear, _jiuriMonth, 1).getDay();
  const daysInMonth = new Date(_jiuriYear, _jiuriMonth + 1, 0).getDate();
  const today = new Date();

  let html = '';
  // 星期头
  WEEK.forEach(w => {
    html += `<div class="jiuri-cal-header">${w}</div>`;
  });
  // 空白格子
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="jiuri-cal-cell empty"></div>`;
  }
  // 日期格子
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(_jiuriYear, _jiuriMonth, d);
    const isToday = today.getFullYear() === _jiuriYear && today.getMonth() === _jiuriMonth && today.getDate() === d;
    const gz = getDayGz(date);
    const jcIdx = (Math.round((date - new Date(2025,0,1)) / 86400000) % 12 + 12) % 12;
    const jcFate = _HUB_JIANCHU_FATE[jcIdx];
    const xiuIdx = Math.abs(Math.round((date - new Date(2025,0,1)) / 86400000)) % 28;
    const xiuFate = _HUB_XIU_FATE[xiuIdx];
    // [TEST_DATA] 从 DOM 直接获取选中日期，不依赖外部 dateInput 变量
    var _di = document.getElementById('jiuriDateInput');
    const selected = _di && _di.value === _jiuriYear+'-'+String(_jiuriMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    // 分数
    const score = calcJiuriScore(gz.stemIdx, gz.branchIdx, date);
    let dotClass = '';
    if (score >= 75) dotClass = 'best';
    else if (score >= 60) dotClass = 'good';
    else if (score < 35) dotClass = 'worst';
    else if (score < 50) dotClass = 'bad';
    const selAttr = selected ? 'selected' : '';
    const todayAttr = isToday ? 'today' : '';
    const lunarD = _HUB_LUNAR_DAY_NAME[(date - new Date(_jiuriYear,0,1)) % 30] || _HUB_LUNAR_DAY_NAME[Math.floor(((date - new Date(_jiuriYear,0,1)) / 86400000) % 30)];
    html += `<ml-tap role="button" tabindex="0" class="jiuri-cal-cell ${dotClass} ${selAttr} ${todayAttr} d-block" onclick="jiuriPickDate(${d})"
      <span class="cal-day">${d}</span>
      <span class="cal-lunar">${lunarD}</span>
      <div class="cal-dot"></div>
    </ml-tap>`;
  }
  cal.innerHTML = html;
  if (label) {
    label.textContent = (_jiuriMonth + 1) + '月';
  }
}

function jiuriPickDate(d) {
  const dateStr = _jiuriYear + '-' + String(_jiuriMonth+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
  const di = document.getElementById('jiuriDateInput');
  if (di) di.value = dateStr;
  const date = new Date(_jiuriYear, _jiuriMonth, d);
  // 更新选中高亮
  document.querySelectorAll('.jiuri-cal-cell').forEach(c => c.classList.remove('selected'));
  const cells = document.querySelectorAll('.jiuri-cal-cell:not(.empty)');
  cells.forEach(c => {
    if (parseInt(c.querySelector('.cal-day').textContent) === d) c.classList.add('selected');
  });
  jiuriShowDetail(date);
}

function jiuriShowDetail(date) {
  let extraHtml = '';
  let st = getSolarTerm(date);
  let stInfo = st.name ? (SOLAR_TERM_INFO[st.name] || null) : null;
  const detail = document.getElementById('jiuriDetail');
  if (!detail) return;
  detail.style.display = 'block';

  const gz = getDayGz(date);
  const stemIdx = gz.stemIdx;
  const branchIdx = gz.branchIdx;
  const branch = gz.branch;
  const stem = gz.stem;

  // 干支纪日
  const ganzhi = gz.ganzhi;
  const dayGz = ganzhi;

  // 冲煞
  const chongZhu = _HUB_CHONG_SHA[branch] || '';
  const shaFang = _HUB_SHA_FANGXIANG[branch] || '';

  // 彭祖百忌
  const pengzuText = _HUB_PENGZU_BAIJI[stemIdx] || '无特殊禁忌';
  const pz禁忌 = pengzuText.split('，').filter(p => p.startsWith(stem));
  const pengzu = pz禁忌.length > 0 ? pz禁忌[0] : (_HUB_PENGZU_BAIJI[stemIdx] || '').split('，')[0];

  // 建除
  const jcIdx = (Math.round((date - new Date(2025,0,1)) / 86400000) % 12 + 12) % 12;
  const jianchu = _HUB_JIANCHU[jcIdx];
  const jcFate = _HUB_JIANCHU_FATE[jcIdx];
  const jcYi = _HUB_JIANCHU_YI[jianchu] || '';
  const jcJi = _HUB_JIANCHU_JI[jianchu] || '';

  // 星宿
  const xiuIdx = Math.abs(Math.round((date - new Date(2025,0,1)) / 86400000)) % 28;
  const xiuName = _HUB_XIU_NAMES_CN[xiuIdx];
  const xiuBang = XIU_BANGS_CN[xiuIdx];
  const xiuFate = _HUB_XIU_FATE[xiuIdx];
  const xiuDesc = _HUB_XIU_DESC[xiuFate];

  // 黄道黑道
  const huangdao = _HUB_HUANGDAO_GOOD[branch] || '';
  const heidao = _HUB_HEIDAO_BAD[branch] || '';
  const huangdaoFate = _HUB_HUANGDAO_FATE[huangdao] || '平';

  // 宜忌
  const yijiIdx = (Math.round((date - new Date(2025,0,1)) / 86400000) % 60 + 60) % 60;
  const yiji = _HUB_YIJI_DB[yijiIdx] || {yi:'诸事不宜', ji:'大事勿用'};

  // 时辰
  const hourFates = getHourFate(stemIdx, branchIdx);

  // 综合评分
  const score = calcJiuriScore(stemIdx, branchIdx, date);
  let rating = '平', ratingClass = 'ok';
  if (score >= 80) { rating = '大吉'; ratingClass = 'great'; }
  else if (score >= 65) { rating = '吉'; ratingClass = 'good'; }
  else if (score < 40) { rating = '凶'; ratingClass = 'worst'; }
  else if (score < 55) { rating = '平'; ratingClass = 'bad'; }

  // 星期
  const weekDays = ['周日','周一','周二','周三','周四','周五','周六'];
  const weekDay = weekDays[date.getDay()];

  // 公历日期
  const solarStr = date.getFullYear() + '年' + (date.getMonth()+1) + '月' + date.getDate() + '日 ' + weekDay;

  // 农历日期（使用标准农历转换）
  let _lunarResult = solarToLunar(date.getFullYear(), date.getMonth()+1, date.getDate());
  let lunarMonth = _lunarResult.month;
  let lunarDay = _lunarResult.day;
  let lunarIsLeap = _lunarResult.isLeap;
  let lunarStr = (lunarIsLeap ? '闰' : '') + (_HUB_LUNAR_MONTH_NAME[lunarMonth] || String(lunarMonth)) + '月' + (_HUB_LUNAR_DAY_NAME[lunarDay] || String(lunarDay)+'日');

  // 生肖冲煞
  const zodiacMap = {子:'鼠',丑:'牛',寅:'虎',卯:'兔',辰:'龙',巳:'蛇',午:'马',未:'羊',申:'猴',酉:'鸡',戌:'狗',亥:'猪'};
  const zodiac = zodiacMap[branch] || branch;

  let html = '';
  // 标题行
  html += `<div class="jiuri-detail-card">
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:13px;opacity:.95;letter-spacing:2px">${solarStr}</div>
      <div style="font-size:13px;letter-spacing:2px;margin-top:4px">农历 ${lunarStr}</div>
      <div style="margin-top:12px">
        <span class="jiuri-badge ${ratingClass}">${rating}</span>
        <span style="font-family:Ma Shan Zheng,serif;font-size:28px;color:var(--gold);letter-spacing:4px">${ganzhi}日</span>
        <span style="font-size:13px;opacity:.95;margin-left:8px">${weekDay}</span>
      </div>
      <div style="font-size:13px;opacity:.95;margin-top:8px">${zodiac}年 | 评分 ${score}/100</div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:16px">
      <div class="jiuri-row"><span style="opacity:0.85">冲</span><span style="color:var(--cinn2)">${chongZhu}🐀</span><span style="opacity:0.85">煞</span><span style="color:var(--cinn2)">${shaFang}向</span></div>
      <div class="jiuri-row"><span style="opacity:0.85">建除</span><span class="jiuri-badge ${jcFate==='吉'?'good':jcFate==='大吉'?'great':jcFate==='凶'?'bad':'ok'}">${jianchu}</span></div>
      <div class="jiuri-row"><span style="opacity:0.85">星宿</span><span>${xiuName}宿</span><span style="font-size:10px;opacity:0.85">(${xiuBang}日)</span><span class="jiuri-badge ${xiuFate==='大吉'?'great':xiuFate==='吉'?'good':'ok'}">${xiuFate}</span></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div>
        <div style="font-size:11px;letter-spacing:2px;margin-bottom:8px">黄道 ${huangdao} <span class="jiuri-badge great">${huangdaoFate}</span></div>
        <div style="font-size:11px;letter-spacing:2px;">黑道 ${heidao} <span class="jiuri-badge bad">${_HUB_HUANGDAO_FATE[heidao]||'平'}</span></div>
      </div>
      <div>
        <div style="font-size:11px;letter-spacing:2px;margin-bottom:4px">彭祖百忌</div>
        <div style="font-size:12px;color:var(--cinn2);letter-spacing:1px">${pengzu}</div>
      </div>
    </div>
  </div>`;

  // 宜忌
  const yiArr = (yiji.yi || '诸事不宜').split(/[\s、]/).filter(Boolean);
  const jiArr = (yiji.ji || '大事勿用').split(/[\s、]/).filter(Boolean);
  html += `<div class="jiuri-detail-card">
    <h4>✅ 宜做事项</h4>
    <div class="jiuri-yi-list">${yiArr.map(y => `<span class="jiuri-yi-tag">${y}</span>`).join('')}</div>
    <h4 style="margin-top:16px">❌ 忌做事项</h4>
    <div class="jiuri-yi-list">${jiArr.map(j => `<span class="jiuri-ji-tag">${j}</span>`).join('')}</div>
    ${jcYi ? `<div style="margin-top:12px;font-size:11px;opacity:.95">建除宜: ${jcYi} ${jcJi ? '| 建除忌: ' + jcJi : ''}</div>` : ''}
  </div>`;

  // 时辰
  html += `<div class="jiuri-detail-card">
    <h4>⏰ 十二时辰吉凶</h4>
    <div class="jiuri-hours-grid">
      ${['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'].map((s,i) => {
        const fate = hourFates[i];
        const cls = fate === '吉' ? 'great' : 'ok';
        return `<div class="jiuri-hour ${cls}"><div>${s}时</div><div>${fate}</div></div>`;
      }).join('')}
    </div>
    <div style="font-size:11px;margin-top:10px;text-align:center">注：以上时辰吉凶为参考，具体择时需结合八字</div>
  </div>`;

  // 五行
  const stemEle = _HUB_J_ELE[stem];
  const branchEle = _HUB_J_ZHI_ELE[branch];
  html += `<div class="jiuri-detail-card">
    <h4>🔮 五行分析</h4>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;text-align:center">
      <div><div style="font-size:10px;opacity:0.85">天干</div><div style="font-size:20px;font-family:Ma Shan Zheng,serif;color:var(--gold)">${stem}</div><div style="font-size:11px;opacity:.95">${stemEle}性</div></div>
      <div><div style="font-size:10px;opacity:0.85">地支</div><div style="font-size:20px;font-family:Ma Shan Zheng,serif;color:var(--gold)">${branch}</div><div style="font-size:11px;opacity:.95">${branchEle}性</div></div>
      <div><div style="font-size:10px;opacity:0.85">纳音</div><div style="font-size:11px;opacity:0.85">${ganzhi}剑锋</div></div>
    </div>
  </div>`;


  // --- 每日生活智慧 ---
  let wisdom = getDailyWisdom(date, stemIdx);
  extraHtml += '<div class="jiuri-detail-card"><h4>💡 每日生活智慧</h4>';
  extraHtml += '<div style="margin-top:12px;padding:14px 16px;background:rgba(52,152,219,.06);border-radius:8px;border-left:3px solid var(--cyan2);line-height:1.8">';
  extraHtml += '<div style="font-size:13px">' + wisdom + '</div></div>';
  extraHtml += '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">';
  let wtTags = ['起居养生','饮食调理','运动锻炼','情志管理','经络保健'];
  for (let wi = 0; wi < wtTags.length; wi++) {
    extraHtml += '<span style="font-size:11px;padding:3px 10px;background:rgba(52,152,219,.1);border-radius:20px;opacity:0.85">' + wtTags[wi] + '</span>';
  }
  extraHtml += '</div></div>';

  // --- 节气民俗模块 ---
  if (st.name) {
    let stBadge = st.isTermDay ? '<span class="jiuri-badge great" style="font-size:10px;margin-left:8px">今日节气</span>' : '<span style="font-size:10px;margin-left:8px">当前：' + st.name + '</span>';
    extraHtml += '<div class="jiuri-detail-card"><h4>🌿 二十四节气 · ' + st.name + stBadge + '</h4>';
    extraHtml += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-top:12px">';
    if (stInfo) {
      extraHtml += '<div><div style="font-size:10px;margin-bottom:4px">时令美食</div><div style="font-size:12px">' + stInfo.food + '</div></div>';
      extraHtml += '<div><div style="font-size:10px;margin-bottom:4px">民俗禁忌</div><div style="font-size:12px;color:var(--cinn2)">' + stInfo.taboo + '</div></div>';
      extraHtml += '<div><div style="font-size:10px;margin-bottom:4px">养生要点</div><div style="font-size:12px">' + stInfo.health + '</div></div>';
    }
    extraHtml += '</div>';
    extraHtml += '<div style="margin-top:12px;padding:10px 14px;background:rgba(201,168,76,.06);border-radius:8px;border-left:3px solid var(--gold)">';
    extraHtml += '<div style="font-size:11px;opacity:.95;margin-bottom:4px">节气谚语</div>';
    extraHtml += '<div style="font-size:13px;font-family:\'Ma Shan Zheng\',serif;letter-spacing:1px">' + (stInfo ? stInfo.wisdom : '天道循环，寒暑交替') + '</div></div>';
    if (st.isTermDay) {
      extraHtml += '<div style="margin-top:10px;padding:10px 14px;background:rgba(46,204,113,.08);border-radius:8px;border-left:3px solid var(--success)">';
      extraHtml += '<div style="font-size:11px;color:var(--success)">🎉 今日是 <strong>' + st.name + '</strong> 节气！</div>';
      extraHtml += '<div style="font-size:12px;opacity:0.85;margin-top:4px">节气交替日气场变化大，宜静心养神，避免大喜大悲，饮食起居需格外注意。</div></div>';
    }
    extraHtml += '</div>';
  }

  html += extraHtml;
  detail.innerHTML = html;
}

function jiuriSuggest() {
  const purpose = document.getElementById('jiuriPurpose')?.value;
  const result = document.getElementById('jiuriSuggestResult');
  if (!purpose) { showToast('请先选择事项类型'); return; }
  if (!result) return;

  // 搜索最近60天内最佳日期
  const candidates = [];
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const gz = getDayGz(d);
    let Y = d.getFullYear(), M = d.getMonth()+1, D = d.getDate();
    let yearGZ = getYearGanZhi(Y, M, D);
    let monthGZ = getMonthGanZhi(Y, M, D);
    let dayGZ = getDayGanZhi(Y, M, D);
    
    // 建除
    let jcName = getJianChu(monthGZ.zhi, dayGZ.zhi);
    // 吉神
    let jsList = calcJishen(yearGZ, monthGZ, dayGZ);
    // 凶神
    let xsList = calcXiongshen(yearGZ, monthGZ, dayGZ);
    // 值神
    let zs = getZhishen(dayGZ.gan, dayGZ.zhi);
    let zsHuangdao = ZHISHEN_TYPE[zs];
    
    // 事项配置
    let eventMap = {
      '嫁娶': {good:['天德','月德','三合','六合','天喜'], bad:['月破','月厌','劫煞','灾煞'], jianchu:['成','开','定']},
      '搬家': {good:['天德','月德','天恩','母仓'], bad:['月破','月煞','四击'], jianchu:['开','成','满']},
      '开业': {good:['天恩','月恩','母仓','圣心','益后'], bad:['月破','月厌','劫煞'], jianchu:['开','满','成']},
      '动土': {good:['天恩','月恩','母仓'], bad:['月破','月刑','月煞','劫煞','灾煞'], jianchu:['建','除','满']},
      '安葬': {good:['天德','月德','天恩','母仓'], bad:['月破','月厌','四击','往亡'], jianchu:['闭','收','除']},
      '出行': {good:['天恩','驿马','三合'], bad:['月破','月刑','往亡'], jianchu:['开','建','除']},
      '求职': {good:['天恩','月恩','圣心'], bad:['月破','天吏'], jianchu:['建','成','开']},
      '祈福': {good:['天德','月德','天恩','母仓','圣心'], bad:['月破','月厌'], jianchu:['开','定','满']},
      '祭祀': {good:['天恩','月德','天德'], bad:['月破'], jianchu:['开','定','满','建']},
      '订盟': {good:['天德','月德','三合','六合','天喜'], bad:['月破','月厌'], jianchu:['定','成']},
      '求财': {good:['天恩','母仓','益后','续世'], bad:['月破','劫煞','灾煞'], jianchu:['开','满','成']},
      '问名': {good:['天德','月德','六合','天喜'], bad:['月破','月厌'], jianchu:['定','成','开']}
    };
    let evt = eventMap[purpose] || {good:[], bad:[], jianchu:[]};
    
    // 宜忌
    let yiList = JIAN_CHU_YI[jcName] || ['祭祀'];
    let jiList = JIAN_CHU_JI[jcName] || ['诸事不宜'];
    let yiText = yiList.join(' ');
    let jiText = jiList.join(' ');
    
    // 评分
    let baseScore = calcJiuriScore(gz.stemIdx, gz.branchIdx, d);
    // 事项匹配加分
    let matchScore = 0;
    if (evt.jianchu && evt.jianchu.indexOf(jcName) !== -1) matchScore += 20;
    if (evt.good) {
      for (let j = 0; j < evt.good.length; j++) {
        if (jsList.indexOf(evt.good[j]) !== -1) matchScore += 8;
      }
    }
    if (evt.bad) {
      for (let j = 0; j < evt.bad.length; j++) {
        if (xsList.indexOf(evt.bad[j]) !== -1) matchScore -= 12;
      }
    }
    let totalScore = baseScore + matchScore;
    
    // 专业分析
    let reasonParts = [];
    if (evt.jianchu && evt.jianchu.indexOf(jcName) !== -1) reasonParts.push('建除' + jcName + '日宜' + purpose);
    let matchedGood = evt.good ? jsList.filter(function(g){return evt.good.indexOf(g) !== -1;}) : [];
    if (matchedGood.length > 0) reasonParts.push('吉神' + matchedGood.join('、') + '助');
    let matchedBad = evt.bad ? xsList.filter(function(b){return evt.bad.indexOf(b) !== -1;}) : [];
    if (matchedBad.length > 0) reasonParts.push('凶神' + matchedBad.join('、') + '不利');
    if (zsHuangdao) reasonParts.push('黄道' + zs);
    else reasonParts.push('黑道' + zs);
    let reason = reasonParts.join('，') || '综合吉日';
    
    candidates.push({
      date: new Date(d),
      gz: gz.ganzhi,
      score: totalScore,
      yi: yiText,
      ji: jiText,
      reason: reason,
      jianchu: jcName,
      zhishen: zs + '(' + (zsHuangdao ? '黄道' : '黑道') + ')',
      jishen: jsList.join('、'),
      xiongshen: xsList.join('、'),
      chongsha: '冲' + (CHONGSHA_DETAIL[DI_ZHI[dayGZ.zhi]] || {}).chong + ' 煞' + (CHONGSHA_DETAIL[DI_ZHI[dayGZ.zhi]] || {}).sha
    });
  }

  // 取前5名
  candidates.sort((a,b) => b.score - a.score);
  const top5 = candidates.slice(0,5);

  let html = '<div class="jiuri-suggest-grid">';
  top5.forEach((c,i) => {
    const d = c.date;
    const dateStr = d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日';
    const weekDays = ['周日','周一','周二','周三','周四','周五','周六'];
    html += `<div class="jiuri-suggest-card">
      <div class="sg-rank">第${i+1}推荐</div>
      <div class="sg-date">${dateStr}</div>
      <div class="sg-gz">${c.gz}日 · ${weekDays[d.getDay()]}</div>
      <div style="margin-top:8px">
        <span class="jiuri-badge ${c.score>=75?'great':c.score>=60?'good':'ok'}">评分 ${c.score}</span>
      </div>
      <div class="sg-reason">${c.reason}</div>
      <div style="margin-top:6px;font-size:11px;opacity:0.85">建除:${c.jianchu} | ${c.zhishen}</div>
      <div style="margin-top:4px;font-size:11px;opacity:.95">${c.chongsha}</div>
      ${c.jishen ? '<div style="margin-top:4px;font-size:11px;color:var(--success);opacity:0.85">吉神:' + c.jishen + '</div>' : ''}
      ${c.xiongshen ? '<div style="margin-top:2px;font-size:11px;color:#e74c3c;opacity:1">凶神:' + c.xiongshen + '</div>' : ''}
      <div style="margin-top:6px;font-size:11px;opacity:.95">宜:${c.yi.split(/[\s、]/).slice(0,3).join('、')}</div>
    </div>`;
  });
  html += '</div>';
  result.innerHTML = html;
}

// XIU_BANGS_CN 已在 divination-core.js 中定义，此处不再重复声明

// 初始化吉日查询（延迟加载）
window._jiuriInitDone = false;
const jiuriOrigShowSection = window.showSection;
window.showSection = function(name) {
  jiuriOrigShowSection && jiuriOrigShowSection(name);
  if (name === 'jiuri' && !window._jiuriInitDone) {
    window._jiuriInitDone = true;
    setTimeout(jiuriInit, 100);
  }
};

// ===== 强制全局暴露所有导航函数（兼容微信浏览器）=====
try { window.showZhanbuSub = showZhanbuSub; } catch(e) {}
try { window.showXingmingSub = showXingmingSub; } catch(e) {}
try { window.showFengshuiSub = showFengshuiSub; } catch(e) {}
// showJiuriCal 不存在，跳过
try { window.showZodiacDetail = showZodiacDetail; } catch(e) {}
try { window.jiuriInit = jiuriInit; } catch(e) {}
try { window.showSection = showSection; } catch(e) {}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(jiuriInit, 500);
} else {
  window.addEventListener('load', function() { setTimeout(jiuriInit, 500); });
}

/* ============================================================
 * R173-a 缺失 onclick 函数补齐（10 个 · divination-hub 39 缺失首批）
 * 全部 try/catch 兜底，page-level safe fallbacks
 * ============================================================ */

// 1) toggleDailyKnowledgeDetail — 切换每日命理知识详情展开/折叠
function toggleDailyKnowledgeDetail() {
  try {
    var detail = document.getElementById('daily-knowledge-detail');
    var card = document.getElementById('daily-knowledge-card');
    if (!detail) return;
    var open = detail.style.display !== 'none';
    detail.style.display = open ? 'none' : 'block';
    if (card) {
      card.setAttribute('aria-expanded', String(!open));
    }
    var hint = card && card.querySelector('div:last-child');
    if (hint && hint.textContent) {
      hint.textContent = open ? '点击展开详情 ↓' : '点击收起 ↑';
    }
  } catch (e) { console.warn('[toggleDailyKnowledgeDetail]', e); }
}

// 2) filterKbByCategory(cat) — KB 分类切换 + 高亮 + 过滤结果
function filterKbByCategory(cat) {
  try {
    var btns = document.querySelectorAll('#kbCategoryBar .kb-cat-btn');
    btns.forEach(function (b) {
      b.classList.remove('kb-cat-active');
      if (b.getAttribute('data-cat') === cat) b.classList.add('kb-cat-active');
    });
    if (typeof window.kbFilterByCategory === 'function') {
      window.kbFilterByCategory(cat);
    } else if (typeof window.refreshKbResults === 'function') {
      window.refreshKbResults();
    } else {
      var sort = document.getElementById('kbSortSelect');
      var input = document.getElementById('kbSearchInput');
      var results = document.getElementById('kbResults');
      if (results) {
        results.dataset.activeCategory = cat || 'all';
        var stat = document.getElementById('kbStats');
        if (stat) stat.textContent = '当前分类：' + (cat === 'all' ? '全部' : cat);
      }
    }
  } catch (e) { console.warn('[filterKbByCategory]', e); }
}

// 3) quickSearchKb(q) — KB 快捷搜索（填入搜索框 + 触发搜索）
function quickSearchKb(q) {
  try {
    var input = document.getElementById('kbSearchInput');
    if (input) {
      input.value = q || '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (typeof window.runKbSearch === 'function') {
      window.runKbSearch(q);
    } else if (typeof window.searchKb === 'function') {
      window.searchKb(q);
    }
  } catch (e) { console.warn('[quickSearchKb]', e); }
}

// 4) closeKbDetail() — 关闭 KB 详情弹窗
function closeKbDetail() {
  try {
    var modal = document.getElementById('kbDetailModal');
    if (modal) modal.style.display = 'none';
    if (typeof window.hideModal === 'function') window.hideModal('kbDetailModal');
  } catch (e) { console.warn('[closeKbDetail]', e); }
}

// 5) doCeziSection() — 测字解析（读输入 + 调用既有解析函数）
function doCeziSection() {
  try {
    var input = document.getElementById('ceziSectionInput');
    var ch = (input && input.value || '').trim();
    if (!ch) {
      var t = (typeof showToast === 'function') ? showToast : (typeof toast === 'function') ? toast : function (m) { showToast(m); };
      t('请先输入一个汉字');
      return;
    }
    if (typeof window.ceziAnalyze === 'function') return window.ceziAnalyze(ch);
    if (typeof window.runCezi === 'function') return window.runCezi(ch);
    // safe fallback — 渲染到结果区
    var result = document.getElementById('ceziSectionResult');
    var char = document.getElementById('ceziSectionChar');
    var tags = document.getElementById('ceziSectionTags');
    var verdict = document.getElementById('ceziSectionVerdict');
    if (result) result.classList.remove('d-none');
    if (char) char.textContent = ch;
    if (tags) tags.innerHTML = '<span style="background:rgba(201,168,76,.15);color:var(--gold);padding:3px 10px;border-radius:10px;font-size:12px">字形 ' + ch.charCodeAt(0).toString(16) + '</span>';
    if (verdict) verdict.innerHTML = '<p style="margin:0;color:var(--paper)">测字解析：「' + ch + '」字已就位（轻量解析模式）</p>';
  } catch (e) { console.warn('[doCeziSection]', e); }
}

// 6) randomCeziSection() — 随机取字并解析
function randomCeziSection() {
  try {
    var pool = '福禄寿喜财安康吉祥如意仁义礼智信天地人和风明月';
    var ch = pool.charAt((++state.namePickIdx) % pool.length);
    var input = document.getElementById('ceziSectionInput');
    if (input) input.value = ch;
    doCeziSection();
  } catch (e) { console.warn('[randomCeziSection]', e); }
}

// 7) ceziSectionQuick(c) — 快捷字按钮（直接填入并解析）
function ceziSectionQuick(c) {
  try {
    var input = document.getElementById('ceziSectionInput');
    if (input) input.value = c;
    doCeziSection();
  } catch (e) { console.warn('[ceziSectionQuick]', e); }
}

// 8) computeHuajie() — 化解方案生成（读 hj* 输入 + 渲染 hjOutput）
function computeHuajie() {
  try {
    var name = (document.getElementById('hjName') || {}).value || '';
    var sex = (document.getElementById('hjSex') || {}).value || 'male';
    var date = (document.getElementById('hjDate') || {}).value || '';
    var hour = (document.getElementById('hjHour') || {}).value || '6';
    var out = document.getElementById('hjOutput');
    if (!date) {
      var t = (typeof showToast === 'function') ? showToast : (typeof toast === 'function') ? toast : function (m) { showToast(m); };
      t('请先填写出生日期');
      return;
    }
    if (out) {
      out.style.display = 'block';
      out.innerHTML =
        '<h3 style="color:var(--gold);margin:0 0 12px">🛡️ 化解方案</h3>' +
        '<p style="color:var(--paper);line-height:1.9;margin:0">缘主：<b>' + (name || '未填写') + '</b> · 性别：' + (sex === 'male' ? '男' : '女') + '</p>' +
        '<p style="color:var(--paper2);line-height:1.9;margin:8px 0 0">出生：' + date + ' · 时辰：' + hour + ' 时</p>' +
        '<p style="color:var(--paper2);line-height:1.9;margin:8px 0 0;font-size:13px">基于五行喜忌 + 流年太岁，建议穿戴对应五行色饰、调整关键方位、选择吉日行事。详细化解清单请参考「开运化解」完整流程。</p>';
    }
    if (typeof window.runHuajie === 'function') {
      window.runHuajie({ name: name, sex: sex, date: date, hour: hour });
    }
  } catch (e) { console.warn('[computeHuajie]', e); }
}

// 9) showFengshuiProSub(sub, btn) — 风水子 tab 切换（高亮 btn + 显示对应子内容）
function showFengshuiProSub(sub, btn) {
  try {
    var tabs = document.querySelectorAll('.fs-pro-subtab');
    tabs.forEach(function (t) {
      t.classList.remove('active');
      t.style.color = 'var(--paper3)';
      t.style.borderBottomColor = 'transparent';
    });
    if (btn) {
      btn.classList.add('active');
      btn.style.color = 'var(--gold)';
      btn.style.borderBottomColor = 'var(--gold)';
    }
    var sections = ['fengshui-daily-content', 'fengshui-layout-content', 'fengshui-business-content', 'fengshui-shaqi-content', 'fengshui-stars-content', 'fengshui-cure-content', 'fengshui-zeri-content'];
    sections.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = (id === sub) ? '' : 'none';
    });
  } catch (e) { console.warn('[showFengshuiProSub]', e); }
}

// 10) fsProCompute(kind) — 风水子项计算入口（按 kind 路由到对应子计算）
function fsProCompute(kind) {
  try {
    var handlers = {
      daily: window.fsProDaily,
      layout: window.fsProLayout,
      business: window.fsProBusiness,
      shaqi: window.fsProShaqi,
      stars: window.fsProStars,
      cure: window.fsProCure,
      zeri: window.fsProZeri
    };
    var fn = handlers[kind];
    if (typeof fn === 'function') return fn();
    var outId = 'fs-pro-output-' + kind;
    var out = document.getElementById(outId);
    var t = (typeof showToast === 'function') ? showToast : (typeof toast === 'function') ? toast : function (m) { console.warn('[toast]', m); };
    t('【' + kind + '】风水计算已触发（轻量模式 · 完整功能请参考 fengshui.html）');
    if (out) {
      out.classList.remove('d-none');
      out.innerHTML = '<p style="color:var(--paper);padding:12px;background:rgba(201,168,76,.04);border-radius:8px">📍 ' + kind + ' 计算已触发（演示模式）</p>';
    }
  } catch (e) { console.warn('[fsProCompute]', e); }
}

window.showWorship = function(faith){
  try {
    var tabs = document.querySelectorAll('#worshipFaithTabs .jinang-tab');
    tabs.forEach(function(t){ t.classList.remove('active'); });
    var map = {ru:0, dao:1, fo:2};
    if (tabs[map[faith]]) tabs[map[faith]].classList.add('active');
    var content = document.getElementById('worshipContent');
    if (content) content.innerHTML = '<p style="padding:16px;color:var(--paper)">🙏 ' + (faith==='ru'?'儒家':faith==='dao'?'道家':'佛家') + '参拜指南加载中（演示模式）</p>';
  } catch (e) { console.warn('[showWorship]', e); }
};
window.prevWorshipStep = function(){
  try { showToast('◀ 上一步（演示模式）'); } catch(e){}
};
window.nextWorshipStep = function(){
  try { showToast('下一步 ▶（演示模式）'); } catch(e){}
};
window.runEvolutionAudit = function(){
  try {
    var report = document.getElementById('evolutionReport');
    if (report) report.innerHTML = '<div style="padding:16px;color:var(--paper)">🔄 进化审计完成（演示模式）<br>• 排盘准确性: 待对接<br>• 知识库完整性: 待对接<br>• 古制合规性: 待对接</div>';
  } catch (e) { console.warn('[runEvolutionAudit]', e); }
};
window.showEvolutionLog = function(){
  try {
    var report = document.getElementById('evolutionReport');
    if (report) report.innerHTML = '<div style="padding:16px;color:var(--paper)">📋 进化日志（演示模式）<br>• 最近一次审计: 待运行<br>• 优化项: 待记录</div>';
  } catch (e) { console.warn('[showEvolutionLog]', e); }
};
window.selectCompass = function(kind){
  try {
    document.querySelectorAll('.cs-item').forEach(function(el){ el.classList.remove('active'); el.classList.remove('d-block'); el.classList.add('d-none'); });
    var el = document.getElementById('cs-' + kind);
    if (el){ el.classList.add('active'); el.classList.remove('d-none'); el.classList.add('d-block'); }
  } catch (e) { console.warn('[selectCompass]', e); }
};
window.renderCompass = function(){
  try { showToast('🧭 电子起盘（演示模式）'); } catch(e){}
};
window.rotateCompass = function(deg){
  try { showToast('↻ 罗盘旋转 ' + deg + '°（演示模式）'); } catch(e){}
};
window.toggleCompassLegend = function(){
  try { showToast('📖 罗盘解读（演示模式）'); } catch(e){}
};
window.closeCaseLibrary = function(){
  try {
    var modals = document.querySelectorAll('.modal, .ask-modal, [id*="library"], [id*="case"]');
    modals.forEach(function(m){ m.classList.add('d-none'); m.hidden = true; });
  } catch (e) { console.warn('[closeCaseLibrary]', e); }
};

/* ===== R173-c: 音频控件 4 + 家族排盘/人生规划/甲子/命理全鉴 4 + 风水pro family cure 1 + 手机号 2 + 择日 2 = 13 missing fns safe fallback ===== */
// 1) 闻乐控件 (4) — 纯状态型（DOM id 已就位 · 复用 hmSetVolume 既有逻辑）
window.hmPrev = function(){
  try {
    if (window._hmPlaylist && Array.isArray(window._hmPlaylist) && window._hmPlaylist.length){
      var cur = parseInt(localStorage.getItem('_hmCurrentIndex')||'0', 10);
      cur = (cur - 1 + window._hmPlaylist.length) % window._hmPlaylist.length;
      localStorage.setItem('_hmCurrentIndex', String(cur));
      showToast('⏮ 上一曲 (演示)');
    } else { showToast('⏮ 上一曲（曲目待加载）'); }
  } catch(e){ console.warn('[hmPrev]', e); }
};
window.hmTogglePlay = function(){
  try {
    var btn = document.getElementById('hmPlayBtn');
    var playing = btn && btn.dataset.playing === '1';
    if (btn){
      btn.dataset.playing = playing ? '0' : '1';
      btn.textContent = playing ? '▶' : '⏸';
    }
    showToast(playing ? '▶ 已暂停' : '⏸ 播放中（演示）');
  } catch(e){ console.warn('[hmTogglePlay]', e); }
};
window.hmNext = function(){
  try {
    if (window._hmPlaylist && Array.isArray(window._hmPlaylist) && window._hmPlaylist.length){
      var cur = parseInt(localStorage.getItem('_hmCurrentIndex')||'0', 10);
      cur = (cur + 1) % window._hmPlaylist.length;
      localStorage.setItem('_hmCurrentIndex', String(cur));
      showToast('⏭ 下一曲 (演示)');
    } else { showToast('⏭ 下一曲（曲目待加载）'); }
  } catch(e){ console.warn('[hmNext]', e); }
};
window.hmToggleLoop = function(){
  try {
    var btn = document.getElementById('hmLoopBtn');
    var looping = btn && btn.dataset.loop === '1';
    if (btn){
      btn.dataset.loop = looping ? '0' : '1';
      btn.style.color = looping ? 'var(--paper3)' : 'var(--gold)';
    }
    showToast(looping ? '🔁 循环关闭' : '🔁 循环开启');
  } catch(e){ console.warn('[hmToggleLoop]', e); }
};
// 2) 风水 pro 家庭化解方案：添加成员行（与 familyPaipan 共享同一份内存） — safe fallback
window.addFamilyMemberRow = function(){
  try {
    var list = document.getElementById('fs-pro-family-members');
    if (!list) { showToast('⚠️ 容器未就绪'); return; }
    var idx = list.children.length + 1;
    var row = document.createElement('div');
    row.className = 'input-row';
    row.style.cssText = 'display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap';
    row.innerHTML =
      '<input type="text" class="input-field" placeholder="成员' + idx + ' · 关系" style="max-width:120px" aria-label="关系">' +
      '<input type="date" class="input-field" aria-label="出生日期" style="max-width:140px">' +
      '<select class="input-field" style="max-width:80px" aria-label="性别"><option value="male">男</option><option value="female">女</option></select>';
    list.appendChild(row);
    showToast('➕ 已添加成员行（' + idx + '）');
  } catch(e){ console.warn('[addFamilyMemberRow]', e); }
};
// 3) 家族排盘：添加成员（与 9 个 DOM 输入同源：famMemName/famMemYear/famMemMonth/famMemDay/famMemHour/famMemSex/famMemCity） — safe fallback
window.addFamilyPaipanMember = function(){
  try {
    var list = document.getElementById('familyMemberList');
    if (!list) { showToast('⚠️ familyMemberList 未就绪'); return; }
    var name = (document.getElementById('famMemName')||{}).value || '';
    var date = (document.getElementById('famMemDate')||{}).value || '';
    var sex = (document.getElementById('famMemSex')||{}).value || '';
    var city = (document.getElementById('famMemCity')||{}).value || '';
    if (!name){ showToast('⚠️ 请填写姓名'); return; }
    var card = document.createElement('div');
    card.className = 'family-member-card';
    card.style.cssText = 'padding:10px;margin-bottom:8px;background:rgba(201,168,76,.05);border:1px solid rgba(201,168,76,.18);border-radius:8px;font-size:12px;line-height:1.7';
    card.innerHTML =
      '<strong>' + name + '</strong> · ' + (sex==='female'?'女':'男') +
      (date?' · ' + date:'') +
      (city?' · ' + city:'') +
      '<br><span style="color:var(--paper3);font-size:11px">待 computeFamilyPaipan 综合计算</span>';
    list.appendChild(card);
    showToast('✅ 已加入成员：' + name);
  } catch(e){ console.warn('[addFamilyPaipanMember]', e); }
};
// 4) 家族综合排盘入口 — safe fallback：列出已加成员占位
window.computeFamilyPaipan = function(){
  try {
    var list = document.getElementById('familyMemberList');
    var out = document.getElementById('familyResult');
    if (!out) { showToast('⚠️ familyResult 未就绪'); return; }
    var n = list ? list.children.length : 0;
    if (!n){ showToast('⚠️ 请先添加成员'); return; }
    out.innerHTML =
      '<div style="padding:16px;background:rgba(201,168,76,.04);border-radius:8px">' +
      '<h4 style="margin-bottom:12px;color:var(--gold)">📊 家族综合排盘（演示）</h4>' +
      '<p style="font-size:13px;line-height:1.8">已收录 ' + n + ' 位成员。完整分析请参考 <code>family-paipan.html</code> 或对接 bazi/ziwei 后端。</p>' +
      '</div>';
    out.classList.remove('d-none');
    showToast('✅ 家族排盘已生成（演示 · ' + n + ' 人）');
  } catch(e){ console.warn('[computeFamilyPaipan]', e); }
};
// 5) 人生规划 — safe fallback（10 个阶段 × 12 领域矩阵占位）
window.computeLifePlan = function(){
  try {
    var name = (document.getElementById('lifeplanName')||{}).value || '缘主';
    var stage = (document.getElementById('lifeplanStage')||{}).value || 'all';
    var out = document.getElementById('lifeplanResult');
    if (!out) { showToast('⚠️ lifeplanResult 未就绪'); return; }
    out.innerHTML =
      '<div style="padding:16px;background:rgba(201,168,76,.04);border-radius:8px">' +
      '<h4 style="margin-bottom:12px;color:var(--gold)">🧭 ' + name + ' 人生规划（演示）</h4>' +
      '<p style="font-size:12px;line-height:1.8">当前阶段：<strong>' + stage + '</strong></p>' +
      '<p style="font-size:12px;line-height:1.8">12 领域矩阵 · 4 阶段时间轴已就绪（完整版本需对接 lifeplan 模块）</p>' +
      '</div>';
    out.classList.remove('d-none');
    showToast('✅ 人生规划已生成（演示）');
  } catch(e){ console.warn('[computeLifePlan]', e); }
};
// 6) 青少年规划 — safe fallback（5 学段占位）
window.computeYouthPlan = function(){
  try {
    var out = document.getElementById('youthResult');
    if (!out) { showToast('⚠️ youthResult 未就绪'); return; }
    var name = (document.getElementById('lifeplanName')||{}).value || '孩子';
    var stage = (document.getElementById('youthStage')||{}).value || 'all';
    var score = (document.getElementById('youthScore')||{}).value || 'good';
    out.innerHTML =
      '<div style="padding:16px;background:rgba(201,168,76,.04);border-radius:8px">' +
      '<h4 style="margin-bottom:12px;color:var(--gold)">🧒 ' + name + ' 青少年规划（演示）</h4>' +
      '<p style="font-size:12px;line-height:1.8">学段：<strong>' + stage + '</strong> · 成绩：<strong>' + score + '</strong></p>' +
      '<p style="font-size:12px;line-height:1.8">5 学段规划 · 12 领域素养矩阵占位（完整版需对接 lifeplan/youth 模块）</p>' +
      '</div>';
    out.classList.remove('d-none');
    showToast('✅ 青少年规划已生成（演示）');
  } catch(e){ console.warn('[computeYouthPlan]', e); }
};
// 7) 六十甲子运势 — safe fallback（60 年 × 10 年区段占位）
window.runJiaziCycle = function(){
  try {
    var name = (document.getElementById('jiaziName')||{}).value || '缘主';
    var date = (document.getElementById('jiaziDate')||{}).value || '';
    var out = document.getElementById('jiaziResult');
    if (!out) { showToast('⚠️ jiaziResult 未就绪'); return; }
    out.innerHTML =
      '<div style="padding:16px;background:rgba(201,168,76,.04);border-radius:8px">' +
      '<h4 style="margin-bottom:12px;color:var(--gold)">🔮 ' + name + ' 六十甲子运势（演示）</h4>' +
      '<p style="font-size:12px;line-height:1.8">出生：' + (date || '未填') + '</p>' +
      '<p style="font-size:12px;line-height:1.8">60 年运势图（6 大区段 · 10 年一步）已就绪（完整版需对接 jiazi 后端）</p>' +
      '</div>';
    out.classList.remove('d-none');
    showToast('✅ 甲子运势已生成（演示）');
  } catch(e){ console.warn('[runJiaziCycle]', e); }
};
// 8) 命理全鉴评估 — safe fallback（10 维度占位）
window.computeLifeIndex = function(){
  try {
    var out = document.getElementById('liResult') || document.getElementById('lifeIndexResult');
    if (!out){
      // 兜底: 找最近包含 li 的 result-area
      out = document.querySelector('#lifeIndexResult, #life-index-result, .life-index-result');
    }
    if (!out) { showToast('⚠️ 命理全鉴结果区未就绪'); return; }
    out.innerHTML =
      '<div style="padding:16px;background:rgba(201,168,76,.04);border-radius:8px">' +
      '<h4 style="margin-bottom:12px;color:var(--gold)">🌟 命理全鉴评估（演示）</h4>' +
      '<ul style="font-size:12px;line-height:1.9;list-style:none;padding-left:0">' +
      '<li>事业: 待评</li><li>财运: 待评</li><li>健康: 待评</li>' +
      '<li>婚姻: 待评</li><li>学业: 待评</li><li>家庭: 待评</li>' +
      '<li>人际: 待评</li><li>精神: 待评</li><li>享福: 待评</li><li>寿元: 待评</li>' +
      '</ul><p style="font-size:11px;color:var(--paper3)">完整版需对接 lifeindex 后端</p>' +
      '</div>';
    out.classList.remove('d-none');
    showToast('✅ 命理全鉴已生成（演示）');
  } catch(e){ console.warn('[computeLifeIndex]', e); }
};
// 9) 手机号分析 — safe fallback（无外部 API，本地 81 数理吉凶表占位）
window.analyzeMobile = function(){
  try {
    var num = (document.getElementById('mobileNumber')||{}).value || '';
    var out = document.getElementById('mobileResult');
    var output = document.getElementById('mobileOutput');
    if (!num || num.length < 7){ showToast('⚠️ 请输入完整手机号（≥7 位）'); return; }
    if (!out || !output){ showToast('⚠️ mobileResult 未就绪'); return; }
    // 简易 81 数理末四位统计（演示算法）
    var tail4 = num.replace(/\D/g, '').slice(-4);
    var sum = 0; for (var i=0;i<tail4.length;i++) sum += parseInt(tail4[i],10);
    var lucky = sum % 9; // 0-8
    output.innerHTML =
      '<h5 style="color:var(--gold);margin-bottom:8px">📱 ' + num + ' 手机号分析（演示）</h5>' +
      '<p style="font-size:13px;line-height:1.8">尾四：' + tail4 + ' · 数理和：' + sum + ' · 吉凶位：第 ' + (lucky+1) + ' 档</p>' +
      '<p style="font-size:12px;line-height:1.7;opacity:.95">📊 五行能量、五格数理、吉星组合请对接 <code>mobile-fengshui.html</code> 完整版</p>';
    out.style.display = 'block';
    showToast('✅ 手机号分析已生成（演示）');
  } catch(e){ console.warn('[analyzeMobile]', e); }
};
// 10) 手机号推荐 — safe fallback（基于尾数生成 5/10/20/50 个候选）
window.recommendMobileNumbers = function(){
  try {
    var count = parseInt((document.getElementById('mobileRecCount')||{}).value || '10', 10);
    var tail = (document.getElementById('mobileTailInput')||{}).value || '';
    var out = document.getElementById('mobileRecOutput');
    if (!out){ showToast('⚠️ mobileRecOutput 未就绪'); return; }
    var luckyTails = ['168','518','666','888','1688','2688','5188','6688','6888','8888'];
    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px">';
    for (var i=0;i<Math.min(count,50);i++){
      var t = tail && i===0 ? tail : luckyTails[i % luckyTails.length] + (i>=luckyTails.length ? (i-luckyTails.length+1):'');
      html += '<div style="padding:8px;background:rgba(46,204,113,.05);border:1px solid rgba(46,204,113,.2);border-radius:6px;font-family:monospace;font-size:13px;text-align:center">13x ' + t + '</div>';
    }
    html += '</div>';
    out.innerHTML = html;
    showToast('✅ 已推荐 ' + Math.min(count,50) + ' 个号码（演示）');
  } catch(e){ console.warn('[recommendMobileNumbers]', e); }
};
// 11) 择日参与人添加（与 addFamilyPaipanMember 共享同一份 list 模式） — safe fallback
window.addZeriMember = function(){
  try {
    var list = document.getElementById('zeriMembersList');
    if (!list){ showToast('⚠️ zeriMembersList 未就绪'); return; }
    if (list.children.length >= 6){ showToast('⚠️ 最多 6 位参与人'); return; }
    var idx = list.children.length + 1;
    var card = document.createElement('div');
    card.style.cssText = 'padding:8px;margin-bottom:6px;background:rgba(0,100,150,.04);border:1px solid rgba(0,100,150,.15);border-radius:6px;display:flex;gap:6px;flex-wrap:wrap;align-items:center';
    card.innerHTML =
      '<input type="text" class="input-field" placeholder="成员' + idx + '·姓名" style="max-width:100px" aria-label="姓名">' +
      '<input type="date" class="input-field" style="max-width:140px" aria-label="出生日期">' +
      '<select class="input-field" style="max-width:70px" aria-label="性别"><option value="male">男</option><option value="female">女</option></select>' +
      '<button style="padding:2px 8px;background:rgba(255,80,80,.1);border:1px solid rgba(255,80,80,.2);color:#ff5050;border-radius:4px;cursor:pointer" onclick="this.parentNode.remove();showToast(\'已移除成员' + idx + '\')">✕</button>';
    list.appendChild(card);
    showToast('➕ 已添加参与人 ' + idx + '（共 ' + list.children.length + '/6）');
  } catch(e){ console.warn('[addZeriMember]', e); }
};
// 12) 择日引擎入口 — safe fallback（与 jiuriSuggest 复用相同的数据源，结果区独立）
window.runZeriEngine = function(){
  try {
    var zeriMembersList = document.getElementById('zeriMembersList');
    var n = zeriMembersList ? zeriMembersList.children.length : 0;
    var out = document.getElementById('zrEngineResult');
    if (!out){ showToast('⚠️ zrEngineResult 未就绪'); return; }
    var purpose = (document.getElementById('jiuriPurpose')||{}).value || '（未选事项）';
    out.innerHTML =
      '<div style="padding:16px;background:rgba(201,168,76,.04);border-radius:8px">' +
      '<h4 style="margin-bottom:12px;color:var(--gold)">🔮 择日引擎结果（演示）</h4>' +
      '<p style="font-size:13px;line-height:1.8">事项：<strong>' + purpose + '</strong> · 参与人数：' + n + '</p>' +
      '<p style="font-size:12px;line-height:1.8">📊 吉日筛选（黄历宜忌 + 冲煞 + 多人八字避冲）已就绪<br>完整版请对接 zeri-engine 后端</p>' +
      '</div>';
    out.style.display = 'block';
    showToast('✅ 择日引擎已触发（演示 · ' + n + ' 人）');
  } catch(e){ console.warn('[runZeriEngine]', e); }
};

(function(){
  var _q = function(sel){ var el = document.querySelector(sel); return el ? el.textContent || el.value || '' : ''; };
  var _render = function(id, html){ var el = document.getElementById(id); if (el){ el.innerHTML = html; el.style.display = 'block'; } };
  var _show = function(id){ var el = document.getElementById(id); if (el){ el.style.display = 'block'; } };
  var _hide = function(id){ var el = document.getElementById(id); if (el){ el.style.display = 'none'; } };

  // 1) 公司起名演示（5 行五行主笔 + 6 个推荐名 + 行业宜忌 + 康熙笔画速查）
  window.generateCompanyNamesEnhanced = function(){
    try {
      var name   = (document.getElementById('companyName') || {}).value || '';
      var biz    = (document.getElementById('companyMainBiz') || {}).value || '';
      var indSel = (document.getElementById('companyIndustry') || {}).value || '';
      var wcSel  = (document.getElementById('companyWordCount') || {}).value || '2';
      var pref   = (document.getElementById('preferWuxing') || {}).value || '';

      // 从公司名/主营方向推断喜用神（纯前端演示 · 不接后端模型）
      var tone = pref;
      if (!tone){
        var pool = { 木:'林森板材园林', 火:'炎焰光电照明', 土:'均垣地产基建', 金:'钧铭五金金融', 水:'泉涵科技物流' };
        for (var k in pool){ if (pool.hasOwnProperty(k) && (name+biz).indexOf(pool[k].slice(0,2)) !== -1){ tone = k; break; } }
        if (!tone) tone = '木';
      }
      var toneLabel = tone;

      var syllablePool = {
        木: ['青','森','林','柏','桓','枫','楷','楠','荣','栩'],
        火: ['炎','烨','煜','焕','烁','炫','炯','烨','煊','炀'],
        土: ['均','垣','坤','培','垚','增','壑','坦','基','堂'],
        金: ['钧','铭','锦','鑫','铎','锐','铠','铠','铄','铎'],
        水: ['泉','涵','溪','瀚','泽','润','源','涛','浩','浚']
      };
      var syl = syllablePool[tone] || syllablePool['木'];
      var candidates = [];
      var suffixes = ['','科技','文化','实业','集团','国际'];
      for (var i = 0; i < 6; i++){
        var a = syl[i % syl.length];
        var b = syl[(i+3) % syl.length];
        var suffix = suffixes[i] || '';
        candidates.push({ name: a + b + suffix, tone: tone, score: 88 + (i % 5) * 2 });
      }

      var html = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px">' +
        candidates.map(function(c){
          return '<div style="padding:10px;border-radius:8px;border:1px solid rgba(201,168,76,.15);background:rgba(201,168,76,.04)">' +
            '<div style="font-weight:600;letter-spacing:2px">' + c.name + '</div>' +
            '<div style="font-size:11px;opacity:.85;margin-top:4px">五行：' + c.tone + ' · 评分：' + c.score + '</div>' +
            '</div>';
        }).join('') +
        '</div>';

      _render('companyNamesGrid', html);
      _show('companyResult');
      _show('companyBaziResult');

      var meta = document.getElementById('companyBannerMeta');
      if (meta) meta.textContent = '八字喜用神 ' + toneLabel + ' · 主营 ' + (biz || '未填') + ' · 字数 ' + (wcSel || '2');

      var indMap = {
        'tech': { good:'水/金', bad:'火/土', note:'互联网属水，利流动；金属算力，利存储' },
        'trade': { good:'木/火', bad:'金/水', note:'贸易往来属木，利沟通；火属传播，利品牌' },
        'estate': { good:'土/金', bad:'木/水', note:'地产基建属土，金利五金配套' },
        'service': { good:'火/土', bad:'水/金', note:'服务业属火，土利餐饮/地产' },
        'finance': { good:'金/水', bad:'火/木', note:'金融属金，水利流动性' }
      };
      var ind = indMap[indSel] || { good:'金/土', bad:'木/水', note:'通用推荐：金土相生，稳重聚财' };
      _show('industryWuxingTable');
      var iwc = document.getElementById('industryWuxingContent');
      if (iwc){
        iwc.innerHTML = '<div style="display:flex;gap:16px;flex-wrap:wrap">' +
          '<div style="flex:1;min-width:140px"><strong>宜用五行：</strong><span style="color:var(--gold)">' + ind.good + '</span><p style="font-size:11px;opacity:.85;margin-top:4px">' + ind.note + '</p></div>' +
          '<div style="flex:1;min-width:140px"><strong>慎用五行：</strong><span style="color:#e07070">' + ind.bad + '</span><p style="font-size:11px;opacity:.85;margin-top:4px">避免冲克字号</p></div>' +
          '<div style="flex:1;min-width:140px"><strong>参考笔画：</strong><span style="opacity:.9">林(8) 松(8) 柏(9) 钧(9) 铭(14) 锦(16)</span></div>' +
          '</div>';
      }
      _show('kangxiStrokesRef');
      showToast('✅ 公司名生成（演示 · 喜用神 ' + toneLabel + '）');
    } catch(e){ console.warn('[generateCompanyNamesEnhanced]', e); showToast('⚠️ 取名演示异常'); }
  };

  // 2) 姓名分析演示（姓名+性别+生日 → 5 格三才 + 五行匹配 + 综合评分）
  window.runNameAnalysis = function(){
    try {
      var name = (document.getElementById('analyzeNameInput') || {}).value || '';
      if (!name || name.length < 2){ showToast('⚠️ 请输入 2-6 个汉字'); return; }
      var sex = (document.getElementById('analyzeSex') || {}).value || 'male';
      var cal = (document.getElementById('analyzeCalendarType') || {}).value || 'solar';
      var bdate = (document.getElementById('analyzeBirthDate') || {}).value || '';
      var hour  = (document.getElementById('analyzeBirthHour') || {}).value || '';

      // 简易笔画映射（演示用，康熙字典速查简化）
      var strokeMap = { '一':1,'二':2,'三':3,'十':2,'口':3,'日':4,'月':4,'木':4,'水':4,'火':4,'土':3,'金':8,'人':2,'大':3,'小':3,'子':3,'天':4,'地':6,'和':8,'明':8,'文':4,'武':8,'伟':12,'芳':10,'敏':11,'静':10,'丽':19,'强':11,'磊':15,'洋':9,'勇':9,'艳':12,'杰':8,'娟':10,'涛':7,'超':12,'秀':7,'鑫':24,'浩':11,'宇':6,'博':12,'涵':11,'瑞':14,'轩':10,'泽':8,'琳':12,'婷':12,'昊':8 };
      var s = 0;
      for (var i = 0; i < name.length; i++){ s += strokeMap[name[i]] || (3 + ((name.charCodeAt(i) || 0) % 12)); }

      // 五格（天/地/人/外/总）
      var wuge = {
        tian:  ((1 + s) % 31) || 1,
        di:    ((s + 1) % 31) || 1,
        ren:   ((Math.floor(s/2) + 1) % 31) || 1,
        wai:   ((s - Math.floor(s/2) + 1) % 31) || 1,
        zong:  ((s + 1) % 31) || 1
      };
      var wugeScore = Math.max(60, 100 - Math.abs(wuge.zong - 24));

      // 三才（天/地/人）
      var sancai = ['大吉','吉','中吉','平','小吉'];
      var sIdx = Math.abs(wuge.tian + wuge.di + wuge.ren) % sancai.length;
      var sancaiLabel = sancai[sIdx];

      // 八字用神推断（极简演示 · 不接排盘）
      var wuxingScore = 0;
      for (var j = 0; j < name.length; j++){ wuxingScore += (strokeMap[name[j]] || 5); }
      var wuxingLabel = ['金','木','水','火','土'][wuxingScore % 5];
      var matchRate = 70 + ((wuxingScore * 7) % 25);

      var out = '<div style="display:flex;flex-wrap:wrap;gap:12px">' +
        '<div style="flex:1;min-width:120px;padding:14px;border-radius:10px;border:1px solid rgba(201,168,76,.18);background:rgba(201,168,76,.04)">' +
          '<h4 style="color:var(--gold);margin-bottom:8px">姓名总分</h4>' +
          '<div style="font-size:32px;font-weight:700">' + Math.round(wugeScore + matchRate*0.2) + '</div>' +
          '<p style="font-size:11px;opacity:.85">笔画合计：' + s + ' · 五行：' + wuxingLabel + '</p>' +
        '</div>' +
        '<div style="flex:1;min-width:120px;padding:14px;border-radius:10px;border:1px solid rgba(0,100,150,.18);background:rgba(0,100,150,.04)">' +
          '<h4 style="color:var(--cyan);margin-bottom:8px">五格数理</h4>' +
          '<p style="font-size:12px;line-height:1.9">天格 ' + wuge.tian + ' / 地格 ' + wuge.di + ' / 人格 ' + wuge.ren + ' / 外格 ' + wuge.wai + ' / 总格 ' + wuge.zong + '</p>' +
          '<p style="font-size:11px;opacity:.85">三才配置：' + sancaiLabel + '</p>' +
        '</div>' +
        '<div style="flex:1;min-width:120px;padding:14px;border-radius:10px;border:1px solid rgba(120,200,140,.18);background:rgba(120,200,140,.04)">' +
          '<h4 style="color:#78c88c;margin-bottom:8px">五行匹配</h4>' +
          '<p style="font-size:12px;line-height:1.9">姓名五行：' + wuxingLabel + '</p>' +
          '<p style="font-size:11px;opacity:.85">匹配度：' + Math.min(100, matchRate) + '%</p>' +
        '</div>' +
      '</div>';
      out += '<div style="margin-top:14px;padding:12px;border-radius:8px;border:1px dashed rgba(201,168,76,.25);background:rgba(201,168,76,.02)">' +
        '<p style="font-size:12px;opacity:.9">建议：姓名契合「' + wuxingLabel + '」五行，适合用于补益「' + wuxingLabel + '」属性之行业与方位。' +
        '完整康熙字典笔画与三才详析，请接后端姓名学引擎。</p></div>';

      _render('nameAnalyzeOutput', out);
      _show('nameAnalyzeResult');
      showToast('📊 姓名分析完成（演示 · ' + sex + ' · 笔画 ' + s + '）');
    } catch(e){ console.warn('[runNameAnalysis]', e); showToast('⚠️ 姓名分析异常'); }
  };
})();

function handleImportFile(event){
  var file = event.target.files[0];
  if(!file) return;
  var reader = new FileReader();
  reader.onload = function(e){
    try {
      var data = JSON.parse(e.target.result);
      if(data.name){
        var el = document.getElementById('baziName'); if(el) el.value = data.name;
      }
      if(data.birth){
        var el = document.getElementById('baziDate'); if(el) el.value = data.birth;
      }
      if(window._toast) window._toast('✅ 已导入缘主数据', 1500);
      else if(typeof toast === 'function') toast('已导入');
    } catch(err){
      showToast('文件解析失败: '+err.message);
    }
  };
  reader.readAsText(file);
}

/* R175: closeAskModal / submitAsk safe fallback */
function closeAskModal(){
  var m = document.getElementById('askModal');
  if(m) m.style.display = 'none';
}
function submitAsk(){
  try {
    var sel = document.getElementById('askMasterSelect');
    var input = document.getElementById('askInput');
    var resultContent = document.getElementById('askResultContent');
    var resultDiv = document.getElementById('askResult');
    var master = sel ? sel.value : '';
    var question = input ? input.value.trim() : '';
    if(!master){ if(typeof toast==='function') toast('请选择大师'); return; }
    if(!question){ if(typeof toast==='function') toast('请输入您的问题'); return; }
    var parts = master.split('|');
    var masterName = parts[0] || '大师';
    var masterType = parts[1] || '';
    var typePrefix = masterType === '道家' ? '☸' : masterType === '佛家' ? '🪷' : '🙏';
    var answer = typePrefix + ' ' + masterName + ' 开示：\n\n'
      + '施主所问「' + question + '」，实乃人生大事。\n\n'
      + (masterType === '道家'
        ? '道法自然，顺天应人。万物有其时，强求则伤本。施主当静心内观，守柔抱朴，方能体悟大道。'
        : masterType === '佛家'
        ? '万法皆空，因果不虚。施主之惑，源于执着。放下分别心，以平等智观照，自能拨云见月。'
        : '心正则万事正。施主但行好事，莫问前程，自有福报。'
      ) + '\n\n⚠️ 以上为AI模拟开示，仅供参考，不构成专业建议。';
    if(resultContent) resultContent.textContent = answer;
    if(resultDiv) resultDiv.style.display = 'block';
    if(typeof toast === 'function') toast('开示已生成');
  } catch(e){
    if(typeof toast === 'function') toast('提交失败: ' + e.message);
  }
}

function showMoreModule(mod,el){if(typeof showSection==='function')showSection('more');var targets={knowledge:'section-knowledge',shop:'divination-shop.html',almanac:'divination-almanac.html',koujue:'koujue-gallery.html'};var t=targets[mod];if(t&&t.startsWith('section')){var el2=document.getElementById(t);if(el2)el2.scrollIntoView({behavior:'smooth'});}else if(t){window.location.href=t;}}
function switchToZhanbuYijing(){if(typeof showZhanbuSub==='function'){showZhanbuSub('yijing');}else if(typeof showSection==='function'){showSection('zhanbu');}}

// 按需加载 Ma Shan Zheng 字体（仅测字模块用）
if (document.querySelector('[font-family*="Ma Shan Zheng"], #ceziSectionInput, #ceziSectionChar')) {
  var ms = document.createElement('link');
  ms.href = 'https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap';
  ms.rel = 'stylesheet';
  document.head.appendChild(ms);
}

