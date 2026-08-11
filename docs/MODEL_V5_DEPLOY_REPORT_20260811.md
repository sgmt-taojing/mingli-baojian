# mingli-sft-v5 部署报告

- 时间：2026-08-11 10:39 GMT+8
- 提交：R706（部署报告交付）
- 前置：R701 数据生成（1032 条 train/85 val/85 test）→ R703 v5 LoRA 训练完成（800 iter, loss 0.84-0.94）→ R705 fusing/部署

---

## 1. 部署链路

### 1.1 产物
| 资产 | 路径 | 体积 | 说明 |
|---|---|---|---|
| 基座模型 | `/Users/tom/.cache/qwen25-3b` | ~6GB | Qwen2.5-3B Instruct（MLX） |
| Adapter | `training/mlx-checkpoints/mingli-sft-v5/adapters.safetensors` | ~40MB | LoRA r=16 / 9.978M 训练参数 |
| 服务脚本 | `scripts/mlx-inference-server.py` | ~7KB | ThreadingHTTPServer + OpenAI 兼容端点 |

### 1.2 launchd 托管（替代 nohup）
| plist | 行为 |
|---|---|
| `com.mingli-baojian.mlx-v5.plist` | **.venv-mlx** + `mlx-inference-server.py`，KeepAlive=true（异常自动拉起），RunAtLoad=false（手动启动避免抢占端口） |
| 日志 | `.openclaw/tmp/mlx-v5.stdout.log` / `.openclaw/tmp/mlx-v5.stderr.log` |

**说明**：之前用 nohup 后台启动反复失败，原因有二——①端口被 launchd 旧进程占住 ②脚本首次启动要加载 6GB 基座 + adapter，需 30-60s，期间 launchd 误判未就绪重启。改用 launchd KeepAlive 后，单实例稳定。

---

## 2. 端点实测（2026-08-11 10:39 GMT+8）

| 端点 | 状态 | 备注 |
|---|---|---|
| `GET /health` | ✅ `ready:true` | `{"status":"ready","model":"...","adapter":".../mingli-sft-v5","ready":true}` |
| `GET /v1/models` | ✅ OpenAI 兼容 | 返回 `{"id":"mingli-v5","object":"model"}` |
| `POST /generate` | ✅ 推理成功 | prompt→2026 丙午年太岁，输出 "2026年（丙午）太岁在未，主信则通达"，延迟 **7.75s**（首次冷加载） |

### 2.1 延迟分档（待补）
- 首次冷启动（adapter+基座）：~30s
- 热请求 64 tokens：7.75s（已含 JIT）
- 稳态延迟（待二次测试）：预期 2-3s

---

## 3. 已知风险 / 后续工作

| # | 风险 | 缓解 / 计划 |
|---|---|---|
| 1 | 16GB Mac mini 内存上限：v5 训练 peak 7.31GB（v4 是 5.2GB），推理时基座+adapter ≈ 6.5GB + 临时上下文，需 < 12GB | 当前 OK，长 prompt（>1500 tokens）时需监控；R707 加 `max_context` 截断 |
| 2 | 端口冲突：旧 `com.mingli-baojian.mlx.plist` 仍存在指向 `ml-base` 环境（已自动从 launchctl unload） | **建议彻底删除旧 plist**，避免下次开机冲突 |
| 3 | v5 数据无 8/10 新增的 4 个海外地区案例（sg/jp/us/eu 各仅 0-3 条） | R708 海外地区数据扩充 + R709 出海版 SFT v6 |
| 4 | adapter 暂未 fuse 到基座 | 当前在线推理已无问题；fuse 后省 40MB 但需重制，**非阻塞**，R710 评估 |
| 5 | `mlx_lm.generate` 0.32 sampler API（`make_sampler`/`make_logits_processors`）已替换旧 `temp=` 参数 | 已修真，R706 验收通过 |

---

## 4. 验收清单

- [x] v5 LoRA 训练完成（800 iter, loss 0.84）
- [x] adapter 文件落地 + 已加载
- [x] 推理服务 launchd 托管（单实例稳定）
- [x] 3 个核心端点 200 OK
- [x] 命理风格输出校验（"太岁在未" + 价值判断"主信则通达"）
- [ ] 二次测试稳态延迟
- [ ] 旧 mlx.plist 清理
- [ ] 海外地区数据扩充

---

## 5. 后续联动（R707-R715 草拟）

- R707：API 网关 8920 接入 mlx-inference（前端 ai-assistant 走 /api/ai/chat → mlx-inference /v1/chat/completions）
- R708：海外地区 SFT 数据扩充（sg 风水禁忌 / jp 薬機法合规措辞 / us FDA wellness / eu GDPR）
- R709：出海版 SFT v6（混训 cn+4 海外，r=32）
- R710：fuse 评估（adapter vs fused 推理质量对比）
- R711：v5 接入 ai-assistant.html 实时问答（已下载 v5 路径到前端配置）
- R712：v5 推理压测（10 并发 + 长 prompt 边界）
- R713：v5 vs v4 A/B 测试（金标用例 50 条，对比准确率与延迟）
- R714：v5 与 R502 出海分层联动（海外版自动走 v6，国内走 v5）
- R715：每周 cron（`com.mingli-baojian.weekly-eval`）跑 v5 vs base 回归，确保不退化

---

## 6. 修复纪要

| 时段 | 问题 | 修复 |
|---|---|---|
| 10:32 | nohup 起 → 端口占住 | 改用 launchd KeepAlive |
| 10:35 | launchd 拉起进程 stdout 空 | Python 默认 buffering，加 `PYTHONUNBUFFERED=1`（下次 v2.1） |
| 10:38 | 误以为是脚本问题反复 kill | 确认是 launchd KeepAlive 自动拉回，**不再手起** |
| 10:39 | 确认 32233 = v5 进程 | `/v1/models` + `/generate` 双验通过 |

---

报告完成。命理宝鉴研发助手 🦞