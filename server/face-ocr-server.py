#!/usr/bin/env python3
"""
face-ocr-server.py
合并服务：AI 相貌分析 + 拍照 OCR 文字识别
端口 8913（避免与已有 8911/8912 冲突）
"""
import os, sys, json, base64, io, time, logging, hashlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

try:
    from PIL import Image
    HAVE_PIL = True
except Exception:
    HAVE_PIL = False

# ---- 日志 ----
logging.basicConfig(level=logging.INFO, format='%(asctime)s [face-ocr] %(message)s')
log = logging.getLogger('face-ocr')

# ---- 多模态 API 客户端（容错：自研代理 / 智谱/OpenAI/Doubao 任一可用即可） ----
# 优先使用项目自身的 G2CLAW 代理（与 api-server-v2.js 复用）
G2CLAW_API_KEY = os.environ.get('G2CLAW_API_KEY', '').strip()
AI_API_BASE = os.environ.get('AI_API_BASE', 'https://api.g2claw.com').strip()
G2CLAW_VISION_MODEL = os.environ.get('G2CLAW_VISION_MODEL', 'gpt-4o-mini')

ZHIPU_API_KEY = os.environ.get('ZHIPU_API_KEY', '').strip()
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '').strip()
DOUBAO_API_KEY = os.environ.get('DOUBAO_API_KEY', '').strip()

ZHIPU_VISION_MODEL = os.environ.get('ZHIPU_VISION_MODEL', 'glm-4v-flash')
OPENAI_VISION_MODEL = os.environ.get('OPENAI_VISION_MODEL', 'gpt-4o-mini')
DOUBAO_VISION_MODEL = os.environ.get('DOUBAO_VISION_MODEL', 'doubao-1-5-vision-pro-32k')

# ---- 拍照质量预检 ----
def inspect_image(b64: str):
    """检查图片基本信息：尺寸、亮度、是否人脸区域占比合理"""
    if not HAVE_PIL:
        return {'valid': True, 'note': 'PIL 未安装，跳过预检'}
    try:
        raw = base64.b64decode(b64.split(',')[-1])
        img = Image.open(io.BytesIO(raw)).convert('RGB')
        w, h = img.size
        # 亮度（灰度均值 0-255）
        gs = img.convert('L')
        px = list(gs.getdata())
        bright = sum(px) / len(px)
        # 横向像素比例（人脸 3:4 最佳）
        ratio = w / h if h else 0
        issues = []
        if w < 200 or h < 200:
            issues.append('图片尺寸过小（建议至少 300x300）')
        if bright < 50:
            issues.append('图片过暗（建议在自然光下重拍）')
        if bright > 230:
            issues.append('图片过亮（避免逆光）')
        if not (0.5 < ratio < 1.6):
            issues.append('人脸比例失调（请正对镜头）')
        return {
            'valid': len(issues) == 0,
            'width': w,
            'height': h,
            'brightness': round(bright, 1),
            'ratio': round(ratio, 2),
            'issues': issues,
        }
    except Exception as e:
        return {'valid': False, 'note': f'解析失败: {e}'}

# ---- 调多模态大模型：面相分析 ----
FACE_PROMPT = """你是一位精通中国传统面相学（麻衣神相、柳庄相法、水镜神相）的资深大师，兼通现代 AI 视觉识别。请基于这张正面照片，给出客观、专业、有理论支撑的分析。

要求：
1) 先描述照片质量（光线、角度、是否正脸）
2) 按三停（上中下停）描述额头、眉眼鼻、颧嘴下停
3) 五官评分（眉/眼/鼻/口/耳）：6 分制（5=极佳、4=佳、3=平、2=欠、1=差、0=需关注）+ 简短依据
4) 十二宫（命宫/财帛/官禄/兄弟/田宅/奴仆/夫妻/子女/疾厄/迁移/福德/父母）逐项简评（1 行/宫）
5) 流年气色（2026 丙午年）面部整体气色判断（红润/青暗/黄明/白润/紫红）
6) 给一段基于相法的总结（80-150 字），分优点+注意事项
7) 最后给一条可操作建议（如作息/饮食/情志/运动）

⚠️ 输出必须是结构化 Markdown，不要寒暄，不要编造具体年份事件。"""

