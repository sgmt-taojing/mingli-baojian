#!/usr/bin/env python3
"""
H5全面修复：
1. 工具顺序重排（吸引客户的功能前置）
2. checkUsage放宽（免费工具每天3次，非会员可用所有免费工具）
3. 假数据标注
4. loading overlay三重保险
5. 新增阳宅户型知识卡片
"""
import re

with open('app/wechat-hub.html', 'r', encoding='utf-8') as f:
    content = f.read()

# ═══ 1. 工具卡片重排 ═══
# 原顺序: 八字→六爻→梅花→测字→手机号→姓名→吉日→黄历→奇门→紫微→六壬→风水
# 新顺序: 八字→手机号→姓名→阳宅户型→六爻→梅花→吉日→黄历→测字→奇门→紫微→六壬→风水
old_tools = """    <div class="tool-card" onclick="openTool('bazi')"><span class="tool-free">免费</span><span class="tool-icon">🀄</span><div class="tool-name">八字排盘</div><div class="tool-sub">四柱·十神·大运</div></div>
    <div class="tool-card" onclick="openTool('zhanbu-yijing')"><span class="tool-free">免费</span><span class="tool-icon">🔮</span><div class="tool-name">六爻占卜</div><div class="tool-sub">金钱课起卦断卦</div></div>
    <div class="tool-card" onclick="openTool('zhanbu-meihua')"><span class="tool-free">免费</span><span class="tool-icon">🌸</span><div class="tool-name">梅花易数</div><div class="tool-sub">数字起卦·体用</div></div>
    <div class="tool-card" onclick="openTool('cezi')"><span class="tool-free">免费</span><span class="tool-icon">✍️</span><div class="tool-name">测字</div><div class="tool-sub">输入字·六法分析</div></div>
    <div class="tool-card" onclick="openTool('yanzhi')"><span class="tool-icon">📱</span><div class="tool-name">手机号测算</div><div class="tool-sub">多号对比·评分</div></div>
    <div class="tool-card" onclick="openTool('xingming')"><span class="tool-icon">📛</span><div class="tool-name">姓名分析</div><div class="tool-sub">改名建议·公司取名</div></div>
    <div class="tool-card" onclick="openTool('jiuri')"><span class="tool-free">免费</span><span class="tool-icon">💮</span><div class="tool-name">吉日查询</div><div class="tool-sub">日历·择日</div></div>
    <div class="tool-card" onclick="openTool('huangli')"><span class="tool-free">免费</span><span class="tool-icon">📅</span><div class="tool-name">黄历</div><div class="tool-sub">今日宜忌·修行指引</div></div>
    <div class="tool-card" onclick="openTool('zhanbu-qimen')"><span class="tool-icon">🌀</span><div class="tool-name">奇门遁甲</div><div class="tool-sub">八门九星·值符</div></div>
    <div class="tool-card" onclick="openTool('zhanbu-ziwei')"><span class="tool-icon">⭐</span><div class="tool-name">紫微斗数</div><div class="tool-sub">十二宫·星曜</div></div>
    <div class="tool-card" onclick="openTool('zhanbu-liuren')"><span class="tool-icon">🎯</span><div class="tool-name">六壬神课</div><div class="tool-sub">四课三传·天将</div></div>
    <div class="tool-card" onclick="openTool('fengshui')"><span class="tool-icon">🧭</span><div class="tool-name">风水罗盘</div><div class="tool-sub">方位·堪舆</div></div>"""

new_tools = """    <div class="tool-card" onclick="openTool('bazi')"><span class="tool-free">免费</span><span class="tool-icon">🀄</span><div class="tool-name">八字排盘</div><div class="tool-sub">四柱·十神·大运</div></div>
    <div class="tool-card" onclick="openTool('yanzhi')"><span class="tool-free">每日3次</span><span class="tool-icon">📱</span><div class="tool-name">手机号测算</div><div class="tool-sub">吉凶评分·选号</div></div>
    <div class="tool-card" onclick="openTool('xingming')"><span class="tool-free">每日3次</span><span class="tool-icon">📛</span><div class="tool-name">姓名/公司取名</div><div class="tool-sub">改名·公司取名</div></div>
    <div class="tool-card" onclick="openTool('fengshui')"><span class="tool-free">每日3次</span><span class="tool-icon">🏠</span><div class="tool-name">阳宅户型</div><div class="tool-sub">户型分析·方位堪舆</div></div>
    <div class="tool-card" onclick="openTool('zhanbu-yijing')"><span class="tool-free">免费</span><span class="tool-icon">🔮</span><div class="tool-name">六爻占卜</div><div class="tool-sub">金钱课起卦断卦</div></div>
    <div class="tool-card" onclick="openTool('zhanbu-meihua')"><span class="tool-free">免费</span><span class="tool-icon">🌸</span><div class="tool-name">梅花易数</div><div class="tool-sub">数字起卦·体用</div></div>
    <div class="tool-card" onclick="openTool('jiuri')"><span class="tool-free">免费</span><span class="tool-icon">💮</span><div class="tool-name">吉日查询</div><div class="tool-sub">日历·择日</div></div>
    <div class="tool-card" onclick="openTool('huangli')"><span class="tool-free">免费</span><span class="tool-icon">📅</span><div class="tool-name">黄历</div><div class="tool-sub">今日宜忌·修行指引</div></div>
    <div class="tool-card" onclick="openTool('cezi')"><span class="tool-free">免费</span><span class="tool-icon">✍️</span><div class="tool-name">测字</div><div class="tool-sub">输入字·六法分析</div></div>
    <div class="tool-card" onclick="openTool('zhanbu-qimen')"><span class="tool-icon">🌀</span><div class="tool-name">奇门遁甲</div><div class="tool-sub">八门九星·值符</div></div>
    <div class="tool-card" onclick="openTool('zhanbu-ziwei')"><span class="tool-icon">⭐</span><div class="tool-name">紫微斗数</div><div class="tool-sub">十二宫·星曜</div></div>
    <div class="tool-card" onclick="openTool('zhanbu-liuren')"><span class="tool-icon">🎯</span><div class="tool-name">六壬神课</div><div class="tool-sub">四课三传·天将</div></div>
    <div class="tool-card" onclick="openTool('fengshui')" style="display:none"><span class="tool-icon">🧭</span><div class="tool-name">风水罗盘</div><div class="tool-sub">方位·堪舆</div></div>"""

