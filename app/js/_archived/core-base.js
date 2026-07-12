// 排盘音效（兼容voice-reader.js未加载时）
// ═══ 全局错误保护 ═══
window.onerror = function(msg, url, line, col, err) {
  console.warn('[global error]', msg, 'at', url, 'line', line);
  return false;
};

function playDivinationSound(){
  try{if(typeof playSound==='function')playSound('success');}catch(e){}
}

// ═══ 排盘入口 wrapper 函数 (HTML onclick 调用) ═══
function runQimen(){ computeQimen(); }
function runZiwei(){ computeZiWei(); }
function runMeihua(){ computeMeiHua(); }
function runLiuren(){ computeLiuRen(); }
function runQimenEngine(){ computeQimen(); }
function runZiweiEngine(){ computeZiWei(); }
function runMeihuaEngine(){ computeMeiHua(); }
function runLiurenEngine(){ computeLiuRen(); }
function runLiuyaoEngine(){ yjStart('person'); }
function runFengshuiEngine(){ computeFengshui(); }
function runXingmingEngine(){ if(typeof analyzeName==='function'){ var n=document.getElementById('xmName')?.value||document.getElementById('xmCurrentName')?.value||''; var nn=document.getElementById('xmNewName')?.value||n; var s=document.getElementById('xmSex')?.value||'male'; var bd=document.getElementById('xmBirthDate')?.value||''; var bh=document.getElementById('xmBirthHour')?.value||''; var r=analyzeName(n,nn,s,bd); if(r&&r.success){showToast('姓名分析完成'); /* 化解方案注入 */ if(bd){var _p=bd.split('-').map(Number); if(_p.length===3){var _h=bh!==''?parseInt(bh)*2:12; appendHuajieToResult('xmEngineResult',_p[0],_p[1],_p[2],_h,s,n);}} }else if(r){showToast(r.message||'分析失败');} } }
function runZeriEngine(){ runPrecisionZeRi(); }

function exportWord() {
  var name = document.getElementById('baziNameOut') ? document.getElementById('baziNameOut').textContent : '乾元命理报告';
  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+name+'</title>';
  html += '<style>body{font-family:宋体,SimSun,serif;max-width:900px;margin:40px auto;padding:20px;font-size:14pt;line-height:2;color:#333}'
  html += 'h1{text-align:center;color:#8B6914;border-bottom:3px solid #D4AF37;padding-bottom:16px}'
  html += 'h2{color:#8B6914;border-left:6px solid #D4AF37;padding-left:12px;margin-top:28px}'
  html += 'h3{color:#666;margin-top:20px}'
  html += 'table{width:100%;border-collapse:collapse;margin:16px 0}'
  html += 'td,th{padding:8px 12px;border:1px solid #c4a040;text-align:center}'
  html += '.gang{display:flex;justify-content:center;gap:12px;margin:20px 0}'
  html += '.gz{border:1px solid #D4AF37;padding:10px 20px;text-align:center;background:#FFF9E6}'
  html += '.warn{background:#FFF3CD;border:2px solid #FFC107;padding:16px;margin:16px 0}'
  html += 'p{margin:8px 0;text-indent:2em}'
  html += 'footer{text-align:center;color:#999;font-size:11pt;margin-top:40px}'
  html += '</style></head><body>';
  html += '<h1>'+name+'</h1>';
  var meta = document.getElementById('baziMetaOut');
  if (meta) html += '<p style="text-align:center;color:#888">'+meta.textContent+'</p>';
  html += '<hr style="border:1px solid #D4AF37;margin:20px 0">';

  // 四柱
  html += '<h2>一、四柱排盘</h2><div class="gang">';
  for (var i=0;i<4;i++){
    var g=document.getElementById('bz'+i+'g');var z=document.getElementById('bz'+i+'z');var e=document.getElementById('bz'+i+'e');
    var n=document.getElementById('bz'+i+'n');
    if(g&&z) html+='<div class="gz"><div style="font-size:20pt">'+g.textContent+z.textContent+'</div><div style="font-size:11pt;color:#888">'+(e?e.textContent:'')+'</div><div style="font-size:11pt;color:#D4AF37">'+(n?n.textContent:'')+'</div></div>';
  }
  html += '</div>';

  // 分析卡片
  var cards = document.querySelectorAll('.analysis-card');
  var titles = ['日主论命','命局特点','五行喜忌','事业财运','情感婚姻','健康寿元'];
  if (cards.length > 0) {
    html += '<h2>二、命理分析</h2>';
    cards.forEach(function(c,i){
      var h=c.querySelector('h5');var p=c.querySelector('p');
      if(h&&p) html += '<h3>（'+(titles[i]||i+1)+'）'+h.textContent+'</h3><p>'+p.textContent+'</p>';
    });
  }

  // 五行
  var bar=document.getElementById('eleBar');var leg=document.getElementById('eleLegend');
  if(bar&&leg){
    html += '<h2>三、五行分析</h2>';
    html += '<div style="margin:12px 0">'+leg.innerHTML+'</div>';
  }

  // 大运
  var dyList = document.getElementById('dayunList');
  if(dyList&&dyList.children.length>0){
    html += '<h2>四、十年大运</h2><table><tr><th>大运</th><th>年龄</th><th>公历</th><th>喜忌</th><th>简评</th></tr>';
    dyList.querySelectorAll('div[onclick]').forEach(function(d){
      var txt=d.innerText||'';
      var lines=txt.split('\n').filter(function(l){return l.trim();});
      var ganZhi=lines[0]||'';var age=lines[1]||'';var yrs=lines[2]||'';var rel=lines[3]||'';
      html += '<tr><td style="font-size:16pt;color:#8B6914">'+ganZhi+'</td><td>'+age+'</td><td>'+yrs+'</td><td>'+rel+'</td><td></td></tr>';
    });
    html += '</table>';
  }

  html += '<footer><p>易道智鉴 · 专业命理分析报告 · '+new Date().toLocaleString('zh-CN')+'</p></footer>';
  html += '<\/body><\/html>';

  downloadBlob(html, name+'.doc', 'application/msword;charset=utf-8');
  showToast('Word 报告已下载');
}

function getNayin(stemIdx, branchIdx) {
  // 六十甲子索引：天干地支组合在六十甲子中的位置
  // 天干10个，地支12个，配对时 stemIdx 和 branchIdx 同步递增
  // 六十甲子序号 = (branchIdx - stemIdx + 12) % 12 * 5 + stemIdx
  // 简化：直接用查表法
  var stems=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  var branches=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  var ganzhi = stems[stemIdx] + branches[branchIdx];
  // 六十甲子顺序
  var jiazi=['甲子','乙丑','丙寅','丁卯','戊辰','己巳','庚午','辛未','壬申','癸酉',
    '甲戌','乙亥','丙子','丁丑','戊寅','己卯','庚辰','辛巳','壬午','癸未',
    '甲申','乙酉','丙戌','丁亥','戊子','己丑','庚寅','辛卯','壬辰','癸巳',
    '甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑','壬寅','癸卯',
    '甲辰','乙巳','丙午','丁未','戊申','己酉','庚戌','辛亥','壬子','癸丑',
    '甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬戌','癸亥'];
  var idx = jiazi.indexOf(ganzhi);
  if(idx < 0) return '';
  return _NAYIN_TABLE_LOCAL[idx] || '';
}

// 六十甲子纳音全表（本地副本，避免与全局 NAYIN_TABLE 冲突）
const _NAYIN_TABLE_LOCAL = [
  '海中金','海中金','炉中火','炉中火','大林木','大林木',
  '路旁土','路旁土','剑锋金','剑锋金','山头火','山头火',
  '涧下水','涧下水','城头土','城头土','白蜡金','白蜡金',
  '杨柳木','杨柳木','泉中水','泉中水','屋上土','屋上土',
  '霹雳火','霹雳火','松柏木','松柏木','长流水','长流水',
  '沙中金','沙中金','山下火','山下火','平地木','平地木',
  '壁上土','壁上土','金箔金','金箔金','覆灯火','覆灯火',
  '天河水','天河水','大驿土','大驿土','钗钏金','钗钏金',
  '桑柘木','桑柘木','大溪水','大溪水','沙中土','沙中土',
  '天上火','天上火','石榴木','石榴木','大海水','大海水'
];

// 纳音颜色映射
const NAYIN_COLOR = {
'海中金':'#8B7355','炉中火':'#FF4500','大林木':'#228B22','路旁土':'#D2691E','剑锋金':'#C0C0C0',
'山头火':'#FF6347','涧下水':'#4682B4','城头土':'#8B4513','白蜡金':'#FFD700','杨柳木':'#90EE90',
'泉中水':'#5F9EA0','屋上土':'#CD853F','霹雳火':'#FF00FF','松柏木':'#006400','长流水':'#4169E1',
'沙中金':'#B8860B','山下火':'#FFA07A','平地木':'#3CB371','壁上土':'#DEB887','金箔金':'#FFD700',
'覆灯火':'#FF69B4','天河水':'#00BFFF','大驿土':'#A0522D','钗钏金':'#DAA520','桑柘木':'#8FBC8F',
'大溪水':'#1E90FF','沙中土':'#F4A460','天上火':'#FF8C00','石榴木':'#6B8E23','大海水':'#000080'
};

