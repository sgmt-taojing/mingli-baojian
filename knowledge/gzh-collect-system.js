// ================================================================
// 公众号关注与内容采集系统
// 用途：自动关注佛道儒/名山/术数类公众号，采集内容喂给知识库自进化
// ================================================================

let GONGZHONGHAO_DB = {
  // ═══ 佛教名山与寺院 ═══
  buddhist: [
    // 四大名山
    {id:'putuoshan', name:'普陀山文化旅游', wxid:'putuoshan_gt', region:'浙江舟山', tradition:'佛', tag:'观音道场',
     contentTypes:['法会通知','佛学开示','朝山指南','每日祈福'], followUrl:'mp.weixin.qq.com', priority:5},
    {id:'jiuhuashan', name:'九华山', wxid:'jiuhuashan_gt', region:'安徽池州', tradition:'佛', tag:'地藏道场',
     contentTypes:['法会通知','地藏经讲解','朝山指南','因果故事'], followUrl:'mp.weixin.qq.com', priority:5},
    {id:'wutaishan', name:'五台山佛教', wxid:'wutaishan_gt', region:'山西忻州', tradition:'佛', tag:'文殊道场',
     contentTypes:['法会通知','文殊法','佛学讲座','禅修通知'], followUrl:'mp.weixin.qq.com', priority:5},
    {id:'emeishan', name:'峨眉山景区', wxid:'emeishan_gt', region:'四川乐山', tradition:'佛', tag:'普贤道场',
     contentTypes:['法会通知','普贤行愿','朝山指南','佛学开示'], followUrl:'mp.weixin.qq.com', priority:5},
    // 名寺
    {id:'shaolin', name:'少林寺', wxid:'shaolintemple', region:'河南登封', tradition:'佛', tag:'禅宗祖庭',
     contentTypes:['禅修通知','少林功夫','禅宗公案','法会通知'], followUrl:'mp.weixin.qq.com', priority:4},
    {id:'baima', name:'白马寺', wxid:'baimasi_gt', region:'河南洛阳', tradition:'佛', tag:'释源祖庭',
     contentTypes:['佛学讲座','法会通知','寺院新闻','佛教历史'], followUrl:'mp.weixin.qq.com', priority:3},
    {id:'lingyin', name:'灵隐寺', wxid:'lingyinsi_gt', region:'浙江杭州', tradition:'佛', tag:'江南名刹',
     contentTypes:['法会通知','佛学开示','禅修通知','济公文化'], followUrl:'mp.weixin.qq.com', priority:5},
    {id:'nanshan', name:'三亚南山寺', wxid:'nanshansi_gt', region:'海南三亚', tradition:'佛', tag:'南海观音',
     contentTypes:['法会通知','观音法','朝圣指南','佛学讲座'], followUrl:'mp.weixin.qq.com', priority:3},
    {id:'daci', name:'大慈寺', wxid:'dacisi_gt', region:'四川成都', tradition:'佛', tag:'玄奘出家地',
     contentTypes:['法会通知','佛学讲座','禅修通知','寺院文化'], followUrl:'mp.weixin.qq.com', priority:3},
    {id:'jingci', name:'净慈寺', wxid:'jingcisi_gt', region:'浙江杭州', tradition:'佛', tag:'南山净慈',
     contentTypes:['法会通知','佛学开示','禅修通知','钟声文化'], followUrl:'mp.weixin.qq.com', priority:3},
    {id:'guangxiao', name:'光孝寺', wxid:'guangxiaosi_gt', region:'广东广州', tradition:'佛', tag:'岭南名刹',
     contentTypes:['法会通知','佛学讲座','禅修通知','六祖文化'], followUrl:'mp.weixin.qq.com', priority:3},
    {id:'han Shan', name:'寒山寺', wxid:'hanshansi_gt', region:'江苏苏州', tradition:'佛', tag:'和合祖庭',
     contentTypes:['法会通知','佛学开示','寒山子诗','钟声文化'], followUrl:'mp.weixin.qq.com', priority:3},
    {id:'daxiangguo', name:'大相国寺', wxid:'daxiangguosi', region:'河南开封', tradition:'佛', tag:'皇家寺院',
     contentTypes:['法会通知','佛学讲座','寺院历史','梵乐文化'], followUrl:'mp.weixin.qq.com', priority:2},
    {id:'fabao', name:'法宝寺', wxid:'fabaosi_gt', region:'江苏扬州', tradition:'佛', tag:'鉴真东渡',
     contentTypes:['法会通知','佛学讲座','鉴真文化','禅修通知'], followUrl:'mp.weixin.qq.com', priority:2},
    {id:'yuquan', name:'玉泉寺', wxid:'yuquansi_gt', region:'湖北当阳', tradition:'佛', tag:'天台祖庭',
     contentTypes:['法会通知','天台宗','佛学讲座','寺院文化'], followUrl:'mp.weixin.qq.com', priority:2},
  ],

  // ═══ 道教名山与宫观 ═══
  taoist: [
    // 四大道教名山
    {id:'wudang', name:'武当山', wxid:'wudangshan_gt', region:'湖北十堰', tradition:'道', tag:'真武大帝',
     contentTypes:['道教法会','武当功夫','道法开示','朝山指南','风水布局'], followUrl:'mp.weixin.qq.com', priority:5},
    {id:'qingcheng', name:'青城山', wxid:'qingchengshan_gt', region:'四川都江堰', tradition:'道', tag:'天师洞',
     contentTypes:['道教法会','道法讲座','养生功法','朝山指南'], followUrl:'mp.weixin.qq.com', priority:5},
    {id:'longhu', name:'龙虎山', wxid:'longhushan_gt', region:'江西鹰潭', tradition:'道', tag:'天师道祖庭',
     contentTypes:['道教法会','符箓文化','道法讲座','天师道','风水堪舆'], followUrl:'mp.weixin.qq.com', priority:5},
    {id:'qiyun', name:'齐云山', wxid:'qiyunshan_gt', region:'安徽休宁', tradition:'道', tag:'江南小武当',
     contentTypes:['道教法会','道法讲座','养生功法','朝山指南'], followUrl:'mp.weixin.qq.com', priority:4},
    // 著名宫观
    {id:'baiyun', name:'北京白云观', wxid:'baiyunguan_gt', region:'北京', tradition:'道', tag:'全真祖庭',
     contentTypes:['道教法会','道法讲座','全真道','养生功法','道医'], followUrl:'mp.weixin.qq.com', priority:5},
    {id:'taiqing', name:'崂山太清宫', wxid:'laoshantaiqing', region:'山东青岛', tradition:'道', tag:'海上名山',
     contentTypes:['道教法会','道法讲座','崂山道士','养生功法'], followUrl:'mp.weixin.qq.com', priority:4},
    {id:'chongyang', name:'重阳宫', wxid:'chongyanggong', region:'陕西户县', tradition:'道', tag:'全真祖庭',
     contentTypes:['道教法会','全真道','道法讲座','王重阳'], followUrl:'mp.weixin.qq.com', priority:3},
    {id:'louguan', name:'楼观台', wxid:'louguantai_gt', region:'陕西周至', tradition:'道', tag:'老子说经台',
     contentTypes:['道德经讲座','道教法会','道法开示','老子文化'], followUrl:'mp.weixin.qq.com', priority:4},
    {id:'dongxiao', name:'洞霄宫', wxid:'dongxiaogong', region:'浙江余杭', tradition:'道', tag:'三十六洞天',
     contentTypes:['道教法会','道法讲座','修炼功法','洞天福地'], followUrl:'mp.weixin.qq.com', priority:2},
    {id:'yongle', name:'永乐宫', wxid:'yonglegong_gt', region:'山西芮城', tradition:'道', tag:'吕祖道场',
     contentTypes:['道教法会','道法讲座','吕祖文化','壁画艺术'], followUrl:'mp.weixin.qq.com', priority:3},
    {id:'taoyuan', name:'桃源观', wxid:'taoyuanguan', region:'浙江杭州', tradition:'道', tag:'杭州道观',
     contentTypes:['道教法会','道法讲座','养生功法'], followUrl:'mp.weixin.qq.com', priority:2},
    {id:'chenghuang', name:'上海城隍庙', wxid:'shchm_gt', region:'上海', tradition:'道', tag:'都市道观',
     contentTypes:['道教法会','道法讲座','城隍文化','太岁信仰'], followUrl:'mp.weixin.qq.com', priority:4},
    {id:'sanyuan', name:'三元宫', wxid:'sanyuangong', region:'广东广州', tradition:'道', tag:'岭南道观',
     contentTypes:['道教法会','道法讲座','三元节'], followUrl:'mp.weixin.qq.com', priority:2},
  ],

  // ═══ 儒家书院与文庙 ═══
  confucian: [
    {id:'kongmiao', name:'曲阜孔庙', wxid:'kongmiao_gt', region:'山东曲阜', tradition:'儒', tag:'至圣先师',
     contentTypes:['祭孔大典','儒学讲座','论语解读','六艺文化','家训文化'], followUrl:'mp.weixin.qq.com', priority:5},
    {id:'yuelu', name:'岳麓书院', wxid:'yueluacademy', region:'湖南长沙', tradition:'儒', tag:'千年学府',
     contentTypes:['儒学讲座','书院文化','湖湘文化','经典解读'], followUrl:'mp.weixin.qq.com', priority:4},
    {id:'bailu', name:'白鹿洞书院', wxid:'bailudong_gt', region:'江西庐山', tradition:'儒', tag:'四大书院',
     contentTypes:['儒学讲座','书院文化','朱子学','经典解读'], followUrl:'mp.weixin.qq.com', priority:3},
    {id:'songyang', name:'嵩阳书院', wxid:'songyang_gt', region:'河南登封', tradition:'儒', tag:'四大书院',
     contentTypes:['儒学讲座','书院文化','理学','经典解读'], followUrl:'mp.weixin.qq.com', priority:3},
    {id:'guozijian', name:'北京孔庙国子监', wxid:'guozijian_gt', region:'北京', tradition:'儒', tag:'最高学府',
     contentTypes:['祭孔大典','儒学讲座','科举文化','经典解读'], followUrl:'mp.weixin.qq.com', priority:4},
    {id:'wenmiao', name:'上海文庙', wxid:'shwenmiao', region:'上海', tradition:'儒', tag:'东南学宫',
     contentTypes:['儒学讲座','祭孔活动','国学讲堂','经典解读'], followUrl:'mp.weixin.qq.com', priority:2},
  ],

  // ═══ 名山大川 ═══
  mountains: [
    {id:'taishan', name:'泰山景区', wxid:'taishan_gt', region:'山东泰安', tradition:'民俗', tag:'五岳之首',
     contentTypes:['泰山封禅','碧霞元君','日出时刻','登山指南','石刻文化'], followUrl:'mp.weixin.qq.com', priority:5},
    {id:'huashan', name:'华山', wxid:'huashan_gt', region:'陕西渭南', tradition:'民俗', tag:'西岳',
     contentTypes:['登山指南','道教文化','华山论剑','日出时刻'], followUrl:'mp.weixin.qq.com', priority:3},
    {id:'huangshan', name:'黄山', wxid:'huangshan_gt', region:'安徽黄山', tradition:'民俗', tag:'天下第一奇山',
     contentTypes:['登山指南','日出云海','徽州文化','风光摄影'], followUrl:'mp.weixin.qq.com', priority:3},
    {id:'songshan', name:'嵩山', wxid:'songshan_gt', region:'河南登封', tradition:'民俗', tag:'中岳',
     contentTypes:['登山指南','少林文化','嵩阳书院','中岳庙'], followUrl:'mp.weixin.qq.com', priority:3},
    {id:'hengshan_s', name:'南岳衡山', wxid:'hengshan_gt', region:'湖南衡阳', tradition:'民俗', tag:'南岳',
     contentTypes:['登山指南','南岳大庙','祝融峰','寿文化'], followUrl:'mp.weixin.qq.com', priority:3},
    {id:'hengshan_n', name:'北岳恒山', wxid:'hengshan_n_gt', region:'山西大同', tradition:'民俗', tag:'北岳',
     contentTypes:['登山指南','悬空寺','道教文化'], followUrl:'mp.weixin.qq.com', priority:2},
    {id:'emei_mt', name:'峨眉山景区', wxid:'emeishan_jq', region:'四川乐山', tradition:'民俗', tag:'佛国仙山',
     contentTypes:['登山指南','金顶日出','佛教文化','猴区趣事'], followUrl:'mp.weixin.qq.com', priority:3},
    {id:'lushan', name:'庐山', wxid:'lushan_gt', region:'江西九江', tradition:'民俗', tag:'匡庐奇秀',
     contentTypes:['登山指南','别墅文化','诗词庐山','瀑布云海'], followUrl:'mp.weixin.qq.com', priority:2},
  ],

  // ═══ 术数/命理/风水专业号 ═══
  shushu: [
    {id:'yijing', name:'周易研究', wxid:'zhouyi_yanjiu', region:'全国', tradition:'术数', tag:'易学研究',
     contentTypes:['易经讲解','六爻卦例','梅花易数','易学论文','每日一卦'], followUrl:'mp.weixin.qq.com', priority:5},
    {id:'qimen', name:'奇门遁甲研究', wxid:'qimen_yanjiu', region:'全国', tradition:'术数', tag:'帝王之学',
     contentTypes:['奇门排盘','奇门案例','奇门化解','遁甲术数'], followUrl:'mp.weixin.qq.com', priority:5},
    {id:'fengshui', name:'风水文化', wxid:'fengshui_wh', region:'全国', tradition:'术数', tag:'堪舆之学',
     contentTypes:['风水布局','玄空飞星','八宅明镜','阳宅风水','阴宅风水'], followUrl:'mp.weixin.qq.com', priority:5},
    {id:'bazi', name:'八字命理', wxid:'bazi_ml', region:'全国', tradition:'术数', tag:'四柱预测',
     contentTypes:['八字排盘','大运流年','十神分析','命理案例','每日运势'], followUrl:'mp.weixin.qq.com', priority:5},
    {id:'ziwei', name:'紫微斗数', wxid:'ziwei_ds', region:'全国', tradition:'术数', tag:'星命之学',
     contentTypes:['紫微排盘','星曜解读','宫位分析','斗数案例'], followUrl:'mp.weixin.qq.com', priority:4},
    {id:'huangli', name:'老黄历', wxid:'laohuangli_gt', region:'全国', tradition:'术数', tag:'每日宜忌',
     contentTypes:['每日宜忌','吉时方位','节气养生','民俗文化'], followUrl:'mp.weixin.qq.com', priority:5},
    {id:'wuxing', name:'五行养生', wxid:'wuxing_ys', region:'全国', tradition:'术数', tag:'五行调理',
     contentTypes:['五行饮食','体质调理','四季养生','经络穴位'], followUrl:'mp.weixin.qq.com', priority:4},
    {id:'gumai', name:'相学术数', wxid:'xiangshu_gs', region:'全国', tradition:'术数', tag:'面相手相',
     contentTypes:['面相分析','手相解读','体相骨相','相学案例'], followUrl:'mp.weixin.qq.com', priority:3},
    {id:'name', name:'姓名学', wxid:'xingmingxue', region:'全国', tradition:'术数', tag:'取名改名',
     contentTypes:['五格剖象','八字取名','改名案例','姓名分析'], followUrl:'mp.weixin.qq.com', priority:4},
    {id:'taiyi', name:'太乙神数', wxid:'taiyi_ss', region:'全国', tradition:'术数', tag:'三式之一',
     contentTypes:['太乙排盘','太岁分析','国运推算'], followUrl:'mp.weixin.qq.com', priority:2},
  ],

  // ═══ 综合传统文化 ═══
  culture: [
    {id:'guoxue', name:'国学精粹', wxid:'guoxue_jc', region:'全国', tradition:'儒', tag:'国学综合',
     contentTypes:['论语解读','道德经','诗经','弟子规','家训家规'], followUrl:'mp.weixin.qq.com', priority:4},
    {id:'chuantong', name:'传统文化', wxid:'ctwh_gt', region:'全国', tradition:'民俗', tag:'文化传承',
     contentTypes:['二十四节气','民俗节日','传统礼仪','非遗文化'], followUrl:'mp.weixin.qq.com', priority:4},
    {id:'yangsheng', name:'中医养生', wxid:'zyys_gt', region:'全国', tradition:'中医', tag:'养生调理',
     contentTypes:['黄帝内经','四季养生','药膳食疗','经络穴位','体质辨识'], followUrl:'mp.weixin.qq.com', priority:5},
    {id:'fojiao', name:'佛教在线', wxid:'fojiao_online', region:'全国', tradition:'佛', tag:'佛教综合',
     contentTypes:['佛学讲座','法会通知','高僧开示','佛教新闻','每日供养'], followUrl:'mp.weixin.qq.com', priority:5},
    {id:'daojiao', name:'道教之音', wxid:'daojiao_zy', region:'全国', tradition:'道', tag:'道教综合',
     contentTypes:['道法讲座','道教法会','道医养生','道教新闻','每日诵经'], followUrl:'mp.weixin.qq.com', priority:5},
    {id:'chanxiu', name:'禅修中心', wxid:'chanxiu_zx', region:'全国', tradition:'佛', tag:'禅修指导',
     contentTypes:['禅修通知','禅修指导','内观法门','生活禅'], followUrl:'mp.weixin.qq.com', priority:3},
    {id:'nongli', name:'农历网', wxid:'nongli_w', region:'全国', tradition:'民俗', tag:'农历知识',
     contentTypes:['农历转换','节气物候','民俗禁忌','传统节日'], followUrl:'mp.weixin.qq.com', priority:3},
  ]
};

