
var currentMerchant=null;
var currentTab='overview';

function merchantLogin(){
  var phone=document.getElementById('loginPhone').value.trim();
  if(!phone){showToast('请输入手机号');return}
  var list=JSON.parse(localStorage.getItem('merchantList')||'[]');
  var m=list.find(function(x){return x.phone===phone});
  if(!m){showToast('未找到商家信息，请先入驻');return}
  if(m.status!=='approved'&&m.status!=='pending'){
    showToast('商家状态异常：'+m.status);return;
  }
  currentMerchant=m;
  document.getElementById('loginBox').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  document.getElementById('dashTitle').textContent='🏪 '+m.name;
  loadOverview();
  loadProducts();
  loadOrders();
}

function loadOverview(){
  var products=getMerchantProducts();
  var orders=getMerchantOrders();
  var monthIncome=orders.reduce(function(s,o){return s+(o.merchantAmount||0)},0);
  document.getElementById('statProducts').textContent=products.length;
  document.getElementById('statOrders').textContent=orders.length;
  document.getElementById('statIncome').textContent='¥'+monthIncome.toFixed(0);
  var info='商家：'+currentMerchant.name+'<br>派别：'+currentMerchant.school+'<br>类型：'+currentMerchant.type+'<br>认证：'+currentMerchant.cert+'<br>分成比例：'+(currentMerchant.split*100)+'%<br>状态：'+(currentMerchant.status==='approved'?'✅ 已通过':'⏳ 待审核');
  document.getElementById('merchantInfo').innerHTML=info;
}

function getMerchantProducts(){
  var all=JSON.parse(localStorage.getItem('merchantProducts')||'[]');
  return all.filter(function(p){return p.merchantId===currentMerchant.id});
}

function getMerchantOrders(){
  var all=JSON.parse(localStorage.getItem('merchantOrders')||'[]');
  return all.filter(function(o){return o.merchantId===currentMerchant.id});
}

function showAddProduct(){
  document.getElementById('addProductForm').classList.toggle('hidden');
}

function addProduct(){
  var p={
    id:'p'+Date.now(),
    merchantId:currentMerchant.id,
    merchantName:currentMerchant.name,
    name:document.getElementById('pName').value.trim(),
    price:document.getElementById('pPrice').value.trim(),
    stock:parseInt(document.getElementById('pStock').value)||0,
    purpose:document.getElementById('pPurpose').value.trim(),
    process:document.getElementById('pProcess').value.trim(),
    school:document.getElementById('pSchool').value,
    cat:document.getElementById('pCat').value,
    certified:currentMerchant.cert,
    master:currentMerchant.master,
    masterwork:currentMerchant.status==='approved',
    split:currentMerchant.split,
    status:'active',
    createDate:new Date().toISOString().slice(0,10)
  };
  if(!p.name){showToast('请填写商品名称');return}
  var all=JSON.parse(localStorage.getItem('merchantProducts')||'[]');
  all.push(p);
  localStorage.setItem('merchantProducts',JSON.stringify(all));
  document.getElementById('addProductForm').classList.add('hidden');
  loadProducts();
  showToast('商品已上架');
}

function loadProducts(){
  var products=getMerchantProducts();
  var html='';
  if(products.length===0){html='<p style="text-align:center;color:var(--paper3);padding:20px">暂无商品，点击上方按钮新增</p>'}
  products.forEach(function(p){
    html+='<div class="prod-item"><div><div class="prod-name">'+p.name+'</div><div style="font-size:10px;color:var(--paper3)">'+p.school+'·'+p.cat+'·库存'+p.stock+'</div></div><div style="text-align:right"><div class="prod-price">'+p.price+'</div><button class="btn btn-sm btn-outline" onclick="delProduct(\''+p.id+'\')">下架</button></div></div>';
  });
  document.getElementById('productList').innerHTML=html;
}

function delProduct(id){
  showConfirm('确认下架？', function(){
    var all=JSON.parse(localStorage.getItem('merchantProducts')||'[]');
    all=all.filter(function(p){return p.id!==id});
    localStorage.setItem('merchantProducts',JSON.stringify(all));
    loadProducts();
  });
}

function loadOrders(){
  var orders=getMerchantOrders();
  var html='';
  if(orders.length===0){html='<p style="text-align:center;color:var(--paper3);padding:20px">暂无订单</p>'}
  orders.forEach(function(o){
    html+='<div class="prod-item"><div><div class="prod-name">'+o.productName+'</div><div style="font-size:10px;color:var(--paper3)">'+o.date+'·'+o.buyer+'</div></div><div style="text-align:right"><div class="prod-price">¥'+o.amount+'</div><div style="font-size:10px;color:var(--jade)">分成¥'+(o.merchantAmount||0).toFixed(0)+'</div></div></div>';
  });
  document.getElementById('orderList').innerHTML=html;
  // 收入明细
  var total=orders.reduce(function(s,o){return s+(o.merchantAmount||0)},0);
  var platform=orders.reduce(function(s,o){return s+(o.platformAmount||0)},0);
  document.getElementById('incomeDetail').innerHTML='<div style="font-size:13px;color:var(--paper);line-height:2.2">总订单数：'+orders.length+'<br>商家收入：¥'+total.toFixed(2)+'<br>平台分成：¥'+platform.toFixed(2)+'<br>分成比例：'+(currentMerchant.split*100)+'% / '+(100-currentMerchant.split*100)+'%<br>可提现：¥'+total.toFixed(2)+'</div><button class="btn" style="margin-top:10px" onclick="showToast(\'提现功能开发中\')">申请提现</button>';
}

function switchTab(tab,el){
  currentTab=tab;
  document.querySelectorAll('.tab').forEach(function(t){t.classList.remove('active')});
  if(el) el.classList.add('active');
  ['overview','products','orders','income'].forEach(function(t){
    document.getElementById('tab-'+t).classList.toggle('hidden',t!==tab);
  });
  // 同步 ml-tab
  var idx = {overview:0,products:1,orders:2,income:3}[tab];
  var mlTab = document.getElementById('merchantTab');
  if(mlTab && typeof idx==='number') mlTab.setActive(idx);
}



// ml-tab ↔ switchTab 桥接
(function(){
  var mlTab = document.getElementById('merchantTab');
  if (!mlTab) return;
  var labels = ['overview','products','orders','income'];
  mlTab.addEventListener('tab-change', function(e){
    var name = labels[e.detail.index] || 'overview';
    var el = document.querySelectorAll('#legacyMerchantTabs .tab')[e.detail.index];
    if (typeof switchTab === 'function') switchTab(name, el);
  });
})();
