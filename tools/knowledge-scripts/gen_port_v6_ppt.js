const pptxgen = require('pptxgenjs');
const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.author = '淘景数科';
pres.title = '智慧港口AI巡检预警解决方案 V6';

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

function sshadow() { return { type:"outer", blur:6, offset:2, color:"000000", opacity:0.12 }; }
function addBg(slide, color) { slide.background = { color }; }

// ========== 1. 标题页 ==========
{
  const s = pres.addSlide();
  addBg(s, C.darkBg);
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:0.08, h:5.625, fill:{color:C.teal}, line:{color:C.teal} });
  s.addText("智慧港口AI巡检预警解决方案", { x:0.5, y:1.2, w:9, h:1, fontSize:32, bold:true, color:C.textLight, fontFace:"Microsoft YaHei", align:"left" });
  s.addText("Smart Port AI Inspection & Early Warning Solution", { x:0.5, y:2.3, w:9, h:0.5, fontSize:14, color:"AACCEE", fontFace:"Arial", align:"left", italic:true });
  s.addShape(pres.shapes.LINE, { x:0.5, y:2.9, w:6, h:0, line:{color:C.seafoam, width:2} });
  s.addText("为 吉宝集团（Keppel Corporation）定制", { x:0.5, y:3.1, w:8, h:0.5, fontSize:16, bold:true, color:C.seafoam, fontFace:"Microsoft YaHei", align:"left" });
  s.addText("版本 V6.0  |  2026年6月", { x:0.5, y:3.7, w:8, h:0.4, fontSize:11, color:"AACCEE", fontFace:"SimSun", align:"left" });
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
    ["第1章","行业标杆案例集（14个实际项目）"],
    ["第2章","核心定位与合作伙伴生态"],
    ["第3章","全场景AI视觉算法矩阵（四大载体）"],
    ["第4章","地面巡检机器人（杭州旗晟）"],
    ["第5章","空中无人机巡检（大疆创新）"],
    ["第6章","无人船补充方案（智感时代）"],
    ["第7章","港口道闸设备"],
    ["第8章","多载体协同体系（T-Join平台）"],
    ["第9章","方案价值与实施路径"],
    ["第10章","风险分析与对策"],
    ["第11章","售后服务与运维承诺"],
    ["附录A","术语表"],
  ];
  items.forEach(([ch,title], i) => {
    const y = 1.05 + i * 0.34;
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
  s.addText("注：以下信息基于吉宝2025年年报及公开资料整理，未经核实的信息以实地调研为准", { x:0.5, y:0.92, w:9, h:0.3, fontSize:7.5, color:"999999", fontFace:"SimSun", italic:true });
  const cards = [
    { title:"基础设施", body:"港口投资与运营\n能源与数据中心\n资产管理" },
    { title:"房地产", body:"商业地产开发\n城市综合体\n可持续建筑" },
    { title:"连接性", body:"ICT与网络基础设施\n智慧城市方案\n数据与连接服务" },
  ];
  cards.forEach((c, i) => {
    const x = 0.5 + i * 3.15;
    s.addShape(pres.shapes.RECTANGLE, { x, y:1.3, w:2.9, h:2.0, fill:{color:C.bgCard}, shadow:sshadow(), line:{color:C.border, width:1} });
    s.addShape(pres.shapes.RECTANGLE, { x, y:1.3, w:2.9, h:0.45, fill:{color:C.teal}, line:{color:C.teal} });
    s.addText(c.title, { x:x+0.1, y:1.35, w:2.7, h:0.4, fontSize:10, bold:true, color:C.textLight, fontFace:"Microsoft YaHei", valign:"middle" });
    s.addText(c.body, { x:x+0.15, y:1.85, w:2.6, h:1.3, fontSize:9, color:C.textDark, fontFace:"SimSun", valign:"top" });
  });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:3.5, w:9, h:0.45, fill:{color:C.midnight}, line:{color:C.midnight} });
  s.addText("大士港（Tuas Port）— 参考性信息", { x:0.6, y:3.52, w:8.5, h:0.4, fontSize:11, bold:true, color:C.textLight, fontFace:"Microsoft YaHei" });
  const bullets = ["总投资35亿新元，预计2030年完工，设计吞吐6500万TEU/年","AGV + ASC + 远程岸桥，全流程无人化","已部署AI调度和数字孪生系统","吉宝为主要投资方和运营方之一，具备实际运营经验"];
  bullets.forEach((b, i) => {
    s.addText("- " + b, { x:0.7, y:4.05+i*0.3, w:8.5, h:0.28, fontSize:8.5, color:C.textDark, fontFace:"SimSun" });
  });
}

