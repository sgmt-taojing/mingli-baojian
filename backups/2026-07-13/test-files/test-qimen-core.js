// 奇门遁甲核心算法测试
// 验证 qimenPaiPan() 的地盘、天盘、八门、九星、八神是否正确
// 测试用例来自《奇门遁甲统宗》《烟波钓叟歌》《奇门遁甲秘笈大全》经典排盘

// 模拟 browser 环境
global.window = global;
global.document = { getElementById: () => null, addEventListener: () => {}, readyState: 'complete' };
global.showToast = () => {};
global.playDivinationSound = () => {};
// 提供 window.addEventListener mock
window.addEventListener = () => {};
window.removeEventListener = () => {};

// 读取并求值 calc-engine-lib.js
const fs = require('fs');
const path = require('path');
const libCode = fs.readFileSync(path.join(__dirname, 'app/js/calc-engine-lib.js'), 'utf8');
// 直接执行
eval(libCode);

// 现在 window 上应该有 qimenPaiPan
console.log('qimenPaiPan is', typeof qimenPaiPan);

// 测试1：2024年冬至后，阳遁1局
// 2024年12月21日 14:00（壬寅年，庚子月，壬午日，申时）
// 节气：冬至后 → 阳遁；上元 → 1局
console.log('\n========== 测试1：2024年冬至后，阳遁1局 ==========');
const pan1 = qimenPaiPan(2024, 12, 21, 14, 'yang');
console.log('dun:', pan1.dun, 'ju:', pan1.ju);
console.log('地盘(戊己庚辛壬癸丁丙乙):', JSON.stringify(pan1.dipan));
console.log('天盘:', JSON.stringify(pan1.tianpan));
console.log('八门:', JSON.stringify(pan1.men));
console.log('九星:', JSON.stringify(pan1.stars));
console.log('八神:', JSON.stringify(pan1.shen));
console.log('dayGzIdx:', pan1.dayGzIdx, 'hourGzIdx:', pan1.hourGzIdx);

// 测试2：2024年夏至后，阴遁9局
// 2024年6月22日 12:00（甲辰年，癸亥月，壬午日，午时）
// 节气：夏至后 → 阴遁；上元 → 9局
console.log('\n========== 测试2：2024年夏至后，阴遁9局 ==========');
const pan2 = qimenPaiPan(2024, 6, 22, 12, 'yin');
console.log('dun:', pan2.dun, 'ju:', pan2.ju);
console.log('地盘(戊己庚辛壬癸丁丙乙):', JSON.stringify(pan2.dipan));
console.log('天盘:', JSON.stringify(pan2.tianpan));
console.log('八门:', JSON.stringify(pan2.men));
console.log('九星:', JSON.stringify(pan2.stars));
console.log('八神:', JSON.stringify(pan2.shen));

// 测试3：2024年春分后，阳遁9局（惊蛰 → 阳遁1/7/4）
// 用惊蛰后日期：2024年3月22日 14:00
// 甲子戊（时辰），冬至后阳遁上元 → 1局
console.log('\n========== 测试3：2024年惊蛰后春分前 ==========');
const pan3 = qimenPaiPan(2024, 3, 22, 14, 'yang');
console.log('dun:', pan3.dun, 'ju:', pan3.ju);
console.log('地盘:', JSON.stringify(pan3.dipan));
console.log('天盘:', JSON.stringify(pan3.tianpan));
console.log('八门:', JSON.stringify(pan3.men));
console.log('九星:', JSON.stringify(pan3.stars));
console.log('八神:', JSON.stringify(pan3.shen));

// 测试4：2024年立冬后，阴遁6局
// 2024年11月10日
console.log('\n========== 测试4：2024年立冬后，阴遁 ==========');
const pan4 = qimenPaiPan(2024, 11, 10, 10, 'yin');
console.log('dun:', pan4.dun, 'ju:', pan4.ju);
console.log('地盘:', JSON.stringify(pan4.dipan));
console.log('天盘:', JSON.stringify(pan4.tianpan));
console.log('八门:', JSON.stringify(pan4.men));
console.log('九星:', JSON.stringify(pan4.stars));
console.log('八神:', JSON.stringify(pan4.shen));

// 测试5：自动判定
console.log('\n========== 测试5：auto 模式 ==========');
const pan5 = qimenPaiPan(2024, 12, 21, 14, 'auto');
console.log('auto 判定 dun:', pan5.dun, 'ju:', pan5.ju);

