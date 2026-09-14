'use strict';
const fs=require('fs');const path=require('path');const crypto=require('crypto');
const {CULTURE,usableFormal}=require('./engines/clinical-governance');
const ALLOWED=new Set(['nihaisha','shanghan-lun','tcm','tcm-diagnosis','tcm-fangji','tcm-basic','nihaisha-tcm','tcm-acupuncture','tcm-classical','tcm-clinical','tcm-herb','huangdi-neijing','shennong-bencao','jinkui-yaolue','tcm-syndrome','tcm-formula','nanjing','jiayi-jing','maijing','zhubingyuanhou','qianjin','piwei-lun','bencao-gangmu','jingyue','yizong-jinjian','wenbing-tiaobian']);
let cache={mtime:0,rows:[],version:''};
function load(file) {
  const st=fs.statSync(file);if(cache.file===file && cache.mtime===st.mtimeMs) return cache;
  const raw=fs.readFileSync(file,'utf8'), data=JSON.parse(raw),rows=[];
  for(const [module,items] of Object.entries(data)) {
    if(!ALLOWED.has(module)||!Array.isArray(items)) continue;
    for(const e of items) {
      if(!e || CULTURE.test([e.title,e.content].join(' ')) || e.patient_id || e.complaint) continue;
      // Source-poor legacy records are inventory-only; do not fabricate citations.
      if(!e.id || !e.src_id) continue;
      rows.push({id:e.id,module,title:String(e.title||''),excerpt:String(e.content||'').slice(0,1200),source_id:String(e.src_id),locator:'entry:'+e.id,review_status:'legacy_source_unverified'});
    }
  }
  cache={file,mtime:st.mtimeMs,rows,version:crypto.createHash('sha256').update(raw).digest('hex')};return cache;
}
function search(query,{file=path.join(__dirname,'kb-store/tcm-synced-kb.json'),formalDir=path.join(__dirname,'kb/formal'),limit=6,onWarning=warning=>console.warn('[medical-evidence]',warning.source,warning.code)}={}) {
  if(typeof query!=='string'||!query.trim()||CULTURE.test(query)) return [];
  let rows=[],version='';
  try {({rows,version}=load(file));} catch(error) {
    // Independent reviewed publications remain available when the legacy cache fails.
    onWarning({source:'legacy',code:error.code==='ENOENT'?'missing':'unreadable_or_invalid'});
  }
  const terms=[...new Set(query.split(/[\s，、,。；;]+/).filter(t=>t.length>=2 && t.length<=30))];
  const published=[];
  if(fs.existsSync(formalDir)) for(const name of fs.readdirSync(formalDir).filter(n=>n.endsWith('.json'))) {
    try {const raw=fs.readFileSync(path.join(formalDir,name),'utf8'),e=JSON.parse(raw);if(!usableFormal(e))continue;
      published.push({id:e.id,module:'medical-reviewed',title:e.title,excerpt:e.content.slice(0,1200),source_id:e.evidence[0].source_id,locator:e.evidence[0].locator,review_status:'independently_reviewed',version:crypto.createHash('sha256').update(raw).digest('hex')});
    }catch(e){/* Malformed published entries cannot participate in retrieval. */}
  }
  return [...published,...rows].map(r=>({...r,matched_terms:terms.filter(t=>(r.title+' '+r.excerpt).includes(t)),version:r.version||version})).filter(r=>r.matched_terms.length).sort((a,b)=>b.matched_terms.length-a.matched_terms.length||a.id.localeCompare(b.id)).slice(0,Math.max(1,Math.min(limit,20)));
}
module.exports={search,ALLOWED};
