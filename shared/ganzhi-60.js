// R779：六十甲子循环数据（排盘引擎 R778 年份扩展的配套常量）
// 用途：历法校准智能体的干支对照与超界年份折叠验证
'use strict';
const GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
// 六十甲子全表（1984 甲子年起算索引 0）
const JIAZI_60 = [];
for (let i = 0; i < 60; i++) JIAZI_60.push(GAN[i % 10] + ZHI[i % 12]);
// 年份→干支（以 1984 甲子年为基准）
function yearGanzhi(year) { return JIAZI_60[((year - 1984) % 60 + 60) % 60]; }
// 超界折叠（与 paipan.py fold_year_60jiazi 一致）
function foldYear(year) { while (year < 1 || year > 9999) { year += year < 1 ? 60 : -60; } return year; }
module.exports = { GAN, ZHI, JIAZI_60, yearGanzhi, foldYear };
