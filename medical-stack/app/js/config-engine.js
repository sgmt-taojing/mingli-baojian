/**
 * config-engine.js — TCM-Agent 可配置运营后台引擎 V1
 * ═══════════════════════════════════════════════════
 * 功能：
 *   1. 系统参数配置（开关 / 阈值 / 规则）
 *   2. 角色权限矩阵可视化
 *   3. 科室 / 诊室 / 排班管理
 *   4. 药房库存预警阈值
 *   5. KB 知识库 trust 阈值
 *   6. AI 模型参数（temperature / top_p / max_tokens）
 *   7. 微信推送 / WebPush 配置
 *   8. 导入 / 导出 / 重置
 *
 * 使用对象：super_admin / admin_b（运营管理员）
 * 使用方式：在任意页面引入本 JS，调用 TCM.config.init(containerId)
 * 依赖：crud-engine.js（CRUD 基础）、nav.js（TCM.store）
 * ═══════════════════════════════════════════════════
 */
(function() {
  'use strict';

  var DEFAULT_CONFIG = {
    system: {
      name: 'TCM-Agent 智能诊疗系统',
      version: '1.0',
      environment: 'production',
      maintenance_mode: false,
      registration_open: true,
      max_online_users: 200,
      session_timeout_minutes: 30
    },
    diagnosis: {
      kb_trust_threshold: 0.75,
      ai_temperature: 0.3,
      ai_top_p: 0.9,
      ai_max_tokens: 2048,
      enable_multischool: true,
      enable_expert_review: true,
      auto_prescription_safety_check: true,
      pulse_analysis_enabled: true,
      tongue_analysis_enabled: true
    },
    pharmacy: {
      low_stock_threshold: 20,
      critical_stock_threshold: 5,
      auto_reorder: false,
      expiry_warning_days: 90,
      enable_dual_check: true
    },
    appointment: {
      slot_duration_minutes: 15,
      max_advance_days: 14,
      cancel_cutoff_minutes: 30,
      enable_walk_in: true,
      reminder_hours_before: 2
    },
    wechat: {
      push_enabled: true,
      daily_push_limit: 5,
      quiet_hours_start: '21:00',
      quiet_hours_end: '08:00',
      template_id: '',
      followup_auto_push: true
    },
    wearable: {
      enable_sync: true,
      sync_interval_seconds: 60,
      heart_rate_high: 100,
      heart_rate_low: 50,
      spo2_low: 92,
      blood_pressure_high: 140,
      abnormal_alert: true
    },
    security: {
      password_min_length: 8,
      require_2fa: false,
      max_login_attempts: 5,
      lockout_minutes: 30,
      audit_log_retention_days: 90
    }
  };

  var CONFIG_KEY = 'tcm_system_config';

  function getConfig() {
    if (typeof TCM === 'undefined' || !TCM.store) {
      try { return JSON.parse(localStorage.getItem(CONFIG_KEY)) || deepCopy(DEFAULT_CONFIG); }
      catch(e) { return deepCopy(DEFAULT_CONFIG); }
    }
    var stored = TCM.store.get(CONFIG_KEY);
    if (!stored) {
      TCM.store.set(CONFIG_KEY, deepCopy(DEFAULT_CONFIG));
      return deepCopy(DEFAULT_CONFIG);
    }
    return mergeConfig(deepCopy(DEFAULT_CONFIG), stored);
  }

  function saveConfig(cfg) {
    if (typeof TCM !== 'undefined' && TCM.store) {
      TCM.store.set(CONFIG_KEY, cfg);
    } else {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
    }
    // 派发事件
    if (typeof TCM !== 'undefined' && TCM.realtime) {
      TCM.realtime.emit('config', { type: 'config_update', ts: Date.now() });
    }
  }

  function deepCopy(obj) { return JSON.parse(JSON.stringify(obj)); }

  function mergeConfig(base, override) {
    for (var key in override) {
      if (typeof base[key] === 'object' && !Array.isArray(base[key]) && typeof override[key] === 'object') {
        mergeConfig(base[key], override[key]);
      } else {
        base[key] = override[key];
      }
    }
    return base;
  }

  // ═══ 分类定义 ═══
  var CATEGORIES = [
    { id: 'system', label: '系统', icon: '⚙️', desc: '基础系统参数' },
    { id: 'diagnosis', label: '诊疗', icon: '🩺', desc: 'AI诊断 + KB阈值' },
    { id: 'pharmacy', label: '药房', icon: '💊', desc: '库存预警 + 安全' },
    { id: 'appointment', label: '预约', icon: '📅', desc: '排班 + 挂号' },
    { id: 'wechat', label: '推送', icon: '💬', desc: '微信推送 + 提醒' },
    { id: 'wearable', label: '穿戴', icon: '⌚', desc: '设备同步 + 预警' },
    { id: 'security', label: '安全', icon: '🔒', desc: '认证 + 审计' }
  ];

  // ═══ 组件定义（按类型渲染）═══
  var COMPONENT_TYPES = {
    toggle: function(key, value, onChange) {
      return '<label class="cfg-toggle">'+
        '<input type="checkbox" data-cfg-key="'+key+'" '+(value?'checked':'')+' onchange="'+onChange+'">'+
        '<span class="cfg-toggle-slider"></span></label>';
    },
    number: function(key, value, min, max, step, onChange) {
      return '<input type="number" class="cfg-input" data-cfg-key="'+key+'" value="'+value+'"'+
        (min!==undefined?' min="'+min+'"':'')+
        (max!==undefined?' max="'+max+'"':'')+
        (step!==undefined?' step="'+step+'"':'')+
        ' onchange="'+onChange+'">';
    },
    text: function(key, value, onChange) {
      return '<input type="text" class="cfg-input" data-cfg-key="'+key+'" value="'+(value||'')+'" onchange="'+onChange+'">';
    },
    time: function(key, value, onChange) {
      return '<input type="time" class="cfg-input" data-cfg-key="'+key+'" value="'+(value||'')+'" onchange="'+onChange+'">';
    },
    select: function(key, value, options, onChange) {
      var opts = options.map(function(o) {
        var val = typeof o === 'string' ? o : o.value;
        var label = typeof o === 'string' ? o : o.label;
        return '<option value="'+val+'"'+(val===value?' selected':'')+'>'+label+'</option>';
      }).join('');
      return '<select class="cfg-input" data-cfg-key="'+key+'" onchange="'+onChange+'">'+opts+'</select>';
    }
  };

  // ═══ 字段定义 ═══
  var FIELDS = {
    system: [
      { key: 'name', label: '系统名称', type: 'text' },
      { key: 'environment', label: '运行环境', type: 'select', options: [
        {value:'production',label:'正式'}, {value:'staging',label:'预发布'}, {value:'development',label:'开发'}
      ]},
      { key: 'maintenance_mode', label: '维护模式', type: 'toggle', desc: '开启后用户只能查看' },
      { key: 'registration_open', label: '开放注册', type: 'toggle' },
      { key: 'max_online_users', label: '最大在线用户', type: 'number', min:10, max:10000, step:10 },
      { key: 'session_timeout_minutes', label: '会话超时（分钟）', type: 'number', min:5, max:480, step:5 }
    ],
    diagnosis: [
      { key: 'kb_trust_threshold', label: 'KB置信度阈值', type: 'number', min:0.5, max:1, step:0.05, desc: '低于此值的KB结果不直接展示' },
      { key: 'ai_temperature', label: 'AI温度参数', type: 'number', min:0, max:2, step:0.1 },
      { key: 'ai_top_p', label: 'AI Top-P', type: 'number', min:0.1, max:1, step:0.05 },
      { key: 'ai_max_tokens', label: 'AI最大Token', type: 'number', min:256, max:8192, step:256 },
      { key: 'enable_multischool', label: '多流派分析', type: 'toggle', desc: '伤寒/温病/扶阳多学派并列' },
      { key: 'enable_expert_review', label: '专家审核', type: 'toggle', desc: 'AI输出需执业医师审核' },
      { key: 'auto_prescription_safety_check', label: '处方安全自动检查', type: 'toggle' },
      { key: 'pulse_analysis_enabled', label: '脉诊分析', type: 'toggle' },
      { key: 'tongue_analysis_enabled', label: '舌诊分析', type: 'toggle' }
    ],
    pharmacy: [
      { key: 'low_stock_threshold', label: '低库存阈值', type: 'number', min:5, max:200, step:5 },
      { key: 'critical_stock_threshold', label: '紧急库存阈值', type: 'number', min:1, max:50 },
      { key: 'auto_reorder', label: '自动补货', type: 'toggle' },
      { key: 'expiry_warning_days', label: '效期预警（天）', type: 'number', min:7, max:365, step:7 },
      { key: 'enable_dual_check', label: '双人复核', type: 'toggle' }
    ],
    appointment: [
      { key: 'slot_duration_minutes', label: '每号时长（分钟）', type: 'number', min:5, max:60, step:5 },
      { key: 'max_advance_days', label: '最大预约天数', type: 'number', min:1, max:90 },
      { key: 'cancel_cutoff_minutes', label: '取消截止（分钟）', type: 'number', min:0, max:120, step:5 },
      { key: 'enable_walk_in', label: '允许加号', type: 'toggle' },
      { key: 'reminder_hours_before', label: '提前提醒（小时）', type: 'number', min:1, max:72 }
    ],
    wechat: [
      { key: 'push_enabled', label: '推送总开关', type: 'toggle' },
      { key: 'daily_push_limit', label: '每日推送上限', type: 'number', min:1, max:20 },
      { key: 'quiet_hours_start', label: '免打扰开始', type: 'time' },
      { key: 'quiet_hours_end', label: '免打扰结束', type: 'time' },
      { key: 'followup_auto_push', label: '随访自动推送', type: 'toggle' }
    ],
    wearable: [
      { key: 'enable_sync', label: '设备同步', type: 'toggle' },
      { key: 'sync_interval_seconds', label: '同步间隔（秒）', type: 'number', min:10, max:600, step:10 },
      { key: 'heart_rate_high', label: '心率上限', type: 'number', min:60, max:200 },
      { key: 'heart_rate_low', label: '心率下限', type: 'number', min:30, max:100 },
      { key: 'spo2_low', label: '血氧下限(%)', type: 'number', min:80, max:100 },
      { key: 'blood_pressure_high', label: '收缩压上限', type: 'number', min:100, max:200 },
      { key: 'abnormal_alert', label: '异常自动告警', type: 'toggle' }
    ],
    security: [
      { key: 'password_min_length', label: '密码最小长度', type: 'number', min:6, max:32 },
      { key: 'require_2fa', label: '强制两步验证', type: 'toggle' },
      { key: 'max_login_attempts', label: '最大登录尝试', type: 'number', min:3, max:20 },
      { key: 'lockout_minutes', label: '锁定时长（分钟）', type: 'number', min:5, max:240, step:5 },
      { key: 'audit_log_retention_days', label: '审计日志保留（天）', type: 'number', min:7, max:365, step:7 }
    ]
  };

  // ═══ 渲染器 ═══
  function render(containerId) {
    var el = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!el) return;

    var config = getConfig();
    var html = '';

    // Tab 栏
    html += '<div class="cfg-tabs" style="display:flex;gap:4px;margin-bottom:12px;flex-wrap:wrap">';
    CATEGORIES.forEach(function(cat, i) {
      html += '<button class="cfg-tab'+(i===0?' active':'')+'" data-cat="'+cat.id+'" onclick="TCM.config.switchTab(\''+cat.id+'\')" '+
        'style="padding:8px 12px;border:1px solid var(--border);background:'+(i===0?'var(--accent)':'var(--card)')+';'+
        'color:'+(i===0?'#fff':'var(--text)')+';border-radius:6px;cursor:pointer;font-size:13px">'+
        cat.icon+' '+cat.label+'</button>';
    });
    html += '</div>';

    // 内容区
    CATEGORIES.forEach(function(cat, i) {
      html += '<div class="cfg-panel" id="cfg-panel-'+cat.id+'" style="display:'+(i===0?'block':'none')+'">';
      html += '<div style="margin-bottom:8px;color:var(--text2);font-size:12px">'+cat.icon+' '+cat.desc+'</div>';

      var fields = FIELDS[cat.id] || [];
      fields.forEach(function(field) {
        var value = config[cat.id] ? config[cat.id][field.key] : null;
        var inputHtml = '';
        var onChange = 'TCM.config.update(\''+cat.id+'\',\''+field.key+'\',this)';
        var inputClass = 'cfg-field-'+field.type;

        if (field.type === 'toggle') {
          inputHtml = '<div class="'+inputClass+'">'+COMPONENT_TYPES.toggle(field.key, value, onChange)+'</div>';
        } else if (field.type === 'number') {
          inputHtml = '<div class="'+inputClass+'">'+COMPONENT_TYPES.number(field.key, value, field.min, field.max, field.step, onChange)+'</div>';
        } else if (field.type === 'text') {
          inputHtml = '<div class="'+inputClass+'">'+COMPONENT_TYPES.text(field.key, value, onChange)+'</div>';
        } else if (field.type === 'time') {
          inputHtml = '<div class="'+inputClass+'">'+COMPONENT_TYPES.time(field.key, value, onChange)+'</div>';
        } else if (field.type === 'select') {
          inputHtml = '<div class="'+inputClass+'">'+COMPONENT_TYPES.select(field.key, value, field.options||[], onChange)+'</div>';
        }

        html += '<div class="cfg-row" style="display:flex;align-items:center;justify-content:space-between;'+
          'padding:10px;margin:4px 0;background:var(--card);border-radius:6px;border:1px solid var(--border)">'+
          '<div style="flex:1"><div style="font-weight:600">'+field.label+'</div>'+
          (field.desc?'<div style="font-size:11px;color:var(--text3);margin-top:2px">'+field.desc+'</div>':'')+'</div>'+
          '<div style="margin-left:12px">'+inputHtml+'</div></div>';
      });

      html += '</div>';
    });

    // 底部操作栏
    html += '<div style="display:flex;gap:8px;margin-top:16px;padding-top:12px;border-top:1px solid var(--border)">'+
      '<button class="btn primary" onclick="TCM.config.save()">💾 保存配置</button>'+
      '<button class="btn" onclick="TCM.config.exportCfg()">📥 导出</button>'+
      '<button class="btn" onclick="TCM.config.importCfg()">📤 导入</button>'+
      '<button class="btn" style="border:1px solid var(--accent);color:var(--accent)" onclick="TCM.config.reset()">🔄 重置默认</button>'+
      '<span id="cfg-save-status" style="margin-left:auto;align-self:center;font-size:12px;color:var(--text3)"></span></div>';

    // CSS（一次性注入）
    if (!document.getElementById('cfg-styles')) {
      html += '<style id="cfg-styles">'+
        '.cfg-input{padding:6px 10px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text);font-size:13px;min-width:80px}'+
        '.cfg-toggle{position:relative;display:inline-block;width:40px;height:22px}'+
        '.cfg-toggle input{opacity:0;width:0;height:0}'+
        '.cfg-toggle-slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:#ccc;transition:.3s;border-radius:22px}'+
        '.cfg-toggle-slider:before{position:absolute;content:"";height:16px;width:16px;left:3px;bottom:3px;background:#fff;transition:.3s;border-radius:50%}'+
        '.cfg-toggle input:checked+.cfg-toggle-slider{background:var(--accent)}'+
        '.cfg-toggle input:checked+.cfg-toggle-slider:before{transform:translateX(18px)}'+
        '</style>';
    }

    el.innerHTML = html;
  }

  // ═══ API ═══
  var API_IMPL = {
    init: render,
    switchTab: function(catId) {
      document.querySelectorAll('.cfg-tab').forEach(function(t) {
        var active = t.dataset.cat === catId;
        t.style.background = active ? 'var(--accent)' : 'var(--card)';
        t.style.color = active ? '#fff' : 'var(--text)';
      });
      document.querySelectorAll('.cfg-panel').forEach(function(p) { p.style.display = 'none'; });
      var panel = document.getElementById('cfg-panel-' + catId);
      if (panel) panel.style.display = 'block';
    },
    update: function(cat, key, el) {
      var config = getConfig();
      if (!config[cat]) config[cat] = {};
      if (el.type === 'checkbox') {
        config[cat][key] = el.checked;
      } else if (el.type === 'number') {
        config[cat][key] = parseFloat(el.value) || 0;
      } else {
        config[cat][key] = el.value;
      }
      saveConfig(config);
      var status = document.getElementById('cfg-save-status');
      if (status) {
        status.textContent = '✅ 已保存 · ' + new Date().toLocaleTimeString('zh-CN');
        status.style.color = 'var(--green)';
        setTimeout(function() { if (status) status.textContent = ''; }, 3000);
      }
    },
    save: function() {
      var status = document.getElementById('cfg-save-status');
      if (status) {
        status.textContent = '✅ 全部配置已保存 · ' + new Date().toLocaleTimeString('zh-CN');
        status.style.color = 'var(--green)';
      }
      if (typeof toast === 'function') toast('✅ 配置已保存');
    },
    exportCfg: function() {
      var config = getConfig();
      var blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'tcm-config-' + new Date().toISOString().slice(0,10) + '.json';
      a.click();
      if (typeof toast === 'function') toast('📥 配置已导出');
    },
    importCfg: function() {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
          try {
            var imported = JSON.parse(ev.target.result);
            saveConfig(imported);
            render('config-panel');
            if (typeof toast === 'function') toast('✅ 配置已导入');
          } catch(err) {
            if (typeof toast === 'function') toast('❌ 导入失败：格式错误');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    },
    reset: async function() {
      if (!await (window.confirmModal ? confirmModal('确定重置所有配置到默认值？此操作不可撤销。', { danger:true, okText:'重置' }) : Promise.resolve(confirm('确定重置所有配置到默认值？')))) return;
      saveConfig(deepCopy(DEFAULT_CONFIG));
      render('config-panel');
      if (typeof toast === 'function') toast('🔄 已重置为默认配置');
    },
    get: getConfig,
    set: saveConfig,
    categories: CATEGORIES,
    fields: FIELDS
  };

  // ═══ 注册全局 ═══
  if (typeof window.TCM === 'undefined') window.TCM = {};
  if (typeof TCM.config === 'undefined') TCM.config = {};
  for (var k in API_IMPL) {
    TCM.config[k] = API_IMPL[k];
  }

  // [config-engine] V1 已加载（日志关闭）
})();
