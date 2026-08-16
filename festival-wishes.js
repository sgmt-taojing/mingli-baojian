#!/usr/bin/env node
// 易道智鉴 · 节气养生祝贺
// 仅在节气当天 + 国家法定假日生成,给客户/领导用
// 风格:高情商、古老智慧、不突出信仰、人际祝福
// 同时生成一张节令图片(调用 Seedream 文生图)

var FESTIVAL_2026 = {
  // 国家法定假日(国务院办公厅 2025-12-04 公布)
  '01-01': { name: '元旦', kind: 'holiday', theme: '岁新元亨',
    wish: '一元复始,万象更新。愿您在新的一年里,岁岁平安,事事顺遂。',
    img: '元旦日出,旭日初升,远山雪影,松枝覆霜,水墨写意,红色印章点缀' },
  '02-17': { name: '春节', kind: 'tradition', theme: '新春大吉',
    wish: '岁序常新,华章日启。恭祝您与家人新春吉祥,万事亨通,阖家安康。',
    img: '春节红灯笼与梅花,古朴庭院,孩童放鞭炮剪影,水墨国画,金色点缀' },
  '04-05': { name: '清明节', kind: 'tradition', theme: '气清景明',
    wish: '气清景明,万物皆显。愿您心境澄澈,步履从容,前路开阔。',
    img: '清明时节,烟雨江南,远山如黛,柳丝飘拂,水墨淡彩,安静祥和' },
  '05-01': { name: '劳动节', kind: 'holiday', theme: '勤耕致远',
    wish: '五一佳节,向每一位奋斗者致敬。愿您的耕耘都有回响,每份努力都被珍重。',
    img: '五月金黄麦田,远处劳动者剪影,夕阳暖光,写意油画风格' },
  '06-19': { name: '端午节', kind: 'tradition', theme: '安康吉祥',
    wish: '五月初五,端阳正午。祈愿您与家人安康常在,岁月静好,福气绵长。',
    img: '端午龙舟竞渡,碧水青山,艾草菖蒲悬挂,国风水墨' },
  '09-25': { name: '中秋节', kind: 'tradition', theme: '月圆人圆',
    wish: '月到中秋分外明,家国天下共团圆。愿您所念皆可圆,所行皆坦途。',
    img: '中秋满月,月下桂花树,兔儿剪影,玉兔捣药,水墨淡金' },
  '10-01': { name: '国庆节', kind: 'holiday', theme: '家国同庆',
    wish: '山河锦绣,国泰民安。恭祝您国庆安康,顺心顺意,喜乐常随。',
    img: '天安门广场国旗飘扬,牡丹盛开,金色阳光,写意中国画风格' },

  // 二十四节气(2026,仅日期,精确到日)
  '01-05': { name: '小寒', kind: 'jie', theme: '潜藏温养',
    wish: '小寒至,万物潜藏。宜温补养肾,早睡晚起,把日子过得慢一些、暖一些。',
    img: '小寒腊梅初开,雪压枝头,暖黄灯笼,写意水墨' },
  '01-20': { name: '大寒', kind: 'jie', theme: '岁末守静',
    wish: '大寒凛冬,岁末收束。宜守静蓄势,亲友围炉,静待春来。',
    img: '大寒飞雪,老树枯枝,远处屋舍炊烟升起,水墨寒色' },
  '02-04': { name: '立春', kind: 'jie', theme: '万物生发',
    wish: '立春万物苏,生机自此始。愿您新的一年目标明朗,脚步轻盈,处处逢春。',
    img: '立春柳丝抽芽,梅花点点,春风和煦,淡彩水墨' },
  '02-18': { name: '雨水', kind: 'jie', theme: '润物无声',
    wish: '雨水时节,润物如酥。愿您对人间的耐心与善意,终将一一得到回响。',
    img: '雨水时节,江南烟雨,水面涟漪,远山朦胧,淡彩水墨' },
  '03-05': { name: '惊蛰', kind: 'jie', theme: '春雷醒志',
    wish: '春雷一响,蛰虫始振。愿您心有所向,志有所立,行动有所成。',
    img: '惊蛰春雷,春笋破土而出,桃花含苞,写意国画' },
  '03-20': { name: '春分', kind: 'jie', theme: '平衡中和',
    wish: '春分,昼夜均而寒暑平。最难得的智慧,是忙中守度、张弛有度。',
    img: '春分海棠与玉兰同放,蝴蝶翩舞,暖阳春风,水墨淡彩' },
  '04-05': { name: '清明', kind: 'jie', theme: '气清景明',
    wish: '气清景明,万物皆显。愿您心境澄澈,步履从容,前路开阔。',
    img: '清明远山云雾,茶田嫩绿,雾气飘渺,水墨淡青' },
  '04-20': { name: '谷雨', kind: 'jie', theme: '雨生百谷',
    wish: '谷得雨而生,人得诚而达。愿您的每一份耕耘,都被时光温柔以待。',
    img: '谷雨时节,细雨润田,秧苗青绿,农舍远处,水墨写意' },
  '05-05': { name: '立夏', kind: 'jie', theme: '养心清夏',
    wish: '立夏,万物至此皆长大。愿您心境清凉,情绪安定,自在从容度长夏。',
    img: '立夏池塘新荷,蜻蜓立荷尖,暖风吹拂,淡彩水墨' },
  '05-21': { name: '小满', kind: 'jie', theme: '小得盈满',
    wish: '小满者,满而不盈。最好的状态,是将满未满,仍在向上生长。',
    img: '小满麦穗初黄,桑葚紫红,远处农人眺望,水墨' },
  '06-05': { name: '芒种', kind: 'jie', theme: '忙有所得',
    wish: '芒种,忙有所获。愿您忙而不乱,种下皆有收获,付出皆有回响。',
    img: '芒种麦收农忙,金黄麦浪,远处农舍,写意油画' },
  '06-21': { name: '夏至', kind: 'jie', theme: '阳极之盛',
    wish: '夏至阳极,万物繁茂。盛夏亦是最有力量的时节,愿您充实而丰盈。',
    img: '夏至荷塘盛开,蜻蜓与青蛙,莲叶田田,浓彩水墨' },
  '07-07': { name: '小暑', kind: 'jie', theme: '心静自凉',
    wish: '小暑至,心静自然凉。一杯清茶、一缕清风,足以安顿整个夏天。',
    img: '小暑凉亭品茗,远处蝉鸣树影,淡彩水墨' },
  '07-23': { name: '大暑', kind: 'jie', theme: '盛夏静心',
    wish: '大暑极热,最宜静心。愿您于喧闹中守一份清凉,于烈日下有一处阴凉。',
    img: '夏天大暑,荷花池塘,远山淡墨,写意水墨画风格' },
  '08-07': { name: '立秋', kind: 'jie', theme: '秋凉将至',
    wish: '立秋至,夏未央而秋已至。愿您早早绸缪,从容迎接收获之季。',
    img: '立秋梧桐落叶,远处荷塘残荷,秋蝉静息,水墨淡黄' },
  '08-23': { name: '处暑', kind: 'jie', theme: '暑去凉来',
    wish: '暑气渐止,秋凉将生。最舒服的状态,是切换得宜,懂得休整。',
    img: '处暑秋云渐起,远山清朗,稻穗初黄,水墨淡彩' },
  '09-07': { name: '白露', kind: 'jie', theme: '露凝而白',
    wish: '白露至,秋意浓。愿您衣着温暖,饮食润燥,气色从容。',
    img: '白露晨曦,芦苇上露珠晶莹,远处白鹤飞翔,水墨写意' },
  '09-23': { name: '秋分', kind: 'jie', theme: '平分秋色',
    wish: '秋分,昼夜等长。把岁月平分给热爱的事业与牵挂的人,便是圆满。',
    img: '秋分丹桂飘香,月下团圆,金色暖意,水墨淡彩' },
  '10-08': { name: '寒露', kind: 'jie', theme: '润燥养深',
    wish: '寒露至,宜润秋燥、养肺胃。愿您饮食有节,作息有时,安然过秋。',
    img: '寒露红叶初染,远山清寒,菊花盛开,水墨淡红' },
  '10-23': { name: '霜降', kind: 'jie', theme: '秋深气肃',
    wish: '霜降水返壑,风落木归山。岁晚宜收敛,宜珍藏,宜为新岁蓄力。',
    img: '霜降柿子挂枝头,红叶霜白,远处农舍炊烟,水墨' },
  '11-07': { name: '立冬', kind: 'jie', theme: '藏养之始',
    wish: '立冬,万物收藏。宜早睡早起,温补养藏,把身与心都安顿好。',
    img: '立冬初雪,老梅初绽,暖屋灯火,水墨淡彩' },
  '11-22': { name: '小雪', kind: 'jie', theme: '雪落可期',
    wish: '小雪至,可围炉煮茶,可静坐读书。一冬的安暖,从心静开始。',
    img: '小雪围炉煮茶,窗含雪意,红泥小炉,水墨暖意' },
  '12-07': { name: '大雪', kind: 'jie', theme: '岁寒情暖',
    wish: '大雪时节,万物收藏。愿您身边有暖意,岁寒有可亲,岁月有可期。',
    img: '大雪银装素裹,红梅盛开,远处雪屋暖灯,水墨' },
  '12-22': { name: '冬至', kind: 'jie', theme: '一阳初生',
    wish: '冬至阴极而阳生,是夜最长,亦是希望最长。愿您岁末圆满,新岁可期。',
    img: '冬至饺子飘香,远山雪影,家家灯火,写意水墨' },

  // ===== 儒道释/民俗节日补缺(2026 公历日期)=====

  // 民俗/感恩类
  '02-21': { name: '财神日', kind: 'folk', theme: '财源广进',
    wish: '正月初五迎财神,开市大吉。恭祝您新岁财运亨通,财来福至,事业日进斗金。',
    img: '财神金身端坐,元宝满筐,红绸高悬,写意年画' },
  '02-24': { name: '上元节', kind: 'dao', theme: '三元之上',
    wish: '上元佳节,天官赐福。值此灯月交辉之夜,恭祝您福禄寿喜齐至,家业团圆。',
    img: '上元夜灯火如昼,莲花灯浮于河面,远山朦胧,淡彩水墨' },
  '03-19': { name: '龙抬头', kind: 'folk', theme: '万物生发',
    wish: '二月初二龙抬头,春龙布雨福泽至。愿您鸿运当头,志气昂扬,事业一飞冲天。',
    img: '二月春龙抬头,桃花盛开,柳丝垂堤,淡彩水墨' },
  '03-21': { name: '文昌诞', kind: 'dao', theme: '文运昌隆',
    wish: '文昌帝君圣诞,主文运、功名。值此佳日,恭祝您与家人学业精进、仕途亨通。',
    img: '文昌帝君端坐案前,笔架如林,书卷翻飞,金光祥瑞' },
  '04-19': { name: '真武诞', kind: 'dao', theme: '北帝镇护',
    wish: '真武大帝圣诞,镇守北方,护国安民。恭祝您家宅平安,事业根基稳固,邪祟不侵。',
    img: '真武大帝脚踏龟蛇,云海苍茫,剑指苍穹,金光万道' },
  '05-09': { name: '妈祖诞', kind: 'folk', theme: '海国慈航',
    wish: '妈祖圣诞,海上护航。值此佳日,愿您前路风平浪静,贵人相助,所行皆化坦途。',
    img: '妈祖凤冠霞帔立船头,海天一色,祥云环绕,淡彩水墨' },
  '05-18': { name: '孟子诞', kind: 'ru', theme: '亚圣薪传',
    wish: '亚圣孟子圣诞,浩然正气长存。值此佳日,愿您与家人在传承中见精神,在正道上见前程。',
    img: '孟子讲学图,松柏挺立,弟子环坐,晨光初照' },
  '05-30': { name: '吕祖诞', kind: 'dao', theme: '剑仙济世',
    wish: '吕洞宾祖师圣诞,剑气文心两相宜。值此佳日,愿您身有侠气、心有诗情,万事从容。',
    img: '吕洞宾背剑立云端,仙鹤翔空,松涛阵阵,写意水墨' },
  '05-24': { name: '佛陀诞', kind: 'fo', theme: '法轮初转',
    wish: '浴佛佳节,净化身心。值此殊胜之日,恭祝您与家人身心安泰,常怀善念,福慧日增。',
    img: '佛诞日太子像,九龙灌顶,祥云缭绕,金光柔和' },
  '06-25': { name: '城隍诞', kind: 'dao', theme: '城隍护佑',
    wish: '城隍圣诞,护佑一方。值此佳日,恭祝您居处平安,出入顺遂,逢凶化吉。',
    img: '城隍庙飞檐翘角,红烛高照,百姓祈福,写意水墨' },
  '08-06': { name: '关帝诞', kind: 'ru', theme: '武圣忠义',
    wish: '关帝圣诞,忠义千秋。值此佳日,愿您以义立业、以信立人,事业兴隆、家业兴旺。',
    img: '关帝青龙偃月刀立马,忠义满胸膛,红日初升,金光耀眼' },
  '08-28': { name: '中元节', kind: 'fo', theme: '慎终追远',
    wish: '中元佳节,孝亲报恩。值此慎终追远之日,愿您承先人之德、启来日之程,家族兴旺。',
    img: '中元河灯万盏飘远,亲人遥祭,莲花点点,水墨淡青' },
  '08-29': { name: '七夕节', kind: 'folk', theme: '鹊桥相会',
    wish: '七夕佳节,鹊桥相会。值此浪漫之日,恭祝您与爱人琴瑟和鸣、家业圆满、情意绵长。',
    img: '七夕鹊桥银河,织女牛郎相会,葡萄架下,淡彩水墨' },
  '08-30': { name: '王母诞', kind: 'dao', theme: '瑶池金母',
    wish: '王母娘娘圣诞,瑶池蟠桃会。值此佳日,愿您福寿安康、桃李满门、心境如瑶池般澄明。',
    img: '西王母端坐瑶池,蟠桃盛会,仙鹤衔枝,金光柔和' },
  '10-07': { name: '孔子诞', kind: 'ru', theme: '万世师表',
    wish: '至圣先师孔子圣诞,文脉永续。值此佳日,愿您与家人以仁立身、以礼立业、德业日新。',
    img: '孔子讲学图,杏坛之下弟子环列,松风阵阵,晨光熹微' },
  '11-25': { name: '下元节', kind: 'dao', theme: '水官解厄',
    wish: '下元佳节,水官解厄。值此消灾延寿之日,恭祝您与家人百厄皆消、福寿绵长。',
    img: '下元夜水官降临,江河湖海清宁,莲花灯浮于水面' },
  '12-28': { name: '腊八节', kind: 'folk', theme: '五谷丰登',
    wish: '腊八节至,年味渐浓。一碗腊八粥,温养脾胃、调和五脏。值此佳日,愿您身心康泰、新岁可期。',
    img: '腊八粥热气腾腾,红枣莲子桂圆团聚,暖意融融' },

  // 国际/纪念
  '03-08': { name: '三八妇女节', kind: 'folk', theme: '巾帼芳华',
    wish: '三八妇女节,致敬每一位温柔而有力的她。愿您优雅从容,事业顺遂,身心自在芳华。',
    img: '三月桃花灼灼,女子远眺,春风拂面,淡彩水墨' },
  '03-12': { name: '植树节', kind: 'folk', theme: '万物生发',
    wish: '植树佳节,种下希望。今日一锹土,明日万木春。愿您种下善念,收获满园春色。',
    img: '春日新苗出土,远山如黛,孩童植树,写意' },
  '05-04': { name: '青年节', kind: 'folk', theme: '青春之歌',
    wish: '五四青年节,致敬青春的力量。愿您心怀热望、脚踏实地、长空万里、永远少年。',
    img: '青年远眺晨光,朝霞满天,旗影飘扬' },
  '06-01': { name: '儿童节', kind: 'folk', theme: '赤子之心',
    wish: '六一儿童节,祝大小朋友童心常在、笑口常开。值此佳日,愿您永葆赤子之心、清澈如初。',
    img: '六一气球满天,孩童欢笑,蝴蝶翩舞,色彩明快' },
  '09-10': { name: '教师节', kind: 'folk', theme: '师恩如海',
    wish: '教师佳节,感念师恩。值此佳日,愿您桃李满天下、身心康泰、德业日新、长受敬重。',
    img: '讲台之上师长端坐,弟子环列,松风阵阵' },
  '10-09': { name: '重阳节', kind: 'folk', theme: '登高敬老',
    wish: '重阳佳节,登高望远、敬老尊贤。值此佳日,愿您家业兴旺、师长康泰、岁月绵长。',
    img: '重阳登高望远,茱萸插遍,菊黄桂香,水墨淡金' },
  '11-26': { name: '感恩节', kind: 'folk', theme: '心怀感恩',
    wish: '感恩节,感念每一份相遇与相助。值此佳日,愿您心怀温暖、常有回响、人生处处是清光。',
    img: '暖阳窗前,家人围坐,热茶飘香,写意油画' },
  '12-24': { name: '平安夜', kind: 'folk', theme: '岁岁平安',
    wish: '平安夜至,岁岁平安。值此佳日,愿您与家人身心安泰、夜夜好眠、岁岁无忧。',
    img: '平安夜烛光点点,雪花纷飞,远处钟楼,写意' },
  '12-25': { name: '圣诞节', kind: 'folk', theme: '冬日温暖',
    wish: '圣诞佳节,温暖相伴。值此佳日,愿您与家人、朋友、爱人围炉相聚、共度温暖时光。',
    img: '冬日雪夜,炉火摇曳,窗户轻雪,写意油画' },

  // ===== 儒道释节日补缺 =====
  // 佛教
  '04-06': { name: '观音圣诞', kind: 'fo', theme: '大慈大悲',
    wish: '观音菩萨圣诞,大慈大悲救苦救难。值此殊胜之日,恭祝您与家人身心安泰、常怀慈悲、福慧双增。',
    img: '观音菩萨端坐莲台,净瓶杨柳,祥云缭绕,金光柔和' },
  '04-04': { name: '地藏圣诞', kind: 'fo', theme: '孝亲报恩',
    wish: '地藏菩萨圣诞,「地狱不空誓不成佛」。值此孝亲报恩之日,恭祝您承先人德泽、启后世昌隆。',
    img: '地藏菩萨持锡杖立莲台,金色光芒,庄严肃穆' },
  '11-08': { name: '药师佛圣诞', kind: 'fo', theme: '消灾延寿',
    wish: '药师佛圣诞,消灾延寿。值此殊胜之日,恭祝您与家人身体健康、无诸病苦、福寿绵长。',
    img: '药师佛端坐莲台,托药钵,琉璃光色,清净无染' },
  '12-25': { name: '阿弥陀佛圣诞', kind: 'fo', theme: '无量光寿',
    wish: '阿弥陀佛圣诞,无量光无量寿。值此殊胜之日,恭祝您与家人光明遍照、寿量无涯、心无挂碍。',
    img: '阿弥陀佛端坐莲台,接引手势,金光万道,祥云环绕' },
  '08-27': { name: '盂兰盆节', kind: 'fo', theme: '孝亲报恩',
    wish: '盂兰盆节,供佛斋僧,孝亲报恩。值此之日,愿您承先人遗德、报父母恩情、家族兴旺绵延。',
    img: '盂兰盆会,佛前供灯,莲花灯点点,庄严肃穆' },

  // 道教补缺
  '04-02': { name: '太上老君圣诞', kind: 'dao', theme: '道法自然',
    wish: '太上老君圣诞,道德流传。值此佳日,愿您顺应自然、无为而为、德泽绵长。',
    img: '老子骑牛图,紫气东来,道德经卷,水墨写意' },
  '02-25': { name: '玉皇大帝圣诞', kind: 'dao', theme: '昊天上帝',
    wish: '玉皇大帝圣诞,统御万天。值此佳日,恭祝您与家人得天恩庇佑、万事顺遂、福禄绵长。',
    img: '玉皇大帝端坐凌霄宝殿,仙鹤翔绕,金光万道' },
  '03-03': { name: '张天师圣诞', kind: 'dao', theme: '正一护法',
    wish: '张道陵天师圣诞,正一护法。值此佳日,愿您正气浩然、邪不可干、家宅安宁。',
    img: '张天师持剑骑虎,符箓飞扬,松风阵阵' },

  // 儒家补缺
  '04-15': { name: '曾子诞', kind: 'ru', theme: '宗圣薪传',
    wish: '宗圣曾子圣诞,吾日三省吾身。值此佳日,愿您修身齐家、德业日新、内外兼修。',
    img: '曾子讲学图,松柏长青,弟子环坐,晨光初照' },
  '04-30': { name: '颜回诞', kind: 'ru', theme: '复圣安贫',
    wish: '复圣颜回圣诞,一箪食一瓢饮不改其乐。值此佳日,愿您安贫乐道、心境澄明、不为外物所累。',
    img: '颜回读书图,陋巷茅屋,书卷满案,清雅水墨' },

  // ===== 少数民族节日 =====
  '02-21': null, // 财神日已有,下方覆盇
  // 藏历新年(2026年约 2/21,取近似;R119:改键避免覆盖财神日)
  '02-21b': { name: '藏历新年', kind: 'ethnic', theme: '洛萨吉祥',
    wish: '藏历新年洛萨吉祥!值此佳节,愿您如雪山般坚毅、如哈达般纯洁、如格桑花般灿烂。',
    img: '布达拉宫雪景,经幡飘扬,酥油灯点点,藏式写意' },
  // 泼水节(傣族,4月中旬)
  '04-15': { name: '泼水节', kind: 'ethnic', theme: '吉祥清水',
    wish: '傣族泼水节,吉祥清水洗去一年尘埃。值此佳节,愿您洗旧迎新、清凉自在、万事如意。',
    img: '泼水节庆典,孔雀舞蹁跹,清水纷飞,热带花卉环绕' },
  // 火把节(彝族,农历六月二十四,约公历 8/4)
  '08-04': { name: '火把节', kind: 'ethnic', theme: '红火吉庆',
    wish: '彝族火把节,火光照亮前程。值此佳节,愿您事业红红火火、生活光明灿烂、驱邪纳福。',
    img: '火把节夜晚篝火,彝族青年跳舞,火光冲天,星空璀璨' },
  // 那达慕大会(蒙古族,7-8月间,取 7/11)
  '07-11': { name: '那达慕', kind: 'ethnic', theme: '草原盛会',
    wish: '蒙古族那达慕大会,草原盛会。值此佳节,愿您如草原般广阔、如骏马般矫健、如蓝天般豁达。',
    img: '那达慕赛马,草原辽阔,蒙古包点点,蓝天白云' },
  // 雪顿节(藏族,藏历六月底,约公历 8/17)
  '08-17': { name: '雪顿节', kind: 'ethnic', theme: '酸奶盛宴',
    wish: '藏族雪顿节,酸奶盛宴。值此佳节,愿您生活醇厚如酸奶、心境高远如雪山、福报绵长如雅鲁藏布。',
    img: '雪顿节展佛,巨幅唐卡展开,哲蚌寺晨光,庄严神圣' },
  // 开斋节(回族等,约公历 4/10)
  '04-10': { name: '开斋节', kind: 'ethnic', theme: '吉庆祥和',
    wish: '开斋节吉庆,感恩与分享。值此佳节,愿您与家人平安吉庆、生活丰盈、心怀感恩。',
    img: '清真寺穹顶新月,灯火辉煌,宁静祥和' },
  // 古尔邦节(约公历 6/17)
  '06-17': { name: '古尔邦节', kind: 'ethnic', theme: '忠孝奉献',
    wish: '古尔邦节吉庆,忠孝与奉献。值此佳节,愿您与家人平安健康、生活充实、心怀善念。',
    img: '清真寺宣礼塔,晨光初照,和平鸽飞翔' },
  // 三月三(壮族等多个民族)
  '04-03': { name: '三月三', kind: 'ethnic', theme: '歌圩传情',
    wish: '三月三歌圩节,壮乡传情。值此佳节,愿您生活如山歌般悠扬、情谊如糯米般甜软、日子如春风般温暖。',
    img: '三月三壮族歌圩,对歌台,山花烂漫,淡水彩' },
  // 苗年(苗族,农历十月初一,约公历 11/10)
  '11-10': { name: '苗年', kind: 'ethnic', theme: '丰收吉庆',
    wish: '苗族苗年,丰收吉庆。值此佳节,愿您五谷丰登、牛羊满圈、生活如苗绣般绚丽多彩。',
    img: '苗年庆典,芦笙吹奏,银饰闪跃,梯田金黄' },
  // 彝族年(农历十一月初,约公历 12/1)
  '12-01': { name: '彝族年', kind: 'ethnic', theme: '彝历新年',
    wish: '彝族年库施,彝历新年。值此佳节,愿您如火把般热烈、如山鹰般自由、如索玛花般灿烂。',
    img: '彝族年庆典,砣砣肉,荞麦饼,火塘温暖,写意' }
};

