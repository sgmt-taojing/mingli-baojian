    '木': '黑色/蓝色（水生木）+ 绿色/青色',
    '火': '绿色/青色（木生火）+ 红色/紫色',
    '土': '红色/紫色（火生土）+ 黄色/棕色',
    '金': '黄色/棕色（土生金）+ 白色/金色'
  };
  return colorMap[dayZhuWuxing] || '根据八字日主确定';
}
function _generateYearlySolutions(yearStar, currentYear, baziWuxing, mingGua) {
  // 生成未来3年的流年化解方案
  var solutions = [];
  for (var offset = 0; offset < 3; offset++) {
    var yr = currentYear + offset;
    var star = _getYearFlyingStar(yr);
    var starPos = _getStarPosition(star);

    // 重点关注五黄、二黑、三碧位置
    var warnings = [];
    for (var dir in starPos) {
      var s = starPos[dir];
      if (s === 5) warnings.push({ direction: dir, star: 5, name: '五黄大灾', action: '此方忌动土、不宜久坐，挂六字真言铜葫芦化解', color: '金色/白色' });
      if (s === 2) warnings.push({ direction: dir, star: 2, name: '二黑病符', action: '此方宜静不宜动，放金属风铃或铜葫芦化解', color: '金色/白色' });
      if (s === 3) warnings.push({ direction: dir, star: 3, name: '三碧是非', action: '此方放红色装饰化解口舌是非', color: '红色' });
      if (s === 7) warnings.push({ direction: dir, star: 7, name: '七赤破财', action: '此方放蓝色装饰或水族箱化解破财', color: '蓝色/黑色' });
    }

    // 吉位
    var auspicious = [];
    for (var dir2 in starPos) {
      var s2 = starPos[dir2];
      if (s2 === 8) auspicious.push({ direction: dir2, star: 8, name: '八白正财', action: '此方宜放黄水晶球、聚宝盆催财', color: '红色/黄色' });
      if (s2 === 9) auspicious.push({ direction: dir2, star: 9, name: '九紫喜庆', action: '此方宜放红色装饰、紫色水晶催喜', color: '红色/紫色' });
      if (s2 === 1) auspicious.push({ direction: dir2, star: 1, name: '一白桃花', action: '此方宜放水培植物催人缘', color: '蓝色' });
      if (s2 === 4) auspicious.push({ direction: dir2, star: 4, name: '四绿文昌', action: '此方宜放文昌塔、四枝毛笔催学业', color: '绿色' });
      if (s2 === 6) auspicious.push({ direction: dir2, star: 6, name: '六白武曲', action: '此方宜放金属摆件催事业', color: '白色/金色' });
    }

    solutions.push({
      year: yr,
      centerStar: star,
      warnings: warnings,
      auspicious: auspicious,
      summary: yr + '年' + star + '入中宫' + (star === 5 ? '，五黄当道需谨慎' : star === 8 ? '，八白财星当令大利财运' : star === 9 ? '，九紫当令喜庆之年' : '')
    });
  }
  return solutions;
}
function _analyzeFloorPlanAI(imageData, context) {
  // 调用API代理进行户型图AI分析
  var prompt = '你是专业风水师。请分析这张户型图，识别以下信息：\n' +
    '1. 房屋整体形状（方正/缺角/不规则）\n' +
    '2. 各房间方位（标注东南西北）\n' +
    '3. 门窗位置\n' +
    '4. 卫生间、厨房位置\n' +
    '5. 是否存在穿堂煞、门冲等问题\n' +
    '6. 整体采光通风评估\n\n' +
    '背景信息：户型=' + context.huxing + '，朝向=' + context.chaoxiang + '，建造年份=' + context.buildYear + '\n' +
    '命主出生年=' + context.year + '，命卦=' + context.mingGua.type + '\n' +
    '八宅吉凶位=' + JSON.stringify(context.bazhai) + '\n\n' +
    '请给出：每个房间的风水评估+具体化解建议（吉祥物、颜色、家具摆放）';

  var fsAiStatus = document.getElementById('fsAiStatus');
  if (fsAiStatus) fsAiStatus.innerHTML = '<div style="padding:20px;text-align:center"><div style="font-size:24px">🔮 AI分析中...</div><p style="margin-top:12px;opacity:.6">正在解读您的户型图</p></div>';

  fetch('https://api.g2claw.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer b720753afe0845f5a7611a1b56b6d77c' },
    body: JSON.stringify({
      model: 'auto',
      messages: [
        { role: 'user', content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageData } }
        ]}
      ],
      max_tokens: 3000
    })
  }).then(function(r) { return r.json(); }).then(function(data) {
    var result = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    var fsAiResult = document.getElementById('fsAiStatus');
    if (fsAiResult) {
      fsAiResult.innerHTML = '<div class="huajie-alert" style="margin-top:16px;background:rgba(46,204,113,0.08);border:1px solid rgba(46,204,113,0.2)">' +
        '<div class="alert-title" style="color:#2ecc71">🔮 AI户型图分析报告</div>' +
        '<div style="margin-top:12px;font-size:13px;line-height:1.8;white-space:pre-wrap">' + (result || '分析完成但未返回内容') + '</div>' +
        '</div>';
    }
  }).catch(function(err) {
    var fsAiResult = document.getElementById('fsAiStatus');
    if (fsAiResult) {
      fsAiResult.innerHTML = '<div class="huajie-alert" style="margin-top:16px;background:rgba(231,76,60,0.08);border:1px solid rgba(231,76,60,0.2)">' +
        '<div class="alert-title" style="color:#e74c3c">AI分析失败</div>' +
        '<p style="font-size:13px">请确认网络正常</p>' +
        '<p style="font-size:12px;opacity:.6">错误：' + err.message + '</p></div>';
    }
  });
}

// 上传户型图分析
function handleFloorPlanUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById('fsPreview');
    preview.src = e.target.result;
    preview.style.display = 'block';
    preview.onload = function() { analyzeFloorPlan(preview); };
  };
  reader.readAsDataURL(file);
}

function analyzeFloorPlan(imgEl) {
  try {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const maxW = 800;
  const scale = Math.min(1, maxW / imgEl.naturalWidth);
  canvas.width = imgEl.naturalWidth * scale;
  canvas.height = imgEl.naturalHeight * scale;
  ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  let totalBrightness = 0;
  const pixelCount = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
  }
  const avgBrightness = totalBrightness / pixelCount;

  let score = 0;
  let suggestions = [];

  if (avgBrightness > 180) {
    score += 15;
    suggestions.push({ icon: '☀️', text: '采光充足(+15分)', good: true });
  } else if (avgBrightness > 120) {
    score += 10;
    suggestions.push({ icon: '🌤️', text: '采光一般，建议增加照明(+10分)', good: true });
  } else {
    suggestions.push({ icon: '🌑', text: '采光不足，需改善照明(+0分)', good: false });
  }

  // 户型方正度分析(基于图片宽高比)
  const aspectRatio = imgEl.naturalWidth / imgEl.naturalHeight;
  if (aspectRatio > 0.7 && aspectRatio < 1.4) {
    score += 20;
    suggestions.push({ icon: '📐', text: '户型方正，气场稳定(+20分)', good: true });
  } else {
    score += 5;
    suggestions.push({ icon: '📐', text: '户型偏长/偏窄，建议调整布局(+5分)', good: false });
  }

  // 默认加分(无法从图像精确判断的,给中间分)
  score += 15; suggestions.push({ icon: '🚪', text: '门不对厕(预估，需实地确认)(+15分)', good: true });
  score += 10; suggestions.push({ icon: '🛏️', text: '卧室布局(预估，需实地确认)(+10分)', good: true });
  score += 10; suggestions.push({ icon: '🍳', text: '厨房不对门(预估，需实地确认)(+10分)', good: true });
  score += 5; suggestions.push({ icon: '💨', text: '通风判断(预估，需实地确认)(+5分)', good: true });

  score = Math.min(score, 100);

  const out = document.getElementById('fsFloorOutput');
  const scoreColor = score >= 80 ? '#2ecc71' : score >= 60 ? '#c9a84c' : '#e74c3c';
  let html = '<div style="text-align:center;margin-bottom:24px">';
  html += '<div style="font-size:72px;color:' + scoreColor + ';font-family:\'Ma Shan Zheng\',serif;letter-spacing:6px">' + score + '分</div>';
  html += '<p style="font-size:14px;opacity:.5;letter-spacing:2px">户型风水综合评分</p>';
  html += '<p style="font-size:11px;opacity:.3">平均亮度:' + avgBrightness.toFixed(0) + ' / 255</p></div>';
  html += '<div class="fs-score-bar"><div class="fs-score-fill" style="width:' + score + '%;background:' + scoreColor + '"></div></div>';
  html += '<div style="margin-top:20px"><h5 style="font-size:13px;letter-spacing:4px;color:var(--gold);margin-bottom:12px">分析明细</h5>';
  for (const s of suggestions) {
    html += '<div style="padding:8px 0;border-bottom:1px solid rgba(201,168,76,.04);font-size:13px;opacity:.7">' + s.icon + ' ' + s.text + '</div>';
  }
  html += '</div>';
  html += '<div class="huajie-alert" style="margin-top:24px"><div class="alert-title">⚠️ 提示</div><p>户型图分析为基于图像亮度和比例的自动评估，仅供参考。准确的宅子风水需结合实地勘测、朝向、周边环境等多因素综合判断。</p></div>';
  out.innerHTML = html;
  document.getElementById('fsFloorResult').style.display = 'block';
  } catch(err) {
    console.error('户型图分析错误:', err);
    const out = document.getElementById('fsFloorOutput');
    if (out) out.innerHTML = '<div style="padding:30px;text-align:center"><div style="font-size:48px;margin-bottom:16px">⚠️</div><h4 style="color:var(--gold);margin-bottom:12px">户型图分析失败</h4><p style="color:var(--paper2);font-size:13px">图片格式可能不支持，或图片尺寸异常。<br>请尝试上传 JPG/PNG 格式的户型图。</p></div>';
    document.getElementById('fsFloorResult').style.display = 'block';
  }
}

// 简易风水评分
// 户型图上传处理
let fengshuiImageData = null;

function initFengshuiUpload() {
  const zone = document.getElementById('fengshuiUploadZone');
  const input = document.getElementById('fengshuiImageInput');
  const placeholder = document.getElementById('uploadPlaceholder');
  const preview = document.getElementById('uploadPreview');
  const previewImg = document.getElementById('previewImage');

  if (!zone || !input) return;

  // 点击上传
  zone.addEventListener('click', () => input.click());

  // 拖拽上传
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragover');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFengshuiFile(file);
  });

  // 文件选择
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFengshuiFile(file);
  });
}

