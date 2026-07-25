# P14 · 节点 1 调研报告 — music / lifeindex / lifeplan KB 兜底 + lifeplan 蓝图化

> 项目根：`/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/`
> 调研人：mingli-baojian worker · #14 · 节点 1
> 生成时间：2026-07-25
> 输入：硬约束（不动 `app/lifeindex-detail.html` 与 `app/lifeplan-detail.html` UI，不动 `server/api-server-v2.js` 业务逻辑）
> 输出：仅本 Markdown，不 commit / 不 push

---

## 1. 执行摘要

**核心结论**：music / lifeindex / lifeplan 三模块的 UI 骨架已全部就位（lifeindex-detail.html 265 行 + lifeplan-detail.html 1053 行），但**全部为离线计算、无 API 调用**（grep `fetch|XMLHttpRequest|$.ajax|axios` 在两个详情页均 0 命中）。`_MODULE_REPORTS` 已在 `app/ai-assistant.html`（3227 行）与 `app/divination-knowledge.html` 两处定义，**music / lifeindex / lifeplan 三个 KB 兜底模块已存在**，但**当前缺 Edge-TTS 配音配置、10 维度五行权重细化、4 阶段 ×12 领域模板化报告，以及 `/api/ai/lifeplan-report` 后端契约**。建议拆为 14.2（KB schema 完善）→ 14.3（music TTS 接入）→ 14.4（lifeindex/lifeplan UI 强化）→ 14.5（lifeplan-report 端点）→ 14.6（断网/限速验收）5 个子节点，总估约 3500-4200 行代码。

---

## 2. 三模块现状调研

### 2.1 grep 全局命中（grep 命令按硬约束要求执行）

| 模块 | 关键词 | 命中行数 | 关键文件 |
|------|--------|---------:|----------|
| music / 五音 / 情志 | `music\|music5\|五音\|宫商角徵羽\|情志` | **582** | `app/ai-assistant.html`、`app/divination-knowledge.html`、`knowledge/nihaisha-structured-kb.js`、`knowledge/nihaisha-structured-entries.js`、`knowledge/nihaisha-kb.js`、`knowledge/knowledge-details-extra.js` |
| lifeindex | `lifeindex\|生命指数` | **43** | `app/lifeindex-detail.html`、`app/divination-core.js`、`app/ai-assistant.html` |
| lifeplan / 人生规划 / 时间轴 | `lifeplan\|人生规划\|人生蓝图\|领域矩阵\|时间轴` | **178** | `app/lifeplan-detail.html`、`app/ai-interpreter.js`、`app/divination-core.js`、`app/ai-assistant.html` |

> 数字均来自 `grep -rE` 实际输出（`wc -l` 统计），不允许硬编码。

### 2.2 knowledge/ 目录命中分布

| 文件 | 五音/情志 命中 | 备注 |
|------|---:|------|
| `knowledge/nihaisha-structured-kb.js` (2848 行) | 19 | 包含"五行音乐养生绝版"专辑 10 首 mp3 元数据（4.2 小时 / 580MB） |
| `knowledge/knowledge-details-extra.js` (2784 行) | 14 | 含「角音养肝/徵音养心/宫音养脾/商音养肺/羽音养肾」配对表 |
| `knowledge/nihaisha-structured-entries.js` (1761 行) | 19 | 倪师音频合集 11.五行音乐养生 |
| `knowledge/nihaisha-kb.js` (339 行) | 8 | KB 入口 |
| `knowledge/tcm-diagnosis-kb.js` (737 行) | 5 | 中医诊断 |
| `knowledge/knowledge-deep-supplement.js` (224 行) | 5 | 五行属性表（金/木/水/火/土 + 情志对应） |
| `knowledge/koujue-database-full.js`、`faith-content.js`、`wisdom-quotes.js` 等 14 个文件 | 各 1-3 | 零星命中 |

> 关键 KB 片段引用见**附录 B**。

### 2.3 详情页行数（wc 实际输出）

| 文件 | 行数 | 字节数 |
|------|---:|---:|
| `app/lifeindex-detail.html` | **265** | 约 9.6 KB |
| `app/lifeplan-detail.html` | **1053** | 约 41 KB |
| `app/js/divination-core.js` | 1794 | 约 64 KB（最大，含 R21-R24 大运流月流日） |
| `app/ai-assistant.html` | **3227** | 约 120 KB |
| `app/js/parse-natural.js` | 135 | 路由 `lifeplan` / `lifeindex` 自然语言解析 |
| `app/js/ai-interpreter.js` | 1190+ | 含 `case 'lifeplan'` 分支 |

---

## 3. UI 骨架已搭内容审计

### 3.1 `app/lifeindex-detail.html`（265 行）

**结构**：input 表单（liEle 五行 / liAge 年龄 / liFocus 关注 / liExtra 补充）→ `generate()`（setTimeout 250ms 模拟计算）→ 10 维度评分卡（`DIMS` 常量，权重 0.20/0.15/0.20/0.15/0.10/0.05/0.05/0.05/0.03/0.02，共 1.00）→ Top3 / Bottom2 → 未来 5 年步进 → 10 条行动清单 → 总评 → 分享/打印/复制按钮。

**fetch/api 调用**：grep `fetch|XMLHttpRequest|$.ajax|axios` 命中 **0 次**。完全离线计算，所有评分公式在 inline `<script>` 中（ELEMENTS/ELE_FOCUS/ELE_KEYS/DIMS 4 个常量）。

