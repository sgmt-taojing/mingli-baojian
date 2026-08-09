// yijing-engine.js
// R629 Phase 3: 易经 V2 动态解读引擎（从 divination-core.js 拆分）
// 包含：getYijingReadingV2 / getYijingReadingHTML
// 依赖：divination-core.js
// 用法：<script src="js/yijing-engine.js" defer></script>
(function(global){
// ========== 易经 V2 动态解读引擎 ==========

// 本地八卦象数表（避免跨script块依赖）
var _YJ_GUA_XIANG = {
  0:{name:'乾',sym:'☰',code:'111',wuxing:'金',family:'父'},
  1:{name:'兑',sym:'☱',code:'110',wuxing:'金',family:'少女'},
  2:{name:'离',sym:'☲',code:'101',wuxing:'火',family:'中女'},
  3:{name:'震',sym:'☳',code:'100',wuxing:'木',family:'长男'},
  4:{name:'巽',sym:'☴',code:'011',wuxing:'木',family:'长女'},
  5:{name:'坎',sym:'☵',code:'010',wuxing:'水',family:'中男'},
  6:{name:'艮',sym:'☶',code:'001',wuxing:'土',family:'少男'},
  7:{name:'坤',sym:'☷',code:'000',wuxing:'土',family:'母'}
};

var _YJ_HEX_DATA = {
  '乾':  {upper:0, lower:0, wuxing:'金', gong:'乾',   summary:'天行健，君子以自强不息', meaning:'纯阳刚健，天道运行不息'},
  '坤':  {upper:7, lower:7, wuxing:'土', gong:'坤',   summary:'地势坤，君子以厚德载物', meaning:'纯阴柔顺，地道承载万物'},
  '屯':  {upper:5, lower:3, wuxing:'水', gong:'坎',   summary:'万事开头难，坚持就是胜利', meaning:'雷雨交加，万物始生艰难'},
  '蒙':  {upper:6, lower:5, wuxing:'火', gong:'离',   summary:'启蒙求知，虚心学习', meaning:'山下出泉，蒙昧待启'},
  '需':  {upper:5, lower:1, wuxing:'水', gong:'坎',   summary:'等待时机，蓄势待发', meaning:'云上于天，需待其时'},
  '讼':  {upper:1, lower:5, wuxing:'金', gong:'离',   summary:'避免争执，以和为贵', meaning:'天水违行，争讼之象'},
  '师':  {upper:7, lower:5, wuxing:'土', gong:'坤',   summary:'以正治军，纪律严明', meaning:'地中有水，聚众出师'},
  '比':  {upper:5, lower:7, wuxing:'水', gong:'坤',   summary:'亲比相辅，团结合作', meaning:'水地相亲，比附团结'},
  '小畜':{upper:4, lower:1, wuxing:'木', gong:'巽',   summary:'小有成就，继续努力', meaning:'风行天上，小有积蓄'},
  '履':  {upper:1, lower:2, wuxing:'金', gong:'艮',   summary:'如履薄冰，小心谨慎', meaning:'上天下泽，履虎尾之象'},
  '泰':  {upper:7, lower:1, wuxing:'土', gong:'坤',   summary:'否极泰来，万物通达', meaning:'天地交泰，万物通泰'},
  '否':  {upper:1, lower:7, wuxing:'金', gong:'乾',   summary:'闭塞不通，静待转运', meaning:'天地不交，闭塞不通'},
  '同人':{upper:1, lower:2, wuxing:'金', gong:'离',   summary:'志同道合，广结善缘', meaning:'天火同人，同志相合'},
  '大有':{upper:2, lower:1, wuxing:'火', gong:'乾',   summary:'大有所成，丰收在望', meaning:'火天大有，丰盛富有'},
  '谦':  {upper:7, lower:6, wuxing:'土', gong:'坤',   summary:'满招损谦受益，谦虚为上', meaning:'地山谦，卑下自牧'},
  '豫':  {upper:3, lower:7, wuxing:'木', gong:'震',   summary:'顺时而动，快乐为先', meaning:'雷出地奋，豫悦和乐'},
  '随':  {upper:2, lower:3, wuxing:'火', gong:'震',   summary:'随机应变，顺应时势', meaning:'泽雷随，随顺时势'},
  '蛊':  {upper:6, lower:4, wuxing:'土', gong:'巽',   summary:'整治积弊，拨乱反正', meaning:'山风蛊，积弊待整'},
  '临':  {upper:7, lower:2, wuxing:'土', gong:'坤',   summary:'居高临下，大运将至', meaning:'地泽临，以尊临卑'},
  '观':  {upper:4, lower:7, wuxing:'木', gong:'巽',   summary:'静观其变，三思后行', meaning:'风地观，观仰天地'},
  '噬嗑':{upper:2, lower:3, wuxing:'火', gong:'离',   summary:'雷厉风行，果断处理', meaning:'火雷噬嗑，咬合除障'},
  '贲':  {upper:6, lower:2, wuxing:'土', gong:'艮',   summary:'修饰有度，注重形象', meaning:'山火贲，文饰光明'},
  '剥':  {upper:6, lower:7, wuxing:'土', gong:'艮',   summary:'剥落消退，暂避锋芒', meaning:'山地剥，剥落衰退'},
  '复':  {upper:7, lower:3, wuxing:'土', gong:'坤',   summary:'一阳来复，否极泰来', meaning:'地雷复，一阳来复'},
  '无妄':{upper:1, lower:3, wuxing:'金', gong:'乾',   summary:'不妄动，不虚妄', meaning:'天雷无妄，诚中形外'},
  '大畜':{upper:6, lower:1, wuxing:'土', gong:'艮',   summary:'厚积薄发，大有可为', meaning:'山天大畜，蓄积刚健'},
  '颐':  {upper:6, lower:3, wuxing:'土', gong:'艮',   summary:'养生保健，自求多福', meaning:'山雷颐，养正之道'},
  '大过':{upper:2, lower:4, wuxing:'火', gong:'兑',   summary:'过犹不及，中庸为上', meaning:'泽风大过，过甚非常'},
  '坎':  {upper:5, lower:5, wuxing:'水', gong:'坎',   summary:'险中求胜，逆境逢生', meaning:'习坎重险，艰贞求通'},
  '离':  {upper:2, lower:2, wuxing:'火', gong:'离',   summary:'明察秋毫，智慧通达', meaning:'离明相继，文明之象'},
  '咸':  {upper:2, lower:6, wuxing:'火', gong:'兑',   summary:'感应天地，心有灵犀', meaning:'泽山咸，感而遂通'},
  '恒':  {upper:3, lower:4, wuxing:'木', gong:'震',   summary:'持之以恒，方能成功', meaning:'雷风恒，持久不渝'},
  '遁':  {upper:1, lower:6, wuxing:'金', gong:'乾',   summary:'退避三舍，以退为进', meaning:'天山遁，退隐保全'},
  '大壮':{upper:3, lower:1, wuxing:'木', gong:'震',   summary:'阳刚壮盛，势不可挡', meaning:'雷天大壮，刚健壮盛'},
  '晋':  {upper:2, lower:7, wuxing:'火', gong:'离',   summary:'光明远大，步步高升', meaning:'火地晋，进升光明'},
  '明夷':{upper:7, lower:2, wuxing:'土', gong:'坤',   summary:'韬光养晦，暗中积蓄', meaning:'地火明夷，暗中有明'},
  '家人':{upper:4, lower:2, wuxing:'木', gong:'巽',   summary:'家和万事兴', meaning:'风火家人，齐家之道'},
  '睽':  {upper:2, lower:2, wuxing:'火', gong:'离',   summary:'求同存异，化解矛盾', meaning:'火泽睽，乖异不合'},
  '蹇':  {upper:5, lower:6, wuxing:'水', gong:'坎',   summary:'行路艰难，需贵人助', meaning:'水山蹇，前路艰难'},
  '解':  {upper:3, lower:5, wuxing:'木', gong:'震',   summary:'解除困境，重获自由', meaning:'雷水解，解除困厄'},
  '损':  {upper:6, lower:2, wuxing:'土', gong:'艮',   summary:'有舍才有得', meaning:'山泽损，损下益上'},
  '益':  {upper:4, lower:3, wuxing:'木', gong:'巽',   summary:'增益提升，好运加倍', meaning:'风雷益，损上益下'},
  '夬':  {upper:2, lower:1, wuxing:'火', gong:'兑',   summary:'果断决断，除恶务尽', meaning:'泽天夬，决断去弊'},
  '姤':  {upper:1, lower:4, wuxing:'金', gong:'乾',   summary:'不期而遇，意外之喜', meaning:'天风姤，邂逅相遇'},
  '萃':  {upper:2, lower:7, wuxing:'火', gong:'兑',   summary:'聚集力量，汇聚人才', meaning:'泽地萃，聚集荟萃'},
  '升':  {upper:7, lower:4, wuxing:'土', gong:'坤',   summary:'步步高升，前途光明', meaning:'地风升，渐进上升'},
  '困':  {upper:2, lower:5, wuxing:'火', gong:'兑',   summary:'困境之中，坚持信念', meaning:'泽水困，困厄艰难'},
  '井':  {upper:5, lower:4, wuxing:'水', gong:'坎',   summary:'取之不尽，用之不竭', meaning:'水风井，养人之源'},
  '革':  {upper:2, lower:2, wuxing:'火', gong:'离',   summary:'变革创新，破旧立新', meaning:'泽火革，变革鼎新'},
  '鼎':  {upper:2, lower:4, wuxing:'火', gong:'离',   summary:'革故鼎新，功成名就', meaning:'火风鼎，鼎立新基'},
  '震':  {upper:3, lower:3, wuxing:'木', gong:'震',   summary:'临危不乱，以静制动', meaning:'震雷重袭，临危不惧'},
  '艮':  {upper:6, lower:6, wuxing:'土', gong:'艮',   summary:'止步思量，厚积薄发', meaning:'艮山重叠，知止有定'},
  '渐':  {upper:4, lower:6, wuxing:'木', gong:'巽',   summary:'循序渐进，水到渠成', meaning:'风山渐，循序渐进'},
  '归妹':{upper:3, lower:2, wuxing:'木', gong:'震',   summary:'归宿有定，各得其所', meaning:'雷泽归妹，女子出嫁'},
  '丰':  {upper:3, lower:2, wuxing:'木', gong:'震',   summary:'丰收丰满，硕果累累', meaning:'雷火丰，丰盛盈满'},
  '旅':  {upper:2, lower:6, wuxing:'火', gong:'离',   summary:'旅途奔波，居无定所', meaning:'火山旅，行旅在外'},
  '巽':  {upper:4, lower:4, wuxing:'木', gong:'巽',   summary:'柔顺如风，随风而动', meaning:'巽风相随，柔顺而入'},
  '兑':  {upper:2, lower:2, wuxing:'火', gong:'兑',   summary:'和悦待人，以诚相待', meaning:'兑泽相丽，悦乐之道'},
  '涣':  {upper:4, lower:5, wuxing:'木', gong:'巽',   summary:'涣散之后，重新凝聚', meaning:'风水涣，涣散离析'},
  '节':  {upper:5, lower:2, wuxing:'水', gong:'坎',   summary:'节制有度，适可而止', meaning:'水泽节，节制有度'},
  '中孚':{upper:4, lower:2, wuxing:'木', gong:'巽',   summary:'诚信为本，以信立身', meaning:'风泽中孚，诚信感格'},
  '小过':{upper:3, lower:6, wuxing:'木', gong:'震',   summary:'小有过失，及时改正', meaning:'雷山小过，小有过越'},
  '既济':{upper:5, lower:2, wuxing:'水', gong:'坎',   summary:'功成名就，守成为要', meaning:'水火既济，事已成也'},
  '未济':{upper:2, lower:5, wuxing:'火', gong:'离',   summary:'尚未完成，继续努力', meaning:'火水未济，事未成也'}
};

var _YJ_YAO_CI = {
  '乾':['潜龙勿用','见龙在田，利见大人','君子终日乾乾，夕惕若厉','或跃在渊，无咎','飞龙在天，利见大人','亢龙有悔'],
  '坤':['履霜，坚冰至','直方大，不习无不利','含章可贞，或从王事','括囊，无咎无誉','黄裳，元吉','龙战于野，其血玄黄'],
  '屯':['磐桓，利居贞','屯如邅如，乘马班如','即鹿无虞，惟入于林中','乘马班如，求婚媾','屯其膏，小贞吉大贞凶','乘马班如，泣血涟如'],
  '蒙':['发蒙，利用刑人','包蒙吉，纳妇吉','勿用取女，见金夫','困蒙，吝','童蒙，吉','击蒙，不利为寇利御寇'],
  '需':['需于郊，利用恒','需于沙，小有言终吉','需于泥，致寇至','需于血，出自穴','需于酒食，贞吉','入于穴，有不速之客三人来'],
  '讼':['不永所事，小有言终吉','不克讼，归而逋','食旧德，贞厉终吉','不克讼，复即命渝','讼元吉','或锡之鞶带，终朝三褫之'],
  '师':['师出以律，否臧凶','在师中，吉无咎','师或舆尸，凶','师左次，无咎','田有禽，利执言','大君有命，开国承家'],
  '比':['有孚比之，无咎','比之自内，贞吉','比之匪人，不亦伤乎','外比之，贞吉','显比，王用三驱','比之无首，凶'],
  '小畜':['复自道，何其咎','牵复，吉','舆说辐，夫妻反目','有孚，血去惕出无咎','有孚挛如，富以其邻','既雨既处，尚德载'],
  '履':['素履，往无咎','履道坦坦，幽人贞吉','眇能视，跛能履','履虎尾，愬愬终吉','夬履，贞厉','视履考祥，其旋元吉'],
  '泰':['拔茅茹，以其汇','包荒，用冯河','无平不陂，无往不复','翩翩，不富以其邻','帝乙归妹，以祉元吉','城复于隍，勿用师'],
  '否':['拔茅茹，以其汇','包承，小人吉大人否','包羞','有命无咎，畴离祉','休否，大人吉','倾否，先否后喜'],
  '同人':['同人于门，无咎','同人于宗，吝','伏戎于莽，升其高陵','乘其墉，弗克攻','同人先号咷而后笑','同人于郊，无悔'],
  '大有':['无交害，匪咎艰则无咎','大车以载，有攸往无咎','公用亨于天子，小人弗克','匪其彭，无咎','厥孚交如，威如吉','自天祐之，吉无不利'],
  '谦':['谦谦君子，用涉大川吉','鸣谦，贞吉','劳谦君子，有终吉','无不利，撝谦','不富以其邻，利用侵伐','鸣谦，利用行师征邑国'],
  '豫':['鸣豫，凶','介于石，不终日贞吉','盱豫，悔迟有悔','由豫，大有得勿疑','贞疾，恒不死','冥豫，成有渝无咎'],
  '随':['官有渝，贞吉','系小子，失丈夫','系丈夫，失小子','随有获，贞凶','孚于嘉，吉','拘系之，乃从维之'],
  '蛊':['干父之蛊，有子考无咎','干母之蛊，不可贞','干父之蛊，小有悔无大咎','裕父之蛊，往见吝','干父之蛊，用誉','不事王侯，高尚其事'],
  '临':['咸临，贞吉','咸临，吉无不利','甘临，无攸利','至临，无咎','知临，大君之宜','敦临，吉无咎'],
  '观':['童观，小人无咎君子吝','窥观，利女贞','观我生进退','观国之光，利用宾于王','观我生，君子无咎','观其生，君子无咎'],
  '噬嗑':['屦校灭趾，无咎','噬肤灭鼻，无咎','噬腊肉，遇毒小吝','噬干胏，得金矢利艰贞','噬干肉，得黄金贞厉','何校灭耳，凶'],
  '贲':['贲其趾，舍车而徒','贲其须','贲如濡如，永贞吉','贲如皤如，白马翰如','贲于丘园，束帛戋戋','白贲，无咎'],
  '剥':['剥床以足，蔑贞凶','剥床以辨，蔑贞凶','剥之无咎','剥床以肤，凶','贯鱼以宫人宠','硕果不食，君子得舆'],
  '复':['不远复，无祗悔','休复，吉','频复，厉无咎','中行独复','敦复，无悔','迷复，凶有灾眚'],
  '无妄':['无妄往，吉','不耕获，不菑畬','无妄之灾，或系之牛','可贞，无咎','无妄之疾，勿药有喜','无妄行，有眚无攸利'],
  '大畜':['有厉，利已','舆说輹','良马逐，利艰贞','童牛之牿，元吉','豮豕之牙，吉','何天之衢，亨'],
  '颐':['舍尔灵龟，观我朵颐凶','颠颐，拂经于丘颐','拂颐，贞凶十年勿用','颠颐，吉虎视眈眈','拂经，居贞吉不可涉大川','由颐，厉吉利涉大川'],
  '大过':['藉用白茅，无咎','枯杨生稊，老夫得其女妻','栋桡，凶','栋隆，吉有它吝','枯杨生华，老妇得其士夫','过涉灭顶，凶无咎'],
  '坎':['习坎，入于坎窞凶','坎有险，求小得','来之坎坎，险且枕','樽酒簋贰，用缶纳约自牖','坎不盈，祗既平无咎','上六失道，凶三岁'],
  '离':['履错然，敬之无咎','黄离，元吉','日昃之离，不鼓缶而歌','突如其来如，焚如死如弃如','出涕沱若，戚嗟若吉','王用出征，有嘉折首'],
  '咸':['咸其拇','咸其腓，凶居吉','咸其股，执其随往吝','贞吉悔亡，憧憧往来','咸其脢，无悔','咸其辅颊舌'],
  '恒':['浚恒，贞凶无攸利','悔亡','不恒其德，或承之羞贞吝','田无禽','恒其德，贞妇人吉','振恒，凶'],
  '遁':['遁尾厉，勿用有攸往','执之用黄牛之革','系遁，有疾厉','好遁，君子吉小人否','嘉遁，贞吉','肥遁，无不利'],
  '大壮':['壮于趾，征凶有孚','贞吉','小人用壮，君子用罔','藩决不赢，壮于大舆之輹','丧羊于易，无悔','羝羊触藩，不能退不能遂'],
  '晋':['晋如摧如，贞吉罔孚裕无咎','晋如愁如，贞吉受兹介福','众允，悔亡','晋如鼫鼠，贞厉','悔亡失得勿恤','晋其角，维用伐邑'],
  '明夷':['明夷于飞，垂其翼','明夷于左股，用拯马壮','明夷于南狩，得其大首','入于左腹，获明夷之心','箕子之明夷，利贞','不明晦，初登于天后入于地'],
  '家人':['闲有家，悔亡','无攸遂，在中馈','家人嗃嗃，悔厉吉','富家，大吉','王假有家，勿恤吉','有孚威如，终吉'],
  '睽':['悔亡，丧马勿逐自复','遇主于巷，无咎','见舆曳，其牛掣','睽孤遇元夫，交孚厉无咎','悔亡，厥宗噬肤往何咎','睽孤见豕负涂，载鬼一车'],
  '蹇':['往蹇来誉','王臣蹇蹇，匪躬之故','往蹇来反','往蹇来连','大蹇朋来','往蹇来硕吉利见大人'],
  '解':['无咎','田获三狐，得黄矢贞吉','负且乘，致寇至贞吝','解而拇，朋至斯孚','君子维有解，吉有孚于小人','公用射隼于高墉之上'],
  '损':['巳事遄往，无咎酌损之','利贞，征凶弗损益之','三人行则损一人，一人行则得其友','损其疾，使遄有喜无咎','或益之十朋之龟弗克违','弗损益之，无贞吉利有攸往'],
  '益':['利用为大作，元吉无咎','或益之十朋之龟，弗克违','益之用凶事，无咎有孚中行','中行告公从，利用为依迁国','有孚惠心，勿问元吉','莫益之，或击之立心勿恒凶'],
  '夬':['壮于前趾，往不胜为咎','惕号，莫夜有戎勿恤','壮于頄，有凶君子夬夬','臀无肤，其行次且','苋陆夬夬，中行无咎','无号，终有凶'],
  '姤':['系于金柅，贞吉有攸往','包有鱼，无咎不利宾','臀无肤，其行次且厉无大咎','包无鱼，起凶','以杞包瓜，含章有陨自天','姤其角，吝无咎'],
  '萃':['有孚不终，乃乱乃萃','引吉无咎，孚乃利用禴','萃如嗟如，无攸利往无咎','大吉无咎','萃有位，无咎匪孚','齎咨涕洟，无咎'],
  '升':['允升，大吉','孚乃利用禴，无咎','升虚邑','王用亨于岐山，吉无咎','贞吉升阶','冥升，利于不息之贞'],
  '困':['臀困于株木，入于幽谷','困于酒食，朱绂方来','困于石，据于蒺藜','来徐徐，困于金车','劓刖，困于赤绂','困于葛藟，于臲卼'],
  '井':['井泥不食，旧井无禽','井谷射鲋，瓮敝漏','井渫不食，为我心恻','井甃，无咎','井洌寒泉，食','井收勿幕，有孚元吉'],
  '革':['巩用黄牛之革','巳日乃革之，征吉无咎','征凶，贞厉','悔亡，有孚改命吉','大人虎变，未占有孚','君子豹变，小人革面'],
  '鼎':['鼎颠趾，利出否','鼎有实，我仇有疾','鼎耳革，其行塞','鼎折足，覆公餗','鼎黄耳金铉，利贞','鼎玉铉，大吉无不利'],
  '震':['震来虩虩，后笑言哑哑吉','震来历，亿丧贝跻于九陵','震苏苏，震行无眚','震遂泥','震往来厉，亿无丧有事','震索索，视矍矍征凶'],
  '艮':['艮其趾，无咎利用恒','艮其腓，不拯其随心不快','艮其限，列其夤厉薰心','艮其身，无咎','艮其辅，言有序悔亡','敦艮，吉'],
  '渐':['鸿渐于干，小子厉有言','鸿渐于磐，饮食衎衎吉','鸿渐于陆，夫征不复','鸿渐于木，或得其桷','鸿渐于陵，妇三岁不孕','鸿渐于逵，其羽可用为仪'],
  '归妹':['归妹以娣，跛能履征吉','眇能视，利幽人之贞','归妹以须，反归以娣','归妹愆期，迟归有时','帝乙归妹，其君之袂','女承筐无实，士刲羊无血'],
  '丰':['遇其配主，虽旬无咎往有尚','丰其蔀，日中见斗往得疑疾','丰其沛，日中见沬折其右肱','丰其蔀，日中见斗遇其夷主','来章，有庆誉吉','丰其屋，蔀其家窥其户'],
  '旅':['旅琐琐，斯其所取灾','旅即次，怀其资得童仆贞','旅焚其次，丧其童仆贞厉','旅于处，得其资斧我心不快','射雉一矢亡，终以誉命','鸟焚其巢，旅人先笑后号咷'],
  '巽':['进退，利武人之贞','巽在床下，用史巫纷若吉','频巽，吝','悔亡，田获三品','贞吉悔亡无不利','巽在床下，丧其资斧贞凶'],
  '兑':['和兑，吉','孚兑，吉悔亡','来兑，凶','商兑未宁，介疾有喜','孚于剥，有厉','引兑'],
  '涣':['用拯马壮，吉','涣奔其机，悔亡','涣其躬，无悔','涣其群，元吉涣有丘','涣汗其大号，涣王居无咎','涣其血，去逖出无咎'],
  '节':['不出户庭，无咎','不出门庭，凶','不节若，则嗟若无咎','安节，亨','甘节，吉往有尚','苦节，贞凶悔亡'],
  '中孚':['虞吉，有它不燕','鹤鸣在阴，其子和之','得敌，或鼓或罢或泣或歌','月几望，马匹亡无咎','有孚挛如，无咎','翰音登于天，贞凶'],
  '小过':['飞鸟以凶','过其祖，遇其妣','弗过防之，从或戕之','无咎，弗过遇之往厉必戒','密云不雨，自我西郊','弗遇过之，飞鸟离之凶'],
  '既济':['曳其轮，濡其尾无咎','妇丧其茀，勿逐七日得','高宗伐鬼方，三年克之','繻有衣袽，终日戒','东邻杀牛，不如西邻之禴祭','濡其首，厉'],
  '未济':['濡其尾，吝','曳其轮，贞吉','未济征凶，利涉大川','贞吉悔亡，震用伐鬼方三年','贞吉无悔，君子之光有孚','饮酒濡首，亦不知节矣']
};

var _YAO_POS_MEANING = {
  0: {name:'初爻', detail:'事物发端之时，影响根基。初爻吉则根基稳固，初爻凶则起步艰难。初爻为潜藏之位，宜蓄积不宜显露。'},
  1: {name:'二爻', detail:'事物渐成但未成之时。二爻为内卦中位，主资质禀赋。二爻吉则才华可展，二爻凶则内在不足。'},
  2: {name:'三爻', detail:'事物发展最费力之时。三爻为内外之交，主变动过渡。三爻吉则化险为夷，三爻凶则进退两难。'},
  3: {name:'四爻', detail:'事物接近完成之时。四爻为外卦初位，主进退出入。四爻吉则接近成功，四爻凶则功败垂成。'},
  4: {name:'五爻', detail:'事物大成之时。五爻为外卦中位，主尊贵之位。五爻吉则功成名就，五爻凶则高处不胜寒。'},
  5: {name:'上爻', detail:'事物极盛将衰之时。上爻为终极之位。上爻吉则善始善终，上爻凶则乐极生悲。'}
};

function _yjWxRelation(a, b) {
  if (a === b) return '比和';
  let sheng = {'金生水':1,'水生木':1,'木生火':1,'火生土':1,'土生金':1};
  if (sheng[a+'生'+b]) return '我生';
  if (sheng[b+'生'+a]) return '生我';
  let ke = {'金克木':1,'木克土':1,'土克水':1,'水克火':1,'火克金':1};
  if (ke[a+'克'+b]) return '我克';
  if (ke[b+'克'+a]) return '克我';
  return '比和';
}

function getYijingReadingV2(guaName, yaoData, question) {
  if (!guaName || typeof guaName !== 'string') return '<p class="error-tip">卦名无效</p>';
  if (!guaName) guaName = '乾';
  if (!question) question = '所问之事';
  
  let hex = _YJ_HEX_DATA[guaName];
  if (!hex) {
    return {summary: '卦象参悟中', yaoci: '', analysis: '此卦需结合具体问事分析', dimensions: {事业:'★★☆ 待确认', 财运:'★★☆ 待确认', 婚姻:'★★☆ 待确认', 健康:'★★☆ 待确认'}, advice: '综合判断后给出建议，一切随缘', timing: '应期视具体动爻而定'};
  }
  
  let upperWx = _YJ_GUA_XIANG[hex.upper] ? _YJ_GUA_XIANG[hex.upper].wuxing : '金';
  let lowerWx = _YJ_GUA_XIANG[hex.lower] ? _YJ_GUA_XIANG[hex.lower].wuxing : '金';
  let guaWx = hex.wuxing || '金';
  
  let dongYaos = [];
  if (yaoData && yaoData.dongYao !== undefined) {
    let dongIdx = yaoData.dongYao;
    dongYaos = Array.isArray(dongIdx) ? dongIdx : [dongIdx];
  }
  if (dongYaos.length === 0) dongYaos = [4];
  
  let yaociParts = [];
  if (_YJ_YAO_CI[guaName]) {
    for (let di = 0; di < dongYaos.length; di++) {
      let dy = dongYaos[di];
      if (dy >= 0 && dy < 6) {
        let yaoText = _YJ_YAO_CI[guaName][dy] || '爻象参详';
        let posInfo = _YAO_POS_MEANING[dy] || {name:'第'+(dy+1)+'爻', detail:''};
        yaociParts.push(posInfo.name + '「' + yaoText + '」——' + posInfo.detail);
      }
    }
  }
  let yaociStr = yaociParts.join('\n') || '本卦无动爻，以卦象整体论之。';
  
  let isBodyInner = dongYaos.length < 3;
  let tiGua = isBodyInner ? hex.lower : hex.upper;
  let yongGua = isBodyInner ? hex.upper : hex.lower;
  let tiName = _YJ_GUA_XIANG[tiGua] ? _YJ_GUA_XIANG[tiGua].name : '未知';
  let yongName = _YJ_GUA_XIANG[yongGua] ? _YJ_GUA_XIANG[yongGua].name : '未知';
  let tiWx = _YJ_GUA_XIANG[tiGua] ? _YJ_GUA_XIANG[tiGua].wuxing : lowerWx;
  let yongWx = _YJ_GUA_XIANG[yongGua] ? _YJ_GUA_XIANG[yongGua].wuxing : upperWx;
  let tyRel = _yjWxRelation(tiWx, yongWx);
  
  let tyText = '体卦为' + tiName + '（' + tiWx + '），用卦为' + yongName + '（' + yongWx + '）。';
  if (tyRel === '生我') tyText += '用生体，事得外力相助，易于成功。';
  else if (tyRel === '我生') tyText += '体生用，先付出而后得，虽有耗损终成事。';
  else if (tyRel === '比和') tyText += '体用比和，内外一致，谋事顺遂。';
  else if (tyRel === '克我') tyText += '用克体，事受压制，阻力较多，宜谨慎行事。';
  else if (tyRel === '我克') tyText += '体克用，我克制事，可成但需费力。';
  
  let q = question.toLowerCase();
  let isCareer = q.indexOf('事业') >= 0 || q.indexOf('工作') >= 0 || q.indexOf('官') >= 0 || q.indexOf('职') >= 0;
  let isWealth = q.indexOf('财') >= 0 || q.indexOf('钱') >= 0 || q.indexOf('投资') >= 0 || q.indexOf('生意') >= 0;
  let isMarriage = q.indexOf('婚') >= 0 || q.indexOf('感') >= 0 || q.indexOf('恋爱') >= 0 || q.indexOf('姻') >= 0 || q.indexOf('情') >= 0;
  let isHealth = q.indexOf('健康') >= 0 || q.indexOf('病') >= 0 || q.indexOf('身') >= 0 || q.indexOf('医') >= 0;
  
  let jiXiong = '平';
  let score = 3;
  if (tyRel === '生我') { jiXiong = '吉'; score = 4.2; }
  else if (tyRel === '比和') { jiXiong = '吉'; score = 4; }
  else if (tyRel === '我克') { jiXiong = '小吉'; score = 3.5; }
  else if (tyRel === '我生') { jiXiong = '平'; score = 2.5; }
  else if (tyRel === '克我') { jiXiong = '凶'; score = 1.5; }
  
  let jiHex = ['泰','大有','谦','随','复','益','升','晋','既济','家人'];
  let xiongHex = ['否','剥','蹇','困','明夷','坎','大过','未济'];
  if (jiHex.indexOf(guaName) >= 0) { score += 0.8; if (jiXiong !== '凶') jiXiong = '吉'; }
  if (xiongHex.indexOf(guaName) >= 0) { score -= 0.8; if (jiXiong !== '吉') jiXiong = '凶'; }
  
  let jiYao = [1,4,5];
  let xiongYao = [0,2,3];
  for (let yi = 0; yi < dongYaos.length; yi++) {
    if (jiYao.indexOf(dongYaos[yi]) >= 0) score += 0.3;
    if (xiongYao.indexOf(dongYaos[yi]) >= 0) score -= 0.3;
  }
  score = Math.max(0.5, Math.min(5, score));
  
  let analysisParts = [];
  analysisParts.push('1. 卦象核心：' + hex.summary + '。「' + hex.meaning + '」。' + guaName + '卦属' + guaWx + '，' + (hex.gong || '八纯') + '宫。');
  analysisParts.push('2. 体用关系：' + tyText);
  analysisParts.push('3. 吉凶判断：' + jiXiong + '（' + _qmStars(score) + '）。');
  
  if (isCareer) analysisParts.push('4. 问事业：' + (hex.gong === '乾' || hex.gong === '震' ? '刚健进取之象，事业宜主动出击。' : hex.gong === '坤' || hex.gong === '艮' ? '厚德载物之象，事业宜稳扎稳打。' : hex.gong === '离' || hex.gong === '兑' ? '文明悦合之象，事业宜人际合作。' : '此卦中平，事业按部就班即可。') + (tyRel === '生我' ? '用生体，外部助力明显。' : tyRel === '克我' ? '用克体，阻力较大，宜等待时机。' : '体用关系平和，按计划行事。'));
  else if (isWealth) analysisParts.push('4. 问财运：' + (guaWx === '金' ? '金卦主财，求财有望但需谨慎。' : guaWx === '水' ? '水卦主流通，财运流动不居。' : guaWx === '木' ? '木卦主生发，财运渐长。' : guaWx === '火' ? '火卦主迅猛，财来快去亦快。' : '土卦主积蓄，财运稳定。') + (tyRel === '克我' ? '用克体，防破财。' : tyRel === '生我' ? '用生体，财来就我。' : '收支平衡。'));
  else if (isMarriage) analysisParts.push('4. 问婚姻：' + (guaName === '咸' || guaName === '归妹' || guaName === '家人' ? '此为婚恋吉卦。' : guaName === '睽' ? '睽卦主乖离，感情需多沟通。' : '此卦于婚姻' + (jiXiong === '吉' ? '吉，可成' : jiXiong === '凶' ? '不利，需多努力' : '中平，顺其自然') + '。'));
  else if (isHealth) analysisParts.push('4. 问健康：' + (guaWx === '金' ? '金卦主肺，注意呼吸系统。' : guaWx === '木' ? '木卦主肝，注意肝胆。' : guaWx === '水' ? '水卦主肾，注意泌尿系统。' : guaWx === '火' ? '火卦主心，注意心脑血管。' : '土卦主脾胃，注意消化系统。') + (jiXiong === '凶' ? '需注意调养。' : '身体状态尚可。'));
  else analysisParts.push('4. 问' + (question || '事') + '：' + hex.summary + '。' + (tyRel === '生我' ? '此事得外部助力。' : tyRel === '克我' ? '此事有阻力，需提前准备。' : '此事平顺。'));
  
  let analysis = analysisParts.join('\n');
  
  let dimScore = function(baseScore, topic) {
    let s = baseScore;
    if (topic === '事业' && hex.gong === '乾') s += 0.5;
    if (topic === '财运' && guaWx === '金') s += 0.5;
    if (topic === '婚姻' && (guaName === '咸' || guaName === '归妹' || guaName === '家人')) s += 0.8;
    if (topic === '婚姻' && (guaName === '睽' || guaName === '明夷')) s -= 0.5;
    if (topic === '健康' && guaWx === '土') s += 0.3;
    if (topic === '健康' && guaWx === '水') s -= 0.2;
    return Math.max(0.5, Math.min(5, s));
  };
  
  let cs = dimScore(score, '事业'), ws2 = dimScore(score, '财运'), ms = dimScore(score, '婚姻'), hs2 = dimScore(score, '健康');
  let dimText = function(topic, sVal, extra) {
    let stars = _qmStars(sVal);
    if (sVal >= 4) return stars + ' ' + topic + '运佳，' + (extra || '顺遂之象');
    if (sVal >= 3) return stars + ' ' + topic + '运中平，' + (extra || '按部就班');
    return stars + ' ' + topic + '运欠佳，' + (extra || '宜谨慎行事');
  };
  
  let dimensions = {
    事业: dimText('事业', cs, hex.gong === '乾' ? '刚健有成' : '稳步前行'),
    财运: dimText('财运', ws2, guaWx === '金' ? '财星得力' : '收支平衡'),
    婚姻: dimText('婚姻', ms, guaName === '咸' ? '感通天地' : '顺其自然'),
    健康: dimText('健康', hs2, guaWx === '土' ? '脾土稳固' : '注意调理')
  };
  
  let adviceParts = [];
  if (tyRel === '生我') adviceParts.push('万事吉顺，宜积极行动，把握良机。');
  else if (tyRel === '比和') adviceParts.push('内外和谐，宜合作共事，团队发力。');
  else if (tyRel === '我克') adviceParts.push('事虽可成，但需付出相当努力，不可轻敌。');
  else if (tyRel === '我生') adviceParts.push('时运稍耗，宜适当节制，积蓄力量。');
  else if (tyRel === '克我') adviceParts.push('当前局势不利，宜暂避锋芒，等待转机。');
  
  if (dongYaos.length > 0) {
    let dy0 = dongYaos[0];
    if (dy0 === 0) adviceParts.push('初爻动，事在初始，宜慎重奠基。');
    else if (dy0 === 1) adviceParts.push('二爻动，事态方兴，宜积极表现。');
    else if (dy0 === 2) adviceParts.push('三爻动，事到中途，需多加努力。');
    else if (dy0 === 3) adviceParts.push('四爻动，事将成就，不可半途而废。');
    else if (dy0 === 4) adviceParts.push('五爻动，事已大成，宜守成勿贪。');
    else if (dy0 === 5) adviceParts.push('上爻动，事至极盛，宜见好就收。');
  }
  let advice = adviceParts.join('');
  
  let wxWangTime = {'金':'秋季','木':'春季','水':'冬季','火':'夏季','土':'四季末'};
  let wxWangYue = {'金':['申','酉'],'木':['寅','卯'],'水':['亥','子'],'火':['巳','午'],'土':['辰','戌','丑','未']};
  let guaWangYue = wxWangYue[guaWx] || ['辰','戌'];
  let timing = '卦气旺于' + (wxWangTime[guaWx] || '当令之时') + '（' + guaWangYue.join('、') + '月）';
  if (dongYaos.length > 0) timing += '，动爻在' + (dongYaos[0]+1) + '位，主' + (dongYaos[0]+1) + '个月内或有应验';
  else timing += '，无动爻，以三个月至半年为参考';
  
  let summary = hex.summary + '。「' + hex.meaning + '」' + guaName + '卦' + (jiXiong === '吉' ? '大吉之象。' : jiXiong === '凶' ? '须谨慎之象。' : '平顺之象。') + '动' + (dongYaos.length > 0 ? dongYaos.map(function(d){ return '第'+(d+1)+'爻'; }).join('、') : '静') + '，' + (tyRel === '生我' ? '外力相助' : tyRel === '克我' ? '外力相阻' : '内外相合') + '。';
  
  return {
    summary: summary,
    yaoci: yaociStr,
    analysis: analysis,
    dimensions: dimensions,
    advice: advice,
    timing: timing,
    score: score,
    jiXiong: jiXiong,
    tiGua: tiName + '(' + tiWx + ')',
    yongGua: yongName + '(' + yongWx + ')',
    tiYong: tyRel
  };
}

function getYijingReadingHTML(guaName) {
  let r = getYijingReading(guaName);
  let html = '';
  html += '<div class="analysis-card" style="border:1px solid rgba(201,168,76,.2);margin-top:20px">';
  html += '<h5 style="font-size:16px;color:var(--gold);letter-spacing:4px">📖 卦象解读</h5>';
  html += '<p style="font-size:18px;font-family:\'Ma Shan Zheng\',serif;color:var(--gold);margin:16px 0">「' + r.summary + '」</p>';
  if (r.yaoci) html += '<p style="font-size:13px;line-height:1.8;opacity:.7;white-space:pre-line">' + r.yaoci + '</p>';
  if (r.analysis) html += '<p style="font-size:13px;line-height:1.8;opacity:.7;white-space:pre-line">' + r.analysis + '</p>';
  html += '<p class="rpt-is-84">' + (r.advice || '') + '</p>';
  if (r.timing) html += '<p class="rpt-is-48">⏰ ' + r.timing + '</p>';
  let dims = r.dimensions || {};
  html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:16px;text-align:center;font-size:12px">';
  html += '<div>事业：' + (dims['事业']||'') + '</div>';
  html += '<div>财运：' + (dims['财运']||'') + '</div>';
  html += '<div>婚姻：' + (dims['婚姻']||'') + '</div>';
  html += '<div>健康：' + (dims['健康']||'') + '</div>';
  html += '</div>';
  html += '</div>';
  return html;
}

function getQimenReading(palace) {
  // Legacy fallback - now delegates to V2 with minimal data
  return getQimenReadingV2(palace, null, '', null);
}

})(typeof window !== "undefined" ? window : globalThis);
