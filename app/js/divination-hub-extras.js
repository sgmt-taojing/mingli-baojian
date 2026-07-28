// TZ_DATA 已由 tizhi-module.js 统一定义，此处不再重复
// 保留体质模块函数（tizhi-module.js 可能尚未加载时的 fallback）

function tzSwitchTab(name){
  let allTabs = ['report','selftest','plan','food','qigong','prescription','bazi','checkin','wuxing','encyclopedia'];
  allTabs.forEach(function(t){
    let panel=document.getElementById('tz-tab-'+t);
    let btn=document.getElementById('tzTab-'+t);
    if(panel) panel.style.display = (t===name)?'block':'none';
    if(btn){
      if(t===name){btn.style.background='var(--title)';btn.style.color='var(--paper)';btn.style.fontWeight='600';}
      else{btn.style.background='transparent';btn.style.color='var(--muted)';btn.style.fontWeight='400';}
    }
  });
  if(name==='selftest' && !document.getElementById('tzQuestionnaire').innerHTML) tzRenderQuestionnaire();
  if(name==='food' && !document.getElementById('tzFoodList').innerHTML) tzRenderFood('all');
  if(name==='qigong') tzRenderQigong();
  if(name==='prescription') tzRenderPrescriptions();
  if(name==='plan') tzPopulatePlanSelect();
  if(name==='checkin') tzRenderCheckin();
  if(name==='wuxing' && !document.getElementById('tzWuxingDetail').innerHTML) {tzSelectWuxing('Mu');tzRenderWxButtons();}
}

function tzPopulatePlanSelect(){
  let sel=document.getElementById('tzPlanTizhi');
  if(!sel) return;
  // Check if already populated
  if(sel.options.length>1) return;
  TZ_DATA.constitutions.forEach(function(c){
    let opt=document.createElement('option');
    opt.value=c.key;opt.textContent=c.icon+' '+c.name;
    sel.appendChild(opt);
  });
  // Try to get last result
  try{
    let last=window._tzLastResult;
    if(last && last.key){sel.value=last.key;}
  }catch(e){console.warn(e.message)}
}

function tzGeneratePlan(){
  let sel=document.getElementById('tzPlanTizhi');
  let tizhiKey=sel.value;
  if(!tizhiKey){showToast('请先选择体质类型');return;}
  let cons=TZ_DATA.constitutions.find(function(c){return c.key===tizhiKey;});
  if(!cons) return;
  let result=document.getElementById('tzPlanResult');
  result.style.display='block';
  result.innerHTML='<div style="text-align:center;padding:30px"><div style="font-size:32px;margin-bottom:16px;animation:spin 2s linear infinite">🎯</div><div style="font-size:16px;color:var(--gold);margin-bottom:8px">AI正在生成您的综合养生方案...</div><div style="font-size:13px;color:var(--paper2)">基于' + cons.name + '体质特征</div></div>';

  // Build context for AI
  let wuKey={木:'Mu',火:'Huo',土:'Tu',金:'Jin',水:'Shui'}[cons.yangsheng.match(/[木火土金水]/)?cons.yangsheng.match(/[木火土金水]/)[0]:'土'];
  let prompt='你是中医养生专家。请为"' + cons.name + '"体质的人生成一份综合养生方案。\n';
  prompt+='体质特征：' + cons.desc + '\n';
  prompt+='基本养生原则：' + cons.yangsheng + '\n\n';
  prompt+='请从以下四个维度给出具体方案：\n';
  prompt+='1. 中医食疗（推荐3-5道食疗方，含食材和做法）\n';
  prompt+='2. 功法锻炼（推荐2-3种适合的功法，说明理由）\n';
  prompt+='3. 正念修习（推荐冥想/呼吸/禅修方法）\n';
  prompt+='4. 起居调摄（作息/穴位/注意事项）\n\n';
  prompt+='用JSON格式回复：{"食疗":[{"名称":"...","食材":"...","做法":"...","功效":"..."}],"功法":[{"名称":"...","理由":"...","时长":"..."}],"正念":[{"方法":"...","步骤":"...","益处":"..."}],"起居":[{"方面":"...","建议":"..."}],"总结":"..."}';

  fetch('/v1/chat/completions',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({model:'openclaw',messages:[{role:'user',content:prompt}],max_tokens:2000,temperature:0.4})
  }).then(function(r){return r.json();}).then(function(data){
    let text=data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content||'';
    let jsonMatch=text.match(/\{[\s\S]+\}/);
    let obj=null;
    if(jsonMatch){try{obj=JSON.parse(jsonMatch[0]);}catch(e){obj=null;}}
    if(!obj){
      result.innerHTML='<div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px;padding:20px"><div style="font-size:14px;color:var(--text);line-height:1.8;white-space:pre-wrap">'+escapeHtml(text)+'</div></div>';
      return;
    }
    let html='<div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px;padding:24px">';
    // Header
    html+='<div style="text-align:center;margin-bottom:20px"><div style="font-size:48px">'+cons.icon+'</div><div style="font-size:20px;color:'+cons.color+';font-weight:bold;margin-top:8px">'+cons.name+' · 综合养生方案</div><div style="font-size:13px;color:var(--paper2);margin-top:6px">'+cons.desc+'</div></div>';
    // 食疗
    if(obj.食疗&&obj.食疗.length){
      html+='<div style="background:rgba(45,106,79,0.06);border-left:3px solid var(--success);padding:16px;border-radius:0 10px 10px 0;margin-bottom:14px"><div style="font-size:15px;color:var(--success);font-weight:bold;margin-bottom:12px">🍵 中医食疗</div>';
      obj.食疗.forEach(function(r){html+='<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px;margin-bottom:8px"><div style="font-size:14px;color:var(--gold);font-weight:bold;margin-bottom:4px">'+r.名称+'</div><div style="font-size:12px;color:var(--paper2);margin-bottom:4px"><b>食材：</b>'+r.食材+'</div><div style="font-size:12px;color:var(--paper2);margin-bottom:4px"><b>做法：</b>'+r.做法+'</div><div style="font-size:12px;color:var(--success)"><b>功效：</b>'+r.功效+'</div></div>';});
      html+='</div>';
    }
    // 功法
    if(obj.功法&&obj.功法.length){
      html+='<div style="background:rgba(201,168,76,0.06);border-left:3px solid var(--gold);padding:16px;border-radius:0 10px 10px 0;margin-bottom:14px"><div style="font-size:15px;color:var(--gold);font-weight:bold;margin-bottom:12px">🧘 功法锻炼</div>';
      obj.功法.forEach(function(r){html+='<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px;margin-bottom:8px"><div style="font-size:14px;color:var(--gold);font-weight:bold;margin-bottom:4px">'+r.名称+' <span style="font-size:12px;color:var(--muted)">（'+r.时长+'）</span></div><div style="font-size:12px;color:var(--paper2)">'+r.理由+'</div></div>';});
      html+='</div>';
    }
    // 正念
    if(obj.正念&&obj.正念.length){
      html+='<div style="background:rgba(155,89,182,0.06);border-left:3px solid var(--violet);padding:16px;border-radius:0 10px 10px 0;margin-bottom:14px"><div style="font-size:15px;color:var(--violet);font-weight:bold;margin-bottom:12px">🧠 正念修习</div>';
      obj.正念.forEach(function(r){html+='<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px;margin-bottom:8px"><div style="font-size:14px;color:var(--violet2);font-weight:bold;margin-bottom:4px">'+r.method||r.方法+'</div><div style="font-size:12px;color:var(--paper2);margin-bottom:4px">'+(r.steps||r.步骤)+'</div><div style="font-size:12px;color:var(--success)">'+(r.benefit||r.益处)+'</div></div>';});
      html+='</div>';
    }
    // 起居
    if(obj.起居&&obj.起居.length){
      html+='<div style="background:rgba(52,152,219,0.06);border-left:3px solid var(--cyan2);padding:16px;border-radius:0 10px 10px 0;margin-bottom:14px"><div style="font-size:15px;color:var(--cyan2);font-weight:bold;margin-bottom:12px">🏠 起居调摄</div>';
      obj.起居.forEach(function(r){html+='<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px;margin-bottom:8px"><div style="font-size:13px;color:var(--gold);font-weight:bold;margin-bottom:4px">'+(r.方面||r.aspect)+'</div><div style="font-size:12px;color:var(--paper2)">'+(r.建议||r.advice)+'</div></div>';});
      html+='</div>';
    }
    // Summary
    if(obj.总结){
      html+='<div style="background:rgba(201,168,76,0.06);border-left:3px solid var(--gold);padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:14px"><div style="font-size:14px;color:var(--gold);font-weight:bold;margin-bottom:6px">📝 总结</div><div style="font-size:13px;color:var(--text);line-height:1.8">'+obj.总结+'</div></div>';
    }
    // Disclaimer
    html+='<div style="background:rgba(231,76,60,0.04);border:1px solid rgba(231,76,60,0.15);border-radius:8px;padding:12px 16px;margin-top:12px"><div style="font-size:12px;color:var(--cinn2);line-height:1.6">⚠️ <b>温馨提示：</b>本方案由AI根据体质特征生成，仅供养生保健参考。如有特定疾病或服药中，请咨询中医师调整方案。功法练习请循序渐进，如有不适请停止。</div></div>';
    html+='</div>';
    result.innerHTML=html;
  }).catch(function(err){
    // 离线降级:用本地体质数据生成方案
    console.warn('方案生成API不可用,切换本地引擎:', err);
    let cons2 = cons;
    let html2 = '<div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px;padding:24px">';
    html2 += '<div style="text-align:center;margin-bottom:20px"><div style="font-size:48px">' + cons2.icon + '</div><div style="font-size:20px;color:' + cons2.color + ';font-weight:bold;margin-top:8px">' + cons2.name + ' · 综合养生方案</div><div style="font-size:13px;color:var(--paper2);margin-top:6px">' + cons2.desc + '</div></div>';
    // 食疗
    html2 += '<div style="background:rgba(45,106,79,0.06);border-left:3px solid var(--success);padding:16px;border-radius:0 10px 10px 0;margin-bottom:14px"><div style="font-size:15px;color:var(--success);font-weight:bold;margin-bottom:12px">🍵 中医食疗</div>';
    let recipes = (TZ_DATA.recipes || []).filter(function(r) { return r.constitutions.indexOf(cons2.name.replace('质','')) >= 0 || r.constitutions.length === 0; });
    if (recipes.length === 0) recipes = (TZ_DATA.recipes || []).slice(0, 3);
    recipes.slice(0, 4).forEach(function(r) {
      html2 += '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px;margin-bottom:8px"><div style="font-size:14px;color:var(--gold);font-weight:bold;margin-bottom:4px">' + r.name + '</div><div style="font-size:12px;color:var(--paper2);margin-bottom:4px"><b>食材：</b>' + r.ingredients + '</div><div style="font-size:12px;color:var(--paper2);margin-bottom:4px"><b>做法：</b>' + r.method + '</div><div style="font-size:12px;color:var(--success)"><b>功效：</b>' + r.effect + '</div></div>';
    });
    html2 += '</div>';
    // 功法
    html2 += '<div style="background:rgba(201,168,76,0.06);border-left:3px solid var(--gold);padding:16px;border-radius:0 10px 10px 0;margin-bottom:14px"><div style="font-size:15px;color:var(--gold);font-weight:bold;margin-bottom:12px">🧘 功法锻炼</div>';
    let qigong = (TZ_DATA.qigongMethods || []).filter(function(q) { return q.constitutions.indexOf(cons2.name.replace('质','')) >= 0; });
    if (qigong.length === 0) qigong = (TZ_DATA.qigongMethods || []).slice(0, 3);
    qigong.slice(0, 3).forEach(function(q) {
      html2 += '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px;margin-bottom:8px"><div style="font-size:14px;color:var(--gold);font-weight:bold;margin-bottom:4px">' + q.name + ' <span style="font-size:12px;color:var(--muted)">（' + q.duration + '）</span></div><div style="font-size:12px;color:var(--paper2)">' + q.benefit + '</div></div>';
    });
    html2 += '</div>';
    // 起居
    html2 += '<div style="background:rgba(52,152,219,0.06);border-left:3px solid var(--cyan2);padding:16px;border-radius:0 10px 10px 0;margin-bottom:14px"><div style="font-size:15px;color:var(--cyan2);font-weight:bold;margin-bottom:12px">🏠 起居调摄</div>';
    html2 += '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px;margin-bottom:8px"><div style="font-size:13px;color:var(--gold);font-weight:bold;margin-bottom:4px">养生原则</div><div style="font-size:12px;color:var(--paper2)">' + cons2.yangsheng + '</div></div>';
    html2 += '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px;margin-bottom:8px"><div style="font-size:13px;color:var(--gold);font-weight:bold;margin-bottom:4px">作息建议</div><div style="font-size:12px;color:var(--paper2)">建议早睡早起，保证充足睡眠。根据体质特点调整作息，' + cons2.desc + '。</div></div>';
    html2 += '</div>';
    // 名方
    let prescriptions = (TZ_DATA.famousPrescriptions || []).filter(function(p) { return p.constitutions.indexOf(cons2.name.replace('质','')) >= 0; });
    if (prescriptions.length > 0) {
      html2 += '<div style="background:rgba(201,168,76,0.06);border-left:3px solid var(--gold);padding:16px;border-radius:0 10px 10px 0;margin-bottom:14px"><div style="font-size:15px;color:var(--gold);font-weight:bold;margin-bottom:12px">📜 名医名方</div>';
      prescriptions.slice(0, 3).forEach(function(p) {
        html2 += '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px;margin-bottom:8px"><div style="font-size:14px;color:var(--gold);font-weight:bold;margin-bottom:4px">' + p.name + ' <span style="font-size:11px;color:var(--muted)">' + p.source + '</span></div><div style="font-size:12px;color:var(--paper2);margin-bottom:4px"><b>组成：</b>' + p.composition + '</div><div style="font-size:12px;color:var(--success)"><b>功效：</b>' + p.effect + '</div></div>';
      });
      html2 += '</div>';
    }
    // Disclaimer
    html2 += '<div style="background:rgba(231,76,60,0.04);border:1px solid rgba(231,76,60,0.15);border-radius:8px;padding:12px 16px;margin-top:12px"><div style="font-size:12px;color:var(--cinn2);line-height:1.6">⚠️ <b>温馨提示：</b>本方案根据体质特征本地生成，仅供养生保健参考。如有特定疾病或服药中，请咨询中医师调整方案。</div></div>';
    html2 += '</div>';
    result.innerHTML = html2;
  }).catch(function(err){ showToast('AI服务暂不可用，请稍后重试'); });
}

