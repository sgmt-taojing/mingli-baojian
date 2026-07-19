# -*- coding: utf-8 -*-
"""
命理宝鉴 · 病例数据迁移脚本
将 tcm-clinic.html 中 localStorage 的病例数据迁移到数据库
生成 patient_pseudo_mapping（脱敏ID映射）
加密敏感字段
"""

import json
import os
import sqlite3
import hashlib
import re
from datetime import datetime

# === 配置 ===
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DB_PATH = os.path.join(SCRIPT_DIR, 'database', 'yidao.db')
CLINIC_HTML = os.path.join(PROJECT_DIR, 'app', 'tcm-clinic.html')
MAPPING_FILE = os.path.join(SCRIPT_DIR, 'database', 'patient_pseudo_mapping.json')

# 简单加密（与 security-v2.js 的 encrypt 互操作需要 Node.js 环境）
# 此处使用 Python 的加密方式，迁移后由后端重新加密
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import base64

def get_encrypt_key():
    key = os.environ.get('MINGLI_ENCRYPT_KEY', '')
    if not key or len(key) < 32:
        # 开发模式临时密钥，与 security-v2.js 一致
        import hashlib
        key = hashlib.scrypt(b'dev-key-mingli', salt=b'salt-dev', dklen=32)
    else:
        key = key.encode('utf-8')[:32]
    return key

def encrypt_field(text):
    """AES-256-GCM 加密，与 security-v2.js enc: 格式兼容"""
    if not text:
        return None
    key = get_encrypt_key()
    iv = os.urandom(16)
    cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
    ciphertext, auth_tag = cipher.encrypt_and_digest(text.encode('utf-8'))
    # 格式: enc:iv:authTag:ciphertext （与 security-v2.js 一致）
    return 'enc:{}:{}:{}'.format(
        iv.hex(),
        auth_tag.hex(),
        ciphertext.hex()
    )

def hash_phone(phone):
    """与 security-v2.js hashPhone 一致"""
    return 'hash_' + hashlib.sha256(phone.encode()).hexdigest()[:16]

def generate_pseudo_id(patient_name, age, gender):
    """生成脱敏伪ID"""
    raw = '{}_{}_{}_{}'.format(patient_name, age, gender, datetime.now().strftime('%Y%m%d'))
    return 'PID-' + hashlib.md5(raw.encode()).hexdigest()[:12].upper()

def mask_name(name):
    """姓名脱敏：张先生 → 张*生"""
    if not name or len(name) < 2:
        return name
    return name[0] + '*' * (len(name) - 2) + name[-1]

def extract_sample_data_from_html(html_path):
    """从 tcm-clinic.html 中提取 localStorage 示例数据"""
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 提取 samples 数组中的病例数据
    # 查找 initSampleData 函数中的 samples 定义
    samples_match = re.search(r'const\s+samples\s*=\s*\[(.*?)\];', content, re.DOTALL)
    if not samples_match:
        print('⚠️ 未找到 samples 数据')
        return []

    # 尝试解析每个病例对象
    # 由于 HTML 中的 JS 对象不是严格 JSON，需要手动提取
    cases = []

    # 按对象分割（简单的状态机解析）
    sample_text = samples_match.group(1)
    
    # 提取每个 case 的关键字段
    case_pattern = re.compile(
        r"id:\s*'([^']+)'.*?"
        r"patient:\{name:'([^']+)',age:(\d+),gender:'([^']+)'.*?"
        r"symptoms:'([^']*)'.*?"
        r"tizhi:'([^']*)'.*?"
        r"(?:masterAnalysis:\{(.*?)(?:\},|\}\s*,)|masterAnalysis:null)"
        r".*?(?:doctorDiagnosis:\{(.*?)(?:\},|\}\s*,)|doctorDiagnosis:null)",
        re.DOTALL
    )

    for m in case_pattern.finditer(sample_text):
        case = {
            'id': m.group(1),
            'patient_name': m.group(2),
            'patient_age': int(m.group(3)),
            'patient_gender': m.group(4),
            'symptoms': m.group(5),
            'constitution': m.group(6) if m.group(6) else '',
            'master_analysis_raw': m.group(7) if m.group(7) else '',
            'doctor_diagnosis_raw': m.group(8) if m.group(8) else ''
        }

        # 提取大师分析详情
        if case['master_analysis_raw']:
            ma = case['master_analysis_raw']
            bazi_match = re.search(r"bazi:\{year:'([^']+)',month:'([^']+)',day:'([^']+)',hour:'([^']+)'\}", ma)
            if bazi_match:
                case['bazi'] = {
                    'year': bazi_match.group(1),
                    'month': bazi_match.group(2),
                    'day': bazi_match.group(3),
                    'hour': bazi_match.group(4)
                }
            
            wuxing_match = re.search(r'wuxing:\{([^}]+)\}', ma)
            if wuxing_match:
                case['wuxing_summary'] = wuxing_match.group(1)
            else:
                case['wuxing_summary'] = ''

            analysis_match = re.search(r"analysisNote:'([^']*)'", ma)
            if analysis_match:
                case['master_analysis'] = analysis_match.group(1)
            else:
                case['master_analysis'] = ''

            translation_match = re.search(r"medicalTranslation:'([^']*)'", ma)
            if translation_match:
                case['medical_translation'] = translation_match.group(1)
            else:
                case['medical_translation'] = ''

        # 提取医生诊断详情
        if case['doctor_diagnosis_raw']:
            dd = case['doctor_diagnosis_raw']
            syndrome_match = re.search(r"syndrome:'([^']*)'", dd)
            if syndrome_match:
                case['syndrome'] = syndrome_match.group(1)
            
            formula_match = re.search(r"formula:'([^']*)'", dd)
            if formula_match:
                case['formula'] = formula_match.group(1)

            acupoints_match = re.search(r"acupoints:\[([^\]]*)\]", dd)
            if acupoints_match:
                case['acupoints'] = [a.strip().strip("'\"") for a in acupoints_match.group(1).split(',') if a.strip()]
            else:
                case['acupoints'] = []

            diet_match = re.search(r"dietPlan:'([^']*)'", dd)
            if diet_match:
                case['diet_plan'] = diet_match.group(1)
        else:
            case['syndrome'] = ''
            case['formula'] = ''
            case['acupoints'] = []
            case['diet_plan'] = ''

        cases.append(case)

    return cases

