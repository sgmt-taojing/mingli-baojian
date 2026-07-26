
/* ===== R37-B doctor-elder 双核仪表盘 ===== */
function renderElderDashboardR37(){
  var hS=72;var cS=70;
  var h='<div class="dr-dash">';
  h+='<div class="dr-dash-title">👴 长者安康·健康事业双核（8 维 + 6 长者专属 + 18 古籍）</div>';
  h+='<div class="dr-dash-dual">';
  h+='<div class="dr-card health"><div class="dr-card-title">🩺 健康维度</div><div class="dr-card-score">'+hS+'<span style="font-size:13px;opacity:.6">/100</span></div><div class="dr-card-bar"><div class="dr-card-fill" style="width:'+hS+'%"></div></div><div style="font-size:11px;opacity:.7;margin-top:6px">🩸 气血 + 🍚 脾胃 + 💗 心肾 + 🌿 肝胆</div></div>';
  h+='<div class="dr-card career"><div class="dr-card-title">💼 事业维度</div><div class="dr-card-score">'+cS+'<span style="font-size:13px;opacity:.6">/100</span></div><div class="dr-card-bar"><div class="dr-card-fill" style="width:'+cS+'%"></div></div><div style="font-size:11px;opacity:.7;margin-top:6px">💰 正财 + 👔 官运 + 📈 升迁 + 🤝 合作</div></div>';
  h+='</div>';
  h+='<div style="margin:10px 0 8px;color:var(--paper3);font-size:12px;letter-spacing:1.5px">📋 6 长者专属维度</div>';
  var ELDER_6D={"颐养":{"label":"🏡 颐养","icon":"🏡","tip":"退休生活·含饴弄孙·养花种草"},"天伦":{"label":"👨‍👩‍👧‍👦 天伦","icon":"👨‍👩‍👧‍👦","tip":"儿孙绕膝·家庭和睦·三代同堂"},"康乐":{"label":"🎶 康乐","icon":"🎶","tip":"琴棋书画·太极气功·老年大学"},"清修":{"label":"📿 清修","icon":"📿","tip":"诵经念佛·静坐冥想·心灵安顿"},"传承":{"label":"🏛 传承","icon":"🏛","tip":"家训口授·教子教孙·家风延续"},"寿元":{"label":"🎂 寿元","icon":"🎂","tip":"养生长寿·节制饮食·顺应四时"}};
  h+='<div class="dr-6grid">';
  Object.keys(ELDER_6D).forEach(function(k){var it=ELDER_6D[k];
    h+='<div class="dr-6cell"><span class="icon">'+it.icon+'</span><b>'+it.label+'</b><div class="tip">'+it.tip+'</div></div>';
  });
  h+='</div>';
  h+='<div class="dr-verdict"><b style="color:var(--gold)">👴 长者安康判读：</b><br>① 健康 '+hS+' 分（气血/脾胃/心肾/肝胆为主）—— 长者宜<b>清淡饮食+适度运动+定期体检</b> ② 事业 '+cS+' 分（退而不休+含饴弄孙+经验传承）—— 长者事业宜<b>顾问/导师/家族掌舵</b> ③ 6 长者专属维度全覆盖 ④ 化解要点：颐养天年+天伦之乐+传承家风</div>';
  h+='<div class="dr-source">📜 综合《黄帝内经》《千金要方》《伤寒杂病论》《本草纲目》《针灸甲乙经》《素问注》《寿亲养老新书》《养老奉亲书》《摄生消息论》《老老恒言》《滴天髓》《子平真诠》《三命通会》《了凡四训》《阴骘文》《太上感应篇》《玉历宝钞》《三世因果经》共 18 部古籍</div>';
  h+='</div>';
  return h;
}


renderElderDashboardR37_inject()

document.getElementById("elderDashboard").innerHTML=renderElderDashboardR37();