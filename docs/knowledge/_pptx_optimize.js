const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");

const NODE_PATH = "/Users/tom/Library/Application Support/QClaw/npm-global/lib/node_modules";
const Pres = require(`${NODE_PATH}/pptxgenjs`).default || require(`${NODE_PATH}/pptxgenjs`);

// ── helpers ──────────────────────────────────────────────────────────────────
function iconPng(Icon, color = "#FFFFFF", size = 256) {
  const el = React.createElement(Icon, { color, size: String(size) });
  return sharp(Buffer.from(ReactDOMServer.renderToStaticMarkup(el))).png().toBuffer()
    .then(buf => "image/png;base64," + buf.toString("base64"));
}
function iconPng2(Icon, color, size) { return iconPng(Icon, color, size); }

async function iconFa(name, color, size) {
  const { [name]: Icon } = await import(`${NODE_PATH}/react-icons/fa/index.js`).catch(() => ({ [name]: null }));
  if (!Icon) return null;
  return iconPng(Icon, color, size);
}

// ── palette ──────────────────────────────────────────────────────────────────
const C = {
  navy:    "0D2137",   // dark bg / title slides
  blue:    "1A4B8C",   // primary brand
  teal:    "0097A7",   // accent
  teal2:   "00BCD4",   // lighter accent
  light:   "E8F4F8",   // light bg sections
  white:   "FFFFFF",
  text:    "1E2A3A",   // dark body text
  muted:   "64748B",   // secondary text
  gold:    "F5A623",   // highlight number
  card:    "F0F8FC",   // card bg
  border:  "B3D9E8",   // subtle border
};

// ── pres ─────────────────────────────────────────────────────────────────────
let pres = new Pres();
pres.layout = "LAYOUT_16x9";
pres.title  = "AI欠费提醒联合运营合作方案";
pres.author = "奥利奥";

// ─── SLIDE 1: 封面 ─────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.navy };

  // top accent strip
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.06, fill:{color:C.teal2}, line:{color:C.teal2} });

  // left vertical accent bar
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:1.2, w:0.08, h:3.2, fill:{color:C.teal2}, line:{color:C.teal2} });

  // English title
  s.addText("AI DEBT REMINDER", {
    x:0.75, y:1.2, w:8.5, h:0.7,
    fontSize:38, bold:true, color:C.white, fontFace:"Arial Black",
    charSpacing:3, margin:0
  });
  s.addText("COOPERATION PLAN", {
    x:0.75, y:1.82, w:8.5, h:0.55,
    fontSize:26, bold:false, color:C.teal2, fontFace:"Arial",
    charSpacing:2, margin:0
  });

  // Chinese title
  s.addText("AI欠费提醒联合运营合作方案", {
    x:0.75, y:2.55, w:8.5, h:0.72,
    fontSize:30, bold:true, color:C.white, fontFace:"Arial",
    margin:0
  });

  // subtitle line
  s.addShape(pres.shapes.LINE, { x:0.75, y:3.45, w:4, h:0, line:{color:C.teal2, width:1.5} });
  s.addText("中企协 & 淘景数科  ·  2026 STRATEGIC COOPERATION PROPOSAL", {
    x:0.75, y:3.55, w:8, h:0.4,
    fontSize:12, color:"7EC8E3", fontFace:"Arial", margin:0
  });

  // decorative circle (bottom right)
  s.addShape(pres.shapes.OVAL, {
    x:7.5, y:3.5, w:2.8, h:2.8,
    fill:{color:C.teal, transparency:80}, line:{color:C.teal2, width:1.5}
  });
  s.addShape(pres.shapes.OVAL, {
    x:8.2, y:2.8, w:1.8, h:1.8,
    fill:{color:C.blue, transparency:75}, line:{color:C.teal2, width:1}
  });

  // bottom strip
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:5.4, w:10, h:0.225, fill:{color:C.teal2}, line:{color:C.teal2} });
}

// ─── SLIDE 2: 目录 ─────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.white };

  // header band
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.9, fill:{color:C.navy} });
  s.addText("目录  CONTENTS", {
    x:0.5, y:0.18, w:9, h:0.55,
    fontSize:22, bold:true, color:C.white, fontFace:"Arial Black", margin:0
  });

  const items = [
    ["01","淘景数科简介及能力优势","Introduction & Core Competencies"],
    ["02","协会、淘景数科权责划分","Responsibility Division & Duties"],
    ["03","邯郸试点投入测算","Investment Calculation for Handan Pilot"],
    ["04","三种核心合作模式详解","Detailed Explanation of Core Models"],
    ["05","项目实施流程与技术方案","Implementation Process & Technical Plan"],
    ["06","收益分配与合作展望","Revenue Distribution & Future Outlook"],
  ];

  // 3×2 grid
  const colX = [0.4, 3.55, 6.7];
  const rowY = [1.15, 3.35];
  items.forEach(([num, zh, en], i) => {
    const cx = colX[i % 3];
    const ry = rowY[Math.floor(i / 3)];

    // card
    s.addShape(pres.shapes.RECTANGLE, {
      x:cx, y:ry, w:2.95, h:2.0,
      fill:{color:C.card}, line:{color:C.border, width:1},
      shadow:{type:"outer", blur:8, offset:3, angle:135, color:"000000", opacity:0.1}
    });
    // left accent bar
    s.addShape(pres.shapes.RECTANGLE, {
      x:cx, y:ry, w:0.07, h:2.0, fill:{color:C.teal2}, line:{color:C.teal2}
    });
    // number
    s.addText(num, {
      x:cx+0.18, y:ry+0.15, w:1, h:0.65,
      fontSize:40, bold:true, color:C.teal2, fontFace:"Arial Black", margin:0
    });
    // Chinese
    s.addText(zh, {
      x:cx+0.18, y:ry+0.85, w:2.6, h:0.5,
      fontSize:13, bold:true, color:C.text, fontFace:"Arial", margin:0
    });
    // English
    s.addText(en, {
      x:cx+0.18, y:ry+1.35, w:2.6, h:0.45,
      fontSize:9, color:C.muted, fontFace:"Arial", margin:0
    });
  });

  // bottom bar
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:5.45, w:10, h:0.175, fill:{color:C.navy} });
}

// ─── SLIDE 3: 分隔页 01 ────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.navy };

  // big number
  s.addText("01", {
    x:-0.2, y:0.8, w:4, h:3.5,
    fontSize:160, bold:true, color:C.teal2, fontFace:"Arial Black", margin:0,
    transparency:30
  });

  // title
  s.addText("淘景数科简介及能力优势", {
    x:0.6, y:2.0, w:8, h:0.8,
    fontSize:32, bold:true, color:C.white, fontFace:"Arial", margin:0
  });
  s.addText("COMPANY PROFILE & CORE ADVANTAGES", {
    x:0.6, y:2.85, w:8, h:0.45,
    fontSize:14, color:C.teal2, fontFace:"Arial", charSpacing:2, margin:0
  });

  // accent bar
  s.addShape(pres.shapes.RECTANGLE, { x:0.6, y:3.45, w:3, h:0.06, fill:{color:C.teal2}, line:{color:C.teal2} });

  // subtitle
  s.addText("聚焦AIoT核心技术研发，致力于为企业提供全链路数字化转型解决方案", {
    x:0.6, y:3.65, w:7.5, h:0.5,
    fontSize:13, color:"7EC8E3", fontFace:"Arial", margin:0
  });

  // decorative circles
  s.addShape(pres.shapes.OVAL, { x:7.8, y:0.5, w:2.5, h:2.5, fill:{color:C.teal, transparency:85}, line:{color:C.teal2, width:1} });
  s.addShape(pres.shapes.OVAL, { x:8.5, y:1.5, w:1.8, h:1.8, fill:{color:C.blue, transparency:80}, line:{color:C.teal2, width:1} });

  // bottom strip
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:5.4, w:10, h:0.225, fill:{color:C.teal2} });
}

