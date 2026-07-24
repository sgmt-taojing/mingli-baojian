#!/usr/bin/env node
// 易道智鉴 · 节气养生祝贺
// 仅在节气当天 + 国家法定假日生成，给客户/领导用
// 风格：高情商、古老智慧、不突出信仰、人际祝福
// 同时生成一张节令图片（调用 Seedream 文生图）

var FESTIVAL_2026 = {
  // 国家法定假日（国务院办公厅 2025-12-04 公布）
  '01-01': { name: '元旦', kind: 'holiday', theme: '岁新元亨',
    wish: '一元复始，万象更新。愿您在新的一年里，岁岁平安，事事顺遂。',
    img: '元旦日出，旭日初升，远山雪影，松枝覆霜，水墨写意，红色印章点缀' },
  '02-17': { name: '春节', kind: 'tradition', theme: '新春大吉',
    wish: '岁序常新，华章日启。恭祝您与家人新春吉祥，万事亨通，阖家安康。',
    img: '春节红灯笼与梅花，古朴庭院，孩童放鞭炮剪影，水墨国画，金色点缀' },
  '04-05': { name: '清明节', kind: 'tradition', theme: '气清景明',
    wish: '气清景明，万物皆显。愿您心境澄澈，步履从容，前路开阔。',
    img: '清明时节，烟雨江南，远山如黛，柳丝飘拂，水墨淡彩，安静祥和' },
  '05-01': { name: '劳动节', kind: 'holiday', theme: '勤耕致远',
    wish: '五一佳节，向每一位奋斗者致敬。愿您的耕耘都有回响，每份努力都被珍重。',
    img: '五月金黄麦田，远处劳动者剪影，夕阳暖光，写意油画风格' },
  '06-19': { name: '端午节', kind: 'tradition', theme: '安康吉祥',
    wish: '五月初五，端阳正午。祈愿您与家人安康常在，岁月静好，福气绵长。',
    img: '端午龙舟竞渡，碧水青山，艾草菖蒲悬挂，国风水墨' },
  '09-25': { name: '中秋节', kind: 'tradition', theme: '月圆人圆',
    wish: '月到中秋分外明，家国天下共团圆。愿您所念皆可圆，所行皆坦途。',
    img: '中秋满月，月下桂花树，兔儿剪影，玉兔捣药，水墨淡金' },
  '10-01': { name: '国庆节', kind: 'holiday', theme: '家国同庆',
    wish: '山河锦绣，国泰民安。恭祝您国庆安康，顺心顺意，喜乐常随。',
    img: '天安门广场国旗飘扬，牡丹盛开，金色阳光，写意中国画风格' },

  // 二十四节气（2026，仅日期，精确到日）
  '01-05': { name: '小寒', kind: 'jie', theme: '潜藏温养',
    wish: '小寒至，万物潜藏。宜温补养肾，早睡晚起，把日子过得慢一些、暖一些。',
    img: '小寒腊梅初开，雪压枝头，暖黄灯笼，写意水墨' },
  '01-20': { name: '大寒', kind: 'jie', theme: '岁末守静',
    wish: '大寒凛冬，岁末收束。宜守静蓄势，亲友围炉，静待春来。',
    img: '大寒飞雪，老树枯枝，远处屋舍炊烟升起，水墨寒色' },
  '02-04': { name: '立春', kind: 'jie', theme: '万物生发',
    wish: '立春万物苏，生机自此始。愿您新的一年目标明朗，脚步轻盈，处处逢春。',
    img: '立春柳丝抽芽，梅花点点，春风和煦，淡彩水墨' },
  '02-19': { name: '雨水', kind: 'jie', theme: '润物无声',
    wish: '雨水时节，润物如酥。愿您对人间的耐心与善意，终将一一得到回响。',
    img: '雨水时节，江南烟雨，水面涟漪，远山朦胧，淡彩水墨' },
  '03-05': { name: '惊蛰', kind: 'jie', theme: '春雷醒志',
    wish: '春雷一响，蛰虫始振。愿您心有所向，志有所立，行动有所成。',
    img: '惊蛰春雷，春笋破土而出，桃花含苞，写意国画' },
  '03-20': { name: '春分', kind: 'jie', theme: '平衡中和',
    wish: '春分，昼夜均而寒暑平。最难得的智慧，是忙中守度、张弛有度。',
    img: '春分海棠与玉兰同放，蝴蝶翩舞，暖阳春风，水墨淡彩' },
  '04-04': { name: '清明', kind: 'jie', theme: '气清景明',
    wish: '气清景明，万物皆显。愿您心境澄澈，步履从容，前路开阔。',
    img: '清明远山云雾，茶田嫩绿，雾气飘渺，水墨淡青' },
  '04-20': { name: '谷雨', kind: 'jie', theme: '雨生百谷',
    wish: '谷得雨而生，人得诚而达。愿您的每一份耕耘，都被时光温柔以待。',
    img: '谷雨时节，细雨润田，秧苗青绿，农舍远处，水墨写意' },
  '05-05': { name: '立夏', kind: 'jie', theme: '养心清夏',
    wish: '立夏，万物至此皆长大。愿您心境清凉，情绪安定，自在从容度长夏。',
    img: '立夏池塘新荷，蜻蜓立荷尖，暖风吹拂，淡彩水墨' },
  '05-21': { name: '小满', kind: 'jie', theme: '小得盈满',
    wish: '小满者，满而不盈。最好的状态，是将满未满，仍在向上生长。',
    img: '小满麦穗初黄，桑葚紫红，远处农人眺望，水墨' },
  '06-05': { name: '芒种', kind: 'jie', theme: '忙有所得',
    wish: '芒种，忙有所获。愿您忙而不乱，种下皆有收获，付出皆有回响。',
    img: '芒种麦收农忙，金黄麦浪，远处农舍，写意油画' },
  '06-21': { name: '夏至', kind: 'jie', theme: '阳极之盛',
    wish: '夏至阳极，万物繁茂。盛夏亦是最有力量的时节，愿您充实而丰盈。',
    img: '夏至荷塘盛开，蜻蜓与青蛙，莲叶田田，浓彩水墨' },
  '07-07': { name: '小暑', kind: 'jie', theme: '心静自凉',
    wish: '小暑至，心静自然凉。一杯清茶、一缕清风，足以安顿整个夏天。',
    img: '小暑凉亭品茗，远处蝉鸣树影，淡彩水墨' },
  '07-23': { name: '大暑', kind: 'jie', theme: '盛夏静心',
    wish: '大暑极热，最宜静心。愿您于喧闹中守一份清凉，于烈日下有一处阴凉。',
    img: '夏天大暑，荷花池塘，远山淡墨，写意水墨画风格' },
  '08-08': { name: '立秋', kind: 'jie', theme: '秋凉将至',
    wish: '立秋至，夏未央而秋已至。愿您早早绸缪，从容迎接收获之季。',
    img: '立秋梧桐落叶，远处荷塘残荷，秋蝉静息，水墨淡黄' },
  '08-23': { name: '处暑', kind: 'jie', theme: '暑去凉来',
    wish: '暑气渐止，秋凉将生。最舒服的状态，是切换得宜，懂得休整。',
    img: '处暑秋云渐起，远山清朗，稻穗初黄，水墨淡彩' },
  '09-07': { name: '白露', kind: 'jie', theme: '露凝而白',
    wish: '白露至，秋意浓。愿您衣着温暖，饮食润燥，气色从容。',
    img: '白露晨曦，芦苇上露珠晶莹，远处白鹤飞翔，水墨写意' },
  '09-23': { name: '秋分', kind: 'jie', theme: '平分秋色',
    wish: '秋分，昼夜等长。把岁月平分给热爱的事业与牵挂的人，便是圆满。',
    img: '秋分丹桂飘香，月下团圆，金色暖意，水墨淡彩' },
  '10-08': { name: '寒露', kind: 'jie', theme: '润燥养深',
    wish: '寒露至，宜润秋燥、养肺胃。愿您饮食有节，作息有时，安然过秋。',
    img: '寒露红叶初染，远山清寒，菊花盛开，水墨淡红' },
  '10-23': { name: '霜降', kind: 'jie', theme: '秋深气肃',
    wish: '霜降水返壑，风落木归山。岁晚宜收敛，宜珍藏，宜为新岁蓄力。',
    img: '霜降柿子挂枝头，红叶霜白，远处农舍炊烟，水墨' },
  '11-07': { name: '立冬', kind: 'jie', theme: '藏养之始',
    wish: '立冬，万物收藏。宜早睡早起，温补养藏，把身与心都安顿好。',
    img: '立冬初雪，老梅初绽，暖屋灯火，水墨淡彩' },
  '11-22': { name: '小雪', kind: 'jie', theme: '雪落可期',
    wish: '小雪至，可围炉煮茶，可静坐读书。一冬的安暖，从心静开始。',
    img: '小雪围炉煮茶，窗含雪意，红泥小炉，水墨暖意' },
  '12-07': { name: '大雪', kind: 'jie', theme: '岁寒情暖',
    wish: '大雪时节，万物收藏。愿您身边有暖意，岁寒有可亲，岁月有可期。',
    img: '大雪银装素裹，红梅盛开，远处雪屋暖灯，水墨' },
  '12-21': { name: '冬至', kind: 'jie', theme: '一阳初生',
    wish: '冬至阴极而阳生，是夜最长，亦是希望最长。愿您岁末圆满，新岁可期。',
    img: '冬至饺子飘香，远山雪影，家家灯火，写意水墨' }
};

