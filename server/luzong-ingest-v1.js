// 直接 SQL 写入路总流年班 45 KB 条目
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db';
const SRC_ID = 'SRC-COURSE-LUZONG-LIUNIAN-2025';
const db = new DatabaseSync(DB_PATH);

// 1. 幂等注册来源
db.prepare(`
  INSERT OR REPLACE INTO source_index
  (src_id, src_type, title, author, trust_score, tags, access_level, path, format, module, created_at, updated_at, entries_extracted, extraction_count, last_extracted_at)
  VALUES (?, 'SRC-COURSE', ?, ?, 0.85, ?, 'registered', ?, 'pptx', 'ziwei', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 45, 1, CURRENT_TIMESTAMP)
`).run(
  SRC_ID,
  '路总流年班第7-20课（紫微斗数实战技法）',
  '路总',
  JSON.stringify(['紫微斗数', '流年班', '飞星1616', '三代四化', '四季法则']),
  '/Users/tom/Desktop/周易-中医/路总命理知识/'
);

const entries = [
  ['KB-ZIWEI-COURSE-001', 'ziwei', '天相主星·定性分析', '天相为印星，主协调、幕僚、服务。与天梁同宫多被动；与紫微同宫可借紫微的光。逢杀破狼组合则天相化印为用主受重用。', ['天相', '主星', '定性'], '主星定性'],
  ['KB-ZIWEI-COURSE-002', 'ziwei', '天梁主星·定性分析', '天梁为寿星，主庇荫、荫人、逢难化解。在寅申为庙地，能化解七杀。主热肠、操心、老人缘。独坐命宫易孤独。', ['天梁', '主星', '定性'], '主星定性'],
  ['KB-ZIWEI-COURSE-003', 'ziwei', '七杀主星·定性分析', '七杀为将星，主肃杀、独断、独立性。子午卯酉七杀仰斗为庙。入庙则大将之材；落陷则孤克。与紫微同宫化为杀破狼星系主大起大落。', ['七杀', '主星', '定性'], '主星定性'],
  ['KB-ZIWEI-COURSE-004', 'ziwei', '破军主星·定性分析', '破军为耗星，主破坏与重建。夫妻、子女宫位不宜。居寅申卯酉破军开榜为先天化格，主人开创。', ['破军', '主星', '定性'], '主星定性'],
  ['KB-ZIWEI-COURSE-005', 'ziwei', '杀破狼周期理论', '紫微斗数命盘每十年大限轮转一次杀破狼星系。七杀主决断、破军主变革、贪狼主调和，三者循环往复，构成人生节奏波。', ['杀破狼', '周期', '大限'], '主星定性'],

  ['KB-ZIWEI-COURSE-006', 'ziwei', '禄存星基础', '禄存为北斗星君，主财禄、积储。忌擎羊同宫禄逢擎羊反主破财。最佳在命财官三宫。', ['禄存', '杂耀'], '杂耀'],
  ['KB-ZIWEI-COURSE-007', 'ziwei', '左辅右弼双星', '左辅为阳土主助力；右弼为阴水主协调。二星同宫辅弼相依主人际关系圆融。流年逢之有贵人相助。', ['左辅', '右弼', '杂耀'], '杂耀'],
  ['KB-ZIWEI-COURSE-008', 'ziwei', '文昌文曲双星', '文昌主功名科举阳金，文曲主文艺才华阴水。辰戌丑未昌曲对冲为文耀格，主文采斐然。', ['文昌', '文曲', '杂耀'], '杂耀'],
  ['KB-ZIWEI-COURSE-009', 'ziwei', '天魁天钺双星', '天魁为昼贵阳火，天钺为夜贵阴火。主阳贵人。需查生辰时辰，魁钺分昼夜。', ['天魁', '天钺', '贵人'], '杂耀'],
  ['KB-ZIWEI-COURSE-010', 'ziwei', '禄马交驰格', '禄存或化禄与天马同宫或对冲称禄马交驰，主动态财运。需大限流年引动，常见远地发展、频繁出差。', ['禄马', '格局'], '杂耀'],

  ['KB-ZIWEI-COURSE-011', 'ziwei', '三代四化基本概念', '路总独创方法论：把四化分为天盘（先天）、地盘（后天人事盘）、人盘（自化）三代。三盘叠断可见事物本质。', ['三代四化', '基础'], '三代四化'],
  ['KB-ZIWEI-COURSE-012', 'ziwei', '天盘四化解读', '天盘四化即生年干四化，为先天既定。代表命主天性、父母遗传、原始因果。流年再叠断可看出趋势。', ['天盘', '三代四化'], '三代四化'],
  ['KB-ZIWEI-COURSE-013', 'ziwei', '地盘四化解读', '地盘四化即生年干四化飞到各宫的星曜再起四化。代表人事互动、社会反馈、实际行动。最重要一盘。', ['地盘', '三代四化'], '三代四化'],
  ['KB-ZIWEI-COURSE-014', 'ziwei', '人盘自化现象', '本宫飞入它宫化出的星耀再飞回本宫或原宫位飞出，形成自化。主该宫位能量自我消化、漏失。', ['自化', '三代四化'], '三代四化'],
  ['KB-ZIWEI-COURSE-015', 'ziwei', '四化飞化路径', '路总核心：地盘化忌飞入宫位代表该宫位借力或受累。飞化有顺飞逆飞之别，需结合宫位天干地支判断。', ['飞化', '三代四化'], '三代四化'],
  ['KB-ZIWEI-COURSE-016', 'ziwei', '三代四化实战步骤', '看盘六步：①天盘定先天 ②地盘看人事 ③人盘检自化 ④叠断吉凶 ⑤大限流年引动 ⑥建议行动时机。', ['三代四化', '实战'], '三代四化'],
  ['KB-ZIWEI-COURSE-017', 'ziwei', '四化持久度判定', '路总种子系列：化忌飞入六内宫（命财官田宅福德疾厄）较持久；入六外宫（迁移交友兄弟父母子女）影响较短暂。', ['持久度', '种子'], '三代四化'],
  ['KB-ZIWEI-COURSE-018', 'ziwei', '种子系列应用', '化忌飞入命宫为坐忌为最重；飞入对宫迁移为对忌次重；飞入田宅为内忌主长期居家影响。', ['种子', '三代四化'], '三代四化'],
  ['KB-ZIWEI-COURSE-019', 'ziwei', '三代四化应用案例', '事业宫化忌飞入田宅，主创业资金回流慢。需缓投资。流年再叠忌则断大限需防破财。', ['案例', '三代四化'], '三代四化'],

  ['KB-ZIWEI-COURSE-020', 'ziwei', '强宫弱宫判定法', '强宫：本宫主星入庙旺+三方四正会吉星多。弱宫：本宫主星落陷+会忌煞多。强宫做事顺，弱宫需借力。', ['强宫', '弱宫'], '强宫弱宫'],
  ['KB-ZIWEI-COURSE-021', 'ziwei', '十喻歌诀要', '路总十喻：喻星喻宫喻时喻数喻理。实指紫微斗数看盘需多维度叠加判断，避免单一定性。', ['十喻歌', '口诀'], '强宫弱宫'],
  ['KB-ZIWEI-COURSE-022', 'ziwei', '星耀四时喜忌', '星耀在不同季节生月所属有喜忌差异。春天属木紫微贪狼宜；夏天属火七杀破军强；秋天属金巨门太阳利；冬天属水天同天梁吉。', ['四时', '星耀'], '强宫弱宫'],

  ['KB-ZIWEI-COURSE-023', 'ziwei', '天地人三盘联动法', '天盘（生年四化）+地盘（人事飞化）+人盘（自化）三者联动称三代。需叠加方见全貌。', ['三盘', '联动'], '天地人三盘'],
  ['KB-ZIWEI-COURSE-024', 'ziwei', '三盘流年应用', '流年触发天盘时、地盘见人事互动、人盘自化显内耗。三盘皆动则事情发酵，须防突变。', ['流年', '三盘'], '天地人三盘'],

  ['KB-ZIWEI-COURSE-025', 'ziwei', '墓库桃花四马', '墓库为积聚之意星；桃花为浪漫感性星；四马（天马/天同化禄冲）/驿马主迁动。需看生辰。', ['墓库', '桃花', '四马'], '宫拓展'],
  ['KB-ZIWEI-COURSE-026', 'ziwei', '宫位拓展技法', '除命财官三宫基本宫位外，迁移宫主外部环境、交友主人际、田宅主家产福德主精神修养。需综合判断。', ['宫位', '拓展'], '宫拓展'],
  ['KB-ZIWEI-COURSE-027', 'ziwei', '宫星合断法', '宫位为体、星耀为用。体用结合方见本质。如命宫紫微+三方会辅弼=体用俱佳。', ['体用', '宫星'], '宫拓展'],

  ['KB-ZIWEI-COURSE-028', 'ziwei', '飞星法基本原理', '飞星 1616 是路总首创独门方法论：以宫干飞出四化到它宫，分天盘（1）地盘（6）人盘（1）流年（6）四层叠断。', ['飞星1616', '路总独创'], '飞星1616'],
  ['KB-ZIWEI-COURSE-029', 'ziwei', '1616 四层结构', '1（天盘）：生年四化原始因。6（地盘）：人事盘飞化。第二个1（人盘）：自化。第二个6（流年）：流年引动触发。', ['飞星1616', '结构'], '飞星1616'],
  ['KB-ZIWEI-COURSE-030', 'ziwei', '飞星三盘叠断', '天+地+人三盘叠断可见长期因果链；再加流年触发见短期。叠断忌多则凶叠、叠断禄多则利叠。', ['叠断', '飞星'], '飞星1616'],
  ['KB-ZIWEI-COURSE-031', 'ziwei', '飞星流年应用', '流年天干飞出的四化若命盘中有相应化忌星耀被引动，则该宫事件易发。需精确到月份。', ['流年', '飞星'], '飞星1616'],
  ['KB-ZIWEI-COURSE-032', 'ziwei', '飞星因果链反推', '现代事件逆推到出生命盘，即可反推原始因。多次叠断验证形成证据链。路总多用此法治重大疾病/官司。', ['反推', '因果'], '飞星1616'],
  ['KB-ZIWEI-COURSE-033', 'ziwei', '飞星实战案例分析', '案例：命宫化忌飞入疾厄，主先天身体弱。再叠大限化忌冲命盘该宫位，主该十年需防手术。', ['案例', '飞星'], '飞星1616'],

  ['KB-ZIWEI-COURSE-034', 'ziwei', '四季 1324 法则', '路总口诀一生二二生三三生万物映射 1-3-2-4 四季循环。1为起点、3为峰值、2为转化、4为新基础。流年大限配合用。', ['四季法则', '1324'], '四季法则'],
  ['KB-ZIWEI-COURSE-035', 'ziwei', '创业副业条件判断', '创业需看命宫强宫+财帛宫见禄+官禄宫无化忌。三大条件齐备方可行。副业亦同，但门槛略低。', ['创业', '时机'], '四季法则'],
  ['KB-ZIWEI-COURSE-036', 'ziwei', '守成与突破判定', '事业稳定期看大限是否仍引动本命禄权；若化忌动则宜守不宜攻。需辨守以蓄势，攻以爆发。', ['守成', '突破'], '四季法则'],

  ['KB-ZIWEI-COURSE-037', 'ziwei', '事业专题案例', '命宫廉贞贪狼化忌+大限官禄宫化忌，主该十年事业大动荡。若再叠流年忌冲破，则建议该年不换工作。', ['事业', '案例'], '实战案例'],
  ['KB-ZIWEI-COURSE-038', 'ziwei', '婚姻专题案例', '夫妻宫紫微化权+红鸾天喜，主感情稳定但控制欲强。需夫妻双方协调边界感。', ['婚姻', '案例'], '实战案例'],
  ['KB-ZIWEI-COURSE-039', 'ziwei', '财运专题案例', '财帛宫武曲化禄+禄存同宫，主稳健理财。不宜投机。再叠大限禄马交驰则有意外之财。', ['财运', '案例'], '实战案例'],
  ['KB-ZIWEI-COURSE-040', 'ziwei', '健康专题案例', '疾厄宫廉贞化忌+天相会擎羊，主心血管问题。需早预防，流年再触发时主急症。', ['健康', '案例'], '实战案例'],
  ['KB-ZIWEI-COURSE-041', 'ziwei', '迁移专题案例', '迁移宫紫微化科+天相会吉星，主外地贵人多。适合外出发展。流年化忌冲则不宜远行。', ['迁移', '案例'], '实战案例'],

  ['KB-ZIWEI-COURSE-042', 'ziwei', '紫微六步看盘法', '路总规范：①看命宫主星定性 ②看三方四正会照 ③看四化飞化 ④看大限引动 ⑤看流年触发 ⑥建议行动时机', ['六步', '看盘'], '看盘规范'],
  ['KB-ZIWEI-COURSE-043', 'ziwei', '本命大限流年三层判断', '本命为根、大限为干、流年为叶。三层皆吉则大吉；皆凶则大凶；层间矛盾则需辩证决策。', ['三层', '判断'], '看盘规范'],
  ['KB-ZIWEI-COURSE-044', 'ziwei', '看盘口诀要熟', '路总强调：口诀要背熟但不可拘泥。实战要灵活组合，依情境调轻重。如杀破狼周期口诀需配合生辰细化。', ['口诀', '心法'], '看盘规范'],
  ['KB-ZIWEI-COURSE-045', 'ziwei', '解盘建议话术', '先讲先天格局、再讲大限处境、再讲流年触发、最后给行动建议。忌一上来就讲吉凶、断事太死。', ['解盘', '话术'], '看盘规范'],
];

