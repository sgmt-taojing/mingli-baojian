const pptxgen = require('pptxgenjs');
const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.author = '淘景数科';
pres.title = '智慧港口AI巡检预警解决方案 V5';

// ========== 颜色常量 ==========
const C = {
  teal:     "028090",
  seafoam:  "00A896",
  midnight: "21295C",
  darkBg:   "0D2F4F",
  lightBg:  "F2F2F2",
  textDark: "1E293B",
  textLight:"FFFFFF",
  accent:   "F4A261",
  red:      "E63946",
  green:    "2A9D8F",
  orange:   "E76F51",
  blue:     "457B9D",
  bgCard:   "EBF5FB",
  border:   "028090",
};

// ========== 工具函数 ==========
function sshadow() { return { type:"outer", blur:6, offset:2, color:"000000", opacity:0.12 }; }
function addBg(slide, color) { slide.background = { color }; }

// ========== 1. 标题页 ==========
{
  const s = pres.addSlide();
  addBg(s, C.darkBg);
  // 左侧装饰条
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:0.08, h:5.625, fill:{color:C.teal}, line:{color:C.teal} });
  // 主标题
  s.addText("智慧港口AI巡检预警解决方案", { x:0.5, y:1.2, w:9, h:1, fontSize:32, bold:true, color:C.textLight, fontFace:"Microsoft YaHei", align:"left" });
  s.addText("Smart Port AI Inspection & Early Warning Solution", { x:0.5, y:2.3, w:9, h:0.5, fontSize:14, color:"AACCEE", fontFace:"Arial", align:"left", italic:true });
  s.addShape(pres.shapes.LINE, { x:0.5, y:2.9, w:6, h:0, line:{color:C.seafoam, width:2} });
  s.addText("为 吉宝集团（Keppel Corporation）定制", { x:0.5, y:3.1, w:8, h:0.5, fontSize:16, bold:true, color:C.seafoam, fontFace:"Microsoft YaHei", align:"left" });
  s.addText("版本 V5.0  |  2026年5月  |  机密文件", { x:0.5, y:3.7, w:8, h:0.4, fontSize:11, color:"AACCEE", fontFace:"SimSun", align:"left" });
  // 合作伙伴标签
  s.addText("淘景数科  |  大疆创新  |  杭州旗晟  |  智感时代", { x:0.5, y:4.4, w:8, h:0.35, fontSize:10, color:"CBDCE5", fontFace:"SimSun", align:"left" });
}

// ========== 2. 目录 ==========
{
  const s = pres.addSlide();
  addBg(s, C.lightBg);
  s.addText("目录", { x:0.5, y:0.3, w:9, h:0.6, fontSize:28, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.95, w:0.06, h:4.2, fill:{color:C.teal}, line:{color:C.teal} });
  const items = [
    ["第0章","吉宝企业调研与背景分析"],
    ["第1章","行业标杆案例集（14个真实案例）"],
    ["第2章","核心定位与合作伙伴生态"],
    ["第3章","全场景AI视觉算法矩阵（四大载体）"],
    ["第4章","地面巡检机器人能力（杭州旗晟）"],
    ["第5章","空中无人机巡检能力（大疆创新）"],
    ["第6章","无人船补充方案（智感时代）"],
    ["第7章","港口道闸设备（智能通行管理）"],
    ["第8章","多能力协同体系（T-Join平台）"],
    ["第9章","方案价值与实施路径（KPI承诺）"],
    ["第10章","风险分析与对策"],
    ["第11章","售后服务与运维承诺"],
    ["附录A","术语表与缩写对照"],
  ];
  items.forEach(([ch,title], i) => {
    const y = 1.05 + i * 0.33;
    s.addText(ch,  { x:0.8, y, w:1.1, h:0.28, fontSize:10, bold:true, color:C.teal, fontFace:"Microsoft YaHei", valign:"middle" });
    s.addText(title, { x:2.0, y, w:7.3, h:0.28, fontSize:10, color:C.textDark, fontFace:"SimSun", valign:"middle" });
  });
}

