/**
 * 易道智鉴 · 命理口诀每日一句数据库
 * ====================================
 * 共365条八字命理口诀，按公历日期排列（1月1日至12月31日）
 * 每日一句，涵盖天干地支、十神、格局、用神、大运流年、神煞、纳音、刑冲合害八大领域
 *
 * 经典来源：
 *   《滴天髓》《穷通宝鉴》《三命通会》《子平真诠》
 *   《渊海子平》《神峰通考》《五言独步》《四言独步》
 *
 * 难度标记：入门（基础概念）、进阶（组合应用）、精通（深层原理）
 *
 * 使用方式：
 *   const { getDailyKoujue, filterByCategory, getKoujueByMonth,
 *           getRandomKoujue, searchKoujue, KOUJUE_DAILY_DATABASE } = require('./koujue-daily');
 *
 *   const today = getDailyKoujue(6, 29);  // 获取6月29日口诀
 *   console.log(today.text, today.source, today.explain);
 */

// ============================================================
// 口诀每日一句数据库（365条）
// ============================================================
const KOUJUE_DAILY_DATABASE = [

  // ═══════════════════════════════════════════
  // 一月 · 寅月（孟春）· 甲木主题
  // 本月口诀侧重：甲木特性、天干地支基础、十神入门
  // ═══════════════════════════════════════════
  { date: "1-1", text: "甲木参天，脱胎要火", source: "《滴天髓》", explain: "甲木为参天大树，初春嫩芽需火温暖方能生长，喻春木得火则发荣。\", category: \"天干地支", difficulty: "入门" },
  { date: "1-2", text: "春不容金，秋不容土", source: "《滴天髓》", explain: "春木当令而旺，金无力克木反受其辱；秋金当令而锐，木衰不能敌。言五行旺衰时令之理。\", category: \"天干地支", difficulty: "入门" },
  { date: "1-3", text: "火炽乘龙，水宕骑虎", source: "《滴天髓》", explain: "火旺遇辰土（龙）可泄火气，水泛滥遇寅木（虎）可纳水势。言五行制化调候之妙。\", category: \"用神", difficulty: "进阶" },
  { date: "1-4", text: "地润天和，植立千古", source: "《滴天髓》", explain: "甲木得天地中和之气，水土适宜则根基稳固，可成栋梁之材。强调甲木喜润不喜燥。\", category: \"用神", difficulty: "进阶" },
  { date: "1-5", text: "阳支动且强，速达显灾祥", source: "《滴天髓》", explain: "子寅辰午申戌为阳支，其性刚健主动，吉凶应验迅速而明显。\", category: \"天干地支", difficulty: "入门" },
  { date: "1-6", text: "阴支静且专，否泰每经年", source: "《滴天髓》", explain: "丑卯巳未酉亥为阴支，其性柔顺主静，吉凶变化缓慢，常需经年累月方显。\", category: \"天干地支", difficulty: "入门" },
  { date: "1-7", text: "生方怕动库宜开，败地逢冲仔细推", source: "《滴天髓》", explain: "寅申巳亥为生方忌冲，辰戌丑未为库喜冲开；子午卯酉为败地逢冲需细察。论地支冲合之要诀。\", category: \"刑冲合害", difficulty: "精通" },
  { date: "1-8", text: "支神只以冲为重，刑与穿兮动不动", source: "《滴天髓》", explain: "地支关系中冲的力量最大最明显，而刑与穿（害）的力量相对较弱，但不可忽视。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "1-9", text: "甲木以辰为财库，戌为伤官库", source: "《三命通会》", explain: "甲日干以土为财，辰为水库亦为土库，故辰为甲木之财库；戌为火库，火为甲木之食伤。\", category: \"天干地支", difficulty: "进阶" },
  { date: "1-10", text: "甲逢庚克貌如花，乙遇辛克貌似花", source: "《渊海子平》", explain: "甲木见庚金七杀有制则英挺，乙木见辛金七杀有制则秀美。七杀有制化为权，反主容仪出众。\", category: \"十神", difficulty: "进阶" },
  { date: "1-11", text: "正月甲木，初春尚有余寒", source: "《穷通宝鉴》", explain: "正月（寅月）虽已立春，寒气未尽。甲木生于寅月，得丙火照暖、癸水滋润方为佳造。\", category: \"用神", difficulty: "入门" },
  { date: "1-12", text: "甲木若无庚，男儿不勇", source: "《渊海子平》", explain: "甲木日主命局无庚金七杀来雕琢，则缺乏英锐之气。庚金克甲，非凶反贵，取\"无杀不为奇\"之意。\", category: \"十神", difficulty: "进阶" },
  { date: "1-13", text: "甲乙春生，丙丁夏旺", source: "《渊海子平》", explain: "甲乙木生于春天得令而旺，丙丁火生于夏天得时而炽。此言日主得月令之气为强。\", category: \"天干地支", difficulty: "入门" },
  { date: "1-14", text: "庚辛秋锐，壬癸冬藏", source: "《渊海子平》", explain: "庚辛金在秋季锋芒最利，壬癸水在冬季蓄藏最深。各五行当旺之季节不同。\", category: \"天干地支", difficulty: "入门" },
  { date: "1-15", text: "五行生克制化，各有所喜所忌", source: "《三命通会》", explain: "木喜火土忌金水过重，火喜木土忌水金过重，各五行均有所喜之神与所忌之物。\", category: \"天干地支", difficulty: "入门" },
  { date: "1-16", text: "金赖土生，土多金埋", source: "《三命通会》", explain: "金依赖土来生扶，但若土过重反将金埋没。生扶贵在中和，太过则为病。\", category: \"用神", difficulty: "入门" },
  { date: "1-17", text: "土赖火生，火多土焦", source: "《三命通会》", explain: "土依赖火来生扶，但火过旺则土被烧焦。五行生克贵在平衡，母旺灭子是也。\", category: \"用神", difficulty: "入门" },
  { date: "1-18", text: "火赖木生，木多火窒", source: "《三命通会》", explain: "火赖木生，但木过多则火被压灭。生扶太过反成闭塞之弊。\", category: \"用神", difficulty: "入门" },
  { date: "1-19", text: "水赖金生，金多水浊", source: "《三命通会》", explain: "水赖金生，但金过多反使水变得混浊不清。生扶太过则本性迷失。\", category: \"用神", difficulty: "入门" },
  { date: "1-20", text: "木赖水生，水多木漂", source: "《三命通会》", explain: "木赖水生，但水过多则木被冲漂无根。父母过旺反伤子女，五行反生为克之理。\", category: \"用神", difficulty: "入门" },
  { date: "1-21", text: "金能克木，木坚金缺", source: "《三命通会》", explain: "金本克木，但若木过于坚旺而金衰弱，则不仅不能克木，反被木所伤。亢旺反侮之理。\", category: \"天干地支", difficulty: "进阶" },
  { date: "1-22", text: "木能克土，土重木折", source: "《三命通会》", explain: "木本克土，但若土过于厚重而木弱，则木反被折断。五行反克，须察旺衰强弱。\", category: \"天干地支", difficulty: "进阶" },
  { date: "1-23", text: "土能克水，水多土流", source: "《三命通会》", explain: "土本克水，但若水势浩大而土薄，则土被水冲散流失。反克之理，旺者胜衰者败。\", category: \"天干地支", difficulty: "进阶" },
  { date: "1-24", text: "水能克火，火炎水灼", source: "《三命通会》", explain: "水本克火，但若火势熊熊而水微，则不仅不能灭火，反被火烧干。\", category: \"天干地支", difficulty: "进阶" },
  { date: "1-25", text: "火能克金，金多火熄", source: "《三命通会》", explain: "火本克金，但若金多势众而火弱，则火反被熄灭。五行反侮之道。\", category: \"天干地支", difficulty: "进阶" },
  { date: "1-26", text: "强金得水，方挫其锋", source: "《滴天髓》", explain: "庚金刚锐无匹，须得水来泄其锐气方能成器。水为金的食伤，泄秀之功。\", category: \"十神", difficulty: "进阶" },
  { date: "1-27", text: "强水得木，方泄其势", source: "《滴天髓》", explain: "壬癸水势滔天，须得木来疏导方能归入正途。木为水之食伤，泄其旺势。\", category: \"十神", difficulty: "进阶" },
  { date: "1-28", text: "强木得火，方化其顽", source: "《滴天髓》", explain: "甲木参天刚硬，须得火来泄秀方能成材。火为甲木之食伤，文明之象。\", category: \"十神", difficulty: "进阶" },
  { date: "1-29", text: "强火得土，方止其焰", source: "《滴天髓》", explain: "丙丁火炎上猛烈，须得土来泄其炎威方能收敛。土为火之食伤，泄火之烈。\", category: \"十神", difficulty: "进阶" },
  { date: "1-30", text: "强土得金，方制其壅", source: "《滴天髓》", explain: "戊己土厚重壅塞，须得金来泄其滞气方能疏通。金为土之食伤，开壅泄秀。\", category: \"十神", difficulty: "进阶" },
  { date: "1-31", text: "天干犹木之干，地支犹木之根", source: "《三命通会》", explain: "天干为外在表现如树干，地支为内在根基如树根。干透不如支藏深厚，干以支为依托。\", category: \"天干地支", difficulty: "入门" },

  // ═══════════════════════════════════════════
  // 二月 · 卯月（仲春）· 乙木主题
  // 本月口诀侧重：乙木特性、格局入门、地支合化
  // ═══════════════════════════════════════════
  { date: "2-1", text: "乙木虽柔，刲羊解牛", source: "《滴天髓》", explain: "乙木看似柔弱如藤萝，却能克制未土(羊)和丑土(牛)。乙木坐未或丑，仍有制土之能。\", category: \"天干地支", difficulty: "入门" },
  { date: "2-2", text: "怀丁抱丙，跨凤乘猴", source: "《滴天髓》", explain: "乙木得丙丁火（食伤泄秀），则可驾驭酉金(凤)和申金(猴)。木火通明不畏金克。\", category: \"用神", difficulty: "进阶" },
  { date: "2-3", text: "虚湿之地，骑马亦忧", source: "《滴天髓》", explain: "乙木生于水旺湿重之地，即使有午火(马)来暖，也难舒展。乙木最忌寒湿。\", category: \"用神", difficulty: "进阶" },
  { date: "2-4", text: "藤萝系甲，可春可秋", source: "《滴天髓》", explain: "乙木如藤萝攀附甲木（大树），借助甲木之力，春季可发荣、秋季可耐寒。比肩帮扶之妙。\", category: \"十神", difficulty: "进阶" },
  { date: "2-5", text: "卯木为琼林之木，乙木居之", source: "《三命通会》", explain: "卯为乙木之禄地，如琼林玉树。乙木得卯为根，枝繁叶茂，主文采风流。\", category: \"天干地支", difficulty: "入门" },
  { date: "2-6", text: "甲己合化土，中正之合", source: "《滴天髓》", explain: "甲木与己土相合，化为土。甲为阳木，己为阴土，阴阳相合，名曰中正之合。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "2-7", text: "乙庚合化金，仁义之合", source: "《滴天髓》", explain: "乙木与庚金相合，化为金。乙为阴木，庚为阳金，刚柔相济，名曰仁义之合。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "2-8", text: "丙辛合化水，威制之合", source: "《滴天髓》", explain: "丙火与辛金相合，化为水。丙为阳火，辛为阴金，火炼真金，名曰威制之合。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "2-9", text: "丁壬合化木，淫匿之合", source: "《滴天髓》", explain: "丁火与壬水相合，化为木。丁为阴火，壬为阳水，水火交融生木，名曰淫匿之合。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "2-10", text: "戊癸合化火，无情之合", source: "《滴天髓》", explain: "戊土与癸水相合，化为火。戊为阳土，癸为阴水，燥土得水，名曰无情之合。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "2-11", text: "二月乙木，阳气渐升，木不穿金", source: "《穷通宝鉴》", explain: "二月（卯月）乙木当令，木气正旺。此时乙木不惧弱金之克，反而穿破金。丙癸为要。\", category: \"用神", difficulty: "入门" },
  { date: "2-12", text: "用神专寻月令，格局分焉", source: "《子平真诠》", explain: "取用神首先看月令，以日干配合月令地支而生克不同，从而分出各种格局。\", category: \"格局", difficulty: "入门" },
  { date: "2-13", text: "八字入手，先看月令", source: "《子平真诠》", explain: "看八字的第一步是看月令。月令为提纲，掌握全局旺衰之枢纽，格局之根基。\", category: \"格局", difficulty: "入门" },
  { date: "2-14", text: "月令为提纲，不可冲也", source: "《渊海子平》", explain: "月令是八字的纲领所在，不能被冲克。月令被冲则格局动摇，根基不稳。\", category: \"格局", difficulty: "入门" },
  { date: "2-15", text: "建禄格者，月令逢禄也", source: "《子平真诠》", explain: "日干在月令见禄位即为建禄格。如甲日见寅月、乙日见卯月。身旺须克泄耗。\", category: \"格局", difficulty: "进阶" },
  { date: "2-16", text: "阳刃格者，月令帝旺也", source: "《子平真诠》", explain: "日干在月令见帝旺位即为阳刃格。如甲日见卯月即为刃。阳刃喜官杀制伏。\", category: \"格局", difficulty: "进阶" },
  { date: "2-17", text: "乙木见卯为建禄，身旺逢生则祸", source: "《三命通会》", explain: "乙木生于卯月为建禄格，自身已旺。若再见印星生扶，旺上加旺反不为福。\", category: \"格局", difficulty: "进阶" },
  { date: "2-18", text: "寅卯辰会东方木局，木气冲天", source: "《三命通会》", explain: "寅卯辰三会东方木局，为最强的木局组合。若为木日主，则身旺至极。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "2-19", text: "亥卯未三合木局，同气相求", source: "《三命通会》", explain: "亥卯未三合木局，亥为木之长生、卯为帝旺、未为墓库。三者相合木势大盛。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "2-20", text: "申子辰三合水局，水势滔天", source: "《三命通会》", explain: "申子辰三合水局，申为水之长生、子为帝旺、辰为墓库。水局成则势不可挡。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "2-21", text: "巳酉丑三合金局，金锐无匹", source: "《三命通会》", explain: "巳酉丑三合金局，巳为金之长生、酉为帝旺、丑为墓库。金局成则锋芒毕露。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "2-22", text: "寅午戌三合火局，烈焰腾空", source: "《三命通会》", explain: "寅午戌三合火局，寅为火之长生、午为帝旺、戌为墓库。火局成则炎上冲天。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "2-23", text: "卯为雷门，日出之所", source: "《三命通会》", explain: "卯在方位为东方，时辰为日出之时（5-7点），故称雷门。卯为震卦，主动。\", category: \"天干地支", difficulty: "入门" },
  { date: "2-24", text: "卯酉冲，门户之冲", source: "《渊海子平》", explain: "卯为东门、酉为西门，卯酉相冲为东西门户对冲。主变动、迁移、分离之事。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "2-25", text: "子午卯酉，四正之位", source: "《三命通会》", explain: "子午卯酉为四正方，代表北南东西四极。四正之神纯而不杂，各专一气。\", category: \"天干地支", difficulty: "入门" },
  { date: "2-26", text: "寅申巳亥，四生之方", source: "《三命通会》", explain: "寅申巳亥为四长生之地，分别为火水金木的长生之位。四生之神主动变。\", category: \"天干地支", difficulty: "入门" },
  { date: "2-27", text: "辰戌丑未，四库之土", source: "《三命通会》", explain: "辰戌丑未为四墓库，分别为水库、火库、金库、木库。四库之神主收藏。\", category: \"天干地支", difficulty: "入门" },
  { date: "2-28", text: "木火通明，文章盖世", source: "《滴天髓》", explain: "木为印星生火（日主）或木日主生火（食伤），木火两旺相生，主聪明文采出众。\", category: \"格局", difficulty: "进阶" },

  // ═══════════════════════════════════════════
  // 三月 · 辰月（季春）· 土五行主题
  // 本月口诀侧重：辰戌丑未四库、墓库开闭、纳音入门
  // ═══════════════════════════════════════════
  { date: "3-1", text: "戊土固重，既中且正", source: "《滴天髓》", explain: "戊土为城墙之土，厚重稳固，居于中央。其性中正平和，承载万物而不偏。\", category: \"天干地支", difficulty: "入门" },
  { date: "3-2", text: "静翕动辟，万物司命", source: "《滴天髓》", explain: "戊土静则含藏万物，动则开辟生机。戊土贯穿四季，为万物生长之根基。\", category: \"天干地支", difficulty: "进阶" },
  { date: "3-3", text: "水润物生，火燥物病", source: "《滴天髓》", explain: "戊土得水滋润则万物生长茂盛，遇火过燥则万物枯槁病败。戊土喜润忌燥。\", category: \"用神", difficulty: "进阶" },
  { date: "3-4", text: "若在艮坤，怕冲宜静", source: "《滴天髓》", explain: "戊土在寅（艮）申（坤）之位，最怕冲克，宜安静不动。因寅申为戊土之病死地。\", category: \"刑冲合害", difficulty: "精通" },
  { date: "3-5", text: "己土卑湿，中正蓄藏", source: "《滴天髓》", explain: "己土为田园之土，性柔湿，善于蓄藏养分。中正平和，不偏不倚。\", category: \"天干地支", difficulty: "入门" },
  { date: "3-6", text: "不愁木盛，不畏水狂", source: "《滴天髓》", explain: "己土湿润柔软，不惧怕木多来克（木克土但柔土不折），也不怕大水冲荡。\", category: \"天干地支", difficulty: "入门" },
  { date: "3-7", text: "火少火晦，金多金光", source: "《滴天髓》", explain: "己土见火少则晦暗无光（湿土晦火），见金多则金光闪耀（土生金而金耀）。\", category: \"用神", difficulty: "进阶" },
  { date: "3-8", text: "若要物旺，宜助宜帮", source: "《滴天髓》", explain: "己土欲使万物生长茂盛，需要火来温暖、木来疏松。己土需外力相助方显功效。\", category: \"用神", difficulty: "进阶" },
  { date: "3-9", text: "辰为水库，又为土库", source: "《三命通会》", explain: "辰中藏乙戊癸，既是水之墓库，又属土。三月辰土为湿土，能蓄水养木。\", category: \"天干地支", difficulty: "进阶" },
  { date: "3-10", text: "戌为火库，又为土库", source: "《三命通会》", explain: "戌中藏辛丁戊，既是火之墓库，又属土。九月戌土为燥土，含火气在内。\", category: \"天干地支", difficulty: "进阶" },
  { date: "3-11", text: "丑为金库，又为土库", source: "《三命通会》", explain: "丑中藏癸辛己，既是金之墓库，又属土。十二月丑土为湿土，内含金气。\", category: \"天干地支", difficulty: "进阶" },
  { date: "3-12", text: "未为木库，又为土库", source: "《三命通会》", explain: "未中藏乙己丁，既是木之墓库，又属土。六月未土为燥土，藏木火之气。\", category: \"天干地支", difficulty: "进阶" },
  { date: "3-13", text: "辰戌丑未，天地之杂气", source: "《子平真诠》", explain: "辰戌丑未四土，各含杂气（藏干不止一个）。四季末各十八日为土旺之时。\", category: \"天干地支", difficulty: "进阶" },
  { date: "3-14", text: "三月辰土，清明后谷雨前", source: "《穷通宝鉴》", explain: "三月辰月，清明后戊土当旺七日，再轮甲木，谷雨后乙木退气。节气递变，五行交替。\", category: \"天干地支", difficulty: "精通" },
  { date: "3-15", text: "有病方为贵，无伤不是奇", source: "《五言独步》", explain: "命局有缺陷（病）反而可能是贵格，四平八稳未必神奇。关键在于有病有药。\", category: \"格局", difficulty: "进阶" },
  { date: "3-16", text: "格中如去病，财禄喜相随", source: "《五言独步》", explain: "命局中的病若能用神得当去之，则财官禄位自然相随。用神即治命之药也。\", category: \"格局", difficulty: "进阶" },
  { date: "3-17", text: "甲木三月，木老用庚", source: "《穷通宝鉴》", explain: "三月（辰月）甲木将老，木气渐衰，需用庚金来修剪枯枝败叶，方成栋梁。\", category: \"用神", difficulty: "进阶" },
  { date: "3-18", text: "先庚后壬，三月木之正用", source: "《穷通宝鉴》", explain: "三月甲木先用庚金修剪，后用壬水滋润。庚金制木过旺，壬水滋养根基。\", category: \"用神", difficulty: "进阶" },
  { date: "3-19", text: "纳音者，干支相配之音律也", source: "《三命通会》", explain: "纳音五行是将六十甲子按音律宫商角徵羽配以五行，用以论命之先天禀赋。\", category: \"纳音", difficulty: "入门" },
  { date: "3-20", text: "甲子乙丑海中金", source: "《三命通会》", explain: "甲子乙丑纳音为海中金，如潜藏海底之金，需火炼方成器，但火不宜过旺。\", category: \"纳音", difficulty: "入门" },
  { date: "3-21", text: "丙寅丁卯炉中火", source: "《三命通会》", explain: "丙寅丁卯纳音为炉中火，如洪炉之火，火力集中而持久，善冶炼锻炼。\", category: \"纳音", difficulty: "入门" },
  { date: "3-22", text: "戊辰己巳大林木", source: "《三命通会》", explain: "戊辰己巳纳音为大林木，如广袤森林之木，木气充沛，成林成片。\", category: \"纳音", difficulty: "入门" },
  { date: "3-23", text: "庚午辛未路旁土", source: "《三命通会》", explain: "庚午辛未纳音为路旁土，如路边之泥土，虽卑贱却承载万物通行。\", category: \"纳音", difficulty: "入门" },
  { date: "3-24", text: "壬申癸酉剑锋金", source: "《三命通会》", explain: "壬申癸酉纳音为剑锋金，如宝剑之锋刃，锐利无比，善断能决。\", category: \"纳音", difficulty: "入门" },
  { date: "3-25", text: "甲戌乙亥山头火", source: "《三命通会》", explain: "甲戌乙亥纳音为山头火，如山野之火，虽不及炉火集中，但燎原之势不减。\", category: \"纳音", difficulty: "入门" },
  { date: "3-26", text: "土旺四季，各旺十八日", source: "《三命通会》", explain: "土在四季末（辰未戌丑月）各旺十八日。立春立夏立秋立冬前十八日为土旺用事。\", category: \"天干地支", difficulty: "入门" },
  { date: "3-27", text: "财官印食，四吉神也", source: "《子平真诠》", explain: "正财、正官、正印、食神为四吉神，顺用为佳。顺用者，生之护之是也。\", category: \"十神", difficulty: "入门" },
  { date: "3-28", text: "杀伤枭刃，四凶神也", source: "《子平真诠》", explain: "七杀、伤官、偏印（枭神）、阳刃为四凶神，逆用为佳。逆用者，制之化之是也。\", category: \"十神", difficulty: "入门" },
  { date: "3-29", text: "顺用者吉神，逆用者凶神", source: "《子平真诠》", explain: "吉神顺其性而用之则吉（如官生印），凶神逆其性而制之则吉（如杀逢食制）。\", category: \"十神", difficulty: "进阶" },
  { date: "3-30", text: "吉神太露，起争夺之风", source: "《子平真诠》", explain: "吉神（财官印食）在天干太显露，反易引起争夺。吉神宜藏不宜露。\", category: \"十神", difficulty: "进阶" },
  { date: "3-31", text: "凶物深藏，成养虎之患", source: "《子平真诠》", explain: "凶神（杀伤枭刃）深藏地支不透，反而难以制化，如养虎为患。凶神宜透出受制。\", category: \"十神", difficulty: "进阶" },

  // ═══════════════════════════════════════════
  // 四月 · 巳月（孟夏）· 丙火主题
  // 本月口诀侧重：丙火特性、大运流年、用神调候
  // ═══════════════════════════════════════════
  { date: "4-1", text: "丙火猛烈，欺霜侮雪", source: "《滴天髓》", explain: "丙火为太阳之火，猛烈无比，不畏霜雪之寒。丙火纯阳之性，有融化冰雪之威。\", category: \"天干地支", difficulty: "入门" },
  { date: "4-2", text: "能煅庚金，逢辛反怯", source: "《滴天髓》", explain: "丙火能锻炼庚金使之成器，但遇辛金反显胆怯。因丙辛合化为水，火势被牵制。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "4-3", text: "土众成慈，水猖显节", source: "《滴天髓》", explain: "丙火见土多则泄其炎威反显仁慈，见水猖狂则显其节气（水火既济）。\", category: \"用神", difficulty: "进阶" },
  { date: "4-4", text: "虎马犬乡，甲来焚灭", source: "《滴天髓》", explain: "丙火遇寅(虎)午(马)戌(犬)三合火局，火势冲天，甲木再来即是焚身之祸。\", category: \"刑冲合害", difficulty: "精通" },
  { date: "4-5", text: "四月丙火，建禄于巳", source: "《穷通宝鉴》", explain: "四月（巳月）丙火建禄，火势正旺。此时丙火专用壬水为调候，以济水火既济之功。\", category: \"用神", difficulty: "入门" },
  { date: "4-6", text: "丙火四月，壬庚两透", source: "《穷通宝鉴》", explain: "四月丙火，以壬水调候为第一要务，庚金发水源为辅助。壬庚双透，富贵格局。\", category: \"用神", difficulty: "进阶" },
  { date: "4-7", text: "大运起法：阳男阴女顺行，阴男阳女逆行", source: "《渊海子平》", explain: "阳年男、阴年女大运顺排（从月柱顺数）；阴年男、阳年女大运逆排（从月柱逆数）。\", category: \"大运流年", difficulty: "入门" },
  { date: "4-8", text: "大运重地支，流年重天干", source: "《三命通会》", explain: "大运以地支为主看十年大方向，流年以天干为主看当年具体应事。干支各有侧重。\", category: \"大运流年", difficulty: "进阶" },
  { date: "4-9", text: "五年司天，五年司地", source: "《三命通会》", explain: "一步大运十年，前五年以天干为主（司天），后五年以地支为主（司地）。各有专司。\", category: \"大运流年", difficulty: "进阶" },
  { date: "4-10", text: "运以支为重，岁以干为先", source: "《渊海子平》", explain: "大运吉凶以地支为主判断，流年吉凶以天干为先判断。此为论岁运之大法。\", category: \"大运流年", difficulty: "进阶" },
  { date: "4-11", text: "月上起运，阳顺阴逆", source: "《渊海子平》", explain: "大运从月柱开始排起，阳年男性顺排、阴年女性顺排；阴年男性逆排、阳年女性逆排。\", category: \"大运流年", difficulty: "入门" },
  { date: "4-12", text: "起运岁数，三日为一岁", source: "《渊海子平》", explain: "从出生日到下一个（或上一个）节气的天数，每三日折算为起运的一岁。\", category: \"大运流年", difficulty: "进阶" },
  { date: "4-13", text: "岁运并临，吉凶最验", source: "《三命通会》", explain: "大运与流年干支完全相同，称为岁运并临。此时吉凶加倍，应验最为明显。\", category: \"大运流年", difficulty: "进阶" },
  { date: "4-14", text: "天克地冲，岁运交战", source: "《渊海子平》", explain: "大运与流年天干相克、地支相冲，称为天克地冲。主重大变动，吉凶取决于喜忌。\", category: \"大运流年", difficulty: "进阶" },
  { date: "4-15", text: "寅巳相害，为无恩之刑", source: "《三命通会》", explain: "寅巳相刑，寅木生巳火，火旺焚木，为无恩之刑。生我者反被我伤，忘恩负义之象。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "4-16", text: "巳申相刑，恃势之刑", source: "《三命通会》", explain: "巳申既合又刑。巳火克申金，申中壬水又克巳中丙火。恃势凌人之象。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "4-17", text: "丑戌相刑，无礼之刑", source: "《三命通会》", explain: "丑戌同为土但相刑。丑为金库、戌为火库，同类相残。无礼之刑，以势压人。\", category: \"刑冲合害", difficulty: "精通" },
  { date: "4-18", text: "子卯相刑，无礼之刑亦为", source: "《三命通会》", explain: "子卯相刑为无礼之刑。子水为母，卯木为子，子刑母为无礼。亦主酒色之祸。\", category: \"刑冲合害", difficulty: "精通" },
  { date: "4-19", text: "太岁当头坐，无喜恐有祸", source: "《渊海子平》", explain: "本命年（流年与生年地支相同）为值太岁，若无喜事冲喜，恐有不利之事。\", category: \"大运流年", difficulty: "入门" },
  { date: "4-20", text: "太岁为一年之主宰，不可犯也", source: "《三命通会》", explain: "流年太岁掌一年之权，命局不可冲犯太岁。太岁受冲，多主变动不宁。\", category: \"大运流年", difficulty: "入门" },
  { date: "4-21", text: "冲太岁者，冒犯岁君", source: "《渊海子平》", explain: "流年地支与命局年支相冲为冲太岁。如子年生人逢午年。主变动、奔波、冲突。\", category: \"大运流年", difficulty: "进阶" },
  { date: "4-22", text: "巳为金之长生，亦为火之禄", source: "《三命通会》", explain: "巳中藏丙戊庚。巳既为丙火之禄地，又为庚金之长生。巳宫兼具火金双重属性。\", category: \"天干地支", difficulty: "进阶" },
  { date: "4-23", text: "巳亥相冲，水火交战", source: "《三命通会》", explain: "巳（火）与亥（水）相冲，水能克火。巳亥冲若火弱水强则火灭，火旺水弱则水涸。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "4-24", text: "丙夺丁光，火多不明", source: "《滴天髓》", explain: "命局中丙火太多，反而遮蔽了丁火的光辉。火多则炎上过度，光华反而晦暗不显。\", category: \"用神", difficulty: "进阶" },
  { date: "4-25", text: "官杀混杂，去留须精", source: "《子平真诠》", explain: "命局正官与七杀同现，为官杀混杂。须去其一留其一，方为清纯格局。\", category: \"十神", difficulty: "进阶" },
  { date: "4-26", text: "去官留杀，杀旺成权", source: "《子平真诠》", explain: "官杀混杂时去官留杀，若七杀有制，则化为权威之格。武职显贵之象。\", category: \"十神", difficulty: "精通" },
  { date: "4-27", text: "去杀留官，官星清贵", source: "《子平真诠》", explain: "官杀混杂时去杀留官，官星清纯无杂，主文职贵显，清正廉明之格。\", category: \"十神", difficulty: "精通" },
  { date: "4-28", text: "丙火无壬，终归下格", source: "《穷通宝鉴》", explain: "丙火生于巳午月，若无壬水调候，火炎土燥，终非上格。壬为丙火之七杀，水润火炎。\", category: \"用神", difficulty: "进阶" },
  { date: "4-29", text: "丙临申位逢阳水，难获延年", source: "《渊海子平》", explain: "丙火日主坐申（病地），再遇壬水（阳水）透干，火被水克太过，健康堪忧。\", category: \"大运流年", difficulty: "精通" },
  { date: "4-30", text: "丙火须防己土晦", source: "《穷通宝鉴》", explain: "丙火见己土（湿土）会被晦暗其光芒。己土为田园湿土，掩埋火光，使丙火失去光辉。\", category: \"用神", difficulty: "进阶" },

  // ═══════════════════════════════════════════
  // 五月 · 午月（仲夏）· 丁火主题
  // 本月口诀侧重：丁火特性、神煞详解、格局精要
  // ═══════════════════════════════════════════
  { date: "5-1", text: "丁火柔中，内性昭融", source: "《滴天髓》", explain: "丁火为灯烛之火、星月之光，外表柔和而内性光明。温柔中蕴含智慧。\", category: \"天干地支", difficulty: "入门" },
  { date: "5-2", text: "抱乙而孝，合壬而忠", source: "《滴天髓》", explain: "丁火得乙木为偏印来生（抱乙），为孝；合壬水正官（丁壬合），为忠。忠孝双全。\", category: \"十神", difficulty: "进阶" },
  { date: "5-3", text: "旺而不烈，衰而不穷", source: "《滴天髓》", explain: "丁火旺时不像丙火那样猛烈，衰时也不至于完全熄灭。柔中有韧，文明之象。\", category: \"天干地支", difficulty: "进阶" },
  { date: "5-4", text: "如有嫡母，可秋可冬", source: "《滴天髓》", explain: "丁火若有甲木为正印（嫡母）来生扶，则秋金克、冬水寒皆不足为惧。得印则固。\", category: \"十神", difficulty: "进阶" },
  { date: "5-5", text: "五月丁火，得壬化木", source: "《穷通宝鉴》", explain: "五月（午月）丁火当令，喜壬水调候。丁壬合化为木，木又生火，为有情之合。\", category: \"用神", difficulty: "进阶" },
  { date: "5-6", text: "丁火五月，专用壬庚", source: "《穷通宝鉴》", explain: "五月丁火建禄于午，火势正盛。专用壬水调候，庚金发水源。壬庚双透为上格。\", category: \"用神", difficulty: "进阶" },
  { date: "5-7", text: "天乙贵人，至尊之神", source: "《三命通会》", explain: "天乙贵人为命中最尊贵之神。甲戊庚见牛羊（丑未），乙己见鼠猴（子申），余类推。\", category: \"神煞", difficulty: "入门" },
  { date: "5-8", text: "甲戊并牛羊，乙己鼠猴乡", source: "《渊海子平》", explain: "甲戊庚日主以丑未为天乙贵人，乙己日主以子申为天乙贵人。贵人逢之主吉庆。\", category: \"神煞", difficulty: "入门" },
  { date: "5-9", text: "丙丁猪鸡位，壬癸兔蛇藏", source: "《渊海子平》", explain: "丙丁日主以亥酉为天乙贵人，壬癸日主以卯巳为天乙贵人。以日干查地支得之。\", category: \"神煞", difficulty: "入门" },
  { date: "5-10", text: "六辛逢马虎，此是贵人方", source: "《渊海子平》", explain: "辛日主以午寅为天乙贵人。辛逢午为贵人，逢寅亦为贵人。口诀完整版至此。\", category: \"神煞", difficulty: "入门" },
  { date: "5-11", text: "文昌贵人，丙申丁酉", source: "《三命通会》", explain: "文昌入命主聪明好学、文采出众。丙日文昌在申，丁日文昌在酉，以日干查地支。\", category: \"神煞", difficulty: "进阶" },
  { date: "5-12", text: "文昌星入命，金榜题名", source: "《渊海子平》", explain: "文昌贵人入命，主学业优异、科举有成。尤其逢流年引动，考试运佳。\", category: \"神煞", difficulty: "入门" },
  { date: "5-13", text: "天德贵人，正月在丁", source: "《三命通会》", explain: "天德贵人以月令查天干。正月（寅月）天德在丁，二月在申…天德为化凶解厄之神。\", category: \"神煞", difficulty: "进阶" },
  { date: "5-14", text: "月德贵人，寅午戌月德在丙", source: "《三命通会》", explain: "月德贵人以月令三合局查天干。寅午戌月月德在丙。月德为福佑之神，化险为夷。\", category: \"神煞", difficulty: "进阶" },
  { date: "5-15", text: "将星得地，威权万里", source: "《三命通会》", explain: "将星入命主有领导才能和权威。以年支或日支三合局查中间字。如寅午戌见午。\", category: \"神煞", difficulty: "进阶" },
  { date: "5-16", text: "华盖星，文章艺术之宿", source: "《三命通会》", explain: "华盖入命主聪明而有艺术气质，但性情孤独。以年日支查三合局末一字。\", category: \"神煞", difficulty: "进阶" },
  { date: "5-17", text: "驿马逢冲，奔驰万里", source: "《三命通会》", explain: "驿马逢冲动则主奔波远行、职位变动。寅午戌日马在申，申子辰日马在寅。\", category: \"神煞", difficulty: "入门" },
  { date: "5-18", text: "驿马无栏则奔驰，有栏则治", source: "《渊海子平》", explain: "驿马逢合（有栏）则能驾驭，行程有序；驿马无合则四处奔波、难以安宁。\", category: \"神煞", difficulty: "进阶" },
  { date: "5-19", text: "劫煞为灾不可当，徒然奔走各离乡", source: "《三命通会》", explain: "劫煞入命，主灾祸破财、奔波离乡之象。劫煞以日支查，寅午戌见亥为劫煞。\", category: \"神煞", difficulty: "进阶" },
  { date: "5-20", text: "亡神入命，心神不宁", source: "《三命通会》", explain: "亡神入命主心神不定、魂魄不安，易有意外灾祸。寅午戌见巳为亡神。\", category: \"神煞", difficulty: "进阶" },
  { date: "5-21", text: "桃花者，咸池也", source: "《三命通会》", explain: "桃花即咸池星，主情欲、美貌、交际。寅午戌日桃花在卯。桃花喜合忌冲。\", category: \"神煞", difficulty: "入门" },
  { date: "5-22", text: "桃花带杀，因色亡身", source: "《渊海子平》", explain: "桃花与七杀同柱，主因酒色之祸伤身。桃花虽美，带凶神则转为祸端。\", category: \"神煞", difficulty: "精通" },
  { date: "5-23", text: "火土伤官宜伤尽，金水伤官要见官", source: "《滴天髓》", explain: "火土伤官格要伤官完全（火生土、土伤官），金水伤官格则反需见官星方为贵。\", category: \"格局", difficulty: "精通" },
  { date: "5-24", text: "木火伤官官要旺，水木伤官喜见官", source: "《滴天髓》", explain: "木日主火伤官需火旺（木火通明），水木伤官格喜见火来调候（水木寒需火暖）。\", category: \"格局", difficulty: "精通" },
  { date: "5-25", text: "伤官见官果难辨，可见不可见", source: "《子平真诠》", explain: "伤官见官是否凶，需辨格局。金水伤官见官反贵，火土伤官见官则祸。\", category: \"格局", difficulty: "精通" },
  { date: "5-26", text: "午为离卦，火之正位", source: "《三命通会》", explain: "午在八卦属离，火之正位。午中藏丁火与己土。午为日中之象，阳气最盛之时。\", category: \"天干地支", difficulty: "入门" },
  { date: "5-27", text: "子午相冲，水火不交", source: "《渊海子平》", explain: "子水与午火相冲，水克火。子午冲主情绪波动、事业起伏，需看全局强弱而定吉凶。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "5-28", text: "正官格，喜财印相随", source: "《子平真诠》", explain: "月令正官格，喜财星来生官，喜印星来护官。财印不相碍为最上。\", category: \"格局", difficulty: "进阶" },
  { date: "5-29", text: "财格透官，贵气倍增", source: "《子平真诠》", explain: "月令正财格，天干透出正官，财能生官，贵气非凡。但不宜官杀混杂。\", category: \"格局", difficulty: "进阶" },
  { date: "5-30", text: "印格逢财，破印为灾", source: "《子平真诠》", explain: "月令正印格，见财星来破印为忌。财能克印，印被克则格局破败。\", category: \"格局", difficulty: "进阶" },
  { date: "5-31", text: "食神格，最喜身旺生财", source: "《子平真诠》", explain: "月令食神格，食能生财，财又生官。食神格流转有情，为吉格之典型。\", category: \"格局", difficulty: "进阶" },

  // ═══════════════════════════════════════════
  // 六月 · 未月（季夏）· 燥土主题
  // 本月口诀侧重：土五行用神、刑冲合害、大运换运
  // ═══════════════════════════════════════════
  { date: "6-1", text: "未为木库，又为夏季之土", source: "《三命通会》", explain: "未月为六月，季夏之时。未中藏乙己丁，为木之墓库。未土燥热，需水调候。\", category: \"天干地支", difficulty: "进阶" },
  { date: "6-2", text: "六月甲木，先用壬癸", source: "《穷通宝鉴》", explain: "六月（未月）火土燥热，甲木急需壬癸水来滋润降温。调候为第一要务。\", category: \"用神", difficulty: "进阶" },
  { date: "6-3", text: "火炎土燥，滴水入之反激", source: "《穷通宝鉴》", explain: "火土过于燥热之局，只入一滴水不仅不能降温，反而激发火气。调候水要旺。\", category: \"用神", difficulty: "精通" },
  { date: "6-4", text: "甲乙见金，琢而成器", source: "《三命通会》", explain: "甲乙木日主见庚辛金来克，犹如树木经刀斧雕琢而成器。克我者若适度反成造就。\", category: \"十神", difficulty: "进阶" },
  { date: "6-5", text: "正官乃克我之有情者", source: "《子平真诠》", explain: "正官为克我而阴阳相异者（如甲见辛）。官者管也，约束而有情，为正人君子之象。\", category: \"十神", difficulty: "入门" },
  { date: "6-6", text: "七杀乃克我之无情者", source: "《子平真诠》", explain: "七杀为克我而阴阳相同者（如甲见庚）。杀者伐也，攻身而无情，为暴戾之象。\", category: \"十神", difficulty: "入门" },
  { date: "6-7", text: "食神制杀，英雄独压万人", source: "《渊海子平》", explain: "食神制伏七杀，为食神制杀格。主武职威权，能压服众人，为英雄豪杰之命。\", category: \"十神", difficulty: "进阶" },
  { date: "6-8", text: "杀印相生，功名显达", source: "《子平真诠》", explain: "七杀攻身，印星化杀生身。杀印相生格，文武双全，功名显达之上格。\", category: \"十神", difficulty: "进阶" },
  { date: "6-9", text: "财滋弱杀，因财致祸", source: "《子平真诠》", explain: "七杀本弱，财星又来生杀。杀得财生而旺，反来攻身。因贪财而生祸端。\", category: \"十神", difficulty: "精通" },
  { date: "6-10", text: "伤官合杀，化为权柄", source: "《三命通会》", explain: "伤官与七杀相合，伤官制杀之暴戾，化为权柄。合杀为贵，擅用智慧制敌。\", category: \"十神", difficulty: "进阶" },
  { date: "6-11", text: "印绶逢财，贪财坏印", source: "《渊海子平》", explain: "印星为用神时逢财星来克，为贪财坏印。主因钱财而损坏名誉、学业。\", category: \"十神", difficulty: "进阶" },
  { date: "6-12", text: "比肩重重，克父克妻", source: "《渊海子平》", explain: "比肩过重则克财（父妻皆为财星）。男命比肩多者，多主克父或婚姻不顺。\", category: \"十神", difficulty: "进阶" },
  { date: "6-13", text: "劫财羊刃，切忌时逢", source: "《渊海子平》", explain: "劫财与阳刃为夺财之物。时柱为晚运，时逢劫刃主晚年破财，一生积蓄付诸东流。\", category: \"十神", difficulty: "进阶" },
  { date: "6-14", text: "换运之际，吉凶立判", source: "《三命通会》", explain: "新旧大运交替之时（交脱运），人生往往有重大转折。换运前后一两年尤须注意。\", category: \"大运流年", difficulty: "进阶" },
  { date: "6-15", text: "旧运欲去未去，新运将来未来", source: "《三命通会》", explain: "交脱运的过渡阶段，旧运的影响尚在，新运尚未完全到来。此阶段变动最多。\", category: \"大运流年", difficulty: "进阶" },
  { date: "6-16", text: "运过则吉凶已定，不可复追", source: "《三命通会》", explain: "大运已过去，该阶段的吉凶已经成为定数，不可再回头追寻。珍惜当下之运。\", category: \"大运流年", difficulty: "入门" },
  { date: "6-17", text: "辰戌相冲，水火之库开", source: "《三命通会》", explain: "辰为水库、戌为火库，辰戌相冲则水火之库俱开。若为喜用则发，为忌则灾。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "6-18", text: "丑未相冲，金木之库开", source: "《三命通会》", explain: "丑为金库、未为木库，丑未相冲则金木之库打开。冲开墓库吉凶各半。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "6-19", text: "支合以六合为先，三合次之", source: "《子平真诠》", explain: "地支合化关系中，六合（子丑合等）最紧密，三合局次之。合则羁绊，影响行动力。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "6-20", text: "三会局力量最大，胜过三合", source: "《三命通会》", explain: "三会方（寅卯辰会东方木等）五行力量最大，超过三合局。会局成则一气专旺。\", category: \"刑冲合害", difficulty: "精通" },
  { date: "6-21", text: "合多则滞，冲多则散", source: "《子平真诠》", explain: "命局或岁运合太多则做事迟滞不前，冲太多则万事散乱难成。中和为贵。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "6-22", text: "贪合忘克，贪合忘生", source: "《三命通会》", explain: "干支相合后，会忘记原本的生克关系。如甲与己合，则甲不克戊、己不生庚。\", category: \"刑冲合害", difficulty: "精通" },
  { date: "6-23", text: "刑主动，冲主破，害主妨", source: "《三命通会》", explain: "刑主动荡不安，冲主破坏变动，害主妨害是非。三者的力量和作用方向各有不同。\", category: \"刑冲合害", difficulty: "精通" },
  { date: "6-24", text: "寅巳申三刑，无恩之刑最凶", source: "《渊海子平》", explain: "寅巳申三刑俱全，无恩之刑最烈。若命局三刑齐备，一生多是非官非、骨肉相残。\", category: \"刑冲合害", difficulty: "精通" },
  { date: "6-25", text: "正印乃生我之有情者", source: "《子平真诠》", explain: "正印为生我而阴阳相异者（如甲见癸）。印者荫也，如母之慈，庇护生养。\", category: \"十神", difficulty: "入门" },
  { date: "6-26", text: "偏印乃生我之无情者", source: "《子平真诠》", explain: "偏印为生我而阴阳相同者（如甲见壬）。生而不情，谓之为枭，夺食为祸。\", category: \"十神", difficulty: "进阶" },
  { date: "6-27", text: "枭神夺食，女命伤子", source: "《渊海子平》", explain: "偏印（枭神）克制食神，为枭神夺食。食神为子女星，女命逢之主子女有损。\", category: \"十神", difficulty: "进阶" },
  { date: "6-28", text: "食神乃我生之有情者", source: "《子平真诠》", explain: "食神为我生而阴阳相同者（如甲见丙）。食神泄秀而有情，主才艺、口福、温和。\", category: \"十神", difficulty: "入门" },
  { date: "6-29", text: "伤官乃我生之无情者", source: "《子平真诠》", explain: "伤官为我生而阴阳相异者（如甲见丁）。泄秀而无情，主傲气、叛逆、创新。\", category: \"十神", difficulty: "入门" },
  { date: "6-30", text: "伤官虽凶，才气纵横", source: "《三命通会》", explain: "伤官虽为凶神，但主聪明才华出众。伤官配印或伤官生财则为上格。\", category: \"十神", difficulty: "进阶" },

  // ═══════════════════════════════════════════
  // 七月 · 申月（孟秋）· 庚金主题
  // 本月口诀侧重：庚金特性、纳音格局、大运吉凶
  // ═══════════════════════════════════════════
  { date: "7-1", text: "庚金带煞，刚健为最", source: "《滴天髓》", explain: "庚金为斧钺之金，带有肃杀之气，在十天干中最为刚健。其性果决刚锐。\", category: \"天干地支", difficulty: "入门" },
  { date: "7-2", text: "得水而清，得火而锐", source: "《滴天髓》", explain: "庚金得水则洗涤而清，得火锻炼则锋芒更锐。水为其食伤泄秀，火为其官杀炼金。\", category: \"用神", difficulty: "进阶" },
  { date: "7-3", text: "土润则生，土干则脆", source: "《滴天髓》", explain: "庚金遇湿土则生扶有情，遇燥土反脆其锋芒。土生金但燥土生金无力。\", category: \"用神", difficulty: "进阶" },
  { date: "7-4", text: "能赢甲兄，输于乙妹", source: "《滴天髓》", explain: "庚金能克甲木（阳克阳力大），却被乙木（阴）合化而失其锋芒。庚乙合化为我之羁绊。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "7-5", text: "七月庚金，建禄于申", source: "《穷通宝鉴》", explain: "七月（申月）庚金当令，建禄之地，金气正锐。先用丁火锻炼，次用甲木引丁。\", category: \"用神", difficulty: "入门" },
  { date: "7-6", text: "庚金七月，丁甲两透", source: "《穷通宝鉴》", explain: "七月庚金，丁火炼金、甲木生火为用。丁甲双透，锻造成器，为文武全才之格。\", category: \"用神", difficulty: "进阶" },
  { date: "7-7", text: "申为水之长生，金之禄地", source: "《三命通会》", explain: "申中藏庚壬戊。申为庚金之禄地，同时又是壬水之长生。申宫金水相生。\", category: \"天干地支", difficulty: "进阶" },
  { date: "7-8", text: "庚金坐申为临官，刚锐太过", source: "《三命通会》", explain: "庚金坐申为建禄（临官），金气过刚。刚则易折，需水泄其锐、火炼其锋。\", category: \"用神", difficulty: "进阶" },
  { date: "7-9", text: "金白水清，相涵斯秀", source: "《滴天髓》", explain: "金水相生，金白水清之格。庚金得壬水泄秀，文采风流，才思敏捷。\", category: \"格局", difficulty: "进阶" },
  { date: "7-10", text: "金火相成，锻炼功深", source: "《滴天髓》", explain: "庚金得丁火锻炼，金火相成。如刀剑经烈火淬炼，锋利无比。武贵之格。\", category: \"格局", difficulty: "进阶" },
  { date: "7-11", text: "申子辰合水局，金生水泄", source: "《三命通会》", explain: "庚金日主，地支申子辰三合水局。金生水而为食伤，泄秀太过则身弱。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "7-12", text: "金逢火炼，名铸印销金", source: "《渊海子平》", explain: "庚金日主遇火旺之运，如火为官杀喜用，主掌权升官。但若金弱火旺则被销毁。\", category: \"大运流年", difficulty: "精通" },
  { date: "7-13", text: "丙子丁丑涧下水", source: "《三命通会》", explain: "丙子丁丑纳音为涧下水，如山间溪涧之水，清澈而流长。水势不急，细水长流。\", category: \"纳音", difficulty: "入门" },
  { date: "7-14", text: "戊寅己卯城头土", source: "《三命通会》", explain: "戊寅己卯纳音为城头土，如城墙之上的泥土，有护卫之功。主稳重可靠。\", category: \"纳音", difficulty: "入门" },
  { date: "7-15", text: "庚辰辛巳白蜡金", source: "《三命通会》", explain: "庚辰辛巳纳音为白蜡金，如白蜡之中含金。外表朴素而内含真金，贵在实质。\", category: \"纳音", difficulty: "入门" },
  { date: "7-16", text: "壬午癸未杨柳木", source: "《三命通会》", explain: "壬午癸未纳音为杨柳木，如杨柳依依、柔美多姿。主风流儒雅、交际广泛。\", category: \"纳音", difficulty: "入门" },
  { date: "7-17", text: "甲申乙酉井泉水", source: "《三命通会》", explain: "甲申乙酉纳音为井泉水，如井底之泉，源远流长、取之不竭。主内秀深沉。\", category: \"纳音", difficulty: "入门" },
  { date: "7-18", text: "丙戌丁亥屋上土", source: "《三命通会》", explain: "丙戌丁亥纳音为屋上土，如屋顶之瓦土，有遮风挡雨之功。主成家立业。\", category: \"纳音", difficulty: "入门" },
  { date: "7-19", text: "戊子己丑霹雳火", source: "《三命通会》", explain: "戊子己丑纳音为霹雳火，如雷电之火，来势凶猛而短暂。主突发之变、爆发力强。\", category: \"纳音", difficulty: "入门" },
  { date: "7-20", text: "庚寅辛卯松柏木", source: "《三命通会》", explain: "庚寅辛卯纳音为松柏木，如松柏挺拔、岁寒不凋。主坚韧不拔、品德高尚。\", category: \"纳音", difficulty: "入门" },
  { date: "7-21", text: "壬辰癸巳长流水", source: "《三命通会》", explain: "壬辰癸巳纳音为长流水，如江河流水、源源不断。主奔波不息、事业绵长。\", category: \"纳音", difficulty: "入门" },
  { date: "7-22", text: "甲午乙未沙中金", source: "《三命通会》", explain: "甲午乙未纳音为沙中金，如散落沙中之金，须经淘洗方显光芒。主大器晚成。\", category: \"纳音", difficulty: "入门" },
  { date: "7-23", text: "丙申丁酉山下火", source: "《三命通会》", explain: "丙申丁酉纳音为山下火，如山脚之火，不旺却持久。主默默耕耘、积少成多。\", category: \"纳音", difficulty: "入门" },
  { date: "7-24", text: "戊戌己亥平地木", source: "《三命通会》", explain: "戊戌己亥纳音为平地木，如平原之木，四平八稳。主安居乐业、平稳发展。\", category: \"纳音", difficulty: "入门" },
  { date: "7-25", text: "庚子辛丑壁上土", source: "《三命通会》", explain: "庚子辛丑纳音为壁上土，如墙壁之土，有围护之功。主保守守成、安分守己。\", category: \"纳音", difficulty: "入门" },
  { date: "7-26", text: "纳音克身，终身无气", source: "《三命通会》", explain: "若纳音五行克日主纳音，如日主纳音木被命局纳音金克，主一生底气不足。\", category: \"纳音", difficulty: "精通" },
  { date: "7-27", text: "天干为禄，地支为命，纳音为身", source: "《三命通会》", explain: "原局以天干为禄（事业）、地支为命（根基）、纳音为身（体质）。三者皆须审察。\", category: \"纳音", difficulty: "精通" },
  { date: "7-28", text: "大运重纳音，流年重干支", source: "《三命通会》", explain: "论断大运时纳音五行的生克很重要，流年则以干支冲合刑害为主。各有侧重。\", category: \"大运流年", difficulty: "精通" },
  { date: "7-29", text: "庚金带煞，刚健为最。得水而清，得火而锐。土润则生，土干则脆。能赢甲兄，输于乙妹", source: "《滴天髓》", explain: "庚金全章。庚金为十天干中最刚健者，需水泄其锐、火炼其锋，最喜湿土相生。\", category: \"天干地支", difficulty: "精通" },
  { date: "7-30", text: "四言独步：先天何处，后天何处", source: "《四言独步》", explain: "四言独步开篇先问先天命局与后天大运。命运由命局（先天）和大运流年（后天）共同决定。\", category: \"大运流年", difficulty: "进阶" },
  { date: "7-31", text: "不知命无以为君子", source: "《渊海子平》", explain: "不了解命理，不足以成为君子。知命可以安身立命、趋吉避凶，此为学命之宗旨。\", category: \"格局", difficulty: "入门" },

  // ═══════════════════════════════════════════
  // 八月 · 酉月（仲秋）· 辛金主题
  // 本月口诀侧重：辛金特性、用神精要、调候深解
  // ═══════════════════════════════════════════
  { date: "8-1", text: "辛金软弱，温润而清", source: "《滴天髓》", explain: "辛金为珠玉首饰之金，性格温润清秀。与庚金之刚健不同，辛金贵在柔美精致。\", category: \"天干地支", difficulty: "入门" },
  { date: "8-2", text: "畏土之叠，乐水之盈", source: "《滴天髓》", explain: "辛金惧怕土太多来生（土多金埋），喜欢水来洗涤（水洗则清）。土叠则掩其光彩。\", category: \"用神", difficulty: "进阶" },
  { date: "8-3", text: "能扶社稷，能救生灵", source: "《滴天髓》", explain: "辛金虽柔，却有关键之用。辛金为小刀、针砭，能为社会手术疗伤、扶危济困。\", category: \"天干地支", difficulty: "进阶" },
  { date: "8-4", text: "热则喜母，寒则喜丁", source: "《滴天髓》", explain: "辛金生于炎夏（热）喜湿土（母）来生，生于寒冬喜丁火来暖。调候因时而异。\", category: \"用神", difficulty: "进阶" },
  { date: "8-5", text: "八月辛金，建禄于酉", source: "《穷通宝鉴》", explain: "八月（酉月）辛金当令建禄，金气正盛。需壬水淘洗方显其清，名金白水清之格。\", category: \"用神", difficulty: "入门" },
  { date: "8-6", text: "辛金八月，专用壬水", source: "《穷通宝鉴》", explain: "八月辛金以壬水为第一用神。壬水为辛金之伤官，淘洗珠玉使之清亮。金白水清为贵。\", category: \"用神", difficulty: "进阶" },
  { date: "8-7", text: "酉为兑卦，辛金居之", source: "《三命通会》", explain: "酉在八卦属兑，为辛金之禄位。酉为正西，象征收获、成熟与收官。\", category: \"天干地支", difficulty: "入门" },
  { date: "8-8", text: "卯酉冲者，东冲西", source: "《渊海子平》", explain: "卯为正东、酉为正西，卯酉相冲为东西对冲。主门户变迁、夫妻分离之象。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "8-9", text: "酉为桃花，又名咸池", source: "《三命通会》", explain: "酉为寅午戌日之桃花位。酉金桃花主美貌好酒，酉为阴金，美而冷艳。\", category: \"神煞", difficulty: "进阶" },
  { date: "8-10", text: "辛金如珠玉，畏火煅之", source: "《穷通宝鉴》", explain: "辛金如珠玉，不喜大火（丙火官星）直接锻炼，喜小火（丁火七杀）慢慢雕琢。\", category: \"用神", difficulty: "进阶" },
  { date: "8-11", text: "用神不可伤，伤则祸立至", source: "《子平真诠》", explain: "命局用神不可被克伤，用神受伤则全局皆败。护用神如护命根。\", category: \"用神", difficulty: "进阶" },
  { date: "8-12", text: "调候为急，格局次之", source: "《穷通宝鉴》", explain: "命局寒暖燥湿失调者，先取调候用神为急务，格局用神可次之。寒暖第一。\", category: \"用神", difficulty: "进阶" },
  { date: "8-13", text: "寒木向阳，丙为第一", source: "《穷通宝鉴》", explain: "木生于冬（亥子丑月），寒气袭人，以丙火为调候第一用神。无丙则木不舒。\", category: \"用神", difficulty: "进阶" },
  { date: "8-14", text: "燥土润金，壬水为功", source: "《穷通宝鉴》", explain: "金生于未戌等燥土之月，土燥金脆，须壬水调候润土方能生金。\", category: \"用神", difficulty: "进阶" },
  { date: "8-15", text: "炎火息木，癸水为恩", source: "《穷通宝鉴》", explain: "火生于巳午未月，炎火焦木，需癸水（雨露之水）滋润降温。雨露之恩。\", category: \"用神", difficulty: "进阶" },
  { date: "8-16", text: "润水御火，戊土为堤", source: "《穷通宝鉴》", explain: "水生于巳午未月，火炎水涸。需戊土为堤防来固水，防止水被火煎干。\", category: \"用神", difficulty: "进阶" },
  { date: "8-17", text: "众杀猖狂，一仁可化", source: "《滴天髓》", explain: "命局七杀众多攻身，一印（仁）即可化解。印化杀生身，化敌为友之道。\", category: \"十神", difficulty: "进阶" },
  { date: "8-18", text: "阳刃驾杀，威镇边疆", source: "《渊海子平》", explain: "日主阳刃格，七杀来制，为阳刃驾杀。主武贵，有镇守边疆之威。\", category: \"格局", difficulty: "进阶" },
  { date: "8-19", text: "伤官配印，文贵之格", source: "《子平真诠》", explain: "伤官格配正印，印制伤官之傲而存其才。主文贵，为才学兼优之士。\", category: \"格局", difficulty: "进阶" },
  { date: "8-20", text: "食神生财，富裕之造", source: "《子平真诠》", explain: "食神格生财星，食神泄秀生财，流转有情。主经商致富，财源滚滚。\", category: \"格局", difficulty: "进阶" },
  { date: "8-21", text: "官印相生，清贵之格", source: "《子平真诠》", explain: "月令正官格，印星透出生官护官。官印相生，贵气清纯，为文职官员之格。\", category: \"格局", difficulty: "进阶" },
  { date: "8-22", text: "财官相生，富贵双全", source: "《子平真诠》", explain: "月令财格，官星透出，财生官、官护财。财官相生，富贵双全之上格。\", category: \"格局", difficulty: "进阶" },
  { date: "8-23", text: "从格者，日主无根从旺势", source: "《子平真诠》", explain: "日主在地支无根，全局克泄耗之气专旺，则从势而去。从格贵在专一不杂。\", category: \"格局", difficulty: "精通" },
  { date: "8-24", text: "从杀格，贵也；从财格，富也", source: "《渊海子平》", explain: "日主无根从杀，为从杀格主贵；从财格则主富。从格最忌破格之运。\", category: \"格局", difficulty: "精通" },
  { date: "8-25", text: "化格者，干合而化也", source: "《子平真诠》", explain: "日主与月干或时干相合，且地支成化气之局，为化气格。化气须真化方贵。\", category: \"格局", difficulty: "精通" },
  { date: "8-26", text: "甲己化土，须辰戌丑未月", source: "《三命通会》", explain: "甲与己合化土，须生于辰戌丑未月土旺之时方为真化。化气格以月令为关键。\", category: \"刑冲合害", difficulty: "精通" },
  { date: "8-27", text: "乙庚化金，须巳酉丑申月", source: "《三命通会》", explain: "乙与庚合化金，须生于金旺之月方为真化。化气不真则为假化，非富非贵。\", category: \"刑冲合害", difficulty: "精通" },
  { date: "8-28", text: "丙辛化水，须申子辰亥月", source: "《三命通会》", explain: "丙与辛合化水，须生于水旺之月方为真化。丙火虽烈，逢辛而怯化为水。\", category: \"刑冲合害", difficulty: "精通" },
  { date: "8-29", text: "丁壬化木，须亥卯未寅月", source: "《三命通会》", explain: "丁与壬合化木，须生于木旺之月方为真化。阴阳相合，万物化生。\", category: \"刑冲合害", difficulty: "精通" },
  { date: "8-30", text: "戊癸化火，须寅午戌巳月", source: "《三命通会》", explain: "戊与癸合化火，须生于火旺之月方为真化。老阳少阴相合化火，为无情之合。\", category: \"刑冲合害", difficulty: "精通" },
  { date: "8-31", text: "五言独步：有病方为贵，无伤不是奇", source: "《五言独步》", explain: "命局以有病有药为贵，四平八稳未必为奇。关键是病药相济、用神得力。\", category: \"格局", difficulty: "精通" },

  // ═══════════════════════════════════════════
  // 九月 · 戌月（季秋）· 燥土入库主题
  // 本月口诀侧重：墓库开闭、神煞进阶、流年应期
  // ═══════════════════════════════════════════
  { date: "9-1", text: "戌为火库，又为深秋燥土", source: "《三命通会》", explain: "戌月为九月，季秋之时。戌中藏辛丁戊，为火之墓库。戌土燥热，秋末之燥。\", category: \"天干地支", difficulty: "进阶" },
  { date: "9-2", text: "九月甲木，木性枯槁", source: "《穷通宝鉴》", explain: "九月（戌月）戌为燥土，甲木之根被焦。先用壬水润土滋木，次用庚金修剪。\", category: \"用神", difficulty: "进阶" },
  { date: "9-3", text: "九月戊土，先用甲木", source: "《穷通宝鉴》", explain: "九月戌土当令，土重为患。先用甲木疏通，次用癸水滋润。木疏土、水润土。\", category: \"用神", difficulty: "进阶" },
  { date: "9-4", text: "墓库逢冲则开，库中物出", source: "《三命通会》", explain: "墓库（辰戌丑未）遇冲则库门打开，库中所藏之物（财官印食等）得以透出。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "9-5", text: "财库逢冲，富中求富", source: "《渊海子平》", explain: "日主之财库（如甲日主见辰为财库）逢冲动，主财运变动。喜用冲开则发富。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "9-6", text: "官库逢冲，职位更动", source: "《渊海子平》", explain: "官星之墓库逢冲动，主官职变动。若官为喜用而冲开，则升迁有望。\", category: \"大运流年", difficulty: "进阶" },
  { date: "9-7", text: "红鸾天喜，婚庆之神", source: "《三命通会》", explain: "红鸾天喜入命或入流年，主婚姻喜庆之事。卯起红鸾、酉起天喜，按年支顺逆排。\", category: \"神煞", difficulty: "进阶" },
  { date: "9-8", text: "孤辰寡宿，婚姻迟滞", source: "《三命通会》", explain: "孤辰寡宿入命，主婚姻迟缓、夫妻缘薄。寅卯辰年生人孤辰在巳、寡宿在丑。\", category: \"神煞", difficulty: "进阶" },
  { date: "9-9", text: "阴阳差错，婚姻不顺", source: "《渊海子平》", explain: "日柱为阴阳差错日者，主婚姻多波折、夫妻不睦。丙子丁丑等十二日为阴阳差错。\", category: \"神煞", difficulty: "进阶" },
  { date: "9-10", text: "金舆者，车马之神", source: "《三命通会》", explain: "金舆入命主得交通便利、出行豪华。金舆以日干查地支，以禄前二位为金舆。\", category: \"神煞", difficulty: "进阶" },
  { date: "9-11", text: "学堂词馆，文星入命", source: "《三命通会》", explain: "学堂词馆入命主学业出众、科举有成。以日干查纳音长生位为学堂。\", category: \"神煞", difficulty: "精通" },
  { date: "9-12", text: "流年遇天乙贵人，逢凶化吉", source: "《渊海子平》", explain: "流年地支若为命主天乙贵人，一年之中多有贵人相助，遇事可逢凶化吉。\", category: \"神煞", difficulty: "入门" },
  { date: "9-13", text: "流年犯太岁，宜安分守己", source: "《渊海子平》", explain: "流年地支与命局年支相同为值太岁，宜低调守成。本命年多变动，慎之。\", category: \"大运流年", difficulty: "入门" },
  { date: "9-14", text: "流年冲太岁，变动最大", source: "《渊海子平》", explain: "流年地支冲命局年支为冲太岁，变动最为剧烈。主搬家、换工作等重大变动。\", category: \"大运流年", difficulty: "进阶" },
  { date: "9-15", text: "流年刑太岁，是非纠缠", source: "《渊海子平》", explain: "流年地支刑命局年支，主口舌是非、官司缠身。寅巳申、丑戌未等为三刑。\", category: \"大运流年", difficulty: "进阶" },
  { date: "9-16", text: "流年害太岁，小人暗算", source: "《渊海子平》", explain: "流年地支与年支相害，主遭小人暗算、背后中伤。六害之中，子未害等。\", category: \"大运流年", difficulty: "进阶" },
  { date: "9-17", text: "岁运遇空亡，万事成空", source: "《三命通会》", explain: "流年或大运逢空亡，主所谋之事难成。空亡为虚而不实之象，宜观望。\", category: \"神煞", difficulty: "进阶" },
  { date: "9-18", text: "旬中空亡，以日柱定", source: "《渊海子平》", explain: "空亡以日柱所在之旬推算。如甲子旬中戌亥空，甲子日生人命局或岁运见戌亥为空。\", category: \"神煞", difficulty: "进阶" },
  { date: "9-19", text: "空亡逢冲则实，逢合亦实", source: "《三命通会》", explain: "空亡被冲或被合则填实而起作用。空亡遇冲合之时，虚变为实。\", category: \"神煞", difficulty: "精通" },
  { date: "9-20", text: "魁罡入命，性刚多智", source: "《三命通会》", explain: "庚辰、庚戌、壬辰、戊戌四日为魁罡日。魁罡日生人，性格刚强，聪明果断。\", category: \"神煞", difficulty: "进阶" },
  { date: "9-21", text: "魁罡日生人，忌见财官", source: "《三命通会》", explain: "魁罡格喜身旺不喜财官。魁罡逢财官则破格，主人贪财恋权而损刚锐之气。\", category: \"格局", difficulty: "进阶" },
  { date: "9-22", text: "金神入格，破败祖业", source: "《渊海子平》", explain: "金神为癸酉、己巳、乙丑三时。金神格须火制方贵，无火制则破败。\", category: \"格局", difficulty: "进阶" },
  { date: "9-23", text: "金神入火乡，富贵天下响", source: "《渊海子平》", explain: "金神格行火运（火制金），富贵显达。金神须烈火锻炼方能成器。\", category: \"大运流年", difficulty: "进阶" },
  { date: "9-24", text: "日贵格，丁酉丁亥癸巳癸卯", source: "《三命通会》", explain: "丁酉、丁亥、癸巳、癸卯四日为日贵格。日坐天乙贵人，主福禄深厚、贵人相助。\", category: \"格局", difficulty: "进阶" },
  { date: "9-25", text: "日德格，甲寅戊辰丙辰等", source: "《三命通会》", explain: "甲寅、戊辰、丙辰、庚辰、壬戌五日为日德格。日德格主人品端正、福泽绵长。\", category: \"格局", difficulty: "进阶" },
  { date: "9-26", text: "十恶大败日，百事不宜", source: "《渊海子平》", explain: "甲辰乙巳等十日为十恶大败日。此日生人，做事多不成，财运波折。\", category: \"神煞", difficulty: "进阶" },
  { date: "9-27", text: "孤鸾日，婚姻多舛", source: "《渊海子平》", explain: "甲寅、乙巳、丙午、丁巳等为孤鸾日。女命逢之，婚姻多有波折，夫妻缘浅。\", category: \"神煞", difficulty: "进阶" },
  { date: "9-28", text: "八专日，淫欲之象", source: "《渊海子平》", explain: "甲寅、乙卯、丁未等为八专日。八专日生人欲望强，感情纠葛多，需以德自持。\", category: \"神煞", difficulty: "进阶" },
  { date: "9-29", text: "九丑日，妨害之期", source: "《渊海子平》", explain: "丁卯、己卯、辛卯等为九丑日。九丑日逢之，多有不美之事，宜谨慎行事。\", category: \"神煞", difficulty: "进阶" },
  { date: "9-30", text: "五行正旺，各有时令", source: "《三命通会》", explain: "春木旺、夏火旺、秋金旺、冬水旺，四季未各十八日土旺。知旺衰方能论命。\", category: \"天干地支", difficulty: "入门" },

  // ═══════════════════════════════════════════
  // 十月 · 亥月（孟冬）· 壬水主题
  // 本月口诀侧重：壬水特性、流年应期、大运进阶
  // ═══════════════════════════════════════════
  { date: "10-1", text: "壬水通河，能泄金气", source: "《滴天髓》", explain: "壬水为江河之水，流通天下，能泄去金的肃杀之气。壬水为阳水，浩浩荡荡。\", category: \"天干地支", difficulty: "入门" },
  { date: "10-2", text: "刚中之德，周流不滞", source: "《滴天髓》", explain: "壬水外柔内刚，流动不居。其德如君子之中庸，周流六虚而不滞留一处。\", category: \"天干地支", difficulty: "进阶" },
  { date: "10-3", text: "通根透癸，冲天奔地", source: "《滴天髓》", explain: "壬水得癸水相助且通根，则水势滔天，可冲天奔地。壬水得根最喜流向。\", category: \"用神", difficulty: "进阶" },
  { date: "10-4", text: "化则有情，从则相济", source: "《滴天髓》", explain: "壬水见丁合化为木（丁壬合木），化则有情。壬水若从旺势，则众神相济。\", category: \"格局", difficulty: "进阶" },
  { date: "10-5", text: "十月壬水，建禄于亥", source: "《穷通宝鉴》", explain: "十月（亥月）壬水当令建禄，水势正旺。先用戊土为堤防，次用丙火调候暖局。\", category: \"用神", difficulty: "入门" },
  { date: "10-6", text: "壬水十月，戊丙两透", source: "《穷通宝鉴》", explain: "十月壬水专以戊土制水之泛滥，丙火调候暖局。戊丙双透者，富贵双全。\", category: \"用神", difficulty: "进阶" },
  { date: "10-7", text: "亥为水之临官，壬之禄地", source: "《三命通会》", explain: "亥中藏壬甲。亥为壬水之禄地，又是甲木之长生。亥宫水木相生，流动不居。\", category: \"天干地支", difficulty: "进阶" },
  { date: "10-8", text: "亥卯未三合木局，水泄于木", source: "《三命通会》", explain: "壬水日主地支亥卯未三合木局，水泄于木（食伤）。若身强则泄秀为佳。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "10-9", text: "水盛木浮，随波逐流", source: "《三命通会》", explain: "水太过旺而木弱无根，则木被水冲漂，不能固定。比劫过旺则食伤漂浮。\", category: \"用神", difficulty: "进阶" },
  { date: "10-10", text: "流年为君，大运为臣", source: "《三命通会》", explain: "流年为一岁之主宰（君），大运为十年之辅佐（臣）。君臣相得则吉，相战则凶。\", category: \"大运流年", difficulty: "进阶" },
  { date: "10-11", text: "运吉岁凶，小灾而已", source: "《渊海子平》", explain: "大运吉利而流年不吉，仅是小波折。大运为根本，流年为枝叶，根本固则枝叶摇不危。\", category: \"大运流年", difficulty: "进阶" },
  { date: "10-12", text: "运凶岁吉，似是而非", source: "《渊海子平》", explain: "大运凶而流年吉，表面的好只是暂时的。大运大势已去，流年之吉难挽大局。\", category: \"大运流年", difficulty: "进阶" },
  { date: "10-13", text: "岁运并临，人生大转折", source: "《三命通会》", explain: "大运与流年干支相同为岁运并临，是人生中最重大的转折点。吉则大吉，凶则大凶。\", category: \"大运流年", difficulty: "精通" },
  { date: "10-14", text: "岁运天克地冲，变动非常", source: "《三命通会》", explain: "流年与大运天干相克、地支相冲，为天克地冲。一年之中变动异常剧烈。\", category: \"大运流年", difficulty: "精通" },
  { date: "10-15", text: "流年逢合，牵动全局", source: "《三命通会》", explain: "流年与命局干支相合，称为合动。合则牵制，影响相关宫位和十神的吉凶。\", category: \"大运流年", difficulty: "进阶" },
  { date: "10-16", text: "流年逢三合局，群集而动", source: "《三命通会》", explain: "流年地支与命局构成三合局，三合则众志成城，力量集中，吉凶响应更为显著。\", category: \"大运流年", difficulty: "进阶" },
  { date: "10-17", text: "用神到位之年，腾达之岁", source: "《渊海子平》", explain: "流年干支为命局用神，或生扶用神，为用神到位。此年事业顺利，心想事成。\", category: \"大运流年", difficulty: "进阶" },
  { date: "10-18", text: "忌神当值之年，困顿之期", source: "《渊海子平》", explain: "流年干支为命局忌神，此年诸事不顺，宜保守待时。等忌神年过方有转机。\", category: \"大运流年", difficulty: "进阶" },
  { date: "10-19", text: "喜神旺相之年，万事亨通", source: "《三命通会》", explain: "流年生旺命局喜神，此年可大可小。喜神得势，事业财运皆有进展。\", category: \"大运流年", difficulty: "进阶" },
  { date: "10-20", text: "从儿不论身强弱，只要吾儿又生儿", source: "《滴天髓》", explain: "从儿格（从食伤）不重日主强弱，关键在食伤能再生财星。流通有情为上。\", category: \"格局", difficulty: "精通" },
  { date: "10-21", text: "从儿格最喜吾儿又生儿", source: "《滴天髓》", explain: "从食伤格最喜食伤又能生财。食伤（儿）、财（儿之儿）流转，富贵之格。\", category: \"格局", difficulty: "精通" },
  { date: "10-22", text: "润下格，壬癸水至亥子丑", source: "《三命通会》", explain: "壬癸水日主生于亥子丑月，地支会水局或水势专旺，为润下格。水润万物。\", category: \"格局", difficulty: "进阶" },
  { date: "10-23", text: "润下格忌土来混水", source: "《三命通会》", explain: "润下格水势专旺，最忌土来制水混杂。土混清水则水不清，格局受损。\", category: \"格局", difficulty: "进阶" },
  { date: "10-24", text: "稼穑格，戊己土至辰戌丑未", source: "《三命通会》", explain: "戊己土日主生于辰戌丑未月，地支土旺，为稼穑格。土主信，为人厚重。\", category: \"格局", difficulty: "进阶" },
  { date: "10-25", text: "曲直格，甲乙木至寅卯辰", source: "《三命通会》", explain: "甲乙木日主生于寅卯辰月，地支会木局，为曲直格。木主仁，为人正直。\", category: \"格局", difficulty: "进阶" },
  { date: "10-26", text: "炎上格，丙丁火至巳午未", source: "《三命通会》", explain: "丙丁火日主生于巳午未月，地支会火局，为炎上格。火主礼，为人热情。\", category: \"格局", difficulty: "进阶" },
  { date: "10-27", text: "从革格，庚辛金至申酉戌", source: "《三命通会》", explain: "庚辛金日主生于申酉戌月，地支会金局，为从革格。金主义，为人刚正。\", category: \"格局", difficulty: "进阶" },
  { date: "10-28", text: "壬骑龙背，辰多见之", source: "《渊海子平》", explain: "壬辰日生人地支辰多见，为壬骑龙背格。壬水坐辰为水库，水得归库而有制。\", category: \"格局", difficulty: "进阶" },
  { date: "10-29", text: "六壬趋艮，寅多见之", source: "《渊海子平》", explain: "壬水日主地支寅多见，为六壬趋艮格。寅为甲木食神之禄，泄壬水之秀。\", category: \"格局", difficulty: "进阶" },
  { date: "10-30", text: "六甲趋乾，亥多见之", source: "《渊海子平》", explain: "甲木日主地支亥多见，为六甲趋乾格。亥为甲之长生，木得水滋养。\", category: \"格局", difficulty: "进阶" },
  { date: "10-31", text: "三奇贵人，天上地下人中", source: "《三命通会》", explain: "天上三奇甲戊庚，地下三奇乙丙丁，人中三奇壬癸辛。三奇入命，聪慧过人。\", category: \"神煞", difficulty: "进阶" },

  // ═══════════════════════════════════════════
  // 十一月 · 子月（仲冬）· 癸水主题
  // 本月口诀侧重：癸水特性、十神详解、综合要诀
  // ═══════════════════════════════════════════
  { date: "11-1", text: "癸水至弱，达于天津", source: "《滴天髓》", explain: "癸水为雨露之水，柔和滋润，能上达天庭。癸水虽柔却能渗透万物、润物无声。\", category: \"天干地支", difficulty: "入门" },
  { date: "11-2", text: "得龙而运，功化斯神", source: "《滴天髓》", explain: "癸水得辰（龙）为水库，则能运化万物。辰为癸水之库，得库则源远流长。\", category: \"用神", difficulty: "进阶" },
  { date: "11-3", text: "不愁火土，不论庚辛", source: "《滴天髓》", explain: "癸水至柔，不惧火土之克，也不依赖庚辛之生。其性独立，弱中带韧。\", category: \"天干地支", difficulty: "进阶" },
  { date: "11-4", text: "合戊见火，化象斯真", source: "《滴天髓》", explain: "癸水与戊土合化火，须见火助化方为真化。戊癸合火为无情之合，化则成格。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "11-5", text: "十一月癸水，建禄于子", source: "《穷通宝鉴》", explain: "十一月（子月）癸水当令建禄，水寒冻。先用丙火解冻，次用甲木生火。\", category: \"用神", difficulty: "入门" },
  { date: "11-6", text: "癸水十一月，丙甲为要", source: "《穷通宝鉴》", explain: "十一月癸水严寒，丙火调候解冻、甲木生火。丙甲双透，寒谷回春之象。\", category: \"用神", difficulty: "进阶" },
  { date: "11-7", text: "子为坎卦，水之正位", source: "《三命通会》", explain: "子在八卦属坎，为水之正位。子中独藏癸水，为四正之神中最纯者。\", category: \"天干地支", difficulty: "入门" },
  { date: "11-8", text: "子午卯酉，四正方也", source: "《三命通会》", explain: "子午卯酉分居北南东西四正方，各专一气。四正神纯而不杂，力量集中。\", category: \"天干地支", difficulty: "入门" },
  { date: "11-9", text: "子为墨池，文章之府", source: "《三命通会》", explain: "子水为墨池之象，主文采。子水入命，多才思敏捷、文笔出众。\", category: \"天干地支", difficulty: "进阶" },
  { date: "11-10", text: "正财乃我克之有情者", source: "《子平真诠》", explain: "正财为我克而阴阳相异者（如甲见己）。正财为劳动所得之财，正当稳当。\", category: \"十神", difficulty: "入门" },
  { date: "11-11", text: "偏财乃我克之无情者", source: "《子平真诠》", explain: "偏财为我克而阴阳相同者（如甲见戊）。偏财为横财、众人之财，大方慷慨。\", category: \"十神", difficulty: "入门" },
  { date: "11-12", text: "财星为养命之源", source: "《渊海子平》", explain: "财星是维持生活的基础。无财则不能养命。但财不可太多，多则身弱不胜。\", category: \"十神", difficulty: "入门" },
  { date: "11-13", text: "财多身弱，富屋贫人", source: "《渊海子平》", explain: "财星虽多但日主衰弱不能承受，如同住在富屋中的穷人。财多不胜反为祸。\", category: \"十神", difficulty: "进阶" },
  { date: "11-14", text: "身强财旺，天下富翁", source: "《渊海子平》", explain: "日主强旺又财星旺相，是真正的富翁之命。身强能任财，富甲一方。\", category: \"十神", difficulty: "进阶" },
  { date: "11-15", text: "比劫夺财，财来财去", source: "《渊海子平》", explain: "比肩劫财多则争夺财星，钱财得而复失。比劫为分财之物，宜制之。\", category: \"十神", difficulty: "进阶" },
  { date: "11-16", text: "官星护财，财不流失", source: "《子平真诠》", explain: "正官能克制比劫，保护财星不被争夺。有官护财，财富方能守住。\", category: \"十神", difficulty: "进阶" },
  { date: "11-17", text: "印星为生我之神，如母之德", source: "《子平真诠》", explain: "印星生我护我，如母亲之慈爱。印为用者，得长辈庇护，福泽深厚。\", category: \"十神", difficulty: "入门" },
  { date: "11-18", text: "印多则塞，智慧不开", source: "《渊海子平》", explain: "印星过多则闭塞不通，反使智慧不能开窍。印多如母多溺爱，令人依赖。\", category: \"十神", difficulty: "进阶" },
  { date: "11-19", text: "食神生财，财有源头", source: "《子平真诠》", explain: "食神能生财，使财有源源不断的来源。食神为智慧技艺，以智慧生财为上。\", category: \"十神", difficulty: "进阶" },
  { date: "11-20", text: "伤官生财，以才致富", source: "《渊海子平》", explain: "伤官代表特殊才华，伤官生财为以才艺致富。但伤官心高气傲，需配印方稳。\", category: \"十神", difficulty: "进阶" },
  { date: "11-21", text: "克我者为官杀，我克者为财", source: "《渊海子平》", explain: "十神基本定义：克我者为官杀（管束），我克者为财（掌控）。生克定十神关系。\", category: \"十神", difficulty: "入门" },
  { date: "11-22", text: "生我者为印绶，我生者为食伤", source: "《渊海子平》", explain: "生我者为印绶（庇护），我生者为食伤（表达）。五行生克决定十神属性。\", category: \"十神", difficulty: "入门" },
  { date: "11-23", text: "同我者为比劫，异我者为财官", source: "《渊海子平》", explain: "与我同类为比劫（兄弟姐妹），阴阳相异者再分财官印食等。干支分阴阳以辨十神。\", category: \"十神", difficulty: "入门" },
  { date: "11-24", text: "月上正官，无冲无破为贵", source: "《渊海子平》", explain: "月令正官，不逢冲克刑伤，格局清纯。官星得令，贵气天成。\", category: \"格局", difficulty: "进阶" },
  { date: "11-25", text: "时上一位贵，晚年荣华", source: "《渊海子平》", explain: "时柱上只有一位正官或七杀（有制），主晚年有贵人提携，晚运荣华。\", category: \"格局", difficulty: "进阶" },
  { date: "11-26", text: "乙木子月，寒木向阳", source: "《穷通宝鉴》", explain: "乙木生于子月严寒，最喜丙火暖局。寒木不向阳则不生发，丙为乙之子月恩星。\", category: \"用神", difficulty: "进阶" },
  { date: "11-27", text: "子丑合化土，水土混杂", source: "《三命通会》", explain: "子丑相合，子水与丑土合化为土。子丑合主绊住，水被土混则不清。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "11-28", text: "子未相害，北南相妨", source: "《三命通会》", explain: "子水与未土相害，水被燥土所伤。子未害主因财富或人际关系产生妨害。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "11-29", text: "用神随运而变，非一成不变", source: "《三命通会》", explain: "用神在不同大运中可能发生变化。原局用神在某一运中可能变成忌神。\", category: \"大运流年", difficulty: "精通" },
  { date: "11-30", text: "命局如舟，大运如江河", source: "《三命通会》", explain: "原命局如一条船，大运如行驶的江河。船好也要河顺，船差在顺流中也能前行。\", category: \"大运流年", difficulty: "进阶" },

  // ═══════════════════════════════════════════
  // 十二月 · 丑月（季冬）· 湿土主题
  // 本月口诀侧重：综合要诀、纳音进阶、总结归纳
  // ═══════════════════════════════════════════
  { date: "12-1", text: "丑为金库，又为湿土", source: "《三命通会》", explain: "丑月为十二月，季冬之时。丑中藏癸辛己，为金之墓库。丑土湿润，内含金水之气。\", category: \"天干地支", difficulty: "进阶" },
  { date: "12-2", text: "十二月甲木，天寒地冻", source: "《穷通宝鉴》", explain: "十二月（丑月）天寒地冻，甲木生机潜伏。必先用丙丁火解冻暖局，次用庚金。\", category: \"用神", difficulty: "进阶" },
  { date: "12-3", text: "十二月丙火，失令衰弱", source: "《穷通宝鉴》", explain: "十二月丙火失令，火气衰弱至极。先用甲木生火，再用戊土制水护火。\", category: \"用神", difficulty: "进阶" },
  { date: "12-4", text: "丑为艮卦，止也", source: "《三命通会》", explain: "丑在八卦属艮，为止、为山。丑月为岁末，万物归藏，止而待发。\", category: \"天干地支", difficulty: "进阶" },
  { date: "12-5", text: "丑午相害，湿燥相妨", source: "《三命通会》", explain: "丑为湿土、午为燥火，丑午相害则湿燥不调。主身体不适或人事不睦。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "12-6", text: "巳酉丑三合金局，丑为金库", source: "《三命通会》", explain: "巳酉丑三合金局，丑在其中为金之墓库。金气归根入库，深藏不露。\", category: \"刑冲合害", difficulty: "进阶" },
  { date: "12-7", text: "壬寅癸卯金箔金", source: "《三命通会》", explain: "壬寅癸卯纳音为金箔金，如箔上之薄金，虽薄却有光彩。主外表华丽、言辞动听。\", category: \"纳音", difficulty: "入门" },
  { date: "12-8", text: "庚戌辛亥钗钏金", source: "《三命通会》", explain: "庚戌辛亥纳音为钗钏金，如首饰之金，贵重精美。主精致生活、品味高雅。\", category: \"纳音", difficulty: "入门" },
  { date: "12-9", text: "戊申己酉大驿土", source: "《三命通会》", explain: "戊申己酉纳音为大驿土，如驿站之土，人来人往。主交际广泛、事业多变。\", category: \"纳音", difficulty: "入门" },
  { date: "12-10", text: "丙辰丁巳沙中土", source: "《三命通会》", explain: "丙辰丁巳纳音为沙中土，如沙中之土，松散不凝。主不拘小节、随遇而安。\", category: \"纳音", difficulty: "入门" },
  { date: "12-11", text: "甲寅乙卯大溪水", source: "《三命通会》", explain: "甲寅乙卯纳音为大溪水，如山间溪流，清澈湍急。主性情爽快、目标明确。\", category: \"纳音", difficulty: "入门" },
  { date: "12-12", text: "壬子癸丑桑柘木", source: "《三命通会》", explain: "壬子癸丑纳音为桑柘木，如桑树之木，柔韧有用。主实用主义、脚踏实地。\", category: \"纳音", difficulty: "入门" },
  { date: "12-13", text: "庚申辛酉石榴木", source: "《三命通会》", explain: "庚申辛酉纳音为石榴木，如石榴之木，多子多福。主家庭兴旺、子孙昌盛。\", category: \"纳音", difficulty: "入门" },
  { date: "12-14", text: "戊午己未天上火", source: "《三命通会》", explain: "戊午己未纳音为天上火，如太阳之光，普照大地。主光明磊落、志向远大。\", category: \"纳音", difficulty: "入门" },
  { date: "12-15", text: "丙戌丁亥屋上土", source: "《三命通会》", explain: "丙戌丁亥纳音为屋上土，如屋顶之瓦土，遮风挡雨。主安居乐业、家庭为重。\", category: \"纳音", difficulty: "入门" },
  { date: "12-16", text: "六十花甲纳音，各有所主", source: "《三命通会》", explain: "六十甲子各有纳音五行，代表不同的人生禀赋。纳音为身命之根基。\", category: \"纳音", difficulty: "进阶" },
  { date: "12-17", text: "命好不如运好，运好不如心好", source: "《三命通会》", explain: "命好不如大运走得好，大运好不如心地好。心善可补命局之不足。\", category: \"大运流年", difficulty: "入门" },
  { date: "12-18", text: "一命二运三风水，四积阴德五读书", source: "《渊海子平》", explain: "影响人生的五大因素：命（先天）、运（后天大运）、风水、阴德、读书。命运并非唯一。\", category: \"格局", difficulty: "入门" },
  { date: "12-19", text: "命局有定数，大运有变数", source: "《三命通会》", explain: "原命局是固定不变的（定数），大运流年是变化的（变数）。知命改运之道即在变数中。\", category: \"大运流年", difficulty: "进阶" },
  { date: "12-20", text: "知进退存亡而不失其正者，其唯圣人乎", source: "《滴天髓》", explain: "知道何时进退、何时存亡而不偏离正道的人，是真正的智者。学命之终极境界。\", category: \"格局", difficulty: "精通" },
  { date: "12-21", text: "五行之性，各有所偏", source: "《三命通会》", explain: "木偏于仁、火偏于礼、土偏于信、金偏于义、水偏于智。五行均衡为上。\", category: \"天干地支", difficulty: "进阶" },
  { date: "12-22", text: "太过则偏，不及则弱", source: "《滴天髓》", explain: "五行太多则偏颇（木多则顽固），五行太少则衰弱（金少则无义）。中和为贵。\", category: \"用神", difficulty: "进阶" },
  { date: "12-23", text: "中和者，命理之至境", source: "《滴天髓》", explain: "命局五行中和、寒暖适度、燥湿调和，是命理追求的最高境界。但少有完美之命。\", category: \"用神", difficulty: "精通" },
  { date: "12-24", text: "顺逆之用，存乎一心", source: "《子平真诠》", explain: "命局的顺用（吉神生护）与逆用（凶神克制），全在论命者的分析与判断。\", category: \"格局", difficulty: "精通" },
  { date: "12-25", text: "子平之法，以日为主", source: "《渊海子平》", explain: "子平术以日干（日元）为中心，配合月令取格，再论其余干支十神生克关系。\", category: \"格局", difficulty: "入门" },
  { date: "12-26", text: "财官子平，格局为先", source: "《渊海子平》", explain: "子平术重财官等十神，而取格局为第一要务。格局定则命局层次可知。\", category: \"格局", difficulty: "入门" },
  { date: "12-27", text: "五行生克为体，十神为用", source: "《子平真诠》", explain: "五行相生相克是命理的根本，十神（财官印食等）是五行生克的具体应用。\", category: \"十神", difficulty: "进阶" },
  { date: "12-28", text: "命理如医理，望闻问切而后辨", source: "《神峰通考》", explain: "论命如同看病，需全面审察（望闻问切）后方能判断。不可片面下结论。\", category: \"格局", difficulty: "进阶" },
  { date: "12-29", text: "四言独步：子平之法，以日为主", source: "《四言独步》", explain: "四言独步开篇即明子平术以日干为中心。日干为命主，其余皆为日干之十神。\", category: \"格局", difficulty: "进阶" },
  { date: "12-30", text: "五言独步：三奇与三合，格局仔细推", source: "《五言独步》", explain: "三奇贵人、三合局等特殊组合，需要仔细推敲格局才能真正断准。\", category: \"格局", difficulty: "精通" },
  { date: "12-31", text: "易道深远，命理无穷。知命者不惑，知时者不困。", source: "《易道智鉴》", explain: "命理之学如易道般深远无穷。知命之人不迷惑，知时令之人不困顿。此为学命之终极意义。\", category: \"格局", difficulty: "精通" },

];

