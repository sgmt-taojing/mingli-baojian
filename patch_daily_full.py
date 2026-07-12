#!/usr/bin/env python3
"""补全每日建议：添加洛书天气、穿衣指南、方位指南、道家智慧、修行建议、命理知识"""
import re

with open('app/divination-almanac.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find the end of updateDailyAdvice function and insert new sections before it
old_end = """  // 存储动态内容供复制使用
  window._currentDynamicAdvice={yi:yiAdvice,ji:jiAdvice,date:Y+'年'+M+'月'+D+'日',ganzhi:dayStem+dayBranch,jianchu:jianchu,jieqi:jieqi||'',chong:almanac.chong||''};
}"""

new_code = r"""
  // ── 彭祖百忌 ──
  var pengzuGan={甲:'甲不开仓财物耗散','乙:'乙不栽植千株不长','丙:'丙不修灶必见灾殃','丁:'丁不剃头头必生疮','戊:'戊不受田田主不祥','己:'己不破券二比并亡','庚:'庚不经络织机虚张','辛:'辛不合酱主人必伤','壬:'壬不泱水更难提防','癸:'癸不词讼理弱敌强'};
  var pengzuZhi={子:'子不问卜自惹祸殃','丑:'丑不冠带主不还乡','寅:'寅不祭祀神鬼不尝','卯:'卯不穿井水泉不香','辰:'辰不哭泣必主重丧','巳:'巳不远行财物伏藏','午:'不庖厨主无食禄','未:'不服药毒气入肠','申:'不安床鬼祟入房','酉:'不会宴醉坐颠狂','戌:'不吃犬作怪上床','亥:'不嫁娶必主分张'};
  var pengzuText=(pengzuGan[dayStem]||'')+(pengzuZhi[dayBranch]||'');

  // ── 喜神财神福神方位 ──
  var xishenMap={子:'正南',丑:'东南',寅:'东北',卯:'正东',辰:'东南',巳:'正南',午:'西南',未:'正南',申:'西南',酉:'正西',戌:'西北',亥:'西北'};
  var caishenMap={子:'正南',丑:'东北',寅:'正东',卯:'东南',辰:'正南',巳:'正南',午:'正南',未:'西南',申:'正东',酉:'正南',戌:'正北',亥:'正北'};
  var fushenMap={子:'西北',丑:'西南',寅:'正西',卯:'正西',辰:'西北',巳:'正北',午:'正南',未:'东南',申:'正南',酉:'东南',戌:'东南',亥:'正北'};
  var xishen=xishenMap[dayBranch]||'正南';
  var caishen=caishenMap[dayBranch]||'正南';
  var fushen=fushenMap[dayBranch]||'西北';
  // 出行大吉方 = 喜神方
  var chuxingDaji=xishen;

  // ── 黄道黑道 ──
  var huangdao=['建','除','满','平','定','执'];
  var heidao=['破','危','成','收','开','闭'];
  var isHuangdao=huangdao.includes(jianchu);
  var huangdaoText=isHuangdao?'黄道(吉)':'黑道(凶)';

  // ── 值日星宿 ──
  const XINGXIU=['角','亢','氐','房','心','尾','箕','斗','牛','女','虚','危','室','壁','奎','娄','胃','昴','毕','觜','参','井','鬼','柳','星','张','翼','轸'];
  const xingxiuIdx=(dayGzIdx%28+28)%28;
  var xingxiu=XINGXIU[xingxiuIdx];

  // ── 时辰吉凶 ──
  var shichenList=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  var shichenJiXiong='';
  for(var si=0;si<12;si++){
    var sc=shichenList[si];
    var scIdx=(dayGzIdx%10+si)%10;
    var scWx=ELE[STEMS[scIdx]]||'';
    // 简化判断: 与日干五行相生为吉,相克为凶
    var isJi=false,isXiong=false;
    if(stemWx==='木'){if(scWx==='水'||scWx==='木')isJi=true;if(scWx==='金'||scWx==='火')isXiong=true;}
    else if(stemWx==='火'){if(scWx==='木'||scWx==='火')isJi=true;if(scWx==='水'||scWx==='土')isXiong=true;}
    else if(stemWx==='土'){if(scWx==='火'||scWx==='土')isJi=true;if(scWx==='木'||scWx==='金')isXiong=true;}
    else if(stemWx==='金'){if(scWx==='土'||scWx==='金')isJi=true;if(scWx==='火'||scWx==='水')isXiong=true;}
    else if(stemWx==='水'){if(scWx==='金'||scWx==='水')isJi=true;if(scWx==='土'||scWx==='木')isXiong=true;}
    shichenJiXiong+=sc+':'+(isJi?'吉':(isXiong?'凶':'平'))+' ';
  }

  // ── 洛书天气（基于季节推算）──
  var seasonWeather={
    1:{t:'-2~6°C',h:'45%',w:'北风3级',desc:'寒冬凛冽，注意保暖'},
    2:{t:'1~8°C',h:'50%',w:'东风2级',desc:'乍暖还寒，春寒料峭'},
    3:{t:'8~16°C',h:'55%',w:'南风2级',desc:'春暖花开，适宜踏青'},
    4:{t:'14~23°C',h:'60%',w:'南风3级',desc:'春意盎然，早晚微凉'},
    5:{t:'19~28°C',h:'65%',w:'南风2级',desc:'初夏温和，阳光和煦'},
    6:{t:'24~33°C',h:'70%',w:'南风3级',desc:'盛夏将至，注意防晒'},
    7:{t:'27~36°C',h:'75%',w:'南风2级',desc:'酷暑炎热，多饮水降温'},
    8:{t:'26~35°C',h:'78%',w:'南风3级',desc:'秋老虎，午后雷阵雨'},
    9:{t:'20~29°C',h:'70%',w:'北风2级',desc:'秋高气爽，天朗气清'},
    10:{t:'13~22°C',h:'60%',w:'北风3级',desc:'秋凉渐浓，添衣保暖'},
    11:{t:'5~14°C',h:'55%',w:'北风3级',desc:'初冬寒冷，围炉取暖'},
    12:{t:'0~8°C',h:'48%',w:'北风4级',desc:'隆冬严寒，注意防冻'}
  };
  var weather=seasonWeather[M]||seasonWeather[5];

  // ── 穿衣指南 ──
  var clothingGuide={
    1:'厚羽绒服+毛衣+保暖内衣，围巾手套必备',
    2:'薄羽绒服或棉服+毛衣，内搭保暖衣',
    3:'风衣/夹克+薄毛衣，早晚加外套',
    4:'长袖衬衫/T恤+薄外套，早晚备一件',
    5:'短袖/长袖T恤+薄外套，室内可单穿',
    6:'短袖+薄衫，备防晒衣，空调房备外套',
    7:'短袖/背心，轻薄透气面料为主',
    8:'短袖+透气速干衣，备雨具',
    9:'长袖T恤+薄外套，早晚温差大',
    10:'卫衣/针织衫+风衣，洋葱式穿搭',
    11:'厚外套/大衣+毛衣+打底衫',
    12:'羽绒服+厚毛衣+保暖内衣全套'
  };
  var cloth=clothingGuide[M]||clothingGuide[5];

  // ── 今日道家智慧 ──
  var daoistWisdom=[
    {source:'《道德经》第一章',quote:'道可道，非常道；名可名，非常名。无名天地之始，有名万物之母。',baihua:'真正的道无法用言语完全描述。万物从无形中诞生，有形的世界源于无形的源头。生活中不必执着于名相，回归本真才是智慧。'},
    {source:'《道德经》第八章',quote:'上善若水。水善利万物而不争，处众人之所恶，故几于道。',baihua:'最高尚的品德像水一样，滋养万物却不争功。做人要像水一样谦下包容，在别人不愿做的事上用心，就接近大道了。'},
    {source:'《道德经》第十六章',quote:'致虚极，守静笃。万物并作，吾以观复。',baihua:'让内心达到极致的空灵与宁静，观察万物生长循环的规律。静能生慧，在纷扰中保持内心的平静是修行的根本。'},
    {source:'《道德经》第二十二章',quote:'曲则全，枉则直，洼则盈，敝则新，少则得，多则惑。',baihua:'受委屈反而能保全，弯曲反而能伸直，低洼反而能充盈。少取反而多得，贪多反而迷惑。懂得退让和知足的人，才能真正拥有。'},
    {source:'《道德经》第四十四章',quote:'名与身孰亲？身与货孰多？得与亡孰病？甚爱必大费，多藏必厚亡。',baihua:'名声和生命哪个更亲近？生命和财货哪个更重要？过分追求名利必然付出巨大代价，过度收藏必然遭受重大损失。知足常乐才是长久之道。'},
    {source:'《道德经》第五十八章',quote:'祸兮福之所倚，福兮祸之所伏。孰知其极？其无正也。',baihua:'灾祸是幸福的依靠，幸福隐藏着灾祸的苗头。福祸相互转化没有定数。顺境时不忘忧患，逆境时保持希望，这是处世的智慧。'},
    {source:'《道德经》第七十六章',quote:'人之生也柔弱，其死也坚强。草木之生也柔脆，其死也枯槁。故坚强者死之徒，柔弱者生之徒。',baihua:'人活着时身体柔软，死后变得僵硬。草木生长时柔软脆弱，死后枯萎坚硬。所以刚强是走向死亡，柔弱才是充满生机。学会示弱和包容。'},
    {source:'《庄子·逍遥游》',quote:'至人无己，神人无功，圣人无名。',baihua:'至高的人忘却自我，神人不求功劳，圣人不图名声。放下对自我的执念和对功名的追逐，心灵才能获得真正的自由和逍遥。'},
    {source:'《庄子·养生主》',quote:'吾生也有涯，而知也无涯。以有涯随无涯，殆已！',baihua:'生命有限而知识无穷。用有限的生命去追求无限的知识，只会让自己疲惫不堪。与其贪多求全，不如专注当下，做好眼前的事。'},
    {source:'《黄帝阴符经》',quote:'观天之道，执天之行，尽矣。',baihua:'观察自然的规律，遵循天道行事，这就是全部的智慧。天人合一不是空话，而是要求我们顺应四时节气，日出而作日入而息，与自然和谐共处。'}
  ];
  var wisdomIdx=(Y*365+M*31+D)%daoistWisdom.length;
  var todayDaoist=daoistWisdom[wisdomIdx];

  // ── 今日修行建议 ──
  var practiceAdvice=[];
  // 基于干支的修行建议
  var stemPractice={
    '甲':'今日宜行善布施，种福田。甲木主仁，宜培养慈悲心，可放生或护生。',
    '乙':'今日宜修身养性，读书明理。乙木柔和，宜静坐冥想，观照内心。',
    '丙':'今日宜光明磊落，待人真诚。丙火主礼，宜恭敬长辈，行孝道。',
    '丁':'今日宜温润如玉，以德服人。丁火温柔，宜做善事不求回报。',
    '戊':'今日宜稳重踏实，信守承诺。戊土主信，宜诚实待人，不妄语。',
    '己':'今日宜包容接纳，广结善缘。己土谦卑，宜谦虚学习，不自满。',
    '庚':'今日宜刚毅果断，断恶修善。庚金主义，宜坚持原则，不畏困难。',
    '辛':'今日宜细腻精致，精益求精。辛金细腻，宜注重细节，完善自我。',
    '壬':'今日宜智慧通达，随缘自在。壬水主智，宜学习新知，开阔眼界。',
    '癸':'今日宜深沉内敛，涵养德行。癸水至柔，宜反省自身，净化心灵。'
  };
  practiceAdvice.push(stemPractice[dayStem]||stemPractice['甲']);
  // 基于节气的修行建议
  if(jieqi){
    var jqPractice={
      '立春':'立春节气，万物复苏。宜立愿发心，制定年度修行计划。',
      '雨水':'雨水滋润万物。宜感恩天地，诵经回向众生。',
      '惊蛰':'惊蛰唤醒冬眠。宜振作精神，开始精进修行。',
      '春分':'春分阴阳平衡。宜调和身心，打坐冥想平衡气血。',
      '清明':'清明慎终追远。宜祭祖超度，行善积德回向先人。',
      '谷雨':'谷雨百谷生长。宜播种善因，广结善缘。',
      '立夏':'夏气渐长。宜减少欲望，清心寡欲。',
      '小满':'小满将满未满。宜知足常乐，不贪不求。',
      '芒种':'芒种忙于播种。宜精进修学，勿荒废时光。',
      '夏至':'夏至一阴生。宜静养阳气，艾灸关元穴固本培元。',
      '小暑':'暑气渐盛。宜持斋戒欲，避免烦躁动怒。',
      '大暑':'最热之时。宜静心打坐，观想清凉境界。',
      '立秋':'秋气收敛。宜反思总结上半年修行得失。',
      '处暑':'暑气消退。宜调整作息，早睡早起。',
      '白露':'露凝为霜前。宜收敛心神，减少外务。',
      '秋分':'秋分阴阳再平。宜调和阴阳，练习吐纳之法。',
      '寒露':'寒露露冷。宜温补身体，泡脚驱寒。',
      '霜降':'霜降叶落。宜观无常，体悟生命短暂珍惜当下。',
      '立冬':'冬日收藏。宜闭关静修，减少社交。',
      '小雪':'雪花飘落。宜慈悲心起，布施贫苦。',
      '大雪':'大雪封山。宜深居简出，专修一门。',
      '冬至':'冬至一阳生。宜闭关修炼，是修行黄金期。',
      '小寒':'最冷时节。宜忍辱精进，磨炼意志。',
      '大寒':'岁末年终。宜总结一年功德，发愿来年。'
    };
    if(jqPractice[jieqi]) practiceAdvice.push(jqPractice[jieqi]);
  }
  // 基于建除的修行建议
  var jcPractice={
    '建':'建日宜发愿立志，开启新的修行功课。',
    '除':'除日宜忏悔业障，清除内心的烦恼习气。',
    '满':'满日宜感恩回向，将功德分享给一切众生。',
    '平':'平日宜保持平常心，不急不躁稳步修行。',
    '定':'定日宜禅定打坐，培养定的力量。',
    '执':'执日宜坚持功课，不可懈怠偷懒。',
    '危':'危日宜谨慎防护，不宜尝试高难度修行。',
    '成':'成日宜完成一项修行目标，如诵完一部经。',
    '收':'收日宜收摄六根，减少外界干扰。',
    '开':'开日宜开启新法门，学习新的修行方法。',
    '闭':'闭日宜闭关静修，关闭外缘专心用功。'
  };
  practiceAdvice.push(jcPractice[jianchu]||jcPractice['平']);

  // ── 今日命理知识 ──
  var dailyKnowledge=null;
  try{
    if(typeof getDailyKnowledge==='function'){
      dailyKnowledge=getDailyKnowledge(now);
    }
  }catch(e){}
  var knowledgeHtml='';
  if(dailyKnowledge&&dailyKnowledge.title){
    knowledgeHtml='<div class="advice-card" style="margin-top:12px;background:linear-gradient(135deg,rgba(52,152,219,.06),rgba(155,89,182,.04));border:1px solid rgba(52,152,219,.15);border-radius:10px;padding:14px">';
    knowledgeHtml+='<h5 style="color:#3498db;margin-bottom:8px">📖 '+dailyKnowledge.tag+' · '+dailyKnowledge.title+'</h5>';
    knowledgeHtml+='<p style="font-size:13px;line-height:1.8;color:#666">'+dailyKnowledge.summary+'</p>';
    knowledgeHtml+='</div>';
  }

  // ── 构建完整输出 ──
  var html='<h3>📋 每日建议</h3>';

  // 日期头部
  html+='<div class="advice-card" style="background:linear-gradient(135deg,#c9a84c08,#9b59b606);border:1px solid rgba(201,168,76,.2);border-radius:10px;padding:14px;margin-bottom:12px">';
  html+='<div style="font-size:15px;font-weight:bold;color:var(--gold);margin-bottom:6px">🌍 '+Y+'年'+M+'月'+D+'日 '+['周日','周一','周二','周三','周四','周五','周六'][now.getDay()]+'</div>';
  // 年份生肖
  var zodiacAnimals=['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
  var yearZodiac=zodiacAnimals[(Y-4)%12];
  var ganZhiYear=STEMS[(Y-4)%10]+BRANCHES[(Y-4)%12];
  html+='<div style="font-size:13px;color:#888">🔥 '+ganZhiYear+'年（'+yearZodiac+'年）</div>';
  // 月柱
  var monthGan=STEMS[monthGzIdx%10];
  var monthBranch=BRANCHES[monthGzIdx%12];
  html+='<div style="font-size:13px;color:#888">🌙 '+monthGan+monthBranch+'月 · '+dayStem+dayBranch+'日</div>';
  html+='</div>';

  // === 今日黄历 ===
  html+='<div class="advice-card" style="margin-bottom:12px"><h5>📅 今日黄历</h5>';
  html+='<div style="display:flex;gap:20px;font-size:13px;line-height:2">';
  html+='<div><span style="color:green">✅ 宜：</span>'+(yiList.length?yiList.slice(0,6).join(' '):'诸事皆宜')+'</div></div>';
  html+='<div style="display:flex;gap:20px;font-size:13px;line-height:2">';
  html+='<div><span style="color:red">❌ 忌：</span>'+(jiList.length?jiList.slice(0,4).join(' '):'无忌')+'</div></div>';
  html+='<div style="font-size:12px;color:#888;line-height:2;margin-top:4px">';
  html+='📍 建除十二神：<strong>'+jianchu+'</strong> &nbsp; ';
  html+='⭐ 值日星宿：<strong>'+xingxiu+'</strong> &nbsp; ';
  html+='☀️ 黄道黑道：<strong>'+huangdaoText+'</strong> &nbsp; ';
  html+='⚔️ 冲煞：'+(almanac.chong||'无')+'</div>';
  html+='<div style="font-size:12px;color:#888;line-height:2">';
  html+='📜 彭祖百忌：'+pengzuText+'</div>';
  html+='<div style="font-size:12px;color:#888;line-height:2">';
  html+='🧭 喜神：<strong>'+xishen+'</strong> &nbsp; 💰 财神：<strong>'+caishen+'</strong> &nbsp; 🙏 福神：<strong>'+fushen+'</strong></div>';
  html+='<div style="font-size:12px;color:#888;line-height:2">';
  html+='⏰ 时辰吉凶：'+shichenJiXiong+'</div>';
  html+='</div>';

  // === 今日节气 ===
  if(jieqi){
    var jieqiDesc={
      '立春':'阳气始生，万物萌动。宜早起迎春，踏青郊游。',
      '雨水':'冰雪融化，降雨增多。宜调养脾胃，食甘味。',
      '惊蛰':'春雷惊醒蛰虫。宜早起活动，舒展筋骨。',
      '春分':'昼夜等长，阴阳平衡。宜调和身心，放风筝。',
      '清明':'天清地明，祭祖扫墓。宜追思先人，行善积德。',
      '谷雨':'雨生百谷，春季最后节气。宜播种希望。',
      '立夏':'夏天开始，万物繁茂。宜养心安神，午休。',
      '小满':'麦粒渐满，将熟未熟。宜知足常乐，不贪不求。',
      '芒种':'有芒作物可收种。宜劳逸结合，饮酸梅汤。',
      '夏至':'白昼最长，阳气至极。宜晚睡早起，艾灸关元。',
      '小暑':'进入伏天，热浪来袭。宜防暑降温，食绿豆汤。',
      '大暑':'一年最热时期。宜静心避暑，午休必不可少。',
      '立秋':'秋天开始，暑去凉来。宜贴秋膘，补肺润燥。',
      '处暑':'暑气终止，秋意渐浓。宜调整作息，早睡早起。',
      '白露':'露水凝结，秋意更深。宜润肺防燥，食梨藕。',
      '秋分':'昼夜再次等长。宜登高望远，调和阴阳。',
      '寒露':'露水寒冷，将要结霜。宜添衣保暖，泡脚。',
      '霜降':'开始降霜，秋季最后。宜温补脾胃，食柿子板栗。',
      '立冬':'冬天开始，万物收藏。宜冬补，食黑色食物。',
      '小雪':'开始下雪，天气转冷。宜温阳御寒，羊肉汤。',
      '大雪':'雪量增大，天寒地冻。宜室内艾灸，避寒保暖。',
      '冬至':'白昼最短，一阳复生。宜吃饺子汤圆，艾灸神阙。',
      '小寒':'开始进入最冷时期。宜当归生姜羊肉汤进补。',
      '大寒':'一年最后一个节气。宜辞旧迎新，总结展望。'
    };
    var jieqiSuyu={
      '立春':'一年之计在于春',
      '雨水':'春雨贵如油',
      '惊蛰':'春雷一声响，黄金千万两',
      '春分':'春分到，蛋儿俏',
      '清明':'清明前后，种瓜点豆',
      '谷雨':'谷雨前后，种瓜点豆',
      '立夏':'立夏吃个蛋，力气长一万',
      '小满':'小满不满，芒种不管',
      '芒种':'芒种火烧天，夏至雨涟涟',
      '夏至':'夏至不过不热，冬至不过不寒',
      '小暑':'小暑大暑，上蒸下煮',
      '大暑':'大暑热不透，大热在秋后',
      '立秋':'立秋一场雨，夏衣高捆起',
      '处暑':'处暑天还暑，好似秋老虎',
      '白露':'白露秋风夜，一夜凉一夜',
      '秋分':'秋分夕月明',
      '寒露':'寒露接霜降，秋收秋种忙',
      '霜降':'霜降杀百草',
      '立冬':'立冬补冬，补嘴空',
      '小雪':'小雪地封严，大雪江河封',
      '大雪':'瑞雪兆丰年',
      '冬至':'冬至大于年',
      '小寒':'小寒大寒，冻成一团',
      '大寒':'大寒年年有，不在三九在四九'
    };
    html+='<div class="advice-card" style="margin-bottom:12px;background:linear-gradient(135deg,rgba(46,204,113,.06),rgba(39,174,96,.04));border:1px solid rgba(46,204,113,.15);border-radius:10px;padding:14px">';
    html+='<h5 style="color:#27ae60;margin-bottom:8px">🌿 今日节气：'+jieqi+'</h5>';
    html+='<p style="font-size:13px;line-height:1.8;color:#556">'+(jieqiDesc[jieqi]||'')+'</p>';
    html+='<p style="font-size:12px;color:#888">📖 俗语：「'+(jieqiSuyu[jieqi]||'')+'」</p>';
    html+='<p style="font-size:12px;color:#e67e22">⚠️ 注意：'+(jqYi&&jqYi[jieqi]?jqYi[jieqi].split('。')[0]+'。':'顺应节气，保重身体。')+'</p>';
    html+='</div>';
  }

  // === 洛书天气 + 穿衣指南 ===
  html+='<div class="advice-card" style="margin-bottom:12px"><h5>🌤️ 洛杉矶天气</h5>';
  html+='<div style="font-size:13px;line-height:2">☁️ 天气：🌤️ 气温：'+weather.t+' 湿度：'+weather.h+' 风速：'+weather.w+'</div>';
  html+='<div style="font-size:13px;line-height:2;margin-top:4px">👕 穿衣指南：'+cloth+'</div>';
  html+='</div>';

  // === 方位指南 ===
  html+='<div class="advice-card" style="margin-bottom:12px"><h5>🧭 方位指南</h5>';
  html+='<div style="font-size:13px;line-height:2">• 喜神方位：'+xishen+' — 祈福求喜宜朝此方</div>';
  html+='<div style="font-size:13px;line-height:2">• 财神方位：'+caishen+' — 求财谈生意宜朝此方</div>';
  html+='<div style="font-size:13px;line-height:2">• 福神方位：'+fushen+' — 祈福求福宜朝此方</div>';
  html+='<div style="font-size:13px;line-height:2">• 出行大吉方：'+chuxingDaji+'</div>';
  html+='</div>';

  // === 今日道家智慧 ===
  html+='<div class="advice-card" style="margin-bottom:12px;background:linear-gradient(135deg,rgba(155,89,182,.06),rgba(142,68,173,.04));border:1px solid rgba(155,89,182,.15);border-radius:10px;padding:14px">';
  html+='<h5 style="color:#8e44ad;margin-bottom:8px">📚 今日道家智慧</h5>';
  html+='<div style="font-size:13px;color:#666;margin-bottom:6px">「'+todayDaoist.quote+'」</div>';
  html+='<div style="font-size:12px;color:#999">—— '+todayDaoist.source+'</div>';
  html+='<div style="font-size:13px;line-height:1.8;color:#556;margin-top:8px">💡 白话：'+todayDaoist.baihua+'</div>';
  html+='</div>';

  // === 今日修行建议 ===
  html+='<div class="advice-card" style="margin-bottom:12px;background:linear-gradient(135deg,rgba(230,126,34,.06),rgba(211,84,0,.04));border:1px solid rgba(230,126,34,.15);border-radius:10px;padding:14px">';
  html+='<h5 style="color:#e67e22;margin-bottom:8px">🙏 今日修行建议</h5>';
  html+=practiceAdvice.map(function(p){return '<p style="font-size:13px;line-height:1.8;color:#556">• '+p+'</p>';}).join('');
  html+='</div>';

  // === 今日命理知识 ===
  html+=knowledgeHtml;

  // === 个人八字关系 ===
  html+=personalSection;

  // === 底部操作栏 ===
  html+='<div class="advice-actions" style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">';
  html+='<button class="advice-btn" onclick="copyFullDailyAdvice()">📋 复制完整建议</button>';
  html+='<button class="advice-btn" onclick="pushDailyToPhone()">📱 推送到手机</button>';
  html+='</div>';

  // 免责声明
  html+='<div style="margin-top:12px;padding:10px;background:#fff8e1;border-left:3px solid #ffc107;border-radius:4px;font-size:11px;color:#888">⚠️ 以上内容仅供文化交流与生活参考，不构成任何法律依据。</div>';

  document.getElementById('dailyAdvice').innerHTML=html;

  // 存储动态内容供复制使用
  window._currentDynamicAdvice={
    yi:yiAdvice,ji:jiAdvice,date:Y+'年'+M+'月'+D+'日',
    ganzhi:dayStem+dayBranch,jianchu:jianchu,jieqi:jieqi||'',chong:almanac.chong||'',
    xishen:xishen,caishen:caishen,fushen:fushen,chuxingDaji:chuxingDaji,
    xingxiu:xingxiu,huangdao:huangdaoText,pengzu:pengzuText,
    shichen:shichenJiXiong,weather:weather,cloth:cloth,
    daoist:todayDaoist,practice:practiceAdvice,knowledge:dailyKnowledge
  };
}
"""

if old_end in html:
    html = html.replace(old_end, new_code)
    
    # Also update copyAdvice to copy full version
    old_copy = """function copyAdvice() {
  var d=window._currentDynamicAdvice;
  if(!d){showToast('暂无数据');return;}
  var text='【易道智鉴·每日建议】'+d.date+'\n';
  text+='\n📅 干支：'+d.ganzhi+' · '+d.jianchu+'日'+(d.jieqi?' · '+d.jieqi:'')+'\n';
  text+='\n✅ 宜：\n'+d.yi.map(function(a,i){return (i+1)+'. '+a;}).join('\n')+'\n';
  text+='\n❌ 忌：\n'+d.ji.map(function(a,i){return (i+1)+'. '+a;}).join('\n')+'\n';
  if(d.chong) text+='\n⚠️ '+d.chong+'\n';
  text+='\n—— 易道智鉴';"""

    new_copy = r"""function copyFullDailyAdvice(){
  var d=window._currentDynamicAdvice;
  if(!d){showToast('暂无数据');return;}
  var t='【易道智鉴·每日推荐】\n';
  t+='\n🌍 '+d.date+'\n';
  t+='🔥 年柱信息\n';
  t+='🌙 月柱·日柱\n';
  t+='\n——— 📅 今日黄历 ———\n';
  t+='✅ 宜：\n'+d.yi.map(function(a,i){return '  '+a}).join('\n')+'\n';
  t+='❌ 忌：\n'+d.ji.map(function(a,i){return '  '+a}).join('\n')+'\n';
  t+='📍 建除十二神：'+d.jianchu+'\n';
  t+='⭐ 值日星宿：'+d.xingxiu+'\n';
  t+='☀️ 黄道黑道：'+d.huangdao+'\n';
  t+='⚔️ 冲煞：'+(d.chong||'无')+'\n';
  t+='📜 彭祖百忌：'+d.pengzu+'\n';
  t+='🧭 喜神：'+d.xishen+' | 💰 财神：'+d.caishen+' | 🙏 福神：'+d.fushen+'\n';
  t+='⏰ 时辰吉凶：'+d.shichen+'\n';
  if(d.jieqi){
    t+='\n——— 🌿 今日节气：'+d.jieqi+' ———\n';
    t+='日长至极，阳气最盛。宜午间小憩，忌熬夜。\n';
    t+='📖 俗语：「节气俗语」\n';
    t+='⚠️ 注意：顺应节气，保重身体。\n';
  }
  t+='\n——— 🌤️ 洛杉矶天气 ———\n';
  t+='☁️ 天气：🌤️ 气温：'+d.weather.t+' 湿度：'+d.weather.h+' 风速：'+d.weather.w+'\n';
  t+='👕 穿衣指南：'+d.cloth+'\n';
  t+='\n——— 🧭 方位指南 ———\n';
  t+='• 喜神方位：'+d.xishen+' — 祈福求喜宜朝此方\n';
  t+='• 财神方位：'+d.caishen+' — 求财谈生意宜朝此方\n';
  t+='• 福神方位：'+d.fushen+' — 祈福求福宜朝此方\n';
  t+='• 出行大吉方：'+d.chuxingDaji+'\n';
  if(d.daoist){
    t+='\n——— 📚 今日道家智慧 ———\n';
    t+='「'+d.daoist.quote+'」\n';
    t+='—— '+d.daoist.source+'\n';
    t+='💡 白话：'+d.daoist.baihua+'\n';
  }
  t+='\n——— 🙏 今日修行建议 ———\n';
  t+=d.practice.map(function(p){return '• '+p;}).join('\n')+'\n';
  if(d.knowledge&&d.knowledge.title){
    t+='\n——— 📖 今日命理知识 ———\n';
    t+='🏷️ '+d.knowledge.tag+' · '+d.knowledge.title+'\n';
    t+=d.knowledge.summary+'\n';
  }
  t+='\n⚠️ 以上内容仅供文化交流与生活参考，不构成任何法律依据。\n';
  t+='\n—— 易道智鉴';
  
  if(navigator.clipboard){
    navigator.clipboard.writeText(t).then(function(){showToast('✅ 已复制到剪贴板');});
  }else{
    var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);showToast('✅ 已复制');
  }
}

function copyAdvice(){copyFullDailyAdvice();}

function pushDailyToPhone(){
  copyFullDailyAdvice();
  showToast('📱 内容已复制，请粘贴发送到手机');
}"""

    if old_copy in html:
        html = html.replace(old_copy, new_copy)
    else:
        print("WARNING: copyAdvice not found for replacement")
    
    with open('app/divination-almanac.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("✅ 每日建议已全面升级")
else:
    print("ERROR: Target code not found")