// ========== 4. 行业标杆案例（1/2）==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第1章：行业标杆案例（1/2）— 国内", { x:0.5, y:0.25, w:9, h:0.55, fontSize:18, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.85, w:9, h:0.04, fill:{color:C.teal}, line:{color:C.teal} });
  const cases = [
    { name:"青岛港", kpi:"自动化码头\n62.62箱/小时\n世界纪录级效率", color:C.teal },
    { name:"洋山港四期", kpi:"全球最大单体自动化码头\n年吞吐745万TEU\n华为+振华重工", color:C.seafoam },
    { name:"宁波舟山港", kpi:"AI+机器狗空箱查验\n通关时间从2小时缩至10分钟\n海康机器人", color:C.green },
    { name:"南京港", kpi:"AI管理平台\n识别准确率95%+\n华为+淘景数科", color:C.blue },
    { name:"山港天和", kpi:"设备综合效率+30%\n等待时间减少90%\n轻量化改造", color:C.orange },
    { name:"唐山港", kpi:"四足消防机器人\n80L/s水炮\n消防+巡检融合", color:C.red },
  ];
  cases.forEach((c, i) => {
    const col = i % 3, row = Math.floor(i/3);
    const x = 0.5 + col * 3.15, y = 1.1 + row * 1.95;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w:2.9, h:1.75, fill:{color:C.lightBg}, shadow:sshadow(), line:{color:c.color, width:1.5} });
    s.addShape(pres.shapes.RECTANGLE, { x, y, w:0.08, h:1.75, fill:{color:c.color}, line:{color:c.color} });
    s.addText(c.name, { x:x+0.2, y:y+0.15, w:2.6, h:0.4, fontSize:12, bold:true, color:c.color, fontFace:"Microsoft YaHei" });
    s.addText(c.kpi, { x:x+0.2, y:y+0.6, w:2.6, h:1.0, fontSize:8.5, color:C.textDark, fontFace:"SimSun" });
  });
}