function lookup(today) {
  var key = (today.getMonth() + 1).toString().padStart(2, '0') + '-' + today.getDate().toString().padStart(2, '0');
  return FESTIVAL_2026[key];
}

// === KB 应景融合：检索节气/节日相关古老智慧 ===
// 高情商柔和版：从 KB 摘取与节令名相关的 1-2 条精要，不堆砌学术内容
// 返回异步：[{title, snippet, trust}, ...]
function queryKbContext(festivalName, maxItems) {
  maxItems = maxItems || 2;
  return new Promise(function (resolve) {
    var spawn = require('child_process').spawn;
    // 关键词策略：先查整个节令名；取最后一字（中文习惯例如“立秋”秋表季节）；最后查通用词
    var primaryKeyword = festivalName.length >= 2 ? festivalName.slice(-1) : festivalName;
    var keywords = [festivalName, primaryKeyword, '养生', '节气', '智慧', '顺时'];
    var q = encodeURIComponent(primaryKeyword);
    var url = 'http://127.0.0.1:8920/api/public/kb/search?q=' + q + '&limit=12';
    var curl = spawn('curl', ['-s', '--max-time', '8', url], { stdio: ['ignore', 'pipe', 'pipe'] });
    var out = '', err = '';
    curl.stdout.on('data', function (d) { out += d.toString(); });
    curl.stderr.on('data', function (d) { err += d.toString(); });
    curl.on('error', function () { resolve([]); });
    curl.on('close', function (code) {
      if (code !== 0 || !out) return resolve([]);
      try {
        var j = JSON.parse(out);
        var items = [];
        var list = (j.results || j.items || (j.data && j.data.results) || []);
        for (var i = 0; i < list.length && items.length < maxItems; i++) {
          var it = list[i];
          var title = (it.title || '').trim();
          var content = (it.content || it.snippet || '').trim();
          // 过滤：仅保留与节令相关的（title/content 包含关键词）
          var matched = false;
          for (var k = 0; k < keywords.length; k++) {
            if (title.indexOf(keywords[k]) >= 0 || content.indexOf(keywords[k]) >= 0) {
              matched = true; break;
            }
          }
          if (!matched) continue;
          // 截取前 80 字作 snippet
          var snippet = content.length > 80 ? content.slice(0, 80).replace(/[\n\r]+/g, ' ') + '…' : content;
          items.push({ title: title, snippet: snippet, trust: it.trust_score || 0.85 });
        }
        resolve(items);
      } catch (e) { resolve([]); }
    });
    setTimeout(function () { try { curl.kill('SIGKILL'); } catch (e) {} resolve([]); }, 9000);
  });
}