// ═══ 全局天干地支五行表 (computeBazi 等函数依赖) ═══
const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const ELE = {甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
const ZHI_ELE = {子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'};

// ================================================================
//  深度解读函数库
// ================================================================

function getBaziSummary(dayStem) {
  var summaries = {
    '甲': {nature:'栋梁之材', talent:'天生的领导者，性格正直刚毅，有担当精神。一生贵人多，事业运极佳，但需注意不要过于刚直而得罪人。', life:'人生如栋梁，承重为福。你的责任越重，成就越大。', motto:'天行健，君子以自强不息'},
    '乙': {nature:'藤萝之木', talent:'灵活变通，善于借力。人际关系极佳，能屈能伸。感情丰富，适合从事需要交际的工作。', life:'人生如藤萝，依附可成材。懂得借力，事半功倍。', motto:'上善若水，水善利万物而不争'},
    '丙': {nature:'太阳之火', talent:'热情开朗，光明磊落。天生自带光芒，人缘极佳。但需控制情绪，避免过于冲动。', life:'人生如太阳，照亮自己也温暖他人。保持热情，但别燃烧殆尽。', motto:'光明正大，坦坦荡荡'},
    '丁': {nature:'灯烛之火', talent:'内心温暖，善于照亮他人。心思细腻，适合做幕后的智者。安静的力量，蓄势待发。', life:'人生如烛光，虽小可照远。坚持内心，终将被看见。', motto:'星星之火，可以燎原'},
    '戊': {nature:'高山之土', talent:'稳重踏实，值得信赖。天生有包容力，能承载万物。适合做长期主义的事业。', life:'人生如高山，厚重为根基。你不需要跑得快，但一定走得远。', motto:'厚德载物，地势坤'},
    '己': {nature:'田园之土', talent:'勤劳朴实，默默耕耘。不争不抢但自有收获。内心丰富，适合从事需要耐心和细致的工作。', life:'人生如田园，春种秋收。慢慢来，一切都来得及。', motto:'不积跬步，无以至千里'},
    '庚': {nature:'刀剑之金', talent:'果断刚毅，执行力强。天生的改革者，敢于破旧立新。但需注意方式方法。', life:'人生如利剑，出鞘必有因。果断但不莽撞，刚毅但不无情。', motto:'宝剑锋从磨砺出'},
    '辛': {nature:'首饰之金', talent:'精致优雅，追求完美。审美出众，适合从事需要品味和创意的工作。', life:'人生如珠宝，价值在打磨。精雕细琢，方显光芒。', motto:'玉不琢不成器'},
    '壬': {nature:'大海之水', talent:'智慧深邃，胸怀宽广。能容百川，适应力极强。但需有方向，否则随波逐流。', life:'人生如大海，深不可测。你有无穷的潜力，关键是找到方向。', motto:'海纳百川，有容乃大'},
    '癸': {nature:'雨露之水', talent:'润物无声，温柔而有力量。直觉敏锐，适合从事需要洞察力和同理心的工作。', life:'人生如春雨，润物细无声。你的善良和温柔，是最大的力量。', motto:'上善若水，润物无声'}
  };
  return summaries[dayStem] || summaries['甲'];
}

function getBaziDimensionHTML(dayStem, dayEle) {
  var careerAnalysis = {
    '甲': '天生领导力，适合管理、教育、法律行业。贵人运旺,35岁前为积累期,35-50岁为黄金期。**大器晚成，厚积薄发**。',
    '乙': '善于交际和协调，适合贸易、设计、公关行业。贵人多在南方。25岁前不宜创业,30岁后渐入佳境。**借力打力，以柔克刚**。',
    '丙': '热情开朗，适合销售、演艺、互联网行业。人脉是最大资产。早年顺遂，中年需注意不要过于冒进。**热情就是生产力**。',
    '丁': '细致入微，适合研究、医疗、心理咨询行业。幕后英雄，实力派。40岁后事业有大突破。**安静的力量最强大**。',
    '戊': '稳重可靠，适合金融、建筑、政府行业。一生稳定上升，少有大起大落。**稳中求进，步步为营**。',
    '己': '勤劳踏实，适合农业、教育、服务业。不争不抢自有天地。**慢工出细活，细心成大事**。',
    '庚': '果断勇敢，适合军警、外科、金融行业。敢于突破，适合创业。**破而后立，浴火重生**。',
    '辛': '追求完美，适合珠宝、艺术、审计行业。高标准严要求是成功之道。**精益求精，止于至善**。',
    '壬': '智慧超群，适合学术界、高科技、国际贸易。思维开阔，适合做战略规划。**格局决定结局**。',
    '癸': '直觉敏锐，适合玄学、文学、心理咨询。感知力强，适合需要洞察力的工作。**直觉就是你的超能力**。'
  };
  var marriageAnalysis = {
    '甲': '甲木男命，妻子多为贤内助型。甲木女命，丈夫能力较强。最佳婚配:属虎、属兔、属蛇。**好的婚姻，是两个独立的人选择互相扶持**。',
    '乙': '乙木人感情丰富，婚姻中需避免优柔寡断。最佳婚配:属龙、属蛇、属马。晚婚更稳定。**感情需要经营，不是等待**。',
    '丙': '丙火人热情浪漫，但需注意婚后保持激情。最佳婚配:属鼠、属龙、属猪。**保持热恋的心，婚姻才能保鲜**。',
    '丁': '丁火人温柔体贴，婚姻中是温暖的存在。最佳婚配:属牛、属兔、属羊。**温柔的坚持，比热烈更重要**。',
    '戊': '戊土人踏实稳重，婚姻忠诚度高。最佳婚配:属虎、属兔、属猴。**忠诚是最好的承诺**。',
    '己': '己土人勤劳顾家，是理想的伴侣。最佳婚配:属龙、属蛇、属牛。**平淡中的幸福最真实**。',
    '庚': '庚金人刚毅果断，婚姻中需学会柔软。最佳婚配:属鼠、属龙、属猴。**刚柔并济，方得美满**。',
    '辛': '辛金人追求完美，婚姻中需适当降低期望。最佳婚配:属牛、属蛇、属鸡。**接受不完美，才能拥有完美婚姻**。',
    '壬': '壬水人感情丰富多变，需专一才能长久。最佳婚配:属鼠、属猴、属龙。**专一是最深情的浪漫**。',
    '癸': '癸水人温柔敏感，容易受感动。最佳婚配:属牛、属兔、属猪。**细水长流，最是深情**。'
  };
  var wealthAnalysis = {
    '甲': '正财为主，稳健投资。30岁后财运渐旺，适合长期投资。**财不入急门，稳中求富**。',
    '乙': '偏财运好，适合副业收入。正财稳定，偏财需把握时机。**主业保底，副业起飞**。',
    '丙': '财来财去，需学会理财。人脉即财脉，善用人际关系。**人脉就是财脉**。',
    '丁': '细水长流，不暴富但也少破财。适合储蓄型和稳健型投资。**积少成多，聚沙成塔**。',
    '戊': '财运稳定，适合地产、矿产类投资。35岁后大运来临。**不急不躁，财自来**。',
    '己': '靠勤劳致富，少有横财。适合固定收入+稳健理财。**勤劳致富，踏实生财**。',
    '庚': '偏财运旺，适合创业和投资。但需控制风险，切忌贪大。**敢闯敢拼，但别孤注一掷**。',
    '辛': '精打细算，善于理财。适合做财务、审计类工作。**省下的也是赚到的**。',
    '壬': '财运起伏大，大进大出。需有节制，学会守住财富。**赚得多不如留得住**。',
    '癸': '财运来自智慧和灵感。适合知识型创收。**知识变现，智慧生财**。'
  };
  var healthAnalysis = {
    '木': '肝胆系统需特别注意。忌熬夜、忌酗酒。春季养生最佳。建议:每天11点前入睡，多吃绿色蔬菜，适当运动。',
    '火': '心脏和小肠需注意。忌过度兴奋、忌暴饮暴食。夏季养生最佳。建议:保持情绪稳定，少食辛辣，多做有氧运动。',
    '土': '脾胃系统需特别注意。忌暴饮暴食、忌生冷食物。每个季节转换时注意。建议:规律饮食，细嚼慢咽，少吃甜食。',
    '金': '呼吸系统需注意。忌抽烟、忌雾霾天外出。秋季养生最佳。建议:多做深呼吸运动，保持室内通风，多食白色食物。',
    '水': '肾脏和泌尿系统需注意。忌过度劳累、忌受寒。冬季养生最佳。建议:早睡早起，注意保暖，多食黑色食物。'
  };
  var numMap = {
    '甲': {lucky:'1、6', unlucky:'3、8', total:'综合吉凶:72分(偏吉)'},
    '乙': {lucky:'3、8', unlucky:'1、9', total:'综合吉凶:68分(中吉)'},
    '丙': {lucky:'9、4', unlucky:'6、7', total:'综合吉凶:75分(吉)'},
    '丁': {lucky:'4、9', unlucky:'2、7', total:'综合吉凶:70分(偏吉)'},
    '戊': {lucky:'5、0', unlucky:'3、8', total:'综合吉凶:73分(吉)'},
    '己': {lucky:'5、0', unlucky:'4、9', total:'综合吉凶:66分(中吉)'},
    '庚': {lucky:'7、2', unlucky:'5、0', total:'综合吉凶:71分(偏吉)'},
    '辛': {lucky:'8、3', unlucky:'1、6', total:'综合吉凶:67分(中吉)'},
    '壬': {lucky:'6、1', unlucky:'4、9', total:'综合吉凶:74分(吉)'},
    '癸': {lucky:'1、6', unlucky:'2、7', total:'综合吉凶:69分(中吉)'}
  };
  var summary = getBaziSummary(dayStem);
  var nums = numMap[dayStem] || numMap['甲'];
  var html = '';
  html += '<div class="analysis-card" style="text-align:center;border:1px solid rgba(201,168,76,.2);margin-top:20px">';
  html += '<h5 style="color:var(--gold);font-size:16px;letter-spacing:4px;margin-bottom:16px">🎯 命格总结</h5>';
  html += '<div style="font-size:28px;color:var(--gold);font-family:\'Ma Shan Zheng\',serif;margin-bottom:12px">' + summary.nature + '</div>';
  html += '<p style="font-size:14px;line-height:2;opacity:.8">' + summary.talent + '</p>';
  html += '<p style="font-size:14px;line-height:2;opacity:.6;margin-top:8px">' + summary.life + '</p>';
  html += '<p style="font-size:13px;color:var(--gold);margin-top:12px;font-style:italic">「' + summary.motto + '」</p>';
  html += '</div>';
  html += '<div class="analysis-card" style="margin-top:16px">';
  html += '<h5>📊 综合吉凶数字</h5>';
  html += '<div style="display:flex;gap:16px;justify-content:center;margin-bottom:12px">';
  html += '<div style="text-align:center"><span style="font-size:32px;color:#2ecc71">' + nums.lucky + '</span><p style="font-size:11px;opacity:.5">吉祥数字</p></div>';
  html += '<div style="text-align:center"><span style="font-size:32px;color:#e74c3c">' + nums.unlucky + '</span><p style="font-size:11px;opacity:.5">避忌数字</p></div>';
  html += '</div>';
  html += '<p style="text-align:center;font-size:14px;color:var(--gold)">' + nums.total + '</p>';
  html += '</div>';
  var dims = [
    {icon:'🚀', title:'事业运', color:'#2980b9', text: careerAnalysis[dayStem] || careerAnalysis['甲']},
    {icon:'💕', title:'婚姻运', color:'#e74c3c', text: marriageAnalysis[dayStem] || marriageAnalysis['甲']},
    {icon:'💰', title:'财运运', color:'#c9a84c', text: wealthAnalysis[dayStem] || wealthAnalysis['甲']},
    {icon:'🏥', title:'健康运', color:'#27ae60', text: healthAnalysis[dayEle] || healthAnalysis['木']},
    {icon:'📚', title:'学业运', color:'#8e44ad', text: dayEle + '日主，印星为' + ({木:'水',火:'木',土:'火',金:'土',水:'金'}[dayEle]) + '。宜向' + ({木:'北方',火:'东方',土:'南方',金:'中央',水:'西方'}[dayEle]) + '求学。记忆力' + ({木:'中等',火:'较强',土:'一般',金:'极佳',水:'上佳'}[dayEle]) + ',适合' + ({木:'理解型学习',火:'竞争型学习',土:'实践型学习',金:'逻辑型学习',水:'灵感型学习'}[dayEle]) + '。**学无止境，终身学习**。'}
  ];
  for (var i = 0; i < dims.length; i++) {
    var d = dims[i];
    html += '<div class="analysis-card" style="margin-top:16px">';
    html += '<h5 style="color:' + d.color + '">' + d.icon + ' ' + d.title + '</h5>';
    html += '<p style="font-size:14px;line-height:2;opacity:.8">' + d.text + '</p>';
    html += '</div>';
  }
  html += '<div class="analysis-card" style="border:1px solid rgba(201,168,76,.2);margin-top:16px">';
  html += '<h5>🔄 改变命运的方法</h5>';
  html += '<ul style="list-style:none;padding:0;font-size:14px;line-height:2.2;opacity:.8">';
  html += '<li><strong>改心</strong>:心念决定行为，行为决定命运。每日诵读积极口诀，培养正向思维。</li>';
  html += '<li><strong>改行</strong>:多行善事，积善成德。日行一善，福报自来。</li>';
  html += '<li><strong>改言</strong>:口出善言，远离是非。语言有力量，好话带来好运。</li>';
  html += '<li><strong>改居</strong>:调整居家风水，床位朝向、办公方位，小调整大改变。</li>';
  html += '<li><strong>改友</strong>:近朱者赤，近墨者黑。多与正能量的人为伍。</li>';
  html += '<li><strong>改习</strong>:培养好习惯，戒除坏习惯。习惯决定性格，性格决定命运。</li>';
  html += '</ul>';
  html += '</div>';
  return html;
}

function getYijingReading(guaName) {
  // Legacy fallback - delegates to V2
  return getYijingReadingV2(guaName, null, '');
}

// ========== 易经 V2 动态解读引擎 ==========

// 本地八卦象数表（避免跨script块依赖）
var _YJ_GUA_XIANG = {
  0:{name:'乾',sym:'☰',code:'111',wuxing:'金',family:'父'},
  1:{name:'兑',sym:'☱',code:'110',wuxing:'金',family:'少女'},
  2:{name:'离',sym:'☲',code:'101',wuxing:'火',family:'中女'},
  3:{name:'震',sym:'☳',code:'100',wuxing:'木',family:'长男'},
  4:{name:'巽',sym:'☴',code:'011',wuxing:'木',family:'长女'},
  5:{name:'坎',sym:'☵',code:'010',wuxing:'水',family:'中男'},
  6:{name:'艮',sym:'☶',code:'001',wuxing:'土',family:'少男'},
  7:{name:'坤',sym:'☷',code:'000',wuxing:'土',family:'母'}
};

var _YJ_HEX_DATA = {
  '乾':  {upper:0, lower:0, wuxing:'金', gong:'乾',   summary:'天行健，君子以自强不息', meaning:'纯阳刚健，天道运行不息'},
  '坤':  {upper:7, lower:7, wuxing:'土', gong:'坤',   summary:'地势坤，君子以厚德载物', meaning:'纯阴柔顺，地道承载万物'},
  '屯':  {upper:5, lower:3, wuxing:'水', gong:'坎',   summary:'万事开头难，坚持就是胜利', meaning:'雷雨交加，万物始生艰难'},
  '蒙':  {upper:6, lower:5, wuxing:'火', gong:'离',   summary:'启蒙求知，虚心学习', meaning:'山下出泉，蒙昧待启'},
  '需':  {upper:5, lower:1, wuxing:'水', gong:'坎',   summary:'等待时机，蓄势待发', meaning:'云上于天，需待其时'},
  '讼':  {upper:1, lower:5, wuxing:'金', gong:'离',   summary:'避免争执，以和为贵', meaning:'天水违行，争讼之象'},
  '师':  {upper:7, lower:5, wuxing:'土', gong:'坤',   summary:'以正治军，纪律严明', meaning:'地中有水，聚众出师'},
  '比':  {upper:5, lower:7, wuxing:'水', gong:'坤',   summary:'亲比相辅，团结合作', meaning:'水地相亲，比附团结'},
  '小畜':{upper:4, lower:1, wuxing:'木', gong:'巽',   summary:'小有成就，继续努力', meaning:'风行天上，小有积蓄'},
  '履':  {upper:1, lower:2, wuxing:'金', gong:'艮',   summary:'如履薄冰，小心谨慎', meaning:'上天下泽，履虎尾之象'},
  '泰':  {upper:7, lower:1, wuxing:'土', gong:'坤',   summary:'否极泰来，万物通达', meaning:'天地交泰，万物通泰'},
  '否':  {upper:1, lower:7, wuxing:'金', gong:'乾',   summary:'闭塞不通，静待转运', meaning:'天地不交，闭塞不通'},
  '同人':{upper:1, lower:2, wuxing:'金', gong:'离',   summary:'志同道合，广结善缘', meaning:'天火同人，同志相合'},
  '大有':{upper:2, lower:1, wuxing:'火', gong:'乾',   summary:'大有所成，丰收在望', meaning:'火天大有，丰盛富有'},
  '谦':  {upper:7, lower:6, wuxing:'土', gong:'坤',   summary:'满招损谦受益，谦虚为上', meaning:'地山谦，卑下自牧'},
  '豫':  {upper:3, lower:7, wuxing:'木', gong:'震',   summary:'顺时而动，快乐为先', meaning:'雷出地奋，豫悦和乐'},
  '随':  {upper:2, lower:3, wuxing:'火', gong:'震',   summary:'随机应变，顺应时势', meaning:'泽雷随，随顺时势'},
  '蛊':  {upper:6, lower:4, wuxing:'土', gong:'巽',   summary:'整治积弊，拨乱反正', meaning:'山风蛊，积弊待整'},
  '临':  {upper:7, lower:2, wuxing:'土', gong:'坤',   summary:'居高临下，大运将至', meaning:'地泽临，以尊临卑'},
  '观':  {upper:4, lower:7, wuxing:'木', gong:'巽',   summary:'静观其变，三思后行', meaning:'风地观，观仰天地'},
  '噬嗑':{upper:2, lower:3, wuxing:'火', gong:'离',   summary:'雷厉风行，果断处理', meaning:'火雷噬嗑，咬合除障'},
  '贲':  {upper:6, lower:2, wuxing:'土', gong:'艮',   summary:'修饰有度，注重形象', meaning:'山火贲，文饰光明'},
  '剥':  {upper:6, lower:7, wuxing:'土', gong:'艮',   summary:'剥落消退，暂避锋芒', meaning:'山地剥，剥落衰退'},
  '复':  {upper:7, lower:3, wuxing:'土', gong:'坤',   summary:'一阳来复，否极泰来', meaning:'地雷复，一阳来复'},
  '无妄':{upper:1, lower:3, wuxing:'金', gong:'乾',   summary:'不妄动，不虚妄', meaning:'天雷无妄，诚中形外'},
  '大畜':{upper:6, lower:1, wuxing:'土', gong:'艮',   summary:'厚积薄发，大有可为', meaning:'山天大畜，蓄积刚健'},
  '颐':  {upper:6, lower:3, wuxing:'土', gong:'艮',   summary:'养生保健，自求多福', meaning:'山雷颐，养正之道'},
  '大过':{upper:2, lower:4, wuxing:'火', gong:'兑',   summary:'过犹不及，中庸为上', meaning:'泽风大过，过甚非常'},
  '坎':  {upper:5, lower:5, wuxing:'水', gong:'坎',   summary:'险中求胜，逆境逢生', meaning:'习坎重险，艰贞求通'},
  '离':  {upper:2, lower:2, wuxing:'火', gong:'离',   summary:'明察秋毫，智慧通达', meaning:'离明相继，文明之象'},
  '咸':  {upper:2, lower:6, wuxing:'火', gong:'兑',   summary:'感应天地，心有灵犀', meaning:'泽山咸，感而遂通'},
  '恒':  {upper:3, lower:4, wuxing:'木', gong:'震',   summary:'持之以恒，方能成功', meaning:'雷风恒，持久不渝'},
  '遁':  {upper:1, lower:6, wuxing:'金', gong:'乾',   summary:'退避三舍，以退为进', meaning:'天山遁，退隐保全'},
  '大壮':{upper:3, lower:1, wuxing:'木', gong:'震',   summary:'阳刚壮盛，势不可挡', meaning:'雷天大壮，刚健壮盛'},
  '晋':  {upper:2, lower:7, wuxing:'火', gong:'离',   summary:'光明远大，步步高升', meaning:'火地晋，进升光明'},
  '明夷':{upper:7, lower:2, wuxing:'土', gong:'坤',   summary:'韬光养晦，暗中积蓄', meaning:'地火明夷，暗中有明'},
  '家人':{upper:4, lower:2, wuxing:'木', gong:'巽',   summary:'家和万事兴', meaning:'风火家人，齐家之道'},
  '睽':  {upper:2, lower:2, wuxing:'火', gong:'离',   summary:'求同存异，化解矛盾', meaning:'火泽睽，乖异不合'},
  '蹇':  {upper:5, lower:6, wuxing:'水', gong:'坎',   summary:'行路艰难，需贵人助', meaning:'水山蹇，前路艰难'},
  '解':  {upper:3, lower:5, wuxing:'木', gong:'震',   summary:'解除困境，重获自由', meaning:'雷水解，解除困厄'},
  '损':  {upper:6, lower:2, wuxing:'土', gong:'艮',   summary:'有舍才有得', meaning:'山泽损，损下益上'},
  '益':  {upper:4, lower:3, wuxing:'木', gong:'巽',   summary:'增益提升，好运加倍', meaning:'风雷益，损上益下'},
  '夬':  {upper:2, lower:1, wuxing:'火', gong:'兑',   summary:'果断决断，除恶务尽', meaning:'泽天夬，决断去弊'},
  '姤':  {upper:1, lower:4, wuxing:'金', gong:'乾',   summary:'不期而遇，意外之喜', meaning:'天风姤，邂逅相遇'},
  '萃':  {upper:2, lower:7, wuxing:'火', gong:'兑',   summary:'聚集力量，汇聚人才', meaning:'泽地萃，聚集荟萃'},
  '升':  {upper:7, lower:4, wuxing:'土', gong:'坤',   summary:'步步高升，前途光明', meaning:'地风升，渐进上升'},
  '困':  {upper:2, lower:5, wuxing:'火', gong:'兑',   summary:'困境之中，坚持信念', meaning:'泽水困，困厄艰难'},
  '井':  {upper:5, lower:4, wuxing:'水', gong:'坎',   summary:'取之不尽，用之不竭', meaning:'水风井，养人之源'},
  '革':  {upper:2, lower:2, wuxing:'火', gong:'离',   summary:'变革创新，破旧立新', meaning:'泽火革，变革鼎新'},
  '鼎':  {upper:2, lower:4, wuxing:'火', gong:'离',   summary:'革故鼎新，功成名就', meaning:'火风鼎，鼎立新基'},
  '震':  {upper:3, lower:3, wuxing:'木', gong:'震',   summary:'临危不乱，以静制动', meaning:'震雷重袭，临危不惧'},
  '艮':  {upper:6, lower:6, wuxing:'土', gong:'艮',   summary:'止步思量，厚积薄发', meaning:'艮山重叠，知止有定'},
  '渐':  {upper:4, lower:6, wuxing:'木', gong:'巽',   summary:'循序渐进，水到渠成', meaning:'风山渐，循序渐进'},
  '归妹':{upper:3, lower:2, wuxing:'木', gong:'震',   summary:'归宿有定，各得其所', meaning:'雷泽归妹，女子出嫁'},
  '丰':  {upper:3, lower:2, wuxing:'木', gong:'震',   summary:'丰收丰满，硕果累累', meaning:'雷火丰，丰盛盈满'},
  '旅':  {upper:2, lower:6, wuxing:'火', gong:'离',   summary:'旅途奔波，居无定所', meaning:'火山旅，行旅在外'},
  '巽':  {upper:4, lower:4, wuxing:'木', gong:'巽',   summary:'柔顺如风，随风而动', meaning:'巽风相随，柔顺而入'},
  '兑':  {upper:2, lower:2, wuxing:'火', gong:'兑',   summary:'和悦待人，以诚相待', meaning:'兑泽相丽，悦乐之道'},
  '涣':  {upper:4, lower:5, wuxing:'木', gong:'巽',   summary:'涣散之后，重新凝聚', meaning:'风水涣，涣散离析'},
  '节':  {upper:5, lower:2, wuxing:'水', gong:'坎',   summary:'节制有度，适可而止', meaning:'水泽节，节制有度'},
  '中孚':{upper:4, lower:2, wuxing:'木', gong:'巽',   summary:'诚信为本，以信立身', meaning:'风泽中孚，诚信感格'},
  '小过':{upper:3, lower:6, wuxing:'木', gong:'震',   summary:'小有过失，及时改正', meaning:'雷山小过，小有过越'},
  '既济':{upper:5, lower:2, wuxing:'水', gong:'坎',   summary:'功成名就，守成为要', meaning:'水火既济，事已成也'},
  '未济':{upper:2, lower:5, wuxing:'火', gong:'离',   summary:'尚未完成，继续努力', meaning:'火水未济，事未成也'}
};

var _YJ_YAO_CI = {
  '乾':['潜龙勿用','见龙在田，利见大人','君子终日乾乾，夕惕若厉','或跃在渊，无咎','飞龙在天，利见大人','亢龙有悔'],
  '坤':['履霜，坚冰至','直方大，不习无不利','含章可贞，或从王事','括囊，无咎无誉','黄裳，元吉','龙战于野，其血玄黄'],
  '屯':['磐桓，利居贞','屯如邅如，乘马班如','即鹿无虞，惟入于林中','乘马班如，求婚媾','屯其膏，小贞吉大贞凶','乘马班如，泣血涟如'],
  '蒙':['发蒙，利用刑人','包蒙吉，纳妇吉','勿用取女，见金夫','困蒙，吝','童蒙，吉','击蒙，不利为寇利御寇'],
  '需':['需于郊，利用恒','需于沙，小有言终吉','需于泥，致寇至','需于血，出自穴','需于酒食，贞吉','入于穴，有不速之客三人来'],
  '讼':['不永所事，小有言终吉','不克讼，归而逋','食旧德，贞厉终吉','不克讼，复即命渝','讼元吉','或锡之鞶带，终朝三褫之'],
  '师':['师出以律，否臧凶','在师中，吉无咎','师或舆尸，凶','师左次，无咎','田有禽，利执言','大君有命，开国承家'],
  '比':['有孚比之，无咎','比之自内，贞吉','比之匪人，不亦伤乎','外比之，贞吉','显比，王用三驱','比之无首，凶'],
  '小畜':['复自道，何其咎','牵复，吉','舆说辐，夫妻反目','有孚，血去惕出无咎','有孚挛如，富以其邻','既雨既处，尚德载'],
  '履':['素履，往无咎','履道坦坦，幽人贞吉','眇能视，跛能履','履虎尾，愬愬终吉','夬履，贞厉','视履考祥，其旋元吉'],
  '泰':['拔茅茹，以其汇','包荒，用冯河','无平不陂，无往不复','翩翩，不富以其邻','帝乙归妹，以祉元吉','城复于隍，勿用师'],
  '否':['拔茅茹，以其汇','包承，小人吉大人否','包羞','有命无咎，畴离祉','休否，大人吉','倾否，先否后喜'],
  '同人':['同人于门，无咎','同人于宗，吝','伏戎于莽，升其高陵','乘其墉，弗克攻','同人先号咷而后笑','同人于郊，无悔'],
  '大有':['无交害，匪咎艰则无咎','大车以载，有攸往无咎','公用亨于天子，小人弗克','匪其彭，无咎','厥孚交如，威如吉','自天祐之，吉无不利'],
  '谦':['谦谦君子，用涉大川吉','鸣谦，贞吉','劳谦君子，有终吉','无不利，撝谦','不富以其邻，利用侵伐','鸣谦，利用行师征邑国'],
  '豫':['鸣豫，凶','介于石，不终日贞吉','盱豫，悔迟有悔','由豫，大有得勿疑','贞疾，恒不死','冥豫，成有渝无咎'],
  '随':['官有渝，贞吉','系小子，失丈夫','系丈夫，失小子','随有获，贞凶','孚于嘉，吉','拘系之，乃从维之'],
  '蛊':['干父之蛊，有子考无咎','干母之蛊，不可贞','干父之蛊，小有悔无大咎','裕父之蛊，往见吝','干父之蛊，用誉','不事王侯，高尚其事'],
  '临':['咸临，贞吉','咸临，吉无不利','甘临，无攸利','至临，无咎','知临，大君之宜','敦临，吉无咎'],
  '观':['童观，小人无咎君子吝','窥观，利女贞','观我生进退','观国之光，利用宾于王','观我生，君子无咎','观其生，君子无咎'],
  '噬嗑':['屦校灭趾，无咎','噬肤灭鼻，无咎','噬腊肉，遇毒小吝','噬干胏，得金矢利艰贞','噬干肉，得黄金贞厉','何校灭耳，凶'],
  '贲':['贲其趾，舍车而徒','贲其须','贲如濡如，永贞吉','贲如皤如，白马翰如','贲于丘园，束帛戋戋','白贲，无咎'],
  '剥':['剥床以足，蔑贞凶','剥床以辨，蔑贞凶','剥之无咎','剥床以肤，凶','贯鱼以宫人宠','硕果不食，君子得舆'],
  '复':['不远复，无祗悔','休复，吉','频复，厉无咎','中行独复','敦复，无悔','迷复，凶有灾眚'],
  '无妄':['无妄往，吉','不耕获，不菑畬','无妄之灾，或系之牛','可贞，无咎','无妄之疾，勿药有喜','无妄行，有眚无攸利'],
  '大畜':['有厉，利已','舆说輹','良马逐，利艰贞','童牛之牿，元吉','豮豕之牙，吉','何天之衢，亨'],
  '颐':['舍尔灵龟，观我朵颐凶','颠颐，拂经于丘颐','拂颐，贞凶十年勿用','颠颐，吉虎视眈眈','拂经，居贞吉不可涉大川','由颐，厉吉利涉大川'],
  '大过':['藉用白茅，无咎','枯杨生稊，老夫得其女妻','栋桡，凶','栋隆，吉有它吝','枯杨生华，老妇得其士夫','过涉灭顶，凶无咎'],
  '坎':['习坎，入于坎窞凶','坎有险，求小得','来之坎坎，险且枕','樽酒簋贰，用缶纳约自牖','坎不盈，祗既平无咎','上六失道，凶三岁'],
  '离':['履错然，敬之无咎','黄离，元吉','日昃之离，不鼓缶而歌','突如其来如，焚如死如弃如','出涕沱若，戚嗟若吉','王用出征，有嘉折首'],
  '咸':['咸其拇','咸其腓，凶居吉','咸其股，执其随往吝','贞吉悔亡，憧憧往来','咸其脢，无悔','咸其辅颊舌'],
  '恒':['浚恒，贞凶无攸利','悔亡','不恒其德，或承之羞贞吝','田无禽','恒其德，贞妇人吉','振恒，凶'],
  '遁':['遁尾厉，勿用有攸往','执之用黄牛之革','系遁，有疾厉','好遁，君子吉小人否','嘉遁，贞吉','肥遁，无不利'],
  '大壮':['壮于趾，征凶有孚','贞吉','小人用壮，君子用罔','藩决不赢，壮于大舆之輹','丧羊于易，无悔','羝羊触藩，不能退不能遂'],
  '晋':['晋如摧如，贞吉罔孚裕无咎','晋如愁如，贞吉受兹介福','众允，悔亡','晋如鼫鼠，贞厉','悔亡失得勿恤','晋其角，维用伐邑'],
  '明夷':['明夷于飞，垂其翼','明夷于左股，用拯马壮','明夷于南狩，得其大首','入于左腹，获明夷之心','箕子之明夷，利贞','不明晦，初登于天后入于地'],
  '家人':['闲有家，悔亡','无攸遂，在中馈','家人嗃嗃，悔厉吉','富家，大吉','王假有家，勿恤吉','有孚威如，终吉'],
  '睽':['悔亡，丧马勿逐自复','遇主于巷，无咎','见舆曳，其牛掣','睽孤遇元夫，交孚厉无咎','悔亡，厥宗噬肤往何咎','睽孤见豕负涂，载鬼一车'],
  '蹇':['往蹇来誉','王臣蹇蹇，匪躬之故','往蹇来反','往蹇来连','大蹇朋来','往蹇来硕吉利见大人'],
  '解':['无咎','田获三狐，得黄矢贞吉','负且乘，致寇至贞吝','解而拇，朋至斯孚','君子维有解，吉有孚于小人','公用射隼于高墉之上'],
  '损':['巳事遄往，无咎酌损之','利贞，征凶弗损益之','三人行则损一人，一人行则得其友','损其疾，使遄有喜无咎','或益之十朋之龟弗克违','弗损益之，无贞吉利有攸往'],
  '益':['利用为大作，元吉无咎','或益之十朋之龟，弗克违','益之用凶事，无咎有孚中行','中行告公从，利用为依迁国','有孚惠心，勿问元吉','莫益之，或击之立心勿恒凶'],
  '夬':['壮于前趾，往不胜为咎','惕号，莫夜有戎勿恤','壮于頄，有凶君子夬夬','臀无肤，其行次且','苋陆夬夬，中行无咎','无号，终有凶'],
  '姤':['系于金柅，贞吉有攸往','包有鱼，无咎不利宾','臀无肤，其行次且厉无大咎','包无鱼，起凶','以杞包瓜，含章有陨自天','姤其角，吝无咎'],
  '萃':['有孚不终，乃乱乃萃','引吉无咎，孚乃利用禴','萃如嗟如，无攸利往无咎','大吉无咎','萃有位，无咎匪孚','齎咨涕洟，无咎'],
  '升':['允升，大吉','孚乃利用禴，无咎','升虚邑','王用亨于岐山，吉无咎','贞吉升阶','冥升，利于不息之贞'],
  '困':['臀困于株木，入于幽谷','困于酒食，朱绂方来','困于石，据于蒺藜','来徐徐，困于金车','劓刖，困于赤绂','困于葛藟，于臲卼'],
  '井':['井泥不食，旧井无禽','井谷射鲋，瓮敝漏','井渫不食，为我心恻','井甃，无咎','井洌寒泉，食','井收勿幕，有孚元吉'],
  '革':['巩用黄牛之革','巳日乃革之，征吉无咎','征凶，贞厉','悔亡，有孚改命吉','大人虎变，未占有孚','君子豹变，小人革面'],
  '鼎':['鼎颠趾，利出否','鼎有实，我仇有疾','鼎耳革，其行塞','鼎折足，覆公餗','鼎黄耳金铉，利贞','鼎玉铉，大吉无不利'],
  '震':['震来虩虩，后笑言哑哑吉','震来历，亿丧贝跻于九陵','震苏苏，震行无眚','震遂泥','震往来厉，亿无丧有事','震索索，视矍矍征凶'],
  '艮':['艮其趾，无咎利用恒','艮其腓，不拯其随心不快','艮其限，列其夤厉薰心','艮其身，无咎','艮其辅，言有序悔亡','敦艮，吉'],
  '渐':['鸿渐于干，小子厉有言','鸿渐于磐，饮食衎衎吉','鸿渐于陆，夫征不复','鸿渐于木，或得其桷','鸿渐于陵，妇三岁不孕','鸿渐于逵，其羽可用为仪'],
  '归妹':['归妹以娣，跛能履征吉','眇能视，利幽人之贞','归妹以须，反归以娣','归妹愆期，迟归有时','帝乙归妹，其君之袂','女承筐无实，士刲羊无血'],
  '丰':['遇其配主，虽旬无咎往有尚','丰其蔀，日中见斗往得疑疾','丰其沛，日中见沬折其右肱','丰其蔀，日中见斗遇其夷主','来章，有庆誉吉','丰其屋，蔀其家窥其户'],
  '旅':['旅琐琐，斯其所取灾','旅即次，怀其资得童仆贞','旅焚其次，丧其童仆贞厉','旅于处，得其资斧我心不快','射雉一矢亡，终以誉命','鸟焚其巢，旅人先笑后号咷'],
  '巽':['进退，利武人之贞','巽在床下，用史巫纷若吉','频巽，吝','悔亡，田获三品','贞吉悔亡无不利','巽在床下，丧其资斧贞凶'],
  '兑':['和兑，吉','孚兑，吉悔亡','来兑，凶','商兑未宁，介疾有喜','孚于剥，有厉','引兑'],
  '涣':['用拯马壮，吉','涣奔其机，悔亡','涣其躬，无悔','涣其群，元吉涣有丘','涣汗其大号，涣王居无咎','涣其血，去逖出无咎'],
  '节':['不出户庭，无咎','不出门庭，凶','不节若，则嗟若无咎','安节，亨','甘节，吉往有尚','苦节，贞凶悔亡'],
  '中孚':['虞吉，有它不燕','鹤鸣在阴，其子和之','得敌，或鼓或罢或泣或歌','月几望，马匹亡无咎','有孚挛如，无咎','翰音登于天，贞凶'],
  '小过':['飞鸟以凶','过其祖，遇其妣','弗过防之，从或戕之','无咎，弗过遇之往厉必戒','密云不雨，自我西郊','弗遇过之，飞鸟离之凶'],
  '既济':['曳其轮，濡其尾无咎','妇丧其茀，勿逐七日得','高宗伐鬼方，三年克之','繻有衣袽，终日戒','东邻杀牛，不如西邻之禴祭','濡其首，厉'],
  '未济':['濡其尾，吝','曳其轮，贞吉','未济征凶，利涉大川','贞吉悔亡，震用伐鬼方三年','贞吉无悔，君子之光有孚','饮酒濡首，亦不知节矣']
};

var _YAO_POS_MEANING = {
  0: {name:'初爻', detail:'事物发端之时，影响根基。初爻吉则根基稳固，初爻凶则起步艰难。初爻为潜藏之位，宜蓄积不宜显露。'},
  1: {name:'二爻', detail:'事物渐成但未成之时。二爻为内卦中位，主资质禀赋。二爻吉则才华可展，二爻凶则内在不足。'},
  2: {name:'三爻', detail:'事物发展最费力之时。三爻为内外之交，主变动过渡。三爻吉则化险为夷，三爻凶则进退两难。'},
  3: {name:'四爻', detail:'事物接近完成之时。四爻为外卦初位，主进退出入。四爻吉则接近成功，四爻凶则功败垂成。'},
  4: {name:'五爻', detail:'事物大成之时。五爻为外卦中位，主尊贵之位。五爻吉则功成名就，五爻凶则高处不胜寒。'},
  5: {name:'上爻', detail:'事物极盛将衰之时。上爻为终极之位。上爻吉则善始善终，上爻凶则乐极生悲。'}
};

function _yjWxRelation(a, b) {
  if (a === b) return '比和';
  var sheng = {'金生水':1,'水生木':1,'木生火':1,'火生土':1,'土生金':1};
  if (sheng[a+'生'+b]) return '我生';
  if (sheng[b+'生'+a]) return '生我';
  var ke = {'金克木':1,'木克土':1,'土克水':1,'水克火':1,'火克金':1};
  if (ke[a+'克'+b]) return '我克';
  if (ke[b+'克'+a]) return '克我';
  return '比和';
}

function getYijingReadingV2(guaName, yaoData, question) {
  if (!guaName) guaName = '乾';
  if (!question) question = '所问之事';
  
  var hex = _YJ_HEX_DATA[guaName];
  if (!hex) {
    return {summary: '卦象参悟中', yaoci: '', analysis: '此卦需结合具体问事分析', dimensions: {事业:'★★☆ 待确认', 财运:'★★☆ 待确认', 婚姻:'★★☆ 待确认', 健康:'★★☆ 待确认'}, advice: '综合判断后给出建议，一切随缘', timing: '应期视具体动爻而定'};
  }
  
  var upperWx = _YJ_GUA_XIANG[hex.upper] ? _YJ_GUA_XIANG[hex.upper].wuxing : '金';
  var lowerWx = _YJ_GUA_XIANG[hex.lower] ? _YJ_GUA_XIANG[hex.lower].wuxing : '金';
  var guaWx = hex.wuxing || '金';
  
  var dongYaos = [];
  if (yaoData && yaoData.dongYao !== undefined) {
    var dongIdx = yaoData.dongYao;
    dongYaos = Array.isArray(dongIdx) ? dongIdx : [dongIdx];
  }
  if (dongYaos.length === 0) dongYaos = [4];
  
  var yaociParts = [];
  if (_YJ_YAO_CI[guaName]) {
    for (var di = 0; di < dongYaos.length; di++) {
      var dy = dongYaos[di];
      if (dy >= 0 && dy < 6) {
        var yaoText = _YJ_YAO_CI[guaName][dy] || '爻象参详';
        var posInfo = _YAO_POS_MEANING[dy] || {name:'第'+(dy+1)+'爻', detail:''};
        yaociParts.push(posInfo.name + '「' + yaoText + '」——' + posInfo.detail);
      }
    }
  }
  var yaociStr = yaociParts.join('\n') || '本卦无动爻，以卦象整体论之。';
  
  var isBodyInner = dongYaos.length < 3;
  var tiGua = isBodyInner ? hex.lower : hex.upper;
  var yongGua = isBodyInner ? hex.upper : hex.lower;
  var tiName = _YJ_GUA_XIANG[tiGua] ? _YJ_GUA_XIANG[tiGua].name : '未知';
  var yongName = _YJ_GUA_XIANG[yongGua] ? _YJ_GUA_XIANG[yongGua].name : '未知';
  var tiWx = _YJ_GUA_XIANG[tiGua] ? _YJ_GUA_XIANG[tiGua].wuxing : lowerWx;
  var yongWx = _YJ_GUA_XIANG[yongGua] ? _YJ_GUA_XIANG[yongGua].wuxing : upperWx;
  var tyRel = _yjWxRelation(tiWx, yongWx);
  
  var tyText = '体卦为' + tiName + '（' + tiWx + '），用卦为' + yongName + '（' + yongWx + '）。';
  if (tyRel === '生我') tyText += '用生体，事得外力相助，易于成功。';
  else if (tyRel === '我生') tyText += '体生用，先付出而后得，虽有耗损终成事。';
  else if (tyRel === '比和') tyText += '体用比和，内外一致，谋事顺遂。';
  else if (tyRel === '克我') tyText += '用克体，事受压制，阻力较多，宜谨慎行事。';
  else if (tyRel === '我克') tyText += '体克用，我克制事，可成但需费力。';
  
  var q = question.toLowerCase();
  var isCareer = q.indexOf('事业') >= 0 || q.indexOf('工作') >= 0 || q.indexOf('官') >= 0 || q.indexOf('职') >= 0;
  var isWealth = q.indexOf('财') >= 0 || q.indexOf('钱') >= 0 || q.indexOf('投资') >= 0 || q.indexOf('生意') >= 0;
  var isMarriage = q.indexOf('婚') >= 0 || q.indexOf('感') >= 0 || q.indexOf('恋爱') >= 0 || q.indexOf('姻') >= 0 || q.indexOf('情') >= 0;
  var isHealth = q.indexOf('健康') >= 0 || q.indexOf('病') >= 0 || q.indexOf('身') >= 0 || q.indexOf('医') >= 0;
  
  var jiXiong = '平';
  var score = 3;
  if (tyRel === '生我') { jiXiong = '吉'; score = 4.2; }
  else if (tyRel === '比和') { jiXiong = '吉'; score = 4; }
  else if (tyRel === '我克') { jiXiong = '小吉'; score = 3.5; }
  else if (tyRel === '我生') { jiXiong = '平'; score = 2.5; }
  else if (tyRel === '克我') { jiXiong = '凶'; score = 1.5; }
  
  var jiHex = ['泰','大有','谦','随','复','益','升','晋','既济','家人'];
  var xiongHex = ['否','剥','蹇','困','明夷','坎','大过','未济'];
  if (jiHex.indexOf(guaName) >= 0) { score += 0.8; if (jiXiong !== '凶') jiXiong = '吉'; }
  if (xiongHex.indexOf(guaName) >= 0) { score -= 0.8; if (jiXiong !== '吉') jiXiong = '凶'; }
  
  var jiYao = [1,4,5];
  var xiongYao = [0,2,3];
  for (var yi = 0; yi < dongYaos.length; yi++) {
    if (jiYao.indexOf(dongYaos[yi]) >= 0) score += 0.3;
    if (xiongYao.indexOf(dongYaos[yi]) >= 0) score -= 0.3;
  }
  score = Math.max(0.5, Math.min(5, score));
  
  var analysisParts = [];
  analysisParts.push('1. 卦象核心：' + hex.summary + '。「' + hex.meaning + '」。' + guaName + '卦属' + guaWx + '，' + (hex.gong || '八纯') + '宫。');
  analysisParts.push('2. 体用关系：' + tyText);
  analysisParts.push('3. 吉凶判断：' + jiXiong + '（' + _qmStars(score) + '）。');
  
  if (isCareer) analysisParts.push('4. 问事业：' + (hex.gong === '乾' || hex.gong === '震' ? '刚健进取之象，事业宜主动出击。' : hex.gong === '坤' || hex.gong === '艮' ? '厚德载物之象，事业宜稳扎稳打。' : hex.gong === '离' || hex.gong === '兑' ? '文明悦合之象，事业宜人际合作。' : '此卦中平，事业按部就班即可。') + (tyRel === '生我' ? '用生体，外部助力明显。' : tyRel === '克我' ? '用克体，阻力较大，宜等待时机。' : '体用关系平和，按计划行事。'));
  else if (isWealth) analysisParts.push('4. 问财运：' + (guaWx === '金' ? '金卦主财，求财有望但需谨慎。' : guaWx === '水' ? '水卦主流通，财运流动不居。' : guaWx === '木' ? '木卦主生发，财运渐长。' : guaWx === '火' ? '火卦主迅猛，财来快去亦快。' : '土卦主积蓄，财运稳定。') + (tyRel === '克我' ? '用克体，防破财。' : tyRel === '生我' ? '用生体，财来就我。' : '收支平衡。'));
  else if (isMarriage) analysisParts.push('4. 问婚姻：' + (guaName === '咸' || guaName === '归妹' || guaName === '家人' ? '此为婚恋吉卦。' : guaName === '睽' ? '睽卦主乖离，感情需多沟通。' : '此卦于婚姻' + (jiXiong === '吉' ? '吉，可成' : jiXiong === '凶' ? '不利，需多努力' : '中平，顺其自然') + '。'));
  else if (isHealth) analysisParts.push('4. 问健康：' + (guaWx === '金' ? '金卦主肺，注意呼吸系统。' : guaWx === '木' ? '木卦主肝，注意肝胆。' : guaWx === '水' ? '水卦主肾，注意泌尿系统。' : guaWx === '火' ? '火卦主心，注意心脑血管。' : '土卦主脾胃，注意消化系统。') + (jiXiong === '凶' ? '需注意调养。' : '身体状态尚可。'));
  else analysisParts.push('4. 问' + (question || '事') + '：' + hex.summary + '。' + (tyRel === '生我' ? '此事得外部助力。' : tyRel === '克我' ? '此事有阻力，需提前准备。' : '此事平顺。'));
  
  var analysis = analysisParts.join('\n');
  
  var dimScore = function(baseScore, topic) {
    var s = baseScore;
    if (topic === '事业' && hex.gong === '乾') s += 0.5;
    if (topic === '财运' && guaWx === '金') s += 0.5;
    if (topic === '婚姻' && (guaName === '咸' || guaName === '归妹' || guaName === '家人')) s += 0.8;
    if (topic === '婚姻' && (guaName === '睽' || guaName === '明夷')) s -= 0.5;
    if (topic === '健康' && guaWx === '土') s += 0.3;
    if (topic === '健康' && guaWx === '水') s -= 0.2;
    return Math.max(0.5, Math.min(5, s));
  };
  
  var cs = dimScore(score, '事业'), ws2 = dimScore(score, '财运'), ms = dimScore(score, '婚姻'), hs2 = dimScore(score, '健康');
  var dimText = function(topic, sVal, extra) {
    var stars = _qmStars(sVal);
    if (sVal >= 4) return stars + ' ' + topic + '运佳，' + (extra || '顺遂之象');
    if (sVal >= 3) return stars + ' ' + topic + '运中平，' + (extra || '按部就班');
    return stars + ' ' + topic + '运欠佳，' + (extra || '宜谨慎行事');
  };
  
  var dimensions = {
    事业: dimText('事业', cs, hex.gong === '乾' ? '刚健有成' : '稳步前行'),
    财运: dimText('财运', ws2, guaWx === '金' ? '财星得力' : '收支平衡'),
    婚姻: dimText('婚姻', ms, guaName === '咸' ? '感通天地' : '顺其自然'),
    健康: dimText('健康', hs2, guaWx === '土' ? '脾土稳固' : '注意调理')
  };
  
  var adviceParts = [];
  if (tyRel === '生我') adviceParts.push('万事吉顺，宜积极行动，把握良机。');
  else if (tyRel === '比和') adviceParts.push('内外和谐，宜合作共事，团队发力。');
  else if (tyRel === '我克') adviceParts.push('事虽可成，但需付出相当努力，不可轻敌。');
  else if (tyRel === '我生') adviceParts.push('时运稍耗，宜适当节制，积蓄力量。');
  else if (tyRel === '克我') adviceParts.push('当前局势不利，宜暂避锋芒，等待转机。');
  
  if (dongYaos.length > 0) {
    var dy0 = dongYaos[0];
    if (dy0 === 0) adviceParts.push('初爻动，事在初始，宜慎重奠基。');
    else if (dy0 === 1) adviceParts.push('二爻动，事态方兴，宜积极表现。');
    else if (dy0 === 2) adviceParts.push('三爻动，事到中途，需多加努力。');
    else if (dy0 === 3) adviceParts.push('四爻动，事将成就，不可半途而废。');
    else if (dy0 === 4) adviceParts.push('五爻动，事已大成，宜守成勿贪。');
    else if (dy0 === 5) adviceParts.push('上爻动，事至极盛，宜见好就收。');
  }
  var advice = adviceParts.join('');
  
  var wxWangTime = {'金':'秋季','木':'春季','水':'冬季','火':'夏季','土':'四季末'};
  var wxWangYue = {'金':['申','酉'],'木':['寅','卯'],'水':['亥','子'],'火':['巳','午'],'土':['辰','戌','丑','未']};
  var guaWangYue = wxWangYue[guaWx] || ['辰','戌'];
  var timing = '卦气旺于' + (wxWangTime[guaWx] || '当令之时') + '（' + guaWangYue.join('、') + '月）';
  if (dongYaos.length > 0) timing += '，动爻在' + (dongYaos[0]+1) + '位，主' + (dongYaos[0]+1) + '个月内或有应验';
  else timing += '，无动爻，以三个月至半年为参考';
  
  var summary = hex.summary + '。「' + hex.meaning + '」' + guaName + '卦' + (jiXiong === '吉' ? '大吉之象。' : jiXiong === '凶' ? '须谨慎之象。' : '平顺之象。') + '动' + (dongYaos.length > 0 ? dongYaos.map(function(d){ return '第'+(d+1)+'爻'; }).join('、') : '静') + '，' + (tyRel === '生我' ? '外力相助' : tyRel === '克我' ? '外力相阻' : '内外相合') + '。';
  
  return {
    summary: summary,
    yaoci: yaociStr,
    analysis: analysis,
    dimensions: dimensions,
    advice: advice,
    timing: timing,
    score: score,
    jiXiong: jiXiong,
    tiGua: tiName + '(' + tiWx + ')',
    yongGua: yongName + '(' + yongWx + ')',
    tiYong: tyRel
  };
}

function getYijingReadingHTML(guaName) {
  var r = getYijingReading(guaName);
  var html = '';
  html += '<div class="analysis-card" style="border:1px solid rgba(201,168,76,.2);margin-top:20px">';
  html += '<h5 style="font-size:16px;color:var(--gold);letter-spacing:4px">📖 卦象解读</h5>';
  html += '<p style="font-size:18px;font-family:\'Ma Shan Zheng\',serif;color:var(--gold);margin:16px 0">「' + r.summary + '」</p>';
  if (r.yaoci) html += '<p style="font-size:13px;line-height:1.8;opacity:.7;white-space:pre-line">' + r.yaoci + '</p>';
  if (r.analysis) html += '<p style="font-size:13px;line-height:1.8;opacity:.7;white-space:pre-line">' + r.analysis + '</p>';
  html += '<p style="font-size:14px;line-height:2;opacity:.8">' + (r.advice || '') + '</p>';
  if (r.timing) html += '<p style="font-size:12px;line-height:1.8;opacity:.6">⏰ ' + r.timing + '</p>';
  var dims = r.dimensions || {};
  html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:16px;text-align:center;font-size:12px">';
  html += '<div>事业：' + (dims['事业']||'') + '</div>';
  html += '<div>财运：' + (dims['财运']||'') + '</div>';
  html += '<div>婚姻：' + (dims['婚姻']||'') + '</div>';
  html += '<div>健康：' + (dims['健康']||'') + '</div>';
  html += '</div>';
  html += '</div>';
  return html;
}

function getQimenReading(palace) {
  // Legacy fallback - now delegates to V2 with minimal data
  return getQimenReadingV2(palace, null, '', null);
}

// ========== 奇门遁甲 V2 动态解读引擎 ==========

// 用神取法表：问事类型 → 对应用神
var _QM_YONGSHEN_MAP = {
  '财':'生门','求财':'生门','投资':'生门','生意':'生门','交易':'生门',
  '官':'开门','事业':'开门','工作':'开门','升迁':'开门','求职':'开门',
  '婚':'六合','婚姻':'六合','感情':'六合','恋爱':'六合','相亲':'六合',
  '病':'天芮','疾病':'天芮','健康':'天芮','身体':'天芮',
  '出行':'景门','旅游':'景门','出差':'景门',
  '考试':'天辅','学业':'天辅','升学':'天辅','文考':'天辅',
  '诉讼':'惊门','官司':'惊门','争':'惊门','纠纷':'惊门',
  '盗':'玄武','贼':'玄武','失':'玄武','丢失':'玄武',
  '住宅':'生门','风水':'生门','搬家':'生门','置产':'生门'
};

// 宫位五行表
var _QM_PALACE_WX = {1:'水',2:'土',3:'木',4:'木',5:'土',6:'金',7:'金',8:'土',9:'火'};

// 宫位方位表
var _QM_PALACE_DIR = {1:'正北',2:'西南',3:'正东',4:'东南',5:'中央',6:'西北',7:'正西',8:'东北',9:'正南'};

// 九星五行表
var _QM_STAR_WX = {'天蓬':'水','天芮':'土','天冲':'木','天辅':'木','天禽':'土','天心':'金','天柱':'金','天任':'土','天英':'火'};

// 八门五行表
var _QM_MEN_WX = {'休门':'水','生门':'土','伤门':'木','杜门':'木','景门':'火','死门':'土','惊门':'金','开门':'金'};

// 八神五行表
var _QM_SHEN_WX = {'值符':'木','青龙':'木','太阴':'金','六合':'木','勾陈':'土','白虎':'金','玄武':'水','螣蛇':'火','九天':'金','九地':'土'};

// 六仪三奇五行表
var _QM_QI_WX = {'戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水','丁':'火','丙':'火','乙':'木'};

// 吉门列表
var _QM_JI_MEN = ['休门','生门','开门'];
// 凶门列表
var _QM_XIONG_MEN = ['死门','惊门','伤门'];
// 吉星列表
var _QM_JI_STAR = ['天辅','天心','天任','天禽'];
// 凶星列表
var _QM_XIONG_STAR = ['天蓬','天芮','天冲','天柱','天英'];
// 吉神列表
var _QM_JI_SHEN = ['值符','青龙','太阴','六合','九天','九地'];
// 凶神列表
var _QM_XIONG_SHEN = ['白虎','玄武','螣蛇','勾陈'];

// 五行生克关系
function _qmWxRelation(a, b) {
  if (a === b) return '比和';
  var sheng = {'金生水':1,'水生木':1,'木生火':1,'火生土':1,'土生金':1};
  if (sheng[a+'生'+b]) return '我生';
  if (sheng[b+'生'+a]) return '生我';
  var ke = {'金克木':1,'木克土':1,'土克水':1,'水克火':1,'火克金':1};
  if (ke[a+'克'+b]) return '我克';
  if (ke[b+'克'+a]) return '克我';
  return '比和';
}

// 星级评分计算（基于五行生克+格局吉凶）
function _qmScore(palace, men, star, shen, qi, geju, kongwang) {
  var base = 3; // 基础3星
  var palaceWx = _QM_PALACE_WX[palace] || '土';
  var menWx = _QM_MEN_WX[men] || '土';
  var starWx = _QM_STAR_WX[star] || '土';
  var shenWx = _QM_SHEN_WX[shen] || '土';
  var qiWx = _QM_QI_WX[qi] || '土';
  
  // 门与宫的关系
  var menRel = _qmWxRelation(menWx, palaceWx);
  if (_QM_JI_MEN.indexOf(men) >= 0) {
    if (menRel === '生我' || menRel === '比和') base += 1;
    base += 1;
  } else if (_QM_XIONG_MEN.indexOf(men) >= 0) {
    if (menRel === '克我') base -= 2;
    else base -= 1;
  }
  
  // 星与宫的关系
  var starRel = _qmWxRelation(starWx, palaceWx);
  if (_QM_JI_STAR.indexOf(star) >= 0) {
    if (starRel === '生我' || starRel === '比和') base += 1;
    base += 0.5;
  } else if (_QM_XIONG_STAR.indexOf(star) >= 0) {
    if (starRel === '克我') base -= 1.5;
    else base -= 0.5;
  }
  
  // 神与宫的关系
  if (_QM_JI_SHEN.indexOf(shen) >= 0) base += 0.5;
  else if (_QM_XIONG_SHEN.indexOf(shen) >= 0) base -= 0.5;
  
  // 奇仪与宫的关系
  var qiRel = _qmWxRelation(qiWx, palaceWx);
  if (qiRel === '生我' || qiRel === '比和') base += 0.5;
  else if (qiRel === '克我') base -= 0.5;
  
  // 格局加减
  if (geju && geju.length > 0) {
    for (var i = 0; i < geju.length; i++) {
      var g = geju[i];
      if (g.indexOf('青龙返首') >= 0 || g.indexOf('飞鸟跌穴') >= 0 || g.indexOf('玉女守门') >= 0 || g.indexOf('真诈') >= 0) base += 1.5;
      else if (g.indexOf('假诈') >= 0 || g.indexOf('重诈') >= 0) base += 0.5;
      else if (g.indexOf('太白入荧') >= 0 || g.indexOf('荧入太白') >= 0) base -= 1;
      else if (g.indexOf('青龙折足') >= 0 || g.indexOf('腾蛇夭矫') >= 0 || g.indexOf('朱雀投江') >= 0) base -= 1;
      else if (g.indexOf('伏吟') >= 0) base -= 0.5;
      else if (g.indexOf('反吟') >= 0) base -= 1;
    }
  }
  
  // 空亡减力
  if (kongwang) base -= 1.5;
  
  return Math.max(0.5, Math.min(5, base));
}

// 将分数转为星级字符串
function _qmStars(score) {
  var full = Math.floor(score);
  var half = (score - full) >= 0.5;
  var s = '';
  for (var i = 0; i < full; i++) s += '★';
  if (half && full < 5) s += '☆';
  while (s.replace(/[^★]/g,'').length + (half?1:0) < 5 && s.length < 10) {
    if (s.length < 10) s += '☆';
    else break;
  }
  if (!s) s = '☆';
  return s;
}

// 四害化解方案表
var _QM_SIHAI_HUAJIE = {
  '死门': {mascot:'铜铃/六字真言', direction:'东北方', color:'黄色/金色', method:'寅时(凌晨3-5点)挂铜铃于门楣，诵六字大明咒七遍'},
  '惊门': {mascot:'白色水晶/金属风铃', direction:'正西方', color:'白色/银色', method:'酉时(下午5-7点)置白水晶于西窗台，挂金属风铃'},
  '伤门': {mascot:'红色装饰/紫水晶', direction:'正东方', color:'红色/紫色', method:'卯时(上午5-7点)置紫水晶于东方位，配红色装饰'},
  '杜门': {mascot:'绿色植物/木质文昌塔', direction:'东南方', color:'绿色/青色', method:'辰时(上午7-9点)置绿植或文昌塔于东南方位'}
};

// 吉祥物推荐表（基于五行）
var _QM_MASCOT_BY_WX = {
  '金': ['铜葫芦','金属风铃','白水晶','铜麒麟','金元宝'],
  '木': ['绿檀手串','绿幽灵水晶','文昌塔','竹节饰品','翡翠'],
  '水': ['黑曜石','蓝砂石','水晶球','龙龟','鱼缸'],
  '火': ['红玛瑙','石榴石','紫水晶','红绳','琉璃摆件'],
  '土': ['黄水晶','陶器','玉石摆件','泰山石','黄龙玉']
};

// 本地天干表（避免跨script块依赖）
var _QM_STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];

// 格局全名格式化
function _qmFormatGeju(gejuList) {
  if (!gejuList || gejuList.length === 0) return '无明显特殊格局';
  var ji = [], xiong = [];
  for (var i = 0; i < gejuList.length; i++) {
    var g = gejuList[i];
    var isJi = g.indexOf('青龙返首') >= 0 || g.indexOf('飞鸟跌穴') >= 0 || g.indexOf('玉女守门') >= 0 ||
               g.indexOf('真诈') >= 0 || g.indexOf('假诈') >= 0 || g.indexOf('重诈') >= 0 ||
               g.indexOf('天假') >= 0 || g.indexOf('地假') >= 0 || g.indexOf('人假') >= 0;
    var isXiong = g.indexOf('太白入荧') >= 0 || g.indexOf('荧入太白') >= 0 || g.indexOf('青龙折足') >= 0 ||
                  g.indexOf('腾蛇夭矫') >= 0 || g.indexOf('朱雀投江') >= 0 || g.indexOf('五不遇时') >= 0 ||
                  g.indexOf('伏吟') >= 0 || g.indexOf('反吟') >= 0;
    if (isJi) ji.push(g);
    else if (isXiong) xiong.push(g);
  }
  var result = '';
  if (ji.length > 0) result += '吉格：' + ji.join('、') + '。';
  if (xiong.length > 0) result += (result ? ' ' : '') + '凶格：' + xiong.join('、') + '。';
  if (!result) result = '格局平和，无特殊吉凶格。';
  return result;
}

// 五不遇时判断
function _qmCheckWuBuYuShi(dayGanIdx, hourGzIdx) {
  // 五不遇时: 甲己日庚午时, 乙庚日丙子时, 丙辛日戊子时, 丁壬日壬寅时, 戊癸日甲寅时
  // 简化: 时干克日干, 且为阳克阳/阴克阴
  var _stems = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  var dayGan = dayGanIdx % 10;
  var hourGan = hourGzIdx % 10;
  var dayStem = _stems[dayGan];
  var hourStem = _stems[hourGan];
  var gangsters = {'甲':'庚','乙':'辛','丙':'壬','丁':'癸','戊':'甲','己':'乙','庚':'丙','辛':'丁','壬':'戊','癸':'己'};
  if (gangsters[dayStem] === hourStem) return true;
  return false;
}

// 马星位置计算
function _qmGetMaXing(hourZhiIdx) {
  // 马星: 申子辰马在寅, 巳酉丑马在亥, 寅午戌马在申, 亥卯未马在巳
  // 时支三合局定马星
  var maMap = {0:'寅',4:'寅',8:'寅', 5:'亥',9:'亥',1:'亥', 2:'申',6:'申',10:'申', 3:'巳',7:'巳',11:'巳'};
  var maZhi = maMap[hourZhiIdx];
  var maGongMap = {'子':1,'丑':8,'寅':8,'卯':3,'辰':4,'巳':4,'午':9,'未':2,'申':2,'酉':7,'戌':6,'亥':6};
  return maGongMap[maZhi] || 5;
}

// 空亡宫位计算
function _qmGetKongWang(dayGzIdx) {
  // 旬空: 甲子旬空戌亥, 甲戌旬空申酉, 甲申旬空午未, 甲午旬空辰巳, 甲辰旬空寅卯, 甲寅旬空子丑
  var xunKong = ['戌亥','申酉','午未','辰巳','寅卯','子丑'];
  var xunIdx = Math.floor((dayGzIdx % 60) / 10);
  var kongZhi = xunKong[xunIdx];
  var kongGongMap = {'子':1,'丑':8,'寅':8,'卯':3,'辰':4,'巳':4,'午':9,'未':2,'申':2,'酉':7,'戌':6,'亥':6};
  var kong1 = kongGongMap[kongZhi[0]];
  var kong2 = kongGongMap[kongZhi[1]];
  return [kong1, kong2];
}

function getQimenReadingV2(palace, panData, question, baziData) {
  // 如果没有panData，用基础信息构建
  if (!panData) {
    panData = {
      dipan: {}, tianpan: {}, men: {}, stars: {}, shen: {},
      dayGzIdx: 0, hourGzIdx: 0, dun: 'yang', ju: 1
    };
  }
  
  // 用神取法
  var yongShen = '开门'; // 默认事业
  if (question) {
    for (var key in _QM_YONGSHEN_MAP) {
      if (question.indexOf(key) >= 0) { yongShen = _QM_YONGSHEN_MAP[key]; break; }
    }
  }
  
  // 用神落宫
  var yongShenPalace = palace || 5;
  if (panData.men || panData.stars || panData.shen) {
    for (var p = 1; p <= 9; p++) {
      if (panData.men[p] === yongShen || (panData.stars && panData.stars[p] === yongShen) || (panData.shen && panData.shen[p] === yongShen)) {
        yongShenPalace = p; break;
      }
    }
  }
  
  // 中宫寄宫处理
  var kongwangFlag = false;
  if (yongShenPalace === 5) {
    kongwangFlag = true;
    yongShenPalace = panData.dun === 'yin' ? 2 : 8;
  }
  
  // 获取用神宫的星门神仪
  var men = panData.men ? (panData.men[yongShenPalace] || '') : '';
  var star = panData.stars ? (panData.stars[yongShenPalace] || '') : '';
  var shen = panData.shen ? (panData.shen[yongShenPalace] || '') : '';
  var qi = panData.tianpan ? (panData.tianpan[yongShenPalace] || '') : '';
  var diQi = panData.dipan ? (panData.dipan[yongShenPalace] || '') : '';
  
  // 确保门名完整（如'开'→'开门'）
  if (men && men.length === 1) {
    var menFullMap = {'休':'休门','生':'生门','伤':'伤门','杜':'杜门','景':'景门','死':'死门','惊':'惊门','开':'开门'};
    men = menFullMap[men] || men;
  }
  // 确保星名完整（如'心'→'天心'）
  if (star && star.length === 1) {
    var starFullMap = {'蓬':'天蓬','芮':'天芮','冲':'天冲','辅':'天辅','英':'天英','禽':'天禽','心':'天心','柱':'天柱','任':'天任'};
    star = starFullMap[star] || star;
  }
  // 确保神名完整
  if (shen && shen.length === 1) {
    var shenFullMap = {'符':'值符','龙':'青龙','冲':'螣蛇','辅':'太阴','英':'六合','芮':'白虎','柱':'玄武','心':'九天'};
    shen = shenFullMap[shen] || shen;
  }
  
  // 格局判断
  var geju = [];
  if (panData.dipan && panData.tianpan) {
    for (var p2 = 1; p2 <= 9; p2++) {
      var dip = panData.dipan[p2] || '';
      var tip = panData.tianpan[p2] || '';
      if (!dip || !tip) continue;
      // 青龙返首: 天盘戊加地盘戊
      if (tip === '戊' && dip === '戊') geju.push(p2 + '宫青龙返首');
      // 飞鸟跌穴: 天盘丙加地盘戊
      if (tip === '丙' && dip === '戊') geju.push(p2 + '宫飞鸟跌穴');
      // 玉女守门: 丁加开门所在宫
      if (tip === '丁' && panData.men && panData.men[p2] === '开') geju.push(p2 + '宫玉女守门');
      // 太白入荧: 庚加丙
      if (tip === '庚' && dip === '丙') geju.push(p2 + '宫太白入荧');
      // 荧入太白: 丙加庚
      if (tip === '丙' && dip === '庚') geju.push(p2 + '宫荧入太白');
      // 青龙折足: 戊加辛
      if (tip === '戊' && dip === '辛') geju.push(p2 + '宫青龙折足');
      // 腾蛇夭矫: 辛加乙
      if (tip === '辛' && dip === '乙') geju.push(p2 + '宫腾蛇夭矫');
      // 朱雀投江: 丁加癸
      if (tip === '丁' && dip === '癸') geju.push(p2 + '宫朱雀投江');
      // 伏吟: 天盘与地盘相同
      if (dip === tip && tip !== '戊') geju.push(p2 + '宫伏吟');
    }
    // 三诈五假检查
    for (var p3 = 1; p3 <= 9; p3++) {
      if (p3 === 5) continue;
      var pm = panData.men ? (panData.men[p3] || '') : '';
      var ps = panData.stars ? (panData.stars[p3] || '') : '';
      var ph = panData.shen ? (panData.shen[p3] || '') : '';
      if (!pm || !ps || !ph) continue;
      var pmFull = pm.length === 1 ? ({'休':'休门','生':'生门','伤':'伤门','杜':'杜门','景':'景门','死':'死门','惊':'惊门','开':'开门'}[pm] || pm) : pm;
      var psFull = ps.length === 1 ? ({'蓬':'天蓬','芮':'天芮','冲':'天冲','辅':'天辅','英':'天英','禽':'天禽','心':'天心','柱':'天柱','任':'天任'}[ps] || ps) : ps;
      var phFull = ph.length === 1 ? ({'符':'值符','龙':'青龙','冲':'螣蛇','辅':'太阴','英':'六合','芮':'白虎','柱':'玄武','心':'九天'}[ph] || ph) : ph;
      if (_QM_JI_MEN.indexOf(pmFull) >= 0 && _QM_JI_STAR.indexOf(psFull) >= 0 && _QM_JI_SHEN.indexOf(phFull) >= 0) {
        geju.push(p3 + '宫真诈格');
      } else if (_QM_JI_MEN.indexOf(pmFull) >= 0 && _QM_XIONG_STAR.indexOf(psFull) >= 0 && _QM_JI_SHEN.indexOf(phFull) >= 0) {
        geju.push(p3 + '宫假诈格');
      } else if (_QM_XIONG_MEN.indexOf(pmFull) >= 0 && _QM_JI_STAR.indexOf(psFull) >= 0 && _QM_JI_SHEN.indexOf(phFull) >= 0) {
        geju.push(p3 + '宫重诈格');
      }
    }
  }
  
  // 五不遇时
  var wuBuYu = false;
  if (panData.dayGzIdx !== undefined && panData.hourGzIdx !== undefined) {
    wuBuYu = _qmCheckWuBuYuShi(panData.dayGzIdx % 10, panData.hourGzIdx % 10);
    if (wuBuYu) geju.push('五不遇时');
  }
  
  // 空亡判断
  var kongWangGongs = [];
  if (panData.dayGzIdx !== undefined) {
    kongWangGongs = _qmGetKongWang(panData.dayGzIdx);
  }
  var isKongWang = kongWangGongs.indexOf(yongShenPalace) >= 0 || kongwangFlag;
  
  // 马星判断
  var maXingGong = 0;
  if (panData.hourGzIdx !== undefined) {
    maXingGong = _qmGetMaXing(panData.hourGzIdx % 12);
  }
  var isMaXing = maXingGong === yongShenPalace;
  
  // 日干落宫（命主状态）
  var dayGanPalace = 0;
  var dayGanQi = '';
  if (panData.dayGzIdx !== undefined && panData.dipan) {
    var dayGan = _QM_STEMS[panData.dayGzIdx % 10];
    for (var p4 = 1; p4 <= 9; p4++) {
      if (panData.dipan[p4] === dayGan) { dayGanPalace = p4; dayGanQi = panData.tianpan ? (panData.tianpan[p4] || '') : ''; break; }
    }
  }
  
  // 时干落宫（事体状态）
  var hourGanPalace = 0;
  var hourGanQi = '';
  if (panData.hourGzIdx !== undefined && panData.dipan) {
    var hourGan = _QM_STEMS[panData.hourGzIdx % 10];
    for (var p5 = 1; p5 <= 9; p5++) {
      if (panData.dipan[p5] === hourGan) { hourGanPalace = p5; hourGanQi = panData.tianpan ? (panData.tianpan[p5] || '') : ''; break; }
    }
  }
  
  // 综合评分
  var totalScore = _qmScore(yongShenPalace, men || '开门', star || '天心', shen || '值符', qi || '戊', geju, isKongWang);
  
  // 综合评断
  var palaceName = PALACE_INFO[yongShenPalace] ? PALACE_INFO[yongShenPalace].name : (yongShenPalace + '宫');
  var palaceWx = _QM_PALACE_WX[yongShenPalace] || '土';
  var palaceDir = _QM_PALACE_DIR[yongShenPalace] || '中央';
  
  var summaryParts = [];
  summaryParts.push('用神「' + yongShen + '」落' + palaceName + '（' + palaceWx + '局）');
  if (star) summaryParts.push('天盘' + star);
  if (men) summaryParts.push(men);
  if (shen) summaryParts.push(shen + '神');
  if (qi) summaryParts.push('奇仪' + qi);
  var summary = summaryParts.join('，');
  
  // 吉凶判断
  var luckLevel = '平';
  if (totalScore >= 4) luckLevel = '吉';
  else if (totalScore >= 3) luckLevel = '小吉';
  else if (totalScore >= 2) luckLevel = '平';
  else if (totalScore >= 1) luckLevel = '小凶';
  else luckLevel = '凶';
  
  summary += '。综合' + luckLevel + '（' + _qmStars(totalScore) + '）';
  if (isKongWang) summary += '，用神落空亡减力';
  if (isMaXing) summary += '，马星临宫加速';
  if (wuBuYu) summary += '，五不遇时大凶';
  
  // 详细分析
  var detailParts = [];
  detailParts.push('一、用神落宫分析：用神「' + yongShen + '」落于' + palaceName + '，' + palaceDir + '方位，属' + palaceWx + '局。');
  
  if (star) {
    var starWx = _QM_STAR_WX[star] || '土';
    var starRel = _qmWxRelation(starWx, palaceWx);
    var starJi = _QM_JI_STAR.indexOf(star) >= 0;
    detailParts.push('二、九星分析：天盘' + star + '（' + starWx + '），' + (starJi ? '为吉星' : '为凶星') + '，与宫位' + starRel + '。' + (starRel === '生我' || starRel === '比和' ? '星宫相生，吉力增强。' : starRel === '克我' ? '星克宫，减力之象。' : '星泄宫，耗费精力。'));
  }
  
  if (men) {
    var menWx = _QM_MEN_WX[men] || '土';
    var menRel = _qmWxRelation(menWx, palaceWx);
    var menJi = _QM_JI_MEN.indexOf(men) >= 0;
    detailParts.push('三、八门分析：' + men + '（' + menWx + '），' + (menJi ? '为吉门' : '为凶门') + '，与宫位' + menRel + '。' + (menRel === '生我' || menRel === '比和' ? '门宫相生，谋事可成。' : menRel === '克我' ? '门迫宫，事多阻碍。' : '门泄宫，需迂回而行。'));
  }
  
  if (shen) {
    var shenJi = _QM_JI_SHEN.indexOf(shen) >= 0;
    detailParts.push('四、八神分析：' + shen + '神，' + (shenJi ? '为吉神护卫，百恶消散。' : '为凶神临宫，宜谨慎防范。'));
  }
  
  if (qi) {
    var qiWx = _QM_QI_WX[qi] || '土';
    var qiRel = _qmWxRelation(qiWx, palaceWx);
    detailParts.push('五、奇仪分析：天盘' + qi + '（' + qiWx + '），与宫位' + qiRel + '。' + (qiRel === '生我' || qiRel === '比和' ? '仪生宫，得地利。' : qiRel === '克我' ? '仪克宫，失地利。' : '仪泄宫，耗损之象。'));
  }
  
  // 命主关联
  if (dayGanPalace > 0) {
    var dayGanName = panData.dayGzIdx !== undefined ? _QM_STEMS[panData.dayGzIdx % 10] : '';
    detailParts.push('六、命主状态：日干' + dayGanName + '落' + (PALACE_INFO[dayGanPalace] ? PALACE_INFO[dayGanPalace].name : dayGanPalace + '宫') + (dayGanQi ? '，天盘' + dayGanQi : '') + '。' + (dayGanPalace === yongShenPalace ? '命主与用神同宫，主自身努力可成。' : '命主与用神异宫，需借力而行。'));
  }
  
  // 事体关联
  if (hourGanPalace > 0) {
    var hourGanName = panData.hourGzIdx !== undefined ? _QM_STEMS[panData.hourGzIdx % 10] : '';
    detailParts.push('七、事体状态：时干' + hourGanName + '落' + (PALACE_INFO[hourGanPalace] ? PALACE_INFO[hourGanPalace].name : hourGanPalace + '宫') + (hourGanQi ? '，天盘' + hourGanQi : '') + '。' + (hourGanPalace === yongShenPalace ? '事体与用神同宫，事可速成。' : '事体与用神异宫，需时日方能成就。'));
  }
  
  var detail = detailParts.join('\n');
  
  // 维度评分
  var dimScore = function(dimQuestion, dimYongShen) {
    var dimPalace = yongShenPalace;
    // 对不同维度，找对应的用神落宫
    for (var dp = 1; dp <= 9; dp++) {
      if (panData.men && panData.men[dp] === dimYongShen) { dimPalace = dp; break; }
      if (panData.stars && panData.stars[dp] === dimYongShen) { dimPalace = dp; break; }
      if (panData.shen && panData.shen[dp] === dimYongShen) { dimPalace = dp; break; }
    }
    var dMen = panData.men ? (panData.men[dimPalace] || '') : '';
    var dStar = panData.stars ? (panData.stars[dimPalace] || '') : '';
    var dShen = panData.shen ? (panData.shen[dimPalace] || '') : '';
    var dQi = panData.tianpan ? (panData.tianpan[dimPalace] || '') : '';
    if (dMen && dMen.length === 1) dMen = ({'休':'休门','生':'生门','伤':'伤门','杜':'杜门','景':'景门','死':'死门','惊':'惊门','开':'开门'}[dMen] || dMen);
    if (dStar && dStar.length === 1) dStar = ({'蓬':'天蓬','芮':'天芮','冲':'天冲','辅':'天辅','英':'天英','禽':'天禽','心':'天心','柱':'天柱','任':'天任'}[dStar] || dStar);
    if (dShen && dShen.length === 1) dShen = ({'符':'值符','龙':'青龙','冲':'螣蛇','辅':'太阴','英':'六合','芮':'白虎','柱':'玄武','心':'九天'}[dShen] || dShen);
    var dKong = kongWangGongs.indexOf(dimPalace) >= 0;
    return _qmScore(dimPalace, dMen || '开门', dStar || '天心', dShen || '值符', dQi || '戊', geju, dKong);
  };
  
  var careerScore = dimScore(question, '开门');
  var wealthScore = dimScore(question, '生门');
  var marriageScore = dimScore(question, '六合');
  var healthScore = dimScore(question, '天芮');
  var fengshuiScore = dimScore(question, '生门') * 0.7 + dimScore(question, '开门') * 0.3;
  
  var dimensions = {
    事业: _qmStars(careerScore) + ' ' + (careerScore >= 3 ? '事业宫位' + (PALACE_INFO[yongShenPalace]||{}).name + '，' + (men && _QM_JI_MEN.indexOf(men) >= 0 ? '吉门临宫，事业可成。' : men && _QM_XIONG_MEN.indexOf(men) >= 0 ? '凶门临宫，事业受阻。' : '门宫平和，稳步发展。') : '事业宫位欠佳，宜守不宜动。'),
    财运: _qmStars(wealthScore) + ' ' + (wealthScore >= 3 ? '生门落宫得地，财运亨通。' + (isMaXing ? '马星动财，求财迅速。' : '') : '财运宫位不佳，需谨慎投资。' + (isKongWang ? '空亡减力，财不落实。' : '')),
    婚姻: _qmStars(marriageScore) + ' ' + (marriageScore >= 3 ? '六合神临吉宫，姻缘可成。' : '婚姻宫位不佳，需耐心等待。'),
    健康: _qmStars(healthScore) + ' ' + (healthScore >= 3 ? '天芮星落宫不凶，健康无虞。' : '天芮星临凶宫，注意身体。' + (shen === '白虎' ? '白虎临宫，防血光之灾。' : '')),
    风水: _qmStars(fengshuiScore) + ' ' + (fengshuiScore >= 3 ? '风水宫位得宜，宅运平稳。' + palaceDir + '方位宜布置吉物。' : '风水宫位欠佳，' + palaceDir + '方位需化解。')
  };
  
  // 格局分析
  var gejuText = _qmFormatGeju(geju);
  
  // 空亡分析
  var kongwangText = '空亡在' + (kongWangGongs.length > 0 ? kongWangGongs.map(function(g){ return PALACE_INFO[g] ? PALACE_INFO[g].name : g + '宫'; }).join('、') : '无') + '。';
  if (isKongWang) kongwangText += '用神落空亡宫，谋事减力30-50%，需填实后方可成就。';
  else kongwangText += '用神不落空亡，谋事有力。';
  
  // 马星分析
  var maxingText = '马星在' + (maXingGong > 0 ? (PALACE_INFO[maXingGong] ? PALACE_INFO[maXingGong].name : maXingGong + '宫') : '未知') + '。';
  if (isMaXing) maxingText += '马星临用神宫，事动速成，但易反复。宜速战速决，不宜拖延。';
  else maxingText += '马星不临用神宫，事态平稳，按部就班。';
  
  // 四害分析
  var sihaiParts = [];
  var sihaiGongs = {};
  if (panData.men) {
    for (var sp = 1; sp <= 9; sp++) {
      if (sp === 5) continue;
      var spMen = panData.men[sp] || '';
      if (spMen && spMen.length === 1) spMen = ({'休':'休门','生':'生门','伤':'伤门','杜':'杜门','景':'景门','死':'死门','惊':'惊门','开':'开门'}[spMen] || spMen);
      if (spMen === '死门') sihaiGongs[sp] = '死门';
      else if (spMen === '惊门') sihaiGongs[sp] = '惊门';
      else if (spMen === '伤门') sihaiGongs[sp] = '伤门';
      else if (spMen === '杜门') sihaiGongs[sp] = '杜门';
    }
  }
  for (var sg in sihaiGongs) {
    var sMen = sihaiGongs[sg];
    var hua = _QM_SIHAI_HUAJIE[sMen];
    sihaiParts.push(sMen + '落' + (PALACE_INFO[sg] ? PALACE_INFO[sg].name : sg + '宫') + '，化解：' + hua.mascot + '，置于' + hua.direction + '，' + hua.method);
  }
  var sihai = sihaiParts.length > 0 ? sihaiParts.join('；') : '无明显四害临宫。';
  
  // 化解建议
  var huajieParts = [];
  // 基于用神宫五行推荐方位
  huajieParts.push('方位：利' + palaceDir + '方，忌' + (palaceDir === '正北' ? '正南' : palaceDir === '正南' ? '正北' : palaceDir === '正东' ? '正西' : palaceDir === '正西' ? '正东' : '对宫方位'));
  // 基于五行推荐颜色
  var colorMap = {'金':'白/银/金','木':'绿/青','水':'黑/蓝','火':'红/紫','土':'黄/棕'};
  huajieParts.push('颜色：宜' + (colorMap[palaceWx] || '黄'));
  // 基于时辰推荐时间
  huajieParts.push('时间：宜择' + palaceWx + '旺之时行事' + (palaceWx === '金' ? '（秋季申酉时）' : palaceWx === '木' ? '（春季寅卯时）' : palaceWx === '水' ? '（冬季亥子时）' : palaceWx === '火' ? '（夏季巳午时）' : '（四季末辰戌丑未时）'));
  // 化解方法
  if (luckLevel === '凶' || luckLevel === '小凶') {
    huajieParts.push('化解：建议在用神宫方位摆放对应五行吉祥物，择吉时行事，避开凶时凶方');
  } else {
    huajieParts.push('增益：可在' + palaceDir + '方增置五行属' + palaceWx + '之物，强化吉力');
  }
  var huajie = huajieParts.join('；') + '。';
  
  // 吉祥物推荐
  var mascotList = _QM_MASCOT_BY_WX[palaceWx] || _QM_MASCOT_BY_WX['土'];
  var mascotExtra = [];
  if (baziData && baziData.dayMaster) {
    // 基于命主日主五行喜忌推荐
    var dmWx = baziData.dayMaster;
    if (baziData.favorable && baziData.favorable.indexOf(dmWx) < 0) {
      // 日主不喜自身五行，推荐生扶用神宫五行的物品
      mascotExtra = _QM_MASCOT_BY_WX[palaceWx] || [];
    }
  }
  var mascot = mascotList.slice(0, 3).join('、');
  if (mascotExtra.length > 0) mascot += '（兼配' + mascotExtra.slice(0, 2).join('、') + '）';
  mascot += '。摆放方位：' + palaceDir + '。开光方法：择吉日良辰，以檀香熏绕三圈，诵相应经咒七遍。';
  
  return {
    summary: summary,
    detail: detail,
    dimensions: dimensions,
    geju: gejuText,
    kongwang: kongwangText,
    maxing: maxingText,
    sihai: sihai,
    huajie: huajie,
    mascot: mascot,
    score: totalScore,
    luck: luckLevel,
    yongShen: yongShen,
    palace: yongShenPalace
  };
}

function getQimenReadingHTML(palace) {
  var r = getQimenReading(palace);
  var html = '';
  html += '<div class="analysis-card" style="border:1px solid rgba(155,89,182,.2);margin-top:20px">';
  html += '<h5 style="font-size:16px;color:var(--violet2);letter-spacing:4px">🔮 宫位解读</h5>';
  html += '<p style="font-size:18px;font-family:\'Ma Shan Zheng\',serif;color:var(--violet2);margin:16px 0">「' + (r.summary||'') + '」</p>';
  if (r.detail) html += '<p style="font-size:13px;line-height:1.8;opacity:.7;white-space:pre-line">' + r.detail + '</p>';
  if (r.geju) html += '<p style="font-size:13px;line-height:1.8;opacity:.7">🏷️ ' + r.geju + '</p>';
  if (r.kongwang) html += '<p style="font-size:12px;line-height:1.8;opacity:.6">🕳️ ' + r.kongwang + '</p>';
  if (r.maxing) html += '<p style="font-size:12px;line-height:1.8;opacity:.6">🐎 ' + r.maxing + '</p>';
  if (r.sihai) html += '<p style="font-size:12px;line-height:1.8;opacity:.6">⚠️ ' + r.sihai + '</p>';
  if (r.huajie) html += '<p style="font-size:12px;line-height:1.8;opacity:.6">🛡️ ' + r.huajie + '</p>';
  if (r.mascot) html += '<p style="font-size:12px;line-height:1.8;opacity:.6">🏆 ' + r.mascot + '</p>';
  var dims = r.dimensions || {};
  html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:16px;text-align:center;font-size:12px">';
  html += '<div>事业：' + (dims['事业']||'') + '</div>';
  html += '<div>财运：' + (dims['财运']||'') + '</div>';
  html += '<div>婚姻：' + (dims['婚姻']||'') + '</div>';
  html += '<div>健康：' + (dims['健康']||'') + '</div>';
  html += '<div style="grid-column:1/-1">风水：' + (dims['风水']||'') + '</div>';
  html += '</div>';
  html += '</div>';
  return html;
}

function getMeihuaReadingHTML(guaName) {
  var r = getYijingReading(guaName);
  var html = '';
  html += '<div class="analysis-card" style="border:1px solid rgba(39,174,96,.2);margin-top:20px">';
  html += '<h5 style="font-size:16px;color:var(--jade2);letter-spacing:4px">🌿 梅花断语</h5>';
  html += '<p style="font-size:18px;font-family:\'Ma Shan Zheng\',serif;color:var(--jade2);margin:16px 0">「' + (r.summary||'') + '」</p>';
  if (r.yaoci) html += '<p style="font-size:13px;line-height:1.8;opacity:.7;white-space:pre-line">' + r.yaoci + '</p>';
  html += '<p style="font-size:14px;line-height:2;opacity:.8">' + (r.advice||'') + '</p>';
  if (r.timing) html += '<p style="font-size:12px;line-height:1.8;opacity:.6">⏰ ' + r.timing + '</p>';
  var dims = r.dimensions || {};
  html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:16px;text-align:center;font-size:12px">';
  html += '<div>事业：' + (dims['事业']||'') + '</div>';
  html += '<div>财运：' + (dims['财运']||'') + '</div>';
  html += '<div>婚姻：' + (dims['婚姻']||'') + '</div>';
  html += '<div>健康：' + (dims['健康']||'') + '</div>';
  html += '</div>';
  html += '</div>';
  return html;
}

function getLiurenReadingHTML(dayStem) {
  var stemAdvice = {
    '甲': {summary:'甲日主事，青龙值守', advice:'利东方，利主动，利开创。大事可成，需防过刚。', dimension:'事业★★★★ 财运★★★ 婚姻★★★ 健康★★★'},
    '乙': {summary:'乙日主事，六合值守', advice:'利合作，利外交，利调解。以柔克刚，和气生财。', dimension:'事业★★★ 财运★★★ 婚姻★★★★ 健康★★★★'},
    '丙': {summary:'丙日主事，朱雀值守', advice:'利文书，利传播，利口舌。注意是非，谨言慎行。', dimension:'事业★★★★ 财运★★★ 婚姻★★★ 健康★★★'},
    '丁': {summary:'丁日主事，腾蛇值守', advice:'利暗事，利谋划，利隐秘。小心虚惊，勿轻信人。', dimension:'事业★★★ 财运★★ 婚姻★★★ 健康★★★'},
    '戊': {summary:'戊日主事，勾陈值守', advice:'利田土，利房产，利守成。不宜冒进，稳重为上。', dimension:'事业★★★ 财运★★★★ 婚姻★★★ 健康★★★'},
    '己': {summary:'己日主事，太常值守', advice:'利衣食，利仓储，利日常。平平淡淡才是真。', dimension:'事业★★★ 财运★★★ 婚姻★★★★ 健康★★★★'},
    '庚': {summary:'庚日主事，白虎值守', advice:'利武事，利决断，利改革。需防血光，注意安全。', dimension:'事业★★★★ 财运★★★ 婚姻★★ 健康★★'},
    '辛': {summary:'辛日主事，天后值守', advice:'利阴事，利贵人，利细节。女性助力大，注意小病。', dimension:'事业★★★ 财运★★★ 婚姻★★★★ 健康★★★'},
    '壬': {summary:'壬日主事，天罡值守', advice:'利远行，利变动，利智谋。大智若愚，深藏不露。', dimension:'事业★★★★ 财运★★★ 婚姻★★★ 健康★★★'},
    '癸': {summary:'癸日主事，玄武值守', advice:'利暗财，利谋略，利水事。小心欺诈，守口如瓶。', dimension:'事业★★★ 财运★★★★ 婚姻★★★ 健康★★★'}
  };
  var r = stemAdvice[dayStem] || stemAdvice['甲'];
  var html = '';
  html += '<div class="analysis-card" style="border:1px solid rgba(230,126,34,.2);margin-top:20px">';
  html += '<h5 style="font-size:16px;color:var(--orange);letter-spacing:4px">⬡ 六壬断语</h5>';
  html += '<p style="font-size:18px;font-family:\'Ma Shan Zheng\',serif;color:var(--orange);margin:16px 0">「' + r.summary + '」</p>';
  html += '<p style="font-size:14px;line-height:2;opacity:.8">' + r.advice + '</p>';
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:16px;text-align:center;font-size:12px">' + r.dimension + '</div>';
  html += '</div>';
  return html;
}
const GAN_HIDE = {
  甲:['戊','庚','辛'],乙:['丙','丁','庚'],丙:['戊','庚','壬'],丁:['戊','辛','癸'],
  戊:['庚','壬'],己:['辛','癸'],庚:['壬','甲'],辛:['癸','乙'],壬:['甲','丙'],癸:['乙','丁']
};
const ZHI_SHENG = {
  子:['甲','丙','戊','庚','壬'],丑:['乙','丁','己','辛','癸'],
  寅:['丙','戊','庚','壬','甲'],卯:['丁','己','辛','癸','乙'],
  辰:['戊','庚','壬','甲','丙'],巳:['己','辛','癸','乙','丁'],
  午:['庚','壬','甲','丙','戊'],未:['辛','癸','乙','丁','己'],
  申:['壬','甲','丙','戊','庚'],酉:['癸','乙','丁','己','辛'],
  戌:['甲','丙','戊','庚','壬'],亥:['乙','丁','己','辛','癸']
};

// Ten Gods
const TENGAN = {
  甲:{比:'甲',劫:'乙',食:'丙',伤:'丁',财:'戊',才:'己',官:'庚',杀:'辛',印:'壬',枭:'癸'},
  乙:{比:'乙',劫:'甲',食:'丁',伤:'丙',财:'己',才:'戊',官:'辛',杀:'庚',印:'癸',枭:'壬'},
  丙:{比:'丙',劫:'丁',食:'戊',伤:'己',财:'庚',才:'辛',官:'壬',杀:'癸',印:'甲',枭:'乙'},
  丁:{比:'丁',劫:'丙',食:'己',伤:'戊',财:'辛',才:'庚',官:'癸',杀:'壬',印:'乙',枭:'甲'},
  戊:{比:'戊',劫:'己',食:'庚',伤:'辛',财:'壬',才:'癸',官:'甲',杀:'乙',印:'丙',枭:'丁'},
  己:{比:'己',劫:'戊',食:'辛',伤:'庚',财:'癸',才:'壬',官:'乙',杀:'甲',印:'丁',枭:'丙'},
  庚:{比:'庚',劫:'辛',食:'壬',伤:'癸',财:'甲',才:'乙',官:'丙',杀:'丁',印:'戊',枭:'己'},
  辛:{比:'辛',劫:'庚',食:'癸',伤:'壬',财:'乙',才:'甲',官:'丁',杀:'丙',印:'己',枭:'戊'},
  壬:{比:'壬',劫:'癸',食:'甲',伤:'乙',财:'丙',才:'丁',官:'戊',杀:'己',印:'庚',枭:'辛'},
  癸:{比:'癸',劫:'壬',食:'乙',伤:'甲',财:'丁',才:'丙',官:'己',杀:'戊',印:'辛',枭:'庚'},
};
const TEGAN_NAMES = {比:'比肩',劫:'劫财',食:'食神',伤:'伤官',财:'正财',才:'偏财',官:'正官',杀:'七杀',印:'正印',枭:'偏印'};
const TEGAN_ABBR = {比:'比',劫:'劫',食:'食',伤:'伤',财:'财',才:'才',官:'官',杀:'杀',印:'印',枭:'枭'};
const TEGAN_NATURE = {
  比:'同我者，夺财助身',劫:'夺财之星，破耗之兆',食:'泄秀之神，福寿之源',
  伤:'伤官见官，为祸百端',财:'养命之源，福祸相依',才:'横财偏门，来去匆匆',
  官:'贵气之神，正道之途',杀:'七杀攻身，凶险之兆',印:'护身之德，学历功名',枭:'夺食之星，晦暗之兆'
};

// Month stem table (using midnight base)
const MONTH_STEM_BASE = {寅:'甲',卯:'乙',辰:'丙',巳:'丁',午:'戊',未:'己',申:'庚',酉:'辛',戌:'壬',亥:'癸',子:'甲',丑:'乙'};

// Hour branch to stem (日上起时法)
// 甲己起甲子, 乙庚起丙子, 丙辛起戊子, 丁壬起庚子, 戊癸起壬子
function getHourStem(dayStemIdx, hourBranch) {
  const branchIdx = BRANCHES.indexOf(hourBranch);
  // Correct formula: (dayStemIdx * 2 + branchIdx) % 10
  return (dayStemIdx * 2 + branchIdx) % 10;
}

// Day stem index from Julian Day Number
function getDayStemIndex(year, month, day) {
  var a = Math.floor((14 - month) / 12);
  var y = year + 4800 - a;
  var m = month + 12 * a - 3;
  var jd = day + Math.floor((153*m+2)/5) + 365*y + Math.floor(y/4) - Math.floor(y/100) + Math.floor(y/400) - 32045;
  return ((jd - 1) % 10 + 10) % 10; // 0=甲 (修正: -1 而非 -4)
}
function getDayBranchIndex(year, month, day) {
  var a = Math.floor((14 - month) / 12);
  var y = year + 4800 - a;
  var m = month + 12*a - 3;
  var jd = day + Math.floor((153*m+2)/5) + 365*y + Math.floor(y/4) - Math.floor(y/100) + Math.floor(y/400) - 32045;
  return ((jd + 1) % 12 + 12) % 12; // 修正: +1 而非 +2
}

// ═══ 黑格命理引擎移植：立春定年柱 + 节气定月柱 + 真太阳时 (v1.0 2026-06-22) ═══
// 参考: HeiGe-SuanMing paipan.py v1.2 — 将Python精确排盘逻辑移植为JS
// 核心修正: 年柱以立春分界(非正月初一)、月柱以节气分界(非公历月份)

// 12节精确日期查找表 (1900-2050, 从 lunar_python 生成)
// 每个字符代表一年的偏移量: 0=基准日, 1=+1天, a=-1天
var JIE_DATES = {
  '立春': {base:[1,4], offsets:'001110111011100110011001100110011001100110011000100010001000100010001000100010001000000000000000000000000000000000000a000a000a000a000a000a000a000a000aa'},
  '惊蛰': {base:[2,6], offsets:'000100010001000000000000000000000000000000000000a000a000a000a000a000a000a000a000a000aa00aa00aa00aa00aa00aa00aa00aa00aaa0aaa0aaa0aaa0aaa0aaa0aaa0aaa0aaa'},
  '清明': {base:[3,5], offsets:'0011001100110001000100010001000100010001000100000000000000000000000000000000a000a000a000a000a000a000a000a000aa00aa00aa00aa00aa00aa00aa00aa00aaa0aaa0aaa'},
  '立夏': {base:[4,5], offsets:'1112111211121111111111111111111111111111111101110111011101110111011101110011001100110011001100110011001100010001000100010001000100010000000000000000000'},
  '芒种': {base:[5,6], offsets:'00110001000100010001000100010001000000000000000000000000000000000000a000a000a000a000a000a000a000aa00aa00aa00aa00aa00aa00aa00aaa0aaa0aaa0aaa0aaa0aaa0aaa'},
  '小暑': {base:[6,7], offsets:'011101110111011101110111011100110011001100110011001100110001000100010001000100010001000000000000000000000000000000000000a000a000a000a000a000a000a000aa0'},
  '立秋': {base:[7,8], offsets:'000100010001000000000000000000000000000000000000a000a000a000a000a000a000a000aa00aa00aa00aa00aa00aa00aa00aaa0aaa0aaa0aaa0aaa0aaa0aaa0aaaaaaaaaaaaaaaaaaa'},
  '白露': {base:[8,8], offsets:'000100010001000100010001000100000000000000000000000000000000a000a000a000a000a000a000a000aa00aa00aa00aa00aa00aa00aa00aa00aaa0aaa0aaa0aaa0aaa0aaa0aaa0aaa'},
  '寒露': {base:[9,8], offsets:'111111111111111101110111011101110111011101110011001100110011001100110011001100010001000100010001000100010001000000000000000000000000000000000000a000a00'},
  '立冬': {base:[10,7], offsets:'1111111111111111111111111111011101110111011101110111011101110011001100110011001100110011001100010001000100010001000100010001000000000000000000000000000'},
  '大雪': {base:[11,7], offsets:'0111011101110111011100110011001100110011001100110011000100010001000100010001000100010000000000000000000000000000000000000000a000a000a000a000a000a000a00'},
  '小寒': {base:[0,6], offsets:'0000100010001000000000000000000000000000000000000a000a000a000a000a000a000a000a000a000aa00aa00aa00aa00aa00aa00aa00aa00aaa0aaa0aaa0aaa0aaa0aaa0aaa0aaa0aa'}
};

// 获取某年某节的精确日期 (从查找表读取, 天级精度)
function getJieDate(year, jieName) {
  var info = JIE_DATES[jieName];
  if (!info) return null;
  var idx = year - 1900;
  if (idx < 0 || idx >= info.offsets.length) return null;
  var ch = info.offsets[idx];
  var offset = 0;
  if (ch === 'a') offset = -1;
  else if (ch === '1') offset = 1;
  else if (ch === '2') offset = 2;
  else if (ch === 'B') offset = -2;
  return new Date(year, info.base[0], info.base[1] + offset);
}

// ═══ 精确节气时间计算 (天文近似, 分钟级精度) ═══
// 基于 Jean Meeus《天文算法》简化的太阳黄经计算
// 用于起运年龄的精确计算, 误差<5分钟
var JIE_LONGITUDE = {
  '立春':315, '雨水':330, '惊蛰':345, '春分':0,
  '清明':15, '谷雨':30, '立夏':45, '小满':60,
  '芒种':75, '夏至':90, '小暑':105, '大暑':120,
  '立秋':135, '处暑':150, '白露':165, '秋分':180,
  '寒露':195, '霜降':210, '立冬':225, '小雪':240,
  '大雪':255, '冬至':270, '小寒':285, '大寒':300
};

function solarLongitudeJ2000(jd) {
  // 简化太阳黄经计算 (基于 VSOP87 截断级数)
  var T = (jd - 2451545.0) / 36525.0;
  var L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  var M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  var C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * Math.PI / 180)
        + (0.019993 - 0.000101 * T) * Math.sin(2 * M * Math.PI / 180)
        + 0.000289 * Math.sin(3 * M * Math.PI / 180);
  var lambda = L0 + C;
  // 章动修正 (简化)
  var omega = 125.04 - 1934.136 * T;
  lambda = lambda - 0.00569 - 0.00478 * Math.sin(omega * Math.PI / 180);
  return ((lambda % 360) + 360) % 360;
}

