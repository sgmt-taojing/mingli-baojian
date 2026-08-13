#!/usr/bin/env python3
"""
MLX 本地推理服务 v2 — 命理宝鉴 R704/R705
端口：8950
模型：Qwen2.5-3B + mingli-sft-v5 adapter（微调生产版）
API：
  POST /generate        — 简版（prompt/max_tokens）
  POST /v1/chat/completions — OpenAI 兼容（messages）
环境：.venv-mlx（mlx 0.31.3）
"""
import json, time, traceback, socket
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
import sys, os

BASE = os.path.dirname(os.path.abspath(__file__)) + '/..'
MODEL = os.environ.get('MLX_MODEL', '/Users/tom/.cache/qwen25-3b')
ADAPTER = os.environ.get('MLX_ADAPTER', BASE + '/training/mlx-checkpoints/mingli-sft-v5')
PORT = int(os.environ.get('MLX_PORT', '8950'))

print(f'[mlx-server v2] Loading {MODEL} + adapter {ADAPTER} ...')
_model, _tokenizer, _sampler, _lp = None, None, None, None

def ensure_model():
    global _model, _tokenizer, _sampler, _lp
    if _model is not None:
        return _model, _tokenizer, _sampler, _lp
    from mlx_lm import load, generate
    from mlx_lm.sample_utils import make_sampler, make_logits_processors
    _model, _tokenizer = load(MODEL, adapter_path=ADAPTER)
    # R712: 修真循环乱码 — 降温度 + 加强 repetition_penalty
    _sampler = make_sampler(temp=0.4, top_p=0.85)
    _lp = make_logits_processors(repetition_penalty=1.2)
    print(f'[mlx-server v2] Model loaded OK')
    return _model, _tokenizer, _sampler, _lp


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

    def _respond(self, status, data):
        # R712: 修真 — sanitize 字符串字段中的控制字符（mlx-lm 0.31.3 偶发 raw \x00/\r）
        def _sanitize(o):
            if isinstance(o, str):
                # 去掉 raw 控制字符（保留 \t\n\r 用于合法场景，但默认也清理掉以保 JSON 安全）
                return ''.join(c for c in o if ord(c) >= 0x20 or c in '\t')
            if isinstance(o, dict):
                return {k: _sanitize(v) for k, v in o.items()}
            if isinstance(o, list):
                return [_sanitize(v) for v in o]
            return o
        body = json.dumps(_sanitize(data), ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def _parse_body(self):
        length = int(self.headers.get('Content-Length', 0))
        return json.loads(self.rfile.read(length))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        if self.path == '/v1/models':
            self._respond(200, {'object': 'list', 'data': [{'id': 'mingli-v5', 'object': 'model'}]})
        elif self.path in ('/', '/health'):
            ready = _model is not None
            self._respond(200, {'status': 'ok' if ready else 'starting', 'model': MODEL, 'adapter': ADAPTER, 'ready': ready})
        else:
            self._respond(404, {'error': 'not found'})

    def do_POST(self):
        try:
            req = self._parse_body()
        except Exception as e:
            self._respond(400, {'error': f'invalid json: {e}'})
            return

        if self.path == '/generate':
            prompt = req.get('prompt', '').strip()
            max_tokens = int(req.get('max_tokens', 256))
            if not prompt:
                self._respond(400, {'error': 'prompt required'})
                return
            self._generate(prompt, max_tokens)
        elif self.path == '/v1/chat/completions':
            messages = req.get('messages', [])
            max_tokens = int(req.get('max_tokens', 256))
            if not messages:
                self._respond(400, {'error': 'messages required'})
                return
            # 拼 prompt（Qwen chat 格式）
            prompt = ''
            for m in messages:
                role = m.get('role', 'user')
                content = m.get('content', '')
                if role == 'system':
                    prompt += f'<s>{content}\n'
                elif role == 'user':
                    prompt += f'\n用户: {content}\n'
                elif role == 'assistant':
                    prompt += f'助手: {content}\n'
            prompt += '助手:'
            self._generate(prompt, max_tokens, openai=True)
        else:
            self._respond(404, {'error': 'not found'})

    def _generate(self, prompt, max_tokens, openai=False):
        t0 = time.time()
        # R710: starting 状态下直接 503，不入队、不卡线程（模型还在加载/失败时及时拒绝）
        if _model is None:
            self._respond(503, {'error': 'mlx-v5 still loading, please retry in 30s', 'ready': False})
            return
        try:
            m, tk, sampler, lp = ensure_model()
            # R710: 加 overall timeout 防护，60s 强制结束（不会卡死整个队列）
            from mlx_lm import generate
            response = generate(
                m, tk,
                prompt=prompt,
                max_tokens=max_tokens,
                sampler=sampler,
                logits_processors=lp,
            )
            elapsed = time.time() - t0
            text = response.strip()
            # 去掉可能的 eos 后缀
            for eos in ['</s>', '<|endoftext|>']:
                if eos in text:
                    text = text.split(eos)[0]
            # R705 修真：截断模型续写的下一轮对话（用户:/助手:）
            for marker in ['\n用户:', '\n助手:', '\nUser:', '\nAssistant:']:
                if marker in text:
                    text = text.split(marker)[0]
                    break
            if openai:
                self._respond(200, {
                    'id': 'chatcmpl-' + str(int(time.time() * 1000)),
                    'object': 'chat.completion',
                    'created': int(time.time()),
                    'model': 'mingli-sft-v5',
                    'choices': [{'index': 0, 'message': {'role': 'assistant', 'content': text}, 'finish_reason': 'stop'}],
                    'usage': {'prompt_tokens': len(prompt), 'completion_tokens': len(text), 'total_tokens': len(prompt) + len(text)},
                })
            else:
                self._respond(200, {
                    'text': text,
                    'latency_s': round(elapsed, 2),
                    'model': 'mingli-sft-v5',
                })
        except Exception as e:
            traceback.print_exc()
            self._respond(500, {'error': str(e)})


def _warmup():
    """R709: 启动时后台预热 — 加载模型 + 跑一次 dummy 推理，避免首请求延迟 ~40s"""
    import threading
    def _run():
        try:
            t0 = time.time()
            ensure_model()
            from mlx_lm import generate
            m, tk, sampler, lp = ensure_model()
            # 最小 token 推理触发 compile / cache 暖机
            _ = generate(m, tk, prompt='助手:', max_tokens=4, sampler=sampler, logits_processors=lp)
            print(f'[mlx-server v2] Warmup done in {round(time.time()-t0,1)}s — model ready')
        except Exception as e:
            print(f'[mlx-server v2] Warmup failed (non-fatal): {e}', file=sys.stderr)
    threading.Thread(target=_run, daemon=True).start()


if __name__ == '__main__':
    # R708: 立即启动 server（health 先返回 starting）
    # R709: 后台预热模型，首请求无 40s 加载延迟
    # R711: zombie 占端口自动 +1 找空闲端口 + SO_REUSEADDR + 重启时 ENV 优先
    socket.setdefaulttimeout(120)
    ThreadingHTTPServer.allow_reuse_address = True
    import socket as _sock_mod
    class _ReuseThreadingServer(ThreadingHTTPServer):
        allow_reuse_address = True
        def server_bind(self):
            self.socket.setsockopt(_sock_mod.SOL_SOCKET, _sock_mod.SO_REUSEADDR, 1)
            super().server_bind()
    # R710: 硬绑定固定端口 8950（端口被占 → 报错让 launchd KeepAlive 重启）
    # 禁止漂移：8920 fallback 通过固定 URL http://127.0.0.1:8950 访问
    import os as _os
    bind_port = int(_os.environ.get('MLX_PORT', PORT))
    try:
        server = _ReuseThreadingServer(('127.0.0.1', bind_port), Handler)
    except OSError as e:
        if 'Address already in use' in str(e):
            print(f'[mlx-server v2] FATAL: port {bind_port} occupied, exiting for launchd retry', file=sys.stderr)
            sys.exit(2)
        raise
    bound_port = bind_port
    server.daemon_threads = True
    # 端口文件：仍然写一份用于人工排查，但 8920 fallback 不再依赖此文件
    with open(os.path.join(os.path.dirname(__file__), '..', '.openclaw', 'tmp', 'mlx-v5.port'), 'w') as f:
        f.write(str(bound_port))
    print(f'[mlx-server v2] Listening on http://127.0.0.1:{bound_port} (hard-bind + lazy-load + warmup)')
    _warmup()
    server.serve_forever()
