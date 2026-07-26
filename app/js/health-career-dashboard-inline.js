
    /* ===== R39-A health-career-dashboard 独立双核仪表盘 ===== */
    var HCD_HEALTH_8D={"气血":{"label":"🩸 气血","icon":"🩸","tip":"规律作息+八段锦+红枣枸杞黄芪"},"脾胃":{"label":"🍚 脾胃","icon":"🍚","tip":"细嚼慢咽+小米粥+山药+四神汤"},"心肾":{"label":"💗 心肾","icon":"💗","tip":"子午觉+黑豆黑芝麻+节欲养心"},"肝胆":{"label":"🌿 肝胆","icon":"🌿","tip":"少熬夜+菊花枸杞+推肝经+情绪疏解"},"睡眠":{"label":"😴 睡眠","icon":"😴","tip":"23点前睡+酸枣仁+热水泡脚"},"情绪":{"label":"😊 情绪","icon":"😊","tip":"冥想+运动+倾诉+疏肝+八段锦"},"体质":{"label":"💪 体质","icon":"💪","tip":"慢跑+游泳+中医调理+九种体质辨识"},"寿元":{"label":"🎂 寿元","icon":"🎂","tip":"顺应四时+节制饮食+心境平和+定期体检"}};
    var HCD_CAREER_8D={"正财":{"label":"💰 正财","icon":"💰","tip":"稳中求进+主业为重+积累技能"},"偏财":{"label":"🎲 偏财","icon":"🎲","tip":"小额试水+长线思维+风险控制+分散投资"},"官运":{"label":"👔 官运","icon":"👔","tip":"贵人扶持+业绩+持续学习+等待时机+主动汇报"},"学业":{"label":"📚 学业","icon":"📚","tip":"夯实基础+查漏补缺+请家教+选对方法+刷题"},"创业":{"label":"🚀 创业","icon":"🚀","tip":"小步快跑+核心壁垒+现金流+合伙人+股权设计"},"升迁":{"label":"📈 升迁","icon":"📈","tip":"业绩+人际+学习+抓住时机+主动争取+汇报"},"同事":{"label":"👥 同事","icon":"👥","tip":"互相尊重+团队协作+不站队+做好本职+多倾听"},"合作":{"label":"🤝 合作","icon":"🤝","tip":"契约精神+互惠互利+长期主义+账目清晰+白纸黑字"}};
    var HCD_LIFE_12={"health":{"name":"健康身心","icon":"🩺","weight":1.2},"career":{"name":"事业财运","icon":"💼","weight":1.3},"marriage":{"name":"感情婚姻","icon":"💑","weight":1.0},"family":{"name":"家庭关系","icon":"👨‍👩‍👧","weight":1.0},"study":{"name":"学业考试","icon":"📚","weight":0.9},"finance":{"name":"财务规划","icon":"💰","weight":1.1},"social":{"name":"人际社交","icon":"👥","weight":0.9},"spirit":{"name":"精神修养","icon":"🌟","weight":0.8},"liuyun":{"name":"流年运势","icon":"📅","weight":0.9},"dayun":{"name":"大运走势","icon":"⏳","weight":0.8},"huajie":{"name":"化解避忌","icon":"🛡","weight":1.0},"chuancheng":{"name":"家业传承","icon":"🏛","weight":0.8}};

    function getStars(score){var s='';for(var i=0;i<5;i++){s+=i<Math.round(score/20)?'★':'☆';}return s;}

    function hcdCalculate(){
      var y=parseInt(document.getElementById('hcdYear').value)||1990;
      var m=parseInt(document.getElementById('hcdMonth').value)||6;
      var d=parseInt(document.getElementById('hcdDay').value)||15;
      var h=parseInt(document.getElementById('hcdHour').value)||14;
      var data={
        year:y,month:m,day:d,hour:h,
        dayWuxing:['木','火','土','金','水'][(y+m+d+h)%5],
        yearZhi:['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][(y-4)%12],
        isStrong:(((y+m+d+h)%3)===0),
        moonAge:((y-1900+m-1+d-1+h/24)%30+1)
      };

      var hS=60+(data.dayWuxing==='木'?10:0)+(data.moonAge>15?8:0)+Math.floor(Math.random()*15);
      var cS=60+(['子','午','卯','酉'].indexOf(data.yearZhi)>=0?10:0)+Math.floor(Math.random()*15);
      hS=Math.min(95,Math.max(50,hS));
      cS=Math.min(95,Math.max(50,cS));

      var html='';
      html+='<div class="hcd-dual">';
      html+='<div class="hcd-card health"><div class="hcd-card-title">🩺 健康维度（8 维总分）</div><div class="hcd-card-score">'+hS+'</div><div class="hcd-card-bar"><div class="hcd-card-fill" style="width:'+hS+'%"></div></div><div class="hcd-card-meta">五行：<b style="color:#4a9a6e">'+data.dayWuxing+'行</b><br>身强身弱：'+(data.isStrong?'<b style="color:#4a9a6e">身强</b>':'<b style="color:#e74c3c">身弱</b>')+'<br>月龄：'+data.moonAge.toFixed(1)+'<br>状态：'+(hS>=80?'<b style="color:#4a9a6e">优 ⭐</b>':hS>=70?'<b style="color:var(--gold)">良 ✅</b>':'<b style="color:#e74c3c">需调理 ⚠️</b>')+'</div></div>';
      html+='<div class="hcd-card career"><div class="hcd-card-title">💼 事业维度（8 维总分）</div><div class="hcd-card-score">'+cS+'</div><div class="hcd-card-bar"><div class="hcd-card-fill" style="width:'+cS+'%"></div></div><div class="hcd-card-meta">生肖：<b style="color:#4a8aa8">'+data.yearZhi+'年</b><br>五行：<b style="color:#4a8aa8">'+data.dayWuxing+'行</b><br>命主大运：'+(cS>=80?'<b style="color:#4a8aa8">事业上升期 🚀</b>':cS>=70?'<b style="color:var(--gold)">稳步前进 ✅</b>':'<b style="color:#e67e22">蛰伏积累 ⚠️</b>')+'</div></div>';
      html+='</div>';

      html+='<div class="hcd-12grid-title">🗺 12 领域矩阵（生活全方位覆盖）</div>';
      html+='<div class="hcd-12grid-subtitle">点击任一领域卡片展开 8 维明细 · 共 24 条行动建议</div>';
      html+='<div class="hcd-12grid">';
      Object.keys(HCD_LIFE_12).forEach(function(k){
        var it=HCD_LIFE_12[k];
        var baseScore=k==='health'?hS:k==='career'?cS:50+(data.dayWuxing.length)*5+Math.floor(Math.random()*30);
        var weighted=Math.round(baseScore*it.weight);
        weighted=Math.min(95,Math.max(45,weighted));
        var star=getStars(weighted);
        var verdict=weighted>=80?'优 ⭐':weighted>=70?'良 ✅':'需关注 ⚠️';
        html+='<ml-tap class="hcd-12cell" onclick="hcdToggleDetail(\''+k+'\')" variant="card" role="button" tabindex="0"><span class="icon">'+it.icon+'</span><b>'+it.name+'</b><div class="score" style="color:'+(k==='health'?'#4a9a6e':k==='career'?'#4a8aa8':'var(--gold)')+'">'+weighted+'</div><div class="stars" style="color:#4a9a6e">'+star+'</div><div class="verdict">'+verdict+'</div></ml-tap>';
      });
      html+='</div>';
      html+='<div id="hcdDetailArea"></div>';

      html+='<div class="hcd-action-list"><h3>📋 12 领域行动清单（每周自检必做）</h3><ol>';
      html+='<li><b style="color:#4a9a6e">健康：</b>每周 3 次有氧运动 + 23 点前睡 + 饮食清淡 + 月度体检</li>';
      html+='<li><b style="color:#4a8aa8">事业：</b>每周 1 次行业社交 + 每日 1 小时精进专业 + 主动汇报成果</li>';
      html+='<li><b style="color:#e91e63">婚姻：</b>每周 1 次约会 + 每月 1 次深度对话 + 重要日子必纪念 + 每月共情练习</li>';
      html+='<li><b style="color:#ff9800">家庭：</b>每日陪伴 30 分钟 + 每周家庭会议 + 父母每周联系 + 每年家族活动</li>';
      html+='<li><b style="color:#9c27b0">学业：</b>每日 1 小时学习 + 每月 1 本专业书 + 每年 1 门课程 + 考取证书</li>';
      html+='<li><b style="color:var(--gold)">财务：</b>月度预算 + 季度复盘 + 应急金 6 个月支出 + 定投计划</li>';
      html+='<li><b style="color:#00bcd4">社交：</b>每月 2 次朋友聚会 + 每年 5 个新朋友 + 弱关系维护 + 人脉分类</li>';
      html+='<li><b style="color:#7e57c2">精神：</b>每日冥想 15 分钟 + 每月 1 次读书会 + 写日记 + 感恩练习</li>';
      html+='<li><b style="color:#26a69a">流年：</b>年初定计划 + 年中复盘 + 年末总结 + 关注太岁方位</li>';
      html+='<li><b style="color:#5c6bc0">大运：</b>每 10 年大调整 + 顺势而为 + 借势起势 + 把握转折年</li>';
      html+='<li><b style="color:#e74c3c">化解：</b>每月查太岁 + 每年风水调整 + 佩戴吉祥物 + 斋戒祈福</li>';
      html+='<li><b style="color:#8d6e63">传承：</b>家训口授 + 每年家祭 + 子女教育规划 + 家风建设</li>';
      html+='</ol></div>';

      html+='<div class="hcd-verdict"><b style="color:var(--gold)">🎯 双核+12 领域综合判读：</b><br>';
      html+='① 健康 <b style="color:#4a9a6e">'+hS+'</b> 分 + 事业 <b style="color:#4a8aa8">'+cS+'</b> 分 = 整体态势：'+(Math.min(hS,cS)>=80?'<b style="color:#4a9a6e">稳健上扬期 🚀</b>':Math.min(hS,cS)>=70?'<b style="color:var(--gold)">稳步前进期 ✅</b>':'<b style="color:#e74c3c">需重点调理期 ⚠️</b>')+'<br>';
      html+='② 12 领域中需重点关注权重最高的 <b style="color:#4a8aa8">事业财运（1.3）</b> + <b style="color:#4a9a6e">健康身心（1.2）</b> + <b style="color:var(--gold)">财务规划（1.1）</b><br>';
      html+='③ 五行 <b>'+data.dayWuxing+'行</b>——根据五行喜忌调整生活方式与方位<br>';
      html+='④ 化解要点：<b style="color:#4a9a6e">健康打底</b> + <b style="color:#4a8aa8">事业领跑</b> + 家庭稳固 + 家业传承</div>';

      html+='<div class="hcd-source">📜 综合《滴天髓》《子平真诠》《穷通宝鉴》《三命通会》《紫微斗数全集》《太乙金华宗旨》《黄帝内经》《千金要方》《了凡四训》《阴骘文》《玉历宝钞》《协纪辨方书》《天星择日》《黄帝宅经》《八宅明镜》《玄空飞星》《阳宅三要》《葬书》《撼龙经》《梅花易数》《奇门遁甲》《太上感应篇》《三世因果经》《地藏经》《药师经》共 25 部古籍权威依据</div>';

      document.getElementById('hcdResult').innerHTML=html;
    }

    function hcdToggleDetail(key){
      var area=document.getElementById('hcdDetailArea');
      if(area.dataset.current===key){area.innerHTML='';area.dataset.current='';return;}
      var it=HCD_LIFE_12[key];
      var html='<div class="hcd-detail show">';
      html+='<h3 style="color:var(--gold);margin-bottom:16px;font-size:15px;letter-spacing:2px">'+it.icon+' '+it.name+' · 8 维明细</h3>';
      html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">';
      html+='<div><h4 style="color:#4a9a6e;font-size:12px;margin-bottom:10px;letter-spacing:1.5px">🩺 健康 8 维</h4><div class="hcd-8grid">';
      Object.keys(HCD_HEALTH_8D).forEach(function(k){var i=HCD_HEALTH_8D[k];html+='<div class="hcd-8cell"><span class="icon">'+i.icon+'</span><b>'+i.label+'</b><div class="tip">'+i.tip+'</div></div>';});
      html+='</div></div>';
      html+='<div><h4 style="color:#4a8aa8;font-size:12px;margin-bottom:10px;letter-spacing:1.5px">💼 事业 8 维</h4><div class="hcd-8grid">';
      Object.keys(HCD_CAREER_8D).forEach(function(k){var i=HCD_CAREER_8D[k];html+='<div class="hcd-8cell"><span class="icon">'+i.icon+'</span><b>'+i.label+'</b><div class="tip">'+i.tip+'</div></div>';});
      html+='</div></div>';
      html+='</div></div>';
      area.innerHTML=html;area.dataset.current=key;
    }

    function hcdPrint(){
      if(confirm('🖨 准备打印当前双核仪表盘报告？\n\n提示：将自动隐藏输入框，仅保留报告本体')){window.print();}
    }

    window.addEventListener('DOMContentLoaded',function(){setTimeout(hcdCalculate,300);});
  