// 把 KB 摘要附加到祝福正文（高情商柔和版）
function appendKbWisdom(text, items) {
  if (!items || items.length === 0) return text;
  text += '\n';
  text += '📜 古老智慧·补读\n';
  for (var i = 0; i < items.length; i++) {
    text += '  · ' + items[i].snippet + '\n';
  }
  return text;
}

function render(today) {
  var f = lookup(today);
  if (!f) return null;
  // 日期戳：放在最后一行，让用户知道这条祝福的发布日期
  var yyyy = today.getFullYear();
  var mm = (today.getMonth() + 1).toString().padStart(2, '0');
  var dd = today.getDate().toString().padStart(2, '0');
  var hh = today.getHours().toString().padStart(2, '0');
  var mi = today.getMinutes().toString().padStart(2, '0');
  var weekday = ['周日','周一','周二','周三','周四','周五','周六'][today.getDay()];
  var kindLabel = f.kind === 'holiday' ? '【法定假日】' :
                  f.kind === 'tradition' ? '【传统佳节】' : '【节气】';
  var text = '';
  // 称呼随机轮换，让客户/领导收到不重样（兄弟/首长/朋友/老友/挚友/兄台/仁兄等）
  var salutations = ['兄弟，', '首长，', '朋友，', '老友，', '挚友，', '兄台，', '仁兄，', '同志，', '老兄，', '朋友您好，'];
  // 落款柔和版：不用“君”“敬上”这种偏文雅的，用“您朋友”“益友”之类
  var closings    = ['您的朋友。', '您朋友。', '你的朋友。', '你的老友。', '您的老友。', '益友。', '老友敬上。', '友。'];
  // 按月偏移 + 节日名长度，让每月节气落款不同
  var sal = salutations[(today.getMonth() * 7 + f.name.length) % salutations.length];
  var clo = closings[(today.getMonth() * 11 + today.getDate() + f.name.length) % closings.length];

  text += '🌿 ' + kindLabel + f.name + ' · ' + f.theme + '\n';
  text += '\n';
  text += sal + '\n';
  text += f.wish + '\n';
  text += '\n';
  text += clo + '\n';
  text += '\n';
  text += '—— 易道智鉴 · 节气养生\n';
  text += '📅 ' + yyyy + '-' + mm + '-' + dd + '（' + weekday + '）';
  return { text: text, img: f.img, name: f.name };
}

