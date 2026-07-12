#!/usr/bin/env python3
"""
乾元命理宝鉴 · 知识库统一查询API服务
端口: 8901 (替换原有简单HTTP服务)
功能: 加载所有JS知识库文件，提供REST API查询
"""

import json
import os
import re
import http.server
import urllib.parse
import datetime
import hashlib

WORKSPACE = os.path.dirname(os.path.abspath(__file__))
# 知识库JS文件在 ../knowledge/ 子目录 (相对于 server/)
KNOWLEDGE_DIR = os.path.join(os.path.dirname(WORKSPACE), 'knowledge')
DB_FILE = os.path.join(KNOWLEDGE_DIR, 'knowledge-db.json')
PORT = 8901

# === 知识库JS文件列表 ===
# 每个条目: (文件名, 全局变量名, 类别标签)
KB_FILES = [
    ('authoritative-knowledge-base.js', 'AUTHORITATIVE_KNOWLEDGE', 'authoritative'),
    ('faith-knowledge-base.js', 'FAITH_KNOWLEDGE', 'faith'),
    ('koujue-database-full.js', 'KOUJUE_DATABASE', 'koujue'),
    ('bazi-knowledge-base.js', 'BAZI_KB', 'bazi'),
    ('zhouyi-knowledge-base.js', 'ZHOUYI_KB', 'zhouyi'),
    ('ziwei-knowledge-base.js', 'ZIWEI_KB', 'ziwei'),
    ('qimen-knowledge-base.js', 'QIMEN_KB', 'qimen'),
    ('meihua-knowledge-base.js', 'MEIHUA_KB', 'meihua'),
    ('liuren-knowledge-base.js', 'LIUREN_KB', 'liuren'),
    ('liuyao-knowledge-base.js', 'LIUYAO_KB', 'liuyao'),
    ('fengshui-knowledge-base.js', 'FENGSHUI_KB', 'fengshui'),
    ('yangzhai-knowledge-base.js', 'YANGZHAI_KB', 'yangzhai'),
    ('zodiac-knowledge-base.js', 'ZODIAC_KNOWLEDGE', 'zodiac'),
    ('masters-knowledge.js', 'MASTERS_KNOWLEDGE', 'masters'),
    ('knowledge-details.js', 'KNOWLEDGE_DETAILS', 'details'),
    ('knowledge-details-extra.js', 'KNOWLEDGE_DETAILS_EXTRA', 'details_extra'),
    ('classics-highlights.js', 'CLASSICS_HIGHLIGHTS', 'classics'),
    ('knowledge-deep-supplement.js', 'KNOWLEDGE_DEEP_SUPPLEMENT', 'deep_supplement'),
    ('knowledge-supplement-1.js', 'KNOWLEDGE_SUPPLEMENT_XINGMING', 'supplement_xingming'),
    ('knowledge-supplement-2.js', 'KNOWLEDGE_SUPPLEMENT_2', 'supplement_2'),
    ('knowledge-supplement-3.js', 'KNOWLEDGE_SUPPLEMENT_3', 'supplement_3'),
    ('knowledge-supplement-4.js', 'KNOWLEDGE_SUPPLEMENT_4', 'supplement_4'),
    ('knowledge-supplement-5.js', 'KNOWLEDGE_SUPPLEMENT_5', 'supplement_5'),
    ('knowledge-supplement-6.js', 'KNOWLEDGE_SUPPLEMENT_6', 'supplement_6'),
    ('faith-content.js', 'FAITH_CONTENT', 'faith_content'),
    ('faith-deities-detail.js', 'DEITIES_DETAIL', 'deities_detail'),
    ('knowledge-supplement.js', 'KNOWLEDGE_SUPPLEMENT', 'supplement'),
    ('divination-hub-extra.js', 'DIVINATION_HUB_EXTRA', 'hub_extra'),
]

