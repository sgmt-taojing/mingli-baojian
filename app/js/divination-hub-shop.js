// ===== 商城分类切换 =====
// ===== 商城状态 =====
let currentShopCategory = 'all';
let currentSortMode = 'default';
let currentSearchKeyword = '';
let shopCart = [];

// ===== 分类筛选 =====
function filterShopProducts(cat, btn) {
  currentShopCategory = cat;
  // 切换标签激活状态
  document.querySelectorAll('.shop-tab').forEach(function(t) { t.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  // 显示/隐藏专区简介
  ['daoyi','foyi','masters'].forEach(function(k){
    let intro=document.getElementById('shopIntro-'+k);
    if(intro) intro.style.display = (cat===k)?'block':'none';
  });
  renderShopProducts();
}

// ===== 搜索 =====
function searchShopProducts() {
  let input = document.getElementById('shopSearchInput');
  currentSearchKeyword = input? input.value.trim().toLowerCase(): '';
  renderShopProducts();
}

// ===== 排序 =====
function sortShopProducts() {
  let select = document.getElementById('shopSortSelect');
  currentSortMode = select? select.value: 'default';
  renderShopProducts();
}

// ===== 获取筛选后商品 =====
function getFilteredShopProducts() {
  if (typeof window.SHOP_DATA === 'undefined') return [];
  let products = window.SHOP_DATA.products.slice();
  
  // 分类筛选
  if (currentShopCategory !== 'all') {
    products = products.filter(function(p) {
      let cat = currentShopCategory;
      if (cat === 'jixiang') return p.categoryId === 'mingli-huajie';
      if (cat === 'daoyi') return p.subcategoryId === 'daoyi';
      if (cat === 'foyi') return p.subcategoryId === 'foyi';
      if (cat === 'masters') return p.subcategoryId === 'daoyi' || p.subcategoryId === 'foyi';
      if (cat === 'jingdian') return p.categoryId === 'jingdian';
      if (cat === 'rujia-jing') return p.subcategoryId === 'rujia-jing';
      if (cat === 'daojia-jing') return p.subcategoryId === 'daojia-jing';
      if (cat === 'fojia-jing') return p.subcategoryId === 'fojia-jing';
      return p.categoryId === cat;
    });
  }
  
  // 搜索筛选
  if (currentSearchKeyword) {
    products = products.filter(function(p) {
      let name = (p.name||'').toLowerCase();
      let author = (p.author||'').toLowerCase();
      let desc = (p.description||'').toLowerCase();
      let tags = (p.tags||[]).join(' ').toLowerCase();
      return name.indexOf(currentSearchKeyword)>=0 || author.indexOf(currentSearchKeyword)>=0 || desc.indexOf(currentSearchKeyword)>=0 || tags.indexOf(currentSearchKeyword)>=0;
    });
  }
  
  // 排序
  if (currentSortMode === 'price-asc') {
    products.sort(function(a,b){ return parsePrice(a.price) - parsePrice(b.price); });
  } else if (currentSortMode === 'price-desc') {
    products.sort(function(a,b){ return parsePrice(b.price) - parsePrice(a.price); });
  } else if (currentSortMode === 'sales') {
    products.sort(function(a,b){ return (b.sales||0) - (a.sales||0); });
  } else if (currentSortMode === 'rating') {
    products.sort(function(a,b){ return (b.rating||0) - (a.rating||0); });
  }
  
  return products;
}

// 价格解析（从"¥128"或"¥168-588"提取最小值）
function parsePrice(str) {
  if (!str) return 0;
  let m = String(str).match(/\d+/);
  return m? parseInt(m[0]): 0;
}

// ===== 渲染商品 =====
function renderShopProducts() {
  let grid = document.getElementById('shopProductGrid');
  let empty = document.getElementById('shopEmpty');
  if (!grid) return;
  
  let products = getFilteredShopProducts();
  
  if (products.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  
  let html = '';
  products.forEach(function(item) {
    let isClassic = item.categoryId === 'jingdian';
    let isMaster = item.subcategoryId === 'daoyi' || item.subcategoryId === 'foyi';
    
    if (isClassic) {
      // 经典著作 - 书卷风格卡片
      let tagsHtml = (item.tags||[]).map(function(t){
        return '<span class="classic-tag">'+t+'</span>';
      }).join('');
      let priceHtml = item.price;
      if (item.originalPrice) {
        priceHtml += '<small>'+item.originalPrice+'</small>';
      }
      html += '<ml-tap class="classic-card" onclick="showProductDetail(\''+item.id+'\')" variant="card" role="button" tabindex="0">';
      html += '<div class="classic-spine">'+item.name.replace(/（.*$/,'').slice(0,6)+'</div>';
      html += '<div class="classic-body">';
      html += '<div>';
      html += '<h4>'+item.name+'</h4>';
      html += '<div class="classic-author">'+(item.author||'')+'</div>';
      html += '<div class="classic-desc">'+(item.description||'').slice(0,80)+'...</div>';
      html += '<div style="margin-top:4px">'+tagsHtml+'</div>';
      html += '</div>';
      html += '<div class="classic-footer">';
      html += '<div><span class="classic-price">'+priceHtml+'</span> <span class="classic-rating">⭐'+item.rating+' · 售'+(item.sales||0).toLocaleString()+'</span></div>';
      html += '<button class="classic-cart-btn" onclick="event.stopPropagation();addToCart(\''+item.id+'\')">加入购物车</button>';
      html += '</div>';
      html += '</div></ml-tap>';
    } else if (isMaster) {
      // 名师卡片
      html += '<ml-tap class="master-card-new" onclick="showProductDetail(\''+item.id+'\')" variant="card" role="button" tabindex="0">';
      html += '<div class="master-avatar">'+(item.image||'👨‍⚕️')+'</div>';
      html += '<div class="master-info">';
      html += '<h4>'+item.name+'</h4>';
      html += '<p class="title">'+(item.description||'')+'</p>';
      html += '<p class="desc">'+(item.effects||'')+'</p>';
      html += '<div class="master-tags">'+(item.tags||[]).map(function(t){return '<span>'+t+'</span>';}).join('')+'</div>';
      html += '<div style="margin-top:6px;font-size:12px;color:var(--gold)">⭐'+item.rating+' · 服务'+(item.sales||0).toLocaleString()+'+人 · '+item.price+'</div>';
      html += '</div></ml-tap>';
    } else {
      // 暗金风格卡片（法器/吉祥物）
      html += '<ml-tap class="gold-card" onclick="showProductDetail(\''+item.id+'\')" variant="card" role="button" tabindex="0">';
      html += '<div class="gold-card-img">'+(item.image||'📦')+'</div>';
      html += '<div class="gold-card-body">';
      html += '<h4>'+item.name+'</h4>';
      html += '<div class="gold-card-sub">'+(item.origin||item.author||'')+'</div>';
      html += '<div class="gold-card-desc">'+(item.description||'')+'</div>';
      html += '<div class="gold-card-footer">';
      html += '<div><span class="gold-card-price">'+item.price+'</span> <span class="gold-card-rating">⭐'+item.rating+' · '+(item.sales||0).toLocaleString()+'售</span></div>';
      html += '<button class="gold-cart-btn" onclick="event.stopPropagation();addToCart(\''+item.id+'\')">加入购物车</button>';
      html += '</div>';
      html += '</div></ml-tap>';
    }
  });
  grid.innerHTML = html;
}

// ===== 兼容旧调用 =====
// showShopCategory 已由主定义（第7879行）处理，此处不再重复定义
function renderShopProductsOld(category) {
  renderShopProducts();
}
function showProductDetailFromData(productId) {
  showProductDetail(productId);
}

// ===== 商品详情弹窗 =====
function showProductDetail(productId) {
  if (typeof window.SHOP_DATA === 'undefined') return;
  let item = window.SHOP_DATA.products.find(function(p) { return p.id === productId; });
  if (!item) return;
  
  let modal = document.getElementById('shopDetailModal');
  let title = document.getElementById('shopDetailTitle');
  let content = document.getElementById('shopDetailContent');
  if (!modal || !title || !content) return;
  
  title.textContent = item.name;
  
  let tagsHtml = (item.tags||[]).map(function(t){
    return '<span>'+t+'</span>';
  }).join('');
  
  let isClassic = item.categoryId === 'jingdian';
  let html = '';
  
  // 大图
  html += '<div class="detail-img-large">'+(item.image||'📦')+'</div>';
  
  // 标签
  if (tagsHtml) html += '<div class="detail-tags">'+tagsHtml+'</div>';
  
  // 作者/产地
  if (item.author) html += '<p style="text-align:center;font-size:12px;color:var(--paper2);margin-bottom:16px">作者/注疏：'+item.author+'</p>';
  
  // 简介
  html += '<div class="detail-section"><div class="detail-section-title">📖 内容简介</div><div class="detail-section-text">'+item.description+'</div></div>';
  
  // 经典著作特有信息
  if (isClassic) {
    if (item.effects) html += '<div class="detail-section"><div class="detail-section-title">✨ 阅读价值</div><div class="detail-section-text">'+item.effects+'</div></div>';
    if (item.suitable) html += '<div class="detail-section"><div class="detail-section-title">👥 适用人群</div><div class="detail-section-text">'+item.suitable+'</div></div>';
  } else {
    if (item.effects) html += '<div class="detail-section"><div class="detail-section-title">功效</div><div class="detail-section-text">'+item.effects+'</div></div>';
    if (item.suitable) html += '<div class="detail-section"><div class="detail-section-title">适用人群</div><div class="detail-section-text">'+item.suitable+'</div></div>';
  }
  
  // 推荐理由
  if (item.reason) html += '<div class="detail-section" style="background:rgba(39,174,96,0.05);border:1px solid rgba(39,174,96,0.15)"><div class="detail-section-title" style="color:var(--success)">推荐理由</div><div class="detail-section-text">'+item.reason+'</div></div>';
  
  // 经典著作增加阅读建议
  if (isClassic) {
    let subCat = item.subcategoryId || '';
    let suggestion = '';
    if (subCat === 'rujia-jing') suggestion = '建议先通读白话翻译了解大意，再对照原文逐章精读，结合注疏深入理解。可配合相关研究论著拓展视野。';
    else if (subCat === 'daojia-jing') suggestion = '建议由浅入深，先读白话版建立整体认知，再研读注疏版深入义理。注意结合实践体悟，切忌仅停留在文字层面。';
    else if (subCat === 'fojia-jing') suggestion = '建议以恭敬心读诵，先了解背景知识，再逐品研读。可配合高僧大德讲经视频辅助理解，注重实修实证。';
    if (suggestion) html += '<div class="detail-section"><div class="detail-section-title">📚 阅读建议</div><div class="detail-section-text">'+suggestion+'</div></div>';
  }
  
  // 底部价格栏
  html += '<div class="detail-footer">';
  html += '<div>';
  html += '<div class="detail-price">'+item.price+'</div>';
  if (item.originalPrice) html += '<div style="font-size:12px;color:var(--paper2);text-decoration:line-through">'+item.originalPrice+'</div>';
  html += '<div style="font-size:11px;color:var(--paper2);margin-top:2px">⭐'+item.rating+' · 售'+(item.sales||0).toLocaleString()+'</div>';
  html += '</div>';
  html += '<button class="detail-buy-btn" onclick="addToCart(\''+item.id+'\')">🛒 加入购物车</button>';
  html += '</div>';
  
  content.innerHTML = html;
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeShopDetail() {
  let modal = document.getElementById('shopDetailModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

// ===== 购物车 =====
function addToCart(productId) {
  if (typeof window.SHOP_DATA === 'undefined') return;
  let item = window.SHOP_DATA.products.find(function(p) { return p.id === productId; });
  if (!item) return;
  
  let existing = shopCart.find(function(c){ return c.id === productId; });
  if (existing) {
    existing.qty++;
  } else {
    shopCart.push({ id: item.id, name: item.name, price: item.price, image: item.image, qty: 1 });
  }
  updateCartUI();
  
  // 视觉反馈
  let badge = document.getElementById('cartBadge');
  if (badge) {
    badge.style.transform = 'scale(1.5)';
    setTimeout(function(){ badge.style.transform = 'scale(1)'; }, 200);
  }
}

function removeFromCart(productId) {
  shopCart = shopCart.filter(function(c){ return c.id !== productId; });
  updateCartUI();
}

function changeCartQty(productId, delta) {
  let item = shopCart.find(function(c){ return c.id === productId; });
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(productId);
  } else {
    updateCartUI();
  }
}

function updateCartUI() {
  let badge = document.getElementById('cartBadge');
  let totalQty = shopCart.reduce(function(s,c){ return s+c.qty; }, 0);
  if (badge) {
    if (totalQty > 0) {
      badge.style.display = 'flex';
      badge.textContent = totalQty;
    } else {
      badge.style.display = 'none';
    }
  }
  
  // 如果购物车弹窗打开，更新内容
  let modal = document.getElementById('shopCartModal');
  if (modal && modal.style.display === 'block') {
    renderCartContent();
  }
}

function renderCartContent() {
  let content = document.getElementById('shopCartContent');
  if (!content) return;
  
  if (shopCart.length === 0) {
    content.innerHTML = '<div class="cart-empty"><div class="cart-empty-icon">🛒</div><p style="font-size:14px">购物车空空如也</p><p style="font-size:12px;margin-top:4px">快去挑选心仪的好物吧～</p></div>';
    return;
  }
  
  let html = '';
  let totalAmount = 0;
  shopCart.forEach(function(item) {
    let priceNum = parsePrice(item.price);
    totalAmount += priceNum * item.qty;
    html += '<div class="cart-item">';
    html += '<div class="cart-item-img">'+(item.image||'📦')+'</div>';
    html += '<div class="cart-item-info">';
    html += '<div class="cart-item-name">'+item.name+'</div>';
    html += '<div class="cart-item-price">'+item.price+' × '+item.qty+'</div>';
    html += '</div>';
    html += '<div style="display:flex;align-items:center;gap:6px">';
    html += '<button onclick="changeCartQty(\''+item.id+'\',-1)" style="width:24px;height:24px;border:1px solid rgba(201,168,76,0.2);background:rgba(255,255,255,0.03);color:var(--paper);border-radius:4px;cursor:pointer;font-size:14px">−</button>';
    html += '<span style="font-size:13px;color:var(--paper);min-width:20px;text-align:center">'+item.qty+'</span>';
    html += '<button onclick="changeCartQty(\''+item.id+'\',1)" style="width:24px;height:24px;border:1px solid rgba(201,168,76,0.2);background:rgba(255,255,255,0.03);color:var(--paper);border-radius:4px;cursor:pointer;font-size:14px">+</button>';
    html += '</div>';
    html += '<button class="cart-item-remove" onclick="removeFromCart(\''+item.id+'\')">删除</button>';
    html += '</div>';
  });
  
  html += '<div class="cart-total">';
  html += '<div><span style="font-size:13px;color:var(--paper2)">合计：</span><span class="cart-total-amount">¥'+totalAmount.toLocaleString()+'</span></div>';
  html += '<button class="cart-checkout-btn" onclick="checkout()">结算</button>';
  html += '</div>';
  
  content.innerHTML = html;
}

function toggleCartModal() {
  let modal = document.getElementById('shopCartModal');
  if (!modal) return;
  if (modal.style.display === 'block') {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  } else {
    renderCartContent();
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
}

function checkout() {
  if (shopCart.length === 0) return;
  let totalQty = shopCart.reduce(function(s,c){ return s+c.qty; }, 0);
  let totalAmount = shopCart.reduce(function(s,c){ return s + parsePrice(c.price)*c.qty; }, 0);
  showToast('✅ 订单提交成功！\n\n商品数量：'+totalQty+' 件\n合计金额：¥'+totalAmount.toLocaleString()+'\n\n（模拟结算，无需真实支付）\n感谢您的惠顾，祝您修身增慧、福慧双修！');
  shopCart = [];
  updateCartUI();
  toggleCartModal();
}

// ===== 初始化商城 =====
function initShop() {
  if (typeof window.SHOP_DATA !== 'undefined') {
    renderShopProducts();
  }
}
// 延迟初始化（等待 shop-data.js 加载）
setTimeout(initShop, 500);

// ===== 每日一句命理名言 =====
(function(){
  let quotes = [
    {text:"上善若水，水善利万物而不争，处众人之所恶，故几于道。", author:"《道德经》第八章"},
    {text:"致虚极，守静笃。万物并作，吾以观复。归根曰静，是谓复命。", author:"《道德经》第十六章"},
    {text:"知人者智，自知者明。胜人者有力，自胜者强。知足者富。", author:"《道德经》第三十三章"},
    {text:"祸兮福之所倚，福兮祸之所伏。孰知其极？其无正。", author:"《道德经》第五十八章"},
    {text:"为学日益，为道日损，损之又损，以至于无为。", author:"《道德经》第四十八章"},
    {text:"飘风不终朝，骤雨不终日。天地尚不能久，而况于人乎？", author:"《道德经》第二十三章"},
    {text:"信言不美，美言不信。善者不辩，辩者不善。知者不博。", author:"《道德经》第八十一章"},
    {text:"一切有为法，如梦幻泡影，如露亦如电，应作如是观。", author:"《金刚经》"},
    {text:"凡所有相，皆是虚妄。若见诸相非相，即见如来。", author:"《金刚经》"},
    {text:"过去心不可得，现在心不可得，未来心不可得。", author:"《金刚经》"},
    {text:"色即是空，空即是色；色不异空，空不异色。", author:"《心经》"},
    {text:"心无挂碍，无挂碍故，无有恐怖，远离颠倒梦想。", author:"《心经》"},
    {text:"菩提本无树，明镜亦非台。本来无一物，何处惹尘埃。", author:"六祖慧能"},
    {text:"迷时师度，悟时自度。佛法在世间，不离世间觉。", author:"六祖慧能"},
    {text:"一花一世界，一叶一菩提。平常心是道。", author:"《五灯会元》"},
    {text:"人生难得今已得，大道难闻今已闻。此身不向今生度，更向何生度此身？", author:"《禅宗七祖经》"},
    {text:"天行健，君子以自强不息；地势坤，君子以厚德载物。", author:"《周易·乾卦》"},
    {text:"知止而后有定，定而后能静，静而后能安，安而后能虑，虑而后能得。", author:"《大学》"},
    {text:"君子和而不同，小人同而不和。君子坦荡荡，小人长戚戚。", author:"《论语·卫灵公》"},
    {text:"君子求诸己，小人求诸人。", author:"《论语·卫灵公》"},
    {text:"心静了，世界就静了。不是世界变了，是你的心变了。", author:"生活哲理"},
    {text:"放下执念，不是放弃一切，而是对结果不再强求，对过程全力以赴。", author:"生活哲理"},
    {text:"最好的状态是：眼里有故事，脸上无风霜。历经沧桑，内心依然柔软。", author:"生活哲理"},
    {text:"人生没有白走的路，每一步都算数。累了就休息，但别放弃。", author:"生活哲理"},
    {text:"你担心的事，90%不会发生。与其焦虑未来，不如做好当下。", author:"生活哲理"},
    {text:"真正的强大，不是忘记，而是接纳。接纳过去的遗憾，接纳现在的不完美。", author:"生活哲理"},
    {text:"情绪稳定是一个人最难得的修养。遇事不怒，宠辱不惊，静观其变。", author:"生活哲理"},
    {text:"睡前原谅一切，醒来便是重生。不为昨日忧，不为明日虑，活在当下。", author:"生活哲理"},
    {text:"人生最曼妙的风景，是内心的淡定与从容。世事浮沉，学会随缘自在。", author:"生活哲理"},
    {text:"当你改变不了环境，就改变自己的心态。心宽了，天地就宽了。", author:"生活哲理"},
    {text:"一命二运三风水，四积阴德五读书。", author:"《命理通考》"},
    {text:"穷则变，变则通，通则久。", author:"《周易·系辞下》"},
    {text:"积善行德，福报自来。", author:"《太上感应篇》"},
    {text:"君子谋时而动，顺势而为。", author:"《鬼谷子》"}
  ];
  // 优先使用每日口诀数据库（365条）
  if (typeof KOUJUE_DAILY_DATABASE !== 'undefined' && KOUJUE_DAILY_DATABASE.length > 0) {
    let now = new Date();
    let m = now.getMonth() + 1;
    let d = now.getDate();
    let dateKey = m + '-' + d;
    let entry = KOUJUE_DAILY_DATABASE.find(function(e){ return e.date === dateKey; });
    if (entry) {
      let el2 = document.getElementById('daily-quote-text');
      let au2 = document.getElementById('daily-quote-author');
      if(el2) el2.textContent = entry.text;
      if(au2) au2.textContent = '—— ' + entry.source + ' · ' + (entry.category || '');
      return;
    }
  }
  let day = new Date().getDate();
  let q = quotes[day % quotes.length];
  let el = document.getElementById('daily-quote-text');
  let au = document.getElementById('daily-quote-author');
  if(el) el.textContent = q.text;
  if(au) au.textContent = '—— ' + q.author;
})();

// ===== 自动设置当前年份 =====
  let _cy = new Date().getFullYear();
  ['qimen-year','liuren-year','fs-pro-fx-year'].forEach(function(id){
    let el = document.getElementById(id);
    if(el && el.value == '2026') el.value = _cy;
  });

// ===== 返回顶部按钮滚动监听 =====
window.addEventListener('scroll',function(){
  let el=document.getElementById('backTop');
  if(el){ if(window.scrollY>400) el.classList.add('show'); else el.classList.remove('show'); }
});

// ===== 全局复制结果功能 =====
function copyResultText(btn){
  let text=btn.closest('.result-section')?.innerText||btn.closest('#baziResult')?.innerText||btn.closest('#yjResult')?.innerText||btn.closest('#mobileFengshuiResult')?.innerText||'';
  if(!text){
    text=document.querySelector('[id$=Result]')?.innerText||'';
  }
  if(!text)return;
  navigator.clipboard.writeText(text).then(function(){
    let orig=btn.textContent;
    btn.textContent='已复制!';
    btn.style.color='var(--jade)';
    setTimeout(function(){btn.textContent=orig;btn.style.color=''},1500);
  });
}