// ============================================================
// 工具函数
// ============================================================

/**
 * 根据月份和日期获取当日口诀
 * @param {number} month - 月份（1-12）
 * @param {number} day - 日期（1-31）
 * @returns {object} 口诀条目对象
 */
function getDailyKoujue(month, day) {
  const dateKey = month + "-" + day;
  const entry = KOUJUE_DAILY_DATABASE.find(e => e.date === dateKey);
  if (entry) return entry;

  // 如果当天没有对应条目（如2月30日），回退到该月最后一条
  const monthEntries = KOUJUE_DAILY_DATABASE.filter(e => e.date.startsWith(month + "-"));
  return monthEntries.length > 0 ? monthEntries[monthEntries.length - 1] : KOUJUE_DAILY_DATABASE[0];
}

/**
 * 获取某月所有口诀
 * @param {number} month - 月份（1-12）
 * @returns {array} 该月所有口诀条目
 */
function getKoujueByMonth(month) {
  return KOUJUE_DAILY_DATABASE.filter(e => e.date.startsWith(month + "-"));
}

/**
 * 按分类筛选口诀
 * @param {string} category - 分类名称（天干地支/十神/格局/用神/大运流年/神煞/纳音/刑冲合害）
 * @returns {array} 匹配的口诀条目
 */