// ========== 5. 行业标杆案例（2/2）==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第1章：行业标杆案例（2/2）", { x:0.5, y:0.25, w:9, h:0.55, fontSize:18, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.85, w:9, h:0.04, fill:{color:C.teal}, line:{color:C.teal} });
  const cases = [
    { name:"烟台港", kpi:"干散货全自动化\n综合效率+8%" },
    { name:"镇江港", kpi:"AI皮带检测\n年省运维300万+" },
    { name:"舟山甬舟", kpi:"空地协同\n机器人+无人机联合巡检" },
    { name:"大士港", kpi:"6500万TEU/年\n全球最大全自动化" },
    { name:"鹿特丹港", kpi:"AI调度+区块链\n欧洲自动化标杆" },
    { name:"釜山港", kpi:"智能闸口\nAI船舶到港预测" },
    { name:"埃及苏赫纳港", kpi:"北非首座全自动码头\n振华重工+中控技术" },
    { name:"青岛港视觉大模型", kpi:"500路实时监测\n港口视觉中枢" },
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
  const pos = [
    { title:"整体交付", body:"所有子系统无缝集成\n开箱即用" },
    { title:"模块部署", body:"各子系统可独立部署\n按需选择" },
    { title:"统一管理", body:"T-Join平台统一接入\n多厂商设备" },
    { title:"灵活扩展", body:"支持未来传感器接入\n保护既有投资" },
  ];
  pos.forEach((p, i) => {
    const x = 0.5 + i * 2.35;
    s.addShape(pres.shapes.RECTANGLE, { x, y:1.1, w:2.15, h:1.3, fill:{color:C.teal}, shadow:sshadow(), line:{color:C.teal} });
    s.addText(p.title, { x:x+0.1, y:1.2, w:1.95, h:0.45, fontSize:10, bold:true, color:C.textLight, fontFace:"Microsoft YaHei" });
    s.addText(p.body, { x:x+0.1, y:1.7, w:1.95, h:0.6, fontSize:8.5, color:"D6E4F0", fontFace:"SimSun" });
  });
  s.addText("合作伙伴生态", { x:0.5, y:2.6, w:9, h:0.4, fontSize:13, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  const partners = [
    ["合作伙伴","核心贡献","能力说明"],
    ["淘景数科（总包）","AI算法 + T-Join平台","50+港口场景算法；多厂商统一接入"],
    ["大疆创新（配套）","工业无人机 + 多传感器","Matrice 350 RTK；可扩展载荷"],
    ["杭州旗晟（配套）","地面巡检机器人","防爆型/水陆两栖/通用型；自动充电"],
    ["智感时代（配套）","无人船","割草/打捞/检测三合一；内河港口适用"],
  ];
  s.addTable(partners, { x:0.5, y:3.1, w:9, colW:[1.8,2.2,5.0], fontSize:9, fontFace:"SimSun", border:{pt:1,color:"CCCCCC"} });
}

// ========== 7. AI算法矩阵概览 ==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第3章：全场景AI视觉算法矩阵", { x:0.5, y:0.25, w:9, h:0.55, fontSize:20, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.85, w:9, h:0.04, fill:{color:C.teal}, line:{color:C.teal} });
  const carriers = [
    { name:"固定摄像机", count:"22+", zones:"7大分区", color:C.teal },
    { name:"无人机", count:"16+", zones:"7大分区", color:C.seafoam },
    { name:"巡检机器人", count:"13+", zones:"5大分区", color:C.green },
    { name:"无人船", count:"8+", zones:"3大分区", color:C.blue },
  ];
  carriers.forEach((c, i) => {
    const x = 0.5 + i * 2.35;
    s.addShape(pres.shapes.RECTANGLE, { x, y:1.1, w:2.15, h:2.8, fill:{color:C.lightBg}, shadow:sshadow(), line:{color:c.color, width:2} });
    s.addText(c.name, { x:x+0.1, y:1.3, w:1.95, h:0.5, fontSize:11, bold:true, color:c.color, fontFace:"Microsoft YaHei", align:"center" });
    s.addShape(pres.shapes.RECTANGLE, { x:x+0.3, y:1.95, w:1.55, h:0.45, fill:{color:c.color}, line:{color:c.color} });
    s.addText(c.count + " 算法", { x:x+0.3, y:1.95, w:1.55, h:0.45, fontSize:13, bold:true, color:C.textLight, align:"center", valign:"middle", fontFace:"Arial" });
    s.addText(c.zones, { x:x+0.1, y:2.55, w:1.95, h:0.3, fontSize:9, color:C.textDark, fontFace:"SimSun", align:"center" });
    s.addText("T-Join联动", { x:x+0.1, y:2.9, w:1.95, h:0.3, fontSize:8.5, color:C.midnight, fontFace:"SimSun", align:"center", bold:true });
  });
  s.addText("通过T-Join平台实现跨载体联动，9大联动场景，大部分响应时间在15分钟以内", { x:0.5, y:4.1, w:9, h:0.4, fontSize:10, color:C.textDark, fontFace:"SimSun", align:"center" });
}

// ========== 8. 固定摄像机算法 ==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第3章：固定摄像机AI算法（7大分区）", { x:0.5, y:0.25, w:9, h:0.5, fontSize:16, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.8, w:9, h:0.04, fill:{color:C.teal}, line:{color:C.teal} });
  const data = [
    ["分区","代表算法","参考准确率","联动触发"],
    ["岸线（岸桥）","箱号OCR、吊具对位、人员入侵","实测99%+","箱号不匹配时道闸拦截"],
    ["堆场","AI盘存、堆垛稳定性、火灾预警","实测99%","确认火情后无人机携带灭火弹处置"],
    ["闸口","车牌OCR、箱号校验、人脸核验","实测99%+","未授权车辆道闸锁死并记录"],
    ["危化品区","防护装备检测、泄漏检测（三传感器）","目标97%+","泄漏预警后防爆机器人核查"],
    ["周界","入侵检测、围栏损坏","实测99%","确认后机器人+无人机联合处置"],
    ["配电室","设备过热检测（红外热成像）","目标98%","超温预警后机器人现场核查"],
    ["航道","油污检测、船舶行为异常","目标97%","油污事件无人船采样确认"],
  ];
  s.addTable(data, { x:0.3, y:0.9, w:9.4, h:3.8, colW:[1.4,3.0,1.5,3.5], fontSize:8.5, fontFace:"SimSun", border:{pt:1,color:"CCCCCC"} });
}

