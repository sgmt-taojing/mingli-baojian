/**
 * R58 KB 搜索建议（autocomplete）
 * 用户在 AI 助手输入框输入时，实时匹配 KB 条目标题/关键词
 * 显示下拉建议列表，点击可直接发送
 *
 * 依赖：KB_SOURCES（ai-assistant-inline.js）
 * 用法：在 ai-assistant.html 引入本文件，自动绑定 #box
 */
(function () {
  'use strict';

  var SUGGEST_LIMIT = 8;
  var MIN_QUERY = 2;
  var DEBOUNCE_MS = 150;

  var dropdown = null;
  var debounceTimer = null;
  var boxEl = null;
  var cache = {}; // query → results
  var cacheSize = 0;

  function createDropdown() {
    if (dropdown) return dropdown;
    dropdown = document.createElement('div');
    dropdown.id = 'kbSuggestDropdown';
    dropdown.className = 'kb-suggest-dropdown';
    dropdown.style.cssText = [
      'position:absolute',
      'z-index:300',
      'background:rgba(20,18,15,.98)',
      'border:1px solid rgba(201,168,76,.25)',
      'border-radius:0 0 8px 8px',
      'box-shadow:0 6px 20px rgba(0,0,0,.5)',
      'max-height:280px',
      'overflow-y:auto',
      'display:none',
      'width:100%',
      'font-size:13px'
    ].join(';');
    return dropdown;
  }

  function positionDropdown() {
    if (!boxEl || !dropdown) return;
    var rect = boxEl.getBoundingClientRect();
    dropdown.style.left = rect.left + 'px';
    dropdown.style.top = (rect.bottom - 2) + 'px';
    dropdown.style.width = rect.width + 'px';
  }

  function showDropdown(items) {
    if (!dropdown || !items.length) { hideDropdown(); return; }
    positionDropdown();
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var badge = it.sourceName ? '<span class="kb-sg-badge">' + escapeHtml(it.sourceName) + '</span>' : '';
      var icon = it.icon || '📖';
      html += '<div class="kb-sg-item" data-idx="' + i + '" role="option" tabindex="-1">' +
        '<span class="kb-sg-icon">' + icon + '</span>' +
        '<span class="kb-sg-text">' + escapeHtml(it.title) + '</span>' +
        badge +
        '</div>';
    }
    dropdown.innerHTML = html;
    dropdown.style.display = 'block';

    // 绑定点击
    var children = dropdown.querySelectorAll('.kb-sg-item');
    for (var j = 0; j < children.length; j++) {
      (function (idx, el) {
        el.addEventListener('mousedown', function (e) {
          e.preventDefault();
          selectItem(items[idx]);
        }, true);
      })(j, children[j]);
    }
  }

  function hideDropdown() {
    if (dropdown) dropdown.style.display = 'none';
  }

  function selectItem(item) {
    if (!boxEl) return;
    boxEl.value = item.title;
    hideDropdown();
    // 自动触发发送
    if (typeof send === 'function') {
      send();
    } else {
      // 回退：模拟 Enter
      var ev = new KeyboardEvent('keypress', { key: 'Enter' });
      boxEl.dispatchEvent(ev);
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /**
   * 从 KB_SOURCES 搜索匹配条目
   */
  function searchKB(query) {
    if (cache[query]) return cache[query];

    var results = [];
    var qLower = query.toLowerCase();
    var keywords = qLower.split(/[\s,，。、；;：:（）()\[\]\-]+/).filter(function (s) { return s.length >= 1; });

    if (typeof KB_SOURCES === 'undefined' || !KB_SOURCES) return results;

    for (var si = 0; si < KB_SOURCES.length && results.length < SUGGEST_LIMIT * 3; si++) {
      var src = KB_SOURCES[si];
      var kb = null;
      try { kb = src.obj(); } catch (e) { continue; }
      if (!kb) continue;

      // 递归遍历 KB，找含关键词的字段
      var found = [];
      function walk(obj, path) {
        if (found.length >= 5) return;
        if (typeof obj === 'string') {
          var score = 0;
          for (var k = 0; k < keywords.length; k++) {
            if (obj.indexOf(keywords[k]) >= 0) score++;
          }
          if (score > 0 && obj.length > 4 && obj.length < 200) {
            found.push({ text: obj, score: score, path: path });
          }
        } else if (typeof obj === 'object' && obj !== null) {
          // 优先匹配 name / title 字段
          if (obj.name && typeof obj.name === 'string') {
            var ns = 0;
            for (var k2 = 0; k2 < keywords.length; k2++) {
              if (obj.name.indexOf(keywords[k2]) >= 0) ns++;
            }
            if (ns > 0) {
              found.push({ text: obj.name, score: ns * 2, path: path, isTitle: true });
            }
          }
          if (obj.title && typeof obj.title === 'string') {
            var ts = 0;
            for (var k3 = 0; k3 < keywords.length; k3++) {
              if (obj.title.indexOf(keywords[k3]) >= 0) ts++;
            }
            if (ts > 0) {
              found.push({ text: obj.title, score: ts * 2, path: path, isTitle: true });
            }
          }
          for (var key in obj) {
            if (key.startsWith('_') || key === 'meta') continue;
            walk(obj[key], path ? path + '.' + key : key);
          }
        }
      }
      walk(kb, '');

      // 按分数排序
      found.sort(function (a, b) { return b.score - a.score; });
      for (var fi = 0; fi < Math.min(3, found.length) && results.length < SUGGEST_LIMIT * 3; fi++) {
        results.push({
          title: found[fi].text.substring(0, 60),
          sourceName: src.name.replace('_KB', ''),
          icon: found[fi].isTitle ? '🏷️' : '📖',
          score: found[fi].score
        });
      }
    }

    // 去重（按 title）
    var seen = {};
    var deduped = [];
    for (var r = 0; r < results.length && deduped.length < SUGGEST_LIMIT; r++) {
      if (!seen[results[r].title]) {
        seen[results[r].title] = true;
        deduped.push(results[r]);
      }
    }

    // 缓存（最多 50 条）
    if (cacheSize < 50) {
      cache[query] = deduped;
      cacheSize++;
    }
    return deduped;
  }

  function onInput(e) {
    var val = boxEl.value.trim();
    if (val.length < MIN_QUERY) { hideDropdown(); return; }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      var results = searchKB(val);
      if (results.length) {
        showDropdown(results);
      } else {
        hideDropdown();
      }
    }, DEBOUNCE_MS);
  }

  function onKeyDown(e) {
    if (!dropdown || dropdown.style.display === 'none') return;
    var items = dropdown.querySelectorAll('.kb-sg-item');
    if (!items.length) return;
    var current = dropdown.querySelector('.kb-sg-item.active');
    var idx = current ? parseInt(current.dataset.idx, 10) : -1;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      idx = Math.min(idx + 1, items.length - 1);
      updateActive(items, idx);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      idx = Math.max(idx - 1, 0);
      updateActive(items, idx);
    } else if (e.key === 'Escape') {
      hideDropdown();
    } else if (e.key === 'Enter' && current) {
      e.preventDefault();
      e.stopPropagation();
      var results = searchKB(boxEl.value.trim());
      if (results[idx]) selectItem(results[idx]);
    }
  }

  function updateActive(items, idx) {
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('active', i === idx);
    }
    items[idx].scrollIntoView({ block: 'nearest' });
  }

  // === 初始化 ===
  function init() {
    boxEl = document.getElementById('box');
    if (!boxEl) return;

    createDropdown();
    document.body.appendChild(dropdown);

    boxEl.addEventListener('input', onInput);
    boxEl.addEventListener('keydown', onKeyDown);
    boxEl.addEventListener('blur', function () {
      setTimeout(hideDropdown, 200);
    });
    boxEl.addEventListener('focus', function () {
      if (boxEl.value.trim().length >= MIN_QUERY) {
        var results = searchKB(boxEl.value.trim());
        if (results.length) showDropdown(results);
      }
    });

    // 窗口缩放时重新定位
    window.addEventListener('resize', positionDropdown);
    window.addEventListener('scroll', positionDropdown, true);

    // 注入 CSS（如果尚未存在）
    if (!document.getElementById('kbSuggestCSS')) {
      var css = document.createElement('style');
      css.id = 'kbSuggestCSS';
      css.textContent = [
        '.kb-suggest-dropdown{font-family:var(--paper-font,inherit);color:#e8e0d0}',
        '.kb-sg-item{display:flex;align-items:center;gap:6px;padding:8px 12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.04);transition:background .15s}',
        '.kb-sg-item:hover{background:rgba(201,168,76,.12)}',
        '.kb-sg-item.active{background:rgba(201,168,76,.2)}',
        '.kb-sg-icon{font-size:14px;flex-shrink:0;width:20px;text-align:center}',
        '.kb-sg-text{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:1.4}',
        '.kb-sg-badge{font-size:10px;padding:1px 6px;border-radius:3px;background:rgba(201,168,76,.15);color:rgba(201,168,76,.8);white-space:nowrap;flex-shrink:0}'
      ].join('\n');
      document.head.appendChild(css);
    }
  }

  // 等 DOM 就绪
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