# === 中文类别标签映射 ===
CATEGORY_LABELS = {
    'authoritative': '权威知识库',
    'faith': '信众知识库',
    'koujue': '口诀数据库',
    'bazi': '八字命理',
    'zhouyi': '周易知识',
    'ziwei': '紫微斗数',
    'qimen': '奇门遁甲',
    'meihua': '梅花易数',
    'liuren': '大六壬',
    'liuyao': '六爻知识',
    'fengshui': '风水知识',
    'yangzhai': '阳宅风水',
    'zodiac': '生肖知识',
    'masters': '名家典籍',
    'details': '知识详情',
    'details_extra': '知识扩展',
    'classics': '经典精选',
    'deep_supplement': '深度补充',
    'supplement_xingming': '姓名学补充',
    'supplement_2': '补充知识二',
    'supplement_3': '补充知识三',
    'supplement_4': '补充知识四',
    'supplement_5': '补充知识五',
    'supplement_6': '补充知识六',
    'faith_content': '信众内容',
    'deities_detail': '神仙详解',
    'supplement': '综合补充',
    'hub_extra': '扩展模块',
}

def extract_js_object(js_content, var_name):
    """从JS文件内容中提取顶层对象，转为Python字典"""
    # 尝试多种声明模式
    patterns = [
        r'(?:const|var|window\.)(?:\s+)' + re.escape(var_name) + r'\s*=\s*\{',
        r'(?:const|var|window\.)' + re.escape(var_name) + r'\s*=\s*\{',
    ]
    
    start_idx = -1
    for pattern in patterns:
        m = re.search(pattern, js_content)
        if m:
            start_idx = m.end() - 1  # 指向 '{'
            break
    
    if start_idx == -1:
        return None
    
    # 找到匹配的闭合括号
    depth = 0
    in_string = False
    string_char = None
    escape = False
    in_line_comment = False
    in_block_comment = False
    
    i = start_idx
    while i < len(js_content):
        ch = js_content[i]
        
        if in_line_comment:
            if ch == '\n':
                in_line_comment = False
            i += 1
            continue
        if in_block_comment:
            if ch == '*' and i + 1 < len(js_content) and js_content[i+1] == '/':
                in_block_comment = False
                i += 2
                continue
            i += 1
            continue
        if escape:
            escape = False
            i += 1
            continue
        if in_string:
            if ch == '\\':
                escape = True
            elif ch == string_char:
                in_string = False
            i += 1
            continue
        if ch == '/' and i + 1 < len(js_content):
            if js_content[i+1] == '/':
                in_line_comment = True
                i += 2
                continue
            elif js_content[i+1] == '*':
                in_block_comment = True
                i += 2
                continue
        if ch in ('"', "'", '`'):
            in_string = True
            string_char = ch
            i += 1
            continue
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                # 找到闭合
                obj_str = js_content[start_idx:i+1]
                return js_obj_to_python(obj_str)
        i += 1
    
    return None

def js_obj_to_python(js_str):
    """将JS对象字符串转为Python字典"""
    # 移除注释
    js_str = re.sub(r'//[^\n]*', '', js_str)
    js_str = re.sub(r'/\*.*?\*/', '', js_str, flags=re.DOTALL)
    
    # 处理JS特定语法
    # 1. 将无引号的key转为引号的key (仅对简单标识符)
    js_str = re.sub(r'([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:', r'\1"\2":', js_str)
    
    # 2. 处理尾逗号
    js_str = re.sub(r',\s*([}\]])', r'\1', js_str)
    
    # 3. 处理模板字符串 - 用特殊标记保护内容
    # 将反引号字符串转为双引号字符串
    def fix_backtick(m):
        content = m.group(1)
        # 转义内部双引号和换行
        content = content.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n').replace('\t', '\\t')
        return '"' + content + '"'
    js_str = re.sub(r'`([^`]*)`', fix_backtick, js_str, flags=re.DOTALL)
    
    # 4. 处理JS中的单引号字符串 -> 双引号
    def fix_quotes(m):
        content = m.group(1)
        # 转义内部双引号
        content = content.replace('\\', '\\\\').replace('"', '\\"')
        return '"' + content + '"'
    js_str = re.sub(r"'([^']*)'", fix_quotes, js_str)
    
    # 5. 处理 undefined -> null
    js_str = re.sub(r'\bundefined\b', 'null', js_str)
    
    # 6. 处理 JS 函数 -> null
    js_str = re.sub(r':\s*function\s*\([^)]*\)\s*\{[^}]*\}', ': null', js_str)
    
    # 7. 处理 JS 的 new Date() 等表达式
    js_str = re.sub(r'new\s+Date\([^)]*\)', 'null', js_str)
    
    try:
        return json.loads(js_str)
    except json.JSONDecodeError as e1:
        # 如果直接解析失败，尝试提取顶层key结构
        result = _extract_toplevel_keys(js_str)
        if result:
            return result
        # 最终尝试
        try:
            js_str = re.sub(r'[\x00-\x1f\x7f]', ' ', js_str)
            js_str = js_str.replace('\\\\', '\\')
            return json.loads(js_str)
        except:
            return None


