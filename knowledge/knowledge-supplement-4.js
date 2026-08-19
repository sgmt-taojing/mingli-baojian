const KNOWLEDGE_SUPPLEMENT_LIUREN = {
    // 十二天将详解
    tianjiang: [
        { name: "贵人", sky: "己", nature: "吉", wuxing: "土", meaning: "领导、贵人、助力、提拔", 
          things: "官位、文书、婚姻、宴会、宝物", 
          body: "头、心、口", direction: "丑", desc: "贵人主统驭，百事吉利。贵人临日辰，事事有人帮。" },
        { name: "螣蛇", sky: "丁", nature: "凶", wuxing: "火", meaning: "虚惊、怪异、缠绕、变化",
          things: "灾祸、梦寐、鬼神、惊恐、火灾",
          body: "目、血脉", direction: "巳", desc: "螣蛇主虚惊怪异，临命多梦魇缠绕，喜生不喜克。" },
        { name: "朱雀", sky: "丙", nature: "凶", wuxing: "火", meaning: "口舌、文书、信息、火光",
          things: "书信、消息、官非、考试、争吵",
          body: "舌、面部", direction: "午", desc: "朱雀主口舌文书。旺相则主文采声名，休囚则主口舌是非。" },
        { name: "六合", sky: "乙", nature: "吉", wuxing: "木", meaning: "和合、婚姻、合作、中介",
          things: "婚姻、和约、交易、中介、聚会",
          body: "手、足", direction: "卯", desc: "六合主和合喜庆，百事通达。临财则求财顺利。" },
        { name: "勾陈", sky: "戊", nature: "凶", wuxing: "土", meaning: "争斗、田产、勾连、迟滞",
          things: "田宅、官司、牢狱、拖延、争斗",
          body: "脾胃、肌肉", direction: "辰", desc: "勾陈主勾连停滞，临宅主田产纠纷，临官主官事牵缠。" },
        { name: "青龙", sky: "甲", nature: "吉", wuxing: "木", meaning: "财喜、升迁、贵人、权威",
          things: "升迁、钱财、婚姻、吉庆、文书",
          body: "肝、筋", direction: "寅", desc: "青龙主财喜，百事皆吉。临官有升迁之喜，临财得厚利。" },
        { name: "天空", sky: "戊", nature: "凶", wuxing: "土", meaning: "虚诈、空亡、欺诈、孤独",
          things: "空约、欺诈、孤寡、僧道、虚伪",
          body: "鼻、腹", direction: "戌", desc: "天空主虚诈不实。百事若逢天空，多为有名无实。" },
        { name: "白虎", sky: "庚", nature: "凶", wuxing: "金", meaning: "凶丧、疾病、血光、权威",
          things: "死亡、疾病、血灾、官灾、权威",
          body: "肺、牙齿", direction: "申", desc: "白虎主凶丧刑戮。旺相为武职威权，休囚为死丧疾病。" },
        { name: "太常", sky: "己", nature: "吉", wuxing: "土", meaning: "宴席、衣冠、孝服、赏赐",
          things: "喜宴、官服、祭祀、赏赐、印信",
          body: "脾、肉", direction: "未", desc: "太常主宴饮赏赐。百事宜配合，主喜庆之事。" },
        { name: "玄武", sky: "壬", nature: "凶", wuxing: "水", meaning: "奸盗、隐私、奸邪、诡诈",
          things: "偷盗、遗失、奸邪、隐私、阴谋",
          body: "肾、耳", direction: "亥", desc: "玄武主盗贼奸邪。临财防盗失，临命主隐私。" },
        { name: "太阴", sky: "辛", nature: "吉", wuxing: "金", meaning: "阴私、恩泽、妇女、细腻",
          things: "妇人、阴私、暗助、细心、秘事",
          body: "肺、皮肤", direction: "酉", desc: "太阴主阴私暗助。临妇人有喜，临事得暗中相助。" },
        { name: "天后", sky: "壬", nature: "吉", wuxing: "水", meaning: "恩泽、尊贵、妇德、庇护",
          things: "皇后、母亲、恩惠、保护、柔顺",
          body: "肾、血", direction: "子", desc: "天后主恩泽庇护。临命有长辈呵护，临宅家庭和睦。" }
    ],
    
    // 九宗门详解
    jiu_zongmen: [
        { name: "贼克法", type: "上克下·下贼上", char: "元首、始入", 
          desc: "四课中一课克另外一课：上克下为元首课，下克上为始入课。这是最根本的起课方法。" },
        { name: "比用法", type: "俱比·不比", char: "比用",
          desc: "四课中两课克日干，取与日干阴阳相同者为用。日干的阴阳属性决定用哪个天将。" },
        { name: "涉害法", type: "涉害·深浅", char: "涉害",
          desc: "四课中多课克日，或没有明确的克，取受克最多、涉害最深者为用。" },
        { name: "遥克法", type: "神遥克日·日遥克神", char: "蒿矢、弹射",
          desc: "四课中无克，取神遥克日为蒿矢课，日遥克神为弹射课。" },
        { name: "昴星法", type: "虎视、冬蛇掩目", char: "昴星",
          desc: "四课无克且无遥克，以酉（昴星）所临的宫位决定初传。" },
        { name: "别责法", type: "两课不备", char: "别责",
          desc: "四课不备（只有三课）时，阳日取日干合神来定初传，阴日取支前三合。" },
        { name: "八专法", type: "八专课", char: "八专",
          desc: "四课中干支同一位，只有两课。阳日顺数三辰，阴日逆数三辰。" },
        { name: "伏吟法", type: "伏吟", char: "伏吟",
          desc: "天地盘相同，天地伏吟。主静不主动，宜守不宜攻。" },
        { name: "返吟法", type: "返吟", char: "返吟",
          desc: "天地盘相对冲，天地返吟。主动不主静，宜攻不宜守。" }
    ],
    
    // 三传要义
    sanchuan: {
        overview: "三传是六壬占断的核心。初传为事之始，中传为事之中，末传为事之终。",
        chuchuan: "初传（发用）—— 事情的开端、最初的动念。吉凶初显，百事之始。旺相则吉，休囚则凶。",
        zhongchuan: "中传—— 事情的发展、中间过程。承上启下，转折之机。吉凶变化全在于此。",
        mochuan: "末传—— 事情的结局、最终归宿。百事之终，吉凶落处。末传吉则终吉，末传凶则终凶。"
    },
    
    // 占断要领
    zhenduan_yaoling: [
        "先定课体，再审三传。课体主大势，三传主过程。",
        "天将吉凶为辅助，不可喧宾夺主。青龙未必全吉，白虎未必全凶。",
        "旺相休囚为关键：旺相者吉更吉、凶减半；休囚者吉减半、凶更凶。",
        "日干为主，天盘为客。日干与天将的关系决定事情的亲疏远近。",
        "神煞不可忽视。天乙贵人、禄神、驿马、桃花等神煞可修正判断。",
        "时令入课：占断须结合四季五行旺衰。",
        "空亡入课：主事不成或虚象。填实后方应。"
    ]
};

if (typeof window !== 'undefined') { window.KNOWLEDGE_SUPPLEMENT_LIUREN = KNOWLEDGE_SUPPLEMENT_LIUREN; }