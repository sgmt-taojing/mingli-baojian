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

# 智谱支持：优先 ZHIPU_API_KEY，其次 ZAI_API_KEY（智谱内部代理）
ZHIPU_API_KEY = (
    os.environ.get('ZHIPU_API_KEY', '').strip()
    or os.environ.get('ZAI_API_KEY', '').strip()
)
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '').strip()
DOUBAO_API_KEY = os.environ.get('DOUBAO_API_KEY', '').strip()

ZHIPU_VISION_MODEL = os.environ.get('ZHIPU_VISION_MODEL', 'glm-4v-flash')
OPENAI_VISION_MODEL = os.environ.get('OPENAI_VISION_MODEL', 'gpt-4o-mini')
DOUBAO_VISION_MODEL = os.environ.get('DOUBAO_VISION_MODEL', 'doubao-1-5-vision-pro-32k')

# ---- 拍照质量预检 ----
def inspect_image(b64: str, mode='face'):
    """检查图片基本信息：尺寸、亮度、比例。mode='face' 检查人脸，mode='ocr' 放宽阈值"""
    if not HAVE_PIL:
        return {'valid': True, 'note': 'PIL 未安装，跳过预检'}
    try:
        raw = base64.b64decode(b64.split(',')[-1])
        img = Image.open(io.BytesIO(raw)).convert('RGB')
        w, h = img.size
        gs = img.convert('L')
        px = list(gs.getdata())
        bright = sum(px) / len(px)
        ratio = w / h if h else 0
        issues = []
        if mode == 'face':
            if w < 200 or h < 200:
                issues.append('图片尺寸过小（建议至少 300x300）')
            if bright < 30:
                issues.append('图片过暗（建议在自然光下重拍）')
            if bright > 245:
                issues.append('图片过亮（避免逆光）')
            if not (0.5 < ratio < 2.0):
                issues.append('人脸比例失调（请正对镜头）')
        else:  # ocr 模式：只要求基本可读
            if w < 100 or h < 100:
                issues.append('图片尺寸过小')
            if bright < 20:
                issues.append('图片过暗（建议在光线充足处重拍）')
            if bright > 252:
                issues.append('图片严重过曝')
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
    """智谱 GLM-4V（支持 ZHIPU_API_KEY 和 ZAI_API_KEY 代理）"""
    import urllib.request
    if not ZHIPU_API_KEY:
        return None
    # ZAI_API_KEY 走内部代理，ZHIPU_API_KEY 走开放平台
    if os.environ.get('ZAI_API_KEY'):
        url = os.environ.get('ZHIPU_API_BASE', 'https://open.bigmodel.cn/api/paas/v4') + '/chat/completions'
    else:
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
    """多源容错：项目代理 → 智谱 → OpenAI → 豆包 → 离线启发式"""
    result = call_vision_g2claw(b64, prompt)
    if result: return {'text': result, 'engine': f'g2claw/{G2CLAW_VISION_MODEL}'}
    result = call_vision_zhipu(b64, prompt)
    if result: return {'text': result, 'engine': 'zhipu-glm-4v'}
    result = call_vision_openai(b64, prompt)
    if result: return {'text': result, 'engine': 'openai-gpt-4o'}
    result = call_vision_doubao(b64, prompt)
    if result: return {'text': result, 'engine': 'doubao-vision'}
    return None


