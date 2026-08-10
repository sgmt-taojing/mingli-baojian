/**
 * 易道智鉴 · 商城管理后台逻辑
 * shop-admin.js — 商品CRUD、图片上传、分类管理、数据持久化
 */

(function() {
'use strict';

// ==================== 密码保护 ====================
const ADMIN_PASSWORD = 'admin123';

let _authResolver = null;
function initAuth() {
  if (sessionStorage.getItem('shop_admin_authed')) return true;
  // 异步密码模态框
  _showPasswordModal(function(pw) {
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem('shop_admin_authed', '1');
      showToast('✅ 认证成功');
      setTimeout(function() { location.reload(); }, 800);
    } else if (pw !== null) {
      showToast('密码错误！');
      setTimeout(function() { window.location.href = 'divination-hub.html'; }, 1500);
    } else {
      window.location.href = 'divination-hub.html';
    }
  });
  return false;
}

function _showPasswordModal(callback) {
  let existing = document.getElementById('pwdModal');
  if (existing) existing.remove();
  let overlay = document.createElement('div');
  overlay.id = 'pwdModal';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:99999';
  let card = document.createElement('div');
  card.style.cssText = 'background:var(--ink2);border:1px solid rgba(201,168,76,.3);border-radius:14px;padding:32px 28px;max-width:360px;width:90%';
  let title = document.createElement('h3');
  title.textContent = '商城管理后台';
  title.style.cssText = 'color:var(--gold);margin:0 0 20px;font-size:18px;text-align:center';
  let input = document.createElement('input');
  input.type = 'password';
  input.placeholder = '请输入管理密码';
  input.style.cssText = 'width:100%;padding:12px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:var(--paper);font-size:15px;box-sizing:border-box;outline:none;margin-bottom:16px';
  let btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:10px;justify-content:flex-end';
  let cancelBtn = document.createElement('button');
  cancelBtn.textContent = '取消';
  cancelBtn.style.cssText = 'padding:8px 18px;border-radius:8px;border:none;background:rgba(255,255,255,.1);color:var(--paper3);cursor:pointer;font-size:14px';
  let okBtn = document.createElement('button');
  okBtn.textContent = '确认';
  okBtn.style.cssText = 'padding:8px 18px;border-radius:8px;border:none;background:linear-gradient(135deg,var(--gold),var(--gold));color:var(--ink2);cursor:pointer;font-size:14px;font-weight:600';
  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(okBtn);
  card.appendChild(title);
  card.appendChild(input);
  card.appendChild(btnRow);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  input.focus();
  function close(val) { overlay.remove(); callback(val); }
  okBtn.onclick = function() { close(input.value); };
  cancelBtn.onclick = function() { close(null); };
  overlay.onclick = function(e) { if (e.target === overlay) close(null); };
  input.onkeydown = function(e) { if (e.key === 'Enter') close(input.value); };
}

// ==================== 数据存储 ====================
const STORAGE_KEY = 'mingli_shop_data';
const UPLOADS_KEY = 'mingli_shop_uploads';

function loadData() {
  let stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch(e) {}
  }
  // 首次加载从 SHOP_DATA 初始化
  if (window.SHOP_DATA) {
    let data = JSON.parse(JSON.stringify(window.SHOP_DATA));
    saveData(data);
    return data;
  }
  return { categories: [], products: [] };
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadUploads() {
  let stored = localStorage.getItem(UPLOADS_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch(e) {}
  }
  return {};
}

function saveUploads(uploads) {
  localStorage.setItem(UPLOADS_KEY, JSON.stringify(uploads));
}

// ==================== 全局状态 ====================
const shopData = null;
const uploads = {};
const editingProductId = null;
const editingCategoryId = null;
const currentSearch = '';
const currentCategoryFilter = 'all';
const currentStatusFilter = 'all';
const confirmCallback = null;

// ==================== 初始化 ====================
function init() {
  if (!initAuth()) return;
  
  shopData = loadData();
  uploads = loadUploads();
  
  populateCategorySelects();
  renderDashboard();
  renderProductTable();
  renderCategoryList();
  bindEvents();
  setupImageUpload();
}

// ==================== 页面导航 ====================
function showSection(name) {
  document.querySelectorAll('.shop-admin-section').forEach(function(s) {
    s.classList.remove('active');
  });
  let section = document.getElementById('shop-section-' + name);
  if (section) section.classList.add('active');
  
  document.querySelectorAll('.shop-admin-nav a').forEach(function(a) {
    a.classList.remove('active');
  });
  let navLink = document.querySelector('.shop-admin-nav a[data-shop-section="' + name + '"]');
  if (navLink) navLink.classList.add('active');
}

// ==================== 仪表盘 ====================
function renderDashboard() {
  let products = shopData.products;
  let total = products.length;
  let active = products.filter(function(p) { return p.status !== 'offline'; }).length;
  let offline = products.filter(function(p) { return p.status === 'offline'; }).length;
  let categories = shopData.categories.length;
  
  let el = document.getElementById('shop-dashboard-stats');
  if (!el) return;
  el.innerHTML = 
    '<div class="card"><div class="stat">' + total + '</div><div class="meta">总商品数</div></div>' +
    '<div class="card"><div class="stat" style="color:var(--success)">' + active + '</div><div class="meta">已上架</div></div>' +
    '<div class="card"><div class="stat" style="color:var(--cinn2)">' + offline + '</div><div class="meta">已下架</div></div>' +
    '<div class="card"><div class="stat" style="color:var(--cyan2)">' + categories + '</div><div class="meta">商品分类</div></div>';
}

// ==================== 商品表格 ====================
function renderProductTable() {
  let tbody = document.getElementById('shop-product-tbody');
  if (!tbody) return;
  
  let products = getFilteredProducts();
  
  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:3rem;color:var(--gray)">暂无商品数据</td></tr>';
    return;
  }
  
  let html = '';
  products.forEach(function(p) {
    let cat = getCategoryName(p.categoryId);
    let subcat = getSubcategoryName(p.categoryId, p.subcategoryId);
    let statusBadge = p.status === 'offline' 
      ? '<span class="badge badge-err">已下架</span>' 
      : '<span class="badge badge-ok">已上架</span>';
    let img = getProductImage(p);
    let imgHtml = img 
      ? '<img src="' + img + '" style="width:50px;height:50px;object-fit:cover;border-radius:6px" loading="lazy" onerror="this.src=\'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 50 50%22><rect fill=%22%23333%22 width=%2250%22 height=%2250%22/><text x=%2225%22 y=%2230%22 text-anchor=%22middle%22 fill=%22%23888%22 font-size=%2220%22>' + (p.name||'?').charAt(0) + '</text></svg>\'">'
      : '<div style="width:50px;height:50px;background:var(--ink);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:20px">📦</div>';
    
    html += '<tr>' +
      '<td>' + imgHtml + '</td>' +
      '<td><strong>' + escapeHtml(p.name) + '</strong></td>' +
      '<td>' + escapeHtml(cat) + (subcat ? ' / ' + escapeHtml(subcat) : '') + '</td>' +
      '<td style="color:var(--gold-bright);font-weight:600">' + escapeHtml(p.price) + '</td>' +
      '<td>' + (p.stock || '—') + '</td>' +
      '<td>' + statusBadge + '</td>' +
      '<td>' +
        '<button class="btn btn-sm btn-outline" onclick="window._shopAdmin.editProduct(\'' + p.id + '\')" title="编辑">✏️</button> ' +
        '<button class="btn btn-sm btn-outline" onclick="window._shopAdmin.toggleProductStatus(\'' + p.id + '\')" title="' + (p.status === 'offline' ? '上架' : '下架') + '">' + (p.status === 'offline' ? '⬆️' : '⬇️') + '</button> ' +
        '<button class="btn btn-sm btn-outline" style="color:var(--danger);border-color:var(--danger)" onclick="window._shopAdmin.deleteProduct(\'' + p.id + '\')" title="删除">🗑️</button>' +
      '</td>' +
      '</tr>';
  });
  
  tbody.innerHTML = html;
}

