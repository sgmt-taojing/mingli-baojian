#!/usr/bin/env node
/**
 * 易道智鉴 · 引擎完整性测试
 * 用法: node qianyuan_engine_test.js
 */

const fs = require('fs');
const path = require('path');

const HTML_FILE = path.join(__dirname, 'divination-hub.html');

// 从HTML提取所有script内容
function extractJS(html) {
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let scripts = '';
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    scripts += match[1] + '\n';
  }
  return scripts;
}

// 检查函数定义
function checkFunctions(js) {
  const required = {
    '六爻起卦': ['liuyaoQiGua'],
    '紫微排盘': ['ziweiPaiPan', 'ziweiAnalysis'],
    '奇门遁甲': ['qimenPaiPan', 'qimenAnalyze'],
    '梅花易数': ['meihuaQiGua', 'meihuaAnalyze'],
    '大六壬': ['liurenPaiPan', 'liurenAnalyze'],
    '姓名学': ['xingmingAnalyze'],
    '风水': ['fengshuiAnalyze'],
    '择日': ['zeriCalcFull'],
  };

  const results = [];
  
  for (const [name, funcs] of Object.entries(required)) {
    const status = funcs.map(fn => {
      const regex = new RegExp(`(function\\s+${fn}\\s*\\(|${fn}\\s*=\\s*function|\\b${fn}\\s*[:=]\\s*async)`, 'i');
      return { fn, found: regex.test(js) };
    });
    
    const allFound = status.every(s => s.found);
    const missing = status.filter(s => !s.found).map(s => s.fn);
    
    results.push({
      engine: name,
      status: allFound ? '✅' : '❌',
      missing: missing.length > 0 ? missing : null
    });
  }
  
  return results;
}

// 检查调用入口
function checkCalls(js) {
  const calls = [
    ['八字排盘', 'computeBazi'],
    ['六爻引擎', 'runLiuyaoEngine'],
    ['紫微引擎', 'runZiweiEngine'],
    ['奇门引擎', 'runQimenEngine'],
    ['梅花引擎', 'runMeihuaEngine'],
    ['六壬引擎', 'runLiurenEngine'],
    ['姓名引擎', 'runXingmingEngine'],
    ['风水引擎', 'runFengshuiEngine'],
    ['择日引擎', 'runZeriEngine'],
    ['独立奇门', 'runQimen'],
    ['独立紫微', 'runZiwei'],
    ['独立梅花', 'runMeihua'],
    ['独立六壬', 'runLiuren'],
  ];

  return calls.map(([name, fn]) => ({
    name,
    status: js.includes(fn) ? '✅' : '❌'
  }));
}

// 检查数据完整性
function checkData(js) {
  const data = [
    ['天干', 'STEMS'],
    ['地支', 'BRANCHES'],
    ['五行', 'WUXING'],
    ['八卦', 'HEXAGRAMS'],
    ['二十八宿', 'XIU_NAMES'],
    ['建除十二神', 'JIANCHU'],
    ['彭祖百忌', 'PENGZU_BAIJI'],
    ['纳音表', 'NAYIN_TABLE'],
  ];

  return data.map(([name, varName]) => ({
    name,
    status: js.includes(varName) ? '✅' : '❌'
  }));
}

// 检查知识库文件
function checkKnowledgeFiles() {
  const files = [
    'knowledge-details.js',
    'knowledge-details-extra.js',
    'authoritative-knowledge-base.js',
    'koujue-database-full.js',
    'zodiac-knowledge-base.js',
    'faith-knowledge-base.js',
  ];

  return files.map(f => ({
    file: f,
    status: fs.existsSync(path.join(__dirname, f)) ? '✅' : '❌'
  }));
}

// 主测试
function main() {
  console.log('\n=== 易道智鉴 · 引擎完整性测试 ===\n');

  // 读取HTML
  const html = fs.readFileSync(HTML_FILE, 'utf-8');
  const js = extractJS(html);

  // 检查函数定义
  console.log('【引擎函数】');
  const funcResults = checkFunctions(js);
  funcResults.forEach(r => {
    console.log(`  ${r.status} ${r.engine}${r.missing ? ` (缺: ${r.missing.join(', ')})` : ''}`);
  });

  // 检查调用入口
  console.log('\n【调用入口】');
  const callResults = checkCalls(js);
  callResults.forEach(r => {
    console.log(`  ${r.status} ${r.name}`);
  });

  // 检查数据
  console.log('\n【核心数据】');
  const dataResults = checkData(js);
  dataResults.forEach(r => {
    console.log(`  ${r.status} ${r.name}`);
  });

  // 检查知识库文件
  console.log('\n【知识库文件】');
  const fileResults = checkKnowledgeFiles();
  fileResults.forEach(r => {
    console.log(`  ${r.status} ${r.file}`);
  });

  // 统计
  const totalFuncs = funcResults.filter(r => r.status === '✅').length;
  const totalCalls = callResults.filter(r => r.status === '✅').length;
  const totalData = dataResults.filter(r => r.status === '✅').length;
  const totalFiles = fileResults.filter(r => r.status === '✅').length;

  console.log('\n=== 测试汇总 ===');
  console.log(`  引擎函数: ${totalFuncs}/${funcResults.length} ✅`);
  console.log(`  调用入口: ${totalCalls}/${callResults.length} ✅`);
  console.log(`  核心数据: ${totalData}/${dataResults.length} ✅`);
  console.log(`  知识库文件: ${totalFiles}/${fileResults.length} ✅`);

  const allPass = totalFuncs === funcResults.length && 
                  totalCalls === callResults.length &&
                  totalData === dataResults.length &&
                  totalFiles === fileResults.length;

  console.log(`\n状态: ${allPass ? '✅ 全部通过' : '❌ 存在缺失'}`);
  console.log();
}

main();
