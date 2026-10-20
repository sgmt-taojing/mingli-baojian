#!/usr/bin/env bash
# R29-2: /api/camera/upload 鉴权自检
# 用法: CAMERA_API_KEY=testkey123 ./scripts/r29-test-camera-auth.sh
# 依赖: curl, python3 (仅用于构造最小 multipart body)
set -euo pipefail

HOST="${FACE_OCR_HOST:-127.0.0.1}"
PORT="${FACE_OCR_PORT:-8913}"
BASE="http://${HOST}:${PORT}"
KEY="${CAMERA_API_KEY:-testkey_r29}"

echo "R29-2 鉴权自检 — target ${BASE}"
echo "CAMERA_API_KEY=${KEY}"
echo

# --- 构造 multipart body ---
# 用 PIL 生成 400x400 浅灰 JPEG（满足 face 模式尺寸/亮度/比例 pre-check）
TMPBODY=$(mktemp /tmp/r29_test_XXXX.jpg)
python3 - <<PYEOF
try:
    from PIL import Image
    import io
    img = Image.new('RGB', (400, 400), (180, 180, 180))
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=85)
    open('${TMPBODY}', 'wb').write(buf.getvalue())
except Exception:
    # 兜底：1x1 px（不通过 pre-check 仍可达 server 鉴权）
    import base64
    data = base64.b64decode('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8Av//Z')
    open('${TMPBODY}', 'wb').write(data)
PYEOF
MULTIPART=$(mktemp /tmp/r29_mp_XXXX)
BOUNDARY="----r29testboundary"

# 构造 multipart/form-data
{
  printf -- "--%s\r\n" "$BOUNDARY"
  printf 'Content-Disposition: form-data; name="file"; filename="test.jpg"\r\n'
  printf 'Content-Type: image/jpeg\r\n\r\n'
  cat "$TMPBODY"
  printf "\r\n--%s\r\n" "$BOUNDARY"
  printf 'Content-Disposition: form-data; name="mode"\r\n\r\n'
  printf "face\r\n"
  printf -- "--%s--\r\n" "$BOUNDARY"
} > "$MULTIPART"

PASS=0; FAIL=0

check() {
  local desc="$1" expected="$2" code="$3"
  if [ "$code" = "$expected" ]; then
    echo "  ✅ PASS: $desc → HTTP $code"
    PASS=$((PASS+1))
  else
    echo "  ❌ FAIL: $desc → HTTP $code (期望 $expected)"
    FAIL=$((FAIL+1))
  fi
}

echo "=== Case 1: 不带 X-API-Key → 期望 401 ==="
CODE=$(curl -s -o /dev/null -w '%{http_code}' \
  -X PUT "${BASE}/api/camera/upload" \
  -H "Content-Type: multipart/form-data; boundary=${BOUNDARY}" \
  --data-binary "@${MULTIPART}")
check "no X-API-Key" "401" "$CODE"

echo "=== Case 2: 错误 X-API-Key → 期望 401 ==="
CODE=$(curl -s -o /dev/null -w '%{http_code}' \
  -X PUT "${BASE}/api/camera/upload" \
  -H "X-API-Key: wrong_secret_key" \
  -H "Content-Type: multipart/form-data; boundary=${BOUNDARY}" \
  --data-binary "@${MULTIPART}")
check "wrong X-API-Key" "401" "$CODE"

echo "=== Case 3: 正确 X-API-Key → 期望 200 ==="
CODE=$(curl -s -o /dev/null -w '%{http_code}' \
  -X PUT "${BASE}/api/camera/upload" \
  -H "X-API-Key: ${KEY}" \
  -H "Content-Type: multipart/form-data; boundary=${BOUNDARY}" \
  --data-binary "@${MULTIPART}")
check "correct X-API-Key" "200" "$CODE"

echo
echo "结果: ${PASS} passed, ${FAIL} failed"

# cleanup
rm -f "$TMPBODY" "$MULTIPART"
[ "$FAIL" = "0" ]
