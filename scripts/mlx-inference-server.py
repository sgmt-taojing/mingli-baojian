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
import json, time, traceback
from http.server import HTTPServer, BaseHTTPRequestHandler
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
    _sampler = make_sampler(temp=0.7, top_p=0.9)
    _lp = make_logits_processors(repetition_penalty=1.2)
    print(f'[mlx-server v2] Model loaded OK')
    return _model, _tokenizer, _sampler, _lp


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

    def _send_json(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self):
        length = int(self.headers.get('Content-Length', 0))
        return json.loads(self.rfile.read(length))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        if self.path in ('/', '/health'):
            self._send_json(200, {'status': 'ok', 'model': MODEL, 'adapter': ADAPTER})
        else:
            self._send_json(404, {'error': 'not found'})

    def do_POST(self):
        try:
            req = self._read_json()
        except Exception as e:
            self._send_json(400, {'error': f'invalid json: {e}'})
            return

        if self.path == '/generate':
            prompt = req.get('prompt', '').strip()
            max_tokens = int(req.get('max_tokens', 256))
            if not prompt:
                self._send_json(400, {'error': 'prompt required'})
                return
            self._generate(prompt, max_tokens)
        elif self.path == '/v1/chat/completions':
            messages = req.get('messages', [])
            max_tokens = int(req.get('max_tokens', 256))
            if not messages:
                self._send_json(400, {'error': 'messages required'})
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
            self._send_json(404, {'error': 'not found'})

    def _generate(self, prompt, max_tokens, openai=False):
        t0 = time.time()
        try:
            m, tk, sampler, lp = ensure_model()
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
                self._send_json(200, {
                    'id': 'chatcmpl-' + str(int(time.time() * 1000)),
                    'object': 'chat.completion',
                    'created': int(time.time()),
                    'model': 'mingli-sft-v5',
                    'choices': [{'index': 0, 'message': {'role': 'assistant', 'content': text}, 'finish_reason': 'stop'}],
                    'usage': {'prompt_tokens': len(prompt), 'completion_tokens': len(text), 'total_tokens': len(prompt) + len(text)},
                })
            else:
                self._send_json(200, {
                    'text': text,
                    'latency_s': round(elapsed, 2),
                    'model': 'mingli-sft-v5',
                })
        except Exception as e:
            traceback.print_exc()
            self._send_json(500, {'error': str(e)})


if __name__ == '__main__':
    ensure_model()
    server = HTTPServer(('127.0.0.1', PORT), Handler)
    print(f'[mlx-server v2] Listening on http://127.0.0.1:{PORT}')
    server.serve_forever()
