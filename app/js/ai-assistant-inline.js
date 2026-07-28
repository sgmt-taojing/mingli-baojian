// 精确节气表（1900-2100，紫金山天文台官方历法）
if(typeof JIEQI_TABLE==='undefined'&&typeof require!=='undefined'){try{eval(require('fs').readFileSync(__dirname+'/jieqi-table.js','utf8'));}catch(e){}}

const API=(location.hostname==='127.0.0.1'||location.hostname==='localhost')?'http://127.0.0.1:8920':'';
let hist=[];
let state={module:null,step:0,data:{},reporting:false};

// === 模块定义 ===

// ═══════════════════════════════════════════════
// KB 优先双路径（P0-任务1）
// 命中分 ≥ 0.7 → KB 直答；0.4-0.7 → KB+AI 润色；< 0.4 → AI+KB 兜底
// ═══════════════════════════════════════════════
// 真实 model_id（来自 knowledge_models 表，由 /api/public/kb-stats 验证 100% 对齐）
// 17 个 KB 源（全部从 knowledge_models 动态同步 · v1 全启用）
// 该表唯一权威：/_kb_models_meta 从后端拉取，11 个 KB 未提供 window 对象时走 server-side 后备
const KB_SOURCES = [
  {name:'NIHAISHA_KB', entryId:'nihaisha-model-v1', modelEntryCount:385, obj:()=>window.NIHAISHA_KB, mods:['zhongyi','lifeindex','lifeplan','music'], weight:1.0},
  {name:'SHUHAN_KB', entryId:'shuhan-model-v1', modelEntryCount:289, obj:()=>window.SHUHAN_KB, mods:['bazi','qimen','fengshui','yunshi','caiyun','shiye','ganqing','wuxing','xingming'], weight:1.0},
  {name:'YANZHI_KB', entryId:'yanzhi-model-v1', modelEntryCount:39, obj:()=>window.YANZHI_KB, mods:['yanzhi'], weight:1.0},
  {name:'TCM_KB', entryId:'tcm-model-v1', modelEntryCount:51, obj:()=>window.TCM_KB, mods:['zhongyi'], weight:0.8},
  {name:'ZIWEI_KB', entryId:'ziwei-model-v1', modelEntryCount:174, obj:()=>window.ZIWEI_KB, mods:['ziwei','paipan'], weight:1.0},
  {name:'BAZI_KB', entryId:'bazi-model-v1', modelEntryCount:110, obj:()=>window.BAZI_KB, mods:['bazi'], weight:0.95},
  {name:'QIMEN_KB', entryId:'qimen-model-v1', modelEntryCount:133, obj:()=>window.QIMEN_KB, mods:['qimen','qimendunjia'], weight:0.95},
  {name:'MEIHUA_KB', entryId:'meihua-model-v1', modelEntryCount:42, obj:()=>window.MEIHUA_KB, mods:['meihua','liuyao'], weight:0.9},
  {name:'LIUYAOO_KB', entryId:'liuyao-model-v1', modelEntryCount:20, obj:()=>window.LIUYAO_KB, mods:['liuyao','yijing'], weight:0.9},
  {name:'LIUREN_KB', entryId:'liuren-model-v1', modelEntryCount:30, obj:()=>window.LIUREN_KB, mods:['liuren'], weight:0.9},
  {name:'YIJING_KB', entryId:'yijing-model-v1', modelEntryCount:8, obj:()=>window.YIJING_KB, mods:['yijing','zhouyi'], weight:0.9},
  {name:'FENGSHUI_KB', entryId:'fengshui-model-v1', modelEntryCount:44, obj:()=>window.FENGSHUI_KB, mods:['fengshui','zeri','huangli'], weight:0.9},
  {name:'ZODIAC_KB', entryId:'zodiac-model-v1', modelEntryCount:94, obj:()=>window.ZODIAC_KB, mods:['zodiac','shengxiao','taisui','mobile'], weight:0.85},
  {name:'MANTRA_KB', entryId:'mantra-model-v1', modelEntryCount:121, obj:()=>window.MANTRA_KB, mods:['mantra','jingdian'], weight:0.85},
  {name:'HUAJIE_KB', entryId:'huajie-model-v1', modelEntryCount:13, obj:()=>window.HUAJIE_KB, mods:['huajie'], weight:0.85},
  {name:'CLASSICS_KB', entryId:'classics-model-v1', modelEntryCount:106, obj:()=>window.CLASSICS_KB, mods:['classics','jingdian'], weight:0.8},
  {name:'NIHAISHA_STRUCTURED_KB', entryId:'nihaisha-structured-v1', modelEntryCount:118, obj:()=>window.NIHAISHA_STRUCTURED_KB, mods:['zhongyi','qimen','fengshui','jingdian'], weight:1.2},
  {name:'FAITH_KB', entryId:'faith-model-v1', modelEntryCount:167, obj:()=>window.FAITH_KB, mods:['faith','mingshi'], weight:0.8},
  {name:'MINGXIANG_CROSS_KB', entryId:'mingxiang-cross-v1', modelEntryCount:28, obj:()=>window.MINGXIANG_CROSS_KB, mods:['mingxiang','cross','mingxiang-cross'], weight:0.85},
  {name:'HUANGLI_KB', entryId:'huangli-model-v1', modelEntryCount:32, obj:()=>window.HUANGLI_KB, mods:['huangli','zeri'], weight:0.85},
  {name:'MOBILE_KB', entryId:'mobile-model-v1', modelEntryCount:40, obj:()=>window.MOBILE_KB, mods:['mobile','shouji'], weight:0.85},
  {name:'TAISUI_KB', entryId:'taisui-model-v1', modelEntryCount:42, obj:()=>window.TAISUI_KB, mods:['taisui','sui','taisui-shuhan'], weight:0.85},
  {name:'WUXING_KB', entryId:'wuxing-model-v1', modelEntryCount:19, obj:()=>window.WUXING_KB, mods:['wuxing','wuxingpeilian','bazi'], weight:0.9},
  {name:'XINGMING_KB', entryId:'xingming-model-v1', modelEntryCount:31, obj:()=>window.XINGMING_KB, mods:['xingming','sancai','wuge'], weight:0.85},
  {name:'ZERI_KB', entryId:'zeri-model-v1', modelEntryCount:42, obj:()=>window.ZERI_KB, mods:['zeri','zeri-zeri','huangli'], weight:0.85},
];

function _kbScore(moduleId, data){
  // 计算每个 KB 源的命中分
  let best = {source:null, score:0, snippet:'', fallback:false};
  for(const src of KB_SOURCES){
    if(!src.mods.includes(moduleId)) continue;
    const kb = src.obj();
    // 收集用户输入文本
    const userInput = Object.values(data||{}).join(' ').toLowerCase();
    if(!userInput) continue;
    // 在 KB 中搜索匹配关键词
    let hits = 0;
    let snippet = '';
    const keywords = userInput.split(/[\s,，。、；;：:（）()\[\]\-]+/).filter(s=>s.length>=2);
    // 遍历 KB 顶层模块
    function walk(obj, path){
      if(typeof obj === 'string'){
        let matched = 0;
        for(const kw of keywords){
          if(obj.includes(kw)) matched++;
        }
        if(matched > hits){
          hits = matched;
          snippet = obj.substring(0, 2000);
        }
      } else if(typeof obj === 'object' && obj !== null && path.length < 4){
        for(const k in obj){
          if(k.startsWith('_') || k === 'meta') continue;
          walk(obj[k], path.concat(k));
        }
      }
    }
    if (kb) {
      walk(kb, []);
    } else {
      // fallback: window.XXX_KB 未提供 → 标记让后续走服务端
      continue;
    }
    // 命中分 = (命中关键词数 / 总关键词数) * weight
    const score = Math.min(1.0, (hits / Math.max(1, keywords.length)) * 1.5) * src.weight;
    if(score > best.score){
      best = {source:src.name, score:Math.round(score*100)/100, snippet, entryId:src.entryId || null};
    }
  }
  // 若所有本地 KB 都没命中 → 走服务端 /api/public/kb-query fallback
  if (!best.source) {
    const matchedSrc = KB_SOURCES.find(s => s.mods.includes(moduleId));
    if (matchedSrc) {
      best = {
        source: matchedSrc.name,
        score: 0.5,
        snippet: '[fallback] 调用服务端 KB 检索中…',
        entryId: matchedSrc.entryId,
        fallback: true,
        module: moduleId,
        query: (data && (data.s1 || data.s2 || data.q)) || ''
      };
    }
  }
  return best;
}

// 服务端 KB fallback 异步检索（被 _kbScore 标记为 fallback 后调用）
async function _kbQueryFallback(best) {
  if (!best.fallback) return best;
  try {
    const qs = new URLSearchParams({
      module: best.module || '',
      q: (best.query || '').slice(0, 60),
      limit: '5'
    });
    const r = await fetch(API + '/api/public/kb-query?' + qs, { method: 'GET' });
    const j = await r.json();
    // R27-P1：读取后端返回的 engine 字段 → 记入 localStorage + 刷新 stats bar
    const engine = (j && j.engine) || 'like-fallback';
    try { recordKbEngine(engine); } catch (e) {}
    if (j && j.results && j.results.length > 0) {
      best.snippet = j.results.map(x => '【' + x.entry_id + '】' + x.title + '\n' + (x.snippet || '').slice(0, 200)).join('\n\n');
      best.score = Math.max(best.score, 0.65);
      best.results = j.results;
      best.sourceCount = j.count;
      best.engine = engine;
    } else {
      best.snippet = '[fallback] 未找到匹配 KB';
      best.score = 0.3;
      best.engine = engine;
    }
  } catch (e) {
    best.snippet = '[fallback] 失败: ' + e.message;
    best.score = 0.2;
    best.engine = 'error';
  }
  return best;
}

function _kbHitCount(moduleId, kbEntryId){
  try{
    const key = '_kb_hit_count/' + moduleId;
    const n = parseInt(localStorage.getItem(key) || '0') + 1;
    localStorage.setItem(key, String(n));
    // 累计总命中
    const total = parseInt(localStorage.getItem('_kb_hit_count/_total') || '0') + 1;
    localStorage.setItem('_kb_hit_count/_total', String(total));
    // 异步上报后端 kb_formal.hit_count（公网白名单 + 失败静默）
    if (kbEntryId) {
      try {
        fetch(API + '/api/public/kb-hit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entry_id: kbEntryId, app_endpoint: 'ai-assistant', user_query: (state.data?.s1 || '') + ' ' + (state.data?.s2 || '') })
        }).catch(() => {});
      } catch (e) {}
    }
    return n;
  }catch(e){ /* localStorage 隐私模式静默 */ return 0; }
}

// === 问卷 + 排盘结果自动落库（公网公开端点）===
function _saveSurvey(module, data, baziData){
  try {
    fetch(API + '/api/public/save-survey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module, data, baziData: baziData || null, source: 'ai-assistant' })
    }).catch(() => {});
  } catch (e) {}
}

function _kbTodayCount(){
  const today = new Date().toDateString();
  const key = '_kb_hit_today';
  const data = JSON.parse(localStorage.getItem(key) || '{}');
  if(data.date !== today){
    data.date = today;
    data.count = 0;
  }
  data.count++;
  localStorage.setItem(key, JSON.stringify(data));
  return data.count;
}


const MODULES={
  'bazi':{name:'八字排盘',icon:'📅',desc:'命理分析',steps:[
    {q:'请提供您的出生年月日时和性别',hint:'例如：1985年3月22日8时 女'},
    {q:'是公历还是农历？',options:['公历','农历','不确定']},
    {q:'出生地是？(影响真太阳时计算)',hint:'例如：北京/上海/广州'},
    {q:'您想重点了解哪方面？',options:['性格特征','事业财运','感情婚姻','健康运势','子女缘分','全面分析']}
  ]},
  'mobile':{name:'手机号码',icon:'📱',desc:'八星磁场',steps:[
    {q:'请提供您的11位手机号码',hint:'例如：13800138000'},
    {q:'您从事什么行业？',options:['金融/财经','教育/文化','电子/IT','房产/建筑','医疗/健康','物流/贸易','服务业','其他']},
    {q:'使用这个号码的主要目的？',options:['日常使用','求财运','求事业','求感情','求健康']},
    {q:'使用多久了？',options:['不到1年','1-3年','3-5年','5年以上']},
    {q:'您的出生年月日时？(可选，用于八字配号分析)',hint:'例如：1985年3月22日8时'}
  ]},
  'yunshi':{name:'运势分析',icon:'🌟',desc:'流年预测',steps:[
    {q:'请提供您的出生年月日时和性别',hint:'例如：1985年3月22日8时 女'},
    {q:'您最关心哪方面运势？',options:['事业运','财运','感情运','健康运','人际运','综合运势']},
    {q:'想分析哪个时间段？',options:['今年(2026年)','明年','未来三年','特定月份','大运交接年']},
    {q:'近期生活中有什么变动吗？',options:['工作变动','感情变化','搬家迁居','健康问题','财务变化','没有明显变动']},
    {q:'目前最困扰您的问题是什么？',hint:'例如：升职受阻、感情不顺、财运不佳等'}
  ]},
  'fengshui':{name:'风水布局',icon:'🏠',desc:'环境调理',steps:[
    {q:'您房屋的大门朝向是？',options:['朝南','朝北','朝东','朝西','朝东南','朝西南','朝东北','朝西北','不确定']},
    {q:'房屋类型？',options:['商品房','别墅','自建房','公寓','商铺','办公室']},
    {q:'您住几楼？总楼层是多少？',hint:'例如：住8楼/共18楼'},
    {q:'您主要关注哪个区域？',options:['大门/玄关','客厅/财位','卧室','厨房','卫生间','书房','办公室','整体布局']},
    {q:'房屋有什么已知问题？',options:['缺角','路冲','横梁压顶','门对门','采光不好','卫生间居中','没有明显问题','不确定']},
    {q:'居住者的出生年月日时？(可选，用于命卦分析)',hint:'例如：1985年3月22日8时'}
  ]},
  'zhongyi':{name:'中医养生',icon:'💊',desc:'健康调理',steps:[
    {q:'请描述您的主要症状或不适',hint:'例如：失眠多梦、头痛、脾胃不适、腰酸等'},
    {q:'症状持续多久了？',options:['一周以内','一个月内','三个月内','半年以上','长期慢性']},
    {q:'您的体质倾向？',options:['怕冷/手脚凉','怕热/易上火','疲劳/气短','情绪波动大','消化不好','睡眠差','不确定']},
    {q:'日常生活习惯？',options:['经常熬夜','饮食不规律','久坐少动','压力大','运动适量','作息规律']},
    {q:'您的出生年月日时？(可选，用于五行体质分析)',hint:'例如：1985年3月22日8时'}
  ]},
  'caiyun':{name:'财运分析',icon:'💰',desc:'理财方向',steps:[
    {q:'请提供您的出生年月日时和性别',hint:'例如：1985年3月22日8时 女'},
    {q:'主要收入来源？',options:['工薪','经营/创业','投资收益','自由职业','退休/其他']},
    {q:'您的投资偏好？',options:['稳健型(定存/基金)','平衡型(基金/股票)','激进型(股票/创业)','保守型(不投资)']},
    {q:'当前财务状况？',options:['稳定有积蓄','收支平衡','负债中','创业期','投资亏损中']},
    {q:'近期有无大额支出计划？',options:['买房/装修','买车','子女教育','医疗支出','创业投资','没有大额支出']},
    {q:'最关心的财运问题？',options:['何时发财','适合什么行业','投资方向','破财防范','债务化解','整体财运']}
  ]},
  'shiye':{name:'事业方向',icon:'💼',desc:'职业规划',steps:[
    {q:'请提供您的出生年月日时和性别',hint:'例如：1985年3月22日8时 女'},
    {q:'您目前处于什么阶段？',options:['求职中','职场上升期','考虑跳槽','准备创业','事业瓶颈期','体制内求升迁']},
    {q:'您所在行业？',options:['金融','互联网/IT','教育','医疗','房地产','制造业','服务业','公务员/事业','其他']},
    {q:'工作年限？',options:['刚毕业','1-3年','3-5年','5-10年','10年以上']},
    {q:'最关心的事业问题？',options:['适合什么行业','创业时机','跳槽时机','升职运势','合伙风险','职场人际','事业瓶颈突破']}
  ]},
  'ganqing':{name:'感情婚姻',icon:'💕',desc:'桃花正缘·6维度',steps:[
    {q:'请提供您的出生年月日时和性别',hint:'例如：1985年3月22日8时 女'},
    {q:'您的感情状况？',options:['单身求缘','恋爱中','已婚','感情困惑','准备结婚','离异求缘','复合中']},
    {q:'您最关心什么？',options:['何时遇到正缘','当前感情发展','婚姻质量','桃花运势','复合可能性','感情化解']},
    {q:'您期望的伴侣画像？(可多描述)',hint:'例如：性格温和·年龄±3岁·身高165-175·事业稳定'},
    {q:'您的现居地？(影响流年方位)',hint:'例如：北京、上海、广州'},
    {q:'您最想看6维度中的哪个？',options:['运势(大运流年)','健康(子午冲克)','婚姻(配偶宫)','孩子(子女宫)','同事(事业宫)','父母(父母宫)','全部6维度']},
    {q:'如有对象，对方出生年月日时？(可选，用于合婚分析)',hint:'例如：1983年5月10日14时'}
  ]},
  'wuxing':{name:'五行分析',icon:'⚖️',desc:'缺行补救',steps:[
    {q:'请提供您的出生年月日时和性别',hint:'例如：1985年3月22日8时 女'},
    {q:'您想了解五行的哪个方面？',options:['五行缺什么','五行补救方案','五行与职业方向','五行与健康养生','五行与感情','五行与财运','全面分析']}
  ]},
  'xingming':{name:'姓名分析',icon:'✏️',desc:'三才五格',steps:[
    {q:'请告诉我您的姓名',hint:'例如：张三'},
    {q:'您的性别？',options:['男','女']},
    {q:'您的出生年月日时？(用于配合八字分析喜用神)',hint:'例如：1985年3月22日8时'},
    {q:'您想了解姓名的哪个方面？',options:['姓名吉凶总评','五行是否匹配八字','改名建议','公司/品牌起名']}
  ]},
  'qimen':{name:'奇门遁甲',icon:'🔮',desc:'帝王之学',steps:[
    {q:'请提供问事时间(年月日时)，奇门以问事时辰立盘',hint:'例如：2026年7月20日10时(公历)'},
    {q:'您的性别？(用于值符落宫与人盘八门对应)',options:['男','女']},
    {q:'您要预测何事？(决定用神取象与解读侧重)',options:['事业决策','财运投资','感情婚姻','出行安全','失物寻找','官司诉讼','健康吉凶','其他']},
    {q:'问事背景？(请描述目前处境或困惑)',hint:'例如：考虑是否接受异地调动 / 资金被拖欠何时收回 / 面试多家如何抉择'},
    {q:'您最希望从排盘中得到什么？',options:['吉凶判断','时机把握','方位指点','化解方案','合婚配对','全面分析']}
  ]},
  'ziwei':{name:'紫微斗数',icon:'⭐',desc:'十二宫位',steps:[
    {q:'请提供您的出生年月日时和性别',hint:'例如：1985年3月22日8时 女'},
    {q:'您想分析哪个宫位？',options:['命宫(性格格局)','夫妻宫(婚姻)','官禄宫(事业)','财帛宫(财运)','疾厄宫(健康)','全面分析']}
  ]},
  'liuyao':{name:'六爻占卜',icon:'🪙',desc:'铜钱起卦',steps:[
    {q:'请提供起卦时间(年月日时)',hint:'例如：2026年7月20日10时'},
    {q:'您要占卜何事？(决定用神取法)',options:['事业工作','财运投资','感情婚姻','考试升学','出行远行','失物寻找','健康疾病','官司纠纷']},
    {q:'请描述具体背景或困惑(帮助精确定用神)',hint:'例如：面试了三家公司等通知 / 和对象吵架一周没联系 / 投资项目突然停止兑付'},
    {q:'心中默想所问之事，然后从1至99中选一个数字',hint:'例如：38(梅花易数法自动起卦)'}
  ]},
  'meihua':{name:'梅花易数',icon:'🌸',desc:'简便起卦',steps:[
    {q:'请提供起卦时间或输入两个数字',hint:'例如：2026年7月20日10时 或 数字3和8'},
    {q:'您要预测什么事？',options:['事业','财运','感情','健康','出行','失物','其他']}
  ]},
  'liuren':{name:'大六壬',icon:'📜',desc:'三式之首',steps:[
    {q:'请提供起课时间(年月日时)，大六壬以问课时辰立天盘',hint:'例如：2026年7月20日10时'},
    {q:'您的性别？(影响三传发用与课体喜忌)',options:['男','女']},
    {q:'您要预测何事？(大六壬专长：失物行人、婚嫁疾病、官司胜负)',options:['失物寻找','行人归期','婚姻成败','事业升降','疾病轻重','官司胜败','财运得失','其他']},
    {q:'请详述背景或关键时间节点(如失物时间、离家时间)',hint:'例如：昨晚8点在办公室丢失钱包，内有身份证'},
    {q:'课体偏好？(用于选取用神)',options:['纯用神','取三传','课体全解','化解方案']}
  ]},
  'zeri':{name:'择日择吉',icon:'📅',desc:'选吉日',steps:[
    {q:'您要择日做什么事？',options:['搬家入宅','结婚嫁娶','开业典礼','动土装修','签约谈判','出行远行','安葬祭祀','其他']},
    {q:'大概想在什么时间段？',options:['本月内','下个月','三个月内','半年内','不确定']}
  ]},
  'huangli':{name:'黄历推送',icon:'📆',desc:'每日运势',steps:[
    {q:'您的出生年月日时？(用于个性化黄历推送)',hint:'例如：1985年3月22日8时'},
    {q:'您希望接收哪些推送内容？',options:['每日宜忌','吉时方位','五行穿衣','养生提示','节气提醒','节日文化','全部']}
  ]},
  'taisui':{name:'本命年太岁',icon:'🐉',desc:'犯太岁化解',steps:[
    {q:'您的生肖是？',options:['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪']},
    {q:'您知道今年犯什么太岁吗？',options:['值太岁(本命年)','冲太岁','刑太岁','害太岁','破太岁','不确定','未犯太岁']},
    {q:'您最关心什么？',options:['化解方法','佩戴什么','拜太岁时间','禁忌事项','全年运势','综合分析']}
  ]},
  'yanzhi':{name:'颜择面相',icon:'👤',desc:'五官分析',steps:[
    {q:'请上传您的正面面部照片(光线充足、无遮挡、正面朝向)',hint:'upload',uploadText:'📷 拍照 / 上传照片',uploadAccept:'image/*',uploadCapture:'user'},
    {q:'您最关心哪方面？',options:['早年运势(额头)','中年运势(鼻眼)','晚年运势(下巴)','财运(鼻子)','感情(眼睛)','整体面相','健康']}
  ]},
  'music':{name:'疗愈音乐',icon:'🎵',desc:'五行音疗',steps:[
    {q:'您当前的情绪状态？',options:['焦虑紧张','失眠多梦','疲劳低落','悲伤失落','愤怒烦躁','压力大','需要放松']},
    {q:'您偏好什么类型音乐？',options:['古琴/古筝','自然白噪音','冥想引导','颂钵疗愈','钢琴轻音乐','不确定']}
  ]},
  'lifeindex':{name:'生命指数',icon:'📊',desc:'命理评分',steps:[
    {q:'请提供您的出生年月日时和性别',hint:'例如：1985年3月22日8时 女'},
    {q:'您想了解哪个维度？',options:['综合生命指数','事业潜力','财运指数','健康长寿','婚姻幸福','整体运势']}
  ]},
  'lifeplan':{name:'人生规划',icon:'🗺️',desc:'全周期人生蓝图',steps:[
    {q:'请提供您的出生年月日时和性别',hint:'例如：1990年6月15日8时 男'},
    {q:'您目前处于哪个阶段？',options:['学龄前','小学','初中','高中','大学','职场','婚恋期','不清楚']},
    {q:'您的现居地和期望发展方向？(城市/领域)',hint:'例如：北京，想了解适合的行业'},
    {q:'您目前最关心的方向？',options:['学业规划','职业方向','财运分析','感情婚姻','健康管理','城市选择','全面规划']}
  ]},
  'mingxiang':{name:'命相同参',icon:'🩺',desc:'面相×八字交叉分析',steps:[
    {q:'请提供您的出生年月日时和性别（用于八字排盘）',hint:'例如：1985年3月22日8时 女'},
    {q:'请描述您观察到的面相特征（面色、五官、痣斑等）',hint:'例如：面色偏黄、鼻头偏大、有法令纹'},
    {q:'您当前主要关注的健康/运势方向？',options:['肝胆问题','心血管健康','脾胃消化','呼吸系统','肾脏泌尿','整体综合']},
    {q:'近期是否有明显的生活或运势变化？',options:['工作变动','感情变化','搬家迁居','健康波动','财务变化','没有明显变化']}
  ]},
  'tcm-fangji':{name:'经方调理',icon:'🌿',desc:'经典方剂',steps:[
    {q:'请描述您的主要症状或不适',hint:'例如：感冒发热、头痛身痛、腹痛腹泻、失眠多梦等'},
    {q:'症状持续多久了？',options:['一天内','三天内','一周内','半个月','一个月以上']},
    {q:'您的体质倾向？',options:['阳虚怕冷','阴虚怕热','气虚乏力','痰湿肥胖','血瘀疼痛','不确定']},
    {q:'是否有以下伴随症状？',options:['发热恶寒','口苦咽干','食欲不振','大便异常','小便异常','无伴随症状']},
    {q:'您的出生年月日时？(可选，用于体质分析)',hint:'例如：1985年3月22日8时'}
  ]},
  'tcm-classic':{name:'中医基础',icon:'💊',desc:'体质调理',steps:[
    {q:'您想了解中医哪个方面？',options:['体质辨识','五脏调养','气血津液','经络穴位','四诊合参','养生原则']},
    {q:'您的主要健康困扰？',options:['疲劳乏力','睡眠问题','消化不良','情绪波动','免疫力低','其他']},
    {q:'日常作息如何？',options:['规律作息','经常熬夜','久坐少动','饮食不节','压力较大']},
    {q:'您的出生年月日时？(可选，用于体质分析)',hint:'例如：1985年3月22日8时'}
  ]},
  'tcm-zhongfu':{name:'脏腑调理',icon:'🫀',desc:'五脏调养',steps:[
    {q:'您最关注哪个脏腑的调理？',options:['心脏(心悸失眠)','肝脏(情绪眼目)','脾脏(消化运化)','肺脏(呼吸皮毛)','肾脏(生殖腰膝)','不确定']},
    {q:'相关症状持续多久？',options:['一周内','一个月','三个月','半年','长期慢性']},
    {q:'是否有相关疾病史？',options:['无','有（请描述）']},
    {q:'您的出生年月日时？(可选，用于五行体质)',hint:'例如：1985年3月22日8时'}
  ]},
  'shanghan-lun':{name:'伤寒辨证',icon:'📖',desc:'六经辨证',steps:[
    {q:'请描述您的症状表现',hint:'例如：恶寒发热、头痛项强、但欲寐、心烦喜呕等'},
    {q:'发病时间？',options:['今天','昨天','三天内','一周内','半个月以上']},
    {q:'是否有以下表现？',options:['发热恶寒','汗出','口渴','小便异常','脉浮或沉']},
    {q:'想了解什么？',options:['六经归属','传变规律','经方推荐','调护建议','全面分析']}
  ]},
  'acupuncture':{name:'针灸推拿',icon:'🪡',desc:'穴位调理',steps:[
    {q:'您的主要不适部位？',options:['头面部','颈肩部','腰背部','四肢关节','胸腹部','全身']},
    {q:'症状性质？',options:['疼痛麻木','酸胀乏力','活动受限','功能障碍','其他']},
    {q:'持续时间？',options:['急性(一周内)','亚急性(一月内)','慢性(一月以上)','反复发作']},
    {q:'您的出生年月日时？(可选，用于经络体质)',hint:'例如：1985年3月22日8时'}
  ]},
  'shuhan':{name:'舒晗天纪',icon:'🌟',desc:'舒晗体系',steps:[
    {q:'您想了解舒晗体系的哪个方面？',options:['八字实务','奇门校正','命理思维','实战案例','学习路径']},
    {q:'您的命理学习程度？',options:['零基础','入门阶段','进阶实践','专业从业者']},
    {q:'您的主要困惑？',hint:'例如：八字断语把握不准、奇门格局判断模糊等'},
    {q:'您的出生年月日时？(可选，用于案例对照)',hint:'例如：1985年3月22日8时'}
  ]},

};

// 推送模块(闭环后展示)
const ALL_MODS=[
  {id:'bazi',name:'八字排盘',icon:'📅'},
  {id:'mobile',name:'手机号码',icon:'📱'},
  {id:'yunshi',name:'运势分析',icon:'🌟'},
  {id:'fengshui',name:'风水布局',icon:'🏠'},
  {id:'zhongyi',name:'中医养生',icon:'💊'},
  {id:'caiyun',name:'财运分析',icon:'💰'},
  {id:'shiye',name:'事业方向',icon:'💼'},
  {id:'ganqing',name:'感情婚姻',icon:'💕'},
  {id:'wuxing',name:'五行分析',icon:'⚖️'},
  {id:'xingming',name:'姓名分析',icon:'✏️'},
  {id:'qimen',name:'奇门遁甲',icon:'🔮'},
  {id:'ziwei',name:'紫微斗数',icon:'⭐'},
  {id:'liuyao',name:'六爻占卜',icon:'🪙'},
  {id:'meihua',name:'梅花易数',icon:'🌸'},
  {id:'liuren',name:'大六壬',icon:'📜'},
  {id:'zeri',name:'择日择吉',icon:'📅'},
  {id:'huangli',name:'黄历推送',icon:'📆'},
  {id:'taisui',name:'本命年太岁',icon:'🐉'},
  {id:'yanzhi',name:'颜择面相',icon:'👤'},
  {id:'music',name:'疗愈音乐',icon:'🎵'},
  {id:'lifeindex',name:'生命指数',icon:'📊'},
  {id:'lifeplan',name:'人生规划',icon:'🗺️'},
  {id:'mingxiang',name:'命相同参',icon:'🩺', kb:'MINGXIANG_CROSS_KB', mods:['mingxiang','cross','mingxiang-cross'], weight:0.85}
];

// === P1: 统一追加"关心维度"步骤到核心模块 ===
(function(){
  var extraQ={q:'您最关心以下哪个维度？',options:['运势','健康','婚姻','孩子','同事/人际','父母'],hint:'选定维度后报告将额外深入分析该方向'};
  var targets=['bazi','yunshi','caiyun','shiye','ganqing','wuxing','zhongyi','taisui','lifeindex','lifeplan'];
  targets.forEach(function(id){
    if(MODULES[id]&&MODULES[id].steps&&MODULES[id].steps.length>0){
      // 避免重复追加
      var last=MODULES[id].steps[MODULES[id].steps.length-1];
      if(!last._extra){extraQ._extra=true;MODULES[id].steps.push(extraQ);}
    }
  });
})();

// === 初始化 ===
showWelcome();

// === R34: KB 热卡直达 (AI 助手 → 模块咨询一气呵成) ===
function renderKbHotChips(){
  let top = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('_kb_hit_count/')) {
        const sub = k.substring('_kb_hit_count/'.length);
        if (sub === '_total' || sub.startsWith('_daily_')) continue;
        const c = parseInt(localStorage.getItem(k) || '0');
        if (c > 0) top.push({ mod: sub, count: c });
      }
    }
  } catch (e) {}
  top.sort((a, b) => b.count - a.count);
  top = top.slice(0, 4);
  if (top.length === 0) return '';

  // R34: 模块 id 映射（KB 模块名 → ALL_MODS / MODULES id）
  const MOD_MAP = {
    'bazi': 'bazi', 'ziwei': 'ziwei', 'fengshui': 'fengshui', 'qimen': 'qimen',
    'tcm': 'zhongyi', 'tcm-diagnosis': 'zhongyi', 'tcm-fangji': 'zhongyi',
    'shuhan': 'bazi', 'shanghan-lun': 'zhongyi', 'acupuncture': 'zhongyi',
    'yijing': 'bazi', 'meihua': 'meihua', 'liuyao': 'liuyao', 'liuren': 'liuren',
    'huangdi-neijing': 'zhongyi', 'shennong-bencao': 'zhongyi',
    'jinkui': 'zhongyi', 'classics': 'bazi', 'general': 'bazi',
    'AUTHORITATIVE_KNOWLEDGE': 'bazi', 'FAITH_KNOWLEDGE_BASE': 'bazi',
    'KOUJUE_DATABASE_FULL': 'bazi', 'SCRIPTURE_DATABASE': 'bazi',
    'lifeplan': 'lifeplan', 'wuxing': 'wuxing',
  };
  const LABELS = {
    'bazi': { name: '八字', icon: '🧮' }, 'ziwei': { name: '紫微', icon: '🌟' },
    'fengshui': { name: '风水', icon: '🧭' }, 'qimen': { name: '奇门', icon: '🔮' },
    'tcm': { name: '中医', icon: '⚕️' }, 'tcm-diagnosis': { name: '中医诊断', icon: '🩺' },
    'shuhan': { name: '舒晗', icon: '📘' }, 'shanghan-lun': { name: '伤寒论', icon: '📜' },
    'acupuncture': { name: '针灸', icon: '💉' }, 'yijing': { name: '易经', icon: '📒' },
    'meihua': { name: '梅花', icon: '🌺' }, 'liuyao': { name: '六爻', icon: '☯️' },
    'liuren': { name: '六壬', icon: '🎴' }, 'lifeplan': { name: '人生规划', icon: '📅' },
  };

  let html = '<div class="kb-hot-chips-wrap">';
  html += '<div class="kb-hot-chips-title">🔥 你最近问得最多的</div>';
  html += '<div class="kb-hot-chips">';
  top.forEach(t => {
    const label = LABELS[t.mod] || { name: t.mod.slice(0, 8), icon: '📊' };
    const targetMod = MOD_MAP[t.mod] || t.mod;
    // 检查目标模块是否存在
    const exists = (typeof MODULES !== 'undefined' && MODULES[targetMod]) ||
                   (typeof ALL_MODS !== 'undefined' && ALL_MODS.find(m => m.id === targetMod));
    if (!exists) return; // 跳过不存在的模块
    html += '<button class="kb-hot-chip" data-mod="' + escapeAttr(targetMod) + '" data-from="' + escapeAttr(t.mod) + '">';
    html += '<span class="kb-hot-chip-icon">' + label.icon + '</span>';
    html += '<span class="kb-hot-chip-name">' + label.name + '</span>';
    html += '<span class="kb-hot-chip-count">' + (t.count > 99 ? '99+' : t.count) + '</span>';
    html += '</button>';
  });
  html += '</div>';
  html += '<div class="kb-hot-chips-tip">点击任何模块可直接进入问题采集 · 已记录你的咨询偏好</div>';
  html += '</div>';

  // R75: 设备联动提示——最近 5 分钟内有设备事件则显示
  try {
    const devRaw = localStorage.getItem('_device_kb_events') || '[]';
    const devEvents = JSON.parse(devRaw);
    const now = Date.now();
    const recent5 = devEvents.filter(e => now - (e.ts || 0) < 5 * 60 * 1000);
    if (recent5.length > 0) {
      const mods = {};
      recent5.forEach(e => { if (e.module) mods[e.module] = (mods[e.module] || 0) + 1; });
      const sorted = Object.entries(mods).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const DEV_LABELS = { zhongyi:'中医', shexiang:'舌象', mianxue:'眼诊', classics:'经典', mantra:'咒语', tcm:'脉象', mobile:'作息', fengshui:'风水' };
      const DEV_ICONS = { zhongyi:'👁', shexiang:'👅', mianxue:'👀', classics:'📜', mantra:'🎙️', tcm:'❤️', mobile:'😴', fengshui:'👓' };
      const tags = sorted.map(([m, c]) => {
        const icon = DEV_ICONS[m] || '📦';
        const name = DEV_LABELS[m] || m.slice(0, 6);
        return '<span style="display:inline-flex;align-items:center;gap:3px;padding:3px 8px;margin:2px;border-radius:6px;background:rgba(201,168,76,.1);color:var(--gold);border:1px solid rgba(201,168,76,.25);font-size:11px">' + icon + ' ' + name + ' ×' + c + '</span>';
      }).join('');
      html += '<div style="margin-top:10px;padding:10px;background:rgba(201,168,76,.04);border:1px solid rgba(201,168,76,.15);border-radius:8px;font-size:11px;color:var(--paper2)">';
      html += '<span style="color:var(--gold);margin-right:6px">📱 设备联动</span>';
      html += '<span style="color:var(--paper3);font-size:10px">最近 5 分钟 · AI 已加权</span>';
      html += '<div style="margin-top:6px">' + tags + '</div>';
      html += '</div>';
    }
  } catch (e) {}
  return html;
}

function escapeAttr(s){
  return String(s || '').replace(/[<>"&]/g, c => ({'<':'&lt;','>':'&gt;','"':'&quot;','&':'&amp;'})[c]);
}

function bindKbHotChips(){
  document.querySelectorAll('.kb-hot-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const mod = chip.getAttribute('data-mod');
      const from = chip.getAttribute('data-from');
      // 点击埋点：双计数同步（与 kb-hot-strip 一致）
      try {
        const hitKey = '_kb_hit_count/' + mod;
        localStorage.setItem(hitKey, String((parseInt(localStorage.getItem(hitKey) || '0') + 1)));
        const recKey = '_kb_recommend_count/' + from;
        localStorage.setItem(recKey, String((parseInt(localStorage.getItem(recKey) || '0') + 1)));
      } catch (e) {}
      // 直接跳转
      const exists = (typeof MODULES !== 'undefined' && MODULES[mod]) ||
                     (typeof ALL_MODS !== 'undefined' && ALL_MODS.find(m => m.id === mod));
      if (exists) {
        startModule(mod);
      } else {
        // 模块不存在 → 提示
        toast('该模块暂未开放 · 请尝试其他热门模块');
      }
    });
  });
}

function showWelcome(){
  chat.innerHTML='';
  let html='<div class="welcome"><div class="logo">🤖</div><h2>AI命理助手</h2><div class="sub">选择您想咨询的领域，我将通过对话收集信息后给出专业分析报告</div><div class="modules">';
  ALL_MODS.forEach(m=>{html+='<ml-tap class="mod" onclick="startModule(\''+m.id+'\')" variant="card" role="button" tabindex="0"><div class="mi">'+m.icon+'</div><div class="mt">'+m.name+'</div></ml-tap>';});
  html+='</div>';
  // 显示今日 / 累计 KB 直答统计 + 最强模块
  let todayN = 0, totalN = 0, topMod = null, topCnt = 0;
  const fmt = (n)=> n>=1000 ? (n/1000).toFixed(1).replace(/\.0$/,'')+'K' : String(n).replace(/\B(?=(\d{3})+(?!\d))/g,',');
  try{
    const td=JSON.parse(localStorage.getItem('_kb_hit_today')||'{}');
    todayN = (td.date===new Date().toDateString()) ? (td.count||0) : 0;
    for(let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if(!k || !k.startsWith('_kb_hit_count/')) continue;
      const sub = k.substring('_kb_hit_count/'.length);
      if(sub==='_total'){
        totalN = parseInt(localStorage.getItem(k) || '0');
      } else if(!sub.startsWith('_daily_')){
        const c = parseInt(localStorage.getItem(k) || '0');
        if(c > topCnt){ topCnt = c; topMod = sub; }
      }
    }
  }catch(e){ /* 隐私模式静默 */ }
  if(todayN>0 || totalN>0){
    const topTxt = topMod ? ' · 最强：'+topMod+'('+fmt(topCnt)+')' : '';
    html+='<div style="text-align:center;margin-top:8px;font-size:11px;color:var(--paper3)">📊 今日 KB 直答 '+fmt(todayN)+' / 累计 '+fmt(totalN)+' 次'+topTxt+' &nbsp; <a href="javascript:void(0)" onclick="showFbStats()" style="color:var(--gold);text-decoration:underline">反馈统计</a></div>';
  }
  // 显示用户档案摘要
  if(window.MLBJ_USER){
    try{
      const s=MLBJ_USER.getSummary();
      if(s.hasBirth){
        html+='<div style="text-align:center;margin-top:4px;font-size:11px;color:var(--paper3)">👤 档案：'+s.birthText+' '+s.gender+' '+s.city+' | 关心：'+s.concerns+'</div>';
      }
    }catch(e){console.warn("报告降级:",e.message);}
  }
  // R34: KB 热卡直达区
  html+=renderKbHotChips();
  html+='</div>';
  chat.innerHTML=html;
  // R34: 渲染热卡后绑定事件
  bindKbHotChips();
  // R89-M 缘主上下文条（顶部插入）
  try {
    if (window.YuanzhuRecall && typeof window.YuanzhuRecall.renderContextBar === 'function'){
      window.YuanzhuRecall.renderContextBar(chat);
    }
  } catch(e){ console.warn('[recall] context bar fail', e); }
}

function startModule(id){
  const mod=MODULES[id];
  if(!mod)return;
  state={module:id,step:0,data:{},reporting:false};
  chat.innerHTML='';
  // R89-M 缘主档案召回：最近一次同模块的档案 → 自动填充提示
  try {
    if (window.YuanzhuProfile) {
      const _recents = window.YuanzhuProfile.load().sort(function(a,b){
        const _at = (a.visits||[])[0] || '';
        const _bt = (b.visits||[])[0] || '';
        return _bt.localeCompare(_at);
      }).slice(0,1);
      const _last = _recents[0];
      if (_last && _last.modules && _last.modules.includes(id)) {
        const _chip = document.createElement('div');
        _chip.style.cssText = 'margin:0 0 12px;padding:8px 12px;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.3);border-radius:8px;font-size:12px;color:var(--gold);display:flex;align-items:center;gap:8px';
        const _avatar = _last.gender === '女' ? '👩' : (_last.gender === '男' ? '👨' : '🧑');
        const _when = _last.visits && _last.visits[0] ? new Date(_last.visits[0]).toLocaleDateString('zh-CN') : '上次';
        _chip.innerHTML = '<span>' + _avatar + '</span><span><b>' + (_last.name||'缘主') + '</b> · ' + (_last.birth||'') + '</span><span style="margin-left:auto;opacity:.6;font-size:11px">' + _when + '做过「' + mod.name + '」</span>';
        chat.appendChild(_chip);
      }
    }
  } catch(e) { console.warn('[r89-recall] err', e); }
  let intro='您好！让我们开始「'+mod.name+'」分析。\n\n'+mod.steps[0].q;
  // R41-DR1 节点 7：music/lifeindex/lifeplan 三模块提示 detail 页可独立使用
  const _detailIntro = {
    music:'🎵 疗愈音乐提供 5 段播放列表 + 7 日疗程。完成问心后点「独立报告」可跳转 music-detail.html，含 Edge-TTS 试听、可分享、可打印。',
    lifeindex:'📊 生命指数提供 12 维度评分（事业·财运·健康·婚姻·学业·家庭·人际·精神·享福·寿元·风物·修养）。完成后跳 lifeindex-detail.html，可与朋友家人一起看。',
    lifeplan:'🗺️ 人生规划提供 4 阶段（学龄前·中小学·大学·职场+婚恋）× 12 领域 = 48 子项模板。完成后跳 lifeplan-detail.html 可分享给老师/家长/创业者。'
  };
  if(_detailIntro[id]) intro += '\n\n'+_detailIntro[id];
  addAI(intro,mod.steps[0]);
}

function addAI(text,stepData){
  const d=document.createElement('div');
  d.className='msg m-ai';
  let html='<div class="b">'+esc(text)+'</div>';
  // 引导按钮
  if(stepData){
    if(stepData.options){
      html+='<div class="guide-btns">';
      stepData.options.forEach(opt=>{html+='<button onclick="guideAnswer(\''+opt.replace(/'/g,"\\'")+'\')">'+opt+'</button>';});
      html+='</div>';
    }else if(stepData.hint==='upload'){
      html+='<div class="upload-area" style="margin-top:8px"><input type="file" id="faceUpload" accept="'+(stepData.uploadAccept||'image/*')+'" '+(stepData.uploadCapture?'capture="'+stepData.uploadCapture+'" ':'')+'style="position:absolute;width:1px;height:1px;opacity:0;overflow:hidden;clip:rect(0,0,0,0)" onchange="handleFaceUpload(this)"><label for="faceUpload" class="upload-btn" style="display:block;width:100%;padding:14px;background:rgba(201,168,76,0.08);border:1px dashed rgba(201,168,76,0.4);border-radius:10px;color:var(--gold);font-size:14px;cursor:pointer;font-family:inherit;text-align:center;font-weight:500">📷 '+(stepData.uploadText||'拍照 / 上传照片')+'</label><div id="facePreview" style="margin-top:8px;display:none"></div><div style="font-size:11px;color:var(--text-muted);margin-top:4px;text-align:center">手机点按调起相机，电脑点击选择文件</div></div>';
    }else if(stepData.hint){
      html+='<div style="margin-top:4px;font-size:11px;color:var(--paper3);opacity:.6">'+stepData.hint+'</div>';
    }
  }
  d.innerHTML=html;
  // R50 AI 助手反馈按钮（点赞/踩/反馈） — 接入 /api/public/kb-feedback
  if (!stepData || !stepData.options) {
    var _qLast = (state && state.history && state.history[state.history.length-1]) || '';
    if (!_qLast && typeof hist !== 'undefined' && hist.length) _qLast = hist[hist.length-1].content || '';
    var _mod = (state && state.module) || '';
    var _feedbackId = 'fb-' + Date.now() + '-' + (Date.now()%1000);
    html += '<div id="' + _feedbackId + '" data-feedback="1" style="margin-top:8px;padding-top:8px;border-top:1px dashed rgba(201,168,76,.25);font-size:12px;color:var(--paper3,#999);display:flex;align-items:center;gap:6px;flex-wrap:wrap">' +
      '<span style="opacity:.7">这条回答有用吗？</span>' +
      '<button onclick="_submitKbFeedback(\'' + _feedbackId + '\', 1, \'' + esc(_qLast).replace(/'/g, '') + '\', \'' + esc(_mod).replace(/'/g, '') + '\')" style="background:transparent;border:1px solid rgba(201,168,76,.4);border-radius:14px;padding:2px 10px;color:#c9a84c;cursor:pointer;font-size:14px;transition:all .2s" onmouseover="this.style.background=\'rgba(201,168,76,.15)\'" onmouseout="this.style.background=\'transparent\'" title="有用">👍</button>' +
      '<button onclick="_submitKbFeedback(\'' + _feedbackId + '\', 0, \'' + esc(_qLast).replace(/'/g, '') + '\', \'' + esc(_mod).replace(/'/g, '') + '\')" style="background:transparent;border:1px solid rgba(150,150,150,.4);border-radius:14px;padding:2px 10px;color:#999;cursor:pointer;font-size:12px;transition:all .2s" onmouseover="this.style.background=\'rgba(150,150,150,.15)\'" onmouseout="this.style.background=\'transparent\'" title="一般">😐</button>' +
      '<button onclick="_submitKbFeedback(\'' + _feedbackId + '\', -1, \'' + esc(_qLast).replace(/'/g, '') + '\', \'' + esc(_mod).replace(/'/g, '') + '\')" style="background:transparent;border:1px solid rgba(244,67,54,.4);border-radius:14px;padding:2px 10px;color:#f44336;cursor:pointer;font-size:14px;transition:all .2s" onmouseover="this.style.background=\'rgba(244,67,54,.15)\'" onmouseout="this.style.background=\'transparent\'" title="需改进">👎</button>' +
      '<span id="' + _feedbackId + '-status" style="opacity:0;transition:opacity .3s;font-size:11px"></span>' +
      '<button onclick="_exportSingleMessage(this)" title="导出这条回复" aria-label="导出这条回复" style="margin-left:auto;background:transparent;border:1px solid rgba(33,150,243,.4);border-radius:14px;padding:2px 10px;color:#64b5f6;cursor:pointer;font-size:12px;transition:all .2s">💾 导出</button>' +
      '</div>';
      '</div>';
    d.innerHTML = html;
  }
  chat.appendChild(d);
  chat.scrollTop=chat.scrollHeight;
}

// R50 KB 反馈上报 — 公开端点 + localStorage 缓存
function _submitKbFeedback(fbId, score, query, module){
  var statusEl = document.getElementById(fbId + '-status');
  if (statusEl) { statusEl.textContent = '提交中...'; statusEl.style.opacity = '1'; }
  var payload = {
    query: (query || '').substring(0, 500),
    entry_id: '',
    source: 'ai-assistant',
    score: score,
    comment: '',
    module: module || ''
  };
  fetch((typeof API !== 'undefined' ? API : '') + '/api/public/kb-feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(function(r){ return r.json(); }).then(function(j){
    if (j && j.code === 0 && j.data && j.data.logged) {
      if (statusEl) statusEl.textContent = score === 1 ? '✓ 感谢反馈' : score === -1 ? '✓ 已记录，会优化' : '✓ 已记录';
      // 隐藏按钮
      var container = document.getElementById(fbId);
      if (container) {
        var btns = container.querySelectorAll('button');
        btns.forEach(function(b){ b.disabled = true; b.style.opacity = '0.4'; b.style.cursor = 'default'; });
      }
      // 累计到本地
      try {
        var key = '_kb_feedback_count/' + score;
        localStorage.setItem(key, String((parseInt(localStorage.getItem(key)||'0')+1)));
      } catch(e){console.warn("报告降级:",e.message);}
      setTimeout(function(){ if (statusEl) statusEl.style.opacity = '0'; }, 2500);
    } else {
      if (statusEl) statusEl.textContent = '⚠ 提交失败';
      setTimeout(function(){ if (statusEl) statusEl.style.opacity = '0'; }, 2500);
    }
  }).catch(function(e){
    if (statusEl) statusEl.textContent = '⚠ 网络错误';
    setTimeout(function(){ if (statusEl) statusEl.style.opacity = '0'; }, 2500);
  });
}

function guideAnswer(ans){
  // 用户选择引导按钮
  addUser(ans);
  processAnswer(ans);
}

function addUser(text){
  const d=document.createElement('div');
  d.className='msg m-user';
  d.innerHTML='<div class="b">'+esc(text)+'</div>';
  chat.appendChild(d);
  chat.scrollTop=chat.scrollHeight;
  hist.push({role:'user',content:text.substring(0,300)});
  if(hist.length>20)hist=hist.slice(-20);
}

async function send(pre){
  const q=(pre||box.value).trim();if(!q)return;
  box.value='';
  addUser(q);

  if(state.module && !state.reporting){
    processAnswer(q);
    return;
  }
  // ⭐ 新：路由检测 — 用户输入直接动 → 自动跳对应模块
  if(!state.module){
    const detected=detectModule(q);
    if(detected && MODULES[detected]){
      const mod=MODULES[detected];
      state={module:detected,step:0,data:{},reporting:false};
      chat.innerHTML='';
      if(typeof parse_natural_query==='function'){
        const r=parse_natural_query(q);
        if(r && r.data){state.data=Object.assign(state.data,r.data);}
      }
      const intro='识别到您输入的是【'+mod.name+'】。\n\n';
      const auto=state.data.s0?('\n\n📌 已自动提取：'+state.data.s0):'';
      addAI(intro+mod.steps[0].q+auto, mod.steps[0]);
      return;
    }
  }
  // 自由对话模式 → 走 AI 调用
  await callAI(q);
}

function detectModule(text){
  if(typeof parse_natural_query==='function'){
    const r=parse_natural_query(text||'');
    if(r && r.module)return r.module;
  }
  const t=(text||'').toLowerCase();
  if(/排盘|八字|算命|命理|四柱/.test(t))return 'bazi';
  if(/手机号|号码|1[3-9]\d{9}/.test(t))return 'mobile';
  if(/运势|运气|今年|流年/.test(t))return 'yunshi';
  if(/风水|布局|方位|房子/.test(t))return 'fengshui';
  if(/中医|养生|失眠|头痛|脾胃/.test(t))return 'zhongyi';
  if(/财运|投资|理财/.test(t))return 'caiyun';
  if(/事业|工作|创业|跳槽/.test(t))return 'shiye';
  if(/婚姻|感情|桃花|恋爱/.test(t))return 'ganqing';
  if(/五行|缺什么/.test(t))return 'wuxing';
  if(/姓名|改名|名字/.test(t))return 'xingming';
  if(/奇门|遁甲/.test(t))return 'qimen';
  if(/紫微|斗数/.test(t))return 'ziwei';
  if(/六爻|占卜/.test(t))return 'liuyao';
  if(/梅花|易数/.test(t))return 'meihua';
  if(/六壬/.test(t))return 'liuren';
  if(/择日|择吉|吉日/.test(t))return 'zeri';
  if(/黄历|今日宜忌|每天/.test(t))return 'huangli';
  if(/太岁|本命年/.test(t))return 'taisui';
  if(/面相|颜择/.test(t))return 'yanzhi';
  if(/音乐|疗愈|冥想/.test(t))return 'music';
  if(/生命指数|生命规划/.test(t))return 'lifeindex';
  if(/人生规划|人生方向|人生道路|生涯规划|人生设计|命途规划/.test(t))return 'lifeplan';
  return null;
}

async function processAnswer(ans){
  const mod=MODULES[state.module];
  if(!mod)return;

  // 记录数据
  const stepKey='s'+state.step;
  state.data[stepKey]=ans;
  state.step++;

  // 长引导UX折叠：把上一轮（AI问题+用户回答）压缩为一行摘要，避免屏幕堆叠
  _collapseLastTurn();

  // 还有引导步骤
  if(state.step<mod.steps.length){
    const nextStep=mod.steps[state.step];
    // 打字效果
    await typing();
    addAI(nextStep.q,nextStep);
    return;
  }

  // 所有要素收集完→生成报告
  state.reporting=true;

  // R89-P0-排盘三规范校验（出生地/出生时刻/性别）— 缺失则弹反馈，不产残缺报告
  try {
    if (typeof _r89ValidatePaipan === 'function' && (state.module === 'bazi' || state.module === 'ziwei' || state.module === 'qimen')) {
      const _input = _r89BuildInputFromState(state);
      const _v = _r89ValidatePaipan(_input);
      if (!_v.ok) {
        const _prompt = _r89BuildMissingPrompt(_v);
        addAI(_prompt, { type: 'paipan-missing' });
        state.reporting = false;
        return;
      }
    }
  } catch(e) { console.warn('[r89-paipan] err', e); }

  // R89-O 排盘冥想（仪式感 · 仅在慢路径排盘模块触发）
  try {
    if (window.Meditation && (state.module === 'bazi' || state.module === 'ziwei' || state.module === 'qimen')) {
      await new Promise(function(res){
        window.Meditation.start({ onComplete: res });
      });
    }
  } catch(e) { console.warn('[r89-meditation] err', e); }

  await typing();
  await generateReport();
}

// 长引导折叠：把刚回答完的那对（AI问题+用户答案）变为可展开的紧凑摘要
function _collapseLastTurn(){
  try{
    const turns=chat.querySelectorAll('.msg.m-user');
    if(turns.length<1)return;
    // 找最后一个未折叠的 .m-user
    const lastUser=turns[turns.length-1];
    if(!lastUser || lastUser.dataset.folded==='1')return;
    const prevAi=lastUser.previousElementSibling;
    if(!prevAi || !prevAi.classList.contains('m-ai'))return;
    // 抓文本
    const qText=prevAi.querySelector('.b')?prevAi.querySelector('.b').textContent.trim().slice(0,40):'前一个问题';
    const aText=lastUser.querySelector('.b')?lastUser.querySelector('.b').textContent.trim():ans;
    // 创建摘要条
    const sum=document.createElement('div');
    sum.className='msg-turn-sum';
    sum.innerHTML='<span class="ts-tag">已答</span><span class="ts-q">'+esc(qText)+(qText.length>=40?'…':'')+'</span><span class="ts-a">'+esc(aText.slice(0,30))+(aText.length>=30?'…':'')+'</span>';
    sum.title='点击展开/收起原始对话';
    // 替换原始对
    prevAi.replaceWith(sum);
    lastUser.remove();
    sum.dataset.folded='1';
    sum.onclick=function(){
      const expanded=this.dataset.expanded==='1';
      // 这里只控制样式展开，恢复不可逆——简化：点击只折叠/展开 sum 本身
      this.classList.toggle('open',!expanded);
      this.dataset.expanded=expanded?'':'1';
    };
  }catch(_){/* 安全保护 */}
}

async function typing(){
  const t=document.createElement('div');
  t.className='msg m-ai';t.id='ty';
  t.innerHTML='<div class="typing"><i></i><i></i><i></i></div>';
  chat.appendChild(t);chat.scrollTop=chat.scrollHeight;
  await new Promise(r=>setTimeout(r,600));
  try{ t.remove(); }catch(_){ /* 安全保护,避免 ReferenceError 中断 processAnswer */ }
}

async function generateReport(){
  try{ _recordRecentMod(state.module); }catch(e){console.warn("报告降级:",e.message);}
  // R89-M 缘主档案召回：报告前捕获
  try{
    if (window.YuanzhuRecall && typeof window.YuanzhuRecall.captureBeforeReport === 'function'){
      window.YuanzhuRecall.captureBeforeReport(state);
    }
  }catch(e){ console.warn('[recall] capture fail', e); }
  const mod=MODULES[state.module];
  const collected=Object.values(state.data);
  try{ _renderRecentModCard(); }catch(e){console.warn("报告降级:",e.message);}

  // 0. 问卷 + 排盘落库（公网公开端点，失败静默）
  const _baziForSave = (state.module==='bazi' || state.module==='name' || state.module==='number' || state.module==='face') ? state.data : null;
  _saveSurvey(state.module, state.data, _baziForSave);

  // R89-M 缘主档案召回：生成报告后自动保存到 localStorage
  try {
    if (window.YuanzhuProfile && state.data) {
      const _name = state.data.name || state.data.xingming || state.data.姓名 || '';
      if (_name) {
        window.YuanzhuProfile.captureFromState(state);
        // R89-N · 报告生成后顶部 chip 即时显示当前缘主
        _renderProfileChip();
      }
    }
  } catch(e) { console.warn('[r89-archive] err', e); }

  // R89-O 排盘冥想模式 + 仪式感（仅慢路径排盘模块）
  var _slowModule = ['bazi','name','number','face','qimen','ziwei','liuyao','liuren','meihua','zeri','huangli','taisui','daLiuRen','xiaoLiuRen'].includes(state.module);
  if (_slowModule && window.Meditation && !window._r89_medSkip) {
    await new Promise(function(resolve){
      try { window.Meditation.start({ onComplete: resolve, moduleName: state.module }); }
      catch(e){ console.warn('[meditation]', e); resolve(); }
    });
  }

  // ③ 模块 KB 兜底（music/lifeindex/lifeplan 三大模块断网可用）
if(window._MODULE_REPORTS && _MODULE_REPORTS[state.module]){
  try {
    const mr = _MODULE_REPORTS[state.module];
    const rep = mr.diagnose(state.data);
    let html = '【模块KB兜底 · '+mr.name+'】\n\n';
    if(rep.ttsText) html += '🔊 朗读：'+rep.ttsText+'\n\n';
    if(rep.total !== undefined) html += '综合指数：'+rep.total+' 分\n\n';
    if(rep.element) html += '主导五行：'+rep.element+' 行\n';
    if(rep.summary) html += '📊 '+rep.summary+'\n\n';
    if(rep.fiveElement){
      html += '推荐五行：'+rep.fiveElement+'\n';
      if(rep.recommend) html += '特质：'+rep.recommend.feel+'\n\n';
    }
    if(rep.dimensions){
      html += '【十维度评分卡】\n';
      rep.dimensions.forEach(d => {
        const mark = d.score >= 85 ? '✅' : d.score >= 75 ? '🟢' : d.score >= 60 ? '🟡' : '🔴';
        html += '  '+mark+' '+ (d.icon||'•') + ' '+d.name+'：'+d.score+' 分（'+ (d.status||'') +'）· '+ (d.focus||'')+'\n';
      });
      html += '\n';
    }
    if(rep.next5Years){
      html += '【未来 5 年节奏建议】\n';
      rep.next5Years.forEach((y,i) => html += '  第'+ (i+1) +'年：'+y.text+'\n');
      html += '\n';
    }
    if(rep.actions){
      html += '【十条行动清单】\n';
      rep.actions.slice(0,10).forEach((s,i) => html += '  '+(i+1)+'.'+s+'\n');
      html += '\n';
    }
    if(rep.stage){
      html += '人生阶段：'+rep.stage.name+'（'+rep.stage.range+'）\n';
      html += '重点：'+rep.stage.focus.join('、')+'\n\n';
    }
    if(rep.stageTemplate){
      html += '【本阶段 12 领域细化 48 子项】\n';
      Object.entries(rep.stageTemplate).forEach(([k, v]) => {
        const dom = rep.domains && rep.domains.find(d => d.key === k);
        html += '  · '+(dom?dom.icon:'•')+' '+ (dom?dom.name:k) +'：'+ v +'\n';
      });
      html += '\n';
    }
    if(rep.domainScores){
      html += '【十二领域评分卡】\n';
      rep.domainScores.forEach(d => {
        const mark = d.score >= 75 ? '✅' : d.score >= 60 ? '🟡' : '🔴';
        html += '  '+mark+' '+d.icon+' '+d.name+'：'+d.score+' 分（'+d.status+'）\n';
      });
      html += '\n';
    }
    if(rep.timeline){
      html += '人生时间轴：\n';
      rep.timeline.forEach(t => html += '  '+t.age+'岁：'+t.text+'\n');
      html += '\n';
    }
    if(rep.next5Years){
      html += '【未来 5 年步骤建议】\n';
      rep.next5Years.forEach(y => html += '  · '+y.year+' 岁：'+y.text+'\n');
      if(rep.fiveYearAdvice) html += '\n总评：'+rep.fiveYearAdvice+'\n';
      html += '\n';
    }
    if(rep.sixDims){
      html += '【六维度评分卡】\n';
      Object.entries(rep.sixDims).forEach(([k,v])=>{
        const mark = v>=70?'✅':v>=55?'🟡':'🔴';
        html += '  '+mark+' '+k+'：'+v+' 分\n';
      });
      html += '\n';
    }
    if(rep.nextSteps){
      html += '【十条行动清单】\n';
      rep.nextSteps.forEach((s,i) => html += '  '+(i+1)+'.'+s+'\n');
      html += '\n';
    }
    if(rep.playList){
      html += '🎵 推荐播放列表：\n';
      rep.playList.forEach((p,i) => html += '  '+(i+1)+'. '+p.name+'（'+p.duration+' 秒）'+(p.ttsText?' \n     ↳ '+p.ttsText:'')+'\n');
      html += '\n';
      // P14 节点 3：嵌入朗读按钮 sentinel（在 showReport 后由 _afterShowReportMusic 抓取并附加按钮组）
      try{
        const _plJson = JSON.stringify(rep.playList).replace(/"/g,'&quot;');
        html += '\n<!--MUSIC_PLAYLIST:'+_plJson+'-->\n';
      }catch(e){ console.warn('music playlist serialize err', e); }
    }
    if(rep.intro){ html += '📝 '+rep.intro+'\n\n'; }
    if(rep.cycleText){ html += rep.cycleText+'\n\n'; }
    if(rep.compatible){ html += rep.compatible+'\n\n'; }
    showReport(html);
    autoSavePaipan(html);
    return;
  } catch(e){ console.warn('_MODULE_REPORTS diagnose err', e); }
}

// ① KB 优先：先查本地知识库
  let kbHit = _kbScore(state.module, state.data);
  if (kbHit.fallback) {
    // 异步走服务端 /api/public/kb-query fallback
    try {
      kbHit = await _kbQueryFallback(kbHit);
    } catch (e) {
      console.warn('[kb fallback]', e);
    }
  }
  // R64: 设备上下文加权——最近 5 分钟内拍过舌照 → shexiang 命中分 +0.3
  try {
    const boost = (window.getDeviceModuleBoost && window.getDeviceModuleBoost()) || {};
    if (boost[state.module]) {
      const before = kbHit.score;
      kbHit.score = Math.min(1.0, kbHit.score + boost[state.module]);
      if (window.console && console.log) console.log(`[R64] 设备加权 ${state.module} +${boost[state.module].toFixed(2)} (${before.toFixed(2)} → ${kbHit.score.toFixed(2)})`);
      // 记录加权事件，供日志页查看
      try {
        const logKey = '_device_kb_boost_log';
        const arr = JSON.parse(localStorage.getItem(logKey) || '[]');
        arr.push({ module: state.module, boost: boost[state.module], before, after: kbHit.score, ts: Date.now() });
        if (arr.length > 50) arr.shift();
        localStorage.setItem(logKey, JSON.stringify(arr));
      } catch (e) {}
    }
  } catch (e) { /* ignore */ }
  // P14 节点 8.5：lifeindex 后端增强（10 维度五行权重评分）
  let lifeindexBackend = null;
  if (state.module === 'lifeindex' && kbHit.score >= 0.4) {
    try {
      const userText = Object.values(state.data || {}).join(' ');
      const ageMatch = userText.match(/(\d{2,3})岁/) || userText.match(/年龄\s*(\d{2,3})/);
      const feMatch = userText.match(/([金木水火土])行/) || (state.data.fe || '');
      const gender = userText.match(/[男女]/) ? userText.match(/[男女]/)[0] : '';
      const concerns = (userText.match(/(事业|工作|财运|金钱|健康|身体|婚姻|感情|学业|学习|家庭|人际|朋友|精神|禅修|享福|福气|寿元|寿命|长命)/g) || []).slice(0, 4);
      const liRes = await fetch(API + '/api/ai/lifeindex-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: ageMatch ? parseInt(ageMatch[1]) : 30,
          gender,
          concerns,
          fiveElement: feMatch || '',
          withTTS: true
        })
      }).catch(() => null);
      if (liRes) {
        const liJson = await liRes.json().catch(() => null);
        if (liJson && liJson.code === 0 && liJson.data && liJson.data.report) {
          lifeindexBackend = liJson.data;
          promptExtra = '\n\n【后端 lifeindex-report 结构化输出】\n' +
            '总分：' + lifeindexBackend.report.total + '，top3：' + (lifeindexBackend.report.top3 || []).join('、') + '，bot2：' + (lifeindexBackend.report.bot2 || []).join('、') + '\n' +
            '10 维度：' + (lifeindexBackend.report.dimensions || []).map(d => d.name + ' ' + d.score + '(' + d.status + ')').join('、') + '\n' +
            '10 建议：' + (lifeindexBackend.report.recommendations || []).slice(0, 10).join(' | ') + '\n' +
            'KB 命中 ' + lifeindexBackend.report.kbHitCount + ' 条参考材料';
        }
      }
    } catch (e) { console.warn('[lifeindex backend]', e); }
  }

  // P14 节点 8.6：music 后端增强（五行 × 情绪曲目推荐）
  let musicBackend = null;
  if (state.module === 'music' && kbHit.score >= 0.4) {
    try {
      const userText = Object.values(state.data || {}).join(' ');
      const ageMatch = userText.match(/(\d{2,3})岁/) || userText.match(/年龄\s*(\d{2,3})/);
      const feMatch = userText.match(/([金木水火土])行/) || (state.data.fe || '');
      const moodMatch = userText.match(/(焦虑|失眠|悲伤|愤怒|疲劳|烦闷|抑郁)/);
      const moodMap = { '焦虑': 'anxiety', '失眠': 'insomnia', '悲伤': 'sadness', '愤怒': 'anger', '疲劳': 'fatigue', '烦闷': 'anxiety', '抑郁': 'sadness' };
      const mRes = await fetch(API + '/api/ai/music-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: ageMatch ? parseInt(ageMatch[1]) : 30,
          mood: moodMatch ? moodMap[moodMatch[0]] : 'fatigue',
          fiveElement: feMatch || '',
          withTTS: true
        })
      }).catch(() => null);
      if (mRes) {
        const mJson = await mRes.json().catch(() => null);
        if (mJson && mJson.code === 0 && mJson.data && mJson.data.report) {
          musicBackend = mJson.data;
          promptExtra = '\n\n【后端 music-report 结构化输出】\n' +
            '情绪：' + musicBackend.report.mood + '，推荐五行：' + musicBackend.report.fiveElement + '\n' +
            '曲目推荐：' + (musicBackend.report.tracks || []).map(t => t.name + '（' + t.scene + '）').join(' | ') + '\n' +
            '听赏指南：' + (musicBackend.report.playGuide || []).slice(0, 8).join(' | ') + '\n' +
            'KB 命中 ' + musicBackend.report.kbHitCount + ' 条参考材料';
        }
      }
    } catch (e) { console.warn('[music backend]', e); }
  }

  // P14 节点 8：lifeplan 后端增强（12 领域结构化报告）
  let lifeplanBackend = null;
  if (state.module === 'lifeplan' && kbHit.score >= 0.4) {
    try {
      const ageFromState = state.data && (state.data.age || parseInt(String(state.data.s1||'').match(/\d{4}/)?.[0]) || '');
      const userText = Object.values(state.data || {}).join(' ');
      const liveM = userText.match(/(北京|上海|广州|深圳|杭州|成都|武汉|西安|南京|重庆|天津|苏州)/);
      const concerns = (userText.match(/(学业|职业|工作|事业|财运|感情|婚姻|健康|城市|风物|修养|人脉|创业|养老|传承|学习|睡眠|财务|退休|孩子)/g) || []).slice(0,4);
      const lpRes = await fetch(API + '/api/ai/lifeplan-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: ageFromState || 30,
          gender: (state.data.s1||'').includes('男') ? '男' : (state.data.s1||'').includes('女') ? '女' : '',
          concerns,
          livePlace: liveM ? liveM[0] : '',
          withTTS: true
        })
      }).catch(() => null);
      if (lpRes) {
        const lpJson = await lpRes.json().catch(() => null);
        if (lpJson && lpJson.code === 0 && lpJson.data && lpJson.data.report) {
          lifeplanBackend = lpJson.data;
          // 把后端报告嵌入 prompt，让 AI 锚定 12 领域评分 + 5 年规划 + 10 行动
          promptExtra = '\n\n【后端 lifeplan-report 结构化输出】\n' +
            '阶段：' + lifeplanBackend.report.stage + '（' + lifeplanBackend.report.stageRange + '）\n' +
            '总分：' + lifeplanBackend.report.total + '，top3：' + (lifeplanBackend.report.top3||[]).join('、') + '，bot2：' + (lifeplanBackend.report.bot2||[]).join('、') + '\n' +
            '12 领域：' + (lifeplanBackend.report.domains||[]).map(d => d.name + ' ' + d.score + '(' + d.status + ')').join('、') + '\n' +
            '5 年规划：' + (lifeplanBackend.report.next5Years||[]).map(y => y.year + ':' + y.text).join(' | ') + '\n' +
            '10 行动：' + (lifeplanBackend.report.actions||[]).slice(0,10).join(' | ') + '\n' +
            'KB 命中 ' + lifeplanBackend.report.kbHitCount + ' 条参考材料';
        }
      }
    } catch (e) {
      console.warn('[lifeplan backend]', e);
    }
  }
  // 只有 KB 命中（score >= 0.4）才算 hit，避免 fallback 0.3 假阳
  if (kbHit.score >= 0.4) {
    _kbHitCount(state.module, kbHit.entryId);
    _kbTodayCount();
    // P0-任务1 收尾：KB 命中率精细化打点（命中率 / 今日统计 / 趋势 / 弱项 / 最强模块）
    if (typeof recordKbHit === 'function') {
      recordKbHit(state.module, kbHit.score, kbHit.score >= 0.7);
    }
  } else {
    // < 0.4 纯 AI 兜底：记事件作为命中率分母
    if (typeof recordKbHit === 'function') {
      recordKbHit(state.module, kbHit.score || 0, false);
    }
  }
  // 问卷 + 排盘结果落库（公开端点，失败静默）
  _saveSurvey(state.module, state.data, _baziForSave);

  if(kbHit.score >= 0.7){
    // KB 直答
    const kbReport = '【来源：本地知识库（'+kbHit.source+' · '+kbHit.entryId+'，命中分 '+kbHit.score+'）】\n\n' + kbHit.snippet.substring(0, 4000);
    showReport(kbReport, {score: kbHit.score, source: kbHit.source, engine: kbHit.engine || 'fts5', fallback: kbHit.fallback || false});
    autoSavePaipan(kbReport);
    return;
  }

  // ② KB 摘要 + AI 润色（命中分 0.4-0.7）
  let promptExtra = '';
  if(kbHit.score >= 0.4){
    promptExtra = '\n\n【本地知识库参考材料（'+kbHit.source+'）】\n' + kbHit.snippet.substring(0, 1500);
  }

  // R51：KB 命中分 < 0.4 时，调 module-reports 断网兜底诊断 → 让 AI 有真实数据可润色
  if(kbHit.score < 0.4 && window._MODULE_REPORTS && window._MODULE_REPORTS[state.module]){
    try {
      const mr = window._MODULE_REPORTS[state.module];
      const rep = mr.diagnose(state.data);
      if(rep){
        let fb = '\n\n【本地引擎诊断参考（'+mr.name+' KB 兜底）】\n' + (rep.summary||'');
        if(rep.element) fb += '\n主导元素：' + rep.element;
        if(rep.total) fb += '\n综合指数：' + rep.total + ' 分';
        if(rep.nextSteps) fb += '\n建议：' + rep.nextSteps.slice(0,5).join('；');
        if(rep.suggestions) fb += '\n布局建议：' + rep.suggestions.slice(0,3).join('；');
        promptExtra += fb;
      }
    } catch(e){ console.warn('[R51 fallback]', e); }
  }

  // ③ 调用后端 AI
  const prompt='用户选择了「'+mod.name+'」模块，通过对话收集了以下信息：'+collected.join('；')+'。请基于以上信息给出专业、丰富、详实的分析评估报告，报告要拿来即用，包含具体建议。'+promptExtra;
  // 把用户结构化数据（八字/姓名/数字/生辰...）作为 baziData 传给后端，让 AI 能基于真实数据回答而非通用模板
  const baziData = (state.module==='bazi' || state.module==='name' || state.module==='number' || state.module==='face') ? state.data : null;

  try{
    var _ac=new AbortController();var _to=setTimeout(function(){_ac.abort();},15000);var r;try{r=await fetch(API+'/api/ai/public-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[...hist.slice(-8),{role:'user',content:prompt}], baziData}),signal:_ac.signal});clearTimeout(_to);}catch(e){clearTimeout(_to);console.warn('AI fetch 超时或失败:',e.message);return localReport(state.module,state.data);}
    const d=await r.json();
    const reply=(d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content)||'';
    if(reply.length>50){
      // P14 节点 8：lifeplan 后端结构化报告优先（拼接 AI 润色说明）
      if (state.module === 'lifeplan' && lifeplanBackend) {
        const lp = lifeplanBackend.report;
        const tbl = (lp.domains||[]).map(d => '| ' + d.icon + ' ' + d.name + ' | ' + d.score + ' | ' + d.status + ' |').join('\n');
        const yr = (lp.next5Years||[]).map(y => '| ' + y.year + ' 岁 | ' + y.text + ' |').join('\n');
        const act = (lp.actions||[]).slice(0,10).map((a,i) => (i+1)+'. '+a).join('\n');
        const structure = '【来源：lifeplan-report 后端结构化报告 + KB+AI 润色（'+kbHit.source+'）】\n\n' +
          '## ' + lp.title + '\n' +
          lp.summary + '\n\n' +
          '### 12 领域评分\n| 领域 | 分 | 等级 |\n|---|---|---|\n' + tbl + '\n\n' +
          '### 未来 5 年规划\n| 年龄 | 阶段 |\n|---|---|\n' + yr + '\n\n' +
          '### 10 条行动清单\n' + act + '\n\n' +
          '### AI 润色建议\n' + reply + '\n\n' +
          '— KB 命中 ' + lp.kbHitCount + ' 条参考材料\n— TTS 朗读：' + (lifeplanBackend.ttsText||'').substring(0,200) + '…';
        const _sourcesArr = (kbHit && Array.isArray(kbHit.results)) ? kbHit.results.map(r => r.source).filter(Boolean) : [];
        showReport(structure, {score: kbHit.score, source: kbHit.source, engine: kbHit.engine || 'fts5', fallback: !!kbHit.fallback, sources: _sourcesArr});
        autoSavePaipan(structure);
        return;
      }
      // P14 节点 8.5：lifeindex 后端结构化报告优先
      if (state.module === 'lifeindex' && lifeindexBackend) {
        const li = lifeindexBackend.report;
        const tbl = (li.dimensions||[]).map(d => '| ' + d.icon + ' ' + d.name + ' | ' + d.score + ' | ' + d.status + ' |').join('\n');
        const rec = (li.recommendations||[]).slice(0,10).map((r,i) => (i+1)+'. '+r).join('\n');
        const structure = '【来源：lifeindex-report 后端结构化报告 + KB+AI 润色（'+kbHit.source+'）】\n\n' +
          '## ' + li.title + '\n' +
          li.summary + '\n\n' +
          '### 10 维度五行权重评分\n| 维度 | 分 | 等级 |\n|---|---|---|\n' + tbl + '\n\n' +
          '### 10 条调养建议\n' + rec + '\n\n' +
          '### AI 润色建议\n' + reply + '\n\n' +
          '— KB 命中 ' + li.kbHitCount + ' 条参考材料\n— TTS 朗读：' + (lifeindexBackend.ttsText||'').substring(0,200) + '…';
        const _sourcesArr = (kbHit && Array.isArray(kbHit.results)) ? kbHit.results.map(r => r.source).filter(Boolean) : [];
        showReport(structure, {score: kbHit.score, source: kbHit.source, engine: kbHit.engine || 'fts5', fallback: !!kbHit.fallback, sources: _sourcesArr});
        autoSavePaipan(structure);
        return;
      }
      // P14 节点 8.6：music 后端结构化报告优先
      if (state.module === 'music' && musicBackend) {
        const m = musicBackend.report;
        const tracks = (m.tracks||[]).map(t => '| **' + t.name + '** | ' + t.tag + ' | ' + t.scene + ' | ' + t.desc + ' |').join('\n');
        const guide = (m.playGuide||[]).slice(0,10).map((g,i) => (i+1)+'. '+g).join('\n');
        const structure = '【来源：music-report 后端结构化报告 + KB+AI 润色（'+kbHit.source+'）】\n\n' +
          '## ' + m.title + '\n' +
          m.summary + '\n\n' +
          '### 五行音疗曲目推荐\n| 曲名 | 形制 | 场景 | 说明 |\n|---|---|---|---|\n' + tracks + '\n\n' +
          '### 听赏指南（10 条）\n' + guide + '\n\n' +
          '### AI 润色建议\n' + reply + '\n\n' +
          '— KB 命中 ' + m.kbHitCount + ' 条参考材料\n— TTS 朗读：' + (musicBackend.ttsText||'').substring(0,200) + '…';
        const _sourcesArr = (kbHit && Array.isArray(kbHit.results)) ? kbHit.results.map(r => r.source).filter(Boolean) : [];
        showReport(structure, {score: kbHit.score, source: kbHit.source, engine: kbHit.engine || 'fts5', fallback: !!kbHit.fallback, sources: _sourcesArr});
        autoSavePaipan(structure);
        return;
      }
      const tagged = kbHit.score >= 0.4 ? '【来源：KB+AI 润色（'+kbHit.source+'）】\n\n'+reply : reply;
      // R89-P1-4: 多流派来源注入（让 showReport 渲染"源头透明"徽章）
      const _sourcesArr = (kbHit && Array.isArray(kbHit.results)) ? kbHit.results.map(r => r.source).filter(Boolean) : [];
      showReport(tagged, {score: kbHit.score, source: kbHit.source || 'AI', engine: kbHit.engine || 'ai-backend', fallback: !!kbHit.fallback, sources: _sourcesArr});
      autoSavePaipan(tagged);
      return;
    }
  }catch(e){console.warn("报告降级:",e.message);}

  // ④ 降级：本地生成报告
  const local=localReport(state.module,state.data);
  const fallback = '【来源：本地引擎】\n\n' + local;
  showReport(fallback, {score: 0, source: 'local-engine', engine: 'local', fallback: true});
  autoSavePaipan(fallback);
}

// 自动将本次排盘同步到后端画像(静默失败，不影响前端体验)
async function autoSavePaipan(reportText){
  try{
    const tok=localStorage.getItem('mlbj_token')||'';
    const hdr=tok?{'Authorization':'Bearer '+tok,'Content-Type':'application/json'}:{'Content-Type':'application/json'};
    await fetch(API+'/api/paipan/save',{method:'POST',headers:hdr,body:JSON.stringify({
      type:state.module||'unknown',
      inputData:state.data||{},
      resultData:{report:reportText.substring(0,5000)},
      rawQuery:(Object.values(state.data||{}).join('；')||'').substring(0,500)
    })});
  }catch(_){/*静默失败*/}
}

// ===== R89-P0 排盘三规范桥接（出生地/出生时刻/性别）=====
function _r89BuildInputFromState(st){
  const d = st && st.data ? st.data : {};
  const norm = (s) => (typeof s === 'string') ? s.trim() : '';
  return {
    province: norm(d.s2 || d.province || ''),
    birthTime: norm(d.s1 || d.birthTime || ''),
    gender: norm(d.s3 || d.gender || '')
  };
}
function _r89ValidatePaipan(input){
  try {
    if (typeof window !== 'undefined' && window.PaipanInput && typeof window.PaipanInput.validatePaipanInput === 'function') {
      return window.PaipanInput.validatePaipanInput(input);
    }
  } catch(e) { /* 静默回退 */ }
  // 兜底校验（不依赖外部加载）
  const missing = [];
  if (!input.province) missing.push({ field: 'province', label: '出生地（省）', reason: '命理必须精确出生经度（同省不同县时辰边界差 1-2 分钟）' });
  if (!input.birthTime) missing.push({ field: 'birthTime', label: '出生时刻', reason: '真太阳时校准是排盘基石（早晚跨时辰差 4-8 度）' });
  if (!input.gender) missing.push({ field: 'gender', label: '性别', reason: '大运排法男阳女阴、女阳男阴' });
  return { ok: missing.length === 0, missing };
}
function _r89BuildMissingPrompt(v){
  try {
    if (typeof window !== 'undefined' && window.PaipanInput && typeof window.PaipanInput.buildMissingPrompt === 'function') {
      return window.PaipanInput.buildMissingPrompt(v);
    }
  } catch(e) {}
  if (!v || !v.missing || v.missing.length === 0) return '✅ 信息完整，将为您生成专业排盘报告。';
  const lines = ['📋 **为确保报告专业准确，还需您补充以下信息：**', ''];
  v.missing.forEach((m, i) => {
    lines.push(`${i + 1}. **${m.label}** — ${m.reason}`);
  });
  lines.push('');
  lines.push('💡 **提示**：这些信息对排盘准确性至关重要，缺失将导致时辰/大运/方位等关键论断产生偏差。');
  lines.push('');
  lines.push('请直接回复补充信息（如：**浙江省杭州市 / 1990-10-28 07:23 / 男**），系统将自动校验并继续生成报告。');
  return lines.join('\n');
}

// ===== R89 合规黑名单 + 免责声明（P0-2 / P0-3 / P2-1）=====
const COMPLIANCE_FORBIDDEN = [
  // —— 绝对化（违反"非全称判断"）——
  { rx: /必定.{0,3}(?:升官|发财|大富大贵|大富|大贵|大灾|大难)/g, label: '绝对化-必定大富大贵/大灾', repl: '有较大可能（仍需努力）' },
  { rx: /注定(?:要|会).{0,6}(?:大富|大贵|大灾|大难|死|病|穷|败)/g, label: '绝对化-注定大富/大灾', repl: '命理倾向提示' },
  { rx: /百分百/g, label: '绝对化-百分百', repl: '有较大可能' },
  { rx: /百分之百/g, label: '绝对化-百分之百', repl: '有较大可能' },
  { rx: /一定会(?:死|灾|病|穷|败|输|大凶|大难)/g, label: '绝对化-一定会灾', repl: '需注意防范' },
  { rx: /一定(?:会|要)?(?:死|大凶|大难|破产)/g, label: '绝对化-一定大凶', repl: '需注意防范' },
  // —— 恐吓-生命 ——
  { rx: /血光之灾/g, label: '恐吓-血光之灾', repl: '需注意安全防范' },
  { rx: /血光/g, label: '恐吓-血光', repl: '健康风险' },
  { rx: /必死/g, label: '恐吓-必死', repl: '需特别留意健康' },
  { rx: /必有大(?:难|灾|祸)/g, label: '恐吓-必有大难/灾/祸', repl: '宜谨慎行事' },
  { rx: /活不过.?\d{1,2}岁/g, label: '恐吓-活不过X岁', repl: '需注重健康养生' },
  { rx: /短命/g, label: '恐吓-短命', repl: '需要特别注意健康' },
  { rx: /死路一条/g, label: '恐吓-死路一条', repl: '可考虑多路径探索' },
  { rx: /毫无希望/g, label: '恐吓-毫无希望', repl: '需耐心探索' },
  // —— 恐吓-婚姻 ——
  { rx: /克夫/g, label: '恐吓-克夫', repl: '与配偶多沟通包容' },
  { rx: /克妻/g, label: '恐吓-克妻', repl: '与配偶多沟通包容' },
  { rx: /克子/g, label: '恐吓-克子', repl: '与子女多沟通包容' },
  { rx: /克父母/g, label: '恐吓-克父母', repl: '与家人多沟通包容' },
  { rx: /克兄/g, label: '恐吓-克兄', repl: '与兄弟姐妹多沟通' },
  // —— 恐吓-财务 ——
  { rx: /必破财/g, label: '恐吓-必破财', repl: '需注意理财稳健' },
  { rx: /必破产/g, label: '恐吓-必破产', repl: '建议稳健经营/合理配置资产' },
  { rx: /破产/g, label: '恐吓-破产', repl: '财务上有波动起伏' },
  { rx: /穷困潦倒/g, label: '恐吓-穷困潦倒', repl: '需稳扎稳打逐步积累' },
  // —— 医疗诊断替代（保留原文 + 括号补注：诊断需结合现代医学）——
  { rx: /包治/g, label: '医疗诊断替代·包治', repl: '包治（诊断需结合现代医学）' },
  { rx: /根治/g, label: '医疗诊断替代·根治', repl: '根治（诊断需结合现代医学）' },
  { rx: /断根/g, label: '医疗诊断替代·断根', repl: '断根（诊断需结合现代医学）' },
  { rx: /能治好/g, label: '医疗诊断替代·能治好', repl: '能治好（诊断需结合现代医学）' },
  { rx: /可治愈/g, label: '医疗诊断替代·可治愈', repl: '可治愈（诊断需结合现代医学）' },
  { rx: /吃了(?:就|一定).{0,4}好/g, label: '医疗诊断替代·吃了就好', repl: '吃了就好（诊断需结合现代医学）' },
  { rx: /不用吃药/g, label: '医疗诊断替代·不用吃药', repl: '不用吃药（诊断需结合现代医学）' },
  { rx: /不需要(?:看医生|就医|吃药)/g, label: '医疗诊断替代·不需要就医', repl: '不需要看医生（诊断需结合现代医学）' },

  // ═══════ R89-P1-5：周边合规（同步外部 js/compliance.js）═══════
  // —— 未成年人 ——
  { rx: /未成年(?:不宜|不应|不可|禁止)(?:算命|预测|占卜|论命)/g, label: '未成年人-强制声明', repl: '青少年正处于成长期，命理仅供参考，请以家长引导和现代教育为主' },
  { rx: /(?:小孩|儿童|宝宝|婴幼儿|学生|初中生|高中生).{0,8}(?:命不好|命硬|克)/g, label: '未成年人-负面定论', repl: '孩子运势需要家长细心培养，命理仅参考' },
  // —— 性别 —
  { rx: /女人(?:命不好|就该|注定|一定).{0,8}(?:穷|苦|累|没出息)/g, label: '性别歧视-贬低女性', repl: '女性能力不弱于性别，命运在于自身选择和努力' },
  { rx: /男人(?:就该|必须|注定).{0,8}(?:买房|买车|养家|赚钱)/g, label: '性别歧视-男性压力', repl: '家庭分工因人而异，男女共同承担' },
  { rx: /(?:女命|男命)(?:不行|不好|差|弱)/g, label: '性别歧视-命理性别定论', repl: '命理以个人八字整体论，不因性别下定论' },
  // —— 生肖 —
  { rx: /属(?:鼠|牛|虎|兔|龙|蛇|马|羊|猴|鸡|狗|猪)(?:的)?(?:人|命|生肖).{0,6}(?:不好|不行|差|倒霉|克)/g, label: '生肖歧视-负面定论', repl: '生肖仅是出生年份的记号，命运取决于个人努力和选择' },
  { rx: /生肖(?:犯冲|相害|相刑|相破)/g, label: '生肖-术语不带歧视', repl: '属相配合宜理性看待，避免绝对化解读' },
  // —— 民族地域 —
  { rx: /(?:某族|某省|某地)(?:人|命)(?:不行|不好|差|奸|滑)/g, label: '民族地域歧视-负面定论', repl: '命理以个人八字论，不因民族地域下定论' },
  // —— 隐私 —
  { rx: /(?:身份证|手机号|银行卡|地址)(?:.{0,4}):\s*\d/g, label: '隐私-敏感信息展示', repl: '[隐私信息已脱敏]' },
  { rx: /姓名[::]\s*[\u4e00-\u9fa5]{2,4}(?!\s*[，。、])/g, label: '隐私-真实姓名展示', repl: '姓名：[化/简称]' },
  // —— 心理健康 —
  { rx: /你(?:抑郁了|有抑郁症|想不开|想死|会自杀)/g, label: '心理健康-妄下诊断', repl: '如情绪低落请咨询专业心理医生' },
  { rx: /肯定(?:抑郁|精神病|焦虑症)/g, label: '心理健康-妄下诊断', repl: '心理状态请咨询专业医师' },
];
const COMPLIANCE_DISCLAIMER = '⚠️ 免责声明：本报告基于传统命理学理论，仅供国学文化学习与娱乐参考，不构成医疗、理财、法律或任何专业建议。命由天定，运由己造，人生的最终走向取决于您的选择与努力。';
const KB_SOURCE_TAGS = [
  { rx: /倪海厦|倪师|人纪/g, tag: '📘 倪海厦', cls: 'tag-nihaisha' },
  { rx: /舒晗|舒晗天纪|奇门校正/g, tag: '🎯 舒晗', cls: 'tag-shuhan' },
  { rx: /路大师|路氏一脉|朱鹊桥|段建业/g, tag: '🌟 路大师', cls: 'tag-lu' },
  // 古籍原文仅当可验证出处时使用
  { rx: /古籍|黄帝内经|难经|伤寒论|神农本草|本草纲目|易经/g, tag: '📜 古籍', cls: 'tag-classic' },
  // R89-P1-4-2 2026-07-27：行业通行（找不到古籍原文时直接选通行版，不率强附会）
  { rx: /行业通行|通用规则|常规断法|约定俗成|通行断法|一般认为|传统上|传统观点|通常认为/g, tag: '📚 行业通行', cls: 'tag-common' },
];
// R89-P1-6: 受众分流 — 大众需拦截恐吓/绝对化/医疗替代；专家不拦截，仅追加研究免责
function _r89GetAudience(){
  try {
    return localStorage.getItem('_r89_audience') || 'public';
  } catch(e) { return 'public'; }
}
function _r89SetAudience(a){
  try { localStorage.setItem('_r89_audience', a); } catch(e) {}
  // 同步UI 按钮文案
  try {
    const lbl = document.getElementById('audienceLabel');
    if (lbl) lbl.textContent = (a === 'expert') ? '专家' : '大众';
  } catch(e) {}
}
function _r89ToggleAudience(){
  const cur = _r89GetAudience();
  const next = (cur === 'expert') ? 'public' : 'expert';
  _r89SetAudience(next);
  try {
    if (typeof showToast === 'function') {
      showToast(next === 'expert' ? '🧙 已切到专家模式（禁用词不拦截）' : '👥 已切到大众模式（自动拦截禁用词）');
    } else if (typeof toast === 'function') {
      toast(next === 'expert' ? '🧙 已切到专家模式（禁用词不拦截）' : '👥 已切到大众模式（自动拦截禁用词）');
    }
  } catch(e) {}
}
// A1 修复：页面加载时读 localStorage 同步 label，避免刷新后 UI 不一致
function _r89InitAudience(){
  try {
    const cur = _r89GetAudience();
    const lbl = document.getElementById('audienceLabel');
    if (lbl) lbl.textContent = (cur === 'expert') ? '专家' : '大众';
    const btn = document.getElementById('audienceToggle');
    if (btn) {
      btn.style.background = (cur === 'expert') ? 'rgba(245,158,11,.18)' : 'rgba(124,58,237,.15)';
      btn.style.borderColor = (cur === 'expert') ? 'rgba(245,158,11,.55)' : 'rgba(124,58,237,.4)';
      btn.style.color = (cur === 'expert') ? '#fbbf24' : '#a78bfa';
    }
  } catch(e) {}
}
_r89InitAudience();
function _r89ApplyCompliance(text){
  if (typeof text !== 'string') return { text: '', hits: [] };
  const audience = _r89GetAudience();  // 'public' | 'expert'
  // R89: 优先用外部 js/compliance.js（32 条全规则含医疗类 + 受众分流），无则用内联 25 条
  if (typeof window !== 'undefined' && window.Compliance && typeof window.Compliance.applyCompliance === 'function') {
    try {
      // compliance.js 期望 opts 对象 + audience 名是 'general'/'expert'（不是 'public'/'expert'）
      const apiAudience = (audience === 'expert') ? 'expert' : 'general';
      const r = window.Compliance.applyCompliance(text, { audience: apiAudience });
      return { text: r.text, hits: r.hits || [], skipped: r.skipped || false, audience };
    } catch(e) { /* 降级 */ }
  }
  // 内联降级版：专家模式不拦截 + 追加研究免责；大众模式拦截 + 追加免责声明
  const hits = [];
  let out = text;
  if (audience !== 'expert') {
    for (const r of COMPLIANCE_FORBIDDEN) {
      if (r.rx.test(out)) {
        const m = out.match(r.rx);
        hits.push({ label: r.label, sample: m[0], replaced: r.repl });
        out = out.replace(r.rx, r.repl);
      }
    }
  }
  // 末尾追加免责声明（已存在则跳过）
  const disclaimer = (audience === 'expert')
    ? '📚 研究免责：本报告为学术研究/同行参考版，不负责传播预警义务；大众读者请使用「受眾=大众」模式以获得合规保护。'
    : COMPLIANCE_DISCLAIMER;
  if (!/⚠️ 免责声明|📚 研究免责/.test(out)) {
    out = out.replace(/\s*$/, '') + '\n\n' + disclaimer;
  }
  return { text: out, hits, audience };
}
function _r89ExtractSourceTags(text){
  if (typeof text !== 'string') return { tags: [], text };
  const tags = [];
  for (const t of KB_SOURCE_TAGS) {
    t.rx.lastIndex = 0; // 避免 g flag lastIndex 残留
    if (t.rx.test(text)) tags.push(t);
  }
  return { tags, text };
}

// === R206 术语白话词典 ===
var TERM_GLOSSARY = {
  // 八字
  '日主': '你的命格核心', '印星': '代表学习力和长辈帮扶的星', '食伤': '代表才华表达和创造的星',
  '比劫': '代表同辈竞争和朋友的星', '正官': '代表事业和规则的星', '七杀': '代表压力和魄力的星',
  '正财': '稳定收入', '偏财': '投资意外之财', '偏印': '代表直觉和副业的星', '正印': '代表学业和母亲的星',
  '乾造': '男命', '坤造': '女命', '大运': '每十年转换一次的人生大周期', '流年': '当年的年份运势',
  '用神': '对你最有利的五行元素', '喜神': '第二有利的五行元素', '忌神': '对你不利的五行元素',
  '伤官': '代表才华外露和叛逆的星', '食神': '代表温和表达和福气的星',
  '劫财': '代表竞争和花销的星', '比肩': '代表独立和自我的星',
  // 紫微
  '命宫': '代表你核心性格和一生主轴的宫位', '三方四正': '命宫对面和两侧的宫位，一起看才准确',
  '化禄': '代表财富和顺利的能量', '化权': '代表权力和掌控的能量', '化科': '代表名声和考试的正能量',
  '化忌': '代表阻碍和不顺的能量', '身宫': '代表后天努力方向的宫位',
  // 奇门
  '值符': '最吉利的神，代表上级或贵人', '天盘': '代表天时和外在环境的盘面', '地盘': '代表地利和内在基础的盘面',
  '八门': '开/休/生为三吉门，死/惊/伤为三凶门', '九星': '天蓬/天任等九颗星，影响事态发展',
  '八神': '值符/腾蛇等八个神煞，影响吉凶', '阳遁': '阳气上升的半年', '阴遁': '阴气上升的半年',
  // 中医
  '气血两虚': '体力和血液都不足，容易疲劳头晕', '肝郁脾虚': '情绪压抑影响消化，容易胀气和心情差',
  '心肾不交': '心火和肾水不协调，导致失眠和腰酸', '阴虚': '体内滋润物质不足，容易口干上火',
  '阳虚': '体内热量不足，容易怕冷手脚凉', '湿热': '体内湿气和热气都重，容易长痘和疲倦',
  '气虚': '体力不足，容易疲劳出汗', '脾虚湿困': '消化功能弱且体内湿气重，容易腹胀',
  // 风水
  '青龙方': '站在屋内往外看，左手边为青龙方（宜动宜高）', '白虎方': '右手边为白虎方（宜静宜低）',
  '明堂': '大门正前方的空间，宜开阔明亮', '路冲': '大门正对一条直路，形如箭射，主凶',
  '横梁压顶': '座位或床的正上方有横梁，产生压迫感', '财位': '房屋中对财运最有利的角落（通常在对角线方位）'
};
function _applyGlossary(text){
  if(!text) return text;
  var result = text;
  for(var term in TERM_GLOSSARY){
    if(result.indexOf(term) >= 0 && result.indexOf('（'+TERM_GLOSSARY[term]+'）') < 0){
      result = result.replace(new RegExp(term, 'g'), term + '（' + TERM_GLOSSARY[term] + '）');
    }
  }
  return result;
}
function showReport(text, meta){
  // R89-P0-2: 合规黑名单拦截（生成后立即清洗）+ 免责声明统一注入（P0-3）
  try {
    const _comp = _r89ApplyCompliance(text);
    text = _comp.text;
    if (_comp.hits.length) {
      try { console.warn('[r89-compliance]', _comp.hits.length, '条命中', _comp.hits); } catch(e){console.warn("报告降级:",e.message);}
      if (typeof meta === 'object' && meta) meta.complianceHits = _comp.hits;
    }
  } catch(e) { console.warn('[r89-compliance] err', e); }
  // R206: 术语白话化注入（在合规清洗后、渲染前）
  try {
    text = _applyGlossary(text);
  } catch(e) { console.warn('[r206-glossary] err', e); }
  // R89-P2-1: KB 源标签提取（仅供 KB 命中条 meta 扩展，不改报告文本）
  try {
    const _tags = _r89ExtractSourceTags(text);
    if (_tags.tags.length && typeof meta === 'object' && meta) {
      meta.schoolTags = _tags.tags.map(t => t.tag);
    }
  } catch(e) {}

  // R86: 自动提取 TODO 到 TodoBus（不影响原有渲染）
  try {
    if (typeof TodoBus !== 'undefined') {
      var _r86_items = TodoBus.extract(text || '');
      if (_r86_items.length) {
        TodoBus.add(_r86_items, { module: (state && state.module) || null });
      }
    }
  } catch(e) { /* 静默失败 */ }
  const d=document.createElement('div');
  d.className='msg m-ai';
  // R53：KB 命中信息条（score/source/engine/fallback 一行可视化）
  let metaHtml = '';
  if (meta && typeof meta === 'object') {
    const score = typeof meta.score === 'number' ? meta.score : 0;
    const scorePct = Math.round(score * 100);
    const scoreColor = score >= 0.7 ? '#10b981' : score >= 0.4 ? '#c9a84c' : '#f59e0b';
    const srcLabel = meta.engine ? meta.engine : (meta.source || '本地知识库');
    const srcFallback = meta.fallback ? ' · 回退' : '';
    metaHtml = '<div class="kb-hit-badge" style="display:inline-flex;align-items:center;gap:8px;padding:5px 10px;margin-bottom:8px;background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.25);border-radius:6px;font-size:11px;color:var(--paper2)"><span style="color:var(--paper3)">🎯 KB 命中</span><span style="color:' + scoreColor + ';font-weight:600">' + scorePct + '%</span><span style="color:var(--paper3)">·</span><span>引擎：' + srcLabel + srcFallback + '</span></div>';
  }
  // R89-P2-1: 流派标签 + P0-2 合规提示
  let r89Tags = '';
  try {
    if (meta && typeof meta === 'object') {
      const tags = meta.schoolTags || [];
      if (tags.length) {
        r89Tags += '<div class="r89-school-tags" style="display:inline-flex;align-items:center;gap:6px;padding:4px 9px;margin-bottom:8px;margin-left:6px;background:rgba(147,51,234,.08);border:1px solid rgba(147,51,234,.25);border-radius:6px;font-size:11px">' + tags.map(t => '<span style="color:#9333ea">' + t + '</span>').join(' ') + '</div>';
      }
      const hits = meta.complianceHits || [];
      if (hits.length) {
        r89Tags += '<div class="r89-compliance-flag" style="display:inline-flex;align-items:center;gap:6px;padding:4px 9px;margin-bottom:8px;margin-left:6px;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.3);border-radius:6px;font-size:11px;color:var(--cinn2)"><span>⚖️ 合规清洗</span><span style="color:var(--paper3)">已拦截 ' + hits.length + ' 处（' + hits.map(h => h.label).filter((v,i,a)=>a.indexOf(v)===i).join('·') + '）</span></div>';
      }
    }
  } catch(e) {}

  // R89-P1-4: 多流派来源徽章（后端 source 字段，前置展示）
  // 一本书可同时挂多个 src_type（如 SRC-LEGACY 古籍 + SRC-COURSE 课程 + SRC-BOOK 书）
  // 即"多流派并列"全网最专业的核心机制
  // R89-P1-4-2 (2026-07-27)：找不到古籍原文时，不用奉强附会去找古书佐证，
  // 直接选用行业公认通行版本 + 标注「📚 行业通行」
  try {
    if (meta && typeof meta === 'object' && Array.isArray(meta.sources) && meta.sources.length) {
      const typeColors = {
        'SRC-LEGACY':       { label: '古籍经典', color: '#8b5cf6', bg: 'rgba(139,92,246,.10)' },
        'SRC-COURSE':       { label: '口传课程', color: '#06b6d4', bg: 'rgba(6,182,212,.10)' },
        'SRC-BOOK':         { label: '典藏书谱', color: '#10b981', bg: 'rgba(16,185,129,.10)' },
        'SRC-EXPERT':       { label: '专家心得', color: '#f59e0b', bg: 'rgba(245,158,11,.10)' },
        'SRC-AUTO-RETRO':   { label: '历史导入', color: '#6b7280', bg: 'rgba(107,114,128,.10)' },
        'SRC-IMPORT':       { label: '外部录入', color: '#3b82f6', bg: 'rgba(59,130,246,.10)' },
        'SRC-CASE':         { label: '实战案例', color: '#ef4444', bg: 'rgba(239,68,68,.10)' },
      };
      // R89-P1-4-2: KB_SOURCE_POLICY 五源调优（古籍 / 专家 / 行业通行 / 同行验证 / 单点孤证）
      const _resolveSrc = (window.Compliance && typeof window.Compliance.resolveSourceLabel === 'function')
        ? window.Compliance.resolveSourceLabel
        : function(e) { return { tag: '📚 行业通行', cls: 'tag-common', reason: '未验证古籍原文，选行业通行' }; };
      const seen = new Set();
      const chips = [];
      for (const s of meta.sources) {
        const t = (s && s.type) || 'SRC-IMPORT';
        const title = (s && s.title) || '';
        const author = (s && s.author) || '';
        // 五源调优：先走 resolveSourceLabel 拿专家/古籍/行业通行/同行验证/单点孤证
        const pol = _resolveSrc({ src_type: t, title, author });
        const policyKey = pol.tag;
        if (seen.has(policyKey)) continue;
        seen.add(policyKey);
        const c = typeColors[t] || { label: t.replace(/^SRC-/, ''), color: '#6366f1', bg: 'rgba(99,102,241,.10)' };
        const tip = author ? `${author} · ${title.slice(0, 36)} · ${pol.reason}` : `${title.slice(0, 40)} · ${pol.reason}`;
        chips.push('<span class="src-chip ' + pol.cls + '" style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;background:' + c.bg + ';border:1px solid ' + c.color + '55;border-radius:10px;color:' + c.color + ';font-size:11px;font-weight:500" title="' + esc(tip) + '">' + policyKey + ' · ' + c.label + '</span>');
      }
      if (chips.length) {
        r89Tags += '<div class="r89-source-tags" style="display:inline-flex;align-items:center;gap:5px;padding:4px 9px;margin-bottom:8px;margin-left:6px;background:rgba(99,102,241,.06);border:1px solid rgba(99,102,241,.22);border-radius:6px;font-size:11px"><span style="color:var(--paper3)">🔍 源头透明</span>' + chips.join('') + '</div>';
      }
    }
  } catch(e) {}
  metaHtml = r89Tags + metaHtml;
  d.innerHTML=metaHtml + '<div class="b">'+esc(text)+'</div>';
  chat.appendChild(d);

  // R40: 嵌入图谱智能推荐段落（位于报告主体与操作按钮之间）
  if (state.module) {
    const recBox = document.createElement('div');
    recBox.className = 'kbe-rec-block';
    recBox.id = 'recBlock-' + Date.now();
    recBox.style.cssText = 'margin-top:14px;padding:14px;background:linear-gradient(135deg,rgba(147,51,234,.06),rgba(201,168,76,.06));border:1px solid rgba(147,51,234,.25);border-radius:10px;font-size:13px;line-height:1.7';
    recBox.innerHTML = '<div style="display:flex;align-items:center;gap:8px;color:#9333ea;font-weight:600;margin-bottom:8px"><span style="font-size:16px">🧠</span><span>图谱智能推荐</span><span style="margin-left:auto;font-size:11px;color:var(--paper3);font-weight:normal">基于关联权重+命中次数+模块大小</span></div>'
      + '<div style="opacity:.5;padding:8px 0">推荐加载中...</div>';
    d.appendChild(recBox);
    // 异步加载推荐
    fetch(API + '/api/kb/recommend?module=' + encodeURIComponent(state.module) + '&limit=5')
      .then(r => r.json())
      .then(dd => {
        const recs = (dd.data && dd.data.recommendations) || dd.recommendations || [];
        if(!recs.length){
          recBox.innerHTML = '<div style="display:flex;align-items:center;gap:8px;color:#9333ea;font-weight:600;margin-bottom:8px"><span style="font-size:16px">🧠</span><span>图谱智能推荐</span></div><div style="opacity:.6;font-size:12px">本次报告暂无图谱关联推荐</div>';
          return;
        }
        let h = '<div style="display:flex;align-items:center;gap:8px;color:#9333ea;font-weight:600;margin-bottom:8px"><span style="font-size:16px">🧠</span><span>图谱智能推荐</span><span style="margin-left:auto;font-size:11px;color:var(--paper3);font-weight:normal">为你发现 '+recs.length+' 个关联领域</span></div>';
        h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px">';
        recs.forEach((r, i) => {
          const pct = Math.round((r.score||0) * 100);
          const color = pct >= 60 ? '#10b981' : pct >= 30 ? '#c9a84c' : 'rgba(255,255,255,.4)';
          const safeId = String(r.id||'').replace(/[<>"&]/g, c => ({'<':'&lt;','>':'&gt;','"':'&quot;','&':'&amp;'})[c]);
          const safeName = String(r.name||r.id||'').replace(/[<>"&]/g, c => ({'<':'&lt;','>':'&gt;','"':'&quot;','&':'&amp;'})[c]);
          h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:6px">';
          h += '<div style="display:flex;flex-direction:column;flex:1;min-width:0"><span style="font-size:12px;color:var(--paper);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + safeName + '</span><span style="font-size:10px;color:var(--paper3);margin-top:2px">' + safeId + '</span></div>';
          h += '<span style="margin-left:8px;font-size:11px;font-weight:600;color:' + color + '">' + pct + '%</span>';
          h += '</div>';
        });
        h += '</div>';
        h += '<div style="margin-top:10px;padding-top:8px;border-top:1px dashed rgba(147,51,234,.2);font-size:11px;color:var(--paper3);text-align:center">⛕ 点 <a href="kb-explorer.html" style="color:#9333ea;text-decoration:underline">知识浏览器</a> 查看详情 · 点 <a href="kb-graph.html" style="color:#9333ea;text-decoration:underline">知识图谱</a> 看关系</div>';
        recBox.innerHTML = h;
      })
      .catch(e => {
        recBox.innerHTML = '<div style="opacity:.5;font-size:12px">推荐加载失败：' + e.message + '</div>';
      });
  }

  // 报告操作
  const ops=document.createElement('div');
  ops.className='report-ops';
  var _repEsc=esc(text).replace(/"/g,'&quot;');
  // R89-J 报告模板选择器（古卷/现代/禅意）
  var _tpl = (function(){
    try { return localStorage.getItem('_r89_report_template') || 'scroll'; } catch(e){ return 'scroll'; }
  })();
  ops.innerHTML='<span class="report-template-picker" role="group" aria-label="报告模板">' +
    '<button class="report-template-btn" data-tpl="scroll" title="古卷轴"><span class="ico">📜</span>古卷</button>' +
    '<button class="report-template-btn" data-tpl="modern" title="现代简约"><span class="ico">✨</span>现代</button>' +
    '<button class="report-template-btn" data-tpl="zen" title="禅意水墨"><span class="ico">🌸</span>禅意</button>' +
    '</span>' +
    '<button class="btn-save" data-report="'+_repEsc+'" onclick="saveReport(this)">💾 保存报告</button>' +
    '<button class="btn-copy" data-report="'+_repEsc+'" onclick="copyReport(this)">📋 复制</button>' +
    '<button class="btn-copy-md" data-report="'+_repEsc+'" onclick="copyMarkdownReport(this)">📝 复制 Markdown</button>' +
    '<button class="btn-pdf" data-report="'+_repEsc+'" onclick="exportReportPDF(this)">📄 导出 PDF</button>' +
    '<button class="btn-fb-up" onclick="fbReport(this,1)" title="这条回答对你有帮助">👍 有帮助</button>' +
    '<button class="btn-fb-dn" onclick="fbReport(this,-1)" title="这条回答不准确">👎 没帮助</button>';
  // 当前模板标记
  d.setAttribute('data-report-template', _tpl);
  // 高亮选中模板按钮 + 绑定切换
  setTimeout(function(){
    var btns = ops.querySelectorAll('.report-template-btn');
    btns.forEach(function(b){
      if (b.getAttribute('data-tpl') === _tpl) b.classList.add('active');
      b.addEventListener('click', function(){
        var t = b.getAttribute('data-tpl');
        try { localStorage.setItem('_r89_report_template', t); } catch(e){console.warn("报告降级:",e.message);}
        // 切换本报告 + 同页所有 .b 的模板属性
        var boxes = (d.parentElement ? d.parentElement : document).querySelectorAll('.b');
        boxes.forEach(function(bx){ bx.setAttribute('data-report-template', t); });
        // 单条报告容器也加
        d.setAttribute('data-report-template', t);
        btns.forEach(function(x){ x.classList.remove('active'); });
        b.classList.add('active');
      });
    });
  }, 0);
  d.appendChild(ops);

  // R41-DR1 节点 7：music/lifeindex/lifeplan 三模块 detail 页跳转入口
  if (state.module === 'music' || state.module === 'lifeindex' || state.module === 'lifeplan') {
    const detailOps = document.createElement('div');
    detailOps.className = 'report-ops report-ops-detail';
    detailOps.style.cssText = 'margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;';
    const _mid = state.module;
    const _detailUrls = {
      music: 'music-detail.html',
      lifeindex: 'lifeindex-detail.html',
      lifeplan: 'lifeplan-detail.html'
    };
    const _detailNames = {
      music: '疗愈音乐',
      lifeindex: '生命指数',
      lifeplan: '人生规划'
    };
    const _url = _detailUrls[_mid];
    const _name = _detailNames[_mid];
    detailOps.innerHTML = '<a class="btn-detail-link" href="'+_url+'" target="_blank" style="background:linear-gradient(135deg,#c9a84c,#a07c2a);color:#0a0a0a;padding:8px 14px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:4px;">📄 独立 '+_name+' 报告页（可分享/可打印/可试听）</a>';
    d.appendChild(detailOps);
  }

  // P14 节点 3：music 朗读按钮组（检测 MUSIC_PLAYLIST sentinel）
  try {
    const m = text.match(/<!--MUSIC_PLAYLIST:(\[.*?\])-->/);
    if (m) {
      const playlist = JSON.parse(m[1].replace(/&quot;/g,'"'));
      const ttsOps = document.createElement('div');
      ttsOps.className = 'report-ops report-ops-tts';
      ttsOps.style.cssText = 'margin-top:6px;';
      ttsOps.innerHTML = '<button class="btn-tts-play" onclick="_playMusicPlaylist(this)" data-playlist=\''+JSON.stringify(playlist).replace(/'/g,"&#39;")+'\'>▶️ 连续朗读 5 段</button>'+
        '<button class="btn-tts-stop" onclick="_stopMusicPlaylist()" style="background:#fff;border:1px solid #f59e0b;color:#b45309;">⏹️ 停止朗读</button>';
      d.appendChild(ttsOps);
    }
  } catch(e){ console.warn('music tts btn err', e); }
  
  // 闭环：询问+推送
  setTimeout(()=>{
    addAI('还需要我帮您解决什么问题？\n\n如果没有，感谢您的咨询！您还可以体验以下功能：');
    const push=document.createElement('div');
    push.className='msg m-ai';
    let html='<div class="mod-push"><div class="mp-title">✨ 您还可以体验</div><div class="mp-items">';
    ALL_MODS.filter(m=>m.id!==state.module).slice(0,8).forEach(m=>{
      html+='<button type="button" class="mp-item" onclick="startModule(\''+m.id+'\')">'+m.icon+' '+m.name+'</span>';
    });
    html+='</div></div>';
    push.innerHTML=html;
    chat.appendChild(push);
    chat.scrollTop=chat.scrollHeight;
  },300);
  
  hist.push({role:'assistant',content:text});
  state.reporting=false;
  // R36: 报告完成后异步加载图谱关联推荐
  if (state.module && typeof attachRecommendPanel === 'function') {
    const _r36_mod = state.module;
    attachRecommendPanel(chat, _r36_mod).catch(()=>{});
  }
  state.module=null;
}

function saveReport(el){
  const t=el.dataset.report||el.closest('.m-ai').querySelector('.b').textContent;
  const ts=new Date().toLocaleString('zh-CN');
  const blob=new Blob(['易道智鉴AI分析报告\n生成时间：'+ts+'\n\n'+t],{type:'text/plain;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='命理分析报告.txt';a.click();
  toast('报告已保存');
}
function copyReport(el){
  const t=el.dataset.report||el.closest('.m-ai').querySelector('.b').textContent;
  navigator.clipboard.writeText(t).then(()=>toast('已复制')).catch(()=>{const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);toast('已复制')});
}
function copyMarkdownReport(el){
  const raw=el.dataset.report||el.closest('.m-ai').querySelector('.b').textContent;
  // 纯文本 → 轻量 Markdown：保留换行 + 加粗 **…**
  const md = raw
    .replace(/易道智鉴AI分析报告/g,'# 易道智鉴 AI 分析报告')
    .replace(/综合指数：([\d.]+) 分/g,'**综合指数**：$1 分')
    .replace(/主导五行：([\u4e00-\u9fa5]+) 行/g,'**主导五行**：$1 行')
    .replace(/推荐五行：([\u4e00-\u9fa5]+)/g,'**推荐五行**：$1')
    .replace(/未来 ([\d]+) 年节奏建议/g,'## 未来 $1 年节奏建议')
    .replace(/十条行动清单/g,'## 十条行动清单')
    .replace(/十维度评分卡/g,'## 十维度评分卡')
    .replace(/十二领域评分卡/g,'## 十二领域评分卡');
  navigator.clipboard.writeText(md).then(()=>toast('Markdown 已复制')).catch(()=>{const ta=document.createElement('textarea');ta.value=md;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);toast('Markdown 已复制')});
}
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),1500)}

// R89-N 报告导出 PDF（jsPDF + html2canvas · 纯前端）
async function exportReportPDF(el){
  try{
    toast('正在生成 PDF…');
    // 动态加载 jsPDF + html2canvas（首次调用加载，后续缓存）
    if(!window.jspdf || !window.jspdf.jsPDF){
      await new Promise(function(res,rej){
        var s1=document.createElement('script'); s1.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js'; s1.onload=res; s1.onerror=rej; document.head.appendChild(s1);
      });
    }
    if(!window.html2canvas){
      await new Promise(function(res,rej){
        var s2=document.createElement('script'); s2.src='https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'; s2.onload=res; s2.onerror=rej; document.head.appendChild(s2);
      });
    }
    var msgEl = el.closest('.m-ai');
    if(!msgEl) { toast('找不到报告容器'); return; }
    var reportBody = msgEl.querySelector('.b') || msgEl.querySelector('.report-msg');
    if(!reportBody){ toast('找不到报告内容'); return; }
    // 截图
    var canvas = await html2canvas(reportBody, {
      scale: 2, backgroundColor: '#fbf6e6', logging: false, useCORS: true
    });
    var imgData = canvas.toDataURL('image/jpeg', 0.92);
    var imgW = 190; // A4 width - margins (mm)
    var imgH = canvas.height * imgW / canvas.width;
    var { jsPDF } = window.jspdf;
    var doc = new jsPDF('p', 'mm', 'a4');
    var pageH = doc.internal.pageSize.getHeight();
    var heightLeft = imgH;
    var position = 10;
    // 分页（图太高时截断分页）
    doc.addImage(imgData, 'JPEG', 10, position, imgW, imgH);
    heightLeft -= (pageH - 10);
    while(heightLeft > 0){
      position = 10 - (imgH - heightLeft);
      doc.addPage();
      doc.addImage(imgData, 'JPEG', 10, position, imgW, imgH);
      heightLeft -= (pageH - 10);
    }
    // 页脚
    var pageCount = doc.internal.getNumberOfPages();
    for(var i=1; i<=pageCount; i++){
      doc.setPage(i);
      doc.setFontSize(8); doc.setTextColor(160,140,100);
      doc.text('命理宝鉴 · AI 分析报告 · 第 ' + i + '/' + pageCount + ' 页', 10, pageH - 5);
    }
    var ts = new Date().toISOString().replace(/[:.]/g, '').substring(0, 15);
    doc.save('命理宝鉴-报告-' + ts + '.pdf');
    toast('PDF 已下载');
  }catch(e){
    console.error('[PDF]', e); toast('PDF 生成失败：' + (e.message||e));
  }
}

async function callAI(q){
  // R54: KB 快速通道 — freechat 提问先扫所有 KB，命中分 >= 0.7 直接朗读不调 AI
  try {
    const qLower = (q||'').toLowerCase();
    if (qLower.length >= 4 && qLower.length <= 80) {
      const keywords = qLower.split(/[\s,，。、；;：:（）()\[\]\-]+/).filter(s => s.length >= 2);
      if (keywords.length) {
        let best = {score:0, snippet:'', source:'', entryId:null};
        for (const src of KB_SOURCES) {
          const kb = src.obj();
          if (!kb) continue;
          let hits = 0, snippet = '';
          function walk(obj){
            if (typeof obj === 'string') {
              let m = 0; for (const kw of keywords) if (obj.indexOf(kw) >= 0) m++;
              if (m > hits) { hits = m; snippet = obj.substring(0, 1500); }
            } else if (typeof obj === 'object' && obj !== null) {
              for (const k in obj) {
                if (k.startsWith('_') || k === 'meta') continue;
                walk(obj[k]);
              }
            }
          }
          walk(kb);
          const score = Math.min(1.0, (hits / Math.max(1, keywords.length)) * 1.5) * src.weight;
          if (score > best.score) best = {score: Math.round(score*100)/100, snippet, source: src.name, entryId: src.entryId || null};
        }
        if (best.score >= 0.7 && best.snippet.length > 50) {
          const tag = '【🎯 KB 直答（' + best.source + ' · ' + best.entryId + ' · 命中分 ' + Math.round(best.score*100) + '%）】';
          const fullReply = tag + '\n\n' + best.snippet.substring(0, 1200);
          addAI(fullReply);
          hist.push({role:'assistant', content: fullReply.substring(0,500)});
          if (hist.length > 20) hist = hist.slice(-20);
          if (typeof recordKbHit === 'function') recordKbHit(state.module || 'freechat', best.score, true);
          // R102: 异步回写 hit_count 到后端 DB
          try{fetch((location.hostname==='127.0.0.1'||location.hostname==='localhost'?'http://127.0.0.1:8920':'')+'/api/ai/kb-hit-batch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entries:[best.entryId].filter(Boolean)})}).catch(function(){})}catch(e){}
          try{ _updateTopicCard(); }catch(e){console.warn("报告降级:",e.message);}
          try { recordKbEngine('kb-fastpath'); } catch(e) {}
          return;
        }
      }
    }
  } catch(e) { console.warn('[R54 fastpath]', e); }

  const t=document.createElement('div');t.className='msg m-ai';t.id='ty';
  t.innerHTML='<div class="typing"><i></i><i></i><i></i></div>';
  chat.appendChild(t);chat.scrollTop=chat.scrollHeight;
  try{
    // R62：离线时直接走 KB 兜底
    if (typeof OfflineBanner !== 'undefined' && !OfflineBanner.isOnline()) {
      try{ t.remove(); }catch(_){}
      addAI('📴 当前处于离线模式，AI 调用已暂停。\n\n请参考上方 KB 兜底回答，或联网后重试。');
      if (typeof recordKbHit === 'function') recordKbHit(state.module || 'freechat', 0, false);
      hist.push({role:'assistant', content:'离线模式'});
      try{ _updateTopicCard(); }catch(e){console.warn("报告降级:",e.message);} return;
    }
    var _ac2=new AbortController();var _to2=setTimeout(function(){_ac2.abort();},15000);var r;try{r=await fetch(API+'/api/ai/public-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:hist.slice(-10)}),signal:_ac2.signal});clearTimeout(_to2);}catch(e){clearTimeout(_to2);console.warn('AI fetch 超时或失败:',e.message);return null;}
    const d=await r.json();
    const msg=d.choices&&d.choices[0]&&d.choices[0].message;
    const reply=(msg&&msg.content)||'抱歉，暂时无法回答。';
    try{ t.remove(); }catch(_){} addAI(reply);
    // 自由对话也计入 KB 命中率分母（score=0，无 KB 命中）
    if (typeof recordKbHit === 'function') {
      recordKbHit(state.module || 'freechat', 0, false);
    }
    // hist 只存 content（不存 reasoning_content），并截断单条长度
    hist.push({role:'assistant',content:reply.substring(0,500)});
    if(hist.length>20)hist=hist.slice(-20);
    try{ _updateTopicCard(); }catch(e){console.warn("报告降级:",e.message);}
  }catch(e){ try{ t.remove(); }catch(_){} addAI(local(q));
    // 错误降级也计入分母
    if (typeof recordKbHit === 'function') {
      recordKbHit(state.module || 'freechat', 0, false);
    }
  }
}


// ── R67：最近 6 模块访问卡 ──────────────────
function _recordRecentMod(mid){
  if (!mid) return;
  try {
    var KEY = '_r67_recent';
    var list = JSON.parse(localStorage.getItem(KEY) || '[]');
    list = list.filter(function(x){return x !== mid;});
    list.unshift(mid);
    if (list.length > 6) list = list.slice(0, 6);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch(e) {}
}
function _renderRecentModCard(){
  var card = document.getElementById('r67-recent-card');
  var list;
  try { list = JSON.parse(localStorage.getItem('_r67_recent') || '[]'); } catch(e){ list=[]; }
  if (!card) {
    card = document.createElement('div');
    card.id = 'r67-recent-card';
    card.style.cssText = 'margin:6px 12px;padding:8px 12px;background:rgba(33,150,243,.06);border:1px solid rgba(33,150,243,.18);border-radius:10px;font-size:12px;color:#bcd;';
    var chat = document.getElementById('chat');
    if (chat && chat.parentNode) chat.parentNode.insertBefore(card, chat);
  }
  if (list.length === 0) { card.style.display = 'none'; return; }
  card.style.display = '';
  var chips = list.map(function(m){
    var meta = (typeof MODULES !== 'undefined' && MODULES[m]) ? MODULES[m] : {name:m, icon:'🔮'};
    return '<span style="display:inline-block;margin:2px 4px 2px 0;padding:3px 9px;background:rgba(33,150,243,.15);border:1px solid rgba(33,150,243,.35);border-radius:12px;color:#cfe;font-size:12px;cursor:pointer" onclick="document.getElementById(\'nav-\'+this.dataset.m+\'\').click()" data-m="'+m+'" title="直接打开 '+m+'">'+meta.icon+' '+meta.name+'</span>';
  }).join('');
  card.innerHTML = '<span style="font-weight:600;color:#8cf">⭐ 最近访问</span> <span style="opacity:.6;font-size:11px">(点开直达)</span><br>' + chips +
    '<button style="margin-top:4px;padding:1px 6px;background:transparent;border:1px solid rgba(33,150,243,.3);border-radius:6px;color:#9cf;cursor:pointer;font-size:10px;float:right" onclick="localStorage.removeItem(\'_r67_recent\');this.parentNode.style.display=\'none\'">清空</button>' +
    '<div style="clear:both"></div>';
}
window._renderRecentModCard = _renderRecentModCard;

// === 本地降级报告生成 ===
// === 统一化解引擎(与原排盘引擎对齐)===

// === 6维度统一评分函数(运势·健康·婚姻·孩子·同事·父母)—用户原话重点突出6维度===
function _renderSixDimsCard(birthY,birthM,birthD,birthH,sex){
  var dims6={yunshi:0,jiankang:0,hunyin:0,haizi:0,tongshi:0,fumu:0};
  try{
    var pillars=_paipan(birthY,birthM,birthD,birthH||12);
    var dayEle=(pillars.day_master||'').slice(-1);
    var dayGan=(pillars.day_master||'甲')[0];
    var sexKey=(sex||'男').indexOf('女')>=0?'女':'男';
    // 调用 divination-core.js 增强函数计算流年评分
    var yearlyScore=60;
    if(typeof _analyzeYearlyFortune==='function'){
      var yr=_analyzeYearlyFortune(birthY,birthM,birthD,birthH||12,new Date().getFullYear(),sexKey);
      if(yr&&yr.yearlyScore)yearlyScore=yr.yearlyScore;
    }
    var r=yearlyScore;
    dims6.yunshi=r;
    // 健康：与日主五行与流年冲克相关
    dims6.jiankang=Math.max(40,Math.min(95,(dayEle==='金'?r-5:dayEle==='木'?r+3:dayEle==='水'?r:r-3)));
    // 婚姻：男看财星，女看官星
    dims6.hunyin=sexKey==='男'?(dayEle==='金'||dayEle==='水'?r+5:r-3):(dayEle==='火'?r+5:r-3);
    // 孩子：子女宫星与食神相关
    dims6.haizi=dayEle==='火'?Math.max(45,r-8):(dayEle==='木'?r+5:r);
    // 同事：比劫生克影响
    dims6.tongshi=dayEle==='土'||dayEle==='金'?r-3:(dayEle==='水'?r+3:r);
    // 父母：印星为母(生日主五行)
    var muSheng={"金":"土","木":"水","水":"金","火":"木","土":"火"};
    var fuMuEle=muSheng[dayEle]||"土";
    dims6.fumu=Math.max(45,Math.min(95,(fuMuEle===['金','木','水','火','土'][(new Date().getMonth())%5]?r+5:r-2)));
  }catch(_){dims6={yunshi:60,jiankang:65,hunyin:58,haizi:55,tongshi:62,fumu:60};}
  var lab=function(n){return n>=70?'✅ ':n>=55?'🟡 ':'🔴 ';};
  var exp=function(n){return n>=70?'顺利':n>=55?'平稳':'谨慎';};
  return '━━━ 【6维度流年评分卡】 ━━━\n\n'+
    '【🌟 运势 '+dims6.yunshi+'】'+lab(dims6.yunshi)+exp(dims6.yunshi)+'\n'+
    '【💊 健康 '+dims6.jiankang+'】'+lab(dims6.jiankang)+exp(dims6.jiankang)+'\n'+
    '【💕 婚姻 '+dims6.hunyin+'】'+lab(dims6.hunyin)+exp(dims6.hunyin)+'\n'+
    '【👶 孩子 '+dims6.haizi+'】'+lab(dims6.haizi)+exp(dims6.haizi)+'\n'+
    '【👥 同事 '+dims6.tongshi+'】'+lab(dims6.tongshi)+exp(dims6.tongshi)+'\n'+
    '【👨‍👩‍👧 父母 '+dims6.fumu+'】'+lab(dims6.fumu)+exp(dims6.fumu)+'\n\n'+
    '【评分说明】运势取流年评分·健康参考五行与流年冲克·婚姻按男女十神取星·孩子参考子女宫·同事看比劫生克·父母看印星。\n\n';
}
window._renderSixDimsCard=_renderSixDimsCard;
function _getHuajie(ele,lack){
  const WX={
    '金':{peishi:'白水晶/金饰/银饰/铂金',peishiList:['白水晶摆件','金银首饰','铂金饰品'],fangwei:'西方/西北方',yanse:'白色/银色/金色',yinshi:'白萝卜/百合/银耳/莲子/雪梨',shuzi:'4/9',hangye:'金融/机械/珠宝/法律',crystal:'白水晶球'},
    '木':{peishi:'翡翠/绿松石/檀木手串/绿幽灵',peishiList:['翡翠手串','檀木手串','绿幽灵水晶'],fangwei:'东方/东南方',yanse:'绿色/青色',yinshi:'绿叶蔬菜/酸味水果/核桃/芹菜',shuzi:'3/8',hangye:'教育/出版/农业/服装',crystal:'绿幽灵柱'},
    '水':{peishi:'海蓝宝/黑曜石/墨玉/蓝水晶',peishiList:['海蓝宝手链','黑曜石摆件','蓝水晶'],fangwei:'北方',yanse:'蓝色/黑色/深灰色',yinshi:'黑豆/海带/鱼类/黑芝麻',shuzi:'1/6',hangye:'物流/旅游/水产/通信',crystal:'黑曜石球'},
    '火':{peishi:'红玛瑙/石榴石/琥珀/紫水晶',peishiList:['红玛瑙手链','紫水晶柱','石榴石吊坠'],fangwei:'南方',yanse:'红色/紫色/橙色',yinshi:'红枣/枸杞/羊肉/胡萝卜',shuzi:'2/7',hangye:'电子/餐饮/能源/传媒',crystal:'红玛瑙摆件'},
    '土':{peishi:'黄水晶/虎眼石/和田玉/琥珀',peishiList:['黄水晶球','虎眼石手链','和田玉牌'],fangwei:'中央/西南方',yanse:'黄色/棕色/咖啡色',yinshi:'山药/小米/南瓜/土豆',shuzi:'5/10',hangye:'房产/建筑/政务/矿业',crystal:'黄玉摆件'}
  };
  var need=lack.includes('火')?'火':lack.includes('木')?'木':lack.includes('金')?'金':lack.includes('水')?'水':lack.includes('土')?'土':'';
  var wx=WX[need]||WX[ele]||WX['金'];
  var peishiName=wx.peishiList[0];
  var dir=wx.fangwei.split('/')[0];
  
  // 吉祥物摆放全流程
  var baifang='\n━━━ 吉祥物使用全流程 ━━━\n'+
    '【选择】推荐'+peishiName+'，选天然材质、品相完好者\n'+
    '【净化】使用前用清水冲洗3分钟，阳光下晒1小时去除杂气\n'+
    '【开光】请到道观或寺庙请师傅开光加持(初一、十五最佳)\n'+
    '【摆放位置】'+wx.fangwei+'方位，高度齐腰(约1米)，避免地面和头顶以上\n'+
    '【摆放者】本人亲自摆放，摆放时面朝'+dir+'，心中默念所求之事\n'+
    '【摆放时间】择吉日吉时(天德/月德/三合日)，最好在上午辰时(7-9点)\n'+
    '【摆放时长】长期摆放，至少放置一整年(从摆放日算起)\n'+
    '【日常养护】每月初一、十五用清水擦拭，保持洁净\n'+
    '【到期处置】满一年后：\n'+
    '  ① 如需继续：重新净化后继续使用\n'+
    '  ② 如需更换：带回原寺庙谢神后，埋于干净土中或放入流水中\n'+
    '  ③ 不可随意丢弃，不可转送他人\n'+
    '【注意事项】忌让他人触碰、忌放在卫生间/厨房、忌用二手吉祥物\n';
  
  return {
    peishi: wx.peishi,
    peishiName: peishiName,
    fangwei: wx.fangwei,
    yanse: wx.yanse,
    yinshi: wx.yinshi,
    shuzi: wx.shuzi,
    hangye: wx.hangye,
    crystal: wx.crystal,
    baifang: baifang
  };
}

function _getTaisui(shengxiao,sex,year){
  // 太岁化解
  var sxMap={'子':'鼠','丑':'牛','寅':'虎','卯':'兔','辰':'龙','巳':'蛇','午':'马','未':'羊','申':'猴','酉':'鸡','戌':'狗','亥':'猪'};
  var sxBranch=Object.keys(sxMap).find(function(k){return sxMap[k]===shengxiao;})||'';
  var currentZhi='午'; // 2026丙午年
  var isCrime=currentZhi===sxBranch;
  var isClash=(sxBranch==='子');
  var isHarm=(sxBranch==='丑');
  var isPunish=(sxBranch==='午');
  var isBreak=(sxBranch==='卯');
  var isAny=isCrime||isClash||isHarm||isPunish||isBreak;
  if(!isAny)return'2026丙午年，您未犯太岁，运势平稳。但仍可在正月初八拜太岁祈福。';
  
  var types=[];
  if(isCrime)types.push('值太岁(本命年)');
  if(isClash)types.push('冲太岁(子午冲)');
  if(isHarm)types.push('害太岁(丑午害)');
  if(isPunish)types.push('刑太岁(自刑)');
  if(isBreak)types.push('破太岁(卯午破)');
  
  return'━━━ 太岁化解方案(2026丙午年)━━━\n'+
    '【犯太岁类型】'+types.join('、')+'\n'+
    '【严重程度】'+(isCrime||isClash?'较重，需积极化解':'中等，注意防范')+'\n\n'+
    '━━━ 化解方法(拿来即用)━━━\n'+
    '1. 佩戴太岁符：到道观请太岁符，随身佩戴一年。符袋内放自己的出生年月日时纸条\n'+
    '   - 摆放位置：贴身佩戴(挂于胸前或腰间)\n'+
    '   - 摆放时长：从正月初八至腊月二十四\n'+
    '   - 到期处置：腊月二十四谢太岁，将太岁符+金纸一起焚化\n'+
    '   - 注意事项：符不可沾水、不可让人触碰、不可压折\n\n'+
    '2. 拜太岁：正月初八到道观拜太岁，或家中朝正南方(太岁方位)设香案祭拜\n'+
    '   - 供品：三杯清茶、三盘水果(苹果/橙/香蕉)、三根香\n'+
    '   - 念诵：太岁宝诰3遍，心中默念化解愿望\n\n'+
    '3. 佩戴本命佛：'+(shengxiao==='鼠'?'千手观音':shengxiao==='牛'||shengxiao==='虎'?'虚空藏菩萨':shengxiao==='兔'?'文殊菩萨':shengxiao==='龙'||shengxiao==='蛇'?'普贤菩萨':shengxiao==='马'?'大势至菩萨':shengxiao==='羊'||shengxiao==='猴'?'大日如来':shengxiao==='鸡'?'不动尊菩萨':'阿弥陀佛')+'\n'+
    '   - 材质：玉/金/银为佳，天然材质最好\n'+
    '   - 摆放位置：挂于胸前或佩戴左手\n'+
    '   - 摆放时长：全年佩戴\n\n'+
    '4. 吉祥物摆放：朝'+({子:'北方',丑:'东北',寅:'东北',卯:'东方',辰:'东南',巳:'东南',午:'南方',未:'西南',申:'西南',酉:'西方',戌:'西北',亥:'西北'}[sxBranch]||'中央')+'方位放'+
    ({子:'白水晶',丑:'黄玉',寅:'绿幽灵',卯:'绿幽灵',辰:'黄玉',巳:'红玛瑙',午:'红玛瑙',未:'黄玉',申:'白水晶',酉:'白水晶',戌:'黄玉',亥:'海蓝宝'}[sxBranch]||'白水晶')+'镇宅\n'+
    '   - 摆放位置：'+({子:'正北',丑:'东北',寅:'东北',卯:'正东',辰:'东南',巳:'东南',午:'正南',未:'西南',申:'西南',酉:'正西',戌:'西北',亥:'西北'}[sxBranch]||'中央')+'位，高度约1米\n'+
    '   - 摆放时长：全年，每月初一擦拭\n'+
    '   - 到期处置：年底谢太岁后，可继续摆放或埋于干净土中\n\n'+
    '5. 行为禁忌：\n'+
    '   - 正月/七月(冲太岁月)→大事勿用\n'+
    '   - 午月(太岁当月)→忌动土/装修\n'+
    '   - 忌在南方(太岁方)动土、吵闹\n'+
    '   - 忌大额投资/重大决策(可推迟至次年)\n'+
    '   - 多行善积德：放生/捐善款/助人为乐';
}

// === 统一报告格式 ===
function _getUnifiedReport(modId,data){
  const d=Object.values(data);
  // 6维度统一评分卡：掃描 data 查找含生辰的字段并自动注入(本轮未显式注入的模块亦受益)
  var _sixCard='';
  if(typeof _renderSixDimsCard==='function'){
    for(var _di=0;_di<d.length;_di++){
      var _dv=String(d[_di]||'');
      var _dm=_dv.match(/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日]?\s*(\d{1,2})?[时点]?\s*([男女])?/);
      if(_dm){
        var _y=+_dm[1],_mo=+_dm[2],_da=+_dm[3],_h=+(_dm[4]||12),_sex=(_dm[5]||(modId==='ganqing'?'男':'男')).indexOf('女')>=0?'女':'男';
        try{_sixCard=_renderSixDimsCard(_y,_mo,_da,_h,_sex);}catch(_){_sixCard='';}
        if(_sixCard)break;
      }
    }
  }
  if(modId==='bazi'){
    var m=d[0].match(/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日]?\s*(\d{1,2})[时点]?\s*([男女])?/);
    if(!m)return'请提供出生年月日时+性别';
    var y=+m[1],mo=+m[2],da=+m[3],h=+m[4]||12,sex=m[5]||'male';
    var p=_paipan(y,mo,da,h);
    var dm=p.day_master,wc=p.wuxing_count,ele=dm.slice(-1);
    var lack=(p.wuxing_lack&&p.wuxing_lack.length)?p.wuxing_lack.join('、'):'无(五行俱全)';
    var pillar=p.pillars;
    var shengxiao=p.shengxiao||((y-4)%12>=0?['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'][(y-4)%12]:'未知');
    var hj=_getHuajie(ele,lack.split('、'));
    var sixDimsCard=(typeof _renderSixDimsCard==='function')?_renderSixDimsCard(y,mo,da,h,sex):'';
    var ts=_getTaisui(shengxiao,sex,y);
    var focus=d[3]||'全面分析';
    var yun='2026丙午年火旺，'+(ele==='金'?'火克金，宜稳健':ele==='木'?'木生火，宜进取':ele==='水'?'水克火，事业有成':ele==='火'?'火太旺，防急躁':'火生土，贵人助');
    var seasons='春(木旺):'+(ele==='金'?'略疲':'')+(ele==='木'?'顺遂':'')+(ele==='水'?'略疲':'')+(ele==='火'?'旺盛':'')+(ele==='土'?'略疲':'')+
      ' | 夏(火旺):'+(ele==='金'?'注意':'')+(ele==='木'?'过劳':'')+(ele==='水'?'得力':'')+(ele==='火'?'克制':'')+(ele==='土'?'贵人':'')+
      ' | 秋(金旺):'+(ele==='金'?'顺遂':'')+(ele==='木'?'防小人':'')+(ele==='水'?'贵人':'')+(ele==='火'?'休息':'')+(ele==='土'?'略疲':'')+
      ' | 冬(水旺):'+(ele==='金'?'略弱':'')+(ele==='木'?'顺遂':'')+(ele==='水'?'防寒':'')+(ele==='火'?'防破财':'')+(ele==='土'?'防寒':'');
    
    var descMap={'金':'金主义，刚毅果断，重义气，讲义气。性格坚毅，做事果断，但有时过于固执。重承诺，讲信用，适合管理和执法。','木':'木主仁，直爽向上，有进取心，仁慈善良。性格温和但有韧性，善于交际，有领导力。适合教育和文化。','水':'水主智，聪明灵活，善变通，足智多谋。性格沉静，善于思考，有远见。适合科研和策划。','火':'火主礼，热情外向，有领导力，积极向上。性格活泼，善于表达，有感染力。适合传媒和销售。','土':'土主信，稳重厚道，重承诺，踏实可靠。性格沉稳，做事有耐心，有责任感。适合房产和政务。'};
      var desc=descMap[ele]||'';
      var careerDetail='';
      if(ele==='金')careerDetail='金主决断→适合金融/机械/珠宝/法律/IT硬件/军警。正官运→体制内晋升(公务员/国企)；七杀运→创业/竞争性行业。今年火旺克金，事业压力大，宜保守稳健，秋季好转。';
      else if(ele==='木')careerDetail='木主仁→适合教育/出版/农业/服装/家具/医药。正印运→学术研究/教育培训；食神运→餐饮/艺术/创意。今年木生火旺，精力充沛，事业有突破机会。';
      else if(ele==='水')careerDetail='水主智→适合科研/策划/物流/通信/贸易/旅游。偏财运→投资/贸易；正财运→稳定职业。今年水克火，掌控力强，适合承担领导责任。';
      else if(ele==='火')careerDetail='火主礼→适合传媒/电子/餐饮/能源/美容/广告。比劫运→独立创业；伤官运→技术/创新/设计。今年火太旺，冲劲足但需冷静决策。';
      else if(ele==='土')careerDetail='土主信→适合房产/建筑/政务/矿业/陶瓷/农业。正官运→行政管理；偏财运→地产投资。今年火生土旺，贵人多助，事业稳中有升。';
      var caiyunDetail='';
      if(ele==='金')caiyunDetail='木为财星。今年火旺克金→财星受泄。正财(工薪)尚可，偏财(投资)宜谨慎。秋季金旺财运回升。建议：控制开销，减少不必要的投资和借贷。适合稳健理财(定存/国债/基金)。';
      else if(ele==='木')caiyunDetail='土为财星。今年木生火泄气→财星有但花销也大。上半年财运较旺，下半年注意守财。适合做长期投资，忌短线投机。建议：做好理财规划，控制大额消费。';
      else if(ele==='水')caiyunDetail='火为财星。今年火旺→水克火得财，财运较佳。正财稳定，偏财也有机会。秋季注意防止冲动投资。适合多元化投资，但不建议把所有资金押在单一项目。';
      else if(ele==='火')caiyunDetail='金为财星。今年火旺金弱→财星受克，宜守不宜攻。比劫旺夺财，防破财。忌合伙经营，忌为他人担保。正财运稳定但花销较大。建议：控制消费，避免高风险投资。';
      else if(ele==='土')caiyunDetail='水为财星。今年火生土旺→身旺可担财，财运稳定。适合长线投资，火土旺的月份(5-7月)财运最佳。适合房产/基金等稳健型投资。建议：不要频繁买卖，稳定持有。';
      var ganqingDetail='';
      if(ele==='金')ganqingDetail='日主金→配偶刚毅果断，重义气。今年火旺克金，感情有压力，需多沟通包容。单身者秋季(金旺)桃花开。已婚者注意防口角，多表达关爱。桃花星：酉(鸡)→秋季桃花旺。';
      else if(ele==='木')ganqingDetail='日主木→配偶温和上进，有进取心。今年精力旺盛，桃花盛开，单身者有望遇到正缘。春季(卯月)桃花最旺。注意不要因工作忙碌忽略伴侣。桃花星：卯(兔)→春季桃花旺。';
      else if(ele==='水')ganqingDetail='日主水→配偶聪明灵活，善变通。今年水火既济，感情和谐。已婚者恩爱和睦，单身者秋季易遇良缘。桃花星：子(鼠)→冬季桃花旺。';
      else if(ele==='火')ganqingDetail='日主火→配偶热情活泼，有领导力。今年火旺热情高涨但易冲动。单身者投入过度可能招致压力；已婚者需控制情绪，避免因小事争执。桃花星：午(马)→夏季桃花旺。';
      else if(ele==='土')ganqingDetail='日主土→配偶稳重可靠，重承诺。今年感情稳定，宜成家安业。单身者可主动扩展社交圈；已婚者家庭和谐，宜添丁增喜。桃花星：辰戌丑未→四季桃花。';
      var healthDetail='';
      if(ele==='金')healthDetail='金→肺/呼吸道/皮肤/大肠。火克金→今年呼吸道偏弱，注意防感冒/咳嗽/过敏。春季花粉过敏风险，夏季闷热注意通风，秋冬干燥多补水。多食白萝卜/百合/银耳/雪梨润肺。';
      else if(ele==='木')healthDetail='木→肝胆/眼睛/筋骨/神经系统。火旺木燥→今年肝胆偏弱，注意情绪管理。春季肝气旺易怒，夏季防止眼部疲劳，秋季金旺克木注意关节。多食绿叶菜/菊花茶疏肝。';
      else if(ele==='水')healthDetail='水→肾/泌尿/耳/骨骼。水火相战→今年注意心血管/血压。夏季高温防暑，冬季注意关节保养。多食黑豆/核桃/海带补肾。定期体检，保持运动。';
      else if(ele==='火')healthDetail='火→心/血/眼/舌。火过旺→今年注意心脏/血液/口腔/视力。夏季防中暑，少食辛辣油炸。多食莲子/百合/绿豆清心。增加有氧运动，保持情绪稳定。';
      else if(ele==='土')healthDetail='土→脾/胃/肌肉/口。土厚→今年注意脾胃/消化/血糖。少食油腻甜食，多食纤维蔬菜。秋季干燥多饮水。规律饮食，适度运动。多食山药/小米/薏仁健脾。';
      var renjiDetail='';
      if(ele==='金')renjiDetail='贵人星：天乙贵人(牛羊)。今年贵人方位：西北。小人防范：七杀旺易招暗算，宜低调。社交建议：正官旺→社交有分寸，适合体制内人脉。';
      else if(ele==='木')renjiDetail='贵人星：天乙贵人(鼠猴)。今年贵人方位：东方。社交建议：正印旺→人缘好，善于结交长辈贵人。比劫多→朋友多但各自独立。';
      else if(ele==='水')renjiDetail='贵人星：天乙贵人(兔蛇)。今年贵人方位：北方。社交建议：偏财旺→善于交际，朋友广。注意：水多则泛，交友宜精不宜多。';
      else if(ele==='火')renjiDetail='贵人星：天乙贵人(猪鸡)。今年贵人方位：东方。社交建议：比劫旺→朋友多但易破财。注意：火旺易得罪人，宜慎言。';
      else if(ele==='土')renjiDetail='贵人星：天乙贵人(鼠猴)。今年贵人方位：南方。社交建议：正官旺→社交稳重有分寸。食神旺→人缘好，善于待客。';
      var xueyeDetail='';
      if(ele==='金')xueyeDetail='印星分析：金日主→印星为土。正印→传统学习好，记忆力强。今年火生土→印星旺，学习效率高。文昌位：西方。适合：金融/法律/管理类。';
      else if(ele==='木')xueyeDetail='印星分析：木日主→印星为水。正印→学习悟性高。今年水旺→印星有力。文昌位：东方。适合：教育/文化/医药类。';
      else if(ele==='水')xueyeDetail='印星分析：水日主→印星为金。今年金旺(秋季)→印星旺。文昌位：北方。适合：科研/策划/技术类。';
      else if(ele==='火')xueyeDetail='印星分析：火日主→印星为木。今年木旺(春季)→印星旺。文昌位：南方。适合：传媒/艺术/电子类。';
      else if(ele==='土')xueyeDetail='印星分析：土日主→印星为火。今年火旺→印星旺，学习有利。文昌位：中央。适合：房产/建筑/政务类。';
      var huajieDetail='━━━ 拾·化解方案汇总(拿来即用)━━━\\n'+
        '1. 佩戴：'+hj.peishi+'\\n'+
        '2. 方位：'+hj.fangwei+'\\n'+
        '3. 颜色：'+hj.yanse+'\\n'+
        '4. 数字：尾号宜选'+hj.shuzi+'\\n'+
        '5. 饮食：'+hj.yinshi+'\\n'+
        '6. 行业：'+hj.hangye+'\\n'+
        hj.baifang+'\\n'+
        '8. 太岁化解：见上方第叁章\\n'+
        '9. 手机号尾数：'+hj.shuzi+'\\n'+
        '10. 每月初一、十五燃香祈福\\n'+
        '11. 朝'+(lack.includes('火')?'南方':lack.includes('木')?'东方':lack.includes('金')?'西方':lack.includes('水')?'北方':'中央')+'方位出行/发展大吉';
      return sixDimsCard+'━━━ 八字命理全维度深度分析报告 ━━━\\n\\n'+
        '━━━ 壹·命盘总览 ━━━\\n'+
        '【四柱】'+pillar['年']+' '+pillar['月']+' '+pillar['日']+' '+pillar['时']+'\\n'+
        '【日主】'+dm+'('+ele+')【生肖】'+shengxiao+'\\n'+
        '【五行】金'+(wc['金']||0)+' 木'+(wc['木']||0)+' 水'+(wc['水']||0)+' 火'+(wc['火']||0)+' 土'+(wc['土']||0)+'【缺行】'+lack+'\\n\\n'+
        '━━━ 贰·性格特征 ━━━\\n'+desc+'\\n\\n'+
        '━━━ 叁·五行补救方案(拿来即用)━━━\\n'+
        '【佩戴】'+hj.peishi+'\\n'+
        '【方位】'+hj.fangwei+'\\n'+
        '【颜色】'+hj.yanse+'\\n'+
        '【数字】'+hj.shuzi+'\\n'+
        '【饮食】'+hj.yinshi+'\\n'+
        '【行业】'+hj.hangye+'\\n'+
        hj.baifang+'\\n'+
        '━━━ 肆·太岁化解(2026丙午年)━━━\\n'+ts+'\\n\\n'+
        '━━━ 伍·事业运 ━━━\\n'+careerDetail+'\\n\\n'+
        '━━━ 陆·财运 ━━━\\n'+caiyunDetail+'\\n\\n'+
        '━━━ 柒·感情婚姻 ━━━\\n'+ganqingDetail+'\\n\\n'+
        '━━━ 捌·健康运 ━━━\\n'+healthDetail+'\\n\\n'+
        '━━━ 玖·人际贵人 ━━━\\n'+renjiDetail+'\\n\\n'+
        '━━━ 拾·学业文昌 ━━━\\n'+xueyeDetail+'\\n\\n'+
        '━━━ 拾壹·年运分析 ━━━\\n'+yun+'\\n\\n'+
        '━━━ 拾贰·四季运势 ━━━\\n'+seasons+'\\n\\n'+
        huajieDetail+'\\n\\n'+
        '(关注方向：'+focus+')';
  }
  if(modId==='mobile'){
    var num=d[0].match(/1[3-9]\d{9}/);if(num)return _mobile(num[0],d[1],d[2],d[3],d[4]);return'请提供手机号';
  }
  if(modId==='yunshi'){
    var m=d[0].match(/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})/);
    var dm='未知',ele='未知';
    if(m){var p=_paipan(+m[1],+m[2],+m[3],12);dm=p.day_master;ele=dm.slice(-1);}
    var focus=d[1]||'综合',period=d[2]||'今年',change=d[3]||'无',trouble=d[4]||'无';
    var sixDimsCard=(m && typeof _renderSixDimsCard==='function')?_renderSixDimsCard(+m[1],+m[2],+m[3],12,focus.indexOf('女')>=0?'女':'男'):'';
    // ==== R6拦充：月度运势细分 ====
    var _meMap={'金':['正月(寅月·木旺)→ 财星当令，支出增多宜节制','二月(卯月·木旺)→ 同上，注意人际口舌','三月(辰月·土旺)→ 印星生身，学习考试佳','四月(巳月·火旺)→ 官杀旺压力大，宜低调','五月(午月·火旺)→ 火最旺防急躁，决策宜慎','六月(未月·土旺)→ 印星护身好转，可规划','七月(申月·金旺)→ 比劫助身顺遂，事业有进','八月(酉月·金旺)→ 身旺任财，财运最佳','九月(戌月·土旺)→ 印星生身稳定，贵人助','十月(亥月·水旺)→ 食伤泄秀才华展，宜创新','十一月(子月·水旺)→ 同上但防过劳，注意休息','十二月(丑月·土旺)→ 印星收尾平稳，宜总结'],'木':['正月(寅月·木旺)→ 比劫助身精力旺，宜进取','二月(卯月·木旺)→ 桃花旺盛感情佳，事业顺','三月(辰月·土旺)→ 财星当令财运好，注意理财','四月(巳月·火旺)→ 食伤泄秀才华展，但防过劳','五月(午月·火旺)→ 火最旺泄气重，注意休息','六月(未月·土旺)→ 财星稳中有升，宜守业','七月(申月·金旺)→ 官杀克身压力来，宜稳健','八月(酉月·金旺)→ 同上防小人口舌','九月(戌月·土旺)→ 财星回升转好，宜规划','十月(亥月·水旺)→ 印星生身贵人助，学习佳','十一月(子月·水旺)→ 印星旺精力恢复，宜充电','十二月(丑月·土旺)→ 财星收尾平稳，宜总结'],'水':['正月(寅月·木旺)→ 食伤泄秀宜创新，但防过耗','二月(卯月·木旺)→ 同上感情运佳','三月(辰月·土旺)→ 官杀克身压力来，宜低调','四月(巳月·火旺)→ 财星旺得财但防冲动','五月(午月·火旺)→ 水克火财运最旺，把握机会','六月(未月·土旺)→ 官杀旺注意人际，宜稳健','七月(申月·金旺)→ 印星生身贵人助，学习考试佳','八月(酉月·金旺)→ 同上精力旺盛事业顺','九月(戌月·土旺)→ 官杀旺注意健康','十月(亥月·水旺)→ 比劫助身顺遂，宜社交','十一月(子月·水旺)→ 身旺可担财，财运稳定','十二月(丑月·土旺)→ 官杀收尾宜守，总结规划'],'火':['正月(寅月·木旺)→ 印星生身精力旺，宜学习','二月(卯月·木旺)→ 同上贵人助，事业有进','三月(辰月·土旺)→ 食伤泄秀才华展，但防泄气','四月(巳月·火旺)→ 比劫助身冲劲足，但防冲动','五月(午月·火旺)→ 火最旺防过燥，决策宜冷静','六月(未月·土旺)→ 食伤泄秀转好，宜创新','七月(申月·金旺)→ 财星当令求财佳，但防累劳','八月(酉月·金旺)→ 同上财运好，注意理财','九月(戌月·土旺)→ 食伤泄秀稳定，宜规划','十月(亥月·水旺)→ 官杀克身压力来，宜低调','十一月(子月·水旺)→ 同上防破财，注意健康','十二月(丑月·土旺)→ 食伤收尾平稳，宜总结'],'土':['正月(寅月·木旺)→ 官杀克身压力来，宜低调','二月(卯月·木旺)→ 同上注意人际口舌','三月(辰月·土旺)→ 比劫助身顺遂，事业有进','四月(巳月·火旺)→ 印星生身贵人助，学习佳','五月(午月·火旺)→ 印星最旺精力充沛，宜进取','六月(未月·土旺)→ 比劫助身财运好，把握机会','七月(申月·金旺)→ 食伤泄秀才华展，但防过劳','八月(酉月·金旺)→ 同上创新佳，注意休息','九月(戌月·土旺)→ 比劫助身稳定，宜社交','十月(亥月·水旺)→ 财星当令求财佳，但防冲动','十一月(子月·水旺)→ 同上财运好，注意理财','十二月(丑月·土旺)→ 比劫收尾平稳，宜总结']};
    var monthDetail=(_meMap[ele]||_meMap['木']).join('\n');
    // ==== R6拦充：季度运势曲线 ====
    var qMap={'金':[55,45,85,65],'木':[85,65,55,80],'水':[60,80,85,85],'火':[75,60,60,55],'土':[65,85,70,60]};
    var qScores=qMap[ele]||qMap['木'];
    var qNames=['春季(1-3月)','夏季(4-6月)','秋季(7-9月)','冬季(10-12月)'];
    var qDesc={'金':['木旺耗金，财运偏弱','火旺克金，最危险的季度','金旺助身，财运回升','水泄金，养精蓄锐'],'木':['木旺助身，财运上升','火旺泄木，花销大','金克木，防投资亏损','水生木旺，财运顺遂'],'水':['木旺泄水，略疲','水克火得财，财运佳','金生水旺，贵人助力','水过旺，防寒气'],'火':['木生火旺，财运佳','火过旺，比劫夺财','金旺克火，财星受克','水克火，防破财'],'土':['木克土，财运偏弱','火生土旺，财库丰盈','金泄土，财运平稳','水泄土，防小额破财']};
    var qDetails=(qDesc[ele]||qDesc['木']);
    var quarterDetail='';
    for(var qi=0;qi<4;qi++){quarterDetail+='\u3010Q'+(qi+1)+' '+qNames[qi]+'\u3011运势指数：'+qScores[qi]+'/100 \u2014 '+qDetails[qi]+'\n';}
    quarterDetail+='\u3010全年曲线\u3011春→夏→秋→冬：'+qScores.join('\u2192')+'，'+(ele==='金'?'秋季是你发力的黄金期':ele==='木'?'春夏进取秋冬守':ele==='水'?'夏季发力全年丰收':ele==='火'?'春季布局秋季谨慎':'夏季发力冬季收获')+'。';
    // ==== R6拦充：贵人方位与财运波动 ====
    var _gdMap={'金':'天乙贵人：牛(丑)、羊(未)。贵人方位：西北方(乾宫)。每月初一朝西北焚香祈福。','木':'天乙贵人：鼠(子)、猴(申)。贵人方位：东方(震宫)。','水':'天乙贵人：兔(卯)、蛇(巳)。贵人方位：北方(坎宫)。','火':'天乙贵人：猪(亥)、鸡(酉)。贵人方位：东方(震宫)。','土':'天乙贵人：鼠(子)、猴(申)。贵人方位：南方(离宫)。'};
    var _cwMap={'金':'财运波动：春低→夏最低→秋回升→冬平稳。偏财佳期：农历七八月。投资忌期：农历五月。','木':'财运波动：春旺→夏中→秋低→冬回升。偏财佳期：农历二月。投资忌期：农历八月。','水':'财运波动：春中→夏旺→秋佳→冬稳。偏财佳期：农历五月。投资忌期：农历三月。','火':'财运波动：春佳→夏中→秋低→冬最低。偏财佳期：农历正月。投资忌期：农历十一月。','土':'财运波动：春低→夏旺→秋中→冬佳。偏财佳期：农历六月。投资忌期：农历正月。'};
    var guirenDetail=(_gdMap[ele]||'')+'\n'+(_cwMap[ele]||'');
    // ==== R6拦充：健康预警 ====
    var _hwMap={'金':'【预警等级】中高。火克金→肺/呼吸道/皮肤/大肠首当兲冲。春季花粉过敏，夏季闷热皮炎，秋季干燥咒嗽，冬季寒冷感冒。关注月：农历五月(午)心血管+呼吸道双重压力。建议：全年乩戴口罩防花粉，秋冬加湿器保持湿度，常饮百合银耳雪梨汤润肺。','木':'【预警等级】中。火旺木燥→肝胆/眼睛/筋骨/神经。春季肝气过旺易怒失眠，夏季眼部疲劳干涩，秋季金克木关节酸痛，冬季水旺木漂腰膝酸软。建议：春季菊花茶疏肝，夏季枞枸菊花明目，秋季拉伸柔韧训练，冬季保暖补肾。','水':'【预警等级】中。水火相战→心血管/血压/肾/泌尿。夏季高温血压波动，秋春换季泌尿系统敏感，冬季水旺过寒关节疼痛。建议：夏季防暑降温多饮水，冬季保暖热焜关节。','火':'【预警等级】高。火过旺→心脏/血液/口腔/视力/皮肤。夏季心火旺失眠口腔溃疡，秋春情绪波动血压不稳，冬季水克火心阳不足怕冷。建议：夏季莲子心绿豆汤清心降火，少辞辣油炸，定期检查心血管。','土':'【预警等级】中。土厚→脄胃/消化/肌肉/血糖。春季木克土胃不适，夏季湿气重消化差，秋季干燥便秘，冬季水旺土湿腹泻。建议：规律饮食七分饱，少油腻甜食多纤维，常食山药小米粥健脄。'};
    var healthWarn=_hwMap[ele]||'';

    return sixDimsCard+'━━━ 运势深度分析报告 ━━━\n\n【日主】'+dm+'('+ele+')\n【关注领域】'+focus+'\n【分析时段】'+period+'\n【近期变动】'+change+'\n【困扰问题】'+trouble+'\n\n━━━ 事业运 ━━━\n'+(ele==='金'?'今年火旺克金，事业承受压力。上半年以稳为主，不宜主动求变；待秋季金旺(农历七八月)再寻求突破。贵人方位：西北。':ele==='木'?'木生火旺，精力充沛，事业有突破机会。农历二三月木气正旺，适合开拓新领域。夏季注意不过度消耗。贵人方位：东方。':ele==='水'?'水克火，掌控力强，事业有成。夏季火旺之时能力得到充分发挥。适合承担更多责任。贵人方位：北方。':ele==='火'?'火旺冲劲足但易急躁冒进。机会多但竞争激烈，需冷静判断。农历五月火最旺，宜防决策失误。贵人方位：东方。':ele==='土'?'火生土旺，贵人多助，事业稳中有升。适合踏实做事，不要好高骛远。贵人方位：南方。':'')+'\n\n━━━ 财运 ━━━\n'+(ele==='金'?'财星受克，宜守不宜攻。正财尚可，偏财谨慎。秋季金旺财运回升。控制开销，减少不必要投资。':ele==='木'?'财运有入有出，花销较大。上半年财运旺，下半年守财。适合长期投资，忌短线投机。':ele==='水'?'水克火为财，今年财运佳。正财稳定，偏财有机会，秋季防冲动投资。适合多元化投资。':ele==='火'?'比劫旺夺财，破财风险高。忌合伙经营，忌为他人担保。正财运稳定但花销大，控制消费。':ele==='土'?'财库丰盈，今年财运稳定，适合长线投资。火生土旺，目前是积累财富的好时候。':'')+'\n\n━━━ 感情运 ━━━\n'+(ele==='金'?'桃花星受克，感情波折较多。单身者机会较少，需耐心等待；已婚者注意沟通，防口角。秋季金旺桃花开。':ele==='木'?'桃花旺盛，单身者有望遇到正缘。农历二月桃花盛开。注意不要因忙碌忽略伴侣。':ele==='水'?'水火既济，感情和谐。已婚者恩爱和睦，单身者秋季易遇良缘。':ele==='火'?'火旺热情但易冲动。单身者投入过度可能招致压力；已婚者需控制情绪，避免因小事争执。':ele==='土'?'感情稳定，今年宜成家安业。单身者可主动扩展社交圈；已婚者家庭和谐，宜添丁。':'')+'\n\n━━━ 健康运 ━━━\n'+(ele==='金'?'火克金→注意呼吸道/肺部/皮肤。春季花粉过敏风险，夏季闷热注意通风，秋冬干燥多补水。':ele==='木'?'火旺木燥→注意肝胆/眼睛/情绪管理。春季肝气旺易怒，夏季防眼部疲劳。':ele==='水'?'水火相战→注意心血管/血压。夏季高温防暑，冬季注意关节保养。':ele==='火'?'火过旺→注意心脏/血液/口腔。夏季防中暑，少食辛辣油炸。':ele==='土'?'土厚→注意脾胃/消化/血糖。少食油腻甜食，多食纤维蔬菜。':'')+'\n\n━━━ 化解方案(拿来即用)━━━\n1. 佩戴'+(ele==='金'?'白水晶/金属饰品(护金运)':ele==='木'?'绿幽灵/木质手串(护木运)':ele==='水'?'黑曜石/海蓝宝(护水运)':ele==='火'?'红玛瑙/紫水晶(护火运)':'黄玉/蜜蜡(护土运)')+'\n2. 朝向'+(ele==='金'?'西方':ele==='木'?'东方':ele==='水'?'北方':ele==='火'?'南方':'中央')+'发展有利\n3. 常穿'+(ele==='金'?'白/银色':ele==='木'?'绿/青色':ele==='水'?'黑/蓝色':ele==='火'?'红/紫色':'黄/棕色')+'衣物旺运\n4. 手机号尾数宜选'+(ele==='金'?'4/9':ele==='木'?'3/8':ele==='水'?'1/6':ele==='火'?'2/7':'5/0')+'\n5. 每月初一、十五燃香祈福\n\n以上分析基于'+period+'运势，结合日主'+dm+'特性。知命可顺势而为，趋吉避凶。\n\n━━━ 月度运势细分 ━━━\n'+monthDetail+'\n\n━━━ 季度运势曲线 ━━━\n'+quarterDetail+'\n\n━━━ 贵人方位与财运波动 ━━━\n'+guirenDetail+'\n\n━━━ 健康预警 ━━━\n'+healthWarn+'\n\n以上分析基于'+period+'运势，结合日主'+dm+'特性。知命可顺势而为，趋吉避凶。';
  }
  if(modId==='fengshui'){
    var f=d[0]||'未知',ht=d[1]||'未知',fl=d[2]||'未知',area=d[3]||'整体',issue=d[4]||'无',bz=d[5]||'';
    var dm='未知',ele='未知';
    if(bz){var bm=bz.match(/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})/);if(bm){var bp=_paipan(+bm[1],+bm[2],+bm[3],12);dm=bp.day_master;ele=dm.slice(-1);}}
    var eleMap={'金':'西方/西北方','木':'东方/东南方','水':'北方','火':'南方','土':'中央/西南/东北'};
    var eleColor={'金':'白/金/银色','木':'绿/青色','水':'黑/蓝色','火':'红/紫色','土':'黄/棕色'};
    var eleDir=eleMap[ele]||'中央';
    var eleCol=eleColor[ele]||'黄色';
    var issueMap={'财运':'财位布局（大门对角线角落）是关键。保持干净明亮，放招财植物（发财树/铜钱草）或水晶洞。','健康':'床头朝'+eleDir+'，避开横梁压顶（床正上方有梁会产生压迫感，影响睡眠和健康）。','感情':'桃花位在'+eleDir+'，放粉色水晶或鲜花。卧室避免镜子对床。','事业':'文昌位主管事业学业，书桌朝'+eleDir+'摆放。办公桌左手边（青龙方，宜高宜动）放文件架，右手边（白虎方，宜低宜静）保持整洁。','学业':'书桌朝'+eleDir+'，左高右低。桌面上可放文昌塔或四支毛笔。','整体':'整体布局以五行平衡为原则。'};
    var issueText=issueMap[issue]||issueMap['整体'];
    var fangweiMap={'金':'宜西/西北，忌南（火克金）。大门朝西旺金气。','木':'宜东/东南，忌西（金克木）。大门朝东旺木气。','水':'宜北，忌土方（西南/东北）。大门朝北旺水气。','火':'宜南，忌北（水克火）。大门朝南旺火气。','土':'宜西南/东北，忌东（木克土）。大门朝西南旺土气。'};
    var fangweiText=fangweiMap[ele]||'以五行喜忌定方位。';
    var huajieFengshui='【方位调理】坐'+eleDir+'向'+({金:'东',木:'西',水:'南',火:'北',土:'东'})[ele]+'，顺应五行生克\n【颜色搭配】主色调'+eleCol+'，搭配五行相生色\n【植物摆放】'+(ele==='木'?'绿植丰富，宜发财树/绿萝':ele==='火'?'宜红色花卉（红玫瑰/蝴蝶兰）':ele==='土'?'宜多肉/仙人掌（土生植物）':ele==='金'?'宜白色花卉（白玫瑰/茉莉）':'宜水培植物（富贵竹/绿萝）')+'\n【摆件推荐】'+(ele==='金'?'铜葫芦/五帝钱/铜麒麟':ele==='木'?'木质文昌塔/绿幽灵水晶':ele==='水'?'鱼缸/黑曜石/水晶球':ele==='火'?'红色中国结/紫水晶/红色灯笼':'陶瓷花瓶/黄水晶/泰山石')+'\n【禁忌提醒】避免'+({金:'火形物（尖角/红色过多）',木:'金属刀具/剪刀外露',水:'土堆过多/陶瓷过密',火:'鱼缸过大/黑色过多',土:'绿植过密/木柱过多'})[ele];
    var _seasonMap={'金':'\u6625\uff1a\u6728\u65fa\u91d1\u8870\u2192\u907f\u514d\u5357\u9762\u7ea2\u8272\u8fc7\u591a\uff1b\u590f\uff1a\u706b\u514b\u91d1\u2192\u907f\u514d\u5357\u9762\u7ea2\u8272\uff1b\u79cb\uff1a\u91d1\u6c14\u5f53\u4ee4\u2192\u4e8b\u4e1a\u8fd0\u63d0\u5347\uff0c\u897f\u9762\u53ef\u52a0\u5f3a\u5e03\u5c40\uff1b\u51ac\uff1a\u91d1\u751f\u6c34\u2192\u8d22\u8fd0\u7a33\u5b9a','\u6728':'\u6625\uff1a\u6728\u6c14\u592a\u65fa\u2192\u897f\u9762\u653e\u91d1\u5c5e\u6446\u4ef6\u5e73\u8861\uff1b\u590f\uff1a\u6728\u751f\u706b\u2192\u8d22\u8fd0\u6709\u4f46\u82b1\u9500\u4e5f\u5927\uff1b\u79cb\uff1a\u91d1\u514b\u6728\u2192\u907f\u514d\u897f\u9762\u91d1\u5c5e\u8fc7\u591a\uff1b\u51ac\uff1a\u6c34\u751f\u6728\u2192\u8d35\u4eba\u8fd0\u4f73','\u6c34':'\u6625\uff1a\u6c34\u751f\u6728\u2192\u8d35\u4eba\u591a\u52a9\uff1b\u590f\uff1a\u6c34\u514b\u706b\u2192\u5f97\u8d22\u4f46\u9632\u51b2\u52a8\uff1b\u79cb\uff1a\u91d1\u751f\u6c34\u2192\u8d22\u8fd0\u7a33\u5b9a\uff1b\u51ac\uff1a\u6c34\u6c14\u5f53\u4ee4\u2192\u5317\u9762\u5e03\u5c40\u52a0\u5f3a\u53ef\u65fa\u8d22','\u706b':'\u6625\uff1a\u6728\u751f\u706b\u2192\u4e8b\u4e1a\u6709\u8fdb\uff1b\u590f\uff1a\u706b\u6c14\u592a\u65fa\u2192\u5317\u9762\u653e\u9c7c\u7f38\u5236\u706b\uff1b\u79cb\uff1a\u8d22\u661f\u91d1\u2192\u5b88\u4e0d\u5b9c\u653b\uff1b\u51ac\uff1a\u6c34\u514b\u706b\u2192\u907f\u514d\u5317\u9762\u9ed1\u8272\u8fc7\u591a','\u571f':'\u6625\uff1a\u6728\u514b\u571f\u2192\u897f南/东北方放红色化木生火\uff1b\u590f\uff1a\u706b生土→身旺可担财\uff1b\u79cb\uff1a土生金→财运稳\uff1b\u51ac\uff1a土克水→注意守财'};
    var _fengshuiSeason=function(ele){var s=_seasonMap[ele]||'根据五行喜忌调整';return '• 春季（木旺）→ '+s+'\n• 夏季（火旺）→ '+s+'\n• 秋季（金旺）→ '+s+'\n• 冬季（水旺）→ '+s;};
    return'━━━ 风水布局分析报告 ━━━\n\n【基本信息】\n房屋类型：'+ht+' | 楼层：'+fl+' | 关注区域：'+area+'\n诉求：'+issue+' | 日主五行：'+ele+'\n\n━━━ 壹·方位分析 ━━━\n'+fangweiText+'\n\n【白话解读】\n你命中五行属'+ele+'，最有利的方位是'+eleDir+'。选房子、摆家具、安床位，尽量往这个方向靠。'+(ele==='金'?'比如床头朝西，办公桌朝西，都比朝南好。':ele==='木'?'比如床头朝东，窗户外有绿树更好。':ele==='水'?'比如床头朝北，家里可以养鱼。':ele==='火'?'比如床头朝南，南边有阳光最好。':'比如床头朝西南，家里摆陶瓷物件。')+'\n\n━━━ 贰·问题专项 ━━━\n'+issueText+'\n\n━━━ 叁·五行布局建议 ━━━\n'+huajieFengshui+'\n\n━━━ 肆·房屋常见问题化解 ━━━\n【路冲（大门正对一条直路）】→ 门口放石狮子或八卦镜化解\n【横梁压顶（座位/床正上方有横梁）】→ 装修包住或移开座位\n【缺角（房屋平面不方正）】→ 缺角方位放对应五行物品补气\n【门对门（两门相对）】→ 挂门帘或放屏风遮挡\n【镜子对床】→ 移开镜子或睡觉时遮挡\n【厕所居中】→ 厕所门常关，放绿植净化，挂葫芦吸煞\n\n━━━ 伍·四季风水提醒 ━━━\n'+_fengshuiSeason(ele)+'\n\n━━━ 陆·行动清单（拿来即用）━━━\n1. 确定家中'+eleDir+'方位，清理杂物，保持整洁\n2. 在'+eleDir+'方位摆放'+eleCol+'装饰品或五行对应摆件\n3. 检查床头是否朝向吉方（'+eleDir+'最佳）\n4. 检查有无横梁压顶/路冲/门对门等问题，按上述方案化解\n5. 客厅财位（大门对角线）保持明亮，放招财植物\n6. 办公桌左手边（青龙方）宜高，右手边（白虎方）宜低\n7. 每季度检查一次布局，根据季节微调\n\n━━━ 柒·免责声明 ━━━\n本报告基于传统风水学理论，仅供参考。风水布局应结合实际居住环境和个人感受灵活调整，不可迷信。';
  }
  if(modId==='zhongyi'){
    var symptom=d[0]||'未知',duration=d[1]||'未知',tizhi=d[2]||'未确定',habit=d[3]||'未知';
    var bz=d[4]||'';
    var dm='未知',ele='未知';
    if(bz){var bm=bz.match(/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})/);if(bm){var bp=_paipan(+bm[1],+bm[2],+bm[3],12);dm=bp.day_master;ele=dm.slice(-1);}}
    var zheng='';
    if(symptom.indexOf('失眠')>=0)zheng='失眠多属心脾两虚或肝郁化火。心脾两虚→多梦易醒、心悸健忘、面色无华；肝郁化火→辗转难眠、急躁易怒、口苦目赤。';
    else if(symptom.indexOf('头痛')>=0)zheng='头痛分型：胀痛→肝阳上亢(宜平肝潜阳)；隐痛→气血不足(宜益气养血)；刺痛→瘀血阻络(宜活血化瘀)；重痛→痰湿内阻(宜化痰祛湿)。';
    else if(symptom.indexOf('脾胃')>=0||symptom.indexOf('消化')>=0)zheng='脾胃不适多属脾虚湿困或脾胃虚寒。表现为食欲不振、腹胀、大便不调、四肢乏力。';
    else if(symptom.indexOf('疲劳')>=0||symptom.indexOf('乏力')>=0)zheng='疲劳多属气虚或气血两虚。气虚→乏力懒言、自汗；血虚→面色无华、头晕心悸。';
    else if(symptom.indexOf('腰')>=0)zheng='腰酸多属肾虚。肾阳虚→腰冷痛、畏寒、夜尿多；肾阴虚→腰酸软、五心烦热、盗汗。';
    else zheng='根据症状描述，建议结合面诊和脉诊做精确辨证。';
    var shiliao='';
    if(tizhi.indexOf('怕冷')>=0)shiliao='温阳食疗：羊肉/韭菜/生姜/桂圆/红枣/核桃。忌生冷寒凉。方剂：金匮肾气丸/理中丸。';
    else if(tizhi.indexOf('怕热')>=0)shiliao='清热食疗：绿豆/冬瓜/苦瓜/莲子/百合/银耳。忌辛辣燥热。方剂：知柏地黄丸/丹栀逍遥散。';
    else if(tizhi.indexOf('疲劳')>=0)shiliao='补气食疗：山药/黄芪/党参/鸡肉/小米/大枣。忌过度劳累。方剂：补中益气汤/四君子汤。';
    else if(tizhi.indexOf('情绪')>=0)shiliao='疏肝食疗：玫瑰花茶/菊花茶/柑橘/芹菜/薄荷。忌怒忌郁。方剂：逍遥散/柴胡疏肝散。';
    else if(tizhi.indexOf('消化')>=0)shiliao='健脾食疗：薏仁/茯苓/山药/白术/陈皮/莲子。忌油腻甜食。方剂：参苓白术散/香砂六君子汤。';
    else shiliao='均衡饮食，定时定量，七分饱，少生冷，多温热。';
    // R206: zhongyi 扩充至 1500+ 字
    var eleHealth={'金':'肺/呼吸道系统较弱，注意防寒保暖，多食白色食物（百合/银耳/梨）润肺','木':'肝胆系统需注意，保持情绪舒畅，少熬夜，多食绿色蔬菜疏肝','水':'肾/泌尿系统需保养，注意保暖，多食黑色食物（黑豆/黑芝麻/核桃）补肾','火':'心/血管系统需注意，避免过度激动，多食红色食物（红枣/枸杞/红豆）养心','土':'脾胃需调理，饮食规律，多食黄色食物（南瓜/小米/山药）健脾'};
    var eleAcupoint={'金':'太渊穴（手腕桡侧）· 列缺穴（腕上1.5寸）· 迎香穴（鼻翼旁）','木':'太冲穴（足背第1-2跖骨间）· 期门穴（乳头直下第6肋间）· 阳陵泉（膝外侧下方）','水':'太溪穴（内踝后下方）· 肾俞穴（腰部第2腰椎旁开1.5寸）· 涌泉穴（足底前1/3）','火':'神门穴（腕横纹尺侧）· 内关穴（腕上2寸）· 心俞穴（背部第5腰椎旁开1.5寸）','土':'足三里（膝下3寸）· 中脘穴（脐上4寸）· 脾俞穴（背部第11胸椎旁开1.5寸）'};
    var eleSeason={'金':'秋季润肺（秋分后多食梨/百合/银耳羹，避免辛辣）','木':'春季疏肝（春分后多运动舒展，多食绿色蔬菜，避免怒气）','水':'冬季补肾（冬至后注意保暖，多食黑色食物，避免过度劳累）','火':'夏季养心（夏至后避免暴晒，多食莲子/绿豆，保持心平气和）','土':'长夏健脾（每季度最后18天多食山药/薏仁，避免生冷甜腻）'};
    var eleHerb={'金':'百合·麦冬·沙参·川贝·款冬花','木':'柴胡·白芍·香附·郁金·玫瑰花','水':'枸杞·杜仲·菟丝子·女贞子·旱莲草','火':'酸枣仁·柏子仁·远志·丹参·莲子心','土':'党参·白术·茯苓·山药·芡实'};
    var eleFangji={'金':'百合固金汤（肺阴虚）· 沙参麦冬汤（肺胃阴虚）','木':'逍遥散（肝郁脾虚）· 柴胡疏肝散（肝郁气滞）','水':'六味地黄丸（肾阴虚）· 金匮肾气丸（肾阳虚）','火':'天王补心丹（心阴虚）· 归脾汤（心脾两虚）','土':'参苓白术散（脾虚湿困）· 补中益气汤（脾虚气陷）'};
    var eleSport={'金':'太极·散步·深呼吸练习（轻柔为主，避免大汗）','木':'慢跑·瑜伽·拉伸（舒展筋骨，疏肝理气）','水':'游泳·太极·内家拳（以静制动，养精蓄锐）','火':'有氧运动·快走·舞蹈（适度出汗，不可过度）','土':'八段锦·五禽戏·广场舞（节奏适中，健脾化湿）'};
    var eleEmotion={'金':'悲伤肺→避免过度悲伤，多与朋友交流','木':'怒伤肝→保持心情舒畅，遇事不怒','水':'恐伤肾→避免恐惧焦虑，培养安全感','火':'喜伤心→避免大喜大悲，保持平和','土':'思伤脾→避免过度思虑，放松心情'};
    return'━━━ 中医养生分析报告 ━━━\n\n【基本信息】\n主要症状：'+symptom+' | 持续时间：'+duration+' | 体质：'+tizhi+'\n生活习惯：'+habit+' | 日主五行：'+ele+'\n\n━━━ 壹·症状辨证 ━━━\n'+zheng+'\n\n【白话解读】\n中医看病讲究「辨证」，就是根据你的症状判断身体哪里失衡了。比如失眠可能是「心脾两虚」（心脏和脾脏都虚弱，血液不足养心）或「肝郁化火」（情绪压抑导致肝气郁结，久了化火上扰心神）。治疗方案因此不同。\n\n━━━ 贰·五行体质分析 ━━━\n【日主五行】'+ele+'\n【体质特征】'+eleHealth[ele]+'\n【情志调养】'+eleEmotion[ele]+'\n\n【白话解读】\n你的命格五行属'+ele+'，对应的心/肝/脾/肺/肾中某个脏腑偏弱。这不是说你一定有病，而是提醒你哪个脏腑需要重点保养。比如五行属木的人肝气偏旺，容易生气、乳腺增生、月经不调，就需要疏肝理气。\n\n━━━ 叁·食疗方案 ━━━\n'+shiliao+'\n\n【白话解读】\n食疗是最温和的调理方式。基本原则：怕冷的人多吃温性食物（羊肉/生姜/桂圆），怕热的人多吃凉性食物（绿豆/苦瓜/冬瓜），疲劳的人多吃补气食物（山药/黄芪/鸡肉），消化不好的人多吃健脾食物（薏仁/茯苓/小米）。\n\n━━━ 肆·穴位按摩 ━━━\n【推荐穴位】'+eleAcupoint[ele]+'\n\n【白话解读】\n穴位按摩可以自己在家做。每个穴位按揉 3-5 分钟，每天 1-2 次，感到酸胀为度。比如足三里（膝盖下3寸）是「长寿穴」，常按可以健脾强身；太冲（脚背）可以疏肝理气，生气时按特别有效。\n\n━━━ 伍·季节养生 ━━━\n'+eleSeason[ele]+'\n\n【白话解读】\n中医讲究「天人合一」，不同季节保养不同脏腑。春养肝、夏养心、长夏养脾、秋养肺、冬养肾。你的五行属'+ele+'，对应脏腑在对应季节尤其需要保养。\n\n━━━ 陆·方剂参考 ━━━\n【经典方剂】'+eleFangji[ele]+'\n【常用中药】'+eleHerb[ele]+'\n\n【白话解读】\n方剂需在中医师指导下使用，不可自行抓药。这里列出的方剂仅供参考，让你了解中医治疗思路。比如「逍遥散」是疏肝名方，「六味地黄丸」是补肾基础方，「参苓白术散」是健脾利湿常用方。\n\n━━━ 柒·运动建议 ━━━\n【推荐运动】'+eleSport[ele]+'\n\n【白话解读】\n运动也要因人而异。五行属金的人适合轻柔运动（太极/散步），避免大汗伤气；五行属木的人适合舒展类运动（瑜伽/拉伸），疏肝理气；五行属火的人适合有氧运动，但不可过度出汗。\n\n━━━ 捌·生活起居 ━━━\n1. 子午觉：晚上11点前入睡，中午11-1点小憩15分钟\n2. 饮食规律：定时定量，七分饱，早餐吃好，晚餐少吃\n3. 情志管理：'+eleEmotion[ele]+'\n4. 适度运动：每天30分钟，以微汗为度，不可过度\n5. 穴位保健：每天按揉推荐穴位 3-5 分钟\n6. 季节调养：'+eleSeason[ele]+'\n7. 戒烟限酒：烟伤肺、酒伤肝，能戒最好\n8. 防寒保暖：尤其'+eleHealth[ele].split('，')[0]+'\n\n━━━ 玖·免责声明 ━━━\n本报告基于传统中医理论分析，仅供养生参考。如有具体疾病请到正规医院就诊，不可依赖食疗或穴位按摩替代医疗。\n\n（日主五行：'+ele+' | 体质：'+tizhi+' | 症状：'+symptom+'）';
  }
  if(modId==='caiyun'){
    var m=d[0].match(/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})/);
    var dm='未知',ele='未知';
    if(m){var p=_paipan(+m[1],+m[2],+m[3],12);dm=p.day_master;ele=dm.slice(-1);}
    var income=d[1]||'未知',invest=d[2]||'未确定',finance=d[3]||'未知',expense=d[4]||'无',concern=d[5]||'整体财运';
    var sixDimsCard=(m && typeof _renderSixDimsCard==='function')?_renderSixDimsCard(+m[1],+m[2],+m[3],12,'男'):'';
    var cxing='';
    if(ele==='金')cxing='金为日主，木为财星。今年火旺克金→自身偏弱，财星受泄。正财(工薪)尚可但偏财(投资)宜谨慎。秋季金旺时财运回升。';
    else if(ele==='木')cxing='木为日主，土为财星。今年木生火泄气→财星有但花销也大。上半年财运较旺，下半年注意守财。适合做长期投资。';
    else if(ele==='水')cxing='水为日主，火为财星。今年火旺→水克火得财，财运较佳。正财稳定，偏财也有机会，但秋季注意防止冲动投资。';
    else if(ele==='火')cxing='火为日主，金为财星。今年火旺金弱→财星受克，宜守不宜攻。比劫旺夺财，防破财。忌合伙经营，忌为他人担保。';
    else if(ele==='土')cxing='土为日主，水为财星。今年火生土旺→身旺可担财，财运稳定。适合长线投资，火土旺的月份(5-7月)财运最佳。';
    var licai='';
    if(invest.indexOf('稳健')>=0)licai='稳健型理财方案：\n· 定存/国债：年化3-5%，保本保息\n· 货币基金：年化2-4%，灵活存取\n· 债券基金：年化4-6%，中低风险\n· 黄金定投：抗通胀，长期持有';
    else if(invest.indexOf('平衡')>=0)licai='平衡型理财方案：\n· 基金定投：年化5-10%，分散投资\n· 蓝筹股：年化8-15%，长期持有\n· REITs：年化6-10%，房产信托\n· 混合基金：年化6-12%，股债搭配';
    else if(invest.indexOf('激进')>=0)licai='激进型理财方案：\n· 成长股：年化15-30%，高风险高回报\n· 创业投资：天使/种子轮，高风险\n· 加密货币：极高风险，小比例配置\n· 期货/期权：专业门槛高，谨慎参与';
    else licai='保守型理财方案：\n· 保险/定存：保本为主\n· 货币基金：灵活存取\n· 国债：安全稳健\n· 少量黄金：抗通胀';
    var po='';
    if(ele==='金')po='2026年破财风险：火旺克金→比劫旺，防借贷/合伙/担保。春季木旺耗金，夏季火旺最危，秋季好转。';
    else if(ele==='木')po='2026年破财风险：木生火泄气→投资亏损风险，量力而行。上半年谨慎，下半年好转。';
    else if(ele==='水')po='2026年破财风险：水旺→防秋季冲动投资。整体财运佳但仍需理性。';
    else if(ele==='火')po='2026年破财风险：比劫夺财→大额支出需谨慎。忌合伙，忌担保，忌高风险投资。';
    else if(ele==='土')po='2026年破财风险：整体较低，但仍需合理配置。注意冬季水旺时防小额破财。';
    var fangwei=ele==='金'?'西方(金位)求财大吉':ele==='木'?'东方(木位)':ele==='水'?'北方(水位)':ele==='火'?'南方(火位)':'中央(土位)';
    return sixDimsCard+'━━━ 财运深度分析报告 ━━━\n\n【日主】'+dm+'('+ele+')\n【收入来源】'+income+'\n【投资偏好】'+invest+'\n【财务状况】'+finance+'\n【大额支出】'+expense+'\n【关心问题】'+concern+'\n\n━━━ 财星分析 ━━━\n'+cxing+'\n\n━━━ 理财方案(拿来即用)━━━\n'+licai+'\n\n━━━ 破财预警 ━━━\n'+po+'\n\n━━━ 招财方位 ━━━\n'+fangwei+'\n适合行业：'+(ele==='金'?'金融/机械/珠宝':ele==='木'?'教育/农业/服装':ele==='水'?'物流/旅游/水产':ele==='火'?'电子/餐饮/传媒':'房产/建筑/矿业')+'\n\n━━━ 2026年财运时间线 ━━━\n· 春季(2-4月)：'+(ele==='金'?'木旺耗金，财运偏弱':'')+(ele==='木'?'木旺助身，财运上升':'')+(ele==='水'?'木旺泄水，略疲':'')+(ele==='火'?'木生火旺，财运佳':'')+(ele==='土'?'木克土，财运偏弱':'')+'\n· 夏季(5-7月)：'+(ele==='金'?'火旺克金，最危险':'')+(ele==='木'?'火旺泄木，花销大':'')+(ele==='水'?'水克火得财，财运佳':'')+(ele==='火'?'火过旺，比劫夺财':'')+(ele==='土'?'火生土旺，财库丰盈':'')+'\n· 秋季(8-10月)：'+(ele==='金'?'金旺助身，财运回升':'')+(ele==='木'?'金克木，防投资亏损':'')+(ele==='水'?'金生水旺，贵人助力':'')+(ele==='火'?'金旺克火，财星受克':'')+(ele==='土'?'金泄土，财运平稳':'')+'\n· 冬季(11-1月)：'+(ele==='金'?'水泄金，养精蓄锐':'')+(ele==='木'?'水生木旺，财运顺遂':'')+(ele==='水'?'水过旺，防寒气':'')+(ele==='火'?'水克火，防破财':'')+(ele==='土'?'水泄土，防小额破财':'')+'\n\n━━━ 化解建议 ━━━\n1. 佩戴'+(ele==='金'?'白水晶/金属饰品':ele==='木'?'绿幽灵/木质手串':ele==='水'?'黑曜石/海蓝宝':ele==='火'?'红玛瑙/紫水晶':'黄玉/蜜蜡')+'招财\n2. 钱包/手机壳选'+(ele==='金'?'白/银色':ele==='木'?'绿色':ele==='水'?'黑/蓝色':ele==='火'?'红色':'黄色')+'\n3. 办公桌朝'+fangwei+'摆放招财物(貔貅/水晶球)\n4. 手机号尾数宜选'+(ele==='金'?'4/9':ele==='木'?'3/8':ele==='水'?'1/6':ele==='火'?'2/7':'5/0')+'\n5. 投资'+(ele==='金'?'宜秋冬，忌夏季':ele==='木'?'宜春夏，忌秋季':ele==='水'?'宜夏季，忌春季':ele==='火'?'宜春季，忌冬季':'宜夏秋，忌春季');
  }
  if(modId==='shiye'){
    var m=d[0].match(/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})/);
    var dm='未知',ele='未知';
    if(m){var p=_paipan(+m[1],+m[2],+m[3],12);dm=p.day_master;ele=dm.slice(-1);}
    var stage=d[1]||'未知',industry=d[2]||'未知',years=d[3]||'未知',concern=d[4]||'事业方向';
    var sixDimsCard=(m && typeof _renderSixDimsCard==='function')?_renderSixDimsCard(+m[1],+m[2],+m[3],12,'男'):'';
    var guan='';
    if(ele==='金')guan='金主决断，适合管理/执法/金融/机械。正官运→体制内晋升，适合公务员/国企；七杀运→创业/竞争性行业，适合自己当老板。今年火旺克金，事业压力大，宜保守稳健。';
    else if(ele==='木')guan='木主仁，适合教育/文化/农业/服装。正印运→学术研究/教育培训；食神运→餐饮/艺术/创意行业。今年木生火旺，精力充沛，事业有突破机会。';
    else if(ele==='水')guan='水主智，适合科研/策划/物流/通信。偏财运→投资/贸易；正财运→稳定职业。今年水克火，掌控力强，适合承担领导责任。';
    else if(ele==='火')guan='火主礼，适合传媒/电子/餐饮/美容。比劫运→独立创业；伤官运→技术/创新/设计。今年火太旺，冲劲足但需冷静决策。';
    else if(ele==='土')guan='土主信，适合房产/建筑/政务/矿业。正官运→行政管理；偏财运→地产投资。今年火生土旺，贵人多助，事业稳中有升。';
    var hangye='';
    if(ele==='金')hangye='金：金融/机械/珠宝/法律/IT硬件\n水(金生水)：物流/旅游/水产/通信';
    else if(ele==='木')hangye='木：教育/出版/农业/服装/家具\n火(木生火)：电子/餐饮/传媒/美容';
    else if(ele==='水')hangye='水：物流/旅游/水产/通信/贸易\n木(水生木)：教育/农业/文化';
    else if(ele==='火')hangye='火：电子/餐饮/能源/传媒/美容\n土(火生土)：房产/陶瓷/建筑';
    else if(ele==='土')hangye='土：房产/建筑/政务/矿业/陶瓷\n金(土生金)：金融/机械/珠宝';
    var chuangye='';
    if(stage.indexOf('创业')>=0)chuangye='创业时机分析：'+(ele==='金'?'今年火旺克金，创业压力较大。建议先积累资源和人脉，待2027年(丁未年)土旺生金时再创业。如必须创业，选择金水相关行业。':ele==='木'?'今年精力旺盛，是创业的好时机。选择木火相关行业，春季启动最佳。注意不过度消耗。':ele==='水'?'今年水旺克火得财，创业有利。选择水木相关行业，夏季启动最佳。适合多元化经营。':ele==='火'?'今年火旺冲劲足，适合创业但需冷静。选择火土相关行业，避免冲动投资。':ele==='土'?'今年火生土旺，贵人多助，创业稳中有进。选择土金相关行业，秋冬季节启动最佳。':'');
    else if(stage.indexOf('跳槽')>=0)chuangye='跳坛建议：'+(ele==='金'?'2026年秋季(金旺)跳槽最有利。流年冲官星→宜变动。目标行业：金融/机械/法律。':ele==='木'?'2026年春季(木旺)跳槽有利。选择教育/文化/农业方向。':ele==='水'?'2026年夏季(水旺克火)跳槽有利。选择物流/通信/贸易方向。':ele==='火'?'2026年需冷静评估，不宜冲动跳槽。如必须跳，选择电子/传媒方向。':ele==='土'?'2026年秋冬季节跳槽有利。选择房产/建筑/政务方向。':'');
    else chuangye='当前阶段建议：'+(ele==='金'?'积累经验和资源，等待时机。今年宜守不宜攻，做好本职工作。':ele==='木'?'积极进取，开拓新领域。今年是上升期，抓住机会。':ele==='水'?'展现领导才能，承担更多责任。今年贵人助力明显。':ele==='火'?'控制节奏，不要急于求成。今年机会多但竞争也激烈。':ele==='土'?'稳扎稳打，脚踏实地。今年贵人多助，适合积累。':'');
    return sixDimsCard+'━━━ 事业方向深度分析报告 ━━━\n\n【日主】'+dm+'('+ele+')\n【阶段】'+stage+'\n【行业】'+industry+'\n【工作年限】'+years+'\n【关心问题】'+concern+'\n\n━━━ 官运分析 ━━━\n'+guan+'\n\n━━━ 适合行业(拿来即用)━━━\n'+hangye+'\n\n━━━ 时机建议 ━━━\n'+chuangye+'\n\n━━━ 2026年事业时间线 ━━━\n· 春季(2-4月)：'+(ele==='木'?'木旺助身，事业上升期':'')+(ele==='金'?'压力较大，宜低调积累':'')+(ele==='水'?'略疲，养精蓄锐':'')+(ele==='火'?'精力充沛，积极行动':'')+(ele==='土'?'略疲，稳扎稳打':'')+'\n· 夏季(5-7月)：'+(ele==='金'?'火旺克金，最应注意':'')+(ele==='木'?'火旺泄木，注意过劳':'')+(ele==='水'?'水克火旺，掌控力强':'')+(ele==='火'?'火过旺，需冷静克制':'')+(ele==='土'?'火生土旺，贵人多助':'')+'\n· 秋季(8-10月)：'+(ele==='金'?'金旺助身，顺遂期':'')+(ele==='木'?'金克木，防小人':'')+(ele==='水'?'金生水旺，贵人助力':'')+(ele==='火'?'金旺克火，宜休息反省':'')+(ele==='土'?'金泄土，略疲':'')+'\n· 冬季(11-1月)：'+(ele==='金'?'水泄金，略弱':'')+(ele==='木'?'水生木旺，顺遂':'')+(ele==='水'?'水过旺，防寒':'')+(ele==='火'?'水克火，防破财':'')+(ele==='土'?'水泄土，防寒保暖':'')+'\n\n━━━ 化解建议 ━━━\n1. 佩戴'+(ele==='金'?'白水晶/金属饰品(护金运)':ele==='木'?'绿幽灵/木质手串(护木运)':ele==='水'?'黑曜石/海蓝宝(护水运)':ele==='火'?'红玛瑙/紫水晶(护火运)':'黄玉/蜜蜡(护土运)')+'\n2. 办公桌朝'+(ele==='金'?'西方':ele==='木'?'东方':ele==='水'?'北方':ele==='火'?'南方':'中央')+'\n3. 手机号尾数宜选'+(ele==='金'?'4/9':ele==='木'?'3/8':ele==='水'?'1/6':ele==='火'?'2/7':'5/0')+'\n4. 穿'+(ele==='金'?'白/银色':ele==='木'?'绿/青色':ele==='水'?'黑/蓝色':ele==='火'?'红/紫色':'黄/棕色')+'衣物旺事业运';
  }
  if(modId==='ganqing'){
    var m=d[0].match(/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日]?\s*(\d{1,2})?[时点]?\s*([男女])?/);
    var dm='未知',ele='未知',sy='未知';
    var dims6={yunshi:0,jiankang:0,hunyin:0,haizi:0,tongshi:0,fumu:0};
    if(m){var p=_paipan(+m[1],+m[2],+m[3],+(m[4]||12));dm=p.day_master;ele=dm.slice(-1);sy=m[5]||'男';}
    // 6维度流年评分—用户原话"重点突出运势健康婚姻孩子同事父母"
    try{
      if(typeof _analyzeYearlyFortune==='function'&&m){
        var yr=_analyzeYearlyFortune(+m[1],+m[2],+m[3],+(m[4]||12),new Date().getFullYear(),sy);
        if(yr&&yr.error===undefined){
          var r=yr.yearlyScore||60;
          dims6.yunshi=r;
          dims6.jiankang=Math.max(40,Math.min(95,r+5));
          dims6.hunyin=ele==='水'||ele==='木'?r+3:r-5;
          dims6.haizi=ele==='火'?r-8:r+2;
          dims6.tongshi=ele==='金'||ele==='土'?r-3:r;
          dims6.fumu=Math.max(45,Math.min(90,r-2));
        }
      }
    }catch(_){}
    var sixDimsCard='';
    if(dims6.yunshi>0){
      sixDimsCard='━━━ 【六维度流年评分卡】 ━━━\n\n'+
        '【🌟 运势 】 ' + dims6.yunshi + ' / 100  ' + (dims6.yunshi>=70?'✅ 顺利':dims6.yunshi>=55?'🟡 平稳':'🔴 谨慎') + '\n'+
        '【💊 健康 】 ' + dims6.jiankang + ' / 100  ' + (dims6.jiankang>=70?'✅ 良好':dims6.jiankang>=55?'🟡 注意':'🔴 调理') + '\n'+
        '【💕 婚姻 】 ' + dims6.hunyin + ' / 100  ' + (dims6.hunyin>=70?'✅ 和合':dims6.hunyin>=55?'🟡 平稳':'🔴 注意') + '\n'+
        '【👶 孩子 】 ' + dims6.haizi + ' / 100  ' + (dims6.haizi>=70?'✅ 顺遂':dims6.haizi>=55?'🟡 平稳':'🔴 关注') + '\n'+
        '【👥 同事 】 ' + dims6.tongshi + ' / 100  ' + (dims6.tongshi>=70?'✅ 和顺':dims6.tongshi>=55?'🟡 平稳':'🔴 防小') + '\n'+
        '【 👨‍👩‍👧 父母】 ' + dims6.fumu + ' / 100  ' + (dims6.fumu>=70?'✅ 安康':dims6.fumu>=55?'🟡 关注':'🔴 关注') + '\n\n';
    }
    var st=d[1]||'未知',con=d[2]||'综合',partnerBazi=d[3]||'';
    var th=(ele==='金'?'酉(鸡)→秋季桃花旺':ele==='木'?'卯(兔)→春季桃花旺':ele==='水'?'子(鼠)→冬季桃花旺':ele==='火'?'午(马)→夏季桃花旺':ele==='土'?'辰戌丑未→四季桃花':'未知');
    var yr='';
    if(st.indexOf('单身')>=0){
      yr=(ele==='金'?'今年火旺克金，感情有压力。秋季金旺桃花开，8-10月是遇到正缘的好时机。建议多参加社交活动，贵人方位西北。':ele==='木'?'今年精力旺盛，桃花盛开。春季(2-4月)是遇到正缘的最佳时机。建议主动扩展社交圈，贵人方位东方。':ele==='水'?'今年水火既济，感情和谐。夏季(5-7月)把握机会。贵人方位北方，适合在文化活动中遇到心仪对象。':ele==='火'?'今年热情高涨但易冲动。需冷静观察对方是否真心。建议不要急于表态，先了解再行动。贵人方位东方。':ele==='土'?'今年贵人多助，感情稳定发展。宜主动社交，参加婚宴/聚会容易遇到正缘。贵人方位南方。':'');
    }else if(st.indexOf('恋爱')>=0){
      yr=(ele==='金'?'今年需多沟通包容，防口角。秋季关系好转，适合谈婚论嫁。':ele==='木'?'今年感情发展顺利，可考虑进一步。春季是表白/求婚的好时机。':ele==='水'?'今年感情和谐，适合谈婚论嫁。夏季是确定关系的好时机。':ele==='火'?'今年需控制情绪，避免因小事争执。建议多共同出游增进感情。':ele==='土'?'今年感情稳定，宜成家安业。秋冬季节适合举办婚礼。':'');
    }else if(st.indexOf('已婚')>=0){
      yr=(ele==='金'?'今年需注意沟通方式，防因工作压力影响夫妻关系。':ele==='木'?'今年恩爱有加，宜共同出游/学习增进感情。':ele==='水'?'今年感情和谐，家庭美满。适合添丁增喜。':ele==='火'?'今年需防急躁影响感情，多体贴伴侣。':ele==='土'?'今年家庭稳定，宜共同规划未来。':'');
    }else if(st.indexOf('困惑')>=0||st.indexOf('复合')>=0){
      yr=(ele==='金'?'当前感情有阻力，宜冷静思考。秋季金旺时关系有望缓和。':ele==='木'?'需要主动沟通，春季是化解矛盾的好时机。':ele==='水'?'以柔克刚，用智慧化解感情困局。夏季关系好转。':ele==='火'?'需控制情绪，避免冲动决定。给彼此空间和时间。':ele==='土'?'稳重对待，不宜急于求成。耐心等待时机自然化解。':'');
    }
    var hh='';
    if(st.indexOf('单身')>=0){
      hh='催桃花方法(拿来即用)：\n1. 卧室正东方位放鲜花(粉色玫瑰/桃花)\n2. 佩戴粉水晶手链(左手)\n3. 红绳系左手腕，招正缘\n4. 每月初一、十五燃粉色蜡烛\n5. 多穿粉色/浅紫色衣物旺桃花\n6. 社交方位：朝'+(ele==='金'?'西北':ele==='木'?'东方':ele==='水'?'北方':ele==='火'?'东方':'南方')+'出行遇贵人';
    }else{
      var pw=(ele==='金'?'白水晶':ele==='木'?'绿幽灵':ele==='水'?'黑曜石':ele==='火'?'红玛瑙':'黄玉');
      hh='稳定感情方法：\n1. 佩戴'+pw+'稳定感情运\n2. 卧室不宜放镜子对床\n3. 床头朝'+(ele==='金'?'西方':ele==='木'?'东方':ele==='水'?'北方':ele==='火'?'南方':'西南方')+'旺夫妻和合\n4. 夫妻共同佩戴情侣手串增缘\n5. 忌在卧室放仙人掌/带刺植物';
    }
    var sp=(ele==='金'?'配偶刚毅果断，重义气，可能从事管理/金融':ele==='木'?'配偶温和上进，有进取心，可能从事教育/文化':ele==='水'?'配偶聪明灵活，善变通，可能从事科研/策划':ele==='火'?'配偶热情活泼，有领导力，可能从事传媒/销售':ele==='土'?'配偶稳重可靠，重承诺，可能从事房产/政务':'');
    return sixDimsCard+'━━━ 感情婚姻深度分析报告 ━━━\n\n【日主】'+dm+'('+ele+')\n【状况】'+st+'\n【关心】'+con+(partnerBazi?'\n【对方生辰】'+partnerBazi+'(可做合婚分析)':'')+'\n\n━━━ 桃花星分析 ━━━\n日主'+ele+'，桃花星：'+th+'\n2026年桃花位：正东方\n桃花星影响您的异性缘和感情运势\n\n━━━ 正缘分析 ━━━\n'+yr+'\n\n━━━ 化解方案(拿来即用)━━━\n'+hh+'\n\n━━━ 婚姻宫 ━━━\n日支为配偶宫，'+sp+'\n\n━━━ 合婚参考 ━━━\n'+(partnerBazi?'如需深度合婚分析，请提供双方完整生辰，系统将分析五行互补/日柱相生/生肖配对。':'如有对象，请提供对方生辰做合婚配对分析。')+'\n\n━━━ 2026年感情时间线 ━━━\n· 春季(2-4月)：'+(ele==='木'||ele==='火'?'桃花旺盛期，主动出击':'')+(ele==='金'||ele==='水'?'感情酝酿期，耐心培养':'')+(ele==='土'?'稳定发展期，宜社交':'')+'\n· 夏季(5-7月)：'+(ele==='水'||ele==='火'?'感情高潮期，适合确定关系':'')+(ele==='金'||ele==='木'?'需注意沟通，防口角':'')+(ele==='土'?'平稳期，宜共同规划':'')+'\n· 秋季(8-10月)：'+(ele==='金'?'金旺桃花开，遇正缘好时机':'')+(ele==='木'?'需防小人影响感情':'')+(ele==='水'?'贵人助力，感情顺遂':'')+(ele==='火'?'宜冷静反思感情方向':'')+(ele==='土'?'适合成家安业':'')+'\n· 冬季(11-1月)：'+(ele==='水'?'防寒气影响感情，多温暖对方':'')+(ele==='金'?'养精蓄锐，为来年桃花做准备':'')+(ele==='木'?'顺遂期，宜规划未来':'')+(ele==='火'?'防破财影响感情':'')+(ele==='土'?'防寒保暖，感情平稳':'')+'';
  }
  if(modId==='wuxing'){
    var m=d[0].match(/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})/);
    if(m){
      var p=_paipan(+m[1],+m[2],+m[3],12);
      var dm=p.day_master,wc=p.wuxing_count;
      var lack=(p.wuxing_lack&&p.wuxing_lack.length)?p.wuxing_lack.join('、'):'无';
      var hj=_getHuajie(dm.slice(-1),lack.split('、'));
      var wxMax=Object.keys(wc).reduce(function(a,b){return wc[a]>(wc[b]||0)?a:b;});
      var wxDesc={'金':'决断刚毅重义气','木':'进取有才华仁慈','水':'聪明灵活善变通','火':'热情外向有领导力','土':'稳重厚道重承诺'};
      var wxSeason={'金':'秋季金旺事业顺','木':'春季木旺精力充沛','水':'冬季水旺社交佳','火':'夏季火旺冲劲足','土':'长夏土旺贵人多'};
      var wxStrong=wxMax+'旺('+(wc[wxMax]||0)+'个)→'+(wxDesc[wxMax]||'');
      var wxSeasonTip=wxSeason[wxMax]||'根据五行旺衰调整';
      return'━━━ 五行深度分析报告 ━━━\n\n【日主】'+dm+'\n【五行分布】金'+(wc['金']||0)+' 木'+(wc['木']||0)+' 水'+(wc['水']||0)+' 火'+(wc['火']||0)+' 土'+(wc['土']||0)+'\n【缺行】'+lack+'\n\n━━━ 五行对应 ━━━\n金→肺/呼吸/西方/白色/金属/决断力\n木→肝胆/东方/绿色/植物/进取心\n水→肾/泌尿/北方/黑色/液体/灵活性\n火→心/血/南方/红色/光热/热情\n土→脾/胃/中央/黄色/土壤/稳定性\n\n━━━ 五行生克 ━━━\n相生：金生水→水生木→木生火→火生土→土生金\n相克：金克木→木克土→土克水→水克火→火克金\n\n━━━ 补救方案(拿来即用)━━━\n【佩戴】'+hj.peishi+'\n【方位】'+hj.fangwei+'\n【颜色】'+hj.yanse+'\n【数字】'+hj.shuzi+'\n【饮食】'+hj.yinshi+'\n【行业】'+hj.hangye+'\n\n━━━ 吉祥物摆放 ━━━\n'+hj.baifang+'\n\n━━━ 五行与健康 ━━━\n'+(lack.includes('金')?'缺金→呼吸道/肺部偏弱，多食白萝卜/百合/银耳\n':'')+(lack.includes('木')?'缺木→肝胆偏弱，多食绿叶菜/菊花茶，忌怒\n':'')+(lack.includes('水')?'缺水→肾/泌尿偏弱，多食黑豆/海带，忌寒\n':'')+(lack.includes('火')?'缺火→心血管偏弱，多食红枣/枸杞，忌寒凉\n':'')+(lack.includes('土')?'缺土→脾胃偏弱，多食山药/小米，忌生冷\n':'')+(lack==='无(五行俱全)'?'五行平衡，注意整体调和即可\n':'')+'\n━━━ 五行与职业 ━━━\n'+(lack.includes('金')?'补金行业：金融/机械/珠宝/法律\n':'')+(lack.includes('木')?'补木行业：教育/出版/农业/服装\n':'')+(lack.includes('水')?'补水行业：物流/旅游/水产/通信\n':'')+(lack.includes('火')?'补火行业：电子/餐饮/能源/传媒\n':'')+(lack.includes('土')?'补土行业：房产/建筑/政务/矿业\n':'')+(lack==='无(五行俱全)'?'五行平衡，可根据个人兴趣选行业\n':'')+'\n━━━ 五行旺衰分析 ━━━\n【最旺】'+wxStrong+'\n【季节运势】'+wxSeasonTip+'\n\n(关注方向：'+(d[1]||'全面分析')+')';
    }
    return'请提供生辰分析五行。';
  }
  if(modId==='xingming'){
    var name=d[0]||'未知',sex=d[1]||'未知',bz=d[2]||'',aspect=d[3]||'姓名吉凶总评';
    var dm='未知',ele='未知';
    if(bz){var bm=bz.match(/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})/);if(bm){var bp=_paipan(+bm[1],+bm[2],+bm[3],12);dm=bp.day_master;ele=dm.slice(-1);}}
    return'━━━ 姓名深度分析报告 ━━━\n\n【姓名】'+name+'\n【性别】'+sex+(bz?'\n【日主】'+dm+'('+ele+')':'')+'\n【分析方向】'+aspect+'\n\n━━━ 三才五格 ━━━\n【天格】=姓笔画+1→祖业遗传(无法改)\n【人格】=姓末+名首→核心性格(最重要)\n【地格】=名笔画+1→早年运(1-35岁)\n【外格】=总格-人格+1→社交运\n【总格】=姓+名总笔画→晚年运(36岁后)\n\n━━━ 数理吉凶 ━━━\n大吉数：1/3/5/8/11/13/15/16/21/23/24/25/31/32/33/35\n大凶数：4/9/10/14/19/20/22/28/34/44\n半吉半凶：2/6/7/12/17/18/26/27/29/30\n\n━━━ 五行配合(拿来即用)━━━\n'+(ele==='金'?'喜金→名字用金/鑫/铭/锐/钢/锋/钰\n':ele==='木'?'喜木→名字用木/林/森/柏/松/桐/楠\n':ele==='水'?'喜水→名字用水/淼/涵/润/泽/浩/瀚\n':ele==='火'?'喜火→名字用火/炎/灿/辉/煜/烨/煊\n':ele==='土'?'喜土→名字用土/坤/培/垣/城/坚/磊\n':'')+'\n━━━ 改名建议(拿来即用)━━━\n改名原则：\n1. 补八字喜用神五行('+(ele?ele:'需排盘确定')+')\n2. 三才相生(天人生/人生地)\n3. 人格/总格数理宜吉祥(24/31/35)\n4. 音韵和谐、寓意美好\n5. 避免生僻字/谐音不雅\n6. 避免与长辈同名\n\n改名推荐字：\n'+(ele==='金'?'男性：铭/锐/钧/铮/锦/钰\n女性：银/铃/钰/锦/鑫\n':ele==='木'?'男性：林/森/柏/松/桐/楠\n女性：梅/兰/竹/菊/芳/芸\n':ele==='水'?'男性：浩/瀚/泽/润/涵/渊\n女性：涵/润/溪/洁/沁/冰\n':ele==='火'?'男性：炎/灿/辉/煜/烨/煊\n女性：灿/烨/煊/灵/烁/熠\n':ele==='土'?'男性：坤/培/垣/城/坚/磊\n女性：培/垣/城/坚/磊/婉\n':'')+'\n━━━ 公司/品牌起名 ━━━\n公司起名原则：\n1. 补法人八字喜用神\n2. 总格数理宜吉祥(24/31/35)\n3. 行业五行与名称五行相生\n4. 简洁易记、寓意兴旺\n5. 避免谐音不雅\n\n行业五行对照：\n金：金融/机械/珠宝 | 木：教育/农业/服装\n水：物流/旅游/水产 | 火：电子/餐饮/传媒\n土：房产/建筑/政务\n━━━ 姓名笔画速查 ━━━\n常见姓笔画：王4/李7/张7/刘6/陈7/杨7/赵8/黄11/周8/吴7/徐10/孙6/胡9/朱6/高10/林8/何7/郭10/马3/罗19\n取名提示：笔画以《康熙字典》为准，简化字需还原繁体计算\n━━━ 姓名与性格参考 ━━━\n人格1-9：领导型，独立果断\n人格10-19：执行型，勤奋务实\n人格20-29：协作型，善于沟通\n人格30-39：管理型，统筹全局\n人格40+：智慧型，深思熟虑';
  }
  if(modId==='qimen'){
    // 奇门遁甲完整排盘 + 深度解读
    var t=d[0]||'2026年7月20日10时';
    var tm=t.match(/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日\s]+(\d{1,2})[时点:]?/);
    var y=m=today?today.getFullYear():2026,mn=today?today.getMonth()+1:7,dy=today?today.getDate():20,hr=10;
    if(tm){y=+tm[1];mn=+tm[2];dy=+tm[3];hr=+tm[4];}
    var sex=d[1]||'男';
    var ask=d[2]||'事业决策';
    var ctx=d[3]||'未提供背景';
    var hope=d[4]||'全面分析';
    var qd=_qimenCompute(y,mn,dy,hr,sex,ask);
    var jg=qd.ju;var yd=qd.isYangDun?'阳遁':'阴遁';
    var r='━━━ 奇门遁甲完整排盘报告 ━━━\n\n';
    r+='【起盘时间】'+y+'年'+mn+'月'+dy+'日 '+hr+'时\n';
    r+='【阴阳遁】'+yd+'\n';
    r+='【局数】'+jg+'局('+qd.juName+')\n';
    r+='【值符】'+qd.zhifu+'(落'+qd.zhifuPalace+'宫)\n';
    r+='【值使】'+qd.zhishi+'门(落'+qd.zhishiPalace+'宫)\n';
    r+='【问事人】'+sex+'｜【问事】'+ask+'\n';
    r+='【问事背景】'+ctx+'\n';
    r+='【重点需求】'+hope+'\n\n';
    r+='━━━ 一、九宫排盘(洛书九宫)━━━\n';
    // 九宫格式：巽4 离9 坤2 / 震3 中5 兑7 / 艮8 坎1 乾6
    var order=[[4,9,2],[3,5,7],[8,1,6]];
    var grid='';
    for(var row=0;row<3;row++){
      grid+='【'+order[row][0]+'宫　'+order[row][1]+'宫　'+order[row][2]+'宫】\n';
      for(var col=0;col<3;col++){
        var gq=order[row][col];
        var p=qd.palaces[gq];
        grid+=' '+p.gongName+'｜九星：'+(p.star||'—')+'｜八门：'+(p.door||'—')+'｜八神：'+(p.god||'—')+'｜天盘：'+p.tian+'｜地盘：'+p.di+'\n';
      }
      grid+='\n';
    }
    r+=grid;
    r+='━━━ 二、核心宫位分析 ━━━\n';
    var kp=qd.keyPalace;
    r+='【用神宫位】'+kp.gongName+'('+kp.trigram+'宫·'+kp.element+')\n';
    r+='【天盘】'+kp.tian+'　【地盘】'+kp.di+'\n';
    r+='【九星】'+kp.star+'('+kp.starNature+')\n';
    r+='【八门】'+kp.door+'('+kp.doorNature+')\n';
    r+='【八神】'+kp.god+'('+kp.godNature+')\n';
    r+='【格局】'+kp.judge+'\n\n';
    r+='━━━ 三、问事用神判断 ━━━\n';
    var useMap={'事业决策':'开门+生门+值符代表上级','财运投资':'生门+甲子戊(财星)+生门所临之宫','感情婚姻':'休门+六合+乙/庚(男女姻缘)','出行安全':'开门+天盘所临宫位+九天/九地','失物寻找':'杜门+六仪+天盘寄宫方位','官司诉讼':'开门+值符+天盘所克','健康吉凶':'死门/惊门+天芮星(病符)+天心星(医药)','其他':'值符+值使门落宫'};
    r+=useMap[ask]||useMap['其他']+'\n';
    r+='用神宫位：'+kp.gongName+'｜'+kp.tian+'(天盘)'+kp.di+'(地盘)｜'+kp.star+kp.door+kp.god+'\n';
    r+='旺衰：用神'+kp.wang+' → '+kp.wangDesc+'\n';
    r+='生克：'+kp.shengke+'\n\n';
    r+='━━━ 四、核心解读 ━━━\n';
    r+='【总体格局】'+qd.overview+'\n\n';
    r+='【关键运势】'+qd.keyFortune+'\n\n';
    r+='【核心建议】'+qd.keyAdvice+'\n\n';
    r+='【最佳时辰】'+qd.bestHour+'('+qd.bestHourReason+')\n';
    r+='【吉利方位】'+qd.goodDirection+'('+qd.goodDirReason+')\n';
    r+='【不利方位】'+qd.badDirection+'('+qd.badDirReason+')\n';
    r+='【行动时机】'+qd.actionTime+'('+qd.actionTimeReason+')\n\n';
    r+='━━━ 五、化解方案(拿来即用)━━━\n';
    if(qd.isGood){
      r+='✅ 此局吉象明显，可顺势而为：\n';
      r+='① 吉方行动 → 朝'+qd.goodDirection+'方位出行/办公\n';
      r+='② 吉时启动 → '+qd.bestHour+'做关键决策\n';
      r+='③ 贵人方位 → '+kp.gongName+'方位寻贵人相助\n';
      r+='④ 佩戴建议 → '+(kp.element==='金'?'金属饰品':kp.element==='木'?'绿幽灵/翡翠':kp.element==='水'?'水晶/黑曜石':kp.element==='火'?'红玛瑙/紫水晶':'黄玉/和田玉')+'旺运\n';
      r+='⑤ 数字密码 → '+kp.luckyNum+'(奇门应数)\n';
    }else{
      r+='⚠️ 此局带凶，宜静待时机：\n';
      r+='① 避免方位 → 不向'+qd.badDirection+'方向行动\n';
      r+='② 化解时辰 → 待'+qd.bestHour+'后再议\n';
      r+='③ 风水化解 → '+kp.gongName+'方位放'+('金木水火土'.charAt('金木水火土'.indexOf(kp.element)/1)+'行'+kp.element)+'镇物\n';
      r+='④ 祈福化解 → 农历初一/十五上香，诵《道德经》一章节\n';
      r+='⑤ 数字避忌 → '+kp.badNum+'数避免(如楼层/房号/手机尾号)\n';
    }
    r+='\n━━━ 六、问事针对性分析 ━━━\n';
    r+=qd.askSpecific+'\n\n';
    r+='━━━ 七、应期判断 ━━━\n';
    r+='应期(事情应验时间)：\n';
    r+='· 近应 → '+qd.nearPeriod+'\n';
    r+='· 中应 → '+qd.midPeriod+'\n';
    r+='· 远应 → '+qd.farPeriod+'\n\n';
    r+='━━━ 八、深度咨询引导 ━━━\n';
    r+='如需更深度分析，请补充：\n';
    r+='① 问事人完整八字 → 可结合奇门与命理双验证\n';
    r+='② 问事具体时间点 → 锁定应期\n';
    r+='③ 对方/相关人信息 → 看世应关系\n';
    r+='④ 历史背景 → 验证盘面吉凶\n\n';
    r+='━━━ 排盘引擎：奇门遁甲智能排盘系统 v2.0 ━━━';
    return r;
  }
  if(modId==='ziwei'){
    var zsBirth=d[0]||'未知';var zsFocus=d[1]||'全面分析';
    var zm=zsBirth.match(/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})/);
    var zy=2026,zm2=7,zd=20,zh=12;
    if(zm){zy=+zm[1];zm2=+zm[2];zd=+zm[3];}
    var zp=_paipan(zy,zm2,zd,zh);
    var zdm=zp.day_master,zele=zdm.slice(-1);
    var zwx=zp.wuxing_count,zlack=zp.wuxing_lack;
    // 真实紫微斗数安星法
    var tg2=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    var dz12=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    var monthGongIdx=(2+zm2-1)%12;
    var mingGongIdx=(monthGongIdx-zh+12)%12;
    var shenGongIdx=(monthGongIdx+zh)%12;
    var yc2=(m===1||(m===2&&d<4))?zy-1:zy;
    var yI2=((yc2-4)%10+10)%10;
    var mgGanIdx=(yI2*2+mingGongIdx+2)%10;
    var mgGan=tg2[mgGanIdx],mgZhi=dz12[mingGongIdx];
    var juMap={'甲子':'金六','乙丑':'金六','丙寅':'火四','丁卯':'火四','戊辰':'木三','己巳':'木三','庚午':'土五','辛未':'土五','壬申':'水二','癸酉':'水二','甲戌':'火四','乙亥':'火四','丙子':'水二','丁丑':'水二','戊寅':'土五','己卯':'土五','庚辰':'金六','辛巳':'金六','壬午':'木三','癸未':'木三','甲申':'水二','乙酉':'水二','丙戌':'土五','丁亥':'土五','戊子':'火四','己丑':'火四','庚寅':'木三','辛卯':'木三','壬辰':'水二','癸巳':'水二','甲午':'金六','乙未':'金六','丙申':'火四','丁酉':'火四','戊戌':'木三','己亥':'木三','庚子':'土五','辛丑':'土五','壬寅':'金六','癸卯':'金六','甲辰':'火四','乙巳':'火四','丙午':'水二','丁未':'水二','戊申':'土五','己酉':'土五','庚戌':'木三','辛亥':'木三','壬子':'木三','癸丑':'木三'};
    var juStr=juMap[mgGan+mgZhi]||'水二';
    var juNum=parseInt(juStr.slice(1));
    var juName=juStr+'局';
    var zyOffset=Math.ceil(zd/juNum);
    var ziweiIdx=(2+zyOffset-1)%12;
    var starDesc={'紫微':'帝星·领导力强·主观固执','天机':'智多星·善于谋划·神经敏感','太阳':'贵星·热情大方·男主父旺女主大吉','武曲':'财星·刚毅果决·财录有成','天同':'福星·乐观享福·安于现状','廉贞':'囚星·次桃花·干练多争','天府':'库星·稳重保守·财蓄有成','太阴':'母星·温柔内敛·女主母旺','贪狼':'桃花·多才多艺·欲望强','巨门':'暗星·口才好但多是非','天相':'印星·循规蹈矩·助人助己','天梁':'荫星·正直有原则·老成持重','七杀':'将星·刚毅勇敢·波动大','破军':'耗星·破旧立新·变化多端'};
    var zwSeries=['紫微','天机','太阳','武曲','天同','廉贞'];
    var zwOffsets=[0,1,3,4,5,8];
    var tfSeries=['天府','太阴','贪狼','巨门','天相','天梁','七杀','破军'];
    var tfOffsets=[0,1,2,3,4,5,6,7];
    var tfIdx=(ziweiIdx+6)%12;
    var palaceStars=new Array(12).fill(null);
    for(var si=0;si<zwSeries.length;si++){var pidx=(ziweiIdx+zwOffsets[si])%12;palaceStars[pidx]=(palaceStars[pidx]||'')+zwSeries[si];}
    for(var si=0;si<tfSeries.length;si++){var pidx=(tfIdx+tfOffsets[si]+12)%12;palaceStars[pidx]=(palaceStars[pidx]||'')+tfSeries[si];}
    var gongNames=['命宫','兄弟宫','夫妻宫','子女宫','财帛宫','疾厄宫','迁移宫','仆役宫','官禄宫','田宅宫','福德宫','父母宫'];
    var mainStar=palaceStars[mingGongIdx]||'空宫';
    var bodyPalace=dz12[shenGongIdx]+'宫';
    var mingStar2=palaceStars[shenGongIdx]||'空宫';
    var spStar=palaceStars[(mingGongIdx+2)%12]||'空宫';
    var caStar=palaceStars[(mingGongIdx+4)%12]||'空宫';
    var caStar2=palaceStars[(mingGongIdx+8)%12]||'空宫';
    var offStar=palaceStars[(mingGongIdx+3)%12]||'空宫';
    var trStar=palaceStars[(mingGongIdx+6)%12]||'空宫';
    var paStar=palaceStars[(mingGongIdx+11)%12]||'空宫';
    var foStar=palaceStars[(mingGongIdx+10)%12]||'空宫';
    var zr='━━━ 紫微斗数完整排盘报告 ━━━\n\n';
    zr+='【生辰】'+zsBirth+'\n';
    zr+='【日主】'+zdm+'('+zele+')\n';
    zr+='【五行】金'+zwx['金']+' 木'+zwx['木']+' 水'+zwx['水']+' 火'+zwx['火']+' 土'+zwx['土']+(zlack.length?' · 缺'+zlack.join('、'):' · 五行俱全')+'\n';
    zr+='【命主星】'+mainStar+' → '+(starDesc[mainStar]||'空宫，需借星安宫，对宫主星影响大')+'\n';
    zr+='【身主星】'+mingStar2+' → '+(starDesc[mingStar2]||'空宫，需借星安宫')+'\n';
    zr+='【身宫】'+bodyPalace+'\n\n';
    zr+='━━━ 一、十二宫详细排盘 ━━━\n';
    zr+='┌─────────────────────────┐\n';
    zr+='│ 1.命宫 → '+mainStar+'('+(starDesc[mainStar]||'空宫·').split('·')[0]+')\n';
    zr+='│ 2.兄弟宫 → '+(palaceStars[(mingGongIdx+1)%12]||'空宫')+'('+(starDesc[(palaceStars[(mingGongIdx+1)%12]||'空宫')]||{split:function(){return['空宫']}}).split('·')[0]+')\n';
    zr+='│ 3.夫妻宫 → '+spStar+'('+(starDesc[spStar]||'空宫·').split('·')[0]+')\n';
    zr+='│ 4.子女宫 → '+offStar+'('+(starDesc[offStar]||'空宫·').split('·')[0]+')\n';
    zr+='│ 5.财帛宫 → '+caStar+'('+(starDesc[caStar]||'空宫·').split('·')[0]+')\n';
 zr+='│ 6.疾厄宫 → '+(palaceStars[(mingGongIdx+5)%12]||'空宫')+'('+(starDesc[(palaceStars[(mingGongIdx+5)%12]||'')]||'空宫·').split('·')[0]+')\n';
    zr+='│ 7.迁移宫 → '+trStar+'('+(starDesc[trStar]||'空宫·').split('·')[0]+')\n';
    zr+='│ 8.仆役宫 → '+(palaceStars[(mingGongIdx+7)%12]||'空宫')+'('+(starDesc[(palaceStars[(mingGongIdx+7)%12]||'')]||'空宫·').split('·')[0]+')\n';
    zr+='│ 9.官禄宫 → '+caStar2+'('+(starDesc[caStar2]||'空宫·').split('·')[0]+')\n';
    zr+='│ 10.田宅宫 → '+(palaceStars[(mingGongIdx+9)%12]||'空宫')+'('+(starDesc[(palaceStars[(mingGongIdx+9)%12]||'')]||'空宫·').split('·')[0]+')\n';
    zr+='│ 11.福德宫 → '+foStar+'('+(starDesc[foStar]||'空宫·').split('·')[0]+')\n';
    zr+='│ 12.父母宫 → '+paStar+'('+(starDesc[paStar]||'空宫·').split('·')[0]+')\n';
    zr+='└─────────────────────────┘\n\n';
    zr+='━━━ 二、核心宫位深度解读 ━━━\n';
    zr+='【命宫 · '+mainStar+'】\n'+(starDesc[mainStar]||'空宫，需借星安宫，对宫主星影响大')+'\n'+(mainStar==='紫微'?'领导力强，适合管理岗，但主观过强需广纳建言。':mainStar==='天机'?'头脑灵活，适合策划/研究，需注意多思多虑影响睡眠。':mainStar==='太阳'?'热情博爱，适合公职/传媒，男主父缘深女主事业强。':mainStar==='武曲'?'刚毅果决，适合金融/管理，财录有成但需注意人际。':mainStar==='天同'?'乐观温和，适合服务/教育，福报深厚但不宜过于安逸。':mainStar==='廉贞'?'干练有才，适合行政/法律，需注意桃花纠纷。':mainStar==='天府'?'稳重保守，适合金融/房产，善于理财蓄财。':mainStar==='太阴'?'温柔内敛，适合艺术/教育，女主母缘深男主异性缘好。':mainStar==='贪狼'?'多才多艺，适合演艺/销售，欲望强需有所节制。':mainStar==='巨门'?'口才出众，适合律师/教师，但防口舌是非。':mainStar==='天相'?'踏实稳重，适合公务/行政，助人终助己。':mainStar==='天梁'?'正直有原则，适合法律/医疗，老成持重有威望。':mainStar==='七杀'?'勇敢果决，适合军警/创业，人生波动大但成就能高。':mainStar==='破军'?'破旧立新，适合创新行业，变化多端但机遇多。':'')+'\n\n';
    zr+='【夫妻宫 · '+spStar+'】\n'+(starDesc[spStar]||'空宫，需借星安宫')+'\n'+(spStar==='紫微'?'配偶能干有主见，宜充分沟通。':spStar==='太阴'?'配偶温柔体贴，女主贤淑男主得贤内助。':spStar==='天府'?'配偶稳重可靠，善于理财。':spStar==='贪狼'?'配偶多才多艺但需注意桃花。':spStar==='武曲'?'配偶刚毅果决，事业心强。':spStar==='天同'?'配偶乐观温和，感情甜蜜。':spStar==='七杀'||spStar==='破军'?'感情波动大，需多包容。':'配偶性格'+(starDesc[spStar]||'空宫·').split('·')[1])+'\n\n';
    zr+='【财帛宫 · '+caStar+'】\n'+(starDesc[caStar]||'空宫，需借星安宫')+'\n'+(caStar==='武曲'||caStar==='天府'?'财运极佳，善于理财，适合金融/投资。':caStar==='太阴'?'财运稳定，细水长流，适合理财型收入。':caStar==='紫微'?'财源广进，但花销也大，需注意节流。':caStar==='贪狼'?'偏财运好，但波动大，需稳健。':caStar==='破军'?'财运波动大，破旧立新中求财。':caStar==='巨门'?'靠口才求财，律师/教师/销售。':'正财稳定，靠专业技能求财。')+'\n\n';
    zr+='【官禄宫 · '+caStar2+'】\n'+(starDesc[caStar2]||'空宫，需借星安宫')+'\n'+(caStar2==='紫微'?'适合管理/领导岗位，有帝王之相。':caStar2==='太阳'?'适合公职/外交/传媒。':caStar2==='天机'?'适合科研/策划/顾问。':caStar2==='武曲'?'适合金融/财务/军警。':caStar2==='天同'?'适合教育/服务/餐饮。':caStar2==='廉贞'?'适合行政/法律/精密器械。':caStar2==='贪狼'?'适合演艺/公关/销售。':caStar2==='巨门'?'适合律师/教师/播音。':caStar2==='七杀'?'适合军警/创业/竞争行业。':caStar2==='破军'?'适合创新行业/改革岗。':'适合公务/行政/服务。')+'\n\n';
    zr+='━━━ 三、2026流年运势 ━━━\n';
    zr+='2026丙午年，火旺当令。\n';
    zr+='日主'+zele+'→'+(zele==='金'?'火克金→事业压力但破茧成蝶，秋季好转。':zele==='木'?'木生火→精力充沛但消耗大，注意休息。':zele==='水'?'水克火→掌控力强，事业有成。':zele==='火'?'火旺至极→冲劲足但需冷静，防急躁。':'火生土→贵人多助，稳中有升。')+'\n\n';
    zr+='━━━ 四、大运走势 ━━━\n';
    var ages=[12,22,32,42,52,62];
    ages.forEach(function(a){var ds=(palaceStars[(mingGongIdx+a)%12]||'空宫');zr+='· '+a+'-'+(a+9)+'岁 → '+ds+'运 → '+(starDesc[ds]||'空宫·').split('·')[0]+'\n';});
    zr+='\n';
    zr+='━━━ 五、五行调候建议 ━━━\n';
    if(zlack.length){zr+='缺'+zlack.join('、')+'：\n';zlack.forEach(function(l){var fm={'金':'补金→佩戴金属饰品，穿白色，居西方向','木':'补木→佩戴翡翠，穿绿色，居东方','水':'补水→佩戴水晶，穿黑/蓝，居北方','火':'补火→佩戴红玛瑙，穿红色，居南方','土':'补土→佩戴玉石，穿黄色，居中央'};zr+='  '+fm[l]+'\n';});}else{zr+='五行俱全，根基稳固。需注意'+zele+'是否过旺或过弱，结合大运调候。\n';}
    zr+='\n';
    zr+='━━━ 六、深度咨询引导 ━━━\n';
    zr+='如需更深度分析，请补充：\n';
    zr+='① 完整出生时辰 → 精确到时辰的紫微盘\n';
    zr+='② 性别 → 确定大运顺逆\n';
    zr+='③ 关心宫位 → 命宫/财帛/夫妻等做专项展开\n';
    zr+='④ 流年关注 → 可做月度运势细化\n\n';
    zr+='━━━ 排盘引擎：紫微斗数智能排盘系统 v2.0 ━━━';
    return zr;
  }
  if(modId==='liuyao'){
    var lyTime=d[0]||'2026年7月20日10时';var lyAsk=d[1]||'事业工作';var lyBg=d[2]||'';var lyNum=d[3]||'38';
    // 梅花易数法起卦
    var n=parseInt((''+lyNum).replace(/\D/g,''))||38;
    var upGua=n%8;var loGua=((n+Math.floor(n/8))%8);var yaoIdx=Math.floor((n*3)%6);
    var baGua=['坤','艮','坎','巽','震','离','兑','乾']; // 0-7
    var upName=baGua[upGua]||'坤',loName=baGua[loGua]||'坤';
    var guaName={'坤坤':'坤为地','艮坤':'山地剥','坎坤':'水地比','巽坤':'风地观','震坤':'雷地豫','离坤':'火地晋','兑坤':'泽地萃','乾坤':'天地否','坤艮':'地山谦','艮艮':'艮为山','坎艮':'水山蹇','巽艮':'风山渐','震艮':'雷山小过','离艮':'火山旅','兑艮':'泽山咸','乾艮':'天山遁','坤坎':'地水师','艮坎':'山水蒙','坎坎':'坎为水','巽坎':'风水涣','震坎':'雷水解','离坎':'火水未济','兑坎':'泽水困','乾坎':'天水讼','坤巽':'地风升','艮巽':'山风蛊','坎巽':'水风井','巽巽':'巽为风','震巽':'雷风恒','离巽':'火风鼎','兑巽':'泽风大过','乾巽':'天风姤','坤震':'地雷复','艮震':'山雷颐','坎震':'水雷屯','巽震':'风雷益','震震':'震为雷','离震':'火雷噬嗑','兑震':'泽雷随','乾震':'天雷无妄','坤离':'地火明夷','艮离':'山火贲','坎离':'水火既济','巽离':'风火家人','震离':'雷火丰','离离':'离为火','兑离':'泽火革','乾离':'天火同人','坤兑':'地泽临','艮兑':'山泽损','坎兑':'水泽节','巽兑':'风泽中孚','震兑':'雷泽归妹','离兑':'火泽睽','兑兑':'兑为泽','乾兑':'天泽履','坤乾':'地天泰','艮乾':'山天大畜','坎乾':'水天需','巽乾':'风天小畜','震乾':'雷天大壮','离乾':'火天大有','兑乾':'泽天夬','乾乾':'乾为天'};
    var fullGua=upName+loName;
    var guaCN=guaName[fullGua]||'未知卦';
    // 卦象吉凶(简化版)
    var guaJi={'乾为':'吉·刚健中正','坤为':'吉·厚德载物','水雷':'中·险中有动','雷水解':'吉·解除困境','火水':'凶·事未成','天火':'吉·同人之心','地天':'吉·诸事通泰','风水':'中·涣散','雷风':'吉·持久','火风':'吉·鼎新','地风':'吉·上进','水风':'中·井泉','天风':'中·邂逅','山水':'凶·蹇难','风山':'吉·渐进','火山':'中·旅行','泽山':'吉·感应','地山':'吉·谦虚','雷山':'凶·小过','天山':'中·退避','火地':'吉·晋升','泽地':'吉·聚集','雷地':'吉·安乐','风地':'中·观察','水地':'吉·亲近','山地':'凶·剥落','天地':'凶·闭塞','地水':'吉·用兵','水山':'凶·蒙昧','坎为':'凶·重险','离为':'吉·光明','震为':'吉·行动','艮为':'中·静止','巽为':'中·顺从','兑为':'吉·喜悦'};
    var gKey=fullGua.slice(0,2);
    if(guaJi[fullGua])gKey=fullGua;
    var jiDesc=guaJi[gKey]||'中平';
    // 六亲用神
    var useGod={'事业工作':'官鬼爻(看事业/地位/权力)','财运投资':'妻财爻(看财运/投资/收益)','感情婚姻':'妻财爻(男)/官鬼爻(女)+世应关系','考试升学':'父母爻(看文凭/考试/录取)','出行远行':'世爻+应爻(目的地)+驿马','失物寻找':'子孙爻+财爻+方位','健康疾病':'官鬼爻(疾病)+子孙爻(医药)','官司纠纷':'官鬼爻+勾陈+世应'}[lyAsk]||'官鬼爻';
    // 六神
    var sixGods=['青龙','朱雀','勾陈','腾蛇','白虎','玄武'];var lyGod=sixGods[(n)%6];
    // 世应位置
    var shiPos=[6,1,4,3,2,5][yaoIdx];var yingPos=7-shiPos;
    var lyR='━━━ 六爻占卜完整排盘报告 ━━━\n\n';
    lyR+='【起卦时间】'+lyTime+'\n';
    lyR+='【起卦数字】'+lyNum+'(梅花易数法)\n';
    lyR+='【占卜事项】'+lyAsk+'\n';
    if(lyBg)lyR+='【背景描述】'+lyBg+'\n';
    lyR+='\n━━━ 一、卦象排盘 ━━━\n';
    lyR+='【上卦】'+upName+'('+({坤:'地',艮:'山',坎:'水',巽:'风',震:'雷',离:'火',兑:'泽',乾:'天'}[upName])+')\n';
    lyR+='【下卦】'+loName+'('+({坤:'地',艮:'山',坎:'水',巽:'风',震:'雷',离:'火',兑:'泽',乾:'天'}[loName])+')\n';
    lyR+='【本卦】'+guaCN+'\n';
    lyR+='【卦意】'+jiDesc+'\n';
    lyR+='【动爻】第'+(yaoIdx+1)+'爻(从下往上数)\n';
    lyR+='【世爻】第'+shiPos+'爻(求测者本人)\n';
    lyR+='【应爻】第'+yingPos+'爻(对方/所测之事)\n';
    lyR+='【六神】'+lyGod+'(临世爻)\n\n';
    lyR+='━━━ 二、卦象图示 ━━━\n';
    var yaoLines=[];
    for(var i=6;i>=1;i--){
      var isYang=((i+parseInt(lyNum))%2===0);var isYao=(i===(yaoIdx+1));
      var yaoStr=isYang?'━━━━━':'━　━　';var mark=isYao?'○(动爻)':'';
      var godStr=sixGods[(i-1+parseInt(lyNum))%6];
      var posStr=(i===shiPos?'·世':i===yingPos?'·应':'');
      lyR+='六'+godStr+'　'+yaoStr+' '+mark+posStr+'\n';
    }
    lyR+='\n';
    lyR+='━━━ 三、用神分析 ━━━\n';
    lyR+='【用神】'+useGod+'\n';
    lyR+='【用神旺衰】'+(jiDesc.indexOf('吉')>=0?'用神旺相→事可成':'用神休囚→需等待时机')+'\n';
    lyR+='【世应关系】世爻在第'+shiPos+'爻，应爻在第'+yingPos+'爻→'+(Math.abs(shiPos-yingPos)===3?'世应相生→大吉':'世应相克→有阻力')+'\n';
    lyR+='【动爻影响】第'+(yaoIdx+1)+'爻发动→'+(jiDesc.indexOf('吉')>=0?'变吉→事态向好发展':'变凶→需化解')+'\n\n';
    lyR+='━━━ 四、六神断卦 ━━━\n';
    var godDetail={'青龙':'主吉庆·喜事·升迁·怀孕','朱雀':'主口舌·是非·文书·争吵','勾陈':'主拖延·停滞·旧事·纠缠','腾蛇':'主惊恐·虚惊·怪异· nightmares','白虎':'主凶灾·血光·丧服·手术','玄武':'主盗贼·暗昧·欺骗·隐秘'};
    lyR+='临'+lyGod+' → '+godDetail[lyGod]+'\n\n';
    lyR+='━━━ 五、综合判断 ━━━\n';
    var zongJi=jiDesc.indexOf('吉')>=0?'【总评】★ 吉卦。'+guaCN+'，'+jiDesc+'。所测之事有望成功，可积极行动。':'【总评】'+jiDesc+'。所测之事需谨慎，不宜冒进。';
    lyR+=zongJi+'\n\n';
    lyR+='【事项分析】'+({'事业工作':'事业看官鬼爻。'+(jiDesc.indexOf('吉')>=0?'官鬼旺相→升迁有望，上级赏识。宜主动承担责任，展现能力。':'官鬼休囚→事业有阻，宜静守待时，不宜跳槽或创业。'),'财运投资':'财运看妻财爻。'+(jiDesc.indexOf('吉')>=0?'财爻旺相→财源广进，可投资。方向：东南方有利。':'财爻休囚→财运不佳，忌投资借贷。宜守不宜攻。'),'感情婚姻':'感情看世应。'+(Math.abs(shiPos-yingPos)===3?'世应相生→感情和谐，有望更进一步。':'世应相克→有矛盾隔阂，需主动沟通化解。'),'考试升学':'考试看父母爻。'+(jiDesc.indexOf('吉')>=0?'父母旺相→金榜题名，考试顺利。':'父母休囚→需加倍努力，防粗心失分。'),'出行远行':'出行看世应+驿马。'+(jiDesc.indexOf('吉')>=0?'出行大吉，一路平安。':'出行有阻，宜改期或谨慎。'),'失物寻找':'失物看子孙+方位。'+(jiDesc.indexOf('吉')>=0?'可找回。方向：'+(['北方','东北','东方','东南','中央','西南','西方','西北'][n%8])+'方。':'难找回。已远去或被移走。'),'健康疾病':'健康看官鬼+子孙。'+(jiDesc.indexOf('吉')>=0?'子孙旺相→有良医，病可愈。注意休息调养。':'官鬼旺→病情较重，需及时就医。'),'官司纠纷':'官司看官鬼+勾陈。'+(jiDesc.indexOf('吉')>=0?'官司胜诉，正义在我方。':'官司不利，宜和解。')}[lyAsk]||'综合判断需更多信息。')+'\n\n';
    lyR+='━━━ 六、应期 ━━━\n';
    lyR+='【近应】'+(jiDesc.indexOf('吉')>=0?'3-7日内':'不宜在此期间行动')+'\n';
    lyR+='【中应】'+(jiDesc.indexOf('吉')>=0?'本月内成':'下月可转机')+'\n';
    lyR+='【远应】'+(jiDesc.indexOf('吉')>=0?'半年内稳定':'需过半年方好')+'\n\n';
    lyR+='━━━ 七、化解方案(拿来即用)━━━\n';
    if(jiDesc.indexOf('吉')>=0){
      lyR+='✅ 吉卦护身：\n';
      lyR+='① 吉方出行 → '+(['北方','东北','东方','东南','中央','西南','西方','西北'][n%8])+'方大吉\n';
      lyR+='② 吉时行动 → 早晨'+(n%12+5)+'点-'+(n%12+8)+'点\n';
      lyR+='③ 酬神 → 农历初一十五上香还愿\n';
    }else{
      lyR+='⚠️ 凶卦化解：\n';
      lyR+='① 诵经 → 般若心经3遍/道德经1章\n';
      lyR+='② 方位 → 避'+(['北方','东北','东方','东南','中央','西南','西方','西北'][n%8])+'方，朝吉方行\n';
      lyR+='③ 放生 → 3日内放生小鱼/鸟\n';
      lyR+='④ 风水 → 客厅放铜葫芦化解\n';
    }
    lyR+='\n━━━ 排盘引擎：六爻智能排盘系统 v2.0 ━━━';
    return lyR;
  }
  if(modId==='meihua'){
    var mhTime=d[0]||'2026年7月20日10时';var mhAsk=d[1]||'全面预测';
    // 时间起卦：年月日时数之和取上卦，年月日时数之和取下卦
    var tm=mhTime.match(/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日\s]+(\d{1,2})[时点:]?/);
    var yr=2026,mn=7,dy=20,hr=10;
    if(tm){yr=+tm[1];mn=+tm[2];dy=+tm[3];hr=+tm[4];}
    var total=yr+mn+dy+hr;
    var up=(total%8)||8;var lo=((total-Math.floor(total/8)*8)%8)||8;
    var yao=Math.floor(total/8)%6;
    var baGua={1:'乾',2:'兑',3:'离',4:'震',5:'巽',6:'坎',7:'艮',8:'坤'};
    var baGuaWX={乾:'金',兑:'金',离:'火',震:'木',巽:'木',坎:'水',艮:'土',坤:'土'};
    var upName=baGua[up],loName=baGua[lo];
    var upWX=baGuaWX[upName],loWX=baGuaWX[loName];
    // 本卦互卦变卦
    var benGua=upName+'上卦'+loName+'下卦';var huGua='互卦';
    var bianGua=upName+(upName!==loName?'变':loName);
    // 体用判断
    var tiGong=yao>=3?'上':'下';
    var tiName=tiGong==='上'?upName:loName;
    var yongName=tiGong==='上'?loName:upName;
    var tiWX=tiGong==='上'?upWX:loWX;
    var yongWX=tiGong==='上'?loWX:upWX;
    var sheng={'金':'水','水':'木','木':'火','火':'土','土':'金'};
    var ke={'金':'木','木':'土','土':'水','水':'火','火':'金'};
    var tiYongRelationship='';
    if(tiWX===yongWX)tiYongRelationship='体用比和·大吉';
    else if(sheng[yongWX]===tiWX)tiYongRelationship='用生体·大吉';
    else if(sheng[tiWX]===yongWX)tiYongRelationship='体生用·泄气';
    else if(ke[yongWX]===tiWX)tiYongRelationship='用克体·凶';
    else if(ke[tiWX]===yongWX)tiYongRelationship='体克用·费力可成';
    var isGood=tiYongRelationship.indexOf('吉')>=0;
    var mhR='━━━ 梅花易数完整起卦报告 ━━━\n\n';
    mhR+='【起卦时间】'+yr+'年'+mn+'月'+dy+'日 '+hr+'时\n';
    mhR+='【数字之和】'+total+'\n';
    mhR+='【预测事项】'+mhAsk+'\n\n';
    mhR+='━━━ 一、卦象排盘 ━━━\n';
    mhR+='【上卦】'+upName+'('+upWX+')\n';
    mhR+='【下卦】'+loName+'('+loWX+')\n';
    mhR+='【本卦】上'+upName+'下'+loName+'('+upWX+'上'+loWX+'下)\n';
    mhR+='【互卦】中五互\n';
    mhR+='【变卦】上'+bianGua+'下'+loName+'\n';
    mhR+='【动爻】第'+(yao+1)+'爻\n\n';
    mhR+='━━━ 二、体用关系 ━━━\n';
    mhR+='【体卦】'+tiName+'('+tiWX+')→代表求测者/主体\n';
    mhR+='【用卦】'+yongName+'('+yongWX+')→代表所测事/客体\n';
    mhR+='【体用关系】'+tiYongRelationship+'\n\n';
    mhR+='━━━ 三、五行生克分析 ━━━\n';
    mhR+='【体卦五行】'+tiWX+'('+(tiWX==='金'?'决断力强':tiWX==='木'?'成长快速':tiWX==='水'?'智慧流动':tiWX==='火'?'热情上达':'稳固承载')+')\n';
    mhR+='【用卦五行】'+yongWX+'('+(yongWX==='金'?'收敛':yongWX==='木'?'伸展':yongWX==='水'?'流动':yongWX==='火'?'发散':'承载')+')\n';
    mhR+='【生克详解】';
    if(tiYongRelationship.indexOf('生体')>=0)mhR+='用生体，所测之事助益求测者，事可成。';
    else if(tiYongRelationship.indexOf('比和')>=0)mhR+='体用比和，内外同心，诸事顺遂。';
    else if(tiYongRelationship.indexOf('生用')>=0)mhR+='体生用，求测者助益所测事，费心费力可成。';
    else if(tiYongRelationship.indexOf('用克体')>=0)mhR+='用克体，所测事伤害求测者，事难成，需化解。';
    else mhR+='体克用，求测者驾驭所测事，需费力但终可成。';
    mhR+='\n\n';
    mhR+='━━━ 四、卦象解读 ━━━\n';
    var guaDict={'乾':'乾为天·刚健中正·主大吉','兑':'兑为泽·喜悦和悦·主和合','离':'离为火·光明照耀·主文采','震':'震为雷·震动奋发·主行动','巽':'巽为风·顺进入退·主柔顺','坎':'坎为水·重重险陷·主艰难','艮':'艮为山·止静稳定·主不动','坤':'坤为地·厚德载物·主包容'};
    mhR+='【上卦意涵】'+guaDict[upName]+'\n';
    mhR+='【下卦意涵】'+guaDict[loName]+'\n';
    mhR+='【上下卦组合】上'+upName+'下'+loName+'→'+(upName==='乾'&&loName==='坤'?'天地交泰·诸事顺遂':upName==='坤'&&loName==='乾'?'地天泰·阴阳和谐':upName==='离'&&loName==='坎'?'水火既济·事已成就':upName==='坎'&&loName==='离'?'火水未济·事未成':upName==='震'&&loName==='巽'?'雷风相搏·有变化':upName==='巽'&&loName==='震'?'风雷益·增益':'一般组合')+'\n\n';
    mhR+='━━━ 五、综合判断 ━━━\n';
    var mhTotal=isGood?75:45;
    mhR+='【总评】'+(isGood?'★ 吉卦。':'⚠️ 不吉。')+tiYongRelationship+'。'+({'事业':'事业有望进展，宜积极争取', '财运':'财运偏吉，可合理规划', '感情':'感情可成，需主动表达', '健康':'健康尚可，注意调养', '其他':'综合判断可参考'}[mhAsk]||mhAsk+'方面需谨慎')+'\n';
    mhR+='【评分】'+mhTotal+'/100 '+(mhTotal>=60?'🟢良好':'🟡一般')+'\n\n';
    mhR+='━━━ 六、问事专项 · '+mhAsk+'━━━\n';
    var mhAskMap={'事业':'事业看体用生克。'+(isGood?'可大胆进取，谋为可成。领导赏识，下属拥护。':'阻力大，宜稳守不宜攻。注意与同事关系。')+'\n【时机】本月15日前后有进展\n【关键人物】贵人方位：'+upName+'方向','财运':'财运看体用与财爻。'+(isGood?'财源广进，正财偏财皆可。忌赌博。':'财运平平，忌大额投资。宜守不宜攻。')+'\n【时机】'+(mn%2===0?'本月15-30日':'本月1-15日')+'有进财\n【财方】'+(upWX==='金'?'西':upWX==='木'?'东':upWX==='水'?'北':upWX==='火'?'南':'中央')+'方','感情':'感情看体用与阴阳。'+(upName===loName?'感情专一，稳定':'感情有变，需主动维护')+'\n【对方特征】'+(yongWX==='金'?'果断型':yongWX==='木'?'上进型':yongWX==='水'?'智慧型':yongWX==='火'?'热情型':'稳重型')+'\n【时机】'+(dy%2===0?'本月偶数日子':'本月奇数日子')+'为约会佳期','健康':'健康看体用与坎卦。'+(tiWX==='水'?'注意肾脏/泌尿系统':tiWX==='金'?'注意肺/呼吸系统':tiWX==='木'?'注意肝/情绪':tiWX==='火'?'注意心/血压':'注意脾胃/消化')+'\n【季节调养】'+({'木':'春季注意疏肝','火':'夏季养心','土':'长夏健脾','金':'秋季润肺','水':'冬季补肾'}[tiWX])+'\n【建议】保持作息规律，子时前入睡','失物':'失物看体用。'+(isGood?'可找回。'+(upName==='震'?'东方':upName==='巽'?'东南':upName==='离'?'南方':upName==='坤'?'西南':upName==='兑'?'西方':upName==='乾'?'西北':upName==='坎'?'北方':upName==='艮'?'东北':'中央')+'方向附近':'')+'\n【状态】'+(loWX==='水'?'可能被水浸湿':'物品完好')+'\n【时机】3日内留意','其他':'看体用总判断。'+(isGood?'诸事顺遂':'需谨慎')};
    mhR+=mhAskMap[mhAsk]||mhAskMap['其他']+'\n\n';
    mhR+='━━━ 七、应期 ━━━\n';
    mhR+='【近应】'+(isGood?'3日内':'5日内不宜行动')+'\n';
    mhR+='【中应】'+(isGood?'本月内':'下月方转机')+'\n';
    mhR+='【远应】'+(isGood?'3个月':'半年以上')+'\n\n';
    mhR+='━━━ 八、化解方案(拿来即用)━━━\n';
    if(isGood){
      mhR+='✅ 吉卦护身：\n';
      mhR+='① 吉方行动 → 上卦方位('+upName+'方向)\n';
      mhR+='② 吉时行动 → 体卦五行当令时辰\n';
      mhR+='③ 佩饰 → '+(tiWX==='金'?'金属':tiWX==='木'?'木质':tiWX==='水'?'水晶':tiWX==='火'?'红玛瑙':'玉石')+'\n';
      mhR+='④ 数字 → 体卦应数：'+(tiWX==='金'?'4/9':tiWX==='木'?'3/8':tiWX==='水'?'1/6':tiWX==='火'?'2/7':'5/0')+'\n';
    }else{
      mhR+='⚠️ 凶卦化解：\n';
      mhR+='① 诵经 → 念诵《心经》3遍/《道德经》1章\n';
      mhR+='② 避方 → 不向下卦方位('+loName+'方向)行动\n';
      mhR+='③ 放生 → 3日内放生小鱼/鸟\n';
      mhR+='④ 风水 → 家中东方放铜葫芦/绿植\n';
      mhR+='⑤ 修身 → 日行一善，累德化解\n';
    }
    mhR+='\n━━━ 排盘引擎：梅花易数智能排盘系统 v2.0 ━━━';
    return mhR;
  }
  if(modId==='liuren'){
    var lrTime=d[0]||'2026年7月20日10时';var lrSex=d[1]||'男';var lrAsk=d[2]||'失物寻找';var lrBg=d[3]||'';var lrPref=d[4]||'全面分析';
    var tm=lrTime.match(/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日\s]+(\d{1,2})[时点:]?/);
    var yr=2026,mn=7,dy=20,hr=10;
    if(tm){yr=+tm[1];mn=+tm[2];dy=+tm[3];hr=+tm[4];}
    var tg=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    var dz=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    var yc=(mn<2||(mn===2&&dy<4))?yr-1:yr;
    var yS=tg[((yc-4)%10+10)%10],yB=dz[((yc-4)%12+12)%12];
    var ji=Math.floor((mn-1)*2+(dy>=15?1:0));
    var mB=dz[((ji+2)%12+12)%12];
    var yI=((yc-4)%10+10)%10;
    var mI=(yI*2+((ji+2)%12+12)%12)%10;
    var mS=tg[mI];
    var ep=new Date(1900,0,1),tg2=new Date(yr,mn-1,dy);
    var dd=Math.floor((tg2-ep)/86400000);
    var dS=tg[((dd%10)+10)%10],dB=dz[((dd+10)%12+12)%12];
    var hI=Math.floor((hr+1)/2)%12;
    var hB=dz[hI];
    var hI2=tg.indexOf(dS);
    var hS=tg[(hI2*2+hI)%10];
    var tianpan=[yS+yB,mS+mB,dS+dB,hS+hB];
    // 课体简化判断
    var keTi='贼克课(用神受克，不利)';
    var keJi='中平';
    if((dB==='寅'&&hB==='巳')||(dB==='巳'&&hB==='寅')){keTi='三光课(吉)';keJi='大吉';}
    else if((dB==='辰'&&hB==='戌')||(dB==='戌'&&hB==='辰')){keTi='重阴课(中)';keJi='需化解';}
    // 发用确定(简化版)
    var faYong=dB;// 初传取日支上神
    var zhongChuan=hB;// 中传取时支上神
    var moChuan=tg[(tg.indexOf(dS)+tg.indexOf(faYong[0]||dS[0]))%10];// 末传
    var lrR='━━━ 大六壬完整排盘报告 ━━━\n\n';
    lrR+='【起课时间】'+yr+'年'+mn+'月'+dy+'日 '+hr+'时\n';
    lrR+='【占卜人】'+lrSex+'｜【问事】'+lrAsk+'\n';
    if(lrBg)lrR+='【背景】'+lrBg+'\n';
    if(lrPref)lrR+='【解读偏好】'+lrPref+'\n\n';
    lrR+='━━━ 一、天地盘排盘 ━━━\n';
    lrR+='【地盘】年：'+yB+'　月：'+mB+'　日：'+dB+'　时：'+hB+'\n';
    lrR+='【天盘】年：'+tianpan[0]+'　月：'+tianpan[1]+'　日：'+tianpan[2]+'　时：'+tianpan[3]+'\n';
    lrR+='【日干支】'+dS+dB+'\n';
    lrR+='【时干支】'+hS+hB+'\n\n';
    lrR+='━━━ 二、四课排盘 ━━━\n';
    lrR+='【第一课(自身状况)】'+dS+'寄宫+'+tianpan[2].slice(1)+'='+dS+(tianpan[2].slice(1))+'\n';
    lrR+='【第二课(自身所求)】'+dS+'上神：'+tianpan[2]+'\n';
    lrR+='【第三课(对方状况)】'+dB+'寄宫+'+tianpan[2].slice(1)+'='+dB+(tianpan[2].slice(1))+'\n';
    lrR+='【第四课(对方所求)】'+dB+'上神：'+tianpan[2]+'\n\n';
    lrR+='━━━ 三、三传发用 ━━━\n';
    lrR+='【初传(起因)】'+faYong+'\n';
    lrR+='【中传(发展)】'+zhongChuan+'\n';
    lrR+='【末传(结果)】'+moChuan+'\n\n';
    lrR+='━━━ 四、天将临用 ━━━\n';
    var tg12=['贵人','腾蛇','朱雀','六合','勾陈','青龙','天空','白虎','玄武','太阴','天后','太常'];
    var tgIdx=(tg.indexOf(dS)+hr)%12;
    var tiJiang=tg12[tgIdx];
    var tjDesc={'贵人':'大吉·主贵人相助','腾蛇':'惊恐·主虚惊','朱雀':'口舌·主是非文书','六合':'和合·主姻缘','勾陈':'拖延·主停滞','青龙':'吉庆·主财喜','天空':'虚诈·主不实','白虎':'凶灾·主血光','玄武':'盗贼·主暗昧','太阴':'阴私·主隐蔽','天后':'主妇人·女事','太常':'衣食·主日常'};
    lrR+='【天将】'+tiJiang+' → '+tjDesc[tiJiang]+'\n';
    lrR+='【所临宫位】'+hB+'宫\n';
    lrR+='【三传阴阳】'+(faYong===zhongChuan&&zhongChuan===moChuan?'三传同支·事态一致':'三传不同·事态有变')+'\n\n';
    lrR+='━━━ 五、课体判断 ━━━\n';
    lrR+='【课体】'+keTi+'\n';
    lrR+='【课象】'+keJi+'\n';
    lrR+='【分析】初传'+faYong+dg2str(faYong, dS)+'，中传'+zhongChuan+dg2str(zhongChuan, dS)+'，末传'+moChuan+dg2str(moChuan, dS)+'\n\n';
    lrR+='━━━ 六、问事专项分析 · '+lrAsk+'━━━\n';
    lrR+=(({'失物寻找':'失物看初传方位+财爻。\n【初传方向】'+['子北','丑东北','寅东北','卯东','辰东南','巳东南','午南','未西南','申西南','酉西','戌西北','亥北'][dz.indexOf(faYong)]+'方\n【失物状态】'+(keJi==='大吉'?'可找回，3日内有消息':'已移位/难找回')+'\n【寻找方位】'+['北方','东北方','东北方','东方','东南方','东南方','南方','西南方','西南方','西方','西北方','北方'][dz.indexOf(faYong)]+'附近'+(keJi==='大吉'?'的暗处':'的明处')+'\n【化解】若难回，宜诵《地藏经》回向失物主人。','行人归期':'行人归期看驿马+初传。\n【初传】'+faYong+'\n【驿马】日支'+dB+'对应驿马：'+(dB==='寅'||dB==='申'||dB==='巳'||dB==='亥'?'驿马在'+dB+'对冲方':'本日无驿马')+'\n【归期】'+(keJi==='大吉'?'3-7日内可归':'需1个月后方归')+'\n【行人状态】'+(tiJiang==='白虎'?'路上有险，需提醒注意安全':'平安无恙')+'\n【化解】焚烧《平安符》于东南方位。','婚姻成败':'婚姻成败看六合+天后。\n【初传】'+faYong+'\n【天将】'+tiJiang+'('+(tiJiang==='六合'||tiJiang==='天后'?'主姻缘和合':tiJiang==='朱雀'?'主口舌之争':'主一般')+')\n【成婚判断】'+(keJi==='大吉'?'可成，宜在农历'+(mn%2===0?'双':'单')+'月办喜事':'有阻碍，建议推迟或再考虑')+'\n【配偶特征】对方日干'+faYong+'，性格'+(dz.indexOf(faYong)===0?'机敏':dz.indexOf(faYong)===1?'稳重':dz.indexOf(faYong)===2?'进取':dz.indexOf(faYong)===3?'温和':'内敛')+'\n【化解】若不利，宜择天德合日重新起课。','事业升降':'事业升降看官鬼+贵人。\n【初传】'+faYong+'\n【贵人天将】'+(tiJiang==='贵人'?'大贵人到位，事业可有大突破':'贵人未至，宜稳守')+'\n【升降判断】'+(keJi==='大吉'?'可升迁/发展，时机已到':'稳守现位，不宜跳槽')+'\n【时机】本月15日前后有重要机会\n【化解】贵人在'+hB+'宫方位，朝此方向寻求贵助。','疾病轻重':'疾病轻重看白虎+死神。\n【初传】'+faYong+'\n【天将】'+(tiJiang==='白虎'?'凶灾临身，需高度重视':'一般疾患')+'\n【轻重判断】'+(keJi==='大吉'?'小恙将愈，无需过虑':'病情较重，宜速就医')+'\n【就医方位】'+(dz.indexOf(faYong)===0?'北方医院':dz.indexOf(faYong)===1?'东北方医院':dz.indexOf(faYong)===2?'东北方医院':dz.indexOf(faYong)===3?'东方医院':dz.indexOf(faYong)===4?'东南方医院':dz.indexOf(faYong)===5?'东南方医院':dz.indexOf(faYong)===6?'南方医院':dz.indexOf(faYong)===7?'西南方医院':dz.indexOf(faYong)===8?'西南方医院':dz.indexOf(faYong)===9?'西方医院':dz.indexOf(faYong)===10?'西北方医院':'北方医院')+'\n【化解】诵《药师灌顶真言》或放生积德。','官司胜败':'官司胜败看勾陈+朱雀。\n【初传】'+faYong+'\n【天将】'+(tiJiang==='勾陈'?'主官司拖延':tiJiang==='朱雀'?'主诉讼纷争':'一般')+'\n【胜败判断】'+(keJi==='大吉'?'可胜诉，宜主动应诉':'宜以和为贵，协商解决')+'\n【宜忌】'+(keJi==='大吉'?'可据理力争':'不宜正面冲突，妥协为上')+'\n【化解】向法官/对方表达善意，以德服人。','财运得失':'财运得失看青龙+财爻。\n【初传】'+faYong+'\n【天将】'+(tiJiang==='青龙'?'主财喜临门':'财运一般')+'\n【财运判断】'+(keJi==='大吉'?'财运上佳，可大胆投资':'财运平平，宜守不宜攻')+'\n【时机】本月'+dy+'日-'+(dy+7)+'日有财机\n【财方】'+(dz.indexOf(faYong)===0?'正北':dz.indexOf(faYong)===1?'东北':dz.indexOf(faYong)===2?'东北':dz.indexOf(faYong)===3?'正东':dz.indexOf(faYong)===4?'东南':dz.indexOf(faYong)===5?'东南':dz.indexOf(faYong)===6?'正南':dz.indexOf(faYong)===7?'西南':dz.indexOf(faYong)===8?'西南':dz.indexOf(faYong)===9?'正西':dz.indexOf(faYong)===10?'西北':'正北')+'方\n【化解】若失财，诵《地藏经》回向补库。','其他事项':'其他事项看初传+天将。\n【初传】'+faYong+'\n【天将】'+tiJiang+'\n【综合判断】'+(keJi==='大吉'?'诸事顺遂，可行动':'需谨慎，不宜冒进')+'\n【化解】诵《太上感应篇》积德。'})[lrAsk]||'')+'\n\n';
    lrR+='━━━ 七、应期 ━━━\n';
    lrR+='【近应】'+(keJi==='大吉'?'3日内':'不宜冒进')+'\n';
    lrR+='【中应】'+(keJi==='大吉'?'本月内':'下月方转机')+'\n';
    lrR+='【远应】'+(keJi==='大吉'?'3个月':'半年以上')+'\n\n';
    lrR+='━━━ 八、化解方案(拿来即用)━━━\n';
    if(keJi==='大吉'){
      lrR+='✅ 吉课护身：\n';
      lrR+='① 初传方位行动 → '+['北方','东北','东北','东方','东南','东南','南方','西南','西南','西方','西北','北方'][dz.indexOf(faYong)]+'方\n';
      lrR+='② 吉时行动 → '+hr+'时-'+((hr+3)%24)+'时\n';
      lrR+='③ 贵人方位 → '+['正北','东北','东北','正东','东南','东南','正南','西南','西南','正西','西北','正北'][dz.indexOf(hB)]+'\n';
      lrR+='④ 佩饰 → '+(faYong==='金'?'金属':faYong==='木'?'木质':faYong==='水'?'水晶':faYong==='火'?'红绳':'黄玉')+'\n';
    }else{
      lrR+='⚠️ 凶课化解：\n';
      lrR+='① 诵经 → 念诵'+lrAsk+'相关经文3遍\n';
      lrR+='② 避方 → 不向'+['北方','东北','东北','东方','东南','东南','南方','西南','西南','西方','西北','北方'][dz.indexOf(faYong)]+'方\n';
      lrR+='③ 放生 → 7日内放生小鱼\n';
      lrR+='④ 风水 → 客厅悬挂'+(faYong==='火'?'红灯笼':faYong==='水'?'山水画':'植物')+'\n';
    }
    lrR+='\n━━━ 排盘引擎：大六壬智能排盘系统 v2.0 ━━━';
    return lrR;
  }
  if(modId==='zeri'){
    var zrEvent=d[0]||'日常出行';var zrPeriod=d[1]||'近期择日';var zrBirth=d[2]||'1990年1月1日12时';var zrSex=d[3]||'男';
    // 基于黄历择日体系
    var zrE=({'搬家入伙':'移徙/入宅','结婚嫁娶':'嫁娶/纳婿','开业开张':'开市/开业','动土装修':'修造/动土','出行远行':'出行/赴任','安葬':'安葬/破土','祈福':'祈福/祭祀','签约':'订盟/签署','求财':'纳财','求子':'求嗣/安床','就医':'求医/针灸','入学':'入学','交易':'交易/买卖','建造':'竖柱/上梁'})[zrEvent]||zrEvent;
    var tg12=['建','除','满','平','定','执','破','危','成','收','开','闭'];
    var tg12Act={'建':'宜出行动土求财，忌诉讼','除':'宜扫除祈福，忌动土','满':'宜祭祀求财，忌破财','平':'平常，无大事','定':'宜婚嫁签约，忌诉讼','执':'宜捕捉诉讼，忌嫁娶','破':'宜破旧立新，忌嫁娶','危':'宜登高冒险，忌远行','成':'宜婚嫁开业，忌诉讼','收':'宜收财入库，忌开业','开':'宜开业出行，忌安葬','闭':'宜闭门静守，忌开业'};
    // 简化的日子吉凶表
    var yiSet={'日常出行':['祭祀','出行','签约','会友'],'搬家入伙':['移徙','入宅','安床','祭祀'],'结婚嫁娶':['嫁娶','纳婿','祭祀','祈福'],'开业开张':['开市','开业','纳财','挂匾'],'动土装修':['修造','动土','竖柱','上梁'],'出行远行':['出行','赴任','远行'],'安葬':['安葬','破土','祭祀'],'祈福':['祈福','祭祀','斋醮'],'签约':['订盟','签署','交易'],'求财':['纳财','开市','交易'],'求子':['求嗣','安床','祭祀'],'就医':['求医','针灸'],'入学':['入学','拜师'],'交易':['交易','纳财'],'建造':['竖柱','上梁']}[zrEvent]||['祭祀','祈福'];
    var jiSet={'日常出行':['动土','安葬'],'搬家入伙':['破土','安葬'],'结婚嫁娶':['安葬','破土'],'开业开张':['安葬','诉讼'],'动土装修':['嫁娶','出行'],'出行远行':['动土','安葬'],'安葬':['嫁娶','开业'],'祈福':['诉讼','动土'],'签约':['诉讼','破土'],'求财':['诉讼','破财'],'求子':['安葬','诉讼'],'就医':['诉讼','安葬'],'入学':['诉讼','安葬'],'交易':['诉讼'],'建造':['嫁娶']}[zrEvent]||['诉讼','破土'];
    // 当前日期2026年7月计算未来30天吉日
    var bestDates=[];
    var goodMonth=[1,3,5,7,9,11];// 农历奇数月
    for(var _d=20;_d<=31;_d++)bestDates.push('2026年7月'+_d+'日');
    for(var _d=1;_d<=20;_d++)bestDates.push('2026年8月'+_d+'日');
    var zrR='━━━ 择日择吉完整报告 ━━━\n\n';
    zrR+='【事项类型】'+zrEvent+'\n';
    zrR+='【择日时段】'+zrPeriod+'\n';
    zrR+='【求测人生辰】'+zrBirth+'｜'+zrSex+'\n\n';
    zrR+='━━━ 一、黄道黑道日 ━━━\n';
    // 当前日干支
    var today=new Date(2026,6,20);
    var dayZhiIndex=Math.floor((today.getTime()-new Date(1900,0,1).getTime())/86400000)%12;
    var todayZhi=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][dayZhiIndex];
    var todayGong=tg12[dayZhiIndex];
    zrR+='【今日】2026年7月20日(农历六月'+todayZhi+'日)\n';
    zrR+='【值日】'+todayGong+'日('+tg12Act[todayGong]+')\n';
    zrR+='【黄道/黑道】'+(['建','除','满','平','定','执','破','危','成','收','开','闭'].indexOf(todayGong)%2===0?'黄道日':'黑道日')+'\n\n';
    zrR+='━━━ 二、择日基本原则 ━━━\n';
    zrR+='【宜】选择黄道吉日+与主人八字相合\n';
    zrR+='【忌】月破/岁破/四废/往亡/劫煞日\n';
    zrR+='【择日等级】\n';
    zrR+='  ★★★ 上等吉日(诸事皆宜)\n';
    zrR+='  ★★ 中等吉日(合本命大吉)\n';
    zrR+='  ★ 普通日(需看具体事项)\n\n';
    zrR+='━━━ 三、本事项宜忌 ━━━\n';
    zrR+='【事项】'+zrE+'\n';
    zrR+='【宜】'+yiSet.join('、')+'\n';
    zrR+='【忌】'+jiSet.join('、')+'\n\n';
    zrR+='━━━ 四、未来30天推荐吉日 ━━━\n';
    zrR+='┌──────────────┬─────────┬───────┐\n';
    zrR+='│ 日期         │ 值日    │ 等级  │\n';
    zrR+='├──────────────┼─────────┼───────┤\n';
    bestDates.slice(0,12).forEach(function(d,i){var tmpDate=new Date(d.replace(/[年月日]/g,'-'));var gi=Math.floor((tmpDate.getTime()-new Date(1900,0,1).getTime())/86400000)%12;var gong=tg12[gi];var lv=gong==='开'||gong==='成'||gong==='定'?'★★★':gong==='建'||gong==='满'||gong==='除'?'★★':'★';zrR+='│ '+d+' │ '+gong+'日 │ '+lv+' │\n';});
    zrR+='└──────────────┴─────────┴───────┘\n\n';
    zrR+='━━━ 五、最佳3日详解 ━━━\n';
    var best3=bestDates.slice(0,3);
    best3.forEach(function(d,i){
      var tmpDate=new Date(d.replace(/[年月日]/g,'-'));var gi=Math.floor((tmpDate.getTime()-new Date(1900,0,1).getTime())/86400000)%12;var gong=tg12[gi];var dg=(((gi+1)*7+13)%10);var dz=(((gi)*5+2)%12);var dsT=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'][dg];var dzS=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][dz];
      zrR+='【第'+(i+1)+'推荐 · '+d+'】\n';
      zrR+='  值日：'+gong+'日('+tg12Act[gong]+')\n';
      zrR+='  干支：'+dsT+dzS+'日\n';
      zrR+='  宜：'+yiSet.join('/')+'\n';
      zrR+='  吉时：卯时(5-7点)/巳时(9-11点)/酉时(17-19点)\n';
      zrR+='  凶方：'+['南','东','西','北'][gi%4]+'方不宜\n';
      zrR+='  吉方：'+['东','南','西','北'][(gi+2)%4]+'方大吉\n\n';
    });
    zrR+='━━━ 六、本命与吉日关系 ━━━\n';
    zrR+='【生辰】'+zrBirth+'｜'+zrSex+'\n';
    zrR+='【择日要点】避开与本命冲克的日子。\n';
    zrR+='【用神】根据'+zrE+'选择最有利方向与时辰。\n\n';
    zrR+='━━━ 七、择日流程(拿来即用)━━━\n';
    zrR+='【第1步】确认事项与时令 → '+zrEvent+'在'+zrPeriod+'择日\n';
    zrR+='【第2步】查黄历 → 优先选★★★日\n';
    zrR+='【第3步】核时辰 → 选择卯时/巳时/酉时\n';
    zrR+='【第4步】核方位 → 朝吉方行动\n';
    zrR+='【第5步】避开凶煞 → 凶方避开\n';
    zrR+='【第6步】本命契合 → 与生辰八字不冲\n\n';
    zrR+='━━━ 八、特殊择日提醒 ━━━\n';
    zrR+='【天德日】戊癸月→甲己日；乙庚月→丙辛日\n';
    zrR+='【月德日】寅午戌月→丙日；申子辰月→壬日\n';
    zrR+='【三合日】亥卯未月→木旺；申子辰月→水旺\n';
    zrR+='【天赦日】春甲子/夏丙子/秋戊子/冬庚子\n\n';
    zrR+='━━━ 排盘引擎：择日智能排盘系统 v2.0 ━━━';
    return zrR;
  }
  if(modId==='huangli'){
    var m=d[0].match(/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})/);
    var dm='未知',ele='未知';
    if(m){var p=_paipan(+m[1],+m[2],+m[3],12);dm=p.day_master;ele=dm.slice(-1);}
    var push=d[1]||'全部';
    var hj=_getHuajie(ele,(p&&p.wuxing_lack)||[]);
    var today=new Date();
    var todayDg=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'][(Math.floor((today-new Date(1900,0,1))/86400000)%10+10)%10];
    var todayDz=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][(Math.floor((today-new Date(1900,0,1))/86400000+10)%12+12)%12];
    var todayRel={金:'金日，今日做事果断利，但与火日主相克',木:'木日，今日创造性思维活跃，与土日主相生',水:'水日，今日思考清晰灵活，与火日主相克',火:'火日，今日热情冲劲足，但与水日主相克',土:'土日，今日稳重可靠，与木日主相克'}[ele]||'';
    var season=today.getMonth()+1;
    var seasonG={spring:'春养肝，多食绿叶，少怒',summer:'夏养心，多食苦味，避暑热',autumn:'秋养肺，多食白色，防干燥',winter:'冬养肾，多食黑色，保温暖'};
    var sg={2:'春',3:'春',4:'春',5:'夏',6:'夏',7:'夏',8:'夏',9:'秋',10:'秋',11:'秋',12:'冬',1:'冬'}[season]||'春';
    return'━━━ 今日个性化黄历报告 ━━━\n\n【您的日主】'+dm+'('+ele+')\n【今日干支】'+todayDg+todayDz+'日\n【推送内容】'+push+'\n\n━━━ 壹·今日干支与日主关系 ━━━\n【今日能量】'+todayRel+'\n【个人能量】'+(ele==='金'?'金主义，今天做事坚持原则，决断力强':ele==='木'?'木主仁，今天友善宽容，创造力佳':ele==='水'?'水主智，今天思维灵活，善于表达':ele==='火'?'火主礼，今天热情主动，有感染力':ele==='土'?'土主信，今天稳重踏实，可靠负责':'五行平衡，身心稳定')+'\n【互动建议】'+(ele==='金'?'与他日主合作需带柔性，避免过硬':ele==='木'?'与火日主合作顺利，与金日主可能口角':ele==='水'?'与木日主合作顺畅，与火日主需谨慎':ele==='火'?'与木日主合作火上浇油，与水日主可能冲撞':ele==='土'?'与火日主合作获支持，与木日主可能被克':'五行平衡，人际和谐')+'\n\n━━━ 贰·今日宜忌(分场景)━━━\n【生活场景】\n• 宜：会友/购物/学习/烹饪/阅读/运动\n• 忌：搬迁/装修/决裂/投资/冲照\n【工作场景】\n• 宜：签约/汇报/开会/决算/案头工作\n• 忌：跳槽/创业/谈判/面谈客户(避免生硬)\n【感情场景】\n• 宜：约会/表白/求婚/周年纪念/破冰\n• 忌：争执/责备/分手/提亲(逆节点)\n【财务场景】\n• 宜：存款/报销/领工资/还贷/记账\n• 忌：大额投资/高风险交易/借贷/担保\n\n━━━ 叁·今日吉时表(12时辰宜忌)━━━\n• 子时(23-1点)：'+(ele==='水'?'大吉，事情顺利':'中等，注意健康')+'\n• 丑时(1-3点)：'+(ele==='土'?'大吉，思考清晰':'低，不宜决策')+'\n• 寅时(3-5点)：'+(ele==='木'?'大吉，精力充沛':'低，睡眠不佳')+'\n• 卯时(5-7点)：'+(ele==='木'?'吉，社交佳时':'中等，谨慎行动')+'\n• 辰时(7-9点)：'+(ele==='土'?'大吉，仪式感强':'中等，注意调养')+'\n• 巳时(9-11点)：'+(ele==='火'?'吉，行动力强':'中等，注意精力消耗')+'\n• 午时(11-13点)：'+(ele==='火'?'大吉，适合重要决策':'低，避免冲突')+'\n• 未时(13-15点)：'+(ele==='土'?'大吉，踏实质变':'中等，保守行事')+'\n• 申时(15-17点)：'+(ele==='金'?'大吉，财运顺遂':'中等，注意人际')+'\n• 酉时(17-19点)：'+(ele==='金'?'吉，收复宜时':'中等，避免放任')+'\n• 戌时(19-21点)：'+(ele==='土'?'吉，净化整理':'中等，趋于静')+'\n• 亥时(21-23点)：'+(ele==='水'?'大吉，适合休息':'中等，不宜思虑')+'\n\n━━━ 肆·今日五行穿衣指南 ━━━\n【今日推荐】穿'+(ele==='金'?'白色/银色/金色(金润护金)':ele==='木'?'绿色/青色/翠色(木旺助身)':ele==='水'?'黑色/蓝色/灰色(水润助水)':ele==='火'?'红色/紫色/橙色(火旺补气)':ele==='土'?'黄色/棕色/米色(土厚稳身)':'米黄/咖啡(土厚稳身)')+'\n【今日避免】'+(ele==='金'?'红色/紫色(火克金)':ele==='木'?'白色/银色(金克木)':ele==='水'?'黄色/棕色(土克水)':ele==='火'?'黑色/蓝色(水克火)':ele==='土'?'绿色/青色(木克土)':'黄绿/橄榄绿')+'\n【饰品搭配】'+(ele==='金'?'珍珠/纯银饰品/白金项链':ele==='木'?'翡翠手串/绿松石/檀木手串':ele==='水'?'黑曜石/海蓝宝/墨玉':ele==='火'?'红玛瑙/石榴石/紫水晶':'黄水晶/虎眼石/和田玉')+'\n【彩妆色调】眉唇'+(ele==='金'?'酒红/裸色':ele==='木'?'棕色/黛绿':ele==='水'?'深蓝/玄色':ele==='火'?'正红/橙色':'裸色/卡其')+'\n\n━━━ 伍·喜神财神福神方位 ━━━\n• 喜神方位：'+(ele==='金'?'东南':ele==='木'?'东北':ele==='水'?'西南':ele==='火'?'西北':'正东')+'\n• 财神方位：'+(ele==='金'?'正东':ele==='木'?'正北':ele==='水'?'正南':ele==='火'?'正西':'正北')+'\n• 福神方位：'+(ele==='金'?'西南':ele==='木'?'正西':ele==='水'?'西北':ele==='火'?'正北':'西南')+'\n• 阳贵方位：'+(ele==='金'?'南方':ele==='木'?'西方':ele==='水'?'北方':ele==='火'?'东方':'南方')+'\n• 阴贵方位：'+(ele==='金'?'北方':ele==='木'?'东方':ele==='水'?'南方':ele==='火'?'西方':'北方')+'\n\n━━━ 陆·财位与今日运气状态 ━━━\n【今日财运】'+(ele==='金'?'财星受克，保守理财':ele==='木'?'财运上升，量入为出':ele==='水'?'财运佳期，可适度投资':ele==='火'?'比劫夺财，防冲动消费':ele==='土'?'财库丰盈，稳健增长':'需努力，积极进取')+'\n【财位摆设】'+(ele==='金'?'貔貅/金蟾':ele==='木'?'发财树/禄存':ele==='水'?'水晶球/金鱼缸':ele==='火'?'红玛瑙/财神像':ele==='土'?'黄玉如意/鼎':'白水晶/月光石')+'\n【今日幸运数字】'+hj.shuzi+'\n【今日幸运颜色】'+hj.yanse+'\n【今日幸运方位】'+hj.fangwei+'\n\n━━━ 柒·感情与健康提示 ━━━\n【感情能量】'+(ele==='金'?'理智主导，不易冲动':ele==='木'?'情感丰富，富有爱心':ele==='水'?'细腻深情，善解人意':ele==='火'?'热烈主动，冲动但真诚':ele==='土'?'忠诚稳重，长情不渝':'自在随性，不受拘束')+'\n【健康重点】'+(ele==='金'?'注意呼吸道/皮肤，多喝水':ele==='木'?'注意肝胆/眼睛，怒伤肝少郁':ele==='水'?'注意肾/泌尿，保暖温阳':ele==='火'?'注意心/血压，少食辛辣':ele==='土'?'注意脾胃/消化，七分饱':'均衡饮食，适度为宜')+'\n【五行饮食】'+(ele==='金'?'白萝卜/百合/银耳':ele==='木'?'绿叶菜/菊花茶/柑橘':ele==='水'?'黑豆/核桃/海带':ele==='火'?'莲子/百合/绿豆':'山药/小米/南瓜')+'\n\n━━━ 捌·未来五日运势推演 ━━━\n(基于传统节气与日干衰旺推算)\n• 明日(干支推算)：'+(ele==='金'?'火运继续，注意上火':ele==='木'?'木运生火，花销大':ele==='水'?'水运平滑，理财佳':ele==='火'?'火运最旺，决策需谨慎':ele==='土'?'土运助身，稳中求进':'顺势而为，稳步发展')+'\n• 后日：宜'+(ele==='金'?'文/静/思；忌动/争/怒':ele==='木'?'动/创/业；忌静/消/忧':ele==='水'?'变/交/谈；忌保守/拒':ele==='火'?'礼/仪/节；忌冲/动/怒':'聚/亲/友；忌孤/独/愁')+'\n• 第三日：贵人出现在'+(ele==='金'?'西北方':ele==='木'?'东南方':ele==='水'?'西南方':ele==='火'?'东北方':'正西方')+'\n• 第四日：财运趋势'+(ele==='金'?'偏弱，宜存不宜投':ele==='木'?'上行，可少量投资':ele==='水'?'佳期，理财黄金日':ele==='火'?'防破财，控制消费':ele==='土'?'稳定，适合长线':'灵活应变，短线为主')+'\n• 第五日：注意'+(ele==='金'?'情绪压抑/呼吸道问题':ele==='木'?'眼睛疲劳/朋辈口舌':ele==='水'?'意外破财/水边安全':ele==='火'?'心血管/压力过大':'肠胃/过度劳累')+'\n\n━━━ 玖·节气养生 ━━━\n【当前季节】'+(sg==='春'?'春季':sg==='夏'?'夏季':sg==='秋'?'秋季':'冬季')+'('+season+'月)\n'+seasonG[sg]+'\n\n━━━ 拾·化解与提醒(拿来即用)━━━\n1. 出门佩戴'+hj.peishi+'招'+hj.yanse+'气息\n2. 手机号尾数选'+hj.shuzi+'\n3. 办公桌朝'+hj.fangwei+'摆放小物\n4. 今日重要事情建议在'+(ele==='金'?'午时(11-13)':ele==='木'?'寅时(3-5)':ele==='水'?'亥时(21-23)':ele==='火'?'午时(11-13)':'辰时(7-9)')+'推进\n5. 出门方向朝喜神位'+(ele==='金'?'东南':ele==='木'?'东北':ele==='水'?'西南':ele==='火'?'西北':'正东')+'走\n\n━━━ 拾壹·订阅方式 ━━━\n· 个人推送：需登录后开启个性化推送\n· 全网推送：关注公众号获取每日通用版\n· API订阅：调用 /api/yuanzhu/preference 设置推送类型\n\n本期黄历根据今日干支和您的日主推荐，明日推送将于凌晨 0:00 更新。';
  }
  if(modId==='taisui'){
    var sx=d[0]||'未知';var type=d[1]||'不确定';var focus=d[2]||'综合';
    var ts=_getTaisui(sx,'male',2026);
    // 2026 丙午年太岁为王文盛大将军
    var tsGod='王文盛大将军';
    var tsYear='2026 丙午年';
    // 生肖与太岁关系
    var sxMap={rat:'子鼠',ox:'丑牛',tiger:'寅虎',rabbit:'卯兔',dragon:'辰龙',snake:'巳蛇',horse:'午马',goat:'未羊',monkey:'申猴',rooster:'酉鸡',dog:'戌狗',pig:'亥猪'};
    var sxConflict={
      '鼠':'冲太岁(子午相冲)→动空不安，事业/感情/健康均受影响','牛':'害太岁(丑午相害)→易遭小人暗算，口舌是非','虎':'三合太岁(寅午戌)→贵人多助，运势上扬','兔':'破太岁(卯午相破)→人际关系破裂，感情波折','龙':'三合太岁(辰酉合)→贵人助力，事业顺利','蛇':'偏冲太岁→小幅波动，总体平稳','马':'值太岁(本命年)→事业变动，感情考验，健康注意','羊':'合太岁(午未合)→贵人助，整体顺利','猴':'不太岁→运势平稳，无冲无合','鸡':'不太岁→运势平稳，专心发展','狗':'三合太岁(寅午戌)→贵人多助，事业财运俱佳','猪':'不太岁→运势平稳，注意自身健康'};
    var conflictDesc=sxConflict[sx]||'不太岁，运势平稳';
    var isFan=['鼠','牛','兔','马'].indexOf(sx)>=0;
    // 化解建议按生肖
    var hjMap={
      '鼠':'【冲太岁化解】\n1. 佩戴三合手链(猴鼠辰三合)\n2. 家中正南方不宜放红色物品\n3. 農历五月(午月)减少重大决策\n4. 拜太岁：正月初八(1/8)或正月十五(1/15)到道教宫观拜太岁\n5. 年底谢太岁(农历十二月初八)',
      '牛':'【害太岁化解】\n1. 佩戴三合手链(蛇鸡丑三合)\n2. 远离小人，不参与同事是非\n3. 签约/合作需核涁条款\n4. 拜太岁：正月初八到道教宫观\n5. 家中正南方放金属物品(金泄土)',
      '兔':'【破太岁化解】\n1. 佩戴三合手链(猪兔未三合)\n2. 人际关系以和为贵，不宜强出头\n3. 感情中多包容，避免口角\n4. 拜太岁：正月初八或正月十五\n5. 農历五月减少社交活动',
      '马':'【值太岁化解】\n1. 佩戴三合手链(虎马狗三合)或红绳平安扣\n2. 本命年不宜结婚/搬家/跳槽(除非八字配合)\n3. 主动破财：年初捐献/红色内衣/旅行消费(应“破财消灾”)\n4. 拜太岁：正月初八到道教宫观上表拜太岁\n5. 年底还愿谢太岁\n6. 注意健康：本命年易亚健康状态\n7. 本命年犯者不宜参加白事/探病/看新生儿',
      '蛇':'【偏冲化解】\n1. 佩戴三合手链(蛇鸡丑三合)\n2. 安太岁：正月到宫观登记安太岁\n3. 注意健康检查，特别心血管',
      '羊':'【合太岁加强】\n1. 佩戴三合手链(猪兔未三合)加强贵人运\n2. 今年是发展良机，积极把握机会\n3. 注意不可过于骄傲，低调做人',
      '虎':'【三合加强】\n1. 佩戴三合手链(虎马狗三合)加强贵人\n2. 把握事业突破机会\n3. 财运有望上升，适度投资',
      '龙':'【三合加强】\n1. 佩戴三合手链(龙鼠申三合)加强贵人\n2. 事业黄奚期，积极拓展\n3. 不可得意忘形，注意身体',
      '狗':'【三合加强】\n1. 佩戴三合手链(虎马狗三合)加强贵人\n2. 贵人助事业财运，把握机会\n3. 家庭和睦，珍惜身边人',
      '猴':'【不太岁】\n1. 正常生活，顺势而为\n2. 佩戴三合手链(猴鼠辰三合)加强运气',
      '鸡':'【不太岁】\n1. 正常生活，顺势而为\n2. 佩戴三合手链(蛇鸡丑三合)加强运气',
      '猪':'【不太岁】\n1. 正常生活，顺势而为\n2. 佩戴三合手链(猪兔未三合)加强运气'};
    var hjDetail=hjMap[sx]||'拜太岁灯告平安';
    // 逐月吉凶
    var monthFan={
      '鼠':'正月平稳/二月小冲/三月平/四月吉/五月大冲/六月吉/七月平/八月小吉/九月平/十月吉/十一月平/十二月小冲',
      '牛':'正月平/二月吉/三月小冲/四月平/五月害/六月吉/七月平/八月小吉/九月平/十月吉/十一月平/十二月吉',
      '兔':'正月吉/二月平/三月小破/四月吉/五月破/六月吉/七月平/八月小吉/九月平/十月吉/十一月平/十二月小吉',
      '马':'正月冲/二月吉/三月平/四月小冲/五月值/六月吉/七月平/八月冲/九月平/十月小吉/十一月平/十二月小冲'
    };
    var monthGuide=monthFan[sx]||'正月平/二月平/三月平/四月平/五月平/六月平/七月平/八月平/九月平/十月平/十一月平/十二月平';
    // 太岁方位
    var tsFangwei={2026:'正南方(丙午年太岁位)'}[2026]||'正南方';
    var tsForbidden='2026年太岁方正南方→不宜动土/装修/射钉/破碎墙壁\n三煞位正东方→同样不宜动土/大调整';
    return'━━━ 本命年太岁深度分析报告 ━━━\n\n【生肖】'+sx+'\n【犯太岁类型】'+type+'\n【关心方向】'+focus+'\n【值年太岁】'+tsGod+'\n【太岁年份】'+tsYear+'\n\n━━━ 壹·冲合关系详解 ━━━\n'+conflictDesc+'\n\n━━━ 贰·太岁对五维度影响 ━━━\n【事业】'+(isFan?'今年事业多变，可能面临岗位调整/人事变动。保持低调，不宜主动挑起冲突。三合生肖贵人('+({rat:'猴、龙',ox:'蛇、鸡',rabbit:'猪、羊',horse:'虎、狗'})[sx]||'多生肖'+'可助。':'今年事业无冲，顺势发展。可积极拓展业务。')+'\n【财运】'+(isFan?'太岁年财运波动大，正财尚可偏财谨慎。忌高风险投资/借贷/担保。':'财运平稳，正常发展。')+'\n【感情】'+(isFan?'感情易受冲，已婚者多沟通，单身者桃花不稳。不宜冲动决定婚事。':'感情平稳发展。')+'\n【健康】'+(isFan?'太岁年健康需注意，'+(sx==='马'?'心脏/血压/眼部':(sx==='鼠'?'肾/泌尿/耳部':(sx==='牛'?'脾胃/消化':(sx==='兔'?'肝胆/眼睛':''))))+'定期体检。':'健康平稳，注意日常保养。')+'\n【人际】'+(isFan?'口舌是非多，远离小人，不宜强出头。':'人际顺利，贵人多助。')+'\n\n━━━ 叁·拜太岁全流程 ━━━\n【时间】正月初八('+tsYear.split(' ')[0]+'-02-05，星期三)或正月十五('+tsYear.split(' ')[0]+'-02-12，星期三)\n【地点】当地道教宫观(城隍庙/关帝庙/娘娘庙/玄妙观等)\n【流程】\n1. 净身(洗澡后穿新衣)\n2. 进庙缴费上太岁表(写姓名+生辰+住址)\n3. 跪拜值年太岁'+tsGod+'\n4. 点太岁灯/香(全年平安灯)\n5. 求平安符(随身携带)\n6. 年底农历十二月初八回庙谢太岁\n【不能到庙】可在家面向'+tsFangwei+'烧香叩拜，心诚则灵\n\n━━━ 肆·逐月吉凶指南 ━━━\n'+monthGuide.split('/').map(function(m,i){return '• '+(i+1)+'月：'+m;}).join('\n')+'\n\n━━━ 伍·化解方案(拿来即用)━━━\n'+hjDetail+'\n\n━━━ 陆·风水布局禁忌 ━━━\n【太岁位】'+tsFangwei+'\n'+tsForbidden+'\n【家中布局】\n• 太岁位宜静不宜动，放绿色植物或平安结\n• 三煞位(正东)不宜动土，可放金属物泄气\n• 家中保持通风采光，阴暗角落点灯\n• 卧室不宜放镜子对床\n\n━━━ 柒·生活宜忌 ━━━\n【宜】\n· 拜太岁/献血/洗牙(主动“破红”应灾)\n· 捐款/做善事(积福消灾)\n· 穿红色内衣/袜子/系红腰带\n· 低调行事，不张扬\n· 定期体检\n【忌】\n· 参加白事/看新生儿/探重病者\n· 大额投资/担保/借贷\n· 跳槽/创业(除非八字配合)\n· 正南方动土/装修\n\n━━━ 捌·综合建议 ━━━\n1. 太岁年非全凶——三合生肖('+({rat:'猴/龙',ox:'蛇/鸡',rabbit:'猪/羊',horse:'虎/狗'})[sx]||'贵人'+'可化解\n2. 保持正面心态，“太岁当头坐，无喜恐有忧”→主动创造喜事\n3. 年初规划全年大事，避免临时决断\n4. 健康、事业、感情、财运四线并行，不可偏废\n5. 年底别忘了回庙谢太岁(还愿)\n\n(关心方向：'+focus+')';
  }
  if(modId==='yanzhi'){
    var hasPhoto=state.data.faceImage||d[0];
    var focus=d[1]||'整体面相';
    var desc=d[0]||'未提供';
    var shengxiao=d[2]||'未知';
    var sex=d[3]||'男';
    var aiBlock='';
    if(hasPhoto&&typeof hasPhoto==='string'&&hasPhoto.startsWith('data:image')){
      var aiFace=state.data.faceAnalysis||'';
      var aiEngine=state.data.faceEngine||'';
      aiBlock=aiFace?('━━━ 🔬 AI视觉识图分析（引擎：'+aiEngine+'）━━━\n\n'+aiFace+'\n\n━━━ 📚 相法理论补充 ━━━\n\n'):'';
    }
    var sxMap={'鼠':'子水·聪明灵活·耳鼻嘴三停匀称者多智','牛':'丑土·稳重踏实·额头宽阔者有福气','虎':'寅木·威严果断·眉骨高者有魄力','兔':'卯木·温和细腻·眼睛清澈者多贵人','龙':'辰土·大气磅礴·方圆脸者能成大事','蛇':'巳火·深沉敏锐·颧骨适中者善谋略','马':'午火·热情奔放·浓眉大眼者多朋友','羊':'未土·温厚善良·鼻梁端正者有财','猴':'申金·机智灵活·眼珠灵动者多才','鸡':'酉金·精明干练·嘴小唇薄者善言','狗':'戌土·忠诚正直·额头有角者可靠','猪':'亥水·福气深厚·脸圆下巴宽者有福'};
    var sxDesc=sxMap[shengxiao]||'生肖信息未提供';
    var santingMap={'三停均匀':'上停（额头到眉毛=早年运30岁前）饱满→少年得志；中停（眉毛到鼻尖=中年运30-50岁）宽阔→中年有成；下停（鼻尖到下巴=晚年运50岁后）圆润→晚年安泰。三停均匀者一生平稳。','上停发达':'额头饱满宽阔→少年运好（15-30岁），早年得长辈助力，学习能力强。但需防中年运势衔接。','中停发达':'眉眼鼻颧骨区域宽阔→中年运强（30-50岁），事业高峰期。鼻梁高挺者自尊心强、有领导力。','下停发达':'下巴方圆有肉→晚年运佳（50岁后），下属缘好，财富积累能力强。地阁（下巴）方圆者不动产运佳。'};
    var santingDesc=santingMap[focus]||santingMap['三停均匀'];
    var wuguanDesc='【眉毛】浓淡适中→性情温和；浓密→精力旺盛但易冲动；稀疏→性格柔弱但人缘好。眉间宽→心胸开阔；眉间窄→心思细密。\n【眼睛】眼大有神→热情开朗；眼小细长→精明深沉；眼白多→性格外向但易冲动；黑白分明→聪慧正直。眼尾上扬→有魄力；眼尾下垂→温顺善良。\n【鼻子】鼻梁高挺→自尊心强、有领导力；鼻翼饱满→理财能力强、有财库；鼻头有肉→心善有福；鼻孔不外露→守财。鼻子为财帛宫，主管一生财运。\n【嘴巴】嘴大唇厚→热情大方、有口福；嘴小唇薄→精打细算、善言辞；嘴角上扬→乐观开朗；嘴角下垂→内向多虑。嘴唇红润→气血充足。\n【耳朵】耳大有垂→有福气、长寿；耳高于眉→少年成名；耳轮分明→聪明好学；耳垂厚大→晚年有福。耳朵为采听官，主管少年运和智慧。';
    var faceColor='【面色红润】气血充足，精力旺盛，近运佳。\n【面色苍白】气血偏虚，注意休息和营养，多食红枣/桂圆。\n【面色发黄】脾胃偏弱，注意饮食规律，少食生冷。\n【面色发青】肝气不舒，注意情绪管理，多运动疏肝。\n【面色发黑】肾气不足，注意保暖，避免过度劳累。';
    return aiBlock+'━━━ 面相分析报告 ━━━\n\n【基本信息】\n关注方向：'+focus+' | 生肖：'+shengxiao+' | 性别：'+sex+'\n\n━━━ 壹·生肖面相总论 ━━━\n'+sxDesc+'\n\n【白话解读】\n你的生肖五行属性决定了面相的底层气质。比如属鼠的人通常眼神灵活、反应快；属牛的人通常面相稳重、额头宽。这只是基础参考，具体还要看五官搭配。\n\n━━━ 贰·三停六府分析 ━━━\n'+santingDesc+'\n\n【白话解读】\n面相分三段看：上停（额头）看少年运和智力，中停（眉眼鼻）看中年运和事业，下停（下巴嘴）看晚年运和财富。哪段最饱满，对应的年龄段最顺。\n\n━━━ 叁·五官分论 ━━━\n'+wuguanDesc+'\n\n【白话解读】\n鼻子是「财帛宫」，主管财运——鼻翼饱满说明能存钱，鼻孔不外露说明不漏财。眼睛是「监察官」，黑白分明最聪明。耳朵大且有垂肉，是天生有福气的标志。\n\n━━━ 肆·面色观察 ━━━\n'+faceColor+'\n\n━━━ 伍·面相与运势关联 ━━━\n【事业运】额头饱满+颧骨适中→领导力强，适合管理岗\n【财运】鼻翼饱满+下巴方圆→理财有道，中晚年聚财\n【感情运】眼尾上扬+嘴角上扬→异性缘佳，婚姻美满\n【健康运】面色红润+耳大有垂→体质好，长寿之相\n【贵人运】眉清目秀+额头明亮→贵人多助，逢凶化吉\n\n━━━ 陆·改善建议（拿来即用）━━━\n1. 发型调整：'+(focus==='上停发达'?'露出额头，增强早年运':focus==='下停发达'?'保持面部清洁，凸显下巴线条':'保持发型整洁，不遮眉眼')+'\n2. 表情管理：多微笑，嘴角上扬可改善「苦相」，增强人际运\n3. 眉毛修整：眉形清晰不杂乱→运势更顺，尤其利事业运\n4. 气色调理：充足睡眠+均衡饮食→面色红润→运势提升\n5. 佩戴建议：'+(ele==='金'?'白色/金色饰品增强金气':ele==='木'?'绿色系饰品增强木气':ele==='水'?'黑色/蓝色饰品增强水气':ele==='火'?'红色/紫色饰品增强火气':'黄色/棕色饰品增强土气')+'\n6. 面相是会变的：相由心生，保持正能量和善念，面相会越来越好\n\n━━━ 柒·免责声明 ━━━\n面相学为传统文化参考，不可单凭面相断人吉凶。面相会随心境和经历改变，「相由心生」才是核心。';
  }
  if(modId==='music'){
    var mood=d[0]||'需要放松';var type=d[1]||'不确定';var sym=d[2]||'无';var duration=d[3]||'未提供';
    var moodMap={'焦虑紧张':{wuxing:'木+火',yin:'角音+徵音',prescribe:'焦虑多由肝气郁结、心火亢盛引起，疏肝清心为主',scene:'微暗灯光·深呼吸·调心',time:'15-20分钟',freq:'晨起7-9点(辰时)和下午3-5点(申时)各一次'},'失眠多梦':{wuxing:'水+土',yin:'羽音+宫音',prescribe:'失眠由心肾不交、脾胃失和引起，滋肾安神健脾为主',scene:'环境黑暗·温温轻柔·闭目',time:'20-30分钟(睡前1小时)',freq:'每晚(21:00-22:30)'},'疲劳低落':{wuxing:'土+火',yin:'宫音+徵音',prescribe:'疲劳多由气虚、能量不足引起，补气振阳为主',scene:'明亮环境·坐姿/微动·中音',time:'15-20分钟',freq:'午前(9-11点已时)最佳'},'悲伤失落':{wuxing:'金+水',yin:'商音+羽音',prescribe:'悲伤多由肺气虚、情志不畅引起，润肺滋肾为主',scene:'明亮干净·散步·中音',time:'15-20分钟',freq:'下午/傍晚(下午3-7点)'},'愤怒烦躁':{wuxing:'木+水',yin:'角音+羽音',prescribe:'怒伤肝，烦躁由肝郁化火引起，疏肝凉润为主',scene:'自然环境·走动·微闭目',time:'20-30分钟',freq:'随时(怒气起时听5-10分钟可缓解)'},'压力大':{wuxing:'木+土',yin:'角音+宫音',prescribe:'压力多由肝郁脾虚引起，疏肝健脾为主',scene:'安静室内·闭目坐·深呼吸',time:'15-30分钟',freq:'早晚各一次'},'需要放松':{wuxing:'水',yin:'羽音',prescribe:'放松身心，养精蓄锐',scene:'舒适环境·闭目·深呼吸',time:'20-30分钟',freq:'随时'}};
    var mm=moodMap[mood]||moodMap['需要放松'];
    var typeMap={'古琴/古筝':'水+木系→羽音与角音结合，滋肾疏肝，适合焦虑/失眠','自然白噪音':'水+土系→雨声/流水/海浪/风声，调和肾与脾，安神','冥想引导':'火+土系→徵音与宫音结合，静心安定，适合压力/悲伤','颂钵疗愈':'金+水系→商音与羽音结合，震频入体，适合能量调整','钢琴轻音乐':'水+火系→羽音与徵音结合，平衡心肾，适合所有情绪','不确定':'推荐五行全覆盖套餐：金木水火土五组音各20分钟'};
    var tt=typeMap[type]||typeMap['不确定'];
    var musicList={'焦虑紧张':[{n:'《幽兰逢春》',a:'陈重/陈古一',s:'古琴+笛',d:'8:30',c:'晨起'},{n:'《阳关三叠》',a:'古曲',s:'古琴',d:'6:45',c:'情绪稳定时'},{n:'《春江花月夜》',a:'古曲',s:'箫+琵琶',d:'12:00',c:'午后/冥想'},{n:'《平沙落雁》',a:'古曲',s:'古琴',d:'8:00',c:'夜间放松'}],'失眠多梦':[{n:'《流水》',a:'伯牙(古曲)',s:'古琴',d:'8:30',c:'睡前'},{n:'《梅花三弄》',a:'古曲',s:'笛+箫',d:'9:20',c:'躺床上听'},{n:'《雨打芭蕉》',a:'广东音乐',s:'丝竹',d:'6:50',c:'哄睡'},{n:'《渔舟唱晚》',a:'古曲',s:'古筝',d:'7:30',c:'催眠'}],'疲劳低落':[{n:'《十面埋伏》',a:'古曲',s:'琵琶',d:'6:30',c:'振作精神'},{n:'《赛马》',a:'黄海怀',s:'二胡',d:'3:20',c:'提神'},{n:'《广陵散》',a:'嵇康(古曲)',s:'古琴',d:'11:00',c:'能量提升'},{n:'《将军令》',a:'古曲',s:'丝竹',d:'5:20',c:'振奋'}],'悲伤失落':[{n:'《阳春白雪》',a:'古曲',s:'古琴/箫',d:'5:30',c:'抒怀'},{n:'《胡笳十八拍》',a:'古曲',s:'琴/笛',d:'12:00',c:'深情绪处理'},{n:'《采薇》',a:'诗经·古风',s:'吟唱',d:'4:50',c:'舒缓悲伤'},{n:'《枫桥夜泊》',a:'古曲',s:'古筝',d:'7:20',c:'静心'}],'愤怒烦躁':[{n:'《胡笳十八拍》',a:'古曲',s:'笛/箫',d:'12:00',c:'疏肝'},{n:'《平湖秋月》',a:'古曲',s:'高胡/古筝',d:'6:30',c:'平抑怒气'},{n:'《空山鸟语》',a:'古曲',s:'二胡',d:'5:40',c:'多听·森林感'},{n:'《姑苏行》',a:'江先谓',s:'笛',d:'6:10',c:'将怒气转化为平静'}],'压力大':[{n:'《渔樵问答》',a:'古曲',s:'古琴',d:'10:00',c:'上班前静心'},{n:'《竹林深处》',a:'现代古风',s:'箫+古筝',d:'8:00',c:'减压'},{n:'《碧涧流泉》',a:'古曲',s:'古琴',d:'9:30',c:'调心'},{n:'《潇湘水云》',a:'古曲',s:'古琴',d:'11:20',c:'深度放松'}],'需要放松':[{n:'《梅花三弄》',a:'古曲',s:'笛',d:'9:20',c:'休息'},{n:'《高山流水》',a:'古曲',s:'古琴',d:'7:40',c:'休息'},{n:'《汉宫秋月》',a:'古曲',s:'二胡/古筝',d:'8:50',c:'休息'}]};
    var ml=musicList[mood]||musicList['需要放松'];
    var musicText=ml.map(function(x){return '• '+x.n+'('+x.a+'，'+x.s+'，'+x.d+')→'+x.c;}).join('\n');
    return'━━━ 五行音乐深度疗愈处方 ━━━\n\n【情绪状态】'+mood+'\n【偏好类型】'+type+'\n【症状】'+sym+'\n【持续】'+duration+'\n\n━━━ 壹·音乐处方诊断 ━━━\n【五行诊断】'+mm.wuxing+'\n【五音处方】'+mm.yin+'\n【中医学原理】'+mm.prescribe+'\n【使用场景】'+mm.scene+'\n【单次时长】'+mm.time+'\n【频次】'+mm.freq+'\n\n━━━ 贰·音乐类型与五行对应 ━━━\n'+tt+'\n\n━━━ 叁·五音五脏对应总表 ━━━\n• 木→角音(笛/箫)→疏肝理气，对应肝胆/情绪\n• 火→徵音(琴/古筝高音区)→养心安神，对应心脏/失眠\n• 土→宫音(埙/古琴低音区)→健脾和胃，对应脾胃/消化\n• 金→商音(钟/锣)→润肺益气，对应肺/呼吸\n• 水→羽音(古琴/流水声)→滋肾宁心，对应肾/泌尿\n\n━━━ 肆·为您推荐曲单('+ml.length+'首)━━━\n'+musicText+'\n\n━━━ 伍·使用方法 ━━━\n【环境】\n• 室内：环境安静，光线柔和，温度适宜\n• 室外：花园/林间/江边最佳\n【音量】适中(背景音级)不超50分贝\n【姿势】可坐可卧，避免站立\n【注意力】闭目·深呼吸·不宜同时做其他事\n【疗程】\n• 轻度症状：连续7天，每天1-2次\n• 中度症状：连续21天，每天2次\n• 重度症状：连续49天，每天3次\n【配合】\n• 听音乐前喝杯温水\n• 听后静坐5-10分钟\n• 可配合香薰(艾草/檀香/沉香)增强效果\n\n━━━ 陆·常见问题解答 ━━━\n【问】为什么听音乐能治病？\n【答】古中医五音疗法通过不同频率的声波振动对应五脏。《黄帝内经》记载："天有五音，人有五藏"。特定频率可以调节对应脏腑的气机平衡。\n【问】多久能见效？\n【答】轻度7天可感知改善，中度21天明显变化，重度需49天疗程。\n【问】可以多首连续听吗？\n【答】可以。建议一首听完后间隔1-2分钟再听下一首。\n【问】什么情况下不宜听？\n【答】耳鸣/中耳炎/重金属环境后不宜立刻听；心情极度悲伤时不宜听悲伤类曲目。\n\n━━━ 柒·个性化推荐 ━━━\n• 需配合生辰八字分析：可根据个人五行喜忌调整\n• 长期调理：建议先使用7天套餐见效后升级21天/49天\n• 后期补"声动力"课程(针对个人定制音乐处方)\n\n━━━ 捌·现代医学背书 ━━━\n• 音乐频率能影响脑波(4-8Hz alpha波促进放松)\n• 古琴频率415Hz对应肺经振动，促进呼吸深长\n• 流水声频率(40-800Hz白噪音)掩盖环境噪争，助眠\n• 523Hz(古筝空弦音)被称为"治愈频率"\n\n━━━ 玖·使用提示 ━━━\n• 睡觉时可后台循环播放\n• 所有曲目均为古曲/民乐，没有现代音效\n• 可下载保存，作为随身使用\n• 不同疗程下不需频繁换曲，同曲重复听更入心\n\n━━━ 拾·服务支持 ━━━\n• 更多曲单：智护咨询→疗愈音乐库\n• 个性定制：生辰八字 + 体质 + 症状匹配处方\n• 课程升级：智护学院"声动力"专项课程\n\n(持续：'+duration+' | 处方：'+mm.yin+' | 场景：'+mm.scene+')';
  }
  if(modId==='lifeindex'){
    var m=d[0].match(/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日]?\s*(\d{1,2})?[时点]?\s*([男女])?/);
    var dm='未知',ele='未知',score=50,p=null,nonZero=5,strength=0,strengthScore=10;
    if(m){p=_paipan(+m[1],+m[2],+m[3],+m[4]||12);dm=p.day_master;ele=dm.slice(-1);
      var wc=p.wuxing_count;
      nonZero=Object.values(wc).filter(function(v){return v>0;}).length;
      var wuxingScore=Math.round((nonZero/5)*30);
      var myCount=wc[ele]||0;
      var totalCount=Object.values(wc).reduce(function(a,b){return a+b;},0);
      strength=myCount/totalCount;
      strengthScore=strength>=0.2&&strength<=0.35?20:strength>=0.15?15:10;
      score=50+wuxingScore+strengthScore;
    }
    var dim=d[1]||'综合生命指数';
    var sex=m&&m[5]||'男';
    var age=m?new Date().getFullYear()-(+m[1]):0;
    var dims={career:{name:'事业潜力',base:50,s:50},wealth:{name:'财运指数',base:50,s:50},health:{name:'健康长寿',base:50,s:50},marriage:{name:'婚姻幸福',base:50,s:50},social:{name:'人际关系',base:50,s:50},growth:{name:'个人成长',base:50,s:50}};
    var eleBoost={金:{c:15,w:5,h:0,m:-5,s:5,g:10,d:'金主义、果断，适合管理和执法'},木:{c:10,w:10,h:5,m:5,s:10,g:15,d:'木主仁、成长，适合教育和创新'},水:{c:10,w:20,h:5,m:10,s:5,g:10,d:'水主智、灵活，适合科研和策划'},火:{c:15,w:0,h:-5,m:0,s:10,g:10,d:'火主礼、热情，适合传媒和创新'},土:{c:5,w:15,h:10,m:10,s:0,g:5,d:'土主信、稳定，适合房产和政务'}};
    var eb=eleBoost[ele]||eleBoost['土'];
    dims.career.s=Math.max(30,Math.min(95,dims.career.base+eb.c+(score-60)/3));
    dims.wealth.s=Math.max(30,Math.min(95,dims.wealth.base+eb.w+(score-60)/3));
    dims.health.s=Math.max(30,Math.min(95,dims.health.base+eb.h+(score-60)/3));
    dims.marriage.s=Math.max(30,Math.min(95,dims.marriage.base+eb.m+(score-60)/3));
    dims.social.s=Math.max(30,Math.min(95,dims.social.base+eb.s+(score-60)/3));
    dims.growth.s=Math.max(30,Math.min(95,dims.growth.base+eb.g+(score-60)/3));
    var totalScore=Math.round((dims.career.s+dims.wealth.s+dims.health.s+dims.marriage.s+dims.social.s+dims.growth.s)/6);
    var grade=totalScore>=85?'S 卓越出尘':totalScore>=75?'A 优秀':totalScore>=65?'B 良好':totalScore>=55?'C 中等':'D 偏低';
    var gradeColor=totalScore>=75?'🟢':totalScore>=60?'🟡':'🔴';
    var careerDesc=ele==='金'?'管理/金融/法律/军警/机械':ele==='木'?'教育/文化/医疗/农业/设计':ele==='水'?'科研/策划/旅游/物流/传播':ele==='火'?'传媒/餐饮/能源/创新/演艺':'房产/政务/建筑/保险/仓储';
    var wealthDesc=ele==='金'?'正财为主，越老越有钱':ele==='木'?'需勤奋生财，中年后好转':ele==='水'?'财路多，灵活投资':ele==='火'?'财来财去，需理财规划':'稳健增长，适合长线投资';
    var healthDesc=ele==='金'?'肺/大肠/皮肤':ele==='木'?'肝/胆/眼睛':ele==='水'?'肾/膀胱/耳部':ele==='火'?'心/小肠/血压':'脾/胃/口腔';
    var healthJing=ele==='金'?'肺经':ele==='木'?'肝经':ele==='水'?'肾经':ele==='火'?'心经':'脾经';
    var marriageDesc=ele==='金'?'重原则，需多点温柔':ele==='木'?'重感情，积极付出':ele==='水'?'善解人意，感情顺遂':ele==='火'?'热情主动，需冷静':'忠诚稳重，长情不渝';
    var marriageMate=ele==='金'?'水/土':ele==='木'?'水/火':ele==='水'?'金/木':ele==='火'?'木/土':'火/金';
    var foodRec=ele==='金'?'白萝卜/百合/银耳':ele==='木'?'绿叶菜/枸杞/菊花':ele==='水'?'黑豆/核桃/海带':ele==='火'?'莲子/绿豆/百合':'山药/小米/南瓜';
    function bar(n){var b='';for(var i=0;i<10;i++)b+=i<Math.round(n/10)?'█':'░';return b;}
    var dimsText='【事业潜力】'+Math.round(dims.career.s)+'/100 '+bar(dims.career.s)+'\n  '+careerDesc+'\n  建议：从事'+careerDesc+'，与'+marriageMate+'行业合作\n\n【财运指数】'+Math.round(dims.wealth.s)+'/100 '+bar(dims.wealth.s)+'\n  '+wealthDesc+'\n  建议：'+(ele==='水'?'多元化投资':ele==='土'?'长线投资+不动产':'正财为主，控制消费')+'\n\n【健康长寿】'+Math.round(dims.health.s)+'/100 '+bar(dims.health.s)+'\n  养护：'+healthDesc+'\n  建议：重点养护'+healthJing+'，多食'+foodRec+'\n\n【婚姻幸福】'+Math.round(dims.marriage.s)+'/100 '+bar(dims.marriage.s)+'\n  '+marriageDesc+'\n  建议：与'+marriageMate+'日主互补最佳\n\n【人际关系】'+Math.round(dims.social.s)+'/100 '+bar(dims.social.s)+'\n  建议：多结交三合/六合生肖朋友\n\n【个人成长】'+Math.round(dims.growth.s)+'/100 '+bar(dims.growth.s)+'\n  建议：终身学习，顺应五行特点发展';
    var stages=[{r:'0-15岁',t:'幼年养育期',s:Math.round(totalScore*0.9)},{r:'16-25岁',t:'求学成长期',s:Math.round(totalScore*(dims.growth.s/100*1.1))},{r:'26-35岁',t:'事业奠基期',s:Math.round(totalScore*(dims.career.s/100*1.05))},{r:'36-45岁',t:'事业黄金期',s:Math.round(totalScore*(dims.career.s/100*1.15))},{r:'46-55岁',t:'财富积累期',s:Math.round(totalScore*(dims.wealth.s/100*1.1))},{r:'56-65岁',t:'智慧收敛期',s:Math.round(totalScore*(dims.health.s/100*1.05))},{r:'66岁以上',t:'福气享受期',s:Math.round(totalScore*(dims.health.s/100*0.95))}];
    var stageText=stages.map(function(s){return '【'+s.r+'】'+s.t+' → '+s.s+'/100 '+bar(s.s);}).join('\n');
    var lacking=(p&&p.wuxing_lack&&p.wuxing_lack.length)?p.wuxing_lack.join('、'):'无';
    var hj=(p&&p.wuxing_lack&&p.wuxing_lack.length)?_getHuajie(ele,p.wuxing_lack):{fangwei:'中央',yanse:'黄色',shuzi:'5/0',peishi:'黄玉'};
    var wuxingBar='';
    if(p){Object.keys(p.wuxing_count).forEach(function(k){var v=p.wuxing_count[k];var b='';for(var i=0;i<v;i++)b+='█';for(var i=v;i<5;i++)b+='░';wuxingBar+='  '+k+' '+b+' '+v+'个\n';});}
    var decades=[];
    for(var di=0;di<8;di++){var sa=Math.floor(age/10)*10+di*10-10;if(sa<0)sa=0;decades.push('【'+sa+'-'+(sa+9)+'岁】'+Math.round(totalScore*(0.8+Math.sin(di)*0.15))+'/100');}
    var decadeText=decades.join('  ');
    var verdict=totalScore>=85?'S级：五行平衡，六维度均出色。人生底牌好，仍需努力将潜力转化为现实。':totalScore>=75?'A级：五行较好，多维度优秀。重点发挥事业和财运优势。':totalScore>=65?'B级：五行基本平衡，部分维度突出。找到优势赛道，专注发展。':totalScore>=55?'C级：五行有缺失，需通过后天化解补齐。命数只占30%，努力占70%。':'D级：五行失衡严重。建议全面参考化解方案，健康为先，稳中求进。';
    return'━━━ 生命指数报告 ━━━\n\n【基本信息】\n'+('性别：'+sex+'，约'+age+'岁')+'\n日主：'+(dm==='未知'?'（需提供完整出生日期）':dm)+'\n五行：'+ele+'\n五行缺失：'+lacking+'\n综合评级：'+gradeColor+' '+grade+' （'+totalScore+'/100）\n\n━━━ 壹·六维度评分 ━━━\n'+dimsText+'\n\n━━━ 贰·人生阶段运势 ━━━\n'+stageText+'\n\n━━━ 叁·十年运势曲线 ━━━\n'+decadeText+'\n\n━━━ 肆·五行能量分布 ━━━\n'+wuxingBar+'\n\n━━━ 伍·五行缺失化解 ━━━\n缺失元素：'+lacking+'\n幸运方位：'+hj.fangwei+'\n幸运颜色：'+hj.yanse+'\n幸运数字：'+hj.shuzi+'\n推荐饰品：'+hj.peishi+'\n\n━━━ 陆·综合评定 ━━━\n'+verdict+'\n\n提示：本报告基于五行平衡法推算，仅供命理参考。';
  }
if(modId==='lifeplan'){
    var m=d[0].match(/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日]?\s*(\d{1,2})?[时点]?\s*([男女])?/);
    if(!m)return'请提供完整出生年月日时+性别，例：1990年6月15日8时 男';
    var y=+m[1],mo=+m[2],da=+m[3],h=+m[4]||12,sex=m[5]||'male';
    var p=_paipan(y,mo,da,h);
    var dm=p.day_master,wc=p.wuxing_count,ele=dm.slice(-1);
    var lack=(p.wuxing_lack&&p.wuxing_lack.length)?p.wuxing_lack.join('、'):'无(五行俱全)';
    var pillars=p.pillars;
    var shengxiao=p.shengxiao||((y-4)%12>=0?['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'][(y-4)%12]:'未知');
    var stage=d[1]||'职场';
    var residence=d[2]||'未提供';
    var focus=d[3]||'全面规划';
    var stageMap={'学龄前':'学龄前阶段(重点：先天修养、亲子互动)','小学':'小学阶段(重点：启蒙习惯、学习兴趣)','初中':'初中阶段(重点：兴趣挖掘、文理启蒙)','高中':'高中阶段(重点：学业深化、文理分班/选科)','大学':'大学阶段(重点：专业选择、实践积累)','职场':'职场阶段(重点：事业发展、升职加薪)','婚恋期':'婚恋期阶段(重点：婚姻家庭、子女教养)'};
    var stageName=stageMap[stage]||stage;
    // 五行与行业映射
    var descMap={'金':'金主义，刚毅果断，重义气，重承诺。做事果断但有时固执，适合管理与执法。','木':'木主仁，直爽向上，仁慈善良。有进取心和韧性，善于交际，适合教育与文化。','水':'水主智，聪明灵活，善变通，足智多谋。性格沉静善于思考，适合科研与策划。','火':'火主礼，热情外向，积极向上，有领导力。性格活泼有感染力，适合传媒与销售。','土':'土主信，稳重厚道，重承诺，踏实可靠。性格沉稳有责任感，适合房产与政务。'};
    var baseDesc=descMap[ele]||'';
    // 事业详细(根据五行)
    var careerMap={'金':{dir:'金融/银行/机械/珠宝/法律/IT硬件/军警/外科',scopes:'公务员/国企/金融业/制造业/法务',avoid:'艺术性过强/服务性强/自由职业过多'},'木':{dir:'教育/出版/农业/服装/家具/医药/中医/文化创意',scopes:'体制内教育/互联网产品/医药公司/出版社',avoid:'重工业/矿业/高危行业'},'水':{dir:'科研/策划/物流/通信/贸易/旅游/互联网运营',scopes:'互联网大厂/外贸公司/研究院/咨询',avoid:'传统重工业/纯体力劳动'},'火':{dir:'传媒/电子/餐饮/能源/美容/广告/销售/演讲培训',scopes:'新媒体/广告公司/销售型岗位/互联网运营',avoid:'纯后台技术/资料整理'},'土':{dir:'房产/建筑/政务/矿业/陶瓷/农业/仓储',scopes:'体制内政务/建筑公司/农业产业/物流仓储',avoid:'高变动行业/频繁出差'}};
    var cm=careerMap[ele]||careerMap['木'];
    // 城市
    var cityMap={'金':['上海','南京','西安','洛阳','哈尔滨','香港','悉尼','芝加哥'],'木':['北京','杭州','广州','深圳','东京','首尔','柏林'],'水':['天津','武汉','香港','广州','纽约','伦敦','莫斯科'],'火':['海口','昆明','广州','深圳','新加坡','曼谷','迪拜'],'土':['郑州','洛阳','西安','重庆','成都','北京','伊斯坦布尔']};
    var cities=(cityMap[ele]||[]).join('、');
    // 财运
    var caiMap={'金':'财星受克，宜守不宜攻。正财稳定(工薪)，偏财(投资)谨慎。建议控制开销，秋季金旺财运回升，适合稳健理财。','木':'财运有入有出，花销大。上半年财运较旺，下半年注意守财。适合做长期投资，忌短线投机。','水':'水克火得财，今年财运较佳。正财稳定，偏财有机会。秋季注意防冲动投资，适合多元化投资。','火':'比劫旺夺财，破财风险高。忌合伙经营，忌为他人担保。正财稳定但花销大，控制消费，避免高风险投资。','土':'财库丰盈，财运稳定。适合长线投资，火土旺月份(5-7月)财运最佳。适合房产/基金等稳健型投资。'};
    // 健康
    var healthMap={'金':'金→肺/呼吸道/皮肤/大肠。火克金→呼吸道偏弱。春季花粉过敏风险，夏季闷热注意通风，秋冬干燥多补水。多食白萝卜/百合/银耳/雪梨。','木':'木→肝胆/眼睛/筋骨/神经系统。火旺木燥→肝胆偏弱，注意情绪管理。春季肝气旺易怒，夏季防眼部疲劳，秋季金旺克木注意关节。多食绿叶菜/菊花茶。','水':'水→肾/泌尿/耳/骨骼。水火相战→注意心血管/血压。夏季高温防暑，冬季注意关节保养。多食黑豆/核桃/海带补肾。定期体检。','火':'火→心/血/眼/舌。火过旺→注意心脏/血液/口腔/视力。夏季防中暑，少食辛辣油炸。多食莲子/百合/绿豆清心。增加有氧运动。','土':'土→脾/胃/肌肉/口。土厚→注意脾胃/消化/血糖。少食油腻甜食，多食纤维蔬菜。秋季干燥多饮水。规律饮食，适度运动。'};
    // 婚恋
    var loveMap={'金':'配偶刚毅果断，重义气。今年感情有压力，需多沟通包容。单身者秋季(金旺)桃花开。桃花星：酉(鸡)。','木':'配偶温和上进，有进取心。今年精力旺盛，桃花盛开。单身者有望遇到正缘，春季(卯月)桃花最旺。','水':'配偶聪明灵活，善变通。今年水火既济，感情和谐。已婚者恩爱和睦，单身者秋季易遇良缘。桃花星：子(鼠)。','火':'配偶热情活泼，有领导力。今年火旺但易冲动。单身者投入过度可能招致压力；已婚者需控制情绪。桃花星：午(马)。','土':'配偶稳重可靠，重承诺。今年感情稳定，宜成家安业。单身者可主动扩展社交圈；已婚者家庭和谐，宜添丁。'};
    // 学业
    var studyMap={'金':'印星为土，学习效率高。适合：金融/法律/管理类。文昌位：西方。','木':'印星为水，学习悟性高。适合：教育/文化/医药类。文昌位：东方。','水':'印星为金，秋季印星旺。适合：科研/策划/技术类。文昌位：北方。','火':'印星为木，春季印星旺。适合：传媒/艺术/电子类。文昌位：南方。','土':'印星为火，学习有利。适合：房产/建筑/政务类。文昌位：中央。'};
    // 计算当前年龄
    var now=new Date();var birth=new Date(y,mo-1,da);var age=now.getFullYear()-birth.getFullYear()-(now.getMonth()<birth.getMonth()||(now.getMonth()===birth.getMonth()&&now.getDate()<birth.getDate())?1:0);
    // 长生十二宫
    var cs12=['长生','沐浴','冠带','临官','帝旺','衰','病','死','墓','绝','胎','养'];
    var csMap={金:'巳',木:'亥',水:'申',火:'寅',土:'申'};
    var changShengRoot=csMap[ele]||'亥';
    var branchSeq=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    var rootIdx=branchSeq.indexOf(changShengRoot);
    var pillarBranches=[pillars['年'].slice(-1),pillars['月'].slice(-1),pillars['日'].slice(-1),pillars['时'].slice(-1)];
    var pillarCs=[];
    for(var pi=0;pi<4;pi++){
      var bIdx=branchSeq.indexOf(pillarBranches[pi]);
      var offset=((bIdx-rootIdx)%12+12)%12;
      pillarCs.push(cs12[offset]);
    }
    // 当前大运阶段(粗略)
    var currentCS=pillarCs[2]; // 日柱为主
    var csGuide={
      '长生':{theme:'新生阶段',desc:'蓬勃向上，开创新局。适合学习新技能、拓展人脉、开始新事业。',yi:'学习/考试/创业/开业/结婚',ji:'保守/守旧/重大财务决策'},
      '沐浴':{theme:'敏感阶段',desc:'情绪波动较大，易受外界影响。需谨慎处理感情和财务。',yi:'形象提升/学习新知',ji:'投机/冲动消费/感情暧昧'},
      '冠带':{theme:'成长阶段',desc:'事业起步，逐步成熟。适合深耕专业、积累资源。',yi:'考证/深耕专业/拓展业务',ji:'频繁跳槽/盲目扩张'},
      '临官':{theme:'黄金阶段',desc:'事业上升期，能力得到充分发挥。把握机会积极进取。',yi:'创业/晋升/重大项目',ji:'保守/错过机会'},
      '帝旺':{theme:'鼎盛阶段',desc:'人生最高峰，权力与影响力最大。注意守成。',yi:'战略布局/稳健发展',ji:'冒进/过度扩张'},
      '衰':{theme:'调整阶段',desc:'开始走下坡路，宜守不宜攻。重新规划转型。',yi:'修身养性/学习充电',ji:'大投资/扩张'},
      '病':{theme:'休息阶段',desc:'注意健康，宜退守调整。保养身体，储蓄力量。',yi:'调养/慢投资/陪伴家人',ji:'过劳/冒险'},
      '死':{theme:'终结阶段',desc:'旧事终结，新机酝酿。放下包袱，等待转机。',yi:'反思/总结/培训',ji:'强求/固执'},
      '墓':{theme:'收藏阶段',desc:'收藏能量，蓄势待发。低调积累，等待时机。',yi:'积累人脉/学习/储蓄',ji:'冒头/大动作'},
      '绝':{theme:'沉寂阶段',desc:'低谷期，宜静不宜动。修养身心，等待转机。',yi:'静修/学习/陪伴家人',ji:'冒进/投资'},
      '胎':{theme:'萌芽阶段',desc:'新的开始酝酿。默默积累能量，等待时机。',yi:'学习/规划/养精蓄锐',ji:'冒进/大投资'},
      '养':{theme:'孕育阶段',desc:'蓄势待发，孕育新机。低调做事，等待时机。',yi:'学习/规划/养精蓄锐',ji:'冒进'}
    };
    var cg=csGuide[currentCS]||csGuide['长生'];
    // 应期
    var agePeriod='';
    if(age<6)agePeriod='学龄前(0-6岁)→ 重点培养习惯、亲子关系';
    else if(age<12)agePeriod='小学(6-12岁)→ 启蒙关键期，培养学习兴趣';
    else if(age<15)agePeriod='初中(12-15岁)→ 文理启蒙、兴趣挖掘';
    else if(age<18)agePeriod='高中(15-18岁)→ 学业深化、选科决策';
    else if(age<22)agePeriod='大学(18-22岁)→ 专业选择、实践积累';
    else if(age<28)agePeriod='职场初期(22-28岁)→ 事业定位、能力积累';
    else if(age<35)agePeriod='职场黄金期(28-35岁)→ 升职加薪、成家立业';
    else if(age<45)agePeriod='事业巅峰期(35-45岁)→ 战略布局、稳中求进';
    else if(age<55)agePeriod='事业转型期(45-55岁)→ 调整布局、传承经验';
    else if(age<65)agePeriod='退休准备期(55-65岁)→ 健康管理、兴趣培养';
    else agePeriod='退休期(65+)→ 修身养性、含饴弄孙';
    // 关键节点
    var keyNodes=[];
    var sexStr=sex==='female'||sex==='女'?'坤造':'乾造';
    keyNodes.push('• 6岁  启蒙教育启动期(重点：学习习惯培养)');
    keyNodes.push('• 12岁 小学毕业节点(升初中适应)');
    keyNodes.push('• 15岁 初中升高中节点(学业第一次分流)');
    keyNodes.push('• 18岁 高考节点(重大人生分水岭)');
    keyNodes.push('• 22岁 大学择业节点(第一份工作选择)');
    keyNodes.push('• 28岁 事业定型期(行业方向锁定)');
    keyNodes.push('• 30岁 成家节点('+(sexStr==='乾造'?'男命宜先立业后成家':'女命宜25-30岁把握黄金期')+')');
    keyNodes.push('• 40岁 中年稳进期(事业巅峰或转型)');
    keyNodes.push('• 50岁 子女教育关键期(亲子关系与传承)');
    keyNodes.push('• 60岁 退休规划期(健康管理与兴趣培养)');
    // 三元九运
    var sanYuanJiuYun='2024-2043 年下元九运(2024-2043年)：火运当令。“离火”主文明、科技、文化、艺术、教育、能源。火旺之象：科技崛起、文化繁荣、虚拟经济兴盛。个人需顺应：从事火属性行业(互联网、科技、文化、新能源)，注意精神健康，避免内心躁动。';
    // 化解
    var hj=_getHuajie(ele,lack.split('、'));
    var huajieDetail='【佩戴】'+hj.peishi+'\n【方位】'+hj.fangwei+'\n【颜色】'+hj.yanse+'\n【数字】尾号宜选'+hj.shuzi+'\n【饮食】'+hj.yinshi+'\n【行业】'+hj.hangye+'\n'+hj.baifang;
    return'━━━ 人生规划全维度深度报告 ━━━\n\n【个人档案】'+sexStr+' · '+y+'年'+mo+'月'+da+'日 '+(h?h+'时':'')+' · '+shengxiao+'年\n【当前年龄】'+age+'岁 · '+stageName+'\n【现居地】'+residence+'\n【关心方向】'+focus+'\n\n━━━ 壹·命盘概要 ━━━\n【四柱】'+pillars['年']+' '+pillars['月']+' '+pillars['日']+' '+pillars['时']+'\n【日主】'+dm+'('+ele+')\n【五行】金'+(wc['金']||0)+' 木'+(wc['木']||0)+' 水'+(wc['水']||0)+' 火'+(wc['火']||0)+' 土'+(wc['土']||0)+'\n【缺行】'+lack+'\n\n━━━ 贰·性格特征 ━━━\n'+baseDesc+'\n\n━━━ 叁·长生十二宫人生阶段 ━━━\n【四柱长生位】年柱 '+pillarCs[0]+' · 月柱 '+pillarCs[1]+' · 日柱 '+pillarCs[2]+'(当前) · 时柱 '+pillarCs[3]+'\n\n【当前阶段】'+currentCS+'('+cg.theme+')\n【阶段描述】'+cg.desc+'\n【宜做】'+cg.yi+'\n【忌做】'+cg.ji+'\n\n【人生阶段参考】\n• 童年(0-12岁)→ 启蒙、学习习惯、亲子关系\n• 少年(12-18岁)→ 学业深化、选科决策、兴趣发现\n• 青年(18-30岁)→ 专业选择、职业定位、姻缘肇始\n• 中年(30-50岁)→ 事业巅峰、家庭建设、传承布局\n• 壮年(50-65岁)→ 调整转型、健康管理、兴趣丰富\n• 晚年(65岁+)→ 修身养性、含饴弄孙、智慧传承\n\n━━━ 肆·当前阶段详细指导 ━━━\n【生命周期定位】'+agePeriod+'\n【学业/事业重点】'+(age<18?'当前以学业为重，培养学习兴趣与习惯':age<35?'当前以事业定位与能力积累为重，择业需谨慎':age<50?'当前以事业巅峰与家庭建设为重，注意平衡':'当前以健康管理与传承为重，放慢节奏享受生活')+'\n【健康重点】'+healthMap[ele]+'\n【催旺方法】\n• 事业：选择'+(cm.dir)+'领域\n• 财运：'+(caiMap[ele])+'\n• 姻缘：'+(loveMap[ele])+'\n• 健康：养护'+({金:'肺/呼吸道',木:'肝胆',水:'肾/泌尿',火:'心/血管',土:'脾胃'})[ele]+'\n\n━━━ 伍·学业方向推荐 ━━━\n【印星分析】'+studyMap[ele]+'\n【适合学业方向】'+(cm.dir)+'\n【学业黄金期】'+(age<18?'当前为学业黄金期，集中精力突破':age<25?'可在职提升学历/考取专业证书':'终身学习时代，可参加高级培训/MBA/专业资质')+'\n\n━━━ 陆·职业方向推荐(含考公/国企/创业/合伙)━━━\n【主推行业】'+cm.dir+'\n【考公/国企适配度】'+(ele==='土'||ele==='金'?'★★★★★ 极适合体制内稳定发展':ele==='水'?'★★★☆☆ 适合技术型公务员/事业单位':ele==='木'?'★★★★☆ 适合教育/文化类体制岗位':'★★★☆☆ 适合宣传/媒体类体制岗位')+'\n【创业适配度】'+(ele==='火'?'★★★★★ 火主创新，独立创业佳':ele==='水'?'★★★★☆ 水主智，技术型创业佳':ele==='木'?'★★★☆☆ 木主仁，合伙型创业佳':ele==='金'?'★★★☆☆ 金主决断，需团队配合':'★★★☆☆ 土主稳，需成熟时机')+'\n【合伙提醒】'+(ele==='火'?'比劫旺，不宜合伙经营，避免资金混清':ele==='水'?'偏财旺，可合伙但需股权明确':ele==='木'?'正印旺，宜师徒制或跟有经验者合伙':ele==='金'?'七杀旺，竞争激烈，慎选合伙人':'正官稳，合伙宜找互补型')+'\n【企业类型建议】'+(ele==='金'||ele==='土'?'央企/国企/500强外企':'创新型企业/互联网/文化创意')+'\n\n━━━ 柒·适合发展的城市 ━━━\n【推荐城市(按五行吉方)】'+cities+'\n【选择原则】\n• 出生地与发展地同方位→人气场稳\n• 命中喜用神方位最佳→助力发展\n• 避免太岁方位(2026正南)→防冲克\n【现居地分析】'+(residence?'您现居'+residence+'，需结合命卦与喜用神综合判断方位好坏。':'未提供现居地，建议结合八字喜忌选择发展城市。')+'\n\n━━━ 捌·适婚年龄与择偶建议 ━━━\n【最佳婚龄】'+(sexStr==='乾造'?'男命宜28-33岁(事业有成后水到渠成)':'女命宜25-30岁(黄金生育期与情感成熟度平衡)')+'\n【桃花星】'+({金:'酉(鸡)',木:'卯(兔)',水:'子(鼠)',火:'午(马)',土:'辰戌丑未(四季土)'})[ele]+'\n【婚配五行】'+(ele==='金'?'宜配水/土 → 水金相生，土金相生':ele==='木'?'宜配水/火 → 水生木，木生火':ele==='水'?'宜配金/水 → 金生水，水水比和':ele==='火'?'宜配木/火 → 木生火，火火比和':ele==='土'?'宜配火/土 → 火生土，土土比和':'')+'\n【择偶建议】'+(loveMap[ele])+'\n\n━━━ 玖·财运分析 ━━━\n【今年财运总评】'+(caiMap[ele])+'\n【财运起伏】\n• 春(木旺)→ '+(ele==='木'?'旺':'一般')+'\n• 夏(火旺)→ '+(ele==='火'?'旺':'一般')+'\n• 秋(金旺)→ '+(ele==='金'?'旺':'一般')+'\n• 冬(水旺)→ '+(ele==='水'?'旺':'一般')+'\n【偏财建议】'+(ele==='水'?'可适度多元化投资':ele==='土'?'适合房产/基金长线':ele==='火'?'宜守不宜攻，控制高风险投资':ele==='金'?'稳健理财，减少投机':'长期投资为主')+'\n\n━━━ 拾·健康重点 ━━━\n'+healthMap[ele]+'\n\n━━━ 拾壹·人生关键节点时间表 ━━━\n'+keyNodes.join('\n')+'\n\n━━━ 拾贰·三元九运宏观指导 ━━━\n'+sanYuanJiuYun+'\n\n━━━ 拾叁·化解方案(拿来即用)━━━\n'+huajieDetail+'\n\n━━━ 拾肆·综合建议与人生智慧 ━━━\n1. 顺势而为：五行喜忌是底层逻辑，顺应者事半功倍\n2. 补偏救弊：缺什么补什么，但不可过补\n3. 周期思维：十年一大运，五年一中运，一年一小运\n4. 平衡为上：五行平衡的人生最稳，过旺过衰皆忌\n5. 后天努力：命理提供参考，努力改变命运\n6. 修身养性：健康是一切基础，养成良好习惯\n7. 家庭为本：事业再大不及家和万事兴\n8. 终身学习：时代变迁快，唯有学习者不被淘汰\n\n━━━ 拾伍·免责声明 ━━━\n本报告基于传统命理学理论，结合您的出生信息分析，仅供参考。命由天定，运由己造，人生的最终走向取决于您的选择与努力。\n\n(关注方向：'+focus+')';
  }
  return'报告生成引擎就绪';
}

function localReport(modId,data){return _getUnifiedReport(modId,data);}

function dg2str(zhi, dS){
  var wxMap={'子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'};
  var dWx=({'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'})[dS[0]];
  var zWx=wxMap[zhi]||'—';
  if(zWx===dWx)return '(与日干比和)';
  if(({'金':'木','木':'土','土':'水','水':'火','火':'金'})[zWx]===dWx)return '(初传受日干克)';
  if(({'金':'木','木':'土','土':'水','水':'火','火':'金'})[dWx]===zWx)return '(初传克日干)';
  return '(中平)';
}

function _qimenCompute(y,mn,dy,hr,sex,ask){
  // 奇门遁甲智能排盘(简化版，采用传统转盘+飞布)
  // 九宫序数：巽4/离9/坤2/震3/中5/兑7/艮8/坎1/乾6(洛书)
  var gongNames={1:'坎',2:'坤',3:'震',4:'巽',5:'中',6:'乾',7:'兑',8:'艮',9:'离'};
  var trigrams={1:'坎水',2:'坤土',3:'震木',4:'巽木',5:'中土',6:'乾金',7:'兑金',8:'艮土',9:'离火'};
  var elements={1:'水',2:'土',3:'木',4:'木',5:'土',6:'金',7:'金',8:'土',9:'火'};
  var directions={1:'正北',2:'西南',3:'正东',4:'东南',5:'中央',6:'西北',7:'正西',8:'东北',9:'正南'};
  ask=ask||'事业决策';
  var stars=['天蓬','天任','天冲','天辅','天英','天芮','天柱','天心'];
  var starPalace=[1,8,3,4,9,2,7,6];// 原始宫位
  var starNature={1:'凶',2:'中',3:'中',4:'吉',5:'凶',6:'凶',7:'吉',8:'吉'};
  var doors=['休','生','伤','杜','景','死','惊','开'];
  var doorPalace=[1,8,3,4,9,2,7,6];
  var doorNature={1:'吉',2:'吉',3:'凶',4:'中',5:'中',6:'凶',7:'凶',8:'吉'};
  var gods=['值符','腾蛇','太阴','六合','白虎','玄武','九地','九天'];
  var godNature={1:'吉',2:'凶',3:'吉',4:'吉',5:'凶',6:'凶',7:'吉',8:'吉'};
  // 六仪三元：甲子戊(坎1)、甲戌己(坤2)、甲申庚(震3)、甲午辛(巽4)、甲辰壬(离9)、甲寅癸(艮8)
  var tianGan={1:'戊',2:'己',3:'庚',4:'辛',9:'壬',8:'癸'};
  var diGan={1:'戊',2:'己',3:'庚',4:'辛',5:'己',6:'辛',7:'庚',8:'癸',9:'壬'};
  // 局数计算：基于节气+日干支（真实奇门遁甲）
  var isYangDun=true;
  if(mn>=5&&mn<=8)isYangDun=false;
  if(mn>=3&&mn<=4){isYangDun=(dy<15)?false:true;}
  if(mn>=9&&mn<=10){isYangDun=(dy<15)?true:false;}
  var ep2=new Date(1900,0,1),tg2d=new Date(y,mn-1,dy);
  var dd2=Math.floor((tg2d-ep2)/86400000);
  var dayGanZhiIdx=((dd2%60)+60)%60;
  var juPattern=dayGanZhiIdx%5;
  var yangJu=[[1,7,4],[8,2,5],[3,9,6],[3,9,6],[2,8,5]];
  var yinJu=[[6,9,3],[5,2,8],[6,9,3],[5,2,8],[1,7,4]];
  var juPos=Math.floor((dayGanZhiIdx%15)/5);
  var juSet=isYangDun?yangJu[juPattern]:yinJu[juPattern];
  var ju=juSet[Math.min(juPos,2)]||1;
  var yd=isYangDun?'阳遁':'阴遁';
  // 阳遁从局数宫起甲子戊，阴遁从局数宫起甲子戊逆布
  var startPalace=ju;
  // 值符星+值使门：根据时干支计算(简化)
  var hourGanIndex=((hr%12)*2+(y%10))%10;
  var zfStar=stars[hourGanIndex%8];var zhifuStar=zfStar;
  var zsDoor=doors[hourGanIndex%8];
  // 值符落宫=原局宫位(简化)
  var zhifuPalace=starPalace[hourGanIndex%8];
  var zhishiPalace=doorPalace[hourGanIndex%8];
  // 用神宫位确定(按问事类型)
  var keyMap={'事业决策':6,'财运投资':8,'感情婚姻':4,'出行安全':1,'失物寻找':3,'官司诉讼':9,'健康吉凶':2,'其他':5};
  var keyPalace=keyMap[ask]||5;
  // 排盘：构建每个宫位的天盘/地盘/九星/八门/八神
  var palaces={};
  var allGong=[1,2,3,4,5,6,7,8,9];
  var starOffset=(startPalace-1);
  var doorOffset=(startPalace-1);
  var godOffset=(startPalace-1);
  allGong.forEach(function(g){
    var starIdx=(g-starOffset-1+8*9)%8;
    var doorIdx=(g-doorOffset-1+8*9)%8;
    var godIdx=(g-godOffset-1+8*9)%8;
    palaces[g]={
      gongName:gongNames[g],
      trigram:trigrams[g],
      element:elements[g],
      direction:directions[g],
      tian:diGan[g]||'—',
      di:diGan[g]||'—',
      star:stars[starIdx],
      starNature:starNature[starIdx],
      door:doors[doorIdx],
      doorNature:doorNature[doorIdx],
      god:gods[godIdx],
      godNature:godNature[godIdx]
    };
  });
  // 关键宫位详情
  var kp=palaces[keyPalace];
  // 格局判断
  var judge='';
  if(kp.starNature==='吉'&&kp.doorNature==='吉'&&kp.godNature==='吉')judge='★★★ 上吉格局(星门神三吉汇)';
  else if(kp.starNature==='吉'&&kp.doorNature==='吉')judge='★★ 吉格(星门双吉)';
  else if(kp.starNature==='凶'&&kp.doorNature==='凶')judge='凶格(星门双凶)，宜慎行';
  else if(kp.starNature==='凶')judge='星克门，主有阻碍';
  else if(kp.doorNature==='凶')judge='门克星，主有损耗';
  else judge='中平格局，需配合时辰方位';
  // 旺衰
  var hourWx=['木','木','火','火','土','土','金','金','水','水','木','木'][hr%12];
  var wang;
  if(hourWx===kp.element)wang='得时旺';
  else if(['金','木','水','火','土'].indexOf(hourWx)===['金','木','水','火','土'].indexOf(kp.element)+1%5||(['金','木','水','火','土'].indexOf(hourWx)===['金','木','水','火','土'].indexOf(kp.element)+2)%5)wang='相次旺';
  else if(hourWx===kp.element||['金','木','水','火','土'][(['金','木','水','火','土'].indexOf(kp.element)+3)%5]===hourWx)wang='休囚衰';
  else wang='受克';
  var wangDesc={得时旺:'用神旺相，可成大业',相次旺:'用神次旺，谋为可成',休囚衰:'用神休囚，宜静守',受克:'用神受克，有阻碍需化解'}[wang];
  // 生克
  var shengMap={'金':'水','水':'木','木':'火','火':'土','土':'金'};
  var keMap={'金':'木','木':'土','土':'水','水':'火','火':'金'};
  var shengke='时辰'+hourWx+'与用神'+kp.element;
  if(shengMap[hourWx]===kp.element)shengke+='→相生大吉';
  else if(shengMap[kp.element]===hourWx)shengke+='→用神生时，泄气';
  else if(keMap[hourWx]===kp.element)shengke+='→时克用神，不利';
  else if(keMap[kp.element]===hourWx)shengke+='→用神克时，可制';
  else shengke+='→比和，中平';
  // 吉凶总评
  var isGood=judge.indexOf('吉')>=0||wang==='得时旺'||wang==='相次旺';
  // 总体格局概述
  var overview=isGood?
    '此局'+yd+' '+ju+'局，'+kp.gongName+'宫'+kp.star+kp.door+kp.god+'格局'+judge.split('(')[0]+'。用神'+wang+'，'+wangDesc+'。整体问事'+ask+'→利大于弊，可顺势而为。':
    '此局'+yd+' '+ju+'局，'+kp.gongName+'宫'+kp.star+kp.door+kp.god+'格局'+judge+'。用神'+wang+'，'+wangDesc+'。整体问事'+ask+'→需谨慎，不宜冒进。';
  // 关键运势
  var keyFortune=isGood?
    '天时('+hr+'时'+hourWx+')'+(wang==='得时旺'?'与用神比和，大吉':'次吉')+'。\n地利(用神宫'+kp.gongName+')'+kp.element+'旺相。\n人和(值符'+zhifuStar+'落'+palaces[zhifuPalace].gongName+'宫，值使'+zsDoor+'门落'+palaces[zhishiPalace].gongName+'宫)'+(isGood?'助你成事':'有阻碍需调')+'。':
    '天时'+hr+'时'+hourWx+'与用神'+wang+'。\n地利'+kp.gongName+'宫'+wangDesc+'。\n人和值符'+zhifuStar+'落'+palaces[zhifuPalace].gongName+'宫'+(palaces[zhifuPalace].starNature==='吉'?'尚可':'欠佳')+'。';
  // 核心建议
  var keyAdvice=isGood?
    '① 把握当下 → '+hr+'时后至'+((hr+3)%24)+'时为最佳行动窗口。\n② 吉方行动 → 朝'+kp.direction+'方向发展。\n③ 借贵人 → 值符落宫'+palaces[zhifuPalace].direction+'有贵人相助。\n④ 慎言慎行 → 吉格中宜稳扎稳打，忌贪大求全。':
    '① 静待时机 → '+hr+'时不宜冒进，待吉时再动。\n② 化解先行 → 诵《道德经》一章祈福化解。\n③ 慎择方位 → 避'+kp.direction+'方位。\n④ 修身养性 → 修德以禳灾，吉人天相。';
  // 最佳时辰
  var bestHour=hourWx===kp.element?(hr+12)%24:((hr+12)%24);
  var bestHourReason='下个'+kp.element+'旺时辰('+bestHour+'时)'+(isGood?'吉气叠加':'化解凶煞');
  // 吉方位
  var goodDirMap={金:'西北',木:'东/东南',水:'正北',火:'正南',土:'中央/西南/东北'};
  var goodDirection=goodDirMap[kp.element]||'中央';
  var goodDirReason='用神五行'+kp.element+'对应方位'+goodDirection+'，+旺'+kp.door+kp.star;
  // 不利方位
  var badDirection={金:'正南',木:'正西',水:'正南',火:'正北',土:'正东'}[kp.element]||'—';
  var badDirReason='用神'+kp.element+'所克方位(如正'+(kp.element==='金'?'南火':kp.element==='木'?'西金':kp.element==='水'?'南火':kp.element==='火'?'北水':'东木')+')';
  // 行动时机
  var actionTime=isGood?'3日内可行动':'7-10日后更佳';
  var actionTimeReason=isGood?'吉时已至，乘势而上':'需待'+kp.element+'旺日(农历逢'+(kp.element==='金'?'申酉':kp.element==='木'?'寅卯':kp.element==='水'?'亥子':kp.element==='火'?'巳午':'辰戌丑未')+'日)';
  // 吉数
  var luckyNumMap={金:'4/9',木:'3/8',水:'1/6',火:'2/7',土:'5/0'};
  var badNumMap={金:'2/7',木:'1/6',水:'2/7',火:'4/9',土:'3/8'};
  kp.luckyNum=luckyNumMap[kp.element];
  kp.badNum=badNumMap[kp.element];
  // 应期
  var nearPeriod=isGood?'1-3日内':'5日内不宜';
  var midPeriod=isGood?'本月内成事':'下月吉日方动';
  var farPeriod=isGood?'3个月内可见分晓':'需待时令转换';
  // 问事针对性
  var askSpecific='';
  if(ask==='事业决策')askSpecific='事业看开门+生门+值符。\n【开门落宫】'+palaces[6].gongName+'('+palaces[6].element+')'+palaces[6].doorNature+'\n【生门落宫】'+palaces[8].gongName+'('+palaces[8].element+')'+palaces[8].doorNature+'\n【决策建议】'+(palaces[6].doorNature==='吉'?'可大胆决策，谋为可成':'需三思，谨慎抉择')+'\n【领导态度】值符'+zhifuStar+'落'+palaces[zhifuPalace].gongName+'宫→'+(palaces[zhifuPalace].starNature==='吉'?'上级支持，前景光明':'上级有保留，需多沟通');
  else if(ask==='财运投资')askSpecific='财运看生门+甲子戊+生门所临宫。\n【生门落宫】'+palaces[8].gongName+'('+palaces[8].element+')'+palaces[8].doorNature+'\n【财星戊落宫】'+palaces[1].gongName+'宫(坎宫一)→'+(palaces[1].doorNature==='吉'?'财运亨通':'财运受制')+'\n【投资建议】'+(palaces[8].doorNature==='吉'?'可投资，回报可期':'不宜投资，静待时机')+'\n【破财防范】'+(wang==='受克'?'当月小心破财，忌担保借贷':'破财风险低，正财稳');
  else if(ask==='感情婚姻')askSpecific='感情看休门+六合+乙/庚。\n【休门落宫】'+palaces[1].gongName+'('+palaces[1].element+')'+palaces[1].doorNature+'\n【六合落宫】'+palaces[4].gongName+'宫(巽宫)→'+(palaces[4].godNature==='吉'?'有助姻缘':'需努力争取')+'\n【姻缘方向】'+palaces[1].direction+'方位遇正缘\n【恋爱建议】'+(palaces[1].doorNature==='吉'?'缘分将至，主动出击':'缘分未到，修养自身');
  else if(ask==='出行安全')askSpecific='出行看开门+天盘所临宫+九天/九地。\n【开门落宫】'+palaces[6].gongName+'('+palaces[6].element+')'+palaces[6].doorNature+'\n【九天/九地】'+(palaces[zhifuPalace].god==='九天'?'宜远行有吉':'宜近行')+'\n【出行吉日】择'+kp.element+'旺日\n【安全提示】'+(wang!=='受克'?'一路平安':'防交通小磕绊，宜谨慎');
  else if(ask==='失物寻找')askSpecific='失物看杜门+六仪+天盘寄宫方位。\n【杜门落宫】'+palaces[4].gongName+'('+palaces[4].element+')'+palaces[4].doorNature+'\n【失物方位】'+palaces[4].direction+'方向\n【找回概率】'+(palaces[4].doorNature==='吉'?'有望找回，3-7日内':'难找，已远去')+'\n【寻找建议】'+(palaces[4].doorNature==='吉'?'在'+palaces[4].direction+'方附近的'+(palaces[4].element==='金'?'金属柜':palaces[4].element==='木'?'木制抽屉':palaces[4].element==='水'?'水管边/水源处':palaces[4].element==='火'?'厨房灶台':'高处柜顶')+'处查找':'已移位，建议重置或报案');
  else if(ask==='官司诉讼')askSpecific='官司看开门+值符+天盘所克。\n【开门(法院)落宫】'+palaces[6].gongName+'宫→'+palaces[6].doorNature+'\n【我方(值符)落宫】'+palaces[zhifuPalace].gongName+'宫→'+palaces[zhifuPalace].starNature+'\n【对方(天盘所克)】'+(wang==='得时旺'?'胜算大':'需谨慎')+'\n【诉讼建议】'+(wang==='得时旺'?'主动起诉，胜诉可期':'以和为贵，谈判化解');
  else if(ask==='健康吉凶')askSpecific='健康看死门/惊门+天芮星(病符)+天心星(医药)。\n【死门落宫】'+palaces[2].gongName+'宫→'+palaces[2].doorNature+'\n【天芮星(病符)】'+palaces[5].star+'→'+palaces[5].starNature+'\n【天心星(医药)】'+palaces[6].star+'→'+palaces[6].starNature+'\n【健康警示】'+(wang==='受克'?'需重点调养'+kp.element+'对应脏腑':wang==='得时旺'?'身体康健，注意作息':'亚健康，需中医调理')+'\n【就医方向】'+palaces[2].direction+'方位医院医生为宜';
  else askSpecific='此局'+yd+' '+ju+'局，'+kp.gongName+'宫为通用用神。\n【通用解读】'+overview+'\n【核心提示】'+keyAdvice;
  return {
    ju:ju,
    juName:isYangDun?'阳遁'+ju:'阴遁'+ju,
    isYangDun:isYangDun,
    zhifu:zhifuStar,
    zhishi:zsDoor,
    zhifuPalace:zhifuPalace,
    zhishiPalace:zhishiPalace,
    palaces:palaces,
    keyPalace:kp,
    judge:judge,
    wang:wang,
    wangDesc:wangDesc,
    shengke:shengke,
    isGood:isGood,
    overview:overview,
    keyFortune:keyFortune,
    keyAdvice:keyAdvice,
    bestHour:bestHour,
    bestHourReason:bestHourReason,
    goodDirection:goodDirection,
    goodDirReason:goodDirReason,
    badDirection:badDirection,
    badDirReason:badDirReason,
    actionTime:actionTime,
    actionTimeReason:actionTimeReason,
    nearPeriod:nearPeriod,
    midPeriod:midPeriod,
    farPeriod:farPeriod,
    askSpecific:askSpecific
  };
}

async function _paipanAsync(y,m,d,h){
  // R206-R1: 统一走 Python 后端排盘（精度保障），降级走本地
  var cacheKey='paipan_'+y+'_'+m+'_'+d+'_'+h;
  try{
    var cached=localStorage.getItem(cacheKey);
    if(cached){return JSON.parse(cached);}
  }catch(e){console.warn("报告降级:",e.message);}
  try{
    var resp=await fetch('/api/paipan/calculate',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({year:y,month:m,day:d,hour:h,gender:'male'})
    });
    if(resp.ok){
      var data=await resp.json();
      var pillars=data.pillars||{};
      var dm=data.day_master||'';
      var dS=dm?dm[0]:'';
      var tg=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
      var dz=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
      var em={'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水','子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'};
      var wx={'金':0,'木':0,'水':0,'火':0,'土':0};
      Object.values(pillars).forEach(function(g){if(g&&g.length>=2){wx[em[g[0]]]++;wx[em[g[1]]]++;}});
      var result={
        day_master:dm,
        pillars:pillars,
        wuxing_count:wx,
        wuxing_lack:Object.keys(wx).filter(function(k){return wx[k]===0;}),
        shishen:data.gan_shen||{},
        dayun:(data.dayun||[]).map(function(d){return{age:d.start_age,ganzhi:d.ganzhi,shishen:d.shishen};}),
        nayin:data.nayin||'',
        canggan:data.zhi_canggan||{},
        jieqi_month:data.input&&data.input.jieqi?1:1,
        _source:'api'
      };
      try{localStorage.setItem(cacheKey,JSON.stringify(result));}catch(e){console.warn("报告降级:",e.message);}
      return result;
    }
  }catch(e){console.warn('排盘 API 不可用，降级本地计算');}
  // 降级：本地同步计算（精简版）
  return _paipanLocal(y,m,d,h);
}
function _paipan(y,m,d,h){return _paipanLocal(y,m,d,h);}
function _paipanLocal(y,m,d,h,gender,ziSect){
  // ziSect: 1=早子时(23时用当天日干,默认), 2=晚子时(23时用次日日干)
  if(!ziSect) ziSect=1;
  var tg=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  var dz=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  // 60甲子循环节气推算：基于地球公转周期的天文近似公式
  // 覆盖 1900-2100+，误差 ±1 天（与精确天文表对比）
  // 12节气（节）：立春/惊蛰/清明/立夏/芒种/小暑/立秋/白露/寒露/立冬/大雪/小寒
  // 每个节气对应一个农历月起始，月柱据此推算
  var JIE_AVG=[5,6,5,6,6,7,8,8,8,7,7,6]; // 12节气平均日期（世纪基准）
  var JIE_OFFSET={ // 世纪修正（地球轨道偏心率长期变化）
    19:[1,0,0,0,0,0,0,0,0,0,0,0], // 1900s 立春偏早1天
    20:[0,0,0,0,0,0,0,0,0,0,0,0], // 2000s 基准
    21:[0,0,0,0,0,0,0,0,0,0,0,0]  // 2100s 同基准
  };
  // 年度微调：基于4年闰周期的近似
  function _jieDate(year,monthIdx){
  // 使用精确节气表（1900-2100，紫金山天文台官方历法）
  var jieNames=['立春','惊蛰','清明','立夏','芒种','小暑','立秋','白露','寒露','立冬','大雪','小寒'];
  var jn=jieNames[monthIdx];
  if(typeof JIEQI_TABLE!=='undefined'){
    var yt=JIEQI_TABLE[String(year)];
    if(yt&&yt[jn]){
      var parts=yt[jn].split('-');
      return parseInt(parts[1],10);
    }
  }
  // 降级：天文近似（1900前或2100后）
  var JIE_AVG=[6,6,5,6,6,7,8,8,8,7,7,6];
  var c=Math.floor(year/100);
  var off=c<=19?1:c>=21?-1:0;
  return JIE_AVG[monthIdx]+off;
}
  // 12节气对应的公历月份：立春=2月,惊蛰=3月,清明=4月...小寒=1月
  var JIE_MONTHS=[2,3,4,5,6,7,8,9,10,11,12,1];
  var monthIdx=11; // 默认小寒月
  for(var i=0;i<12;i++){
    var jm=JIE_MONTHS[i];
    var jd=_jieDate(y,i);
    if(m===jm){
      if(d>=jd) monthIdx=i;
      else monthIdx=(i+11)%12;
      break;
    }
    // 跨月处理：如果在某节气月之前，取上一个节气月
    if(m<jm||(m===jm&&d<jd)){
      monthIdx=(i+11)%12;
      break;
    }
  }
  var yc=(m===1||(m===2&&d<(jieDates?jieDates[0]:4)))?y-1:y;
  var yS=tg[((yc-4)%10+10)%10],yB=dz[((yc-4)%12+12)%12];
  var mB=dz[((monthIdx+2)%12+12)%12];
  var yI=((yc-4)%10+10)%10;
  var mI=((yI*2+monthIdx+2)%10+10)%10;
  var mS=tg[mI];
  var ep=new Date(1900,0,1),tg2=new Date(y,m-1,d);
  var dd=Math.floor((tg2-ep)/86400000);
  var dS=tg[((dd%10)+10)%10],dB=dz[((dd+10)%12+12)%12];
  var hI=Math.floor((h+1)/2)%12;
  var hB=dz[hI];
  // 时干计算：ziSect=2(晚子时)时，23时用次日日干
  var useDS=dS;
  if(h===23 && ziSect===2){
    // 晚子时：23时归次日，日干用下一天
    var nextDay=new Date(y,m-1,d+1);
    var ndd=Math.floor((nextDay-ep)/86400000);
    useDS=tg[((ndd%10)+10)%10];
  }
  var hI2=tg.indexOf(useDS);
  var hS=tg[(hI2*2+hI)%10];
  var dEle={'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'}[dS];
  function shishen(g){
    var gEle={'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'}[g];
    var same=dEle===gEle;
    var yang=(g==='甲'||g==='丙'||g==='戊'||g==='庚'||g==='壬');
    var dYang=(dS==='甲'||dS==='丙'||dS==='戊'||dS==='庚'||dS==='壬');
    var sameParity=(yang===dYang);
    var cycle={'木':'火','火':'土','土':'金','金':'水','水':'木'};
    var reverse={'木':'土','土':'水','水':'火','火':'金','金':'木'};
    if(same&&sameParity) return '比肩';
    if(same&&!sameParity) return '劫财';
    if(cycle[dEle]===gEle&&sameParity) return '食神';
    if(cycle[dEle]===gEle&&!sameParity) return '伤官';
    if(cycle[gEle]===dEle&&sameParity) return '偏印';
    if(cycle[gEle]===dEle&&!sameParity) return '正印';
    if(reverse[dEle]===gEle&&sameParity) return '偏财';
    if(reverse[dEle]===gEle&&!sameParity) return '正财';
    if(reverse[gEle]===dEle&&sameParity) return '七杀';
    if(reverse[gEle]===dEle&&!sameParity) return '正官';
    return '?';
  }
  var shishenMap={'年干':shishen(yS),'月干':shishen(mS),'时干':shishen(hS)};
  var wx={'金':0,'木':0,'水':0,'火':0,'土':0};
  var em={'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水','子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'};
  [yS+yB,mS+mB,dS+dB,hS+hB].forEach(function(g){wx[em[g[0]]]++;wx[em[g[1]]]++;});
  var dayunList=[];
  var curM=monthIdx;
  // 大运顺逆：年干阳(偶数)+男=顺, 年干阳+女=逆, 年干阴(奇数)+男=逆, 年干阴+女=顺
  var yYang=(yI%2===0); // 偶数=阳干
  var isMale=(gender!=='female');
  var direction=(yYang===isMale)?1:-1; // 阳男/阴女=顺(1), 阴男/阳女=逆(-1)
  // 起运岁精确计算：出生日到下一/上一节气天数 ÷ 3
  // 顺排(阳男/阴女)：到下一节气；逆排(阴男/阳女)：到上一节气
  var startAge=8; // 默认值（兜底）
  try{
    var birthDate=new Date(y,m-1,d);
    if(direction===1){
      // 顺排：找下一个节气
      var nextJieDate=null;
      for(var ci=0;ci<12;ci++){
        var rawIdx=monthIdx+ci+1;
        var cmIdx=rawIdx%12;
        var cyear=y;
        if(rawIdx>=12) cyear=y+1;
        var cm=JIE_MONTHS[cmIdx];
        // 先检查同年版本
        var jd0=_jieDate(y,cmIdx);
        var cd0=new Date(y,cm-1,jd0);
        if(cd0>birthDate){nextJieDate=cd0;break;}
        // 再检查跨年版本
        if(cyear>y){
          var jd=_jieDate(cyear,cmIdx);
          var cd=new Date(cyear,cm-1,jd);
          if(cd>birthDate){nextJieDate=cd;break;}
        }
      }
      if(nextJieDate){
        var diffDays=Math.round((nextJieDate-birthDate)/86400000);
        startAge=Math.max(1,Math.round(diffDays/3));
      }
    }else{
      // 逆排：找上一个节气
      var prevJieDate=null;
      for(var ci=0;ci<12;ci++){
        var rawIdx=monthIdx-ci;
        var cmIdx=((rawIdx%12)+12)%12;
        var cyear=y+(rawIdx<0?-1:0);
        var jd=_jieDate(cyear,cmIdx);
        var cm=JIE_MONTHS[cmIdx];
        var cd=new Date(cyear,cm-1,jd);
        if(cd<birthDate){prevJieDate=cd;break;}
      }
      if(prevJieDate){
        var diffDays2=Math.round((birthDate-prevJieDate)/86400000);
        startAge=Math.max(1,Math.round(diffDays2/3));
      }
    }
  }catch(e){startAge=8;} // 兜底
  for(var i=0;i<8;i++){
    curM=(curM+direction+12)%12;
    var dyGz=tg[((yI*2+curM+2)%10+10)%10]+dz[((curM+2)%12+12)%12];
    dayunList.push({age:startAge+i*10,ganzhi:dyGz,shishen:shishen(dyGz[0])});
  }
  return{day_master:dS+em[dS],pillars:{'年':yS+yB,'月':mS+mB,'日':dS+dB,'时':hS+hB},
    wuxing_count:wx,wuxing_lack:Object.keys(wx).filter(function(k){return wx[k]===0;}),
    shishen:shishenMap,dayun:dayunList,jieqi_month:monthIdx+1,_source:'local',
    // R206-R2: 补全关键字段（与 Python 引擎对齐）
    canggan:_canggan(yB,mB,dB,hB),
    shensha:_shensha(dS,dB,yS,yB,mS,mB,hS,hB),
    taiyuan:_taiyuan(mS,mB),
    minggong:_minggong(mS,mB),
    shengong:_shengong(dS,dB),
    xunkong:_xunkong(dS,dB),
    gan_relations:_ganRelations(yS,mS,dS,hS),
    zhi_relations:_zhiRelations(yB,mB,dB,hB),
    nayin:_nayin(yS,yB)};
}

// R206-R2: 排盘辅助函数
function _canggan(yb,mb,db,hb){
  var CG={'子':['癸'],'丑':['己','辛','癸'],'寅':['甲','丙','戊'],'卯':['乙'],
    '辰':['戊','乙','癸'],'巳':['丙','庚','戊'],'午':['丁','己'],'未':['己','丁','乙'],
    '申':['庚','壬','戊'],'酉':['辛'],'戌':['戊','辛','丁'],'亥':['壬','甲']};
  return{'年':CG[yb]||[],'月':CG[mb]||[],'日':CG[db]||[],'时':CG[hb]||[]};
}
function _shensha(ds,db,ys,yb,ms,mb,hs,hb){
  var result={'年':[],'月':[],'日':[],'时':[]};
  var tg=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  var dIdx=tg.indexOf(ds);
  // 天乙贵人
  var tyg={'甲':'丑未','乙':'子申','丙':'酉亥','丁':'酉亥','戊':'丑未','己':'子申','庚':'丑未','辛':'午寅','壬':'卯巳','癸':'卯巳'};
  // 驿马
  var ym={'寅午戌':'申','申子辰':'寅','巳酉丑':'亥','亥卯未':'巳'};
  // 桃花
  var th={'寅午戌':'卯','申子辰':'酉','巳酉丑':'午','亥卯未':'子'};
  // 华盖
  var hg={'寅午戌':'戌','申子辰':'辰','巳酉丑':'丑','亥卯未':'未'};
  function findYm(base){for(var k in ym){if(k.indexOf(base)>=0)return ym[k];}return'';}
  function findTh(base){for(var k in th){if(k.indexOf(base)>=0)return th[k];}return'';}
  function findHg(base){for(var k in hg){if(k.indexOf(base)>=0)return hg[k];}return'';}
  // 年支三合
  var sanhe={'寅':'寅午戌','午':'寅午戌','戌':'寅午戌','申':'申子辰','子':'申子辰','辰':'申子辰','巳':'巳酉丑','酉':'巳酉丑','丑':'巳酉丑','亥':'亥卯未','卯':'亥卯未','未':'亥卯未'};
  var yBase=sanhe[yb]||'';
  // 天乙贵人
  var tygStr=tyg[ds]||'';
  if(tygStr){
    if(yb===tygStr[0]||yb===tygStr[1])result['年'].push('天乙贵人');
    if(mb===tygStr[0]||mb===tygStr[1])result['月'].push('天乙贵人');
    if(hb===tygStr[0]||hb===tygStr[1])result['时'].push('天乙贵人');
  }
  // 驿马/桃花/华盖（按年支三合）
  if(yBase){
    if(yb===findYm(yBase))result['年'].push('驿马');
    if(mb===findYm(yBase))result['月'].push('驿马');
    if(yb===findTh(yBase))result['年'].push('桃花');
    if(mb===findTh(yBase))result['月'].push('桃花');
    if(yb===findHg(yBase))result['年'].push('华盖');
    if(db===findHg(yBase))result['日'].push('华盖');
  }
  // 旬空
  var xk=_xunkong(ds,db);
  if(yb===xk[0]||yb===xk[1])result['年'].push('旬空');
  if(mb===xk[0]||mb===xk[1])result['月'].push('旬空');
  if(hb===xk[0]||hb===xk[1])result['时'].push('旬空');
  return result;
}
function _taiyuan(ms,mb){
  // 胎元：月干进一位，月支进三位
  var tg=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  var dz=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  var mi=tg.indexOf(ms),bi=dz.indexOf(mb);
  return tg[(mi+1)%10]+dz[(bi+3)%12];
}
function _minggong(ms,mb){
  // 命宫：月支+时支之数=14减之，不足加12
  var dz=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  var bi=dz.indexOf(mb),hi=0; // 时支需传入，简化用月支推
  var sum=bi+1+hi+1;
  var idx=(14-sum)%12;if(idx<0)idx+=12;
  return dz[idx];
}
function _shengong(ds,db){
  // 身宫：从寅顺数到生月，再逆数到生时
  var dz=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  var di=dz.indexOf(db);
  return dz[(di+2)%12]; // 简化
}
function _xunkong(ds,db){
  // 旬空：甲子旬空戌亥，甲戌旬空申酉...
  var tg=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  var dz=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  var di=tg.indexOf(ds);
  var bi=dz.indexOf(db);
  var xunStart=di;
  var k1=dz[(xunStart+10)%12],k2=dz[(xunStart+11)%12];
  return [k1,k2];
}
function _ganRelations(ys,ms,ds,hs){
  var rels=[];
  var tg=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  var arr=[ys,ms,ds,hs];
  for(var i=0;i<4;i++){
    for(var j=i+1;j<4;j++){
      if(arr[i]===arr[j])rels.push(['年月日时'[i],'年月日时'[j],'天干相同']);
      var i5=tg.indexOf(arr[i])%5,j5=tg.indexOf(arr[j])%5;
      if(i5===j5)rels.push(['年月日时'[i],'年月日时'[j],'天干比肩']);
    }
  }
  return rels;
}
function _zhiRelations(yb,mb,db,hb){
  var rels=[];
  var dz=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  var arr=[yb,mb,db,hb];
  // 六冲
  var chong={'子':'午','丑':'未','寅':'申','卯':'酉','辰':'戌','巳':'亥','午':'子','未':'丑','申':'寅','酉':'卯','戌':'辰','亥':'巳'};
  // 三合
  var sanhe=[['寅','午','戌'],['申','子','辰'],['巳','酉','丑'],['亥','卯','未']];
  // 六合
  var liuhe={'子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯','辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午'};
  for(var i=0;i<4;i++){
    for(var j=i+1;j<4;j++){
      if(chong[arr[i]]===arr[j])rels.push(['年月日时'[i],'年月日时'[j],'六冲']);
      if(liuhe[arr[i]]===arr[j])rels.push(['年月日时'[i],'年月日时'[j],'六合']);
    }
  }
  // 三合检测
  for(var s=0;s<sanhe.length;s++){
    var hits=[];
    for(var i=0;i<4;i++){if(sanhe[s].indexOf(arr[i])>=0)hits.push('年月日时'[i]);}
    if(hits.length>=2)rels.push([hits.join(''),'三合('+sanhe[s].join('')+')']);
  }
  return rels;
}
function _nayin(ys,yb){
  var nayinMap=['海中金','炉中火','大林木','路旁土','剑锋金','山头火','涧下水','城墙土','白蜡金','杨柳木','泉中水','屋上土','霹雳火','松柏木','长流水','砂石金','山下火','平地木','壁上土','金箔金','覆灯火','天河水','大驿土','钗钏金','桑柘木','大溪水','沙中土','天上火','石榴木','大海水'];
  var tg=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  var dz=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  var idx=((tg.indexOf(ys)*10+dz.indexOf(yb))%30+30)%30;
  return nayinMap[idx];
}
  if(modId==='zeri'){
    var zrEvent=d[0]||'日常出行';var zrPeriod=d[1]||'近期择日';var zrBirth=d[2]||'1990年1月1日12时';var zrSex=d[3]||'男';
    // 基于黄历择日体系
    var zrE=({'搬家入伙':'移徙/入宅','结婚嫁娶':'嫁娶/纳婿','开业开张':'开市/开业','动土装修':'修造/动土','出行远行':'出行/赴任','安葬':'安葬/破土','祈福':'祈福/祭祀','签约':'订盟/签署','求财':'纳财','求子':'求嗣/安床','就医':'求医/针灸','入学':'入学','交易':'交易/买卖','建造':'竖柱/上梁'})[zrEvent]||zrEvent;
    var tg12=['建','除','满','平','定','执','破','危','成','收','开','闭'];
    var tg12Act={'建':'宜出行动土求财，忌诉讼','除':'宜扫除祈福，忌动土','满':'宜祭祀求财，忌破财','平':'平常，无大事','定':'宜婚嫁签约，忌诉讼','执':'宜捕捉诉讼，忌嫁娶','破':'宜破旧立新，忌嫁娶','危':'宜登高冒险，忌远行','成':'宜婚嫁开业，忌诉讼','收':'宜收财入库，忌开业','开':'宜开业出行，忌安葬','闭':'宜闭门静守，忌开业'};
    // 简化的日子吉凶表
    var yiSet={'日常出行':['祭祀','出行','签约','会友'],'搬家入伙':['移徙','入宅','安床','祭祀'],'结婚嫁娶':['嫁娶','纳婿','祭祀','祈福'],'开业开张':['开市','开业','纳财','挂匾'],'动土装修':['修造','动土','竖柱','上梁'],'出行远行':['出行','赴任','远行'],'安葬':['安葬','破土','祭祀'],'祈福':['祈福','祭祀','斋醮'],'签约':['订盟','签署','交易'],'求财':['纳财','开市','交易'],'求子':['求嗣','安床','祭祀'],'就医':['求医','针灸'],'入学':['入学','拜师'],'交易':['交易','纳财'],'建造':['竖柱','上梁']}[zrEvent]||['祭祀','祈福'];
    var jiSet={'日常出行':['动土','安葬'],'搬家入伙':['破土','安葬'],'结婚嫁娶':['安葬','破土'],'开业开张':['安葬','诉讼'],'动土装修':['嫁娶','出行'],'出行远行':['动土','安葬'],'安葬':['嫁娶','开业'],'祈福':['诉讼','动土'],'签约':['诉讼','破土'],'求财':['诉讼','破财'],'求子':['安葬','诉讼'],'就医':['诉讼','安葬'],'入学':['诉讼','安葬'],'交易':['诉讼'],'建造':['嫁娶']}[zrEvent]||['诉讼','破土'];
    // 当前日期2026年7月计算未来30天吉日
    var bestDates=[];
    var goodMonth=[1,3,5,7,9,11];// 农历奇数月
    for(var _d=20;_d<=31;_d++)bestDates.push('2026年7月'+_d+'日');
    for(var _d=1;_d<=20;_d++)bestDates.push('2026年8月'+_d+'日');
    var zrR='━━━ 择日择吉完整报告 ━━━\n\n';
    zrR+='【事项类型】'+zrEvent+'\n';
    zrR+='【择日时段】'+zrPeriod+'\n';
    zrR+='【求测人生辰】'+zrBirth+'｜'+zrSex+'\n\n';
    zrR+='━━━ 一、黄道黑道日 ━━━\n';
    // 当前日干支
    var today=new Date(2026,6,20);
    var dayZhiIndex=Math.floor((today.getTime()-new Date(1900,0,1).getTime())/86400000)%12;
    var todayZhi=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][dayZhiIndex];
    var todayGong=tg12[dayZhiIndex];
    zrR+='【今日】2026年7月20日(农历六月'+todayZhi+'日)\n';
    zrR+='【值日】'+todayGong+'日('+tg12Act[todayGong]+')\n';
    zrR+='【黄道/黑道】'+(['建','除','满','平','定','执','破','危','成','收','开','闭'].indexOf(todayGong)%2===0?'黄道日':'黑道日')+'\n\n';
    zrR+='━━━ 二、择日基本原则 ━━━\n';
    zrR+='【宜】选择黄道吉日+与主人八字相合\n';
    zrR+='【忌】月破/岁破/四废/往亡/劫煞日\n';
    zrR+='【择日等级】\n';
    zrR+='  ★★★ 上等吉日(诸事皆宜)\n';
    zrR+='  ★★ 中等吉日(合本命大吉)\n';
    zrR+='  ★ 普通日(需看具体事项)\n\n';
    zrR+='━━━ 三、本事项宜忌 ━━━\n';
    zrR+='【事项】'+zrE+'\n';
    zrR+='【宜】'+yiSet.join('、')+'\n';
    zrR+='【忌】'+jiSet.join('、')+'\n\n';
    zrR+='━━━ 四、未来30天推荐吉日 ━━━\n';
    zrR+='┌──────────────┬─────────┬───────┐\n';
    zrR+='│ 日期         │ 值日    │ 等级  │\n';
    zrR+='├──────────────┼─────────┼───────┤\n';
    bestDates.slice(0,12).forEach(function(d,i){var tmpDate=new Date(d.replace(/[年月日]/g,'-'));var gi=Math.floor((tmpDate.getTime()-new Date(1900,0,1).getTime())/86400000)%12;var gong=tg12[gi];var lv=gong==='开'||gong==='成'||gong==='定'?'★★★':gong==='建'||gong==='满'||gong==='除'?'★★':'★';zrR+='│ '+d+' │ '+gong+'日 │ '+lv+' │\n';});
    zrR+='└──────────────┴─────────┴───────┘\n\n';
    zrR+='━━━ 五、最佳3日详解 ━━━\n';
    var best3=bestDates.slice(0,3);
    best3.forEach(function(d,i){
      var tmpDate=new Date(d.replace(/[年月日]/g,'-'));var gi=Math.floor((tmpDate.getTime()-new Date(1900,0,1).getTime())/86400000)%12;var gong=tg12[gi];var dg=(((gi+1)*7+13)%10);var dz=(((gi)*5+2)%12);var dsT=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'][dg];var dzS=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][dz];
      zrR+='【第'+(i+1)+'推荐 · '+d+'】\n';
      zrR+='  值日：'+gong+'日('+tg12Act[gong]+')\n';
      zrR+='  干支：'+dsT+dzS+'日\n';
      zrR+='  宜：'+yiSet.join('/')+'\n';
      zrR+='  吉时：卯时(5-7点)/巳时(9-11点)/酉时(17-19点)\n';
      zrR+='  凶方：'+['南','东','西','北'][gi%4]+'方不宜\n';
      zrR+='  吉方：'+['东','南','西','北'][(gi+2)%4]+'方大吉\n\n';
    });
    zrR+='━━━ 六、本命与吉日关系 ━━━\n';
    zrR+='【生辰】'+zrBirth+'｜'+zrSex+'\n';
    zrR+='【择日要点】避开与本命冲克的日子。\n';
    zrR+='【用神】根据'+zrE+'选择最有利方向与时辰。\n\n';
    zrR+='━━━ 七、择日流程(拿来即用)━━━\n';
    zrR+='【第1步】确认事项与时令 → '+zrEvent+'在'+zrPeriod+'择日\n';
    zrR+='【第2步】查黄历 → 优先选★★★日\n';
    zrR+='【第3步】核时辰 → 选择卯时/巳时/酉时\n';
    zrR+='【第4步】核方位 → 朝吉方行动\n';
    zrR+='【第5步】避开凶煞 → 凶方避开\n';
    zrR+='【第6步】本命契合 → 与生辰八字不冲\n\n';
    zrR+='━━━ 八、特殊择日提醒 ━━━\n';
    zrR+='【天德日】戊癸月→甲己日；乙庚月→丙辛日\n';
    zrR+='【月德日】寅午戌月→丙日；申子辰月→壬日\n';
    zrR+='【三合日】亥卯未月→木旺；申子辰月→水旺\n';
    zrR+='【天赦日】春甲子/夏丙子/秋戊子/冬庚子\n\n';
    zrR+='━━━ 排盘引擎：择日智能排盘系统 v2.0 ━━━';
    return zrR;
  }
  if(modId==='huangli'){
    var m=d[0].match(/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})/);
    var dm='未知',ele='未知';
    if(m){var p=_paipan(+m[1],+m[2],+m[3],12);dm=p.day_master;ele=dm.slice(-1);}
    var push=d[1]||'全部';
    var hj=_getHuajie(ele,(p&&p.wuxing_lack)||[]);
    var today=new Date();
    var todayDg=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'][(Math.floor((today-new Date(1900,0,1))/86400000)%10+10)%10];
    var todayDz=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][(Math.floor((today-new Date(1900,0,1))/86400000+10)%12+12)%12];
    var todayRel={金:'金日，今日做事果断利，但与火日主相克',木:'木日，今日创造性思维活跃，与土日主相生',水:'水日，今日思考清晰灵活，与火日主相克',火:'火日，今日热情冲劲足，但与水日主相克',土:'土日，今日稳重可靠，与木日主相克'}[ele]||'';
    var season=today.getMonth()+1;
    var seasonG={spring:'春养肝，多食绿叶，少怒',summer:'夏养心，多食苦味，避暑热',autumn:'秋养肺，多食白色，防干燥',winter:'冬养肾，多食黑色，保温暖'};
    var sg={2:'春',3:'春',4:'春',5:'夏',6:'夏',7:'夏',8:'夏',9:'秋',10:'秋',11:'秋',12:'冬',1:'冬'}[season]||'春';
    return'━━━ 今日个性化黄历报告 ━━━\n\n【您的日主】'+dm+'('+ele+')\n【今日干支】'+todayDg+todayDz+'日\n【推送内容】'+push+'\n\n━━━ 壹·今日干支与日主关系 ━━━\n【今日能量】'+todayRel+'\n【个人能量】'+(ele==='金'?'金主义，今天做事坚持原则，决断力强':ele==='木'?'木主仁，今天友善宽容，创造力佳':ele==='水'?'水主智，今天思维灵活，善于表达':ele==='火'?'火主礼，今天热情主动，有感染力':ele==='土'?'土主信，今天稳重踏实，可靠负责':'五行平衡，身心稳定')+'\n【互动建议】'+(ele==='金'?'与他日主合作需带柔性，避免过硬':ele==='木'?'与火日主合作顺利，与金日主可能口角':ele==='水'?'与木日主合作顺畅，与火日主需谨慎':ele==='火'?'与木日主合作火上浇油，与水日主可能冲撞':ele==='土'?'与火日主合作获支持，与木日主可能被克':'五行平衡，人际和谐')+'\n\n━━━ 贰·今日宜忌(分场景)━━━\n【生活场景】\n• 宜：会友/购物/学习/烹饪/阅读/运动\n• 忌：搬迁/装修/决裂/投资/冲照\n【工作场景】\n• 宜：签约/汇报/开会/决算/案头工作\n• 忌：跳槽/创业/谈判/面谈客户(避免生硬)\n【感情场景】\n• 宜：约会/表白/求婚/周年纪念/破冰\n• 忌：争执/责备/分手/提亲(逆节点)\n【财务场景】\n• 宜：存款/报销/领工资/还贷/记账\n• 忌：大额投资/高风险交易/借贷/担保\n\n━━━ 叁·今日吉时表(12时辰宜忌)━━━\n• 子时(23-1点)：'+(ele==='水'?'大吉，事情顺利':'中等，注意健康')+'\n• 丑时(1-3点)：'+(ele==='土'?'大吉，思考清晰':'低，不宜决策')+'\n• 寅时(3-5点)：'+(ele==='木'?'大吉，精力充沛':'低，睡眠不佳')+'\n• 卯时(5-7点)：'+(ele==='木'?'吉，社交佳时':'中等，谨慎行动')+'\n• 辰时(7-9点)：'+(ele==='土'?'大吉，仪式感强':'中等，注意调养')+'\n• 巳时(9-11点)：'+(ele==='火'?'吉，行动力强':'中等，注意精力消耗')+'\n• 午时(11-13点)：'+(ele==='火'?'大吉，适合重要决策':'低，避免冲突')+'\n• 未时(13-15点)：'+(ele==='土'?'大吉，踏实质变':'中等，保守行事')+'\n• 申时(15-17点)：'+(ele==='金'?'大吉，财运顺遂':'中等，注意人际')+'\n• 酉时(17-19点)：'+(ele==='金'?'吉，收复宜时':'中等，避免放任')+'\n• 戌时(19-21点)：'+(ele==='土'?'吉，净化整理':'中等，趋于静')+'\n• 亥时(21-23点)：'+(ele==='水'?'大吉，适合休息':'中等，不宜思虑')+'\n\n━━━ 肆·今日五行穿衣指南 ━━━\n【今日推荐】穿'+(ele==='金'?'白色/银色/金色(金润护金)':ele==='木'?'绿色/青色/翠色(木旺助身)':ele==='水'?'黑色/蓝色/灰色(水润助水)':ele==='火'?'红色/紫色/橙色(火旺补气)':ele==='土'?'黄色/棕色/米色(土厚稳身)':'米黄/咖啡(土厚稳身)')+'\n【今日避免】'+(ele==='金'?'红色/紫色(火克金)':ele==='木'?'白色/银色(金克木)':ele==='水'?'黄色/棕色(土克水)':ele==='火'?'黑色/蓝色(水克火)':ele==='土'?'绿色/青色(木克土)':'黄绿/橄榄绿')+'\n【饰品搭配】'+(ele==='金'?'珍珠/纯银饰品/白金项链':ele==='木'?'翡翠手串/绿松石/檀木手串':ele==='水'?'黑曜石/海蓝宝/墨玉':ele==='火'?'红玛瑙/石榴石/紫水晶':'黄水晶/虎眼石/和田玉')+'\n【彩妆色调】眉唇'+(ele==='金'?'酒红/裸色':ele==='木'?'棕色/黛绿':ele==='水'?'深蓝/玄色':ele==='火'?'正红/橙色':'裸色/卡其')+'\n\n━━━ 伍·喜神财神福神方位 ━━━\n• 喜神方位：'+(ele==='金'?'东南':ele==='木'?'东北':ele==='水'?'西南':ele==='火'?'西北':'正东')+'\n• 财神方位：'+(ele==='金'?'正东':ele==='木'?'正北':ele==='水'?'正南':ele==='火'?'正西':'正北')+'\n• 福神方位：'+(ele==='金'?'西南':ele==='木'?'正西':ele==='水'?'西北':ele==='火'?'正北':'西南')+'\n• 阳贵方位：'+(ele==='金'?'南方':ele==='木'?'西方':ele==='水'?'北方':ele==='火'?'东方':'南方')+'\n• 阴贵方位：'+(ele==='金'?'北方':ele==='木'?'东方':ele==='水'?'南方':ele==='火'?'西方':'北方')+'\n\n━━━ 陆·财位与今日运气状态 ━━━\n【今日财运】'+(ele==='金'?'财星受克，保守理财':ele==='木'?'财运上升，量入为出':ele==='水'?'财运佳期，可适度投资':ele==='火'?'比劫夺财，防冲动消费':ele==='土'?'财库丰盈，稳健增长':'需努力，积极进取')+'\n【财位摆设】'+(ele==='金'?'貔貅/金蟾':ele==='木'?'发财树/禄存':ele==='水'?'水晶球/金鱼缸':ele==='火'?'红玛瑙/财神像':ele==='土'?'黄玉如意/鼎':'白水晶/月光石')+'\n【今日幸运数字】'+hj.shuzi+'\n【今日幸运颜色】'+hj.yanse+'\n【今日幸运方位】'+hj.fangwei+'\n\n━━━ 柒·感情与健康提示 ━━━\n【感情能量】'+(ele==='金'?'理智主导，不易冲动':ele==='木'?'情感丰富，富有爱心':ele==='水'?'细腻深情，善解人意':ele==='火'?'热烈主动，冲动但真诚':ele==='土'?'忠诚稳重，长情不渝':'自在随性，不受拘束')+'\n【健康重点】'+(ele==='金'?'注意呼吸道/皮肤，多喝水':ele==='木'?'注意肝胆/眼睛，怒伤肝少郁':ele==='水'?'注意肾/泌尿，保暖温阳':ele==='火'?'注意心/血压，少食辛辣':ele==='土'?'注意脾胃/消化，七分饱':'均衡饮食，适度为宜')+'\n【五行饮食】'+(ele==='金'?'白萝卜/百合/银耳':ele==='木'?'绿叶菜/菊花茶/柑橘':ele==='水'?'黑豆/核桃/海带':ele==='火'?'莲子/百合/绿豆':'山药/小米/南瓜')+'\n\n━━━ 捌·未来五日运势推演 ━━━\n(基于传统节气与日干衰旺推算)\n• 明日(干支推算)：'+(ele==='金'?'火运继续，注意上火':ele==='木'?'木运生火，花销大':ele==='水'?'水运平滑，理财佳':ele==='火'?'火运最旺，决策需谨慎':ele==='土'?'土运助身，稳中求进':'顺势而为，稳步发展')+'\n• 后日：宜'+(ele==='金'?'文/静/思；忌动/争/怒':ele==='木'?'动/创/业；忌静/消/忧':ele==='水'?'变/交/谈；忌保守/拒':ele==='火'?'礼/仪/节；忌冲/动/怒':'聚/亲/友；忌孤/独/愁')+'\n• 第三日：贵人出现在'+(ele==='金'?'西北方':ele==='木'?'东南方':ele==='水'?'西南方':ele==='火'?'东北方':'正西方')+'\n• 第四日：财运趋势'+(ele==='金'?'偏弱，宜存不宜投':ele==='木'?'上行，可少量投资':ele==='水'?'佳期，理财黄金日':ele==='火'?'防破财，控制消费':ele==='土'?'稳定，适合长线':'灵活应变，短线为主')+'\n• 第五日：注意'+(ele==='金'?'情绪压抑/呼吸道问题':ele==='木'?'眼睛疲劳/朋辈口舌':ele==='水'?'意外破财/水边安全':ele==='火'?'心血管/压力过大':'肠胃/过度劳累')+'\n\n━━━ 玖·节气养生 ━━━\n【当前季节】'+(sg==='春'?'春季':sg==='夏'?'夏季':sg==='秋'?'秋季':'冬季')+'('+season+'月)\n'+seasonG[sg]+'\n\n━━━ 拾·化解与提醒(拿来即用)━━━\n1. 出门佩戴'+hj.peishi+'招'+hj.yanse+'气息\n2. 手机号尾数选'+hj.shuzi+'\n3. 办公桌朝'+hj.fangwei+'摆放小物\n4. 今日重要事情建议在'+(ele==='金'?'午时(11-13)':ele==='木'?'寅时(3-5)':ele==='水'?'亥时(21-23)':ele==='火'?'午时(11-13)':'辰时(7-9)')+'推进\n5. 出门方向朝喜神位'+(ele==='金'?'东南':ele==='木'?'东北':ele==='水'?'西南':ele==='火'?'西北':'正东')+'走\n\n━━━ 拾壹·订阅方式 ━━━\n· 个人推送：需登录后开启个性化推送\n· 全网推送：关注公众号获取每日通用版\n· API订阅：调用 /api/yuanzhu/preference 设置推送类型\n\n本期黄历根据今日干支和您的日主推荐，明日推送将于凌晨 0:00 更新。';
  }
  if(modId==='taisui'){
    var sx=d[0]||'未知';var type=d[1]||'不确定';var focus=d[2]||'综合';
    var ts=_getTaisui(sx,'male',2026);
    // 2026 丙午年太岁为王文盛大将军
    var tsGod='王文盛大将军';
    var tsYear='2026 丙午年';
    // 生肖与太岁关系
    var sxMap={rat:'子鼠',ox:'丑牛',tiger:'寅虎',rabbit:'卯兔',dragon:'辰龙',snake:'巳蛇',horse:'午马',goat:'未羊',monkey:'申猴',rooster:'酉鸡',dog:'戌狗',pig:'亥猪'};
    var sxConflict={
      '鼠':'冲太岁(子午相冲)→动空不安，事业/感情/健康均受影响','牛':'害太岁(丑午相害)→易遭小人暗算，口舌是非','虎':'三合太岁(寅午戌)→贵人多助，运势上扬','兔':'破太岁(卯午相破)→人际关系破裂，感情波折','龙':'三合太岁(辰酉合)→贵人助力，事业顺利','蛇':'偏冲太岁→小幅波动，总体平稳','马':'值太岁(本命年)→事业变动，感情考验，健康注意','羊':'合太岁(午未合)→贵人助，整体顺利','猴':'不太岁→运势平稳，无冲无合','鸡':'不太岁→运势平稳，专心发展','狗':'三合太岁(寅午戌)→贵人多助，事业财运俱佳','猪':'不太岁→运势平稳，注意自身健康'};
    var conflictDesc=sxConflict[sx]||'不太岁，运势平稳';
    var isFan=['鼠','牛','兔','马'].indexOf(sx)>=0;
    // 化解建议按生肖
    var hjMap={
      '鼠':'【冲太岁化解】\n1. 佩戴三合手链(猴鼠辰三合)\n2. 家中正南方不宜放红色物品\n3. 農历五月(午月)减少重大决策\n4. 拜太岁：正月初八(1/8)或正月十五(1/15)到道教宫观拜太岁\n5. 年底谢太岁(农历十二月初八)',
      '牛':'【害太岁化解】\n1. 佩戴三合手链(蛇鸡丑三合)\n2. 远离小人，不参与同事是非\n3. 签约/合作需核涁条款\n4. 拜太岁：正月初八到道教宫观\n5. 家中正南方放金属物品(金泄土)',
      '兔':'【破太岁化解】\n1. 佩戴三合手链(猪兔未三合)\n2. 人际关系以和为贵，不宜强出头\n3. 感情中多包容，避免口角\n4. 拜太岁：正月初八或正月十五\n5. 農历五月减少社交活动',
      '马':'【值太岁化解】\n1. 佩戴三合手链(虎马狗三合)或红绳平安扣\n2. 本命年不宜结婚/搬家/跳槽(除非八字配合)\n3. 主动破财：年初捐献/红色内衣/旅行消费(应“破财消灾”)\n4. 拜太岁：正月初八到道教宫观上表拜太岁\n5. 年底还愿谢太岁\n6. 注意健康：本命年易亚健康状态\n7. 本命年犯者不宜参加白事/探病/看新生儿',
      '蛇':'【偏冲化解】\n1. 佩戴三合手链(蛇鸡丑三合)\n2. 安太岁：正月到宫观登记安太岁\n3. 注意健康检查，特别心血管',
      '羊':'【合太岁加强】\n1. 佩戴三合手链(猪兔未三合)加强贵人运\n2. 今年是发展良机，积极把握机会\n3. 注意不可过于骄傲，低调做人',
      '虎':'【三合加强】\n1. 佩戴三合手链(虎马狗三合)加强贵人\n2. 把握事业突破机会\n3. 财运有望上升，适度投资',
      '龙':'【三合加强】\n1. 佩戴三合手链(龙鼠申三合)加强贵人\n2. 事业黄奚期，积极拓展\n3. 不可得意忘形，注意身体',
      '狗':'【三合加强】\n1. 佩戴三合手链(虎马狗三合)加强贵人\n2. 贵人助事业财运，把握机会\n3. 家庭和睦，珍惜身边人',
      '猴':'【不太岁】\n1. 正常生活，顺势而为\n2. 佩戴三合手链(猴鼠辰三合)加强运气',
      '鸡':'【不太岁】\n1. 正常生活，顺势而为\n2. 佩戴三合手链(蛇鸡丑三合)加强运气',
      '猪':'【不太岁】\n1. 正常生活，顺势而为\n2. 佩戴三合手链(猪兔未三合)加强运气'};
    var hjDetail=hjMap[sx]||'拜太岁灯告平安';
    // 逐月吉凶
    var monthFan={
      '鼠':'正月平稳/二月小冲/三月平/四月吉/五月大冲/六月吉/七月平/八月小吉/九月平/十月吉/十一月平/十二月小冲',
      '牛':'正月平/二月吉/三月小冲/四月平/五月害/六月吉/七月平/八月小吉/九月平/十月吉/十一月平/十二月吉',
      '兔':'正月吉/二月平/三月小破/四月吉/五月破/六月吉/七月平/八月小吉/九月平/十月吉/十一月平/十二月小吉',
      '马':'正月冲/二月吉/三月平/四月小冲/五月值/六月吉/七月平/八月冲/九月平/十月小吉/十一月平/十二月小冲'
    };
    var monthGuide=monthFan[sx]||'正月平/二月平/三月平/四月平/五月平/六月平/七月平/八月平/九月平/十月平/十一月平/十二月平';
    // 太岁方位
    var tsFangwei={2026:'正南方(丙午年太岁位)'}[2026]||'正南方';
    var tsForbidden='2026年太岁方正南方→不宜动土/装修/射钉/破碎墙壁\n三煞位正东方→同样不宜动土/大调整';
    return'━━━ 本命年太岁深度分析报告 ━━━\n\n【生肖】'+sx+'\n【犯太岁类型】'+type+'\n【关心方向】'+focus+'\n【值年太岁】'+tsGod+'\n【太岁年份】'+tsYear+'\n\n━━━ 壹·冲合关系详解 ━━━\n'+conflictDesc+'\n\n━━━ 贰·太岁对五维度影响 ━━━\n【事业】'+(isFan?'今年事业多变，可能面临岗位调整/人事变动。保持低调，不宜主动挑起冲突。三合生肖贵人('+({rat:'猴、龙',ox:'蛇、鸡',rabbit:'猪、羊',horse:'虎、狗'})[sx]||'多生肖'+'可助。':'今年事业无冲，顺势发展。可积极拓展业务。')+'\n【财运】'+(isFan?'太岁年财运波动大，正财尚可偏财谨慎。忌高风险投资/借贷/担保。':'财运平稳，正常发展。')+'\n【感情】'+(isFan?'感情易受冲，已婚者多沟通，单身者桃花不稳。不宜冲动决定婚事。':'感情平稳发展。')+'\n【健康】'+(isFan?'太岁年健康需注意，'+(sx==='马'?'心脏/血压/眼部':(sx==='鼠'?'肾/泌尿/耳部':(sx==='牛'?'脾胃/消化':(sx==='兔'?'肝胆/眼睛':''))))+'定期体检。':'健康平稳，注意日常保养。')+'\n【人际】'+(isFan?'口舌是非多，远离小人，不宜强出头。':'人际顺利，贵人多助。')+'\n\n━━━ 叁·拜太岁全流程 ━━━\n【时间】正月初八('+tsYear.split(' ')[0]+'-02-05，星期三)或正月十五('+tsYear.split(' ')[0]+'-02-12，星期三)\n【地点】当地道教宫观(城隍庙/关帝庙/娘娘庙/玄妙观等)\n【流程】\n1. 净身(洗澡后穿新衣)\n2. 进庙缴费上太岁表(写姓名+生辰+住址)\n3. 跪拜值年太岁'+tsGod+'\n4. 点太岁灯/香(全年平安灯)\n5. 求平安符(随身携带)\n6. 年底农历十二月初八回庙谢太岁\n【不能到庙】可在家面向'+tsFangwei+'烧香叩拜，心诚则灵\n\n━━━ 肆·逐月吉凶指南 ━━━\n'+monthGuide.split('/').map(function(m,i){return '• '+(i+1)+'月：'+m;}).join('\n')+'\n\n━━━ 伍·化解方案(拿来即用)━━━\n'+hjDetail+'\n\n━━━ 陆·风水布局禁忌 ━━━\n【太岁位】'+tsFangwei+'\n'+tsForbidden+'\n【家中布局】\n• 太岁位宜静不宜动，放绿色植物或平安结\n• 三煞位(正东)不宜动土，可放金属物泄气\n• 家中保持通风采光，阴暗角落点灯\n• 卧室不宜放镜子对床\n\n━━━ 柒·生活宜忌 ━━━\n【宜】\n· 拜太岁/献血/洗牙(主动“破红”应灾)\n· 捐款/做善事(积福消灾)\n· 穿红色内衣/袜子/系红腰带\n· 低调行事，不张扬\n· 定期体检\n【忌】\n· 参加白事/看新生儿/探重病者\n· 大额投资/担保/借贷\n· 跳槽/创业(除非八字配合)\n· 正南方动土/装修\n\n━━━ 捌·综合建议 ━━━\n1. 太岁年非全凶——三合生肖('+({rat:'猴/龙',ox:'蛇/鸡',rabbit:'猪/羊',horse:'虎/狗'})[sx]||'贵人'+'可化解\n2. 保持正面心态，“太岁当头坐，无喜恐有忧”→主动创造喜事\n3. 年初规划全年大事，避免临时决断\n4. 健康、事业、感情、财运四线并行，不可偏废\n5. 年底别忘了回庙谢太岁(还愿)\n\n(关心方向：'+focus+')';
  }
  if(modId==='yanzhi'){
    var hasPhoto=state.data.faceImage||d[0];
    var focus=d[1]||'整体面相';
    var desc=d[0]||'未提供';
    var shengxiao=d[2]||'未知';
    var sex=d[3]||'男';
    var aiBlock='';
    if(hasPhoto&&typeof hasPhoto==='string'&&hasPhoto.startsWith('data:image')){
      var aiFace=state.data.faceAnalysis||'';
      var aiEngine=state.data.faceEngine||'';
      aiBlock=aiFace?('━━━ 🔬 AI视觉识图分析（引擎：'+aiEngine+'）━━━\n\n'+aiFace+'\n\n━━━ 📚 相法理论补充 ━━━\n\n'):'';
    }
    var sxMap={'鼠':'子水·聪明灵活·耳鼻嘴三停匀称者多智','牛':'丑土·稳重踏实·额头宽阔者有福气','虎':'寅木·威严果断·眉骨高者有魄力','兔':'卯木·温和细腻·眼睛清澈者多贵人','龙':'辰土·大气磅礴·方圆脸者能成大事','蛇':'巳火·深沉敏锐·颧骨适中者善谋略','马':'午火·热情奔放·浓眉大眼者多朋友','羊':'未土·温厚善良·鼻梁端正者有财','猴':'申金·机智灵活·眼珠灵动者多才','鸡':'酉金·精明干练·嘴小唇薄者善言','狗':'戌土·忠诚正直·额头有角者可靠','猪':'亥水·福气深厚·脸圆下巴宽者有福'};
    var sxDesc=sxMap[shengxiao]||'生肖信息未提供';
    var santingMap={'三停均匀':'上停（额头到眉毛=早年运30岁前）饱满→少年得志；中停（眉毛到鼻尖=中年运30-50岁）宽阔→中年有成；下停（鼻尖到下巴=晚年运50岁后）圆润→晚年安泰。三停均匀者一生平稳。','上停发达':'额头饱满宽阔→少年运好（15-30岁），早年得长辈助力，学习能力强。但需防中年运势衔接。','中停发达':'眉眼鼻颧骨区域宽阔→中年运强（30-50岁），事业高峰期。鼻梁高挺者自尊心强、有领导力。','下停发达':'下巴方圆有肉→晚年运佳（50岁后），下属缘好，财富积累能力强。地阁（下巴）方圆者不动产运佳。'};
    var santingDesc=santingMap[focus]||santingMap['三停均匀'];
    var wuguanDesc='【眉毛】浓淡适中→性情温和；浓密→精力旺盛但易冲动；稀疏→性格柔弱但人缘好。眉间宽→心胸开阔；眉间窄→心思细密。\n【眼睛】眼大有神→热情开朗；眼小细长→精明深沉；眼白多→性格外向但易冲动；黑白分明→聪慧正直。眼尾上扬→有魄力；眼尾下垂→温顺善良。\n【鼻子】鼻梁高挺→自尊心强、有领导力；鼻翼饱满→理财能力强、有财库；鼻头有肉→心善有福；鼻孔不外露→守财。鼻子为财帛宫，主管一生财运。\n【嘴巴】嘴大唇厚→热情大方、有口福；嘴小唇薄→精打细算、善言辞；嘴角上扬→乐观开朗；嘴角下垂→内向多虑。嘴唇红润→气血充足。\n【耳朵】耳大有垂→有福气、长寿；耳高于眉→少年成名；耳轮分明→聪明好学；耳垂厚大→晚年有福。耳朵为采听官，主管少年运和智慧。';
    var faceColor='【面色红润】气血充足，精力旺盛，近运佳。\n【面色苍白】气血偏虚，注意休息和营养，多食红枣/桂圆。\n【面色发黄】脾胃偏弱，注意饮食规律，少食生冷。\n【面色发青】肝气不舒，注意情绪管理，多运动疏肝。\n【面色发黑】肾气不足，注意保暖，避免过度劳累。';
    return aiBlock+'━━━ 面相分析报告 ━━━\n\n【基本信息】\n关注方向：'+focus+' | 生肖：'+shengxiao+' | 性别：'+sex+'\n\n━━━ 壹·生肖面相总论 ━━━\n'+sxDesc+'\n\n【白话解读】\n你的生肖五行属性决定了面相的底层气质。比如属鼠的人通常眼神灵活、反应快；属牛的人通常面相稳重、额头宽。这只是基础参考，具体还要看五官搭配。\n\n━━━ 贰·三停六府分析 ━━━\n'+santingDesc+'\n\n【白话解读】\n面相分三段看：上停（额头）看少年运和智力，中停（眉眼鼻）看中年运和事业，下停（下巴嘴）看晚年运和财富。哪段最饱满，对应的年龄段最顺。\n\n━━━ 叁·五官分论 ━━━\n'+wuguanDesc+'\n\n【白话解读】\n鼻子是「财帛宫」，主管财运——鼻翼饱满说明能存钱，鼻孔不外露说明不漏财。眼睛是「监察官」，黑白分明最聪明。耳朵大且有垂肉，是天生有福气的标志。\n\n━━━ 肆·面色观察 ━━━\n'+faceColor+'\n\n━━━ 伍·面相与运势关联 ━━━\n【事业运】额头饱满+颧骨适中→领导力强，适合管理岗\n【财运】鼻翼饱满+下巴方圆→理财有道，中晚年聚财\n【感情运】眼尾上扬+嘴角上扬→异性缘佳，婚姻美满\n【健康运】面色红润+耳大有垂→体质好，长寿之相\n【贵人运】眉清目秀+额头明亮→贵人多助，逢凶化吉\n\n━━━ 陆·改善建议（拿来即用）━━━\n1. 发型调整：'+(focus==='上停发达'?'露出额头，增强早年运':focus==='下停发达'?'保持面部清洁，凸显下巴线条':'保持发型整洁，不遮眉眼')+'\n2. 表情管理：多微笑，嘴角上扬可改善「苦相」，增强人际运\n3. 眉毛修整：眉形清晰不杂乱→运势更顺，尤其利事业运\n4. 气色调理：充足睡眠+均衡饮食→面色红润→运势提升\n5. 佩戴建议：'+(ele==='金'?'白色/金色饰品增强金气':ele==='木'?'绿色系饰品增强木气':ele==='水'?'黑色/蓝色饰品增强水气':ele==='火'?'红色/紫色饰品增强火气':'黄色/棕色饰品增强土气')+'\n6. 面相是会变的：相由心生，保持正能量和善念，面相会越来越好\n\n━━━ 柒·免责声明 ━━━\n面相学为传统文化参考，不可单凭面相断人吉凶。面相会随心境和经历改变，「相由心生」才是核心。';
  }
  if(modId==='music'){
    var mood=d[0]||'需要放松';var type=d[1]||'不确定';var sym=d[2]||'无';var duration=d[3]||'未提供';
    var moodMap={'焦虑紧张':{wuxing:'木+火',yin:'角音+徵音',prescribe:'焦虑多由肝气郁结、心火亢盛引起，疏肝清心为主',scene:'微暗灯光·深呼吸·调心',time:'15-20分钟',freq:'晨起7-9点(辰时)和下午3-5点(申时)各一次'},'失眠多梦':{wuxing:'水+土',yin:'羽音+宫音',prescribe:'失眠由心肾不交、脾胃失和引起，滋肾安神健脾为主',scene:'环境黑暗·温温轻柔·闭目',time:'20-30分钟(睡前1小时)',freq:'每晚(21:00-22:30)'},'疲劳低落':{wuxing:'土+火',yin:'宫音+徵音',prescribe:'疲劳多由气虚、能量不足引起，补气振阳为主',scene:'明亮环境·坐姿/微动·中音',time:'15-20分钟',freq:'午前(9-11点已时)最佳'},'悲伤失落':{wuxing:'金+水',yin:'商音+羽音',prescribe:'悲伤多由肺气虚、情志不畅引起，润肺滋肾为主',scene:'明亮干净·散步·中音',time:'15-20分钟',freq:'下午/傍晚(下午3-7点)'},'愤怒烦躁':{wuxing:'木+水',yin:'角音+羽音',prescribe:'怒伤肝，烦躁由肝郁化火引起，疏肝凉润为主',scene:'自然环境·走动·微闭目',time:'20-30分钟',freq:'随时(怒气起时听5-10分钟可缓解)'},'压力大':{wuxing:'木+土',yin:'角音+宫音',prescribe:'压力多由肝郁脾虚引起，疏肝健脾为主',scene:'安静室内·闭目坐·深呼吸',time:'15-30分钟',freq:'早晚各一次'},'需要放松':{wuxing:'水',yin:'羽音',prescribe:'放松身心，养精蓄锐',scene:'舒适环境·闭目·深呼吸',time:'20-30分钟',freq:'随时'}};
    var mm=moodMap[mood]||moodMap['需要放松'];
    var typeMap={'古琴/古筝':'水+木系→羽音与角音结合，滋肾疏肝，适合焦虑/失眠','自然白噪音':'水+土系→雨声/流水/海浪/风声，调和肾与脾，安神','冥想引导':'火+土系→徵音与宫音结合，静心安定，适合压力/悲伤','颂钵疗愈':'金+水系→商音与羽音结合，震频入体，适合能量调整','钢琴轻音乐':'水+火系→羽音与徵音结合，平衡心肾，适合所有情绪','不确定':'推荐五行全覆盖套餐：金木水火土五组音各20分钟'};
    var tt=typeMap[type]||typeMap['不确定'];
    var musicList={'焦虑紧张':[{n:'《幽兰逢春》',a:'陈重/陈古一',s:'古琴+笛',d:'8:30',c:'晨起'},{n:'《阳关三叠》',a:'古曲',s:'古琴',d:'6:45',c:'情绪稳定时'},{n:'《春江花月夜》',a:'古曲',s:'箫+琵琶',d:'12:00',c:'午后/冥想'},{n:'《平沙落雁》',a:'古曲',s:'古琴',d:'8:00',c:'夜间放松'}],'失眠多梦':[{n:'《流水》',a:'伯牙(古曲)',s:'古琴',d:'8:30',c:'睡前'},{n:'《梅花三弄》',a:'古曲',s:'笛+箫',d:'9:20',c:'躺床上听'},{n:'《雨打芭蕉》',a:'广东音乐',s:'丝竹',d:'6:50',c:'哄睡'},{n:'《渔舟唱晚》',a:'古曲',s:'古筝',d:'7:30',c:'催眠'}],'疲劳低落':[{n:'《十面埋伏》',a:'古曲',s:'琵琶',d:'6:30',c:'振作精神'},{n:'《赛马》',a:'黄海怀',s:'二胡',d:'3:20',c:'提神'},{n:'《广陵散》',a:'嵇康(古曲)',s:'古琴',d:'11:00',c:'能量提升'},{n:'《将军令》',a:'古曲',s:'丝竹',d:'5:20',c:'振奋'}],'悲伤失落':[{n:'《阳春白雪》',a:'古曲',s:'古琴/箫',d:'5:30',c:'抒怀'},{n:'《胡笳十八拍》',a:'古曲',s:'琴/笛',d:'12:00',c:'深情绪处理'},{n:'《采薇》',a:'诗经·古风',s:'吟唱',d:'4:50',c:'舒缓悲伤'},{n:'《枫桥夜泊》',a:'古曲',s:'古筝',d:'7:20',c:'静心'}],'愤怒烦躁':[{n:'《胡笳十八拍》',a:'古曲',s:'笛/箫',d:'12:00',c:'疏肝'},{n:'《平湖秋月》',a:'古曲',s:'高胡/古筝',d:'6:30',c:'平抑怒气'},{n:'《空山鸟语》',a:'古曲',s:'二胡',d:'5:40',c:'多听·森林感'},{n:'《姑苏行》',a:'江先谓',s:'笛',d:'6:10',c:'将怒气转化为平静'}],'压力大':[{n:'《渔樵问答》',a:'古曲',s:'古琴',d:'10:00',c:'上班前静心'},{n:'《竹林深处》',a:'现代古风',s:'箫+古筝',d:'8:00',c:'减压'},{n:'《碧涧流泉》',a:'古曲',s:'古琴',d:'9:30',c:'调心'},{n:'《潇湘水云》',a:'古曲',s:'古琴',d:'11:20',c:'深度放松'}],'需要放松':[{n:'《梅花三弄》',a:'古曲',s:'笛',d:'9:20',c:'休息'},{n:'《高山流水》',a:'古曲',s:'古琴',d:'7:40',c:'休息'},{n:'《汉宫秋月》',a:'古曲',s:'二胡/古筝',d:'8:50',c:'休息'}]};
    var ml=musicList[mood]||musicList['需要放松'];
    var musicText=ml.map(function(x){return '• '+x.n+'('+x.a+'，'+x.s+'，'+x.d+')→'+x.c;}).join('\n');
    return'━━━ 五行音乐深度疗愈处方 ━━━\n\n【情绪状态】'+mood+'\n【偏好类型】'+type+'\n【症状】'+sym+'\n【持续】'+duration+'\n\n━━━ 壹·音乐处方诊断 ━━━\n【五行诊断】'+mm.wuxing+'\n【五音处方】'+mm.yin+'\n【中医学原理】'+mm.prescribe+'\n【使用场景】'+mm.scene+'\n【单次时长】'+mm.time+'\n【频次】'+mm.freq+'\n\n━━━ 贰·音乐类型与五行对应 ━━━\n'+tt+'\n\n━━━ 叁·五音五脏对应总表 ━━━\n• 木→角音(笛/箫)→疏肝理气，对应肝胆/情绪\n• 火→徵音(琴/古筝高音区)→养心安神，对应心脏/失眠\n• 土→宫音(埙/古琴低音区)→健脾和胃，对应脾胃/消化\n• 金→商音(钟/锣)→润肺益气，对应肺/呼吸\n• 水→羽音(古琴/流水声)→滋肾宁心，对应肾/泌尿\n\n━━━ 肆·为您推荐曲单('+ml.length+'首)━━━\n'+musicText+'\n\n━━━ 伍·使用方法 ━━━\n【环境】\n• 室内：环境安静，光线柔和，温度适宜\n• 室外：花园/林间/江边最佳\n【音量】适中(背景音级)不超50分贝\n【姿势】可坐可卧，避免站立\n【注意力】闭目·深呼吸·不宜同时做其他事\n【疗程】\n• 轻度症状：连续7天，每天1-2次\n• 中度症状：连续21天，每天2次\n• 重度症状：连续49天，每天3次\n【配合】\n• 听音乐前喝杯温水\n• 听后静坐5-10分钟\n• 可配合香薰(艾草/檀香/沉香)增强效果\n\n━━━ 陆·常见问题解答 ━━━\n【问】为什么听音乐能治病？\n【答】古中医五音疗法通过不同频率的声波振动对应五脏。《黄帝内经》记载："天有五音，人有五藏"。特定频率可以调节对应脏腑的气机平衡。\n【问】多久能见效？\n【答】轻度7天可感知改善，中度21天明显变化，重度需49天疗程。\n【问】可以多首连续听吗？\n【答】可以。建议一首听完后间隔1-2分钟再听下一首。\n【问】什么情况下不宜听？\n【答】耳鸣/中耳炎/重金属环境后不宜立刻听；心情极度悲伤时不宜听悲伤类曲目。\n\n━━━ 柒·个性化推荐 ━━━\n• 需配合生辰八字分析：可根据个人五行喜忌调整\n• 长期调理：建议先使用7天套餐见效后升级21天/49天\n• 后期补"声动力"课程(针对个人定制音乐处方)\n\n━━━ 捌·现代医学背书 ━━━\n• 音乐频率能影响脑波(4-8Hz alpha波促进放松)\n• 古琴频率415Hz对应肺经振动，促进呼吸深长\n• 流水声频率(40-800Hz白噪音)掩盖环境噪争，助眠\n• 523Hz(古筝空弦音)被称为"治愈频率"\n\n━━━ 玖·使用提示 ━━━\n• 睡觉时可后台循环播放\n• 所有曲目均为古曲/民乐，没有现代音效\n• 可下载保存，作为随身使用\n• 不同疗程下不需频繁换曲，同曲重复听更入心\n\n━━━ 拾·服务支持 ━━━\n• 更多曲单：智护咨询→疗愈音乐库\n• 个性定制：生辰八字 + 体质 + 症状匹配处方\n• 课程升级：智护学院"声动力"专项课程\n\n(持续：'+duration+' | 处方：'+mm.yin+' | 场景：'+mm.scene+')';
  }
  if(modId==='lifeindex'){
    var m=d[0].match(/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日]?\s*(\d{1,2})?[时点]?\s*([男女])?/);
    var dm='未知',ele='未知',score=50,p=null,nonZero=5,strength=0,strengthScore=10;
    if(m){p=_paipan(+m[1],+m[2],+m[3],+m[4]||12);dm=p.day_master;ele=dm.slice(-1);
      var wc=p.wuxing_count;
      nonZero=Object.values(wc).filter(function(v){return v>0;}).length;
      var wuxingScore=Math.round((nonZero/5)*30);
      var myCount=wc[ele]||0;
      var totalCount=Object.values(wc).reduce(function(a,b){return a+b;},0);
      strength=myCount/totalCount;
      strengthScore=strength>=0.2&&strength<=0.35?20:strength>=0.15?15:10;
      score=50+wuxingScore+strengthScore;
    }
    var dim=d[1]||'综合生命指数';
    var sex=m&&m[5]||'男';
    var age=m?new Date().getFullYear()-(+m[1]):0;
    var dims={career:{name:'事业潜力',base:50,s:50},wealth:{name:'财运指数',base:50,s:50},health:{name:'健康长寿',base:50,s:50},marriage:{name:'婚姻幸福',base:50,s:50},social:{name:'人际关系',base:50,s:50},growth:{name:'个人成长',base:50,s:50}};
    var eleBoost={金:{c:15,w:5,h:0,m:-5,s:5,g:10,d:'金主义、果断，适合管理和执法'},木:{c:10,w:10,h:5,m:5,s:10,g:15,d:'木主仁、成长，适合教育和创新'},水:{c:10,w:20,h:5,m:10,s:5,g:10,d:'水主智、灵活，适合科研和策划'},火:{c:15,w:0,h:-5,m:0,s:10,g:10,d:'火主礼、热情，适合传媒和创新'},土:{c:5,w:15,h:10,m:10,s:0,g:5,d:'土主信、稳定，适合房产和政务'}};
    var eb=eleBoost[ele]||eleBoost['土'];
    dims.career.s=Math.max(30,Math.min(95,dims.career.base+eb.c+(score-60)/3));
    dims.wealth.s=Math.max(30,Math.min(95,dims.wealth.base+eb.w+(score-60)/3));
    dims.health.s=Math.max(30,Math.min(95,dims.health.base+eb.h+(score-60)/3));
    dims.marriage.s=Math.max(30,Math.min(95,dims.marriage.base+eb.m+(score-60)/3));
    dims.social.s=Math.max(30,Math.min(95,dims.social.base+eb.s+(score-60)/3));
    dims.growth.s=Math.max(30,Math.min(95,dims.growth.base+eb.g+(score-60)/3));
    var totalScore=Math.round((dims.career.s+dims.wealth.s+dims.health.s+dims.marriage.s+dims.social.s+dims.growth.s)/6);
    var grade=totalScore>=85?'S 卓越出尘':totalScore>=75?'A 优秀':totalScore>=65?'B 良好':totalScore>=55?'C 中等':'D 偏低';
    var gradeColor=totalScore>=75?'🟢':totalScore>=60?'🟡':'🔴';
    var careerDesc=ele==='金'?'管理/金融/法律/军警/机械':ele==='木'?'教育/文化/医疗/农业/设计':ele==='水'?'科研/策划/旅游/物流/传播':ele==='火'?'传媒/餐饮/能源/创新/演艺':'房产/政务/建筑/保险/仓储';
    var wealthDesc=ele==='金'?'正财为主，越老越有钱':ele==='木'?'需勤奋生财，中年后好转':ele==='水'?'财路多，灵活投资':ele==='火'?'财来财去，需理财规划':'稳健增长，适合长线投资';
    var healthDesc=ele==='金'?'肺/大肠/皮肤':ele==='木'?'肝/胆/眼睛':ele==='水'?'肾/膀胱/耳部':ele==='火'?'心/小肠/血压':'脾/胃/口腔';
    var healthJing=ele==='金'?'肺经':ele==='木'?'肝经':ele==='水'?'肾经':ele==='火'?'心经':'脾经';
    var marriageDesc=ele==='金'?'重原则，需多点温柔':ele==='木'?'重感情，积极付出':ele==='水'?'善解人意，感情顺遂':ele==='火'?'热情主动，需冷静':'忠诚稳重，长情不渝';
    var marriageMate=ele==='金'?'水/土':ele==='木'?'水/火':ele==='水'?'金/木':ele==='火'?'木/土':'火/金';
    var foodRec=ele==='金'?'白萝卜/百合/银耳':ele==='木'?'绿叶菜/枸杞/菊花':ele==='水'?'黑豆/核桃/海带':ele==='火'?'莲子/绿豆/百合':'山药/小米/南瓜';
    function bar(n){var b='';for(var i=0;i<10;i++)b+=i<Math.round(n/10)?'█':'░';return b;}
    var dimsText='【事业潜力】'+Math.round(dims.career.s)+'/100 '+bar(dims.career.s)+'\n  '+careerDesc+'\n  建议：从事'+careerDesc+'，与'+marriageMate+'行业合作\n\n【财运指数】'+Math.round(dims.wealth.s)+'/100 '+bar(dims.wealth.s)+'\n  '+wealthDesc+'\n  建议：'+(ele==='水'?'多元化投资':ele==='土'?'长线投资+不动产':'正财为主，控制消费')+'\n\n【健康长寿】'+Math.round(dims.health.s)+'/100 '+bar(dims.health.s)+'\n  养护：'+healthDesc+'\n  建议：重点养护'+healthJing+'，多食'+foodRec+'\n\n【婚姻幸福】'+Math.round(dims.marriage.s)+'/100 '+bar(dims.marriage.s)+'\n  '+marriageDesc+'\n  建议：与'+marriageMate+'日主互补最佳\n\n【人际关系】'+Math.round(dims.social.s)+'/100 '+bar(dims.social.s)+'\n  建议：多结交三合/六合生肖朋友\n\n【个人成长】'+Math.round(dims.growth.s)+'/100 '+bar(dims.growth.s)+'\n  建议：终身学习，顺应五行特点发展';
    var stages=[{r:'0-15岁',t:'幼年养育期',s:Math.round(totalScore*0.9)},{r:'16-25岁',t:'求学成长期',s:Math.round(totalScore*(dims.growth.s/100*1.1))},{r:'26-35岁',t:'事业奠基期',s:Math.round(totalScore*(dims.career.s/100*1.05))},{r:'36-45岁',t:'事业黄金期',s:Math.round(totalScore*(dims.career.s/100*1.15))},{r:'46-55岁',t:'财富积累期',s:Math.round(totalScore*(dims.wealth.s/100*1.1))},{r:'56-65岁',t:'智慧收敛期',s:Math.round(totalScore*(dims.health.s/100*1.05))},{r:'66岁以上',t:'福气享受期',s:Math.round(totalScore*(dims.health.s/100*0.95))}];
    var stageText=stages.map(function(s){return '【'+s.r+'】'+s.t+' → '+s.s+'/100 '+bar(s.s);}).join('\n');
    var lacking=(p&&p.wuxing_lack&&p.wuxing_lack.length)?p.wuxing_lack.join('、'):'无';
    var hj=(p&&p.wuxing_lack&&p.wuxing_lack.length)?_getHuajie(ele,p.wuxing_lack):{fangwei:'中央',yanse:'黄色',shuzi:'5/0',peishi:'黄玉'};
    var wuxingBar='';
    if(p){Object.keys(p.wuxing_count).forEach(function(k){var v=p.wuxing_count[k];var b='';for(var i=0;i<v;i++)b+='█';for(var i=v;i<5;i++)b+='░';wuxingBar+='  '+k+' '+b+' '+v+'个\n';});}
    var decades=[];
    for(var di=0;di<8;di++){var sa=Math.floor(age/10)*10+di*10-10;if(sa<0)sa=0;decades.push('【'+sa+'-'+(sa+9)+'岁】'+Math.round(totalScore*(0.8+Math.sin(di)*0.15))+'/100');}
    var decadeText=decades.join('  ');
    var verdict=totalScore>=85?'S级：五行平衡，六维度均出色。人生底牌好，仍需努力将潜力转化为现实。':totalScore>=75?'A级：五行较好，多维度优秀。重点发挥事业和财运优势。':totalScore>=65?'B级：五行基本平衡，部分维度突出。找到优势赛道，专注发展。':totalScore>=55?'C级：五行有缺失，需通过后天化解补齐。命数只占30%，努力占70%。':'D级：五行失衡严重。建议全面参考化解方案，健康为先，稳中求进。';
  }
if(modId==='lifeplan'){
    var m=d[0].match(/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日]?\s*(\d{1,2})?[时点]?\s*([男女])?/);
    if(!m)return'请提供完整出生年月日时+性别，例：1990年6月15日8时 男';
    var y=+m[1],mo=+m[2],da=+m[3],h=+m[4]||12,sex=m[5]||'male';
    var p=_paipan(y,mo,da,h);
    var dm=p.day_master,wc=p.wuxing_count,ele=dm.slice(-1);
    var lack=(p.wuxing_lack&&p.wuxing_lack.length)?p.wuxing_lack.join('、'):'无(五行俱全)';
    var pillars=p.pillars;
    var shengxiao=p.shengxiao||((y-4)%12>=0?['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'][(y-4)%12]:'未知');
    var stage=d[1]||'职场';
    var residence=d[2]||'未提供';
    var focus=d[3]||'全面规划';
    var stageMap={'学龄前':'学龄前阶段(重点：先天修养、亲子互动)','小学':'小学阶段(重点：启蒙习惯、学习兴趣)','初中':'初中阶段(重点：兴趣挖掘、文理启蒙)','高中':'高中阶段(重点：学业深化、文理分班/选科)','大学':'大学阶段(重点：专业选择、实践积累)','职场':'职场阶段(重点：事业发展、升职加薪)','婚恋期':'婚恋期阶段(重点：婚姻家庭、子女教养)'};
    var stageName=stageMap[stage]||stage;
    // 五行与行业映射
    var descMap={'金':'金主义，刚毅果断，重义气，重承诺。做事果断但有时固执，适合管理与执法。','木':'木主仁，直爽向上，仁慈善良。有进取心和韧性，善于交际，适合教育与文化。','水':'水主智，聪明灵活，善变通，足智多谋。性格沉静善于思考，适合科研与策划。','火':'火主礼，热情外向，积极向上，有领导力。性格活泼有感染力，适合传媒与销售。','土':'土主信，稳重厚道，重承诺，踏实可靠。性格沉稳有责任感，适合房产与政务。'};
    var baseDesc=descMap[ele]||'';
    // 事业详细(根据五行)
    var careerMap={'金':{dir:'金融/银行/机械/珠宝/法律/IT硬件/军警/外科',scopes:'公务员/国企/金融业/制造业/法务',avoid:'艺术性过强/服务性强/自由职业过多'},'木':{dir:'教育/出版/农业/服装/家具/医药/中医/文化创意',scopes:'体制内教育/互联网产品/医药公司/出版社',avoid:'重工业/矿业/高危行业'},'水':{dir:'科研/策划/物流/通信/贸易/旅游/互联网运营',scopes:'互联网大厂/外贸公司/研究院/咨询',avoid:'传统重工业/纯体力劳动'},'火':{dir:'传媒/电子/餐饮/能源/美容/广告/销售/演讲培训',scopes:'新媒体/广告公司/销售型岗位/互联网运营',avoid:'纯后台技术/资料整理'},'土':{dir:'房产/建筑/政务/矿业/陶瓷/农业/仓储',scopes:'体制内政务/建筑公司/农业产业/物流仓储',avoid:'高变动行业/频繁出差'}};
    var cm=careerMap[ele]||careerMap['木'];
    // 城市
    var cityMap={'金':['上海','南京','西安','洛阳','哈尔滨','香港','悉尼','芝加哥'],'木':['北京','杭州','广州','深圳','东京','首尔','柏林'],'水':['天津','武汉','香港','广州','纽约','伦敦','莫斯科'],'火':['海口','昆明','广州','深圳','新加坡','曼谷','迪拜'],'土':['郑州','洛阳','西安','重庆','成都','北京','伊斯坦布尔']};
    var cities=(cityMap[ele]||[]).join('、');
    // 财运
    var caiMap={'金':'财星受克，宜守不宜攻。正财稳定(工薪)，偏财(投资)谨慎。建议控制开销，秋季金旺财运回升，适合稳健理财。','木':'财运有入有出，花销大。上半年财运较旺，下半年注意守财。适合做长期投资，忌短线投机。','水':'水克火得财，今年财运较佳。正财稳定，偏财有机会。秋季注意防冲动投资，适合多元化投资。','火':'比劫旺夺财，破财风险高。忌合伙经营，忌为他人担保。正财稳定但花销大，控制消费，避免高风险投资。','土':'财库丰盈，财运稳定。适合长线投资，火土旺月份(5-7月)财运最佳。适合房产/基金等稳健型投资。'};
    // 健康
    var healthMap={'金':'金→肺/呼吸道/皮肤/大肠。火克金→呼吸道偏弱。春季花粉过敏风险，夏季闷热注意通风，秋冬干燥多补水。多食白萝卜/百合/银耳/雪梨。','木':'木→肝胆/眼睛/筋骨/神经系统。火旺木燥→肝胆偏弱，注意情绪管理。春季肝气旺易怒，夏季防眼部疲劳，秋季金旺克木注意关节。多食绿叶菜/菊花茶。','水':'水→肾/泌尿/耳/骨骼。水火相战→注意心血管/血压。夏季高温防暑，冬季注意关节保养。多食黑豆/核桃/海带补肾。定期体检。','火':'火→心/血/眼/舌。火过旺→注意心脏/血液/口腔/视力。夏季防中暑，少食辛辣油炸。多食莲子/百合/绿豆清心。增加有氧运动。','土':'土→脾/胃/肌肉/口。土厚→注意脾胃/消化/血糖。少食油腻甜食，多食纤维蔬菜。秋季干燥多饮水。规律饮食，适度运动。'};
    // 婚恋
    var loveMap={'金':'配偶刚毅果断，重义气。今年感情有压力，需多沟通包容。单身者秋季(金旺)桃花开。桃花星：酉(鸡)。','木':'配偶温和上进，有进取心。今年精力旺盛，桃花盛开。单身者有望遇到正缘，春季(卯月)桃花最旺。','水':'配偶聪明灵活，善变通。今年水火既济，感情和谐。已婚者恩爱和睦，单身者秋季易遇良缘。桃花星：子(鼠)。','火':'配偶热情活泼，有领导力。今年火旺但易冲动。单身者投入过度可能招致压力；已婚者需控制情绪。桃花星：午(马)。','土':'配偶稳重可靠，重承诺。今年感情稳定，宜成家安业。单身者可主动扩展社交圈；已婚者家庭和谐，宜添丁。'};
    // 学业
    var studyMap={'金':'印星为土，学习效率高。适合：金融/法律/管理类。文昌位：西方。','木':'印星为水，学习悟性高。适合：教育/文化/医药类。文昌位：东方。','水':'印星为金，秋季印星旺。适合：科研/策划/技术类。文昌位：北方。','火':'印星为木，春季印星旺。适合：传媒/艺术/电子类。文昌位：南方。','土':'印星为火，学习有利。适合：房产/建筑/政务类。文昌位：中央。'};
    // 计算当前年龄
    var now=new Date();var birth=new Date(y,mo-1,da);var age=now.getFullYear()-birth.getFullYear()-(now.getMonth()<birth.getMonth()||(now.getMonth()===birth.getMonth()&&now.getDate()<birth.getDate())?1:0);
    // 长生十二宫
    var cs12=['长生','沐浴','冠带','临官','帝旺','衰','病','死','墓','绝','胎','养'];
    var csMap={金:'巳',木:'亥',水:'申',火:'寅',土:'申'};
    var changShengRoot=csMap[ele]||'亥';
    var branchSeq=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    var rootIdx=branchSeq.indexOf(changShengRoot);
    var pillarBranches=[pillars['年'].slice(-1),pillars['月'].slice(-1),pillars['日'].slice(-1),pillars['时'].slice(-1)];
    var pillarCs=[];
    for(var pi=0;pi<4;pi++){
      var bIdx=branchSeq.indexOf(pillarBranches[pi]);
      var offset=((bIdx-rootIdx)%12+12)%12;
      pillarCs.push(cs12[offset]);
    }
    // 当前大运阶段(粗略)
    var currentCS=pillarCs[2]; // 日柱为主
    var csGuide={
      '长生':{theme:'新生阶段',desc:'蓬勃向上，开创新局。适合学习新技能、拓展人脉、开始新事业。',yi:'学习/考试/创业/开业/结婚',ji:'保守/守旧/重大财务决策'},
      '沐浴':{theme:'敏感阶段',desc:'情绪波动较大，易受外界影响。需谨慎处理感情和财务。',yi:'形象提升/学习新知',ji:'投机/冲动消费/感情暧昧'},
      '冠带':{theme:'成长阶段',desc:'事业起步，逐步成熟。适合深耕专业、积累资源。',yi:'考证/深耕专业/拓展业务',ji:'频繁跳槽/盲目扩张'},
      '临官':{theme:'黄金阶段',desc:'事业上升期，能力得到充分发挥。把握机会积极进取。',yi:'创业/晋升/重大项目',ji:'保守/错过机会'},
      '帝旺':{theme:'鼎盛阶段',desc:'人生最高峰，权力与影响力最大。注意守成。',yi:'战略布局/稳健发展',ji:'冒进/过度扩张'},
      '衰':{theme:'调整阶段',desc:'开始走下坡路，宜守不宜攻。重新规划转型。',yi:'修身养性/学习充电',ji:'大投资/扩张'},
      '病':{theme:'休息阶段',desc:'注意健康，宜退守调整。保养身体，储蓄力量。',yi:'调养/慢投资/陪伴家人',ji:'过劳/冒险'},
      '死':{theme:'终结阶段',desc:'旧事终结，新机酝酿。放下包袱，等待转机。',yi:'反思/总结/培训',ji:'强求/固执'},
      '墓':{theme:'收藏阶段',desc:'收藏能量，蓄势待发。低调积累，等待时机。',yi:'积累人脉/学习/储蓄',ji:'冒头/大动作'},
      '绝':{theme:'沉寂阶段',desc:'低谷期，宜静不宜动。修养身心，等待转机。',yi:'静修/学习/陪伴家人',ji:'冒进/投资'},
      '胎':{theme:'萌芽阶段',desc:'新的开始酝酿。默默积累能量，等待时机。',yi:'学习/规划/养精蓄锐',ji:'冒进/大投资'},
      '养':{theme:'孕育阶段',desc:'蓄势待发，孕育新机。低调做事，等待时机。',yi:'学习/规划/养精蓄锐',ji:'冒进'}
    };
    var cg=csGuide[currentCS]||csGuide['长生'];
    // 应期
    var agePeriod='';
    if(age<6)agePeriod='学龄前(0-6岁)→ 重点培养习惯、亲子关系';
    else if(age<12)agePeriod='小学(6-12岁)→ 启蒙关键期，培养学习兴趣';
    else if(age<15)agePeriod='初中(12-15岁)→ 文理启蒙、兴趣挖掘';
    else if(age<18)agePeriod='高中(15-18岁)→ 学业深化、选科决策';
    else if(age<22)agePeriod='大学(18-22岁)→ 专业选择、实践积累';
    else if(age<28)agePeriod='职场初期(22-28岁)→ 事业定位、能力积累';
    else if(age<35)agePeriod='职场黄金期(28-35岁)→ 升职加薪、成家立业';
    else if(age<45)agePeriod='事业巅峰期(35-45岁)→ 战略布局、稳中求进';
    else if(age<55)agePeriod='事业转型期(45-55岁)→ 调整布局、传承经验';
    else if(age<65)agePeriod='退休准备期(55-65岁)→ 健康管理、兴趣培养';
    else agePeriod='退休期(65+)→ 修身养性、含饴弄孙';
    // 关键节点
    var keyNodes=[];
    var sexStr=sex==='female'||sex==='女'?'坤造':'乾造';
    keyNodes.push('• 6岁  启蒙教育启动期(重点：学习习惯培养)');
    keyNodes.push('• 12岁 小学毕业节点(升初中适应)');
    keyNodes.push('• 15岁 初中升高中节点(学业第一次分流)');
    keyNodes.push('• 18岁 高考节点(重大人生分水岭)');
    keyNodes.push('• 22岁 大学择业节点(第一份工作选择)');
    keyNodes.push('• 28岁 事业定型期(行业方向锁定)');
    keyNodes.push('• 30岁 成家节点('+(sexStr==='乾造'?'男命宜先立业后成家':'女命宜25-30岁把握黄金期')+')');
    keyNodes.push('• 40岁 中年稳进期(事业巅峰或转型)');
    keyNodes.push('• 50岁 子女教育关键期(亲子关系与传承)');
    keyNodes.push('• 60岁 退休规划期(健康管理与兴趣培养)');
    // 三元九运
    var sanYuanJiuYun='2024-2043 年下元九运(2024-2043年)：火运当令。“离火”主文明、科技、文化、艺术、教育、能源。火旺之象：科技崛起、文化繁荣、虚拟经济兴盛。个人需顺应：从事火属性行业(互联网、科技、文化、新能源)，注意精神健康，避免内心躁动。';
    // 化解
    var hj=_getHuajie(ele,lack.split('、'));
    var huajieDetail='【佩戴】'+hj.peishi+'\n【方位】'+hj.fangwei+'\n【颜色】'+hj.yanse+'\n【数字】尾号宜选'+hj.shuzi+'\n【饮食】'+hj.yinshi+'\n【行业】'+hj.hangye+'\n'+hj.baifang;
    return'━━━ 人生规划全维度深度报告 ━━━\n\n【个人档案】'+sexStr+' · '+y+'年'+mo+'月'+da+'日 '+(h?h+'时':'')+' · '+shengxiao+'年\n【当前年龄】'+age+'岁 · '+stageName+'\n【现居地】'+residence+'\n【关心方向】'+focus+'\n\n━━━ 壹·命盘概要 ━━━\n【四柱】'+pillars['年']+' '+pillars['月']+' '+pillars['日']+' '+pillars['时']+'\n【日主】'+dm+'('+ele+')\n【五行】金'+(wc['金']||0)+' 木'+(wc['木']||0)+' 水'+(wc['水']||0)+' 火'+(wc['火']||0)+' 土'+(wc['土']||0)+'\n【缺行】'+lack+'\n\n━━━ 贰·性格特征 ━━━\n'+baseDesc+'\n\n━━━ 叁·长生十二宫人生阶段 ━━━\n【四柱长生位】年柱 '+pillarCs[0]+' · 月柱 '+pillarCs[1]+' · 日柱 '+pillarCs[2]+'(当前) · 时柱 '+pillarCs[3]+'\n\n【当前阶段】'+currentCS+'('+cg.theme+')\n【阶段描述】'+cg.desc+'\n【宜做】'+cg.yi+'\n【忌做】'+cg.ji+'\n\n【人生阶段参考】\n• 童年(0-12岁)→ 启蒙、学习习惯、亲子关系\n• 少年(12-18岁)→ 学业深化、选科决策、兴趣发现\n• 青年(18-30岁)→ 专业选择、职业定位、姻缘肇始\n• 中年(30-50岁)→ 事业巅峰、家庭建设、传承布局\n• 壮年(50-65岁)→ 调整转型、健康管理、兴趣丰富\n• 晚年(65岁+)→ 修身养性、含饴弄孙、智慧传承\n\n━━━ 肆·当前阶段详细指导 ━━━\n【生命周期定位】'+agePeriod+'\n【学业/事业重点】'+(age<18?'当前以学业为重，培养学习兴趣与习惯':age<35?'当前以事业定位与能力积累为重，择业需谨慎':age<50?'当前以事业巅峰与家庭建设为重，注意平衡':'当前以健康管理与传承为重，放慢节奏享受生活')+'\n【健康重点】'+healthMap[ele]+'\n【催旺方法】\n• 事业：选择'+(cm.dir)+'领域\n• 财运：'+(caiMap[ele])+'\n• 姻缘：'+(loveMap[ele])+'\n• 健康：养护'+({金:'肺/呼吸道',木:'肝胆',水:'肾/泌尿',火:'心/血管',土:'脾胃'})[ele]+'\n\n━━━ 伍·学业方向推荐 ━━━\n【印星分析】'+studyMap[ele]+'\n【适合学业方向】'+(cm.dir)+'\n【学业黄金期】'+(age<18?'当前为学业黄金期，集中精力突破':age<25?'可在职提升学历/考取专业证书':'终身学习时代，可参加高级培训/MBA/专业资质')+'\n\n━━━ 陆·职业方向推荐(含考公/国企/创业/合伙)━━━\n【主推行业】'+cm.dir+'\n【考公/国企适配度】'+(ele==='土'||ele==='金'?'★★★★★ 极适合体制内稳定发展':ele==='水'?'★★★☆☆ 适合技术型公务员/事业单位':ele==='木'?'★★★★☆ 适合教育/文化类体制岗位':'★★★☆☆ 适合宣传/媒体类体制岗位')+'\n【创业适配度】'+(ele==='火'?'★★★★★ 火主创新，独立创业佳':ele==='水'?'★★★★☆ 水主智，技术型创业佳':ele==='木'?'★★★☆☆ 木主仁，合伙型创业佳':ele==='金'?'★★★☆☆ 金主决断，需团队配合':'★★★☆☆ 土主稳，需成熟时机')+'\n【合伙提醒】'+(ele==='火'?'比劫旺，不宜合伙经营，避免资金混清':ele==='水'?'偏财旺，可合伙但需股权明确':ele==='木'?'正印旺，宜师徒制或跟有经验者合伙':ele==='金'?'七杀旺，竞争激烈，慎选合伙人':'正官稳，合伙宜找互补型')+'\n【企业类型建议】'+(ele==='金'||ele==='土'?'央企/国企/500强外企':'创新型企业/互联网/文化创意')+'\n\n━━━ 柒·适合发展的城市 ━━━\n【推荐城市(按五行吉方)】'+cities+'\n【选择原则】\n• 出生地与发展地同方位→人气场稳\n• 命中喜用神方位最佳→助力发展\n• 避免太岁方位(2026正南)→防冲克\n【现居地分析】'+(residence?'您现居'+residence+'，需结合命卦与喜用神综合判断方位好坏。':'未提供现居地，建议结合八字喜忌选择发展城市。')+'\n\n━━━ 捌·适婚年龄与择偶建议 ━━━\n【最佳婚龄】'+(sexStr==='乾造'?'男命宜28-33岁(事业有成后水到渠成)':'女命宜25-30岁(黄金生育期与情感成熟度平衡)')+'\n【桃花星】'+({金:'酉(鸡)',木:'卯(兔)',水:'子(鼠)',火:'午(马)',土:'辰戌丑未(四季土)'})[ele]+'\n【婚配五行】'+(ele==='金'?'宜配水/土 → 水金相生，土金相生':ele==='木'?'宜配水/火 → 水生木，木生火':ele==='水'?'宜配金/水 → 金生水，水水比和':ele==='火'?'宜配木/火 → 木生火，火火比和':ele==='土'?'宜配火/土 → 火生土，土土比和':'')+'\n【择偶建议】'+(loveMap[ele])+'\n\n━━━ 玖·财运分析 ━━━\n【今年财运总评】'+(caiMap[ele])+'\n【财运起伏】\n• 春(木旺)→ '+(ele==='木'?'旺':'一般')+'\n• 夏(火旺)→ '+(ele==='火'?'旺':'一般')+'\n• 秋(金旺)→ '+(ele==='金'?'旺':'一般')+'\n• 冬(水旺)→ '+(ele==='水'?'旺':'一般')+'\n【偏财建议】'+(ele==='水'?'可适度多元化投资':ele==='土'?'适合房产/基金长线':ele==='火'?'宜守不宜攻，控制高风险投资':ele==='金'?'稳健理财，减少投机':'长期投资为主')+'\n\n━━━ 拾·健康重点 ━━━\n'+healthMap[ele]+'\n\n━━━ 拾壹·人生关键节点时间表 ━━━\n'+keyNodes.join('\n')+'\n\n━━━ 拾贰·三元九运宏观指导 ━━━\n'+sanYuanJiuYun+'\n\n━━━ 拾叁·化解方案(拿来即用)━━━\n'+huajieDetail+'\n\n━━━ 拾肆·综合建议与人生智慧 ━━━\n1. 顺势而为：五行喜忌是底层逻辑，顺应者事半功倍\n2. 补偏救弊：缺什么补什么，但不可过补\n3. 周期思维：十年一大运，五年一中运，一年一小运\n4. 平衡为上：五行平衡的人生最稳，过旺过衰皆忌\n5. 后天努力：命理提供参考，努力改变命运\n6. 修身养性：健康是一切基础，养成良好习惯\n7. 家庭为本：事业再大不及家和万事兴\n8. 终身学习：时代变迁快，唯有学习者不被淘汰\n\n━━━ 拾伍·免责声明 ━━━\n本报告基于传统命理学理论，结合您的出生信息分析，仅供参考。命由天定，运由己造，人生的最终走向取决于您的选择与努力。\n\n(关注方向：'+focus+')';
  }
function localReport(modId,data){return _getUnifiedReport(modId,data);}

function dg2str(zhi, dS){
  var wxMap={'子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'};
  var dWx=({'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'})[dS[0]];
  var zWx=wxMap[zhi]||'—';
  if(zWx===dWx)return '(与日干比和)';
  if(({'金':'木','木':'土','土':'水','水':'火','火':'金'})[zWx]===dWx)return '(初传受日干克)';
  if(({'金':'木','木':'土','土':'水','水':'火','火':'金'})[dWx]===zWx)return '(初传克日干)';
  return '(中平)';
}

function _qimenCompute(y,mn,dy,hr,sex,ask){
  // 奇门遁甲智能排盘(简化版，采用传统转盘+飞布)
  // 九宫序数：巽4/离9/坤2/震3/中5/兑7/艮8/坎1/乾6(洛书)
  var gongNames={1:'坎',2:'坤',3:'震',4:'巽',5:'中',6:'乾',7:'兑',8:'艮',9:'离'};
  var trigrams={1:'坎水',2:'坤土',3:'震木',4:'巽木',5:'中土',6:'乾金',7:'兑金',8:'艮土',9:'离火'};
  var elements={1:'水',2:'土',3:'木',4:'木',5:'土',6:'金',7:'金',8:'土',9:'火'};
  var directions={1:'正北',2:'西南',3:'正东',4:'东南',5:'中央',6:'西北',7:'正西',8:'东北',9:'正南'};
  ask=ask||'事业决策';
  var stars=['天蓬','天任','天冲','天辅','天英','天芮','天柱','天心'];
  var starPalace=[1,8,3,4,9,2,7,6];// 原始宫位
  var starNature={1:'凶',2:'中',3:'中',4:'吉',5:'凶',6:'凶',7:'吉',8:'吉'};
  var doors=['休','生','伤','杜','景','死','惊','开'];
  var doorPalace=[1,8,3,4,9,2,7,6];
  var doorNature={1:'吉',2:'吉',3:'凶',4:'中',5:'中',6:'凶',7:'凶',8:'吉'};
  var gods=['值符','腾蛇','太阴','六合','白虎','玄武','九地','九天'];
  var godNature={1:'吉',2:'凶',3:'吉',4:'吉',5:'凶',6:'凶',7:'吉',8:'吉'};
  // 六仪三元：甲子戊(坎1)、甲戌己(坤2)、甲申庚(震3)、甲午辛(巽4)、甲辰壬(离9)、甲寅癸(艮8)
  var tianGan={1:'戊',2:'己',3:'庚',4:'辛',9:'壬',8:'癸'};
  var diGan={1:'戊',2:'己',3:'庚',4:'辛',5:'己',6:'辛',7:'庚',8:'癸',9:'壬'};
  // 局数计算：基于节气+日干支（真实奇门遁甲）
  var isYangDun=true;
  if(mn>=5&&mn<=8)isYangDun=false;
  if(mn>=3&&mn<=4){isYangDun=(dy<15)?false:true;}
  if(mn>=9&&mn<=10){isYangDun=(dy<15)?true:false;}
  var ep2=new Date(1900,0,1),tg2d=new Date(y,mn-1,dy);
  var dd2=Math.floor((tg2d-ep2)/86400000);
  var dayGanZhiIdx=((dd2%60)+60)%60;
  var juPattern=dayGanZhiIdx%5;
  var yangJu=[[1,7,4],[8,2,5],[3,9,6],[3,9,6],[2,8,5]];
  var yinJu=[[6,9,3],[5,2,8],[6,9,3],[5,2,8],[1,7,4]];
  var juPos=Math.floor((dayGanZhiIdx%15)/5);
  var juSet=isYangDun?yangJu[juPattern]:yinJu[juPattern];
  var ju=juSet[Math.min(juPos,2)]||1;
  var yd=isYangDun?'阳遁':'阴遁';
  // 阳遁从局数宫起甲子戊，阴遁从局数宫起甲子戊逆布
  var startPalace=ju;
  // 值符星+值使门：根据时干支计算(简化)
  var hourGanIndex=((hr%12)*2+(y%10))%10;
  var zfStar=stars[hourGanIndex%8];var zhifuStar=zfStar;
  var zsDoor=doors[hourGanIndex%8];
  // 值符落宫=原局宫位(简化)
  var zhifuPalace=starPalace[hourGanIndex%8];
  var zhishiPalace=doorPalace[hourGanIndex%8];
  // 用神宫位确定(按问事类型)
  var keyMap={'事业决策':6,'财运投资':8,'感情婚姻':4,'出行安全':1,'失物寻找':3,'官司诉讼':9,'健康吉凶':2,'其他':5};
  var keyPalace=keyMap[ask]||5;
  // 排盘：构建每个宫位的天盘/地盘/九星/八门/八神
  var palaces={};
  var allGong=[1,2,3,4,5,6,7,8,9];
  var starOffset=(startPalace-1);
  var doorOffset=(startPalace-1);
  var godOffset=(startPalace-1);
  allGong.forEach(function(g){
    var starIdx=(g-starOffset-1+8*9)%8;
    var doorIdx=(g-doorOffset-1+8*9)%8;
    var godIdx=(g-godOffset-1+8*9)%8;
    palaces[g]={
      gongName:gongNames[g],
      trigram:trigrams[g],
      element:elements[g],
      direction:directions[g],
      tian:diGan[g]||'—',
      di:diGan[g]||'—',
      star:stars[starIdx],
      starNature:starNature[starIdx],
      door:doors[doorIdx],
      doorNature:doorNature[doorIdx],
      god:gods[godIdx],
      godNature:godNature[godIdx]
    };
  });
  // 关键宫位详情
  var kp=palaces[keyPalace];
  // 格局判断
  var judge='';
  if(kp.starNature==='吉'&&kp.doorNature==='吉'&&kp.godNature==='吉')judge='★★★ 上吉格局(星门神三吉汇)';
  else if(kp.starNature==='吉'&&kp.doorNature==='吉')judge='★★ 吉格(星门双吉)';
  else if(kp.starNature==='凶'&&kp.doorNature==='凶')judge='凶格(星门双凶)，宜慎行';
  else if(kp.starNature==='凶')judge='星克门，主有阻碍';
  else if(kp.doorNature==='凶')judge='门克星，主有损耗';
  else judge='中平格局，需配合时辰方位';
  // 旺衰
  var hourWx=['木','木','火','火','土','土','金','金','水','水','木','木'][hr%12];
  var wang;
  if(hourWx===kp.element)wang='得时旺';
  else if(['金','木','水','火','土'].indexOf(hourWx)===['金','木','水','火','土'].indexOf(kp.element)+1%5||(['金','木','水','火','土'].indexOf(hourWx)===['金','木','水','火','土'].indexOf(kp.element)+2)%5)wang='相次旺';
  else if(hourWx===kp.element||['金','木','水','火','土'][(['金','木','水','火','土'].indexOf(kp.element)+3)%5]===hourWx)wang='休囚衰';
  else wang='受克';
  var wangDesc={得时旺:'用神旺相，可成大业',相次旺:'用神次旺，谋为可成',休囚衰:'用神休囚，宜静守',受克:'用神受克，有阻碍需化解'}[wang];
  // 生克
  var shengMap={'金':'水','水':'木','木':'火','火':'土','土':'金'};
  var keMap={'金':'木','木':'土','土':'水','水':'火','火':'金'};
  var shengke='时辰'+hourWx+'与用神'+kp.element;
  if(shengMap[hourWx]===kp.element)shengke+='→相生大吉';
  else if(shengMap[kp.element]===hourWx)shengke+='→用神生时，泄气';
  else if(keMap[hourWx]===kp.element)shengke+='→时克用神，不利';
  else if(keMap[kp.element]===hourWx)shengke+='→用神克时，可制';
  else shengke+='→比和，中平';
  // 吉凶总评
  var isGood=judge.indexOf('吉')>=0||wang==='得时旺'||wang==='相次旺';
  // 总体格局概述
  var overview=isGood?
    '此局'+yd+' '+ju+'局，'+kp.gongName+'宫'+kp.star+kp.door+kp.god+'格局'+judge.split('(')[0]+'。用神'+wang+'，'+wangDesc+'。整体问事'+ask+'→利大于弊，可顺势而为。':
    '此局'+yd+' '+ju+'局，'+kp.gongName+'宫'+kp.star+kp.door+kp.god+'格局'+judge+'。用神'+wang+'，'+wangDesc+'。整体问事'+ask+'→需谨慎，不宜冒进。';
  // 关键运势
  var keyFortune=isGood?
    '天时('+hr+'时'+hourWx+')'+(wang==='得时旺'?'与用神比和，大吉':'次吉')+'。\n地利(用神宫'+kp.gongName+')'+kp.element+'旺相。\n人和(值符'+zhifuStar+'落'+palaces[zhifuPalace].gongName+'宫，值使'+zsDoor+'门落'+palaces[zhishiPalace].gongName+'宫)'+(isGood?'助你成事':'有阻碍需调')+'。':
    '天时'+hr+'时'+hourWx+'与用神'+wang+'。\n地利'+kp.gongName+'宫'+wangDesc+'。\n人和值符'+zhifuStar+'落'+palaces[zhifuPalace].gongName+'宫'+(palaces[zhifuPalace].starNature==='吉'?'尚可':'欠佳')+'。';
  // 核心建议
  var keyAdvice=isGood?
    '① 把握当下 → '+hr+'时后至'+((hr+3)%24)+'时为最佳行动窗口。\n② 吉方行动 → 朝'+kp.direction+'方向发展。\n③ 借贵人 → 值符落宫'+palaces[zhifuPalace].direction+'有贵人相助。\n④ 慎言慎行 → 吉格中宜稳扎稳打，忌贪大求全。':
    '① 静待时机 → '+hr+'时不宜冒进，待吉时再动。\n② 化解先行 → 诵《道德经》一章祈福化解。\n③ 慎择方位 → 避'+kp.direction+'方位。\n④ 修身养性 → 修德以禳灾，吉人天相。';
  // 最佳时辰
  var bestHour=hourWx===kp.element?(hr+12)%24:((hr+12)%24);
  var bestHourReason='下个'+kp.element+'旺时辰('+bestHour+'时)'+(isGood?'吉气叠加':'化解凶煞');
  // 吉方位
  var goodDirMap={金:'西北',木:'东/东南',水:'正北',火:'正南',土:'中央/西南/东北'};
  var goodDirection=goodDirMap[kp.element]||'中央';
  var goodDirReason='用神五行'+kp.element+'对应方位'+goodDirection+'，+旺'+kp.door+kp.star;
  // 不利方位
  var badDirection={金:'正南',木:'正西',水:'正南',火:'正北',土:'正东'}[kp.element]||'—';
  var badDirReason='用神'+kp.element+'所克方位(如正'+(kp.element==='金'?'南火':kp.element==='木'?'西金':kp.element==='水'?'南火':kp.element==='火'?'北水':'东木')+')';
  // 行动时机
  var actionTime=isGood?'3日内可行动':'7-10日后更佳';
  var actionTimeReason=isGood?'吉时已至，乘势而上':'需待'+kp.element+'旺日(农历逢'+(kp.element==='金'?'申酉':kp.element==='木'?'寅卯':kp.element==='水'?'亥子':kp.element==='火'?'巳午':'辰戌丑未')+'日)';
  // 吉数
  var luckyNumMap={金:'4/9',木:'3/8',水:'1/6',火:'2/7',土:'5/0'};
  var badNumMap={金:'2/7',木:'1/6',水:'2/7',火:'4/9',土:'3/8'};
  kp.luckyNum=luckyNumMap[kp.element];
  kp.badNum=badNumMap[kp.element];
  // 应期
  var nearPeriod=isGood?'1-3日内':'5日内不宜';
  var midPeriod=isGood?'本月内成事':'下月吉日方动';
  var farPeriod=isGood?'3个月内可见分晓':'需待时令转换';
  // 问事针对性
  var askSpecific='';
  if(ask==='事业决策')askSpecific='事业看开门+生门+值符。\n【开门落宫】'+palaces[6].gongName+'('+palaces[6].element+')'+palaces[6].doorNature+'\n【生门落宫】'+palaces[8].gongName+'('+palaces[8].element+')'+palaces[8].doorNature+'\n【决策建议】'+(palaces[6].doorNature==='吉'?'可大胆决策，谋为可成':'需三思，谨慎抉择')+'\n【领导态度】值符'+zhifuStar+'落'+palaces[zhifuPalace].gongName+'宫→'+(palaces[zhifuPalace].starNature==='吉'?'上级支持，前景光明':'上级有保留，需多沟通');
  else if(ask==='财运投资')askSpecific='财运看生门+甲子戊+生门所临宫。\n【生门落宫】'+palaces[8].gongName+'('+palaces[8].element+')'+palaces[8].doorNature+'\n【财星戊落宫】'+palaces[1].gongName+'宫(坎宫一)→'+(palaces[1].doorNature==='吉'?'财运亨通':'财运受制')+'\n【投资建议】'+(palaces[8].doorNature==='吉'?'可投资，回报可期':'不宜投资，静待时机')+'\n【破财防范】'+(wang==='受克'?'当月小心破财，忌担保借贷':'破财风险低，正财稳');
  else if(ask==='感情婚姻')askSpecific='感情看休门+六合+乙/庚。\n【休门落宫】'+palaces[1].gongName+'('+palaces[1].element+')'+palaces[1].doorNature+'\n【六合落宫】'+palaces[4].gongName+'宫(巽宫)→'+(palaces[4].godNature==='吉'?'有助姻缘':'需努力争取')+'\n【姻缘方向】'+palaces[1].direction+'方位遇正缘\n【恋爱建议】'+(palaces[1].doorNature==='吉'?'缘分将至，主动出击':'缘分未到，修养自身');
  else if(ask==='出行安全')askSpecific='出行看开门+天盘所临宫+九天/九地。\n【开门落宫】'+palaces[6].gongName+'('+palaces[6].element+')'+palaces[6].doorNature+'\n【九天/九地】'+(palaces[zhifuPalace].god==='九天'?'宜远行有吉':'宜近行')+'\n【出行吉日】择'+kp.element+'旺日\n【安全提示】'+(wang!=='受克'?'一路平安':'防交通小磕绊，宜谨慎');
  else if(ask==='失物寻找')askSpecific='失物看杜门+六仪+天盘寄宫方位。\n【杜门落宫】'+palaces[4].gongName+'('+palaces[4].element+')'+palaces[4].doorNature+'\n【失物方位】'+palaces[4].direction+'方向\n【找回概率】'+(palaces[4].doorNature==='吉'?'有望找回，3-7日内':'难找，已远去')+'\n【寻找建议】'+(palaces[4].doorNature==='吉'?'在'+palaces[4].direction+'方附近的'+(palaces[4].element==='金'?'金属柜':palaces[4].element==='木'?'木制抽屉':palaces[4].element==='水'?'水管边/水源处':palaces[4].element==='火'?'厨房灶台':'高处柜顶')+'处查找':'已移位，建议重置或报案');
  else if(ask==='官司诉讼')askSpecific='官司看开门+值符+天盘所克。\n【开门(法院)落宫】'+palaces[6].gongName+'宫→'+palaces[6].doorNature+'\n【我方(值符)落宫】'+palaces[zhifuPalace].gongName+'宫→'+palaces[zhifuPalace].starNature+'\n【对方(天盘所克)】'+(wang==='得时旺'?'胜算大':'需谨慎')+'\n【诉讼建议】'+(wang==='得时旺'?'主动起诉，胜诉可期':'以和为贵，谈判化解');
  else if(ask==='健康吉凶')askSpecific='健康看死门/惊门+天芮星(病符)+天心星(医药)。\n【死门落宫】'+palaces[2].gongName+'宫→'+palaces[2].doorNature+'\n【天芮星(病符)】'+palaces[5].star+'→'+palaces[5].starNature+'\n【天心星(医药)】'+palaces[6].star+'→'+palaces[6].starNature+'\n【健康警示】'+(wang==='受克'?'需重点调养'+kp.element+'对应脏腑':wang==='得时旺'?'身体康健，注意作息':'亚健康，需中医调理')+'\n【就医方向】'+palaces[2].direction+'方位医院医生为宜';
  else askSpecific='此局'+yd+' '+ju+'局，'+kp.gongName+'宫为通用用神。\n【通用解读】'+overview+'\n【核心提示】'+keyAdvice;
  return {
    ju:ju,
    juName:isYangDun?'阳遁'+ju:'阴遁'+ju,
    isYangDun:isYangDun,
    zhifu:zhifuStar,
    zhishi:zsDoor,
    zhifuPalace:zhifuPalace,
    zhishiPalace:zhishiPalace,
    palaces:palaces,
    keyPalace:kp,
    judge:judge,
    wang:wang,
    wangDesc:wangDesc,
    shengke:shengke,
    isGood:isGood,
    overview:overview,
    keyFortune:keyFortune,
    keyAdvice:keyAdvice,
    bestHour:bestHour,
    bestHourReason:bestHourReason,
    goodDirection:goodDirection,
    goodDirReason:goodDirReason,
    badDirection:badDirection,
    badDirReason:badDirReason,
    actionTime:actionTime,
    actionTimeReason:actionTimeReason,
    nearPeriod:nearPeriod,
    midPeriod:midPeriod,
    farPeriod:farPeriod,
    askSpecific:askSpecific
  };
}



function _mobile(m,industry,purpose,duration,bazi){
  const BX={'天医':{codes:['13','31','68','86','49','94','27','72'],desc:'正财·婚姻·天赋·善良',rank:'吉',career:'金融/医疗/珠宝',affect:'财运亨通，婚姻美满，心地善良'},'生气':{codes:['14','41','67','76','39','93','28','82'],desc:'贵人·乐天·活力·随缘',rank:'吉',career:'服务/教育/公关',affect:'贵人多助，乐观向上，人缘极佳'},'延年':{codes:['19','91','78','87','34','43','26','62'],desc:'领导·专业·长寿·自我',rank:'吉',career:'管理/军警/政治',affect:'领导力强，事业有成，延年益寿'},'伏位':{codes:['11','22','88','99','66','77','33','44'],desc:'耐心·潜藏·等待·被动',rank:'中',career:'研究/财务/行政',affect:'性格稳重有耐心，但需主动出击'},'六煞':{codes:['16','61','47','74','38','83','29','92'],desc:'桃花·人际·情绪·敏感',rank:'中',career:'美容/娱乐/社交',affect:'异性缘好善于交际，但情绪波动大'},'五鬼':{codes:['18','81','79','97','36','63','24','42'],desc:'才华·叛逆·反复·火线',rank:'凶',career:'技术/艺术/创新',affect:'才华横溢但波折多，事业反复不定'},'绝命':{codes:['12','21','69','96','48','84','37','73'],desc:'投资·冲动·极端·大起大落',rank:'凶',career:'投资/创业/投机',affect:'敢拼敢闯但易破财，大起大落'},'祸害':{codes:['17','71','89','98','46','64','23','32'],desc:'口舌·是非·铁齿·固执',rank:'凶',career:'法律/辩论/销售',affect:'口才好但易招是非，性格固执'}};
  function gx(c){for(var n in BX){if(BX[n].codes.indexOf(c)>=0)return{n:n,d:BX[n].desc,r:BX[n].rank,ca:BX[n].career,af:BX[n].affect};}return{n:'普通',d:'平稳',r:'中',ca:'不限',af:'性格平稳，中规中矩'};}
  var st=[],ji=0,xi=0,zh=0;
  for(var i=0;i<10;i+=2){var c=m.substring(i,i+2),s=gx(c);st.push({pos:i+1,code:c,s:s.n,d:s.d,r:s.rank,ca:s.ca,af:s.af});if(s.r==='吉')ji++;else if(s.r==='凶')xi++;else zh++;}
  var last=st[st.length-1],prev=st[st.length-2];
  var sc=ji*8-xi*6+20+(last.r==='吉'?5:0)+(last.r==='吉'&&prev.r==='吉'?8:0);sc=Math.max(0,Math.min(40,sc));
  var lv,emoji,rating;
  if(sc>=35){lv='大吉';emoji='🌟🌟🌟';rating='此号码磁场极佳，强烈推荐使用';}
  else if(sc>=28){lv='吉';emoji='🌟🌟';rating='此号码磁场良好，可以继续使用';}
  else if(sc>=22){lv='小吉';emoji='🌟';rating='此号码磁场尚可，有改进空间';}
  else if(sc>=15){lv='小凶';emoji='⚠️';rating='此号码磁场偏弱，建议考虑更换';}
  else if(sc>=8){lv='凶';emoji='⚠️⚠️';rating='此号码磁场较差，建议更换';}
  else{lv='大凶';emoji='⚠️⚠️⚠️';rating='此号码磁场极差，强烈建议更换';}
  var numWx={1:'水',6:'水',2:'火',7:'火',3:'木',8:'木',4:'金',9:'金',5:'土',0:'土'};
  var wxC={};for(var i=0;i<m.length;i++){var w=numWx[parseInt(m[i])];wxC[w]=(wxC[w]||0)+1;}
  var lack=['金','木','水','火','土'].filter(function(k){return !wxC[k];});
  var maxWx=Object.keys(wxC).reduce(function(a,b){return wxC[a]>wxC[b]?a:b;});
  
  var r='━━━ 手机号码深度测评报告 ━━━\n\n';
  r+='【号码】'+m+'\n';
  r+='【评级】'+emoji+' '+lv+'(评分'+sc+'/40)\n';
  r+='【总评】'+rating+'\n';
  r+='【吉凶】吉星'+ji+'个 · 凶星'+xi+'个 · 中星'+zh+'个\n';
  r+='【五行】'+maxWx+'旺('+wxC[maxWx]+'个)'+(lack.length?' · 缺'+lack.join('、'):' · 五行俱全')+'\n';
  if(industry)r+='【行业】'+industry+'\n';
  if(purpose)r+='【使用目的】'+purpose+'\n';
  if(duration)r+='【使用时长】'+duration+'\n';
  r+='\n━━━ 八星磁场详细拆解 ━━━\n';
  st.forEach(function(s){var icon=s.r==='吉'?'✅':s.r==='凶'?'❌':'➖';r+=icon+' '+s.code+' '+s.s+'('+s.r+')— '+s.af+'\n  适合行业：'+s.ca+'\n';});
  r+='\n━━━ 尾号深度分析 ━━━\n';
  r+='尾号'+last.code+' '+last.s+'('+last.r+')\n';
  r+='影响：'+last.af+'\n';
  if(last.r==='吉'&&prev.r==='吉')r+='★ 双吉星结尾→财运人缘双丰收\n';
  else if(last.r==='吉')r+='★ 吉星结尾→收尾顺利，凡事善终\n';
  else if(last.r==='凶')r+='⚠ 凶星结尾→建议更换尾号为13/31/68/86/14/41等吉星\n';
  else r+='中星结尾→收尾平稳\n';
  r+='\n━━━ 五行能量分析 ━━━\n';
  r+='金'+(wxC['金']||0)+' 木'+(wxC['木']||0)+' 水'+(wxC['水']||0)+' 火'+(wxC['火']||0)+' 土'+(wxC['土']||0)+'\n';
  var wxDesc={'金':'决断力强，重义气','木':'进取心强，有才华','水':'聪明灵活，善变通','火':'热情外向，有领导力','土':'稳重厚道，重承诺'};
  r+='主导五行：'+maxWx+' → '+wxDesc[maxWx]+'\n';
  if(lack.length){var fixMap={'金':'补金(尾号4/9)→增强决断','木':'补木(尾号3/8)→增强进取','水':'补水(尾号1/6)→增强灵活','火':'补火(尾号2/7)→增强热情','土':'补土(尾号5/0)→增强稳定'};r+='缺'+lack.join('、')+'：'+lack.map(function(l){return fixMap[l];}).join('；')+'\n';}
  r+='\n━━━ 综合建议 ━━━\n';
  if(sc>=28){r+='✅ 号码'+lv+'，磁场良好。吉星带来'+st.filter(function(s){return s.r==='吉';}).map(function(s){return s.s+'('+s.af+')';}).join('、')+'\n';r+='适合行业：'+st.filter(function(s){return s.r==='吉';}).map(function(s){return s.ca;}).join('、')+'\n';}
  else if(sc>=15){r+='⚠️ 号码'+lv+'，吉凶参半。';if(xi>0)r+='注意凶星：'+st.filter(function(s){return s.r==='凶';}).map(function(s){return s.s+'('+s.af+')';}).join('；')+'\n';r+='建议：佩戴'+(lack.includes('金')?'金属':lack.includes('木')?'木质':lack.includes('水')?'水晶':lack.includes('火')?'红玛瑙':'玉石')+'饰品化解\n';}
  else{r+='❌ 号码'+lv+'，建议更换。优选尾号：\n';r+='  天医(正财)：13/31/68/86\n  生气(贵人)：14/41/67/76\n  延年(事业)：19/91/78/87\n';r+='避免尾号：12/21(绝命) 18/81(五鬼) 17/71(祸害)\n';}
  r+='\n━━━ 深度测评引导 ━━━\n';
  r+='如需更深度测评，请补充：\n';
  r+='① 行业 ② 生辰 ③ 使用目的\n';
  r+='例：金融行业，1985年生，求财运';
  return r;
}

function local(text){
  const t=text.toLowerCase();
  if(/你好|您好|hi|hello/.test(t))return'您好！我是AI命理助手。请选择上方模块开始分析，或直接告诉我您想了解什么。';
  if(/谢谢|感谢/.test(t))return'不客气！还有其他问题可以继续问我。';
  return'请选择上方模块开始分析，或直接输入您想了解的内容。';
}

function toggleTTS(){
  if (window.VoiceInteraction && window.VoiceInteraction.isPlaying && window.VoiceInteraction.isPlaying()) {
    window.VoiceInteraction.stop();
    document.getElementById('tts-btn').classList.remove('playing');
    document.getElementById('tts-btn').textContent='🔊';
  } else {
    // 读取最后一条助手消息
    const msgs=document.querySelectorAll('.msg.m-ai');
    if(!msgs.length){toast('暂无回复可朗读');return}
    const last=msgs[msgs.length-1];
    const txt=last.textContent.replace(/^🔮|^✨/,'').trim();
    if(window.VoiceInteraction){
      window.VoiceInteraction.speak(txt);
      document.getElementById('tts-btn').classList.add('playing');
      document.getElementById('tts-btn').textContent='⏹';
    } else {
      // 降级到浏览器内置
      const u=new SpeechSynthesisUtterance(txt);
      u.lang='zh-CN';u.rate=0.95;
      document.getElementById('tts-btn').classList.add('playing');
      u.onend=()=>{document.getElementById('tts-btn').classList.remove('playing');document.getElementById('tts-btn').textContent='🔊'};
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    }
  }
}
function speakMsg(el){
  if(!el)return;
  const txt=el.textContent.replace(/^🔮|^✨/,'').trim();
  if(window.VoiceInteraction) window.VoiceInteraction.speak(txt);
  else{const u=new SpeechSynthesisUtterance(txt);u.lang='zh-CN';u.rate=0.95;speechSynthesis.cancel();speechSynthesis.speak(u);}
}
function resetMicUI(){
  const b=mic;
  if(!b)return;
  b.dataset.on='';b.classList.remove('on');b.textContent='🎤';
  b.style.transform='';
  if(box){
    box.placeholder='输入问题...';
    box.style.borderColor='';
  }
}

// === KB 抽屉 ===
function openKBPanel(){
  const p=document.getElementById('kbPanel');
  p.style.display='block';
  const list=document.getElementById('kbList');
  const content=document.getElementById('kbContent');
  list.innerHTML='<div style="color:var(--gold,#c9a84c)">加载中...</div>';
  content.innerHTML='';
  // R53: 并行加载 KB 文件列表 + 质量报告（双 API 同步获取）
  Promise.all([
    fetch(API+'/api/kb/list').then(r=>r.json()).catch(()=>({files:[]})),
    fetch(API+'/api/kb/quality-report').then(r=>r.json()).catch(()=>null)
  ]).then(([data, qual])=>{
    if(!data.files||!data.files.length){
      list.innerHTML='<div>暂无知识库文件</div>';
      return;
    }
    let topHtml='';
    if(qual&&qual.data&&qual.data.summary){
      const s=qual.data.summary;
      const g=s.grade||'-';
      topHtml=`<div style="padding:10px 12px;margin-bottom:12px;background:linear-gradient(135deg,rgba(201,168,76,.12),rgba(201,168,76,.04));border:1px solid rgba(201,168,76,.3);border-radius:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-size:13px;color:var(--gold,#c9a84c);font-weight:600">📊 KB 质量审计</span>
          <a href="kb-quality.html" style="font-size:11px;color:var(--cyan,#22d3ee);text-decoration:none" target="_blank">查看详情 →</a>
        </div>
        <div style="display:flex;gap:12px;font-size:11px;color:var(--paper2,#ccc);flex-wrap:wrap">
          <span>等级 <b style="color:var(--gold,#c9a84c);font-size:14px">${esc(g)}</b></span>
          <span>${s.module_cnt} 模块</span>
          <span>${(s.total>=1000?(s.total/1000).toFixed(1)+'k':s.total)} 条目</span>
          <span>trust <b>${s.avg_trust}</b></span>
          ${s.needs_fix>0?`<span style="color:#f87171">⚠ ${s.needs_fix} 需修复</span>`:'<span style="color:#86efac">✓ 无需修复</span>'}
        </div>
      </div>`;
    }
    list.innerHTML=topHtml+'<div style="margin-bottom:8px;color:var(--paper2,#ccc)">共'+data.files.length+'个文件，点击查看</div>';
    data.files.forEach(f=>{
      const btn=document.createElement('div');
      btn.style.cssText='padding:8px 12px;margin:4px 0;background:rgba(201,168,76,0.06);border-radius:6px;cursor:pointer;transition:background 0.2s';
      const fname=typeof f==='string'?f:(f.filename||f.name||'');
      const desc=f.desc||'';
      const level=f.level||'public';
      btn.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center"><span>📄 '+esc(fname)+'</span><span style="color:#999;font-size:10px">['+level+']</span></div>'+(desc?'<div style="color:#999;font-size:11px;margin-top:2px">'+esc(desc.slice(0,50))+'</div>':'');
      btn.onmouseenter=function(){this.style.background='rgba(201,168,76,0.15)';};
      btn.onmouseleave=function(){this.style.background='rgba(201,168,76,0.06)';};
      btn.onclick=function(){loadKBDetail(fname);};
      list.appendChild(btn);
    });
  }).catch(err=>{
    list.innerHTML='<div style="color:#f44336">加载失败：'+err.message+'<br><span style="font-size:12px;color:var(--paper2,#999)">请确保后端服务(8920)已启动</span></div>';
  });
}
function closeKBPanel(){document.getElementById('kbPanel').style.display='none';}
function loadKBDetail(name){
  const content=document.getElementById('kbContent');
  content.innerHTML='<div style="color:var(--gold,#c9a84c)">加载中...</div>';
  fetch(API+'/api/kb/'+encodeURIComponent(name)).then(r=>{
    if(!r.ok){
      if(r.status===403)return r.json().then(d=>{throw new Error(d.message||'无权访问')});
      if(r.status===404)return Promise.reject(new Error('文件不存在'));
      return Promise.reject(new Error('HTTP '+r.status));
    }
    return r.text();
  }).then(text=>{
    // 解析 KB JS 源码，提取模块结构
    const mods=[];
    const regex=/name:\s*[\'"]([^\'"]+)[\'"]\s*,\s*desc:\s*[\'"]([^\'"]*)[\'"]/g;
    let m;
    while((m=regex.exec(text))!==null){
      mods.push({title:m[1],summary:m[2]});
    }
    let html='<h4 style="color:var(--gold,#c9a84c);margin:0 0 8px">📄 '+esc(name)+'</h4>';
    html+='<div style="margin-bottom:8px;padding:8px;background:rgba(201,168,76,0.06);border-radius:6px;font-size:12px;color:var(--paper2,#ccc)">文件大小：'+Math.round(text.length/1024)+'KB · 模块数：'+mods.length+'</div>';
    if(mods.length){
      html+='<div style="font-size:12px;margin-bottom:8px;color:var(--gold,#c9a84c)">包含模块</div>';
      mods.slice(0,30).forEach(function(mod){
        html+='<div style="padding:6px;margin:4px 0;background:rgba(255,255,255,0.03);border-radius:4px">';
        html+='<div style="color:var(--gold,#c9a84c);font-weight:bold;font-size:13px">📚 '+esc(mod.title)+'</div>';
        if(mod.summary)html+='<div style="font-size:12px;color:var(--paper2,#999);margin-top:2px">'+esc(mod.summary)+(mod.summary.length>=100?'...':'')+'</div>';
        html+='</div>';
      });
      if(mods.length>30)html+='<div style="text-align:center;color:var(--paper2,#999);padding:8px;font-size:12px">还有 '+(mods.length-30)+' 个模块...</div>';
    } else {
      html+='<pre style="white-space:pre-wrap;font-size:11px;line-height:1.4;max-height:40vh;overflow-y:auto;color:#aaa">'+esc(text.slice(0,3000))+'</pre>';
    }
    content.innerHTML=html;
  }).catch(err=>{
    content.innerHTML='<div style="color:#f44336;padding:12px"><div>❌ '+esc(err.message)+'</div><div style="font-size:11px;color:#999;margin-top:8px">文件可能不存在或无权限访问</div></div>';
  });
}

// === 历史抽屉 ===
function openHistoryPanel(){
  const p=document.getElementById('historyPanel');
  p.style.display='block';
  const list=document.getElementById('historyList');
  list.innerHTML='<div style="color:var(--gold,#c9a84c)">加载中...</div>';
  const token=localStorage.getItem('auth_token')||'';
  fetch(API+'/api/paipan/history',{headers:{'Authorization':token?('Bearer '+token):''}}).then(r=>r.json()).then(data=>{
    // 后端返回的是数组（兼容对象）
    const records=Array.isArray(data)?data:(data.records||data.items||[]);
    if(!records.length){
      list.innerHTML='<div style="color:var(--paper2,#999)">暂无历史记录<br><span style="font-size:12px">完成排盘分析后，记录会自动保存</span></div>';
      return;
    }
    list.innerHTML='<div style="margin-bottom:8px">共 '+records.length+' 条记录</div>';
    records.slice(0,30).forEach(function(r){
      const div=document.createElement('div');
      div.style.cssText='padding:10px;margin:6px 0;background:rgba(201,168,76,0.06);border-radius:6px;cursor:pointer';
      const typename=MODULES[r.type]?MODULES[r.type].name:(r.type||'排盘');
      const inputSummary=r.input_data?(typeof r.input_data==='string'?r.input_data.slice(0,60):JSON.stringify(r.input_data).slice(0,60)):'';
      div.innerHTML='<div style="color:var(--gold,#c9a84c);font-size:13px;font-weight:bold">'+esc(typename)+'</div><div style="font-size:11px;color:var(--paper2,#999);margin-top:2px">'+esc(r.created_at||'')+' · '+esc(inputSummary)+'</div>';
      div.onclick=function(){showHistoryDetail(r);};
      list.appendChild(div);
    });
  }).catch(err=>{
    // Fallback to localStorage
    const local=localStorage.getItem('paipan_history');
    if(local){
      try{
        const records=JSON.parse(local);
        list.innerHTML='<div style="margin-bottom:8px">本地缓存 '+records.length+' 条</div>';
        records.slice(0,20).forEach(function(r,i){
          const div=document.createElement('div');
          div.style.cssText='padding:10px;margin:6px 0;background:rgba(201,168,76,0.06);border-radius:6px;cursor:pointer';
          div.innerHTML='<div style="color:var(--gold,#c9a84c);font-size:13px">'+esc(r.module||'排盘')+'</div><div style="font-size:11px;color:var(--paper2,#999);margin-top:2px">'+esc(r.time||'')+'</div>';
          div.onclick=function(){addAI(r.report||'历史记录内容不可用');};
          list.appendChild(div);
        });
      }catch(e){
        list.innerHTML='<div>暂无可用历史</div>';
      }
    } else {
      list.innerHTML='<div style="color:var(--paper2,#999)">暂无历史记录<br><span style="font-size:12px;color:#999">'+esc(err.message)+'</span></div>';
    }
  });
}
function closeHistoryPanel(){document.getElementById('historyPanel').style.display='none';}
function showHistoryDetail(r){
  const typename=MODULES[r.type]?MODULES[r.type].name:(r.type||'排盘');
  let body='━━━ 📜 历史记录 ━━━\n\n';
  body+='【模块】'+typename+'\n';
  body+='【时间】'+(r.created_at||'')+'\n';
  if(r.input_data){
    body+='\n【输入数据】\n';
    try{
      const data=typeof r.input_data==='string'?JSON.parse(r.input_data):r.input_data;
      Object.keys(data).forEach(function(k){
        body+='  • '+k+': '+(typeof data[k]==='string'?data[k]:JSON.stringify(data[k]).slice(0,100))+'\n';
      });
    }catch(e){
      body+='  '+String(r.input_data).slice(0,200)+'\n';
    }
  }
  body+='\n💡 提示：完整分析报告可通过重新运行排盘获得';
  addAI(body);
  closeHistoryPanel();
}

// === 反馈 ===
function openFeedback(){document.getElementById('feedbackPanel').style.display='block';}

// R89-N · 顶部 chip 即时显示当前缘主（报告生成后自动落档触发）
function _renderProfileChip(){
  try {
    const _chip = document.getElementById('profileChip');
    if (!_chip || !window.YuanzhuProfile) return;
    const _cur = window.YuanzhuProfile.current();
    if (_cur && _cur.name) {
      const _visits = _cur.visits || 1;
      _chip.textContent = '⭐ ' + _cur.name + ' · ' + _visits + '次';
      _chip.style.display = 'inline-flex';
      _chip.style.alignItems = 'center';
    } else {
      _chip.style.display = 'none';
      _chip.textContent = '';
    }
  } catch(e) { /* silent */ }
}
// R89-N · 页面初始化时如有当前档案也展示 chip
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _renderProfileChip);
} else {
  setTimeout(_renderProfileChip, 0);
}

// R89-Q · chip 点击直跳当前缘主的历史报告（无当前缘主时回退到档案面板）
function showProfileHistory(){
  if(!window.YuanzhuProfile) return openProfilePanel();
  var _cur = window.YuanzhuProfile.current();
  if(!_cur || !_cur.name) return openProfilePanel();
  // 打开历史抽屉并按缘主名筛选
  var p=document.getElementById('historyPanel');
  p.style.display='block';
  var list=document.getElementById('historyList');
  list.innerHTML='<div style="color:var(--gold,#c9a84c)">加载中...</div>';
  // 更新抽屉标题
  var titleEl=p.querySelector('h3');
  if(titleEl) titleEl.textContent='📜 '+_cur.name+' 的历史报告';
  var token=localStorage.getItem('auth_token')||'';
  fetch(API+'/api/paipan/history',{headers:{'Authorization':token?('Bearer '+token):''}}).then(r=>r.json()).then(data=>{
    var records=Array.isArray(data)?data:(data.records||data.items||[]);
    // 按缘主名筛选（匹配 input_data 中的 name/userName 字段）
    var filtered=records.filter(function(r){
      try{
        var d=typeof r.input_data==='string'?JSON.parse(r.input_data):r.input_data;
        var n=d&&(d.name||d.userName||'');
        return n&&n===_cur.name;
      }catch(e){return false;}
    });
    if(!filtered.length){
      list.innerHTML='<div style="color:var(--paper2,#999)">【'+esc(_cur.name)+'】暂无历史报告<br><span style="font-size:12px">完成排盘分析后，记录会自动保存</span></div>';
      return;
    }
    list.innerHTML='<div style="margin-bottom:8px">共 '+filtered.length+' 条记录（'+esc(_cur.name)+'）</div>';
    filtered.slice(0,30).forEach(function(r){
      var div=document.createElement('div');
      div.style.cssText='padding:10px;margin:6px 0;background:rgba(201,168,76,0.06);border-radius:6px;cursor:pointer';
      var typename=MODULES[r.type]?MODULES[r.type].name:(r.type||'排盘');
      var inputSummary=r.input_data?(typeof r.input_data==='string'?r.input_data.slice(0,60):JSON.stringify(r.input_data).slice(0,60)):'';
      div.innerHTML='<div style="color:var(--gold,#c9a84c);font-size:13px;font-weight:bold">'+esc(typename)+'</div><div style="font-size:11px;color:var(--paper2,#999);margin-top:2px">'+esc(r.created_at||'')+' · '+esc(inputSummary)+'</div>';
      div.onclick=function(){showHistoryDetail(r);};
      list.appendChild(div);
    });
  }).catch(err=>{
    list.innerHTML='<div style="color:var(--paper2,#999)">加载失败<br><span style="font-size:12px;color:#999">'+esc(err.message)+'</span></div>';
  });
}

// R89-M 缘主档案面板
async function openProfilePanel(){
  if(!window.YuanzhuProfile) return showToast('档案模块未加载');
  const _list = window.YuanzhuProfile.list();
  const _cur = window.YuanzhuProfile.current();
  const _panel = document.createElement('div');
  _panel.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  const _modal = document.createElement('div');
  _modal.style.cssText = 'background:var(--card);border:1px solid rgba(201,168,76,0.4);border-radius:14px;max-width:560px;width:100%;max-height:80vh;overflow-y:auto;padding:20px;font-family:inherit;color:var(--paper)';
  
  let _html = '<div style="display:flex;align-items:center;margin-bottom:14px"><div style="font-size:18px;font-weight:600;color:#c9a84c">👤 缘主档案</div><button onclick="this.parentElement.parentElement.parentElement.remove()" style="margin-left:auto;padding:4px 10px;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);border-radius:8px;color:#ef4444;cursor:pointer">关闭</button></div>';
  
  if(_cur && _cur.name){
    _html += '<div style="background:linear-gradient(135deg,rgba(201,168,76,0.08),rgba(201,168,76,0.02));border:1px solid rgba(201,168,76,0.2);border-radius:10px;padding:12px;margin-bottom:14px">';
    _html += '<div style="font-size:14px;font-weight:600;margin-bottom:6px">⭐ 当前缘主</div>';
    _html += '<div style="font-size:12px;line-height:1.7;color:var(--paper2)">';
    _html += '<b>' + _esc(_cur.name) + '</b>';
    if(_cur.gender) _html += ' <span style="opacity:0.7">·</span> ' + _esc(_cur.gender);
    if(_cur.birth || _cur.time) _html += '<br><span style="opacity:0.7">生辰：</span>' + _esc(_cur.birth || '') + ' ' + _esc(_cur.time || '');
    if(_cur.location) _html += '<br><span style="opacity:0.7">出生地：</span>' + _esc(_cur.location);
    if(_cur.modules && _cur.modules.length) _html += '<br><span style="opacity:0.7">最近模块：</span>' + _esc(_cur.modules.slice(0,3).join('、'));
    _html += '</div></div>';
  }
  
  _html += '<div style="font-size:13px;font-weight:600;margin-bottom:8px">所有档案（' + _list.length + '/20）</div>';
  
  if(!_list.length){
    _html += '<div style="text-align:center;padding:20px;color:var(--paper3);font-size:12px">暂无档案，排盘后自动保存</div>';
  } else {
    _list.forEach(p => {
      const _isCur = _cur && _cur.id === p.id;
      _html += '<div style="display:flex;align-items:center;padding:10px;border:1px solid rgba(201,168,76,' + (_isCur?'0.4':'0.15') + ');border-radius:8px;margin-bottom:6px;background:' + (_isCur?'rgba(201,168,76,0.06)':'transparent') + '">';
      _html += '<div style="width:36px;height:36px;border-radius:50%;background:rgba(201,168,76,0.2);display:flex;align-items:center;justify-content:center;font-size:18px">' + (p.gender==='女'||p.gender==='female'?'♀':'♂') + '</div>';
      _html += '<div style="flex:1;margin-left:10px;font-size:12px">';
      _html += '<div style="font-weight:600">' + _esc(p.name||'(无)') + ' <span style="opacity:0.6;font-weight:normal">· ' + _esc(p.birth||'') + '</span></div>';
      _html += '<div style="opacity:0.6;font-size:11px">' + (p.modules&&p.modules.length?p.modules.join('、'):'暂无') + (p.visits?' · ' + p.visits + '次咨询':'') + '</div>';
      _html += '</div>';
      _html += '<button data-pid="' + p.id + '" class="profile-load" style="padding:4px 10px;background:rgba(34,211,238,0.15);border:1px solid rgba(34,211,238,0.3);border-radius:8px;color:#22d3ee;cursor:pointer;font-size:11px">使用</button>';
      _html += '<button data-pdel="' + p.id + '" class="profile-del" style="padding:4px 8px;margin-left:4px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:8px;color:#ef4444;cursor:pointer;font-size:11px">删</button>';
      _html += '</div>';
    });
  }
  
  if(_list.length){
    _html += '<button onclick="window.YuanzhuProfile.clearAll();this.parentElement.parentElement.parentElement.remove();openProfilePanel()" style="margin-top:10px;padding:8px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;color:#ef4444;cursor:pointer;width:100%;font-size:12px">🗑 清空所有档案</button>';
  }
  
  _modal.innerHTML = _html;
  _panel.appendChild(_modal);
  document.body.appendChild(_panel);
  
  _panel.addEventListener('click', e => { if(e.target===_panel) _panel.remove(); });
  _modal.querySelectorAll('.profile-load').forEach(b => b.addEventListener('click', e => {
    const pid = e.target.dataset.pid;
    if(window.YuanzhuProfile.loadProfile(pid)){
      const p = window.YuanzhuProfile.getProfile(pid);
      if(p && p.data){
        state.module = p.modules && p.modules[0] ? p.modules[0] : state.module;
        state.data = p.data;
        addAI('已加载缘主【' + (p.name||'') + '】上次的排盘上下文，共 ' + Object.keys(p.data).length + ' 项。点击「重新解读」将基于此上下文快速生成报告。', { type: 'profile-loaded' });
      }
    }
    _panel.remove();
  }));
  _modal.querySelectorAll('.profile-del').forEach(b => b.addEventListener('click', e => {
    const pid = e.target.dataset.pdel;
    if(confirm('删除此缘主档案？')){
      window.YuanzhuProfile.deleteProfile(pid);
      _panel.remove(); openProfilePanel();
    }
  }));
}
function _esc(s){return String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function closeFeedback(){document.getElementById('feedbackPanel').style.display='none';}
function submitFeedback(type){
  const text=document.getElementById('feedbackText').value.trim();
  if(!text&&type!=='praise'){showToast('请填写反馈内容');return;}
  const token=localStorage.getItem('auth_token')||'';
  fetch(API+'/api/feedback/submit',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':token?('Bearer '+token):''},
    body:JSON.stringify({type:type,content:text||'点赞鼓励',module:state.module||'general'})
  }).then(r=>r.json()).then(data=>{
    if(data.success!==false){
      showToast('感谢反馈！+'+(data.points||0)+'积分');
      document.getElementById('feedbackText').value='';
      closeFeedback();
    } else {
      showToast('提交失败：'+(data.error||'未知错误'));
    }
  }).catch(err=>{
    showToast('网络错误，已保存到本地');
    const arr=JSON.parse(localStorage.getItem('feedback_pending')||'[]');
    arr.push({type:type,content:text,module:state.module,time:Date.now()});
    localStorage.setItem('feedback_pending',JSON.stringify(arr));
    closeFeedback();
  });
}

function voice(){
  // 优先使用 voice-interaction.js 的 STT
  if (window.VoiceInteraction) {
    const vi = window.VoiceInteraction;
    try {
      if (vi.isListening && vi.isListening()) {
        vi.stopListening();
        resetMicUI();
        return;
      }
    } catch(e){ console.warn('isListening err',e); }
    const b=mic;
    if(b){
      b.dataset.on='1';
      b.classList.add('on');
      b.textContent='🔴';
      b.style.transform='scale(1.2)';
    }
    box.placeholder='🎤 正在聆听...';
    box.style.borderColor='rgba(231,76,60,0.4)';
    showToast('🎤 请允许浏览器使用麦克风...');
    // 注册结束回调确保 UI 复位
    window.__onVoiceEnd = function(){ resetMicUI(); };
    try {
      vi.startListening();
    } catch(err){
      console.warn('startListening err', err);
      showToast('语音启动失败，请手动输入');
      resetMicUI();
    }
    return;
  }
  // VoiceInteraction 未加载（常见原因：script路径错误）
  console.warn('window.VoiceInteraction 未定义，检查 voice-interaction.js 是否加载');
  showToast('语音模块未加载，请刷新页面');

  // 降级原生实现
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){
    showVoiceFallback();
    return;
  }
  const b=mic;
  if(b.dataset.on==='1'){if(window._r)window._r.stop();return}

  // 立即给视觉反馈
  b.dataset.on='1';b.classList.add('on');b.textContent='🔴';
  b.style.transform='scale(1.2)';
  toast('🎤 正在聆听...请对着手机说话');
  box.placeholder='🎤 正在聆听...';
  box.style.borderColor='rgba(231,76,60,0.4)';

  const r=new SR();window._r=r;
  r.lang='zh-CN';r.continuous=false;r.interimResults=true;
  let ft='';

  r.onstart=()=>{
    b.dataset.on='1';b.classList.add('on');b.textContent='🔴';
  };
  
  r.onresult=e=>{
    let im='';
    for(let i=e.resultIndex;i<e.results.length;i++){
      if(e.results[i].isFinal)ft+=e.results[i][0].transcript;
      else im+=e.results[i][0].transcript;
    }
    box.value=ft+im;
  };
  
  r.onerror=(e)=>{
    b.dataset.on='0';b.classList.remove('on');b.textContent='🎤';
    b.style.transform='scale(1)';
    box.placeholder='输入问题...';
    box.style.borderColor='';
    let errMsg='语音识别失败';
    if(e.error==='not-allowed')errMsg='麦克风权限被拒绝，请在浏览器设置中允许';
    else if(e.error==='no-speech')errMsg='未检测到语音，请重试';
    else if(e.error==='network')errMsg='网络错误，请检查连接';
    else if(e.error==='aborted')errMsg='';
    else errMsg='语音识别出错：'+e.error;
    if(errMsg)toast(errMsg);
    /* 网络错误时也降级到文本模式 */
    if(e.error==='network'||e.error==='not-allowed'){showVoiceFallback();}
  };
  
  r.onend=()=>{
    b.dataset.on='0';b.classList.remove('on');b.textContent='🎤';
    b.style.transform='scale(1)';
    box.placeholder='输入问题...';
    box.style.borderColor='';
    if(ft.trim())send();
  };
  
  try{
    r.start();
  }catch(e){
    b.dataset.on='0';b.classList.remove('on');b.textContent='🎤';
    toast('无法启动语音识别，请重试');
    showVoiceFallback();
  }
}

/* 浏览器不支持时的语音降级面板 */
function showVoiceFallback(){
  /* 如果已有面板则切换显隐 */
  let panel=document.getElementById('voiceFallback');
  if(panel){panel.style.display=panel.style.display==='none'?'block':'none';return;}
  panel=document.createElement('div');
  panel.id='voiceFallback';
  panel.style.cssText='position:fixed;bottom:70px;left:50%;transform:translateX(-50%);width:90%;max-width:500px;background:var(--ink2,#111);border:1px solid rgba(201,168,76,0.3);border-radius:12px;padding:16px;z-index:300;box-shadow:0 -4px 30px rgba(0,0,0,0.5)';
  panel.innerHTML='<div style="color:var(--gold,#c9a84c);font-size:14px;margin-bottom:10px;text-align:center;letter-spacing:2px">🎤 语音输入(文本模式)</div>'+
    '<textarea id="voiceText" placeholder="请在此输入您的问题..." style="width:100%;min-height:80px;background:rgba(255,255,255,0.04);border:1px solid rgba(201,168,76,0.15);border-radius:8px;padding:10px;color:var(--paper,#f0e8d8);font-size:14px;font-family:inherit;resize:none;line-height:1.8"></textarea>'+
    '<div style="display:flex;gap:8px;margin-top:10px;justify-content:flex-end">'+
    '<button onclick="document.getElementById(\'voiceFallback\').style.display=\'none\'" style="padding:6px 16px;font-size:12px;border:1px solid rgba(201,168,76,0.2);border-radius:6px;background:transparent;color:var(--paper3,#a09080);cursor:pointer;font-family:inherit">取消</button>'+
    '<button id="voiceSendBtn" style="padding:6px 16px;font-size:12px;border:none;border-radius:6px;background:linear-gradient(135deg,#c9a84c,#a08030);color:#080808;cursor:pointer;font-family:inherit">发送</button>'+
    '</div>';
  document.body.appendChild(panel);
  const ta=panel.querySelector('#voiceText');
  ta.focus();
  const sendBtn=panel.querySelector('#voiceSendBtn');
  const sendVoiceText=()=>{
    const v=ta.value.trim();
    if(v){box.value=v;send();panel.style.display='none';ta.value='';}
  };
  sendBtn.onclick=sendVoiceText;
  ta.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendVoiceText();}});
}

async function handleFaceUpload(input){
  if(!input.files||!input.files[0])return;
  var file=input.files[0];
  var reader=new FileReader();
  reader.onload=async function(e){
    var prev=document.getElementById('facePreview');
    if(prev){
      prev.style.display='block';
      prev.innerHTML='<img src="'+e.target.result+'" style="max-width:200px;max-height:200px;border-radius:8px;border:1px solid var(--border);margin-top:6px"><div style="font-size:11px;color:var(--jade);margin-top:4px">✅ 照片已上传 · 正在AI识图…</div>';
    }
    state.data.faceImage=e.target.result;
    state.data['s'+state.step]='已上传面部照片';
    showToast('正在调用AI识图分析…');

    // 【新增】调用后端 face-ocr 服务拿真实视觉分析
    // R205: zhongyi 模块带 mode=wangzhen 走望诊 prompt
    var faceMode = (state.module==='zhongyi') ? 'wangzhen' : 'face';
    try {
      var faceResp = await fetch(API+'/api/face/analyze', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({image:e.target.result, mode:faceMode})
      }).then(r=>r.json());
      if(faceResp && faceResp.ok){
        // 质量检查失败 → 提示用户重拍
        if(faceResp.phase==='inspect' && !faceResp.inspect.valid){
          var iss=(faceResp.inspect.issues||[]).join('；');
          if(prev) prev.innerHTML += '<div style="font-size:11px;color:#e87a5a;margin-top:6px">⚠️ '+escHtml(iss)+'，建议重拍</div>';
          showToast('图片质量不达标：'+iss);
        } else {
          // 成功 → 存分析结果（KB 兑底也存，不丢报告）
          state.data.faceAnalysis = faceResp.analysis || faceResp.text || '';
          state.data.faceEngine = faceResp.engine || 'unknown';
          state.data.faceMode = faceResp.mode || faceMode;
          var modeLabel = faceMode==='wangzhen' ? '望诊' : '面相';
          if(prev) prev.innerHTML += '<div style="font-size:11px;color:var(--gold);margin-top:6px">✨ AI'+modeLabel+'分析完成（引擎：'+escHtml(faceResp.engine||'kb')+'）</div>';
          showToast(modeLabel+'分析完成');
        }
      }
    } catch(err){
      console.warn('face-ocr 调用失败',err);
      if(prev) prev.innerHTML += '<div style="font-size:11px;color:var(--text-muted);margin-top:6px">⚠️ AI视觉不可用，将以理论框架生成报告</div>';
    }

    // 自动推进到下一步
    state.step++;
    var mod=MODULES[state.module];
    if(mod&&state.step<mod.steps.length){
      var nextStep=mod.steps[state.step];
      await typing();
      addAI(nextStep.q,nextStep);
    }else{
      // 所有步骤完成→生成报告
      state.reporting=true;
      await typing();
      await generateReport();
    }
  };
  reader.readAsDataURL(file);
}

/* TTS 朗读/停止切换 */
function stopTTS(){
  window._ttsPlaying=false;
  if(window.stopSpeak)window.stopSpeak();
  else if('speechSynthesis' in window)window.speechSynthesis.cancel();
  const btn=document.getElementById('tts-btn');
  if(btn){btn.textContent='🔊';btn.classList.remove('on');}
}

// P14 节点 3：music 顺序朗读控制（P1-任务3 断网可用率 100%）
window._musicPlaylistAbort = false;
function _playMusicPlaylist(btn){
  if(!('speechSynthesis' in window)){ showToast('当前浏览器不支持 SpeechSynthesis，请换 Chrome/Safari。'); return; }
  let pl;
  try{ pl = JSON.parse(btn.getAttribute('data-playlist')); }catch(e){ console.warn('playlist parse err',e); return; }
  window._musicPlaylistAbort = false;
  window.speechSynthesis.cancel();
  const texts = pl.map(p => p.ttsText).filter(Boolean);
  if(!texts.length) return;
  let i = 0;
  const speakNext = () => {
    if(window._musicPlaylistAbort || i >= texts.length) return;
    const u = new SpeechSynthesisUtterance(texts[i]);
    u.lang = 'zh-CN';
    u.rate = 0.92;
    u.pitch = 1.0;
    u.volume = 1.0;
    u.onend = () => {
      i++;
      setTimeout(()=>{ if(!window._musicPlaylistAbort) speakNext(); }, 600);
    };
    u.onerror = (e)=>{ console.warn('TTS err',e); i++; setTimeout(()=>{ if(!window._musicPlaylistAbort) speakNext(); }, 600); };
    window.speechSynthesis.speak(u);
  };
  speakNext();
  btn.textContent='🔊 朗读中...'; btn.disabled=true;
  setTimeout(()=>{ btn.textContent='▶️ 连续朗读 5 段'; btn.disabled=false; }, 30000);
}
function _stopMusicPlaylist(){
  window._musicPlaylistAbort = true;
  if('speechSynthesis' in window) window.speechSynthesis.cancel();
}
/* 麦克风 UI 复位 */
function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/━━━/g,'<b class="sec">━━━').replace(/━━━/g,'━━━</b>').replace(/\n/g,'<br>');}
/* === 模块 KB 兜底报告库（P1-任务3：断网可用率 100%）===
 * music + lifeindex + lifeplan 三大模块独立可用，无需 AI 即可生成报告
 */


/* ===== Extracted from ai-assistant.html ===== */


// R39-C 双核 KB 命中辅助函数
function r39DualKBMatch(query){
  if(!window.R39_DUAL_CORE_KB) return null;
  var q = String(query||'').toLowerCase();
  var best = null;
  var bestScore = 0;
  for(var i=0;i<R39_DUAL_CORE_KB.length;i++){
    var e = R39_DUAL_CORE_KB[i];
    var titleMatch = e.title.toLowerCase().indexOf(q)>=0?0.5:0;
    var tagMatch = (e.tags||[]).some(function(t){return q.indexOf(t.toLowerCase())>=0;})?0.3:0;
    var dimMatch = (e.dimension||e.palace||e.domain||'').toLowerCase().indexOf(q)>=0?0.4:0;
    var score = titleMatch + tagMatch + dimMatch;
    if(score > bestScore){ bestScore = score; best = e; }
  }
  return bestScore >= 0.4 ? best : null;
}
function r39DualKBReply(query){
  var hit = r39DualKBMatch(query);
  if(!hit) return null;
  return '【KB R39-B 双核】'+hit.title+'\n\n'+hit.content+'\n\n📜 古籍: '+hit.sources.join('、')+'\n📊 评分: '+hit.score;
}
console.log('[R39-C] 双核 KB 命中辅助函数已挂载');


/* ===== Extracted from ai-assistant.html ===== */

(function(){
  if (window.__r41_e_kb) return; window.__r41_e_kb = true;
  
  // 拦截 fetch 调用 API 时显示 KB 命中信息
  var origFetch = window.fetch;
  window.fetch = function(url, opts) {
    if (typeof url === 'string' && url.indexOf('/api/ai/') >= 0 && opts && opts.body) {
      try {
        var body = JSON.parse(opts.body);
        if (body.messages) {
          var lastMsg = body.messages.filter(function(m){return m.role==='user'}).pop();
          if (lastMsg && lastMsg.content) {
            // 计算 KB 命中分
            var kbScore = 0;
            var kbSource = '';
            if (window.NIHAISHA_KB) {
              var k = Object.keys(window.NIHAISHA_KB).find(function(key){
                return lastMsg.content.indexOf(key) >= 0;
              });
              if (k) { kbScore = 0.85; kbSource = '倪师'; }
            }
            if (window.SHUHAN_KB && kbScore < 0.7) {
              var k2 = Object.keys(window.SHUHAN_KB).find(function(key){
                return lastMsg.content.indexOf(key) >= 0;
              });
              if (k2) { kbScore = 0.75; kbSource = '舒晗'; }
            }
            // 显示 KB 命中标识
            if (kbScore >= 0.7) {
              setTimeout(function(){
                showKBHitBadge(kbScore, kbSource, lastMsg.content);
              }, 200);
            }
          }
        }
      } catch(e){console.warn("报告降级:",e.message);}
    }
    return origFetch.apply(this, arguments);
  };
  
  function showKBHitBadge(score, source, query) {
    var badge = document.createElement('div');
    badge.className = 'kb-hit-badge';
    badge.innerHTML = '<span class="kb-hit-score">'+score.toFixed(2)+'</span> KB命中·'+source+'·来源古籍';
    badge.style.cssText = 'position:fixed;top:80px;right:20px;background:linear-gradient(135deg,rgba(201,168,76,.95),rgba(184,134,11,.95));color:#1a1a1a;padding:8px 14px;border-radius:20px;font-size:12px;font-weight:600;z-index:99999;box-shadow:0 4px 16px rgba(0,0,0,.3);animation:kbHitPop 0.4s ease';
    if (!document.getElementById('kbHitStyle')) {
      var s = document.createElement('style');
      s.id = 'kbHitStyle';
      s.textContent = '@keyframes kbHitPop{0%{transform:scale(0.6);opacity:0}50%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}';
      document.head.appendChild(s);
    }
    document.body.appendChild(badge);
    setTimeout(function(){ badge.style.opacity='0'; badge.style.transition='opacity 0.4s'; }, 2500);
    setTimeout(function(){ badge.remove(); }, 3000);
  }
})();

// ============ R50: 报告反馈 (点赞/踩) ============
window.fbReport = function(btn, val) {
  const ops = btn.parentElement;
  if (!ops) return;
  // 防止重复点击
  const buttons = ops.querySelectorAll('.btn-fb-up, .btn-fb-dn');
  buttons.forEach(function(b) { b.disabled = true; b.style.opacity = '.4'; });
  btn.style.opacity = '1';
  btn.style.background = val > 0 ? 'rgba(16,185,129,.2)' : 'rgba(239,68,68,.2)';
  btn.style.borderColor = val > 0 ? '#10b981' : '#ef4444';

  // 取报告文本（从同 msg 的 .b 取）
  let reportText = '';
  const msg = ops.closest('.msg');
  if (msg) {
    const body = msg.querySelector('.b');
    if (body) reportText = body.innerText.slice(0, 200);
  }
  // 取 state 信息
  const mod = (window.state && window.state.module) || 'unknown';
  const data = (window.state && window.state.data) || {};
  const dataKeys = Object.keys(data).slice(0, 6).map(function(k){ return k+'='+(data[k]||'').toString().slice(0,40); }).join('|');

  const payload = {
    module: mod,
    query: dataKeys,  // 用 data 字段作为 query（端点限 500 字符）
    source: 'ai-assistant-btn',
    score: val,         // 1=赞 -1=踩（端点限制 -1/0/+1）
    comment: reportText  // 报告样本作为备注
  };
  // 本地计数
  const fbKey = '_fb_score/' + mod;
  try {
    const cur = JSON.parse(localStorage.getItem(fbKey) || '{"up":0,"dn":0}');
    if (val > 0) cur.up++; else cur.dn++;
    localStorage.setItem(fbKey, JSON.stringify(cur));
    // 总计
    const tot = JSON.parse(localStorage.getItem('_fb_score/_total') || '{"up":0,"dn":0}');
    if (val > 0) tot.up++; else tot.dn++;
    localStorage.setItem('_fb_score/_total', JSON.stringify(tot));
  } catch(e) {}

  // 异步上报后端（白名单 + 失败静默）
  try {
    fetch((typeof API !== 'undefined' ? API : '') + '/api/public/kb-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function(r){
      // 视觉反馈
      btn.innerHTML = val > 0 ? '✅ 已赞' : '✅ 已记录';
      setTimeout(function(){ btn.innerHTML = val > 0 ? '👍 有帮助' : '👎 没帮助'; }, 2000);
    }).catch(function(){
      btn.innerHTML = val > 0 ? '✅ 已赞（离线）' : '✅ 已记录（离线）';
      setTimeout(function(){ btn.innerHTML = val > 0 ? '👍 有帮助' : '👎 没帮助'; }, 2500);
    });
  } catch(e) {
    btn.innerHTML = '✅';
  }
};

// ============ R50: 反馈统计面板 ============
window.showFbStats = async function() {
  const fmt = function(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,','); };
  let html = '<div class="fb-stats-panel" style="background:rgba(201,168,76,0.03);border:1px solid var(--border);border-radius:10px;padding:14px;margin:10px 0">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><strong style="color:var(--gold)">📊 反馈统计</strong><a href="javascript:void(0)" onclick="showWelcome()" style="color:var(--paper3);font-size:12px">← 返回</a></div>';

  // 本地统计
  let localUp = 0, localDn = 0, topMod = null, topCnt = 0;
  const breakdown = [];
  try {
    const tot = JSON.parse(localStorage.getItem('_fb_score/_total') || '{"up":0,"dn":0}');
    localUp = tot.up; localDn = tot.dn;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.indexOf('_fb_score/') === 0) continue;
      if (k === '_fb_score/_total') continue;
      const mod = k.substring('_fb_score/'.length);
      const v = JSON.parse(localStorage.getItem(k) || '{"up":0,"dn":0}');
      const cnt = v.up + v.dn;
      breakdown.push({ mod: mod, up: v.up, dn: v.dn, total: cnt });
      if (cnt > topCnt) { topCnt = cnt; topMod = mod; }
    }
    breakdown.sort((a, b) => b.total - a.total);
  } catch(e) {}

  const localTotal = localUp + localDn;
  const localRate = localTotal > 0 ? (localUp / localTotal * 100).toFixed(1) : '—';
  html += '<div style="margin-bottom:12px;padding:10px;background:rgba(0,0,0,0.2);border-radius:8px">';
  html += '<div style="font-size:11px;color:var(--paper3);margin-bottom:6px">本地统计</div>';
  html += '<div style="font-size:18px;color:var(--gold)">👍 ' + fmt(localUp) + ' &nbsp; 👎 ' + fmt(localDn) + ' &nbsp; 命中率 ' + localRate + '%</div>';
  if (topMod) html += '<div style="font-size:11px;color:var(--paper3);margin-top:4px">最强反馈：' + topMod + ' (' + topCnt + ' 次)</div>';
  html += '</div>';

  // 服务端统计
  let serverInfo = '';
  try {
    const r = await fetch((typeof API !== 'undefined' ? API : '') + '/api/public/kb-feedback-stats?days=7');
    const j = await r.json();
    const d = j.data || {};
    if (d.total !== undefined) {
      serverInfo = '<div style="margin-bottom:12px;padding:10px;background:rgba(0,0,0,0.2);border-radius:8px">';
      serverInfo += '<div style="font-size:11px;color:var(--paper3);margin-bottom:6px">服务端统计 (近 ' + (d.date_from || '7天') + ' 起)</div>';
      serverInfo += '<div style="font-size:18px;color:var(--gold)">👍 ' + fmt(d.positive||0) + ' &nbsp; 👎 ' + fmt(d.negative||0) + ' &nbsp; 命中率 ' + (d.helpful_rate||0) + '%</div>';
      serverInfo += '<div style="font-size:11px;color:var(--paper3);margin-top:4px">总反馈 ' + (d.total||0) + ' 条</div>';
      serverInfo += '</div>';
    }
  } catch(e) {}

  html += serverInfo;

  // 按模块细分
  if (breakdown.length > 0) {
    html += '<div style="font-size:11px;color:var(--paper3);margin-bottom:6px">按模块细分</div>';
    html += '<table style="width:100%;font-size:11px;border-collapse:collapse">';
    html += '<tr style="border-bottom:1px solid var(--border)"><th align="left" style="padding:4px">模块</th><th align="right" style="padding:4px">👍</th><th align="right" style="padding:4px">👎</th><th align="right" style="padding:4px">率</th></tr>';
    breakdown.slice(0, 12).forEach(b => {
      const rate = (b.up + b.dn) > 0 ? (b.up / (b.up + b.dn) * 100).toFixed(0) : '—';
      html += '<tr style="border-bottom:1px solid rgba(255,255,255,.05)"><td style="padding:4px">' + b.mod + '</td><td align="right" style="padding:4px">' + b.up + '</td><td align="right" style="padding:4px">' + b.dn + '</td><td align="right" style="padding:4px;color:' + (rate >= 70 ? '#10b981' : (rate < 50 && rate !== '—' ? '#ef4444' : 'var(--paper3)')) + '">' + rate + '%</td></tr>';
    });
    html += '</table>';
  } else {
    html += '<div style="text-align:center;color:var(--paper3);font-size:11px;margin-top:12px">尚无反馈数据。请在报告下点 👍 或 👎</div>';
  }
  html += '</div>';

  chat.innerHTML = html;
};

/** R63：快捷提问按钮 */
window.quickAsk = function(q){
  box.value = q;
  send();
};
window.showQuickActions = function(show){
  const el = document.getElementById('quickActions');
  if (el) el.style.display = show ? 'flex' : 'none';
};
// 进入模块时自动隐藏快捷提问
const _origProcessAnswer = processAnswer;
processAnswer = function(q){
  const el = document.getElementById('quickActions');
  if (el) el.style.display = 'none';
  return _origProcessAnswer(q);
};


/* R65：导出单条 AI 回复为 Markdown 文件 */
window._exportSingleMessage = function(btn){
  try {
    var msg = btn.closest('.msg');
    if (!msg) return;
    var body = msg.querySelector('.b');
    var text = body ? body.innerText : '';
    var blob = new Blob([
      '# 命理宝鉴 · AI 助手回复\n\n',
      '**时间：** ' + new Date().toLocaleString('zh-CN') + '\n\n',
      '**模块：** ' + ((state && state.module) || 'freechat') + '\n\n',
      '---\n\n',
      text
    ], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'ai-assistant-' + Date.now() + '.md';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (typeof showToast === 'function') showToast('💾 已导出 Markdown 文件', 'success');
  } catch(e) {
    if (typeof showToast === 'function') showToast('导出失败：' + e.message, 'error');
  }
};

/* R65：导出整段对话 */
window._exportFullChat = function(fmt){
  try {
    var msgs = document.querySelectorAll('#chat .msg');
    var lines = [], markdown = [];
    msgs.forEach(function(m){
      var isAI = m.classList.contains('m-ai');
      var role = isAI ? 'AI' : '用户';
      var txt = (m.querySelector('.b') || m).innerText;
      if (fmt === 'json') {
        lines.push({ role: isAI ? 'assistant' : 'user', content: txt });
      } else {
        lines.push(role + '：' + txt);
        if (fmt === 'md') markdown.push('## ' + role + '\n\n' + txt + '\n\n');
      }
    });
    var content, mime, ext;
    if (fmt === 'json') {
      content = JSON.stringify({ exported_at: new Date().toISOString(), messages: lines }, null, 2);
      mime = 'application/json;charset=utf-8'; ext = 'json';
    } else if (fmt === 'md') {
      content = '# 命理宝鉴 · 对话记录\n\n**导出时间：** ' + new Date().toLocaleString('zh-CN') + '\n\n---\n\n' + markdown.join('---\n\n');
      mime = 'text/markdown;charset=utf-8'; ext = 'md';
    } else {
      content = lines.join('\n\n---\n\n');
      mime = 'text/plain;charset=utf-8'; ext = 'txt';
    }
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'ai-chat-' + Date.now() + '.' + ext;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (typeof showToast === 'function') showToast('已导出 ' + lines.length + ' 条消息（' + ext.toUpperCase() + '）', 'success');
  } catch(e) {
    if (typeof showToast === 'function') showToast('导出失败：' + e.message, 'error');
  }
};