function jdFromDate(date) {
  // JD from UTC milliseconds (timezone-agnostic)
  return date.getTime() / 86400000 + 2440587.5;
}

function dateFromJd(jd) {
  return new Date((jd - 2440587.5) * 86400000);
}

function getPreciseJieTime(year, jieName) {
  var targetLng = JIE_LONGITUDE[jieName];
  if (targetLng === undefined) return getJieDate(year, jieName);
  // 先用 getJieDate 估算日期
  var approx = getJieDate(year, jieName);
  if (!approx) return null;
  // 在估算日期前后3天内扫描, 找到太阳黄经越过目标的精确时刻
  var jdStart = jdFromDate(new Date(approx.getTime() - 3 * 86400000));
  var jdEnd = jdFromDate(new Date(approx.getTime() + 3 * 86400000));
  var step = 0.02; // ~30 min
  var prevLng = solarLongitudeJ2000(jdStart);
  var prevJd = jdStart;
  for (var jd = jdStart + step; jd <= jdEnd; jd += step) {
    var lng = solarLongitudeJ2000(jd);
    // 检测是否越过了目标黄经 (正向)
    var dPrev = ((targetLng - prevLng + 360) % 360);
    var dCurr = ((targetLng - lng + 360) % 360);
    if (dPrev > 300 && dCurr < 60) {
      // 跨越了目标 (dPrev接近360, dCurr接近0)
      // 二分法精确查找
      var lo = prevJd, hi = jd;
      for (var i = 0; i < 50; i++) {
        var mid = (lo + hi) / 2;
        var midLng = solarLongitudeJ2000(mid);
        var dMid = ((targetLng - midLng + 360) % 360);
        if (dMid > 180) lo = mid; else hi = mid;
        if (hi - lo < 0.000001) break;
      }
      return dateFromJd((lo + hi) / 2);
    }
    prevLng = lng;
    prevJd = jd;
  }
  // 回退到估算日期
  return approx;
}

