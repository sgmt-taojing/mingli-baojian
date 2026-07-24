// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · Unit Tests — data-export-guard.js
// ═══════════════════════════════════════════════════════════════

const {
  SENSITIVE_FIELDS,
  ROLE_LEVELS,
  sanitizeRow,
  sanitizeRows,
  generateWatermark,
  maskName,
  maskAddress,
  maskIDCard,
  maskTextHigh,
  maskTextMid,
  rowsToCSV,
  rowsToJSON,
} = require('../../server/data-export-guard.js');

describe('SENSITIVE_FIELDS', () => {
  test('包含 users / merchants / master_cases 表', () => {
    expect(SENSITIVE_FIELDS).toHaveProperty('users');
    expect(SENSITIVE_FIELDS).toHaveProperty('merchants');
    expect(SENSITIVE_FIELDS).toHaveProperty('master_cases');
  });

  test('users 表包含 phone 和 name 字段', () => {
    expect(SENSITIVE_FIELDS.users).toHaveProperty('phone');
    expect(SENSITIVE_FIELDS.users).toHaveProperty('name');
    expect(SENSITIVE_FIELDS.users.phone.type).toBe('phone');
    expect(SENSITIVE_FIELDS.users.name.type).toBe('name');
  });

  test('每个字段配置有 type 和 level', () => {
    for (const [table, fields] of Object.entries(SENSITIVE_FIELDS)) {
      for (const [fieldName, cfg] of Object.entries(fields)) {
        expect(cfg).toHaveProperty('type');
        expect(cfg).toHaveProperty('level');
        expect(typeof cfg.level).toBe('number');
      }
    }
  });
});

describe('ROLE_LEVELS', () => {
  test('super_admin 等级最高 (4)', () => {
    expect(ROLE_LEVELS.super_admin).toBe(4);
  });

  test('free 等级最低 (0)', () => {
    expect(ROLE_LEVELS.free).toBe(0);
  });

  test('doctor ≥ merchant', () => {
    expect(ROLE_LEVELS.doctor).toBeGreaterThanOrEqual(ROLE_LEVELS.merchant);
  });
});

describe('maskName', () => {
  test('3 字姓名：首尾保留，中间星号', () => {
    expect(maskName('张三丰')).toBe('张*丰');
  });

  test('2 字姓名：首字保留，尾字星号', () => {
    expect(maskName('张三')).toBe('张*');
  });

  test('1 字姓名原样返回', () => {
    expect(maskName('李')).toBe('李');
  });

  test('4 字姓名中间 2 个星号', () => {
    expect(maskName('欧阳修文')).toBe('欧**文');
  });

  test('falsy 输入原样返回', () => {
    expect(maskName(null)).toBeNull();
    expect(maskName('')).toBe('');
  });
});

describe('maskAddress', () => {
  test('包含 **** 脱敏标记', () => {
    const masked = maskAddress('北京市朝阳区建国路88号');
    expect(masked).toContain('****');
  });

  test('falsy 输入原样返回', () => {
    expect(maskAddress(null)).toBeNull();
  });

  test('短地址保留前 2 字 + ****', () => {
    const masked = maskAddress('abc');
    expect(masked).toContain('****');
  });
});

describe('maskIDCard', () => {
  test('18 位身份证保留前 4 后 4', () => {
    const masked = maskIDCard('110101199001011234');
    expect(masked).toMatch(/^1101\*+1234$/);
  });

  test('falsy 输入原样返回', () => {
    expect(maskIDCard(null)).toBeNull();
  });

  test('过短输入返回 ****', () => {
    expect(maskIDCard('123')).toBe('****');
  });
});

describe('maskTextHigh', () => {
  test('手机号被脱敏', () => {
    const result = maskTextHigh('联系电话13812345678请联系');
    expect(result).not.toContain('13812345678');
    expect(result).toContain('138****5678');
  });

  test('邮箱被脱敏', () => {
    const result = maskTextHigh('邮箱test@example.com');
    expect(result).not.toContain('test@example.com');
  });

  test('falsy 输入原样返回', () => {
    expect(maskTextHigh(null)).toBeNull();
  });
});