OCR_PROMPT_GENERIC = """请精确识别这张图片中的所有文字，保持原始顺序和段落结构。如果包含表格请用 Markdown 表格还原。"""

OCR_PROMPT_TCM = """你是中医病历 OCR 专家。请提取这张图片中的全部信息：
1) 患者基本信息（姓名/性别/年龄/就诊日期）若有
2) 主诉（chief complaint）
3) 现病史（present illness）
4) 既往史（past history）若有
5) 体格检查（PE）若有
6) 舌象（tongue）/脉象（pulse）若有 — 这两项重点提取
7) 中医诊断（TCM diagnosis）：病名 + 证型
8) 西医诊断（WM diagnosis）若有
9) 方剂名称 + 药物组成（剂量保留原单位 g）
10) 医嘱（diet/lifestyle）

请用 Markdown 输出，每节标题加粗。"""

def call_vision_zhipu(b64: str, prompt: str):
    """智谱 GLM-4V-Flash（免费档）"""
    import urllib.request
    if not ZHIPU_API_KEY:
        return None
    url = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
    body = {
        'model': ZHIPU_VISION_MODEL,
        'messages': [{
            'role': 'user',
            'content': [
                {'type': 'image_url', 'image_url': {'url': f'data:image/jpeg;base64,{b64}'}},
                {'type': 'text', 'text': prompt}
            ]
        }],
        'max_tokens': 2000,
        'temperature': 0.3,
    }
    req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json',
                                          'Authorization': f'Bearer {ZHIPU_API_KEY}'})
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = json.loads(resp.read())
            return data['choices'][0]['message']['content']
    except Exception as e:
        log.warning(f'zhipu 失败: {e}')
        return None

def call_vision_openai(b64: str, prompt: str):
    """OpenAI GPT-4o-mini"""
    import urllib.request
    if not OPENAI_API_KEY:
        return None
    url = 'https://api.openai.com/v1/chat/completions'
    body = {
        'model': OPENAI_VISION_MODEL,
        'messages': [{
            'role': 'user',
            'content': [
                {'type': 'image_url', 'image_url': {'url': f'data:image/jpeg;base64,{b64}'}},
                {'type': 'text', 'text': prompt}
            ]
        }],
        'max_tokens': 2000,
    }
    req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json',
                                          'Authorization': f'Bearer {OPENAI_API_KEY}'})
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = json.loads(resp.read())
            return data['choices'][0]['message']['content']
    except Exception as e:
        log.warning(f'openai 失败: {e}')
        return None

def call_vision_doubao(b64: str, prompt: str):
    """火山豆包视觉（如果配置了 key）"""
    import urllib.request
    if not DOUBAO_API_KEY:
        return None
    url = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
    body = {
        'model': DOUBAO_VISION_MODEL,
        'messages': [{
            'role': 'user',
            'content': [
                {'type': 'image_url', 'image_url': {'url': f'data:image/jpeg;base64,{b64}'}},
                {'type': 'text', 'text': prompt}
            ]
        }],
        'max_tokens': 2000,
    }
    req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json',
                                          'Authorization': f'Bearer {DOUBAO_API_KEY}'})
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = json.loads(resp.read())
            return data['choices'][0]['message']['content']
    except Exception as e:
        log.warning(f'doubao 失败: {e}')
        return None