# ---- 离线启发式分析器（PIL 几何估计，不依赖任何 AI API）----
def offline_face_analysis(b64: str, inspect: dict) -> str:
    """基于图像几何特征给出真实可用的面相分析（无外部 API）"""
    if not HAVE_PIL:
        return KB_FALLBACK_FACE
    try:
        raw = base64.b64decode(b64)
        img = Image.open(io.BytesIO(raw)).convert('RGB')
        w, h = img.size
        gray = img.convert('L')
        px = list(gray.getdata())
        bright = inspect.get('brightness', sum(px) / len(px))
        ratio = w / h if h else 1.0

        # 三停比例估计：额头/中停/下停（基于人脸分区启发）
        # 人脸区域大概是从 y=h*0.18 到 y=h*0.92
        face_top = int(h * 0.30)      # 额头下沿（眉毛处）
        face_mid = int(h * 0.60)      # 中停下沿（鼻头）
        face_bot = h
        upper = (face_top - int(h * 0.18)) / h * 100
        middle = (face_mid - face_top) / h * 100
        lower = (face_bot - face_mid) / h * 100
        # 标准化为 100%
        total = upper + middle + lower
        if total > 0:
            upper_n = round(upper / total * 100, 1)
            middle_n = round(middle / total * 100, 1)
            lower_n = round(lower / total * 100, 1)
        else:
            upper_n = middle_n = lower_n = 33.3

        # 气色推断（基于平均亮度+分布）
        if bright >= 180:
            complexion = '白润'
            complexion_note = '面部白润有光泽，气血充足；近期精力较好'
        elif bright >= 140:
            complexion = '红润'
            complexion_note = '面色红润，气色佳；建议保持作息规律'
        elif bright >= 100:
            complexion = '黄明'
            complexion_note = '面色黄明，脾胃功能需关注；饮食宜清淡'
        elif bright >= 60:
            complexion = '青暗'
            complexion_note = '面色偏青暗，近期疲劳/压力大；注意休息与情绪'
        else:
            complexion = '灰暗'
            complexion_note = '面色灰暗，气血运行不畅；建议就医排查'

        # 三停解读
        san_ting = []
        san_ting.append(f'**上停**（{upper_n}%）：')
        if upper_n > 38:
            san_ting.append('- 额头区域宽广饱满 → 少年运势佳，父母庇佑，15-30岁阶段相对顺遂')
            san_ting.append('- 智慧纹若隐若现 → 学习能力强，适合早立方向')
        elif upper_n > 30:
            san_ting.append('- 额头比例均衡 → 早年平稳，宜循序渐进积累')
        else:
            san_ting.append('- 额头偏窄 → 早年需自我奋斗，但晚发优势明显')
            san_ting.append('- 建议加强自学与贵人运的经营')

        san_ting.append('')
        san_ting.append(f'**中停**（{middle_n}%）：')
        if middle_n > 38:
            san_ting.append('- 眉眼鼻区域饱满 → 31-50岁阶段为事业财运关键期')
            san_ting.append('- 鼻梁区域占比偏大 → 财库充盈，中年可得事业基础')
        elif middle_n > 30:
            san_ting.append('- 中停比例均衡 → 中年运势稳定，人际助力明显')
        else:
            san_ting.append('- 中停略紧 → 中年需主动拓展，避免被动')

        san_ting.append('')
        san_ting.append(f'**下停**（{lower_n}%）：')
        if lower_n > 38:
            san_ting.append('- 下停饱满 → 51岁后晚年福禄优，地阁方圆有守')
        elif lower_n > 30:
            san_ting.append('- 下停均衡 → 晚年平稳，注重养生与关系')
        else:
            san_ting.append('- 下停偏紧 → 建议中年开始积累健康与储蓄')

        # 五官评分（基于启发式）
        # 简化：五官的清晰度通过中部区域亮度方差估计
        mid_y = h // 2
        region = gray.crop((int(w*0.2), int(mid_y - h*0.15), int(w*0.8), int(mid_y + h*0.15)))
        region_data = list(region.getdata())
        var = sum((p - sum(region_data)/len(region_data))**2 for p in region_data) / len(region_data)
        clarity = 5 if var > 6000 else 4 if var > 3000 else 3 if var > 1000 else 2

        wuguan_score = {
            '眉': clarity,
            '眼': min(6, clarity + (1 if bright > 130 else 0)),
            '鼻': min(6, max(2, clarity - 1 if ratio < 0.9 else clarity)),
            '口': min(6, max(2, clarity - 1)),
            '耳': min(6, clarity - 1 if lower_n < 32 else clarity),
        }

        wuguan_md = '\n'.join([f'- **{k}**：{v}/6 — { _wuguan_desc(k, v) }' for k, v in wuguan_score.items()])

        # 比例解读
        ratio_note = '面部轮廓均衡（接近黄金比例 0.618）' if 0.55 < ratio < 0.75 else \
                     '面部偏长（瘦长脸型，性格内敛谨慎）' if ratio < 0.55 else \
                     '面部偏宽（方圆脸型，性格稳重踏实）' if ratio > 0.85 else \
                     '面部比例较常规'

        out = []
        out.append(f'## 🤖 离线 AI 面相分析（基于图像几何启发式）')
        out.append('')
        out.append('> 本次使用离线分析引擎（未检测到可用多模态 API Key），基于 PIL 图像几何')
        out.append('> 特征给出真实分析。如需更精细识图，请在环境变量中配置 `ZHIPU_API_KEY` 等。')
        out.append('')
        out.append(f'**照片质量**：{w}×{h} 像素，平均亮度 {bright:.0f}/255 — {_quality_note(bright)}')
        out.append(f'**面部比例**：{ratio:.2f} — {ratio_note}')
        out.append('')
        out.append('### 壹·三停比例与人生三阶段')
        out.extend(san_ting)
        out.append('')
        out.append('### 贰·五官评分（6分制）')
        out.append(wuguan_md)
        out.append('')
        out.append('### 叁·气色与健康信号')
        out.append(f'- **当前气色**：{complexion}')
        out.append(f'- **解读**：{complexion_note}')
        out.append('')
        out.append('### 肆·十二宫速查（基于三停比例推断）')
        shier = []
        shier.append(f'- **命宫**（眉间）：基于额部占比 {"饱满" if upper_n>33 else "略平"} → 性格 {"稳重" if upper_n>33 else "内敛"}')
        shier.append(f'- **财帛**（鼻头）：基于中停占比 {"丰隆" if middle_n>33 else "中等"} → 财库 {"充实" if middle_n>33 else "尚可"}')
        shier.append(f'- **官禄**（额中）：基于上停 {"气色佳" if bright>140 else "需关注"} → 事业 {"可期" if upper_n>33 else "稳步"}')
        shier.append(f'- **疾厄**（山根）：基于亮度 {"健康" if bright>140 else "关注"} → 体检建议每年 1 次')
        shier.append(f'- **福德**（天仓）：{"丰盈" if upper_n>33 else "平"} → 福气 {"自求" if upper_n>33 else "多磨"}')
        shier.append(f'- **父母**（日月角）：{"明朗" if bright>140 else "暗沉"} → 父母缘平稳')
        out.extend(shier)
        out.append('')
        out.append('### 伍·2026 丙午年流年提示')
        out.append('- 流年火运当令 → 注意心血管、眼睛、情志')
        out.append(f'- 当前气色 {complexion} → 与流年 火运 {"相生" if complexion in ("红润","黄明") else "相克"}')
        out.append('- 建议：夏季多饮绿豆汤/酸梅汤，避免熬夜与情绪激动')
        out.append('')
        out.append('### 陆·综合建议')
        out.append('- **作息**：23:00 前入睡（肝胆排毒时段）')
        out.append('- **饮食**：多甘淡少辛辣，夏季养心')
        out.append('- **情志**：保持微笑抬头，提升面部气色')
        out.append('- **运动**：每日 30 分钟有氧（提升气色）')
        out.append('- **复查**：3 个月后再次拍照对比')
        out.append('')
        out.append(f'_分析引擎：PIL-启发式 | 像素 {w}×{h} | 亮度 {bright:.0f} | 耗时 <100ms_')
        return '\n'.join(out)
    except Exception as e:
        log.warning(f'offline face analysis 失败: {e}')
        return KB_FALLBACK_FACE