def _extract_toplevel_keys(js_str):
    """从JS对象字符串中提取顶层key和简化的value信息"""
    result = {}
    # 找到所有顶层key: 匹配 { key: 或 { key: value 模式
    # 只提取第一层的key
    depth = 0
    in_string = False
    string_char = None
    escape = False
    i = 0
    key_start = -1
    
    while i < len(js_str):
        ch = js_str[i]
        
        if escape:
            escape = False
            i += 1
            continue
        if in_string:
            if ch == '\\':
                escape = True
            elif ch == string_char:
                in_string = False
            i += 1
            continue
        if ch in ('"', "'", '`'):
            in_string = True
            string_char = ch
            i += 1
            continue
        if ch == '{':
            depth += 1
            if depth == 1:
                # 在第一层，找key
                pass
        elif ch == '}':
            depth -= 1
        elif ch == '[' and depth == 1:
            # 数组值，提取前几个元素作为预览
            pass
        
        # 在第一层寻找 key: 模式
        if depth == 1 and ch in ('\n', '\r', ' ', '\t'):
            # 检查是否是 key: 模式
            # 向前看跳过空格
            j = i
            while j < len(js_str) and js_str[j] in ' \t\n\r':
                j += 1
            # 尝试匹配 key: 
            m = re.match(r'([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:', js_str[j:])
            if m:
                key = m.group(1)
                if key not in result:
                    # 提取value预览
                    val_start = j + m.end()
                    val_preview = _extract_value_preview(js_str, val_start)
                    result[key] = val_preview
        
        i += 1
    
    return result if result else None


def _extract_value_preview(js_str, start):
    """从start位置提取value的预览信息"""
    # 跳过空格
    i = start
    while i < len(js_str) and js_str[i] in ' \t':
        i += 1
    if i >= len(js_str):
        return ''
    
    ch = js_str[i]
    
    # 字符串值
    if ch in ('"', "'", '`'):
        end = js_str.find(ch, i+1)
        while end != -1 and js_str[end-1] == '\\':
            end = js_str.find(ch, end+1)
        if end != -1:
            return js_str[i+1:end][:500]
        return ''
    
    # 数组值
    if ch == '[':
        depth = 1
        j = i + 1
        while j < len(js_str) and depth > 0:
            if js_str[j] == '[': depth += 1
            elif js_str[j] == ']': depth -= 1
            j += 1
        arr_str = js_str[i:j]
        # 尝试解析为列表
        try:
            # 简化处理
            return f'[Array with {arr_str.count("{")} items]'
        except:
            return '[Array]'
    
    # 对象值
    if ch == '{':
        depth = 1
        j = i + 1
        in_str = False
        str_ch = None
        esc = False
        while j < len(js_str) and depth > 0:
            c = js_str[j]
            if esc:
                esc = False
                j += 1
                continue
            if in_str:
                if c == '\\': esc = True
                elif c == str_ch: in_str = False
                j += 1
                continue
            if c in ('"', "'", '`'):
                in_str = True
                str_ch = c
            elif c == '{': depth += 1
            elif c == '}': depth -= 1
            j += 1
        obj_str = js_str[i:j]
        # 尝试递归解析
        sub = js_obj_to_python(obj_str)
        if sub is not None:
            return sub
        return '{Object}'
    
    # 数字/布尔/null
    m = re.match(r'(true|false|null|\d+\.?\d*)', js_str[i:])
    if m:
        val = m.group(1)
        if val == 'true': return True
        if val == 'false': return False
        if val == 'null': return None
        try: return int(val)
        except: return float(val) if '.' in val else val
    
    return ''