// ===== 周末吉日祝福(周六/周日,非节气非法定假日时触发)=====
var WEEKEND_WISHES = [
  { theme: '周末安好',
    wish: '周末闲暇,宜放下繁忙、陪伴家人。一壶清茶、一卷好书,便是人间好时节。愿您身心舒展、自在安然。',
    img: '周末闲适,庭院茶席,阳光透过竹帘,水墨淡彩' },
  { theme: '休养生息',
    wish: '劳逸结合,方能行远。周末宜早睡早起、静坐冥想、亲近自然。愿您养精蓄锐、以逸待劳。',
    img: '周末山间漫步,溪水潺潺,松风拂面,写意水墨' },
  { theme: '闲云野鹤',
    wish: '闲云野鹤般自在,是周末最好的状态。不必赶路、不必焦虑,让心慢下来,感受生活的细节与温度。',
    img: '白鹤飞翔于云间,远山含翠,溪水映天,水墨写意' },
  { theme: '家和万事兴',
    wish: '周末团圆,家和万事兴。宜与家人共餐、与老友叙旧、与孩子嬉戏。幸福不在远方,就在此刻的陪伴里。',
    img: '家庭温馨场景,圆桌饭菜热气腾腾,孩子嬉闹,暖色调' },
  { theme: '厚积薄发',
    wish: '周末是充电的时光。读一本好书、学一项新技能、复盘一周得失。厚积方能薄发,休息是为了更好地出发。',
    img: '书房灯下读书,窗外月色宁静,茶香袅袅,水墨淡彩' },
  { theme: '心宽天地阔',
    wish: '周末宜心宽。不计较、不比较、不内耗。心宽了,天地就阔了,好运自然来。愿您周末轻松愉悦。',
    img: '远眺广阔天地,云海翻涌,山顶一人静坐,水墨' },
  { theme: '静水流深',
    wish: '静水流深,宁静致远。周末宜静坐观心、整理思绪、规划来日。最深的智慧,往往在安静中生发。',
    img: '幽静山谷溪流,水面如镜,倒映远山,水墨淡青' },
  { theme: '知足常乐',
    wish: '知足者富,心安者贵。周末宜感恩已有、珍惜眼前。一碗粗茶淡饭、一声家人问候,便是人间至福。',
    img: '简朴农舍,炊烟袅袅,菜园青翠,夕阳暖光,水墨' }
];

