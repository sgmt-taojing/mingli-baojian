
var KB=window.NIHAISHA_KB||{};
// 合并全量移植batch（优先级最高，覆盖精简版）
// 蒸馏版KB已内置全部模块
// 合并经典方剂KB（11份桌面PDF/87721字）

window.NIHAISHA_KB = KB;
var _ld=document.getElementById('kbLoading');if(_ld)_ld.style.display='none';

// 46个模块，按分类分组（排除_meta）
var tabGroups=[
{group:'📚 课程模块',tabs:[
{id:'index',name:'📋 总览'},
{id:'tianji',name:'🌟 天纪'},
{id:'shanghanlun',name:'📖 伤寒论'},
{id:'jingui',name:'📕 金匮要略'},
{id:'huangdi',name:'🏺 黄帝内经'},
{id:'bencao',name:'🌱 神农本草'},
{id:'acupuncture',name:'📌 针灸大成'},
{id:'bagang',name:'⚖️ 八纲辨证'},
{id:'zhongjing-xinfa',name:'🔮 仲景心法'},
{id:'fuyang',name:'☀️ 扶阳论坛'},
{id:'yijinjing',name:'🧘 易筋经'},
{id:'liangdong',name:'📺 梁冬对话'},
{id:'stanford',name:'🎓 斯坦福演讲'},
{id:'clinical-cases',name:'📋 临床案例'},
{id:'formula-patterns',name:'💊 方证对应'},
{id:'symptom-index',name:'🩺 症状索引'},
{id:'six-channel',name:'☯️ 六经辨证'},
{id:'lesson-map',name:'🗺️ 课次地图'},
{id:'learning-entry',name:'📚 学习入口'},
{id:'beginner-questions',name:'💬 初学问答'},
{id:'usage-scenarios',name:'🎯 使用场景'},
{id:'ebooks',name:'📖 电子书'},
{id:'audio-collection',name:'🎧 音频合集'}
]},
{group:'💊 经典与方剂',tabs:[

]},
{group:'📝 笔记模块',tabs:[
{id:'notes-shanghan',name:'📝 伤寒笔记'},
{id:'notes-jingui',name:'📝 金匮笔记'},
{id:'notes-huangdi',name:'📝 内经笔记'},
{id:'notes-bencao',name:'📝 本草笔记'},
{id:'notes-acupuncture-dacheng',name:'📝 针灸笔记'},
{id:'notes-shanghan-scan-essence',name:'🔍 伤寒扫描精华'},
{id:'notes-bencao-scan-essence',name:'🔍 本草扫描精华'},
{id:'notes-huangdi-scan-essence',name:'🔍 内经扫描精华'},
{id:'notes-acupuncture-dacheng-scan-essence',name:'🔍 针灸扫描精华'}
]},
,
{group:'🔗 其他',tabs:[
{id:'crossModuleThemes',name:'🔗 跨模块主题'},
{id:'mingliCorrelation',name:'🔮 命理关联'}
]}
];

var nav=document.getElementById('navTabs');
var content=document.getElementById('content');
var currentTab='index';

// Build grouped nav
tabGroups.forEach(function(g){
var section=document.createElement('div');
section.className='nav-section';
var sectionTitle=document.createElement('div');
sectionTitle.className='nav-section-title';
sectionTitle.textContent=g.group;
section.appendChild(sectionTitle);
var tabsDiv=document.createElement('div');
tabsDiv.className='nav-tabs';
g.tabs.forEach(function(t){
var btn=document.createElement('button');
btn.className='nav-tab';
btn.textContent=t.name;
btn.dataset.tabId=t.id;
btn.onclick=function(){
document.querySelectorAll('.nav-tab').forEach(function(b){b.classList.remove('active')});
btn.classList.add('active');
currentTab=t.id;
showPanel(t.id);
};
tabsDiv.appendChild(btn);
});
section.appendChild(tabsDiv);
nav.appendChild(section);
});

// Activate first tab
document.querySelector('.nav-tab').classList.add('active');