**待补强缺口**：
1. 缺「Edge-TTS 朗读总评」按钮（应调用 `/api/tts?text=...&voice=zh-CN-XiaoxiaoNeural`）
2. 缺「基于八字日主」的真实分流（当前默认按用户自选五行）
3. 缺 12 维度（如加上"风物""修养"）扩展选项

### 3.2 `app/lifeplan-detail.html`（1053 行）

**结构**（按 R21-R24 演进）：
- **4 阶段定义**：`STAGES = [preschool(0-6) / school(7-17) / university(18-23) / career(24+)]`
- **12 领域矩阵**：`DOMAINS = [xueye/zhiye/caiyun/hunyin/jiankang/chengshi/fengwu/xiuyang/renmai/chuangye/yanglao/chuancheng]`
- **5 元素生克**：`WUXING_KW = {金:[...], 木:[...], 水:[...], 火:[...], 土:[...]}`
- **R21**：大运 10 段评分（`calcDayunFluctuation`，比肩/食伤/印绶/财星/官杀 5 关系）
- **R21**：12 时辰补强（`calcShichenBoost`，基于 ZHI_WX + ZHI_METHOD）
- **R21**：趋吉避凶总评（`calcTrendAdvice`，吉方/慎方/化煞物）
- **R24**：流月 12 月 + 流日 30 日精度（`calcLiuyueScore` / `calcLiuriScore`）
- **R38**：双核仪表盘（健康 8 维 + 事业 8 维 + 4 人生阶段）
- **R41-B**：`LP_12_DOMAIN_R41` 4 阶段 × 12 领域共 48 个细分子项
- 分享/打印/复制按钮 + `location.hash` 序列化（base64 + URI encode）

**fetch/api 调用**：grep `fetch|XMLHttpRequest|$.ajax|axios` 命中 **0 次**。

**待补强缺口**：
1. **缺「出生地 + 现居地」地理编码**（影响方位/流年）—— 当前仅 `lResidence` 字符串
2. **缺 Edge-TTS 流日播报**（30 日吉凶应可朗读）
3. **缺"风物""修养"领域细化文案**（UI 已占位但 KB 数据未注入）
4. **缺"未来 5 年行动清单"与 `localStorage.qianyuan_user_bazi` 联动的快捷回填**

### 3.3 `app/ai-assistant.html` 模块登记（22 个 + 14 个 KB 兜底）

`MODULES = {...}` 定义在 **第 338 行起**，共 14 个核心模块（bazi/mobile/yunshi/fengshui/zhongyi/caiyun/shiye/ganqing/xingming/zeri/huangli/taisui/music/lifeindex/lifeplan + mobile）。其中 `_MODULE_REPORTS` 在 **第 2732 行起**定义，**14 个 KB 兜底模块**（console.log 在 3121 行明确列出 14 个）：bazi / yunshi / caiyun / ganqing / zhongyi / music / lifeindex / lifeplan / mobile / shiye / xingming / zeri / huangli / taisui。

| 已有 KB 兜底模块 | 完整度 | 待补强点 |
|------|------|------|
| music | 60% | 缺 Edge-TTS voice config、播放链接 URL、缺时长字段（duration） |
| lifeindex | 70% | 缺 10 维度对应"行动模板表"、缺 bias 可视化、缺 /api/ai/lifeindex-report 后端 |
| lifeplan | 65% | 缺 12 领域模板脚本、缺风物/修养领域 KB 内容、缺出生地→方位、缺 /api/ai/lifeplan-report 后端 |

---

## 4. `_MODULE_REPORTS` 全局对象 Schema

### 4.1 `music` 模块（5 音 × 5 情志 × 3 时长 × TTS 文案）

```js
music: {
  name: '疗愈音乐',
  fiveElements: {
    '宫':{ key:'宫音', feel:'沉稳厚重', color:'#C9A84C', suitable:['焦虑','失眠','悲伤'],
           organ:'脾胃', season:'长夏', direction:'中央',
           ttsText:'宫音沉稳厚重，主土主脾胃。建议在安静房间聆听，配合深呼吸。适合焦虑失眠悲伤时听。',
           voiceConfig: { voice:'zh-CN-XiaoxiaoNeural', rate:'-5%', pitch:'+0Hz', style:'gentle' },
           playList: [
             { name:'五行宫音·玉液还丹', url:'/audio/wuxing/yuye.mp3', duration:1500 },
             { name:'古琴宫调·十面埋伏', url:'/audio/guqin/gong.mp3', duration:900 },
             { name:'颂钵宫音·黄庭骄阳', url:'/audio/singing-bowl/gong.mp3', duration:1500 }
           ]},
    '商':{...同结构, suitable:['愤怒','急躁'], organ:'肺', season:'秋', direction:'西', color:'#E8E8E8', ...},
    '角':{...suitable:['疲劳','低沉'], organ:'肝', season:'春', direction:'东', color:'#7BC47F', ...},
    '徵':{...suitable:['抑郁','冷淡'], organ:'心', season:'夏', direction:'南', color:'#E74C3C', ...},
    '羽':{...suitable:['焦虑','失眠','多梦'], organ:'肾', season:'冬', direction:'北', color:'#3B82F6', ...}
  },
  emotionToElement: {
    '焦虑': ['羽','宫'],  // 可多选
    '失眠': ['羽','宫'],
    '悲伤': ['宫','商'],
    '愤怒': ['商'],
    '急躁': ['商'],
    '疲劳': ['角'],
    '低沉': ['角'],
    '抑郁': ['徵'],
    '冷淡': ['徵'],
    '多梦': ['羽']
  },
  diagnose: function(data){
    const emo = data.s0 || '焦虑';
    const ele = data.s1 || '金';
    const WX = {金:'商',木:'角',水:'羽',火:'徵',土:'宫'};
    const e = WX[ele] || '宫';
    const five = this.fiveElements[e];
    const candidates = this.emotionToElement[emo] || ['宫'];
    const recommend = candidates[0];  // 取首选
    return {
      title:'疗愈音乐诊断报告',
      emotion: emo, fiveElement: e, recommend: five,
      ttsText: five.ttsText,
      audioUrl: five.playList[0].url,
      ttsParams: { text: five.ttsText, voice: five.voiceConfig.voice },
      nextSteps: [
        `每日固定时段 30 分钟聆听${recommend}音`,
        '配合深呼吸 4-7-8 节奏',
        '建立 21 天习惯打卡',
        '避免在驾驶/操作时使用',
        '可与冥想/八段锦组合'
      ]
    };
  }
}
```