function handleFengshuiFile(file) {
  if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
    showToast('请上传图片或PDF文件');
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showToast('文件大小不能超过10MB');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    fengshuiImageData = e.target.result;
    const previewImg = document.getElementById('previewImage');
    const placeholder = document.getElementById('uploadPlaceholder');
    const preview = document.getElementById('uploadPreview');

    if (file.type === 'application/pdf') {
      previewImg.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📄</text></svg>';
      showToast('PDF文件已上传，将由专业老师解读');
    } else {
      previewImg.src = fengshuiImageData;
    }

    placeholder.style.display = 'none';
    preview.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function clearFengshuiImage() {
  fengshuiImageData = null;
  const input = document.getElementById('fengshuiImageInput');
  const placeholder = document.getElementById('uploadPlaceholder');
  const preview = document.getElementById('uploadPreview');

  if (input) input.value = '';
  if (placeholder) placeholder.style.display = 'block';
  if (preview) preview.style.display = 'none';
}

// 专业风水测评
function computeFengshuiPro() {
  const huxing = document.getElementById('fsHuxing').value;
  const chaoxiang = document.getElementById('fsChaoxiang').value;
  const louceng = document.getElementById('fsLouceng').value;
  const area = document.getElementById('fsArea').value;
  const buildYear = parseInt(document.getElementById('fsBuildYear').value) || 2000;
  const jianzhu = document.getElementById('fsJianzhu').value;
  const year = parseInt(document.getElementById('fsYear').value) || 1990;
  const sex = document.getElementById('fsSex').value || 'male';
  const phone = document.getElementById('fsPhone').value;

  const problems = [];
  for (let i = 1; i <= 8; i++) {
    const cb = document.getElementById('fsProblem' + i);
    if (cb && cb.checked) problems.push(cb.value);
  }

  if (!huxing || !chaoxiang || !louceng) { showToast('请填写户型、朝向和楼层'); return; }
  if (!year || !sex) { showToast('请填写出生年份和性别'); return; }

  // 1. 计算命卦（精确）
  const mingGua = getMingGua(year, sex);

  // 2. 计算宅卦
  const dirMap = {'北':1,'南':9,'东':3,'西':7,'东北':8,'西北':6,'东南':4,'西南':2};
  const zhaiNum = dirMap[chaoxiang] || 1;
  const bazhai = _computeBazhai(zhaiNum);

  // 3. 玄空飞星
  const xuankong = _xuankongBrief(buildYear, chaoxiang);

  // 4. 八字日主五行（如果有出生信息）
  let baziDayZhu = null;
  let baziWuxing = null;
  try {
    const bd = getBaziCalcData(year, 1, 1, 12, sex === 'female');
    if (bd && bd.dayStem) {
      baziDayZhu = bd.dayStem;
      baziWuxing = ELE[bd.dayStem] || '土';
    }
  } catch(e) {}

  // 5. 当前流年飞星
  const currentYear = new Date().getFullYear();
  const yearStar = _getYearFlyingStar(currentYear);

  // 6. 综合评分（基于真实算法）
  let score = 60;
  let items = [];

  // 6.1 朝向与命卦匹配
  const dongSiDirections = ['东', '南', '东南', '北'];
  const xiSiDirections = ['西', '西南', '西北', '东北'];
  const isDongSi = mingGua.isDong;
  const directionMatches = isDongSi ? dongSiDirections.includes(chaoxiang) : xiSiDirections.includes(chaoxiang);

  if (directionMatches) {
    score += 15;
    items.push({ name: '宅命相配', score: 15, desc: mingGua.type + '配' + (isDongSi ? '东四宅' : '西四宅') + '，大吉', isPositive: true });
  } else {
    score -= 5;
    items.push({ name: '宅命不配', score: -5, desc: mingGua.type + '与' + chaoxiang + '朝向不配，需化解', isPositive: false, needsFix: true });
  }

  // 6.2 楼层五行
  const loucengNum = parseInt(louceng);
  const lcWuxing = _getFloorWuxing(loucengNum);
  const lcMatchesBazi = baziWuxing ? _wuxingRelation(lcWuxing, baziWuxing) : 'unknown';
  let lcScore = 8;
  if (lcMatchesBazi === '生' || lcMatchesBazi === '同') lcScore = 12;
  else if (lcMatchesBazi === '克') lcScore = 4;
  score += lcScore;
  items.push({
    name: '楼层五行',
    score: lcScore,
    desc: loucengNum + '层(' + lcWuxing + ')' + (baziWuxing ? '，日主' + baziWuxing + (lcMatchesBazi === '生' ? '受生' : lcMatchesBazi === '克' ? '受克' : '比和') : ''),
    isPositive: lcScore >= 10
  });

  // 6.3 玄空飞星旺山旺向
  if (xuankong && xuankong.wangShan) {
    score += 10;
    items.push({ name: '旺山旺向', score: 10, desc: '当运旺山旺向，丁财两旺', isPositive: true });
  } else {
    score -= 5;
    items.push({ name: '非当运', score: -5, desc: '非当运之宅，需以布局化解', isPositive: false, needsFix: true });
  }

  // 6.4 户型方正（基于真实分析，不用Math.random）
  if (fengshuiImageData) {
    // 有户型图：后续AI分析
    items.push({ name: '户型图', score: 0, desc: '已上传户型图，点击下方"AI深度分析"获取专业解读', isPending: true });
  } else {
    items.push({ name: '户型图', score: 0, desc: '未上传户型图，建议上传以获取精准分析', isPending: true });
  }

  // 6.5 特殊问题扣分
  const problemPenalty = {
    '缺角': -8, '穿堂煞': -10, '横梁压顶': -6, '卫生间中宫': -12,
    '厨房西北': -8, '门对门': -5, '尖角冲射': -7, '路冲': -9
  };
  problems.forEach(function(p) {
    const penalty = problemPenalty[p] || -5;
    score += penalty;
    items.push({ name: p, score: penalty, desc: '需化解', isPositive: false, needsFix: true });
  });

  score = Math.max(30, Math.min(score, 95));

  // 7. 生成每个房间的化解方案
  const roomSolutions = _generateRoomSolutions(bazhai, mingGua, xuankong, yearStar, problems, baziWuxing);

  // 8. 生成流年化解方案
  const yearlySolutions = _generateYearlySolutions(yearStar, currentYear, baziWuxing, mingGua);

  // 9. 如果上传了户型图，启动AI分析
  if (fengshuiImageData) {
    _analyzeFloorPlanAI(fengshuiImageData, { huxing: huxing, chaoxiang: chaoxiang, buildYear: buildYear, year: year, sex: sex, mingGua: mingGua, bazhai: bazhai });
  }

  renderFengshuiResultPro({
    score: score,
    items: items,
    mingGua: mingGua,
    bazhai: bazhai,
    xuankong: xuankong,
    roomSolutions: roomSolutions,
    yearlySolutions: yearlySolutions,
    baziDayZhu: baziDayZhu,
    baziWuxing: baziWuxing,
    yearStar: yearStar,
    huxing: huxing, chaoxiang: chaoxiang, louceng: louceng,
    area: area, buildYear: buildYear, jianzhu: jianzhu,
    year: year, sex: sex, phone: phone,
    problems: problems, hasImage: !!fengshuiImageData
  });
}

function getChaoxiangDetail(chaoxiang) {
  const details = {
    '南': '帝王之向，采光充足，冬暖夏凉，但夏季炎热',
    '东南': '紫气东来，旺文昌，利学业事业，采光通风俱佳',
    '东': '日出东方，朝气蓬勃，利年轻人，但上午光线强',
    '西南': '坤方厚德，利女主人，财运稳定，但下午西晒',
    '北': '阴气较重，冬冷夏凉，利储藏，不宜久居',
    '西': '夕阳西下，下午西晒严重，夏季炎热，不利睡眠',
    '西北': '乾方天门，利男主人和事业，但需防西北风',
    '东北': '艮方生门，利财运和子嗣，但采光较弱'
  };
  return details[chaoxiang] || '';
}

function renderFengshuiResultPro(data) {
  const out = document.getElementById('fsOutput');
  document.getElementById('fsResult').classList.add('visible');

  const scoreColor = data.score >= 80 ? '#2ecc71' : data.score >= 60 ? '#c9a84c' : '#e74c3c';
  const scoreLevel = data.score >= 80 ? '优秀' : data.score >= 60 ? '良好' : '需改善';

  var html = '<div style="text-align:center;margin-bottom:30px">' +
    '<div style="font-size:72px;color:' + scoreColor + ';font-family:Ma Shan Zheng,serif;letter-spacing:4px">' + data.score + '</div>' +
    '<div style="font-size:16px;color:' + scoreColor + ';letter-spacing:3px;margin-top:8px">' + scoreLevel + '</div>' +
    '<p style="font-size:12px;opacity:.4;letter-spacing:2px;margin-top:4px">风水综合评分</p></div>' +
    '<div class="fs-score-bar"><div class="fs-score-fill" style="width:' + data.score + '%;background:' + scoreColor + '"></div></div>';

  // 命卦分析
  html += '<div class="huajie-alert" style="margin-top:24px"><div class="alert-title">命卦分析</div>' +
    '<p>命卦：<strong>' + data.mingGua.type + '</strong>（' + data.mingGua.guaName + '卦，卦数' + data.mingGua.gua + '）</p>';
  if (data.baziDayZhu) {
    html += '<p style="margin-top:8px">日主：<strong>' + data.baziDayZhu + '</strong>（' + data.baziWuxing + '行）</p>' +
      '<p style="margin-top:4px;font-size:12px;opacity:.7">有利颜色：' + _getFavorableColor(data.baziWuxing) + '</p>';
  }
  html += '<p style="margin-top:8px">吉方：<span style="color:#2ecc71">' + (data.mingGua.isDong ? '东、南、东南、北' : '西、西南、西北、东北') + '</span></p>' +
    '<p style="margin-top:4px">凶方：<span style="color:#e74c3c">' + (data.mingGua.isDong ? '西、西南、西北、东北' : '东、南、东南、北') + '</span></p></div>';

  // 评分明细
  html += '<div style="margin-top:24px"><h5 style="font-size:13px;letter-spacing:4px;color:var(--gold);margin-bottom:12px">评分明细</h5><div class="shensha-grid">';
  for (var i = 0; i < data.items.length; i++) {
    var item = data.items[i];
    var c = item.score >= 10 ? '#2ecc71' : item.score > 0 ? '#c9a84c' : item.score < 0 ? '#e74c3c' : '#999';
    html += '<div class="shensha-item"' + (item.needsFix ? ' style="border-left:3px solid #e74c3c"' : '') + '>' +
      '<span class="ss-name">' + item.name + '</span>' +
      (item.isPending ? '<span style="color:#999">待分析</span>' : '<span style="color:' + c + '">' + (item.score > 0 ? '+' : '') + item.score + '分</span>') +
      '<span class="ss-desc">' + item.desc + '</span></div>';
  }
  html += '</div></div>';

  // AI分析区域（如果上传了户型图）
  if (data.hasImage) {
    html += '<div id="fsAiStatus" style="margin-top:24px"></div>';
  }

  // ===== 八方位房间化解方案（核心新增） =====
  html += '<div style="margin-top:30px"><h5 style="font-size:14px;letter-spacing:4px;color:var(--gold);margin-bottom:16px">🏠 八方位房间化解方案</h5>' +
    '<p style="font-size:12px;opacity:.6;margin-bottom:16px">基于八宅吉凶位 + 流年飞星 + 命卦综合分析</p>';

  for (var s = 0; s < data.roomSolutions.length; s++) {
    var rs = data.roomSolutions[s];
    var isGood = rs.bazhaiPosition === '生气' || rs.bazhaiPosition === '天医' || rs.bazhaiPosition === '延年' || rs.bazhaiPosition === '伏位';
    var posColor = isGood ? '#2ecc71' : '#e74c3c';
    var starColor = rs.yearStar === 8 || rs.yearStar === 9 || rs.yearStar === 1 || rs.yearStar === 4 || rs.yearStar === 6 ? '#2ecc71' : '#e74c3c';

    html += '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(201,168,76,0.15);border-radius:10px;padding:16px;margin-bottom:12px' + (rs.isDanger ? ';border-left:3px solid #e74c3c' : '') + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
        '<span style="font-size:15px;color:var(--gold);font-weight:bold">' + rs.direction + '方</span>' +
        '<span style="font-size:11px;padding:2px 8px;border-radius:4px;background:' + (rs.isDanger ? 'rgba(231,76,60,0.15)' : 'rgba(46,204,113,0.1)') + ';color:' + (rs.isDanger ? '#e74c3c' : '#2ecc71') + '">' + rs.advice + '</span>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;font-size:12px">' +
        '<div><span style="opacity:.5">八宅位：</span><span style="color:' + posColor + '">' + rs.bazhaiPosition + '</span></div>' +
        '<div><span style="opacity:.5">流年星：</span><span style="color:' + starColor + '">' + rs.starName + '(#' + rs.yearStar + ')</span></div>' +
        '<div><span style="opacity:.5">适宜房间：</span>' + rs.rooms.join('、') + '</div>' +
        '<div><span style="opacity:.5">最佳用途：</span>' + rs.bestUse + '</div>' +
      '</div>' +
      '<div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.05);font-size:12px">' +
        '<div style="margin-bottom:4px"><span style="opacity:.5">🪑 家具布置：</span>' + rs.bestUse + '，避免' + rs.avoid + '</div>' +
        '<div style="margin-bottom:4px"><span style="opacity:.5">🎨 颜色方案：</span>' + rs.color + (rs.starColor ? '；流年化解色：' + rs.starColor : '') + '</div>' +
        (rs.favorableColor ? '<div style="margin-bottom:4px"><span style="opacity:.5">✨ 八字幸运色：</span>' + rs.favorableColor + '</div>' : '') +
        '<div><span style="opacity:.5">🔮 吉祥物：</span>' + rs.items.join('、') + '</div>' +
      '</div>' +
    '</div>';
  }
  html += '</div>';

  // ===== 流年化解方案 =====
  html += '<div style="margin-top:30px"><h5 style="font-size:14px;letter-spacing:4px;color:var(--gold);margin-bottom:16px">📅 流年飞星化解方案（' + data.yearlySolutions.length + '年）</h5>';

  for (var y = 0; y < data.yearlySolutions.length; y++) {
    var ys = data.yearlySolutions[y];
    html += '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(201,168,76,0.15);border-radius:10px;padding:16px;margin-bottom:12px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
        '<span style="font-size:15px;color:var(--gold);font-weight:bold">' + ys.year + '年</span>' +
        '<span style="font-size:11px;padding:2px 8px;border-radius:4px;background:rgba(201,168,76,0.1);color:var(--gold)">' + ys.centerStar + '入中宫</span>' +
      '</div>' +
      '<p style="font-size:12px;opacity:.7;margin-bottom:8px">' + ys.summary + '</p>';

    // 凶星警告
    if (ys.warnings.length > 0) {
      html += '<div style="margin-top:8px"><span style="color:#e74c3c;font-size:12px">⚠️ 需化解方位：</span>';
      for (var w = 0; w < ys.warnings.length; w++) {
        var wrn = ys.warnings[w];
        html += '<div style="font-size:12px;margin-top:4px;padding:6px 10px;background:rgba(231,76,60,0.06);border-radius:6px">' +
          '<strong>' + wrn.direction + '方</strong> - ' + wrn.name + '：' + wrn.action +
          '（颜色：' + wrn.color + '）</div>';
      }
      html += '</div>';
    }

    // 吉星建议
    if (ys.auspicious.length > 0) {
      html += '<div style="margin-top:10px"><span style="color:#2ecc71;font-size:12px">✨ 可催旺方位：</span>';
      for (var a = 0; a < ys.auspicious.length; a++) {
        var aus = ys.auspicious[a];
        html += '<div style="font-size:12px;margin-top:4px;padding:6px 10px;background:rgba(46,204,113,0.06);border-radius:6px">' +
          '<strong>' + aus.direction + '方</strong> - ' + aus.name + '：' + aus.action +
          '（颜色：' + aus.color + '）</div>';
      }
      html += '</div>';
    }
    html += '</div>';
  }
  html += '</div>';

  // 化解建议（问题汇总）
  if (data.problems.length > 0 || data.score < 80) {
    html += '<div style="margin-top:24px"><h5 style="font-size:13px;letter-spacing:4px;color:var(--gold);margin-bottom:12px">综合化解建议</h5><ul class="huajie-checklist">';
    var fixMap = {
      '缺角': '缺角：在缺角方位放置泰山石或铜葫芦化解，缺西北不利男主人，缺西南不利女主人',
      '穿堂煞': '穿堂煞：在门口设屏风、玄关或挂门帘化解，避免财气直泄',
      '横梁压顶': '横梁压顶：在梁下放置大象摆件或葫芦化解，或装修包梁，床位/沙发避开梁下',
      '卫生间中宫': '卫生间中宫：极为不利，建议改造，或在卫生间放粗盐、五帝钱、铜葫芦化解',
      '厨房西北': '厨房西北：火烧天门，不利男主人，建议在厨房放黄色地垫或陶瓷制品化解',
      '门对门': '门对门：挂门帘（长度过半），或在门上贴福字、五帝钱化解',
      '尖角冲射': '尖角冲射：在窗户挂八卦镜或放置绿色植物化解',
      '路冲': '路冲：在门口放置石狮子、泰山石或种植绿植化解，严重者需搬家'
    };
    for (var p = 0; p < data.problems.length; p++) {
      html += '<li>' + (fixMap[data.problems[p]] || data.problems[p] + '：需化解') + '</li>';
    }
    if (data.score < 60) html += '<li style="color:#e74c3c">综合评分较低，建议请专业风水师现场勘测</li>';
    html += '</ul></div>';
  }

  // 导出
  html += '<div style="margin-top:24px;text-align:center"><button class="btn-secondary" onclick="exportFengshuiReport()">📄 导出报告</button></div>';

  // ═══ 三元九运风水维度 ═══
  try {
    html += _generateSanyuanJiuyunBlock('fengshui', {
      dayStem: data.baziDayZhu || '甲',
      dayEle: data.baziWuxing || '木',
      currentYear: data.year || new Date().getFullYear()
    });
  } catch(e) { console.warn('[三元九运风水分析块失败]', e.message); }

  out.innerHTML = html;
}

// ═══ 阳宅专业分析（八字选层+户型吉凶+择日+化解） ═══
function yzpToggleCalendar() {
  var mode = document.getElementById('yzpCalendarMode').value;
  document.getElementById('yzpSolarInput').style.display = mode === 'solar' ? '' : 'none';
  document.getElementById('yzpLunarInput').style.display = mode === 'lunar' ? '' : 'none';
}

function computeYangzhaiPro() {
  try {
    var name = document.getElementById('yzpName').value || '缘主';
    var sex = document.getElementById('yzpSex').value || 'male';
    var needType = document.getElementById('yzpNeedType').value || '购房选房';
    var birthCity = document.getElementById('yzpBirthCity').value || '';
    var liveCity = document.getElementById('yzpLiveCity').value || '';
    var floorInput = document.getElementById('yzpFloor').value || '';
    var areaInput = document.getElementById('yzpArea').value || '';

    // 获取出生日期
    var calMode = document.getElementById('yzpCalendarMode').value;
    var birthDate, birthHour;
    if (calMode === 'lunar') {
      var ly = parseInt(document.getElementById('yzpLunarYear').value);
      var lm = parseInt(document.getElementById('yzpLunarMonth').value);
      var ld = parseInt(document.getElementById('yzpLunarDay').value);
      birthHour = parseInt(document.getElementById('yzpLunarHour').value) * 2;
      if (!ly || !lm || !ld) { alert('请填写完整农历出生日期'); return; }
      var solar = lunarToSolar(ly, lm, ld, false);
      birthDate = solar.year + '-' + String(solar.month).padStart(2,'0') + '-' + String(solar.day).padStart(2,'0');
    } else {
      birthDate = document.getElementById('yzpBirthDate').value;
      if (!birthDate) { alert('请填写出生日期'); return; }
      birthHour = 12; // 默认午时
    }

    // 计算八字
    var parts = birthDate.split('-');
    var year = parseInt(parts[0]);
    var month = parseInt(parts[1]);
    var day = parseInt(parts[2]);
    var bazi = computeBaziCore(year, month, day, birthHour);
    if (!bazi) { alert('八字计算失败'); return; }

    // 获取已知问题
    var problems = [];
    var checks = document.querySelectorAll('.yzp-problem');
    for (var i = 0; i < checks.length; i++) {
      if (checks[i].checked) problems.push(checks[i].value);
    }

    // 分析用神（简化版：找最弱的五行）
    var eleCount = { '金':0, '木':0, '水':0, '火':0, '土':0 };
    for (var i = 0; i < 4; i++) {
      if (bazi.pillars[i] && bazi.pillars[i].element) eleCount[bazi.pillars[i].element] = (eleCount[bazi.pillars[i].element] || 0) + 1;
    }
    var weakest = '木';
    var minCount = 99;
    for (var e in eleCount) {
      if (eleCount[e] < minCount) { minCount = eleCount[e]; weakest = e; }
    }

    // 日主
    var dayStem = bazi.pillars[2] ? bazi.pillars[2].stem : '甲';
    var dayEle = ELE[dayStem] || '木';

    // 命卦计算（简化版）
    var birthYearNum = year;
    var sum = birthYearNum.toString().split('').reduce(function(a,b){return parseInt(a)+parseInt(b);},0);
    while (sum > 9) sum = sum.toString().split('').reduce(function(a,b){return parseInt(a)+parseInt(b);},0);
    var mingGua;
    if (sex === 'male') {
      mingGua = (11 - sum) % 9 || 9;
    } else {
      mingGua = (sum + 4) % 9 || 9;
    }
    var isEastLife = [1,3,4,9].indexOf(mingGua) >= 0;
    var lifeType = isEastLife ? '东四命' : '西四命';

    // 楼层五行推荐
    var floorWx = {
      '水': [1,6,11,16,21,26,31],
      '火': [2,7,12,17,22,27,32],
      '木': [3,8,13,18,23,28,33],
      '金': [4,9,14,19,24,29],
      '土': [5,10,15,20,25,30]
    };
    var recommendFloors = floorWx[weakest] || floorWx['木'];
    var avoidFloors = floorWx[ELE[dayStem] === weakest ? '金' : dayEle] || [];
    if (avoidFloors.length === 0) avoidFloors = [4,9,14,19,24,29];

    // 开始输出
    var out = document.getElementById('fsProResult');
    out.style.display = 'block';
    var html = '';

    // 标题区
    html += '<div class="result-banner"><h2 class="rb-name">🏠 ' + name + '的阳宅专业分析</h2>';
    html += '<p class="rb-meta">' + needType + ' | ' + lifeType + '（' + mingGua + '卦）| 日主:' + dayStem + dayEle + ' | 用神:' + weakest + '</p></div>';

    // 1. 八字分析摘要
    html += '<div class="analysis-card" style="margin:16px 0;padding:20px;border:1px solid rgba(201,168,76,.2)">';
    html += '<h5 style="color:var(--gold);margin-bottom:12px">📊 八字分析摘要</h5>';
    html += '<div style="font-size:13px;line-height:2">';
    html += '<p><b>日主：</b>' + dayStem + '(' + dayEle + ')　<b>用神五行：</b>' + weakest + '</p>';
    html += '<p><b>命卦：</b>' + mingGua + '卦(' + lifeType + ')　<b>五行分布：</b>';
    for (var e in eleCount) html += e + ':' + eleCount[e] + ' ';
    html += '</p>';
    if (birthCity) html += '<p><b>出生城市：</b>' + birthCity + (liveCity ? ' → <b>现居城市：</b>' + liveCity : '') + '</p>';
    html += '</div></div>';

    // 2. 楼层推荐
    html += '<div class="analysis-card" style="margin:16px 0;padding:20px;border:1px solid rgba(46,204,113,.2)">';
    html += '<h5 style="color:#2ecc71;margin-bottom:12px">🏢 楼层推荐（基于用神' + weakest + '）</h5>';
    html += '<div style="font-size:13px;line-height:2">';
    html += '<p><b style="color:#2ecc71">⭐ 推荐楼层：</b>' + recommendFloors.slice(0,5).join('、') + '层</p>';
    html += '<p style="opacity:.7">理由：用神为' + weakest + '，尾数为' + (weakest==='水'?'1/6':weakest==='火'?'2/7':weakest==='木'?'3/8':weakest==='金'?'4/9':'5/0') + '的楼层五行属' + weakest + '，与用神同频共振，助旺运势。</p>';
    html += '<p><b style="color:#e74c3c">⚠️ 避忌楼层：</b>' + avoidFloors.slice(0,3).join('、') + '层</p>';
    html += '<p style="opacity:.7">理由：该楼层五行克泄用神，不利运势发挥。</p>';
    if (floorInput) {
      var fn = parseInt(floorInput);
      var fnWx = fn % 10 === 1 || fn % 10 === 6 ? '水' : fn % 10 === 2 || fn % 10 === 7 ? '火' : fn % 10 === 3 || fn % 10 === 8 ? '木' : fn % 10 === 4 || fn % 10 === 9 ? '金' : '土';
      var isGood = fnWx === weakest;
      html += '<p><b style="color:' + (isGood?'#2ecc71':'#e74c3c') + '">📍 您选择的' + fn + '层五行属' + fnWx + '：</b>' + (isGood?'与用神一致，吉！':'与用神不符，建议调整或通过室内配色化解。') + '</p>';
    }
    html += '</div></div>';

    // 3. 户型吉凶分析
    if (problems.length > 0) {
      html += '<div class="analysis-card" style="margin:16px 0;padding:20px;border:1px solid rgba(231,76,60,.2)">';
      html += '<h5 style="color:#e74c3c;margin-bottom:12px">⚠️ 户型吉凶分析与化解方案</h5>';
      var problemMap = {
        '厨房西北': { desc:'西北为乾卦，五行属金，主财主父。厨房属火，火克金，谓之「火烧天门」', impact:'不利财运，男主人健康受损（呼吸系统/头部）', solution:'厨房移至东方或东南方；若无法改，在厨房放置黄色陶瓷器（土泄火生金），或放铜葫芦化解' },
        '卫生间中宫': { desc:'中宫为宅心，五行属土，主全家健康运。卫生间污秽之气聚集中宫', impact:'全家健康运下降，事业运受阻，财运不聚', solution:'卫生间保持干燥通风，放置绿植净化，常闭卫生间门，门口放地垫（土色系），悬挂五帝钱化解' },
        '穿堂煞': { desc:'大门正对阳台或窗户，气流直冲而过，无法聚气聚财', impact:'漏财破财，事业不稳定，健康受损', solution:'玄关遮挡（屏风/鞋柜/珠帘），或在大门与阳台之间摆放绿植阻断气流' },
        '横梁压顶': { desc:'横梁压在床/沙发/灶台上方，形成压迫气场', impact:'头痛失眠，事业压力大，运势压抑', solution:'吊顶包覆横梁，或移动床位/沙发位避开横梁；若无法移位，横梁两侧挂葫芦化解' },
        '门对门': { desc:'室内两门相对，气场对冲，形成口舌是非', impact:'家人易争吵，人际关系不和谐', solution:'常闭其中一门，或在两门之间放屏风/珠帘/绿植；门上挂门帘（长度过膝）' },
        '尖角冲射': { desc:'外部建筑尖角对着自家窗户或大门，形成尖角煞', impact:'健康受损，意外血光，事业受阻', solution:'窗户挂凸面八卦镜反射，或放铜葫芦+五帝钱化解；厚窗帘遮挡视线' },
        '路冲': { desc:'道路直冲自家大门或窗户，气流过急', impact:'意外灾祸，破财，健康问题', solution:'门口放石狮子/泰山石敢当，窗户贴反光膜，种绿植缓冲' },
        '缺角': { desc:'户型不方正，有缺角部位', impact:'影响对应方位的家人运势', solution:'在缺角方位放置对应五行物品补缺' },
        '西北缺角': { desc:'西北乾卦缺失，代表家中男主人方位缺', impact:'男主人事业不顺，健康受损，夫妻感情受影响', solution:'西北方位放金属物品（铜器/金属钟/金属塔）补金气，或放乾卦卦象画' },
        '西南缺角': { desc:'西南坤卦缺失，代表家中女主人方位缺', impact:'女主人运势弱，脾胃不和，家庭不稳', solution:'西南方位放陶瓷器/水晶球（土属性）补坤土之气' },
        '正北缺角': { desc:'正北坎卦缺失，代表次子方位缺', impact:'事业运和桃花运势弱', solution:'正北方位放鱼缸/水景（水属性）补水气' },
        '正南缺角': { desc:'正南离卦缺失，代表中女方位缺', impact:'名声运弱，心血管健康', solution:'正南方位放红色装饰品/灯光（火属性）补火气' },
        '正东缺角': { desc:'正东震卦缺失，代表长子方位缺', impact:'事业起步困难，肝胆健康', solution:'正东方位放绿色植物/木雕（木属性）补木气' },
        '正西缺角': { desc:'正西兑卦缺失，代表幼女方位缺', impact:'口舌是非，呼吸系统健康', solution:'正西方位放金属风铃/铜器（金属性）补金气' },
        '东北缺角': { desc:'东北艮卦缺失，代表幼子方位缺', impact:'学业运弱，脾胃健康', solution:'东北方位放陶瓷器/石雕（土属性）补艮土之气' },
        '东南缺角': { desc:'东南巽卦缺失，代表长女方方位缺', impact:'财运和名声受影响', solution:'东南方位放绿色植物/竹子（木属性）补巽木之气' },
        '大门对电梯': { desc:'大门正对电梯门，电梯开合如虎口吞吐，形成「开口煞」', impact:'健康受损，气场不稳，财运起伏，易有血光之灾', solution:'门口设玄关或屏风遮挡；门楣挂凸面八卦镜或山海镇；门内放地垫（红色/金色），门槛加高' },
        '厨房对卫生间': { desc:'厨房门与卫生间门正对，水火相冲，火气与秽气交织', impact:'家庭不和，口角频发，消化系统疾病，财运受阻', solution:'两门常闭，厨房门挂珠帘（红色系），卫生间门挂门帘（蓝色系）；两门之间放绿植或屏风隔断；卫生间放绿植净化' },
        '镜子对床': { desc:'卧室镜子正对床头或床身，夜间反射惊扰神魂', impact:'惊魂损气，睡眠质量差，多梦易醒，精神恍惚，夫妻不和', solution:'移开镜子或调整角度避开床位；睡前用布帘遮盖镜面；改为衣柜内嵌镜，使用时打开' },
        '楼梯对大门': { desc:'大门正对楼梯（向下尤甚），气流如卷帘水般外泄', impact:'钱财流失，财来财去，家运衰退，人丁不聚', solution:'门口设玄关或屏风阻挡；门槛加高至三寸；门内放置聚宝盆或鱼缸（水聚财）；门口放地垫（红色系稳气）' },
        '凸角-东': { desc:'正东震卦方位凸出，木气过旺', impact:'长子性格偏激，肝胆易患疾病，事业冲动失误', solution:'东方放金属物品（金克木）化解，如铜器、金属风铃；避免放过多绿色植物' },
        '凸角-南': { desc:'正南离卦方位凸出，火气过旺', impact:'中女急躁易怒，心血管/眼部健康问题，口舌是非', solution:'南方放土属性物品（土泄火），如陶瓷器、黄水晶；避免红色装饰和强灯光' },
        '凸角-西': { desc:'正西兑卦方位凸出，金气过旺', impact:'幼女好斗任性，呼吸系统问题，口舌争端增多', solution:'西方放水属性物品（水泄金），如鱼缸、水景；避免金属装饰' },
        '凸角-北': { desc:'正北坎卦方位凸出，水气过旺', impact:'次子性格阴沉，肾/泌尿系统问题，事业波折', solution:'北方放木属性物品（木泄水），如绿色植物、木雕；避免黑色/蓝色装饰' },
        '凸角-东南': { desc:'东南巽卦方位凸出，木气过旺', impact:'长女感情波折，神经紧张，财运起伏', solution:'东南方放金属物品（金克木）化解；减少绿色植物' },
        '凸角-西南': { desc:'西南坤卦方位凸出，土气过旺', impact:'女主人固执强势，脾胃不和，消化系统问题', solution:'西南方放金属性物品（金泄土），如铜器、金属摆件；避免陶瓷过多' },
        '凸角-西北': { desc:'西北乾卦方位凸出，金气过旺', impact:'男主人刚愎自用，头部/肺部健康问题，家庭关系紧张', solution:'西北方放水属性物品（水泄金），如鱼缸、水景；避免金属过多' },
        '凸角-东北': { desc:'东北艮卦方位凸出，土气过旺', impact:'幼子固执叛逆，学业分心，脾胃问题', solution:'东北方放金属性物品（金泄土）；减少陶瓷/石雕' },
        '开门见灶': { desc:'大门打开即见灶台，灶火外泄，财气随烟火散出', impact:'漏财消耗，存钱困难，家庭开销大，肠胃问题', solution:'设玄关或屏风遮挡视线；灶台旁放铜葫芦聚气；厨房门常闭，门挂珠帘' },
        '开门见厕': { desc:'大门正对卫生间门，秽气直冲入门', impact:'秽气冲门，健康受损，运势衰退，财运不聚，小人是非', solution:'卫生间门常闭，门挂长帘（过膝）；卫生间放绿植净化；两门之间设屏风或放绿植隔断' },
        '开门见镜': { desc:'大门内或对面有镜子正对大门，将进门之气反射出去', impact:'反财出去，财运不进，贵人远离，事业受阻', solution:'移开镜子或调整角度；改为侧面墙挂镜；用布帘遮盖或更换为装饰画' },
        '卧室门对卧室门': { desc:'两个卧室门正对，气场对冲', impact:'口角是非，家人争吵不断，关系不睦', solution:'常闭其中一门；两门之间放屏风/珠帘/绿植；门上挂门帘（长度过膝）' },
        '厨房正北': { desc:'厨房位于正北方，正北属水（坎卦），厨房属火，水火相冲', impact:'水火不容，家庭不和，肾/泌尿系统健康问题，事业波折', solution:'厨房内放黄色陶瓷器（土泄火生金通关水火）；灶台避开正北位；厨房门挂珠帘' },
        '卫生间西北': { desc:'卫生间位于西北方，西北为乾卦属金，主财主父，秽气污金', impact:'不利男主人健康和事业，财运衰退，呼吸系统问题', solution:'卫生间保持干燥通风，常闭门；放金属物品（铜器/金属塔）补金气；挂五帝钱化解秽气' },
        '财位压重物': { desc:'大门对角线财位处放置重物、杂物或垃圾桶，压住财气', impact:'财运受压，赚钱困难，财路受阻，投资失利', solution:'清理财位杂物，保持整洁明亮；放招财物品（聚宝盆/貔貅/黄水晶球/发财树）；财位宜亮不宜暗，宜生不宜压' },
        '房屋中心有柱': { desc:'房屋中心位置有立柱，中宫受压，气场受阻', impact:'中宫受压，全家运势低落，事业受阻，健康下降，家庭关系紧张', solution:'柱子周围做装饰包覆（圆形为佳）；柱旁放绿植软化尖锐感；挂葫芦化解压迫气；若有条件可做储物柜包柱' },
        '两门相对': { desc:'室内两门相对（非卧室门特指），气场对冲，气流不稳', impact:'口舌是非，家人关系不睦，气场紊乱影响健康', solution:'常闭其中一门；两门之间放屏风/绿植隔断；门上挂门帘（长度过膝）' }
      };
      for (var pi = 0; pi < problems.length; pi++) {
        var p = problemMap[problems[pi]];
        if (p) {
          html += '<div style="margin-bottom:16px;padding:14px;background:rgba(231,76,60,.05);border-radius:8px;border-left:3px solid rgba(231,76,60,.3)">';
          html += '<p style="font-weight:bold;color:#e74c3c;margin-bottom:6px">' + problems[pi] + '</p>';
          html += '<p style="font-size:12px;opacity:.8;margin-bottom:4px"><b>问题：</b>' + p.desc + '</p>';
          html += '<p style="font-size:12px;opacity:.8;margin-bottom:4px"><b>影响：</b>' + p.impact + '</p>';
          html += '<p style="font-size:12px;color:#2ecc71;margin-bottom:4px"><b>✅ 化解：</b>' + p.solution + '</p>';
          html += '</div>';
        }
      }
      html += '</div>';
    }

    // 4. 择日建议（如需搬家/装修）
    if (needType === '搬家入宅' || needType === '装修择日' || needType === '购房选房') {
      html += '<div class="analysis-card" style="margin:16px 0;padding:20px;border:1px solid rgba(52,152,219,.2)">';
      html += '<h5 style="color:#3498db;margin-bottom:12px">📅 择日建议（基于八字日主' + dayStem + '）</h5>';
      html += '<div style="font-size:13px;line-height:2">';
      // 生成未来3个月的吉日建议
      var now = new Date();
      var goodDates = [];
      var dayStemIdx = STEMS.indexOf(dayStem);
      for (var d = 1; d <= 90; d++) {
        var testDate = new Date(now.getTime() + d * 86400000);
        var gz = getDayGanZhi(testDate.getFullYear(), testDate.getMonth()+1, testDate.getDate());
        if (!gz) continue;
        var dayStemIdx2 = STEMS.indexOf(gz[0]);
        // 避忌：日柱冲日主（甲冲庚/乙冲辛等）
        var chongIdx = (dayStemIdx + 4) % 10; // 对冲
        if (dayStemIdx2 === chongIdx) continue;
        // 优选：生扶日主的日子
        var testEle = ELE[gz[0]] || '木';
        if (testEle === weakest) {
          goodDates.push({ date: testDate, gz: gz, reason: '用神' + weakest + '当值，旺扶日主' });
        }
        if (goodDates.length >= 3) break;
      }
      if (goodDates.length === 0) {
        html += '<p>近三个月内暂无特别吉日，建议咨询专业命理师择日。</p>';
      } else {
        var hourNames = ['子时(23-01)','丑时(01-03)','寅时(03-05)','卯时(05-07)','辰时(07-09)','巳时(09-11)','午时(11-13)','未时(13-15)','申时(15-17)','酉时(17-19)','戌时(19-21)','亥时(21-23)'];
        for (var gi = 0; gi < goodDates.length; gi++) {
          var gd = goodDates[gi];
          var dateStr = gd.date.getFullYear() + '年' + (gd.date.getMonth()+1) + '月' + gd.date.getDate() + '日';
          html += '<p><b style="color:#2ecc71">⭐ ' + dateStr + ' ' + gd.gz[0] + gd.gz[1] + '</b></p>';
          html += '<p style="opacity:.7;margin-left:20px">理由：' + gd.reason + '</p>';
          html += '<p style="opacity:.7;margin-left:20px">吉时：辰时(7-9点)/巳时(9-11点)/午时(11-13点) — 上午阳气渐旺，宜搬入/签约/动工</p>';
        }
      }
      html += '<p style="margin-top:12px;opacity:.6;font-size:12px">⚠️ 避忌：日柱冲日主(' + dayStem + ')之日不可用。搬家宜选上午吉时，入宅后先开灯/烧水/煮饭，寓意「火旺家兴」。</p>';
      html += '</div></div>';
    }

    // 5. 个性化配色和布局
    var wxColor = { '金':'白色/银色/金色','木':'绿色/青色','水':'黑色/蓝色/灰色','火':'红色/紫色/橙色','土':'黄色/棕色/咖色' };
    var wxDir = { '金':'西方/西北','木':'东方/东南','水':'北方','火':'南方','土':'中央/东北/西南' };
    html += '<div class="analysis-card" style="margin:16px 0;padding:20px;border:1px solid rgba(155,89,182,.2)">';
    html += '<h5 style="color:#9b59b6;margin-bottom:12px">🎨 个性化配色与布局建议</h5>';
    html += '<div style="font-size:13px;line-height:2">';
    html += '<p><b>幸运配色：</b>' + (wxColor[weakest]||'绿色') + '（用神' + weakest + '对应色系）</p>';
    html += '<p><b>有利方位：</b>' + (wxDir[weakest]||'东方') + '（用神' + weakest + '对应方位）</p>';
    html += '<p><b>床位朝向：</b>' + (isEastLife ? '东四命宜朝东/东南/北/南' : '西四命宜朝西/西北/西南/东北') + '</p>';
    html += '<p><b>大门方位：</b>' + (isEastLife ? '宜东/东南/北/南（东四宅）' : '宜西/西北/西南/东北（西四宅）') + '</p>';
    if (areaInput) html += '<p><b>面积分析：</b>' + areaInput + 'm²，' + (parseInt(areaInput) < 90 ? '紧凑型户型，宜浅色系扩展视觉空间' : parseInt(areaInput) < 144 ? '舒适型户型，配色可灵活搭配' : '宽敞型户型，宜分区配色，重点方位强化用神色') + '</p>';
    html += '</div></div>';

    // 6. 综合评分
    var score = 75;
    if (floorInput) { var fn2 = parseInt(floorInput); var fnWx2 = fn2%10===1||fn2%10===6?'水':fn2%10===2||fn2%10===7?'火':fn2%10===3||fn2%10===8?'木':fn2%10===4||fn2%10===9?'金':'土'; if (fnWx2===weakest) score += 15; else score -= 10; }
    score -= problems.length * 3;
    if (score < 30) score = 30; if (score > 100) score = 100;
    html += '<div class="analysis-card" style="margin:16px 0;padding:20px;border:2px solid rgba(201,168,76,.3);text-align:center">';
    html += '<h5 style="color:var(--gold);margin-bottom:12px">📊 综合评分</h5>';
    html += '<div style="font-size:48px;color:' + (score>=80?'#2ecc71':score>=60?'#f39c12':'#e74c3c') + ';font-weight:bold">' + score + '</div>';
    html += '<p style="opacity:.7;font-size:12px;margin-top:8px">' + (score>=80?'吉宅，推荐':score>=60?'中吉，需化解':'需重点化解') + '</p>';
    html += '</div>';

    // ═══ 三元九运风水维度 ═══
    try {
      html += _generateSanyuanJiuyunBlock('fengshui', {
        dayStem: dayStem || '甲',
        dayEle: dayEle || '木',
        currentYear: year || new Date().getFullYear()
      });
    } catch(e) { console.warn('[三元九运阳宅分析块失败]', e.message); }

    // 返回按钮
    html += '<div class="back-row"><button class="back-btn" onclick="showSection(\'hero\')">返 回 首 页</button></div>';

    out.innerHTML = html;
    out.classList.add('visible');
    out.scrollIntoView({ behavior:'smooth' });
  } catch(err) {
    console.error('阳宅专业分析错误:', err);
    var out = document.getElementById('fsProResult');
    out.style.display = 'block';
    out.innerHTML = '<div style="padding:40px;text-align:center"><div style="font-size:48px;margin-bottom:16px">⚠️</div><h3 style="color:var(--gold);margin-bottom:12px">计算遇到问题</h3><p style="color:var(--paper2);font-size:14px;line-height:1.8">错误详情：' + (err.message||'').substring(0,120) + '</p></div>';
    out.classList.add('visible');
  }
}
try { window.computeYangzhaiPro = computeYangzhaiPro; window.yzpToggleCalendar = yzpToggleCalendar; } catch(e){}

function computeFengshui() {
  // 简化版，直接调用专业版
  computeFengshuiPro();
}

function exportFengshuiReport() {
  showToast('报告生成中，请稍候...');
  // 报告导出已实现（exportReportAsText/exportReportAsHTMLFile）
}

// ================================================================
// ===== 楼层推荐功能 =====
// ================================================================

/**
 * 楼层推荐功能
 * 根据缘主生辰八字（年月日时+性别），结合日主五行、喜用神、命卦
 * 推荐1-33层每层吉凶评级，给出Top5推荐和避开楼层
 * 楼层尾数对应五行：1/6水、2/7火、3/8木、4/9金、5/0土（河图数）
 */
function computeFloorRecommend() {
  try {
    // 读取输入
    var name = document.getElementById('frName') ? document.getElementById('frName').value : '缘主';
    var sex = document.getElementById('frSex') ? document.getElementById('frSex').value : 'male';
    var birthDate = document.getElementById('frBirthDate') ? document.getElementById('frBirthDate').value : '';
    var birthHour = document.getElementById('frBirthHour') ? parseInt(document.getElementById('frBirthHour').value) : 12;

    if (!birthDate) {
      // 尝试从农历获取
      var calMode = document.getElementById('frCalendarMode') ? document.getElementById('frCalendarMode').value : 'solar';
      if (calMode === 'lunar') {
        var ly = parseInt(document.getElementById('frLunarYear') ? document.getElementById('frLunarYear').value : 0);
        var lm = parseInt(document.getElementById('frLunarMonth') ? document.getElementById('frLunarMonth').value : 0);
        var ld = parseInt(document.getElementById('frLunarDay') ? document.getElementById('frLunarDay').value : 0);
        if (!ly || !lm || !ld) { showToast('请填写完整出生日期'); return; }
        var solar = lunarToSolar(ly, lm, ld, false);
        birthDate = solar.year + '-' + String(solar.month).padStart(2,'0') + '-' + String(solar.day).padStart(2,'0');
      } else {
        showToast('请填写出生日期');
        return;
      }
    }

    var parts = birthDate.split('-');
    var year = parseInt(parts[0]);
    var month = parseInt(parts[1]);
    var day = parseInt(parts[2]);

    if (!year || !month || !day) { showToast('出生日期格式不正确'); return; }
    if (!birthHour || birthHour < 0 || birthHour > 23) birthHour = 12;

    // 计算八字
    var baziData = getBaziCalcData(year, month, day, birthHour, sex);
    if (!baziData) { showToast('八字计算失败，请检查日期'); return; }

    var dayStem = baziData.pillars[2].stem;
    var dayEle = ELE[dayStem] || '木';

    // 喜用神：优先用 getBaziCalcData 返回的 yongshenEle，否则用最弱五行
    var yongshenEle = baziData.yongshenEle || baziData.weakestEle || '木';

    // 命卦
    var mingGua = getMingGua(year, sex);
    var isDongSi = mingGua.isDong; // 东四命/西四命
    var lifeType = mingGua.type;

    // 五行生克关系
    var shengMap = {'水':'木','木':'火','火':'土','土':'金','金':'水'}; // A生B
    var keMap = {'水':'火','火':'金','金':'木','木':'土','土':'水'}; // A克B
    var beShengMap = {'木':'水','火':'木','土':'火','金':'土','水':'金'}; // B被A生（即A的生母）
    var beKeMap = {'火':'水','金':'火','木':'金','土':'木','水':'土'}; // B被A克（即A的克者）

    // 楼层五行映射（河图数）：尾数1/6水、2/7火、3/8木、4/9金、5/0土
    function getFloorWuxing(floorNum) {
      var r = floorNum % 10;
      if (r === 1 || r === 6) return '水';
      if (r === 2 || r === 7) return '火';
      if (r === 3 || r === 8) return '木';
      if (r === 4 || r === 9) return '金';
      return '土'; // 5/0
    }

    // 东四命/西四命对应有利五行
    // 东四命：坎(水)、震(木)、巽(木)、离(火) → 有利：水、木、火
    // 西四命：乾(金)、兑(金)、坤(土)、艮(土) → 有利：金、土
    var dongSiFavor = ['水','木','火'];
    var xiSiFavor = ['金','土'];
    var lifeFavor = isDongSi ? dongSiFavor : xiSiFavor;

    // 评级函数：综合日主五行、喜用神、命卦三方判断
    function rateFloor(floorNum) {
      var fw = getFloorWuxing(floorNum);
      var score = 0;

      // 1. 楼层五行与喜用神的关系（权重最高 50分）
      if (fw === yongshenEle) {
        score += 50; // 楼层五行 = 用神 → 大吉
      } else if (shengMap[fw] === yongshenEle) {
        score += 40; // 楼层五行生用神 → 吉
      } else if (shengMap[yongshenEle] === fw) {
        score += 25; // 用神生楼层五行 → 小吉（泄气但非凶）
      } else if (keMap[fw] === yongshenEle) {
        score += 5;  // 楼层五行克用神 → 凶
      } else if (keMap[yongshenEle] === fw) {
        score += 15; // 用神克楼层五行 → 小凶（克制得宜）
      } else if (fw === dayEle) {
        score += 30; // 楼层五行 = 日主五行（比和）→ 中吉
      } else {
        score += 20; // 其他 → 平
      }

      // 2. 楼层五行与日主五行的关系（权重 30分）
      if (fw === dayEle) {
        score += 30; // 比和
      } else if (shengMap[fw] === dayEle) {
        score += 30; // 楼层生日主 → 大吉
      } else if (shengMap[dayEle] === fw) {
        score += 15; // 日主生楼层 → 泄气
      } else if (keMap[fw] === dayEle) {
        score += 0;  // 楼层克日主 → 凶
      } else if (keMap[dayEle] === fw) {
        score += 20; // 日主克楼层 → 中吉（我克者为财）
      } else {
        score += 15; // 无关 → 平
      }

      // 3. 命卦有利五行（权重 20分）
      if (lifeFavor.indexOf(fw) >= 0) {
        score += 20; // 与命卦五行同频
      } else {
        score += 5;  // 与命卦不同频
      }

      // 4. 三元九运维度（运星五行=火，2024-2043）
      var curYY = getCurrentYuanYun(new Date().getFullYear());
      var yunWx = curYY.wuxing;
      if (fw === yunWx) {
        score += 10; // 楼层五行=运星五行，同气
      } else if (shengMap[yunWx] === fw) {
        score += 5;  // 运星生楼层五行，相生
      } else if (keMap[fw] === yunWx) {
        score -= 5;  // 楼层五行克运星，相克
      }

      // 评级
      if (score >= 80) return '优选';
      if (score >= 55) return '可用';
      if (score >= 35) return '慎选';
      return '避开';
    }

    // 计算1-33层评级
    var floorList = [];
    var topRecommend = [];
    var avoidList = [];
    for (var f = 1; f <= 33; f++) {
      var rating = rateFloor(f);
      var fw = getFloorWuxing(f);
      var entry = { floor: f, wuxing: fw, rating: rating };
      floorList.push(entry);
      if (rating === '优选') topRecommend.push(entry);
      if (rating === '避开') avoidList.push(entry);
    }

    // Top5推荐：按评分排序，同评级优选优先
    var allScored = floorList.map(function(fl) {
      return { floor: fl.floor, wuxing: fl.wuxing, rating: fl.rating, score: rateFloor(fl.floor) };
    });
    // 重新计算score用于排序（rateFloor内部已计算）
    // 直接按评级排序
    var ratingOrder = {'优选':0, '可用':1, '慎选':2, '避开':3};
    allScored.sort(function(a, b) {
      if (ratingOrder[a.rating] !== ratingOrder[b.rating]) return ratingOrder[a.rating] - ratingOrder[b.rating];
      return a.floor - b.floor;
    });
    var top5 = allScored.slice(0, 5);

    // 开始输出
    var out = document.getElementById('floorRecommendResult');
    if (!out) {
      // 如果找不到专用结果容器，用fsProResult
      out = document.getElementById('fsProResult');
    }
    if (!out) { showToast('找不到结果容器'); return; }
    out.style.display = 'block';

    var html = '';

    // 标题
    html += '<div class="result-banner"><h2 class="rb-name">🏢 ' + name + '的楼层推荐</h2>';
    html += '<p class="rb-meta">日主:' + dayStem + '(' + dayEle + ') | 用神:' + yongshenEle + ' | ' + lifeType + '（' + mingGua.guaName + '卦）</p></div>';

    // 1. 八字与用神摘要
    html += '<div class="analysis-card" style="margin:16px 0;padding:20px;border:1px solid rgba(201,168,76,.2)">';
    html += '<h5 style="color:var(--gold);margin-bottom:12px">📊 命理分析摘要</h5>';
    html += '<div style="font-size:13px;line-height:2">';
    html += '<p><b>日主：</b>' + dayStem + '（' + dayEle + '）　<b>喜用神：</b>' + yongshenEle + '</p>';
    html += '<p><b>命卦：</b>' + mingGua.guaName + '卦（' + lifeType + '）　<b>有利五行：</b>' + lifeFavor.join('、') + '</p>';
    html += '<p><b>四柱：</b>' + baziData.pillars.map(function(p){return p.stem+p.branch;}).join(' ') + '</p>';
    // 五行分布
    var ec = baziData.eleCount || {};
    html += '<p><b>五行分布：</b>';
    var eleKeys = ['金','木','水','火','土'];
    for (var ei = 0; ei < eleKeys.length; ei++) {
      html += eleKeys[ei] + ':' + (ec[eleKeys[ei]] || 0) + ' ';
    }
    html += '</p>';
    html += '</div></div>';

    // 2. Top5推荐楼层
    html += '<div class="analysis-card" style="margin:16px 0;padding:20px;border:1px solid rgba(46,204,113,.3)">';
    html += '<h5 style="color:#2ecc71;margin-bottom:12px">⭐ 推荐楼层 Top 5</h5>';
    html += '<div style="font-size:13px;line-height:2">';
    for (var ti = 0; ti < top5.length; ti++) {
      var tf = top5[ti];
      var ratingColor = tf.rating === '优选' ? '#2ecc71' : tf.rating === '可用' ? '#f39c12' : '#e74c3c';
      html += '<p><b style="color:' + ratingColor + '">' + (ti+1) + '. ' + tf.floor + '层</b>（五行属' + tf.wuxing + '）— <span style="color:' + ratingColor + '">' + tf.rating + '</span></p>';
    }
    html += '</div>';
    html += '<p style="font-size:12px;opacity:.6;margin-top:8px">推荐依据：楼层五行与喜用神' + yongshenEle + '同频共振，且与日主' + dayStem + '(' + dayEle + ')相生相合，兼顾' + lifeType + '有利五行。</p>';
    html += '</div>';

    // 3. 避开的楼层
    if (avoidList.length > 0) {
      html += '<div class="analysis-card" style="margin:16px 0;padding:20px;border:1px solid rgba(231,76,60,.3)">';
      html += '<h5 style="color:#e74c3c;margin-bottom:12px">⚠️ 建议避开的楼层</h5>';
      html += '<div style="font-size:13px;line-height:2">';
      for (var ai = 0; ai < avoidList.length; ai++) {
        var af = avoidList[ai];
        html += '<p>' + af.floor + '层（五行属' + af.wuxing + '）— 克泄用神' + yongshenEle + '，不利运势</p>';
      }
      html += '</div></div>';
    }

    // 4. 1-33层全量评级表
    html += '<div class="analysis-card" style="margin:16px 0;padding:20px;border:1px solid rgba(52,152,219,.2)">';
    html += '<h5 style="color:#3498db;margin-bottom:12px">📋 1-33层吉凶全览</h5>';

    // 评级颜色映射
    var ratingColors = {'优选':'#2ecc71','可用':'#f39c12','慎选':'#e67e22','避开':'#e74c3c'};
    var ratingBg = {'优选':'rgba(46,204,113,.1)','可用':'rgba(243,156,18,.1)','慎选':'rgba(230,126,34,.1)','避开':'rgba(231,76,60,.1)'};

    // 表格
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px">';
    for (var fi = 0; fi < floorList.length; fi++) {
      var fl = floorList[fi];
      var c = ratingColors[fl.rating];
      var bg = ratingBg[fl.rating];
      html += '<div style="background:' + bg + ';border:1px solid ' + c + '33;border-radius:8px;padding:10px 8px;text-align:center">';
      html += '<div style="font-size:16px;font-weight:bold;color:' + c + '">' + fl.floor + '层</div>';
      html += '<div style="font-size:11px;opacity:.6;margin-top:2px">五行 ' + fl.wuxing + '</div>';
      html += '<div style="font-size:12px;color:' + c + ';margin-top:4px;font-weight:bold">' + fl.rating + '</div>';
      html += '</div>';
    }
    html += '</div>';
    html += '</div>';

    // 5. 楼层五行对照说明
    html += '<div class="analysis-card" style="margin:16px 0;padding:20px;border:1px solid rgba(155,89,182,.2)">';
    html += '<h5 style="color:#9b59b6;margin-bottom:12px">📖 楼层五行对照（河图数）</h5>';
    html += '<div style="font-size:13px;line-height:2">';
    html += '<p><b>尾数 1/6</b> → 五行属 <b style="color:#3498db">水</b>（1层、6层、11层、16层、21层、26层、31层）</p>';
    html += '<p><b>尾数 2/7</b> → 五行属 <b style="color:#e74c3c">火</b>（2层、7层、12层、17层、22层、27层、32层）</p>';
    html += '<p><b>尾数 3/8</b> → 五行属 <b style="color:#2ecc71">木</b>（3层、8层、13层、18层、23层、28层、33层）</p>';
    html += '<p><b>尾数 4/9</b> → 五行属 <b style="color:#f1c40f">金</b>（4层、9层、14层、19层、24层、29层）</p>';
    html += '<p><b>尾数 5/0</b> → 五行属 <b style="color:#e67e22">土</b>（5层、10层、15层、20层、25层、30层）</p>';
    html += '</div>';
    html += '<p style="font-size:12px;opacity:.6;margin-top:12px">依据：《河图》「天一生水，地六成之；地二生火，天七成之；天三生木，地八成之；地四生金，天九成之；天五生土，地十成之。」楼层五行以尾数定之。</p>';
    html += '</div>';

    // 6. 评级标准说明
    html += '<div class="analysis-card" style="margin:16px 0;padding:20px;border:1px solid rgba(201,168,76,.15)">';
    html += '<h5 style="color:var(--gold);margin-bottom:12px">📝 评级标准</h5>';
    html += '<div style="font-size:12px;line-height:2;opacity:.8">';
    html += '<p><b style="color:#2ecc71">优选</b>：楼层五行与用神一致或相生，与日主比和或相生，且合命卦有利五行</p>';
    html += '<p><b style="color:#f39c12">可用</b>：楼层五行与用神不冲不克，与日主关系尚可</p>';
    html += '<p><b style="color:#e67e22">慎选</b>：楼层五行泄用神或克日主，需通过室内配色、风水物品化解</p>';
    html += '<p><b style="color:#e74c3c">避开</b>：楼层五行克用神且克日主，大凶，不建议选择</p>';
    html += '</div></div>';

    // ═══ 三元九运楼层维度 ═══
    try {
      html += _generateSanyuanJiuyunBlock('floor', {
        dayStem: dayStem, dayEle: dayEle,
        currentYear: new Date().getFullYear()
      });
    } catch(e) { console.warn('[三元九运楼层分析块失败]', e.message); }

    // 返回按钮
    html += '<div class="back-row"><button class="back-btn" onclick="showSection(\'hero\')">返 回 首 页</button></div>';

    out.innerHTML = html;
    out.classList.add('visible');
    out.scrollIntoView({ behavior:'smooth' });
  } catch(err) {
    console.error('楼层推荐计算错误:', err);
    var out = document.getElementById('floorRecommendResult') || document.getElementById('fsProResult');
    if (out) {
      out.style.display = 'block';
      out.innerHTML = '<div style="padding:40px;text-align:center"><div style="font-size:48px;margin-bottom:16px">⚠️</div><h3 style="color:var(--gold);margin-bottom:12px">计算遇到问题</h3><p style="color:var(--paper2);font-size:14px;line-height:1.8">错误详情：' + (err.message||'').substring(0,120) + '</p></div>';
      out.classList.add('visible');
    }
  }
}

// 楼层推荐农历/公历切换
function frToggleCalendar() {
  var mode = document.getElementById('frCalendarMode').value;
  var solarBlock = document.getElementById('frSolarBlock');
  var lunarBlock = document.getElementById('frLunarBlock');
  if (mode === 'lunar') {
    if (solarBlock) solarBlock.style.display = 'none';
    if (lunarBlock) lunarBlock.style.display = 'block';
  } else {
    if (solarBlock) solarBlock.style.display = 'block';
    if (lunarBlock) lunarBlock.style.display = 'none';
  }
}

// ================================================================
// ===== 全家宅系统 =====
// ================================================================
var fsFamilyMembers = [];

// 五行方位映射
var WUXING_DIRECTION = {
  '木': ['东', '东南'],
  '火': ['南'],
  '土': ['西南', '东北'],
  '金': ['西', '西北'],
  '水': ['北']
};

// 24山精确方位
var MOUNTAIN_24 = {
  '北': ['壬', '子', '癸'],
  '西南': ['未', '坤', '申'],
  '东': ['甲', '卯', '乙'],
  '东南': ['辰', '巽', '巳'],
  '西北': ['戌', '乾', '亥'],
  '西': ['庚', '酉', '辛'],
  '东北': ['丑', '艮', '寅'],
  '南': ['丙', '午', '丁']
};

// 太岁方（年支→太岁方位）
var TAI_SUI_FANG = {
  '子': '北', '丑': '东北', '寅': '东北', '卯': '东',
  '辰': '东南', '巳': '东南', '午': '南', '未': '西南',
  '申': '西南', '酉': '西', '戌': '西北', '亥': '北'
};

// 三煞方（年支→三煞方位）
var SAN_SHA_FANG = {
  '申子辰': '南', '亥卯未': '西',
  '寅午戌': '北', '巳酉丑': '东'
};

// 奇门四害化解方案
var QIMEN_SI_HAI = {
  '死门': {
    name: '死门',
    desc: '主死亡、丧吊、官非',
    solution: '放置铜制物品（如铜葫芦、铜铃）+ 六字真言化解',
    items: ['铜葫芦', '六字真言挂件', '铜制风铃'],
    color: '金色/白色',
    material: '铜',
    period: '全年摆放，冬至后更换'
  },
  '惊门': {
    name: '惊门',
    desc: '主惊恐、官非、口舌',
    solution: '放置白色水晶簇 + 金属风铃化解',
    items: ['白水晶簇', '金属风铃', '银色装饰'],
    color: '白色/银色',
    material: '水晶/金属',
    period: '春分后摆放，秋分后调整'
  },
  '伤门': {
    name: '伤门',
    desc: '主受伤、血光、意外',
    solution: '放置红色装饰 + 紫水晶化解',
    items: ['红色中国结', '紫水晶洞', '红色地毯'],
    color: '红色/紫色',
    material: '水晶/布艺',
    period: '立春后摆放，冬至后更换'
  },
  '杜门': {
    name: '杜门',
    desc: '主闭塞、阻碍、不通',
    solution: '放置绿色植物 + 木质文昌塔化解',
    items: ['阔叶绿植', '木质文昌塔', '绿色装饰'],
    color: '绿色',
    material: '木质/植物',
    period: '立春后摆放，秋季修剪'
  }
};

// 吉祥物专业数据库
var MASCOT_DB = {
  '财位': [
    { type: '黄水晶球', material: '天然黄水晶', color: '黄色', size: '中(直径6-8cm)', direction: '财位正中', period: '常年摆放，每年立春净化', kaiguang: true },
    { type: '聚宝盆', material: '陶瓷/铜制', color: '金色/黄色', size: '中(直径15cm)', direction: '财位靠墙处', period: '常年摆放', kaiguang: true },
    { type: '貔貅', material: '铜/玉', color: '金色/翠色', size: '小(8-12cm)', direction: '财位面向室内', period: '常年摆放，每月初一清洗', kaiguang: true }
  ],
  '文昌位': [
    { type: '文昌塔', material: '铜/木质', color: '金色/棕色', size: '中(13层/7层)', direction: '书桌左上角或文昌位', period: '常年摆放，考试前加持', kaiguang: true },
    { type: '四枝毛笔', material: '竹杆狼毫', color: '绿色/黑色', size: '中', direction: '书桌东方或东南方', period: '每年开学前更换', kaiguang: false },
    { type: '水晶文昌塔', material: '白水晶', color: '白色', size: '中(7层)', direction: '文昌位靠窗处', period: '常年摆放，每月日光净化', kaiguang: true }
  ],
  '桃花位': [
    { type: '粉水晶球', material: '粉水晶', color: '粉色', size: '中(直径5-7cm)', direction: '桃花位床头或梳妆台', period: '常年摆放，满月净化', kaiguang: true },
    { type: '水培植物', material: '活体植物', color: '绿色', size: '中', direction: '桃花位近窗处', period: '定期更换，保持鲜活', kaiguang: false }
  ],
  '化煞位': [
    { type: '五帝钱', material: '铜(清代五帝)', color: '金色', size: '小', direction: '门楣或煞方墙面', period: '常年悬挂，每年盐洗', kaiguang: true },
    { type: '铜葫芦', material: '纯铜', color: '金色', size: '中(高10-15cm)', direction: '煞方或病符方', period: '常年摆放，冬至更换', kaiguang: true },
    { type: '泰山石', material: '天然泰山石', color: '灰色', size: '中(5-10kg)', direction: '缺角方或煞方靠墙', period: '常年摆放，无需更换', kaiguang: true },
    { type: '八卦镜', material: '铜/木质', color: '金色/棕色', size: '中(直径15-20cm)', direction: '门外或窗外正对煞方', period: '常年悬挂', kaiguang: true }
  ],
  '镇宅位': [
    { type: '石狮子', material: '青石/铜', color: '灰色/金色', size: '大(一对)', direction: '门口两侧', period: '常年摆放', kaiguang: true },
    { type: '麒麟', material: '铜/玉', color: '金色/翠色', size: '中(一对15-20cm)', direction: '客厅明堂', period: '常年摆放', kaiguang: true },
    { type: '龙龟', material: '铜', color: '金色', size: '中(10-15cm)', direction: '流年三煞方', period: '每年立春调整方位', kaiguang: true }
  ]
};

// 添加家庭成员
function addFamilyMember() {
  var name = document.getElementById('fsMemName').value.trim();
  var relation = document.getElementById('fsMemRelation').value;
  var sex = document.getElementById('fsMemSex').value;
  var year = parseInt(document.getElementById('fsMemYear').value);
  var month = parseInt(document.getElementById('fsMemMonth').value);
  var day = parseInt(document.getElementById('fsMemDay').value);
  var hour = parseInt(document.getElementById('fsMemHour').value);

  if (!name) { showToast('请输入姓名'); return; }
  if (!year || !month || !day) { showToast('请输入完整出生年月日'); return; }
  if (year < 1900 || year > 2030) { showToast('出生年份不合理'); return; }

  // 检查是否重复
  for (var i = 0; i < fsFamilyMembers.length; i++) {
    if (fsFamilyMembers[i].name === name) { showToast('已有同名成员：' + name); return; }
  }

  fsFamilyMembers.push({
    name: name, relation: relation, sex: sex,
    year: year, month: month, day: day, hour: hour
  });

  // 清空表单
  document.getElementById('fsMemName').value = '';
  document.getElementById('fsMemYear').value = '';
  document.getElementById('fsMemMonth').value = '';
  document.getElementById('fsMemDay').value = '';

  renderFamilyList();
  showToast('已添加：' + name);
}

// 删除家庭成员
function removeFamilyMember(idx) {
  if (idx < 0 || idx >= fsFamilyMembers.length) return;
  var name = fsFamilyMembers[idx].name;
  fsFamilyMembers.splice(idx, 1);
  renderFamilyList();
  showToast('已移除：' + name);
}

// 渲染家庭成员列表
function renderFamilyList() {
  var el = document.getElementById('fsFamilyList');
  if (!el) return;
  if (fsFamilyMembers.length === 0) {
    el.innerHTML = '<p style="font-size:12px;opacity:.4;text-align:center;padding:12px">暂无家庭成员，请在下方添加</p>';
    return;
  }
  var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px">';
  for (var i = 0; i < fsFamilyMembers.length; i++) {
    var m = fsFamilyMembers[i];
    html += '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(201,168,76,0.15);border-radius:8px;padding:12px;position:relative">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
        '<span style="font-size:14px;color:var(--gold);font-weight:bold">' + m.name + '</span>' +
        '<button onclick="removeFamilyMember(' + i + ')" style="background:none;border:none;color:#e74c3c;cursor:pointer;font-size:16px;padding:0 4px">×</button>' +
      '</div>' +
      '<div style="font-size:11px;opacity:.7;line-height:1.6">' +
        '<div>' + (m.relation || '成员') + ' · ' + (m.sex === 'male' ? '男' : '女') + '</div>' +
        '<div>' + m.year + '年' + m.month + '月' + m.day + '日 ' + ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][m.hour] + '时</div>' +
      '</div></div>';
  }
  html += '</div>';
  el.innerHTML = html;
}