function tzRenderQigong(){
  let list=TZ_DATA.qigongMethods||[];
  let html=list.map(function(q){
    return '<div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px;padding:18px">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">'+
        '<span style="font-size:16px;color:var(--gold);font-weight:bold">'+q.name+'</span>'+
        '<div style="display:flex;gap:6px">'+
          '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:rgba(201,168,76,0.1);color:var(--gold2)">'+q.type+'</span>'+
          '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:rgba(0,0,0,0.2);color:var(--muted)">'+q.difficulty+'</span>'+
          '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:rgba(45,106,79,0.1);color:var(--success)">'+q.duration+'</span>'+
        '</div>'+
      '</div>'+
      '<div style="font-size:13px;color:var(--paper2);line-height:1.7;margin-bottom:10px">'+q.desc+'</div>'+
      '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px;margin-bottom:10px"><div style="font-size:12px;color:var(--gold);margin-bottom:6px">📋 练习步骤</div><div style="font-size:12px;color:var(--paper);line-height:1.8;white-space:pre-line">'+q.steps+'</div></div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'+
        '<div style="background:rgba(45,106,79,0.06);border-radius:6px;padding:10px"><div style="font-size:11px;color:var(--success);margin-bottom:4px">✅ 功效</div><div style="font-size:12px;color:var(--paper2)">'+q.benefit+'</div></div>'+
        '<div style="background:rgba(231,76,60,0.06);border-radius:6px;padding:10px"><div style="font-size:11px;color:var(--cinn2);margin-bottom:4px">⚠️ 注意</div><div style="font-size:12px;color:var(--paper2)">'+q.caution+'</div></div>'+
      '</div>'+
      '<div style="display:flex;gap:4px;flex-wrap:wrap">'+q.constitutions.map(function(c){return '<span style="font-size:11px;padding:2px 8px;background:rgba(201,168,76,0.08);border:1px solid var(--border);border-radius:10px;color:var(--gold2)">适合：'+c+'</span>';}).join('')+'</div>'+
    '</div>';
  }).join('');
  let el=document.getElementById('tzQigongList');
  if(el) el.innerHTML=html;

  // Also render exercise filters and list
  let exFilters=['全部','有氧运动','力量训练','柔韧训练','呼吸训练'];
  let fhtml=exFilters.map(function(f,i){
    return '<button onclick="tzFilterExercise(\''+(i===0?'all':f)+'\')" style="padding:6px 14px;border:1px solid var(--border);border-radius:8px;background:'+(i===0?'var(--title)':'rgba(255,255,255,0.04)')+';color:'+(i===0?'var(--paper)':'var(--muted)')+';cursor:pointer;font-size:12px;font-family:inherit">'+f+'</button>';
  }).join('');
  let fel=document.getElementById('tzExFilters');
  if(fel) fel.innerHTML=fhtml;
  if(!document.getElementById('tzExerciseList').innerHTML) tzRenderExercise('all');
}

function tzRenderPrescriptions(){
  rxRenderDoctorsByDynasty();
  rxRenderHeritage();
  rxRenderNihonsha();
}

