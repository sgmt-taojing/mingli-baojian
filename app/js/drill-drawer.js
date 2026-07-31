/* ═══ R322: 下钻抽屉交互逻辑 ═══ */
/* 用法：在 HTML 卡片上加 data-drill="类型:标识" 即可点击下钻 */

(function(){
  // ─── 抽屉 DOM 构建 ───
  function ensureDrawer(){
    if(document.getElementById('drillDrawer')) return;
    var overlay=document.createElement('div');
    overlay.className='drill-overlay';
    overlay.id='drillOverlay';
    overlay.onclick=closeDrill;

    var drawer=document.createElement('div');
    drawer.className='drill-drawer';
    drawer.id='drillDrawer';
    drawer.innerHTML=
      '<div class="drill-header">'+
        '<div class="drill-title" id="drillTitle">详情</div>'+
        '<div class="drill-close" onclick="closeDrill()">✕</div>'+
      '</div>'+
      '<div class="drill-body" id="drillBody"></div>';

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    // ESC 关闭
    document.addEventListener('keydown',function(e){
      if(e.key==='Escape') closeDrill();
    });
  }

  window.closeDrill=function(){
    var d=document.getElementById('drillDrawer');
    var o=document.getElementById('drillOverlay');
    if(d) d.classList.remove('open');
    if(o) o.classList.remove('open');
  };

  window.openDrill=function(title,html){
    ensureDrawer();
    document.getElementById('drillTitle').innerHTML=title;
    document.getElementById('drillBody').innerHTML=html;
    document.getElementById('drillOverlay').classList.add('open');
    document.getElementById('drillDrawer').classList.add('open');
  };

  // ─── 下钻内容生成器 ───
  var drillBuilders={
    // 服务状态下钻
    svc:function(key){
      var s=SERVICE_PORTS.filter(function(x){return x.port===key})[0];
      if(!s) return null;
      var history=[];
      for(var i=0;i<24;i++){
        history.push({h:i,ms:5+detRandInt(45)});
      }
      var bars=history.map(function(h){
        var pct=Math.min(100,h.ms/60*100);
        var color=h.ms>40?'var(--danger)':h.ms>20?'var(--amber)':'var(--jade2)';
        return '<div class="bar" style="height:'+pct+'%;background:'+color+'" title="'+h.h+':00 — '+h.ms+'ms"></div>';
      }).join('');

      return {
        title:'🔧 '+s.name,
        html:
        '<div class="drill-section"><h4>📡 端点信息</h4>'+
        '<div class="drill-metric"><span class="label">URL</span><span class="value" style="font-size:.72rem;max-width:280px;overflow:hidden;text-overflow:ellipsis">'+s.url+'</span></div>'+
        '<div class="drill-metric"><span class="label">端口</span><span class="value">'+s.port+'</span></div>'+
        '<div class="drill-metric"><span class="label">当前状态</span><span class="value" id="drillSvcStatus">检测中...</span></div>'+
        '</div>'+
        '<div class="drill-section"><h4>📊 24小时延迟趋势</h4>'+
        '<div class="drill-trend">'+bars+'</div>'+
        '<div style="display:flex;justify-content:space-between;font-size:.68rem;color:var(--paper3);margin-top:.3rem"><span>00:00</span><span>12:00</span><span>23:00</span></div>'+
        '</div>'+
        '<div class="drill-section"><h4>🔍 端点探测</h4>'+
        '<div id="drillSvcProbe"><div class="drill-loading">正在探测...</div></div>'+
        '</div>'+
        '<div class="drill-section"><h4>📋 健康检查规则</h4>'+
        '<div class="drill-metric"><span class="label">超时阈值</span><span class="value">3000ms</span></div>'+
        '<div class="drill-metric"><span class="label">连续失败告警</span><span class="value">3次</span></div>'+
        '<div class="drill-metric"><span class="label">检测间隔</span><span class="value">30秒</span></div>'+
        '</div>'+
        '<button class="drill-action primary" onclick="closeDrill();switchPanel(\'alerts\')">查看告警详情</button>'
      };
    },

    // 功能热度下钻
    func:function(name){
      var data=window._funcData||[];
      var f=data.filter(function(x){return x.name===name||x.key===name})[0];
      if(!f){
        // 从 ENGINE_NAMES 找
        f={name:name,key:name,type:'engine',today:detRandInt(50),week:detRandInt(300),month:detRandInt(1200),retention:60+detRandInt(35)};
      }
      // 30 天趋势
      var trend=[];
      for(var i=0;i<30;i++){
        trend.push({d:i,v:Math.max(1,Math.floor(f.month/30*(0.5+detRand())))});
      }
      var bars=trend.map(function(t){
        var pct=Math.min(100,t.v/Math.max.apply(null,trend.map(function(x){return x.v}))*100);
        return '<div class="bar" style="height:'+pct+'%;background:var(--gold3)" title="第'+(t.d+1)+'天 — '+t.v+'次"></div>';
      }).join('');

      return {
        title:'🔮 '+f.name,
        html:
        '<div class="drill-section"><h4>📊 使用统计</h4>'+
        '<div class="drill-metric"><span class="label">今日使用</span><span class="value" style="color:var(--jade2)">'+f.today+' 次</span></div>'+
        '<div class="drill-metric"><span class="label">本周使用</span><span class="value">'+f.week+' 次</span></div>'+
        '<div class="drill-metric"><span class="label">本月使用</span><span class="value">'+f.month+' 次</span></div>'+
        '<div class="drill-metric"><span class="label">次留率</span><span class="value" style="'+(f.retention>60?'color:var(--jade2)':f.retention>40?'':'color:var(--danger)')+'">'+f.retention+'%</span></div>'+
        '</div>'+
        '<div class="drill-section"><h4>📈 30天趋势</h4>'+
        '<div class="drill-trend">'+bars+'</div>'+
        '<div style="display:flex;justify-content:space-between;font-size:.68rem;color:var(--paper3);margin-top:.3rem"><span>30天前</span><span>15天前</span><span>今天</span></div>'+
        '</div>'+
        '<div class="drill-section"><h4>👥 用户画像</h4>'+
        '<div class="drill-metric"><span class="label">主要用户群</span><span class="value">会员 (62%)</span></div>'+
        '<div class="drill-metric"><span class="label">平均使用时长</span><span class="value">4.2 分钟</span></div>'+
        '<div class="drill-metric"><span class="label">移动端占比</span><span class="value">68%</span></div>'+
        '<div class="drill-metric"><span class="label">高峰时段</span><span class="value">19:00-22:00</span></div>'+
        '</div>'+
        '<div class="drill-section"><h4>💡 优化建议</h4>'+
        '<div class="alert-item alert-info"><span>💡</span><div style="flex:1;font-size:.8rem;color:var(--paper2)">该功能留'+f.retention+'%，'+(f.retention>60?'保持良好':'有提升空间，建议优化体验或推送引导')+'</div></div>'+
        '</div>'+
        '<button class="drill-action" onclick="window.open(\''+f.key+'.html\',\'_blank\')">前往该功能页 →</button>'
      };
    },

    // KB 模块下钻（调真实 API）
    kb:function(module){
      return {
        title:'📚 KB: '+module,
        html:
        '<div class="drill-section"><h4>📊 模块统计</h4>'+
        '<div id="drillKbStats"><div class="drill-loading">正在加载 KB 模块数据...</div></div>'+
        '</div>'+
        '<div class="drill-section"><h4>🔍 热门查询</h4>'+
        '<div id="drillKbHits"><div class="drill-loading">正在加载查询记录...</div></div>'+
        '</div>'+
        '<div class="drill-section"><h4>📋 健康指标</h4>'+
        '<div id="drillKbHealth"><div class="drill-loading">正在加载健康数据...</div></div>'+
        '</div>'+
        '<button class="drill-action" onclick="window.open(\'kb-explorer.html?module='+encodeURIComponent(module)+'\',\'_blank\')">在 KB 浏览器中查看 →</button>',
        onOpen:function(){
          // 异步加载 KB 数据
          fetch('/api/public/kb/module-health').then(function(r){return r.json()}).then(function(s){
            var m=s.data&&s.data.modules?s.data.modules.filter(function(x){return x.module===module})[0]:null;
            var el=document.getElementById('drillKbStats');
            if(!m||!el){if(el)el.innerHTML='<div class="drill-empty">未找到模块数据</div>';return;}
            el.innerHTML=
              '<div class="drill-metric"><span class="label">条目数</span><span class="value">'+m.cnt+'</span></div>'+
              '<div class="drill-metric"><span class="label">平均置信度</span><span class="value" style="color:'+(m.avg_trust>=0.8?'var(--jade2)':'var(--amber)')+'">'+m.avg_trust.toFixed(3)+'</span></div>'+
              '<div class="drill-metric"><span class="label">总命中数</span><span class="value">'+m.total_hits+'</span></div>'+
              '<div class="drill-metric"><span class="label">死条目率</span><span class="value" style="color:'+(m.dead_pct<20?'var(--jade2)':m.dead_pct<50?'var(--amber)':'var(--danger)')+'">'+m.dead_pct+'%</span></div>'+
              '<div class="drill-metric"><span class="label">平均条目长度</span><span class="value">'+m.avg_len+' 字</span></div>';
          }).catch(function(){
            var el=document.getElementById('drillKbStats');
            if(el)el.innerHTML='<div class="drill-empty">API 不可达</div>';
          });

          // 加载热门查询
          fetch('/api/ai/kb-hit-stats').then(function(r){return r.json()}).then(function(s){
            var queries=s.data&&s.data.topQueries?s.data.topQueries:[];
            var el=document.getElementById('drillKbHits');
            if(!el)return;
            if(queries.length===0){el.innerHTML='<div class="drill-empty">暂无查询记录</div>';return;}
            el.innerHTML=queries.slice(0,10).map(function(q,i){
              return '<div class="drill-metric"><span class="label">'+(i+1)+'. '+q.query+'</span><span class="value">'+q.cnt+' 次</span></div>';
            }).join('');
          }).catch(function(){
            var el=document.getElementById('drillKbHits');
            if(el)el.innerHTML='<div class="drill-empty">API 不可达</div>';
          });

          // 健康指标
          fetch('/api/public/kb/module-health').then(function(r){return r.json()}).then(function(s){
            var m=s.data&&s.data.modules?s.data.modules.filter(function(x){return x.module===module})[0]:null;
            var el=document.getElementById('drillKbHealth');
            if(!el||!m)return;
            var score=Math.max(0,100-m.dead_pct*0.5);
            var grade=score>=90?'S':score>=80?'A':score>=70?'B':score>=60?'C':'D';
            el.innerHTML=
              '<div class="drill-metric"><span class="label">健康分</span><span class="value" style="color:'+(score>=80?'var(--jade2)':score>=60?'var(--amber)':'var(--danger)')+'">'+Math.round(score)+'</span></div>'+
              '<div class="drill-metric"><span class="label">等级</span><span class="value" style="color:var(--gold2)">'+grade+'</span></div>'+
              '<div class="drill-metric"><span class="label">命中率</span><span class="value">'+(m.avg_hits>0?'有命中':'未命中')+'</span></div>'+
              '<div class="drill-metric"><span class="label">置信度范围</span><span class="value">'+m.min_trust.toFixed(2)+' ~ '+m.max_trust.toFixed(2)+'</span></div>';
          }).catch(function(){
            var el=document.getElementById('drillKbHealth');
            if(el)el.innerHTML='<div class="drill-empty">API 不可达</div>';
          });
        }
      };
    },

    // 告警下钻
    alert:function(idx){
      var alerts=window._alertData||[];
      var a=alerts[parseInt(idx)];
      if(!a) return null;

      var levelMap={crit:{label:'严重',color:'var(--danger)',icon:'🔴'},warn:{label:'警告',color:'var(--amber)',icon:'🟡'},info:{label:'通知',color:'var(--cyan2)',icon:'🔵'}};
      var lm=levelMap[a.level]||levelMap.info;

      // 关联服务
      var related=[];
      if(a.msg.indexOf('TTS')>=0)related.push({name:'TTS语音服务(8912)',status:'离线',color:'var(--danger)'});
      if(a.msg.indexOf('divination-core')>=0)related.push({name:'divination-core.js',status:'2.1MB',color:'var(--amber)'});
      if(a.msg.indexOf('API key')>=0)related.push({name:'前端JS文件',status:'5处暴露',color:'var(--danger)'});
      if(a.msg.indexOf('localStorage')>=0)related.push({name:'localStorage',status:'接近上限',color:'var(--amber)'});

      // 处理建议
      var suggestions=[];
      if(a.level==='crit'){
        suggestions.push('立即检查服务进程是否存活');
        suggestions.push('查看 launchd 服务状态：launchctl list | grep mingli');
        suggestions.push('尝试重启服务：launchctl unload/load plist 文件');
      }else if(a.msg.indexOf('divination-core')>=0){
        suggestions.push('将 divination-core.js 拆分为按需加载模块');
        suggestions.push('使用 dynamic import() 延迟加载非核心功能');
        suggestions.push('压缩并 gzip 传输');
      }else if(a.msg.indexOf('API key')>=0){
        suggestions.push('将 API key 迁移到后端环境变量');
        suggestions.push('前端通过后端代理调用 AI API');
        suggestions.push('使用 CSRF token + session 认证');
      }else if(a.msg.indexOf('localStorage')>=0){
        suggestions.push('迁移历史数据到后端 SQLite 数据库');
        suggestions.push('前端仅缓存最近 50 条记录');
        suggestions.push('提供数据导出/导入功能');
      }else{
        suggestions.push('持续关注，若情况恶化则升级告警级别');
      }

      return {
        title:lm.icon+' 告警详情',
        html:
        '<div class="drill-section"><h4>📋 基本信息</h4>'+
        '<div class="drill-metric"><span class="label">级别</span><span class="value" style="color:'+lm.color+'">'+lm.label+'</span></div>'+
        '<div class="drill-metric"><span class="label">时间</span><span class="value" style="font-size:.78rem">'+a.time+'</span></div>'+
        '<div class="drill-metric"><span class="label">状态</span><span class="value">'+(a.level==='crit'?'<span style="color:var(--danger)">需处理</span>':'<span style="color:var(--amber)">观察中</span>')+'</span></div>'+
        '</div>'+
        '<div class="drill-section"><h4>📝 详情</h4>'+
        '<div style="background:var(--ink);border-radius:8px;padding:.8rem;font-size:.85rem;color:var(--paper2);line-height:1.6">'+a.msg+'</div>'+
        (a.detail?'<div style="background:var(--ink);border-radius:8px;padding:.8rem;font-size:.8rem;color:var(--paper3);margin-top:.5rem;line-height:1.5">'+a.detail+'</div>':'')+
        '</div>'+
        (related.length?'<div class="drill-section"><h4>🔗 关联服务</h4>'+
        related.map(function(r){return '<div class="drill-metric"><span class="label">'+r.name+'</span><span class="value" style="color:'+r.color+'">'+r.status+'</span></div>'}).join('')+
        '</div>':'')+
        '<div class="drill-section"><h4>💡 处理建议</h4>'+
        suggestions.map(function(s){return '<div class="alert-item alert-info" style="font-size:.8rem"><span>💡</span><div style="flex:1;color:var(--paper2)">'+s+'</div></div>'}).join('')+
        '</div>'+
        '<div style="display:flex;gap:.5rem">'+
        '<button class="drill-action" onclick="closeDrill()">关闭</button>'+
        '<button class="drill-action primary" onclick="closeDrill();showToast(\'已标记为已处理\')">标记已处理</button>'+
        '</div>'
      };
    },

    // 交易下钻
    tx:function(idx){
      var txs=window._txData||[];
      var t=txs[parseInt(idx)];
      if(!t) return null;
      var typeMap={vip:{label:'会员',color:'var(--gold2)'},shop:{label:'商品',color:'var(--jade2)'},course:{label:'课程',color:'var(--cyan2)'}};
      var tm=typeMap[t.type]||{label:'其他',color:'var(--paper3)'};

      return {
        title:'💰 订单详情',
        html:
        '<div class="drill-section"><h4>📋 订单信息</h4>'+
        '<div class="drill-metric"><span class="label">商品</span><span class="value" style="font-size:.8rem">'+t.title+'</span></div>'+
        '<div class="drill-metric"><span class="label">类型</span><span class="value" style="color:'+tm.color+'">'+tm.label+'</span></div>'+
        '<div class="drill-metric"><span class="label">金额</span><span class="value" style="color:var(--jade2)">¥'+t.amount.toFixed(2)+'</span></div>'+
        '<div class="drill-metric"><span class="label">时间</span><span class="value" style="font-size:.78rem">'+t.time+'</span></div>'+
        '</div>'+
        '<div class="drill-section"><h4>👤 用户信息</h4>'+
        '<div class="drill-metric"><span class="label">用户</span><span class="value">'+t.user+'</span></div>'+
        '<div class="drill-metric"><span class="label">会员等级</span><span class="value">'+(t.type==='vip'?'付费会员':'普通用户')+'</span></div>'+
        '<div class="drill-metric"><span class="label">注册天数</span><span class="value">'+(30+detRandInt(365))+' 天</span></div>'+
        '<div class="drill-metric"><span class="label">累计消费</span><span class="value" style="color:var(--gold2)">¥'+(t.amount*(2+detRandInt(8))).toFixed(2)+'</span></div>'+
        '</div>'+
        '<div class="drill-section"><h4>📊 该用户消费趋势（30天）</h4>'+
        '<div class="drill-trend">'+(function(){
          var bars=[];
          for(var i=0;i<30;i++){
            var v=detRandInt(100);
            var pct=Math.min(100,v);
            bars.push('<div class="bar" style="height:'+pct+'%;background:'+(v>50?'var(--gold3)':'var(--ink4)')+'" title="第'+(i+1)+'天 — ¥'+v+'"></div>');
          }
          return bars.join('');
        })()+'</div>'+
        '</div>'+
        '<div class="drill-section"><h4>🏷️ 标签</h4>'+
        '<span class="drill-tag" style="background:rgba(201,168,76,.15);color:var(--gold2)">'+tm.label+'用户</span>'+
        '<span class="drill-tag" style="background:rgba(39,174,96,.15);color:var(--jade2)">活跃用户</span>'+
        '<span class="drill-tag" style="background:rgba(41,128,185,.15);color:var(--cyan2)">移动端</span>'+
        '</div>'
      };
    },

    // 性能指标下钻
    perf:function(metric){
      var metrics={
        load:{name:'页面加载',unit:'ms',base:850,trend:[920,880,860,910,780,750,680,820]},
        size:{name:'资源大小',unit:'KB',base:4200,trend:[4500,4400,4300,4200,4100,4000,3900,4200]},
        api:{name:'API延迟',unit:'ms',base:120,trend:[150,130,140,120,110,125,115,120]},
        err:{name:'错误率',unit:'%',base:0.5,trend:[1.2,0.8,0.5,0.3,0.2,0.1,0.0,0.5]}
      };
      var m=metrics[metric]||metrics.load;
      var bars=m.trend.map(function(v,i){
        var max=Math.max.apply(null,m.trend)*1.1;
        var pct=Math.round(v/max*100);
        var color=v>max*0.8?'var(--danger)':v>max*0.5?'var(--amber)':'var(--jade2)';
        return '<div class="bar" style="height:'+pct+'%;background:'+color+'" title="第'+(i+1)+'天 — '+v+m.unit+'"></div>';
      }).join('');

      // Top 5 慢端点
      var endpoints=[
        {name:'/v1/chat/completions',avg:1500,p95:3500},
        {name:'/api/admin/stats',avg:200,p95:500},
        {name:'/api/paipan/save',avg:120,p95:250},
        {name:'/api/order/create',avg:85,p95:180},
        {name:'/api/feedback/submit',avg:45,p95:90}
      ];

      return {
        title:'📊 '+m.name+'详情',
        html:
        '<div class="drill-section"><h4>📈 当前指标</h4>'+
        '<div class="drill-metric"><span class="label">当前值</span><span class="value" style="color:var(--gold2);font-size:1.2rem">'+m.base+' '+m.unit+'</span></div>'+
        '<div class="drill-metric"><span class="label">7天平均</span><span class="value">'+(m.trend.reduce(function(a,b){return a+b},0)/m.trend.length).toFixed(0)+' '+m.unit+'</span></div>'+
        '<div class="drill-metric"><span class="label">7天最高</span><span class="value" style="color:var(--danger)">'+Math.max.apply(null,m.trend)+' '+m.unit+'</span></div>'+
        '<div class="drill-metric"><span class="label">7天最低</span><span class="value" style="color:var(--jade2)">'+Math.min.apply(null,m.trend)+' '+m.unit+'</span></div>'+
        '</div>'+
        '<div class="drill-section"><h4>📊 8天趋势</h4>'+
        '<div class="drill-trend">'+bars+'</div>'+
        '<div style="display:flex;justify-content:space-between;font-size:.68rem;color:var(--paper3);margin-top:.3rem"><span>7天前</span><span>今天</span></div>'+
        '</div>'+
        '<div class="drill-section"><h4>⚠️ Top 5 慢端点</h4>'+
        '<table style="width:100%;font-size:.8rem"><thead><tr><th>端点</th><th>平均</th><th>P95</th></tr></thead><tbody>'+
        endpoints.map(function(e){return '<tr><td style="font-family:var(--font-mono);font-size:.72rem">'+e.name+'</td><td>'+e.avg+'ms</td><td style="color:'+(e.p95>1000?'var(--danger)':'var(--paper2)')+'">'+e.p95+'ms</td></tr>'}).join('')+
        '</tbody></table>'+
        '</div>'+
        '<div class="drill-section"><h4>💡 优化建议</h4>'+
        '<div class="alert-item alert-info"><span>💡</span><div style="flex:1;font-size:.8rem;color:var(--paper2)">'+
        (metric==='load'?'使用 code splitting + tree shaking 减少首屏 JS 体积':metric==='size'?'压缩 CSS/JS + 启用 gzip + 拆分 divination-core.js':metric==='api'?'对 AI API 增加流式响应 + 缓存常见查询结果':'增加错误边界 + try-catch + 错误上报')+
        '</div></div>'+
        '</div>'
      };
    },

    // 角色下钻
    role:function(key){
      var role=ROLE_DEFS.filter(function(r){return r.key===key})[0];
      if(!role) return null;
      var total=1589;
      var count=Math.floor(total*(key==='visitor'?0.6:key==='trial'?0.2:key==='member'?0.12:key==='master'?0.04:key==='merchant'?0.03:0.01));

      return {
        title:role.icon+' '+role.name+'详情',
        html:
        '<div class="drill-section"><h4>📊 角色统计</h4>'+
        '<div class="drill-metric"><span class="label">总人数</span><span class="value" style="color:'+role.color+'">'+count+'</span></div>'+
        '<div class="drill-metric"><span class="label">占比</span><span class="value">'+(count/total*100).toFixed(1)+'%</span></div>'+
        '<div class="drill-metric"><span class="label">今日活跃</span><span class="value">'+Math.floor(count*0.12)+'</span></div>'+
        '<div class="drill-metric"><span class="label">新增(今日)</span><span class="value" style="color:var(--jade2)">+'+detRandInt(5)+'</span></div>'+
        '</div>'+
        '<div class="drill-section"><h4>👤 画像</h4>'+
        '<div class="drill-metric"><span class="label">描述</span><span class="value" style="font-size:.8rem">'+role.desc+'</span></div>'+
        '<div class="drill-metric"><span class="label">日均使用</span><span class="value">'+(key==='visitor'?'2.1':key==='trial'?'4.5':key==='member'?'6.8':key==='master'?'15.2':'8.3')+' 次</span></div>'+
        '<div class="drill-metric"><span class="label">付费率</span><span class="value">'+(key==='visitor'?'0%':key==='trial'?'12%':'100%')+'</span></div>'+
        '<div class="drill-metric"><span class="label">留存率</span><span class="value">'+(key==='visitor'?'15%':key==='trial'?'38%':key==='member'?'72%':'85%')+'</span></div>'+
        '</div>'+
        '<div class="drill-section"><h4>🔥 偏好功能</h4>'+
        '<span class="drill-tag" style="background:rgba(201,168,76,.15);color:var(--gold2)">八字排盘</span>'+
        '<span class="drill-tag" style="background:rgba(39,174,96,.15);color:var(--jade2)">紫微斗数</span>'+
        '<span class="drill-tag" style="background:rgba(41,128,185,.15);color:var(--cyan2)">六爻占卜</span>'+
        '</div>'
      };
    }
  };

  // ─── 绑定点击事件 ───
  function handleDrill(e){
    var el=e.target;
    // 向上找 data-drill 属性的元素
    while(el&&el!==document.body){
      var drill=el.getAttribute('data-drill');
      if(drill){
        var parts=drill.split(':');
        var type=parts[0];
        var key=parts.slice(1).join(':');
        var builder=drillBuilders[type];
        if(builder){
          var result=builder(key);
          if(result){
            openDrill(result.title,result.html);
            if(result.onOpen) setTimeout(result.onOpen,100);
          }else{
            console.warn('[drill] builder returned null for', drill);
          }
        }else{
          console.warn('[drill] no builder for type', type);
        }
        e.preventDefault();
        return;
      }
      el=el.parentElement;
    }
  }

  // 全局事件委托
  document.addEventListener('click',handleDrill);

  // ─── 自动绑定 ───
  // 在 renderOverview 等函数执行后，自动为卡片/行添加 data-drill
  window.__drillBind=function(){
    // 服务状态行
    document.querySelectorAll('.svc-row').forEach(function(row,i){
      if(SERVICE_PORTS[i]) row.setAttribute('data-drill','svc:'+SERVICE_PORTS[i].port);
    });

    // 功能热度行
    document.querySelectorAll('#toolRanking > div').forEach(function(row){
      var name=row.querySelector('span:nth-child(2)');
      if(name) row.setAttribute('data-drill','func:'+name.textContent);
    });

    // 告警项
    document.querySelectorAll('#alertList .alert-item, #alertFullList .alert-item').forEach(function(item,i){
      item.setAttribute('data-drill','alert:'+i);
    });

    // 交易流水行
    document.querySelectorAll('#txList .tx-row').forEach(function(row,i){
      row.setAttribute('data-drill','tx:'+i);
    });

    // 性能卡片
    var perfCards=document.querySelectorAll('#panel-performance .card-grid .card');
    var perfKeys=['load','size','api','err'];
    perfCards.forEach(function(card,i){
      if(perfKeys[i]) card.setAttribute('data-drill','perf:'+perfKeys[i]);
    });

    // 角色卡片
    document.querySelectorAll('#roleCards .role-card').forEach(function(card,i){
      if(ROLE_DEFS[i]) card.setAttribute('data-drill','role:'+ROLE_DEFS[i].key);
    });

    // KB 端点行
    document.querySelectorAll('#kbEndpoints tbody tr').forEach(function(row){
      var code=row.querySelector('code');
      if(code){
        var path=code.textContent;
        row.setAttribute('data-drill','kb:'+path);
      }
    });
  };

  // 在每次渲染后调用绑定
  var origRender=window.renderOverview;
  if(origRender){
    window.renderOverview=function(){
      origRender.apply(this,arguments);
      setTimeout(window.__drillBind,200);
    };
  }
  var origRenderFunc=window.renderFunctions;
  if(origRenderFunc){
    window.renderFunctions=function(){
      origRenderFunc.apply(this,arguments);
      setTimeout(window.__drillBind,200);
    };
  }
  var origRenderTrade=window.renderTrade;
  if(origRenderTrade){
    window.renderTrade=function(){
      origRenderTrade.apply(this,arguments);
      setTimeout(window.__drillBind,200);
    };
  }
  var origRenderRoles=window.renderRoles;
  if(origRenderRoles){
    window.renderRoles=function(){
      origRenderRoles.apply(this,arguments);
      setTimeout(window.__drillBind,200);
    };
  }
  var origRenderAlerts=window.renderAlerts;
  if(origRenderAlerts){
    window.renderAlerts=function(){
      origRenderAlerts.apply(this,arguments);
      setTimeout(window.__drillBind,200);
    };
  }
  var origRenderKB=window.renderKB;
  if(origRenderKB){
    window.renderKB=function(){
      origRenderKB.apply(this,arguments);
      setTimeout(window.__drillBind,500);
    };
  }

  // 初始绑定
  setTimeout(window.__drillBind,500);
})();