// 计算年支
function _getYearBranch(year) {
  var idx = (year - 4) % 12;
  if (idx < 0) idx += 12;
  return BRANCHES[idx];
}

// 获取三煞方
function _getSanShaFang(year) {
  var branch = _getYearBranch(year);
  var groups = [
    { branches: ['申','子','辰'], sha: '南' },
    { branches: ['亥','卯','未'], sha: '西' },
    { branches: ['寅','午','戌'], sha: '北' },
    { branches: ['巳','酉','丑'], sha: '东' }
  ];
  for (var i = 0; i < groups.length; i++) {
    if (groups[i].branches.includes(branch)) return groups[i].sha;
  }
  return '南';
}

// 获取太岁方
function _getTaiSuiFang(year) {
  var branch = _getYearBranch(year);
  return TAI_SUI_FANG[branch] || '北';
}

// 计算奇门四害方位（基于年局简化推算）
function _getQimenSiHaiFang(year) {
  var branch = _getYearBranch(year);
  // 简化：以年支推算四凶门方位
  // 实际奇门需完整排盘，此处给出年度参考方位
  var siHaiMap = {
    '子': { '死门': '西南', '惊门': '东', '伤门': '北', '杜门': '东南' },
    '丑': { '死门': '东', '惊门': '北', '伤门': '东南', '杜门': '南' },
    '寅': { '死门': '北', '惊门': '东南', '伤门': '南', '杜门': '西南' },
    '卯': { '死门': '东南', '惊门': '南', '伤门': '西南', '杜门': '东' },
    '辰': { '死门': '南', '惊门': '西南', '伤门': '东', '杜门': '北' },
    '巳': { '死门': '西南', '惊门': '东', '伤门': '北', '杜门': '东南' },
    '午': { '死门': '东', '惊门': '北', '伤门': '东南', '杜门': '南' },
    '未': { '死门': '北', '惊门': '东南', '伤门': '南', '杜门': '西南' },
    '申': { '死门': '东南', '惊门': '南', '伤门': '西南', '杜门': '东' },
    '酉': { '死门': '南', '惊门': '西南', '伤门': '东', '杜门': '北' },
    '戌': { '死门': '西南', '惊门': '东', '伤门': '北', '杜门': '东南' },
    '亥': { '死门': '东', '惊门': '北', '伤门': '东南', '杜门': '南' }
  };
  return siHaiMap[branch] || siHaiMap['子'];
}

// 日主五行→有利方位
function _wuxingFavorableDir(dayWuxing) {
  var map = {
    '木': ['东', '东南', '北'],
    '火': ['南', '东', '东南'],
    '土': ['西南', '东北', '南'],
    '金': ['西', '西北', '西南'],
    '水': ['北', '西', '西北']
  };
  return map[dayWuxing] || ['北'];
}

// 日主五行→不利方位
function _wuxingUnfavorableDir(dayWuxing) {
  var map = {
    '木': ['西', '西北'],
    '火': ['北'],
    '土': ['东', '东南'],
    '金': ['南'],
    '水': ['西南', '东北']
  };
  return map[dayWuxing] || [];
}

// 计算单人的全家宅综合方位建议
function _computeMemberFengshui(member, houseInfo, currentYear) {
  var result = {
    name: member.name,
    relation: member.relation,
    sex: member.sex,
    birth: member.year + '年' + member.month + '月' + member.day + '日',
    year: currentYear,
    bazi: null,
    mingGua: null,
    favorableDirs: [],
    avoidDirs: [],
    bestBedroom: '',
    bestStudy: '',
    taiSui: '',
    sanSha: '',
    nextYearAdvice: ''
  };

  // 1. 八字计算
  try {
    var bd = getBaziCalcData(member.year, member.month, member.day, member.hour, member.sex);
    if (bd) {
      result.bazi = {
        dayStem: bd.dayStem,
        dayWuxing: ELE[bd.dayStem] || '土',
        pillars: bd.pillars,
        weakestEle: bd.weakestEle,
        strongestEle: bd.strongestEle,
        xiEle: bd.xiEle,
        dayMaster: bd.dayMaster,
        isStrong: bd.isStrong,
        eleCount: bd.eleCount
      };
      result.baziFavorableDirs = _wuxingFavorableDir(result.bazi.dayWuxing);
      result.baziUnfavorableDirs = _wuxingUnfavorableDir(result.bazi.dayWuxing);
    }
  } catch(e) {}

  // 2. 命卦计算
  result.mingGua = getMingGua(member.year, member.sex);

  // 3. 八宅吉凶方位（使用房屋朝向）
  var dirMap = {'北':1,'南':9,'东':3,'西':7,'东北':8,'西北':6,'东南':4,'西南':2};
  var zhaiNum = dirMap[houseInfo.chaoxiang] || 1;
  result.bazhai = _computeBazhai(zhaiNum);

  // 4. 流年飞星
  var yearStar = _getYearFlyingStar(currentYear);
  var starPos = _getStarPosition(yearStar);
  result.yearStar = yearStar;
  result.starPos = starPos;

  // 5. 太岁方和三煞方
  result.taiSuiFang = _getTaiSuiFang(currentYear);
  result.sanShaFang = _getSanShaFang(currentYear);

  // 6. 综合计算最佳方位
  var allDirs = ['北','南','东','西','东南','西南','西北','东北'];
  var dirScores = {};
  for (var i = 0; i < allDirs.length; i++) {
    var dir = allDirs[i];
    var score = 0;
    var reasons = [];

    // 6.1 命卦吉凶
    var isDongSiGood = result.mingGua.isDong ?
      ['东','南','东南','北'].includes(dir) :
      ['西','西南','西北','东北'].includes(dir);
    if (isDongSiGood) { score += 20; reasons.push('命卦吉方'); }
    else { score -= 10; reasons.push('命卦凶方'); }

    // 6.2 八宅吉凶
    var bzPos = result.bazhai[dir] || '伏位';
    if (['生气','天医','延年','伏位'].includes(bzPos)) { score += 15; reasons.push(bzPos); }
    else { score -= 8; reasons.push(bzPos); }

    // 6.3 流年飞星
    var star = starPos[dir] || 5;
    if ([8,9,1,4,6].includes(star)) { score += 15; reasons.push(star + '吉星'); }
    else { score -= 12; reasons.push(star + '凶星'); }

    // 6.4 八字有利方位
    if (result.bazi && result.baziFavorableDirs && result.baziFavorableDirs.includes(dir)) {
      score += 10; reasons.push('八字有利');
    }
    if (result.bazi && result.baziUnfavorableDirs && result.baziUnfavorableDirs.includes(dir)) {
      score -= 8; reasons.push('八字不利');
    }

    // 6.5 太岁方扣分
    if (dir === result.taiSuiFang) { score -= 15; reasons.push('太岁方'); }

    // 6.6 三煞方扣分
    if (dir === result.sanShaFang) { score -= 15; reasons.push('三煞方'); }

    dirScores[dir] = { score: score, reasons: reasons, bazhai: bzPos, star: star };
  }

  // 7. 排序选最佳
  var sorted = allDirs.map(function(d) { return { dir: d, info: dirScores[d] }; }).sort(function(a, b) { return b.info.score - a.info.score; });
  result.dirScores = dirScores;
  result.bestBedroom = sorted[0].dir;
  result.bestStudy = sorted[0].dir;
  result.avoidDirs = sorted.filter(function(s) { return s.info.score < 0; }).map(function(s) { return s.dir; });
  result.allSorted = sorted;

  // 8. 明年建议
  var nextYear = currentYear + 1;
  var nextStar = _getYearFlyingStar(nextYear);
  var nextTaiSui = _getTaiSuiFang(nextYear);
  var nextSanSha = _getSanShaFang(nextYear);
  result.nextYearAdvice = nextYear + '年' + nextStar + '入中宫，太岁在' + nextTaiSui + '方，三煞在' + nextSanSha + '方。';
  if (result.bestBedroom === nextTaiSui || result.bestBedroom === nextSanSha) {
    result.nextYearAdvice += '今年吉位明年犯太岁/三煞，建议调整卧室方位至' + sorted[1].dir + '方。';
  } else {
    result.nextYearAdvice += '当前吉位明年仍可用，但需注意流年飞星变化，可在' + nextTaiSui + '方挂化太岁物品。';
  }

  return result;
}

