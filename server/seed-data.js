#!/usr/bin/env node
/**
 * 种子数据生成器 — 模拟9角色真实使用流程
 * 
 * 角色：
 * 1. 超级管理员 — 系统配置、角色分配
 * 2. 易经大师 — 排盘分析、案例提交
 * 3. 中医医生 — 病例诊断、报告审核
 * 4. 病患 — 提交症状、查看报告
 * 5. 普通会员 — 排盘、知识库浏览
 * 6. VIP会员 — 深度分析、专属内容
 * 7. 商家 — 商品上架、订单管理
 * 8. 内容编辑 — 课程发布、知识库维护
 * 9. 访客 — 浏览、试用
 * 
 * 流程驱动：
 * - 病患提交症状 → 大师分析 → 医生诊断 → 推送报告
 * - 会员排盘 → 保存记录 → 反馈评分
 * - 商家上架商品 → 会员下单 → 积分奖励
 */
const { DatabaseSync } = require('node:sqlite');
const sec = require('./security-v2.js');
const crypto = require('crypto');

const db = new DatabaseSync('server/database/yidao.db');
const now = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
const daysAgo = (d) => { let dt = new Date(); dt.setDate(dt.getDate() - d); return dt.toISOString().replace('T', ' ').slice(0, 19); };

function detRand(seed) {
  const h = crypto.createHash('md5').update(String(seed)).digest('hex');
  return parseInt(h.slice(0, 8), 16) / 0xffffffff;
}
function pick(arr, seed) { return arr[Math.floor(detRand(seed) * arr.length)]; }
function id(seed) { return Math.floor(detRand(seed) * 9000) + 1000; }

// ═══════════════════════════════════════════
// 1. 用户 + 角色
// ═══════════════════════════════════════════
console.log('1. 创建用户...');
const users = [
  { phone: '13700000001', name: '李道明', role: 'master',     title: '易经大师' },
  { phone: '13700000002', name: '张医生', role: 'doctor',     title: '中医师' },
  { phone: '13700000003', name: '王病患', role: 'patient',    title: '病患' },
  { phone: '13700000004', name: '赵会员', role: 'free',       title: '普通会员' },
  { phone: '13700000005', name: '钱VIP',  role: 'vip',        title: 'VIP会员' },
  { phone: '13700000006', name: '孙商家', role: 'merchant',   title: '商家' },
  { phone: '13700000007', name: '周编辑', role: 'editor',     title: '内容编辑' },
  { phone: '13700000008', name: '吴访客', role: 'free',       title: '访客' },
  { phone: '13700000009', name: '郑病患', role: 'patient',    title: '病患2' },
];

const userIdMap = {};
for (const u of users) {
  const enc = sec.encrypt(u.phone);
  let existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(enc);
  let uid;
  if (existing) {
    uid = existing.id;
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(u.name, uid);
  } else {
    db.prepare('INSERT INTO users (phone, name) VALUES (?, ?)').run(enc, u.name);
    uid = db.prepare('SELECT id FROM users WHERE phone = ?').get(enc).id;
  }
  db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?, ?)').run(uid, u.role);
  if (u.role === 'vip' || u.role === 'master' || u.role === 'doctor') {
    db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?, ?)').run(uid, 'free');
  }
  userIdMap[u.role] = uid;
  console.log(`  #${uid} ${u.name} [${u.role}]`);
}

// ═══════════════════════════════════════════
// 2. 排盘记录 — 模拟会员排盘
// ═══════════════════════════════════════════
console.log('2. 排盘记录...');
const paipanTypes = ['bazi', 'ziwei', 'qimen', 'meihua', 'liuren', 'liuyao', 'fengshui', 'zeri'];
const paipanNames = ['八字排盘', '紫微斗数', '奇门遁甲', '梅花易数', '大六壬', '六爻占卜', '风水布局', '择日择吉'];
const paipanData = [
  {year:1979,month:6,day:15,hour:17,gender:'male',name:'刘涛'},
  {year:1985,month:3,day:22,hour:8,gender:'female',name:'测试用户A'},
  {year:1990,month:11,day:8,hour:5,gender:'male',name:'测试用户B'},
  {year:1988,month:7,day:16,hour:14,gender:'female',name:'测试用户C'},
  {year:1995,month:2,day:28,hour:21,gender:'male',name:'测试用户D'},
  {year:1982,month:9,day:10,hour:11,gender:'female',name:'测试用户E'},
];