// ===== 儒道佛日常修心祝福(轮换,非特定日期)=====
var RU_DAO_FO_WISHES = [
  // 儒家修心
  { kind: 'ru', theme: '吾日三省',
    wish: '曾子曰:「吾日三省吾身。」今日宜反思言行、修正不足。修身齐家,从每日自省开始。愿您德业日进、内外兼修。',
    img: '儒者静坐反省,竹简摊开,松风清朗,水墨淡彩' },
  { kind: 'ru', theme: '仁者爱人',
    wish: '孔子曰:「仁者爱人。」今日宜行善布施、关爱他人。一点善意,温暖人间。愿您以仁立身、以礼待人、德泽四方。',
    img: '儒家讲学场景,弟子环坐,杏坛春风,水墨' },
  { kind: 'ru', theme: '中庸之道',
    wish: '《中庸》云:「致中和,天地位焉,万物育焉。」今日宜调节身心、不偏不倚。执两用中,方得圆满。愿您张弛有度、从容中道。',
    img: '中庸意境,天平与山水,阴阳和谐,水墨淡彩' },
  // 道家修心
  { kind: 'dao', theme: '道法自然',
    wish: '老子曰:「人法地,地法天,天法道,道法自然。」今日宜顺应自然、无为而为。不必强求,水到渠成。愿您心境如水、顺道而行。',
    img: '老子骑牛远去,紫气东来,山水苍茫,水墨写意' },
  { kind: 'dao', theme: '上善若水',
    wish: '老子曰:「上善若水。水善利万物而不争。」今日宜养柔德、学水之善。柔能克刚,静能制动。愿您如水般柔韧、包容、通达。',
    img: '山涧清泉流淌,水绕石行,青苔点点,水墨淡青' },
  { kind: 'dao', theme: '致虚极守静笃',
    wish: '老子曰:「致虚极,守静笃。万物并作,吾以观复。」今日宜静坐观心、放空杂念。心虚则明,心静则慧。愿您虚静生慧、返璞归真。',
    img: '道人静坐山洞,云雾缭绕,松涛阵阵,水墨' },
  // 佛家修心
  { kind: 'fo', theme: '心无挂碍',
    wish: '《心经》云:「心无挂碍,无挂碍故,无有恐怖。」今日宜放下执念、静心诵经。心若无碍,处处清净。愿您身心安泰、自在清凉。',
    img: '佛前莲花灯点点,经卷摊开,檀香袅袅,金色柔光' },
  { kind: 'fo', theme: '活在当下',
    wish: '佛曰:「过去心不可得,现在心不可得,未来心不可得。」今日宜活在当下、专注眼前。一口茶、一缕风、一声鸟鸣,皆是修行。愿您当下自在、念念清明。',
    img: '僧人品茶观花,樱花飘落,禅意庭院,水墨淡彩' },
  { kind: 'fo', theme: '慈悲喜舍',
    wish: '佛家四无量心:慈、悲、喜、舍。今日宜行善积德、放生布施。一颗慈悲心,胜过万千功德。愿您福慧双增、善缘广结。',
    img: '佛手拈花微笑,莲花盛开,祥云金光,柔和庄严' }
];