// ═══ 采集与自进化系统 ═══

// 获取所有公众号列表
function getAllGzhList(){
  let all=[];
  for(let cat in GONGZHONGHAO_DB){
    GONGZHONGHAO_DB[cat].forEach(function(g){
      g.category=cat;
      all.push(g);
    });
  }
  return all;
}

// 按类别统计
function getGzhStats(){
  let stats={total:0};
  for(let cat in GONGZHONGHAO_DB){
    stats[cat]=GONGZHONGHAO_DB[cat].length;
    stats.total+=GONGZHONGHAO_DB[cat].length;
  }
  return stats;
}

// 按地区查找
function getGzhByRegion(region){
  let results=[];
  let all=getAllGzhList();
  all.forEach(function(g){
    if(g.region.indexOf(region)>=0 || region.indexOf(g.region)>=0){
      results.push(g);
    }
  });
  return results;
}

// 按传统查找
function getGzhByTradition(tradition){
  let results=[];
  let all=getAllGzhList();
  all.forEach(function(g){
    if(g.tradition===tradition) results.push(g);
  });
  return results;
}

// 内容采集记录
let GZH_COLLECT_LOG = {
  // 采集记录存储在localStorage: gzh_collect_log
  // 格式: [{gzhId, date, title, category, digest, url, processed}]
  
  getLastCollect: function(gzhId){
    try{
      let log=JSON.parse(localStorage.getItem('gzh_collect_log')||'[]');
      let last=null;
      log.forEach(function(r){if(r.gzhId===gzhId && (!last||r.date>last.date))last=r;});
      return last;
    }catch(e){return null;}
  },
  
  addRecord: function(record){
    try{
      let log=JSON.parse(localStorage.getItem('gzh_collect_log')||'[]');
      log.push(record);
      if(log.length>500) log=log.slice(-500); // 保留最近500条
      localStorage.setItem('gzh_collect_log', JSON.stringify(log));
    }catch(e){}
  },
  
  getUnprocessed: function(){
    try{
      let log=JSON.parse(localStorage.getItem('gzh_collect_log')||'[]');
      return log.filter(function(r){return !r.processed;});
    }catch(e){return [];}
  },
  
  markProcessed: function(gzhId, date){
    try{
      let log=JSON.parse(localStorage.getItem('gzh_collect_log')||'[]');
      log.forEach(function(r){
        if(r.gzhId===gzhId && r.date===date) r.processed=true;
      });
      localStorage.setItem('gzh_collect_log', JSON.stringify(log));
    }catch(e){}
  },
  
  getStats: function(){
    try{
      let log=JSON.parse(localStorage.getItem('gzh_collect_log')||'[]');
      return {
        total: log.length,
        unprocessed: log.filter(function(r){return !r.processed;}).length,
        byCategory: log.reduce(function(acc,r){
          acc[r.category]=acc[r.category]||0; acc[r.category]++; return acc;
        },{})
      };
    }catch(e){return {total:0,unprocessed:0,byCategory:{}};}
  }
};

