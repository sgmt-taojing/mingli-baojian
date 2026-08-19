# BaziQA 命理能力评估与训练管线（命理宝鉴板块）

> BaziQA = 八字命理推理基准（MIT，50 名人 × ~10 题 = 488 题专家验证选择题）。
> 在本项目中承担两个角色：**核心模型验收考试**（考不过不上线）+ **推理链训练素材源**。

## 一、资产清单（已全部收拢进项目，与临时目录解耦）

| 资产 | 路径 | 说明 |
|---|---|---|
| 数据集 | `training/baziqa/data/celebrity50_zh.json` | 488 题主数据（contest8 系列仅元数据） |
| 数据集文档 | `training/baziqa/README.md` 等 | 原数据集说明 + 论文（arXiv:2602.12889） |
| 评估脚本 | `training/eval-baziqa.py` | 统一版：`--api --tag --limit`，含答案分布分析 |
| SFT 构建器 | `training/build-baziqa-sft.py` | 通用版：basic / enhanced（错题辨析）两模式 |
| 历史成绩 | `training/baziqa-results/*.log` | v9.0 / v9.1 全量逐题日志 |
| 版本数据 | `training/mlx-r105-data-v9X/` | 各版训练数据（含 v90/v92） |
| 训练脚本 | `training/run-v9X.sh` | MLX LoRA 训练启动器 |
| 模型 | `training/mlx-models/mingli-sft-v9.X-7b` | fused 生产模型 |

## 二、标准流程（每版必走）

```bash
# 1. 构建数据（基础版或错题强化版）
python3 training/build-baziqa-sft.py \
    --out training/mlx-r105-data-vXX \
    --mode enhanced \
    --wrong-log training/baziqa-results/<上一版>-full488.log \
    --free-from training/mlx-r105-data-v87/train.v87.jsonl

# 2. 训练（注意：base 必须是上一版最优 fused；训练期间 8960 推理会 abort 属正常）
bash training/run-vXX.sh   # 参考 run-v92.sh

# 3. fuse（MLX_BASE_MODEL 必须与训练 base 一致）
MLX_BASE_MODEL=training/mlx-models/<训练base> bash training/fuse-mlx.sh \
    training/mlx-checkpoints/mingli-sft-vXX training/mlx-models/mingli-sft-vXX-7b

# 4. 评估（临时端口起服务，不动生产 8960）
source .venv-mlx/bin/activate
MLX_MODEL=training/mlx-models/mingli-sft-vXX-7b MLX_PORT=8962 \
    nohup python3 scripts/mlx-inference-server.py > .openclaw/tmp/mlx-vXX-eval.log 2>&1 &
python3 training/eval-baziqa.py --api http://127.0.0.1:8962/v1/chat/completions --tag vXX

# 5. 达标（超上一版）→ 切生产：改 plist MLX_MODEL 后必须 unload+load（kickstart 不重读 env）
#    不达标 → 保留上一版，教训记 KANBAN
```

## 三、历史成绩（全量 488 题）

| 版本 | 得分 | 配方 | 结果 |
|---|---|---|---|
| v8.3 | 42.5%（抽样） | 早期基线 | 已被超越 |
| v8.6 | 47.5% | 推理链格式确立 | 已被超越 |
| v8.7 | 51.8% | 推理链:自由=1.16:1 | 已被超越 |
| v8.8 | 41.2% | 自由问答 64% 稀释 | ❌ 回滚 |
| v8.9 | 46.5% | 推理链 80% 过犹不及 | ❌ 回滚 |
| **v9.0** | **53.9%** | BaziQA 全量推理链 + 1:1 + 去AI味 | ✅ 生产 |
| v9.1 | 45.1% | 选项 shuffle 均衡化 | ❌ 回滚（教训见下） |
| v9.2 | 评估中 | v9.0 基 + 错题辨析强化 225 | 待定 |

## 四、修真教训（固化，勿重复）

1. **禁止选项 shuffle**：3B 小模型选择题靠模式学习，重排选项破坏题意-答案关联（v9.1 实测 -8.8pp）。答案分布 B 偏多是数据特征不是缺陷。
2. **增量训练 base = 上一版最优 fused**：从 v8.7 直训会丢掉 v9.0 的增量知识。
3. **配比 1:1 是最优**：推理链:自由问答，两端偏离都掉分（v8.8 41.2% / v8.9 46.5%）。
4. **量化必须在 base 层做**：先量化 Qwen2.5-3B base 再 fuse adapter；直接量化 LoRA fused 产物输出乱码（实测 0/8）。
5. **训练与推理抢 MPS**：训练窗口内 8960 查询会 abort（单 GPU 约束），评估用 8962 临时端口。
6. **launchd 热切模型**：kickstart 不重读 plist 环境变量，必须 unload+load。
7. **mlx_lm 数据文件名**：必须是 `train.jsonl` / `valid.jsonl` 标准名（不是 train.vXX.jsonl）。