// ========== 3. 吉宝企业调研 ==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第0章：吉宝企业调研与背景分析", { x:0.5, y:0.25, w:9, h:0.55, fontSize:20, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.85, w:9, h:0.04, fill:{color:C.teal}, line:{color:C.teal} });
  // 三大业务领域
  const cards = [
    { icon:"🏗️", title:"基础设施（Infrastructure）", body:"港口投资与运营\n能源与数据中心\n资产管理" },
    { icon:"🏢", title:"房地产（Real Estate）", body:"商业地产开发\n城市综合体\n可持续建筑" },
    { icon:"🔗", title:"连接性（Connectivity）", body:"ICT与网络基础设施\n智慧城市方案\n数据与连接服务" },
  ];
  cards.forEach((c, i) => {
    const x = 0.5 + i * 3.15;
    s.addShape(pres.shapes.RECTANGLE, { x, y:1.1, w:2.9, h:2.0, fill:{color:C.bgCard}, shadow:sshadow(), line:{color:C.border, width:1} });
    s.addShape(pres.shapes.RECTANGLE, { x, y:1.1, w:2.9, h:0.45, fill:{color:C.teal}, line:{color:C.teal} });
    s.addText(c.icon + " " + c.title, { x:x+0.1, y:1.15, w:2.7, h:0.4, fontSize:10, bold:true, color:C.textLight, fontFace:"Microsoft YaHei", valign:"middle" });
    s.addText(c.body, { x:x+0.15, y:1.65, w:2.6, h:1.3, fontSize:9, color:C.textDark, fontFace:"SimSun", valign:"top" });
  });
  // 大士港亮点
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:3.3, w:9, h:0.45, fill:{color:C.midnight}, line:{color:C.midnight} });
  s.addText("大士港（Tuas Port）— 全球最大全自动化码头", { x:0.6, y:3.32, w:8.5, h:0.4, fontSize:11, bold:true, color:C.textLight, fontFace:"Microsoft YaHei" });
  const bullets = ["AGV自动导引车 + ASC自动堆垛起重机 + RMQC远程岸桥","AI智能调度：船舶到港预测 + 智能堆场分配","数字孪生：全场景三维仿真与运营优化","5G + IoT全域覆盖；2030年碳中和目标"];
  bullets.forEach((b, i) => {
    s.addText("• " + b, { x:0.7, y:3.85+i*0.32, w:8.5, h:0.3, fontSize:9, color:C.textDark, fontFace:"SimSun" });
  });
}

// ========== 4. 行业标杆案例（1/2）==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第1章：行业标杆案例集（1/2）— 国内案例", { x:0.5, y:0.25, w:9, h:0.55, fontSize:18, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.85, w:9, h:0.04, fill:{color:C.teal}, line:{color:C.teal} });
  const cases = [
    { name:"青岛港", kpi:"62.62箱/小时 世界纪录", color:C.teal },
    { name:"洋山港四期", kpi:"745万TEU/年 全球最大单体", color:C.seafoam },
    { name:"宁波舟山港", kpi:"AI+机器狗 10分钟通关", color:C.green },
    { name:"南京港", kpi:"AI平台 95%+准确率", color:C.blue },
    { name:"视觉大模型", kpi:"500路摄像头 实时监测", color:C.orange },
    { name:"山港天和", kpi:"效率+30% 等待-90%", color:C.red },
  ];
  cases.forEach((c, i) => {
    const col = i % 3, row = Math.floor(i/3);
    const x = 0.5 + col * 3.15, y = 1.1 + row * 1.9;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w:2.9, h:1.7, fill:{color:C.lightBg}, shadow:sshadow(), line:{color:c.color, width:1.5} });
    s.addShape(pres.shapes.RECTANGLE, { x, y, w:0.08, h:1.7, fill:{color:c.color}, line:{color:c.color} });
    s.addText(c.name, { x:x+0.2, y:y+0.15, w:2.6, h:0.4, fontSize:12, bold:true, color:c.color, fontFace:"Microsoft YaHei" });
    s.addText(c.kpi, { x:x+0.2, y:y+0.65, w:2.6, h:0.9, fontSize:9, color:C.textDark, fontFace:"SimSun" });
  });
}

// ========== 5. 行业标杆案例（2/2）==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第1章：行业标杆案例集（2/2）— 国内+国际", { x:0.5, y:0.25, w:9, h:0.55, fontSize:18, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.85, w:9, h:0.04, fill:{color:C.teal}, line:{color:C.teal} });
  const cases = [
    {"name":"烟台港","kpi":"干散货全自动化 效率+8%"},
    {"name":"镇江港","kpi":"AI皮带检测 年省300万+"},
    {"name":"唐山港","kpi":"四足机器人 水炮80L/s"},
    {"name":"舟山甬舟","kpi":"空地协同 机器人+无人机"},
    {"name":"新加坡大士港","kpi":"6500万TEU/年 全球最大"},
    {"name":"鹿特丹港","kpi":"AI调度+区块链 欧洲标杆"},
    {"name":"釜山港","kpi":"智能闸口 AI船舶预测"},
    {"name":"埃及苏赫纳港","kpi":"振华重工 北非首座全自动"},
  ];
  cases.forEach((c, i) => {
    const col = i % 4, row = Math.floor(i/4);
    const x = 0.5 + col * 2.35, y = 1.1 + row * 2.1;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w:2.15, h:1.85, fill:{color:C.bgCard}, shadow:sshadow(), line:{color:C.teal, width:1} });
    s.addText(c.name, { x:x+0.1, y:y+0.15, w:1.9, h:0.4, fontSize:10, bold:true, color:C.teal, fontFace:"Microsoft YaHei" });
    s.addText(c.kpi, { x:x+0.1, y:y+0.6, w:1.9, h:1.1, fontSize:8.5, color:C.textDark, fontFace:"SimSun" });
  });
}

