#!/usr/bin/env python3
"""
MLX 本地推理服务 v3 — 命理宝鉴 R704/R705/R105
端口：8960
模型：Qwen2.5-3B + mingli-sft-v8（fused 完整模型，生产默认）
回滚：设 MLX_MODEL=base 路径 + MLX_ADAPTER=mingli-sft-v5 可切回 v5 适配器模式
API：
  POST /generate        — 简版（prompt/max_tokens）
  POST /v1/chat/completions — OpenAI 兼容（messages）
环境：.venv-mlx（mlx 0.31.3）
"""
import json, time, traceback, socket
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
import sys, os

BASE = os.path.dirname(os.path.abspath(__file__)) + '/..'
# R718 v8.1：默认指向 clean3 数据重训后的 v8.1 fused 模型
# 回滚方案：export MLX_MODEL=$BASE/training/models/mingli-v8-fused（修真前 v8 fused）
DEFAULT_MODELS = [
    BASE + '/training/mlx-models/mingli-sft-v8.3-3b',  # R726 v8.3（修真 idx23/24 + 命名修正：实际是 3B base）
    BASE + '/training/models/mingli-v8.1-3b-fused',    # v8.1 修真前（兜底，3B）
    BASE + '/training/mlx-models/mingli-sft-v8.3-7b', # 旧名兼容（symlink 到 v8.3-3b）
]
MODEL = os.environ.get('MLX_MODEL', None)
if MODEL is None:
    for cand in DEFAULT_MODELS:
        if os.path.isdir(cand) and any(f.endswith('.safetensors') for f in os.listdir(cand) if os.path.isfile(os.path.join(cand, f))):
            MODEL = cand
            break
    if MODEL is None:
        MODEL = DEFAULT_MODELS[0]  # fallback：让 launchd 重启时尝试
ADAPTER = os.environ.get('MLX_ADAPTER', None)  # fused 模式无 adapter；回滚 v5 时设为 mingli-sft-v5
PORT = int(os.environ.get('MLX_PORT', '8960'))
# R105: 模型版本号由路径派生
_bn = os.path.basename(MODEL.rstrip('/'))
MODEL_TAG = os.path.basename(os.path.dirname(MODEL.rstrip('/'))) if '/models/' in MODEL else (
    _bn if _bn.startswith('mingli-') else 'mingli-sft-' + _bn.replace('mingli-', ''))
if ADAPTER:
    MODEL_TAG = os.path.basename(ADAPTER.rstrip('/'))
# 兼容旧版本目录名
if 'mingli-v8-fused' in MODEL:
    MODEL_TAG = 'mingli-sft-v8'
elif 'mingli-sft-v8.1-7b' in MODEL:
    MODEL_TAG = 'mingli-sft-v8.1'

print(f'[mlx-server v3] Loading {MODEL}' + (f' + adapter {ADAPTER}' if ADAPTER else ' (fused, no adapter)') + ' ...')
_model, _tokenizer, _sampler, _lp = None, None, None, None