// R119：按名称反查文案（动态节日命中后用）
function findByName(name) {
  for (var k in FESTIVAL_2026) {
    if (FESTIVAL_2026[k] && FESTIVAL_2026[k].name === name) return FESTIVAL_2026[k];
  }
  return null;
}

// R119 修真：动态农历节日 + 节气（lunar_python 权威计算，替代固定 MM-DD 表）
// 修复：FESTIVAL_2026 固定日期 → 2027 春节(2/6 vs 2/17)、端午(6/9 vs 6/19)、中秋(9/15 vs 9/25) 全错
function lookupDynamic(today) {
  try {
    var execSync = require('child_process').execSync;
    var y = today.getFullYear(), m = today.getMonth() + 1, d = today.getDate();
    var script = "import sys;sys.path.insert(0,'/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server');from lunar_python import Solar;l=Solar.fromYmd(" + y + "," + m + "," + d + ").getLunar();print(l.getMonth(),l.getDay(),l.getJieQi() or '')";
    var out = execSync("python3 -c \"" + script.replace(/"/g, '\\"') + "\"", { timeout: 5000, encoding: 'utf8' }).trim();
    var parts = out.split(/[\s,]+/).filter(Boolean);
    var lm = parseInt(parts[0], 10), ld = parseInt(parts[1], 10), jieqi = parts[2] || '';
    // 农历节日（春节/端午/中秋，2026-2030 动态准确）
    var lunarFest = null;
    if (lm === 1 && ld === 1) lunarFest = '春节';
    else if (lm === 5 && ld === 5) lunarFest = '端午节';
    else if (lm === 8 && ld === 15) lunarFest = '中秋节';
    if (lunarFest) {
      var fb = findByName(lunarFest);
      if (fb) return { name: fb.name, kind: fb.kind, theme: fb.theme, wish: fb.wish, img: fb.img };
    }
    // 节气（含清明节日/节气合一）
    if (jieqi) {
      var fb2 = findByName(jieqi);
      if (fb2 && fb2.kind === 'jie') return { name: fb2.name, kind: fb2.kind, theme: fb2.theme, wish: fb2.wish, img: fb2.img };
    }
    return null;
  } catch (e) { return null; }
}

function lookup(today) {
  // R119：动态优先（农历节日/节气按年准确），失败回退固定表
  var dyn = lookupDynamic(today);
  if (dyn) return dyn;
  var key = (today.getMonth() + 1).toString().padStart(2, '0') + '-' + today.getDate().toString().padStart(2, '0');
  var festival = FESTIVAL_2026[key];
  if (festival) return festival;
  // 节气预告：如果明天是节气，今天提前一天提醒
  var tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  var tomorrowKey = (tomorrow.getMonth() + 1).toString().padStart(2, '0') + '-' + tomorrow.getDate().toString().padStart(2, '0');
  var tomorrowFestival = FESTIVAL_2026[tomorrowKey];
  if (tomorrowFestival && tomorrowFestival.kind === 'jie') {
    return {
      name: '节气预告',
      kind: 'jie_pre',
      theme: '明日' + tomorrowFestival.name,
      wish: '明日' + tomorrowFestival.name + '。' + tomorrowFestival.wish,
      img: tomorrowFestival.img
    };
  }  // 非节气非法定假日 → 检查是否周末
  var dow = today.getDay();
  if (dow === 6 || dow === 0) {
    // 周六或周日:从周末祝福池轮换选取
    var dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
    var weekendIdx = (dayOfYear + (dow === 6 ? 0 : 3)) % WEEKEND_WISHES.length;
    var weekendWish = WEEKEND_WISHES[weekendIdx];
    return {
      name: dow === 6 ? '周六吉日' : '周日吉日',
      kind: 'weekend',
      theme: weekendWish.theme,
      wish: weekendWish.wish,
      img: weekendWish.img
    };
  }
  // 非周末:检查是否儒道佛修心日(每周三固定推送修心祝福)
  if (dow === 3) {
    var weekOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 1)) / (7 * 86400000));
    var ruDaoFoIdx = weekOfYear % RU_DAO_FO_WISHES.length;
    var rdfWish = RU_DAO_FO_WISHES[ruDaoFoIdx];
    return {
      name: '修心吉日',
      kind: rdfWish.kind,
      theme: rdfWish.theme,
      wish: rdfWish.wish,
      img: rdfWish.img
    };
  }
  return null;
}

