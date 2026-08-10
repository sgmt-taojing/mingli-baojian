/**
 * WX_DIM_BIAS — 五行 × 12 维度权重偏差（共享权威版）
 *
 * 用法：
 *   <script src="app/js/wx-dim-bias.js"></script>
 *   const bias = window.WX_DIM_BIAS[ele][dimKey] || 0;
 *
 * 12 维度 key：
 *   shiye/caiyun/jiankang/hunyin/xueye/jiating/renji/jingshen/xiangfu/shouyuan/fengwu/xiuyang
 *
 * 五行值：
 *   金=1~8 / 木=1~8 / 水=1~8 / 火=1~8 / 土=1~8
 *
 * 版本：R41-DR1-2026-07-25
 */
(function(global){
  'use strict';

  const WX_DIM_BIAS = {
    '金':{
      shiye:+6, caiyun:+8, jiankang:+2, hunyin:+1,
      xueye:+1, jiating:0,  renji:+1,   jingshen:0,
      xiangfu:+1, shouyuan:+1, fengwu:+1, xiuyang:+1
    },
    '木':{
      shiye:+2, caiyun:+2, jiankang:+2, hunyin:+1,
      xueye:+8, jiating:+1, renji:+2,   jingshen:+6,
      xiangfu:+2, shouyuan:+2, fengwu:+5, xiuyang:+5
    },
    '水':{
      shiye:+2, caiyun:+2, jiankang:+1, hunyin:+2,
      xueye:+6, jiating:0,  renji:+6,   jingshen:+7,
      xiangfu:+1, shouyuan:+2, fengwu:+2, xiuyang:+6
    },
    '火':{
      shiye:+5, caiyun:+3, jiankang:+2, hunyin:+4,
      xueye:+1, jiating:+1, renji:+5,   jingshen:+2,
      xiangfu:+4, shouyuan:+1, fengwu:+2, xiuyang:+3
    },
    '土':{
      shiye:+2, caiyun:+2, jiankang:+6, hunyin:+2,
      xueye:+1, jiating:+6, renji:+1,   jingshen:+2,
      xiangfu:+3, shouyuan:+7, fengwu:+4, xiuyang:+5
    }
  };

  // 12 维度 key 列表（权威顺序）
  const DIM_KEYS = [
    'shiye','caiyun','jiankang','hunyin','xueye','jiating',
    'renji','jingshen','xiangfu','shouyuan','fengwu','xiuyang'
  ];

  // 12 维度中文名 + 图标（统一展示）
  const DIM_META = {
    shiye:   {name:'事业', icon:'💼'},
    caiyun:  {name:'财运', icon:'💰'},
    jiankang:{name:'健康', icon:'💪'},
    hunyin:  {name:'婚姻', icon:'💑'},
    xueye:   {name:'学业', icon:'📚'},
    jiating: {name:'家庭', icon:'🏡'},
    renji:   {name:'人际', icon:'🤝'},
    jingshen:{name:'精神', icon:'🎭'},
    xiangfu: {name:'享福', icon:'🌸'},
    shouyuan:{name:'寿元', icon:'🍵'},
    fengwu:  {name:'风物', icon:'🏔️'},
    xiuyang: {name:'修养', icon:'🎋'}
  };

  // 五行主属分值
  const WX_BASE_SCORE = {'金':85,'木':78,'水':82,'火':88,'土':90};

  // 五行关键词加权
  const WX_KEYS = {
    '金':['金','银','金融','财','金属','锐','商业','理财'],
    '木':['木','林','学','教育','书','生长','花','成长'],
    '水':['水','海','智慧','智','流动','冥想','灵活'],
    '火':['火','光','表演','演讲','热','能量','表达'],
    '土':['土','建筑','稳','田','地产','山','健康','承担']
  };

  // 五行聚焦描述
  const WX_FOCUS = {
    '金':'锐进+决策+果断',
    '木':'生发+成长+学习',
    '水':'智慧+灵活+沉浸',
    '火':'表达+热情+领导',
    '土':'稳重+承担+储蓄'
  };

  /**
   * 计算单维度偏差（含 weight 修正）
   * @param {string} ele - 五行
   * @param {string} dimKey - 维度 key
   * @param {number} weight - 维度权重
   * @returns {number} 偏差值
   */
  function getBias(ele, dimKey, weight){
    let bias = (WX_DIM_BIAS[ele] && WX_DIM_BIAS[ele][dimKey]) || 0;
    if(weight !== undefined && weight <= 0.04) bias -= 2;
    return bias;
  }

  /**
   * 批量计算 12 维度得分
   * @param {string} ele - 五行
   * @param {string} userText - 用户附加文本（用于关键词加权）
   * @param {object} opts - { dimensions: [{key,weight,...}], noiseBase?: number }
   * @returns {Array} [{key, name, icon, score, bias, weight}, ...]
   */
  function diagnoseDims(ele, userText, opts){
    const dimensions = (opts && opts.dimensions) || DIM_KEYS.map(k => ({key:k, weight: 1/12}));
    const noiseBase = (opts && opts.noiseBase) || 7;
    const base = WX_BASE_SCORE[ele] || 85;
    let boost = 0;
    (WX_KEYS[ele] || []).forEach(k => { if((userText||'').includes(k)) boost += 3; });
    return dimensions.map(d => {
      const bias = getBias(ele, d.key, d.weight);
      const noise = Math.floor(Math.abs(Math.sin(d.key.length * noiseBase)) * 8) - 4;
      const score = Math.max(30, Math.min(99, Math.round(base * 0.7 + d.weight * 100 + boost + bias + noise)));
      const meta = DIM_META[d.key] || {name:d.key, icon:'•'};
      return {
        key: d.key,
        name: (d.name) || meta.name,
        icon: (d.icon) || meta.icon,
        weight: d.weight,
        score,
        bias,
        biasLabel: bias > 0 ? '+'+bias : bias < 0 ? ''+bias : ''
      };
    });
  }

  // 导出
  global.WX_DIM_BIAS = WX_DIM_BIAS;
  global.WX_DIM_KEYS = DIM_KEYS;
  global.WX_DIM_META = DIM_META;
  global.WX_BASE_SCORE = WX_BASE_SCORE;
  global.WX_KEYS = WX_KEYS;
  global.WX_FOCUS = WX_FOCUS;
  global.wxGetBias = getBias;
  global.wxDiagnoseDims = diagnoseDims;

})(typeof window !== 'undefined' ? window : globalThis);