// 
(function(){
  // 懒加载器：收集所有 data-lazy section
  let lazySections = {};
  document.querySelectorAll('[data-lazy]').forEach(function(el){
    lazySections[el.id.replace('section-','')] = {
      el: el,
      src: el.getAttribute('data-lazy'),
      loaded: false
    };
  });
  
  // 包装 showSection，在切换前加载
  let _origShow = window.showSection;
  window.showSection = function(name){
    let key = name.replace('section-','');
    let lazy = lazySections[key];
    if(lazy && !lazy.loaded){
      lazy.loaded = true;
      let ph = lazy.el.querySelector('[id$="placeholder"]');
      if(ph) ph.innerHTML = '正在加载...';
      // try/catch: fetch 不存在或网络错误时不阻断 _origShow
      try {
        fetch(lazy.src).then(function(r){
          if(!r.ok) throw new Error(r.status);
          return r.text();
        }).then(function(html){
        let secRe = new RegExp('<section[^>]*id="section-' + key + '"[\\s\\S]*?<\\/section>');
        let m = html.match(secRe);
        // 更稳健：提取第一个 section
        let secMatch = html.match(/<section[\s\S]*?<\/section>/);
        if(secMatch){
          // 保存当前 active 状态
          var wasActive = lazy.el.classList.contains('active');
          var wasHidden = lazy.el.hidden;
          lazy.el.outerHTML = secMatch[0];
          // outerHTML 替换后元素引用失效，重新获取
          var newEl = document.getElementById('section-' + key);
          if(newEl){
            // 恢复 active/hidden 状态（fetch 是异步的，showSection 可能已设置过）
            if(wasActive) newEl.classList.add('active');
            newEl.hidden = wasHidden;
          }
          // 重新获取懒加载注册（因为 DOM 变了）
          document.querySelectorAll('[data-lazy]').forEach(function(el2){
            let k2 = el2.id.replace('section-','');
            if(!lazySections[k2]) lazySections[k2] = {el: el2, src: el2.getAttribute('data-lazy'), loaded: false};
          });
          // 执行内联脚本 + 加载外部 script src
          // 1. 内联脚本：用 new Function 执行
          let openTag = '<' + 'script[^>]*>';
          let closeTag = '<' + '/script>';
          let allScripts = html.match(new RegExp(openTag + '[\\s\\S]*?' + closeTag, 'g'));
          if(allScripts){
            allScripts.forEach(function(s){
              // 提取 src 属性
              var srcMatch = s.match(/\\bsrc=["']([^"']+)["']/);
              if(srcMatch){
                // 外部 script — 创建 <script> 元素加载
                var src = srcMatch[1];
                // 相对于 base URL 修正路径
                if(src.indexOf('http')!==0 && src.indexOf('//')!==0){
                  // ../knowledge/xxx.js → /knowledge/xxx.js（浏览器自动规范化）
                  // 不修改路径，让浏览器自己解析
                }
                var sc = document.createElement('script');
                sc.src = src;
                if(/\\bdefer\\b/.test(s)) sc.defer = true;
                document.head.appendChild(sc);
              } else {
                // 内联脚本 — 直接执行
                var code = s.replace(new RegExp(openTag, ''), '').replace(new RegExp(closeTag, ''), '');
                try{ (new Function(code))() }catch(e){console.warn('[懒加载脚本]',e)}
              }
            });
          }
        }
        }).catch(function(e){
          if(ph) ph.innerHTML = '加载失败：'+e.message;
          console.warn('[懒加载] fetch 失败:', e.message);
        });
      } catch(fetchErr) {
        // fetch 不存在或同步异常 — 不阻断 section 切换
        console.warn('[懒加载] fetch 异常:', fetchErr.message);
      }
    }
    return _origShow.apply(this,arguments);
  };
})();