// 12节对应的月支索引: 立春→寅(2), 惊蛰→卯(3), ...
var JIE_MONTH_MAP = [
  {name:'立春', branchIdx:2}, {name:'惊蛰', branchIdx:3}, {name:'清明', branchIdx:4},
  {name:'立夏', branchIdx:5}, {name:'芒种', branchIdx:6}, {name:'小暑', branchIdx:7},
  {name:'立秋', branchIdx:8}, {name:'白露', branchIdx:9}, {name:'寒露', branchIdx:10},
  {name:'立冬', branchIdx:11}, {name:'大雪', branchIdx:0}, {name:'小寒', branchIdx:1}
];

// 判断某日处于哪个节气月 (返回月支索引)
function getMonthBranchByJieqi(year, month, day) {
  var date = new Date(year, month - 1, day);
  // 从立春开始找: 找到最后一个已过的节
  var monthIdx = 2; // 默认寅月
  for (var i = 0; i < JIE_MONTH_MAP.length; i++) {
    var jq = JIE_MONTH_MAP[i];
    // 小寒在1月,需要特殊处理: 如果当前日期在小寒之前,可能还在上一年的子月
    var jqYear = year;
    if (jq.name === '小寒') {
      // 小寒在1月初,如果当前月>1,跳过;如果当前月=1,检查日期
      if (month > 1) continue;
    }
    var jqDate = getJieDate(jqYear, jq.name);
    if (!jqDate) continue;
    if (date >= jqDate) monthIdx = jq.branchIdx;  // 节气当天属新月支
  }
  // 特殊处理: 1月在小寒前,属于上一年的子月(大雪后)
  if (month === 1) {
    var xiaohan = getJieDate(year, '小寒');
    var daxuePrev = getJieDate(year - 1, '大雪');
    if (xiaohan && date < xiaohan && daxuePrev && date >= daxuePrev) {
      monthIdx = 0; // 子月
    } else if (xiaohan && date < xiaohan) {
      monthIdx = 1; // 丑月 (小寒前,大雪前,在丑月范围)
    }
  }
  return monthIdx;
}