// 内容分类与知识库映射
let CONTENT_KB_MAP = {
  '法会通知': {target:'faith_festivals', action:'update_calendar', desc:'更新佛道活动日历'},
  '佛学开示': {target:'knowledge_base', action:'supplement', desc:'补充佛学知识库'},
  '道法讲座': {target:'knowledge_base', action:'supplement', desc:'补充道学知识库'},
  '道法开示': {target:'knowledge_base', action:'supplement', desc:'补充道学知识库'},
  '儒学讲座': {target:'knowledge_base', action:'supplement', desc:'补充儒学知识库'},
  '论语解读': {target:'wisdom_quotes', action:'supplement', desc:'补充智慧语录'},
  '道德经': {target:'wisdom_quotes', action:'supplement', desc:'补充道德经语录'},
  '每日宜忌': {target:'almanac', action:'update_daily', desc:'更新每日宜忌'},
  '每日运势': {target:'daily_fortune', action:'update', desc:'更新每日运势'},
  '每日祈福': {target:'blessing', action:'update_daily', desc:'更新每日祈福'},
  '风水布局': {target:'fengshui', action:'supplement', desc:'补充风水知识'},
  '玄空飞星': {target:'fengshui', action:'supplement', desc:'补充玄空飞星'},
  '八字排盘': {target:'bazi', action:'supplement', desc:'补充八字案例'},
  '奇门排盘': {target:'qimen', action:'supplement', desc:'补充奇门案例'},
  '奇门化解': {target:'qimen', action:'supplement', desc:'补充奇门化解方案'},
  '节气养生': {target:'health', action:'update_seasonal', desc:'更新季节养生'},
  '体质调理': {target:'tizhi', action:'supplement', desc:'补充体质调理'},
  '药膳食疗': {target:'health', action:'supplement', desc:'补充药膳知识'},
  '经络穴位': {target:'health', action:'supplement', desc:'补充经络知识'},
  '二十四节气': {target:'almanac', action:'update', desc:'更新节气信息'},
  '祭孔大典': {target:'confucian_events', action:'update', desc:'更新儒学活动'},
  '道教法会': {target:'faith_festivals', action:'update_calendar', desc:'更新道教活动日历'},
  '朝山指南': {target:'temple_guide', action:'update', desc:'更新道场参拜指南'},
  '每日一卦': {target:'yijing', action:'supplement', desc:'补充易经卦例'},
  '六爻卦例': {target:'liuyao', action:'supplement', desc:'补充六爻案例'},
  '姓名分析': {target:'naming', action:'supplement', desc:'补充姓名学案例'},
  '改名案例': {target:'naming', action:'supplement', desc:'补充改名案例'},
  '太岁信仰': {target:'taisui', action:'update', desc:'更新太岁信息'},
};

