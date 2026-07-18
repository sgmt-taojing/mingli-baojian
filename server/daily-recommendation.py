#!/usr/bin/env python3
"""
乾元命理宝鉴 · 每日推荐生成器
综合黄历+天气+神仙吉日+儒道佛智慧+节气节日，生成每日推送内容
"""

import json
import urllib.request
import datetime
import sys
import os

try:
    from lunarcalendar import Converter, Solar
    def get_lunar_date(year, month, day):
        s = Solar(year, month, day)
        l = Converter.Solar2Lunar(s)
        month_str = f'闰{l.month}月' if l.isleap else f'{l.month}月'
        return f'农历{l.year}年{month_str}{l.day}日'
except ImportError:
    def get_lunar_date(year, month, day):
        return f'农历'

# === 1. 干支计算 ===
TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
DI_ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']
SHENG_XIAO = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪']
WU_XING_GAN = ['木','木','火','火','土','土','金','金','水','水']
WU_XING_ZHI = ['水','土','木','木','土','火','火','土','金','金','土','水']

# 节气表 (公历近似日期)
JIEQI_DATES = [
    (1,6,'小寒'),(1,20,'大寒'),(2,4,'立春'),(2,19,'雨水'),
    (3,6,'惊蛰'),(3,21,'春分'),(4,5,'清明'),(4,20,'谷雨'),
    (5,6,'立夏'),(5,21,'小满'),(6,6,'芒种'),(6,21,'夏至'),
    (7,7,'小暑'),(7,23,'大暑'),(8,8,'立秋'),(8,23,'处暑'),
    (9,8,'白露'),(9,23,'秋分'),(10,8,'寒露'),(10,23,'霜降'),
    (11,7,'立冬'),(11,22,'小雪'),(12,7,'大雪'),(12,22,'冬至')
]

# 建除十二神
JIAN_CHU = ['建','除','满','平','定','执','破','危','成','收','开','闭']

# 二十八星宿
XING_XIU = [
    '角','亢','氐','房','心','尾','箕',  # 东方青龙
    '斗','牛','女','虚','危','室','壁',  # 北方玄武
    '奎','娄','胃','昴','毕','觜','参',  # 西方白虎
    '井','鬼','柳','星','张','翼','轸'   # 南方朱雀
]

# 冲煞表
CHONG_MAP = {'子':'午','丑':'未','寅':'申','卯':'酉','辰':'戌','巳':'亥',
             '午':'子','未':'丑','申':'寅','酉':'卯','戌':'辰','亥':'巳'}
SHA_MAP = {'子':'南','丑':'东','寅':'北','卯':'西','辰':'南','巳':'东',
           '午':'北','未':'西','申':'南','酉':'东','戌':'北','亥':'西'}

# 彭祖百忌
PENGZU = {
    '甲':'甲不开仓，财物耗散',
    '乙':'乙不栽植，千株不长',
    '丙':'丙不修灶，必见灾殃',
    '丁':'丁不剃头，头必生疮',
    '戊':'戊不受田，田主不祥',
    '己':'己不破券，二比并亡',
    '庚':'庚不经络，织机虚张',
    '辛':'辛不合酱，主人不尝',
    '壬':'壬不汲水，更难提防',
    '癸':'癸不词讼，理弱敌强'
}

# 喜神方位（按日干）
XISHEN_FANG = {
    '甲':'艮（东北）','乙':'乾（西北）','丙':'坤（西南）','丁':'离（正南）',
    '戊':'巽（东南）','己':'艮（东北）','庚':'乾（西北）','辛':'坤（西南）',
    '壬':'离（正南）','癸':'巽（东南）'
}

# 财神方位（按日干）
CAISHEN_FANG = {
    '甲':'东北','乙':'东北','丙':'正西','丁':'正西',
    '戊':'正北','己':'正北','庚':'正东','辛':'正东',
    '壬':'正南','癸':'正南'
}

# 福神方位
FUSHEN_FANG = {
    '甲':'东南','乙':'东南','丙':'正东','丁':'正东',
    '戊':'正北','己':'正北','庚':'西南','辛':'西南',
    '壬':'西北','癸':'西北'
}

# 黄黑道（按日干支起青龙）
HUANG_HEI = ['青龙(吉)','明堂(吉)','天刑(凶)','朱雀(凶)','金匮(吉)','天德(吉)',
             '白虎(凶)','玉堂(吉)','天牢(凶)','玄武(凶)','司命(吉)','勾陈(凶)']

def get_jieqi(month, day):
    jq = '冬至'
    for m, d, name in JIEQI_DATES:
        if month == m and day >= d:
            jq = name
        elif month > m:
            jq = name
    return jq

def solar_to_ganzhi(year, month, day):
    """简化版公历转干支"""
    # 计算日柱（以1900-01-31甲辰日为基准）
    base = datetime.date(1900, 1, 31)
    today = datetime.date(year, month, day)
    diff = (today - base).days
    day_gan_idx = (diff + 0) % 10  # 1900-01-31是甲辰日，甲=0
    day_zhi_idx = (diff + 0) % 12  # 辰=4
    
    # 年柱（立春定年）
    year_gan_idx = (year - 4) % 10
    year_zhi_idx = (year - 4) % 12
    # 立春前用上一年
    lichun = datetime.date(year, 2, 4)
    if today < lichun:
        year_gan_idx = (year - 5) % 10
        year_zhi_idx = (year - 5) % 12
    
    # 月柱（节气定月）
    jieqi = get_jieqi(month, day)
    month_map = {
        '立春':0,'雨水':0,'惊蛰':1,'春分':1,'清明':2,'谷雨':2,
        '立夏':3,'小满':3,'芒种':4,'夏至':4,'小暑':5,'大暑':5,
        '立秋':6,'处暑':6,'白露':7,'秋分':7,'寒露':8,'霜降':8,
        '立冬':9,'小雪':9,'大雪':10,'冬至':10,'小寒':11,'大寒':11
    }
    mi = month_map.get(jieqi, 0)
    # 月干：五虎遁
    year_gan_for_month = year_gan_idx
    if today < lichun:
        year_gan_for_month = (year_gan_idx) % 10
    month_gan_idx = (year_gan_for_month * 2 + mi + 2) % 10
    month_zhi_idx = mi
    
    return {
        'year_gan': TIAN_GAN[year_gan_idx],
        'year_zhi': DI_ZHI[year_zhi_idx],
        'year_shengxiao': SHENG_XIAO[year_zhi_idx],
        'month_gan': TIAN_GAN[month_gan_idx],
        'month_zhi': DI_ZHI[month_zhi_idx],
        'day_gan': TIAN_GAN[day_gan_idx],
        'day_zhi': DI_ZHI[day_zhi_idx],
        'day_gan_idx': day_gan_idx,
        'day_zhi_idx': day_zhi_idx,
    }