// ─── SLIDE 4: 公司简介 ─────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.white };

  // header
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.9, fill:{color:C.navy} });
  s.addText("公司简介", {
    x:0.5, y:0.18, w:5, h:0.55,
    fontSize:22, bold:true, color:C.white, fontFace:"Arial Black", margin:0
  });
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0.9, w:10, h:0.05, fill:{color:C.teal2}, line:{color:C.teal2} });

  const cards = [
    {
      icon:"🤖", label:"专注AI", zh:"企业数字化转型",
      desc:"专注于人工智能技术在企业服务领域的创新应用，利用前沿AI技术为传统行业数字化转型提供核心动力。"
    },
    {
      icon:"🧠", label:"顶尖团队", zh:"深厚技术积淀",
      desc:"汇聚来自顶尖科技公司的算法工程师与数据科学家，拥有深厚的技术积累和丰富的AI项目落地实战经验。"
    },
    {
      icon:"💡", label:"核心使命", zh:"创造实际价值",
      desc:"坚持「用AI赋能行业」的核心使命，致力于为客户创造看得见的商业价值与效率提升。"
    },
  ];

  cards.forEach((c, i) => {
    const x = 0.4 + i * 3.15;
    // card bg
    s.addShape(pres.shapes.RECTANGLE, {
      x, y:1.15, w:3.0, h:4.0,
      fill:{color:C.card}, line:{color:C.border, width:1},
      shadow:{type:"outer", blur:8, offset:3, angle:135, color:"000000", opacity:0.1}
    });
    // top accent
    s.addShape(pres.shapes.RECTANGLE, { x, y:1.15, w:3.0, h:0.08, fill:{color:C.teal2}, line:{color:C.teal2} });
    // icon circle
    s.addShape(pres.shapes.OVAL, { x:x+1.0, y:1.4, w:1.0, h:1.0, fill:{color:C.teal2}, line:{color:C.teal2} });
    s.addText(c.icon, { x:x+1.0, y:1.52, w:1.0, h:0.78, fontSize:30, align:"center", valign:"middle", margin:0 });
    // label
    s.addText(c.label, {
      x:x+0.15, y:2.55, w:2.7, h:0.4,
      fontSize:16, bold:true, color:C.text, align:"center", fontFace:"Arial", margin:0
    });
    s.addText(c.zh, {
      x:x+0.15, y:2.95, w:2.7, h:0.35,
      fontSize:13, color:C.teal2, align:"center", fontFace:"Arial", margin:0
    });
    // divider
    s.addShape(pres.shapes.LINE, { x:x+0.5, y:3.4, w:2.0, h:0, line:{color:C.border, width:1} });
    // desc
    s.addText(c.desc, {
      x:x+0.15, y:3.55, w:2.7, h:1.5,
      fontSize:11, color:C.muted, fontFace:"Arial", margin:0, valign:"top"
    });
  });

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:5.45, w:10, h:0.175, fill:{color:C.navy} });
}

// ─── SLIDE 5: 核心技术能力 ─────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.light };

  // header
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.9, fill:{color:C.navy} });
  s.addText("核心技术能力", {
    x:0.5, y:0.18, w:5, h:0.55,
    fontSize:22, bold:true, color:C.white, fontFace:"Arial Black", margin:0
  });
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0.9, w:10, h:0.05, fill:{color:C.teal2}, line:{color:C.teal2} });

  const caps = [
    { icon:"🧠", title:"AI大模型应用能力", desc:"基于最新大模型技术，构建拟人化、有温度的智能对话系统。" },
    { icon:"🔗", title:"全链路数据集成与处理", desc:"构建稳定可靠的数据流转链路，确保数据实时、准确、安全。" },
    { icon:"⚙️",  title:"智能决策与策略优化", desc:"通过机器学习持续优化呼叫策略、用户分层模型和话术模板。" },
    { icon:"📊", title:"可视化运营与监控中心", desc:"开发功能强大的可视化监控中心，实现「一屏观全局」的高效管理。" },
  ];

  // 2×2 grid
  caps.forEach((c, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.4 + col * 4.8;
    const y = 1.1 + row * 2.2;

    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w:4.6, h:1.95,
      fill:{color:C.white}, line:{color:C.border, width:1},
      shadow:{type:"outer", blur:8, offset:3, angle:135, color:"000000", opacity:0.1}
    });
    // left accent
    s.addShape(pres.shapes.RECTANGLE, { x, y, w:0.07, h:1.95, fill:{color:C.teal2}, line:{color:C.teal2} });
    // icon
    s.addShape(pres.shapes.OVAL, { x:x+0.2, y:y+0.2, w:0.8, h:0.8, fill:{color:C.teal2}, line:{color:C.teal2} });
    s.addText(c.icon, { x:x+0.2, y:y+0.28, w:0.8, h:0.64, fontSize:24, align:"center", valign:"middle", margin:0 });
    // title
    s.addText(c.title, {
      x:x+1.15, y:y+0.25, w:3.3, h:0.45,
      fontSize:15, bold:true, color:C.text, fontFace:"Arial", margin:0
    });
    // desc
    s.addText(c.desc, {
      x:x+0.2, y:y+1.1, w:4.2, h:0.7,
      fontSize:11.5, color:C.muted, fontFace:"Arial", margin:0
    });
  });

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:5.45, w:10, h:0.175, fill:{color:C.navy} });
}

// ─── SLIDE 6: 运营布局 ─────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.white };

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.9, fill:{color:C.navy} });
  s.addText("公司简介：运营布局", {
    x:0.5, y:0.18, w:5, h:0.55,
    fontSize:22, bold:true, color:C.white, fontFace:"Arial Black", margin:0
  });
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0.9, w:10, h:0.05, fill:{color:C.teal2}, line:{color:C.teal2} });

  // central stat
  s.addShape(pres.shapes.RECTANGLE, {
    x:3.5, y:1.2, w:3.0, h:2.0,
    fill:{color:C.teal2}, line:{color:C.teal2},
    shadow:{type:"outer", blur:10, offset:4, angle:135, color:"000000", opacity:0.15}
  });
  s.addText("15+", {
    x:3.5, y:1.3, w:3.0, h:1.3,
    fontSize:72, bold:true, color:C.white, align:"center", valign:"middle",
    fontFace:"Arial Black", margin:0
  });
  s.addText("省级运营商服务", {
    x:3.5, y:2.55, w:3.0, h:0.5,
    fontSize:14, bold:true, color:C.white, align:"center", fontFace:"Arial", margin:0
  });

  // surrounding cards
  const tags = ["运营商欠费提醒", "AI大模型应用", "数据集成平台", "可视化监控", "智能策略优化"];
  const angleStep = (2 * Math.PI) / tags.length;
  tags.forEach((tag, i) => {
    const angle = -Math.PI/2 + i * angleStep;
    const cx = 5.0 + 3.2 * Math.cos(angle);
    const cy = 2.7 + 2.2 * Math.sin(angle);
    const bx = cx - 1.1, by = cy - 0.38;
    s.addShape(pres.shapes.RECTANGLE, {
      x:bx, y:by, w:2.2, h:0.76,
      fill:{color:C.card}, line:{color:C.border, width:1},
      shadow:{type:"outer", blur:6, offset:2, angle:135, color:"000000", opacity:0.1}
    });
    s.addText(tag, {
      x:bx, y:by, w:2.2, h:0.76,
      fontSize:11, bold:true, color:C.text, align:"center", valign:"middle",
      fontFace:"Arial", margin:0
    });
    // connecting line
    s.addShape(pres.shapes.LINE, {
      x:5.0, y:2.7, w: cx-5.0, h: cy-2.7,
      line:{color:C.teal2, width:1.5, dashType:"dash"}
    });
  });

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:5.45, w:10, h:0.175, fill:{color:C.navy} });
}

