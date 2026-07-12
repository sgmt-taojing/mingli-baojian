#!/usr/bin/env python3
"""Patch divination-almanac.html: replace hardcoded daily advice with dynamic 7-dimension content"""

filepath = 'app/divination-almanac.html'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old = '''function updateDailyAdvice(almanac) {
  const userData=getUserBazi();
  let personalSection='';
  if(userData){
    const dayEle=userData.dayEle;
    const dayStem=userData.dayStem;
    const todayGanZhi=getGanZhi(new Date(document.getElementById('almanacDate').value));
    const todayGan=todayGanZhi.split(' ')[0];
    const todayEle=ELE[todayGan]||'未知';
    const relations={'木':{'木':'比助','火':'泄','土':'耗','金':'克','水':'生'},
                     '火':{'火':'比','土':'泄','金':'耗','水':'克','木':'生'},
                     '土':{'土':'比','金':'泄','水':'耗','木':'克','火':'生'},
                     '金':{'金':'比','水':'泄','木':'耗','火':'克','土':'生'},
                     '水':{'水':'比','木':'泄','火':'耗','土':'克','金':'生'}};
    const rel=relations[dayEle]?.[todayEle]||'未知';
    personalSection=`
      <div class="advice-card personal-card">
        <h5>⭕ 本日与您八字的关系（${dayStem}日主）</h5>
        <p>今日天干：${todayGan}（${todayEle}）</p>
        <p>对您的影响：<strong>${rel}</strong></p>
        <p>${getPersonalAdvice(dayEle,todayEle)}</p>
      </div>`;
  }
  // 综合三视角生成建议
  const yiAdvice = [
    '修身养性，静心读书',
    '祭祀先祖，祈福纳祥',
    '会友论道，交流学问'
  ];
  
  const jiAdvice = [
    '避免争执，和气生财',
    '不宜远行，居家为安',
    '慎防破财，量入为出'
  ];
  
  const html = `
    <h3>每日建议</h3>
    <div class="advice-grid">
      <div class="advice-card yi-card">
        <h5>✓ 今日宜做</h5>
        <ol>
          ${yiAdvice.map(a => `<li>${a}</li>`).join('')}
        </ol>
      </div>
      <div class="advice-card ji-card">
        <h5>✗ 今日忌做</h5>
        <ol>
          ${jiAdvice.map(a => `<li>${a}</li>`).join('')}
        </ol>
      </div>
    </div>
    ${personalSection}
    <div class="advice-actions">
      <button class="advice-btn" onclick="copyAdvice()">📋 复制建议</button>
    </div>
  `;
  
  document.getElementById('dailyAdvice').innerHTML = html;
}

// ===== 复制建议 =====
function copyAdvice() {
  const dateStr = document.getElementById('almanacDate').value;
  const date = new Date(dateStr);
  const ymd = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  
  const text = `【黄历三视角】${ymd}\\n\\n【宜】\\n修身养性，静心读书\\n祭祀先祖，祈福纳祥\\n会友论道，交流学问\\n\\n【忌】\\n避免争执，和气生财\\n不宜远行，居家为安\\n慎防破财，量入为出\\n\\n——易道智鉴`;
  
  navigator.clipboard.writeText(text).then(() => {
    showToast('已复制到剪贴板！');
  }).catch(() => {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('已复制到剪贴板！');
  });
}'''

