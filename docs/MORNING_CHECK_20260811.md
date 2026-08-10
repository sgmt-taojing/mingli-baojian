# 2026-08-11 晨间工作检查报告

> 生成时间：2026-08-11 01:00 · 覆盖：8/10 全量 + 8/11 凌晨
> 检查方式：打开下方入口逐项验证

---

## 一、服务健康（9 端口全绿）

| 端口 | 服务 | 状态 | 验证方式 |
|---|---|---|---|
| 8900 | 前端静态 | ✅ 200 | http://127.0.0.1:8900/ |
| 8901 | KB API | ✅ 200 | — |
| 8911 | 排盘 API | ✅ 200 | — |
| 8912 | TTS | ✅ 200 | — |
| 8913 | 视觉 OCR | ✅ 200 | — |
| 8920 | API 网关 | ✅ 200 | /api/health |
| 8950 | MLX 本地模型 | ✅ 200 | /health（v4 融合模型） |

---

## 二、核心功能检查清单

### 1. 四方实时协作诊断（R497 系列）⭐ 核心能力
**入口**：http://127.0.0.1:8900/collab-diagnosis.html
- [ ] 患者端：拍照/症状/病情勾选/语音收音/连续采集
- [ ] 语音边说边匹配知识库（3-7ms 实时）
- [ ] 视觉连续采集（2.5s/帧 + 多帧投票）
- [ ] 静音 3s 自动停止收音 → 自动提交会话
- [ ] 医生端：登录（doctor/doctor123 或点演示账号一键填充）→ 队列 → 审核 → 处方 → 终审
- [ ] 无人化：双源融合置信 ≥60% → AI 自主自动出方（🤖AI自主 标记）
- [ ] 安全闸门：孕妇/儿童/十八反 → 自动拦截降级

### 2. 出海体系（R498-R503）
- [ ] 激活流程：http://127.0.0.1:8900/activate.html（选国别+语言 → 确认 → 激活）
- [ ] 海外入口：http://127.0.0.1:8900/index-global.html（免责横幅/语言切换/全球方剂搜索）
- [ ] 国内入口：http://127.0.0.1:8900/index.html（守卫清除海外状态，纯中文全功能）
- [ ] 地区隔离：collab?region=sg 海外直达，医生队列 ?region= 过滤
- [ ] 全球方剂库：http://127.0.0.1:8920/api/global-formulas/search?q=insomnia（25 方剂 5 体系）

### 3. 排盘 + i18n
- [ ] 八字/紫微/风水/奇门/六爻/梅花/六壬 7 页全部接入 i18n-engine
- [ ] 语言包：zh-CN / zh-TW / en-SG / ja-JP / ko-KR / vi-VN

---

## 三、MLX 模型训练（v5 进行中）

| 版本 | 数据 | 结果 |
|---|---|---|
| v3 | 692 条 | eval 46.4 FAIL（iter230 后 NaN，内存爆） |
| v4 | 819 条 | eval 54.0（全程无 NaN，rank4/12层修真） |
| **v5（本轮）** | **1032 条** | **训练中**（rank8/24层/lr3e-6/800iters，iter140 loss 0.94，peak 7.3GB 安全） |

- 训练完成后自动 eval → 达标（≥60）部署到 8950；未达标记录结果下轮迭代
- 训练日志：`logs/mlx-v5-train.log`
- checkpoint：`training/mlx-checkpoints/mingli-sft-v5/`

---

## 四、数据安全（昨日事故修复）

- ⚠️ 8/10 晚发生安全任务重构 git 仓库，server/scripts 源码差点全部丢失
- ✅ **已恢复**：从 data1 快照恢复 110 server + 113 scripts 文件
- ✅ **已加固**：
  - server/.git + scripts/.git 独立本地仓库（版本历史本地保留）
  - **快照 cron 已装**：每天 23:00 自动备份到 /Volumes/data1/code-snapshots/（脚本 scripts/snapshot-to-data1.sh）
  - 手动快照验证：2026-08-11 已生成 ✅

---

## 五、提交记录（全部已推送 GitHub）

```
cd09aab feat(r503): collab region参数化 + 排盘页i18n全接入
2670e55 feat(r502): 国内/海外版本隔离
409ab21 feat(r501): 全球方剂接入诊断链
b528625 feat(r500): 类iPhone激活流程
30ea2eb feat(r499): 全球传统医学方剂库
be1b5e0 feat(r498): 出海i18n框架+合规分层
11119bf feat(r497f): 双源融合置信(无人化)
... (R497 系列 6 个 commit)
```

---

## 六、未完成 / 待办

| 事项 | 状态 | 说明 |
|---|---|---|
| MLX v5 eval | 🔄 训练中 | 明早查看 logs/mlx-v5-train.log + eval-results |
| 专属账号密码 | ⏸ 用户搁置 | BOSS_USERNAME 环境变量可配 |
| R495 公开数据集下载 | ⏸ 需注册 | TMC-Tongue (DataDryad CC-BY) |
| 海外支付接入 | ⏸ 待启动 | Stripe / GrabPay |
| 登录页真实用户体系 | ⏸ 待启动 | 当前演示账号 doctor/admin |

---

*报告人：AutoClaw · 命理宝鉴研发助手*