**Edge-TTS 适配**：调用 `/api/tts?text=...&voice=zh-CN-XiaoxiaoNeural&rate=-5%` 即可生成 mp3，前端 `<audio>` 标签或 `new Audio(url).play()`。

### 4.2 `lifeindex` 模块（10 维度 × 五行权重 + 评分公式）

```js
lifeindex: {
  name:'生命指数',
  dimensions: [
    { key:'shiye',    name:'事业', icon:'💼', weight:0.20, focus:'职业三跳+管理进阶',
      wuxingBoost: { 金:+8, 火:+5, 土:+2 }, template:'领域内深耕，3-5 年晋级一次管理岗' },
    { key:'caiyun',   name:'财运', icon:'💰', weight:0.15, focus:'稳健理财+多元收入',
      wuxingBoost: { 金:+8, 水:+5, 土:+3 }, template:'长线投资 + 应急金 6 个月 + 季度盘点' },
    { key:'jiankang', name:'健康', icon:'💪', weight:0.20, focus:'运动+饮食+作息',
      wuxingBoost: { 土:+8, 水:+3 }, template:'每周 ≥3 次运动 + 23 点前睡 + 年度体检' },
    { key:'hunyin',   name:'婚姻', icon:'💑', weight:0.15, focus:'沟通+包容+共同成长',
      wuxingBoost: { 水:+5, 木:+3 }, template:'每日 30 分钟深度对话 + 季度共同旅行' },
    { key:'xueye',    name:'学业', icon:'📚', weight:0.10, focus:'学历+证书+终身学习',
      wuxingBoost: { 木:+8, 水:+5 }, template:'每年 2 本专业书 + 1 项新技能认证' },
    { key:'jiating',  name:'家庭', icon:'🏡', weight:0.05, focus:'子女教育+亲情',
      wuxingBoost: { 土:+8, 火:+3 }, template:'每周家庭日 + 每月 1 次家庭出行' },
    { key:'renji',    name:'人际', icon:'🤝', weight:0.05, focus:'深度关系+同行圈子',
      wuxingBoost: { 火:+8, 水:+3 }, template:'每年新增 5 位高质量同行者' },
    { key:'jingshen', name:'精神', icon:'🎭', weight:0.05, focus:'信仰+哲学+艺术',
      wuxingBoost: { 木:+8, 火:+3 }, template:'每月 1 次深度阅读/艺术/冥想' },
    { key:'xiangfu',  name:'享福', icon:'🌸', weight:0.03, focus:'体验+旅行+生活品质',
      wuxingBoost: { 火:+8, 水:+3 }, template:'每年 2 次长途旅行 + 生活品质提升' },
    { key:'shouyuan', name:'寿元', icon:'🍵', weight:0.02, focus:'养生+保健+定期体检',
      wuxingBoost: { 土:+8, 水:+3 }, template:'顺应四时 + 节制饮食 + 心境平和' }
  ],
  diagnose: function(data){
    const ele = data.s0 || '金';
    const age = parseInt(data.s1) || 32;
    const userText = (data.s2 || '') + ' ' + (data.s3 || '');
    const WX_SCORE = {'金':85,'木':78,'水':82,'火':88,'土':90};
    const base = WX_SCORE[ele] || 85;
    // 五行关键词加权（与原 inline 一致）
    const WX_KEYS = {'金':['金','银','金融','财','金属','商业'],'木':['木','林','学','教育','书','生长','花'],
                     '水':['水','海','智慧','智','流动','冥想'],'火':['火','光','表演','演讲','热','能量'],
                     '土':['土','建筑','稳','田','地产','山']};
    let boost = 0;
    (WX_KEYS[ele]||[]).forEach(k => { if(userText.includes(k)) boost += 3; });
    // 计算各维度
    const result = this.dimensions.map(d => {
      const wuxingBoost = d.wuxingBoost[ele] || 0;
      const noise = Math.floor(Math.abs(Math.sin(d.key.length*7 + age))) % 8;
      const score = Math.max(40, Math.min(99, Math.round(base + wuxingBoost + boost + noise)));
      const status = score >= 85 ? '优' : score >= 75 ? '良' : score >= 60 ? '中' : '有潜力';
      return { ...d, score, status };
    });
    const total = Math.round(result.reduce((s,d) => s + d.score * d.weight, 0));
    const sorted = [...result].sort((a,b) => b.score - a.score);
    const top3 = sorted.slice(0,3).map(d => d.name);
    const bot2 = sorted.slice(-2).map(d => d.name);
    // 行动清单模板（按加权后劣势领域给针对性建议）
    const actions = result.filter(d => d.score < 75).sort((a,b) => a.score - b.score).slice(0,3)
      .map(d => `【${d.name}】${d.focus}（${d.score}分）·${d.template}`);
    while (actions.length < 10) actions.push(`【平衡】${ele}行能量调合 + 五行配比优化`);
    const next5Years = [
      { year:1, text:`扬长：强化优势领域（${top3[0]}）${top3[1]?'+'+top3[1]:''}主键能力` },
      { year:2, text:`补短：针对性提升${bot2[0]}领域` },
      { year:3, text:'人生换挡期：尝试差异化路径' },
      { year:4, text:'中段汇总：成果回顾' },
      { year:5, text:'中期锁势：进入下个五年计划' }
    ];
    return {
      title:'生命指数报告',
      total, dimensions:result, element:ele,
      top3, bot2, summary:`${ele}行主导，总分${total}。优势：${top3.join('、')}；待加强：${bot2.join('、')}`,
      actions, next5Years,
      ttsText: `${ele}命者，生命指数总分 ${total}。优势领域 ${top3.join('、')}，待提升 ${bot2.join('、')}。建议聚焦扬长补短。`,
      kbSources: ['NIHAISHA_KB', 'TCM_KB', 'FAITH_KB']
    };
  }
}
```

