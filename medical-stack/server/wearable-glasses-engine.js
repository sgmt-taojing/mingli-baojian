/**
 * 命理宝鉴·医道 智能眼镜传感器联动引擎 V1.0
 * 6传感器融合 + 距离触发 + 光线联动 + 陀螺仪矫正 + 红外体温 + 语音双链路
 */

// ═══════════════════════════════════════════
// 传感器阈值配置
// ═══════════════════════════════════════════
const SENSOR_CONFIG = {
  distance: {
    tongue_zone:  { min: 5,  max: 15,  unit: 'cm', camera: 'macro', mode: 'tongue' },
    hand_zone:    { min: 30, max: 45,  unit: 'cm', camera: 'main',  mode: 'hand' },
    face_zone:    { min: 50, max: 80,  unit: 'cm', camera: 'main',  mode: 'face' },
    pulse_zone:   { min: 0,  max: 3,   unit: 'cm', camera: 'none',  mode: 'pulse' },
    idle:         { min: 81, max: 999,  unit: 'cm', camera: 'none',  mode: 'standby' }
  },
  light: {
    very_low:  { min: 0,   max: 99,   unit: 'lux', fill_power: 100, exposure_comp: 2.0 },
    low:       { min: 100, max: 399,  unit: 'lux', fill_power: 50,  exposure_comp: 1.0 },
    optimal:   { min: 400, max: 700,  unit: 'lux', fill_power: 0,   exposure_comp: 0 },
    bright:    { min: 701, max: 2000, unit: 'lux', fill_power: 0,   exposure_comp: -1.0 },
    too_bright:{ min: 2001,max:99999,unit: 'lux', fill_power: 0,   exposure_comp: -2.0 }
  },
  gyroscope: {
    pitch_max: 3.0,      // 俯仰角容差(度)
    roll_max:  5.0,      // 翻滚角容差(度)
    yaw_max:   8.0,      // 偏航角容差(度)
    shake_g:   0.02,     // 抖动阈值(g)
    stable_wait_ms: 500, // 稳定等待最大时间
    correction_ms: 15    // 画面矫正响应时间
  },
  temperature: {
    fever_threshold: 37.5,  // °C
    hypothermia: 35.0,      // 低体温
    normal_low: 36.0,
    normal_high: 37.3
  },
  humidity: {
    optimal_low: 40,
    optimal_high: 60,
    dry_alert: 30
  },
  microphone: {
    vad_threshold: -26,    // dBFS 语音活动检测
    noise_floor: -60,
    silence_timeout_ms: 3000,
    wake_words: ['开始问诊','记录症状','哪里不舒服','伸舌头','看一下舌头','我看一下']
  }
};

// ═══════════════════════════════════════════
// 设备状态机
// ═══════════════════════════════════════════
class WearableStateMachine {
  constructor() {
    this.current = 'standby';
    this.previous = null;
    this.sensorReadings = {};
    this.sessionLog = [];
    this.errorCount = 0;
  }

  transition(newState, trigger) {
    this.previous = this.current;
    this.current = newState;
    this.sessionLog.push({
      timestamp: Date.now(),
      from: this.previous,
      to: this.current,
      trigger,
      readings: { ...this.sensorReadings }
    });
    return this.current;
  }

  getState() { return this.current; }
  getHistory() { return this.sessionLog; }
}

// ═══════════════════════════════════════════
// 主传感器融合循环
// ═══════════════════════════════════════════
class SensorFusionEngine {
  constructor() {
    this.state = new WearableStateMachine();
    this.camera = { active: 'main', macro_engaged: false };
    this.fillLight = { power: 0 };
    this.gyroCorrection = { pitch: 0, roll: 0, yaw: 0, stabilized: true };
    this.lastShake = 0;
  }

