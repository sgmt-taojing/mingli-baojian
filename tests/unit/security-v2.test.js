// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · Unit Tests — security-v2.js
// ═══════════════════════════════════════════════════════════════

const {
  encrypt,
  decrypt,
  maskPhone,
  maskBirthDate,
  hashPhone,
  generateToken,
  verifyToken,
  sanitizeInput,
  sanitizeXSS,
  rateLimit,
  hasRole,
  hasAnyRole,
} = require('../../server/security-v2.js');

describe('encrypt / decrypt 往返', () => {
  test('加密后解密应等于原文', () => {
    const plaintext = 'Hello 命理宝鉴 12345';
    const encrypted = encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  test('每次加密结果不同（随机 IV）', () => {
    const text = 'same-input';
    const e1 = encrypt(text);
    const e2 = encrypt(text);
    expect(e1).not.toBe(e2);
    // 但解密后都等于原文
    expect(decrypt(e1)).toBe(text);
    expect(decrypt(e2)).toBe(text);
  });

  test('encrypt 对 falsy 输入返回 null', () => {
    expect(encrypt('')).toBeNull();
    expect(encrypt(null)).toBeNull();
    expect(encrypt(undefined)).toBeNull();
    expect(encrypt(0)).toBeNull();
    expect(encrypt(false)).toBeNull();
  });

  test('encrypt 返回格式以 enc: 开头', () => {
    const result = encrypt('test data');
    expect(result).toMatch(/^enc:/);
    // 格式: enc:iv:authTag:ciphertext — 4 段
    const parts = result.split(':');
    expect(parts).toHaveLength(4);
  });

  test('decrypt 对非 enc: 前文的字符串原样返回', () => {
    expect(decrypt('plain-text')).toBe('plain-text');
    expect(decrypt('encrypted:abc123')).not.toBe('plain-text'); // 旧格式走 legacy 路径
  });

  test('decrypt 对 null/undefined 原样返回', () => {
    expect(decrypt(null)).toBeNull();
    expect(decrypt(undefined)).toBeUndefined();
  });

  test('decrypt 对损坏的 enc: 密文返回 null 或抛异常', () => {
    // 格式正确但内容损坏
    const bad = 'enc:deadbeef:cafebabe:notvalidhex';
    expect(() => decrypt(bad)).toThrow();
  });

  test('decrypt 对格式不对的 enc: 返回 null', () => {
    // 只有 2 段（enc: + 1 part）→ parts.length = 2, 非4，返回 null
    expect(decrypt('enc:onlyonepart')).toBeNull();
    // 3 段（enc: + 2 parts）→ parts.length = 3, 非4，返回 null
    expect(decrypt('enc:part1:part2')).toBeNull();
  });
});

describe('maskPhone', () => {
  test('11 位手机号脱敏正确', () => {
    expect(maskPhone('13812345678')).toBe('138****5678');
  });

  test('短号码原样返回', () => {
    expect(maskPhone('123')).toBe('123');
  });

  test('falsy 输入原样返回', () => {
    expect(maskPhone(null)).toBeNull();
    expect(maskPhone('')).toBe('');
  });
});

describe('maskBirthDate', () => {
  test('日期脱敏保留年份', () => {
    const masked = maskBirthDate('1990-05-15');
    expect(masked).toContain('1990');
    expect(masked).toContain('**');
  });

  test('falsy 输入原样返回', () => {
    expect(maskBirthDate(null)).toBeNull();
  });
});

describe('hashPhone', () => {
  test('返回 hash_ 前缀 + 16 位 hex', () => {
    const h = hashPhone('13812345678');
    expect(h).toMatch(/^hash_[0-9a-f]{16}$/);
  });

  test('相同输入产生相同 hash', () => {
    const h1 = hashPhone('13800001111');
    const h2 = hashPhone('13800001111');
    expect(h1).toBe(h2);
  });

  test('不同输入产生不同 hash', () => {
    const h1 = hashPhone('13800001111');
    const h2 = hashPhone('13800002222');
    expect(h1).not.toBe(h2);
  });
});

describe('generateToken / verifyToken 往返', () => {
  test('生成的 token 可被验证', () => {
    const token = generateToken(42, 24, ['user']);
    const payload = verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload.uid).toBe(42);
    expect(payload.roles).toContain('user');
    expect(payload.iss).toBe('mingli-baojian');
  });

  test('verifyToken 对无效 token 返回 null', () => {
    expect(verifyToken('invalid.token.here')).toBeNull();
    expect(verifyToken('')).toBeNull();
    expect(verifyToken(null)).toBeNull();
    expect(verifyToken('only.two')).toBeNull();
  });

  test('verifyToken 对篡改签名的 token 返回 null', () => {
    const token = generateToken(1, 24, ['user']);
    const parts = token.split('.');
    // 篡改签名
    const tampered = parts[0] + '.' + parts[1] + '.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    expect(verifyToken(tampered)).toBeNull();
  });

  test('token 包含 iat 和 exp', () => {
    const token = generateToken(1, 2, ['user']);
    const payload = verifyToken(token);
    expect(payload).toHaveProperty('iat');
    expect(payload).toHaveProperty('exp');
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });
});

describe('sanitizeInput', () => {
  test('过滤单引号', () => {
    expect(sanitizeInput("O'Brien")).toBe("O''Brien");
  });

  test('过滤分号', () => {
    expect(sanitizeInput('drop;table')).toBe('droptable');
  });

  test('过滤 SQL 行注释 --', () => {
    // sanitizeInput 移除 -- 字符，但后面的文本保留
    const result = sanitizeInput('test--comment');
    expect(result).not.toContain('--');
    expect(result).toBe('testcomment');
  });

  test('非字符串原样返回', () => {
    expect(sanitizeInput(123)).toBe(123);
    expect(sanitizeInput(null)).toBeNull();
  });
});

describe('sanitizeXSS', () => {
  test('转义 < 和 >', () => {
    const result = sanitizeXSS('<script>alert(1)</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  test('转义引号', () => {
    const result = sanitizeXSS('say "hello"');
    expect(result).toContain('&quot;');
  });

  test('移除 javascript: 协议', () => {
    const result = sanitizeXSS('javascript:alert(1)');
    expect(result).not.toContain('javascript:');
  });

  test('移除 onXxx= 事件', () => {
    const result = sanitizeXSS('onclick=alert(1)');
    expect(result).not.toContain('onclick=');
  });

  test('非字符串原样返回', () => {
    expect(sanitizeXSS(42)).toBe(42);
  });
});

describe('rateLimit', () => {
  test('允许未超限请求', () => {
    const key = 'test-rl-' + Date.now();
    expect(rateLimit(key, 5, 60000)).toBe(true);
    expect(rateLimit(key, 5, 60000)).toBe(true);
  });

  test('超出限制后返回 false', () => {
    const key = 'test-rl-block-' + Date.now();
    for (let i = 0; i < 3; i++) rateLimit(key, 3, 60000);
    expect(rateLimit(key, 3, 60000)).toBe(false);
  });
});

describe('hasRole / hasAnyRole', () => {
  test('hasRole 匹配角色', () => {
    expect(hasRole({ roles: ['user'] }, 'user')).toBe(true);
    expect(hasRole({ roles: ['user'] }, 'admin')).toBe(false);
  });

  test('hasRole super_admin 拥有所有角色', () => {
    expect(hasRole({ roles: ['super_admin'] }, 'anything')).toBe(true);
  });

  test('hasAnyRole 匹配任一角色', () => {
    expect(hasAnyRole({ roles: ['user', 'vip'] }, ['admin', 'vip'])).toBe(true);
    expect(hasAnyRole({ roles: ['user'] }, ['admin', 'vip'])).toBe(false);
  });

  test('hasRole 对 null payload 返回 false', () => {
    expect(hasRole(null, 'user')).toBe(false);
    expect(hasAnyRole(null, ['user'])).toBe(false);
  });
});
