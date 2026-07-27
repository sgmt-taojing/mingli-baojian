/**
 * hub-report-integration.js — divination-hub 统一报告接入桥接
 *
 * 为 divination-hub 的 bazi/qimen/fengshui/ziwei/music/lifeplan 等模块
 * 提供统一的"生成报告"能力，调用 ReportEngine + drawer 渲染。
 *
 * 用法：在各模块分析完成后调用 hubReport(moduleName, data)
 */
(function () {
  'use strict';

  var API = (location.hostname === '127.0.0.1' || location.hostname === 'localhost') ? 'http://127.0.0.1:8920' : '';

  // 模块中文名映射
  var MODULE_NAMES = {
    bazi: '八字命理', qimen: '奇门遁甲', fengshui: '风水堪舆',
    ziwei: '紫微斗数', zhongyi: '中医诊断', music: '五行音疗',
    lifeplan: '人生规划', lifeindex: '命理指数', tcm: '中医体质',
    yunshi: '运势', caiyun: '财运', ganqing: '感情', shiye: '事业',
    wuxing: '五行', xingming: '姓名学', yanzhi: '言值',
    huangli: '黄历', zeri: '择日', taisui: '太岁',
    faith: '信仰', classics: '经典', yijing: '易经', meihua: '梅花',
    liuyao: '六爻', liuren: '六壬', koujue: '口诀',
    mobile: '手机号', nihaisha: '倪师', shuhan: '舒晗',
    acupuncture: '针灸', general: '综合'
  };

  // 各模块数据收集函数映射
  var COLLECTORS = {
    bazi: collectBaziData,
    qimen: collectQimenData,
    fengshui: collectFengshuiData,
    ziwei: collectZiweiData,
    music: collectMusicData,
    lifeplan: collectLifeplanData,
    lifeindex: collectLifeindexData,
    zhongyi: collectZhongyiData,
    tcm: collectTcmData,
    yunshi: collectYunshiData,
    caiyun: collectCaiyunData,
    ganqing: collectGanqingData,
    shiye: collectShiyeData,
    wuxing: collectWuxingData,
    xingming: collectXingmingData,
    general: collectGeneralData
  };

  function collectBaziData() {
    var data = {};
    try {
      var birthday = document.getElementById('baziBirthday');
      var sex = document.getElementById('baziSex');
      var hour = document.getElementById('baziHour');
      if (birthday) data.birthday = birthday.value;
      if (sex) data.sex = sex.value;
      if (hour) data.hour = hour.value;
    } catch (e) {}
    return data;
  }

  function collectQimenData() {
    var data = collectBaziData();
    try {
      var qimenTime = document.getElementById('qimenTime');
      if (qimenTime) data.qimenTime = qimenTime.value;
    } catch (e) {}
    return data;
  }

  function collectFengshuiData() {
    var data = {};
    try {
      var direction = document.getElementById('fengshuiDirection');
      var houseType = document.getElementById('houseType');
      if (direction) data.direction = direction.value;
      if (houseType) data.houseType = houseType.value;
    } catch (e) {}
    return data;
  }

  function collectZiweiData() {
    return collectBaziData();
  }

  function collectMusicData() {
    var data = {};
    try {
      var mood = document.querySelector('input[name="mood"]:checked');
      var element = document.querySelector('input[name="element"]:checked');
      if (mood) data.mood = mood.value;
      if (element) data.element = element.value;
    } catch (e) {}
    return data;
  }

  function collectLifeplanData() {
    var data = collectBaziData();
    try {
      var concerns = document.getElementById('lifeplanConcerns');
      if (concerns) data.concerns = concerns.value;
    } catch (e) {}
    return data;
  }

  function collectLifeindexData() {
    return collectBaziData();
  }

  function collectZhongyiData() {
    var data = {};
    try {
      var symptoms = document.getElementById('symptoms');
      if (symptoms) data.symptoms = symptoms.value;
    } catch (e) {}
    return data;
  }

  function collectTcmData() {
    var data = {};
    try {
      var tongue = document.getElementById('tongueDesc');
      if (tongue) data.tongue = tongue.value;
    } catch (e) {}
    return data;
  }

  function collectYunshiData() { return collectBaziData(); }
  function collectCaiyunData() { return collectBaziData(); }
  function collectGanqingData() { return collectBaziData(); }
  function collectShiyeData() { return collectBaziData(); }
  function collectWuxingData() {
    var data = {};
    try {
      var wuxingInput = document.getElementById('wuxingInput');
      if (wuxingInput) data.input = wuxingInput.value;
    } catch (e) {}
    return data;
  }
  function collectXingmingData() {
    var data = {};
    try {
      var surname = document.getElementById('surname');
      var givenName = document.getElementById('givenName');
      if (surname) data.surname = surname.value;
      if (givenName) data.givenName = givenName.value;
    } catch (e) {}
    return data;
  }
  function collectGeneralData() {
    return { source: 'divination-hub', timestamp: Date.now() };
  }

  // ─── 主入口 ───────────────────────────────────────
  async function hubGenerateReport(module) {
    if (!module) module = 'general';

    // monthly 特殊处理：跳转到逐月报告页
    if (module === 'monthly') {
      window.open('monthly-report.html', '_blank');
      return;
    }
    // R91 lifeflow 特殊处理：跳转到跨维度联动报告页
    if (module === 'lifeflow') {
      window.open('lifeflow-report.html', '_blank');
      return;
    }

    // 收集数据
    var collector = COLLECTORS[module] || collectGeneralData;
    var data = collector();

    // 如果数据为空，提示用户先填写
    var keys = Object.keys(data);
    var hasData = keys.some(function(k) { return data[k]; });
    if (!hasData) {
      if (typeof ReportAdapters !== 'undefined' && ReportAdapters.drawer) {
        ReportAdapters.drawer(document.body, '请先在页面中输入相关信息，再点击「AI 分析」。');
      } else {
        alert('请先在页面中输入相关信息，再点击「AI 分析」。');
      }
      return;
    }

    // 调用报告引擎
    try {
      if (typeof ReportEngine === 'undefined') {
        console.error('[hubReport] ReportEngine 未加载');
        return;
      }

      // 显示 loading
      if (typeof ReportAdapters !== 'undefined' && ReportAdapters.drawer) {
        var loadingPanel = ReportAdapters.drawer(document.body, '⏳ 正在生成 ' + (MODULE_NAMES[module] || module) + ' 分析报告，请稍候...');
      }

      var result = await ReportEngine.generate({
        module: module,
        data: data,
        apiBase: API,
        adapter: 'drawer',
        container: document.body,
        hooks: {
          onReportStart: function () {
            // loading handled by drawText
          },
          onReportEnd: function (text, meta) {
            // done
          }
        }
      });

      // hubReport uses ReportEngine.generate() which renders directly
      // loading panel is handled inside generate()

      if (typeof ReportAdapters !== 'undefined' && ReportAdapters.drawer) {
        ReportAdapters.drawer(document.body, result.text, result.meta);
      } else {
        // fallback：console
        console.log('[hubReport]', result.text);
      }
    } catch (e) {
      console.error('[hubReport]', e);
      if (typeof ReportAdapters !== 'undefined' && ReportAdapters.drawer) {
        ReportAdapters.drawer(document.body, '报告生成失败：' + e.message);
      }
    }
  }

  // 全局入口
  if (typeof globalThis !== 'undefined') {
    globalThis.hubGenerateReport = hubGenerateReport;
  }
  if (typeof window !== 'undefined') {
    window.hubGenerateReport = hubGenerateReport;
  }
})();