  /**
   * 主循环入口 — 每10ms调用一次(100Hz)
   * @param {Object} readings 传感器读数
   * @returns {Object} 控制指令
   */
  tick(readings) {
    this.state.sensorReadings = readings;
    const commands = {
      camera_action: null,
      fill_light: null,
      gyro_correction: null,
      temperature_alert: null,
      voice_prompt: null,
      mode: this.state.current
    };

    // ─── 距离传感器 → 模式切换 ───
    const distZone = this.classifyDistance(readings.distance_cm);
    if (distZone.mode !== this.state.current && distZone.mode !== 'idle') {
      this.state.transition(distZone.mode, `distance=${readings.distance_cm}cm`);
      commands.mode = distZone.mode;

      switch (distZone.mode) {
        case 'tongue':
          commands.camera_action = 'switch_to_macro';
          commands.voice_prompt = '请自然伸舌，保持3秒';
          break;
        case 'face':
          commands.camera_action = 'switch_to_main_face_mode';
          commands.voice_prompt = '请正对镜头';
          break;
        case 'hand':
          commands.camera_action = 'main_near_mode';
          commands.voice_prompt = '请将手掌平伸';
          break;
        case 'pulse':
          commands.camera_action = 'none';
          commands.voice_prompt = '脉诊采集中，请保持手腕静止';
          break;
      }
    }

    // 距离<5cm 过近警告
    if (readings.distance_cm < 5 && readings.distance_cm > 0) {
      commands.voice_prompt = '请稍微后退，距离太近';
    }

    // ─── 光线传感器 → 补光联动 ───
    const lightLevel = this.classifyLight(readings.light_lux);
    commands.fill_light = {
      power: lightLevel.fill_power,
      exposure_comp: lightLevel.exposure_comp
    };
    this.fillLight.power = lightLevel.fill_power;

    // ─── 陀螺仪 → 画面矫正 ───
    commands.gyro_correction = this.processGyro(readings.gyroscope);

    // ─── 红外体温 → 发热标记 ───
    if (readings.temperature_c >= SENSOR_CONFIG.temperature.fever_threshold) {
      commands.temperature_alert = {
        level: 'fever',
        value: readings.temperature_c,
        message: `⚠️ 体温偏高: ${readings.temperature_c.toFixed(1)}°C`
      };
    }

    // ─── 湿度传感器 → 环境提示 ───
    if (readings.humidity_pct < SENSOR_CONFIG.humidity.dry_alert) {
      commands.voice_prompt = commands.voice_prompt || '环境偏干燥，建议使用加湿器';
    }

    return commands;
  }

  /**
   * 距离分区判定
   */
  classifyDistance(distanceCm) {
    if (distanceCm === null || distanceCm === undefined) return SENSOR_CONFIG.distance.idle;
    
    for (const [zoneName, zone] of Object.entries(SENSOR_CONFIG.distance)) {
      if (distanceCm >= zone.min && distanceCm < zone.max) {
        return { ...zone, zone: zoneName };
      }
    }
    return SENSOR_CONFIG.distance.idle;
  }

  /**
   * 光线等级判定
   */
  classifyLight(lux) {
    if (lux === null || lux === undefined) return SENSOR_CONFIG.light.optimal;
    
    for (const [level, cfg] of Object.entries(SENSOR_CONFIG.light)) {
      if (lux >= cfg.min && lux < cfg.max) return cfg;
    }
    return SENSOR_CONFIG.light.optimal;
  }

  /**
   * 陀螺仪数据处理
   */
  processGyro(gyro) {
    if (!gyro) return { stabilized: true, pitch: 0, roll: 0, yaw: 0 };

    const cfg = SENSOR_CONFIG.gyroscope;
    const result = { stabilized: true, pitch: 0, roll: 0, yaw: 0, action: null };

    // 画面矫正
    if (Math.abs(gyro.pitch) > cfg.pitch_max) {
      result.pitch = -gyro.pitch;  // 反向矫正
      result.stabilized = false;
      result.action = 'rotate_pitch';
    }
    if (Math.abs(gyro.roll) > cfg.roll_max) {
      result.roll = -gyro.roll;
      result.stabilized = false;
      result.action = (result.action || '') + '+rotate_roll';
    }

    // 抖动检测
    if (gyro.shake && gyro.shake > cfg.shake_g) {
      const now = Date.now();
      if (now - this.lastShake < cfg.stable_wait_ms) {
        result.stabilized = false;
        result.action = 'wait_stable';
      }
      this.lastShake = now;
    }

    this.gyroCorrection = result;
    return result;
  }

