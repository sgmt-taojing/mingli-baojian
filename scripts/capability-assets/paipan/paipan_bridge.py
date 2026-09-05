"""paipan_bridge.py — 家庭生活助手·命理排盘能力桥（自有能力内化）

来源：capability-mingli-paipan v1.1.0（provider: mingli-baojian，已登记 _shared/capability-registry.json）
定位：family 以 subprocess 调用本地排盘引擎，结果内化为 family 自有能力对外服务；
      引擎代码为本目录自带副本（code/），不运行时依赖 mingli 项目文件。
依赖：系统 node + mingli-baojian/node_modules（lunar-typescript / iztro，NODE_PATH 复用）；
      bazi 引擎为 Python 实现（code/paipan-bazi.py），依赖系统 python3 + lunar_python。

用法：
    from capabilities.paipan.paipan_bridge import paipan
    r = paipan("qimen", year=2026, month=8, day=27, hour=20)          # -> dict
    r = paipan("ziwei", date="1990-05-15", time="14:00", gender="男")  # -> dict
    r = paipan("bazi", year=1990, month=5, day=15, hour=14, gender="男")  # -> dict
"""
import json
import os
import subprocess
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))
_RUNNER = os.path.join(_HERE, "code", "_runner.js")
_BAZI_PY = os.path.join(_HERE, "code", "paipan-bazi.py")
_MINGLI_NM = os.path.expanduser(
    "~/.openclaw-autoclaw/workspace/projects/mingli-baojian/node_modules"
)

_NODE_ENGINES = ("qimen", "liuyao", "meihua", "liuren", "ziwei")
_ENGINES = _NODE_ENGINES + ("bazi",)


def _run_node(engine, data, timeout):
    env = dict(os.environ)
    env["NODE_PATH"] = _MINGLI_NM + os.pathsep + env.get("NODE_PATH", "")
    try:
        r = subprocess.run(
            ["node", _RUNNER, engine, json.dumps(data, ensure_ascii=False)],
            capture_output=True, text=True, timeout=timeout, env=env,
        )
        return json.loads(r.stdout.strip().splitlines()[-1])
    except subprocess.TimeoutExpired:
        return {"ok": False, "error": f"排盘超时（{timeout}s）"}
    except (json.JSONDecodeError, IndexError) as e:
        return {"ok": False, "error": f"引擎输出异常: {e}; stderr={r.stderr[:200] if r else ''}"}
    except FileNotFoundError:
        return {"ok": False, "error": "node 不可用"}


def _run_bazi(year, month, day, hour, minute, gender, lunar, lng, timeout):
    cmd = [sys.executable or "python3", _BAZI_PY,
           str(year), str(month), str(day), str(hour or 0), str(minute or 0),
           "--gender", "male" if str(gender) in ("男", "male", "m", "M") else "female",
           "--json"]
    if lunar:
        cmd.append("--lunar")
    if lng is not None:
        cmd += ["--lng", str(lng)]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        if r.returncode != 0:
            return {"ok": False, "error": f"八字引擎退出码 {r.returncode}: {r.stderr[:200]}"}
        return {"ok": True, "engine": "bazi-python", "data": json.loads(r.stdout)}
    except subprocess.TimeoutExpired:
        return {"ok": False, "error": f"排盘超时（{timeout}s）"}
    except json.JSONDecodeError as e:
        return {"ok": False, "error": f"八字引擎输出异常: {e}"}
    except FileNotFoundError:
        return {"ok": False, "error": "python3 不可用"}


def paipan(engine, year=None, month=None, day=None, hour=0, minute=0,
           date=None, time=None, gender="男", is_lunar=False, lng=None, timeout=15):
    """调用排盘引擎。

    engine ∈ {qimen, liuyao, meihua, liuren, ziwei, bazi}；返回引擎结果 dict。
    ziwei 额外支持 date="YYYY-MM-DD" + time="HH:MM" 入参（与能力包契约一致）。
    """
    if engine not in _ENGINES:
        return {"ok": False, "error": f"未知引擎 {engine}，可选 {_ENGINES}"}
    if engine == "bazi":
        return _run_bazi(year, month, day, hour, minute, gender, is_lunar, lng, timeout)
    data = {"year": year, "month": month, "day": day, "hour": hour or 0,
            "minute": minute or 0, "gender": gender, "isLunar": bool(is_lunar)}
    if date:
        data["date"] = date
        data["time"] = time or "0:0"
    if lng is not None:
        data["lng"] = lng
    return _run_node(engine, data, timeout)


def selftest():
    """6 用例自检：5 Node 引擎 + bazi Python 引擎。"""
    cases = [
        ("qimen", dict(year=2026, month=8, day=27, hour=20)),
        ("liuyao", dict(year=2026, month=8, day=27, hour=20)),
        ("meihua", dict(year=2026, month=8, day=27, hour=20)),
        ("liuren", dict(year=2026, month=8, day=27, hour=20)),
        ("ziwei", dict(date="1990-05-15", time="14:00", gender="男")),
        ("bazi", dict(year=1990, month=5, day=15, hour=14, gender="男")),
    ]
    passed = 0
    for eng, kw in cases:
        r = paipan(eng, **kw)
        ok = bool(r.get("ok") and r.get("data"))
        # ziwei 契约字段须非空（防 date/time 解析回归）
        if ok and eng == "ziwei":
            d = r["data"]
            ok = bool(d.get("year") and d.get("yearGanZhi"))
        # bazi 须有日主
        if ok and eng == "bazi":
            ok = bool(r["data"].get("day_master"))
        print(f"{'PASS' if ok else 'FAIL'} {eng} -> {r.get('engine') or r.get('error')}")
        passed += ok
    print(f"paipan_bridge selftest: {passed}/{len(cases)} passed")
    return passed == len(cases)


if __name__ == "__main__":
    raise SystemExit(0 if selftest() else 1)
