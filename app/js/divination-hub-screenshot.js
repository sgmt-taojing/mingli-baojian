// ===== 截图分析功能 =====
function handleScreenshotUpload(event) {
  let file = event.target.files[0];
  if (!file) return;
  showScreenshotPreview(file);
}

function handleScreenshotDrop(event) {
  event.preventDefault();
  let file = event.dataTransfer.files[0];
  if (!file) return;
  showScreenshotPreview(file);
}

function showScreenshotPreview(file) {
  let reader = new FileReader();
  reader.onload = function(e) {
    let img = document.getElementById('screenshotImage');
    if (img) img.src = e.target.result;
    let preview = document.getElementById('screenshotPreview');
    if (preview) preview.style.display = 'block';
    let result = document.getElementById('screenshotAnalysisResult');
    if (result) result.style.display = 'none';
    let progress = document.getElementById('uploadProgress');
    if (progress) progress.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function analyzeScreenshot() {
  let img = document.getElementById('screenshotImage');
  if (!img || !img.src || img.src === '') {
    showToast('请先上传面部照片');
    return;
  }
  let resultEl = document.getElementById('screenshotAnalysisResult');
  let contentEl = document.getElementById('analysisResultContent');
  let titleEl = document.getElementById('analysisResultTitle');
  if (resultEl) resultEl.style.display = 'block';
  if (titleEl) titleEl.textContent = '面相分析';
  if (contentEl) contentEl.innerHTML = '<p style="text-align:center;opacity:.6">正在分析面部照片...</p>';
  let metaEl = document.getElementById('analysisResultMeta');
  if (metaEl) metaEl.textContent = '基于面相学三停·五官·十二宫理论';

  // 尝试调用AI图片识别API
  let formData = new FormData();
  let imgFile = document.getElementById('screenshotInput').files[0];
  if (!imgFile) {
    // 没有文件对象，回退到手动分析
    showMianxiangManual();
    return;
  }
  formData.append('image', imgFile);

  // 先尝试调用本地AI服务
  fetch('/api/face-analyze', {
    method: 'POST',
    body: formData,
    timeout: 30000, signal: AbortSignal.timeout(15000) }).then(function(res) {
    if (!res.ok) throw new Error('API不可用');
    return res.json();
  }).then(function(data) {
    renderMianxiangResult(data);
  }).catch(function(err) {
    // AI服务不可用，回退到手动分析
    console.warn('AI面相分析不可用，切换到手动分析模式:', err.message);
    showMianxiangManual();
  });
}

// 面相手动分析 — 引导用户选择面部特征
function showMianxiangManual() {
  let resultEl = document.getElementById('screenshotAnalysisResult');
  let contentEl = document.getElementById('analysisResultContent');
  let titleEl = document.getElementById('analysisResultTitle');
  if (resultEl) resultEl.style.display = 'block';
  if (titleEl) titleEl.textContent = '面相手动物征分析';
  let metaEl = document.getElementById('analysisResultMeta');
  if (metaEl) metaEl.textContent = '请根据照片选择面部特征，系统将生成专业面相解读';

  let html = '<div style="max-width:700px;margin:0 auto">';

  // 三停
  html += '<div style="margin-bottom:20px;padding:16px;background:rgba(201,168,76,0.04);border:1px solid rgba(201,168,76,0.15);border-radius:12px">';
  html += '<div style="font-size:15px;font-weight:700;color:var(--gold);margin-bottom:12px">📐 三停（面部分三段）</div>';
  html += '<div style="font-size:12px;margin-bottom:10px">上停=额头（15-30岁运），中停=鼻眼（31-50岁运），下停=嘴颌（51岁后运）</div>';
  html += '<label style="display:block;margin-bottom:6px;font-size:13px">上停（额头）：</label>';
  html += '<select id="mxShangting" style="width:100%;padding:8px;margin-bottom:10px;background:var(--bg-card);color:var(--paper);border:1px solid var(--border);border-radius:6px" aria-label="mxShangting">';
  html += '<option value="">请选择</option>';
  html += '<option value="饱满">饱满光润 — 少年运佳，聪明有贵人</option>';
  html += '<option value="适中">适中均匀 — 少年平稳</option>';
  html += '<option value="狭窄">偏窄有纹 — 少年多波折，宜晚发</option>';
  html += '<option value="凸出">凸出饱满 — 智力过人，事业心强</option>';
  html += '</select>';
  html += '<label style="display:block;margin-bottom:6px;font-size:13px">中停（鼻眼颧）：</label>';
  html += '<select id="mxZhongting" style="width:100%;padding:8px;margin-bottom:10px;background:var(--bg-card);color:var(--paper);border:1px solid var(--border);border-radius:6px" aria-label="mxZhongting">';
  html += '<option value="">请选择</option>';
  html += '<option value="鼻直颴高">鼻直颧高 — 中年事业有成</option>';
  html += '<option value="适中">五官均匀 — 中年平稳</option>';
  html += '<option value="鼻偏歪">鼻偏歪或颧低 — 中年多劳</option>';
  html += '<option value="眼有神">眼大有神 — 精力充沛决断力强</option>';
  html += '</select>';
  html += '<label style="display:block;margin-bottom:6px;font-size:13px">下停（嘴颌）：</label>';
  html += '<select id="mxXiating" style="width:100%;padding:8px;margin-bottom:10px;background:var(--bg-card);color:var(--paper);border:1px solid var(--border);border-radius:6px" aria-label="mxXiating">';
  html += '<option value="">请选择</option>';
  html += '<option value="方圆">方圆饱满 — 晚年安逸有福</option>';
  html += '<option value="适中">适中均匀 — 晚年平稳</option>';
  html += '<option value="尖削">尖削偏窄 — 晚年需积德</option>';
  html += '<option value="双下巴">双下巴圆润 — 晚年福厚</option>';
  html += '</select>';
  html += '</div>';

  // 五官
  html += '<div style="margin-bottom:20px;padding:16px;background:rgba(52,152,219,0.04);border:1px solid rgba(52,152,219,0.15);border-radius:12px">';
  html += '<div style="font-size:15px;font-weight:700;color:var(--cyan2);margin-bottom:12px">👁 五官（眉眼鼻口耳）</div>';
  html += '<label style="display:block;margin-bottom:6px;font-size:13px">眉毛：</label>';
  html += '<select id="mxMei" style="width:100%;padding:8px;margin-bottom:10px;background:var(--bg-card);color:var(--paper);border:1px solid var(--border);border-radius:6px" aria-label="mxMei">';
  html += '<option value="">请选择</option>';
  html += '<option value="浓密">浓密有势 — 兄弟朋友多，精力旺</option>';
  html += '<option value="清秀">清秀细长 — 心思细腻，人缘好</option>';
  html += '<option value="稀疏">稀疏短促 — 性格独立，宜靠自身</option>';
  html += '<option value="剑眉">剑眉上扬 — 有魄力，武职文职皆宜</option>';
  html += '<option value="柳叶">柳叶弯眉 — 温和柔顺，女命吉</option>';
  html += '</select>';
  html += '<label style="display:block;margin-bottom:6px;font-size:13px">眼睛：</label>';
  html += '<select id="mxYan" style="width:100%;padding:8px;margin-bottom:10px;background:var(--bg-card);color:var(--paper);border:1px solid var(--border);border-radius:6px" aria-label="mxYan">';
  html += '<option value="">请选择</option>';
  html += '<option value="大眼有神">大眼有神 — 心地善良，贵人多</option>';
  html += '<option value="细长凤眼">细长凤眼 — 聪慧有谋略</option>';
  html += '<option value="圆眼">圆眼明亮 — 精力充沛，行动力强</option>';
  html += '<option value="三角眼">三角眼 — 精明能干，宜防刚烈</option>';
  html += '<option value="小眼有神">小眼有神 — 心思缜密，善于观察</option>';
  html += '</select>';
  html += '<label style="display:block;margin-bottom:6px;font-size:13px">鼻子：</label>';
  html += '<select id="mxBi" style="width:100%;padding:8px;margin-bottom:10px;background:var(--bg-card);color:var(--paper);border:1px solid var(--border);border-radius:6px" aria-label="mxBi">';
  html += '<option value="">请选择</option>';
  html += '<option value="鼻梁高直">鼻梁高直 — 正义感强，中年发达</option>';
  html += '<option value="鼻头圆润">鼻头圆润有肉 — 财运好，聚财</option>';
  html += '<option value="鼻翼丰满">鼻翼丰满 — 理财能力强</option>';
  html += '<option value="鼻偏短">鼻偏短 — 须靠自身努力积累</option>';
  html += '<option value="鹰钩鼻">鹰钩鼻 — 精明善谋，利商贾</option>';
  html += '</select>';
  html += '<label style="display:block;margin-bottom:6px;font-size:13px">嘴巴：</label>';
  html += '<select id="mxKou" style="width:100%;padding:8px;margin-bottom:10px;background:var(--bg-card);color:var(--paper);border:1px solid var(--border);border-radius:6px" aria-label="mxKou">';
  html += '<option value="">请选择</option>';
  html += '<option value="唇厚方阔">唇厚方阔 — 诚信厚道，食禄丰</option>';
  html += '<option value="樱桃小口">樱桃小口 — 女命吉，温柔贤淑</option>';
  html += '<option value="嘴角上扬">嘴角上扬 — 乐观积极，人缘好</option>';
  html += '<option value="唇薄">唇薄 — 口才好但宜防刻薄</option>';
  html += '<option value="大嘴">大嘴开朗 — 气魄大，外交力强</option>';
  html += '</select>';
  html += '<label style="display:block;margin-bottom:6px;font-size:13px">耳朵：</label>';
  html += '<select id="mxEr" style="width:100%;padding:8px;margin-bottom:10px;background:var(--bg-card);color:var(--paper);border:1px solid var(--border);border-radius:6px" aria-label="mxEr">';
  html += '<option value="">请选择</option>';
  html += '<option value="耳大有垂">耳大有垂 — 福气深厚，寿元长</option>';
  html += '<option value="耳高于眉">耳高于眉 — 智力超群，早年成名</option>';
  html += '<option value="贴脑耳">贴脑耳 — 守规矩，有贵人</option>';
  html += '<option value="耳小">耳小偏薄 — 需靠自身奋斗</option>';
  html += '<option value="招风耳">招风耳 — 性格外向，宜离乡发展</option>';
  html += '</select>';
  html += '</div>';

  // 面部气色
  html += '<div style="margin-bottom:20px;padding:16px;background:rgba(39,174,96,0.04);border:1px solid rgba(39,174,96,0.15);border-radius:12px">';
  html += '<div style="font-size:15px;font-weight:700;color:var(--jade);margin-bottom:12px">🎨 面部气色</div>';
  html += '<select id="mxQise" style="width:100%;padding:8px;margin-bottom:10px;background:var(--bg-card);color:var(--paper);border:1px solid var(--border);border-radius:6px" aria-label="mxQise">';
  html += '<option value="">请选择</option>';
  html += '<option value="红润">红润明润 — 运势正佳</option>';
  html += '<option value="黄润">黄润如玉 — 财运将至</option>';
  html += '<option value="白净">白净细腻 — 人缘好</option>';
  html += '<option value="青暗">偏青偏暗 — 近期需注意健康</option>';
  html += '<option value="暗沉">暗沉无光 — 运势偏低，宜修身</option>';
  html += '</select>';
  html += '</div>';

  // 性别
  html += '<div style="margin-bottom:20px">';
  html += '<label style="font-size:13px;margin-right:12px"><input type="radio" name="mxSex" value="male" checked> 男命</label>';
  html += '<label style="font-size:13px"><input type="radio" name="mxSex" value="female"> 女命</label>';
  html += '</div>';

  html += '<button class="compute-btn" style="width:100%" onclick="computeMianxiang()">🔍 生成面相解读</button>';
  html += '</div>';

  if (contentEl) contentEl.innerHTML = html;
}

// 面相解读引擎
function computeMianxiang() {
  let st = document.getElementById('mxShangting')?.value || '';
  let zt = document.getElementById('mxZhongting')?.value || '';
  let xt = document.getElementById('mxXiating')?.value || '';
  let mei = document.getElementById('mxMei')?.value || '';
  let yan = document.getElementById('mxYan')?.value || '';
  let bi = document.getElementById('mxBi')?.value || '';
  let kou = document.getElementById('mxKou')?.value || '';
  let er = document.getElementById('mxEr')?.value || '';
  let qise = document.getElementById('mxQise')?.value || '';
  let sex = document.querySelector('input[name="mxSex"]:checked')?.value || 'male';

  if (!st || !zt || !xt) {
    showToast('请至少完成三停选择');
    return;
  }

  let html = '<div style="max-width:800px;margin:0 auto">';

  // 1. 三停总论
  html += '<div style="margin-bottom:16px;padding:16px;background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:12px">';
  html += '<div style="font-size:15px;font-weight:700;color:var(--gold);margin-bottom:12px;letter-spacing:2px">📐 三停总论</div>';
  let stMap = {
    '饱满': '上停饱满光润，主15-30岁少年运佳，聪明伶俐，学业有成，得长辈贵人提携。额为天庭，天庭饱满者早年福厚。',
    '适中': '上停适中均匀，少年运平稳，无大起落，脚踏实地积累根基。',
    '狭窄': '上停偏窄有纹，少年运多波折，宜白手起家，大器晚成。额头代表早年运势，窄者需靠自身努力开创局面。',
    '凸出': '上停凸出饱满，智力过人，事业心强，善于规划，少年即有成大事之相。'
  };
  let ztMap = {
    '鼻直颴高': '中停鼻直颧高，主31-50岁中年运旺盛，事业有成，权势颇佳。鼻为面王，颧为权骨，二者相配则中年大发。',
    '适中': '中停五官均匀，中年运平稳，事业家庭双丰收，无大波折。',
    '鼻偏歪': '中停鼻偏歪或颧骨偏低，中年运多劳心劳力，宜脚踏实地，不可冒进。鼻歪者中年宜防感情波折。',
    '眼有神': '中停眼大有神，精力充沛，决断力强，中年可成一番事业。眼为心灵之窗，有神者心志坚定。'
  };
  let xtMap = {
    '方圆': '下停方圆饱满，主51岁后晚年运安逸有福，子女孝顺，安享晚年。下停为地阁，地阁方圆晚年福厚。',
    '适中': '下停适中均匀，晚年运平稳，衣食无忧。',
    '尖削': '下停尖削偏窄，晚年运需积德行善，宜早做养老规划。地阁尖削者晚年宜守不宜进。',
    '双下巴': '下停双下巴圆润，晚年福厚，衣食丰足，子嗣有靠。'
  };
  html += '<div style="font-size:13px;line-height:2;margin-bottom:8px"><b style="color:var(--gold2)">上停：</b>' + (stMap[st] || '适中均匀，少年运平稳。') + '</div>';
  html += '<div style="font-size:13px;line-height:2;margin-bottom:8px"><b style="color:var(--gold2)">中停：</b>' + (ztMap[zt] || '五官均匀，中年运平稳。') + '</div>';
  html += '<div style="font-size:13px;line-height:2"><b style="color:var(--gold2)">下停：</b>' + (xtMap[xt] || '适中均匀，晚年运平稳。') + '</div>';
  // 三停比例
  let balanced = (st === '饱满' || st === '适中') && (zt === '鼻直颴高' || zt === '适中' || zt === '眼有神') && (xt === '方圆' || xt === '适中' || xt === '双下巴');
  html += '<div style="margin-top:10px;padding:10px;background:rgba(0,0,0,0.15);border-radius:8px;font-size:12px">' + (balanced ? '三停均匀，一生运势平稳上升，属上佳之相。' : '三停不均，运势有起伏，需在弱运时段韬光养晦，旺运时段积极进取。') + '</div>';
  html += '</div>';

  // 2. 五官详解
  html += '<div style="margin-bottom:16px;padding:16px;background:rgba(52,152,219,0.06);border:1px solid rgba(52,152,219,0.2);border-radius:12px">';
  html += '<div style="font-size:15px;font-weight:700;color:var(--cyan2);margin-bottom:12px;letter-spacing:2px">👁 五官详解</div>';
  let wuguanMap = {
    '浓密': '眉浓密有势，兄弟朋友缘厚，精力旺盛，做事有魄力。但过浓则易冲动，宜修心养性。',
    '清秀': '眉清秀细长，心思细腻，人缘好，文才佳。柳眉清秀者，性格温和，善于交际。',
    '稀疏': '眉稀疏短促，性格独立，凡事靠自己。朋友少但精，宜专注专业领域。',
    '剑眉': '剑眉上扬，有魄力有胆识，武职文职皆宜，领导力强。女命剑眉则刚强能干。',
    '柳叶': '柳叶弯眉，温和柔顺，人缘极佳。女命柳叶眉主贤淑温婉，婚姻美满。',
    '大眼有神': '眼睛大而有神，心地善良，贵人多助。眼大有神者，感情丰富，事业有成。',
    '细长凤眼': '细长凤眼，聪慧有谋略，善于思考，适合学术或管理。凤眼者主贵。',
    '圆眼': '圆眼明亮，精力充沛，行动力强，性格直爽。但圆眼者宜防冲动。',
    '三角眼': '三角眼，精明能干，善于理财。但三角眼者性格刚烈，宜修身养性。',
    '小眼有神': '小眼有神，心思缜密，善于观察，做事沉稳。小眼者多内敛，不外露。',
    '鼻梁高直': '鼻梁高直，正义感强，中年发达。鼻为面王，高直者主中年运势旺盛。',
    '鼻头圆润': '鼻头圆润有肉，财运好，善于聚财。鼻头有肉者一生不缺钱。',
    '鼻翼丰满': '鼻翼丰满，理财能力强，能守财。鼻翼为财库，丰满者财库充盈。',
    '鼻偏短': '鼻偏短，需靠自身努力积累财富。短鼻者宜勤奋，不可投机。',
    '鹰钩鼻': '鹰钩鼻，精明善谋，利于经商。但鹰钩鼻者宜注意人际和谐。',
    '唇厚方阔': '唇厚方阔，诚信厚道，食禄丰厚。口为出纳官，方阔者主一生衣食不愁。',
    '樱桃小口': '樱桃小口，女命大吉，温柔贤淑，婚姻美满。小口者话语少而精。',
    '嘴角上扬': '嘴角上扬，乐观积极，人缘好。嘴角上扬者天生笑面，得人喜爱。',
    '唇薄': '唇薄，口才好但宜防言多必失。薄唇者精明但不宜刻薄。',
    '大嘴': '大嘴开朗，气魄大，外交能力强。大嘴者善于表达，适合公共关系。',
    '耳大有垂': '耳大有垂，福气深厚，寿元长。耳垂代表福报，大垂者福报深厚。',
    '耳高于眉': '耳高于眉，智力超群，早年成名。耳高者见识不凡，领悟力强。',
    '贴脑耳': '贴脑耳，守规矩，有贵人。贴脑耳者性格稳重，深谋远虑。',
    '耳小': '耳小偏薄，需靠自身奋斗。耳小者精力稍弱，宜注重健康。',
    '招风耳': '招风耳，性格外向，宜离乡发展。招风耳者不安于现状，适合创业。'
  };
  let wuguanLabels = {'mxMei':'眉毛','mxYan':'眼睛','mxBi':'鼻子','mxKou':'嘴巴','mxEr':'耳朵'};
  let wuguanValues = [mei, yan, bi, kou, er];
  let wuguanNames = ['眉毛','眼睛','鼻子','嘴巴','耳朵'];
  for (let i = 0; i < wuguanValues.length; i++) {
    if (wuguanValues[i]) {
      html += '<div style="font-size:13px;line-height:2;margin-bottom:6px"><b style="color:var(--cyan2)">' + wuguanNames[i] + '：</b>' + (wuguanMap[wuguanValues[i]] || wuguanValues[i]) + '</div>';
    }
  }
  html += '</div>';

  // 3. 十二宫分析
  html += '<div style="margin-bottom:16px;padding:16px;background:rgba(155,89,182,0.06);border:1px solid rgba(155,89,182,0.2);border-radius:12px">';
  html += '<div style="font-size:15px;font-weight:700;color:var(--violet);margin-bottom:12px;letter-spacing:2px">🔮 十二宫要论</div>';
  // 命宫（印堂）
  html += '<div style="font-size:13px;line-height:2;margin-bottom:6px"><b style="color:var(--violet)">命宫（印堂）：</b>' + (st === '饱满' ? '印堂开阔明亮，心胸开阔，运势通达。' : st === '狭窄' ? '印堂偏窄，宜放宽心胸，凡事不可过于执着。' : '印堂适中，运势平稳，心性平和。') + '</div>';
  // 财帛宫（鼻）
  html += '<div style="font-size:13px;line-height:2;margin-bottom:6px"><b style="color:var(--violet)">财帛宫（鼻）：</b>' + (bi === '鼻头圆润' ? '财帛宫丰隆，财运亨通，一生不缺财。' : bi === '鼻梁高直' ? '财帛宫高直，正财旺盛，中年发达。' : bi === '鼻翼丰满' ? '财帛宫丰满，善于理财，财库充盈。' : bi === '鹰钩鼻' ? '财帛宫有势，善经商，利偏财。' : '财帛宫适中，财运平稳，量力而行。') + '</div>';
  // 官禄宫（额）
  html += '<div style="font-size:13px;line-height:2;margin-bottom:6px"><b style="color:var(--violet)">官禄宫（额头）：</b>' + (st === '饱满' ? '官禄宫饱满，事业有成，有领导力。' : st === '凸出' ? '官禄宫凸出，事业心强，适合管理。' : '官禄宫适中，事业平稳，按部就班。') + '</div>';
  // 夫妻宫（眼尾）
  html += '<div style="font-size:13px;line-height:2;margin-bottom:6px"><b style="color:var(--violet)">夫妻宫（眼尾）：</b>' + (yan === '细长凤眼' ? '夫妻宫温润，婚姻和谐。' : yan === '大眼有神' ? '夫妻宫丰满，感情丰富，异性缘佳。' : '夫妻宫适中，婚姻需用心经营。') + '</div>';
  // 福德宫（眉尾上方）
  html += '<div style="font-size:13px;line-height:2;margin-bottom:6px"><b style="color:var(--violet)">福德宫（眉尾上方）：</b>' + (mei === '浓密' || mei === '剑眉' ? '福德宫有势，福报深厚，一生多贵人。' : mei === '清秀' || mei === '柳叶' ? '福德宫清秀，福报温润，平安是福。' : '福德宫适中，需积德行善增福。') + '</div>';
  html += '</div>';

  // 4. 气色运势
  if (qise) {
    html += '<div style="margin-bottom:16px;padding:16px;background:rgba(39,174,96,0.06);border:1px solid rgba(39,174,96,0.2);border-radius:12px">';
    html += '<div style="font-size:15px;font-weight:700;color:var(--jade);margin-bottom:12px;letter-spacing:2px">🎨 气色运势</div>';
    let qiseMap = {
      '红润': '面色红润明润，当前运势正佳，事业顺遂，人际和谐。宜积极进取，把握良机。',
      '黄润': '面色黄润如玉，财运将至，有进财之兆。宜投资理财，但不可贪婪。',
      '白净': '面色白净细腻，人缘好，桃花旺。但白色主金，需注意呼吸道健康。',
      '青暗': '面色偏青偏暗，近期需注意健康，尤其肝胆。宜休息调养，不宜过度劳累。',
      '暗沉': '面色暗沉无光，运势偏低，宜修身养性，行善积德，等待时运好转。'
    };
    html += '<div style="font-size:13px;line-height:2">' + (qiseMap[qise] || '') + '</div>';
    html += '</div>';
  }

  // 5. 综合断语
  html += '<div style="margin-bottom:16px;padding:16px;background:linear-gradient(135deg,rgba(201,168,76,0.08),rgba(201,168,76,0.02));border:1px solid rgba(201,168,76,0.2);border-radius:12px">';
  html += '<div style="font-size:15px;font-weight:700;color:var(--gold);margin-bottom:12px;letter-spacing:2px">📋 综合断语</div>';
  let overall = '';
  if (balanced && (bi === '鼻头圆润' || bi === '鼻梁高直') && (er === '耳大有垂' || er === '耳高于眉')) {
    overall = '此面相三停均匀、五官得配、财帛宫丰隆、福报深厚，属上佳之相。一生运势平稳上升，中年事业有成，晚年安享福禄。' + (sex === 'female' ? '女命得此相，旺夫益子，婚姻美满。' : '男命得此相，事业家庭双丰收。');
  } else if (balanced) {
    overall = '此面相三停均匀，一生运势平稳，无大起落。' + (yan === '大眼有神' || yan === '细长凤眼' ? '眼有神采，贵人多助，逢凶化吉。' : '') + '宜脚踏实地，积累善缘，福报自然来。';
  } else {
    let weakPoints = [];
    if (st === '狭窄' || st === '') weakPoints.push('少年运');
    if (zt === '鼻偏歪') weakPoints.push('中年事业');
    if (xt === '尖削') weakPoints.push('晚年福');
    overall = '此面相三停不均，' + (weakPoints.length > 0 ? weakPoints.join('、') + '需特别注意。' : '运势有起伏。') + '面相非一成不变，相由心生，行善积德可改运。古人云：「有心无相，相逐心生；有相无心，相随心灭。」心存善念，面相自然向好的方向转化。';
  }
  html += '<div style="font-size:13px;line-height:2">' + overall + '</div>';
  html += '</div>';

  // 6. 免责声明
  html += '<div style="margin-top:16px;padding:12px;background:rgba(231,76,60,0.05);border:1px solid rgba(231,76,60,0.15);border-radius:8px;text-align:center">';
  html += '<div style="font-size:12px;color:var(--cinn2);font-weight:600;margin-bottom:4px">⚠ 免责声明</div>';
  html += '<div style="font-size:11px;opacity:.7;line-height:1.8">面相学为中国传统文化之一，本分析仅供国学文化学习与娱乐参考，不构成任何专业建议。</div>';
  html += '</div>';

  html += '</div>';

  let contentEl = document.getElementById('analysisResultContent');
  if (contentEl) contentEl.innerHTML = html;
  let titleEl = document.getElementById('analysisResultTitle');
  if (titleEl) titleEl.textContent = '面相分析报告';
  let metaEl = document.getElementById('analysisResultMeta');
  if (metaEl) metaEl.textContent = '基于三停·五官·十二宫·气色综合推演';
}

// 渲染AI面相识别结果
function renderMianxiangResult(data) {
  let contentEl = document.getElementById('analysisResultContent');
  if (!contentEl) return;
  let html = '<div style="max-width:800px;margin:0 auto">';
  html += '<div style="margin-bottom:16px;padding:16px;background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:12px">';
  html += '<div style="font-size:15px;font-weight:700;color:var(--gold);margin-bottom:12px">📷 AI面相识别结果</div>';
  html += '<div style="font-size:13px;line-height:2">' + (data.description || data.text || '识别完成') + '</div>';
  html += '</div>';
  html += '<div style="padding:12px;background:rgba(52,152,219,0.04);border-radius:8px;font-size:13px;line-height:2">';
  html += '<div style="margin-bottom:8px">💡 如需更详细的面相解读，请点击「📝 手动分析」按钮，选择面部特征生成完整面相报告。</div>';
  html += '<button class="compute-btn" style="margin-top:8px" onclick="showMianxiangManual()">📝 手动选择特征深度分析</button>';
  html += '</div>';
  html += '</div>';
  contentEl.innerHTML = html;
}

function resetScreenshot() {
  let preview = document.getElementById('screenshotPreview');
  if (preview) preview.style.display = 'none';
  let result = document.getElementById('screenshotAnalysisResult');
  if (result) result.style.display = 'none';
  let input = document.getElementById('screenshotInput');
  if (input) input.value = '';
}

// ===== 生辰绑定功能 =====
function bindBazi() {
  let year = document.getElementById('bindYear');
  let month = document.getElementById('bindMonth');
  let day = document.getElementById('bindDay');
  let hour = document.getElementById('bindHour');
  if (!year || !month || !day || !hour) {
    showToast('表单加载异常');
    return;
  }
  let y = year.value, m = month.value, d = day.value, h = hour.value;
  if (!y || !m || !d) {
    showToast('请填写完整的出生日期');
    return;
  }
  try {
    localStorage.setItem('userBaziBirth', JSON.stringify({year:y,month:m,day:d,hour:h}));
  } catch(e) {}
  showSection('bazi');
  setTimeout(function() {
    let yEl = document.getElementById('birthYear');
    let mEl = document.getElementById('birthMonth');
    let dEl = document.getElementById('birthDay');
    let hEl = document.getElementById('birthHour');
    if (yEl && mEl && dEl && hEl) {
      yEl.value = y;
      mEl.value = m;
      dEl.value = d;
      hEl.value = h;
      if (typeof computeBazi === 'function') computeBazi();
    }
  }, 300);
}