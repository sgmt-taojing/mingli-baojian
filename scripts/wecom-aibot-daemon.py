#!/usr/bin/env python3
"""企业微信智能机器人长连接守护（命理宝鉴推送通道）
职责：
1. 长连接保活（30s 心跳、断线自动重连、单连接纪律）
2. 接收消息/事件回调，记录会话 chatid（主动推送的前提）
3. 扫描 data/push-queue/*.json，用 aibot_send_msg 推送 markdown 到已登记会话
凭据：server/config/wecom-aibot.local.json（不进 git）
"""
import json, os, sys, time, uuid, glob, traceback
import websocket

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG = os.path.join(ROOT, 'server/config/wecom-aibot.local.json')
CHATS = os.path.join(ROOT, 'server/config/wecom-aibot-chats.local.json')
QUEUE = os.path.join(ROOT, 'data/push-queue')
SENT = os.path.join(ROOT, 'data/push-queue/sent')
LOG = os.path.join(ROOT, 'data/push-queue/daemon.log')
WSS = 'wss://openws.work.weixin.qq.com'

os.makedirs(SENT, exist_ok=True)

def log(msg):
    line = f"{time.strftime('%F %T')} {msg}"
    print(line, flush=True)
    with open(LOG, 'a', encoding='utf-8') as f:
        f.write(line + '\n')

def load_json(path, default):
    try:
        return json.load(open(path, encoding='utf-8'))
    except Exception:
        return default

def save_chats(d):
    tmp = CHATS + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
    os.replace(tmp, CHATS)

class Daemon:
    def __init__(self):
        cfg = json.load(open(CFG, encoding='utf-8'))
        self.bot_id, self.secret = cfg['bot_id'], cfg['secret']
        self.ws = None
        self.last_ping = 0

    def connect(self):
        self.ws = websocket.create_connection(WSS, timeout=20)
        self.send('aibot_subscribe', {'bot_id': self.bot_id, 'secret': self.secret})
        resp = json.loads(self.ws.recv())
        if resp.get('errcode') != 0:
            raise RuntimeError(f"订阅失败: {resp}")
        log('订阅成功，长连接建立')

    def send(self, cmd, body=None, req_id=None):
        msg = {'cmd': cmd, 'headers': {'req_id': req_id or str(uuid.uuid4())}}
        if body is not None:
            msg['body'] = body
        self.ws.send(json.dumps(msg, ensure_ascii=False))
        return msg['headers']['req_id']

    def record_chat(self, body):
        chats = load_json(CHATS, {'chats': []})
        chattype = body.get('chattype', 'single')
        chatid = body.get('chatid') or (body.get('from') or {}).get('userid')
        if not chatid:
            return
        entry = {'chatid': chatid, 'chattype': chattype,
                 'from': (body.get('from') or {}).get('userid', ''),
                 'last_seen': time.strftime('%F %T')}
        known = False
        for c in chats['chats']:
            if c['chatid'] == chatid:
                c.update(entry); known = True
        if not known:
            chats['chats'].append(entry)
            log(f"新会话登记: {chattype} {chatid}")
        save_chats(chats)

    def push_queue(self):
        chats = load_json(CHATS, {'chats': []}).get('chats', [])
        if not chats:
            return
        for path in sorted(glob.glob(os.path.join(QUEUE, '*.json'))):
            try:
                item = json.load(open(path, encoding='utf-8'))
                content = item['content']
                targets = [c for c in chats if not item.get('chatid') or c['chatid'] == item['chatid']]
                ok_all = True
                for c in targets:
                    body = {'chatid': c['chatid'],
                            'chat_type': 2 if c['chattype'] == 'group' else 1,
                            'msgtype': 'markdown', 'markdown': {'content': content}}
                    self.send('aibot_send_msg', body)
                    # 读响应（同连接按序返回）
                    resp = json.loads(self.ws.recv())
                    if resp.get('errcode') != 0:
                        ok_all = False
                        log(f"推送失败 {c['chatid']}: {resp}")
                    else:
                        log(f"推送成功 → {c['chattype']} {c['chatid']}（{len(content)} 字符）")
                if ok_all:
                    os.replace(path, os.path.join(SENT, os.path.basename(path)))
            except Exception:
                log('推送异常:\n' + traceback.format_exc())
                raise  # 连接可能已坏，交给外层重连

    def handle_callback(self, msg):
        cmd = msg.get('cmd', '')
        body = msg.get('body', {})
        if cmd in ('aibot_msg_callback', 'aibot_event_callback'):
            self.record_chat(body)
            ev = (body.get('event') or {}).get('eventtype', '')
            if cmd == 'aibot_event_callback' and ev == 'enter_chat':
                self.send('aibot_respond_welcome_msg',
                          {'msgtype': 'text', 'text': {'content': '命理宝鉴推送通道已接通。晨推暮推将在此送达。'}},
                          req_id=msg['headers']['req_id'])
                log('已回复欢迎语')
            elif cmd == 'aibot_msg_callback':
                text = (body.get('text') or {}).get('content', '')
                log(f"收到消息: {text[:50]}")
                self.send('aibot_respond_msg',
                          {'msgtype': 'text', 'text': {'content': '通道正常。每日推送将自动送达，无需回复。'}},
                          req_id=msg['headers']['req_id'])
            elif ev == 'disconnected_event':
                log('收到断开事件（新连接踢旧连接）')
                raise ConnectionError('kicked')

    def run(self):
        backoff = 5
        while True:
            try:
                self.connect()
                backoff = 5
                self.ws.settimeout(5)
                while True:
                    now = time.time()
                    if now - self.last_ping > 30:
                        self.send('ping')
                        self.last_ping = now
                    self.push_queue()
                    try:
                        raw = self.ws.recv()
                        if raw:
                            self.handle_callback(json.loads(raw))
                    except websocket.WebSocketTimeoutException:
                        pass
            except Exception as e:
                log(f'连接断开: {e}，{backoff}s 后重连')
                try:
                    self.ws and self.ws.close()
                except Exception:
                    pass
                time.sleep(backoff)
                backoff = min(backoff * 2, 300)

if __name__ == '__main__':
    log('=== 守护启动 ===')
    Daemon().run()
