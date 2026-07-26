
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
  
  var list=JSON.parse(localStorage.getItem('merchantList')||'[]');
  list.push(data);
  localStorage.setItem('merchantList',JSON.stringify(list));
  
  document.getElementById('applyForm').style.display='none';
  document.getElementById('successMsg').style.display='block';
}