// ========== 6. 方案定位与生态 ==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第2章：核心定位与合作伙伴生态", { x:0.5, y:0.25, w:9, h:0.55, fontSize:20, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.85, w:9, h:0.04, fill:{color:C.teal}, line:{color:C.teal} });
  // 四个定位
  const pos = [
    { title:"整体交付（Turnkey）", body:"所有子系统无缝集成\n开箱即用" },
    { title:"模块部署（Modular）", body:"各子系统可独立部署\n按需选择" },
    { title:"方案整合（Integration）", body:"T-Join平台统一管理\n多厂商设备" },
    { title:"灵活扩展（Expansion）", body:"支持未来传感器接入\n保护既有投资" },
  ];
  pos.forEach((p, i) => {
    const x = 0.5 + i * 2.35;
    s.addShape(pres.shapes.RECTANGLE, { x, y:1.1, w:2.15, h:1.3, fill:{color:C.teal}, shadow:sshadow(), line:{color:C.teal} });
    s.addText(p.title, { x:x+0.1, y:1.2, w:1.95, h:0.45, fontSize:10, bold:true, color:C.textLight, fontFace:"Microsoft YaHei" });
    s.addText(p.body, { x:x+0.1, y:1.7, w:1.95, h:0.6, fontSize:8.5, color:"D6E4F0", fontFace:"SimSun" });
  });
  // 合作伙伴表格
  s.addText("合作伙伴生态", { x:0.5, y:2.6, w:9, h:0.4, fontSize:13, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  const partners = [
    ["合作伙伴","核心贡献","能力说明"],
    ["淘景数科","AI算法 + T-Join平台","50+港口场景算法；多厂商统一接入"],
    ["大疆创新","工业无人机 + 多传感器","Matrice 350 RTK；H20T；可扩展载荷"],
    ["杭州旗晟","地面巡检机器人","防爆型/水陆两栖/通用型；自动充电"],
    ["智感时代","无人船（补充）","割草/打捞/检测三合一；内河港口适用"],
    ["吉宝集团","系统集成 + 渠道","东南亚港口网络；项目管理与融资"],
  ];
  const tbl = s.addTable(partners, { x:0.5, y:3.1, w:9, colW:[1.5,2.0,5.5], fontSize:9, fontFace:"SimSun", border:{pt:1,color:"CCCCCC"} });
  // Header row style
  [0].forEach(r => {
    partners[r].forEach((_, c) => {
      // Header cells styled via options
    });
  });
}

// ========== 7. AI算法矩阵概览 ==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第3章：全场景AI视觉算法矩阵概览", { x:0.5, y:0.25, w:9, h:0.55, fontSize:20, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.85, w:9, h:0.04, fill:{color:C.teal}, line:{color:C.teal} });
  const carriers = [
    { icon:"📹", name:"固定摄像机", count:"22+ 算法", zones:"7大分区", color:C.teal },
    { icon:"🚁", name:"无人机（UAV）", count:"16+ 算法", zones:"7大分区", color:C.seafoam },
    { icon:"🤖", name:"巡检机器人", count:"13+ 算法", zones:"5大分区", color:C.green },
    { icon:"🚢", name:"无人船（USV）", count:"8+ 算法", zones:"3大分区", color:C.blue },
  ];
  carriers.forEach((c, i) => {
    const x = 0.5 + i * 2.35;
    s.addShape(pres.shapes.RECTANGLE, { x, y:1.1, w:2.15, h:2.8, fill:{color:C.lightBg}, shadow:sshadow(), line:{color:c.color, width:2} });
    s.addText(c.icon + " " + c.name, { x:x+0.1, y:1.3, w:1.95, h:0.5, fontSize:11, bold:true, color:c.color, fontFace:"Microsoft YaHei", align:"center" });
    s.addShape(pres.shapes.RECTANGLE, { x:x+0.3, y:1.95, w:1.55, h:0.45, fill:{color:c.color}, line:{color:c.color} });
    s.addText(c.count, { x:x+0.3, y:1.95, w:1.55, h:0.45, fontSize:13, bold:true, color:C.textLight, align:"center", valign:"middle", fontFace:"Arial" });
    s.addText(c.zones, { x:x+0.1, y:2.55, w:1.95, h:0.3, fontSize:9, color:C.textDark, fontFace:"SimSun", align:"center" });
    s.addText("多重联动闭环", { x:x+0.1, y:2.9, w:1.95, h:0.3, fontSize:8.5, color:C.midnight, fontFace:"SimSun", align:"center", bold:true });
  });
  s.addText("通过淘景数科 T-Join 平台实现跨载体联动，9大联动场景，响应时效 ≤15分钟", { x:0.5, y:4.1, w:9, h:0.4, fontSize:10, color:C.red, fontFace:"SimSun", align:"center", bold:true });
}