content = content.replace(old_tools, new_tools)

# ═══ 2. TOOL_CONFIG 添加阳宅户型 ═══
old_config = """  'fengshui':       { name:'风水罗盘', section:'fengshui', type:'paid' }"""
new_config = """  'fengshui':       { name:'阳宅户型', section:'fengshui', type:'free' }"""
content = content.replace(old_config, new_config)

# ═══ 3. checkUsage 放宽 — 非会员每日3次免费 ═══
old_check = """// ─── 使用次数检查 ───
function checkUsage(toolKey) {
  const user = getUser();
  if (isVip()) return { allowed: true };
  
  if (!user.usageLog) user.usageLog = {};
  
  const used = user.usageLog[toolKey] || 0;
  const config = TOOL_CONFIG[toolKey];
  
  // 付费工具，非会员不能使用
  if (config && config.type === 'paid') {
    return { allowed: false, reason: 'paid', msg: config.name + '为会员专属功能' };
  }
  
  // 免费工具，非会员总共只能用1次（按手机号）
  if (used >= 1) {
    return { allowed: false, reason: 'limit', msg: '免费体验已用完，开通会员享不限次数' };
  }
  
  return { allowed: true };
}"""

new_check = """// ─── 使用次数检查 ───
function checkUsage(toolKey) {
  const user = getUser();
  if (isVip()) return { allowed: true };
  
  if (!user.usageLog) user.usageLog = {};
  
  const config = TOOL_CONFIG[toolKey];
  
  // 按天计数：每日重置
  var today = new Date().toDateString();
  if (!user.usageDate || user.usageDate !== today) {
    user.usageDate = today;
    user.usageLog = {};
    saveUser(user);
  }
  
  var used = user.usageLog[toolKey] || 0;
  
  // 免费工具：非会员每日3次
  if (config && config.type === 'free') {
    if (used >= 3) {
      return { allowed: false, reason: 'limit', msg: config.name + '今日免费次数已用完，明日重置。开通会员不限次使用' };
    }
    return { allowed: true };
  }
  
  // 付费工具：非会员每日1次体验
  if (config && config.type === 'paid') {
    if (used >= 1) {
      return { allowed: false, reason: 'limit', msg: config.name + '今日体验次数已用完。开通会员不限次使用' };
    }
    return { allowed: true };
  }
  
  return { allowed: true };
}"""

content = content.replace(old_check, new_check)

# ═══ 4. 假数据标注 ═══
content = content.replace(
    "// 模拟购买（实际需对接支付）",
    "// 购买流程（需对接支付接口，当前为前端演示）"
)
content = content.replace(
    "// AI价值评估（前端模拟）",
    "// AI价值评估（规则引擎，非AI模型）"
)

# ═══ 5. loading overlay 三重保险（防止iframe内页面卡住）═══
# 在openTool的iframe加载前注入overlay清理脚本
old_iframe_load = """  // 在 iframe 中打开
  var panel = document.getElementById('toolPanel');
  var frame = document.getElementById('toolFrame');
  var title = document.getElementById('toolPanelTitle');
  title.textContent = config.name;
  frame.src = url;
  panel.style.display = 'block';
  document.body.style.overflow = 'hidden';"""

new_iframe_load = """  // 在 iframe 中打开
  var panel = document.getElementById('toolPanel');
  var frame = document.getElementById('toolFrame');
  var title = document.getElementById('toolPanelTitle');
  title.textContent = config.name;
  frame.src = url;
  panel.style.display = 'block';
  document.body.style.overflow = 'hidden';
  // iframe加载完成后注入overlay清理脚本
  frame.onload = function() {
    try {
      var doc = frame.contentDocument || frame.contentWindow.document;
      // 注入三重保险：2秒后强制移除loading overlay
      var script = doc.createElement('script');
      script.textContent = '''
        function removeLoadingOverlay(){
          var ov=document.getElementById('loading-overlay');
          if(ov) ov.remove();
          var ov2=document.getElementById('loadingOverlay');
          if(ov2) ov2.classList.remove('visible');
        }
        setTimeout(removeLoadingOverlay,1500);
        setTimeout(removeLoadingOverlay,3000);
        setTimeout(removeLoadingOverlay,5000);
      ''';
      doc.body.appendChild(script);
    } catch(e) { console.warn('iframe注入失败:', e); }
  };"""

content = content.replace(old_iframe_load, new_iframe_load)

with open('app/wechat-hub.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ H5全面修复完成:")
print("1. 工具顺序重排: 八字→手机号→姓名→阳宅户型→六爻→梅花→吉日→黄历→测字→奇门→紫微→六壬")
print("2. 权限放宽: 免费工具每日3次, 付费工具每日1次体验")
print("3. 风水罗盘改为'阳宅户型'免费工具")
print("4. 假数据标注")
print("5. iframe内loading overlay三重保险注入")