// ===== 名医名方数据库 =====
let RX_DOCTORS_DATA = {
  dynasties: [
    {
      dynasty: '汉代',
      doctors: [
        {
          name: '张仲景', era: '东汉末年', school: '伤寒学派',
          book: '《伤寒杂病论》',
          thought: '创立六经辨证体系，确立辨证论治原则，被后世尊为"医圣"。强调诊病须脉证合参，方证对应。',
          prescriptions: [
            {name:'桂枝汤', composition:'桂枝、芍药、生姜、大枣、炙甘草', effect:'解肌发表，调和营卫', indication:'外感风寒表虚证，头痛发热、汗出恶风', usage:'水煎服，温覆取微汗', contraindication:'表实无汗者忌用', symptoms:'头痛,发热,汗出,恶风,感冒'},
            {name:'麻黄汤', composition:'麻黄、桂枝、杏仁、炙甘草', effect:'发汗解表，宣肺平喘', indication:'外感风寒表实证，恶寒发热、无汗而喘', usage:'水煎服，温覆取汗', contraindication:'表虚自汗者忌用', symptoms:'发热,恶寒,无汗,咳喘,感冒'},
            {name:'白虎汤', composition:'石膏、知母、粳米、炙甘草', effect:'清热生津', indication:'阳明经证，大热、大汗、大渴、脉洪大', usage:'水煎服', contraindication:'表证未解或阴虚发热者忌用', symptoms:'高热,口渴,出汗,烦躁'},
            {name:'小柴胡汤', composition:'柴胡、黄芩、人参、半夏、炙甘草、生姜、大枣', effect:'和解少阳', indication:'少阳证，寒热往来、胸胁苦满、口苦咽干', usage:'水煎服', contraindication:'肝阳上亢者慎用', symptoms:'寒热往来,口苦,咽干,目眩,胸胁胀满'},
            {name:'承气汤系列', composition:'大承气汤：大黄、芒硝、枳实、厚朴', effect:'峻下热结', indication:'阳明腑实证，大便秘结、腹痛拒按', usage:'水煎服，得下即停服', contraindication:'孕妇禁用，脾胃虚寒者忌用', symptoms:'便秘,腹痛,腹胀,发热'}
          ]
        },
        {
          name: '华佗', era: '东汉末年', school: '外科鼻祖',
          book: '《中藏经》（传）',
          thought: '精于方药、针灸、外科手术，发明麻沸散用于麻醉，创五禽戏导引功法。提倡"治未病"理念。',
          prescriptions: [
            {name:'麻沸散', composition:'蔓陀罗花、生草乌、香白芷等（传方）', effect:'麻醉止痛', indication:'外科手术麻醉', usage:'内服', contraindication:'非手术不可用', symptoms:'疼痛,手术'},
            {name:'五禽戏', composition:'虎、鹿、熊、猿、鸟五种动作', effect:'强身健体，疏通经络', indication:'养生保健，慢性病康复', usage:'每日练习', contraindication:'急性病期不宜', symptoms:'体虚,乏力,养生'},
            {name:'华佗夹脊穴', composition:'督脉旁开0.5寸，第一胸椎至第五腰椎', effect:'调理脏腑，疏通经络', indication:'腰背痛、内脏疾患', usage:'针刺或按摩', contraindication:'孕妇腰骶部慎用', symptoms:'腰痛,背痛,脏腑失调'}
          ]
        }
      ]
    },
    {
      dynasty: '魏晋南北朝',
      doctors: [
        {
          name: '皇甫谧', era: '魏晋', school: '针灸学派',
          book: '《针灸甲乙经》',
          thought: '系统整理古代针灸文献，编成《针灸甲乙经》，是中国现存最早的针灸学专著，奠定针灸学基础。',
          prescriptions: [
            {name:'皇甫谧针灸方', composition:'按经络穴位选穴，以督脉、膀胱经为主', effect:'疏通经络，调和气血', indication:'各类痛症、脏腑病', usage:'针刺或艾灸', contraindication:'孕妇特定穴位禁针', symptoms:'头痛,腰痛,关节痛,麻木'},
            {name:'酸枣仁汤（原方）', composition:'酸枣仁、甘草、知母、茯苓、川芎', effect:'养血安神，清热除烦', indication:'虚劳虚烦不得眠', usage:'水煎服', contraindication:'实热证不宜', symptoms:'失眠,心烦,多梦,虚劳'}
          ]
        },
        {
          name: '葛洪', era: '东晋', school: '炼丹道家',
          book: '《肘后备急方》《抱朴子》',
          thought: '著有《肘后备急方》，收录大量简便验方，青蒿截疟的记载启发屠呦呦发现青蒿素。',
          prescriptions: [
            {name:'青蒿截疟方', composition:'青蒿', effect:'截疟清热', indication:'疟疾寒热往来', usage:'水煎服或鲜汁', contraindication:'脾胃虚寒者慎用', symptoms:'疟疾,发热,寒战'}
          ]
        }
      ]
    },
    {
      dynasty: '宋代',
      doctors: [
        {
          name: '钱乙', era: '北宋', school: '儿科鼻祖',
          book: '《小儿药证直诀》',
          thought: '中国儿科之父，首创小儿五脏辨证体系。将六味地黄丸化裁用于儿科，奠定滋阴补肾法基础。',
          prescriptions: [
            {name:'六味地黄丸', composition:'熟地黄、山茱萸、山药、泽泻、茯苓、牡丹皮', effect:'滋阴补肾', indication:'肾阴不足证，腰膝酸软、头晕耳鸣、小儿发育不良', usage:'制丸服', contraindication:'脾虚泄泻者慎用', symptoms:'腰膝酸软,头晕,耳鸣,盗汗,阴虚'},
            {name:'泻白散', composition:'地骨皮、桑白皮、甘草、粳米', effect:'清泻肺热，止咳平喘', indication:'肺热咳嗽证', usage:'水煎服', contraindication:'风寒咳嗽者不宜', symptoms:'咳嗽,气喘,发热,肺热'},
            {name:'七味白术散', composition:'人参、白术、茯苓、甘草、藿香、木香、葛根', effect:'健脾止泻', indication:'小儿脾虚泄泻', usage:'水煎服', contraindication:'湿热泻者不宜', symptoms:'腹泻,食欲不振,小儿消化不良'}
          ]
        },
        {
          name: '陈自明', era: '南宋', school: '妇科大家',
          book: '《妇人良方大全》',
          thought: '系统整理宋代以前妇产科经验，对月经病、带下病、妊娠病有深入论述。',
          prescriptions: [
            {name:'良方温经汤', composition:'当归、川芎、芍药、桂心、莪术、牡丹皮、人参、甘草、牛膝', effect:'温经散寒，祛瘀养血', indication:'寒凝血瘀之月经不调', usage:'水煎服', contraindication:'血热者不宜', symptoms:'月经不调,痛经,少腹冷痛'}
          ]
        }
      ]
    },
    {
      dynasty: '唐代',
      doctors: [
        {
          name: '孙思邈', era: '唐朝', school: '综合学派',
          book: '《备急千金要方》《千金翼方》',
          thought: '被尊为"药王"，重视医德，提出"大医精诚"。强调食疗为先，药疗为后，收集大量民间验方。',
          prescriptions: [
            {name:'独活寄生汤', composition:'独活、桑寄生、杜仲、牛膝、细辛、秦艽、茯苓、肉桂、防风、川芎、人参、甘草、当归、芍药、干地黄', effect:'祛风湿，止痹痛，益肝肾，补气血', indication:'痹证日久，肝肾两虚，腰膝疼痛', usage:'水煎服', contraindication:'孕妇慎用', symptoms:'腰痛,膝痛,关节痛,风湿,麻木'},
            {name:'温胆汤', composition:'半夏、竹茹、枳实、陈皮、茯苓、甘草', effect:'理气化痰，清胆和胃', indication:'胆郁痰扰证，虚烦不眠、呕吐呃逆', usage:'水煎服', contraindication:'寒痰者不宜', symptoms:'失眠,眩晕,呕吐,心悸,胆怯'},
            {name:'犀角地黄汤', composition:'水牛角（代犀角）、生地黄、芍药、牡丹皮', effect:'清热解毒，凉血散瘀', indication:'热入血分证，吐血衄血、斑色紫黑', usage:'水煎服', contraindication:'阳虚失血者忌用', symptoms:'出血,发热,斑疹,神昏'},
            {name:'苇茎汤', composition:'苇茎、薏苡仁、冬瓜仁、桃仁', effect:'清肺化痰，逐瘀排脓', indication:'肺痈，咳吐腥臭脓血痰', usage:'水煎服', contraindication:'孕妇慎用', symptoms:'咳嗽,胸痛,吐脓痰,肺痈'}
          ]
        }
      ]
    },
    {
      dynasty: '金元时期',
      doctors: [
        {
          name: '刘完素', era: '金朝', school: '寒凉派（河间学派）',
          book: '《素问玄机原病式》《宣明论方》',
          thought: '倡"六气皆从火化"论，善用寒凉药物，开创金元四大家之寒凉派。认为火热是导致疾病的重要因素。',
          prescriptions: [
            {name:'防风通圣散', composition:'防风、荆芥、连翘、麻黄、薄荷、川芎、当归、白芍、白术、栀子、大黄、芒硝、石膏、黄芩、桔梗、甘草、滑石', effect:'疏风解表，清热通便', indication:'风热壅盛，表里俱实证', usage:'水煎服或制丸', contraindication:'孕妇慎用，脾胃虚寒者忌', symptoms:'感冒,便秘,头痛,咽痛,风热'},
            {name:'凉膈散', composition:'大黄、芒硝、栀子、黄芩、连翘、薄荷、甘草', effect:'泻火通便，清上泄下', indication:'上中二焦邪郁生热证', usage:'水煎服', contraindication:'孕妇忌用', symptoms:'口渴,咽痛,便秘,烦躁,发热'}
          ]
        },
        {
          name: '张从正', era: '金朝', school: '攻邪派',
          book: '《儒门事亲》',
          thought: '主张"治病重在驱邪，邪去正自安"，善用汗、吐、下三法攻邪。认为补法应慎用，邪去即是补。',
          prescriptions: [
            {name:'禹功散', composition:'黑牵牛、茴香', effect:'逐水通便，行气消肿', indication:'水湿内停，水肿胀满', usage:'姜汁调服', contraindication:'孕妇禁用，体虚者慎用', symptoms:'水肿,腹胀,便秘'},
            {name:'木香槟榔丸', composition:'木香、槟榔、青皮、陈皮、莪术、黄连、黄柏、大黄、香附、牵牛', effect:'行气导滞，泻热通便', indication:'痢疾，食积', usage:'制丸服', contraindication:'孕妇禁用', symptoms:'痢疾,腹痛,腹胀,便秘'}
          ]
        },
        {
          name: '李杲（李东垣）', era: '金朝', school: '补土派（脾胃派）',
          book: '《脾胃论》《兰室秘藏》',
          thought: '提出"内伤脾胃，百病由生"，重视脾胃在发病中的作用，善用升阳益气法。创立甘温除热法。',
          prescriptions: [
            {name:'补中益气汤', composition:'黄芪、人参、白术、炙甘草、当归、陈皮、升麻、柴胡', effect:'补中益气，升阳举陷', indication:'脾胃气虚下陷证，内脏下垂、久泻脱肛', usage:'水煎服', contraindication:'阴虚火旺者慎用', symptoms:'乏力,气短,脱肛,内脏下垂,便溏'},
            {name:'升阳益胃汤', composition:'黄芪、半夏、人参、炙甘草、独活、防风、白芍、羌活、橘皮、茯苓、柴胡、泽泻、白术、黄连', effect:'益气升阳，清热除湿', indication:'脾胃气虚，湿热内停', usage:'水煎服', contraindication:'阴虚者慎用', symptoms:'乏力,食欲不振,便溏,体重减轻'},
            {name:'生脉散', composition:'人参、麦冬、五味子', effect:'益气生津，敛阴止汗', indication:'气阴两虚证，气短自汗、口干舌燥', usage:'水煎服', contraindication:'外感未解者不宜', symptoms:'气短,自汗,口干,心悸,乏力'}
          ]
        },
        {
          name: '朱震亨（朱丹溪）', era: '元朝', school: '滋阴派',
          book: '《格致余论》《丹溪心法》',
          thought: '提出"阳常有余，阴常不足"论，强调滋阴降火。认为相火妄动为致病之源，主张节欲保精。',
          prescriptions: [
            {name:'大补阴丸', composition:'黄柏、知母、熟地黄、龟板', effect:'滋阴降火', indication:'阴虚火旺证，骨蒸潮热、盗汗遗精', usage:'制丸服', contraindication:'脾胃虚寒者忌用', symptoms:'潮热,盗汗,遗精,腰膝酸软,阴虚'},
            {name:'保和丸', composition:'山楂、神曲、半夏、茯苓、陈皮、连翘、莱菔子', effect:'消食和胃', indication:'食积证，脘腹胀满、嗳腐吞酸', usage:'制丸服', contraindication:'脾虚食少者不宜久服', symptoms:'腹胀,嗳气,吞酸,食欲不振,食积'},
            {name:'越鞠丸', composition:'香附、川芎、苍术、神曲、栀子', effect:'行气解郁', indication:'六郁证，气、血、痰、火、湿、食诸郁', usage:'制丸服', contraindication:'阴虚火旺者慎用', symptoms:'胸胁胀闷,脘腹胀痛,饮食不消'}
          ]
        }
      ]
    },
    {
      dynasty: '明代',
      doctors: [
        {
          name: '李时珍', era: '明朝', school: '本草学派',
          book: '《本草纲目》《濒湖脉学》',
          thought: '历时27年编成《本草纲目》，收药1892种，为中药学集大成之作。重视药物考证与临床验证。',
          prescriptions: [
            {name:'濒湖白花蛇酒', composition:'白花蛇、羌活、当归、天麻、秦艽、五加皮、防风', effect:'祛风通络，活血止痛', indication:'中风偏瘫、风湿痹痛', usage:'浸酒服', contraindication:'孕妇忌用，阴虚血燥者慎', symptoms:'中风,半身不遂,风湿,关节痛'},
            {name:'李时珍治咳方', composition:'款冬花、紫菀、百部、生姜', effect:'润肺止咳化痰', indication:'久咳不止', usage:'水煎服', contraindication:'肺热咳嗽者加减', symptoms:'咳嗽,久咳,痰多'}
          ]
        },
        {
          name: '张景岳（张介宾）', era: '明朝', school: '温补学派',
          book: '《景岳全书》《类经》',
          thought: '提出"阳非有余，阴常不足"论，善用熟地黄，人称"张熟地"。重视温补真阴真阳。',
          prescriptions: [
            {name:'左归丸', composition:'熟地黄、山药、山茱萸、枸杞子、川牛膝、菟丝子、鹿角胶、龟板胶', effect:'滋阴补肾，填精益髓', indication:'真阴不足证，腰酸腿软、自汗盗汗', usage:'制丸服', contraindication:'脾虚泄泻者慎用', symptoms:'腰酸,腿软,盗汗,遗精,头晕'},
            {name:'右归丸', composition:'熟地黄、山药、山茱萸、枸杞子、杜仲、菟丝子、附子、肉桂、当归、鹿角胶', effect:'温补肾阳，填精止遗', indication:'肾阳不足证，畏寒肢冷、阳痿滑精', usage:'制丸服', contraindication:'阴虚火旺者忌用', symptoms:'畏寒,肢冷,阳痿,遗精,腰膝冷痛'},
            {name:'金水六君煎', composition:'当归、熟地黄、陈皮、半夏、茯苓、炙甘草', effect:'滋养肺肾，祛痰止咳', indication:'肺肾阴虚，湿痰内停', usage:'水煎服', contraindication:'外感咳嗽者不宜', symptoms:'咳嗽,痰多,腰酸,阴虚'}
          ]
        },
        {
          name: '吴又可（吴有性）', era: '明末', school: '温疫学派',
          book: '《温疫论》',
          thought: '创立温疫学说，提出"戾气"致病论，认为温疫由特殊致病物质通过口鼻侵入人体。',
          prescriptions: [
            {name:'达原饮', composition:'槟榔、厚朴、草果、知母、芍药、黄芩、甘草', effect:'开达膜原，辟秽化浊', indication:'温疫初起，憎寒发热', usage:'水煎服', contraindication:'无湿浊者不宜', symptoms:'发热,恶寒,胸闷,温疫'}
          ]
        }
      ]
    },
    {
      dynasty: '清代',
      doctors: [
        {
          name: '叶天士（叶桂）', era: '清朝', school: '温病学派',
          book: '《温热论》《临证指南医案》',
          thought: '创立卫气营血辨证体系，为温病学派奠基人。善用轻清灵动之品，用药精简。',
          prescriptions: [
            {name:'银翘散', composition:'金银花、连翘、薄荷、牛蒡子、桔梗、淡豆豉、淡竹叶、芦根、荆芥穗、甘草', effect:'辛凉透表，清热解毒', indication:'温病初起，发热微恶风寒、口渴', usage:'水煎服', contraindication:'风寒感冒者不宜', symptoms:'发热,咽痛,咳嗽,口渴,风热感冒'},
            {name:'桑菊饮', composition:'桑叶、菊花、杏仁、连翘、薄荷、桔梗、甘草、芦根', effect:'疏风清热，宣肺止咳', indication:'风温初起，咳嗽、身热不甚', usage:'水煎服', contraindication:'风寒咳嗽者不宜', symptoms:'咳嗽,发热,口渴,咽痛'}
          ]
        },
        {
          name: '吴鞠通（吴瑭）', era: '清朝', school: '温病学派',
          book: '《温病条辨》',
          thought: '创立三焦辨证体系，完善温病学说。提出"治上焦如羽，治中焦如衡，治下焦如权"。',
          prescriptions: [
            {name:'桑杏汤', composition:'桑叶、杏仁、沙参、象贝、豆豉、栀子皮、梨皮', effect:'清宣温燥，润肺止咳', indication:'外感温燥证，头痛身热、干咳无痰', usage:'水煎服', contraindication:'风寒咳嗽者不宜', symptoms:'干咳,发热,口渴,咽干'},
            {name:'增液汤', composition:'玄参、麦冬、细生地', effect:'增液润燥', indication:'阳明温病，津液不足，大便秘结', usage:'水煎服', contraindication:'脾虚便溏者不宜', symptoms:'便秘,口干,阴虚'},
            {name:'安宫牛黄丸', composition:'牛黄、郁金、犀角（水牛角代）、黄连、黄芩、栀子、朱砂、雄黄、冰片、麝香、珍珠', effect:'清热解毒，豁痰开窍', indication:'热病邪陷心包，高热昏迷', usage:'化服', contraindication:'孕妇禁用，寒闭者忌用', symptoms:'高热,昏迷,惊厥,中风'}
          ]
        },
        {
          name: '王清任', era: '清朝', school: '活血化瘀派',
          book: '《医林改错》',
          thought: '重视解剖，纠正前人脏腑之误。善用活血化瘀法，创制多个逐瘀汤方。',
          prescriptions: [
            {name:'血府逐瘀汤', composition:'桃仁、红花、当归、生地黄、川芎、赤芍、牛膝、桔梗、柴胡、枳壳、甘草', effect:'活血化瘀，行气止痛', indication:'胸中血瘀证，胸痛头痛、失眠多梦', usage:'水煎服', contraindication:'孕妇禁用', symptoms:'胸痛,头痛,失眠,心痛,血瘀'},
            {name:'补阳还五汤', composition:'黄芪、当归尾、赤芍、地龙、川芎、桃仁、红花', effect:'补气活血通络', indication:'中风后遗症，半身不遂、口眼歪斜', usage:'水煎服', contraindication:'阴虚血热者慎用', symptoms:'中风,半身不遂,口眼歪斜,气虚血瘀'},
            {name:'少腹逐瘀汤', composition:'小茴香、干姜、延胡索、没药、当归、川芎、官桂、赤芍、蒲黄、五灵脂', effect:'活血祛瘀，温经止痛', indication:'少腹瘀血证，月经不调、痛经', usage:'水煎服', contraindication:'孕妇禁用', symptoms:'痛经,月经不调,少腹痛,血瘀'}
          ]
        },
        {
          name: '唐宗海', era: '清末', school: '中西医结合先驱',
          book: '《血证论》',
          thought: '中西医汇通派早期代表，系统论述血证诊治，提出止血、消瘀、宁血、补血四法。',
          prescriptions: [
            {name:'十灰散', composition:'大蓟、小蓟、荷叶、侧柏叶、白茅根、茜草根、栀子、大黄、牡丹皮、棕榈皮', effect:'凉血止血', indication:'血热妄行之各种出血', usage:'研末服', contraindication:'虚寒性出血不宜', symptoms:'吐血,咯血,衄血,便血,出血'}
          ]
        }
      ]
    },
    {
      dynasty: '近现代',
      doctors: [
        {
          name: '张锡纯', era: '清末民初', school: '中西汇通派',
          book: '《医学衷中参西录》',
          thought: '中西医汇通派代表，主张"衷中参西"，以中医理论为本，参用西医知识。善用石膏、山药等药。',
          prescriptions: [
            {name:'镇肝熄风汤', composition:'怀牛膝、生赭石、生龙骨、生牡蛎、生龟板、生白芍、玄参、天冬、川楝子、生麦芽、茵陈、甘草', effect:'镇肝息风，滋阴潜阳', indication:'肝阳上亢，气血逆乱之中风', usage:'水煎服', contraindication:'痰湿盛者慎用', symptoms:'中风,头痛,眩晕,面赤'},
            {name:'玉液汤', composition:'生山药、生黄芪、知母、生鸡内金、葛根、五味子、天花粉', effect:'益气滋阴，固肾止渴', indication:'消渴证（糖尿病），气阴两虚', usage:'水煎服', contraindication:'湿热证不宜', symptoms:'口渴,多饮,多尿,消渴,糖尿病'},
            {name:'活络效灵丹', composition:'当归、丹参、生明乳香、生明没药', effect:'活血祛瘀，通络止痛', indication:'气血凝滞，心腹疼痛、腿臂疼痛', usage:'水煎服', contraindication:'孕妇禁用', symptoms:'心痛,腹痛,关节痛,血瘀'}
          ]
        },
        {
          name: '施今墨', era: '民国至新中国', school: '北京四大名医',
          book: '《施今墨临床经验集》',
          thought: '北京四大名医之一，善用对药（药对），重视脾胃调理，提倡中西医结合。',
          prescriptions: [
            {name:'施氏调胃方', composition:'党参、白术、茯苓、炙甘草、半夏、陈皮、木香、砂仁', effect:'健脾和胃，理气止痛', indication:'脾胃虚弱，脘腹胀痛', usage:'水煎服', contraindication:'胃阴虚者加减', symptoms:'胃痛,腹胀,食欲不振,乏力'},
            {name:'施氏降压方', composition:'天麻、钩藤、石决明、牛膝、杜仲、黄芩、栀子', effect:'平肝潜阳，清热降压', indication:'肝阳上亢型高血压', usage:'水煎服', contraindication:'低血压者不宜', symptoms:'头痛,眩晕,高血压,面赤'}
          ]
        },
        {
          name: '蒲辅周', era: '新中国', school: '时方派',
          book: '《蒲辅周医案》《蒲辅周医疗经验》',
          thought: '擅治温病与内科杂病，重视正气护养，用药轻灵，提倡"汗而毋伤，下而毋损"。',
          prescriptions: [
            {name:'蒲氏宣透方', composition:'银花、连翘、薄荷、牛蒡子、桔梗、芦根', effect:'轻宣透表，清热解毒', indication:'外感风热，温病初起', usage:'水煎服', contraindication:'风寒者不宜', symptoms:'发热,咽痛,咳嗽,感冒'}
          ]
        },
        {
          name: '邓铁涛', era: '新中国', school: '岭南学派',
          book: '《邓铁涛医学文集》',
          thought: '岭南医学代表，擅治心血管疾病，提倡"脾胃为后天之本"，研制冠心方治疗冠心病。',
          prescriptions: [
            {name:'邓氏冠心方', composition:'党参、麦冬、五味子、丹参、赤芍、红花', effect:'益气养阴，活血通脉', indication:'冠心病，气阴两虚兼血瘀', usage:'水煎服', contraindication:'出血倾向者慎用', symptoms:'胸痛,心悸,气短,冠心病,心痛'},
            {name:'邓氏治重症肌无力方', composition:'黄芪、党参、白术、当归、升麻、柴胡、陈皮、炙甘草', effect:'健脾益气升阳', indication:'重症肌无力，脾胃气虚', usage:'水煎服', contraindication:'阴虚火旺者加减', symptoms:'乏力,肌肉无力,眼睑下垂'}
          ]
        }
      ]
    }
  ]
};