// ─── SLIDE 7: 专注运营商数据服务 ───────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.navy };

  // large bg text
  s.addText("15+", {
    x:-0.5, y:0.3, w:5, h:4,
    fontSize:200, bold:true, color:C.teal2, fontFace:"Arial Black", margin:0,
    transparency:80
  });

  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:1.0, w:5.5, h:0.06, fill:{color:C.teal2}, line:{color:C.teal2} });

  s.addText("专注运营商数据服务", {
    x:0.5, y:1.2, w:9, h:0.8,
    fontSize:36, bold:true, color:C.white, fontFace:"Arial", margin:0
  });
  s.addText("服务15+省级运营商", {
    x:0.5, y:2.1, w:9, h:0.55,
    fontSize:20, color:C.teal2, fontFace:"Arial", margin:0
  });

  // highlight cards
  const highlights = [
    "AI欠费提醒系统","全生命周期服务","可视化运营监控","多渠道智能触达"
  ];
  highlights.forEach((h, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x:0.5 + i * 2.35, y:3.0, w:2.2, h:0.8,
      fill:{color:C.teal, transparency:50}, line:{color:C.teal2, width:1}
    });
    s.addText(h, {
      x:0.5 + i * 2.35, y:3.0, w:2.2, h:0.8,
      fontSize:12, bold:true, color:C.white, align:"center", valign:"middle",
      fontFace:"Arial", margin:0
    });
  });

  // circles
  s.addShape(pres.shapes.OVAL, { x:7.5, y:0.5, w:3, h:3, fill:{color:C.teal, transparency:85}, line:{color:C.teal2, width:1.5} });
  s.addShape(pres.shapes.OVAL, { x:8.3, y:2.0, w:1.8, h:1.8, fill:{color:C.blue, transparency:80}, line:{color:C.teal2, width:1} });

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:5.4, w:10, h:0.225, fill:{color:C.teal2} });
}

// ─── SLIDE 8: 产品与服务优势 ───────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.white };

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.9, fill:{color:C.navy} });
  s.addText("项目相关产品与服务优势", {
    x:0.5, y:0.18, w:6, h:0.55,
    fontSize:22, bold:true, color:C.white, fontFace:"Arial Black", margin:0
  });
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0.9, w:10, h:0.05, fill:{color:C.teal2}, line:{color:C.teal2} });

  // left card - AI智能欠费提醒系统
  s.addShape(pres.shapes.RECTANGLE, {
    x:0.35, y:1.1, w:4.55, h:4.2,
    fill:{color:C.card}, line:{color:C.border, width:1},
    shadow:{type:"outer", blur:8, offset:3, angle:135, color:"000000", opacity:0.1}
  });
  s.addShape(pres.shapes.RECTANGLE, { x:0.35, y:1.1, w:4.55, h:0.08, fill:{color:C.teal2}, line:{color:C.teal2} });
  s.addShape(pres.shapes.OVAL, { x:0.55, y:1.3, w:0.75, h:0.75, fill:{color:C.teal2}, line:{color:C.teal2} });
  s.addText("🤖", { x:0.55, y:1.38, w:0.75, h:0.6, fontSize:24, align:"center", valign:"middle", margin:0 });
  s.addText("AI智能欠费提醒系统", {
    x:1.45, y:1.38, w:3.3, h:0.45,
    fontSize:15, bold:true, color:C.text, fontFace:"Arial", margin:0
  });
  s.addText("专为通信行业设计的智能化解决方案，核心优势包含：", {
    x:0.5, y:2.2, w:4.2, h:0.35,
    fontSize:11, color:C.muted, fontFace:"Arial", margin:0
  });
  const leftItems = [
    "千万级用户的高并发数据处理能力",
    "严格的行业合规性与数据安全保障",
    "短信、APP、语音等多渠道智能触达与分层管理",
  ];
  leftItems.forEach((item, i) => {
    s.addShape(pres.shapes.RECTANGLE, { x:0.55, y:2.65+i*0.85, w:0.06, h:0.55, fill:{color:C.teal2}, line:{color:C.teal2} });
    s.addText(item, {
      x:0.75, y:2.65+i*0.85, w:4.0, h:0.65,
      fontSize:12, color:C.text, fontFace:"Arial", valign:"middle", margin:0
    });
  });

  // right card - 一站式全生命周期服务
  s.addShape(pres.shapes.RECTANGLE, {
    x:5.1, y:1.1, w:4.55, h:4.2,
    fill:{color:C.card}, line:{color:C.border, width:1},
    shadow:{type:"outer", blur:8, offset:3, angle:135, color:"000000", opacity:0.1}
  });
  s.addShape(pres.shapes.RECTANGLE, { x:5.1, y:1.1, w:4.55, h:0.08, fill:{color:C.blue}, line:{color:C.blue} });
  s.addShape(pres.shapes.OVAL, { x:5.3, y:1.3, w:0.75, h:0.75, fill:{color:C.blue}, line:{color:C.blue} });
  s.addText("🔄", { x:5.3, y:1.38, w:0.75, h:0.6, fontSize:24, align:"center", valign:"middle", margin:0 });
  s.addText("一站式全生命周期服务", {
    x:6.2, y:1.38, w:3.3, h:0.45,
    fontSize:15, bold:true, color:C.text, fontFace:"Arial", margin:0
  });
  s.addText("提供从项目启动到稳定运营的全流程技术支撑：", {
    x:5.25, y:2.2, w:4.2, h:0.35,
    fontSize:11, color:C.muted, fontFace:"Arial", margin:0
  });
  const phases = [
    { phase:"前期", text:"业务咨询与定制化解决方案设计" },
    { phase:"中期", text:"系统敏捷开发、环境部署与上线实施" },
    { phase:"后期", text:"7x24小时运维监控与持续迭代优化" },
  ];
  phases.forEach((p, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x:5.3, y:2.65+i*0.85, w:0.7, h:0.55,
      fill:{color:C.blue}, line:{color:C.blue}
    });
    s.addText(p.phase, {
      x:5.3, y:2.65+i*0.85, w:0.7, h:0.55,
      fontSize:11, bold:true, color:C.white, align:"center", valign:"middle",
      fontFace:"Arial", margin:0
    });
    s.addText(p.text, {
      x:6.15, y:2.65+i*0.85, w:3.3, h:0.65,
      fontSize:12, color:C.text, fontFace:"Arial", valign:"middle", margin:0
    });
  });

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:5.45, w:10, h:0.175, fill:{color:C.navy} });
}

// ─── SLIDE 9: 运营示意图 ───────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.light };

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.9, fill:{color:C.navy} });
  s.addText("AI欠费提醒运营示意图", {
    x:0.5, y:0.18, w:5, h:0.55,
    fontSize:22, bold:true, color:C.white, fontFace:"Arial Black", margin:0
  });
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0.9, w:10, h:0.05, fill:{color:C.teal2}, line:{color:C.teal2} });

  const flow = [
    { label:"用户欠费数据", sub:"CRM/计费系统", color:C.muted },
    { label:"AI欠费提醒平台", sub:"数据处理 & 分层", color:C.teal2 },
    { label:"智能触达", sub:"短信/APP/语音", color:C.blue },
    { label:"用户反馈", sub:"缴费 / 再提醒", color:C.teal2 },
    { label:"缴费成功", sub:"全链路闭环", color:"2E7D32" },
  ];

  flow.forEach((f, i) => {
    const cx = 0.7 + i * 1.9;
    // box
    s.addShape(pres.shapes.RECTANGLE, {
      x:cx, y:2.1, w:1.65, h:1.7,
      fill:{color:f.color}, line:{color:f.color},
      shadow:{type:"outer", blur:8, offset:3, angle:135, color:"000000", opacity:0.12}
    });
    s.addText(f.label, {
      x:cx, y:2.25, w:1.65, h:0.85,
      fontSize:13, bold:true, color:C.white, align:"center", valign:"middle",
      fontFace:"Arial", margin:0
    });
    s.addText(f.sub, {
      x:cx, y:3.05, w:1.65, h:0.6,
      fontSize:10, color:"E0F2F1", align:"center", valign:"middle",
      fontFace:"Arial", margin:0
    });
    // arrow
    if (i < flow.length - 1) {
      s.addText("→", {
        x:cx+1.55, y:2.6, w:0.45, h:0.7,
        fontSize:22, color:C.navy, align:"center", valign:"middle", margin:0
      });
    }
  });

  // bottom note
  s.addText("覆盖短信 / APP推送 / 语音呼叫多渠道，实现用户全触达、全追踪、全闭环", {
    x:0.5, y:4.1, w:9, h:0.5,
    fontSize:12, color:C.muted, align:"center", fontFace:"Arial", margin:0
  });

  // monitoring row
  const monitors = [
    { label:"实时监控", icon:"📊" },
    { label:"数据大屏", icon:"🖥️" },
    { label:"策略优化", icon:"⚙️" },
    { label:"合规保障", icon:"🛡️" },
  ];
  monitors.forEach((m, i) => {
    const cx = 1.2 + i * 2.15;
    s.addShape(pres.shapes.RECTANGLE, {
      x:cx, y:4.7, w:1.9, h:0.65,
      fill:{color:C.card}, line:{color:C.border, width:1}
    });
    s.addText(m.icon + "  " + m.label, {
      x:cx, y:4.7, w:1.9, h:0.65,
      fontSize:12, color:C.text, align:"center", valign:"middle",
      fontFace:"Arial", margin:0
    });
  });

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:5.45, w:10, h:0.175, fill:{color:C.navy} });
}