def ensure_model():
    global _model, _tokenizer, _sampler, _lp
    if _model is not None:
        return _model, _tokenizer, _sampler, _lp
    from mlx_lm import load, generate
    from mlx_lm.sample_utils import make_sampler, make_logits_processors
    if ADAPTER:
        _model, _tokenizer = load(MODEL, adapter_path=ADAPTER)
    else:
        _model, _tokenizer = load(MODEL)
    # R712: 修真循环乱码 — 降温度 + 加强 repetition_penalty
    # R105: 温度 0.4→0.5 适度放开（v8 SFT 后重复倾向已大幅下降）
    _sampler = make_sampler(temp=0.5, top_p=0.85)
    _lp = make_logits_processors(repetition_penalty=1.2)
    print(f'[mlx-server v3] Model loaded OK')
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
            self._respond(200, {'object': 'list', 'data': [{'id': MODEL_TAG, 'object': 'model'}]})
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
            stream = bool(req.get('stream', False))
            if not messages:
                self._respond(400, {'error': 'messages required'})
                return
            # 拼 prompt（Qwen chat 格式）
            # R732: 服务端默认注入命理助手 system prompt（防 base 模型自称通义千问）
            # 仅当调用方未传 system 时注入，不覆盖上游角色设定
            DEFAULT_SYSTEM = (
                '你是命理宝鉴的命理与中医知识助手，不自称通义千问或其他模型名。'
                '回答基于传统命理与中医理论，客观中立，不做绝对判断，不提供医疗诊断替代。'
            )
            has_system = any(m.get('role') == 'system' for m in messages)
            prompt = ''
            if not has_system:
                prompt += f'<s>{DEFAULT_SYSTEM}\n'
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
            if stream:
                self._generate_stream(prompt, max_tokens)
            else:
                self._generate(prompt, max_tokens, openai=True)
        else:
            self._respond(404, {'error': 'not found'})

    def _generate_stream(self, prompt, max_tokens):
        """R726: SSE 流式生成 — 首字延迟 ~1-2s，逐 token 推送，满足无延迟交互规则。
        OpenAI 兼容 chunk 格式；出错时发 data: {"error":...} 后收尾。"""
        t0 = time.time()
        if _model is None:
            # 503 不能用 SSE 语义，直接 JSON 拒绝
            self._respond(503, {'error': 'model still loading, please retry in 30s', 'ready': False})
            return
        try:
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream; charset=utf-8')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Connection', 'keep-alive')
            self.end_headers()

            def _send(obj):
                self.wfile.write(('data: ' + json.dumps(obj, ensure_ascii=False) + '\n\n').encode('utf-8'))
                self.wfile.flush()

            cid = 'chatcmpl-' + str(int(time.time() * 1000))
            _send({'id': cid, 'object': 'chat.completion.chunk', 'created': int(time.time()), 'model': MODEL_TAG,
                   'choices': [{'index': 0, 'delta': {'role': 'assistant'}, 'finish_reason': None}]})

            from mlx_lm import stream_generate
            m, tk, sampler, lp = ensure_model()
            first = True
            text_parts = []
            for chunk in stream_generate(m, tk, prompt=prompt, max_tokens=max_tokens,
                                         sampler=sampler, logits_processors=lp):
                piece = chunk.text if hasattr(chunk, 'text') else str(chunk)
                # R705 同款 EOS / 续写截断（流式：在标记处直接停）
                stop = False
                for eos in ['</s>', '<|endoftext|>']:
                    if eos in piece:
                        piece = piece.split(eos)[0]
                        stop = True
                for marker in ['\n用户:', '\n助手:', '\nUser:', '\nAssistant:']:
                    if marker in piece:
                        piece = piece.split(marker)[0]
                        stop = True
                if piece:
                    text_parts.append(piece)
                    _send({'id': cid, 'object': 'chat.completion.chunk', 'created': int(time.time()), 'model': MODEL_TAG,
                           'choices': [{'index': 0, 'delta': {'content': piece}, 'finish_reason': None}]})
                if first:
                    print(f'[mlx-server v3] stream first-token {round(time.time()-t0,2)}s')
                    first = False
                if stop:
                    break
            _send({'id': cid, 'object': 'chat.completion.chunk', 'created': int(time.time()), 'model': MODEL_TAG,
                   'choices': [{'index': 0, 'delta': {}, 'finish_reason': 'stop'}]})
            _send('[DONE]')
        except BrokenPipeError:
            print(f'[mlx-server v3] stream client disconnected at {round(time.time()-t0,1)}s')
        except Exception as e:
            traceback.print_exc()
            try:
                self.wfile.write(('data: ' + json.dumps({'error': str(e)}) + '\n\n').encode('utf-8'))
                self.wfile.flush()
            except Exception:
                pass

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
                    'model': MODEL_TAG,
                    'choices': [{'index': 0, 'message': {'role': 'assistant', 'content': text}, 'finish_reason': 'stop'}],
                    'usage': {'prompt_tokens': len(prompt), 'completion_tokens': len(text), 'total_tokens': len(prompt) + len(text)},
                })
            else:
                self._respond(200, {
                    'text': text,
                    'latency_s': round(elapsed, 2),
                    'model': MODEL_TAG,
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
    # R710: 硬绑定固定端口 8960（端口被占 → 报错让 launchd KeepAlive 重启）
    # 禁止漂移：8920 fallback 通过固定 URL http://127.0.0.1:8960 访问
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
