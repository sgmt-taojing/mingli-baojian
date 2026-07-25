// ===== 引导区功能 =====
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
        html += '<div style="font-size:12px;opacity:0.95;letter-spacing:1px;margin-top:10px;margin-left:40px;padding:10px 14px;background:rgba(201,168,76,0.04);border-left:3px solid var(--gold);border-radius:4px;line-height:1.7">📖 ' + s.principle + '</div>';
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
let INDUSTRY_CHARS = INDUSTRY_CHARS || {
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
const WUGE_LUCK_DETAIL = {
  // 大吉数理
  1:{luck:'大吉',desc:'太极之数，万物开泰，生发无穷，利禄亨通'},
  3:{luck:'大吉',desc:'三才之数，天地人和，大事大业，繁荣昌盛'},
  5:{luck:'大吉',desc:'五行俱全，循环相生，圆通畅达，福祉无穷'},
  6:{luck:'大吉',desc:'六爻之数，发展变化，天赋美德，吉祥安泰'},
  7:{luck:'吉',desc:'七政之数，精悍严谨，天赋之力，吉星照耀'},
  8:{luck:'吉',desc:'八卦之数，乾坤已定，意志坚强，进退自如'},
  11:{luck:'大吉',desc:'万物更新，调顺发达，恢弘泽世，繁荣富贵'},
  13:{luck:'大吉',desc:'春日牡丹，才艺多能，智谋奇略，忍柔当事'},
  15:{luck:'大吉',desc:'福寿双全，立身兴家，慈祥有德，福泽绵长'},
  16:{luck:'大吉',desc:'厚重载德，安富尊荣，贵人相助，天乙扶持'},
  17:{luck:'吉',desc:'突破万难，刚柔兼备，必获成功，大业成就'},
  18:{luck:'大吉',desc:'权威显达，博得名利，且养柔德，功成名就'},
  21:{luck:'大吉',desc:'明月中天，万物确立，官运亨通，大博名利'},
  23:{luck:'大吉',desc:'旭日东升，壮丽壮观，权威旺盛，功名荣达'},
  24:{luck:'大吉',desc:'家门余庆，金钱丰盈，白手成家，财源广进'},
  25:{luck:'吉',desc:'资性英敏，有奇才能，平和处世，才华成功'},
  29:{luck:'吉',desc:'智谋优秀，财力归集，名闻海内，成就大业'},
  31:{luck:'大吉',desc:'智勇双全，意志坚定，千挫不挠，名利双收'},
  32:{luck:'大吉',desc:'宝马金鞍，贵人得助，天乙扶持，名利双收'},
  33:{luck:'大吉',desc:'旭日升天，鸾凤相会，名闻天下，隆昌至极'},
  35:{luck:'吉',desc:'温和平静，优雅发展，此乃吉运，能获成功'},
  37:{luck:'吉',desc:'权威显达，吉人天相，谋事不凡，德望崇高'},
  39:{luck:'吉',desc:'云开见月，虽劳无功，智谋高超，贵气盈门'},
  41:{luck:'大吉',desc:'纯阳独秀，有名有利，天赋吉运，博得名望'},
  45:{luck:'吉',desc:'顺风扬帆，新生泰运，智谋经纬，富贵繁荣'},
  47:{luck:'吉',desc:'开花之象，祯祥吉庆，全力进取，前途无量'},
  48:{luck:'吉',desc:'青松立鹤，智谋兼备，德量宏大，清雅荣贵'},
  52:{luck:'吉',desc:'先见之明，理想实现，成功立业，名达天下'},
  57:{luck:'吉',desc:'寒夜青灯，宏图大展，时来运转，旭日东升'},
  61:{luck:'吉',desc:'牡丹芙蓉，修身养性，吉祥如意，名扬天下'},
  63:{luck:'大吉',desc:'万物化育，繁荣之象，专心经营，必获成功'},
  65:{luck:'吉',desc:'长白逢春，大博名利，庆得天赐，名达天下'},
  67:{luck:'吉',desc:'顺风扬帆，智力双全，成功立业，富贵荣华'},
  68:{luck:'吉',desc:'青松立鹤，智谋兼备，德量宏大，清雅荣贵'},
  81:{luck:'大吉',desc:'还元复始，万象更新，调顺发达，大博名利'},
  // 半吉数理
  2:{luck:'半吉',desc:'两仪之数，混沌未开，进退保守，志望难达'},
  4:{luck:'半吉',desc:'四象之数，待机而发，万事慎重，不具营谋'},
  9:{luck:'半吉',desc:'大成之数，蕴涵凶险，或成或败，难以把握'},
  10:{luck:'半吉',desc:'万事终局，充满损耗，难有成就，若能慎思'},
  12:{luck:'半吉',desc:'薄弱无力，孤立无援，外祥内苦，谋事难成'},
  14:{luck:'半吉',desc:'家庭缘薄，孤独遭难，谋事不达，有不测灾'},
  19:{luck:'半吉',desc:'多难非运，遮云蔽月，虽有智能，成功无望'},
  20:{luck:'半吉',desc:'物将坏之，灾难重重，进退维谷，难得平安'},
  22:{luck:'半吉',desc:'秋草逢霜，困难疾弱，虽有豪杰，人生波折'},
  26:{luck:'半吉',desc:'波澜起伏，千变万化，凌驾万难，必获成功'},
  27:{luck:'半吉',desc:'一成一败，盛衰参半，虽有智慧，谨慎为佳'},
  28:{luck:'半吉',desc:'十浮九沉，变化无穷，若能坚守，可获成功'},
  30:{luck:'半吉',desc:'吉凶参半，得失相伴，投机取巧，如赌一生'},
  34:{luck:'半吉',desc:'灾难不绝，难望成功，进退维谷，谋事难成'},
  36:{luck:'半吉',desc:'波澜重叠，沉浮万状，侠义心肠，舍己成仁'},
  38:{luck:'半吉',desc:'艺术成名，智谋卓越，若能慎思，博得名利'},
  40:{luck:'半吉',desc:'智谋胆识，冒险投机，沉浮不定，成败难分'},
  42:{luck:'半吉',desc:'十艺九穷，成功不多，若能专攻，可获小成'},
  43:{luck:'半吉',desc:'雨夜之花，外祥内苦，忍耐自重，转凶为吉'},
  44:{luck:'半吉',desc:'秋木落叶，根最空虚，若能修身，可保平安'},
  46:{luck:'半吉',desc:'载宝沉舟，倾家荡产，若能谨慎，可保平安'},
  49:{luck:'半吉',desc:'吉凶难分，不断努力，可获成功，但需谨慎'},
  50:{luck:'半吉',desc:'一成一败，盛衰参半，若能守正，可获成功'},
  51:{luck:'半吉',desc:'盛衰交加，波澜重叠，如果能忍，可获成功'},
  53:{luck:'半吉',desc:'外表光华，内有隐忧，若能谨慎，可保平安'},
  54:{luck:'半吉',desc:'多难非运，遮云蔽月，虽有智慧，成功无望'},
  55:{luck:'半吉',desc:'外表光华，内有隐忧，若能谨慎，可保平安'},
  56:{luck:'半吉',desc:'浪里行舟，历尽艰辛，如能谨慎，可达彼岸'},
  58:{luck:'半吉',desc:'危难遭厄，如履薄冰，若能修身，可保平安'},
  59:{luck:'半吉',desc:'十艺九穷，成功不多，若能专攻，可获小成'},
  60:{luck:'半吉',desc:'黑暗无光，心迷意乱，出师不利，难有成功'},
  62:{luck:'半吉',desc:'衰败之象，基础不稳，若能修身，可保平安'},
  64:{luck:'半吉',desc:'骨肉分离，孤独悲苦，难得安宁，行事小心'},
  66:{luck:'半吉',desc:'进退维谷，艰难不堪，等待时机，可获成功'},
  69:{luck:'半吉',desc:'灾祸接连，动摇不安，若能修身，可保平安'},
  70:{luck:'半吉',desc:'屋倒墙崩，空虚无依，若能谨慎，可保平安'},
  71:{luck:'半吉',desc:'吉凶参半，惟赖勇气，贯彻力行，可保平安'},
  72:{luck:'半吉',desc:'利害参半，利害混合，若能慎思，可保平安'},
  73:{luck:'半吉',desc:'安乐自来，自然吉祥，力行不懈，必得成功'},
  74:{luck:'半吉',desc:'无用之辈，悲哀多难，若能修身，可保平安'},
  75:{luck:'半吉',desc:'守则可安，进取则凶，顺其自然，可保平安'},
  76:{luck:'半吉',desc:'覆舟浪里，失魂落魄，若能谨慎，可保平安'},
  77:{luck:'半吉',desc:'乐极生悲，一成一败，若能慎思，可保平安'},
  78:{luck:'半吉',desc:'晚境凄凉，功名不立，若能早修，可保平安'},
  79:{luck:'半吉',desc:'精神不定，祸福无常，若能慎思，可保平安'},
  80:{luck:'半吉',desc:'最极之数，还元复初，若能慎思，可保平安'}
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

// 收藏公司名
let savedCompanyNames = [];

function saveCompanyName(name) {
  if (savedCompanyNames.includes(name)) {
    showToast('已收藏此名称');
    return;
  }

  savedCompanyNames.push(name);
  showToast(`"${name}" 已加入收藏列表`);
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
    '1': '水', '2': '火',
    '3': '木', '4': '金',
    '5': '土', '6': '水',
    '7': '火', '8': '木',
    '9': '金', '0': '土'
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

// 导出公司名(占位函数,实际功能需根据完整代码调整)


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
  termExplain += '<ml-tap onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==\'none\'?\'\':\'none\'" style="font-size:12px;color:var(--gold);cursor:pointer;letter-spacing:2px;display:flex;align-items:center;gap:6px" variant="card" role="button" tabindex="0">';
  termExplain += '<span style="transition:transform .2s;display:inline-block" id="termArrow">▶</span>命理术语解读';
  termExplain += '</ml-tap>';
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
    resultDiv.insertAdjacentHTML('beforeend', termExplain + copyBtn);
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
    <p style="font-size:11px;opacity:.95;">${Object.entries(result.fengshui.wuxingPercent).map(([wx, pct]) => `${wx}:${pct}%`).join(' | ')}</p>
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
// 三才配置分析
// ================================================================
function analyzeSancai(wuge) {
  const { tianGeWuxing, renGeWuxing, diGeWuxing } = wuge;

  // 五行生克关系
  const sheng = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  const ke = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

  // 分析三才配置
  const tian = tianGeWuxing;
  const ren = renGeWuxing;
  const di = diGeWuxing;

  let score = 0;
  let analysis = '';

  // 天→人关系
  if (sheng[tian] === ren) {
    score += 30;
    analysis += `天格${tian}生人格${ren},上佳；`;
  } else if (tian === ren) {
    score += 20;
    analysis += `天格${tian}与人格${ren}比和，平稳；`;
  } else if (ke[tian] === ren) {
    score -= 10;
    analysis += `天格${tian}克人格${ren},不利；`;
  } else {
    score += 10;
    analysis += `天格${tian}与人格${ren}关系一般；`;
  }

  // 人→地关系
  if (sheng[ren] === di) {
    score += 30;
    analysis += `人格${ren}生地格${di},基础稳固；`;
  } else if (ren === di) {
    score += 20;
    analysis += `人格${ren}与地格${di}比和，发展平顺；`;
  } else if (ke[ren] === di) {
    score -= 10;
    analysis += `人格${ren}克地格${di},基础不稳；`;
  } else {
    score += 10;
    analysis += `人格${ren}与地格${di}关系一般；`;
  }

  // 综合判断
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
    tian,
    ren,
    di,
    score,
    luck,
    analysis
  };
}

// ================================================================
// 五格吉凶判断
// ================================================================
function getWugeLuck(gridValue) {
  // 五格吉凶判断（基于81数理吉凶表）
  const luckyNums = [1, 3, 5, 6, 7, 8, 11, 13, 15, 16, 17, 18, 21, 23, 24, 25, 29, 31, 32, 33, 35, 37, 39, 41, 45, 47, 48, 52, 57, 61, 63, 65, 67, 68, 73, 75, 77, 78, 81];
  const neutralNums = [2, 4, 9, 10, 12, 14, 19, 20, 22, 26, 27, 28, 30, 34, 36, 38, 40, 42, 43, 44, 46, 49, 50, 51, 53, 54, 55, 56, 58, 59, 60, 62, 64, 66, 69, 70, 71, 72, 74, 76, 79, 80];

  if (luckyNums.includes(gridValue)) return 'lucky';
  if (neutralNums.includes(gridValue)) return 'neutral';
  return 'unlucky';
}

// ================================================================
// 拼音数据库(用于音律分析)
// ================================================================
const PINYIN_DB = {
  '赵': 'zhao4', '钱': 'qian2', '孙': 'sun1', '李': 'li3', '王': 'wang2',
  '张': 'zhang1', '刘': 'liu2', '陈': 'chen2', '杨': 'yang2', '黄': 'huang2',
  '周': 'zhou1', '吴': 'wu2', '徐': 'xu2', '孙': 'sun1', '胡': 'hu2',
  '朱': 'zhu1', '高': 'gao1', '林': 'lin2', '何': 'he2', '郭': 'guo1',
  '马': 'ma3', '罗': 'luo2', '梁': 'liang2', '宋': 'song4', '郑': 'zheng4',
  '谢': 'xie4', '韩': 'han2', '唐': 'tang2', '冯': 'feng2', '于': 'yu2',
  '董': 'dong3', '萧': 'xiao1', '程': 'cheng2', '曹': 'cao2', '袁': 'yuan2',
  '邓': 'deng4', '许': 'xu3', '傅': 'fu4', '沈': 'shen3', '曾': 'zeng1',
  '彭': 'peng2', '吕': 'lv3', '苏': 'su1', '卢': 'lu2', '蒋': 'jiang3',
  '蔡': 'cai4', '贾': 'jia3', '丁': 'ding1', '魏': 'wei4', '薛': 'xue1',
  '叶': 'ye4', '阎': 'yan2', '余': 'yu2', '潘': 'pan1', '杜': 'du4',
  '戴': 'dai4', '夏': 'xia4', '钟': 'zhong1', '汪': 'wang1', '田': 'tian2',
  '任': 'ren4', '姜': 'jiang1', '范': 'fan4', '方': 'fang1', '石': 'shi2',
  '姚': 'yao2', '谭': 'tan2', '廖': 'liao4', '邹': 'zou1', '熊': 'xiong2',
  '金': 'jin1', '陆': 'lu4', '郝': 'hao3', '孔': 'kong3', '白': 'bai2',
  '崔': 'cui1', '康': 'kang1', '毛': 'mao2', '邱': 'qiu1', '秦': 'qin2',
  '江': 'jiang1', '史': 'shi3', '顾': 'gu4', '侯': 'hou2', '邵': 'shao4',
  '孟': 'meng4', '龙': 'long2', '万': 'wan4', '段': 'duan4', '雷': 'lei2',
  '文': 'wen2'
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
// 谐音检测数据库
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
  { word: '胡丽晶', meaning: '狐狸精' }
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
const CHAR_MEANING = {
  '伟': '高大、杰出', '芳': '芳香、美好', '娜': '柔美、优雅', '秀': '秀丽、优秀',
  '敏': '敏捷、聪慧', '静': '安静、沉稳', '丽': '美丽、秀丽', '强': '强大、坚强',
  '明': '光明、聪明', '华': '华丽、才华', '文': '文雅、文化', '俊': '俊秀、杰出',
  '杰': '杰出、优秀', '慧': '聪慧、智慧', '鑫': '财富、兴盛', '蕾': '花蕾、希望',
  '婷': '优美、雅致', '雪': '纯洁、高雅', '红': '红火、热情', '亮': '明亮、光明',
  '建': '建设、建立', '波': '波涛、活力', '辉': '光辉、辉煌', '龙': '尊贵、力量',
  '飞': '飞扬、自由', '鹏': '大鹏、志向远大', '宇': '宇宙、气度', '晨': '早晨、希望',
  '浩': '浩大、广阔', '博': '博大、丰富', '睿': '睿智、聪明', '哲': '哲理、智慧',
  '涵': '涵养、包容', '梓': '梓木、家乡', '萱': '萱草、忘忧', '彤': '红色、热情',
  '瑶': '美玉、珍贵', '馨': '芳香、温馨', '悦': '喜悦、愉快', '怡': '怡然、快乐',
  '瑾': '美玉、品德', '璇': '美玉、星辰', '嘉': '美好、赞许', '翔': '飞翔、翱翔'
};

// ================================================================
// 字义分析
// ================================================================
function analyzeYuyi(fullName) {
  const chars = fullName.split('');
  const meanings = chars.map(c => CHAR_MEANING[c] || '美好');

  return {
    chars,
    meanings,
    combined: meanings.join(',')
  };
}

// ================================================================
// 改名建议功能
// ================================================================
function computeRename() {
 try {
  let btn = document.getElementById('renameBtn');
  if(btn){ btn.disabled=true; btn.textContent='分析中...'; }
  const currentName = document.getElementById('renameCurrentName').value.trim();
  const newNames = document.getElementById('renameNewNames').value.trim();
  const sex = document.getElementById('renameSex').value || 'male';
  const birthDate = document.getElementById('renameBirthDate').value;
  const birthHour = document.getElementById('renameBirthHour')?.value || '';
  const birthCity = document.getElementById('renameBirthCity')?.value || '';
  const liveCity = document.getElementById('renameLiveCity')?.value || '';

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
  document.getElementById('renameResult').classList.add('visible');

  // 计算八字用神（如果提供了出生日期）
  let baziYongshen = null;
  if (birthDate) {
    try {
      let parts = birthDate.split('-');
      let hourVal = birthHour !== '' ? parseInt(birthHour) * 2 : 12;
      let bazi = computeBaziCore(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]), hourVal);
      if (bazi) {
        let eleCount = {'金':0,'木':0,'水':0,'火':0,'土':0};
        for (let i = 0; i < 4; i++) {
          if (bazi.pillars[i] && bazi.pillars[i].element) eleCount[bazi.pillars[i].element] = (eleCount[bazi.pillars[i].element]||0) + 1;
        }
        let weakest = '木', minCount = 99;
        for (let e in eleCount) { if (eleCount[e] < minCount) { minCount = eleCount[e]; weakest = e; } }
        baziYongshen = { element: weakest, bazi: bazi, dayStem: bazi.pillars[2] ? bazi.pillars[2].stem : '甲' };
      }
    } catch(e) { console.warn('八字用神计算失败:', e.message); }
  }

  // 分析第一个名字并显示
  const analysis = analyzeName(currentName, nameList[0], sex, birthDate);
  if (analysis.success) {
    displayRenameResult(analysis);
    
    // 如果有八字用神信息，追加分析
    if (baziYongshen) {
      let wuxingBox = document.getElementById('renameWuxingAnalysis');
      if (wuxingBox) {
        let yongshenHtml = '<div style="background:rgba(39,174,96,0.04);border:1px solid rgba(39,174,96,0.12);border-radius:8px;padding:14px;margin-top:12px">';
        yongshenHtml += '<h5 style="font-size:13px;color:var(--jade);margin-bottom:8px">🌟 八字用神分析</h5>';
        yongshenHtml += '<p style="font-size:12px;opacity:.7;line-height:1.8">日主：<b style="color:var(--gold)">' + baziYongshen.dayStem + '</b>（' + (ELE[baziYongshen.dayStem]||'木') + '）</p>';
        yongshenHtml += '<p style="font-size:12px;opacity:.7;line-height:1.8">用神（最弱五行）：<b style="color:var(--jade)">' + baziYongshen.element + '</b></p>';
        yongshenHtml += '<p style="font-size:12px;opacity:.7;line-height:1.8">建议取名用字五行偏「' + baziYongshen.element + '」，以补益命局先天不足。</p>';
        if (birthCity) yongshenHtml += '<p style="font-size:11px;opacity:.95;margin-top:4px">出生地：' + birthCity + (liveCity ? ' | 居住地：' + liveCity : '') + '</p>';
        yongshenHtml += '</div>';
        wuxingBox.insertAdjacentHTML('beforeend', yongshenHtml);
      }
    }
  }
 } catch(e) {
  console.error('[改名分析错误]', e.message, e.stack);
  showToast('改名分析出错: ' + e.message);
 } finally {
  if(btn){btn.disabled=false;btn.textContent='开始分析';}
 }
}

// ===== 起名/改名增强函数 =====
function onRenamePurposeChange() {
  let purpose = document.getElementById('renamePurpose')?.value || 'naming';
  let nameInput = document.getElementById('renameCurrentName');
  let surnameInput = document.getElementById('renameSurname');
  let candidateTitle = document.getElementById('renameCandidateTitle');
  let candidateHint = document.getElementById('renameCandidateHint');
  let textarea = document.getElementById('renameNewNames');
  
  if (purpose === 'naming') {
    if (nameInput) nameInput.placeholder = '当前姓名（起名时可留空）';
    if (surnameInput) surnameInput.style.display = '';
    if (candidateTitle) candidateTitle.textContent = '候选名字';
    if (candidateHint) candidateHint.textContent = '每行一个名字，系统将逐一分析。也可留空让系统自动推荐。';
    if (textarea) textarea.placeholder = '例如：\n李明\n李晨\n李睿\n\n也可留空，系统将根据八字自动推荐';
  } else if (purpose === 'rename') {
    if (nameInput) nameInput.placeholder = '当前姓名（必填）';
    if (surnameInput) surnameInput.style.display = '';
    if (candidateTitle) candidateTitle.textContent = '想改的名字';
    if (candidateHint) candidateHint.textContent = '每行一个名字，系统将逐一分析。也可留空让系统自动推荐。';
    if (textarea) textarea.placeholder = '例如：\n李明\n李晨\n李睿\n\n也可留空，系统将根据八字自动推荐';
  } else if (purpose === 'penname') {
    if (nameInput) nameInput.placeholder = '本名（选填）';
    if (surnameInput) surnameInput.style.display = '';
    if (candidateTitle) candidateTitle.textContent = '候选笔名';
    if (candidateHint) candidateHint.textContent = '每行一个笔名，系统将逐一分析。也可留空让系统自动推荐。';
    if (textarea) textarea.placeholder = '例如：\n墨竹\n清岚\n\n也可留空，系统将根据八字自动推荐';
  }
}

function toggleRenameCalendar() {
  // 农历/阳历切换提示
  let calType = document.getElementById('renameCalendarType')?.value || 'solar';
  if (calType === 'lunar') {
    showToast('农历模式：请输入农历日期，系统将自动转换');
  }
}

function computeRenameEnhanced() {
 try {
  let btn = document.getElementById('renameBtn');
  if(btn){ btn.disabled=true; btn.textContent='分析中...'; }
  
  let purpose = document.getElementById('renamePurpose')?.value || 'naming';
  let currentName = document.getElementById('renameCurrentName')?.value.trim() || '';
  let surname = document.getElementById('renameSurname')?.value.trim() || '';
  let zibei = document.getElementById('renameZibei')?.value.trim() || '';
  let sex = document.getElementById('renameSex')?.value || 'male';
  let nameLen = document.getElementById('renameNameLen')?.value || '';
  let birthDate = document.getElementById('renameBirthDate')?.value || '';
  let birthHour = document.getElementById('renameBirthHour')?.value || '';
  let birthCity = document.getElementById('renameBirthCity')?.value || '';
  let liveCity = document.getElementById('renameLiveCity')?.value || '';
  let newNames = document.getElementById('renameNewNames')?.value.trim() || '';
  
  // 验证
  if (purpose === 'rename' && !currentName) {
    showToast('改名请填写当前姓名');
    if(btn){btn.disabled=false;btn.textContent='开始分析';}
    return;
  }
  if (purpose === 'naming' && !surname && !currentName) {
    showToast('起名请填写姓氏');
    if(btn){btn.disabled=false;btn.textContent='开始分析';}
    return;
  }
  
  // 从当前姓名提取姓氏
  if (!surname && currentName) {
    surname = currentName.charAt(0);
  }
  
  // 显示结果区域
  let resultEl = document.getElementById('renameResult');
  if(resultEl){ resultEl.style.display = 'block'; resultEl.classList.add('visible'); }
  
  // 计算八字用神
  let baziYongshen = null;
  if (birthDate) {
    try {
      let parts = birthDate.split('-');
      let hourVal = birthHour !== '' ? parseInt(birthHour) * 2 : 12;
      let bazi = computeBaziCore(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]), hourVal);
      if (bazi) {
        let eleCount = {'金':0,'木':0,'水':0,'火':0,'土':0};
        for (let i = 0; i < 4; i++) {
          if (bazi.pillars[i] && bazi.pillars[i].element) eleCount[bazi.pillars[i].element] = (eleCount[bazi.pillars[i].element]||0) + 1;
        }
        let weakest = '木', minCount = 99;
        let strongest = '木', maxCount = 0;
        for (let e in eleCount) {
          if (eleCount[e] < minCount) { minCount = eleCount[e]; weakest = e; }
          if (eleCount[e] > maxCount) { maxCount = eleCount[e]; strongest = e; }
        }
        let dayStem = bazi.pillars[2] ? bazi.pillars[2].stem : '甲';
        let dayEle = bazi.pillars[2] ? (bazi.pillars[2].element || '木') : '木';
        baziYongshen = { 
          element: weakest, 
          jiShen: strongest,
          bazi: bazi, 
          dayStem: dayStem,
          dayEle: dayEle,
          eleCount: eleCount
        };
      }
    } catch(e) { console.warn('八字用神计算失败:', e.message); }
  }
  
  // 显示八字用神分析
  let baziBox = document.getElementById('renameBaziAnalysis');
  if (baziBox) {
    if (baziYongshen) {
      baziBox.style.display = 'block';
      let bHtml = '<div style="background:rgba(39,174,96,0.04);border:1px solid rgba(39,174,96,0.12);border-radius:8px;padding:14px">';
      bHtml += '<h5 style="font-size:14px;color:var(--jade);margin-bottom:10px;letter-spacing:2px">🌟 八字用神分析</h5>';
      bHtml += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:12px">';
      bHtml += '<div style="text-align:center;padding:8px;background:rgba(201,168,76,.04);border-radius:6px"><div style="font-size:11px;opacity:.95">日主</div><div style="font-size:14px;font-weight:bold;color:var(--gold)">' + baziYongshen.dayStem + '(' + baziYongshen.dayEle + ')</div></div>';
      bHtml += '<div style="text-align:center;padding:8px;background:rgba(39,174,96,.04);border-radius:6px"><div style="font-size:11px;opacity:.95">用神</div><div style="font-size:14px;font-weight:bold;color:var(--jade)">' + baziYongshen.element + '</div></div>';
      bHtml += '<div style="text-align:center;padding:8px;background:rgba(231,76,60,.04);border-radius:6px"><div style="font-size:11px;opacity:.95">忌神</div><div style="font-size:14px;font-weight:bold;color:var(--cinn2)">' + baziYongshen.jiShen + '</div></div>';
      bHtml += '</div>';
      bHtml += '<div style="font-size:12px;opacity:.7;line-height:1.8">五行分布：';
      for(let e2 in baziYongshen.eleCount) { bHtml += e2 + ':' + baziYongshen.eleCount[e2] + ' '; }
      bHtml += '</div>';
      bHtml += '<div style="font-size:12px;opacity:.7;line-height:1.8;margin-top:6px">建议取名用字五行偏「<b style="color:var(--jade)">' + baziYongshen.element + '</b>」，避免「<b style="color:var(--cinn2)">' + baziYongshen.jiShen + '</b>」过重。</div>';
      if (birthCity) bHtml += '<div style="font-size:11px;opacity:.95;margin-top:4px">出生地：' + birthCity + (liveCity ? ' | 居住地：' + liveCity : '') + '</div>';
      bHtml += '</div>';
      baziBox.innerHTML = bHtml;
    } else {
      baziBox.style.display = 'none';
    }
  }
  
  // 处理候选名字
  let nameList = [];
  if (newNames) {
    nameList = newNames.split('\n').map(function(n){return n.trim();}).filter(function(n){return n;});
  }
  
  // 如果没有候选名字且有八字，自动推荐
  if (nameList.length === 0 && baziYongshen && surname) {
    nameList = autoGenerateNames(surname, baziYongshen.element, baziYongshen.jiShen, sex, nameLen, zibei);
  }
  
  if (nameList.length === 0) {
    showToast('请输入候选名字，或填写生辰八字让系统自动推荐');
    if(btn){btn.disabled=false;btn.textContent='开始分析';}
    return;
  }
  
  // 分析第一个名字并显示
  let analysis = analyzeName(currentName || nameList[0], nameList[0], sex, birthDate);
  if (analysis.success) {
    displayRenameResult(analysis);
    
    // 如果有八字用神信息，追加分析
    if (baziYongshen) {
      let wuxingBox = document.getElementById('renameWuxingAnalysis');
      if (wuxingBox) {
        let yongshenHtml = '<div style="background:rgba(39,174,96,0.04);border:1px solid rgba(39,174,96,0.12);border-radius:8px;padding:14px;margin-top:12px">';
        yongshenHtml += '<h5 style="font-size:13px;color:var(--jade);margin-bottom:8px">🌟 姓名五行与八字匹配度</h5>';
        yongshenHtml += '<p style="font-size:12px;opacity:.7;line-height:1.8">日主：<b style="color:var(--gold)">' + baziYongshen.dayStem + '</b>（' + baziYongshen.dayEle + '）</p>';
        yongshenHtml += '<p style="font-size:12px;opacity:.7;line-height:1.8">用神：<b style="color:var(--jade)">' + baziYongshen.element + '</b> | 忌神：<b style="color:var(--cinn2)">' + baziYongshen.jiShen + '</b></p>';
        yongshenHtml += '<p style="font-size:12px;opacity:.7;line-height:1.8">建议取名用字五行偏「' + baziYongshen.element + '」，以补益命局先天不足。</p>';
        if (birthCity) yongshenHtml += '<p style="font-size:11px;opacity:.95;margin-top:4px">出生地：' + birthCity + (liveCity ? ' | 居住地：' + liveCity : '') + '</p>';
        yongshenHtml += '</div>';
        wuxingBox.insertAdjacentHTML('beforeend', yongshenHtml);
      }
      
      // 显示取名禁忌
      let tabooBox = document.getElementById('renameTabooBox');
      if (tabooBox) {
        tabooBox.style.display = 'block';
        let tabooHtml = '<div style="padding:14px;background:rgba(231,76,60,0.03);border:1px solid rgba(231,76,60,0.1);border-radius:8px">';
        tabooHtml += '<h5 style="font-size:13px;color:var(--cinn2);margin-bottom:8px;letter-spacing:2px">⚠️ 取名禁忌</h5>';
        tabooHtml += '<div style="font-size:12px;opacity:.7;line-height:2">';
        tabooHtml += '· 避免「' + baziYongshen.jiShen + '」属性偏旁过多（' + getWuxingRadicals(baziYongshen.jiShen) + '）<br>';
        tabooHtml += '· 避免与父母同音、同字<br>';
        tabooHtml += '· 避免生僻字、多音字<br>';
        tabooHtml += '· 避免谐音不雅（如“史珍香”等）<br>';
        tabooHtml += '· 生肖避讳：避免与流年相冲的字<br>';
        tabooHtml += '· 音韵：避免三字同声母或同韵母<br>';
        tabooHtml += '</div></div>';
        tabooBox.innerHTML = tabooHtml;
      }
      
      // 如果是改名，显示原名问题分析
      if (purpose === 'rename' && currentName) {
        let wuge = analysis.wuge;
        if (wuge) {
          let problems = [];
          if (getWugeLuck(wuge.renGe) === 'unlucky') problems.push('人格' + wuge.renGe + '为凶数');
          if (getWugeLuck(wuge.zongGe) === 'unlucky') problems.push('总格' + wuge.zongGe + '为凶数');
          if (getWugeLuck(wuge.diGe) === 'unlucky') problems.push('地格' + wuge.diGe + '为凶数');
          if (problems.length > 0) {
            let tabooBox2 = document.getElementById('renameTabooBox');
            if (tabooBox2) {
              tabooBox2.insertAdjacentHTML('beforeend', '<div style="margin-top:10px;padding:12px;background:rgba(231,76,60,0.03);border:1px solid rgba(231,76,60,0.1);border-radius:8px">');
              tabooBox2.insertAdjacentHTML('beforeend', '<h5 style="font-size:13px;color:var(--cinn2);margin-bottom:6px">📝 原名问题分析</h5>');
              tabooBox2.insertAdjacentHTML('beforeend', '<div style="font-size:12px;opacity:.7;line-height:1.8">原名「' + currentName + '」存在以下问题：<br>· ' + problems.join('<br>· ') + '</div>');
              tabooBox2.insertAdjacentHTML('beforeend', '<div style="font-size:12px;margin-top:6px">建议改名时重点补强以上数理。</div></div>');
            }
          }
        }
      }
    }
  }
  
  if(btn){btn.disabled=false;btn.textContent='开始分析';}
 } catch(e) {
  console.error('[改名增强分析错误]', e.message, e.stack);
  showToast('改名分析出错: ' + e.message);
  if(btn){btn.disabled=false;btn.textContent='开始分析';}
 }
}

