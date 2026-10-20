// 专利申请截图脚本 — 从登录开始逐页截图（至少20张）
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:8900/';
const OUT = path.join(process.env.HOME, 'Desktop', '命理宝鉴专利材料', '截图');
fs.mkdirSync(OUT, { recursive: true });

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// 截图清单：页面 / 功能说明 / 是否登录前操作
const PAGES = [
  { file: 'login.html', name: '01-登录页', desc: '系统登录入口页，输入11位手机号与密码进行身份验证，登录后进入平台主界面。' },
  { file: 'login.html', name: '02-登录页填写', desc: '填写登录账号信息：手机号 13800138000、6位短信验证码 123456，前端进行格式校验（11位手机号+6位验证码正则校验）。' },
  { file: 'login.html', name: '03-登录提交', desc: '点击"登 录"按钮提交，系统校验凭证并通过后自动跳转至平台首页。' },
  { file: 'divination-hub.html', name: '04-平台主界面', desc: '平台总览首页，聚合八字、紫微、奇门、六爻、风水、中医诊疗等全部功能模块入口。' },
  { file: 'tcm-portal.html', name: '05-中医诊疗门户', desc: '中医诊疗总门户，集成面诊、舌诊、手诊、望诊中心、证候辨证、方剂知识库等中医模块。' },
  { file: 'doctor-consult.html', name: '06-临床实时采集', desc: '医生端临床实时采集工作台，支持固定摄像头+穿戴设备双源画面预览，一键确认完成拍照采集。' },
  { file: 'tcm-symptom.html', name: '07-舌面手采集', desc: '舌诊/面诊/手诊专项采集页面，引导用户按标准姿势拍摄，供AI视觉识别与辨证分析。' },
  { file: 'wangzhen-center.html', name: '08-望诊中心', desc: 'AI望诊中心：整合面部气色、舌象、手部特征的识别结果与知识库辨证匹配。' },
  { file: 'ai-assistant.html', name: '09-AI智能助手', desc: 'AI助手对话界面，支持自然语言问答、知识库检索（KB优先命中直答）、语音输入输出。' },
  { file: 'bazi.html', name: '10-八字排盘', desc: '八字排盘模块：输入出生信息，自动排四柱八字、十神、大运流年，输出命理解读报告。' },
  { file: 'ziwei.html', name: '11-紫微斗数', desc: '紫微斗数排盘：按出生年月日时安星布宫，输出十二宫主星与四化飞星解析。' },
  { file: 'divination-almanac.html', name: '12-择日黄历', desc: '择日黄历：查询每日宜忌、节气、吉神凶煞，支持结婚、搬家、开业等事项择日。' },
  { file: 'kb-explorer.html', name: '13-知识库浏览器', desc: '知识库浏览器：13,000+条结构化易学与中医知识，支持分类浏览与全文检索。' },
  { file: 'kb-graph.html', name: '14-知识图谱', desc: '知识图谱可视化：展示知识条目间的关系网络，支持节点点击下钻查看详情。' },
  { file: 'lifeplan-detail.html', name: '15-人生蓝图', desc: '人生蓝图报告：基于排盘数据生成人生时间轴、12领域矩阵与未来五年行动建议，可打印分享。' },
  { file: 'lifeindex-detail.html', name: '16-生命指数', desc: '生命指数报告：从事业、财运、健康、婚姻等10个维度输出量化评分与五行权重分析。' },
  { file: 'tcm-clinic.html', name: '17-中医诊所', desc: '中医诊所工作台：患者管理、问诊记录、辨证开方、复诊跟踪全流程管理。' },
  { file: 'patient-portal.html', name: '18-患者门户', desc: '患者端门户：查看个人档案、诊断报告、随访提醒与健康建议。' },
  { file: 'doctor-panel.html', name: '19-医生工作台', desc: '医生工作台：接诊列表、实时监控患者端采集数据、多模态评估与诊疗结论出具。' },
  { file: 'device-management.html', name: '20-设备管理', desc: '设备管理：摄像头、穿戴设备等健康采集设备的接入、状态监控与联动配置。' },
  { file: 'camera-capture.html', name: '21-摄像头采集', desc: '摄像头采集分析：拍摄面部/舌象照片，调用AI视觉识别引擎输出结构化特征与知识库匹配结果。' },
  { file: 'wellness-track.html', name: '22-健康追踪', desc: '健康追踪：睡眠、心率、运动等穿戴数据的趋势图表与健康评分。' },
  { file: 'person-center.html', name: '23-个人中心', desc: '个人中心：账户信息、排盘记录、推送设置、积分与收藏管理。' },
  { file: 'naming-portal.html', name: '24-起名改名', desc: '起名改名：结合生辰八字五行喜忌，智能推荐吉名并输出寓意解析。' },
  { file: 'fengshui.html', name: '25-风水堪舆', desc: '风水堪舆：阳宅布局分析、飞星盘、流年方位吉凶与化解建议。' },
  { file: 'report-interpret.html', name: '26-报告解读', desc: '排盘报告解读：分段式呈现盘面溯源、行为心性、环境化解与执行须知。' },
  { file: 'daily-summary.html', name: '27-每日总结', desc: '每日总结：自动汇总当日运势、健康建议、知识推送与待办事项。' },
  { file: 'divination-hub.html', name: '28-功能总览回看', desc: '功能总览：全平台28类功能模块聚合入口，支持搜索直达。' },
];

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1600,900'],
    defaultViewport: { width: 1600, height: 900 },
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36');

  const results = [];
  let idx = 0;

  for (const item of PAGES) {
    idx++;
    try {
      const url = BASE + item.file;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await new Promise(r => setTimeout(r, 2200));

      // 登录流程交互
      if (item.file === 'login.html') {
        if (item.name.includes('填写')) {
          await page.type('#phone', '13800138000');
          await page.type('#code', '123456');
          await new Promise(r => setTimeout(r, 800));
        } else if (item.name.includes('提交')) {
          await page.click('#login-btn');
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      const filePath = path.join(OUT, `${item.name}.png`);
      await page.screenshot({ path: filePath, fullPage: false });
      results.push({ name: item.name, desc: item.desc, path: filePath });
      console.log(`[${idx}/${PAGES.length}] ${item.name} OK`);
    } catch (e) {
      console.log(`[${idx}] ${item.name} FAIL: ${e.message.slice(0, 80)}`);
      results.push({ name: item.name, desc: item.desc + '（截图失败）', path: null });
    }
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, '_manifest.json'), JSON.stringify(results, null, 2));
  console.log(`\n完成: ${results.filter(r => r.path).length} 张截图`);
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