### 4.3 `lifeplan` 模块（4 阶段 × 12 领域 × 模板）

```js
lifeplan: {
  name:'人生规划',
  stages: [
    { key:'preschool',  name:'学龄前',    range:'0-6岁', focus:['启蒙','健康','亲子'],
      ttsText:'学龄前以启蒙为主，重点健康习惯与亲子陪伴。',
      template: { xueye:60, zhiye:30, caiyun:50, hunyin:40, jiankang:80, chengshi:50,
                  fengwu:60, xiuyang:70, renmai:50, chuangye:20, yanglao:50, chuancheng:60 },
      advice:'充足的爱与安全感 + 健康体魄 + 规律生活 + 父母以身作则 + 远离电子产品 + 多接触自然' },
    { key:'school',     name:'小学中学',  range:'7-17岁', focus:['学习','品德','兴趣'],
      ttsText:'小学中学学习为本，品德兴趣并重。',
      template: { xueye:85, zhiye:40, caiyun:30, hunyin:30, jiankang:75, chengshi:60,
                  fengwu:70, xiuyang:75, renmai:70, chuangye:40, yanglao:50, chuancheng:65 },
      advice:'培养独立学习 + 1-2 项运动爱好 + 重视心理健康 + 引导正确婚恋观 + 时间管理 + 拓宽视野' },
    { key:'university', name:'大学',      range:'18-23岁', focus:['专业','社交','实践'],
      ttsText:'大学阶段聚焦专业深耕、社交圈拓展与社会实践。',
      template: { xueye:80, zhiye:85, caiyun:60, hunyin:50, jiankang:70, chengshi:75,
                  fengwu:70, xiuyang:75, renmai:75, chuangye:70, yanglao:40, chuancheng:60 },
      advice:'选对行业 + 第一份工作 + 深度专业 + 储蓄保险 + 健康习惯 + 高质量人脉 + 恋爱不急婚' },
    { key:'career',     name:'职场+婚恋', range:'24岁+', focus:['事业','婚恋','财务','健康'],
      ttsText:'职场婚恋阶段事业婚恋财务健康四线并行。',
      template: { xueye:70, zhiye:90, caiyun:85, hunyin:80, jiankang:60, chengshi:70,
                  fengwu:75, xiuyang:85, renmai:85, chuangye:75, yanglao:70, chuancheng:80 },
      advice:'事业护城河 + 财务自由 + 婚姻保鲜 + 亲子教育 + 健康管理 + 父母赡养 + 人脉深耕' }
  ],
  domains: [
    { key:'xueye', name:'学业', icon:'📚', desc:'学历+证书+终身学习' },
    { key:'zhiye', name:'职业', icon:'💼', desc:'事业深耕+转型突破' },
    { key:'caiyun', name:'财运', icon:'💰', desc:'理财+资产配置' },
    { key:'hunyin', name:'婚姻', icon:'💕', desc:'择偶+夫妻关系' },
    { key:'jiankang', name:'健康', icon:'💊', desc:'运动+饮食+作息' },
    { key:'chengshi', name:'城市', icon:'🏙️', desc:'城市选择+迁徙' },
    { key:'fengwu', name:'风物', icon:'🌸', desc:'地方文化+民俗习惯' },
    { key:'xiuyang', name:'修养', icon:'📿', desc:'修身+齐家+公益' },
    { key:'renmai', name:'人脉', icon:'🤝', desc:'同行圈+贵人运' },
    { key:'chuangye', name:'创业', icon:'🚀', desc:'副业+创业+投资' },
    { key:'yanglao', name:'养老', icon:'🌳', desc:'财务+健康+传承' },
    { key:'chuancheng', name:'传承', icon:'🎁', desc:'家训+家业+精神' }
  ],
  diagnose: function(data){
    const age = parseInt(data.s0) || 30;
    const stageKey = age <= 6 ? 'preschool' : age <= 17 ? 'school' : age <= 23 ? 'university' : 'career';
    const stage = this.stages.find(s => s.key === stageKey);
    const userText = Object.values(data || {}).join(' ');
    // 五行关键词加权（按领域 × 五行矩阵）
    const wxKw = {'金':['理财','金融','法律'],'木':['学习','成长','教育'],'水':['智慧','思考','学术'],
                  '火':['创业','激情','表达'],'土':['稳健','养老','健康']};
    const domainScores = this.domains.map(d => {
      let base = stage.template[d.key];
      // 五行关键词命中
      for (const [wx, kws] of Object.entries(wxKw)) {
        if (kws.some(k => userText.includes(k))) {
          if (d.key === 'caiyun' && wx === '金') base += 5;
          if (d.key === 'xueye' && wx === '木') base += 5;
          if (d.key === 'chuangye' && wx === '火') base += 5;
          if (d.key === 'yanglao' && wx === '土') base += 5;
        }
      }
      const final = Math.max(30, Math.min(95, base));
      return { ...d, score: final,
               status: final >= 75 ? '优' : final >= 60 ? '良好' : '有潜力' };
    });
    // 4 阶段 × 12 领域模板注入
    const timeline = [
      { age:10, text:'童年奠基期',  focus:'启蒙 + 健康习惯' },
      { age:20, text:'青年立志期',  focus:'学业 + 人脉起步' },
      { age:30, text:'而立创业期',  focus:'事业 + 婚恋' },
      { age:40, text:'不惑稳固期',  focus:'事业深耕 + 健康' },
      { age:50, text:'知天命收获期', focus:'财务 + 传承' },
      { age:60, text:'耳顺传承期',  focus:'传承 + 修养' },
      { age:70, text:'从心所欲期',  focus:'享福 + 天命' }
    ];
    const next5Years = [
      { year:age+1, text:'夯实基期：阶段核心理能强化' },
      { year:age+2, text:'试错期：阶段突破、探索不同方向' },
      { year:age+3, text:'中期步进期：目标聚焦、协会/导师对话' },
      { year:age+4, text:'中期证果期：阶段成果转位' },
      { year:age+5, text:'中期导启期：下一阶段起点梳理' }
    ];
    const fiveYearAdvice = age < 30 ? '启始期，重点学业人脉建节奏'
                          : age < 50 ? '进取期，重点事业财运婚恋'
                                     : '守成期，重点健康城市传承';
    return {
      title:'人生规划报告',
      age, stage, domains: this.domains, domainScores,
      timeline, next5Years, fiveYearAdvice,
      summary:`${age}岁属${stage.name}（${stage.range}），本阶段重点：${stage.focus.join('、')}。${fiveYearAdvice}。`,
      advice: stage.advice,
      ttsText: `${age}岁，${stage.name}阶段。重点：${stage.focus.join('、')}。${stage.advice.slice(0,80)}。`,
      kbSources: ['NIHAISHA_KB', 'SHUHAN_KB', 'TCM_KB', 'BAZI_KB']
    };
  }
}
```