// === KB 应景融合:检索节气/节日相关古老智慧 ===
// 高情商柔和版:从 KB 摘取与节令名相关的 1-2 条精要,不堆砌学术内容
// 返回异步:[{title, snippet, trust}, ...]
function queryKbContext(festivalName, maxItems) {
  maxItems = maxItems || 2;
  return new Promise(function (resolve) {
    var spawn = require('child_process').spawn;
    // 关键词策略:先查整个节令名;取最后一字(中文习惯例如"立秋"秋表季节);最后查通用词
    var primaryKeyword = festivalName.length >= 2 ? festivalName.slice(-1) : festivalName;
    var keywords = [festivalName, primaryKeyword, '养生', '节气', '智慧', '顺时'];
    var q = encodeURIComponent(primaryKeyword);
    var url = 'http://127.0.0.1:8920/api/public/kb/search?q=' + q + '&limit=12';
    var curl = spawn('curl', ['-s', '--max-time', '8', url], { stdio: ['ignore', 'pipe', 'pipe'] });
    var out = '', err = '';
    curl.stdout.on('data', function (d) { out += d.toString(); });
    curl.stderr.on('data', function (d) { err += d.toString(); });
    curl.on('error', function () { resolve([]); });
    curl.on('close', function (code) {
      if (code !== 0 || !out) return resolve([]);
      try {
        var j = JSON.parse(out);
        var items = [];
        var list = (j.results || j.items || (j.data && j.data.results) || []);
        for (var i = 0; i < list.length && items.length < maxItems; i++) {
          var it = list[i];
          var title = (it.title || '').trim();
          var content = (it.content || it.snippet || '').trim();
          // 过滤:仅保留与节令相关的(title/content 包含关键词)
          var matched = false;
          for (var k = 0; k < keywords.length; k++) {
            if (title.indexOf(keywords[k]) >= 0 || content.indexOf(keywords[k]) >= 0) {
              matched = true; break;
            }
          }
          if (!matched) continue;
          // 截取前 80 字作 snippet
          var snippet = content.length > 80 ? content.slice(0, 80).replace(/[\n\r]+/g, ' ') + '...' : content;
          items.push({ title: title, snippet: snippet, trust: it.trust_score || 0.85 });
        }
        resolve(items);
      } catch (e) { resolve([]); }
    });
    setTimeout(function () { try { curl.kill('SIGKILL'); } catch (e) {} resolve([]); }, 9000);
  });
}

