/**
 * 命理宝鉴·医道 智能穿戴设备 API V1.0
 * 支持：舌诊仪/面诊仪/脉诊手环/问诊语音设备
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// ═══ 设备类型 ═══
const DEVICE_TYPES = {
  tongue_camera: {
    name: '舌诊采集仪',
    protocol: 'HTTP/REST',
    data_format: 'image/jpeg',
    sample_rate: '单次拍摄',
    fields: ['tongue_image', 'light_condition', 'color_temperature', 'device_id']
  },
  face_camera: {
    name: '面诊采集仪',
    protocol: 'HTTP/REST',
    data_format: 'image/jpeg',
    sample_rate: '单次拍摄',
    fields: ['face_image', 'light_condition', 'facial_regions', 'device_id']
  },
  pulse_wristband: {
    name: '脉诊手环',
    protocol: 'BLE/HTTP',
    data_format: 'JSON',
    sample_rate: '100Hz',
    fields: ['pulse_waveform', 'heart_rate', 'pulse_depth', 'pulse_speed', 'pulse_regularity', 'device_id']
  },
  inquiry_device: {
    name: '问诊语音终端',
    protocol: 'HTTP/REST',
    data_format: 'audio/wav',
    sample_rate: '16kHz',
    fields: ['audio_file', 'transcript', 'device_id']
  },
  body_thermometer: {
    name: '红外体温仪',
    protocol: 'BLE',
    data_format: 'JSON',
    fields: ['temperature', 'region', 'device_id']
  }
};

// ═══ 设备注册 ═══
const DATA_DIR = path.join(__dirname, '..', 'data');
const DEVICES_FILE = path.join(DATA_DIR, 'wearable-devices.json');

function loadDevices() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    return JSON.parse(fs.readFileSync(DEVICES_FILE, 'utf-8'));
  } catch {
    const defaults = {
      'TCM-TONGUE-001': {
        id: 'TCM-TONGUE-001',
        type: 'tongue_camera',
        name: '舌诊仪 #1',
        dept: '内科',
        status: 'online',
        registered_at: new Date().toISOString(),
        last_seen: null,
        firmware: 'v1.2.0',
        calibration: { color_profile: 'D65', white_balance: 5500, last_calibrated: null }
      },
      'TCM-FACE-001': {
        id: 'TCM-FACE-001',
        type: 'face_camera',
        name: '面诊仪 #1',
        dept: '内科',
        status: 'online',
        registered_at: new Date().toISOString(),
        last_seen: null,
        firmware: 'v1.1.5',
        calibration: { light_source: 'D50', resolution: '1920x1080' }
      },
      'TCM-PULSE-001': {
        id: 'TCM-PULSE-001',
        type: 'pulse_wristband',
        name: '脉诊手环 #1',
        dept: '针灸科',
        status: 'online',
        registered_at: new Date().toISOString(),
        last_seen: null,
        firmware: 'v2.0.1',
        battery: 85
      }
    };
    saveDevices(defaults);
    return defaults;
  }
}

function saveDevices(devices) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DEVICES_FILE, JSON.stringify(devices, null, 2));
}

// ═══ 设备数据接收 ═══
function receiveDeviceData(deviceId, dataType, payload) {
  const devices = loadDevices();
  const device = devices[deviceId];
  if (!device) return { ok: false, error: '设备未注册' };
  if (device.status !== 'online') return { ok: false, error: '设备离线' };

  // 质量检查
  const qcResult = runQualityCheck(device.type, payload);
  if (!qcResult.passed) {
    return {
      ok: false,
      qc_failed: true,
      reason: qcResult.reason,
      suggestions: qcResult.suggestions
    };
  }

  // 标准化数据
  const standardized = standardizeData(device.type, payload);
  
  // 更新设备状态
  device.last_seen = new Date().toISOString();
  saveDevices(devices);

  return {
    ok: true,
    device_id: deviceId,
    device_type: device.type,
    timestamp: new Date().toISOString(),
    data: standardized,
    quality: qcResult
  };
}

// ═══ 质量检查 ═══
function runQualityCheck(deviceType, payload) {
  const checks = {
    tongue_camera: () => {
      const issues = [];
      if (payload.light_condition && payload.light_condition < 300) 
        issues.push('环境光线不足（<300 lux），请补充光源');
      if (payload.color_temperature && (payload.color_temperature < 4000 || payload.color_temperature > 7000))
        issues.push('色温偏差（建议4000-7000K），请调整白平衡');
      return {
        passed: issues.length === 0,
        reason: issues.join('; '),
        suggestions: issues.length ? ['靠近自然光窗口', '开启环形补光灯', '重新校准白平衡'] : [],
        score: issues.length === 0 ? 0.95 : Math.max(0.3, 1 - issues.length * 0.2)
      };
    },
    face_camera: () => {
      const issues = [];
      if (payload.light_condition && payload.light_condition < 250)
        issues.push('面部光线不足');
      return {
        passed: issues.length === 0,
        reason: issues.join('; '),
        suggestions: issues.length ? ['调整患者位置靠近光源', '开启面诊补光灯'] : [],
        score: issues.length === 0 ? 0.92 : 0.4
      };
    },
    pulse_wristband: () => {
      const issues = [];
      if (payload.signal_quality && payload.signal_quality < 0.7)
        issues.push('脉象信号质量低，请调整手环位置');
      if (!payload.pulse_regularity)
        issues.push('脉搏波形不完整');
      return {
        passed: issues.length === 0,
        reason: issues.join('; '),
        suggestions: ['调整手环至腕横纹处', '确保皮肤接触良好', '患者保持静息状态3分钟'],
        score: issues.length === 0 ? 0.88 : 0.5
      };
    }
  };

  const checker = checks[deviceType];
  return checker ? checker() : { passed: true, reason: '', suggestions: [], score: 0.9 };
}

// ═══ 数据标准化 ═══
function standardizeData(deviceType, payload) {
  const standardizers = {
    tongue_camera: (p) => ({
      tongue_image: p.tongue_image || p.image_data,
      light_condition_lux: p.light_condition || null,
      color_temperature_k: p.color_temperature || null,
      device_id: p.device_id,
      format: 'JPEG',
      quality: 'high'
    }),
    face_camera: (p) => ({
      face_image: p.face_image || p.image_data,
      regions: p.facial_regions ? JSON.parse(p.facial_regions) : null,
      light_condition_lux: p.light_condition || null,
      device_id: p.device_id
    }),
    pulse_wristband: (p) => ({
      pulse_waveform_base64: p.pulse_waveform || null,
      heart_rate_bpm: p.heart_rate || null,
      pulse_depth: p.pulse_depth || '中',  // 浮/中/沉
      pulse_speed: p.pulse_speed || '中',  // 数/缓/迟
      pulse_strength: p.pulse_strength || '中', // 有力/无力
      pulse_regularity: p.pulse_regularity || '规则',
      device_id: p.device_id
    }),
    inquiry_device: (p) => ({
      transcript: p.transcript || '',
      audio_length_sec: p.audio_length || null,
      language: p.language || 'zh-CN',
      device_id: p.device_id
    }),
    body_thermometer: (p) => ({
      temperature_celsius: p.temperature || null,
      region: p.region || 'forehead',
      device_id: p.device_id
    })
  };

  const standardizer = standardizers[deviceType];
  return standardizer ? standardizer(payload) : payload;
}

/**
 * 将所有穿戴设备数据合并为四诊报告
 */