// ─── SLIDE 10: 分隔页 02 ────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.navy };

  s.addText("02", {
    x:-0.2, y:0.8, w:4, h:3.5,
    fontSize:160, bold:true, color:C.teal2, fontFace:"Arial Black", margin:0,
    transparency:30
  });
  s.addText("中企协、淘景数科权责划分", {
    x:0.6, y:2.0, w:8, h:0.8,
    fontSize:30, bold:true, color:C.white, fontFace:"Arial", margin:0
  });
  s.addText("COOPERATION & DIVISION OF LABOR", {
    x:0.6, y:2.85, w:8, h:0.45,
    fontSize:14, color:C.teal2, fontFace:"Arial", charSpacing:2, margin:0
  });
  s.addShape(pres.shapes.RECTANGLE, { x:0.6, y:3.45, w:3, h:0.06, fill:{color:C.teal2}, line:{color:C.teal2} });

  s.addShape(pres.shapes.OVAL, { x:7.8, y:0.5, w:2.5, h:2.5, fill:{color:C.teal, transparency:85}, line:{color:C.teal2, width:1} });
  s.addShape(pres.shapes.OVAL, { x:8.5, y:1.5, w:1.8, h:1.8, fill:{color:C.blue, transparency:80}, line:{color:C.teal2, width:1} });

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:5.4, w:10, h:0.225, fill:{color:C.teal2} });
}

// ─── SLIDE 11: 权责划分 ─────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.white };

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.9, fill:{color:C.navy} });
  s.addText("协会、淘景数科权责划分", {
    x:0.5, y:0.18, w:5, h:0.55,
    fontSize:22, bold:true, color:C.white, fontFace:"Arial Black", margin:0
  });
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0.9, w:10, h:0.05, fill:{color:C.teal2}, line:{color:C.teal2} });

  // left col - 协会
  s.addShape(pres.shapes.RECTANGLE, {
    x:0.35, y:1.1, w:4.55, h:4.2,
    fill:{color:C.card}, line:{color:C.border, width:1},
    shadow:{type:"outer", blur:8, offset:3, angle:135, color:"000000", opacity:0.1}
  });
  s.addShape(pres.shapes.RECTANGLE, { x:0.35, y:1.1, w:4.55, h:0.6, fill:{color:C.teal2}, line:{color:C.teal2} });
  s.addText("🏛️  协会核心权责", {
    x:0.35, y:1.1, w:4.55, h:0.6,
    fontSize:15, bold:true, color:C.white, align:"center", valign:"middle",
    fontFace:"Arial", margin:0
  });

  const leftItems = [
    { title:"战略与统筹", desc:"负责项目整体协调，把控商务合作与合规性建设。" },
    { title:"运营与管理", desc:"监督项目执行质量，主导重大运营决策的制定。" },
    { title:"收益与监督", desc:"享有项目收益分成，全程监督财务收支流程。" },
  ];
  leftItems.forEach((item, i) => {
    const y = 1.85 + i * 1.15;
    s.addShape(pres.shapes.RECTANGLE, {
      x:0.5, y, w:4.2, h:1.0,
      fill:{color:C.white}, line:{color:C.border, width:1}
    });
    s.addShape(pres.shapes.RECTANGLE, { x:0.5, y, w:0.06, h:1.0, fill:{color:C.teal2}, line:{color:C.teal2} });
    s.addText(item.title, { x:0.7, y:y+0.08, w:3.9, h:0.38, fontSize:13, bold:true, color:C.text, fontFace:"Arial", margin:0 });
    s.addText(item.desc, { x:0.7, y:y+0.48, w:3.9, h:0.45, fontSize:11, color:C.muted, fontFace:"Arial", margin:0 });
  });

  // right col - 淘景
  s.addShape(pres.shapes.RECTANGLE, {
    x:5.1, y:1.1, w:4.55, h:4.2,
    fill:{color:C.card}, line:{color:C.border, width:1},
    shadow:{type:"outer", blur:8, offset:3, angle:135, color:"000000", opacity:0.1}
  });
  s.addShape(pres.shapes.RECTANGLE, { x:5.1, y:1.1, w:4.55, h:0.6, fill:{color:C.blue}, line:{color:C.blue} });
  s.addText("🖥️  淘景数科核心权责", {
    x:5.1, y:1.1, w:4.55, h:0.6,
    fontSize:15, bold:true, color:C.white, align:"center", valign:"middle",
    fontFace:"Arial", margin:0
  });

  const rightItems = [
    { title:"技术与开发", desc:"负责系统平台开发，AI模型部署及多源数据对接。" },
    { title:"执行与运营", desc:"负责用户智能触达，实时监控效果并持续优化。" },
    { title:"支撑与维护", desc:"提供全方位技术支撑，输出标准财务与运营报表。" },
  ];
  rightItems.forEach((item, i) => {
    const y = 1.85 + i * 1.15;
    s.addShape(pres.shapes.RECTANGLE, {
      x:5.25, y, w:4.2, h:1.0,
      fill:{color:C.white}, line:{color:C.border, width:1}
    });
    s.addShape(pres.shapes.RECTANGLE, { x:5.25, y, w:0.06, h:1.0, fill:{color:C.blue}, line:{color:C.blue} });
    s.addText(item.title, { x:5.45, y:y+0.08, w:3.9, h:0.38, fontSize:13, bold:true, color:C.text, fontFace:"Arial", margin:0 });
    s.addText(item.desc, { x:5.45, y:y+0.48, w:3.9, h:0.45, fontSize:11, color:C.muted, fontFace:"Arial", margin:0 });
  });

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:5.45, w:10, h:0.175, fill:{color:C.navy} });
}

// ─── SLIDE 12: 分隔页 03 ────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.navy };

  s.addText("03", {
    x:-0.2, y:0.8, w:4, h:3.5,
    fontSize:160, bold:true, color:C.teal2, fontFace:"Arial Black", margin:0,
    transparency:30
  });
  s.addText("邯郸试点投入测算", {
    x:0.6, y:2.0, w:8, h:0.8,
    fontSize:32, bold:true, color:C.white, fontFace:"Arial", margin:0
  });
  s.addText("HANDAN PILOT PROJECT INVESTMENT ESTIMATION", {
    x:0.6, y:2.85, w:8, h:0.45,
    fontSize:13, color:C.teal2, fontFace:"Arial", charSpacing:1, margin:0
  });
  s.addShape(pres.shapes.RECTANGLE, { x:0.6, y:3.45, w:3, h:0.06, fill:{color:C.teal2}, line:{color:C.teal2} });
  s.addText("基于项目全生命周期视角，深度解析启动期一次性固定投入与运营期持续投入的精细化成本模型。", {
    x:0.6, y:3.65, w:7.5, h:0.5,
    fontSize:12, color:"7EC8E3", fontFace:"Arial", margin:0
  });

  s.addShape(pres.shapes.OVAL, { x:7.8, y:0.5, w:2.5, h:2.5, fill:{color:C.teal, transparency:85}, line:{color:C.teal2, width:1} });
  s.addShape(pres.shapes.OVAL, { x:8.5, y:1.5, w:1.8, h:1.8, fill:{color:C.blue, transparency:80}, line:{color:C.teal2, width:1} });

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:5.4, w:10, h:0.225, fill:{color:C.teal2} });
}