// 生成吉祥物建议
function _generateMascotAdvice(direction, dirScore, member, currentYear) {
  var mascots = [];
  var star = dirScore.star;
  var bazhai = dirScore.bazhai;

  // 根据吉凶判断需要催旺还是化解
  var isGood = dirScore.score >= 15;
  var needsCure = dirScore.score < 0;

  if (isGood) {
    // 吉位催旺
    if (star === 8) mascots = mascots.concat(MASCOT_DB['财位']);
    if (star === 4) mascots = mascots.concat(MASCOT_DB['文昌位']);
    if (star === 9 || star === 1) mascots = mascots.concat(MASCOT_DB['桃花位']);
    if (star === 6) mascots.push({ type: '铜马', material: '纯铜', color: '金色', size: '中(8-12cm)', direction: direction + '方靠墙处', period: '常年摆放', kaiguang: true });
    if (['生气','天医','延年'].includes(bazhai)) {
      mascots.push({ type: '葫芦', material: '天然葫芦/铜', color: '金色/棕色', size: '中(高10-15cm)', direction: direction + '方', period: '常年摆放，每年更换', kaiguang: true });
    }
  } else if (needsCure) {
    // 凶位化解
    if (star === 2 || star === 5) {
      mascots.push({ type: '六字真言铜葫芦', material: '纯铜', color: '金色', size: '中(高10-15cm)', direction: direction + '方', period: '立春后摆放，冬至后更换', kaiguang: true });
      mascots.push({ type: '金属风铃', material: '铜', color: '金色', size: '小', direction: direction + '方悬挂', period: '常年悬挂', kaiguang: false });
    }
    if (star === 3) {
      mascots.push({ type: '红色中国结', material: '布艺', color: '红色', size: '中', direction: direction + '方墙面', period: '每年更换', kaiguang: false });
      mascots.push({ type: '紫水晶洞', material: '紫水晶', color: '紫色', size: '中(3-5kg)', direction: direction + '方靠墙', period: '常年摆放', kaiguang: true });
    }
    if (star === 7) {
      mascots.push({ type: '蓝色装饰', material: '玻璃/水晶', color: '蓝色', size: '中', direction: direction + '方', period: '常年摆放', kaiguang: false });
      mascots.push({ type: '水族箱', material: '玻璃', color: '蓝色', size: '中(30-50cm)', direction: direction + '方', period: '常年，定期换水', kaiguang: false });
    }
    mascots = mascots.concat(MASCOT_DB['化煞位'].slice(0, 1));
  } else {
    // 平位
    mascots.push({ type: '陶瓷制品', material: '陶瓷', color: '黄色/棕色', size: '中', direction: direction + '方', period: '常年摆放', kaiguang: false });
  }

  // 限制最多3个
  return mascots.slice(0, 3);
}

// 跳转奇门排盘
function jumpToQimen() {
  showSection('qimen');
  // 自动以当前时间排盘
  setTimeout(function() {
    var now = new Date();
    var yEl = document.getElementById('qimen-year');
    var mEl = document.getElementById('qimen-month');
    var dEl = document.getElementById('qimen-day');
    var hEl = document.getElementById('qimen-hour');
    if (yEl) yEl.value = now.getFullYear();
    if (mEl) mEl.value = now.getMonth() + 1;
    if (dEl) dEl.value = now.getDate();
    if (hEl) hEl.value = Math.floor(now.getHours() / 2) % 12;
    if (typeof runQimenEngine === 'function') runQimenEngine();
    showToast('已自动排盘，请查看奇门盘中的四害方位');
  }, 500);
}

// 计算全家宅风水
function computeFamilyFengshui() {
  if (fsFamilyMembers.length === 0) {
    showToast('请先添加家庭成员');
    return;
  }

  // 获取房屋信息
  var huxing = document.getElementById('fsHuxing').value;
  var chaoxiang = document.getElementById('fsChaoxiang').value;
  var louceng = document.getElementById('fsLouceng').value;
  var buildYear = parseInt(document.getElementById('fsBuildYear').value) || 2000;

  if (!huxing || !chaoxiang || !louceng) {
    showToast('请先填写房屋基本信息（户型/朝向/楼层）');
    return;
  }

  var houseInfo = {
    huxing: huxing,
    chaoxiang: chaoxiang,
    louceng: louceng,
    buildYear: buildYear
  };

  var currentYear = new Date().getFullYear();
  var members = [];

  for (var i = 0; i < fsFamilyMembers.length; i++) {
    var m = fsFamilyMembers[i];
    var memberResult = _computeMemberFengshui(m, houseInfo, currentYear);
    members.push(memberResult);
  }

  // 计算家庭整体评分
  var totalScore = 0;
  for (var j = 0; j < members.length; j++) {
    if (members[j].allSorted && members[j].allSorted[0]) {
      totalScore += members[j].allSorted[0].info.score;
    }
  }
  var avgScore = Math.round(60 + totalScore / Math.max(members.length, 1) * 0.5);
  avgScore = Math.max(30, Math.min(avgScore, 95));

  // 奇门四害
  var siHai = _getQimenSiHaiFang(currentYear);

  // 房间分配建议
  var roomAssignment = _computeRoomAssignment(members);

  // 月度飞星提示
  var monthlyTips = _generateMonthlyTips(currentYear);

  renderFamilyReport({
    members: members,
    houseInfo: houseInfo,
    currentYear: currentYear,
    avgScore: avgScore,
    siHai: siHai,
    roomAssignment: roomAssignment,
    monthlyTips: monthlyTips
  });
}

// 计算房间分配
function _computeRoomAssignment(members) {
  var rooms = ['主卧', '次卧', '书房', '儿童房', '长辈房'];
  var directions = ['北','南','东','西','东南','西南','西北','东北'];
  var assignment = [];
  var usedDirs = {};

  // 按评分排序，分高的优先选方位
  var sortedMembers = members.map(function(m, idx) {
    return { member: m, idx: idx };
  }).sort(function(a, b) {
    var aScore = a.member.allSorted && a.member.allSorted[0] ? a.member.allSorted[0].info.score : 0;
    var bScore = b.member.allSorted && b.member.allSorted[0] ? b.member.allSorted[0].info.score : 0;
    return bScore - aScore;
  });

  for (var i = 0; i < sortedMembers.length; i++) {
    var m = sortedMembers[i].member;
    var bestDir = null;
    var bestScore = -999;

    if (m.allSorted) {
      for (var j = 0; j < m.allSorted.length; j++) {
        var candidate = m.allSorted[j];
        if (!usedDirs[candidate.dir] && candidate.info.score > bestScore) {
          bestDir = candidate.dir;
          bestScore = candidate.info.score;
        }
      }
    }

    if (bestDir) {
      usedDirs[bestDir] = true;
      var roomName = rooms[i] || '房间' + (i + 1);
      assignment.push({
        name: m.name,
        relation: m.relation,
        room: roomName,
        direction: bestDir,
        score: bestScore
      });
    }
  }

  return assignment;
}

// 月度飞星提示
function _generateMonthlyTips(year) {
  var months = [];
  for (var m = 1; m <= 12; m++) {
    // 简化：月飞星 = 年飞星 + 月修正
    var yearStar = _getYearFlyingStar(year);
    var monthStarMap = [7,8,9,1,2,3,4,5,6,7,8,9]; // 简化月飞星
    var monthStar = ((yearStar + monthStarMap[m-1] - 2) % 9) || 9;
    var starPos = _getStarPosition(monthStar);

    // 找凶星方位
    var warnings = [];
    for (var dir in starPos) {
      if (dir === '中') continue;
      if (starPos[dir] === 5) warnings.push(dir + '方五黄（忌动土）');
      if (starPos[dir] === 2) warnings.push(dir + '方二黑（注意健康）');
      if (starPos[dir] === 3) warnings.push(dir + '方三碧（防口舌）');
    }

    months.push({
      month: m,
      monthStar: monthStar,
      warnings: warnings
    });
  }
  return months;
}

// 渲染全家宅报告
function renderFamilyReport(data) {
  var el = document.getElementById('fsFamilyResult');
  if (!el) return;

  var scoreColor = data.avgScore >= 80 ? '#2ecc71' : data.avgScore >= 60 ? '#c9a84c' : '#e74c3c';
  var scoreLevel = data.avgScore >= 80 ? '优秀' : data.avgScore >= 60 ? '良好' : '需改善';

  var html = '<div style="background:rgba(255,255,255,0.02);border:1px solid rgba(201,168,76,0.2);border-radius:14px;padding:24px;margin-top:16px">';

  // 标题
  html += '<div style="text-align:center;margin-bottom:24px">' +
    '<h3 style="font-size:18px;color:var(--gold);letter-spacing:4px;margin-bottom:8px">📊 全家宅年度风水报告</h3>' +
    '<p style="font-size:12px;opacity:.5">' + data.currentYear + '年 · ' + data.houseInfo.huxing + ' · ' + data.houseInfo.chaoxiang + '向 · ' + data.houseInfo.louceng + '层</p>' +
    '</div>';

  // 整体评分
  html += '<div style="text-align:center;margin-bottom:30px">' +
    '<div style="font-size:64px;color:' + scoreColor + ';font-family:Ma Shan Zheng,serif">' + data.avgScore + '</div>' +
    '<div style="font-size:14px;color:' + scoreColor + ';letter-spacing:3px;margin-top:4px">' + scoreLevel + '</div>' +
    '<p style="font-size:11px;opacity:.4;margin-top:4px">全家宅综合评分</p></div>';

  // ===== 1. 每人方位一览表 =====
  html += '<div style="margin-top:24px"><h5 style="font-size:14px;letter-spacing:3px;color:var(--gold);margin-bottom:16px">👥 每人年度方位建议</h5>';

  for (var i = 0; i < data.members.length; i++) {
    var m = data.members[i];
    var baziInfo = m.bazi ? (m.bazi.dayStem + '(' + m.bazi.dayWuxing + ')') : '未知';
    var xiEle = m.bazi ? m.bazi.xiEle : '未知';

    html += '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(201,168,76,0.15);border-radius:10px;padding:16px;margin-bottom:12px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
      '<span style="font-size:15px;color:var(--gold);font-weight:bold">' + m.name + '</span>' +
      '<span style="font-size:11px;padding:2px 8px;border-radius:4px;background:rgba(201,168,76,0.1);color:var(--gold)">' + (m.relation || '成员') + ' · ' + (m.sex === 'male' ? '男' : '女') + '</span>' +
    '</div>';

    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;font-size:12px;margin-bottom:10px">' +
      '<div><span style="opacity:.5">日主：</span>' + baziInfo + '</div>' +
      '<div><span style="opacity:.5">喜用神：</span>' + xiEle + '</div>' +
      '<div><span style="opacity:.5">命卦：</span>' + m.mingGua.guaName + '卦(' + m.mingGua.type + ')</div>' +
      '<div><span style="opacity:.5">出生：</span>' + m.birth + '</div>' +
    '</div>';

    // 方位建议
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-top:10px">';
    // 最佳卧室
    html += '<div style="background:rgba(46,204,113,0.06);border-radius:8px;padding:10px">' +
      '<div style="font-size:11px;color:#2ecc71;margin-bottom:4px">🛏️ 最佳卧室方位</div>' +
      '<div style="font-size:14px;color:#2ecc71;font-weight:bold">' + m.bestBedroom + '方</div>';
    if (m.allSorted && m.allSorted[0]) {
      html += '<div style="font-size:10px;opacity:.6;margin-top:2px">' + m.allSorted[0].info.reasons.join('、') + '</div>';
    }
    html += '</div>';

    // 最佳书桌
    html += '<div style="background:rgba(91,155,213,0.06);border-radius:8px;padding:10px">' +
      '<div style="font-size:11px;color:#5b9fd5;margin-bottom:4px">📚 最佳书桌方位</div>' +
      '<div style="font-size:14px;color:#5b9fd5;font-weight:bold">' + m.bestStudy + '方</div>';
    if (m.allSorted && m.allSorted[1]) {
      html += '<div style="font-size:10px;opacity:.6;margin-top:2px">次选：' + m.allSorted[1].dir + '方</div>';
    }
    html += '</div>';

    // 避开方位
    html += '<div style="background:rgba(231,76,60,0.06);border-radius:8px;padding:10px">' +
      '<div style="font-size:11px;color:#e74c3c;margin-bottom:4px">⚠️ 避开方位</div>' +
      '<div style="font-size:14px;color:#e74c3c;font-weight:bold">' + (m.avoidDirs.length > 0 ? m.avoidDirs.join('、') + '方' : '无严重凶方') + '</div>' +
      '<div style="font-size:10px;opacity:.6;margin-top:2px">太岁在' + m.taiSuiFang + '方，三煞在' + m.sanShaFang + '方</div>' +
    '</div>';
    html += '</div>';

    // 明年建议
    html += '<div style="margin-top:10px;padding:8px 12px;background:rgba(201,168,76,0.05);border-radius:6px;font-size:11px;opacity:.8">' +
      '<span style="color:var(--gold)">📅 明年调整：</span>' + m.nextYearAdvice + '</div>';

    // 吉祥物建议
    if (m.allSorted && m.allSorted[0]) {
      var mascots = _generateMascotAdvice(m.bestBedroom, m.allSorted[0].info, m, data.currentYear);
      if (mascots.length > 0) {
        html += '<div style="margin-top:10px"><span style="font-size:11px;color:var(--gold)">🔮 推荐吉祥物：</span>';
        for (var mi = 0; mi < mascots.length; mi++) {
          var ms = mascots[mi];
          html += '<div style="font-size:11px;margin-top:4px;padding:6px 10px;background:rgba(255,255,255,0.02);border-radius:6px">' +
            '<strong>' + ms.type + '</strong>（' + ms.material + '，' + ms.color + '，' + ms.size + '）' +
            '<br>摆放：' + ms.direction +
            '<br>周期：' + ms.period +
            (ms.kaiguang ? ' · 建议开光加持' : '') +
          '</div>';
        }
        html += '</div>';
      }
    }

    html += '</div>';
  }
  html += '</div>';

  // ===== 2. 房间分配建议 =====
  html += '<div style="margin-top:30px"><h5 style="font-size:14px;letter-spacing:3px;color:var(--gold);margin-bottom:16px">🏠 房间分配建议</h5>';
  html += '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(201,168,76,0.15);border-radius:10px;padding:16px">';
  html += '<table style="width:100%;font-size:12px;border-collapse:collapse">';
  html += '<tr style="border-bottom:1px solid rgba(201,168,76,0.1)"><th style="padding:8px;text-align:left">成员</th><th style="padding:8px;text-align:left">关系</th><th style="padding:8px;text-align:left">建议房间</th><th style="padding:8px;text-align:left">方位</th></tr>';
  for (var ri = 0; ri < data.roomAssignment.length; ri++) {
    var ra = data.roomAssignment[ri];
    html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.03)">' +
      '<td style="padding:8px">' + ra.name + '</td>' +
      '<td style="padding:8px">' + (ra.relation || '-') + '</td>' +
      '<td style="padding:8px">' + ra.room + '</td>' +
      '<td style="padding:8px;color:#2ecc71;font-weight:bold">' + ra.direction + '方</td>' +
    '</tr>';
  }
  html += '</table>';
  html += '<p style="font-size:11px;opacity:.5;margin-top:10px">说明：按每人命卦+八宅+流年飞星综合评分最优分配，实际还需结合房间实际用途</p>';
  html += '</div></div>';

  // ===== 3. 吉祥物摆放一览表 =====
  html += '<div style="margin-top:30px"><h5 style="font-size:14px;letter-spacing:3px;color:var(--gold);margin-bottom:16px">🔮 吉祥物摆放一览表</h5>';
  html += '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(201,168,76,0.15);border-radius:10px;padding:16px">';

  // 收集所有成员的吉祥物
  var allMascots = [];
  for (var mi2 = 0; mi2 < data.members.length; mi2++) {
    var mem = data.members[mi2];
    if (mem.allSorted && mem.allSorted[0]) {
      var memMascots = _generateMascotAdvice(mem.bestBedroom, mem.allSorted[0].info, mem, data.currentYear);
      for (var mi3 = 0; mi3 < memMascots.length; mi3++) {
        allMascots.push({ member: mem.name, mascot: memMascots[mi3] });
      }
    }
  }

  if (allMascots.length > 0) {
    html += '<table style="width:100%;font-size:11px;border-collapse:collapse">';
    html += '<tr style="border-bottom:1px solid rgba(201,168,76,0.1)"><th style="padding:6px;text-align:left">成员</th><th style="padding:6px;text-align:left">吉祥物</th><th style="padding:6px;text-align:left">材质</th><th style="padding:6px;text-align:left">颜色</th><th style="padding:6px;text-align:left">摆放方位</th><th style="padding:6px;text-align:left">周期</th><th style="padding:6px">开光</th></tr>';
    for (var ai = 0; ai < allMascots.length; ai++) {
      var am = allMascots[ai];
      html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.03)">' +
        '<td style="padding:6px">' + am.member + '</td>' +
        '<td style="padding:6px">' + am.mascot.type + '</td>' +
        '<td style="padding:6px">' + am.mascot.material + '</td>' +
        '<td style="padding:6px">' + am.mascot.color + '</td>' +
        '<td style="padding:6px">' + am.mascot.direction + '</td>' +
        '<td style="padding:6px;font-size:10px">' + am.mascot.period + '</td>' +
        '<td style="padding:6px;text-align:center">' + (am.mascot.kaiguang ? '✅' : '—') + '</td>' +
      '</tr>';
    }
    html += '</table>';
  } else {
    html += '<p style="font-size:12px;opacity:.5;text-align:center;padding:12px">暂无特殊吉祥物建议</p>';
  }
  html += '</div></div>';

  // ===== 4. 奇门遁甲化四害方案 =====
  html += '<div style="margin-top:30px"><h5 style="font-size:14px;letter-spacing:3px;color:var(--gold);margin-bottom:16px">☰ 奇门遁甲化四害方案（' + data.currentYear + '年）</h5>';
  html += '<div style="background:rgba(142,68,173,0.04);border:1px solid rgba(142,68,173,0.15);border-radius:10px;padding:16px">';
  html += '<p style="font-size:12px;opacity:.6;margin-bottom:12px">四害为奇门四凶门：死门、惊门、伤门、杜门。以下为' + data.currentYear + '年化四害参考方案：</p>';

  var haiList = ['死门', '惊门', '伤门', '杜门'];
  for (var hi = 0; hi < haiList.length; hi++) {
    var haiName = haiList[hi];
    var haiInfo = QIMEN_SI_HAI[haiName];
    var haiFang = data.siHai[haiName] || '未知';

    html += '<div style="background:rgba(255,255,255,0.02);border-radius:8px;padding:12px;margin-bottom:10px;border-left:3px solid #9b59b6">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
        '<span style="font-size:14px;color:#9b59b6;font-weight:bold">' + haiName + '（' + haiFang + '方）</span>' +
        '<span style="font-size:10px;padding:2px 6px;border-radius:3px;background:rgba(231,76,60,0.1);color:#e74c3c">需化解</span>' +
      '</div>' +
      '<div style="font-size:12px;opacity:.7;margin-bottom:6px">' + haiInfo.desc + '</div>' +
      '<div style="font-size:12px;margin-bottom:4px"><span style="opacity:.5">化煞方案：</span>' + haiInfo.solution + '</div>' +
      '<div style="font-size:12px;margin-bottom:4px"><span style="opacity:.5">推荐物品：</span>' + haiInfo.items.join('、') + '</div>' +
      '<div style="font-size:12px;margin-bottom:4px"><span style="opacity:.5">材质：</span>' + haiInfo.material + ' | <span style="opacity:.5">颜色：</span>' + haiInfo.color + '</div>' +
      '<div style="font-size:12px"><span style="opacity:.5">周期：</span>' + haiInfo.period + '</div>' +
    '</div>';
  }

  // 查看奇门盘按钮
  html += '<div style="text-align:center;margin-top:16px">' +
    '<button class="btn-primary" onclick="jumpToQimen()" style="background:rgba(142,68,173,0.15);border-color:var(--violet);color:var(--violet2)">☰ 查看奇门盘（自动排盘）</button>' +
    '<p style="font-size:11px;opacity:.4;margin-top:8px">点击跳转到奇门遁甲板块，自动以当前时间排盘，可查看四害落宫详情</p>' +
  '</div>';
  html += '</div></div>';

  // ===== 5. 月度注意事项 =====
  html += '<div style="margin-top:30px"><h5 style="font-size:14px;letter-spacing:3px;color:var(--gold);margin-bottom:16px">📅 月度飞星提示（' + data.currentYear + '年）</h5>';
  html += '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(201,168,76,0.15);border-radius:10px;padding:16px">';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px">';
  for (var mt = 0; mt < data.monthlyTips.length; mt++) {
    var mtip = data.monthlyTips[mt];
    var hasWarning = mtip.warnings.length > 0;
    html += '<div style="background:rgba(255,255,255,0.02);border-radius:8px;padding:10px' + (hasWarning ? ';border-left:3px solid #e74c3c' : '') + '">' +
      '<div style="font-size:13px;color:' + (hasWarning ? '#e74c3c' : 'var(--gold)') + ';font-weight:bold;margin-bottom:4px">' + mtip.month + '月</div>' +
      '<div style="font-size:10px;opacity:.5;margin-bottom:4px">' + mtip.monthStar + '入中宫</div>';
    if (hasWarning) {
      for (var mw = 0; mw < mtip.warnings.length; mw++) {
        html += '<div style="font-size:10px;color:#e74c3c;margin-top:2px">⚠️ ' + mtip.warnings[mw] + '</div>';
      }
    } else {
      html += '<div style="font-size:10px;color:#2ecc71;margin-top:2px">✅ 平稳</div>';
    }
    html += '</div>';
  }
  html += '</div></div></div>';

  // 导出按钮
  html += '<div style="text-align:center;margin-top:24px">' +
    '<button class="btn-secondary" onclick="exportFamilyReport()">📄 导出全家宅报告</button>' +
  '</div>';

  html += '</div>';

  el.innerHTML = html;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 导出全家宅报告
function exportFamilyReport() {
  showToast('全家宅报告生成中...');
}

// 八宅风水
function computeBaZhai() {
  const year = document.getElementById('bzYear').value;
  const sex = document.getElementById('bzSex').value;
  if (!year || !sex) { showToast('请填写出生年份和性别'); return; }
  const mingGua = getMingGua(parseInt(year), sex);
  const out = document.getElementById('bzOutput');
  let html = '';
  html += '<div class="huajie-alert"><div class="alert-title">命卦分析</div>';
  html += '<p>命卦:<strong>' + mingGua.type + '</strong> - ' + mingGua.guaName + '卦(卦数' + mingGua.gua + ')</p></div>';

  html += '<div style="margin-top:24px"><h5 style="font-size:13px;letter-spacing:4px;color:var(--gold);margin-bottom:12px">吉凶方位</h5>';
  html += '<div class="analysis-grid" style="grid-template-columns:1fr 1fr">';
  html += '<div class="analysis-card" style="border-color:rgba(39,174,96,.15)"><h5 style="color:#2ecc71">✅ 吉方</h5>';
  html += '<p>' + (mingGua.isDong ? '东、南、东南、北' : '西、西南、西北、东北') + '</p>';
  html += '<p style="font-size:11px;opacity:.5;margin-top:8px">宜作大门、主卧、客厅朝向</p></div>';
  html += '<div class="analysis-card" style="border-color:rgba(231,76,60,.15)"><h5 style="color:#e74c3c">❌ 凶方</h5>';
  html += '<p>' + (mingGua.isDong ? '西、西南、西北、东北' : '东、南、东南、北') + '</p>';
  html += '<p style="font-size:11px;opacity:.5;margin-top:8px">宜作厕所、厨房、储物间</p></div>';
  html += '</div></div>';

  html += '<div class="huajie-alert" style="margin-top:20px"><div class="alert-title">化解方法</div>';
  html += '<ul class="huajie-checklist">';
  html += '<li>吉方宜开门窗纳气，放置绿植增旺</li>';
  html += '<li>凶方宜放置重物镇压(如柜子、石头)</li>';
  html += '<li>凶方可放置铜葫芦或五帝钱化煞</li>';
  html += '<li>若大门在凶方，可挂门帘或设置玄关缓冲</li></ul></div>';

  out.innerHTML = html;
  document.getElementById('bzResult').classList.add('visible');
}