// Pillow LANCZOS 4K 超分（2048 → 3840）
// 先放大，再用 ImageEnhance 微锐化，避免纯插值的模糊感
function upscaleTo4k(srcUrl, savePath) {
  return new Promise(function (resolve) {
    var spawn = require('child_process').spawn;
    var py = process.env.PYTHON || 'python3';
    var code = [
      "from PIL import Image, ImageEnhance, ImageFilter",
      "import urllib.request, sys",
      "urllib.request.urlretrieve(sys.argv[1], '/tmp/_src.jpg')",
      "im = Image.open('/tmp/_src.jpg').convert('RGB')",
      "im2 = im.resize((3840, 3840), Image.LANCZOS)",
      "im2 = im2.filter(ImageFilter.UnsharpMask(radius=2, percent=120, threshold=2))",
      "im2 = ImageEnhance.Sharpness(im2).enhance(1.15)",
      "im2.save(sys.argv[2], 'JPEG', quality=92, optimize=True)",
      "print('4K_OK', im2.size)"
    ].join('\n');
    var p = spawn(py, ['-c', code, srcUrl, savePath], { stdio: ['ignore', 'pipe', 'pipe'] });
    var stdout = '', stderr = '';
    p.stdout.on('data', function (d) { stdout += d.toString(); });
    p.stderr.on('data', function (d) { stderr += d.toString(); });
    p.on('error', function (e) { resolve({ ok: false, error: 'spawn 错误：' + e.message }); });
    p.on('close', function (code2) {
      if (code2 !== 0) return resolve({ ok: false, error: 'exit ' + code2 + ': ' + (stderr || stdout).slice(0, 500) });
      if (stdout.includes('4K_OK')) return resolve({ ok: true, size: 3840 });
      resolve({ ok: false, error: '未生成 4K：' + stdout.slice(0, 300) });
    });
    setTimeout(function () { try { p.kill('SIGKILL'); } catch(e){} resolve({ ok: false, error: '4K 超分超时' }); }, 60000);
  });
}

