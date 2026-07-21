/* === m1bj-user-profile.js (统一用户档案 - 三端共用) === */
(function(){
  const KEY='mlbj_user_profile';
  const SCHEMA={
    token:'',                  // mlbj_token 已单独存
    userId:'',
    nickName:'',
    phone:'',
    birth:{                    // 生辰
      year:'',month:'',day:'',hour:'',minute:'',
      isLunar:false,birthPlace:'',currentCity:'',gender:''
    },
    concerns:[],               // 关心维度 ['运势','健康','婚姻','孩子','同事','父母']
    favoriteMods:[],           // 常用模块
    visitCount:0,lastVisit:0,
    kbHits:{total:0,byMod:{}},
    updatedAt:0
  };
  function load(){
    try{const d=JSON.parse(localStorage.getItem(KEY)||'{}');return Object.assign({},SCHEMA,d);}
    catch(e){return Object.assign({},SCHEMA);}
  }
  function save(p){p.updatedAt=Date.now();localStorage.setItem(KEY,JSON.stringify(p));return p;}
  function mergeBirth(b){
    if(!b)return load();
    const p=load();
    Object.assign(p.birth,b);
    p.visitCount=(p.visitCount||0)+1;p.lastVisit=Date.now();
    return save(p);
  }
  function mergeConcerns(arr){
    if(!arr||!arr.length)return load();
    const p=load();
    arr.forEach(c=>{if(p.concerns.indexOf(c)<0)p.concerns.push(c);});
    return save(p);
  }
  function recordKbHit(modId){
    const p=load();
    p.kbHits.total=(p.kbHits.total||0)+1;
    p.kbHits.byMod[modId]=(p.kbHits.byMod[modId]||0)+1;
    return save(p);
  }
  function getSummary(){
    const p=load();
    const b=p.birth;
    return {
      hasBirth:!!(b.year&&b.month&&b.day),
      birthText:b.year?(b.year+'年'+b.month+'月'+b.day+'日'+(b.hour?b.hour+'时':'')):'未填',
      city:(b.currentCity||b.birthPlace||'未填'),
      gender:b.gender||'未填',
      concerns:p.concerns.join('、')||'未填',
      visits:p.visitCount||0,
      kbHits:p.kbHits?p.kbHits.total:0
    };
  }
  function clear(){localStorage.removeItem(KEY);}
  window.MLBJ_USER={
    KEY,SCHEMA,load,save,mergeBirth,mergeConcerns,recordKbHit,getSummary,clear
  };
  console.log('✅ m1bj-user-profile.js loaded');
})();