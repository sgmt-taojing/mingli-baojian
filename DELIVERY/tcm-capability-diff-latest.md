# tcm → mingli 能力差集巡检（二阶段增量吸收）

- 生成：2026-08-31 15:25 ｜ 差集指纹 `e7ae6f5b7dcb72d1`
- tcm 侧 HEAD：`5388880 数字孪生接真实病程时间线+数据边界标注，缺口表12行全闭环`
- 结论：**✅ 全对齐（无待吸收增量）**

## L1 API 路由差集（tcm 有 · medical-stack 无）：0 条
- （空）

## 已知等价登记（勿重复建设）：3 条
- `get /manifest.json` → mingli 8900 静态直挂 app/manifest.json
- `get /pwa-inject.js` → mingli 等价物 /pwa/pwa-inject.js（8900 静态）
- `get /sw.js` → mingli 等价物 /service-worker.js（8900 静态直挂 app/service-worker.js）

## L2 关键模块导出函数差集
- （空）

## L3 种子数据差集：0 项
- （空）

## L4 页面层参考：tcm 比 mingli 多 52 个页面（按三分法人工定性：真缺口/已有等价/架构定位）

## medical-stack 独有（命理增量层，勿回流 tcm）：15 条
（批注/预约自建/reflux/短信校验等，属 mingli 特有边界，详见 ADR-007）

---
处置流程见 docs/TCM-ABSORPTION-SPEC.md：移植→适配→冒烟→KANBAN 留证。禁止二次训练；R745/R756/R757 守卫不可绕过。
