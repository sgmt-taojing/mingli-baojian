// heluo-math.js
// R629 Phase 1: 河洛数理系统（从 divination-core.js 拆分）
// 包含：analyzeByHetuLuoshu / renderHetuLuoshuPanel / runHetuAnalysis
// 依赖：divination-core.js（WUXING_ALL 等基础数据）
// 用法：<script src="js/heluo-math.js" defer></script>
(function(global){
// ===== 河洛数理系统 =====
var HETU_LUOSHU_SYSTEM={
  hetu:{
    formula:'天一生水地六成之；天二生火地七成之；天三生木地八成之；天四生金地九成之；天五生土地十成之',
    shengShu:{1:'水',2:'火',3:'木',4:'金',5:'土'},
    chengShu:{6:'水',7:'火',8:'木',9:'金',0:'土'},
    wuxingJu:{
      '水局':{sheng:1,cheng:6,chars:'智慧、流动、变化',applies:'传播/物流/咨询'},
      '火局':{sheng:2,cheng:7,chars:'热情、光明、变革',applies:'科技/传媒/餐饮'},
      '木局':{sheng:3,cheng:8,chars:'生发、仁慈、文化',applies:'教育/文化/农业'},
      '金局':{sheng:4,cheng:9,chars:'刚毅、果断、收敛',applies:'金融/法律/制造'},
      '土局':{sheng:5,cheng:10,chars:'厚重、包容、积累',applies:'地产/建筑/保险'}
    }
  },
  luoshu:{
    grid:[[4,9,2],[3,5,7],[8,1,6]],
    palace:{
      1:{name:'坎宫',dir:'北方',el:'水',body:'肾/膀胱/耳'},
      2:{name:'坤宫',dir:'西南',el:'土',body:'脾/胃/腹'},
      3:{name:'震宫',dir:'东方',el:'木',body:'肝/胆/神经'},
      4:{name:'巽宫',dir:'东南',el:'木',body:'胆/股'},
      5:{name:'中宫',dir:'中央',el:'土',body:'脾胃全身'},
      6:{name:'乾宫',dir:'西北',el:'金',body:'肺/头/骨'},
      7:{name:'兑宫',dir:'西方',el:'金',body:'肺/口/咽'},
      8:{name:'艮宫',dir:'东北',el:'土',body:'胃/关节/背'},
      9:{name:'离宫',dir:'南方',el:'火',body:'心/眼/血'}
    },
    nineStars:{
      1:{name:'一白贪狼星',el:'水',luck:'吉',domain:'桃花/人缘/智慧',enhance:'养水生植物/鱼缸/蓝色物品',resolve:''},
      2:{name:'二黑巨门星',el:'土',luck:'凶',domain:'病符/健康',enhance:'',resolve:'挂铜葫芦/六帝铜钱'},
      3:{name:'三碧禄存星',el:'木',luck:'凶',domain:'是非/口舌',enhance:'',resolve:'放红色物品(火泄木)'}
,
      4:{name:'四绿文曲星',el:'木',luck:'吉',domain:'文昌/学业/姻缘',enhance:'放四支毛笔/绿色植物/文昌塔',resolve:''},
      5:{name:'五黄廉贞星',el:'土',luck:'大凶',domain:'灾煞/意外',enhance:'',resolve:'挂铜铃/六帝钱(金泄土)'}
,
      6:{name:'六白武曲星',el:'金',luck:'吉',domain:'贵人/权力',enhance:'放金属物品/黄色水晶',resolve:''},
      7:{name:'七赤破军星',el:'金',luck:'凶',domain:'贼盗/破财',enhance:'',resolve:'放蓝色黑色物品(水泄金)'}
,
      8:{name:'八白左辅星',el:'土',luck:'吉(当旺)',domain:'财运/置业',enhance:'放黄色水晶/陶瓷/八白玉',resolve:''},
      9:{name:'九紫右弼星',el:'火',luck:'吉(当旺)',domain:'喜庆/姻缘/名声',enhance:'放红色物品/鲜花/红灯',resolve:''}
    }
  }
};

// 河洛数理分析
function analyzeByHetuLuoshu(input,type){
  let result={input:input,type:type,hetu:{},luoshu:{},conclusion:'',advice:[]};
  
  // 河图五行分析
  let wxCount={水:0,火:0,木:0,金:0,土:0};
  let shengCount=0,chengCount=0;
  
  if(type==='mobile'){
    for (let i=0;i<input.length;i++){
      let n=parseInt(input[i]);
      let wx=HETU_LUOSHU_SYSTEM.hetu.shengShu[n]||HETU_LUOSHU_SYSTEM.hetu.chengShu[n];
      if(wx)wxCount[wx]++;
      if(n>=1&&n<=5)shengCount++;
      else chengCount++;
    }
  }else if(type==='name'){
    // 姓名笔画
    for (let i=0;i<input.length;i++){
      let stroke=getKangxiStroke(input[i])||_STROKE_TABLE[input[i]]||(input[i].charCodeAt(0)%16+1);
      let num=stroke%10;
      let wx=HETU_LUOSHU_SYSTEM.hetu.shengShu[num]||HETU_LUOSHU_SYSTEM.hetu.chengShu[num];
      if(wx)wxCount[wx]++;
      if(num>=1&&num<=5)shengCount++;else chengCount++;
    }
  }
  
  result.hetu={wxCount:wxCount,shengCount:shengCount,chengCount:chengCount,
    ratio:(shengCount/(shengCount+chengCount)*100).toFixed(0)+'%生/'+(chengCount/(shengCount+chengCount)*100).toFixed(0)+'%成',
    dominant:'',balance:false};
  // 找最旺五行
  let maxWx='水',maxVal=0,minWx='水',minVal=99;
  for (let wx in wxCount){
    if(wxCount[wx]>maxVal){maxVal=wxCount[wx];maxWx=wx;}
    if(wxCount[wx]<minVal){minVal=wxCount[wx];minWx=wx;}
  }
  result.hetu.dominant=maxWx;
  result.hetu.weakest=minWx;
  result.hetu.balance=(maxVal-minVal)<=2;
  result.hetu.shengChengMeaning=shengCount>chengCount?'生数偏多→主动开创、先发制人、宜进取':chengCount>shengCount?'成数偏多→主守成、稳健积累、宜守不宜攻':'生成平衡→动静相宜，攻守兼备';
  
  // 洛书九星分析（仅mobile）
  if(type==='mobile'){
    let starCount={};
    for (let i=0;i<input.length;i++){
      let n=parseInt(input[i]);
      if(n===0)n=10; // 0代10，属土
      if(n>=1&&n<=9){
        starCount[n]=(starCount[n]||0)+1;
      }
    }
    let jiCount=0,xiongCount=0;
    let starDetails=[];
    for (let s=1;s<=9;s++){
      if(starCount[s]){
        let star=HETU_LUOSHU_SYSTEM.luoshu.nineStars[s];
        let isJi=star.luck.indexOf('吉')>=0;
        if(isJi)jiCount+=starCount[s];else xiongCount+=starCount[s];
        starDetails.push({num:s,name:star.name,count:starCount[s],luck:star.luck,domain:star.domain});
      }
    }
    result.luoshu={starCount:starCount,starDetails:starDetails,jiCount:jiCount,xiongCount:xiongCount,
      ratio:(jiCount/(jiCount+xiongCount)*100||0).toFixed(0)+'%吉/'+(xiongCount/(jiCount+xiongCount)*100||0).toFixed(0)+'%凶'};
  }
  
  // 结论
  let concl='河图五行偏「'+maxWx+'」';
  if(result.hetu.balance)concl+='，五行较为平衡';
  else concl+='，「'+minWx+'」偏弱需补';
  if(type==='mobile'&&result.luoshu.jiCount!==undefined){
    concl+='。洛书九星吉凶比'+result.luoshu.ratio;
  }
  concl+='。'+result.hetu.shengChengMeaning+'。';
  result.conclusion=concl;
  
  // 建议
  result.advice=[];
  if(!result.hetu.balance){
    let shengMap={木:'水',火:'木',土:'火',金:'土',水:'金'};
    result.advice.push('补'+minWx+'：宜多接触'+minWx+'行相关事物（'+(minWx==='木'?'绿色植物/木材':minWx==='火'?'红色物品/灯光':minWx==='土'?'黄色物品/陶瓷':minWx==='金'?'金属物品/白色':minWx==='水'?'水养植物/鱼缸/蓝色':'')+'）');
  }
  if(type==='mobile'&&xiongCount>jiCount){
    result.advice.push('凶星偏多，建议调整号码增加吉星数字（1/4/6/8/9）');
  }
  if(shengCount>chengCount*2){
    result.advice.push('生数过多主冲动，宜增加成数(6-9)平衡');
  }else if(chengCount>shengCount*2){
    result.advice.push('成数过多主保守，宜增加生数(1-5)激活动力');
  }
  
  return result;
}

// 渲染河洛面板
function renderHetuLuoshuPanel(){
  let el=document.getElementById('almanacHetuLuoshu');
  if(!el)return;
  let now=new Date();
  let Y=now.getFullYear(),M=now.getMonth()+1,D=now.getDate();
  
  // 今日河图数
  let dayGzIdx=(Y*365+M*30+D)%60;
  let dayStemIdx=dayGzIdx%10;
  let hetuShu=dayStemIdx+1; // 1-10
  let hetuCheng=(dayStemIdx+6)%10+1;
  let hetuWx=HETU_LUOSHU_SYSTEM.hetu.shengShu[hetuShu]||HETU_LUOSHU_SYSTEM.hetu.chengShu[hetuCheng]||'土';
  
  // 今日洛书九星
  let luoshuOrder=[9,3,7,1,5,8,4,2,6];
  // 年命星：洛书轨迹，1864年一白入中宫
  let yearStar = 9 - ((Y - 1864) % 9) + 1;
  if(yearStar > 9) yearStar -= 9;
  if(yearStar < 1) yearStar += 9;
  
  let html='';
  html+='<div style="font-size:15px;color:var(--gold);font-weight:bold;margin-bottom:14px;letter-spacing:3px;text-align:center">🔮 河洛数理</div>';
  
  // 河图
  html+='<div style="background:rgba(52,152,219,.04);border:1px solid rgba(52,152,219,.15);border-radius:10px;padding:14px;margin-bottom:12px">';
  html+='<div style="font-size:13px;color:var(--cyan2);margin-bottom:8px">河图</div>';
  html+='<div style="font-size:12px;opacity:.7;line-height:1.8;margin-bottom:6px">'+HETU_LUOSHU_SYSTEM.hetu.formula+'</div>';
  html+='<div class="rpt-is-5">今日河图数：<b class="rpt-is-1">'+hetuShu+'</b>(生数,'+hetuWx+') / <b class="rpt-is-1">'+hetuCheng+'</b>(成数,'+hetuWx+')</div>';
  html+='</div>';
  
  // 洛书九宫图
  html+='<div style="background:rgba(231,76,60,.04);border:1px solid rgba(231,76,60,.15);border-radius:10px;padding:14px;margin-bottom:12px">';
  html+='<div style="font-size:13px;color:var(--cinn2);margin-bottom:10px">洛书九宫</div>';
  html+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;max-width:240px;margin:0 auto 10px">';
  let grid=HETU_LUOSHU_SYSTEM.luoshu.grid;
  for (let r=0;r<3;r++){
    for (let c=0;c<3;c++){
      let num=grid[r][c];
      let star=HETU_LUOSHU_SYSTEM.luoshu.nineStars[num];
      let luckColor=star.luck.indexOf('吉')>=0?'var(--success)':'var(--cinn2)';
      html+='<div style="text-align:center;padding:8px 4px;background:rgba(255,255,255,.03);border-radius:6px;border:1px solid '+luckColor+'30">';
      html+='<div style="font-size:18px;font-weight:bold;color:'+luckColor+'">'+num+'</div>';
      html+='<div style="font-size:9px;opacity:.5">'+star.name.substring(0,3)+'</div>';
      html+='</div>';
    }
  }
  html+='</div>';
  html+='<div style="font-size:11px;opacity:.5;text-align:center">洛书：戴九履一，左三右七，二四为肩，六八为足，五居中央</div>';
  html+='</div>';
  
  // 手机号河洛分析入口
  html+='<div style="background:rgba(155,89,182,.04);border:1px solid rgba(155,89,182,.15);border-radius:10px;padding:14px;margin-bottom:12px">';
  html+='<div style="font-size:13px;color:var(--violet);margin-bottom:10px">河洛数理分析</div>';
  html+='<input type="tel" id="hetuMobileInput" class="input-field" style="max-width:200px;font-size:16px;letter-spacing:3px;text-align:center;margin-bottom:8px" placeholder="输入手机号/姓名" maxlength="11">';
  html+='<button onclick="runHetuAnalysis()" class="compute-btn" style="padding:6px 16px;font-size:12px">分析</button>';
  html+='<div id="hetuResult" style="display:none;margin-top:12px"></div>';
  html+='</div>';
  
  el.innerHTML=html;
}

function runHetuAnalysis(){
  let input=document.getElementById('hetuMobileInput')?document.getElementById('hetuMobileInput').value.trim():'';
  let out=document.getElementById('hetuResult');
  if(!input||!out)return;
  if(input.length<2){showToast('请输入至少2个字符');return;}
  
  let type=/^\d+$/.test(input)?'mobile':'name';
  let r=analyzeByHetuLuoshu(input,type);
  
  let html='';
  // 河图
  html+='<div style="font-size:12px;color:var(--cyan2);margin-bottom:6px;font-weight:bold">河图分析</div>';
  html+='<div style="font-size:12px;line-height:2;margin-bottom:8px">';
  for (let wx in r.hetu.wxCount){if(r.hetu.wxCount[wx]>0)html+=wx+':'+r.hetu.wxCount[wx]+' ';}
  html+='</div>';
  html+='<div style="font-size:11px;opacity:.6;margin-bottom:6px">'+r.hetu.ratio+'　旺:'+r.hetu.dominant+' 弱:'+r.hetu.weakest+'</div>';
  html+='<div style="font-size:11px;opacity:.7;margin-bottom:10px">'+r.hetu.shengChengMeaning+'</div>';
  
  // 洛书
  if(r.luoshu.starDetails){
    html+='<div style="font-size:12px;color:var(--cinn2);margin-bottom:6px;font-weight:bold">洛书九星</div>';
    html+='<div style="font-size:11px;opacity:.6;margin-bottom:6px">'+r.luoshu.ratio+'</div>';
    r.luoshu.starDetails.forEach(function(s){
      let color=s.luck.indexOf('吉')>=0?'var(--success)':'var(--cinn2)';
      html+='<div style="font-size:11px;color:'+color+'">'+s.num+'.'+s.name+' ×'+s.count+' ('+s.domain+')</div>';
    });
  }
  
  // 结论
  html+='<div style="font-size:12px;color:var(--gold);margin-top:10px;padding:8px;background:rgba(201,168,76,.04);border-radius:6px;line-height:1.8">'+r.conclusion+'</div>';
  
  // 建议（会员可见）
  if(r.advice.length>0){
    html+='<div style="font-size:11px;margin-top:8px;padding:8px;background:rgba(46,204,113,.04);border-radius:6px;line-height:1.8">';
    html+='<b class="rpt-is-4">建议：</b><br>';
    r.advice.forEach(function(a){html+='· '+a+'<br>';});
    html+='</div>';
  }
  
  out.innerHTML=html;
  out.style.display='block';
}

})(typeof window !== "undefined" ? window : globalThis);