// ─── SLIDE 13: 投入测算 ─────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.light };

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.9, fill:{color:C.navy} });
  s.addText("前期一次性固定投入", {
    x:0.5, y:0.18, w:5, h:0.55,
    fontSize:22, bold:true, color:C.white, fontFace:"Arial Black", margin:0
  });
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0.9, w:10, h:0.05, fill:{color:C.teal2}, line:{color:C.teal2} });

  // total callout
  s.addShape(pres.shapes.RECTANGLE, {
    x:6.8, y:1.05, w:2.9, h:1.35,
    fill:{color:C.teal2}, line:{color:C.teal2},
    shadow:{type:"outer", blur:10, offset:4, angle:135, color:"000000", opacity:0.15}
  });
  s.addText("60万", {
    x:6.8, y:1.05, w:2.9, h:0.85,
    fontSize:44, bold:true, color:C.white, align:"center", valign:"bottom",
    fontFace:"Arial Black", margin:0
  });
  s.addText("估算总计", {
    x:6.8, y:1.9, w:2.9, h:0.4,
    fontSize:12, color:C.white, align:"center", valign:"top",
    fontFace:"Arial", margin:0
  });

  const items = [
    { num:"01", title:"欠费数据平台", budget:"40万元", desc:"包含数据接口开发、用户分层体系搭建、策略自动化配置等核心功能模块。" },
    { num:"02", title:"协会端管理平台", budget:"8万元",  desc:"为行业协会定制专属管理后台，支持数据审核、会员管理及权限配置。" },
    { num:"03", title:"领导驾驶舱",    budget:"2万元",  desc:"可视化数据监控大屏，实时动态展示项目核心运营指标与健康度分析。" },
    { num:"04", title:"AI呼叫机器人本地化部署", budget:"10万元", desc:"基于邯郸移动提供的本地算力机器，部署AI呼叫机器人，并进行训练。" },
  ];

  items.forEach((item, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.35 + col * 5.1;
    const y = 1.05 + row * 2.05;

    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w:6.35, h:1.8,
      fill:{color:C.white}, line:{color:C.border, width:1},
      shadow:{type:"outer", blur:6, offset:2, angle:135, color:"000000", opacity:0.1}
    });
    s.addShape(pres.shapes.RECTANGLE, { x, y, w:0.06, h:1.8, fill:{color:C.teal2}, line:{color:C.teal2} });

    // num badge
    s.addShape(pres.shapes.OVAL, { x:x+0.18, y:y+0.15, w:0.65, h:0.65, fill:{color:C.teal2}, line:{color:C.teal2} });
    s.addText(item.num, { x:x+0.18, y:y+0.2, w:0.65, h:0.55, fontSize:16, bold:true, color:C.white, align:"center", valign:"middle", fontFace:"Arial", margin:0 });

    // title + budget
    s.addText(item.title, { x:x+0.95, y:y+0.15, w:3.5, h:0.4, fontSize:14, bold:true, color:C.text, fontFace:"Arial", margin:0 });
    s.addText(item.budget, { x:x+4.4, y:y+0.1, w:1.7, h:0.45, fontSize:16, bold:true, color:C.gold, align:"right", fontFace:"Arial", margin:0 });

    // desc
    s.addText(item.desc, { x:x+0.18, y:y+0.9, w:6.0, h:0.75, fontSize:11.5, color:C.muted, fontFace:"Arial", margin:0 });
  });

  // operation note
  s.addShape(pres.shapes.RECTANGLE, {
    x:0.35, y:5.05, w:9.3, h:0.38,
    fill:{color:C.navy}, line:{color:C.navy}
  });
  s.addText("运营期持续投入：人力成本、通信成本（语音/短信）、技术服务费。（项目收益中优先扣除）", {
    x:0.35, y:5.05, w:9.3, h:0.38,
    fontSize:10, color:C.white, align:"center", valign:"middle",
    fontFace:"Arial", margin:0
  });
}

// ─── SLIDE 14: 分隔页 04 ────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.navy };

  s.addText("04", {
    x:-0.2, y:0.8, w:4, h:3.5,
    fontSize:160, bold:true, color:C.teal2, fontFace:"Arial Black", margin:0,
    transparency:30
  });
  s.addText("三种核心合作模式详解", {
    x:0.6, y:2.0, w:8, h:0.8,
    fontSize:30, bold:true, color:C.white, fontFace:"Arial", margin:0
  });
  s.addText("CORE COOPERATION MODELS", {
    x:0.6, y:2.85, w:8, h:0.45,
    fontSize:14, color:C.teal2, fontFace:"Arial", charSpacing:2, margin:0
  });
  s.addShape(pres.shapes.RECTANGLE, { x:0.6, y:3.45, w:3, h:0.06, fill:{color:C.teal2}, line:{color:C.teal2} });

  s.addShape(pres.shapes.OVAL, { x:7.8, y:0.5, w:2.5, h:2.5, fill:{color:C.teal, transparency:85}, line:{color:C.teal2, width:1} });
  s.addShape(pres.shapes.OVAL, { x:8.5, y:1.5, w:1.8, h:1.8, fill:{color:C.blue, transparency:80}, line:{color:C.teal2, width:1} });

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:5.4, w:10, h:0.225, fill:{color:C.teal2} });
}

// ─── SLIDE 15: 三种合作模式 ─────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.white };

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.9, fill:{color:C.navy} });
  s.addText("三种核心合作模式详解", {
    x:0.5, y:0.18, w:5, h:0.55,
    fontSize:22, bold:true, color:C.white, fontFace:"Arial Black", margin:0
  });
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0.9, w:10, h:0.05, fill:{color:C.teal2}, line:{color:C.teal2} });

  const models = [
    {
      num:"模式一", name:"协会主导运营",
      color:C.teal2,
      assoc:"协会职责：深度参与运营管理，统筹协调各方资源与事务推进。",
      taojing:"淘景职责：专注于平台技术架构实现与具体业务的落地执行。",
      share:"30%", badge:"协会分红比例"
    },
    {
      num:"模式二", name:"协会牵头",
      color:C.blue,
      assoc:"协会职责：仅出席必要会议，宏观把控方向，不深度介入运营。协会分红比例：10%-15%。",
      taojing:"淘景职责：全权承担平台所有技术开发、运维及整体运营工作。",
      share:"10-15%", badge:"协会分红比例",
      extra:"三方协作：引入国内领先AI智能体技术企业（杭州一知智能）提供全栈式AI智能体技术支撑，同步扩展通讯线路及短信通道租赁业务。"
    },
  ];

  models.forEach((m, i) => {
    const x = 0.35 + i * 4.8;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y:1.05, w:4.6, h: i===0 ? 3.8 : 4.25,
      fill:{color:C.card}, line:{color:C.border, width:1},
      shadow:{type:"outer", blur:8, offset:3, angle:135, color:"000000", opacity:0.1}
    });
    // top
    s.addShape(pres.shapes.RECTANGLE, { x, y:1.05, w:4.6, h:0.65, fill:{color:m.color}, line:{color:m.color} });
    s.addText(m.num, { x:x+0.15, y:1.1, w:1.2, h:0.55, fontSize:14, bold:true, color:C.white, fontFace:"Arial Black", margin:0 });
    s.addText(m.name, { x:x+1.4, y:1.12, w:3.0, h:0.5, fontSize:14, bold:true, color:C.white, fontFace:"Arial", margin:0 });

    // badge
    s.addShape(pres.shapes.RECTANGLE, {
      x:x+3.0, y:1.7, w:1.4, h:0.55,
      fill:{color:C.gold}, line:{color:C.gold}
    });
    s.addText(m.share, {
      x:x+3.0, y:1.7, w:1.4, h:0.55,
      fontSize:15, bold:true, color:C.white, align:"center", valign:"middle",
      fontFace:"Arial Black", margin:0
    });
    s.addText(m.badge, { x:x+3.0, y:2.28, w:1.4, h:0.3, fontSize:8, color:C.muted, align:"center", fontFace:"Arial", margin:0 });

    // content
    const lines = [
      { icon:"🏛️", text:m.assoc },
      { icon:"🖥️", text:m.taojing },
    ];
    if (m.extra) lines.push({ icon:"🤝", text:m.extra });

    lines.forEach((l, j) => {
      const y = 1.85 + j * (i===0 ? 0.9 : 0.8);
      s.addText(l.icon, { x:x+0.15, y:y, w:0.35, h:0.5, fontSize:14, margin:0 });
      s.addText(l.text, {
        x:x+0.5, y:y, w:3.9, h: (i===0 ? 0.85 : (j===2 ? 0.95 : 0.75)),
        fontSize:10.5, color:C.text, fontFace:"Arial", margin:0
      });
    });
  });

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:5.45, w:10, h:0.175, fill:{color:C.navy} });
}