// 生成采集任务列表（用于浏览器代理）
function generateCollectTasks(){
  let tasks=[];
  let all=getAllGzhList();
  all.forEach(function(g){
    g.contentTypes.forEach(function(ct){
      let map=CONTENT_KB_MAP[ct];
      if(map){
        tasks.push({
          gzhId: g.id,
          gzhName: g.name,
          wxid: g.wxid,
          contentType: ct,
          target: map.target,
          action: map.action,
          desc: map.desc,
          priority: g.priority,
          region: g.region,
          tradition: g.tradition
        });
      }
    });
  });
  return tasks;
}

// 渲染公众号管理面板（用于管理后台）
function renderGzhManagePanel(){
  let stats=getGzhStats();
  let all=getAllGzhList();
  
  let html='<div style="padding:20px">';
  html+='<h3 style="color:var(--gold);margin-bottom:16px">📡 公众号关注与采集系统</h3>';
  
  // 统计卡片
  html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin-bottom:20px">';
  html+='<div style="background:rgba(201,168,76,.06);border:1px solid rgba(201,168,76,.15);border-radius:10px;padding:14px;text-align:center">';
  html+='<div style="font-size:24px;color:var(--gold);font-weight:bold">'+stats.total+'</div>';
  html+='<div style="font-size:11px;opacity:.6">关注总数</div></div>';
  
  let cats={'buddhist':'佛教','taoist':'道教','confucian':'儒家','mountains':'名山','shushu':'术数','culture':'综合'};
  for(let cat in cats){
    if(stats[cat]){
      html+='<div style="background:rgba(155,89,182,.04);border:1px solid rgba(155,89,182,.12);border-radius:10px;padding:14px;text-align:center">';
      html+='<div style="font-size:20px;color:#9b59b6;font-weight:bold">'+stats[cat]+'</div>';
      html+='<div style="font-size:11px;opacity:.6">'+cats[cat]+'</div></div>';
    }
  }
  
  let collectStats=GZH_COLLECT_LOG.getStats();
  html+='<div style="background:rgba(46,204,113,.04);border:1px solid rgba(46,204,113,.12);border-radius:10px;padding:14px;text-align:center">';
  html+='<div style="font-size:20px;color:#2ecc71;font-weight:bold">'+collectStats.total+'</div>';
  html+='<div style="font-size:11px;opacity:.6">已采集</div></div>';
  
  html+='<div style="background:rgba(231,76,60,.04);border:1px solid rgba(231,76,60,.12);border-radius:10px;padding:14px;text-align:center">';
  html+='<div style="font-size:20px;color:#e74c3c;font-weight:bold">'+collectStats.unprocessed+'</div>';
  html+='<div style="font-size:11px;opacity:.6">待处理</div></div>';
  
  html+='</div>';
  
  // 公众号列表表格
  html+='<table style="width:100%;border-collapse:collapse;font-size:12px">';
  html+='<tr style="border-bottom:1px solid rgba(201,168,76,.2);color:var(--gold)">';
  html+='<th style="padding:8px;text-align:left">名称</th><th>类别</th><th>地区</th><th>标签</th><th>优先级</th><th>采集内容</th><th>最后采集</th></tr>';
  
  all.forEach(function(g){
    let last=GZH_COLLECT_LOG.getLastCollect(g.id);
    let lastDate=last?last.date:'未采集';
    let catLabel=cats[g.category]||g.category;
    let stars='⭐'.repeat(g.priority>3?1:0)+(g.priority>=5?'⭐':'');
    html+='<tr style="border-bottom:1px solid rgba(255,255,255,.04)">';
    html+='<td style="padding:6px">'+g.name+'</td>';
    html+='<td style="text-align:center">'+catLabel+'</td>';
    html+='<td style="text-align:center">'+g.region+'</td>';
    html+='<td style="text-align:center">'+g.tag+'</td>';
    html+='<td style="text-align:center">'+g.priority+'</td>';
    html+='<td style="font-size:10px;opacity:.6">'+g.contentTypes.slice(0,3).join('/')+(g.contentTypes.length>3?'…':'')+'</td>';
    html+='<td style="text-align:center;font-size:10px;opacity:.5">'+lastDate+'</td>';
    html+='</tr>';
  });
  
  html+='</table>';
  
  // 采集任务说明
  html+='<div style="margin-top:20px;padding:14px;background:rgba(52,152,219,.04);border:1px solid rgba(52,152,219,.12);border-radius:10px">';
  html+='<div style="font-size:13px;color:#3498db;margin-bottom:8px;font-weight:bold">🔄 自进化流程</div>';
  html+='<div style="font-size:11px;opacity:.7;line-height:1.8">';
  html+='1. 定时任务每周扫描所有公众号最新文章<br>';
  html+='2. 采集到的文章按内容类型分类存储<br>';
  html+='3. 未处理文章进入知识库审核队列<br>';
  html+='4. 审核通过的内容自动补充到对应知识库模块<br>';
  html+='5. 法会通知自动更新佛道活动日历<br>';
  html+='6. 每日宜忌/运势自动更新黄历模块<br>';
  html+='7. 术数案例补充排盘解读案例库<br>';
  html+='</div></div>';
  
  html+='</div>';
  return html;
}

// 暴露到全局
if(typeof window!=='undefined'){
  window.GONGZHONGHAO_DB=GONGZHONGHAO_DB;
  window.getAllGzhList=getAllGzhList;
  window.getGzhStats=getGzhStats;
  window.getGzhByRegion=getGzhByRegion;
  window.getGzhByTradition=getGzhByTradition;
  window.GZH_COLLECT_LOG=GZH_COLLECT_LOG;
  window.CONTENT_KB_MAP=CONTENT_KB_MAP;
  window.generateCollectTasks=generateCollectTasks;
  window.renderGzhManagePanel=renderGzhManagePanel;
}
