/* todo-bus.js — AI 助手 TODO 任务总线
 * R86: 从 AI 报告中提取建议/行动/化解/第N条/下一步 等为可勾选 TODO
 * - 自动持久化 localStorage _ai_todos / _ai_todos_done
 * - 跨会话保留（globalThis.TodoBus）
 * - 消息总线事件: 'todo:added' / 'todo:done' / 'todo:undone' / 'todo:clear'
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = '_ai_todos_v1';
  var DONE_KEY = '_ai_todos_done_v1';

  function _readAll() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch (e) { return []; }
  }

  function _writeAll(arr) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }
    catch (e) { console.warn('[todo-bus] write fail', e); }
  }

  function _readDone() {
    try { return JSON.parse(localStorage.getItem(DONE_KEY) || '{}'); }
    catch (e) { return {}; }
  }

  function _writeDone(d) {
    try { localStorage.setItem(DONE_KEY, JSON.stringify(d)); }
    catch (e) {}
  }

  function _emit(name, detail) {
    try {
      if (typeof document !== 'undefined') {
        document.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
      }
    } catch (e) {}
  }

  /**
   * 从报告/纯文本中提取 TODO 条目
   * 规则:
   *  - "行动 N：xxx" / "第 N 条：xxx"
   *  - "下一步：xxx" / "建议：xxx"
   *  - "化解：xxx" / "强调：xxx"
   *  - "▶ / ● / ①/②/③" 开头的条目
   * 同一报告 15s 内重复来源标记 dedup
   */
  function extractFromText(text, opts) {
    var allow = (opts && opts.allowList) || ['行动', '建议', '化解', '下一步', '强调', '提醒', '要点', '第', '步', '方可', '需要', '重点'];
    var blocked = (opts && opts.blockList) || [];
    if (!text) return [];

    var lines = text.split(/[\r\n]+/);
    var out = [];
    var seen = {};
    lines.forEach(function (rawLine) {
      var line = rawLine.trim();
      if (!line) return;

      // 标号类：行动 1：xxx / 第 3 条：xxx / ①：xxx
      var m = line.match(/^(?:(行动|建议|化解|下一步|强调|提醒|要点|步)\s*[\d一二三四五六七八九十]+[:：、.]+|[\d一二三四五六七八九十]+[\.\)、:：]\s*)/);
      if (m && line.replace(m[0], '').length >= 4) {
        var item = line.replace(m[0], '').replace(/^[·•\-*]\s*/, '').trim();
        if (item.length >= 4 && item.length <= 120) {
          var k = item.slice(0, 30);
          if (!seen[k]) { seen[k] = 1; out.push(item); }
        }
        return;
      }

      // 列表符号类：▶ / ● / · 等
      m = line.match(/^[▶●◆★■·•○]\s*(.{4,120})$/);
      if (m) {
        var txt = m[1].trim();
        var k = txt.slice(0, 30);
        if (!seen[k]) { seen[k] = 1; out.push(txt); }
        return;
      }

      // 正向句式：xxx，应...；需要...；
      if (!blocked.includes(line) && /[，,：:](\s*)(应|需要|务必|务必|强调)/.test(line) && line.length >= 8 && line.length <= 100) {
        var m2 = line.match(/^(.{6,80})[，,](应|需要|务必|强调)/);
        if (m2) {
          var it = m2[1].replace(/\*+/g,'').trim();
          if (it.length >= 4) {
            var k2 = it.slice(0,30);
            if (!seen[k2]) { seen[k2] = 1; out.push(it); }
          }
        }
      }
    });

    return out.slice(0, 12);
  }

  function add(todos, meta) {
    var arr = _readAll();
    var existing = {};
    arr.forEach(function (t) { existing[t.text] = 1; });
    var added = 0;
    (todos || []).forEach(function (t) {
      if (typeof t !== 'string' || !t.trim()) return;
      var item = t.trim();
      if (existing[item]) return;
      existing[item] = 1;
      arr.unshift({
        id: 'todo-' + Date.now() + '-' + (Date.now()%1000),
        text: item,
        module: (meta && meta.module) || null,
        ts: Date.now()
      });
      added++;
    });
    if (added > 0) {
      _writeAll(arr.slice(0, 80));
      _emit('todo:added', { count: added, arr: arr });
    }
    return added;
  }

  function list() { return _readAll(); }

  function done(id) {
    var arr = _readAll();
    var doneMap = _readDone();
    var i = arr.findIndex(function (t) { return t.id === id; });
    if (i >= 0) {
      doneMap[id] = { ts: Date.now() };
      _writeDone(doneMap);
      _emit('todo:done', { id: id });
      return true;
    }
    return false;
  }

  function undone(id) {
    var doneMap = _readDone();
    delete doneMap[id];
    _writeDone(doneMap);
    _emit('todo:undone', { id: id });
    return true;
  }

  function remove(id) {
    var arr = _readAll();
    var i = arr.findIndex(function (t) { return t.id === id; });
    if (i >= 0) {
      arr.splice(i, 1);
      _writeAll(arr);
      _emit('todo:removed', { id: id });
      return true;
    }
    return false;
  }

  function clear() {
    _writeAll([]);
    _writeDone({});
    _emit('todo:clear', {});
  }

  function stats() {
    var arr = _readAll();
    var doneMap = _readDone();
    var doneCount = arr.filter(function (t) { return doneMap[t.id]; }).length;
    return { total: arr.length, done: doneCount, pending: arr.length - doneCount };
  }

  /** 渲染紧凑 TODO 列表到指定容器 */
  function render(el, opts) {
    if (!el) return;
    var arr = list();
    var doneMap = _readDone();
    var s = stats();
    var filterDone = opts && opts.filterDone;
    var html = '<div class="todo-bus"><div class="tb-header"><span class="tb-title">📝 我的行动清单</span><span class="tb-stats">' + s.pending + ' 待办 · ' + s.done + ' 已完成</span>' + (opts && opts.showClear ? '<button class="tb-clear" type="button">清空</button>' : '') + '</div>';
    if (!arr.length) {
      html += '<div class="tb-empty">完成 AI 报告后，行动清单会自动出现在这里<br><small>例：建议您每日早起冥想 10 分钟</small></div>';
    } else {
      html += '<div class="tb-list">';
      arr.forEach(function (t) {
        var isDone = !!doneMap[t.id];
        if (filterDone && isDone) return;
        var age = '';
        var ageMs = Date.now() - t.ts;
        if (ageMs < 3600000) age = Math.round(ageMs / 60000) + '分钟前';
        else if (ageMs < 86400000) age = Math.round(ageMs / 3600000) + '小时前';
        else age = Math.round(ageMs / 86400000) + '天前';
        var modBadge = t.module ? '<span class="tb-mod">' + escHtml(t.module) + '</span>' : '';
        html += '<div class="tb-item' + (isDone ? ' done' : '') + '" data-id="' + escHtml(t.id) + '">'
          + '<input type="checkbox" class="tb-chk" ' + (isDone ? 'checked' : '') + ' />'
          + '<span class="tb-text">' + escHtml(t.text) + '</span>'
          + '<span class="tb-meta">' + modBadge + escHtml(age) + '<button class="tb-del" type="button" title="删除">×</button></span>'
          + '</div>';
      });
      html += '</div>';
    }
    html += '</div>';
    el.innerHTML = html;

    // 事件绑定
    el.querySelectorAll('.tb-chk').forEach(function (c) {
      c.addEventListener('change', function () {
        var id = c.closest('.tb-item').dataset.id;
        if (c.checked) done(id); else undone(id);
        render(el, opts);
      });
    });
    el.querySelectorAll('.tb-del').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.closest('.tb-item').dataset.id;
        remove(id);
        render(el, opts);
      });
    });
    var clr = el.querySelector('.tb-clear');
    if (clr) clr.addEventListener('click', function () {
      if (typeof showToast === 'function') {
        showToast('已清空所有 TODO');
      }
      clear(); render(el, opts);
    });
  }

  function escHtml(s) {
    return String(s).replace(/[<>"'&]/g, function (c) { return { '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;', '&':'&amp;' }[c]; });
  }

  global.TodoBus = {
    extract: extractFromText,
    add: add,
    list: list,
    done: done,
    undone: undone,
    remove: remove,
    clear: clear,
    stats: stats,
    render: render
  };
})(typeof window !== 'undefined' ? window : globalThis);