// ========== 9. 无人机算法 ==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第3章：无人机AI算法（7大分区）", { x:0.5, y:0.25, w:9, h:0.5, fontSize:16, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.8, w:9, h:0.04, fill:{color:C.seafoam}, line:{color:C.seafoam} });
  const data = [
    ["分区","代表算法","参考准确率","联动触发"],
    ["岸桥顶部","设备巡检（钢丝绳/滑轮磨损）","目标98%","磨损超限自动生成维护工单"],
    ["堆场","红外全景扫描、堆位盘存","实测99%","发现热点两栖机器人核查"],
    ["周界","全景巡逻（覆盖固定摄像机盲区）","实测99%","确认后喊话威慑+机器人处置"],
    ["危化品区","360度风险评估（多传感器融合）","目标97%","确认后防爆机器人处置"],
    ["航道","多光谱巡逻（油污/藻华检测）","目标97%","发现后无人船采样确认"],
    ["应急处置","快速侦察（载荷可切换）","实测99%","重大事故多载体协同调度"],
    ["清洗作业","岸桥/摄像机自动清洗","约90%","按计划自动执行清洗航线"],
  ];
  s.addTable(data, { x:0.3, y:0.9, w:9.4, h:3.8, colW:[1.4,3.0,1.5,3.5], fontSize:8.5, fontFace:"SimSun", border:{pt:1,color:"CCCCCC"} });
}

// ========== 10. 机器人+无人船算法 ==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第3章：机器人 + 无人船算法", { x:0.5, y:0.25, w:9, h:0.5, fontSize:16, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.8, w:9, h:0.04, fill:{color:C.green}, line:{color:C.green} });
  s.addText("地面巡检机器人（5大分区，13+算法）", { x:0.5, y:0.9, w:9, h:0.35, fontSize:11, bold:true, color:C.green, fontFace:"Microsoft YaHei" });
  const robot = [
    ["类型","适用场景","核心AI能力"],
    ["防爆型 QS-EX","危化品区","红外+气体+可见光三重融合"],
    ["水陆两栖 QS-AMP","冷藏箱区","插头接触+电缆损伤+滤芯状态检测"],
    ["通用型 QS-GEN","堆场/周界","火灾扫描+入侵巡逻+超声波检测"],
  ];
  s.addTable(robot, { x:0.5, y:1.35, w:9, colW:[2.0,2.5,4.5], fontSize:9, fontFace:"SimSun", border:{pt:1,color:"CCCCCC"} });
  s.addText("无人船（3大分区，8+算法）", { x:0.5, y:2.6, w:9, h:0.35, fontSize:11, bold:true, color:C.blue, fontFace:"Microsoft YaHei" });
  const usv = [
    ["分区","算法","参考准确率"],
    ["港口水域","漂浮物识别、水草制图","目标95%"],
    ["水质监测","多光谱分析、趋势预测","约90%"],
    ["应急处置","油污扩散追踪、联合采样","目标92%"],
  ];
  s.addTable(usv, { x:0.5, y:3.05, w:9, colW:[2.0,3.5,3.5], fontSize:9, fontFace:"SimSun", border:{pt:1,color:"CCCCCC"} });
}