def call_vision_g2claw(b64: str, prompt: str):
    """复用项目自身的 G2CLAW 代理（OpenAI 兼容）"""
    import urllib.request
    if not G2CLAW_API_KEY:
        return None
    url = AI_API_BASE.rstrip('/') + '/v1/chat/completions'
    body = {
        'model': G2CLAW_VISION_MODEL,
        'messages': [{
            'role': 'user',
            'content': [
                {'type': 'image_url', 'image_url': {'url': f'data:image/jpeg;base64,{b64}'}},
                {'type': 'text', 'text': prompt}
            ]
        }],
        'max_tokens': 2000,
        'temperature': 0.3,
    }
    req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json',
                                          'Authorization': 'Bearer ' + G2CLAW_API_KEY})
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = json.loads(resp.read())
            if data.get('choices'):
                return data['choices'][0]['message']['content']
    except Exception as e:
        log.warning(f'g2claw 视觉失败: {e}')
    return None


def call_vision_with_fallback(b64: str, prompt: str):
    """多源容错：项目代理 → 智谱 → OpenAI → 豆包 → KB 兜底"""
    result = call_vision_g2claw(b64, prompt)
    if result: return {'text': result, 'engine': f'g2claw/{G2CLAW_VISION_MODEL}'}
    result = call_vision_zhipu(b64, prompt)
    if result: return {'text': result, 'engine': 'zhipu-glm-4v'}
    result = call_vision_openai(b64, prompt)
    if result: return {'text': result, 'engine': 'openai-gpt-4o'}
    result = call_vision_doubao(b64, prompt)
    if result: return {'text': result, 'engine': 'doubao-vision'}
    return None

# ---- KB 兜底（无 AI Key 时） ----
KB_FALLBACK_FACE = """## ⚠️ 未配置多模态大模型 API Key
请在环境变量中配置以下任一：
- `ZHIPU_API_KEY`（推荐 glm-4v-flash，免费）
- `OPENAI_API_KEY`（gpt-4o-mini）
- `DOUBAO_API_KEY`（豆包 vision）

## 📚 临时理论框架（基于麻衣神相）

### 壹·三停
- 上停（额头 15-30岁）：天庭饱满→少年得志；额狭窄→早年磨砺
- 中停（眉-鼻 31-50岁）：眉清目秀→中年顺遂；鼻梁挺直→中年财运
- 下停（鼻以下 51岁后）：地阁方圆→晚年福禄；下巴饱满→财产安守

### 贰·五官评分原则（6 分制）
- 眉：清秀柔顺为佳，杂眉/倒竖欠佳
- 眼：黑白分明为佳，红丝/肿胀欠佳
- 鼻：梁挺鼻翼丰为佳，瘦削苍白欠佳
- 口：唇红齿白为佳，暗淡欠佳
- 耳：轮廓分明垂珠为佳，尖薄欠佳

### 叁·十二宫速查
命宫（眉间）/财帛（鼻头）/官禄（额中）/兄弟（两眉）/田宅（眼睑）/奴仆（地阁）/夫妻（鱼尾）/子女（泪堂）/疾厄（山根）/迁移（额角）/福德（天仓）/父母（日月角）

### 肆·建议
上传清晰正脸照（光线充足、无遮挡、正面）后，将由 AI 视觉模型给出真实五官评分与气色判断。"""

KB_FALLBACK_OCR = """## ⚠️ 未配置 OCR 服务
请上传更清晰的图片（推荐 ≥1MB），或将文字手动复制到文本框。

## 📋 中医病历典型字段
- **主诉**：患者最痛苦的症状 + 持续时间
- **现病史**：症状发展过程
- **舌象**：舌色、苔色、形态
- **脉象**：浮沉迟数滑涩等
- **诊断**：病名 + 证型
- **方剂**：方名 + 药物 + 剂量"""