const pan6 = qimenPaiPan(2024, 6, 22, 12, 'auto');
console.log('auto 判定 dun:', pan6.dun, 'ju:', pan6.ju);

// 验证：地盘三奇六仪排列
// 阳遁1局：戊起1宫，顺布 → 1戊、2己、3庚、4辛、5壬、6癸、7丁、8丙、9乙
// 阴遁9局：戊起9宫，逆布 → 9戊、8己、7庚、6辛、5壬、4癸、3丁、2丙、1乙
console.log('\n========== 验证：阳遁1局地盘 ==========');
const expectedYangJu1 = {1:'戊', 2:'己', 3:'庚', 4:'辛', 5:'壬', 6:'癸', 7:'丁', 8:'丙', 9:'乙'};
let passYang1 = true;
for (let k in expectedYangJu1) {
  if (pan1.dipan[k] !== expectedYangJu1[k]) {
    console.log('  MISMATCH pan1.dipan['+k+']=' + pan1.dipan[k] + ', expected=' + expectedYangJu1[k]);
    passYang1 = false;
  }
}
console.log(passYang1 ? '✓ 阳遁1局地盘正确' : '✗ 阳遁1局地盘错误');

console.log('\n========== 验证：阴遁6局地盘 ==========');
const expectedYinJu6 = {6:'戊', 5:'己', 4:'庚', 3:'辛', 2:'壬', 1:'癸', 9:'丁', 8:'丙', 7:'乙'};
let passYin6 = true;
for (let k in expectedYinJu6) {
  if (pan2.dipan[k] !== expectedYinJu6[k]) {
    console.log('  MISMATCH pan2.dipan['+k+']=' + pan2.dipan[k] + ', expected=' + expectedYinJu6[k]);
    passYin6 = false;
  }
}
console.log(passYin6 ? '✓ 阴遁6局地盘正确' : '✗ 阴遁6局地盘错误');

// 阳遁4局（惊蛰上元）
console.log('\n========== 验证：阳遁4局地盘 ==========');
const expectedYangJu4 = {4:'戊', 5:'己', 6:'庚', 7:'辛', 8:'壬', 9:'癸', 1:'丁', 2:'丙', 3:'乙'};
let passYang4 = true;
for (let k in expectedYangJu4) {
  if (pan3.dipan[k] !== expectedYangJu4[k]) {
    console.log('  MISMATCH pan3.dipan['+k+']=' + pan3.dipan[k] + ', expected=' + expectedYangJu4[k]);
    passYang4 = false;
  }
}
console.log(passYang4 ? '✓ 阳遁4局地盘正确' : '✗ 阳遁4局地盘错误');

// 阴遁9局（立冬上元）
console.log('\n========== 验证：阴遁9局地盘 ==========');
const expectedYinJu9 = {9:'戊', 8:'己', 7:'庚', 6:'辛', 5:'壬', 4:'癸', 3:'丁', 2:'丙', 1:'乙'};
let passYin9 = true;
for (let k in expectedYinJu9) {
  if (pan4.dipan[k] !== expectedYinJu9[k]) {
    console.log('  MISMATCH pan4.dipan['+k+']=' + pan4.dipan[k] + ', expected=' + expectedYinJu9[k]);
    passYin9 = false;
  }
}
console.log(passYin9 ? '✓ 阴遁9局地盘正确' : '✗ 阴遁9局地盘错误');

// 验证：三奇六仪总数对吗
console.log('\n========== 验证：三奇六仪完整性 ==========');
const liuSanExpected = ['戊','己','庚','辛','壬','癸','丁','丙','乙'];
let allCorrect = true;
[pan1, pan2, pan3, pan4].forEach((p, idx) => {
  const dipArr = [];
  for (let i=1; i<=9; i++) dipArr.push(p.dipan[i]);
  // 检查是否包含所有 liuSan
  const liuSanCopy = [...liuSanExpected];
  for (let i=0; i<dipArr.length; i++) {
    const idx2 = liuSanCopy.indexOf(dipArr[i]);
    if (idx2 < 0) { allCorrect = false; console.log('pan'+(idx+1)+' dipan 重复或丢失:', dipArr); break; }
    liuSanCopy.splice(idx2, 1);
  }
  if (liuSanCopy.length > 0) { allCorrect = false; console.log('pan'+(idx+1)+' dipan 不完整:', liuSanCopy); }
});
console.log(allCorrect ? '✓ 所有排盘地盘三奇六仪完整且不重复' : '✗ 地盘三奇六仪不完整');