// 把 KB 摘要附加到祝福正文(高情商柔和版)
function appendKbWisdom(text, items) {
  if (!items || items.length === 0) return text;
  text += '\n';
  text += '📜 古老智慧·补读\n';
  for (var i = 0; i < items.length; i++) {
    text += '  · ' + items[i].snippet + '\n';
  }
  return text;
}

function render(today) {
  var f = lookup(today);
  if (!f) return null;
  // 日期戳:放在最后一行,让用户知道这条祝福的发布日期
  var yyyy = today.getFullYear();
  var mm = (today.getMonth() + 1).toString().padStart(2, '0');
  var dd = today.getDate().toString().padStart(2, '0');
  var hh = today.getHours().toString().padStart(2, '0');
  var mi = today.getMinutes().toString().padStart(2, '0');
  var weekday = ['周日','周一','周二','周三','周四','周五','周六'][today.getDay()];
  var kindLabel = f.kind === 'holiday' ? '【法定假日】' :
                  f.kind === 'tradition' ? '【传统佳节】' :
                  f.kind === 'jie' ? '【节气】' :
                  f.kind === 'jie_pre' ? '【节气预告】' :
                  f.kind === 'fo' ? '【佛诞吉日】' :
                  f.kind === 'dao' ? '【道教吉日】' :
                  f.kind === 'ru' ? '【儒家修心】' :
                  f.kind === 'folk' ? '【民俗吉日】' :
                  f.kind === 'ethnic' ? '【民族佳节】' :
                  f.kind === 'weekend' ? '【周末吉日】' : '【吉日】';
  var text = '';
  // 称呼随机轮换,让客户/领导收到不重样(兄弟/首长/朋友/老友/挚友/兄台/仁兄等)
  var salutations = ['兄弟,', '首长,', '朋友,', '老友,', '挚友,', '兄台,', '仁兄,', '同志,', '老兄,', '朋友您好,'];
  // 落款柔和版:不用"君""敬上"这种偏文雅的,用"您朋友""益友"之类
  var closings    = ['您的朋友。', '您朋友。', '你的朋友。', '你的老友。', '您的老友。', '益友。', '老友敬上。', '友。'];
  // 按月偏移 + 节日名长度,让每月节气落款不同
  var sal = salutations[(today.getMonth() * 7 + f.name.length) % salutations.length];
  var clo = closings[(today.getMonth() * 11 + today.getDate() + f.name.length) % closings.length];

  text += '🌿 ' + kindLabel + f.name + ' · ' + f.theme + '\n';
  text += '\n';
  text += sal + '\n';
  text += f.wish + '\n';
  text += '\n';
  text += clo + '\n';
  text += '\n';
  text += '-- 易道智鉴 · 节气养生\n';
  text += '📅 ' + yyyy + '-' + mm + '-' + dd + '(' + weekday + ')';
  return { text: text, img: f.img, name: f.name };
}