// ========== 11. 多载体联动 ==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第8章：多载体协同体系（T-Join平台调度）", { x:0.5, y:0.25, w:9, h:0.55, fontSize:18, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.85, w:9, h:0.04, fill:{color:C.teal}, line:{color:C.teal} });
  const scenes = [
    ["堆场火情","摄像机发现 > 无人机灭火弹+机器人核查","约5分钟",C.red],
    ["堆垛倾斜","摄像机发现 > 机器人测量+无人机全景确认","约3分钟",C.orange],
    ["危化品泄漏","摄像机发现 > EX机器人+无人机评估","约8分钟",C.orange],
    ["周界入侵","摄像机发现 > 机器人拦截+无人机追踪","约2分钟",C.green],
    ["航道油污","摄像机发现 > 无人船采样+无人机追踪","约15分钟",C.blue],
    ["岸桥异常","摄像机发现 > 无人机检查+机器人地面支持","约5分钟",C.teal],
    ["道闸故障","摄像机发现 > 机器人现场核验","约3分钟",C.seafoam],
    ["冷藏箱异常","摄像机发现 > AMP机器人+无人机红外确认","约10分钟",C.green],
    ["全域空气监测","定期任务 > 无人机多传感器+无人船水质","每日2次",C.blue],
  ];
  scenes.forEach(([scene,flow,time,color], i) => {
    const col = i % 3, row = Math.floor(i/3);
    const x = 0.5 + col * 3.15, y = 1.1 + row * 1.5;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w:2.9, h:1.3, fill:{color:"FFFFFF"}, shadow:sshadow(), line:{color, width:1.5} });
    s.addShape(pres.shapes.RECTANGLE, { x, y, w:2.9, h:0.4, fill:{color}, line:{color} });
    s.addText(scene, { x:x+0.1, y:y+0.05, w:2.7, h:0.3, fontSize:10, bold:true, color:C.textLight, fontFace:"Microsoft YaHei" });
    s.addText(flow, { x:x+0.1, y:y+0.5, w:2.7, h:0.5, fontSize:8, color:C.textDark, fontFace:"SimSun" });
    s.addText("响应 " + time, { x:x+0.1, y:y+1.05, w:2.7, h:0.2, fontSize:8.5, bold:true, color, fontFace:"Arial" });
  });
}

// ========== 12. 设备：机器人 ==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第4章：地面巡检机器人（杭州旗晟）", { x:0.5, y:0.25, w:9, h:0.55, fontSize:18, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.85, w:9, h:0.04, fill:{color:C.teal}, line:{color:C.teal} });
  const robots = [
    { name:"防爆型 QS-EX", scene:"危化品区/油料区", spec:"IP65 / Ex d IIC T4\n红外+气体+可见光\n续航8小时（支持自动换电）", color:C.red },
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
  s.addText("大疆 Matrice 350 RTK + 可扩展载荷", { x:0.5, y:1.0, w:4.3, h:0.35, fontSize:11, bold:true, color:C.seafoam, fontFace:"Microsoft YaHei" });
  const uav = [
    ["设备","规格","场景"],
    ["Matrice 350 RTK","IP55，抗风7级，55min续航","周界/岸桥/应急"],
    ["H20T载荷","可见光+红外+激光+透雾","全天候"],
    ["Dock 2基站","IP55，自动充电","无人值守"],
    ["扩展载荷","水炮/灭火弹/空气/水质","按需配置"],
  ];
  s.addTable(uav, { x:0.5, y:1.45, w:4.3, h:2.0, colW:[1.8,1.5,1.0], fontSize:8.5, fontFace:"SimSun", border:{pt:1,color:"CCCCCC"} });
  s.addText("智感时代无人船（按需选配）", { x:5.2, y:1.0, w:4.3, h:0.35, fontSize:11, bold:true, color:C.blue, fontFace:"Microsoft YaHei" });
  const usv2 = [
    ["设备","规格","价值"],
    ["无人船 ZG-WS","3.2m，6h续航，IP65","替代人工"],
    ["割草/打捞模块","200L容量，0.5-2m水深","效率提升明显"],
    ["水质监测模块","多光谱 COD/浊度","自动化检测"],
    ["AI视觉模块","可见光+红外，淘景算法","水空协同"],
  ];
  s.addTable(usv2, { x:5.2, y:1.45, w:4.3, h:2.0, colW:[1.8,1.5,1.0], fontSize:8.5, fontFace:"SimSun", border:{pt:1,color:"CCCCCC"} });
}