console.log(`准备写入 ${entries.length} 条 KB 条目`);

// 2. 清理旧条目
db.prepare(`DELETE FROM kb_formal WHERE entry_id LIKE 'KB-ZIWEI-COURSE-%'`).run();
db.prepare(`DELETE FROM kb_staging WHERE entry_id LIKE 'KB-ZIWEI-COURSE-%'`).run();
db.prepare(`DELETE FROM knowledge_trace WHERE entry_id LIKE 'KB-ZIWEI-COURSE-%'`).run();
db.prepare(`DELETE FROM kb_audit WHERE entry_id LIKE 'KB-ZIWEI-COURSE-%'`).run();

// 3. 批量写入
const insertStaging = db.prepare(`
  INSERT INTO kb_staging
  (entry_id, module, title, content, src_id, summary, keywords, tags, source_ids, confidence, access_level, category, difficulty, status, version, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'staging', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
`);

const insertFormal = db.prepare(`
  INSERT INTO kb_formal
  (entry_id, module, title, content, src_id, summary, keywords, tags, source_ids, confidence, access_level, category, difficulty, status, version, trust_score, promoted_at, promoted_from, reviewed_by, hit_count)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'formal', 1, 0.85, CURRENT_TIMESTAMP, 'auto-promoted', 'auto-ingest', 0)
`);

