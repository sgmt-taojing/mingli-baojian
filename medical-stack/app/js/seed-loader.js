/**
 * TCM-Agent 种子数据自动加载器 V1.0
 * 所有页面首次访问时自动注入种子数据，保证"抽开即用"
 * 使用方式: <script src="js/seed-loader.js"></script>
 */
(function() {
  if (typeof window === 'undefined') return;

  var LOADED_KEY = 'tcm_seed_loaded_v2';
  if (localStorage.getItem(LOADED_KEY)) return; // 已加载过，跳过

  // 首次运行：自动注入种子数据...

  // ═══ 种子数据 ═══
  var complaints = [
    '失眠多梦，入睡困难2周', '反复头痛，两侧太阳穴为主',
    '胃脘胀痛，饭后加重', '咳嗽咳痰，痰白稀伴胸闷',
    '月经不调，经前腹痛', '腰膝酸软，畏寒怕冷',
    '关节疼痛，晨僵屈伸不利', '反复感冒，免疫力差',
    '口干口苦，便秘小便黄', '面部痤疮，月经前加重',
    '心悸胸闷，失眠健忘', '头晕耳鸣，高血压',
    '腹胀纳差，大便溏薄', '咽喉肿痛，发热恶寒',
    '皮肤瘙痒，湿疹反复', '疲劳乏力，精神不振'
  ];
  var syndromes = ['心脾两虚','肝阳上亢','脾胃虚弱','风寒束肺','肝郁气滞','肾阳虚','风寒湿痹','气血两虚','阴虚火旺','湿热内蕴','气滞血瘀','痰湿内阻','脾虚湿盛','风热犯肺','血虚风燥','中气不足'];
  var doctors = [
    {id:'D001',name:'张仲景',role:'doctor_internal',dept:'内科'},
    {id:'D002',name:'李时珍',role:'doctor_acupuncture',dept:'针灸科'},
    {id:'D003',name:'傅青主',role:'doctor_gynecology',dept:'妇科'}
  ];

  // ─── 电子病历 (30份) ───
  var emrList = [];
  for (var i = 0; i < 30; i++) {
    var di = i % complaints.length;
    emrList.push({
      id: 'EMR' + (2000 + i),
      name: ['王小明','李建国','张三妹','赵四海','钱美丽','孙老者','周阿姨','吴大叔','郑女士','冯先生'][i % 10],
      gender: i % 2 ? '女' : '男',
      age: 25 + (i * 7) % 55,
      date: new Date(Date.now() - (30-i)*86400000).toISOString().slice(0,10),
      complaint: complaints[di],
      history: '患者自述' + complaints[di],
      past: i % 3 ? '高血压' + (i%2?'·糖尿病':'') : '无特殊',
      allergy: i % 5 ? '无' : '青霉素过敏',
      family: '父亲高血压，母亲健康',
      complexion: ['明润','晦暗','潮红','苍白','萎黄','黧黑'][i%6],
      tongue_color: ['淡红','淡白','红','绛','紫暗'][i%5],
      coating: ['薄白','白腻','黄腻','黄燥','少苔','剥苔'][i%6],
      pulse: ['弦','滑','细','浮','沉','数','涩','洪'][i%8],
      tcm_disease: ['不寐','头痛','胃痛','咳嗽','月经不调','腰痛','痹证','虚劳','口疮','痤疮','心悸','眩晕','泄泻','喉痹','湿疹','虚劳'][di],
      tcm_syndrome: syndromes[di],
      treatment: '辨证论治，调和阴阳',
      herbs: [{name:['当归','白芍','黄芪','党参','柴胡','桂枝'][i%6],dosage:'9g'},{name:'甘草',dosage:'6g',note:'炙'}],
      advice: ['忌生冷油腻','注意休息','保持心情愉快','服药后复诊','清淡饮食','注意保暖'][i%6],
      created_at: new Date(Date.now() - (30-i)*86400000).toISOString()
    });
  }
  localStorage.setItem('tcm_emr', JSON.stringify(emrList));

  // ─── 处方 (20份) ───
  var rxList = [];
  for (var i = 0; i < 20; i++) {
    var doctor = doctors[i % 3];
    var di = i % syndromes.length;
    rxList.push({
      id: 'RX' + (2000 + i),
      patient_name: emrList[i].name,
      patient_id: 'P'+(10000+i),
      patient_age: emrList[i].age,
      patient_gender: emrList[i].gender,
      doctor_name: doctor.name,
      doctor_id: doctor.id,
      diagnosis: syndromes[di],
      treatment: '辨证论治',
      herbs: [{name:['桂枝','柴胡','黄芪','当归','党参'][i%5],dosage:'9g'},{name:'甘草',dosage:'6g',note:'炙'}],
      decoction_method: i%2 ? 'hospital_decoct' : 'self_decoct',
      delivery_method: ['self_pickup','mail','hospital_decoct','self_pickup'][i%4],
      notes: emrList[i].advice,
      status: ['pending_review','pending_review','verified','verified','paid','paid','paid','dispensed','ready','completed','completed','completed','completed','completed','completed','completed','completed','completed','completed','completed'][i],
      created_at: new Date(Date.now() - (20-i)*86400000).toISOString(),
      reviewed_at: i >= 2 ? new Date().toISOString() : null,
      reviewed_by: i >= 2 ? '孙思邈' : null,
      total_price: { herb_total: 50+(i*7), decoction_fee: i%2?20:0, delivery_fee: i%4===1?15:0, total: 60+(i*13) }
    });
  }
  localStorage.setItem('tcm_prescriptions', JSON.stringify(rxList));

  // ─── 针灸记录 (15次) ───
  var acuList = [];
  for (var i = 0; i < 15; i++) {
    acuList.push({
      id: 'ACU' + (2000 + i),
      patient: emrList[i].name,
      date: new Date(Date.now() - (15-i)*86400000).toISOString().slice(0,10),
      diagnosis: syndromes[i % syndromes.length],
      treatment_principle: '调和气血，疏通经络',
      points: i%3===0 ? ['足三里','三阴交','神门'] : i%3===1 ? ['风池','太阳','合谷'] : ['中脘','足三里','内关'],
      method: ['毫针刺','电针','温针灸'][i%3],
      duration: 30,
      moxibustion: i%2 ? '艾条灸' : '无艾灸',
      manipulation: ['平补平泻','提插补泻','捻转补泻'][i%3],
      created_at: new Date(Date.now() - (15-i)*86400000).toISOString()
    });
  }
  localStorage.setItem('tcm_acupuncture', JSON.stringify(acuList));

  // ─── 挂号记录 ───
  var regList = [];
  for (var i = 0; i < 10; i++) {
    var d = doctors[i%3];
    regList.push({
      id: 'REG' + (2000 + i),
      name: emrList[i].name,
      age: emrList[i].age,
      gender: emrList[i].gender,
      department_name: d.dept,
      doctor: d.name,
      queue_num: i + 1,
      fee: 30 + (i%3)*10,
      time: new Date(Date.now() - i*3600000).toISOString(),
      status: i < 5 ? 'done' : i < 8 ? 'diagnosing' : 'registered'
    });
  }
  localStorage.setItem('tcm_registrations', JSON.stringify(regList));

  // ─── 病人记录 ───
  var recList = [];
  for (var i = 0; i < 20; i++) {
    var rx = rxList[i];
    recList.push({
      patient_id: rx.patient_id,
      patient_name: rx.patient_name,
      doctor: rx.doctor_name,
      diagnosis: rx.diagnosis,
      herbs: rx.herbs,
      created_at: rx.created_at,
      prescription_id: rx.id
    });
  }
  localStorage.setItem('tcm_patient_records', JSON.stringify(recList));

  // ─── 药房订单 ───
  var phOrders = [];
  for (var i = 0; i < 12; i++) {
    var rx = rxList[i+4] || rxList[0];
    phOrders.push({
      id: 'PH' + (2000 + i),
      prescription_id: rx.id,
      patient_name: rx.patient_name,
      herbs: rx.herbs,
      status: i < 8 ? 'completed' : i < 10 ? 'ready' : 'preparing',
      delivery_method: rx.delivery_method,
      created_at: new Date(Date.now() - i*3600000).toISOString(),
      price: rx.total_price
    });
  }
  localStorage.setItem('tcm_pharmacy_orders', JSON.stringify(phOrders));

  // ─── 随访记录 ───
  var fuLog = [];
  for (var i = 0; i < 8; i++) {
    fuLog.push({
      time: new Date(Date.now() - i*86400000).toISOString(),
      type: ['initial','chronic','post_rx','health'][i%4],
      patient: emrList[i].name,
      message: '随访消息已发送',
      status: i < 6 ? 'completed' : 'sent'
    });
  }
  localStorage.setItem('tcm_followup_log', JSON.stringify(fuLog));

  // ─── 排班数据 ───
  var shifts = [];
  var today = new Date();
  for (var d = 0; d < 14; d++) {
    var date = new Date(today.getTime() + d*86400000);
    var dateStr = date.toISOString().slice(0,10);
    if (d % 2 === 0) {
      shifts.push({id:'S'+Date.now().toString(36)+d,doctor:'张仲景',date:dateStr,type:'am',department:'内科'});
      shifts.push({id:'S'+Date.now().toString(36)+(d+100),doctor:'李时珍',date:dateStr,type:'pm',department:'针灸科'});
    }
    if (d % 3 === 0) {
      shifts.push({id:'S'+Date.now().toString(36)+(d+200),doctor:'傅青主',date:dateStr,type:'am',department:'妇科'});
    }
  }
  localStorage.setItem('tcm_shifts', JSON.stringify(shifts));

  // 标记已加载
  localStorage.setItem(LOADED_KEY, '1');

  // 种子数据注入完成
})();

// ═══ 全局：手动注入种子数据 ═══
window.injectSeedData = function() {
  var key = 'tcm_seed_v2';
  localStorage.removeItem(key);
  location.reload();
};