describe('maskTextMid', () => {
  test('手机号被脱敏', () => {
    const result = maskTextMid('电话13812345678');
    expect(result).toContain('138****5678');
    expect(result).not.toContain('13812345678');
  });

  test('邮箱被替换为 ***@***', () => {
    const result = maskTextMid('联系 test@example.com');
    expect(result).not.toContain('test@example.com');
    expect(result).toContain('***@***');
  });
});

describe('sanitizeRow', () => {
  test('free 角色看 users 表手机号被脱敏', () => {
    const row = { phone: '13812345678', name: '张三丰', sex: '男' };
    const result = sanitizeRow('users', row, ['free']);
    expect(result.phone).toBe('138****5678');
    expect(result.name).toBe('张*丰');
    expect(result.sex).toBe('男'); // level 0 不脱敏
  });

  test('super_admin 看明文', () => {
    const row = { phone: '13812345678', name: '张三丰' };
    const result = sanitizeRow('users', row, ['super_admin']);
    expect(result.phone).toBe('13812345678');
    expect(result.name).toBe('张三丰');
  });

  test('未知表名返回原行', () => {
    const row = { id: 1 };
    const result = sanitizeRow('unknown_table', row, ['free']);
    expect(result).toEqual(row);
  });

  test('null row 返回 null', () => {
    expect(sanitizeRow('users', null, ['free'])).toBeNull();
  });

  test('sanitizeRows 批量脱敏', () => {
    const rows = [
      { phone: '13812345678', name: '张三' },
      { phone: '13987654321', name: '李四' },
    ];
    const results = sanitizeRows('users', rows, ['free']);
    expect(results).toHaveLength(2);
    expect(results[0].phone).toBe('138****5678');
    expect(results[1].phone).toBe('139****4321');
  });
});

describe('generateWatermark', () => {
  test('返回 watermark_id 和 sig', () => {
    const wm = generateWatermark(1, ['admin_a'], 'users');
    expect(wm).toHaveProperty('watermark_id');
    expect(wm).toHaveProperty('sig');
    expect(wm).toHaveProperty('payload');
    expect(wm.watermark_id).toMatch(/^WM-\d+-[0-9a-f]+$/);
  });

  test('不同参数生成不同水印', () => {
    const wm1 = generateWatermark(1, ['admin_a'], 'users');
    const wm2 = generateWatermark(2, ['admin_a'], 'users');
    expect(wm1.watermark_id).not.toBe(wm2.watermark_id);
  });

  test('包含 instruction 说明', () => {
    const wm = generateWatermark(1, ['super_admin'], 'master_cases');
    expect(wm).toHaveProperty('instruction');
    expect(typeof wm.instruction).toBe('string');
  });
});

describe('rowsToCSV', () => {
  test('正确生成 CSV 含表头', () => {
    const rows = [{ id: 1, name: '张三' }, { id: 2, name: '李四' }];
    const csv = rowsToCSV(rows, 'users');
    const lines = csv.split('\n');
    expect(lines[0]).toBe('id,name');
    expect(lines[1]).toContain('张三');
    expect(lines[2]).toContain('李四');
  });

  test('末尾包含 WATERMARK', () => {
    const rows = [{ id: 1 }];
    const csv = rowsToCSV(rows, 'users');
    expect(csv).toContain('WATERMARK');
  });

  test('空数组返回空字符串', () => {
    expect(rowsToCSV([], 'users')).toBe('');
  });
});

describe('rowsToJSON', () => {
  test('正确生成 JSON 含 meta', () => {
    const rows = [{ id: 1, name: '张三' }];
    const json = rowsToJSON(rows, { watermark_id: 'WM-test' });
    const parsed = JSON.parse(json);
    expect(parsed.meta.count).toBe(1);
    expect(parsed.meta.watermark.watermark_id).toBe('WM-test');
    expect(parsed.data).toHaveLength(1);
  });

  test('空数组 count=0', () => {
    const json = rowsToJSON([], null);
    const parsed = JSON.parse(json);
    expect(parsed.meta.count).toBe(0);
  });
});
