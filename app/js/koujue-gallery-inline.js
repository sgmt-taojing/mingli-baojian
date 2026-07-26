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
