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
