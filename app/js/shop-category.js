// ===== 商城分类切换 =====
function showShopCategory(name, btn) {
  // 切换标签状态
  document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  
  // 切换面板显示
  document.querySelectorAll('.shop-panel').forEach(p => p.style.display = 'none');
  var panel = document.getElementById('shopPanel-' + name);
  if (panel) panel.style.display = 'block';
  
  // 懒加载数据
  if (name === 'daoyi' && document.getElementById('daoyi-grid').children.length === 0) {
    renderDaoyiProducts();
  } else if (name === 'foyi' && document.getElementById('foyi-grid').children.length === 0) {
    renderFoyiProducts();
  } else if (name === 'masters' && document.getElementById('masters-grid').children.length === 0) {
    renderMasters();
  }
}

// ===== 渲染道医产品 =====
function renderDaoyiProducts() {
  var grid = document.getElementById('daoyi-grid');
  if (!grid || typeof DAO_MEDICINE === 'undefined') return;
  
  DAO_MEDICINE.forEach(function(item) {
    var card = document.createElement('div');
    card.className = 'medicine-card';
    card.style.cssText = 'background:rgba(255,255,255,0.03);border:1px solid rgba(201,168,76,0.2);border-radius:12px;overflow:hidden;cursor:pointer;transition:all .3s';
    card.onmouseover = function() { this.style.borderColor='rgba(201,168,76,0.5)';this.style.transform='translateY(-4px)' };
    card.onmouseout = function() { this.style.borderColor='rgba(201,168,76,0.2)';this.style.transform='translateY(0)' };
    card.onclick = function() { showMedicineDetail(item) };
    
    card.innerHTML = 
      '<div style="height:100px;background:linear-gradient(135deg,rgba(201,168,76,0.12),rgba(201,168,76,0.03));display:flex;align-items:center;justify-content:center;font-size:48px">' + item.image + '</div>' +
      '<div style="padding:16px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
          '<span style="font-size:14px;color:var(--gold);font-weight:bold">' + item.name + '</span>' +
          '<span style="font-size:11px;background:rgba(201,168,76,0.15);color:var(--gold);padding:2px 8px;border-radius:10px">' + item.school + '</span>' +
        '</div>' +
        '<p style="font-size:12px;color:var(--paper2);margin-bottom:10px;line-height:1.6">' + item.desc + '</p>' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<span style="font-size:16px;color:var(--gold)">¥' + item.price + '</span>' +
          '<span style="font-size:11px;opacity:.5">' + item.master + '</span>' +
        '</div>' +
      '</div>';
    
    grid.appendChild(card);
  });
}

// ===== 渲染佛医产品 =====
function renderFoyiProducts() {
  var grid = document.getElementById('foyi-grid');
  if (!grid || typeof FO_MEDICINE === 'undefined') return;
  
  FO_MEDICINE.forEach(function(item) {
    var card = document.createElement('div');
    card.className = 'medicine-card';
    card.style.cssText = 'background:rgba(255,255,255,0.03);border:1px solid rgba(147,112,219,0.2);border-radius:12px;overflow:hidden;cursor:pointer;transition:all .3s';
    card.onmouseover = function() { this.style.borderColor='rgba(147,112,219,0.5)';this.style.transform='translateY(-4px)' };
    card.onmouseout = function() { this.style.borderColor='rgba(147,112,219,0.2)';this.style.transform='translateY(0)' };
    card.onclick = function() { showMedicineDetail(item) };
    
    var blessingBadge = item.blessing ? '<span style="font-size:10px;background:rgba(147,112,219,0.2);color:#9370DB;padding:2px 6px;border-radius:8px;margin-top:8px;display:inline-block">✨ 已加持</span>' : '';
    
    card.innerHTML = 
      '<div style="height:100px;background:linear-gradient(135deg,rgba(147,112,219,0.12),rgba(147,112,219,0.03));display:flex;align-items:center;justify-content:center;font-size:48px">' + item.image + '</div>' +
      '<div style="padding:16px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
          '<span style="font-size:14px;color:#9370DB;font-weight:bold">' + item.name + '</span>' +
          '<span style="font-size:11px;background:rgba(147,112,219,0.15);color:#9370DB;padding:2px 8px;border-radius:10px">' + item.school + '</span>' +
        '</div>' +
        '<p style="font-size:12px;color:var(--paper2);margin-bottom:10px;line-height:1.6">' + item.desc + '</p>' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<span style="font-size:16px;color:#9370DB">¥' + item.price + '</span>' +
          '<span style="font-size:11px;opacity:.5">' + item.master + '</span>' +
        '</div>' +
        blessingBadge +
      '</div>';
    
    grid.appendChild(card);
  });
}

