
(function(){
  // 读取用户数据
  var profile = {};
  try { profile = JSON.parse(localStorage.getItem('userProfile') || '{}'); } catch(e){console.warn(e.message)}
  var name = profile.name || profile.nickname || '缘主';
  var avatar = profile.avatar || '🦞';
  var bazi = profile.bazi || '';
  var reports = parseInt(localStorage.getItem('_total_reports') || '0', 10);
  var days = Math.floor((Date.now() - parseInt(localStorage.getItem('_first_visit') || Date.now(), 10)) / 86400000);
  var points = parseInt(localStorage.getItem('_feedback_points') || '0', 10);

  document.getElementById('cardName').textContent = name;
  document.getElementById('cardAvatar').textContent = avatar;
  if (bazi) {
    document.getElementById('cardBazi').textContent = bazi;
  }
  document.getElementById('statReports').textContent = reports;
  document.getElementById('statDays').textContent = Math.max(1, days);
  document.getElementById('statPoints').textContent = points;

  // 首次访问打点
  if (!localStorage.getItem('_first_visit')) {
    localStorage.setItem('_first_visit', Date.now().toString());
  }
})();

function shareTo(channel){
  var profile = {};
  try { profile = JSON.parse(localStorage.getItem('userProfile') || '{}'); } catch(e){console.warn(e.message)}
  var name = profile.name || '缘主';
  var url = location.origin + '/divination-hub.html';
  var text = name + ' 邀您体验命理宝鉴 · 命理宝鉴';

  if (channel === 'link') {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function(){
        showToast('链接已复制');
      }, function(){ showToast('复制失败，请手动复制'); });
    } else {
      showToast('浏览器不支持自动复制');
    }
    return;
  }

  if (channel === 'wechat' && navigator.share) {
    navigator.share({ title: '命理宝鉴', text: text, url: url }).catch(function(){});
    return;
  }

  if (channel === 'poster') {
    showToast('海报生成中…请截图保存名片');
    setTimeout(function(){
      var card = document.getElementById('cardPreview');
      card.style.boxShadow = '0 0 30px rgba(201,168,76,.4)';
      card.style.transform = 'scale(1.02)';
      card.style.transition = 'all .3s';
      setTimeout(function(){
        card.style.boxShadow = '';
        card.style.transform = '';
      }, 2000);
    }, 100);
    return;
  }

  if (channel === 'save') {
    showToast('请截图保存名片');
    return;
  }

  showToast('分享功能开发中');
}

function showToast(msg){
  var existing = document.querySelector('.toast');
  if (existing) existing.remove();
  var t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function(){ t.remove(); }, 2500);
}
