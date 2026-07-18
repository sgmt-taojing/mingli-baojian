/**
 * 移动端语音交互优化模块 (G2-Mobile)
 * 针对微信浏览器和移动端信众场景优化
 * - 微信检测+引导跳浏览器
 * - 语音快捷入口（首页悬浮+底部导航）
 * - 语音播报每日运势/黄历
 * - 简化语音命令（"算八字"/"看运势"/"查黄历"）
 * - 排盘结果语音摘要（前200字）
 */
(function(){
'use strict';

const TTS_BASE = '/api/tts';
const currentVoice = 'female';
const currentAudio = null;
let isWechat = /MicroMessenger/i.test(navigator.userAgent);
let isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// ========== 移动端适配 ==========

// 微信浏览器引导
function showWechatGuide(){
  if(!isWechat) return;
  if(sessionStorage.getItem('wechat_guide_shown')) return;
  sessionStorage.setItem('wechat_guide_shown', '1');
  
  let guide = document.createElement('div');
  guide.id = 'wechatVoiceGuide';
  guide.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.85);z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px';
  guide.innerHTML = '<div style="background:linear-gradient(135deg,#2c2823,#1a1814);border:1px solid rgba(201,168,76,.3);border-radius:16px;padding:28px 24px;max-width:320px;text-align:center">'+
    '<div style="font-size:48px;margin-bottom:12px">🎤</div>'+
    '<h3 style="color:#c9a84c;font-size:17px;margin-bottom:10px;letter-spacing:2px">语音功能需要浏览器支持</h3>'+
    '<p style="color:#8a8275;font-size:13px;line-height:1.8;margin-bottom:16px">微信内置浏览器不支持语音识别。<br>请点击右上角 <b style="color:#c9a84c">···</b> → 选择 <b style="color:#c9a84c">在浏览器中打开</b> 即可使用语音算命功能。</p>'+
    '<button onclick="this.parentElement.parentElement.remove()" style="background:linear-gradient(135deg,#c9a84c,#b8932f);border:none;color:#1a1e14;padding:10px 32px;border-radius:20px;font-size:14px;cursor:pointer;font-family:inherit">我知道了</button>'+
    '</div>';
  document.body.appendChild(guide);
}

// ========== TTS 语音输出 ==========
window.mobileSpeak = function(text, opts){
  opts = opts || {};
  if(!text) return;
  if(currentAudio){currentAudio.pause(); currentAudio = null;}
  
  let voice = opts.voice || currentVoice;
  let url = TTS_BASE + '?text=' + encodeURIComponent(text.substring(0, 500)) + '&voice=' + voice;
  
  // 显示播放控件
  showPlayer(text.substring(0, 50) + '...', function(){
    currentAudio = new Audio(url);
    currentAudio.onended = function(){currentAudio = null; hidePlayer(); if(opts.onend) opts.onend();};
    currentAudio.onerror = function(){currentAudio = null; hidePlayer();};
    currentAudio.play();
  });
  return currentAudio;
};

window.mobileStopSpeak = function(){
  if(currentAudio){currentAudio.pause(); currentAudio = null;}
  hidePlayer();
};

function showPlayer(label, onReady){
  let existing = document.getElementById('mobilePlayer');
  if(existing) existing.remove();
  
  let player = document.createElement('div');
  player.id = 'mobilePlayer';
  player.style.cssText = 'position:fixed;bottom:70px;left:12px;right:12px;background:linear-gradient(135deg,#2c2823,#1a1814);border:1px solid rgba(201,168,76,.3);border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:12px;z-index:9998;box-shadow:0 4px 20px rgba(0,0,0,.4)';
  player.innerHTML = '<div style="font-size:20px">🔊</div>'+
    '<div style="flex:1;font-size:12px;color:#c9a84c;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+label+'</div>'+
    '<button onclick="mobileStopSpeak()" style="background:none;border:none;color:#8a8275;font-size:18px;cursor:pointer;padding:4px">✕</button>';
  document.body.appendChild(player);
  if(onReady) onReady();
}

function hidePlayer(){
  let p = document.getElementById('mobilePlayer');
  if(p) p.remove();
}

// ========== 语音输入 (ASR) ==========
const recognition = null;
const isListening = false;

window.mobileVoiceInput = function(targetId, opts){
  opts = opts || {};
  
  if(isWechat){
    showWechatGuide();
    return;
  }
  
  if(isListening){stopVoice(); return;}
  
  let SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){
    showToast('您的浏览器不支持语音输入，请使用Chrome或Safari浏览器', 'warning');
    return;
  }
  
  recognition = new SR();
  recognition.lang = 'zh-CN';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 3;
  
  isListening = true;
  let btn = document.getElementById(targetId + '_mic') || document.querySelector('[data-mic="' + targetId + '"]');
  if(btn){btn.innerHTML = '🔴'; btn.classList.add('recording');}
  
  showListeningOverlay();
  
  const finalText = '';
  let target = document.getElementById(targetId);
  
  recognition.onresult = function(event){
    const interim = '';
    for(var i = event.resultIndex; i < event.results.length; i++){
      if(event.results[i].isFinal){
        finalText += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    updateListeningOverlay(finalText + interim);
    
    if(target){
      if(opts.isDate){
        let parsed = parseVoiceDate(finalText + interim);
        target.value = parsed || (finalText + interim);
      } else {
        target.value = finalText + interim;
      }
    }
  };
  
  recognition.onerror = function(event){
    hideListeningOverlay();
    const msg = '语音识别失败';
    if(event.error === 'no-speech') msg = '没有听到声音，请大声一点';
    else if(event.error === 'not-allowed') msg = '请允许使用麦克风';
    showToast(msg, 'error');
  };
  
  recognition.onend = function(){
    isListening = false;
    hideListeningOverlay();
    if(btn){btn.innerHTML = '🎤'; btn.classList.remove('recording');}
    if(opts.onend) opts.onend(finalText);
    if(opts.autoSubmit && finalText){
      let submitBtn = document.getElementById(opts.autoSubmit);
      if(submitBtn) submitBtn.click();
    }
    recognition = null;
  };
  
  recognition.start();
};

function stopVoice(){
  if(recognition) recognition.stop();
  isListening = false;
  hideListeningOverlay();
}

// 听写浮层
function showListeningOverlay(){
  let ov = document.createElement('div');
  ov.id = 'voiceOverlay';
  ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.7);z-index:99997;display:flex;flex-direction:column;align-items:center;justify-content:center';
  ov.innerHTML = '<div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#c9a84c,#b8932f);display:flex;align-items:center;justify-content:center;font-size:36px;animation:pulse 1.5s infinite;margin-bottom:16px">🎤</div>'+
    '<div id="voiceText" style="color:#c9a84c;font-size:14px;max-width:280px;text-align:center;min-height:20px">正在聆听...</div>'+
    '<div style="color:#8a8275;font-size:12px;margin-top:12px">说出您的出生日期，如"1979年6月15日酉时"</div>'+
    '<button onclick="window._stopMobileVoice()" style="margin-top:16px;background:none;border:1px solid rgba(201,168,76,.3);color:#c9a84c;padding:6px 20px;border-radius:16px;font-size:12px;cursor:pointer">停止</button>';
  document.body.appendChild(ov);
  if(!document.getElementById('voicePulseStyle')){
    let s = document.createElement('style');
    s.id = 'voicePulseStyle';
    s.textContent = '@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.1);opacity:.8}}';
    document.head.appendChild(s);
  }
}

function updateListeningOverlay(text){
  let el = document.getElementById('voiceText');
  if(el) el.textContent = text || '正在聆听...';
}

function hideListeningOverlay(){
  let ov = document.getElementById('voiceOverlay');
  if(ov) ov.remove();
}

window._stopMobileVoice = stopVoice;

// ========== 语音日期解析 ==========
function parseVoiceDate(text){
  if(!text) return null;
  text = text.replace(/\s/g, '');
  let m = text.match(/(\d{4})\s*年\s*(\d{1,2})\s*[月]\s*(\d{1,2})\s*[日号]/);
  if(!m) return null;
  let y = m[1], mo = m[2], d = m[3];
  const zhiMap = {子:23,丑:1,寅:3,卯:5,辰:7,巳:9,午:11,未:13,申:15,酉:17,戌:19,亥:21};
  const hour = -1;
  for(var z in zhiMap){
    if(text.indexOf(z + '时') > -1){hour = zhiMap[z]; break;}
  }
  if(hour < 0){
    let hm = text.match(/(\d{1,2})\s*[点时:：]/);
    if(hm) hour = parseInt(hm[1]);
  }
  let result = y + '-' + String(mo).padStart(2,'0') + '-' + String(d).padStart(2,'0');
  if(hour >= 0) result += 'T' + String(hour).padStart(2,'0') + ':00';
  return result;
}

// ========== 移动端语音命令入口 ==========
window.mobileVoiceCommand = function(){
  if(isWechat){
    showWechatGuide();
    return;
  }
  
  if(isListening){stopVoice(); return;}
  
  let SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){
    showToast('您的浏览器不支持语音输入，请使用Chrome或Safari', 'warning');
    return;
  }
  
  recognition = new SR();
  recognition.lang = 'zh-CN';
  recognition.continuous = false;
  recognition.interimResults = false;
  
  isListening = true;
  showListeningOverlay();
  
  recognition.onresult = function(event){
    const text = '';
    for(var i = 0; i < event.results.length; i++){
      if(event.results[i].isFinal) text += event.results[i][0].transcript;
    }
    if(text) executeCommand(text);
  };
  
  recognition.onerror = function(event){
    hideListeningOverlay();
    showToast('语音识别失败: ' + event.error, 'error');
  };
  
  recognition.onend = function(){
    isListening = false;
    hideListeningOverlay();
    recognition = null;
  };
  
  recognition.start();
};