def count_entries(obj, depth=0):
    """递归计算知识条目数"""
    if depth > 5:
        return 0
    if isinstance(obj, dict):
        count = 0
        for k, v in obj.items():
            if isinstance(v, (dict, list)):
                count += count_entries(v, depth + 1)
            else:
                count += 1
        return count
    elif isinstance(obj, list):
        count = 0
        for item in obj:
            if isinstance(item, (dict, list)):
                count += count_entries(item, depth + 1)
            else:
                count += 1
        return count
    return 0

def flatten_keys(obj, prefix='', depth=0, max_depth=3):
    """将嵌套对象的key扁平化为路径列表"""
    if depth > max_depth:
        return []
    result = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            path = f"{prefix}.{k}" if prefix else k
            if isinstance(v, dict) and depth < max_depth:
                result.extend(flatten_keys(v, path, depth + 1, max_depth))
            elif isinstance(v, list) and v and isinstance(v[0], dict):
                result.append(path)
            else:
                result.append(path)
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            if isinstance(item, dict):
                path = f"{prefix}[{i}]"
                result.extend(flatten_keys(item, path, depth + 1, max_depth))
    return result

def search_in_obj(obj, keyword, path='', results=None, depth=0, max_depth=5):
    """递归搜索对象中的关键词"""
    if results is None:
        results = []
    if depth > max_depth:
        return results
    
    kw_lower = keyword.lower()
    
    if isinstance(obj, dict):
        for k, v in obj.items():
            new_path = f"{path}.{k}" if path else k
            # 检查key
            if kw_lower in str(k).lower():
                results.append({
                    'path': new_path,
                    'key': k,
                    'preview': str(v)[:200] if not isinstance(v, (dict, list)) else json.dumps(v, ensure_ascii=False)[:200]
                })
            # 递归搜索value
            if isinstance(v, (dict, list)):
                search_in_obj(v, keyword, new_path, results, depth + 1, max_depth)
            elif isinstance(v, str) and kw_lower in v.lower():
                # 找到匹配，提取上下文
                idx = v.lower().find(kw_lower)
                start = max(0, idx - 50)
                end = min(len(v), idx + len(keyword) + 100)
                preview = v[start:end]
                results.append({
                    'path': new_path,
                    'key': k,
                    'preview': preview,
                    'match': keyword
                })
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            new_path = f"{path}[{i}]"
            if isinstance(item, (dict, list)):
                search_in_obj(item, keyword, new_path, results, depth + 1, max_depth)
            elif isinstance(item, str) and kw_lower in item.lower():
                results.append({
                    'path': new_path,
                    'key': str(i),
                    'preview': item[:200],
                    'match': keyword
                })
    
    return results