def get_yi_ji(ganzhi):
    """根据建除十二神和星宿推断宜忌"""
    day_zhi = ganzhi['day_zhi']
    month_zhi = ganzhi['month_zhi']
    
    # 建除十二神：月支为建，依次排列
    month_zhi_idx = DI_ZHI.index(month_zhi)
    day_zhi_idx = DI_ZHI.index(day_zhi)
    jianchu_idx = (day_zhi_idx - month_zhi_idx) % 12
    jianchu_name = JIAN_CHU[jianchu_idx]
    
    # 各建除神的宜忌
    yi_ji_map = {
        '建': {'yi': '祭祀 祈福 出行 赴任', 'ji': '动土 开仓'},
        '除': {'yi': '沐浴 扫舍 祭祀 解除', 'ji': '嫁娶 求医'},
        '满': {'yi': '祭祀 祈福 补垣 塞穴', 'ji': '嫁娶 安葬'},
        '平': {'yi': '修造 动土 平治道涂', 'ji': '祭祀 祈福'},
        '定': {'yi': '祭祀 祈福 冠笄 嫁娶', 'ji': '出行 词讼'},
        '执': {'yi': '捕捉 畋猎 祭祀', 'ji': '开市 立券'},
        '破': {'yi': '求医疗病 破屋坏垣', 'ji': '嫁娶 开市 安葬'},
        '危': {'yi': '祭祀 祈福 安床', 'ji': '登山 乘船'},
        '成': {'yi': '祭祀 祈福 开市 立券 交易', 'ji': '词讼 出行'},
        '收': {'yi': '祭祀 纳财 收纳', 'ji': '出行 安葬'},
        '开': {'yi': '祭祀 祈福 求嗣 赴任', 'ji': '安葬 动土'},
        '闭': {'yi': '筑堤 塞穴 祭祀', 'ji': '开市 出行 嫁娶'}
    }
    
    data = yi_ji_map.get(jianchu_name, {'yi': '祭祀', 'ji': '诸事不宜'})
    
    # 星宿
    base_date = datetime.date(1900, 1, 31)
    today = datetime.date.today()
    diff = (today - base_date).days
    xiu_idx = diff % 28
    xiu_name = XING_XIU[xiu_idx]
    
    return {
        'jianchu': jianchu_name,
        'xingxiu': xiu_name,
        'yi': data['yi'],
        'ji': data['ji']
    }

def get_huanghei(ganzhi):
    """黄黑道"""
    day_gan_idx = ganzhi['day_gan_idx']
    day_zhi_idx = ganzhi['day_zhi_idx']
    # 青龙从日支起
    # 简化：以日干支序数取
    idx = (day_zhi_idx) % 12
    return HUANG_HEI[idx]

def get_shichen_jixiong(ganzhi):
    """12时辰吉凶（简化版）"""
    day_gan_idx = ganzhi['day_gan_idx']
    # 日干起时辰吉凶（简化）
    patterns = {
        0: ['凶','吉','平','吉','平','凶','吉','平','平','吉','平','凶'],  # 甲
        1: ['平','凶','吉','平','凶','吉','平','吉','凶','平','吉','平'],  # 乙
        2: ['吉','平','凶','吉','平','平','凶','吉','平','凶','平','吉'],  # 丙
        3: ['凶','吉','平','平','吉','凶','吉','平','吉','平','凶','吉'],  # 丁
        4: ['平','平','吉','凶','平','吉','凶','平','吉','凶','吉','平'],  # 戊
        5: ['吉','平','凶','吉','平','平','吉','凶','平','吉','平','凶'],  # 己
        6: ['平','凶','吉','平','吉','平','凶','吉','平','凶','吉','平'],  # 庚
        7: ['凶','吉','平','吉','平','凶','吉','平','吉','平','凶','吉'],  # 辛
        8: ['吉','平','平','凶','吉','平','平','吉','凶','平','吉','平'],  # 壬
        9: ['平','吉','凶','平','吉','平','凶','吉','平','吉','平','凶'],  # 癸
    }
    pattern = patterns.get(day_gan_idx, patterns[0])
    shichen_names = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']
    return [(shichen_names[i], pattern[i]) for i in range(12)]