// ========== 8. 固定摄像机算法 ==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第3章：固定摄像机AI算法（7大分区，22+算法）", { x:0.5, y:0.25, w:9, h:0.5, fontSize:16, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.8, w:9, h:0.04, fill:{color:C.teal}, line:{color:C.teal} });
  const data = [
    ["分区","代表算法","准确率","联动触发"],
    ["岸线（岸桥）","箱号OCR、吊具对位、人员入侵","≥99.5%","箱号不匹配→道闸拦截"],
    ["堆场","AI盘存、堆垛稳定性、火灾预警","≥99%","火情→无人机灭火弹"],
    ["闸口","车牌OCR、箱号校验、人脸核验","≥99.5%","未授权→道闸锁死"],
    ["危化品区","防护装备检测、泄漏检测（三重）","≥97%","泄漏→防爆机器人"],
    ["周界","周界入侵检测、设施损坏","≥99%","入侵→机器人+无人机"],
    ["配电室","设备过热检测（红外）","≥98%","超温→机器人核查"],
    ["航道","油污检测、船舶行为监测","≥97%","油污→无人船"],
  ];
  s.addTable(data, { x:0.3, y:0.9, w:9.4, h:3.8, colW:[1.4,3.0,1.5,3.5], fontSize:8.5, fontFace:"SimSun", border:{pt:1,color:"CCCCCC"} });
}

// ========== 9. 无人机算法 ==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第3章：无人机AI算法（7大分区，16+算法）", { x:0.5, y:0.25, w:9, h:0.5, fontSize:16, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.8, w:9, h:0.04, fill:{color:C.seafoam}, line:{color:C.seafoam} });
  const data = [
    ["分区","代表算法","准确率","联动触发"],
    ["岸桥顶部","设备巡检（钢丝绳/滑轮）","≥98%","磨损超限→维护工单"],
    ["堆场","红外全景扫描、堆位盘存","≥99%","热点→两栖机器人"],
    ["周界","全景巡逻（盲区覆盖）","≥99%","入侵→喊话+机器人"],
    ["危化品区","360°风险评估（多传感器）","≥97%","风险→防爆机器人"],
    ["航道","多光谱巡逻（油污/藻华）","≥97%","油污→无人船"],
    ["应急处置","快速侦察（多载荷）","≥99%","事故→全协同调度"],
    ["清洗作业","岸桥/摄像机清洗","≥90%","计划→自动航线"],
  ];
  s.addTable(data, { x:0.3, y:0.9, w:9.4, h:3.8, colW:[1.4,3.0,1.5,3.5], fontSize:8.5, fontFace:"SimSun", border:{pt:1,color:"CCCCCC"} });
}

// ========== 10. 机器人+无人船算法 ==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第3章：机器人（13+）+ 无人船（8+）算法", { x:0.5, y:0.25, w:9, h:0.5, fontSize:16, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.8, w:9, h:0.04, fill:{color:C.green}, line:{color:C.green} });
  // 机器人
  s.addText("地面巡检机器人（5大分区，13+算法）", { x:0.5, y:0.9, w:9, h:0.35, fontSize:11, bold:true, color:C.green, fontFace:"Microsoft YaHei" });
  const robot = [
    ["类型","适用场景","核心AI能力"],
    ["防爆型 QS-EX","危化品区","红外+气体+可见光三重融合"],
    ["水陆两栖 QS-AMP","冷藏箱区","插头接触检测+电缆损伤+滤芯状态"],
    ["通用型 QS-GEN","堆场/周界","火灾扫描+入侵巡逻+超声波检测"],
  ];
  s.addTable(robot, { x:0.5, y:1.35, w:9, colW:[2.0,2.5,4.5], fontSize:9, fontFace:"SimSun", border:{pt:1,color:"CCCCCC"} });
  // 无人船
  s.addText("无人船（3大分区，8+算法）", { x:0.5, y:2.6, w:9, h:0.35, fontSize:11, bold:true, color:C.blue, fontFace:"Microsoft YaHei" });
  const usv = [
    ["分区","算法","准确率"],
    ["港口水域","漂浮物识别、水草制图","≥95%"],
    ["水质监测","多光谱分析、趋势预测","≥90%"],
    ["应急处置","油污扩散追踪、联合采样","≥92%"],
  ];
  s.addTable(usv, { x:0.5, y:3.05, w:9, colW:[2.0,3.5,3.5], fontSize:9, fontFace:"SimSun", border:{pt:1,color:"CCCCCC"} });
}

