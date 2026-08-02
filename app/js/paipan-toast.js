/**
 * 排盘页面通用 toast 函数（兜底）
 * 各 chart 页若未引入主项目 common.js，可独立加载此文件
 */
if(typeof showToast!=='function'){
  window.showToast=function(msg){
    var t=document.createElement('div');
    t.style.cssText='position:fixed;top:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.85);color:#fff;padding:8px 20px;border-radius:6px;z-index:99999;font-size:13px;font-family:-apple-system,sans-serif';
    t.textContent=msg;
    document.body.appendChild(t);
    setTimeout(function(){t.remove();},2500);
  };
}