function filterByCategory(category) {
  if (!category) return KOUJUE_DAILY_DATABASE;
  return KOUJUE_DAILY_DATABASE.filter(e => e.category === category);
}

/**
 * 随机获取一条口诀
 * @returns {object} 随机口诀条目
 */
function getRandomKoujue() {
  const idx = Math.floor(Math.random() * KOUJUE_DAILY_DATABASE.length);
  return KOUJUE_DAILY_DATABASE[idx];
}

/**
 * 搜索口诀（按关键词搜索text/explain/source字段）
 * @param {string} keyword - 搜索关键词
 * @returns {array} 匹配的口诀条目
 */
function searchKoujue(keyword) {
  if (!keyword) return KOUJUE_DAILY_DATABASE;
  const kw = keyword.toLowerCase();
  return KOUJUE_DAILY_DATABASE.filter(e =>
    e.text.includes(keyword) ||
    e.explain.includes(keyword) ||
    e.source.includes(keyword) ||
    e.category.includes(keyword)
  );
}

/**
 * 按难度筛选口诀
 * @param {string} difficulty - 难度级别（入门/进阶/精通）
 * @returns {array} 匹配的口诀条目
 */
function filterByDifficulty(difficulty) {
  if (!difficulty) return KOUJUE_DAILY_DATABASE;
  return KOUJUE_DAILY_DATABASE.filter(e => e.difficulty === difficulty);
}