// ─── SLIDE 16: 实施流程 ─────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.light };

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.9, fill:{color:C.navy} });
  s.addText("项目实施流程", {
    x:0.5, y:0.18, w:5, h:0.55,
    fontSize:22, bold:true, color:C.white, fontFace:"Arial Black", margin:0
  });
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0.9, w:10, h:0.05, fill:{color:C.teal2}, line:{color:C.teal2} });

  const steps = [
    { phase:"1-2周", title:"项目启动与准备", desc:"成立项目组，签署合作协议，完成开发环境的搭建与配置。" },
    { phase:"4-6周", title:"系统开发与部署", desc:"完成本地端软件、管理平台及驾驶舱开发，部署AI机器人至服务器。" },
    { phase:"2-3周", title:"数据对接与联调", desc:"进行核心数据接口对接、全链路功能联调测试，确保系统运行稳定。" },
    { phase:"持续迭代", title:"试点运行与优化", desc:"启动小范围试点运行，收集用户反馈，持续进行功能迭代与体验优化。" },
  ];

  // timeline bar
  s.addShape(pres.shapes.RECTANGLE, {
    x:0.5, y:2.75, w:9, h:0.08, fill:{color:C.border}, line:{color:C.border}
  });

  steps.forEach((step, i) => {
    const cx = 1.0 + i * 2.2;

    // dot on timeline
    s.addShape(pres.shapes.OVAL, { x:cx+0.4, y:2.6, w:0.38, h:0.38, fill:{color:C.teal2}, line:{color:C.teal2} });

    // card
    s.addShape(pres.shapes.RECTANGLE, {
      x:cx, y:1.1, w:2.0, h:1.35,
      fill:{color:C.white}, line:{color:C.border, width:1},
      shadow:{type:"outer", blur:6, offset:2, angle:135, color:"000000", opacity:0.1}
    });
    s.addShape(pres.shapes.RECTANGLE, { x:cx, y:1.1, w:2.0, h:0.06, fill:{color:C.teal2}, line:{color:C.teal2} });

    s.addText(step.title, {
      x:cx+0.1, y:1.22, w:1.8, h:0.55,
      fontSize:12, bold:true, color:C.text, fontFace:"Arial", margin:0
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x:cx+0.1, y:1.8, w:0.8, h:0.38,
      fill:{color:C.teal2}, line:{color:C.teal2}
    });
    s.addText(step.phase, {
      x:cx+0.1, y:1.8, w:0.8, h:0.38,
      fontSize:9, bold:true, color:C.white, align:"center", valign:"middle",
      fontFace:"Arial", margin:0
    });
    s.addText(step.desc, {
      x:cx, y:2.28, w:2.0, h:0.25,
      fontSize:9, color:C.muted, fontFace:"Arial", margin:0
    });
  });

  // bottom row: arrow flow
  const bottom = [
    { icon:"📋", label:"成立项目组" },
    { icon:"🖥️", label:"平台开发" },
    { icon:"🔗", label:"数据对接" },
    { icon:"📡", label:"试点运行" },
    { icon:"📈", label:"持续优化" },
  ];
  bottom.forEach((b, i) => {
    const x = 0.5 + i * 1.9;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y:3.2, w:1.7, h:1.0,
      fill:{color:C.card}, line:{color:C.border, width:1}
    });
    s.addShape(pres.shapes.RECTANGLE, { x, y:3.2, w:0.05, h:1.0, fill:{color:C.teal2}, line:{color:C.teal2} });
    s.addText(b.icon, { x:x+0.05, y:3.25, w:1.6, h:0.5, fontSize:18, align:"center", margin:0 });
    s.addText(b.label, { x:x+0.05, y:3.7, w:1.6, h:0.45, fontSize:10, color:C.text, align:"center", fontFace:"Arial", margin:0 });
    if (i < bottom.length - 1) {
      s.addText("→", { x:x+1.6, y:3.4, w:0.4, h:0.5, fontSize:16, color:C.teal2, align:"center", margin:0 });
    }
  });

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:5.45, w:10, h:0.175, fill:{color:C.navy} });
}

// ─── SLIDE 17: 收益分配 ─────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.white };

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.9, fill:{color:C.navy} });
  s.addText("收益分配与合作展望", {
    x:0.5, y:0.18, w:5, h:0.55,
    fontSize:22, bold:true, color:C.white, fontFace:"Arial Black", margin:0
  });
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0.9, w:10, h:0.05, fill:{color:C.teal2}, line:{color:C.teal2} });

  // left - 收益分配
  s.addShape(pres.shapes.RECTANGLE, {
    x:0.35, y:1.05, w:4.55, h:4.2,
    fill:{color:C.card}, line:{color:C.border, width:1},
    shadow:{type:"outer", blur:8, offset:3, angle:135, color:"000000", opacity:0.1}
  });
  s.addShape(pres.shapes.RECTANGLE, { x:0.35, y:1.05, w:4.55, h:0.6, fill:{color:C.teal2}, line:{color:C.teal2} });
  s.addText("💰  收益分配核心规则", {
    x:0.35, y:1.05, w:4.55, h:0.6,
    fontSize:14, bold:true, color:C.white, align:"center", valign:"middle",
    fontFace:"Arial", margin:0
  });

  const rules = [
    { label:"成本优先", desc:"扣除通信/运营成本" },
    { label:"比例分成", desc:"净利按约定比例分配" },
  ];
  rules.forEach((r, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x:0.5, y:1.8+i*0.85, w:4.2, h:0.7,
      fill:{color:C.white}, line:{color:C.border, width:1}
    });
    s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:1.8+i*0.85, w:0.06, h:0.7, fill:{color:C.teal2}, line:{color:C.teal2} });
    s.addText(r.label, { x:0.7, y:1.82+i*0.85, w:1.8, h:0.35, fontSize:12, bold:true, color:C.text, fontFace:"Arial", margin:0 });
    s.addText(r.desc, { x:0.7, y:2.15+i*0.85, w:3.9, h:0.3, fontSize:10.5, color:C.muted, fontFace:"Arial", margin:0 });
  });

  // dynamic shares
  s.addText("动态分成比例", {
    x:0.5, y:3.55, w:4.2, h:0.35,
    fontSize:12, bold:true, color:C.text, fontFace:"Arial", margin:0
  });
  const shares = [
    { phase:"试点期", share:"协会 30%", color:C.teal2 },
    { phase:"推广期", share:"建议 40%+", color:C.blue },
  ];
  shares.forEach((sh, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x:0.5+i*2.15, y:3.95, w:2.0, h:1.1,
      fill:{color:sh.color}, line:{color:sh.color}
    });
    s.addText(sh.phase, { x:0.5+i*2.15, y:4.0, w:2.0, h:0.4, fontSize:12, bold:true, color:C.white, align:"center", fontFace:"Arial", margin:0 });
    s.addText(sh.share, { x:0.5+i*2.15, y:4.4, w:2.0, h:0.6, fontSize:18, bold:true, color:C.white, align:"center", valign:"top", fontFace:"Arial Black", margin:0 });
  });

  // right - 合作愿景
  s.addShape(pres.shapes.RECTANGLE, {
    x:5.1, y:1.05, w:4.55, h:4.2,
    fill:{color:C.card}, line:{color:C.border, width:1},
    shadow:{type:"outer", blur:8, offset:3, angle:135, color:"000000", opacity:0.1}
  });
  s.addShape(pres.shapes.RECTANGLE, { x:5.1, y:1.05, w:4.55, h:0.6, fill:{color:C.blue}, line:{color:C.blue} });
  s.addText("🚀  分阶段合作愿景", {
    x:5.1, y:1.05, w:4.55, h:0.6,
    fontSize:14, bold:true, color:C.white, align:"center", valign:"middle",
    fontFace:"Arial", margin:0
  });

  const visions = [
    { phase:"SHORT-TERM", title:"短期目标", desc:"成功验证邯郸试点模式，跑通闭环流程", color:C.teal2 },
    { phase:"MID-TERM",   title:"中期目标", desc:"将成熟经验复制推广，覆盖全省主要地市", color:C.blue },
    { phase:"LONG-TERM", title:"长期愿景", desc:"打造行业标准方案，探索AI深度应用场景", color:"2E7D32" },
  ];
  visions.forEach((v, i) => {
    const y = 1.75 + i * 1.18;
    s.addShape(pres.shapes.RECTANGLE, {
      x:5.25, y, w:4.2, h:1.05,
      fill:{color:C.white}, line:{color:C.border, width:1}
    });
    s.addShape(pres.shapes.RECTANGLE, { x:5.25, y, w:0.06, h:1.05, fill:{color:v.color}, line:{color:v.color} });
    s.addShape(pres.shapes.RECTANGLE, { x:5.4, y:0.1, w:0.85, h:0.32, fill:{color:v.color}, line:{color:v.color} });
    s.addText(v.phase, { x:5.4, y:y+0.1, w:0.85, h:0.32, fontSize:8, bold:true, color:C.white, align:"center", valign:"middle", fontFace:"Arial", margin:0 });
    s.addText(v.title, { x:6.35, y:y+0.08, w:3.0, h:0.35, fontSize:13, bold:true, color:C.text, fontFace:"Arial", margin:0 });
    s.addText(v.desc, { x:5.4, y:y+0.5, w:3.95, h:0.45, fontSize:10.5, color:C.muted, fontFace:"Arial", margin:0 });
  });

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:5.45, w:10, h:0.175, fill:{color:C.navy} });
}

