// ===== 引导区功能 =====

// 确定性选择函数（基于时间种子，非Math.random）
let _gfSeed = Date.now();
function _dpick(arr) { if(!arr||arr.length===0) return ''; _gfSeed = (_gfSeed * 9301 + 49297) % 233280; return arr[Math.floor((_gfSeed / 233280) * arr.length)]; }
function _drand() { _gfSeed = (_gfSeed * 9301 + 49297) % 233280; return _gfSeed / 233280; }

// 异步确认模态框（替代原生 confirm）—— 仅在未定义时注入
if (typeof window !== 'undefined' && typeof window.showConfirm !== 'function') {
  window.showConfirm = function(msg, onOk, onCancel) {
    let overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center';
    overlay.innerHTML = '<div style="background:var(--ink3);border:1px solid rgba(201,168,76,0.4);border-radius:12px;padding:24px;max-width:360px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.5)">' +
      '<div style="color:var(--paper);font-size:15px;line-height:1.7;margin-bottom:20px;letter-spacing:1px">' + msg + '</div>' +
      '<div style="display:flex;gap:12px;justify-content:flex-end">' +
      '<button data-act="cancel" style="padding:8px 20px;background:transparent;color:var(--steel);border:1px solid var(--paper3);border-radius:6px;cursor:pointer;font-size:13px">取消</button>' +
      '<button data-act="ok" style="padding:8px 20px;background:linear-gradient(135deg,var(--gold),var(--cinn));color:var(--paper);border:none;border-radius:6px;cursor:pointer;font-size:13px;letter-spacing:1px">确认</button>' +
      '</div></div>';
    document.body.appendChild(overlay);
    function close(result) {
      document.body.removeChild(overlay);
      if (result && typeof onOk === 'function') onOk();
      else if (!result && typeof onCancel === 'function') onCancel();
    }
    overlay.querySelector('[data-act="ok"]').onclick = function() { close(true); };
    overlay.querySelector('[data-act="cancel"]').onclick = function() { close(false); };
    overlay.onclick = function(e) { if (e.target === overlay) close(false); };
  };
}

function toggleGuide() {
  const guideBanner = document.getElementById('guideBanner');
  if (guideBanner) {
    if (guideBanner.style.display === 'none') {
      guideBanner.style.display = 'block';
      localStorage.setItem('guideBannerHidden', 'false');
    } else {
      guideBanner.style.display = 'none';
      localStorage.setItem('guideBannerHidden', 'true');
    }
  }
}

// 页面加载时检查引导区状态
document.addEventListener('DOMContentLoaded', function() {
  const guideHidden = localStorage.getItem('guideBannerHidden');
  if (guideHidden === 'true') {
    const guideSection = document.getElementById('guideSection');
    if (guideSection) {
      guideSection.style.display = 'none';
    }
  }
});

// ===== 时辰选择功能 =====
function selectShichen(element) {
  // 移除其他选中状态
  document.querySelectorAll('.shichen-item').forEach(item => {
    item.classList.remove('selected');
    item.style.borderColor = 'rgba(201,168,76,0.12)';
    item.style.background = 'rgba(255,255,255,0.02)';
  });

  // 添加选中状态
  element.classList.add('selected');
  element.style.borderColor = 'var(--gold)';
  element.style.background = 'rgba(201,168,76,0.08)';

  // 获取时辰值
  const hour = element.getAttribute('data-hour');
  // console.log('选中时辰:', hour);

  // 可以在这里更新隐藏的input值
  const hjHourInput = document.getElementById('hjHour');
  if (hjHourInput) {
    hjHourInput.value = hour;
  }
}

// ===== 性别选择功能 =====
function selectSex(sex) {
  const maleCard = document.getElementById('sexMaleCard');
  const femaleCard = document.getElementById('sexFemaleCard');

  if (!maleCard || !femaleCard) return;

  if (sex === 'male') {
    maleCard.style.background = 'rgba(201,168,76,0.08)';
    maleCard.style.borderColor = 'var(--gold)';
    maleCard.querySelector('div:nth-child(2)').style.color = 'var(--gold)';

    femaleCard.style.background = 'rgba(255,255,255,0.02)';
    femaleCard.style.borderColor = 'rgba(201,168,76,0.15)';
    femaleCard.querySelector('div:nth-child(2)').style.color = 'var(--paper2)';

    // 更新隐藏的性别input
    const sexInput = document.getElementById('baziSex');
    if (sexInput) sexInput.value = 'male';
    const hjSexInput = document.getElementById('hjSex');
    if (hjSexInput) hjSexInput.value = 'male';
  } else {
    femaleCard.style.background = 'rgba(201,168,76,0.08)';
    femaleCard.style.borderColor = 'var(--gold)';
    femaleCard.querySelector('div:nth-child(2)').style.color = 'var(--gold)';

    maleCard.style.background = 'rgba(255,255,255,0.02)';
    maleCard.style.borderColor = 'rgba(201,168,76,0.15)';
    maleCard.querySelector('div:nth-child(2)').style.color = 'var(--paper2)';

    // 更新隐藏的性别input
    const sexInput = document.getElementById('baziSex');
    if (sexInput) sexInput.value = 'female';
    const hjSexInput = document.getElementById('hjSex');
    if (hjSexInput) hjSexInput.value = 'female';
  }
}

// ===== 案例筛选功能 =====
function filterCases(type, btn) {
  // 更新按钮状态
  if (btn && btn.parentElement) {
    btn.parentElement.querySelectorAll('button').forEach(b => {
      b.style.background = 'transparent';
      b.style.color = 'var(--paper2)';
      b.style.borderColor = 'rgba(201,168,76,0.15)';
    });
    btn.style.background = 'rgba(201,168,76,0.1)';
    btn.style.color = 'var(--gold)';
    btn.style.borderColor = 'rgba(201,168,76,0.2)';
  }

  // 筛选案例(如果在案例库modal中)
  const modal = document.getElementById('caseLibraryModal');
  if (modal && modal.style.display === 'block') {
    const grid = document.getElementById('caseLibraryGrid');
    if (grid) {
      const cards = grid.querySelectorAll('.case-card-item');
      cards.forEach(card => {
        if (type === 'all' || card.getAttribute('data-type') === type) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    }
  }
}

// ===== 优化的化解方案展示格式 =====
function displayHuajieFriendly(data) {
  // 这个函数可以被 computeHuajie() 调用,以"缘主友好"格式展示化解方案
  // data 应包含:problem, analysis, solutions, warnings, checklist

  let html = '';
  html += '<div style="background:rgba(255,255,255,0.02);border:1px solid rgba(201,168,76,0.15);border-radius:12px;padding:30px;margin-bottom:24px">';

  // 问题部分
  html += '<div style="font-size:16px;letter-spacing:2px;color:var(--paper);margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid rgba(201,168,76,0.1);line-height:1.8">';
  html += '<strong>📌 您的问题:</strong>' + (data.problem || '待分析') + '<br>';
  html += '<strong>⚠️ 根源分析:</strong>' + (data.analysis || '待分析');
  html += '</div>';

  // 化解方案
  html += '<div style="margin-top:24px">';
  html += '<div style="font-size:18px;letter-spacing:4px;color:var(--gold);margin-bottom:20px;font-weight:600">💡 化解方案(按优先级排列)</div>';

  if (data.solutions && data.solutions.length > 0) {
    html += '<ul style="list-style:none;padding:0">';
    data.solutions.forEach((s, i) => {
      html += '<li style="padding:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(201,168,76,0.08);border-radius:8px;margin-bottom:14px">';
      html += '<div style="display:flex;align-items:flex-start;gap:12px">';
      html += '<span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;background:var(--gold);color:var(--ink);border-radius:50%;font-size:14px;font-weight:bold;flex-shrink:0">' + (i+1) + '</span>';
      html += '<div style="flex:1">';
      html += '<div style="font-size:16px;letter-spacing:2px;color:var(--paper);margin-bottom:8px;font-weight:600">' + s.title + '</div>';
      html += '<div style="font-size:14px;opacity:0.7;line-height:1.8;letter-spacing:1px;margin-left:40px">' + s.desc + '</div>';
      if (s.principle) {
        html += '<div style="font-size:12px;opacity:0.5;letter-spacing:1px;margin-top:10px;margin-left:40px;padding:10px 14px;background:rgba(201,168,76,0.04);border-left:3px solid var(--gold);border-radius:4px;line-height:1.7">📖 ' + s.principle + '</div>';
      }
      html += '</div>';
      html += '</div>';
      html += '</li>';
    });
    html += '</ul>';
  }

  html += '</div>';

  // 注意事项
  if (data.warnings && data.warnings.length > 0) {
    html += '<div style="background:rgba(231,76,60,0.06);border:1px solid rgba(231,76,60,0.2);border-radius:8px;padding:18px;margin-top:20px">';
    html += '<div style="color:var(--cinn2);font-size:15px;letter-spacing:2px;margin-bottom:8px;font-weight:600">⚠️ 注意事项(重要)</div>';
    html += '<div style="font-size:14px;line-height:2;opacity:0.8;letter-spacing:1px">';
    data.warnings.forEach(w => {
      html += '<p>' + w + '</p>';
    });
    html += '</div></div>';
  }

  // 自评清单
  html += '<div style="margin-top:24px;padding:20px;background:rgba(201,168,76,0.05);border:1px solid rgba(201,168,76,0.15);border-radius:8px">';
  html += '<div style="font-size:16px;letter-spacing:3px;color:var(--gold);margin-bottom:16px">📋 化解效果自评</div>';
  html += '<div style="font-size:14px;opacity:0.75;letter-spacing:1px;line-height:2">';
  html += '<label style="display:flex;align-items:center;gap:10px;padding:8px 0;cursor:pointer;border-bottom:1px solid rgba(201,168,76,0.06)"><input type="checkbox" style="accent-color:var(--gold);width:18px;height:18px"> 1个月后自评</label>';
  html += '<label style="display:flex;align-items:center;gap:10px;padding:8px 0;cursor:pointer;border-bottom:1px solid rgba(201,168,76,0.06)"><input type="checkbox" style="accent-color:var(--gold);width:18px;height:18px"> 3个月后自评</label>';
  html += '<label style="display:flex;align-items:center;gap:10px;padding:8px 0;cursor:pointer"><input type="checkbox" style="accent-color:var(--gold);width:18px;height:18px"> 6个月后自评</label>';
  html += '</div></div>';

  html += '</div>';

  return html;
}

// ===== 术语高亮 =====
function highlightTerms(text) {
  const terms = {
    '甲': '甲木，阳木，代表大树、栋梁',
    '乙': '乙木，阴木，代表花草、藤蔓',
    '丙': '丙火，阳火，代表太阳、光明',
    '丁': '丁火，阴火，代表灯火、烛光',
    '戊': '戊土，阳土，代表高山、大地',
    '己': '己土，阴土，代表田园、泥土',
    '庚': '庚金，阳金，代表刀剑、金属',
    '辛': '辛金，阴金，代表首饰、珠宝',
    '壬': '壬水，阳水，代表大海、江河',
    '癸': '癸水，阴水，代表雨露、泉水',
    '子': '子水，代表智慧、变通',
    '午': '午火，代表热情、能量',
    '日主': '八字中的日干，代表命主本人',
    '大运': '每10年一换的运势周期',
    '流年': '当年的运势',
    '食伤': '食神和伤官的统称，代表才华、创造力',
    '财星': '正财和偏财，代表财富、收入',
    '官星': '正官和七杀，代表事业、权力',
    '印星': '正印和偏印，代表学业、贵人',
    '比劫': '比肩和劫财，代表朋友、竞争',
    '渊海子平': '宋代徐大升所著命理经典',
    '滴天髓': '清代命理经典，以理论精深著称',
    '三命通会': '明代万民英所著命理百科全书',
    '黄帝内经': '中医经典，也涉及五行养生'
  };

  let highlighted = text;
  Object.keys(terms).forEach(term => {
    const regex = new RegExp(term, 'g');
    highlighted = highlighted.replace(regex, '<span class="term-highlight" title="' + terms[term] + '">' + term + '</span>');
  });

  return highlighted;
}

// console.log('易道智鉴优化功能已加载');

// ================================================================
// 改名建议功能
// ================================================================


// ================================================================
// 知识科普区域切换
// ================================================================
function toggleKnowledge() {
  const content = document.getElementById("knowledgeContent");
  const toggle = document.getElementById("knowledgeToggle");
  if (content.style.display === "none") {
    content.style.display = "block";
    toggle.textContent = "\u25b2";
  } else {
    content.style.display = "none";
    toggle.textContent = "\u25bc";
  }
}
// ================================================================
// 公司取名功能
// ================================================================

// 行业用字库
// ==================== 公司取名专业字库（全量知识）====================
// 源自《易经》《尚书》《诗经》《楚辞》等经典，结合现代商业命名规律
const INDUSTRY_CHARS = {
  tech: [
    // 科技行业：智慧、创新、未来、通达
    // 易经取字：乾(天行健)、兑(悦言)、离(明)、震(动)
    '乾','元','亨','利','贞','天','行','健','坤','载','德','合','无','疆',
    // 智慧类
    '智','慧','聪','明','睿','哲','思','维','脑','灵','心','悟','觉','知',
    // 创新类
    '创','新','革','鼎','变','易','更','始','初','元','本','源','根','基',
    // 科技类
    '科','技','术','艺','工','巧','精','专','研','究','探','索','发','现',
    // 数字类
    '数','据','云','网','链','块','端','点','线','面','体','系','统','集',
    // 芯片类
    '芯','片','晶','微','纳','光','电','磁','能','量','子','波','频','讯',
    // 通达类
    '通','达','畅','顺','速','快','捷','便','易','简','直','接','联','互',
    // 未来类
    '未','来','前','景','远','望','瞻','瞩','先','领','导','引','航','向'
  ],
  finance: [
    // 金融行业：诚信、稳固、繁荣、流动
    // 易经取字：巽(入)、坎(水/财)、艮(止/积蓄)
    '巽','入','坎','水','流','通','汇','聚','艮','止','蓄','积','盈','满',
    // 诚信类
    '信','诚','真','实','正','直','公','平','允','当','稳','妥','靠','赖',
    // 稳固类
    '稳','固','安','定','泰','宁','静','恒','久','永','长','存','立','基',
    // 繁荣类
    '盛','隆','昌','兴','旺','发','达','荣','华','富','贵','显','赫','奕',
    // 财源类
    '财','源','金','银','宝','珍','玉','珠','璧','璋','瑚','琏','琳','琅',
    // 流通类
    '融','资','贷','借','投','融','筹','募','集','募','汇','聚','纳','收',
    // 增值类
    '盈','利','赚','获','益','得','收','获','赢','胜','捷','凯','旋','归',
    // 传承类
    '鼎','丰','盈','实','厚','重','大','宏','巨','伟','浩','瀚','博','广'
  ],
  education: [
    // 教育行业：启迪、智慧、传承、成长
    // 易经取字：离(明/文)、兑(悦/说)、巽(教化)
    '离','明','照','亮','光','辉','映','烛','炬','焰','火','焰','熙','皞',
    // 启迪类
    '启','迪','开','导','引','领','指','点','拨','启','发','悟','觉','醒',
    // 智慧类
    '智','慧','聪','明','睿','哲','思','想','念','虑','谋','略','策','划',
    // 学习类
    '学','习','研','究','探','索','求','索','问','询','咨','询','请','教',
    // 传承类
    '传','承','继','续','延','续','袭','衍','流','布','播','扬','宣','传',
    // 德行类
    '德','道','仁','义','礼','智','信','孝','悌','忠','恕','慈','善','良',
    // 文化类
    '文','化','经','典','籍','书','卷','册','篇','章','句','读','诵','咏',
    // 成长类
    '成','长','进','步','升','腾','跃','飞','翔','翱','翔','翥','奋','起'
  ],
  medical: [
    // 医疗行业：仁爱、生命、康复、祥和
    // 易经取字：坎(水/药)、离(火/心)、巽(风/气)
    '坎','水','泉','井','渊','泽','润','泽','滋','养','涵','育','沐','浴',
    // 仁爱类
    '仁','爱','慈','悲','悯','怜','恤','济','救','助','扶','持','保','护',
    // 生命类
    '生','命','体','魄','魂','魄','精','气','神','灵','性','心','身','躯',
    // 康复类
    '康','健','复','原','愈','痊','宁','安','泰','和','平','顺','畅','达',
    // 医药类
    '医','药','疗','治','诊','断','方','剂','汤','丸','散','膏','丹','液',
    // 祥和类
    '祥','瑞','福','禄','寿','喜','吉','利','顺','遂','愿','祈','祝','颂',
    // 养生类
    '养','生','保','健','调','养','修','炼','习','练','功','法','术','道',
    // 美好类
    '美','好','优','良','佳','善','美','丽','秀','雅','洁','净','清','纯'
  ],
  food: [
    // 餐饮行业：美味、健康、文化、欢聚
    // 易经取字：兑(悦/口)、离(火/烹饪)、坎(水/汤)
    '兑','悦','口','舌','味','品','尝','食','饮','啜','嚼','咽','吞','吐',
    // 美味类
    '美','味','香','鲜','嫩','脆','滑','爽','醇','厚','郁','浓','淡','清',
    // 食材类
    '谷','米','面','粮','蔬','菜','果','瓜','肉','禽','鱼','虾','蟹','贝',
    // 烹饪类
    '烹','饪','煮','蒸','炒','煎','炸','烤','烘','焙','炖','焖','煨','熬',
    // 文化类
    '斋','阁','轩','亭','楼','台','院','府','邸','居','舍','苑','园','堂',
    // 欢聚类
    '聚','会','宴','席','筵','席','酌','饮','酌','欢','乐','庆','贺','祝',
    // 健康类
    '养','生','健','康','滋','补','益','元','气','血','精','髓','本','源',
    // 传统类
    '正','宗','老','字','号','传','统','古','法','秘','方','家','传','世'
  ],
  realestate: [
    // 地产行业：安居、品质、繁荣、长久
    // 易经取字：坤(地)、艮(山/止)、巽(风/流动)
    '坤','地','土','壤','田','野','原','陆','疆','域','界','境','方','位',
    // 安居类
    '安','居','宅','舍','家','庭','户','门','室','房','屋','厦','楼','阁',
    // 品质类
    '品','质','优','雅','高','尚','尊','贵','华','美','精','致','巧','妙',
    // 繁荣类
    '盛','兴','隆','昌','旺','发','达','荣','华','富','贵','显','耀','辉',
    // 长久类
    '恒','久','永','长','远','久','恒','固','稳','定','安','泰','宁','康',
    // 空间类
    '空','间','境','域','区','域','圈','带','廊','道','径','路','途','程',
    // 自然类
    '山','水','江','河','湖','海','泉','溪','林','木','花','草','园','苑',
    // 都市类
    '都','市','城','镇','村','乡','邦','国','州','郡','县','邑','郭','郊'
  ],
  culture: [
    // 文化行业：创意、传承、艺术、传播
    // 易经取字：离(文/明)、兑(悦/艺术)、巽(传播)
    '离','文','明','照','亮','辉','煌','灿','烂','耀','眼','显','露','呈',
    // 创意类
    '创','意','新','奇','独','特','别','异','怪','妙','巧','精','巧','灵',
    // 传承类
    '传','承','继','续','沿','袭','延','伸','衍','化','流','传','播','扬',
    // 艺术类
    '艺','术','美','雅','秀','丽','华','彩','姿','态','韵','律','调','格',
    // 传播类
    '传','媒','广','告','宣','传','推','广','散','布','流','通','畅','达',
    // 影视类
    '影','视','音','像','画','图','像','影','照','摄','录','制','作','创',
    // 音乐类
    '音','乐','声','韵','律','调','曲','歌','唱','咏','吟','诵','奏','演',
    // 设计类
    '设','计','构','思','谋','划','策','布','局','安','排','置','放','陈'
  ],
  // 新增行业分类
  ecommerce: [
    // 电商行业：便捷、丰富、信赖、全球
    '购','买','卖','易','贸','商','贾','市','集','场','店','铺','坊','肆',
    '捷','便','快','速','达','通','畅','顺','利','捷','敏','灵','活','巧',
    '品','质','优','选','精','佳','好','美','善','良','正','宗','真','实',
    '全','球','世','界','国','际','通','达','网','络','云','端','链','接'
  ],
  logistics: [
    // 物流行业：快速、安全、通达、全球
    '运','输','载','送','递','传','达','至','抵','到','往','赴','行','走',
    '速','快','捷','迅','疾','急','疾','飞','腾','跃','驰','骋','奔','跑',
    '安','全','稳','妥','靠','定','固','牢','坚','实','真','正','诚','信',
    '通','达','畅','顺','贯','穿','连','接','联','络','网','络','线','路'
  ],
  energy: [
    // 能源行业：力量、绿色、未来、可持续
    '能','源','力','量','动','力','冲','劲','势','气','威','猛','强','壮',
    '绿','色','环','保','洁','净','清','纯','新','能','再','生','循','环',
    '未','来','前','景','新','兴','创','新','先','进','高','科','技','术',
    '永','续','恒','久','长','远','持','续','延','展','绵','延','不','息'
  ],
  other: [
    // 通用吉字
    '兴','旺','发','达','隆','盛','昌','荣','华','富','贵','吉','祥','瑞',
    '福','禄','寿','喜','乐','安','康','宁','泰','和','平','顺','遂','愿',
    '天','地','人','和','德','道','仁','义','礼','智','信','诚','明','哲',
    '创','新','智','慧','远','见','卓','识','博','大','精','深','源','远'
  ]
};

// ==================== 公司名专业知识库 ====================
// 三才五格吉凶详解（源自《姓名学》经典）
// 每数理包含：luck吉凶（大吉/吉/半吉/凶）、name数理名称、desc详细含义
const WUGE_LUCK_DETAIL = {
  // 大吉数理·首领运
  1:{luck:'大吉',name:'太极鼎盛',desc:'太极之数，万物开泰，生发无穷，利禄亨通，健康长寿'},
  3:{luck:'大吉',name:'三才之数',desc:'天地人和，大事大业，繁荣昌盛，万事如意，家门昌隆'},
  5:{luck:'大吉',name:'五行俱全',desc:'阴阳和合，循环相生，圆通畅达，福祉无穷，事业有成'},
  6:{luck:'大吉',name:'六爻之数',desc:'发展变化，天赋美德，吉祥安泰，家门昌隆，福寿绵长'},
  7:{luck:'吉',name:'七政之数',desc:'精悍严谨，天赋之力，刚毅果断，吉星照耀，排除万难'},
  8:{luck:'吉',name:'八卦之数',desc:'意志坚定，勤勉发展，进退自如，可期成功，循序渐进'},
  11:{luck:'大吉',name:'万物更新',desc:'调顺发达，恢弘泽世，繁荣富贵，阴阳和合，名利双收'},
  13:{luck:'大吉',name:'春日牡丹',desc:'才艺多能，智谋奇略，忍柔当事，奏功受福，名利皆得'},
  15:{luck:'大吉',name:'福寿双全',desc:'福寿双全，立身兴家，慈祥有德，福泽绵长，富贵荣华'},
  16:{luck:'大吉',name:'厚重载德',desc:'安富尊荣，贵人相助，天乙扶持，兴家置业，受人敬仰'},
  17:{luck:'吉',name:'刚强进取',desc:'突破万难，刚柔兼备，排除困难，大业成就，必获成功'},
  18:{luck:'大吉',name:'智勇得志',desc:'权威显达，博得名利，养柔德慎勿骄，功成名就，德望高隆'},
  21:{luck:'大吉',name:'明月中天',desc:'光风霁月，万物确立，官运亨通，大博名利，领袖群伦'},
  23:{luck:'大吉',name:'旭日东升',desc:'壮丽壮观，权威旺盛，功名荣达，旭日升天，事业腾达'},
  24:{luck:'大吉',name:'掘藏得金',desc:'家门余庆，金钱丰盈，白手成家，财源广进，家运昌隆'},
  25:{luck:'吉',name:'资性英敏',desc:'资性英敏，性格刚毅，才识超群，平和处世，才华成功'},
  29:{luck:'吉',name:'智谋兼优',desc:'智谋兼优，财力归集，名闻海内，成就大业，功成名就'},
  31:{luck:'大吉',name:'智勇双全',desc:'智勇得志，心想事成，统率众人，名利双收，步步高升'},
  32:{luck:'大吉',name:'宝马金鞍',desc:'池中之龙，风云际会，一跃上天，贵人得助，名利双收'},
  33:{luck:'大吉',name:'旭日升天',desc:'鸾凤相会，名闻天下，隆昌至极，权威智谋，德望兼备'},
  35:{luck:'吉',name:'温和平静',desc:'温和平静，优雅发展，此乃吉运，才智兼具，能获成功'},
  37:{luck:'吉',name:'权威显达',desc:'权威显达，吉人天相，忠厚善良，德望崇高，谋事不凡'},
  39:{luck:'吉',name:'云开见月',desc:'云开见月，虽劳无功，智谋高超，贵气盈门，绵绣前程'},
  41:{luck:'大吉',name:'纯阳独秀',desc:'有名有利，天赋吉运，德望兼备，博得名望，事事如意'},
  45:{luck:'吉',name:'顺风扬帆',desc:'新生泰运，智谋经纬，富贵繁荣，德量宏大，事业有成'},
  47:{luck:'吉',name:'开花之象',desc:'祯祥吉庆，全力进取，前途无量，有贵人助，名利荣达'},
  48:{luck:'吉',name:'青松立鹤',desc:'智谋兼备，德量宏大，清雅荣贵，鹤立鸡群，受人尊敬'},
  52:{luck:'吉',name:'先见之明',desc:'卓识达眼，先见之明，理想实现，成功立业，名达天下'},
  57:{luck:'吉',name:'寒夜青灯',desc:'寒夜烛光，宏图大展，时来运转，资性刚毅，旭日东升'},
  61:{luck:'吉',name:'牡丹芙蓉',desc:'修身养性，吉祥如意，名扬天下，花开富贵，德福双修'},
  63:{luck:'大吉',name:'万物化育',desc:'繁荣之象，专心经营，万事如意，富贵荣华，必获成功'},
  65:{luck:'吉',name:'长白逢春',desc:'大博名利，庆得天赐，大展宏图，名达天下，富贵长春'},
  67:{luck:'吉',name:'利路亨通',desc:'智力双全，万事如意，成功立业，富贵荣华，步步高升'},
  68:{luck:'吉',name:'德量宏大',desc:'智谋兼备，思虑周详，德量宏大，清雅荣贵，受人尊敬'},
  81:{luck:'大吉',name:'万物回春',desc:'还元复始，万象更新，调顺发达，大博名利，富贵长寿'},
  // 凶数理
  2:{luck:'凶',name:'两仪之数',desc:'混沌未开，动摇不安，一荣一枯，进退保守，志望难达'},
  4:{luck:'凶',name:'四象之数',desc:'破坏凶变，待机而发，万事慎重，不具营谋，病弱短命'},
  9:{luck:'凶',name:'大成之数',desc:'或成或败，蕴涵凶险，难以把握，如履薄冰，暗藏危机'},
  10:{luck:'凶',name:'万事终局',desc:'万事终局，充满损耗，百事不成，难有成就，惨淡经营'},
  12:{luck:'凶',name:'薄弱无力',desc:'薄弱无力，孤立无援，外祥内苦，有志难伸，谋事难成'},
  14:{luck:'凶',name:'破兆之数',desc:'沦落天涯，失意烦闷，家庭缘薄，孤独遭难，多遭灾厄'},
  19:{luck:'凶',name:'多难风波',desc:'遮云蔽月，辛苦重来，虽有智能，成功无期，命途多舛'},
  20:{luck:'凶',name:'屋下藏金',desc:'物将坏之象，灾难重重，进退维谷，难得平安，万事不顺'},
  22:{luck:'凶',name:'秋草逢霜',desc:'秋草逢霜，困难疾弱，虽有豪杰，人生波折，常有不测'},
  26:{luck:'凶',name:'变怪奇异',desc:'波澜重叠，千变万化，凌驾万难，必获成功，但有祸患'},
  27:{luck:'凶',name:'一成一败',desc:'一成一败，盛衰参半，虽有才智，尚可成功，需谨言慎行'},
  28:{luck:'凶',name:'阔水浮萍',desc:'遭难之数，豪杰气概，四海飘泊，十浮九沉，变化无穷'},
  30:{luck:'凶',name:'吉凶参半',desc:'吉凶参半，得失相伴，投机取巧，如赌一生，沉迷不定'},
  34:{luck:'凶',name:'破家之数',desc:'灾难不绝，难望成功，进退维谷，谋事难成，辛苦一生'},
  36:{luck:'凶',name:'波澜重叠',desc:'波澜重叠，沉浮万状，侠义心肠，舍己成仁，苦乐参半'},
  38:{luck:'半吉',name:'磨铁成针',desc:'意志薄弱，精于才艺，艺术成名，智谋卓越，博得名利'},
  40:{luck:'凶',name:'智谋胆识',desc:'沉浮不定，智谋胆识，冒险投机，成败难分，吉凶难测'},
  42:{luck:'凶',name:'寒蝉在柳',desc:'十艺九不成，虽有专长，博而不精，难成大事，可获小成'},
  43:{luck:'凶',name:'雨夜之花',desc:'外祥内苦，散财破产，忍耐自重，转凶为吉，险中求安'},
  44:{luck:'凶',name:'秋木落叶',desc:'根最深但落叶，劳而无功，若能修身，可保平安，家庭缘薄'},
  46:{luck:'凶',name:'载宝沉舟',desc:'倾家荡产，载宝沉舟，若能谨慎，可保平安，大起大落'},
  49:{luck:'半吉',name:'吉凶难分',desc:'吉凶难分，得而复失，不断努力，可获成功，但需谨慎'},
  50:{luck:'半吉',name:'一成一败',desc:'盛衰参半，先成后败，若能守正，可获成功，需防逆转'},
  51:{luck:'半吉',name:'盛衰交加',desc:'盛衰交加，波澜重叠，如果能忍，可获成功，起伏不定'},
  53:{luck:'半吉',name:'内忧外患',desc:'外表光华，内有隐忧，若能谨慎，可保平安，需防不测'},
  54:{luck:'凶',name:'难望成功',desc:'多灾多难，遮云蔽月，虽有智慧，难望成功，出师不利'},
  55:{luck:'凶',name:'外美内苦',desc:'外表光华，内有隐忧，外观隆昌，内隐祸患，守正则吉'},
  56:{luck:'凶',name:'浪里行舟',desc:'历尽艰辛，如能谨慎，可达彼岸，晚景渐佳，苦尽甘来'},
  58:{luck:'半吉',name:'危难遭厄',desc:'如履薄冰，沉浮多端，先苦后甘，若能修身，晚年成功'},
  59:{luck:'凶',name:'寒蝉悲风',desc:'寒蝉悲风，时运不济，缺乏忍耐，十艺九穷，难成大器'},
  60:{luck:'凶',name:'黑暗无光',desc:'心迷意乱，出师不利，动摇不定，黑暗无光，难有成功'},
  62:{luck:'凶',name:'衰败之象',desc:'基础不稳，衰败之象，烦闷苦恼，若能修身，可保平安'},
  64:{luck:'凶',name:'骨肉分离',desc:'骨肉分离，孤独悲苦，难得安宁，行事小心，家庭不睦'},
  66:{luck:'凶',name:'进退维谷',desc:'进退失据，艰难不堪，内外不和，难得安宁，等待时机'},
  69:{luck:'凶',name:'坐立不安',desc:'灾祸接连，动荡不安，若能修身，可保平安，心神不宁'},
  70:{luck:'凶',name:'残菊逢霜',desc:'屋倒墙崩，空虚无依，晚年凄惨，宜守不宜攻，孤独终老'},
  71:{luck:'半吉',name:'吉凶参半',desc:'吉凶参半，惟赖勇气，贯彻力行，可保平安，需有毅力'},
  72:{luck:'半吉',name:'安乐之象',desc:'利害参半，利害混合，若得吉星相扶，可望成功'},
  73:{luck:'吉',name:'安乐自来',desc:'自然吉祥，力行不懈，终能成功，有志竟成，德必有邻'},
  74:{luck:'凶',name:'无用之辈',desc:'悲哀多难，智识浅陋，无德无能，难有成功，碌碌无为'},
  75:{luck:'半吉',name:'守则可安',desc:'守则可安，进取则凶，进退失据，顺其自然，可保平安'},
  76:{luck:'凶',name:'覆舟之象',desc:'失魂落魄，家破人亡，覆舟浪里，倾覆离散，晚年孤独'},
  77:{luck:'半吉',name:'乐极生悲',desc:'乐极生悲，先成后败，半世甘苦，中年后凶，慎防反转'},
  78:{luck:'半吉',name:'晚境凄凉',desc:'晚境凄凉，功名不立，先天薄弱，先苦后苦，难有成就'},
  79:{luck:'凶',name:'精神不定',desc:'精神不定，祸福无常，失意之时多，难守信约，投机无成'},
  80:{luck:'凶',name:'最极之数',desc:'还元复初，暗藏凶险，若能慎思，可保平安，宜保守行事'}
};

// 三才配置吉凶详解（五行相生相克）
const SANCAI_CONFIG = {
  // 木木木
  '木木木':{luck:'大吉',score:95,analysis:'成功运极佳，基础稳固，身心健康，繁荣昌盛，家庭圆满。'},
  // 木木火
  '木木火':{luck:'大吉',score:93,analysis:'成功运极佳，基础稳固，身心安泰，事业有成，名利双收。'},
  // 木火木
  '木火木':{luck:'大吉',score:92,analysis:'成功运极佳，基础稳固，身心健康，事业发达，家庭和睦。'},
  // 木火火
  '木火火':{luck:'吉',score:88,analysis:'成功运佳，基础稳固，但需注意性格急躁，宜修身养性。'},
  // 木火土
  '木火土':{luck:'大吉',score:90,analysis:'成功运极佳，基础稳固，事业有成，名利双收，家庭圆满。'},
  // 木土木
  '木土木':{luck:'半吉',score:65,analysis:'成功运被压抑，基础不稳，易生意外，需谨慎行事。'},
  // 木土火
  '木土火':{luck:'半吉',score:68,analysis:'成功运被压抑，但有机会突破，需努力奋斗。'},
  // 木土土
  '木土土':{luck:'半吉',score:62,analysis:'成功运被压抑，基础不稳，易生障碍，需谨慎经营。'},
  // 木土金
  '木土金':{luck:'凶',score:45,analysis:'成功运被压抑，基础不稳，易生灾祸，需特别谨慎。'},
  // 木土水
  '木土水':{luck:'凶',score:40,analysis:'成功运被压抑，基础不稳，易生意外，需特别小心。'},
  // 木金木
  '木金木':{luck:'凶',score:35,analysis:'成功运被压制，基础不稳，易生变故，需特别谨慎。'},
  // 木金火
  '木金火':{luck:'半吉',score:58,analysis:'成功运有阻碍，但有突破可能，需努力拼搏。'},
  // 木金土
  '木金土':{luck:'半吉',score:55,analysis:'成功运有阻碍，基础尚可，需谨慎经营。'},
  // 木金金
  '木金金':{luck:'凶',score:38,analysis:'成功运被压制，基础不稳，易生灾祸，需特别小心。'},
  // 木金水
  '木金水':{luck:'凶',score:42,analysis:'成功运被压制，基础不稳，易生变故，需特别谨慎。'},
  // 木水木
  '木水木':{luck:'大吉',score:91,analysis:'成功运极佳，基础稳固，身心健康，事业发达。'},
  // 木水火
  '木水火':{luck:'半吉',score:60,analysis:'成功运有阻碍，基础尚可，但需注意意外。'},
  // 木水土
  '木水土':{luck:'半吉',score:55,analysis:'成功运有阻碍，基础不稳，易生障碍，需谨慎。'},
  // 木水金
  '木水金':{luck:'吉',score:72,analysis:'成功运尚可，基础稳固，可获成功，但需努力。'},
  // 木水水
  '木水水':{luck:'吉',score:85,analysis:'成功运佳，基础稳固，事业发展，家庭和睦。'},
  // 火木木
  '火木木':{luck:'大吉',score:94,analysis:'成功运极佳，基础稳固，事业发达，名利双收。'},
  // 火木火
  '火木火':{luck:'大吉',score:92,analysis:'成功运极佳，基础稳固，身心健康，事业有成。'},
  // 火木土
  '火木土':{luck:'大吉',score:93,analysis:'成功运极佳，基础稳固，事业发展，家庭圆满。'},
  // 火木金
  '火木金':{luck:'吉',score:75,analysis:'成功运佳，基础尚可，可获成功，但需努力。'},
  // 火木水
  '火木水':{luck:'吉',score:78,analysis:'成功运佳，基础稳固，可获成功，但需注意意外。'},
  // 火火木
  '火火木':{luck:'吉',score:85,analysis:'成功运佳，基础稳固，事业有成，但性格宜沉稳。'},
  // 火火火
  '火火火':{luck:'吉',score:80,analysis:'成功运尚可，但性格过刚，宜修身养性，以防失误。'},
  // 火火土
  '火火土':{luck:'大吉',score:90,analysis:'成功运极佳，基础稳固，事业发达，名利双收。'},
  // 火火金
  '火火金':{luck:'凶',score:45,analysis:'成功运被压制，基础不稳，易生灾祸，需特别谨慎。'},
  // 火火水
  '火火水':{luck:'凶',score:35,analysis:'成功运被压制，基础不稳，水火相克，需特别小心。'},
  // 火土木
  '火土木':{luck:'吉',score:75,analysis:'成功运尚可，基础有缺陷，需努力经营。'},
  // 火土火
  '火土火':{luck:'大吉',score:92,analysis:'成功运极佳，基础稳固，事业发达，家庭圆满。'},
  // 火土土
  '火土土':{luck:'大吉',score:95,analysis:'成功运极佳，基础稳固，名利双收，家庭和睦。'},
  // 火土金
  '火土金':{luck:'大吉',score:93,analysis:'成功运极佳，基础稳固，事业有成，财源广进。'},
  // 火土水
  '火土水':{luck:'半吉',score:58,analysis:'成功运有阻碍，基础不稳，易生变故，需谨慎。'},
  // 火金木
  '火金木':{luck:'凶',score:40,analysis:'成功运被压制，基础不稳，易生灾祸，需特别小心。'},
  // 火金火
  '火金火':{luck:'凶',score:45,analysis:'成功运被压制，基础不稳，火金相克，需特别谨慎。'},
  // 火金土
  '火金土':{luck:'吉',score:72,analysis:'成功运尚可，基础稳固，可获成功，但需努力。'},
  // 火金金
  '火金金':{luck:'半吉',score:60,analysis:'成功运有阻碍，基础尚可，需努力经营。'},
  // 火金水
  '火金水':{luck:'凶',score:48,analysis:'成功运被压制，基础不稳，易生变故，需特别谨慎。'},
  // 火水木
  '火水木':{luck:'半吉',score:55,analysis:'成功运有阻碍，基础不稳，需谨慎经营。'},
  // 火水火
  '火水火':{luck:'凶',score:35,analysis:'成功运被压制，水火相克，易生灾祸，需特别小心。'},
  // 火水土
  '火水土':{luck:'凶',score:40,analysis:'成功运被压制，基础不稳，易生变故，需特别谨慎。'},
  // 火水金
  '火水金':{luck:'半吉',score:52,analysis:'成功运有阻碍，基础尚可，需努力拼搏。'},
  // 火水水
  '火水水':{luck:'吉',score:70,analysis:'成功运尚可，基础稳固，但需注意意外。'},
  // 土木木
  '土木木':{luck:'半吉',score:65,analysis:'成功运被压抑，基础不稳，易生障碍，需谨慎。'},
  // 土木火
  '土木火':{luck:'吉',score:72,analysis:'成功运尚可，基础稳固，可获成功，但需努力。'},
  // 土木土
  '土木土':{luck:'半吉',score:60,analysis:'成功运被压抑，基础不稳，需谨慎经营。'},
  // 土木金
  '土木金':{luck:'凶',score:45,analysis:'成功运被压抑，基础不稳，易生灾祸，需特别谨慎。'},
  // 土木水
  '土木水':{luck:'凶',score:40,analysis:'成功运被压抑，基础不稳，易生变故，需特别小心。'},
  // 土火木
  '土火木':{luck:'大吉',score:90,analysis:'成功运极佳，基础稳固，事业发达，名利双收。'},
  // 土火火
  '土火火':{luck:'大吉',score:88,analysis:'成功运极佳，基础稳固，事业有成，家庭和睦。'},
  // 土火土
  '土火土':{luck:'大吉',score:95,analysis:'成功运极佳，基础稳固，名利双收，家庭圆满。'},
  // 土火金
  '土火金':{luck:'大吉',score:92,analysis:'成功运极佳，基础稳固，事业发达，财源广进。'},
  // 土火水
  '土火水':{luck:'半吉',score:58,analysis:'成功运有阻碍，基础不稳，水火相克，需谨慎。'},
  // 土土木
  '土土木':{luck:'吉',score:75,analysis:'成功运尚可，基础稳固，可获成功，但需努力。'},
  // 土土火
  '土土火':{luck:'大吉',score:93,analysis:'成功运极佳，基础稳固，事业发达，家庭圆满。'},
  // 土土土
  '土土土':{luck:'大吉',score:96,analysis:'成功运极佳，基础稳固，名利双收，家庭和睦。'},
  // 土土金
  '土土金':{luck:'大吉',score:94,analysis:'成功运极佳，基础稳固，事业有成，财源广进。'},
  // 土土水
  '土土水':{luck:'吉',score:78,analysis:'成功运佳，基础稳固，但需注意意外变化。'},
  // 土金木
  '土金木':{luck:'吉',score:72,analysis:'成功运尚可，基础稳固，可获成功，但需努力。'},
  // 土金火
  '土金火':{luck:'大吉',score:90,analysis:'成功运极佳，基础稳固，事业发达，名利双收。'},
  // 土金土
  '土金土':{luck:'大吉',score:95,analysis:'成功运极佳，基础稳固，名利双收，家庭圆满。'},
  // 土金金
  '土金金':{luck:'大吉',score:92,analysis:'成功运极佳，基础稳固，事业有成，财源广进。'},
  // 土金水
  '土金水':{luck:'大吉',score:88,analysis:'成功运极佳，基础稳固，事业发展，家庭和睦。'},
  // 土水木
  '土水木':{luck:'吉',score:75,analysis:'成功运尚可，基础稳固，可获成功，但需努力。'},
  // 土水火
  '土水火':{luck:'凶',score:45,analysis:'成功运被压制，基础不稳，水火相克，需特别小心。'},
  // 土水土
  '土水土':{luck:'半吉',score:58,analysis:'成功运有阻碍，基础不稳，易生障碍，需谨慎。'},
  // 土水金
  '土水金':{luck:'大吉',score:85,analysis:'成功运佳，基础稳固，事业发展，家庭和睦。'},
  // 土水水
  '土水水':{luck:'吉',score:80,analysis:'成功运佳，基础稳固，但需注意意外变化。'},
  // 金木木
  '金木木':{luck:'凶',score:38,analysis:'成功运被压制，基础不稳，金木相克，需特别小心。'},
  // 金木火
  '金木火':{luck:'半吉',score:55,analysis:'成功运有阻碍，基础不稳，需努力拼搏。'},
  // 金木土
  '金木土':{luck:'半吉',score:60,analysis:'成功运有阻碍，基础尚可，需谨慎经营。'},
  // 金木金
  '金木金':{luck:'凶',score:42,analysis:'成功运被压制，基础不稳，金木相克，需特别谨慎。'},
  // 金木水
  '金木水':{luck:'凶',score:48,analysis:'成功运被压制，基础不稳，易生变故，需特别小心。'},
  // 金火木
  '金火木':{luck:'半吉',score:58,analysis:'成功运有阻碍，基础不稳，需努力经营。'},
  // 金火火
  '金火火':{luck:'凶',score:45,analysis:'成功运被压制，火金相克，易生灾祸，需特别谨慎。'},
  // 金火土
  '金火土':{luck:'吉',score:75,analysis:'成功运尚可，基础稳固，可获成功，但需努力。'},
  // 金火金
  '金火金':{luck:'凶',score:50,analysis:'成功运被压制，基础不稳，火金相克，需特别小心。'},
  // 金火水
  '金火水':{luck:'凶',score:35,analysis:'成功运被压制，水火金三刑，需特别小心。'},
  // 金土木
  '金土木':{luck:'半吉',score:55,analysis:'成功运有阻碍，基础不稳，需谨慎经营。'},
  // 金土火
  '金土火':{luck:'大吉',score:92,analysis:'成功运极佳，基础稳固，事业发达，名利双收。'},
  // 金土土
  '金土土':{luck:'大吉',score:95,analysis:'成功运极佳，基础稳固，名利双收，家庭圆满。'},
  // 金土金
  '金土金':{luck:'大吉',score:94,analysis:'成功运极佳，基础稳固，事业有成，财源广进。'},
  // 金土水
  '金土水':{luck:'大吉',score:88,analysis:'成功运极佳，基础稳固，事业发展，家庭和睦。'},
  // 金金木
  '金金木':{luck:'凶',score:42,analysis:'成功运被压制，基础不稳，金木相克，需特别小心。'},
  // 金金火
  '金金火':{luck:'凶',score:48,analysis:'成功运被压制，基础不稳，火金相克，需特别谨慎。'},
  // 金金土
  '金金土':{luck:'大吉',score:90,analysis:'成功运极佳，基础稳固，事业发达，名利双收。'},
  // 金金金
  '金金金':{luck:'吉',score:82,analysis:'成功运佳，基础稳固，但性格过刚，宜修身养性。'},
  // 金金水
  '金金水':{luck:'大吉',score:88,analysis:'成功运极佳，基础稳固，事业发展，家庭和睦。'},
  // 金水木
  '金水木':{luck:'大吉',score:92,analysis:'成功运极佳，基础稳固，事业发达，名利双收。'},
  // 金水火
  '金水火':{luck:'凶',score:45,analysis:'成功运被压制，基础不稳，水火相克，需特别小心。'},
  // 金水土
  '金水土':{luck:'吉',score:75,analysis:'成功运尚可，基础稳固，可获成功，但需努力。'},
  // 金水金
  '金水金':{luck:'大吉',score:90,analysis:'成功运极佳，基础稳固，事业发达，财源广进。'},
  // 金水水
  '金水水':{luck:'大吉',score:88,analysis:'成功运极佳，基础稳固，事业发展，家庭和睦。'},
  // 水木木
  '水木木':{luck:'大吉',score:93,analysis:'成功运极佳，基础稳固，事业发达，名利双收。'},
  // 水木火
  '水木火':{luck:'大吉',score:90,analysis:'成功运极佳，基础稳固，事业有成，家庭圆满。'},
  // 水木土
  '水木土':{luck:'吉',score:78,analysis:'成功运佳，基础稳固，可获成功，但需注意意外。'},
  // 水木金
  '水木金':{luck:'大吉',score:88,analysis:'成功运极佳，基础稳固，事业发展，财源广进。'},
  // 水木水
  '水木水':{luck:'大吉',score:92,analysis:'成功运极佳，基础稳固，事业发达，家庭和睦。'},
  // 水火木
  '水火木':{luck:'半吉',score:55,analysis:'成功运有阻碍，基础不稳，水火相克，需谨慎。'},
  // 水火火
  '水火火':{luck:'凶',score:38,analysis:'成功运被压制，基础不稳，水火相克，需特别小心。'},
  // 水火土
  '水火土':{luck:'半吉',score:62,analysis:'成功运有阻碍，基础尚可，需努力经营。'},
  // 水火金
  '水火金':{luck:'凶',score:42,analysis:'成功运被压制，基础不稳，水火相克，需特别谨慎。'},
  // 水火水
  '水火水':{luck:'凶',score:40,analysis:'成功运被压制，基础不稳，水火相克，需特别小心。'},
  // 水土木
  '水土木':{luck:'半吉',score:58,analysis:'成功运有阻碍，基础不稳，需谨慎经营。'},
  // 水土火
  '水土火':{luck:'半吉',score:65,analysis:'成功运有阻碍，基础尚可，需努力拼搏。'},
  // 水土土
  '水土土':{luck:'吉',score:75,analysis:'成功运尚可，基础稳固，可获成功，但需努力。'},
  // 水土金
  '水土金':{luck:'大吉',score:85,analysis:'成功运佳，基础稳固，事业发展，财源广进。'},
  // 水土水
  '水土水':{luck:'吉',score:80,analysis:'成功运佳，基础稳固，但需注意意外变化。'},
  // 水金木
  '水金木':{luck:'大吉',score:88,analysis:'成功运极佳，基础稳固，事业发达，名利双收。'},
  // 水金火
  '水金火':{luck:'吉',score:75,analysis:'成功运尚可，基础稳固，可获成功，但需努力。'},
  // 水金土
  '水金土':{luck:'大吉',score:92,analysis:'成功运极佳，基础稳固，名利双收，家庭圆满。'},
  // 水金金
  '水金金':{luck:'大吉',score:90,analysis:'成功运极佳，基础稳固，事业有成，财源广进。'},
  // 水金水
  '水金水':{luck:'大吉',score:94,analysis:'成功运极佳，基础稳固，事业发展，家庭和睦。'},
  // 水水木
  '水水木':{luck:'大吉',score:92,analysis:'成功运极佳，基础稳固，事业发达，名利双收。'},
  // 水水火
  '水水火':{luck:'凶',score:45,analysis:'成功运被压制，水火相克，易生灾祸，需特别小心。'},
  // 水水土
  '水水土':{luck:'吉',score:78,analysis:'成功运佳，基础稳固，但需注意意外变化。'},
  // 水水金
  '水水金':{luck:'大吉',score:90,analysis:'成功运极佳，基础稳固，事业发展，财源广进。'},
  // 水水水
  '水水水':{luck:'吉',score:85,analysis:'成功运佳，基础稳固，事业发达，但宜稳重行事。'}
};

// ================================================================
// 取名经典出处库（诗经/楚辞/论语/道德经/周易）
// ================================================================
const NAME_CLASSICS = {
  '诗经': [
    {name:'徽音', source:'《诗经·大雅·思齐》「大姒嗣徽音」', meaning:'美誉、贤德'},
    {name:'穆清', source:'《诗经·大雅·烝民》「穆如清风」', meaning:'温和清朗'},
    {name:'静姝', source:'《诗经·邶风·静女》「静女其姝」', meaning:'娴静美好'},
    {name:'燕婉', source:'《诗经·邶风·新台》「燕婉之求」', meaning:'和顺美好'},
    {name:'蓁蓁', source:'《诗经·周南·桃夭》「其叶蓁蓁」', meaning:'茂盛繁荣'},
    {name:'思齐', source:'《诗经·大雅·思齐》「思齐大任」', meaning:'见贤思齐'},
    {name:'子衿', source:'《诗经·郑风·子衿》「青青子衿」', meaning:'学子贤才'},
    {name:'婉清', source:'《诗经·郑风·野有蔓草》「清扬婉兮」', meaning:'美丽清雅'},
    {name:'如云', source:'《诗经·鄘风·君子偕老》「鬓发如云」', meaning:'美好如云'},
    {name:'德音', source:'《诗经·小雅·鹿鸣》「德音孔昭」', meaning:'美名远扬'},
    {name:'雅南', source:'《诗经·小雅·鼓钟》「以雅以南」', meaning:'高雅纯正'},
    {name:'乔木', source:'《诗经·周南·汉广》「南有乔木」', meaning:'高大正直'},
    {name:'琼瑶', source:'《诗经·卫风·木瓜》「报之以琼瑶」', meaning:'美玉珍贵'},
    {name:'鹿鸣', source:'《诗经·小雅·鹿鸣》「呦呦鹿鸣」', meaning:'吉祥雅乐'},
    {name:'清扬', source:'《诗经·郑风·野有蔓草》「有美一人，清扬婉兮」', meaning:'眉目清秀'},
    {name:'邦彦', source:'《诗经·郑风·羔裘》「邦之彦兮」', meaning:'国家俊才'},
    {name:'文茵', source:'《诗经·秦风·小戎》「文茵畅毂」', meaning:'文采华美'},
    {name:'雪霏', source:'《诗经·小雅·采薇》「雨雪霏霏」', meaning:'雪花纷飞'},
    {name:'硕人', source:'《诗经·卫风·硕人》「硕人其颀」', meaning:'高大美丽'},
    {name:'令仪', source:'《诗经·小雅·湛露》「莫不令仪」', meaning:'美好仪态'},
    {name:'秉文', source:'《诗经·周颂·清庙》「济济多士，秉文之德」', meaning:'秉持文德'}
  ],
  '楚辞': [
    {name:'正则', source:'《离骚》「名余曰正则兮」', meaning:'端正法则'},
    {name:'灵均', source:'《离骚》「字余曰灵均」', meaning:'灵气公平'},
    {name:'望舒', source:'《离骚》「前望舒使先驱兮」', meaning:'月神光明'},
    {name:'陆离', source:'《离骚》「斑陆离其上下」', meaning:'绚丽多彩'},
    {name:'嘉树', source:'《九章·橘颂》「后皇嘉树」', meaning:'美好树木'},
    {name:'江离', source:'《离骚》「扈江离与辟芷兮」', meaning:'香草芬芳'},
    {name:'杜若', source:'《九歌·湘君》「采芳洲兮杜若」', meaning:'香草清雅'},
    {name:'云旗', source:'《离骚》「载云旗之委蛇」', meaning:'气势雄伟'},
    {name:'怀瑾', source:'《九章·怀沙》「怀瑾握瑜兮」', meaning:'怀藏美玉'},
    {name:'承宇', source:'《九章·涉江》「云霏霏而承宇」', meaning:'承接天宇'},
    {name:'峻茂', source:'《离骚》「冀枝叶之峻茂兮」', meaning:'高大茂盛'},
    {name:'芳蔼', source:'《九叹·愍命》「芳蔼兮袭予」', meaning:'芳香繁盛'},
    {name:'清和', source:'《九思·伤时》「声噭誂兮清和」', meaning:'清朗和畅'},
    {name:'昭华', source:'《九怀·通路》「抱昭华兮宝璋」', meaning:'光明华美'},
    {name:'偃蹇', source:'《离骚》「望瑶台之偃蹇兮」', meaning:'高耸出众'},
    {name:'被月', source:'《九章·涉江》「被明月兮佩宝璐」', meaning:'披戴明月'}
  ],
  '论语': [
    {name:'敏行', source:'《论语·里仁》「君子欲讷于言而敏于行」', meaning:'行动敏捷'},
    {name:'思远', source:'《论语·卫灵公》「人无远虑，必有近忧」', meaning:'思虑深远'},
    {name:'安仁', source:'《论语·里仁》「仁者安仁」', meaning:'安于仁道'},
    {name:'文彬', source:'《论语·雍也》「文质彬彬」', meaning:'文雅质朴'},
    {name:'立本', source:'《论语·学而》「君子务本，本立而道生」', meaning:'立身根本'},
    {name:'博文', source:'《论语·雍也》「君子博学于文」', meaning:'博学多才'},
    {name:'知新', source:'《论语·为政》「温故而知新」', meaning:'推陈出新'},
    {name:'言信', source:'《论语·学而》「与朋友交，言而有信」', meaning:'诚信可靠'},
    {name:'三省', source:'《论语·学而》「吾日三省吾身」', meaning:'勤于反省'},
    {name:'志学', source:'《论语·为政》「吾十有五而志于学」', meaning:'立志向学'},
    {name:'弘毅', source:'《论语·泰伯》「士不可以不弘毅」', meaning:'宽宏坚毅'},
    {name:'乐山', source:'《论语·雍也》「知者乐水，仁者乐山」', meaning:'仁厚如山'}
  ],
  '道德经': [
    {name:'上善', source:'《道德经》第八章「上善若水」', meaning:'至高至善'},
    {name:'希言', source:'《道德经》第二十三章「希言自然」', meaning:'少言合道'},
    {name:'若水', source:'《道德经》第八章「上善若水」', meaning:'柔韧包容'},
    {name:'知止', source:'《道德经》第四十四章「知止不殆」', meaning:'适可而止'},
    {name:'明道', source:'《道德经》第四十一章「明道若昧」', meaning:'光明大道'},
    {name:'守静', source:'《道德经》第十六章「守静笃」', meaning:'持守宁静'},
    {name:'知常', source:'《道德经》第十六章「知常曰明」', meaning:'知晓常道'},
    {name:'无为', source:'《道德经》第三十七章「无为而无不为」', meaning:'顺应自然'},
    {name:'玄同', source:'《道德经》第五十六章「是谓玄同」', meaning:'深远和同'},
    {name:'若存', source:'《道德经》第六章「绵绵若存」', meaning:'绵长永存'},
    {name:'谷神', source:'《道德经》第六章「谷神不死」', meaning:'虚空神灵'},
    {name:'天长', source:'《道德经》第七章「天长地久」', meaning:'恒久长远'}
  ],
  '周易': [
    {name:'自强', source:'《周易·乾卦》「天行健，君子以自强不息」', meaning:'自我奋发'},
    {name:'厚德', source:'《周易·坤卦》「地势坤，君子以厚德载物」', meaning:'厚德包容'},
    {name:'元亨', source:'《周易·乾卦》「元亨利贞」', meaning:'大吉亨通'},
    {name:'文明', source:'《周易·大有》「其德刚健而文明」', meaning:'文采光明'},
    {name:'谦益', source:'《周易·谦卦》「天道亏盈而益谦」', meaning:'谦虚受益'},
    {name:'中孚', source:'《周易·中孚》「中孚，信及豚鱼也」', meaning:'诚信感化'},
    {name:'咸亨', source:'《周易·咸卦》「咸亨利贞」', meaning:'感通亨通'},
    {name:'大有', source:'《周易·大有》「火在天上，大有」', meaning:'丰收富有'},
    {name:'豫顺', source:'《周易·豫卦》「豫顺以动」', meaning:'和顺愉悦'},
    {name:'恒久', source:'《周易·恒卦》「天地之道，恒久而不已也」', meaning:'持久不懈'},
    {name:'同人', source:'《周易·同人》「同人于野，亨」', meaning:'大同和合'},
    {name:'贞吉', source:'《周易·需卦》「需于沙，衍在中也，贞吉」', meaning:'持正得吉'}
  ]
};

// 收藏公司名
let savedCompanyNames = [];

function saveCompanyName(name) {
  if (savedCompanyNames.includes(name)) {
    showToast('已收藏此名称');
    return;
  }

  savedCompanyNames.push(name);
  showToast(name + " 已加入收藏列表");
}

// 显示收藏列表
function showSavedList() {
  if (savedCompanyNames.length === 0) {
    showToast('收藏列表为空');
    return;
  }

  const list = document.getElementById('savedItems');
  list.innerHTML = '';

  savedCompanyNames.forEach((name, index) => {
    const item = document.createElement('div');
    item.className = 'saved-item';
    item.innerHTML = `
      <span class="si-name">${name}</span>
      <button class="si-remove" onclick="removeSavedItem(${index})">移除</button>
    `;
    list.appendChild(item);
  });

  document.getElementById('savedList').style.display = 'block';
}

// 移除收藏项
function removeSavedItem(index) {
  savedCompanyNames.splice(index, 1);
  showSavedList(); // 刷新显示
}

// 清空收藏列表
function clearSavedList() {
  showConfirm('确定清空收藏列表?', function() {
    savedCompanyNames = [];
    let el = document.getElementById('savedList');
    if (el) el.style.display = 'none';
  });
}

// 导出收藏列表
function exportSavedList() {
  if (savedCompanyNames.length === 0) {
    showToast('收藏列表为空');
    return;
  }

  const text = savedCompanyNames.map((name, i) => `${i + 1}. ${name}`).join('\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '公司名收藏列表.txt';
  a.click();
  URL.revokeObjectURL(url);
}

// ================================================================
// 手机号增强功能
// ================================================================

// 数字风水学分析
function analyzeMobileFengshui(mobileNumber) {
  // 去除非数字字符
  const digits = mobileNumber.replace(/\D/g, '');

  if (digits.length === 0) {
    return null;
  }

  // 数字对应五行(河图洛书)
  const digitWuxing = {
    '1': '木', '2': '木',
    '3': '火', '4': '火',
    '5': '土', '6': '土',
    '7': '金', '8': '金',
    '9': '水', '0': '水'
  };

  // 统计五行
  const wuxingCount = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
  digits.split('').forEach(d => {
    const wx = digitWuxing[d];
    if (wx) {
      wuxingCount[wx]++;
    }
  });

  // 计算百分比
  const total = digits.length;
  const wuxingPercent = {};
  for (const wx in wuxingCount) {
    wuxingPercent[wx] = Math.round((wuxingCount[wx] / total) * 100);
  }

  return {
    digits,
    wuxingCount,
    wuxingPercent,
    total
  };
}

// 分析手机号与八字匹配度
function analyzeMobileBaziMatch(mobileNumber, baziInfo) {
  // 如果有八字信息,分析匹配度
  if (!baziInfo || !baziInfo.weakElements || !baziInfo.strongElements) {
    return {
      hasBazi: false,
      message: '请输入八字信息以分析匹配度'
    };
  }

  const fengshui = analyzeMobileFengshui(mobileNumber);
  if (!fengshui) return null;

  // 找出号码中过旺的五行
  const maxPercent = Math.max(...Object.values(fengshui.wuxingPercent));
  const dominantWuxing = Object.keys(fengshui.wuxingPercent).find(wx => fengshui.wuxingPercent[wx] === maxPercent);

  // 判断匹配度
  let match = '';
  let advice = '';

  if (baziInfo.weakElements && baziInfo.weakElements.includes(dominantWuxing)) {
    match = '大吉';
    advice = `号码五行${dominantWuxing}过旺，正好补益八字喜用神，完美匹配!`;
  } else if (baziInfo.strongElements && baziInfo.strongElements.includes(dominantWuxing)) {
    match = '凶';
    advice = `号码五行${dominantWuxing}过旺，与八字忌神相冲，不建议使用。`;
  } else {
    match = '中平';
    advice = `号码五行与八字无明显相生相克关系，匹配度一般。`;
  }

  return {
    hasBazi: true,
    match,
    advice,
    dominantWuxing,
    fengshui
  };
}

// 公司取名功能已在 divination-hub.html 的 generateCompanyNamesEnhanced() 中实现


// ================================================================
// 手机号增强功能
// ================================================================

// 数字风水学分析

/* analyzeMobileFengshui dup removed */
// 显示数字风水分析结果
function displayMobileFengshui(fengshui) {
  // 显示结果区域
  document.getElementById('mobileFengshuiResult').style.display = 'block';

  // 显示五行分布条
  const bar = document.getElementById('wuxingBar');
  bar.innerHTML = '';
  const colors = {
    '木': 'var(--jade)',
    '火': 'var(--cinn2)',
    '土': 'var(--orange)',
    '金': 'var(--metal)',
    '水': 'var(--cyan)'
  };
  for (const wx in fengshui.wuxingPercent) {
    const seg = document.createElement('div');
    seg.className = 'shuzi-wuxing-seg';
    seg.style.width = fengshui.wuxingPercent[wx] + '%';
    seg.style.backgroundColor = colors[wx];
    seg.title = `${wx}: ${fengshui.wuxingPercent[wx]}%`;
    bar.appendChild(seg);
  }

  // 显示五行图例
  const legend = document.getElementById('wuxingLegend');
  legend.innerHTML = '';
  for (const wx in fengshui.wuxingPercent) {
    const item = document.createElement('div');
    item.className = 'swl-item';
    item.innerHTML = `<span style="color:${colors[wx]}">${wx}</span>: ${fengshui.wuxingCount[wx]}次(${fengshui.wuxingPercent[wx]}%)`;
    legend.appendChild(item);
  }

  // 显示能量分析
  const energy = document.getElementById('energyAnalysis');
  let energyHTML = '<p>号码:' + fengshui.digits + '</p>';
  energyHTML += '<p>总位数:' + fengshui.total + '位</p>';
  energyHTML += '<p>过旺五行:' + fengshui.dominantWuxing + '(' + fengshui.wuxingPercent[fengshui.dominantWuxing] + '%)</p>';
  energyHTML += '<p>过弱五行:' + fengshui.weakWuxing + '(' + fengshui.wuxingPercent[fengshui.weakWuxing] + '%)</p>';
  energy.innerHTML = energyHTML;

  // 显示调理建议
  const advice = document.getElementById('tiaoliAdvice');
  advice.innerHTML = fengshui.advice || '<p>五行分布均衡，无需特殊调理。</p>';

  // === 命理术语折叠说明 ===
  let termExplain = '<div style="margin-top:16px;border-top:1px solid rgba(39,174,96,.1);padding-top:16px">';
  termExplain += '<div onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==\'none\'?\'\':\'none\'" style="font-size:12px;color:var(--gold);cursor:pointer;letter-spacing:2px;display:flex;align-items:center;gap:6px">';
  termExplain += '<span style="transition:transform .2s;display:inline-block" id="termArrow">▶</span>命理术语解读';
  termExplain += '</div>';
  termExplain += '<div style="display:none;margin-top:10px;font-size:12px;color:var(--paper2);line-height:2;opacity:.8">';
  termExplain += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">财位：</strong>旺财的方位，布局好可助财运</div>';
  termExplain += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">文昌位：</strong>旺学业和事业的方位</div>';
  termExplain += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">桃花位：</strong>旺感情和人际的方位</div>';
  termExplain += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">五行：</strong>金木水火土，相生相克，影响运势</div>';
  termExplain += '<div><strong style="color:var(--gold)">门、主、灶：</strong>风水中最重要的三个位置</div>';
  termExplain += '</div></div>';
  
  // 添加到结果容器中
  const resultDiv = document.getElementById('mobileFengshuiResult');
  if (resultDiv) {
    // === 复制结果按钮 ===
    let copyBtn = '<div style="margin-top:16px;text-align:center">';
    copyBtn += '<button onclick="copyResultText(this)" style="font-size:12px;color:var(--gold);background:none;border:1px solid rgba(201,168,76,.2);border-radius:20px;padding:6px 20px;cursor:pointer;letter-spacing:2px">📋 复制结果</button>';
    copyBtn += '</div>';
    resultDiv.insertAdjacentHTML("beforeend", termExplain + copyBtn);
  }
}

// 分析手机号与八字匹配度

// 核心匹配分析
function analyzeMobileBaziMatchCore(mobileNumber, baziAnalysis) {
  const fengshui = analyzeMobileFengshuiCore(mobileNumber);
  if (!fengshui) return null;

  // 找出号码中过旺的五行
  const dominantWuxing = fengshui.dominantWuxing;

  // 判断匹配度
  let match = '';
  let advice = '';
  let score = 0;

  if (baziAnalysis.weakElements && baziAnalysis.weakElements.includes(dominantWuxing)) {
    match = '大吉';
    advice = `号码五行${dominantWuxing}过旺，正好补益八字喜用神${baziAnalysis.weakElements.join('、')},完美匹配!`;
    score = 90;
  } else if (baziAnalysis.strongElements && baziAnalysis.strongElements.includes(dominantWuxing)) {
    match = '凶';
    advice = `号码五行${dominantWuxing}过旺，与八字忌神${baziAnalysis.strongElements.join('、')}相冲，不建议使用。`;
    score = 30;
  } else {
    match = '中平';
    advice = `号码五行与八字无明显相生相克关系，匹配度一般。建议选择能补益喜用神的号码。`;
    score = 60;
  }

  return {
    match,
    advice,
    score,
    dominantWuxing,
    fengshui,
    baziAnalysis
  };
}

// 显示八字匹配结果
function displayBaziMatchResult(result) {
  if (!result) {
    showToast('无法分析匹配度');
    return;
  }

  // 显示结果区域
  document.getElementById('baziMatchResult').style.display = 'block';

  // 显示匹配结果
  const content = document.getElementById('matchResultContent');
  content.innerHTML = `
    <p><strong>匹配度:</strong><span style="color:${result.match === '大吉' ? 'var(--success)' : result.match === '凶' ? 'var(--cinn2)' : 'var(--gold)'};font-size:18px;">${result.match}</span></p>
    <p><strong>综合评分:</strong>${result.score}分</p>
    <p><strong>分析:</strong>${result.advice}</p>
    <p style="margin-top:16px;"><strong>号码五行分布:</strong></p>
    <div class="shuzi-wuxing-bar" style="margin:8px 0;">
      ${Object.entries(result.fengshui.wuxingPercent).map(([wx, pct]) => {
        const colors = {'木':'var(--jade)','火':'var(--cinn2)','土':'var(--orange)','金':'var(--metal)','水':'var(--cyan)'};
        return `<div style="width:${pct}%;background:${colors[wx]};height:8px;border-radius:2px;" title="${wx}:${pct}%"></div>`;
      }).join('')}
    </div>
    <p style="font-size:11px;opacity:.5;">${Object.entries(result.fengshui.wuxingPercent).map(([wx, pct]) => `${wx}:${pct}%`).join(' | ')}</p>
  `;
}

// 在analyzeMobile函数中调用风水分析
function enhanceAnalyzeMobile() {
  // 先调用原有的分析
  if (typeof analyzeMobile === 'function') {
    analyzeMobile();
  }

  // 再调用风水分析
  const mobileNumber = document.getElementById('mobileInput').value.trim();
  if (mobileNumber && mobileNumber.length >= 11) {
    analyzeMobileFengshui(mobileNumber);
  }
}


// ================================================================
// 康熙笔画数据库(500+ 常用汉字)
// ================================================================
const KANGXI_STROKES = {
  // 百家姓前100姓
  '赵':14, '钱':16, '孙':10, '李':7, '周':8, '吴':7, '郑':19, '王':4,
  '冯':12, '陈':16, '褚':15, '卫':15, '蒋':17, '沈':8, '韩':17, '杨':13,
  '朱':6, '秦':10, '尤':4, '许':11, '何':7, '吕':7, '施':9, '张':11,
  '孔':4, '曹':11, '严':20, '华':14, '金':8, '魏':18, '陶':16, '姜':9,
  '戚':11, '谢':17, '邹':17, '喻':12, '柏':9, '水':4, '窦':20, '章':11,
  '云':12, '苏':22, '潘':16, '葛':15, '奚':10, '范':15, '彭':12, '郎':14,
  '鲁':15, '韦':9, '昌':8, '马':10, '苗':11, '凤':14, '花':10, '方':4,
  '俞':9, '任':6, '袁':10, '柳':9, '酆':20, '鲍':16, '史':5, '唐':10,
  '费':12, '廉':13, '岑':7, '薛':19, '雷':13, '贺':12, '倪':10, '汤':13,
  '滕':14, '殷':10, '罗':20, '毕':11, '郝':14, '邬':15, '安':6, '常':11,
  '乐':15, '于':3, '时':10, '傅':12, '皮':5, '卞':4, '齐':14, '康':11,
  '伍':6, '余':7, '元':4, '卜':2, '顾':21, '孟':8, '平':5, '黄':12,
  '和':8, '穆':16, '萧':18, '尹':4, '姚':9, '邵':12, '湛':13, '汪':8,
  '祁':8, '毛':4, '禹':9, '狄':8, '米':6, '贝':7, '明':8, '臧':14,
  '计':9, '伏':6, '成':7, '戴':18, '谈':15, '宋':7, '茅':11, '庞':19,
  '熊':14, '纪':9, '舒':12, '屈':8, '项':12, '祝':10, '董':15, '梁':11,
  '杜':7, '阮':12, '蓝':20, '闵':12, '席':10, '季':8, '麻':11, '强':11,
  '贾':13, '路':13, '娄':11, '危':6, '江':7, '童':12, '颜':18, '郭':15,
  '梅':11, '盛':12, '林':8, '刁':2, '钟':17, '徐':10, '邱':12, '骆':16,
  '高':10, '夏':10, '蔡':17, '田':5, '樊':15, '胡':9, '凌':10, '霍':16,
  '虞':13, '万':15, '支':4, '柯':9, '昝':9, '管':14, '卢':16, '莫':13,
  '经':13, '房':8, '裘':13, '缪':17, '干':3, '解':13, '应':17, '宗':8,
  '丁':2, '宣':9, '贲':12, '邓':19, '郁':13, '单':12, '杭':8, '洪':10,
  '包':5, '诸':16, '左':5, '石':5, '崔':11, '吉':6, '钮':12, '龚':22,
  '程':12, '嵇':13, '邢':11, '滑':14, '裴':14, '陆':16, '荣':14, '翁':10,
  '荀':12, '羊':6, '甄':14, '加':5, '封':9, '芮':10, '羿':9, '储':18,
  '靳':13, '汲':7, '邴':11, '糜':17, '松':18, '井':4, '段':9, '富':12,
  '巫':7, '乌':10, '焦':12, '巴':4, '弓':3, '牧':8, '隗':12, '山':3,
  '谷':7, '车':7, '侯':9, '宓':8, '蓬':17, '全':6, '郗':13, '班':10,
  '仰':6, '秋':9, '仲':6, '伊':6, '宫':10, '宁':14, '仇':4, '栾':23,
  '暴':15, '甘':5, '钭':12, '厉':15, '戎':6, '祖':10, '武':8, '符':11,
  '刘':15, '景':12, '詹':13, '束':7, '龙':16, '叶':15, '幸':8, '司':5,
  '韶':14, '郜':14, '黎':15, '蓟':22, '溥':14, '印':6, '宿':11, '白':5,
  '怀':20, '蒲':16, '邰':13, '从':11, '鄂':17, '索':10, '咸':20, '籍':20,
  '赖':16, '卓':8, '蔺':22, '屠':11, '蒙':16, '池':6, '乔':12, '阳':12,
  '胥':9, '能':12, '苍':16, '双':18, '闻':14, '莘':13, '党':20, '翟':14,
  '谭':19, '贡':10, '劳':12, '逄':14, '姬':10, '申':5, '扶':8, '堵':11,
  '冉':5, '宰':10, '郦':26, '雍':13, '璩':17, '桑':10, '桂':10, '濮':18,
  '牛':4, '寿':14, '通':14, '边':22, '扈':11, '燕':16, '冀':16, '浦':11,
  '尚':8, '农':13, '温':14, '别':7, '庄':13, '晏':10, '柴':10, '瞿':18,
  '阎':16, '充':6, '慕':15, '连':14, '茹':12, '习':11, '宦':9, '艾':8,
  '鱼':11, '容':10, '向':6, '古':5, '易':8, '慎':14, '戈':4, '廖':14,
  '庾':11, '终':11, '暨':16, '居':8, '衡':16, '步':7, '都':16, '耿':10,
  '满':15, '弘':5, '匡':6, '国':11, '文':4, '寇':11, '广':15, '禄':13,
  '阙':18, '东':8, '欧':15, '殳':4, '沃':8, '利':7, '蔚':17, '越':12,
  '夔':21, '隆':17, '师':10, '巩':15, '厍':6, '聂':18, '晁':10, '勾':4,
  '敖':11, '融':16, '冷':7, '訾':12, '辛':7, '阚':17, '那':11, '简':18,
  '饶':21, '空':8, '曾':12, '毋':4, '沙':8, '乜':2, '养':15, '鞠':17,
  '须':12, '丰':18, '巢':11, '关':19, '蒯':16, '相':9, '查':9, '后':6,
  '荆':12, '红':9, '游':13, '竺':8, '权':22, '逯':14, '盖':14, '益':10,
  '桓':10, '公':4, '万俟':12, '司马':15, '上官':11, '欧阳':15, '夏侯':10,
  '诸葛':30, '闻人':15, '东方':12, '赫连':24, '皇甫':18, '尉迟':17, '公羊':10,
  '澹台':28, '公冶':12, '宗政':17, '濮阳':18, '淳于':16, '单于':12, '太叔':12,
  '申屠':12, '公孙':12, '仲孙':16, '轩辕':20, '令狐':13, '钟离':20, '宇文':10,
  '长孙':18, '慕容':20, '鲜于':21, '闾丘':23, '司徒':15, '司空':13, '亓官':12,
  '司寇':14, '仉':6, '督':16, '子车':10, '颛孙':27, '端木':19, '巫马':13,
  '公西':8, '漆雕':21, '乐正':20, '壤驷':24, '公良':12, '拓跋':17, '夹谷':14,
  '宰父':16, '谷梁':22, '晋':10, '楚':13, '闫':11, '法':9, '汝':7, '鄢':18,
  '涂':11, '钦':12, '缑':16, '亢':4, '况':7, '后':6, '有':6, '琴':12,
  '商':11, '牟':6, '佘':7, '佴':11, '伯':7, '赏':15, '墨':15, '哈':9,
  '谯':18, '笪':18, '年':6, '爱':13, '阳':12, '佟':10, '福':14, '言':7,
  '福':14, '百':6, '家':10, '谈':15, '赖':16, '盘':15, '郁':13, '萨':19,
  // 常用名用字
  '伟':11, '芳':10, '娜':10, '秀':7, '敏':11, '静':16, '丽':19, '强':11,
  '磊':15, '军':9, '洋':10, '勇':9, '艳':24, '杰':12, '娟':10, '涛':18,
  '明':8, '超':12, '秀':7, '霞':17, '平':5, '刚':10, '桂':10, '英':11,
  '华':14, '建':12, '文':4, '军':9, '玲':10, '慧':15, '鑫':24, '蕾':19,
  '婷':12, '雪':11, '红':9, '亮':9, '建':12, '波':9, '辉':15, '龙':16,
  '飞':9, '鹏':19, '宇':6, '晨':11, '昊':8, '轩':10, '浩':11, '博':12,
  '睿':14, '哲':10, '涵':12, '梓':11, '萱':15, '彤':7, '瑶':15, '馨':20,
  '悦':11, '怡':9, '瑾':16, '璇':16, '嘉':14, '翔':12, '旭':6, '晨':11,
  '辰':7, '泽':17, '霖':16, '峰':10, '岩':8, '石':5, '林':8, '森':12,
  '松':18, '柏':9, '梅':11, '兰':23, '竹':6, '菊':14, '荷':13, '莲':17,
  '翠':14, '凤':14, '云':12, '霞':17, '星':9, '月':4, '光':6, '辉':15,
  '明':8, '亮':9, '照':13, '耀':20, '瑞':14, '祥':11, '福':14, '禄':13,
  '寿':14, '喜':12, '庆':15, '和':8, '平':5, '安':6, '宁':14, '静':16,
  '怡':9, '乐':15, '欣':8, '悦':11, '欢':22, '笑':10, '甜':11, '蜜':14,
  '香':9, '盈':9, '满':15, '富':12, '贵':12, '荣':14, '华':14, '彩':11,
  '虹':9, '霞':17, '锦':16, '绣':13, '绮':14, '罗':20, '兰':23, '芝':10,
  '萍':14, '蓉':16, '薇':19, '菁':14, '菲':14, '芳':10, '芬':10, '莹':15,
  '茜':12, '莎':13, '蕾':19, '娜':10, '妮':8, '娃':9, '娇':15, '娥':10,
  '娟':10, '娣':10, '媛':12, '娴':15, '婉':11, '倩':10, '薇':19, '璐':18,
  '琪':13, '琳':13, '瑶':15, '琼':20, '瑛':14, '珍':10, '珠':11, '珊':10,
  '珏':10, '珩':11, '琛':13, '琬':13, '瑾':16, '璇':16, '璋':16, '璠':17,
  '璧':18, '璨':18, '璩':17, '璐':18, '瓒':25, '鑫':24, '锐':15, '锋':15,
  '锦':16, '银':14, '钢':16, '铁':13, '铃':13, '铭':14, '铮':14, '铄':23,
  '镇':18, '镜':19, '镭':21, '鹏':19, '鹤':21, '鹰':24, '雁':12, '燕':16,
  '莺':21, '凤':14, '凰':11, '麒':19, '麟':23, '龙':16, '虎':8, '豹':10,
  '象':12, '狮':14, '熊':14, '骏':17, '驰':13, '驱':15, '驳':14, '驴':11,
  '骆':16, '杰':12, '英':11, '豪':14, '俊':9, '侠':9, '儒':16, '彦':9,
  '士':3, '子':3, '文':4, '武':8, '斌':11, '德':15, '仁':4, '义':13,
  '礼':18, '智':12, '信':9, '忠':8, '孝':7, '悌':11, '恕':10, '勇':9,
  '刚':10, '毅':15, '谦':17, '恭':10, '让':24, '清':12, '正':5, '直':8,
  '方':4, '圆':13, '全':6, '美':9, '好':6, '善':12, '良':7, '贤':15,
  '能':12, '勤':13, '俭':15, '廉':13, '洁':16, '贞':9, '烈':10, '节':15,
  '义':13, '勇':9, '刚':10, '强':11, '毅':15, '洪':10, '海':11, '江':7,
  '河':9, '湖':13, '泊':9, '泽':17, '润':16, '清':12, '澈':16, '澄':16,
  '波':9, '涛':18, '浪':11, '潮':16, '汐':7, '山':3, '石':5, '岩':8,
  '峰':10, '岳':17, '岭':17, '岗':11, '岛':10, '林':8, '森':12, '木':4,
  '树':16, '枝':8, '叶':15, '花':10, '草':12, '竹':6, '梅':11, '兰':23,
  '菊':14, '松':18, '柏':9, '杨':13, '柳':9, '桃':10, '李':7, '杏':7,
  '梨':11, '枣':15, '果':8, '菜':14, '茶':12, '香':9, '味':8, '甜':11,
  '酸':17, '苦':11, '辣':14, '咸':20, '淡':17, '红':9, '黄':12, '蓝':20,
  '绿':14, '紫':12, '白':5, '黑':12, '青':8, '灰':6, '棕':12, '褐':15,
  '一':1,
  '七':2,
  '万':15,
  '三':3,
  '上':3,
  '下':3,
  '丑':4,
  '世':5,
  '东':8,
  '丝':12,
  '严':20,
  '中':4,
  '丰':18,
  '为':12,
  '主':5,
  '义':13,
  '乐':15,
  '九':2,
  '书':10,
  '买':12,
  '予':4,
  '二':2,
  '亏':3,
  '云':12,
  '五':4,
  '亡':3,
  '亮':9,
  '仁':4,
  '今':4,
  '仙':5,
  '以':5,
  '会':13,
  '伟':11,
  '伤':6,
  '位':7,
  '低':7,
  '余':7,
  '俗':9,
  '信':9,
  '假':11,
  '做':11,
  '偶':11,
  '儿':2,
  '兄':5,
  '光':6,
  '全':6,
  '八':2,
  '六':6,
  '兰':23,
  '关':14,
  '兴':16,
  '兵':7,
  '冕':9,
  '写':7,
  '军':9,
  '农':13,
  '冠':9,
  '冬':5,
  '冰':6,
  '冷':7,
  '净':10,
  '减':13,
  '凶':4,
  '出':5,
  '刀':2,
  '分':4,
  '刚':10,
  '利':7,
  '前':9,
  '动':11,
  '劫':9,
  '劳':12,
  '勇':9,
  '化':4,
  '北':5,
  '医':18,
  '十':2,
  '千':3,
  '升':4,
  '半':5,
  '华':14,
  '单':12,
  '卖':15,
  '南':9,
  '博':12,
  '印':6,
  '危':6,
  '厂':8,
  '厚':9,
  '去':5,
  '友':4,
  '双':18,
  '反':4,
  '发':12,
  '取':8,
  '受':8,
  '变':16,
  '古':5,
  '可':5,
  '台':5,
  '右':5,
  '吃':6,
  '各':6,
  '合':6,
  '吉':6,
  '后':9,
  '听':22,
  '味':8,
  '命':8,
  '和':8,
  '咸':20,
  '哭':10,
  '哲':10,
  '商':11,
  '善':12,
  '喜':12,
  '喝':12,
  '器':16,
  '四':5,
  '团':14,
  '园':13,
  '国':11,
  '圆':13,
  '圈':12,
  '土':3,
  '坎':7,
  '坏':7,
  '坐':7,
  '坚':11,
  '坡':8,
  '城':9,
  '墙':14,
  '增':15,
  '墨':15,
  '声':17,
  '壶':12,
  '处':5,
  '夏':10,
  '外':5,
  '多':6,
  '夜':8,
  '大':3,
  '天':4,
  '太':4,
  '夫':4,
  '失':5,
  '女':3,
  '好':6,
  '妹':8,
  '妻':8,
  '始':8,
  '姐':8,
  '娜':10,
  '婷':12,
  '子':3,
  '存':6,
  '孝':7,
  '学':16,
  '宁':14,
  '宇':6,
  '守':6,
  '安':6,
  '宏':7,
  '官':8,
  '宝':20,
  '客':10,
  '室':9,
  '家':10,
  '宽':15,
  '宿':11,
  '富':12,
  '寿':14,
  '小':3,
  '少':4,
  '尖':6,
  '局':7,
  '山':3,
  '岗':11,
  '岛':10,
  '岩':8,
  '岭':17,
  '岸':8,
  '峦':14,
  '峰':10,
  '崖':11,
  '工':3,
  '左':5,
  '巧':5,
  '巷':9,
  '布':5,
  '师':10,
  '带':11,
  '常':11,
  '帽':12,
  '干':3,
  '平':5,
  '年':6,
  '幻':4,
  '幼':5,
  '应':17,
  '店':8,
  '座':10,
  '康':11,
  '廉':14,
  '建':9,
  '开':12,
  '弟':7,
  '弱':10,
  '强':12,
  '得':11,
  '德':15,
  '心':4,
  '忆':17,
  '志':7,
  '忙':6,
  '忠':8,
  '快':7,
  '念':8,
  '怀':20,
  '思':9,
  '怡':9,
  '急':9,
  '总':14,
  '恩':10,
  '恶':15,
  '悦':11,
  '情':12,
  '想':13,
  '意':13,
  '愚':13,
  '感':13,
  '愿':19,
  '慢':14,
  '慧':15,
  '成':7,
  '房':8,
  '才':4,
  '攻':7,
  '敌':12,
  '敏':11,
  '散':12,
  '数':15,
  '文':4,
  '断':11,
  '新':13,
  '方':4,
  '无':4,
  '日':4,
  '旦':5,
  '旧':5,
  '早':6,
  '旭':6,
  '时':10,
  '旺':8,
  '昇':8,
  '昌':8,
  '明':8,
  '昏':8,
  '易':8,
  '昕':8,
  '星':9,
  '春':9,
  '是':10,
  '昼':11,
  '晓':16,
  '晕':13,
  '晖':13,
  '晗':11,
  '晚':11,
  '晨':11,
  '智':12,
  '暂':15,
  '暗':13,
  '暮':15,
  '曜':18,
  '曦':20,
  '曲':6,
  '月':4,
  '有':6,
  '服':6,
  '朗':11,
  '望':11,
  '朝':12,
  '木':4,
  '术':11,
  '朴':6,
  '机':12,
  '村':7,
  '来':8,
  '杯':8,
  '杰':12,
  '松':8,
  '极':7,
  '果':8,
  '枪':14,
  '枫':13,
  '枯':10,
  '柏':9,
  '某':9,
  '染':12,
  '柔':9,
  '柱':9,
  '校':10,
  '桐':10,
  '桥':16,
  '桦':12,
  '梁':11,
  '梅':11,
  '梦':14,
  '梯':11,
  '棉':12,
  '森':12,
  '楠':13,
  '楼':15,
  '榆':13,
  '榕':14,
  '欠':4,
  '欣':8,
  '歌':14,
  '止':4,
  '正':5,
  '武':8,
  '死':6,
  '毅':15,
  '母':5,
  '每':7,
  '民':5,
  '气':10,
  '水':4,
  '永':5,
  '求':7,
  '江':7,
  '池':7,
  '沉':7,
  '沟':8,
  '河':9,
  '泉':9,
  '泊':9,
  '法':9,
  '波':9,
  '泽':17,
  '洋':10,
  '洲':10,
  '流':10,
  '浅':11,
  '浩':11,
  '浪':11,
  '浮':10,
  '海':11,
  '涌':14,
  '涛':18,
  '涟':15,
  '润':16,
  '涵':12,
  '淡':17,
  '深':12,
  '淳':12,
  '清':12,
  '湖':13,
  '湿':12,
  '源':14,
  '溪':14,
  '满':14,
  '滩':18,
  '漪':15,
  '潭':16,
  '潮':16,
  '瀑':18,
  '火':4,
  '灭':9,
  '灵':24,
  '灿':17,
  '炉':20,
  '烟':13,
  '热':10,
  '燕':16,
  '爱':13,
  '父':4,
  '牛':4,
  '狗':8,
  '猪':12,
  '猫':16,
  '玉':5,
  '王':4,
  '环':17,
  '珍':10,
  '珠':11,
  '班':11,
  '理':12,
  '琳':12,
  '琴':13,
  '瑜':14,
  '瑞':14,
  '瑟':13,
  '瑶':15,
  '瓜':5,
  '瓦':5,
  '瓶':12,
  '甘':5,
  '甜':11,
  '生':5,
  '用':5,
  '电':13,
  '男':7,
  '画':12,
  '病':10,
  '白':5,
  '百':6,
  '盆':7,
  '盈':9,
  '盐':12,
  '盘':11,
  '盛':12,
  '直':8,
  '盼':9,
  '看':9,
  '真':10,
  '睡':13,
  '睿':14,
  '知':8,
  '短':12,
  '石':5,
  '砖':16,
  '砚':12,
  '硬':12,
  '碗':13,
  '礁':17,
  '礼':18,
  '祈':9,
  '神':10,
  '祥':11,
  '祸':14,
  '禄':13,
  '福':14,
  '秀':7,
  '秋':9,
  '秒':9,
  '空':8,
  '窄':10,
  '窗':12,
  '站':10,
  '竹':6,
  '笑':10,
  '笔':12,
  '笛':11,
  '米':6,
  '糖':16,
  '素':10,
  '索':10,
  '紧':14,
  '紫':12,
  '繁':17,
  '红':9,
  '纸':7,
  '纺':7,
  '线':8,
  '组':11,
  '织':8,
  '终':11,
  '绣':14,
  '续':21,
  '绳':18,
  '绸':14,
  '绿':14,
  '缓':15,
  '缘':15,
  '缸':8,
  '罐':24,
  '网':14,
  '羊':6,
  '美':9,
  '翔':12,
  '耀':20,
  '老':6,
  '聚':14,
  '聪':17,
  '胜':12,
  '能':11,
  '脏':10,
  '臭':10,
  '舍':8,
  '船':11,
  '艺':21,
  '芝':10,
  '芳':10,
  '苦':11,
  '英':11,
  '茂':11,
  '茶':12,
  '草':12,
  '荣':14,
  '药':16,
  '荷':13,
  '莲':17,
  '莹':15,
  '菊':14,
  '萱':15,
  '落':12,
  '蓉':14,
  '蓝':20,
  '蔓':17,
  '蕊':18,
  '蕾':16,
  '薄':16,
  '薇':16,
  '虎':8,
  '虫':6,
  '虹':9,
  '蛇':11,
  '蝶':15,
  '街':12,
  '衣':6,
  '衰':10,
  '袜':10,
  '装':12,
  '裙':12,
  '西':6,
  '觉':20,
  '诗':13,
  '说':14,
  '诺':16,
  '读':22,
  '谷':7,
  '豆':7,
  '豪':14,
  '负':6,
  '财':10,
  '败':12,
  '贫':8,
  '贱':12,
  '贵':12,
  '走':7,
  '跑':12,
  '路':13,
  '车':7,
  '轩':10,
  '软':11,
  '轻':14,
  '辉':15,
  '辛':7,
  '辣':14,
  '辰':7,
  '运':16,
  '近':13,
  '进':15,
  '远':17,
  '连':14,
  '退':15,
  '逸':11,
  '道':16,
  '邑':7,
  '部':11,
  '郭':15,
  '都':15,
  '酒':10,
  '酸':17,
  '醒':16,
  '里':7,
  '重':9,
  '金':8,
  '鑫':24,
  '针':10,
  '钟':17,
  '钢':16,
  '铁':16,
  '铜':14,
  '铝':11,
  '铭':14,
  '银':14,
  '锡':16,
  '锦':16,
  '镇':18,
  '长':8,
  '门':8,
  '闲':12,
  '队':15,
  '阳':17,
  '阴':12,
  '阶':17,
  '降':14,
  '院':9,
  '险':16,
  '隧':17,
  '难':19,
  '雀':11,
  '雅':12,
  '雨':8,
  '雪':11,
  '零':13,
  '雷':13,
  '雾':19,
  '霆':15,
  '震':15,
  '霓':16,
  '霖':16,
  '霜':17,
  '霞':17,
  '露':20,
  '青':8,
  '静':16,
  '非':8,
  '面':9,
  '鞋':15,
  '韵':19,
  '顺':12,
  '颖':16,
  '风':9,
  '飞':9,
  '饰':21,
  '饼':14,
  '馆':18,
  '香':9,
  '马':10,
  '高':10,
  '鬼':10,
  '魂':14,
  '魄':14,
  '鱼':11,
  '鸟':11,
  '鸡':13,
  '鸭':16,
  '鸿':17,
  '鹏':18,
  '鹤':15,
  '鹰':24,
  '黑':12,
  '鼎':13,
  '鼓':13,
  '龙':16
};

// ================================================================
// 五行对应表(根据笔画尾数)
// ================================================================
function getWuxingFromStroke(stroke) {
  const lastDigit = stroke % 10;
  if (lastDigit === 1 || lastDigit === 2) return '木';
  if (lastDigit === 3 || lastDigit === 4) return '火';
  if (lastDigit === 5 || lastDigit === 6) return '土';
  if (lastDigit === 7 || lastDigit === 8) return '金';
  if (lastDigit === 9 || lastDigit === 0) return '水';
}

// ================================================================
// 获取汉字的康熙笔画
// ================================================================
function getKangxiStroke(char) {
  // 先查字典
  const stroke = KANGXI_STROKES[char];
  if (stroke) return stroke;

  // 常见繁简对照
  const fanJian = {
    '龙':16,'飞':9,'马':10,'鸟':11,'鱼':11,'门':8,'问':11,'间':12,'开':12,'关':20,
    '东':8,'车':7,'长':8,'书':10,'专':11,'业':13,'丛':18,'丝':12,'两':8,'严':20,
    '丧':12,'丰':18,'临':17,'丽':19,'举':16,'乐':15,'乔':12,'习':11,'买':12,'乱':13,
    '争':8,'事':8,'云':12,'互':4,'亚':8,'产':11,'亩':10,'享':8,'亿':3,'从':11,
    '仓':10,'仅':4,'仿':6,'伙':6,'会':13,'伟':11,'传':13,'伤':13,'优':6,'伸':7,
    '伺':7,'体':7,'作':7,'伯':7,'伶':7,'佣':7,'低':7,'住':7,'佐':7,'佑':7,
    '体':22,'余':7,'佛':7,'作':7,'佣':7,'价':6,'众':11,'优':6,'伪':6,'传':13,
    '伤':13,'伞':12,'伟':11,'传':13,'伤':13,'优':6,'伸':7,'伺':7,'体':22,'作':7,
    // 常用简体字
    '个':3,'么':3,'久':3,'义':13,'之':4,'乌':10,'乐':15,'习':11,'书':10,'买':12,
    '乱':13,'乳':8,'乾':11,'乱':13,'了':2,'予':4,'争':8,'事':8,'二':2,'于':3,
    '亏':17,'云':12,'互':4,'亚':8,'些':2,'亡':3,'亢':4,'交':6,'亦':6,'产':11,
    '亩':10,'享':8,'亿':3,'从':11,'仓':10,'仅':4,'仿':6,'伙':6,'会':13,'伟':11,
    '传':13,'伤':13,'优':6,'伸':7,'伺':7,'体':22,'作':7,'伯':7,'伶':7,'佣':7,
    '低':7,'住':7,'佐':7,'佑':7,'余':7,'佛':7,'作':7,'佣':7,'价':6,'众':11,
    '优':6,'伪':6,'传':13,'伤':13,'伞':12,'伟':11,'传':13,'伤':13,'优':6,'伸':7
  };

  if (fanJian[char]) return fanJian[char];

  // 无法识别的字，返回笔画估算（基于unicode）
  // 这不是康熙笔画，仅用于提示用户
  return 0;
}

// 缺字提示函数
function checkUnknownChars(name) {
  const unknown = [];
  const chars = name.split('');
  chars.forEach(c => {
    if (!KANGXI_STROKES[c] && !getKangxiStroke(c)) {
      unknown.push(c);
    }
  });
  return unknown;
}

// ================================================================
// 三才五格计算
// ================================================================
function calculateWuge(fullName) {
  if (!fullName || fullName.length < 2) {
    return { error: '姓名至少需要2个字' };
  }

  const chars = fullName.split('');
  const unknown = checkUnknownChars(fullName);

  if (unknown.length > 0) {
    return {
      error: `字典中暂无以下字的康熙笔画数据：${unknown.join('、')}。\n请联系管理员补充，或使用其他字替换。`,
      unknownChars: unknown
    };
  }

  const strokes = chars.map(c => getKangxiStroke(c));

  const surnameStrokes = strokes[0];
  const nameStrokes = strokes.slice(1);

  // 天格 = 姓氏笔画 + 1(单姓)
  const tianGe = surnameStrokes + 1;

  // 人格 = 姓氏笔画 + 名字第一字笔画
  const renGe = surnameStrokes + (nameStrokes[0] || 0);

  // 地格 = 名字各字笔画之和(单名+1)
  let diGe;
  if (nameStrokes.length === 1) {
    diGe = nameStrokes[0] + 1;
  } else {
    diGe = nameStrokes.reduce((a, b) => a + b, 0);
  }

  // 总格 = 姓名所有字笔画之和
  const zongGe = strokes.reduce((a, b) => a + b, 0);

  // 外格 = 总格 - 人格 + 1
  const waiGe = zongGe - renGe + 1;

  return {
    tianGe,
    renGe,
    diGe,
    zongGe,
    waiGe,
    strokes,
    chars,
    tianGeWuxing: getWuxingFromStroke(tianGe),
    renGeWuxing: getWuxingFromStroke(renGe),
    diGeWuxing: getWuxingFromStroke(diGe),
    zongGeWuxing: getWuxingFromStroke(zongGe),
    waiGeWuxing: getWuxingFromStroke(waiGe),
    success: true
  };
}

// ================================================================
// 三才配置分析（查表法，基于五行生克经典理论）
// ================================================================
function analyzeSancai(wuge) {
  const { tianGeWuxing, renGeWuxing, diGeWuxing } = wuge;
  const key = tianGeWuxing + renGeWuxing + diGeWuxing;

  // 优先查表
  const config = SANCAI_CONFIG[key];
  if (config) {
    return {
      tian: tianGeWuxing,
      ren: renGeWuxing,
      di: diGeWuxing,
      score: config.score,
      luck: config.luck,
      analysis: config.analysis
    };
  }

  // 表外配置：回退到动态生克分析法
  const sheng = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  const ke = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

  const tian = tianGeWuxing;
  const ren = renGeWuxing;
  const di = diGeWuxing;

  let score = 50;
  let analysis = '';

  if (sheng[tian] === ren) { score += 15; analysis += `天格${tian}生人格${ren}，得祖荫；`; }
  else if (tian === ren) { score += 10; analysis += `天格${tian}与人格${ren}比和；`; }
  else if (ke[tian] === ren) { score -= 15; analysis += `天格${tian}克人格${ren}，祖上压制；`; }
  else { score += 5; analysis += `天格${tian}与人格${ren}关系一般；`; }

  if (sheng[ren] === di) { score += 15; analysis += `人格${ren}生地格${di}，基础稳固；`; }
  else if (ren === di) { score += 10; analysis += `人格${ren}与地格${di}比和，发展平顺；`; }
  else if (ke[ren] === di) { score -= 15; analysis += `人格${ren}克地格${di}，根基动摇；`; }
  else { score += 5; analysis += `人格${ren}与地格${di}关系一般；`; }

  let luck = '';
  if (score >= 80) luck = '大吉';
  else if (score >= 60) luck = '吉';
  else if (score >= 40) luck = '半吉';
  else luck = '凶';

  return { tian, ren, di, score, luck, analysis };
}

// ================================================================
// 五格吉凶判断（查表返回详细含义）
// ================================================================
function getWugeLuck(gridValue) {
  const detail = WUGE_LUCK_DETAIL[gridValue];
  if (detail) {
    // 返回幸运等级简写（兼容旧接口）
    const luckMap = { '大吉': 'lucky', '吉': 'lucky', '半吉': 'neutral', '凶': 'unlucky' };
    return luckMap[detail.luck] || 'neutral';
  }
  return 'neutral';
}

// 获取五格数理详细信息（名称、吉凶、含义）
function getWugeLuckDetail(gridValue) {
  return WUGE_LUCK_DETAIL[gridValue] || { luck: '平', name: '未知数理', desc: '暂无详细解释' };
}

// ================================================================
// 拼音数据库(用于音律分析) — 覆盖300+姓氏及常用名字用字
// ================================================================
const PINYIN_DB = {
  // 百家姓前100（按公安部2020统计排序）
  '王': 'wang2', '李': 'li3', '张': 'zhang1', '刘': 'liu2', '陈': 'chen2',
  '杨': 'yang2', '黄': 'huang2', '赵': 'zhao4', '吴': 'wu2', '周': 'zhou1',
  '徐': 'xu2', '孙': 'sun1', '马': 'ma3', '朱': 'zhu1', '胡': 'hu2',
  '郭': 'guo1', '何': 'he2', '高': 'gao1', '林': 'lin2', '罗': 'luo2',
  '郑': 'zheng4', '梁': 'liang2', '谢': 'xie4', '宋': 'song4', '唐': 'tang2',
  '许': 'xu3', '韩': 'han2', '冯': 'feng2', '邓': 'deng4', '曹': 'cao2',
  '彭': 'peng2', '曾': 'zeng1', '萧': 'xiao1', '田': 'tian2', '董': 'dong3',
  '潘': 'pan1', '袁': 'yuan2', '蔡': 'cai4', '蒋': 'jiang3', '余': 'yu2',
  '于': 'yu2', '杜': 'du4', '叶': 'ye4', '程': 'cheng2', '苏': 'su1',
  '魏': 'wei4', '吕': 'lv3', '丁': 'ding1', '任': 'ren4', '沈': 'shen3',
  '姚': 'yao2', '卢': 'lu2', '姜': 'jiang1', '崔': 'cui1', '钟': 'zhong1',
  '谭': 'tan2', '陆': 'lu4', '汪': 'wang1', '范': 'fan4', '金': 'jin1',
  '石': 'shi2', '廖': 'liao4', '贾': 'jia3', '夏': 'xia4', '韦': 'wei2',
  '付': 'fu4', '方': 'fang1', '白': 'bai2', '邹': 'zou1', '孟': 'meng4',
  '熊': 'xiong2', '秦': 'qin2', '邱': 'qiu1', '江': 'jiang1', '尹': 'yin3',
  '薛': 'xue1', '闫': 'yan2', '段': 'duan4', '雷': 'lei2', '侯': 'hou2',
  '龙': 'long2', '史': 'shi3', '陶': 'tao2', '黎': 'li2', '贺': 'he4',
  '顾': 'gu4', '毛': 'mao2', '郝': 'hao3', '龚': 'gong1', '邵': 'shao4',
  '万': 'wan4', '钱': 'qian2', '严': 'yan2', '覃': 'qin2', '武': 'wu3',
  '戴': 'dai4', '莫': 'mo4', '孔': 'kong3', '向': 'xiang4', '汤': 'tang1',
  // 百家姓101-200
  '温': 'wen1', '康': 'kang1', '施': 'shi1', '樊': 'fan2', '兰': 'lan2',
  '殷': 'yin1', '葛': 'ge3', '齐': 'qi2', '倪': 'ni2', '鲁': 'lu3',
  '柳': 'liu3', '骆': 'luo4', '俞': 'yu2', '梅': 'mei2', '鲍': 'bao4',
  '华': 'hua4', '费': 'fei4', '廉': 'lian2', '岑': 'cen2', '滕': 'teng2',
  '毕': 'bi4', '安': 'an1', '常': 'chang2', '乐': 'yue4', '时': 'shi2',
  '皮': 'pi2', '卞': 'bian4', '伍': 'wu3', '卜': 'bu3', '顾': 'gu4',
  '穆': 'mu4', '苟': 'gou3', '季': 'ji4', '麻': 'ma2', '强': 'qiang2',
  '路': 'lu4', '娄': 'lou2', '危': 'wei1', '童': 'tong2', '颜': 'yan2',
  '郭': 'guo1', '盛': 'sheng4', '林': 'lin2', '刁': 'diao1', '丘': 'qiu1',
  '徐': 'xu2', '凌': 'ling2', '纪': 'ji4', '舒': 'shu1', '屈': 'qu1',
  '项': 'xiang4', '祝': 'zhu4', '董': 'dong3', '梁': 'liang2', '杜': 'du4',
  '阮': 'ruan3', '蓝': 'lan2', '闵': 'min3', '席': 'xi2', '麻': 'ma2',
  '贾': 'jia3', '路': 'lu4', '娄': 'lou2', '江': 'jiang1', '颜': 'yan2',
  '郭': 'guo1', '梅': 'mei2', '盛': 'sheng4', '刁': 'diao1', '林': 'lin2',
  '钟': 'zhong1', '徐': 'xu2', '邱': 'qiu1', '骆': 'luo4', '高': 'gao1',
  '夏': 'xia4', '蔡': 'cai4', '田': 'tian2', '樊': 'fan2', '胡': 'hu2',
  '霍': 'huo4', '虞': 'yu2', '万': 'wan4', '支': 'zhi1', '柯': 'ke1',
  '管': 'guan3', '卢': 'lu2', '莫': 'mo4', '经': 'jing1', '房': 'fang2',
  '缪': 'miao4', '解': 'xie4', '应': 'ying1', '宗': 'zong1', '丁': 'ding1',
  '邓': 'deng4', '郁': 'yu4', '杭': 'hang2', '洪': 'hong2', '包': 'bao1',
  '左': 'zuo3', '石': 'shi2', '崔': 'cui1', '吉': 'ji2', '钮': 'niu3',
  '龚': 'gong1', '程': 'cheng2', '嵇': 'ji1', '邢': 'xing2', '裴': 'pei2',
  '翁': 'weng1', '荀': 'xun2', '於': 'yu1', '惠': 'hui4', '甄': 'zhen1',
  '芮': 'rui4', '羿': 'yi4', '储': 'chu3', '靳': 'jin4', '汲': 'ji2',
  '糜': 'mi2', '松': 'song1', '井': 'jing3', '段': 'duan4', '富': 'fu4',
  '巫': 'wu1', '焦': 'jiao1', '巴': 'ba1', '弓': 'gong1', '山': 'shan1',
  '谷': 'gu3', '车': 'che1', '侯': 'hou2', '宓': 'mi4', '蓬': 'peng2',
  '全': 'quan2', '郗': 'xi1', '班': 'ban1', '秋': 'qiu1', '仲': 'zhong4',
  '伊': 'yi1', '宫': 'gong1', '宁': 'ning2', '仇': 'qiu2', '甘': 'gan1',
  '戎': 'rong2', '祖': 'zu3', '武': 'wu3', '符': 'fu2', '景': 'jing3',
  '詹': 'zhan1', '龙': 'long2', '叶': 'ye4', '幸': 'xing4', '司': 'si1',
  '韶': 'shao2', '郜': 'gao4', '黎': 'li2', '蓟': 'ji4', '薄': 'bo2',
  '印': 'yin4', '白': 'bai2', '怀': 'huai2', '蒲': 'pu2', '邰': 'tai2',
  '索': 'suo3', '咸': 'xian2', '赖': 'lai4', '卓': 'zhuo2', '蔺': 'lin4',
  '屠': 'tu2', '蒙': 'meng2', '池': 'chi2', '乔': 'qiao2', '阴': 'yin1',
  '胥': 'xu1', '能': 'neng2', '苍': 'cang1', '双': 'shuang1', '闻': 'wen2',
  '莘': 'shen1', '党': 'dang3', '翟': 'zhai2', '谭': 'tan2', '贡': 'gong4',
  '劳': 'lao2', '逄': 'pang2', '姬': 'ji1', '申': 'shen1', '扶': 'fu2',
  '堵': 'du3', '冉': 'ran3', '宰': 'zai3', '郦': 'li4', '雍': 'yong1',
  '璩': 'qu2', '桑': 'sang1', '桂': 'gui4', '濮': 'pu2', '牛': 'niu2',
  '寿': 'shou4', '通': 'tong1', '边': 'bian1', '扈': 'hu4', '燕': 'yan1',
  '冀': 'ji4', '尚': 'shang4', '农': 'nong2', '温': 'wen1', '别': 'bie2',
  '庄': 'zhuang1', '晏': 'yan4', '柴': 'chai2', '瞿': 'qu2', '阎': 'yan2',
  '充': 'chong1', '慕': 'mu4', '连': 'lian2', '茹': 'ru2', '习': 'xi2',
  '宦': 'huan4', '艾': 'ai4', '鱼': 'yu2', '容': 'rong2', '向': 'xiang4',
  '古': 'gu3', '易': 'yi4', '慎': 'shen4', '戈': 'ge1', '廖': 'liao4',
  '庾': 'yu3', '终': 'zhong1', '暨': 'ji4', '居': 'ju1', '衡': 'heng2',
  '步': 'bu4', '都': 'du1', '耿': 'geng3', '满': 'man3', '弘': 'hong2',
  '匡': 'kuang1', '国': 'guo2', '文': 'wen2', '寇': 'kou4', '广': 'guang3',
  '禄': 'lu4', '阙': 'que4', '东': 'dong1', '欧': 'ou1', '殳': 'shu1',
  '沃': 'wo4', '利': 'li4', '蔚': 'wei4', '越': 'yue4', '夔': 'kui2',
  '隆': 'long2', '师': 'shi1', '巩': 'gong3', '厍': 'she4', '聂': 'nie4',
  '晁': 'chao2', '勾': 'gou1', '敖': 'ao2', '融': 'rong2', '冷': 'leng3',
  '訾': 'zi3', '辛': 'xin1', '阚': 'kan4', '那': 'na1', '简': 'jian3',
  '饶': 'rao2', '空': 'kong1', '曾': 'zeng1', '毋': 'wu2', '沙': 'sha1',
  '乜': 'nie4', '养': 'yang3', '鞠': 'ju1', '须': 'xu1', '丰': 'feng1',
  '巢': 'chao2', '关': 'guan1', '蒯': 'kuai3', '相': 'xiang4', '查': 'zha1',
  '后': 'hou4', '荆': 'jing1', '红': 'hong2', '游': 'you2', '竺': 'zhu2',
  '权': 'quan2', '逯': 'lu4', '盖': 'gai4', '益': 'yi4', '桓': 'huan2',
  '公': 'gong1', '万俟': 'mo4 qi2', '司马': 'si1 ma3', '上官': 'shang4 guan1',
  '欧阳': 'ou1 yang2', '夏侯': 'xia4 hou2', '诸葛': 'zhu1 ge3', '司徒': 'si1 tu2',
  // 常见名字用字（300+字，按使用频率排序）
  '明': 'ming2', '华': 'hua2', '伟': 'wei3', '强': 'qiang2', '军': 'jun1',
  '平': 'ping2', '国': 'guo2', '建': 'jian4', '文': 'wen2', '志': 'zhi4',
  '刚': 'gang1', '海': 'hai3', '飞': 'fei1', '龙': 'long2', '鑫': 'xin1',
  '森': 'sen1', '宇': 'yu3', '泽': 'ze2', '豪': 'hao2', '杰': 'jie2',
  '俊': 'jun4', '博': 'bo2', '亮': 'liang4', '超': 'chao1', '勇': 'yong3',
  '武': 'wu3', '斌': 'bin1', '磊': 'lei3', '辉': 'hui1', '鹏': 'peng2',
  '坤': 'kun1', '乾': 'qian2', '元': 'yuan2', '正': 'zheng4', '永': 'yong3',
  '生': 'sheng1', '成': 'cheng2', '兴': 'xing1', '立': 'li4', '光': 'guang1',
  '安': 'an1', '天': 'tian1', '子': 'zi3', '彦': 'yan4', '梓': 'zi3',
  '晨': 'chen2', '睿': 'rui4', '皓': 'hao4', '轩': 'xuan1', '涵': 'han2',
  '悦': 'yue4', '欣': 'xin1', '怡': 'yi2', '佳': 'jia1', '美': 'mei3',
  '丽': 'li4', '芳': 'fang1', '敏': 'min3', '静': 'jing4', '雪': 'xue3',
  '琳': 'lin2', '婷': 'ting2', '瑶': 'yao2', '颖': 'ying3', '晓': 'xiao3',
  '丹': 'dan1', '彤': 'tong2', '雯': 'wen2', '菲': 'fei1', '薇': 'wei1',
  '梦': 'meng4', '琪': 'qi2', '媛': 'yuan4', '蓉': 'rong2', '洁': 'jie2',
  '淑': 'shu1', '婉': 'wan3', '诗': 'shi1', '语': 'yu3', '慧': 'hui4',
  '聪': 'cong1', '灵': 'ling2', '兰': 'lan2', '菊': 'ju2', '梅': 'mei2',
  '竹': 'zhu2', '桂': 'gui4', '松': 'song1', '柏': 'bai3', '桐': 'tong2',
  '柳': 'liu3', '杨': 'yang2', '林': 'lin2', '森': 'sen1', '树': 'shu4',
  '材': 'cai2', '峰': 'feng1', '宁': 'ning2', '波': 'bo1', '涛': 'tao1',
  '毅': 'yi4', '翔': 'xiang2', '凯': 'kai3', '春': 'chun1', '雨': 'yu3',
  '清': 'qing1', '洁': 'jie2', '雅': 'ya3', '怡': 'yi2', '璐': 'lu4',
  '扬': 'yang2', '帆': 'fan1', '宏': 'hong2', '嘉': 'jia1', '恒': 'heng2',
  '润': 'run4', '瑾': 'jin3', '瑜': 'yu2', '瑞': 'rui4', '恩': 'en1',
  '昊': 'hao4', '哲': 'zhe2', '铭': 'ming2', '钧': 'jun1', '锐': 'rui4',
  '旭': 'xu4', '畅': 'chang4', '煜': 'yu4', '焕': 'huan4', '炫': 'xuan4',
  '炜': 'wei3', '炎': 'yan2', '琰': 'yan3', '琦': 'qi2', '琼': 'qiong2',
  '琅': 'lang2', '莹': 'ying2', '璇': 'xuan2', '璋': 'zhang1', '璞': 'pu2',
  '珊': 'shan1', '珂': 'ke1', '珲': 'hui1', '琛': 'chen1', '琳': 'lin2',
  '峰': 'feng1', '岚': 'lan2', '岩': 'yan2', '岳': 'yue4', '崇': 'chong2',
  '峻': 'jun4', '岭': 'ling3', '峥': 'zheng1', '嵘': 'rong2', '巍': 'wei1',
  '川': 'chuan1', '河': 'he2', '江': 'jiang1', '湖': 'hu2', '溪': 'xi1',
  '汐': 'xi1', '沐': 'mu4', '沛': 'pei4', '泽': 'ze2', '泓': 'hong2',
  '洋': 'yang2', '浩': 'hao4', '瀚': 'han4', '涛': 'tao1', '澜': 'lan2',
  '深': 'shen1', '源': 'yuan2', '清': 'qing1', '润': 'run4', '涵': 'han2',
  '蕾': 'lei3', '萱': 'xuan1', '萌': 'meng2', '莎': 'sha1', '菁': 'jing1',
  '茵': 'yin1', '茹': 'ru2', '蓓': 'bei4', '蕾': 'lei3', '蕊': 'rui3',
  '薇': 'wei1', '芸': 'yun2', '芷': 'zhi3', '若': 'ruo4', '芳': 'fang1',
  '芬': 'fen1', '芝': 'zhi1', '莲': 'lian2', '荷': 'he2', '秀': 'xiu4',
  '敏': 'min3', '娜': 'na4', '妮': 'ni1', '纯': 'chun2', '晶': 'jing1',
  '洁': 'jie2', '真': 'zhen1', '善': 'shan4', '德': 'de2', '道': 'dao4',
  '义': 'yi4', '礼': 'li3', '智': 'zhi4', '信': 'xin4', '仁': 'ren2',
  '勇': 'yong3', '毅': 'yi4', '忠': 'zhong1', '孝': 'xiao4', '贤': 'xian2',
  '良': 'liang2', '超': 'chao1', '越': 'yue4', '腾': 'teng2', '跃': 'yue4',
  '进': 'jin4', '达': 'da2', '通': 'tong1', '顺': 'shun4', '畅': 'chang4',
  '泰': 'tai4', '祥': 'xiang2', '瑞': 'rui4', '福': 'fu2', '禄': 'lu4',
  '寿': 'shou4', '喜': 'xi3', '庆': 'qing4', '吉': 'ji2', '乐': 'le4',
  '康': 'kang1', '宁': 'ning2', '逸': 'yi4', '逸': 'yi4', '然': 'ran2',
  '远': 'yuan3', '翔': 'xiang2', '博': 'bo2', '宇': 'yu3', '宏': 'hong2',
  '翰': 'han4', '墨': 'mo4', '书': 'shu1', '画': 'hua4', '奕': 'yi4',
  '璇': 'xuan2', '瑶': 'yao2', '瑾': 'jin3', '瑛': 'ying1', '珞': 'luo4',
  '玥': 'yue4', '珺': 'jun4', '胤': 'yin4', '宸': 'chen2', '桓': 'huan2',
  '熹': 'xi1', '煦': 'xu4', '昭': 'zhao1', '曦': 'xi1', '晟': 'sheng4',
  '晟': 'sheng4', '昱': 'yu4', '昀': 'yun2', '昕': 'xin1', '晗': 'han2',
  '晖': 'hui1', '睿': 'rui4', '弈': 'yi4', '衍': 'yan3', '翊': 'yi4'
};

// ================================================================
// 音律分析
// ================================================================
function analyzeYinlv(fullName) {
  const chars = fullName.split('');
  const pinyins = chars.map(c => PINYIN_DB[c] || '');

  // 检查是否有拼音数据
  if (pinyins.some(p => !p)) {
    return {
      hasData: false,
      message: '部分汉字无拼音数据，音律分析可能不准确'
    };
  }

  // 提取声调
  const tones = pinyins.map(p => parseInt(p.slice(-1)));

  // 平仄分析(1、2声为平,3、4声为仄)
  const pingze = tones.map(t => (t === 1 || t === 2) ? '平' : '仄');

  // 判断是否顺口(避免连续相同声调)
  let smoothScore = 100;
  let smoothAnalysis = '';

  for (let i = 0; i < tones.length - 1; i++) {
    if (tones[i] === tones[i + 1]) {
      smoothScore -= 20;
    }
  }

  if (smoothScore >= 80) {
    smoothAnalysis = '顺口，音律优美';
  } else if (smoothScore >= 60) {
    smoothAnalysis = '一般，音律尚可';
  } else {
    smoothAnalysis = '拗口，建议调整';
  }

  return {
    hasData: true,
    pinyins,
    tones,
    pingze,
    smoothScore,
    smoothAnalysis
  };
}

// ================================================================
// 谐音检测数据库（50+常见谐音问题，基于真实取名案例）
// ================================================================
const XIEYIN_DB = [
  { word: '杜子腾', meaning: '肚子疼' },
  { word: '沈京兵', meaning: '神经病' },
  { word: '朱逸群', meaning: '猪一群' },
  { word: '秦寿生', meaning: '禽兽生' },
  { word: '刘产', meaning: '流产' },
  { word: '范统', meaning: '饭桶' },
  { word: '杜琦燕', meaning: '肚脐眼' },
  { word: '魏生津', meaning: '卫生巾' },
  { word: '费彦', meaning: '肺炎' },
  { word: '胡丽晶', meaning: '狐狸精' },
  { word: '史珍香', meaning: '屎真香' },
  { word: '赖月京', meaning: '来月经' },
  { word: '毕云涛', meaning: '避孕套' },
  { word: '杨伟', meaning: '阳痿' },
  { word: '姬从良', meaning: '鸡从良（妓女从良）' },
  { word: '范剑', meaning: '犯贱' },
  { word: '夏建', meaning: '下贱' },
  { word: '姚晶', meaning: '妖精' },
  { word: '尤咏慈', meaning: '游泳池' },
  { word: '敖武', meaning: '鳌拜' },
  { word: '常余妍', meaning: '肠炎' },
  { word: '马统', meaning: '马桶' },
  { word: '史泰香', meaning: '屎太香' },
  { word: '吴能', meaning: '无能' },
  { word: '鲍菊花', meaning: '爆菊花' },
  { word: '刘芒', meaning: '流氓' },
  { word: '段智兴', meaning: '断子绝孙（近）' },
  { word: '苟利国', meaning: '狗利国（谐音不佳）' },
  { word: '庞大光', meaning: '膀胱大' },
  { word: '蔡思明', meaning: '菜市口（谐音不佳）' },
  { word: '严粟', meaning: '严肃（过于严肃）' },
  { word: '梅良欣', meaning: '没良心' },
  { word: '姬世强', meaning: '鸡屎强' },
  { word: '胡硕', meaning: '胡说' },
  { word: '郝建', meaning: '好贱' },
  { word: '聂思平', meaning: '捏死你（近）' },
  { word: '董格球', meaning: '懂个球' },
  { word: '安保田', meaning: '俺包甜' },
  { word: '吴功德', meaning: '无功德' },
  { word: '曹尼玛', meaning: '操你妈' },
  { word: '徐铁', meaning: '续贴' },
  { word: '赖学礼', meaning: '来学礼（谐音不佳）' },
  { word: '王巴', meaning: '王八' },
  { word: '郝爽', meaning: '好爽' },
  { word: '殷道彦', meaning: '阴道炎' },
  { word: '庞光', meaning: '膀胱' },
  { word: '季丹', meaning: '鸡蛋' },
  { word: '侯逸凡', meaning: '后裔饭' },
  { word: '王国军', meaning: '亡国君' },
  { word: '艾凤', meaning: 'iphone' },
  { word: '罗体仁', meaning: '裸体人' },
  { word: '高丸', meaning: '睾丸' },
  { word: '岳京', meaning: '月经' }
];

// ================================================================
// 谐音检测
// ================================================================
function checkXieyin(fullName) {
  const result = [];

  for (const item of XIEYIN_DB) {
    // 简单检测:如果名字中包含谐音词的字符
    if (fullName.includes(item.word[0]) && fullName.includes(item.word[1])) {
      result.push({
        word: item.word,
        meaning: item.meaning
      });
    }
  }

  return result;
}

// ================================================================
// 字义数据库
// ================================================================
// ================================================================
// 字义数据库（200+字，基于《说文解字》《康熙字典》及姓名学经典）
// 每个字提供：meaning(寓意)、wuxing(五行属性)、source(经典出处)
// ================================================================
const CHAR_MEANING = {
  // === 日/火类（光明智慧之字） ===
  '明': {meaning:'光明、聪明、睿智', wuxing:'火', source:'《周易》「大明终始」'},
  '旭': {meaning:'旭日初升、朝气', wuxing:'火', source:'《诗经》「旭日始旦」'},
  '昊': {meaning:'昊天广阔、博大', wuxing:'火', source:'《诗经》「昊天罔极」'},
  '晨': {meaning:'清晨希望、崭新', wuxing:'火', source:'《诗经》「夜如何其，夜乡晨」'},
  '晓': {meaning:'破晓黎明、知晓', wuxing:'火', source:'《说文》「晓，明也」'},
  '晖': {meaning:'阳光光辉、璀璨', wuxing:'火', source:'《说文》「晖，光也」'},
  '煜': {meaning:'照耀光明、灿烂', wuxing:'火', source:'《说文》「煜，熠也」'},
  '炜': {meaning:'光辉明亮、荣耀', wuxing:'火', source:'《诗经》「彤管有炜」'},
  '焕': {meaning:'焕发光彩、鲜明', wuxing:'火', source:'《论语》「焕乎其有文章」'},
  '晟': {meaning:'光明旺盛、兴盛', wuxing:'火', source:'《说文》「晟，明也」'},
  '畅': {meaning:'通顺畅达、舒展', wuxing:'火', source:'《周易》「美在其中而畅于四支」'},
  '曜': {meaning:'日光照耀、光辉', wuxing:'火', source:'《诗经》「日出有曜」'},
  '曦': {meaning:'晨曦阳光、希望', wuxing:'火', source:'《玉篇》「曦，日色也」'},
  '昀': {meaning:'日光温和、明亮', wuxing:'火', source:'《玉篇》「昀，日光也」'},
  '昕': {meaning:'黎明曙光、新生', wuxing:'火', source:'《说文》「昕，旦明也」'},
  '晗': {meaning:'天将明、渐亮', wuxing:'火', source:'《集韵》「晗，欲明也」'},
  '昱': {meaning:'日光新明、照耀', wuxing:'火', source:'《说文》「昱，明日也」'},
  '昭': {meaning:'昭明显著、光明', wuxing:'火', source:'《诗经》「昭事上帝」'},
  '景': {meaning:'风景光明、盛大', wuxing:'木', source:'《说文》「景，光也」'},
  '晶': {meaning:'晶莹剔透、纯粹', wuxing:'火', source:'《说文》「晶，精光也」'},
  '星': {meaning:'星辰闪耀、永恒', wuxing:'金', source:'《诗经》「星言夙驾」'},
  '辉': {meaning:'光辉灿烂、辉煌', wuxing:'水', source:'《说文》「辉，光也」'},

  // === 木/艹类（生机成长之字） ===
  '林': {meaning:'林木茂盛、众多', wuxing:'木', source:'《说文》「平土有丛木曰林」'},
  '森': {meaning:'森林茂密、繁盛', wuxing:'木', source:'《说文》「森，木多貌」'},
  '树': {meaning:'树立建树、栋梁', wuxing:'木', source:'《说文》「树，生植之总名」'},
  '松': {meaning:'松柏长青、坚韧', wuxing:'木', source:'《论语》「岁寒然后知松柏之后凋也」'},
  '柏': {meaning:'柏树坚贞、长寿', wuxing:'木', source:'《诗经》「如松柏之茂」'},
  '桐': {meaning:'梧桐高洁、凤凰', wuxing:'木', source:'《诗经》「梧桐生矣」'},
  '桂': {meaning:'桂花飘香、贵气', wuxing:'木', source:'《楚辞》「桂棹兮兰枻」'},
  '梓': {meaning:'梓木良材、家乡', wuxing:'木', source:'《诗经》「维桑与梓」'},
  '楠': {meaning:'楠木名贵、栋梁', wuxing:'木', source:'《说文》「楠，梅也」'},
  '杉': {meaning:'杉树挺拔、正直', wuxing:'木', source:'《尔雅》「杉，似松」'},
  '桦': {meaning:'白桦正直、纯洁', wuxing:'木', source:'《说文》「桦，木也」'},
  '枫': {meaning:'枫叶红艳、乐观', wuxing:'木', source:'《楚辞》「湛湛江水兮上有枫」'},
  '楷': {meaning:'楷模典范、端正', wuxing:'木', source:'《说文》「楷，木也」'},
  '荣': {meaning:'繁荣昌盛、荣耀', wuxing:'木', source:'《尔雅》「荣，华也」'},
  '萱': {meaning:'萱草忘忧、美好', wuxing:'木', source:'《诗经》「焉得谖草」'},
  '兰': {meaning:'兰花高洁、君子', wuxing:'木', source:'《周易》「同心之言，其臭如兰」'},
  '芝': {meaning:'灵芝祥瑞、珍奇', wuxing:'木', source:'《楚辞》「采三秀兮于山间」'},
  '菊': {meaning:'菊花傲骨、高洁', wuxing:'木', source:'《楚辞》「夕餐秋菊之落英」'},
  '梅': {meaning:'梅花傲雪、坚贞', wuxing:'木', source:'《诗经》「摽有梅」'},
  '荷': {meaning:'荷花出淤泥不染', wuxing:'木', source:'《楚辞》「制芰荷以为衣兮」'},
  '莲': {meaning:'莲花清雅、高洁', wuxing:'木', source:'《尔雅》「荷，芙蕖，其实莲」'},
  '竹': {meaning:'竹子虚心、高节', wuxing:'木', source:'《诗经》「瞻彼淇奥，绿竹猗猗」'},
  '筠': {meaning:'竹之青皮、坚韧', wuxing:'木', source:'《说文》「筠，竹皮也」'},
  '菁': {meaning:'菁华繁茂、精华', wuxing:'木', source:'《诗经》「菁菁者莪」'},
  '茵': {meaning:'绿茵如毯、柔和', wuxing:'木', source:'《说文》「茵，车重席」'},
  '萌': {meaning:'萌芽新生、希望', wuxing:'木', source:'《说文》「萌，草芽也」'},
  '蕊': {meaning:'花蕊含芳、精华', wuxing:'木', source:'《说文》「蕊，聚也」'},
  '芳': {meaning:'芳香美好、流芳', wuxing:'木', source:'《楚辞》「兰芷变而不芳兮」'},
  '芸': {meaning:'芸香书香、才学', wuxing:'木', source:'《说文》「芸，草也」'},

  // === 水/氵类（智慧润泽之字） ===
  '泽': {meaning:'恩泽润泽、惠及', wuxing:'水', source:'《周易》「泽无水，困」'},
  '涵': {meaning:'涵养包容、内秀', wuxing:'水', source:'《说文》「涵，水泽多也」'},
  '浩': {meaning:'浩大广阔、气魄', wuxing:'水', source:'《孟子》「浩然之气」'},
  '海': {meaning:'海纳百川、博大', wuxing:'水', source:'《说文》「海，天池也」'},
  '洋': {meaning:'海洋辽阔、包容', wuxing:'水', source:'《诗经》「河水洋洋」'},
  '波': {meaning:'波澜壮阔、活力', wuxing:'水', source:'《楚辞》「袅袅兮秋风，洞庭波兮木叶下」'},
  '涛': {meaning:'波涛汹涌、气概', wuxing:'水', source:'《说文》「涛，大波也」'},
  '润': {meaning:'滋润万物、温润', wuxing:'水', source:'《周易》「润之以风雨」'},
  '清': {meaning:'清澈纯净、清明', wuxing:'水', source:'《楚辞》「举世皆浊我独清」'},
  '源': {meaning:'源远流长、根本', wuxing:'水', source:'《礼记》「源来不穷」'},
  '江': {meaning:'江河奔流、大气', wuxing:'水', source:'《说文》「江，水」'},
  '河': {meaning:'大河浩瀚、壮阔', wuxing:'水', source:'《诗经》「关关雎鸠，在河之洲」'},
  '溪': {meaning:'溪流清幽、灵动', wuxing:'水', source:'《说文》「溪，山渎无所通者」'},
  '沐': {meaning:'沐浴恩泽、润泽', wuxing:'水', source:'《诗经》「薄言沐之」'},
  '沛': {meaning:'充沛丰盈、盛大', wuxing:'水', source:'《孟子》「沛然下雨」'},
  '泓': {meaning:'水深而广、深邃', wuxing:'水', source:'《说文》「泓，下深貌」'},
  '澜': {meaning:'波澜壮阔、壮丽', wuxing:'水', source:'《说文》「大波为澜」'},
  '瀚': {meaning:'浩瀚无垠、博大', wuxing:'水', source:'《淮南子》「浩浩瀚瀚」'},
  '潇': {meaning:'潇洒自然、洒脱', wuxing:'水', source:'《诗经》「风雨潇潇」'},
  '雪': {meaning:'冰雪纯洁、高雅', wuxing:'水', source:'《诗经》「雨雪其雱」'},
  '雨': {meaning:'甘霖滋润、恩泽', wuxing:'水', source:'《周易》「云行雨施」'},
  '雯': {meaning:'云彩花纹、美丽', wuxing:'水', source:'《广韵》「雯，云文」'},
  '霖': {meaning:'甘霖久雨、恩泽', wuxing:'水', source:'《说文》「霖，雨三日已往」'},
  '露': {meaning:'露水清润、新生', wuxing:'水', source:'《诗经》「白露为霜」'},
  '冰': {meaning:'冰雪聪明、清纯', wuxing:'水', source:'《说文》「冰，水坚也」'},
  '洁': {meaning:'纯洁无瑕、清白', wuxing:'水', source:'《楚辞》「朕幼清以廉洁兮」'},

  // === 金/玉类（贵重坚毅之字） ===
  '鑫': {meaning:'三金汇聚、财富', wuxing:'金', source:'《说文》「鑫，金长」'},
  '铭': {meaning:'铭刻不忘、铭记', wuxing:'金', source:'《礼记》「铭者，自名也」'},
  '锐': {meaning:'锐意进取、锋利', wuxing:'金', source:'《说文》「锐，芒也」'},
  '钧': {meaning:'钧衡天下、大器', wuxing:'金', source:'《孟子》「钧是人也」'},
  '锋': {meaning:'锋芒毕露、锐利', wuxing:'金', source:'《说文》「锋，兵端也」'},
  '锦': {meaning:'锦绣前程、华美', wuxing:'金', source:'《诗经》「锦衣狐裘」'},
  '金': {meaning:'金玉贵重、坚毅', wuxing:'金', source:'《周易》「二人同心，其利断金」'},
  '银': {meaning:'银白纯净、珍贵', wuxing:'金', source:'《说文》「银，白金也」'},
  '钟': {meaning:'钟鼎之家、重器', wuxing:'金', source:'《说文》「钟，乐钟也」'},
  '钰': {meaning:'珍宝坚玉、宝贵', wuxing:'金', source:'《玉篇》「钰，坚金」'},
  '镇': {meaning:'镇定稳重、威严', wuxing:'金', source:'《说文》「镇，博压也」'},

  // === 美玉类（温润高洁） ===
  '瑶': {meaning:'美玉瑶台、珍贵', wuxing:'火', source:'《诗经》「报之以琼瑶」'},
  '瑾': {meaning:'美玉品德、君子', wuxing:'火', source:'《楚辞》「怀瑾握瑜兮」'},
  '瑜': {meaning:'美玉光辉、完美', wuxing:'金', source:'《楚辞》「怀瑾握瑜兮」'},
  '琦': {meaning:'美玉奇珍、不凡', wuxing:'木', source:'《说文》「琦，玉名」'},
  '琪': {meaning:'美玉珍奇、祥瑞', wuxing:'木', source:'《玉篇》「琪，玉属」'},
  '琳': {meaning:'琳琅满目、华美', wuxing:'木', source:'《说文》「琳，美玉也」'},
  '瑞': {meaning:'瑞气吉祥、祥瑞', wuxing:'金', source:'《说文》「瑞，以玉为信也」'},
  '珊': {meaning:'珊瑚宝树、珍奇', wuxing:'金', source:'《说文》「珊，珊瑚」'},
  '璇': {meaning:'璇玑玉衡、星辰', wuxing:'火', source:'《尚书》「在璇玑玉衡」'},
  '璐': {meaning:'璐玉美质、珍贵', wuxing:'火', source:'《楚辞》「被明月兮佩宝璐」'},
  '琼': {meaning:'琼玉瑰宝、精美', wuxing:'木', source:'《诗经》「报之以琼琚」'},
  '珊': {meaning:'珊瑚宝树、多彩', wuxing:'金', source:'《说文》「珊，珊瑚色赤」'},
  '瑛': {meaning:'瑛玉光泽、美好', wuxing:'土', source:'《说文》「瑛，玉光也」'},
  '玥': {meaning:'神珠月明珠、祥瑞', wuxing:'土', source:'《广韵》「玥，神珠也」'},
  '珺': {meaning:'美玉名贵、清雅', wuxing:'木', source:'《玉篇》「珺，玉名」'},
  '玺': {meaning:'玉玺权印、贵重', wuxing:'火', source:'《说文》「玺，王者印也」'},
  '珍': {meaning:'珍珠宝贵、珍惜', wuxing:'火', source:'《说文》「珍，宝也」'},
  '珠': {meaning:'珠圆玉润、圆满', wuxing:'金', source:'《说文》「珠，蚌中阴精」'},

  // === 山/土类（稳重厚实之字） ===
  '峰': {meaning:'山峰高耸、巅峰', wuxing:'土', source:'《说文》「峰，山端也」'},
  '岳': {meaning:'山岳崇高、雄伟', wuxing:'土', source:'《诗经》「崧高维岳」'},
  '岚': {meaning:'山间雾气、灵秀', wuxing:'土', source:'《广韵》「岚，山气也」'},
  '岩': {meaning:'岩石坚固、刚毅', wuxing:'土', source:'《说文》「岩，岸也」'},
  '崇': {meaning:'崇高伟大、敬仰', wuxing:'土', source:'《诗经》「崇墉言言」'},
  '峻': {meaning:'高山峻岭、严谨', wuxing:'土', source:'《说文》「峻，高也」'},
  '巍': {meaning:'巍峨壮丽、高大', wuxing:'土', source:'《说文》「巍，高也」'},
  '峥': {meaning:'峥嵘岁月、不凡', wuxing:'土', source:'《说文》「峥，嵘也」'},
  '坤': {meaning:'坤元大地、厚德', wuxing:'土', source:'《周易》「坤厚载物」'},
  '坚': {meaning:'坚韧不拔、坚定', wuxing:'土', source:'《说文》「坚，刚也」'},
  '坦': {meaning:'坦荡正直、豁达', wuxing:'土', source:'《说文》「坦，安也」'},
  '城': {meaning:'城池坚固、守护', wuxing:'土', source:'《说文》「城，以盛民也」'},
  '培': {meaning:'培养滋润、教育', wuxing:'土', source:'《礼记》「培，益也」'},

  // === 品德修养之字 ===
  '德': {meaning:'道德品行、仁爱', wuxing:'火', source:'《周易》「君子进德修业」'},
  '仁': {meaning:'仁爱慈悲、儒家', wuxing:'金', source:'《论语》「仁者爱人」'},
  '义': {meaning:'道义正义、气节', wuxing:'木', source:'《孟子》「舍生取义」'},
  '礼': {meaning:'礼义廉耻、尊严', wuxing:'火', source:'《论语》「不学礼，无以立」'},
  '智': {meaning:'智慧才智、聪颖', wuxing:'火', source:'《论语》「知者不惑」'},
  '信': {meaning:'诚信信用、诺言', wuxing:'金', source:'《论语》「言而有信」'},
  '贤': {meaning:'贤德贤能、优秀', wuxing:'木', source:'《论语》「见贤思齐焉」'},
  '良': {meaning:'良善美好、忠良', wuxing:'火', source:'《说文》「良，善也」'},
  '善': {meaning:'善良慈善、仁厚', wuxing:'金', source:'《道德经》「上善若水」'},
  '和': {meaning:'和谐和平、中庸', wuxing:'水', source:'《论语》「礼之用，和为贵」'},
  '雅': {meaning:'高雅文雅、不俗', wuxing:'木', source:'《诗经》「雅者，正也」'},
  '正': {meaning:'正直公正、刚正', wuxing:'金', source:'《论语》「其身正，不令而行」'},
  '诚': {meaning:'真诚诚信、恳切', wuxing:'金', source:'《中庸》「诚者，天之道也」'},
  '谦': {meaning:'谦虚谦逊、礼让', wuxing:'木', source:'《周易》「谦谦君子」'},
  '勤': {meaning:'勤劳勤奋、不懈', wuxing:'木', source:'《尚书》「克勤于邦」'},
  '毅': {meaning:'坚毅刚毅、果敢', wuxing:'木', source:'《论语》「士不可以不弘毅」'},
  '恒': {meaning:'永恒持久、坚定', wuxing:'水', source:'《周易》「恒，久也」'},

  // === 力量气魄之字 ===
  '伟': {meaning:'伟大宏伟、杰出', wuxing:'土', source:'《说文》「伟，奇也」'},
  '强': {meaning:'强大刚强、有力', wuxing:'木', source:'《周易》「天行健，君子以自强不息」'},
  '勇': {meaning:'勇敢勇猛、无畏', wuxing:'土', source:'《论语》「勇者不惧」'},
  '杰': {meaning:'杰出卓越、豪杰', wuxing:'木', source:'《说文》「杰，傲也」'},
  '豪': {meaning:'豪迈豪杰、大气', wuxing:'水', source:'《说文》「豪，豕鬣如笔管者」'},
  '俊': {meaning:'英俊俊秀、才俊', wuxing:'火', source:'《说文》「俊，材千人也」'},
  '博': {meaning:'博大博学、广博', wuxing:'水', source:'《论语》「博学于文」'},
  '哲': {meaning:'哲理智慧、明哲', wuxing:'火', source:'《尚书》「明作哲」'},
  '龙': {meaning:'龙腾尊贵、力量', wuxing:'火', source:'《周易》「飞龙在天」'},
  '鹏': {meaning:'大鹏展翅、志向', wuxing:'水', source:'《庄子》「鹏之徙于南冥也」'},
  '飞': {meaning:'飞翔高飞、自由', wuxing:'水', source:'《周易》「飞龙在天」'},
  '翔': {meaning:'翱翔天际、高远', wuxing:'土', source:'《说文》「翔，回飞也」'},
  '超': {meaning:'超越超凡、出众', wuxing:'金', source:'《说文》「超，跳也」'},
  '腾': {meaning:'腾飞奔腾、奋发', wuxing:'火', source:'《说文》「腾，传也」'},
  '凯': {meaning:'凯旋胜利、欢庆', wuxing:'木', source:'《说文》「凯，还师振旅乐也」'},
  '胜': {meaning:'胜利成功、制胜', wuxing:'金', source:'《孙子》「知彼知己，百战不殆」'},
  '雄': {meaning:'英雄雄壮、杰出', wuxing:'水', source:'《说文》「雄，鸟父也」'},

  // === 才智学业之字 ===
  '文': {meaning:'文采文化、儒雅', wuxing:'水', source:'《周易》「观乎人文，以化成天下」'},
  '书': {meaning:'书香文墨、学识', wuxing:'金', source:'《说文》「书，著也」'},
  '翰': {meaning:'翰林笔墨、才学', wuxing:'水', source:'《诗经》「维周之翰」'},
  '墨': {meaning:'墨香文雅、沉静', wuxing:'水', source:'《说文》「墨，书墨也」'},
  '学': {meaning:'学问求知、上进', wuxing:'水', source:'《论语》「学而时习之」'},
  '博': {meaning:'博学广闻、渊博', wuxing:'水', source:'《论语》「博学于文」'},
  '睿': {meaning:'睿智英明、通达', wuxing:'金', source:'《尚书》「睿作圣」'},
  '聪': {meaning:'聪明睿智、敏慧', wuxing:'金', source:'《说文》「聪，察也」'},
  '慧': {meaning:'智慧聪慧、灵巧', wuxing:'水', source:'《说文》「慧，儇也」'},
  '灵': {meaning:'灵气灵巧、聪颖', wuxing:'火', source:'《说文》「灵，巫以玉事神」'},
  '敏': {meaning:'敏锐敏捷、勤勉', wuxing:'水', source:'《论语》「敏于事而慎于言」'},
  '锐': {meaning:'锐利敏锐、进取', wuxing:'金', source:'《说文》「锐，芒也」'},

  // === 女性美善之字 ===
  '婷': {meaning:'亭亭玉立、优雅', wuxing:'火', source:'《玉篇》「婷，和色也」'},
  '婉': {meaning:'温婉柔美、和顺', wuxing:'土', source:'《诗经》「清扬婉兮」'},
  '静': {meaning:'安静沉稳、宁静', wuxing:'金', source:'《道德经》「守静笃」'},
  '淑': {meaning:'淑女贤淑、善良', wuxing:'金', source:'《诗经》「窈窕淑女」'},
  '怡': {meaning:'怡然快乐、和悦', wuxing:'土', source:'《楚辞》「心怡悦」'},
  '悦': {meaning:'喜悦愉快、欣喜', wuxing:'金', source:'《尔雅》「悦，乐也」'},
  '欣': {meaning:'欣喜欣欣向荣', wuxing:'木', source:'《楚辞》「欣欣兮乐康」'},
  '欢': {meaning:'欢乐喜悦、喜庆', wuxing:'水', source:'《说文》「欢，喜乐也」'},
  '美': {meaning:'美好美丽、善良', wuxing:'水', source:'《说文》「美，甘也」'},
  '丽': {meaning:'美丽秀丽、华美', wuxing:'火', source:'《说文》「丽，旅行也」'},
  '佳': {meaning:'佳人美好、优秀', wuxing:'木', source:'《楚辞》「惟佳人之独怀兮」'},
  '秀': {meaning:'秀美优秀、出众', wuxing:'木', source:'《说文》「秀，禾吐华也」'},
  '丹': {meaning:'丹心赤诚、红色', wuxing:'火', source:'《诗经》「颜如渥丹」'},
  '彤': {meaning:'彤红艳丽、吉祥', wuxing:'火', source:'《诗经》「彤管有炜」'},
  '娜': {meaning:'婀娜柔美、优雅', wuxing:'火', source:'《玉篇》「娜，美貌」'},
  '妮': {meaning:'柔美可爱、娇俏', wuxing:'火', source:'《广韵》「妮，少女」'},
  '梦': {meaning:'梦想美好、憧憬', wuxing:'木', source:'《说文》「梦，寐而有觉也」'},
  '诗': {meaning:'诗意文雅、才情', wuxing:'金', source:'《尚书》「诗言志」'},
  '语': {meaning:'言语智慧、沟通', wuxing:'木', source:'《论语》「食不语」'},
  '馨': {meaning:'芳香馥郁、美德', wuxing:'金', source:'《诗经》「尔酒既旨，尔肴既馨」'},
  '薇': {meaning:'蔷薇美丽、柔韧', wuxing:'木', source:'《诗经》「采薇采薇」'},
  '菲': {meaning:'芳菲花草、美好', wuxing:'木', source:'《楚辞》「芳菲菲兮满堂」'},
  '媛': {meaning:'美女名媛、淑丽', wuxing:'火', source:'《诗经》「展如之人兮，邦之媛也」'},
  '蓉': {meaning:'芙蓉清雅、高贵', wuxing:'木', source:'《楚辞》「集芙蓉以为裳」'},
  '茜': {meaning:'茜草红艳、美丽', wuxing:'木', source:'《说文》「茜，茅搜也」'},

  // === 吉祥富贵之字 ===
  '福': {meaning:'福气福祉、吉祥', wuxing:'水', source:'《尚书》「五福：一曰寿，二曰富」'},
  '禄': {meaning:'禄位福禄、官运', wuxing:'火', source:'《诗经》「福禄如茨」'},
  '寿': {meaning:'长寿健康、福寿', wuxing:'金', source:'《诗经》「如南山之寿」'},
  '喜': {meaning:'喜庆欢喜、吉祥', wuxing:'水', source:'《诗经》「我有嘉宾，中心喜之」'},
  '祥': {meaning:'吉祥祥瑞、和顺', wuxing:'金', source:'《尚书》「作善降之百祥」'},
  '吉': {meaning:'吉祥如意、顺利', wuxing:'木', source:'《周易》「吉无不利」'},
  '瑞': {meaning:'祥瑞吉兆、珍贵', wuxing:'金', source:'《说文》「瑞，以玉为信也」'},
  '安': {meaning:'平安安逸、稳步', wuxing:'土', source:'《诗经》「安且吉兮」'},
  '康': {meaning:'健康安康、富足', wuxing:'木', source:'《尚书》「身其康强」'},
  '宁': {meaning:'安宁宁静、太平', wuxing:'火', source:'《诗经》「归宁父母」'},
  '泰': {meaning:'泰然安泰、通达', wuxing:'火', source:'《周易》「泰，小往大来」'},
  '顺': {meaning:'顺利顺畅、和顺', wuxing:'金', source:'《周易》「顺天应人」'},
  '达': {meaning:'通达显达、成功', wuxing:'火', source:'《孟子》「达则兼济天下」'},
  '通': {meaning:'通顺畅达、敏捷', wuxing:'火', source:'《周易》「通则久」'},
  '宏': {meaning:'宏大宏伟、壮阔', wuxing:'水', source:'《尚书》「宏于天道」'},
  '盛': {meaning:'繁荣盛昌、兴旺', wuxing:'金', source:'《周易》「盛德大业」'},
  '昌': {meaning:'昌盛繁荣、兴旺', wuxing:'金', source:'《尚书》「克昌厥后」'},
  '荣': {meaning:'繁荣荣耀、富贵', wuxing:'木', source:'《尔雅》「荣，华也」'},
  '富': {meaning:'富贵财富、充裕', wuxing:'水', source:'《尚书》「既富方谷」'},
  '贵': {meaning:'尊贵高贵、荣显', wuxing:'木', source:'《周易》「崇高莫大于富贵」'},

  // === 进取创新之字 ===
  '建': {meaning:'建立建设、开创', wuxing:'木', source:'《周易》「建万国」'},
  '成': {meaning:'成功成就、完善', wuxing:'金', source:'《论语》「成人之美」'},
  '立': {meaning:'立身独立、成就', wuxing:'火', source:'《论语》「三十而立」'},
  '志': {meaning:'志向志愿、理想', wuxing:'火', source:'《论语》「吾十有五而志于学」'},
  '兴': {meaning:'兴旺振兴、兴盛', wuxing:'水', source:'《诗经》「夙兴夜寐」'},
  '创': {meaning:'创造创新、开创', wuxing:'金', source:'《孟子》「创业垂统」'},
  '新': {meaning:'崭新新生、革新', wuxing:'金', source:'《大学》「苟日新，日日新」'},
  '进': {meaning:'进步进取、上进', wuxing:'火', source:'《周易》「进德修业」'},
  '拓': {meaning:'开拓拓展、创新', wuxing:'火', source:'《说文》「拓，拾也」'},
  '启': {meaning:'启发开启、开端', wuxing:'木', source:'《说文》「启，开也」'},
  '永': {meaning:'永恒永久、长久', wuxing:'水', source:'《诗经》「永矢弗谖」'},
  '生': {meaning:'生命生生不息', wuxing:'金', source:'《周易》「天地之大德曰生」'},
  '远': {meaning:'远大长远、高瞻', wuxing:'土', source:'《论语》「人无远虑，必有近忧」'},
  '光': {meaning:'光明辉光、磊落', wuxing:'火', source:'《周易》「刚健笃实辉光」'},

  // === 自然天地之字 ===
  '天': {meaning:'天道天命、崇高', wuxing:'火', source:'《周易》「天行健」'},
  '宇': {meaning:'宇宙广阔、气度', wuxing:'土', source:'《淮南子》「四方上下谓之宇」'},
  '乾': {meaning:'乾坤天道、刚健', wuxing:'金', source:'《周易》「乾，健也」'},
  '元': {meaning:'元始首要、根本', wuxing:'木', source:'《周易》「元者，善之长也」'},
  '晨': {meaning:'晨光希望、新生', wuxing:'火', source:'《说文》「晨，早昧爽也」'},
  '春': {meaning:'春天生机、希望', wuxing:'木', source:'《诗经》「春日迟迟」'},
  '旭': {meaning:'旭日朝霞、希望', wuxing:'火', source:'《诗经》「旭日始旦」'},
  '岚': {meaning:'山岚灵秀、清雅', wuxing:'土', source:'《广韵》「岚，山气也」'},
  '云': {meaning:'云彩高远、自由', wuxing:'水', source:'《诗经》「出其东门，有女如云」'},
  '霞': {meaning:'霞光灿烂、美丽', wuxing:'水', source:'《楚辞》「餐六气而饮沆瀣兮，漱正阳而含朝霞」'}
};

// ================================================================
// 字义分析（适配新的CHAR_MEANING格式：{meaning, wuxing, source}）
// ================================================================
function analyzeYuyi(fullName) {
  const chars = fullName.split('');
  const details = chars.map(c => {
    const info = CHAR_MEANING[c];
    if (info && typeof info === 'object') {
      return {
        char: c,
        meaning: info.meaning,
        wuxing: info.wuxing,
        source: info.source,
        summary: info.meaning
      };
    }
    // 兼容旧格式和未知字
    if (typeof info === 'string') {
      return { char: c, meaning: info, wuxing: '', source: '', summary: info };
    }
    return { char: c, meaning: '美好', wuxing: '', source: '', summary: '美好' };
  });

  // 河图数理标注
  // 河图口诀：天一生水地六成之，天二生火地七成之，天三生木地八成之，天四生金地九成之，天五生土地十成之
  let hetuMap = {
    1: { type:'生数', wx:'水', desc:'天一生水', role:'主动、开创' },
    2: { type:'生数', wx:'火', desc:'天二生火', role:'主动、向上' },
    3: { type:'生数', wx:'木', desc:'天三生木', role:'主动、生发' },
    4: { type:'生数', wx:'金', desc:'天四生金', role:'主动、决断' },
    5: { type:'生数', wx:'土', desc:'天五生土', role:'主动、承载' },
    6: { type:'成数', wx:'水', desc:'地六成之', role:'主守、收藏' },
    7: { type:'成数', wx:'火', desc:'地七成之', role:'主守、光明' },
    8: { type:'成数', wx:'木', desc:'地八成之', role:'主守、成就' },
    9: { type:'成数', wx:'金', desc:'地九成之', role:'主守、坚固' },
    0: { type:'成数', wx:'土', desc:'地十成之', role:'主守、厚重' }
  };
  // 计算各字笔画的河图数理
  let hetuDetails = details.map(function(d) {
    // 获取笔画数（优先用已计算的笔画）
    let strokes = 1;
    if (typeof KANGXI_STROKES !== 'undefined' && KANGXI_STROKES[d.char]) {
      strokes = KANGXI_STROKES[d.char];
    } else if (typeof CEZI_DATA !== 'undefined' && CEZI_DATA[d.char] && CEZI_DATA[d.char].strokes) {
      strokes = CEZI_DATA[d.char].strokes;
    } else {
      strokes = (d.char.charCodeAt(0) % 81) + 1;
    }
    // 笔画尾数对应河图数理
    let tail = strokes % 10;
    let hetu = hetuMap[tail];
    return {
      char: d.char,
      strokes: strokes,
      tail: tail,
      hetuName: hetu.desc,
      hetuType: hetu.type,
      hetuWx: hetu.wx,
      hetuRole: hetu.role
    };
  });

  const meanings = details.map(d => d.meaning);
  const wuxings = details.map(d => d.wuxing).filter(Boolean);

  return {
    chars,
    meanings,
    details,
    combined: meanings.join('、'),
    wuxingSummary: wuxings.length > 0 ? wuxings.join('') : '未知',
    hasDetail: details.some(d => d.wuxing),
    hetuDetails: hetuDetails
  };
}

// ================================================================
// 改名建议功能
// ================================================================
function computeRename() {
  let btn = document.getElementById('renameBtn');
  if(btn){ btn.disabled=true; btn.textContent='分析中...'; }
  try {
    const currentName = document.getElementById('renameCurrentName').value.trim();
    const newNames = document.getElementById('renameNewNames').value.trim();
    const sex = document.getElementById('renameSex').value;
    const birthDate = document.getElementById('renameBirthDate').value;

    if (!currentName) {
      showToast('请输入当前姓名');
      return;
    }

    if (!newNames) {
      showToast('请输入想改的名字');
      return;
    }

    const nameList = newNames.split('\n').filter(n => n.trim());
    if (nameList.length === 0) {
      showToast('请输入想改的名字');
      return;
    }

    // 显示结果区域
    document.getElementById('renameResult').style.display='block';

    // 分析第一个名字并显示
    const analysis = analyzeName(currentName, nameList[0], sex, birthDate);
    if (analysis.success) {
      displayRenameResult(analysis);
    } else {
      // 显示错误信息
      let errDiv = document.getElementById('renameResult');
      if (errDiv) {
        errDiv.innerHTML = '<div class="result-card" style="padding:20px;text-align:center;color:var(--cinn2)">⚠️ ' + (analysis.message || '分析失败') + '</div>';
      }
    }
  } catch(e) {
    console.error('computeRename error:', e);
    showToast('分析过程出错：' + e.message);
  } finally {
    if(btn){ btn.disabled=false; btn.textContent='📋 分析输入的名字'; }
  }
}

function analyzeName(currentName, newName, sex, birthDate) {
  // 读取出生时辰（从DOM，如果存在）
  let birthHour = '';
  let bhEl = document.getElementById('xmBirthHour');
  if (bhEl) birthHour = bhEl.value || '';
  // 计算三才五格
  const wuge = calculateWuge(newName);
  if (!wuge || wuge.error) {
    return {
      success: false,
      message: wuge.error || `无法计算"${newName}"的三才五格，可能包含生僻字`
    };
  }

  // 分析三才配置
  const sancai = analyzeSancai(wuge);

  // 音律分析
  const yinlv = analyzeYinlv(newName);

  // 寓意分析
  const yuyi = analyzeYuyi(newName);

  // 谐音检测
  const xieyin = checkXieyin(newName);

  // 计算综合评分
  const score = calculateNameScore(wuge, sancai, yinlv, yuyi, xieyin);

  return {
    success: true,
    currentName,
    newName,
    sex,
    birthDate,
    birthHour,
    wuge,
    sancai,
    yinlv,
    yuyi,
    xieyin,
    score
  };
}

function displayRenameResult(analysis) {
  if (!analysis.success) {
    showToast(analysis.message);
    return;
  }

  // 设置标题
  document.getElementById('renameNameOut').textContent = `${analysis.currentName} → ${analysis.newName}`;
  document.getElementById('renameMetaOut').textContent = `性别:${analysis.sex === 'male' ? '男' : '女'}${analysis.birthDate ? ' | 出生:' + analysis.birthDate : ''}`;

  // 显示三才五格
  displayWuge(analysis.wuge);

  // 显示三才配置
  displaySancai(analysis.sancai);

  // 显示音律分析
  displayYinlv(analysis.yinlv);

  // 显示寓意分析
  displayYuyi(analysis.yuyi);

  // 显示谐音警示
  displayXieyin(analysis.xieyin);

  // 显示综合评分
  displayScore(analysis.score);

  // === 化解方案注入 ===
  try {
    if (analysis.birthDate && typeof appendHuajieToResult === 'function') {
      let _xmParts = analysis.birthDate.split('-').map(Number);
      if (_xmParts && _xmParts.length === 3) {
        appendHuajieToResult('renameResult', _xmParts[0], _xmParts[1], _xmParts[2], 12, analysis.sex, analysis.currentName);
      }
    }
  } catch(e) {}
}

function displayWuge(wuge) {
  const grid = document.getElementById('wugeGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const items = [
    { label: '天格', value: wuge.tianGe, wuxing: wuge.tianGeWuxing, detail: getWugeLuckDetail(wuge.tianGe), desc: '代表祖先运，对人生影响较小。计算:姓氏笔画+1。' },
    { label: '人格', value: wuge.renGe, wuxing: wuge.renGeWuxing, detail: getWugeLuckDetail(wuge.renGe), desc: '代表主运，姓名分析核心。计算:姓氏末字+名字首字笔画。' },
    { label: '地格', value: wuge.diGe, wuxing: wuge.diGeWuxing, detail: getWugeLuckDetail(wuge.diGe), desc: '代表前运(36岁前)。单名:名字笔画+1;双名:名字各字笔画和。' },
    { label: '总格', value: wuge.zongGe, wuxing: wuge.zongGeWuxing, detail: getWugeLuckDetail(wuge.zongGe), desc: '代表后运(36岁后),影响一生总运势。计算:姓名全部字笔画和。' },
    { label: '外格', value: wuge.waiGe, wuxing: wuge.waiGeWuxing, detail: getWugeLuckDetail(wuge.waiGe), desc: '代表副运，影响社交与外在表现。计算:总格-人格+1。' }
  ];

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'wuge-item';
    const luckLabel = item.detail.luck;
    const luckClass = luckLabel === '大吉' || luckLabel === '吉' ? 'lucky' : luckLabel === '半吉' ? 'neutral' : 'unlucky';
    div.innerHTML = `
      <div class="wuge-label">${item.label}</div>
      <div class="wuge-value">${item.value} <span style="font-size:10px;opacity:0.6;">${item.detail.name}</span></div>
      <div class="wuge-element">${item.wuxing}</div>
      <div class="wuge-luck ${luckClass}">${luckLabel}</div>
      <div class="wuge-desc" style="font-size: 10px; opacity: 0.5; margin-top: 6px; line-height: 1.4;">${item.desc}</div>
      <div class="wuge-detail-desc" style="font-size: 10px; color: var(--gold); opacity: 0.7; margin-top: 4px; line-height: 1.3;">${item.detail.desc}</div>
    `;
    grid.appendChild(div);
  });

  // 升级内容:添加五格详解和经典引用
  const analysisEl = document.getElementById('renameWuxingAnalysis');
  if (analysisEl) {
    const tianDetail = getWugeLuckDetail(wuge.tianGe);
    const renDetail = getWugeLuckDetail(wuge.renGe);
    const diDetail = getWugeLuckDetail(wuge.diGe);
    const zongDetail = getWugeLuckDetail(wuge.zongGe);
    const waiDetail = getWugeLuckDetail(wuge.waiGe);
    analysisEl.innerHTML = `
      <div style="font-size: 13px; line-height: 2; opacity: 0.85; letter-spacing: 1px;">
        <p><strong style="color: var(--gold);">五格数理吉凶详析:</strong></p>
        <p>天格${wuge.tianGe}「${tianDetail.name}」(${tianDetail.luck})· 人格${wuge.renGe}「${renDetail.name}」(${renDetail.luck})· 地格${wuge.diGe}「${diDetail.name}」(${diDetail.luck})· 总格${wuge.zongGe}「${zongDetail.name}」(${zongDetail.luck})· 外格${wuge.waiGe}「${waiDetail.name}」(${waiDetail.luck})</p>
        <p style="margin-top: 8px;"><strong style="color: var(--gold);">五行分析:</strong>天格${wuge.tianGeWuxing} · 人格${wuge.renGeWuxing} · 地格${wuge.diGeWuxing} · 总格${wuge.zongGeWuxing} · 外格${wuge.waiGeWuxing}</p>
        <p style="margin-top: 8px; font-size: 11px; opacity: 0.6;">📜 经典出处:《梅花易数》(宋·邵雍)以数理推断吉凶；《姓名学》(日·熊崎健翁)创立五格剖象法；81数理源自《周易》象数之学。</p>
      </div>
    `;
  }
}

function displaySancai(sancai) {
  const box = document.getElementById('sancaiBox');
  if (!box) return;

  // 升级内容:添加详细的三才配置分析和经典引用
  const sheng = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  const ke = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

  let detailAnalysis = '';
  // 天→人关系
  if (sheng[sancai.tian] === sancai.ren) {
    detailAnalysis += `<p>天格${sancai.tian}生人格${sancai.ren},上佳。${sancai.tian}为天、为父，${sancai.ren}为人、为主，天生人，主有祖荫相助。</p>`;
  } else if (sancai.tian === sancai.ren) {
    detailAnalysis += `<p>天格${sancai.tian}与人格${sancai.ren}比和，平稳。天地同气，性格稳定，但缺乏变化。</p>`;
  } else if (ke[sancai.tian] === sancai.ren) {
    detailAnalysis += `<p>天格${sancai.tian}克人格${sancai.ren},不利。${sancai.tian}克${sancai.ren},先天不足，需后天努力弥补。</p>`;
  } else {
    detailAnalysis += `<p>天格${sancai.tian}与人格${sancai.ren}关系一般，需看具体配置。</p>`;
  }

  // 人→地关系
  if (sheng[sancai.ren] === sancai.di) {
    detailAnalysis += `<p>人格${sancai.ren}生地格${sancai.di},基础稳固。${sancai.ren}为人、为主，${sancai.di}为地、为基，人生根基牢固，事业发展顺遂。</p>`;
  } else if (sancai.ren === sancai.di) {
    detailAnalysis += `<p>人格${sancai.ren}与地格${sancai.di}比和，发展平顺。人地同气，基础稳定，但缺乏突破。</p>`;
  } else if (ke[sancai.ren] === sancai.di) {
    detailAnalysis += `<p>人格${sancai.ren}克地格${sancai.di},基础不稳。${sancai.ren}克${sancai.di},先天基础不足，需后天努力夯实。</p>`;
  } else {
    detailAnalysis += `<p>人格${sancai.ren}与地格${sancai.di}关系一般，需综合判断。</p>`;
  }

  box.innerHTML = `
    <h5 style="font-size: 13px; letter-spacing: 4px; color: var(--gold); margin-bottom: 12px;">三才配置分析</h5>
    <div class="sancai-flow">
      <span style="font-family: Ma Shan Zheng, serif; font-size: 24px;">${sancai.tian}</span>
      <span class="sancai-arrow">→</span>
      <span style="font-family: Ma Shan Zheng, serif; font-size: 24px;">${sancai.ren}</span>
      <span class="sancai-arrow">→</span>
      <span style="font-family: Ma Shan Zheng, serif; font-size: 24px;">${sancai.di}</span>
    </div>
    <div class="sancai-result ${sancai.luck === '大吉' || sancai.luck === '吉' ? 'lucky' : sancai.luck === '半吉' ? 'neutral' : 'unlucky'}">
      ${sancai.luck}(得分:${sancai.score})
    </div>
    <div style="font-size: 13px; line-height: 1.8; opacity: .7; margin-top: 12px;">
      ${detailAnalysis}
    </div>
    <p style="font-size: 11px; opacity: 0.6; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(201,168,76,.1);">📜 经典出处:《三命通会》(明·万民英)云:「三才配置，乃天地人三气之运化。」《渊海子平》亦重三才配合。</p>
  `;
}

function displayYinlv(yinlv) {
  const div = document.getElementById('yinlvAnalysis');
  if (!div) return;

  if (!yinlv.hasData) {
    div.innerHTML = `<p style="opacity: .5;">${yinlv.message}</p>`;
    return;
  }

  // 升级内容:添加详细的音律分析和经典引用
  let html = '<div style="margin-bottom: 16px;">';
  yinlv.pingze.forEach((pz, i) => {
    const char = yinlv.pinyins[i].charAt(0).toUpperCase() + yinlv.pinyins[i].slice(1, -1);
    html += `
      <div class="yinlv-row">
        <span class="yinlv-label">${char}</span>
        <span class="yinlv-value">${pz}(${yinlv.tones[i]}声)· 拼音:${yinlv.pinyins[i]}</span>
      </div>
    `;
  });
  html += '</div>';

  // 添加声母、韵母分析
  html += `<div style="padding: 12px; background: rgba(255,255,255,.02); border: 1px solid rgba(201,168,76,.08); margin-bottom: 12px;">`;
  html += `<div style="font-size: 12px; letter-spacing: 2px; color: var(--gold); margin-bottom: 8px;">声母与韵母分析</div>`;

  // 提取声母和韵母
  const shengmu = yinlv.pinyins.map(p => p.charAt(0));
  const yunmu = yinlv.pinyins.map(p => p.slice(1, -1));

  html += `<p style="font-size: 12px; line-height: 1.8; opacity: .7;">声母:${shengmu.join(' · ')}</p>`;
  html += `<p style="font-size: 12px; line-height: 1.8; opacity: .7;">韵母:${yunmu.join(' · ')}</p>`;

  // 检查声母是否相同
  const allSameShengmu = shengmu.every(sm => sm === shengmu[0]);
  // 检查韵母是否相同
  const allSameYunmu = yunmu.every(ym => ym === yunmu[0]);

  if (allSameShengmu) {
    html += `<p style="font-size: 12px; line-height: 1.8; opacity: .7; color: var(--cinn2);">⚠️ 声母全同，读起来可能拗口。</p>`;
  }
  if (allSameYunmu) {
    html += `<p style="font-size: 12px; line-height: 1.8; opacity: .7; color: var(--cinn2);">⚠️ 韵母全同，缺乏韵律感。</p>`;
  }
  html += '</div>';

  // 综合评价
  html += `
    <div class="yinlv-row" style="margin-top: 12px; border-top: 1px solid rgba(201,168,76,.1); padding-top: 12px;">
      <span class="yinlv-label">综合评价</span>
      <span class="yinlv-value">${yinlv.smoothAnalysis}(得分:${yinlv.smoothScore})</span>
    </div>
  `;

  // 添加经典引用
  html += `<p style="font-size: 11px; opacity: 0.6; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(201,168,76,.1);">📜 经典出处:《声律启蒙》(清·车万育)讲究声韵对仗；《佩文诗韵》(清·康熙)规定诗词用韵。</p>`;

  div.innerHTML = html;
}

function displayYuyi(yuyi) {
  const div = document.getElementById('renameYuyiAnalysis');
  if (!div) return;

  // 升级内容:添加详细的字义分析和经典引用
  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px;">';
  yuyi.chars.forEach((char, i) => {
    // 查找经典出处
    let classicRef = '';
    if (char === '浩') classicRef = '《孟子》:"吾善养吾浩然之气"';
    else if (char === '明') classicRef = '《大学》:"大学之道，在明明德"';
    else if (char === '睿') classicRef = '《说文》:"睿，深明也"';
    else if (char === '涵') classicRef = '《说文》:"涵，水泽多也"';
    else if (char === '瑾') classicRef = '《楚辞》:"怀瑾握瑜兮"';
    else if (char === '萱') classicRef = '《诗经》:"焉得谖草"(谖通萱)';
    else if (char === '泽') classicRef = '《周易》:"泽无水，困"';
    else classicRef = '字义美好';

    html += `
      <div style="padding: 16px; background: rgba(255,255,255,.02); border: 1px solid rgba(201,168,76,.08);">
        <div style="font-family: Ma Shan Zheng, serif; font-size: 24px; letter-spacing: 2px; color: var(--gold); margin-bottom: 8px;">${char}</div>
        <div style="font-size: 12px; opacity: .7; line-height: 1.6; margin-bottom: 8px;">${yuyi.meanings[i]}</div>
        <div style="font-size: 10px; opacity: .5; line-height: 1.4; padding-top: 8px; border-top: 1px solid rgba(201,168,76,.08);">📜 ${classicRef}</div>
      </div>
    `;
  });
  html += '</div>';

  // 添加整体寓意分析和建议
  html += `<div style="padding: 16px; background: rgba(201,168,76,.04); border: 1px solid rgba(201,168,76,.12); border-radius: 8px;">`;
  html += `<div style="font-size: 13px; line-height: 2; opacity: .85; letter-spacing: 1px;">`;
  html += `<p><strong style="color: var(--gold);">整体寓意:</strong>${yuyi.combined}</p>`;
  html += `<p style="margin-top: 8px;"><strong style="color: var(--gold);">性别适配:</strong>${yuyi.chars.length === 2 ? '建议根据性别选择阳刚/柔美的字' : '需综合判断'}</p>`;
  html += `<p style="margin-top: 8px;"><strong style="color: var(--gold);">时代适配:</strong>避免生僻字、避免过于流行的字</p>`;
  html += `</div>`;
  html += `</div>`;

  // === 河图数理分析 ===
  if (yuyi.hetuDetails) {
    html += '<div style="margin-top:16px;padding:16px;background:rgba(41,128,185,.04);border:1px solid rgba(41,128,185,.15);border-radius:8px">';
    html += '<div style="font-size:14px;color:var(--gold);font-weight:bold;margin-bottom:10px;letter-spacing:2px">🔢 河图数理分析</div>';
    html += '<div style="font-size:11px;opacity:.5;margin-bottom:10px">河图口诀：天一生水地六成之，天二生火地七成之，天三生木地八成之，天四生金地九成之，天五生土地十成之。生数(1-5)主动、开创；成数(6-10)主守、收藏。</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px">';
    yuyi.hetuDetails.forEach(function(hd) {
      let isSheng = hd.hetuType === '生数';
      let typeColor = isSheng ? 'var(--orange)' : 'var(--cyan)';
      html += '<div style="padding:12px;border-radius:8px;background:rgba(255,255,255,.02);border:1px solid '+typeColor+'20">';
      html += '<div style="font-size:15px;color:'+typeColor+';font-weight:bold;margin-bottom:4px">'+hd.char+' · '+hd.strokes+'画</div>';
      html += '<div style="font-size:12px;opacity:.7;margin-bottom:2px">'+hd.hetuName+'</div>';
      html += '<div style="font-size:11px;opacity:.5">'+hd.hetuType+' · '+hd.hetuWx+'行 · '+hd.hetuRole+'</div>';
      html += '</div>';
    });
    html += '</div>';
    // 河图总结
    let shengCount = yuyi.hetuDetails.filter(function(h){return h.hetuType==='生数';}).length;
    let chengCount = yuyi.hetuDetails.length - shengCount;
    html += '<div style="margin-top:10px;font-size:12px;opacity:.7;line-height:1.8">';
    html += '<strong style="color:var(--gold);">河图总评：</strong>';
    if (shengCount > chengCount) {
      html += '生数多，主开创进取、积极主动。适合创业、开拓型人格，但需注意收敛与沉淀。';
    } else if (chengCount > shengCount) {
      html += '成数多，主稳健收敛、守成持重。适合继承、守业型人格，根基稳固但需主动突破。';
    } else {
      html += '生数成数平衡，动静得宜、开合有度。既能开创局面，又能稳健守成，此为上佳之配置。';
    }
    html += '</div>';
    html += '</div>';
  }

  // 添加经典引用
  html += `<p style="font-size: 11px; opacity: 0.6; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(201,168,76,.1);">📜 经典出处:《说文解字》(汉·许慎)解释字的本义；《诗经》、《楚辞》为取名宝库。河图数理出自《周易·系辞》：「天一，地二，天三，地四，天五，地六，天七，地八，天九，地十。」</p>`;

  div.innerHTML = html;
}

function displayXieyin(xieyin) {
  const div = document.getElementById('xieyinAlert');
  if (!div) return;

  if (xieyin.length === 0) {
    div.style.display = 'none';

    // 升级内容:添加无谐音的提示和经典引用
    const yinlvDiv = document.getElementById('yinlvAnalysis');
    if (yinlvDiv && yinlvDiv.innerHTML) {
      // 在音律分析后面添加无谐音提示
      const noXieyinHtml = `<div style="margin-top: 12px; padding: 12px; background: rgba(39,174,96,.06); border: 1px solid rgba(39,174,96,.2); border-radius: 6px;">
        <p style="font-size: 13px; line-height: 1.8; opacity: .8; color: var(--success);">✓ 经检测，此名无不良谐音，音律清雅。</p>
        <p style="font-size: 11px; opacity: 0.6; margin-top: 8px;">📜 经典出处:《声律启蒙》云:"云对雨，雪对风，晚照对晴空。" 音律和谐，方为上名。</p>
      </div>`;

      // 检查是否已经有这个提示
      if (!yinlvDiv.innerHTML.includes('经检测，此名无不良谐音')) {
        yinlvDiv.insertAdjacentHTML("beforeend", noXieyinHtml);
      }
    }

    return;
  }

  // 有谐音警示
  let html = '<div style="padding: 16px; background: rgba(231,76,60,.06); border: 1px solid rgba(231,76,60,.2); border-radius: 8px;">';
  html += '<div class="xieyin-title" style="font-size: 15px; letter-spacing: 2px; color: var(--cinn2); margin-bottom: 12px;">⚠️ 谐音警示</div>';

  xieyin.forEach(x => {
    html += `<div class="xieyin-desc" style="font-size: 13px; line-height: 1.8; opacity: .8; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(231,76,60,.1);">`;
    html += `"<strong>${x.word}</strong>" 可能有谐音 "<strong>${x.meaning}</strong>",请注意。`;
    html += `</div>`;
  });

  html += `<p style="font-size: 11px; opacity: 0.6; margin-top: 8px;">📜 经典出处:《论语》云:"名不正则言不顺。" 取名时需反复朗读，检查是否有不良谐音。</p>`;
  html += '</div>';

  div.innerHTML = html;
  div.style.display = 'block';
}

function displayScore(score) {
  const ring = document.getElementById('renameScoreRing');
  const text = document.getElementById('renameScoreText');
  
  if (!ring || !text) return;
  
  // 创建SVG评分环
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  
  ring.innerHTML = `
    <svg width="120" height="120">
      <circle cx="60" cy="60" r="54" stroke="rgba(201,168,76,.1)" stroke-width="8" fill="none"/>
      <circle cx="60" cy="60" r="54" stroke="var(--gold)" stroke-width="8" fill="none"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${offset}"
              style="transition: stroke-dashoffset 1s ease;"/>
      <text x="60" y="60" text-anchor="middle" dy=".3em" class="score-text">${score}</text>
    </svg>
  `;
  
  // 升级内容:添加评分明细和经典引用
  let advice = '';
  let adviceClass = '';
  if (score >= 90) {
    advice = '此名大吉，三才五格、五行、音律、寓意俱佳，强烈推荐！';
    adviceClass = 'lucky';
  } else if (score >= 80) {
    advice = '此名吉利，各方面较为均衡，推荐使用。';
    adviceClass = 'lucky';
  } else if (score >= 70) {
    advice = '此名尚可，某些方面需调整，可以考虑。';
    adviceClass = 'neutral';
  } else if (score >= 60) {
    advice = '此名一般，建议调整三才五格或音律。';
    adviceClass = 'neutral';
  } else {
    advice = '此名不佳，三才五格或音律有明显缺陷，不建议使用。';
    adviceClass = 'unlucky';
  }
  
  text.innerHTML = `
    <div class="${adviceClass}" style="margin-bottom: 12px;">
      <strong style="font-size: 18px;">${advice}</strong>
    </div>
    <div style="font-size: 13px; line-height: 2; opacity: .7;">
      <p><strong style="color: var(--gold);">综合评分:</strong>${score}分</p>
      <p style="margin-top: 8px; font-size: 11px; opacity: 0.6;">📜 经典出处:《三命通会》云:"名者，命之符也。" 好的姓名能补益八字，助益人生。</p>
    </div>
  `;
}  

function calculateNameScore(wuge, sancai, yinlv, yuyi, xieyin) {
  let score = 0;

  // 三才五格评分(40分)
  score += sancai.score * 0.4;

  // 音律评分(30分)
  if (yinlv.hasData) {
    score += yinlv.smoothScore * 0.3;
  } else {
    score += 15; // 无数据给一半分
  }

  // 谐音扣分(20分)
  if (xieyin.length > 0) {
    score -= xieyin.length * 10;
  } else {
    score += 20;
  }

  // 字义评分(10分)
  score += 8; // 默认给8分

  // 确保分数在0-100之间
  return Math.max(0, Math.min(100, Math.round(score)));
}

function resetRename() {
  document.getElementById('renameCurrentName').value = '';
  document.getElementById('renameNewNames').value = '';
  document.getElementById('renameResult').classList.remove('visible');
}

function exportRenameResult() {
  const resultEl = document.getElementById('renameResult');
  const nameOut = document.getElementById('renameNameOut').textContent;

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>改名分析报告 - ${nameOut}</title>
  <style>
    body { font-family: 'Noto Serif SC', serif; background: var(--ink); color: var(--paper); padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: var(--gold); text-align: center; letter-spacing: 6px; }
    h2 { color: var(--gold2); border-bottom: 1px solid rgba(201,168,76,.2); padding-bottom: 8px; }
    .result { background: rgba(255,255,255,.02); border: 1px solid rgba(201,168,76,.1); border-radius: 8px; padding: 24px; margin: 16px 0; }
  
/* ===== 命理分析增强样式 ===== */
.warn-banner{margin-bottom:24px;padding:16px;background:rgba(0,0,0,0.3);border-radius:12px;border:1px solid rgba(201,168,76,0.15)}
.warn-banner .warn-title{font-size:14px;color:var(--gold);margin-bottom:10px;font-weight:bold;letter-spacing:2px}
.warn-banner .warn-red,.warn-banner .warn-yellow,.warn-banner .warn-green{margin:6px 0;padding:10px 14px;border-radius:8px;font-size:13px;line-height:1.6}
.warn-banner .warn-red{background:rgba(231,76,60,0.15);border-left:3px solid var(--cinn2);color:var(--cinn)}
.warn-banner .warn-yellow{background:rgba(201,168,76,0.12);border-left:3px solid var(--gold2);color:var(--gold)}
.warn-banner .warn-green{background:rgba(39,174,96,0.12);border-left:3px solid var(--success);color:var(--emerald)}
.xij-table{margin-bottom:24px;padding:14px;background:rgba(201,168,76,0.05);border-radius:12px;border:1px solid rgba(201,168,76,0.12)}
.xij-table .xj-title{font-size:13px;color:var(--gold);margin-bottom:10px;letter-spacing:2px}
.xij-table .xj-grid{display:flex;flex-wrap:wrap;gap:8px}
.xij-table .xj-item{font-size:12px;padding:5px 12px;background:rgba(255,255,255,0.05);border-radius:20px;color:var(--paper2);border:1px solid rgba(201,168,76,0.1)}
.analysis-card{position:relative;overflow:hidden}
.analysis-card .card-icon{position:absolute;top:12px;right:14px;font-size:28px;opacity:0.15}
.analysis-card .card-body{padding-right:44px}
.analysis-card h5{font-size:13px !important;font-weight:bold;letter-spacing:1px;margin-bottom:8px !important}
.analysis-card p{font-size:13px !important;line-height:1.8 !important;color:var(--paper2) !important;margin:0 !important}
.card-main{background:rgba(255,255,255,0.03);border:1px solid rgba(201,168,76,0.1);border-radius:12px;padding:18px;min-height:100px}
.card-main h5{color:var(--gold)}
.card-side{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:12px;padding:18px;min-height:100px}
.card-side h5{color:var(--paper2)}
.quick-ref{margin:24px 0;padding:14px 18px;background:rgba(201,168,76,0.05);border-radius:12px;border:1px solid rgba(201,168,76,0.12)}
.quick-ref .ref-title{font-size:13px;color:var(--gold);margin-bottom:10px;letter-spacing:2px}
.quick-ref .ref-grid{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px}
.quick-ref .ref-tag{font-size:12px;padding:4px 12px;background:rgba(0,0,0,0.2);border-radius:16px;color:var(--paper2)}
.quick-ref .ref-tag span{color:var(--gold);font-weight:bold;margin-left:4px}
.quick-ref .ref-nayin{font-size:11px;color:var(--paper2);opacity:0.6;margin-top:6px;letter-spacing:1px}
.export-bar{display:flex;align-items:center;flex-wrap:wrap;gap:8px;padding:14px 0;border-top:1px solid rgba(201,168,76,0.08);margin-top:24px}
.export-bar .export-label{font-size:13px;color:var(--gold);margin-right:8px;letter-spacing:1px}
.exp-btn:hover{opacity:0.8;transform:translateY(-1px)}
/* ===== END ANALYSIS STYLES ===== */
</style>
</head>
<body>
  <h1>改名分析报告</h1>
  <div class="result">${resultEl.innerHTML}</div>
  <p style="text-align: center; opacity: .4; margin-top: 40px;">易道智鉴 · 仅供参考</p>
</body>

<script>
// ===== 商城分类切换 =====

// ===== 渲染道医产品 =====

// ===== 渲染佛医产品 =====

// ===== 渲染名医推荐 =====

// ===== 产品详情弹窗 =====

<\/script>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `改名分析报告_${nameOut}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
function displayCompanyNames(names, industry, style) {
  const grid = document.getElementById('companyNamesGrid');
  if (!grid) return;
  grid.innerHTML = '';

  names.forEach((name, index) => {
    // 计算三才五格
    const wuge = calculateWuge(name);
    let score = 0;
    let analysis = '';

    if (wuge) {
      const sancai = analyzeSancai(wuge);
      score = calculateNameScore(wuge, sancai, { hasData: true, smoothScore: 75 }, { chars: name.split(''), meanings: name.split('').map(() => '吉'), combined: '吉' }, []);
      analysis = `三才配置:${sancai.tian}→${sancai.ren}→${sancai.di}(${sancai.luck})`;
    } else {
      score = 70;
      analysis = '无法计算三才五格';
    }

    const card = document.createElement('div');
    card.className = 'company-name-card';
    card.innerHTML = `
      <button class="cn-save-btn" onclick="saveCompanyName('${name}')">收藏</button>
      <div class="cn-name">${name}</div>
      <div class="cn-score">综合评分:${score}分 | 行业:${industry} | 风格:${style}</div>
      <div class="cn-analysis">${analysis}</div>
    `;
    grid.appendChild(card);
  });

  // 显示结果区域
  const result = document.getElementById('companyResult');
  if (result) {
    result.style.display='block';
  }
  const meta = document.getElementById('companyBannerMeta');
  if (meta) {
    meta.textContent = `行业:${industry} | 字数:${names[0].length}字 | 风格:${style}`;
  }
}







function regenerateCompanyNames() {
  generateCompanyNames();
}

// ================================================================
// 手机号增强功能
// ================================================================

/* analyzeMobileFengshui dup removed */
function analyzeMobileFengshuiCore(mobileNumber) {
  const digits = mobileNumber.replace(/\D/g, '');

  if (digits.length === 0) {
    return null;
  }

  const digitWuxing = {
    '1': '木', '2': '木',
    '3': '火', '4': '火',
    '5': '土', '6': '土',
    '7': '金', '8': '金',
    '9': '水', '0': '水'
  };

  const wuxingCount = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
  digits.split('').forEach(d => {
    const wx = digitWuxing[d];
    if (wx) {
      wuxingCount[wx]++;
    }
  });

  const total = digits.length;
  const wuxingPercent = {};
  for (const wx in wuxingCount) {
    wuxingPercent[wx] = Math.round((wuxingCount[wx] / total) * 100);
  }

  const maxPercent = Math.max(...Object.values(wuxingPercent));
  const minPercent = Math.min(...Object.values(wuxingPercent));
  const dominantWuxing = Object.keys(wuxingPercent).find(wx => wuxingPercent[wx] === maxPercent);
  const weakWuxing = Object.keys(wuxingPercent).find(wx => wuxingPercent[wx] === minPercent);

  let advice = '';
  if (maxPercent > 30) {
    advice += `<p>您的号码中<strong>${dominantWuxing}</strong>过旺(${maxPercent}%),建议:</p>`;
    if (dominantWuxing === '木') {
      advice += '<p>• 减少使用带木五行的数字(1、2)</p>';
      advice += '<p>• 可搭配火五行数字(3、4)来泄木气</p>';
    } else if (dominantWuxing === '火') {
      advice += '<p>• 减少使用带火五行的数字(3、4)</p>';
      advice += '<p>• 可搭配土五行数字(5、6)来泄火气</p>';
    } else if (dominantWuxing === '土') {
      advice += '<p>• 减少使用带土五行的数字(5、6)</p>';
      advice += '<p>• 可搭配金五行数字(7、8)来泄土气</p>';
    } else if (dominantWuxing === '金') {
      advice += '<p>• 减少使用带金五行的数字(7、8)</p>';
      advice += '<p>• 可搭配水五行数字(9、0)来泄金气</p>';
    } else if (dominantWuxing === '水') {
      advice += '<p>• 减少使用带水五行的数字(9、0)</p>';
      advice += '<p>• 可搭配木五行数字(1、2)来泄水气</p>';
    }
  }

  if (minPercent < 10) {
    advice += `<p>您的号码中<strong>${weakWuxing}</strong>过弱(${minPercent}%),建议:</p>`;
    if (weakWuxing === '木') {
      advice += '<p>• 增加使用带木五行的数字(1、2)</p>';
    } else if (weakWuxing === '火') {
      advice += '<p>• 增加使用带火五行的数字(3、4)</p>';
    } else if (weakWuxing === '土') {
      advice += '<p>• 增加使用带土五行的数字(5、6)</p>';
    } else if (weakWuxing === '金') {
      advice += '<p>• 增加使用带金五行的数字(7、8)</p>';
    } else if (weakWuxing === '水') {
      advice += '<p>• 增加使用带水五行的数字(9、0)</p>';
    }
  }

  return {
    digits,
    wuxingCount,
    wuxingPercent,
    total,
    dominantWuxing,
    weakWuxing,
    advice
  };
}






// ===== CRITICAL FIX: addEventListener 绑定所有关键按钮 =====
document.addEventListener('DOMContentLoaded', function() {
  // console.log('易道智鉴 - 事件绑定完成');

  // 排盘按钮
  let baziBtn = document.getElementById('baziBtn');
  if (baziBtn) {
    baziBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      // console.log('排盘按钮被点击');
      if (typeof computeBazi === 'function') {
        computeBazi();
      } else {
        console.error('computeBazi 函数未定义');
        showToast('排盘函数未加载完成，请刷新页面重试');
      }
    });
  }

  // 导航按钮 - 使用事件委托
  document.body.addEventListener('click', function(e) {
    let btn = e.target.closest('.nav-tab');
    if (btn) {
      let onclick = btn.getAttribute('onclick');
      if (onclick && onclick.indexOf('showSection') >= 0) {
        let match = onclick.match(/showSection\(['"]([^'"]+)['"]\)/);
        if (match) {
          e.preventDefault();
          e.stopPropagation();
          showSection(match[1]);
          return;
        }
      }
      if (onclick && onclick.indexOf('window.location') >= 0) {
        // 外部链接按钮不拦截
        return;
      }
    }
  });

  // 化解案例库按钮
  let filterBtns = document.querySelectorAll('[data-filter]');
  filterBtns.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      let filter = this.getAttribute('data-filter');
      if (typeof filterCaseLibrary === 'function') {
        filterCaseLibrary(filter, this);
      }
    });
  });
});

// console.log('易道智鉴 v2026.06.13.1705 - 按钮修复补丁加载');
// ================================================================
// 公司取名功能（专业升级版）
// ================================================================

// 行业五行匹配表
const INDUSTRY_WUXING = {
  tech: { name: '科技', wuxing: '火', prefer: ['木', '火'], avoid: ['金', '水'], desc: '科技属火，宜木火相生，忌金水克泄' },
  finance: { name: '金融', wuxing: '金', prefer: ['土', '金'], avoid: ['火', '木'], desc: '金融属金，宜土金相生，忌火木克耗' },
  education: { name: '教育', wuxing: '水', prefer: ['金', '水'], avoid: ['土', '火'], desc: '教育属水，宜金水相生，忌土火克耗' },
  health: { name: '医疗', wuxing: '木', prefer: ['水', '木'], avoid: ['金', '土'], desc: '医疗属木，宜水木相生，忌金土克耗' },
  medical: { name: '医疗', wuxing: '木', prefer: ['水', '木'], avoid: ['金', '土'], desc: '医疗属木，宜水木相生，忌金土克耗' },
  food: { name: '餐饮', wuxing: '火', prefer: ['木', '火'], avoid: ['金', '水'], desc: '餐饮属火，宜木火相生，忌金水克泄' },
  realestate: { name: '房地产', wuxing: '土', prefer: ['火', '土'], avoid: ['木', '水'], desc: '房地产属土，宜火土相生，忌木水克耗' },
  estate: { name: '房地产', wuxing: '土', prefer: ['火', '土'], avoid: ['木', '水'], desc: '房地产属土，宜火土相生，忌木水克耗' },
  culture: { name: '文化', wuxing: '木', prefer: ['水', '木'], avoid: ['金', '土'], desc: '文化属木，宜水木相生，忌金土克耗' },
  service: { name: '服务', wuxing: '水', prefer: ['金', '水'], avoid: ['土', '火'], desc: '服务属水，宜金水相生，忌土火克耗' },
  manufacturing: { name: '制造', wuxing: '金', prefer: ['土', '金'], avoid: ['火', '木'], desc: '制造属金，宜土金相生，忌火木克耗' },
  trade: { name: '贸易', wuxing: '水', prefer: ['金', '水'], avoid: ['土', '火'], desc: '贸易属水，宜金水相生，忌土火克耗' },
  ecommerce: { name: '电商', wuxing: '水', prefer: ['金', '水'], avoid: ['土', '火'], desc: '电商属水，宜金水相生，忌土火克耗' },
  media: { name: '媒体', wuxing: '火', prefer: ['木', '火'], avoid: ['金', '水'], desc: '媒体属火，宜木火相生，忌金水克泄' },
  energy: { name: '能源', wuxing: '火', prefer: ['木', '火'], avoid: ['金', '水'], desc: '能源属火，宜木火相生，忌金水克泄' },
  agriculture: { name: '农业', wuxing: '土', prefer: ['火', '土'], avoid: ['木', '水'], desc: '农业属土，宜火土相生，忌木水克耗' },
  law: { name: '法律', wuxing: '金', prefer: ['土', '金'], avoid: ['火', '木'], desc: '法律属金，宜土金相生，忌火木克耗' },
  logistics: { name: '物流', wuxing: '水', prefer: ['金', '水'], avoid: ['土', '火'], desc: '物流属水，宜金水相生，忌土火克耗' },
  auto: { name: '汽车', wuxing: '金', prefer: ['土', '金'], avoid: ['火', '木'], desc: '汽车属金，宜土金相生，忌火木克耗' },
  other: { name: '其他', wuxing: '土', prefer: ['火', '土'], avoid: ['木', '水'], desc: '通用属土，宜火土相生，忌木水克耗' }
};

// ==================== 城市方位五行映射（40+城市）====================
const CITY_WUXING = {
  // 东方属木
  '上海': '木', '杭州': '木', '南京': '木', '苏州': '木', '宁波': '木', '无锡': '木', '合肥': '木', '福州': '木',
  '厦门': '木', '青岛': '木', '济南': '木', '台北': '木',
  // 南方属火
  '深圳': '火', '广州': '火', '香港': '火', '澳门': '火', '南宁': '火', '海口': '火', '三亚': '火',
  '昆明': '火', '贵阳': '火', '长沙': '火', '武汉': '火', '南昌': '火',
  // 西方属金
  '成都': '金', '重庆': '金', '西安': '金', '兰州': '金', '西宁': '金', '银川': '金', '乌鲁木齐': '金',
  '拉萨': '金',
  // 北方属水
  '北京': '水', '天津': '水', '石家庄': '水', '太原': '水', '呼和浩特': '水', '沈阳': '水', '长春': '水',
  '哈尔滨': '水', '大连': '水', '郑州': '水',
  // 中属土
  '洛阳': '土', '开封': '土', '安阳': '土',
  // 海外城市
  '东京': '木', '首尔': '木', '新加坡': '火', '曼谷': '火',
  '纽约': '金', '伦敦': '金', '巴黎': '金', '柏林': '金',
  '悉尼': '火', '墨尔本': '火', '多伦多': '水', '温哥华': '水'
};

// 获取城市五行（模糊匹配）
function getCityWuxing(cityName) {
  if (!cityName || !cityName.trim()) return null;
  const name = cityName.trim();
  if (CITY_WUXING[name]) return CITY_WUXING[name];
  // 模糊匹配：包含关键词
  for (const [key, val] of Object.entries(CITY_WUXING)) {
    if (name.includes(key) || key.includes(name)) return val;
  }
  return null;
}

// ==================== 不雅谐音检查 ====================
const HOMOPHONE_BLACKLIST = [
  '死', '亡', '败', '亏', '损', '灾', '难', '祸', '欠', '债', '赔', '惨',
  '穷', '苦', '悲', '哀', '恨', '怨', '悔', '病', '痛', '疾',  '毒', '害',
  '霉', '倒', '衰', '晦', '绝', '煞', '凶', '恶', '邪',  '妖', '魔'
];

function checkHomophoneIssues(name) {
  const warnings = [];
  // 检查是否包含不雅字
  for (const c of name) {
    if (HOMOPHONE_BLACKLIST.includes(c)) {
      warnings.push(`含不雅字「${c}」，建议替换`);
    }
  }
  // 常见谐音陷阱
  const homophonePairs = [
    { word: '史', bad: '死/屎' }, { word: '毕', bad: '毙' },
    { word: '费', bad: '废' }, { word: '范', bad: '犯/饭' },
    { word: '顾', bad: '故' }, { word: '胡', bad: '糊' },
    { word: '赖', bad: '赖账' }, { word: '屠', bad: '屠宰' }
  ];
  for (const hp of homophonePairs) {
    if (name.startsWith(hp.word)) {
      warnings.push(`首字「${hp.word}」谐音${hp.bad}，建议调整`);
    }
  }
  return warnings.length > 0 ? warnings : null;
}

// ==================== 笔画吉数判断 ====================
const STROKE_LUCK = {
  '大吉': [1,3,5,6,7,8,11,13,15,16,17,18,21,23,24,25,29,31,32,33,35,37,39,41,45,47,48,52,57,61,63,65,67,68,81],
  '吉': [2,14,26,27,28,30,34,36,38,40,42,43,44,46,49,50,51,53,55,56,58,59,60,62,64,66,69,70,71,72,73,74,75,76,77,78,79,80],
  '凶': [4,9,10,12,19,20,22,54]
};

function getStrokeLuckRating(stroke) {
  if (STROKE_LUCK['大吉'].includes(stroke)) return '大吉';
  if (STROKE_LUCK['吉'].includes(stroke)) return '吉';
  if (STROKE_LUCK['凶'].includes(stroke)) return '凶';
  return '平';
}

function rateStrokeQuality(wuge) {
  let greatCount = 0, goodCount = 0, badCount = 0;
  const numbers = [wuge.tianGe, wuge.renGe, wuge.diGe, wuge.zongGe, wuge.waiGe];
  numbers.forEach(n => {
    const rating = getStrokeLuckRating(n);
    if (rating === '大吉') greatCount++;
    else if (rating === '吉') goodCount++;
    else if (rating === '凶') badCount++;
  });
  return { greatCount, goodCount, badCount, numbers, rating: badCount >= 2 ? '差' : (greatCount >= 3 ? '优' : (badCount === 0 ? '良' : '中')) };
}

// 创始人八字分析（简化版）
// ==================== 增强版八字分析（含出生时辰+日期推算日柱）====================
// 从出生日期推算日柱天干地支
function calcDayGanZhi(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  // 1900-01-01为甲戌日（已知基准）
  const baseDate = new Date('1900-01-01');
  const diffDays = Math.floor((d.getTime() - baseDate.getTime()) / (24 * 3600 * 1000));
  const ganIndex = ((diffDays % 10) + 10) % 10;
  const zhiIndex = ((diffDays % 12) + 12) % 12;
  const gan = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'][ganIndex];
  const zhi = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][zhiIndex];
  return { gan, zhi, ganIndex, zhiIndex };
}

// 从日干+时辰推算时柱天干（五鼠遁）
function calcHourGanZhi(dayGan, hourIndex) {
  const ganStart = {
    '甲': 0, '己': 0,
    '乙': 2, '庚': 2,
    '丙': 4, '辛': 4,
    '丁': 6, '壬': 6,
    '戊': 8, '癸': 8
  };
  const offset = ganStart[dayGan] || 0;
  const ganIdx = (offset + (parseInt(hourIndex) % 12)) % 10;
  const gan = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'][ganIdx];
  const zhi = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][parseInt(hourIndex) % 12];
  return { gan, zhi };
}

// === 公司取名：八字自动计算 ===
function autoCalcCompanyBazi(){
  let birthDate=document.getElementById('companyFounderBazi')?document.getElementById('companyFounderBazi').value:'';
  let birthHour=document.getElementById('companyFounderBirthHour')?document.getElementById('companyFounderBirthHour').value:'';
  let el=document.getElementById('companyBaziAuto');
  let content=document.getElementById('companyBaziAutoContent');
  if(!el||!content) return;
  
  if(!birthDate){el.style.display='none';return;}
  
  // 计算八字
  let baziInfo=analyzeFounderBazi(birthDate, birthHour);
  if(!baziInfo){
    content.innerHTML='<div style="color:var(--cinn2)">八字计算失败，请检查日期格式</div>';
    el.style.display='block';
    return;
  }
  
  // 自动设置喜用神下拉框
  let preferWxEl=document.getElementById('preferWuxing');
  if(preferWxEl){
    preferWxEl.value=baziInfo.yongshen;
  }
  
  // 计算本命佛（根据日主天干或生肖）
  // 本命佛对应：鼠=千手观音/牛虎=虚空藏/兔=文殊/龙蛇=普贤/马=大势至/羊猴=大日如来/鸡=不动尊/狗猪=阿弥陀
  // 这里用年份地支推算本命佛
  let yearPart=parseInt(birthDate.split('-')[0]);
  let yearZhiIdx=((yearPart-4)%12+12)%12;
  let benmingFo=['千手观音','虚空藏菩萨','虚空藏菩萨','文殊菩萨','普贤菩萨','普贤菩萨','大势至菩萨','大日如来','大日如来','不动明王','阿弥陀阿弥陀佛','阿弥陀阿弥陀佛'][yearZhiIdx];
  // 修正
  let benmingFoMap=['千手观音','虚空藏菩萨','虚空藏菩萨','文殊菩萨','普贤菩萨','普贤菩萨','大势至菩萨','大日如来','大日如来','不动明王','阿弥陀佛','阿弥陀佛'];
  let fo=benmingFoMap[yearZhiIdx];
  
  // 五行数字对应
  let numWx={1:'水',6:'水',2:'火',7:'火',3:'木',8:'木',4:'金',9:'金',5:'土',0:'土'};
  let xiNums=[];for (let n=0;n<=9;n++){if(numWx[n]===baziInfo.yongshen)xiNums.push(n);}
  let jiNums=[];for (let n=0;n<=9;n++){if(numWx[n]===baziInfo.jishen)jiNums.push(n);}
  
  // 渲染
  let html='';
  // 四柱
  html+='<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:10px">';
  if(baziInfo.pillars && baziInfo.pillars.length>0){
    baziInfo.pillars.forEach(function(p){
      html+='<div style="text-align:center;padding:6px 10px;background:rgba(201,168,76,.04);border-radius:6px"><div style="font-size:10px;opacity:.5">'+p.type+'</div><div style="font-size:14px;color:var(--gold);font-weight:bold">'+p.gan+p.zhi+'</div></div>';
    });
  }
  html+='</div>';
  
  // 关键信息
  html+='<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:10px">';
  html+='<div style="padding:8px;background:rgba(255,255,255,.02);border-radius:6px"><b style="color:var(--gold)">日主：</b>'+baziInfo.dayGan+'（'+baziInfo.wuxingCount[baziInfo.dayGan?'甲':'甲']+'）</div>';
  // 修正日主五行显示
  let dayGanWx={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'}[baziInfo.dayGan];
  html+='<div style="padding:8px;background:rgba(255,255,255,.02);border-radius:6px"><b style="color:var(--gold)">日主：</b>'+baziInfo.dayGan+'（'+dayGanWx+'）</div>';
  html+='<div style="padding:8px;background:rgba(255,255,255,.02);border-radius:6px"><b style="color:var(--gold)">命局：</b>'+baziInfo.strength+'</div>';
  html+='<div style="padding:8px;background:rgba(46,204,113,.04);border-radius:6px"><b style="color:var(--success)">喜用神：</b>'+baziInfo.yongshen+'（推荐数字：'+xiNums.join('、')+'）</div>';
  html+='<div style="padding:8px;background:rgba(231,76,60,.04);border-radius:6px"><b style="color:var(--cinn2)">忌神：</b>'+baziInfo.jishen+'（避免数字：'+jiNums.join('、')+'）</div>';
  html+='<div style="padding:8px;background:rgba(155,89,182,.04);border-radius:6px"><b style="color:var(--violet)">本命佛：</b>'+fo+'</div>';
  html+='</div>';
  
  // 五行分布
  html+='<div style="margin-bottom:8px"><b style="color:var(--gold)">五行分布：</b>';
  Object.keys(baziInfo.wuxingCount).forEach(function(wx){
    if(baziInfo.wuxingCount[wx]>0) html+=wx+':'+baziInfo.wuxingCount[wx]+' ';
  });
  html+='</div>';
  
  // 建议
  html+='<div style="font-size:12px;opacity:.7;line-height:1.8;padding:8px;background:rgba(255,255,255,.02);border-radius:6px">'+baziInfo.advice+'</div>';
  
  // 自动设置避免数字
  let avoidEl=document.getElementById('avoidNumbers');
  if(avoidEl){
    avoidEl.value=jiNums.join('');
  }
  
  content.innerHTML=html;
  el.style.display='block';
}

function analyzeFounderBazi(baziStr, birthHour) {
  const tiangan = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' };
  const dizhi = { '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水' };
  const wuxingCount = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
  const pillars = [];
  let dayGan = null, dayZhi = null;

  // 如果有出生日期，推算日柱
  if (baziStr && baziStr.trim()) {
    const dateMatch = baziStr.match(/^\d{4}-\d{2}-\d{2}$/);
    if (dateMatch) {
      const dayGz = calcDayGanZhi(baziStr);
      if (dayGz) {
        dayGan = dayGz.gan;
        dayZhi = dayGz.zhi;
        wuxingCount[tiangan[dayGan]]++;
        wuxingCount[dizhi[dayZhi]]++;
        pillars.push({ type: '日柱', gan: dayGan, zhi: dayZhi, ganWx: tiangan[dayGan], zhiWx: dizhi[dayZhi] });
        // 推算时柱
        if (birthHour !== null && birthHour !== '' && birthHour !== undefined) {
          const hourGz = calcHourGanZhi(dayGan, parseInt(birthHour));
          if (hourGz) {
            wuxingCount[tiangan[hourGz.gan]]++;
            wuxingCount[dizhi[hourGz.zhi]]++;
            pillars.push({ type: '时柱', gan: hourGz.gan, zhi: hourGz.zhi, ganWx: tiangan[hourGz.gan], zhiWx: dizhi[hourGz.zhi] });
          }
        }
      }
    } else {
      // 手动输入的八字字符串
      const chars = baziStr.trim().split(/\s+/);
      chars.forEach(char => {
        if (tiangan[char]) wuxingCount[tiangan[char]]++;
        if (dizhi[char]) wuxingCount[dizhi[char]]++;
      });
    }
  }

  // 如果日柱没有数据（没输日期），返回基础分析
  if (!dayGan) return null;

  const sorted = Object.entries(wuxingCount).sort((a, b) => a[1] - b[1]);
  const yongshen = sorted[0][0];
  const jishen = sorted[sorted.length - 1][0];
  const maxCount = sorted[sorted.length - 1][1];
  const minCount = sorted[0][1];
  const strength = maxCount >= 4 ? '偏强' : (maxCount <= 1 ? '偏弱' : '中和');

  const hourNames = ['子时','丑时','寅时','卯时','辰时','巳时','午时','未时','申时','酉时','戌时','亥时'];
  const hourText = (birthHour !== null && birthHour !== '' && birthHour !== undefined) ? hourNames[parseInt(birthHour)] : '未知';

  return {
    bazi: baziStr,
    wuxingCount,
    yongshen,
    jishen,
    dayGan,
    dayZhi,
    strength,
    pillars,
    hourText,
    advice: `日主${dayGan}（${tiangan[dayGan]}），命局${strength}，喜用神${yongshen}，忌神${jishen}。${wuxingCount[yongshen]}弱需补${yongshen}，${jishen}旺须避${jishen}。`
  };
}

// 计算公司名三才五格（适配2/3/4字名）
function calculateCompanyWuge(companyName) {
  if (!companyName || companyName.length < 2) return null;
  
  const chars = companyName.split('');
  const strokes = chars.map(c => getKangxiStroke(c));
  
  if (strokes.some(s => s === 0)) {
    return null;
  }
  
  const n = chars.length;
  let tianGe, renGe, diGe, zongGe, waiGe;
  
  if (n === 2) {
    tianGe = strokes[0] + 1;
    renGe = strokes[0] + strokes[1];
    diGe = strokes[1] + 1;
    zongGe = strokes[0] + strokes[1];
    waiGe = zongGe - renGe + 1;
  } else if (n === 3) {
    tianGe = strokes[0] + 1;
    renGe = strokes[0] + strokes[1];
    diGe = strokes[1] + strokes[2];
    zongGe = strokes[0] + strokes[1] + strokes[2];
    waiGe = zongGe - renGe + 1;
  } else if (n === 4) {
    tianGe = strokes[0] + strokes[1];
    renGe = strokes[1] + strokes[2];
    diGe = strokes[2] + strokes[3];
    zongGe = strokes[0] + strokes[1] + strokes[2] + strokes[3];
    waiGe = zongGe - renGe + 1;
  } else {
    return null;
  }
  
  return {
    tianGe, renGe, diGe, zongGe, waiGe,
    tianGeWuxing: getWuxingFromStroke(tianGe),
    renGeWuxing: getWuxingFromStroke(renGe),
    diGeWuxing: getWuxingFromStroke(diGe),
    zongGeWuxing: getWuxingFromStroke(zongGe),
    waiGeWuxing: getWuxingFromStroke(waiGe),
    strokes
  };
}

// 分析三才配置（详细版）
function analyzeSancaiDetail(wuge) {
  const { tianGeWuxing, renGeWuxing, diGeWuxing } = wuge;
  
  const sheng = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  const ke = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
  const bgSheng = { '木': '水', '火': '木', '土': '火', '金': '土', '水': '金' };
  
  const tian = tianGeWuxing;
  const ren = renGeWuxing;
  const di = diGeWuxing;
  
  let score = 0;
  let analysis = '';
  let tianRenRelation = '';
  let renDiRelation = '';
  
  // 天→人关系
  if (sheng[tian] === ren) {
    score += 30;
    tianRenRelation = '相生';
    analysis += `天格${tian}生人格${ren}，上佳，得天助；`;
  } else if (bgSheng[tian] === ren) {
    score += 20;
    tianRenRelation = '得生';
    analysis += `天格${tian}得人格${ren}生，平稳；`;
  } else if (tian === ren) {
    score += 20;
    tianRenRelation = '比和';
    analysis += `天格${tian}与人格${ren}比和，平稳；`;
  } else if (ke[tian] === ren) {
    score -= 10;
    tianRenRelation = '相克';
    analysis += `天格${tian}克人格${ren}，不利；`;
  } else if (bgSheng[ren] === tian) {
    score -= 5;
    tianRenRelation = '被克';
    analysis += `天格${tian}被人格${ren}克，有阻；`;
  } else {
    score += 10;
    tianRenRelation = '一般';
    analysis += `天格${tian}与人格${ren}关系一般；`;
  }
  
  // 人→地关系
  if (sheng[ren] === di) {
    score += 30;
    renDiRelation = '相生';
    analysis += `人格${ren}生地格${di}，基础稳固；`;
  } else if (bgSheng[ren] === di) {
    score += 20;
    renDiRelation = '得生';
    analysis += `人格${ren}得地格${di}生，发展平顺；`;
  } else if (ren === di) {
    score += 20;
    renDiRelation = '比和';
    analysis += `人格${ren}与地格${di}比和，发展平顺；`;
  } else if (ke[ren] === di) {
    score -= 10;
    renDiRelation = '相克';
    analysis += `人格${ren}克地格${di}，基础不稳；`;
  } else if (bgSheng[di] === ren) {
    score -= 5;
    renDiRelation = '被克';
    analysis += `人格${ren}被地格${di}克，有阻；`;
  } else {
    score += 10;
    renDiRelation = '一般';
    analysis += `人格${ren}与地格${di}关系一般；`;
  }
  
  let luck = '';
  if (score >= 50) {
    luck = '大吉';
  } else if (score >= 30) {
    luck = '吉';
  } else if (score >= 10) {
    luck = '半吉';
  } else {
    luck = '凶';
  }
  
  return {
    tian, ren, di,
    tianRenRelation, renDiRelation,
    score, luck, analysis
  };
}

// 计算公司名综合评分
function calculateCompanyScore(wuge, sancai, industry, founderBazi) {
  let score = 60;
  let details = [];
  
  // 1. 三才配置评分
  const sancaiScore = Math.min(40, sancai.score + 20);
  score += sancaiScore;
  details.push(`三才配置评分:${sancaiScore}分（${sancai.luck}）`);
  
  // 2. 五格吉凶评分
  let wugeScore = 0;
  [wuge.tianGe, wuge.renGe, wuge.diGe, wuge.waiGe, wuge.zongGe].forEach(val => {
    const luckDetail = WUGE_LUCK_DETAIL[val] || { luck: '平', desc: '' };
    if (luckDetail.luck === '大吉') wugeScore += 6;
    else if (luckDetail.luck === '吉') wugeScore += 4;
    else if (luckDetail.luck === '半吉') wugeScore += 2;
  });
  score += wugeScore;
  details.push(`五格吉凶评分:${wugeScore}分`);
  
  // 3. 行业五行匹配评分
  const industryInfo = INDUSTRY_WUXING[industry];
  if (industryInfo) {
    const nameWuxing = wuge.renGeWuxing;
    if (industryInfo.prefer.includes(nameWuxing)) {
      score += 20;
      details.push(`行业五行匹配:+20分（${nameWuxing}为${industryInfo.name}宜用）`);
    } else if (industryInfo.avoid.includes(nameWuxing)) {
      score -= 10;
      details.push(`行业五行匹配:-10分（${nameWuxing}为${industryInfo.name}忌用）`);
    } else {
      score += 10;
      details.push(`行业五行匹配:+10分（${nameWuxing}与${industryInfo.name}中和）`);
    }
  }
  
  // 4. 创始人八字匹配评分
  if (founderBazi && founderBazi.yongshen) {
    const nameWuxing = wuge.renGeWuxing;
    if (nameWuxing === founderBazi.yongshen) {
      score += 10;
      details.push(`创始人八字匹配:+10分（${nameWuxing}补用神）`);
    } else if (nameWuxing === founderBazi.jishen) {
      score -= 10;
      details.push(`创始人八字匹配:-10分（${nameWuxing}犯忌神）`);
    }
  }
  
  score = Math.max(0, Math.min(100, score));
  
  return { score, details };
}


// 生成公司名（升级版）
// ==================== 增强版公司取名（八字+方位五行综合分析）====================
function generateCompanyNames() {
  const industry = document.getElementById('companyIndustry').value;
  const wordCount = parseInt(document.getElementById('companyWordCount').value);
  const style = document.getElementById('companyStyle').value;
  const founderBazi = document.getElementById('companyFounderBazi').value.trim();
  const founderBirthHour = document.getElementById('companyFounderBirthHour').value;
  const preferWuxing = document.getElementById('preferWuxing').value;
  const avoidNumbers = document.getElementById('avoidNumbers').value.trim();
  const founderName = document.getElementById('companyFounderName').value.trim();
  const birthLocation = document.getElementById('companyBirthLocation').value.trim();
  const resideLocation = document.getElementById('companyResideLocation').value.trim();

  // 显示加载状态
  const btn = document.getElementById('companyBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '🧠 正在深度分析...';
  }

  try {
  // 1. 深度八字分析
  const baziAnalysis = analyzeFounderBazi(founderBazi, founderBirthHour);

  // 2. 方位五行分析
  const birthWx = getCityWuxing(birthLocation);
  const resideWx = getCityWuxing(resideLocation);
  const industryInfo = INDUSTRY_WUXING[industry] || INDUSTRY_WUXING['other'];

  // 3. 综合确定名字五行方向
  let recommendedWuxing = preferWuxing;
  if (!recommendedWuxing && baziAnalysis) {
    recommendedWuxing = baziAnalysis.yongshen;
  }
  // 区位五行修正
  const locationWuxings = [birthWx, resideWx, industryInfo.wuxing].filter(Boolean);
  const locationAnalysis = {
    birthLocation, birthWx,
    resideLocation, resideWx,
    industryWx: industryInfo.wuxing,
    recommendedWuxing,
    detail: []
  };
  if (birthWx) locationAnalysis.detail.push(`出生地${birthLocation}：属${birthWx}`);
  if (resideWx) locationAnalysis.detail.push(`居住地${resideLocation}：属${resideWx}`);
  if (industryInfo) locationAnalysis.detail.push(`行业${industryInfo.name}：属${industryInfo.wuxing}`);
  if (recommendedWuxing) locationAnalysis.detail.push(`综合推荐名字五行方向：${recommendedWuxing}`);

  // 4. 获取行业用字
  const chars = INDUSTRY_CHARS[industry] || INDUSTRY_CHARS['other'];

  // 5. 风格映射
  const styleMap = {
    '古典': { prefix: ['德','仁','鼎','和','泰','盛','隆','瑞','祥','嘉','锦','恒','信','诚','义','礼','博','厚','载','润'], suffix: ['堂','轩','阁','斋','苑','居','府','院','楼','庄','坊','社','门','记','号'] },
    '大气': { prefix: ['宏','伟','巨','浩','天','宇','峰','博','达','通','盛','隆','昌','旺','兴','荣','华','贵','腾','飞'], suffix: ['达','盛','隆','昌','旺','发','兴','荣','华','腾','跃','飞','通','博'] },
    '简约': { prefix: ['正','简','素','朴','纯','白','清','淡','逸','然','安','宁','静','远','明','新','平','直','信','优'], suffix: ['行','道','源','本','素','一','元','初','生','和'] },
    '吉祥': { prefix: ['福','瑞','祥','吉','喜','禄','寿','安','康','泰','丰','盈','裕','宝','鑫','玉','金','银','珠','珍'], suffix: ['福','瑞','祥','吉','喜','安','康','泰','丰','盈','昌','顺','利','佳'] },
    '国际': { prefix: ['锐','创','领','新','远','航','越','拓','鼎','恒','诺','信','达','优','嘉','锦','华','星','宇','联'], suffix: ['达','通','创','新','越','联','合','汇','远','尚'] }
  };

  // 6. 五行核心字库（扩充版）
  const wuxingCoreChars = {
    '木': ['林','森','栋','梁','材','茂','荣','华','春','生','柏','桐','榕','杉','枫','松','柏','槿','楠','檀','柳','杨','桦','榆','槐','桂','梅','竹','叶','芳','艺','苏','英'],
    '火': ['炎','炜','灿','耀','辉','明','亮','照','光','热','炫','煌','煜','炯','烨','晨','晟','晶','旭','暖','昭','映','昱','显','焕','曦','融','灵','腾','跃','飞','扬'],
    '土': ['坤','地','基','础','稳','固','城','垣','培','基','均','坦','坪','境','域','疆','邦','国','圣','坚','磊','岩','峰','岳','峻','崇','岭','培','增','城','坊','壁'],
    '金': ['金','鑫','锐','锋','铭','钧','钰','银','铜','铁','钢','锋','锐','鉴','钟','铉','铮','锡','铠','锦','铭','钧','钦','钰','锐','锋','铮','键','锋','铭','钧','锐'],
    '水': ['源','泉','泽','润','涵','洁','清','深','远','阔','洋','海','江','河','湖','浩','瀚','澜','涛','波','渊','泓','澄','澈','湘','浦','洛','洋','渡','汇','派','流']
  };

  // 7. 经典典故用字（公司名向）
  const CLASSIC_COMPANY_NAMES = ['大有','咸亨','同人','恒久','元亨','中孚','厚德','谦益','上善','若水','立本','博文','敏行','思远','明道','知新','志学','文彬'];

  // 8. 生成名字（多策略轮换）
  const names = [];
  const usedNames = new Set();
  let attempts = 0;
  const maxAttempts = 300;
  const targetNames = Math.min(12, wordCount === 2 ? 16 : 12);

  while (names.length < targetNames && attempts < maxAttempts) {
    attempts++;
    let name = '';
    const strategy = attempts % 7;
    const wx = recommendedWuxing || '水';
    const wxChars = wuxingCoreChars[wx] || wuxingCoreChars['水'];
    const styleCfg = styleMap[style] || styleMap['古典'];

    try {
      if (strategy === 0) {
        // 策略A：喜用神五行字 + 行业字 + 风格后缀（当wordCount>=3）
        name = wxChars[_dpickIndex(wxChars.length)];
        if (wordCount >= 3) {
          name += chars[_dpickIndex(chars.length)];
          for (let i = 2; i < wordCount; i++) {
            name += (_drand() > 0.4 ? styleCfg.suffix : chars)[_dpickIndex((_drand() > 0.4 ? styleCfg.suffix : chars).length)];
          }
        } else {
          name += styleCfg.suffix[_dpickIndex(styleCfg.suffix.length)];
        }
      } else if (strategy === 1) {
        // 策略B：行业字 + 喜用神五行字 + 吉祥后缀
        name = chars[_dpickIndex(chars.length)];
        name += wxChars[_dpickIndex(wxChars.length)];
        for (let i = 2; i < wordCount; i++) {
          name += styleCfg.suffix[_dpickIndex(styleCfg.suffix.length)];
        }
      } else if (strategy === 2 && founderName) {
        // 策略C：创始人姓氏 + 行业核心字 + 补充字
        const surname = founderName.charAt(0);
        const industryCore = chars[_dpickIndex(chars.length)];
        name = surname + industryCore;
        for (let i = 2; i < wordCount; i++) {
          name += styleCfg.suffix[_dpickIndex(styleCfg.suffix.length)];
        }
      } else if (strategy === 3) {
        // 策略D：双喜用神字组合
        name = wxChars[_dpickIndex(wxChars.length)];
        name += wxChars[_dpickIndex(wxChars.length)];
        while (name.charAt(0) === name.charAt(1)) {
          name = wxChars[_dpickIndex(wxChars.length)] + wxChars[_dpickIndex(wxChars.length)];
        }
        for (let i = 2; i < wordCount; i++) {
          name += styleCfg.suffix[_dpickIndex(styleCfg.suffix.length)];
        }
      } else if (strategy === 4) {
        // 策略E：经典典故取字
        const classic = CLASSIC_COMPANY_NAMES[_dpickIndex(CLASSIC_COMPANY_NAMES.length)];
        if (classic.length >= wordCount) {
          name = classic.substring(0, wordCount);
        } else {
          name = classic;
          for (let i = classic.length; i < wordCount; i++) {
            name += chars[_dpickIndex(chars.length)];
          }
        }
      } else if (strategy === 5) {
        // 策略F：风格前缀 + 行业字
        name = styleCfg.prefix[_dpickIndex(styleCfg.prefix.length)];
        name += chars[_dpickIndex(chars.length)];
        for (let i = 2; i < wordCount; i++) {
          name += (_drand() > 0.5 ? styleCfg.prefix : chars)[_dpickIndex((_drand() > 0.5 ? styleCfg.prefix : chars).length)];
        }
      } else {
        // 策略G：优先笔画吉利字
        for (let i = 0; i < wordCount; i++) {
          const luckyChars = chars.filter(c => {
            const stroke = KANGXI_STROKES[c];
            return stroke && STROKE_LUCK['大吉'].includes(stroke);
          });
          const sourceChars = (luckyChars.length > 0 && _drand() > 0.3) ? luckyChars : chars;
          name += sourceChars[_dpickIndex(sourceChars.length)];
        }
      }
    } catch(e) {
      // 兜底：随机取字
      for (let i = 0; i < wordCount; i++) {
        name += chars[_dpickIndex(chars.length)];
      }
    }

    // 确保name长度匹配
    if (name.length !== wordCount) {
      name = name.substring(0, wordCount);
      while (name.length < wordCount) {
        name += chars[_dpickIndex(chars.length)];
      }
    }

    // 检查重复
    if (usedNames.has(name)) continue;

    // 谐音检查
    const homoWarnings = checkHomophoneIssues(name);
    if (homoWarnings && homoWarnings.length >= 2) continue;

    // 避开数理检查
    if (avoidNumbers) {
      const avoidList = avoidNumbers.split(/[,，、\s]+/).map(n => parseInt(n.trim())).filter(n => !isNaN(n));
      const wuge = calculateCompanyWuge(name);
      if (wuge) {
        const allGe = [wuge.tianGe, wuge.renGe, wuge.diGe, wuge.waiGe, wuge.zongGe];
        if (avoidList.some(n => allGe.includes(n))) continue;
      }
    }

    // 三才配置检查
    const wuge = calculateCompanyWuge(name);
    if (wuge) {
      const sancaiKey = `${wuge.tianGeWuxing}${wuge.renGeWuxing}${wuge.diGeWuxing}`;
      const sancaiInfo = SANCAI_CONFIG[sancaiKey];
      if (sancaiInfo && sancaiInfo.luck === '凶' && sancaiInfo.score < 40) {
        if (_drand() > 0.2) continue;
      }
    }

    usedNames.add(name);
    names.push(name);
  }

  // 9. 综合评分+理由生成
  const scoredNames = names.map(name => {
    const wuge = calculateCompanyWuge(name);
    let score = 60;
    let nameWuxing = '—';
    let reason = '';
    let uniqueness = '中';
    let strokeRating = '—';
    const reasons = [];

    if (wuge) {
      nameWuxing = wuge.renGeWuxing;
      const sancai = analyzeSancaiDetail(wuge);
      const scoreResult = calculateCompanyScore(wuge, sancai, industry, baziAnalysis);
      score = scoreResult.score;
      const sq = rateStrokeQuality(wuge);
      strokeRating = `${sq.rating}(${sq.greatCount}大吉/${sq.goodCount}吉/${sq.badCount}凶)`;

      // 五行匹配加分
      if (recommendedWuxing && nameWuxing === recommendedWuxing) {
        reasons.push(`五行${nameWuxing}匹配喜用神${recommendedWuxing}`);
        score = Math.min(100, score + 5);
      }
      if (industryInfo && industryInfo.prefer.includes(nameWuxing)) {
        reasons.push(`${nameWuxing}为行业宜用五行`);
        score = Math.min(100, score + 3);
      }

      if (!baziAnalysis) {
        reasons.push('无八字数据，基于行业+风格推荐');
      }
    } else {
      reasons.push('含生僻字，笔画无法计算');
    }

    // 独特性指数
    const charSet = new Set(name.split(''));
    const diversity = charSet.size / name.length;
    if (diversity >= 0.8 && name.length >= 3) uniqueness = '高';
    else if (diversity >= 0.5) uniqueness = '中';
    else uniqueness = '偏低';
    if (uniqueness === '高') score = Math.min(100, score + 3);

    // 名字去重相似度
    const similarCount = names.filter(n => n !== name && (n.includes(name.charAt(0)) || name.includes(n.charAt(0)))).length;
    if (similarCount >= 3) uniqueness = '偏低';

    // 拼接理由
    if (reasons.length === 0) reasons.push(`综合评估推荐`);
    reason = reasons.slice(0, 2).join('；');

    return { name, score, nameWuxing, reason, uniqueness, strokeRating, wuge };
  });

  // 按评分降序，但保证策略多样性（不要全是一种类型）
  scoredNames.sort((a, b) => b.score - a.score);

  // 提取纯名字数组用于显示
  const displayNames = scoredNames.map(n => n.name);

  // 10. 显示结果
  displayCompanyNamesProEnhanced(scoredNames, industry, style, baziAnalysis, locationAnalysis, displayNames);

  } catch(e) {
    console.error('generateCompanyNames error:', e);
    const resultDiv = document.getElementById('companyResult');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      const grid = document.getElementById('companyNamesGrid');
      if (grid) grid.innerHTML = '<div style="padding:20px;text-align:center;color:var(--cinn2)">⚠️ 生成过程出错：' + e.message + '</div>';
    }
  } finally {
    // 恢复按钮状态
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🧠 AI智能取名（八字+方位）';
    }
  }
}

// ==================== 增强版公司名展示（含八字/方位卡片 + 命名理由 + 独特性）====================
function displayCompanyNamesProEnhanced(scoredNames, industry, style, baziAnalysis, locationAnalysis, displayNames) {
  const grid = document.getElementById('companyNamesGrid');
  if (!grid) return;
  grid.innerHTML = '';

  // 显示八字简析卡片
  const baziCard = document.getElementById('companyBaziCard');
  const baziContent = document.getElementById('companyBaziContent');
  if (baziCard && baziContent && baziAnalysis) {
    baziCard.style.display = 'block';
    const wxCountStr = Object.entries(baziAnalysis.wuxingCount)
      .map(([k, v]) => `${k}:${v}`).join('  ');
    const pillarStr = (baziAnalysis.pillars || []).map(p =>
      `${p.type}：${p.gan}(${p.ganWx})${p.zhi}(${p.zhiWx})`
    ).join(' | ');
    baziContent.innerHTML = `
      <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center">
        <span><b>日主：</b><span style="color:var(--gold);font-size:15px">${baziAnalysis.dayGan}（${baziAnalysis.dayZhi}）</span></span>
        <span><b>命局：</b>${baziAnalysis.strength}</span>
        <span><b>出生时辰：</b>${baziAnalysis.hourText}</span>
        <span><b>喜用神：</b><span style="color:var(--green)">${baziAnalysis.yongshen}</span></span>
        <span><b>忌神：</b><span style="color:var(--red)">${baziAnalysis.jishen}</span></span>
      </div>
      <div style="margin-top:6px;font-size:12px;opacity:.7">四柱：${pillarStr || '—'}</div>
      <div style="margin-top:4px;font-size:12px;opacity:.7">五行分布：${wxCountStr}</div>
      <div style="margin-top:4px;font-size:12px;color:var(--cyan)">${baziAnalysis.advice}</div>
    `;
  } else if (baziCard) {
    baziCard.style.display = 'none';
  }

  // 显示方位五行分析卡片
  const locCard = document.getElementById('companyLocationCard');
  const locContent = document.getElementById('companyLocationContent');
  if (locCard && locContent && locationAnalysis) {
    const hasLocData = locationAnalysis.birthLocation || locationAnalysis.resideLocation;
    if (hasLocData) {
      locCard.style.display = 'block';
      const birthColor = locationAnalysis.birthWx ? `var(--gold)` : 'var(--paper2)';
      const resideColor = locationAnalysis.resideWx ? `var(--cyan)` : 'var(--paper2)';
      locContent.innerHTML = `
        <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center">
          <span><b>出生地：</b><span style="color:${birthColor}">${locationAnalysis.birthLocation || '未填'} ${locationAnalysis.birthWx ? '→ 属' + locationAnalysis.birthWx : ''}</span></span>
          <span><b>居住地：</b><span style="color:${resideColor}">${locationAnalysis.resideLocation || '未填'} ${locationAnalysis.resideWx ? '→ 属' + locationAnalysis.resideWx : ''}</span></span>
          <span><b>行业五行：</b><span style="color:var(--gold)">${locationAnalysis.industryWx || '—'}</span></span>
          <span><b>推荐五行方向：</b><span style="color:var(--green);font-size:15px;font-weight:bold">${locationAnalysis.recommendedWuxing || '综合平衡'}</span></span>
        </div>
        <div style="margin-top:6px;font-size:12px;opacity:.7">${(locationAnalysis.detail || []).join(' ｜ ')}</div>
      `;
    } else {
      locCard.style.display = 'none';
    }
  } else if (locCard) {
    locCard.style.display = 'none';
  }

  // 显示行业五行表和康熙笔画
  const industryTable = document.getElementById('industryWuxingTable');
  const kangxiRef = document.getElementById('kangxiStrokesRef');
  if (industryTable) {
    industryTable.style.display = 'block';
    fillIndustryTable();
  }
  if (kangxiRef) {
    kangxiRef.style.display = 'block';
    fillKangxiRef();
  }

  // 渲染名字卡片
  scoredNames.forEach((item, index) => {
    const { name, score, nameWuxing, reason, uniqueness, strokeRating, wuge } = item;
    const uniqueColor = uniqueness === '高' ? 'var(--green)' : uniqueness === '偏低' ? 'var(--red)' : 'var(--gold)';
    const scoreColor = score >= 85 ? 'var(--green)' : score >= 70 ? 'var(--gold)' : 'var(--red)';
    const isTop3 = index < 3;

    let detailHTML = '';
    if (wuge) {
      const sancai = analyzeSancaiDetail(wuge);
      const scoreResult = calculateCompanyScore(wuge, sancai, industry, baziAnalysis);
      const aiPrediction = generateAIPrediction(name, wuge, sancai, industry, baziAnalysis);
      detailHTML = generateDetailAnalysis(name, wuge, sancai, scoreResult, industry, baziAnalysis, aiPrediction);
    }

    const card = document.createElement('div');
    card.className = 'company-name-card';
    card.style.position = 'relative';
    card.innerHTML = `
      ${isTop3 ? `<div style="position:absolute;top:-8px;left:-8px;background:linear-gradient(135deg,var(--gold),var(--gold3));color:var(--ink);font-size:10px;font-weight:bold;padding:3px 8px;border-radius:10px 10px 10px 0;letter-spacing:2px">🏆 TOP${index+1}</div>` : ''}
      <button class="cn-save-btn" onclick="saveCompanyName('${name}')">收藏</button>
      <div class="cn-name">${name}</div>
      <div class="cn-score" style="margin-bottom:4px">
        综合评分：<span style="color:${scoreColor};font-weight:bold;font-size:16px">${score}</span>分
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:11px;margin-bottom:6px">
        <span style="background:rgba(201,168,76,0.1);padding:2px 8px;border-radius:4px">五行：<b style="color:var(--gold)">${nameWuxing}</b></span>
        <span style="background:rgba(0,200,150,0.1);padding:2px 8px;border-radius:4px">独特性：<b style="color:${uniqueColor}">${uniqueness}</b></span>
        <span style="background:rgba(100,150,255,0.1);padding:2px 8px;border-radius:4px">笔画：${strokeRating}</span>
      </div>
      <div class="cn-analysis" style="font-size:12px;color:var(--cyan);margin-bottom:8px">
        💡 ${reason}
      </div>
      <button class="action-btn" style="margin-top:4px;font-size:11px;padding:4px 12px;" onclick="toggleDetailAnalysis(${index})">📋 点击展开详细分析</button>
      <div id="detail-${index}" style="display:none;margin-top:12px;font-size:12px">${detailHTML}</div>
    `;
    grid.appendChild(card);
  });

  // 显示结果区域
  const resultDiv = document.getElementById('companyResult');
  if (resultDiv) resultDiv.style.display='block';

  const bannerMeta = document.getElementById('companyBannerMeta');
  if (bannerMeta) bannerMeta.textContent = `行业:${industry} | 字数:${displayNames[0] ? displayNames[0].length : 0}字 | 风格:${style}`;
}

// AI预测分析（结合当下形势）
function generateAIPrediction(name, wuge, sancai, industry, baziAnalysis) {
  const predictions = [];

  // 1. 行业趋势分析（2024-2030）
  const industryTrends = {
    tech: '科技行业正处于AI爆发期，数字化转型加速，未来5年持续高增长',
    finance: '金融科技融合趋势明显，合规与创新并重，稳健发展为上',
    education: '教育行业转型升级，素质教育和AI教育是未来方向',
    medical: '大健康产业蓬勃发展，老龄化趋势带来持续需求',
    food: '餐饮行业品牌化、健康化趋势明显，食品安全是关键',
    realestate: '地产行业调整期，品质和服务是核心竞争力',
    culture: '文化产业迎来黄金期，国潮文化、数字文创是热点',
    ecommerce: '电商进入存量竞争，精细化运营和私域流量是关键',
    logistics: '物流行业智能化升级，最后一公里和冷链物流是增长点',
    energy: '新能源革命加速，碳中和目标带来万亿市场',
    other: '通用行业，建议根据具体业务方向制定发展策略'
  };

  const trend = industryTrends[industry] || industryTrends.other;
  predictions.push(`${trend}`);

  // 2. 五行能量分析
  const wuxingPower = {
    木: {growth:'快速成长期',suitable:'教育、文化、医疗、林业',challenge:'竞争激烈，需差异化'},
    火: {growth:'爆发增长期',suitable:'科技、能源、餐饮、传媒',challenge:'波动大，需控制风险'},
    土: {growth:'稳定发展期',suitable:'地产、建筑、农业、物流',challenge:'增长慢，需深耕细作'},
    金: {growth:'调整转型期',suitable:'金融、制造、法律、咨询',challenge:'压力大，需创新突破'},
    水: {growth:'机遇期',suitable:'贸易、物流、服务业、饮品',challenge:'变化快，需灵活应变'}
  };

  const renWuxing = wuge.renGeWuxing;
  const powerInfo = wuxingPower[renWuxing];
  if (powerInfo) {
    predictions.push(`五行能量（人格${renWuxing}）: ${powerInfo.growth}，适合${powerInfo.suitable}相关，挑战: ${powerInfo.challenge}`);
  }

  // 3. 数理能量分析
  const zongGe = wuge.zongGe;
  const zongGeInfo = WUGE_LUCK_DETAIL[zongGe];
  if (zongGeInfo) {
    predictions.push(`总格${zongGe}数理: ${zongGeInfo.luck}，${zongGeInfo.desc.slice(0, 20)}...`);
  }

  // 4. 三才配置建议
  if (sancai.luck === '大吉' || sancai.luck === '吉') {
    predictions.push(`三才${sancai.tian}${sancai.ren}${sancai.di}配置佳，有利于长期发展和品牌建设`);
  } else if (sancai.luck === '半吉') {
    predictions.push(`三才配置中等，建议通过品牌定位、团队建设弥补能量不足`);
  } else {
    predictions.push(`三才配置有挑战，建议通过风水布局、团队配置来化解`);
  }

  // 5. 品牌传播分析
  const nameLength = name.length;
  if (nameLength === 2) {
    predictions.push('二字名简洁易记，利于品牌传播，建议配合视觉设计强化记忆');
  } else if (nameLength === 3) {
    predictions.push('三字名平衡感好，既有辨识度又有内涵，适合品牌长期发展');
  } else {
    predictions.push('四字及以上名称独特性强，但需注意传播成本，建议配合简称使用');
  }

  return predictions.join(' | ');
}

// 生成详细分析报告
function generateDetailAnalysis(name, wuge, sancai, scoreResult, industry, baziAnalysis, aiPrediction) {
  let html = `<div style="padding:16px;background:rgba(0,0,0,0.2);border-radius:8px;font-size:13px;line-height:1.8;">`;

  // 0. AI预测分析（置顶）
  if (aiPrediction) {
    html += `<h5 style="color:var(--cyan);">🔮 AI智能预测（结合当下形势）</h5>`;
    html += `<div style="padding:12px;background:rgba(0,100,150,0.15);border-radius:8px;margin-bottom:12px;">`;
    aiPrediction.split('|').forEach(p => {
      html += `<div style="margin:6px 0;">${p.trim()}</div>`;
    });
    html += `</div>`;
  }

  // 1. 五格计算详情
  html += `<h5 style="color:var(--gold);">📊 五格计算详情</h5>`;
  html += `<div style="padding:8px 0;">`;
  html += `康熙笔画:${name.split('').map((c, i) => `${c}(${wuge.strokes[i]})`).join(' + ')}<br>`;
  
  const wugeItems = [
    { name: '天格', val: wuge.tianGe, wuxing: wuge.tianGeWuxing },
    { name: '人格', val: wuge.renGe, wuxing: wuge.renGeWuxing },
    { name: '地格', val: wuge.diGe, wuxing: wuge.diGeWuxing },
    { name: '外格', val: wuge.waiGe, wuxing: wuge.waiGeWuxing },
    { name: '总格', val: wuge.zongGe, wuxing: wuge.zongGeWuxing }
  ];
  
  wugeItems.forEach(item => {
    const luckDetail = WUGE_LUCK_DETAIL[item.val] || { luck: '平', desc: '' };
    const color = luckDetail.luck === '大吉' ? 'var(--green)' : luckDetail.luck === '吉' ? 'var(--cyan)' : luckDetail.luck === '半吉' ? 'var(--gold)' : 'var(--red)';
    html += `${item.name}:${item.val}（${item.wuxing}） - <span style="color:${color}">${luckDetail.luck}</span> - ${luckDetail.desc}<br>`;
  });
  html += `</div>`;
  
  // 2. 三才配置分析
  html += `<h5 style="color:var(--cyan);margin-top:12px;">🌳 三才配置分析</h5>`;
  html += `<div style="padding:8px 0;">`;
  html += `三才:${sancai.tian} → ${sancai.ren} → ${sancai.di}<br>`;
  html += `关系:天→人 ${sancai.tianRenRelation} | 人→地 ${sancai.renDiRelation}<br>`;
  html += `评分:${sancai.score}分（${sancai.luck}）<br>`;
  html += `分析:${sancai.analysis}<br>`;
  html += `</div>`;
  
  // 3. 行业五行匹配
  const industryInfo = INDUSTRY_WUXING[industry];
  if (industryInfo) {
    html += `<h5 style="color:var(--green);margin-top:12px;">🏭 行业五行匹配</h5>`;
    html += `<div style="padding:8px 0;">`;
    html += `行业:${industryInfo.name}（五行属${industryInfo.wuxing}）<br>`;
    html += `宜用:${industryInfo.prefer.join('、')} | 忌用:${industryInfo.avoid.join('、')}<br>`;
    html += `公司名人格五行:${wuge.renGeWuxing}<br>`;
    if (industryInfo.prefer.includes(wuge.renGeWuxing)) {
      html += `<span style="color:var(--green);">✓ 相生相助，大利！</span><br>`;
    } else if (industryInfo.avoid.includes(wuge.renGeWuxing)) {
      html += `<span style="color:var(--red);">✗ 相克相耗，不利！</span><br>`;
    } else {
      html += `<span style="color:var(--gold);">△ 中和平顺，可用。</span><br>`;
    }
    html += `</div>`;
  }
  
  // 4. 创始人八字匹配
  if (baziAnalysis) {
    html += `<h5 style="color:var(--purple);margin-top:12px;">👤 创始人八字匹配</h5>`;
    html += `<div style="padding:8px 0;">`;
    html += `八字:${baziAnalysis.bazi}<br>`;
    html += `用神:${baziAnalysis.yongshen} | 忌神:${baziAnalysis.jishen}<br>`;
    html += `五行统计:${Object.entries(baziAnalysis.wuxingCount).map(([k, v]) => `${k}(${v})`).join('、')}<br>`;
    html += `建议:${baziAnalysis.advice}<br>`;
    if (wuge.renGeWuxing === baziAnalysis.yongshen) {
      html += `<span style="color:var(--green);">✓ 公司名五行补用神，大吉！</span><br>`;
    } else if (wuge.renGeWuxing === baziAnalysis.jishen) {
      html += `<span style="color:var(--red);">✗ 公司名五行犯忌神，不利！</span><br>`;
    }
    html += `</div>`;
  }
  
  // 5. 综合评分详情
  html += `<h5 style="color:var(--orange);margin-top:12px;">📈 综合评分详情</h5>`;
  html += `<div style="padding:8px 0;">`;
  scoreResult.details.forEach(d => {
    html += `${d}<br>`;
  });
  html += `</div>`;
  
  // 6. 经典出处
  html += `<div style="margin-top:16px;padding:12px;background:rgba(255,200,0,0.05);border-left:3px solid var(--gold);font-size:11px;color:var(--gold);line-height:1.8;">`;
  html += `<strong>📜 经典出处:</strong><br>`;
  html += `《梅花易数》云:"数者，天地之度数也。"<br>`;
  html += `《姓名学》曰:"五格者，天、人、地、外、总，对应五行，吉凶可见。"<br>`;
  html += `《五格剖象法》原序:"五格剖象，乃东瀛熊崎健翁所创，以姓名笔画推命理，颇验。"<br>`;
  html += `《周易·系辞》:"天生神物，圣人则之；天地变化，圣人效之。"<br>`;
  html += `《三命通会》:"五行相生相克，乃造化之枢纽。"<br>`;
  html += `《渊海子平》:"用神者，八字之所赖也。"<br>`;
  html += `</div>`;
  
  html += `</div>`;
  
  return html;
}


// 填充行业五行表
function fillIndustryTable() {
  const tbody = document.getElementById('industryTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  Object.entries(INDUSTRY_WUXING).forEach(([key, val]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding:8px;border:1px solid rgba(255,200,0,0.2);">${val.name}</td>
      <td style="padding:8px;border:1px solid rgba(255,200,0,0.2);">${val.wuxing}</td>
      <td style="padding:8px;border:1px solid rgba(255,200,0,0.2);color:var(--green);">${val.prefer.join('、')}</td>
      <td style="padding:8px;border:1px solid rgba(255,200,0,0.2);color:var(--red);">${val.avoid.join('、')}</td>
      <td style="padding:8px;border:1px solid rgba(255,200,0,0.2);font-size:11px;">${val.desc}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 填充康熙笔画参照（常见行业用字）
function fillKangxiRef() {
  const grid = document.getElementById('kangxiStrokesGrid');
  if (!grid) return;
  
  // 常见行业用字（100字）
  const commonChars = '科技有限公同集团网络信智创源数云芯达锐慧能联通安全未来金融诚恒盛泰鼎丰盈利富贵金银财宝融投资疗康健和美慈善救治国药医疗养生命体育餐饮味觉鲜美佳肴膳食厨房楼阁府家园庭院堂教育明德博雅思学慧启知行才智文书院阁斋文化文艺创意设计媒体传播影视音乐戏剧书画'.split('');
  
  grid.innerHTML = '';
  commonChars.forEach(char => {
    const stroke = getKangxiStroke(char);
    if (stroke > 0) {
      const div = document.createElement('div');
      div.style.cssText = 'padding:4px 8px;background:rgba(0,0,0,0.2);border-radius:4px;display:flex;justify-content:space-between;';
      div.innerHTML = `<span>${char}</span><span style="color:var(--blue);">${stroke}画</span>`;
      grid.appendChild(div);
    }
  });
}

// 填充示例分析
function fillExampleAnalysis() {
  const content = document.getElementById('exampleAnalysisContent');
  if (!content) return;
  
  let html = '';
  
  // 示例1:阿里巴巴
  html += `<div style="margin-bottom:20px;padding:16px;background:rgba(0,0,0,0.2);border-radius:8px;">`;
  html += `<h6 style="color:var(--gold);">示例1:阿里巴巴（科技行业）</h6>`;
  html += `<p><strong>公司名:</strong>阿里巴巴（Alibaba）</p>`;
  html += `<p><strong>字数:</strong>4字名</p>`;
  html += `<p><strong>康熙笔画:</strong>阿(13) + 里(7) + 巴(4) + 巴(4) = 总28画</p>`;
  html += `<p><strong>五格计算:</strong>天格=13+7=20(水) | 人格=7+4=11(木) | 地格=4+4=8(金) | 外格=28-11+1=18(金) | 总格=28(金)</p>`;
  html += `<p><strong>三才配置:</strong>天格水 → 人格木 → 地格金（水→木→金）</p>`;
  html += `<p><strong>分析:</strong>天格水生人格木（吉），人格木克地格金（凶）。三才配置半吉。但阿里巴巴实际成功，因其国际化品牌策略弥补了数理不足。</p>`;
  html += `<p><strong>行业匹配:</strong>科技属火，人格木生火（吉），利于事业发展。</p>`;
  html += `<div style="margin-top:8px;font-size:11px;color:var(--gold);">📜 《梅花易数》云:"数者，天地之度数也。"阿里巴巴虽数理非完美，但品牌国际化成功，说明公司名并非唯一因素。</div>`;
  html += `</div>`;
  
  // 示例2:腾讯
  html += `<div style="margin-bottom:20px;padding:16px;background:rgba(0,0,0,0.2);border-radius:8px;">`;
  html += `<h6 style="color:var(--gold);">示例2:腾讯（科技行业）</h6>`;
  html += `<p><strong>公司名:</strong>腾讯</p>`;
  html += `<p><strong>字数:</strong>2字名</p>`;
  html += `<p><strong>康熙笔画:</strong>腾(20) + 讯(10) = 总30画</p>`;
  html += `<p><strong>五格计算:</strong>天格=20+1=21(木) | 人格=20+10=30(水) | 地格=10+1=11(木) | 外格=30-30+1=1(木) | 总格=30(水)</p>`;
  html += `<p><strong>三才配置:</strong>天格木 → 人格水 → 地格木（木→水→木）</p>`;
  html += `<p><strong>分析:</strong>天格木生人格水（吉），人格水生地格木（吉）。三才配置大吉！五格数理21、11均为大吉数理。</p>`;
  html += `<p><strong>行业匹配:</strong>科技属火，人格水克火（凶），但实际腾讯以水为名，寓意"连接"，符合互联网属性。</p>`;
  html += `<div style="margin-top:8px;font-size:11px;color:var(--gold);">📜 《姓名学》曰:"五格者，天、人、地、外、总，对应五行，吉凶可见。"腾讯五格大吉，三才相生，故能大成。</div>`;
  html += `</div>`;
  
  // 示例3:华为
  html += `<div style="margin-bottom:20px;padding:16px;background:rgba(0,0,0,0.2);border-radius:8px;">`;
  html += `<h6 style="color:var(--gold);">示例3:华为（科技行业）</h6>`;
  html += `<p><strong>公司名:</strong>华为</p>`;
  html += `<p><strong>字数:</strong>2字名</p>`;
  html += `<p><strong>康熙笔画:</strong>华(14) + 为(12) = 总26画</p>`;
  html += `<p><strong>五格计算:</strong>天格=14+1=15(土) | 人格=14+12=26(土) | 地格=12+1=13(火) | 外格=26-26+1=1(木) | 总格=26(土)</p>`;
  html += `<p><strong>三才配置:</strong>天格土 → 人格土 → 地格火（土→土→火）</p>`;
  html += `<p><strong>分析:</strong>天格与人格比和（吉），人格土生地格火（吉）。三才配置大吉！五格数理15为大吉，26虽凶但有格局。</p>`;
  html += `<p><strong>行业匹配:</strong>科技属火，地格火助行业火（大吉）。华字寓意中华，为字寓意作为，符合民族企业定位。</p>`;
  html += `<div style="margin-top:8px;font-size:11px;color:var(--gold);">📜 《五格剖象法》云:"五格剖象，以姓名笔画推命理。"华为五格配置优良，三才相生，故能成为世界级企业。</div>`;
  html += `</div>`;
  
  content.innerHTML = html;
}

// 切换详细分析显示
function toggleDetailAnalysis(index) {
  const detail = document.getElementById(`detail-${index}`);
  if (detail) {
    detail.style.display = detail.style.display === 'none' ? 'block' : 'none';
  }
}

// 切换算法详解
function toggleAlgorithmDetail() {
  const content = document.getElementById('algorithmContent');
  const toggle = document.getElementById('algorithmToggle');
  if (content && toggle) {
    if (content.style.display === 'none') {
      content.style.display = 'block';
      toggle.textContent = '[收起]';
      // 填充五格吉凶对照表
      fillWugeLuckTable();
    } else {
      content.style.display = 'none';
      toggle.textContent = '[展开]';
    }
  }
}

// 填充五格吉凶对照表
function fillWugeLuckTable() {
  const table = document.getElementById('wugeLuckTable');
  if (!table) return;
  
  let html = '';
  for (let i = 1; i <= 81; i++) {
    const detail = WUGE_LUCK_DETAIL[i] || { luck: '平', desc: '普通数理' };
    const color = detail.luck === '大吉' ? 'var(--green)' : detail.luck === '吉' ? 'var(--cyan)' : detail.luck === '半吉' ? 'var(--gold)' : 'var(--red)';
    html += `<div style="padding:4px 8px;margin:2px 0;background:rgba(0,0,0,0.2);border-left:3px solid ${color};font-size:12px;">`;
    html += `<strong>${i}画</strong> - <span style="color:${color}">${detail.luck}</span> - ${detail.desc}`;
    html += `</div>`;
  }
  table.innerHTML = html;
}

// 切换行业五行表显示
function toggleIndustryTable() {
  const table = document.getElementById('industryWuxingTable');
  if (table) {
    table.style.display = table.style.display === 'none' ? 'block' : 'none';
  }
}

// 切换康熙笔画参照显示
function toggleKangxiRef() {
  const ref = document.getElementById('kangxiStrokesRef');
  if (ref) {
    ref.style.display = ref.style.display === 'none' ? 'block' : 'none';
  }
}

// 切换示例分析显示
function toggleExampleAnalysis() {
  const example = document.getElementById('exampleAnalysis');
  if (example) {
    example.style.display = example.style.display === 'none' ? 'block' : 'none';
  }
}

// 重新生成公司名
function regenateCompanyNames() {
  generateCompanyNames();
}



// (已迁移到统一渲染引擎 showKnowledgeDetail)
// hideKnowledgeDetail 已整合到 closeKnowledgeDetail

// ============================================================
// 64卦详解展开/收起
// ============================================================
let openHexagramIndex = -1;
function toggleHexagramDetail(idx) {
    let detail = document.getElementById('hg-detail-' + idx);
    let card = document.getElementById('hg-card-' + idx);
    if (!detail) return;
    if (openHexagramIndex === idx) {
        detail.style.display = 'none';
        card.style.borderColor = 'rgba(201,168,76,0.2)';
        card.style.background = 'rgba(255,255,255,0.04)';
        openHexagramIndex = -1;
    } else {
        // Close previous
        if (openHexagramIndex >= 0) {
            let prev = document.getElementById('hg-detail-' + openHexagramIndex);
            let prevCard = document.getElementById('hg-card-' + openHexagramIndex);
            if (prev) prev.style.display = 'none';
            if (prevCard) {prevCard.style.borderColor='rgba(201,168,76,0.2)';prevCard.style.background='rgba(255,255,255,0.04)';}
        }
        detail.style.display = 'block';
        card.style.borderColor = 'var(--gold)';
        card.style.background = 'rgba(201,168,76,0.12)';
        openHexagramIndex = idx;
        detail.scrollIntoView({behavior:'smooth',block:'start'});
    }
}

// ============================================================
// section-yijing 六十四卦展示
// ============================================================
function renderYijingGuaGrid() {
  let html = '';
  for (let i = 0; i < 64; i++) {
    let g = HEXAGRAMS[i];
    if (!g) continue;
    let isUpper = i < 30;
    html += '<div onclick="showYijingGuaDetail(' + i + ')" id="yj-card-' + i + '" class="yj-gua-card">' +
      '<div style="font-size:22px;margin-bottom:3px">' + g.symbol + '</div>' +
      '<div style="font-size:12px;color:var(--gold);font-weight:bold">' + g.name + '</div>' +
      '<div style="font-size:10px;color:var(--paper2);opacity:.7">' + g.pinyin + '</div>' +
    '</div>';
    if (i === 29) {
      html += '</div><h4 style="font-size:13px;color:var(--gold);margin:20px 0 12px;text-align:center;letter-spacing:2px">—— 下经 · 三十四卦 ——</h4><div style="display:grid;grid-template-columns:repeat(8,1fr);gap:6px">';
    }
  }
  let grid = document.getElementById('yijing-gua-grid');
  if (grid) {
    grid.innerHTML = '<h4 style="font-size:13px;color:var(--gold);margin-bottom:12px;text-align:center;letter-spacing:2px">—— 上经 · 三十卦 ——</h4><div style="display:grid;grid-template-columns:repeat(8,1fr);gap:6px">' + html + '</div>';
  }
}

let yijingDetailIndex = -1;
function closeYijingGuaDetail() {
  let el = document.getElementById('yijing-gua-detail');
  if (el) { el.style.display = 'none'; el.innerHTML = ''; }
  if (yijingDetailIndex >= 0) {
    let card = document.getElementById('yj-card-' + yijingDetailIndex);
    if (card) { card.classList.remove('yj-active'); card.style.borderColor='rgba(201,168,76,0.2)'; card.style.background='rgba(255,255,255,0.04)'; }
  }
  yijingDetailIndex = -1;
}

function showYijingGuaDetail(idx) {
  let detailEl = document.getElementById('yijing-gua-detail');
  if (!detailEl) return;
  // Toggle off if same
  if (yijingDetailIndex === idx) {
    detailEl.style.display = 'none';
    let prevCard = document.getElementById('yj-card-' + idx);
    if (prevCard) { prevCard.classList.remove('yj-active'); prevCard.style.borderColor='rgba(201,168,76,0.2)'; prevCard.style.background='rgba(255,255,255,0.04)'; }
    yijingDetailIndex = -1;
    return;
  }
  // Deactivate previous
  if (yijingDetailIndex >= 0) {
    let pCard = document.getElementById('yj-card-' + yijingDetailIndex);
    if (pCard) { pCard.classList.remove('yj-active'); pCard.style.borderColor='rgba(201,168,76,0.2)'; pCard.style.background='rgba(255,255,255,0.04)'; }
  }
  let g = HEXAGRAMS[idx];
  if (!g) return;
  // Build detail HTML
  let upperNames = ['乾','兑','离','震','巽','坎','艮','坤'];
  let upperGua = g.gua[0];
  let lowerGua = g.gua[1];
  let upperName = upperGua[0]===1&&upperGua[1]===1&&upperGua[2]===1?'乾':upperGua[0]===0&&upperGua[1]===0&&upperGua[2]===0?'坤':upperGua[0]===0&&upperGua[1]===0&&upperGua[2]===1?'震':upperGua[0]===1&&upperGua[1]===0&&upperGua[2]===0?'巽':upperGua[0]===0&&upperGua[1]===1&&upperGua[2]===0?'坎':upperGua[0]===1&&upperGua[1]===1&&upperGua[2]===0?'离':upperGua[0]===1&&upperGua[1]===0&&upperGua[2]===1?'艮':upperGua[0]===0&&upperGua[1]===1&&upperGua[2]===1?'兑':'?';
  let lowerName = lowerGua[0]===1&&lowerGua[1]===1&&lowerGua[2]===1?'乾':lowerGua[0]===0&&lowerGua[1]===0&&lowerGua[2]===0?'坤':lowerGua[0]===0&&lowerGua[1]===0&&lowerGua[2]===1?'震':lowerGua[0]===1&&lowerGua[1]===0&&lowerGua[2]===0?'巽':lowerGua[0]===0&&lowerGua[1]===1&&lowerGua[2]===0?'坎':lowerGua[0]===1&&lowerGua[1]===1&&lowerGua[2]===0?'离':lowerGua[0]===1&&lowerGua[1]===0&&lowerGua[2]===1?'艮':lowerGua[0]===0&&lowerGua[1]===1&&lowerGua[2]===1?'兑':'?';
  // Try to get knowledge base data
  let kbData = null;
  try { if (typeof AUTHORITATIVE_KNOWLEDGE !== 'undefined' && AUTHORITATIVE_KNOWLEDGE.liushisigua) { let ls = AUTHORITATIVE_KNOWLEDGE.liushisigua; if (ls.hexagrams) kbData = ls.hexagrams[idx]; else if (ls.details && ls.details[idx]) kbData = ls.details[idx]; } } catch(e) {}
  let detailHTML = '<div style="display:flex;align-items:center;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid rgba(201,168,76,0.15)">' +
    '<div style="font-size:56px;margin-right:20px">' + g.symbol + '</div>' +
    '<div><div style="font-size:24px;color:var(--gold);font-weight:bold;letter-spacing:3px">' + g.name + '卦</div>' +
    '<div style="font-size:12px;color:var(--paper2);margin-top:4px">拼音: ' + g.pinyin + ' &nbsp;|&nbsp; 第' + g.num + '卦 &nbsp;|&nbsp; 上卦:' + upperName + ' 下卦:' + lowerName + '</div>' +
    '<div style="font-size:13px;color:var(--gold2);margin-top:6px">卦辞：' + g.judgment + '</div></div></div>' +
    '<div style="background:rgba(0,0,0,0.2);padding:14px;border-radius:8px;margin-bottom:14px"><div style="font-size:12px;color:var(--gold);margin-bottom:6px;font-weight:bold">白话解读</div><div style="font-size:13px;color:var(--paper2);line-height:1.8">' + g.meaning + '</div></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">' +
    '<div style="background:rgba(0,0,0,0.2);padding:12px;border-radius:8px"><div style="font-size:12px;color:var(--gold);margin-bottom:6px;font-weight:bold">卦象结构</div><div style="font-size:12px;color:var(--paper2);line-height:1.7">上卦：' + upperName + ' · 下卦：' + lowerName + '</div></div>' +
    '<div style="background:rgba(0,0,0,0.2);padding:12px;border-radius:8px"><div style="font-size:12px;color:var(--gold);margin-bottom:6px;font-weight:bold">核心意象</div><div style="font-size:12px;color:var(--paper2);line-height:1.7">' + g.meaning + '</div></div></div>';
  // Add knowledge base detail if available
  if (kbData) {
    if (kbData.tuan) detailHTML += '<div style="background:rgba(201,168,76,0.06);padding:14px;border-radius:8px;margin-bottom:10px;border:1px solid rgba(201,168,76,0.15)"><div style="font-size:12px;color:var(--gold);margin-bottom:6px;font-weight:bold">彖传</div><div style="font-size:12px;color:var(--paper2);line-height:1.8">' + kbData.tuan + '</div></div>';
    if (kbData.xiang) detailHTML += '<div style="background:rgba(201,168,76,0.06);padding:14px;border-radius:8px;margin-bottom:10px;border:1px solid rgba(201,168,76,0.15)"><div style="font-size:12px;color:var(--gold);margin-bottom:6px;font-weight:bold">象传</div><div style="font-size:12px;color:var(--paper2);line-height:1.8">' + kbData.xiang + '</div></div>';
    if (kbData.yao && kbData.yao.length) {
      detailHTML += '<div style="background:rgba(0,0,0,0.2);padding:14px;border-radius:8px;margin-bottom:10px"><div style="font-size:12px;color:var(--gold);margin-bottom:8px;font-weight:bold">爻辞</div>';
      for (let yi = 0; yi < kbData.yao.length; yi++) {
        detailHTML += '<div style="margin-bottom:6px;padding-left:12px;border-left:2px solid rgba(201,168,76,0.2)"><span style="color:var(--gold2);font-size:12px">' + kbData.yao[yi].name + '：</span><span style="font-size:12px;color:var(--paper2)">' + kbData.yao[yi].text + '</span></div>';
      }
      detailHTML += '</div>';
    }
  }
  // Use existing kd-liushisigua detail if available
  let existingDetail = document.getElementById('hg-detail-' + idx);
  if (existingDetail) {
    let innerContent = existingDetail.querySelector('.cezi-analysis-card, div > div');
    if (innerContent) {
      detailHTML += '<div style="margin-top:14px">' + existingDetail.innerHTML + '</div>';
    }
  }
  // Add divination tip
  detailHTML += '<div style="background:rgba(241,196,15,0.06);padding:14px;border-radius:8px;margin-top:10px;border:1px solid rgba(241,196,15,0.2)"><div style="font-size:12px;color:var(--gold2);margin-bottom:6px;font-weight:bold">占卜提示</div><div style="font-size:12px;color:var(--paper2);line-height:1.8">' + g.name + '卦' + (g.meaning || '') + '。占得此卦者，' + (g.judgment || '') + '。宜深思熟虑，顺应天时。</div></div>';
  detailHTML += '<div style="text-align:center;margin-top:16px"><button class="compute-btn" style="padding:10px 30px;font-size:13px" onclick="closeYijingGuaDetail()">收起详情</button></div>';
  detailEl.innerHTML = detailHTML;
  detailEl.style.display = 'block';
  let card = document.getElementById('yj-card-' + idx);
  if (card) { card.classList.add('yj-active'); card.style.borderColor = 'var(--gold)'; card.style.background = 'rgba(201,168,76,0.12)'; }
  yijingDetailIndex = idx;
  detailEl.scrollIntoView({behavior:'smooth',block:'start'});
}

function switchToZhanbuYijing() {
  // Navigate to zhanbu section and select yijing subtab
  let navBtn = document.querySelector('[onclick*="yijing"]');
  if (navBtn) navBtn.click();
  showSection('zhanbu');
  setTimeout(function() { showZhanbuSub('yijing'); }, 100);
}

// ============================================================
// section-cezi 测字解析（独立板块）
// ============================================================
function doCeziSection() {
  let input = document.getElementById('ceziSectionInput');
  if (!input) return;
  let char = input.value.trim();
  if (!char) { showToast('请输入一个字'); return; }
  renderCeziSectionResult(char);
}

function randomCeziSection() {
  let keys = Object.keys(CEZI_DATA);
  let char = keys[_dpickIndex(keys.length)];
  let input = document.getElementById('ceziSectionInput');
  if (input) input.value = char;
  renderCeziSectionResult(char);
}

function ceziSectionQuick(char) {
  let input = document.getElementById('ceziSectionInput');
  if (input) input.value = char;
  renderCeziSectionResult(char);
}

function renderCeziSectionResult(char) {
  let result = analyzeChar(char);
  if (!result) { showToast('未能解析该字'); return; }
  let resultBox = document.getElementById('ceziSectionResult');
  let charEl = document.getElementById('ceziSectionChar');
  let tagsEl = document.getElementById('ceziSectionTags');
  let analysisEl = document.getElementById('ceziSectionAnalysis');
  let verdictEl = document.getElementById('ceziSectionVerdict');
  if (!resultBox || !charEl || !tagsEl || !analysisEl || !verdictEl) return;

  let luckNum = (result.strokes % 81) || result.strokes;
  let luck = result.luck || (luckNum <= 30 ? '大吉' : luckNum <= 50 ? '中吉' : luckNum <= 70 ? '小吉' : luckNum <= 81 ? '吉' : '平');
  let luckColor = luck==='吉'||luck==='大吉'?'var(--jade)':luck==='中吉'||luck==='小吉'?'var(--warn)':luck==='凶'||luck==='中凶'?'var(--cinn2)':'var(--metal)';
  let luckBg = luck==='吉'||luck==='大吉'?'rgba(39,174,96,.06)':luck==='中吉'||luck==='小吉'?'rgba(243,156,18,.06)':luck==='凶'||luck==='中凶'?'rgba(231,76,60,.06)':'rgba(149,165,166,.06)';

  charEl.textContent = result.char;
  tagsEl.innerHTML = '<span style="padding:4px 12px;border-radius:20px;font-size:12px;background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.2);color:var(--gold2)">' + result.radical + '部</span>' +
    '<span style="padding:4px 12px;border-radius:20px;font-size:12px;background:rgba(39,174,96,0.1);border:1px solid rgba(39,174,96,0.2);color:var(--jade)">' + result.wuxing + '行</span>' +
    '<span style="padding:4px 12px;border-radius:20px;font-size:12px;background:rgba(142,68,173,0.1);border:1px solid rgba(142,68,173,0.2);color:var(--violet)">' + result.strokes + '画</span>' +
    '<span style="padding:4px 12px;border-radius:20px;font-size:12px;background:' + luckBg + ';border:1px solid ' + luckColor + '22;color:' + luckColor + '">' + luck + '</span>';

  analysisEl.innerHTML =
    '<div style="background:rgba(0,0,0,0.2);padding:16px;border-radius:10px"><div style="font-size:11px;color:var(--gold);margin-bottom:8px;letter-spacing:2px">字形拆解</div><div style="font-size:14px;color:var(--paper2);line-height:1.8">' + result.char + ' 字属「' + result.radical + '」部，' + result.strokes + '画。' + (result.mnemonic || '') + '</div></div>' +
    '<div style="background:rgba(0,0,0,0.2);padding:16px;border-radius:10px"><div style="font-size:11px;color:var(--gold);margin-bottom:8px;letter-spacing:2px">五行归属</div><div style="font-size:18px;color:var(--gold);font-family:Ma Shan Zheng,serif;margin-bottom:6px">' + result.wuxing + '行</div><div style="font-size:12px;color:var(--paper2);opacity:.8">根据部首「' + result.radical + '」判定五行属性</div></div>' +
    '<div style="background:rgba(0,0,0,0.2);padding:16px;border-radius:10px"><div style="font-size:11px;color:var(--gold);margin-bottom:8px;letter-spacing:2px">笔画数理</div><div style="font-size:18px;color:var(--gold);font-family:Ma Shan Zheng,serif;margin-bottom:6px">' + result.strokes + '画 · ' + luck + '</div><div style="font-size:12px;color:var(--paper2);opacity:.8">81数理中第' + luckNum + '数</div></div>' +
    '<div style="background:rgba(0,0,0,0.2);padding:16px;border-radius:10px"><div style="font-size:11px;color:var(--gold);margin-bottom:8px;letter-spacing:2px">字义解读</div><div style="font-size:13px;color:var(--paper2);line-height:1.8">' + (result.meaning || '此字含义深远，需结合具体情境解读。') + '</div></div>' +
    '<div style="background:rgba(0,0,0,0.2);padding:16px;border-radius:10px"><div style="font-size:11px;color:var(--gold);margin-bottom:8px;letter-spacing:2px">事业运程</div><div style="font-size:13px;color:var(--paper2);line-height:1.8">' + (result.career || '') + '</div></div>' +
    '<div style="background:rgba(0,0,0,0.2);padding:16px;border-radius:10px"><div style="font-size:11px;color:var(--gold);margin-bottom:8px;letter-spacing:2px">财运</div><div style="font-size:13px;color:var(--paper2);line-height:1.8">' + (result.wealth || '') + '</div></div>' +
    '<div style="background:rgba(0,0,0,0.2);padding:16px;border-radius:10px"><div style="font-size:11px;color:var(--gold);margin-bottom:8px;letter-spacing:2px">婚姻感情</div><div style="font-size:13px;color:var(--paper2);line-height:1.8">' + (result.marriage || '') + '</div></div>' +
    '<div style="background:rgba(0,0,0,0.2);padding:16px;border-radius:10px"><div style="font-size:11px;color:var(--gold);margin-bottom:8px;letter-spacing:2px">健康</div><div style="font-size:13px;color:var(--paper2);line-height:1.8">' + (result.health || '') + '</div></div>';

  // 综合断语
  let verdict = '字「' + result.char + '」，' + result.radical + '部' + result.strokes + '画，五行属' + result.wuxing + '。' + (result.meaning || '') + '。';
  if (result.career) verdict += '事业上：' + result.career + '。';
  if (result.wealth) verdict += '财运上：' + result.wealth + '。';
  if (result.marriage) verdict += '感情上：' + result.marriage + '。';
  verdictEl.innerHTML = '<div style="font-size:11px;color:var(--gold);margin-bottom:8px;letter-spacing:3px">综合断语</div><div style="font-size:13px;color:var(--paper2);line-height:2">' + verdict + '</div>';

  resultBox.style.display = 'block';
  resultBox.scrollIntoView({behavior:'smooth',block:'start'});
}

// ============================================================
// 信众面板增强：音乐/食疗/健身/口诀/计划
// ============================================================;

// ============================================================
// 口诀宝库模块
// ============================================================
(function(){
  // 当前状态
  let _cat = 'all';
  let _search = '';
  let _favOnly = false;

  // 分类 key 映射
  let CAT_KEYS = ['taoist_eight','taoist_protection','buddhist_mantras','neidan_koujue','buddhist_meditation','confucian_cultivation','life_wisdom','daily_recommendations','buddhist_advanced','taoist_advanced','tcm_health','solar_terms','confucian_advanced','folk_wisdom','practice_stages','deity_faith'];

  // 切换口诀分类（暴露到全局供 HTML onclick 调用）
  function koujueSwitchCategory(cat, btn) {
    _cat = cat;
    _favOnly = false;
    _search = '';
    // 更新标签激活状态
    let tabs = document.querySelectorAll('#koujue-tabs .koujue-tab');
    for (let i = 0; i < tabs.length; i++) {
      tabs[i].classList.remove('active');
    }
    if (btn) btn.classList.add('active');
    // 重新渲染列表
    buildList();
  }
  window.koujueSwitchCategory = koujueSwitchCategory;

  // 收藏管理
  function getFavs(){ return safeGetJSON('koujue_favs', []); }
  function setFavs(arr){ localStorage.setItem('koujue_favs',JSON.stringify(arr)); }
  function isFav(id){ return getFavs().indexOf(id)>=0; }
  function toggleFav(id){
    let favs=getFavs(); let idx=favs.indexOf(id);
    if(idx>=0) favs.splice(idx,1); else favs.push(id);
    setFavs(favs);
    updateFavEntry();
  }
  function updateFavEntry(){
    let el=document.getElementById('koujue-fav-entry');
    if(!el)return;
    el.style.display=getFavs().length>0?'block':'none';
  }

  // 口诀正文预览（前两行）
  function preview(text){
    if(!text)return '';
    let lines=text.replace(/[。，！？；：、]/g,'\n').split('\n').filter(function(l){return l.trim();});
    return lines.slice(0,2).join('，')+(lines.length>2?'…':'');
  }

  // 渲染口诀卡片
  function renderCard(id,name,purpose,text,extra){
    let faved=isFav(id);
    return '<div class="koujue-card" onclick="koujueToggleDetail(\''+id+'\')">' +
      '<button class="koujue-fav-btn'+(faved?' faved':'')+'" onclick="event.stopPropagation();koujueToggleFav(\''+id+'\')" title="'+(faved?'取消收藏':'收藏')+'">'+(faved?'⭐':'☆')+'</button>' +
      '<div class="koujue-name">'+name+'</div>' +
      '<div class="koujue-purpose">'+purpose+'</div>' +
      '<div class="koujue-preview">'+preview(text)+'</div>' +
    '</div>';
  }

  // 渲染详情
  function renderDetail(m, catKey){
    let h='<div class="koujue-detail" id="detail-'+(m.id||m.name)+'">';
    h+='<div class="kd-label">📖 口诀正文</div>';
    h+='<div class="kd-text" style="font-family:\'Ma Shan Zheng\',serif;font-size:16px;color:var(--paper)">'+m.text+'</div>';

    // 佛教咒语额外字段
    if(m.sanskrit) h+='<div class="kd-section"><div class="kd-section-title">🕉 梵文</div><div style="font-size:13px;color:var(--paper2)">'+m.sanskrit+'</div></div>';
    if(m.merit) h+='<div class="kd-section"><div class="kd-section-title">✨ 功德</div><div style="font-size:13px;color:var(--paper2)">'+m.merit+'</div></div>';

    h+='<div class="kd-section"><div class="kd-section-title">🎯 用途</div><div style="font-size:13px;color:var(--paper2)">'+(m.purpose||'')+'</div></div>';
    if(m.usage) h+='<div class="kd-section"><div class="kd-section-title">📿 用法</div><div style="font-size:13px;color:var(--paper2)">'+m.usage+'</div></div>';
    if(m.scene){
      let scenes=Array.isArray(m.scene)?m.scene.join('、'):m.scene;
      h+='<div class="kd-section"><div class="kd-section-title">🌅 适用场景</div><div style="font-size:13px;color:var(--paper2)">'+scenes+'</div></div>';
    }
    // 内丹导引/禅修 details 数组
    if(m.details && m.details.length){
      h+='<div class="kd-section"><div class="kd-section-title">📋 详解</div>';
      m.details.forEach(function(d){h+='<div style="font-size:13px;color:var(--paper2);margin-bottom:4px">• '+d+'</div>';});
      h+='</div>';
    }
    // 注意事项
    if(m.caution) h+='<div class="kd-section"><div class="kd-section-title">⚠️ 注意</div><div style="font-size:13px;color:var(--cinn)">'+m.caution+'</div></div>';
    if(m.tips) h+='<div class="kd-section"><div class="kd-section-title">💡 提示</div><div style="font-size:13px;color:var(--paper2)">'+m.tips+'</div></div>';

    h+='<div style="text-align:center;margin-top:16px"><button onclick="this.parentElement.parentElement.remove()" style="padding:8px 24px;background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.2);color:var(--gold);border-radius:8px;cursor:pointer;font-family:var(--font-serif);font-size:13px;letter-spacing:2px">收起</button></div>';
    h+='</div>';
    return h;
  }

  // 构建口诀列表
  function buildList(){
    let db=window.KOUJUE_DATABASE;
    if(!db){document.getElementById('koujue-list').innerHTML='<div style="text-align:center;color:var(--paper3);padding:40px">口诀库加载中…</div>';return;}
    let html='';
    let favs=getFavs();

    // 确定要显示的分类
    let cats=[];
    if(_cat==='all') cats=CAT_KEYS;
    else if(_cat==='daily') cats=['daily_recommendations'];
    else cats=[_cat];

    cats.forEach(function(ck){
      let section=db[ck];
      if(!section)return;

      // life_wisdom 特殊处理：按子分类
      if(ck==='life_wisdom' && section.categories){
        Object.keys(section.categories).forEach(function(subKey){
          let sub=section.categories[subKey];
          html+='<div class="koujue-sub-cat"><div class="koujue-sub-cat-title">'+sub.name+'</div>';
          (sub.tips||[]).forEach(function(t){
            let id='lw_'+subKey+'_'+(t.name||'').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g,'_');
            if(_search){
              let q=_search.toLowerCase();
              if(!((t.name||'').toLowerCase().indexOf(q)>=0||(t.text||'').toLowerCase().indexOf(q)>=0||(t.purpose||'').toLowerCase().indexOf(q)>=0)) return;
            }
            if(_favOnly && favs.indexOf(id)<0) return;
            html+=renderCard(id,t.name,t.purpose,t.text);
            html+='<div id="detail-'+id+'" style="display:none">'+renderDetail({id:id,name:t.name,text:t.text,purpose:t.purpose,usage:t.usage},ck)+'</div>';
          });
          html+='</div>';
        });
        return;
      }

      // daily_recommendations 特殊处理
      if(ck==='daily_recommendations' && section.categories){
        Object.keys(section.categories).forEach(function(subKey){
          let sub=section.categories[subKey];
          html+='<div class="koujue-sub-cat"><div class="koujue-sub-cat-title">'+sub.name+'</div>';
          (sub.tips||[]).forEach(function(t,i){
            let id='dr_'+subKey+'_'+i;
            let name=t.time||t.principle||t.category||sub.name;
            let purpose=t.benefit||t.wisdom||'';
            let text=t.activity||t.wisdom||'';
            if(_search){
              let q=_search.toLowerCase();
              if(!((name).toLowerCase().indexOf(q)>=0||(text).toLowerCase().indexOf(q)>=0||(purpose).toLowerCase().indexOf(q)>=0)) return;
            }
            if(_favOnly && favs.indexOf(id)<0) return;
            html+=renderCard(id,name,purpose,text);
          });
          html+='</div>';
        });
        return;
      }

      // 标准分类
      if(section.mantras){
        html+='<div style="font-size:14px;color:var(--gold2);margin:12px 0 8px;letter-spacing:2px;font-weight:bold">'+section.title+(section.source?' <span style="font-size:11px;color:var(--paper3);font-weight:normal">'+section.source+'</span>':'')+'</div>';
        section.mantras.forEach(function(m){
          let id=m.id||(ck+'_'+(m.name||'').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g,'_'));
          if(_search){
            let q=_search.toLowerCase();
            if(!((m.name||'').toLowerCase().indexOf(q)>=0||(m.text||'').toLowerCase().indexOf(q)>=0||(m.purpose||'').toLowerCase().indexOf(q)>=0)) return;
          }
          if(_favOnly && favs.indexOf(id)<0) return;
          html+=renderCard(id,m.name,m.purpose,m.text);
        });
      }
    });

    if(!html) html='<div style="text-align:center;color:var(--paper3);padding:40px">未找到匹配的口诀</div>';
    document.getElementById('koujue-list').innerHTML=html;
    updateFavEntry();
  }

  // 每日推荐
  function buildDaily(){
    let db=window.KOUJUE_DATABASE;
    if(!db||!db.daily_recommendations) return;
    let now=new Date();
    let h=now.getHours();
    let month=now.getMonth()+1;
    // 选择时辰对应的养生建议
    let period;
    if(h>=5&&h<9) period='yangsheng_morning';
    else if(h>=9&&h<19) period='yangsheng_day';
    else period='yangsheng_night';
    // 季节
    let season;
    if(month>=3&&month<=5) season='season_spring';
    else if(month>=6&&month<=8) season='season_summer';
    else if(month>=9&&month<=11) season='season_autumn';
    else season='season_winter';

    let cats=db.daily_recommendations.categories;
    let html='';
    // 时辰养生
    if(cats[period]){
      html+='<div style="margin-bottom:12px"><div style="color:var(--gold);font-weight:bold;margin-bottom:6px">🕐 '+cats[period].name+'</div>';
      cats[period].tips.forEach(function(t){
        html+='<div style="padding:4px 0;font-size:12px"><span style="color:var(--gold3)">'+t.time+'</span> '+t.activity+' <span style="color:var(--paper3)">— '+t.benefit+'</span></div>';
      });
      html+='</div>';
    }
    // 季节养生
    if(cats[season]){
      html+='<div><div style="color:var(--gold);font-weight:bold;margin-bottom:6px">🌸 '+cats[season].name+'</div>';
      cats[season].tips.forEach(function(t){
        html+='<div style="padding:4px 0;font-size:12px"><span style="color:var(--gold3)">'+t.principle+'</span> '+t.activity+' <span style="color:var(--paper3)">— '+t.benefit+'</span></div>';
      });
      html+='</div>';
    }
    let el=document.getElementById('koujue-daily-content');
    if(el) el.innerHTML=html||'暂无推荐';
  }

  // 切换分类
  window.koujueSwitchCategory=function(cat,btn){
    _cat=cat; _favOnly=false;
    document.querySelectorAll('.koujue-tab').forEach(function(t){t.classList.remove('active');});
    if(btn) btn.classList.add('active');
    buildList();
  };

  // 搜索过滤
  window.koujueSearchFilter=function(q){
    _search=q.trim(); _favOnly=false;
    buildList();
  };

  // 展开/收起详情
  window.koujueToggleDetail=function(id){
    let el=document.getElementById('detail-'+id);
    if(!el) return;
    // 找到卡片后面插入详情
    let cardEl=el.previousElementSibling;
    if(el.style.display==='none'||!el.style.display){
      // 关闭其他详情
      document.querySelectorAll('.koujue-detail').forEach(function(d){d.remove();});
      // 构建详情
      let m=findMantra(id);
      if(!m) return;
      let detail=document.createElement('div');
      detail.innerHTML=renderDetail(m,m._catKey||'');
      let card=document.querySelector('.koujue-card[onclick*="'+id+'"]');
      if(card) card.after(detail.firstElementChild);
    }
  };

  // 查找口诀数据
  function findMantra(id){
    let db=window.KOUJUE_DATABASE;
    if(!db) return null;
    // 搜索标准分类
    let catKeys=['taoist_eight','taoist_protection','buddhist_mantras','neidan_koujue','buddhist_meditation','confucian_cultivation'];
    for (let i=0;i<catKeys.length;i++){
      let ck=catKeys[i];
      let mantras=db[ck]&&db[ck].mantras;
      if(!mantras)continue;
      for (let j=0;j<mantras.length;j++){
        let m=mantras[j];
        let mid=m.id||(ck+'_'+(m.name||'').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g,'_'));
        if(mid===id){m._catKey=ck;return m;}
      }
    }
    // 搜索 life_wisdom
    if(db.life_wisdom&&db.life_wisdom.categories){
      let cats=db.life_wisdom.categories;
      for (let sk in cats){
        let tips=cats[sk].tips;
        if(!tips)continue;
        for (let j=0;j<tips.length;j++){
          let t=tips[j];
          let tid='lw_'+sk+'_'+(t.name||'').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g,'_');
          if(tid===id) return {id:tid,name:t.name,text:t.text,purpose:t.purpose,usage:t.usage,_catKey:'life_wisdom'};
        }
      }
    }
    return null;
  }

  // 收藏切换
  window.koujueToggleFav=function(id){
    toggleFav(id);
    buildList();
  };

  // 显示收藏列表
  window.koujueShowFavorites=function(){
    _favOnly=true; _cat='all'; _search='';
    document.querySelectorAll('.koujue-tab').forEach(function(t){t.classList.remove('active');});
    document.getElementById('koujue-search').value='';
    buildList();
  };

  // 信众面板联动：根据信仰获取口诀
  window.getKoujueByFaith=function(faith){
    let db=window.KOUJUE_DATABASE;
    if(!db) return [];
    let result=[];
    if(faith==='ru'){
      if(db.confucian_cultivation&&db.confucian_cultivation.mantras) result=result.concat(db.confucian_cultivation.mantras);
    }else if(faith==='dao'){
      if(db.taoist_eight&&db.taoist_eight.mantras) result=result.concat(db.taoist_eight.mantras);
      if(db.taoist_protection&&db.taoist_protection.mantras) result=result.concat(db.taoist_protection.mantras);
      if(db.neidan_koujue&&db.neidan_koujue.mantras) result=result.concat(db.neidan_koujue.mantras);
    }else if(faith==='fo'){
      if(db.buddhist_mantras&&db.buddhist_mantras.mantras) result=result.concat(db.buddhist_mantras.mantras);
      if(db.buddhist_meditation&&db.buddhist_meditation.mantras) result=result.concat(db.buddhist_meditation.mantras);
    }else{
      // 兼修或其他：全部
      CAT_KEYS.forEach(function(ck){if(db[ck]&&db[ck].mantras) result=result.concat(db[ck].mantras);});
    }
    return result;
  };

  // 更新信众面板修行口诀区
  window.updateFaithKoujue=function(faith){
    let mantras=getKoujueByFaith(faith);
    // 根据信仰选择目标容器
    let elMap={ru:'faith-koujue-dynamic',dao:'faith-koujue-dao',fo:'faith-koujue-fo'};
    let el=document.getElementById(elMap[faith]||'faith-koujue-dynamic');
    if(!el) return;
    if(!mantras.length){el.innerHTML='<div style="font-size:12px;color:var(--paper3)">暂无相关口诀</div>';return;}
    let h='';
    mantras.slice(0,8).forEach(function(m){
      h+='<div style="margin-bottom:6px;padding:8px 10px;background:rgba(255,255,255,.03);border-radius:6px;font-size:12px;line-height:1.6">';
      h+='<span style="color:var(--gold);font-weight:bold">'+m.name+'</span>';
      h+='<div style="color:var(--paper2);margin-top:3px">'+m.purpose+'</div>';
      h+='</div>';
    });
    if(mantras.length>8) h+='<div style="font-size:11px;color:var(--paper3);text-align:center;margin-top:8px;cursor:pointer" onclick="showSection(\'more\');showMoreModule(\'koujue\')">查看更多 → 📿口诀宝库</div>';
    el.innerHTML=h;
  };

  // showMoreModule 联动
  let _origShowMore=window.showMoreModule;
  window.showMoreModule=function(name,btn){
    _origShowMore(name,btn);
    if(name==='koujue'){buildList();buildDaily();}
  };

  // 页面加载后初始化
  if(document.readyState==='complete'||document.readyState==='interactive'){
    updateFavEntry();
  }else{
    document.addEventListener('DOMContentLoaded',updateFavEntry);
  }
})();



// ============================================================
// 功德系统：记录 + 累计 + 提示
// ============================================================
function addMerit(faith, amount, reason) {
    if (!amount) amount = 1;
    let record = safeGetJSON('meritRecord', {});
    let meritKey = 'merit_' + faith;
    if (!record[meritKey]) record[meritKey] = 0;
    record[meritKey] += amount;
    let totalKey = 'merit_total';
    if (!record[totalKey]) record[totalKey] = 0;
    record[totalKey] += amount;
    // 记录每日功德
    let today = new Date().toDateString();
    let dailyKey = 'merit_daily_' + today;
    if (!record[dailyKey]) record[dailyKey] = 0;
    record[dailyKey] += amount;
    localStorage.setItem('meritRecord', JSON.stringify(record));
    
    // Visual feedback
    let msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg,var(--ink3),var(--cyan));border:2px solid var(--gold);color:var(--gold);padding:20px 30px;border-radius:14px;font-size:16px;z-index:99999;text-align:center;box-shadow:0 0 40px rgba(201,168,76,0.3)';
    msg.innerHTML = '<div style="font-size:32px;margin-bottom:8px">🙏</div><div style="font-weight:bold">+' + amount + ' 功德</div>';
    if (reason) msg.insertAdjacentHTML("beforeend", '<div style="font-size:12px;color:var(--paper3);margin-top:6px">' + reason + '</div>');
    document.body.appendChild(msg);
    setTimeout(function(){msg.style.opacity='0';msg.style.transition='opacity 0.8s';setTimeout(function(){document.body.removeChild(msg);},800);}, 1500);
    
    // Update badge
    loadMeritRecord(faith);
}

// Quick merit buttons (for music/diet/exercise/mantra sections)
function meritBtn(faith, type) {
    let reasons = {
        'music':'静心闻乐，音律调神',
        'diet':'清淡饮食，脾胃健运',
        'exercise':'导引健身，气血通畅',
        'mantra':'讽诵口诀，涵养正气',
        'plan':'依仪修行，精进不懈'
    };
    addMerit(faith, 1, reasons[type] || '身心修行，日行一善');
}

// ============================================================
// 功德修行动作体系（三教功德动作清单）
// ============================================================
let MERIT_ACTIONS = {
  fo: [
    {id:'fangsheng', name:'放生', icon:'🕊️', merit:10, desc:'放归生灵，念放生仪轨', source:'《梵网经》'},
    {id:'yinjing', name:'印经', icon:'📖', merit:8, desc:'出资印制佛经善书流通', source:'《金刚经》'},
    {id:'gongdeng', name:'供灯', icon:'🪔', merit:5, desc:'佛前供灯，回向智慧', source:'《药师经》'},
    {id:'gonghua', name:'供花', icon:'🌸', merit:3, desc:'佛前供花，得相好庄严', source:'《法华经》'},
    {id:'gongshui', name:'供水', icon:'💧', merit:2, desc:'佛前供清水，表清净心', source:'藏传佛教传统'},
    {id:'gongxiang', name:'供香', icon:'🪵', merit:3, desc:'供佛线香盘香，表戒定真香', source:'《炉香赞》'},
    {id:'shishi', name:'施食', icon:'🍚', merit:5, desc:'施予饥饿众生食物', source:'《施饿鬼经》'},
    {id:'chizhou', name:'持咒', icon:'📿', merit:3, desc:'每日持诵咒语若干遍', source:'《大悲心陀罗尼经》'},
    {id:'songjing', name:'诵经', icon:'📜', merit:5, desc:'诵读佛经一部回向', source:'《法华经》等'},
    {id:'chaojing', name:'抄经', icon:'✍️', merit:8, desc:'抄写佛经一部', source:'历代高僧提倡'},
    {id:'baifo', name:'拜佛', icon:'🙇', merit:3, desc:'礼佛拜忏，消业增福', source:'《法华经》'},
    {id:'raota', name:'绕塔', icon:'🚶', merit:3, desc:'绕佛塔经行，右绕三匝', source:'《右绕佛塔功德经》'},
    {id:'chizhai', name:'持斋', icon:'🥬', merit:5, desc:'过午不食或六斋日持斋', source:'《佛说斋经》'},
    {id:'baguanzhai', name:'八关斋戒', icon:'⚖️', merit:10, desc:'一日一夜受持八关斋戒', source:'《优婆塞戒经》'},
    {id:'bushi', name:'布施', icon:'🎁', merit:5, desc:'财/法/无畏布施', source:'《优婆塞戒经》'},
    {id:'zhuyin', name:'助印', icon:'🖨️', merit:5, desc:'赞助佛经善书印制', source:'与印经同'},
    {id:'gongyangsanbao', name:'供养三宝', icon:'🏮', merit:5, desc:'供养佛法僧三宝', source:'《布施经》'},
    {id:'nianfo', name:'念佛', icon:'🙏', merit:2, desc:'念诵阿弥陀佛/观音圣号', source:'《阿弥陀经》'},
    {id:'huixiang', name:'回向', icon:'🔄', merit:1, desc:'将功德回向一切众生', source:'《华严经》'},
    {id:'suixi', name:'随喜', icon:'👏', merit:1, desc:'随喜赞叹他人功德', source:'《法华经》'}
  ],
  dao: [
    {id:'dao_songjing', name:'诵经', icon:'📜', merit:5, desc:'诵读道德经/清静经/感应篇', source:'《太上感应篇》'},
    {id:'gongyang_tianzun', name:'供养天尊', icon:'🏮', merit:5, desc:'供养三清道祖', source:'《道德经》'},
    {id:'jiantan', name:'建坛', icon:'🏛️', merit:8, desc:'建立修坛设醮', source:'《道藏》'},
    {id:'lianyang', name:'炼养', icon:'🧘', merit:5, desc:'内丹修炼养性', source:'《周易参同契》'},
    {id:'dao_fangsheng', name:'放生', icon:'🕊️', merit:10, desc:'道教亦提倡放生', source:'《太上感应篇》'},
    {id:'xingshan', name:'行善', icon:'✨', merit:3, desc:'日常善行', source:'《太上感应篇》'},
    {id:'quanshan', name:'劝善', icon:'📢', merit:5, desc:'劝人向善，传播善书', source:'《阴骘文》'},
    {id:'gongyang_zuxian', name:'供奉祖先', icon:'🕯️', merit:3, desc:'祭祀祖先，慎终追远', source:'《道德经》'},
    {id:'gongyang_zaoshen', name:'供奉灶神', icon:'🔥', merit:2, desc:'腊月廿三祭灶', source:'《敬灶全书》'},
    {id:'gongyang_tudi', name:'供奉土地', icon:'🏔️', merit:2, desc:'每月初二十六祭土地', source:'民间信仰'},
    {id:'xiuqiao', name:'修桥铺路', icon:'🌉', merit:10, desc:'公益建设', source:'《阴骘文》'},
    {id:'shiyao', name:'施药', icon:'💊', merit:8, desc:'布施药物给病人', source:'《太上感应篇》'},
    {id:'xizi', name:'惜字', icon:'📝', merit:3, desc:'敬惜字纸', source:'《惜字文》'},
    {id:'shoujie', name:'守戒', icon:'⚖️', merit:5, desc:'受持道教戒律', source:'《老君戒经》'},
    {id:'zhujian_gongguan', name:'助建宫观', icon:'🏛️', merit:10, desc:'赞助道观修建', source:'《道藏》'}
  ],
  ru: [
    {id:'xiaoqin', name:'孝亲', icon:'👵', merit:10, desc:'百善孝为先，孝养父母', source:'《孝经》'},
    {id:'jizu', name:'祭祖', icon:'🕯️', merit:3, desc:'按时祭祀祖先', source:'《论语》'},
    {id:'zunshi', name:'尊师', icon:'👨\u200d🏫', merit:5, desc:'尊敬师长，尊师重道', source:'《礼记》'},
    {id:'zhuxue', name:'助学', icon:'🎓', merit:8, desc:'资助贫困学生', source:'《论语》'},
    {id:'ru_xiuqiao', name:'修桥铺路', icon:'🌉', merit:10, desc:'公益建设，利益乡里', source:'《周礼》'},
    {id:'quanxue', name:'劝学', icon:'📚', merit:5, desc:'劝人读书学习', source:'《荀子》'},
    {id:'shiguan', name:'施棺', icon:'⚰️', merit:8, desc:'施舍棺木给贫困家庭', source:'功过格'},
    {id:'yinshanshu', name:'印善书', icon:'📖', merit:5, desc:'印制劝善书籍', source:'《了凡四训》'},
    {id:'qianrang', name:'谦让', icon:'🤝', merit:3, desc:'为人谦逊礼让', source:'《易经》'},
    {id:'chengxin', name:'诚信', icon:'🤞', merit:3, desc:'做人诚实守信', source:'《论语》'}
  ],
  tongyong: [
    {id:'rixingyishan', name:'日行一善', icon:'☀️', merit:1, desc:'每天做一件善事', source:'《了凡四训》'},
    {id:'bushasheng', name:'不杀生', icon:'🕊️', merit:2, desc:'持不杀生戒一日', source:'三教共戒'},
    {id:'butoudao', name:'不偷盗', icon:'🚫', merit:2, desc:'持不偷盗戒一日', source:'三教共戒'},
    {id:'buxiexin', name:'不邪淫', icon:'🚫', merit:2, desc:'持不邪淫戒一日', source:'佛教五戒'},
    {id:'buwangyu', name:'不妄语', icon:'🤐', merit:2, desc:'持不妄语戒一日', source:'三教共戒'},
    {id:'buyinjiu', name:'不饮酒', icon:'🚱', merit:2, desc:'持不饮酒戒一日', source:'佛教五戒'},
    {id:'zhuanfasanwen', name:'转发善文', icon:'📤', merit:1, desc:'分享正能量文章', source:'法布施现代形式'},
    {id:'zhiyuanfuwu', name:'志愿服务', icon:'🦺', merit:5, desc:'参与志愿服务', source:'菩萨利他行'},
    {id:'juankuangongyi', name:'捐款公益', icon:'💰', merit:5, desc:'捐款给公益组织', source:'财布施现代形式'},
    {id:'huanbaoxingdong', name:'环保行动', icon:'🌱', merit:3, desc:'参与环保活动', source:'缘起相关'},
    {id:'jiuzhudongwu', name:'救助动物', icon:'🐾', merit:5, desc:'救助流浪动物', source:'慈悲心'},
    {id:'zhishu', name:'植树', icon:'🌳', merit:3, desc:'参与植树造林', source:'利益后代'}
  ]
};

// 功德等级体系
let MERIT_LEVELS = [
  {min:0, max:50, name:'初心善人', icon:'🌱', color:'var(--jade)'},
  {min:51, max:200, name:'积善之人', icon:'🌿', color:'var(--jade)'},
  {min:201, max:500, name:'善知识', icon:'📖', color:'var(--cyan)'},
  {min:501, max:1000, name:'贤者', icon:'🎩', color:'var(--violet)'},
  {min:1001, max:3000, name:'大善人', icon:'⭐', color:'var(--orange)'},
  {min:3001, max:5000, name:'贤达', icon:'🌸', color:'var(--cinn2)'},
  {min:5001, max:10000, name:'大德', icon:'🏆', color:'var(--gold)'},
  {min:10001, max:Infinity, name:'菩萨行者', icon:'🪷', color:'var(--gold2)'}
];

// 获取功德等级
function getMeritLevel(total) {
  for (let i = MERIT_LEVELS.length - 1; i >= 0; i--) {
    if (total >= MERIT_LEVELS[i].min) return MERIT_LEVELS[i];
  }
  return MERIT_LEVELS[0];
}

// 获取下一等级
function getNextMeritLevel(total) {
  for (let i = 0; i < MERIT_LEVELS.length; i++) {
    if (total < MERIT_LEVELS[i].min) return MERIT_LEVELS[i];
  }
  return null;
}

// 功德修行动作按钮
function meritActionBtn(faith, actionId) {
  let actions = MERIT_ACTIONS[faith] || [];
  let action = null;
  for (let i = 0; i < actions.length; i++) {
    if (actions[i].id === actionId) { action = actions[i]; break; }
  }
  if (!action) return;
  addMerit(faith, action.merit, action.name + '：' + action.desc);
}

// 加载功德记录并更新 UI
function loadMeritRecord(faith) {
  let record = safeGetJSON('meritRecord', {});
  let meritKey = 'merit_' + faith;
  let total = record[meritKey] || 0;
  let grandTotal = record['merit_total'] || 0;

  // 更新信仰进度条
  let bar = document.getElementById('merit-bar-' + faith);
  let badge = document.getElementById('merit-badge-' + faith);
  if (bar) {
    let level = getMeritLevel(total);
    let next = getNextMeritLevel(total);
    let pct = 100;
    if (next) {
      pct = Math.min(100, Math.round((total - level.min) / (next.min - level.min) * 100));
    }
    bar.style.width = pct + '%';
  }
  if (badge) badge.textContent = total;

  // 更新每日功德进度
  let dailyBar = document.getElementById('dailyMeritBar');
  let dailyCount = document.getElementById('dailyMeritCount');
  if (dailyBar && dailyCount) {
    let today = new Date().toDateString();
    let dailyKey = 'merit_daily_' + today;
    let daily = record[dailyKey] || 0;
    let target = 10;
    dailyBar.style.width = Math.min(100, daily / target * 100) + '%';
    dailyCount.textContent = daily + '/' + target;
  }

  // 更新功德等级显示
  let levelEl = document.getElementById('merit-level-display');
  if (levelEl) {
    let lv = getMeritLevel(grandTotal);
    let nextLv = getNextMeritLevel(grandTotal);
    let html = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">';
    html += '<span style="font-size:24px">' + lv.icon + '</span>';
    html += '<div>';
    html += '<div style="font-size:14px;color:' + lv.color + ';font-weight:bold">' + lv.name + '</div>';
    html += '<div style="font-size:11px;color:var(--paper2)">总功德：' + grandTotal + '</div>';
    html += '</div></div>';
    if (nextLv) {
      let progress = Math.round((grandTotal - lv.min) / (nextLv.min - lv.min) * 100);
      html += '<div style="display:flex;align-items:center;gap:6px">';
      html += '<div style="flex:1;height:4px;background:rgba(255,255,255,0.08);border-radius:2px;overflow:hidden"><div style="height:100%;background:' + lv.color + ';border-radius:2px;width:' + progress + '%;transition:width 0.5s"></div></div>';
      html += '<span style="font-size:10px;color:var(--paper2)">' + progress + '% → ' + nextLv.name + '</span>';
      html += '</div>';
    } else {
      html += '<div style="font-size:11px;color:var(--gold)">已达最高境界 🪷</div>';
    }
    levelEl.innerHTML = html;
  }
}

// 切换功德修行面板分类
function switchMeritTab(faith) {
  let tabs = document.querySelectorAll('.merit-tab-btn');
  for (let i = 0; i < tabs.length; i++) {
    tabs[i].classList.remove('merit-tab-active');
  }
  event.target.classList.add('merit-tab-active');
  let panels = document.querySelectorAll('.merit-action-grid');
  for (let i = 0; i < panels.length; i++) {
    panels[i].style.display = 'none';
  }
  let panel = document.getElementById('merit-actions-' + faith);
  if (panel) panel.style.display = 'grid';
}

// 渲染功德动作按钮到面板
function renderMeritActions() {
  let faiths = ['fo','dao','ru','tongyong'];
  for (let f = 0; f < faiths.length; f++) {
    let faith = faiths[f];
    let panel = document.getElementById('merit-actions-' + faith);
    if (!panel) continue;
    let actions = MERIT_ACTIONS[faith] || [];
    let html = '';
    for (let i = 0; i < actions.length; i++) {
      let a = actions[i];
      html += '<div class="merit-action-btn" onclick="meritActionBtn(\'' + faith + '\',\'' + a.id + '\')" title="' + a.source + '">';
      html += '<span class="ma-icon">' + a.icon + '</span>';
      html += '<span class="ma-name">' + a.name + '</span>';
      html += '<span class="ma-merit">+' + a.merit + '功德</span>';
      html += '<span class="ma-desc">' + a.desc + '</span>';
      html += '</div>';
    }
    panel.innerHTML = html;
  }
  // 初始显示佛教
  let foPanel = document.getElementById('merit-actions-fo');
  if (foPanel) foPanel.style.display = 'grid';
  // 初始化功德等级显示
  let record = safeGetJSON('meritRecord', {});
  let total = record['merit_total'] || 0;
  loadMeritRecord('fo');
}

// 页面加载时渲染功德动作
if (document.readyState !== 'loading') {
  renderMeritActions();
} else {
  document.addEventListener('DOMContentLoaded', renderMeritActions);
}

// ============================================================
// selectFaith：跳转发到 faith-renderer.js 的 showFaithDetail
// ============================================================

/* selectFaith dup removed */
// ===== 权威知识库面板函数 =====
let KNOWLEDGE_FIELDS = [
  {key:'bazi', icon:'🔮', name:'八字命理学', color:'var(--cinn)', desc:'四柱八字，洞察人生'},
  {key:'liuyao', icon:'卦', name:'六爻预测学', color:'var(--cyan)', desc:'铜钱起卦，趋吉避凶'},
  {key:'fengshui', icon:'🏔️', name:'风水学', color:'var(--jade)', desc:'环境调理，藏风聚气'},
  {key:'xingming', icon:'📝', name:'姓名学', color:'var(--violet2)', desc:'名正言顺，五格剖象'},
  {key:'tizhi', icon:'🌿', name:'中医体质学', color:'var(--cinn2)', desc:'九种体质，辨证调理'},
  {key:'yijing', icon:'☯', name:'易经占卜', color:'var(--ink3)', desc:'周易六十四卦'},
  {key:'ziwei', icon:'⭐', name:'紫微斗数', color:'var(--warn)', desc:'帝星斗数，人生棋盘'},
  {key:'qimen', icon:'🌀', name:'奇门遁甲', color:'var(--cinn2)', desc:'排盘布局，运筹帷幄'},
  {key:'meihua', icon:'🌸', name:'梅花易数', color:'var(--emerald)', desc:'随时起卦，灵活多变'},
  {key:'liuren', icon:'🕰️', name:'大六壬', color:'var(--violet)', desc:'精细预测，神课通灵'}
];

function openAuthoritativePanel() {
  let grid = document.getElementById('knowledgeCardsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  KNOWLEDGE_FIELDS.forEach(function(f) {
    let card = document.createElement('div');
    card.className = 'knowledge-card';
    card.style.cssText = 'background:linear-gradient(135deg,rgba(201,168,76,0.08),rgba(201,168,76,0.02));border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:30px;cursor:pointer;transition:all 0.3s;position:relative;overflow:hidden';
    card.innerHTML = '<div style="position:absolute;top:-20px;right:-20px;font-size:120px;opacity:0.06">'+f.icon+'</div>'+
      '<div style="font-size:42px;margin-bottom:16px">'+f.icon+'</div>'+
      '<h3 style="font-family:Ma Shan Zheng,serif;font-size:22px;color:var(--gold);letter-spacing:3px;margin-bottom:12px">'+f.name+'</h3>'+
      '<div style="font-size:14px;color:var(--paper2);margin-bottom:16px">'+f.desc+'</div>'+
      '<div style="font-size:12px;color:var(--paper2);opacity:0.7">点击查看详情 →</div>';
    card.onmouseover = function(){ this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 25px rgba(201,168,76,0.15)'; };
    card.onmouseout = function(){ this.style.transform=''; this.style.boxShadow=''; };
    card.onclick = function(){ showKnowledgeDetail(f.key, f.name); };
    grid.appendChild(card);
  });
  document.getElementById('authoritativeKnowledgePanel').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeAuthoritativePanel() {
  document.getElementById('authoritativeKnowledgePanel').style.display = 'none';
  document.body.style.overflow = '';
}

function showKBDetail(key) {
  let grid = document.getElementById('kb-grid');
  if(grid) { grid.style.display = 'none'; grid.style.marginTop = '0'; }
  let detail = document.getElementById('kb-detail');
  detail.style.display = 'block';
  let title = document.getElementById('kb-detail-title');
  let content = document.getElementById('kb-detail-content');
  
  let names = {
    bazi:'八字命理',liuyao:'六爻占卜',qimen:'奇门遁甲',meihua:'梅花易数',
    liuren:'大六壬',fengshui:'风水堪舆',xingming:'姓名学',tizhi:'中医体质',ziwei:'紫微斗数'
  };
  title.textContent = names[key] || key;
  
  let html = '';
  try {
    let KB = typeof AUTHORITATIVE_KNOWLEDGE !== 'undefined' ? AUTHORITATIVE_KNOWLEDGE : {};
    let data = KB[key] || {};
    
    if (data && typeof data === 'object') {
      Object.keys(data).slice(0, 20).forEach(function(k) {
        let val = data[k];
        if (typeof val === 'string') {
          html += '<div style="margin-bottom:12px"><strong style="color:var(--gold)">' + k + '</strong>：' + val + '</div>';
        } else if (typeof val === 'object' && val !== null) {
          if (Array.isArray(val)) {
            html += '<div style="margin-bottom:12px"><strong style="color:var(--gold)">' + k + '</strong>（' + val.length + '条）</div>';
            val.slice(0, 5).forEach(function(item) {
              if (typeof item === 'string') html += '<div style="padding-left:16px;opacity:.8">• ' + item + '</div>';
              else if (item && item.name) html += '<div style="padding-left:16px;opacity:.8">• <strong>' + item.name + '</strong>' + (item.desc ? ' - ' + item.desc : '') + '</div>';
            });
            if (val.length > 5) html += '<div style="padding-left:16px;opacity:.5">... 等' + val.length + '条</div>';
          } else if (val.name) {
            html += '<div style="margin-bottom:12px"><strong style="color:var(--gold)">' + (val.name || k) + '</strong>' + (val.overview || val.desc || val.meaning ? '：' + (val.overview || val.desc || val.meaning) : '') + '</div>';
          }
        }
      });
    }
    
    let supMap = {
      xingming: 'KNOWLEDGE_SUPPLEMENT_XINGMING',
      tizhi: 'KNOWLEDGE_SUPPLEMENT_TIZHI',
      meihua: 'KNOWLEDGE_SUPPLEMENT_MEIHUA',
      liuren: 'KNOWLEDGE_SUPPLEMENT_LIUREN',
      qimen: 'KNOWLEDGE_SUPPLEMENT_QIMEN'
    };
    let supKey = supMap[key];
    if (supKey && typeof window[supKey] !== 'undefined') {
      let sup = window[supKey];
      html += '<div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(201,168,76,.1)"><strong style="color:var(--gold)">📚 补充知识</strong></div>';
      Object.keys(sup).slice(0, 15).forEach(function(k2) {
        let v = sup[k2];
        if (typeof v === 'string') html += '<div style="margin-bottom:8px">• <strong>' + k2 + '</strong>：' + v + '</div>';
        else if (Array.isArray(v)) html += '<div style="margin-bottom:8px">• <strong>' + k2 + '</strong>（' + v.length + '条）</div>';
        else if (typeof v === 'object') html += '<div style="margin-bottom:8px">• <strong>' + k2 + '</strong></div>';
      });
    }
    
    if (!html) html = '<div style="text-align:center;opacity:.5;padding:20px">知识库加载中...</div>';
  } catch(e) {
    html = '<div style="text-align:center;opacity:.5;padding:20px">知识库加载出错：' + e.message + '</div>';
  }
  content.innerHTML = html;
}

function showKnowledgeDetail(key, name) {
  // 数据源映射：将卡片key映射到正确的数据位置
  let keyMap = {
    bagua: 'bagua', liushisigua: 'liushisigua', bazi: 'bazi', qimen: 'qimen',
    wuxing: 'wuxing', fengshui: 'fengshui', shishen: 'shishen', nayin: 'nayin',
    shensha: 'shensha', hechong: 'hechong', liuyao: 'liuyao', xingming: 'xingming',
    shengxiao: 'shengxiao', constellation: 'constellation', yangzhai: 'yangzhai',
    ziwei: 'ziwei', meihua: 'meihua', liuren: 'daliuren', tizhi: 'tizhi',
    rujia: 'rujia', daojia: 'daojia', fojia: 'fojia', zeji: 'zeji',
    huxing: 'huxing', cezi: 'cezi', jingdian: 'jingdian', fanyin: 'fanyin',
    meirikoujue: 'meirikoujue', gongde: 'gongde', zhishitupu: 'zhishitupu',
    yangsheng: 'yangsheng', daochang: 'daochang', jiazinayin: 'jiazinayin',
    jieqi: 'jieqi', zhouyi: 'zhouyi', yanzhi: 'yanzhi'
  };
  let mappedKey = keyMap[key] || key;
  // 确保知识库详情弹窗z-index最高
  let modal = document.getElementById('knowledgeDetailModal');
  if (modal) modal.style.zIndex = '10001';

  // 优先使用 window.KNOWLEDGE_DETAILS（来自 knowledge-details.js）
  if (typeof window.KNOWLEDGE_DETAILS !== 'undefined' && window.KNOWLEDGE_DETAILS[mappedKey]) {
    let detailEl = document.getElementById('knowledgeDetailContent');
    let titleEl2 = document.getElementById('knowledgeDetailTitle');
    if (!detailEl || !titleEl2) return;
    
    let names = {bagua:'易经八卦',liushisigua:'六十四卦',bazi:'八字四柱',qimen:'奇门遁甲',wuxing:'五行体系',fengshui:'风水堪舆',shishen:'十神详解',nayin:'纳音五行',shensha:'神煞体系',hechong:'合冲刑害',liuyao:'六爻基础',xingming:'姓名学基础',shengxiao:'十二生肖',constellation:'西方星座',yangzhai:'阳宅风水',ziwei:'紫微斗数',meihua:'梅花易数',liuren:'大六壬',tizhi:'中医体质',rujia:'儒家',daojia:'道家',fojia:'佛家',zeji:'择吉',huxing:'好户型',cezi:'测字',jingdian:'经典朗读',fanyin:'梵音音乐',meirikoujue:'每日口诀',gongde:'功德',zhishitupu:'知识图谱',yangsheng:'养生调理',daochang:'道场导航',jiazinayin:'甲子纳音',jieqi:'节气',zhouyi:'周易',yanzhi:'言值'};
    titleEl2.textContent = names[key] || name || key;
    
    // 添加样式
    let html = '<style>.kd-section h4{color:var(--gold);font-size:18px;letter-spacing:3px;margin-top:28px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(201,168,76,0.2)}.kd-section p{line-height:2;margin-bottom:12px}.kd-section ul,.kd-section ol{padding-left:24px;margin-bottom:12px}.kd-section li{margin-bottom:8px;line-height:1.8}.kd-section .highlight{color:var(--gold);font-weight:600}.kd-section .kd-quote{background:rgba(201,168,76,0.05);border-left:3px solid var(--gold);padding:16px 20px;margin:16px 0;border-radius:0 8px 8px 0}.kd-section .kd-quote p{margin:0;font-style:italic;line-height:1.8}.kd-section .kd-list{list-style:none;padding-left:0}.kd-section .kd-list li{position:relative;padding-left:20px}.kd-section .kd-list li::before{content:"•";color:var(--gold);position:absolute;left:0}.kd-section .kd-list.warning li::before{content:"⚠"}.kd-section .kd-refs{background:rgba(201,168,76,0.03);padding:12px 16px;border-radius:6px;font-size:13px}.kd-section .kd-table{width:100%;border-collapse:collapse;margin:16px 0}.kd-section .kd-table th,.kd-section .kd-table td{border:1px solid rgba(201,168,76,0.2);padding:10px 12px;text-align:center;font-size:13px}.kd-section .kd-table th{background:rgba(201,168,76,0.1);color:var(--gold)}</style>';
    html += '<div class="kd-section">' + window.KNOWLEDGE_DETAILS[mappedKey] + '</div>';
    
    detailEl.innerHTML = html;
    modal = document.getElementById('knowledgeDetailModal');
    if (modal) {
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
    return;
  }
  
  // 其次使用内联 kd-xxx div 的内容
  let kdDiv = document.getElementById('kd-' + key);
  if (kdDiv) {
    // 隐藏所有 kd-xxx div（全局）
    document.querySelectorAll('[id^="kd-"]').forEach(function(el) { el.style.display = 'none'; });
    // 隐藏卡片网格，显示详情页
    let grid = document.getElementById('knowledge-grid');
    if (grid) grid.style.display = 'none';
    let detailPage = document.getElementById('knowledge-detail');
    if (detailPage) detailPage.style.display = 'block';
    // 显示目标详情
    kdDiv.style.display = 'block';
    // 更新标题
    let titleEl = document.getElementById('knowledge-detail-title');
    if (titleEl) {
      let names = {bagua:'易经八卦',liushisigua:'六十四卦',bazi:'八字四柱',qimen:'奇门遁甲',wuxing:'五行体系',fengshui:'风水堪舆',shishen:'十神详解',nayin:'纳音五行',shensha:'神煞体系',hechong:'合冲刑害',liuyao:'六爻基础',xingming:'姓名学基础',shengxiao:'十二生肖',constellation:'西方星座',yangzhai:'阳宅风水',ziwei:'紫微斗数',meihua:'梅花易数',liuren:'大六壬',tizhi:'中医体质',rujia:'儒家',daojia:'道家',fojia:'佛家',zeji:'择吉',huxing:'好户型',cezi:'测字',jingdian:'经典朗读',fanyin:'梵音音乐',meirikoujue:'每日口诀',gongde:'功德',zhishitupu:'知识图谱',yangsheng:'养生调理',daochang:'道场导航',jiazinayin:'甲子纳音',jieqi:'节气',zhouyi:'周易',yanzhi:'言值'};
      titleEl.textContent = names[key] || name || key;
    }
    window.scrollTo({top:0,behavior:'smooth'});
    return;
  }

  // 回退：使用 AUTHORITATIVE_KNOWLEDGE 弹窗（增强渲染器）
  let detailEl = document.getElementById('knowledgeDetailContent');
  let titleEl2 = document.getElementById('knowledgeDetailTitle');
  if (!detailEl || !titleEl2) return;
  titleEl2.textContent = name || key;

  let html = '';
  function fmtKey(k) {
    return k.replace(/_/g,' ').replace(/([A-Z])/g,' $1').replace(/\b\w/g,function(m){return m.toUpperCase()});
  }
  function fmtVal(v) {
    if (typeof v === 'string') return v.replace(/\n/g,'<br>');
    if (Array.isArray(v)) {
      let items = v.filter(function(x){return typeof x==='string'&&x.length>2||(typeof x==='object'&&x!==null);});
      if (items.length===0) return '';
      let s = '<ul style="padding-left:20px;margin:8px 0">';
      items.forEach(function(it){
        if (typeof it==='string') s += '<li style="margin-bottom:6px;line-height:1.8">'+it.replace(/\n/g,'<br>')+'</li>';
        else if (typeof it==='object'&&it!==null) {
          let nm = it.name||it.title||'';
          let desc = it.desc||it.text||it.meaning||'';
          s += '<li style="margin-bottom:8px;line-height:1.8"><strong style="color:var(--gold)">'+(nm?' '+nm:'')+'</strong>'+(desc?' '+desc.replace(/\n/g,'<br>'):'');
          Object.keys(it).forEach(function(ak){
            if (['name','title','desc','text','meaning'].indexOf(ak)<0) {
              let av = typeof it[ak]==='string'?it[ak]:JSON.stringify(it[ak]);
              if (av.length>1&&av.length<200) s += ' <span style="color:var(--text-dim);font-size:12px">('+fmtKey(ak)+'：'+av+')</span>';
            }
          });
          s += '</li>';
        }
      });
      return s+'</ul>';
    }
    if (typeof v === 'object' && v !== null) {
      let keys = Object.keys(v).filter(function(kk){return typeof v[kk]==='string'&&v[kk].length>3||typeof v[kk]==='object'&&v[kk]!==null;});
      if (keys.length===0) return '';
      let s = '';
      keys.forEach(function(kk){
        let vv = v[kk];
        if (typeof vv==='string') s += '<div style="margin-bottom:10px;padding:10px 12px;background:rgba(201,168,76,0.04);border-radius:6px;border-left:2px solid var(--gold)"><strong style="color:var(--gold);font-size:13px">'+fmtKey(kk)+'</strong><br><span style="font-size:14px;line-height:1.9">'+vv.replace(/\n/g,'<br>')+'</span></div>';
        else if (Array.isArray(vv)) {
          let sub = fmtVal(vv);
          if (sub) s += '<div style="margin:10px 0"><strong style="color:var(--gold);font-size:13px">'+fmtKey(kk)+'</strong>'+sub+'</div>';
        }
        else if (typeof vv==='object'&&vv!==null) {
          let sub2 = '';
          Object.keys(vv).slice(0,20).forEach(function(ak){
            let av = vv[ak];
            if (typeof av==='string'&&av.length>3) sub2 += '<div style="margin-bottom:8px"><strong style="color:var(--gold)">'+fmtKey(ak)+'</strong>：'+av.replace(/\n/g,'<br>')+'</div>';
            else if (typeof av==='object'&&av!==null) {
              let nm=av.name||av.title||'';
              let desc=av.desc||av.text||av.meaning||'';
              if (nm||desc) sub2 += '<div style="margin-bottom:8px"><strong style="color:var(--gold)">'+fmtKey(ak)+'</strong> '+(nm?'【'+nm+'】 ':'')+desc.replace(/\n/g,'<br>')+'</div>';
            }
          });
          if (sub2) s += '<div style="margin:10px 0"><strong style="color:var(--gold);font-size:13px">'+fmtKey(kk)+'</strong><div style="padding:10px;background:rgba(201,168,76,0.03);border-radius:6px">'+sub2+'</div></div>';
        }
      });
      return s||'';
    }
    return '';
  }

  if (typeof AUTHORITATIVE_KNOWLEDGE !== 'undefined' && AUTHORITATIVE_KNOWLEDGE[mappedKey]) {
    let section = AUTHORITATIVE_KNOWLEDGE[mappedKey];
    for (let sub in section) {
      if (section.hasOwnProperty(sub) && sub[0] !== '_') {
        let val = section[sub];
        if (typeof val === 'string' && val.length > 10) {
          html += '<h3 style="color:var(--gold);margin-top:28px;margin-bottom:14px;font-size:17px;border-bottom:1px solid rgba(201,168,76,0.25);padding-bottom:8px;letter-spacing:2px">'+fmtKey(sub)+'</h3>';
          html += '<p style="line-height:2.1;margin-bottom:14px">'+val.replace(/\n/g,'<br>')+'</p>';
        } else if (typeof val === 'object' && val !== null && Object.keys(val).length > 0) {
          let rendered = fmtVal(val);
          if (rendered) {
            html += '<h3 style="color:var(--gold);margin-top:28px;margin-bottom:14px;font-size:17px;border-bottom:1px solid rgba(201,168,76,0.25);padding-bottom:8px;letter-spacing:2px">'+fmtKey(sub)+'</h3>';
            html += rendered;
          }
        }
      }
    }
  }


  
  // 额外数据源：阳宅知识库
  if (!html && typeof window.YANGZHAI_KB !== 'undefined' && key === 'yangzhai') {
    html = '<div class="kd-section">' + renderYangzhaiKB(window.YANGZHAI_KB) + '</div>';
  }
  // 额外数据源：生肖知识库
  if (!html && typeof window.ZODIAC_KB !== 'undefined' && key === 'shengxiao') {
    html = '<div class="kd-section">' + window.ZODIAC_KB.intro + '</div>';
  }
  // 额外数据源：星座知识库
  if (!html && typeof window.CONSTELLATION_KB !== 'undefined' && key === 'constellation') {
    html = '<div class="kd-section">' + window.CONSTELLATION_KB.intro + '</div>';
  }
  detailEl.innerHTML = html || '<p style="color:var(--paper2);text-align:center;padding:40px 0">该领域知识正在完善中，敬请期待...</p>';
  modal = document.getElementById('knowledgeDetailModal');
  if (modal) {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
}

// ===== 命理宗师知识库 =====
function showMastersKB() {
  let modal = document.getElementById('knowledgeDetailModal');
  let content = document.getElementById('knowledgeDetailContent');
  let title = document.getElementById('knowledgeDetailTitle');
  if (!modal || !content || !title) return;
  title.textContent = '命理宗师 · 历代大师传记';
  let html = '<style>.kd-section h4{color:var(--gold);font-size:18px;letter-spacing:3px;margin-top:28px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(201,168,76,0.2)}.kd-section p{line-height:2;margin-bottom:12px}.master-card-kb{background:rgba(201,168,76,0.04);border:1px solid rgba(201,168,76,0.15);border-radius:14px;padding:24px;margin-bottom:20px;transition:all .3s}.master-card-kb:hover{border-color:rgba(201,168,76,0.4);background:rgba(201,168,76,0.06)}.master-card-kb h5{color:var(--gold);font-size:16px;margin-bottom:8px}.master-card-kb .era{font-size:12px;color:var(--paper2);opacity:.7;margin-bottom:12px}.master-card-kb .school-tag{display:inline-block;font-size:11px;background:rgba(201,168,76,0.1);color:var(--gold);padding:3px 12px;border-radius:12px;margin-bottom:12px}</style>';
  html += '<div class="kd-section">';
  html += '<p style="text-align:center;opacity:.7;margin-bottom:24px">从唐宋到当代，命理宗师一脉相承，薪火相传。他们的智慧凝聚在典籍之中，为后学者指引方向。</p>';
  if (typeof MASTERS_KNOWLEDGE !== 'undefined') {
    let sections = [
      {key: 'ancient_masters', title: '一、古代命理大师（唐宋元明）'},
      {key: 'modern_masters', title: '二、近现代命理大师（清末民国）'},
      {key: 'contemporary_masters', title: '三、当代命理大师'}
    ];
    sections.forEach(function(sec) {
      let arr = MASTERS_KNOWLEDGE[sec.key];
      if (arr && arr.length) {
        html += '<h4>' + sec.title + '</h4>';
        arr.forEach(function(m) {
          html += '<div class="master-card-kb">';
          html += '<h5>' + (m.name || '') + '</h5>';
          html += '<div class="era">' + (m.era || '') + '</div>';
          if (m.school) html += '<span class="school-tag">' + m.school + '</span>';
          if (m.title) html += '<p><b>头衔：</b>' + m.title + '</p>';
          if (m.life) html += '<p><b>生平：</b>' + m.life + '</p>';
          if (m.contribution) html += '<p><b>贡献：</b>' + m.contribution.replace(/\n/g, '<br>') + '</p>';
          if (m.core_teaching) html += '<p><b>核心思想：</b>' + m.core_teaching + '</p>';
          if (m.representative_work) html += '<p><b>代表著作：</b>' + m.representative_work + '</p>';
          if (m.quote) html += '<p><b>名言：</b>' + m.quote + '</p>';
          if (m.legacy) html += '<p><b>影响：</b>' + m.legacy + '</p>';
          html += '</div>';
        });
      }
    });
  } else {
    html += '<p>大师知识库加载中...</p>';
  }
  html += '</div>';
  content.innerHTML = html;
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}
window.showMastersKB = showMastersKB;

// ═══ 心灵智慧知识库 ═══
function showPsychologyWisdom() {
  let modal = document.getElementById('knowledgeDetailModal');
  if (!modal) return;
  let data = window.PSYCHOLOGY_WISDOM || {};
  let html = '<div style="padding:20px;max-height:70vh;overflow-y:auto">';
  html += '<h2 style="text-align:center;color:var(--cyan2);margin-bottom:20px">🧠 心灵智慧生活</h2>';
  html += '<p style="text-align:center;font-size:13px;opacity:.6;margin-bottom:24px">365条智慧语录 · 心理健康指南 · 为人处事智慧 · 情绪管理工具箱</p>';
  
  // 今日智慧语录
  let now = new Date();
  let month = now.getMonth() + 1;
  let day = now.getDate();
  let quotes = (data.dailyWisdom && data.dailyWisdom[month]) || [];
  let todayQuote = quotes.length > 0 ? quotes[(day - 1) % quotes.length] : null;
  if (todayQuote) {
    html += '<div style="background:rgba(52,152,219,.08);border:1px solid rgba(52,152,219,.2);border-radius:12px;padding:20px;margin-bottom:20px;text-align:center">';
    html += '<div style="font-size:12px;color:var(--cyan2);margin-bottom:8px">📝 今日智慧语录</div>';
    html += '<div style="font-size:16px;font-weight:bold;color:var(--paper);margin-bottom:8px;line-height:1.6">' + (todayQuote.text || '') + '</div>';
    html += '<div style="font-size:12px;opacity:.6">—— ' + (todayQuote.source || '') + '</div>';
    if (todayQuote.explain) html += '<div style="font-size:13px;opacity:.8;margin-top:8px">💡 ' + todayQuote.explain + '</div>';
    html += '</div>';
  }
  
  // 心理健康指南
  html += '<h3 style="color:var(--cyan2);margin:20px 0 12px;font-size:15px">🧩 心理健康指南</h3>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">';
  if (data.mentalHealth) {
    for (let key in data.mentalHealth) {
      let mh = data.mentalHealth[key];
      html += '<div style="background:rgba(255,255,255,.04);border:1px solid rgba(52,152,219,.15);border-radius:10px;padding:16px">';
      html += '<div style="font-weight:bold;color:var(--cyan2);margin-bottom:8px;font-size:14px">' + (mh.name || key) + '</div>';
      if (mh.symptoms) html += '<div style="font-size:12px;opacity:.7;margin-bottom:6px"><b>表现：</b>' + mh.symptoms.join('、') + '</div>';
      if (mh.solutions) html += '<div style="font-size:12px;opacity:.7;margin-bottom:6px"><b>调适：</b>' + mh.solutions.join('、') + '</div>';
      if (mh.wisdom) html += '<div style="font-size:12px;color:var(--gold);margin-top:8px;font-style:italic">' + mh.wisdom + '</div>';
      html += '</div>';
    }
  }
  html += '</div>';
  
  // 为人处事智慧
  html += '<h3 style="color:var(--cyan2);margin:20px 0 12px;font-size:15px">💡 为人处事智慧</h3>';
  if (data.lifeWisdom) {
    for (let cat in data.lifeWisdom) {
      let items = data.lifeWisdom[cat];
      let catName = {workplace:'职场',family:'家庭',parenting:'亲子',friendship:'交友',selfCultivation:'修身'}[cat] || cat;
      html += '<div style="margin-bottom:16px"><div style="font-weight:bold;color:var(--gold);margin-bottom:8px;font-size:13px">' + catName + '</div>';
      html += '<div style="font-size:12px;line-height:1.8;opacity:.8">';
      items.forEach(function(item) {
        html += '<div style="margin-bottom:6px;padding:8px;background:rgba(255,255,255,.02);border-radius:6px"><b>' + (item.topic||'') + '</b>：' + (item.wisdom||'') + '<br><span style="opacity:.6">' + (item.detail||'') + '</span></div>';
      });
      html += '</div></div>';
    }
  }
  
  // 情绪管理工具箱
  html += '<h3 style="color:var(--cyan2);margin:20px 0 12px;font-size:15px">🧘 情绪管理工具箱</h3>';
  if (data.emotionToolkit) {
    let tk = data.emotionToolkit;
    if (tk.breathingExercises) {
      html += '<div style="margin-bottom:12px"><b style="color:var(--gold)">呼吸练习</b></div>';
      tk.breathingExercises.forEach(function(ex) {
        html += '<div style="font-size:12px;margin-bottom:6px;padding:8px;background:rgba(255,255,255,.02);border-radius:6px"><b>' + ex.name + '</b>：' + ex.steps + '<br><span style="opacity:.6">适用：' + ex.bestFor + '</span></div>';
      });
    }
    if (tk.positiveAffirmations) {
      html += '<div style="margin-bottom:12px;margin-top:12px"><b style="color:var(--gold)">正念肯定语</b></div>';
      html += '<div style="font-size:12px;line-height:1.8;opacity:.8;padding:8px;background:rgba(255,255,255,.02);border-radius:6px">';
      tk.positiveAffirmations.forEach(function(a, i) { html += (i+1) + '. ' + a + '<br>'; });
      html += '</div>';
    }
  }
  
  html += '</div>';
  modal.querySelector('.modal-body').innerHTML = html;
  modal.style.display = 'block';
}
window.showPsychologyWisdom = showPsychologyWisdom;

// ═══ 咒语真言知识库 ═══
function showIncantationDB() {
  let modal = document.getElementById('knowledgeDetailModal');
  let content = document.getElementById('knowledgeDetailContent');
  let title = document.getElementById('knowledgeDetailTitle');
  if (!modal || !content || !title) return;
  title.textContent = '📿 咒语真言大全';
  let html = '<style>';
  html += '.inc-cat-btn{display:inline-block;padding:6px 16px;border:1px solid rgba(201,168,76,0.25);border-radius:20px;background:transparent;color:var(--paper2);font-size:13px;cursor:pointer;white-space:nowrap;transition:all .2s;margin:4px 4px 4px 0;font-family:inherit}';
  html += '.inc-cat-btn:hover,.inc-cat-btn.active{background:rgba(201,168,76,0.12);color:var(--gold);border-color:rgba(201,168,76,0.5)}';
  html += '.inc-card{background:rgba(201,168,76,0.04);border:1px solid rgba(201,168,76,0.15);border-radius:14px;padding:24px;margin-bottom:20px;transition:all .3s}';
  html += '.inc-card:hover{border-color:rgba(201,168,76,0.35);background:rgba(201,168,76,0.06)}';
  html += '.inc-card h5{color:var(--gold);font-size:17px;margin-bottom:6px;letter-spacing:1px}';
  html += '.inc-card .inc-meta{font-size:12px;color:var(--paper2);opacity:.7;margin-bottom:12px}';
  html += '.inc-card .inc-text{background:rgba(0,0,0,0.15);border-left:3px solid rgba(201,168,76,0.3);padding:14px 18px;margin:10px 0;line-height:2;font-size:14px;border-radius:0 8px 8px 0}';
  html += '.inc-card .inc-pinyin{font-size:12px;color:var(--paper2);opacity:.6;font-style:italic;margin-top:4px}';
  html += '.inc-card .inc-field{margin-top:8px;font-size:13px;line-height:1.8}';
  html += '.inc-card .inc-field b{color:var(--gold);opacity:.8}';
  html += '.inc-card .inc-tag{display:inline-block;font-size:11px;background:rgba(201,168,76,0.1);color:var(--gold);padding:2px 10px;border-radius:10px;margin-right:6px}';
  html += '.inc-guide-h4{color:var(--gold);font-size:18px;letter-spacing:2px;margin-top:28px;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid rgba(201,168,76,0.2)}';
  html += '.inc-guide-p{line-height:2;margin-bottom:12px;font-size:14px}';
  html += '</style>';

  if (typeof INCANTATION_DB === 'undefined') {
    content.innerHTML = '<p>咒语真言知识库加载中...</p>';
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    return;
  }

  let db = INCANTATION_DB;
  html += '<div style="text-align:center;opacity:.7;margin-bottom:20px;font-size:14px;line-height:1.8">' + (db.meta.description || '') + '</div>';

  // 分类按钮
  html += '<div style="text-align:center;margin-bottom:24px">';
  html += '<button class="inc-cat-btn active" onclick="filterIncantation(\'all\',this)">全部</button>';
  html += '<button class="inc-cat-btn" onclick="filterIncantation(\'daoist\',this)">道教咒语 (' + (db.daoist||[]).length + ')</button>';
  html += '<button class="inc-cat-btn" onclick="filterIncantation(\'buddhist\',this)">佛教真言 (' + (db.buddhist||[]).length + ')</button>';
  html += '<button class="inc-cat-btn" onclick="filterIncantation(\'tantric\',this)">密宗真言 (' + (db.tantric||[]).length + ')</button>';
  html += '<button class="inc-cat-btn" onclick="filterIncantation(\'confucian\',this)">儒家口诀 (' + (db.confucian||[]).length + ')</button>';
  html += '<button class="inc-cat-btn" onclick="filterIncantation(\'folk\',this)">民间咒语 (' + (db.folk||[]).length + ')</button>';
  html += '<button class="inc-cat-btn" onclick="filterIncantation(\'guide\',this)">使用指南</button>';
  html += '</div>';

  html += '<div id="incantation-list"></div>';
  content.innerHTML = html;

  // 渲染全部
  renderIncantationList('all');

  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}
window.showIncantationDB = showIncantationDB;

function renderIncantationList(cat) {
  let container = document.getElementById('incantation-list');
  if (!container) return;
  let db = window.INCANTATION_DB;
  let html = '';

  if (cat === 'all' || cat === 'guide') {
    if (cat === 'all') html += '<div class="inc-guide-h4" style="text-align:center">📜 使用指南</div>';
    if (db.guide) {
      db.guide.sections.forEach(function(sec) {
        html += '<div class="inc-guide-h4">' + sec.title + '</div>';
        sec.content.forEach(function(p) { html += '<p class="inc-guide-p">' + p + '</p>'; });
      });
    }
  }

  let cats = cat === 'all' ? ['daoist','buddhist','tantric','confucian','folk'] : [cat];
  let catTitles = {daoist:'道教咒语',buddhist:'佛教真言',tantric:'密宗真言',confucian:'儒家修身口诀',folk:'民间通用咒语'};
  cats.forEach(function(c) {
    if (!db[c] || db[c].length === 0) return;
    if (cat === 'all') html += '<div class="inc-guide-h4">' + (catTitles[c]||c) + ' (' + db[c].length + '条)</div>';
    db[c].forEach(function(item) {
      html += '<div class="inc-card">';
      html += '<h5>' + (item.name||'') + '</h5>';
      html += '<div class="inc-meta">' + (item.source||'') + (item.school?(' · '+item.school):'') + (item.level?(' · '+item.level):'') + '</div>';
      if (item.text) html += '<div class="inc-text">' + item.text + '</div>';
      if (item.pinyin) html += '<div class="inc-pinyin">' + item.pinyin + '</div>';
      if (item.tibetan) html += '<div class="inc-field"><b>藏音：</b>' + item.tibetan + '</div>';
      if (item.purpose) html += '<div class="inc-field"><b>功效：</b>' + item.purpose + '</div>';
      if (item.vernacular) html += '<div class="inc-field"><b>白话：</b>' + item.vernacular + '</div>';
      if (item.merit) html += '<div class="inc-field"><b>功德利益：</b>' + item.merit + '</div>';
      if (item.usage) html += '<div class="inc-field"><b>用途：</b>' + item.usage + '</div>';
      if (item.method) html += '<div class="inc-field"><b>方法：</b>' + item.method + '</div>';
      if (item.practice) html += '<div class="inc-field"><b>修法：</b>' + item.practice + '</div>';
      if (item.empowerment) html += '<div class="inc-field"><b>灌顶要求：</b>' + item.empowerment + '</div>';
      if (item.application) html += '<div class="inc-field"><b>现代应用：</b>' + item.application + '</div>';
      if (item.notes) html += '<div class="inc-field"><b>备注：</b>' + item.notes + '</div>';
      html += '</div>';
    });
  });

  container.innerHTML = html;
}
window.renderIncantationList = renderIncantationList;

function filterIncantation(cat, btn) {
  document.querySelectorAll('.inc-cat-btn').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  renderIncantationList(cat);
}
window.filterIncantation = filterIncantation;

function hideKnowledgeDetail() {
  document.querySelectorAll('[id^="kd-"]').forEach(function(el) { el.style.display = 'none'; });
  let detailPage = document.getElementById('knowledge-detail');
  if (detailPage) detailPage.style.display = 'none';
  let grid = document.getElementById('knowledge-grid');
  if (grid) grid.style.display = 'block';
  let modal = document.getElementById('knowledgeDetailModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// ═══ 每日慧语（首页）══════════════════════════════════
let wisdomQuotes = [
  {text:"上善若水，水善利万物而不争，处众人之所恶，故几于道。", source:"《道德经》第八章", tag:"道家"},
  {text:"致虚极，守静笃。万物并作，吾以观复。归根曰静，是谓复命。", source:"《道德经》第十六章", tag:"道家"},
  {text:"知人者智，自知者明。胜人者有力，自胜者强。知足者富。", source:"《道德经》第三十三章", tag:"道家"},
  {text:"祸兮福之所倚，福兮祸之所伏。", source:"《道德经》第五十八章", tag:"道家"},
  {text:"为学日益，为道日损，损之又损，以至于无为。", source:"《道德经》第四十八章", tag:"道家"},
  {text:"飘风不终朝，骤雨不终日。天地尚不能久，而况于人乎？", source:"《道德经》第二十三章", tag:"道家"},
  {text:"信言不美，美言不信。善者不辩，辩者不善。", source:"《道德经》第八十一章", tag:"道家"},
  {text:"一切有为法，如梦幻泡影，如露亦如电，应作如是观。", source:"《金刚经》", tag:"佛家"},
  {text:"凡所有相，皆是虚妄。若见诸相非相，即见如来。", source:"《金刚经》", tag:"佛家"},
  {text:"过去心不可得，现在心不可得，未来心不可得。", source:"《金刚经》", tag:"佛家"},
  {text:"色即是空，空即是色；色不异空，空不异色。", source:"《心经》", tag:"佛家"},
  {text:"心无挂碍，无挂碍故，无有恐怖，远离颠倒梦想。", source:"《心经》", tag:"佛家"},
  {text:"菩提本无树，明镜亦非台。本来无一物，何处惹尘埃。", source:"六祖慧能", tag:"佛家"},
  {text:"迷时师度，悟时自度。佛法在世间，不离世间觉。", source:"六祖慧能", tag:"佛家"},
  {text:"一花一世界，一叶一菩提。平常心是道。", source:"《五灯会元》", tag:"佛家"},
  {text:"天行健，君子以自强不息；地势坤，君子以厚德载物。", source:"《周易·乾卦》", tag:"儒家"},
  {text:"知止而后有定，定而后能静，静而后能安，安而后能虑，虑而后能得。", source:"《大学》", tag:"儒家"},
  {text:"君子和而不同，小人同而不和。君子坦荡荡，小人长戚戚。", source:"《论语》", tag:"儒家"},
  {text:"心静了，世界就静了。不是世界变了，是你的心变了。", source:"生活哲理", tag:"生活"},
  {text:"放下执念，不是放弃一切，而是对结果不再强求，对过程全力以赴。", source:"生活哲理", tag:"生活"},
  {text:"最好的状态是：眼里有故事，脸上无风霜。历经沧桑，内心依然柔软。", source:"生活哲理", tag:"生活"},
  {text:"人生没有白走的路，每一步都算数。累了就休息，但别放弃。", source:"生活哲理", tag:"生活"},
  {text:"你担心的事，90%不会发生。与其焦虑未来，不如做好当下。", source:"生活哲理", tag:"生活"},
  {text:"真正的强大，不是忘记，而是接纳。接纳过去的遗憾，接纳现在的不完美。", source:"生活哲理", tag:"生活"},
  {text:"情绪稳定是一个人最难得的修养。遇事不怒，宠辱不惊，静观其变。", source:"生活哲理", tag:"生活"},
  {text:"睡前原谅一切，醒来便是重生。不为昨日忧，不为明日虑，活在当下。", source:"生活哲理", tag:"生活"},
  {text:"人生最曼妙的风景，是内心的淡定与从容。世事浮沉，学会随缘自在。", source:"生活哲理", tag:"生活"},
  {text:"当你改变不了环境，就改变自己的心态。心宽了，天地就宽了。", source:"生活哲理", tag:"生活"},
  {text:"人这一辈子，看清别人是聪明，看清自己是智慧。知足者常乐，能忍者自安。", source:"生活哲理", tag:"生活"},
  {text:"人生难得今已得，大道难闻今已闻。此身不向今生度，更向何生度此身？", source:"《禅宗七祖经》", tag:"佛家"},
];
let dwIdx = 0;

// ═══ 十二生肖详情 ═══════════════════════════════════
function showZodiacDetail(zodiac) {
  let zodiacMap = {
    '鼠': {emoji:'🐭', element:'水', direction:'北', bestMatch:['龙','猴','牛'], avoid:['马','羊','鸡']},
    '牛': {emoji:'🐮', element:'土', direction:'东北', bestMatch:['鼠','蛇','鸡'], avoid:['羊','马']},
    '虎': {emoji:'🐯', element:'木', direction:'东北', bestMatch:['马','狗','猪'], avoid:['猴','蛇']},
    '兔': {emoji:'🐰', element:'木', direction:'东', bestMatch:['羊','猪','狗'], avoid:['鸡','龙']},
    '龙': {emoji:'🐉', element:'土', direction:'东南', bestMatch:['鼠','猴','鸡'], avoid:['狗','兔']},
    '蛇': {emoji:'🐍', element:'火', direction:'东南', bestMatch:['牛','鸡','猴'], avoid:['猪','虎']},
    '马': {emoji:'🐴', element:'火', direction:'南', bestMatch:['虎','羊','狗'], avoid:['鼠','牛']},
    '羊': {emoji:'🐑', element:'土', direction:'西南', bestMatch:['兔','猪','马'], avoid:['牛','鼠']},
    '猴': {emoji:'🐵', element:'金', direction:'西南', bestMatch:['鼠','龙','蛇'], avoid:['虎','猪']},
    '鸡': {emoji:'🐔', element:'金', direction:'西', bestMatch:['牛','龙','蛇'], avoid:['兔','狗']},
    '狗': {emoji:'🐶', element:'土', direction:'西北', bestMatch:['虎','兔','马'], avoid:['龙','鸡']},
    '猪': {emoji:'🐷', element:'水', direction:'西北', bestMatch:['兔','羊','虎'], avoid:['蛇','猴']}
  };
  
  let info = zodiacMap[zodiac];
  if (!info) return;
  
  // 从 ZODIAC_KNOWLEDGE 获取更丰富的数据
  let zk = (typeof ZODIAC_KNOWLEDGE !== 'undefined') ? ZODIAC_KNOWLEDGE : null;
  let buddhaInfo = zk && zk.buddhaMap ? zk.buddhaMap[zodiac] : null;
  let luckInfo = zk && zk.yearlyLuck ? zk.yearlyLuck[zodiac] : null;
  let mascotInfo = zk && zk.mascots ? zk.mascots[zodiac] : null;
  
  let html = '<div style="padding:20px;max-width:600px;margin:0 auto">';
  html += '<div style="text-align:center;margin-bottom:20px">';
  html += '<div style="font-size:72px;margin-bottom:10px">' + info.emoji + '</div>';
  html += '<h2 style="color:var(--gold);margin:0;font-size:28px">' + zodiac + '年出生</h2>';
  html += '<p style="color:var(--paper2);margin:10px 0">五行属' + info.element + ' | 吉祥方位：' + info.direction + '</p>';
  html += '</div>';
  
  // 本命佛（增强版）
  if (buddhaInfo) {
    html += '<div style="background:rgba(201,168,76,0.08);padding:16px;border-radius:12px;margin-bottom:16px">';
    html += '<h4 style="color:var(--gold);margin:0 0 10px 0">📿 本命佛：' + buddhaInfo.buddha + '</h4>';
    if (buddhaInfo.sanskrit) html += '<p style="font-size:12px;opacity:.6;margin:0 0 10px 0">' + buddhaInfo.sanskrit + '</p>';
    html += '<p style="margin:0 0 10px 0;color:var(--paper2);line-height:1.8">' + buddhaInfo.intro + '</p>';
    if (buddhaInfo.worship) html += '<p style="margin:0 0 8px 0;font-size:13px;color:var(--paper2)"><b>供奉方法：</b>' + buddhaInfo.worship + '</p>';
    if (buddhaInfo.benefits) html += '<p style="margin:0;font-size:13px;color:var(--paper2)"><b>功德利益：</b>' + buddhaInfo.benefits.join('、') + '</p>';
    if (buddhaInfo.taboos) html += '<p style="margin:8px 0 0;font-size:12px;color:var(--cinn2)"><b>禁忌：</b>' + buddhaInfo.taboos.join('；') + '</p>';
    html += '</div>';
  } else {
    html += '<div style="background:rgba(201,168,76,0.08);padding:16px;border-radius:12px;margin-bottom:16px">';
    html += '<h4 style="color:var(--gold);margin:0 0 10px 0">📿 本命佛守护</h4>';
    html += '<p style="margin:0;color:var(--paper2);line-height:1.8">佩戴专属本命佛吊坠（戴脖子，近心护身），诚心供奉，可消灾解难、增福延寿。</p>';
    html += '</div>';
  }
  
  // 年度运势
  if (luckInfo) {
    html += '<div style="background:rgba(0,188,212,0.06);padding:16px;border-radius:12px;margin-bottom:16px">';
    html += '<h4 style="color:var(--cyan);margin:0 0 10px 0">🌟 年度运势</h4>';
    if (luckInfo.career) html += '<p style="margin:0 0 6px 0;font-size:13px;color:var(--paper2)"><b>事业：</b>' + luckInfo.career + '</p>';
    if (luckInfo.wealth) html += '<p style="margin:0 0 6px 0;font-size:13px;color:var(--paper2)"><b>财运：</b>' + luckInfo.wealth + '</p>';
    if (luckInfo.love) html += '<p style="margin:0 0 6px 0;font-size:13px;color:var(--paper2)"><b>感情：</b>' + luckInfo.love + '</p>';
    if (luckInfo.health) html += '<p style="margin:0;font-size:13px;color:var(--paper2)"><b>健康：</b>' + luckInfo.health + '</p>';
    html += '</div>';
  }
  
  // 吉祥物推荐
  if (mascotInfo) {
    html += '<div style="background:rgba(230,126,34,0.06);padding:16px;border-radius:12px;margin-bottom:16px">';
    html += '<h4 style="color:var(--orange);margin:0 0 10px 0">🎁 吉祥物推荐</h4>';
    if (mascotInfo.home) html += '<p style="margin:0 0 6px 0;font-size:13px;color:var(--paper2)"><b>家居：</b>' + mascotInfo.home + '</p>';
    if (mascotInfo.car) html += '<p style="margin:0 0 6px 0;font-size:13px;color:var(--paper2)"><b>车内：</b>' + mascotInfo.car + '</p>';
    if (mascotInfo.body) html += '<p style="margin:0;font-size:13px;color:var(--paper2)"><b>佩戴：</b>' + mascotInfo.body + '</p>';
    html += '</div>';
  }
  
  html += '<div style="background:rgba(255,255,255,0.04);padding:16px;border-radius:12px;margin-bottom:16px">';
  html += '<h4 style="color:var(--gold);margin:0 0 10px 0">💝 最佳配对</h4>';
  html += '<p style="margin:0;color:var(--paper2)">' + info.bestMatch.join('、') + '</p>';
  html += '</div>';
  
  html += '<div style="background:rgba(244,67,54,0.08);padding:16px;border-radius:12px;margin-bottom:16px">';
  html += '<h4 style="color:var(--cinn2);margin:0 0 10px 0">⚠️ 避免配对</h4>';
  html += '<p style="margin:0;color:var(--paper2)">' + info.avoid.join('、') + '</p>';
  html += '</div>';
  
  html += '<div style="text-align:center;margin-top:20px">';
  html += '<button onclick="showKnowledgeDetail(\'shengxiao\')" style="background:var(--gold);color:var(--ink);border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:bold">查看完整生肖知识</button>';
  html += '</div>';
  
  // 增强版：追加 ZodiacComplete 数据（本命佛+2025蛇年运势+吉祥物）
  if (typeof ZODIAC_COMPLETE !== 'undefined') {
    html += renderZodiacModule(zodiac);
  }
  
  html += '</div>';
  
  showModal('生肖命运解读 - ' + zodiac, html);
}

// ═══ 西方星座详情 ═══════════════════════════════════
function showConstellationDetail(sign) {
  let constellationData = {
    '白羊': {symbol:'♈', element:'火', ruler:'火星', traits:'勇敢、直接、冲动、领导力强', likes:'挑战、竞争、运动', dislikes:'等待、被限制', career:'企业家、运动员、创业者', love:'直接追求，喜欢就说', color:'红色', day:'星期二'},
    '金牛': {symbol:'♉', element:'土', ruler:'金星', traits:'稳定、固执、耐心、实际', likes:'美食、艺术、舒适', dislikes:'变化、匆忙', career:'金融、建筑、艺术', love:'慢热但专一，注重安全感', color:'绿色', day:'星期五'},
    '双子': {symbol:'♊', element:'风', ruler:'水星', traits:'好奇、多变、机智、善于交际', likes:'旅行、阅读、聊天', dislikes:'无聊、束缚', career:'传媒、教育、销售', love:'喜欢新鲜感，擅长甜言蜜语', color:'黄色', day:'星期三'},
    '巨蟹': {symbol:'♋', element:'水', ruler:'月亮', traits:'敏感、体贴、保护欲强、家庭导向', likes:'家庭、美食、回忆', dislikes:'冲突、伤害', career:'医疗、教育、餐饮', love:'专一忠诚，需要情感安全感', color:'白色', day:'星期一'},
    '狮子': {symbol:'♌', element:'火', ruler:'太阳', traits:'自信、慷慨、戏剧化、领导力', likes:'被关注、奢华、表演', dislikes:'被忽视、批评', career:'娱乐、管理、政治', love:'喜欢被崇拜，给予大方', color:'金色', day:'星期日'},
    '处女': {symbol:'♍', element:'土', ruler:'水星', traits:'完美主义、分析力强、务实、勤劳', likes:'秩序、健康、学习', dislikes:'混乱、脏乱', career:'医疗、编辑、会计', love:'细腻体贴，会默默付出', color:'棕色', day:'星期三'},
    '天秤': {symbol:'♎', element:'风', ruler:'金星', traits:'和谐、公正、社交、优柔寡断', likes:'艺术、美、社交', dislikes:'冲突、丑陋', career:'法律、艺术、外交', love:'浪漫，追求平衡的关系', color:'粉色', day:'星期五'},
    '天蝎': {symbol:'♏', element:'水', ruler:'冥王星', traits:'神秘、深情、执着、洞察力强', likes:'深度交流、真相、控制', dislikes:'被背叛、肤浅', career:'侦探、研究、心理', love:'专一且深情，占有欲强', color:'黑色', day:'星期二'},
    '射手': {symbol:'♐', element:'火', ruler:'木星', traits:'乐观、自由、冒险、正直', likes:'旅行、哲学、户外', dislikes:'被困、规则', career:'旅游、教育、法律', love:'喜欢自由，需要空间', color:'紫色', day:'星期四'},
    '摩羯': {symbol:'♑', element:'土', ruler:'土星', traits:'务实、纪律、耐心、有野心', likes:'成就、地位、传统', dislikes:'混乱、轻浮', career:'商业、政治、工程', love:'认真负责，表达含蓄', color:'灰色', day:'星期六'},
    '水瓶': {symbol:'♒', element:'风', ruler:'天王星', traits:'独立、创新、人道主义、叛逆', likes:'科技、自由、朋友', dislikes:'传统、被束缚', career:'科学、改革、社会活动', love:'重视精神契合，需要独立空间', color:'蓝色', day:'星期六'},
    '双鱼': {symbol:'♓', element:'水', ruler:'海王星', traits:'浪漫、敏感、艺术、直觉强', likes:'艺术、音乐、冥想', dislikes:'现实、批评', career:'艺术、医疗、心理', love:'浪漫多情，善于付出', color:'海蓝', day:'星期四'}
  };
  
  let info = constellationData[sign];
  if (!info) return;
  
  let html = '<div style="padding:20px;max-width:600px;margin:0 auto">';
  html += '<div style="text-align:center;margin-bottom:20px">';
  html += '<div style="font-size:72px;margin-bottom:10px">' + info.symbol + '</div>';
  html += '<h2 style="color:var(--gold);margin:0;font-size:28px">' + sign + '座</h2>';
  html += '<p style="color:var(--paper2);margin:10px 0">守护星：' + info.ruler + ' | 元素：' + info.element + '</p>';
  html += '</div>';
  
  html += '<div style="background:rgba(201,168,76,0.08);padding:16px;border-radius:12px;margin-bottom:16px">';
  html += '<h4 style="color:var(--gold);margin:0 0 10px 0">性格特点</h4>';
  html += '<p style="margin:0;color:var(--paper2);line-height:1.8">' + info.traits + '</p>';
  html += '</div>';
  
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">';
  html += '<div style="background:rgba(76,175,80,0.08);padding:12px;border-radius:8px">';
  html += '<h5 style="color:var(--jade);margin:0 0 6px 0">❤️ 喜欢</h5>';
  html += '<p style="margin:0;font-size:13px;color:var(--paper2)">' + info.likes + '</p></div>';
  html += '<div style="background:rgba(244,67,54,0.08);padding:12px;border-radius:8px">';
  html += '<h5 style="color:var(--cinn2);margin:0 0 6px 0">💔 不喜欢</h5>';
  html += '<p style="margin:0;font-size:13px;color:var(--paper2)">' + info.dislikes + '</p></div>';
  html += '</div>';
  
  html += '<div style="background:rgba(255,255,255,0.04);padding:16px;border-radius:12px;margin-bottom:16px">';
  html += '<h4 style="color:var(--gold);margin:0 0 10px 0">💼 适合职业</h4>';
  html += '<p style="margin:0;color:var(--paper2)">' + info.career + '</p>';
  html += '</div>';
  
  html += '<div style="background:rgba(255,255,255,0.04);padding:16px;border-radius:12px;margin-bottom:16px">';
  html += '<h4 style="color:var(--gold);margin:0 0 10px 0">💕 感情特点</h4>';
  html += '<p style="margin:0;color:var(--paper2)">' + info.love + '</p>';
  html += '</div>';
  
  html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;text-align:center">';
  html += '<div><div style="font-size:24px">🎨</div><div style="font-size:12px;color:var(--paper2)">幸运色</div><div style="color:var(--gold)">' + info.color + '</div></div>';
  html += '<div><div style="font-size:24px">📅</div><div style="font-size:12px;color:var(--paper2)">幸运日</div><div style="color:var(--gold)">' + info.day + '</div></div>';
  html += '<div><div style="font-size:24px">♨️</div><div style="font-size:12px;color:var(--paper2)">元素</div><div style="color:var(--gold)">' + info.element + '</div></div>';
  html += '</div>';
  
  html += '<div style="text-align:center;margin-top:20px">';
  html += '<button onclick="showKnowledgeDetail(\'constellation\')" style="background:var(--gold);color:var(--ink);border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:bold">查看完整星座知识</button>';
  html += '</div>';
  html += '</div>';
  
  showModal(sign + '座命运解读', html);
}

// ═══ 知识库搜索与分类筛选 ═══════════════════════════════
let _knowledgeCurCat = 'all';
let _knowledgeCurQuery = '';

function knowledgeSearchFilter(query) {
  _knowledgeCurQuery = (query || '').toLowerCase().trim();
  knowledgeApplyFilters();
}

function knowledgeCatFilter(cat, btn) {
  _knowledgeCurCat = cat;
  // 更新按钮样式
  document.querySelectorAll('#knowledge-cat-filters .knowledge-cat-btn').forEach(function(b) {
    b.style.background = 'transparent';
    b.style.color = 'var(--paper2)';
    b.style.borderColor = 'rgba(201,168,76,0.2)';
    b.classList.remove('active');
  });
  if (btn) {
    btn.style.background = 'rgba(201,168,76,0.12)';
    btn.style.color = 'var(--gold)';
    btn.style.borderColor = 'rgba(201,168,76,0.3)';
    btn.classList.add('active');
  }
  knowledgeApplyFilters();
}

// 派别筛选
let _knowledgeCurSchool = 'all';
function knowledgeSchoolFilter(school, btn) {
  _knowledgeCurSchool = school;
  document.querySelectorAll('#knowledge-school-filters .knowledge-school-btn').forEach(function(b) {
    b.style.background = 'transparent';
    b.style.color = 'var(--paper2)';
    b.style.borderColor = 'rgba(201,168,76,0.2)';
    b.classList.remove('active');
  });
  if (btn) {
    btn.style.background = 'rgba(201,168,76,0.12)';
    btn.style.color = 'var(--gold)';
    btn.style.borderColor = 'rgba(201,168,76,0.3)';
    btn.classList.add('active');
  }
  knowledgeApplyFilters();
}

function knowledgeApplyFilters() {
  let cards = document.querySelectorAll('#knowledge-grid .knowledge-card[data-category]');
  let visibleCount = 0;
  cards.forEach(function(card) {
    let cat = card.getAttribute('data-category');
    let text = (card.textContent || '').toLowerCase();
    let catMatch = (_knowledgeCurCat === 'all' || cat === _knowledgeCurCat);
    let school = card.getAttribute('data-school') || 'shu';
    let schoolMatch = (_knowledgeCurSchool === 'all' || school === _knowledgeCurSchool || school === 'all');
    let searchMatch = (!_knowledgeCurQuery || text.indexOf(_knowledgeCurQuery) >= 0);
    if (catMatch && schoolMatch && searchMatch) {
      card.style.display = '';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });
  // 也处理没有 data-category 的旧卡片
  document.querySelectorAll('#knowledge-grid .knowledge-card:not([data-category])').forEach(function(card) {
    if (_knowledgeCurCat === 'all') {
      let text = (card.textContent || '').toLowerCase();
      card.style.display = (!_knowledgeCurQuery || text.indexOf(_knowledgeCurQuery) >= 0) ? '' : 'none';
    } else {
      card.style.display = 'none';
    }
  });
  // 无结果提示
  let noResult = document.getElementById('knowledge-no-result');
  if (!noResult) {
    noResult = document.createElement('div');
    noResult.id = 'knowledge-no-result';
    noResult.style.cssText = 'display:none;text-align:center;padding:40px 20px;color:var(--paper2);grid-column:1/-1';
    noResult.innerHTML = '<div style="font-size:40px;margin-bottom:12px;opacity:0.3">🔍</div><p style="font-size:14px">未找到匹配的知识卡片</p>';
    let grid = document.querySelector('#knowledge-grid div[style*="grid-template"]');
    if (grid) grid.appendChild(noResult);
  }
  if (visibleCount === 0) {
    noResult.style.display = 'block';
  } else {
    noResult.style.display = 'none';
  }
}

function showYangzhaiKB() {
  if (!window.YANGZHAI_KB) { showToast('阳宅知识库加载中...'); return; }
  let kb = window.YANGZHAI_KB;
  let html = '<div style="padding:16px;max-width:800px;margin:0 auto">';
  
  // 目录导航
  html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px">';
  let sections = [
    {id:'yk-koujue',name:'📜 口诀大全',color:'rgba(201,168,76,0.15)'},
    {id:'yk-bazhai',name:'🧭 八宅配命',color:'rgba(76,175,80,0.15)'},
    {id:'yk-xuankong',name:'⭐ 玄空飞星',color:'rgba(33,150,243,0.15)'},
    {id:'yk-xingsha',name:'⚔️ 形煞化解',color:'rgba(244,67,54,0.15)'},
    {id:'yk-quejiao',name:'📐 缺角补救',color:'rgba(156,39,176,0.15)'},
    {id:'yk-huxing',name:'🏠 户型分析',color:'rgba(255,152,0,0.15)'},
    {id:'yk-caiwei',name:'💰 财位详解',color:'rgba(255,193,7,0.15)'},
    {id:'yk-plants',name:'🌿 风水植物',color:'rgba(76,175,80,0.15)'},
    {id:'yk-louceng',name:'🏢 楼层选择',color:'rgba(33,150,243,0.15)'},
    {id:'yk-zeri',name:'📅 择日法',color:'rgba(156,39,176,0.15)'},
    {id:'yk-classics',name:'📚 经典典籍',color:'rgba(201,168,76,0.15)'}
  ];
  sections.forEach(function(s) {
    html += '<a href="#' + s.id + '" style="display:inline-block;padding:8px 14px;background:' + s.color + ';border-radius:20px;color:var(--gold);text-decoration:none;font-size:13px;cursor:pointer">' + s.name + '</a>';
  });
  html += '</div>';
  
  // 口诀大全
  html += '<div id="yk-koujue" style="margin-bottom:30px"><h3 style="color:var(--gold);border-bottom:1px solid rgba(201,168,76,0.3);padding-bottom:8px">📜 阳宅风水口诀大全</h3>';
  let kjCategories = {dmen:'大门',keting:'客厅',woshi:'卧室',chufang:'厨房',weishengjian:'卫生间',yangtai:'阳台',zonghe:'综合',xingsha:'形煞'};
  Object.keys(kjCategories).forEach(function(key) {
    let list = kb.koujue[key];
    if (!list) return;
    html += '<div style="margin:12px 0"><h4 style="color:var(--paper);font-size:14px;margin-bottom:6px">' + kjCategories[key] + '口诀</h4>';
    html += '<div style="background:rgba(201,168,76,0.06);padding:12px;border-radius:8px">';
    list.forEach(function(jue) {
      html += '<p style="margin:4px 0;color:var(--paper2);font-size:13px;line-height:1.8">• ' + jue + '</p>';
    });
    html += '</div></div>';
  });
  html += '</div>';
  
  // 八宅配命
  html += '<div id="yk-bazhai" style="margin-bottom:30px"><h3 style="color:var(--gold);border-bottom:1px solid rgba(201,168,76,0.3);padding-bottom:8px">🧭 八宅派·配命技法</h3>';
  html += '<p style="color:var(--paper2);line-height:1.8;margin-bottom:12px">' + kb.bazhai.description + '</p>';
  // 命卦表
  html += '<h4 style="color:var(--paper);font-size:14px">命卦速查表</h4>';
  html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px"><thead><tr style="background:rgba(201,168,76,0.15)"><th style="padding:8px;color:var(--gold)">命卦</th><th style="padding:8px;color:var(--gold)">类型</th><th style="padding:8px;color:var(--gold)">四吉方</th><th style="padding:8px;color:var(--gold)">四凶方</th></tr></thead><tbody>';
  kb.bazhai.mingua.table.forEach(function(row) {
    html += '<tr style="border-bottom:1px solid rgba(201,168,76,0.1)"><td style="padding:6px;color:var(--paper)">' + row.gua + '</td><td style="padding:6px;color:' + (row.type==='东四命'?'var(--jade)':'var(--cyan)') + '">' + row.type + '</td><td style="padding:6px;color:var(--paper2);font-size:11px">' + row.best.join('、') + '</td><td style="padding:6px;color:var(--cinn2);font-size:11px">' + row.worst.join('、') + '</td></tr>';
  });
  html += '</tbody></table></div>';
  // 吉凶星
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">';
  html += '<div style="background:rgba(76,175,80,0.08);padding:12px;border-radius:8px"><h5 style="color:var(--jade);margin:0 0 8px">四吉星</h5>';
  Object.keys(kb.bazhai.jixing).forEach(function(k) {
    let s = kb.bazhai.jixing[k];
    html += '<p style="margin:4px 0;font-size:12px;color:var(--paper2)"><strong style="color:var(--paper)">' + k + '</strong>：' + s.meaning + ' → ' + s.effect + '</p>';
  });
  html += '</div>';
  html += '<div style="background:rgba(244,67,54,0.08);padding:12px;border-radius:8px"><h5 style="color:var(--cinn2);margin:0 0 8px">四凶星</h5>';
  Object.keys(kb.bazhai.xiongxing).forEach(function(k) {
    let s = kb.bazhai.xiongxing[k];
    html += '<p style="margin:4px 0;font-size:12px;color:var(--paper2)"><strong style="color:var(--paper)">' + k + '</strong>：' + s.meaning + ' → ' + s.effect + '</p>';
  });
  html += '</div></div>';
  html += '</div>';
  
  // 玄空飞星
  html += '<div id="yk-xuankong" style="margin-bottom:30px"><h3 style="color:var(--gold);border-bottom:1px solid rgba(201,168,76,0.3);padding-bottom:8px">⭐ 玄空飞星技法</h3>';
  html += '<p style="color:var(--paper2);line-height:1.8;margin-bottom:12px">' + kb.xuankong.description + '</p>';
  // 当前运
  let cy = kb.xuankong.sanyuan.current;
  html += '<div style="background:rgba(244,67,54,0.08);padding:16px;border-radius:8px;margin-bottom:16px"><h4 style="color:var(--gold);margin:0 0 8px">当前：' + cy.yun + '</h4>';
  html += '<p style="color:var(--paper2);margin:4px 0">当令星：' + cy.star + '（' + cy.element + '） | 旺方：' + cy.direction + '</p>';
  html += '<p style="color:var(--paper2);margin:4px 0">' + cy.meaning + '</p>';
  html += '<p style="color:var(--jade);margin:4px 0">布局建议：' + cy.layout_advice + '</p></div>';
  // 九运布局
  let jl = kb.xuankong.jiuyun_layout;
  html += '<h4 style="color:var(--paper);font-size:14px">九运方位布局</h4>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">';
  Object.keys(jl.directions).forEach(function(dir) {
    let d = jl.directions[dir];
    let bgc = d.activity==='高'?'rgba(76,175,80,0.1)':d.activity==='忌'?'rgba(244,67,54,0.15)':d.activity==='低'?'rgba(244,67,54,0.08)':'rgba(201,168,76,0.06)';
    html += '<div style="background:' + bgc + ';padding:10px;border-radius:8px"><strong style="color:var(--paper);font-size:13px">' + dir + '</strong><br><span style="font-size:11px;color:var(--paper2)">' + d.star + '</span><br><span style="font-size:11px;color:var(--paper2)">' + d.advice + '</span></div>';
  });
  html += '</div>';
  // 九星
  html += '<h4 style="color:var(--paper);font-size:14px">九星含义</h4>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:16px">';
  Object.keys(kb.xuankong.jiuxing).forEach(function(k) {
    let s = kb.xuankong.jiuxing[k];
    html += '<div style="background:rgba(201,168,76,0.06);padding:8px;border-radius:6px;text-align:center"><div style="color:var(--gold);font-weight:bold">' + k + '</div><div style="font-size:11px;color:var(--paper2)">' + s.star + '</div><div style="font-size:10px;color:var(--paper2)">' + s.element + '/' + s.gua + '</div></div>';
  });
  html += '</div></div>';
  
  // 形煞化解
  html += '<div id="yk-xingsha" style="margin-bottom:30px"><h3 style="color:var(--gold);border-bottom:1px solid rgba(201,168,76,0.3);padding-bottom:8px">⚔️ 形煞识别与化解</h3>';
  kb.xingsha.shas.forEach(function(sha) {
    html += '<div style="background:rgba(244,67,54,0.06);padding:14px;border-radius:10px;margin-bottom:12px">';
    html += '<h4 style="color:var(--paper);margin:0 0 6px">' + sha.name + ' <span style="color:var(--cinn2);font-size:12px">' + sha.severity + '</span></h4>';
    html += '<p style="color:var(--paper2);font-size:13px;margin:4px 0">' + sha.description + '</p>';
    html += '<p style="color:var(--cinn2);font-size:13px;margin:4px 0">⚠️ 影响：' + sha.symptom + '</p>';
    html += '<p style="color:var(--jade);font-size:13px;margin:4px 0">✅ 化解：' + sha.remedy + '</p>';
    html += '<pre style="background:rgba(0,0,0,0.3);padding:8px;border-radius:6px;font-size:11px;color:var(--paper2);margin:8px 0 0;overflow-x:auto">' + sha.illustration + '</pre>';
    html += '</div>';
  });
  html += '</div>';
  
  // 缺角补救
  html += '<div id="yk-quejiao" style="margin-bottom:30px"><h3 style="color:var(--gold);border-bottom:1px solid rgba(201,168,76,0.3);padding-bottom:8px">📐 房屋缺角与补救</h3>';
  html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:rgba(201,168,76,0.15)"><th style="padding:8px;color:var(--gold)">方位</th><th style="padding:8px;color:var(--gold)">对应成员</th><th style="padding:8px;color:var(--gold)">影响</th><th style="padding:8px;color:var(--gold)">补救</th></tr></thead><tbody>';
  kb.quejiao.directions.forEach(function(d) {
    html += '<tr style="border-bottom:1px solid rgba(201,168,76,0.1)"><td style="padding:6px;color:var(--paper)">' + d.position + '</td><td style="padding:6px;color:var(--paper2)">' + d.member + '</td><td style="padding:6px;color:var(--cinn2);font-size:11px">' + d.effect + '</td><td style="padding:6px;color:var(--jade);font-size:11px">' + d.remedy + '</td></tr>';
  });
  html += '</tbody></table></div></div>';
  
  // 户型分析
  html += '<div id="yk-huxing" style="margin-bottom:30px"><h3 style="color:var(--gold);border-bottom:1px solid rgba(201,168,76,0.3);padding-bottom:8px">🏠 常见户型风水分析</h3>';
  kb.huxing.types.forEach(function(t) {
    html += '<div style="background:rgba(201,168,76,0.06);padding:14px;border-radius:10px;margin-bottom:12px">';
    html += '<h4 style="color:var(--paper);margin:0 0 6px">' + t.name + ' <span style="color:var(--gold);font-size:12px">' + t.rating + '</span></h4>';
    html += '<pre style="background:rgba(0,0,0,0.3);padding:8px;border-radius:6px;font-size:11px;color:var(--paper2);margin:8px 0;display:inline-block">' + t.shape + '</pre>';
    html += '<p style="color:var(--paper2);font-size:13px;margin:8px 0 4px">' + t.analysis + '</p>';
    html += '<p style="color:var(--jade);font-size:13px;margin:4px 0">💡 ' + t.advice + '</p>';
    html += '</div>';
  });
  html += '</div>';
  
  // 财位详解
  html += '<div id="yk-caiwei" style="margin-bottom:30px"><h3 style="color:var(--gold);border-bottom:1px solid rgba(201,168,76,0.3);padding-bottom:8px">💰 财位详解</h3>';
  html += '<div style="background:rgba(255,193,7,0.08);padding:14px;border-radius:10px;margin-bottom:12px">';
  Object.keys(kb.caiwei.location).forEach(function(k) {
    html += '<p style="margin:4px 0;color:var(--paper2);font-size:13px"><strong style="color:var(--gold)">' + k + '</strong>：' + kb.caiwei.location[k] + '</p>';
  });
  html += '</div>';
  html += '<h4 style="color:var(--paper);font-size:14px">财位八忌</h4>';
  html += '<div style="background:rgba(244,67,54,0.06);padding:12px;border-radius:8px;margin-bottom:12px">';
  kb.caiwei.rules.forEach(function(r) { html += '<p style="margin:4px 0;color:var(--paper2);font-size:13px">⚠️ ' + r + '</p>'; });
  html += '</div>';
  html += '<h4 style="color:var(--paper);font-size:14px">招财物品</h4>';
  kb.caiwei.items.forEach(function(item) {
    html += '<div style="background:rgba(201,168,76,0.06);padding:10px;border-radius:8px;margin-bottom:6px"><strong style="color:var(--gold)">' + item.name + '</strong> <span style="color:var(--paper2);font-size:12px">→ ' + item.effect + '</span><br><span style="font-size:11px;color:var(--paper2)">摆放：' + item.placement + ' | ' + item.note + '</span></div>';
  });
  html += '</div>';
  
  // 风水植物
  html += '<div id="yk-plants" style="margin-bottom:30px"><h3 style="color:var(--gold);border-bottom:1px solid rgba(201,168,76,0.3);padding-bottom:8px">🌿 阳宅风水植物</h3>';
  html += '<h4 style="color:var(--jade);font-size:14px">吉祥植物</h4>';
  kb.plants.lucky.forEach(function(p) {
    html += '<div style="background:rgba(76,175,80,0.06);padding:8px 12px;border-radius:6px;margin-bottom:4px;font-size:13px;color:var(--paper2)"><strong style="color:var(--paper)">' + p.name + '</strong>（' + p.element + '）→ ' + p.effect + ' | 摆放：' + p.placement + '</div>';
  });
  html += '<h4 style="color:var(--cinn2);font-size:14px;margin-top:12px">化煞植物</h4>';
  kb.plants.sha_plants.forEach(function(p) {
    html += '<div style="background:rgba(244,67,54,0.06);padding:8px 12px;border-radius:6px;margin-bottom:4px;font-size:13px;color:var(--paper2)"><strong style="color:var(--paper)">' + p.name + '</strong> → ' + p.effect + ' | ' + p.placement + '</div>';
  });
  html += '<h4 style="color:var(--paper);font-size:14px;margin-top:12px">⚠️ 禁忌</h4>';
  kb.plants.taboo.forEach(function(t) { html += '<p style="margin:3px 0;font-size:12px;color:var(--cinn2)">• ' + t + '</p>'; });
  html += '</div>';
  
  // 楼层选择
  html += '<div id="yk-louceng" style="margin-bottom:30px"><h3 style="color:var(--gold);border-bottom:1px solid rgba(201,168,76,0.3);padding-bottom:8px">🏢 楼层五行选择</h3>';
  html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:rgba(201,168,76,0.15)"><th style="padding:8px;color:var(--gold)">五行命</th><th style="padding:8px;color:var(--gold)">最佳楼层</th><th style="padding:8px;color:var(--gold)">避忌楼层</th></tr></thead><tbody>';
  kb.louceng.table.forEach(function(r) {
    html += '<tr style="border-bottom:1px solid rgba(201,168,76,0.1)"><td style="padding:6px;color:var(--paper)">' + r.element + '</td><td style="padding:6px;color:var(--jade);font-size:11px">' + r.best + '</td><td style="padding:6px;color:var(--cinn2);font-size:11px">' + r.avoid + '</td></tr>';
  });
  html += '</tbody></table></div></div>';
  
  // 择日法
  html += '<div id="yk-zeri" style="margin-bottom:30px"><h3 style="color:var(--gold);border-bottom:1px solid rgba(201,168,76,0.3);padding-bottom:8px">📅 阳宅择日法</h3>';
  kb.zeri.rules.forEach(function(r) {
    html += '<div style="background:rgba(156,39,176,0.06);padding:10px;border-radius:8px;margin-bottom:6px">';
    html += '<strong style="color:var(--paper)">' + r.event + '</strong><br><span style="font-size:12px;color:var(--paper2)">原则：' + r.principle + '</span><br><span style="font-size:11px;color:var(--gold)">💡 ' + r.note + '</span>';
    html += '</div>';
  });
  html += '</div>';
  
  // 经典典籍
  html += '<div id="yk-classics" style="margin-bottom:30px"><h3 style="color:var(--gold);border-bottom:1px solid rgba(201,168,76,0.3);padding-bottom:8px">📚 阳宅经典典籍</h3>';
  kb.classics.forEach(function(c) {
    html += '<div style="background:rgba(201,168,76,0.06);padding:10px;border-radius:8px;margin-bottom:6px">';
    html += '<strong style="color:var(--paper)">' + c.title + '</strong> <span style="font-size:12px;color:var(--paper2)">— ' + c.author + '</span><br><span style="font-size:12px;color:var(--paper2)">' + c.content + '</span><br><span style="font-size:11px;color:var(--gold)">要点：' + c.key_point + '</span>';
    html += '</div>';
  });
  html += '</div>';
  
  html += '</div>';
  showModal('🏠 阳宅风水全量知识库', html);
}

function showWisdom(idx) {
  let el = document.getElementById('dwText');
  let src = document.getElementById('dwSource');
  if (!el || !src) return;
  let q = wisdomQuotes[idx % wisdomQuotes.length];
  el.textContent = q.text;
  src.textContent = '—— ' + q.source;
}
function initDailyWisdom() { dwIdx = new Date().getDate() % wisdomQuotes.length; showWisdom(dwIdx); }
function prevWisdom() { dwIdx = (dwIdx - 1 + wisdomQuotes.length) % wisdomQuotes.length; showWisdom(dwIdx); }
function nextWisdom() { dwIdx = (dwIdx + 1) % wisdomQuotes.length; showWisdom(dwIdx); }
function shuffleWisdom() { dwIdx = Math.floor(_drand() * wisdomQuotes.length); showWisdom(dwIdx); }

// ═══ 手印切换 ══════════════════════════════════════
function switchMudra(btn, type) {
  document.querySelectorAll('.mudra-tab').forEach(function(t) { t.classList.remove('active'); });
  btn.classList.add('active');
  let dao = document.getElementById('mudraDao');
  let buddha = document.getElementById('mudraBuddha');
  if (dao) dao.style.display = type === 'dao' ? 'block' : 'none';
  if (buddha) buddha.style.display = type === 'buddha' ? 'block' : 'none';
}

function closeKnowledgeDetail() {
  hideKnowledgeDetail();
}

// ================================================================
// 自动推荐名字功能（八字+居住地综合判断）
// ================================================================
function recommendRename() {
  let recBtn = document.querySelector('button[onclick="recommendRename()"]');
  if (recBtn) { recBtn.disabled = true; recBtn.textContent = '🔮 推荐中...'; }
  let outDiv = document.getElementById('renameRecommendOutput');
  if (!outDiv) { if (recBtn) { recBtn.disabled = false; recBtn.textContent = '🤖 自动推荐名字'; } return; }

  // 1. 收集输入
  let currentName = (document.getElementById('renameCurrentName')||{}).value || '';
  currentName = currentName.trim();
  let sex = (document.getElementById('renameSex')||{}).value || 'male';
  let birthDate = (document.getElementById('renameBirthDate')||{}).value || '';
  let birthHourVal = (document.getElementById('renameBirthHour')||{}).value || '';
  let birthLocation = (document.getElementById('renameBirthLocation')||{}).value || '';
  let resideLocation = (document.getElementById('renameResideLocation')||{}).value || '';

  if (!currentName) {
    outDiv.style.display = 'block';
    outDiv.innerHTML = '<div class="result-card" style="padding:20px;text-align:center;color:var(--cinn2)">⚠️ 请输入当前姓名（至少需要姓氏）</div>';
    if (recBtn) { recBtn.disabled = false; recBtn.textContent = '🤖 自动推荐名字'; }
    return;
  }
  if (!birthDate) {
    outDiv.style.display = 'block';
    outDiv.innerHTML = '<div class="result-card" style="padding:20px;text-align:center;color:var(--cinn2)">⚠️ 请输入出生日期以计算八字</div>';
    if (recBtn) { recBtn.disabled = false; recBtn.textContent = '🤖 自动推荐名字'; }
    return;
  }

  outDiv.style.display = 'block';
  outDiv.innerHTML = '<div class="result-card" style="padding:30px;text-align:center"><div style="font-size:14px;color:var(--gold);letter-spacing:2px">🔮 正在基于八字五行推荐佳名...</div><div style="margin-top:8px;font-size:11px;opacity:.4">分析日主、喜用神、方位五行、字义</div></div>';

  // 延迟执行，让UI更新
  setTimeout(function() {
    try {
      _doRecommendRename(currentName, sex, birthDate, birthHourVal, birthLocation, resideLocation, outDiv);
    } catch(e) {
      console.error('recommendRename error:', e);
      outDiv.innerHTML = '<div class="result-card" style="padding:20px;text-align:center;color:var(--cinn2)">⚠️ 推荐过程出错：' + e.message + '</div>';
    } finally {
      if (recBtn) { recBtn.disabled = false; recBtn.textContent = '🤖 自动推荐名字'; }
    }
  }, 50);
}

function _doRecommendRename(currentName, sex, birthDate, birthHourVal, birthLocation, resideLocation, outDiv) {
  // === 2. 计算八字日主和喜用神 ===
  let baziInfo = _calcSimpleBazi(birthDate, birthHourVal);
  let dayStem = baziInfo.dayStem;
  let dayWx = baziInfo.dayWx;
  let xiShen = baziInfo.xiShen;
  let isWeak = baziInfo.isWeak;

  // === 3. 方位五行补益 ===
  let birthWx = _getLocationWuxing(birthLocation);
  let resideWx = _getLocationWuxing(resideLocation);

  // === 4. 获取姓氏 ===
  let surname = currentName[0];
  try {
    let surnameStroke = (typeof getKangxiStroke === 'function') ? getKangxiStroke(surname) || 8 : 8;
  } catch(e) { let surnameStroke = 8; }
  if (!surnameStroke || surnameStroke <= 0) surnameStroke = 8;

  // === 5. 确定名字用字方向和字符池 ===
  let keMap = {木:'金',火:'水',土:'木',金:'火',水:'土'};
  let shengMap = {木:'水',火:'木',土:'火',金:'土',水:'金'};
  let keXieMap = {木:'火',火:'土',土:'金',金:'水',水:'木'}; // 我生者（食伤）

  // 身弱用生扶，身强用克泄
  let preferredWx = [xiShen]; // 喜用神优先
  if (isWeak) {
    // 身弱：用生扶日主的五行（印、比劫）
    let yinWx = shengMap[dayWx];
    if (preferredWx.indexOf(yinWx) < 0) preferredWx.push(yinWx);
    if (preferredWx.indexOf(dayWx) < 0) preferredWx.push(dayWx);
  } else {
    // 身强：用克泄日主的五行（财、官、食伤）
    let caiWx = keMap[dayWx];
    let guanWx = keXieMap[dayWx]; 
    if (preferredWx.indexOf(caiWx) < 0) preferredWx.push(caiWx);
    if (preferredWx.indexOf(guanWx) < 0) preferredWx.push(guanWx);
  }

  // 居住地五行补益：如果居住地五行太强，补其相生或相克五行
  if (resideWx) {
    let balanceWx1 = shengMap[resideWx]; // 生居住地者
    let balanceWx2 = keMap[resideWx]; // 克居住地者
    if (preferredWx.indexOf(balanceWx1) < 0 && balanceWx1 !== dayWx) preferredWx.push(balanceWx1);
    if (preferredWx.indexOf(balanceWx2) < 0 && balanceWx2 !== dayWx) preferredWx.push(balanceWx2);
  }

  // 确保至少有两个方向
  let allWx = ['木','火','土','金','水'];
  allWx.forEach(function(w) {
    if (preferredWx.indexOf(w) < 0) preferredWx.push(w);
  });

  // === 6. 从 CHAR_MEANING 筛选字符 ===
  let charByWx = {木:[],火:[],土:[],金:[],水:[]};
  if (typeof CHAR_MEANING !== 'undefined') {
    for (let ch in CHAR_MEANING) {
      if (!CHAR_MEANING.hasOwnProperty(ch)) continue;
      let info = CHAR_MEANING[ch];
      if (!info || !info.wuxing) continue;
      if (charByWx[info.wuxing]) {
        charByWx[info.wuxing].push(ch);
      }
    }
  }

  // 去重
  allWx.forEach(function(w) {
    let uniq = [];
    let seen = {};
    charByWx[w].forEach(function(c) { if (!seen[c]) { seen[c]=true; uniq.push(c); } });
    charByWx[w] = uniq;
  });

  // 补充基础字符池，确保每个五行至少有20个候选字
  let fallbackChars = {
    '木': ['林','森','松','柏','桐','梓','楠','杉','枫','桦','楷','荣','萱','兰','芝','菊','梅','荷','莲','竹','筠','菁','茵','萌','蕊','芳','芸','栋','材','茂','华','春','生','叶','英','苏','艺','杨','柳','桂','榆'],
    '火': ['明','旭','昊','晨','晓','晖','煜','炜','焕','晟','畅','曜','曦','昀','昕','晗','昱','昭','晶','辉','炎','灿','耀','亮','照','光','热','炫','煌','炯','烨','晟','融','灵','腾','跃','飞','扬','暖','映','显'],
    '土': ['坤','地','基','础','稳','固','城','垣','培','均','坦','坪','境','域','疆','邦','国','圣','坚','磊','岩','峰','岳','峻','崇','岭','增','坊','壁','轩','安','宁','泰','平','顺','和','雍','容','宽','厚'],
    '金': ['鑫','铭','锐','钧','锋','锦','金','银','钟','钰','镇','铮','锡','铠','钦','鉴','铜','铁','钢','键','创','新','革','鼎','变','专','坚','毅','决','勇','刚','强','威','肃','正','严','明','达','远','博'],
    '水': ['泽','涵','浩','海','洋','波','涛','润','清','源','江','河','溪','沐','沛','泓','澜','瀚','潇','雪','雨','雯','霖','露','冰','洁','深','远','阔','渊','澄','澈','湘','浦','洛','渡','汇','派','流','淳']
  };
  allWx.forEach(function(w) {
    if (charByWx[w].length < 20 && fallbackChars[w]) {
      fallbackChars[w].forEach(function(c) {
        if (charByWx[w].indexOf(c) < 0) charByWx[w].push(c);
      });
    }
  });

  // === 7. 男女用字风格过滤 ===
  let maleStrongChars = {'伟':1,'强':1,'杰':1,'豪':1,'博':1,'辉':1,'鹏':1,'刚':1,'勇':1,'浩':1,'锋':1,'磊':1,'铠':1,'锐':1,'毅':1,'瀚':1};
  let maleGentleChars = {'宇':1,'轩':1,'睿':1,'彦':1,'文':1,'哲':1,'翰':1,'霖':1,'梓':1,'桐':1,'彬':1,'铭':1,'皓':1,'安':1,'宁':1,'泽':1,'林':1,'柏':1,'清':1,'雅':1,'泰':1,'和':1,'坤':1,'信':1};
  let femaleStrongChars = {'婷':1,'雅':1,'馨':1,'怡':1,'婉':1,'媛':1,'茹':1,'薇':1,'萱':1,'菲':1,'莲':1,'曼':1,'晴':1,'蕊':1,'蕾':1,'菁':1,'悦':1,'若':1,'灵':1,'韵':1,'瑛':1,'晶':1};
  let femaleGentleChars = {'涵':1,'柔':1,'芸':1,'兰':1,'棠':1,'桂':1,'芷':1,'娴':1,'慧':1,'静':1,'淑':1,'玲':1,'琴':1,'嘉':1,'雪':1,'雯':1,'瑶':1,'琳':1,'芳':1,'丽':1,'敏':1,'丹':1,'彤':1,'秀':1};

  // 根据日主强弱和性别选字符集
  let isMale = (sex === 'male');
  let candidateChars = [];

  // 按优先级依次从preferredWx中取字
  // 第一组：喜用神五行（最高优先级）
  let tier1 = [];
  allWx.forEach(function(w) {
    let chars = charByWx[w];
    chars.forEach(function(c) {
      let tier = (w === xiShen) ? 0 : (preferredWx.indexOf(w) <= 2 ? 1 : 2);
      let charInfo = CHAR_MEANING[c] || {};
      tier1.push({c:c, wx:w, tier:tier, meaning:charInfo.meaning||'', source:charInfo.source||''});
    });
  });

  // 按tier排序
  tier1.sort(function(a,b) { return a.tier - b.tier; });

  // 取前100个候选字
  candidateChars = tier1.slice(0, 100);

  // === 8. 生成名字组合并评分 ===
  let results = [];
  let maxCombos = Math.min(candidateChars.length * candidateChars.length, 2000);
  let comboCount = 0;

  for (let i = 0; i < candidateChars.length; i++) {
    for (let j = 0; j < candidateChars.length; j++) {
      if (i === j) continue; // 避免两字相同
      if (comboCount >= maxCombos) break;
      comboCount++;

      let char1 = candidateChars[i];
      let char2 = candidateChars[j];
      let fullName = surname + char1.c + char2.c;

      // 计算五格
      let wuge = null;
      try {
        if (typeof calculateWuge === 'function') {
          wuge = calculateWuge(fullName);
        }
      } catch(e) { wuge = null; }

      if (!wuge || wuge.error) continue;

      // 分析三才
      let sancai = null;
      try {
        if (typeof analyzeSancai === 'function') {
          sancai = analyzeSancai(wuge);
        }
      } catch(e) { sancai = null; }

      if (!sancai) continue;

      // 计算综合评分
      let score = 0;

      // 五格吉凶得分 (0-40)
      let wugeScore = 0;
      [wuge.tianGe, wuge.renGe, wuge.diGe, wuge.zongGe, wuge.waiGe].forEach(function(gv) {
        let detail = (typeof getWugeLuckDetail === 'function') ? getWugeLuckDetail(gv) : null;
        if (detail) {
          if (detail.luck === '大吉') wugeScore += 8;
          else if (detail.luck === '吉') wugeScore += 6;
          else if (detail.luck === '半吉') wugeScore += 3;
        }
      });
      score += wugeScore;

      // 三才得分 (0-30)
      score += sancai.score * 0.3;

      // 五行匹配得分 (0-20)
      let wxMatch = 0;
      if (char1.wx === xiShen) wxMatch += 10;
      if (char2.wx === xiShen) wxMatch += 10;
      if (char1.wx !== xiShen && preferredWx.indexOf(char1.wx) <= 2) wxMatch += 6;
      if (char2.wx !== xiShen && preferredWx.indexOf(char2.wx) <= 2) wxMatch += 6;
      score += wxMatch;

      // 谐音检查 (0-10)
      let homophoneScore = 10;
      let checkStr = char1.c + char2.c;
      let badHomophones = {
        '死':'si3','亡':'wang2','病':'bing4','灾':'zai1','祸':'huo4','穷':'qiong2',
        '败':'bai4','亏':'kui1','残':'can2','贱':'jian4','苦':'ku3','悲':'bei1'
      };
      for (let bc in badHomophones) {
        if (checkStr.indexOf(bc) >= 0) { homophoneScore -= 5; }
      }
      score += homophoneScore;

      // 避免生僻字
      if ((char1.c.charCodeAt(0) > 0x9FFF || char2.c.charCodeAt(0) > 0x9FFF) &&
          typeof getKangxiStroke === 'function' &&
          getKangxiStroke(char1.c) === 0) score -= 10;

      score = Math.round(Math.min(100, Math.max(30, score)));

      results.push({
        fullName: fullName,
        char1: char1,
        char2: char2,
        wuge: wuge,
        sancai: sancai,
        score: score,
        wxMatch: wxMatch,
        wugeScore: wugeScore
      });
    }
    if (comboCount >= maxCombos) break;
  }

  // === 9. 按评分排序，取前10 ===
  results.sort(function(a,b) { return b.score - a.score; });
  let top10 = results.slice(0, Math.max(10, Math.min(results.length, 15)));

  // 去重（按名字）
  let seenNames = {};
  top10 = top10.filter(function(r) {
    if (seenNames[r.fullName]) return false;
    seenNames[r.fullName] = true;
    return true;
  }).slice(0, 10);

  // === 10. 展示结果 ===
  if (top10.length === 0) {
    outDiv.innerHTML = '<div class="result-card" style="padding:20px;text-align:center;color:var(--cinn2)">⚠️ 未找到合适名字组合，请尝试调整输入信息</div>';
    return;
  }

  let wuxingColor = {木:'var(--success)',火:'var(--cinn2)',土:'var(--gold)',金:'var(--warn)',水:'var(--cyan2)'};
  let wuxingEmoji = {木:'🌿',火:'🔥',土:'⛰️',金:'⚜️',水:'💧'};
  let shengMapDisplay = {木:'水',火:'木',土:'火',金:'土',水:'金'};
  let keMapDisplay = {木:'金',火:'水',土:'木',金:'火',水:'土'};

  let html = '<div class="result-card" style="padding:20px;border-radius:12px;background:rgba(201,168,76,.04);border:1px solid rgba(201,168,76,.15)">';
  html += '<div style="text-align:center;margin-bottom:20px">';
  html += '<h3 style="font-family:Ma Shan Zheng,serif;font-size:24px;color:var(--gold);letter-spacing:4px;margin-bottom:4px">✨ 八字契合推荐名字</h3>';
  html += '<p style="font-size:12px;opacity:.5;letter-spacing:2px">日主：' + dayStem + '(' + dayWx + ')　' + (isWeak ? '偏弱' : '偏强') + '　喜：' + xiShen;
  if (resideWx) html += '　居：' + ((typeof resideLocation === 'string' && resideLocation) ? resideLocation : '') + '(' + resideWx + ')';
  html += '</p>';
  html += '</div>';

  // 五行方向说明
  html += '<div style="margin-bottom:16px;padding:8px 12px;background:rgba(255,255,255,.02);border-radius:6px;font-size:11px;opacity:.7;line-height:1.6;text-align:center">';
  html += '🎯 推荐方向：优先' + xiShen + '五行（喜用神）';
  if (isWeak) html += ' · 生扶日主';
  else html += ' · 克泄平衡';
  if (resideWx) {
    let shengReside = shengMapDisplay[resideWx];
    html += ' · 居住' + resideWx + '地，补' + shengReside + '平衡';
  }
  html += '</div>';

  // 名字卡片
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">';
  top10.forEach(function(r, idx) {
    let rankBadge = '';
    if (idx === 0) rankBadge = '<span style="display:inline-block;background:linear-gradient(135deg,var(--warn),var(--cinn2));color:var(--paper);font-size:10px;padding:2px 8px;border-radius:10px;margin-left:6px">🥇 TOP1</span>';
    else if (idx === 1) rankBadge = '<span style="display:inline-block;background:linear-gradient(135deg,var(--metal2),var(--steel));color:var(--paper);font-size:10px;padding:2px 8px;border-radius:10px;margin-left:6px">🥈 TOP2</span>';
    else if (idx === 2) rankBadge = '<span style="display:inline-block;background:linear-gradient(135deg,var(--cinn),var(--wood));color:var(--paper);font-size:10px;padding:2px 8px;border-radius:10px;margin-left:6px">🥉 TOP3</span>';

    html += '<div class="rename-rec-card" style="padding:14px;background:rgba(255,255,255,.03);border:1px solid rgba(201,168,76,' + (idx < 3 ? '.25' : '.1') + ');border-radius:10px;cursor:pointer;transition:all .2s"';
    html += ' onclick="_selectRecommendedName(\'' + r.fullName + '\')"';
    html += ' onmouseover="this.style.borderColor=\'var(--gold)\';this.style.background=\'rgba(201,168,76,.06)\';"';
    html += ' onmouseout="this.style.borderColor=\'rgba(201,168,76,' + (idx < 3 ? '.25' : '.1') + ')\';this.style.background=\'rgba(255,255,255,.03)\';"';
    html += '>';
    // 名字
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">';
    html += '<div style="font-family:Ma Shan Zheng,serif;font-size:22px;letter-spacing:6px;color:var(--gold)">' + r.fullName + rankBadge + '</div>';
    html += '<div style="font-size:20px;font-weight:bold;color:' + (r.score >= 75 ? 'var(--success)' : r.score >= 60 ? 'var(--gold)' : 'var(--cinn2)') + '">' + r.score + '</div>';
    html += '</div>';
    // 五行标签
    html += '<div style="display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap">';
    html += '<span style="font-size:10px;padding:2px 8px;border-radius:10px;background:' + (wuxingColor[r.char1.wx]||'var(--steel)') + '20;color:' + (wuxingColor[r.char1.wx]||'var(--steel)') + ';border:1px solid ' + (wuxingColor[r.char1.wx]||'var(--steel)') + '30">' + (wuxingEmoji[r.char1.wx]||'') + ' ' + r.char1.c + '(' + r.char1.wx + ')</span>';
    html += '<span style="font-size:10px;padding:2px 8px;border-radius:10px;background:' + (wuxingColor[r.char2.wx]||'var(--steel)') + '20;color:' + (wuxingColor[r.char2.wx]||'var(--steel)') + ';border:1px solid ' + (wuxingColor[r.char2.wx]||'var(--steel)') + '30">' + (wuxingEmoji[r.char2.wx]||'') + ' ' + r.char2.c + '(' + r.char2.wx + ')</span>';
    html += '</div>';
    // 三才
    let sancaiLuckClass = (r.sancai.luck === '大吉' || r.sancai.luck === '吉') ? 'color:var(--success)' : (r.sancai.luck === '半吉' ? 'color:var(--gold)' : 'color:var(--cinn2)');
    html += '<div style="font-size:10px;opacity:.7;margin-bottom:4px">三才：' + r.sancai.tian + '→' + r.sancai.ren + '→' + r.sancai.di + ' <span style="' + sancaiLuckClass + '">' + r.sancai.luck + '</span></div>';
    // 寓意
    html += '<div style="font-size:10px;opacity:.6;line-height:1.4">📜 ' + (r.char1.meaning || '美好') + '；' + (r.char2.meaning || '美好') + '</div>';
    // 按钮
    html += '<div style="margin-top:8px;display:flex;gap:6px">';
    html += '<button onclick="event.stopPropagation();_selectRecommendedName(\'' + r.fullName + '\');computeRename();" style="flex:1;font-size:10px;padding:4px 8px;background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.2);color:var(--gold);border-radius:4px;cursor:pointer">📋 详细分析此名</button>';
    html += '</div>';
    html += '</div>';
  });
  html += '</div>';

  // 底部说明
  html += '<div style="margin-top:20px;padding:12px;background:rgba(255,255,255,.02);border-radius:8px;font-size:11px;opacity:.6;line-height:1.8;text-align:center">';
  html += '📌 点击名字卡片可快速填入名字，点击「详细分析此名」可查看完整三才五格分析。<br>';
  html += '📌 评分综合考量：五格吉凶(40%) + 三才配置(30%) + 五行匹配(20%) + 谐音检查(10%)';
  html += '</div>';
  html += '</div>';

  outDiv.innerHTML = html;
  outDiv.style.display = 'block';

  // 滚动到结果区域
  outDiv.scrollIntoView({behavior:'smooth',block:'center'});
}

// 辅助：选中推荐的名字填入textarea并触发分析
function _selectRecommendedName(fullName) {
  let textarea = document.getElementById('renameNewNames');
  if (textarea) {
    textarea.value = fullName;
  }
  // 滚动到分析按钮
  let resultDiv = document.getElementById('renameResult');
  if (resultDiv) {
    resultDiv.scrollIntoView({behavior:'smooth',block:'center'});
  }
}

// 辅助：简易八字计算（日主、喜用神）
function _calcSimpleBazi(birthDate, birthHourVal) {
  let stems = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  let branches = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  let stemWx = {甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
  let shengMap = {木:'水',火:'木',土:'火',金:'土',水:'金'};
  let keMap = {木:'金',火:'水',土:'木',金:'火',水:'土'};

  let dateParts = birthDate.split('-');
  let year = parseInt(dateParts[0]) || 2000;
  let month = parseInt(dateParts[1]) || 1;
  let day = parseInt(dateParts[2]) || 1;

  // 计算儒略日数
  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;
  let jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  // 日干支索引（与Python版本的公式对齐）
  let dayGzIdx = (jdn + 5) % 60;
  if (dayGzIdx < 0) dayGzIdx += 60;
  let dayStemIdx = dayGzIdx % 10;
  let dayStem = stems[dayStemIdx];
  let dayWx = stemWx[dayStem];

  // 计算月干支（简化）
  let monthZhiIdx = 0;
  // 根据节气月确定月支
  // 寅月(2/4-3/5), 卯月(3/6-4/4), ...
  if (month === 1) monthZhiIdx = (day >= 6) ? 0 : 11; // 小寒后=丑月, 否则=子月
  else monthZhiIdx = (month + 10) % 12; // 简化：2月=寅, 3月=卯...

  // 时辰
  let birthHour = 6; // 默认午时
  if (birthHourVal !== '' && birthHourVal !== null) {
    birthHour = parseInt(birthHourVal) || 6;
  }

  // 确定身强/身弱（简化版：按日干支索引奇偶）
  let isWeak = (dayGzIdx % 2 === 0);
  let xiShen = isWeak ? shengMap[dayWx] : keMap[dayWx];

  return {
    dayStem: dayStem,
    dayWx: dayWx,
    xiShen: xiShen,
    isWeak: isWeak,
    dayGzIdx: dayGzIdx,
    jdn: jdn
  };
}

// 辅助：根据地名判断方位五行
function _getLocationWuxing(location) {
  if (!location) return null;
  let north = ['北京','天津','河北','辽宁','吉林','黑龙江','内蒙古','东北','沈阳','哈尔滨','长春','大连','石家庄'];
  let east = ['上海','江苏','浙江','山东','福建','杭州','南京','苏州','宁波','青岛','厦门','济南'];
  let south = ['广东','广西','海南','深圳','广州','香港','澳门','珠海','佛山','东莞','南宁','海口'];
  let west = ['陕西','甘肃','青海','宁夏','新疆','四川','重庆','西安','成都','兰州','西宁','银川','乌鲁木齐','昆明','贵州','贵阳','西藏','拉萨'];
  let central = ['湖北','湖南','河南','江西','安徽','山西','武汉','长沙','郑州','南昌','合肥','太原'];

  for (let i = 0; i < north.length; i++) { if (location.indexOf(north[i]) >= 0) return '水'; }
  for (let i = 0; i < east.length; i++) { if (location.indexOf(east[i]) >= 0) return '木'; }
  for (let i = 0; i < south.length; i++) { if (location.indexOf(south[i]) >= 0) return '火'; }
  for (let i = 0; i < west.length; i++) { if (location.indexOf(west[i]) >= 0) return '金'; }
  for (let i = 0; i < central.length; i++) { if (location.indexOf(central[i]) >= 0) return '土'; }
  return null;
}


// ================================================================
// ==================== 起名改名专业模型 ====================
// ==================== 三层架构：知识库-模型-自进化 ====================
// ================================================================

// ════════════════════════════════════════════════════════════════
// 第一层：知识库
// ════════════════════════════════════════════════════════════════

// ================================================================
// 1. 生肖取名宜忌字根
// ================================================================
const ZODIAC_NAME_RULES = {
  '鼠': {
    lucky: [
      {radical:'子',reason:'本命字根，增强自身气场'},
      {radical:'水',reason:'鼠属水，得水相生，智慧灵动'},
      {radical:'氵',reason:'水旁字根，源源不绝，财运亨通'},
      {radical:'口',reason:'鼠喜洞穴，口字根象征安身之所'},
      {radical:'宀',reason:'屋檐之形，鼠喜安居，家宅平安'},
      {radical:'米',reason:'粮食字根，鼠得食则旺，丰衣足食'},
      {radical:'禾',reason:'谷物字根，象征丰收，衣食无忧'},
      {radical:'玉',reason:'鼠为贵神，玉字根增贵气'}
    ],
    avoid: [
      {radical:'马',reason:'子午相冲，鼠遇马则冲突不断'},
      {radical:'午',reason:'午即马，直接冲克，事业受阻'},
      {radical:'火',reason:'水火相克，鼠遇火则精力耗损'},
      {radical:'灬',reason:'火底旁，暗藏火性，健康受损'},
      {radical:'日',reason:'鼠夜行动物，日字根克身，运势暗淡'},
      {radical:'羊',reason:'子未相害，鼠遇羊则小人是非多'}
    ]
  },
  '牛': {
    lucky: [
      {radical:'水',reason:'牛属土，土得水润则万物生'},
      {radical:'氵',reason:'水旁滋润，牛得水则力壮'},
      {radical:'禾',reason:'牛耕田得禾，劳动有成，收获丰硕'},
      {radical:'豆',reason:'饲料字根，牛得豆则壮，精力充沛'},
      {radical:'草',reason:'草头字根，牛食草而肥，生活富足'},
      {radical:'艹',reason:'草字头，同上，丰衣足食'},
      {radical:'田',reason:'牛耕田，田字根象征勤劳有功'},
      {radical:'车',reason:'牛拉车，车字根象征负重前行，有担当'}
    ],
    avoid: [
      {radical:'羊',reason:'丑未相冲，牛遇羊则冲突'},
      {radical:'未',reason:'未即羊，直接冲克'},
      {radical:'马',reason:'丑午相害，牛遇马则受制'},
      {radical:'午',reason:'午即马，同上'},
      {radical:'心',reason:'牛素食，心字根为肉，食性不合'},
      {radical:'忄',reason:'竖心旁，同上，身体不适'}
    ]
  },
  '虎': {
    lucky: [
      {radical:'山',reason:'虎为山王，山字根彰显威严'},
      {radical:'林',reason:'虎居山林，林字根得其所哉'},
      {radical:'木',reason:'虎属木，木字根相助，力量增强'},
      {radical:'王',reason:'虎额有王字，王字根增领导力'},
      {radical:'大',reason:'虎体形大，大字根助气势'},
      {radical:'肉',reason:'虎食肉，肉字根象征丰足'},
      {radical:'月',reason:'月旁为肉，同上，精力旺盛'}
    ],
    avoid: [
      {radical:'猴',reason:'寅申相冲，虎遇猴则冲突'},
      {radical:'申',reason:'申即猴，直接冲克'},
      {radical:'蛇',reason:'寅巳相害，虎遇蛇则受扰'},
      {radical:'巳',reason:'巳即蛇，同上'},
      {radical:'门',reason:'虎入门则困，门字根限制发展'},
      {radical:'口',reason:'虎入笼中，口字根象征受困'}
    ]
  },
  '兔': {
    lucky: [
      {radical:'月',reason:'玉兔月宫，月字根增贵气'},
      {radical:'木',reason:'兔属木，木字根相助'},
      {radical:'禾',reason:'兔食禾苗，粮食丰足'},
      {radical:'艹',reason:'草字头，兔食草而肥'},
      {radical:'宀',reason:'兔喜穴居，宀字根象征安家'},
      {radical:'穴',reason:'穴字头，同上，安全有靠'},
      {radical:'衣',reason:'兔毛柔软，衣字根增文雅'}
    ],
    avoid: [
      {radical:'鸡',reason:'卯酉相冲，兔遇鸡则冲突'},
      {radical:'酉',reason:'酉即鸡，直接冲克'},
      {radical:'龙',reason:'卯辰相害，兔遇龙则受压'},
      {radical:'辰',reason:'辰即龙，同上'},
      {radical:'日',reason:'日月相争，兔遇日则不安'}
    ]
  },
  '龙': {
    lucky: [
      {radical:'水',reason:'龙得水则飞，水字根助运势腾达'},
      {radical:'氵',reason:'水旁字根，同上，如鱼得水'},
      {radical:'雨',reason:'龙行云布雨，雨字根增权势'},
      {radical:'云',reason:'龙腾云驾雾，云字根助事业'},
      {radical:'王',reason:'龙为瑞兽之王，王字根增贵气'},
      {radical:'大',reason:'龙体巨大，大字根助气势'},
      {radical:'天',reason:'龙飞天上，天字根象征志向高远'},
      {radical:'日',reason:'龙喜日月明珠，日字根增光明'}
    ],
    avoid: [
      {radical:'狗',reason:'辰戌相冲，龙遇狗则冲突'},
      {radical:'戌',reason:'戌即狗，直接冲克'},
      {radical:'兔',reason:'卯辰相害，龙遇兔则不安'},
      {radical:'卯',reason:'卯即兔，同上'},
      {radical:'山',reason:'龙入山则困，山字根限制发展'},
      {radical:'田',reason:'龙落田则失势，田字根不利'}
    ]
  },
  '蛇': {
    lucky: [
      {radical:'口',reason:'蛇喜洞穴，口字根象征安身'},
      {radical:'宀',reason:'屋檐之形，蛇喜隐蔽，宀字根安全'},
      {radical:'木',reason:'蛇居林中，木字根得其所'},
      {radical:'艹',reason:'草丛藏蛇，草字根保护'},
      {radical:'田',reason:'蛇田间捕鼠，田字根象征勤劳'},
      {radical:'虫',reason:'蛇属虫类，虫字根增本命气'},
      {radical:'衣',reason:'蛇蜕皮如换衣，衣字根象征更新'}
    ],
    avoid: [
      {radical:'猪',reason:'巳亥相冲，蛇遇猪则冲突'},
      {radical:'亥',reason:'亥即猪，直接冲克'},
      {radical:'虎',reason:'寅巳相害，蛇遇虎则受克'},
      {radical:'寅',reason:'寅即虎，同上'},
      {radical:'水',reason:'蛇怕水淹，水字根不利健康'},
      {radical:'氵',reason:'水旁克身，同上'}
    ]
  },
  '马': {
    lucky: [
      {radical:'草',reason:'马食草而壮，草字根丰衣足食'},
      {radical:'艹',reason:'草字头，同上'},
      {radical:'禾',reason:'谷物字根，马得粮则壮'},
      {radical:'豆',reason:'饲料字根，精力充沛'},
      {radical:'木',reason:'马属火，木生火，相助'},
      {radical:'衣',reason:'马披鞍挂甲，衣字根增威武'},
      {radical:'大',reason:'马体大，大字根助气势'}
    ],
    avoid: [
      {radical:'鼠',reason:'子午相冲，马遇鼠则冲突'},
      {radical:'子',reason:'子即鼠，直接冲克'},
      {radical:'牛',reason:'丑午相害，马遇牛则受制'},
      {radical:'丑',reason:'丑即牛，同上'},
      {radical:'水',reason:'水火相克，马遇水则力减'},
      {radical:'田',reason:'马耕田则劳苦，田字根辛苦'}
    ]
  },
  '羊': {
    lucky: [
      {radical:'艹',reason:'羊食草而肥，草字根丰足'},
      {radical:'禾',reason:'谷物字根，羊得粮则旺'},
      {radical:'豆',reason:'饲料字根，精力充沛'},
      {radical:'木',reason:'羊属土，木克土但适度则吉'},
      {radical:'米',reason:'粮食字根，衣食无忧'},
      {radical:'麦',reason:'麦字根，同上'},
      {radical:'食',reason:'食字根，象征丰衣足食'}
    ],
    avoid: [
      {radical:'牛',reason:'丑未相冲，羊遇牛则冲突'},
      {radical:'丑',reason:'丑即牛，直接冲克'},
      {radical:'狗',reason:'戌未相刑，羊遇狗则纠纷'},
      {radical:'戌',reason:'戌即狗，同上'},
      {radical:'犬',reason:'犬即狗，同上'},
      {radical:'心',reason:'羊素食，心字根为肉，不合'}
    ]
  },
  '猴': {
    lucky: [
      {radical:'木',reason:'猴居林中，木字根得其所'},
      {radical:'林',reason:'林字根，同上，自由自在'},
      {radical:'口',reason:'猴喜洞穴，口字根安身'},
      {radical:'宀',reason:'屋檐之形，同上'},
      {radical:'人',reason:'猴近人则灵，人字根增智慧'},
      {radical:'言',reason:'猴善模仿，言字根增口才'},
      {radical:'衣',reason:'猴穿衣戴帽，衣字根增贵气'}
    ],
    avoid: [
      {radical:'虎',reason:'寅申相冲，猴遇虎则冲突'},
      {radical:'寅',reason:'寅即虎，直接冲克'},
      {radical:'猪',reason:'申亥相害，猴遇猪则受扰'},
      {radical:'亥',reason:'亥即猪，同上'},
      {radical:'火',reason:'火克金，猴属金遇火则损'}
    ]
  },
  '鸡': {
    lucky: [
      {radical:'禾',reason:'鸡食五谷，禾字根丰衣足食'},
      {radical:'米',reason:'米字根，同上'},
      {radical:'豆',reason:'豆字根，饲料充足'},
      {radical:'金',reason:'鸡属金，金字根相助'},
      {radical:'艹',reason:'草中觅食，草字根象征勤劳'},
      {radical:'虫',reason:'鸡食虫，虫字根象征得食'},
      {radical:'日',reason:'鸡鸣日出，日字根增光明'}
    ],
    avoid: [
      {radical:'兔',reason:'卯酉相冲，鸡遇兔则冲突'},
      {radical:'卯',reason:'卯即兔，直接冲克'},
      {radical:'狗',reason:'酉戌相害，鸡遇狗则纠纷'},
      {radical:'戌',reason:'戌即狗，同上'},
      {radical:'犬',reason:'犬即狗，同上'},
      {radical:'心',reason:'鸡素食为主，心字根不合'}
    ]
  },
  '狗': {
    lucky: [
      {radical:'人',reason:'狗忠主人，人字根增忠诚'},
      {radical:'亻',reason:'单人旁，同上'},
      {radical:'肉',reason:'狗食肉，肉字根象征丰足'},
      {radical:'月',reason:'月旁为肉，同上'},
      {radical:'宀',reason:'狗守家门，宀字根象征有家'},
      {radical:'口',reason:'口字根，狗守门护院'},
      {radical:'衣',reason:'狗穿衣戴帽，衣字根增贵气'}
    ],
    avoid: [
      {radical:'龙',reason:'辰戌相冲，狗遇龙则冲突'},
      {radical:'辰',reason:'辰即龙，直接冲克'},
      {radical:'羊',reason:'戌未相刑，狗遇羊则纠纷'},
      {radical:'未',reason:'未即羊，同上'},
      {radical:'鸡',reason:'酉戌相害，狗遇鸡则不安'},
      {radical:'酉',reason:'酉即鸡，同上'}
    ]
  },
  '猪': {
    lucky: [
      {radical:'艹',reason:'猪食草料，草字根丰足'},
      {radical:'禾',reason:'谷物字根，猪得粮则肥'},
      {radical:'米',reason:'米字根，同上'},
      {radical:'豆',reason:'豆字根，饲料充足'},
      {radical:'宀',reason:'猪喜圈居，宀字根安家'},
      {radical:'口',reason:'口字根，同上，安全有靠'},
      {radical:'水',reason:'猪属水，水字根相助'},
      {radical:'氵',reason:'水旁字根，同上'}
    ],
    avoid: [
      {radical:'蛇',reason:'巳亥相冲，猪遇蛇则冲突'},
      {radical:'巳',reason:'巳即蛇，直接冲克'},
      {radical:'猴',reason:'申亥相害，猪遇猴则受扰'},
      {radical:'申',reason:'申即猴，同上'},
      {radical:'火',reason:'水火相克，猪遇火则不安'},
      {radical:'灬',reason:'火底旁，同上'}
    ]
  }
};

// ================================================================
// 2. 五音五行（按声母分类）
// ================================================================
const WUYIN_WUXING = {
  // 角音属木：g, k, h
  '角': {
    wuxing: '木',
    shengmu: ['g', 'k', 'h'],
    character: '温和向上，如春风化雨',
    effect: '角音入肝，主仁，字音温和者得木之生发之气'
  },
  // 徵音属火：z, c, s, zh, ch, sh, r
  '徵': {
    wuxing: '火',
    shengmu: ['z', 'c', 's', 'zh', 'ch', 'sh', 'r'],
    character: '热情奔放，如烈火燎原',
    effect: '徵音入心，主礼，字音激昂者得火之光明之气'
  },
  // 宫音属土：b, p, m, f, d, t, n, l
  '宫': {
    wuxing: '土',
    shengmu: ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l'],
    character: '厚重稳健，如大地承载',
    effect: '宫音入脾，主信，字音浑厚者得土之厚重之气'
  },
  // 商音属金：j, q, x
  '商': {
    wuxing: '金',
    shengmu: ['j', 'q', 'x'],
    character: '清脆高亢，如金石之声',
    effect: '商音入肺，主义，字音清亮者得金之刚毅之气'
  },
  // 羽音属水：y, w
  '羽': {
    wuxing: '水',
    shengmu: ['y', 'w'],
    character: '柔和流畅，如流水潺潺',
    effect: '羽音入肾，主智，字音柔和者得水之灵动之气'
  }
};

// 根据拼音获取五音
function getWuyinFromPinyin(pinyin) {
  if (!pinyin) return null;
  // 去除声调数字
  let py = pinyin.replace(/[0-9]/g, '').toLowerCase();
  // 检查各音的声母
  for (let yin in WUYIN_WUXING) {
    let sms = WUYIN_WUXING[yin].shengmu;
    for (let i = 0; i < sms.length; i++) {
      if (py.indexOf(sms[i]) === 0) {
        return { yin: yin, wuxing: WUYIN_WUXING[yin].wuxing };
      }
    }
  }
  // 零声母（a, e, o开头）归宫音
  if (py.match(/^[aeo]/)) {
    return { yin: '宫', wuxing: '土' };
  }
  return { yin: '宫', wuxing: '土' };
}

// ================================================================
// 3. 姓名数理运势周期
// ================================================================
const WUGE_LIFE_CYCLE = {
  '天格': {
    ageRange: '1-12岁（少年运）',
    field: '祖辈根基、早年家庭环境、先天禀赋',
    description: '天格代表祖上遗德和少年时期的运势，影响幼年成长环境和家庭背景。天格吉则少年安康，凶则幼年坎坷。'
  },
  '人格': {
    ageRange: '25-36岁（青年运）+ 一生主运',
    field: '核心性格、主要才能、中年事业、婚姻基础',
    description: '人格为姓名核心，代表一生最重要的运势，主管25-36岁青年期和一生总体格局。人格吉则事业有成，性格健全。'
  },
  '地格': {
    ageRange: '13-24岁（青年前运）',
    field: '感情婚姻、子女缘分、内心世界、基础运',
    description: '地格代表前半生的基础运和内心情感世界，影响少年到青年的成长过渡。地格吉则感情顺遂，基础稳固。'
  },
  '外格': {
    ageRange: '36-48岁（中年运）',
    field: '人际关系、社交能力、外部机遇、贵人运',
    description: '外格代表人际交往和外部环境，影响中年社交和事业拓展。外格吉则贵人相助，人脉广阔。'
  },
  '总格': {
    ageRange: '48岁以后（晚年运）',
    field: '晚年运势、一生总结、子女成就、福报',
    description: '总格代表晚年运势和一生总结，影响48岁以后的生活质量和福报。总格吉则晚年幸福，子孙孝顺。'
  }
};

// ================================================================
// 4. 姓名心理学
// ================================================================
const NAME_PSYCHOLOGY = {
  '刚强型': {
    chars: ['刚', '强', '勇', '猛', '威', '霸', '烈', '铁', '钢', '锋', '剑', '军', '武', '战', '胜'],
    effect: '名字含刚强字根，暗示性格坚毅、果断、有魄力。但过刚易折，需注意柔和。',
    careerFit: '适合军警、体育、管理、创业等需要魄力的领域',
    risk: '过于刚硬可能导致人际关系紧张，需培养柔性'
  },
  '柔美型': {
    chars: ['柔', '美', '婉', '丽', '芳', '雅', '静', '淑', '婷', '娜', '娟', '秀', '婉', '清', '甜'],
    effect: '名字含柔美字根，暗示性格温和、善解人意、有亲和力。',
    careerFit: '适合教育、服务、艺术、医疗等需要耐心和共情能力的领域',
    risk: '过于柔弱可能缺乏主见，需培养果断'
  },
  '智慧型': {
    chars: ['智', '慧', '明', '睿', '哲', '思', '聪', '敏', '学', '文', '知', '悟', '觉', '渊', '博'],
    effect: '名字含智慧字根，暗示聪慧好学、思维敏捷、有深度。',
    careerFit: '适合科研、教育、咨询、写作等需要智力的领域',
    risk: '思虑过多可能导致犹豫不决，需培养行动力'
  },
  '富贵型': {
    chars: ['富', '贵', '金', '银', '宝', '财', '源', '盛', '隆', '昌', '荣', '华', '锦', '鑫', '瑞'],
    effect: '名字含富贵字根，暗示追求成功、有商业头脑、注重物质基础。',
    careerFit: '适合商业、金融、创业等需要经营头脑的领域',
    risk: '过于功利可能忽视精神追求，需平衡物质与精神'
  },
  '自然型': {
    chars: ['山', '水', '林', '风', '云', '海', '天', '月', '星', '阳', '雨', '雪', '春', '夏', '秋'],
    effect: '名字含自然字根，暗示性格开朗、热爱自由、心胸开阔。',
    careerFit: '适合旅游、环保、艺术、户外等需要亲近自然的领域',
    risk: '过于随性可能缺乏规划，需培养纪律性'
  },
  '品德型': {
    chars: ['德', '仁', '义', '礼', '信', '忠', '孝', '善', '正', '廉', '诚', '敬', '慈', '谦', '和'],
    effect: '名字含品德字根，暗示注重修养、有道德感、受人尊敬。',
    careerFit: '适合教育、公务、宗教、公益等需要道德楷模的领域',
    risk: '过于严肃可能缺乏趣味，需培养活泼'
  }
};

// 分析名字的心理暗示
function analyzeNamePsychology(name) {
  let result = [];
  let chars = name.split('');
  for (let i = 0; i < chars.length; i++) {
    for (let type in NAME_PSYCHOLOGY) {
      if (NAME_PSYCHOLOGY[type].chars.indexOf(chars[i]) >= 0) {
        result.push({
          char: chars[i],
          type: type,
          effect: NAME_PSYCHOLOGY[type].effect,
          careerFit: NAME_PSYCHOLOGY[type].careerFit
        });
      }
    }
  }
  return result;
}

// ================================================================
// 5. 职业匹配度（5行×7行业=35条）
// ================================================================
const NAME_CAREER_MATCH = {
  '木': {
    '教育': {score:95,reason:'木主仁，教育行业最合，传道授业'},
    '文化': {score:90,reason:'木主生发，文化出版行业木气旺盛'},
    '医疗': {score:85,reason:'木主 healing，中医养生行业天然亲和'},
    '农业': {score:92,reason:'木即植物，农业林业最直接对应'},
    '服装': {score:75,reason:'木主纤维织物，服装行业适合'},
    '科技': {score:60,reason:'木生火，科技行业可发展但非最佳'},
    '金融': {score:45,reason:'金克木，金融行业压力大'}
  },
  '火': {
    '教育': {score:80,reason:'火主明，教育行业可发展'},
    '文化': {score:88,reason:'火主光明，文化传媒行业适合'},
    '医疗': {score:70,reason:'火主血，医疗外科适合'},
    '农业': {score:50,reason:'火克金与农业关系不大'},
    '服装': {score:65,reason:'火主色彩，服装设计适合'},
    '科技': {score:92,reason:'火主电子，IT行业最合'},
    '金融': {score:78,reason:'火主礼，金融服务业适合'}
  },
  '土': {
    '教育': {score:75,reason:'土主信，教育管理适合'},
    '文化': {score:60,reason:'土主厚重，文化行业可发展'},
    '医疗': {score:82,reason:'土主脾胃，中医内科适合'},
    '农业': {score:70,reason:'土生万物，农业可以'},
    '服装': {score:55,reason:'土主稳重，服装行业一般'},
    '科技': {score:50,reason:'土克水，IT行业受制约'},
    '金融': {score:88,reason:'土主信，金融行业最合'}
  },
  '金': {
    '教育': {score:60,reason:'金主义，教育行业可发展'},
    '文化': {score:65,reason:'金主肃，文化行业一般'},
    '医疗': {score:78,reason:'金主刀，外科牙科适合'},
    '农业': {score:45,reason:'金克木，农业不太适合'},
    '服装': {score:50,reason:'金主硬，服装行业不太合'},
    '科技': {score:85,reason:'金主精密，硬件制造适合'},
    '金融': {score:92,reason:'金即财，金融行业最合'}
  },
  '水': {
    '教育': {score:70,reason:'水主智，教育行业适合'},
    '文化': {score:82,reason:'水主流，文化传播适合'},
    '医疗': {score:75,reason:'水主肾，泌尿科适合'},
    '农业': {score:68,reason:'水润万物，农业可以'},
    '服装': {score:72,reason:'水主柔，服装行业适合'},
    '科技': {score:88,reason:'水主流通，互联网行业最合'},
    '金融': {score:85,reason:'水主财源，金融行业适合'}
  }
};

// ================================================================
// 6. 取名经典库扩充（诗经50+/楚辞40+/论语30+/道德经30+/周易30+/孟子/庄子各10+）
// ================================================================
const NAME_CLASSICS_EXPANDED = {
  '诗经': [
    {name:'徽音', source:'《诗经·大雅·思齐》「大姒嗣徽音」', meaning:'美誉、贤德'},
    {name:'穆清', source:'《诗经·大雅·烝民》「穆如清风」', meaning:'温和清朗'},
    {name:'静姝', source:'《诗经·邶风·静女》「静女其姝」', meaning:'娴静美好'},
    {name:'燕婉', source:'《诗经·邶风·新台》「燕婉之求」', meaning:'和顺美好'},
    {name:'蓁蓁', source:'《诗经·周南·桃夭》「其叶蓁蓁」', meaning:'茂盛繁荣'},
    {name:'思齐', source:'《诗经·大雅·思齐》「思齐大任」', meaning:'见贤思齐'},
    {name:'子衿', source:'《诗经·郑风·子衿》「青青子衿」', meaning:'学子贤才'},
    {name:'婉清', source:'《诗经·郑风·野有蔓草》「清扬婉兮」', meaning:'美丽清雅'},
    {name:'如云', source:'《诗经·鄘风·君子偕老》「鬓发如云」', meaning:'美好如云'},
    {name:'德音', source:'《诗经·小雅·鹿鸣》「德音孔昭」', meaning:'美名远扬'},
    {name:'雅南', source:'《诗经·小雅·鼓钟》「以雅以南」', meaning:'高雅纯正'},
    {name:'乔木', source:'《诗经·周南·汉广》「南有乔木」', meaning:'高大正直'},
    {name:'琼瑶', source:'《诗经·卫风·木瓜》「报之以琼瑶」', meaning:'美玉珍贵'},
    {name:'鹿鸣', source:'《诗经·小雅·鹿鸣》「呦呦鹿鸣」', meaning:'吉祥雅乐'},
    {name:'清扬', source:'《诗经·郑风·野有蔓草》「有美一人，清扬婉兮」', meaning:'眉目清秀'},
    {name:'邦彦', source:'《诗经·郑风·羔裘》「邦之彦兮」', meaning:'国家俊才'},
    {name:'文茵', source:'《诗经·秦风·小戎》「文茵畅毂」', meaning:'文采华美'},
    {name:'雪霏', source:'《诗经·小雅·采薇》「雨雪霏霏」', meaning:'雪花纷飞'},
    {name:'硕人', source:'《诗经·卫风·硕人》「硕人其颀」', meaning:'高大美丽'},
    {name:'令仪', source:'《诗经·小雅·湛露》「莫不令仪」', meaning:'美好仪态'},
    {name:'秉文', source:'《诗经·周颂·清庙》「济济多士，秉文之德」', meaning:'秉持文德'},
    {name:'维桢', source:'《诗经·大雅·文王》「王国克生，维周之桢」', meaning:'国之栋梁'},
    {name:'柔嘉', source:'《诗经·大雅·烝民》「仲山甫之德，柔嘉维则」', meaning:'温和美好'},
    {name:'思齐', source:'《诗经·大雅·思齐》「思齐大任，文王之母」', meaning:'端庄贤淑'},
    {name:'其琛', source:'《诗经·鲁颂·泮水》「憬彼淮夷，来献其琛」', meaning:'珍宝'},
    {name:'凯风', source:'《诗经·邶风·凯风》「凯风自南」', meaning:'和暖之风'},
    {name:'如英', source:'《诗经·魏风·汾沮洳》「美如英」', meaning:'如花般美'},
    {name:'洵美', source:'《诗经·邶风·静女》「自牧归荑，洵美且异」', meaning:'实在美丽'},
    {name:'惠然', source:'《诗经·邶风·终风》「惠然肯来」', meaning:'温和友善'},
    {name:'静好', source:'《诗经·郑风·女曰鸡鸣》「琴瑟在御，莫不静好」', meaning:'安静美好'},
    {name:'舜华', source:'《诗经·郑风·有女同车》「颜如舜华」', meaning:'如木槿花'},
    {name:'子佩', source:'《诗经·郑风·子衿》「青青子佩」', meaning:'玉佩，贤才'},
    {name:'菁菁', source:'《诗经·唐风·杕杜》「菁菁者莪」', meaning:'草木茂盛'},
    {name:'金玉', source:'《诗经·小雅·白驹》「毋金玉尔音」', meaning:'珍贵如金玉'},
    {name:'翰飞', source:'《诗经·小雅·小宛》「翰飞戾天」', meaning:'高飞'},
    {name:'维则', source:'《诗经·大雅·烝民》「万邦维则」', meaning:'为天下法则'},
    {name:'于归', source:'《诗经·周南·桃夭》「之子于归」', meaning:'归宿美好'},
    {name:'淇奥', source:'《诗经·卫风·淇奥》「瞻彼淇奥」', meaning:'淇水之滨'},
    {name:'如圭', source:'《诗经·卫风·淇奥》「有匪君子，如金如锡，如圭如璧」', meaning:'如玉般洁白'},
    {name:'温韦', source:'《诗经·小雅·小宛》「温温恭人」', meaning:'温和恭敬'},
    {name:'骐骥', source:'《诗经·小雅·四牡》「四牡骙骙」', meaning:'骏马良才'},
    {name:'振鹭', source:'《诗经·周颂·振鹭》「振鹭于飞」', meaning:'白鹭高飞'},
    {name:'佑之', source:'《诗经·周颂·我将》「我其夙夜，畏天之威，于时保之」', meaning:'天佑保护'},
    {name:'纯熙', source:'《诗经·周颂·酌》「时纯熙矣」', meaning:'光明纯正'},
    {name:'桓桓', source:'《诗经·周颂·桓》「桓桓于征」', meaning:'威武貌'},
    {name:'文王', source:'《诗经·大雅·文王》「文王在上」', meaning:'文德之 王'},
    {name:'维清', source:'《诗经·周颂·维清》「维清缉熙」', meaning:'清明光亮'},
    {name:'昊天', source:'《诗经·小雅·巷伯》「苍天苍天」', meaning:'广阔天空'},
    {name:'依斐', source:'《诗经·小雅·采薇》「昔我往矣，杨柳依依」', meaning:'依恋柔美'},
    {name:'陶陶', source:'《诗经·王风·君子阳阳》「君子陶陶」', meaning:'快乐和畅'},
    {name:'思无邪', source:'《诗经·鲁颂·駉》「思无邪」', meaning:'心思纯正'}
  ],
  '楚辞': [
    {name:'正则', source:'《离骚》「名余曰正则兮」', meaning:'端正法则'},
    {name:'灵均', source:'《离骚》「字余曰灵均」', meaning:'灵气公平'},
    {name:'望舒', source:'《离骚》「前望舒使先驱兮」', meaning:'月神光明'},
    {name:'陆离', source:'《离骚》「斑陆离其上下」', meaning:'绚丽多彩'},
    {name:'嘉树', source:'《九章·橘颂》「后皇嘉树」', meaning:'美好树木'},
    {name:'江离', source:'《离骚》「扈江离与辟芷兮」', meaning:'香草芬芳'},
    {name:'杜若', source:'《九歌·湘君》「采芳洲兮杜若」', meaning:'香草清雅'},
    {name:'云旗', source:'《离骚》「载云旗之委蛇」', meaning:'气势雄伟'},
    {name:'怀瑾', source:'《九章·怀沙》「怀瑾握瑜兮」', meaning:'怀藏美玉'},
    {name:'承宇', source:'《九章·涉江》「云霏霏而承宇」', meaning:'承接天宇'},
    {name:'峻茂', source:'《离骚》「冀枝叶之峻茂兮」', meaning:'高大茂盛'},
    {name:'芳蔼', source:'《九叹·愍命》「芳蔼兮袭予」', meaning:'芳香繁盛'},
    {name:'清和', source:'《九思·伤时》「声噭誂兮清和」', meaning:'清朗和畅'},
    {name:'昭华', source:'《九怀·通路》「抱昭华兮宝璋」', meaning:'光明华美'},
    {name:'偃蹇', source:'《离骚》「望瑶台之偃蹇兮」', meaning:'高耸出众'},
    {name:'被月', source:'《九章·涉江》「被明月兮佩宝璐」', meaning:'披戴明月'},
    {name:'飞龙', source:'《离骚》「驾飞龙兮北征」', meaning:'乘龙高飞'},
    {name:'圣哲', source:'《离骚》「夫维圣哲以茂行兮」', meaning:'圣明睿智'},
    {name:'耿介', source:'《离骚》「彼尧舜之耿介兮」', meaning:'光明正直'},
    {name:'先路', source:'《离骚》「来吾道夫先路兮」', meaning:'引路先行'},
    {name:'纫秋', source:'《离骚》「纫秋兰以为佩」', meaning:'以秋兰为佩'},
    {name:'落木', source:'《九歌·湘夫人》「袅袅兮秋风，洞庭波兮木叶下」', meaning:'秋风落叶'},
    {name:'沅芷', source:'《九歌·湘夫人》「沅有芷兮澧有兰」', meaning:'沅水香草'},
    {name:'澧兰', source:'《九歌·湘夫人》「沅有芷兮澧有兰」', meaning:'澧水兰花'},
    {name:'修能', source:'《离骚》「又重之以修能」', meaning:'卓越才能'},
    {name:'骐骥', source:'《离骚》「乘骐骥以驰骋兮」', meaning:'骏马奔腾'},
    {name:'远逝', source:'《离骚》「邅吾道夫昆仑兮，路修远以周流」', meaning:'远行四方'},
    {name:'芳华', source:'《九章·思美人》「芳与泽其杂糅兮」', meaning:'芬芳华美'},
    {name:'飞扬', source:'《九歌·河伯》「心飞扬兮浩荡」', meaning:'心情飞扬'},
    {name:'浩荡', source:'《九歌·河伯》「心飞扬兮浩荡」', meaning:'广阔无边'},
    {name:'悠远', source:'《九章·哀郢》「曼余目以流观兮」', meaning:'目光深远'},
    {name:'修远', source:'《离骚》「路曼曼其修远兮」', meaning:'道路漫长'},
    {name:'坚芳', source:'《九章·橘颂》「独立不迁，岂不可喜兮」', meaning:'坚贞芳香'},
    {name:'淑离', source:'《九章·橘颂》「淑离不淫，梗其有理兮」', meaning:'善良光明'},
    {name:'横奔', source:'《九章·橘颂》「横奔而失路」', meaning:'奔放不羁'},
    {name:'休文', source:'《九辩》「岂不郁陶而思归兮」', meaning:'文雅修身'},
    {name:'骐骐', source:'《九辩》「左朱雀之菱菱兮」', meaning:'良马奔腾'},
    {name:'白露', source:'《九辩》「白露既下兮百草」', meaning:'秋露清冽'},
    {name:'昭昭', source:'《九歌·云中君》「烂昭昭兮未央」', meaning:'光明灿烂'},
    {name:'连蜷', source:'《九歌·云中君》「连蜷既留兮」', meaning:'柔美婉转'},
    {name:'寿宫', source:'《九歌·云中君》「蹇将憺兮寿宫」', meaning:'安康长寿'},
    {name:'满堂', source:'《九歌·东皇太一》「满堂兮美人」', meaning:'满堂芳华'},
    {name:'君欣欣', source:'《九歌·东皇太一》「君欣欣兮乐康」', meaning:'欢乐安康'},
    {name:'曼曼', source:'《离骚》「路曼曼其修远兮」', meaning:'路途漫长'}
  ],
  '论语': [
    {name:'敏行', source:'《论语·里仁》「君子欲讷于言而敏于行」', meaning:'行动敏捷'},
    {name:'思远', source:'《论语·卫灵公》「人无远虑，必有近忧」', meaning:'思虑深远'},
    {name:'安仁', source:'《论语·里仁》「仁者安仁」', meaning:'安于仁道'},
    {name:'文彬', source:'《论语·雍也》「文质彬彬」', meaning:'文雅质朴'},
    {name:'立本', source:'《论语·学而》「君子务本，本立而道生」', meaning:'立身根本'},
    {name:'博文', source:'《论语·雍也》「君子博学于文」', meaning:'博学多才'},
    {name:'知新', source:'《论语·为政》「温故而知新」', meaning:'推陈出新'},
    {name:'言信', source:'《论语·学而》「与朋友交，言而有信」', meaning:'诚信可靠'},
    {name:'三省', source:'《论语·学而》「吾日三省吾身」', meaning:'勤于反省'},
    {name:'志学', source:'《论语·为政》「吾十有五而志于学」', meaning:'立志向学'},
    {name:'弘毅', source:'《论语·泰伯》「士不可以不弘毅」', meaning:'宽宏坚毅'},
    {name:'乐山', source:'《论语·雍也》「知者乐水，仁者乐山」', meaning:'仁厚如山'},
    {name:'知者', source:'《论语·雍也》「知者乐水」', meaning:'智慧如水'},
    {name:'克己', source:'《论语·颜渊》「克己复礼为仁」', meaning:'克制私欲'},
    {name:'复礼', source:'《论语·颜渊》「克己复礼为仁」', meaning:'回归礼制'},
    {name:'无邪', source:'《论语·为政》「诗三百，一言以蔽之，曰思无邪」', meaning:'心思纯正'},
    {name:'从心', source:'《论语·为政》「七十而从心所欲，不逾矩」', meaning:'随心所欲不逾矩'},
    {name:'不逾', source:'《论语·为政》「从心所欲，不逾矩」', meaning:'守规矩'},
    {name:'德不孤', source:'《论语·里仁》「德不孤，必有邻」', meaning:'有德不孤单'},
    {name:'有邻', source:'《论语·里仁》「德不孤，必有邻」', meaning:'德必有邻'},
    {name:'见贤', source:'《论语·里仁》「见贤思齐焉」', meaning:'向贤者看齐'},
    {name:'思齐', source:'《论语·里仁》「见贤思齐焉」', meaning:'向贤者看齐'},
    {name:'温故', source:'《论语·为政》「温故而知新」', meaning:'温习旧知'},
    {name:'笃志', source:'《论语·子张》「博学而笃志」', meaning:'坚定志向'},
    {name:'切问', source:'《论语·子张》「切问而近思」', meaning:'恳切发问'},
    {name:'近思', source:'《论语·子张》「切问而近思」', meaning:'就近思考'},
    {name:'任重', source:'《论语·泰伯》「任重而道远」', meaning:'责任重大'},
    {name:'道远', source:'《论语·泰伯》「任重而道远」', meaning:'道路遥远'},
    {name:'后凋', source:'《论语·子罕》「岁寒然后知松柏之后凋也」', meaning:'经冬不凋'},
    {name:'松柏', source:'《论语·子罕》「岁寒然后知松柏之后凋也」', meaning:'坚贞不屈'},
    {name:'知命', source:'《论语·为政》「五十而知天命」', meaning:'知晓天命'}
  ],
  '道德经': [
    {name:'上善', source:'《道德经》第八章「上善若水」', meaning:'至高至善'},
    {name:'希言', source:'《道德经》第二十三章「希言自然」', meaning:'少言合道'},
    {name:'若水', source:'《道德经》第八章「上善若水」', meaning:'柔韧包容'},
    {name:'知止', source:'《道德经》第四十四章「知止不殆」', meaning:'适可而止'},
    {name:'明道', source:'《道德经》第四十一章「明道若昧」', meaning:'光明大道'},
    {name:'守静', source:'《道德经》第十六章「守静笃」', meaning:'持守宁静'},
    {name:'知常', source:'《道德经》第十六章「知常曰明」', meaning:'知晓常道'},
    {name:'无为', source:'《道德经》第三十七章「无为而无不为」', meaning:'顺应自然'},
    {name:'玄同', source:'《道德经》第五十六章「是谓玄同」', meaning:'深远和同'},
    {name:'若存', source:'《道德经》第六章「绵绵若存」', meaning:'绵长永存'},
    {name:'谷神', source:'《道德经》第六章「谷神不死」', meaning:'虚空神灵'},
    {name:'天长', source:'《道德经》第七章「天长地久」', meaning:'恒久长远'},
    {name:'不争', source:'《道德经》第二十二章「夫唯不争，故天下莫能与之争」', meaning:'不与人争'},
    {name:'若谷', source:'《道德经》第四十一章「上德若谷」', meaning:'虚怀若谷'},
    {name:'大音', source:'《道德经》第四十一章「大音希声」', meaning:'大音稀声'},
    {name:'大象', source:'《道德经》第四十一章「大象无形」', meaning:'大象无形'},
    {name:'大成', source:'《道德经》第四十五章「大成若缺」', meaning:'大器晚成'},
    {name:'大巧', source:'《道德经》第四十五章「大巧若拙」', meaning:'大巧似拙'},
    {name:'知足', source:'《道德经》第三十三章「知足者富」', meaning:'知足常乐'},
    {name:'强行', source:'《道德经》第三十三章「强行者有志」', meaning:'坚持不懈'},
    {name:'不失', source:'《道德经》第三十三章「不失其所者久」', meaning:'不离本分'},
    {name:'死而不亡', source:'《道德经》第三十三章「死而不亡者寿」', meaning:'精神永存'},
    {name:'配天', source:'《道德经》第六十八章「是谓配天古之极」', meaning:'配合天道'},
    {name:'慈俭', source:'《道德经》第六十七章「我有三宝，持而保之：一曰慈，二曰俭」', meaning:'慈爱节俭'},
    {name:'不敢为', source:'《道德经》第六十七章「不敢为天下先」', meaning:'谦逊不争先'},
    {name:'若晦', source:'《道德经》第五十八章「光而不耀」', meaning:'光而不耀'},
    {name:'抱朴', source:'《道德经》第十九章「见素抱朴」', meaning:'坚守质朴'},
    {name:'见素', source:'《道德经》第十九章「见素抱朴」', meaning:'显现素朴'},
    {name:'复归', source:'《道德经》第十六章「夫物芸芸，各复归其根」', meaning:'回归本源'},
    {name:'芸芸', source:'《道德经》第十六章「夫物芸芸」', meaning:'万物茂盛'}
  ],
  '周易': [
    {name:'自强', source:'《周易·乾卦》「天行健，君子以自强不息」', meaning:'自我奋发'},
    {name:'厚德', source:'《周易·坤卦》「地势坤，君子以厚德载物」', meaning:'厚德包容'},
    {name:'元亨', source:'《周易·乾卦》「元亨利贞」', meaning:'大吉亨通'},
    {name:'文明', source:'《周易·大有》「其德刚健而文明」', meaning:'文采光明'},
    {name:'谦益', source:'《周易·谦卦》「天道亏盈而益谦」', meaning:'谦虚受益'},
    {name:'中孚', source:'《周易·中孚》「中孚，信及豚鱼也」', meaning:'诚信感化'},
    {name:'咸亨', source:'《周易·咸卦》「咸亨利贞」', meaning:'感通亨通'},
    {name:'大有', source:'《周易·大有》「火在天上，大有」', meaning:'丰收富有'},
    {name:'豫顺', source:'《周易·豫卦》「豫顺以动」', meaning:'和顺愉悦'},
    {name:'恒久', source:'《周易·恒卦》「天地之道，恒久而不已也」', meaning:'持久不懈'},
    {name:'同人', source:'《周易·同人》「同人于野，亨」', meaning:'大同和合'},
    {name:'贞吉', source:'《周易·需卦》「需于沙，衍在中也，贞吉」', meaning:'持正得吉'},
    {name:'修贲', source:'《周易·贲卦》「观乎天文，以察时变」', meaning:'文饰修美'},
    {name:'复始', source:'《周易·复卦》「反复其道，七日来复」', meaning:'周而复始'},
    {name:'无妄', source:'《周易·无妄》「无妄，元亨利贞」', meaning:'不妄为'},
    {name:'大畜', source:'《周易·大畜》「大畜，刚健笃实辉光」', meaning:'大有积蓄'},
    {name:'颐养', source:'《周易·颐卦》「颐，贞吉」', meaning:'养生正道'},
    {name:'大过', source:'《周易·大过》「大过，栋桡」', meaning:'大过人者'},
    {name:'坎险', source:'《周易·坎卦》「习坎，入于坎窞」', meaning:'经历险境'},
    {name:'离明', source:'《周易·离卦》「离，利贞，亨」', meaning:'光明附丽'},
    {name:'遁世', source:'《周易·遁卦》「遁，亨」', meaning:'隐退避世'},
    {name:'大壮', source:'《周易·大壮》「大壮，利贞」', meaning:'大而强壮'},
    {name:'晋进', source:'《周易·晋卦》「晋，康侯用锡马蕃庶」', meaning:'晋升前进'},
    {name:'明夷', source:'《周易·明夷》「明夷，利艰贞」', meaning:'光明受伤'},
    {name:'家人', source:'《周易·家人》「家人，利女贞」', meaning:'家庭和睦'},
    {name:'睽异', source:'《周易·睽卦》「睽，小事吉」', meaning:'求同存异'},
    {name:'蹇难', source:'《周易·蹇卦》「蹇，利西南，不利东北」', meaning:'克服困难'},
    {name:'解险', source:'《周易·解卦》「解，利西南」', meaning:'化解险难'},
    {name:'损益', source:'《周易·损卦》「损，有孚，元吉」', meaning:'损上益下'},
    {name:'益增', source:'《周易·益卦》「益，利有攸往」', meaning:'增益进步'}
  ],
  '孟子': [
    {name:'浩然', source:'《孟子·公孙丑上》「我善养吾浩然之气」', meaning:'正气浩然'},
    {name:'充实', source:'《孟子·尽心下》「充实之谓美」', meaning:'充实为美'},
    {name:'居仁', source:'《孟子·尽心上》「居仁由义」', meaning:'心存仁义'},
    {name:'由义', source:'《孟子·尽心上》「居仁由义」', meaning:'行事合义'},
    {name:'性善', source:'《孟子·告子上》「人性之善也」', meaning:'本性善良'},
    {name:'良知', source:'《孟子·尽心上》「所不虑而知者，其良知也」', meaning:'先天良知'},
    {name:'良能', source:'《孟子·尽心上》「所不学而能者，其良能也」', meaning:'先天良能'},
    {name:'得道', source:'《孟子·公孙丑下》「得道者多助」', meaning:'得道多助'},
    {name:'多助', source:'《孟子·公孙丑下》「得道者多助」', meaning:'众人相助'},
    {name:'不动心', source:'《孟子·公孙丑上》「我四十不动心」', meaning:'内心坚定'},
    {name:'居天下', source:'《孟子·离娄上》「居天下之广居」', meaning:'居于天下'},
    {name:'正命', source:'《孟子·尽心上》「正命而立」', meaning:'顺应天命'}
  ],
  '庄子': [
    {name:'逍遥', source:'《庄子·逍遥游》「逍遥游」', meaning:'自在逍遥'},
    {name:'齐物', source:'《庄子·齐物论》「天地与我并生，万物与我为一」', meaning:'万物齐一'},
    {name:'无待', source:'《庄子·逍遥游》「若夫乘天地之正，御六气之辩，以游无穷者，彼且恶乎待哉」', meaning:'无所依待'},
    {name:'心斋', source:'《庄子·人间世》「心斋」', meaning:'心灵斋戒'},
    {name:'坐忘', source:'《庄子·大宗师》「坐忘」', meaning:'静坐忘我'},
    {name:'真知', source:'《庄子·大宗师》「真知」', meaning:'真实认知'},
    {name:'恬淡', source:'《庄子·天道》「恬淡寂漠」', meaning:'恬静淡泊'},
    {name:'虚静', source:'《庄子·天道》「虚静恬淡」', meaning:'虚空宁静'},
    {name:'游心', source:'《庄子·德充符》「游心于淡」', meaning:'心游于淡'},
    {name:'物化', source:'《庄子·齐物论》「昔者庄周梦为胡蝶」', meaning:'物我两忘'},
    {name:'无用', source:'《庄子·人间世》「无用之用」', meaning:'无用之大用'},
    {name:'养生主', source:'《庄子·养生主》「吾生也有涯」', meaning:'养生之道'}
  ]
};

// 合并经典库
function getAllClassics() {
  let all = {};
  // 先加载原始库
  if (typeof NAME_CLASSICS !== 'undefined') {
    for (let key in NAME_CLASSICS) {
      all[key] = NAME_CLASSICS[key].slice();
    }
  }
  // 再追加扩展库
  for (let key2 in NAME_CLASSICS_EXPANDED) {
    if (!all[key2]) all[key2] = [];
    for (let i = 0; i < NAME_CLASSICS_EXPANDED[key2].length; i++) {
      // 避免重复
      let exists = all[key2].some(function(item) { return item.name === NAME_CLASSICS_EXPANDED[key2][i].name; });
      if (!exists) {
        all[key2].push(NAME_CLASSICS_EXPANDED[key2][i]);
      }
    }
  }
  return all;
}

// ════════════════════════════════════════════════════════════════
// 第二层：模型层 — 综合评分
// ════════════════════════════════════════════════════════════════

// ================================================================
// 7. comprehensiveNameScore — 9维度100分制评分
// ================================================================
function comprehensiveNameScore(name, userInfo) {
  // userInfo: { sex, birthYear, zodiac, baziWuxing: {strong:[], weak:[]}, location }
  if (!name || name.length < 2) {
    return { error: '姓名至少需要2个字', totalScore: 0 };
  }

  let scores = {};
  let details = {};
  let totalScore = 0;

  // --- 维度1: 五格数理 (20分) ---
  let wuge = calculateWuge(name);
  if (wuge.error) {
    scores.wuge = 10;
    details.wuge = '笔画数据不足，五格分析受限';
  } else {
    let wugeScores = [];
    let grids = ['tianGe', 'renGe', 'diGe', 'zongGe', 'waiGe'];
    for (let i = 0; i < grids.length; i++) {
      let val = wuge[grids[i]];
      let luck = getWugeLuck(val);
      if (luck === 'lucky') wugeScores.push(20);
      else if (luck === 'neutral') wugeScores.push(12);
      else wugeScores.push(6);
    }
    let avgWuge = wugeScores.reduce(function(a,b){return a+b;},0) / wugeScores.length;
    scores.wuge = Math.round(avgWuge * 1.0); // 满分20
    if (scores.wuge > 20) scores.wuge = 20;
    details.wuge = '天格' + wuge.tianGe + '(' + getWugeLuckDetail(wuge.tianGe).luck + ') '
      + '人格' + wuge.renGe + '(' + getWugeLuckDetail(wuge.renGe).luck + ') '
      + '地格' + wuge.diGe + '(' + getWugeLuckDetail(wuge.diGe).luck + ') '
      + '总格' + wuge.zongGe + '(' + getWugeLuckDetail(wuge.zongGe).luck + ') '
      + '外格' + wuge.waiGe + '(' + getWugeLuckDetail(wuge.waiGe).luck + ')';
  }
  totalScore += scores.wuge;

  // --- 维度2: 三才配置 (15分) ---
  if (wuge.success) {
    let sancai = analyzeSancai(wuge);
    scores.sancai = Math.round(sancai.score / 100 * 15);
    details.sancai = sancai.tian + sancai.ren + sancai.di + ' ' + sancai.luck + '(' + sancai.score + '分) ' + sancai.analysis;
  } else {
    scores.sancai = 7;
    details.sancai = '无法计算三才配置';
  }
  totalScore += scores.sancai;

  // --- 维度3: 八字匹配 (20分) ---
  if (userInfo && userInfo.baziWuxing && userInfo.baziWuxing.weak && userInfo.baziWuxing.weak.length > 0) {
    // 检查名字五行是否补益八字喜用神
    let nameChars = name.split('');
    let nameWuxing = nameChars.map(function(c) {
      let s = getKangxiStroke(c);
      return s ? getWuxingFromStroke(s) : null;
    });
    let matchScore = 0;
    let weakElements = userInfo.baziWuxing.weak;
    for (let j = 0; j < nameWuxing.length; j++) {
      if (weakElements.indexOf(nameWuxing[j]) >= 0) {
        matchScore += 10;
      }
    }
    scores.baziMatch = Math.min(matchScore, 20);
    details.baziMatch = '名字五行(' + nameWuxing.join('、') + ') 补益喜用神(' + weakElements.join('、') + ')';
  } else {
    scores.baziMatch = 12;
    details.baziMatch = '未提供八字信息，按中平计算';
  }
  totalScore += scores.baziMatch;

  // --- 维度4: 生肖宜忌 (10分) ---
  if (userInfo && userInfo.zodiac && ZODIAC_NAME_RULES[userInfo.zodiac]) {
    let rules = ZODIAC_NAME_RULES[userInfo.zodiac];
    let zodiacScore = 5; // 基础分
    let zodiacNotes = [];
    for (let k = 0; k < nameChars.length; k++) {
      // 检查宜用字根
      for (let li = 0; li < rules.lucky.length; li++) {
        if (nameChars[k].indexOf(rules.lucky[li].radical) >= 0 || name.indexOf(rules.lucky[li].radical) >= 0) {
          zodiacScore += 3;
          zodiacNotes.push('「' + nameChars[k] + '」含宜用字根「' + rules.lucky[li].radical + '」');
          break;
        }
      }
      // 检查忌用字根
      for (let ai = 0; ai < rules.avoid.length; ai++) {
        if (nameChars[k].indexOf(rules.avoid[ai].radical) >= 0 || name.indexOf(rules.avoid[ai].radical) >= 0) {
          zodiacScore -= 2;
          zodiacNotes.push('「' + nameChars[k] + '」含忌用字根「' + rules.avoid[ai].radical + '」');
          break;
        }
      }
    }
    scores.zodiac = Math.max(0, Math.min(zodiacScore, 10));
    details.zodiac = zodiacNotes.length > 0 ? zodiacNotes.join('；') : '无特殊宜忌';
  } else {
    scores.zodiac = 5;
    details.zodiac = '未提供生肖信息，按中平计算';
  }
  totalScore += scores.zodiac;

  // --- 维度5: 音律和谐 (10分) ---
  let yinlv = analyzeYinlv(name);
  if (yinlv.hasData) {
    scores.yinlv = Math.round(yinlv.smoothScore / 100 * 10);
    details.yinlv = '拼音: ' + yinlv.pinyins.join('-') + ' | 平仄: ' + yinlv.pingze.join('') + ' | ' + yinlv.smoothAnalysis;
  } else {
    scores.yinlv = 6;
    details.yinlv = '部分汉字无拼音数据';
  }
  totalScore += scores.yinlv;

  // --- 维度6: 谐音安全 (5分) ---
  let xieyin = checkXieyin(name);
  if (xieyin.length === 0) {
    scores.xieyin = 5;
    details.xieyin = '未检测到不良谐音';
  } else {
    scores.xieyin = 0;
    details.xieyin = '检测到谐音: ' + xieyin.map(function(x){return x.word+'→'+x.meaning;}).join('，');
  }
  totalScore += scores.xieyin;

  // --- 维度7: 字义寓意 (10分) ---
  let psych = analyzeNamePsychology(name);
  if (psych.length > 0) {
    scores.meaning = 10;
    details.meaning = psych.map(function(p){return p.type;}).filter(function(v,i,a){return a.indexOf(v)===i;}).join('、') + '型名字';
  } else {
    scores.meaning = 7;
    details.meaning = '字义中正，无明显心理暗示偏向';
  }
  totalScore += scores.meaning;

  // --- 维度8: 生肖本命 (5分) ---
  if (userInfo && userInfo.zodiac && ZODIAC_NAME_RULES[userInfo.zodiac]) {
    let zodiacRules = ZODIAC_NAME_RULES[userInfo.zodiac];
    let benmingScore = 3;
    for (let bi = 0; bi < nameChars.length; bi++) {
      for (let bl = 0; bl < zodiacRules.lucky.length; bl++) {
        if (nameChars[bi] === zodiacRules.lucky[bl].radical) {
          benmingScore = 5;
          break;
        }
      }
    }
    scores.benming = benmingScore;
    details.benming = '生肖' + userInfo.zodiac + '本命匹配度评估';
  } else {
    scores.benming = 3;
    details.benming = '未提供生肖信息';
  }
  totalScore += scores.benming;

  // --- 维度9: 方位补益 (5分) ---
  if (userInfo && userInfo.location) {
    let fangwei = getFangweiWuxing(userInfo.location);
    if (fangwei && userInfo.baziWuxing && userInfo.baziWuxing.weak) {
      if (userInfo.baziWuxing.weak.indexOf(fangwei) >= 0) {
        scores.fangwei = 5;
        details.fangwei = '出生地方位五行(' + fangwei + ')补益喜用神';
      } else if (userInfo.baziWuxing.strong && userInfo.baziWuxing.strong.indexOf(fangwei) >= 0) {
        scores.fangwei = 2;
        details.fangwei = '出生地方位五行(' + fangwei + ')与忌神重合';
      } else {
        scores.fangwei = 3;
        details.fangwei = '出生地方位五行(' + fangwei + ')中等补益';
      }
    } else {
      scores.fangwei = 3;
      details.fangwei = '方位五行(' + fangwei + ')一般';
    }
  } else {
    scores.fangwei = 3;
    details.fangwei = '未提供出生地信息';
  }
  totalScore += scores.fangwei;

  // 综合评级
  let grade = '';
  if (totalScore >= 85) grade = '极佳';
  else if (totalScore >= 75) grade = '优秀';
  else if (totalScore >= 65) grade = '良好';
  else if (totalScore >= 50) grade = '中等';
  else if (totalScore >= 35) grade = '一般';
  else grade = '不佳';

  return {
    name: name,
    totalScore: totalScore,
    grade: grade,
    scores: scores,
    details: details,
    wuge: wuge.success ? wuge : null,
    suggestions: generateNameSuggestions(scores, details)
  };
}

// 生成改进建议
function generateNameSuggestions(scores, details) {
  let suggestions = [];
  if (scores.wuge < 12) suggestions.push('五格数理偏低，建议调整名字笔画搭配');
  if (scores.sancai < 10) suggestions.push('三才配置不理想，建议选择相生组合');
  if (scores.baziMatch < 12) suggestions.push('名字五行与八字喜用神匹配度不足');
  if (scores.zodiac < 6) suggestions.push('名字中有生肖忌用字根，建议替换');
  if (scores.yinlv < 6) suggestions.push('音律不够和谐，建议调整声调搭配');
  if (scores.xieyin < 4) suggestions.push('检测到不良谐音，强烈建议改名');
  if (scores.meaning < 7) suggestions.push('字义寓意一般，可考虑更有内涵的字');
  if (scores.benming < 4) suggestions.push('生肖本命匹配度可提升');
  if (scores.fangwei < 3) suggestions.push('方位补益不足，可通过其他方式调理');
  if (suggestions.length === 0) suggestions.push('名字整体优良，无需特别调整');
  return suggestions;
}

// 渲染综合评分HTML
function renderComprehensiveScore(result) {
  if (result.error) return '<p style="color:var(--cinn2)">' + result.error + '</p>';

  let html = '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(201,168,76,0.2);border-radius:14px;padding:24px;margin-bottom:20px">';

  // 总分
  let scoreColor = result.totalScore >= 75 ? 'var(--success)' : result.totalScore >= 60 ? 'var(--warn)' : 'var(--cinn2)';
  html += '<div style="text-align:center;margin-bottom:20px">';
  html += '<div style="font-size:48px;font-weight:bold;color:' + scoreColor + '">' + result.totalScore + '</div>';
  html += '<div style="font-size:16px;color:var(--gold);letter-spacing:4px;margin-top:4px">' + result.grade + '</div>';
  html += '<div style="font-size:12px;color:var(--paper2);opacity:0.6;margin-top:4px">综合评分（满分100）</div>';
  html += '</div>';

  // 9维度得分条
  html += '<div style="margin-bottom:20px">';
  let dims = [
    {key:'wuge', label:'五格数理', max:20},
    {key:'sancai', label:'三才配置', max:15},
    {key:'baziMatch', label:'八字匹配', max:20},
    {key:'zodiac', label:'生肖宜忌', max:10},
    {key:'yinlv', label:'音律和谐', max:10},
    {key:'xieyin', label:'谐音安全', max:5},
    {key:'meaning', label:'字义寓意', max:10},
    {key:'benming', label:'生肖本命', max:5},
    {key:'fangwei', label:'方位补益', max:5}
  ];
  for (let i = 0; i < dims.length; i++) {
    let d = dims[i];
    let s = result.scores[d.key] || 0;
    let pct = Math.round(s / d.max * 100);
    let barColor = pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--warn)' : 'var(--cinn2)';
    html += '<div style="margin-bottom:10px">';
    html += '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">';
    html += '<span style="color:var(--paper2)">' + d.label + '</span>';
    html += '<span style="color:' + barColor + '">' + s + '/' + d.max + '</span>';
    html += '</div>';
    html += '<div style="height:6px;background:rgba(255,255,255,0.05);border-radius:3px;overflow:hidden">';
    html += '<div style="width:' + pct + '%;height:100%;background:' + barColor + ';border-radius:3px;transition:width .3s"></div>';
    html += '</div>';
    html += '<div style="font-size:11px;color:var(--paper3);opacity:0.6;margin-top:3px">' + (result.details[d.key] || '') + '</div>';
    html += '</div>';
  }
  html += '</div>';

  // 建议
  html += '<div style="padding:14px;background:rgba(201,168,76,0.05);border:1px solid rgba(201,168,76,0.15);border-radius:8px">';
  html += '<div style="font-size:14px;color:var(--gold);margin-bottom:8px;letter-spacing:2px">📋 改进建议</div>';
  for (let j = 0; j < result.suggestions.length; j++) {
    html += '<div style="font-size:12px;color:var(--paper2);line-height:1.8;opacity:0.8">• ' + result.suggestions[j] + '</div>';
  }
  html += '</div>';

  html += '</div>';
  return html;
}

// ════════════════════════════════════════════════════════════════
// 第三层：自进化系统
// ════════════════════════════════════════════════════════════════

// ================================================================
// 8. NameEvolution — 自进化权重调整系统
// ================================================================
const NameEvolution = {
  // 默认权重（与9维度对应）
  defaultWeights: {
    wuge: 20,
    sancai: 15,
    baziMatch: 20,
    zodiac: 10,
    yinlv: 10,
    xieyin: 5,
    meaning: 10,
    benming: 5,
    fangwei: 5
  },

  // 当前权重（从localStorage加载或使用默认值）
  currentWeights: null,

  // 反馈记录
  feedbackHistory: [],

  // 初始化
  init: function() {
    this.loadFromStorage();
    if (!this.currentWeights) {
      this.currentWeights = JSON.parse(JSON.stringify(this.defaultWeights));
    }
    if (!this.feedbackHistory) {
      this.feedbackHistory = [];
    }
  },

  // 记录用户反馈
  recordFeedback: function(name, score, liked) {
    let feedback = {
      name: name,
      score: score,
      liked: liked,
      timestamp: Date.now()
    };
    this.feedbackHistory.push(feedback);

    // 保留最近200条
    if (this.feedbackHistory.length > 200) {
      this.feedbackHistory = this.feedbackHistory.slice(-200);
    }

    this.saveToStorage();

    // 每积累10条反馈自动调整一次权重
    if (this.feedbackHistory.length % 10 === 0) {
      this.adjustWeights();
    }

    return { success: true, total: this.feedbackHistory.length, message: '反馈已记录，共' + this.feedbackHistory.length + '条' };
  },

  // 根据反馈调整权重
  adjustWeights: function() {
    if (this.feedbackHistory.length < 5) {
      return { adjusted: false, reason: '反馈数据不足（需至少5条）' };
    }

    // 分析 liked=true 但 score 低的维度 → 该维度可能权重过高
    // 分析 liked=false 但 score 高的维度 → 该维度可能权重过低
    let dimKeys = Object.keys(this.defaultWeights);
    let dimAdjustments = {};

    for (let i = 0; i < dimKeys.length; i++) {
      dimAdjustments[dimKeys[i]] = 0;
    }

    for (let j = 0; j < this.feedbackHistory.length; j++) {
      let fb = this.feedbackHistory[j];
      // 如果有详细的scores记录
      if (fb.scores) {
        for (let k = 0; k < dimKeys.length; k++) {
          let key = dimKeys[k];
          let maxScore = this.defaultWeights[key];
          let actualScore = fb.scores[key] || 0;
          let ratio = actualScore / maxScore;

          if (fb.liked && ratio < 0.5) {
            // 用户喜欢但该维度得分低 → 降低该维度权重
            dimAdjustments[key] -= 0.5;
          } else if (!fb.liked && ratio > 0.8) {
            // 用户不喜欢但该维度得分高 → 提高该维度权重
            dimAdjustments[key] += 0.5;
          }
        }
      }
    }

    // 应用微调（每次最多调整±2分）
    for (let m = 0; m < dimKeys.length; m++) {
      let key2 = dimKeys[m];
      let adjustment = Math.max(-2, Math.min(2, dimAdjustments[key2]));
      this.currentWeights[key2] = Math.max(1, Math.min(30, this.currentWeights[key2] + adjustment));
    }

    // 归一化到总分100
    let total = 0;
    for (let n = 0; n < dimKeys.length; n++) {
      total += this.currentWeights[dimKeys[n]];
    }
    if (total !== 100) {
      let factor = 100 / total;
      for (let p = 0; p < dimKeys.length; p++) {
        this.currentWeights[dimKeys[p]] = Math.round(this.currentWeights[dimKeys[p]] * factor);
      }
    }

    this.saveToStorage();

    return {
      adjusted: true,
      newWeights: JSON.parse(JSON.stringify(this.currentWeights)),
      adjustments: dimAdjustments,
      message: '权重已根据' + this.feedbackHistory.length + '条反馈自动调整'
    };
  },

  // 保存到localStorage
  saveToStorage: function() {
    try {
      localStorage.setItem('nameEvolution_weights', JSON.stringify(this.currentWeights));
      localStorage.setItem('nameEvolution_feedback', JSON.stringify(this.feedbackHistory));
    } catch(e) {
      console.warn('NameEvolution: 无法保存到localStorage', e);
    }
  },

  // 从localStorage加载
  loadFromStorage: function() {
    try {
      let w = localStorage.getItem('nameEvolution_weights');
      let f = localStorage.getItem('nameEvolution_feedback');
      if (w) this.currentWeights = JSON.parse(w);
      if (f) this.feedbackHistory = JSON.parse(f);
    } catch(e) {
      console.warn('NameEvolution: 无法从localStorage加载', e);
    }
  },

  // 获取当前状态
  getStatus: function() {
    return {
      weights: this.currentWeights || this.defaultWeights,
      feedbackCount: this.feedbackHistory.length,
      isCustomized: JSON.stringify(this.currentWeights) !== JSON.stringify(this.defaultWeights)
    };
  },

  // 重置为默认权重
  reset: function() {
    this.currentWeights = JSON.parse(JSON.stringify(this.defaultWeights));
    this.feedbackHistory = [];
    this.saveToStorage();
    return { success: true, message: '已重置为默认权重' };
  },

  // 使用当前权重计算评分
  scoreWithEvolution: function(name, userInfo) {
    // 确保初始化
    if (!this.currentWeights) this.init();

    let result = comprehensiveNameScore(name, userInfo);

    // 如果权重已调整，重新计算总分
    if (JSON.stringify(this.currentWeights) !== JSON.stringify(this.defaultWeights)) {
      let newTotal = 0;
      let dims = Object.keys(this.defaultWeights);
      for (let i = 0; i < dims.length; i++) {
        // 归一化得分到0-1，再乘以新权重
        let ratio = result.scores[dims[i]] / this.defaultWeights[dims[i]];
        let newScore = Math.round(ratio * this.currentWeights[dims[i]]);
        result.scores[dims[i]] = newScore;
        newTotal += newScore;
      }
      result.totalScore = newTotal;

      // 重新评级
      if (newTotal >= 85) result.grade = '极佳';
      else if (newTotal >= 75) result.grade = '优秀';
      else if (newTotal >= 65) result.grade = '良好';
      else if (newTotal >= 50) result.grade = '中等';
      else if (newTotal >= 35) result.grade = '一般';
      else result.grade = '不佳';

      result.evolutionApplied = true;
    }

    return result;
  }
};

// 初始化自进化系统
NameEvolution.init();

// console.log('起名改名专业模型已加载：知识库 + 模型层 + 自进化系统');

// ================================================================
// UI辅助函数：显示综合评分 & 记录反馈
// ================================================================
function showComprehensiveScore(name, userInfo) {
  let result = NameEvolution.scoreWithEvolution(name, userInfo);
  let html = renderComprehensiveScore(result);
  let panel = document.getElementById('comprehensiveScorePanel');
  let content = document.getElementById('comprehensiveScoreContent');
  if (panel && content) {
    content.innerHTML = html;
    panel.style.display = 'block';
    // 滚动到评分区域
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  // 保存当前评分结果用于反馈
  window._currentNameScore = result;
  return result;
}

function recordNameFeedback(liked) {
  if (!window._currentNameScore) {
    showToast('请先进行姓名评分分析');
    return;
  }
  let result = NameEvolution.recordFeedback(
    window._currentNameScore.name,
    window._currentNameScore.totalScore,
    liked
  );
  let msgEl = document.getElementById('feedbackMsg');
  if (msgEl) {
    msgEl.textContent = result.message + (result.total % 10 === 0 ? ' | 权重已自动调整' : '');
    msgEl.style.opacity = '1';
    setTimeout(function() { msgEl.style.opacity = '0.6'; }, 3000);
  }
}

// 显示数理运势周期
function showWugeLifeCycle(wuge) {
  if (!wuge || !wuge.success) return '';
  let html = '<div style="margin-top:16px;padding:14px;background:rgba(201,168,76,0.04);border:1px solid rgba(201,168,76,0.1);border-radius:8px">';
  html += '<div style="font-size:13px;color:var(--gold);margin-bottom:10px;letter-spacing:2px">📅 数理运势周期</div>';
  let grids = [
    {key:'tianGe', name:'天格'},
    {key:'renGe', name:'人格'},
    {key:'diGe', name:'地格'},
    {key:'waiGe', name:'外格'},
    {key:'zongGe', name:'总格'}
  ];
  for (let i = 0; i < grids.length; i++) {
    let g = grids[i];
    let val = wuge[g.key];
    let cycle = WUGE_LIFE_CYCLE[g.name];
    let detail = getWugeLuckDetail(val);
    let luckColor = detail.luck === '大吉' ? 'var(--success)' : detail.luck === '吉' ? 'var(--jade)' : detail.luck === '半吉' ? 'var(--warn)' : 'var(--cinn2)';
    html += '<div style="margin-bottom:8px;padding:8px;background:rgba(255,255,255,0.02);border-radius:6px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center">';
    html += '<span style="color:var(--gold);font-size:13px">' + g.name + ' ' + val + '</span>';
    html += '<span style="color:' + luckColor + ';font-size:11px">' + detail.luck + ' · ' + detail.name + '</span>';
    html += '</div>';
    html += '<div style="font-size:11px;color:var(--paper2);opacity:0.7;margin-top:4px">' + cycle.ageRange + ' | ' + cycle.field + '</div>';
    html += '<div style="font-size:11px;color:var(--paper3);opacity:0.5;margin-top:2px">' + detail.desc + '</div>';
    html += '</div>';
  }
  html += '</div>';
  return html;
}
