/**
 * 命理宝鉴 语音交互模块 (G2)
 * - 语音输入：Web Speech API (浏览器原生)
 * - 语音输出：Edge-TTS (后端 8912 端口)
 * - 语音命令：导航 + 排盘 + 运势查询
 * 商用时替换 ASR/TTS SDK 即可，接口层不变
 */
(function(){
'use strict';

const TTS_BASE = '/api/tts';
const currentVoice = 'female';
const currentAudio = null;

// ========== TTS 语音输出 ==========
window.speakText = function(text, opts){
  opts = opts || {};
  if(!text || text.length === 0) return;
  let voice = opts.voice || currentVoice;
  // 停止当前播放
  if(currentAudio){currentAudio.pause();currentAudio = null;}
  let url = TTS_BASE + '?text=' + encodeURIComponent(text.substring(0, 2000)) + '&voice=' + voice;
  currentAudio = new Audio(url);
  currentAudio.onended = function(){currentAudio = null; if(opts.onend) opts.onend();};
  currentAudio.onerror = function(){currentAudio = null; if(opts.onerror) opts.onerror('TTS播放失败');};
  currentAudio.play().catch(function(){ if(opts.onerror) opts.onerror('浏览器阻止了自动播放，请点击播放按钮');});
  return currentAudio;
};

window.stopSpeak = function(){
  if(currentAudio){currentAudio.pause();currentAudio = null;}
};

window.setVoice = function(v){currentVoice = v;};
window.getVoice = function(){return currentVoice;};

// ========== 语音输入 (ASR) ==========
const recognition = null;
const isListening = false;
const listeningTarget = null;

function initRecognition(){
  let SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR) return null;
  let r = new SR();
  r.lang = 'zh-CN';
  r.continuous = false;
  r.interimResults = true;
  r.maxAlternatives = 3;
  return r;
}

window.startVoiceInput = function(targetId, opts){
  opts = opts || {};
  if(isListening){stopVoiceInput(); return;}
  recognition = initRecognition();
  if(!recognition){
    showToast('您的浏览器不支持语音输入，请使用 Chrome 或 Edge 浏览器', 'warning');
    return;
  }
  listeningTarget = targetId;
  let target = document.getElementById(targetId);
  let btn = document.getElementById(targetId + '_mic') || document.querySelector('[data-mic="' + targetId + '"]');
  if(btn) btn.classList.add('recording');

  isListening = true;
  if(btn) btn.innerHTML = '🔴';

  const finalText = '';

  recognition.onresult = function(event){
    const interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++){
      if(event.results[i].isFinal){
        finalText += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    if(target){
      if(opts.isDate){
        let parsed = parseVoiceDate(finalText + interim);
        if(parsed) target.value = parsed;
        else target.value = finalText + interim;
      } else if(opts.append && target.value){
        target.value = target.value + finalText + interim;
      } else {
        target.value = finalText + interim;
      }
    }
  };

  recognition.onerror = function(event){
    const msg = '语音识别失败';
    if(event.error === 'no-speech') msg = '未检测到语音，请重试';
    else if(event.error === 'not-allowed') msg = '请允许浏览器使用麦克风';
    else if(event.error === 'network') msg = '网络错误，请检查连接';
    showToast(msg, 'error');
  };

  recognition.onend = function(){
    isListening = false;
    if(btn){btn.classList.remove('recording'); btn.innerHTML = '🎤';}
    if(opts.onend) opts.onend(finalText);
    // 自动触发按钮
    if(opts.autoSubmit && finalText){
      let submitBtn = document.getElementById(opts.autoSubmit);
      if(submitBtn) submitBtn.click();
    }
    recognition = null;
  };

  recognition.start();
};

window.stopVoiceInput = function(){
  if(recognition){recognition.stop();}
  isListening = false;
};

window.isVoiceListening = function(){return isListening;};

// ========== 语音日期解析 ==========
function parseVoiceDate(text){
  if(!text) return null;
  text = text.replace(/\s/g, '');

  // "1979年6月15日酉时"
  let m = text.match(/(\d{4})\s*年\s*(\d{1,2})\s*[月]\s*(\d{1,2})\s*[日号]/);
  if(!m) return null;
  let y = m[1], mo = m[2], d = m[3];

  // 时辰解析
  const zhiMap = {子:23,丑:1,寅:3,卯:5,辰:7,巳:9,午:11,未:13,申:15,酉:17,戌:19,亥:21};
  const hour = -1;
  for (let z in zhiMap){
    if(text.indexOf(z + '时') > -1 || text.indexOf(z + '刻') > -1){
      hour = zhiMap[z]; break;
    }
  }
  // 也支持直接说"17点"或"下午5点"
  if(hour < 0){
    let hm = text.match(/(\d{1,2})\s*[点时:：]/);
    if(hm) hour = parseInt(hm[1]);
    let pm = text.match(/下午\s*(\d{1,2})/);
    if(pm) hour = parseInt(pm[1]) + 12;
  }

  let result = y + '-' + String(mo).padStart(2,'0') + '-' + String(d).padStart(2,'0');
  if(hour >= 0) result += 'T' + String(hour).padStart(2,'0') + ':00';
  return result;
}
window.parseVoiceDate = parseVoiceDate;

// ========== 语音命令系统 ==========
window.startVoiceCommand = function(){
  if(isListening){stopVoiceInput(); return;}
  recognition = initRecognition();
  if(!recognition){
    showToast('您的浏览器不支持语音输入，请使用 Chrome 或 Edge', 'warning');
    return;
  }
  isListening = true;
  showToast('🎤 正在聆听...说出您的指令', 'info');

  recognition.onresult = function(event){
    const text = '';
    for (let i = 0; i < event.results.length; i++){
      if(event.results[i].isFinal) text += event.results[i][0].transcript;
    }
    if(text) executeVoiceCommand(text);
  };
  recognition.onerror = function(event){
    showToast('语音识别失败: ' + event.error, 'error');
  };
  recognition.onend = function(){
    isListening = false;
    recognition = null;
  };
  recognition.start();
};

function executeVoiceCommand(text){
  text = text.replace(/\s/g, '');
  showToast('🗣️ ' + text, 'info');

  // 导航命令
  let navMap = {
    '八字': 'nav-bazi', '排盘': 'nav-bazi', '四柱': 'nav-bazi',
    '紫微': 'nav-ziwei', '紫微斗数': 'nav-ziwei',
    '奇门': 'nav-qimen', '奇门遁甲': 'nav-qimen',
    '六爻': 'nav-liuyao', '起卦': 'nav-liuyao',
    '梅花': 'nav-meihua', '梅花易数': 'nav-meihua',
    '六壬': 'nav-liuren', '大六壬': 'nav-liuren',
    '风水': 'nav-fengshui',
    '测字': 'nav-cezi',
    '择日': 'nav-zeri', '择吉': 'nav-zeri',
    '姓名': 'nav-xingming', '起名': 'nav-xingming',
    '运势': 'nav-fortune', '今日运势': 'nav-fortune',
    '黄历': 'nav-almanac', '老黄历': 'nav-almanac',
    '知识库': 'nav-knowledge', '倪海厦': 'nav-knowledge',
    '舒晗': 'nav-shuhan',
  };

  for (let key in navMap){
    if(text.indexOf(key) > -1){
      let el = document.getElementById(navMap[key]);
      if(el){el.click(); showToast('已切换到' + key, 'success'); return;}
    }
  }

  // 运势查询
  if(text.indexOf('今天') > -1 && (text.indexOf('运势') > -1 || text.indexOf('宜') > -1 || text.indexOf('忌') > -1)){
    let fortuneEl = document.getElementById('nav-fortune');
    if(fortuneEl) fortuneEl.click();
    setTimeout(function(){speakText('正在为您查看今日运势');}, 500);
    return;
  }

  // 朗读命令
  if(text.indexOf('朗读') > -1 || text.indexOf('读一下') > -1 || text.indexOf('念') > -1){
    let activePanel = document.querySelector('.section.active') || document.querySelector('.panel.active');
    if(activePanel){
      let t = activePanel.innerText.substring(0, 500);
      speakText(t);
      showToast('开始朗读', 'success');
    } else {
      showToast('没有可朗读的内容', 'warning');
    }
    return;
  }

  // 停止朗读
  if(text.indexOf('停止') > -1 || text.indexOf('停下') > -1 || text.indexOf('安静') > -1){
    stopSpeak();
    showToast('已停止', 'success');
    return;
  }

  // 未匹配
  showToast('未识别指令: ' + text + '。可尝试说"打开八字"、"今日运势"、"朗读"', 'warning');
}

// ========== UI 注入：麦克风按钮 + 播放按钮 ==========
window.injectVoiceUI = function(){
  // 在排盘输入区添加麦克风按钮
  let dateInput = document.getElementById('birthDate');
  if(dateInput && !document.getElementById('birthDate_mic')){
    let mic = document.createElement('button');
    mic.id = 'birthDate_mic';
    mic.setAttribute('data-mic', 'birthDate');
    mic.innerHTML = '🎤';
    mic.title = '语音输入出生日期';
    mic.style.cssText = 'position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:18px;cursor:pointer;z-index:10;opacity:.6;transition:opacity .2s';
    mic.onmouseover = function(){this.style.opacity = '1';};
    mic.onmouseout = function(){this.style.opacity = '.6';};
    mic.onclick = function(e){
      e.preventDefault();
      startVoiceInput('birthDate', {isDate: true, autoSubmit: 'paipanBtn'});
    };
    // 包装input
    let wrapper = dateInput.parentElement;
    if(wrapper && wrapper.style.position !== 'relative'){
      wrapper.style.position = 'relative';
    }
    wrapper.appendChild(mic);
  }

  // 在问题输入区添加麦克风
  let qInputs = document.querySelectorAll('input[placeholder*="问"], input[placeholder*="想"], textarea[placeholder*="问"]');
  qInputs.forEach(function(inp){
    if(inp.id && !document.getElementById(inp.id + '_mic')){
      let mic = document.createElement('button');
      mic.id = inp.id + '_mic';
      mic.innerHTML = '🎤';
      mic.title = '语音输入';
      mic.style.cssText = 'position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:18px;cursor:pointer;z-index:10;opacity:.6';
      mic.onclick = function(e){
        e.preventDefault();
        startVoiceInput(inp.id, {autoSubmit: inp.id.replace('Input', 'Btn')});
      };
      let wrapper = inp.parentElement;
      if(wrapper && wrapper.style.position !== 'relative') wrapper.style.position = 'relative';
      wrapper.appendChild(mic);
    }
  });

  // 在结果区添加朗读按钮
  let resultAreas = document.querySelectorAll('[id$="Result"], [id$="ResultArea"]');
  resultAreas.forEach(function(area){
    if(area.id && !document.getElementById(area.id + '_speak')){
      let speak = document.createElement('button');
      speak.id = area.id + '_speak';
      speak.innerHTML = '🔊 朗读';
      speak.style.cssText = 'display:inline-block;padding:4px 12px;margin:4px 0;background:rgba(201,168,76,.12);border:1px solid rgba(201,168,76,.3);border-radius:6px;color:var(--gold);cursor:pointer;font-size:12px;font-family:inherit';
      speak.onclick = function(){
        let text = area.innerText.substring(0, 500);
        if(text.length > 10){
          speakText(text);
          speak.innerHTML = '⏸️ 停止';
          setTimeout(function(){speak.innerHTML = '🔊 朗读';}, 3000);
        } else {
          showToast('没有足够的内容可朗读', 'warning');
        }
      };
      // 插入到结果区前面
      area.parentElement.insertBefore(speak, area);
    }
  });

  // 全局语音命令按钮（浮动）
  if(!document.getElementById('voiceCommandFab')){
    let fab = document.createElement('button');
    fab.id = 'voiceCommandFab';
    fab.innerHTML = '🎤';
    fab.title = '语音命令（说"打开八字"、"今日运势"、"朗读"等）';
    fab.style.cssText = 'position:fixed;bottom:80px;right:20px;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#c9a84c,#b8932f);border:none;color:#1a1e14;font-size:24px;cursor:pointer;z-index:9999;box-shadow:0 4px 16px rgba(201,168,76,.4);transition:all .25s';
    fab.onmouseover = function(){this.style.transform = 'scale(1.1)';};
    fab.onmouseout = function(){this.style.transform = 'scale(1)';};
    fab.onclick = function(){startVoiceCommand();};
    document.body.appendChild(fab);
  }

  // 声线切换
  if(!document.getElementById('voiceSelector')){
    let sel = document.createElement('select');
    sel.id = 'voiceSelector';
    sel.style.cssText = 'position:fixed;bottom:80px;right:80px;padding:4px 8px;border-radius:6px;border:1px solid rgba(201,168,76,.3);background:rgba(26,30,20,.9);color:var(--gold);font-size:11px;z-index:9999;cursor:pointer';
    sel.innerHTML = '<option value="female">晓晓</option><option value="male">云扬</option><option value="female2">晓辰</option><option value="female3">晓涵</option><option value="male2">云枫</option>';
    sel.onchange = function(){setVoice(this.value); showToast('声线已切换', 'success');};
    document.body.appendChild(sel);
  }
};

// 自动注入
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', function(){setTimeout(injectVoiceUI, 2000);});
} else {
  setTimeout(injectVoiceUI, 2000);
}

// 延迟二次注入（等动态内容加载）
setTimeout(function(){injectVoiceUI();}, 5000);
setTimeout(function(){injectVoiceUI();}, 10000);

// console.log('🎙️ 语音交互模块已加载 (Web Speech API + Edge-TTS)');
})();
