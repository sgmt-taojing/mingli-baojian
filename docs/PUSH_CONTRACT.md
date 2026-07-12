# 命理宝鉴 · 推送契约（v2.0）

**日期**：2026-07-12
**状态**：Phase D-4 设计冻结
**适用范围**：H5 首次排盘推送 + 公众号菜单 + 小程序云函数 + cron 定时四通道

---

## 〇、设计目标

1. **用户首次排盘后立即推送一次老黄历四板块**，建立初次体验仪式感
2. 四通道（H5 / 公众号 / 小程序 / cron）共享同一份模板，避免维护散落
3. 防重机制：**客户端 localStorage + 服务端 push_log 双键冗余**
4. 知识准确性：所有推送内容必须经过 `verify_knowledge.py` 校验

---

## 一、推送时机矩阵

| 时机 | 通道 | 来源 | 防重键 | 文案 |
|---|---|---|---|---|
| 用户首次排盘 | H5 内弹窗 | 客户端 `localStorage['_firstAlmanacPushed']` | 用户 UUID | 四板块完整（≤9203 字符） |
| 用户首次排盘 | 公众号菜单 | 服务端 `push_log` | `user_id + date` | 四板块精简版（≤1500 字符） |
| 用户首次排盘 | 小程序云函数 | 转发到主推送服务 | 同上 | 四板块完整 |
| 每日 6:00 / 18:00 | cron + 公众号 | `daily_push.js` | 日期分桶 | 当日 4 板块 |
| 节日 / 节气 | cron | 同上 | `event_id + date` | 节日特别版 |

---

## 二、四板块结构（固化，不允许修改顺序）

```
🔮 鉴运知变 · 静观自在
   ├─ 人生阶段（十二长生 + 干喜支忌）
   ├─ 健康预警（五行器官）
   ├─ 本命佛（12 生肖）
   ├─ 运势评分（1-100）
   └─ 化解建议

🧭 顺天应时 · 致中达和
   ├─ 宜忌
   ├─ 财神喜神方位（具体用途）
   ├─ 吉时
   ├─ 穿搭（节气 + 五行色）
   ├─ 饮食（补X疏Y）
   └─ 五行养生（器官 + 穴位 + 养护要点）

🙏 敬天法祖 · 顺时养生
   ├─ 佛道儒节日（神仙作用 + 所求）
   ├─ 参拜指南（尊称 + 发愿 + 动作 + 地点 + 名山 + 还愿 + 禁忌）
   ├─ 近期 7 天提醒
   ├─ 今晚准备（供品 + 诵持 + 时辰）
   ├─ 节气养生（饮食 + 起居 + 游玩）
   └─ 法定假日提醒

📿 修己安人 · 明心见性
   ├─ 修行口诀
   ├─ 正念
   ├─ 咒语（生僻字注音）
   ├─ 三元九运（离火忠告轮换 + 结合命理）
   └─ 鼓励语（结合人生阶段）
```

---

## 三、防重实现（D-4 核心）

### 3.1 客户端（localStorage）
```js
function canPushFirstAlmanac(userId) {
  const key = '_firstAlmanacPushed_' + userId
  if (localStorage.getItem(key)) {
    return false  // 已推送，跳过
  }
  localStorage.setItem(key, new Date().toISOString())
  return true
}
```

### 3.2 服务端（push_log 表）
```sql
CREATE TABLE push_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  push_type TEXT NOT NULL,        -- 'first_almanac' | 'daily_morning' | ...
  push_date TEXT NOT NULL,        -- 'YYYY-MM-DD'
  channel TEXT NOT NULL,          -- 'h5' | 'mp' | 'minip' | 'cron'
  version TEXT NOT NULL,          -- 'v2'
  payload_hash TEXT,              -- SHA256 of payload
  ts DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, push_type, push_date)
);

CREATE INDEX idx_push_log_user ON push_log(user_id, push_type, push_date);
```

### 3.3 服务端查询
```js
async function shouldPushFirst(userId) {
  const today = new Date().toISOString().slice(0,10)
  const row = db.prepare(`
    SELECT 1 FROM push_log 
    WHERE user_id = ? AND push_type = 'first_almanac' 
      AND push_date = ?
  `).get(userId, today)
  if (row) return false  // 今天已推送
  
  db.prepare(`
    INSERT INTO push_log (user_id, push_type, push_date, channel, version)
    VALUES (?, 'first_almanac', ?, 'h5', 'v2')
  `).run(userId, today)
  return true
}
```

---

## 四、模板签名（D-2 接口契约一致性）

```js
function renderAlmanacHTML(user, options) {
  return {
    engine: 'almanac_v2',
    version: 'v2',
    source: '《协纪辨方书》《钦定协纪辨方书》《三历撮要》',
    accuracy: 0.92,
    blocks: [
      renderJianYun(user.birthDayun),
      renderShunTian(user.birthDayun),
      renderJingTian(today),
      renderXiuJi(user.birthDayun),
    ],
    meta: {
      user_id: user.id,
      generated_at: new Date().toISOString(),
      render_ms: 0  // 记录耗时
    }
  }
}
```

---

## 五、API 设计

| 接口 | 方法 | 鉴权 | 说明 |
|---|---|---|---|
| `/api/push/first-almanac` | GET | ✅ Bearer | 检查是否推送过，返回 HTML |
| `/api/push/log` | POST | ✅ Bearer | 上报客户端收到的推送 |
| `/api/push/daily` | cron | ❌ | 内部调用，cron 触发每日推送 |
| `/api/push/preview` | GET | ✅ Bearer | 预览今日推送（不写入日志） |

---

## 六、错误处理

| 错误码 | 含义 | 用户感知 |
|---|---|---|
| 200 | 推送成功 | 显示四板块 |
| 401 | 未登录 | 跳登录 |
| 403 | 今日已推送 | "今日已推送，明日 6:00 自动更新" |
| 500 | 服务端异常 | "推送稍后送达" |

---

## 七、合规与免责声明

每篇推送文末加入：
```
──────────────
⚠️ 国学文化演绎，个人参考。
本内容基于传统典籍与现代黄历，纯属娱乐参考，
非医疗机构诊断、不替代专业意见。
──────────────
```

---

## 八、归档

- 公共模板：`server/push/tpl/almanac.hbs` （D 阶段创建）
- H5 内模板：`divination-hub.html` 内嵌 `generateFirstPush`（已实现）
- 公众号菜单：复用 `server/push/tpl/almanac.hbs`
- 小程序：`miniprogram/cloudfunctions/firstAlmanac/index.js` 转发到主服务

设计冻结日：2026-07-14