function getFilteredProducts() {
  let products = shopData.products.slice();
  
  if (currentSearch) {
    let kw = currentSearch.toLowerCase();
    products = products.filter(function(p) {
      return (p.name || '').toLowerCase().indexOf(kw) >= 0 ||
        (p.description || '').toLowerCase().indexOf(kw) >= 0 ||
        (p.tags || []).join(' ').toLowerCase().indexOf(kw) >= 0;
    });
  }
  
  if (currentCategoryFilter !== 'all') {
    products = products.filter(function(p) {
      return p.categoryId === currentCategoryFilter;
    });
  }
  
  if (currentStatusFilter === 'online') {
    products = products.filter(function(p) { return p.status !== 'offline'; });
  } else if (currentStatusFilter === 'offline') {
    products = products.filter(function(p) { return p.status === 'offline'; });
  }
  
  return products;
}

// ==================== 商品CRUD ====================
function openAddProduct() {
  editingProductId = null;
  document.getElementById('product-form-title').textContent = '新增商品';
  clearProductForm();
  showSection('product-form');
}

function editProduct(id) {
  let p = shopData.products.find(function(x) { return x.id === id; });
  if (!p) return;
  editingProductId = id;
  document.getElementById('product-form-title').textContent = '编辑商品：' + p.name;
  
  // 填充表单
  document.getElementById('prod-name').value = p.name || '';
  document.getElementById('prod-category').value = p.categoryId || '';
  document.getElementById('prod-subcategory').value = p.subcategoryId || '';
  document.getElementById('prod-price').value = p.price || '';
  document.getElementById('prod-original-price').value = p.originalPrice || '';
  document.getElementById('prod-stock').value = p.stock || 0;
  document.getElementById('prod-description').value = p.description || '';
  document.getElementById('prod-effects').value = p.effects || '';
  document.getElementById('prod-suitable').value = p.suitable || '';
  document.getElementById('prod-material').value = p.material || '';
  document.getElementById('prod-size').value = p.size || '';
  document.getElementById('prod-origin').value = p.origin || '';
  document.getElementById('prod-author').value = p.author || '';
  document.getElementById('prod-tags').value = (p.tags || []).join(', ');
  document.getElementById('prod-rating').value = p.rating || '';
  document.getElementById('prod-sales').value = p.sales || 0;
  document.getElementById('prod-reason').value = p.reason || '';
  document.getElementById('prod-status').value = p.status || 'online';
  
  // 加载已上传图片预览
  resetImagePreviews();
  let existingImages = p.images || [];
  if (p.image && existingImages.indexOf(p.image) < 0) {
    existingImages.unshift(p.image);
  }
  if (existingImages.length > 0) {
    existingImages.forEach(function(img, i) {
      if (i < 5) addPreviewImage(img, i);
    });
  }
  
  onCategoryChange();
  showSection('product-form');
  window.scrollTo(0, 0);
}