for (let i = 0; i < paipanData.length; i++) {
  const p = paipanData[i];
  const typeIdx = i % paipanTypes.length;
  const uid = i < 3 ? userIdMap.vip : userIdMap.free;
  const chartData = JSON.stringify({
    type: paipanTypes[typeIdx],
    ...p,
    pillars: { year: '己未', month: '庚午', day: '癸丑', hour: '辛酉' },
    wuxing: { gold: 2, wood: 0, water: 1, fire: 1, earth: 4 },
    dayMaster: '癸水',
  });
  db.prepare(`INSERT INTO paipan_records (user_id, type, input_data, result_data, created_at) VALUES (?,?,?,?,?)`)
    .run(uid, paipanTypes[typeIdx], JSON.stringify(p), chartData, daysAgo(i));
}
console.log(`  ${paipanData.length}条排盘记录`);

// ═══════════════════════════════════════════
// 3. 大师案例 — 完整流程：病患提交→大师分析→医生诊断→推送
// ═══════════════════════════════════════════
console.log('3. 大师案例（完整诊疗流程）...');
const caseTemplates = [
  {
    symptoms: '头痛、失眠、口干、心烦易怒',
    constitution: '木火体质，肝气郁结',
    masterAnalysis: '日主癸水生于午月，火旺水弱，肝木受火克伐。大运乙丑湿土扶身，但丑未冲激，情绪波动大。建议疏肝理气、滋阴降火。',
    diagnosis: '肝郁化火证。治法：疏肝清热、养阴安神。方用丹栀逍遥散合酸枣仁汤加减。',
    finalPlan: '1.中药：丹皮10g 栀子6g 柴胡6g 白芍15g 酸枣仁20g 知母10g 茯苓15g 甘草6g\n2.针灸：太冲、行间、神门、三阴交\n3.调养：子时前入睡，忌辛辣',
  },
  {
    symptoms: '腰膝酸软、畏寒怕冷、夜尿频多',
    constitution: '水寒体质，肾阳不足',
    masterAnalysis: '日主丙火生于子月，水旺火灭，肾阳被寒水所困。需调候温阳，补命门之火。',
    diagnosis: '肾阳虚证。治法：温补肾阳、化气行水。方用金匮肾气丸合右归丸加减。',
    finalPlan: '1.中药：附子6g 肉桂3g 熟地20g 山药15g 山茱萸10g 泽泻10g 茯苓15g 丹皮6g\n2.艾灸：关元、命门、肾俞\n3.调养：忌生冷，晨起姜枣茶',
  },
  {
    symptoms: '胃脘胀痛、食欲不振、大便溏稀',
    constitution: '土湿体质，脾虚湿困',
    masterAnalysis: '日主戊土生于辰月，土旺但湿气重，脾失健运。需健脾祛湿、理气和中。',
    diagnosis: '脾虚湿困证。治法：健脾益气、燥湿和胃。方用参苓白术散加减。',
    finalPlan: '1.中药：党参15g 白术15g 茯苓20g 山药20g 薏苡仁30g 砂仁3g 陈皮6g 半夏10g\n2.针灸：中脘、足三里、阴陵泉\n3.调养：忌寒凉，少食多餐',
  },
  {
    symptoms: '咳嗽痰多、胸闷气短、神疲乏力',
    constitution: '金燥体质，肺气不足',
    masterAnalysis: '日主庚金生于寅月，金弱木旺，肺金受克。需补肺益气、化痰止咳。',
    diagnosis: '肺气虚证。治法：补益肺气、化痰止咳。方用玉屏风散合二陈汤加减。',
    finalPlan: '1.中药：黄芪20g 白术15g 防风6g 陈皮6g 半夏10g 茯苓15g 甘草6g\n2.针灸：肺俞、太渊、足三里\n3.调养：晨起深呼吸，忌寒凉',
  },
  {
    symptoms: '心悸失眠、多梦易醒、面色无华',
    constitution: '火虚体质，心血不足',
    masterAnalysis: '日主丁火生于亥月，水旺火弱，心火被克。需温补心阳、养血安神。',
    diagnosis: '心脾两虚证。治法：补益心脾、养血安神。方用归脾汤加减。',
    finalPlan: '1.中药：黄芪15g 党参15g 白术10g 当归10g 龙眼肉10g 酸枣仁20g 远志6g 木香3g\n2.针灸：心俞、神门、三阴交\n3.调养：午时小憩，忌熬夜',
  },
];