  /**
   * 摄像头分时调度
   */
  getCameraSchedule(mode) {
    if (mode === 'tongue') return {
      camera: 'macro',
      fps: 15,
      tasks: [
        { name: 'tongue_segmentation', every_n_frames: 3 },
        { name: 'tongue_classification', every_n_frames: 15 },
        { name: 'nail_detail', every_n_frames: 10 }
      ],
      timeout_ms: 10000
    };

    if (mode === 'face') return {
      camera: 'main',
      fps: 30,
      tasks: [
        { name: 'face_detection', every_n_frames: 3 },
        { name: 'face_region_split', every_n_frames: 15 },
        { name: 'complexion_analysis', every_n_frames: 30 }
      ]
    };

    if (mode === 'hand') return {
      camera: 'main',
      fps: 20,
      tasks: [
        { name: 'hand_detection', every_n_frames: 3 },
        { name: 'palm_color', every_n_frames: 10 },
        { name: 'nail_check', every_n_frames: 10 }
      ]
    };

    return { camera: 'main', fps: 1, tasks: [{ name: 'standby', every_n_frames: 60 }] };
  }
}

// ═══════════════════════════════════════════
// 语音唤醒+问诊结构化
// ═══════════════════════════════════════════
class VoiceInquiryEngine {
  constructor() {
    this.buffer = [];
    this.extractionRules = [
      { field: 'duration', pattern: /(多久|几天|几个星期|几个月|几年|多少天)/, type: 'time' },
      { field: 'onset', pattern: /(从|自从|最开始|一开始)(.+?)(开始|起)/, type: 'event' },
      { field: 'location', pattern: /(头|胸|腹|腰|背|关节|胃|心|肝|肺|肾|喉咙|嗓子|眼睛|耳朵)/, type: 'body_part' },
      { field: 'symptom', pattern: /(痛|疼|酸|胀|麻|痒|咳|晕|吐|泻|便秘|失眠|恶心|出血)/, type: 'symptom' },
      { field: 'severity', pattern: /(很|非常|严重|厉害|受不了|轻微|有点|稍微|特别)/, type: 'degree' },
      { field: 'trigger', pattern: /(吃了|喝了|受了|吹了|淋了|熬夜|生气|着凉|累)/, type: 'cause' },
      { field: 'history', pattern: /(以前|原来|过去|一直有|老毛病|高血压|糖尿病|心脏病|过敏)/, type: 'past' },
      { field: 'medication', pattern: /(吃了药|服用|药物|药片|中药|西药|停药)/, type: 'drug' },
      { field: 'diet', pattern: /(吃不下|没胃口|不想吃|暴食|厌食|偏食)/, type: 'diet' },
      { field: 'sleep_issue', pattern: /(睡不着|失眠|多梦|易醒|早醒|嗜睡|睡不醒)/, type: 'sleep' }
    ];

    this.followUpQuestions = {
      duration: '这种情况持续多久了？',
      location: '具体是哪个部位不舒服？',
      severity: '疼痛/不适程度如何？1-5分，5分最严重',
      symptom_undefined: '能再详细描述一下具体怎么不舒服吗？',
      trigger: '当时有没有受凉或者吃了什么东西？',
      history: '以前有过类似情况吗？有没有高血压、糖尿病这些？',
      complete: '好的，我已经记下了。还有其他不舒服吗？'
    };
  }

  /**
   * 处理语音转写文本，提取结构化问诊信息
   */
  processTranscript(text, context = {}) {
    const result = {
      raw_text: text,
      extracted: {},
      missing_fields: [],
      follow_up_question: null,
      confidence: 0
    };

    let matchCount = 0;
    for (const rule of this.extractionRules) {
      const match = text.match(rule.pattern);
      if (match) {
        result.extracted[rule.field] = {
          value: match[1] || match[0],
          type: rule.type,
          raw_match: match[0]
        };
        matchCount++;
      }
    }

    result.confidence = matchCount / this.extractionRules.length;

    // 检查缺失字段，生成追问
    const criticalFields = ['location', 'symptom', 'duration'];
    for (const field of criticalFields) {
      if (!result.extracted[field]) {
        result.missing_fields.push(field);
      }
    }

    if (result.missing_fields.length === 0) {
      result.follow_up_question = this.followUpQuestions.complete;
    } else {
      const firstMissing = result.missing_fields[0];
      result.follow_up_question = this.followUpQuestions[firstMissing] || 
                                    this.followUpQuestions.symptom_undefined;
    }

    return result;
  }

  /**
   * 语音活动检测 (VAD)
   */
  detectVoiceActivity(audioLevelDb) {
    return audioLevelDb > SENSOR_CONFIG.microphone.vad_threshold;
  }

