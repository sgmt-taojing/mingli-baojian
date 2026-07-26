
// 打开权威知识库面板
function openAuthoritativePanel() {
  document.getElementById('authoritativeKnowledgePanel').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

// 关闭权威知识库面板
function closeAuthoritativePanel() {
  document.getElementById('authoritativeKnowledgePanel').style.display = 'none';
  document.body.style.overflow = 'auto';
}

// 显示知识详情
function showKnowledgeDetail(field) {
  const detail = document.getElementById('knowledgeDetailContent');
  const data = AUTHORITATIVE_KNOWLEDGE[field];
  
  if (!data) {
    detail.innerHTML = '<p style="color:var(--paper2);text-align:center;padding:40px">暂未收录该领域详细内容，正在建设中...</p>';
    document.getElementById('knowledgeDetailModal').style.display = 'block';
    return;
  }
  
  // 根据field生成详细内容（这里需要配合authoritative-knowledge-base.js的数据结构）
  let html = '<h2 style="font-family:\'Ma Shan Zheng\',serif;font-size:28px;color:var(--gold);letter-spacing:4px;margin-bottom:20px">' + data.overview.title + '</h2>';
  html += '<p style="color:var(--paper2);font-size:14px;line-height:1.8;margin-bottom:30px">' + data.overview.classic_source + '</p>';
  
  // ... 根据数据结构动态生成内容
  
  detail.innerHTML = html;
  document.getElementById('knowledgeDetailModal').style.display = 'block';
}

// 关闭知识详情
function closeKnowledgeDetail() {
  document.getElementById('knowledgeDetailModal').style.display = 'none';
}


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
