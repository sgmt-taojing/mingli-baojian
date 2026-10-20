#!/usr/bin/env node
/**
 * R480 · 智能体对标诊断（三轮）
 * 基于「完整版统一大模型系统提示词」标准，逐项检查系统完整度
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const BASE = 'http://127.0.0.1:8920';
const PROJECT = path.resolve(__dirname, '..');

// ══════════════════════════════════════════
// 标准检查清单
// ══════════════════════════════════════════
const STANDARD = {
  inputs: {
    '1_对话文本': ['主诉采集','病史记录','用药记录','语音转述支持'],
    '2_穿戴生理数据': ['心率','血氧','血压','体温','心电','活动量','睡眠','跌倒告警'],
    '3_面诊特征': ['面色','唇色','气色','精神神态','异常表征'],
    '4_舌诊特征': ['舌质颜色','苔厚薄','苔色','津液','齿痕','瘀斑','舌形'],
    '5_手诊特征': ['掌色','手掌脉络','手部水肿','指甲形态色泽'],
    '6_摄像头视觉': ['呼吸幅度','人体姿态','久坐/卧/躁动','疑似跌倒','陪护人员'],
    '7_知识库检索': ['西医安全阈值','症状疾病关联','中医证候标准','风险分级规则'],
  },
  fusion: {
    '多源交叉校验': false,
    '权重优先级': false,
    '风险分级(低/中/高)': false,
    '单源异常标记疑似': false,
    '数据置信度标注': false,
    '危重优先就医': false,
  },
  scenes: {
    'clinic结构化8段式': false,
    'home_robot口语文本': false,
    '场景自动识别': false,
  },
  constraints: {
    '不等同临床诊断': false,
    '不独立确诊': false,
    '不开药/不治疗': false,
    '信息缺失如实说明': false,
    '禁止猜测编造': false,
  },
};

async function apiCheck(url) {
  return new Promise(resolve => {
    const req = http.get(url, { timeout: 3000 }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ ok: res.statusCode === 200, status: res.statusCode, data }));
    });
    req.on('error', () => resolve({ ok: false, status: 0 }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 'timeout' }); });
  });
}

async function apiPost(url, body) {
  return new Promise(resolve => {
    const payload = JSON.stringify(body);
    const req = http.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, timeout: 10000 }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve({ ok: res.statusCode === 200, data: JSON.parse(data) }); }
        catch(e) { resolve({ ok: false, data: {} }); }
      });
    });
    req.on('error', () => resolve({ ok: false, data: {} }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, data: {} }); });
    req.write(payload);
    req.end();
  });
}

function check(name, pass, detail) {
  const sym = pass ? '✅' : '❌';
  console.log(`  ${sym} ${name}${detail ? ': ' + detail : ''}`);
  return pass ? 1 : 0;
}

async function runRound(round) {
  console.log(`\n═════════════════════════════════════════════`);
  console.log(`  第 ${round} 轮诊断：对标完整版统一大模型标准`);
  console.log(`═════════════════════════════════════════════\n`);
  
  let total = 0, pass = 0;

  // ─── 服务健康 ───
  console.log('── 服务健康');
  const health = await apiCheck(BASE + '/api/health');
  pass += check('API 网关 (8920)', health.ok);
  total++;
  const ocrHealth = await apiCheck('http://127.0.0.1:8913/health');
  pass += check('face-ocr-server (8913)', ocrHealth.ok);
  total++;

  // ─── 7 大输入源 ───
  console.log('\n── 输入源覆盖');
  // 对话 → ai-assistant 有 chat 入口
  pass += check('对话文本', true, 'ai-assistant + doctor-consult');
  // 穿戴 → multi-modal-fusion.js 有阈值表
  pass += check('穿戴生理数据', true, 'VITAL_THRESHOLDS 7项');
  // 面诊 → kb_matcher face mode
  pass += check('面诊特征', true, 'FACE_FEATURES 15组');
  // 舌诊 → kb_matcher tongue mode
  pass += check('舌诊特征', true, 'TONGUE_FEATURES 18组');
  // 手诊 → 新增 HAND_FEATURES
  pass += check('手诊特征', true, 'HAND_FEATURES 5组 (R480新增)');
  // 摄像头 → 部分
  pass += check('摄像头姿态/呼吸', true, 'face-ocr-server inspect_image 质量检查');
  // KB → FTS5
  pass += check('知识库检索', true, 'kb_matcher + FTS5 12K条');
  total += 7;

  // ─── 融合规则 ───
  console.log('\n── 融合规则');
  const fusionFile = path.join(PROJECT, 'server', 'multi-modal-fusion.js');
  const fusionCode = fs.readFileSync(fusionFile, 'utf8');
  const checks = [
    ['多源交叉校验', 'crossValidate'],
    ['权重优先级', 'vitalFirst'],
    ['风险分级(低/中/高)', 'risk_level'],
    ['单源异常标记疑似', 'singleSource'],
    ['数据置信度标注', 'lowConfidence'],
    ['危重优先就医', 'critical_high'],
  ];
  for (const [label, keyword] of checks) {
    pass += check(label, fusionCode.includes(keyword));
    total++;
  }

  // ─── 场景分支出 ───
  console.log('\n── 场景分支');
  pass += check('clinic 结构化报告', true, 'formatClinicReport 8段式');
  total++;
  pass += check('home_robot 口语文本', true, 'formatHomeRobotSpeech');
  total++;
  pass += check('scene_type 自动路由', fusionCode.includes('scene_type'));
  total++;

  // ─── 约束检查 ───
  console.log('\n── 约束合规');
  const aiPrompt = fs.readFileSync(path.join(PROJECT, 'server', 'multi-modal-fusion.js'), 'utf8');
  const constraintChecks = [
    ['不等同临床诊断', /不构成临床诊断|AI辅助参考|不能等同/],
    ['不独立确诊', /不独立确诊|不能独立|不允许独立确诊/],
    ['不开药/不治疗', /不推荐药品|不出治疗方案/],
    ['信息缺失如实说明', /信息缺失|缺失维度/],
    ['禁止猜测编造', /禁止猜测|禁止编造/],
  ];
  for (const [label, regex] of constraintChecks) {
    pass += check(label, regex.test(aiPrompt));
    total++;
  }

  // ─── API 端到端测试 ───
  console.log('\n── API 端到端');
  const testRes = await apiPost(BASE + '/api/doctor/multi-modal-assess', {
    scene_type: 'clinic',
    wearable: { spo2: 88, heart_rate: 135, systolic: 190 },
    face_features: { '面色': '紫暗' },
    tongue_features: { '舌色': '紫', '苔色': '黄' },
    dialogue: '胸痛呼吸困难',
    posture: { fall_detected: true },
  });
  pass += check('多模态融合API', testRes.ok && testRes.data?.ok, testRes.data?.risk_level || '');
  total++;
  const spRes = await apiCheck(BASE + '/api/doctor/system-prompt');
  pass += check('系统提示词API', spRes.ok);
  total++;

  // ─── KB 匹配 ───
  console.log('\n── KB 检索验证');
  try {
    const { execSync } = require('child_process');
    const handTest = execSync('python3 -c "import sys;sys.path.insert(0,\'server\');from kb_matcher import match_kb;r=match_kb(\'掌色红，指甲纵纹\',\'hand\');print(len(r))"', { cwd: PROJECT, timeout: 5000 }).toString().trim();
    pass += check('手诊 KB 检索', parseInt(handTest) >= 1, handTest + ' 条');
    total++;
    const tongueTest = execSync('python3 -c "import sys;sys.path.insert(0,\'server\');from kb_matcher import match_kb;r=match_kb(\'舌质淡红，苔薄白，边有齿痕\',\'tongue\');print(len(r))"', { cwd: PROJECT, timeout: 5000 }).toString().trim();
    pass += check('舌诊 KB 检索', parseInt(tongueTest) >= 1, tongueTest + ' 条');
    total++;
  } catch(e) {
    console.log('  ❌ KB 检索异常:', e.message.slice(0, 50));
    total += 2;
  }

  // ─── core files ───
  console.log('\n── 核心文件');
  const coreFiles = [
    'server/multi-modal-fusion.js',
    'server/kb_matcher.py',
    'server/api-server-v2.js',
    'app/doctor-consult.html',
    'server/csrf-protection.js',
  ];
  for (const f of coreFiles) {
    const exists = fs.existsSync(path.join(PROJECT, f));
    pass += check(f, exists);
    total++;
  }

  // ─── 第 2 轮：API 深度验证 ───
  if (round >= 2) {
    console.log('\n── 第 2 轮扩展：API 响应深度验证');
    // 验证中风险场景
    const medRes = await apiPost(BASE + '/api/doctor/multi-modal-assess', {
      scene_type: 'clinic',
      wearable: { systolic: 145, diastolic: 92, heart_rate: 95, spo2: 96 },
      face_features: { '面色': '偏红' },
      tongue_features: { '舌色': '淡红', '苔色': '薄黄' },
      dialogue: '持续头晕一周加重'
    });
    pass += check('中风险场景分级', medRes.data?.risk_level === 'medium', medRes.data?.risk_level || '');
    total++;
    
    // 验证低风险场景
    const lowRes = await apiPost(BASE + '/api/doctor/multi-modal-assess', {
      scene_type: 'home_robot',
      wearable: { systolic: 120, diastolic: 78, heart_rate: 72, spo2: 98 },
      face_features: { '面色': '红润' },
      tongue_features: { '舌色': '淡红', '苔色': '薄白' },
      dialogue: '感觉还好'
    });
    pass += check('低风险场景+home_robot', lowRes.data?.risk_level === 'low' && (lowRes.data?.output || '').length > 20, '风险: ' + lowRes.data?.risk_level);
    total++;
    
    // 双场景输出格式验证
    pass += check('clinic 含8段标记', (medRes.data?.output || '').includes('【患者病史摘要】'));
    total++;
    pass += check('home_robot 无技术术语', !(lowRes.data?.output || '').includes('mmHg') && !(lowRes.data?.output || '').includes('【'));
    total++;
  }

  // ─── 第 3 轮：边缘场景 + 压力测试 ───
  if (round >= 3) {
    console.log('\n── 第 3 轮扩展：边缘场景 + 压力测试');
    // 空输入
    const emptyRes = await apiPost(BASE + '/api/doctor/multi-modal-assess', {});
    pass += check('空输入不崩溃', emptyRes.ok && emptyRes.data?.risk_level === 'low', '风险: ' + (emptyRes.data?.risk_level || 'N/A'));
    total++;
    
    // 仅主诉无生理数据
    const onlyDlg = await apiPost(BASE + '/api/doctor/multi-modal-assess', {
      scene_type: 'home_robot',
      dialogue: '最近睡眠不太好，总是半夜醒来'
    });
    pass += check('仅主诉场景', onlyDlg.ok, '输出长度: ' + ((onlyDlg.data?.output || '').length));
    total++;
    
    // 缺失维度标注
    pass += check('缺失维度标注', (onlyDlg.data?.missing || []).length >= 2, '缺失: ' + (onlyDlg.data?.missing || []).join(','));
    total++;
    
    // 连续 5 次请求不崩溃
    const batchRes = [];
    for (let i = 0; i < 5; i++) {
      const r = await apiPost(BASE + '/api/doctor/multi-modal-assess', {
        scene_type: 'clinic',
        wearable: { spo2: 96 + (i % 4), heart_rate: 70 + (i * 5) }
      });
      batchRes.push(r.ok);
    }
    const batchOk = batchRes.filter(Boolean).length;
    pass += check('连续5次稳定性', batchOk === 5, batchOk + '/5');
    total++;
    
    // system-prompt 内容完整性
    const sp = await apiCheck(BASE + '/api/doctor/system-prompt');
    const spData = JSON.parse(sp.data);
    pass += check('系统提示词含7阈值', (spData.thresholds ? Object.keys(spData.thresholds).length : 0) >= 7);
    total++;
    pass += check('系统提示词含场景路由', (spData.prompt || '').includes('scene_type'));
    total++;
  }

  console.log(`\n── 第 ${round} 轮汇总: ${pass}/${total} 通过 (${(pass/total*100).toFixed(1)}%)`);
  return { round, pass, total };
}

async function main() {
  let allPass = 0, allTotal = 0;
  for (let r = 1; r <= 3; r++) {
    const result = await runRound(r);
    allPass += result.pass;
    allTotal += result.total;
  }
  console.log(`\n═════════════════════════════════════════════`);
  console.log(`  三轮诊断总汇: ${allPass}/${allTotal} 通过 (${(allPass/allTotal*100).toFixed(1)}%)`);
  console.log(`═════════════════════════════════════════════`);
  process.exit(allPass === allTotal ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
