// ================================================================
// R89-O 排盘冥想模块 · 仪式感
// ================================================================
// 触发时机：generateReport 启动前，慢路径排盘模块
// 视觉：全屏暗背景 + 中心呼吸圆 + 五行流转文字 + 「跳过」按钮
// 时长：约 18 秒（3 轮深呼吸 × 6 秒/轮）
// ================================================================

(function(){
  if (window.Meditation) return;
  var STEPS = [
    { breath: '吸气', sec: 3, color: 'rgba(201,168,76,0.7)' },
    { breath: '屏息', sec: 2, color: 'rgba(147,51,234,0.7)' },
    { breath: '呼气', sec: 3, color: 'rgba(16,185,129,0.7)' }
  ];
  var TOTAL_ROUNDS = 3;
  var finished = false;
  var onDone = null;

  var overlay = null;
  var circle = null;
  var label = null;
  var stepLabel = null;
  var skipBtn = null;

  function makeOverlay(){
    overlay = document.createElement('div');
    overlay.id = 'meditationOverlay';
    overlay.style.cssText = [
      'position:fixed','inset:0','z-index:99999',
      'background:radial-gradient(circle at 50% 50%, #1a0f1f 0%, #08050a 100%)',
      'display:flex','flex-direction:column','align-items:center','justify-content:center',
      'opacity:0','transition:opacity 0.6s','font-family:serif'
    ].join(';');

    circle = document.createElement('div');
    circle.style.cssText = [
      'width:140px','height:140px','border-radius:50%',
      'background:radial-gradient(circle, rgba(201,168,76,0.6) 0%, rgba(147,51,234,0.1) 70%, transparent 100%)',
      'transform:scale(0.5)','transition:transform 3s cubic-bezier(0.4,0,0.6,1)',
      'box-shadow:0 0 60px rgba(201,168,76,0.4)'
    ].join(';');

    label = document.createElement('div');
    label.style.cssText = [
      'margin-top:32px','font-size:24px','color:#c9a84c','font-weight:300',
      'letter-spacing:8px','min-height:32px'
    ].join(';');

    stepLabel = document.createElement('div');
    stepLabel.style.cssText = [
      'margin-top:14px','font-size:13px','color:rgba(255,255,255,0.5)',
      'letter-spacing:4px','min-height:18px'
    ].join(';');

    skipBtn = document.createElement('button');
    skipBtn.textContent = '跳过 ✕';
    skipBtn.style.cssText = [
      'position:absolute','top:24px','right:24px',
      'background:rgba(255,255,255,0.06)','border:1px solid rgba(255,255,255,0.2)',
      'color:rgba(255,255,255,0.6)','padding:6px 14px','border-radius:14px',
      'cursor:pointer','font-size:12px','font-family:inherit'
    ].join(';');
    skipBtn.onclick = skip;

    overlay.appendChild(circle);
    overlay.appendChild(label);
    overlay.appendChild(stepLabel);
    overlay.appendChild(skipBtn);
    document.body.appendChild(overlay);

    requestAnimationFrame(function(){
      overlay.style.opacity = '1';
    });
  }

  function setText(breath, sec, color, round){
    label.textContent = breath;
    label.style.color = color;
    stepLabel.textContent = '第 ' + round + ' / ' + TOTAL_ROUNDS + ' 轮 · 共 ' + sec + ' 秒';
    var scale = breath === '吸气' ? 1.3 : breath === '呼气' ? 0.55 : 1.0;
    circle.style.transform = 'scale(' + scale + ')';
    circle.style.background = 'radial-gradient(circle, ' + color + ' 0%, transparent 70%)';
  }

  function sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }

  async function run(){
    for (var r = 1; r <= TOTAL_ROUNDS; r++) {
      if (finished) return;
      for (var i = 0; i < STEPS.length; i++) {
        if (finished) return;
        var s = STEPS[i];
        setText(s.breath, s.sec, s.color, r);
        await sleep(s.sec * 1000);
      }
    }
    finish();
  }

  function finish(){
    if (finished) return;
    finished = true;
    overlay.style.opacity = '0';
    setTimeout(function(){
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      overlay = null;
      if (typeof onDone === 'function') onDone();
      onDone = null;
    }, 600);
  }

  function skip(){
    finish();
  }

  window.Meditation = {
    start: function(opts){
      opts = opts || {};
      onDone = opts.onComplete || function(){};
      finished = false;
      makeOverlay();
      run();
    },
    skip: skip,
    forceClose: finish
  };
})();