function saveProduct() {
  let form = getFormData();
  if (!form.name) { showToast('请输入商品名称'); return; }
  if (!form.categoryId) { showToast('请选择分类'); return; }
  
  if (editingProductId) {
    // 编辑
    let idx = shopData.products.findIndex(function(p) { return p.id === editingProductId; });
    if (idx >= 0) {
      shopData.products[idx] = Object.assign({}, shopData.products[idx], form);
    }
  } else {
    // 新增
    form.id = 'prod-' + Date.now();
    form.sales = form.sales || 0;
    shopData.products.push(form);
  }
  
  saveData(shopData);
  renderProductTable();
  renderDashboard();
  showSection('products');
  showToast('保存成功！');
  editingProductId = null;
}

function toggleProductStatus(id) {
  let p = shopData.products.find(function(x) { return x.id === id; });
  if (!p) return;
  p.status = p.status === 'offline' ? 'online' : 'offline';
  saveData(shopData);
  renderProductTable();
  renderDashboard();
}

function deleteProduct(id) {
  let p = shopData.products.find(function(x) { return x.id === id; });
  if (!p) return;
  showConfirm('确定要删除商品「' + p.name + '」吗？此操作不可恢复。', function() {
    shopData.products = shopData.products.filter(function(x) { return x.id !== id; });
    saveData(shopData);
    renderProductTable();
    renderDashboard();
  });
}