class KnowledgeDB:
    """知识库数据库"""
    
    def __init__(self):
        self.data = {}  # category -> {content, meta}
        self.loaded = False
        self.load()
    
    def load(self):
        """加载所有知识库文件"""
        self.data = {}
        
        # 如果有持久化文件，先加载
        persisted = {}
        if os.path.exists(DB_FILE):
            try:
                with open(DB_FILE, 'r', encoding='utf-8') as f:
                    persisted = json.load(f)
            except:
                pass
        
        for filename, var_name, category in KB_FILES:
            filepath = os.path.join(KNOWLEDGE_DIR, filename)
            if not os.path.exists(filepath):
                continue
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    js_content = f.read()
                
                obj = extract_js_object(js_content, var_name)
                
                if obj is None:
                    # 尝试从持久化数据加载
                    if category in persisted:
                        obj = persisted[category].get('content', {})
                    else:
                        obj = {}
                
                file_stat = os.stat(filepath)
                last_modified = datetime.datetime.fromtimestamp(file_stat.st_mtime).isoformat()
                entry_count = count_entries(obj)
                
                self.data[category] = {
                    'content': obj,
                    'meta': {
                        'file': filename,
                        'variable': var_name,
                        'category': category,
                        'label': CATEGORY_LABELS.get(category, category),
                        'entries': entry_count,
                        'last_modified': last_modified,
                        'size_bytes': file_stat.st_size
                    }
                }
            except Exception as e:
                print(f"[知识库] 加载 {filename} 失败: {e}")
                self.data[category] = {
                    'content': {},
                    'meta': {
                        'file': filename,
                        'variable': var_name,
                        'category': category,
                        'label': CATEGORY_LABELS.get(category, category),
                        'entries': 0,
                        'last_modified': '',
                        'size_bytes': 0,
                        'error': str(e)
                    }
                }
        
        # 合并持久化的新增知识
        if '_custom' in persisted:
            self.data['_custom'] = persisted['_custom']
        
        self.loaded = True
        print(f"[知识库] 已加载 {len(self.data)} 个知识模块")
    
    def save(self):
        """持久化到文件"""
        try:
            with open(DB_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"[知识库] 保存失败: {e}")
            return False
    
    def get_categories(self):
        """获取所有分类"""
        return {cat: info['meta'] for cat, info in self.data.items()}
    
    def get_category(self, category):
        """获取某分类全量知识"""
        if category in self.data:
            return self.data[category]
        return None
    
    def get_topic(self, category, topic):
        """获取某主题详情"""
        if category not in self.data:
            return None
        content = self.data[category].get('content', {})
        if topic in content:
            return {
                'category': category,
                'topic': topic,
                'content': content[topic]
            }
        # 尝试模糊匹配
        for k, v in content.items():
            if topic.lower() in k.lower():
                return {
                    'category': category,
                    'topic': k,
                    'content': v
                }
        return None
    
    def search(self, keyword, limit=50):
        """全文搜索"""
        results = []
        for cat, info in self.data.items():
            content = info.get('content', {})
            cat_results = search_in_obj(content, keyword, '', [], 0, 4)
            for r in cat_results[:20]:  # 每个分类最多20条
                r['category'] = cat
                r['category_label'] = info['meta'].get('label', cat)
                results.append(r)
            if len(results) >= limit:
                break
        return results[:limit]
    
    def add_knowledge(self, category, topic, content):
        """添加新知识"""
        if category not in self.data:
            self.data[category] = {
                'content': {},
                'meta': {
                    'file': '_custom',
                    'variable': '_custom',
                    'category': category,
                    'label': CATEGORY_LABELS.get(category, category),
                    'entries': 0,
                    'last_modified': datetime.datetime.now().isoformat(),
                    'size_bytes': 0,
                    'custom': True
                }
            }
        
        if '_custom' not in self.data:
            self.data['_custom'] = {
                'content': {},
                'meta': {
                    'file': '_custom',
                    'variable': '_custom',
                    'category': '_custom',
                    'label': '自定义知识',
                    'entries': 0,
                    'last_modified': datetime.datetime.now().isoformat(),
                    'size_bytes': 0,
                    'custom': True
                }
            }
        
        # 添加到自定义存储
        if '_custom' in self.data:
            custom_content = self.data['_custom'].setdefault('content', {})
            if category not in custom_content:
                custom_content[category] = {}
            custom_content[category][topic] = content
        
        # 同时添加到目标分类
        target_content = self.data[category].setdefault('content', {})
        target_content[topic] = content
        
        # 更新元数据
        self.data[category]['meta']['entries'] = count_entries(target_content)
        self.data[category]['meta']['last_modified'] = datetime.datetime.now().isoformat()
        
        self.save()
        return True
    
    def get_daily(self):
        """每日推荐知识"""
        import random
        now = datetime.datetime.now()
        # 用日期作为随机种子，保证同一天返回相同内容
        random.seed(now.year * 10000 + now.month * 100 + now.day)
        
        daily_items = []
        
        # 从各分类中随机选取
        for cat, info in self.data.items():
            if cat == '_custom':
                continue
            content = info.get('content', {})
            if not content:
                continue
            keys = list(content.keys())
            if keys:
                chosen_key = random.choice(keys)
                chosen_val = content[chosen_key]
                daily_items.append({
                    'category': cat,
                    'category_label': info['meta'].get('label', cat),
                    'topic': chosen_key,
                    'preview': json.dumps(chosen_val, ensure_ascii=False)[:300] if isinstance(chosen_val, (dict, list)) else str(chosen_val)[:300]
                })
        
        # 选取3-5个作为今日推荐
        if len(daily_items) > 5:
            daily_items = random.sample(daily_items, 5)
        
        return {
            'date': now.strftime('%Y-%m-%d'),
            'weekday': ['周一','周二','周三','周四','周五','周六','周日'][now.weekday()],
            'recommendations': daily_items
        }
    
    def get_stats(self):
        """获取统计信息"""
        total_entries = 0
        total_size = 0
        module_stats = []
        for cat, info in self.data.items():
            entries = info['meta'].get('entries', 0)
            size = info['meta'].get('size_bytes', 0)
            total_entries += entries
            total_size += size
            module_stats.append({
                'category': cat,
                'label': info['meta'].get('label', cat),
                'entries': entries,
                'size': size,
                'last_modified': info['meta'].get('last_modified', ''),
                'file': info['meta'].get('file', '')
            })
        return {
            'total_modules': len(self.data),
            'total_entries': total_entries,
            'total_size': total_size,
            'modules': sorted(module_stats, key=lambda x: x['entries'], reverse=True)
        }


