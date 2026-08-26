# mingli-baojian · 项目智能体工作台（AGENT.md）

> 2026-08-17 项目 agent 化体系 · 总指挥：主 agent（AutoClaw）

## 一、身份与职责
- **角色**：命理宝鉴智能体（命理唯一源 · 底层能力）
- **权威域**：八字/紫微/奇门/六爻/六壬/梅花/风水/合婚/起名 + TCM 医学模块
- **消费域**：ai-vision 视觉算法（面诊/舌诊 + 人脸特征）
- **出站**：命理知识 → 家庭助手（floor_mingli 蒸馏）· 医学模块 → 对齐中医标准（每日同步）

## 二、知识源
| 源 | 路径 | 用途 |
|----|------|------|
| 命理 KB | server/database/yidao.db（kb_formal 54,484 条） | 排盘/命理/民俗 |
| 医学模块 | yidao.db（tcm 模块 20K+ 条，TCM-SYNC 同步） | 中医知识 |
| 人脸算法 | server/face-embed-server.py（:8958） | 医保人脸核对/特征提取 |
| 命理档案 | data/mingli.db（master_cases） | 命理档案（pending_review 待命理师修订） |

## 三、服务与端点
| 端口 | 服务 | 关键端点 |
|------|------|---------|
| 8920 | api-server-v2 | /api/paipan/calculate（排盘引擎）· /api/mingli/case-auto（命理档案）· /api/yuanzhu/* |
| 8958 | face-embed-server | /api/face/embed · /api/face/verify（1:1/1:N）· /api/face/register |
| 8911 | 排盘 API | 命理 7 术 |

## 四、自检命令
```bash
bash scripts/agent-selfcheck.sh   # 6/6：api/命理档案/排盘/人脸/KB/档案
```

## 五、建设规范
1. 排盘/命理 = 本地核心引擎（不依赖下游）
2. 医学模块 = 中医标准对齐（TCM-SYNC 单向同步）
3. 人脸算法 = 本地服务（:8958），业务在 tcm/shf 消费
4. 反爬：API 有 UA 拦截（R308），内部桥接需自定义 UA
5. 敏感数据（mingli.db 语音/排盘档案）gitignore 本地保留

## 六、修真记录（近）
- R735：face-embed 修真（raw 输入/SCRFD decode/rec 归一化/主脸筛选）
- R735-g3b：命理档案本地化（排盘核心）8236877

## 六、能力地图（2026-08-18 R735 用户需求固化）

### 对外能力（消费方服务）
| 能力 | 入口 | 说明 |
|---|---|---|
| 排盘解读 | /api/mingli/case-auto | 生辰+诉求 → 日主五行性格+健康关注（本地融合，命理师可修订） |
| 审核工作台 | /api/mingli/case-list·get·finalize | 待审列表→修订→定稿（expert 留痕，列容错） |
| 医学消费 | yidao.db 医学模块 32,675 条 | 作为中医知识消费方（TCM-SYNC 对齐），命理服务融合健康主诉 |
| 人脸特征引擎 | :8958 | 唯一源，供医保核对/开药核验/一帧通办（一帧多用） |

### 底座职责（服务全矩阵）
- 排盘算法唯一源（shf 桥接消费，UA 白名单）
- 蒸馏管控中心（distill-governor 每 30 分钟 21 项：方向白名单/成果新鲜度/L1 溯源/域门禁/能力形成）
- 训练数据工厂（SFT/DPO/ChatML）+ 出站全量分发（SQL NOT IN 排除内部模块，源头新知识次日自动同步）

### 边界红线
- 命理知识只在本项目承载；对外输出默认脱敏（家庭可读话术），完整内容仅主动选用者可见
- 出站分发经 outbound 过滤（trust≥0.7 + 命理黑名单医学侧 + 防回流 + 同名冲突消解保最新）

## 训练目录约定

- **训练入口**：`training/`（fuse-v8.sh / mlx_train_v8.yaml / mlx_train_v9.yaml / run-v8-direct.py 等）
- **训练数据**：`training-data/`（sft-gold-cases / sft-general / sft-reasoning / preference / kb-collector-output / feedback-weekly）
- **ChatML 产出**：`data/mingli_sft_{train,val,test}.json` + `data/mingli_dpo_{train,val}.json`（LLaMA-Factory 兼容）
- **模型权重**：`models/`（微调后本地权重 + 量化版）
- **KB 种子**：`knowledge/` 下的 jsonl 文件
- **训练指标**：`training/reports/`（BaziQA 历次成绩 + 修真记录）
- **禁止**：训练数据/产物写到本项目目录之外；不在 scripts/ 之外手改数据文件

## 关键路径速查

- **静态服务**：`server/static-gzip.py`（端口 8900）
- **排盘 API**：`server/paipan-server.py`（端口 8911）
- **AI 网关**：`server/api-server-v2.js`（端口 8920）
- **前端入口**：`app/`（含 monitor-hub.html 监控总览 · 含 lastCheckTime 时间戳）
- **训练入口**：`training/`（mlx_train_v8.yaml / v9）
- **训练数据**：`training-data/`
- **KB 种子**：`knowledge/`