// Year stem — 以立春分界 (非正月初一!)
function getYearStemBranch(year, month, day) {
  var date = new Date(year, month - 1, day);
  var lichun = getJieDate(year, '立春');
  if (!lichun) {
    // Fallback: 立春约在2月4日
    lichun = new Date(year, 1, 4);
  }
  // 立春前: 年柱属于上一年
  var baseYear = (date < lichun) ? year - 1 : year;  // 立春前属上一年 (节气当天上午可能仍属上年,建议传出生时辰精确判断)
  var stemIdx = ((baseYear - 4) % 10 + 10) % 10;
  var branchIdx = ((baseYear - 4) % 12 + 12) % 12;
  return { stemIdx, branchIdx, stem: STEMS[stemIdx], branch: BRANCHES[branchIdx] };
}

// 精确版: 传入出生时辰,判断立春当天是否已过立春时刻
// 立春多在当天午后(12:00-18:00),上午出生仍属上一年
function getYearStemBranchExact(year, month, day, hour, minute) {
  var date = new Date(year, month - 1, day, hour || 0, minute || 0);
  var lichun = getJieDate(year, '立春');
  if (!lichun) lichun = new Date(year, 1, 4);
  // 立春当天: 12:00前用旧年,12:00后用新年 (立春多在午后)
  if (month === 2 && day === lichun.getDate()) {
    var baseYear = (hour < 12) ? year - 1 : year;
    var stemIdx = ((baseYear - 4) % 10 + 10) % 10;
    var branchIdx = ((baseYear - 4) % 12 + 12) % 12;
    return { stemIdx, branchIdx, stem: STEMS[stemIdx], branch: BRANCHES[branchIdx] };
  }
  return getYearStemBranch(year, month, day);
}

