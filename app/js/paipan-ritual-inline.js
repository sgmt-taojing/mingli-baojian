/* ===== R89-P2 排盘仪式感：全屏太极旋转 + 进度 + 音效 ===== */
(function () {
  'use strict';
  let _active = false;
  let _audioCtx = null;

  function playChime() {
    try {
      _audioCtx = _audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      // 五声音阶：宫商角徵羽（C D E G A）
      var notes = [523.25, 587.33, 659.25, 783.99, 880];
      notes.forEach(function (freq, i) {
        var osc = _audioCtx.createOscillator();
        var gain = _audioCtx.createGain();
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, _audioCtx.currentTime + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.15, _audioCtx.currentTime + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + i * 0.12 + 1.8);
        osc.connect(gain);
        gain.connect(_audioCtx.destination);
        osc.start(_audioCtx.currentTime + i * 0.12);
        osc.stop(_audioCtx.currentTime + i * 0.12 + 2.0);
      });
    } catch (e) { /* silent */ }
  }

  function show(onComplete) {
    if (_active) return;
    _active = true;
    var overlay = document.createElement('div');
    overlay.id = 'paipanRitual';
    overlay.className = 'paipan-ritual';
    overlay.innerHTML =
      '<div class="ritual-bg"></div>' +
      '<div class="ritual-compass">' +
        '<svg viewBox="0 0 300 300" class="ritual-svg">' +
          '<defs>' +
            '<radialGradient id="rg-core" cx="50%" cy="50%" r="50%">' +
              '<stop offset="0%" stop-color="#c9a84c" stop-opacity="0.8"/>' +
              '<stop offset="100%" stop-color="#0a0a0a" stop-opacity="0"/>' +
            '</radialGradient>' +
          '</defs>' +
          '<circle cx="150" cy="150" r="140" fill="none" stroke="rgba(201,168,76,0.15)" stroke-width="0.5"/>' +
          '<circle cx="150" cy="150" r="120" fill="none" stroke="rgba(201,168,76,0.1)" stroke-width="0.5" stroke-dasharray="2 8"/>' +
          '<g class="ritual-bagua">' +
            '<circle cx="150" cy="150" r="100" fill="none" stroke="rgba(201,168,76,0.2)" stroke-width="0.5"/>' +
            '<text x="150" y="65" class="ritual-gua" text-anchor="middle">乾</text>' +
            '<text x="195" y="105" class="ritual-gua" text-anchor="middle">兑</text>' +
            '<text x="210" y="150" class="ritual-gua" text-anchor="middle">离</text>' +
            '<text x="195" y="195" class="ritual-gua" text-anchor="middle">震</text>' +
            '<text x="105" y="195" class="ritual-gua" text-anchor="middle">巽</text>' +
            '<text x="90" y="150" class="ritual-gua" text-anchor="middle">坎</text>' +
            '<text x="105" y="105" class="ritual-gua" text-anchor="middle">艮</text>' +
            '<text x="150" y="235" class="ritual-gua" text-anchor="middle">坤</text>' +
          '</g>' +
          '<g transform="translate(150 150)">' +
            '<circle r="60" fill="url(#rg-core)"/>' +
            '<path class="ry-yang" d="M 0,-45 A 45,45 0 0 1 0,45 A 22.5,22.5 0 0 1 0,0 A 22.5,22.5 0 0 0 0,-45 Z" fill="#f3ead0"/>' +
            '<path class="ry-yin" d="M 0,-45 A 45,45 0 0 0 0,45 A 22.5,22.5 0 0 0 0,0 A 22.5,22.5 0 0 1 0,-45 Z" fill="#1a1a1a" stroke="#c9a84c" stroke-width="0.4"/>' +
            '<circle cy="-22.5" r="5" fill="#1a1a1a"/>' +
            '<circle cy="22.5" r="5" fill="#f3ead0"/>' +
          '</g>' +
        '</svg>' +
      '</div>' +
      '<div class="ritual-text">' +
        '<div class="ritual-title" id="ritualTitle">排盘起卦中</div>' +
        '<div class="ritual-dots"><span>·</span><span>·</span><span>·</span></div>' +
        '<div class="ritual-progress"><div class="ritual-bar" id="ritualBar"></div></div>' +
        '<div class="ritual-hint" id="ritualHint">天机推演 · 请稍候</div>' +
      '</div>';
    document.body.appendChild(overlay);
    // 强制 reflow
    void overlay.offsetHeight;
    overlay.classList.add('active');
    // 音效
    playChime();
    // 进度条动画
    var bar = overlay.querySelector('#ritualBar');
    var hint = overlay.querySelector('#ritualHint');
    var title = overlay.querySelector('#ritualTitle');
    var phases = [
      { p: 20, t: '排盘起卦中', h: '天机推演 · 请稍候' },
      { p: 45, t: '八字排列', h: '四柱八字 · 天干地支' },
      { p: 70, t: '五行分析', h: '金木水火土 · 生克制化' },
      { p: 90, t: '综合推演', h: '神煞 · 十神 · 大运' },
      { p: 100, t: '推演完成', h: '天人合一 · 万象归道' }
    ];
    var pi = 0;
    function tick() {
      if (pi >= phases.length) {
        setTimeout(function () { hide(onComplete); }, 400);
        return;
      }
      var ph = phases[pi];
      if (bar) bar.style.width = ph.p + '%';
      if (title) title.textContent = ph.t;
      if (hint) hint.textContent = ph.h;
      pi++;
      setTimeout(tick, 450);
    }
    tick();
  }

  function hide(onComplete) {
    var overlay = document.getElementById('paipanRitual');
    if (!overlay) { _active = false; return; }
    overlay.classList.remove('active');
    overlay.classList.add('closing');
    setTimeout(function () {
      overlay.remove();
      _active = false;
      if (typeof onComplete === 'function') onComplete();
    }, 600);
  }

  // 暴露
  window.PaipanRitual = { show: show, hide: hide };
})();
