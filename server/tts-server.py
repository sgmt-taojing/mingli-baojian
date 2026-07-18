#!/usr/bin/env python3
"""命理宝鉴 TTS 服务 — 基于 Edge-TTS 免费中文语音合成
   商用时可替换为讯飞/Azure TTS，接口层不变"""

import http.server
import urllib.parse
import edge_tts
import asyncio
import json
import io
import sys
import os

PORT = 8912
VOICE_MAP = {
    "female": "zh-CN-XiaoxiaoNeural",
    "male": "zh-CN-YunyangNeural",
    "female2": "zh-CN-XiaochenNeural",
    "female3": "zh-CN-XiaohanNeural",
    "male2": "zh-CN-YunfengNeural",
}
DEFAULT_VOICE = "zh-CN-XiaoxiaoNeural"

class TTSHandler(http.server.BaseHTTPRequestHandler):
    def cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200)
        self.cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == "/api/tts":
            self.handle_tts(parsed.query)
        elif parsed.path == "/api/voices":
            self.handle_voices()
        elif parsed.path == "/health":
            self.send_response(200)
            self.cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "service": "tts", "port": PORT}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def handle_voices(self):
        self.send_response(200)
        self.cors_headers()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        voices = [
            {"id": "female", "name": "晓晓(女声)", "desc": "温柔亲切，适合运势播报"},
            {"id": "male", "name": "云扬(男声)", "desc": "沉稳大气，适合排盘解读"},
            {"id": "female2", "name": "晓辰(女声)", "desc": "活泼明亮，适合每日推送"},
            {"id": "female3", "name": "晓涵(女声)", "desc": "知性优雅，适合知识朗读"},
            {"id": "male2", "name": "云枫(男声)", "desc": "年轻活力，适合互动对话"},
        ]
        self.wfile.write(json.dumps({"voices": voices}, ensure_ascii=False).encode())

    def handle_tts(self, query):
        params = urllib.parse.parse_qs(query)
        text = params.get("text", [""])[0]
        voice_key = params.get("voice", ["female"])[0]
        voice = VOICE_MAP.get(voice_key, DEFAULT_VOICE)

        if not text:
            self.send_response(400)
            self.cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "missing text parameter"}, ensure_ascii=False).encode())
            return

        # 限制文本长度
        if len(text) > 2000:
            text = text[:2000]

        try:
            # 生成音频
            communicate = edge_tts.Communicate(text, voice)
            audio_buffer = io.BytesIO()

            async def generate():
                async for chunk in communicate.stream():
                    if chunk["type"] == "audio":
                        audio_buffer.write(chunk["data"])

            asyncio.run(generate())
            audio_data = audio_buffer.getvalue()

            if not audio_data:
                raise Exception("TTS生成失败：无音频数据")

            self.send_response(200)
            self.cors_headers()
            self.send_header("Content-Type", "audio/mpeg")
            self.send_header("Content-Length", str(len(audio_data)))
            self.send_header("Cache-Control", "public, max-age=3600")
            self.end_headers()
            self.wfile.write(audio_data)

        except Exception as e:
            print(f"TTS错误: {e}", file=sys.stderr)
            self.send_response(500)
            self.cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}, ensure_ascii=False).encode())

    def log_message(self, format, *args):
        # 简化日志
        print(f"[TTS] {args[0]}")


def main():
    print(f"🎙️ 命理宝鉴 TTS 服务启动 (port {PORT})")
    print(f"   声线: {', '.join(VOICE_MAP.keys())}")
    print(f"   接口: http://127.0.0.1:{PORT}/api/tts?text=你好&voice=female")
    server = http.server.HTTPServer(("0.0.0.0", PORT), TTSHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 TTS服务已停止")
        server.server_close()

if __name__ == "__main__":
    main()