// 自动推荐名字
function autoGenerateNames(surname, yongshen, jishen, sex, nameLen, zibei) {
  let wuxingChars = {
    '木': ['林','森','栋','柯','柔','杰','松','柏','芝','茂','荣','华','春','生','芳','蕾','蕊','薇','苗','秀'],
    '火': ['炎','炜','灿','耀','辉','明','亮','照','光','煦','煌','熠','晴','暖','旭','昌','晶','皓','曦','焰'],
    '土': ['坤','城','基','培','坦','坚','垒','尘','境','堂','墨','垣','垠','墅','越','跃','勇','威','容','韵'],
    '金': ['金','鑫','锐','锋','铭','钧','钰','银','锦','鉴','铄','铠','铸','铃','钦','锡','铮','瑞','诚','聪'],
    '水': ['源','泉','泽','润','涵','洁','清','深','远','阔','浩','海','涛','波','冰','淼','瀚','洋','涵','溪']
  };
  let names = [];
  let chars = wuxingChars[yongshen] || wuxingChars['木'];
  let used = {};
  let targetLen = nameLen === '2' ? 1 : (nameLen === '3' ? 2 : 2);
  if (zibei) {
    // 带字辈
    for (let i = 0; i < 5 && names.length < 5; i++) {
      let c = chars[Math.floor((Date.now() / 1000 + i * 7) % chars.length)];
      let name = surname + zibei + c;
      if (!used[name]) { used[name] = true; names.push(name); }
    }
  } else {
    for (let i = 0; i < 30 && names.length < 5; i++) {
      let c1 = chars[Math.floor((Date.now() / 1000 + i * 7) % chars.length)];
      if (targetLen === 1) {
        let name = surname + c1;
        if (!used[name]) { used[name] = true; names.push(name); }
      } else {
        let c2 = chars[Math.floor((Date.now() / 1000 + i * 13) % chars.length)];
        let name2 = surname + c1 + c2;
        if (!used[name2]) { used[name2] = true; names.push(name2); }
      }
    }
  }
  return names;
}

