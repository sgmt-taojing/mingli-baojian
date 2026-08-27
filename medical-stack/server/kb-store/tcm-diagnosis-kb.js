window.TCM_DIAGNOSIS_KB = window.TCM_DIAGNOSIS_KB || {};

// === 望诊总索引 ===
// 眼诊/手诊/总索引
// 来源：路总《先知智镜》规划专项补强（2026-07-24）+ R42 子模块拆分
// 拆分原因：原文件 65KB 单文件过长，按诊断方法拆分为 3 个独立 KB
//   · tcm-symptom-kb.js    — 症状辨证（31 症状 → 证候映射）
//   · tcm-tongue-kb.js     — 舌诊（28 舌象，倪海厦完整版）
//   · tcm-diagnosis-kb.js  — 眼诊/手诊 + 总索引（本文件）

window.TCM_DIAGNOSIS_KB.eyeDiagnosis = {
  fiveRings: {
    windRing:'黑睛-肝', bloodRing:'内外眦-心', qiRing:'白睛-肺',
    waterRing:'瞳神-肾', fleshRing:'胞睑-脾'
  },
  redEyes: { shiRe:'肝火/风热', xuRe:'阴虚火旺', jiang:'热入营血' },
  yellowEyes: { bright:'阳黄(湿热)', dark:'阴黄(寒湿)' },
  corner: { chiLan:'心火', danBai:'血虚' },
  pupil: { big:'肝风内动', small:'热毒/中毒', color:'内障' },
  nebula: { new:'风热/肝火', old:'虚证' },
  // ========== 眼镜端眼科扩展（先知智镜显微镜头专项）==========
  sclera: {
    clearNormal:'白睛清亮——肺气充沛(健康)',
    bloodRed:'白睛红赤——肺热/风热',
    spotRed:'白睛斑点状红——心火/内热',
    diffuseRed:'白睛弥漫性红——肝火上炎',
    veinDark:'白睛脉络深红——瘀血阻络',
    yellowSclera:'白睛黄染——黄疸/湿热',
    blueVeins:'白睛脉络青蓝——寒/痛/惊风',
    blackSpot:'白睛黑点——疒坚/陈旧瘀血',
    varicosed:'白睛脉络弯曲怒张——肝郁气滞血瘀',
    pterygium:'胬肉攀睛——心肺热盛'
  },
  eyelid: {
    swelling:'胞睑浮肿——脾虚湿盛/肾虚水泛',
    redness:'胞睑红肿——脾胃热毒',
    droop:'上胞下垂——脾虚气陷/中风先兆',
    darkCircle:'胞睑晦暗——肾虚',
    xanthoma:'胞睑黄色瘤——痰湿瘀阻',
    twitch:'胞睑跳动——肝血不足/肝风内动'
  },
  pupil: {
    // 简化版（眼镜端快速辨证）
    big:'肝风内动',
    small:'热毒/中毒',
    color:'内障',
    // 扩展版（显微镜头专项）
    normalReaction:'对光反射灵敏——肾精充足',
    slowReaction:'对光反射迟钝——肾精不足/中风先兆',
    fixedDilation:'瞳孔散大不收——肾精耗竭/中风危症',
    fixedConstriction:'瞳孔缩小不展——肝火/中毒',
    unequal:'双侧瞳孔不等大——中风重症/脑病'
  }
};
;

window.TCM_DIAGNOSIS_KB.handDiagnosis = {
  color: { red:'热/血热', blue:'寒/痛/瘀', white:'气血虚', black:'肾虚/重病' },
  fish: {
    red:'胃热', blue:'寒/痛', dry:'脾胃虚弱', vein:'胃肠瘀滞'
  },
  nail: {
    white:'血虚/气血虚', red:'热', blue:'寒/痛', yellow:'黄疸',
    pressWhiteRed:'气血流畅(正常)', pressWhiteStuck:'气血瘀滞'
  },
  childFinger: {
    threeGuan:['风关(食指第一节)','气关(第二节)','命关(第三节)'],
    fuChen:'浮表沉里',
    redPurple:'热', blueBlack:'惊风/寒',
    reachMing:'病重'
  },
  // ========== 眼镜端手诊扩展（先知智镜可变焦镜头）==========
  palmCrease: {
    wenYuDeep:'纹路深长清晰——气血充沛(健康)',
    wenYuShallow:'纹路浅淡——气血虚衰',
    chuanZhi:'川字纹——性格刚毅，肝气旺盛',
    duanZhi:'断掌纹(通贯纹)——先天禀赋特殊，警惕心血管疾病',
    yuXing:'鱼际横纹——脾胃/消化系统病变',
    daoRen:'倒人字纹——感情丰富，肝郁倾向',
    taiYangShi:'太阳线(第9丘)——心脑血管/情绪调节'
  },
  palmShape: {
    normal:'手掌厚度适中——气血充沛',
    thin:'手掌瘦薄——气阴两虚',
    thick:'手掌肥厚——痰湿体质',
    flabby:'松软无弹性——脾虚湿困',
    dry:'枯燥皲裂——血虚/阴虚',
    sweat:'多汗黏腻——阳虚/痰湿'
  },
  fingerNail: {
    pinkSmooth:'甲色粉红润泽——气血充足(健康)',
    paleWhite:'甲色淡白——血虚/气血两虚',
    deepRed:'甲色深红——热证/血热',
    bluishPurple:'甲色青紫——寒证/瘀血/心阳虚',
    yellowThick:'甲色黄厚——湿热/黄疸',
    thinBrittle:'甲薄易脆——肝血不足/阴虚',
    ridged:'甲面纵纹——肝血不足/亚健康',
    spoon:'匙状甲(反甲)——血虚/严重贫血',
    beau:'横沟(Beau 线)——重症后/外伤/营养不良'
  },
  palmRegion: {
    daYuJi:'大鱼际红润——脾胃健运',
    xiaoYuJi:'小鱼际红润——肾气充足',
    mingTang:'明堂(掌心)光润——心气充沛',
    tanZhong:'掌心发热——阴虚内热',
    fingerTip:'十指尖发热——阴虚火旺'
  }
};
window.TCM_DIAGNOSIS_KB.fiveSensIntegration = [
  '舌+面+目+手+耳 综合判断 八纲',
  '脉诊由智能手表脉象采集(后续硬件扩展)',
  '眼镜端采集 - 5诊交叉验证 - AI 八纲辨证'
];
// ========== 眼镜端 28 舌象分类体系（先知智镜舌诊专项）==========
;

// === 总索引（用于推荐 + 图谱关联） ===
window.TCM_DIAGNOSIS_KB.modules = ['symptom_engine', 'eyeDiagnosis', 'handDiagnosis', 'tongue28'];
window.TCM_DIAGNOSIS_KB.moduleNames = {
  symptom_engine: '症状辨证',
  eyeDiagnosis: '目诊（五轮/白睛/瞳神）',
  handDiagnosis: '手诊（甲/掌/纹）',
  tongue28: '舌诊 28 象'
};
window.TCM_DIAGNOSIS_KB.statistics = {
  symptoms: 31,
  tongueImages: 28,
  eyeItems: 36,
  handItems: 28
};

console.log('[tcm-diagnosis-kb.js] 望诊总索引已加载（眼诊+手诊+索引）');
