
function submitApply(){
  var name=document.getElementById('mName').value.trim();
  var phone=document.getElementById('mPhone').value.trim();
  var agree=document.getElementById('mAgree').checked;
  if(!name){showToast('请填写商家名称');return}
  if(!phone){showToast('请填写联系电话');return}
  if(!agree){showToast('请勾选入驻协议');return}
  
  var data={
    id:'m'+Date.now(),
    name:name,
    school:document.getElementById('mSchool').value,
    type:document.getElementById('mType').value,
    boss:document.getElementById('mBoss').value,
    phone:phone,
    master:document.getElementById('mMaster').value,
    license:document.getElementById('mLicense').value,
    cert:document.getElementById('mCert').value,
    cats:document.getElementById('mCats').value,
    process:document.getElementById('mProcess').value,
    split:parseFloat(document.getElementById('mSplit').value),
    status:'pending',
    applyDate:new Date().toISOString().slice(0,10)
  };
  
  // R-WALK3: 申请先入服务端（org_applications 表，管理端可审），localStorage 仅作本地副本
  var API=(location.hostname==='127.0.0.1'||location.hostname==='localhost')?'http://127.0.0.1:8920':'';
  function doneLocal(){
    var list=JSON.parse(localStorage.getItem('merchantList')||'[]');
    list.push(data);
    localStorage.setItem('merchantList',JSON.stringify(list));
  }
  function showOk(msg){
    document.getElementById('applyForm').style.display='none';
    var sm=document.getElementById('successMsg');
    sm.style.display='block';
    if(msg){var p=document.createElement('p');p.style.cssText='font-size:12px;color:#8b7e6a;margin-top:8px';p.textContent=msg;sm.appendChild(p);}
  }
  fetch(API+'/api/csrf-token',{signal:AbortSignal.timeout(8000)}).then(function(r){return r.json()}).then(function(tk){
    return fetch(API+'/api/public/org-apply',{method:'POST',headers:{'Content-Type':'application/json','x-csrf-token':tk.csrfToken||''},signal:AbortSignal.timeout(15000),body:JSON.stringify(data)});
  }).then(function(r){return r.json()}).then(function(d){
    var aid=d&&d.data&&d.data.apply_id;
    if(aid){
      data.serverId=aid;
      doneLocal();
      showOk('申请编号 #'+aid+'，平台将在 1-3 个工作日内电话回访，请保持电话畅通。');
    }else{
      throw new Error((d&&d.data&&d.data.error)||(d&&d.message)||'服务未返回申请编号');
    }
  }).catch(function(e){
    // 诚实兜底：明示未送达平台，仅本地登记
    doneLocal();
    showOk('⚠ 未能送达平台（'+(e&&e.message||'网络异常')+'），已本地登记。请稍后重试或电话联系平台入驻。');
  });
}