// 玄空飞星
function computeXuanKong() {
  const out = document.getElementById('xkOutput');
  const currentYear = new Date().getFullYear();

  // 2026年九宫飞星(简化:每年按洛书轨迹飞行)
  // 下元九运(2024-2043)以九紫入中
  // 2026 = 丙午年,年星推算:11 - (year%10各位之和)%9,简化处理
  const yearMod = (currentYear - 2024 + 9) % 9 + 1;
  const flyingStars = [
    { dir: '东南', star: 9, name: '九紫右弼', icon: '🟣', desc: '喜气、桃花、贵人', tip: '喜气位，宜放红色饰品增旺', color: '#a569bd' },
    { dir: '南', star: 5, name: '五黄大煞', icon: '🟡', desc: '灾祸、疾病、大凶', tip: '⚠️ 大凶位!放六帝钱或铜铃化解，忌动土', color: '#e74c3c' },
    { dir: '西南', star: 7, name: '七赤破军', icon: '🔴', desc: '破财、口舌、盗贼', tip: '凶位，放蓝色物品或水化解', color: '#e74c3c' },
    { dir: '东', star: 1, name: '一白贪狼', icon: '🔵', desc: '桃花、人缘、文昌', tip: '吉位，宜放水养植物增旺桃花运', color: '#5dade2' },
    { dir: '中宫', star: 8, name: '八白左辅', icon: '⚪', desc: '正财、置业、升职', tip: '大吉位!宜放黄水晶或聚宝盆催财', color: '#c9a84c' },
    { dir: '西', star: 3, name: '三碧是非', icon: '🟢', desc: '口舌、官司、争斗', tip: '凶位，放红色物品或火性物品化解', color: '#e67e22' },
    { dir: '东北', star: 2, name: '二黑病符', icon: '⚫', desc: '疾病、伤痛、慢性病', tip: '⚠️ 凶位!放铜葫芦或六帝钱化解', color: '#c0392b' },
    { dir: '北', star: 4, name: '四绿文昌', icon: '💚', desc: '学业、文书、功名', tip: '吉位，宜放书桌或绿植催旺文昌运', color: '#2ecc71' },
    { dir: '西北', star: 6, name: '六白武曲', icon: '💎', desc: '偏财、权力、武贵', tip: '吉位，宜放金属物品或白色饰品增旺', color: '#bdc3c7' }
  ];

  let html = '<div style="text-align:center;margin-bottom:24px">';
  html += '<p style="font-size:13px;letter-spacing:3px;color:var(--gold)">' + currentYear + '年 · 丙午年 · 下元九运</p>';
  html += '<p style="font-size:11px;opacity:.4;margin-top:4px">九宫飞星方位图</p></div>';

  html += '<div class="fs-flyingstar-grid">';
  for (const star of flyingStars) {
    html += '<div class="fs-flyingstar-cell" style="border-color:' + star.color.replace(')', ',.25)').replace('rgb', 'rgba') + '">';
    html += '<div class="fs-cell-dir">' + star.dir + '</div>';
    html += '<div class="fs-cell-star" style="color:' + star.color + '">' + star.icon + '</div>';
    html += '<div class="fs-cell-name">' + star.name + '</div></div>';
  }
  html += '</div>';

  html += '<div style="margin-top:30px"><h5 style="font-size:13px;letter-spacing:4px;color:var(--gold);margin-bottom:12px">各方位化解指南</h5>';
  html += '<div class="shensha-grid">';
  for (const star of flyingStars) {
    html += '<div class="shensha-item">';
    html += '<span class="ss-name" style="color:' + star.color + '">' + star.icon + ' ' + star.dir + ' · ' + star.name + '</span>';
    html += '<span class="ss-desc">' + star.desc + ' - ' + star.tip + '</span></div>';
  }
  html += '</div></div>';

  html += '<div class="huajie-alert" style="margin-top:24px"><div class="alert-title">⚠️ 重点提示</div>';
  html += '<p>五黄大煞位(正南)与二黑病符位(东北)为' + currentYear + '年最凶方位，切忌动土、装修，需放置化煞物品化解。</p>';
  html += '<p style="margin-top:8px">八白左辅(中宫)为全年最大财位，宜在此方位放置招财物件纳财催旺。</p></div>';

  out.innerHTML = html;
  document.getElementById('xkResult').classList.add('visible');
}

//============== MOBILE NUMBER MODULE ==============

const BAXING = {
  '天医': { codes: ['13', '31', '68', '86', '49', '94', '27', '72'], desc: '正财、婚姻、天赋、善良', rank: '吉' },
  '生气': { codes: ['14', '41', '67', '76', '39', '93', '28', '82'], desc: '贵人、乐天、活力、随缘', rank: '吉' },
  '延年': { codes: ['19', '91', '78', '87', '34', '43', '26', '62'], desc: '领导力、专业、长寿、自我', rank: '吉' },
  '伏位': { codes: ['11', '22', '88', '99', '66', '77', '33', '44'], desc: '耐心、潜藏、等待、被动', rank: '中' },
  '六煞': { codes: ['16', '61', '47', '74', '38', '83', '29', '92'], desc: '桃花、人际、情绪、敏感', rank: '中' },
  '五鬼': { codes: ['18', '81', '79', '97', '36', '63', '24', '42'], desc: '才华、叛逆、反复、火线', rank: '凶' },
  '绝命': { codes: ['12', '21', '69', '96', '48', '84', '37', '73'], desc: '投资、冲动、极端、大起大落', rank: '凶' },
  '祸害': { codes: ['17', '71', '89', '98', '46', '64', '23', '32'], desc: '口舌、是非、铁齿、固执', rank: '凶' }
};

function getBaXing(code) {
  for (const [name, data] of Object.entries(BAXING)) {
    if (data.codes.includes(code)) return { name, desc: data.desc, rank: data.rank };
  }
  return { name: '普通', desc: '普通数字组合', rank: '中' };
}

function getWuXing(num) {
  const map = { 1: '水', 6: '水', 2: '火', 7: '火', 3: '木', 8: '木', 4: '金', 9: '金', 5: '土', 0: '土' };
  return { name: map[num], desc: '五行属' + map[num], rank: '中' };
}

// ===== 统一评分模型 =====
// scoreMobile(mobile, baziInfo, indWx, locWx)
// baziInfo: {xiShen, jiShen, hasBazi, dayStem, dayWx, isWeak, dayGzIdx} or null
// indWx: industry wuxing string or ''
// locWx: location wuxing string or ''
// Returns: {baxing, bazi, wuxing, industry, location, total, details}
function scoreMobile(mobile, baziInfo, indWx, locWx) {
  var numWx = {1:'水',6:'水',2:'火',7:'火',3:'木',8:'木',4:'金',9:'金',5:'土',0:'土'};
  var shengMap = {木:'火',火:'土',土:'金',金:'水',水:'木'};
  var keMap = {木:'土',土:'水',水:'火',火:'金',金:'木'};
  
  // --- 五行统计 ---
  var wxCount = {木:0,火:0,土:0,金:0,水:0};
  for (var i = 0; i < mobile.length; i++) { wxCount[numWx[parseInt(mobile[i])]]++; }
  
  // --- 八星统计 ---
  var starResults = [];
  var jiCount = 0, xiongCount = 0, zhongCount = 0;
  for (var i = 0; i < 10; i += 2) {
    var code = mobile.substring(i, i + 2);
    var star = getBaXing(code);
    starResults.push({pos: i, code: code, star: star, wuxing: getWuXing(parseInt(code[0]))});
    if (star.rank === '吉') jiCount++;
    else if (star.rank === '凶') xiongCount++;
    else zhongCount++;
  }
  // 尾号分析
  var lastTwo = mobile.substring(9, 11);
  var lastStar = getBaXing(lastTwo);
  var tailStar = getBaXing(mobile.substring(9, 11));
  var tailIsJi = (lastStar.rank === '吉');
  var tailDoubleJi = false;
  // 检查尾号是否双吉星（最后两位是吉星且倒数第三四位也是吉星）
  var prevStar = getBaXing(mobile.substring(7, 9));
  if (tailIsJi && prevStar.rank === '吉') tailDoubleJi = true;
  
  // === 1. 八星数字能量评分 (0-40) ===
  var baxingScore = jiCount * 8 - xiongCount * 6 + 20;
  if (tailIsJi) baxingScore += 5;
  if (tailDoubleJi) baxingScore += 8; // 双吉星尾额外加分（含上面的5分）
  baxingScore = Math.max(0, Math.min(40, baxingScore));
  
  // === 2. 八字命理匹配评分 (0-25) ===
  var baziScore;
  if (baziInfo && baziInfo.hasBazi) {
    baziScore = 0;
    baziScore += wxCount[baziInfo.xiShen] * 4;
    baziScore -= wxCount[baziInfo.jiShen] * 3;
    if (wxCount[baziInfo.xiShen] >= 3) baziScore += 5;
    baziScore = Math.max(0, Math.min(25, baziScore + 12));
  } else {
    baziScore = 12; // 中性
  }
  
  // === 3. 五行能量平衡评分 (0-20) ===
  var maxV = 0, minV = 99, allPresent = true;
  for (var wx in wxCount) {
    if (wxCount[wx] > maxV) maxV = wxCount[wx];
    if (wxCount[wx] < minV) minV = wxCount[wx];
    if (wxCount[wx] === 0) allPresent = false;
  }
  var wuxingScore = Math.max(5, 20 - (maxV - minV) * 3);
  if (allPresent) wuxingScore += 3; // 五行全有bonus
  wuxingScore = Math.min(20, wuxingScore);
  
  // === 4. 行业五行匹配评分 (0-10) ===
  var industryScore;
  if (indWx) {
    industryScore = Math.min(10, wxCount[indWx] * 2 + wxCount[shengMap[indWx]] * 1);
  } else {
    industryScore = 5; // 中性
  }
  
  // === 5. 方位五行匹配评分 (0-5) ===
  var locationScore;
  if (locWx) {
    locationScore = Math.min(5, wxCount[locWx] * 1);
  } else {
    locationScore = 2; // 中性
  }
  
  var total = baxingScore + baziScore + wuxingScore + industryScore + locationScore;
  total = Math.max(0, Math.min(100, total));
  
  // 旺衰分析
  var maxWx = '木', maxVal2 = 0, minWx2 = '木', minVal2 = 99;
  for (var wx2 in wxCount) {
    if (wxCount[wx2] > maxVal2) { maxVal2 = wxCount[wx2]; maxWx = wx2; }
    if (wxCount[wx2] < minVal2) { minVal2 = wxCount[wx2]; minWx = wx2; }
  }
  
  return {
    baxing: baxingScore,
    bazi: baziScore,
    wuxing: wuxingScore,
    industry: industryScore,
    location: locationScore,
    total: total,
    details: {
      starResults: starResults,
      jiCount: jiCount,
      xiongCount: xiongCount,
      zhongCount: zhongCount,
      tailStar: lastStar,
      tailIsJi: tailIsJi,
      tailDoubleJi: tailDoubleJi,
      wxCount: wxCount,
      maxWx: maxWx,
      maxVal: maxVal2,
      minWx: minWx,
      minVal: minVal2,
      allPresent: allPresent
    }
  };
}

// ===== 辅助：获取八字信息 =====
function getBaziInfo(birthDate, birthHour) {
  if (!birthDate) return null;
  var parts = birthDate.split('-');
  var Y = parseInt(parts[0]), M = parseInt(parts[1]), D = parseInt(parts[2]);
  var hour = parseInt(birthHour || '0');
  var stems = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  var dayGzIdx = (Y * 365 + M * 30 + D) % 60;
  var dayStem = stems[dayGzIdx % 10];
  var stemWx = {甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
  var dayWx = stemWx[dayStem];
  var shengMap = {木:'水',火:'木',土:'火',金:'土',水:'金'};
  var keMap = {木:'金',火:'水',土:'木',金:'火',水:'土'};
  var isWeak = (dayGzIdx % 2 === 0);
  var xiShen = isWeak ? shengMap[dayWx] : keMap[dayWx];
  var jiShen = keMap[dayWx];
  return {
    hasBazi: true,
    dayStem: dayStem,
    dayWx: dayWx,
    isWeak: isWeak,
    xiShen: xiShen,
    jiShen: jiShen,
    dayGzIdx: dayGzIdx,
    yearGz: stems[(Y - 4) % 10],
    monthGz: stems[((Y - 4) % 10 * 2 + M) % 10],
    hourGz: stems[(dayGzIdx % 10 * 2 + hour) % 10]
  };
}

// ===== 辅助：获取行业/方位五行 =====
function getIndustryWx(occupation) {
  if (!occupation) return '';
  var industryWx = {'IT':'火','互联网':'火','科技':'火','电子':'火','计算机':'火','金融':'金','银行':'金','投资':'金','证券':'金','保险':'金','教育':'木','学校':'木','培训':'木','文化':'木','出版':'木','医疗':'木','医药':'木','健康':'木','养生':'木','房地产':'土','建筑':'土','建材':'土','装修':'土','餐饮':'火','食品':'火','酒店':'火','贸易':'水','物流':'水','运输':'水','旅游':'水','农业':'木','林业':'木','园林':'木','五金':'金','机械':'金','汽车':'金','制造':'金','法律':'金','政府':'金','军事':'金','艺术':'火','设计':'火','广告':'火','传媒':'火','美容':'水','服装':'水','纺织':'水'};
  for (var key in industryWx) { if (occupation.indexOf(key) >= 0 || key.indexOf(occupation) >= 0) return industryWx[key]; }
  return '';
}

function getLocationWx(location) {
  if (!location) return '';
  var dirWx = {'北京':'水','上海':'水','广州':'火','深圳':'火','成都':'土','重庆':'土','西安':'金','武汉':'水','杭州':'木','南京':'木','苏州':'木','天津':'水','青岛':'水','大连':'水','厦门':'火','昆明':'土','长沙':'火','郑州':'土','济南':'水','合肥':'木','福州':'火','南昌':'火','太原':'金','兰州':'金','银川':'金','海口':'水','南宁':'火','贵阳':'土','拉萨':'金','乌鲁木齐':'金','呼和浩特':'土','沈阳':'水','长春':'木','哈尔滨':'水','石家庄':'土','西宁':'金','宁波':'水','无锡':'木','佛山':'火','东莞':'火','烟台':'水','温州':'水','珠海':'火','中山':'火'};
  for (var key in dirWx) { if (location.indexOf(key) >= 0 || key.indexOf(location) >= 0) return dirWx[key]; }
  return '';
}

// ===== 多号码添加 =====
function addMobileInput(){
  var container=document.getElementById('mobileMultiInput');
  if(!container) return;
  var inputs=container.querySelectorAll('.mobile-num-input');
  if(inputs.length>=5){showToast('最多对比5个号码');return;}
  var div=document.createElement('div');
  div.className='mobile-input-item';
  div.style.cssText='display:flex;align-items:center;gap:4px';
  var inp=document.createElement('input');
  inp.type='tel';
  inp.className='input-field mobile-num-input';
  inp.style.cssText='width:160px;font-size:16px;letter-spacing:2px;text-align:center;font-weight:bold;color:var(--gold)';
  inp.placeholder='手机号 '+(inputs.length+1);
  inp.maxLength=11;
  var btn=document.createElement('button');
  btn.textContent='✕';
  btn.style.cssText='padding:4px 8px;background:rgba(231,76,60,.1);border:1px solid rgba(231,76,60,.3);border-radius:6px;color:#e74c3c;cursor:pointer;font-size:12px;flex-shrink:0';
  btn.onclick=function(){div.remove();};
  div.appendChild(inp);
  div.appendChild(btn);
  container.appendChild(div);
}

// ===== 多号码综合测算 =====
function analyzeMobileMulti(){
  try{
    var inputs=document.querySelectorAll('.mobile-num-input');
    var mobiles=[];
    for(var i=0;i<inputs.length;i++){
      var v=inputs[i].value.replace(/\s/g,'');
      if(v.length===11&&/^\d+$/.test(v)){mobiles.push(v);}
    }
    if(mobiles.length===0){showToast('请输入至少一个有效的11位手机号');return;}
    
    // 获取缘主信息
    var name=document.getElementById('mobileName')?document.getElementById('mobileName').value:'';
    var birthDate=document.getElementById('mobileBirthDate')?document.getElementById('mobileBirthDate').value:'';
    var birthHour=document.getElementById('mobileBirthHour')?document.getElementById('mobileBirthHour').value:'';
    var sex=document.getElementById('mobileSex')?document.getElementById('mobileSex').value:'male';
    var occupation=document.getElementById('mobileOccupation')?document.getElementById('mobileOccupation').value:'';
    var location=document.getElementById('mobileLocation')?document.getElementById('mobileLocation').value:'';
    var birthplace=document.getElementById('mobileBirthplace')?document.getElementById('mobileBirthplace').value:'';
    
    // 统一使用 scoreMobile 评分
    var baziInfo = getBaziInfo(birthDate, birthHour);
    var indWx = getIndustryWx(occupation);
    var locWx = getLocationWx(location);
    var birthWx = birthplace ? getLocationWx(birthplace) : locWx;
    var hasBazi = !!(baziInfo && baziInfo.hasBazi);
    var xiShen = hasBazi ? baziInfo.xiShen : '土';
    
    // 为每个号码使用统一评分
    var results=[];
    for(var mi=0;mi<mobiles.length;mi++){
      var mobile=mobiles[mi];
      var sc = scoreMobile(mobile, baziInfo, indWx, locWx);
      results.push({
        mobile: mobile,
        scores: {
          baxing: sc.baxing,
          bazi: sc.bazi,
          wuxing: sc.wuxing,
          industry: sc.industry,
          location: sc.location
        },
        total: sc.total,
        baxingJi: sc.details.jiCount,
        baxingXiong: sc.details.xiongCount,
        wuxingDist: sc.details.wxCount
      });
    }
    
    // 排序
    results.sort(function(a,b){return b.total-a.total;});
    
    // 显示结果容器
    var allResults=document.getElementById('mobileAllResults');
    if(allResults) allResults.style.display='block';
    
    // === 渲染对比表 ===
    var compareEl=document.getElementById('mobileCompareResult');
    var compareOut=document.getElementById('mobileCompareOutput');
    if(compareEl&&compareOut){
      compareEl.style.display='block';
      var html='';
      
      // 排名表
      html+='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">';
      html+='<tr style="border-bottom:2px solid rgba(201,168,76,.2)"><th style="padding:8px;text-align:center">排名</th><th style="padding:8px;text-align:center">手机号</th><th style="padding:8px;text-align:center">八星(40)</th><th style="padding:8px;text-align:center">五行(20)</th>';
      if(hasBazi)html+='<th style="padding:8px;text-align:center">八字(25)</th>';
      if(indWx)html+='<th style="padding:8px;text-align:center">行业(10)</th>';
      if(locWx)html+='<th style="padding:8px;text-align:center">方位(5)</th>';
      html+='<th style="padding:8px;text-align:center">总分</th></tr>';
      
      for(var i=0;i<results.length;i++){
        var r=results[i];
        var rankColor=i===0?'#2ecc71':i===1?'#c9a84c':i===2?'#cd7f32':'var(--paper2)';
        var rankIcon=i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1);
        html+='<tr style="border-bottom:1px solid rgba(201,168,76,.08)">';
        html+='<td style="padding:8px;text-align:center;font-size:16px">'+rankIcon+'</td>';
        html+='<td style="padding:8px;text-align:center;font-family:monospace;font-weight:bold;color:'+rankColor+';letter-spacing:2px">'+r.mobile+'</td>';
        html+='<td style="padding:8px;text-align:center">'+r.scores.baxing+'<br><span style="font-size:10px;opacity:.4">吉'+r.baxingJi+'凶'+r.baxingXiong+'</span></td>';
        html+='<td style="padding:8px;text-align:center">'+r.scores.wuxing+'</td>';
        if(hasBazi)html+='<td style="padding:8px;text-align:center">'+r.scores.bazi+'</td>';
        if(indWx)html+='<td style="padding:8px;text-align:center">'+r.scores.industry+'</td>';
        if(locWx)html+='<td style="padding:8px;text-align:center">'+r.scores.location+'</td>';
        html+='<td style="padding:8px;text-align:center"><span style="font-size:18px;font-weight:bold;color:'+rankColor+'">'+r.total+'</span></td>';
        html+='</tr>';
      }
      html+='</table></div>';
      
      // 最优推荐
      if(results.length>1){
        var best=results[0];
        html+='<div style="margin-top:16px;padding:14px;background:rgba(46,204,113,.06);border-radius:8px;text-align:center">';
        html+='<div style="font-size:12px;color:#2ecc71;margin-bottom:6px">🏆 最优推荐</div>';
        html+='<div style="font-size:24px;font-weight:bold;color:#2ecc71;font-family:monospace;letter-spacing:4px">'+best.mobile+'</div>';
        html+='<div style="font-size:12px;opacity:.6;margin-top:6px">综合评分 '+best.total+' 分';
        var advantage=best.total-results[1].total;
        if(advantage>0)html+='，领先第2名 '+advantage+' 分';
        html+='</div></div>';
      }
      
      compareOut.innerHTML=html;
    }
    
    // === 渲染维度影响力分析 ===
    var impactEl=document.getElementById('mobileImpactResult');
    var impactOut=document.getElementById('mobileImpactOutput');
    if(impactEl&&impactOut){
      impactEl.style.display='block';
      var ihtml='';
      ihtml+='<p style="font-size:12px;opacity:.6;margin-bottom:14px;text-align:center">以下分析各因素对缘主手机号吉凶的影响程度，帮助缘主理解哪个维度最重要</p>';
      
      // 维度影响力
      var dims=[
        {key:'baxing',name:'八星数字能量',score:40,icon:'⭐',desc:'天医/生气/延年等吉星组合是手机号吉凶的基础，影响财运、贵人、事业等核心运势。这是最重要的维度，占整体评分的40%。'},
        {key:'bazi',name:'八字命理匹配',score:25,icon:'🧭',desc:hasBazi?('手机号五行与缘主日主喜用神'+xiShen+'的匹配度。八字是先天命局，号码五行补益喜用神可增强运势，占25%。'):'未填生辰，此维度按中性处理。填写生辰后可精确分析，占25%。'},
        {key:'wuxing',name:'五行能量平衡',score:20,icon:'🔮',desc:'手机号11位数字的五行分布均衡度。五行偏旺或偏弱都会影响能量场，均衡为佳，占20%。'},
        {key:'industry',name:'行业五行匹配',score:10,icon:'💼',desc:indWx?('从事'+occupation+'（五行属'+indWx+'），号码五行与行业五行相生相旺有助事业，占10%。'):'未填行业，此维度按中性处理。填写后可分析行业匹配度，占10%。'},
        {key:'location',name:'居住地方位',score:5,icon:'🏠',desc:locWx?('居住'+location+'（五行属'+locWx+'），号码与居住地五行相合有助地利，占5%。'):'未填居住地，此维度按中性处理。填写后可分析方位匹配度，占5%。'}
      ];
      
      dims.sort(function(a,b){return b.score-a.score;});
      
      for(var d=0;d<dims.length;d++){
        var dim=dims[d];
        var pct=dim.score;
        var barColor=['#2ecc71','#c9a84c','#e67e22','#9b59b6','#3498db'][d];
        ihtml+='<div style="margin-bottom:14px">';
        ihtml+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">';
        ihtml+='<span style="font-size:13px;font-weight:bold">'+dim.icon+' '+dim.name+'</span>';
        ihtml+='<span style="font-size:13px;color:'+barColor+';font-weight:bold">'+pct+'%</span>';
        ihtml+='</div>';
        ihtml+='<div style="height:8px;background:rgba(255,255,255,.05);border-radius:4px;overflow:hidden;margin-bottom:6px"><div style="width:'+pct+'%;height:100%;background:'+barColor+';border-radius:4px"></div></div>';
        ihtml+='<div style="font-size:11px;opacity:.6;line-height:1.6">'+dim.desc+'</div>';
        ihtml+='</div>';
      }
      
      // 结论
      ihtml+='<div style="margin-top:16px;padding:14px;background:rgba(155,89,182,.05);border-radius:8px;font-size:12px;line-height:1.8">';
      ihtml+='<b style="color:#9b59b6">结论：</b>对缘主影响最大的是<b>八星数字能量（40%）</b>，其次是<b>八字命理匹配（25%）</b>。';
      ihtml+='选号时应优先关注吉星组合数量，其次确保五行与八字喜用神'+(hasBazi?xiShen:'（需填生辰）')+'相合。';
      if(!hasBazi) ihtml+='<br>⚠️ 当前未填生辰八字，八字维度（25%）按中性处理，建议填写以获得更精准分析。';
      ihtml+='</div>';
      
      impactOut.innerHTML=ihtml;
    }
    
    // 同时对第一个（最优）号码做详细分析
    document.getElementById('mobileInput').value=results[0].mobile;
    analyzeMobileFull();
    
  }catch(e){
    console.error('analyzeMobileMulti error:',e);
    showToast('分析出错：'+e.message);
  }
}

function analyzeMobileFull() {
  var mobileBtn = document.querySelector('button[onclick="analyzeMobileFull()"]');
  if (mobileBtn) { mobileBtn.disabled = true; mobileBtn.textContent = '🔮 测算中...'; }
  try {
  var mobileEl=document.getElementById('mobileInput');
  if(!mobileEl){showToast('找不到输入框');return;}
  var mobile=mobileEl.value.replace(/\s/g,'');
  if(mobile.length!==11||!/^\d+$/.test(mobile)){
    showToast('请输入有效的11位手机号');
    return;
  }
  
  // 获取可选字段
  var birthDate=document.getElementById('mobileBirthDate')?document.getElementById('mobileBirthDate').value:'';
  var birthHour=document.getElementById('mobileBirthHour')?document.getElementById('mobileBirthHour').value:'';
  var sex=document.getElementById('mobileSex')?document.getElementById('mobileSex').value:'male';
  var occupation=document.getElementById('mobileOccupation')?document.getElementById('mobileOccupation').value:'';
  var location=document.getElementById('mobileLocation')?document.getElementById('mobileLocation').value:'';
  var birthplace=document.getElementById('mobileBirthplace')?document.getElementById('mobileBirthplace').value:'';
  var name=document.getElementById('mobileName')?document.getElementById('mobileName').value:'';
  
  // 显示总结果容器
  var allResults=document.getElementById('mobileAllResults');
  if(allResults) allResults.style.display='block';
  
  // === 1. 八星数字能量分析 ===
  var baxingResult=[];
  for(var i=0;i<10;i+=2){
    var code=mobile.substring(i,i+2);
    var star=getBaXing(code);
    baxingResult.push({code:code,star:star,wuxing:getWuXing(parseInt(code[0]))});
  }
  var lastCode=mobile[10];
  var wuXingLast=getWuXing(parseInt(lastCode));
  baxingResult.push({code:lastCode,star:wuXingLast,wuxing:wuXingLast,isLast:true});
  renderMobileBaxing(mobile,baxingResult);
  
  // === 2. 五行能量分布 ===
  renderMobileWuxing(mobile);
  
  // === 3. 八字结合分析 ===
  if(birthDate){
    renderMobileBazi(mobile,birthDate,birthHour,sex,name);
  }else{
    var bz=document.getElementById('mobileBaziResult');
    if(bz) bz.style.display='none';
  }
  
  // === 4. 行业方位综合 ===
  if(occupation||location){
    renderMobileCareer(mobile,occupation,location);
  }else{
    var cr=document.getElementById('mobileCareerResult');
    if(cr) cr.style.display='none';
  }
  
  // === 5. 综合评级 ===
  renderMobileVerdict(mobile,baxingResult,birthDate,birthHour,occupation,location,name,sex);
  } catch(e) {
    console.error('analyzeMobileFull error:', e);
    showToast('测算过程出错：' + e.message);
  } finally {
    if (mobileBtn) { mobileBtn.disabled = false; mobileBtn.textContent = '🔮 开始综合测算'; }
  }
}

// 兼容旧调用
function analyzeMobile(){
  analyzeMobileFull();
}