function executeCommand(text){
  text = text.replace(/\s/g, '');
  
  // 简化命令映射 — 信众自然语言
  var commands = [
    // 排盘类
    {keys:['八字','排盘','算命','四柱'], action:function(){openMobileTool('bazi');}},
    {keys:['紫微','斗数'], action:function(){openMobileTool('zhanbu-ziwei');}},
    {keys:['奇门','遁甲'], action:function(){openMobileTool('zhanbu-qimen');}},
    {keys:['六爻','起卦','占卜'], action:function(){openMobileTool('zhanbu-yijing');}},
    {keys:['梅花','易数'], action:function(){openMobileTool('zhanbu-meihua');}},
    {keys:['六壬','神课'], action:function(){openMobileTool('zhanbu-liuren');}},
    {keys:['测字'], action:function(){openMobileTool('cezi');}},
    {keys:['姓名','取名','改名'], action:function(){openMobileTool('xingming');}},
    {keys:['手机号','号码'], action:function(){openMobileTool('yanzhi');}},
    {keys:['风水','户型','阳宅'], action:function(){openMobileTool('fengshui');}},
    // 生活类
    {keys:['黄历','老黄历','宜忌'], action:function(){openMobileTool('huangli');}},
    {keys:['吉日','择日','好日子'], action:function(){openMobileTool('jiuri');}},
    {keys:['化解','开运'], action:function(){openMobileTool('huajie');}},
    {keys:['甲子','六十甲子'], action:function(){openMobileTool('jiazi');}},
    // 知识类
    {keys:['倪海厦','倪师','中医'], action:function(){window.location.href='nihaisha-knowledge.html';}},
    {keys:['舒晗','奇门知识'], action:function(){window.location.href='shuhan-knowledge.html';}},
    {keys:['学习','课程'], action:function(){window.location.href='nihaisha-learning.html';}},
    // 朗读类
    {keys:['朗读','读一下','念'], action:function(){readCurrentPage();}},
    {keys:['停止','停下','安静'], action:function(){mobileStopSpeak();}},
  ];
  
  for(var i = 0; i < commands.length; i++){
    for(var j = 0; j < commands[i].keys.length; j++){
      if(text.indexOf(commands[i].keys[j]) > -1){
        commands[i].action();
        return;
      }
    }
  }
  
  showToast('未识别指令: "' + text + '"\n可尝试说: "算八字"、"看黄历"、"查运势"、"倪海厦"', 'info');
}