function getFormData() {
  let images = getImagePreviews().filter(function(x) { return x; });
  return {
    name: document.getElementById('prod-name').value.trim(),
    categoryId: document.getElementById('prod-category').value,
    subcategoryId: document.getElementById('prod-subcategory').value || '',
    price: document.getElementById('prod-price').value.trim(),
    originalPrice: document.getElementById('prod-original-price').value.trim() || '',
    stock: parseInt(document.getElementById('prod-stock').value) || 0,
    description: document.getElementById('prod-description').value.trim(),
    effects: document.getElementById('prod-effects').value.trim(),
    suitable: document.getElementById('prod-suitable').value.trim(),
    material: document.getElementById('prod-material').value.trim(),
    size: document.getElementById('prod-size').value.trim(),
    origin: document.getElementById('prod-origin').value.trim(),
    author: document.getElementById('prod-author').value.trim(),
    tags: document.getElementById('prod-tags').value.split(',').map(function(t) { return t.trim(); }).filter(function(t) { return t; }),
    rating: parseFloat(document.getElementById('prod-rating').value) || 0,
    sales: parseInt(document.getElementById('prod-sales').value) || 0,
    reason: document.getElementById('prod-reason').value.trim(),
    status: document.getElementById('prod-status').value || 'online',
    image: images[0] || '',
    images: images
  };
}