// ========== 14. 智能道闸 ==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第7章：港口道闸设备", { x:0.5, y:0.25, w:9, h:0.55, fontSize:18, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.85, w:9, h:0.04, fill:{color:C.orange}, line:{color:C.orange} });
  const modules = [
    { name:"车牌OCR识别", desc:"多国车牌识别\n夜间红外补偿\n实测99%+" },
    { name:"箱号OCR校验", desc:"与TOS系统同步\n箱号不匹配拦截\n实测99%+" },
    { name:"人脸核验", desc:"与派车系统联动\n未授权驾驶员拦截\n实测99%+" },
    { name:"自动审批引擎", desc:"多级审批流程\n微信/邮件通知\n审批时间从30min缩短至3min" },
    { name:"车辆损伤记录", desc:"AI损伤检测\n入场/出场对比\n减少纠纷" },
    { name:"道闸健康监控", desc:"红外状态监测\n防砸传感器\n故障率显著降低" },
  ];
  modules.forEach((m, i) => {
    const col = i % 3, row = Math.floor(i/3);
    const x = 0.5 + col * 3.15, y = 1.1 + row * 2.2;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w:2.9, h:1.9, fill:{color:C.lightBg}, shadow:sshadow(), line:{color:C.orange, width:1.5} });
    s.addText(m.name, { x:x+0.1, y:y+0.15, w:2.7, h:0.4, fontSize:10, bold:true, color:C.orange, fontFace:"Microsoft YaHei" });
    s.addText(m.desc, { x:x+0.1, y:y+0.6, w:2.7, h:1.1, fontSize:8.5, color:C.textDark, fontFace:"SimSun" });
  });
}

// ========== 15. KPI + ROI ==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第9章：KPI承诺 + 投资回报", { x:0.5, y:0.25, w:9, h:0.55, fontSize:20, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.85, w:9, h:0.04, fill:{color:C.teal}, line:{color:C.teal} });
  const kpis = [
    { label:"吞吐能力提升（稳态）", val:"+20~30%", color:C.teal },
    { label:"闸口通行时间（首年目标）", val:"25秒内", color:C.seafoam },
    { label:"安全事故降低（稳态）", val:"约80%", color:C.red },
    { label:"现场人员优化（稳态）", val:"约33%", color:C.orange },
    { label:"AI检测准确率（首年）", val:"99%+", color:C.green },
    { label:"应急响应时间（首年目标）", val:"5分钟内", color:C.blue },
    { label:"巡检覆盖率（稳态）", val:"99%+", color:"8064A2" },
    { label:"系统可用性（SLA）", val:"99.9%", color:"C55A11" },
  ];
  kpis.forEach((k, i) => {
    const col = i % 4, row = Math.floor(i/4);
    const x = 0.5 + col * 2.35, y = 1.1 + row * 1.6;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w:2.15, h:1.35, fill:{color:k.color}, shadow:sshadow(), line:{color:k.color} });
    s.addText(k.val, { x, y:y+0.15, w:2.15, h:0.65, fontSize:20, bold:true, color:C.textLight, align:"center", fontFace:"Arial" });
    s.addText(k.label, { x, y:y+0.85, w:2.15, h:0.4, fontSize:9, color:"E8F0FA", align:"center", fontFace:"SimSun" });
  });
  s.addText("参考投资回收期：6~10个月（具体以商务谈判为准）", { x:0.5, y:4.3, w:9, h:0.4, fontSize:11, bold:true, color:C.textDark, align:"center", fontFace:"SimSun" });
}

