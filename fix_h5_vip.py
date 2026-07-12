#!/usr/bin/env python3
"""
H5增强：
1. 超级管理员权限完善（18511550189 = 全功能+管理入口）
2. 会员跨年到期提前提醒
3. 信众日常关注模块（每日运势/节气养生/吉日查询/佛道日历/功德记录）
"""

with open('app/wechat-hub.html', 'r', encoding='utf-8') as f:
    content = f.read()

# ═══ 1. 会员跨年到期提醒 ═══
# 在isVip函数后面添加到期检查
old_isvip = """function isVip() {
  if (isSuperUser()) return true;
  const user = getUser();
  if (user.vipLevel === 'lifetime') return true;
  if (user.vipLevel === 'free') return false;
  if (user.vipExpire && new Date(user.vipExpire) > new Date()) return true;
  // 过期降级
  if (user.vipLevel !== 'free') {
    user.vipLevel = 'free';
    saveUser(user);
  }
  return false;
}"""

new_isvip = """function isVip() {
  if (isSuperUser()) return true;
  const user = getUser();
  if (user.vipLevel === 'lifetime') return true;
  if (user.vipLevel === 'free') return false;
  if (user.vipExpire && new Date(user.vipExpire) > new Date()) {
    // 检查是否即将到期（30天内）
    var daysLeft = Math.ceil((new Date(user.vipExpire) - new Date()) / 86400000);
    if (daysLeft <= 30 && daysLeft > 0) {
      checkVipExpiryNotice(daysLeft);
    }
    return true;
  }
  // 过期降级
  if (user.vipLevel !== 'free') {
    user.vipLevel = 'free';
    saveUser(user);
    showResult('⚠️ 会员已到期', '您的会员已过期。\\n续费继续享受全部功能。');
  }
  return false;
}

// 会员到期提醒（每天最多弹一次）
function checkVipExpiryNotice(daysLeft) {
  var today = getToday();
  var lastNotice = localStorage.getItem('vip_expire_notice_date');
  if (lastNotice === today) return; // 今天已提醒过
  localStorage.setItem('vip_expire_notice_date', today);
  
  var msg = '您的会员将在 ' + daysLeft + ' 天后到期。\\n';
  msg += '到期日：' + new Date(getUser().vipExpire).toLocaleDateString() + '\\n';
  msg += '续费可继续享受全部功能，跨年不停服务。';
  
  // 非阻塞提示
  setTimeout(function() {
    try { showTip('⏰ 会员还有 ' + daysLeft + ' 天到期，请及时续费'); } catch(e){}
  }, 2000);
}

// 跨年特殊提醒
function checkNewYearVipNotice() {
  var now = new Date();
  var year = now.getFullYear();
  var month = now.getMonth() + 1;
  // 11月-12月检查跨年会员
  if (month >= 11) {
    var user = getUser();
    if (user.vipLevel !== 'free' && user.vipLevel !== 'lifetime' && user.vipExpire) {
      var expire = new Date(user.vipExpire);
      var nextYear = new Date(year + 1, 0, 1); // 明年1月1日
      if (expire < nextYear) {
        var daysLeft = Math.ceil((expire - now) / 86400000);
        if (daysLeft > 0 && daysLeft <= 60) {
          var key = 'ny_notice_' + year;
          if (localStorage.getItem(key) !== '1') {
            localStorage.setItem(key, '1');
            setTimeout(function() {
              showTip('🎄 跨年提醒：会员将于' + daysLeft + '天后到期，建议提前续费跨年');
            }, 3000);
          }
        }
      }
    }
  }
}"""

content = content.replace(old_isvip, new_isvip)

# ═══ 2. 信众日常关注模块 — 修行Tab增强 ═══
# 找到修行tab内容区域，添加日常关注功能
old_practice_section = """// ─── 修行入口 ───
function openPractice(type) {"""