function rxRenderDoctorsByDynasty(){
  let container=document.getElementById('rxDoctorsByDynasty');
  if(!container) return;
  let html='';
  RX_DOCTORS_DATA.dynasties.forEach(function(dyn,idx){
    let dynastyId='rxDyn-'+idx;
    html+='<ml-tap class="bazi-module-title'+(idx>0?' collapsed':'')+'" variant="card" role="button" tabindex="0" onclick="toggleBaziModule(this)">🏥 '+dyn.dynasty+'名医 ('+dyn.doctors.length+'位) <span class="toggle-icon">▼</span></ml-tap>';
    html+='<div class="bazi-module-body'+(idx>0?' collapsed':'')+'" style="padding:16px">';
    dyn.doctors.forEach(function(doc,dIdx){
      let docId='rxDoc-'+idx+'-'+dIdx;
      html+='<div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px">';
      html+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
      html+='<span style="font-size:16px;color:var(--gold);font-weight:bold">👨‍⚕️ '+doc.name+'</span>';
      html+='<span style="font-size:11px;padding:2px 10px;border-radius:10px;background:rgba(201,168,76,0.1);color:var(--gold2)">'+doc.school+'</span>';
      html+='</div>';
      html+='<div style="font-size:12px;color:var(--paper3);margin-bottom:6px">'+doc.era+' · 著作：'+doc.book+'</div>';
      html+='<div style="font-size:13px;color:var(--paper);line-height:1.7;margin-bottom:12px;background:rgba(255,255,255,0.02);border-radius:8px;padding:10px">💡 '+doc.thought+'</div>';
      html+='<div style="font-size:13px;color:var(--gold);margin-bottom:8px;font-weight:bold">代表名方：</div>';
      doc.prescriptions.forEach(function(rx){
        html+='<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px;margin-bottom:8px;border-left:3px solid rgba(201,168,76,0.3)">';
        html+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">';
        html+='<span style="font-size:14px;color:var(--gold);font-weight:bold">💊 '+rx.name+'</span>';
        html+='</div>';
        html+='<div style="font-size:12px;color:var(--paper2);margin-bottom:4px"><b style="color:var(--gold2)">组成：</b>'+rx.composition+'</div>';
        html+='<div style="font-size:12px;color:var(--paper2);margin-bottom:4px"><b style="color:var(--success)">功效：</b>'+rx.effect+'</div>';
        html+='<div style="font-size:12px;color:var(--paper2);margin-bottom:4px"><b style="color:var(--gold2)">主治：</b>'+rx.indication+'</div>';
        html+='<div style="font-size:12px;color:var(--paper2);margin-bottom:4px"><b style="color:var(--paper3)">用法：</b>'+rx.usage+'</div>';
        html+='<div style="font-size:12px;color:var(--cinn2);margin-bottom:4px"><b>禁忌：</b>'+rx.contraindication+'</div>';
        html+='<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">';
        rx.symptoms.split(',').forEach(function(s){
          html+='<span style="font-size:10px;padding:1px 6px;background:rgba(201,168,76,0.08);border:1px solid var(--border);border-radius:8px;color:var(--gold2)">'+s+'</span>';
        });
        html+='</div>';
        html+='</div>';
      });
      html+='</div>';
    });
    html+='</div>';
  });
  container.innerHTML=html;
}