function openMobileTool(toolKey){
  if(typeof openTool === 'function'){
    openTool(toolKey);
  } else {
    window.location.href = 'divination-hub.html#tool-' + toolKey;
  }
}

function readCurrentPage(){
  let active = document.querySelector('.tab-content.active') || document.querySelector('.panel.active') || document.body;
  let text = active.innerText.substring(0, 500);
  if(text.length > 20){
    mobileSpeak(text);
  }
}

// ========== UI 注入 ==========

function injectMobileVoiceUI(){
  if(!isMobile) return;
  
  // 底部导航栏添加语音按钮
  let tabBar = document.querySelector('.tab-bar');
  if(tabBar && !document.getElementById('voiceTabBtn')){
    let voiceTab = document.createElement('button');
    voiceTab.id = 'voiceTabBtn';
    voiceTab.className = 'tab';
    voiceTab.style.cssText = 'flex:0.8;background:linear-gradient(135deg,rgba(201,168,76,.15),rgba(201,168,76,.05));position:relative';
    voiceTab.innerHTML = '<span class="tab-icon" style="font-size:24px">🎤</span>语音';
    voiceTab.onclick = function(e){
      e.preventDefault();
      mobileVoiceCommand();
    };
    // 插入到第3个位置（排盘/生活之后）
    let tabs = tabBar.querySelectorAll('.tab');
    if(tabs.length >= 2){
      tabBar.insertBefore(voiceTab, tabs[2]);
    } else {
      tabBar.appendChild(voiceTab);
    }
  }
  
  // 排盘输入区添加麦克风（在iframe内，延迟注入）
  setTimeout(function(){injectMicToInputs();}, 3000);
  setTimeout(function(){injectMicToInputs();}, 6000);
}