function getWuxingRadicals(wx) {
  let map = {
    '木': '木、艹、竹、禾等',
    '火': '火、灬、日、光等',
    '土': '土、阝、山、石等',
    '金': '金、钅、刂、刀等',
    '水': '氵、水、雨、鱼等'
  };
  return map[wx] || '';
}

// ===== 公司取名增强函数 =====
function generateCompanyNamesEnhanced() {
 try {
  let industry = document.getElementById('companyIndustry')?.value || 'tech';
  let wordCount = parseInt(document.getElementById('companyWordCount')?.value || '3');
  let style = document.getElementById('companyStyle')?.value || '大气';
  let founderBazi = document.getElementById('companyFounderBazi')?.value || '';
  let founderHour = document.getElementById('companyFounderHour')?.value || '';
  let founderSex = document.getElementById('companyFounderSex')?.value || '';
  let founderName = document.getElementById('companyFounderName')?.value || '';
  let founderBirthCity = document.getElementById('companyFounderBirthCity')?.value || '';
  let regCity = document.getElementById('companyRegCity')?.value || '';
  let existingName = document.getElementById('companyName')?.value.trim() || '';
  let mainBiz = document.getElementById('companyMainBiz')?.value.trim() || '';
  let preferWuxing = document.getElementById('preferWuxing')?.value || '';
  let avoidNumbers = document.getElementById('avoidNumbers')?.value.trim() || '';
  
  // 显示加载状态
  let btn = document.getElementById('companyBtn');
  if (btn) { btn.disabled = true; btn.textContent = '正在生成...'; }
  
  // 分析法人八字
  let baziAnalysis = analyzeFounderBazi(founderBazi);
  let baziInfo = null;
  if (founderBazi) {
    baziInfo = getBaziInfo(founderBazi, founderHour);
    if (baziInfo && baziInfo.hasBazi) {
      // 自动设置喜用神
      if (!preferWuxing) preferWuxing = baziInfo.xiShen;
    }
  }
  
  // 显示法人八字分析
  let baziResultEl = document.getElementById('companyBaziResult');
  if (baziResultEl && baziInfo && baziInfo.hasBazi) {
    baziResultEl.style.display = 'block';
    let bHtml = '<div style="background:rgba(39,174,96,0.04);border:1px solid rgba(39,174,96,0.12);border-radius:8px;padding:14px">';
    bHtml += '<h5 style="font-size:14px;color:var(--jade);margin-bottom:10px;letter-spacing:2px">🌟 法人八字用神分析</h5>';
    if (founderName) bHtml += '<div style="font-size:13px;margin-bottom:8px">法人：<b style="color:var(--gold)">' + founderName + '</b>' + (founderSex ? '（' + (founderSex==='male'?'男':'女') + '）' : '') + '</div>';
    bHtml += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin-bottom:12px">';
    bHtml += '<div style="text-align:center;padding:8px;background:rgba(201,168,76,.04);border-radius:6px"><div style="font-size:11px;opacity:.95">日主</div><div style="font-size:14px;font-weight:bold;color:var(--gold)">' + baziInfo.dayStem + '(' + baziInfo.dayWx + ')</div></div>';
    bHtml += '<div style="text-align:center;padding:8px;background:rgba(39,174,96,.04);border-radius:6px"><div style="font-size:11px;opacity:.95">用神</div><div style="font-size:14px;font-weight:bold;color:var(--jade)">' + baziInfo.xiShen + '</div></div>';
    bHtml += '<div style="text-align:center;padding:8px;background:rgba(231,76,60,.04);border-radius:6px"><div style="font-size:11px;opacity:.95">忌神</div><div style="font-size:14px;font-weight:bold;color:var(--cinn2)">' + baziInfo.jiShen + '</div></div>';
    bHtml += '</div>';
    if (founderBirthCity) bHtml += '<div style="font-size:11px;opacity:.95">出生地：' + founderBirthCity + (regCity ? ' | 注册地：' + regCity : '') + '</div>';
    bHtml += '<div style="font-size:12px;opacity:.7;margin-top:6px">建议公司名五行偏「<b style="color:var(--jade)">' + baziInfo.xiShen + '</b>」，有助法人运势。</div>';
    bHtml += '</div>';
    baziResultEl.innerHTML = bHtml;
  } else if (baziResultEl) {
    baziResultEl.style.display = 'none';
  }
  
  // 如果有现有公司名，先分析
  if (existingName) {
    // 先分析现有公司名
    let existingWuge = calculateCompanyWuge(existingName);
    if (existingWuge) {
      let existingAnalysis = '已有公司名「' + existingName + '」分析：';
      existingAnalysis += ' 天格' + existingWuge.tianGe + '(' + existingWuge.tianGeWuxing + ')';
      existingAnalysis += ' 人格' + existingWuge.renGe + '(' + existingWuge.renGeWuxing + ')';
      existingAnalysis += ' 地格' + existingWuge.diGe + '(' + existingWuge.diGeWuxing + ')';
      existingAnalysis += ' 总格' + existingWuge.zongGe + '(' + existingWuge.zongGeWuxing + ')';
      // console.log(existingAnalysis);
    }
  }
  
  // 调用原始生成函数
  generateCompanyNames();
  
  // 如果有注册地，追加注册注意事项
  if (regCity) {
    setTimeout(function() {
      let grid = document.getElementById('companyNamesGrid');
      if (grid) {
        let notice = document.createElement('div');
        notice.style.cssText = 'margin-top:16px;padding:14px;background:rgba(0,100,150,0.04);border:1px solid rgba(0,100,150,0.12);border-radius:8px';
        notice.innerHTML = '<h5 style="font-size:13px;color:var(--cyan);margin-bottom:8px;letter-spacing:2px">📍 注册注意事项</h5>';
        notice.insertAdjacentHTML('beforeend', '<div style="font-size:12px;opacity:.7;line-height:2">');
        notice.insertAdjacentHTML('beforeend', '· 注册地：' + regCity + '<br>');
        notice.insertAdjacentHTML('beforeend', '· 建议在注册前核查工商名称是否可用<br>');
        notice.insertAdjacentHTML('beforeend', '· 公司名应避免与同行业知名企业雷同<br>');
        notice.insertAdjacentHTML('beforeend', '· 建议同时注册商标保护品牌<br>');
        if (mainBiz) notice.insertAdjacentHTML('beforeend', '· 主营方向：' + mainBiz + '，建议名称与业务相关联<br>');
        notice.insertAdjacentHTML('beforeend', '</div>');
        grid.appendChild(notice);
      }
    }, 500);
  }
 } catch(e) {
  console.error('[公司取名增强错误]', e.message, e.stack);
  showToast('公司取名出错: ' + e.message);
  let _btn = document.getElementById('companyBtn');
  if(_btn){_btn.disabled=false;_btn.textContent='AI智能取名';}
 }
}

