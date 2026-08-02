/**
 * 化解板块前端渲染器 v1.0
 * 共享模块：被 lifeindex/music/lifeplan/monthly/lifeflow 等工具页引入
 * 用法：HuajieRenderer.render(huajie) → HTML 字符串
 */
window.HuajieRenderer = (function() {

  function render(huajie) {
    if (!huajie) return '';
    var h = huajie;
    var html = '';
    
    html += '<div style="margin-top:16px;padding:14px;background:linear-gradient(135deg,rgba(201,162,39,0.08),rgba(201,162,39,0.02));border:1px solid rgba(201,162,39,0.3);border-radius:10px">';
    html += '<div style="font-size:16px;font-weight:bold;color:#c9a227;margin-bottom:10px;border-bottom:1px solid rgba(201,162,39,0.2);padding-bottom:8px">🌿 化解方案 · ' + (h.risk_label || '') + '</div>';
    
    // 段一：盘面问题溯源
    if (h.risk_traces && h.risk_traces.length) {
      html += '<div style="margin-bottom:10px"><div style="color:#ffb44d;font-weight:600;margin-bottom:6px">一、盘面问题溯源</div>';
      h.risk_traces.forEach(function(t) {
        var sym = t['盘面符号'] || t.symbol || '';
        var symp = t['现实体感'] || t.symptom || '';
        var lvl = t['风险等级'] || t.severity || '';
        html += '<div style="font-size:13px;margin:4px 0;padding:4px 8px;background:rgba(255,255,255,.03);border-radius:4px">▸ <strong>' + sym + '</strong> → ' + symp + '<br><span style="font-size:11px;color:#aaa">' + lvl + '</span></div>';
      });
      html += '</div>';
    }
    
    // 段二：行为心性整改
    if (h.behavior_fixes && h.behavior_fixes.length) {
      html += '<div style="margin-bottom:10px"><div style="color:#4caf50;font-weight:600;margin-bottom:6px">二、行为心性整改（最高优先级）</div>';
      h.behavior_fixes.forEach(function(f) {
        html += '<div style="font-size:13px;margin:3px 0;padding-left:12px;border-left:2px solid #4caf50">' + f + '</div>';
      });
      html += '</div>';
    }
    
    // 段三：环境与随身物品化解
    if (h.environment_cures) {
      var env = h.environment_cures;
      html += '<div style="margin-bottom:10px"><div style="color:#8ab4d8;font-weight:600;margin-bottom:6px">三、环境与随身物品化解</div>';
      if (env.home && env.home.length) {
        html += '<div style="font-size:12px;color:#aaa;margin:4px 0">🏠 居家布局</div>';
        env.home.forEach(function(i) { html += '<div style="font-size:13px;margin:2px 0;padding-left:12px">' + i + '</div>'; });
      }
      if (env.carry && env.carry.length) {
        html += '<div style="font-size:12px;color:#aaa;margin:4px 0">📿 随身物品</div>';
        env.carry.forEach(function(i) { html += '<div style="font-size:13px;margin:2px 0;padding-left:12px">' + i + '</div>'; });
      }
      if (env.cost_range) html += '<div style="font-size:12px;color:#888;margin-top:4px">💰 成本参考：' + env.cost_range + '</div>';
      html += '</div>';
    }
    
    // 段四：执行须知
    if (h.execution_notes && h.execution_notes.length) {
      html += '<div style="margin-bottom:10px"><div style="color:#ff9800;font-weight:600;margin-bottom:6px">四、执行须知</div>';
      h.execution_notes.forEach(function(n) {
        var isHeading = n.indexOf('━━━') >= 0;
        html += '<div style="font-size:' + (isHeading ? '12px' : '13px') + ';margin:2px 0;' + (isHeading ? 'color:#c9a227;font-weight:600;border-top:1px solid rgba(201,162,39,0.15);padding-top:4px;margin-top:6px' : 'padding-left:12px') + '">' + n + '</div>';
      });
      html += '</div>';
    }
    
    // 分流指引
    if (h.referrals && h.referrals.length) {
      html += '<div style="margin-bottom:10px"><div style="color:#e91e63;font-weight:600;margin-bottom:6px">专业分流指引</div>';
      h.referrals.forEach(function(ref) {
        html += '<div style="margin:8px 0;padding:8px;background:rgba(255,255,255,.03);border-radius:6px;border-left:3px solid #e91e63">';
        html += '<div style="font-weight:600;font-size:14px">' + (ref.type || '') + '</div>';
        if (ref.condition) html += '<div style="font-size:12px;color:#aaa;margin:2px 0">适用：' + ref.condition + '</div>';
        if (ref.action) html += '<div style="font-size:12px;color:#aaa;margin:2px 0">建议：' + ref.action + '</div>';
        if (ref.timing) html += '<div style="font-size:12px;color:#ffb44d;margin:2px 0">⏰ 时机：' + ref.timing + '</div>';
        if (ref.nearby && ref.nearby.length) {
          html += '<div style="font-size:12px;color:#aaa;margin:4px 0 1px">📍 就近推荐：</div>';
          ref.nearby.forEach(function(n) {
            html += '<div style="font-size:12px;margin:1px 0;padding-left:12px">→ ' + (n.name || '') + (n.city ? ' (' + n.city + ')' : '') + (n.specialty ? ' ' + n.specialty : '') + (n.note || '') + '</div>';
          });
        }
        if (ref.ceremony && ref.ceremony.length) {
          html += '<div style="font-size:12px;color:#aaa;margin:4px 0 1px">⛩️ 科仪推荐：</div>';
          ref.ceremony.forEach(function(c) {
            html += '<div style="font-size:12px;margin:1px 0;padding-left:12px">→ ' + (c.name || '') + ' | ' + (c.purpose || '') + ' | ' + (c.duration || '') + ' | ' + (c.cost || '') + '</div>';
          });
        }
        if (ref.arrangement) html += '<div style="font-size:12px;margin:3px 0;padding-left:12px">📋 安排：' + ref.arrangement + '</div>';
        if (ref.dates && ref.dates.length) {
          html += '<div style="font-size:12px;color:#aaa;margin:4px 0 1px">📅 吉日候选：</div>';
          ref.dates.slice(0, 6).forEach(function(d) {
            var tag = d.recommended ? ' <span style="color:#c9a227">★</span>' : '';
            html += '<div style="font-size:12px;margin:1px 0;padding-left:12px">→ ' + (d.date || '') + ' ' + (d.weekday || '') + ' ' + (d.ganzhi || '') + (d.reason ? ' (' + d.reason + ')' : '') + tag + '</div>';
          });
        }
        html += '</div>';
      });
      html += '</div>';
    }
    
    // 免责
    if (h.disclaimer) {
      html += '<div style="font-size:11px;color:#666;margin-top:8px;padding:8px;background:rgba(0,0,0,.2);border-radius:4px;line-height:1.5">' + h.disclaimer + '</div>';
    }
    
    html += '</div>';
    return html;
  }

  return { render: render };
})();