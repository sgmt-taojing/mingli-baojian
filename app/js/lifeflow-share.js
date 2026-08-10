/* ═══════════════════════════════════════════════════════
 * R95 跨报告交叉引用 helper
 * 通用：把当前表单里的八字参数打包到 URL，分享给其他报告页
 * 接收方读取 URL 参数后自动填入表单
 * ═══════════════════════════════════════════════════════ */
(function(){
  'use strict';

  function readForm(rootSel){
    var root = rootSel || document;
    var get = function(id){ var el = root.querySelector('#' + id); return el ? el.value : ''; };
    return {
      year: get('inpYear'),
      month: get('inpMonth'),
      day: get('inpDay'),
      hour: get('inpHour'),
      sex: get('inpSex'),
      dayEle: get('inpDayEle'),
      targetYear: get('inpTargetYear'),
      targetMonth: get('inpTargetMonth'),
      years: get('inpYears')
    };
  }

  function fillForm(opts){
    var map = {
      inpYear: opts.year, inpMonth: opts.month, inpDay: opts.day,
      inpHour: opts.hour, inpSex: opts.sex, inpDayEle: opts.dayEle,
      inpTargetYear: opts.targetYear, inpTargetMonth: opts.targetMonth,
      inpYears: opts.years
    };
    Object.keys(map).forEach(function(id){
      var el = document.getElementById(id);
      if (el && map[id] !== '' && map[id] != null) el.value = map[id];
    });
  }

  function parseUrl(){
    var u = new URL(location.href);
    var o = {};
    ['year','month','day','hour','sex','dayEle','targetYear','targetMonth','years'].forEach(function(k){
      if (u.searchParams.has(k)) o[k] = u.searchParams.get(k);
    });
    return o;
  }

  // 通用跳转：把当前表单数据写入 URL 并跳转
  function gotoWithForm(url){
    var data = readForm();
    var qs = [];
    Object.keys(data).forEach(function(k){
      if (data[k] !== '' && data[k] != null) qs.push(k + '=' + encodeURIComponent(data[k]));
    });
    var sep = url.indexOf('?') >= 0 ? '&' : '?';
    location.href = url + sep + qs.join('&');
  }

  // 自动初始化（页面打开时若有 URL 参数则填表）
  document.addEventListener('DOMContentLoaded', function(){
    var opts = parseUrl();
    if (Object.keys(opts).length > 0) fillForm(opts);
  });

  window.LifeflowShare = {
    readForm: readForm,
    fillForm: fillForm,
    parseUrl: parseUrl,
    gotoWithForm: gotoWithForm
  };
})();