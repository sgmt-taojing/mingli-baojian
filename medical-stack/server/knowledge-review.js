'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {WorkflowStore,doctor}=require('./clinical-workflow');
const {publicationCheck}=require('./engines/clinical-governance');
const err=(status,message)=>Object.assign(new Error(message),{status});
class KnowledgeReview extends WorkflowStore {
  constructor(root,formalDir){super(root);this.formalDir=formalDir;}
  prepare(body,actor){
    if(!doctor(actor))throw err(403,'需要医生身份');
    for(const k of ['title','content','syndrome'])if(typeof body[k]!=='string'||!body[k].trim()||body[k].length>(k==='content'?10000:200))throw err(400,'请填写完整的知识标题、正文和证型');
    if(body.content.trim().length<100)throw err(400,'知识正文至少100字');
    if(!Array.isArray(body.evidence)||!body.evidence.length||body.evidence.length>20)throw err(400,'需要可定位的来源证据');
    const evidence=body.evidence.map(e=>{for(const k of ['source_id','locator','version'])if(typeof e?.[k]!=='string'||!e[k].trim()||e[k].length>300)throw err(400,'来源证据格式不正确');return {source_id:e.source_id.trim(),locator:e.locator.trim(),version:e.version.trim()};});
    const entry={id:crypto.randomUUID(),title:body.title.trim(),content:body.content.trim(),syndrome:body.syndrome.trim(),evidence,status:'pending_review',source:'independent-knowledge-review',symptoms:Array.isArray(body.symptoms)?body.symptoms.filter(x=>typeof x==='string'&&x.length<=60).slice(0,20):[],revision:0,audit:[],owner_id:actor.id||actor.username};
    return this.save('candidates',this.event(entry,'submitted',actor));
  }
  current(id){const published=path.join(this.formalDir,id+'.json');this.file('candidates',id);return fs.existsSync(published)?JSON.parse(fs.readFileSync(published,'utf8')):this.read('candidates',id);}
  all(actor){if(!doctor(actor))throw err(403,'需要医生身份');const dir=path.join(this.root,'candidates');if(!fs.existsSync(dir))return [];return fs.readdirSync(dir).filter(f=>f.endsWith('.json')).map(f=>this.current(f.slice(0,-5)));}
  review(id,body,actor){
    if(!doctor(actor))throw err(403,'需要医生身份');const entry=this.current(id);this.checkRevision(entry,body);
    if(!['approve','reject','revoke'].includes(body.action))throw err(400,'不支持的审核操作');
    if(typeof body.reason!=='string'||!body.reason.trim()||body.reason.length>1000)throw err(400,'请填写审核依据或撤回原因');
    if(body.action==='approve'){
      if(entry.status!=='pending_review')throw err(409,'只能审核待审条目');
      if(entry.owner_id===(actor.id||actor.username))throw err(403,'请由另一名医生独立审核');
      entry.governance={domain:'medical',deidentified:body.deidentified===true,rights_verified:body.rights_verified===true,evidence_verified:body.evidence_verified===true,reviewer_id:actor.id||actor.username,reviewed_at:new Date().toISOString()};
      const checked=publicationCheck(entry);if(!checked.ok)throw err(400,checked.error);
      entry.status='formal';entry.version=1;entry.review_reason=body.reason.trim();
      // The review record is persisted before publication; no bulk auto-promotion.
      this.event(entry,'approved',actor);
      const publisher=new WorkflowStore(this.formalDir);publisher.save('.',entry);
    }else if(body.action==='reject'){
      if(entry.status!=='pending_review')throw err(409,'只能驳回待审条目');entry.status='rejected';entry.review_reason=body.reason.trim();this.event(entry,'rejected',actor);this.save('candidates',entry);
    }else{
      if(entry.status!=='formal')throw err(409,'只能撤回已发布条目');entry.status='revoked';entry.revoked_reason=body.reason.trim();entry.revoked_at=new Date().toISOString();this.event(entry,'revoked',actor);
      new WorkflowStore(this.formalDir).save('.',entry);
    }
    try{require('./engines/kb-bridge').invalidateCache();}catch(e){}
    return entry;
  }
}
function registerKnowledgeReview(app,{requireAuth,root=path.join(__dirname,'../data/knowledge-review'),formalDir=path.join(__dirname,'kb/formal')}){
  const store=new KnowledgeReview(root,formalDir);
  app.get('/api/knowledge-review/source-evidence',requireAuth,(req,res)=>{
    if(!doctor(req.user))return res.status(403).json({ok:false,error:'需要医生身份'});
    const query=req.query.q;
    if(typeof query!=='string'||query.trim().length<2||query.length>100)return res.status(400).json({ok:false,error:'检索词需要2至100字'});
    require('child_process').execFile('python3',[path.join(__dirname,'../distillery/source-evidence-search.py'),query],{timeout:10000,maxBuffer:1024*1024},(error,stdout)=>{
      if(error)return res.status(503).json({ok:false,error:'待审证据检索暂不可用'});
      try{res.set('Cache-Control','no-store').json({ok:true,...JSON.parse(stdout)});}catch(e){res.status(503).json({ok:false,error:'证据返回格式异常'});}
    });
  });

  const wrap=fn=>(req,res)=>{try{res.json({ok:true,...fn(req)});}catch(e){res.status(e.status||500).json({ok:false,error:e.status?e.message:'知识记录保存失败'});}};
  app.get('/api/knowledge-review/entries',requireAuth,wrap(req=>({items:store.all(req.user)})));
  app.post('/api/knowledge-review/entries',requireAuth,wrap(req=>({entry:store.prepare(req.body,req.user)})));
  app.post('/api/knowledge-review/entries/:id/action',requireAuth,wrap(req=>({entry:store.review(req.params.id,req.body,req.user)})));
  return store;
}
module.exports={KnowledgeReview,registerKnowledgeReview};
