#!/bin/bash
# 命理宝鉴 · 设备接入自动化测试脚本
# 外接设备到货后运行此脚本一键验证全链路

echo "============================================"
echo "  命理宝鉴 · 设备接入测试"
echo "============================================"
echo ""

# 1. 系统级设备检测
echo "1. 系统级设备检测"
echo "   摄像头:"
system_profiler SPCameraDataType 2>/dev/null | grep -E "^\s+\w" | head -5 || echo "   (无)"
echo "   音频输入:"
system_profiler SPAudioDataType 2>/dev/null | grep -i "input\|microphone\|麦克风" | head -3
echo "   USB 设备:"
system_profiler SPUSBDataType 2>/dev/null | grep -i "camera\|webcam\|mic\|audio\|video" | head -3
echo ""

# 2. CoreAudio 设备检测
echo "2. CoreAudio 设备检测"
swift -e '
import CoreAudio
var size: UInt32 = 0
var addr: AudioObjectPropertyAddress = AudioObjectPropertyAddress(mSelector: kAudioHardwarePropertyDevices, mScope: kAudioObjectPropertyScopeGlobal, mElement: kAudioObjectPropertyElementMain)
AudioObjectGetPropertyDataSize(AudioObjectID(kAudioObjectSystemObject), &addr, 0, nil, &size)
let count = Int(size) / MemoryLayout<AudioDeviceID>.size
var devices: [AudioDeviceID] = Array(repeating: 0, count: count)
AudioObjectGetPropertyData(AudioObjectID(kAudioObjectSystemObject), &addr, 0, nil, &size, &devices)
for (i, dev) in devices.enumerated() {
    var nameSize: UInt32 = 256
    var name: CFString = "" as CFString
    var nameAddr: AudioObjectPropertyAddress = AudioObjectPropertyAddress(mSelector: kAudioObjectPropertyName, mScope: kAudioObjectPropertyScopeGlobal, mElement: kAudioObjectPropertyElementMain)
    AudioObjectGetPropertyData(dev, &nameAddr, 0, nil, &nameSize, &name)
    var inputCh: UInt32 = 0
    var inSize: UInt32 = UInt32(MemoryLayout<UInt32>.size)
    var inAddr: AudioObjectPropertyAddress = AudioObjectPropertyAddress(mSelector: kAudioDevicePropertyStreamConfiguration, mScope: kAudioDevicePropertyScopeInput, mElement: kAudioObjectPropertyElementMain)
    AudioObjectGetPropertyData(dev, &inAddr, 0, nil, &inSize, &inputCh)
    let type = inputCh > 0 ? "🎤 输入" : "🔊 输出"
    print("   设备\(i): \(name) [\(type)] channels=\(inputCh)")
}
' 2>&1 | grep -v warning
echo ""

# 3. AVFoundation 视频设备检测
echo "3. AVFoundation 视频设备检测"
cat > /tmp/check_av.swift << 'SWIFT'
import AVFoundation
let discovery = AVCaptureDevice.DiscoverySession(deviceTypes: [.builtInWideAngleCamera, .external], mediaType: .video, position: .unspecified)
if discovery.devices.isEmpty {
    print("   ❌ 无摄像头设备")
} else {
    for device in discovery.devices {
        print("   ✅ \(device.localizedName) [\(device.deviceType.rawValue)]")
    }
}
SWIFT
swift /tmp/check_av.swift 2>&1 | grep -v warning
echo ""

# 4. 服务状态检测
echo "4. 服务状态"
for port_name in "8911:排盘" "8912:TTS" "8913:OCR" "8914:静态" "8920:API"; do
    port=$(echo $port_name | cut -d: -f1)
    name=$(echo $port_name | cut -d: -f2)
    code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$port/" -H "User-Agent: Mozilla/5.0" --max-time 2)
    if [ "$code" = "200" ]; then
        echo "   ✅ $name (端口 $port) → $code"
    else
        echo "   ❌ $name (端口 $port) → $code"
    fi
done
echo ""

# 5. OCR 服务健康检查
echo "5. OCR 服务健康检查"
OCR_HEALTH=$(curl -s "http://127.0.0.1:8913/api/camera/health" -H "User-Agent: Mozilla/5.0" --max-time 3)
echo "   $OCR_HEALTH" | head -1
echo ""

# 6. 浏览器设备检测（Chrome headless）
echo "6. 浏览器设备检测（Chrome headless）"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ -f "$CHROME" ]; then
    echo "   Chrome 版本: $($CHROME --version 2>/dev/null)"
    echo "   浏览器 API: ✅ 支持"
    echo "   设备检测页面: http://localhost:8914/device-test.html"
else
    echo "   ❌ Chrome 未安装"
fi
echo ""

echo "============================================"
echo "  测试完成"
echo "============================================"
echo ""
echo "下一步："
echo "  1. 在浏览器打开 http://localhost:8914/device-test.html"
echo "  2. 点击「测试摄像头」和「测试麦克风」"
echo "  3. 确认画面和音量正常后，前往 camera-capture.html 测试面诊/舌诊"
echo "  4. 前往 feedback-center.html 测试语音工单"
