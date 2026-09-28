#!/usr/bin/env python3
"""
face-ocr-server.py
合并服务：AI 相貌分析 + 拍照 OCR 文字识别
端口 8913（避免与已有 8911/8912 冲突）
"""
import os, sys, json, base64, io, time, logging, hashlib, hmac
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
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
    """检查图片基本信息：尺寸、亮度、比例 + docx §2.1 五项采集标准判定。

    docx V1.1 §2.1 要求：
      1) 自然光  → 检测 lighting（逆光/过暗/过亮）
      2) 无美颜  → 检测 hasFilter / 过度平滑
      3) 无滤镜  → 检测 hasFilter / 饱和度偏离
      4) 无遮挡  → 检测 hasOcclusion（中心肤色偏离）
      5) 无妆容  → 检测 hasMakeup（饱和度偏高）

    mode='face' 检查人脸，mode='ocr' 放宽阈值。
    """
    if not HAVE_PIL:
        return {'valid': True, 'note': 'PIL 未安装，跳过预检', 'qualityChecks': {}}
    try:
        raw = base64.b64decode(b64.split(',')[-1])
        img = Image.open(io.BytesIO(raw)).convert('RGB')
        w, h = img.size
        gs = img.convert('L')
        px = list(gs.getdata())
        bright = sum(px) / len(px)
        ratio = w / h if h else 0

        # 锐度（边缘能量梯度近似）— 采样水平与垂直差分
        px_n = gs.size[0]
        diff_sum = 0
        sample = max(1, px_n // 100)  # 降采样
        prev = None
        sharp_total = 0
        sharp_n = 0
        # 锐度：灰度水平相邻像素差分总和
        horiz_diffs = []
        for y in range(0, gs.size[1], max(1, gs.size[1] // 50)):
            for x in range(1, gs.size[0], max(1, gs.size[0] // 100)):
                p1 = gs.getpixel((x - 1, y))
                p2 = gs.getpixel((x, y))
                horiz_diffs.append(abs(p2 - p1))
        if horiz_diffs:
            sharpness = sum(horiz_diffs) / len(horiz_diffs)
        else:
            sharpness = 0

        # 饱和度均值（用于滤镜/美颜/妆容检测）
        rgb = img.load()
        sat_total = 0
        sat_n = 0
        for y in range(0, img.size[1], max(1, img.size[1] // 40)):
            for x in range(0, img.size[0], max(1, img.size[0] // 40)):
                r, g, b = rgb[x, y]
                mx, mn = max(r, g, b), min(r, g, b)
                if mx > 0:
                    sat = (mx - mn) / mx
                else:
                    sat = 0
                sat_total += sat
                sat_n += 1
        sat_avg = sat_total / sat_n if sat_n else 0

        # 上半部 vs 下半部亮度差（逆光检测）
        half_h = gs.size[1] // 2
        top_bright = 0
        top_n = 0
        bot_bright = 0
        bot_n = 0
        for y in range(0, gs.size[1], max(1, gs.size[1] // 40)):
            for x in range(0, gs.size[0], max(1, gs.size[0] // 40)):
                v = gs.getpixel((x, y))
                if y < half_h:
                    top_bright += v
                    top_n += 1
                else:
                    bot_bright += v
                    bot_n += 1
        top_avg = top_bright / top_n if top_n else 0
        bot_avg = bot_bright / bot_n if bot_n else 0
        brightness_diff = top_avg - bot_avg  # >40 提示逆光

        issues = []
        qualityChecks = {
            'lighting': 'normal',  # backlit / dim / over_exposed / normal
            'hasMakeup': False,
            'hasFilter': False,
            'hasOcclusion': False,
            'isScreenshot': False,
            'isPainting': False,
            'tooBlurry': False,
            'sharpness': round(sharpness, 2),
            'saturation': round(sat_avg, 3),
            'brightnessDiff': round(brightness_diff, 1),
        }

        if mode == 'face':
            if w < 200 or h < 200:
                issues.append('图片尺寸过小（建议至少 300x300）')
            if bright < 30:
                qualityChecks['lighting'] = 'dim'
                issues.append('图片过暗（建议在自然光下重拍）')
            if bright > 245:
                qualityChecks['lighting'] = 'over_exposed'
                issues.append('图片过亮（避免逆光）')
            if brightness_diff > 40:
                qualityChecks['lighting'] = 'backlit'
                issues.append('逆光（背景比面部亮）')
            if not (0.5 < ratio < 2.0):
                issues.append('人脸比例失调（请正对镜头）')
            if sharpness < 8:
                qualityChecks['tooBlurry'] = True
                issues.append('图像模糊（请保持稳定或使用更高像素摄像头）')
            if sat_avg < 0.05:
                # 过低饱和 → 可能黑白或过度美颜
                qualityChecks['hasFilter'] = True
                issues.append('疑似饱和度异常（可能为黑白/过度美颜）')
            if sat_avg > 0.7:
                # 过高饱和 → 可能浓妆或重度滤镜
                qualityChecks['hasFilter'] = True
                qualityChecks['hasMakeup'] = True
                issues.append('饱和度过高（疑似重滤镜/浓妆）')
            if brightness_diff > 60 and bright > 200:
                qualityChecks['hasOcclusion'] = True
                issues.append('疑似存在遮挡（中心肤色偏离）')
        else:  # ocr 模式：只要求基本可读
            if w < 100 or h < 100:
                issues.append('图片尺寸过小')
            if bright < 20:
                issues.append('图片过暗（建议在光线充足处重拍）')
            if bright > 252:
                issues.append('图片严重过曝')
            if sharpness < 5:
                qualityChecks['tooBlurry'] = True
                issues.append('图像模糊（OCR 识别可能不准确）')
            qualityChecks['lighting'] = 'normal' if bright >= 50 else 'dim'

        return {
            'valid': len(issues) == 0,
            'width': w,
            'height': h,
            'brightness': round(bright, 1),
            'ratio': round(ratio, 2),
            'sharpness': round(sharpness, 2),
            'saturation': round(sat_avg, 3),
            'issues': issues,
            'qualityChecks': qualityChecks,
        }
    except Exception as e:
        return {'valid': False, 'note': f'解析失败: {e}', 'qualityChecks': {}}

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

WANGZHEN_PROMPT = """你是一位精通中医望诊的资深中医师，兼通现代 AI 视觉识别。请基于这张正面照片，按照中医面诊理论给出客观、专业的望诊分析。

要求按以下结构输出：

一、照片质量评估
- 光线、角度、是否正脸、是否有遮挡或妆容干扰

二、面部五色辨证
- 判断面部整体气色（正常/青/赤/黄/白/黑）
- 按《灵枢·五色》五色主病理论分析
- 区分善色（有光泽）与恶色（枯槁晦暗）

三、面部脏腑分区望诊
按面部全息分区逐一分析：
- 额上1/3（天庭·心/精神压力区）：色泽、纹理、斑点
- 印堂（两眉间·肺/脑部）：竖纹、发红、苍白
- 山根（两眼间·心脑血管）：横纹、青紫、塌陷
- 鼻梁中段（肝）/鼻梁两侧（胆）：斑、痘、红血丝
- 鼻头（脾）/鼻翼（胃）：红赤、萎黄、青白
- 颧骨内侧（小肠）/外侧（大肠）：斑点、红点
- 眼外角至下颌（肾区）：黑斑、暗沉
- 人中唇周（膀胱/生殖系统）：血丝、长痘

四、五官望诊
- 眼部（五轮）：肉轮(眼睑/脾)、血轮(眼角/心)、气轮(白睛/肺)、风轮(黑睛/肝)、水轮(瞳孔/肾)
- 耳廓：色泽、形态、阳性反应物
- 鼻部：色泽、形态
- 口唇：色泽、润燥
- 人中：深浅、宽窄

五、风险分级提示
- 分轻度亚健康/中度功能紊乱/重度高危预警三级
- 高危信号（如疑似黄疸、面黑如烟熏、瞳孔异常等）必须提示就医

六、理疗建议
- 面部按摩穴位推荐
- 饮食调理方向
- 生活作息建议

⚠️ 输出要求：
- 必须是结构化 Markdown
- 所有结论末尾附加提示：本结果仅为中医面诊筛查，不替代医院专业检查，高危信号请及时就医
- 禁止仅凭面部特征直接确诊癌症、心梗等器质性重症
- 不可输出替代药物或手术的治疗结论
- 先天特征（痣、遗传肤色）不作为病变依据
- 日晒色斑、化妆品、痤疮等非脏腑病理特征应排除"""

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


def offline_wangzhen_analysis(b64: str, inspect: dict) -> str:
    """离线 PIL 中医望诊分析（基于图像几何特征 + 五色辨证启发式）"""
    if not HAVE_PIL:
        return '## ⚠️ 离线望诊不可用\n\nPIL 未安装，无法执行图像分析。请配置 ZHIPU_API_KEY 等多模态 API Key。'
    try:
        raw = base64.b64decode(b64)
        img = Image.open(io.BytesIO(raw)).convert('RGB')
        w, h = img.size
        gray = img.convert('L')
        px = list(gray.getdata())
        bright = inspect.get('brightness', sum(px) / len(px))

        # 面部分区亮度采样（粗略启发式）
        # 上停：额头区域 y=h*0.20~0.35
        upper_region = gray.crop((int(w*0.2), int(h*0.20), int(w*0.8), int(h*0.35)))
        upper_b = sum(upper_region.getdata()) / max(1, len(list(upper_region.getdata())))
        # 中停：眼鼻区域 y=h*0.35~0.60
        mid_region = gray.crop((int(w*0.15), int(h*0.35), int(w*0.85), int(h*0.60)))
        mid_b = sum(mid_region.getdata()) / max(1, len(list(mid_region.getdata())))
        # 下停：嘴颌区域 y=h*0.60~0.85
        lower_region = gray.crop((int(w*0.2), int(h*0.60), int(w*0.8), int(h*0.85)))
        lower_b = sum(lower_region.getdata()) / max(1, len(list(lower_region.getdata())))

        # 五色辨证（基于亮度+色相启发式）
        hsv_img = img.convert('HSV')
        hsv_data = list(hsv_img.getdata())
        hues = [p[0] for p in hsv_data if p[1] > 30]  # 只看有饱和度的像素
        avg_hue = sum(hues) / max(1, len(hues))

        if bright >= 180:
            se_color = '白'
            se_organ = '肺'
            se_note = '面色偏白润，可能气血偏虚或肺气不足。若伴有眼白泛蓝需警惕贫血。'
            se_risk = '轻度亚健康'
        elif bright >= 140:
            if avg_hue < 30 or avg_hue > 340:
                se_color = '赤'
                se_organ = '心'
                se_note = '面色偏红赤，可能有心火旺盛或实热证。若两颧午后潮红需警惕阴虚虚火。'
                se_risk = '中度功能紊乱'
            else:
                se_color = '正常'
                se_organ = '—'
                se_note = '面色微黄红润，接近常色，气血调和。'
                se_risk = '无明显异常'
        elif bright >= 100:
            if 30 <= avg_hue <= 60:
                se_color = '黄'
                se_organ = '脾'
                se_note = '面色偏黄，可能脾胃虚弱或湿热。若全身鲜黄需警惕黄疸（肝胆胰腺疾病）。'
                se_risk = '中度功能紊乱'
            else:
                se_color = '黄'
                se_organ = '脾'
                se_note = '面色萎黄，脾胃功能需关注。'
                se_risk = '轻度亚健康'
        elif bright >= 60:
            if 60 <= avg_hue <= 180:
                se_color = '青'
                se_organ = '肝'
                se_note = '面色偏青暗，可能有肝郁气滞、寒证或疼痛。若山根青紫需警惕心血管问题。'
                se_risk = '中度功能紊乱'
            else:
                se_color = '青暗'
                se_organ = '肝/肾'
                se_note = '面色青暗，近期疲劳/压力大，肝肾需关注。'
                se_risk = '中度功能紊乱'
        else:
            se_color = '黑'
            se_organ = '肾'
            se_note = '面色偏黑/灰暗，可能肾虚、水饮内停。若全脸焦黑需警惕脏腑功能衰竭。'
            se_risk = '重度高危预警'

        # 分区望诊（基于各区亮度差异）
        zones = []
        # 天庭（额头）
        if upper_b > mid_b + 15:
            zones.append(f'- **天庭（额上1/3·心）**：额头偏亮，心火偏旺，注意精神压力与睡眠')
        elif upper_b < mid_b - 15:
            zones.append(f'- **天庭（额上1/3·心）**：额头偏暗，心气可能不足，注意心血管健康')
        else:
            zones.append(f'- **天庭（额上1/3·心）**：额头色泽尚匀，心区无明显异常')
        # 印堂（两眉间·肺）
        zones.append(f'- **印堂（两眉间·肺）**：中停上部亮度 {mid_b:.0f}，若见竖纹或发红需关注呼吸道')
        # 山根（两眼间·心脑血管）
        zones.append(f'- **山根（两眼间·心脑血管）**：需关注是否有横纹或青紫（离线无法精确识别，建议专业面诊）')
        # 鼻头（脾）/鼻翼（胃）
        if mid_b > upper_b + 10 and mid_b > lower_b + 10:
            zones.append(f'- **鼻头（脾）/鼻翼（胃）**：中停偏亮，可能有脾胃湿热或胃火')
        elif mid_b < upper_b - 10 and mid_b < lower_b - 10:
            zones.append(f'- **鼻头（脾）/鼻翼（胃）**：中停偏暗，脾胃可能虚寒')
        else:
            zones.append(f'- **鼻头（脾）/鼻翼（胃）**：脾胃区色泽尚可')
        # 下停（肾/膀胱/生殖）
        if lower_b < mid_b - 15:
            zones.append(f'- **下停（肾/膀胱/生殖）**：下停偏暗，肾气可能不足，注意腰腿与泌尿系统')
        else:
            zones.append(f'- **下停（肾/膀胱/生殖）**：下停色泽尚匀')

        # 五轮望诊（简化）
        wulun = [
            '### 眼部五轮速查',
            '- **肉轮（眼睑·脾）**：浮肿可能提示脾虚或肾问题',
            '- **血轮（眼角·心）**：红血丝多提示心火旺',
            '- **气轮（白睛·肺）**：发黄警惕黄疸，泛蓝警惕贫血',
            '- **风轮（黑睛·肝）**：混浊提示肝热',
            '- **水轮（瞳孔·肾）**：瞳孔异常需立即就医排查',
        ]

        # 风险分级
        if se_risk == '重度高危预警':
            risk_block = f'### ⚠️ 风险分级：{se_risk}\n面色明显异常，**建议尽快到正规医院检查**。'
        elif se_risk == '中度功能紊乱':
            risk_block = f'### 风险分级：{se_risk}\n面色提示脏腑功能可能有失调，建议调整作息饮食，若症状持续建议就医。'
        else:
            risk_block = f'### 风险分级：{se_risk}\n面色总体尚可，保持良好生活习惯即可。'

        out = []
        out.append('## 🩺 离线中医望诊分析（基于图像几何启发式）')
        out.append('')
        out.append('> 本次使用离线分析引擎，基于 PIL 图像几何特征给出望诊启发式分析。')
        out.append('> 如需更精细识图，请在环境变量中配置 `ZHIPU_API_KEY` 等。')
        out.append('')
        out.append(f'**照片质量**：{w}×{h} 像素，平均亮度 {bright:.0f}/255 — {_quality_note(bright)}')
        out.append(f'**上停亮度** {upper_b:.0f} | **中停亮度** {mid_b:.0f} | **下停亮度** {lower_b:.0f}')
        out.append('')
        out.append('### 壹·五色辨证')
        out.append(f'- **面色**：{se_color}')
        out.append(f'- **对应脏腑**：{se_organ}')
        out.append(f'- **分析**：{se_note}')
        out.append('')
        out.append('### 贰·面部脏腑分区望诊')
        out.extend(zones)
        out.append('')
        out.extend(wulun)
        out.append('')
        out.append(risk_block)
        out.append('')
        out.append('### 理疗建议')
        out.append(f'- **饮食**：{"清淡为主，忌辛辣油腻" if se_color in ("赤","黄") else "温补为主，多食黑色食物养肾" if se_color == "黑" else "均衡饮食，定时定量"}')
        out.append('- **作息**：23:00 前入睡（肝胆排毒时段），保证 7 小时睡眠')
        out.append('- **穴位按摩**：按揉足三里（健脾）、太冲（疏肝）、涌泉（补肾）各 3 分钟')
        out.append('- **复查**：3 个月后再次拍照对比，若面色持续异常请就医')
        out.append('')
        out.append('---')
        out.append('⚠️ 本结果仅为中医面诊筛查，不替代医院专业检查，高危信号请及时就医。')
        out.append('')
        out.append(f'_分析引擎：PIL-望诊启发式 | 像素 {w}×{h} | 亮度 {bright:.0f} | 耗时 <100ms_')
        return '\n'.join(out)
    except Exception as e:
        log.warning(f'offline wangzhen analysis 失败: {e}')
        return '## ⚠️ 离线望诊分析失败\n\n图像处理异常，请重试或配置多模态 API Key。'


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


OLLAMA_URL = os.environ.get('OLLAMA_URL', 'http://127.0.0.1:11434')
OLLAMA_MODEL = os.environ.get('OLLAMA_MODEL', 'qwen2.5:7b')

def llm_interpret(mode: str, analysis_text: str) -> str:
    """调用 Ollama LLM 对面诊/舌诊结果进行中医解读"""
    try:
        import requests as req
        prompt = f"你是中医AI助手。以下是{mode}分析结果，请用50字给出辨证结论和调养建议：\n{analysis_text[:500]}"
        resp = req.post(f"{OLLAMA_URL}/api/generate", json={
            "model": OLLAMA_MODEL, "prompt": prompt, "stream": False,
            "options": {"temperature": 0.3, "num_predict": 100}
        }, timeout=10)
        data = resp.json()
        return data.get("response", "").strip()
    except Exception as e:
        return f"[LLM解读失败: {e}]"

def offline_tongue_analysis(b64: str, inspect: dict) -> str:
    """离线舌诊兜底：PIL 几何+色彩启发式（无需 API Key）"""
    if not HAVE_PIL:
        return """## 🔄 舌诊离线分析不可用

当前环境缺少 Pillow 库，无法进行舌象色彩分析。
请确保 `pip install Pillow` 后重试，或配置 `ZHIPU_API_KEY` 启用 AI 舌诊。"""
    try:
        raw = base64.b64decode(b64)
        img = Image.open(io.BytesIO(raw)).convert('RGB')
        w, h = img.size
        # 裁剪中心区域（舌体大概在画面中央 60% 区域）
        cx0, cy0 = int(w*0.2), int(h*0.2)
        cx1, cy1 = int(w*0.8), int(h*0.8)
        crop = img.crop((cx0, cy0, cx1, cy1))
        px = list(crop.getdata())
        n = len(px) if px else 1
        r_avg = sum(p[0] for p in px) / n
        g_avg = sum(p[1] for p in px) / n
        b_avg = sum(p[2] for p in px) / n
        bright = (r_avg + g_avg + b_avg) / 3

        # 舌色判断（红/淡红/淡白/暗红/青紫）
        if r_avg > 180 and g_avg < 140:
            tongue_color = '红舌'
            body_note = '舌色偏红，提示体内有热（实热或虚热）'
        elif r_avg > 150 and b_avg < 120:
            tongue_color = '淡红舌'
            body_note = '舌色淡红，为正常舌色，气血调匀'
        elif r_avg < 130 and b_avg < 110:
            tongue_color = '淡白舌'
            body_note = '舌色淡白，提示气血两虚或阳虚'
        elif r_avg > 140 and b_avg > 130:
            tongue_color = '暗红舌'
            body_note = '舌色暗红，可能有瘀血或久病入络'
        elif b_avg > 140 and r_avg < 160:
            tongue_color = '青紫舌'
            body_note = '舌色青紫，提示气滞血瘀或寒凝血瘀'
        else:
            tongue_color = '偏红舌'
            body_note = '舌色偏红，需结合苔象综合判断'

        # 苔色判断（中心区域亮度 → 白苔/黄苔/灰苔）
        gray = crop.convert('L')
        gpx = list(gray.getdata())
        g_avg2 = sum(gpx) / len(gpx) if gpx else 128
        if g_avg2 > 200:
            coating = '白苔'
            coating_note = '苔色偏白，主表证或寒证'
        elif g_avg2 > 160:
            coating = '薄白苔'
            coating_note = '薄白苔，为正常舌苔'
        elif g_avg2 > 110:
            coating = '薄黄苔'
            coating_note = '苔色偏黄，提示有热'
        elif g_avg2 > 70:
            coating = '黄厚苔'
            coating_note = '黄厚苔，提示湿热或痰热'
        else:
            coating = '灰黑苔'
            coating_note = '苔色灰黑，提示寒盛或热极'

        # 湿度估计（蓝色通道占比）
        moisture_ratio = b_avg / (r_avg + 1) if r_avg > 0 else 0.5
        if moisture_ratio > 0.65:
            wet_dry = '偏润'
            wet_note = '舌面偏润，津液尚足'
        elif moisture_ratio > 0.5:
            wet_dry = '正常'
            wet_note = '舌面润燥适中'
        else:
            wet_dry = '偏燥'
            wet_note = '舌面偏燥，津液受伤'

        return f"""## 🔄 离线舌诊分析（PIL 几何启发式）

> ⚠️ 此为色彩+几何启发式分析，仅供参考。
> 配置 `ZHIPU_API_KEY` 或 `OPENAI_API_KEY` 可启用 AI 多模态精准舌诊。

### 舌质
- **舌色**：{tongue_color}
- **解读**：{body_note}

### 舌苔
- **苔色**：{coating}
- **解读**：{coating_note}

### 津液
- **润燥**：{wet_dry}
- **解读**：{wet_note}

### 图像质量
- 中心区域平均亮度：{bright:.0f}（{_quality_note(bright)}）
- 中心区域像素：{cx1-cx0}×{cy1-cy0}
- 检测模式：tongue（中心 60% 裁剪 + RGB 通道分析）

### 初步结论
基于色彩启发式：**{tongue_color} + {coating} + {wet_dry}**。

### 建议
1. 如有不适，请到正规中医医疗机构面诊
2. 配合脉诊等其他四诊信息综合判断
3. 饮食忌生冷辛辣，保持规律作息

---
_face-ocr-server offline_tongue_analysis · PIL 启发式兜底_"""
    except Exception as e:
        log.warning(f'offline tongue analysis 失败: {e}')
        return f"""## 🔄 舌诊离线分析出错

图像处理异常：{e}
请重试或配置 AI 视觉引擎以获得更准确的分析。"""


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

    # ---- R29-4: /health 真实验证 zhipu（60s 缓存） ----
    # 旧逻辑只看 env 有没有 key 就 true，但实际调用可能 401。
    # 这里真打一发 /models 列表（无 body、3s 超时），只有 2xx 才标 true。
    _ZHIPU_PING_CACHE = {'result': None, 'ts': 0.0}
    _ZHIPU_PING_TTL = 60  # 秒；< 10s 会被刷屏，不调

    @staticmethod
    def ping_zhipu(timeout=3):
        """真打一发智谱 API；返回 True 仅当 2xx。失败/超时返回 False。"""
        if not ZHIPU_API_KEY:
            return False
        try:
            import urllib.request
            req = urllib.request.Request(
                'https://open.bigmodel.cn/api/paas/v4/models',
                headers={'Authorization': 'Bearer ' + ZHIPU_API_KEY},
            )
            with urllib.request.urlopen(req, timeout=timeout) as r:
                ok = 200 <= r.status < 300
                log.info(f'zhipu ping: status={r.status} ok={ok}')
                return ok
        except Exception as e:
            log.warning(f'zhipu ping failed: {e}')
            return False

    @classmethod
    def cached_ping_zhipu(cls):
        """60s 缓存，避免每次 /health 都打网络。"""
        now = time.time()
        if cls._ZHIPU_PING_CACHE['ts'] and now - cls._ZHIPU_PING_CACHE['ts'] < cls._ZHIPU_PING_TTL:
            return cls._ZHIPU_PING_CACHE['result']
        result = cls.ping_zhipu()
        cls._ZHIPU_PING_CACHE.update({'result': result, 'ts': now})
        return result

    # ---- 鉴权（HMAC 时序安全比较） ----
    # R29-2: /api/camera/upload 加 X-API-Key 鉴权
    # CAMERA_API_KEY 优先级最高；未设置则 fail-open 仅开发模式
    _CAMERA_API_KEY = os.environ.get('CAMERA_API_KEY', '').strip()
    _AUTH_FAIL_COUNT = 0  # 单实例计数器（dev 用）

    def _require_camera_auth(self):
        """HMAC 时序安全比对。返回 True=通过 / False=已写 401 响应"""
        key = self._CAMERA_API_KEY
        if not key:
            log.warning('CAMERA_API_KEY 未设置；鉴权 fail-open（仅开发模式）')
            return True
        provided = self.headers.get('X-API-Key', '') or self.headers.get('X-Api-Key', '')
        # hmac.compare_digest 防止计时攻击
        if not provided or not hmac.compare_digest(provided.encode('utf-8'), key.encode('utf-8')):
            Handler._AUTH_FAIL_COUNT += 1
            log.warning(f'camera upload 鉴权失败 #{Handler._AUTH_FAIL_COUNT} from {self.client_address[0]} path={self.path}')
            self._json(401, {
                'ok': False,
                'error': 'auth_required',
                'reason': 'X-API-Key header missing or invalid',
                'detail': '请在请求头提供有效的 X-API-Key（HMAC 时序安全比对失败）',
            })
            return False
        return True

    def do_OPTIONS(self):
        # CORS 预检：放行，不要求鉴权
        self._json(200, {'ok': True})

    def do_GET(self):
        # R311 根路径返回服务信息
        if self.path == '/' or self.path == '':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            info = json.dumps({
                'service': '中医宝鉴·人脸舌诊OCR服务',
                'version': 'v1',
                'port': 8913,
                'endpoints': [
                    '/api/ocr/face - 面诊图像分析',
                    '/api/ocr/tongue - 舌诊图像分析',
                    '/api/ocr/llm_interpret - LLM 辨证解释'
                ],
                'status': 'running'
            }, ensure_ascii=False)
            self.wfile.write(info.encode('utf-8'))
            return
        path = urlparse(self.path).path
        if path in ('/health', '/healthz'):
            engines = {
                'g2claw': bool(G2CLAW_API_KEY),
                'zhipu': Handler.cached_ping_zhipu(),  # R29-4: 真实验证
                'openai': bool(OPENAI_API_KEY),
                'doubao': bool(DOUBAO_API_KEY),
            }
            return self._json(200, {
                'ok': True,
                'service': 'face-ocr-server',
                'port': 8913,
                'engines': engines,
                'pillow': HAVE_PIL,
                'endpoints': [
                    'POST /api/face/analyze  相貌分析',
                    'POST /api/ocr/recognize  通用 OCR',
                    'POST /api/ocr/tcm  中医病历 OCR',
                    'POST /api/camera/upload  桌面固定摄像头采集上传',
                    'GET  /api/camera/health  摄像头健康检查',
                ]
            })
        if path == '/api/camera/health':
            engines = {
                'g2claw': bool(G2CLAW_API_KEY),
                'zhipu': Handler.cached_ping_zhipu(),  # R29-4: 真实验证
                'openai': bool(OPENAI_API_KEY),
                'doubao': bool(DOUBAO_API_KEY),
            }
            return self._json(200, {
                'ok': True,
                'service': 'face-ocr-server',
                'camera_support': True,
                'upload_dir': '/tmp/face-captures/',
                'max_size': '20MB',
                'engines': engines,
                'pillow': HAVE_PIL,
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
            # R205: 支持 mode=wangzhen（中医望诊 prompt）
            req_mode = data.get('mode') or 'face'
            if req_mode == 'wangzhen':
                prompt = data.get('prompt') or WANGZHEN_PROMPT
                resp_mode = 'wangzhen'
            else:
                prompt = data.get('prompt') or FACE_PROMPT
                resp_mode = 'face'
            engine = call_vision_with_fallback(b64, prompt)
            if engine:
                return self._json(200, {
                    'ok': True,
                    'mode': resp_mode,
                    'engine': engine['engine'],
                    'analysis': engine['text'],
                    'inspect': inspect,
                    'elapsed_ms': int((time.time() - t0) * 1000),
                })
            # 全部 AI 引擎失败 → 离线 PIL 启发式分析（不依赖任何 API）
            if req_mode == 'wangzhen':
                text = offline_wangzhen_analysis(b64, inspect)
            else:
                text = offline_face_analysis(b64, inspect)
            return self._json(200, {
                'ok': True,
                'mode': resp_mode,
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

    def do_PUT(self):
        """multipart/form-data 文件上传（桌面固定摄像头采集场景）"""
        path = urlparse(self.path).path
        if path != '/api/camera/upload':
            return self._json(404, {'error': 'not_found', 'path': path})
        # R29-2: 鉴权先于一切业务逻辑
        if not self._require_camera_auth():
            return  # 401 响应已由 _require_camera_auth 写出
        try:
            ctype = self.headers.get('Content-Type', '')
            if 'multipart/form-data' not in ctype:
                return self._json(400, {'error': 'bad_content_type', 'detail': '需要 multipart/form-data'})
            length = int(self.headers.get('Content-Length', '0'))
            if length <= 0 or length > 20 * 1024 * 1024:
                return self._json(400, {'error': 'bad_length', 'detail': f'需 0 < length <= 20MB, got {length}'})
            body = self.rfile.read(length)
            # 粗略解析 multipart（不依赖 cgi.FieldStorage，零依赖）
            import re
            m = re.search(rb'boundary=([^;\s]+)', ctype.encode())
            if not m:
                return self._json(400, {'error': 'no_boundary'})
            boundary = b'--' + m.group(1)
            parts = body.split(boundary)
            image_b64 = None
            meta = {}
            for part in parts:
                if b'Content-Disposition' not in part or b'name="file"' not in part:
                    if b'name=' in part:
                        # 抓取额外字段（mode/deviceId/timestamp）
                        nm = re.search(rb'name="([^"]+)"', part)
                        if nm:
                            try:
                                val = part.split(b'\r\n\r\n', 1)[1].rstrip(b'\r\n--').decode('utf-8', 'ignore')
                                meta[nm.group(1).decode()] = val
                            except Exception:
                                pass
                    continue
                # 找二进制 image data
                idx = part.find(b'\r\n\r\n')
                if idx < 0: continue
                data = part[idx+4:]
                # 去掉结尾的 \r\n--boundary 收尾标记（精确去掉后缀，不误删有效数据）
                if data.endswith(b'\r\n'):
                    data = data[:-2]
                if data.endswith(b'--'):
                    data = data[:-2]
                if len(data) < 100: continue
                # 先 base64 编码 + inspect 校验，通过后才落盘（R29-3 fix）
                image_b64 = base64.b64encode(data).decode()
                meta['_bytes'] = len(data)
                # 立刻 inspect：不合法图片不落盘
                pre_inspect = inspect_image(image_b64, mode='face')
                if not pre_inspect.get('valid', True):
                    note = pre_inspect.get('note', '') or '; '.join(pre_inspect.get('issues', []))
                    log.info(f"rejected invalid image: {len(data)} bytes, note={note}")
                    image_b64 = None  # 丢弃引用
                    continue
                # inspect 通过 → 才写盘
                ts = int(time.time() * 1000)
                os.makedirs('/tmp/face-captures', exist_ok=True)
                fp = f'/tmp/face-captures/{ts}_{int.from_bytes(os.urandom(2), "big")}.jpg'
                with open(fp, 'wb') as f:
                    f.write(data)
                meta['_saved_to'] = fp
            if not image_b64:
                return self._json(400, {'error': 'no_file', 'detail': '未找到有效 file 字段（或图片校验未通过）'})
            # inspect 已在上传阶段完成，复用结果
            mode_in = meta.get('mode', 'face')
            inspect = inspect_image(image_b64, mode=mode_in)
            t0 = time.time()
            if mode_in == 'face':
                prompt = FACE_PROMPT
            elif mode_in == 'tongue':
                prompt = TONGUE_PROMPT
            elif mode_in == 'ocr-tcm':
                prompt = OCR_PROMPT_TCM
            else:
                prompt = OCR_PROMPT_GENERIC
            engine = call_vision_with_fallback(image_b64, prompt) if any([G2CLAW_API_KEY, ZHIPU_API_KEY, OPENAI_API_KEY, DOUBAO_API_KEY]) else None
            result = {
                'ok': True,
                'mode': mode_in,
                'device_id': meta.get('deviceId', ''),
                'timestamp': meta.get('timestamp', ''),
                'saved_to': meta.get('_saved_to'),
                'bytes': meta.get('_bytes'),
                'inspect': inspect,
                'elapsed_ms': int((time.time() - t0) * 1000),
            }
            if engine:
                result['engine'] = engine['engine']
                result['analysis'] = engine['text']
            elif mode_in == 'face':
                result['engine'] = 'offline-pil'
                result['analysis'] = offline_face_analysis(image_b64, inspect)
                result['llm'] = llm_interpret('面诊', result['analysis'])
            elif mode_in == 'tongue':
                result['engine'] = 'offline-pil'
                result['analysis'] = offline_tongue_analysis(image_b64, inspect)
                result['llm'] = llm_interpret('舌诊', result['analysis'])
            else:
                result['engine'] = 'offline-pil'
                result['text'] = offline_ocr(image_b64, mode_in, inspect)
            return self._json(200, result)
        except Exception as e:
            log.exception('camera upload error')
            return self._json(500, {'error': 'camera_upload_failed', 'detail': str(e)})

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