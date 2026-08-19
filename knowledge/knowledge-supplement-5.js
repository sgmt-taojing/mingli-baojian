const KNOWLEDGE_SUPPLEMENT_QIMEN = {
    // 八门详解
    bamen: [
        { name: "休门", wuxing: "水", direction: "北", nature: "吉", season: "冬", 
          meaning: "休养生息，万事顺遂。宜休息、修养、婚嫁、经商。" },
        { name: "生门", wuxing: "土", direction: "东北", nature: "大吉", season: "冬春之交",
          meaning: "生机勃勃，百事兴旺。宜求财、开业、上任、嫁娶。" },
        { name: "伤门", wuxing: "木", direction: "东", nature: "凶", season: "春",
          meaning: "损伤破败，百事不利。宜捕捉、索债，忌出行、经商。" },
        { name: "杜门", wuxing: "木", direction: "东南", nature: "小凶", season: "春夏之交",
          meaning: "闭塞不通，宜守不宜攻。宜隐遁、藏匿、防灾，忌出行。" },
        { name: "景门", wuxing: "火", direction: "南", nature: "小吉", season: "夏",
          meaning: "光明景象，文书通达。宜献策、考试、出游。" },
        { name: "死门", wuxing: "土", direction: "西南", nature: "大凶", season: "夏秋之交",
          meaning: "死丧刑戮，百事大凶。宜刑戮、葬丧，忌一切吉事。" },
        { name: "惊门", wuxing: "金", direction: "西", nature: "凶", season: "秋",
          meaning: "惊恐扰攘，口舌是非。宜捕捉、诉讼，忌出行。" },
        { name: "开门", wuxing: "金", direction: "西北", nature: "大吉", season: "秋冬之交",
          meaning: "万事亨通，百事顺利。宜开业、上任、旅行、婚嫁。" }
    ],
    
    // 九星详解
    jiuxing: [
        { name: "天蓬星", wuxing: "水", nature: "大凶", meaning: "破财、盗贼、口舌", good_for: "守固、捕捉" },
        { name: "天芮星", wuxing: "土", nature: "凶", meaning: "疾病、灾祸、暗昧", good_for: "交友、聚会" },
        { name: "天冲星", wuxing: "木", nature: "小吉", meaning: "震奋、进取、突击", good_for: "出征、复仇" },
        { name: "天辅星", wuxing: "木", nature: "大吉", meaning: "教化、文雅、辅佐", good_for: "求学、考试、文书" },
        { name: "天禽星", wuxing: "土", nature: "大吉", meaning: "中正、厚德、平安", good_for: "百事皆宜" },
        { name: "天心星", wuxing: "金", nature: "大吉", meaning: "智慧、良医、谋划", good_for: "医疗、策划、治疗" },
        { name: "天柱星", wuxing: "金", nature: "小凶", meaning: "毁折、口舌、损坏", good_for: "固守、隐藏" },
        { name: "天任星", wuxing: "土", nature: "小吉", meaning: "厚重、承载、守信", good_for: "建筑、土地" },
        { name: "天英星", wuxing: "火", nature: "小凶", meaning: "火警、华丽、虚名", good_for: "庆典、宴会" }
    ],
    
    // 八神详解
    bashen: [
        { name: "值符", nature: "大吉", meaning: "最高的贵人，统领全局", desc: "值符所在方位最吉利，百事可用。" },
        { name: "螣蛇", nature: "凶", meaning: "虚惊怪异，缠绕反复", desc: "螣蛇所临方位多应梦中之事、虚幻之事。" },
        { name: "太阴", nature: "吉", meaning: "暗中相助，隐秘谋划", desc: "太阴所临方位宜暗中办事，秘而不宣。" },
        { name: "六合", nature: "大吉", meaning: "和合喜庆，多方合作", desc: "六合所临方位最适合婚嫁、签约、合作。" },
        { name: "白虎", nature: "凶", meaning: "凶灾血光，武力权柄", desc: "白虎所临方位有血光之灾，但武职反宜。" },
        { name: "玄武", nature: "凶", meaning: "奸盗欺诈，暗昧不明", desc: "玄武所临方位防盗贼、防小人是非。" },
        { name: "九地", nature: "吉", meaning: "稳固持久，厚积薄发", desc: "九地所临方位宜固守、屯兵、收藏。" },
        { name: "九天", nature: "大吉", meaning: "高远扬兵，进取扩张", desc: "九天所临方位宜主动出击、出征、开拓。" }
    ],
    
    // 奇门遁甲排盘步骤（简化版）
    paipan_steps: [
        "1. 确定时间：选择起盘的农历年月日时。",
        "2. 排天盘：根据节气确定阴阳局，顺排六仪三奇。",
        "3. 排地盘：确定局数，阴遁逆排、阳遁顺排。",
        "4. 排八门：休生死伤杜景惊开，按旬首宫顺排。",
        "5. 排九星：蓬芮冲辅禽心柱任英，按天盘宫位飞布。",
        "6. 排八神：值符螣蛇太阴六合白虎玄武九地九天，随值符宫顺排。",
        "7. 取用神：根据事类选择天盘/地盘/八门/九星/八神进行断局。"
    ],
    
    // 奇门用神选取
    yongshen: {
        "求财": "看生门、休门、戊（财星）的方位，生门旺相主财旺。",
        "求官": "看开门、值符的方位，开门临值符为最佳。",
        "求学": "看天辅星、景门、丁奇的方位。",
        "婚姻": "看六合、乙庚方位，六合旺相主良缘。",
        "疾病": "看天芮星、死门的方位，生门对着病星为最好。",
        "出行": "看开门、值符、天马方位。",
        "诉讼": "看惊门、白虎、庚的方位。",
        "求医": "看天心星、乙奇方位，天心旺相遇乙奇为良医。"
    }
};

if (typeof window !== 'undefined') { window.KNOWLEDGE_SUPPLEMENT_QIMEN = KNOWLEDGE_SUPPLEMENT_QIMEN; }