// ===== 姓名分析（独立tab） =====
function runNameAnalysis() {
 try {
  let name = document.getElementById('analyzeNameInput')?.value.trim() || '';
  let sex = document.getElementById('analyzeSex')?.value || 'male';
  let birthDate = document.getElementById('analyzeBirthDate')?.value || '';
  let birthHour = document.getElementById('analyzeBirthHour')?.value || '';
  
  if (!name) { showToast('请输入姓名'); return; }
  
  let resultEl = document.getElementById('nameAnalyzeResult');
  let outputEl = document.getElementById('nameAnalyzeOutput');
  if (!resultEl || !outputEl) return;
  resultEl.style.display = 'block';
  
  // 计算三才五格
  let wuge = calculateWuge(name);
  if (!wuge || wuge.error) {
    outputEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--cinn2)">无法计算「' + name + '」的三才五格，可能包含生僻字</div>';
    return;
  }
  
  // 分析三才配置
  let sancai = analyzeSancai(wuge);
  
  // 音律分析
  let yinlv = analyzeYinlv(name);
  
  // 寓意分析
  let yuyi = analyzeYuyi(name);
  
  // 谐音检测
  let xieyin = checkXieyin(name);
  
  // 计算综合评分
  let score = calculateNameScore(wuge, sancai, yinlv, yuyi, xieyin);
  
  // 八字用神分析
  let baziYongshen = null;
  if (birthDate) {
    try {
      let parts = birthDate.split('-');
      let hourVal = birthHour !== '' ? parseInt(birthHour) * 2 : 12;
      let bazi = computeBaziCore(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]), hourVal);
      if (bazi) {
        let eleCount = {'金':0,'木':0,'水':0,'火':0,'土':0};
        for (let i = 0; i < 4; i++) {
          if (bazi.pillars[i] && bazi.pillars[i].element) eleCount[bazi.pillars[i].element] = (eleCount[bazi.pillars[i].element]||0) + 1;
        }
        let weakest = '木', minCount = 99;
        let strongest = '木', maxCount = 0;
        for (let e in eleCount) {
          if (eleCount[e] < minCount) { minCount = eleCount[e]; weakest = e; }
          if (eleCount[e] > maxCount) { maxCount = eleCount[e]; strongest = e; }
        }
        baziYongshen = {
          element: weakest,
          jiShen: strongest,
          dayStem: bazi.pillars[2] ? bazi.pillars[2].stem : '甲',
          dayEle: bazi.pillars[2] ? (bazi.pillars[2].element || '木') : '木',
          eleCount: eleCount
        };
      }
    } catch(e) { console.warn('八字用神计算失败:', e.message); }
  }
  
  let html = '';
  // 标题
  html += '<div style="text-align:center;margin-bottom:20px">';
  html += '<h3 style="font-family:\'Ma Shan Zheng\',serif;font-size:28px;letter-spacing:4px;color:var(--gold);margin-bottom:8px">' + name + '</h3>';
  html += '<p style="font-size:12px;opacity:.95;letter-spacing:2px">性别：' + (sex==='male'?'男':'女') + (birthDate?' | 出生：'+birthDate : '') + '</p>';
  html += '</div>';
  
  // 八字用神
  if (baziYongshen) {
    html += '<div style="background:rgba(39,174,96,0.04);border:1px solid rgba(39,174,96,0.12);border-radius:8px;padding:14px;margin-bottom:16px">';
    html += '<h5 style="font-size:13px;color:var(--jade);margin-bottom:8px;letter-spacing:2px">🌟 八字用神分析</h5>';
    html += '<div style="font-size:12px;opacity:.7;line-height:1.8">日主：<b style="color:var(--gold)">' + baziYongshen.dayStem + '(' + baziYongshen.dayEle + ')</b> | 用神：<b style="color:var(--jade)">' + baziYongshen.element + '</b> | 忌神：<b style="color:var(--cinn2)">' + baziYongshen.jiShen + '</b></div>';
    html += '<div style="font-size:12px;opacity:.7;line-height:1.8;margin-top:4px">五行分布：';
    for(let e3 in baziYongshen.eleCount) { html += e3 + ':' + baziYongshen.eleCount[e3] + ' '; }
    html += '</div>';
    html += '</div>';
  }
  
  // 五格数理
  html += '<div style="margin-bottom:16px"><h5 style="font-size:13px;letter-spacing:4px;color:var(--gold);margin-bottom:10px">五格数理</h5>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px">';
  let items = [
    {label:'天格',val:wuge.tianGe,wx:wuge.tianGeWuxing,luck:getWugeLuck(wuge.tianGe)},
    {label:'人格',val:wuge.renGe,wx:wuge.renGeWuxing,luck:getWugeLuck(wuge.renGe)},
    {label:'地格',val:wuge.diGe,wx:wuge.diGeWuxing,luck:getWugeLuck(wuge.diGe)},
    {label:'总格',val:wuge.zongGe,wx:wuge.zongGeWuxing,luck:getWugeLuck(wuge.zongGe)},
    {label:'外格',val:wuge.waiGe,wx:wuge.waiGeWuxing,luck:getWugeLuck(wuge.waiGe)}
  ];
  items.forEach(function(item) {
    let luckText = item.luck==='lucky'?'吉':(item.luck==='neutral'?'半吉':'凶');
    let luckColor = item.luck==='lucky'?'var(--success)':(item.luck==='neutral'?'var(--gold)':'var(--cinn2)');
    html += '<div style="padding:10px;border-radius:8px;background:rgba(255,255,255,.02);border:1px solid ' + luckColor + '30;text-align:center">';
    html += '<div style="font-size:11px;opacity:.95">' + item.label + '</div>';
    html += '<div style="font-size:18px;font-weight:bold;color:' + luckColor + '">' + item.val + '</div>';
    html += '<div style="font-size:11px;opacity:.6">' + item.wx + '</div>';
    html += '<div style="font-size:11px;color:' + luckColor + '">' + luckText + '</div>';
    html += '</div>';
  });
  html += '</div></div>';
  
  // 三才配置
  if (sancai) {
    html += '<div style="margin-bottom:16px"><h5 style="font-size:13px;letter-spacing:4px;color:var(--gold);margin-bottom:10px">三才配置</h5>';
    html += '<div style="padding:12px;background:rgba(255,255,255,.02);border:1px solid rgba(201,168,76,.08);border-radius:8px;font-size:13px;line-height:1.8">';
    html += '天格' + sancai.tian + ' → 人格' + sancai.ren + ' → 地格' + sancai.di;
    if (sancai.luck) html += '（' + sancai.luck + '）';
    html += '</div></div>';
  }
  
  // 音律分析
  if (yinlv) {
    html += '<div style="margin-bottom:16px"><h5 style="font-size:13px;letter-spacing:4px;color:var(--gold);margin-bottom:10px">音律分析</h5>';
    html += '<div style="padding:12px;background:rgba(255,255,255,.02);border:1px solid rgba(201,168,76,.08);border-radius:8px;font-size:12px;line-height:1.8">';
    if (yinlv.pinyin) html += '拼音：' + yinlv.pinyin + '<br>';
    if (yinlv.tone) html += '声调：' + yinlv.tone + '<br>';
    if (yinlv.analysis) html += yinlv.analysis;
    html += '</div></div>';
  }
  
  // 五行匹配
  html += '<div style="margin-bottom:16px"><h5 style="font-size:13px;letter-spacing:4px;color:var(--gold);margin-bottom:10px">五行匹配</h5>';
  html += '<div style="padding:12px;background:rgba(255,255,255,.02);border:1px solid rgba(201,168,76,.08);border-radius:8px;font-size:12px;line-height:1.8">';
  html += '天格' + wuge.tianGeWuxing + ' | 人格' + wuge.renGeWuxing + ' | 地格' + wuge.diGeWuxing + ' | 总格' + wuge.zongGeWuxing + ' | 外格' + wuge.waiGeWuxing;
  if (baziYongshen) {
    let nameWxList = [wuge.tianGeWuxing, wuge.renGeWuxing, wuge.diGeWuxing, wuge.zongGeWuxing, wuge.waiGeWuxing];
    let xiCount = nameWxList.filter(function(w){return w===baziYongshen.element;}).length;
    let jiCount = nameWxList.filter(function(w){return w===baziYongshen.jiShen;}).length;
    html += '<br>与八字用神匹配：' + baziYongshen.element + '出现' + xiCount + '次，' + baziYongshen.jiShen + '出现' + jiCount + '次';
    if (xiCount >= 2) html += '<br><span style="color:var(--success)">✓ 五行匹配度较高，有助补益命局</span>';
    else if (jiCount >= 3) html += '<br><span style="color:var(--cinn2)">⚠ 忌神五行偏多，建议考虑改名</span>';
    else html += '<br><span style="color:var(--gold)">五行匹配度一般</span>';
  }
  html += '</div></div>';
  
  // 综合评分
  html += '<div style="text-align:center;padding:20px;background:rgba(201,168,76,.05);border-radius:12px;margin-top:16px">';
  html += '<div style="font-size:11px;opacity:.95;margin-bottom:6px;letter-spacing:2px">综合评分</div>';
  let scoreColor = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--gold)' : 'var(--cinn2)';
  html += '<div style="font-size:36px;font-weight:bold;color:' + scoreColor + '">' + score + '</div>';
  let scoreLevel = score >= 80 ? '优' : score >= 70 ? '良' : score >= 60 ? '中' : '差';
  html += '<div style="font-size:14px;color:' + scoreColor + ';margin-top:4px">' + scoreLevel + '</div>';
  html += '</div>';
  
  outputEl.innerHTML = html;
 } catch(e) {
  console.error('[姓名分析错误]', e.message, e.stack);
  showToast('姓名分析出错: ' + e.message);
  let _el = document.getElementById('nameAnalyzeOutput');
  if(_el) _el.innerHTML = '<div style="padding:20px;color:var(--cinn2)">姓名分析出错: '+e.message+'</div>';
 }
}

function analyzeName(currentName, newName, sex, birthDate) {
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
}

