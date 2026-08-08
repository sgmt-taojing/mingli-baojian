
    /* ===== R39-A health-career-dashboard 独立双核仪表盘 ===== */
    /* R243: 接入后端排盘API，真实八字数据驱动评分 */
    var HCD_HEALTH_8D={"气血":{"label":"🩸 气血","icon":"🩸","tip":"规律作息+八段锦+红枣枸杞黄芪"},"脾胃":{"label":"🍚 脾胃","icon":"🍚","tip":"细嚼慢咽+小米粥+山药+四神汤"},"心肾":{"label":"💗 心肾","icon":"💗","tip":"子午觉+黑豆黑芝麻+节欲养心"},"肝胆":{"label":"🌿 肝胆","icon":"🌿","tip":"少熬夜+菊花枸杞+推肝经+情绪疏解"},"睡眠":{"label":"😴 睡眠","icon":"😴","tip":"23点前睡+酸枣仁+热水泡脚"},"情绪":{"label":"😊 情绪","icon":"😊","tip":"冥想+运动+倾诉+疏肝+八段锦"},"体质":{"label":"💪 体质","icon":"💪","tip":"慢跑+游泳+中医调理+九种体质辨识"},"寿元":{"label":"🎂 寿元","icon":"🎂","tip":"顺应四时+节制饮食+心境平和+定期体检"}};
    var HCD_CAREER_8D={"正财":{"label":"💰 正财","icon":"💰","tip":"稳中求进+主业为重+积累技能"},"偏财":{"label":"🎲 偏财","icon":"🎲","tip":"小额试水+长线思维+风险控制+分散投资"},"官运":{"label":"👔 官运","icon":"👔","tip":"贵人扶持+业绩+持续学习+等待时机+主动汇报"},"学业":{"label":"📚 学业","icon":"📚","tip":"夯实基础+查漏补缺+请家教+选对方法+刷题"},"创业":{"label":"🚀 创业","icon":"🚀","tip":"小步快跑+核心壁垒+现金流+合伙人+股权设计"},"升迁":{"label":"📈 升迁","icon":"📈","tip":"业绩+人际+学习+抓住时机+主动争取+汇报"},"同事":{"label":"👥 同事","icon":"👥","tip":"互相尊重+团队协作+不站队+做好本职+多倾听"},"合作":{"label":"🤝 合作","icon":"🤝","tip":"契约精神+互惠互利+长期主义+账目清晰+白纸黑字"}};
    var HCD_LIFE_12={"health":{"name":"健康身心","icon":"🩺","weight":1.2},"career":{"name":"事业财运","icon":"💼","weight":1.3},"marriage":{"name":"感情婚姻","icon":"💑","weight":1.0},"family":{"name":"家庭关系","icon":"👨‍👩‍👧","weight":1.0},"study":{"name":"学业考试","icon":"📚","weight":0.9},"finance":{"name":"财务规划","icon":"💰","weight":1.1},"social":{"name":"人际社交","icon":"👥","weight":0.9},"spirit":{"name":"精神修养","icon":"🌟","weight":0.8},"liuyun":{"name":"流年运势","icon":"📅","weight":0.9},"dayun":{"name":"大运走势","icon":"⏳","weight":0.8},"huajie":{"name":"化解避忌","icon":"🛡","weight":1.0},"chuancheng":{"name":"家业传承","icon":"🏛","weight":0.8}};

    // 五行映射表
    var WUXING_MAP={'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水','子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'};
    var WUXING_ORGAN={'木':'肝胆','火':'心小肠','土':'脾胃','金':'肺大肠','水':'肾膀胱'};
    var WUXING_CAREER={'木':'教育/文化/农业','火':'餐饮/能源/电子','土':'房产/建筑/矿产','金':'金融/机械/法律','水':'物流/旅游/通讯'};

    function getStars(score){var s='';for(var i=0;i<5;i++){s+=i<Math.round(score/20)?'★':'☆';}return s;}

    function hcdCalculate(){
      var y=parseInt(document.getElementById('hcdYear').value)||1990;
      var m=parseInt(document.getElementById('hcdMonth').value)||6;
      var d=parseInt(document.getElementById('hcdDay').value)||15;
      var h=parseInt(document.getElementById('hcdHour').value)||14;
      var gender=document.getElementById('hcdGender').value||'male';

      // 显示 loading
      document.getElementById('hcdResult').innerHTML='<div style="text-align:center;padding:40px;opacity:.6"><div style="font-size:24px">⏳ 正在排盘分析中…</div><div style="font-size:12px;margin-top:8px">调用后端八字排盘引擎</div></div>';

      // R243: 调用后端排盘 API 获取真实八字数据
      fetch('/api/paipan/calculate', { signal: AbortSignal.timeout(15000),
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({year:y,month:m,day:d,hour:h,gender:gender}), signal: AbortSignal.timeout(15000) }).then(function(r){return r.json();}).then(function(paipan){
        if(!paipan || !paipan.pillars){
          hcdRenderFallback(y,m,d,h,gender);
          return;
        }
        hcdRenderReal(paipan,y,m,d,h,gender);
      }).catch(function(e){
        console.warn('[hcd] 排盘API不可用，使用本地降级',e.message);
        hcdRenderFallback(y,m,d,h,gender);
      });
    }

    // 真实排盘数据驱动
    function hcdRenderReal(paipan,y,m,d,h,gender){
      var pillars=paipan.pillars||{};
      var dayMaster=paipan.day_master||'';
      var dayGan=dayMaster?dayMaster[0]:'';
      var dayWuxing=WUXING_MAP[dayGan]||'土';
      var wuxingScore=paipan.wuxing_score||{};
      var shensha=paipan.shensha||{};
      var dayun=paipan.dayun||[];

      // 五行强弱判断（真实）
      var wxCount={'木':0,'火':0,'土':0,'金':0,'水':0};
      Object.values(pillars).forEach(function(gz){
        if(gz&&gz.length>=2){wxCount[WUXING_MAP[gz[0]]||'土']++;wxCount[WUXING_MAP[gz[1]]||'土']++;}
      });
      var isStrong=wxCount[dayWuxing]>=2;

      // 大运信息
      var currentDayun='';
      var dayunAge='';
      if(dayun&&dayun.length>0){
        var nowYear=new Date().getFullYear();
        for(var i=0;i<dayun.length;i++){
          if(dayun[i].start_age && (y+dayun[i].start_age)<=nowYear){
            currentDayun=dayun[i].ganzhi||'';
            dayunAge=dayun[i].start_age+'-'+(dayun[i].start_age+10)+'岁';
          }
        }
      }

      // 健康评分：基于日主五行 + 五行平衡 + 神煞
      var hS=65;
      // 日主五行对应脏腑健康基础分
      var organHealth={'木':8,'火':5,'土':7,'金':6,'水':9};
      hS+=organHealth[dayWuxing]||5;
      // 五行平衡加分
      var wxVals=Object.values(wxCount);
      var wxMax=Math.max.apply(null,wxVals);
      var wxMin=Math.min.apply(null,wxVals);
      if(wxMax-wxMin<=2) hS+=8; // 五行均衡
      // 神煞影响
      if(shensha['天医']) hS+=5;
      if(shensha['羊刃']) hS-=5;
      if(shensha['天乙贵人']) hS+=3;
      hS=Math.min(95,Math.max(50,hS));

      // 事业评分：基于日主 + 大运 + 神煞
      var cS=65;
      var careerBoost={'木':6,'火':8,'土':5,'金':9,'水':7};
      cS+=careerBoost[dayWuxing]||5;
      if(currentDayun){
        var dunWx=WUXING_MAP[currentDayun[0]]||'土';
        if(dunWx===dayWuxing) cS+=8; // 大运帮扶
        else if(dunWx!==WUXING_MAP[dayGan]) cS+=3; // 大运生扶
      }
      if(shensha['天乙贵人']) cS+=6;
      if(shensha['文昌']) cS+=5;
      if(shensha['驿马']) cS+=3;
      if(shensha['羊刃']) cS-=3;
      cS=Math.min(95,Math.max(50,cS));

      var data={
        year:y,month:m,day:d,hour:h,gender:gender,
        dayMaster:dayMaster,dayWuxing:dayWuxing,
        pillars:pillars,wxCount:wxCount,isStrong:isStrong,
        currentDayun:currentDayun,dayunAge:dayunAge,
        shensha:shensha,organ:WUXING_ORGAN[dayWuxing]||'脾胃',
        careerField:WUXING_CAREER[dayWuxing]||'综合'
      };

      hcdRender(data,hS,cS);
    }

    // 降级模式（后端不可用时）
    function hcdRenderFallback(y,m,d,h,gender){
      var dayGan=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'][(y-4)%10];
      var dayZhi=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][(y-4)%12];
      var dayWuxing=WUXING_MAP[dayGan]||'土';
      var dayMaster=dayGan+dayZhi;
      var wxCount={'木':0,'火':0,'土':0,'金':0,'水':0};
      wxCount[dayWuxing]=2;
      var isStrong=false;
      var hS=65+({'木':8,'火':5,'土':7,'金':6,'水':9}[dayWuxing]||5);
      var cS=65+({'木':6,'火':8,'土':5,'金':9,'水':7}[dayWuxing]||5);
      hS=Math.min(88,Math.max(55,hS));
      cS=Math.min(88,Math.max(55,cS));
      var data={year:y,month:m,day:d,hour:h,gender:gender,dayMaster:dayMaster,dayWuxing:dayWuxing,pillars:{},wxCount:wxCount,isStrong:isStrong,currentDayun:'',dayunAge:'',shensha:{},organ:WUXING_ORGAN[dayWuxing]||'脾胃',careerField:WUXING_CAREER[dayWuxing]||'综合',fallback:true};
      hcdRender(data,hS,cS);
    }

    function hcdRender(data,hS,cS){
      var html='';
      // 排盘信息条
      html+='<div class="hcd-paipan-bar" style="background:rgba(201,168,76,.06);border:1px solid rgba(201,168,76,.2);border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12px;line-height:1.8">';
      html+='<b style="color:var(--gold)">📋 排盘信息</b> ';
      html+=data.year+'年'+data.month+'月'+data.day+'日'+data.hour+'时 · ';
      html+='日主：<b>'+data.dayMaster+'</b>（'+data.dayWuxing+'行） · ';
      html+=(data.isStrong?'<b style="color:#4a9a6e">身强</b>':'<b style="color:#e74c3c">身弱</b>')+' · ';
      if(data.currentDayun) html+='大运：<b>'+data.currentDayun+'</b>（'+data.dayunAge+'） · ';
      html+='对应脏腑：<b>'+data.organ+'</b>';
      if(data.fallback) html+=' <span style="color:#e67e22">⚠️ 后端排盘不可用，使用降级模式</span>';
      html+='</div>';

      html+='<div class="hcd-dual">';
      html+='<div class="hcd-card health"><div class="hcd-card-title">🩺 健康维度（8 维总分）</div><div class="hcd-card-score">'+hS+'</div><div class="hcd-card-bar"><div class="hcd-card-fill" style="width:'+hS+'%"></div></div><div class="hcd-card-meta">日主五行：<b style="color:#4a9a6e">'+data.dayWuxing+'行</b>（'+data.organ+'）<br>身强身弱：'+(data.isStrong?'<b style="color:#4a9a6e">身强</b>':'<b style="color:#e74c3c">身弱</b>')+'<br>五行分布：木'+data.wxCount['木']+' 火'+data.wxCount['火']+' 土'+data.wxCount['土']+' 金'+data.wxCount['金']+' 水'+data.wxCount['水']+'<br>状态：'+(hS>=80?'<b style="color:#4a9a6e">优 ⭐</b>':hS>=70?'<b style="color:var(--gold)">良 ✅</b>':'<b style="color:#e74c3c">需调理 ⚠️</b>')+'</div></div>';
      html+='<div class="hcd-card career"><div class="hcd-card-title">💼 事业维度（8 维总分）</div><div class="hcd-card-score">'+cS+'</div><div class="hcd-card-bar"><div class="hcd-card-fill" style="width:'+cS+'%"></div></div><div class="hcd-card-meta">宜业方向：<b style="color:#4a8aa8">'+data.careerField+'</b><br>日主五行：<b style="color:#4a8aa8">'+data.dayWuxing+'行</b>'+(data.currentDayun?'<br>当前大运：'+data.currentDayun+'（'+data.dayunAge+'）':'')+'<br>状态：'+(cS>=80?'<b style="color:#4a8aa8">事业上升期 🚀</b>':cS>=70?'<b style="color:var(--gold)">稳步前进 ✅</b>':'<b style="color:#e67e22">蛰伏积累 ⚠️</b>')+'</div></div>';
      html+='</div>';

      html+='<div class="hcd-12grid-title">🗺 12 领域矩阵（生活全方位覆盖）</div>';
      html+='<div class="hcd-12grid-subtitle">点击任一领域卡片展开 8 维明细 · 共 24 条行动建议</div>';
      html+='<div class="hcd-12grid">';
      Object.keys(HCD_LIFE_12).forEach(function(k){
        var it=HCD_LIFE_12[k];
        var baseScore=k==='health'?hS:k==='career'?cS:55+({'木':8,'火':6,'土':5,'金':7,'水':9}[data.dayWuxing]||5);
        var weighted=Math.round(baseScore*it.weight);
        weighted=Math.min(95,Math.max(45,weighted));
        var star=getStars(weighted);
        var verdict=weighted>=80?'优 ⭐':weighted>=70?'良 ✅':'需关注 ⚠️';
        html+='<ml-tap class="hcd-12cell" onclick="hcdToggleDetail(\''+k+'\')" variant="card" role="button" tabindex="0"><span class="icon">'+it.icon+'</span><b>'+it.name+'</b><div class="score" style="color:'+(k==='health'?'#4a9a6e':k==='career'?'#4a8aa8':'var(--gold)')+'">'+weighted+'</div><div class="stars" style="color:#4a9a6e">'+star+'</div><div class="verdict">'+verdict+'</div></ml-tap>';
      });
      html+='</div>';
      html+='<div id="hcdDetailArea"></div>';

      html+='<div class="hcd-action-list"><h3>📋 12 领域行动清单（每周自检必做）</h3><ol>';
      html+='<li><b style="color:#4a9a6e">健康：</b>'+data.organ+'需重点养护 · 每周 3 次有氧运动 + 23 点前睡 + 饮食清淡</li>';
      html+='<li><b style="color:#4a8aa8">事业：</b>适合'+data.careerField+'方向 · 每周 1 次行业社交 + 每日 1 小时精进专业 + 主动汇报成果</li>';
      html+='<li><b style="color:#e91e63">婚姻：</b>每周 1 次约会 + 每月 1 次深度对话 + 重要日子必纪念</li>';
      html+='<li><b style="color:#ff9800">家庭：</b>每日陪伴 30 分钟 + 每周家庭会议 + 父母每周联系</li>';
      html+='<li><b style="color:#9c27b0">学业：</b>每日 1 小时学习 + 每月 1 本专业书 + 每年 1 门课程</li>';
      html+='<li><b style="color:var(--gold)">财务：</b>月度预算 + 季度复盘 + 应急金 6 个月支出 + 定投计划</li>';
      html+='<li><b style="color:#00bcd4">社交：</b>每月 2 次朋友聚会 + 每年 5 个新朋友 + 弱关系维护</li>';
      html+='<li><b style="color:#7e57c2">精神：</b>每日冥想 15 分钟 + 每月 1 次读书会 + 写日记</li>';
      html+='<li><b style="color:#26a69a">流年：</b>年初定计划 + 年中复盘 + 关注太岁方位</li>';
      html+='<li><b style="color:#5c6bc0">大运：</b>'+(data.currentDayun?'当前'+data.currentDayun+'大运，':'')+'顺势而为 + 把握转折年</li>';
      html+='<li><b style="color:#e74c3c">化解：</b>每月查太岁 + 每年风水调整 + 佩戴吉祥物</li>';
      html+='<li><b style="color:#8d6e63">传承：</b>家训口授 + 每年家祭 + 子女教育规划</li>';
      html+='</ol></div>';

      html+='<div class="hcd-verdict"><b style="color:var(--gold)">🎯 双核+12 领域综合判读：</b><br>';
      html+='① 健康 <b style="color:#4a9a6e">'+hS+'</b> 分 + 事业 <b style="color:#4a8aa8">'+cS+'</b> 分 = 整体态势：'+(Math.min(hS,cS)>=80?'<b style="color:#4a9a6e">稳健上扬期 🚀</b>':Math.min(hS,cS)>=70?'<b style="color:var(--gold)">稳步前进期 ✅</b>':'<b style="color:#e74c3c">需重点调理期 ⚠️</b>')+'<br>';
      html+='② 日主<b>'+data.dayMaster+'</b>（'+data.dayWuxing+'行）—— 对应'+data.organ+'系统，宜业方向'+data.careerField+'<br>';
      html+='③ 五行分布：木'+data.wxCount['木']+' 火'+data.wxCount['火']+' 土'+data.wxCount['土']+' 金'+data.wxCount['金']+' 水'+data.wxCount['水']+'，'+(data.isStrong?'身强宜克泄':'身弱宜生扶')+'<br>';
      html+='④ 化解要点：<b style="color:#4a9a6e">健康打底</b>（'+data.organ+'）+ <b style="color:#4a8aa8">事业领跑</b>（'+data.careerField+'）+ 家庭稳固 + 家业传承</div>';

      html+='<div class="hcd-source">📜 综合《滴天髓》《子平真诠》《穷通宝鉴》《三命通会》《黄帝内经》《千金要方》等古籍依据</div>';

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
      showToast('🖨 准备打印当前双核仪表盘报告');
      setTimeout(function(){window.print();},300);
    }

    window.addEventListener('DOMContentLoaded',function(){setTimeout(hcdCalculate,300);});
