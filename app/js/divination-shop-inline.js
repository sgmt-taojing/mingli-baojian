

// === Extracted from divination-shop.html
        // 商品数据（30个商品）
        const products = [
            {
                id: 1,
                name: "黑曜石手串",
                price: 128,
                category: "bracelet",
                element: ["water"],
                effect: ["protection"],
                material: "crystal",
                rating: 4.8,
                emoji: "📿",
                description: "辟邪化煞，吸收负能量",
                suitable: "八字喜水者、经常夜出者、需要辟邪保平安者",
                reviews: [
                    { author: "张***", rating: 5, comment: "戴了一周，感觉睡眠质量变好了，不再做噩梦。" },
                    { author: "李***", rating: 4, comment: "做工精细，能量感很强，推荐。" }
                ]
            },
            {
                id: 2,
                name: "黄水晶手串",
                price: 198,
                category: "bracelet",
                element: ["earth"],
                effect: ["wealth"],
                material: "crystal",
                rating: 4.9,
                emoji: "💎",
                description: "招财旺运，主偏财",
                suitable: "八字喜土者、经商人士、求财者",
                reviews: [
                    { author: "王***", rating: 5, comment: "戴了三个月，真的有横财运！" },
                    { author: "陈***", rating: 5, comment: "光泽很好，越戴越亮。" }
                ]
            },
            {
                id: 3,
                name: "翡翠吊坠",
                price: 368,
                category: "bracelet",
                element: ["wood"],
                effect: ["peace"],
                material: "jade",
                rating: 4.7,
                emoji: "🍀",
                description: "平安吉祥，养人养身",
                suitable: "八字喜木者、需要保平安者、注重养生者",
                reviews: [
                    { author: "刘***", rating: 4, comment: "玉质温润，戴着很舒服。" }
                ]
            },
            {
                id: 4,
                name: "紫檀佛珠",
                price: 258,
                category: "bracelet",
                element: ["wood"],
                effect: ["peace"],
                material: "wood",
                rating: 4.8,
                emoji: "📿",
                description: "修行养性，安神静心",
                suitable: "八字喜木者、修行者、注重精神修养者",
                reviews: [
                    { author: "释***", rating: 5, comment: "小叶紫檀，香味浓郁，很好的佛珠。" }
                ]
            },
            {
                id: 5,
                name: "铜葫芦",
                price: 88,
                category: "ornament",
                element: ["metal"],
                effect: ["health", "protection"],
                material: "metal",
                rating: 4.6,
                emoji: "🏺",
                description: "化解病气，保健康",
                suitable: "八字喜金者、家中有病人者、需要化病气者",
                reviews: [
                    { author: "赵***", rating: 4, comment: "放在卧室后，家人感冒次数减少了。" }
                ]
            },
            {
                id: 6,
                name: "泰山石敢当",
                price: 168,
                category: "ornament",
                element: ["earth"],
                effect: ["protection"],
                material: "metal",
                rating: 4.7,
                emoji: "⛰️",
                description: "镇宅化煞，辟邪挡灾",
                suitable: "八字喜土者、新居入住者、需要镇宅者",
                reviews: [
                    { author: "孙***", rating: 5, comment: "放在客厅，家里氛围好多了。" }
                ]
            },
            {
                id: 7,
                name: "五帝钱",
                price: 138,
                category: "ornament",
                element: ["metal"],
                effect: ["wealth", "protection"],
                material: "metal",
                rating: 4.8,
                emoji: "🪙",
                description: "招财辟邪，化煞旺运",
                suitable: "八字喜金者、需要招财化煞者",
                reviews: [
                    { author: "周***", rating: 5, comment: "真品五帝钱，能量很强。" }
                ]
            },
            {
                id: 8,
                name: "文昌塔",
                price: 218,
                category: "ornament",
                element: ["metal", "wood"],
                effect: ["study"],
                material: "metal",
                rating: 4.9,
                emoji: "🗼",
                description: "旺文昌，助学业考试",
                suitable: "八字喜金或木者、学生、考生、从事文职者",
                reviews: [
                    { author: "吴***", rating: 5, comment: "孩子高考前买的，考上了理想大学！" }
                ]
            },
            {
                id: 9,
                name: "貔貅摆件",
                price: 458,
                category: "ornament",
                element: ["metal"],
                effect: ["wealth"],
                material: "metal",
                rating: 4.8,
                emoji: "🦁",
                description: "招财进宝，只进不出",
                suitable: "八字喜金者、经商者、求财者",
                reviews: [
                    { author: "郑***", rating: 5, comment: "铜貔貅很有分量，摆在收银台，生意好了很多。" }
                ]
            },
            {
                id: 10,
                name: "麒麟摆件",
                price: 388,
                category: "ornament",
                element: ["earth"],
                effect: ["peace"],
                material: "metal",
                rating: 4.7,
                emoji: "🦄",
                description: "送子招财，镇宅保平安",
                suitable: "八字喜土者、求子者、需要镇宅者",
                reviews: [
                    { author: "冯***", rating: 5, comment: "工艺精美，寓意很好。" }
                ]
            },
            {
                id: 11,
                name: "龙龟摆件",
                price: 328,
                category: "ornament",
                element: ["water"],
                effect: ["protection"],
                material: "metal",
                rating: 4.6,
                emoji: "🐢",
                description: "化解太岁，镇宅化煞",
                suitable: "八字喜水者、犯太岁者、需要化煞者",
                reviews: [
                    { author: "陈***", rating: 4, comment: "2026年犯太岁，买了龙龟化解。" }
                ]
            },
            {
                id: 12,
                name: "八卦镜",
                price: 78,
                category: "ornament",
                element: ["metal"],
                effect: ["protection"],
                material: "metal",
                rating: 4.5,
                emoji: "🪞",
                description: "化煞挡灾，反射煞气",
                suitable: "八字喜金者、住宅犯煞者",
                reviews: [
                    { author: "褚***", rating: 4, comment: "凸镜化煞效果好。" }
                ]
            },
            {
                id: 13,
                name: "桃木剑",
                price: 158,
                category: "ornament",
                element: ["wood"],
                effect: ["protection"],
                material: "wood",
                rating: 4.7,
                emoji: "⚔️",
                description: "辟邪驱鬼，斩断烂桃花",
                suitable: "八字喜木者、需要辟邪者、想斩断烂桃花者",
                reviews: [
                    { author: "卫***", rating: 5, comment: "桃木剑很有灵气，挂在门后辟邪。" }
                ]
            },
            {
                id: 14,
                name: "朱砂手串",
                price: 148,
                category: "bracelet",
                element: ["fire"],
                effect: ["protection"],
                material: "copter",
                rating: 4.8,
                emoji: "📿",
                description: "辟邪化煞，镇惊安神",
                suitable: "八字喜火者、容易受惊者、需要辟邪者",
                reviews: [
                    { author: "蒋***", rating: 5, comment: "朱砂含量很高，颜色正红。" }
                ]
            },
            {
                id: 15,
                name: "绿幽灵手串",
                price: 278,
                category: "bracelet",
                element: ["wood"],
                effect: ["wealth", "study"],
                material: "crystal",
                rating: 4.9,
                emoji: "💚",
                description: "事业有成，招正财",
                suitable: "八字喜木者、职场人士、求事业者",
                reviews: [
                    { author: "沈***", rating: 5, comment: "绿幽灵聚宝盆，事业运真的变好了！" }
                ]
            },
            {
                id: 16,
                name: "粉晶手串",
                price: 108,
                category: "bracelet",
                element: ["fire"],
                effect: ["love"],
                material: "crystal",
                rating: 4.6,
                emoji: "💗",
                description: "催旺桃花，增进人缘",
                suitable: "八字喜火者、单身者、需要旺人缘者",
                reviews: [
                    { author: "韩***", rating: 4, comment: "戴了两个月，真的脱单了！" }
                ]
            },
            {
                id: 17,
                name: "青金石手串",
                price: 188,
                category: "bracelet",
                element: ["water"],
                effect: ["peace"],
                material: "crystal",
                rating: 4.7,
                emoji: "💙",
                description: "沟通表达，安神助眠",
                suitable: "八字喜水者、需要提升沟通能力者、失眠者",
                reviews: [
                    { author: "杨***", rating: 5, comment: "青金石颜色很正，戴着很优雅。" }
                ]
            },
            {
                id: 18,
                name: "南红玛瑙手串",
                price: 228,
                category: "bracelet",
                element: ["fire"],
                effect: ["peace", "health"],
                material: "crystal",
                rating: 4.8,
                emoji: "❤️",
                description: "养心养血，辟邪保平安",
                suitable: "八字喜火者、需要养心者、女性",
                reviews: [
                    { author: "朱***", rating: 5, comment: "南红很润，戴着手腕很舒服。" }
                ]
            },
            {
                id: 19,
                name: "沉香线香",
                price: 68,
                category: "incense",
                element: ["wood"],
                effect: ["peace"],
                material: "wood",
                rating: 4.9,
                emoji: "🪔",
                description: "净化空间，安神静心",
                suitable: "八字喜木者、修行者、需要净化空间者",
                reviews: [
                    { author: "秦***", rating: 5, comment: "沉香味道很正，点燃后整个房间都很安宁。" }
                ]
            },
            {
                id: 20,
                name: "艾草香",
                price: 38,
                category: "incense",
                element: ["fire"],
                effect: ["protection", "health"],
                material: "wood",
                rating: 4.5,
                emoji: "🌿",
                description: "驱邪避秽，净化空气",
                suitable: "八字喜火者、需要驱邪者、注重健康者",
                reviews: [
                    { author: "尤***", rating: 4, comment: "艾草香很浓郁，驱蚊效果也很好。" }
                ]
            },
            {
                id: 21,
                name: "太岁符",
                price: 58,
                category: "talisman",
                element: ["fire"],
                effect: ["protection"],
                material: "copter",
                rating: 4.7,
                emoji: "📜",
                description: "化解犯太岁，保平安",
                suitable: "2026年犯太岁者（鼠、兔、马、鸡）、八字喜火者",
                reviews: [
                    { author: "许***", rating: 5, comment: "2026年属鼠，请了太岁符保平安。" }
                ]
            },
            {
                id: 22,
                name: "平安符",
                price: 48,
                category: "talisman",
                element: ["metal"],
                effect: ["peace"],
                material: "copter",
                rating: 4.8,
                emoji: "📜",
                description: "出行平安，驱邪保平安",
                suitable: "八字喜金者、经常出行者、需要保平安者",
                reviews: [
                    { author: "何***", rating: 5, comment: "放在钱包里，出差很安心。" }
                ]
            },
            {
                id: 23,
                name: "文昌符",
                price: 48,
                category: "talisman",
                element: ["wood"],
                effect: ["study"],
                material: "copter",
                rating: 4.6,
                emoji: "📜",
                description: "旺文昌，助考试学业",
                suitable: "八字喜木者、学生、考生",
                reviews: [
                    { author: "吕***", rating: 5, comment: "孩子中考前请的文昌符，考得很好！" }
                ]
            },
            {
                id: 24,
                name: "招财符",
                price: 48,
                category: "talisman",
                element: ["metal"],
                effect: ["wealth"],
                material: "copter",
                emoji: "📜",
                description: "招财旺运，提升财运",
                suitable: "八字喜金者、求财者",
                rating: 4.7,
                reviews: [
                    { author: "施***", rating: 4, comment: "放在收银台，财运确实有提升。" }
                ]
            },
            {
                id: 25,
                name: "金刚结",
                price: 38,
                category: "talisman",
                element: ["fire"],
                effect: ["protection"],
                material: "copter",
                rating: 4.8,
                emoji: "🧶",
                description: "护身辟邪，斩断违缘",
                suitable: "八字喜火者、需要护身者、修行者",
                reviews: [
                    { author: "张***", rating: 5, comment: "上师亲手编的金刚结，很有加持力。" }
                ]
            },
            {
                id: 26,
                name: "六字真言转经筒",
                price: 198,
                category: "ornament",
                element: ["metal"],
                effect: ["peace"],
                material: "metal",
                rating: 4.9,
                emoji: "🕉️",
                description: "修行养性，积累功德",
                suitable: "八字喜金者、修行者、注重精神修养者",
                reviews: [
                    { author: "旦***", rating: 5, comment: "转经筒做工精美，转动时声音很好听。" }
                ]
            },
            {
                id: 27,
                name: "风水罗盘",
                price: 298,
                category: "ornament",
                element: ["metal"],
                effect: ["study"],
                material: "metal",
                rating: 4.7,
                emoji: "🧭",
                description: "专业风水勘测，趋吉避凶",
                suitable: "八字喜金者、风水爱好者、专业风水师",
                reviews: [
                    { author: "袁***", rating: 5, comment: "罗盘很精准，适合专业学习使用。" }
                ]
            },
            {
                id: 28,
                name: "易经全书",
                price: 88,
                category: "book",
                element: ["earth"],
                effect: ["study"],
                material: "copter",
                rating: 4.8,
                emoji: "📚",
                description: "学习易经，洞察天机",
                suitable: "八字喜土者、易经爱好者、命理学习者",
                reviews: [
                    { author: "王***", rating: 5, comment: "注释详细，适合初学者。" }
                ]
            },
            {
                id: 29,
                name: "奇门遁甲教程",
                price: 168,
                category: "book",
                element: ["water"],
                effect: ["study"],
                material: "copter",
                rating: 4.6,
                emoji: "📖",
                description: "进阶命理学习，运筹帷幄",
                suitable: "八字喜水者、命理进阶者、奇门爱好者",
                reviews: [
                    { author: "李***", rating: 4, comment: "内容深奥，需要有一定基础才能看懂。" }
                ]
            },
            {
                id: 30,
                name: "面相手相学习卡",
                price: 58,
                category: "book",
                element: ["earth"],
                effect: ["study"],
                material: "copter",
                rating: 4.5,
                emoji: "🃏",
                description: "入门相术学习，识人识己",
                suitable: "八字喜土者、相术初学者、人脉工作者",
                reviews: [
                    { author: "赵***", rating: 4, comment: "图文并茂，很适合入门学习。" }
                ]
            },
            {
                id: 31,
                name: "道家养生茶方",
                price: 68,
                category: "medicine",
                element: ["wood"],
                effect: ["health"],
                material: "herbal",
                rating: 4.8,
                emoji: "🍵",
                description: "道家秘传养生茶，调理气血",
                suitable: "体质虚弱者、气血不足者、日常养生",
                reviews: [
                    { author: "钱***", rating: 5, comment: "喝了两周，精神好了很多。" }
                ]
            },
            {
                id: 32,
                name: "儒家四君子汤",
                price: 88,
                category: "medicine",
                element: ["earth"],
                effect: ["health"],
                material: "herbal",
                rating: 4.9,
                emoji: "🏮",
                description: "经典补气方，健脾益气",
                suitable: "脾胃虚弱者、食欲不振者、气短乏力者",
                reviews: [
                    { author: "孙***", rating: 5, comment: "补气效果明显" },
                    { author: "李***", rating: 5, comment: "老方子靠谱" }
                ]
            },
            {
                id: 33,
                name: "六味地黄丸方",
                price: 78,
                category: "medicine",
                element: ["water"],
                effect: ["health"],
                material: "herbal",
                rating: 4.9,
                emoji: "💊",
                description: "滋阴补肾，道家传承名方",
                suitable: "肾阴不足者、腰膝酸软者、头晕耳鸣者",
                reviews: [
                    { author: "周***", rating: 5, comment: "道家名方，效果不错。" },
                    { author: "吴***", rating: 5, comment: "坚持服用，腰膝酸软改善了。" }
                ]
            },
            {
                id: 34,
                name: "归脾汤方",
                price: 98,
                category: "medicine",
                element: ["wood"],
                effect: ["health"],
                material: "herbal",
                rating: 4.7,
                emoji: "🌿",
                description: "养心健脾，补血安神",
                suitable: "心血不足者、失眠多梦者、面色萎黄者",
                reviews: [
                    { author: "郑***", rating: 5, comment: "喝了归脾汤，睡眠质量改善明显。" }
                ]
            },
            {
                id: 35,
                name: "道家八珍糕方",
                price: 58,
                category: "medicine",
                element: ["earth"],
                effect: ["health"],
                material: "herbal",
                rating: 4.8,
                emoji: "🍰",
                description: "乾隆御用养生糕，健脾祛湿",
                suitable: "脾胃虚弱者、湿气重者、日常调理",
                reviews: [
                    { author: "冯***", rating: 5, comment: "老少皆宜" },
                    { author: "陈***", rating: 5, comment: "坚持吃身体好了很多" }
                ]
            },
            {
                id: 36,
                name: "阿胶膏",
                price: 168,
                category: "health",
                element: ["earth"],
                effect: ["health"],
                material: "herbal",
                rating: 4.9,
                emoji: "🫕",
                description: "补血圣品，滋阴润燥",
                suitable: "血虚者、女性调理、面色苍白者",
                reviews: [
                    { author: "褚***", rating: 5, comment: "阿胶含量足，吃了两罐气色好多了。" },
                    { author: "卫***", rating: 5, comment: "女性调理必备，效果明显。" },
                    { author: "蒋***", rating: 5, comment: "面色红润了，推荐给朋友们。" }
                ]
            },
            {
                id: 37,
                name: "秋梨膏",
                price: 78,
                category: "health",
                element: ["metal"],
                effect: ["health"],
                material: "herbal",
                rating: 4.8,
                emoji: "🍐",
                description: "润肺止咳，清热化痰",
                suitable: "肺热咳嗽者、咽干口渴者、秋季养生",
                reviews: [
                    { author: "沈***", rating: 5, comment: "秋天干燥，喝秋梨膏嗓子舒服多了。" },
                    { author: "杨***", rating: 5, comment: "止咳效果很好，孩子也爱喝。" }
                ]
            },
            {
                id: 38,
                name: "龟鹿二仙膏",
                price: 238,
                category: "health",
                element: ["water"],
                effect: ["health"],
                material: "herbal",
                rating: 4.7,
                emoji: "🐢",
                description: "补肾壮阳，益精填髓",
                suitable: "肾精不足者、阳痿早泄者、腰膝酸软者",
                reviews: [
                    { author: "朱***", rating: 5, comment: "古方名膏，效果不错。" },
                    { author: "秦***", rating: 5, comment: "腰膝有力了，感觉年轻了很多。" }
                ]
            },
            {
                id: 39,
                name: "八珍膏",
                price: 138,
                category: "health",
                element: ["earth"],
                effect: ["health"],
                material: "herbal",
                rating: 4.8,
                emoji: "🏺",
                description: "气血双补，调经养颜",
                suitable: "气血两虚者、月经不调者、面色萎黄者",
                reviews: [
                    { author: "尤***", rating: 5, comment: "月经规律了，气色也好了。" },
                    { author: "许***", rating: 5, comment: "调经养颜效果好，推荐女性朋友。" }
                ]
            },
            {
                id: 40,
                name: "川贝枇杷膏",
                price: 68,
                category: "health",
                element: ["metal"],
                effect: ["health"],
                material: "herbal",
                rating: 4.9,
                emoji: "🍯",
                description: "润肺化痰，止咳平喘",
                suitable: "咳嗽痰多者、慢性咽炎者、秋燥伤肺者",
                reviews: [
                    { author: "何***", rating: 5, comment: "润肺效果很好，咳嗽明显减轻。" },
                    { author: "吕***", rating: 5, comment: "慢性咽炎患者的福音！" },
                    { author: "施***", rating: 5, comment: "秋天必备，家里常备。" }
                ]
            },
            {
                id: 41,
                name: "茯苓膏",
                price: 88,
                category: "health",
                element: ["earth"],
                effect: ["health"],
                material: "herbal",
                rating: 4.7,
                emoji: "☁️",
                description: "健脾祛湿，宁心安神",
                suitable: "湿气重者、水肿者、脾虚失眠者",
                reviews: [
                    { author: "张***", rating: 5, comment: "湿气排出去了，身体轻松多了。" },
                    { author: "孔***", rating: 5, comment: "茯苓膏安神效果好，睡眠改善了。" }
                ]
            },
            {
                id: 42,
                name: "枸杞桑葚膏",
                price: 108,
                category: "health",
                element: ["water"],
                effect: ["health", "study"],
                material: "herbal",
                rating: 4.8,
                emoji: "🍇",
                description: "滋补肝肾，明目益智",
                suitable: "肝肾不足者、用眼过度者、学生考生",
                reviews: [
                    { author: "曹***", rating: 5, comment: "明目效果不错，眼睛不酸涩了。" },
                    { author: "严***", rating: 5, comment: "孩子备考期间吃，学习效率提高了。" }
                ]
            },
            {
                id: 43,
                name: "黄精膏",
                price: 128,
                category: "health",
                element: ["earth"],
                effect: ["health"],
                material: "herbal",
                rating: 4.7,
                emoji: "🌱",
                description: "补气养阴，健脾润肺",
                suitable: "气阴两虚者、体倦乏力者、糖尿病调理者",
                reviews: [
                    { author: "金***", rating: 5, comment: "体倦乏力改善了，精力充沛。" }
                ]
            },
            {
                id: 44,
                name: "玉灵膏",
                price: 158,
                category: "health",
                element: ["water"],
                effect: ["health"],
                material: "herbal",
                rating: 4.9,
                emoji: "🌙",
                description: "罗大伦推荐，补血安神古方",
                suitable: "心血不足者、失眠者、产后调理者",
                reviews: [
                    { author: "魏***", rating: 5, comment: "失眠改善很明显" },
                    { author: "陶***", rating: 5, comment: "古方确实有用" },
                    { author: "姜***", rating: 5, comment: "坚持一个月气色好了" }
                ]
            },
            {
                id: 45,
                name: "酸枣仁膏",
                price: 98,
                category: "health",
                element: ["wood"],
                effect: ["health"],
                material: "herbal",
                rating: 4.8,
                emoji: "😴",
                description: "养心安神，改善睡眠",
                suitable: "失眠多梦者、心烦易怒者、焦虑不安者",
                reviews: [
                    { author: "戚***", rating: 5, comment: "失眠多梦问题解决了。" },
                    { author: "谢***", rating: 5, comment: "心烦焦虑缓解了，睡眠质量提高。" }
                ]
            }
        ];

        // ===== 为商品补充 origin（名山大川来源）和 sales（销量）字段 =====
        var productOrigins = {
            1: { origin: '普陀山（观音道场）', sales: 3256 },
            2: { origin: '江苏东海', sales: 4521 },
            3: { origin: '缅甸进口', sales: 2345 },
            4: { origin: '五台山（文殊菩萨道场）', sales: 4521 },
            5: { origin: '武当山', sales: 3456 },
            6: { origin: '山东泰山', sales: 5678 },
            7: { origin: '陕西西安', sales: 8765 },
            8: { origin: '曲阜孔庙', sales: 5678 },
            9: { origin: '九华山（地藏道场）', sales: 6789 },
            10: { origin: '峨眉山（普贤道场）', sales: 3456 },
            11: { origin: '龙虎山', sales: 2345 },
            12: { origin: '江西龙虎山', sales: 8765 },
            13: { origin: '山东泰山', sales: 6789 },
            14: { origin: '法门寺', sales: 4567 },
            15: { origin: '巴西进口', sales: 1567 },
            16: { origin: '马达加斯加进口', sales: 6789 },
            17: { origin: '阿富汗进口', sales: 2345 },
            18: { origin: '四川凉山', sales: 4567 },
            19: { origin: '灵隐寺', sales: 8765 },
            20: { origin: '河南南阳', sales: 12345 },
            21: { origin: '江西龙虎山', sales: 12345 },
            22: { origin: '普陀山（观音道场）', sales: 15670 },
            23: { origin: '曲阜孔庙', sales: 8765 },
            24: { origin: '武当山', sales: 9876 },
            25: { origin: '西藏拉萨', sales: 6789 },
            26: { origin: '西藏拉萨', sales: 4567 },
            27: { origin: '茅山', sales: 2345 },
            28: { origin: '曲阜孔庙', sales: 7680 },
            29: { origin: '嵩阳书院', sales: 3920 },
            30: { origin: '岳麓书院', sales: 5230 },
            31: { origin: '青城山', sales: 8923 },
            32: { origin: '曲阜孔庙', sales: 6700 },
            33: { origin: '河南南阳', sales: 9800 },
            34: { origin: '河南南阳', sales: 4500 },
            35: { origin: '武当山', sales: 7200 },
            36: { origin: '山东东阿', sales: 8923 },
            37: { origin: '北京同仁堂', sales: 6700 },
            38: { origin: '河南南阳', sales: 3400 },
            39: { origin: '河南南阳', sales: 5600 },
            40: { origin: '北京同仁堂', sales: 9800 },
            41: { origin: '河南南阳', sales: 4500 },
            42: { origin: '宁夏中宁', sales: 5200 },
            43: { origin: '青城山', sales: 3800 },
            44: { origin: '河南南阳', sales: 4600 },
            45: { origin: '陕西延安', sales: 6700 }
        };
        products.forEach(function(p) {
            var ext = productOrigins[p.id];
            if (ext) {
                p.origin = ext.origin;
                p.sales = ext.sales;
            } else {
                p.origin = p.origin || '全国';
                p.sales = p.sales || 0;
            }
        });

        // 全局变量
        let currentSlide = 0;
        let cart = [];
        let currentProduct = null;
        let currentCategory = 'all';
        let currentSchool = 'all';
        let currentFilters = {
            price: 'all',
            effect: 'all',
            material: 'all'
        };

        // 初始化
        document.addEventListener('DOMContentLoaded', function() {
            renderProducts();
            startBannerRotation();
            setupEventListeners();
        });

        // 轮播图自动播放
        function startBannerRotation() {
            setInterval(() => {
                currentSlide = (currentSlide + 1) % 4;
                changeSlide(currentSlide);
            }, 5000);
        }

        function changeSlide(index) {
            currentSlide = index;
            const slides = document.querySelectorAll('.banner-slide');
            const dots = document.querySelectorAll('.banner-dot');
            
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });
            
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        }

        // 关闭弹窗
        function closeModal() {
            document.getElementById('productModal').style.display = 'none';
        }

        // 养生知识详情
        function showKnowledge(type) {
            const data = {
                daoist: {
                    title: '☯️ 道家养生体系',
                    content: `<h3>一、导引吐纳</h3>
<p><b>五禽戏</b>：华佗所创，模仿虎、鹿、熊、猿、鸟五种动物，每戏两式，通经活络。</p>
<p><b>八段锦</b>：八式导引，简便易行——两手托天理三焦、左右开弓似射雕、调理脾胃须单举、五劳七伤往后瞧、摇头摆尾去心火、两手攀足固肾腰、攒拳怒目增气力、背后七颠百病消。</p>
<p><b>太极拳</b>：以柔克刚，以静制动，动中求静，内外兼修。</p>
<h3>二、辟谷服气</h3>
<p>辟谷非绝食，而是减少五谷摄入，以药饵、松子、黄精代之。需在专业人士指导下进行，初学者可从「轻断食」入门。</p>
<h3>三、药膳调养</h3>
<p>黄精粥（补气养阴）、枸杞菊花茶（清肝明目）、山药茯苓粥（健脾祛湿）、百合银耳羹（润肺养阴）。</p>
<h3>四、道家名方推荐</h3>
<p>• 六味地黄丸 — 滋阴补肾第一方<br>• 金匮肾气丸 — 温补肾阳<br>• 还少丹 — 延年益寿<br>• 七宝美髯丹 — 乌发养颜</p>`
                },
                confucian: {
                    title: '📜 儒家养生智慧',
                    content: `<h3>一、饮食养生</h3>
<p><b>「食不厌精，脍不厌细」</b>——孔子讲究食材新鲜、烹饪得当。</p>
<p>儒家饮食八不食：食物变色不吃、变味不吃、切割不当不吃、时令不当不吃、肉切方正不吃、没有酱料不吃、市酒不吃、生姜不多食。</p>
<h3>二、起居有常</h3>
<p>「寝不尸，居不客」——睡眠不仰卧如尸体，居家不端正如做客。主张侧卧（吉祥卧），早睡早起，与日同作息。</p>
<h3>三、修身养性</h3>
<p>「仁者寿」——心胸开阔、与人为善者自然长寿。儒家强调克己复礼、温良恭俭让，以道德修养为养生根本。</p>
<h3>四、儒家名方推荐</h3>
<p>• 四君子汤 — 补气健脾第一方<br>• 归脾汤 — 养心健脾补血<br>• 参苓白术散 — 健脾祛湿<br>• 补中益气汤 — 升阳举陷</p>`
                },
                tcm: {
                    title: '💊 中医经方精华',
                    content: `<h3>一、经方与时方</h3>
<p><b>经方</b>：张仲景《伤寒杂病论》所载方剂，被誉为「方书之祖」，配伍严谨，疗效确切。</p>
<p><b>时方</b>：后世医家所创方剂，灵活变通，因人因时因地制宜。</p>
<h3>二、十大经方速览</h3>
<p>① 桂枝汤 — 调和营卫，解肌发表<br>② 麻黄汤 — 发汗解表，宣肺平喘<br>③ 小柴胡汤 — 和解少阳，疏肝理气<br>④ 四逆汤 — 回阳救逆，温中散寒<br>⑤ 白虎汤 — 清热生津，除烦止渴<br>⑥ 承气汤类 — 攻下通便，泻热存阴<br>⑦ 理中汤 — 温中散寒，补气健脾<br>⑧ 逍遥散 — 疏肝解郁，养血健脾<br>⑨ 六味地黄丸 — 滋阴补肾<br>⑩ 四物汤 — 补血调经</p>
<h3>三、用药禁忌</h3>
<p>中药须辨证论治，切勿自行服用经方。建议找专业中医师望闻问切后开具处方。</p>`
                },
                season: {
                    title: '🌸 四季养生指南',
                    content: `<h3>🌱 春季·养肝（立春→立夏）</h3>
<p>肝属木，应春生之气。宜：早起舒展、食酸养肝、疏泄情志。忌：暴怒伤肝、熬夜耗血。<br>推荐：枸杞菊花茶、柴胡疏肝散、春季踏青。</p>
<h3>☀️ 夏季·养心（立夏→立秋）</h3>
<p>心属火，应夏长之气。宜：午睡养心、食苦清心、静心宁神。忌：大汗伤阳、贪凉伤脾。<br>推荐：莲子心茶、生脉饮、夏季静坐。</p>
<h3>🍂 秋季·养肺（立秋→立冬）</h3>
<p>肺属金，应秋收之气。宜：早睡早起、食白润肺、收敛神气。忌：悲忧伤肺、燥邪伤津。<br>推荐：百合银耳羹、秋梨膏、秋季登山。</p>
<h3>❄️ 冬季·养肾（立冬→立春）</h3>
<p>肾属水，应冬藏之气。宜：早卧晚起、食黑补肾、保暖藏精。忌：房劳过度、受寒伤阳。<br>推荐：黑芝麻糊、金匮肾气丸、冬季泡脚。</p>`
                }
            };
            const d = data[type];
            if (!d) return;
            const modal = document.getElementById('productModal');
            document.getElementById('modalContent').innerHTML = `
                <div style="padding:2rem;max-height:70vh;overflow-y:auto">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
                        <h2 style="color:var(--gold);margin:0">${d.title}</h2>
                        <button onclick="closeModal()" style="background:none;border:none;color:var(--steel);font-size:1.5rem;cursor:pointer">✕</button>
                    </div>
                    <div style="color:var(--paper2);line-height:1.8;font-size:0.95rem">${d.content}</div>
                    <div style="margin-top:1.5rem;padding:1rem;background:rgba(212,168,67,0.08);border-radius:8px;border:1px solid rgba(212,168,67,0.2)">
                        <p style="color:var(--gold);font-size:0.85rem;margin:0">⚠️ 以上方剂仅供参考，具体用药请遵医嘱。中药讲究辨证论治，一人一方，请勿自行服用。</p>
                    </div>
                </div>`;
            modal.style.display = 'flex';
        }

        // 渲染商品列表
        function renderProducts(filteredProducts = null) {
            const grid = document.getElementById('productsGrid');
            const productsToShow = filteredProducts || products;
            
            grid.innerHTML = '';
            
            productsToShow.forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.dataset.element = product.element[0];
                card.dataset.id = product.id;
                
                const elementColors = {
                    metal: 'var(--metal2)',
                    wood: 'var(--jade)',
                    water: 'var(--cyan2)',
                    fire: 'var(--cinn2)',
                    earth: 'var(--wood2)'
                };
                
                card.innerHTML = `
                    <div class="product-image">${product.emoji}</div>
                    <div class="product-info">
                        <div class="product-name">${product.name}</div>
                        <div style="font-size:0.7rem;color:var(--paper3);margin-bottom:0.3rem">📍 ${product.origin || '全国'}</div>
                        <div class="product-price">¥${product.price}</div>
                        <div class="product-tags">
                            ${product.effect.map(e => `<span class="tag">${getEffectName(e)}</span>`).join('')}
                        </div>
                        <div class="product-rating">⭐ ${product.rating} · 售${(product.sales||0).toLocaleString()}</div>
                        <button class="add-cart-btn" onclick="event.stopPropagation(); addToCart(${product.id})">加入购物车</button>
                    </div>
                `;
                
                card.onclick = () => showProductDetail(product.id);
                grid.appendChild(card);
            });
        }

        // 获取功效名称
        function getEffectName(effect) {
            const names = {
                wealth: '招财',
                protection: '辟邪',
                love: '桃花',
                peace: '平安',
                study: '学业',
                health: '健康'
            };
            return names[effect] || effect;
        }

        // 显示商品详情
        function showProductDetail(productId) {
            const product = products.find(p => p.id === productId);
            if (!product) return;
            
            currentProduct = product;
            
            document.getElementById('homePage').style.display = 'none';
            document.getElementById('productDetail').classList.add('active');
            
            document.getElementById('detailName').textContent = product.name;
            document.getElementById('detailPrice').textContent = `¥${product.price}`;
            document.getElementById('detailMainImage').textContent = product.emoji;
            document.getElementById('detailSuitable').textContent = product.suitable;
            document.getElementById('detailEffect').textContent = product.description;
            
            // 渲染五行标签
            const elementsDiv = document.getElementById('detailElements');
            elementsDiv.innerHTML = '';
            const elementNames = {
                metal: '金',
                wood: '木',
                water: '水',
                fire: '火',
                earth: '土'
            };
            product.element.forEach(el => {
                const tag = document.createElement('span');
                tag.className = `element-tag ${el}`;
                tag.textContent = elementNames[el];
                elementsDiv.appendChild(tag);
            });
            
            // 渲染缩略图
            const thumbnails = document.getElementById('detailThumbnails');
            thumbnails.innerHTML = '';
            for (let i = 0; i < 4; i++) {
                const thumb = document.createElement('div');
                thumb.className = 'thumbnail';
                if (i === 0) thumb.classList.add('active');
                thumb.textContent = product.emoji;
                thumb.onclick = () => {
                    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                };
                thumbnails.appendChild(thumb);
            }
            
            // 渲染评价
            const reviewsDiv = document.getElementById('productReviews');
            reviewsDiv.innerHTML = '';
            if (product.reviews && product.reviews.length > 0) {
                product.reviews.forEach(review => {
                    const reviewEl = document.createElement('div');
                    reviewEl.className = 'review-item';
                    reviewEl.innerHTML = `
                        <div class="review-header">
                            <span class="review-author">${review.author}</span>
                            <span class="review-rating">${'⭐'.repeat(review.rating)}</span>
                        </div>
                        <p>${review.comment}</p>
                    `;
                    reviewsDiv.appendChild(reviewEl);
                });
            } else {
                reviewsDiv.innerHTML = '<div class="empty-state"><p>暂无评价</p></div>';
            }
            
            // 渲染相关推荐
            renderRelatedProducts(product);
        }

        // 渲染相关推荐
        function renderRelatedProducts(currentProduct) {
            const grid = document.getElementById('relatedProducts');
            grid.innerHTML = '';
            
            const related = products.filter(p => 
                p.id !== currentProduct.id && 
                (p.element.some(el => currentProduct.element.includes(el)) || 
                 p.effect.some(e => currentProduct.effect.includes(e)))
            ).slice(0, 4);
            
            related.forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.dataset.element = product.element[0];
                
                card.innerHTML = `
                    <div class="product-image">${product.emoji}</div>
                    <div class="product-info">
                        <div class="product-name">${product.name}</div>
                        <div class="product-price">¥${product.price}</div>
                    </div>
                `;
                
                card.onclick = () => showProductDetail(product.id);
                grid.appendChild(card);
            });
        }

        // 返回首页
        function showHome() {
            document.getElementById('homePage').style.display = 'block';
            document.getElementById('productDetail').classList.remove('active');
        }

        // 加入购物车
        function addToCart(productId) {
            const product = products.find(p => p.id === productId);
            if (!product) return;
            
            const existingItem = cart.find(item => item.id === productId);
            if (existingItem) {
                existingItem.quantity++;
            } else {
                cart.push({
                    ...product,
                    quantity: 1
                });
            }
            
            updateCartCount();
            showAddToCartAnimation(event);
        }

        function addToCartFromDetail() {
            if (!currentProduct) return;
            addToCart(currentProduct.id);
        }

        // 加入购物车动画
        function showAddToCartAnimation(event) {
            const btn = event.target;
            btn.classList.add('add-to-cart-animation');
            setTimeout(() => {
                btn.classList.remove('add-to-cart-animation');
            }, 500);
        }

        // 更新购物车数量
        function updateCartCount() {
            const count = cart.reduce((sum, item) => sum + item.quantity, 0);
            document.getElementById('cartCount').textContent = count;
        }

        // 切换购物车显示
        function toggleCart() {
            const sidebar = document.getElementById('cartSidebar');
            sidebar.classList.toggle('active');
            
            if (sidebar.classList.contains('active')) {
                renderCartItems();
            }
        }

        // 渲染购物车商品
        function renderCartItems() {
            const cartItems = document.getElementById('cartItems');
            const cartTotal = document.getElementById('cartTotal');
            
            cartItems.innerHTML = '';
            
            if (cart.length === 0) {
                cartItems.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🛒</div><p>购物车是空的</p></div>';
                cartTotal.textContent = '¥0';
                return;
            }
            
            let total = 0;
            
            cart.forEach((item, index) => {
                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item';
                itemEl.innerHTML = `
                    <div class="cart-item-image">${item.emoji}</div>
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">¥${item.price}</div>
                        <div class="cart-item-quantity">
                            <button class="qty-btn" onclick="updateQuantity(${index}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQuantity(${index}, 1)">+</button>
                            <button class="qty-btn" onclick="removeFromCart(${index})" style="margin-left: auto;">🗑️</button>
                        </div>
                    </div>
                `;
                cartItems.appendChild(itemEl);
                
                total += item.price * item.quantity;
            });
            
            cartTotal.textContent = `¥${total}`;
        }

        // 更新商品数量
        function updateQuantity(index, delta) {
            cart[index].quantity += delta;
            
            if (cart[index].quantity <= 0) {
                cart.splice(index, 1);
            }
            
            updateCartCount();
            renderCartItems();
        }

        // 从购物车移除
        function removeFromCart(index) {
            cart.splice(index, 1);
            updateCartCount();
            renderCartItems();
        }

        // 显示结算弹窗
        function showCheckout() {
            if (cart.length === 0) {
                showToast('购物车是空的！');
                return;
            }
            document.getElementById('checkoutModal').classList.add('active');
        }

        // 关闭结算弹窗
        function closeCheckout() {
            document.getElementById('checkoutModal').classList.remove('active');
        }

        // 处理支付
        function processPayment(method) {
            showToast(`即将跳转到${method === 'wechat' ? '微信' : '支付宝'}支付...\n（此为演示，实际需接入支付接口）`);
        }

        // 提交订单
        function submitOrder() {
            const name = document.getElementById('recipientName').value;
            const phone = document.getElementById('recipientPhone').value;
            const address = document.getElementById('recipientAddress').value;
            
            if (!name || !phone || !address) {
                showToast('请填写完整的收货信息！');
                return;
            }
            
            showToast('订单提交成功！\n（此为演示，实际需接入订单系统）');
            
            // 清空购物车
            cart = [];
            updateCartCount();
            closeCheckout();
            toggleCart();
        }

        // 立即购买
        function buyNow() {
            if (!currentProduct) return;
            addToCart(currentProduct.id);
            showCheckout();
        }

        // 智能推荐
        function smartRecommend() {
            const userElement = document.getElementById('userElement').value;
            const userNeed = document.getElementById('userNeed').value;
            
            let recommended = products.filter(p => {
                let match = false;
                
                if (userElement && p.element.includes(userElement)) {
                    match = true;
                }
                
                if (userNeed && p.effect.includes(userNeed)) {
                    match = true;
                }
                
                // 季节性推荐
                const month = new Date().getMonth() + 1;
                if (month >= 3 && month <= 5 && p.element.includes('wood')) match = true; // 春季木旺
                if (month >= 6 && month <= 8 && p.element.includes('fire')) match = true; // 夏季火旺
                
                // 2026年丙午马年，推荐化太岁物品
                if (p.name.includes('太岁') || p.name.includes('龙龟')) match = true;
                
                return match;
            });
            
            if (recommended.length === 0) {
                recommended = products.slice(0, 4);
            }
            
            const resultsDiv = document.getElementById('recommendationResults');
            resultsDiv.innerHTML = '<h3 style="color: var(--gold-light); margin-bottom: 1rem;">为您推荐</h3>';
            
            const grid = document.createElement('div');
            grid.className = 'products-grid';
            grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
            
            recommended.slice(0, 4).forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.dataset.element = product.element[0];
                
                card.innerHTML = `
                    <div class="product-image">${product.emoji}</div>
                    <div class="product-info">
                        <div class="product-name">${product.name}</div>
                        <div class="product-price">¥${product.price}</div>
                        <div class="product-tags">
                            <span class="tag">推荐理由：${userElement ? '五行相合' : '需求匹配'}</span>
                        </div>
                    </div>
                `;
                
                card.onclick = () => showProductDetail(product.id);
                grid.appendChild(card);
            });
            
            resultsDiv.appendChild(grid);
            
            // 滚动到推荐结果
            resultsDiv.scrollIntoView({ behavior: 'smooth' });
        }

        // 设置事件监听器
        function setupEventListeners() {
            // 分类导航
            document.querySelectorAll('.category-item').forEach(item => {
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    // 判断是派别筛选还是分类筛选
                    if (this.dataset.school) {
                        // 派别筛选
                        document.querySelectorAll('#schoolNavList .category-item').forEach(i => i.classList.remove('active'));
                        this.classList.add('active');
                        currentSchool = this.dataset.school;
                    } else {
                        // 分类筛选
                        document.querySelectorAll('.category-nav:not(#schoolNavList) .category-item').forEach(i => i.classList.remove('active'));
                        this.classList.add('active');
                        currentCategory = this.dataset.category;
                    }
                    filterProducts();
                });
            });
            
            // 筛选按钮
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const filterType = this.dataset.filter;
                    const filterValue = this.dataset.value;
                    
                    // 更新active状态
                    this.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    
                    // 更新筛选条件
                    currentFilters[filterType] = filterValue;
                    
                    filterProducts();
                });
            });
            
            // 搜索
            document.getElementById('searchInput').addEventListener('input', function() {
                filterProducts();
            });
            
            // 默认激活第一个筛选按钮
            document.querySelectorAll('.filter-options').forEach(group => {
                const firstBtn = group.querySelector('.filter-btn');
                if (firstBtn) firstBtn.classList.add('active');
            });
        }

        // 筛选商品
        function filterProducts() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            
            let filtered = products.filter(product => {
                // 分类筛选
                if (currentCategory !== 'all' && product.category !== currentCategory) {
                    return false;
                }
                
                // 派别筛选
                if (currentSchool !== 'all') {
                    const pName = product.name || '';
                    const pDesc = product.description || '';
                    const pTags = (product.tags || []).join(' ');
                    if (currentSchool === 'buddhist' && !pName.match(/佛|菩提|转经|梵|禅|朱砂|六字|金刚|颂钵|木鱼|磬|甘露|翡翠佛|莲师/) && !pTags.match(/佛|禅|菩提|祈福|消业|护佑/)) return false;
                    if (currentSchool === 'daoist' && !pName.match(/太极|八卦|桃木|符|葫芦|风水|道|镇宅|辟邪|颂钵/) && !pTags.match(/道|镇宅|化煞|护身|辟邪|风水/)) return false;
                    if (currentSchool === 'confucian' && !pName.match(/文昌|论语|易经|奇门|面相|手相|竹|孔子|毛笔|砚|书/) && !pTags.match(/学业|修身|君子|书法|文化/)) return false;
                    if (currentSchool === 'instrument' && !pName.match(/颂钵|木鱼|磬|金刚铃|桃木剑|转经筒|罗盘|风铃/)) return false;
                    if (currentSchool === 'health' && product.category !== 'medicine' && product.category !== 'health' && !pName.match(/膏|丸|汤|药|养生|茶方/)) return false;
                    if (currentSchool === 'tea' && !pName.match(/茶|龙井|碧螺春|铁观音|大红袍|普洱|白茶|茉莉|陈皮/)) return false;
                }
                
                // 搜索筛选
                if (searchTerm && !product.name.toLowerCase().includes(searchTerm) && 
                    !product.description.toLowerCase().includes(searchTerm)) {
                    return false;
                }
                
                // 结缘价筛选
                if (currentFilters.price !== 'all') {
                    const [min, max] = currentFilters.price.split('-').map(Number);
                    if (currentFilters.price.includes('+')) {
                        if (product.price < 500) return false;
                    } else if (product.price < min || product.price > max) {
                        return false;
                    }
                }
                
                // 功效筛选
                if (currentFilters.effect !== 'all' && !product.effect.includes(currentFilters.effect)) {
                    return false;
                }
                
                // 材质筛选
                if (currentFilters.material !== 'all' && product.material !== currentFilters.material) {
                    return false;
                }
                
                return true;
            });
            
            // 默认按销量降序排序
            filtered.sort((a, b) => (b.sales || 0) - (a.sales || 0));
            
            renderProducts(filtered);
        }
    