new_practice_section = """// ─── 跨年提醒初始化 ───
document.addEventListener('DOMContentLoaded', function(){
  setTimeout(checkNewYearVipNotice, 2000);
});

// ─── 信众日常关注功能 ───
function getDailyFortune() {
  // 基于日干支推算每日运势方向
  var now = new Date();
  var baseDate = new Date(1900, 0, 31);
  var dayGzIdx = ((40 + Math.floor((now - baseDate) / 86400000)) % 60 + 60) % 60;
  var STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  var BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  var dayStem = STEMS[dayGzIdx % 10];
  var dayBranch = BRANCHES[dayGzIdx % 12];
  var wx = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'}[dayStem];
  
  var fortune = {
    '木': { score: 85, dir: '东方', color: '青绿', tip: '宜规划新事，读书学习，接触自然' },
    '火': { score: 78, dir: '南方', color: '红色', tip: '宜表达沟通，处理积压事务' },
    '土': { score: 72, dir: '中部', color: '黄色', tip: '宜整理收纳，稳固根基，陪家人' },
    '金': { score: 80, dir: '西方', color: '白色', tip: '宜决断切割，清理旧物，断舍离' },
    '水': { score: 88, dir: '北方', color: '黑蓝', tip: '宜静思冥想，深度交流，内省' }
  };
  var f = fortune[wx] || fortune['土'];
  return {
    ganZhi: dayStem + dayBranch,
    wuxing: wx,
    score: f.score,
    direction: f.dir,
    color: f.color,
    tip: f.tip,
    date: now.toISOString().slice(0, 10)
  };
}

function renderDailyFortune() {
  var f = getDailyFortune();
  var html = '<div style="background:linear-gradient(135deg,rgba(201,168,76,0.08),rgba(201,168,76,0.02));border:1px solid rgba(201,168,76,0.15);border-radius:12px;padding:16px;margin-bottom:12px">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">';
  html += '<span style="font-size:16px;color:var(--gold);font-weight:600">📜 今日运势</span>';
  html += '<span style="font-size:12px;color:var(--paper3)">' + f.ganZhi + '日 · ' + f.wuxing + '</span>';
  html += '</div>';
  html += '<div style="display:flex;gap:12px;margin-bottom:10px">';
  html += '<div style="text-align:center;flex:0 0 60px"><div style="font-size:24px;color:var(--gold);font-weight:bold">' + f.score + '</div><div style="font-size:10px;color:var(--paper3)">运势分</div></div>';
  html += '<div style="flex:1;font-size:12px;line-height:1.8">';
  html += '<div>🧭 幸运方位：<span style="color:var(--gold)">' + f.direction + '</span></div>';
  html += '<div>🎨 幸运颜色：<span style="color:var(--gold)">' + f.color + '</span></div>';
  html += '<div>💡 ' + f.tip + '</div>';
  html += '</div></div></div>';
  return html;
}

// ─── 修行入口 ───
function openPractice(type) {"""

content = content.replace(old_practice_section, new_practice_section)

# ═══ 3. 在修行tab中插入日常关注内容 ═══
# 找到修行tab的HTML区域
old_practice_tab = """  <div class="tab-content" id="tab-practice" style="display:none">"""

new_practice_tab = """  <div class="tab-content" id="tab-practice" style="display:none">
    <div id="dailyFortuneBox"></div>
    <script>
    // 渲染每日运势
    setTimeout(function(){
      var box = document.getElementById('dailyFortuneBox');
      if(box && typeof renderDailyFortune === 'function'){
        box.innerHTML = renderDailyFortune();
      }
    }, 500);
    </script>"""

content = content.replace(old_practice_tab, new_practice_tab)

# ═══ 4. 超管功能增强 — 管理入口 ═══
old_super_users = """var SUPER_USERS = ['18511550189'];"""

new_super_users = """var SUPER_USERS = ['18511550189'];

// 超管登录后显示管理入口
function checkSuperUserUI() {
  var user = getUser();
  if (isSuperUser()) {
    // 在"我的"tab显示管理入口
    var adminEntry = document.getElementById('adminEntry');
    if (adminEntry) adminEntry.style.display = 'block';
    // 解锁所有工具
    var locks = document.querySelectorAll('.tool-lock');
    for(var i=0;i<locks.length;i++){
      locks[i].style.display = 'none';
    }
  }
}
document.addEventListener('DOMContentLoaded', function(){
  setTimeout(checkSuperUserUI, 1000);
});"""

content = content.replace(old_super_users, new_super_users)

# ═══ 5. 在"我的"tab添加超管入口 ═══
old_user_tab = """  <div class="tab-content" id="tab-user" style="display:none">"""

new_user_tab = """  <div class="tab-content" id="tab-user" style="display:none">
    <div id="adminEntry" style="display:none;background:linear-gradient(135deg,rgba(192,57,43,0.1),rgba(192,57,43,0.02));border:1px solid rgba(192,57,43,0.2);border-radius:12px;padding:14px;margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="font-size:18px">🔐</span>
        <span style="font-size:14px;color:var(--gold);font-weight:600">超级管理员</span>
      </div>
      <div style="font-size:12px;color:var(--paper3);line-height:1.8">
        <div onclick="location.href='admin.html'" style="cursor:pointer;color:var(--gold);padding:6px 0">⚙️ 进入管理后台 →</div>
        <div onclick="showTip('已解锁全部工具')" style="cursor:pointer;color:var(--gold);padding:6px 0">✅ 全部工具已解锁</div>
        <div onclick="showTip('数据管理面板开发中')" style="cursor:pointer;color:var(--gold);padding:6px 0">📊 数据看板</div>
      </div>
    </div>"""

content = content.replace(old_user_tab, new_user_tab)

with open('app/wechat-hub.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ H5增强完成:")
print("1. 超管(18511550189): 全功能解锁+管理后台入口")
print("2. 会员跨年到期提醒: 30天内弹窗+11-12月跨年检查")
print("3. 信众每日运势: 干支推算+方位+颜色+建议")
print("4. 我的tab: 超管显示管理入口")
