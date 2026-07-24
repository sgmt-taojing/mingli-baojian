/**
 * parse_natural_query(text) — 自然语言查询路由
 * 输入："LIU套5815" / "车牌京A12345" / "我想算八字" 等
 * 输出：{ module, data, confidence, raw }
 */
(function (global) {
  'use strict';

  var COMMON_SURNAMES = '刘李王张陈杨赵黄周吴徐孙马朱胡郭林罗郑梁谢宋唐许韩冯邓曹彭曾萧田董袁潘于蒋蔡余杜叶程苏魏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付方白邹孟熊秦邱江尹薛闫段雷侯龙史陶黎贺顾毛郝龚邵万钱严覃武戴莫孔向汤';

  function parse_natural_query(text) {
    var raw = (text || '').trim();
    var result = { module: null, data: {}, confidence: 0, raw: raw };

    if (!raw) return result;

    // P1: 手机号
    var mMobile = raw.match(/1[3-9]\d{9}/);
    if (mMobile) {
      result.module = 'mobile';
      result.confidence = 0.9;
      result.data = { s0: mMobile[0] };
      return result;
    }

    // P2: 车牌（9 省+1 直辖市+军牌）
    var mCar = raw.match(/([京津沪渝蒙藏疆宁桂黑吉辽晋冀豫黔皖湘鄂粤琼甘青藏川云][A-Z][A-HJ-NP-Z0-9]{5,6})/);
    if (mCar) {
      result.module = 'license';
      result.confidence = 0.9;
      result.data = { s0: mCar[1] };
      return result;
    }

    // P3: 精确关键词（25+ 模块）
    var rules = [
      ['taisui',    /太岁|犯太岁|本命年|冲太岁/],
      ['zeri',      /择日|黄道吉日|吉日|动土|开业/],
      ['huangli',   /老黄历|今日宜忌|宜忌表/],
      ['bazi',      /八字|四柱|命理|排盘|命格/],
      ['liuyao',    /六爻|纳甲|梅花易数/],
      ['qimen',     /奇门|遁甲/],
      ['ziwei',     /紫微|星盘|十四主星/],
      ['xingming',  /姓名|起名|改名|测名/],
      ['shiye',     /事业|工作|职场|升职|跳槽|面试/],
      ['lifeplan',  /人生|规划|生涯|蓝图/],
      ['lifeindex', /健康|生命指数|寿命|体检/],
      ['zhongyi',   /体质|中医|养生|经络/],
      ['music',     /音乐|疗愈|五音|宫商角徵羽/],
      ['yunshi',    /运势|流年|今年|明年/],
      ['caiyun',    /财运|偏财|正财|破财|投资/],
      ['ganqing',   /感情|婚姻|桃花|恋爱|配偶/],
      ['yinyuan',   /姻缘|对象|脱单/],
      ['fengshui',  /风水|方位|户型|办公室|摆件/],
      ['zodiac',    /属相|生肖|本命/],
      ['huajie',    /化解|破太岁|安太岁/],
      ['liuren',    /六壬|大六壬/],
      ['meihua',    /梅花|易数/],
      ['yijing',    /易经|周易|卦象/],
    ];
    for (var i = 0; i < rules.length; i++) {
      if (rules[i][1].test(raw)) {
        result.module = rules[i][0];
        result.confidence = 0.85;
        if (rules[i][0] === 'xingming') {
          // 提取中文名：去掉"起名/测名/测"等前缀，取首个 2-4 字中文连续块
          var stripped = raw.replace(/起名|改名|测名|测|帮我|看看/g, '');
          var mName = stripped.match(/[\u4e00-\u9fa5]{2,4}/);
          result.data = { s0: mName ? mName[0] : raw };
        }
        return result;
      }
    }

    // P4: 拼音姓 + 数字 兜底（"LIU 5815" / "liu5815" / "LIU套5815"）
    var mPinYinDigit = raw.match(/^([A-Za-z]{2,8})[\s\u3000套]*(\d{3,6})$/);
    if (mPinYinDigit) {
      var pinyin = mPinYinDigit[1];
      var digits2 = mPinYinDigit[2];
      var pinyinSurnames = ['liu', 'li', 'wang', 'zhang', 'chen', 'yang', 'zhao', 'huang', 'zhou', 'wu', 'xu', 'sun', 'ma', 'zhu', 'hu', 'guo', 'lin', 'luo', 'zheng', 'liang', 'xie', 'song', 'tang', 'he', 'gao', 'feng', 'deng', 'cao'];
      if (pinyinSurnames.indexOf(pinyin.toLowerCase()) >= 0) {
        if (/^\d{4}$/.test(digits2)) {
          result.module = 'mobile';
          result.confidence = 0.65;
          result.data = { s0: digits2, _pinyin: pinyin };
        } else {
          result.module = 'xingming';
          result.confidence = 0.75;
          result.data = { s0: pinyin, s1: digits2 };
        }
        return result;
      }
    }

    // P5: 姓 + 数字 兜底（"刘青云 13579" / "王某 88"）
    var mNameDigit = raw.match(/([\u4e00-\u9fa5])[\u4e00-\u9fa5]{1,5}[\s\u3000]*(\d{2,6})/);
    if (mNameDigit) {
      var name2 = mNameDigit[1];
      var fullname = mNameDigit[0].replace(/\d+\s*$/, '').trim();
      var digits3 = mNameDigit[2];
      if (COMMON_SURNAMES.indexOf(name2) >= 0 && fullname.length >= 2 && fullname.length <= 4) {
        if (/^\d{4}$/.test(digits3)) {
          result.module = 'mobile';
          result.confidence = 0.6;
          result.data = { s0: digits3, _name: fullname };
          return result;
        }
        result.module = 'xingming';
        result.confidence = 0.7;
        result.data = { s0: fullname, s1: digits3 };
        return result;
      }
    }

    // P6: 纯中文名（2-4 字）— 仅匹配常见姓氏开头
    var mPureName = raw.match(/^([\u4e00-\u9fa5])([\u4e00-\u9fa5]{1,3})$/);
    if (mPureName && COMMON_SURNAMES.indexOf(mPureName[1]) >= 0) {
      result.module = 'xingming';
      result.confidence = 0.7;
      result.data = { s0: mPureName[0] };
      return result;
    }

    return result;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parse_natural_query: parse_natural_query };
  }
  if (typeof global !== 'undefined') {
    global.parse_natural_query = parse_natural_query;
  }
  if (typeof window !== 'undefined') {
    window.parse_natural_query = parse_natural_query;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));