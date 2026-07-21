/* === m1bj-user-profile.js (统一用户档案 - 三端共用 / 专业全量版 v2) ===
 * 字段扩充（2026-07-21）：
 *   - 基础：姓名、性别、生日(公历/农历)
 *   - 时辰：时辰(小时)、分钟、真太阳时校正、闰月标记、子时流派
 *   - 地理：出生地(行政区+经纬度)、现居地、出生医院/省份
 *   - 历法：立春/正月初一、年柱切换、大运流派
 *   - 家庭：父亲、母亲、配偶、子女（合盘用）
 *   - 关心维度：22 模块标签
 *   - 职业：行业、岗位（企业视角用）
 *   - 健康：体质、慢性病（中医诊疗用）
 *   - 起名：姓氏、辈分字（起名用）
 *   - 时区：夏令时、时区
 */
(function(){
  const KEY='mlbj_user_profile_v2';
  const SCHEMA={
    token:'',
    userId:'',
    nickName:'',
    phone:'',
    email:'',
    avatar:'',

    /* ── 基础生辰 ── */
    birth:{
      year:'',month:'',day:'',hour:'',minute:'',          // 公历
      isLunar:false,                                      // 是否农历输入
      lunarYear:'',lunarMonth:'',lunarDay:'',lunarIsLeap:false,
      shengHourValue:'',                                  // 12 时辰值 (0/2/4.../22)
      shengMinute:'',                                     // 精确分钟
      timeUnknown:false,                                  // 时辰不详
      zishiMode:'normal',                                 // 子时流派: normal|late(早子|晚子)
      liuchunMode:'lichun',                               // 年柱切换: lichun|zhengshuo
      dayunMode:'standard',                               // 大运起运: standard|precise
      dst:false,                                          // 夏令时
      tzOffset:'+08:00',                                  // 时区
      gender:''
    },

    /* ── 出生地理（用于真太阳时/五行方位/胎元） ── */
    birthplace:{
      fullName:'',                                        // 如"北京市朝阳区"
      country:'中国',
      province:'',
      city:'',
      district:'',
      lng:'',                                             // 经度（可选,手动输入）
      lat:'',                                             // 纬度（可选）
      altitude:'',                                        // 海拔（胎息体质参考）
      hospital:''                                         // 出生医院（可选）
    },

    /* ── 现居地（用于流年方位/风水） ── */
    residence:{
      fullName:'',
      province:'',
      city:'',
      district:'',
      lng:'',
      movedAt:''                                          // 迁居年份
    },

    /* ── 家庭成员（合盘/家庭排盘） ── */
    family:{
      father:{name:'',birth:{year:'',month:'',day:'',hour:'',gender:'male'},alive:true,occupation:''},
      mother:{name:'',birth:{year:'',month:'',day:'',hour:'',gender:'female'},alive:true,occupation:''},
      spouse:{name:'',birth:{year:'',month:'',day:'',hour:'',gender:''},marriedYear:''},
      children:[]
    },

    /* ── 关心维度（22 模块） ── */
    concerns:[],                                          // ['运势','健康','婚姻','孩子','父母','事业','财运','学业','风物','修养','人脉','创业','养老','传承']

    /* ── 职业（企业视角） ── */
    occupation:{
      industry:'',                                        // 行业
      position:'',                                        // 岗位
      isEntrepreneur:false,                               // 是否创业者
      companyScale:'',                                    // 公司规模
      listed:false                                        // 是否上市
    },

    /* ── 健康（中医诊疗/体质） ── */
    health:{
      tizhi:'',                                           // 9 体质: 平和|气虚|阳虚|阴虚|痰湿|湿热|血瘀|气郁|特禀
      chronicDiseases:[],                                 // 慢性病
      allergies:[],                                       // 过敏
      constitutionNote:'',                                // 备注
      height:'',weight:'',
      menstrual:'',                                       // 女性: 月经状况
      lastCheckup:''                                      // 上次体检
    },

    /* ── 起名（姓名学） ── */
    naming:{
      surname:'',                                         // 姓氏
      generationChar:'',                                  // 辈分字
      isCompoundSurname:false,                            // 是否复姓
      preferredStrokes:{min:1,max:30},                    // 笔画范围
      avoidChars:''                                       // 避讳字
    },

    /* ── 偏好设置 ── */
    preferences:{
      calendarMode:'solar',
      lang:'zh-CN',
      theme:'dark',
      voice:'female-zh',
      pushEnabled:true,
      pushTime:'08:00',
      soundEnabled:true
    },

    /* ── 统计 ── */
    favoriteMods:[],
    visitCount:0,lastVisit:0,
    kbHits:{total:0,byMod:{}},

    updatedAt:0
  };

  function load(){
    try{
      const d=JSON.parse(localStorage.getItem(KEY)||'{}');
      return deepMerge(Object.assign({},SCHEMA),d);
    }catch(e){return Object.assign({},SCHEMA);}
  }

  function deepMerge(target,src){
    if(!src||typeof src!=='object')return target;
    for(const k of Object.keys(src)){
      if(src[k]&&typeof src[k]==='object'&&!Array.isArray(src[k])&&target[k]&&typeof target[k]==='object'){
        deepMerge(target[k],src[k]);
      } else {
        target[k]=src[k];
      }
    }
    return target;
  }

  function save(p){p.updatedAt=Date.now();localStorage.setItem(KEY,JSON.stringify(p));return p;}

  /* ── 便捷合并 API ── */
  function mergeBirth(b){if(!b)return load();const p=load();Object.assign(p.birth,b);return touch(p);}
  function mergeBirthplace(b){if(!b)return load();const p=load();Object.assign(p.birthplace,b);return touch(p);}
  function mergeResidence(b){if(!b)return load();const p=load();Object.assign(p.residence,b);return touch(p);}
  function mergeFamily(b){if(!b)return load();const p=load();deepMerge(p.family,b);return touch(p);}
  function mergeOccupation(b){if(!b)return load();const p=load();Object.assign(p.occupation,b);return touch(p);}
  function mergeHealth(b){if(!b)return load();const p=load();Object.assign(p.health,b);return touch(p);}
  function mergeNaming(b){if(!b)return load();const p=load();Object.assign(p.naming,b);return touch(p);}
  function mergePreferences(b){if(!b)return load();const p=load();Object.assign(p.preferences,b);return touch(p);}

  function mergeConcerns(arr){
    if(!arr||!arr.length)return load();
    const p=load();
    arr.forEach(c=>{if(p.concerns.indexOf(c)<0)p.concerns.push(c);});
    return touch(p);
  }

  function recordKbHit(modId){
    const p=load();
    p.kbHits.total=(p.kbHits.total||0)+1;
    p.kbHits.byMod[modId]=(p.kbHits.byMod[modId]||0)+1;
    return touch(p);
  }

  function touch(p){p.visitCount=(p.visitCount||0)+1;p.lastVisit=Date.now();return save(p);}

  /* ── 一键回填排盘表单 ── */
  function fillBaziForm(prefix){
    prefix=prefix||'bazi';
    const p=load();
    const setVal=(id,v)=>{const el=document.getElementById(id);if(el!==null)el.value=v||'';};
    const setChk=(id,v)=>{const el=document.getElementById(id);if(el!==null)el.checked=!!v;};
    setVal(prefix+'Name',p.nickName||p.birth.name);
    setVal(prefix+'Date',`${p.birth.year}-${String(p.birth.month).padStart(2,'0')}-${String(p.birth.day).padStart(2,'0')}`);
    setVal(prefix+'Hour',p.birth.shengHourValue);
    setVal(prefix+'Sex',p.birth.gender);
    setVal(prefix+'Lng',p.birthplace.lng);
    setVal(prefix+'Birthplace',p.birthplace.fullName||(p.birthplace.city||''));
    setVal(prefix+'Residence',p.residence.fullName||(p.residence.city||''));
    setChk('lunarLeapMonth',p.birth.lunarIsLeap);
    setVal('baziZishi',p.birth.zishiMode);
    setVal('baziLiuchun',p.birth.liuchunMode);
    setVal('baziDayunMode',p.birth.dayunMode);
    return p;
  }

  /* ── 摘要（卡片/欢迎页用） ── */
  function getSummary(){
    const p=load();
    const b=p.birth;
    return {
      hasBirth:!!(b.year&&b.month&&b.day),
      birthText:b.year?(b.year+'年'+b.month+'月'+b.day+'日'+(b.shengHourValue!==''?' '+b.shengHourValue+'时':'')):'未填',
      city:(p.residence.fullName||p.birthplace.fullName||'未填'),
      gender:b.gender||'未填',
      concerns:p.concerns.join('、')||'未填',
      visits:p.visitCount||0,
      kbHits:p.kbHits?p.kbHits.total:0,
      completeness:getCompleteness(p)
    };
  }

  /* ── 完整度评分（用于引导补全） ── */
  function getCompleteness(p){
    p=p||load();
    let total=0,filled=0;
    const checks=[
      ['姓名',p.nickName||p.birth.name],
      ['性别',p.birth.gender],
      ['生日(年)',p.birth.year],['生日(月)',p.birth.month],['生日(日)',p.birth.day],
      ['时辰',p.birth.shengHourValue!==''?p.birth.shengHourValue:(p.birth.timeUnknown?'不详':'')],
      ['出生地',p.birthplace.fullName||p.birthplace.city],
      ['经度',p.birthplace.lng],
      ['现居地',p.residence.fullName||p.residence.city],
      ['立春模式',p.birth.liuchunMode],
      ['子时模式',p.birth.zishiMode],
      ['大运模式',p.birth.dayunMode],
      ['关心维度',p.concerns.length],
      ['职业',p.occupation.industry],
      ['体质',p.health.tizhi]
    ];
    checks.forEach(c=>{total++;if(c[1])filled++;});
    return Math.round(filled*100/total);
  }

  function clear(){localStorage.removeItem(KEY);}

  /* ── 22 个关心维度（与 KB 一致） ── */
  const ALL_CONCERNS=['运势','健康','婚姻','孩子','父母','事业','财运','学业','风物','修养','人脉','创业','养老','传承','起名','测字','黄历','节气','风水','流年','化解','合盘'];

  /* ── 打开全量缘主档案向导（专业全量信息收集） ── */
  // 动态注入表单 CSS（保证任何页面都能调用 openProfileWizard）
  function _injectProfileCss(){
    if(document.getElementById('mlbjProfileCss')) return;
    const css = `
.mlbj-form-section{margin:14px 0;padding:14px;background:rgba(201,168,76,0.04);border:1px solid rgba(201,168,76,0.12);border-radius:8px}
.mlbj-form-title{font-family:'Ma Shan Zheng',serif;font-size:15px;color:var(--gold);letter-spacing:2px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid rgba(201,168,76,0.15)}
.mlbj-form-section label{display:flex;flex-direction:column;font-size:11px;color:var(--paper3);letter-spacing:1px;gap:4px}
.mlbj-form-section input,.mlbj-form-section select{background:var(--ink2);border:1px solid rgba(201,168,76,0.2);color:var(--paper);padding:7px 10px;border-radius:5px;font-size:13px;font-family:inherit}
.mlbj-form-section input:focus,.mlbj-form-section select:focus{outline:none;border-color:var(--gold)}
.mlbj-chip{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.18);border-radius:14px;font-size:12px;color:var(--paper2);cursor:pointer}
.mlbj-chip input{margin:0;cursor:pointer}
.mlbj-chip:has(input:checked){background:rgba(201,168,76,0.18);border-color:var(--gold);color:var(--gold)}
@media(max-width:600px){.mlbj-form-section > div{grid-template-columns:1fr !important}}
    `;
    const s = document.createElement('style');
    s.id = 'mlbjProfileCss';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function openProfileWizard(){
    _injectProfileCss();
    const p = load();
    const html = renderProfileWizardHTML(p);
    if(typeof showModal === 'function'){
      showModal('📋 缘主专业档案', html);
    } else if(typeof openDrawer === 'function'){
      openDrawer('📋 缘主专业档案', html);
    } else {
      // 兜底：创建独立弹层
      let m = document.getElementById('mlbjProfileWizard');
      if(!m){
        m = document.createElement('div');
        m.id = 'mlbjProfileWizard';
        m.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;';
        document.body.appendChild(m);
      }
      m.innerHTML = '<div style="background:var(--bg);border:1px solid var(--gold);border-radius:16px;max-width:760px;width:100%;max-height:90vh;overflow:auto;position:relative"><div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid rgba(201,168,76,0.2)"><h3 style="color:var(--gold);margin:0">📋 缘主专业档案</h3><button onclick="document.getElementById(\'mlbjProfileWizard\').style.display=\'none\'" style="background:none;border:none;color:var(--paper2);font-size:24px;cursor:pointer;line-height:1">&times;</button></div><div style="padding:20px">'+html+'</div></div>';
      m.style.display = 'flex';
    }
    // 绑定保存按钮
    setTimeout(()=>{
      const btn = document.getElementById('mlbjProfileSaveBtn');
      if(btn) btn.onclick = saveProfileWizard;
    }, 50);
  }

  function renderProfileWizardHTML(p){
    const b = p.birth || {};
    const bp = p.birthplace || {};
    const r = p.residence || {};
    const f = p.family || {};
    const o = p.occupation || {};
    const h = p.health || {};
    const prefs = p.preferences || {};
    const concerns = p.concerns || [];
    return `
      <div style="font-size:12px;color:var(--paper3);margin-bottom:12px;padding:8px 12px;background:rgba(201,168,76,0.08);border-radius:6px">
        💡 提示：填写越全，排盘报告越精准。本次填写将自动保存，下次排盘自动复用。
      </div>
      <div class="mlbj-form-section">
        <div class="mlbj-form-title">🎂 出生信息（八字/紫微/六壬共用）</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <label>姓名<input id="pf_name" value="${b.name||''}" placeholder="如：张三"></label>
          <label>性别
            <select id="pf_gender">
              <option value="">--</option>
              <option ${b.gender==='男'?'selected':''} value="男">男</option>
              <option ${b.gender==='女'?'selected':''} value="女">女</option>
            </select>
          </label>
          <label>出生日期<input id="pf_birthDate" type="date" value="${b.birthDate||''}"></label>
          <label>出生时间<input id="pf_birthTime" type="time" value="${b.birthTime||''}"></label>
          <label>真太阳时<input id="pf_trueSolar" value="${b.trueSolarTime||''}" placeholder="如：08:25"></label>
          <label>农历/公历
            <select id="pf_calendar">
              <option value="solar" ${b.calendar!=='lunar'?'selected':''}>公历</option>
              <option value="lunar" ${b.calendar==='lunar'?'selected':''}>农历</option>
            </select>
          </label>
        </div>
      </div>
      <div class="mlbj-form-section">
        <div class="mlbj-form-title">🗺️ 出生地与现居地</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <label>出生省<input id="pf_bpProvince" value="${bp.province||''}" placeholder="如：江苏"></label>
          <label>出生市/县<input id="pf_bpCity" value="${bp.city||''}" placeholder="如：南京"></label>
          <label>现居省<input id="pf_rProvince" value="${r.province||''}" placeholder="如：上海"></label>
          <label>现居市<input id="pf_rCity" value="${r.city||''}" placeholder="如：浦东"></label>
        </div>
      </div>
      <div class="mlbj-form-section">
        <div class="mlbj-form-title">👨‍👩‍👧 家庭背景</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <label>父亲生肖<input id="pf_fZodiac" value="${f.fatherZodiac||''}" placeholder="如：龙"></label>
          <label>母亲生肖<input id="pf_mZodiac" value="${f.motherZodiac||''}" placeholder="如：蛇"></label>
          <label>排行<input id="pf_birthOrder" value="${f.birthOrder||''}" placeholder="如：老大/老二/独子"></label>
          <label>兄弟姐妹<input id="pf_siblings" value="${f.siblings||''}" placeholder="如：1 哥 1 妹"></label>
        </div>
      </div>
      <div class="mlbj-form-section">
        <div class="mlbj-form-title">💼 职业与学业</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <label>职业<input id="pf_job" value="${o.job||''}" placeholder="如：IT 工程师"></label>
          <label>学历<input id="pf_education" value="${o.education||''}" placeholder="如：本科"></label>
        </div>
      </div>
      <div class="mlbj-form-section">
        <div class="mlbj-form-title">🏥 健康状况</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <label>重大病史<input id="pf_illness" value="${h.illness||''}" placeholder="无/有（什么）"></label>
          <label>过敏<input id="pf_allergy" value="${h.allergy||''}" placeholder="无/青霉素等"></label>
        </div>
      </div>
      <div class="mlbj-form-section">
        <div class="mlbj-form-title">💭 关心维度（多选，影响 AI 推荐）</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${ALL_CONCERNS.map(c=>`<label class="mlbj-chip"><input type="checkbox" value="${c}" ${concerns.includes(c)?'checked':''}>${c}</label>`).join('')}
        </div>
      </div>
      <div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end">
        <button onclick="document.getElementById('customModal')&&(document.getElementById('customModal').style.display='none');document.getElementById('mlbjProfileWizard')&&(document.getElementById('mlbjProfileWizard').style.display='none')" style="padding:8px 16px;background:transparent;border:1px solid var(--paper3);color:var(--paper2);border-radius:6px;cursor:pointer">取消</button>
        <button id="mlbjProfileSaveBtn" style="padding:8px 20px;background:var(--gold);border:none;color:#000;border-radius:6px;cursor:pointer;font-weight:600">💾 保存档案</button>
      </div>
    `;
  }

  function saveProfileWizard(){
    const get = id => { const el = document.getElementById(id); return el ? (el.value || '').trim() : ''; };
    const checks = document.querySelectorAll('.mlbj-chip input[type=checkbox]:checked');
    const concerns = Array.from(checks).map(c=>c.value);
    const birth = { name: get('pf_name'), gender: get('pf_gender'), birthDate: get('pf_birthDate'), birthTime: get('pf_birthTime'), trueSolarTime: get('pf_trueSolar'), calendar: get('pf_calendar')||'solar' };
    const birthplace = { province: get('pf_bpProvince'), city: get('pf_bpCity') };
    const residence = { province: get('pf_rProvince'), city: get('pf_rCity') };
    const family = { fatherZodiac: get('pf_fZodiac'), motherZodiac: get('pf_mZodiac'), birthOrder: get('pf_birthOrder'), siblings: get('pf_siblings') };
    const occupation = { job: get('pf_job'), education: get('pf_education') };
    const health = { illness: get('pf_illness'), allergy: get('pf_allergy') };
    mergeBirth(birth); mergeBirthplace(birthplace); mergeResidence(residence);
    mergeFamily(family); mergeOccupation(occupation); mergeHealth(health);
    mergeConcerns(concerns);
    const summary = getSummary();
    showToast ? showToast('✅ 档案已保存（'+(summary.completeness||0)+'% 完整）') : alert('档案已保存');
    // 关闭弹层
    const m = document.getElementById('customModal'); if(m) m.style.display='none';
    const w = document.getElementById('mlbjProfileWizard'); if(w) w.style.display='none';
  }

  window.MLBJ_USER={
    KEY,SCHEMA,ALL_CONCERNS,
    load,save,touch,clear,
    mergeBirth,mergeBirthplace,mergeResidence,mergeFamily,
    mergeOccupation,mergeHealth,mergeNaming,mergePreferences,
    mergeConcerns,recordKbHit,
    fillBaziForm,
    getSummary,getCompleteness,
    openProfileWizard,saveProfileWizard,renderProfileWizardHTML
  };
  console.log('✅ m1bj-user-profile.js v2 loaded (professional full fields)');
})();