// Month pillar — 以节气定月支 (非公历月份!)
// 五虎遁: 甲/己年寅月=丙, 乙/庚年寅月=戊, 丙/辛年寅月=庚, 丁/壬年寅月=壬, 戊/癸年寅月=甲
function getMonthStem(yearStemIdx, monthBranch) {
  var monthBranchOrder = ['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'];
  var yinMonthGanIdx = (yearStemIdx * 2 + 2) % 10; // 五虎遁公式
  var monthIdx = monthBranchOrder.indexOf(monthBranch);
  return (yinMonthGanIdx + monthIdx) % 10;
}

// 获取节气定月支 (替代旧的 BRANCHES[((month+9)%12)] 逻辑)
function getMonthBranchBySolar(year, month, day) {
  var monthIdx = getMonthBranchByJieqi(year, month, day);
  return BRANCHES[monthIdx];
}

// 真太阳时校正 (移植自 paipan.py true_solar_time)
function trueSolarTimeCorrection(year, month, day, hour, minute, lng, tzOffset) {
  if (lng === undefined || lng === null) return { year: year, month: month, day: day, hour: hour, minute: minute, delta: 0 };
  if (tzOffset === undefined) tzOffset = 8.0;
  var dt = new Date(year, month - 1, day, hour, minute);
  var n = Math.floor((dt - new Date(dt.getFullYear(), 0, 1)) / 86400000) + 1;
  var b = (360.0 * (n - 81) / 364.0) * Math.PI / 180.0;
  var eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
  var delta = (lng - tzOffset * 15.0) * 4.0 + eot;
  var newMs = dt.getTime() + delta * 60000;
  var newDt = new Date(newMs);
  return {
    year: newDt.getFullYear(),
    month: newDt.getMonth() + 1,
    day: newDt.getDate(),
    hour: newDt.getHours(),
    minute: newDt.getMinutes(),
    delta: Math.round(delta * 10) / 10
  };
}

// ═══ 五行力量加权计算 (移植自 paipan.py wuxing_strength) ═══
// 天干1.0 / 藏干本气1.0·中气0.5·余气0.2 / 月支司令×2.0
var ZHI_CANGGAN = {
  '子':['癸'],'丑':['己','癸','辛'],'寅':['甲','丙','戊'],'卯':['乙'],
  '辰':['戊','乙','癸'],'巳':['丙','戊','庚'],'午':['丁','己'],'未':['己','丁','乙'],
  '申':['庚','壬','戊'],'酉':['辛'],'戌':['戊','辛','丁'],'亥':['壬','甲']
};
var WUXING_SHENG = {'木':'火','火':'土','土':'金','金':'水','水':'木'};
var WUXING_KE = {'木':'土','土':'水','水':'火','火':'金','金':'木'};