function clearProductForm() {
  ['prod-name','prod-category','prod-subcategory','prod-price','prod-original-price','prod-stock',
   'prod-description','prod-effects','prod-suitable','prod-material','prod-size','prod-origin',
   'prod-author','prod-tags','prod-rating','prod-sales','prod-reason'].forEach(function(id) {
    let el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('prod-status').value = 'online';
  document.getElementById('prod-stock').value = '0';
  document.getElementById('prod-sales').value = '0';
  editingProductId = null;
  resetImagePreviews();
}

// ==================== 分类管理 ====================
function populateCategorySelects() {
  const selects = ['prod-category', 'shop-category-filter'];
  selects.forEach(function(selId) {
    let sel = document.getElementById(selId);
    if (!sel) return;
    let val = sel.value;
    sel.innerHTML = '<option value="">-- 选择分类 --</option>';
    if (selId === 'shop-category-filter') sel.innerHTML = '<option value="all">全部分类</option>';
    shopData.categories.forEach(function(c) {
      sel.insertAdjacentHTML('beforeend', '<option value="' + c.id + '">' + c.icon + ' ' + c.name + '</option>');
    });
    sel.value = val;
  });
}

function onCategoryChange() {
  let catId = document.getElementById('prod-category').value;
  let subSel = document.getElementById('prod-subcategory');
  subSel.innerHTML = '<option value="">-- 选择子分类 --</option>';
  if (!catId) return;
  let cat = shopData.categories.find(function(c) { return c.id === catId; });
  if (cat && cat.subcategories) {
    cat.subcategories.forEach(function(sc) {
      subSel.insertAdjacentHTML('beforeend', '<option value="' + sc.id + '">' + sc.name + '</option>');
    });
  }
}

function renderCategoryList() {
  let el = document.getElementById('shop-category-list');
  if (!el) return;
  
  if (shopData.categories.length === 0) {
    el.innerHTML = '<p style="color:var(--gray)">暂无分类数据</p>';
    return;
  }
  
  let html = '';
  shopData.categories.forEach(function(c) {
    let subCount = c.subcategories ? c.subcategories.length : 0;
    html += '<div class="cat-item">' +
      '<div class="cat-info">' +
      '<span style="font-size:1.2rem">' + c.icon + '</span> ' +
      '<strong>' + escapeHtml(c.name) + '</strong> ' +
      '<span style="color:var(--gray)">(' + subCount + '个子分类)</span>' +
      '</div>' +
      '<div class="cat-actions">' +
      '<button class="btn btn-sm btn-outline" onclick="window._shopAdmin.editCategory(\'' + c.id + '\')">✏️</button> ' +
      '<button class="btn btn-sm btn-outline" style="color:var(--danger)" onclick="window._shopAdmin.deleteCategory(\'' + c.id + '\')">🗑️</button>' +
      '</div>' +
      '</div>';
  });
  
  el.innerHTML = html;
}

function openAddCategory() {
  editingCategoryId = null;
  document.getElementById('cat-form-title').textContent = '新增分类';
  document.getElementById('cat-name').value = '';
  document.getElementById('cat-icon').value = '';
  document.getElementById('cat-desc').value = '';
  document.getElementById('cat-sub-list').value = '';
  showSection('category-form');
}

function editCategory(id) {
  let c = shopData.categories.find(function(x) { return x.id === id; });
  if (!c) return;
  editingCategoryId = id;
  document.getElementById('cat-form-title').textContent = '编辑分类：' + c.name;
  document.getElementById('cat-name').value = c.name || '';
  document.getElementById('cat-icon').value = c.icon || '';
  document.getElementById('cat-desc').value = c.description || '';
  document.getElementById('cat-sub-list').value = (c.subcategories || []).map(function(s) {
    return s.id + '|' + s.name + '|' + (s.color || '') + '|' + (s.desc || '');
  }).join('\n');
  showSection('category-form');
}

function saveCategory() {
  let name = document.getElementById('cat-name').value.trim();
  let icon = document.getElementById('cat-icon').value.trim();
  let desc = document.getElementById('cat-desc').value.trim();
  let subText = document.getElementById('cat-sub-list').value.trim();
  
  if (!name) { showToast('请输入分类名称'); return; }
  if (!icon) { showToast('请输入分类图标（emoji）'); return; }
  
  const subcategories = [];
  if (subText) {
    subText.split('\n').forEach(function(line) {
      let parts = line.split('|');
      if (parts.length >= 2) {
        subcategories.push({
          id: parts[0].trim(),
          name: parts[1].trim(),
          color: parts[2] ? parts[2].trim() : 'var(--steel)',
          desc: parts[3] ? parts[3].trim() : ''
        });
      }
    });
  }
  
  let catData = {
    id: editingCategoryId || 'cat-' + Date.now(),
    name: name,
    icon: icon,
    description: desc,
    subcategories: subcategories
  };
  
  if (editingCategoryId) {
    let idx = shopData.categories.findIndex(function(c) { return c.id === editingCategoryId; });
    if (idx >= 0) shopData.categories[idx] = catData;
  } else {
    shopData.categories.push(catData);
  }
  
  saveData(shopData);
  populateCategorySelects();
  renderCategoryList();
  renderDashboard();
  showSection('categories');
  showToast('保存成功！');
  editingCategoryId = null;
}

function deleteCategory(id) {
  let c = shopData.categories.find(function(x) { return x.id === id; });
  if (!c) return;
  // 检查是否有商品使用此分类
  let usedCount = shopData.products.filter(function(p) { return p.categoryId === id; }).length;
  const msg = '确定要删除分类「' + c.name + '」吗？';
  if (usedCount > 0) msg += '\n\n⚠️ 有 ' + usedCount + ' 件商品使用此分类，删除后它们将失去分类归属。';
  showConfirm(msg, function() {
    shopData.categories = shopData.categories.filter(function(x) { return x.id !== id; });
    saveData(shopData);
    populateCategorySelects();
    renderCategoryList();
    renderDashboard();
  });
}

// ==================== 图片上传 ====================
const imagePreviews = [null, null, null, null, null];

function setupImageUpload() {
  let dropZone = document.getElementById('image-drop-zone');
  let fileInput = document.getElementById('image-file-input');
  if (!dropZone || !fileInput) return;
  
  dropZone.addEventListener('click', function() { fileInput.click(); });
  dropZone.addEventListener('dragover', function(e) { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', function() { dropZone.classList.remove('dragover'); });
  dropZone.addEventListener('drop', function(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });
  
  fileInput.addEventListener('change', function() {
    handleFiles(fileInput.files);
  });
}

function handleFiles(files) {
  Array.from(files).forEach(function(file) {
    if (!file.type.match(/^image\//)) return;
    
    // 找第一个空位
    const slot = -1;
    for (let i = 0; i < 5; i++) {
      if (!imagePreviews[i]) { slot = i; break; }
    }
    if (slot < 0) { showToast('最多上传5张图片'); return; }
    
    let reader = new FileReader();
    reader.onload = function(e) {
      let dataUrl = e.target.result;
      addPreviewImage(dataUrl, slot);
    };
    reader.readAsDataURL(file);
  });
}

function addPreviewImage(dataUrl, slot) {
  imagePreviews[slot] = dataUrl;
  renderImagePreviews();
}

function removePreviewImage(slot) {
  imagePreviews[slot] = null;
  // 压缩数组
  imagePreviews = imagePreviews.filter(function(x) { return x; });
  while (imagePreviews.length < 5) imagePreviews.push(null);
  renderImagePreviews();
}

function getImagePreviews() {
  return imagePreviews.slice();
}

function resetImagePreviews() {
  imagePreviews = [null, null, null, null, null];
  renderImagePreviews();
}

function renderImagePreviews() {
  let container = document.getElementById('image-preview-container');
  if (!container) return;
  
  let hasImages = imagePreviews.some(function(x) { return x; });
  
  let html = '';
  imagePreviews.forEach(function(img, i) {
    if (img) {
      html += '<div class="img-preview-item">' +
        '<img src="' + img + '" alt="预览图' + (i+1) + '">' +
        '<button class="img-remove-btn" onclick="window._shopAdmin.removePreviewImage(' + i + ')" title="移除">✕</button>' +
        (i === 0 ? '<span class="img-main-badge">主图</span>' : '') +
        '</div>';
    } else {
      html += '<div class="img-preview-item empty">' +
        '<span style="color:var(--gray)">图' + (i+1) + '</span>' +
        '</div>';
    }
  });
  
  container.innerHTML = html;
}

// ==================== 数据导入导出 ====================
function exportData() {
  let json = JSON.stringify(shopData, null, 2);
  let blob = new Blob([json], { type: 'application/json' });
  let url = URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url;
  a.download = 'shop-data-backup-' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importData() {
  let input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = function() {
    let file = input.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = function(e) {
      try {
        let data = JSON.parse(e.target.result);
        if (!data.products || !data.categories) {
          showToast('JSON格式不正确，需要包含 products 和 categories 字段');
          return;
        }
        showConfirm('即将导入 ' + data.products.length + ' 件商品和 ' + data.categories.length + ' 个分类。\n\n⚠️ 当前数据将被覆盖，请确保已导出备份。', function() {
          shopData = data;
          saveData(shopData);
          populateCategorySelects();
          renderDashboard();
          renderProductTable();
          renderCategoryList();
          showToast('导入成功！');
        });
      } catch(err) {
        showToast('JSON解析失败：' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function resetData() {
  showConfirm('⚠️ 重置所有数据？此操作将恢复为默认数据，所有修改将丢失。', function() {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });
}

// ==================== 确认弹窗 ====================
function showConfirm(message, callback) {
  confirmCallback = callback;
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-modal').style.display = 'flex';
}

function closeConfirm() {
  document.getElementById('confirm-modal').style.display = 'none';
}

function executeConfirm() {
  document.getElementById('confirm-modal').style.display = 'none';
  if (confirmCallback) { confirmCallback(); confirmCallback = null; }
}

// ==================== 工具函数 ====================
function getCategoryName(catId) {
  let cat = shopData.categories.find(function(c) { return c.id === catId; });
  return cat ? cat.name : catId || '—';
}

function getSubcategoryName(catId, subId) {
  if (!subId) return '';
  let cat = shopData.categories.find(function(c) { return c.id === catId; });
  if (!cat || !cat.subcategories) return subId;
  let sub = cat.subcategories.find(function(s) { return s.id === subId; });
  return sub ? sub.name : subId;
}

function getProductImage(p) {
  if (p.image && p.image !== '🖼️' && !p.image.match(/^[🔮💎📿💊📜🧉🍵🥜🏺🖤💠🐠❤️💜🕯️💛🐱🎋👴🖌️🔄🧘🪷⚔️🪞🍯☯️🔔🌳💮🔵⛰️🪶📚🙏🤲💗👁️🌿🪨]/)) {
    return p.image;
  }
  if (p.images && p.images.length > 0) return p.images[0];
  return null;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function searchProducts() {
  currentSearch = document.getElementById('shop-search-input').value.trim();
  renderProductTable();
}

function filterByCategory() {
  currentCategoryFilter = document.getElementById('shop-category-filter').value;
  renderProductTable();
}

function filterByStatus() {
  currentStatusFilter = document.getElementById('shop-status-filter').value;
  renderProductTable();
}

// ==================== 事件绑定 ====================
function bindEvents() {
  // 导航
  document.querySelectorAll('.shop-admin-nav a[data-shop-section]').forEach(function(a) {
    a.addEventListener('click', function(e) {
      e.preventDefault();
      showSection(this.dataset.shopSection);
    });
  });
  
  // 搜索
  let searchInput = document.getElementById('shop-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(searchProducts, 300));
  }
  
  // 分类切换时更新子分类
  let catSelect = document.getElementById('prod-category');
  if (catSelect) {
    catSelect.addEventListener('change', onCategoryChange);
  }
  
  // 确认弹窗
  document.getElementById('confirm-cancel')?.addEventListener('click', closeConfirm);
  document.getElementById('confirm-ok')?.addEventListener('click', executeConfirm);
  document.getElementById('confirm-modal')?.addEventListener('click', function(e) {
    if (e.target === this) closeConfirm();
  });
  
  // ESC 关闭弹窗
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      let modal = document.getElementById('confirm-modal');
      if (modal && modal.style.display === 'flex') closeConfirm();
    }
  });
}

function debounce(fn, delay) {
  let timer;
  return function() {
    let args = arguments, ctx = this;
    clearTimeout(timer);
    timer = setTimeout(function() { fn.apply(ctx, args); }, delay);
  };
}

// ==================== 暴露API ====================
window._shopAdmin = {
  init: init,
  showSection: showSection,
  openAddProduct: openAddProduct,
  editProduct: editProduct,
  saveProduct: saveProduct,
  toggleProductStatus: toggleProductStatus,
  deleteProduct: deleteProduct,
  onCategoryChange: onCategoryChange,
  openAddCategory: openAddCategory,
  editCategory: editCategory,
  saveCategory: saveCategory,
  deleteCategory: deleteCategory,
  removePreviewImage: removePreviewImage,
  exportData: exportData,
  importData: importData,
  resetData: resetData,
  searchProducts: searchProducts,
  filterByCategory: filterByCategory,
  filterByStatus: filterByStatus,
  getProductImage: getProductImage,
  getData: function() { return shopData; }
};

// 页面加载时初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