// 调用 Seedream 文生图（异步子进程）
function generateImage(prompt) {
  var spawn = require('child_process').spawn;
  var py = process.env.PYTHON || 'python3';
  var skillPath = '/Users/tom/.openclaw-autoclaw/skills/autoglm-generate-image-seedream/generate-image-seedream.py';
  return new Promise(function (resolve) {
    var p = spawn(py, [skillPath, prompt], { stdio: ['ignore', 'pipe', 'pipe'] });
    var stdout = '', stderr = '';
    p.stdout.on('data', function (d) { stdout += d.toString(); });
    p.stderr.on('data', function (d) { stderr += d.toString(); });
    p.on('error', function (e) { resolve({ ok: false, error: 'spawn 错误：' + e.message }); });
    p.on('close', function (code) {
      if (code !== 0) return resolve({ ok: false, error: 'exit ' + code + ': ' + (stderr || stdout).slice(0, 500) });
      var m = stdout.match(/https:\/\/[^\s"']+\.jpg\?[^\s"']+/);
      if (m) return resolve({ ok: true, url: m[0] });
      resolve({ ok: false, error: '未找到图片 URL：' + stdout.slice(0, 300) });
    });
    setTimeout(function () { try { p.kill('SIGKILL'); } catch(e){} resolve({ ok: false, error: '超时（90s）' }); }, 90000);
  });
}

// CLI
if (require.main === module) {
  var arg = process.argv[2];
  var withImg = process.argv.includes('--img');
  var withKb  = process.argv.includes('--kb');
  var date = null;
  if (arg && /^\d{4}-\d{2}-\d{2}$/.test(arg)) {
    date = new Date(arg + 'T08:00:00');
  } else if (arg === 'today' || !arg) {
    date = new Date();
  } else {
    console.error('用法: node festival-wishes.js [YYYY-MM-DD|today] [--img] [--kb]');
    process.exit(1);
  }
  var result = render(date);
  if (!result) {
    var key = (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0');
    console.log('今日(' + key + ')非节气非法定假日，不生成祝贺。');
    process.exit(0);
  }
  // 输出顺序：4K 图片 → 文字 → 时间
  if (withImg && result.img) {
    console.log('[IMG_PROMPT] ' + result.img);
    console.log('[IMG_GEN_START]');
    generateImage(result.img).then(function (img) {
      if (!img.ok) {
        console.log('[IMG_ERR] ' + img.error);
        console.log('\n[TEXT]');
        console.log(result.text);
        return;
      }
      console.log('[IMG_URL_2K] ' + img.url);
      // 立即拉取 + Pillow 4K 超分（2048 → 3840）
      var safeName = result.name + '-' + date.toISOString().slice(0, 10);
      var savePath = '.openclaw/tmp/' + safeName + '-4k.jpg';
      console.log('[IMG_UPSCALE_START] → ' + savePath);
      upscaleTo4k(img.url, savePath).then(function (up) {
        if (up.ok) {
          console.log('[IMG_PATH_4K] ' + savePath + ' (' + up.size + 'x' + up.size + ')');
        } else {
          console.log('[IMG_UPSCALE_ERR] ' + up.error + '，回退 2K 原图：' + img.url);
        }
        console.log('\n[TEXT]');
        console.log(result.text);
        // KB 应景融合：检索与节令相关的古代智慧，在正文后补充 1-2 条
        if (withKb) {
          queryKbContext(result.name, 2).then(function(items) {
            if (items && items.length > 0) {
              console.log('\n[KB_WISDOM]');
              for (var i = 0; i < items.length; i++) {
                console.log('  · ' + items[i].snippet);
              }
            } else {
              console.log('\n[KB_WISDOM] (本节日无 KB 匹配退回经典)');
            }
          });
        }
      });
    });
  } else {
    console.log(result.text);
    if (withKb) {
      queryKbContext(result.name, 2).then(function(items) {
        if (items && items.length > 0) {
          console.log('\n[KB_WISDOM]');
          for (var i = 0; i < items.length; i++) {
            console.log('  · ' + items[i].snippet);
          }
        } else {
          console.log('\n[KB_WISDOM] (本节日无 KB 匹配)');
        }
      });
    }
  }
}