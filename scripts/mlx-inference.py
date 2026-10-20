#!/usr/bin/env python3
"""
R485: MLX LoRA 推理部署脚本
加载 Qwen2.5-3B-Instruct + 命理宝鉴 LoRA 适配器，支持 CLI 和 HTTP API 两种模式。

用法:
  # 交互式 CLI
  python scripts/mlx-inference.py

  # 单次推理
  python scripts/mlx-inference.py --prompt "什么是八字排盘？"

  # HTTP API 服务
  python scripts/mlx-inference.py --serve --port 8914

  # 批量评测
  python scripts/mlx-inference.py --eval data/mingli_sft_test.json --num-samples 10

依赖: mlx-lm, fastapi (serve 模式)
环境: conda activate /opt/homebrew/Caskroom/miniforge/base/envs/mingli-train
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = str(PROJECT_DIR / "training" / "models" / "models" / "Qwen--Qwen2.5-3B-Instruct" / "snapshots" / "master")
ADAPTER_PATH = str(PROJECT_DIR / "training" / "mlx-checkpoints" / "mingli-sft-v1-3b")
ADAPTER_OVERRIDE = None  # 可被 --adapter 覆盖

SYSTEM_PROMPT = """你是命理宝鉴AI助手，专注于周易、八字、紫微斗数、奇门遁甲、六爻、梅花易数、大六壬、风水、中医、黄历、姓名学等传统文化领域的知识问答。回答必须基于知识库，遵循以下红线：
1. 禁止自主辨证、判体质、断病机
2. 禁止输出疾病诊断、药方、治疗方案
3. 禁止预判生死灾祸
4. 禁止脱离知识库凭空创造理论
5. 禁止绝对化、宿命论结论
6. 禁止对未成年人输出算命结论
7. 禁止煽动性、恐吓式输出
所有回答仅供学习参考，不构成专业建议。"""

DEFAULT_GEN_CONFIG = {
    "max_tokens": 512,
    "temperature": 0.7,
    "top_p": 0.9,
}


def load_model():
    """加载模型 + LoRA 适配器"""
    from mlx_lm import load

    t0 = time.time()
    print(f"📦 加载基础模型: {MODEL_PATH}")

    model, tokenizer = load(
        MODEL_PATH,
        adapter_path=ADAPTER_PATH,
        tokenizer_config={"trust_remote_code": True},
    )
    elapsed = time.time() - t0
    print(f"✅ 模型加载完成 ({elapsed:.1f}s) — LoRA 适配器: {ADAPTER_PATH}")
    return model, tokenizer


def format_prompt(tokenizer, user_message: str, system_prompt: str = SYSTEM_PROMPT) -> str:
    """使用 Qwen2.5 chat template 格式化提示"""
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
    ]
    if hasattr(tokenizer, "apply_chat_template"):
        return tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
    # Fallback: 手动格式化 Qwen2.5 风格
    parts = [f"<|im_start|>system\n{system_prompt}<|im_end|>"]
    parts.append(f"<|im_start|>user\n{user_message}<|im_end|>")
    parts.append("<|im_start|>assistant\n")
    return "\n".join(parts)


def make_sampler(temp: float, top_p: float = 1.0):
    """mlx-lm 0.31.x sampler: temperature + optional top-p"""
    import mlx.core as mx

    def sampler(logits: mx.array) -> mx.array:
        # logits are log-probabilities (shape: [vocab_size])
        if temp <= 0:
            return mx.argmax(logits, axis=-1)
        scaled = logits / temp
        # Simple temperature sampling (top-p needs more work with MLX backend)
        return mx.random.categorical(scaled)

    return sampler


def generate(model, tokenizer, prompt: str, **kwargs):
    """执行推理并返回结果"""
    from mlx_lm import generate as mlx_generate

    config = {**DEFAULT_GEN_CONFIG, **kwargs}
    formatted = format_prompt(tokenizer, prompt)

    sampler = make_sampler(config["temperature"], config["top_p"])

    t0 = time.time()
    response = mlx_generate(
        model, tokenizer,
        prompt=formatted,
        max_tokens=config["max_tokens"],
        sampler=sampler,
    )
    elapsed = time.time() - t0

    # 统计 token 数
    n_tokens = len(tokenizer.encode(response)) if hasattr(tokenizer, "encode") else 0
    tps = n_tokens / elapsed if elapsed > 0 else 0
    print(f"⚡ {n_tokens} tokens / {elapsed:.1f}s ({tps:.0f} tok/s)")
    return response


def interactive_mode(model, tokenizer):
    """交互式 CLI"""
    print("\n🦞 命理宝鉴 MLX 推理 (Qwen2.5-3B + LoRA)")
    print("输入 /quit 退出, /system 查看系统提示词\n")
    while True:
        try:
            user_input = input("👤 > ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n👋 再见！")
            break
        if not user_input:
            continue
        if user_input.lower() in ("/quit", "/exit", "/q"):
            print("👋 再见！")
            break
        if user_input == "/system":
            print(f"📋 系统提示词:\n{SYSTEM_PROMPT}\n")
            continue
        if user_input == "/clear":
            print("\033[2J\033[H")
            continue

        print("🤖 ", end="", flush=True)
        response = generate(model, tokenizer, user_input)
        print(response)
        print()


def serve_http(model, tokenizer, host="127.0.0.1", port=8914):
    """HTTP API 服务模式"""
    try:
        from fastapi import FastAPI
        from fastapi.responses import JSONResponse
        import uvicorn
    except ImportError:
        print("❌ 需要 fastapi 和 uvicorn: pip install fastapi uvicorn")
        sys.exit(1)

    app = FastAPI(title="命理宝鉴 MLX 推理", version="1.0")

    @app.get("/health")
    async def health():
        return {"ok": True, "model": "Qwen2.5-3B-Instruct+LoRA", "port": port}

    @app.post("/v1/chat/completions")
    async def chat_completions(request: dict):
        messages = request.get("messages", [])
        user_msg = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                user_msg = m["content"]
                break

        if not user_msg:
            return JSONResponse({"error": "no user message"}, status_code=400)

        gen_config = {
            "max_tokens": request.get("max_tokens", DEFAULT_GEN_CONFIG["max_tokens"]),
            "temperature": request.get("temperature", DEFAULT_GEN_CONFIG["temperature"]),
            "top_p": request.get("top_p", DEFAULT_GEN_CONFIG["top_p"]),
        }

        t0 = time.time()
        response_text = generate(model, tokenizer, user_msg, **gen_config)
        elapsed = time.time() - t0

        return {
            "id": f"mlx-{int(t0)}",
            "object": "chat.completion",
            "created": int(t0),
            "model": "mingli-sft-v1-3b",
            "choices": [{
                "index": 0,
                "message": {"role": "assistant", "content": response_text},
                "finish_reason": "stop",
            }],
            "usage": {
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0,
            },
        }

    print(f"🚀 MLX 推理 API 启动: http://{host}:{port}")
    print(f"   Health: http://{host}:{port}/health")
    print(f"   Chat:   POST http://{host}:{port}/v1/chat/completions")
    uvicorn.run(app, host=host, port=port, log_level="warning")


def eval_mode(model, tokenizer, data_path: str, num_samples: int = 10):
    """批量评测模式"""
    with open(data_path) as f:
        samples = json.load(f)

    if num_samples and num_samples < len(samples):
        import random
        random.seed(42)
        samples = random.sample(samples, num_samples)

    print(f"📊 评测 {len(samples)} 条样本...\n")

    results = []
    total_tokens = 0
    total_time = 0.0

    for i, sample in enumerate(samples):
        messages = sample.get("messages", [])
        # 获取首条 user 消息
        user_msg = ""
        expected = ""
        for m in messages:
            if m["role"] == "user" and not user_msg:
                user_msg = m["content"]
            if m["role"] == "assistant":
                expected = m["content"]

        if not user_msg:
            continue

        print(f"[{i+1}/{len(samples)}] {user_msg[:60]}...")
        t0 = time.time()
        response = generate(model, tokenizer, user_msg)
        elapsed = time.time() - t0

        results.append({
            "id": i,
            "prompt": user_msg[:200],
            "response": response,
            "expected": expected[:500] if expected else "",
            "time_s": round(elapsed, 2),
        })
        total_time += elapsed
        print(f"    → {len(response)} chars / {elapsed:.1f}s\n")

    # 保存结果
    out_path = PROJECT_DIR / "training" / "eval-results" / f"mlx-eval-{int(time.time())}.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w") as f:
        json.dump({"results": results, "avg_time_s": round(total_time / len(results), 2)}, f, ensure_ascii=False, indent=2)

    print(f"📁 结果保存: {out_path}")
    print(f"⏱  平均: {total_time / len(results):.1f}s/条")


def main():
    parser = argparse.ArgumentParser(description="命理宝鉴 MLX 推理")
    parser.add_argument("--prompt", "-p", type=str, help="单次推理提示词")
    parser.add_argument("--serve", action="store_true", help="启动 HTTP API 服务")
    parser.add_argument("--port", type=int, default=8914, help="HTTP 服务端口 (默认: 8914)")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="HTTP 服务地址")
    parser.add_argument("--eval", type=str, metavar="PATH", help="批量评测数据文件路径")
    parser.add_argument("--num-samples", "-n", type=int, default=10, help="评测样本数")
    parser.add_argument("--max-tokens", type=int, default=512, help="最大生成 token 数")
    parser.add_argument("--temperature", type=float, default=0.7, help="温度参数")
    parser.add_argument("--no-system", action="store_true", help="不添加系统提示词")
    parser.add_argument("--adapter", type=str, default=None, help="LoRA 适配器路径覆盖（如 v2 checkpoint）")

    args = parser.parse_args()

    global DEFAULT_GEN_CONFIG, SYSTEM_PROMPT, ADAPTER_PATH
    DEFAULT_GEN_CONFIG.update({
        "max_tokens": args.max_tokens,
        "temperature": args.temperature,
    })
    if args.no_system:
        SYSTEM_PROMPT = ""
    if args.adapter:
        ADAPTER_PATH = args.adapter
        print(f"🔧 使用指定适配器: {ADAPTER_PATH}")

    # 加载模型
    model, tokenizer = load_model()

    if args.serve:
        serve_http(model, tokenizer, host=args.host, port=args.port)
    elif args.eval:
        eval_mode(model, tokenizer, args.eval, num_samples=args.num_samples)
    elif args.prompt:
        response = generate(model, tokenizer, args.prompt)
        print(response)
    else:
        interactive_mode(model, tokenizer)


if __name__ == "__main__":
    main()