for (let i = 0; i < caseTemplates.length; i++) {
  const c = caseTemplates[i];
  const patientId = i % 2 === 0 ? userIdMap.patient : userIdMap.free;
  const masterId = userIdMap.master;
  const doctorId = userIdMap.doctor;
  const status = i < 3 ? 'completed' : (i === 3 ? 'submitted' : 'draft');
  
  const caseUuid = 'case-' + Date.now() + '-' + i;
  db.prepare(`INSERT INTO master_cases 
    (case_uuid, case_number, master_id, patient_id, status, bazi_chart, wuxing_summary,
     symptoms, constitution, master_analysis, analysis_summary, medical_translation,
     doctor_diagnosis, review_status, review_comment, reviewer_id, reviewed_at,
     final_plan, quality_score, is_high_quality, created_at, submitted_at, completed_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    caseUuid, 'MC2026' + String(1000 + i), masterId, patientId, status,
    JSON.stringify({year:1979+i,month:6+i%12,day:15+i%28,hour:17,gender:i%2?'female':'male'}),
    c.constitution, c.symptoms, c.constitution,
    sec.encrypt(c.masterAnalysis), c.masterAnalysis.slice(0, 50),
    c.diagnosis.replace(/^[^。]+。/, ''),
    c.diagnosis, status === 'completed' ? 'approved' : 'pending',
    status === 'completed' ? '诊断准确，方案合理' : null,
    status === 'completed' ? doctorId : null,
    status === 'completed' ? daysAgo(i) : null,
    c.finalPlan,
    status === 'completed' ? 85 + i * 3 : 0,
    status === 'completed' ? 1 : 0,
    daysAgo(i + 5), status !== 'draft' ? daysAgo(i + 3) : null,
    status === 'completed' ? daysAgo(i) : null
  );
  
  // 添加讨论记录
  if (status !== 'draft') {
    db.prepare(`INSERT INTO case_discussions (case_id, author_id, author_role, content, created_at) VALUES (?,?,?,?,?)`)
      .run(i + 4, masterId, 'master', '已查看病例，开始分析。' + c.masterAnalysis.slice(0, 30), daysAgo(i + 4));
    db.prepare(`INSERT INTO case_discussions (case_id, author_id, author_role, content, created_at) VALUES (?,?,?,?,?)`)
      .run(i + 4, doctorId, 'doctor', '同意大师分析思路。' + c.diagnosis.slice(0, 30), daysAgo(i + 3));
  }
  
  // 推送报告给病患
  if (status === 'completed') {
    db.prepare(`INSERT INTO tcm_reports (case_id, patient_id, doctor_id, report_text, filtered_text, pushed_at, read_at) VALUES (?,?,?,?,?,?,?)`)
      .run(i + 4, patientId, doctorId, sec.encrypt(c.finalPlan), c.finalPlan, daysAgo(i), daysAgo(i - 1));
  }
}
console.log(`  ${caseTemplates.length}条案例（3条已完成全流程）`);

// ═══════════════════════════════════════════
// 4. 商品 + 订单
// ═══════════════════════════════════════════
console.log('4. 商品...');
// 产品用 merchants 表存（schema: name,school,type,boss,phone,master,license,cert,split_rate,status,created_at）
// 改为存入 merchants 表
const products = [
  { name: '天然和田玉平安扣', school: '国风好物馆', type: '饰品', price: 299, category: '饰品', stock: 50, desc: '开光加持，平安护身' },
  { name: '沉香手串108颗', school: '国风好物馆', type: '佛珠', price: 599, category: '佛珠', stock: 30, desc: '正品沉香，安神定气' },
  { name: '黄铜罗盘指南针', school: '国风好物馆', type: '工具', price: 158, category: '工具', stock: 100, desc: '风水堪舆专用' },
  { name: '艾草足浴包（30包）', school: '国风好物馆', type: '养生', price: 89, category: '养生', stock: 200, desc: '温经散寒，助眠安神' },
  { name: '紫砂茶杯套装', school: '国风好物馆', type: '茶道', price: 268, category: '茶道', stock: 40, desc: '原矿紫砂，四杯一壶' },
  { name: '八字命理咨询券', school: '国风好物馆', type: '服务', price: 500, category: '服务', stock: 999, desc: '大师一对一命理分析' },
];
// merchants表没有product_name/price/stock列，用name+school+type存
for (let i = 0; i < products.length; i++) {
  const p = products[i];
  db.prepare(`INSERT INTO merchants (name, school, type, boss, phone, master, license, cert, split_rate, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(p.name, p.school, p.type, '孙商家', '13700000006', '', '', '', 0.1, 'approved', daysAgo(i + 2));
}
console.log(`  ${products.length}个商品`);

// 订单
// orders schema: user_id, merchant_id, product_id, product_name, amount, merchant_amount, platform_amount, status, created_at
const orderStatuses = ['pending', 'paid', 'shipped', 'completed', 'completed'];
for (let i = 0; i < 5; i++) {
  const p = products[i % products.length];
  const buyerId = i % 2 === 0 ? userIdMap.vip : userIdMap.free;
  const amount = p.price;
  const merchantAmount = Math.floor(amount * 0.9);
  const platformAmount = amount - merchantAmount;
  db.prepare(`INSERT INTO orders (user_id, merchant_id, product_id, product_name, amount, merchant_amount, platform_amount, status, created_at) VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(buyerId, userIdMap.merchant, i + 1, p.name, amount, merchantAmount, platformAmount, orderStatuses[i], daysAgo(i + 1));
}
console.log(`  5条订单`);

// ═══════════════════════════════════════════
// 5. 课程
// ═══════════════════════════════════════════
console.log('5. 课程...');
// courses schema: master, title, type, url, duration, category, summary, key_points, sort_order, created_at
const courses = [
  { title: '八字入门十讲', teacher: '舒晗老师', price: 0, category: '命理', desc: '从零开始学习八字命理', students: 156 },
  { title: '黄帝内经养生智慧', teacher: '倪海厦老师', price: 99, category: '中医', desc: '解读黄帝内经核心养生理念', students: 89 },
  { title: '伤寒论方证对应', teacher: '倪海厦老师', price: 199, category: '中医', desc: '经方实战应用', students: 67 },
  { title: '风水布局实战课', teacher: '舒晗老师', price: 299, category: '风水', desc: '家居风水调理实操', students: 45 },
  { title: '奇门遁甲初阶', teacher: '舒晗老师', price: 399, category: '术数', desc: '奇门起盘与断局基础', students: 32 },
];
for (let i = 0; i < courses.length; i++) {
  const c = courses[i];
  db.prepare(`INSERT INTO courses (master, title, type, url, duration, category, summary, key_points, sort_order, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(c.teacher, c.title, c.price > 0 ? 'paid' : 'free', '', '60min', c.category, c.desc, c.desc, i + 1, daysAgo(3));
}
console.log(`  ${courses.length}门课程`);

// ═══════════════════════════════════════════
// 6. 反馈
// ═══════════════════════════════════════════
console.log('6. 反馈...');
// feedback schema: user_id, type, target, content, points_awarded, created_at
const feedbacks = [
  { user: userIdMap.vip, type: 'suggestion', content: '希望增加紫微斗数详解功能', reply: '感谢建议，已列入开发计划' },
  { user: userIdMap.patient, type: 'praise', content: '大师分析很准确，调理后失眠明显改善', reply: '感谢认可，祝您健康' },
  { user: userIdMap.free, type: 'bug', content: '排盘页面在手机上显示偏小', reply: '已修复，请更新后查看' },
  { user: userIdMap.vip, type: 'suggestion', content: '能否增加穴位按摩视频教程', reply: '正在筹备中，敬请期待' },
  { user: userIdMap.free, type: 'praise', content: '黄历功能很实用，每天都会看', reply: '谢谢支持！' },
];
for (let i = 0; i < feedbacks.length; i++) {
  const f = feedbacks[i];
  db.prepare(`INSERT INTO feedback (user_id, type, target, content, points_awarded, created_at) VALUES (?,?,?,?,?,?)`)
    .run(f.user, f.type, 'system', f.content, 10, daysAgo(i + 1));
}
console.log(`  ${feedbacks.length}条反馈`);

// ═══════════════════════════════════════════
// 7. 推送日志
// ═══════════════════════════════════════════
console.log('7. 推送日志...');
// push_logs schema: user_id, push_type, push_date, content, delivered, created_at
const pushTypes = ['daily_fortune', 'health_tip', 'festival_reminder', 'case_update'];
const pushContents = [
  '今日宜动土、嫁娶；忌出行、安葬',
  '秋分时节，注意润肺养阴，多食银耳百合',
  '明日中秋佳节，记得与家人团聚',
  '您的诊疗报告已生成，请查看',
  '今日桃花星入命，社交运旺盛',
  '惊蛰养生：疏肝理气，早睡早起',
  '您的排盘结果已保存，点击查看详情',
  '大雪节气，温补肾阳正当时',
];
for (let i = 0; i < pushContents.length; i++) {
  const uid = i % 2 === 0 ? userIdMap.vip : userIdMap.free;
  db.prepare(`INSERT INTO push_logs (user_id, push_type, push_date, content, delivered, created_at) VALUES (?,?,?,?,?,?)`)
    .run(uid, pushTypes[i % pushTypes.length], daysAgo(i), pushContents[i], 1, daysAgo(i));
}
console.log(`  ${pushContents.length}条推送`);

// ═══════════════════════════════════════════
// 8. 积分记录
// ═══════════════════════════════════════════
console.log('8. 积分记录...');
// user_points schema: user_id, total_points, exchanged_points, streak_days, last_feedback_date, created_at
const pointActions = [
  { user: userIdMap.vip, points: 50, action: 'daily_login', desc: '每日登录' },
  { user: userIdMap.vip, points: 100, action: 'paipan', desc: '完成排盘' },
  { user: userIdMap.vip, points: 30, action: 'feedback', desc: '提交反馈' },
  { user: userIdMap.free, points: 50, action: 'daily_login', desc: '每日登录' },
  { user: userIdMap.patient, points: 200, action: 'clinic', desc: '完成诊疗' },
  { user: userIdMap.free, points: 20, action: 'share', desc: '分享内容' },
  { user: userIdMap.vip, points: 50, action: 'daily_login', desc: '每日登录' },
  { user: userIdMap.free, points: 10, action: 'browse', desc: '浏览知识库' },
];
for (let i = 0; i < pointActions.length; i++) {
  const a = pointActions[i];
  // user_points 是按用户汇总的表（不是明细），用 upsert
  db.prepare(`INSERT INTO user_points (user_id, total_points, exchanged_points, streak_days, last_feedback_date, created_at) VALUES (?,?,?,?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET total_points=total_points+?, streak_days=streak_days+1`)
    .run(a.user, a.points, 0, 1, daysAgo(i), daysAgo(i), a.points);
}
console.log(`  ${pointActions.length}条积分`);

// ═══════════════════════════════════════════
// 9. 审计日志
// ═══════════════════════════════════════════
console.log('9. 审计日志...');
const auditActions = [
  { user: 7, action: 'login', detail: '超级管理员登录' },
  { user: userIdMap.master, action: 'case_submit', detail: '提交案例 #MC20261000' },
  { user: userIdMap.doctor, action: 'case_review', detail: '审核案例 #MC20261000' },
  { user: userIdMap.merchant, action: 'product_add', detail: '上架商品：天然和田玉平安扣' },
  { user: 7, action: 'role_assign', detail: '分配角色：master → 李道明' },
  { user: userIdMap.editor, action: 'course_publish', detail: '发布课程：八字入门十讲' },
  { user: userIdMap.vip, action: 'paipan', detail: '八字排盘' },
  { user: userIdMap.patient, action: 'report_view', detail: '查看诊疗报告' },
];
for (let i = 0; i < auditActions.length; i++) {
  const a = auditActions[i];
  db.prepare(`INSERT INTO audit_logs (user_id, action, detail, created_at) VALUES (?,?,?,?)`)
    .run(a.user, a.action, a.detail, daysAgo(i));
}
console.log(`  ${auditActions.length}条审计日志`);

// ═══════════════════════════════════════════
// 10. 系统配置
// ═══════════════════════════════════════════
console.log('10. 系统配置...');
db.prepare(`INSERT OR REPLACE INTO system_config (key, value, updated_at) VALUES (?,?,?)`).run('site_name', '命理宝鉴·易道智鉴', now());
db.prepare(`INSERT OR REPLACE INTO system_config (key, value, updated_at) VALUES (?,?,?)`).run('version', '2.1.0', now());
db.prepare(`INSERT OR REPLACE INTO system_config (key, value, updated_at) VALUES (?,?,?)`).run('last_seed', now(), now());

// ═══════════════════════════════════════════
// 统计
// ═══════════════════════════════════════════
console.log('\n=== 种子数据统计 ===');
const stats = [
  ['users', '用户'], ['user_roles', '角色'], ['paipan_records', '排盘记录'],
  ['master_cases', '大师案例'], ['case_discussions', '案例讨论'],
  ['tcm_reports', '诊疗报告'], ['merchants', '商品'], ['orders', '订单'],
  ['courses', '课程'], ['feedback', '反馈'], ['push_logs', '推送'],
  ['user_points', '积分'], ['audit_logs', '审计日志'],
];
for (const [table, label] of stats) {
  try {
    const c = db.prepare(`SELECT count(*) as c FROM ${table}`).get();
    console.log(`  ${label}: ${c.c}条`);
  } catch (e) { /* skip */ }
}
console.log('\n✅ 种子数据生成完成!');