function mergeWearableToDiagnosis(deviceDataList) {
  const report = {
    tongue: null,
    face: null,
    pulse: null,
    inquiry: null,
    body_temp: null,
    devices_used: [],
    merged_at: new Date().toISOString()
  };

  for (const dd of deviceDataList) {
    if (!dd.ok) continue;
    report.devices_used.push({ id: dd.device_id, type: dd.device_type });

    switch (dd.device_type) {
      case 'tongue_camera':
        report.tongue = dd.data;
        break;
      case 'face_camera':
        report.face = dd.data;
        break;
      case 'pulse_wristband':
        report.pulse = dd.data;
        break;
      case 'inquiry_device':
        report.inquiry = dd.data;
        break;
      case 'body_thermometer':
        report.body_temp = dd.data;
        break;
    }
  }

  // 判断四诊完整度
  const methods = [report.tongue, report.face, report.pulse, report.inquiry].filter(Boolean);
  report.completeness = methods.length / 4;
  report.status = report.completeness >= 0.75 ? 'complete' : report.completeness >= 0.5 ? 'partial' : 'minimal';

  return report;
}

/**
 * 设备列表（供前端选择）
 */
function getAvailableDevices(dept = null) {
  const devices = loadDevices();
  const list = Object.values(devices);
  if (dept) return list.filter(d => d.dept === dept && d.status === 'online');
  return list.filter(d => d.status === 'online');
}

module.exports = {
  DEVICE_TYPES,
  receiveDeviceData,
  mergeWearableToDiagnosis,
  getAvailableDevices,
  loadDevices,
  runQualityCheck
};
