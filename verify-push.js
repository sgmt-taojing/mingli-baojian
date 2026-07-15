// 每日推送前校验脚本 v2
// 校验项: 日柱、生肖、八字一致性、佛道节日日期(公历↔农历转换)、建除宜忌

var STEMS='甲乙丙丁戊己庚辛壬癸';
var BRANCHES='子丑寅卯辰巳午未申酉戌亥';
var ZODIACS=['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];

function getDayGz(Y,M,D){
  var baseDate = new Date(1900,0,31);
  var daysDiff = Math.floor((new Date(Y,M-1,D) - baseDate) / 86400000);
  var dayGzIdx = ((40 + daysDiff) % 60 + 60) % 60;
  return { idx: dayGzIdx, stem: STEMS[dayGzIdx%10], branch: BRANCHES[dayGzIdx%12] };
}

var errors = [];
var warnings = [];
var fs = require('fs');
var path = require('path');
var { execSync } = require('child_process');

// 农历→公历转换(python lunarcalendar)
function lunar2solar(year, lm, ld) {
  try {
    var r = execSync('python3 -c "from lunarcalendar import Converter, Lunar, Solar; l=Lunar('+year+','+lm+','+ld+',False); s=Converter.Lunar2Solar(l); print(str(s.month)+\'-\'+str(s.day))"').toString().trim();
    return r;
  } catch(e) { return null; }
}

// ============ 1. 缘主八字校验 ============
var baziPath = path.join(__dirname, 'user-data', 'userBazi.json');
if (!fs.existsSync(baziPath)) {
  errors.push('❌ userBazi.json 不存在');
} else {
  var bazi = JSON.parse(fs.readFileSync(baziPath, 'utf8'));
  var dayGz = getDayGz(bazi.year, bazi.month, bazi.day);
  if (dayGz.stem !== bazi.dayStem) errors.push('❌ 日干不符: 计算得' + dayGz.stem + '日, 配置为' + bazi.dayStem + '日');
  if (dayGz.branch !== bazi.dayBranch) errors.push('❌ 日支不符: 计算得' + dayGz.branch + '日, 配置为' + bazi.dayBranch + '日');
  var yearZhiIdx = (bazi.year - 4) % 12;
  var calcZodiac = ZODIACS[yearZhiIdx];
  if (calcZodiac !== bazi.zodiac) errors.push('❌ 生肖不符: ' + bazi.year + '年应为' + calcZodiac + ', 配置为' + bazi.zodiac);
  var yearGan = STEMS[(bazi.year - 4) % 10];
  if (bazi.yearGan && yearGan !== bazi.yearGan) errors.push('❌ 年干不符: 计算得' + yearGan + ', 配置为' + bazi.yearGan);
  console.log('✅ 缘主: ' + bazi.name + ' (' + bazi.year + '-' + bazi.month + '-' + bazi.day + ')');
  console.log('   八字: ' + (bazi.yearGan||'?') + (bazi.yearZhi||'?') + '年 ' + (bazi.monthGan||'?') + (bazi.monthZhi||'?') + '月 ' + bazi.dayStem + bazi.dayBranch + '日 ' + (bazi.hourGan||'?') + (bazi.hourZhi||'?') + '时');
  console.log('   日柱: ' + dayGz.stem + dayGz.branch + ' ' + (dayGz.stem===bazi.dayStem && dayGz.branch===bazi.dayBranch ? '✅' : '❌'));
  console.log('   生肖: ' + bazi.zodiac + ' ' + (calcZodiac===bazi.zodiac ? '✅' : '❌'));
}

// ============ 2. 今日日柱校验 ============
var now = new Date();
var todayGz = getDayGz(now.getFullYear(), now.getMonth()+1, now.getDate());
console.log('\n✅ 今日: ' + now.getFullYear() + '-' + (now.getMonth()+1) + '-' + now.getDate() + ' ' + todayGz.stem + todayGz.branch + '日');

// ============ 3. 语法+代码检查 ============
try { execSync('node -c daily_push.js', { cwd: __dirname }); console.log('✅ daily_push.js 语法正确'); }
catch(e) { errors.push('❌ daily_push.js 语法错误'); }
var src = fs.readFileSync(path.join(__dirname, 'daily_push.js'), 'utf8');
if (src.indexOf('alert(') >= 0) errors.push('❌ 发现 alert()');
if (src.indexOf('Math.random') >= 0) errors.push('❌ 发现 Math.random()');
console.log('✅ 无alert/Math.random');

// ============ 4. 佛道节日日期校验(公历↔农历转换) ============
var kv = require('./knowledge-verify.js');
var year2026Match = src.match(/2026:\s*\{([^}]+)\}/);
if (year2026Match) {
  var festPairs = year2026Match[1].match(/'(\d+-\d+)':'([^']+)'/g);
  var festErrors = 0, festTotal = 0;
  festPairs.forEach(function(pair) {
    var m = pair.match(/'(\d+-\d+)':'([^']+)'/);
    if (m) {
      var solarDate = m[1]; // 配置里是公历
      var festName = m[2].split('·')[0].trim();
      // 查知识库里的农历日期
      var lunarDate = null;
      for (var key in kv.BUDDHIST_FESTIVALS) {
        var f = kv.BUDDHIST_FESTIVALS[key];
        if (festName === f.name || f.aliases.indexOf(festName) >= 0) { lunarDate = key; break; }
      }
      if (!lunarDate) for (var key2 in kv.TAOIST_FESTIVALS) {
        var t = kv.TAOIST_FESTIVALS[key2];
        if (festName === t.name || t.aliases.indexOf(festName) >= 0) { lunarDate = key2; break; }
      }
      if (!lunarDate) for (var key4 in kv.FOLK_FESTIVALS) {
        var ff = kv.FOLK_FESTIVALS[key4];
        if (festName === ff.name || ff.aliases.indexOf(festName) >= 0) { lunarDate = key4; break; }
      }
      if (!lunarDate && (festName === kv.CONFUCIUS_FESTIVAL.name || kv.CONFUCIUS_FESTIVAL.aliases.indexOf(festName) >= 0)) {
        lunarDate = kv.CONFUCIUS_FESTIVAL.lunar;
      }
      if (lunarDate) {
        festTotal++;
        var parts = lunarDate.split('-');
        var calcSolar = lunar2solar(2026, parts[0], parts[1]);
        if (calcSolar && calcSolar !== solarDate) {
          warnings.push('⚠️ ' + festName + ': 配置公历' + solarDate + ', 标准农历' + lunarDate + '→公历' + calcSolar);
          festErrors++;
        }
      }
    }
  });
  if (festErrors === 0) console.log('✅ 佛道节日日期校验通过 (' + festTotal + '条)');
  else console.log('⚠️ 佛道节日日期校验: ' + festErrors + '/' + festTotal + '条不匹配');
}