// ===== 渲染名医推荐 =====
function renderMasters() {
  var grid = document.getElementById('masters-grid');
  if (!grid || typeof MASTERS_LIST === 'undefined') return;
  
  MASTERS_LIST.forEach(function(m) {
    var card = document.createElement('div');
    card.className = 'master-card';
    
    var schoolColor = m.school === '道医' ? 'var(--gold)' : (m.school === '佛医' ? '#9370DB' : 'var(--cyan)');
    var schoolBg = m.school === '道医' ? 'rgba(201,168,76,0.1)' : (m.school === '佛医' ? 'rgba(147,112,219,0.1)' : 'rgba(0,188,212,0.1)');
    
    card.style.cssText = 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px;transition:all .3s';
    card.onmouseover = function() { this.style.borderColor=schoolColor;this.style.background='rgba(255,255,255,0.05)' };
    card.onmouseout = function() { this.style.borderColor='rgba(255,255,255,0.1)';this.style.background='rgba(255,255,255,0.03)' };
    
    var servicesHtml = m.services.map(function(s) {
      return '<span style="font-size:11px;background:' + schoolBg + ';color:' + schoolColor + ';padding:4px 10px;border-radius:12px;margin:4px 4px 4px 0;display:inline-block">' + s + '</span>';
    }).join('');
    
    card.innerHTML = 
      '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">' +
        '<div>' +
          '<h4 style="font-size:16px;color:var(--paper);margin-bottom:4px">' + m.name + '</h4>' +
          '<p style="font-size:12px;color:var(--paper2)">' + m.title + '</p>' +
        '</div>' +
        '<div style="text-align:right">' +
          '<span style="font-size:12px;background:' + schoolBg + ';color:' + schoolColor + ';padding:4px 12px;border-radius:12px">' + m.school + '</span>' +
          '<p style="font-size:12px;color:var(--gold);margin-top:8px">' + m.level + '</p>' +
        '</div>' +
      '</div>' +
      '<div style="margin-bottom:12px">' +
        '<p style="font-size:12px;color:var(--paper2);line-height:1.7"><b>擅长:</b> ' + m.specialty + '</p>' +
        '<p style="font-size:12px;color:var(--paper2);line-height:1.7"><b>资历:</b> ' + m.experience + '</p>' +
        '<p style="font-size:12px;color:var(--paper2);line-height:1.7"><b>地点:</b> ' + m.location + '</p>' +
      '</div>' +
      '<p style="font-size:12px;color:var(--paper2);line-height:1.7;margin-bottom:12px">' + m.intro + '</p>' +
      '<div style="margin-bottom:12px">' + servicesHtml + '</div>' +
      '<div style="padding-top:12px;border-top:1px solid rgba(255,255,255,0.05)">' +
        '<p style="font-size:12px;color:' + schoolColor + '"><b>联系方式:</b> ' + m.contact + '</p>' +
      '</div>';
    
    grid.appendChild(card);
  });
}

// ===== 产品详情弹窗 =====
function showMedicineDetail(item) {
  var modal = document.getElementById('medicineDetailModal');
  var title = document.getElementById('medicineDetailTitle');
  var content = document.getElementById('medicineDetailContent');
  
  if (!modal || !title || !content) {
    alert(item.name + '\n\n' + item.desc + '\n\n价格: ¥' + item.price + '\n\n' + item.master + ' | ' + item.origin);
    return;
  }
  
  title.textContent = item.name;
  
  var color = item.school === '道医' ? 'var(--gold)' : '#9370DB';
  
  content.innerHTML = 
    '<div style="font-size:48px;text-align:center;margin-bottom:20px">' + item.image + '</div>' +
    '<div style="display:flex;gap:12px;justify-content:center;margin-bottom:16px">' +
      '<span style="background:rgba(255,255,255,0.05);padding:4px 12px;border-radius:12px;font-size:12px;color:' + color + '">' + item.school + '</span>' +
      '<span style="background:rgba(255,255,255,0.05);padding:4px 12px;border-radius:12px;font-size:12px">' + item.category + '</span>' +
    '</div>' +
    '<p style="line-height:1.8;margin-bottom:16px">' + item.desc + '</p>' +
    '<div style="background:rgba(255,255,255,0.03);padding:16px;border-radius:8px;margin-bottom:16px">' +
      '<p style="font-size:13px;margin-bottom:8px"><b>主要成分:</b></p>' +
      '<p style="font-size:12px;color:var(--paper2);line-height:1.6">' + item.ingredients + '</p>' +
    '</div>' +
    '<div style="background:rgba(255,255,255,0.03);padding:16px;border-radius:8px;margin-bottom:16px">' +
      '<p style="font-size:13px;margin-bottom:8px"><b>使用方法:</b></p>' +
      '<p style="font-size:12px;color:var(--paper2);line-height:1.6">' + item.usage + '</p>' +
    '</div>' +
    '<div style="background:rgba(255,100,100,0.05);border:1px solid rgba(255,100,100,0.2);padding:16px;border-radius:8px;margin-bottom:16px">' +
      '<p style="font-size:13px;margin-bottom:8px;color:#ff6b6b"><b>⚠️ 注意事项:</b></p>' +
      '<p style="font-size:12px;color:var(--paper2);line-height:1.6">' + item.caution + '</p>' +
    '</div>' +
    (item.blessing ? '<div style="background:rgba(147,112,219,0.1);padding:16px;border-radius:8px;margin-bottom:16px"><p style="font-size:12px;color:#9370DB">✨ ' + item.blessing + '</p></div>' : '') +
    '<div style="display:flex;justify-content:space-between;align-items:center;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1)">' +
      '<div>' +
        '<p style="font-size:20px;color:' + color + ';font-weight:bold">¥' + item.price + '</p>' +
        '<p style="font-size:11px;opacity:.5">' + item.master + '</p>' +
      '</div>' +
      '<p style="font-size:12px;opacity:.6">产地: ' + item.origin + '</p>' +
    '</div>';
  
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeMedicineDetail() {
  var modal = document.getElementById('medicineDetailModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}
