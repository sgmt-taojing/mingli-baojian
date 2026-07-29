// R255 首页切换修复 — 懒加载器 v2
// 修复 bug：原版 outerHTML 替换会塞入 </body></html> 整段到主页 DOM，
//   触发 HTML 解析失败 → "页面变形 + 渲染丢失"
// 新版：只提取 section 内部节点 + 节流 + 单次加载

(function(){
  // 单次注册器：每个 section 只 fetch 一次
  const lazySections = new Map();
  document.querySelectorAll('[data-lazy]').forEach(function(el){
    lazySections.set(el.id.replace('section-',''), {
      el: el,
      src: el.getAttribute('data-lazy'),
      loaded: false,
      loading: false
    });
  });

  // 从外部 HTML 文件中提取 section 的内部节点（不含外层 <section>）
  function extractSectionInner(srcHtml, key) {
    try {
      // 直接找 id=section-{key} 的开闭标签位置
      const openRe = new RegExp(`<section[^>]*id=["']section-${key}["'][^>]*>`);
      const closeRe = /<\/section>/;
      const openMatch = srcHtml.match(openRe);
      if (!openMatch) return null;
      const startIdx = openMatch.index + openMatch[0].length;
      // 从 startIdx 找最近的 </section>
      const endIdx = srcHtml.indexOf('</section>', startIdx);
      if (endIdx < 0) return null;
      let inner = srcHtml.substring(startIdx, endIdx);
      // 清理：剥离外部 <!DOCTYPE> 与 <body>/</body> 痕迹（防御性）
      inner = inner.replace(/<!DOCTYPE[^>]*>/gi, '')
                    .replace(/<\/?html[^>]*>/gi, '')
                    .replace(/<\/?body[^>]*>/gi, '');
      return inner;
    } catch (e) {
      console.warn('[lazy-v2] extract error:', e.message);
      return null;
    }
  }

  // 加载函数：单次触发
  async function loadSection(key, entry) {
    if (entry.loaded || entry.loading) return;
    entry.loading = true;
    const ph = entry.el.querySelector('[id$="placeholder"], .lazy-loading-placeholder');
    if (ph) ph.innerHTML = '<div style="padding:60px 20px;text-align:center;color:var(--paper2);opacity:0.85">⏳ 加载中...</div>';
    try {
      const resp = await fetch(entry.src);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const html = await resp.text();
      const inner = extractSectionInner(html, key);
      if (inner == null) throw new Error('未找到 section-' + key);
      // 只替换占位区，保留 section 标签本身 + 切换过的 class
      const ph2 = entry.el.querySelector('[id$="placeholder"], .lazy-loading-placeholder');
      if (ph2) {
        ph2.outerHTML = inner;
      } else {
        entry.el.insertAdjacentHTML('beforeend', inner);
      }
      // 重新扫描可能的 script 标签，外部 src 动态加载
      entry.el.querySelectorAll('script').forEach(function(oldScript){
        const src = oldScript.getAttribute('src');
        if (src && !src.startsWith('http') && !src.startsWith('//')) {
          const newScript = document.createElement('script');
          newScript.src = src;
          newScript.defer = true;
          oldScript.parentNode.replaceChild(newScript, oldScript);
        }
      });
      entry.loaded = true;
    } catch (e) {
      if (ph) ph.innerHTML = '<div style="padding:40px 20px;text-align:center;color:var(--warn)">⚠️ 加载失败：'+e.message+'</div>';
      console.warn('[lazy-v2] fetch 失败:', entry.src, e.message);
      entry.loading = false; // 允许重试
    }
  }

  // 暴露全局函数：主 agent 调用
  window._loadHubSection = function(name) {
    const key = String(name).replace('section-','');
    const entry = lazySections.get(key);
    if (entry) loadSection(key, entry);
  };
})();