// ========== 11. 多载体联动 ==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第8章：多能力协同体系（9大联动场景）", { x:0.5, y:0.25, w:9, h:0.55, fontSize:18, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.85, w:9, h:0.04, fill:{color:C.red}, line:{color:C.red} });
  const scenes = [
    ["堆场火情","固定摄像机→无人机灭火弹","≤5分钟",C.red],
    ["堆垛倾斜","固定摄像机→机器人+无人机","≤3分钟",C.orange],
    ["危化品泄漏","固定摄像机→EX机器人+无人机","≤8分钟",C.orange],
    ["周界入侵","固定摄像机→机器人+无人机","≤2分钟",C.green],
    ["航道油污","固定摄像机→无人船+无人机","≤15分钟",C.blue],
    ["岸桥异常","固定摄像机→无人机+机器人","≤5分钟",C.teal],
    ["道闸故障","固定摄像机→机器人","≤3分钟",C.seafoam],
    ["冷藏箱异常","固定摄像机→AMP机器人+无人机","≤10分钟",C.green],
    ["全域空气监测","固定摄像机→无人机+无人船","每日2次",C.blue],
  ];
  scenes.forEach(([scene,flow,time,color], i) => {
    const col = i % 3, row = Math.floor(i/3);
    const x = 0.5 + col * 3.15, y = 1.1 + row * 1.5;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w:2.9, h:1.3, fill:{color:"FFFFFF"}, shadow:sshadow(), line:{color, width:1.5} });
    s.addShape(pres.shapes.RECTANGLE, { x, y, w:2.9, h:0.4, fill:{color}, line:{color} });
    s.addText(scene, { x:x+0.1, y:y+0.05, w:2.7, h:0.3, fontSize:10, bold:true, color:C.textLight, fontFace:"Microsoft YaHei" });
    s.addText(flow, { x:x+0.1, y:y+0.5, w:2.7, h:0.5, fontSize:8, color:C.textDark, fontFace:"SimSun" });
    s.addText("响应：" + time, { x:x+0.1, y:y+1.05, w:2.7, h:0.2, fontSize:8.5, bold:true, color, fontFace:"Arial" });
  });
}

// ========== 12. 设备：机器人 ==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第4章：地面巡检机器人能力（杭州旗晟）", { x:0.5, y:0.25, w:9, h:0.55, fontSize:18, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.85, w:9, h:0.04, fill:{color:C.teal}, line:{color:C.teal} });
  const robots = [
    { name:"防爆型 QS-EX", scene:"危化品区/油料区", spec:"IP65 / Ex d IIC T4\n红外+气体+可见光\n续航8小时（自动换电）", color:C.red },
    { name:"水陆两栖 QS-AMP", scene:"冷藏箱区/电缆隧道", spec:"IP54 防溅水\n插头检测+电缆损伤\n续航10小时", color:C.blue },
    { name:"通用型 QS-GEN", scene:"堆场/周界/配电室", spec:"IP54\n可见光+红外双光\n续航12小时", color:C.green },
  ];
  robots.forEach((r, i) => {
    const x = 0.5 + i * 3.15;
    s.addShape(pres.shapes.RECTANGLE, { x, y:1.1, w:2.9, h:2.8, fill:{color:C.lightBg}, shadow:sshadow(), line:{color:r.color, width:2} });
    s.addShape(pres.shapes.RECTANGLE, { x, y:1.1, w:2.9, h:0.5, fill:{color:r.color}, line:{color:r.color} });
    s.addText(r.name, { x:x+0.1, y:1.15, w:2.7, h:0.4, fontSize:11, bold:true, color:C.textLight, fontFace:"Microsoft YaHei", align:"center" });
    s.addText("适用场景", { x:x+0.1, y:1.75, w:2.7, h:0.25, fontSize:9, bold:true, color:r.color, fontFace:"Microsoft YaHei" });
    s.addText(r.scene, { x:x+0.1, y:2.0, w:2.7, h:0.35, fontSize:8.5, color:C.textDark, fontFace:"SimSun" });
    s.addText("技术规格", { x:x+0.1, y:2.4, w:2.7, h:0.25, fontSize:9, bold:true, color:r.color, fontFace:"Microsoft YaHei" });
    s.addText(r.spec, { x:x+0.1, y:2.7, w:2.7, h:0.9, fontSize:8, color:C.textDark, fontFace:"SimSun" });
  });
}

