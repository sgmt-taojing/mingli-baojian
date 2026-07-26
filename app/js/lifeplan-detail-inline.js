
const STAGES = [
  {key:'preschool',name:'学龄前',range:'0-6岁',focus:['先天','亲子','健康'],
   template:{xueye:'蒙学兴趣班（语言·音乐·绘画·体能）',zhiye:'职业体验日（医院·学校·消防·农场）',caiyun:'金钱概念认知（转卖零食·存钱罐）',hunyin:'社交交往演练（问候·分享·规则）',jiankang:'均衡营养 + 充足睡眠（10小时）',chengshi:'公园·图书馆·动物园常去',fengwu:'四季物候观察（花鸟鱼虫·节令）',xiuyang:'古典音乐听赏（宫羽音·4小时/周）',renmai:'亲子+同伴社交圈（5-8人稳定）',chuangye:'小商业启蒙（跳蚤市场·手工坊）',yanglao:'祖辈互动（请家中老人讲故事）',chuancheng:'家谱/姓氏故事（记住4代名字）'}},
  {key:'school',name:'小学中学',range:'7-17岁',focus:['学习','品德','兴趣'],
   template:{xueye:'学科主课+1门专长（25%+ 主课量）',zhiye:'职业探索讲座（每学期 1-2 场）',caiyun:'零花钱+理财记账（月度复盘）',hunyin:'同伴友谊维护+恋爱观萌芽',jiankang:'运动习惯定型（30分/天）',chengshi:'家乡周边行万里路（年 2 次）',fengwu:'历史/博物馆参访（学期 1 次）',xiuyang:'读书笔记·书法·一件乐器',renmai:'同学圈+师长资源（10-20人）',chuangye:'校园微创业（社团·项目·比赛）',yanglao:'助老/敬老志愿（学期 1 次）',chuancheng:'家族行业初了解（父母工种）'}},
  {key:'university',name:'大学',range:'18-23岁',focus:['专业','社交','实践'],
   template:{xueye:'专业深耕 + 跨学科辅修/考证',zhiye:'行业实习 2 段（寒暑假各 1）',caiyun:'个人理财起步（指数/定投·规划）',hunyin:'亲密关系实战（含分手复盘）',jiankang:'作息节律锁定 + 运动专长',chengshi:'一线/新一线·三年规划（毕业定锚）',fengwu:'城市人文深度游（街区+老字号）',xiuyang:'读经典·写文章·学一门外语',renmai:'导师+同窗+行业校友（30人脉）',chuangye:'尝试1次创业实操（摆摊·轻量）',yanglao:'探望长辈·接触老龄议题',chuancheng:'立家训·明确个人使命陈述'}},
  {key:'career',name:'职场+婚恋',range:'24-65岁',focus:['事业','婚恋','健康'],
   template:{xueye:'在读硕博/考证/终身学习（年 1 证）',zhiye:'5 年职业三跳（稳·升·创各 1）',caiyun:'攻守理财（股·债·保·房）',hunyin:'婚姻经营 + 子女教育规划',jiankang:'每年深度体检+运动习惯',chengshi:'安居城市挑选（宜居+子女教育）',fengwu:'名山大川·风景名胜（年 1-2 处）',xiuyang:'静心修行（禅·茶·琴·书各 1）',renmai:'圈层重塑（同领域 30 人+跨领域 10）',chuangye:'二次创业评估（30/40/50 节点）',yanglao:'45 岁起筹备养老金（社保+商保+投资）',chuancheng:'家风传承·著作/家训'}}
];
const DOMAINS = [
  {key:'xueye',name:'学业',icon:'📚'},
  {key:'zhiye',name:'职业',icon:'💼'},
  {key:'caiyun',name:'财运',icon:'💰'},
  {key:'hunyin',name:'婚姻',icon:'💕'},
  {key:'jiankang',name:'健康',icon:'💊'},
  {key:'chengshi',name:'城市',icon:'🏙️'},
  {key:'fengwu',name:'风物',icon:'🏔️'},
  {key:'xiuyang',name:'修养',icon:'🎋'},
  {key:'renmai',name:'人脉',icon:'🤝'},
  {key:'chuangye',name:'创业',icon:'🚀'},
  {key:'yanglao',name:'养老',icon:'🌳'},
  {key:'chuancheng',name:'传承',icon:'🎁'},
  {key:'jiangxiu',name:'享福',icon:'🌸'}
];
const WUXING_KW = {'金':['理财','金融','法律'],'木':['学习','成长','教育'],'水':['智慧','思考','学术'],'火':['创业','激情','表达'],'土':['稳健','养老','健康']};

function generate(){
  const btn=document.getElementById('genBtn');
  btn.disabled=true; btn.textContent='⏳ 生成中...';
  setTimeout(()=>{
    try{
      const age=parseInt(document.getElementById('lAge').value)||30;
      const sex=document.getElementById('lSex').value;
      const residence=document.getElementById('lResidence').value.trim();
      const focus=(document.getElementById('lFocus').value||'').trim();
      const extra=(document.getElementById('lExtra').value||'').trim();
      const userText = extra+' '+focus;
      const stageKey = age<=6?'preschool':age<=17?'school':age<=23?'university':'career';
      const stage = STAGES.find(s=>s.key===stageKey);

      const domainScores = DOMAINS.map(d=>{
        let base=60;
        if(stage.focus.some(f=>d.name.includes(f)||f.includes(d.name))) base+=15;
        if(d.key==='jiankang'&&age>=35) base-=10;
        if(d.key==='chuangye'&&age>=24&&age<=40) base+=10;
        if(d.key==='yanglao'&&age>=50) base+=15;
        if(d.key==='xueye'&&age<24) base+=15;
        for(const [wx,kws] of Object.entries(WUXING_KW)){
          if(kws.some(k=>userText.includes(k))){
            if(d.key==='caiyun'&&wx==='金') base+=5;
            if(d.key==='xueye'&&wx==='木') base+=5;
            if(d.key==='chuangye'&&wx==='火') base+=5;
            if(d.key==='yanglao'&&wx==='土') base+=5;
          }
        }
        const final=Math.max(30,Math.min(95,base));
        return {key:d.key,name:d.name,icon:d.icon,score:final,status:final>=75?'优':final>=60?'良好':'有潜力'};
      });

      const next5 = [
        {y:age+1,t:'夯实基期：阶段核心理能强化，适合学习积累'},
        {y:age+2,t:'试错期：阶段突破、探索不同方向'},
        {y:age+3,t:'中期步进期：目标聚焦、协会/导师对话'},
        {y:age+4,t:'中期证果期：阶段成果转位'},
        {y:age+5,t:'中期导启期：下一阶段起点梳理'}
      ];
      const fiveYearAdvice = age<30?'启始期，重点在✍️学业 🤝人脉 建节奏':age<50?'进取期，重点在💼事业 💰财运 💕婚恋':'守成期，重点在💊健康 🏙️城市 🎁传承';

      render({age,sex,residence,focus,extra,stage,stageTemplate:stage.template,domainScores,next5,fiveYearAdvice});
      btn.disabled=false; btn.textContent='🔄 重新生成';
    }catch(e){
      alert('生成失败：'+e.message);
      btn.disabled=false; btn.textContent='✨ 生成蓝图';
    }
  }, 250);
}

