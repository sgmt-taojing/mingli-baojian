
function scrollToTop(){window.scrollTo({top:0,behavior:'smooth'})}
// console.log("易道智鉴 v2026.06.14.1400 - 快捷栏版");
// === 微信环境检测与适配 ===
function detectWechat(){
  var ua=navigator.userAgent.toLowerCase();
  if(ua.indexOf('micromessenger')>-1){
    document.body.classList.add('wechat');
    // 微信返回按钮：优先 history.back，无历史则关闭
    var btn=document.createElement('div');
    btn.className='wechat-back-btn';
    btn.innerHTML='←';
    btn.onclick=function(){
      if(window.history.length>1){history.back()}
      else if(document.referrer){location.href=document.referrer}
      else{try{WeixinJSBridge.call('closeWindow')}catch(e){window.close()}}
    };
    document.body.appendChild(btn);
    // 微信内嵌：禁止 iOS 双击缩放
    document.addEventListener('gesturestart',function(e){e.preventDefault()});
    // 微信内嵌：监听 popstate 处理返回
    window.addEventListener('popstate',function(){
      // 如果当前在非首页 section，返回到首页而不是退出
      var active=document.querySelector('.section.active');
      if(active&&active.id!=='section-hero'){
        showSection('hero');
        history.pushState(null,'',location.href);
      }
    });
    // 初始化时 push 一个状态，防止直接退出
    history.pushState(null,'',location.href);
    // 微信分享配置（需后端签名，此处用默认分享）
    try{
      if(typeof WeixinJSBridge!=='undefined'){
        WeixinJSBridge.on('menu:share:appmessage',function(){
          WeixinJSBridge.invoke('sendAppMessage',{
            title:'命理宝鉴 · AI命理服务智能体',
            desc:'知命改运·趋吉避凶·八字六爻奇门紫微梅花六壬',
            link:location.href.split('#')[0],
            img_url:'https://sgmt-taojing.github.io/mingli-baojian/logo.png'
          });
        });
        WeixinJSBridge.on('menu:share:timeline',function(){
          WeixinJSBridge.invoke('shareTimeline',{
            title:'命理宝鉴 · 知命改运·趋吉避凶',
            link:location.href.split('#')[0],
            img_url:'https://sgmt-taojing.github.io/mingli-baojian/logo.png'
          });
        });
      }
    }catch(e){console.warn('[微信分享] 初始化失败:',e)}
    return true;
  }
  return false;
}
detectWechat();
// 占卜音效 - 玄学仪式感
let audioCtx = null;
function playBell(freq=800, duration=1.2){
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(freq*0.5, audioCtx.currentTime+duration);
    g.gain.setValueAtTime(0.25, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+duration);
    o.start(); o.stop(audioCtx.currentTime+duration);
  }catch(e){console.warn(e.message)}
}
function playSound(type) {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    if (type === 'click') {
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } else if (type === 'cast') {
      for (var i = 0; i < 3; i++) {
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.setValueAtTime(400 + i * 100, ctx.currentTime + i * 0.2);
        g.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.2);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.2 + 0.15);
        o.start(ctx.currentTime + i * 0.2);
        o.stop(ctx.currentTime + i * 0.2 + 0.15);
      }
      osc.stop(ctx.currentTime + 0.01);
    }
  } catch(e) {}
}
function playDivinationSound(){ playSound('success'); }


// 涟漪点击效果
document.addEventListener('click',function(e){
  var card=e.target.closest('.cat-card,.tool-card,.bottom-tab,.more-mini-btn');
  if(!card)return;
  card.style.position=card.style.position||'relative';
  var r=document.createElement('span');
  r.className='ripple';
  var rect=card.getBoundingClientRect();
  var size=Math.max(rect.width,rect.height);
  r.style.width=r.style.height=size+'px';
  r.style.left=(e.clientX-rect.left-size/2)+'px';
  r.style.top=(e.clientY-rect.top-size/2)+'px';
  card.appendChild(r);
  setTimeout(function(){r.remove()},600);
});

// 页面加载进度指示
// 页面加载进度指示 — 移除 loading 遮罩层
// 双重保底：window.load + 5秒超时强制移除（防止JS加载失败导致遮罩层永久存在）
function removeLoadingOverlay(){
  var ov=document.getElementById('loading-overlay');
  if(ov){ov.style.opacity='0';setTimeout(function(){ov.remove()},500)}
}
window.addEventListener('load',function(){
  var bar=document.getElementById('load-bar');
  if(bar) bar.style.width='100%';
  setTimeout(removeLoadingOverlay,300);
});
// 超时保底：5秒后强制移除遮罩层，防止外部JS加载失败阻塞所有点击
setTimeout(removeLoadingOverlay,5000);

// 强制刷新样式缓存
(function(){
  var link = document.querySelector('link[rel="stylesheet"]');
  if(link){
    var href = link.href.split('?')[0];
    link.href = href + '?t=' + Date.now();
  }
})();


/* ===== Extracted from more-functions.html ===== */


function r40MiniSearch(){
  var q=document.getElementById('r40MiniQuery').value.trim();
  if(!q){showToast('请输入查询关键词');return;}
  if(!window.R39_DUAL_CORE_KB){document.getElementById('r40MiniResult').innerHTML='<span style="opacity:.95">KB 加载中...</span>';return;}
  var results=r39SearchKB(q);
  var html='<div style="margin-bottom:6px;opacity:.6">命中 <b style="color:var(--gold)">'+results.length+'</b> 条 / 总 '+R39_DUAL_CORE_KB.length+' 条</div>';
  results.slice(0,4).forEach(function(e){
    html+='<div style="margin:6px 0;padding:8px;background:rgba(0,0,0,.25);border-radius:6px;border-left:3px solid var(--gold)"><b style="color:var(--gold);font-size:12px">'+e.title+'</b><div style="opacity:.7;margin-top:4px;line-height:1.7">'+e.content.substring(0,120)+'...</div></div>';
  });
  document.getElementById('r40MiniResult').innerHTML=html;
}