// ─── SLIDE 18: 邯郸移动试点进展 ───────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.light };

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.9, fill:{color:C.navy} });
  s.addText("邯郸移动试点进展", {
    x:0.5, y:0.18, w:5, h:0.55,
    fontSize:22, bold:true, color:C.white, fontFace:"Arial Black", margin:0
  });
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0.9, w:10, h:0.05, fill:{color:C.teal2}, line:{color:C.teal2} });

  const stages = [
    { phase:"项目启动与准备",    weeks:"1-2周", desc:"成立项目组，签署合作协议，完成开发环境的搭建与配置。" },
    { phase:"系统开发与部署",    weeks:"1-2周", desc:"完成本地端软件、管理平台及驾驶舱开发，部署AI机器人至服务器及本地规则适配。" },
    { phase:"数据对接与联调",    weeks:"1-2周", desc:"进行核心数据接口对接、全链路功能联调测试，确保系统运行稳定。" },
    { phase:"试点运行与优化",    weeks:"持续迭代", desc:"小范围试点运行，收集用户反馈，持续进行功能迭代与体验优化。" },
  ];

  // timeline
  s.addShape(pres.shapes.RECTANGLE, {
    x:0.5, y:2.9, w:9, h:0.08, fill:{color:C.border}, line:{color:C.border}
  });

  stages.forEach((st, i) => {
    const cx = 1.0 + i * 2.2;

    s.addShape(pres.shapes.OVAL, { x:cx+0.4, y:2.75, w:0.38, h:0.38, fill:{color:C.teal2}, line:{color:C.teal2} });
    s.addText((i+1).toString(), {
      x:cx+0.4, y:2.75, w:0.38, h:0.38,
      fontSize:12, bold:true, color:C.white, align:"center", valign:"middle",
      fontFace:"Arial", margin:0
    });

    s.addShape(pres.shapes.RECTANGLE, {
      x:cx, y:1.1, w:2.0, h:1.55,
      fill:{color:C.white}, line:{color:C.border, width:1},
      shadow:{type:"outer", blur:6, offset:2, angle:135, color:"000000", opacity:0.1}
    });
    s.addShape(pres.shapes.RECTANGLE, { x:cx, y:1.1, w:2.0, h:0.06, fill:{color:C.teal2}, line:{color:C.teal2} });
    s.addText(st.phase, { x:cx+0.1, y:1.2, w:1.8, h:0.45, fontSize:11, bold:true, color:C.text, fontFace:"Arial", margin:0 });
    s.addShape(pres.shapes.RECTANGLE, { x:cx+0.1, y:1.68, w:0.8, h:0.3, fill:{color:C.teal2}, line:{color:C.teal2} });
    s.addText(st.weeks, { x:cx+0.1, y:1.68, w:0.8, h:0.3, fontSize:9, bold:true, color:C.white, align:"center", valign:"middle", fontFace:"Arial", margin:0 });
    s.addText(st.desc, { x:cx+0.05, y:2.02, w:1.9, h:0.6, fontSize:9, color:C.muted, fontFace:"Arial", margin:0 });
  });

  // status
  s.addShape(pres.shapes.RECTANGLE, {
    x:0.5, y:3.45, w:9, h:1.75,
    fill:{color:C.card}, line:{color:C.border, width:1}
  });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:3.45, w:0.06, h:1.75, fill:{color:C.teal2}, line:{color:C.teal2} });
  s.addText("📍 当前进展：邯郸移动在准备AI服务器及试点用户数据，项目已正式启动", {
    x:0.7, y:3.55, w:8.6, h:0.4, fontSize:12, bold:true, color:C.text, fontFace:"Arial", margin:0
  });
  s.addText("邯郸移动采用分布式架构设计，通过本地化部署实现数据低时延处理，实施过程中采用分阶段推进策略。", {
    x:0.7, y:3.98, w:8.6, h:0.55, fontSize:11, color:C.muted, fontFace:"Arial", margin:0
  });
  s.addText("优势：网络响应速度快、数据安全性高  |  挑战：运维成本较高，需做好合规与投诉管控", {
    x:0.7, y:4.58, w:8.6, h:0.45, fontSize:10.5, color:C.muted, fontFace:"Arial", margin:0
  });

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:5.45, w:10, h:0.175, fill:{color:C.navy} });
}

