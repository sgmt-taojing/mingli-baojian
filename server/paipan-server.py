#!/usr/bin/env python3
"""
乾元命理宝鉴 — 排盘API服务
基于 HeiGe-SuanMing paipan.py v1.2 精确排盘引擎
端口: 8911

提供 HTTP API：
  POST /paipan  — 精确排盘（返回JSON命盘）
  POST /analyze — 排盘+分析方法论引导（返回结构化分析框架）
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os
import sys
import subprocess
from urllib.parse import parse_qs

PORT = 8911
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PAIPAN_PY = os.path.join(SCRIPT_DIR, "paipan.py")

class PaipanHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self._cors_headers()
        self.end_headers()

    def do_POST(self):
        if self.path == '/paipan':
            self._handle_paipan()
        elif self.path == '/analyze':
            self._handle_analyze()
        else:
            self.send_error(404)

    def _handle_paipan(self):
        try:
            body = self._read_json()
            args = self._build_args(body)
            result = subprocess.run(
                ['python3', PAIPAN_PY] + args + ['--json'],
                capture_output=True, text=True, timeout=30
            )
            if result.returncode != 0:
                self._json_error(500, f"排盘失败: {result.stderr[:500]}")
                return
            data = json.loads(result.stdout)
            self._json_ok(data)
        except Exception as e:
            self._json_error(500, str(e))

    def _handle_analyze(self):
        try:
            body = self._read_json()
            args = self._build_args(body)
            result = subprocess.run(
                ['python3', PAIPAN_PY] + args + ['--json'],
                capture_output=True, text=True, timeout=30
            )
            if result.returncode != 0:
                self._json_error(500, f"排盘失败: {result.stderr[:500]}")
                return
            chart = json.loads(result.stdout)

            # Build analysis framework based on HeiGe methodology
            analysis = self._build_analysis_framework(chart, body)
            self._json_ok({"chart": chart, "analysis": analysis})
        except Exception as e:
            self._json_error(500, str(e))

    def _build_analysis_framework(self, chart, request):
        """基于 HeiGe SKILL.md 11步方法论构建分析框架"""
        day_gan = chart.get('day_gan', '')
        day_ele = chart.get('day_ele', '')
        month_zhi = chart.get('month_zhi', '')
        wuxing_power = chart.get('wuxing_power', {})
        same_party = chart.get('same_party', 0)
        diff_party = chart.get('diff_party', 0)
        geju = chart.get('geju', [])
        shensha = chart.get('shensha', {})
        dayun = chart.get('dayun', [])
        relations = chart.get('relations', {})

        return {
            "step1_read": {
                "day_master": f"{day_gan}({day_ele})",
                "month_zhi": month_zhi,
                "key_relations": relations,
                "missing_wuxing": chart.get('missing_wuxing', [])
            },
            "step2_wangshuai": {
                "wuxing_power": wuxing_power,
                "same_party_pct": round(same_party / (same_party + diff_party) * 100, 1) if (same_party + diff_party) > 0 else 0,
                "hint": "需结合月令得失、通根、生扶、党众四看综合判断",
                "congge": chart.get('congge', None)
            },
            "step3_yongshen": {
                "hint": "优先级：调候 ≥ 扶抑 > 通关 > 病药；从格则顺势",
                "tiaohou": chart.get('tiaohou', None),
                "needs_tiaohou": self._check_tiaohou_need(day_ele, month_zhi)
            },
            "step4_geju": {
                "geju": geju,
                "hint": "以月令本气透干定格，看成败救应定层次"
            },
            "step5_dayun": {
                "dayun": dayun[:6],
                "hint": "看大运引动用神还是忌神，注意冲提纲、冲用神"
            },
            "step6_shishen": {
                "shensha": shensha,
                "hint": "标出各十神所在宫位，对应人生阶段与领域"
            },
            "step7_dimensions": {
                "available": ["性格", "事业", "财运", "婚姻", "健康", "学业", "六亲"],
                "hint": "每维度结论需注明依据（星+宫，或原局+岁运），孤证不立"
            },
            "step8_tiaohou_lifestyle": {
                "hint": "用神落到方位、色彩、行业、养生调养",
                "use_ele": chart.get('use_ele', '')
            },
            "step9_summary": {
                "hint": "3-5句收束：核心结构、格局高低、一生大势、优势与短板"
            },
            "methodology": "HeiGe-SuanMing v1.2 — 排盘→旺衰→用神→格局→岁运→十神六亲→分维度断语→调候趋避→综合总评"
        }

    def _check_tiaohou_need(self, day_ele, month_zhi):
        """检查是否需要调候"""
        month_ele = {'寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土',
                      '申':'金','酉':'金','戌':'土','亥':'水','子':'水','丑':'土'}.get(month_zhi, '')
        if month_ele in ['火'] and day_ele in ['金','水']:
            return "夏生金水，需调候（火旺金脆、水被熬干）"
        if month_ele in ['水'] and day_ele in ['火','木']:
            return "冬生火木，需调候（水旺火灭、木寒不生）"
        return None

    def _build_args(self, body):
        args = [
            str(body['year']),
            str(body['month']),
            str(body['day']),
            str(body.get('hour', 12)),
            str(body.get('minute', 0)),
            '--gender', body.get('sex', 'male')
        ]
        if body.get('lunar'):
            args.append('--lunar')
        if body.get('lng') is not None:
            args.extend(['--lng', str(body['lng'])])
        if body.get('tz') is not None:
            args.extend(['--tz', str(body['tz'])])
        if body.get('years'):
            args.extend(['--years', str(body['years'][0]), str(body['years'][1])])
        if body.get('zi_sect'):
            args.extend(['--zi-sect', str(body['zi_sect'])])
        return args

    def _read_json(self):
        length = int(self.headers.get('Content-Length', 0))
        return json.loads(self.rfile.read(length))

    def _json_ok(self, data):
        self.send_response(200)
        self._cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())

    def _json_error(self, code, msg):
        self.send_response(code)
        self._cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"error": msg}, ensure_ascii=False).encode())

    def _cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def log_message(self, format, *args):
        pass

def main():
    server = HTTPServer(('0.0.0.0', PORT), PaipanHandler)
    print(f"🚀 排盘API服务已启动: http://127.0.0.1:{PORT}")
    print(f"   引擎: HeiGe-SuanMing paipan.py v1.2")
    print(f"   端点: POST /paipan (排盘), POST /analyze (排盘+分析框架)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 服务已停止")
        server.server_close()

if __name__ == '__main__':
    main()
