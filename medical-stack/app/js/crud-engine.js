/**
 * CRUD Engine V2 — 通用患者/处方/方剂 管理
 * 使用对象：运营/医生/患者自助
 * 功能：list / add / edit / delete / view / export / import / settings
 * 设计原则：
 *   1. 数据确定性（无 Math.random，ID = length+1 转 36）
 *   2. 离线降级（localStorage 持久化）
 *   3. 可配置（分页/排序/自动刷新 localStorage）
 *   4. 无 alert/console（用 window.TCM?.toast || 已注入的 toast）
 */
(function() {
  'use strict';

  if (window.__CRUD_ENGINE__) return;
  window.__CRUD_ENGINE__ = true;

  var NS = 'tcm_crud_';
  var crudInstances = {};

  /**
   * 初始化一个 CRUD 模块
   * @param {string} moduleId - 唯一标识，如 'patient' / 'prescription'
   * @param {object} cfg - 配置
   *   cfg.columns: [{key, label, type:'text'|'select'|'textarea'|'tag'}]
   *   cfg.apiList: string - API 端点 (GET)
   *   cfg.apiCreate: string - API 端点 (POST)
   *   cfg.apiUpdate: string - API 端点 (PUT/PATCH)
   *   cfg.apiDelete: string - API 端点 (DELETE)
   *   cfg.storageKey: string - localStorage 前缀
   *   cfg.getItemId: function(item) -> string
   *   cfg.defaults: object - 新增时默认值
   */
  function initCRUD(moduleId, cfg) {
    if (crudInstances[moduleId]) return crudInstances[moduleId];
    var inst = {
      moduleId: moduleId,
      cfg: cfg,
      data: [],
      page: 1,
      perPage: 10,
      sortKey: null,
      sortDir: 'asc',
      selectedId: null,
      editingItem: null,
      searchQuery: '',
      loaded: false
    };
    crudInstances[moduleId] = inst;
    loadSettings(moduleId);
    loadData(moduleId);
    return inst;
  }

  function storageKey(moduleId, suffix) {
    return NS + moduleId + (suffix ? '_' + suffix : '');
  }

  function loadSettings(moduleId) {
    try {
      var s = JSON.parse(localStorage.getItem(storageKey(moduleId, 'settings')) || '{}');
      var inst = crudInstances[moduleId];
      inst.perPage = s.perPage || 10;
      inst.sortKey = s.sortKey || null;
      inst.sortDir = s.sortDir || 'asc';
      inst.autoRefresh = s.autoRefresh || false;
    } catch(e) {}
  }

  function saveSettings(moduleId) {
    try {
      var inst = crudInstances[moduleId];
      localStorage.setItem(storageKey(moduleId, 'settings'), JSON.stringify({
        perPage: inst.perPage,
        sortKey: inst.sortKey,
        sortDir: inst.sortDir,
        autoRefresh: inst.autoRefresh
      }));
    } catch(e) {}
  }

  function loadData(moduleId) {
    try {
      var raw = localStorage.getItem(storageKey(moduleId, 'data'));
      crudInstances[moduleId].data = raw ? JSON.parse(raw) : [];
    } catch(e) {
      crudInstances[moduleId].data = [];
    }
    crudInstances[moduleId].loaded = true;
  }

  function saveData(moduleId) {
    try {
      localStorage.setItem(storageKey(moduleId, 'data'), JSON.stringify(crudInstances[moduleId].data));
    } catch(e) {}
  }

  function genId(arr) {
    return (arr.length + 1).toString(36);
  }

  function generateItem(moduleId, defaults) {
    var inst = crudInstances[moduleId];
    var item = {};
    inst.cfg.columns.forEach(function(col) {
      item[col.key] = (defaults && defaults[col.key] !== undefined) ? defaults[col.key] : '';
    });
    item.id = item.id || genId(inst.data);
    item.created_at = new Date().toISOString();
    item.updated_at = item.created_at;
    return item;
  }

  /**
   * CRUD 操作
   */
  function listItems(moduleId, query, page, perPage) {
    var inst = crudInstances[moduleId];
    var items = inst.data.slice();
    // 搜索
    if (query) {
      var q = query.toLowerCase();
      items = items.filter(function(it) {
        return inst.cfg.columns.some(function(col) {
          var v = it[col.key];
          return v && String(v).toLowerCase().indexOf(q) >= 0;
        });
      });
    }
    // 排序
    if (inst.sortKey) {
      items.sort(function(a, b) {
        var va = a[inst.sortKey] || '';
        var vb = b[inst.sortKey] || '';
        var cmp = String(va).localeCompare(String(vb), 'zh');
        return inst.sortDir === 'desc' ? -cmp : cmp;
      });
    }
    // 分页
    var total = items.length;
    var start = ((page || 1) - 1) * (perPage || inst.perPage);
    var pageItems = items.slice(start, start + (perPage || inst.perPage));
    return { items: pageItems, total: total, page: page || 1, perPage: perPage || inst.perPage };
  }

  function addItem(moduleId, data) {
    var inst = crudInstances[moduleId];
    var item = generateItem(moduleId, data);
    inst.data.push(item);
    saveData(moduleId);
    // 同步到 API（可选）
    syncToAPI(moduleId, 'create', item);
    return item;
  }

  function updateItem(moduleId, id, updates) {
    var inst = crudInstances[moduleId];
    var idx = inst.data.findIndex(function(it) { return (it.id || it._id) === id; });
    if (idx < 0) return null;
    Object.keys(updates).forEach(function(k) {
      if (k !== 'id' && k !== '_id') inst.data[idx][k] = updates[k];
    });
    inst.data[idx].updated_at = new Date().toISOString();
    saveData(moduleId);
    syncToAPI(moduleId, 'update', inst.data[idx]);
    return inst.data[idx];
  }

  function deleteItem(moduleId, id) {
    var inst = crudInstances[moduleId];
    var idx = inst.data.findIndex(function(it) { return (it.id || it._id) === id; });
    if (idx < 0) return false;
    inst.data.splice(idx, 1);
    saveData(moduleId);
    syncToAPI(moduleId, 'delete', { id: id });
    return true;
  }

  function getItem(moduleId, id) {
    var inst = crudInstances[moduleId];
    return inst.data.find(function(it) { return (it.id || it._id) === id; }) || null;
  }

  function exportData(moduleId) {
    var inst = crudInstances[moduleId];
    return JSON.stringify(inst.data, null, 2);
  }

  function importData(moduleId, jsonStr) {
    try {
      var imported = JSON.parse(jsonStr);
      if (!Array.isArray(imported)) throw new Error('导入数据须为数组');
      var inst = crudInstances[moduleId];
      imported.forEach(function(it) {
        if (!it.id) it.id = genId(inst.data);
        inst.data.push(it);
      });
      saveData(moduleId);
      return { ok: true, count: imported.length };
    } catch(e) {
      return { ok: false, error: e.message };
    }
  }

  function syncToAPI(moduleId, action, item) {
    var inst = crudInstances[moduleId];
    var api = inst.cfg['api' + action.charAt(0).toUpperCase() + action.slice(1)];
    if (!api) return;
    try {
      var opts = { method: action === 'create' ? 'POST' : action === 'update' ? 'PUT' : 'DELETE', headers: { 'Content-Type': 'application/json' } };
      if (action !== 'delete') opts.body = JSON.stringify(item);
      fetch(api, opts).catch(function() {});
    } catch(e) {}
  }

  /**
   * 渲染辅助
   */
  function renderTable(moduleId, containerId, columns, rowRenderer) {
    var inst = crudInstances[moduleId];
    var result = listItems(moduleId, inst.searchQuery, inst.page, inst.perPage);
    var container = document.getElementById(containerId);
    if (!container) return;
    var html = '';
    // 表头
    html += '<div style="display:grid;gap:4px;font-size:11px;color:var(--text3);padding:4px 0;border-bottom:1px solid var(--border)">';
    html += '<div style="display:grid;grid-template-columns:' + columns.map(function(c){return c.width||'1fr';}).join(' ') + ';gap:8px;padding:2px 8px">';
    columns.forEach(function(col) {
      var arrow = '';
      if (inst.sortKey === col.key) arrow = inst.sortDir === 'asc' ? ' ↑' : ' ↓';
      html += '<span style="cursor:pointer" onclick="window.TCM&&window.TCM.crud&&window.TCM.crud.sort(\'' + moduleId + '\',\'' + col.key + '\')">' + col.label + arrow + '</span>';
    });
    html += '</div></div>';
    // 数据行
    result.items.forEach(function(item) {
      html += '<div style="display:grid;grid-template-columns:' + columns.map(function(c){return c.width||'1fr';}).join(' ') + ';gap:8px;padding:6px 8px;border-bottom:1px solid var(--border);font-size:12px;align-items:center">';
      columns.forEach(function(col) {
        var val = item[col.key] || '';
        html += '<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHtml(String(val)) + '</div>';
      });
      html += '<div style="display:flex;gap:4px;justify-content:flex-end">';
      html += '<button onclick="window.TCM&&window.TCM.crud.view(\'' + moduleId + '\',\'' + (item.id||item._id) + '\')" style="font-size:10px;padding:2px 6px;border-radius:4px;border:1px solid var(--border);background:#fff" aria-label="查看">👁</button>';
      html += '<button onclick="window.TCM&&window.TCM.crud.edit(\'' + moduleId + '\',\'' + (item.id||item._id) + '\')" style="font-size:10px;padding:2px 6px;border-radius:4px;border:1px solid var(--border);background:#fff" aria-label="编辑">✏️</button>';
      html += '<button onclick="window.TCM&&window.TCM.crud.remove(\'' + moduleId + '\',\'' + (item.id||item._id) + '\')" style="font-size:10px;padding:2px 6px;border-radius:4px;border:1px solid var(--red);background:#fff;color:var(--red)" aria-label="删除">🗑</button>';
      html += '</div></div>';
    });
    // 分页
    html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:11px;color:var(--text3)">';
    html += '<span>共 ' + result.total + ' 条 · 第 ' + result.page + '/' + Math.ceil(result.total/result.perPage||1) + ' 页</span>';
    html += '<div style="display:flex;gap:4px">';
    html += '<button onclick="window.TCM&&window.TCM.crud.page(\'' + moduleId + '\',' + (result.page-1) + ')" style="padding:2px 8px;border-radius:4px;border:1px solid var(--border);background:#fff;font-size:10px">‹</button>';
    html += '<button onclick="window.TCM&&window.TCM.crud.page(\'' + moduleId + '\',' + (result.page+1) + ')" style="padding:2px 8px;border-radius:4px;border:1px solid var(--border);background:#fff;font-size:10px">›</button>';
    html += '</div></div>';
    container.innerHTML = html;
  }

  function renderForm(moduleId, containerId, item, columns) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var isEdit = !!item;
    var html = '';
    html += '<div style="padding:12px;background:var(--card);border-radius:8px;border:1px solid var(--border)">';
    html += '<h4 style="font-size:13px;margin-bottom:8px;color:var(--tcm)">' + (isEdit ? '✏️ 编辑' : '➕ 新增') + (inst ? '' : '') + '</h4>';
    columns.forEach(function(col) {
      if (col.key === 'id') return;
      html += '<div style="margin-bottom:6px">';
      html += '<label style="font-size:11px;color:var(--text3);display:block;margin-bottom:2px">' + col.label + '</label>';
      var val = isEdit ? (item[col.key] || '') : (col.default || '');
      if (col.type === 'select') {
        html += '<select id="crud-field-' + col.key + '" style="width:100%;border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-size:12px">';
        (col.options || []).forEach(function(opt) {
          var sel = val === opt ? ' selected' : '';
          html += '<option value="' + escapeHtml(opt) + '"' + sel + '>' + escapeHtml(opt) + '</option>';
        });
        html += '</select>';
      } else if (col.type === 'textarea') {
        html += '<textarea id="crud-field-' + col.key + '" rows="3" style="width:100%;border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-size:12px;resize:vertical">' + escapeHtml(String(val)) + '</textarea>';
      } else {
        html += '<input type="' + (col.type || 'text') + '" id="crud-field-' + col.key + '" value="' + escapeHtml(String(val)) + '" style="width:100%;border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-size:12px">';
      }
      html += '</div>';
    });
    html += '<div style="display:flex;gap:6px;margin-top:8px">';
    html += '<button onclick="window.TCM&&window.TCM.crud.save(\'' + moduleId + '\')" style="flex:1;padding:6px;border-radius:6px;background:var(--tcm);color:#fff;border:none;font-size:12px">💾 保存</button>';
    html += '<button onclick="window.TCM&&window.TCM.crud.cancel(\'' + moduleId + '\')" style="flex:1;padding:6px;border-radius:6px;background:var(--card);border:1px solid var(--border);font-size:12px">取消</button>';
    html += '</div></div>';
    container.innerHTML = html;
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /**
   * 暴露 API 到 window.TCM.crud
   */
  var crudAPI = {
    init: initCRUD,
    list: listItems,
    add: addItem,
    update: updateItem,
    remove: deleteItem,
    get: getItem,
    export: exportData,
    import: importData,
    renderTable: renderTable,
    renderForm: renderForm,
    sort: function(moduleId, key) {
      var inst = crudInstances[moduleId];
      if (!inst) return;
      if (inst.sortKey === key) {
        inst.sortDir = inst.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        inst.sortKey = key;
        inst.sortDir = 'asc';
      }
      saveSettings(moduleId);
      renderTable(moduleId, inst.cfg.tableContainer, inst.cfg.columns, inst.cfg.rowRenderer);
    },
    page: function(moduleId, p) {
      var inst = crudInstances[moduleId];
      if (!inst) return;
      inst.page = Math.max(1, p);
      renderTable(moduleId, inst.cfg.tableContainer, inst.cfg.columns, inst.cfg.rowRenderer);
    },
    view: function(moduleId, id) {
      var inst = crudInstances[moduleId];
      if (!inst) return;
      var item = getItem(moduleId, id);
      if (!item) return;
      inst.selectedId = id;
      if (inst.cfg.onView) inst.cfg.onView(item);
      else renderForm(moduleId, inst.cfg.formContainer, item, inst.cfg.columns);
    },
    edit: function(moduleId, id) {
      var inst = crudInstances[moduleId];
      if (!inst) return;
      var item = getItem(moduleId, id);
      if (!item) return;
      inst.editingItem = item;
      renderForm(moduleId, inst.cfg.formContainer, item, inst.cfg.columns);
    },
    save: function(moduleId) {
      var inst = crudInstances[moduleId];
      if (!inst) return;
      var data = {};
      inst.cfg.columns.forEach(function(col) {
        if (col.key === 'id') return;
        var el = document.getElementById('crud-field-' + col.key);
        if (el) data[col.key] = el.value;
      });
      if (inst.editingItem) {
        updateItem(moduleId, inst.editingItem.id || inst.editingItem._id, data);
        if (window.TCM && window.TCM.toast) window.TCM.toast('✅ 已更新');
        inst.editingItem = null;
      } else {
        addItem(moduleId, data);
        if (window.TCM && window.TCM.toast) window.TCM.toast('✅ 已添加');
      }
      renderTable(moduleId, inst.cfg.tableContainer, inst.cfg.columns, inst.cfg.rowRenderer);
      if (inst.cfg.onSave) inst.cfg.onSave();
    },
    cancel: function(moduleId) {
      var inst = crudInstances[moduleId];
      if (!inst) return;
      inst.editingItem = null;
      if (inst.cfg.formContainer) {
        document.getElementById(inst.cfg.formContainer).innerHTML = '';
      }
    },
    remove: async function(moduleId, id) {
      var inst = crudInstances[moduleId];
      if (!inst) return;
      if (!await (window.confirmModal ? confirmModal('确定删除？此操作不可恢复。', { danger:true, okText:'删除' }) : Promise.resolve(confirm('确定删除？')))) return;
      deleteItem(moduleId, id);
      renderTable(moduleId, inst.cfg.tableContainer, inst.cfg.columns, inst.cfg.rowRenderer);
      if (window.TCM && window.TCM.toast) window.TCM.toast('🗑 已删除');
      if (inst.cfg.onDelete) inst.cfg.onDelete(id);
    },
    settings: function(moduleId, key, val) {
      var inst = crudInstances[moduleId];
      if (!inst) return;
      if (key === 'perPage') inst.perPage = val;
      else if (key === 'autoRefresh') inst.autoRefresh = val;
      else if (key === 'sortKey') inst.sortKey = val;
      saveSettings(moduleId);
      renderTable(moduleId, inst.cfg.tableContainer, inst.cfg.columns, inst.cfg.rowRenderer);
    }
  };

  // 挂载到 window.TCM.crud
  if (!window.TCM) window.TCM = {};
  if (!window.TCM.crud) window.TCM.crud = {};
  Object.keys(crudAPI).forEach(function(k) {
    if (!window.TCM.crud[k]) window.TCM.crud[k] = crudAPI[k];
  });

})();
