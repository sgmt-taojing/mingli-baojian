/**
 * R493b · 拍舌/拍面 → 实时视觉辨证
 * 挂在 tcm-visual-reference.html
 * 流程：摄像头/上传 → face-ocr-server(8913) → 结构化特征 + HSV+LBP
 *       → api-server(8920) /api/vision/diagnose → 证型 + 置信度 + KB 证据
 */
(function () {
  'use strict';

  var FACE_OCR = 'http://127.0.0.1:8913';
  var API = 'http://127.0.0.1:8920';
  var stream = null;
  var history = [];
  var currentMode = 'tongue';

  function $(id) { return document.getElementById(id); }
  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function blobToB64(blob, cb) {
    var r = new FileReader();
    r.onload = function () { cb(r.result.split(',')[1]); };
    r.readAsDataURL(blob);
  }
  function setStatus(msg, type) {
    var el = $('tongueResult');
    if (!el) return;
    var color = type === 'error' ? '#e53e3e' : type === 'ok' ? '#38a169' : 'var(--muted)';
    el.innerHTML = '<div style="color:' + color + ';padding:8px 0">' + escapeHtml(msg) + '</div>';
  }

  function openCamera(mode) {
    currentMode = mode || 'tongue';
    var panel = $('tongueLivePanel');
    var video = $('tongueLiveVideo');
    if (panel) panel.style.display = 'block';
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('⚠️ 浏览器不支持摄像头，请用"上传"按钮', 'error');
      return;
    }
    if (stream) {
      video.srcObject = stream;
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: 640, height: 480 }, audio: false })
      .then(function (s) {
        stream = s;
        video.srcObject = s;
        setStatus('✅ 摄像头已启动，点击"拍摄"按钮拍' + (currentMode === 'face' ? '面' : '舌'), 'ok');
      })
      .catch(function (e) {
        setStatus('⚠️ 摄像头启动失败：' + (e.message || e.name) + '，可用"上传"按钮', 'error');
      });
  }

  function closeCamera() {
    if (stream) {
      stream.getTracks().forEach(function (t) { t.stop(); });
      stream = null;
    }
    var panel = $('tongueLivePanel');
    if (panel) panel.style.display = 'none';
  }

  function shootPhoto() {
    var video = $('tongueLiveVideo');
    var canvas = $('tongueLiveCanvas');
    if (!video || !video.videoWidth) {
      setStatus('⚠️ 摄像头未就绪', 'error');
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(function (blob) {
      if (!blob) { setStatus('⚠️ 拍摄失败', 'error'); return; }
      analyzeImage(blob, currentMode);
    }, 'image/jpeg', 0.85);
  }

  function uploadFile() {
    var input = $('tongueFileInput');
    if (!input) return;
    input.click();
  }

  function onFileSelected(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    analyzeImage(file, currentMode);
  }

  function analyzeImage(blob, mode) {
    setStatus('🔍 正在分析（HSV+LBP+规则引擎）…', '');
    blobToB64(blob, function (b64) {
      var fd = new FormData();
      fd.append('image', blob, 'capture.jpg');
      fd.append('mode', mode);

      fetch(FACE_OCR + '/api/camera/upload', {
        method: 'POST',
        body: fd,
        signal: AbortSignal.timeout(20000),
        headers: { 'X-API-Key': 'mingli-tcm-2024' }
      })
        .then(function (r) { return r.json(); })
        .then(function (ocrResult) {
          if (!ocrResult.ok) throw new Error(ocrResult.error || 'OCR failed');
          var features = ocrResult.structured_features || {};
          var analysisText = ocrResult.analysis || '';
          if (analysisText && Object.keys(features).length < 2) {
            features = extractFeaturesFromText(analysisText);
          }
          return fetch(API + '/api/vision/diagnose', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: mode,
              features: features,
              image_b64: b64,
              image_quality: {
                brightness: ocrResult.inspect ? ocrResult.inspect.brightness : undefined
              }
            }),
            signal: AbortSignal.timeout(15000)
          })
            .then(function (r) { return r.json(); })
            .then(function (diagResult) {
              renderDiagnosis(ocrResult, diagResult, features);
            });
        })
        .catch(function (err) {
          if (err.name === 'TimeoutError') {
            setStatus('⚠️ 分析超时，请重试（图片可能过大）', 'error');
          } else {
            setStatus('⚠️ 分析失败：' + (err.message || err), 'error');
          }
        });
    });
  }

  function extractFeaturesFromText(text) {
    var f = {};
    var m;
    if ((m = text.match(/舌色[偏·为是]*(淡白)/))) f.tongue_color = '淡白';
    else if ((m = text.match(/舌色[偏·为是]*(红舌|偏红|舌红)/))) f.tongue_color = '红';
    else if ((m = text.match(/舌色[偏·为是]*(绛)/))) f.tongue_color = '绛';
    else if ((m = text.match(/舌色[偏·为是]*(紫暗|舌紫|青紫)/))) f.tongue_color = '紫';
    else if ((m = text.match(/舌色[偏·为是]*(暗红)/))) f.tongue_color = '暗红';
    else if ((m = text.match(/舌色[偏·为是]*(淡红)/))) f.tongue_color = '淡红';
    if (/白苔|苔色偏白|苔白/.test(text)) f.tongue_coating = '白苔';
    else if (/黄苔|苔色偏黄|苔黄|黄厚/.test(text)) f.tongue_coating = '黄苔';
    else if (/灰苔|苔灰/.test(text)) f.tongue_coating = '灰苔';
    else if (/黑苔|苔黑/.test(text)) f.tongue_coating = '黑苔';
    else if (/剥苔|花剥|无苔|镜面/.test(text)) f.tongue_coating = '剥苔';
    else if (/腻苔|苔腻/.test(text)) f.tongue_coating = '腻苔';
    if (/裂纹|舌裂/.test(text)) { f.tongue_shape = f.tongue_shape || []; f.tongue_shape.push('裂纹'); }
    if (/胖大|舌胖/.test(text)) { f.tongue_shape = f.tongue_shape || []; f.tongue_shape.push('胖大'); }
    if (/齿痕/.test(text)) { f.tongue_shape = f.tongue_shape || []; f.tongue_shape.push('齿痕'); }
    if (/面色[偏·为是]*(白|偏白|苍白)/.test(text)) f.face_color = '白';
    else if (/面色[偏·为是]*(红|偏红|赤)/.test(text)) f.face_color = '红';
    else if (/面色[偏·为是]*(青|偏青)/.test(text)) f.face_color = '青';
    else if (/面色[偏·为是]*(黄|偏黄|萎黄)/.test(text)) f.face_color = '黄';
    else if (/面色[偏·为是]*(黑|黧黑|灰暗)/.test(text)) f.face_color = '黑';
    return f;
  }

  function renderDiagnosis(ocrResult, diagResult, features) {
    var el = $('tongueResult');
    if (!el) return;

    var diag = (diagResult && diagResult.diagnosis) || {};
    var topSyndrome = diag.syndrome || '未能识别';
    var confidence = diag.confidence || 0;
    var pct = Math.round(confidence * 100);
    var confColor = pct >= 80 ? '#38a169' : pct >= 60 ? '#d69e2e' : '#a0aec0';

    var findingsHtml = '';
    if (diag.findings && diag.findings.length) {
      findingsHtml = diag.findings.slice(0, 5).map(function (f, i) {
        var fpct = Math.round((f.score || f.base_confidence || 0) * 100);
        var fcolor = fpct >= 80 ? '#38a169' : fpct >= 60 ? '#d69e2e' : '#a0aec0';
        return '<div style="margin:4px 0;padding:6px 8px;background:rgba(255,255,255,.04);border-radius:6px">' +
          '<span style="color:#ccc;font-weight:600">' + (i + 1) + '. ' + escapeHtml(f.syndrome) + '</span>' +
          ' <span style="color:' + fcolor + ';font-size:12px;font-weight:600">' + fpct + '%</span>' +
          (f.evidence && f.evidence.length ? '<div style="font-size:11px;color:var(--muted);margin-top:2px">' +
            f.evidence.slice(0, 3).map(escapeHtml).join(' · ') + '</div>' : '') +
          '</div>';
      }).join('');
    }

    var recsHtml = '';
    if (diag.recommendations && diag.recommendations.length) {
      recsHtml = '<div style="margin-top:8px;padding:8px;background:rgba(72,187,120,.08);border-radius:6px">' +
        '<div style="font-size:12px;font-weight:600;color:#48bb78;margin-bottom:4px">📋 建议</div>' +
        diag.recommendations.slice(0, 4).map(function (r) {
          return '<div style="font-size:12px;color:#ccc;margin:2px 0">• ' + escapeHtml(r.text) + '</div>';
        }).join('') + '</div>';
    }

    var hsvBadge = diag.hsv_lbp_boost
      ? ' <span style="font-size:11px;color:#d69e2e">⚡HSV+LBP增强(' + diag.hsv_lbp_boost.applied_signals.length + '信号)</span>'
      : '';

    var ocrEngine = ocrResult.engine || 'unknown';
    var ocrEngineLabel = ocrEngine === 'offline-pil' ? 'PIL 离线兜底' : ocrEngine;

    el.innerHTML =
      '<div style="padding:8px 0">' +
      '<div style="font-size:15px;font-weight:700;color:var(--gold);margin-bottom:4px">🎯 主证：' + escapeHtml(topSyndrome) + '</div>' +
      '<div style="margin:6px 0">' +
      '<div style="display:flex;align-items:center;gap:8px">' +
      '<div style="flex:1;height:10px;background:rgba(255,255,255,.1);border-radius:5px;overflow:hidden">' +
      '<div style="width:' + pct + '%;height:100%;background:' + confColor + ';transition:width .4s"></div>' +
      '</div>' +
      '<span style="font-size:14px;font-weight:700;color:' + confColor + '">' + pct + '%</span>' +
      '</div>' +
      '<div style="font-size:11px;color:var(--muted);margin-top:2px">置信度' + hsvBadge + ' · 引擎: ' + escapeHtml(ocrEngineLabel) + '</div>' +
      '</div>' +
      '</div>' +
      (findingsHtml ? '<div style="margin-top:4px"><div style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:4px">📊 辨证排序</div>' + findingsHtml + '</div>' : '') +
      recsHtml +
      '<div style="margin-top:8px;font-size:11px;color:var(--muted)">⚠️ 本结果仅为中医筛查参考，不替代专业医师诊断</div>';

    history.unshift({
      time: new Date().toLocaleTimeString('zh-CN'),
      syndrome: topSyndrome,
      confidence: pct,
    });
    renderHistory();
  }

  function renderHistory() {
    var el = $('tongueHistory');
    if (!el || !history.length) return;
    el.innerHTML = '<div style="font-weight:600;margin-bottom:4px">📜 最近记录</div>' +
      history.slice(0, 5).map(function (h) {
        return '<div style="font-size:11px">' + h.time + ' · ' + escapeHtml(h.syndrome) + ' (' + h.confidence + '%)</div>';
      }).join('');
  }

  function init() {
    var btn = $('tongueCaptureBtn');
    var faceBtn = $('faceCaptureBtn');
    var shootBtn = $('tongueShootBtn');
    var uploadBtn = $('tongueUploadBtn');
    var closeBtn = $('tongueCloseBtn');
    var fileInput = $('tongueFileInput');

    if (btn) btn.addEventListener('click', function () { openCamera('tongue'); });
    if (faceBtn) faceBtn.addEventListener('click', function () { openCamera('face'); });
    if (shootBtn) shootBtn.addEventListener('click', shootPhoto);
    if (uploadBtn) uploadBtn.addEventListener('click', uploadFile);
    if (closeBtn) closeBtn.addEventListener('click', closeCamera);
    if (fileInput) fileInput.addEventListener('change', onFileSelected);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