def migrate_cases(cases):
    """迁移病例数据到数据库"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 确保表存在
    cursor.executescript('''
        CREATE TABLE IF NOT EXISTS medical_cases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            symptoms TEXT NOT NULL,
            constitution TEXT,
            status TEXT DEFAULT 'pending_master',
            assigned_master_id INTEGER,
            assigned_doctor_id INTEGER,
            master_case_id INTEGER,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            updated_at TEXT DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS master_cases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_uuid TEXT UNIQUE NOT NULL,
            case_number TEXT,
            master_id INTEGER NOT NULL,
            patient_id INTEGER,
            related_case_id INTEGER,
            status TEXT DEFAULT 'draft',
            bazi_chart TEXT,
            wuxing_summary TEXT,
            symptoms TEXT,
            constitution TEXT,
            master_analysis TEXT,
            analysis_summary TEXT,
            medical_translation TEXT,
            doctor_diagnosis TEXT,
            review_status TEXT,
            review_comment TEXT,
            reviewer_id INTEGER,
            reviewed_at TEXT,
            final_plan TEXT,
            quality_score INTEGER DEFAULT 0,
            is_high_quality INTEGER DEFAULT 0,
            effectiveness_rating INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            submitted_at TEXT,
            completed_at TEXT,
            archived_at TEXT
        );

        CREATE TABLE IF NOT EXISTS patient_pseudo_mapping (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pseudo_id TEXT UNIQUE NOT NULL,
            real_name_encrypted TEXT,
            name_masked TEXT,
            age INTEGER,
            gender TEXT,
            phone_hash TEXT,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT,
            phone_hash TEXT UNIQUE,
            name TEXT,
            sex TEXT,
            birth_date TEXT,
            birth_hour TEXT,
            birthplace TEXT,
            residence TEXT,
            occupation TEXT,
            faith TEXT,
            vip_level TEXT DEFAULT 'free',
            is_super INTEGER DEFAULT 0,
            follow_date TEXT,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            updated_at TEXT DEFAULT (datetime('now','localtime'))
        );
    ''')

    # 检查是否已迁移
    cursor.execute("SELECT COUNT(*) FROM medical_cases")
    existing = cursor.fetchone()[0]
    if existing > 0:
        print('⚠️ 数据库中已有 {} 条病例数据，跳过迁移'.format(existing))
        conn.close()
        return 0

    mapping = []
    migrated = 0

    for case in cases:
        print('迁移病例 {} ({})...'.format(case['id'], case['patient_name']))

        # 生成脱敏ID
        pseudo_id = generate_pseudo_id(case['patient_name'], case['patient_age'], case['patient_gender'])
        masked_name = mask_name(case['patient_name'])

        # 创建虚拟用户（脱敏）
        cursor.execute('''
            INSERT INTO users (name, sex, created_at)
            VALUES (?, ?, datetime('now','localtime'))
        ''', (masked_name, case['patient_gender']))
        user_id = cursor.lastrowid

        # 保存映射关系
        cursor.execute('''
            INSERT INTO patient_pseudo_mapping 
            (pseudo_id, real_name_encrypted, name_masked, age, gender, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now','localtime'))
        ''', (
            pseudo_id,
            encrypt_field(case['patient_name']),
            masked_name,
            case['patient_age'],
            case['patient_gender']
        ))

        mapping.append({
            'pseudo_id': pseudo_id,
            'name_masked': masked_name,
            'original_case_id': case['id']
        })

        # 创建 medical_case
        symptoms_encrypted = encrypt_field(case['symptoms'])
        cursor.execute('''
            INSERT INTO medical_cases (patient_id, symptoms, constitution, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, datetime('now','localtime'), datetime('now','localtime'))
        ''', (user_id, symptoms_encrypted, case['constitution'] or '', 'pending_master'))
        medical_case_id = cursor.lastrowid

        # 如果有大师分析，创建 master_case
        if case.get('master_analysis'):
            import uuid
            case_uuid = str(uuid.uuid4())
            bazi_chart = json.dumps(case.get('bazi', {}), ensure_ascii=False)
            bazi_encrypted = encrypt_field(bazi_chart)
            
            master_analysis_encrypted = encrypt_field(case['master_analysis'])
            
            # 构建final_plan
            final_plan = {}
            if case.get('syndrome'):
                final_plan['syndrome'] = case['syndrome']
            if case.get('formula'):
                final_plan['formula'] = case['formula']
            if case.get('acupoints'):
                final_plan['acupoints'] = case['acupoints']
            if case.get('diet_plan'):
                final_plan['dietPlan'] = case['diet_plan']
            
            final_plan_json = json.dumps(final_plan, ensure_ascii=False)
            final_plan_encrypted = encrypt_field(final_plan_json)

            # 判断状态
            if case.get('doctor_diagnosis_raw'):
                status = 'completed'
            else:
                status = 'submitted'

            cursor.execute('''
                INSERT INTO master_cases 
                (case_uuid, master_id, patient_id, bazi_chart, wuxing_summary, symptoms,
                 constitution, master_analysis, analysis_summary, medical_translation,
                 doctor_diagnosis, final_plan, status, submitted_at, completed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'), 
                        CASE WHEN ? = 'completed' THEN datetime('now','localtime') ELSE NULL END)
            ''', (
                case_uuid, 1, user_id,  # master_id=1 为默认大师账号
                bazi_encrypted,
                case.get('wuxing_summary', ''),
                case['symptoms'],
                case.get('constitution', ''),
                master_analysis_encrypted,
                case.get('medical_translation', ''),
                case.get('medical_translation', ''),
                final_plan_encrypted if final_plan else None,
                final_plan_encrypted if final_plan else None,
                status, status
            ))
            master_case_id = cursor.lastrowid

            # 更新 medical_case 关联
            cursor.execute('''
                UPDATE medical_cases SET master_case_id = ?, status = ?, updated_at = datetime('now','localtime')
                WHERE id = ?
            ''', (master_case_id, status, medical_case_id))

        migrated += 1

    # 保存映射文件
    with open(MAPPING_FILE, 'w', encoding='utf-8') as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)

    conn.commit()
    conn.close()

    print('\n✅ 迁移完成:')
    print('   迁移病例数: {}'.format(migrated))
    print('   脱敏映射文件: {}'.format(MAPPING_FILE))
    return migrated

def main():
    print('═══ 命理宝鉴 · 病例数据迁移 ═══')
    print('数据库: {}'.format(DB_PATH))
    print('HTML源: {}'.format(CLINIC_HTML))
    print()

    if not os.path.exists(CLINIC_HTML):
        print('❌ tcm-clinic.html 不存在')
        return

    if not os.path.exists(os.path.dirname(DB_PATH)):
        os.makedirs(os.path.dirname(DB_PATH))

    print('📋 提取 localStorage 病例数据...')
    cases = extract_sample_data_from_html(CLINIC_HTML)
    print('   找到 {} 条病例'.format(len(cases)))

    if len(cases) == 0:
        print('⚠️ 未找到病例数据，退出')
        return

    print('\n📋 开始迁移到数据库...')
    count = migrate_cases(cases)

    if count > 0:
        print('\n🎉 迁移成功！')
        print('   - 病例数据已迁移到 medical_cases 和 master_cases 表')
        print('   - 敏感字段已加密')
        print('   - 脱敏映射已保存到 patient_pseudo_mapping.json')
        print('   - 请在 security-v2.js 配置正确的 MINGLI_ENCRYPT_KEY')

if __name__ == '__main__':
    main()
