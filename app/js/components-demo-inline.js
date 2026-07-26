
/* ──────────────── 通用工具 ──────────────── */
function addLog(type, meta, msg){
  const log = document.getElementById('eventLog');
  if (!log) return;
  const ts = new Date().toLocaleTimeString('zh-CN', {hour12:false});
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = `<span class="log-time">[${ts}]</span><b style="color:var(--gold)">${type}</b> <span style="color:var(--paper3)">${meta||''}</span> — <span style="color:var(--ink-dim)">${msg||''}</span>`;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
  while (log.children.length > 30) log.removeChild(log.firstChild);
}

document.addEventListener('ml:ready', ()=>{
  addLog('ml:ready', 'v2', 'window.ml 已就绪');
  bindAll();
});

function bindAll(){
  // ── Toast 4 个按钮 ──
  const msgs = {
    success: '✅ 操作成功，已保存到本地',
    error:   '❌ 网络异常，请稍后重试',
    warn:    '⚠️ 命例数据不完整，请补充',
    info:    'ℹ️ AI 助手正在解析您的命盘…',
  };
  document.querySelectorAll('[data-toast]').forEach(b=>{
    b.addEventListener('click', ()=>{
      const t = b.dataset.toast;
      if (window.ml) ml.toast[t](msgs[t]);
      else document.getElementById('mlToast').show(msgs[t], t);
      addLog('ml.toast.'+t, '', msgs[t]);
    });
  });

  // ── Modal ──
  document.getElementById('btn-open-basic').addEventListener('click', ()=>{
    document.getElementById('modalBasic').open();
    addLog('modal.open', 'basic', '打开基础对话框');
  });
  document.getElementById('modalBasic').addEventListener('close', e=>{
    addLog('modal.close', 'basic', '来源: '+(e.detail?.source||'api'));
  });
  document.getElementById('btn-open-form').addEventListener('click', ()=>{
    document.getElementById('modalForm').open();
    addLog('modal.open', 'form', '打开表单对话框');
  });
  document.getElementById('modalForm').addEventListener('close', e=>{
    addLog('modal.close', 'form', '来源: '+(e.detail?.source||'api'));
  });
  document.getElementById('btn-submit-form').addEventListener('click', ()=>{
    document.getElementById('modalForm').close('submit');
    ml.toast.success('表单已提交');
    addLog('form.submit', '', '提交成功');
  });
  document.getElementById('btn-open-confirm').addEventListener('click', async ()=>{
    addLog('modal.confirm', '', '弹出确认对话框');
    const ok = await ml.modal.confirm({
      title: '确认删除',
      message: '此操作不可撤销，是否继续？',
      confirmText: '删除',
      cancelText: '取消',
    });
    addLog('modal.confirm', 'result='+ok, ok ? '用户确认' : '用户取消');
    ml.toast[ok?'warn':'info'](ok?'已删除':'已取消');
  });

  // ── Tab ──
  document.querySelectorAll('[data-tab-go]').forEach(b=>{
    b.addEventListener('click', ()=>{
      const i = parseInt(b.dataset.tabGo, 10);
      ml.tab.setActive('demoTab', i);
    });
  });
  document.getElementById('demoTab').addEventListener('tab-change', e=>{
    addLog('tab-change', 'index='+e.detail.index, '从 '+e.detail.prevIndex+' → '+e.detail.index+'（'+e.detail.label+'）');
  });

  // ── Card clickable ──
  document.querySelectorAll('ml-card[clickable="true"]').forEach(c=>{
    c.addEventListener('card-click', ()=>{
      const id = c.dataset.cardId || '(no-id)';
      ml.toast.info('点击了卡片: '+id);
      addLog('card-click', id, '触发');
    });
  });

  // ── Accordion ──
  document.querySelectorAll('ml-accordion').forEach(acc=>{
    acc.addEventListener('item-toggle', e=>{
      addLog('item-toggle', 'idx='+e.detail.index+' '+e.detail.open?'🟢':'🔴', e.detail.title+' '+(e.detail.open?'展开':'收起'));
    });
  });
  document.querySelector('[data-acc-openall]').addEventListener('click', ()=>{
    ml.accordion.openAll('faqMultiple');
    addLog('accordion.openAll', 'faqMultiple', '');
  });
  document.querySelector('[data-acc-closeall]').addEventListener('click', ()=>{
    ml.accordion.closeAll('faqMultiple');
    addLog('accordion.closeAll', 'faqMultiple', '');
  });
}

// 兜底：如果 components-loader.js 因为某些原因没触发 ml:ready，等 800ms 再尝试 bind
setTimeout(()=>{
  if (!window.ml) {
    console.warn('[demo] ml loader 未就绪，使用降级方案');
    addLog('ml:fallback', '', 'loader 未就绪，使用直接 DOM API');
    bindAll();
  } else if (!document.querySelector('[data-bound]')) {
    bindAll();
  }
}, 800);