# === 2. 神仙吉日查询 ===
DEITIES = [
    # 佛教
    {'name':'释迦牟尼佛','birthday':'四月初八','type':'佛','intro':'佛教创始人，觉悟真理，普度众生。供奉香花灯水果，诵《心经》可开智慧。'},
    {'name':'观世音菩萨','birthday':'九月十九','type':'佛','intro':'大慈大悲救苦救难，凡遇困难诚心念诵「南无观世音菩萨」即可得感应。二月十九出家、六月十九成道。'},
    {'name':'文殊菩萨','birthday':'四月初四','type':'佛','intro':'智慧第一，手持宝剑斩烦恼，骑青狮表威猛。学子考试前祈拜尤为灵验。'},
    {'name':'普贤菩萨','birthday':'二月廿一','type':'佛','intro':'行愿第一，骑白象表稳重建行。象征实践与行动力。'},
    {'name':'地藏王菩萨','birthday':'七月三十','type':'佛','intro':'「地狱不空誓不成佛」，超度亡灵、保佑先祖。孝亲祭祖之首选。'},
    {'name':'弥勒佛','birthday':'正月初一','type':'佛','intro':'未来佛，笑口常开，大肚能容。象征欢喜包容，新年祈福主佛。'},
    {'name':'药师佛','birthday':'九月二十九','type':'佛','intro':'东方琉璃世界教主，消灾延寿。身体不适时祈拜，诵「南无药师琉璃光如来」。'},
    # 道教
    {'name':'太上老君','birthday':'二月十五','type':'道','intro':'道教最高神三清之一道德天尊化身，著《道德经》五千言。修道之本，清静无为。'},
    {'name':'玉皇大帝','birthday':'正月初九','type':'道','intro':'天庭最高统治者，统御万天。正月九日凌驾宝殿，各路神仙朝贺。祈福消灾最灵。'},
    {'name':'王母娘娘','birthday':'三月初三','type':'道','intro':'女仙之首，掌管蟠桃仙园。三月三蟠桃会，求长寿求姻缘皆可。'},
    {'name':'财神赵公明','birthday':'三月十五','type':'道','intro':'正财神，骑黑虎，执银鞭。求财祈福，生意人必拜。正月初五迎财神最灵。'},
    {'name':'土地公','birthday':'二月初二','type':'道','intro':'土地之神，保一方平安。二月二龙抬头，祭土地公求丰收。日常可拜，家门平安。'},
    {'name':'月老','birthday':'八月十五','type':'道','intro':'月下老人，主管姻缘。手持红线牵姻缘，求姻缘者诚心拜之。中秋月圆夜最灵。'},
    {'name':'文昌帝君','birthday':'二月十三','type':'道','intro':'掌管功名禄位，学子考试、升职加薪均可祈拜。供桂花、芹菜，诵文昌咒。'},
    {'name':'关圣帝君','birthday':'五月十三','type':'道','intro':'关公武财神，忠义化身。镇宅辟邪、招财护运，商铺常供奉。'},
    {'name':'真武大帝','birthday':'三月初三','type':'道','intro':'北方玄武之神，镇水辟邪。武当山主神，修道炼真。'},
    # 儒家
    {'name':'至圣先师孔子','birthday':'八月廿七','type':'儒','intro':'万世师表，删诗书定礼乐。尊师重道、求学升学可拜。供芹菜(勤学)、葱(聪明)。'},
    {'name':'亚圣孟子','birthday':'四月初二','type':'儒','intro':'继孔子之后儒家第二圣人，主张性善论、仁政。诵读《孟子》养浩然正气。'},
]

def lunar_to_solar_month_day(lunar_str):
    """将农历日期字符串转为月日，用于对比"""
    # 简化处理：返回农历月日
    import re
    m = re.match(r'正月初(\d+)', lunar_str)
    if m: return (1, int(m.group(1)))
    m = re.match(r'正月(\d+)', lunar_str)
    if m: return (1, int(m.group(1)))
    m = re.match(r'二月(初)?(\d+)', lunar_str)
    if m: return (2, int(m.group(2)))
    m = re.match(r'三月(初)?(\d+)', lunar_str)
    if m: return (3, int(m.group(2)))
    m = re.match(r'四月(初)?(\d+)', lunar_str)
    if m: return (4, int(m.group(2)))
    m = re.match(r'五月(初)?(\d+)', lunar_str)
    if m: return (5, int(m.group(2)))
    m = re.match(r'六月(初)?(\d+)', lunar_str)
    if m: return (6, int(m.group(2)))
    m = re.match(r'七月(初)?(\d+)', lunar_str)
    if m: return (7, int(m.group(2)))
    m = re.match(r'八月(初)?(\d+)', lunar_str)
    if m: return (8, int(m.group(2)))
    m = re.match(r'九月(初)?(\d+)', lunar_str)
    if m: return (9, int(m.group(2)))
    m = re.match(r'十月(初)?(\d+)', lunar_str)
    if m: return (10, int(m.group(2)))
    m = re.match(r'十一月(初)?(\d+)', lunar_str)
    if m: return (11, int(m.group(2)))
    m = re.match(r'十二月(初)?(\d+)', lunar_str)
    if m: return (12, int(m.group(2)))
    m = re.match(r'(\d+)月(\d+)', lunar_str)
    if m: return (int(m.group(1)), int(m.group(2)))
    return None

def check_deity_birthday(month, day):
    """检查今天是否是某位神仙的诞辰（简化版，用公历近似农历）"""
    matches = []
    for d in DEITIES:
        result = lunar_to_solar_month_day(d['birthday'])
        if result and result[0] == month and result[1] == day:
            matches.append(d)
    return matches

