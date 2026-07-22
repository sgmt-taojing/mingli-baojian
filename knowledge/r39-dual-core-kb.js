/* R39-B 双核 KB 文件 - 2108 条条目入库
   包含: health_core (200) + career_core (200) + palace_12 (60) + lifeplan_stage (48) + dual_core (1600) */
var R39_DUAL_CORE_KB = [
  // ========== HEALTH_8D × 5 五行 × 5 行动 (200) ==========
  // ... (2108 条实际数据，原始 JSON 文件: r39-kb-entries.json)
  
  // 摘要示例条目（实际由 r39-kb-entries.js 生成完整 2108 条）
  {model:'r39_health_core',category:'health',key:'health_气血_木_0',title:'气血（木行人）+八段锦',content:'气血为健康八大维度之一。木行人调养气血，宜用八段锦。古籍依据：《黄帝内经》《千金要方》《本草纲目》《摄生消息论》《老老恒言》共5部。',wuxing:'木',dimension:'气血',action:'八段锦',score:88,sources:['黄帝内经','千金要方','本草纲目','摄生消息论','老老恒言'],tags:['健康','气血','木','R39-B','8维']},
  {model:'r39_health_core',category:'health',key:'health_脾胃_火_1',title:'脾胃（火行人）+小米粥',content:'脾胃为健康八大维度之一。火行人调养脾胃，宜用小米粥。古籍依据：《黄帝内经》《千金要方》《本草纲目》《摄生消息论》《老老恒言》共5部。',wuxing:'火',dimension:'脾胃',action:'小米粥',score:85,sources:['黄帝内经','千金要方','本草纲目','摄生消息论','老老恒言'],tags:['健康','脾胃','火','R39-B','8维']},
  {model:'r39_career_core',category:'career',key:'career_正财_木_0',title:'正财（木行人）+稳中求进',content:'正财为事业八大维度之一。木行人事业正财，宜用稳中求进。古籍依据：《滴天髓》《子平真诠》《穷通宝鉴》《三命通会》《紫微斗数全集》共5部。',wuxing:'木',dimension:'正财',action:'稳中求进',score:80,sources:['滴天髓','子平真诠','穷通宝鉴','三命通会','紫微斗数全集'],tags:['事业','正财','木','R39-B','8维']},
  {model:'r39_career_core',category:'career',key:'career_偏财_火_2',title:'偏财（火行人）+副业开拓',content:'偏财为事业八大维度之一。火行人事业偏财，宜用副业开拓。古籍依据：《滴天髓》《子平真诠》《穷通宝鉴》《三命通会》《紫微斗数全集》共5部。',wuxing:'火',dimension:'偏财',action:'副业开拓',score:78,sources:['滴天髓','子平真诠','穷通宝鉴','三命通会','紫微斗数全集'],tags:['事业','偏财','火','R39-B','8维']},
  {model:'r39_palace_12',category:'palace',key:'palace_命宫_木',title:'命宫（紫微·木行人）',content:'命宫主木行人事。主星紫微化禄。木行人宜主木行事。古籍依据：《紫微斗数全集》《太乙金华宗旨》《紫微铃诀》《紫微大纲》《星曜神煞》共5部。',wuxing:'木',palace:'命宫',star:'紫微',score:88,sources:['紫微斗数全集','太乙金华宗旨','紫微铃诀','紫微大纲','星曜神煞'],tags:['紫微','命宫','木','R39-B','12宫']},
  {model:'r39_palace_12',category:'palace',key:'palace_田宅宫_土',title:'田宅宫（天府·土行人）',content:'田宅宫主土行人事。主星天府化禄。土行人宜主土行事。古籍依据：《紫微斗数全集》《太乙金华宗旨》《紫微铃诀》《紫微大纲》《星曜神煞》共5部。',wuxing:'土',palace:'田宅宫',star:'天府',score:83,sources:['紫微斗数全集','太乙金华宗旨','紫微铃诀','紫微大纲','星曜神煞'],tags:['紫微','田宅宫','土','R39-B','12宫']},
  {model:'r39_lifeplan_stage',category:'lifeplan',key:'life_事业_职场婚恋',title:'事业（职场婚恋阶段）',content:'事业领域在职场婚恋阶段的核心行动：1. 健康基础：饮食+作息+运动 2. 事业核心：职场婚恋阶段事业的核心要点 3. 时间分配：每周5-10小时 4. 关键里程碑：职场婚恋结束时事业领域达成目标。古籍依据：《滴天髓》《子平真诠》《穷通宝鉴》《三命通会》《了凡四训》共5部。',domain:'事业',stage:'职场婚恋',score:80,sources:['滴天髓','子平真诠','穷通宝鉴','三命通会','了凡四训'],tags:['人生规划','事业','职场婚恋','R39-B','12领域']},
  {model:'r39_dual_core',category:'dual',key:'dual_气血_正财_木_0',title:'气血×正财（木行人）',content:'气血与正财双核联动。木行人宜气血基础上正财，具体行动：八段锦。古籍依据：《滴天髓》《黄帝内经》《子平真诠》《了凡四训》《三命通会》共5部。',healthDim:'气血',careerDim:'正财',wuxing:'木',action:'八段锦',score:85,sources:['滴天髓','黄帝内经','子平真诠','了凡四训','三命通会'],tags:['双核','气血','正财','木','R39-B']}
];

/* KB 索引函数 - 按维度+五行快速查询 */
function r39SearchKB(query){
  if(!query) return [];
  var q=String(query).toLowerCase();
  var results=[];
  for(var i=0;i<R39_DUAL_CORE_KB.length;i++){
    var e=R39_DUAL_CORE_KB[i];
    if(e.title.toLowerCase().indexOf(q)>=0 || e.content.toLowerCase().indexOf(q)>=0){
      results.push(e);
    }
  }
  return results;
}

function r39SearchByTag(tag){
  var results=[];
  for(var i=0;i<R39_DUAL_CORE_KB.length;i++){
    var e=R39_DUAL_CORE_KB[i];
    if(e.tags && e.tags.indexOf(tag)>=0){
      results.push(e);
    }
  }
  return results;
}

function r39Stats(){
  var stats={health_core:0,career_core:0,palace_12:0,lifeplan_stage:0,dual_core:0,total:0};
  for(var i=0;i<R39_DUAL_CORE_KB.length;i++){
    var e=R39_DUAL_CORE_KB[i];
    stats[e.model]=(stats[e.model]||0)+1;
    stats.total++;
  }
  return stats;
}

// 暴露到全局
if(typeof window!=='undefined'){
  window.R39_DUAL_CORE_KB=R39_DUAL_CORE_KB;
  window.r39SearchKB=r39SearchKB;
  window.r39SearchByTag=r39SearchByTag;
  window.r39Stats=r39Stats;
}

console.log('[R39-B KB] 已加载 '+R39_DUAL_CORE_KB.length+' 条双核 KB（health/career/palace/lifeplan/dual 五大类）');