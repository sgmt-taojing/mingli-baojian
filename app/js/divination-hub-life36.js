/* ===== R36 · 健康事业双核 + 12 领域生活矩阵 =====
   Extracted from divination-hub.html (was inline L28-99, 8KB / 71 lines)
   - window.HEALTH_8D_R36 / CAREER_8D_R36 / LIFE_12_R36 数据
   - calcHealthScoreR36 / calcCareerScoreR36 评分计算
   - renderLifeDashboardR36 / toggleLife12Detail 渲染与交互
   - defer 加载，DOMContentLoaded 后可用
*/
var HEALTH_8D_R36={"气血":{"label":"🩸 气血","desc":"血液循环·面色·精神","tip":"规律作息+八段锦+红枣枸杞"},"脾胃":{"label":"🍚 脾胃","desc":"消化吸收·食欲·大便","tip":"细嚼慢咽+小米粥+山药"},"心肾":{"label":"💗 心肾","desc":"心脏+肾脏+睡眠","tip":"子午觉+黑豆黑芝麻+节欲"},"肝胆":{"label":"🌿 肝胆","desc":"疏泄·情绪·眼睛","tip":"少熬夜+菊花枸杞+推肝经"},"睡眠":{"label":"😴 睡眠","desc":"入睡·深睡·做梦","tip":"23点前睡+酸枣仁+热水泡脚"},"情绪":{"label":"😊 情绪","desc":"压力·焦虑·抑郁","tip":"冥想+运动+倾诉+疏肝"},"体质":{"label":"💪 体质","desc":"免疫力·耐力·抗病","tip":"慢跑+游泳+中医调理+九种体质"},"寿元":{"label":"🎂 寿元","desc":"先天禀赋+后天保养","tip":"顺应四时+节制饮食+心境平和"}};
var CAREER_8D_R36={"正财":{"label":"💰 正财","desc":"工资·稳定收入","tip":"稳中求进+主业为重+积累技能"},"偏财":{"label":"🎲 偏财","desc":"投资·副业·意外财","tip":"小额试水+长线思维+风险控制"},"官运":{"label":"👔 官运","desc":"仕途·升迁·管理位","tip":"贵人扶持+业绩+持续学习+等待时机"},"学业":{"label":"📚 学业","desc":"读书·考试·文凭","tip":"夯实基础+查漏补缺+请家教+选对方法"},"创业":{"label":"🚀 创业","desc":"自主·合伙·独资","tip":"小步快跑+核心壁垒+现金流+合伙人"},"升迁":{"label":"📈 升迁","desc":"职场晋升·调岗·转型","tip":"业绩+人际+学习+抓住时机+主动争取"},"同事":{"label":"👥 同事","desc":"上下级+同事关系","tip":"互相尊重+团队协作+不站队+做好本职"},"合作":{"label":"🤝 合作","desc":"合作伙伴·供应商","tip":"契约精神+互惠互利+长期主义+账目清晰"}};
var LIFE_12_R36={"health":{"cat":"健康","name":"身心健康","icon":"🩺","score":78,"stars":"★★★★☆","tip":"气血尚可·脾胃偏弱·少熬夜多运动"},"career":{"cat":"事业","name":"事业财运","icon":"💼","score":82,"stars":"★★★★☆","tip":"正财稳·偏财有·升迁可期·创业慎行"},"marriage":{"cat":"感情","name":"感情婚姻","icon":"💑","score":75,"stars":"★★★★☆","tip":"桃花有·择对人为先·晚婚更稳"},"family":{"cat":"家庭","name":"家庭关系","icon":"👨👩👧","score":85,"stars":"★★★★★","tip":"家和万事兴·孝敬父母·夫妻和睦"},"study":{"cat":"学业","name":"学业考试","icon":"📖","score":73,"stars":"★★★☆☆","tip":"基础扎实·方法待改·贵人指点"},"finance":{"cat":"财务","name":"财务规划","icon":"💵","score":70,"stars":"★★★☆☆","tip":"量入为出·不投机·积谷防饥"},"social":{"cat":"人际","name":"人际社交","icon":"👥","score":80,"stars":"★★★★☆","tip":"贵人相助·少树敌+多布施"},"spirit":{"cat":"精神","name":"精神修养","icon":"🧘","score":77,"stars":"★★★★☆","tip":"读书养性·静坐冥想·心斋坐忘"},"liuyun":{"cat":"流年","name":"流年运势","icon":"📅","score":76,"stars":"★★★★☆","tip":"2026丙午·事业有起·健康守中"},"dayun":{"cat":"大运","name":"大运走势","icon":"🌊","score":74,"stars":"★★★☆☆","tip":"十年换运·抓住三步节点"},"huajie":{"cat":"化解","name":"化解避忌","icon":"🛡","score":83,"stars":"★★★★☆","tip":"趋吉避凶·化解有方·五维一体"},"chuancheng":{"cat":"传承","name":"家业传承","icon":"🏛","score":72,"stars":"★★★☆☆","tip":"教子有方·家训流传·积善为本"}};
function calcHealthScoreR36(data){
  var wx=(data.dayWuxing||"木");var base=72;
  var dHealth=HEALTH_8D_R36;
  var sxBoost=((data.yearZhi||"子")==="辰"||(data.yearZhi||"子")==="戌")?6:((data.yearZhi||"子")==="亥"||(data.yearZhi||"子")==="子")?-3:0;
  return Math.min(98,base+sxBoost+(wx==="木"?3:(wx==="火"?1:(wx==="土"?5:(wx==="金"?0:-2)))));
}
function calcCareerScoreR36(data){
  var wx=(data.dayWuxing||"木");var base=75;
  var strong=data.isStrong?8:-4;
  return Math.min(98,base+strong+(wx==="木"?5:(wx==="火"?3:(wx==="土"?6:(wx==="金"?4:(wx==="水"?2:0))))));
}
function renderLifeDashboardR36(data){
  var hS=calcHealthScoreR36(data);var cS=calcCareerScoreR36(data);
  var overall=Math.round((hS+cS)/2*10)/10;
  var wx=(data.dayWuxing||"木");
  var strong=data.isStrong?"身旺":"身弱";
  var dz=data.yearZhi||"子";
  var h='<div class="life-dashboard">';
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px"><h3 style="margin:0;color:var(--gold);font-size:16px;letter-spacing:2px">🌐 生活全貌·健康事业双核 + 12 领域矩阵</h3><div style="font-size:12px;color:var(--paper3)">综合 <b style="color:var(--gold);font-size:16px">'+overall+'</b> / 100 · '+wx+'日主 · '+strong+' · '+dz+'年生</div></div>';
  h+='<div class="life-dual-core">';
  h+='<div class="life-core-card health"><div class="life-core-title">🩺 健康维度</div><div class="life-core-score">'+hS+'<span style="font-size:14px;opacity:.6">/100</span></div><div class="life-core-bar"><div class="life-core-fill" style="width:'+hS+'%"></div></div><div class="life-core-meta"><span>🩸气血</span><span>🍚脾胃</span><span>💗心肾</span><span>🌿肝胆</span></div><div class="life-core-tags">';
  Object.keys(HEALTH_8D_R36).forEach(function(k){var it=HEALTH_8D_R36[k];h+='<div class="life-core-tag" title="'+it.desc+'·'+it.tip+'">'+it.label+'</div>';});
  h+='</div></div>';
  h+='<div class="life-core-card career"><div class="life-core-title">💼 事业维度</div><div class="life-core-score">'+cS+'<span style="font-size:14px;opacity:.6">/100</span></div><div class="life-core-bar"><div class="life-core-fill" style="width:'+cS+'%"></div></div><div class="life-core-meta"><span>💰正财</span><span>👔官运</span><span>📈升迁</span><span>🚀创业</span></div><div class="life-core-tags">';
  Object.keys(CAREER_8D_R36).forEach(function(k){var it=CAREER_8D_R36[k];h+='<div class="life-core-tag" title="'+it.desc+'·'+it.tip+'">'+it.label+'</div>';});
  h+='</div></div>';
  h+='</div>';
  h+='<div style="margin:10px 0 8px;color:var(--paper3);font-size:12px;letter-spacing:1.5px">📋 12 领域生活矩阵 · 点击展开详细</div>';
  h+='<div class="life-12matrix">';
  Object.keys(LIFE_12_R36).forEach(function(k){var it=LIFE_12_R36[k];
    h+='<ml-tap class="life-12cell" onclick="toggleLife12Detail(this,\''+k+'\')" variant="card" role="button" tabindex="0"><span class="life-12icon">'+it.icon+'</span><div class="life-12name">'+it.name+'</div><div class="life-12score">'+it.score+'分 · '+it.stars+'</div><div class="life-12score" style="margin-top:4px;opacity:.7">'+it.tip+'</div></ml-tap>';
  });
  h+='</div>';
  h+='<div id="life12Detail" style="display:none;margin-top:14px"></div>';
  h+='<div class="life-12verdict"><b style="color:var(--gold)">🌐 整体判读：</b><br>① <b style="color:#4a9a6e">健康 '+hS+'分</b>（八维：气血/脾胃/心肾/肝胆/睡眠/情绪/体质/寿元）—— 八维均衡者无大碍，偏弱维度及时调理 ② <b style="color:#4a8aa8">事业 '+cS+'分</b>（八维：正财/偏财/官运/学业/创业/升迁/同事/合作）—— 八维共进则事业长青 ③ 12 领域中<b style="color:var(--gold)">家庭 85 / 化解 83 / 事业 82</b>为三大优势，<b>财务 70 / 学业 73 / 传承 72</b>为三大短板，需重点关注 ④ 化解建议：补短板+稳优势+借流年+顺大运</div>';
  h+='<div class="life-action-list"><b>📝 12 行动清单：</b><ol>';
  h+='<li>🩺 健康：每周 3 次运动+22:00 前睡+调脾胃（小米粥/山药）</li>';
  h+='<li>💼 事业：主业精进+副业试水+持续学习+贵人维护</li>';
  h+='<li>💑 感情：择对人多沟通+经营婚姻+晚婚更稳</li>';
  h+='<li>👨👩👧 家庭：孝敬父母+夫妻和睦+亲子陪伴</li>';
  h+='<li>📖 学业：方法论+请教+查漏补缺+持之以恒</li>';
  h+='<li>💵 财务：量入为出+不投机+积谷防饥+稳健投资</li>';
  h+='<li>👥 人际：少树敌+多布施+贵人维护+团队协作</li>';
  h+='<li>🧘 精神：读书养性+静坐冥想+远离喧嚣+心斋坐忘</li>';
  h+='<li>📅 流年：2026 丙午·事业有起+健康守中+把握时机</li>';
  h+='<li>🌊 大运：十年换运+三步节点+提前布局+稳中求进</li>';
  h+='<li>🛡 化解：趋吉避凶+化解有方+五维一体（物品/择日/方位/属相/时辰）</li>';
  h+='<li>🏛 传承：教子有方+家训流传+积善为本+家风建设</li>';
  h+='</ol></div>';
  h+='<div class="life-source">📜 综合《滴天髓》《子平真诠》《穷通宝鉴》《三命通会》《紫微斗数全集》《太乙金华宗旨》《黄帝内经》《千金要方》《了凡四训》《阴骘文》《玉历宝钞》《协纪辨方书》《天星择日》《黄帝宅经》《八宅明镜》《玄空飞星》《阳宅三要》《葬书》《撼龙经》《梅花易数》《奇门遁甲》《太上感应篇》《三世因果经》《地藏经》《药师经》共 25 部古籍</div>';
  h+='</div>';
  return h;
}
function toggleLife12Detail(el,k){
  var box=document.getElementById('life12Detail');var it=LIFE_12_R36[k];
  if(!box){return;}
  var showing=el.classList.contains('active');
  document.querySelectorAll('.life-12cell').forEach(function(c){c.classList.remove('active');});
  if(showing){box.style.display='none';box.innerHTML='';return;}
  el.classList.add('active');
  var det='<div style="padding:14px;background:rgba(201,168,76,.06);border-radius:10px;border:1px solid var(--gold);font-size:12px;line-height:1.9"><div style="font-size:16px;color:var(--gold);margin-bottom:8px">'+it.icon+' '+it.name+' · '+it.cat+'维度 · '+it.score+'分 · '+it.stars+'</div>';
  if(k==='health'){det+='<b style="color:#4a9a6e">🩺 八维明细：</b><ul style="padding-left:20px;margin:6px 0">';Object.keys(HEALTH_8D_R36).forEach(function(dk){var d=HEALTH_8D_R36[dk];det+='<li><b>'+d.label+'</b> · '+d.desc+' · '+d.tip+'</li>';});det+='</ul>';}
  else if(k==='career'){det+='<b style="color:#4a8aa8">💼 八维明细：</b><ul style="padding-left:20px;margin:6px 0">';Object.keys(CAREER_8D_R36).forEach(function(dk){var d=CAREER_8D_R36[dk];det+='<li><b>'+d.label+'</b> · '+d.desc+' · '+d.tip+'</li>';});det+='</ul>';}
  else{det+='<b>核心要点：</b>'+it.tip+'<br><b>建议行动：</b>参见上方 12 行动清单。<br><b>关联古籍：</b>《滴天髓》《了凡四训》《阴骘文》《太上感应篇》《黄帝内经》《八宅明镜》。';}
  det+='</div>';
  box.innerHTML=det;box.style.display='block';box.scrollIntoView({behavior:'smooth',block:'nearest'});}

// 暴露到 window，供 inline onclick 调用
window.HEALTH_8D_R36 = HEALTH_8D_R36;
window.CAREER_8D_R36 = CAREER_8D_R36;
window.LIFE_12_R36 = LIFE_12_R36;
window.calcHealthScoreR36 = calcHealthScoreR36;
window.calcCareerScoreR36 = calcCareerScoreR36;
window.renderLifeDashboardR36 = renderLifeDashboardR36;
window.toggleLife12Detail = toggleLife12Detail;