function rxGetAllPrescriptions(){
  let all=[];
  RX_DOCTORS_DATA.dynasties.forEach(function(dyn){
    dyn.doctors.forEach(function(doc){
      doc.prescriptions.forEach(function(rx){
        rx._doctor=doc.name;
        rx._dynasty=dyn.dynasty;
        all.push(rx);
      });
    });
  });
  return all;
}

function rxSearchPrescriptions(){
  let input=document.getElementById('rxSearchInput');
  let resultDiv=document.getElementById('rxSearchResult');
  let dynDiv=document.getElementById('rxDoctorsByDynasty');
  if(!input) return;
  let q=input.value.trim().toLowerCase();
  if(!q){
    resultDiv.style.display='none';
    resultDiv.innerHTML='';
    dynDiv.style.display='block';
    return;
  }
  let allRx=rxGetAllPrescriptions();
  let matched=allRx.filter(function(rx){
    let hay=(rx.name+' '+rx.composition+' '+rx.effect+' '+rx.indication+' '+rx.symptoms+' '+rx._doctor+' '+rx._dynasty).toLowerCase();
    return hay.indexOf(q)>=0;
  });
  dynDiv.style.display='none';
  resultDiv.style.display='block';
  if(matched.length===0){
    resultDiv.innerHTML='<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px">未找到匹配的方剂</div>';
    return;
  }
  let html='<div style="font-size:13px;color:var(--gold);margin-bottom:12px">🔍 找到 '+matched.length+' 个匹配方剂：</div>';
  matched.forEach(function(rx){
    html+='<div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px;border-left:3px solid rgba(201,168,76,0.3)">';
    html+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">';
    html+='<span style="font-size:14px;color:var(--gold);font-weight:bold">💊 '+rx.name+'</span>';
    html+='<span style="font-size:11px;color:var(--paper3)">'+rx._dynasty+' · '+rx._doctor+'</span>';
    html+='</div>';
    html+='<div style="font-size:12px;color:var(--paper2);margin-bottom:4px"><b style="color:var(--gold2)">组成：</b>'+rx.composition+'</div>';
    html+='<div style="font-size:12px;color:var(--paper2);margin-bottom:4px"><b style="color:var(--success)">功效：</b>'+rx.effect+'</div>';
    html+='<div style="font-size:12px;color:var(--paper2);margin-bottom:4px"><b style="color:var(--gold2)">主治：</b>'+rx.indication+'</div>';
    html+='<div style="font-size:12px;color:var(--cinn2)"><b>禁忌：</b>'+rx.contraindication+'</div>';
    html+='</div>';
  });
  resultDiv.innerHTML=html;
}

function rxClearSearch(){
  let input=document.getElementById('rxSearchInput');
  let resultDiv=document.getElementById('rxSearchResult');
  let dynDiv=document.getElementById('rxDoctorsByDynasty');
  if(input) input.value='';
  if(resultDiv){resultDiv.style.display='none';resultDiv.innerHTML='';}
  if(dynDiv) dynDiv.style.display='block';
}

// ===== 非遗中医展示 =====
let RX_HERITAGE_DATA = [
  {name:'中医针灸', batch:'第一批国家级非遗（2006年）', inheritors:'贺普仁、王雪苔等', desc:'针灸是中医药的重要代表，包括毫针刺法、灸法、拔罐等多种技术，以经络学说为理论基础。', techniques:'毫针刺法、艾灸法、拔罐法、电针法、头针、耳针、火针'},
  {name:'中医推拿', batch:'第一批国家级非遗（2006年）', inheritors:'丁季峰、严隽陶等', desc:'中医推拿又称按摩，是通过手法作用于人体体表特定部位来防治疾病的方法。', techniques:'㨰法、揉法、按法、推法、拿法、拍法、摇法、扳法'},
  {name:'中医正骨', batch:'第一批国家级非遗（2006年）', inheritors:'郭维淮、孙树椿等', desc:'中医正骨是以手法整复骨折、脱位及治疗筋伤的传统医学技术。', techniques:'正骨八法：手摸心会、拔伸牵引、旋转屈伸、提按端挤、摇摆触碰、夹挤分骨、折顶回旋、按摩推拿'},
  {name:'中药炮制技艺', batch:'第一批国家级非遗（2006年）', inheritors:'金世元、王孝涛等', desc:'中药炮制是根据中医药理论，按照辨证施治用药需要和药物自身性质，对中药进行加工处理的技术。', techniques:'炒法、炙法、煅法、煨法、蒸法、煮法、淬法、制炭法'},
  {name:'藏医药', batch:'第一批国家级非遗（2006年）', inheritors:'强巴赤列、占堆等', desc:'藏医药是藏族人民在青藏高原特殊环境下形成的医学体系，具有独特的理论体系和诊疗方法。', techniques:'望诊、触诊、问诊三诊法；尿诊；放血疗法；药浴疗法；艾灸'},
  {name:'蒙医药', batch:'第一批国家级非遗（2006年）', inheritors:'巴根那、布仁达来等', desc:'蒙医药是蒙古族传统医学，以赫依、希拉、巴达干三根学说为理论基础。', techniques:'脉诊、尿诊；放血疗法；针灸；药浴；涂擦按摩；蒙医正骨'},
  {name:'中医生命与疾病认知方法', batch:'第一批国家级非遗（2006年）', inheritors:'路志正、邓铁涛等', desc:'中医药对生命与疾病的认知体系，包括阴阳五行、脏腑经络、病因病机、辨证论治等理论。', techniques:'阴阳五行学说、脏腑经络理论、辨证论治体系、四诊合参'},
  {name:'同仁堂中医药文化', batch:'第一批国家级非遗（2006年）', inheritors:'同仁堂传承群体', desc:'北京同仁堂创建于1669年，是中药老字号代表，"炮制虽繁必不敢省人工，品味虽贵必不敢减物力"。', techniques:'中药材鉴别、炮制、制剂工艺；传统丸散膏丹制作技艺'},
  {name:'胡庆余堂中药文化', batch:'第一批国家级非遗（2006年）', inheritors:'胡庆余堂传承群体', desc:'杭州胡庆余堂由胡雪岩于1874年创建，"戒欺"为店训，是江南药王代表。', techniques:'中药炮制、丸散制作、膏方熬制；药材鉴别'},
  {name:'藏医药浴法', batch:'联合国教科文组织非遗（2018年）', inheritors:'藏族传承群体', desc:'藏医药浴法是藏医学特色疗法，将全身或局部浸泡于五味甘露药液中防治疾病。', techniques:'五味甘露药浴配方；药浴温度控制；药浴后护理'},
  {name:'太极拳', batch:'联合国教科文组织非遗（2020年）', inheritors:'陈氏、杨氏等传承群体', desc:'太极拳融合中医经络学说和阴阳哲学，是中医导引养生的重要实践。', techniques:'陈式、杨式、吴式、武式、孙式等流派；推手；站桩'},
  {name:'中医诊法', batch:'第二批国家级非遗（2008年）', inheritors:'周仲瑛、徐景藩等', desc:'中医诊法是中医获取临床信息的独特方法，包括望、闻、问、切四诊。', techniques:'望诊（望舌、望神、望色）、闻诊（听声、嗅味）、问诊（十问歌）、切诊（脉诊、按诊）'},
  {name:'中医传统制剂方法', batch:'第二批国家级非遗（2008年）', inheritors:'多种流派传承人', desc:'中药传统制剂方法包括丸、散、膏、丹、酒、露、胶、曲等剂型的制作工艺。', techniques:'蜜丸制作、水丸制作、膏药熬制、丹药炼制、药酒浸泡、露剂蒸馏'},
  {name:'维医药', batch:'第一批国家级非遗（2006年）', inheritors:'巴音克希克等', desc:'维吾尔医药是新疆维吾尔族传统医学，以四体液学说（胆液质、血液质、黏液质、黑胆液质）为理论基础。', techniques:'四体液辨证；尿诊；脉诊；草药内服；药浴；熏蒸'},
  {name:'壮医药', batch:'第一批国家级非遗（2006年）', inheritors:'黄瑾明、黄汉儒等', desc:'壮医药是壮族传统医学，以三气同步、三道两路为核心理论，善用草药和药线点灸。', techniques:'药线点灸；目诊；甲诊；草药内服外敷；药浴'},
  {name:'傣医药', batch:'第一批国家级非遗（2006年）', inheritors:'林艳芳等', desc:'傣医药是傣族传统医学，以四塔（风、火、水、土）五蕴为理论基础，具有热带医学特色。', techniques:'四塔辨证；拖擦疗法；睡药疗法；蒸药疗法；拔罐；刺血'},
  {name:'羌医药', batch:'第二批国家级非遗（2008年）', inheritors:'羌族传承群体', desc:'羌医药是羌族传统医学，以白石文化为背景，善用高原草药治疗跌打损伤和风湿病。', techniques:'羌医脉诊；草药内服外敷；熏蒸疗法；角吸疗法'}
];

function rxRenderHeritage(){
  let container=document.getElementById('rxHeritageList');
  if(!container) return;
  let html='';
  RX_HERITAGE_DATA.forEach(function(item,idx){
    let collapsed=idx>0?' collapsed':'';
    html+='<ml-tap class="bazi-module-title'+collapsed+'" onclick="toggleBaziModule(this)" variant="card" role="button" tabindex="0">🏺 '+item.name+' <span class="toggle-icon">▼</span></ml-tap>';
    html+='<div class="bazi-module-body'+collapsed+'" style="padding:16px">';
    html+='<div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:14px;margin-bottom:10px">';
    html+='<div style="font-size:12px;color:var(--gold2);margin-bottom:6px">'+item.batch+'</div>';
    html+='<div style="font-size:12px;color:var(--paper3);margin-bottom:8px">传承人：'+item.inheritors+'</div>';
    html+='<div style="font-size:13px;color:var(--paper);line-height:1.7;margin-bottom:10px">'+item.desc+'</div>';
    html+='<div style="background:rgba(45,106,79,0.06);border-radius:8px;padding:10px">';
    html+='<div style="font-size:12px;color:var(--success);margin-bottom:6px;font-weight:bold">核心技法</div>';
    html+='<div style="font-size:12px;color:var(--paper2);line-height:1.6">'+item.techniques+'</div>';
    html+='</div>';
    html+='</div>';
    html+='</div>';
  });
  container.innerHTML=html;
}