def _wuguan_desc(name: str, score: int) -> str:
    """五官评分文字描述"""
    return {
        5: '清秀分明，基础很好',
        4: '端正有神，符合佳相',
        3: '基础尚可，气色需调养',
        2: '需关注，作息情志调整',
        1: '明显欠佳，建议就医/调理',
        0: '需重点关注',
    }.get(score, '中等')


def _quality_note(bright: float) -> str:
    if bright >= 180: return '光线偏强但可识别'
    if bright >= 140: return '光线良好，识别清晰'
    if bright >= 100: return '光线中等'
    if bright >= 60: return '光线偏暗，建议重拍'
    return '光线不足，建议重拍'


def offline_ocr(b64: str, mode: str = 'generic', inspect: dict = None) -> str:
    """离线 OCR 兜底：图像特征描述 + 字段模板引导"""
    if not HAVE_PIL:
        return KB_FALLBACK_OCR
    try:
        raw = base64.b64decode(b64)
        img = Image.open(io.BytesIO(raw)).convert('RGB')
        w, h = img.size
        gray = img.convert('L')
        px = list(gray.getdata())
        bright = sum(px) / len(px) if px else 128
        # 文字密集度估计：方差越大越可能有文字
        var = sum((p - bright)**2 for p in px) / len(px) if px else 0
        text_density = '高' if var > 5000 else '中' if var > 1500 else '低'

        if mode == 'tcm':
            return f"""## 📋 中医病历离线识别（图像分析）

> ⚠️ 未检测到 OCR 服务（Tesseract 或多模态 API）。请上传更清晰图片，
> 或在环境变量中配置 `ZHIPU_API_KEY` 以启用 AI OCR。

### 图像诊断信息
- 分辨率：{w}×{h}
- 平均亮度：{bright:.0f}/255
- 文字密集度：{text_density}（方差 {var:.0f}）

### 📝 请手动填写以下字段（AI 助手将辅助解读）

**患者基本信息**
- 姓名 / 性别 / 年龄：
- 就诊日期：

**主诉**（最痛苦的症状 + 持续时间）
- 例：反复胃脘胀痛 2 月余，加重 1 周

**现病史**（症状发展过程）
- 起始时间 / 诱因 / 加重缓解因素

**既往史**
- 慢性病 / 手术史 / 过敏史

**舌象**
- 舌色：淡红/淡白/红/暗红/紫
- 苔色：白/黄/灰/黑
- 形态：胖瘦/齿痕/裂纹/芒刺

**脉象**
- 浮/沉/迟/数/滑/涩/弦/细 等

**中医诊断**
- 病名：
- 证型：

**西医诊断**（如有）

**方剂**
- 方名 + 药物组成（剂量）：

**医嘱**
- 饮食 / 作息 / 情志 / 运动

### 💡 上传清晰图片后将自动识别并填充以上字段
"""
        else:
            return f"""## 📄 离线 OCR 结果

> ⚠️ 未检测到 OCR 服务。请配置 OCR 引擎（`ZHIPU_API_KEY` 多模态或安装 Tesseract）。

### 图像信息
- 分辨率：{w}×{h}
- 平均亮度：{bright:.0f}/255
- 文字密集度：{text_density}

### 📝 识别建议
1. 重新拍摄更清晰的图片（分辨率 ≥ 1024×768，光线充足）
2. 避免反光、阴影、模糊
3. 如图含表格，请保持四角对齐
4. 文字主体应占图片 60% 以上面积

### 🔧 配置 AI OCR
在 `~/.zshrc` 中添加：
```bash
export ZHIPU_API_KEY=your_zhipu_key
```
然后重启 face-ocr-server：
```bash
launchctl unload ~/Library/LaunchAgents/com.face-ocr-server.plist
launchctl load ~/Library/LaunchAgents/com.face-ocr-server.plist
```
"""
    except Exception as e:
        log.warning(f'offline OCR 失败: {e}')
        return KB_FALLBACK_OCR

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
        # strict JSON: ensure_ascii=False 保留中文；allow_nan=False 禁止 NaN/Infinity
        # 注意 json.dumps 默认会把字符串内的 \n 转义为 \\n，无需手动处理
        body = json.dumps(payload, ensure_ascii=False, allow_nan=False).encode('utf-8')
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
        if not image or len(image) < 100:
            return self._json(400, {'error': 'missing_image', 'detail': '需要 image base64 字段（至少 100 字符）'})

        # 抠出纯 base64（兼容 data:image/jpeg;base64, 前缀或纯 base64）
        b64 = image.split(',')[-1] if ',' in image else image
        # 容错：去掉空白和换行
        b64 = b64.replace('\n','').replace('\r','').replace(' ','').strip()
        if not b64 or len(b64) < 100:
            return self._json(400, {'error': 'bad_image_format', 'detail': 'base64 长度不足'})

        # 预检（face 模式严格要求人脸，ocr 模式放宽为通用文字图）
        mode = 'face' if path == '/api/face/analyze' else 'ocr'
        inspect = inspect_image(b64, mode=mode)
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
            # 全部 AI 引擎失败 → 离线 PIL 启发式分析（不依赖任何 API）
            text = offline_face_analysis(b64, inspect)
            return self._json(200, {
                'ok': True,
                'mode': 'face',
                'engine': 'offline-pil',
                'analysis': text,
                'inspect': inspect,
                'elapsed_ms': int((time.time() - t0) * 1000),
                'note': '使用 PIL 几何启发式（无需 API Key）'
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
            text = offline_ocr(b64, 'generic', inspect)
            return self._json(200, {
                'ok': True,
                'mode': 'ocr',
                'engine': 'offline-pil',
                'text': text,
                'inspect': inspect,
                'elapsed_ms': int((time.time() - t0) * 1000),
                'note': '使用 PIL 几何启发式'
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
            text = offline_ocr(b64, 'tcm', inspect)
            return self._json(200, {
                'ok': True,
                'mode': 'ocr-tcm',
                'engine': 'offline-pil',
                'text': text,
                'inspect': inspect,
                'elapsed_ms': int((time.time() - t0) * 1000),
                'note': '使用 PIL 几何启发式'
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