function render(d){
  const summary = `${d.age}岁属${d.stage.name}（${d.stage.range}），本阶段重点：${d.stage.focus.join('、')}。依据命数起步，未来 5 年${d.fiveYearAdvice}。请每月复盘调整。`;
  let h='<div class="banner"><div class="age">'+d.age+'</div><div class="stage">'+d.stage.name+' · '+d.stage.range+'</div><div class="focus">重点：'+d.stage.focus.join(' · ')+'</div></div>';

  // 12 领域
  h+='<div class="card"><h2>🎯 12 领域矩阵</h2><div class="doms">';
  d.domainScores.forEach(s=>{
    h+='<div class="dom"><div class="ico">'+s.icon+'</div><div class="nm">'+s.name+'</div><div class="num">'+s.score+'</div><div class="bar"><div class="bar-fill" style="width:'+s.score+'%"></div></div><div class="st">'+s.status+'</div></div>';
  });
  h+='</div></div>';

  // 48 子项模板（R41-B）—— 本阶段 12 领域细化动作
  if(d.stageTemplate){
    h+='<div class="card"><h2>📋 本阶段 48 子项模板</h2><div class="st-list">';
    Object.entries(d.stageTemplate).forEach(([dk, dv])=>{
      const dom = d.domainScores.find(x => x.key === dk);
      h+='<div class="st-row"><span class="st-ico">'+(dom?dom.icon:'•')+'</span><b>'+(dom?dom.name:dk)+'</b><span class="st-action">'+dv+'</span></div>';
    });
    h+='</div></div>';
  }

  // 时间轴 R25-P1-4：10 段×(核心任务/关键风险/化解建议)+高亮当前段
  // R39: 每段附图谱关联模块
  const STAGE_KB_MAP = {
    0:  [{mod:'nihaisha',name:'中医育儿'},{mod:'bazi',name:'先天体质'}],
    10: [{mod:'bazi',name:'学业文昌'},{mod:'ziwei',name:'紫微人格'}],
    20: [{mod:'bazi',name:'事业定位'},{mod:'qimen',name:'奇门决策'}],
    30: [{mod:'bazi',name:'婚姻六亲'},{mod:'fengshui',name:'家居风水'}],
    40: [{mod:'zhongyi',name:'养生调理'},{mod:'bazi',name:'中年大运'}],
    50: [{mod:'zhongyi',name:'经络养生'},{mod:'faith',name:'信仰修心'}],
    60: [{mod:'zhongyi',name:'太极养生'},{mod:'scripture',name:'经文诵读'}],
    70: [{mod:'faith',name:'心灵导引'},{mod:'scripture',name:'往生净土'}],
    80: [{mod:'zhongyi',name:'延年益寿'},{mod:'faith',name:'安宁祈福'}],
    90: [{mod:'faith',name:'圆满善终'},{mod:'scripture',name:'超度往生'}]
  };
  h+='<div class="card"><h2>📅 人生时间轴（10 段·每 10 岁）</h2><div class="tl">';
  const ts=[
    {a:'0-10',num:0,t:'婴幼儿·先天奠基期',f:'先天体质 + 亲子依恋 + 蒙昧启蒙',core:'🏥 健康打底：母乳/充足睡眠/疫苗/体检',risk:'⚠ 脾胃弱/易惊风/亲子缺失',advice:'✦ 规律作息 + 父母陪伴 + 忌过早学业'},
    {a:'10-20',num:10,t:'少年·立志求学期',f:'学业奠基 + 品德塑型 + 兴趣萌芽',core:'📚 学业为重：方法/习惯/阅读量',risk:'⚠ 叛逆/网瘾/近视/早恋困扰',advice:'✦ 运动 30 分/天 + 经典阅读 + 师长引导'},
    {a:'20-30',num:20,t:'青年·定位起步期',f:'专业深耕 + 人脉拓展 + 婚恋探索',core:'💼 选对行业/跟对师傅 + 储蓄起步',risk:'⚠ 频繁跳槽/月光/熬夜伤身',advice:'✦ 每年存款≥20% + 年度体检 + 深度学习'},
    {a:'30-40',num:30,t:'而立·事业成家期',f:'事业精进 + 婚姻经营 + 子女教育',core:'🏠 立业成家：事业护城河 + 婚姻保鲜',risk:'⚠ 三高/婚姻倦怠/亲子疏离/房贷压力',advice:'✦ 夫妻季度复盘 + 每年深度体检 + 资产配置'},
    {a:'40-50',num:40,t:'不惑·稳固深耕期',f:'事业巅峰 + 财富积累 + 健康管理',core:'📈 事业深耕/二次创业评估 + 投资多元化',risk:'⚠ 中年危机/健康拐点/父母养老',advice:'✦ 减重控压 + 心理咨询 + 父母医疗预案'},
    {a:'50-60',num:50,t:'知天命·收获传承期',f:'财务自由 + 家风传承 + 半退休',core:'🎁 传承规划：家训/遗嘱/子女接班',risk:'⚠ 退休焦虑/慢性病/空巢',advice:'✦ 培养兴趣 + 公益参与 + 孙辈陪伴'},
    {a:'60-70',num:60,t:'耳顺·颐养天年期',f:'身心修养 + 含饴弄孙 + 社交活跃',core:'🌿 养生为主：太极/园艺/书法/旅游',risk:'⚠ 退化性疾病/跌倒/孤独',advice:'✦ 每日散步 + 定期体检 + 社区活动'},
    {a:'70-80',num:70,t:'从心·静心宁神期',f:'心性圆满 + 回顾人生 + 家族纽带',core:'🧘 心灵修行：回忆录/家书/信仰',risk:'⚠ 记忆衰退/失能/丧偶之痛',advice:'✦ 脑力训练 + 家人探望 + 专业照护'},
    {a:'80-90',num:80,t:'耄耋·寿元延长期',f:'延长寿元 + 专业护理 + 精神慰藉',core:'🏥 专业护理：防跌/营养/慢病管理',risk:'⚠ 跌倒/感染/认知障碍',advice:'✦ 居家适老改造 + 营养均衡 + 日间陪伴'},
    {a:'90-100',num:90,t:'期颐·天年圆满期',f:'善终准备 + 家族祭祀 + 精神遗产',core:'🙏 圆满善终：遗嘱/法事/家族根脉',risk:'⚠ 器官衰竭/临终痛苦',advice:'✦ 安宁疗护 + 家属心理支持 + 尊重意愿'}
  ];
  const curDecade=Math.floor(d.age/10)*10;
  ts.forEach(t=>{
    const isCurrent = t.num===curDecade;
    h+='<div class="tl-row'+(isCurrent?' current':'')+'">';
    h+='<div class="tl-age">'+t.a+(isCurrent?'<div class="tl-now-badge">当前</div>':'')+'</div>';
    h+='<div class="tl-info"><b>'+t.t+'</b><small>'+t.f+'</small>';
    h+='<div class="tl-core">'+t.core+'</div>';
    h+='<div class="tl-risk">'+t.risk+'</div>';
    h+='<div class="tl-advice">'+t.advice+'</div>';
    // R39: 图谱关联模块
    const stageKbs = STAGE_KB_MAP[t.num] || [];
    if (stageKbs.length) {
      h+='<div class="tl-kb" style="margin-top:6px;padding:6px 8px;background:rgba(108,138,255,.08);border-left:2px solid #6c8aff;border-radius:4px;font-size:11px">📚 本阶段重点 KB：';
      h+=stageKbs.map(k => '<a href="kb-graph.html?focus='+k.mod+'" style="color:var(--accent);text-decoration:none;margin-right:8px">🔗 '+k.name+'</a>').join('');
      h+='</div>';
    }
    h+='</div></div>';
  });
  h+='<div class="kb-source" style="margin-top:8px">📜 基于发展心理学 + 中医养生学 + 命理学十年大运综合编制</div></div>';

  // 未来 5 年建议 R25-P1-4 增强
  h+='<div class="card"><h2>🔮 未来 5 年建议（'+d.age+'→'+(d.age+5)+' 岁）</h2><div class="fy">';
  const focusDomain = d.domainScores.sort((a,b)=>a.score-b.score)[0];
  const strongDomain = d.domainScores.sort((a,b)=>b.score-a.score)[0];
  d.next5.forEach((p,i)=>{
    const yearAge = d.age+i+1;
    const yearTip = i===0?'📌 即时行动':i===1?'🔍 试错探索':i===2?'🎯 聚焦突破':i===3?'📊 成果检验':'🔄 总结迭代';
    h+='<div class="fy-row" style="flex-direction:column;align-items:flex-start;gap:4px;padding:10px 14px"><div style="display:flex;width:100%;justify-content:space-between;align-items:center"><span class="fy-y">'+yearAge+' 岁</span><span style="font-size:10px;opacity:.6">'+yearTip+'</span></div><span style="font-size:13px;line-height:1.6">'+p.t+'</span></div>';
  });
  h+='<div class="summary" style="margin-top:10px"><b style="color:var(--gold)">⚡ 重点补强：</b>'+focusDomain.name+'（'+focusDomain.score+'分）<br><b style="color:var(--gold)">💪 优势放大：</b>'+strongDomain.name+'（'+strongDomain.score+'分）<br>'+d.fiveYearAdvice+'</div></div>';

  // 行动清单 R25-P1-4 动态生成（基于年龄/阶段/领域评分）
  const weakDomains = [...d.domainScores].sort((a,b)=>a.score-b.score).slice(0,3);
  const strongDomains = [...d.domainScores].sort((a,b)=>b.score-a.score).slice(0,2);
  const ns=[];
  ns.push(`【1】制定 ${d.age+1} 年度核心目标：${d.stage.focus[0]}方向 3 个 OKR`);
  ns.push(`【2】补强弱项：${weakDomains[0].name}（${weakDomains[0].score}分）→ 每周投入 3 小时`);
  ns.push(`【3】补强弱项：${weakDomains[1].name}（${weakDomains[1].score}分）→ 找 1 位导师/教练`);
  if(d.age>=24 && d.age<=50) ns.push(`【4】财务护城河：应急金≥6个月支出 + 年储蓄率≥20%`);
  else if(d.age<24) ns.push(`【4】学会理财：开立独立账户 + 月度记账 + 定投指数基金`);
  else ns.push(`【4】养老规划：社保+商保双轨 + 遗嘱/信托准备`);
  ns.push(`【5】健康管理：每年深度体检 + 每周运动 3-5 次（每次≥30 分钟）`);
  ns.push(`【6】婚恋/家庭：${d.age<24?'与父母每月深度交流 1 次':d.age<40?'与伴侣每季沟通 1 次+子女每周陪伴≥6 小时':'家庭聚会每月 1 次+孙辈互动'}`);
  ns.push(`【7】优势放大：${strongDomains[0].name}（${strongDomains[0].score}分）→ 考证/输出/教学`);
  ns.push(`【8】人脉经营：参加 1 个行业社群 + 每月主动链接 2 位高人`);
  ns.push(`【9】学习充电：每年读 ${d.age<24?'12':d.age<50?'8':'6'} 本书 + 1 门新课/技能`);
  ns.push(`【10】年度复盘：年末写 1 篇总结 + 制定下一年 OKR + 5 年路线图更新`);
  h+='<div class="card"><h2>✅ 行动清单（10 条·动态生成）</h2><ol class="ol">';
  ns.forEach(s=>h+='<li>'+s+'</li>');
  h+='</ol>';
  h+='<div class="summary" style="margin-top:10px;font-size:11px"><b style="color:var(--gold)">💡 补强优先级：</b>'+weakDomains.map(d=>d.name+'('+d.score+')').join(' → ')+'</div></div>';

  // 总评
  h+='<div class="card"><h2>📜 总评</h2><div class="summary">'+summary+'</div></div>';


  // ===== 第二十一轮·R3·大运流年 + 时辰补强 + 趋吉避凶 =====
  const userBaziForLife = (()=>{try{return JSON.parse(localStorage.getItem('qianyuan_user_bazi'));}catch(e){return null;}})();
  const dayEle = userBaziForLife?.dayEle || '土';
  const dayStem = userBaziForLife?.dayStem || '戊';
  const shengMap={'木':'火','火':'土','土':'金','金':'水','水':'木'};
  const keMap={'木':'土','土':'水','水':'火','火':'金','金':'木'};
  const ELE_LOC={'木':'东','火':'南','土':'中央','金':'西','水':'北'};

  // ===== 大运流年起伏引擎（依《三命通会》《滴天髓》《子平真诠》） =====
  function calcDayunFluctuation(currentAge){
    // 起运年龄简算：男阳/女阴=出生日到节令天数÷3，女阳/男阴相反
    const sex = d.sex;
    const startYunAge = 3; // 简化为 3 岁起运
    const dayuns = [];
    let curStem = dayStem;
    const STEMS=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    const ELE_BY_STEM={'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
    for(let i=0;i<10;i++){
      const ageStart = startYunAge + i*10;
      if(ageStart > currentAge + 50) break;
      const ageEnd = ageStart + 9;
      // 简化：每 10 年天干顺延一位
      curStem = STEMS[(STEMS.indexOf(curStem)+1)%10];
      const dayunStem = curStem;
      const dayunEle = ELE_BY_STEM[dayunStem];
      // 大运评分：与命主日干的关系
      let score = 60;
      const rel = [];
      if(dayunEle === dayEle){score += 10; rel.push('比肩·稳健');}
      else if(shengMap[dayEle]===dayunEle){score += 18; rel.push('食伤·生旺·宜进');}
      else if(shengMap[dayunEle]===dayEle){score += 22; rel.push('印绶·贵人·宜学');}
      else if(keMap[dayEle]===dayunEle){score -= 15; rel.push('财星·破耗·慎财');}
      else if(keMap[dayunEle]===dayEle){score -= 22; rel.push('官杀·压力·宜稳');}
      // 大运阶段额外加权
      if(ageStart>=18 && ageStart<=40 && score>=70) score += 5;
      if(ageStart>=50 && score<55) score -= 5;
      score = Math.max(15, Math.min(95, score));
      dayuns.push({ageStart,ageEnd,stem:dayunStem,ele:dayunEle,score,rel,isNow:currentAge>=ageStart&&currentAge<=ageEnd});
    }
    return dayuns;
  }

  // ===== 12 时辰补强引擎（依《十二时辰养生》《黄帝内经》《易经·十二辟卦》） =====
  function calcShichenBoost(currentEle){
    const shengMap={'木':'火','火':'土','土':'金','金':'水','水':'木'};
    const keMap={'木':'土','土':'水','水':'火','火':'金','金':'木'};
    const ZHI_WX={'子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'};
    const ZHI_TIME={'子':'23-01','丑':'01-03','寅':'03-05','卯':'05-07','辰':'07-09','巳':'09-11','午':'11-13','未':'13-15','申':'15-17','酉':'17-19','戌':'19-21','亥':'21-23'};
    const ZHI_METHOD={
      '子':{ability:'思考·决断',method:'宜静思·定计划·忌争吵·喝温水'},
      '丑':{ability:'脾胃·深睡',method:'深度睡眠·修复脾胃·避免熬夜'},
      '寅':{ability:'肺活·起步',method:'起床深呼吸·叩齿吞津·晨练太极'},
      '卯':{ability:'肝血·专注',method:'高强度工作·阅读·避免饮酒'},
      '辰':{ability:'脾胃·早餐',method:'温热早餐·慢咀嚼·忌冷饮'},
      '巳':{ability:'心脑·高效',method:'重要会议·决策·效率巅峰·午休小憩'},
      '午':{ability:'心火·社交',method:'人际交往·签约·午饭七分饱·午睡'},
      '未':{ability:'脾胃·分养',method:'茶饮·阅读·忌油腻·散步助消化'},
      '申':{ability:'肺气·表达',method:'演讲·谈判·运动·呼吸训练'},
      '酉':{ability:'肺肾·收藏',method:'晚饭清淡·散步·冥想·收纳整理'},
      '戌':{ability:'心包·愉悦',method:'家庭聚会·阅读·忌剧烈运动'},
      '亥':{ability:'三焦·休眠',method:'准备入睡·泡脚·听轻音乐·忌看手机'}
    };
    const cells=[];
    Object.entries(ZHI_WX).forEach(([zhi,wx])=>{
      const time = ZHI_TIME[zhi];
      let status='flat',tag='',rel='';
      if(wx === currentEle){status='boost';tag='同气';rel='同我·平顺';}
      else if(shengMap[currentEle]===wx){status='boost';tag='我生';rel='食伤·释放能量';}
      else if(shengMap[wx]===currentEle){status='boost';tag='生我';rel='印绶·贵人·补强';}
      else if(keMap[currentEle]===wx){status='weak';tag='我克';rel='财星·耗我·慎决';}
      else if(keMap[wx]===currentEle){status='weak';tag='克我';rel='官杀·压力·守势';}
      cells.push({time,zhi,wx,status,tag,rel,ability:ZHI_METHOD[zhi].ability,method:ZHI_METHOD[zhi].method});
    });
    return cells;
  }

  // ===== 趋吉避凶引擎（依《穷通宝鉴》《三命通会》《月谈赋》） =====
  
/* ===== 第二十四轮·流月流日引擎 ===== */
function calcLiuyueScore(currentAge, dayStem, dayEle){
  const MONTH_ZHI = ['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'];
  const now = new Date();
  const curMonth = now.getMonth();
  const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  // 五虎遁年起月
  const TIGER_MAP = {0:2,5:2, 1:4,6:4, 2:6,7:6, 3:8,8:8, 4:0,9:0};
  const yr = now.getFullYear();
  const yrStemIdx = (yr - 4) % 10;
  const startStemIdx = TIGER_MAP[yrStemIdx];
  const SHENG_MAP = {木:'火',火:'土',土:'金',金:'水',水:'木'};
  const KE_MAP = {木:'土',火:'金',土:'水',金:'木',水:'火'};
  const ELE_BY_STEM = {甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
  const ZHI_WX = {子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'};
  const MONTH_NAMES = ['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];

  return MONTH_ZHI.map((zhi, i)=>{
    const stemIdx = (startStemIdx + i) % 10;
    const stem = STEMS[stemIdx];
    const stemEle = ELE_BY_STEM[stem];
    const zhiEle = ZHI_WX[zhi];

    let score = 60;
    let relation = '平';
    if(stemEle === dayEle){ score += 10; relation='比肩'; }
    else if(SHENG_MAP[dayEle] === stemEle){ score += 22; relation='印绶（吉）'; }
    else if(stemEle === SHENG_MAP[dayEle]){ score += 18; relation='食伤（泄秀）'; }
    else if(KE_MAP[dayEle] === stemEle){ score -= 15; relation='财星（破耗）'; }
    else if(stemEle === KE_MAP[dayEle]){ score -= 22; relation='官杀（压力）'; }
    if(zhiEle === dayEle) score += 5;

    score = Math.max(20, Math.min(99, score));
    const level = score >= 70 ? '吉' : (score < 55 ? '凶' : '平');
    const advice = score >= 70 ? '可谋大事·进取有功' : (score < 55 ? '宜守不宜攻·修身养性' : '稳中求进·顺势而为');

    return {
      monthName: MONTH_NAMES[i],
      stem, branch: zhi,
      score, level, relation,
      reason: monthReasons(i),
      advice,
      isNow: i === curMonth
    };
  });
}

function monthReasons(idx){
  const r = ['寅月木旺·正月建生','卯月木极·仲春生气','辰月土湿·季春库开','巳月火初·孟夏火苗','午月火极·仲夏阳盛','未月土燥·季夏养金','申月金锐·孟秋肃杀','酉月金极·仲秋收成','戌月土藏·季秋库收','亥月水生·孟冬阳藏','子月水极·仲冬阴盛','丑月土冻·季冬守藏'];
  return r[idx] || '月令转换';
}

function calcLiuriScore(dayStem, dayEle){
  const now = new Date();
  const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const ZHIS = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const SHENG_MAP = {木:'火',火:'土',土:'金',金:'水',水:'木'};
  const KE_MAP = {木:'土',火:'金',土:'水',金:'木',水:'火'};
  const ELE_BY_STEM = {甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
  const ZHI_WX = {子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'};

  const baseStemIdx = 0; // 2026-07-22 = 甲辰
  const baseZhiIdx = 4;
  const baseDate = new Date('2026-07-22');

  const out = [];
  for(let i=0;i<30;i++){
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    const stemIdx = (baseStemIdx + i) % 10;
    const zhiIdx = (baseZhiIdx + i) % 12;
    const stem = STEMS[stemIdx];
    const zhi = ZHIS[zhiIdx];
    const stemEle = ELE_BY_STEM[stem];
    const zhiEle = ZHI_WX[zhi];

    let score = 60;
    let relation = '平';
    if(stemEle === dayEle){ score += 10; relation='比肩'; }
    else if(SHENG_MAP[dayEle] === stemEle){ score += 22; relation='印绶（吉）'; }
    else if(stemEle === SHENG_MAP[dayEle]){ score += 18; relation='食伤（泄秀）'; }
    else if(KE_MAP[dayEle] === stemEle){ score -= 15; relation='财星（破耗）'; }
    else if(stemEle === KE_MAP[dayEle]){ score -= 22; relation='官杀（压力）'; }
    if(zhiEle === dayEle) score += 5;

    score = Math.max(20, Math.min(99, score));
    const level = score >= 70 ? '吉' : (score < 55 ? '凶' : '平');
    const event = score >= 70 ? '签约·求财·婚嫁' : (score < 55 ? '远行·签约·动土' : '守常·小事可谋');

    out.push({
      day: d.getDate(),
      date: d.toISOString().slice(5,10),
      stem, branch: zhi,
      score, level, relation, event,
      advice: score >= 70 ? '把握良机·果断进取' : (score < 55 ? '静观其变·内省守成' : '顺势而为·稳中求进'),
      isToday: d.toDateString() === now.toDateString()
    });
  }
  return out;
}

function calcTrendAdvice(dayuns, shichen){
    const now = dayuns.find(x=>x.isNow);
    if(!now) return '';
    const ups = dayuns.filter(x=>x.score>=70);
    const downs = dayuns.filter(x=>x.score<55);
    const avgScore = Math.round(dayuns.reduce((s,x)=>s+x.score,0)/dayuns.length);
    const curScore = now.score;
    let trend = '';
    let phase = '';
    if(curScore>=75) {trend='大运当头，宜大展宏图'; phase='吉期·进取';}
    else if(curScore>=65) {trend='运势稳健，宜守成扩展'; phase='平顺·守成';}
    else if(curScore>=55) {trend='运程偏弱，宜守不妄动'; phase='潜伏·蛰伏';}
    else {trend='运程低伏，宜静修化煞'; phase='低谷·化解';}
    // 建议方向
    const goodDir = ELE_LOC[shengMap[dayEle]] || '东方';
    const badDir = ELE_LOC[keMap[dayEle]] || '西方';
    // 化煞物品（从 R20 联动）
    const itemMap={'木':'🗼 文昌塔 / 🌿 绿植','火':'🖼️ 山水画 / 🐯 老虎画','土':'🎃 葫芦 / 🙏 佛像','金':'🪞 镜子 / 🏺 金属摆件','水':'🐟 鱼缸 / 🧊 冰箱'};
    return {
      trend, phase, avgScore, curScore, goodDir, badDir,
      upsCount:ups.length, downsCount:downs.length,
      recItem:itemMap[dayEle],
      recommendAge:dayuns.reduce((best,x)=>x.score>best.score?x:best,dayuns[0])
    };
  }

  // ===== 渲染大运 + 时辰 + 趋吉避凶 =====
  const dayuns = calcDayunFluctuation(d.age);
  const shichen = calcShichenBoost(dayEle);
  const trend = calcTrendAdvice(dayuns, shichen);


  // ===== 第二十四轮·R24·流月流日精度补强 =====
  const liuyue = calcLiuyueScore(d.age, dayStem, dayEle);
  const liuri = calcLiuriScore(dayStem, dayEle);
  h+='<div class="card"><h2>🌙 流月起伏图（12 月·年内节奏）</h2>';
  h+='<div class="ly-track">';
  liuyue.forEach(m=>{
    const cls = m.isNow?'lg-now':(m.score>=70?'lg-up':(m.score<55?'lg-down':'lg-flat'));
    h+='<div class="ly-cell '+cls+'" title="'+m.monthName+'·'+m.stem+m.branch+'·'+m.score+'分·'+m.reason+'"><div class="ly-m">'+m.monthName+'</div><div class="ly-s">'+m.score+'</div></div>';
  });
  h+='</div>';
  h+='<div class="ly-legend"><div><div class="dot" style="background:rgba(39,174,96,.5)"></div>吉月 ≥70</div><div><div class="dot" style="background:rgba(201,168,76,.4)"></div>平月 55-69</div><div><div class="dot" style="background:rgba(192,57,43,.5)"></div>凶月 <55</div><div><div class="dot" style="background:var(--gold)"></div>本月</div></div>';
  const curMonth = liuyue.find(m=>m.isNow) || liuyue[0];
  h+='<div class="ly-summary"><b>当前月：'+curMonth.monthName+'（'+curMonth.stem+curMonth.branch+'月）</b><br>';
  h+='· 月评分：<b>'+curMonth.score+'</b>/100（'+curMonth.level+'）<br>';
  h+='· 月干 '+curMonth.stem+' 与日主 '+dayStem+'：<b>'+curMonth.relation+'</b><br>';
  h+='· 月令：'+curMonth.reason+'<br>';
  h+='· 趋吉：'+curMonth.advice+'</div>';
  h+='</div>';

  h+='<div class="card"><h2>📅 流日吉凶（30 日·短期决策）</h2>';
  h+='<div class="lr-grid">';
  liuri.forEach(r=>{
    const cls = r.isToday?'lg-today':(r.score>=70?'lg-up':(r.score<55?'lg-down':'lg-flat'));
    h+='<div class="lr-cell '+cls+'" title="'+r.date+'·'+r.stem+r.branch+'·'+r.score+'分·'+r.event+'"><div class="lr-d">'+r.day+'</div><div class="lr-x">'+r.score+'</div></div>';
  });
  h+='</div>';
  h+='<div class="ly-legend"><div><div class="dot" style="background:rgba(39,174,96,.5)"></div>吉日 ≥70</div><div><div class="dot" style="background:rgba(201,168,76,.4)"></div>平日 55-69</div><div><div class="dot" style="background:rgba(192,57,43,.5)"></div>凶日 <55</div><div><div class="dot" style="background:var(--gold)"></div>今日</div></div>';
  const curDay = liuri.find(r=>r.isToday) || liuri[0];
  h+='<div class="lr-summary"><b>今日：'+curDay.date+'（'+curDay.stem+curDay.branch+'日）</b><br>';
  h+='· 日评分：<b>'+curDay.score+'</b>/100（'+curDay.level+'）<br>';
  h+='· 日干 '+curDay.stem+' 与日主 '+dayStem+'：<b>'+curDay.relation+'</b><br>';
  h+='· 适宜：<b>'+curDay.event+'</b><br>';
  h+='· 提醒：'+curDay.advice+'<br>';
  h+='· 未来 3 日：';
  for(let i=1;i<=3;i++){
    const nx = liuri[(liuri.indexOf(curDay)+i)%liuri.length];
    h+=nx.day+'日 <b>'+nx.score+'</b>分（'+nx.event+'）· ';
  }
  h+='</div>';
  h+='<div class="lf-source">📜《穷通宝鉴》《三命通会·流月篇》《流日篇》《子平真诠》《神峰通考》《卜筮正宗·流日》</div>';
  h+='</div>';

  // 大运起伏图
  h+='<div class="card"><h2>📈 大运流年起伏图（10 段·每段 10 年）</h2>';
  h+='<div class="dyun-track"><div class="dyun-row">';
  dayuns.forEach(u=>{
    const cls = u.isNow?'dyun-bar now':(u.score>=70?'dyun-bar up':(u.score<55?'dyun-bar down':'dyun-bar flat'));
    const height = Math.max(20, u.score*1.2);
    h+='<div class="'+cls+'"><div class="b" style="height:'+height+'px"></div><div class="a">'+u.ageStart+'</div><div class="n">'+u.stem+'</div></div>';
  });
  h+='</div></div>';
  h+='<div class="dyun-legend"><div class="lg lg-up"><div class="lgs"></div>大吉运 ≥70</div><div class="lg lg-flat"><div class="lgs"></div>平运 55-69</div><div class="lg lg-down"><div class="lgs"></div>低谷 <55</div></div>';
  // 当前大运详情
  const now = dayuns.find(x=>x.isNow);
  if(now){
    h+='<div class="dyun-now"><div class="dn-title">⚡ 当前大运：'+now.ageStart+'-'+now.ageEnd+' 岁（'+now.stem+'运·'+now.ele+'）</div>';
    h+='<div class="dn-score">'+now.score+' <span style="font-size:13px;opacity:.6">分</span></div>';
    h+='<div class="dn-desc">'+now.rel.join(' · ')+'</div>';
    h+='<div class="dn-tags">';
    if(now.score>=70) h+='<span class="dn-tag">✦ 大运当头</span><span class="dn-tag">宜大展宏图</span><span class="dn-tag">顺势而上</span>';
    else if(now.score>=65) h+='<span class="dn-tag">⚖ 稳健期</span><span class="dn-tag">守成扩展</span>';
    else if(now.score>=55) h+='<span class="dn-tag">🔄 潜伏期</span><span class="dn-tag">守势不妄</span>';
    else h+='<span class="dn-tag warn">⚠ 低谷期</span><span class="dn-tag warn">静修化煞</span>';
    h+='</div></div>';
  }
  h+='<div class="kb-source">📜 《三命通会》《滴天髓》《子平真诠》</div></div>';

  // 12 时辰补强
  h+='<div class="card"><h2>⏰ 12 时辰补强引擎（命主 '+dayStem+'日主·'+dayEle+'）</h2>';
  h+='<p style="font-size:11px;opacity:.6;margin:8px 0">基于命主五行喜忌·各时辰与命主关系·给出"何时做事+何时守势"建议</p>';
  h+='<div class="shichen-grid">';
  shichen.forEach(s=>{
    h+='<div class="shichen-cell '+s.status+'">';
    h+='<div class="sc-time">'+s.time+'</div>';
    h+='<div class="sc-zhi">'+s.zhi+'</div>';
    h+='<div class="sc-wx">'+s.wx+'行·'+s.rel+'</div>';
    if(s.tag) h+='<div class="sc-tag">'+s.tag+'</div>';
    h+='<div class="sc-method">'+s.method+'</div>';
    h+='</div>';
  });
  h+='</div>';
  h+='<div class="shichen-summary">';
  h+='<div class="ss-title">🎯 关键时辰运用</div>';
  h+='<div class="ss-item"><span class="ss-time">巳时（9-11）</span><span class="ss-ability">高效决策·开会</span><span class="ss-method">火气旺·思维敏捷</span></div>';
  h+='<div class="ss-item"><span class="ss-time">午时（11-13）</span><span class="ss-ability">社交·签约</span><span class="ss-method">心火旺·人际活跃</span></div>';
  h+='<div class="ss-item"><span class="ss-time">申时（15-17）</span><span class="ss-ability">表达·谈判</span><span class="ss-method">金气肃·言辞利</span></div>';
  h+='<div class="ss-item"><span class="ss-time">酉时（17-19）</span><span class="ss-ability">收纳·整理</span><span class="ss-method">收藏之气·准备归家</span></div>';
  h+='</div>';
  h+='<div class="kb-source">📜 《黄帝内经·十二时辰养生》《易经·十二辟卦》</div></div>';

  // 未来 5 年起伏（按当前大运 + 流年计算）
  const currentYear = new Date().getFullYear();
  h+='<div class="card"><h2>🔮 未来 5 年起伏预警</h2>';
  for(let i=0;i<5;i++){
    const y = currentYear + i;
    const yearGan = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'][(y-4)%10];
    const yearZhi = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][(y-4)%12];
    const yearEle = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'}[yearGan];
    let yScore = 60, yLevel='', yTips='';
    if(shengMap[dayEle]===yearEle){yScore+=15;yLevel='great';yTips='流年生我·贵人运旺';}
    else if(shengMap[yearEle]===dayEle){yScore+=10;yLevel='good';yTips='流年与我和谐·宜稳进';}
    else if(keMap[yearEle]===dayEle){yScore-=12;yLevel='warn';yTips='流年克我·守势化煞';}
    else if(keMap[dayEle]===yearEle){yScore-=8;yLevel='warn';yTips='流年我克·财耗慎决';}
    else if(yearEle===dayEle){yLevel='good';yTips='流年比肩·平稳';}
    yScore = Math.max(15, Math.min(95, yScore));
    h+='<div class="future5 '+yLevel+'">';
    h+='<div class="fy-t">'+y+' 年（'+yearGan+yearZhi+' · '+yearEle+'年）</div>';
    h+='<div class="fy-d">'+yTips+'</div>';
    h+='<div class="fy-a">运势评分：<b style="color:var(--gold)">'+yScore+'</b>/100</div>';
    h+='</div>';
  }
  h+='<div class="kb-source">📜 《三命通会·流年篇》《神峰通考》《穷通宝鉴》</div></div>';

  // 趋吉避凶总评
  if(trend){
    h+='<div class="trend-summary">';
    h+='<div class="ts-title">🛡️ 趋吉避凶总评（'+trend.phase+'）</div>';
    h+='<div class="ts-quote">"'+trend.trend+'——大运流年起伏如潮，知进退、明取舍，方为智者。"</div>';
    h+='<div class="ts-grid">';
    h+='<div class="ts-item"><b>📈 当前大运</b>'+now.ageStart+'-'+now.ageEnd+'岁·'+now.score+'分·'+now.rel[0]+'</div>';
    h+='<div class="ts-item"><b>📊 平均运势</b>'+trend.avgScore+'分/100（10 段大运）</div>';
    h+='<div class="ts-item"><b>📅 最佳十年</b>'+trend.recommendAge.ageStart+'-'+trend.recommendAge.ageEnd+'岁·'+trend.recommendAge.score+'分·'+trend.recommendAge.stem+'运</div>';
    h+='<div class="ts-item"><b>🎯 吉方</b>'+trend.goodDir+'（生旺命主）</div>';
    h+='<div class="ts-item"><b>⚠ 慎方</b>'+trend.badDir+'（克泄命主·慎往）</div>';
    h+='<div class="ts-item"><b>🎁 化煞物</b>'+trend.recItem+'</div>';
    h+='</div></div>';
    h+='<div class="kb-source">📜 综合《三命通会》《穷通宝鉴》《月谈赋》《卜筮正宗》</div>';
  }

  // 工具 (R33: +📱 二维码)
  h+='<div class="tools"><button onclick="shareUrl()">🔗 分享链接</button><button onclick="showQrModal()">📱 二维码</button><button onclick="window.print()">🖨️ 打印/保存 PDF</button><button onclick="copyTxt()">📋 复制文本</button></div>';

  document.getElementById('report').innerHTML=h;
  document.getElementById('report').classList.add('show');
  document.getElementById('input').style.display='none';
  location.hash='#'+btoa(unescape(encodeURIComponent(JSON.stringify({age:d.age,sex:d.sex,residence:d.residence,focus:d.focus,extra:d.extra}))));

  // 把 R38 健康/事业双核 + 4 阶段蓝图挂到报告上方
  const dashHtml = renderLifeplanDashboardR38();
  document.getElementById('report').insertAdjacentHTML('afterbegin', dashHtml);
}

function restoreFromHash(){
  const h=location.hash.slice(1);
  if(!h) return;
  try{
    const d=JSON.parse(decodeURIComponent(escape(atob(h))));
    if(d.age) document.getElementById('lAge').value=d.age;
    if(d.sex) document.getElementById('lSex').value=d.sex;
    if(d.residence) document.getElementById('lResidence').value=d.residence;
    if(d.focus) document.getElementById('lFocus').value=d.focus;
    if(d.extra) document.getElementById('lExtra').value=d.extra;
    generate();
  }catch(e){}
}

function shareUrl(){
  const url=location.href;
  if(navigator.share){navigator.share({title:'人生规划蓝图',url}).catch(()=>{});}
  else if(navigator.clipboard){navigator.clipboard.writeText(url).then(()=>showToast('链接已复制'));}
  else prompt('复制链接分享：',url);
}

function copyTxt(){
  if(navigator.clipboard){navigator.clipboard.writeText(document.getElementById('report').innerText).then(()=>showToast('已复制'));}
}

function showToast(m){
  const t=document.createElement('div');
  t.textContent=m;
  t.style.cssText='position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:rgba(201,168,76,.9);color:#0a0a0a;padding:10px 24px;border-radius:8px;font-size:14px;z-index:1000';
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),1800);
}

window.addEventListener('DOMContentLoaded',restoreFromHash);
/* ===== R38-A lifeplan-detail 双核仪表盘 ===== */
var LP_HEALTH_8D_R38={"气血":{"label":"🩸 气血","icon":"🩸","tip":"规律作息+八段锦+红枣枸杞"},"脾胃":{"label":"🍚 脾胃","icon":"🍚","tip":"细嚼慢咽+小米粥+山药"},"心肾":{"label":"💗 心肾","icon":"💗","tip":"子午觉+黑豆黑芝麻+节欲"},"肝胆":{"label":"🌿 肝胆","icon":"🌿","tip":"少熬夜+菊花枸杞+推肝经"},"睡眠":{"label":"😴 睡眠","icon":"😴","tip":"23点前睡+酸枣仁+热水泡脚"},"情绪":{"label":"😊 情绪","icon":"😊","tip":"冥想+运动+倾诉+疏肝"},"体质":{"label":"💪 体质","icon":"💪","tip":"慢跑+游泳+中医调理+九种体质"},"寿元":{"label":"🎂 寿元","icon":"🎂","tip":"顺应四时+节制饮食+心境平和"}};
var LP_CAREER_8D_R38={"正财":{"label":"💰 正财","icon":"💰","tip":"稳中求进+主业为重+积累技能"},"偏财":{"label":"🎲 偏财","icon":"🎲","tip":"小额试水+长线思维+风险控制"},"官运":{"label":"👔 官运","icon":"👔","tip":"贵人扶持+业绩+持续学习+等待时机"},"学业":{"label":"📚 学业","icon":"📚","tip":"夯实基础+查漏补缺+请家教+选对方法"},"创业":{"label":"🚀 创业","icon":"🚀","tip":"小步快跑+核心壁垒+现金流+合伙人"},"升迁":{"label":"📈 升迁","icon":"📈","tip":"业绩+人际+学习+抓住时机+主动争取"},"同事":{"label":"👥 同事","icon":"👥","tip":"互相尊重+团队协作+不站队+做好本职"},"合作":{"label":"🤝 合作","icon":"🤝","tip":"契约精神+互惠互利+长期主义+账目清晰"}};
var LP_4STAGE_R38={"学龄前":{"label":"👶 学龄前","age":"0-6","tip":"天赋发掘+兴趣培养+体质筑基+亲子陪伴"},"中小学":{"label":"🧒 中小学","age":"7-17","tip":"学业基础+性格塑造+特长培养+志愿规划"},"大学":{"label":"🎓 大学","age":"18-23","tip":"专业精进+实习历练+人脉拓展+职业起步"},"职场婚恋":{"label":"💼 职场婚恋","age":"24+","tip":"事业精进+择偶成家+理财规划+家庭建设"}};
function renderLifeplanDashboardR38(){
  var hS=76;var cS=78;
  var h='<div class="lp-dash">';
  h+='<div class="lp-dash-title">📅 人生规划·健康事业双核 + 4 阶段蓝图（8 健康维 + 8 事业维 + 4 人生阶段 + 22 古籍）</div>';
  h+='<div class="lp-dash-dual">';
  h+='<div class="lp-card health"><div class="lp-card-title">🩺 健康维度</div><div class="lp-card-score">'+hS+'<span style="font-size:13px;opacity:.6">/100</span></div><div class="lp-card-bar"><div class="lp-card-fill" style="width:'+hS+'%"></div></div><div style="font-size:11px;opacity:.7;margin-top:6px">🩸 气血 + 🍚 脾胃 + 💗 心肾 + 🌿 肝胆 + 😴 睡眠 + 😊 情绪 + 💪 体质 + 🎂 寿元</div></div>';
  h+='<div class="lp-card career"><div class="lp-card-title">💼 事业维度</div><div class="lp-card-score">'+cS+'<span style="font-size:13px;opacity:.6">/100</span></div><div class="lp-card-bar"><div class="lp-card-fill" style="width:'+cS+'%"></div></div><div style="font-size:11px;opacity:.7;margin-top:6px">💰 正财 + 🎲 偏财 + 👔 官运 + 📚 学业 + 🚀 创业 + 📈 升迁 + 👥 同事 + 🤝 合作</div></div>';
  h+='</div>';
  h+='<div style="margin:10px 0 8px;color:var(--paper3);font-size:12px;letter-spacing:1.5px">📋 4 人生阶段蓝图</div>';
  h+='<div class="lp-stage">';
  Object.keys(LP_4STAGE_R38).forEach(function(k){var it=LP_4STAGE_R38[k];
    h+='<ml-tap class="lp-stage-cell" onclick="alert(\''+it.label+'（'+it.age+'岁）\\n\\n行动建议：'+it.tip+'\')" variant="card" role="button" tabindex="0"><b>'+it.label+'</b><div style="font-size:11px;color:var(--gold);margin:4px 0">'+it.age+'岁</div><div style="font-size:10px;opacity:.7;line-height:1.5">'+it.tip+'</div></ml-tap>';
  });
  h+='</div>';
  h+='<div style="margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:12px">';
  h+='<div><div style="font-size:12px;color:#4a9a6e;margin-bottom:6px;letter-spacing:1px">🩺 8 健康维（点击查看详情）</div><div class="lp-8grid">';
  Object.keys(LP_HEALTH_8D_R38).forEach(function(k){var it=LP_HEALTH_8D_R38[k];
    h+='<ml-tap class="lp-8cell" onclick="alert(\''+it.label+'\\n\\n建议：'+it.tip+'\')" variant="card" role="button" tabindex="0"><span class="icon">'+it.icon+'</span><b>'+it.label+'</b><div class="tip">'+it.tip+'</div></ml-tap>';
  });
  h+='</div></div>';
  h+='<div><div style="font-size:12px;color:#4a8aa8;margin-bottom:6px;letter-spacing:1px">💼 8 事业维（点击查看详情）</div><div class="lp-8grid">';
  Object.keys(LP_CAREER_8D_R38).forEach(function(k){var it=LP_CAREER_8D_R38[k];
    h+='<ml-tap class="lp-8cell" onclick="alert(\''+it.label+'\\n\\n建议：'+it.tip+'\')" variant="card" role="button" tabindex="0"><span class="icon">'+it.icon+'</span><b>'+it.label+'</b><div class="tip">'+it.tip+'</div></ml-tap>';
  });
  h+='</div></div>';
  h+='</div>';
  h+='<div class="lp-verdict"><b style="color:var(--gold)">📅 人生规划总纲：</b><br>① 健康 '+hS+' 分·事业 '+cS+' 分—— 双核均衡者，人生稳步上扬 ② 4 阶段顺序不可颠倒：<b>学龄前筑基 → 中小学塑型 → 大学精进 → 职场婚恋</b> ③ 每阶段健康+事业双线并行，不可偏废 ④ 化解要点：<b style="color:#4a9a6e">健康打底</b>·<b style="color:#4a8aa8">事业领跑</b>·家业传承·终身学习</div>';
  h+='<div class="lp-source">📜 综合《滴天髓》《子平真诠》《穷通宝鉴》《三命通会》《紫微斗数全集》《太乙金华宗旨》《黄帝内经》《千金要方》《伤寒杂病论》《本草纲目》《了凡四训》《阴骘文》《太上感应篇》《玉历宝钞》《葬书》《撼龙经》《八宅明镜》《玄空飞星》《阳宅三要》《协纪辨方书》《天星择日》《三世因果经》共 22 部古籍</div>';
  h+='</div>';
  return h;
}

/* R41-B 12领域矩阵（全局，供 #lp-stage-timeline 渲染） */
var LP_12_DOMAIN_R41 = {
  "学龄前":{
    domains:[
      {n:"先天禀赋",score:85,tip:"遗传+孕期养护"},
      {n:"亲子陪伴",score:90,tip:"0-3岁关键期"},
      {n:"体质筑基",score:78,tip:"饮食起居"},
      {n:"语言开发",score:82,tip:"2-3岁爆发"},
      {n:"艺术启蒙",score:75,tip:"音乐美术"},
      {n:"社交萌芽",score:72,tip:"同伴互动"},
      {n:"性格雏形",score:80,tip:"安全感建立"},
      {n:"兴趣发现",score:77,tip:"观察引导"},
      {n:"体质偏弱",score:68,tip:"脾胃养护"},
      {n:"学前准备",score:70,tip:"幼小衔接"},
      {n:"家教家风",score:88,tip:"耳濡目染"},
      {n:"健康档案",score:75,tip:"建立台账"}
    ]
  },
  "中小学":{
    domains:[
      {n:"学业基础",score:82,tip:"小学奠基"},
      {n:"品德塑造",score:88,tip:"三观形成"},
      {n:"特长培养",score:78,tip:"艺体科技"},
      {n:"志愿规划",score:72,tip:"升学方向"},
      {n:"心理疏导",score:75,tip:"青春期"},
      {n:"社交能力",score:80,tip:"同学关系"},
      {n:"健康运动",score:83,tip:"近视肥胖"},
      {n:"家校协作",score:85,tip:"共同教育"},
      {n:"兴趣深耕",score:77,tip:"一技之长"},
      {n:"阅读习惯",score:86,tip:"终生受益"},
      {n:"自理能力",score:79,tip:"生活独立"},
      {n:"升学目标",score:74,tip:"中考高考"}
    ]
  },
  "大学":{
    domains:[
      {n:"专业精进",score:85,tip:"专业排名"},
      {n:"实习历练",score:78,tip:"职场初探"},
      {n:"人脉拓展",score:82,tip:"同学师长"},
      {n:"考证考级",score:75,tip:"职业资格"},
      {n:"出国交换",score:70,tip:"国际视野"},
      {n:"科研参与",score:73,tip:"学术入门"},
      {n:"创业试水",score:68,tip:"校园孵化"},
      {n:"毕业去向",score:80,tip:"考研就业"},
      {n:"健康管理",score:76,tip:"作息规律"},
      {n:"理财起步",score:65,tip:"记账预算"},
      {n:"婚姻萌芽",score:60,tip:"校园恋情"},
      {n:"毕业储备",score:77,tip:"求职准备"}
    ]
  },
  "职场婚恋":{
    domains:[
      {n:"事业精进",score:82,tip:"升迁加薪"},
      {n:"择偶成家",score:75,tip:"婚恋时机"},
      {n:"理财规划",score:78,tip:"资产配置"},
      {n:"家庭建设",score:85,tip:"夫妻关系"},
      {n:"子女教育",score:80,tip:"言传身教"},
      {n:"健康维护",score:72,tip:"中年养生"},
      {n:"父母赡养",score:83,tip:"孝道责任"},
      {n:"职场瓶颈",score:68,tip:"二次创业"},
      {n:"退休规划",score:65,tip:"老有所为"},
      {n:"社会贡献",score:78,tip:"公益传承"},
      {n:"家业传承",score:72,tip:"家训家风"},
      {n:"精神修养",score:77,tip:"心斋坐忘"}
    ]
  }
};

function renderLP_12Domain_R41(){
  var h = '';
  Object.keys(LP_12_DOMAIN_R41).forEach(function(stage){
    var sd = LP_12_DOMAIN_R41[stage];
    var avg = Math.round(sd.domains.reduce(function(s,x){return s+x.score;},0)/sd.domains.length);
    h += '<div class="lp-stage-block">';
    h += '<h3 style="color:var(--gold);font-size:16px;margin:16px 0 10px;border-left:3px solid var(--gold);padding-left:10px">📊 '+stage+'·12领域矩阵（均分 '+avg+'）</h3>';
    h += '<div class="lp-12-domain-grid">';
    sd.domains.forEach(function(d){
      var color = d.score>=80?'#4a9a6e':(d.score>=70?'#d4af37':'#d45050');
      h += '<div class="lp-12-domain-card">';
      h += '<div class="lp-12-domain-name">'+d.n+'</div>';
      h += '<div class="lp-12-domain-score" style="color:'+color+'">'+d.score+'</div>';
      h += '<div class="lp-12-domain-tip">'+d.tip+'</div>';
      h += '</div>';
    });
    h += '</div></div>';
  });
  return h;
}


document.getElementById("lp-stage-timeline").innerHTML += renderLP_12Domain_R41();


// R33: 纯 JS QR Code 生成器（实现 Reed-Solomon + Matrix 拼接）
// 借鉴 https://github.com/nayuki/QR-Code-generator 逻辑精简版
// 支持版本 1-10·纠错等级 M·字节模式
(function() {
  // Galois Field 指数/对数表 (GF(256))
  var EXP = new Array(256), LOG = new Array(256);
  (function() {
    var x = 1;
    for (var i = 0; i < 256; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11D;
    }
  })();
  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return EXP[(LOG[a] + LOG[b]) % 255];
  }
  function reedSolomon(data, ecLen) {
    var gen = new Array(ecLen + 1).fill(0);
    gen[0] = 1;
    for (var i = 0; i < ecLen; i++) {
      var coef = EXP[i];
      for (var j = i + 1; j >= 1; j--) {
        gen[j] ^= gfMul(gen[j - 1], coef);
      }
      gen[0] = gfMul(gen[0], coef);
    }
    var res = new Array(ecLen).fill(0);
    for (var i = 0; i < data.length; i++) {
      var factor = data[i] ^ res[0];
      res.shift();
      res.push(0);
      if (factor !== 0) {
        for (var j = 0; j < ecLen; j++) {
          res[j] ^= gfMul(gen[j + 1], factor);
        }
      }
    }
    return res;
  }
  // 版本1–10 容量表 (纠错 M, 字节模式)
  var CAP_M = [0, 14, 26, 42, 62, 84, 106, 122, 152, 180, 213];
  // 版本1–10 纠错码字数
  var EC_M = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
  // 版本1–10 总数据码字数
  var TOT_M = [0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346];
  // 选最低版本
  function pickVersion(dataLen) {
    for (var v = 1; v <= 10; v++) {
      if (CAP_M[v] >= dataLen) return v;
    }
    return -1; // 超出范围
  }
  // 生成矩阵 (简化: 不画 alignment pattern)
  function buildMatrix(version, data, ecLen) {
    var size = 17 + 4 * version;
    var matrix = [];
    for (var i = 0; i < size; i++) {
      matrix.push(new Array(size).fill(false));
    }
    // 绘制三个角的定位图案
    function drawFinder(r, c) {
      for (var dy = -1; dy <= 7; dy++) {
        for (var dx = -1; dx <= 7; dx++) {
          var y = r + dy, x = c + dx;
          if (y < 0 || y >= size || x < 0 || x >= size) continue;
          var inOuter = (dy >= 0 && dy <= 6 && (dx === 0 || dx === 6)) ||
                         (dx >= 0 && dx <= 6 && (dy === 0 || dy === 6));
          var inInner = dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4;
          matrix[y][x] = inOuter || inInner;
        }
      }
    }
    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);
    // 预留 timing pattern / format area 默认 false
    // 数据填充: 按从右下向上的列扫描
    var idx = 0;
    var totalBits = data.length * 8;
    for (var col = size - 1; col > 0; col -= 2) {
      if (col === 6) col--; // 跳过 timing pattern 列
      for (var row = 0; row < size; row++) {
        for (var c = 0; c < 2; c++) {
          var x = col - c;
          var y = (col + 1) & 3 ? row : size - 1 - row;
          if (matrix[y][x]) continue; // 已占用
          var bit = idx < totalBits ? (data[idx >> 3] >> (7 - (idx & 7))) & 1 : 0;
          matrix[y][x] = bit === 1;
          idx++;
        }
      }
    }
    return { matrix: matrix, size: size };
  }
  // 画到 canvas
  window.renderQRToCanvas = function(canvas, text) {
    if (!text) return false;
    var bytes = [];
    for (var i = 0; i < text.length; i++) {
      var code = text.charCodeAt(i);
      if (code < 0x80) {
        bytes.push(code);
      } else if (code < 0x800) {
        bytes.push(0xC0 | (code >> 6));
        bytes.push(0x80 | (code & 0x3F));
      } else {
        bytes.push(0xE0 | (code >> 12));
        bytes.push(0x80 | ((code >> 6) & 0x3F));
        bytes.push(0x80 | (code & 0x3F));
      }
    }
    var dataLen = bytes.length;
    var version = pickVersion(dataLen);
    if (version < 0) return false;
    var ecLen = EC_M[version];
    var dataCodewords = CAP_M[version];
    var padding = TOT_M[version] - dataCodewords - ecLen;
    // 拼装数据: 4位 mode (bytes = 0100) + 8/16 位长度 + 数据 + 终止符 + 填充
    var bits = [];
    // mode = 0100 (4 bits)
    bits.push(0, 1, 0, 0);
    // length: version 1-9 用 8 bits, 10-26 用 16 bits
    var lenBits = version <= 9 ? 8 : 16;
    for (var i = lenBits - 1; i >= 0; i--) bits.push((dataLen >> i) & 1);
    // 数据 bytes
    bytes.forEach(function(b) {
      for (var i = 7; i >= 0; i--) bits.push((b >> i) & 1);
    });
    // 终止符 0000
    for (var i = 0; i < 4; i++) bits.push(0);
    // 填充到字节
    while (bits.length % 8 !== 0) bits.push(0);
    // 转换为字节数组
    var dataBytes = [];
    for (var i = 0; i < bits.length; i += 8) {
      var b = 0;
      for (var j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
      dataBytes.push(b);
    }
    // 填充字节 0xEC 0x11 交替
    var pads = [0xEC, 0x11];
    for (var p = 0; p < padding + (dataCodewords - dataBytes.length); p++) {
      dataBytes.push(pads[p % 2]);
    }
    // 生成纠错
    var ecBytes = reedSolomon(dataBytes, ecLen);
    var finalData = dataBytes.concat(ecBytes);
    var result = buildMatrix(version, finalData, ecLen);
    // 画到 canvas
    var ctx = canvas.getContext('2d');
    var size = canvas.width;
    var cellSize = size / result.size;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#0a0a0a';
    for (var y = 0; y < result.size; y++) {
      for (var x = 0; x < result.size; x++) {
        if (result.matrix[y][x]) {
          ctx.fillRect(Math.floor(x * cellSize), Math.floor(y * cellSize),
            Math.ceil(cellSize), Math.ceil(cellSize));
        }
      }
    }
    return true;
  };
})();

function showQrModal() {
  const modal = document.getElementById('qrModal');
  const canvas = document.getElementById('qrCanvas');
  const urlText = document.getElementById('qrUrlText');
  const url = location.href;
  urlText.textContent = url;
  const ok = renderQRToCanvas(canvas, url);
  if (!ok) {
    canvas.style.display = 'none';
    urlText.textContent = '链接过长，请使用「分享链接」按钮';
  } else {
    canvas.style.display = 'block';
  }
  if (typeof modal.showModal === 'function') {
    if (!modal.open) modal.showModal();
  } else {
    modal.style.display = 'flex';
  }
}
function closeQrModal() {
  const modal = document.getElementById('qrModal');
  if (typeof modal.close === 'function') {
    modal.close();
  } else {
    modal.style.display = 'none';
  }
}
// click-outside 关闭（原生 dialog backdrop click）
document.addEventListener('DOMContentLoaded', function() {
  var modal = document.getElementById('qrModal');
  if (modal) {
    modal.addEventListener('click', function(ev) {
      // 仅当点击 dialog 自身（backdrop）而非内容时关闭
      if (ev.target === modal) closeQrModal();
    });
  }
});
function downloadQr() {
  const canvas = document.getElementById('qrCanvas');
  const link = document.createElement('a');
  link.download = 'lifeplan-qr.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('已保存二维码');
}

  