/**
 * 按来源筛选口诀
 * @param {string} source - 来源书名关键词
 * @returns {array} 匹配的口诀条目
 */
function filterBySource(source) {
  if (!source) return KOUJUE_DAILY_DATABASE;
  return KOUJUE_DAILY_DATABASE.filter(e => e.source.includes(source));
}

/**
 * 获取所有分类列表
 * @returns {array} 分类名称数组
 */
function getAllCategories() {
  const cats = new Set(KOUJUE_DAILY_DATABASE.map(e => e.category));
  return Array.from(cats);
}

/**
 * 获取统计信息
 * @returns {object} 统计信息（总条数、各分类条数、各难度条数、各来源条数）
 */
function getStatistics() {
  const stats = { total: KOUJUE_DAILY_DATABASE.length, byCategory: {}, byDifficulty: {}, bySource: {} };
  KOUJUE_DAILY_DATABASE.forEach(e => {
    stats.byCategory[e.category] = (stats.byCategory[e.category] || 0) + 1;
    stats.byDifficulty[e.difficulty] = (stats.byDifficulty[e.difficulty] || 0) + 1;
    const src = e.source.replace(/[《》]/g, '');
    stats.bySource[src] = (stats.bySource[src] || 0) + 1;
  });
  return stats;
}

/**
 * 格式化口诀为易读文本
 * @param {object} entry - 口诀条目
 * @returns {string} 格式化文本
 */