function escapeHTML(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function renderValue(v,depth){
var html='';
if(v===null||v===undefined){return '<p>—</p>';}
if(typeof v==='string'){
html+='<p>'+escapeHTML(v)+'</p>';
}else if(Array.isArray(v)){
html+='<ul>';
v.forEach(function(it){
if(typeof it==='string'){
html+='<li>'+escapeHTML(it)+'</li>';
}else if(typeof it==='object'&&it){
var parts=[];
if(it.title)parts.push('<b>'+escapeHTML(it.title)+'</b>');
if(it.name)parts.push('<b>'+escapeHTML(it.name)+'</b>');
if(it.desc)parts.push(escapeHTML(it.desc));
if(it.content)parts.push(escapeHTML(it.content));
if(it.theory)parts.push(escapeHTML(it.theory));
if(it.fang)parts.push('方剂：<b>'+escapeHTML(it.fang)+'</b>');
if(it.zheng)parts.push('证候：'+escapeHTML(it.zheng));
if(it.jiaoji)parts.push('禁忌：'+escapeHTML(it.jiaoji));
if(it.source)parts.push('<i style="color:var(--paper3)">来源：'+escapeHTML(it.source)+'</i>');
if(it.tip)parts.push(escapeHTML(it.tip));
for(var k in it){
if(['title','name','desc','content','theory','fang','zheng','jiaoji','source','tip'].indexOf(k)<0){
parts.push('<b>'+k+'：</b>'+escapeHTML(typeof it[k]==='string'?it[k]:JSON.stringify(it[k])));
}
}
html+='<li>'+parts.join(' · ')+'</li>';
}else{
html+='<li>'+escapeHTML(String(it))+'</li>';
}
});
html+='</ul>';
}else if(typeof v==='object'){
Object.keys(v).forEach(function(key){
var sv=v[key];
html+='<span class="sub-title">◆ '+escapeHTML(key)+'</span>';
if(typeof sv==='string'){
html+='<p>'+escapeHTML(sv)+'</p>';
}else if(Array.isArray(sv)){
html+='<ul>';
sv.forEach(function(it){
if(typeof it==='string'){html+='<li>'+escapeHTML(it)+'</li>';}
else if(typeof it==='object'&&it){
var parts=[];
for(var k in it){
if(typeof it[k]==='string'){parts.push('<b>'+k+'：</b>'+escapeHTML(it[k]));}
}
html+='<li>'+parts.join(' · ')+'</li>';
}else{html+='<li>'+escapeHTML(String(it))+'</li>';}
});
html+='</ul>';
}else if(typeof sv==='object'&&sv){
html+='<div style="margin-left:12px;padding-left:12px;border-left:2px solid var(--border)">';
html+=renderValue(sv,depth+1);
html+='</div>';
}else{
html+='<p>'+escapeHTML(String(sv))+'</p>';
}
});
}else{
html+='<p>'+escapeHTML(String(v))+'</p>';
}
return html;
}

function showPanel(id){
content.innerHTML='';
var p=document.createElement('div');
p.className='panel active';
var html='';
try{
var data=KB[id];
if(!data){html='<div class="card"><div class="card-body">该模块内容正在整理中...</div></div>';p.innerHTML=html;content.appendChild(p);return;}

if(typeof data==='object'){
Object.keys(data).forEach(function(key){
var v=data[key];
var title=key.replace(/_/g,' ');
html+='<div class="card"><div class="card-title">'+escapeHTML(title)+'</div><div class="card-body">';
html+=renderValue(v,0);
html+='</div></div>';
});
}else{
html='<div class="card"><div class="card-body"><p>'+escapeHTML(String(data))+'</p></div></div>';
}
}catch(e){
html='<div class="card"><div class="card-body">内容加载中...'+escapeHTML(e.message)+'</div></div>';
}
if(!html){html='<div class="card"><div class="card-body">该模块内容正在整理中...</div></div>';}
p.innerHTML=html;
content.appendChild(p);
}

function doSearch(){
var q=document.getElementById('globalSearch').value.trim().toLowerCase();
if(!q){showPanel(currentTab);return;}
var results=[];
var searchIn=function(obj,path){
if(typeof obj==='string'){
if(obj.toLowerCase().indexOf(q)>-1){results.push({title:path,body:obj.substring(0,200)});}
}else if(Array.isArray(obj)){
obj.forEach(function(it,i){searchIn(it,path+'['+i+']');});
}else if(typeof obj==='object'&&obj){
Object.keys(obj).forEach(function(k){searchIn(obj[k],path+'.'+k);});
}
};
searchIn(KB,'');
var p=document.createElement('div');
p.className='panel active';
var html='';
if(results.length===0){
html='<div class="card"><div class="card-body">未找到包含"'+escapeHTML(q)+'"的内容</div></div>';
}else{
html='<div class="card"><div class="card-title">搜索结果（'+results.length+'条）</div><div class="card-body">';
results.slice(0,50).forEach(function(r){
html+='<p><b>'+escapeHTML(r.title)+'</b></p><p style="color:var(--paper3);font-size:12px;margin-bottom:10px">'+escapeHTML(r.body)+'</p>';
});
html+='</div></div>';
}
p.innerHTML=html;
content.innerHTML='';
content.appendChild(p);
}

document.getElementById('globalSearch').addEventListener('keydown',function(e){if(e.key==='Enter')doSearch();});
showPanel('index');


(function(){
  if (window.__r41_d_kb) return; window.__r41_d_kb = true;
  var sections = [
    {id:'rd-knowledge-h', title:'🩺 健康速查', score:'78分', color:'#4a9a6e', desc:'气血·脾胃·心肾·肝胆·睡眠·情绪·体质·寿元', tip:'八维均衡：少熬夜多运动；偏弱维度及时调理'},
    {id:'rd-knowledge-c', title:'💼 事业速查', score:'82分', color:'#4a8aa8', desc:'正财·偏财·官运·学业·创业·升迁·同事·合作', tip:'八维共进：抓住升迁窗口，偏财慎行'}
  ];
  var html = '';
  sections.forEach(function(s){
    html += '<div class="bazi-module"><ml-tap class="bazi-module-title collapsed" onclick="toggleBaziModule(this)" style="border-left:4px solid '+s.color+'" variant="card" role="button" tabindex="0">'+s.title+' <span class="toggle-icon">▼</span></ml-tap>';
    html += '<div class="bazi-module-content"><div style="padding:12px"><span style="font-size:1.4em;font-weight:bold;color:'+s.color+'">'+s.score+'</span><p>'+s.desc+'</p><p><b>建议：</b>'+s.tip+'</p></div></div></div>';
  });
  var anchor = document.querySelector('.container, .content, main, body');
  if (anchor) {
    var div = document.createElement('div');
    div.id = 'r41-d-knowledge-core';
    div.innerHTML = html;
    anchor.insertBefore(div, anchor.firstChild);
  }
})();