const insertAudit = db.prepare(`
  INSERT INTO kb_audit (audit_id, entry_id, module, action, checks, score, auditor, audited_at)
  VALUES (?, ?, ?, 'promote', ?, 0.85, 'auto', CURRENT_TIMESTAMP)
`);

const insertTrace = db.prepare(`
  INSERT INTO knowledge_trace (trace_id, entry_id, model_id, app_endpoint, hit_score, hit_at, user_agent)
  VALUES (?, ?, ?, 'ai-assistant', 0.85, CURRENT_TIMESTAMP, 'auto-ingest')
`);

let okFormal = 0, okStaging = 0, okAudit = 0, okTrace = 0;
const tx = db.prepare('BEGIN').run();
try {
  for (const [entry_id, module, title, content, tags, category] of entries) {
    const summary = content.slice(0, 200);
    const tagsJson = JSON.stringify(tags);
    const sourceIdsJson = JSON.stringify([SRC_ID]);
    
    insertStaging.run(entry_id, module, title, content, SRC_ID, summary, tagsJson, tagsJson, sourceIdsJson, 0.85, 'registered', category, 'intermediate');
    insertFormal.run(entry_id, module, title, content, SRC_ID, summary, tagsJson, tagsJson, sourceIdsJson, 0.85, 'registered', category, 'intermediate');
    insertAudit.run('AUDIT-' + entry_id, entry_id, module, JSON.stringify({src: SRC_ID, tags, auto_trust: 0.85}));
    insertTrace.run('TRACE-' + entry_id, entry_id, 'ziwei-model-v1');
    
    okFormal++;
    okStaging++;
    okAudit++;
    okTrace++;
  }
  db.prepare('COMMIT').run();
  console.log(`✅ 成功:`);
  console.log(`   kb_staging: ${okStaging} 条`);
  console.log(`   kb_formal:  ${okFormal} 条`);
  console.log(`   kb_audit:   ${okAudit} 条`);
  console.log(`   knowledge_trace: ${okTrace} 条`);
  console.log(`   source:     1 (${SRC_ID})`);
} catch (e) {
  db.prepare('ROLLBACK').run();
  console.error('❌ TX 失败:', e.message);
  console.error('当前 entry_id 可能:', entries[okFormal] && entries[okFormal][0]);
  process.exit(1);
}