// ========== 16. 实施路线图 ==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("第9章：实施路线图", { x:0.5, y:0.25, w:9, h:0.55, fontSize:20, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.85, w:9, h:0.04, fill:{color:C.teal}, line:{color:C.teal} });
  const phases = [
    { phase:"阶段1：基础建设", time:"第1~2年", content:"T-Join平台部署\n智能道闸安装\nAI试点（1-2个分区）", color:C.teal, invest:"约0.8~1.5亿" },
    { phase:"阶段2：机器人+道闸", time:"第2~3年", content:"旗晟机器人部署\n道闸全覆盖\nAI算法全量加载", color:C.seafoam, invest:"约0.6~1.0亿" },
    { phase:"阶段3：无人机+协同", time:"第3~4年", content:"大疆无人机上线\nT-Join协同优化\n无人船按需部署", color:C.green, invest:"约0.5~0.8亿" },
    { phase:"阶段4：持续优化", time:"第4年起", content:"AI模型持续改进\n新传感器集成\n东南亚港口扩展", color:C.blue, invest:"约0.2~0.3亿/年" },
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
    { risk:"技术风险：AI准确率可能低于预期", resp:"分阶段部署，先在试点区域验证；KPI不达标免费优化" },
    { risk:"供应链：关键零部件（芯片/传感器）", resp:"提前6个月下单；多源供应策略；淘景协调安全库存" },
    { risk:"实施：项目进度可能延迟", resp:"分阶段部署，最小干扰设计；灵活调配资源" },
    { risk:"安全：网络攻击、数据泄露", resp:"网络分区隔离；端到端加密；定期渗透测试" },
    { risk:"合规：东南亚各国监管差异", resp:"逐国合规评估；聘请当地法律顾问；建立监管联络机制" },
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
    ["服务项目","标准版 SLA","高级版 SLA（推荐）"],
    ["硬件保修","3年","5年（淘景协调各配套供应商）"],
    ["现场支持","7x24响应，72小时到场","7x24响应，4小时到场"],
    ["远程支持","7x24热线，30分钟内响应","7x24优先热线，15分钟内响应"],
    ["系统可用性","99.5%+","99.9%+"],
    ["AI模型更新","每季度1次","每月1次（含新算法部署）"],
    ["备件供应","72小时（本地库存）","48小时（本地+区域中心仓）"],
  ];
  s.addTable(sla, { x:0.5, y:1.0, w:9, colW:[2.5,3.0,3.5], fontSize:9.5, fontFace:"SimSun", border:{pt:1,color:"CCCCCC"} });
  s.addText("培训：系统概述（1天）> 操作培训（3天）> 维护培训（5天）> 高级培训（10天）> 应急演练（每半年1天）", { x:0.5, y:4.3, w:9, h:0.4, fontSize:9.5, color:C.midnight, fontFace:"SimSun", align:"center" });
}

// ========== 19. 术语表 ==========
{
  const s = pres.addSlide();
  addBg(s, "FFFFFF");
  s.addText("附录A：术语表", { x:0.5, y:0.25, w:9, h:0.55, fontSize:20, bold:true, color:C.midnight, fontFace:"Microsoft YaHei" });
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
  s.addText("感谢阅读", { x:0.5, y:1.5, w:9, h:0.8, fontSize:28, bold:true, color:C.textLight, fontFace:"Microsoft YaHei", align:"center" });
  s.addShape(pres.shapes.LINE, { x:2.5, y:2.45, w:5, h:0, line:{color:C.seafoam, width:1.5} });
  s.addText("我们期待与吉宝集团（Keppel Corporation）合作\n共同推进东南亚港口智能化升级", { x:0.5, y:2.6, w:9, h:0.7, fontSize:14, color:"AACCEE", fontFace:"Microsoft YaHei", align:"center" });
  s.addText("总包方：淘景数科 — 业务发展部", { x:0.5, y:3.6, w:9, h:0.35, fontSize:11, color:"D6E4F0", fontFace:"SimSun", align:"center" });
  s.addText("版权所有，未经授权不得复制", { x:0.5, y:4.0, w:9, h:0.3, fontSize:9, color:"888888", fontFace:"SimSun", align:"center" });
  s.addText("Keppel Corporation — Creating solutions for a sustainable future", { x:0.5, y:4.5, w:9, h:0.3, fontSize:9, color:"666666", fontFace:"Arial", align:"center", italic:true });
}

// ========== 保存 ==========
const outPath = '/Users/tom/Desktop/智慧港口AI巡检解决方案_Keppel_V6.pptx';
pres.writeFile({ fileName: outPath })
  .then(() => { console.log('OK: ' + outPath); })
  .catch(e => { console.error('Error:', e.message); process.exit(1); });