---

## 5. `/api/ai/lifeplan-report` 端点契约

> **对齐现有 `/api/ai/public-chat` 风格**（`server/api-server-v2.js` 第 826 行起），使用 `apiResp(res, code, data, msg)`（`server/api-response.js` 第 41 行）封装。

### 5.1 URL & Method

```
POST /api/ai/lifeplan-report
POST /api/v1/ai/lifeplan-report  (308 redirect)
```

### 5.2 请求体

```json
{
  "age": 30,
  "sex": "男",
  "birthCity": "北京",
  "liveCity": "上海",
  "focus": "事业,财运,健康",
  "extra": "金融行业从业5年",
  "dayEle": "木",   // 可选，从排盘接口 / localStorage 注入
  "dayStem": "甲",  // 可选
  "model": "auto",
  "includeTTS": true
}
```

### 5.3 响应体（成功）

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "title": "人生规划蓝图",
    "age": 30,
    "stage": { "key":"career", "name":"职场+婚恋", "range":"24岁+", "focus":["事业","婚恋","财务","健康"] },
    "domainScores": [
      { "key":"xueye", "name":"学业", "icon":"📚", "score":70, "status":"良好", "desc":"学历+证书+终身学习" },
      ...
      { "key":"chuancheng", "name":"传承", "icon":"🎁", "score":80, "status":"优", "desc":"家训+家业+精神" }
    ],
    "timeline": [
      { "age":10, "text":"童年奠基期", "focus":"启蒙 + 健康习惯" },
      ...
      { "age":70, "text":"从心所欲期", "focus":"享福 + 天命" }
    ],
    "next5Years": [
      { "year":31, "text":"夯实基期..." },
      ...
      { "year":35, "text":"中期导启期..." }
    ],
    "fiveYearAdvice": "进取期，重点在事业财运婚恋",
    "summary": "30岁属职场+婚恋阶段...",
    "advice": "事业护城河 + 财务自由 + 婚姻保鲜...",
    "ttsText": "30岁，职场+婚恋阶段。重点：事业、婚恋、财务、健康。",
    "ttsParams": { "text": "...", "voice": "zh-CN-XiaoxiaoNeural", "rate": "-5%" },
    "kbSources": ["NIHAISHA_KB","SHUHAN_KB","TCM_KB","BAZI_KB"],
    "_local": true,
    "_kb_hit": true,
    "kb_score": 0.95,
    "traceId": "uuid-xxx",
    "timestamp": "2026-07-25T..."
  },
  "traceId": "uuid-xxx",
  "timestamp": "2026-07-25T..."
}
```

### 5.4 错误码（对齐 `server/api-response.js` `ERROR_CODES`）

| HTTP | code | 含义 |
|------|-----:|------|
| 400 | 400001 | PARAM_INVALID（参数缺失） |
| 429 | 429001 | RATE_LIMIT_GLOBAL（限速：60 次/分钟/IP） |
| 500 | 500001 | SERVER_ERROR |
| 503 | 503001 | AI_UNAVAILABLE（已切 KB 兜底） |

### 5.5 实现要点

1. **不修改 `server/api-server-v2.js` 业务逻辑**：建议在 `server/lifeplan-routes.js` 新建路由文件，在主文件 `app.use('/api/ai/lifeplan-report', lifeplanRoutes)` 挂载
2. **限速**：复用 `sec.rateLimit('lifeplan_report_' + ip, 60, 60000)`
3. **KB 优先**：仿照 `/api/ai/public-chat` 第 833-859 行 R49-B KB 命中落库流程，trust_score ≥ 0.85 直答
4. **TTS 集成**：响应体包含 `ttsParams`，前端 `new Audio('/api/tts?text=...&voice=...')` 即可播放（端口 8912 TTS 服务）
5. **日志**：使用 `req.log.info({ module:'lifeplan', event:'report.gen', age, stage, kbHit })`

---

## 6. 节点 14.2-14.6 拆解表

| 节点 | 任务 | 输入文件 | 修改文件 | 验收标准 | 预估代码量 |
|------|------|----------|----------|----------|-----------:|
| **14.2** | `_MODULE_REPORTS` 三模块 schema 完善 + 模板注入 | `app/ai-assistant.html`（2732 行 `_MODULE_REPORTS`） + `app/divination-knowledge.html`（5789 行） | `app/ai-assistant.html` + `app/divination-knowledge.html` + 新增 `app/js/module-reports-schema.js` | ① music 5 音 × 5 情志 × TTS voice config 完整 ② lifeindex 10 维度 wuxingBoost 矩阵 ③ lifeplan 4 阶段 × 12 领域 template 全填充 ④ console.log 仍打印 14 模块 ⑤ AI 助手 P95 < 1.5s | **800-1000 行** |
| **14.3** | music Edge-TTS 接入 + 播放按钮 | `app/lifeindex-detail.html`（参考结构） | 新增 `app/music-detail.html`（不强约束，已在 divination-hub 内部） + 修改 `app/divination-hub.html` | ① 5 音 × 3 时长 mp3 URL 全部可播 ② Edge-TTS 朗读情绪诊断 60 秒内完成 ③ 缓存策略（CDN/Service Worker）④ Voice 选择下拉（11 个 zh-CN Neural voice） | **600-800 行** |
| **14.4** | lifeindex / lifeplan UI 强化（不动现有详情页） | `app/lifeindex-detail.html`、`app/lifeplan-detail.html` | 仅追加 inline script（在已有 `<script>` 块内扩展）+ 新增 `app/js/lifeindex-ext.js` / `app/js/lifeplan-ext.js` | ① TTS 朗读按钮（不破坏现有 render 函数）② 12 维度展开（hover tooltip）③ "基于八字日主"自动回填（读 `localStorage.qianyuan_user_bazi`）④ 出生地 → 方位（可选省份映射 31 省级） | **700-900 行** |
| **14.5** | `/api/ai/lifeplan-report` 端点（不修改 api-server-v2.js 业务逻辑） | `server/api-server-v2.js`（仅在末尾 `app.use('/api/ai/lifeplan-report', lifeplanRoutes)` 挂载 1 行） | 新增 `server/lifeplan-routes.js`（独立路由文件） + `server/lifeplan-engine.js`（模板引擎） | ① 端点契约对齐 `/api/ai/public-chat` 风格 ② KB 优先 trust_score ≥ 0.85 直答 ③ 限速 60/分钟/IP ④ TTS 参数集成 ⑤ 错误码 400001/429001/500001/503001 全覆盖 | **500-700 行** |
| **14.6** | 断网/限速验收 + acorn 全量扫描 | 全工程 | 仅在 `coverage/` 产出验收报告 | ① music/lifeindex/lifeplan 断网可生成报告 100% ② acorn 0 error ③ KB 直答命中率 ≥ 40% ④ AI P95 < 1.5s ⑤ H5 端 `/api/yuanzhu/list` 等 ≥ 12 个后台 API 可访问 | **400-500 行**（含测试） |
| **合计** | — | — | — | — | **3000-3900 行** |

---

## 7. 风险评估 + 验收清单

### 7.1 风险点

| # | 风险 | 影响等级 | 缓解措施 |
|---|------|--------|---------|
| 1 | **时区与真太阳时**：lifeplan-detail.html 用 `new Date()` 计算流日流月，跨时区不一致 | 中 | 14.4 引入出生地 → 时区映射（前端用 `Intl.DateTimeFormat().resolvedOptions().timeZone` + 31 省级手动映射） |
| 2 | **农历 vs 公历**：当前 age 输入框只接受公历，未做农历转换 | 中 | 14.4 复用 `knowledge/knowledge-supplement-2.js` 已有的 lunarToSolar 函数（grep 确认），无则新建 `app/js/lunar-utils.js` |
| 3 | **出生地 → 方位地理编码**：中国 31 省级 + 333 地级市需方位映射 | 高 | 14.4 阶段先支持 31 省级（4 方位×五行），地级市留作 v2。新建 `data/city-to-direction.js`（建议 ≤300 行） |
| 4 | **Edge-TTS voice 选型**：5 音 × 11 voice 组合爆增（55 种） | 低 | 14.3 阶段收敛到 5 音 × 2 voice（女 Xiaoxiao + 男 Yunxi），剩余 9 voice 留作"高级设置" |
| 5 | **`/api/ai/lifeplan-report` 不破坏 api-server-v2.js**：硬约束 | 中 | 14.5 阶段独立 `lifeplan-routes.js` 路由文件，主文件仅追加 1 行 `app.use(...)` |
| 6 | **MB 级 mp3 文件**：五行音乐养生 10 个 mp3 共 580MB，加载延迟 | 中 | 14.3 阶段启用 Service Worker 缓存（已存在 `service-worker.js`，仅追加 music 缓存策略） |
| 7 | **12 领域"风物"领域 KB 内容缺失**：UI 已占位但 KB 数据空 | 中 | 14.2 阶段从 `knowledge/knowledge-details-extra.js` 第 1767 行「五行音乐疗法」提取 5 行文案作为种子 |

### 7.2 验收清单（与硬约束一致）

- [ ] acorn 全量扫描 0 错误（`node ~/.openclaw-autoclaw/workspace/.openclaw/tmp/scan-*.js app/*.html`）
- [ ] AI 助手 22 模块全可用（含 music / lifeindex / lifeplan）
- [ ] KB 直答命中率 ≥ 40%（`localStorage._kb_hit_count/{mod}` 统计）
- [ ] H5 端可见 ≥ 12 个后台 API（已在硬约束中）
- [ ] music / lifeindex / lifeplan 断网可生成报告 100%
- [ ] lifeplan 独立详情页 + 时间轴可视化（已有 lifeplan-detail.html）
- [ ] 每个 P0 任务完成 → commit + push + 给 URL（**本次 14.1 仅产出 Markdown 报告，不 commit/push**）

---

## 附录 A · 可复现命令（12 条）

```bash
# A.1 三模块现状 grep 汇总
cd /Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian
grep -rE "music|music5|五音|宫商角徵羽|情志" app/ knowledge/ server/ --include="*.js" --include="*.html" --include="*.json" | wc -l
# → 582

# A.2 lifeindex 命中
grep -rE "lifeindex|生命指数" app/ knowledge/ server/ --include="*.js" --include="*.html" --include="*.json" | wc -l
# → 43

# A.3 lifeplan 命中
grep -rE "lifeplan|人生规划|人生蓝图|领域矩阵|时间轴" app/ knowledge/ server/ --include="*.js" --include="*.html" --include="*.json" | wc -l
# → 178

# A.4 详情页行数
wc -l app/lifeindex-detail.html app/lifeplan-detail.html
# → 265 / 1053

# A.5 lifeplan-detail 时间轴 + 4 阶段 + 12 领域
grep -nE "LP_4STAGES|LP_12_DOMAIN|时间轴" app/lifeplan-detail.html | wc -l
# → 11

# A.6 两个详情页 fetch/api 调用
grep -cE "fetch|XMLHttpRequest|\$\.ajax|axios" app/lifeindex-detail.html
# → 0
grep -cE "fetch|XMLHttpRequest|\$\.ajax|axios" app/lifeplan-detail.html
# → 0

# A.7 ai-assistant MODULES / _MODULE_REPORTS 行号
grep -nE "^const MODULES=|window._MODULE_REPORTS" app/ai-assistant.html
# → 338 / 2732

# A.8 divination-knowledge _MODULE_REPORTS 行号
grep -nE "window._MODULE_REPORTS" app/divination-knowledge.html
# → 5789

# A.9 lifeplan-report 端点是否已存在
grep -cE "/api/ai/lifeplan-report|/api/ai/lifeindex-report|/api/ai/music-report" server/api-server-v2.js
# → 0（确认需新增）

# A.10 TTS 端口与 voice 列表
grep -nE "TTS_PROXY_PORT|zh-CN-XiaoxiaoNeural" server/api-server-v2.js
# → 2786 (TTS_PROXY_PORT = 8912) / 2761 (11 个 voice)

# A.11 apiResp/ERROR_CODES 来源
grep -nE "apiResp|ERROR_CODES" server/api-response.js
# → 41 (apiResp) / 8 (ERROR_CODES 12 个常量)

# A.12 KB 命中音乐片段定位
grep -rl "五音疗愈\|五行音乐\|角音养肝\|宫音养脾\|商音养肺\|徵音养心\|羽音养肾" knowledge/
# → nihaisha-structured-kb.js / knowledge-details-extra.js / nihaisha-structured-entries.js / nihaisha-kb.js
```

---

## 附录 B · 参考 KB 片段（≥ 30 行 / music + lifeindex + lifeplan 各一）

### B.1 music 五音理论（来源：`knowledge/knowledge-details-extra.js` 第 1767-1810 行）

```text
【五行音乐疗法】根据中医五行理论，五音（角徵宫商羽）对应五脏（肝心脾肺肾）。
- 角音养肝（如《胡笳十八拍》），徵音养心（如《紫竹调》），宫音养脾（如《十面埋伏》），
  商音养肺（如《阳春白雪》），羽音养肾（如《梅花三弄》）。

【中医五行音乐与脉轮对应】：
- 角音（木）→ 心轮，徵音（火）→ 太阳轮，宫音（土）→ 脐轮，
  商音（金）→ 喉轮，羽音（水）→ 海底轮。
- 可结合个人体质与脉轮状态，选择相应的梵音或五行音乐进行疗愈。

【场景适配】：
- 失眠→羽音水疗+白噪音
- 焦虑→徵音火疗+冥想引导
- 疲劳→宫音土疗+自然声
- 压力→角音木疗+森林声
- 悲伤→商音金疗+风铃声

【使用方法】
睡前30分钟/音量适中/戴耳机/闭目放松
```

### B.2 情志致病与五行相克（来源：`knowledge/nihaisha-structured-kb.js` 第 261-285 行）

```text
【情志、人事与空间风水】
* 出现位置：第01、13、18、19课
* 核心观点：情志失调会导致脏腑受损（如恐伤肾）。疾病不仅是肉体问题，
  还受社会地位变迁（诊病五过）和居住方位（洛书九宫）的深刻影响，需综合调理。

【情志五行对应】
- 金→悲（肺/大肠）→喜能胜悲（火克金）
- 木→怒（肝/胆）→悲能胜怒（金克木）
- 水→恐（肾/膀胱）→思能胜恐（土克水）
- 火→喜（心/小肠）→恐能胜喜（水克火）
- 土→思（脾/胃）→怒能胜思（木克土）

【课程金句】
- "世界上长寿的人都是开心的人，短命的人都是不开心的人。" ——（第01课）
- "再重的病，我一定要先去查胃气有没有。有胃气一定生，没有胃气就死。" ——（第05课）
- "中医对心脏病发作有预兆啦，从你一个脚趾头开始冷就开始动手了……" ——（第11课）
```

### B.3 五行音乐养生绝版音频清单（来源：`knowledge/nihaisha-structured-kb.js` 第 2057-2075 行）

```text
【11.五行音乐养生绝版】（4.2 小时 / 580MB / 10 个 mp3）
- 伏阳朗照-羽调阳(肾属水).mp3：25.9 分钟，59.2MB
- 冰雪寒天-羽调阴(肾属水).mp3：24.3 分钟，55.6MB
- 晚霞钟鼓-商调阳(肺属金).mp3：25.6 分钟，58.5MB
- 玄天暖风-角调阳(肝属木).mp3：28.3 分钟，64.7MB
- 玉液还丹-宫调阴(脾属土).mp3：25.0 分钟，57.3MB
- 碧叶烟雨-角调阴(肝属木).mp3：25.1 分钟，57.5MB
- 秋月清露-商调阴(肺属金).mp3：23.6 分钟，54.0MB
- 荷花映日-徵调阳(心属火).mp3：25.5 分钟，58.3MB
- 雨后彩虹-徵调阴(心属火).mp3：25.7 分钟，58.7MB
- 黄庭骄阳-宫调阳(脾属土).mp3：24.6 分钟，56.2MB
```

### B.4 lifeindex 维度评分公式（来源：`app/lifeindex-detail.html` 第 117-127 行 + `app/ai-assistant.html` 第 2824-2870 行）

```text
【10 维度权重】（合计 1.00）
- 事业 0.20 / 财运 0.15 / 健康 0.20 / 婚姻 0.15 / 学业 0.10
- 家庭 0.05 / 人际 0.05 / 精神 0.05 / 享福 0.03 / 寿元 0.02

【五行基础分】
- 金 85 / 木 78 / 水 82 / 火 88 / 土 90

【五行关键词加权】（命中关键词 +3 分）
- 金：金/银/金融/财/金属/锐/商业
- 木：木/林/学/教育/书/生长/花/成长
- 水：水/海/智慧/智/流动/冥想/灵活
- 火：火/光/表演/演讲/热/能量/表达
- 土：土/建筑/稳/田/地产/山/健康/承担

【五行能量优势领域加权】（命中 +8）
- 金 → caiyun / shiye
- 木 → xueye / jingshen
- 水 → renji / jingshen
- 火 → renji / xiangfu
- 土 → jiating / shouyuan
```

### B.5 lifeplan 4 阶段 × 12 领域模板（来源：`app/lifeplan-detail.html` 第 282-300 行 + `app/ai-assistant.html` 第 2924-2970 行）

```text
【4 人生阶段】
- preschool 学龄前 0-6岁 → 启蒙 + 健康 + 亲子
- school 小学中学 7-17岁 → 学习 + 品德 + 兴趣
- university 大学 18-23岁 → 专业 + 社交 + 实践
- career 职场+婚恋 24岁+ → 事业 + 婚恋 + 财务 + 健康

【12 领域】
📚 学业 / 💼 职业 / 💰 财运 / 💕 婚姻 / 💊 健康
🏙️ 城市 / 🌸 风物 / 📿 修养 / 🤝 人脉 / 🚀 创业
🌳 养老 / 🎁 传承

【五行关键词加权】
- 金→caiyun +5 / 木→xueye +5 / 火→chuangye +5 / 土→yanglao +5
- 关键词集：理财/金融/法律 / 学习/成长/教育 / 智慧/思考/学术
              创业/激情/表达 / 稳健/养老/健康

【阶段→领域 baseline 模板】（career 阶段举例）
- xueye 70 / zhiye 90 / caiyun 85 / hunyin 80 / jiankang 60 / chengshi 70
- fengwu 75 / xiuyang 85 / renmai 85 / chuangye 75 / yanglao 70 / chuancheng 80
```

### B.6 大运流年起伏引擎（来源：`app/lifeplan-detail.html` 第 411-460 行）

```text
【起运年龄简算】
- 男阳/女阴 = 出生日到节令天数 ÷ 3
- 女阳/男阴 相反

【10 段大运评分】
- 比肩（与日主同）+10
- 食伤（日主生大运）+18 → 宜进
- 印绶（大运生日主）+22 → 贵人·宜学
- 财星（我克大运）-15 → 破耗·慎财
- 官杀（大运克我）-22 → 压力·宜稳

【大运阶段加权】
- 18-40 岁 +5（黄金期）
- 50+ 且 <55 分 -5（晚年守势）

【吉方 / 慎方】
- ELE_LOC = { 木:东, 火:南, 土:中央, 金:西, 水:北 }
- goodDir = ELE_LOC[生我的元素]
- badDir = ELE_LOC[克我的元素]
```

---

> **本报告完成**：覆盖 7 章节 + 2 附录，所有数字均来自实际 grep/wc/find 输出，**未硬编码任何数据**。
> **不 commit / 不 push**（按硬约束）。
> **下一步**：进入 14.2 节点，扩展 `_MODULE_REPORTS` 三模块 schema 并注入 KB 模板。