# === 3. 天气获取 ===
def get_weather(city="Jinan"):
    try:
        url = f"http://wttr.in/{city}?format=%c+%t+%h+%w&lang=zh"
        req = urllib.request.Request(url, headers={'User-Agent': 'curl'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read().decode('utf-8').strip()
        # Parse: ☀️ +23°C 57% ↗14km/h
        parts = data.split()
        condition_emoji = parts[0] if len(parts) > 0 else ''
        temp = parts[1] if len(parts) > 1 else ''
        humidity = parts[2] if len(parts) > 2 else ''
        wind = parts[3] if len(parts) > 3 else ''
        # 天气英文转中文
        WEATHER_CN = {
            '☀️': '晴', '⛅': '多云', '☁️': '阴', '🌧️': '小雨', '🌧': '雨',
            '⛈️': '雷阵雨', '🌨️': '雪', '❄️': '雪', '🌫️': '雾', ' haze': '霾',
            '🌦️': '阵雨', '🌧️🌧️': '大雨', '☀️☀️': '晴',
        }
        condition_cn = WEATHER_CN.get(condition_emoji, condition_emoji)
        # 如果emoji没匹配到，尝试从raw文本判断
        raw_lower = data.lower()
        if 'rain' in raw_lower or 'drizzle' in raw_lower:
            condition_cn = '雨'
        elif 'snow' in raw_lower:
            condition_cn = '雪'
        elif 'fog' in raw_lower or 'mist' in raw_lower or 'haze' in raw_lower:
            condition_cn = '雾'
        elif 'cloud' in raw_lower:
            condition_cn = '多云'
        elif 'clear' in raw_lower or 'sunny' in raw_lower:
            condition_cn = '晴'
        elif 'thunder' in raw_lower:
            condition_cn = '雷阵雨'
        elif condition_cn == condition_emoji and condition_emoji:
            condition_cn = condition_emoji  # 保留emoji
        return {
            'condition': condition_cn,
            'temp': temp,
            'humidity': humidity,
            'wind': wind,
            'raw': data
        }
    except Exception as e:
        return {'condition': '晴', 'temp': '+22°C', 'humidity': '60%', 'wind': '5km/h', 'raw': str(e)}

# === 4. 节气节日 ===
SOLAR_TERMS_INFO = {
    '立春': '春之始也，万物复苏。宜踏青迎春，忌杀伐。民间有"咬春"习俗，吃春饼春卷。',
    '雨水': '天降甘霖，润泽万物。宜育苗播种，忌动土迁居。',
    '惊蛰': '春雷初响，蛰虫始振。宜驱虫除秽，忌嫁娶。',
    '春分': '昼夜均分，阴阳相半。宜祭祀祈福，平衡身心。',
    '清明': '气清景明，扫墓祭祖。宜踏青植树，忌探病。',
    '谷雨': '雨生百谷，润苗助长。宜种移栽，忌远行。',
    '立夏': '夏之始也，气温渐升。宜清淡饮食，忌辛辣油腻。',
    '小满': '麦粒渐满，将熟未熟。宜静心养性，忌急躁。',
    '芒种': '有芒之谷可种，农忙时节。宜勤勉，忌懒散。',
    '夏至': '日长至极，阳气最盛。宜午间小憩，忌熬夜。',
    '小暑': '天气炎热，尚未极热。宜消暑避热，忌暴晒。',
    '大暑': '一年最热，酷暑难当。宜饮绿豆汤，忌辛燥。',
    '立秋': '秋之始也，暑去凉来。宜润燥养肺，忌寒凉。',
    '处暑': '暑气止也，天气转凉。宜调整作息，忌贪凉。',
    '白露': '露凝而白，秋意渐浓。宜添衣保暖，忌露腹。',
    '秋分': '昼夜均分，秋色正浓。宜赏月品蟹，忌悲伤。',
    '寒露': '露寒欲凝，气温骤降。宜足浴暖身，忌秋冻过度。',
    '霜降': '初霜降临，草木黄落。宜进补御寒，忌生冷。',
    '立冬': '冬之始也，万物收藏。宜温补养藏，忌出汗过多。',
    '小雪': '始降雪花，天地肃穆。宜温养肾气，忌寒凉。',
    '大雪': '雪盛天寒，冰封万里。宜暖炉围坐，忌远行。',
    '冬至': '阴极阳生，一阳来复。宜吃饺子汤圆，忌嫁娶出行。"冬至大如年"。',
    '小寒': '寒气渐盛，尚未极寒。宜温补，忌寒凉。',
    '大寒': '一年最冷，寒至极点。宜暖食温补，忌外出受寒。',
}

# 法定节日
HOLIDAYS = {
    (1,1): '元旦',
    (2,14): '情人节',
    (3,8): '妇女节',
    (3,12): '植树节',
    (4,1): '愚人节',
    (5,1): '劳动节',
    (5,4): '青年节',
    (6,1): '儿童节',
    (7,1): '建党节',
    (8,1): '建军节',
    (9,10): '教师节',
    (10,1): '国庆节',
    (12,25): '圣诞节',
}

# === 5. 儒道佛智慧库 ===
WISDOM = {
    '儒': [
        {'text': '己所不欲，勿施于人。', 'source': '《论语·卫灵公》', 'meaning': '自己不愿承受的事，不要强加于人。'},
        {'text': '君子和而不同，小人同而不和。', 'source': '《论语·子路》', 'meaning': '君子能与他人和谐相处但保持独立见解。'},
        {'text': '知者不惑，仁者不忧，勇者不惧。', 'source': '《论语·子罕》', 'meaning': '智者明理不迷惑，仁者无私不忧愁，勇者无畏惧。'},
        {'text': '不患人之不己知，患不知人也。', 'source': '《论语·学而》', 'meaning': '不怕别人不了解自己，只怕自己不了解别人。'},
        {'text': '三人行，必有我师焉。', 'source': '《论语·述而》', 'meaning': '与多人同行，必定有值得我学习的人。'},
        {'text': '穷则独善其身，达则兼济天下。', 'source': '《孟子·尽心上》', 'meaning': '困顿时修养自身，显达时造福天下。'},
        {'text': '天行健，君子以自强不息。', 'source': '《周易·乾卦》', 'meaning': '天道运行刚健不息，君子应效法自强。'},
        {'text': '地势坤，君子以厚德载物。', 'source': '《周易·坤卦》', 'meaning': '大地厚重承载万物，君子应宽厚包容。'},
    ],
    '道': [
        {'text': '上善若水，水善利万物而不争。', 'source': '《道德经》第八章', 'meaning': '最高境界的善如同水，滋养万物而不争抢。'},
        {'text': '道法自然。', 'source': '《道德经》第二十五章', 'meaning': '大道遵循自然规律，不强求不造作。'},
        {'text': '知人者智，自知者明。', 'source': '《道德经》第三十三章', 'meaning': '了解别人是智慧，认识自己才是真明。'},
        {'text': '千里之行，始于足下。', 'source': '《道德经》第六十四章', 'meaning': '千里远的路从脚下开始，大事从小处做起。'},
        {'text': '祸兮福之所倚，福兮祸之所伏。', 'source': '《道德经》第五十八章', 'meaning': '祸福相依转化，顺境不忘形逆境不绝望。'},
        {'text': '柔弱胜刚强。', 'source': '《道德经》第三十六章', 'meaning': '柔弱能胜过刚强，以柔克刚是大道。'},
        {'text': '致虚极，守静笃。', 'source': '《道德经》第十六章', 'meaning': '达到极致的虚空，坚守深沉的宁静。'},
        {'text': '大成若缺，其用不弊。', 'source': '《道德经》第四十五章', 'meaning': '最完美的东西看似有缺憾，但功用永不衰竭。'},
    ],
    '佛': [
        {'text': '一切有为法，如梦幻泡影。', 'source': '《金刚经》', 'meaning': '世间一切现象皆如梦境幻影，不必执着。'},
        {'text': '色不异空，空不异色。', 'source': '《心经》', 'meaning': '物质与空性不二，现象与本质统一。'},
        {'text': '应无所住而生其心。', 'source': '《金刚经》', 'meaning': '心不执着于任何事物，自然生起清净心。'},
        {'text': '凡所有相，皆是虚妄。', 'source': '《金刚经》', 'meaning': '一切表象都是虚幻不实的，不要被表象迷惑。'},
        {'text': '不忘初心，方得始终。', 'source': '《华严经》', 'meaning': '不忘记最初的发心，才能坚持到最后。'},
        {'text': '诸恶莫作，众善奉行。', 'source': '《增一阿含经》', 'meaning': '不做一切恶事，行一切善事。'},
        {'text': '自净其意，是诸佛教。', 'source': '《法句经》', 'meaning': '净化自己的心念，这就是诸佛的教导。'},
        {'text': '若知前世因，今生受者是；若知来世果，今生作者是。', 'source': '《因果经》', 'meaning': '现在的境遇是过去行为的结果，未来的命运取决于现在的作为。'},
    ]
}

# 五行对应关系全量表
WUXING_MAP = {
    '木': {
        'colors': ['绿','青','翠'],
        'numbers': [3, 8],
        'directions': ['东','东南'],
        'foods': ['酸味','绿色蔬菜','柑橘','芒枣'],
        'organs': ['肝','胆','目','筋'],
        'occupations': ['教育','文化','出版','服装','园艺','木材','家具'],
        'materials': ['棉麻','木质饰品','竹制品'],
        'seasons': ['春'],
        'tastes': ['酸'],
    },
    '火': {
        'colors': ['红','紫','橙','粉'],
        'numbers': [2, 7],
        'directions': ['南'],
        'foods': ['苦味','红色食物','辣椒','红豆'],
        'organs': ['心','小肠','舌','脉'],
        'occupations': ['IT','电子','电力','照明','餐饮','美容','娱乐'],
        'materials': ['丝质','红色饰品','紫水晶'],
        'seasons': ['夏'],
        'tastes': ['苦'],
    },
    '土': {
        'colors': ['黄','棕','咖','卡其'],
        'numbers': [5, 0],
        'directions': ['中','东北','西南'],
        'foods': ['甜味','黄色食物','土豆','南瓜','小米'],
        'organs': ['脾','胃','口','肉'],
        'occupations': ['房地产','建筑','农业','陶瓷','石材','仓储'],
        'materials': ['陶瓷','玉石','水晶'],
        'seasons': ['四季'],
        'tastes': ['甘'],
    },
    '金': {
        'colors': ['白','金','银','灰'],
        'numbers': [4, 9],
        'directions': ['西','西北'],
        'foods': ['辛味','白色食物','白萝卜','梨','大蒜'],
        'organs': ['肺','大肠','鼻','皮毛'],
        'occupations': ['金融','机械','汽车','五金','珠宝','法律','军事'],
        'materials': ['金银饰品','金属手表','铜器'],
        'seasons': ['秋'],
        'tastes': ['辛'],
    },
    '水': {
        'colors': ['黑','蓝','深灰'],
        'numbers': [1, 6],
        'directions': ['北'],
        'foods': ['咸味','黑色食物','黑豆','海带','紫菜'],
        'organs': ['肾','膀胱','耳','骨'],
        'occupations': ['物流','水产','旅游','酒店','贸易','酒类','清洁'],
        'materials': ['珍珠','黑曜石','蓝色宝石'],
        'seasons': ['冬'],
        'tastes': ['咸'],
    },
}

# 日主五行→喜用五行→穿搭推荐
YONGSHEN_DRESS = {
    '木': {'colors': '绿/青/翠色系', 'materials': '棉麻、木质手串', 'accessories': '绿幽灵水晶、翡翠'},
    '火': {'colors': '红/紫/橙色系', 'materials': '丝质衣物', 'accessories': '红玛瑙、紫水晶'},
    '土': {'colors': '黄/棕/卡其色系', 'materials': '陶瓷饰品', 'accessories': '黄水晶、玉石'},
    '金': {'colors': '白/金/银色系', 'materials': '金属手表、金银手镯', 'accessories': '白水晶、银饰'},
    '水': {'colors': '黑/蓝/深灰色系', 'materials': '珍珠饰品', 'accessories': '黑曜石、海蓝宝'},
}

def get_clothing_guide_by_wuxing(day_gan_ele, xi_yong_ele=None):
    """根据日主五行和喜用神五行推荐穿搭"""
    base = YONGSHEN_DRESS.get(day_gan_ele, YONGSHEN_DRESS['土'])
    if xi_yong_ele and xi_yong_ele in YONGSHEN_DRESS:
        xi = YONGSHEN_DRESS[xi_yong_ele]
        return f"👕 日主{day_gan_ele}，喜用{xi_yong_ele}：宜穿{base['colors']}或{xi['colors']}，{base['materials']}，配{xi['accessories']}"
    return f"👕 日主{day_gan_ele}：宜穿{base['colors']}，{base['materials']}，配{base['accessories']}"

# 穿衣指南（根据天气温度+五行）
def get_clothing_guide(temp_str, day_gan_ele='土', xi_yong_ele=None):
    try:
        temp_c = int(temp_str.replace('+','').replace('°C','').replace('C',''))
    except:
        temp_c = 22
    
    # 温度建议
    if temp_c <= 5:
        temp_advice = '羽绒服/厚棉衣，围巾手套必备，注意防寒保暖'
    elif temp_c <= 12:
        temp_advice = '厚外套/风衣，内搭毛衣，早晚温差大注意添衣'
    elif temp_c <= 18:
        temp_advice = '薄外套/夹克，内搭长袖，舒适为主'
    elif temp_c <= 25:
        temp_advice = '轻薄长袖或短袖+薄外套，灵活搭配'
    elif temp_c <= 30:
        temp_advice = '短袖T恤/薄衫，透气舒适，注意防晒'
    else:
        temp_advice = '轻薄透气衣物，帽子墨镜，做好防晒措施'
    
    # 五行穿搭建议
    wuxing_advice = get_clothing_guide_by_wuxing(day_gan_ele, xi_yong_ele)
    
    return f'🧥 {temp_advice}\n👤 {wuxing_advice}'

# 方位指南
def get_direction_guide(ganzhi, yi_ji):
    """根据宜忌和吉神方位给出行动方位建议"""
    yi_text = yi_ji['yi']
    # 喜神方位
    xishen = XISHEN_FANG.get(ganzhi['day_gan'], '东北')
    caishen = CAISHEN_FANG.get(ganzhi['day_gan'], '正北')
    fushen = FUSHEN_FANG.get(ganzhi['day_gan'], '东南')
    
    guide = f"""
🧭 今日方位指南：
  • 喜神方位：{xishen}（祈福求喜宜向此方）
  • 财神方位：{caishen}（求财谈生意宜向此方）
  • 福神方位：{fushen}（祈福求福宜向此方）
  • 出行大吉方：{xishen.split('（')[0]}"""
    if '出行' in yi_text or '赴任' in yi_text:
        guide += '\n  • ✅ 今日宜出行，可放心外出'
    elif '出行' in yi_ji['ji']:
        guide += '\n  • ⚠️ 今日忌出行，如必须外出，向喜神方位绕行'
    return guide

# === 6. 生成每日推荐 ===
def get_daily_knowledge(ganzhi, jieqi, month, day):
    """根据干支、节气、日期生成每日命理知识推送"""
    day_gan = ganzhi['day_gan']
    day_zhi = ganzhi['day_zhi']
    day_ganzhi = day_gan + day_zhi
    
    # 60甲子纳音表
    nayin_table = {
        '甲子':'海中金','乙丑':'海中金','丙寅':'炉中火','丁卯':'炉中火',
        '戊辰':'大林木','己巳':'大林木','庚午':'路旁土','辛未':'路旁土',
        '壬申':'剑锋金','癸酉':'剑锋金','甲戌':'山头火','乙亥':'山头火',
        '丙子':'涧下水','丁丑':'涧下水','戊寅':'城墙土','己卯':'城墙土',
        '庚辰':'白蜡金','辛巳':'白蜡金','壬午':'杨柳木','癸未':'杨柳木',
        '甲申':'泉中水','乙酉':'泉中水','丙戌':'屋上土','丁亥':'屋上土',
        '戊子':'霹雳火','己丑':'霹雳火','庚寅':'松柏木','辛卯':'松柏木',
        '壬辰':'长流水','癸巳':'长流水','甲午':'沙中金','乙未':'沙中金',
        '丙申':'山下火','丁酉':'山下火','戊戌':'平地木','己亥':'平地木',
        '庚子':'壁上土','辛丑':'壁上土','壬寅':'金箔金','癸卯':'金箔金',
        '甲辰':'覆灯火','乙巳':'覆灯火','丙午':'天河水','丁未':'天河水',
        '戊申':'大驿土','己酉':'大驿土','庚戌':'钗钏金','辛亥':'钗钏金',
        '壬子':'桑柘木','癸丑':'桑柘木','甲寅':'大溪水','乙卯':'大溪水',
        '丙辰':'沙中土','丁巳':'沙中土','戊午':'天上火','己未':'天上火',
        '庚申':'石榴木','辛酉':'石榴木','壬戌':'大海水','癸亥':'大海水'
    }
    
    nayin_meaning = {
        '海中金': '金蕴藏于大海之中，深藏不露，有才而不显。主内涵丰富，需遇火炼方能成器。',
        '炉中火': '炉中之火，需要木来生助。主热情而有节制，内心炽热外表温和。',
        '大林木': '茂密森林之木，枝繁叶茂。主格局宏大，有包容力，能成就大事业。',
        '路旁土': '道路两旁之土，承载万物。主踏实勤恳，默默奉献。',
        '剑锋金': '刀剑之锋刃，刚锐无比。主果断刚毅，有决断力和执行力。',
        '山头火': '山头之野火，火势猛烈但短暂。主性格热烈，爆发力强。',
        '涧下水': '山涧溪流之水，清澈纯净。主性情温和纯洁，内心细腻。',
        '城墙土': '城墙之土，厚重坚固。主性格坚毅，有守护意识。',
        '白蜡金': '白蜡之金，温润而有光泽。主外表温文，内在有品质。',
        '杨柳木': '杨柳之木，柔韧飘逸。主性格柔顺，适应力强。',
        '泉中水': '泉眼涌出之水，清澈甘甜。主才思泉涌，智慧不竭。',
        '屋上土': '房屋顶上之土，遮风挡雨。主有庇护他人的能力。',
        '霹雳火': '雷电霹雳之火，瞬间爆发。主性格刚烈，有爆发力。',
        '松柏木': '松柏常青之木，岁寒不凋。主品格高洁，意志坚定。',
        '长流水': '江河长流之水，奔流不息。主志向远大，有恒心。',
        '沙中金': '沙中淘出之金。主需经磨砺方成大器。',
        '山下火': '山下之火，火势温和。主性格温和，不张扬。',
        '平地木': '平原上生长之木。主低调朴实，根基扎实。',
        '壁上土': '墙壁之土，隔断内外。主有界限感，有原则。',
        '金箔金': '贴在器物上的金箔。主外表光鲜，有审美才能。',
        '覆灯火': '灯盏中之火。主温和有恒心，不求大放异彩但求持久温暖。',
        '天河水': '天上之水，如雨露降下。主格局高远，有济世之心。',
        '大驿土': '驿站大道之土。主交际广泛，见识多广。',
        '钗钏金': '首饰钗钏之金。主外表精美，有审美天赋。',
        '桑柘木': '桑树柘木。主务实有用，能创造实际价值。',
        '大溪水': '大溪奔流之水。主性情开朗，行动力强。',
        '沙中土': '沙中混合之土。主根基不稳，需后天努力。',
        '天上火': '天上太阳之火。主格局宏大，光明磊落。',
        '石榴木': '石榴之木。主多才多艺，成果丰硕。',
        '大海水': '大海之水，浩瀚无际。主心胸宽广，格局宏大。'
    }
    
    # 1. 节气优先
    jieqi_knowledge = {
        '立春': {'tag':'节气','title':'立春开运指南 —— 万物复苏，新年伊始','summary':'立春为二十四节气之首，标志着新一年开始。立春日宜祭太岁、换新衣、向东方出行。忌吵架、看病、赖床。'},
        '立夏': {'tag':'节气','title':'立夏开运指南 —— 夏季开始，火气渐旺','summary':'立夏节气，火气渐旺。宜养心安神、清淡饮食。八字中以火为用神者此节气运势转旺。'},
        '立秋': {'tag':'节气','title':'立秋开运指南 —— 秋季开始，金气渐旺','summary':'立秋节气，金气渐旺。宜养肺护呼吸、收敛神气。八字中以金为用神者此节气运势转旺。'},
        '立冬': {'tag':'节气','title':'立冬开运指南 —— 冬季开始，水气渐旺','summary':'立冬节气，水气渐旺。宜养肾藏精、早睡晚起。八字中以水为用神者此节气运势转旺。'},
        '冬至': {'tag':'节气','title':'冬至节气 —— 阴极阳生，一阳来复','summary':'冬至白昼最短，阴气至极，此后阳气回升。宜进补养生、祭祖祈福。'},
        '春分': {'tag':'节气','title':'春分节气 —— 昼夜平分，阴阳平衡','summary':'春分昼夜等长，阴阳平衡。宜调养身心、祈福纳祥。'},
        '秋分': {'tag':'节气','title':'秋分节气 —— 昼夜平分，秋高气爽','summary':'秋分昼夜等长，秋高气爽。宜调养身心、赏月祈福。'},
        '夏至': {'tag':'节气','title':'夏至节气 —— 阳极阴生，否极泰来','summary':'夏至白昼最长，阳气至极。宜养心静气、避免剧烈运动。'},
    }
    if jieqi and jieqi in jieqi_knowledge:
        return jieqi_knowledge[jieqi]
    if jieqi:
        return {'tag':'节气','title':f'{jieqi}节气 —— 顺时养生，趋吉避凶','summary':f'今日为{jieqi}节气。节气交替之际，气场变化，宜静心养生、顺应天时。'}
    
    # 2. 文昌日（甲乙日）
    if day_gan in ('甲','乙'):
        return {'tag':'文昌星','title':'文昌星提升学业运 —— 今日甲乙日文昌当令','summary':'甲乙日为文昌星当令之日。文昌主学问、考试、文书。今日宜读书学习、考试面试、提交重要文件。'}
    
    # 3. 桃花日（子午卯酉日）
    taohua_desc = {'子':'水桃花，主智慧型桃花','午':'火桃花，主热情型桃花','卯':'木桃花，主温柔型桃花','酉':'金桃花，主果断型桃花'}
    if day_zhi in ('子','午','卯','酉'):
        return {'tag':'桃花星','title':f'桃花星与感情 —— 今日{day_zhi}日桃花当令','summary':f'{day_zhi}日为桃花星当令之日。{taohua_desc.get(day_zhi,"")}。今日宜社交、相亲、表白。'}
    
    # 4. 驿马日（寅申巳亥日）
    if day_zhi in ('寅','申','巳','亥'):
        return {'tag':'驿马星','title':f'驿马星主出行变动 —— 今日{day_zhi}日驿马当令','summary':f'{day_zhi}日为驿马星当令之日。驿马主出行、迁居、变动。今日宜出行、搬家、出差。'}
    
    # 5. 纳音日
    nayin = nayin_table.get(day_ganzhi)
    if nayin and nayin in nayin_meaning:
        return {'tag':'纳音','title':f'{day_ganzhi}纳音「{nayin}」解读','summary':f'今日为{day_ganzhi}日，纳音为「{nayin}」。{nayin_meaning[nayin]}'}
    
    # 6. 默认通用知识
    general = [
        {'tag':'十神','title':'十神系统 —— 八字分析的灵魂','summary':'十神将日主与其他天干地支的关系分为十种类型，每个对应不同的性格特征和人生领域。'},
        {'tag':'五行','title':'五行生克 —— 命理学的基础框架','summary':'五行即金木水火土，相生相克构成命理分析的核心逻辑。五行平衡则命局好。'},
        {'tag':'格局','title':'八字格局 —— 判断命局高低的关键','summary':'格局以月令为提纲，分为正格和变格。正格有八：正官、七杀、正财、偏财、食神、伤官、正印、偏印。'},
        {'tag':'神煞','title':'神煞系统 —— 命理分析的辅助工具','summary':'神煞包括天乙贵人、文昌、桃花、驿马、华盖等。五行为主，神煞为辅。'},
        {'tag':'合冲','title':'合冲刑害 —— 地支互动的核心机制','summary':'合主和谐，冲主冲突，刑主刑罚，害主暗害。优先级：合力>冲力>刑力>害力。'},
    ]
    return general[day % len(general)]


def generate_daily_recommendation():
    now = datetime.datetime.now()
    year, month, day = now.year, now.month, now.day
    weekday = ['周一','周二','周三','周四','周五','周六','周日'][now.weekday()]
    
    # 干支
    ganzhi = solar_to_ganzhi(year, month, day)
    yi_ji = get_yi_ji(ganzhi)
    huanghei = get_huanghei(ganzhi)
    shichen = get_shichen_jixiong(ganzhi)
    
    # 天气
    weather = get_weather()
    
    # 神仙吉日
    deities_today = check_deity_birthday(month, day)
    
    # 节气
    jieqi = get_jieqi(month, day)
    jieqi_info = SOLAR_TERMS_INFO.get(jieqi, '')
    
    # 节日
    holiday = HOLIDAYS.get((month, day), '')
    
    # 智慧（每日轮换儒道佛，加入日期偏移避免连续重复）
    wisdom_type = ['儒','道','佛'][(day + now.month) % 3]
    wisdom_list = WISDOM[wisdom_type]
    # 用年月日组合偏移，避免连续三天推送同一类内容
    wisdom_offset = (year * 372 + month * 31 + day) % len(wisdom_list)
    wisdom = wisdom_list[wisdom_offset]
    
    # 穿衣指南（温度+五行）
    day_gan_ele = WU_XING_GAN[TIAN_GAN.index(ganzhi['day_gan'])]
    clothing = get_clothing_guide(weather['temp'], day_gan_ele)
    
    # 方位指南
    direction = get_direction_guide(ganzhi, yi_ji)
    
    # 彭祖百忌
    pengzu = PENGZU.get(ganzhi['day_gan'], '')
    
    # 冲煞
    chong = f'冲{CHONG_MAP.get(ganzhi["day_zhi"],"?")}（{SHENG_XIAO[DI_ZHI.index(CHONG_MAP.get(ganzhi["day_zhi"],"子"))]}）'
    sha = f'煞{SHA_MAP.get(ganzhi["day_zhi"],"?")}'
    
    # 组装消息
    msg = f"""📅 乾元命理宝鉴 · 每日推荐
━━━━━━━━━━━━━━━━━━

⏰ {year}年{month}月{day}日 {weekday}
🌍 阳历：{year}年{month}月{day}日 | {get_lunar_date(year, month, day)}
🏮 {ganzhi['year_gan']}{ganzhi['year_zhi']}年（{ganzhi['year_shengxiao']}年）
🌙 {ganzhi['month_gan']}{ganzhi['month_zhi']}月 · {ganzhi['day_gan']}{ganzhi['day_zhi']}日

━━━ 📋 今日黄历 ━━━

✅ 宜：{yi_ji['yi']}
🚫 忌：{yi_ji['ji']}

📌 建除十二神：{yi_ji['jianchu']}
⭐ 值日星宿：{yi_ji['xingxiu']}宿
☀️ 黄道黑道：{huanghei}
⚔️ 冲煞：{chong} · {sha}
📜 彭祖百忌：{pengzu}
🐾 生肖五行：{ganzhi['year_shengxiao']}（{WU_XING_ZHI[DI_ZHI.index(ganzhi["year_zhi"])]}）· 日支{ganzhi["day_zhi"]}（{WU_XING_ZHI[DI_ZHI.index(ganzhi["day_zhi"])]}）

🧭 喜神：{XISHEN_FANG.get(ganzhi['day_gan'],'东北')}
💰 财神：{CAISHEN_FANG.get(ganzhi['day_gan'],'正北')}
🙏 福神：{FUSHEN_FANG.get(ganzhi['day_gan'],'东南')}

⏰ 时辰吉凶：
{'  '.join([f'{s}:{j}' for s,j in shichen])}
"""

    # 节气
    if jieqi_info:
        msg += f"""
━━━ 🌿 今日节气：{jieqi} ━━━
{jieqi_info}
"""

    # 节日
    if holiday:
        msg += f"""
━━━ 🎉 今日节日：{holiday} ━━━
祝{holiday}快乐！
"""

    # 神仙吉日
    if deities_today:
        msg += "\n━━━ 🙏 今日神仙吉日 ━━━\n"
        for d in deities_today:
            msg += f"\n✨ {d['name']}诞辰（{d['type']}教）\n"
            msg += f"   {d['intro']}\n"
            msg += f"   🎁 供奉建议：香花灯水果\n"
            msg += f"   📿 诵读经文：可念诵相关经文回向\n"

    # 天气（穿衣合并为一条）
    msg += f"""
━━━ 🌤️ 济南天气 ━━━

天气：{weather['condition']} 气温：{weather['temp']} 湿度：{weather['humidity']} 风速：{weather['wind']}
{clothing}
"""

    # 方位指南（去掉重复的财神方位，已在黄历区显示）
    msg += f"""
━━━ 🧭 方位指南 ━━━
  • 喜神方位：{XISHEN_FANG.get(ganzhi['day_gan'],'东北')}（祈福求喜宜向此方）
  • 福神方位：{FUSHEN_FANG.get(ganzhi['day_gan'],'东南')}（祈福求福宜向此方）
  • 出行大吉方：{XISHEN_FANG.get(ganzhi['day_gan'],'东北').split('（')[0]}
"""
    if '出行' in yi_ji['yi'] or '赴任' in yi_ji['yi']:
        msg += '  • ✅ 今日宜出行，可放心外出\n'
    elif '出行' in yi_ji['ji']:
        msg += '  • ⚠️ 今日忌出行，非必要不远行\n'

    # 智慧
    msg += f"""
━━━ 📖 今日{wisdom_type}家智慧 ━━━

「{wisdom['text']}」
—— {wisdom['source']}

💡 白话：{wisdom['meaning']}
"""

    # 口诀推荐
    koujue_tips = [
        '今日宜诵「净心神咒(zhòu)」三遍：太上台星，应变无停。驱邪缚魅(mèi)，保命护身。',
        '今日宜诵「心经」一遍：色不异空，空不异色。色即是空，空即是色。',
        '今日宜诵「清净经」：大道无形，生育天地；大道无名，长养万物。',
        '今日宜静坐冥想15分钟，观呼吸，放杂念，养心神。',
        '今日宜诵读《论语》一章，温故知新，涵养正气。',
    ]
    msg += f"""
━━━ 🧘 今日修行建议 ━━━

{koujue_tips[day % len(koujue_tips)]}
"""

    # 每日命理知识
    daily_knowledge = get_daily_knowledge(ganzhi, jieqi, month, day)
    if daily_knowledge:
        msg += f"""
━━━ 📖 今日命理知识 ━━━

🔖 分类：{daily_knowledge['tag']}

{daily_knowledge['title']}

{daily_knowledge['summary']}
"""

    # 三元九运引导化解
    msg += f"""
━━━ 🌟 三元九运 · 缘主运势提点 ━━━

当前处于下元九运（2024-2043年），离火当令，火旺之世。
缘主日主癸水，九运火旺水弱，宜补水助身、金白水清。

💡 化解建议：
  • 佩戴金属饰物（金银手镯、铜牌）增强金水之气
  • 居家北方摆放鱼缸或水景，补水润身
  • 穿搭以黑蓝白为主色调，水金相生
  • 多近水边散步，滋养命局

🛒 化解物品可前往「商城」选购，专业开光法器助缘主转运纳福。

💪 缘主命局根基稳固，大运乙丑(43-52岁)冠带期，渐入佳境。日主癸水虽在九运稍弱，但乙木伤官泄秀，才华可展。保持正念，善积福德，前途光明可期！
"""

    # 免责声明
    msg += """
━━━━━━━━━━━━━━━━━━

⚠️ 以上内容仅供文化交流与生活参考，不构成任何决策依据。如有重大事项，请结合实际情况理性判断。

🙏 祝缘主今日吉祥如意，平安喜顺！"""

    return msg

if __name__ == '__main__':
    msg = generate_daily_recommendation()
    print(msg)
    print(f"\n\n--- 字符数: {len(msg)} ---")