// ===== 倪海夏知识模块 =====
let RX_NIHONSHA_DATA = {
  intro: {
    name: '倪海夏（倪海厦）',
    years: '1954-2012',
    title: '美国经方派中医师，汉唐中医学院创办人',
    bio: '倪海夏，生于台湾，后赴美国行医，在佛罗里达州创办汉唐中医学院。一生致力于经方（张仲景《伤寒杂病论》方）的传承与推广，著有《人纪》系列教材，通过网络教学影响全球中医学习者。其学术思想以经方为核心，强调六经辨证，善用仲景方治疗各类疾病。'
  },
  academicFeatures: [
    '以经方为主，强调张仲景《伤寒论》《金匮要略》方的原方运用',
    '重视六经辨证体系，以太阳、阳明、少阳、太阴、少阴、厥阴为辨证纲领',
    '强调经方与时方的区别，认为经方药味少、效力专、配伍严谨',
    '善用桂枝汤系列、麻黄汤系列、承气汤系列、四逆汤系列等仲景方',
    '注重脉诊与腹诊结合，强调方证对应',
    '提倡"上工治未病"，重视预防医学'
  ],
  coreTheories: [
    {
      title: '六经辨证体系',
      content: '太阳病：表证，恶寒发热、头项强痛。代表方：桂枝汤、麻黄汤。\n阳明病：里热实证，大热大汗大渴。代表方：白虎汤、承气汤。\n少阳病：半表半里证，寒热往来、口苦咽干。代表方：小柴胡汤。\n太阴病：脾阳虚证，腹满吐利。代表方：理中汤。\n少阴病：心肾阳虚或阴虚证，脉微细但欲寐。代表方：四逆汤、黄连阿胶汤。\n厥阴病：寒热错杂证，消渴气上撞心。代表方：乌梅丸。'
    },
    {
      title: '经方与时方之区别',
      content: '经方：指张仲景《伤寒杂病论》中的方剂，药味少（多为3-7味），配伍严谨，效力专宏，历经两千年临床验证。\n时方：后世医家创制的方剂，药味较多，配伍灵活，适应面广。\n倪师认为：经方是中医的根本，初学者应先精通经方，再涉猎时方。经方方证对应明确，用之得当效如桴鼓。'
    },
    {
      title: '阴阳辨证纲领',
      content: '阳证：面色红赤、身热汗出、口渴饮冷、便秘尿赤、舌红苔黄、脉洪大数。\n阴证：面色苍白、畏寒肢冷、口不渴或喜热饮、便溏尿清、舌淡苔白、脉微细迟。\n倪师强调：阴阳是辨证的总纲，先辨阴阳，再定六经，最后选方药。阴阳辨识准确，治疗方向就不会错。'
    },
    {
      title: '上工治未病',
      content: '倪师推崇"上工治未病"理念：\n1. 在疾病未发生时，通过养生预防；\n2. 在疾病初起时，及时截断病势，防止传变；\n3. 治病时注重保护脾胃正气，避免过度攻伐；\n4. 重视情志调摄对疾病的影响；\n5. 强调睡眠、饮食、运动对健康的基石作用。'
    }
  ],
  formulaSeries: [
    {
      series: '桂枝汤系列',
      formulas: '桂枝汤（调和营卫）、桂枝加葛根汤（治项背强）、桂枝加附子汤（治漏汗不止）、桂枝加桂汤（治气上冲胸）、桂枝去芍药汤（治胸满）、小建中汤（建中补虚）',
      application: '倪师善用桂枝汤系列治疗外感风寒、营卫不和、脾胃虚弱等证。认为桂枝汤是"群方之祖"，加减变化可治百病。'
    },
    {
      series: '麻黄汤系列',
      formulas: '麻黄汤（发汗解表）、大青龙汤（外寒内热）、小青龙汤（外寒内饮）、麻杏石甘汤（宣肺清热）、麻黄附子细辛汤（太少两感）',
      application: '倪师用麻黄汤系列治疗外感风寒表实证、咳喘、风水水肿等。强调麻黄用量需谨慎，中病即止。'
    },
    {
      series: '承气汤系列',
      formulas: '大承气汤（峻下热结）、小承气汤（轻下热结）、调胃承气汤（缓下热结）、桃核承气汤（下焦蓄血）',
      application: '倪师用承气汤系列治疗阳明腑实证，强调"有故无殒"，只要辨证准确，攻下及时，可收立竿见影之效。'
    },
    {
      series: '四逆汤系列',
      formulas: '四逆汤（回阳救逆）、四逆加人参汤（回阳益气）、通脉四逆汤（破阴回阳）、真武汤（温阳利水）、附子汤（温阳祛寒）',
      application: '倪师善用四逆汤系列抢救心肾阳虚危证，认为附子是"回阳救逆第一品药"，用量需大胆而精准。'
    }
  ],
  studyPath: [
    {order:1, name:'针灸大成', desc:'先学针灸，掌握经络穴位，建立对人体的空间认知', reason:'针灸入门快，可快速建立对经络系统的理解'},
    {order:2, name:'神农本草经', desc:'学习中药学基础，掌握365味药物性味归经', reason:'了解药物特性是处方的基础'},
    {order:3, name:'黄帝内经', desc:'学习中医基础理论，理解阴阳五行、脏腑经络', reason:'理论根基决定临床高度'},
    {order:4, name:'伤寒论', desc:'学习六经辨证体系，掌握经方运用', reason:'中医临床的核心，方证对应的典范'},
    {order:5, name:'金匮要略', desc:'学习杂病诊治，补充伤寒论的内容', reason:'与伤寒论互补，构成完整的经方体系'}
  ],
  note: '以上内容为学习参考，实际用药需遵医嘱。倪海夏医师的学术思想主要基于其《人纪》系列教材和临床医案，学习者应结合经典原文和临床实践，不可盲从。'
};

function rxRenderNihonsha(){
  let container=document.getElementById('rxNihonshaContent');
  if(!container) return;
  let d=RX_NIHONSHA_DATA;
  let html='';

  // 人物介绍
  html+='<ml-tap class="bazi-module-title" onclick="toggleBaziModule(this)" variant="card" role="button" tabindex="0">👤 人物介绍 <span class="toggle-icon">▼</span></ml-tap>';
  html+='<div class="bazi-module-body" style="padding:16px">';
  html+='<div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:16px">';
  html+='<div style="font-size:18px;color:var(--gold);font-weight:bold;margin-bottom:8px">'+d.intro.name+'（'+d.intro.years+'）</div>';
  html+='<div style="font-size:13px;color:var(--gold2);margin-bottom:10px">'+d.intro.title+'</div>';
  html+='<div style="font-size:13px;color:var(--paper);line-height:1.8">'+d.intro.bio+'</div>';
  html+='</div></div>';

  // 学术特色
  html+='<ml-tap class="bazi-module-title collapsed" onclick="toggleBaziModule(this)" variant="card" role="button" tabindex="0">🎓 学术特色 <span class="toggle-icon">▼</span></ml-tap>';
  html+='<div class="bazi-module-body collapsed" style="padding:16px">';
  html+='<div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:16px">';
  d.academicFeatures.forEach(function(f){
    html+='<div style="font-size:13px;color:var(--paper);line-height:1.8;margin-bottom:8px;padding-left:16px;border-left:3px solid rgba(201,168,76,0.3)">'+f+'</div>';
  });
  html+='</div></div>';

  // 核心理论
  html+='<ml-tap class="bazi-module-title collapsed" onclick="toggleBaziModule(this)" variant="card" role="button" tabindex="0">📚 核心理论摘要 <span class="toggle-icon">▼</span></ml-tap>';
  html+='<div class="bazi-module-body collapsed" style="padding:16px">';
  d.coreTheories.forEach(function(t){
    html+='<div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:16px;margin-bottom:12px">';
    html+='<div style="font-size:15px;color:var(--gold);font-weight:bold;margin-bottom:10px">'+t.title+'</div>';
    html+='<div style="font-size:13px;color:var(--paper);line-height:1.8;white-space:pre-wrap">'+t.content+'</div>';
    html+='</div>';
  });
  html+='</div>';

  // 代表方剂运用
  html+='<ml-tap class="bazi-module-title collapsed" onclick="toggleBaziModule(this)" variant="card" role="button" tabindex="0">💊 代表方剂运用 <span class="toggle-icon">▼</span></ml-tap>';
  html+='<div class="bazi-module-body collapsed" style="padding:16px">';
  d.formulaSeries.forEach(function(fs){
    html+='<div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:16px;margin-bottom:12px">';
    html+='<div style="font-size:15px;color:var(--gold);font-weight:bold;margin-bottom:8px">'+fs.series+'</div>';
    html+='<div style="font-size:13px;color:var(--paper2);line-height:1.7;margin-bottom:8px"><b style="color:var(--gold2)">方剂：</b>'+fs.formulas+'</div>';
    html+='<div style="font-size:13px;color:var(--paper);line-height:1.7"><b style="color:var(--success)">运用：</b>'+fs.application+'</div>';
    html+='</div>';
  });
  html+='</div>';

  // 学习路径建议
  html+='<ml-tap class="bazi-module-title collapsed" onclick="toggleBaziModule(this)" variant="card" role="button" tabindex="0">📖 学习路径建议（人纪系列） <span class="toggle-icon">▼</span></ml-tap>';
  html+='<div class="bazi-module-body collapsed" style="padding:16px">';
  html+='<div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:16px">';
  html+='<div style="font-size:13px;color:var(--gold2);margin-bottom:12px">倪师建议按以下顺序学习《人纪》系列教材：</div>';
  d.studyPath.forEach(function(s){
    html+='<div style="display:flex;gap:12px;margin-bottom:12px;align-items:flex-start">';
    html+='<div style="flex-shrink:0;width:28px;height:28px;border-radius:50%;background:rgba(201,168,76,0.15);color:var(--gold);display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px">'+s.order+'</div>';
    html+='<div style="flex:1">';
    html+='<div style="font-size:14px;color:var(--gold);font-weight:bold;margin-bottom:4px">'+s.name+'</div>';
    html+='<div style="font-size:12px;color:var(--paper2);line-height:1.6;margin-bottom:4px">'+s.desc+'</div>';
    html+='<div style="font-size:12px;color:var(--success)">💡 '+s.reason+'</div>';
    html+='</div></div>';
  });
  html+='</div></div>';

  // 免责声明
  html+='<div style="background:rgba(231,76,60,0.08);border:1px solid rgba(231,76,60,0.2);border-radius:10px;padding:14px;margin-top:12px">';
  html+='<div style="font-size:12px;color:var(--cinn2);line-height:1.7">⚠️ '+d.note+'</div>';
  html+='</div>';

  container.innerHTML=html;
}