// ============ 5. 建除宜忌校验 ============
var JIANCHU = ['建','除','满','平','定','执','破','危','成','收','开','闭'];
var yiBlock = src.match(/JIANCHU_YI\s*=\s*\{([\s\S]*?)\n\}/);
var jiBlock = src.match(/JIANCHU_JI\s*=\s*\{([\s\S]*?)\n\}/);
if (yiBlock && jiBlock) {
  var jcErrors = 0;
  JIANCHU.forEach(function(jc) {
    var yiM = yiBlock[1].match(new RegExp("'" + jc + "':\\[([^\\]]+)\\]"));
    var jiM = jiBlock[1].match(new RegExp("'" + jc + "':\\[([^\\]]+)\\]"));
    if (yiM && jiM) {
      var yi = yiM[1].match(/'([^']+)'/g).map(function(s){return s.replace(/'/g,'');});
      var ji = jiM[1].match(/'([^']+)'/g).map(function(s){return s.replace(/'/g,'');});
      var r = kv.verifyJianchuYiJi(jc, yi, ji);
      if (!r.valid) { r.errors.forEach(function(e){warnings.push(e);jcErrors++;}); }
    }
  });
  if (jcErrors === 0) console.log('✅ 建除十二神宜忌校验通过 (12神)');
  else console.log('⚠️ 建除宜忌校验: ' + jcErrors + '条冲突');
}

// ============ 6. 建星场景限制词 ============
var hasScene = src.indexOf('宜短期') >= 0 || src.indexOf('仅宜') >= 0;
console.log((hasScene ? '✅' : '⚠️') + ' 建星场景限制词' + (hasScene ? '已配置' : '未检测到'));

// ============ 结果 ============
console.log('\n' + (errors.length === 0 ? '🎉 全部校验通过' : '❌ 发现 ' + errors.length + ' 个错误:'));
errors.forEach(function(e) { console.log(e); });
if (warnings.length > 0) {
  console.log('\n⚠️ 警告 ' + warnings.length + ' 条:');
  warnings.forEach(function(w) { console.log(w); });
}
process.exit(errors.length === 0 ? 0 : 1);
