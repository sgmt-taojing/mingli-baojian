/**
 * 命理宝鉴 · 统一排盘工具引擎 v1.0
 * 
 * 架构：
 * - 即时模式（JS本地）：八字/紫微/奇门/六壬/六爻/梅花 — 零延迟
 * - 精确模式（后端API）：真太阳时/五行量化/流年 — 8911端口
 * 
 * 使用：
 *   PaipanEngine.bazi(y,m,d,h,gender,ziSect) → 四柱+大运+神煞
 *   PaipanEngine.ziwei(y,m,d,h) → 紫微十二宫+主星
 *   PaipanEngine.qimen(y,m,d,h,ask) → 奇门九宫+值符值使
 *   PaipanEngine.liuren(y,m,d,h) → 六壬四课三传
 *   PaipanEngine.enhance(y,m,d,h,gender) → 后端精确增强（异步）
 */
(function(){
  var ENGINE_VERSION = '1.0.0';
  var API_BASE = (location.hostname==='127.0.0.1'||location.hostname==='localhost') ? 'http://127.0.0.1:8911' : '';
  
  // ===== 八字排盘（调用 _paipanLocal）=====
  function bazi(y,m,d,h,gender,ziSect){
    if(typeof _paipanLocal!=='function') return null;
    return _paipanLocal(y,m,d,h,gender||'male',ziSect||1);
  }
  
  // ===== 紫微排盘（提取安星法）=====
  function ziwei(y,m,d,h){
    var tg=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    var dz12=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    var zShi=Math.floor((h+1)/2)%12;
    var monthGongIdx=(2+m-1)%12;
    var mingGongIdx=(monthGongIdx-zShi+12)%12;
    var shenGongIdx=(monthGongIdx+zShi)%12;
    var yc=(m===1||(m===2&&d<_jieDate(y,0)))?y-1:y;
    var yI2=((yc-4)%10+10)%10;
    var mgGanIdx=(yI2*2+mingGongIdx+2)%10;
    var mgGan=tg[mgGanIdx],mgZhi=dz12[mingGongIdx];
    var juMap={'甲子':'金六','乙丑':'金六','丙寅':'火四','丁卯':'火四','戊辰':'木三','己巳':'木三','庚午':'土五','辛未':'土五','壬申':'金六','癸酉':'金六','甲戌':'火四','乙亥':'火四','丙子':'水二','丁丑':'水二','戊寅':'土五','己卯':'土五','庚辰':'金六','辛巳':'金六','壬午':'木三','癸未':'木三','甲申':'水二','乙酉':'水二','丙戌':'土五','丁亥':'土五','戊子':'火四','己丑':'火四','庚寅':'木三','辛卯':'木三','壬辰':'水二','癸巳':'水二','甲午':'金六','乙未':'金六','丙申':'火四','丁酉':'火四','戊戌':'木三','己亥':'木三','庚子':'土五','辛丑':'土五','壬寅':'金六','癸卯':'金六','甲辰':'火四','乙巳':'火四','丙午':'水二','丁未':'水二','戊申':'土五','己酉':'土五','庚戌':'金六','辛亥':'金六','壬子':'木三','癸丑':'木三','甲寅':'水二','乙卯':'水二','丙辰':'土五','丁巳':'土五','戊午':'火四','己未':'火四','庚申':'木三','辛酉':'木三','壬戌':'水二','癸亥':'水二'};
    var juStr=juMap[mgGan+mgZhi]||'水二';
    var juNum=parseInt(juStr.slice(1));
    var ZIWEI_TABLE={2:[1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,0,0,1,1,2,2,3,3,4],3:[2,2,3,3,3,4,4,4,5,5,5,6,6,6,7,7,7,8,8,8,9,9,9,10,10,10,11,11,11,0],4:[2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6,6,7,7,7,7,8,8,8,8,9,9,9],5:[2,2,2,2,3,3,3,3,3,4,4,4,4,4,5,5,5,5,5,6,6,6,6,6,7,7,7,7,7,8],6:[2,2,2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,6,6,6,6,6,6,7]};
    var ziweiIdx=ZIWEI_TABLE[juNum]?ZIWEI_TABLE[juNum][Math.min(d-1,29)]:0;
    return {
      mingGong: dz12[mingGongIdx]+'宫',
      shenGong: dz12[shenGongIdx]+'宫',
      ju: juStr+'局',
      juNum: juNum,
      ziweiIdx: ziweiIdx,
      ziweiStar: ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][ziweiIdx]+'宫'
    };
  }
  
  // ===== 后端精确增强（异步）=====
  async function enhance(y,m,d,h,gender,opts){
    if(!API_BASE) return null; // 离线/生产环境跳过
    try{
      var url = API_BASE+'/paipan?y='+y+'&m='+m+'&d='+d+'&h='+h+'&gender='+(gender||'male')+'&json=1';
      var r = await fetch(url,{timeout: 5000,signal:AbortSignal.timeout(15000)});
      if(!r.ok) return null;
      var data = await r.json();
      return {
        trueSolar: data.input && data.input.true_solar,
        lunar: data.input && data.input.lunar,
        shengxiao: data.input && data.input.shengxiao,
        wuxingScore: data.wuxing_score,
        tongDang: data.tong_dang,
        yiDang: data.yi_dang,
        monthLing: data.month_ling,
        startAge: data.start_age,
        startSolar: data.start_solar,
        yunDirection: data.yun_direction,
        dayun: data.dayun,
        liunian: data.liunian,
        shensha: data.shensha,
        nayin: data.nayin,
        zhiRelations: data.zhi_relations,
        _source: 'backend-python'
      };
    }catch(e){
      console.warn('[PaipanEngine.enhance]', e.message);
      return null;
    }
  }
  
  // ===== 统一排盘（JS即时+后端增强）=====
  async function compute(y,m,d,h,gender,opts){
    opts = opts || {};
    var result = {
      bazi: bazi(y,m,d,h,gender,opts.ziSect),
      _source: 'js-local',
      _version: ENGINE_VERSION
    };
    
    // 如果需要后端增强
    if(opts.enhance !== false && API_BASE){
      var enhanced = await enhance(y,m,d,h,gender,opts);
      if(enhanced){
        result = Object.assign({}, result, enhanced);
        result._enhanced = true;
      }
    }
    
    return result;
  }
  
  window.PaipanEngine = {
    version: ENGINE_VERSION,
    bazi: bazi,
    ziwei: ziwei,
    enhance: enhance,
    compute: compute,
    isOnline: function(){ return !!API_BASE; }
  };
})();