// ========== 13. 设备：无人机+无人船 ==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第5-6章：无人机（大疆）+ 无人船（智感时代）", { x:0.5, y:0.25, w:9, h:0.55, fontSize:16, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.85, w:9, h:0.04, fill:{color:C.seafoam}, line:{color:C.seafoam} });
  // 无人机
  s.addText("大疆 Matrice 350 RTK + 可扩展载荷", { x:0.5, y:1.0, w:9, h:0.35, fontSize:11, bold:true, color:C.seafoam, fontFace:"Microsoft YaHei" });
  const uav = [
    ["设备","规格","场景"],
    ["Matrice 350 RTK","IP55，抗风7级，55min续航","周界/岸桥/应急"],
    ["H20T载荷","可见光+红外+激光+透雾","全天候，夜间红外"],
    ["Dock 2基站","IP55，自动充电","无人值守，减2名飞手"],
    ["扩展载荷","水炮/灭火弹/空气/水质","按需配置"],
  ];
  s.addTable(uav, { x:0.5, y:1.45, w:4.3, h:2.0, colW:[1.8,1.5,1.0], fontSize:8.5, fontFace:"SimSun", border:{pt:1,color:"CCCCCC"} });
  // 无人船
  s.addText("智感时代无人船（补充选项）", { x:5.2, y:1.0, w:4.3, h:0.35, fontSize:11, bold:true, color:C.blue, fontFace:"Microsoft YaHei" });
  const usv2 = [
    ["设备","规格","价值"],
    ["无人船 ZG-WS","3.2m，6h续航，IP65","替代人工，人力-80%"],
    ["割草/打捞模块","200L容量，0.5-2m水深","效率提升10倍"],
    ["水质监测模块","多光谱 COD/浊度","效率提升20倍"],
    ["AI视觉模块","可见光+红外，淘景算法","水空全域覆盖"],
  ];
  s.addTable(usv2, { x:5.2, y:1.45, w:4.3, h:2.0, colW:[1.8,1.5,1.0], fontSize:8.5, fontFace:"SimSun", border:{pt:1,color:"CCCCCC"} });
}

// ========== 14. 智能道闸 ==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第7章：港口道闸设备（智能通行管理）", { x:0.5, y:0.25, w:9, h:0.55, fontSize:18, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.85, w:9, h:0.04, fill:{color:C.orange}, line:{color:C.orange} });
  const modules = [
    { name:"车牌OCR识别", desc:"多国车牌识别\n夜间红外补偿\n准确率≥99.5%", icon:"🚗" },
    { name:"箱号OCR校验", desc:"与TOS系统同步\n箱号不匹配拦截\n准确率≥99.7%", icon:"📦" },
    { name:"人脸核验", desc:"与派车系统联动\n未授权驾驶员拦截\n准确率≥99.9%", icon:"👤" },
    { name:"自动审批引擎", desc:"多级审批\n微信/邮件通知\n审批30min→3min", icon:"✅" },
    { name:"车辆损伤记录", desc:"AI损伤检测\n入场/出场对比\n减少纠纷", icon:"📷" },
    { name:"道闸健康监控", desc:"红外状态监测\n防砸传感器\n故障率-80%", icon:"🔧" },
  ];
  modules.forEach((m, i) => {
    const col = i % 3, row = Math.floor(i/3);
    const x = 0.5 + col * 3.15, y = 1.1 + row * 2.2;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w:2.9, h:1.9, fill:{color:C.lightBg}, shadow:sshadow(), line:{color:C.orange, width:1.5} });
    s.addText(m.icon + " " + m.name, { x:x+0.1, y:y+0.15, w:2.7, h:0.4, fontSize:10, bold:true, color:C.orange, fontFace:"Microsoft YaHei" });
    s.addText(m.desc, { x:x+0.1, y:y+0.6, w:2.7, h:1.1, fontSize:8.5, color:C.textDark, fontFace:"SimSun" });
  });
}

// ========== 15. KPI + ROI ==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第9章：KPI承诺 + 投资回报", { x:0.5, y:0.25, w:9, h:0.55, fontSize:20, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.85, w:9, h:0.04, fill:{color:C.teal}, line:{color:C.teal} });
  // KPI 指标卡片
  const kpis = [
    { label:"吞吐能力提升", val:"+20~30%", color:C.teal },
    { label:"闸口通行时间", val:"≤25秒", color:C.seafoam },
    { label:"安全事故", val:"-80%", color:C.red },
    { label:"现场人员", val:"-33%", color:C.orange },
    { label:"AI检测准确率", val:"≥99%", color:C.green },
    { label:"应急响应时间", val:"≤5分钟", color:C.blue },
    { label:"巡检覆盖率", val:"≥99%", color:"8064A2" },
    { label:"系统可用性", val:"≥99.9%", color:"C55A11" },
  ];
  kpis.forEach((k, i) => {
    const col = i % 4, row = Math.floor(i/4);
    const x = 0.5 + col * 2.35, y = 1.1 + row * 1.6;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w:2.15, h:1.35, fill:{color:k.color}, shadow:sshadow(), line:{color:k.color} });
    s.addText(k.val, { x, y:y+0.15, w:2.15, h:0.65, fontSize:20, bold:true, color:C.textLight, align:"center", fontFace:"Arial" });
    s.addText(k.label, { x, y:y+0.85, w:2.15, h:0.4, fontSize:9, color:"E8F0FA", align:"center", fontFace:"SimSun" });
  });
  s.addText("投资回收期：0.5~0.8年（6~10个月）| 年度总收益：4.6~6.2亿元", { x:0.5, y:4.3, w:9, h:0.4, fontSize:11, bold:true, color:C.red, align:"center", fontFace:"SimSun" });
}