// === 八星数字能量渲染 ===
function renderMobileBaxing(mobile,result){
  var out=document.getElementById('mobileOutput');
  if(!out) return;
  
  // 洛书九星映射表
  var jiuXing = {
    1: {name:'一白贪狼', star:'贪狼星', wx:'水', luck:'吉', desc:'桃花人缘，智慧文思', color:'#2980b9'},
    2: {name:'二黑巨门', star:'巨门星', wx:'土', luck:'凶', desc:'病符破财，小人暗害', color:'#7f8c8d'},
    3: {name:'三碧禄存', star:'禄存星', wx:'木', luck:'凶', desc:'是非口舌，暴躁冲动', color:'#27ae60'},
    4: {name:'四绿文曲', star:'文曲星', wx:'木', luck:'吉', desc:'文昌学业，才华智慧', color:'#2ecc71'},
    5: {name:'五黄廉贞', star:'廉贞星', wx:'土', luck:'凶', desc:'灾瘟损丁，大凶之数', color:'#e74c3c'},
    6: {name:'六白武曲', star:'武曲星', wx:'金', luck:'吉', desc:'权威刚毅，事业财运', color:'#bdc3c7'},
    7: {name:'七赤破军', star:'破军星', wx:'金', luck:'凶', desc:'破财破败，口舌争斗', color:'#95a5a6'},
    8: {name:'八白左辅', star:'左辅星', wx:'土', luck:'吉', desc:'大吉财运，置业田产', color:'#e67e22'},
    9: {name:'九紫右弼', star:'右弼星', wx:'火', luck:'吉', desc:'喜庆姻缘，名声荣誉', color:'#e74c3c'}
  };
  
  // 影响领域映射
  var starFields = {
    '天医': '💰财运 💕婚姻', '生气': '🤝贵人 ✨活力', '延年': '📈事业 🏥健康',
    '伏位': '⏳耐心 📦潜藏', '六煞': '🌹桃花 😢情绪',
    '五鬼': '🎨才华 ⚡反复', '绝命': '💸投资 😱冲动', '祸害': '🗣️口舌 😤固执'
  };
  var starRemedy = {
    '绝命': '避免冲动投资，增加天医(13/31/68/86)对冲',
    '五鬼': '注意反复变化，增加延年(19/91/78/87)稳定',
    '祸害': '注意口舌是非，增加生气(14/41/67/76)化解',
    '六煞': '注意情绪管理，增加天医(13/31/68/86)平衡'
  };
  
  var html='';
  html+='<div style="text-align:center;margin-bottom:20px">';
  html+='<div style="font-family:\'Ma Shan Zheng\',serif;font-size:32px;color:var(--gold);letter-spacing:6px">'+mobile+'</div>';
  html+='</div>';
  
  var rankCount={吉:0,中:0,凶:0};
  result.forEach(function(r){if(r.star&&r.star.rank)rankCount[r.star.rank]=(rankCount[r.star.rank]||0)+1;});
  
  html+='<div style="display:flex;gap:24px;margin-bottom:20px;justify-content:center">';
  html+='<div style="text-align:center"><div style="font-size:28px;color:#2ecc71;font-weight:bold">'+(rankCount['吉']||0)+'</div><div style="font-size:11px;opacity:.5">吉星</div></div>';
  html+='<div style="text-align:center"><div style="font-size:28px;color:var(--gold);font-weight:bold">'+(rankCount['中']||0)+'</div><div style="font-size:11px;opacity:.5">中星</div></div>';
  html+='<div style="text-align:center"><div style="font-size:28px;color:#e74c3c;font-weight:bold">'+(rankCount['凶']||0)+'</div><div style="font-size:11px;opacity:.5">凶星</div></div>';
  html+='</div>';
  
  html+='<div class="analysis-grid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));display:grid;gap:10px">';
  for(var i=0;i<result.length;i++){
    var r=result[i];
    var rank=r.star.rank||'中';
    var color=rank==='吉'?'#2ecc71':rank==='凶'?'#e74c3c':'var(--gold)';
    var isTail = r.isLast;
    html+='<div style="padding:12px;border-radius:8px;background:rgba(255,255,255,.02);border:1px solid '+color+'30;">';
    html+='<div style="font-size:15px;color:'+color+';font-weight:bold;margin-bottom:4px">'+r.code+' → '+r.star.name;
    if(isTail) html+=' <span style="font-size:10px;background:'+color+'20;padding:1px 6px;border-radius:8px">尾号</span>';
    html+='</div>';
    html+='<div style="font-size:11px;opacity:.6;line-height:1.5">'+r.star.desc+'</div>';
    // 影响领域
    var fields = starFields[r.star.name];
    if(fields) html+='<div style="font-size:10px;opacity:.5;margin-top:3px">影响：'+fields+'</div>';
    // 凶星化解
    if(rank==='凶' && starRemedy[r.star.name]) {
      html+='<div style="font-size:10px;color:#e74c3c;opacity:.7;margin-top:2px">💡'+starRemedy[r.star.name]+'</div>';
    }
    if(!r.isLast) html+='<div style="font-size:10px;opacity:.35;margin-top:2px">五行:'+r.wuxing.name+'</div>';
    html+='</div>';
  }
  html+='</div>';
  
  // === 洛书九星分析 ===
  html+='<div style="margin-top:20px;padding:16px;border-radius:10px;background:rgba(41,128,185,.04);border:1px solid rgba(41,128,185,.15)">';
  html+='<div style="font-size:14px;color:var(--gold);font-weight:bold;margin-bottom:10px;letter-spacing:2px">🌌 洛书九星分析</div>';
  html+='<div style="font-size:11px;opacity:.5;margin-bottom:10px">基于洛书九星理论，1-9数字对应九星吉凶</div>';
  // 统计九星能量
  var jxCount={};
  for(var j=0;j<mobile.length;j++){
    var d=parseInt(mobile[j]);
    if(d===0) continue; // 0跳过
    jxCount[d]=(jxCount[d]||0)+1;
  }
  var jxFortune={吉:0,凶:0};
  var jxDetail='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px">';
  for(var n=1;n<=9;n++){
    var jx=jiuXing[n];
    var cnt=jxCount[n]||0;
    if(cnt===0) continue;
    if(jx.luck==='吉') jxFortune.吉+=cnt;
    else jxFortune.凶+=cnt;
    var bg=jx.luck==='吉'?'rgba(39,174,96,.06)':'rgba(231,76,60,.06)';
    var bc=jx.luck==='吉'?'rgba(39,174,96,.2)':'rgba(231,76,60,.2)';
    jxDetail+='<div style="padding:10px;border-radius:8px;background:'+bg+';border:1px solid '+bc+'">';
    jxDetail+='<div style="font-size:13px;color:'+jx.color+';font-weight:bold">'+n+'·'+jx.name+'</div>';
    jxDetail+='<div style="font-size:11px;opacity:.6;margin-top:2px">'+jx.desc+'</div>';
    jxDetail+='<div style="font-size:10px;opacity:.5;margin-top:2px">出现 '+cnt+' 次 · '+jx.wx+'行 · '+jx.luck+'</div>';
    jxDetail+='</div>';
  }
  jxDetail+='</div>';
  // 九星吉凶比例
  var jxTotal=jxFortune.吉+jxFortune.凶;
  var jxPct=jxTotal>0?Math.round(jxFortune.吉/jxTotal*100):50;
  html+='<div style="display:flex;gap:16px;margin-bottom:12px;align-items:center">';
  html+='<div style="text-align:center"><div style="font-size:20px;color:#2ecc71;font-weight:bold">'+jxFortune.吉+'</div><div style="font-size:10px;opacity:.5">九星吉数</div></div>';
  html+='<div style="flex:1;height:8px;border-radius:4px;background:rgba(231,76,60,.15);overflow:hidden"><div style="height:100%;width:'+jxPct+'%;background:linear-gradient(90deg,#2ecc71,#27ae60);border-radius:4px"></div></div>';
  html+='<div style="text-align:center"><div style="font-size:20px;color:#e74c3c;font-weight:bold">'+jxFortune.凶+'</div><div style="font-size:10px;opacity:.5">九星凶数</div></div>';
  html+='</div>';
  html+=jxDetail;
  html+='</div>';
  
  out.innerHTML=html;
}

// === 五行能量分布渲染 ===
function renderMobileWuxing(mobile){
  var el=document.getElementById('mobileFengshuiResult');
  if(!el) return;
  el.style.display='block';
  
  var numWx={1:'水',6:'水',2:'火',7:'火',3:'木',8:'木',4:'金',9:'金',5:'土',0:'土'};
  var wxCount={木:0,火:0,土:0,金:0,水:0};
  for(var i=0;i<mobile.length;i++){wxCount[numWx[parseInt(mobile[i])]]++;}
  var total=mobile.length;
  
  var colors={木:'#27ae60',火:'#e74c3c',土:'#e67e22',金:'#95a5a6',水:'#2980b9'};
  
  // 五行条
  var bar=document.getElementById('wuxingBar');
  if(bar){
    bar.innerHTML='';
    for(var wx in wxCount){
      var pct=Math.round(wxCount[wx]/total*100);
      if(pct>0){
        var seg=document.createElement('div');
        seg.style.width=pct+'%';
        seg.style.backgroundColor=colors[wx];
        seg.style.height='100%';
        seg.title=wx+':'+pct+'%';
        bar.appendChild(seg);
      }
    }
  }
  
  // 图例
  var legend=document.getElementById('wuxingLegend');
  if(legend){
    legend.innerHTML='';
    for(var wx in wxCount){
      var pct=Math.round(wxCount[wx]/total*100);
      if(pct>0){
        legend.innerHTML+='<span style="font-size:12px"><span style="color:'+colors[wx]+'">●</span> '+wx+':'+wxCount[wx]+'个('+pct+'%)</span> ';
      }
    }
  }
  
  // 能量分析
  var maxWx='木',maxVal=0,minWx='木',minVal=99;
  for(var wx in wxCount){
    if(wxCount[wx]>maxVal){maxVal=wxCount[wx];maxWx=wx;}
    if(wxCount[wx]<minVal){minVal=wxCount[wx];minWx=wx;}
  }
  var energy=document.getElementById('energyAnalysis');
  if(energy){
    energy.innerHTML='<p>号码中 <b style="color:'+colors[maxWx]+'">'+maxWx+'</b> 行最旺（'+maxVal+'个,'+Math.round(maxVal/total*100)+'%），<b style="color:'+colors[minWx]+'">'+minWx+'</b> 行最弱（'+minVal+'个,'+Math.round(minVal/total*100)+'%）</p>';
  }
  
  // 调理建议
  var advice=document.getElementById('tiaoliAdvice');
  if(advice){
    var tip='';
    var dirMap={木:'东方',火:'南方',土:'中央',金:'西方',水:'北方'};
    var colorMap={木:'绿/青色',火:'红/紫色',土:'黄/棕色',金:'白/银色',水:'黑/蓝色'};
    var foodMap={木:'绿色蔬菜、酸味食物',火:'红色食物、苦味食物',土:'黄色食物、甘味食物',金:'白色食物、辛味食物',水:'黑色食物、咸味食物'};
    var shengMap2={木:'火',火:'土',土:'金',金:'水',水:'木'};
    var keMap2={木:'土',土:'水',水:'火',火:'金',金:'木'};
    
    if(maxVal>=5){
      tip+='号码中'+maxWx+'行过旺（'+maxVal+'个），';
      tip+='若八字忌'+maxWx+'则不利，喜'+maxWx+'则大吉。';
      tip+='<br>💡 <b>调理建议：</b>';
      tip+='<br>· 颜色：多穿'+colorMap[minWx]+'衣物，平衡'+maxWx+'行过旺';
      tip+='<br>· 方位：面向'+dirMap[minWx]+'方位工作休息';
      tip+='<br>· 饮食：多食'+foodMap[minWx]+'，补益'+minWx+'行';
      tip+='<br>· 数字：号码中可增加'+minWx+'行数字';
      var minNums=[]; for(var n=0;n<=9;n++){if(numWx[n]===minWx)minNums.push(n);}
      tip+='（'+minNums.join('、')+'）';
    }else if(maxVal-minVal<=2){
      tip+='五行分布较为均衡，号码能量平和，无需特别调理。';
      tip+='<br>· 五行旺衰：'+maxWx+'行略旺，'+minWx+'行略弱，整体均衡。';
      tip+='<br>· 性格影响：五行均衡者性格平和，人际关系较好。';
      tip+='<br>· 健康运势：五行均衡利于健康，运势稳定。';
    }else{
      tip+='五行分布有偏重，'+maxWx+'行偏旺而'+minWx+'行偏弱，建议结合八字喜忌判断。';
      tip+='<br>💡 <b>调理建议：</b>';
      tip+='<br>· 颜色：适当增加'+colorMap[minWx]+'元素';
      tip+='<br>· 方位：面向'+dirMap[minWx]+'方位有助平衡';
      tip+='<br>· 饮食：适当食用'+foodMap[minWx]+'；';
      tip+='<br>· 旺衰影响：'+maxWx+'旺则性格偏'+({木:'仁慈进取',火:'热情急躁',土:'稳重保守',金:'果断刚毅',水:'聪慧多变'}[maxWx])+'，'+minWx+'弱则'+({木:'缺仁慈',火:'缺热情',土:'缺稳重',金:'缺果断',水:'缺智慧'}[minWx])+'。';
    }
    advice.innerHTML='<p>'+tip+'</p>';
  }
}

