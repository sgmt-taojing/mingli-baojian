'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {publicationCheck} = require('./engines/clinical-governance');
const error = (status,message) => Object.assign(new Error(message), {status});
function text(v,name,max=2000,required=false) {
  if (v === undefined && !required) return '';
  if (typeof v !== 'string' || v.trim().length > max || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(v) || (required && !v.trim())) throw error(400, name+' 格式或长度不正确');
  return v.trim();
}
function actorId(actor) {return actor?.id || actor?.username;}
function doctor(actor) {return actor?.role === 'super_admin' || /^doctor(?:_|$)/.test(actor?.role || '');}
function requiredDoctor(actor) {if (!doctor(actor) || !actorId(actor)) throw error(403,'需要医生身份');}
function safeId(id) {if (!/^[a-zA-Z0-9_-]{1,120}$/.test(id || '')) throw error(400,'无效编号');return id;}
class WorkflowStore {
  constructor(root, {search=()=>[], urgency=()=> 'P1_SUGGEST_VISIT'}={}) {this.root=root;this.search=search;this.urgency=urgency;}
  file(kind,id) {return path.join(this.root,kind,safeId(id)+'.json');}
  read(kind,id) {try {return JSON.parse(fs.readFileSync(this.file(kind,id),'utf8'));} catch(e) {if(e.code==='ENOENT') throw error(404,'记录不存在');throw e;}}
  save(kind,row) {
    const target=this.file(kind,row.id);fs.mkdirSync(path.dirname(target),{recursive:true,mode:0o700});
    const tmp=target+'.'+crypto.randomUUID()+'.tmp';
    try {fs.writeFileSync(tmp,JSON.stringify(row,null,2),{mode:0o600,flag:'wx'});fs.renameSync(tmp,target);} finally {if(fs.existsSync(tmp)) fs.unlinkSync(tmp);}
    return row;
  }
  access(row,actor) {requiredDoctor(actor);if(actor.role!=='super_admin' && row.owner_id!==actorId(actor)) throw error(403,'该记录未分配给当前医生');}
  event(row,action,actor,details={}) {
    row.revision=(row.revision||0)+1;row.updated_at=new Date().toISOString();
    row.audit.push({revision:row.revision,action,actor_id:actorId(actor),at:row.updated_at,...details});return row;
  }
  checkRevision(row,body) {if(!Number.isInteger(body.revision) || body.revision!==row.revision) throw error(409,'记录已更新，请刷新后重试');}
  intake(body) {
    const result={};for(const key of ['chief_complaint','duration','symptoms','history','medications','allergies','tongue','pulse']) result[key]=text(body[key],key,2000,key==='chief_complaint');
    if ('observations' in body) throw error(400,'图像特征请由医生核对后填写，不能直接采用未核验的模型结果');
    return result;
  }
  create(body,actor) {
    requiredDoctor(actor);if(body.consent_to_care!==true) throw error(400,'请先确认本次诊疗信息采集授权');
    const requestId=text(body.request_id,'请求编号',120,true);
    const id=crypto.createHash('sha256').update(actorId(actor)+':'+requestId).digest('hex');
    const creationHash=crypto.createHash('sha256').update(JSON.stringify([body.patient_ref,this.intake(body)])).digest('hex');
    if(fs.existsSync(this.file('encounters',id))){const existing=this.get(id,actor);if(existing.creation_hash!==creationHash)throw error(409,'请求编号已使用，请新建记录');return existing;}
    const row={id,creation_hash:creationHash,patient_ref:text(body.patient_ref,'患者编号',120,true),owner_id:actorId(actor),status:'draft',revision:0,intake:this.intake(body),consent_to_care:{at:new Date().toISOString(),recorded_by:actorId(actor)},audit:[],reports:[]};
    return this.save('encounters',this.event(row,'created',actor));
  }
  list(actor) {
    requiredDoctor(actor);const dir=path.join(this.root,'encounters');if(!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter(f=>f.endsWith('.json')).map(f=>this.read('encounters',f.slice(0,-5))).filter(r=>actor.role==='super_admin'||r.owner_id===actorId(actor)).sort((a,b)=>b.updated_at.localeCompare(a.updated_at)).slice(0,100).map(({id,patient_ref,status,revision,updated_at})=>({id,patient_ref,status,revision,updated_at}));
  }
  get(id,actor) {const r=this.read('encounters',id);this.access(r,actor);return r;}
  share(id,body,actor) {
    const r=this.get(id,actor);this.checkRevision(r,body);
    if(r.status!=='signed')throw error(409,'只能共享已签发报告');
    const recipient=text(body.recipient_id,'接收账号',120,true);
    const reason=text(body.reason,'授权依据或撤回原因',1000,true);
    const grants=(r.grants||[]).filter(g=>g.recipient_id!==recipient);
    if(body.action==='grant'){
      if(body.consent_to_share!==true)throw error(400,'请确认患者对本次共享的授权');
      const days=body.days;
      if(!Number.isInteger(days)||days<1||days>30)throw error(400,'授权期限为1至30天');
      grants.push({recipient_id:recipient,report_version:r.reports.at(-1).version,expires_at:new Date(Date.now()+days*86400000).toISOString(),scope:body.allow_followup===true?['report','followup']:['report'],consent_recorded_by:actorId(actor),consent_recorded_at:new Date().toISOString()});
    }else if(body.action!=='revoke')throw error(400,'不支持的共享操作');
    r.grants=grants;return this.save('encounters',this.event(r,body.action+'_share',actor,{recipient_id:recipient,reason}));
  }
  shared(actor) {
    if(!actorId(actor))throw error(401,'需要登录');
    const dir=path.join(this.root,'encounters');if(!fs.existsSync(dir))return [];
    const records=fs.readdirSync(dir).filter(f=>f.endsWith('.json')).map(f=>this.read('encounters',f.slice(0,-5)));
    return records.flatMap(r=>{
      if(r.status!=='signed')return [];
      const g=(r.grants||[]).find(g=>g.recipient_id===actorId(actor)&&Date.parse(g.expires_at)>Date.now());
      const report=g&&r.reports.find(p=>p.version===g.report_version);
      if(!report)return [];
      // No patient index, intake history, other family members or KB fields leave this boundary.
      return [{encounter_id:r.id,revision:r.revision,report:{version:report.version,conclusion:report.conclusion,plan:report.plan,signed_at:report.signed_at},scope:g.scope,expires_at:g.expires_at}];
    });
  }
  sharedFollowup(id,body,actor){
    const shared=this.shared(actor).find(r=>r.encounter_id===id&&r.scope.includes('followup'));
    if(!shared)throw error(403,'报告未授权随访或授权已失效');
    const r=this.read('encounters',id);this.checkRevision(r,body);
    const outcome=text(body.outcome,'随访反馈',2000,true);
    r.followups=(r.followups||[]).concat({id:crypto.randomUUID(),outcome,at:new Date().toISOString(),recorded_by:actorId(actor),source:'authorized_family',review_status:'pending_clinician_review'});
    this.save('encounters',this.event(r,'family_followup',actor));return {id:r.id,revision:r.revision,status:'pending_clinician_review'};
  }
  act(id,body,actor) {
    const r=this.get(id,actor);this.checkRevision(r,body);const action=text(body.action,'操作',30,true);
    if(action==='edit') {
      if(!['draft','assessed','returned'].includes(r.status)) throw error(409,'当前状态不可编辑');
      r.intake=this.intake(body);r.status='draft';delete r.assessment;
    } else if(action==='assess') {
      if(!['draft','assessed','returned'].includes(r.status)) throw error(409,'当前状态不可评估');
      const i=r.intake;const missing=['duration','symptoms','history','medications','allergies'].filter(k=>!i[k]);
      const urgent=this.urgency({five_methods:{inquiry:{chief_complaint:i.chief_complaint,extracted_tcm_terms:i.symptoms.split(/[，、,\s]+/).filter(Boolean)}}});
      const hits=this.search(i.symptoms || i.chief_complaint);
      r.assessment={generated_at:new Date().toISOString(),urgency:urgent,missing_fields:missing,evidence:hits,scope:'knowledge_reference',limitations:['检索匹配不是诊断概率','视觉观察需要医生核验','候选知识不能替代医师独立判断'],requires_clinician:true};
      r.status='assessed';
    } else if(action==='submit') {
      if(r.status!=='assessed') throw error(409,'请先评估');
      if(r.assessment.missing_fields.length) throw error(409,'请补充病史、用药及过敏等缺失信息');
      if(r.assessment.urgency==='P0_EMERGENCY') throw error(409,'紧急情况请先处理转诊，不能继续普通诊断签发');
      r.status='pending_review';
    } else if(action==='return') {
      if(r.status!=='pending_review') throw error(409,'仅待审核记录可退回');
      r.return_reason=text(body.reason,'退回原因',1000,true);r.status='returned';
    } else if(action==='sign') {
      if(r.status!=='pending_review') throw error(409,'仅待审核记录可签发');
      const report={version:r.reports.length+1,conclusion:text(body.conclusion,'医生结论',2000,true),rationale:text(body.rationale,'判断依据',2000,true),plan:text(body.plan,'后续安排',2000,true),signed_by:actorId(actor),signed_at:new Date().toISOString(),knowledge_evidence:r.assessment.evidence};
      if(body.independent_review!==true) throw error(400,'请确认已独立核对病史与依据');
      r.reports.push(report);r.status='signed';
    } else if(action==='amend') {
      if(r.status!=='signed') throw error(409,'仅已签发记录可修订');
      r.amendment_reason=text(body.reason,'修订原因',1000,true);r.grants=[];r.status='draft';delete r.assessment;
    } else if(action==='void') {
      if(r.status==='void') throw error(409,'记录已作废');
      r.void_reason=text(body.reason,'作废原因',1000,true);r.grants=[];r.status='void';
    } else if(action==='review_followup') {
      if(r.status!=='signed') throw error(409,'仅已签发记录可处理随访审核');
      const followupId=text(body.followup_id,'随访编号',120,true);
      const f=(r.followups||[]).find(item=>item.id===followupId);
      if(!f || f.source!=='authorized_family') throw error(404,'未找到可审核的家属反馈');
      const decision=text(body.decision,'审核决定',20,true);
      const reason=text(body.reason,'审核说明',1000,true);
      if(!['accepted','rejected','reopen'].includes(decision)) throw error(400,'不支持的审核决定');
      if(decision==='reopen' ? !['accepted','rejected'].includes(f.review_status) : f.review_status!=='pending_clinician_review') throw error(409,'随访审核状态已变化，请刷新');
      const previous=f.review_status;
      f.review_status=decision==='reopen'?'pending_clinician_review':decision;
      f.review_history=(f.review_history||[]).concat({decision,previous_status:previous,status:f.review_status,reason,reviewed_by:actorId(actor),at:new Date().toISOString()});
      // Reviewing feedback never edits a signed report or the original family text.
    } else if(action==='followup') {
      if(r.status!=='signed') throw error(409,'请先完成医生签发');
      const outcome=text(body.outcome,'随访记录',2000,true);
      r.followups=(r.followups||[]).concat({id:crypto.randomUUID(),outcome,at:new Date().toISOString(),recorded_by:actorId(actor)});
    } else throw error(400,'不支持的操作');
    return this.save('encounters',this.event(r,action,actor));
  }
}
function registerClinicalWorkflow(app,{requireAuth, dataRoot=path.join(__dirname,'../data/clinical-workflow'),search,urgency}) {
  const store=new WorkflowStore(dataRoot,{search,urgency});
  const wrap=fn=>(req,res)=>{try{res.json({ok:true,...fn(req)});}catch(e){res.status(e.status||500).json({ok:false,error:e.status?e.message:'保存失败，请稍后重试'});}};
  app.get('/api/clinical-workflow/encounters',requireAuth,wrap(req=>({items:store.list(req.user)})));
  app.post('/api/clinical-workflow/encounters',requireAuth,wrap(req=>({record:store.create(req.body,req.user)})));
  app.get('/api/clinical-workflow/encounters/:id',requireAuth,wrap(req=>({record:store.get(req.params.id,req.user)})));
  app.post('/api/clinical-workflow/encounters/:id/action',requireAuth,wrap(req=>({record:store.act(req.params.id,req.body,req.user)})));
  app.post('/api/clinical-workflow/encounters/:id/share',requireAuth,wrap(req=>({record:store.share(req.params.id,req.body,req.user)})));
  app.get('/api/clinical-workflow/shared-reports',requireAuth,wrap(req=>({items:store.shared(req.user)})));
  app.post('/api/clinical-workflow/shared-reports/:id/followup',requireAuth,wrap(req=>({result:store.sharedFollowup(req.params.id,req.body,req.user)})));
  return store;
}
module.exports={WorkflowStore,registerClinicalWorkflow,doctor,publicationCheck};
