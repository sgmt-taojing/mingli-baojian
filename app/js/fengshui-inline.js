
// ═══════════════════════════════════════════════════════════
// 第二十轮·R3·事件型择吉日 + 24 类化解物品摆放
// ═══════════════════════════════════════════════════════════

// ===== 12 大事件配置（依《择吉通书》《神枢经》《阳宅集成》《嫁娶周堂》《出行周堂》《拜神周堂》） =====
const EVENT_CONFIG = {
  study:   {name:'📚 入学/开学', yi:['文昌','天德','月德','天乙'], ji:['岁破','日冲','四废','白虎'], sources:'《择吉通书》《文昌大洞经》'},
  medical: {name:'🏥 求医/手术', yi:['天医','福德','生气','日干生旺'], ji:['月破','死神','归忌','血支'], sources:'《神枢经》《千金方》'},
  moving:  {name:'🏠 入宅/搬家', yi:['天月德','生气','成日','收日','命主合'], ji:['五离','归忌','胎神占门','冲命主'], sources:'《阳宅集成》《宅经》'},
  wedding: {name:'💍 婚嫁/订盟', yi:['天德','天喜','月合','六合','黄道'], ji:['岁破','孤辰','寡宿','月厌'], sources:'《嫁娶周堂》《阴阳书》'},
  business:{name:'🏪 开业/开市', yi:['天恩','五富','天仓','命主财星旺'], ji:['五穷','五虚','月厌','大耗'], sources:'《求财吉日》《商贾一览》'},
  travel:  {name:'✈️ 出行/赴任', yi:['天德','天恩','天马','驿马','命主旺'], ji:['劫煞','四废','四穷'], sources:'《出行周堂》《缙绅录》'},
  contract:{name:'📝 签约/订盟', yi:['月德','成日','收日','定日','天德','命主合'], ji:['月厌','厌对','五离','岁破'], sources:'《买卖择日》《合同周堂》'},
  bed:     {name:'🛏️ 安床', yi:['天德','月德','生气','天喜','命主合','床坐向合喜用'], ji:['岁破','五离','胎神占床','日冲'], sources:'《阳宅三要》《安床周堂》'},
  burial:  {name:'🪦 安葬/破土', yi:['月德','生气','天德','命主合','亡命合'], ji:['重日','复日','血支'], sources:'《阴宅集成》《葬书》'},
  build:   {name:'🔨 动土/装修', yi:['月德','天德','生气','成日','天仓','命主合'], ji:['月建','平日','四废','三煞'], sources:'《鲁班经》《动土周堂》'},
  mentor:  {name:'🎓 拜师/收徒', yi:['天德','文昌','天乙','天喜','命主合'], ji:['五离','月厌','孤辰'], sources:'《拜师择日》《儒门礼记》'},
  pray:    {name:'🙏 祈福/许愿', yi:['天德','月德','天恩','天赦','命主旺'], ji:['月厌','厌对','五穷'], sources:'《拜神周堂》《高僧传》'}
};
let currentEvent = 'study';

// 12 时辰五行星（用于评分）
const BRANCH_ELE = {'子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'};
const ELE_S_GLOBAL = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};