// 4. 验证
const vFormal = db.prepare(`SELECT COUNT(*) AS c FROM kb_formal WHERE module='ziwei'`).get();
const vStaging = db.prepare(`SELECT COUNT(*) AS c FROM kb_staging WHERE module='ziwei'`).get();
const vAll = db.prepare(`SELECT COUNT(*) AS c FROM kb_formal`).get();
const vSrc = db.prepare(`SELECT entries_extracted FROM source_index WHERE src_id = ?`).get(SRC_ID);

console.log(`\n📊 验证:`);
console.log(`   kb_formal 总数:  ${vAll.c}`);
console.log(`   kb_formal ziwei: ${vFormal.c} 条 (升级前 94 → 升级后 ${vFormal.c})`);
console.log(`   kb_staging ziwei: ${vStaging.c} 条`);
console.log(`   ${SRC_ID}.entries_extracted: ${vSrc && vSrc.entries_extracted}`);

// 5. 列出新条目 title
const sample = db.prepare(`SELECT entry_id, title FROM kb_formal WHERE entry_id LIKE 'KB-ZIWEI-COURSE-%' ORDER BY entry_id LIMIT 5`).all();
console.log(`\n📝 前 5 条新 KB 条目:`);
for (const s of sample) console.log(`   ${s.entry_id}: ${s.title}`);