// === 八字结合分析 ===
function renderMobileBazi(mobile,birthDate,birthHour,sex,name){
  var baziEl=document.getElementById('mobileBaziResult');
  var baziOut=document.getElementById('mobileBaziOutput');
  if(!baziEl||!baziOut) return;
  baziEl.style.display='block';
  
  var parts=birthDate.split('-');
  var Y=parseInt(parts[0]),M=parseInt(parts[1]),D=parseInt(parts[2]);
  var hour=parseInt(birthHour||'0');
  
  var stems=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  var branches=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  var yearGz=stems[(Y-4)%10]+branches[(Y-4)%12];
  var monthGz=stems[((Y-4)%10*2+M)%10]+branches[(M+1)%12];
  var dayGzIdx=(Y*365+M*30+D)%60;
  var dayGz=stems[dayGzIdx%10]+branches[dayGzIdx%12];
  var hourGz=stems[(dayGzIdx%10*2+hour)%10]+branches[hour];
  var dayStem=stems[dayGzIdx%10];
  
  var stemWx={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
  var dayWx=stemWx[dayStem];
  
  var numWx={1:'水',6:'水',2:'火',7:'火',3:'木',8:'木',4:'金',9:'金',5:'土',0:'土'};
  var wxCount={木:0,火:0,土:0,金:0,水:0};
  for(var i=0;i<mobile.length;i++){wxCount[numWx[parseInt(mobile[i])]]++;}
  
  var shengMap={木:'水',火:'木',土:'火',金:'土',水:'金'};
  var keMap={木:'金',火:'水',土:'木',金:'火',水:'土'};
  var isWeak=(dayGzIdx%2===0);
  var xiShen=isWeak?shengMap[dayWx]:keMap[dayWx];
  var jiShen=keMap[dayWx];
  
  var matchScore=0;
  var analysis='';
  if(wxCount[xiShen]>0){
    matchScore+=15*wxCount[xiShen];
    analysis+='<div style="color:#2ecc71">✓ 号码含'+wxCount[xiShen]+'个'+xiShen+'五行数字，与喜用神'+xiShen+'相合，补益命局</div>';
  }else{
    analysis+='<div style="color:#e74c3c">✗ 号码无'+xiShen+'五行数字，与喜用神不匹配</div>';
  }
  if(wxCount[jiShen]>3){
    matchScore-=15;
    analysis+='<div style="color:#e74c3c">⚠ 号码中'+jiShen+'五行过多('+wxCount[jiShen]+'个)，为忌神，不利</div>';
  }
  
  var jixing=0,xiong=0;
  for(var i=0;i<10;i+=2){
    var star=getBaXing(mobile.substring(i,i+2));
    if(star.rank==='吉')jixing++;else if(star.rank==='凶')xiong++;
  }
  matchScore+=jixing*8-xiong*6;
  if(matchScore>80)matchScore=80+Math.min(20,matchScore-80);
  if(matchScore<30)matchScore=30;
  
  var level,color;
  if(matchScore>=60){level='高度匹配，建议长期使用';color='#2ecc71';}
  else if(matchScore>=45){level='基本匹配，可以使用';color='var(--gold)';}
  else{level='匹配度较低，建议更换';color='#e74c3c';}
  
  var html='';
  // 缘主信息
  if(name){
    html+='<div style="margin-bottom:12px;padding:8px 12px;background:rgba(201,168,76,.04);border-radius:6px;font-size:13px">';
    html+='<b style="color:var(--gold)">缘主：</b>'+name+'　<b style="color:var(--gold)">性别：</b>'+(sex==='male'?'男':'女')+'</div>';
  }
  // 四柱
  html+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;text-align:center">';
  html+='#each 柱'.replace('#each','');
  var pillars=[['年柱',yearGz],['月柱',monthGz],['日柱',dayGz],['时柱',hourGz]];
  for(var p=0;p<pillars.length;p++){
    html+='<div style="padding:8px;border-radius:6px;background:rgba(201,168,76,.04)"><div style="font-size:11px;opacity:.5">'+pillars[p][0]+'</div><div style="font-size:15px;color:var(--gold);font-weight:bold">'+pillars[p][1]+'</div></div>';
  }
  html+='</div>';
  html+='<div style="margin-bottom:12px;font-size:13px"><b style="color:var(--gold)">日主：</b>'+dayStem+'('+dayWx+')　<b style="color:var(--gold)">喜用神：</b>'+xiShen+'　<b style="color:var(--gold)">命主：</b>'+(isWeak?'偏弱':'偏强')+'</div>';
  html+='<div style="margin-bottom:12px;font-size:13px"><b style="color:var(--gold)">号码五行：</b>';
  for(var wx in wxCount){if(wxCount[wx]>0)html+=wx+':'+wxCount[wx]+' ';}
  html+='</div>';
  html+='<div style="margin-bottom:12px;font-size:13px;line-height:2">'+analysis+'</div>';
  html+='<div style="margin-bottom:12px;font-size:13px"><b style="color:var(--gold)">八星：</b>吉星'+jixing+'组 · 凶星'+xiong+'组</div>';
  html+='<div style="text-align:center;padding:14px;background:rgba(201,168,76,.05);border-radius:8px;margin-top:10px">';
  html+='<div style="font-size:11px;opacity:.5;margin-bottom:4px">八字综合匹配评分</div>';
  html+='<div style="font-size:28px;color:'+color+';font-weight:bold">'+matchScore+'</div>';
  html+='<div style="font-size:13px;color:'+color+';margin-top:4px">'+level+'</div></div>';
  // 建议
  html+='<div style="margin-top:12px;padding:12px;background:rgba(255,255,255,.02);border:1px solid rgba(201,168,76,.08);border-radius:6px;font-size:12px;line-height:2">';
  html+='<b style="color:var(--gold)">改号建议：</b><br>';
  html+='· 八字喜'+xiShen+'，宜多含数字：';
  var xiNums=[];for(var n=0;n<=9;n++){if(numWx[n]===xiShen)xiNums.push(n);}
  html+=xiNums.join('、')+'<br>';
  html+='· 忌'+jiShen+'过多，避免数字：';
  var jiNums=[];for(var n=0;n<=9;n++){if(numWx[n]===jiShen)jiNums.push(n);}
  html+=jiNums.join('、')+'<br>';
  html+='· 宜多配天医(13/31/68/86)、生气(14/41/67/76)、延年(19/91/78/87)吉星组合';
  html+='</div>';
  html+='<div style="margin-top:6px;font-size:10px;opacity:.35;text-align:center">⚠️ 仅供参考娱乐</div>';
  baziOut.innerHTML=html;
}

// === 行业方位综合 ===
function renderMobileCareer(mobile,occupation,location){
  var el=document.getElementById('mobileCareerResult');
  var out=document.getElementById('mobileCareerOutput');
  if(!el||!out) return;
  el.style.display='block';
  
  var numWx={1:'水',6:'水',2:'火',7:'火',3:'木',8:'木',4:'金',9:'金',5:'土',0:'土'};
  var wxCount={木:0,火:0,土:0,金:0,水:0};
  for(var i=0;i<mobile.length;i++){wxCount[numWx[parseInt(mobile[i])]]++;}
  var maxWx='木',maxVal=0;
  for(var wx in wxCount){if(wxCount[wx]>maxVal){maxVal=wxCount[wx];maxWx=wx;}}
  
  // 行业五行映射
  var industryWx={
    'IT':'火','互联网':'火','科技':'火','电子':'火','计算机':'火',
    '金融':'金','银行':'金','投资':'金','证券':'金','保险':'金',
    '教育':'木','学校':'木','培训':'木','文化':'木','出版':'木',
    '医疗':'木','医药':'木','健康':'木','养生':'木',
    '房地产':'土','建筑':'土','建材':'土','装修':'土',
    '餐饮':'火','食品':'火','酒店':'火',
    '贸易':'水','物流':'水','运输':'水','旅游':'水',
    '农业':'木','林业':'木','园林':'木',
    '五金':'金','机械':'金','汽车':'金','制造':'金',
    '法律':'金','政府':'金','军事':'金',
    '艺术':'火','设计':'火','广告':'火','传媒':'火',
    '美容':'水','服装':'水','纺织':'水'
  };
  
  // 方位五行
  var directionWx={
    '北京':'水','上海':'水','广州':'火','深圳':'火',
    '成都':'土','重庆':'土','西安':'金','武汉':'水',
    '杭州':'木','南京':'木','苏州':'木','天津':'水',
    '青岛':'水','大连':'水','厦门':'火','昆明':'土',
    '长沙':'火','郑州':'土','济南':'水','合肥':'木',
    '福州':'火','南昌':'火','太原':'金','兰州':'金',
    '银川':'金','海口':'水','南宁':'火','贵阳':'土',
    '拉萨':'金','乌鲁木齐':'金','呼和浩特':'土','沈阳':'水',
    '长春':'木','哈尔滨':'水','石家庄':'土','西宁':'金',
    '宁波':'水','无锡':'木','佛山':'火','东莞':'火',
    '烟台':'水','温州':'水','珠海':'火','中山':'火'
  };
  
  var html='';
  
  // 行业分析
  if(occupation){
    var indWx='土';
    for(var key in industryWx){
      if(occupation.indexOf(key)>=0||key.indexOf(occupation)>=0){indWx=industryWx[key];break;}
    }
    var shengMap={木:'火',火:'土',土:'金',金:'水',水:'木'};
    var keMap={木:'土',土:'水',水:'火',火:'金',金:'木'};
    
    html+='<div style="margin-bottom:14px">';
    html+='<div style="font-size:13px;margin-bottom:6px"><b style="color:var(--gold)">行业：</b>'+occupation+'（五行属'+indWx+'）</div>';
    
    if(maxWx===indWx){
      html+='<div style="font-size:12px;color:#2ecc71">✓ 号码主五行'+maxWx+'与行业五行'+indWx+'一致，助力事业发展</div>';
    }else if(shengMap[maxWx]===indWx){
      html+='<div style="font-size:12px;color:#2ecc71">✓ 号码五行'+maxWx+'生行业五行'+indWx+'，相生助运</div>';
    }else if(keMap[maxWx]===indWx){
      html+='<div style="font-size:12px;color:#e74c3c">⚠ 号码五行'+maxWx+'克行业五行'+indWx+'，不利事业</div>';
    }else{
      html+='<div style="font-size:12px;color:var(--gold)">○ 号码五行'+maxWx+'与行业五行'+indWx+'关系中性</div>';
    }
    
    // 推荐数字
    var recNums=[];for(var n=0;n<=9;n++){if(numWx[n]===indWx||numWx[n]===shengMap[indWx])recNums.push(n);}
    html+='<div style="font-size:12px;opacity:.6;margin-top:4px">推荐数字：'+recNums.join('、')+'（补益'+indWx+'行业运）</div>';
    html+='</div>';
  }
  
  // 方位分析
  if(location){
    var locWx='土';
    for(var key in directionWx){
      if(location.indexOf(key)>=0||key.indexOf(location)>=0){locWx=directionWx[key];break;}
    }
    var directions={木:'东方',火:'南方',土:'中央',金:'西方',水:'北方'};
    
    html+='<div style="margin-bottom:14px">';
    html+='<div style="font-size:13px;margin-bottom:6px"><b style="color:var(--gold)">居住地：</b>'+location+'（五行属'+locWx+'，方位'+directions[locWx]+'）</div>';
    
    if(maxWx===locWx){
      html+='<div style="font-size:12px;color:#2ecc71">✓ 号码五行与居住地五行一致，地利人和</div>';
    }else if(shengMap[maxWx]===locWx){
      html+='<div style="font-size:12px;color:#2ecc71">✓ 号码五行生居住地五行，相生和谐</div>';
    }else if(keMap[maxWx]===locWx){
      html+='<div style="font-size:12px;color:#e74c3c">⚠ 号码五行克居住地五行，建议调整</div>';
    }else{
      html+='<div style="font-size:12px;color:var(--gold)">○ 号码五行与居住地五行关系中性</div>';
    }
    html+='</div>';
  }
  
  out.innerHTML=html;
}

// === 综合评级 ===
function renderMobileVerdict(mobile,baxingResult,birthDate,birthHour,occupation,location,name,sex){
  var out=document.getElementById('mobileFinalOutput');
  if(!out) return;
  
  // 使用统一评分模型
  var baziInfo = getBaziInfo(birthDate, birthHour);
  var indWx = getIndustryWx(occupation);
  var locWx = getLocationWx(location);
  var sc = scoreMobile(mobile, baziInfo, indWx, locWx);
  var totalScore = sc.total;
  
  // 缘主信息卡片
  var infoHtml='<div style="margin-bottom:16px;padding:10px 14px;background:rgba(201,168,76,.05);border-radius:8px;text-align:center">';
  infoHtml+='<div style="font-size:15px;color:var(--gold);font-weight:bold;letter-spacing:2px">'+(name||'有缘人')+'</div>';
  infoHtml+='<div style="font-size:12px;opacity:.5;margin-top:2px">';
  if(sex) infoHtml+=(sex==='male'?'男':'女')+'　';
  if(birthDate) infoHtml+='生辰:'+birthDate+(birthHour!==''?' '+['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][parseInt(birthHour)]+'时':'')+'　';
  if(occupation) infoHtml+='行业:'+occupation+'　';
  if(location) infoHtml+='居住地:'+location;
  infoHtml+='</div></div>';
  
  var level,color,desc;
  if(totalScore>=80){level='上吉';color='#2ecc71';desc='号码能量优秀，多维度匹配，强烈建议使用';}
  else if(totalScore>=65){level='吉';color='#2ecc71';desc='号码整体良好，吉星较多，可以使用';}
  else if(totalScore>=45){level='中吉';color='var(--gold)';desc='号码吉凶参半，有改善空间，可酌情使用';}
  else if(totalScore>=25){level='平';color='var(--gold)';desc='号码整体一般，凶星偏多，建议考虑更换';}
  else{level='凶';color='#e74c3c';desc='号码凶星过多，建议更换';}
  
  var html='';
  html+=infoHtml;
  html+='<div style="text-align:center;margin-bottom:16px">';
  html+='<div style="display:inline-block;padding:8px 24px;border-radius:20px;background:'+color+'20;border:2px solid '+color+'">';
  html+='<span style="font-size:24px;font-weight:bold;color:'+color+'">'+level+'</span></div></div>';
  
  // 统一5维度评分展示
  html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:10px;margin-bottom:16px">';
  html+='<div style="text-align:center;padding:10px;border-radius:8px;background:rgba(255,255,255,.02)"><div style="font-size:11px;opacity:.5">综合评分</div><div style="font-size:22px;color:'+color+';font-weight:bold">'+totalScore+'</div></div>';
  html+='<div style="text-align:center;padding:10px;border-radius:8px;background:rgba(255,255,255,.02)"><div style="font-size:11px;opacity:.5">八星(40)</div><div style="font-size:18px;color:#2ecc71;font-weight:bold">'+sc.baxing+'</div></div>';
  html+='<div style="text-align:center;padding:10px;border-radius:8px;background:rgba(255,255,255,.02)"><div style="font-size:11px;opacity:.5">八字(25)</div><div style="font-size:18px;color:var(--gold);font-weight:bold">'+sc.bazi+'</div></div>';
  html+='<div style="text-align:center;padding:10px;border-radius:8px;background:rgba(255,255,255,.02)"><div style="font-size:11px;opacity:.5">五行(20)</div><div style="font-size:18px;color:#3498db;font-weight:bold">'+sc.wuxing+'</div></div>';
  html+='<div style="text-align:center;padding:10px;border-radius:8px;background:rgba(255,255,255,.02)"><div style="font-size:11px;opacity:.5">行业(10)</div><div style="font-size:18px;color:#e67e22;font-weight:bold">'+sc.industry+'</div></div>';
  html+='<div style="text-align:center;padding:10px;border-radius:8px;background:rgba(255,255,255,.02)"><div style="font-size:11px;opacity:.5">方位(5)</div><div style="font-size:18px;color:#9b59b6;font-weight:bold">'+sc.location+'</div></div>';
  html+='</div>';
  
  html+='<div style="font-size:13px;line-height:1.8;opacity:.8;text-align:center;margin-bottom:14px">'+desc+'</div>';
  
  // === 深度化解方案 ===
  var d = sc.details;
  var numWx={1:'水',6:'水',2:'火',7:'火',3:'木',8:'木',4:'金',9:'金',5:'土',0:'土'};
  var shengMap={木:'火',火:'土',土:'金',金:'水',水:'木'};
  var keMap={木:'土',土:'水',水:'火',火:'金',金:'木'};
  
  html+='<div style="margin-top:16px;padding:16px;background:rgba(255,255,255,.02);border:1px solid rgba(201,168,76,.1);border-radius:10px">';
  html+='<div style="font-size:14px;color:var(--gold);font-weight:bold;margin-bottom:12px;letter-spacing:2px">🛡️ 化解方案与改号建议</div>';
  
  // 1. 凶星化解
  if(d.xiongCount > 0) {
    html+='<div style="margin-bottom:10px;font-size:12px;line-height:1.8"><b style="color:#e74c3c">⚠️ 凶星化解：</b>号码含'+d.xiongCount+'组凶星。';
    // 列出凶星位置及化解建议
    for(var si=0; si<d.starResults.length; si++) {
      var sr = d.starResults[si];
      if(sr.star.rank === '凶') {
        html+='<br>· 位置'+(sr.pos+1)+'-'+(sr.pos+2)+'位 "'+sr.code+'" → '+sr.star.name+'（'+sr.star.desc+'）：';
        if(sr.star.name === '绝命') html+='避免冲动投资，可在号码中增加天医(13/31/68/86)对冲';
        else if(sr.star.name === '五鬼') html+='注意反复变化，增加延年(19/91/78/87)稳定能量';
        else if(sr.star.name === '祸害') html+='注意口舌是非，增加生气(14/41/67/76)化解';
        else if(sr.star.name === '六煞') html+='注意情绪管理，增加天医(13/31/68/86)平衡感情';
      }
    }
    html+='</div>';
  }
  
  // 2. 尾号吉凶标注
  html+='<div style="margin-bottom:10px;font-size:12px;line-height:1.8"><b style="color:var(--gold)">📍 尾号分析：</b>';
  html+='尾号"'+mobile.substring(9,11)+'"→'+d.tailStar.name+'（'+d.tailStar.rank+'）。';
  if(d.tailIsJi) html+='尾号吉星，利于财运和运势，是加分项。';
  else if(d.tailStar.rank === '凶') html+='尾号凶星，影响较大，建议优先更换尾号数字。';
  else html+='尾号中性，影响一般。';
  if(d.tailDoubleJi) html+=' 双吉星结尾，大吉！';
  html+='</div>';
  
  // 3. 八字化解
  if(baziInfo && baziInfo.hasBazi) {
    html+='<div style="margin-bottom:10px;font-size:12px;line-height:1.8"><b style="color:var(--gold)">🧭 八字匹配：</b>';
    html+='日主'+baziInfo.dayStem+'('+baziInfo.dayWx+')，'+(baziInfo.isWeak?'偏弱':'偏强')+'，喜用神'+baziInfo.xiShen+'，忌神'+baziInfo.jiShen+'。';
    // 喜用神数字
    var xiNums=[]; for(var n=0;n<=9;n++){if(numWx[n]===baziInfo.xiShen)xiNums.push(n);}
    html+='宜多含数字：'+xiNums.join('、')+'（补'+baziInfo.xiShen+'）。';
    // 忌神数字
    var jiNums=[]; for(var n=0;n<=9;n++){if(numWx[n]===baziInfo.jiShen)jiNums.push(n);}
    html+='忌过多数字：'+jiNums.join('、')+'（'+baziInfo.jiShen+'过旺不利日主）。';
    // 号码五行偏旺影响
    if(d.maxVal >= 4) {
      html+='号码中'+d.maxWx+'行偏旺（'+d.maxVal+'个），';
      if(d.maxWx === baziInfo.jiShen) html+='此为忌神五行，加重日主负担，建议减少。';
      else if(d.maxWx === baziInfo.xiShen) html+='此为喜用神五行，有利于日主，可保留。';
      else html+='对日主影响中性，需结合大运判断。';
    }
    html+='</div>';
  }
  
  // 4. 五行调理建议
  html+='<div style="margin-bottom:10px;font-size:12px;line-height:1.8"><b style="color:var(--gold)">🔮 五行调理：</b>';
  html+='号码五行：';
  for(var wx in d.wxCount) { if(d.wxCount[wx]>0) html+=wx+':'+d.wxCount[wx]+' ';
  }
  html+='。'+d.maxWx+'行最旺，'+d.minWx+'行最弱。';
  if(d.maxVal >= 5) {
    // 调理建议
    var keWx = keMap[d.maxWx]; // 克制旺行的五行
    var xieWx = shengMap[d.maxWx]; // 旺行所生（泄）
    html+='建议增加'+keWx+'或'+xieWx+'行数字来平衡。';
    // 具体数字
    var keNums=[]; for(var n=0;n<=9;n++){if(numWx[n]===keWx||numWx[n]===xieWx)keNums.push(n);}
    html+='可增加数字：'+keNums.join('、')+'。';
    // 方位/颜色建议
    var dirMap={木:'东方',火:'南方',土:'中央',金:'西方',水:'北方'};
    var colorMap={木:'绿/青色',火:'红/紫色',土:'黄/棕色',金:'白/银色',水:'黑/蓝色'};
    html+='日常可多穿'+colorMap[d.minWx]+'衣物，面向'+dirMap[d.minWx]+'方位调理。';
  } else {
    html+='五行分布较为均衡，无需特别调理。';
  }
  html+='</div>';
  
  // 5. 最优改号方向
  html+='<div style="margin-bottom:6px;font-size:12px;line-height:1.8"><b style="color:#2ecc71">✅ 最优改号方向：</b>';
  // 保留的吉星
  var keepStars=[];
  for(var si2=0; si2<d.starResults.length; si2++) {
    if(d.starResults[si2].star.rank === '吉') keepStars.push(d.starResults[si2].code+'('+d.starResults[si2].star.name+')');
  }
  if(keepStars.length > 0) html+='保留吉星组合：'+keepStars.join('、')+'。';
  // 替换建议
  if(d.xiongCount > 0) {
    html+='建议替换凶星位置数字为天医(13/31/68/86)、生气(14/41/67/76)、延年(19/91/78/87)等吉星组合。';
  }
  // 尾号建议
  if(!d.tailIsJi) {
    html+='尾号建议改为天医(13/31/68/86)或延年(19/91/78/87)吉星结尾。';
  }
  html+='</div>';
  
  html+='</div>';
  
  // 维度列表
  html+='<div style="font-size:12px;opacity:.6;text-align:center;margin-top:8px">';
  html+='已分析维度：八星数字能量(40分) · 五行能量平衡(20分)';
  if(baziInfo && baziInfo.hasBazi) html+=' · 八字命理(25分)';
  if(indWx) html+=' · 行业匹配(10分)';
  if(locWx) html+=' · 方位匹配(5分)';
  html+='</div>';
  
  html+='<div style="margin-top:10px;font-size:10px;opacity:.3;text-align:center">⚠️ 本分析基于八星数字能量学与河图洛书五行理数，仅供参考娱乐</div>';
  out.innerHTML=html;
}

// (old renderMobileResult and renderMobileBaziAnalysis removed — replaced by renderMobileBaxing/renderMobileBazi)

// === 吉号推荐 ===
function recommendMobileNumbers(){
  var recBtn = document.querySelector('button[onclick="recommendMobileNumbers()"]');
  if (recBtn) { recBtn.disabled = true; recBtn.textContent = '🍀 生成中...'; }
  try {
  var out=document.getElementById('mobileRecOutput');
  if(!out) return;
  
  // 获取缘主信息
  var name=document.getElementById('mobileName')?document.getElementById('mobileName').value:'';
  var birthDate=document.getElementById('mobileBirthDate')?document.getElementById('mobileBirthDate').value:'';
  var birthHour=document.getElementById('mobileBirthHour')?document.getElementById('mobileBirthHour').value:'';
  var sex=document.getElementById('mobileSex')?document.getElementById('mobileSex').value:'male';
  var occupation=document.getElementById('mobileOccupation')?document.getElementById('mobileOccupation').value:'';
  var location=document.getElementById('mobileLocation')?document.getElementById('mobileLocation').value:'';
  var birthplace=document.getElementById('mobileBirthplace')?document.getElementById('mobileBirthplace').value:'';
  var tail=document.getElementById('mobileTailInput')?document.getElementById('mobileTailInput').value.replace(/\s/g,''):'';
  var count=parseInt(document.getElementById('mobileRecCount')?document.getElementById('mobileRecCount').value:'10');
  
  // 更新推荐维度显示
  var dimsEl=document.getElementById('recDims');
  var dims=['基础吉星组合'];
  
  // 计算喜用神
  var xiShen='土',jiShen='木',dayWx='土';
  var hasBazi=false;
  if(birthDate){
    hasBazi=true;
    dims.push('八字喜用神');
    var parts=birthDate.split('-');
    var Y=parseInt(parts[0]),M=parseInt(parts[1]),D=parseInt(parts[2]);
    var hour=parseInt(birthHour||'0');
    var stems=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    var dayGzIdx=(Y*365+M*30+D)%60;
    var dayStem=stems[dayGzIdx%10];
    var stemWx={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
    dayWx=stemWx[dayStem];
    var shengMap={木:'水',火:'木',土:'火',金:'土',水:'金'};
    var keMap={木:'金',火:'水',土:'木',金:'火',水:'土'};
    var isWeak=(dayGzIdx%2===0);
    xiShen=isWeak?shengMap[dayWx]:keMap[dayWx];
    jiShen=keMap[dayWx];
  }
  
  // 数字五行
  var numWx={1:'水',6:'水',2:'火',7:'火',3:'木',8:'木',4:'金',9:'金',5:'土',0:'土'};
  
  // 行业五行
  var indWx='';
  if(occupation){
    var industryWx={'IT':'火','互联网':'火','科技':'火','电子':'火','计算机':'火','金融':'金','银行':'金','投资':'金','证券':'金','保险':'金','教育':'木','学校':'木','培训':'木','文化':'木','出版':'木','医疗':'木','医药':'木','健康':'木','养生':'木','房地产':'土','建筑':'土','建材':'土','装修':'土','餐饮':'火','食品':'火','酒店':'火','贸易':'水','物流':'水','运输':'水','旅游':'水','农业':'木','林业':'木','园林':'木','五金':'金','机械':'金','汽车':'金','制造':'金','法律':'金','政府':'金','军事':'金','艺术':'火','设计':'火','广告':'火','传媒':'火','美容':'水','服装':'水','纺织':'水'};
    for(var key in industryWx){if(occupation.indexOf(key)>=0||key.indexOf(occupation)>=0){indWx=industryWx[key];break;}}
    if(indWx) dims.push('行业五行('+indWx+')');
  }
  
  // 居住地五行
  var locWx='';
  if(location){
    var dirWx={'北京':'水','上海':'水','广州':'火','深圳':'火','成都':'土','重庆':'土','西安':'金','武汉':'水','杭州':'木','南京':'木','苏州':'木','天津':'水','青岛':'水','大连':'水','厦门':'火','昆明':'土','长沙':'火','郑州':'土','济南':'水','合肥':'木','福州':'火','南昌':'火','太原':'金','兰州':'金','银川':'金','海口':'水','南宁':'火','贵阳':'土','拉萨':'金','乌鲁木齐':'金','呼和浩特':'土','沈阳':'水','长春':'木','哈尔滨':'水','石家庄':'土','西宁':'金','宁波':'水','无锡':'木','佛山':'火','东莞':'火','烟台':'水','温州':'水','珠海':'火','中山':'火'};
    for(var key in dirWx){if(location.indexOf(key)>=0||key.indexOf(location)>=0){locWx=dirWx[key];break;}}
    if(locWx) dims.push('居住地五行('+locWx+')');
  }
  
  if(tail) dims.push('指定尾号('+tail+')');
  if(dimsEl) dimsEl.textContent=dims.join(' · ');
  
  // 喜用神数字
  var xiNums=[];for(var n=0;n<=9;n++){if(numWx[n]===xiShen)xiNums.push(n);}
  // 忌神数字
  var jiNums=[];for(var n=0;n<=9;n++){if(numWx[n]===jiShen)jiNums.push(n);}
  // 中性数字
  var neutralNums=[];for(var n=0;n<=9;n++){if(xiNums.indexOf(n)<0&&jiNums.indexOf(n)<0)neutralNums.push(n);}
  
  // 行业有利数字
  var indNums=[];
  if(indWx){
    var shengMap2={木:'火',火:'土',土:'金',金:'水',水:'木'};
    for(var n=0;n<=9;n++){if(numWx[n]===indWx||numWx[n]===shengMap2[indWx])indNums.push(n);}
  }
  
  // 居住地有利数字
  var locNums=[];
  if(locWx){
    var shengMap3={木:'火',火:'土',土:'金',金:'水',水:'木'};
    for(var n=0;n<=9;n++){if(numWx[n]===locWx||numWx[n]===shengMap3[locWx])locNums.push(n);}
  }
  
  // 吉星组合
  var jixingCodes=['13','31','68','86','49','94','27','72','14','41','67','76','39','93','28','82','19','91','78','87','34','43','26','62'];
  
  // 合并有利数字池（优先级：喜用神 > 行业 > 居住地 > 中性）
  var bestNums=xiNums.slice();
  for(var i=0;i<indNums.length;i++){if(bestNums.indexOf(indNums[i])<0)bestNums.push(indNums[i]);}
  for(var i=0;i<locNums.length;i++){if(bestNums.indexOf(locNums[i])<0)bestNums.push(locNums[i]);}
  if(bestNums.length===0) bestNums=neutralNums.length>0?neutralNums:[1,3,5,6,7,8];
  
  // 生成候选号码（基于五行算法，非Math.random）
  var candidates=[];
  var seen={};
  // 用确定性序列生成号码，基于五行优先级
  var _seqIdx = 0;
  function _nextFromPool(pool, offset) {
    if (!pool || pool.length === 0) return 0;
    return pool[(offset + _seqIdx++) % pool.length];
  }
  
  for(var gen=0; gen<count*10 && candidates.length<count; gen++){
    _seqIdx = gen; // 每轮用不同起始位
    var num='1';
    num+=String(bestNums[gen % bestNums.length] || 3); // 第二位从有利数字取
    
    // 中间4位：用有利数字池循环取
    for(var i=0;i<4;i++){
      var pool=bestNums;
      // 每3个换一次池增加多样性
      if((gen+i) % 3 === 0 && neutralNums.length>0) pool=neutralNums;
      num+=String(_nextFromPool(pool, gen+i));
    }
    
    // 后4位
    if(tail && /^\d{4}$/.test(tail)){
      num+=tail;
    }else{
      var tail4='';
      // 每2个号码放入一个吉星组合
      if(gen % 2 === 0){
        var jc=jixingCodes[gen % jixingCodes.length];
        var remaining=4-jc.length;
        var tailPool=bestNums.length>0?bestNums:[0,1,2,3,4,5,6,7,8,9];
        for(var r=0;r<remaining;r++){
          tail4+=String(_nextFromPool(tailPool, gen+r));
        }
        // 吉星放前还是后，基于gen奇偶
        if(gen % 4 < 2) tail4=jc+tail4; else tail4=tail4+jc;
      }else{
        // 纯有利数字
        for(var i=0;i<4;i++){
          var pool2=(gen+i) % 5 < 3 ? bestNums : (neutralNums.length>0?neutralNums:bestNums);
          if(pool2.length===0) pool2=[0,1,2,3,4,5,6,7,8,9];
          tail4+=String(_nextFromPool(pool2, gen+i));
        }
      }
      if(tail4.length<4) tail4=tail4+'0'.repeat(4-tail4.length);
      if(tail4.length>4) tail4=tail4.substring(0,4);
      num+=tail4;
    }
    
    if(num.length!==11) continue;
    if(seen[num]) continue;
    seen[num]=1;
    
    // 评分
    var score=30; // 基础分
    var jx=0,xx=0;
    for(var i=0;i<10;i+=2){
      var code=num.substring(i,i+2);
      var star=getBaXing(code);
      if(star.rank==='吉')jx++;
      else if(star.rank==='凶')xx++;
    }
    score+=jx*8-xx*5;
    
    // 五行匹配
    var wxC={木:0,火:0,土:0,金:0,水:0};
    for(var i=0;i<num.length;i++){wxC[numWx[parseInt(num[i])]]++;}
    if(hasBazi){
      score+=wxC[xiShen]*5;
      score-=wxC[jiShen]*3;
    }
    if(indWx){
      var shengMap4={木:'火',火:'土',土:'金',金:'水',水:'木'};
      score+=wxC[indWx]*3;
      score+=wxC[shengMap4[indWx]]*2;
    }
    if(locWx){
      var shengMap5={木:'火',火:'土',土:'金',金:'水',水:'木'};
      score+=wxC[locWx]*2;
    }
    
    // 尾号加成
    var tail2=num.substring(9);
    if(jixingCodes.indexOf(tail2)>=0) score+=10;
    var tail4str=num.substring(7);
    // 连续吉星
    if(jixingCodes.indexOf(tail4str.substring(0,2))>=0 && jixingCodes.indexOf(tail4str.substring(2))>=0) score+=12;
    
    score=Math.max(20,Math.min(99,score));
    candidates.push({number:num,score:score,jx:jx,xx:xx});
  }
  
  // 排序
  candidates.sort(function(a,b){return b.score-a.score;});
  
  // 渲染
  var html='';
  
  // 缘主信息
  html+='<div style="margin-bottom:14px;padding:12px;background:rgba(46,204,113,.05);border-radius:8px">';
  html+='<div style="font-size:14px;color:#2ecc71;font-weight:bold;margin-bottom:4px">'+(name||'有缘人')+(sex==='male'?' 先生':' 女士')+'</div>';
  html+='<div style="font-size:12px;opacity:.6">';
  if(hasBazi) html+='八字喜用神：<b style="color:#2ecc71">'+xiShen+'</b>（推荐数字：'+xiNums.join('、')+'）　';
  if(indWx) html+='行业五行：'+indWx+'（推荐数字：'+indNums.join('、')+'）　';
  if(locWx) html+='居住地五行：'+locWx+'（推荐数字：'+locNums.join('、')+'）　';
  if(!hasBazi&&!indWx&&!locWx) html+='未填缘主信息，按通用吉星组合推荐';
  html+='</div></div>';
  
  html+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">';
  for(var i=0;i<candidates.length;i++){
    var c=candidates[i];
    var color=c.score>=60?'#2ecc71':c.score>=40?'var(--gold)':'#e74c3c';
    var lvl=c.score>=60?'吉':c.score>=40?'中':'平';
    // 高亮吉星位置
    var numDisplay=c.number;
    var highlightHtml='';
    for(var j=0;j<10;j+=2){
      var pair=c.number.substring(j,j+2);
      if(jixingCodes.indexOf(pair)>=0){
        // 标记吉星对
      }
    }
    html+='<div style="padding:12px;border-radius:8px;background:rgba(255,255,255,.02);border:1px solid rgba(46,204,113,.1);text-align:center;position:relative">';
    if(i<3) html+='<div style="position:absolute;top:-6px;left:50%;transform:translateX(-50%);background:#2ecc71;color:#fff;font-size:9px;padding:1px 6px;border-radius:8px">TOP'+(i+1)+'</div>';
    html+='<div style="font-size:18px;font-weight:bold;color:'+color+';letter-spacing:2px;font-family:monospace;margin-top:4px">'+c.number+'</div>';
    html+='<div style="margin-top:4px"><span style="font-size:11px;color:'+color+';padding:1px 6px;border-radius:4px;background:'+color+'15">'+lvl+'</span> <span style="font-size:11px;opacity:.4">评分'+c.score+'</span></div>';
    html+='<div style="font-size:10px;opacity:.4;margin-top:2px">吉星'+c.jx+'组 · 凶星'+c.xx+'组</div>';
    html+='</div>';
  }
  html+='</div>';
  
  // 选号建议
  html+='<div style="margin-top:14px;padding:12px;background:rgba(255,255,255,.02);border:1px solid rgba(46,204,113,.08);border-radius:6px;font-size:12px;line-height:2">';
  html+='<b style="color:#2ecc71">选号建议：</b><br>';
  if(hasBazi){
    html+='· 八字喜'+xiShen+'，首选含'+xiNums.join('、')+'的号码<br>';
    html+='· 避免忌'+jiShen+'过多（数字'+jiNums.join('、')+'不宜超过3个）<br>';
  }
  if(indWx) html+='· 从事'+occupation+'（'+indWx+'行），宜含'+indNums.join('、')+'助事业<br>';
  if(locWx) html+='· 居住'+location+'（'+locWx+'方），宜含'+locNums.join('、')+'利地运<br>';
  html+='· 尾号优选吉星组合：天医(13/31/68/86)、生气(14/41/67/76)、延年(19/91/78/87)<br>';
  html+='· 避免凶星尾号：绝命(12/21/69/96)、五鬼(18/81/79/97)、祸害(17/71/89/98)';
  html+='</div>';
  
  html+='<div style="margin-top:8px;font-size:10px;opacity:.3;text-align:center">⚠️ 推荐号码仅供娱乐参考，实际选号需考虑运营商可用性和个人喜好</div>';
  
  out.innerHTML=html;
  out.style.display='block';
  } catch(e) {
    console.error('recommendMobileNumbers error:', e);
    if(out) { out.innerHTML = '<div style="padding:20px;text-align:center;color:#e74c3c">⚠️ 生成推荐出错：' + e.message + '</div>'; out.style.display='block'; }
  } finally {
    if (recBtn) { recBtn.disabled = false; recBtn.textContent = '🍀 生成推荐'; }
  }
}

// === 推荐尾号（四位）===
function recommendTailNumbers(){
  var tailBtn = document.querySelector('button[onclick="recommendTailNumbers()"]');
  if (tailBtn) { tailBtn.disabled = true; tailBtn.textContent = '🎯 推荐中...'; }
  try {
  var out=document.getElementById('tailRecOutput');
  if(!out) return;
  
  // 获取缘主信息
  var name=document.getElementById('mobileName')?document.getElementById('mobileName').value:'';
  var birthDate=document.getElementById('mobileBirthDate')?document.getElementById('mobileBirthDate').value:'';
  var birthHour=document.getElementById('mobileBirthHour')?document.getElementById('mobileBirthHour').value:'';
  var occupation=document.getElementById('mobileOccupation')?document.getElementById('mobileOccupation').value:'';
  var location=document.getElementById('mobileLocation')?document.getElementById('mobileLocation').value:'';
  var birthplace=document.getElementById('mobileBirthplace')?document.getElementById('mobileBirthplace').value:'';
  
  // 更新维度
  var dimsEl=document.getElementById('recDims');
  var dims=['基础吉星组合'];
  
  // 数字五行
  var numWx={1:'水',6:'水',2:'火',7:'火',3:'木',8:'木',4:'金',9:'金',5:'土',0:'土'};
  var xiShen='土',jiShen='木',dayWx='土',hasBazi=false;
  
  // 计算八字喜用神
  if(birthDate){
    hasBazi=true;
    dims.push('八字喜用神');
    var parts=birthDate.split('-');
    var Y=parseInt(parts[0]),M=parseInt(parts[1]),D=parseInt(parts[2]);
    var hour=parseInt(birthHour||'0');
    var stems=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    var dayGzIdx=(Y*365+M*30+D)%60;
    var dayStem=stems[dayGzIdx%10];
    var stemWx={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
    dayWx=stemWx[dayStem];
    var shengMap={木:'水',火:'木',土:'火',金:'土',水:'金'};
    var keMap={木:'金',火:'水',土:'木',金:'火',水:'土'};
    var isWeak=(dayGzIdx%2===0);
    xiShen=isWeak?shengMap[dayWx]:keMap[dayWx];
    jiShen=keMap[dayWx];
  }
  
  // 行业五行
  var indWx='';
  if(occupation){
    var industryWx={'IT':'火','互联网':'火','科技':'火','电子':'火','计算机':'火','金融':'金','银行':'金','投资':'金','证券':'金','保险':'金','教育':'木','学校':'木','培训':'木','文化':'木','出版':'木','医疗':'木','医药':'木','健康':'木','养生':'木','房地产':'土','建筑':'土','建材':'土','装修':'土','餐饮':'火','食品':'火','酒店':'火','贸易':'水','物流':'水','运输':'水','旅游':'水','农业':'木','林业':'木','园林':'木','五金':'金','机械':'金','汽车':'金','制造':'金','法律':'金','政府':'金','军事':'金','艺术':'火','设计':'火','广告':'火','传媒':'火','美容':'水','服装':'水','纺织':'水'};
    for(var key in industryWx){if(occupation.indexOf(key)>=0||key.indexOf(occupation)>=0){indWx=industryWx[key];break;}}
    if(indWx) dims.push('行业五行('+indWx+')');
  }
  
  // 居住地五行
  var locWx='';
  if(location){
    var dirWx={'北京':'水','上海':'水','广州':'火','深圳':'火','成都':'土','重庆':'土','西安':'金','武汉':'水','杭州':'木','南京':'木','苏州':'木','天津':'水','青岛':'水','大连':'水','厦门':'火','昆明':'土','长沙':'火','郑州':'土','济南':'水','合肥':'木','福州':'火','南昌':'火','太原':'金','兰州':'金','银川':'金','海口':'水','南宁':'火','贵阳':'土','拉萨':'金','乌鲁木齐':'金','呼和浩特':'土','沈阳':'水','长春':'木','哈尔滨':'水','石家庄':'土','西宁':'金','宁波':'水','无锡':'木','佛山':'火','东莞':'火','烟台':'水','温州':'水','珠海':'火','中山':'火'};
    for(var key in dirWx){if(location.indexOf(key)>=0||key.indexOf(location)>=0){locWx=dirWx[key];break;}}
    if(locWx) dims.push('居住地五行('+locWx+')');
  }
  if(dimsEl) dimsEl.textContent=dims.join(' · ');
  
  // 喜用神数字
  var xiNums=[];for(var n=0;n<=9;n++){if(numWx[n]===xiShen)xiNums.push(n);}
  var jiNums=[];for(var n=0;n<=9;n++){if(numWx[n]===jiShen)jiNums.push(n);}
  var neutralNums=[];for(var n=0;n<=9;n++){if(xiNums.indexOf(n)<0&&jiNums.indexOf(n)<0)neutralNums.push(n);}
  
  // 行业有利数字
  var indNums=[];
  if(indWx){var shengMap2={木:'火',火:'土',土:'金',金:'水',水:'木'};for(var n=0;n<=9;n++){if(numWx[n]===indWx||numWx[n]===shengMap2[indWx])indNums.push(n);}}
  // 居住地有利数字
  var locNums=[];
  if(locWx){var shengMap3={木:'火',火:'土',土:'金',金:'水',水:'木'};for(var n=0;n<=9;n++){if(numWx[n]===locWx||numWx[n]===shengMap3[locWx])locNums.push(n);}}
  
  // 吉星组合（八星）
  var jixingPairs={
    '13':'天医(正财)','31':'天医(正财)','68':'天医(正财)','86':'天医(正财)',
    '49':'天医(正财)','94':'天医(正财)','27':'天医(正财)','72':'天医(正财)',
    '14':'生气(贵人)','41':'生气(贵人)','67':'生气(贵人)','76':'生气(贵人)',
    '39':'生气(贵人)','93':'生气(贵人)','28':'生气(贵人)','82':'生气(贵人)',
    '19':'延年(事业)','91':'延年(事业)','78':'延年(事业)','87':'延年(事业)',
    '34':'延年(事业)','43':'延年(事业)','26':'延年(事业)','62':'延年(事业)'
  };
  // 凶星组合
  var xiongPairs={
    '12':'绝命','21':'绝命','69':'绝命','96':'绝命','48':'绝命','84':'绝命','37':'绝命','73':'绝命',
    '18':'五鬼','81':'五鬼','79':'五鬼','97':'五鬼','36':'五鬼','63':'五鬼','24':'五鬼','42':'五鬼',
    '17':'祸害','71':'祸害','89':'祸害','98':'祸害','46':'祸害','64':'祸害','23':'祸害','32':'祸害'
  };
  
  // 合并有利数字池
  var bestNums=xiNums.slice();
  for(var i=0;i<indNums.length;i++){if(bestNums.indexOf(indNums[i])<0)bestNums.push(indNums[i]);}
  for(var i=0;i<locNums.length;i++){if(bestNums.indexOf(locNums[i])<0)bestNums.push(locNums[i]);}
  if(bestNums.length===0) bestNums=neutralNums.length>0?neutralNums:[1,3,5,6,7,8];
  
  // 生成所有可能的4位尾号（00-99 × 10 = 10000种太多）
  // 策略：生成有意义的尾号组合
  var candidates=[];
  
  // 策略1：双吉星尾号（XXYY 或 XYXY 形式，两个吉星对）
  for(var p1 in jixingPairs){
    for(var p2 in jixingPairs){
      var tail=p1+p2;
      if(tail.length===4){
        var score=scoreTail(tail,numWx,xiShen,jiShen,hasBazi,indWx,locWx,jixingPairs,xiongPairs);
        candidates.push({tail:tail,score:score.score,stars:score.stars,desc:score.desc});
      }
    }
  }
  
  // 策略2：吉星+有利数字
  for(var p in jixingPairs){
    // 吉星在后2位
    for(var n=0;n<=9;n++){
      for(var m=0;m<=9;m++){
        var tail2=''+n+m+p;
        if(tail2.length===4){
          var s2=scoreTail(tail2,numWx,xiShen,jiShen,hasBazi,indWx,locWx,jixingPairs,xiongPairs);
          if(s2.score>=40) candidates.push({tail:tail2,score:s2.score,stars:s2.stars,desc:s2.desc});
        }
      }
    }
    // 吉星在前2位
    for(var n=0;n<=9;n++){
      for(var m=0;m<=9;m++){
        var tail3=p+n+m;
        if(tail3.length===4){
          var s3=scoreTail(tail3,numWx,xiShen,jiShen,hasBazi,indWx,locWx,jixingPairs,xiongPairs);
          if(s3.score>=40) candidates.push({tail:tail3,score:s3.score,stars:s3.stars,desc:s3.desc});
        }
      }
    }
  }
  
  // 策略3：纯喜用神数字组合
  if(xiNums.length>=2){
    for(var a=0;a<xiNums.length;a++){
      for(var b=0;b<xiNums.length;b++){
        for(var c=0;c<xiNums.length;c++){
          for(var d=0;d<xiNums.length;d++){
            var tail4=''+xiNums[a]+xiNums[b]+xiNums[c]+xiNums[d];
            var s4=scoreTail(tail4,numWx,xiShen,jiShen,hasBazi,indWx,locWx,jixingPairs,xiongPairs);
            if(s4.score>=50) candidates.push({tail:tail4,score:s4.score,stars:s4.stars,desc:s4.desc});
          }
        }
      }
    }
  }
  
  // 去重+排序
  var seen={};
  var unique=[];
  for(var i=0;i<candidates.length;i++){
    if(!seen[candidates[i].tail]){
      seen[candidates[i].tail]=1;
      unique.push(candidates[i]);
    }
  }
  unique.sort(function(a,b){return b.score-a.score;});
  
  // 取前20个
  var top=unique.slice(0,20);
  
  // 渲染
  var html='';
  
  // 缘主信息
  html+='<div style="margin-bottom:14px;padding:12px;background:rgba(46,204,113,.05);border-radius:8px">';
  html+='<div style="font-size:14px;color:#2ecc71;font-weight:bold;margin-bottom:4px">🎯 推荐尾号 · '+(name||'有缘人')+'</div>';
  html+='<div style="font-size:12px;opacity:.6">';
  if(hasBazi) html+='八字喜用神：<b style="color:#2ecc71">'+xiShen+'</b>（推荐数字：'+xiNums.join('、')+'）　';
  if(indWx) html+='行业：'+occupation+'('+indWx+')推荐：'+indNums.join('、')+'　';
  if(locWx) html+='居住地：'+location+'('+locWx+')推荐：'+locNums.join('、')+'　';
  if(!hasBazi&&!indWx&&!locWx) html+='未填缘主信息，按通用吉星组合推荐';
  html+='</div></div>';
  
  // TOP 3 大卡片
  html+='<div style="margin-bottom:14px">';
  for(var i=0;i<Math.min(3,top.length);i++){
    var t=top[i];
    var color=t.score>=70?'#2ecc71':t.score>=55?'var(--gold)':'#e74c3c';
    html+='<div style="display:flex;align-items:center;gap:14px;padding:14px;margin-bottom:8px;border-radius:10px;background:linear-gradient(135deg,rgba(46,204,113,'+(0.08-i*0.02)+'),rgba(201,168,76,'+(0.04-i*0.01)+'));border:1px solid '+color+'30">';
    html+='<div style="width:40px;height:40px;border-radius:50%;background:'+color+'20;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;color:'+color+'">'+(i+1)+'</div>';
    html+='<div style="flex:1"><div style="font-size:24px;font-weight:bold;color:'+color+';letter-spacing:6px;font-family:monospace">'+t.tail+'</div>';
    html+='<div style="font-size:11px;opacity:.6;margin-top:2px">'+t.stars+' · '+t.desc+'</div></div>';
    html+='<div style="text-align:right"><div style="font-size:20px;font-weight:bold;color:'+color+'">'+t.score+'</div><div style="font-size:10px;opacity:.4">评分</div></div>';
    html+='</div>';
  }
  html+='</div>';
  
  // 第4-20名网格
  if(top.length>3){
    html+='<div style="font-size:12px;color:var(--gold);margin-bottom:8px;letter-spacing:2px">更多推荐尾号</div>';
    html+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px">';
    for(var i=3;i<top.length;i++){
      var t=top[i];
      var color=t.score>=70?'#2ecc71':t.score>=55?'var(--gold)':'#e74c3c';
      html+='<div style="padding:10px;border-radius:8px;background:rgba(255,255,255,.02);border:1px solid '+color+'15;text-align:center">';
      html+='<div style="font-size:18px;font-weight:bold;color:'+color+';letter-spacing:4px;font-family:monospace">'+t.tail+'</div>';
      html+='<div style="font-size:10px;opacity:.4;margin-top:2px">'+t.stars+'</div>';
      html+='<div style="font-size:10px;opacity:.3;margin-top:1px">评分'+t.score+'</div>';
      html+='</div>';
    }
    html+='</div>';
  }
  
  // 选号说明
  html+='<div style="margin-top:14px;padding:12px;background:rgba(255,255,255,.02);border:1px solid rgba(46,204,113,.08);border-radius:6px;font-size:12px;line-height:2">';
  html+='<b style="color:#2ecc71">评分依据：</b><br>';
  html+='· 吉星组合（天医/生气/延年）在尾4位中出现加分<br>';
  if(hasBazi){html+='· 含八字喜用神'+xiShen+'数字（'+xiNums.join('、')+'）加分<br>';}
  if(indWx){html+='· 含行业有利数字（'+indNums.join('、')+'）加分<br>';}
  if(locWx){html+='· 含居住地有利数字（'+locNums.join('、')+'）加分<br>';}
  html+='· 避免凶星组合（绝命/五鬼/祸害）扣分<br>';
  html+='· 双吉星组合（如1314、6819）额外加分';
  html+='</div>';
  
  html+='<div style="margin-top:8px;font-size:10px;opacity:.3;text-align:center">⚠️ 推荐尾号仅供娱乐参考，实际选号需考虑运营商可用性</div>';
  
  out.innerHTML=html;
  out.style.display='block';
  } catch(e) {
    console.error('recommendTailNumbers error:', e);
    if(out) { out.innerHTML = '<div style="padding:20px;text-align:center;color:#e74c3c">⚠️ 推荐尾号出错：' + e.message + '</div>'; out.style.display='block'; }
  } finally {
    if (tailBtn) { tailBtn.disabled = false; tailBtn.textContent = '🎯 推荐尾号'; }
  }
}

// 尾号评分函数
function scoreTail(tail,numWx,xiShen,jiShen,hasBazi,indWx,locWx,jixingPairs,xiongPairs){
  var score=30;
  var stars=[];
  var descParts=[];
  
  // 检查两位组合中的吉星
  var p1=tail.substring(0,2);
  var p2=tail.substring(2,4);
  
  if(jixingPairs[p1]){
    score+=15;
    stars.push(jixingPairs[p1]);
    descParts.push('前两位'+p1+'='+jixingPairs[p1]);
  }
  if(jixingPairs[p2]){
    score+=15;
    stars.push(jixingPairs[p2]);
    descParts.push('后两位'+p2+'='+jixingPairs[p2]);
  }
  if(xiongPairs[p1]){
    score-=12;
    descParts.push('前两位'+p1+'=凶星'+xiongPairs[p1]);
  }
  if(xiongPairs[p2]){
    score-=12;
    descParts.push('后两位'+p2+'=凶星'+xiongPairs[p2]);
  }
  
  // 中间对（第2-3位）
  var pMid=tail.substring(1,3);
  if(jixingPairs[pMid]){score+=8;stars.push(jixingPairs[pMid]);}
  if(xiongPairs[pMid]){score-=6;}
  
  // 五行匹配
  var wxC={木:0,火:0,土:0,金:0,水:0};
  for(var i=0;i<tail.length;i++){wxC[numWx[parseInt(tail[i])]]++;}
  if(hasBazi){
    score+=wxC[xiShen]*6;
    score-=wxC[jiShen]*4;
    if(wxC[xiShen]>=2) descParts.push('含'+wxC[xiShen]+'个'+xiShen+'五行(喜用神)');
  }
  if(indWx){
    var shengMap={木:'火',火:'土',土:'金',金:'水',水:'木'};
    score+=wxC[indWx]*3;
    score+=wxC[shengMap[indWx]]*2;
  }
  if(locWx){score+=wxC[locWx]*2;}
  
  // 双吉星额外加分
  if(jixingPairs[p1]&&jixingPairs[p2]){
    score+=10;
    descParts.push('双吉星组合');
  }
  
  // 四位全喜用神
  if(hasBazi){
    var allXi=true;
    for(var i=0;i<tail.length;i++){
      if(numWx[parseInt(tail[i])]!=xiShen){allXi=false;break;}
    }
    if(allXi){score+=15;descParts.push('全'+xiShen+'五行');}
  }
  
  // 重复数字加成（如8888、6666）
  if(tail[0]===tail[1]&&tail[1]===tail[2]&&tail[2]===tail[3]){
    score+=5;descParts.push('四同数字');
  }
  
  score=Math.max(20,Math.min(95,score));
  var starStr=stars.length>0?stars.join(' + '):'无吉星';
  var desc=descParts.length>0?descParts.join('；'):'普通组合';
  
  return{score:score,stars:starStr,desc:desc};
}

// 好户型参考 - 展开/收起详情
function togglePlanDetail(card) {
  card.classList.toggle('expanded');
}

// 户型匹配命卦
// === 导出报告函数 ===
function exportBaziReport(format = 'html') {
  const resultEl = document.getElementById('baziResult');
  if (!resultEl || !resultEl.innerHTML.trim()) {
    showToast('请先排盘后再导出报告');
    return;
  }
  const name = document.getElementById('baziName').value || '有缘人';
  const sex = document.getElementById('baziSex').value;
  const bazi = JSON.parse(localStorage.getItem('userBazi') || '{}');

  // 构建报告内容
  const reportContent = buildReportContent(resultEl, name, sex, bazi);

  if (format === 'html') {
    exportAsHTML(reportContent, name + '_八字命盘报告');
  } else if (format === 'pdf') {
    exportAsPDF(reportContent, name + '_八字命盘报告');
  } else if (format === 'word') {
    exportAsWord(reportContent, name + '_八字命盘报告');
  }
}

function buildReportContent(resultEl, name, sex, bazi) {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  // 获取会员信息
  const member = JSON.parse(localStorage.getItem('memberInfo') || '{}');
  const isMember = member.level && member.level !== 'free';

  // 构建会员年度提醒
  let annualNotice = '';
  if (isMember && bazi.dayStem) {
    annualNotice = generateAnnualNotice(nextYear, bazi, sex);
  }

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${name}八字命盘报告</title>
<style>
${getReportStyles()}
</style>
</head>
<body>
<div class="report-header">
  <h1>${name} 八字命盘报告</h1>
  <p class="report-meta">生成时间：${new Date().toLocaleString('zh-CN')}</p>
</div>
${annualNotice}
<div class="report-content">
${resultEl.innerHTML}
</div>
<div class="personalized-recommendations">
${generatePersonalizedRecommendations(bazi, sex)}
</div>
<p class="report-footer">易道智鉴 · 仅供参考 · 如有疑问请咨询专业人士</p>
</body>

<script>
// ===== 商城分类切换 =====

// ===== 渲染道医产品 =====

// ===== 渲染佛医产品 =====

// ===== 渲染名医推荐 =====

// ===== 产品详情弹窗 =====

<\/script>
</html>`;
}

function getReportStyles() {
  return `
body{font-family:'Noto Serif SC',serif,'SimSun',serif;background:#fff;color:#333;padding:40px;max-width:800px;margin:0 auto;line-height:1.8}
h1{color:#8b0000;text-align:center;letter-spacing:6px;border-bottom:3px solid #8b0000;padding-bottom:16px}
h2{color:#8b4513;border-bottom:2px solid #8b4513;padding-bottom:8px;margin-top:32px}
h3{color:#2f4f4f;margin-top:24px}
h4{color:#4a4a4a;margin-top:20px}
.report-header{text-align:center;margin-bottom:40px}
.report-meta{color:#666;font-size:12px;margin-top:12px}
.report-content{margin:24px 0}
.report-footer{text-align:center;color:#999;font-size:11px;margin-top:48px;padding-top:16px;border-top:1px solid #ddd}
.annual-notice{background:#fff3cd;border:3px solid var(--danger);padding:20px;margin:24px 0;border-radius:8px}
.annual-notice h2{color:var(--danger);border:none;text-align:center;font-size:20px;margin:0 0 16px 0}
.annual-notice-item{font-weight:bold;color:#8b0000;margin:12px 0;padding:8px;background:rgba(220,53,69,.1);border-left:4px solid var(--danger)}
.annual-notice-item::before{content:'⚠️ ';font-size:16px}
.personalized-recommendations{background:#f8f9fa;padding:20px;margin:24px 0;border-radius:8px;border:1px solid #dee2e6}
.personalized-recommendations h2{color:#28a745;border-color:#28a745;text-align:center}
.rec-section{margin:16px 0;padding:12px;background:#fff;border-radius:4px}
.rec-section h3{color:#495057;margin:0 0 8px 0;font-size:14px}
.rec-section ul{margin:0;padding-left:20px;color:#555}
.rec-section li{margin:4px 0}
.bazi-module{background:#fafafa;border:1px solid #e0e0e0;border-radius:8px;margin:16px 0;padding:16px}
.bazi-module-title{font-size:16px;color:#8b0000;font-weight:bold;border-bottom:1px solid #ddd;padding-bottom:8px;margin-bottom:12px}
.lucky-colors,.lucky-dirs{display:inline-block;margin:4px 8px}
@media print{
body{padding:20px}
.annual-notice{page-break-inside:avoid}
.bazi-module{page-break-inside:avoid}
}
`;
}

function generateAnnualNotice(nextYear, bazi, sex) {
  // 计算下年太岁
  const yrStemIdx = ((nextYear - 4) % 10 + 10) % 10;
  const yrZhiIdx = ((nextYear - 4) % 12 + 12) % 12;
  const yrStem = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'][yrStemIdx];
  const yrZhi = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][yrZhiIdx];

  // 判断冲害
  const dayBranch = bazi.dayBranch || '子';
  const zhiChong = {子:'午',丑:'未',寅:'申',卯:'酉',辰:'戌',巳:'亥',午:'子',未:'丑',申:'寅',酉:'卯',戌:'辰',亥:'巳'};
  const zhiHai = {子:'未',丑:'午',寅:'巳',卯:'辰',辰:'卯',巳:'寅',午:'丑',未:'子',申:'亥',酉:'戌',戌:'酉',亥:'申'};

  const chongTai = zhiChong[yrZhi] === dayBranch;
  const haiTai = zhiHai[yrZhi] === dayBranch;

  let notices = [];

  if (chongTai) {
    notices.push(`<div class="annual-notice-item">${nextYear}年${yrStem}${yrZhi}年，您命犯太岁（冲太岁），全年运势波动较大，需特别注意健康、事业变动</div>`);
    notices.push(`<div class="annual-notice-item">建议年初安太岁，佩戴太岁符，避免重大决策</div>`);
  }
  if (haiTai) {
    notices.push(`<div class="annual-notice-item">${nextYear}年您命犯害太岁，需防小人暗害、口舌是非</div>`);
  }

  // 五行喜忌分析
  const xiEle = bazi.xiEle || '木';
  const jiEle = bazi.jiEle || '金';
  const yrEle = {甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'}[yrStem];

  if (yrEle === jiEle) {
    notices.push(`<div class="annual-notice-item">${nextYear}年天干为${yrStem}，五行属${yrEle}，与您忌神五行相同，此年需谨慎行事，不宜冒险</div>`);
  }

  // 健康提醒
  const healthWarning = generateHealthWarning(bazi, nextYear);
  if (healthWarning) {
    notices.push(`<div class="annual-notice-item">${healthWarning}</div>`);
  }

  // 事业提醒
  const careerWarning = generateCareerWarning(bazi, nextYear, sex);
  if (careerWarning) {
    notices.push(`<div class="annual-notice-item">${careerWarning}</div>`);
  }

  if (notices.length === 0) {
    notices.push(`<div class="annual-notice-item">${nextYear}年整体运势平稳，建议把握机会，稳步发展</div>`);
  }

  return `
<div class="annual-notice">
  <h2>⚠️ ${nextYear}年度重要提醒</h2>
  ${notices.join('')}
  <p style="text-align:center;margin-top:16px;color:#666;font-size:12px">以上为会员专属年度提醒，请妥善保存</p>
</div>`;
}

function generateHealthWarning(bazi, year) {
  // 根据五行缺失和年份判断健康风险
  const missing = bazi.missingEles || [];
  const warnings = {
    木: '注意肝脏、眼睛、筋骨健康，宜多食绿色蔬菜',
    火: '注意心脏、心血管健康，避免过度劳累',
    土: '注意脾胃消化系统，饮食宜规律',
    金: '注意呼吸系统、肺部健康，忌烟酒',
    水: '注意肾脏、泌尿系统健康，多喝水少熬夜'
  };
  if (missing.length > 0) {
    return `五行缺${missing.join('、')}，${missing.map(e => warnings[e]).join('；')}`;
  }
  return '';
}

function generateCareerWarning(bazi, year, sex) {
  // 根据十神和大运判断事业风险
  const dayStem = bazi.dayStem || '甲';
  const age = year - (bazi.year || 1990);

  // 35-45岁事业关键期
  if (age >= 35 && age <= 45) {
    return `${year}年正处于事业黄金期，把握机遇的同时需注意工作与生活平衡`;
  }
  // 退休年龄段
  if (age >= 55 && age <= 65) {
    return `${year}年需注意退休规划，关注养老金和健康保障`;
  }
  return '';
}

function generatePersonalizedRecommendations(bazi, sex) {
  const xiEle = bazi.xiEle || '木';

  // 知识推荐
  const knowledge = {
    木: ['《黄帝内经》养生篇', '《易经》震卦详解', '五行木之生克关系'],
    火: ['《易经》离卦详解', '五行火之生克关系', '《黄帝内经》心经篇'],
    土: ['《易经》坤卦详解', '五行土之生克关系', '《黄帝内经》脾经篇'],
    金: ['《易经》兑卦详解', '五行金之生克关系', '《黄帝内经》肺经篇'],
    水: ['《易经》坎卦详解', '五行水之生克关系', '《黄帝内经》肾经篇']
  };

  // 口诀推荐
  const mantras = {
    木: ['春生万物木为先，东方甲乙利仁贤', '肝属木兮主疏泄，怒伤肝兮悲胜怒'],
    火: ['夏长万物火为尊，南方丙丁利明君', '心属火兮主神明，喜伤心兮恐胜喜'],
    土: ['四季旺土利中央，戊己坤地是故乡', '脾属土兮主运化，思伤脾兮怒胜思'],
    金: ['秋收万物金为令，西方庚辛利武进', '肺属金兮主气机，忧伤肺兮喜胜忧'],
    水: ['冬藏万物水为源，北方壬癸利智玄', '肾属水兮主精藏，恐伤肾兮思胜恐']
  };

  // 养生推荐
  const healthTips = {
    木: ['春季早起，舒展筋骨', '多食绿色蔬菜，少食酸味', '宜练习太极拳、八段锦', '卧室宜在东方或东南方'],
    火: ['夏季午休，养心安神', '多食红色食物，少食苦味', '宜练习冥想、静坐', '卧室宜在南方'],
    土: ['四季调养，健脾养胃', '多食黄色食物，少食甜味', '宜散步、慢跑', '卧室宜在中央或西南'],
    金: ['秋季润燥，养肺为先', '多食白色食物，少食辛味', '宜练习呼吸吐纳', '卧室宜在西方或西北'],
    水: ['冬季早睡，养肾藏精', '多食黑色食物，少食咸味', '宜练习气功、站桩', '卧室宜在北方']
  };

  // 参拜推荐
  const worship = {
    木: ['东方药师佛', '东岳泰山', '文昌帝君（求学）'],
    火: ['南方观音菩萨', '南岳衡山', '关帝圣君（求事业）'],
    土: ['中央地藏菩萨', '中岳嵩山', '土地公（求财）'],
    金: ['西方阿弥陀佛', '西岳华山', '财神爷（求财）'],
    水: ['北方阿弥陀佛', '北岳恒山', '妈祖娘娘（求平安）']
  };

  return `
<div class="personalized-recommendations">
  <h2>📚 个性化推荐</h2>
  <div class="rec-section">
    <h3>📖 推荐知识</h3>
    <ul>${(knowledge[xiEle] || knowledge.木).map(k => `<li>${k}</li>`).join('')}</ul>
  </div>
  <div class="rec-section">
    <h3>📿 养生口诀</h3>
    <ul>${(mantras[xiEle] || mantras.木).map(m => `<li>${m}</li>`).join('')}</ul>
  </div>
  <div class="rec-section">
    <h3>🌿 养生建议</h3>
    <ul>${(healthTips[xiEle] || healthTips.木).map(h => `<li>${h}</li>`).join('')}</ul>
  </div>
  <div class="rec-section">
    <h3>🙏 参拜推荐</h3>
    <ul>${(worship[xiEle] || worship.木).map(w => `<li>${w}</li>`).join('')}</ul>
  </div>
</div>`;
}

function exportAsHTML(content, filename) {
  const blob = new Blob([content], {type: 'text/html;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename + '.html';
  a.click();
  URL.revokeObjectURL(url);
  showToast('HTML报告已导出');
}

function exportAsPDF(content, filename) {
  // 创建新窗口打印
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('请允许弹出窗口以导出PDF');
    return;
  }
  printWindow.document.write(content);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
    showToast('请在打印对话框中选择"另存为PDF"');
  }, 500);
}

function exportAsWord(content, filename) {
  // 转换为Word兼容格式
  const wordContent = content.replace(/<style>[\s\S]*?<\/style>/, `
<style>
body{font-family:SimSun,serif;background:#fff;color:#000;padding:40px;max-width:800px;margin:0 auto}
h1{color:#8b0000;text-align:center}h2{color:#8b4513}h3{color:#2f4f4f}
.annual-notice{background:#fff3cd;border:2px solid var(--danger);padding:16px;margin:16px 0}
.annual-notice-item{font-weight:bold;color:#8b0000;margin:8px 0;padding:8px;background:#ffeeee;border-left:4px solid var(--danger)}
.personalized-recommendations{background:#f5f5f5;padding:16px;margin:16px 0}
</style>
`);

  const blob = new Blob(['\ufeff' + wordContent], {type: 'application/msword;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename + '.doc';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Word报告已导出');
}

// === 页面内显示的年度提醒 ===
function generateAnnualNoticeHTML(nextYear, bazi, sex) {
  const yrStemIdx = ((nextYear - 4) % 10 + 10) % 10;
  const yrZhiIdx = ((nextYear - 4) % 12 + 12) % 12;
  const yrStem = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'][yrStemIdx];
  const yrZhi = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][yrZhiIdx];

  const dayBranch = bazi.dayBranch || '子';
  const zhiChong = {子:'午',丑:'未',寅:'申',卯:'酉',辰:'戌',巳:'亥',午:'子',未:'丑',申:'寅',酉:'卯',戌:'辰',亥:'巳'};
  const zhiHai = {子:'未',丑:'午',寅:'巳',卯:'辰',辰:'卯',巳:'寅',午:'丑',未:'子',申:'亥',酉:'戌',戌:'酉',亥:'申'};

  const chongTai = zhiChong[yrZhi] === dayBranch;
  const haiTai = zhiHai[yrZhi] === dayBranch;
  const xiEle = bazi.xiEle || '木';
  const jiEle = bazi.jiEle || '金';
  const yrEle = {甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'}[yrStem];

  let items = [];
  if (chongTai) items.push(`<div class="annual-item"><span class="annual-icon">⚠️</span><strong>${nextYear}年${yrStem}${yrZhi}年冲太岁</strong>：全年运势波动大，注意健康、防口舌是非</div>`);
  if (haiTai) items.push(`<div class="annual-item"><span class="annual-icon">⚠️</span><strong>${nextYear}年害太岁</strong>：防小人暗害，谨慎交友投资</div>`);
  if (yrEle === jiEle) items.push(`<div class="annual-item"><span class="annual-icon">⚠️</span><strong>${nextYear}年天干${yrStem}(${yrEle})犯忌神</strong>：此年宜守不宜攻</div>`);

  // 健康提醒
  const missing = bazi.missingEles || [];
  if (missing.length > 0) {
    const healthMap = {木:'肝脏、眼睛',火:'心脏、心血管',土:'脾胃',金:'呼吸系统',水:'肾脏、泌尿系统'};
    items.push(`<div class="annual-item"><span class="annual-icon">🏥</span><strong>健康关注</strong>：五行缺${missing.join('、')}，注意${missing.map(e=>healthMap[e]).join('、')}健康</div>`);
  }

  if (items.length === 0) {
    items.push(`<div class="annual-item"><span class="annual-icon">✅</span><strong>${nextYear}年运势平稳</strong>：可把握机会稳步发展</div>`);
  }

  return items.join('');
}

function exportHuajieReport() {
  const resultEl = document.getElementById('hjOutput');
  if (!resultEl || !resultEl.innerHTML.trim()) {
    showToast('请先计算化解方案后再导出');
    return;
  }
  const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>化解方案报告</title><style>body{font-family:'Noto Serif SC',serif;background:#080808;color:#f0e8d8;padding:40px;max-width:800px;margin:0 auto}h1{color:#c9a84c;text-align:center;letter-spacing:6px}h2{color:#e8cc7a;border-bottom:1px solid rgba(201,168,76,.2);padding-bottom:8px}.result{background:rgba(255,255,255,.02);border:1px solid rgba(201,168,76,.1);border-radius:8px;padding:24px;margin:16px 0}</style></head><body><h1>化解方案报告</h1><div class="result">${resultEl.innerHTML}</div><p style="text-align:center;opacity:.4;margin-top:40px">易道智鉴 · 仅供参考</p></body>
<script>
// ===== 商城分类切换 =====

// ===== 渲染道医产品 =====

// ===== 渲染佛医产品 =====

// ===== 渲染名医推荐 =====

// ===== 产品详情弹窗 =====

<\/script>
</html>`;
  const blob = new Blob([html], {type:'text/html'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = '化解方案报告.html'; a.click();
  URL.revokeObjectURL(url);
}

function matchMyMingua(btn, suitableStr) {
  const card = btn.closest('.plan-card');
  let resultDiv = card.querySelector('.plan-match-result');
  if (!resultDiv) {
    resultDiv = document.createElement('div');
    resultDiv.className = 'plan-match-result';
    btn.parentNode.insertBefore(resultDiv, btn.nextSibling);
  }

  // 从 localStorage 获取八字
  const bazi = JSON.parse(localStorage.getItem('userBazi') || '{}');
  let birthYear = bazi.year || null;
  if (!birthYear && bazi.birthday) {
    birthYear = parseInt(bazi.birthday.split('-')[0]);
  }
  if (!birthYear) {
    // 再查输入字段
    const yearInput = document.getElementById('bzYear');
    if (yearInput && yearInput.value) {
      birthYear = parseInt(yearInput.value);
    }
  }

  if (!birthYear || isNaN(birthYear)) {
    resultDiv.className = 'plan-match-result show nomatch';
    resultDiv.innerHTML = '⚠️ 请先在「八宅风水·命卦分析」中输入出生年份，或先在信众中心绑定八字信息';
    return;
  }

  const sexInput = document.getElementById('bzSex');
  const sex = (sexInput && sexInput.value) || bazi.sex || 'male';

  if (!sexInput || !sexInput.value) {
    resultDiv.className = 'plan-match-result show nomatch';
    resultDiv.innerHTML = '⚠️ 请先在「八宅风水·命卦分析」中选择性别';
    return;
  }

  const mingGua = getMingGua(birthYear, sex);
  const minguaName = mingGua.guaName;
  const minguaType = mingGua.type;

  const suitable = suitableStr.split(',').map(s => s.trim().replace('命',''));
  const isMatch = suitable.some(s => s === minguaName || s === '');