new_code = '''function updateDailyAdvice(almanac) {
  const dateStr=document.getElementById('almanacDate').value;
  const now=new Date(dateStr);
  const Y=now.getFullYear(),M=now.getMonth()+1,D=now.getDate();

  // ── 计算当日干支 ──
  const GAN_INDEX=(Y-4)%10,ZHI_INDEX=(Y-4)%12;
  const monthGzIdx=((Y-1900)*12+M+13)%60;
  const dayGzIdx=Math.floor((new Date(Y,M,D)-new Date(1900,0,31))/86400000)%60;
  const dayStem=STEMS[dayGzIdx%10],dayBranch=BRANCHES[dayGzIdx%12];
  const stemWx=ELE[dayStem]||'土';
  const branchWx={子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'}[dayBranch]||'土';

  // ── 节气检测 ──
  const JIEQI_LIST=[
    {name:'小寒',m:1,d:6},{name:'大寒',m:1,d:20},{name:'立春',m:2,d:4},{name:'雨水',m:2,d:19},
    {name:'惊蛰',m:3,d:6},{name:'春分',m:3,d:21},{name:'清明',m:4,d:5},{name:'谷雨',m:4,d:20},
    {name:'立夏',m:5,d:6},{name:'小满',m:5,d:21},{name:'芒种',m:6,d:6},{name:'夏至',m:6,d:21},
    {name:'小暑',m:7,d:7},{name:'大暑',m:7,d:23},{name:'立秋',m:8,d:8},{name:'处暑',m:8,d:23},
    {name:'白露',m:9,d:8},{name:'秋分',m:9,d:23},{name:'寒露',m:10,d:8},{name:'霜降',m:10,d:24},
    {name:'立冬',m:11,d:8},{name:'小雪',m:11,d:22},{name:'大雪',m:12,d:7},{name:'冬至',m:12,d:22}
  ];
  let jieqi=null,jieqiWx=null;
  for(var j=0;j<JIEQI_LIST.length;j++){if(M===JIEQI_LIST[j].m&&Math.abs(D-JIEQI_LIST[j].d)<=1){jieqi=JIEQI_LIST[j].name;break;}}
  if(jieqi){jieqiWx={立春:'木',雨水:'木',惊蛰:'木',春分:'木',清明:'木',谷雨:'土',立夏:'火',小满:'火',芒种:'火',夏至:'火',小暑:'土',大暑:'土',立秋:'金',处暑:'金',白露:'金',秋分:'金',寒露:'水',霜降:'土',立冬:'水',小雪:'水',大雪:'水',冬至:'水',小寒:'土',大寒:'土'}[jieqi];}

  // ── 建除十二神 ──
  const JIANCHU=['建','除','满','平','定','执','破','危','成','收','开','闭'];
  const jianchuIdx=(monthGzIdx%12-dayGzIdx%12+12)%12;
  const jianchu=JIANCHU[jianchuIdx];

  // ── 动态生成宜建议(基于真实宜忌+干支+节气) ──
  var yiList=almanac.yi||[];
  var jiList=almanac.ji||[];
  var yiAdvice=[];
  var jiAdvice=[];

  // 宜：基于黄历宜项扩展为具体行动建议
  var yiMap={
    '祭祀':['虔诚祭祀祖先神明，焚香祈福，心存敬意'],
    '祈福:['至寺庙或家中佛堂诚心祈愿，供灯供水'],
    '出行':['宜往东方或吉方出行，避开冲煞方位'],
    '纳财':['适宜收账、理财、签约，利财运亨通'],
    '开市':['开业大吉，宜挂红绸、放鞭炮、迎宾'],
    '嫁娶':['婚嫁良辰，宜行三拜九叩之礼，择吉时'],
    '安床':['安置床铺宜朝吉方，避开横梁压顶'],
    '动土':['动土修造需选吉时，祭拜土地公后开工'],
    '沐浴':['今日沐浴可洗去晦气，加艾叶/藏红花更佳'],
    '立券':['签订契约文书，宜在上午吉时，双方签字'],
    '斋醮':['持斋一日，清心寡欲，诵经忏悔'],
    '修造':['房屋修缮宜请风水师择方位，避太岁方'],
    '安门':['安装门窗宜选午时前，贴对联辟邪'],
    '纳采':['提亲下聘，备六礼，择双数吉日'],
    '理发':['修剪头发宜在上午，寓意从头开始'],
    '会友':['与志同道合者相聚，论道品茶'],
    '读书':['静心研读经典，晨读效果最佳']
  };
  for(var i=0;i<yiList.length&&yiAdvice.length<3;i++){
    var y=yiList[i],found=false;
    for(var k in yiMap){if(y.indexOf(k)>=0){yiAdvice.push(yiMap[k]);found=true;break;}}
    if(!found) yiAdvice.push('宜'+y+'，顺应天时行事');
  }
  // 补充干支五行建议
  var wxYi={木:'宜穿青绿色衣物，食绿叶蔬菜养肝',火:'宜穿红色衣物，午间小憩养心',土:'宜穿黄色衣物，食山药小米养脾胃',金:'宜穿白色衣物，深呼吸润肺',水:'宜穿黑蓝色衣物，早睡养肾'};
  if(wxYi[stemWx]) yiAdvice.push(wxYi[stemWx]);
  // 补充节气建议
  if(jieqi){
    var jqYi={立春:'立春节气，宜制定年度计划，踏青迎春',雨水:'雨水节气，宜健脾祛湿，食薏米红豆',惊蛰:'惊蛰时节，宜早起活动，敲胆经排毒',春分:'春分昼夜平，宜调和阴阳，放风筝',清明:'清明时节，宜祭祖扫墓，食青团',谷雨:'谷雨湿重，宜清淡饮食，避免久居潮湿',立夏:'立夏心火旺，宜养心安神，食苦味清心',小满:'小满湿热，宜清淡饮食，勤运动出汗',芒种:'芒种忙种，宜劳逸结合，饮酸梅汤',夏至:'夏至阳极，宜晚睡早起，艾灸关元',小暑:'小暑入伏，宜防暑降温，食绿豆汤',大暑:'大暑最热，宜静心避暑，午休必不可少',立秋:'立秋宜贴秋膘，补肺润燥食百合银耳',处暑:'处暑暑止，宜调整作息秋冻锻炼',白露:'白露秋意浓，宜润肺防燥食梨蜜藕',秋分:'秋分昼夜平，宜阴阳调和登高望远',寒露:'寒露凉起，宜添衣保暖泡脚驱寒',霜降:'霜降秋末，宜温补脾胃食柿子板栗',立冬:'立冬宜冬补，补肾藏精食黑色食物',小雪:'小雪寒冷，宜温阳御寒羊肉汤进补',大雪:'大雪隆冬，宜极致收藏室内艾灸',冬至:'冬至一阳生，宜吃饺子汤圆艾灸神阙',小寒:'小寒最冷，宜极温补当归生姜羊肉汤',大寒:'大寒岁末，宜辞旧迎新总结一年'};
    if(jqYi[jieqi]) yiAdvice.push(jqYi[jieqi]);
  }
  // 补充建除建议
  var jcYi={建:'建日主吉，宜开创事业新局',除:'除日宜清理旧物去故迎新',满:'满日主圆满，宜祈福求财',平:'平日主平和，宜处理日常事务',定:'定日主安定，宜签约定事',执:'执日主执着，宜坚持推进计划',危:'危日宜谨慎行事，不宜冒险',成:'成日主成就，宜婚嫁开张签约',收:'收日主收成，宜收获成果纳财',开:'开日主开通，宜开业出行新开始',闭:'闭日主收敛，宜整理反思总结'};
  if(jcYi[jianchu]) yiAdvice.push(jcYi[jianchu]);

  // 忌：基于黄历忌项扩展
  var jiMap={
    '嫁娶':['忌婚嫁之事，恐有不谐',],
    '安葬':['忌安葬迁坟，不利亡灵安宁'],
    '动土':['忌动土修造，恐犯土煞'],
    '破土':['忌破土动工，易招口舌是非'],
    '开仓':['忌开仓出货，恐有损耗'],
    '伐木:['忌砍伐树木，伤及生机'],
    '出行':['忌远行往冲煞方向，易遇波折'],
    '安门':['忌安装门户，不利家宅气场']
  };
  for(var i2=0;i2<jiList.length&&jiAdvice.length<3;i2++){
    var jj=jiList[i2],jf=false;
    for(var k2 in jiMap){if(jj.indexOf(k2)>=0){jiAdvice.push(jiMap[k2]);jf=true;break;}}
    if(!jf) jiAdvice.push('忌'+jj+'，避凶趋吉');
  }
  // 补充通用忌
  jiAdvice.push('忌与人争执冲动，和气生财');
  if(almanac.chong) jiAdvice.push('忌朝'+almanac.chong.split('(')[0]+'方向行事');

  // ── 个人八字关系 ──
  var userData=getUserBazi();
  var personalSection='';
  if(userData){
    var dayEle=userData.dayEle,dayStemName=userData.dayStem;
    var todayGanZhi=getGanZhi(now);
    var tGan=todayGanZhi.split(' ')[0];
    var tEle=ELE[tGan]||'未知';
    var rels={'木':{'木':'比助','火':'泄','土':'耗','金':'克','水':'生'},'火':{'火':'比','土':'泄','金':'耗','水':'克','木':'生'},'土':{'土':'比','金':'泄','水':'耗','木':'克','火':'生'},'金':{'金':'比','水':'泄','木':'耗','火':'克','土':'生'},'水':{'水':'比','木':'泄','火':'耗','土':'克','金':'生'}};
    var rel=rels[dayEle]?.[tEle]||'未知';
    personalSection='<div class="advice-card personal-card"><h5>⭕ 本日与您八字的关系（'+dayStemName+'日主）</h5><p>今日天干：'+tGan+'（'+tEle+'）</p><p>对您的影响：<strong>'+rel+'</strong></p><p>'+getPersonalAdvice(dayEle,tEle)+'</p></div>';
  }

  // ── 构建输出 ──
  var html='<h3>每日建议</h3>';
  html+='<div class="advice-grid">';
  html+='<div class="advice-card yi-card"><h5>✓ 今日宜做</h5><ol>'+yiAdvice.slice(0,5).map(function(a){return '<li>'+a+'</li>';}).join('')+'</ol></div>';
  html+='<div class="advice-card ji-card"><h5>✗ 今日忌做</h5><ol>'+jiAdvice.slice(0,5).map(function(a){return '<li>'+a+'</li>';}).join('')+'</ol></div>';
  html+='</div>';
  // 干支信息卡
  html+='<div class="advice-card" style="margin-top:12px;background:linear-gradient(135deg,rgba(201,168,76,.06),rgba(155,89,182,.04));border:1px solid rgba(201,168,76,.15);border-radius:10px;padding:14px">';
  html+='<div style="font-size:12px;color:var(--gold);margin-bottom:8px">☯️ 今日干支 · '+dayStem+dayBranch+' · '+stemWx+'日 · '+jianchu+'日'+(jieqi?' · '+jieqi+'':'')+(almanac.jishen?' · 值'+almanac.jishen.join('/'):'')+'</div>';
  html+='<div style="font-size:12px;color:#aaa;line-height:1.8">';
  if(almanac.chong) html+='<span style="color:#e74c3c">'+almanac.chong+'</span> · ';
  if(almanac.sha) html+='<span style="color:#e74c3c">'+almanac.sha+'</span> · ';
  if(almanac.xiongsha&&almanac.xiongsha.length) html+='<span style="color:#e67e22">凶煞:'+almanac.xiongsha.join('/')+'</span>';
  html+='</div></div>';
  html+=personalSection;
  html+='<div class="advice-actions"><button class="advice-btn" onclick="copyAdvice()">📋 复制建议</button></div>';

  document.getElementById('dailyAdvice').innerHTML=html;

  // 存储动态内容供复制使用
  window._currentDynamicAdvice={yi:yiAdvice,ji:jiAdvice,date:Y+'年'+M+'月'+D+'日',ganzhi:dayStem+dayBranch,jianchu:jianchu,jieqi:jieqi||'',chong:almanac.chong||''};
}

// ===== 复制建议（动态版） =====
function copyAdvice() {
  var d=window._currentDynamicAdvice;
  if(!d){showToast('暂无数据');return;}
  var text='【易道智鉴·每日建议】'+d.date+'\\n';
  text+='\\n📅 干支：'+d.ganzhi+' · '+d.jianchu+'日'+(d.jieqi?' · '+d.jieqi:'')+'\\n';
  text+='\\n✅ 宜：\\n'+d.yi.map(function(a,i){return (i+1)+'. '+a;}).join('\\n')+'\\n';
  text+='\\n❌ 忌：\\n'+d.ji.map(function(a,i){return (i+1)+'. '+a;}).join('\\n')+'\\n';
  if(d.chong) text+='\\n⚠️ '+d.chong+'\\n';
  text+='\\n—— 易道智鉴';

  navigator.clipboard.writeText(text).then(function(){showToast('已复制到剪贴板！');}).catch(function(){
    var ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);showToast('已复制到剪贴板！');
  });
}'''

if old not in content:
    print("ERROR: old code not found!")
    exit(1)

content = content.replace(old, new_code)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("OK: updateDailyAdvice replaced with dynamic 7-dimension version")