function injectMicToInputs(){
  // 在iframe内注入
  let iframe = document.getElementById('toolFrame');
  if(iframe && iframe.contentDocument){
    try{
      let doc = iframe.contentDocument;
      let dateInput = doc.getElementById('birthDate');
      if(dateInput && !doc.getElementById('birthDate_mic')){
        let mic = doc.createElement('button');
        mic.id = 'birthDate_mic';
        mic.innerHTML = '🎤';
        mic.style.cssText = 'position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:20px;cursor:pointer;z-index:10';
        mic.onclick = function(e){
          e.preventDefault();
          // 通过postMessage通信
          iframe.contentWindow.postMessage({type:'voiceInput', target:'birthDate', isDate:true}, '*');
        };
        dateInput.parentElement.style.position = 'relative';
        dateInput.parentElement.appendChild(mic);
      }
    }catch(e){/* cross-origin */}
  }
  
  // 非iframe模式（直接在当前页面）
  let dateInput = document.getElementById('birthDate');
  if(dateInput && !document.getElementById('birthDate_mic')){
    let mic = document.createElement('button');
    mic.id = 'birthDate_mic';
    mic.innerHTML = '🎤';
    mic.style.cssText = 'position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:20px;cursor:pointer;z-index:10';
    mic.onclick = function(e){
      e.preventDefault();
      mobileVoiceInput('birthDate', {isDate:true, autoSubmit:'paipanBtn'});
    };
    dateInput.parentElement.style.position = 'relative';
    dateInput.parentElement.appendChild(mic);
  }
}

// 监听iframe内的语音请求
window.addEventListener('message', function(event){
  if(event.data && event.data.type === 'voiceInput'){
    // iframe内无法直接用Web Speech API，引导用户
    if(isWechat){
      showWechatGuide();
    } else {
      // 在父页面执行语音识别，结果发送回iframe
      let SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if(!SR) return;
      let r = new SR();
      r.lang = 'zh-CN';
      r.continuous = false;
      r.interimResults = true;
      isListening = true;
      showListeningOverlay();
      r.onresult = function(e){
        const text = '';
        for(var i = 0; i < e.results.length; i++){
          if(e.results[i].isFinal) text += e.results[i][0].transcript;
        }
        updateListeningOverlay(text);
        if(event.data.isDate){
          let parsed = parseVoiceDate(text);
          let iframe = document.getElementById('toolFrame');
          if(iframe && iframe.contentWindow){
            iframe.contentWindow.postMessage({type:'voiceResult', target:event.data.target, value:parsed || text}, '*');
          }
        }
      };
      r.onend = function(){
        isListening = false;
        hideListeningOverlay();
      };
      r.start();
    }
  }
});

// ========== 启动注入 ==========
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(injectMobileVoiceUI, 1000);
    if(isWechat) setTimeout(showWechatGuide, 2000);
  });
} else {
  setTimeout(injectMobileVoiceUI, 1000);
  if(isWechat) setTimeout(showWechatGuide, 2000);
}

// 声线切换
window.setMobileVoice = function(v){currentVoice = v;};

// console.log('🎙️ 移动端语音模块已加载 (微信:' + isWechat + ' 移动:' + isMobile + ')');
})();
