/**
 * 易道智鉴 · 微信公众号 API 对接服务
 * 端口: 3900
 * 功能: access_token管理、菜单管理、模板消息推送、JSSDK签名
 * 
 * 使用前需配置 .env 文件:
 *   WX_APPID=你的AppID
 *   WX_SECRET=你的AppSecret
 *   WX_TOKEN=你的Token
 *   WX_AES_KEY=你的EncodingAESKey
 */

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// === 配置 ===
const PORT = 3900;
const WX_API = 'https://api.weixin.qq.com';
let config = {};

// 加载.env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^(\w+)=(.+)$/);
    if (m) config[m[1]] = m[2].trim();
  });
}

// === access_token 管理 ===
let accessToken = { value: '', expireTime: 0 };

function getAccessToken() {
  return new Promise((resolve, reject) => {
    if (accessToken.value && Date.now() < accessToken.expireTime) {
      return resolve(accessToken.value);
    }
    if (!config.WX_APPID || !config.WX_SECRET) {
      return reject(new Error('WX_APPID 或 WX_SECRET 未配置'));
    }
    const url = `${WX_API}/cgi-bin/token?grant_type=client_credential&appid=${config.WX_APPID}&secret=${config.WX_SECRET}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.access_token) {
            accessToken = {
              value: json.access_token,
              expireTime: Date.now() + (json.expires_in - 300) * 1000
            };
            console.log('[WX] access_token 刷新成功');
            resolve(accessToken.value);
          } else {
            reject(new Error(`获取token失败: ${JSON.stringify(json)}`));
          }
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// === 菜单管理 ===
async function createMenu(menuData) {
  const token = await getAccessToken();
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(menuData);
    const req = https.request(`${WX_API}/cgi-bin/menu/create?access_token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// 易道智鉴菜单配置
const QIANYUAN_MENU = {
  button: [
    {
      name: "🔮 趣味国学",
      sub_button: [
        { type: "view", name: "八字排盘", url: "https://chips-elements-metallica-peak.trycloudflare.com/divination-hub.html#section-bazi" },
        { type: "view", name: "今日运势", url: "https://chips-elements-metallica-peak.trycloudflare.com/divination-hub.html#section-hero" },
        { type: "view", name: "吉日查询", url: "https://chips-elements-metallica-peak.trycloudflare.com/divination-hub.html#section-jiuri" },
        { type: "view", name: "趣味测字", url: "https://chips-elements-metallica-peak.trycloudflare.com/divination-hub.html#zhanbuSub-cezi" }
      ]
    },
    {
      name: "📚 国学殿堂",
      sub_button: [
        { type: "view", name: "每日口诀", url: "https://chips-elements-metallica-peak.trycloudflare.com/divination-hub.html#section-koujue" },
        { type: "view", name: "周易智慧", url: "https://chips-elements-metallica-peak.trycloudflare.com/divination-knowledge.html" },
        { type: "view", name: "生肖文化", url: "https://chips-elements-metallica-peak.trycloudflare.com/divination-hub.html#section-zodiac" },
        { type: "view", name: "养生时辰", url: "https://chips-elements-metallica-peak.trycloudflare.com/divination-integrated.html" },
        { type: "view", name: "经典诵读", url: "https://chips-elements-metallica-peak.trycloudflare.com/divination-hub.html#section-faith" }
      ]
    },
    {
      name: "🌿 养生生活",
      sub_button: [
        { type: "view", name: "体质测试", url: "https://chips-elements-metallica-peak.trycloudflare.com/divination-integrated.html" },
        { type: "view", name: "正念修身", url: "https://chips-elements-metallica-peak.trycloudflare.com/divination-hub.html#section-faith" },
        { type: "view", name: "养生打卡", url: "https://chips-elements-metallica-peak.trycloudflare.com/divination-hub.html#section-membership" },
        { type: "view", name: "音乐疗愈", url: "https://chips-elements-metallica-peak.trycloudflare.com/divination-hub.html#section-faith" },
        { type: "view", name: "关于我们", url: "https://chips-elements-metallica-peak.trycloudflare.com/wechat-disclaimer.html" }
      ]
    }
  ]
};

// === JSSDK 签名 ===
async function getJsapiTicket() {
  const token = await getAccessToken();
  return new Promise((resolve, reject) => {
    https.get(`${WX_API}/cgi-bin/ticket/getticket?type=jsapi&access_token=${token}`, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        const json = JSON.parse(data);
        if (json.ticket) resolve(json.ticket);
        else reject(new Error(JSON.stringify(json)));
      });
    }).on('error', reject);
  });
}

function generateJsSignature(ticket, nonceStr, timestamp, url) {
  const str = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
  return crypto.createHash('sha1').update(str).digest('hex');
}

// === HTTP 服务器 ===
const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  
  // 微信服务器验证
  if (pathname === '/wx/verify' && req.method === 'GET') {
    const signature = url.searchParams.get('signature');
    const timestamp = url.searchParams.get('timestamp');
    const nonce = url.searchParams.get('nonce');
    const echostr = url.searchParams.get('echostr');
    
    const arr = [config.WX_TOKEN, timestamp, nonce].sort();
    const sha1 = crypto.createHash('sha1').update(arr.join('')).digest('hex');
    
    if (sha1 === signature) {
      console.log('[WX] 服务器验证通过');
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(echostr);
    } else {
      console.log('[WX] 服务器验证失败');
      res.writeHead(403);
      res.end('验证失败');
    }
    return;
  }
  
  // 获取JSSDK签名
  if (pathname === '/wx/jssdk' && req.method === 'GET') {
    const pageUrl = url.searchParams.get('url');
    if (!pageUrl) { res.writeHead(400); res.end(JSON.stringify({error: '缺少url参数'})); return; }
    try {
      const ticket = await getJsapiTicket();
      const nonceStr = Math.random().toString(36).substr(2, 15);
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = generateJsSignature(ticket, nonceStr, timestamp, pageUrl);
      res.writeHead(200);
      res.end(JSON.stringify({
        appId: config.WX_APPID,
        timestamp, nonceStr, signature
      }));
    } catch (e) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  
  // 创建菜单
  if (pathname === '/wx/menu/create' && req.method === 'POST') {
    try {
      const result = await createMenu(QIANYUAN_MENU);
      res.writeHead(200);
      res.end(JSON.stringify(result));
    } catch (e) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  
  // 健康检查
  if (pathname === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', service: 'qianyuan-wechat', time: new Date().toISOString() }));
    return;
  }
  
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log(`[乾元] 微信公众号API服务启动: http://localhost:${PORT}`);
  console.log(`[乾元] 配置状态: ${config.WX_APPID ? 'AppID已配置 ✅' : 'AppID未配置 ❌'}`);
  console.log(`[乾元] 菜单配置: ${QIANYUAN_MENU.button.length}个一级菜单, ${QIANYUAN_MENU.button.reduce((s,b)=>s+b.sub_button.length,0)}个二级菜单`);
});
