#!/usr/bin/env python3
"""经文生僻字注音器（R763）：对咒文/经文段落中的生僻字加拼音
用法：python3 jingwen-pinyin.py <输入文件> <输出文件>
"""
import sys

# 经文高频字读音表
DICT = {
    '怛':'dá','哆':'duō','唎':'lì','羯':'jié','烁':'shuò','钵':'bō',
    '埵':'duǒ','诃':'hē','迦':'jiā','唵':'ōng','皤':'pó','曳':'yè',
    '驮':'tuó','楞':'léng','墀':'chí','酰':'xiān','咩':'miē','嘇':'shěn',
    '嚧':'lū','娑':'suō','阇':'shé','佉':'qū','槃':'pán','耆':'qí',
    '醍':'tí','醐':'hú','酪':'lào','酥':'sū','磋':'cuō','琢':'zhuó',
    '淬':'cuì','凋':'diāo','祛':'qū','腧':'shù','捻':'niǎn','掣':'chè',
    '瑙':'nǎo','砗':'chē','磲':'qú','瑛':'yīng','鹫':'jiù','窟':'kū',
    '啰':'là','伽':'qié','穆':'mù','瑟':'sè','跋':'bá','漫':'màn',
    '逝':'shì','孕':'yùn','侄':'zhí','夷':'yí','遮':'zhē','隶':'lì',
    '殿':'diàn','喻':'yù','艺':'yì','蒙':'méng','谨':'jǐn','输':'shū',
    '朋':'péng','写':'xiě','伊':'yī','帝':'dì','卢':'lú','室':'shì',
    '俱':'jù','度':'dù','弥':'mí','陀':'tuó','僧':'sēng','呼':'hū',
    '舍':'shè','悉':'xī','苏':'sū','都':'dū','蒙':'méng','驮':'tuó',
    '钵':'bō','瑜':'yú','迦':'jiā','昙':'tán','穗':'suì','霄':'xiāo',
    '稽':'qī','首':'shǒu','忏':'chàn','悔':'huǐ','悭':'qiān','嫉':'jí',
    '谄':'chǎn','浊':'zhuó','漏':'lòu','钝':'dùn','闇':'àn','瞽':'gǔ',
    '聋':'lóng','瘖':'yīn','哑':'yǎ','躄':'bì','背':'bèi','偻':'lóu',

    '捭':'bǎi','阖':'hé','豫':'yù','焉':'yān','蝼':'lóu','螟':'míng',
    '稷':'jì','燔':'fán','瘳':'chōu','觞':'shāng','觇':'chān','坻':'chí',
    '隳':'huī','黩':'dú','悫':'què','懋':'mào','戢':'jí','翕':'xī',
    '赜':'zé','赀':'zī','窾':'kuǎn','导':'dǎo','竫':'jìng','讷':'nè',
    '蘧':'qú','璆':'qiú','磬':'qìng','硁':'kēng','蒉':'kuì','涸':'hé',
    '巇':'xī','罅':'xià','涧':'jiàn','隙':'xì','萌':'méng','揣':'chuǎi','摩':'mó','忤':'wǔ',
    '揵':'jiàn','辖':'xiá','掣':'chè','缪':'miù','黏':'nián','饵':'ěr','讥':'jī','谤':'bàng',
    '箝':'qián','钩':'gōu','恃':'shì','盛':'shèng','兑':'duì','枢':'shū','慧':'huì',
    '悸':'jì','慑':'shè',
    '躁':'zào','湍':'tuān','濯':'zhuó','豫':'yù',
}

# 词组读音（优先匹配）
WORDS = {'南无':'nā mó','般若':'bō rě','涅槃':'niè pán','菩提':'pú tí',
         '阎浮':'yán fú','刹土':'chà tǔ','劫数':'jié shù','伽蓝':'qié lán',
         '袈裟':'jiā shā','比丘':'bǐ qiū','比丘尼':'bǐ qiū ní','罗汉':'luó hàn',
         '偈':'jì','昙花':'tán huā','琉璃':'liú lí','摩尼':'mó ní',
         '真言':'zhēn yán','明王':'míng wáng','忉利':'dāo lì','兜率':'dōu shuài',
         '阿耨多罗':'ā nòu duō luó','三藐三菩提':'sān miǎo sān pú tí',
         '捭阖':'bǎi hé','翕张':'xī zhāng','窾理':'kuǎn lǐ','抵巇':'dǐ xī','罅隙':'xià xì','内揵':'nèi jiàn','飞箝':'fēi qián','忤合':'wǔ hé','损兑':'sǔn duì','转圆':'zhuǎn yuán','分威':'fēn wēi','散势':'sàn shì','养志':'yǎng zhì','盛神':'shèng shén','实意':'shí yì'}

# 常用字不注音
COMMON = set('的一是了我不人在他有这上们来到时大地为子中你说生国年着就那和要她出也得里后自以会家可下而过天去能对小多然于心学么之都好看起发当没成只如事把还用第样道想作种开美总从无情己面最女但现前些所同日手又行意动方期它头经长儿回位分爱老因很给名法间斯知世什两次使身者被高已亲其进此话常与活正感见音字文说金刚诵念持修戒定慧慈悲喜舍观音菩萨佛门禅止观心病医方术息气用廿一遍建议日主信义礼智')

def annotate(text):
    out = []
    i, n = 0, len(text)
    noted = set()  # R802：同字只注首次
    while i < n:
        # 词组优先
        matched = False
        for w, py in WORDS.items():
            if text.startswith(w, i):
                if w not in noted:
                    out.append(f'{w}（{py}）')
                    noted.add(w)
                else:
                    out.append(w)
                i += len(w)
                matched = True
                break
        if matched:
            continue
        ch = text[i]
        if '\u4e00' <= ch <= '\u9fff' and ch in DICT and ch not in COMMON:
            if ch not in noted:
                out.append(f'{ch}（{DICT[ch]}）')
                noted.add(ch)
            else:
                out.append(ch)
        else:
            out.append(ch)
        i += 1
    return ''.join(out)

def normalize_nums(line):
    # R782：修持段数字中文化；R786：半角括号+空格变体也统一
    for pat in ['(建议21遍)', '(建议 21 遍)', '(建议 21遍)', '(建议21 遍)', '（建议21遍）', '(建议二十一遍)']:
        line = line.replace(pat, '（建议二十一遍）')
    return line

def is_jingwen(line):
    # R786：半角括号/冒号变体兼容
    return (line.startswith('📿') or ('遍）' in line and '：' in line) or ('遍)' in line and '：' in line)
            or ('遍:' in line and '：' in line) or ('遍：' in line))

def main():
    src, dst = sys.argv[1], sys.argv[2]
    text = open(src).read()
    lines = text.split('\n')
    result = []
    for line in lines:
        if is_jingwen(line):
            line = normalize_nums(line)
            if '：' in line:
                head, body = line.split('：', 1)
                result.append(f'{head}：{annotate(body)}')
            else:
                result.append(annotate(line))
        else:
            result.append(line)
    open(dst, 'w').write('\n'.join(result))
    print(f'OK -> {dst}')

if __name__ == '__main__':
    main()