function formatKoujue(entry) {
  if (!entry) return '';
  return [
    `📅 ${entry.date}`,
    `📖 ${entry.text}`,
    `📚 出处：${entry.source}`,
    `💡 释义：${entry.explain}`,
    `🏷️ 分类：${entry.category} | 难度：${entry.difficulty}`,
  ].join('\n');
}

/**
 * 按多条件组合筛选口诀
 * @param {object} filters - 筛选条件 { category, difficulty, source, keyword, month }
 * @returns {array} 匹配的口诀条目
 */
function advancedFilter(filters = {}) {
  let result = KOUJUE_DAILY_DATABASE;

  if (filters.category) {
    result = result.filter(e => e.category === filters.category);
  }
  if (filters.difficulty) {
    result = result.filter(e => e.difficulty === filters.difficulty);
  }
  if (filters.source) {
    result = result.filter(e => e.source.includes(filters.source));
  }
  if (filters.keyword) {
    const kw = filters.keyword;
    result = result.filter(e =>
      e.text.includes(kw) || e.explain.includes(kw) || e.source.includes(kw)
    );
  }
  if (filters.month) {
    result = result.filter(e => e.date.startsWith(filters.month + "-"));
  }

  return result;
}

// ============================================================
// 导出
// ============================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    KOUJUE_DAILY_DATABASE,
    getDailyKoujue,
    getKoujueByMonth,
    filterByCategory,
    getRandomKoujue,
    searchKoujue,
    filterByDifficulty,
    filterBySource,
    getAllCategories,
    getStatistics,
    formatKoujue,
    advancedFilter,
  };
}

// 如果直接运行脚本，输出统计信息
if (require.main === module) {
  const stats = getStatistics();
  console.log('═══ 易道智鉴 · 命理口诀数据库 ═══');
  console.log(`总条目：${stats.total} 条`);
  console.log('\n分类统计：');
  Object.entries(stats.byCategory).forEach(([k, v]) => console.log(`  ${k}: ${v} 条`));
  console.log('\n难度统计：');
  Object.entries(stats.byDifficulty).forEach(([k, v]) => console.log(`  ${k}: ${v} 条`));
  console.log('\n来源统计：');
  Object.entries(stats.bySource).forEach(([k, v]) => console.log(`  ${k}: ${v} 条`));
}