// ========== 16. 实施路线图 ==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第9章：实施路线图（4个阶段）", { x:0.5, y:0.25, w:9, h:0.55, fontSize:20, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.85, w:9, h:0.04, fill:{color:C.teal}, line:{color:C.teal} });
  const phases = [
    { phase:"阶段1：基础建设", time:"第1~2年", content:"T-Join部署\n智能道闸安装\n边缘计算节点（AI试点）", color:C.teal, invest:"0.8~1.5亿" },
    { phase:"阶段2：机器人与道闸", time:"第2~3年", content:"旗晟机器人部署\n道闸系统全覆盖\n淘景AI算法全量加载", color:C.seafoam, invest:"0.6~1.0亿" },
    { phase:"阶段3：无人机与协同", time:"第3~4年", content:"大疆无人机上线\nT-Join协同优化\n智感无人船（按需）", color:C.green, invest:"0.5~0.8亿" },
    { phase:"阶段4：持续优化", time:"第4年及以后", content:"AI模型持续改进\n新型传感器集成\n运维与升级", color:C.blue, invest:"0.2~0.3亿/年" },
  ];
  phases.forEach((p, i) => {
    const x = 0.5 + i * 2.35;
    s.addShape(pres.shapes.RECTANGLE, { x, y:1.1, w:2.15, h:3.0, fill:{color:C.lightBg}, shadow:sshadow(), line:{color:p.color, width:2} });
    s.addShape(pres.shapes.RECTANGLE, { x, y:1.1, w:2.15, h:0.5, fill:{color:p.color}, line:{color:p.color} });
    s.addText(p.phase, { x:x+0.05, y:1.15, w:2.05, h:0.4, fontSize:9.5, bold:true, color:C.textLight, fontFace:"Microsoft YaHei", align:"center" });
    s.addText(p.time, { x:x+0.05, y:1.65, w:2.05, h:0.3, fontSize:8.5, color:p.color, fontFace:"SimSun", align:"center", bold:true });
    s.addText(p.content, { x:x+0.1, y:2.05, w:1.95, h:1.2, fontSize:8.5, color:C.textDark, fontFace:"SimSun" });
    s.addShape(pres.shapes.RECTANGLE, { x:x+0.2, y:3.35, w:1.75, h:0.35, fill:{color:p.color}, line:{color:p.color} });
    s.addText("投资 " + p.invest, { x:x+0.2, y:3.35, w:1.75, h:0.35, fontSize:8, bold:true, color:C.textLight, align:"center", valign:"middle", fontFace:"Arial" });
  });
}

// ========== 17. 风险与对策 ==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第10章：风险分析与对策", { x:0.5, y:0.25, w:9, h:0.55, fontSize:20, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.85, w:9, h:0.04, fill:{color:C.red}, line:{color:C.red} });
  const risks = [
    { risk:"技术风险：AI准确率", resp:"分阶段部署，先试点验证；持续模型训练" },
    { risk:"供应链风险：关键零部件", resp:"提前6个月下单；多源供应策略；安全库存" },
    { risk:"实施风险：项目进度", resp:"分阶段部署；最小干扰设计；灵活调度" },
    { risk:"安全风险：网络攻击", resp:"网络分区；端到端加密；渗透测试" },
    { risk:"合规风险：监管差异", resp:"逐国合规评估；当地法律顾问；监管联络" },
  ];
  risks.forEach((r, i) => {
    const y = 1.05 + i * 0.85;
    s.addShape(pres.shapes.RECTANGLE, { x:0.5, y, w:9, h:0.75, fill:{color:i%2==0?C.lightBg:"FFFFFF"}, line:{color:"CCCCCC", width:0.5} });
    s.addShape(pres.shapes.RECTANGLE, { x:0.5, y, w:0.08, h:0.75, fill:{color:C.red}, line:{color:C.red} });
    s.addText(r.risk, { x:0.7, y:y+0.08, w:3.5, h:0.3, fontSize:10, bold:true, color:C.red, fontFace:"Microsoft YaHei" });
    s.addText(r.resp, { x:0.7, y:y+0.4, w:8.5, h:0.3, fontSize:9, color:C.textDark, fontFace:"SimSun" });
  });
}