# ---- HTTP 处理器 ----
class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        log.info(fmt % args)

    def _json(self, code, payload):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._json(200, {'ok': True})

    def do_GET(self):
        path = urlparse(self.path).path
        if path in ('/health', '/healthz'):
            return self._json(200, {
                'ok': True,
                'service': 'face-ocr-server',
                'port': 8913,
                'engines': {
                    'g2claw': bool(G2CLAW_API_KEY),
                    'zhipu': bool(ZHIPU_API_KEY),
                    'openai': bool(OPENAI_API_KEY),
                    'doubao': bool(DOUBAO_API_KEY),
                },
                'pillow': HAVE_PIL,
                'endpoints': [
                    'POST /api/face/analyze  相貌分析',
                    'POST /api/ocr/recognize  通用 OCR',
                    'POST /api/ocr/tcm  中医病历 OCR',
                ]
            })
        return self._json(404, {'error': 'not_found', 'path': path})

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            length = int(self.headers.get('Content-Length', '0'))
            raw = self.rfile.read(length)
            data = json.loads(raw.decode('utf-8')) if raw else {}
        except Exception as e:
            return self._json(400, {'error': 'bad_json', 'detail': str(e)})

        image = data.get('image') or ''
        if not image or 'base64' not in image:
            return self._json(400, {'error': 'missing_image', 'detail': '需要 image base64 字段'})

        # 抠出纯 base64
        b64 = image.split(',')[-1] if ',' in image else image

        # 预检
        inspect = inspect_image(b64)
        if not inspect.get('valid', True):
            return self._json(200, {
                'ok': False,
                'phase': 'inspect',
                'issues': inspect.get('issues', []),
                'inspect': inspect,
                'message': '图片质量不达标，请按提示重拍'
            })

        t0 = time.time()
        if path == '/api/face/analyze':
            prompt = data.get('prompt') or FACE_PROMPT
            engine = call_vision_with_fallback(b64, prompt)
            if engine:
                return self._json(200, {
                    'ok': True,
                    'mode': 'face',
                    'engine': engine['engine'],
                    'analysis': engine['text'],
                    'inspect': inspect,
                    'elapsed_ms': int((time.time() - t0) * 1000),
                })
            return self._json(200, {
                'ok': True,
                'mode': 'face',
                'engine': 'kb-fallback',
                'analysis': KB_FALLBACK_FACE,
                'inspect': inspect,
                'note': '未配置 AI Key，返回 KB 理论框架'
            })

        if path == '/api/ocr/recognize':
            prompt = OCR_PROMPT_GENERIC
            engine = call_vision_with_fallback(b64, prompt)
            if engine:
                return self._json(200, {
                    'ok': True,
                    'mode': 'ocr',
                    'engine': engine['engine'],
                    'text': engine['text'],
                    'inspect': inspect,
                    'elapsed_ms': int((time.time() - t0) * 1000),
                })
            return self._json(200, {
                'ok': True,
                'mode': 'ocr',
                'engine': 'kb-fallback',
                'text': KB_FALLBACK_OCR,
                'note': '未配置 AI Key'
            })

        if path == '/api/ocr/tcm':
            prompt = OCR_PROMPT_TCM
            engine = call_vision_with_fallback(b64, prompt)
            if engine:
                return self._json(200, {
                    'ok': True,
                    'mode': 'ocr-tcm',
                    'engine': engine['engine'],
                    'text': engine['text'],
                    'inspect': inspect,
                    'elapsed_ms': int((time.time() - t0) * 1000),
                })
            return self._json(200, {
                'ok': True,
                'mode': 'ocr-tcm',
                'engine': 'kb-fallback',
                'text': KB_FALLBACK_OCR,
                'note': '未配置 AI Key'
            })

        return self._json(404, {'error': 'not_found', 'path': path})

if __name__ == '__main__':
    port = int(os.environ.get('FACE_OCR_PORT', '8913'))
    srv = ThreadingHTTPServer(('0.0.0.0', port), Handler)
    log.info(f'face-ocr-server 启动于 0.0.0.0:{port}')
    log.info(f'AI 引擎: g2claw={bool(G2CLAW_API_KEY)} zhipu={bool(ZHIPU_API_KEY)} openai={bool(OPENAI_API_KEY)} doubao={bool(DOUBAO_API_KEY)}')
    log.info(f'PIL: {HAVE_PIL}')
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        log.info('关闭')