function displayWuge(wuge) {
  const grid = document.getElementById('wugeGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const items = [
    { label: '天格', value: wuge.tianGe, wuxing: wuge.tianGeWuxing, luck: getWugeLuck(wuge.tianGe), desc: '代表祖先运，对人生影响较小。计算:姓氏笔画+1。' },
    { label: '人格', value: wuge.renGe, wuxing: wuge.renGeWuxing, luck: getWugeLuck(wuge.renGe), desc: '代表主运，姓名分析核心。计算:姓氏末字+名字首字笔画。' },
    { label: '地格', value: wuge.diGe, wuxing: wuge.diGeWuxing, luck: getWugeLuck(wuge.diGe), desc: '代表前运(36岁前)。单名:名字笔画+1;双名:名字各字笔画和。' },
    { label: '总格', value: wuge.zongGe, wuxing: wuge.zongGeWuxing, luck: getWugeLuck(wuge.zongGe), desc: '代表后运(36岁后),影响一生总运势。计算:姓名全部字笔画和。' },
    { label: '外格', value: wuge.waiGe, wuxing: wuge.waiGeWuxing, luck: getWugeLuck(wuge.waiGe), desc: '代表副运，影响社交与外在表现。计算:总格-人格+1。' }
  ];

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'wuge-item';
    div.innerHTML = `
      <div class="wuge-label">${item.label}</div>
      <div class="wuge-value">${item.value}</div>
      <div class="wuge-element">${item.wuxing}</div>
      <div class="wuge-luck ${item.luck}">${item.luck === 'lucky' ? '吉' : item.luck === 'neutral' ? '半吉' : '凶'}</div>
      <div class="wuge-desc" style="font-size: 10px; opacity: 0.5; margin-top: 6px; line-height: 1.4;">${item.desc}</div>
    `;
    grid.appendChild(div);
  });

  // 升级内容:添加五格详解和经典引用
  const analysisEl = document.getElementById('renameWuxingAnalysis');
  if (analysisEl) {
    analysisEl.innerHTML = `
      <div style="font-size: 13px; line-height: 2; opacity: 0.85; letter-spacing: 1px;">
        <p><strong style="color: var(--gold);">五格数理吉凶:</strong></p>
        <p>天格${wuge.tianGe}(${getWugeLuck(wuge.tianGe) === 'lucky' ? '吉' : getWugeLuck(wuge.tianGe) === 'neutral' ? '半吉' : '凶'})· 人格${wuge.renGe}(${getWugeLuck(wuge.renGe) === 'lucky' ? '吉' : getWugeLuck(wuge.renGe) === 'neutral' ? '半吉' : '凶'})· 地格${wuge.diGe}(${getWugeLuck(wuge.diGe) === 'lucky' ? '吉' : getWugeLuck(wuge.diGe) === 'neutral' ? '半吉' : '凶'})· 总格${wuge.zongGe}(${getWugeLuck(wuge.zongGe) === 'lucky' ? '吉' : getWugeLuck(wuge.zongGe) === 'neutral' ? '半吉' : '凶'})· 外格${wuge.waiGe}(${getWugeLuck(wuge.waiGe) === 'lucky' ? '吉' : getWugeLuck(wuge.waiGe) === 'neutral' ? '半吉' : '凶'})</p>
        <p style="margin-top: 8px;"><strong style="color: var(--gold);">五行分析:</strong>天格${wuge.tianGeWuxing} · 人格${wuge.renGeWuxing} · 地格${wuge.diGeWuxing} · 总格${wuge.zongGeWuxing} · 外格${wuge.waiGeWuxing}</p>
        <p style="margin-top: 8px; font-size: 11px; opacity: 0.6;">📜 经典出处:《梅花易数》(宋·邵雍)以数理推断吉凶；《姓名学》(日·熊崎健翁)创立五格剖象法。</p>
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

  // 添加经典引用
  html += `<p style="font-size: 11px; opacity: 0.6; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(201,168,76,.1);">📜 经典出处:《说文解字》(汉·许慎)解释字的本义；《诗经》、《楚辞》为取名宝库。</p>`;

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
        yinlvDiv.insertAdjacentHTML('beforeend', noXieyinHtml);
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
</head>
<body>
  <h1>改名分析报告</h1>
  <div class="result">${resultEl.innerHTML}</div>
  <p style="text-align: center; opacity: .4; margin-top: 40px;">易道智鉴 · 仅供参考</p>
\x3cscript src="knowledge-models/classics-model.js"><\/script>
\x3cscript src="knowledge-models/faith-model.js"><\/script>
\x3cscript src="knowledge-models/fengshui-model.js"><\/script>
\x3cscript src="knowledge-models/huajie-model.js"><\/script>
\x3cscript src="knowledge-models/liuren-model.js"><\/script>
\x3cscript src="knowledge-models/liuyao-model.js"><\/script>
\x3cscript src="knowledge-models/mantra-model.js"><\/script>
\x3cscript src="knowledge-models/meihua-model.js"><\/script>
\x3cscript src="knowledge-models/nihaisha-model.js"><\/script>
\x3cscript src="knowledge-models/qimen-model.js"><\/script>
\x3cscript src="knowledge-models/shuhan-model.js"><\/script>
\x3cscript src="knowledge-models/yanzhi-model.js"><\/script>
\x3cscript src="knowledge-models/yijing-model.js"><\/script>
\x3cscript src="knowledge-models/ziwei-model.js"><\/script>
\x3cscript src="knowledge-models/zodiac-model.js"><\/script>
</body>

\x3cscript>
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
    result.classList.add('visible');
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
    '1': '水', '2': '火',
    '3': '木', '4': '金',
    '5': '土', '6': '水',
    '7': '火', '8': '木',
    '9': '金', '0': '土'
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
  medical: { name: '医疗', wuxing: '木', prefer: ['水', '木'], avoid: ['金', '土'], desc: '医疗属木，宜水木相生，忌金土克耗' },
  food: { name: '餐饮', wuxing: '火', prefer: ['木', '火'], avoid: ['金', '水'], desc: '餐饮属火，宜木火相生，忌金水克泄' },
  realestate: { name: '房地产', wuxing: '土', prefer: ['火', '土'], avoid: ['木', '水'], desc: '房地产属土，宜火土相生，忌木水克耗' },
  culture: { name: '文化', wuxing: '木', prefer: ['水', '木'], avoid: ['金', '土'], desc: '文化属木，宜水木相生，忌金土克耗' },
  other: { name: '其他', wuxing: '土', prefer: ['火', '土'], avoid: ['木', '水'], desc: '通用属土，宜火土相生，忌木水克耗' }
};

// 创始人八字分析
function analyzeFounderBazi(baziStr) {
  if (!baziStr || baziStr.trim() === '') return null;
  
  const wuxingCount = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
  const chars = baziStr.trim().split(/\s+/);
  
  const tiangan = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' };
  const dizhi = { '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水' };
  
  chars.forEach(char => {
    if (tiangan[char]) wuxingCount[tiangan[char]]++;
    if (dizhi[char]) wuxingCount[dizhi[char]]++;
  });
  
  const sorted = Object.entries(wuxingCount).sort((a, b) => a[1] - b[1]);
  const yongshen = sorted[0][0];
  const jishen = sorted[sorted.length - 1][0];
  
  return {
    bazi: baziStr,
    wuxingCount,
    yongshen,
    jishen,
    advice: `创始人八字五行${yongshen}弱，宜补${yongshen}；${jishen}旺，忌${jishen}。`
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
function generateCompanyNames() {
 try {
  const industry = (document.getElementById('companyIndustry')||{}).value || 'tech';
  const wordCount = parseInt((document.getElementById('companyWordCount')||{}).value) || 3;
  const style = (document.getElementById('companyStyle')||{}).value || '大气';
  const founderBazi = ((document.getElementById('companyFounderBazi')||{}).value||'').trim();
  const founderHour = document.getElementById('companyFounderHour')?.value || '';
  const founderSex = document.getElementById('companyFounderSex')?.value || 'male';
  const founderBirthCity = document.getElementById('companyFounderBirthCity')?.value || '';
  const preferWuxing = (document.getElementById('preferWuxing')||{}).value || '';
  const avoidNumbers = ((document.getElementById('avoidNumbers')||{}).value||'').trim();

  // 显示加载状态
  const btn = document.getElementById('companyBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '正在生成...';
  }

  // 分析法人八字（优先用日期+时辰精准计算）
  let baziAnalysis = null;
  if (founderBazi && typeof computeBaziCore === 'function') {
    try {
      let parts = founderBazi.split('-');
      let hourVal = founderHour !== '' ? parseInt(founderHour) * 2 : 12;
      let bazi = computeBaziCore(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]), hourVal);
      if (bazi) {
        let eleCount = {'金':0,'木':0,'水':0,'火':0,'土':0};
        for (let i = 0; i < 4; i++) {
          if (bazi.pillars[i] && bazi.pillars[i].element) eleCount[bazi.pillars[i].element] = (eleCount[bazi.pillars[i].element]||0) + 1;
        }
        let weakest = '木', minCount = 99;
        for (let e in eleCount) { if (eleCount[e] < minCount) { minCount = eleCount[e]; weakest = e; } }
        baziAnalysis = {
          yongshen: weakest,
          dayStem: bazi.pillars[2] ? bazi.pillars[2].stem : '甲',
          eleCount: eleCount,
          sex: founderSex,
          birthCity: founderBirthCity
        };
      }
    } catch(e) { console.warn('法人八字计算失败:', e.message); }
  }
  if (!baziAnalysis) baziAnalysis = analyzeFounderBazi(founderBazi);

  // 如果用户未手动选喜用神，但八字分析出了用神，自动设置
  if (!preferWuxing && baziAnalysis && baziAnalysis.yongshen) {
    // 用八字用神作为喜用神
  }

  // 获取行业用字
  const chars = INDUSTRY_CHARS[industry] || INDUSTRY_CHARS['other'];

  // 智能命名策略
  const names = [];
  const usedNames = new Set();

  // 策略1: 根据风格选择核心字
  const stylePrefixes = {
    modern: ['智','创','新','锐','领','先','科','技','未','来'],
    traditional: ['德','仁','义','礼','信','诚','和','泰','盛','隆'],
    elegant: ['雅','馨','瑞','祥','和','美','华','丽','锦','绣'],
    bold: ['宏','伟','巨','大','强','盛','隆','昌','旺','达']
  };
  const styleSuffixes = {
    modern: ['达','通','联','网','云','芯','能','源','创','新'],
    traditional: ['堂','轩','阁','斋','苑','居','府','院','楼','庄'],
    elegant: ['轩','阁','苑','庭','园','居','舍','坊','社','馆'],
    bold: ['达','盛','隆','昌','旺','发','兴','荣','华','贵']
  };

  const prefixes = stylePrefixes[style] || stylePrefixes.modern;
  const suffixes = styleSuffixes[style] || styleSuffixes.modern;

  // 策略2: 根据喜用神选择五行字
  const wuxingChars = {
    木: ['林','森','栋','梁','材','茂','荣','华','春','生'],
    火: ['炎','炜','灿','耀','辉','明','亮','照','光','热'],
    土: ['坤','地','基','础','稳','固','城','垣','培','基'],
    金: ['金','鑫','锐','锋','铭','钧','钰','银','铜','铁'],
    水: ['源','泉','泽','润','涵','洁','清','深','远','阔']
  };

  // 生成高质量公司名
  let attempts = 0;
  const maxAttempts = 200;

  while (names.length < 8 && attempts < maxAttempts) {
    attempts++;
    let name = '';

    // 策略轮换
    const strategy = attempts % 4;

    if (strategy === 0) {
      // 风格前缀 + 行业字
      name = prefixes[Math.floor((Date.now() / 1000 + attempts * 3) % prefixes.length)];
      for (let i = 1; i < wordCount; i++) {
        name += chars[Math.floor((Date.now() / 1000 + attempts * 7 + i * 11) % chars.length)];
      }
    } else if (strategy === 1) {
      // 行业字 + 风格后缀
      for (let i = 0; i < wordCount - 1; i++) {
        name += chars[Math.floor((Date.now() / 1000 + attempts * 5 + i * 9) % chars.length)];
      }
      name += suffixes[Math.floor((Date.now() / 1000 + attempts * 13) % suffixes.length)];
    } else if (strategy === 2 && preferWuxing && wuxingChars[preferWuxing]) {
      // 喜用神五行字 + 行业字
      const wxChars = wuxingChars[preferWuxing];
      name = wxChars[Math.floor((Date.now() / 1000 + attempts * 17) % wxChars.length)];
      for (let i = 1; i < wordCount; i++) {
        name += chars[Math.floor((Date.now() / 1000 + attempts * 19 + i * 7) % chars.length)];
      }
    } else {
      // 纯随机（但保证质量）
      for (let i = 0; i < wordCount; i++) {
        // 优先选择康熙笔画吉利的字
        const filteredChars = chars.filter(c => {
          const stroke = KANGXI_STROKES[c];
          return stroke && [1,3,5,6,7,8,11,13,15,16,17,18,21,23,24,25,29,31,32,33,35,37,39,41,45,47,48,52,57,61,63,65,67,68,81].includes(stroke);
        });
        if (filteredChars.length > 0 && (Date.now() / 1000 + attempts) % 10 > 3) {
          name += filteredChars[Math.floor((Date.now() / 1000 + attempts * 23 + i * 5) % filteredChars.length)];
        } else {
          name += chars[Math.floor((Date.now() / 1000 + attempts * 29 + i * 3) % chars.length)];
        }
      }
    }

    // 检查重复
    if (usedNames.has(name)) continue;

    // 检查避开数理
    if (avoidNumbers) {
      const avoidList = avoidNumbers.split(/[,，、\s]+/).map(n => parseInt(n.trim())).filter(n => !isNaN(n));
      const wuge = calculateCompanyWuge(name);
      if (wuge) {
        const allGe = [wuge.tianGe, wuge.renGe, wuge.diGe, wuge.waiGe, wuge.zongGe];
        if (avoidList.some(n => allGe.includes(n))) continue;
      }
    }

    // 检查三才配置
    const wuge = calculateCompanyWuge(name);
    if (wuge) {
      const sancai = `${wuge.tianGeWuxing}${wuge.renGeWuxing}${wuge.diGeWuxing}`;
      const sancaiInfo = SANCAI_CONFIG[sancai];
      // 优先选择吉利的配置
      if (sancaiInfo && (sancaiInfo.luck === '凶' || sancaiInfo.score < 50)) {
        if ((Date.now() / 1000 + attempts) % 10 > 3) continue; // 30%概率保留，增加多样性
      }
    }

    usedNames.add(name);
    names.push(name);
  }

  // 按评分排序
  const scoredNames = names.map(name => {
    const wuge = calculateCompanyWuge(name);
    let score = 70;
    if (wuge) {
      const sancai = `${wuge.tianGeWuxing}${wuge.renGeWuxing}${wuge.diGeWuxing}`;
      const sancaiInfo = SANCAI_CONFIG[sancai] || { score: 60 };
      score = sancaiInfo.score;
    }
    return { name, score };
  }).sort((a, b) => b.score - a.score).map(n => n.name);

  // 显示结果
  displayCompanyNamesPro(scoredNames, industry, style, baziAnalysis);

  // 恢复按钮状态
  if (btn) {
    btn.disabled = false;
    btn.textContent = '生 成 专 业 公 司 名';
  }
 } catch(e) {
  console.error('[公司取名错误]', e.message, e.stack);
  showToast('公司取名出错: ' + e.message);
  let _btn = document.getElementById('companyBtn');
  if(_btn){_btn.disabled=false;_btn.textContent='生 成 专 业 公 司 名';}
 }
}

// 显示公司名（升级版）
function displayCompanyNamesPro(names, industry, style, baziAnalysis) {
  const grid = document.getElementById('companyNamesGrid');
  if (!grid) return;
  grid.innerHTML = '';

  // 显示行业五行表和康熙笔画参照
  const industryTable = document.getElementById('industryWuxingTable');
  const kangxiRef = document.getElementById('kangxiStrokesRef');
  if (industryTable) industryTable.style.display = 'block';
  if (kangxiRef) kangxiRef.style.display = 'block';

  // 填充行业五行表
  fillIndustryTable();
  // 填充康熙笔画参照
  fillKangxiRef();

  names.forEach((name, index) => {
    const wuge = calculateCompanyWuge(name);
    let score = 0;
    let analysis = '';
    let detailHTML = '';
    let aiPrediction = '';

    if (wuge) {
      const sancai = analyzeSancaiDetail(wuge);
      const scoreResult = calculateCompanyScore(wuge, sancai, industry, baziAnalysis);
      score = scoreResult.score;
      analysis = `三才:${sancai.tian}→${sancai.ren}→${sancai.di}（${sancai.luck}）| 评分:${score}分`;

      // AI预测分析
      aiPrediction = generateAIPrediction(name, wuge, sancai, industry, baziAnalysis);

      // 生成详细分析报告
      detailHTML = generateDetailAnalysis(name, wuge, sancai, scoreResult, industry, baziAnalysis, aiPrediction);
    } else {
      score = 70;
      analysis = '无法计算三才五格（可能含生僻字）';
    }

    // 评分颜色
    const scoreColor = score >= 85 ? 'var(--green)' : score >= 70 ? 'var(--gold)' : 'var(--red)';

    const card = document.createElement('div');
    card.className = 'company-name-card';
    card.innerHTML = `
      <button class="cn-save-btn" onclick="saveCompanyName('${name}')">收藏</button>
      <div class="cn-name">${name}</div>
      <div class="cn-score">综合评分:<span style="color:${scoreColor};font-weight:bold">${score}</span>分 | ${industry} | ${style}</div>
      <div class="cn-analysis">${analysis}</div>
      ${aiPrediction ? `<div class="cn-ai-prediction"><span style="color:var(--cyan)">🔮 AI预测:</span>${aiPrediction}</div>` : ''}
      <button class="action-btn" style="margin-top:8px;font-size:11px;padding:4px 12px;" onclick="toggleDetailAnalysis(${index})">查看详细分析</button>
      <div id="detail-${index}" style="display:none;margin-top:12px;">${detailHTML}</div>
    `;
    grid.appendChild(card);
  });

  // 显示结果区域
  const resultDiv = document.getElementById('companyResult');
  if (resultDiv) resultDiv.classList.add('visible');

  const bannerMeta = document.getElementById('companyBannerMeta');
  if (bannerMeta) bannerMeta.textContent = `行业:${industry} | 字数:${names[0] ? names[0].length : 0}字 | 风格:${style}`;

  // 显示示例分析
  const exampleDiv = document.getElementById('exampleAnalysis');
  if (exampleDiv) {
    exampleDiv.style.display = 'block';
    fillExampleAnalysis();
  }
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
    html += '<ml-tap onclick="showYijingGuaDetail(' + i + ')" id="yj-card-' + i + '" class="yj-gua-card" variant="card" role="button" tabindex="0">' +
      '<div style="font-size:22px;margin-bottom:3px">' + g.symbol + '</div>' +
      '<div style="font-size:12px;color:var(--gold);font-weight:bold">' + g.name + '</div>' +
      '<div style="font-size:10px;color:var(--paper2);opacity:.7">' + g.pinyin + '</div>' +
    '</ml-tap>';
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
  let baziInfo = {
    name: document.getElementById('ceziName')?.value || '',
    birthDate: document.getElementById('ceziBirthDate')?.value || '',
    birthHour: document.getElementById('ceziBirthHour')?.value || ''
  };
  renderCeziSectionResult(char, baziInfo);
}

function randomCeziSection() {
  let keys = Object.keys(CEZI_DATA);
  let char = keys[Math.floor((Date.now() / 1000) % keys.length)];
  let input = document.getElementById('ceziSectionInput');
  if (input) input.value = char;
  let baziInfo = {
    name: document.getElementById('ceziName')?.value || '',
    birthDate: document.getElementById('ceziBirthDate')?.value || '',
    birthHour: document.getElementById('ceziBirthHour')?.value || ''
  };
  renderCeziSectionResult(char, baziInfo);
}

function ceziSectionQuick(char) {
  let input = document.getElementById('ceziSectionInput');
  if (input) input.value = char;
  let baziInfo = {
    name: document.getElementById('ceziName')?.value || '',
    birthDate: document.getElementById('ceziBirthDate')?.value || '',
    birthHour: document.getElementById('ceziBirthHour')?.value || ''
  };
  renderCeziSectionResult(char, baziInfo);
}

function renderCeziSectionResult(char, baziInfo) {
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
  
  // 如果有生辰八字信息，追加个性化解读
  if (baziInfo && baziInfo.birthDate) {
    verdict += '<br><br>';
    verdict += '<span style="color:var(--gold2);font-size:12px">📝 结合生辰八字的个性化解读：</span><br>';
    if (baziInfo.name) verdict += '缘主「' + baziInfo.name + '」，';
    try {
      let parts = baziInfo.birthDate.split('-');
      let hourVal = baziInfo.birthHour !== '' ? parseInt(baziInfo.birthHour) * 2 : 12;
      if (typeof computeBaziCore === 'function') {
        let bazi = computeBaziCore(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]), hourVal);
        if (bazi && bazi.pillars && bazi.pillars[2]) {
          let dayStem = bazi.pillars[2].stem;
          let eleCount = {'金':0,'木':0,'水':0,'火':0,'土':0};
          for (let i = 0; i < 4; i++) {
            if (bazi.pillars[i] && bazi.pillars[i].element) eleCount[bazi.pillars[i].element] = (eleCount[bazi.pillars[i].element]||0) + 1;
          }
          let weakest = '木', minCount = 99;
          for (let e in eleCount) { if (eleCount[e] < minCount) { minCount = eleCount[e]; weakest = e; } }
          verdict += '日主' + dayStem + '（' + (typeof ELE !== 'undefined' && ELE[dayStem] ? ELE[dayStem] : '木') + '），用神为「' + weakest + '」。';
          if (result.wuxing === weakest) {
            verdict += '此字五行属' + result.wuxing + '，正合用神，补益命局，大吉。';
          } else {
            verdict += '此字五行属' + result.wuxing + '，与用神「' + weakest + '」不同，可作为辅助参考。';
          }
        }
      }
    } catch(e) { /* 八字计算失败，忽略 */ }
  }
  
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
    return '<ml-tap class="koujue-card" onclick="koujueToggleDetail(\''+id+'\')" variant="card" role="button" tabindex="0">' +
      '<button class="koujue-fav-btn'+(faved?' faved':'')+'" onclick="event.stopPropagation();koujueToggleFav(\''+id+'\')" title="'+(faved?'取消收藏':'收藏')+'">'+(faved?'⭐':'☆')+'</button>' +
      '<div class="koujue-name">'+name+'</div>' +
      '<div class="koujue-purpose">'+purpose+'</div>' +
      '<div class="koujue-preview">'+preview(text)+'</div>' +
    '</ml-tap>';
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
    for(let i=0;i<catKeys.length;i++){
      let ck=catKeys[i];
      let mantras=db[ck]&&db[ck].mantras;
      if(!mantras)continue;
      for(let j=0;j<mantras.length;j++){
        let m=mantras[j];
        let mid=m.id||(ck+'_'+(m.name||'').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g,'_'));
        if(mid===id){m._catKey=ck;return m;}
      }
    }
    // 搜索 life_wisdom
    if(db.life_wisdom&&db.life_wisdom.categories){
      let cats=db.life_wisdom.categories;
      for(let sk in cats){
        let tips=cats[sk].tips;
        if(!tips)continue;
        for(let j=0;j<tips.length;j++){
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
    if(mantras.length>8) h+='<ml-tap style="font-size:11px;color:var(--paper3);text-align:center;margin-top:8px;cursor:pointer" onclick="showSection(\'more\');showMoreModule(\'koujue\')" variant="card" role="button" tabindex="0">查看更多 → 📿口诀宝库</ml-tap>';
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
    localStorage.setItem('meritRecord', JSON.stringify(record));
    
    // Visual feedback
    let msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg,var(--ink3),var(--cyan));border:2px solid var(--gold);color:var(--gold);padding:20px 30px;border-radius:14px;font-size:16px;z-index:99999;text-align:center;box-shadow:0 0 40px rgba(201,168,76,0.3)';
    msg.innerHTML = '<div style="font-size:32px;margin-bottom:8px">🙏</div><div style="font-weight:bold">+' + amount + ' 功德</div>';
    if (reason) msg.insertAdjacentHTML('beforeend', '<div style="font-size:12px;color:var(--paper3);margin-top:6px">' + reason + '</div>');
    document.body.appendChild(msg);
    setTimeout(function(){msg.style.opacity='0';msg.style.transition='opacity 0.8s';setTimeout(function(){document.body.removeChild(msg);},800);}, 1500);
    
    // Update badge
    loadMeritRecord(faith);
}

// ============================================================
// 功德记录显示
// ============================================================
function loadMeritRecord(faith) {
    let record = safeGetJSON('meritRecord', {});
    let total = record['merit_total'] || 0;
    let faithMerit = record['merit_' + faith] || 0;
    
    // 在信众中心显示功德
    let meritDisplay = document.getElementById('meritDisplay');
    if (!meritDisplay) {
        // 动态创建功德显示面板
        let userBaziBind = document.getElementById('userBaziBind');
        if (userBaziBind && userBaziBind.parentNode) {
            meritDisplay = document.createElement('div');
            meritDisplay.id = 'meritDisplay';
            meritDisplay.style.cssText = 'background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.15);border-radius:12px;padding:16px 20px;margin-bottom:16px';
            userBaziBind.parentNode.insertBefore(meritDisplay, userBaziBind);
        }
    }
    if (meritDisplay) {
        let faithNames = {ru:'儒家', dao:'道家', fo:'佛家', all:'兼修'};
        let fname = faithNames[faith] || '修行';
        meritDisplay.innerHTML = '<div style="display:flex;align-items:center;gap:12px">' +
            '<div style="font-size:32px">🙏</div>' +
            '<div style="flex:1">' +
            '<div style="font-size:14px;color:var(--gold);font-weight:600">累计功德：' + total + ' 点</div>' +
            '<div style="font-size:12px;color:var(--paper3);margin-top:2px">' + fname + '修行：' + faithMerit + ' 点</div>' +
            '</div></div>';
    }
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
// 60甲子循环推送系统 — 年度运势+化解方案
// ============================================================
let GAN_ZHI_CYCLE = [
  '甲子','乙丑','丙寅','丁卯','戊辰','己巳','庚午','辛未','壬申','癸酉',
  '甲戌','乙亥','丙子','丁丑','戊寅','己卯','庚辰','辛巳','壬午','癸未',
  '甲申','乙酉','丙戌','丁亥','戊子','己丑','庚寅','辛卯','壬辰','癸巳',
  '甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑','壬寅','癸卯',
  '甲辰','乙巳','丙午','丁未','戊申','己酉','庚戌','辛亥','壬子','癸丑',
  '甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬戌','癸亥'
];

let GAN_ZHI_PROPERTIES = {
  '甲子':{wuxing:'水',taisui:'鼠',direction:'正北',energy:'生发之始',advice:'子年水旺，木火不足者宜早备火行化解物'},
  '乙丑':{wuxing:'土',taisui:'牛',direction:'东北',energy:'厚积薄发',advice:'丑年湿土厚重，金水不足者宜增金元素'},
  '丙寅':{wuxing:'木',taisui:'虎',direction:'东北',energy:'木火相生',advice:'寅年木旺，土弱脾胃虚者宜备土行调和物'},
  '丁卯':{wuxing:'木',taisui:'兔',direction:'正东',energy:'柔融通达',advice:'卯年木气偏柔，金不足者肺气易弱宜备金行物'},
  '戊辰':{wuxing:'土',taisui:'龙',direction:'东南',energy:'龙腾变化',advice:'辰年土旺水库，火弱心气不足者宜增火元素'},
  '己巳':{wuxing:'火',taisui:'蛇',direction:'东南',energy:'巳火渐旺',advice:'巳年火气渐升，水弱肾气不足者宜补水行物'},
  '庚午':{wuxing:'火',taisui:'马',direction:'正南',energy:'炎上之势',advice:'午年火极旺，水弱宜备强力水行化解物'},
  '辛未':{wuxing:'土',taisui:'羊',direction:'西南',energy:'未土燥热',advice:'未年土带火气，木弱肝气不足者宜备木行物'},
  '壬申':{wuxing:'金',taisui:'猴',direction:'西南',energy:'金水相生',advice:'申年金旺，木弱肝胆易伤宜备木行化解物'},
  '癸酉':{wuxing:'金',taisui:'鸡',direction:'正西',energy:'金气肃杀',advice:'酉年金锐，木火不足者宜早备温暖调和物'}
};

function getGanZhiProp(yearGz) {
  // 补充通用属性
  let stem = yearGz[0], branch = yearGz[1];
  let stems = '甲乙丙丁戊己庚辛壬癸', branches = '子丑寅卯辰巳午未申酉戌亥';
  let wuxing = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
  let zodiac = {'子':'鼠','丑':'牛','寅':'虎','卯':'兔','辰':'龙','巳':'蛇','午':'马','未':'羊','申':'猴','酉':'鸡','戌':'狗','亥':'猪'};
  let dirs = {'子':'正北','丑':'东北','寅':'东北','卯':'正东','辰':'东南','巳':'东南','午':'正南','未':'西南','申':'西南','酉':'正西','戌':'西北','亥':'西北'};
  let builtin = GAN_ZHI_PROPERTIES[yearGz];
  if (builtin) return builtin;
  return {
    wuxing: wuxing[stem] || '未知',
    taisui: zodiac[branch] || '未知',
    direction: dirs[branch] || '未知',
    energy: yearGz + '年',
    advice: '根据八字五行喜用选化解物品'
  };
}

function getCurrentYearGanzhi() {
  let now = new Date();
  let year = now.getFullYear();
  // 立春前算上年，4为甲子起始偏移(1984=甲子年)
  let offsetYear = (now < new Date(year, 1, 4)) ? year - 1 : year;
  let idx = (offsetYear - 4) % 60;
  if (idx < 0) idx += 60;
  return {ganzhi: GAN_ZHI_CYCLE[idx], idx: idx, year: offsetYear};
}

function getNextYears(startIdx, count) {
  let result = [];
  for (let i = 1; i <= count; i++) {
    let idx = (startIdx + i) % 60;
    result.push({ganzhi: GAN_ZHI_CYCLE[idx], idx: idx, year: (new Date().getFullYear() + i)});
  }
  return result;
}

// 年度推送渲染
function renderAnnualPush() {
  let statusEl = document.getElementById('annualPushStatus');
  let historyEl = document.getElementById('annualPushHistory');
  if (!statusEl || !historyEl) return;
  
  let current = getCurrentYearGanzhi();
  let prop = getGanZhiProp(current.ganzhi);
  let nextYears = getNextYears(current.idx, 3);
  let memberLevel = localStorage.getItem('memberLevel') || 'free';
  
  // 状态面板
  let html = '<div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.15);border-radius:12px;padding:16px;margin-bottom:16px">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">';
  html += '<div><span style="font-size:18px;color:var(--gold);font-family:Ma Shan Zheng,serif;letter-spacing:4px">' + current.ganzhi + '年</span>';
  html += '<span style="font-size:11px;color:var(--paper3);margin-left:8px">第' + (current.idx+1) + '/60甲子</span></div>';
  html += '<span class="rich-badge" style="font-size:10px;background:rgba(39,174,96,.15);color:var(--jade)">' + prop.taisui + '年·' + prop.wuxing + '行</span>';
  html += '</div>';
  html += '<div style="font-size:12px;color:var(--paper2);line-height:1.7;margin-bottom:10px">' + prop.energy + ' · 太岁方位：' + prop.direction + ' · ' + prop.advice + '</div>';
  
  // 会员权限判断
  let isTransition = isYearTransition() || memberLevel === 'lifetime';
  html += '<div style="display:flex;gap:10px;flex-wrap:wrap">';
  if (memberLevel === 'lifetime') {
    html += '<button onclick="generateAnnualPush()" style="padding:8px 18px;border:1px solid var(--gold);border-radius:8px;background:rgba(201,168,76,0.1);color:var(--gold);cursor:pointer;font-family:inherit;font-size:12px;letter-spacing:2px">🔄 生成年度运势+化解方案</button>';
  } else if (memberLevel === 'annual') {
    html += '<button onclick="generateAnnualPush()" style="padding:8px 18px;border:1px solid var(--gold);border-radius:8px;background:rgba(201,168,76,0.1);color:var(--gold);cursor:pointer;font-family:inherit;font-size:12px;letter-spacing:2px">🔄 生成年度运势概览</button>';
    html += '<button onclick="showToast(\'终身会员享完整60甲子循环化解方案\')" style="padding:8px 18px;border:1px solid var(--border);border-radius:8px;background:transparent;color:var(--cinn2);cursor:pointer;font-family:inherit;font-size:12px;letter-spacing:2px">👑 升级终身会员</button>';
  } else {
    html += '<button onclick="showToast(\'年度会员及以上可享年度运势推送。免费会员可查看60甲子流年纵览。\')" style="padding:8px 18px;border:1px solid var(--border);border-radius:8px;background:transparent;color:var(--paper3);cursor:pointer;font-family:inherit;font-size:12px;letter-spacing:2px">🔒 升级会员解锁完整推送</button>';
  }
  html += '</div>';
  html += '</div>';
  
  // 未来3年预览
  html += '<div style="background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:14px">';
  html += '<div style="font-size:13px;color:var(--gold);margin-bottom:10px">📅 未来三年循环推送预览</div>';
  nextYears.forEach(function(ny) {
    let np = getGanZhiProp(ny.ganzhi);
    html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(201,168,76,.06);font-size:12px">';
    html += '<div><b style="color:var(--gold2)">' + ny.ganzhi + '</b> <span style="color:var(--paper3)">' + ny.year + '年</span></div>';
    html += '<div style="color:var(--paper3);font-size:11px">' + np.taisui + '·' + np.wuxing + '·推' + (ny.idx-2+1) + '/' + (ny.idx-1+2) + '</div>';
    html += '</div>';
  });
  html += '</div>';
  
  statusEl.innerHTML = html;
  
  // 历史推送记录
  let pushHistory = safeGetJSON('annualPushHistory', []);
  if (pushHistory.length > 0) {
    let hHtml = '<div style="font-size:13px;color:var(--gold);margin-bottom:8px">📜 历史推送记录</div>';
    pushHistory.slice(-5).reverse().forEach(function(ph) {
      hHtml += '<div style="font-size:12px;color:var(--paper2);padding:4px 0;border-bottom:1px solid rgba(201,168,76,.04)">';
      hHtml += '<b>' + ph.ganzhi + '</b> <span style="opacity:.95">' + ph.date + '</span>';
      hHtml += ' <span style="font-size:10px;color:var(--jade)">' + (ph.type === 'full' ? '完整方案' : '运势概览') + '</span>';
      hHtml += '</div>';
    });
    historyEl.innerHTML = hHtml;
  }
}

// 年度推送生成
function generateAnnualPush() {
  let memberLevel = localStorage.getItem('memberLevel') || 'free';
  if (memberLevel === 'free') {
    showToast('请先升级为年度会员或终身会员');
    return;
  }
  let current = getCurrentYearGanzhi();
  let prop = getGanZhiProp(current.ganzhi);
  
  let pushHistory = safeGetJSON('annualPushHistory', []);
  let already = pushHistory.find(function(p){ return p.ganzhi === current.ganzhi; });
  if (already) {
    showToast(current.ganzhi + '年运势已生成，可查看历史记录');
    return;
  }
  
  // 生成推送内容
  let pushData = {
    ganzhi: current.ganzhi,
    date: new Date().toISOString().split('T')[0],
    type: memberLevel === 'lifetime' ? 'full' : 'overview',
    level: memberLevel,
    properties: prop,
    cycleIdx: current.idx + 1,
    totalCycle: 60
  };
  
  pushHistory.push(pushData);
  localStorage.setItem('annualPushHistory', JSON.stringify(pushHistory));
  
  // 生成化解方案内容
  let contentHtml = '';
  if (memberLevel === 'lifetime' || memberLevel === 'annual') {
    contentHtml = generateAnnualContent(current, prop, memberLevel);
  }
  
  // 显示结果弹窗
  let msg = document.createElement('div');
  msg.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:99999;overflow-y:auto;padding:40px 20px';
  msg.innerHTML = '<div style="max-width:700px;margin:0 auto;background:var(--ink2);border:1px solid var(--border);border-radius:14px;padding:28px;position:relative">';
  msg.insertAdjacentHTML('beforeend', '<button onclick="this.parentElement.parentElement.remove()" style="position:absolute;top:16px;right:16px;background:none;border:1px solid var(--border);color:var(--paper3);padding:6px 14px;cursor:pointer;font-size:14px;border-radius:4px">✕</button>');
  msg.insertAdjacentHTML('beforeend', '<div style="font-family:Ma Shan Zheng,serif;font-size:24px;color:var(--gold);letter-spacing:6px;text-align:center;margin-bottom:20px">' + current.ganzhi + '年 运势化解方案</div>');
  msg.insertAdjacentHTML('beforeend', '<p style="text-align:center;font-size:12px;color:var(--paper3);margin-bottom:20px">60甲子第' + (current.idx+1) + '位 · ' + prop.taisui + '年 · ' + prop.wuxing + '行</p>');
  msg.insertAdjacentHTML('beforeend', contentHtml);
  msg.insertAdjacentHTML('beforeend', '<div style="text-align:center;margin-top:20px"><button onclick="this.parentElement.parentElement.remove()" style="padding:10px 30px;border:1px solid var(--gold);border-radius:8px;background:rgba(201,168,76,0.1);color:var(--gold);cursor:pointer;font-family:inherit;font-size:14px;letter-spacing:4px">已知，收藏于心</button></div>');
  msg.insertAdjacentHTML('beforeend', '</div>');
  document.body.appendChild(msg);
  
  addMerit(localStorage.getItem('userFaith') || 'fo', 3, '生成' + current.ganzhi + '年化解方案');
  
  // 刷新推送面板
  setTimeout(function(){ renderAnnualPush(); }, 500);
}

function generateAnnualContent(current, prop, level) {
  let nextYear = getNextYears(current.idx, 1)[0];
  let nextProp = getGanZhiProp(nextYear.ganzhi);
  let html = '';
  
  // 年度五行分析
  html += '<ml-tap class="bazi-module-title" onclick="toggleBaziModule(this)" variant="card" role="button" tabindex="0">🎯 年度五行分析 <span class="toggle-icon">▼</span></ml-tap>';
  html += '<div class="bazi-module-body" style="padding:14px;font-size:13px;line-height:1.8">';
  html += '<div>本年干支：<b style="color:var(--gold2)">' + current.ganzhi + '</b>（天干' + current.ganzhi[0] + ' 地支' + current.ganzhi[1] + '）</div>';
  html += '<div>五行属性：<b>' + prop.wuxing + '行</b></div>';
  html += '<div>太岁：' + prop.taisui + '年</div>';
  html += '<div>方位：' + prop.direction + '</div>';
  html += '<div>能量特质：' + prop.energy + '</div>';
  html += '<div style="margin-top:8px;color:var(--gold);font-weight:600">化解要点：' + prop.advice + '</div>';
  html += '</div>';
  
  // 化解方案
  html += '<ml-tap class="bazi-module-title collapsed" onclick="toggleBaziModule(this)" variant="card" role="button" tabindex="0">🛡️ 年度化解方案 <span class="toggle-icon">▼</span></ml-tap>';
  html += '<div class="bazi-module-body collapsed" style="padding:14px;font-size:13px;line-height:1.8">';
  html += '<div style="margin-bottom:8px">📌 <b>太岁化解：</b>' + prop.taisui + '年值太岁，可于立春当日（2月4日）参拜太岁，安奉太岁符。</div>';
  html += '<div style="margin-bottom:8px">🏠 <b>方位布局：</b>太岁方' + prop.direction + '宜静不宜动，可摆放五行调和物。财位根据流年飞星调整。</div>';
  if (level === 'lifetime') {
    html += '<div style="margin-bottom:8px">📋 <b>专属方案：</b>根据绑定八字五行喜用，生成个性化化解方案（物品清单/方位布局/开光时辰/注意事项）。</div>';
    html += '<div style="margin-bottom:8px">👨‍👩‍👧‍👦 <b>家庭成员：</b>每位成员独立分析+综合化解方案。</div>';
    html += '<div style="margin-bottom:8px">📦 <b>化解物品清单：</b>太岁符/五行调和物/财位催财物/文昌位布置物/健康化煞物。</div>';
  }
  html += '<div style="margin-bottom:8px">🔜 <b>次年预告：</b>' + nextYear.ganzhi + '年（' + nextProp.taisui + '·' + nextProp.wuxing + '行）——' + nextProp.advice.substring(0,20) + '...</div>';
  html += '</div>';
  
  // 60甲子循环状态
  html += '<ml-tap class="bazi-module-title collapsed" onclick="toggleBaziModule(this)" variant="card" role="button" tabindex="0">🔮 60甲子循环 <span class="toggle-icon">▼</span></ml-tap>';
  html += '<div class="bazi-module-body collapsed" style="padding:14px;font-size:13px;line-height:1.8">';
  html += '<div>当前位置：第<b style="color:var(--gold2)">' + (current.idx+1) + '</b>位 / 共60位</div>';
  html += '<div>循环进度：<div style="height:4px;background:rgba(201,168,76,.1);border-radius:2px;margin:8px 0"><div style="height:100%;width:' + ((current.idx+1)/60*100).toFixed(0) + '%;background:linear-gradient(90deg,var(--gold),var(--gold2));border-radius:2px"></div></div></div>';
  html += '<div>已推送：<b>' + (current.idx+1) + '</b>次 | 剩余：<b>' + (60-current.idx-1) + '</b>次</div>';
  html += '<div style="margin-top:8px;color:var(--paper3);font-size:11px">60甲子一轮回，天干地支周而复始。每年年末年初自动推送，终身会员享完整循环。</div>';
  html += '</div>';
  
  return html;
}

function isYearTransition() {
  let now = new Date();
  let m = now.getMonth() + 1;
  let d = now.getDate();
  // 年末年初推送窗口：11月15日到次年2月15日
  return (m === 11 && d >= 15) || m === 12 || m === 1 || (m === 2 && d <= 15);
}

// ============================================================
// 自优化进化引擎 UI
// ============================================================
function runEvolutionAudit() {
  let reportEl = document.getElementById('evolutionReport');
  if (!reportEl) return;
  if (typeof EvolutionEngine === 'undefined') {
    reportEl.innerHTML = '<div style="color:var(--cinn2);font-size:12px">进化引擎未加载</div>';
    return;
  }
  reportEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--gold);font-size:13px">🔄 正在执行审计...</div>';
  
  setTimeout(function() {
    let report = EvolutionEngine.runFullAudit();
    let html = '<div style="background:rgba(201,168,76,0.04);border:1px solid rgba(201,168,76,0.12);border-radius:10px;padding:16px">';
    
    // 摘要
    html += '<div style="display:flex;gap:16px;margin-bottom:16px;text-align:center">';
    html += '<div style="flex:1"><div style="font-size:24px;color:var(--jade);font-weight:bold">' + report.summary.pass + '</div><div style="font-size:10px;color:var(--paper3)">通过</div></div>';
    html += '<div style="flex:1"><div style="font-size:24px;color:var(--cinn2);font-weight:bold">' + report.summary.fail + '</div><div style="font-size:10px;color:var(--paper3)">失败</div></div>';
    html += '<div style="flex:1"><div style="font-size:24px;color:var(--gold);font-weight:bold">' + report.summary.score + '</div><div style="font-size:10px;color:var(--paper3)">评分</div></div>';
    html += '</div>';
    
    // 八字引擎验证
    html += '<ml-tap class="bazi-module-title" onclick="toggleBaziModule(this)" style="font-size:13px;padding:8px 10px" variant="card" role="button" tabindex="0">🔮 八字引擎验证 (' + report.bazi.pass + '/' + (report.bazi.pass+report.bazi.fail) + ') <span class="toggle-icon">▼</span></ml-tap>';
    html += '<div class="bazi-module-body" style="padding:10px;font-size:12px">';
    if (report.bazi.errors.length > 0) {
      report.bazi.errors.forEach(function(e) { html += '<div style="color:var(--cinn2);margin-bottom:4px">⚠ ' + e + '</div>'; });
    } else {
      html += '<div style="color:var(--jade)">✓ 全部通过</div>';
    }
    html += '</div>';
    
    // 知识库审计
    html += '<ml-tap class="bazi-module-title collapsed" onclick="toggleBaziModule(this)" style="font-size:13px;padding:8px 10px" variant="card" role="button" tabindex="0">📚 知识库审计 (' + report.knowledge.complete + '/' + report.knowledge.total + ') <span class="toggle-icon">▼</span></ml-tap>';
    html += '<div class="bazi-module-body collapsed" style="padding:10px;font-size:12px">';
    if (report.knowledge.issues.length > 0) {
      report.knowledge.issues.forEach(function(i) { html += '<div style="color:var(--warn);margin-bottom:4px">⚠ ' + i + '</div>'; });
    } else {
      html += '<div style="color:var(--jade)">✓ 全部完整</div>';
    }
    html += '</div>';
    
    // 代码质量
    html += '<ml-tap class="bazi-module-title collapsed" onclick="toggleBaziModule(this)" style="font-size:13px;padding:8px 10px" variant="card" role="button" tabindex="0">🔧 代码质量 (评分' + report.codeQuality.score + ') <span class="toggle-icon">▼</span></ml-tap>';
    html += '<div class="bazi-module-body collapsed" style="padding:10px;font-size:12px">';
    if (report.codeQuality.issues.length > 0) {
      report.codeQuality.issues.forEach(function(i) { html += '<div style="color:var(--warn);margin-bottom:4px">⚠ ' + i + '</div>'; });
    } else {
      html += '<div style="color:var(--jade)">✓ 代码质量优秀</div>';
    }
    html += '</div>';
    
    // 进化建议
    let suggestions = EvolutionEngine.getEvolutionSuggestions();
    if (suggestions.length > 0) {
      html += '<ml-tap class="bazi-module-title collapsed" onclick="toggleBaziModule(this)" style="font-size:13px;padding:8px 10px" variant="card" role="button" tabindex="0">💡 进化建议 (' + suggestions.length + ') <span class="toggle-icon">▼</span></ml-tap>';
      html += '<div class="bazi-module-body collapsed" style="padding:10px;font-size:12px">';
      suggestions.forEach(function(s) {
        html += '<div style="margin-bottom:8px;padding:8px;background:rgba(201,168,76,0.04);border-radius:6px"><b style="color:var(--gold)">' + s.module + '</b> (' + s.issueCount + '次问题)<br><span style="color:var(--paper2)">' + s.suggestion + '</span></div>';
      });
      html += '</div>';
    }
    
    html += '</div>';
    html += '<div style="text-align:center;margin-top:8px;font-size:11px;color:var(--paper3);opacity:.95">审计时间：' + report.time + '</div>';
    reportEl.innerHTML = html;
  }, 100);
}

function showEvolutionLog() {
  if (typeof EvolutionEngine === 'undefined') {
    showToast('进化引擎未加载');
    return;
  }
  let log = EvolutionEngine.getLog();
  let reportEl = document.getElementById('evolutionReport');
  if (!reportEl) return;
  
  if (log.length === 0) {
    reportEl.innerHTML = '<div style="text-align:center;color:var(--paper3);padding:20px;font-size:12px">暂无进化日志，请先运行审计</div>';
    return;
  }
  
  let html = '<div style="background:rgba(201,168,76,0.04);border:1px solid rgba(201,168,76,0.12);border-radius:10px;padding:16px">';
  html += '<div style="font-size:13px;color:var(--gold);margin-bottom:10px">📋 进化日志（最近' + Math.min(log.length, 50) + '条）</div>';
  log.slice(-50).reverse().forEach(function(l) {
    let color = l.severity === 'pass' ? 'var(--jade)' : l.severity === 'error' ? 'var(--cinn2)' : l.severity === 'warn' ? 'var(--warn)' : 'var(--paper3)';
    html += '<div style="font-size:11px;padding:4px 0;border-bottom:1px solid rgba(201,168,76,0.04);line-height:1.6">';
    html += '<span style="color:' + color + '">[' + l.severity + ']</span> ';
    html += '<span style="opacity:.95">' + l.time.substring(5, 16) + '</span> ';
    html += '<b style="color:var(--gold2)">' + l.module + '</b> ' + l.message;
    html += '</div>';
  });
  html += '</div>';
  reportEl.innerHTML = html;
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
            if (val.length > 5) html += '<div style="padding-left:16px;opacity:.95">... 等' + val.length + '条</div>';
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
    
    if (!html) html = '<div style="text-align:center;opacity:.95;padding:20px">知识库加载中...</div>';
  } catch(e) {
    html = '<div style="text-align:center;opacity:.95;padding:20px">知识库加载出错：' + e.message + '</div>';
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
  // console.log('[知识库] showKnowledgeDetail called: key=' + key);
  // 确保知识库详情弹窗z-index最高
  let modal = document.getElementById('knowledgeDetailModal');
  if (modal) modal.style.zIndex = '10001';

  // 优先使用 window.KNOWLEDGE_DETAILS（来自 knowledge-details.js）
  if (typeof window.KNOWLEDGE_DETAILS !== 'undefined' && window.KNOWLEDGE_DETAILS[mappedKey]) {
    let detailEl = document.getElementById('knowledgeDetailContent');
    let titleEl2 = document.getElementById('knowledgeDetailTitle');
    if (!detailEl || !titleEl2) return;
    
    let names = {bagua:'易经八卦',liushisigua:'六十四卦',bazi:'八字四柱',qimen:'奇门遁甲',wuxing:'五行体系',fengshui:'风水堪舆',shishen:'十神详解',nayin:'纳音五行',shensha:'神煞体系',hechong:'合冲刑害',liuyao:'六爻基础',xingming:'姓名学基础',shengxiao:'十二生肖',constellation:'西方星座',ziwei:'紫微斗数',meihua:'梅花易数',liuren:'大六壬',tizhi:'中医体质',rujia:'儒家',daojia:'道家',fojia:'佛家',zeji:'择吉',huxing:'好户型',cezi:'测字',jingdian:'经典朗读',fanyin:'梵音音乐',meirikoujue:'每日口诀',gongde:'功德',zhishitupu:'知识图谱',yangsheng:'养生调理',daochang:'道场导航',jiazinayin:'甲子纳音',jieqi:'节气',zhouyi:'周易',yanzhi:'言值'};
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
      let names = {bagua:'易经八卦',liushisigua:'六十四卦',bazi:'八字四柱',qimen:'奇门遁甲',wuxing:'五行体系',fengshui:'风水堪舆',shishen:'十神详解',nayin:'纳音五行',shensha:'神煞体系',hechong:'合冲刑害',liuyao:'六爻基础',xingming:'姓名学基础',shengxiao:'十二生肖',constellation:'西方星座',ziwei:'紫微斗数',meihua:'梅花易数',liuren:'大六壬',tizhi:'中医体质',rujia:'儒家',daojia:'道家',fojia:'佛家',zeji:'择吉',huxing:'好户型',cezi:'测字',jingdian:'经典朗读',fanyin:'梵音音乐',meirikoujue:'每日口诀',gongde:'功德',zhishitupu:'知识图谱',yangsheng:'养生调理',daochang:'道场导航',jiazinayin:'甲子纳音',jieqi:'节气',zhouyi:'周易',yanzhi:'言值'};
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

// ===== 倪海厦讲堂知识库 =====
function showNishanKB() {
  let modal = document.getElementById('knowledgeDetailModal');
  let content = document.getElementById('knowledgeDetailContent');
  let title = document.getElementById('knowledgeDetailTitle');
  if (!modal || !content || !title) return;
  title.textContent = '倪海厦讲堂 · 天纪人纪';
  let html = `<style>.nishan-section h4{color:var(--gold);font-size:18px;letter-spacing:3px;margin-top:28px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(201,168,76,0.2)}.nishan-section p{line-height:2;margin-bottom:12px}.nishan-card{background:rgba(201,168,76,0.04);border:1px solid rgba(201,168,76,0.15);border-radius:14px;padding:24px;margin-bottom:20px;transition:all .3s}.nishan-card:hover{border-color:rgba(201,168,76,0.4);background:rgba(201,168,76,0.06)}.nishan-quote{background:rgba(192,57,43,0.06);border-left:3px solid var(--cinn);padding:14px 18px;margin:12px 0;border-radius:0 8px 8px 0;font-style:italic;color:var(--paper2);line-height:2}.nishan-tab{display:inline-block;padding:8px 20px;margin:4px;border:1px solid rgba(201,168,76,0.25);border-radius:20px;cursor:pointer;font-size:13px;transition:all .25s}.nishan-tab:hover,.nishan-tab.active{background:rgba(201,168,76,0.12);color:var(--gold);border-color:var(--gold)}.nishan-teacher{background:linear-gradient(135deg,rgba(201,168,76,0.08),rgba(192,57,43,0.05));border:1px solid rgba(201,168,76,0.3);border-radius:16px;padding:28px;margin-bottom:24px;text-align:center}
/* === 排盘结果统一样式 === */
.rpt-export-bar{margin-top:16px;text-align:center;display:flex;gap:6px;justify-content:center;flex-wrap:wrap}
.rpt-export-btn{font-size:12px;color:var(--gold);background:none;border:1px solid rgba(201,168,76,.2);border-radius:20px;padding:6px 20px;cursor:pointer;letter-spacing:2px;margin:0 4px;font-family:inherit;transition:all .25s}
.rpt-export-btn:hover{background:rgba(201,168,76,.1);border-color:rgba(201,168,76,.4)}
/* 结果板块统一卡片 */
.rpt-section{background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px}
.rpt-section-title{font-size:14px;font-weight:bold;color:var(--gold);letter-spacing:2px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px}
.rpt-section-body{font-size:13px;line-height:1.9;color:var(--paper);opacity:.9}
.rpt-section-body b{color:var(--gold2)}
/* 大白话总结统一样式 */
.rpt-plain{margin-top:14px;padding:12px 16px;background:rgba(52,152,219,.04);border-left:3px solid var(--cyan2);border-radius:0 8px 8px 0}
.rpt-plain-title{font-size:13px;font-weight:bold;color:var(--cyan2);margin-bottom:4px}
.rpt-plain-body{font-size:12px;color:var(--paper);line-height:1.8}
/* 结果指标卡 */
.rpt-metric-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:12px}
.rpt-metric{background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center}
.rpt-metric-label{font-size:10px;opacity:.95;margin-bottom:4px}
.rpt-metric-value{font-size:16px;font-weight:bold;color:var(--gold)}

