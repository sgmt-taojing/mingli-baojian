/**
 * 易道智鉴 · 用户反馈与积分系统
 * FEEDBACK_SYSTEM
 * 数据存储：localStorage
 * 禁止 Math.random()
 */
(function() {
  'use strict';

  // ===== 常量定义 =====
  const STORAGE_KEYS = {
    LIST: 'mlbj_feedback_list',
    POINTS: 'mlbj_feedback_points',
    STREAK: 'mlbj_feedback_streak',
    LAST_DATE: 'mlbj_feedback_last_date',
    EXCHANGE_LOG: 'mlbj_feedback_exchange_log'
  };

  // 反馈类型对应积分
  const POINT_RULES = {
    'like':    { points: 1,  label: '点赞' },
    'dislike': { points: 3,  label: '点踩' },
    'suggest': { points: 5,  label: '建议' },
    'correct': { points: 10, label: '纠错' }
  };

  // 连续反馈奖励
  const STREAK_BONUS = {
    7:  20,
    30: 100
  };

  // 积分兑换规则
  const EXCHANGE_RULES = [
    { id: 'vip_1day',   points: 100,   vipType: '常修', days: 1,   label: '1天常修会员' },
    { id: 'vip_7day',   points: 500,   vipType: '常修', days: 7,   label: '7天常修会员' },
    { id: 'vip_30day',  points: 2000,  vipType: '精进', days: 30,  label: '30天精进会员' },
    { id: 'vip_life',   points: 10000, vipType: '明道', days: -1,  label: '终身明道会员' }
  ];

  // ===== 工具函数 =====
  function _getToday() {
    let d = new Date()
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function _getYesterday() {
    let d = new Date(Date.now() - 86400000)
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function _load(key, defaultVal) {
    try {
      let v = localStorage.getItem(key)
      return v ? JSON.parse(v) : defaultVal;
    } catch(e) {
      return defaultVal;
    }
  }

  function _save(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch(e) {
      console.warn('[FEEDBACK] 保存失败:', key);
    }
  }

  function _dateDiffDays(d1, d2) {
    let date1 = new Date(d1)
    let date2 = new Date(d2)
    return Math.round((date2 - date1) / 86400000);
  }

  // ===== 核心API =====

  /**
   * 提交反馈
   * @param {string} type - like/dislike/suggest/correct
   * @param {string} content - 反馈内容
   * @param {string} target - daily_push/bazi/qimen/other
   * @param {string} [screenshot] - 可选截图base64
   * @returns {object} { success, points, streakBonus, totalPoints }
   */
  function submit(type, content, target, screenshot) {
    if (!POINT_RULES[type]) {
      return { success: false, message: '无效的反馈类型' };
    }
    if (!content || !content.trim()) {
      return { success: false, message: '请填写反馈内容' };
    }
    if (content.length > 500) {
      return { success: false, message: '反馈内容不能超过500字' };
    }

    let today = _getToday()
    let list = _load(STORAGE_KEYS.LIST, [])
    let points = _load(STORAGE_KEYS.POINTS, 0)
    let streak = _load(STORAGE_KEYS.STREAK, 0)
    let lastDate = _load(STORAGE_KEYS.LAST_DATE, '')
    // 计算连续天数
    if (lastDate === today) {
      // 今天已反馈，不增加连续天数
    } else if (lastDate === _getYesterday()) {
      streak = streak + 1;
    } else {
      streak = 1;
    }

    // 基础积分
    let earnPoints = POINT_RULES[type].points
    // 连续反馈奖励（仅在达到7天或30天时触发）
    const streakBonus = 0
    if (STREAK_BONUS[streak]) {
      streakBonus = STREAK_BONUS[streak];
    }

    let totalEarn = earnPoints + streakBonus
    points += totalEarn;

    // 构造反馈记录
    let record = {
      id: 'fb_' + Date.now(),
      type: type,
      typeLabel: POINT_RULES[type].label,
      content: content.trim(),
      target: target,
      targetLabel: _getTargetLabel(target),
      screenshot: screenshot || null,
      points: earnPoints,
      streakBonus: streakBonus,
      status: 'pending',
      createTime: new Date().toISOString(),
      date: today
    };

    list.unshift(record);
    if (list.length > 200) list = list.slice(0, 200);

    _save(STORAGE_KEYS.LIST, list);
    _save(STORAGE_KEYS.POINTS, points);
    _save(STORAGE_KEYS.STREAK, streak);
    _save(STORAGE_KEYS.LAST_DATE, today);

    return {
      success: true,
      points: earnPoints,
      streakBonus: streakBonus,
      totalEarned: totalEarn,
      totalPoints: points,
      streak: streak,
      record: record
    };
  }

  function _getTargetLabel(target) {
    let map = {
      'daily_push': '今日推送',
      'bazi': '八字排盘',
      'qimen': '奇门排盘',
      'other': '其他功能'
    };
    return map[target] || target;
  }

  /**
   * 获取当前积分
   */
  function getPoints() {
    return _load(STORAGE_KEYS.POINTS, 0);
  }

  /**
   * 获取反馈历史
   */
  function getHistory() {
    return _load(STORAGE_KEYS.LIST, []);
  }

  /**
   * 获取连续反馈天数
   */
  function getStreak() {
    return _load(STORAGE_KEYS.STREAK, 0);
  }

  /**
   * 积分兑换会员
   * @param {string} ruleId - 兑换规则ID
   * @returns {object} { success, message, vipType, days }
   */
  function exchange(ruleId) {
    let rule = null
    for (let i = 0; i < EXCHANGE_RULES.length; i++) {
      if (EXCHANGE_RULES[i].id === ruleId) {
        rule = EXCHANGE_RULES[i];
        break;
      }
    }
    if (!rule) {
      return { success: false, message: '无效的兑换选项' };
    }

    let points = _load(STORAGE_KEYS.POINTS, 0)
    if (points < rule.points) {
      return { success: false, message: '积分不足，还差' + (rule.points - points) + '积分' };
    }

    // 扣减积分
    points -= rule.points;
    _save(STORAGE_KEYS.POINTS, points);

    // 记录兑换日志
    let log = _load(STORAGE_KEYS.EXCHANGE_LOG, [])
    log.unshift({
      id: 'ex_' + Date.now(),
      ruleId: ruleId,
      points: rule.points,
      vipType: rule.vipType,
      days: rule.days,
      label: rule.label,
      time: new Date().toISOString()
    });
    _save(STORAGE_KEYS.EXCHANGE_LOG, log);

    // 更新会员状态（与现有VIP系统对接）
    _updateVipStatus(rule);

    return {
      success: true,
      message: '兑换成功！' + rule.label,
      vipType: rule.vipType,
      days: rule.days,
      remainingPoints: points
    };
  }

  function _updateVipStatus(rule) {
    // 尝试与现有VIP系统对接
    const vipKey = 'mlbj_vip_info'
    let vipInfo = _load(vipKey, null)
    let now = new Date()
    if (!vipInfo || vipInfo.expireDate === 'expired') {
      vipInfo = {
        level: rule.vipType,
        startDate: now.toISOString().slice(0, 10),
        expireDate: rule.days === -1 ? '永久' : _addDays(now, rule.days),
        source: 'feedback_exchange'
      };
    } else {
      // 在原有基础上延长
      if (rule.days === -1) {
        vipInfo.level = '明道';
        vipInfo.expireDate = '永久';
      } else {
        // 升级会员等级
        const levelOrder = { '常修': 1, '精进': 2, '明道': 3 }
        if (levelOrder[rule.vipType] > levelOrder[vipInfo.level]) {
          vipInfo.level = rule.vipType;
        }
        if (vipInfo.expireDate !== '永久') {
          let baseDate = new Date(vipInfo.expireDate)
          if (baseDate < now) baseDate = now;
          vipInfo.expireDate = _addDays(baseDate, rule.days);
        }
      }
      vipInfo.source = 'feedback_exchange';
    }

    _save(vipKey, vipInfo);
  }

  function _addDays(date, days) {
    let d = new Date(date)
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  /**
   * 获取兑换记录
   */
  function getExchangeLog() {
    return _load(STORAGE_KEYS.EXCHANGE_LOG, []);
  }

  /**
   * 获取统计数据
   */
  function getStats() {
    let list = _load(STORAGE_KEYS.LIST, [])
    let points = _load(STORAGE_KEYS.POINTS, 0)
    let streak = _load(STORAGE_KEYS.STREAK, 0)
    let exchangeLog = _load(STORAGE_KEYS.EXCHANGE_LOG, [])
    let stats = {
      totalFeedback: list.length,
      totalPoints: points,
      currentStreak: streak,
      totalExchanged: exchangeLog.length,
      byType: { like: 0, dislike: 0, suggest: 0, correct: 0 },
      byTarget: {},
      adopted: 0,
      pending: 0
    };

    list.forEach(function(item) {
      if (stats.byType[item.type] !== undefined) {
        stats.byType[item.type]++;
      }
      let tl = item.targetLabel || item.target
      stats.byTarget[tl] = (stats.byTarget[tl] || 0) + 1;
      if (item.status === 'adopted') stats.adopted++;
      if (item.status === 'pending') stats.pending++;
    });

    stats.adoptionRate = stats.totalFeedback > 0
      ? Math.round(stats.adopted / stats.totalFeedback * 100) : 0;

    return stats;
  }

  /**
   * 获取兑换规则列表
   */
  function getExchangeRules() {
    return EXCHANGE_RULES.map(function(r) {
      return {
        id: r.id,
        points: r.points,
        vipType: r.vipType,
        days: r.days,
        label: r.label,
        affordable: _load(STORAGE_KEYS.POINTS, 0) >= r.points
      };
    });
  }

  /**
   * 获取反馈权重（供推送脚本使用）
   * 根据历史反馈数据计算各模块的权重调整
   * @returns {object} { daily_push, bazi, qimen, other }
   */
  function getModuleWeights() {
    let list = _load(STORAGE_KEYS.LIST, [])
    let weights = {
      daily_push: 1.0,
      bazi: 1.0,
      qimen: 1.0,
      other: 1.0
    };

    const counts = {}
    list.forEach(function(item) {
      let key = item.target || 'other'
      if (!counts[key]) counts[key] = { like: 0, dislike: 0, suggest: 0, correct: 0 };
      if (counts[key][item.type] !== undefined) {
        counts[key][item.type]++;
      }
    });

    Object.keys(counts).forEach(function(key) {
      let c = counts[key]
      let likeScore = c.like * 0.05
      let dislikeScore = c.dislike * 0.08
      let suggestScore = c.suggest * 0.03
      let correctScore = c.correct * 0.02
      // 点赞多 → 权重提升；点踩多 → 权重降低
      let adjust = likeScore + suggestScore - dislikeScore - correctScore
      // 限制在 0.5 ~ 1.5 范围
      weights[key] = Math.max(0.5, Math.min(1.5, 1.0 + adjust));
    });

    return weights;
  }

  /**
   * 获取常见问题（高频反馈内容关键词）
   */
  function getTopIssues(limit) {
    limit = limit || 5;
    let list = _load(STORAGE_KEYS.LIST, [])
    const targetCounts = {}
    list.forEach(function(item) {
      let tl = item.targetLabel || item.target
      if (!targetCounts[tl]) targetCounts[tl] = { count: 0, samples: [] };
      targetCounts[tl].count++;
      if (targetCounts[tl].samples.length < 3) {
        targetCounts[tl].samples.push(item.content.substring(0, 50));
      }
    });

    let sorted = Object.keys(targetCounts)
      .map(function(k) { return { target: k, count: targetCounts[k].count, samples: targetCounts[k].samples }; })
      .sort(function(a, b) { return b.count - a.count; })
      .slice(0, limit);

    return sorted;
  }

  // ===== 导出 =====
  window.FEEDBACK_SYSTEM = {
    submit: submit,
    getPoints: getPoints,
    getHistory: getHistory,
    getStreak: getStreak,
    exchange: exchange,
    getExchangeLog: getExchangeLog,
    getExchangeRules: getExchangeRules,
    getStats: getStats,
    getModuleWeights: getModuleWeights,
    getTopIssues: getTopIssues,
    POINT_RULES: POINT_RULES,
    EXCHANGE_RULES: EXCHANGE_RULES,
    STREAK_BONUS: STREAK_BONUS
  };

})();
try { window.FEEDBACK_SYSTEM = FEEDBACK_SYSTEM; } catch(e){}
