/**
 * 智能助手浮动操作按钮（R64）
 * - 右下角圆形 FAB，点击展开 3 个操作：滚顶 / 清空 / 朗读
 * - 自动隐藏：模块报告生成中
 * - 滚动 > 200px 显示「滚顶」按钮
 */
(function (global) {
  'use strict';

  function _ensureFab() {
    if (document.getElementById('aiFab')) return;
    const html = `
<style>
#aiFab {position:fixed;right:18px;bottom:90px;z-index:200;display:flex;flex-direction:column;gap:8px;align-items:flex-end}
.aiFab-main {width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#c9a84c,#b8943d);box-shadow:0 4px 12px rgba(0,0,0,.4);color:#fff;font-size:22px;border:none;cursor:pointer;transition:transform .2s,box-shadow .2s}
.aiFab-main:hover {transform:scale(1.1);box-shadow:0 6px 16px rgba(0,0,0,.5)}
.aiFab-menu {display:none;flex-direction:column;gap:6px;animation:fadeIn .2s}
.aiFab-menu.open {display:flex}
.aiFab-item {width:42px;height:42px;border-radius:50%;background:rgba(13,17,23,.92);border:1px solid rgba(201,168,76,.4);color:#c9a84c;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);transition:background .2s}
.aiFab-item:hover {background:rgba(201,168,76,.2)}
@keyframes fadeIn {from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
</style>
<div id="aiFab">
  <div id="aiFabMenu" class="aiFab-menu">
    <button class="aiFab-item" id="aiFabTop" title="滚到顶部" aria-label="滚动到顶部">⬆️</button>
    <button class="aiFab-item" id="aiFabClear" title="清空对话" aria-label="清空对话">🗑️</button>
    <button class="aiFab-item" id="aiFabSpeak" title="朗读/停止" aria-label="朗读">🔊</button>
  <button class="aiFab-item" id="aiFabExport" title="导出对话" aria-label="导出对话">💾</button>
  </div>
  <button class="aiFab-main" id="aiFabMain" title="快捷操作" aria-label="快捷操作">⚡</button>
</div>`;
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    document.body.appendChild(wrap);

    document.getElementById('aiFabMain').onclick = function () {
      document.getElementById('aiFabMenu').classList.toggle('open');
    };
    document.getElementById('aiFabTop').onclick = function () {
      const chat = document.getElementById('chat');
      if (chat) chat.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      try { showToast('⬆️ 已滚动到顶部', 'info'); } catch (e) {}
    };
    document.getElementById('aiFabClear').onclick = function () {
      if (!confirm('清空当前对话？（仅清显示，不影响 KB 命中统计）')) return;
      const chat = document.getElementById('chat');
      if (chat) chat.innerHTML = '';
      try { if (typeof hist !== 'undefined') hist.length = 0; } catch (e) {}
      try { showToast('🗑️ 已清空对话', 'success'); } catch (e) {}
    };
    document.getElementById('aiFabSpeak').onclick = function () {
      try {
        if (typeof toggleTTS === 'function') toggleTTS();
        else if (typeof stopSpeak === 'function') stopSpeak();
      } catch (e) { /* 静默 */ }
    };
    document.getElementById('aiFabExport').onclick = function () {
      try {
        if (typeof _exportFullChat === 'function') {
          var fmt = (confirm('确定导出当前对话？\n\n确定 = Markdown\n取消 = TXT（手动选格式）') ? 'md' : 'txt');
          _exportFullChat(fmt);
        }
      } catch (e) { console.warn('export fab', e); }
    };
    // 双击 / 长按切 JSON（可选增强）
    document.getElementById('aiFabExport').addEventListener('dblclick', function(){
      try { if (typeof _exportFullChat === 'function') _exportFullChat('json'); } catch(e) {}
    });

    // 滚动监听：>200px 时高亮「滚顶」
    const chat = document.getElementById('chat');
    const topBtn = document.getElementById('aiFabTop');
    function _onScroll() {
      if (!topBtn) return;
      const el = chat || document.documentElement;
      const scrollTop = el.scrollTop || window.pageYOffset || document.documentElement.scrollTop || 0;
      topBtn.style.borderColor = scrollTop > 200 ? 'rgba(201,168,76,.9)' : 'rgba(201,168,76,.4)';
    }
    if (chat) chat.addEventListener('scroll', _onScroll, { passive: true });
    window.addEventListener('scroll', _onScroll, { passive: true });
  }

  global.AIFab = {
    init: _ensureFab,
    show: function () { const el = document.getElementById('aiFab'); if (el) el.style.display = 'flex'; },
    hide: function () { const el = document.getElementById('aiFab'); if (el) el.style.display = 'none'; }
  };

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(_ensureFab, 800);
  });
})(window);