function computeWuxingStrength(pillars, dayStem) {
  var score = {'木':0, '火':0, '土':0, '金':0, '水':0};
  var weights = [1.0, 0.5, 0.2];
  for (var idx = 0; idx < pillars.length; idx++) {
    var gan = pillars[idx].stem;
    var zhi = pillars[idx].branch;
    score[ELE[gan]] += 1.0;
    var mult = (idx === 1) ? 2.0 : 1.0; // 月支×2
    var canggan = ZHI_CANGGAN[zhi] || [];
    for (var i = 0; i < canggan.length; i++) {
      var w = weights[i] || 0.2;
      score[ELE[canggan[i]]] += Math.round(w * mult * 1000) / 1000;
    }
  }
  for (var k in score) score[k] = Math.round(score[k] * 100) / 100;
  
  var dayEle = ELE[dayStem];
  var yinEle = null, guanEle = null;
  for (var k in WUXING_SHENG) { if (WUXING_SHENG[k] === dayEle) yinEle = k; }
  for (var k in WUXING_KE) { if (WUXING_KE[k] === dayEle) guanEle = k; }
  var shangEle = WUXING_SHENG[dayEle];
  var caiEle = WUXING_KE[dayEle];
  
  var tong = Math.round((score[dayEle] + score[yinEle]) * 100) / 100;
  var yi = Math.round((score[shangEle] + score[caiEle] + score[guanEle]) * 100) / 100;
  var total = tong + yi;
  var ratio = total > 0 ? tong / total : 0;
  var tip = ratio > 0.55 ? '偏强' : (ratio < 0.45 ? '偏弱' : '均势(需细辨)');
  
  return {
    score: score,
    tong: tong, yi: yi,
    tongDetail: '比劫(' + dayEle + ')' + score[dayEle] + ' + 印(' + yinEle + ')' + score[yinEle],
    yiDetail: '食伤(' + shangEle + ')' + score[shangEle] + ' + 财(' + caiEle + ')' + score[caiEle] + ' + 官杀(' + guanEle + ')' + score[guanEle],
    ratio: Math.round(ratio * 100) / 100,
    tip: tip
  };
}

// ═══ 天干五合/相冲 + 六害 + 三刑完善 (移植自 paipan.py) ═══
var GAN_HE = {
  '甲己':'土','己甲':'土','乙庚':'金','庚乙':'金','丙辛':'水','辛丙':'水',
  '丁壬':'木','壬丁':'木','戊癸':'火','癸戊':'火'
};
var GAN_CHONG = ['甲庚','庚甲','乙辛','辛乙','丙壬','壬丙','丁癸','癸丁','戊甲','甲戊'];
// 注意: 天干相冲实际是 甲庚/乙辛/丙壬/丁癸 (戊己中央不相冲)
var GAN_CHONG_PAIRS = [
  {a:'甲',b:'庚'}, {a:'乙',b:'辛'}, {a:'丙',b:'壬'}, {a:'丁',b:'癸'}
];
var ZHI_LIUHE_MAP = {
  '子丑':'土','丑子':'土','寅亥':'木','亥寅':'木','卯戌':'火','戌卯':'火',
  '辰酉':'金','酉辰':'金','巳申':'水','申巳':'水','午未':'火/土','未午':'火/土'
};
var ZHI_CHONG_PAIRS = [
  {a:'子',b:'午'}, {a:'丑',b:'未'}, {a:'寅',b:'申'}, {a:'卯',b:'酉'}, {a:'辰',b:'戌'}, {a:'巳',b:'亥'}
];
var ZHI_HAI_PAIRS = [
  {a:'子',b:'未'}, {a:'丑',b:'午'}, {a:'寅',b:'巳'}, {a:'卯',b:'辰'}, {a:'申',b:'亥'}, {a:'酉',b:'戌'}
];
var XING3_A = ['寅','巳','申']; // 无恩之刑
var XING3_B = ['丑','戌','未']; // 恃势之刑
var XING_ZI = '辰午酉亥';       // 自刑

function detectGanRelations(pillars) {
  var labels = ['年','月','日','时'];
  var g = [pillars[0].stem, pillars[1].stem, pillars[2].stem, pillars[3].stem];
  var rel = { '天干五合': [], '天干相冲': [] };
  for (var i = 0; i < 4; i++) {
    for (var j = i + 1; j < 4; j++) {
      var pair = g[i] + g[j];
      var tag = labels[i] + g[i] + '·' + labels[j] + g[j];
      if (GAN_HE[pair]) rel['天干五合'].push(tag + '→合' + GAN_HE[pair]);
      for (var k = 0; k < GAN_CHONG_PAIRS.length; k++) {
        if ((g[i] === GAN_CHONG_PAIRS[k].a && g[j] === GAN_CHONG_PAIRS[k].b) ||
            (g[i] === GAN_CHONG_PAIRS[k].b && g[j] === GAN_CHONG_PAIRS[k].a)) {
          rel['天干相冲'].push(tag);
        }
      }
    }
  }
  return rel;
}

function detectZhiRelationsFull(pillars) {
  var labels = ['年','月','日','时'];
  var z = [pillars[0].branch, pillars[1].branch, pillars[2].branch, pillars[3].branch];
  var rel = { '六合': [], '三合': [], '半合': [], '三会': [], '六冲': [], '相刑': [], '六害': [], '自刑': [] };
  
  for (var i = 0; i < 4; i++) {
    for (var j = i + 1; j < 4; j++) {
      var pair = z[i] + z[j];
      var tag = labels[i] + z[i] + '·' + labels[j] + z[j];
      
      // 六合
      if (ZHI_LIUHE_MAP[pair]) rel['六合'].push(tag + '→合' + ZHI_LIUHE_MAP[pair]);
      // 六冲
      for (var k = 0; k < ZHI_CHONG_PAIRS.length; k++) {
        if ((z[i] === ZHI_CHONG_PAIRS[k].a && z[j] === ZHI_CHONG_PAIRS[k].b) ||
            (z[i] === ZHI_CHONG_PAIRS[k].b && z[j] === ZHI_CHONG_PAIRS[k].a)) {
          rel['六冲'].push(tag);
        }
      }
      // 六害
      for (var k = 0; k < ZHI_HAI_PAIRS.length; k++) {
        if ((z[i] === ZHI_HAI_PAIRS[k].a && z[j] === ZHI_HAI_PAIRS[k].b) ||
            (z[i] === ZHI_HAI_PAIRS[k].b && z[j] === ZHI_HAI_PAIRS[k].a)) {
          rel['六害'].push(tag);
        }
      }
      // 子卯刑
      if (z[i] === '子' && z[j] === '卯' || z[i] === '卯' && z[j] === '子') {
        rel['相刑'].push(tag + '(子卯·无礼之刑)');
      }
    }
  }
  
  // 三合
  var sanheCombos = [['申','子','辰'],['亥','卯','未'],['寅','午','戌'],['巳','酉','丑']];
  var sanheWx = {'申子辰':'水','亥卯未':'木','寅午戌':'火','巳酉丑':'金'};
  for (var c = 0; c < sanheCombos.length; c++) {
    var combo = sanheCombos[c];
    var idxs = [];
    for (var k = 0; k < 4; k++) { if (combo.indexOf(z[k]) >= 0) idxs.push(k); }
    var chars = idxs.map(function(k){return z[k];});
    var uniqueChars = chars.filter(function(v,i,a){return a.indexOf(v)===i;});
    var who = idxs.map(function(k){return labels[k]+z[k];}).join('·');
    if (uniqueChars.length === 3) {
      rel['三合'].push(combo.join('') + '三合' + sanheWx[combo.join('')] + '局(' + who + ')');
    } else if (uniqueChars.length === 2 && combo.indexOf(combo[1]) >= 0 && chars.indexOf(combo[1]) >= 0) {
      // 半合需含中神(combo[1])
      rel['半合'].push(combo.join('').substring(0,3) + '半合' + sanheWx[combo.join('')] + '(' + who + ')');
    }
  }
  
  // 三会
  var sanhuiCombos = [['寅','卯','辰'],['巳','午','未'],['申','酉','戌'],['亥','子','丑']];
  var sanhuiWx = {'寅卯辰':'木','巳午未':'火','申酉戌':'金','亥子丑':'水'};
  for (var c = 0; c < sanhuiCombos.length; c++) {
    var combo = sanhuiCombos[c];
    var idxs = [];
    for (var k = 0; k < 4; k++) { if (combo.indexOf(z[k]) >= 0) idxs.push(k); }
    var uniqueChars = idxs.map(function(k){return z[k];}).filter(function(v,i,a){return a.indexOf(v)===i;});
    if (uniqueChars.length === 3) {
      var who = idxs.map(function(k){return labels[k]+z[k];}).join('·');
      rel['三会'].push(combo.join('') + '三会' + sanhuiWx[combo.join('')] + '方(' + who + ')');
    }
  }
  
  // 三刑
  var xingGroups = [
    {chars: XING3_A, name: '寅巳申·无恩之刑'},
    {chars: XING3_B, name: '丑戌未·恃势之刑'}
  ];
  for (var gi = 0; gi < xingGroups.length; gi++) {
    var grp = xingGroups[gi];
    var idxs = [];
    for (var k = 0; k < 4; k++) { if (grp.chars.indexOf(z[k]) >= 0) idxs.push(k); }
    var uniqueChars = idxs.map(function(k){return z[k];}).filter(function(v,i,a){return a.indexOf(v)===i;});
    if (uniqueChars.length >= 2) {
      var who = idxs.map(function(k){return labels[k]+z[k];}).join('·');
      var full = uniqueChars.length === 3 ? '三刑全' : '半刑';
      rel['相刑'].push(grp.name + '(' + full + ': ' + who + ')');
    }
  }
  
  // 自刑
  for (var si = 0; si < XING_ZI.length; si++) {
    var zz = XING_ZI[si];
    var idxs = [];
    for (var k = 0; k < 4; k++) { if (z[k] === zz) idxs.push(k); }
    if (idxs.length >= 2) {
      var who = idxs.map(function(k){return labels[k];}).join('·');
      rel['自刑'].push(zz + zz + '自刑(' + who + ')');
    }
  }
  
  // 过滤空项
  var result = {};
  for (var k in rel) { if (rel[k].length > 0) result[k] = rel[k]; }
  return result;
}

// ═══ 长生十二宫 (移植自 paipan.py _dishi_of) ═══
var CHANGSHENG_START = {
  '甲':'亥','丙':'寅','戊':'寅','庚':'巳','壬':'申',
  '乙':'午','丁':'酉','己':'酉','辛':'子','癸':'卯'
};
var CS_ORDER = ['长生','沐浴','冠带','临官','帝旺','衰','病','死','墓','绝','胎','养'];

function getDishi(gan, zhi) {
  var start = CHANGSHENG_START[gan];
  if (!start) return '';
  var forward = (GAN_YINYANG_JS[gan] === '阳');
  var si = BRANCHES.indexOf(start);
  var zi = BRANCHES.indexOf(zhi);
  var step = forward ? ((zi - si + 12) % 12) : ((si - zi + 12) % 12);
  return CS_ORDER[step];
}
var GAN_YINYANG_JS = {'甲':'阳','乙':'阴','丙':'阳','丁':'阴','戊':'阳','己':'阴','庚':'阳','辛':'阴','壬':'阳','癸':'阴'};

// ═══ 旬空计算 (对标 lunar_python) ═══
// 旬空: 以日柱所在旬,空亡的两个地支 + 旬名
var XUN_NAMES = ['甲子','甲戌','甲申','甲午','甲辰','甲寅'];
function getXunKong(dayStem, dayBranch) {
  var stemIdx = STEMS.indexOf(dayStem);
  var branchIdx = BRANCHES.indexOf(dayBranch);
  // 在60甲子中找位置: n%10=stemIdx, n%12=branchIdx
  var n = -1;
  for (var i = 0; i < 60; i++) {
    if (i % 10 === stemIdx && i % 12 === branchIdx) { n = i; break; }
  }
  if (n < 0) return '';
  var xunIdx = Math.floor(n / 10);
  var kong1 = BRANCHES[(xunIdx * 10 + 10) % 12];
  var kong2 = BRANCHES[(xunIdx * 10 + 11) % 12];
  return kong1 + kong2;
}
function getXunName(dayStem, dayBranch) {
  var stemIdx = STEMS.indexOf(dayStem);
  var branchIdx = BRANCHES.indexOf(dayBranch);
  for (var i = 0; i < 60; i++) {
    if (i % 10 === stemIdx && i % 12 === branchIdx) {
      return XUN_NAMES[Math.floor(i / 10)];
    }
  }
  return '';
}