# === HTTP 请求处理器 ===

class KnowledgeHandler(http.server.BaseHTTPRequestHandler):
    
    db = None  # 类变量，共享KnowledgeDB实例
    
    def log_message(self, format, *args):
        # 简化日志
        pass
    
    def _send_json(self, data, code=200):
        body = json.dumps(data, ensure_ascii=False, indent=2).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', len(body))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(body)
    
    def _send_text(self, text, code=200, content_type='text/plain; charset=utf-8'):
        body = text.encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', len(body))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)
    
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)
        
        # 路由
        if path == '/' or path == '/api':
            self._send_json({
                'service': '乾元命理宝鉴 · 知识库API',
                'version': '1.0',
                'endpoints': [
                    'GET /api/knowledge/categories',
                    'GET /api/knowledge/{category}',
                    'GET /api/knowledge/{category}/{topic}',
                    'GET /api/search?q=关键词',
                    'POST /api/knowledge/add',
                    'GET /api/daily',
                    'GET /api/stats'
                ]
            })
            return
        
        if path == '/api/knowledge/categories':
            cats = self.db.get_categories()
            self._send_json(cats)
            return
        
        if path == '/api/stats':
            stats = self.db.get_stats()
            self._send_json(stats)
            return
        
        if path == '/api/daily':
            daily = self.db.get_daily()
            self._send_json(daily)
            return
        
        if path == '/api/search':
            q = query.get('q', [''])[0]
            if not q:
                self._send_json({'error': '缺少参数 q', 'usage': '/api/search?q=关键词'})
                return
            limit = int(query.get('limit', ['50'])[0])
            results = self.db.search(q, limit)
            self._send_json({
                'keyword': q,
                'count': len(results),
                'results': results
            })
            return
        
        # /api/knowledge/{category}
        m = re.match(r'^/api/knowledge/([^/]+)$', path)
        if m:
            cat = urllib.parse.unquote(m.group(1))
            data = self.db.get_category(cat)
            if data:
                self._send_json(data)
            else:
                self._send_json({'error': f'分类 {cat} 不存在'}, 404)
            return
        
        # /api/knowledge/{category}/{topic}
        m = re.match(r'^/api/knowledge/([^/]+)/(.+)$', path)
        if m:
            cat = urllib.parse.unquote(m.group(1))
            topic = urllib.parse.unquote(m.group(2))
            data = self.db.get_topic(cat, topic)
            if data:
                self._send_json(data)
            else:
                self._send_json({'error': f'主题 {topic} 在分类 {cat} 中不存在'}, 404)
            return
        
        # 静态文件服务（保持原有HTTP服务器功能）
        if path == '/' or path.startswith('/'):
            # 映射到 app/ 目录（HTML文件）或 knowledge/ 目录（JS文件）
            rel_path = path.lstrip('/')
            if not rel_path:
                rel_path = 'divination-hub.html'
            
            # 优先在 app/ 目录查找
            APP_DIR = os.path.join(os.path.dirname(WORKSPACE), 'app')
            file_path = os.path.join(APP_DIR, rel_path)
            if not os.path.isfile(file_path):
                # 回退到 knowledge/ 目录
                file_path = os.path.join(KNOWLEDGE_DIR, rel_path)
            if not os.path.isfile(file_path):
                # 回退到 server/ 目录
                file_path = os.path.join(WORKSPACE, rel_path)
            
            # 安全检查：确保文件在项目目录内
            project_root = os.path.dirname(WORKSPACE)
            if os.path.isfile(file_path) and os.path.realpath(file_path).startswith(project_root):
                try:
                    with open(file_path, 'rb') as f:
                        content = f.read()
                    # 猜测MIME类型
                    if file_path.endswith('.html'):
                        ct = 'text/html; charset=utf-8'
                    elif file_path.endswith('.js'):
                        ct = 'application/javascript; charset=utf-8'
                    elif file_path.endswith('.css'):
                        ct = 'text/css; charset=utf-8'
                    elif file_path.endswith('.json'):
                        ct = 'application/json; charset=utf-8'
                    elif file_path.endswith('.png'):
                        ct = 'image/png'
                    elif file_path.endswith('.jpg') or file_path.endswith('.jpeg'):
                        ct = 'image/jpeg'
                    elif file_path.endswith('.svg'):
                        ct = 'image/svg+xml'
                    elif file_path.endswith('.ico'):
                        ct = 'image/x-icon'
                    else:
                        ct = 'application/octet-stream'
                    
                    self.send_response(200)
                    self.send_header('Content-Type', ct)
                    self.send_header('Content-Length', len(content))
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Cache-Control', 'no-cache')
                    self.end_headers()
                    self.wfile.write(content)
                except Exception as e:
                    self._send_text(f'500 Internal Server Error: {e}', 500)
            else:
                self._send_text('404 Not Found', 404)
            return
    
    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        
        if path == '/api/knowledge/add':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            try:
                data = json.loads(body)
                category = data.get('category', '_custom')
                topic = data.get('topic', '')
                content = data.get('content', '')
                
                if not topic:
                    self._send_json({'error': '缺少 topic 字段'}, 400)
                    return
                
                self.db.add_knowledge(category, topic, content)
                self._send_json({
                    'success': True,
                    'message': f'已添加知识: {category}/{topic}',
                    'category': category,
                    'topic': topic
                })
            except json.JSONDecodeError:
                self._send_json({'error': '无效的JSON'}, 400)
            except Exception as e:
                self._send_json({'error': str(e)}, 500)
            return
        
        self._send_json({'error': '未知API路径'}, 404)


def main():
    KnowledgeHandler.db = KnowledgeDB()
    
    http.server.HTTPServer.allow_reuse_address = True
    server = http.server.HTTPServer(('127.0.0.1', PORT), KnowledgeHandler)
    print(f"[知识库API] 服务启动在 http://127.0.0.1:{PORT}")
    print(f"[知识库API] 工作目录: {WORKSPACE}")
    print(f"[知识库API] 已加载 {len(KnowledgeHandler.db.data)} 个知识模块")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[知识库API] 服务停止")
        server.server_close()


if __name__ == '__main__':
    main()
