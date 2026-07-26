
// Toast notification
function showToast(msg) {
  var t = document.getElementById('toastMsg');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toastMsg';
    t.className = 'toast-msg';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(function() { t.classList.remove('show'); }, 2500);
}

// ====== Tab 切换（已迁移到 <ml-tab> Web Component） ======
// ml-tab polyfill 自动处理旧 .tab-btn[data-tab] 点击兼容
// 保留 switchTab 供编程调用
function switchTab(name) {
  const tab = document.getElementById('memTab');
  if (!tab) return;
  const labels = ['membership', 'payment', 'orders', 'push', 'booking'];
  const idx = labels.indexOf(name);
  if (idx < 0) return;
  tab.setActive(idx);
}

// 会员卡点击购买 → 跳转支付
let selectedTier = null;
let selectedPrice = 0;
document.querySelectorAll('.upgrade-btn[data-tier]').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedTier = btn.dataset.tier;
    selectedPrice = parseFloat(btn.dataset.price);
    updatePayment();
    document.querySelector('[data-tab="payment"]').click();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

function updatePayment() {
  if (!selectedTier) return;
  document.getElementById('pay-tier-display').textContent = selectedTier;
  document.getElementById('pay-amount-display').textContent = '¥' + selectedPrice.toFixed(1);
  document.getElementById('order-tier').textContent = selectedTier;
  document.getElementById('order-original').textContent = '¥' + selectedPrice.toFixed(1);
  document.getElementById('order-final').textContent = '¥' + selectedPrice.toFixed(1);
  document.getElementById('confirm-pay-btn').disabled = false;
}

// 支付方式选择
document.querySelectorAll('.pay-method-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.pay-method-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  });
});

// 优惠券
let discount = 0;
function applyPromo() {
  const val = document.getElementById('promo-input').value.trim();
  if (!selectedTier) {
    showToast('请先选择会员等级');
    return;
  }
  if (val === 'YUAN10') {
    discount = selectedPrice * 0.1;
    document.getElementById('discount-row').style.display = 'flex';
    document.getElementById('order-discount').textContent = '-¥' + discount.toFixed(1);
    document.getElementById('order-final').textContent = '¥' + (selectedPrice - discount).toFixed(1);
    document.getElementById('promo-success').style.display = 'block';
    document.getElementById('promo-success').textContent = '✓ 优惠码已生效，立减¥' + discount.toFixed(1);
  } else {
    discount = 0;
    document.getElementById('discount-row').style.display = 'none';
    document.getElementById('order-final').textContent = '¥' + selectedPrice.toFixed(1);
    document.getElementById('promo-success').style.display = 'block';
    document.getElementById('promo-success').style.color = 'var(--red)';
    document.getElementById('promo-success').textContent = '✗ 优惠码无效';
  }
}

// 确认支付
function confirmPay() {
  const method = document.querySelector('.pay-method-btn.selected').dataset.method;
  document.getElementById('success-tier').textContent = '当前等级：' + selectedTier;
  document.getElementById('success-modal').classList.add('active');
}

// 弹窗关闭
function closeModal() {
  document.getElementById('wechat-modal').classList.remove('active');
}
function closeSuccessModal() {
  document.getElementById('success-modal').classList.remove('active');
}

// 深度解读后弹出公众号弹窗（示例触发）
function showWechatModal() {
  document.getElementById('wechat-modal').classList.add('active');
}

// 开关
function toggleSwitch(el) {
  el.classList.toggle('on');
}

// 日历
let calYear = 2026, calMonth = 5; // 0-indexed
function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  // 保留表头
  const dows = '<div class="cal-dow">一</div><div class="cal-dow">二</div><div class="cal-dow">三</div><div class="cal-dow">四</div><div class="cal-dow">五</div><div class="cal-dow">六</div><div class="cal-dow">日</div>';
  const firstDay = new Date(calYear, calMonth, 1).getDay() || 7;
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();
  let html = dows;
  // 空白格
  for (let i = 1; i < firstDay; i++) html += '<div class="cal-day disabled"></div>';
  // 天数
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
    const isPast = new Date(calYear, calMonth, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isBooked = [15, 18].includes(d) && calMonth === 5;
    let cls = 'cal-day';
    if (isPast) cls += ' disabled';
    if (isToday) cls += ' today';
    if (isBooked) cls += ' booked';
    html += `<ml-tap class="${cls}" onclick="selectDate(${d},this)" variant="card" role="button" tabindex="0">${d}</ml-tap>`;
  }
  grid.innerHTML = html;
  document.getElementById('cal-title').textContent = calYear + '年' + (calMonth + 1) + '月';
}

let selectedDate = null;
let selectedDayEl = null;
function selectDate(d, el) {
  if (el.classList.contains('disabled')) return;
  if (selectedDayEl) selectedDayEl.classList.remove('selected');
  el.classList.add('selected');
  selectedDayEl = el;
  selectedDate = d;
  document.getElementById('bs-date').textContent = calYear + '年' + (calMonth + 1) + '月' + d + '日';
  document.getElementById('time-slots').style.display = 'grid';
  document.getElementById('book-pay-btn').disabled = !(selectedDate && selectedTime);
}

function calNav(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}

// 时间选择
let selectedTime = null;
let selectedTimeEl = null;
function selectTime(el, time) {
  if (el.classList.contains('unavailable') || el.classList.contains('booked')) return;
  if (selectedTimeEl) selectedTimeEl.classList.remove('selected');
  el.classList.add('selected');
  selectedTimeEl = el;
  selectedTime = time;
  document.getElementById('bs-time').textContent = time;
  document.getElementById('book-pay-btn').disabled = !(selectedDate && selectedTime);
}

// 大师选择
function selectMaster(name, price) {
  document.getElementById('bs-master').textContent = name;
  document.getElementById('bs-total').textContent = '¥' + price;
  document.querySelector('[data-tab="booking"]').click();
  document.getElementById('book-pay-btn').disabled = true;
}

function confirmBooking() {
  showToast('预约功能需对接真实接口，此为UI演示');
}

// 初始化
renderCalendar();



function r40MiniSearch(){
  var q=document.getElementById('r40MiniQuery').value.trim();
  if(!q){alert('请输入查询关键词');return;}
  if(!window.R39_DUAL_CORE_KB){document.getElementById('r40MiniResult').innerHTML='<span style="opacity:.95">KB 加载中...</span>';return;}
  var results=r39SearchKB(q);
  var html='<div style="margin-bottom:6px;opacity:.6">命中 <b style="color:var(--gold)">'+results.length+'</b> 条 / 总 '+R39_DUAL_CORE_KB.length+' 条</div>';
  results.slice(0,4).forEach(function(e){
    html+='<div style="margin:6px 0;padding:8px;background:rgba(0,0,0,.25);border-radius:6px;border-left:3px solid var(--gold)"><b style="color:var(--gold);font-size:12px">'+e.title+'</b><div style="opacity:.7;margin-top:4px;line-height:1.7">'+e.content.substring(0,120)+'...</div></div>';
  });
  document.getElementById('r40MiniResult').innerHTML=html;
}