function tzRenderQuestionnaire(){
  let html='';
  TZ_DATA.questions.forEach(function(q,idx){
    html+='<div style="margin-bottom:16px;padding:14px;background:rgba(255,255,255,0.03);border-radius:8px">'+
      '<div style="font-size:14px;color:var(--text);margin-bottom:10px"><b style="color:var(--gold)">'+(idx+1)+'.</b> '+q.q+'</div>'+
      '<div style="display:flex;gap:8px">'+
      ['没有','很少','有时','经常','总是'].forEach(function(opt,oi){
        html+='<label style="flex:1;padding:8px;text-align:center;border:1px solid var(--border);border-radius:6px;cursor:pointer;font-size:12px;color:var(--muted);transition:.2s" onclick="tzSelectAnswer('+idx+','+oi+',this)">'+
          '<input type="radio" name="tzq'+idx+'" value="'+oi+'" style="display:none">'+opt+'</label>';
      }).join('')+
      '</div></div>';
    html=html.replace(/<\/div><\/div>/,'</div>');
  });
  document.getElementById('tzQuestionnaire').innerHTML=html;
  window._tzAnswers={};
}

function tzSelectAnswer(qIdx,aIdx,el){
  let siblings=el.parentNode.querySelectorAll('label');
  siblings.forEach(function(s){
    s.style.background='rgba(255,255,255,0.03)';
    s.style.color='var(--muted)';
    s.style.borderColor='var(--border)';
  });
  el.style.background='rgba(201,168,76,0.15)';
  el.style.color='var(--gold)';
  el.style.borderColor='var(--gold)';
  window._tzAnswers[qIdx]=aIdx;
}

function tzCalculateResult(){
  let answers=window._tzAnswers||{};
  let scores={};
  TZ_DATA.questions.forEach(function(q,idx){
    let a=answers[idx]||0;
    if(q.scores){
      Object.keys(q.scores).forEach(function(k){
        scores[k]=(scores[k]||0)+q.scores[k]*a;
      });
    }
  });
  let sorted=Object.keys(scores).sort(function(a,b){return scores[b]-scores[a];});
  let top=sorted[0]||'pinghe';
  let second=sorted[1]||'pinghe';
  let cons=TZ_DATA.constitutions;
  let topC=cons.find(function(c){return c.key===top;})||cons[0];
  let secondC=cons.find(function(c){return c.key===second;})||cons[0];
  window._tzLastResult={key:top,name:topC.name};

  let html='<div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px;padding:24px">'+
    '<h4 style="font-family:\'Ma Shan Zheng\',serif;font-size:22px;color:var(--gold);margin-bottom:16px;letter-spacing:3px;text-align:center">📊 您的体质分析结果</h4>'+
    '<div style="display:flex;gap:16px;justify-content:center;margin-bottom:20px;flex-wrap:wrap">'+
      '<div style="background:rgba('+parseInt(topC.color.slice(1,3),16)+','+parseInt(topC.color.slice(3,5),16)+','+parseInt(topC.color.slice(5,7),16)+',0.1);border:2px solid '+topC.color+';border-radius:12px;padding:20px 32px;text-align:center">'+
        '<div style="font-size:40px">'+topC.icon+'</div>'+
        '<div style="font-size:18px;color:'+topC.color+';font-weight:bold;margin-top:8px">主体质：'+topC.name+'</div>'+
        '<div style="font-size:13px;color:var(--paper2);margin-top:6px">'+topC.desc+'</div>'+
      '</div>'+
      '<div style="background:rgba('+parseInt(secondC.color.slice(1,3),16)+','+parseInt(secondC.color.slice(3,5),16)+','+parseInt(secondC.color.slice(5,7),16)+',0.05);border:1px solid '+secondC.color+';border-radius:12px;padding:20px 32px;text-align:center;opacity:0.8">'+
        '<div style="font-size:32px">'+secondC.icon+'</div>'+
        '<div style="font-size:16px;color:'+secondC.color+';font-weight:bold;margin-top:8px">兼体质：'+secondC.name+'</div>'+
        '<div style="font-size:12px;color:var(--paper2);margin-top:6px">'+secondC.desc+'</div>'+
      '</div>'+
    '</div>'+
    '<div style="background:rgba(201,168,76,0.06);border-left:3px solid var(--gold);padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:16px">'+
      '<div style="font-size:14px;color:var(--gold);font-weight:bold;margin-bottom:8px">🌿 养生建议</div>'+
      '<div style="font-size:14px;color:var(--text);line-height:1.8">'+topC.yangsheng+'</div>'+
    '</div>'+
    '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:16px">'+
      '<div style="font-size:13px;color:var(--paper2);margin-bottom:8px">📈 各体质得分</div>';
  sorted.forEach(function(k){
    let cc=cons.find(function(c){return c.key===k;});
    if(cc){
      let pct=Math.min(100,Math.round((scores[k]||0)/20*100));
      html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'+
        '<span style="font-size:13px;color:var(--muted);min-width:80px">'+cc.icon+' '+cc.name+'</span>'+
        '<div style="flex:1;height:8px;background:rgba(255,255,255,0.06);border-radius:4px;overflow:hidden">'+
          '<div style="width:'+pct+'%;height:100%;background:'+cc.color+';border-radius:4px"></div>'+
        '</div>'+
        '<span style="font-size:12px;color:var(--gold);min-width:30px;text-align:right">'+(scores[k]||0)+'</span>'+
      '</div>';
    }
  });
  html+='</div>';
  // Quick link to plan
  html+='<div style="text-align:center;margin-top:16px"><button class="compute-btn" style="padding:10px 30px;font-size:14px" onclick="tzSwitchTab(\'plan\')">🎯 生成综合养生方案 →</button></div>';
  html+='</div>';
  document.getElementById('tzResult').innerHTML=html;
  document.getElementById('tzResult').style.display='block';
}

function tzRenderFood(filter){
  let list=TZ_DATA.recipes;
  if(filter!=='all') list=list.filter(function(r){return r.constitutions.indexOf(filter)>=0;});
  let html=list.map(function(r){
    return '<div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:10px;padding:16px">'+
      '<div style="font-size:15px;color:var(--gold);font-weight:bold;margin-bottom:8px">🍵 '+r.name+'</div>'+
      '<div style="font-size:12px;color:var(--paper2);margin-bottom:6px"><b>食材：</b>'+r.ingredients+'</div>'+
      '<div style="font-size:12px;color:var(--paper2);margin-bottom:6px"><b>做法：</b>'+r.method+'</div>'+
      '<div style="font-size:12px;color:var(--success);margin-bottom:8px"><b>功效：</b>'+r.effect+'</div>'+
      '<div style="display:flex;gap:4px;flex-wrap:wrap">'+r.constitutions.map(function(c){return '<span style="font-size:11px;padding:2px 8px;background:rgba(201,168,76,0.08);border:1px solid var(--border);border-radius:10px;color:var(--gold2)">'+c+'</span>';}).join('')+'</div>'+
    '</div>';
  }).join('');
  // Also build filters
  let filterEl=document.getElementById('tzFoodFilters');
  if(filterEl && !filterEl.innerHTML){
    let fhtml='<button onclick="tzFilterFood(\'all\')" style="padding:6px 14px;border:1px solid var(--border);border-radius:8px;background:var(--title);color:var(--paper);cursor:pointer;font-size:12px;font-family:inherit">全部</button>';
    TZ_DATA.constitutions.forEach(function(c){
      fhtml+='<button onclick="tzFilterFood(\''+c.name.replace(/质$/,'')+'\')" style="padding:6px 14px;border:1px solid var(--border);border-radius:8px;background:rgba(255,255,255,0.04);color:var(--muted);cursor:pointer;font-size:12px;font-family:inherit">'+c.icon+' '+c.name.replace(/质$/,'')+'</button>';
    });
    filterEl.innerHTML=fhtml;
  }
  document.getElementById('tzFoodList').innerHTML=html||'<div style="text-align:center;color:var(--muted);padding:20px">暂无相关食谱</div>';
}

function tzFilterFood(f){
  document.querySelectorAll('#tzFoodFilters button').forEach(function(b){b.style.background='rgba(255,255,255,0.04)';b.style.color='var(--muted)';});
  event.target.style.background='var(--title)';event.target.style.color='var(--paper)';
  tzRenderFood(f);
}

function tzRenderExercise(filter){
  let list=TZ_DATA.exercises;
  if(filter!=='all') list=list.filter(function(e){return e.type===filter;});
  let intColors={'低':'var(--jade)','中':'var(--orange)','高':'var(--cinn2)'};
  let html=list.map(function(e){
    return '<div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:10px;padding:16px">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'+
        '<span style="font-size:15px;color:var(--gold);font-weight:bold">🤸 '+e.name+'</span>'+
        '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:'+intColors[e.intensity]+'20;color:'+intColors[e.intensity]+'">'+e.intensity+'强度</span>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;color:var(--paper2)">'+
        '<div>⏱ '+e.duration+'分钟</div><div>🔥 '+e.calories+'千卡</div>'+
        '<div>📋 '+e.type+'</div><div>💡 '+e.notes+'</div>'+
      '</div>'+
    '</div>';
  }).join('');
  document.getElementById('tzExerciseList').innerHTML=html||'<div style="text-align:center;color:var(--muted);padding:20px">暂无相关运动</div>';
}

function tzFilterExercise(f){
  document.querySelectorAll('#tzExFilters button').forEach(function(b){b.style.background='rgba(255,255,255,0.04)';b.style.color='var(--muted)';});
  event.target.style.background='var(--title)';event.target.style.color='var(--paper)';
  tzRenderExercise(f);
}