// Pillow LANCZOS 4K 超分(2048 → 3840)
// 先放大,再用 ImageEnhance 微锐化,避免纯插值的模糊感
function upscaleTo4k(srcUrl, savePath) {
  return new Promise(function (resolve) {
    var spawn = require('child_process').spawn;
    var py = process.env.PYTHON || 'python3';
    // R249: 用独立脚本文件替代 python3 -c 内嵌脚本，避免 inline script failed
    var scriptPath = __dirname + '/scripts/upscale-to-4k.py';
    var p = spawn(py, [scriptPath, srcUrl, savePath], { stdio: ['ignore', 'pipe', 'pipe'] });
    var stdout = '', stderr = '';
    p.stdout.on('data', function (d) { stdout += d.toString(); });
    p.stderr.on('data', function (d) { stderr += d.toString(); });
    p.on('error', function (e) { resolve({ ok: false, error: 'spawn 错误:' + e.message }); });
    p.on('close', function (code2) {
      if (code2 === 2) return resolve({ ok: false, error: '下载失败(OSS URL可能已过期): ' + stdout.slice(0, 200) });
      if (code2 === 3) return resolve({ ok: false, error: '超分失败: ' + stdout.slice(0, 200) });
      if (code2 !== 0) return resolve({ ok: false, error: 'exit ' + code2 + ': ' + (stderr || stdout).slice(0, 500) });
      if (stdout.includes('4K_OK')) return resolve({ ok: true, size: stdout.match(/4K_OK (\d+)x/)?.[1] || 3840 });
      resolve({ ok: false, error: '未生成 4K:' + stdout.slice(0, 300) });
    });
    setTimeout(function () { try { p.kill('SIGKILL'); } catch(e){} resolve({ ok: false, error: '4K 超分超时' }); }, 60000);
  });
}

