/**
 * module-reports-kb.js · 14 模块 KB 兜底诊断引擎
 *
 * 解决问题：AI 助手/算命馆/知识馆 divination-knowledge 三大主入口 +
 *          music/lifeindex/lifeplan 三页在断网/API 失败时仍能给出 KB 兜底报告
 *
 * 范围（14 模块）：
 *   bazi / yunshi / caiyun / ganqing / zhongyi / mobile / shiye /
 *   xingming / zeri / huangli / taisui / music / lifeindex / lifeplan
 *
 * 每个模块提供：
 *   name     — 显示名
 *   diagnose(data) — 接收 inputs.s0/s1/... 返回报告结构
 *
 * 用法：
 *   <script src="js/module-reports-kb.js" defer></script>
 *   const rep = window._MODULE_REPORTS[mod].diagnose({s0:'...', s1:'...'});
 *
 * 入册日期：2026-07-26
 * 抽出来源于 ai-assistant.html 内嵌 3135-3599 行（避免重复维护）
 */

window._MODULE_REPORTS = {
  bazi: {
    name: '八字排盘',
    diagnose: function(data){
      const s = (data && data.s0) || '1985年3月22日8时 女';
      const m = s.match(/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日]?\s*(\d{1,2})[时点]?\s*([男女])?/);
      if (!m) return {title:'八字报告（KB兜底）', summary:'格式：1985年3月22日8时 女'};
      const ele = ['金','木','水','火','土'][+m[3] % 5];
      const SD = {'金':72,'木':78,'水':82,'火':88,'土':85};
      const six = {yunshi: SD[ele], jiankang: SD[ele]-3, hunyin: SD[ele]+2, haizi: SD[ele]-1, tongshi: SD[ele]+1, fumu: SD[ele]+3};
      return {
        title: '八字命理报告（断网KB兜底）',
        element: ele,
        summary: '日主'+ele+'·'+((m[5]||'男')==='女'?'坤造':'乾造')+'·生辰 '+m[1]+'-'+m[2]+'-'+m[3]+' '+m[4]+'时',
        sixDims: six,
        ttsText: '日主'+ele+'命。'+Object.entries(six).map(([k,v])=>k+v+'分').join('；'),
        nextSteps: ['记录生辰八字便于后续对比','结合大运流年逐年精解','每月初一定期复盘','婚配择吉优先看配偶宫','子女缘看时柱','与父母缘看印星']
      };
    }
  },
  yunshi: {
    name: '运势分析',
    diagnose: function(data){
      const seed = (data && data.s0) ? data.s0.length : 0;
      const ele = ['金','木','水','火','土'][seed % 5];
      const SD = {'金':68,'木':75,'水':80,'火':85,'土':82};
      const six = {yunshi: SD[ele], jiankang: SD[ele]+2, hunyin: SD[ele]-1, haizi: SD[ele]+1, tongshi: SD[ele]+3, fumu: SD[ele]+5};
      return {
        title: '运势报告（断网KB兜底）',
        element: ele,
        ttsText: '2026丙午年，'+ele+'命者运势'+SD[ele]+'分。事业宜稳中求进，健康注意调养。',
        sixDims: six,
        nextSteps: ['上半年守为主下半年攻','秋季金旺把握机会','避免冲动投资','婚姻沟通多主动','健康保持规律作息','每月初一祈福']
      };
    }
  },
  caiyun: {
    name: '财运分析',
    diagnose: function(data){
      const seed = (data && data.s0) ? data.s0.length : 1;
      const ele = ['金','木','水','火','土'][seed % 5];
      const SD = {'金':65,'木':72,'水':85,'火':55,'土':80};
      const six = {yunshi: SD[ele]-3, jiankang: SD[ele]+5, hunyin: SD[ele], haizi: SD[ele]+2, tongshi: SD[ele]+4, fumu: SD[ele]+6};
      return {
        title: '财运报告（断网KB兜底）',
        element: ele,
        ttsText: ele+'命者财运'+SD[ele]+'分。正财稳，偏财慎。',
        sixDims: six,
        nextSteps: ['长线投资优于短线','正财为本','秋季金旺有财','忌合伙担保','控制消费','每月储蓄20%']
      };
    }
  },
  ganqing: {
    name: '感情婚姻',
    diagnose: function(data){
      const seed = (data && data.s0) ? data.s0.length : 2;
      const ele = ['金','木','水','火','土'][seed % 5];
      const SD = {'金':62,'木':78,'水':82,'火':75,'土':80};
      const six = {yunshi: SD[ele], jiankang: SD[ele]+3, hunyin: SD[ele]+5, haizi: SD[ele]+2, tongshi: SD[ele]+1, fumu: SD[ele]+4};
      return {
        title: '感情婚姻报告（断网KB兜底）',
        element: ele,
        ttsText: ele+'命者婚姻'+SD[ele]+'分。桃花在春，感情稳定需主动。',
        sixDims: six,
        nextSteps: ['正缘时机看流年','配偶宫看日支','增进沟通','家庭责任共担','子女缘分看时柱','提升自我价值']
      };
    }
  },
  zhongyi: {
    name: '中医养生',
    diagnose: function(data){
      const sx = (data && data.s0) || '疲劳';
      const tzMap = {'疲劳':'气虚','失眠':'阴虚','怕冷':'阳虚','怕热':'湿热','情绪波动大':'肝郁','消化不好':'脾虚','睡眠差':'心肾不交'};
      const tz = tzMap[sx] || '气虚';
      const SD = {'气虚':75,'阴虚':72,'阳虚':68,'湿热':70,'肝郁':78,'脾虚':80,'心肾不交':76};
      const six = {yunshi: SD[tz]-2, jiankang: SD[tz]+5, hunyin: SD[tz]-1, haizi: SD[tz], tongshi: SD[tz]+3, fumu: SD[tz]+4};
      return {
        title: '中医体质报告（断网KB兜底）',
        constitution: tz,
        symptom: sx,
        ttsText: '体质倾向'+tz+'。建议'+tz+'调理方。',
        sixDims: six,
        nextSteps: ['辨证施膳','规律作息','适度运动','调节情志','按时体检','中医调理']
      };
    }
  },
  music: {
    name: '疗愈音乐',
    fiveElements: {
      '宫':{key:'宫音',feel:'沉稳厚重',suitable:['焦虑','失眠','悲伤'],ttsText:'宫音沉稳厚重，主土主脾胃。建议在安静房间聆听，配合深呼吸。适合焦虑失眠悲伤。'},
      '商':{key:'商音',feel:'清亮高远',suitable:['愤怒','急躁'],ttsText:'商音清亮高远，主金主肺。适合愤怒急躁时听，有助于收敛心神。'},
      '角':{key:'角音',feel:'生机盎然',suitable:['疲劳','低沉'],ttsText:'角音生机盎然，主木主肝。适合疲劳低沉时听，能生发阳气。'},
      '徵':{key:'徵音',feel:'热烈欢快',suitable:['抑郁','冷淡'],ttsText:'徵音热烈欢快，主火主心。适合抑郁冷淡时听，能振奋精神。'},
      '羽':{key:'羽音',feel:'悠远深邃',suitable:['焦虑','失眠','多梦'],ttsText:'羽音悠远深邃，主水主肾。适合焦虑失眠多梦时听，能滋阴降火。'}
    },
    diagnose: function(data){
      const emo = (data && data.s0) || '焦虑';
      const ele = (data && data.s1) || '金';
      const WX = {金:'商',木:'角',水:'羽',火:'徵',土:'宫'};
      const e = WX[ele] || '宫';
      const five = this.fiveElements[e];
      return {
        title: '疗愈音乐诊断报告',
        fiveElement: e,
        recommend: five,
        emotion: emo,
        ttsText: five.ttsText,
        intro: `根据您“${emo}”的情志状态，结合“${ele}”行能量，为您推荐${five.key}（${five.feel}）。${five.ttsText}建议每日聆听 30 分钟，连续 7 天一个疗程。`,
        playList: [
          {name:'五行'+five.key+'音·开篇引导',duration:120,ttsText:'欢迎聆听'+five.key+'音乐疗愈。'+five.ttsText},
          {name:'古琴'+e+'调·净心曲',duration:600,ttsText:'接下来为您演奏古琴'+e+'调，'+five.feel+'音律，静心始然。'},
          {name:'五行'+five.key+'音·主曲',duration:600,ttsText:'进入主曲阶段。'+five.ttsText},
          {name:'颂钵'+five.key+'音·收束',duration:300,ttsText:'请深吸一口气，与'+five.key+'共鸣。闭眼，静听。'},
          {name:'轻推荐·同类补充',duration:480,ttsText:'可考虑'+five.suitable.slice(0,3).join('、')+'类情境中继续聆听。'}
        ],
        cycleText: '【7 日疗程】第1-2 天适应·第3-4 天深化·第5-6 天内化·第7 天总结。',
        compatible: WX[e] ? '同源推荐：'+WX[e]+'音系列。' : ''
      };
    }
  },
  lifeindex: {
    name: '生命指数',
    dimensions: [
      {key:'shiye',name:'事业',icon:'💼',weight:0.20,focus:'职业三跳+管理进阶'},
      {key:'caiyun',name:'财运',icon:'💰',weight:0.15,focus:'稳健理财+多元收入'},
      {key:'jiankang',name:'健康',icon:'💪',weight:0.20,focus:'运动+饮食+作息'},
      {key:'hunyin',name:'婚姻',icon:'💑',weight:0.15,focus:'沟通+包容+共同成长'},
      {key:'xueye',name:'学业',icon:'📚',weight:0.10,focus:'学历+证书+终身学习'},
      {key:'jiating',name:'家庭',icon:'🏡',weight:0.05,focus:'子女教育+亲情'},
      {key:'renji',name:'人际',icon:'🤝',weight:0.05,focus:'深度关系+同行圈子'},
      {key:'jingshen',name:'精神',icon:'🎭',weight:0.05,focus:'信仰+哲学+艺术'},
      {key:'xiangfu',name:'享福',icon:'🌸',weight:0.02,focus:'体验+旅行+生活品质'},
      {key:'shouyuan',name:'寿元',icon:'🍵',weight:0.02,focus:'养生+保健+定期体检'},
      {key:'fengwu',name:'风物',icon:'🌸',weight:0.02,focus:'名山大川+风水宝地+宜居城市'},
      {key:'xiuyang',name:'修养',icon:'📿',weight:0.02,focus:'静心+读书+书法+禅修+传统文化'}
    ],
    diagnose: function(data){
      const WX_SCORE = {'金':85,'木':78,'水':82,'火':88,'土':90};
      const WX_FOCUS = {'金':'锐进+决策+果断','木':'生发+成长+学习','水':'智慧+灵活+沉浸','火':'表达+热情+领导','土':'稳重+承担+储蓄'};
      // R41-DR1：12 维度五行生克权重偏差已提取到 js/wx-dim-bias.js 共享
      // 修正：以前 key 是 renmai 人脉 / chuangye 创业（与 12 维表不一致），现统一为 renji 人际
      const WX_DIM_BIAS = window.WX_DIM_BIAS || {
        '金':{'caiyun':8,'shiye':6,'renmai':4},
        '木':{'xueye':8,'jingshen':6,'chuangye':4},
        '水':{'renji':8,'jingshen':6,'zhiye':4},
        '火':{'renji':6,'chuangye':8,'xiangfu':4},
        '土':{'jiating':6,'shouyuan':6,'fengwu':4,'xiuyang':4}
      };
      const ele = (data && data.s0) || '金';
      const base = WX_SCORE[ele] || 85;
      const userText = ((data && (data.s1||'')) + ' ' + ((data && data.s2)||'')).trim();
      // 五行关键词加权
      const WX_KEYS = {'金':['金','银','金融','财','金属','锐','商业'],'木':['木','林','学','教育','书','生长','花'],'水':['水','海','智慧','智','流动','冥想'],'火':['火','光','表演','演讲','热','能量'],'土':['土','建筑','稳','田','地产','山']};
      let boost = 0;
      (WX_KEYS[ele]||[]).forEach(k => { if(userText.includes(k)) boost += 3; });
      const result = this.dimensions.map(d => {
        // 五行能量优势领域加权（12 维度扩展）
        const biasMap = WX_DIM_BIAS[ele] || {};
        let bias = biasMap[d.key] || 0;
        const score = Math.max(40, Math.min(95, Math.round(base + (Math.sin(d.key.length*7) * 8) + bias + boost)));
        const status = score >= 85 ? '优' : score >= 75 ? '良' : score >= 60 ? '中' : '有潜力';
        return { name: d.name, key: d.key, icon: d.icon, score, weight: d.weight, status, focus: d.focus };
      });
      const total = Math.round(result.reduce((s,d) => s + d.score * d.weight, 0));
      // 五行能量画像
      const top3 = [...result].sort((a,b) => b.score - a.score).slice(0, 3).map(d => d.name);
      const bot2 = [...result].sort((a,b) => a.score - b.score).slice(0, 2).map(d => d.name);
      const summary = `${ele}行主导（${WX_FOCUS[ele]}），总分${total}。优势：${top3.join('、')}；待加强：${bot2.join('、')}`;
      // 10 条行动清单（按加权后劣势领域给针对性建议）
      const actions = [];
      result.filter(d => d.score < 75).sort((a,b) => a.score - b.score).slice(0, 3).forEach(d => {
        actions.push('【'+d.name+'】'+d.focus+'（得分'+d.score+'）');
      });
      result.filter(d => d.score >= 85).slice(0, 3).forEach(d => {
        actions.push('【'+d.name+'】优势保持：'+d.focus);
      });
      while (actions.length < 10) actions.push('【平衡】五行调合：'+ele+'行能量配比优化');
      // 5 年节奏
      const next5Years = [
        {year:1, text:'扬长：强化优势领域（'+top3[0]+'）'+(top3[1]?'+'+top3[1]:'')+'主键能力'},
        {year:2, text:'补短：针对性提升'+bot2[0]+'领域'},
        {year:3, text:'人生换挡期：尝试差异化路径'},
        {year:4, text:'中段汇总：成果性不陶丝'},
        {year:5, text:'中期锁势：进入下个五年计划'}
      ];
      const ttsText = `生命指数总分${total}分，${ele}行主导。优势领域 ${top3.join('、')}，待加强 ${bot2.join('、')}。12 维度含风物与修养，建议补齐五行平衡与精神修习。`;
      return { title:'生命指数报告', total, dimensions:result, element:ele, top3, bot2, summary, actions, next5Years, ttsText };
    }
  },
  lifeplan: {
    name: '人生规划',
    stages: [
      {key:'preschool',name:'学龄前',range:'0-6岁',focus:['启蒙','健康','亲子'],ttsText:'学龄前以启蒙为主，重点健康习惯与亲子陪伴。'},
      {key:'school',name:'小学中学',range:'7-17岁',focus:['学习','品德','兴趣'],ttsText:'小学中学阶段学习为本，品德与兴趣培养并重。'},
      {key:'university',name:'大学',range:'18-23岁',focus:['专业','社交','实践'],ttsText:'大学阶段聚焦专业深耕、社交圈拓展与社会实践。'},
      {key:'career',name:'职场+婚恋',range:'24岁+',focus:['事业','婚恋','财务','健康'],ttsText:'职场婚恋阶段，事业婚恋财务健康四线并行，建议关注风物与修养平衡。'}
    ],
    // R41-B：4 阶段 × 12 领域 48 子项模板
    stageTemplates: {
      preschool: {
        xueye: '蒙学兴趣班（语言·音乐·绘画·体能）',
        zhiye: '职业体验日（医院·学校·消防·农场）',
        caiyun: '金钱概念认知（转卖零食·存钱罐）',
        hunyin: '社交交往演练（问候·分享·规则）',
        jiankang: '均衡营养 + 充足睡眠（10小时）',
        chengshi: '公园·图书馆·动物园常去',
        fengwu: '四季物候观察（花鸟鱼虫·节令）',
        xiuyang: '古典音乐听赏（宫羽音·4小时/周）',
        renmai: '亲子+同伴社交圈（5-8人稳定）',
        chuangye: '小商业启蒙（跳蚤市场·手工坊）',
        yanglao: '祖辈互动（请家中老人讲故事）',
        chuancheng: '家谱/姓氏故事（记住4代名字）'
      },
      school: {
        xueye: '学科主课+1门专长（25%+ 主课量）',
        zhiye: '职业探索讲座（每学期 1-2 场）',
        caiyun: '零花钱+理财记账（月度复盘）',
        hunyin: '同伴友谊维护+恋爱观萌芽',
        jiankang: '运动习惯定型（30分/天）',
        chengshi: '家乡周边行万里路（年 2 次）',
        fengwu: '历史/博物馆参访（学期 1 次）',
        xiuyang: '读书笔记·书法·一件乐器',
        renmai: '同学圈+师长资源（10-20人）',
        chuangye: '校园微创业（社团·项目·比赛）',
        yanglao: '助老/敬老志愿（学期 1 次）',
        chuancheng: '家族行业初了解（父母工种）'
      },
      university: {
        xueye: '专业深耕 + 跨学科辅修/考证',
        zhiye: '行业实习 2 段（寒暑假各 1）',
        caiyun: '个人理财起步（指数/定投·规划）',
        hunyin: '亲密关系实战（含分手复盘）',
        jiankang: '作息节律锁定 + 运动专长',
        chengshi: '一线/新一线·三年规划（毕业定锚）',
        fengwu: '城市人文深度游（街区+老字号）',
        xiuyang: '读经典·写文章·学一门外语',
        renmai: '导师+同窗+行业校友（30人脉）',
        chuangye: '尝试1次创业实操（摆摆·轻量）',
        yanglao: '探望长辈·接触老龄议题',
        chuancheng: '立家训·明确个人使命陈述'
      },
      career: {
        xueye: '在读硕博/考证/终身学习（年 1 证）',
        zhiye: '5 年职业三跳（稳·升·创各 1）',
        caiyun: '攻守理财（股·债·保·房）',
        hunyin: '婚姻经营 + 子女教育规划',
        jiankang: '每年深度体检+运动习惯',
        chengshi: '安居城市挑选（宜居+子女教育）',
        fengwu: '名山大川·风景名胜（年 1-2 处）',
        xiuyang: '静心修行（禅·茶·琴·书各 1）',
        renmai: '圈层重塑（同领域 30 人+跨领域 10）',
        chuangye: '二次创业评估（30/40/50 节点）',
        yanglao: '45 岁起筹备养老金（社保+商保+投资）',
        chuancheng: '家风传承·著作/著作/家训'
      }
    },
    domains: [
      {key:'xueye',name:'学业',icon:'📚'},
      {key:'zhiye',name:'职业',icon:'💼'},
      {key:'caiyun',name:'财运',icon:'💰'},
      {key:'hunyin',name:'婚姻',icon:'💕'},
      {key:'jiankang',name:'健康',icon:'💊'},
      {key:'chengshi',name:'城市',icon:'🏙️'},
      {key:'fengwu',name:'风物',icon:'🌸'},
      {key:'xiuyang',name:'修养',icon:'📿'},
      {key:'renmai',name:'人脉',icon:'🤝'},
      {key:'chuangye',name:'创业',icon:'🚀'},
      {key:'yanglao',name:'养老',icon:'🌳'},
      {key:'chuancheng',name:'传承',icon:'🎁'}
    ],
    diagnose: function(data){
      const age = parseInt(data && data.s0) || 30;
      const stageKey = age <= 6 ? 'preschool' : age <= 17 ? 'school' : age <= 23 ? 'university' : 'career';
      const stage = this.stages.find(s => s.key === stageKey);

      // 十二领域评分（根据年龄阶段 + KB 文本关键词加权）
      const userText = Object.values(data || {}).join(' ');
      const ageStageFocus = stage.focus.join(' ');
      const _5yStart = age;
      const _5yPlan = [
        { year: age + 1, text: '夯实基期：阶段核心理能强化，适合学习积累' },
        { year: age + 2, text: '试错期：阶段突破、探索不同方向' },
        { year: age + 3, text: '中期步进期：目标聚焦、协会/导师对话' },
        { year: age + 4, text: '中期证果期：阶段成果转位' },
        { year: age + 5, text: '中期导启期：下一阶段起点梳理' }
      ];
      const domainScores = this.domains.map(d => {
        let baseScore = 60;
        // 阶段关注领域加权 (+15)
        if (stage.focus.some(f => d.name.includes(f) || f.includes(d.name))) baseScore += 15;
        // 健康年龄 >=35 -10
        if (d.key === 'jiankang' && age >= 35) baseScore -= 10;
        // 创业年龄 24-40 额外加权
        if (d.key === 'chuangye' && age >= 24 && age <= 40) baseScore += 10;
        // 养老年龄 50+
        if (d.key === 'yanglao' && age >= 50) baseScore += 15;
        // 学业年龄 <24
        if (d.key === 'xueye' && age < 24) baseScore += 15;
        // 五行关键词加权
        const wuxingKeywords = { '金': ['理财', '金融', '法律'], '木': ['学习', '成长', '教育'], '水': ['智慧', '思考', '学术'], '火': ['创业', '激情', '表达'], '土': ['稳健', '养老', '健康'] };
        for (const [wx, kws] of Object.entries(wuxingKeywords)) {
          if (kws.some(k => userText.includes(k))) {
            if (d.key === 'caiyun' && wx === '金') baseScore += 5;
            if (d.key === 'xueye' && wx === '木') baseScore += 5;
            if (d.key === 'chuangye' && wx === '火') baseScore += 5;
            if (d.key === 'yanglao' && wx === '土') baseScore += 5;
          }
        }
        const finalScore = Math.max(30, Math.min(95, baseScore));
        return { key: d.key, name: d.name, icon: d.icon, score: finalScore, status: finalScore >= 75 ? '优' : finalScore >= 60 ? '良好' : '有潜力' };
      });

      // 未来 5 年中年步进建议（根据月大运运转提示）
      const _5yAdvice = age < 30
        ? '启始期，重点在✍️学业 亅人脉 建节奏'
        : age < 50
        ? '进取期，重点在💼事业 💰财运 💕婚恋'
        : '守成期，重点在💊健康 🏙️城市 🏺传承';

      return {
        title: '人生规划报告',
        age: age,
        stage: stage,
        domains: this.domains,
        domainScores: domainScores,
        timeline: [
          {age: 10, text: '童年奠基期', focus: '启蒙 + 健康习惯'},
          {age: 20, text: '青年立志期', focus: '学业 + 人脉起步'},
          {age: 30, text: '而立创业期', focus: '事业 + 婚恋'},
          {age: 40, text: '不惑稳固期', focus: '事业深耕 + 健康'},
          {age: 50, text: '知天命收获期', focus: '财务 + 传承'},
          {age: 60, text: '耳顺传承期', focus: '传承 + 修养'},
          {age: 70, text: '从心所欲期', focus: '享福 + 天命'}
        ],
        next5Years: _5yPlan,
        fiveYearAdvice: _5yAdvice,
        nextSteps: [
          `【1】制定${age + 1}年度${stage.focus[0]}核心目标（3个为佳）`,
          `【2】梳理现有${stage.focus[1] || '人脉'}资源，建立同领域同行圈层（5-8人）`,
          `【3】建立每月一轮复盘机制（推荐月末周末 2 小时）`,
          `【4】健康习惯投资：合理作息 / 运动计划（每周 3-5 次）`,
          `【5】财务防守 / 进攻计划：年度储蓄比例明确 · 握关资本上限`
        ],
        summary: `${age}岁属${stage.name}（${stage.range}），本阶段重点：${stage.focus.join('、')}。依据八守御身始躜，未来 5 年${_5yAdvice}。请每月复盘调整。`,
        kbSources: ['NIHAISHA_KB', 'SHUHAN_KB', 'FAITH_KB'],
        ttsText: `${age}岁属${stage.name}（${stage.range}），重点${stage.focus.join('、')}。未来五年${_5yAdvice}。`,
        stageTemplate: this.stageTemplates[stageKey],
      };
    }
  },
  mobile: {
    name: '手机号码',
    diagnose: function(data){
      const num = (data && data.s0) || '13800138000';
      const last4 = num.slice(-4);
      const seed = (parseInt(last4) || 0) % 5;
      const ele = ['金','木','水','火','土'][seed];
      const SD = {'金':88,'木':76,'水':82,'火':80,'土':85};
      const five = {'金':'吉','木':'平','水':'大吉','火':'中','土':'吉'};
      const six = {yunshi: SD[ele], jiankang: SD[ele]+1, hunyin: SD[ele]+2, haizi: SD[ele]-1, tongshi: SD[ele]+3, fumu: SD[ele]+4};
      return {
        title: '手机号码吉凶分析（断网KB兜底）',
        number: num, last4: last4, element: ele,
        ttsText: '尾数' + last4 + '，五行属' + ele + '，整体评' + five[ele] + '。',
        sixDims: six,
        summary: '尾号' + last4 + ' 五行属' + ele + '，吉凶评级：' + five[ele] + '（总分' + SD[ele] + '）',
        nextSteps: ['尾数+' + last4 + '寓意归纳为' + ele + '行能量','结合八字用神评判','避免在日主受克日使用','重要场合可调换主用号','搭配颜色色手机壳','号码仅作参考，沟通诚意更重要']
      };
    }
  },
  shiye: {
    name: '事业工作',
    diagnose: function(data){
      const seed = (((data && data.s0) || '').length + ((data && data.s1) || '').length);
      const ele = ['金','木','水','火','土'][seed % 5];
      const SD = {'金':85,'木':78,'水':82,'火':88,'土':83};
      const six = {yunshi: SD[ele]+3, jiankang: SD[ele]-2, hunyin: SD[ele], haizi: SD[ele]-1, tongshi: SD[ele]+5, fumu: SD[ele]+2};
      return {
        title: '事业工作分析（断网KB兜底）',
        element: ele,
        ttsText: ele + '命者事业' + SD[ele] + '分。',
        sixDims: six,
        summary: ele + '命事业总分' + SD[ele] + '分。',
        nextSteps: ['上半年守成蓄力','下半年主动出击','深耕主业避免频繁跳槽','35岁前确定行业方向','积累行业人脉（5-8位同行）','每3年一次自我评估']
      };
    }
  },
  xingming: {
    name: '姓名学',
    diagnose: function(data){
      const name = (data && data.s0) || '张三';
      const seed = [...name].reduce(function(s,c){return s + c.charCodeAt(0);}, 0);
      const ele = ['金','木','水','火','土'][seed % 5];
      const SD = {'金':86,'木':80,'水':83,'火':85,'土':88};
      const tianGe = 1 + seed % 81;
      return {
        title: '姓名学分析（断网KB兜底）',
        name: name, element: ele, tianGe: tianGe,
        ttsText: name + '，' + ele + '属性，天格' + tianGe + '数。',
        sixDims: {yunshi: SD[ele], jiankang: SD[ele]+2, hunyin: SD[ele]+1, haizi: SD[ele]-1, tongshi: SD[ele]+3, fumu: SD[ele]+4},
        summary: name + '五行属' + ele + '，天格' + tianGe + '数。',
        nextSteps: ['三才配置综合考虑','音形义综合评判','避免生僻字','与生辰八字互补','考虑家族辈分用字','改名需谨慎']
      };
    }
  },
  zeri: {
    name: '择日',
    diagnose: function(data){
      const event = (data && data.s0) || '婚嫁';
      const date = (data && data.s1) || '2026-08-15';
      const dayDate = new Date(date);
      const dayZhi = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][dayDate.getDate() % 12];
      const seed = dayDate.getDate() % 5;
      const ele = ['金','木','水','火','土'][seed];
      const luck = ['上上','上','中','下','中上'][seed];
      return {
        title: '择日分析（断网KB兜底）',
        event: event, date: date, dayZhi: dayZhi, luck: luck,
        ttsText: date + '日支' + dayZhi + '，五行属' + ele + '，用于' + event + '：' + luck + '。',
        summary: date + '（' + dayZhi + '日）用于' + event + '，评级' + luck,
        nextSteps: ['结合事主八字选日','避开冲煞','择吉时配合','重要仪式提前30天择定','黄历宜忌参考','多备1-2个候选日']
      };
    }
  },
  huangli: {
    name: '老黄历',
    diagnose: function(data){
      const date = (data && data.s0) || '2026-08-15';
      const d = new Date(date);
      const yi = ['祭祀','出行','入宅','嫁娶','开业','求财','签约','动土','修造','安葬'];
      const ji = ['动土','嫁娶','开市','安葬','出行','入宅','动土','修造','祭祀','祈福'];
      const seed = d.getDate() % 10;
      return {
        title: '老黄历查询（断网KB兜底）',
        date: date,
        yi: [yi[seed], yi[(seed+3)%10], yi[(seed+7)%10]],
        ji: [ji[(seed+1)%10], ji[(seed+5)%10]],
        ttsText: date + '，宜' + yi[seed] + '，忌' + ji[(seed+1)%10] + '。',
        summary: date + '宜：' + yi[seed] + '；忌：' + ji[(seed+1)%10],
        nextSteps: ['结合事主八字','避开冲煞日','择吉时配合','黄历仅作参考','重要决策看大局']
      };
    }
  },
  taisui: {
    name: '太岁',
    diagnose: function(data){
      const year = parseInt(data && data.s0) || 1985;
      const z = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'][(year - 4) % 12];
      const tianGan = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'][(year - 4) % 10];
      const diZhi = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][(year - 4) % 12];
      const clashes = {'子':'午','丑':'未','寅':'申','卯':'酉','辰':'戌','巳':'亥','午':'子','未':'丑','申':'寅','酉':'卯','戌':'辰','亥':'巳'};
      const dz2026 = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][2026 % 12];
      const fanTaiSui = clashes[diZhi] === dz2026;
      return {
        title: '太岁查询（断网KB兜底）',
        year: year, zodiac: z, tianGan: tianGan, diZhi: diZhi,
        ttsText: year + '年生肖' + z + '，2026年' + (fanTaiSui ? '冲太岁' : '与太岁无冲') + '。',
        summary: year + '年生肖' + z + '（' + tianGan + diZhi + '），2026：' + (fanTaiSui ? '⚠️ 冲太岁' : '✅ 平安'),
        nextSteps: ['2026年' + (fanTaiSui ? '宜化解太岁' : '顺其自然'),'年初祈福太岁','保持低调谨慎','避免高风险投资','重要决策择吉日','心态平和为上']
      };
    }
  }
};
console.log('✅ _MODULE_REPORTS loaded (14 modules KB-fallback: bazi/yunshi/caiyun/ganqing/zhongyi/mobile/shiye/xingming/zeri/huangli/taisui/music/lifeindex/lifeplan)');
</script>
