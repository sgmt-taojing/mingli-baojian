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
    yanzhi: collectYanzhiData,
    huangli: collectHuangliData,
    zeri: collectZeriData,
    taisui: collectTaisuiData,
    faith: collectFaithData,
    classics: collectClassicsData,
    yijing: collectYijingData,
    meihua: collectMeihuaData,
    liuyao: collectLiuyaoData,
    liuren: collectLiurenData,
    koujue: collectKoujueData,
    nihaisha: collectNihaishaData,
    shuhan: collectShuhanData,
    acupuncture: collectAcupunctureData,
    mobile: collectMobileData,
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

  // R100: 4 新模块 collector（yanzhi/huangli/zeri/taisui）
  function collectYanzhiData() {
    var data = {};
    try {
      // yanzhi section is lazy-loaded; try common input IDs after load
      var moleChart = document.getElementById('moleChart');
      var yanzhiResult = document.getElementById('yanzhiResult');
      if (moleChart) data.hasMoleChart = true;
      if (yanzhiResult) data.hasResult = true;
      // 尝试读取面部痣相选择
      var faceArea = document.querySelector('#section-yanzhi select, #section-yanzhi input[type="text"]');
      if (faceArea) data.faceArea = faceArea.value;
    } catch (e) {}
    return data;
  }

  function collectHuangliData() {
    var data = {};
    try {
      // 黄历模块：尝试读取当前日期选择
      var huangliDate = document.getElementById('huangliDate') || document.getElementById('jiuriDate');
      if (huangliDate) data.date = huangliDate.value;
      // 尝试读取宜忌筛选
      var huangliAction = document.getElementById('huangliAction');
      if (huangliAction) data.action = huangliAction.value;
    } catch (e) {}
    return data;
  }

  function collectZeriData() {
    var data = {};
    try {
      var name = document.getElementById('zeriName');
      var birthDate = document.getElementById('zeriBirthDate');
      var birthHour = document.getElementById('zeriBirthHour');
      var sex = document.getElementById('zeriSex');
      var birthCity = document.getElementById('zeriBirthCity');
      var liveCity = document.getElementById('zeriLiveCity');
      var purpose = document.getElementById('jiuriPurpose');
      var zeriType = document.getElementById('fs-pro-zeri-type');
      var zeriStart = document.getElementById('fs-pro-zeri-start');
      var zeriEnd = document.getElementById('fs-pro-zeri-end');
      if (name) data.name = name.value;
      if (birthDate) data.birthDate = birthDate.value;
      if (birthHour) data.birthHour = birthHour.value;
      if (sex) data.sex = sex.value;
      if (birthCity) data.birthCity = birthCity.value;
      if (liveCity) data.liveCity = liveCity.value;
      if (purpose) data.purpose = purpose.value;
      if (zeriType) data.zeriType = zeriType.value;
      if (zeriStart) data.dateStart = zeriStart.value;
      if (zeriEnd) data.dateEnd = zeriEnd.value;
    } catch (e) {}
    return data;
  }

  function collectTaisuiData() {
    var data = {};
    try {
      // 太岁模块：尝试读取生辰信息（复用 bazi 表单）
      data = collectBaziData();
      // 尝试读取太岁年份选择
      var taisuiYear = document.getElementById('taisuiYear');
      if (taisuiYear) data.taisuiYear = taisuiYear.value;
    } catch (e) {}
    return data;
  }

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
  function collectFaithData() {
    var data = {};
    try {
      var deitySel = document.getElementById('deitySelect') || document.getElementById('faithDeity');
      var wishInput = document.getElementById('wishInput') || document.getElementById('faithWish');
      if (deitySel) data.deity = deitySel.value;
      if (wishInput) data.wish = wishInput.value;
      data.bazi = collectBaziData();
    } catch (e) {}
    return data;
  }
  function collectClassicsData() {
    var data = {};
    try {
      var classicSel = document.getElementById('classicSelect') || document.getElementById('classicsTopic');
      var queryInput = document.getElementById('classicQuery') || document.getElementById('classicsSearch');
      if (classicSel) data.classic = classicSel.value;
      if (queryInput) data.query = queryInput.value;
    } catch (e) {}
    return data;
  }
  function collectYijingData() {
    var data = {};
    try {
      var hexNum = document.getElementById('hexagramNum') || document.getElementById('yijingHex');
      var question = document.getElementById('yijingQuestion') || document.getElementById('yijingQ');
      if (hexNum) data.hexagram = hexNum.value;
      if (question) data.question = question.value;
    } catch (e) {}
    return data;
  }
  function collectMeihuaData() {
    var data = {};
    try {
      var mQuestion = document.getElementById('meihuaQuestion') || document.getElementById('meihuaQ');
      var mTime = document.getElementById('meihuaTime') || document.getElementById('meihuaDate');
      if (mQuestion) data.question = mQuestion.value;
      if (mTime) data.time = mTime.value;
      data.bazi = collectBaziData();
    } catch (e) {}
    return data;
  }
  function collectLiuyaoData() {
    var data = {};
    try {
      var lQuestion = document.getElementById('liuyaoQuestion') || document.getElementById('liuyaoQ');
      var lMethod = document.getElementById('liuyaoMethod') || document.getElementById('liuyaoMode');
      if (lQuestion) data.question = lQuestion.value;
      if (lMethod) data.method = lMethod.value;
      data.bazi = collectBaziData();
    } catch (e) {}
    return data;
  }
  function collectLiurenData() {
    var data = {};
    try {
      var lrQuestion = document.getElementById('liurenQuestion') || document.getElementById('liurenQ');
      var lrTime = document.getElementById('liurenTime') || document.getElementById('liurenDate');
      if (lrQuestion) data.question = lrQuestion.value;
      if (lrTime) data.time = lrTime.value;
      data.bazi = collectBaziData();
    } catch (e) {}
    return data;
  }
  function collectKoujueData() {
    var data = {};
    try {
      var kjTopic = document.getElementById('koujueTopic') || document.getElementById('koujueCategory');
      var kjQuery = document.getElementById('koujueQuery') || document.getElementById('koujueSearch');
      if (kjTopic) data.topic = kjTopic.value;
      if (kjQuery) data.query = kjQuery.value;
    } catch (e) {}
    return data;
  }
  // R102-p2: 4 新模块 collector（nihaisha/shuhan/acupuncture/mobile）
  function collectNihaishaData() {
    var data = {};
    try {
      var courseSel = document.getElementById('nihaishaCourse') || document.getElementById('nhsCourse');
      var topicSel = document.getElementById('nihaishaTopic') || document.getElementById('nhsTopic');
      if (courseSel) data.course = courseSel.value;
      if (topicSel) data.topic = topicSel.value;
      data.bazi = collectBaziData();
    } catch (e) {}
    return data;
  }

  function collectShuhanData() {
    var data = {};
    try {
      var shuhanCategory = document.getElementById('shuhanCategory') || document.getElementById('shuhanTopic');
      var shuhanQuery = document.getElementById('shuhanSearch') || document.getElementById('shuhanQuery');
      if (shuhanCategory) data.category = shuhanCategory.value;
      if (shuhanQuery) data.query = shuhanQuery.value;
      data.bazi = collectBaziData();
    } catch (e) {}
    return data;
  }

  function collectAcupunctureData() {
    var data = {};
    try {
      var acuPoint = document.getElementById('acuPoint') || document.getElementById('acupuncturePoint');
      var acuMeridian = document.getElementById('acuMeridian') || document.getElementById('acupunctureMeridian');
      if (acuPoint) data.point = acuPoint.value;
      if (acuMeridian) data.meridian = acuMeridian.value;
      // 复用中医症状
      var symptoms = document.getElementById('symptoms');
      if (symptoms) data.symptoms = symptoms.value;
    } catch (e) {}
    return data;
  }

  function collectMobileData() {
    var data = {};
    try {
      var phoneNum = document.getElementById('mobilePhone') || document.getElementById('phoneInput');
      if (phoneNum) data.phone = phoneNum.value;
      data.bazi = collectBaziData();
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
    // R94 lifeflowTimeline 特殊处理：跳转到终身三维滚动页
    if (module === 'lifeflowTimeline') {
      window.open('lifeflow-timeline.html', '_blank');
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
        showToast('请先在页面中输入相关信息，再点击「AI 分析」。');
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