// 调用 Seedream 文生图(异步子进程)
function generateImage(prompt) {
  var spawn = require('child_process').spawn;
  var py = process.env.PYTHON || 'python3';
  var skillPath = '/Users/tom/.openclaw-autoclaw/skills/autoglm-generate-image-seedream/generate-image-seedream.py';
  return new Promise(function (resolve) {
    var p = spawn(py, [skillPath, prompt], { stdio: ['ignore', 'pipe', 'pipe'] });
    var stdout = '', stderr = '';
    p.stdout.on('data', function (d) { stdout += d.toString(); });
    p.stderr.on('data', function (d) { stderr += d.toString(); });
    p.on('error', function (e) { resolve({ ok: false, error: 'spawn 错误:' + e.message }); });
    p.on('close', function (code) {
      if (code !== 0) return resolve({ ok: false, error: 'exit ' + code + ': ' + (stderr || stdout).slice(0, 500) });
      var m = stdout.match(/https:\/\/[^\s"']+\.jpg\?[^\s"']+/);
      if (m) return resolve({ ok: true, url: m[0] });
      resolve({ ok: false, error: '未找到图片 URL:' + stdout.slice(0, 300) });
    });
    setTimeout(function () { try { p.kill('SIGKILL'); } catch(e){} resolve({ ok: false, error: '超时(90s)' }); }, 90000);
  });
}

// CLI
if (require.main === module) {
  var arg = process.argv[2];
  var withImg = process.argv.includes('--img');
  var withKb  = process.argv.includes('--kb');
  // R119：--verify 全量校验模式（2026-2030 节日/节气日期命中测试）
  if (arg === '--verify') {
    var checks = [
      ['2026-02-17', '春节'], ['2027-02-06', '春节'], ['2028-01-26', '春节'], ['2029-02-13', '春节'], ['2030-02-03', '春节'],
      ['2026-06-19', '端午节'], ['2027-06-09', '端午节'], ['2028-05-28', '端午节'], ['2029-06-16', '端午节'], ['2030-06-05', '端午节'],
      ['2026-09-25', '中秋节'], ['2027-09-15', '中秋节'], ['2028-10-03', '中秋节'], ['2029-09-22', '中秋节'], ['2030-09-12', '中秋节'],
      ['2026-04-05', '清明'], ['2027-04-05', '清明'], ['2028-04-04', '清明'],
      ['2026-08-07', '立秋'], ['2027-02-04', '立春'], ['2028-02-04', '立春'],
    ];
    var pass = 0, fail = 0;
    checks.forEach(function (c) {
      var d = new Date(c[0] + 'T08:00:00');
      var hit = lookup(d);
      var ok = hit && (hit.name === c[1] || (hit.name || '').indexOf(c[1]) >= 0 || (c[1].indexOf(hit.name || '') >= 0 && hit.kind !== 'weekend'));
      if (ok) { pass++; console.log('✅', c[0], c[1], '→', hit.name); }
      else { fail++; console.log('❌', c[0], c[1], '→', hit ? (hit.name + '/' + hit.kind) : 'null'); }
    });
    console.log('\n校验结果: ' + pass + ' 通过 / ' + fail + ' 失败');
    process.exit(fail > 0 ? 1 : 0);
  }
  var date = null;
  if (arg && /^\d{4}-\d{2}-\d{2}$/.test(arg)) {
    date = new Date(arg + 'T08:00:00');
  } else if (arg === 'today' || !arg) {
    date = new Date();
  } else {
    console.error('用法: node festival-wishes.js [YYYY-MM-DD|today] [--img] [--kb]');
    process.exit(1);
  }
  var result = render(date);
  if (!result) {
    var key = (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0');
    console.log('今日(' + key + ')非节气非法定假日,不生成祝贺。');
    process.exit(0);
  }
  // 输出顺序:4K 图片 → 文字 → 时间
  if (withImg && result.img) {
    console.log('[IMG_PROMPT] ' + result.img);
    console.log('[IMG_GEN_START]');
    generateImage(result.img).then(function (img) {
      if (!img.ok) {
        console.log('[IMG_ERR] ' + img.error);
        console.log('\n[TEXT]');
        console.log(result.text);
        return;
      }
      console.log('[IMG_URL_2K] ' + img.url);
      // 立即拉取 + Pillow 4K 超分(2048 → 3840)
      var safeName = result.name + '-' + date.toISOString().slice(0, 10);
      var savePath = '.openclaw/tmp/' + safeName + '-4k.jpg';
      console.log('[IMG_UPSCALE_START] → ' + savePath);
      // R249: 先立即下载原始图到本地（避免OSS URL过期），再超分
      upscaleTo4k(img.url, savePath).then(function (up) {
        if (up.ok) {
          console.log('[IMG_PATH_4K] ' + savePath + ' (' + up.size + 'x' + up.size + ')');
        } else {
          console.log('[IMG_UPSCALE_ERR] ' + up.error + ',回退 2K 原图:' + img.url);
        }
        console.log('\n[TEXT]');
        console.log(result.text);
        // KB 应景融合:检索与节令相关的古代智慧,在正文后补充 1-2 条
        if (withKb) {
          queryKbContext(result.name, 2).then(function(items) {
            if (items && items.length > 0) {
              console.log('\n[KB_WISDOM]');
              for (var i = 0; i < items.length; i++) {
                console.log('  · ' + items[i].snippet);
              }
            } else {
              console.log('\n[KB_WISDOM] (本节日无 KB 匹配退回经典)');
            }
          });
        }
      });
    });
  } else {
    console.log(result.text);
    if (withKb) {
      queryKbContext(result.name, 2).then(function(items) {
        if (items && items.length > 0) {
          console.log('\n[KB_WISDOM]');
          for (var i = 0; i < items.length; i++) {
            console.log('  · ' + items[i].snippet);
          }
        } else {
          console.log('\n[KB_WISDOM] (本节日无 KB 匹配)');
        }
      });
    }
  }
}