// ─── SLIDE 19: 部署模式分析 ─────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.white };

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.9, fill:{color:C.navy} });
  s.addText("邯郸移动模式特点分析", {
    x:0.5, y:0.18, w:5, h:0.55,
    fontSize:22, bold:true, color:C.white, fontFace:"Arial Black", margin:0
  });
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0.9, w:10, h:0.05, fill:{color:C.teal2}, line:{color:C.teal2} });

  const sections = [
    {
      num:"02", title:"部署架构与实施方式",
      desc:"邯郸移动采用分布式架构设计，通过本地化部署实现数据低时延处理，实施过程中采用分阶段推进策略。",
      tag:"", tagColor:C.teal2
    },
    {
      num:"03", title:"核心优势与应用场景",
      desc:"该模式具有网络响应速度快、数据安全性高等优势，满足数据安全管理要求。",
      tag:"", tagColor:C.teal2
    },
    {
      num:"04", title:"潜在挑战与改进方向",
      desc:"当前面临运维成本较高、标准不统一，易出现合规风险与投诉风险，若用户越级投诉至省公司，可能导致项目被叫停。",
      tag:"⚠️ 风险", tagColor:"C0392B"
    },
  ];

  sections.forEach((sec, i) => {
    const y = 1.1 + i * 1.45;
    s.addShape(pres.shapes.RECTANGLE, {
      x:0.4, y, w:9.2, h:1.25,
      fill:{color:C.card}, line:{color:C.border, width:1},
      shadow:{type:"outer", blur:6, offset:2, angle:135, color:"000000", opacity:0.1}
    });
    s.addShape(pres.shapes.RECTANGLE, { x:0.4, y, w:0.06, h:1.25, fill:{color:C.teal2}, line:{color:C.teal2} });

    // num circle
    s.addShape(pres.shapes.OVAL, { x:0.6, y:y+0.15, w:0.8, h:0.8, fill:{color:C.teal2}, line:{color:C.teal2} });
    s.addText(sec.num, { x:0.6, y:y+0.22, w:0.8, h:0.65, fontSize:20, bold:true, color:C.white, align:"center", valign:"middle", fontFace:"Arial Black", margin:0 });

    s.addText(sec.title, { x:1.55, y:y+0.12, w:5.5, h:0.42, fontSize:15, bold:true, color:C.text, fontFace:"Arial", margin:0 });
    s.addText(sec.desc, { x:1.55, y:y+0.58, w:7.8, h:0.6, fontSize:11.5, color:C.muted, fontFace:"Arial", margin:0 });

    if (sec.tag) {
      s.addShape(pres.shapes.RECTANGLE, { x:8.2, y:y+0.12, w:1.2, h:0.42, fill:{color:"C0392B"}, line:{color:"C0392B"} });
      s.addText(sec.tag, { x:8.2, y:y+0.12, w:1.2, h:0.42, fontSize:10, bold:true, color:C.white, align:"center", valign:"middle", fontFace:"Arial", margin:0 });
    }
  });

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:5.45, w:10, h:0.175, fill:{color:C.navy} });
}

// ─── SLIDE 20: 后续部署推荐方案 ─────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.light };

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.9, fill:{color:C.navy} });
  s.addText("后续部署推荐方案", {
    x:0.5, y:0.18, w:5, h:0.55,
    fontSize:22, bold:true, color:C.white, fontFace:"Arial Black", margin:0
  });
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0.9, w:10, h:0.05, fill:{color:C.teal2}, line:{color:C.teal2} });

  // left card - 省级统一部署
  s.addShape(pres.shapes.RECTANGLE, {
    x:0.35, y:1.05, w:4.55, h:4.2,
    fill:{color:C.white}, line:{color:C.border, width:1},
    shadow:{type:"outer", blur:8, offset:3, angle:135, color:"000000", opacity:0.1}
  });
  s.addShape(pres.shapes.RECTANGLE, { x:0.35, y:1.05, w:4.55, h:0.65, fill:{color:C.teal2}, line:{color:C.teal2} });
  s.addText("🏗️  部署方式", {
    x:0.35, y:1.05, w:4.55, h:0.65,
    fontSize:15, bold:true, color:C.white, align:"center", valign:"middle",
    fontFace:"Arial", margin:0
  });
  s.addText("由省级运营商统一牵头，集中部署AI欠费提醒全平台系统，统一配置AI模型、呼叫策略等。各地市无需重复建设，本地网有需求时直接开通账号即可。", {
    x:0.5, y:1.85, w:4.2, h:1.0,
    fontSize:11.5, color:C.text, fontFace:"Arial", margin:0
  });

  const advantages = ["✅ 合规稳固，省公司授权背书", "✅ 资源集约，算力与数据全省复用", "✅ 落地快速，本地网一键启用并发呼叫"];
  advantages.forEach((adv, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x:0.5, y:2.95+i*0.7, w:4.2, h:0.6,
      fill:{color:C.card}, line:{color:C.border, width:1}
    });
    s.addText(adv, { x:0.6, y:2.95+i*0.7, w:4.0, h:0.6, fontSize:11.5, color:C.text, valign:"middle", fontFace:"Arial", margin:0 });
  });

  // right card - 实践案例
  s.addShape(pres.shapes.RECTANGLE, {
    x:5.1, y:1.05, w:4.55, h:4.2,
    fill:{color:C.white}, line:{color:C.border, width:1},
    shadow:{type:"outer", blur:8, offset:3, angle:135, color:"000000", opacity:0.1}
  });
  s.addShape(pres.shapes.RECTANGLE, { x:5.1, y:1.05, w:4.55, h:0.65, fill:{color:C.blue}, line:{color:C.blue} });
  s.addText("🏆  实践案例", {
    x:5.1, y:1.05, w:4.55, h:0.65,
    fontSize:15, bold:true, color:C.white, align:"center", valign:"middle",
    fontFace:"Arial", margin:0
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x:5.25, y:1.85, w:4.2, h:2.4,
    fill:{color:C.card}, line:{color:C.border, width:1}
  });
  s.addShape(pres.shapes.RECTANGLE, { x:5.25, y:1.85, w:0.06, h:2.4, fill:{color:C.blue}, line:{color:C.blue} });
  s.addText("浙江国网 & 浙江省公安厅", {
    x:5.4, y:1.95, w:3.9, h:0.45,
    fontSize:14, bold:true, color:C.text, fontFace:"Arial", margin:0
  });
  s.addText("项目成功落地，实现跨区域业务协同与数据安全管控，具备成熟可复制经验。", {
    x:5.4, y:2.42, w:3.9, h:0.85,
    fontSize:11.5, color:C.muted, fontFace:"Arial", margin:0
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x:5.25, y:4.35, w:4.2, h:0.75,
    fill:{color:C.teal2}, line:{color:C.teal2}
  });
  s.addText("📌 可参考此模式推进省级统一部署方案", {
    x:5.35, y:4.35, w:4.0, h:0.75,
    fontSize:11, bold:true, color:C.white, valign:"middle", fontFace:"Arial", margin:0
  });

  s.addShape(pres.shapes.RECTANGLE, { x:0, y:5.45, w:10, h:0.175, fill:{color:C.navy} });
}

// ─── SLIDE 21: 感谢页 ───────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.navy };

  // decorative circles
  s.addShape(pres.shapes.OVAL, { x:-1, y:1, w:5, h:5, fill:{color:C.teal, transparency:88}, line:{color:C.teal2, width:1.5} });
  s.addShape(pres.shapes.OVAL, { x:7, y:0, w:4, h:4, fill:{color:C.blue, transparency:82}, line:{color:C.teal2, width:1} });
  s.addShape(pres.shapes.OVAL, { x:6.5, y:3, w:2.5, h:2.5, fill:{color:C.teal2, transparency:85}, line:{color:C.teal2, width:1} });

  // top accent
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.06, fill:{color:C.teal2}, line:{color:C.teal2} });

  s.addText("感谢聆听", {
    x:0.5, y:1.6, w:9, h:1.1,
    fontSize:56, bold:true, color:C.white, align:"center", fontFace:"Arial Black", margin:0
  });
  s.addShape(pres.shapes.LINE, { x:3, y:2.85, w:4, h:0, line:{color:C.teal2, width:2} });
  s.addText("THANKS FOR LISTENING", {
    x:0.5, y:3.0, w:9, h:0.5,
    fontSize:18, color:C.teal2, align:"center", fontFace:"Arial", charSpacing:4, margin:0
  });
  s.addText("AI欠费提醒联合运营合作方案  ·  中企协 & 淘景数科", {
    x:0.5, y:3.65, w:9, h:0.45,
    fontSize:13, color:"7EC8E3", align:"center", fontFace:"Arial", margin:0
  });

  // bottom strip
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:5.4, w:10, h:0.225, fill:{color:C.teal2} });
}

// ── write ────────────────────────────────────────────────────────────────────
const OUT = "/Users/tom/Desktop/AI欠费提醒联合运营合作方案V2.0.pptx";
pres.writeFile({ fileName: OUT })
  .then(() => console.log("✅ Written:", OUT))
  .catch(e => { console.error("❌ Error:", e.message); process.exit(1); });