  /**
   * 检测唤醒词
   */
  detectWakeWord(text) {
    return SENSOR_CONFIG.microphone.wake_words.some(w => text.includes(w));
  }
}

// ═══════════════════════════════════════════
// 四诊分区标定引擎
// ═══════════════════════════════════════════
class RegionCalibrationEngine {
  /**
   * 面部五区分割 (基于MediaPipe 468关键点索引)
   */
  getFaceRegions(landmarks) {
    // landmarks: MediaPipe Face Mesh 的468个关键点数组
    if (!landmarks || landmarks.length < 468) return null;

    return {
      forehead: {
        keypoints: [9, 107, 336, 10, 151, 337, 108, 109],
        bbox: this.calculateBbox(landmarks, [9, 107, 336, 10]),
        tcm_region: '上庭',
        associated_organ: '心'
      },
      left_cheek: {
        keypoints: [50, 119, 101, 36, 205, 206],
        bbox: this.calculateBbox(landmarks, [50, 119, 101, 36]),
        tcm_region: '左颊',
        associated_organ: '肝'
      },
      right_cheek: {
        keypoints: [330, 348, 266, 425, 426],
        bbox: this.calculateBbox(landmarks, [330, 348, 266, 425]),
        tcm_region: '右颊',
        associated_organ: '肺'
      },
      nose: {
        keypoints: [1, 2, 98, 327, 168, 6],
        bbox: this.calculateBbox(landmarks, [1, 2, 98, 327]),
        tcm_region: '鼻部',
        associated_organ: '脾'
      },
      chin: {
        keypoints: [152, 176, 400, 377, 378],
        bbox: this.calculateBbox(landmarks, [152, 176, 377, 400]),
        tcm_region: '下颏',
        associated_organ: '肾'
      }
    };
  }

  calculateBbox(landmarks, indices) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const i of indices) {
      if (landmarks[i]) {
        minX = Math.min(minX, landmarks[i].x);
        minY = Math.min(minY, landmarks[i].y);
        maxX = Math.max(maxX, landmarks[i].x);
        maxY = Math.max(maxY, landmarks[i].y);
      }
    }
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  /**
   * 面色分类 (Lab色彩空间)
   */
  classifyComplexion(rgbAvg) {
    // 简化的Lab变换 + KNN分类
    // 输入: {r, g, b} 0-255
    // 输出: 面色类别
    const lab = this.rgbToLab(rgbAvg.r, rgbAvg.g, rgbAvg.b);
    
    const categories = [
      { name: '明润', L: 70, a: 15, b: 20 },
      { name: '晦暗', L: 40, a: 10, b: 15 },
      { name: '潮红', L: 60, a: 35, b: 25 },
      { name: '苍白', L: 75, a: 8,  b: 10 },
      { name: '萎黄', L: 65, a: 12, b: 40 },
      { name: '黧黑', L: 30, a: 8,  b: 12 }
    ];

    let minDist = Infinity, bestCategory = '明润';
    for (const cat of categories) {
      const dist = Math.sqrt(
        (lab.L - cat.L) ** 2 + (lab.a - cat.a) ** 2 + (lab.b - cat.b) ** 2
      );
      if (dist < minDist) { minDist = dist; bestCategory = cat.name; }
    }
    return bestCategory;
  }

  rgbToLab(r, g, b) {
    // 简化RGB → Lab转换
    let rr = r / 255, gg = g / 255, bb = b / 255;
    rr = rr > 0.04045 ? Math.pow((rr + 0.055) / 1.055, 2.4) : rr / 12.92;
    gg = gg > 0.04045 ? Math.pow((gg + 0.055) / 1.055, 2.4) : gg / 12.92;
    bb = bb > 0.04045 ? Math.pow((bb + 0.055) / 1.055, 2.4) : bb / 12.92;
    
    let x = (rr * 0.4124 + gg * 0.3576 + bb * 0.1805) / 0.95047;
    let y = (rr * 0.2126 + gg * 0.7152 + bb * 0.0722);
    let z = (rr * 0.0193 + gg * 0.1192 + bb * 0.9505) / 1.08883;
    
    x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
    y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
    z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;
    
    return { L: (116 * y) - 16, a: 500 * (x - y), b: 200 * (y - z) };
  }
}

// ═══════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════
module.exports = {
  SENSOR_CONFIG,
  WearableStateMachine,
  SensorFusionEngine,
  VoiceInquiryEngine,
  RegionCalibrationEngine
};