</style>`;
  html += '<div class="nishan-section">';
  
  if (typeof NISHAN_KNOWLEDGE !== 'undefined') {
    let nk = NISHAN_KNOWLEDGE;
    
    // 教师介绍
    html += '<div class="nishan-teacher">';
    html += '<div style="font-size:48px;margin-bottom:12px">🩺</div>';
    html += '<h4 style="border:none;margin-top:0">' + nk.meta.teacher_info.name + '</h4>';
    html += '<p style="opacity:.7;font-size:13px;margin-bottom:8px">' + nk.meta.teacher_info.dates + ' · ' + nk.meta.teacher_info.origin + '</p>';
    html += '<p style="font-size:13px;opacity:.8;max-width:600px;margin:0 auto">' + nk.meta.teacher_info.intro + '</p>';
    html += '<p style="font-size:12px;opacity:.95;margin-top:12px">主要著作：' + nk.meta.teacher_info.works + '</p>';
    html += '<p style="font-size:11px;margin-top:8px">' + nk.meta.disclaimer + '</p>';
    html += '</div>';
    
    // 选项卡
    html += '<div style="text-align:center;margin:20px 0">';
    html += '<button type="button" class="nishan-tab active" onclick="document.getElementById(\'nishan-tianji\').style.display=\'block\';document.getElementById(\'nishan-renji\').style.display=\'none\';document.getElementById(\'nishan-cases\').style.display=\'none\';this.classList.add(\'active\');this.nextSibling.classList.remove(\'active\');this.nextSibling.nextSibling.classList.remove(\'active\')">🔮 天纪（命理）</span>';
    html += '<button type="button" class="nishan-tab" onclick="document.getElementById(\'nishan-tianji\').style.display=\'none\';document.getElementById(\'nishan-renji\').style.display=\'block\';document.getElementById(\'nishan-cases\').style.display=\'none\';this.classList.add(\'active\');this.previousSibling.classList.remove(\'active\');this.nextSibling.classList.remove(\'active\')">💊 人纪（中医）</span>';
    html += '<button type="button" class="nishan-tab" onclick="document.getElementById(\'nishan-tianji\').style.display=\'none\';document.getElementById(\'nishan-renji\').style.display=\'none\';document.getElementById(\'nishan-cases\').style.display=\'block\';this.classList.add(\'active\');this.previousSibling.classList.remove(\'active\');this.previousSibling.previousSibling.classList.remove(\'active\')">📋 临床实战</span>';
    html += '</div>';
    
    // 天纪
    html += '<div id="nishan-tianji">';
    
    // 64卦
    if (nk.tianji.hexagrams && nk.tianji.hexagrams.length) {
      html += '<h4>☰ 64卦解读（倪师版）</h4>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-bottom:24px">';
      nk.tianji.hexagrams.forEach(function(h) {
        html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:6px">' + h.num + '. ' + h.name + '</h5>';
        if (h.summary) html += '<p style="font-size:13px;line-height:1.8">' + h.summary + '</p>';
        if (h.nishi_saying) html += '<div class="nishan-quote" style="font-size:12px">🗣️ ' + h.nishi_saying + '</div>';
        html += '</div>';
      });
      html += '</div>';
    }
    
    // 紫微斗数
    if (nk.tianji.ziwei) {
      html += '<h4>⭐ 紫微斗数（倪师方法）</h4>';
      let zw = nk.tianji.ziwei;
      if (zw.core_principles) {
        zw.core_principles.forEach(function(p) {
          html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:8px">' + p.name + '</h5><p style="font-size:13px;line-height:1.8">' + p.content + '</p></div>';
        });
      }
      if (zw.key_techniques) {
        html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:8px">关键技法</h5><ul style="font-size:13px;line-height:2;padding-left:20px">';
        zw.key_techniques.forEach(function(t) { html += '<li>' + t + '</li>'; });
        html += '</ul></div>';
      }
      if (zw.nishi_quotes) {
        zw.nishi_quotes.forEach(function(q) { html += '<div class="nishan-quote">🗣️ ' + q + '</div>'; });
      }
    }
    
    // 八字
    if (nk.tianji.bazi) {
      html += '<h4>🔮 八字命理（倪师心得）</h4>';
      let bz = nk.tianji.bazi;
      if (bz.core_theory) {
        html += '<div class="nishan-card">';
        for (let key in bz.core_theory) {
          html += '<p><b style="color:var(--gold)">' + key + '：</b>' + bz.core_theory[key] + '</p>';
        }
        html += '</div>';
      }
      if (bz.key_concepts) {
        bz.key_concepts.forEach(function(c) {
          html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:8px">' + c.name + '</h5><p style="font-size:13px;line-height:1.8">' + c.content + '</p></div>';
        });
      }
      if (bz.nishi_quotes) {
        bz.nishi_quotes.forEach(function(q) { html += '<div class="nishan-quote">🗣️ ' + q + '</div>'; });
      }
    }
    
    // 风水
    if (nk.tianji.fengshui) {
      html += '<h4>🏔️ 风水堪舆（倪师方法）</h4>';
      let fs = nk.tianji.fengshui;
      if (fs.schools) {
        html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:8px">流派</h5>';
        for (let sk in fs.schools) { html += '<p style="font-size:13px;line-height:1.8"><b>' + sk + '：</b>' + fs.schools[sk] + '</p>'; }
        html += '</div>';
      }
      if (fs.key_principles) {
        html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:8px">核心原则</h5><ul style="font-size:13px;line-height:2;padding-left:20px">';
        fs.key_principles.forEach(function(p) { html += '<li>' + p + '</li>'; });
        html += '</ul></div>';
      }
      if (fs.xuan_kong_flying_stars) {
        let xk = fs.xuan_kong_flying_stars;
        html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:8px">玄空飞星</h5>';
        html += '<p style="font-size:13px;line-height:1.8">' + xk.intro + '</p>';
        if (xk.nine_stars) {
          html += '<ul style="font-size:13px;line-height:2;padding-left:20px;margin-top:8px">';
          xk.nine_stars.forEach(function(s) { html += '<li>' + s + '</li>'; });
          html += '</ul>';
        }
        if (xk.timing) html += '<p style="font-size:13px;line-height:1.8;margin-top:8px">' + xk.timing + '</p>';
        html += '</div>';
      }
      if (fs.nishi_quotes) {
        fs.nishi_quotes.forEach(function(q) { html += '<div class="nishan-quote">🗣️ ' + q + '</div>'; });
      }
    }
    
    html += '</div>'; // end tianji
    
    // 人纪
    html += '<div id="nishan-renji" style="display:none">';
    
    // 针灸
    if (nk.renji.acupuncture) {
      html += '<h4>🪡 针灸大成要穴</h4>';
      let ac = nk.renji.acupuncture;
      if (ac.key_acupoints) {
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-bottom:24px">';
        ac.key_acupoints.forEach(function(p) {
          html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:4px">' + p.name + '</h5>';
          html += '<p style="font-size:12px;margin-bottom:6px">📍 ' + p.location + '</p>';
          html += '<p style="font-size:13px;line-height:1.7">' + p.function + '</p>';
          html += '</div>';
        });
        html += '</div>';
      }
      if (ac.nishi_techniques) {
        html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:8px">倪师针法要诀</h5><ul style="font-size:13px;line-height:2;padding-left:20px">';
        ac.nishi_techniques.forEach(function(t) { html += '<li>' + t + '</li>'; });
        html += '</ul></div>';
      }
    }
    
    // 经方
    if (nk.renji.formulas) {
      html += '<h4>💊 经方体系（伤寒论+金匮要略）</h4>';
      let fm = nk.renji.formulas;
      html += '<div class="nishan-quote">💡 ' + fm.core_principle + '</div>';
      if (fm.shanghan_formulas) {
        html += '<h5 style="color:var(--gold);font-size:15px;margin:16px 0 8px">伤寒论方</h5>';
        fm.shanghan_formulas.forEach(function(f) {
          html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:14px;margin-bottom:4px">' + f.name + '</h5>';
          html += '<p style="font-size:12px;opacity:.7;margin-bottom:6px">组成：' + f.ingredients + '</p>';
          html += '<p style="font-size:13px;line-height:1.7"><b>主治：</b>' + f.indication + '</p>';
          if (f.nishi_note) html += '<div class="nishan-quote" style="font-size:12px">💡 ' + f.nishi_note + '</div>';
          html += '</div>';
        });
      }
      if (fm.jinkui_formulas) {
        html += '<h5 style="color:var(--gold);font-size:15px;margin:16px 0 8px">金匮要略方</h5>';
        fm.jinkui_formulas.forEach(function(f) {
          html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:14px;margin-bottom:4px">' + f.name + '</h5>';
          html += '<p style="font-size:12px;opacity:.7;margin-bottom:6px">组成：' + f.ingredients + '</p>';
          html += '<p style="font-size:13px;line-height:1.7"><b>主治：</b>' + f.indication + '</p>';
          if (f.nishi_note) html += '<div class="nishan-quote" style="font-size:12px">💡 ' + f.nishi_note + '</div>';
          html += '</div>';
        });
      }
      if (fm.nishi_quotes) {
        fm.nishi_quotes.forEach(function(q) { html += '<div class="nishan-quote">🗣️ ' + q + '</div>'; });
      }
    }
    
    // 本草
    if (nk.renji.herbs) {
      html += '<h4>🌿 神农本草经药性</h4>';
      let hb = nk.renji.herbs;
      if (hb.classification) {
        html += '<div class="nishan-card"><p style="font-size:13px;line-height:1.8"><b>上品：</b>' + hb.classification.upper_class + '</p>';
        html += '<p style="font-size:13px;line-height:1.8"><b>中品：</b>' + hb.classification.middle_class + '</p>';
        html += '<p style="font-size:13px;line-height:1.8"><b>下品：</b>' + hb.classification.lower_class + '</p></div>';
      }
      if (hb.key_herbs) {
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-bottom:24px">';
        hb.key_herbs.forEach(function(h) {
          html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:4px">' + h.name + '</h5>';
          html += '<p style="font-size:12px;opacity:.6">' + h.nature + ' · 归' + h.meridian + '经</p>';
          html += '<p style="font-size:13px;line-height:1.7;margin-top:6px">' + h.function + '</p>';
          if (h.nishi_note) html += '<div class="nishan-quote" style="font-size:12px">💡 ' + h.nishi_note + '</div>';
          html += '</div>';
        });
        html += '</div>';
      }
    }
    
    // 诊疗思路
    if (nk.renji.diagnosis) {
      html += '<h4>🩺 诊疗思路</h4>';
      let dg = nk.renji.diagnosis;
      html += '<div class="nishan-card"><p style="font-size:13px;line-height:1.8"><b>六经辨证：</b>' + dg.six_syndromes + '</p>';
      html += '<p style="font-size:13px;line-height:1.8"><b>八纲辨证：</b>' + dg.eight_principles + '</p></div>';
      if (dg.diagnosis_methods) {
        html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:8px">四诊</h5>';
        for (let dk in dg.diagnosis_methods) {
          html += '<p style="font-size:13px;line-height:1.8"><b>' + dk + '：</b>' + dg.diagnosis_methods[dk] + '</p>';
        }
        html += '</div>';
      }
      if (dg.treatment_principles) {
        html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:8px">治疗原则</h5><ul style="font-size:13px;line-height:2;padding-left:20px">';
        dg.treatment_principles.forEach(function(p) { html += '<li>' + p + '</li>'; });
        html += '</ul></div>';
      }
      if (dg.nishi_quotes) {
        dg.nishi_quotes.forEach(function(q) { html += '<div class="nishan-quote">🗣️ ' + q + '</div>'; });
      }
    }
    
    html += '</div>'; // end renji
    
    // 临床实战
    html += '<div id="nishan-cases" style="display:none">';
    if (nk.cases) {
      nk.cases.forEach(function(c) {
        html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:16px;margin-bottom:8px">' + c.title + '</h5>';
        html += '<p style="font-size:12px;margin-bottom:8px">来源：' + (c.source || '') + '</p>';
        html += '<p style="font-size:13px;line-height:1.8">' + c.content + '</p>';
        if (c.key_point) html += '<div class="nishan-quote" style="font-size:12px">💡 ' + c.key_point + '</div>';
        html += '</div>';
      });
    }
    // 汉唐方剂
    if (nk.hantang_formulas) {
      html += '<h4>🏺 汉唐方剂选介</h4>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">';
      nk.hantang_formulas.forEach(function(h) {
        html += '<div class="nishan-card" style="padding:16px"><h5 style="color:var(--gold);font-size:13px;margin-bottom:4px">' + h.code + ' ' + h.name + '</h5>';
        html += '<p style="font-size:12px;line-height:1.6;opacity:.8">' + h.indication + '</p></div>';
      });
      html += '</div>';
    }
    html += '</div>'; // end cases
    
    // 名言与学习路径
    html += '<h4>📜 倪师名言</h4>';
    if (nk.wisdom) {
      nk.wisdom.forEach(function(w) { html += '<div class="nishan-quote">' + w + '</div>'; });
    }
    
    if (nk.study_path) {
      html += '<h4>📚 学习路径</h4>';
      html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:8px">天纪（命理）学习路径</h5><ol style="font-size:13px;line-height:2;padding-left:20px">';
      nk.study_path.tianji_path.forEach(function(p) { html += '<li>' + p + '</li>'; });
      html += '</ol></div>';
      html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:8px">人纪（中医）学习路径</h5><ol style="font-size:13px;line-height:2;padding-left:20px">';
      nk.study_path.renji_path.forEach(function(p) { html += '<li>' + p + '</li>'; });
      html += '</ol></div>';
      html += '<div class="nishan-quote">💡 ' + nk.study_path.nishi_advice + '</div>';
    }
    
    html += '<p style="text-align:center;font-size:11px;margin-top:32px;padding-top:16px;border-top:1px solid rgba(201,168,76,0.1)">' + nk.meta.source + '</p>';
  } else {
    html += '<p style="text-align:center;opacity:.95;padding:40px">倪海厦知识库加载中...</p>';
  }
  html += '</div>';
  content.innerHTML = html;
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}
window.showNishanKB = showNishanKB;

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
    if (buddhaInfo.sanskrit) html += '<p style="font-size:12px;margin:0 0 10px 0">' + buddhaInfo.sanskrit + '</p>';
    html += '<p style="margin:0 0 10px 0;color:var(--paper2);line-height:1.8">' + buddhaInfo.intro + '</p>';
    if (buddhaInfo.worship) html += '<p style="margin:0 0 8px 0;font-size:13px;color:var(--paper2)"><b>供奉方法：</b>' + buddhaInfo.worship + '</p>';
    if (buddhaInfo.benefits) html += '<p style="margin:0;font-size:13px;color:var(--paper2)"><b>功德利益：</b>' + buddhaInfo.benefits.join('、') + '</p>';
    if (buddhaInfo.taboos) html += '<p style="margin:8px 0 0;font-size:12px;color:var(--cinn2)"><b>禁忌：</b>' + buddhaInfo.taboos.join('；') + '</p>';
    html += '</div>';
  } else {
    html += '<div style="background:rgba(201,168,76,0.08);padding:16px;border-radius:12px;margin-bottom:16px">';
    html += '<h4 style="color:var(--gold);margin:0 0 10px 0">📿 本命佛守护</h4>';
    html += '<p style="margin:0;color:var(--paper2);line-height:1.8">佩戴专属本命佛吊坠，诚心供奉，可消灾解难、增福延寿。</p>';
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
function shuffleWisdom() { dwIdx = Math.floor((Date.now() / 1000) % wisdomQuotes.length); showWisdom(dwIdx); }

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