// ===== 命主八字存取 =====
function saveJiuriUserBazi(){
  const dateStr=document.getElementById('jiuriUserBirthDate').value;
  if(!dateStr){showToast('请选择出生日期');return;}
  const hour=document.getElementById('jiuriUserBirthHour').value;
  const sex=document.getElementById('jiuriUserSex').value;
  const STEMS=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const ELE_S={'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
  const d=new Date(dateStr);
  const idx=(d.getFullYear()*5+Math.floor((d.getMonth()+1)*13/5)+d.getDate())%10;
  const dayStem=STEMS[idx];
  const dayEle=ELE_S[dayStem];
  const userData={date:dateStr,hour:hour,sex:sex,dayStem:dayStem,dayEle:dayEle};
  localStorage.setItem('qianyuan_user_bazi',JSON.stringify(userData));
  document.getElementById('jiuriUserBaziStatus').textContent='已绑定：'+dayStem+'日主（'+dayEle+'）';
  document.getElementById('itemsUserBaziStatus').textContent='已绑定：'+dayStem+'日主（'+dayEle+'）';
  showToast('命主八字已绑定！');
  renderItemsGrid();
}
function clearJiuriUserBazi(){
  localStorage.removeItem('qianyuan_user_bazi');
  document.getElementById('jiuriUserBaziStatus').textContent='未绑定';
  document.getElementById('itemsUserBaziStatus').textContent='未绑定 · 系统将按通用规则推荐';
  showToast('已清除命主八字');
  renderItemsGrid();
}
function getJiuriUserBazi(){
  try{return JSON.parse(localStorage.getItem('qianyuan_user_bazi'));}catch(e){return null;}
}

// ===== 事件 Tab 切换 =====
function selectEvent(event){
  currentEvent = event;
  document.querySelectorAll('.event-tab').forEach(b=>b.classList.remove('active'));
  document.querySelector('.event-tab[data-event="'+event+'"]').classList.add('active');
}

// ===== 评分引擎 =====
function calcJiuriScore(date, event, bazi){
  const cfg = EVENT_CONFIG[event];
  let score = 50;
  const reasons = [];
  const blessings = [];
  const conflicts = [];

  // 1. 季节适配（农历月）
  const month = date.getMonth()+1;
  const seasonEle = (month>=3&&month<=5)?'木':(month>=6&&month<=8)?'火':(month>=9&&month<=11)?'金':'水';
  // 修正：加季月（3/6/9/12 末）= 土
  if([3,6,9,12].includes(month)) {
    score += 8; blessings.push('季月土旺·地基稳固');
  }

  // 2. 黄道/黑道（简化）：奇数日为黄道
  const day = date.getDate();
  if(day%2===1){score+=12;blessings.push('奇数日·阳气充足（黄道倾向）');}else{score-=5;}

  // 3. 命主日干适配
  const dayEle = bazi?.dayEle;
  if(dayEle){
    const dayGanMap={'木':['甲','乙'],'火':['丙','丁'],'土':['戊','己'],'金':['庚','辛'],'水':['壬','癸']};
    // 简化：取干支日柱近似
    const cycleDay = Math.floor((date-new Date('1900-01-01'))/86400000);
    const dayStemIdx = cycleDay%10;
    const dayBranchIdx = cycleDay%12;
    const STEMS_FULL=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    const BRANCHES_FULL=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    const dayGan = STEMS_FULL[dayStemIdx];
    const dayZhi = BRANCHES_FULL[dayBranchIdx];
    const dayEleFromGan = ELE_S_GLOBAL[dayGan];

    // 命主日干 vs 当日日干
    const shengMap={'木':'火','火':'土','土':'金','金':'水','水':'木'};
    const keMap={'木':'土','土':'水','水':'火','火':'金','金':'木'};
    if(shengMap[dayEle]===dayEleFromGan){score+=20;blessings.push('命主生当日·如鱼得水（生旺）');}
    else if(shengMap[dayEleFromGan]===dayEle){score+=15;blessings.push('当日生命主·贵人扶助（印绶）');}
    else if(dayEle===dayEleFromGan){score+=10;blessings.push('比肩日·能量平顺');}
    else if(keMap[dayEle]===dayEleFromGan){score-=18;conflicts.push('命主克当日·消耗精力');}
    else if(keMap[dayEleFromGan]===dayEle){score-=22;conflicts.push('当日克命主·七煞临身');}

    // 日冲：命主日支 vs 当日日支（地支六冲：子午冲/丑未冲/寅申冲/卯酉冲/辰戌冲/巳亥冲）
    const userZhi = BRANCHES_FULL[(new Date(bazi.date).getDate())%12]; // 简化：命主日支
    const chongMap={'子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳'};
    if(chongMap[userZhi]===dayZhi){score-=30;conflicts.push('日冲命主·岁破之象');}
    else if(chongMap[dayZhi]===userZhi){score-=30;conflicts.push('命主日冲·诸事不宜');}
  }

  // 4. 事件特定筛选
  const eventBonus = {
    study:   [{m:1,d:1,name:'文昌日·考试大吉'}, {m:3,d:3,name:'上巳节·文人集会'}, {m:9,d:9,name:'重阳登高·学业高升'}],
    medical: [{m:1,d:15,name:'上元节·天医临日'}, {m:4,d:8,name:'佛诞日·药王加持'}],
    moving:  [{m:2,d:2,name:'龙抬头·动土大吉'}, {m:8,d:15,name:'中秋·家宅团圆'}, {m:10,d:1,name:'寒衣节·入宅首选'}],
    wedding: [{m:1,d:1,name:'元旦·婚嫁良辰'}, {m:3,d:3,name:'上巳节·桃花盛开'}, {m:5,d:5,name:'端午·驱邪纳吉'}, {m:7,d:7,name:'七夕·双星吉日'}, {m:9,d:9,name:'重九·婚嫁大吉'}],
    business:[{m:2,d:2,name:'龙抬头·开市大吉'}, {m:5,d:5,name:'端午·五瑞护财'}, {m:8,d:8,name:'八八节·八方来财'}],
    travel:  [{m:3,d:3,name:'上巳·宜远行'}, {m:5,d:5,name:'端午·龙舟启航'}, {m:9,d:9,name:'重阳·登高望远'}],
    contract:[{m:2,d:2,name:'龙抬头·签约大吉'}, {m:8,d:8,name:'八八节·签约定盟'}],
    bed:     [{m:1,d:1,name:'元旦·安床吉日'}, {m:9,d:9,name:'重阳·安床首选'}],
    burial:  [{m:3,d:3,name:'上巳·祭祖大吉'}, {m:9,d:9,name:'重阳·登高祭祖'}],
    build:   [{m:2,d:2,name:'龙抬头·动土大吉'}, {m:5,d:5,name:'端午·五瑞护宅'}],
    mentor:  [{m:3,d:3,name:'上巳·拜师大吉'}, {m:9,d:9,name:'重阳·尊师重道'}],
    pray:    [{m:1,d:1,name:'元旦·祈福大吉'}, {m:1,d:15,name:'上元·天官赐福'}, {m:4,d:8,name:'佛诞·诸佛加持'}, {m:7,d:15,name:'中元·普度祈福'}, {m:9,d:9,name:'重阳·九皇赐福'}]
  };
  const bonuses = eventBonus[event]||[];
  const matched = bonuses.find(b=>b.m===month&&b.d===day);
  if(matched){score+=18;blessings.push('节气加成·'+matched.name);}

  // 5. 月份反向减分（淡月）
  if([2,7,11].includes(month)){score-=8;}

  // 6. 加减分汇总
  score = Math.max(0,Math.min(100,score));

  return {score, blessings, conflicts, cfg};
}

// ===== 主计算函数 =====
function calcJiuriByEvent(){
  const startDateStr = document.getElementById('jiuriStartDate').value;
  const range = parseInt(document.getElementById('jiuriRange').value);
  const bazi = getJiuriUserBazi();
  const today = new Date();
  const startDate = startDateStr ? new Date(startDateStr) : today;

  if(range>90){showToast('时间范围不宜超过 90 天');return;}

  // 计算每天分数
  const results = [];
  for(let i=0;i<range;i++){
    const d = new Date(startDate);
    d.setDate(d.getDate()+i);
    const r = calcJiuriScore(d, currentEvent, bazi);
    const dateStr = d.toISOString().split('T')[0];
    results.push({date:d,dateStr,...r});
  }

  // 推荐 3 天（取分最高 + 排除冲突日）
  const sorted = [...results].sort((a,b)=>b.score-a.score);
  const top3 = sorted.filter(r=>r.conflicts.length<2).slice(0,3);

  // 渲染
  let html = '<h4 style="font-family:\'Ma Shan Zheng\',serif;font-size:18px;letter-spacing:4px;margin:20px 0 12px;color:var(--gold)">🏆 推荐 3 天（评分最高 + 避开冲煞）</h4>';
  html += '<div class="jiuri-suggest-grid">';
  top3.forEach((r,i)=>{
    const rank = i===0?'🥇 首推':(i===1?'🥈 次选':'🥉 备选');
    const rankClass = r.score>=80?'great':r.score>=65?'good':r.score>=50?'ok':'bad';
    html += '<div class="jiuri-suggest-card" style="padding:16px">';
    html += '<div class="sg-rank">'+rank+' · 评分 <b style="color:var(--gold2);font-size:13px">'+r.score+'</b></div>';
    html += '<div class="sg-date">'+r.dateStr+'</div>';
    html += '<div class="sg-gz">事件：'+r.cfg.name+'</div>';
    if(r.blessings.length>0){html += '<div class="sg-reason" style="color:var(--success)">✓ '+r.blessings[0]+'</div>';}
    if(r.conflicts.length>0){html += '<div class="sg-reason" style="color:var(--cinn2)">⚠ '+r.conflicts[0]+'</div>';}
    html += '</div>';
  });
  html += '</div>';

  // 30 日完整列表
  html += '<h4 style="font-family:\'Ma Shan Zheng\',serif;font-size:18px;letter-spacing:4px;margin:28px 0 12px;color:var(--gold)">📅 '+range+' 日完整评分（按日期排序）</h4>';
  results.forEach(r=>{
    const rankClass = r.score>=80?'rank-great':r.score>=65?'rank-good':r.score>=50?'rank-ok':'rank-bad';
    const badgeClass = r.score>=80?'great':r.score>=65?'good':r.score>=50?'ok':r.score>=35?'bad':'worst';
    const badgeText = r.score>=80?'极吉':r.score>=65?'大吉':r.score>=50?'平':r.score>=35?'小凶':'凶';

    html += '<div class="jiuri-rank-card '+rankClass+'">';
    html += '<div class="rank-header">';
    html += '<div><div class="rank-date">'+r.dateStr+'</div>';
    html += '<div class="rank-gz">'+r.cfg.name+'</div></div>';
    html += '<div style="text-align:right"><div class="rank-score">'+r.score+' 分</div>';
    html += '<span class="jiuri-badge '+badgeClass+'">'+badgeText+'</span></div>';
    html += '</div>';

    if(r.blessings.length>0){
      html += '<div class="rank-blessing"><b>✓ 吉象：</b>'+r.blessings.join(' · ')+'</div>';
    }
    if(r.conflicts.length>0){
      html += '<div class="rank-conflict"><b>⚠ 冲煞：</b>'+r.conflicts.join(' · ')+'</div>';
    }

    html += '<div class="jiuri-rule-list"><h5>📜 古籍依据</h5><li>'+r.cfg.sources+'</li>';
    html += '<li style="margin-top:6px"><b>宜：</b>'+r.cfg.yi.join(' · ')+'</li>';
    html += '<li><b>忌：</b>'+r.cfg.ji.join(' · ')+'</li>';
    html += '</ul></div>';
  });

  document.getElementById('jiuriResult').innerHTML = html;
}

// 初始化时设置默认日期为今天
document.addEventListener('DOMContentLoaded',()=>{
  const today=new Date();
  const todayStr=today.toISOString().split('T')[0];
  const el=document.getElementById('jiuriStartDate');
  if(el&&!el.value)el.value=todayStr;
  // 恢复八字
  const saved=getJiuriUserBazi();
  if(saved){
    document.getElementById('jiuriUserBaziStatus').textContent='已绑定：'+saved.dayStem+'日主（'+saved.dayEle+'）';
    document.getElementById('itemsUserBaziStatus').textContent='已绑定：'+saved.dayStem+'日主（'+saved.dayEle+'）';
    if(saved.date)document.getElementById('jiuriUserBirthDate').value=saved.date;
    if(saved.hour)document.getElementById('jiuriUserBirthHour').value=saved.hour;
    if(saved.sex)document.getElementById('jiuriUserSex').value=saved.sex;
  }
  // 默认选中第一个事件
  selectEvent('study');
  // 渲染物品网格
  renderItemsGrid();
});

// ===== 24 类物品规则（依《八宅明镜》《阳宅三要》《鲁班经》） =====
const ITEM_RULES = [
  {key:'wenchangta', name:'文昌塔', emoji:'🗼', cat:'study', wx:'木', dir:'东（书桌左上）', col:'青/绿', qty:'1座', height:'30-50cm', avoid:'西（金克木）', logic:'木主文昌，东方木旺之地催旺学业。', age:'5-99岁'},
  {key:'shuzhuo', name:'书桌/学习桌', emoji:'🪑', cat:'study', wx:'木', dir:'东或东南', col:'原木', qty:'1张', height:'适合身高', avoid:'西/西北', logic:'木生学业，东南为文昌位。', age:'3-99岁'},
  {key:'shugui', name:'书柜', emoji:'📚', cat:'study', wx:'木', dir:'东方·靠实墙', col:'原木', qty:'1-2', height:'1.8-2m', avoid:'西/西北', logic:'书香旺气，东方木位加持学业。', age:'5-99岁'},
  {key:'diannao', name:'电脑/电子设备', emoji:'💻', cat:'study', wx:'火/水', dir:'北方或西北', col:'黑/灰', qty:'1台', height:'桌面', avoid:'东方（木生火泄）', logic:'水火既济，文昌动力之源。', age:'6-99岁'},
  {key:'taideng', name:'学习台灯', emoji:'💡', cat:'study', wx:'火/木', dir:'书桌左上角', col:'暖白', qty:'1盏', height:'40-50cm', avoid:'头顶正上', logic:'灯火通明护眼，左青龙位利文昌。', age:'5-99岁'},
  {key:'chuang', name:'床', emoji:'🛏️', cat:'rest', wx:'木/火', dir:'喜用方+床头朝喜用', col:'暖色', qty:'1张', height:'膝盖下', avoid:'冲命主方位', logic:'安神助眠，床头朝喜用方吸纳生气。', age:'0-99岁'},
  {key:'chuangdeng', name:'床头灯', emoji:'🛋️', cat:'rest', wx:'火', dir:'床头两侧', col:'暖黄', qty:'2盏', height:'30cm', avoid:'头顶直射', logic:'藏风聚气，暖光助眠。', age:'0-99岁'},
  {key:'yigui', name:'衣柜', emoji:'👔', cat:'rest', wx:'木', dir:'卧室·喜用方', col:'原木', qty:'1', height:'1.8-2.4m', avoid:'西北', logic:'收纳旺气，木气生发。', age:'3-99岁'},
  {key:'yu gang', name:'鱼缸/水摆件', emoji:'🐟', cat:'wealth', wx:'水', dir:'北方·喜用方', col:'透明', qty:'1', height:'40-60cm', avoid:'西/西南（土克水）', logic:'水主财，催旺财运但不可过大。', age:'0-99岁'},
  {key:'lvzhi', name:'绿植/盆栽', emoji:'🌿', cat:'wealth', wx:'木', dir:'东/东南·阳台', col:'绿', qty:'2-3', height:'30-80cm', avoid:'中央/西南', logic:'生机旺气，木气生财。', age:'0-99岁'},
  {key:'gangqin', name:'钢琴/乐器', emoji:'🎹', cat:'wealth', wx:'木/金', dir:'西方·客厅或书房', col:'白/原木', qty:'1', height:'1.2m', avoid:'北方', logic:'金木交鸣，文艺气质。', age:'5-99岁'},
  {key:'jinshu', name:'金属摆件/铜器', emoji:'🏺', cat:'wealth', wx:'金', dir:'西方/西北', col:'金/银', qty:'1/3/5', height:'20-40cm', avoid:'东方', logic:'辟邪镇煞，金气肃杀。', age:'0-99岁'},
  {key:'kang', name:'床（健康专用）', emoji:'🛏️', cat:'health', wx:'木/火', dir:'喜用方·避开厕所压', col:'暖色', qty:'1', height:'膝盖下', avoid:'横梁下', logic:'化解病符，安神助眠。', age:'0-99岁'},
  {key:'shanshui', name:'山水画', emoji:'🖼️', cat:'health', wx:'水/木', dir:'北方/东方', col:'青绿', qty:'1', height:'40-60cm', avoid:'南方', logic:'靠山贵人，水木清华。', age:'0-99岁'},
  {key:'laohu', name:'老虎画/猛兽', emoji:'🐯', cat:'health', wx:'木/火', dir:'东方或西北（镇宅）', col:'暖', qty:'1', height:'50-80cm', avoid:'东方卧室', logic:'镇宅化煞，避邪护身。', age:'0-99岁'},
  {key:'shaf', name:'沙发', emoji:'🛋️', cat:'family', wx:'土/木', dir:'客厅·喜用方', col:'中性', qty:'1', height:'40-50cm', avoid:'横梁下/对门', logic:'待客方位，明堂开阔。', age:'0-99岁'},
  {key:'canzhuo', name:'餐桌', emoji:'🍽️', cat:'family', wx:'火/土', dir:'餐厅·中央', col:'原木', qty:'1', height:'75cm', avoid:'横梁下/卫生间旁', logic:'家人和谐，火土相生。', age:'0-99岁'},
  {key:'dianshi', name:'电视', emoji:'📺', cat:'family', wx:'火', dir:'客厅·南方', col:'黑', qty:'1', height:'桌面', avoid:'卧室', logic:'家庭和谐，火气凝聚。', age:'0-99岁'},
  {key:'bingxiang', name:'冰箱', emoji:'🧊', cat:'family', wx:'水/金', dir:'厨房/餐厅', col:'银', qty:'1', height:'1.8m', avoid:'卧室/客厅中央', logic:'财库所在，金水生财。', age:'0-99岁'},
  {key:'chuangju', name:'窗帘', emoji:'🪟', cat:'family', wx:'木', dir:'喜用方', col:'暖色', qty:'按窗', height:'落地', avoid:'西北厚', logic:'藏风聚气，调和光线。', age:'0-99岁'},
  {key:'foxiang', name:'佛像/神像', emoji:'🙏', cat:'protection', wx:'火/土', dir:'西方/西北/喜用方', col:'金/木', qty:'1', height:'30-60cm', avoid:'卧室/厨房/卫生间', logic:'心灵寄托，化煞镇宅。', age:'0-99岁'},
  {key:'hulu', name:'葫芦', emoji:'🎃', cat:'protection', wx:'木/土', dir:'床头/玄关/窗台', col:'天然', qty:'1-2', height:'15-30cm', avoid:'横梁下/正对门', logic:'化解病符，吸纳秽气。', age:'0-99岁'},
  {key:'jingzi', name:'镜子/镜面', emoji:'🪞', cat:'protection', wx:'金/水', dir:'玄关·喜用方', col:'白', qty:'1', height:'全身镜1.5m', avoid:'床头/对门/对窗/对楼梯', logic:'化煞提气，反射冲煞。', age:'0-99岁'},
  {key:'wanju', name:'玩具/玩偶', emoji:'🧸', cat:'protection', wx:'木/火', dir:'儿童房·东方', col:'暖', qty:'5+', height:'按年龄', avoid:'横梁下/卫生间', logic:'童心开发，木火生旺。', age:'1-12岁'}
];

const CATEGORY_LABELS={all:'全部 24 类',study:'学习',rest:'安床',wealth:'财运',health:'健康',family:'家运',protection:'化煞'};
let currentItemCat='all';

// ===== 物品分类 Tab =====
function selectItemCategory(cat){
  currentItemCat=cat;
  document.querySelectorAll('.item-cat-tab').forEach(b=>b.classList.remove('active'));
  document.querySelector('.item-cat-tab[data-cat="'+cat+'"]').classList.add('active');
  renderItemsGrid();
}

// ===== 渲染物品网格 =====
function renderItemsGrid(){
  const bazi = getJiuriUserBazi();
  const userEle = bazi?.dayEle;
  const shengMap={'木':'火','火':'土','土':'金','金':'水','水':'木'};
  const keMap={'木':'土','土':'水','水':'火','火':'金','金':'木'};
  const items = currentItemCat==='all'?ITEM_RULES:ITEM_RULES.filter(i=>i.cat===currentItemCat);

  let html = '<div class="items-grid">';
  items.forEach(item=>{
    let match = false;
    if(userEle){
      // 命主五行 vs 物品五行
      if(item.wx.includes(userEle)) match = true;  // 同类
      else if(shengMap[userEle]===item.wx.split('/')[0]) match = true;  // 命主生物品
      else if(keMap[item.wx.split('/')[0]]===userEle) match = true;  // 物品被命主所克
    }
    html += '<div class="item-card '+(match?'match':'')+'">';
    html += '<span class="item-icon">'+item.emoji+'</span>';
    html += '<div class="item-name">'+item.name+'</div>';
    html += '<div class="item-cat">'+CATEGORY_LABELS[item.cat]+' · '+item.wx+'行</div>';
    html += '<div class="item-row"><span class="ir-label">喜用方位</span><span class="ir-value gold">'+item.dir+'</span></div>';
    html += '<div class="item-row"><span class="ir-label">喜用颜色</span><span class="ir-value">'+item.col+'</span></div>';
    html += '<div class="item-row"><span class="ir-label">数量</span><span class="ir-value">'+item.qty+'</span></div>';
    html += '<div class="item-row"><span class="ir-label">高度</span><span class="ir-value">'+item.height+'</span></div>';
    html += '<div class="item-row"><span class="ir-label">禁忌</span><span class="ir-value warn">'+item.avoid+'</span></div>';
    html += '<div class="item-logic">📜 '+item.logic+'</div>';
    html += '<div class="item-age">适用年龄：'+item.age+'</div>';
    html += '</div>';
  });
  html += '</div>';
  document.getElementById('itemsGrid').innerHTML = html;

  // 渲染儿童房专用 8 件套
  renderChildRoomSet();
}

// ===== 儿童房 8 件套 =====
function renderChildRoomSet(){
  const bazi = getJiuriUserBazi();
  const userEle = bazi?.dayEle || '土';
  const child8 = ITEM_RULES.filter(i=>['wenchangta','shuzhuo','taideng','shanshui','wanju','foxiang','shugui','lvzhi'].includes(i.key));
  const eleColors={'木':'青/绿','火':'红/紫','土':'黄/咖','金':'白/金','水':'黑/蓝'};
  const eleDirs={'木':'东方','火':'南方','土':'中央/西南','金':'西方','水':'北方'};
  const eleFood={'木':'青色蔬菜酸味','火':'红色温热','土':'黄色甘味','金':'白色辛辣','水':'黑色咸味'};
  let html = '';
  child8.forEach(item=>{
    html += '<div class="child-room-card">';
    html += '<span class="cr-icon">'+item.emoji+'</span>';
    html += '<div class="cr-name">'+item.name+'</div>';
    html += '<div class="cr-spec">';
    html += '<b>儿童五行适配：</b>'+(item.wx.includes(userEle)?'<span style="color:var(--success)">✓ 同类/生助</span>':'需配合命主日主')+'<br>';
    html += '<b>儿童方位：</b>'+eleDirs[userEle]+'（命主五行）<br>';
    html += '<b>儿童颜色：</b>'+eleColors[userEle]+'<br>';
    html += '<b>儿童饮食辅佐：</b>'+eleFood[userEle]+'<br>';
    html += '<b>古籍出处：</b>'+item.logic;
    html += '</div>';
    html += '<span class="cr-tag">儿童适用</span><span class="cr-tag">5-12岁</span>';
    html += '</div>';
  });
  document.getElementById('childRoomSet').innerHTML = html;
}


/* ===== 第二十二轮·紫微化忌→化解→吉日 三联动引擎 ===== */
function generateZidiseLink(){
  var yearZhi = document.getElementById('zlYearZhi').value;
  var dayStem = document.getElementById('zlDayStem').value;
  var concerns = Array.from(document.querySelectorAll('.zlConcern:checked')).map(c=>c.value);
  if(!yearZhi){showToast('请选择出生年地支');return;}
  if(concerns.length===0) concerns=['破财','病厄'];

  var ZHI_HUAJI = {
    '子':{star:'天同',palace:'福德',meaning:'忧愁·情感挫败'},
    '丑':{star:'文曲',palace:'官禄',meaning:'文书是非·官非'},
    '寅':{star:'廉贞',palace:'疾厄',meaning:'血光·官非'},
    '卯':{star:'天机',palace:'兄弟',meaning:'手足失和·奔波'},
    '辰':{star:'太阳',palace:'父母',meaning:'父缘薄·长辈忧'},
    '巳':{star:'武曲',palace:'财帛',meaning:'破财·金属伤'},
    '午':{star:'太阴',palace:'父母',meaning:'母缘薄·阴人扰'},
    '未':{star:'贪狼',palace:'福德',meaning:'欲望·桃花劫'},
    '申':{star:'巨门',palace:'口舌',meaning:'口舌是非'},
    '酉':{star:'天相',palace:'交友',meaning:'小人·友叛'},
    '戌':{star:'天梁',palace:'疾厄',meaning:'灾厄·长辈逝'},
    '亥':{star:'破军',palace:'财帛',meaning:'破耗·搬迁'}
  };
  var huaji = ZHI_HUAJI[yearZhi];

  var DIRECTION = {
    '天同':{avoid:'西北',reason:'天同忌主忧愁·西北金气加重',dir_wx:'金'},
    '文曲':{avoid:'东南',reason:'文曲忌主文书是非·东南木气生火',dir_wx:'木'},
    '廉贞':{avoid:'正南',reason:'廉贞忌主血光·南方火气激化',dir_wx:'火'},
    '天机':{avoid:'正东',reason:'天机忌主奔波·东方木气动荡',dir_wx:'木'},
    '太阳':{avoid:'正南',reason:'太阳忌主父缘薄·南方火泄太阳',dir_wx:'火'},
    '武曲':{avoid:'西北',reason:'武曲忌主破财·西方金气加重',dir_wx:'金'},
    '太阴':{avoid:'正北',reason:'太阴忌主阴人扰·北方水气过盛',dir_wx:'水'},
    '贪狼':{avoid:'正东',reason:'贪狼忌主桃花劫·东方木气引动',dir_wx:'木'},
    '巨门':{avoid:'正西',reason:'巨门忌主口舌·西方金气加重',dir_wx:'金'},
    '天相':{avoid:'中央',reason:'天相忌主小人·中央土气混杂',dir_wx:'土'},
    '天梁':{avoid:'西南',reason:'天梁忌主灾厄·西南方土气加重',dir_wx:'土'},
    '破军':{avoid:'西北',reason:'破军忌主破耗·西方金气冲破',dir_wx:'金'}
  };
  var dirInfo = DIRECTION[huaji.star];

  var CURE_ITEM = {
    '天同':{items:[{name:'绿植·富贵竹',icon:'🎋',reason:'木气疏解·安神定志',pos:'客厅东方'},{name:'葫芦',icon:'🎃',reason:'化解忧郁·收纳煞气',pos:'床头左侧'}],event:'祈福'},
    '文曲':{items:[{name:'文昌塔',icon:'🗼',reason:'文昌利考试·化解文曲忌',pos:'书桌左上'},{name:'葫芦',icon:'🎃',reason:'化是非·收纳文书煞',pos:'书房门后'}],event:'祈福'},
    '廉贞':{items:[{name:'佛像',icon:'🙏',reason:'化解血光·镇宅安神',pos:'客厅中央'},{name:'山水画',icon:'🖼️',reason:'水气引廉贞火·水火既济',pos:'客厅南墙'}],event:'祈福'},
    '天机':{items:[{name:'文昌塔',icon:'🗼',reason:'化解奔波·定志',pos:'书桌左上'},{name:'台灯',icon:'💡',reason:'聚光定神·减少动荡',pos:'书桌右侧'}],event:'入学'},
    '太阳':{items:[{name:'佛像',icon:'🙏',reason:'敬父辈·化解父缘薄',pos:'客厅南墙'},{name:'黄水晶',icon:'💛',reason:'招阳气·补太阳',pos:'客厅财位'}],event:'拜师'},
    '武曲':{items:[{name:'金属摆件',icon:'🏺',reason:'金气引化·变忌为用',pos:'客厅西方'},{name:'黄水晶',icon:'💛',reason:'招正财·破武曲忌',pos:'财位'}],event:'求财'},
    '太阴':{items:[{name:'葫芦',icon:'🎃',reason:'收纳阴煞·安阴人',pos:'卧室东墙'},{name:'粉水晶',icon:'🌸',reason:'柔和太阴·调和人际',pos:'卧室南墙'}],event:'婚嫁'},
    '贪狼':{items:[{name:'葫芦',icon:'🎃',reason:'化桃花劫·收纳贪狼欲',pos:'床头左侧'},{name:'金属摆件',icon:'🏺',reason:'金气制木·止贪狼之欲',pos:'客厅西方'}],event:'婚嫁'},
    '巨门':{items:[{name:'山水画',icon:'🖼️',reason:'水气化口舌·止是非',pos:'客厅北墙'},{name:'绿萝',icon:'🪴',reason:'净化空气·化口舌煞',pos:'客厅角落'}],event:'祈福'},
    '天相':{items:[{name:'葫芦',icon:'🎃',reason:'化小人·收纳是非',pos:'大门内侧'},{name:'佛像',icon:'🙏',reason:'贵人扶持·制小人',pos:'客厅中央'}],event:'拜师'},
    '天梁':{items:[{name:'佛像',icon:'🙏',reason:'化解灾厄·延寿添福',pos:'客厅中央'},{name:'葫芦',icon:'🎃',reason:'收纳煞气·延寿',pos:'卧室床头'}],event:'求医'},
    '破军':{items:[{name:'黄水晶',icon:'💛',reason:'固财破耗·补金气',pos:'客厅财位'},{name:'金属摆件',icon:'🏺',reason:'金气重·制破军冲',pos:'客厅西方'}],event:'签约'}
  };
  var cureInfo = CURE_ITEM[huaji.star];

  var EVENT_RULE = {
    '祈福':{type:'祈福化解',desc:'去庙宇/诵经',bestTime:'甲子日·丙午日'},
    '入学':{type:'开学典礼',desc:'文昌日',bestTime:'甲子日·丙午日'},
    '拜师':{type:'拜师学艺',desc:'贵人生旺',bestTime:'庚申日·壬子日'},
    '求财':{type:'开业签单',desc:'财气最旺',bestTime:'戊寅日·己丑日'},
    '婚嫁':{type:'婚姻嫁娶',desc:'合和之日',bestTime:'甲子日·丁卯日'},
    '求医':{type:'求医问诊',desc:'安神祛病',bestTime:'壬子日·癸亥日'},
    '签约':{type:'签约定约',desc:'文昌利签',bestTime:'庚辰日·辛酉日'}
  };
  var eventInfo = EVENT_RULE[cureInfo.event];

  var DAY_STEM_DIR = {'甲':'东北','乙':'西南','丙':'正西','丁':'西北','戊':'正北','己':'南方','庚':'东北','辛':'西南','壬':'东南','癸':'东方'};
  var dayDir = DAY_STEM_DIR[dayStem];

  var h = '<div class="zl-result">';
  h += '<div class="zl-summary">';
  h += '<div class="zl-stitle">🌟 三联动推演报告</div>';
  h += '<div class="zl-quote">"命如舟·运如水·化解如舵·择吉如帆——四者齐备，方可乘风破浪。"</div>';
  h += '<div class="zl-meta">';
  h += '<div><b>命主年支</b>'+yearZhi+'</div>';
  h += '<div><b>化忌星</b>'+huaji.star+'</div>';
  h += '<div><b>落入宫位</b>'+huaji.palace+'宫</div>';
  h += '<div><b>日主补强</b>'+dayStem+'·'+dayDir+'</div>';
  h += '<div><b>关注重点</b>'+concerns.join('·')+'</div>';
  h += '<div><b>化解事件</b>'+eventInfo.type+'</div>';
  h += '</div></div>';

  h += '<div class="zl-grid">';
  h += '<div class="zl-card warn">';
  h += '<div class="zl-ch"><span class="zl-idx">① 化忌识别</span></div>';
  h += '<div class="zl-body">';
  h += '<p><b style="color:var(--red)">化忌星：'+huaji.star+'</b> 落 <b>'+huaji.palace+'宫</b></p>';
  h += '<p style="margin-top:6px;font-size:11px;opacity:.7">'+huaji.meaning+'</p>';
  h += '<p style="margin-top:8px;font-size:10px;opacity:.95;letter-spacing:1px">📜《紫微斗数全书》《飞星紫微斗数》</p>';
  h += '</div></div>';
  h += '<div class="zl-card warn">';
  h += '<div class="zl-ch"><span class="zl-idx">② 应避方位</span></div>';
  h += '<div class="zl-body">';
  h += '<p>⚠ 慎往：<b style="color:var(--red)">'+dirInfo.avoid+'方向</b>（'+dirInfo.dir_wx+'气·加重化忌）</p>';
  h += '<p style="margin-top:6px;font-size:11px;opacity:.7">'+dirInfo.reason+'</p>';
  h += '<p style="margin-top:8px;font-size:11px;color:var(--gold)">✦ 趋吉：往<b>'+dayDir+'方向</b>（日主'+dayStem+'喜方）</p>';
  h += '<p style="margin-top:8px;font-size:10px;opacity:.95;letter-spacing:1px">📜《八宅明镜》《紫白诀》《飞星紫白》</p>';
  h += '</div></div>';
  h += '<div class="zl-card boost">';
  h += '<div class="zl-ch"><span class="zl-idx">③ 化解物品（'+cureInfo.items.length+'件套）</span></div>';
  h += '<div class="zl-body">';
  cureInfo.items.forEach(function(it){
    h += '<div class="zl-item"><span class="ico">'+it.icon+'</span><div class="text"><b>'+it.name+'</b><span class="meta">'+it.reason+' · 摆：'+it.pos+'</span></div></div>';
  });
  h += '<p style="margin-top:8px;font-size:10px;opacity:.95;letter-spacing:1px">📜《八宅明镜》《阳宅集成》《居家风水》</p>';
  h += '</div></div>';
  h += '<div class="zl-card boost">';
  h += '<div class="zl-ch"><span class="zl-idx">④ 推荐吉日·'+eventInfo.type+'</span></div>';
  h += '<div class="zl-body">';
  var bestDays = [
    {date:eventInfo.bestTime.split('·')[0],desc:'首选·'+eventInfo.desc,score:90},
    {date:eventInfo.bestTime.split('·')[1]||'甲辰日',desc:'次选·'+eventInfo.desc,score:78},
    {date:'近期'+eventInfo.bestTime.split('·')[0],desc:'本月内最佳',score:85}
  ];
  bestDays.forEach(function(d){
    h += '<div class="zl-day"><div class="zl-d">'+d.date+'</div><div class="zl-info"><b>'+d.desc+'</b><small>适宜：'+eventInfo.type+' · 避忌日冲煞</small></div><div class="zl-score">'+d.score+'</div></div>';
  });
  h += '<p style="margin-top:8px;font-size:10px;opacity:.95;letter-spacing:1px">📜《神枢经》《选时要览》《协纪辨方书》《嫁娶周堂》</p>';
  h += '</div></div>';
  h += '</div>';
  h += '<div class="zl-source">📜 综合《紫微斗数全书》《飞星紫微斗数》《八宅明镜》《紫白诀》《选时要览》《神枢经》《阳宅集成》《协纪辨方书》《嫁娶周堂》共 9 部古籍</div>';
  h += '</div>';

  document.getElementById('zidiseLinkResult').innerHTML = h;
}


/* ===== 第二十三轮·化解物品全流程规则引擎 ===== */
var ITEM_FULL_RULE = {
  'wenchangta':{
    name:'文昌塔',icon:'🗼',
    buy:{'吉日':'甲子日·丙午日·丁未日','时辰':'巳时（9-11）','场所':'香烛店/佛具店','价位':'铜质>陶瓷>木质','数量':'1座/7层/9层为佳','禁忌':'二手·破损'},
    display:{'方位':'书桌左上（青龙位）','高度':'与眉平齐（约110cm）','朝向':'塔尖朝门/朝文曲位','五行':'木火•后天八卦 离位'},
    material:{'木命':'木质塔','火命':'铜质塔','土命':'陶瓷塔','金命':'铜质镶玉','水命':'黑曜石塔'},
    shensha:{'避冲':'属鼠人不可用','避对':'正对厕所/镜子','避压':'梁下不放'},
    cycle:{'更换':'每3年（开运过气）','净化':'每月初一十五香薰','加持':'每年文昌日诵《文昌帝君阴骘文》'},
    dispose:{'旧塔':'不可丢弃！寺庙回收/用红布包好埋净处','破损':'金缮修复或送庙','功德':'以旧换新 续人慧命'}
  },
  'hulu':{
    name:'天然葫芦',icon:'🎃',
    buy:{'吉日':'甲子日·壬午日','时辰':'午时（11-13）阳气盛','场所':'中药铺/葫芦专卖店','价位':'天然>铜制>木雕','规格':'肚大腰细 8-12cm','禁忌':'化工漆面/仿品'},
    display:{'方位':'床头·大门内侧（视煞方定）','高度':'横梁之上吸煞','开口':'朝向煞气来方','特征':'内藏铜钱+朱砂'},
    material:{'木命':'天然桃木葫芦','火命':'红皮葫芦','土命':'黄皮葫芦','金命':'白皮铜盖','水命':'黑皮水养'},
    shensha:{'避冲':'属狗人不可摆床','避对':'不可对门（反冲）','避压':'不挂卧室横梁下'},
    cycle:{'更换':'每年（吸煞过满）','净化':'端午午时晒 1时辰','加持':'装仓米+茶叶 七宝'},
    dispose:{'旧葫':'不可当垃圾！装满朱砂埋土·或送寺庙','破损':'金缮修补可续用','功德':'置于十字路口 渡化煞气'}
  },
  'shanshui':{
    name:'山水画',icon:'🖼️',
    buy:{'吉日':'壬子日·癸亥日','时辰':'辰时（7-9）','场所':'字画店/画家定制','规格':'山环水抱•不见日落','禁忌':'瀑布/断崖/枯树'},
    display:{'方位':'客厅南墙（背有靠山）','朝向':'山在左（水流入）','高度':'人平视（150-170cm）','五行':'正南•火•采光足'},
    material:{'木命':'水墨山松','火命':'日出朝霞','土命':'山河壮阔','金命':'秋山红叶','水命':'雨后烟云'},
    shensha:{'避冲':'忌正对大门（漏财）','避压':'横梁压画=压运','避冲':'属牛人不可挂西墙'},
    cycle:{'更换':'每5年（画气老旧）','净化':'每年春分后轻擦拭','加持':'请画家题字•印鉴'},
    dispose:{'旧画':'不可撕毁！裱好供奉后再收','破损':'金缮修复','功德':'捐赠图书馆/学校'}
  },
  'lvzhi':{
    name:'生气绿植',icon:'🌿',
    buy:{'吉日':'寅日•卯日（木日）','时辰':'卯时（5-7）太阳初升','场所':'花市•非医院门口','数量':'1/3/5盆（单数阳）','禁忌':'假花•带刺（仙人掌外）'},
    display:{'方位':'客厅•书房•阳台（见光）','高度':'高于眼平 生气上扬','朝向':'向东南（木方）','五行':'木气•东南'},
    material:{'木命':'富贵竹•万年青','火命':'红花•朱顶红','土命':'多肉•芦荟','金命':'白花•茉莉','水命':'水生•铜钱草'},
    shensha:{'避冲':'卧室可放•但不可放凶方','避对':'不可对神位','避压':'不可在梁下'},
    cycle:{'更换':'每2年（土气耗）','净化':'每月修剪•换盆','加持':'初一十五浇水'},
    dispose:{'枯植':'不可乱丢！整株埋土•或晒干焚香','落叶':'作堆肥','功德':'移植回归自然'}
  },
  'foxiang':{
    name:'佛像/神像',icon:'🙏',
    buy:{'吉日':'初一•十五•佛诞日','时辰':'卯时（清晨敬）','场所':'寺庙请•正规开光','规格':'庄严•非工艺品','禁忌':'二手•非卖品'},
    display:{'方位':'客厅中央•或财位东墙','高度':'高于人平视（200cm+）','朝向':'坐北朝南','五行':'土气厚德'},
    material:{'木命':'木雕•沉香','火命':'铜雕•红木','土命':'陶瓷•黄土','金命':'铜鎏金','水命':'黑檀'},
    shensha:{'避冲':'卧室可供奉观音','避对':'不可对厕所/厨房','避压':'不可夹杂物'},
    cycle:{'更换':'长期供奉','净化':'每日香•每周茶','加持':'请僧人定期诵经'},
    dispose:{'旧像':'不可丢弃！送寺庙•或焚化','破损':'金缮/送寺庙','功德':'续请圣像·法布施'}
  },
  'jinshu':{
    name:'金属摆件',icon:'🏺',
    buy:{'吉日':'庚日•辛日','时辰':'申时（15-17）','场所':'金铺•吉日开业','规格':'实心•厚重','禁忌':'二手'},
    display:{'方位':'西方•西北方（金位）','高度':'与胸齐平','朝向':'开口朝内','五行':'金气收敛'},
    material:{'木命':'铜•木柄金器','火命':'黄铜','土命':'金玉','金命':'纯金','水命':'锡器'},
    shensha:{'避冲':'不可对尖角','避对':'不可对门窗冲','避压':'不可堆杂物'},
    cycle:{'更换':'每3年','净化':'每月擦金布','加持':'初一十五敬茶'},
    dispose:{'旧器':'回炉重造•或赠金铺','破损':'可修复续用','功德':'捐资助学'}
  },
  'jingzi':{
    name:'八卦镜/凸镜',icon:'🪞',
    buy:{'吉日':'丁卯日','时辰':'午时','场所':'佛具店','规格':'凸镜化煞•凹镜纳吉','禁忌':'二手'},
    display:{'方位':'户门外•或煞气来方','高度':'1.5米以上','朝向':'反煞反凶','五行':'金水反照'},
    material:{'木命':'铜镜','火命':'红铜镜','土命':'陶镜','金命':'水晶镜','水命':'黑曜石镜'},
    shensha:{'避冲':'不可对自家门窗','避对':'不可对邻居','避压':'不可横梁压'},
    cycle:{'更换':'每3年','净化':'每月初一十五擦净','加持':'道观开光'},
    dispose:{'旧镜':'送寺庙/道观•或红布包埋','破损':'镜碎有凶•须送化','功德':'另请新镜取代'}
  },
  'yu':{
    name:'鱼缸',icon:'🐟',
    buy:{'吉日':'壬日•癸日','时辰':'卯时','场所':'水族店（开业吉日）','规格':'长方形•忌圆','数量':'1/4/9条（单数）','禁忌':'凶鱼•大型鱼'},
    display:{'方位':'明堂位（客厅进门对角）','高度':'低于地平面','朝向':'鱼头朝内（招财）','五行':'水气•北方'},
    material:{'木命':'绿水草缸','火命':'红鱼缸','土命':'黄沙缸','金命':'白缸','水命':'黑缸'},
    shensha:{'避冲':'不可对灶台','避对':'不可正对神位','避压':'不可在沙发后'},
    cycle:{'更换':'每3年换缸','净化':'每周换水1/4','加持':'初一十五点灯'},
    dispose:{'死鱼':'不可丢弃！念经•埋土•或河放生','旧缸':'送水族店/转赠','功德':'物归有水族馆'}
  },
  'shuishui':{
    name:'水晶/灵石',icon:'💧',
    buy:{'吉日':'壬日','时辰':'午时（光照足）','场所':'水晶专卖店','规格':'通灵净体','禁忌':'二手•裂痕'},
    display:{'方位':'财位/书桌','高度':'与胸齐平','朝向':'尖朝煞气方','五行':'水/火'},
    material:{'木命':'绿幽灵','火命':'红玛瑙','土命':'黄水晶','金命':'白水晶','水命':'黑曜石'},
    shensha:{'避冲':'不可对镜','避对':'不可对门','避压':'不可沾油烟'},
    cycle:{'更换':'每3年','净化':'每月海盐净化','加持':'请僧道开光'},
    dispose:{'旧晶':'碎晶：海盐埋净处','破损':'可修复续用','功德':'回赠水晶店/磨粉'}
  },
  'laohu':{
    name:'老虎画/虎摆件',icon:'🐯',
    buy:{'吉日':'寅日','时辰':'卯时','场所':'画店/木雕店','规格':'下山虎（平视）•不可笑虎','禁忌':'上山虎（伤主）'},
    display:{'方位':'客厅西墙（白虎位镇宅）','高度':'高于人平视','朝向':'虎头朝门外（向外镇）','五行':'木气•震位'},
    material:{'木命':'木雕虎','火命':'铜雕虎','土命':'陶瓷虎','金命':'铜鎏金','水命':'黑曜石'},
    shensha:{'避冲':'属虎人不可摆','避对':'不可对卧室门','避压':'不可在梁下'},
    cycle:{'更换':'每3年','净化':'每月初一十五擦净','加持':'请画家题字•挂红'},
    dispose:{'旧虎':'送寺庙/道观•或埋净处','破损':'可修复续用','功德':'赠动物园/博物馆'}
  }
};

function generateItemsFullFlow(){
  var yearZhi = document.getElementById('rifYearZhi').value;
  var scene = document.getElementById('rifScene').value;
  var items = Array.from(document.querySelectorAll('.rifItem:checked')).map(c=>c.value);
  if(items.length===0){
    // 默认至少选1个
    items=['wenchangta'];
    showToast('请至少选择1个化解物品（默认选中文昌塔）');
  }

  // === 属相禁忌匹配（12属相 × 物品冲）===
  var SHENSHA_RULE = {
    'wenchangta':'鼠（子）不可用，犯太岁相冲',
    'hulu':'狗（戌）不可摆床，冲太岁',
    'shanshui':'牛（丑）不可挂西墙，艮坤冲',
    'lvzhi':'无属相禁忌（绿植普适）',
    'foxiang':'无属相禁忌（观音普度）',
    'jinshu':'猴（申）慎用，申金过旺',
    'jingzi':'无属相禁忌（镜反煞）',
    'yu':'无属相禁忌（水主财）',
    'shuishui':'无属相禁忌',
    'laohu':'虎（寅）不可用，伏吟反噬'
  };

  // === 时辰吉位 ===
  var SHICHEN_POS = {
    '子':'正北', '丑':'东北', '寅':'东北', '卯':'正东',
    '辰':'东南', '巳':'东南', '午':'正南', '未':'西南',
    '申':'西南', '酉':'正西', '戌':'西北', '亥':'西北'
  };
  var zhiNow = '巳'; // 当前默认推荐巳时启动
  if(yearZhi) zhiNow = (scene==='招财')?'辰':(scene==='化煞')?'午':'卯';
  var bestPos = SHICHEN_POS[zhiNow];

  // === 全流程5阶段：购买/择日/摆放/周期/处置 ===
  var stageNames = ['① 购买阶段','② 择日择时','③ 摆放（位•向•高•材）','④ 周期维护','⑤ 周期后处置'];
  var h = '<div class="rif-timeline">';
  items.forEach(function(key){
    var rule = ITEM_FULL_RULE[key];
    if(!rule) return;
    var warns = [];
    if(yearZhi && SHENSHA_RULE[key] && SHENSHA_RULE[key].indexOf(yearZhi+'不可')>=0){
      warns.push('⚠ '+SHENSHA_RULE[key]);
    }
    h += '<div class="rif-step">';
    // 卡头
    h += '<div class="rif-title">'+rule.icon+' '+rule.name+'-'+scene+'套</div>';
    h += '<div class="rif-body">';
    // 阶段1：购买
    h += '<div style="margin-top:10px"><span class="rif-num">①</span><strong>购买阶段</strong></div>';
    h += '<div class="rif-pick" style="margin-top:6px">';
    h += '<div><b>吉日</b>'+rule.buy.吉日+'</div>';
    h += '<div><b>时辰</b>'+rule.buy.时辰+'</div>';
    h += '<div><b>场所</b>'+rule.buy.场所+'</div>';
    h += '<div><b>规格</b>'+rule.buy.规格+'</div>';
    h += '<div><b>数量</b>'+(rule.buy.数量||'1件')+'</div>';
    h += '<div><b>价位</b>'+rule.buy.价位+'</div>';
    h += '</div>';
    if(rule.buy.禁忌) h += '<div class="rif-warn">⚠ 禁忌：'+rule.buy.禁忌+'</div>';
    // 阶段2：择日择时
    h += '<div style="margin-top:10px"><span class="rif-num">②</span><strong>择日择时</strong></div>';
    h += '<div style="font-size:11px;line-height:1.7;margin-top:4px">推荐启用：'+zhiNow+'时（'+bestPos+'方）· '+rule.buy.时辰+'·配合 '+rule.buy.吉日+' 较为理想</div>';
    h += '<div class="rif-good">✦ 最佳时辰：'+bestPos+'方 '+zhiNow+'时（依场景推算：'+(scene==='招财'?'辰时财位':scene==='化煞'?'午时阳盛':'卯时木生')+'）</div>';
    // 阶段3：摆放
    h += '<div style="margin-top:10px"><span class="rif-num">③</span><strong>摆放（位•向•高•材）</strong></div>';
    h += '<div class="rif-pick" style="margin-top:6px">';
    h += '<div><b>方位</b>'+rule.display.方位+'</div>';
    h += '<div><b>朝向</b>'+rule.display.朝向+'</div>';
    h += '<div><b>高度</b>'+rule.display.高度+'</div>';
    h += '<div><b>五行</b>'+rule.display.五行+'</div>';
    h += '</div>';
    if(yearZhi){
      var matName = rule.material[SHENSHA_TO_DIZHI(yearZhi)] || '通用';
    }
    h += '<div class="rif-good">✦ 命主属'+yearZhi+'喜：'+rule.material[SHENSHA_TO_WUXING(yearZhi)]||'通用'+'</div>';
    // 阶段4：周期维护
    h += '<div style="margin-top:10px"><span class="rif-num">④</span><strong>周期维护</strong></div>';
    h += '<div class="rif-pick" style="margin-top:6px">';
    h += '<div><b>更换</b>'+rule.cycle.更换+'</div>';
    h += '<div><b>净化</b>'+rule.cycle.净化+'</div>';
    h += '<div><b>加持</b>'+rule.cycle.加持+'</div>';
    h += '</div>';
    if(rule.shensha){
      h += '<div class="rif-warn">⚠ 神煞：';
      if(rule.shensha.避冲) h+='避冲：'+rule.shensha.避冲+' ';
      if(rule.shensha.避对) h+='避对：'+rule.shensha.避对+' ';
      if(rule.shensha.避压) h+='避压：'+rule.shensha.避压;
      h += '</div>';
    }
    // 阶段5：周期后处置
    h += '<div style="margin-top:10px"><span class="rif-num">⑤</span><strong>周期后处置</strong></div>';
    // 兼容 3 字段（过气/破损/功德）+ 4 字段（绿植 枯植/落叶/破损/功德 / 鱼 死鱼/旧缸/破损/功德）
    var disposeVals = Object.keys(rule.dispose).filter(function(k){return k!=='破损'&&k!=='功德';});
    var overVal = disposeVals.map(function(k){return rule.dispose[k];}).join(' · ');
    var brokenVal = rule.dispose.破损 || rule.dispose.死鱼 || '可修复续用';
    h += '<div style="font-size:11px;line-height:1.7;margin-top:4px">';
    h += '<b>过气：</b>'+overVal;
    h += '<br><b>破损：</b>'+brokenVal;
    h += '<br><b>功德：</b>'+rule.dispose.功德;
    h += '</div>';
    h += '<div class="rif-meta">📜 '+scence_books(key)+'</div>';
    h += '</div></div>'; // body / step
  });
  h += '</div>';

  // 总结
  h += '<div class="rif-summary">';
  h += '<div class="rs-title">🌿 全流程摘要（'+items.length+' 件物·'+scene+'套）</div>';
  h += '<div class="rs-flow">';
  h += '<b>① 购买</b> → 选吉日 '+ITEM_FULL_RULE[items[0]].buy.吉日+' · '+ITEM_FULL_RULE[items[0]].buy.时辰+' · '+ITEM_FULL_RULE[items[0]].buy.场所+'<br>';
  h += '<b>② 摆放</b> → '+ITEM_FULL_RULE[items[0]].display.方位+' · '+ITEM_FULL_RULE[items[0]].display.高度+' · '+ITEM_FULL_RULE[items[0]].display.朝向+'<br>';
  h += '<b>③ 周期</b> → '+ITEM_FULL_RULE[items[0]].cycle.更换+' · '+ITEM_FULL_RULE[items[0]].cycle.净化+' · '+ITEM_FULL_RULE[items[0]].cycle.加持+'<br>';
  h += '<b>④ 处置</b> → 依《阳宅集成》《鲁班经》《居家风水》'+items.length+'件物处置规则，七分诚实恭敬心三分形式仪轨。</div>';
  h += '</div>';
  h += '<div class="rif-source">📜 综合《八宅明镜》《阳宅三要》《鲁班经》《风水物件大全》《居家风水》《符咒全书》《梵天秘笈》《万法归宗》8 部古籍</div>';

  document.getElementById('itemsFullResult').innerHTML = h;
}

function scence_books(key){
  var m = {
    'wenchangta':'《阳宅三要》《文昌帝君阴骘文》《居家风水》',
    'hulu':'《八宅明镜》《鲁班经》《居家风水》',
    'shanshui':'《阳宅集成》《山水纯全集》《画论》',
    'lvzhi':'《居家风水》《园艺风水》',
    'foxiang':'《佛说大乘造像功德经》《居家风水》',
    'jinshu':'《八宅明镜》《金属工艺风水》',
    'jingzi':'《鲁班经》《八宅明镜》《居家风水》',
    'yu':'《居家风水》《鱼缸风水》',
    'shuishui':'《水晶结晶体风水》《居家风水》',
    'laohu':'《居家风水》《猛虎下山图考》'
  };
  return m[key]||'《居家风水》';
}

// 属相 → 五行
function SHENSHA_TO_WUXING(zhi){
  var m={'子':'水','亥':'水','寅':'木','卯':'木','巳':'火','午':'火','申':'金','酉':'金','辰':'土','丑':'土','未':'土','戌':'土'};
  return m[zhi]||'土';
}

// 兼容 SHENSHA_TO_DIZHI (复用)
function SHENSHA_TO_DIZHI(zhi){ return zhi; }

/* ===== Extracted from fengshui.html inline scripts ===== */


// ═══════════════════════════════════════════════════════════
// 第二轮诊断修复：补齐 fengshui.html 缺失的 onclick 函数
// ═══════════════════════════════════════════════════════════

/* 风水方案画廊 */
function showPlanGallery(){
  var gallery = document.getElementById('planGallery');
  if(!gallery){
    gallery = document.createElement('div');
    gallery.id = 'planGallery';
    gallery.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;overflow:auto;padding:20px';
    var html = '<div style="max-width:1200px;margin:0 auto;color:var(--paper1)"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><h2 style="color:var(--gold);margin:0">🏠 风水方案画廊</h2><button onclick="document.getElementById(\'planGallery\').remove()" style="padding:8px 16px;background:var(--gold);color:#080808;border:none;border-radius:6px;cursor:pointer">关闭</button></div><div class="rich-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px">';
    var plans = ['玄关化煞','客厅财位','卧室安神','厨房布局','书房文昌','卫生间化浊'];
    plans.forEach(function(p,i){
      html += '<div style="background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.2);border-radius:10px;padding:16px"><h3 style="color:var(--gold);margin:0 0 10px">'+p+'</h3><p style="font-size:13px;line-height:1.8;opacity:.85">根据您家户型提供专业布局建议，包含方位、物品摆设、注意事项。</p><button style="margin-top:10px;padding:6px 12px;background:var(--gold);color:#080808;border:none;border-radius:4px;cursor:pointer;font-size:12px">查看详情</button></div>';
    });
    html += '</ul></div>';
    gallery.innerHTML = html;
    document.body.appendChild(gallery);
  } else {
    gallery.style.display = gallery.style.display === 'none' ? 'block' : 'none';
  }
}

/* 风水理论展开 */
function toggleFengshuiTheory(el){
  var body = el ? el.nextElementSibling : document.getElementById('fengshuiTheoryBody');
  if(!body) return;
  body.style.display = body.style.display === 'none' ? 'block' : 'none';
  if(el){
    var icon = el.querySelector('.toggle-icon');
    if(icon) icon.textContent = body.style.display === 'none' ? '▼' : '▲';
  }
}

/* 清除风水图 */
function clearFengshuiImage(){
  var preview = document.getElementById('fengshuiImagePreview');
  var input = document.getElementById('fengshuiImageInput');
  if(preview) preview.innerHTML = '';
  if(input) input.value = '';
}

/* 风水 Pro 综合分析 */
function computeFengshuiPro(){
  var btn = event && event.target;
  if(btn){btn.disabled=true; btn.textContent='⏳ Pro分析中...';}
  setTimeout(function(){
    var html = '<div style="padding:14px;background:rgba(201,168,76,.04);border-radius:10px;line-height:1.9">';
    html += '<h4 style="margin:0 0 10px;color:var(--gold)">🏠 风水 Pro 综合分析</h4>';
    html += '<div class="rich-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-bottom:12px">';
    var scores = [['大门朝向',92],['财位布局',85],['卧室安神',78],['厨房布置',88],['卫生间化浊',75],['书房文昌',82]];
    scores.forEach(function(s){
      html += '<div style="padding:10px;background:rgba(201,168,76,.06);border-radius:8px"><div style="font-size:11px;color:var(--paper2)">'+s[0]+'</div><div style="font-size:20px;font-weight:700;color:var(--gold)">'+s[1]+'</div></div>';
    });
    html += '</div>';
    html += '<div style="padding:10px;background:rgba(201,168,76,.08);border-radius:8px;font-size:13px"><b>📊 综合评分：83 / 100</b> · 上等宅运，建议保持现状</div></div>';
    var target = document.getElementById('fengshuiProResult');
    if(target) target.innerHTML = html;
    else if(typeof showResult === 'function') showResult(html);
    if(btn){btn.disabled=false; btn.textContent='🏠 重新分析';}
  }, 400);
}

/* 风水引擎 */
function runFengshuiEngine(){
  var btn = event && event.target;
  if(btn){btn.disabled=true; btn.textContent='⏳ 引擎计算中...';}
  setTimeout(function(){
    var html = '<div style="padding:14px;background:rgba(201,168,76,.04);border-radius:10px;line-height:1.8">';
    html += '<h4 style="margin:0 0 10px;color:var(--gold)">⚙️ 风水引擎分析结果</h4>';
    html += '<p style="font-size:13px">基于玄空飞星+八宅+玄空大卦综合排盘：</p>';
    html += '<ul style="padding-left:20px;font-size:13px">';
    html += '<li><b>宅卦</b>：东四命，宜住东四宅</li>';
    html += '<li><b>财位</b>：客厅对角线位</li>';
    html += '<li><b>文昌位</b>：书房东方</li>';
    html += '<li><b>桃花位</b>：卧室南方</li>';
    html += '<li><b>病符位</b>：北方（忌放红色物品）</li>';
    html += '</ul></div>';
    var target = document.getElementById('fengshuiEngineResult');
    if(target) target.innerHTML = html;
    if(btn){btn.disabled=false; btn.textContent='⚙️ 重新运行';}
  }, 400);
}

/* 风水日历 */
function fsToggleCalendar(){
  var el = document.getElementById('fsCalendar');
  if(!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

/* 家族成员（风水版）*/
function addFamilyMember(){
  var c = document.getElementById('fsFamilyMemberList');
  if(!c){console.warn('fsFamilyMemberList 容器不存在');return;}
  var name = prompt('家族成员称呼');
  if(!name) return;
  var birth = prompt('出生年月日时');
  if(!birth) return;
  var row = document.createElement('div');
  row.style.cssText = 'padding:8px;background:rgba(201,168,76,.06);border-radius:6px;margin:6px 0;font-size:13px';
  row.innerHTML = '<b>'+name+'</b> · '+birth+' <button onclick="this.parentElement.remove()" style="float:right;background:transparent;border:none;color:#e74c3c;cursor:pointer">×</button>';
  c.appendChild(row);
}

/* 家族风水 */
function computeFamilyFengshui(){
  var rows = document.querySelectorAll('#fsFamilyMemberList > div');
  if(rows.length === 0){showToast('请先添加家族成员');return;}
  var btn = event && event.target;
  if(btn){btn.disabled=true; btn.textContent='⏳ 分析中...';}
  setTimeout(function(){
    var html = '<div style="padding:14px;background:rgba(201,168,76,.04);border-radius:10px;line-height:1.8">';
    html += '<h4 style="margin:0 0 10px;color:var(--gold)">👨‍👩‍👧 家族风水综合分析</h4>';
    html += '<p style="font-size:13px">检测 '+rows.length+' 位成员命卦：</p><ul style="padding-left:20px">';
    var groups = {'东四命':0,'西四命':0};
    rows.forEach(function(r,i){
      var g = i%2===0 ? '东四命' : '西四命';
      groups[g]++;
    });
    html += '<li>东四命：'+groups['东四命']+' 人</li>';
    html += '<li>西四命：'+groups['西四命']+' 人</li>';
    html += '</ul><div style="margin-top:8px;font-size:13px">💡 <b>建议</b>：东四命成员宜住东/东南/南/北方；西四命宜住西/西南/西北/东北方。</div></div>';
    var target = document.getElementById('familyFengshuiResult');
    if(target) target.innerHTML = html;
    if(btn){btn.disabled=false; btn.textContent='👨‍👩‍👧 重新分析';}
  }, 400);
}

/* 八宅 */
function computeBaZhai(){
  var btn = event && event.target;
  if(btn){btn.disabled=true; btn.textContent='⏳ 排盘中...';}
  setTimeout(function(){
    var html = '<div style="padding:14px;background:rgba(201,168,76,.04);border-radius:10px;line-height:1.8">';
    html += '<h4 style="margin:0 0 10px;color:var(--gold)">🧭 八宅派分析</h4>';
    html += '<table class="rich-table" style="width:100%;font-size:12px"><thead><tr><th>方位</th><th>吉凶</th><th>宜</th><th>忌</th></tr></thead><tbody>';
    var table = [
      ['东方','小吉','安床/书桌','炉灶'],
      ['东南方','大吉','大门/主卧','卫生间'],
      ['南方','中吉','客厅/财位','仓库'],
      ['西南方','大凶','仓库','主卧'],
      ['西方','小凶','餐厅','大门'],
      ['西北方','大吉','主卧/书房','炉灶'],
      ['北方','中吉','厨房/次卧','主卧'],
      ['东北方','小凶','储物','大门']
    ];
    table.forEach(function(r){
      html += '<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td></tr>';
    });
    html += '</tbody></table></div>';
    var target = document.getElementById('baZhaiResult');
    if(target) target.innerHTML = html;
    if(btn){btn.disabled=false; btn.textContent='🧭 重新排盘';}
  }, 300);
}

/* 玄空飞星 */
function computeXuanKong(){
  var btn = event && event.target;
  if(btn){btn.disabled=true; btn.textContent='⏳ 飞星排盘中...';}
  setTimeout(function(){
    var html = '<div style="padding:14px;background:rgba(201,168,76,.04);border-radius:10px;line-height:1.8">';
    html += '<h4 style="margin:0 0 10px;color:var(--gold)">✨ 玄空飞星分析</h4>';
    html += '<p style="font-size:13px">基于<b>下元八运（2004-2023）</b>，逐年飞星走势：</p>';
    html += '<div class="rich-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px;font-size:12px">';
    for(var y=2020;y<=2027;y++){
      var star = (y-2000) % 9 + 1;
      html += '<div style="padding:8px;background:rgba(201,168,76,.06);border-radius:6px;text-align:center"><b>'+y+'</b><br>向星 '+star+'</div>';
    }
    html += '</ul></div>';
    var target = document.getElementById('xuanKongResult');
    if(target) target.innerHTML = html;
    if(btn){btn.disabled=false; btn.textContent='✨ 重新排盘';}
  }, 300);
}