function tzAnalyzeBazi(){
  let dateStr=document.getElementById('tzBaziDate').value;
  let hourIdx=parseInt(document.getElementById('tzBaziHour').value);
  let gender=document.getElementById('tzBaziGender').value;
  if(!dateStr){showToast('请选择出生日期');return;}
  let parts=dateStr.split('-');
  let y=parseInt(parts[0]),m=parseInt(parts[1]),day=parseInt(parts[2]);

  let jdn = Math.floor((1461*(y+4800+Math.floor((m-14)/12)))/4)+Math.floor((367*(m-2-12*Math.floor((m-14)/12)))/12)-Math.floor((3*Math.floor((y+4900+Math.floor((m-14)/12))/100))/4)+day-32075;
  let gzOffset=(jdn-11)%60;
  if(gzOffset<0) gzOffset+=60;
  let stems=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  let dayStem=stems[gzOffset%10];
  let stemWuxing={'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
  let wu=stemWuxing[dayStem];

  let baziKey={'甲':'甲乙木','乙':'甲乙木','丙':'丙丁火','丁':'丙丁火','戊':'戊己土','己':'戊己土','庚':'庚辛金','辛':'庚辛金','壬':'壬癸水','癸':'壬癸水'}[dayStem];
  let baziInfo=TZ_DATA.baziMap[baziKey]||TZ_DATA.baziMap['甲乙木'];
  let wuData=TZ_DATA.wuxing[{木:'Mu',火:'Huo',土:'Tu',金:'Jin',水:'Shui'}[wu]];

  let html='<div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px;padding:24px">'+
    '<h5 style="font-family:\'Ma Shan Zheng\',serif;font-size:20px;color:var(--gold);margin-bottom:16px;text-align:center">🔮 日主'+dayStem+'('+wu+'行) 体质分析</h5>'+
    '<div style="text-align:center;margin-bottom:16px">'+
      '<div style="font-size:48px">'+wuData.icon+'</div>'+
      '<div style="font-size:20px;color:'+wuData.color+';font-weight:bold;margin-top:8px">'+wuData.name+'行 · '+wuData.organs.join('、')+'</div>'+
      '<div style="font-size:14px;color:var(--paper2);margin-top:8px">'+baziInfo.tizhi+'</div>'+
      '<div style="font-size:13px;color:var(--text);margin-top:8px;line-height:1.8;max-width:600px;margin-left:auto;margin-right:auto">'+baziInfo.desc+'</div>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:16px">'+
      '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:14px"><div style="font-size:12px;color:var(--gold);margin-bottom:6px">🕐 季节</div><div style="font-size:14px;color:var(--text)">'+wuData.season+' · '+wuData.direction+'方</div></div>'+
      '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:14px"><div style="font-size:12px;color:var(--gold);margin-bottom:6px">👅 五味</div><div style="font-size:14px;color:var(--text)">'+wuData.taste+'味入'+wuData.organs[0]+'</div></div>'+
      '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:14px"><div style="font-size:12px;color:var(--gold);margin-bottom:6px">😨 情志</div><div style="font-size:14px;color:var(--text)">'+wuData.emotion+'伤'+wuData.organs[0]+'</div></div>'+
      '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:14px"><div style="font-size:12px;color:var(--gold);margin-bottom:6px">👁 关联</div><div style="font-size:14px;color:var(--text)">'+wuData.sense+' · '+wuData.tissue+'</div></div>'+
    '</div>'+
    '<div style="background:rgba(230,126,34,0.06);border-left:3px solid var(--warn);padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:14px">'+
      '<div style="font-size:13px;color:var(--warn);font-weight:bold;margin-bottom:6px">⚠ 常见症状</div>'+
      '<div style="font-size:13px;color:var(--paper2)">'+wuData.symptoms.join('、')+'</div>'+
    '</div>'+
    '<div style="background:rgba(45,106,79,0.06);border-left:3px solid var(--success);padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:14px">'+
      '<div style="font-size:13px;color:var(--success);font-weight:bold;margin-bottom:6px">🌿 养生食物</div>'+
      '<div style="font-size:13px;color:var(--paper2)">'+wuData.foods.join('、')+'</div>'+
    '</div>'+
    '<div style="background:rgba(201,168,76,0.06);border-left:3px solid var(--gold);padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:14px">'+
      '<div style="font-size:13px;color:var(--gold);font-weight:bold;margin-bottom:6px">💊 常用药材</div>'+
      '<div style="font-size:13px;color:var(--paper2)">'+wuData.herbs.join('、')+'</div>'+
    '</div>'+
    '<div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:14px;margin-bottom:14px">'+
      '<div style="font-size:13px;color:var(--gold);font-weight:bold;margin-bottom:6px">📝 调养原则</div>'+
      '<div style="font-size:13px;color:var(--text);line-height:1.8">'+wuData.regimen+'</div>'+
    '</div>'+
    '<div style="background:rgba(192,57,43,0.06);border-left:3px solid var(--danger);padding:12px 16px;border-radius:0 8px 8px 0">'+
      '<div style="font-size:13px;color:var(--danger);font-weight:bold;margin-bottom:6px">🚫 禁忌</div>'+
      '<div style="font-size:13px;color:var(--paper2)">'+wuData.avoid+'</div>'+
    '</div>'+
  '</div>';
  document.getElementById('tzBaziResult').innerHTML=html;
  document.getElementById('tzBaziResult').style.display='block';
}

function tzSubmitCheckin(){
  let today=new Date().toISOString().slice(0,10);
  let items=[];
  if(document.getElementById('tzCheckDiet').checked) items.push('饮食调理');
  if(document.getElementById('tzCheckExercise').checked) items.push('功法锻炼');
  if(document.getElementById('tzCheckSleep').checked) items.push('早睡早起');
  if(document.getElementById('tzCheckEmotion').checked) items.push('情志调节');
  if(document.getElementById('tzCheckAcupoint').checked) items.push('穴位按摩');
  if(document.getElementById('tzCheckTea').checked) items.push('药膳茶饮');
  if(document.getElementById('tzCheckMeditation').checked) items.push('正念冥想');
  if(document.getElementById('tzCheckReading').checked) items.push('经典诵读');
  let note=document.getElementById('tzCheckNote').value;

  let key='tz_checkin_'+today;
  let data={date:today,items:items,note:note};
  try{localStorage.setItem(key,JSON.stringify(data));}catch(e){console.warn(e.message)}

  showToast('✅ 打卡成功！今日完成'+items.length+'项调理');
  tzRenderCheckin();
}

function tzRenderCheckin(){
  let today=new Date().toISOString().slice(0,10);
  let todayKey='tz_checkin_'+today;
  let todayData=null;
  try{todayData=JSON.parse(localStorage.getItem(todayKey)||'null');}catch(e){console.warn(e.message)}

  let streak=0,total=0;
  let d=new Date();
  let _safety=0;
  while(true){
    if(++_safety>365) break;
    let k='tz_checkin_'+d.toISOString().slice(0,10);
    if(localStorage.getItem(k)){streak++;total++;d.setDate(d.getDate()-1);}
    else break;
  }
  d=new Date();
  d.setDate(d.getDate()-streak+1);
  _safety=0;
  while(true){
    if(++_safety>365) break;
    d.setDate(d.getDate()+1);
    let k='tz_checkin_'+d.toISOString().slice(0,10);
    if(localStorage.getItem(k)){total++;}
    else break;
  }

  if(document.getElementById('tzStreakDays')) document.getElementById('tzStreakDays').textContent=streak;
  if(document.getElementById('tzTotalDays')) document.getElementById('tzTotalDays').textContent=total;
  if(document.getElementById('tzTodayStatus')) document.getElementById('tzTodayStatus').textContent=todayData?'已打卡':'未打卡';

  let html='<h5 style="font-size:15px;color:var(--gold);margin-bottom:12px">📅 最近打卡记录</h5>';
  let hasHistory=false;
  for(let i=0;i<7;i++){
    let dd=new Date();dd.setDate(dd.getDate()-i);
    let dk='tz_checkin_'+dd.toISOString().slice(0,10);
    let dData=null;
    try{dData=JSON.parse(localStorage.getItem(dk)||'null');}catch(e){console.warn(e.message)}
    if(dData){
      hasHistory=true;
      html+='<div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px">'+
        '<div style="display:flex;justify-content:space-between;margin-bottom:6px">'+
          '<span style="font-size:13px;color:var(--gold)">'+dk.replace('tz_checkin_','')+'</span>'+
          '<span style="font-size:12px;color:var(--success)">✅ '+dData.items.length+'项</span>'+
        '</div>'+
        '<div style="font-size:12px;color:var(--paper2)">'+dData.items.join(' · ')+'</div>'+
        (dData.note?'<div style="font-size:12px;color:var(--muted);margin-top:4px;font-style:italic">'+dData.note+'</div>':'')+
      '</div>';
    }
  }
  if(!hasHistory) html+='<div style="text-align:center;color:var(--muted);padding:20px;font-size:13px">暂无打卡记录，开始您的第一次打卡吧！</div>';
  let el=document.getElementById('tzCheckinHistory');
  if(el) el.innerHTML=html;
}

function tzRenderWxButtons(){
  let btns=['Mu','Huo','Tu','Jin','Shui'];
  let html=btns.map(function(k){
    let d=TZ_DATA.wuxing[k];
    return '<button class="tz-wx-btn" data-key="'+k+'" style="padding:10px 20px;border:1.5px solid var(--border);border-radius:8px;cursor:pointer;font-family:inherit;font-size:14px;background:rgba(255,255,255,0.04);color:var(--muted)" onclick="tzSelectWuxing(\''+k+'\')">'+d.icon+' '+d.name+'·'+d.organs[0]+'</button>';
  }).join('');
  let el=document.getElementById('tzWxBtns');
  if(el) el.innerHTML=html;
}

function tzSelectWuxing(key){
  let d=TZ_DATA.wuxing[key];
  document.querySelectorAll('#tzWxBtns button').forEach(function(b){
    if(b.dataset.key===key){b.style.background='var(--title)';b.style.color='var(--paper)';b.style.borderColor='var(--gold)';}
    else{b.style.background='rgba(255,255,255,0.04)';b.style.color='var(--muted)';b.style.borderColor='var(--border)';}
  });
  let html='<div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px;padding:24px">'+
    '<div style="text-align:center;margin-bottom:20px">'+
      '<div style="font-size:56px">'+d.icon+'</div>'+
      '<div style="font-size:24px;color:'+d.color+';font-weight:bold;margin-top:8px">'+d.name+'行 · '+d.organs.join('、')+'</div>'+
      '<div style="font-size:13px;color:var(--paper2);margin-top:6px">'+d.season+'季 · '+d.direction+'方 · '+d.taste+'味 · '+d.emotion+'</div>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:16px">'+
      '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:14px"><div style="font-size:12px;color:var(--gold);margin-bottom:6px">👁 对应</div><div style="font-size:14px;color:var(--text)">'+d.sense+' · '+d.tissue+'</div></div>'+
      '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:14px"><div style="font-size:12px;color:var(--gold);margin-bottom:6px">⚠ 症状</div><div style="font-size:12px;color:var(--paper2)">'+d.symptoms.slice(0,4).join('、')+'</div></div>'+
    '</div>'+
    '<div style="background:rgba(45,106,79,0.06);border-left:3px solid var(--success);padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:14px">'+
      '<div style="font-size:13px;color:var(--success);font-weight:bold;margin-bottom:6px">🌿 养生食物</div>'+
      '<div style="font-size:13px;color:var(--paper2);line-height:1.8">'+d.foods.join('、')+'</div>'+
    '</div>'+
    '<div style="background:rgba(201,168,76,0.06);border-left:3px solid var(--gold);padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:14px">'+
      '<div style="font-size:13px;color:var(--gold);font-weight:bold;margin-bottom:6px">💊 药材</div>'+
      '<div style="font-size:13px;color:var(--paper2);line-height:1.8">'+d.herbs.join('、')+'</div>'+
    '</div>'+
    '<div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:14px;margin-bottom:14px">'+
      '<div style="font-size:13px;color:var(--gold);font-weight:bold;margin-bottom:6px">📝 调养原则</div>'+
      '<div style="font-size:13px;color:var(--text);line-height:1.8">'+d.regimen+'</div>'+
    '</div>'+
    '<div style="background:rgba(192,57,43,0.06);border-left:3px solid var(--danger);padding:12px 16px;border-radius:0 8px 8px 0">'+
      '<div style="font-size:13px;color:var(--danger);font-weight:bold;margin-bottom:6px">🚫 禁忌</div>'+
      '<div style="font-size:13px;color:var(--paper2)">'+d.avoid+'</div>'+
    '</div>'+
  '</div>';
  let el=document.getElementById('tzWuxingDetail');
  if(el) el.innerHTML=html;
}