// ═══ 胎元/命宫/身宫 (移植自 paipan.py) ═══
// 胎元: 月干进一位,月支进三位
function getTaiYuan(monthStem, monthBranch) {
  var si = STEMS.indexOf(monthStem);
  var bi = BRANCHES.indexOf(monthBranch);
  return STEMS[(si + 1) % 10] + BRANCHES[(bi + 3) % 12];
}
// ═══ 命宫/身宫 (对标 lunar_python 算法) ═══
// MONTH_ZHI: 1-based, 寅=1,卯=2,辰=3,巳=4,午=5,未=6,申=7,酉=8,戌=9,亥=10,子=11,丑=12
var MONTH_ZHI_ARR = ['', '寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'];
// ZHI: 1-based, 子=1,丑=2,寅=3,卯=4,辰=5,巳=6,午=7,未=8,申=9,酉=10,戌=11,亥=12
var ZHI_ARR = ['', '子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
// GAN: 1-based, 甲=1,...,癸=10
var GAN_ARR = ['', '甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];

// 命宫: 需月支、时支、年干
function getMingGong(yearStemIdx, monthBranch, timeBranch) {
  // month_zhi_index: 在MONTH_ZHI_ARR中查
  var mi = MONTH_ZHI_ARR.indexOf(monthBranch);
  var ti = MONTH_ZHI_ARR.indexOf(timeBranch);
  if (mi < 0 || ti < 0) return '';
  var offset = mi + ti;
  if (offset >= 14) { offset = 26 - offset; }
  else { offset = 14 - offset; }
  // 天干: (yearGanIdx_1based + 1) * 2 + offset, 超过10则减10
  var ganIdx = (yearStemIdx + 1) * 2 + offset;
  while (ganIdx > 10) { ganIdx -= 10; }
  return GAN_ARR[ganIdx] + MONTH_ZHI_ARR[offset];
}
// 身宫: 需月支、时支、年干
function getShenGong(yearStemIdx, monthBranch, timeBranch) {
  var mi = MONTH_ZHI_ARR.indexOf(monthBranch);
  var ti = ZHI_ARR.indexOf(timeBranch);
  if (mi < 0 || ti < 0) return '';
  var offset = mi + ti;
  if (offset > 12) { offset -= 12; }
  var ganIdx = (yearStemIdx + 1) * 2 + offset;
  while (ganIdx > 10) { ganIdx -= 10; }
  return GAN_ARR[ganIdx] + MONTH_ZHI_ARR[offset];
}

// ═══ 调候用神速查表 (穷通宝鉴十干分十二月) ═══
var TIAOHOU_TABLE = {
  '甲': {
    '寅':'丙癸','卯':'丙癸','辰':'庚壬','巳':'癸','午':'癸丁','未':'癸丁',
    '申':'庚丙','酉':'庚丙','戌':'庚丁','亥':'丙戊','子':'丙丁','丑':'丁丙'
  },
  '乙': {
    '寅':'丙癸','卯':'丙癸','辰':'癸丙','巳':'癸','午':'癸','未':'癸丙',
    '申':'丙癸','酉':'丙癸','戌':'丙癸','亥':'丙戊','子':'丙','丑':'丙'
  },
  '丙': {
    '寅':'壬庚','卯':'壬庚','辰':'壬','巳':'壬','午':'壬庚','未':'壬',
    '申':'壬','酉':'壬','戌':'壬','亥':'甲戊壬','子':'壬戊','丑':'壬甲'
  },
  '丁': {
    '寅':'甲庚','卯':'甲庚','辰':'甲','巳':'甲','午':'甲壬','未':'甲',
    '申':'甲','酉':'甲','戌':'甲','亥':'甲','子':'甲庚','丑':'甲'
  },
  '戊': {
    '寅':'丙甲癸','卯':'丙甲癸','辰':'甲丙','巳':'甲丙','午':'壬丙','未':'癸丙',
    '申':'丙癸','酉':'丙癸','戌':'丙癸','亥':'甲丙','子':'丙甲','丑':'丙甲'
  },
  '己': {
    '寅':'丙甲癸','卯':'丙甲癸','辰':'甲丙','巳':'甲丙','午':'丙癸','未':'丙癸',
    '申':'丙癸','酉':'丙癸','戌':'丙癸','亥':'丙甲','子':'丙甲','丑':'丙甲'
  },
  '庚': {
    '寅':'丁甲丙','卯':'丁甲丙','辰':'甲丁','巳':'甲丁','午':'丁壬','未':'丁甲',
    '申':'甲','酉':'甲','戌':'甲','亥':'丁甲','子':'丁甲','丑':'丁甲'
  },
  '辛': {
    '寅':'壬己甲','卯':'壬己甲','辰':'壬甲','巳':'壬甲','午':'壬己','未':'壬甲',
    '申':'壬甲','酉':'壬甲','戌':'壬甲','亥':'壬甲','子':'壬丙','丑':'壬丙'
  },
  '壬': {
    '寅':'庚丙戊','卯':'庚戊','辰':'甲庚','巳':'壬','午':'壬辛','未':'壬辛',
    '申':'戊','酉':'甲','戌':'甲','亥':'戊丙','子':'戊丙','丑':'丙丁'
  },
  '癸': {
    '寅':'庚辛','卯':'庚辛','辰':'甲丙','巳':'丙','午':'庚辛','未':'庚辛',
    '申':'庚辛','酉':'庚辛','戌':'庚辛','亥':'庚辛','子':'丙丁','丑':'丙丁'
  }
};

function getTiaohou(dayStem, monthBranch) {
  var table = TIAOHOU_TABLE[dayStem];
  if (!table) return '';
  return table[monthBranch] || '';
}

// ═══ 从格识别 (移植自 references/05) ═══
function detectCongge(pillars, dayStem) {
  var dayEle = ELE[dayStem];
  var eleCount = {'木':0,'火':0,'土':0,'金':0,'水':0};
  for (var i = 0; i < pillars.length; i++) {
    eleCount[ELE[pillars[i].stem]]++;
    eleCount[ZHI_ELE[pillars[i].branch]]++;
  }
  var dayCount = eleCount[dayEle];
  var total = 8;
  // 从弱: 日主五行≤1且无生扶(印+比劫≤1)
  var yinEle = null;
  for (var k in WUXING_SHENG) { if (WUXING_SHENG[k] === dayEle) yinEle = k; }
  var supportCount = dayCount + eleCount[yinEle];
  
  if (supportCount <= 1 && dayCount === 0) {
    // 检查是否从财/从杀/从儿
    var caiEle = WUXING_KE[dayEle];
    var guanEle = null;
    for (var k in WUXING_KE) { if (WUXING_KE[k] === dayEle) guanEle = k; }
    var shangEle = WUXING_SHENG[dayEle];
    if (eleCount[caiEle] >= 5) return { type: '从财格', desc: '日主极弱无根,财星独旺,顺财之势' };
    if (eleCount[guanEle] >= 5) return { type: '从杀格', desc: '日主极弱无根,官杀独旺,顺杀之势' };
    if (eleCount[shangEle] >= 5) return { type: '从儿格', desc: '日主极弱无根,食伤独旺,顺泄之势' };
    return { type: '从弱格', desc: '日主极弱无根无生,满盘异党,顺其势者吉' };
  }
  // 专旺: 日主五行≥6且无克伐
  var keEle = WUXING_KE[dayEle];
  if (dayCount >= 6 && eleCount[keEle] === 0) {
    return { type: '专旺格', desc: '日主五行独旺,无克伐之气,顺其旺势' };
  }
  return null;
}

// ================================================================
//  TOAST NOTIFICATION
// ================================================================

function showToast(msg) {
  let t = document.getElementById('toastMsg');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toastMsg';
    t.className = 'toast-msg';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(function() { t.classList.remove('show'); }, 2500);
}

// ═══ 通用模态框 ══════════════════════════════════════
function showModal(title, content) {
  var modal = document.getElementById('customModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'customModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;';
    modal.innerHTML = '<div style="background:var(--bg);border:1px solid var(--gold);border-radius:16px;max-width:700px;width:100%;max-height:90vh;overflow:auto;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(201,168,76,0.2)">' +
      '<h3 id="modalTitle" style="color:var(--gold);margin:0"></h3>' +
      '<button onclick="document.getElementById(\x27customModal\x27).style.display=\x27none\x27" style="background:none;border:none;color:var(--paper2);font-size:24px;cursor:pointer;line-height:1">&times;</button>' +
      '</div>' +
      '<div id="modalContent" style="padding:20px"></div></div>';
    document.body.appendChild(modal);
  }
  document.getElementById('modalTitle').textContent = title || '详情';
  document.getElementById('modalContent').innerHTML = content;
  modal.style.display = 'flex';
}

// ================================================================
//  NAVIGATION
// ================================================================

// showMoreGrid 已移除，功能已整合到快捷栏

function showSection(name) {
  try {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.bottom-tab').forEach(t => t.classList.remove('active'));

  // Handle composite sections: zhanbu and xingming
  if (['yijing','meihua','qimen','liuren','ziwei','cezi'].includes(name)) {
    // Show zhanbu composite section and activate the sub-tab
    const zhanbu = document.getElementById('section-zhanbu');
    if (zhanbu) zhanbu.classList.add('active');
    const zTab = document.getElementById('tab-zhanbu');
    if (zTab) zTab.classList.add('active');
    showZhanbuSub(name);
    // Also activate the matching sub-tab button
    document.querySelectorAll('#section-zhanbu .zhanbu-subtab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#section-zhanbu .zhanbu-subtab').forEach(b => {
      if (b.textContent.includes(name === 'yijing' ? '易经' : name === 'meihua' ? '梅花' : name === 'qimen' ? '奇门' : name === 'liuren' ? '六壬' : name === 'ziwei' ? '紫微' : '测字')) b.classList.add('active');
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    closeMore();
    return;
  }
  if (['rename','company','mobile'].includes(name)) {
    const xm = document.getElementById('section-xingming');
    if (xm) xm.classList.add('active');
    const xTab = document.getElementById('tab-xingming');
    if (xTab) xTab.classList.add('active');
    showXingmingSub(name);
    document.querySelectorAll('#section-xingming .zhanbu-subtab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#section-xingming .zhanbu-subtab').forEach(b => {
      if (b.textContent.includes(name === 'rename' ? '改名' : name === 'company' ? '公司' : '手机')) b.classList.add('active');
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    closeMore();
    return;
  }
  if (name === 'luopan') {
    const fs = document.getElementById('section-fengshui');
    if (fs) fs.classList.add('active');
    const fTab = document.getElementById('tab-fengshui');
    if (fTab) fTab.classList.add('active');
    showFengshuiSub('luopan-content');
    document.querySelectorAll('#section-fengshui .zhanbu-subtab').forEach(b => {
      b.classList.remove('active');
      if (b.textContent.includes('罗盘')) b.classList.add('active');
    });
    // 确保姓名板块立即滚动到顶部
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (fs) fs.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    closeMore();
    return;
  }

  // 更多板块：关闭移动端下拉菜单，确保页面内容可见
  if (name === 'more') closeMore();

  const el = document.getElementById('section-' + name);
  if (el) el.classList.add('active');
  const tab = document.getElementById('tab-' + name);
  if (tab) tab.classList.add('active');
  const bTab = document.getElementById('btm-' + name);
  if (bTab) bTab.classList.add('active');
  // 立即滚动到顶部，确保section可见
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  });
  closeMore();
  } catch(err) { console.error('showSection error:', err); try { el && el.classList.add('active'); } catch(e2) {} }
  // jiuri 懒加载初始化
  if (name === 'jiuri' && !window._jiuriInitDone) {
    window._jiuriInitDone = true;
    setTimeout(function(){ if(typeof jiuriInit==='function') jiuriInit(); }, 100);
  }
}

// ===== 占卜子导航 =====
function showZhanbuSub(name, btnEl) {
  var subIds = ['yijing','meihua','qimen','liuren','ziwei','cezi'];
  subIds.forEach(function(id) {
    var container = document.getElementById('zhanbuSub-' + id);
    if (container) container.style.display = (id === name) ? 'block' : 'none';
  });
  // 清空所有引擎结果
  ['yjEngineResult','mhEngineResult','qmEngineResult','lrEngineResult','zwEngineResult'].forEach(function(id){
    var el = document.getElementById(id);
    if (el) { el.innerHTML = ''; el.style.display = 'none'; }
  });
  if (btnEl) {
    document.querySelectorAll('#section-zhanbu .zhanbu-subtab').forEach(function(b){ b.classList.remove('active'); });
    btnEl.classList.add('active');
  }
}

// ===== 姓名子导航 =====
function showXingmingSub(name, btnEl) {
  var subIds = ['rename','company','mobile'];
  subIds.forEach(function(id) {
    var container = document.getElementById('xingmingSub-' + id);
    if (container) container.style.display = (id === name) ? 'block' : 'none';
  });
  if (btnEl) {
    document.querySelectorAll('#section-xingming .zhanbu-subtab').forEach(function(b){ b.classList.remove('active'); });
    btnEl.classList.add('active');
  }
}

// ===== 风水子导航 =====
function showFengshuiSub(id, btnEl) {
  document.getElementById('fengshui-content').style.display = (id === 'fengshui-content') ? 'block' : 'none';
  document.getElementById('luopan-content').style.display = (id === 'luopan-content') ? 'block' : 'none';
  if (btnEl) {
    document.querySelectorAll('#section-fengshui .zhanbu-subtab').forEach(function(b){ b.classList.remove('active'); });
    btnEl.classList.add('active');
  }
  // 懒加载：首次打开罗盘时，将section-luopan内容移入luopan-content
  if(id==='luopan-content'){
    var lpContent=document.getElementById('luopan-content');
    if(lpContent && lpContent.children.length===0){
      var luopanSection=document.getElementById('section-luopan');
      if(luopanSection){
        var children=Array.from(luopanSection.children);
        children.forEach(function(child){
          if(!child.classList.contains('section-header')){
            lpContent.appendChild(child);
          }
        });
      }
    }
  }
}

// ===== 言值沟通技巧 =====
function toggleYanzhi(name) {
  document.querySelectorAll('.yz-detail-panel').forEach(function(el) {
    el.classList.remove('active');
    el.style.display = 'none';
  });
  var panel = document.getElementById('yz-detail-' + name);
  if (panel) {
    panel.style.display = 'block';
    panel.classList.add('active');
    panel.scrollIntoView({behavior: 'smooth', block: 'start'});
  }
}

// ===== 风水理论折叠 =====
function toggleFengshuiTheory() {
  var el = document.getElementById('fs-theory-block');
  if (!el) return;
  var isHidden = el.style.display === 'none';
  el.style.display = isHidden ? '' : 'none';
  var btn = document.getElementById('fs-theory-toggle');
  if (btn) btn.textContent = isHidden ? '▲ 收起理论' : '▼ 展开理论（气论·阴阳·五行·八卦）';
}

function showPlanGallery() {
  var gallery = document.querySelector('.plan-gallery-scroll');
  if (gallery) {
    gallery.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (gallery.children.length === 0) {
      gallery.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--paper2);font-size:13px;letter-spacing:2px">📋 户型图库加载中，请稍候…</div>';
    }
  } else {
    var allText = document.querySelectorAll('h3');
    for (var i = 0; i < allText.length; i++) {
      if (allText[i].textContent.indexOf('好户型') !== -1) {
        allText[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      }
    }
  }
  showToast('🏠 好户型参考图库已加载');
}

// ===== 八字模块折叠 =====
function toggleBaziModule(titleEl) {
  titleEl.classList.toggle('collapsed');
  var body = titleEl.nextElementSibling;
  if (body && body.classList.contains('bazi-module-body')) {
    body.classList.toggle('collapsed');
  }
}

// ===== 初始化：将子section内容移入复合section容器 =====
function initCompositeSections() {
  // 占卜子模块
  var zhanbuMap = {
    yijing: 'section-yijing',
    meihua: 'section-meihua',
    qimen: 'section-qimen',
    liuren: 'section-liuren',
    ziwei: 'section-ziwei',
    cezi: 'section-cezi'
  };
  for (var key in zhanbuMap) {
    var src = document.getElementById(zhanbuMap[key]);
    var dst = document.getElementById('zhanbuSub-' + key);
    if (src && dst) {
      // Move all children except section-header (we have our own sub-nav)
      var children = Array.from(src.children);
      children.forEach(function(child) {
        if (!child.classList.contains('section-header')) {
          dst.appendChild(child);
        }
      });
    }
  }
  // 姓名子模块
  var xmMap = {
    rename: 'section-rename',
    company: 'section-company',
    mobile: 'section-mobile'
  };
  for (var key in xmMap) {
    var src = document.getElementById(xmMap[key]);
    var dst = document.getElementById('xingmingSub-' + key);
    if (src && dst) {
      var children = Array.from(src.children);
      children.forEach(function(child) {
        if (!child.classList.contains('section-header')) {
          dst.appendChild(child);
        }
      });
    }
  }
  // 默认显示第一个子模块
  showZhanbuSub('yijing');
  showXingmingSub('rename');

  // 风水/罗盘整合
  var luopanSection = document.getElementById('section-luopan');
  var luopanContainer = document.getElementById('luopan-content');
  if (luopanSection && luopanContainer) {
    var children = Array.from(luopanSection.children);
    children.forEach(function(child) {
      if (!child.classList.contains('section-header')) {
        luopanContainer.appendChild(child);
      }
    });
  }
}

function toggleMore() {
  // PC端下拉菜单
  const dropdown = document.getElementById('moreDropdown');
  if (dropdown) dropdown.classList.toggle('open');
  
  // 移动端抽屉菜单
  const menu = document.getElementById('moreMenu');
  if (menu) menu.classList.toggle('open');
  
  // 遮罩层
  const overlay = document.getElementById('moreOverlay');
  if (overlay) overlay.classList.toggle('open');
}

function closeMore() {
  const dropdown = document.getElementById('moreDropdown');
  if (dropdown) dropdown.classList.remove('open');
  
  const menu = document.getElementById('moreMenu');
  if (menu) menu.classList.remove('open');
  
  const overlay = document.getElementById('moreOverlay');
  if (overlay) overlay.classList.remove('open');
}

// ===== 更多板块切换 =====
function showMoreModule(name, btn) {
  document.querySelectorAll('.more-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.jinang-tab').forEach(t => t.classList.remove('active'));
  const panel = document.getElementById('morePanel-' + name);
  if (panel) panel.classList.add('active');
  if (btn) btn.classList.add('active');
  // 隐藏 section-header，减少顶部空白
  const hdr = document.querySelector('#section-more .section-header');
  if (hdr) hdr.style.display = 'none';
  if (name === 'almanac') initAlmanac();
  if (name === 'faith') {
    const savedFaith = (localStorage.getItem('userFaith') && localStorage.getItem('userFaith') !== 'all') ? localStorage.getItem('userFaith') : 'fo';
    if (typeof renderFaithPanelFromSelect === 'function') renderFaithPanelFromSelect(savedFaith);
    // 联动口诀库：更新信仰面板口诀区
    setTimeout(function(){ if(typeof updateFaithKoujue==='function') updateFaithKoujue(savedFaith); }, 300);
  }
  // 知识库：确保网格可见
  if (name === 'knowledge') {
    const grid = document.getElementById('knowledge-grid');
    const detailPage = document.getElementById('knowledge-detail');
    if (grid) grid.style.display = '';
    if (detailPage) detailPage.style.display = 'none';
  }
  // 体质面板：无需特殊初始化（内容直接内联）
  // VIP面板：无需特殊初始化（内容直接内联）
  // 商城：确保 SHOP_DATA 加载后渲染
  if (name === 'shop') {
    if (typeof renderShopProducts === 'function' && typeof window.SHOP_DATA !== 'undefined') {
      renderShopProducts();
    }
  }
  // 口诀面板初始化由 IIFE 覆盖的 showMoreModule 处理
}


// selectFaith：跳转到 faith-renderer.js 的 renderFaithPanelFromSelect
function selectFaith(faith) {
    if (typeof renderFaithPanelFromSelect === 'function') renderFaithPanelFromSelect(faith);
    // 同时为 section-user 信众中心初始化（修复「更多→信众中心」入口）
    localStorage.setItem('userFaith', faith);
    initUserCenter();
    // 切换到 section-user 的信众内容展示
    var worshipGuide = document.getElementById('worshipGuide');
    if (worshipGuide) {
      worshipGuide.style.display = 'block';
      showWorship(faith);
    }
}

// ===== 黄历计算引擎 =====
// 天干地支
var TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
var DI_ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
var SHENG_XIAO = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
// 二十八星宿（东方苍龙·北方玄武·西方白虎·南方朱雀）
var XING_XIU = ['角','亢','氐','房','心','尾','箕','斗','牛','女','虚','危','室','壁','奎','娄','胃','昴','毕','觜','参','井','鬼','柳','星','张','翼','轸'];
var XING_XIU_ANIMAL = ['蛟','龙','貉','兔','狐','虎','豹','獬','牛','蝠','鼠','燕','猪','㺄','狼','狗','雉','鸡','乌','猴','猿','犴','羊','獐','马','鹿','蛇','蚓'];
// 建除十二神
var JIAN_CHU = ['建','除','满','平','定','执','破','危','成','收','开','闭'];
var JIAN_CHU_YI = {
  '建':['入学','安抚','出行','上任','见贵','求职'],'除':['治病','沐浴','祭祀','解除','扫舍'],'满':['祭祀','祈福','进人口','捕捉','畋猎'],'平':['修造','动土','平整道路'],'定':['祭祀','祈福','冠笄(guān jī)：成年礼','嫁娶','纳采(nà cǎi)：提亲'],'执':['捕捉','畋猎','祭祀','祈福','求嗣'],'破':['求医疗病','破屋坏垣'],'危':['祭祀','祈福','安床','入殓'],'成':['入学','赴任','开市','交易','立券','纳财','嫁娶','祭祀','祈福','求嗣'],'收':['祭祀','祈福','纳财','捕捉','畋猎','开市','交易'],'开':['祭祀','祈福','赴任','上任','见贵','出行','入学','嫁娶','移徙'],'闭':['筑堤防','补垣','塞穴','埋葬']
};
var JIAN_CHU_JI = {
  '建':['动土','开仓'],'除':['求医疗病','出行'],'满':['嫁娶','安葬','移徙','赴任'],'平':['祭祀','祈福','开市','交易'],'定':['诉讼','出行','词讼'],'执':['开市','移徙','出行','嫁娶'],'破':['嫁娶','开市','出行','祭祀','祈福','冠笄','进人口'],'危':['登山','乘船','出行'],'成':['诉讼','词讼','出行','赴任'],'收':['开市','出行','安葬'],'开':['安葬','伐木','畋猎','开仓','出货财'],'闭':['开市','交易','出行','嫁娶','求医疗病','动土']
};
// 彭祖百忌（十干）
var PENG_ZU = ['甲不开仓财物耗散','乙不栽植千株不长','丙不修灶必见灾殃','丁不剃头头必生疮','戊不受田田主不祥','己不破券二比并亡','庚不经络织机虚张','辛不合酱主人不尝','壬不汲水更难提防','癸不词讼理弱敌强'];
// 六冲
var CHONG_MAP = {0:'午',1:'未',2:'申',3:'酉',4:'戌',5:'亥',6:'子',7:'丑',8:'寅',9:'卯',10:'辰',11:'巳'};
// 煞方
var SHA_MAP = {0:'南',1:'东',2:'北',3:'西',4:'南',5:'东',6:'北',7:'西',8:'南',9:'东',10:'北',11:'西'};
// 喜神方位（按日干）
var XI_SHEN = ['艮(东北)','乾(西北)','坤(西南)','离(正南)','巽(东南)','艮(东北)','乾(西北)','坤(西南)','离(正南)','巽(东南)'];
// 福神方位（按日干）
var FU_SHEN = ['巽(东南)','坎(正北)','坎(正北)','离(正南)','艮(东北)','巽(东南)','坎(正北)','离(正南)','乾(西北)','坤(西南)'];
// 财神方位（按日干）
var CAI_SHEN = ['艮(东北)','艮(东北)','坎(正北)','坎(正北)','坎(正北)','坎(正北)','坤(西南)','巽(东南)','巽(东南)','巽(东南)'];
// 胎神占方（60甲子全表）
var TAI_SHEN_60 = [
  '占门碓房内北','碓磨厕外东南','厨灶炉外正南','仓库门房内北','房床栖外正南',  // 甲子-戊辰 0-4
  '占门床场外正南','占碓磨外正南','厨灶碓外西南','仓库炉外西南','房床门内西南',  // 己巳-癸酉 5-9
  '门鸡栖外西南','碓磨床外西南','厨灶碓外西南','仓库厕外正北','房床炉外正南',  // 甲戌-戊寅 10-14
  '占门厕外正南','碓磨栖外正西','厨灶床外正北','仓库碓外西北','房床厕外西北',  // 己卯-癸未 15-19
  '占门炉外西北','碓磨门外正东','厨灶栖外西北','仓库床外西北','房床占外正南',  // 甲申-戊子 20-24
  '占门厕外正南','碓磨炉外正南','厨灶门房外正北','仓库栖外正北','房床场内正北',  // 己丑-癸巳 25-29
  '占门碓房内北','碓磨厕外东南','厨灶炉外正南','仓库门房内北','房床栖外正南',  // 甲午-戊戌 30-34
  '占门床场内南','占碓磨房内南','厨灶厕房内南','仓库炉房内南','房床门房内会',  // 己亥-癸卯 35-39
  '门鸡栖外西南','碓磨床外西南','厨灶碓房内东','仓库厕房内东','房床炉房内中',  // 甲辰-戊申 40-44
  '占门厕外东南','碓磨栖外东南','厨灶床外东南','仓库碓外东南','房床灶外正东',  // 己酉-癸丑 45-49
  '占门碓房内北','碓磨厕外东南','厨灶炉外正南','仓库门房内北','房床栖外正南',  // 甲寅-戊午 50-54
  '占门床场外正南','占碓磨外正南','厨灶碓外西南','仓库炉外西南','房床门内西南'   // 己未-癸亥 55-59
];
// 黄黑道（十二建星与日支关系）
// 日禄时辰（按日干）
var RI_LU = {0:'寅',2:'巳',4:'巳',6:'申',8:'亥'}; // 甲禄寅,丙禄巳,戊禄巳,庚禄申,壬禄亥
// 节气近似日期（公历每月的节气近似日）
var JIE_QI_DATES = [
  [6,20], // 1月 小寒6 大寒20
  [4,19], // 2月 立春4 雨水19
  [6,21], // 3月 惊蛰6 春分21
  [5,20], // 4月 清明5 谷雨20
  [6,21], // 5月 立夏6 小满21
  [6,22], // 6月 芒种6 夏至22
  [7,23], // 7月 小暑7 大暑23
  [8,23], // 8月 立秋8 处暑23
  [8,23], // 9月 白露8 秋分23
  [8,24], // 10月 寒露8 霜降24
  [7,22], // 11月 立冬7 小雪22
  [7,22]  // 12月 大雪7 冬至22
];
// 月支对应表（以节气定月支）
// 寅月(立春-惊蛰) 卯月(惊蛰-清明) 辰月(清明-立夏) 巳月(立夏-芒种)
// 午月(芒种-小暑) 未月(小暑-立秋) 申月(立秋-白露) 酉月(白露-寒露)
// 戌月(寒露-立冬) 亥月(立冬-大雪) 子月(大雪-小寒) 丑月(小寒-立春)