// ========== 18. 售后服务 ==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第11章：售后服务与运维承诺", { x:0.5, y:0.25, w:9, h:0.55, fontSize:20, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.85, w:9, h:0.04, fill:{color:C.teal}, line:{color:C.teal} });
  const sla = [
    ["服务项目","标准版 SLA","高级版 SLA"],
    ["硬件保修","3年","5年"],
    ["现场支持","7×24响应","7×24 + 专属工程师 ≤4h到场"],
    ["远程支持","7×24热线 ≤30min","7×24优先 ≤15min"],
    ["系统可用性","≥99.5%","≥99.9%"],
    ["AI模型更新","每季度","每月"],
    ["备件供应","72小时本地库存","48小时本地库存 + 区域中心仓"],
  ];
  s.addTable(sla, { x:0.5, y:1.0, w:9, colW:[2.5,3.0,3.5], fontSize:9.5, fontFace:"SimSun", border:{pt:1,color:"CCCCCC"} });
  s.addText("培训计划：系统概述（1天）/ 操作培训（3天）/ 维护培训（5天）/ 高级培训（10天）/ 应急演练（1天）/ 复训（每半年）", { x:0.5, y:4.3, w:9, h:0.4, fontSize:9.5, color:C.midnight, fontFace:"SimSun", align:"center" });
}

// ========== 19. 术语表 ==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("附录A：术语表与缩写对照", { x:0.5, y:0.25, w:9, h:0.55, fontSize:20, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.85, w:9, h:0.04, fill:{color:C.teal}, line:{color:C.teal} });
  const terms = [
    ["AGV","自动导引车"],["ASC","自动堆垛起重机"],["RMQC","远程操控岸桥"],
    ["TOS","码头操作系统"],["AI","人工智能"],["OCR","光学字符识别"],
    ["5G","第五代移动通信"],["IoT","物联网"],["数字孪生","物理资产虚拟副本"],
    ["UAV","无人机"],["USV","无人水面艇"],["SLA","服务等级协议"],
    ["TEU","二十英尺等效单位"],["ROI","投资回报率"],["NVIDIA Jetson","边缘AI计算平台"],
  ];
  terms.forEach(([abbr,mean], i) => {
    const col = i % 4, row = Math.floor(i/4);
    const x = 0.5 + col * 2.35, y = 1.1 + row * 0.65;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w:2.15, h:0.55, fill:{color:C.bgCard}, line:{color:C.teal, width:1} });
    s.addText(abbr, { x:x+0.05, y:y+0.05, w:0.9, h:0.45, fontSize:10, bold:true, color:C.teal, fontFace:"Arial", valign:"middle" });
    s.addText(mean, { x:x+0.95, y:y+0.1, w:1.15, h:0.35, fontSize:8.5, color:C.textDark, fontFace:"SimSun", valign:"middle" });
  });
}

// ========== 20. 封底 ==========
{
  const s = pres.addSlide();
  addBg(s, C.darkBg);
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:0.08, h:5.625, fill:{color:C.teal}, line:{color:C.teal} });
  s.addText("感谢您看完本方案", { x:0.5, y:1.5, w:9, h:0.8, fontSize:28, bold:true, color:C.textLight, fontFace:"Microsoft YaHei", align:"center" });
  s.addShape(pres.shapes.LINE, { x:2.5, y:2.45, w:5, h:0, line:{color:C.seafoam, width:1.5} });
  s.addText("我们期待与吉宝集团（Keppel Corporation）合作\n共同建设东南亚下一代智慧港口", { x:0.5, y:2.6, w:9, h:0.7, fontSize:14, color:"AACCEE", fontFace:"Microsoft YaHei", align:"center" });
  s.addText("如有疑问，请联系：吉宝集团 — 业务发展部", { x:0.5, y:3.6, w:9, h:0.35, fontSize:11, color:"D6E4F0", fontFace:"SimSun", align:"center" });
  s.addText("Keppel Corporation — Creating solutions for a sustainable future", { x:0.5, y:4.1, w:9, h:0.3, fontSize:9, color:"888888", fontFace:"Arial", align:"center", italic:true });
}

// ========== 保存 ==========
const outPath = '/Users/tom/Desktop/智慧港口AI巡检解决方案_Keppel_V5.pptx';
pres.writeFile({ fileName: outPath })
  .then(() => {
    console.log('OK: ' + outPath);
  })
  .catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
  });
