// ocr-vision.swift — macOS Vision 古籍影像 OCR（命理宝鉴影像管线核心件 · 2026-09-28）
// 用法: swiftc -o ocr-vision ocr-vision.swift && ./ocr-vision <image> [out.txt]
// 特性: 繁体中文优先、竖排从右至左列重排、accurate 级识别
import Foundation
import Vision
import AppKit

guard CommandLine.arguments.count >= 2 else {
    FileHandle.standardError.write("usage: ocr-vision <image> [out.txt]\n".data(using: .utf8)!)
    exit(2)
}
let imgPath = CommandLine.arguments[1]
let outPath = CommandLine.arguments.count > 2 ? CommandLine.arguments[2] : nil

let imgURL = URL(fileURLWithPath: imgPath)
guard FileManager.default.fileExists(atPath: imgPath) else {
    FileHandle.standardError.write("文件不存在: \(imgPath)\n".data(using: .utf8)!)
    exit(1)
}

let req = VNRecognizeTextRequest()
req.recognitionLevel = .accurate
req.recognitionLanguages = ["zh-Hant", "zh-Hans", "en"]
// 竖排古籍适配：revision 3+ 才有 CJK 竖排支持；语言纠错关掉（文言会被改坏）
if #available(macOS 13.0, *) {
    req.revision = VNRecognizeTextRequestRevision3
}

let handler = VNImageRequestHandler(url: imgURL, options: [:])
do {
    try handler.perform([req])
} catch {
    FileHandle.standardError.write("识别失败: \(error)\n".data(using: .utf8)!)
    exit(1)
}

struct Line {
    let text: String
    let midX: CGFloat   // 归一化中心 x
    let midY: CGFloat
    let height: CGFloat
}

var lines: [Line] = []
for obs in req.results ?? [] {
    guard let cand = obs.topCandidates(1).first else { continue }
    let box = obs.boundingBox
    lines.append(Line(text: cand.string, midX: box.midX, midY: box.midY, height: box.height))
}

// 判定横排/竖排：行高均值 vs 行宽。Vision 对竖排古籍返回的行框是竖长条（height 大）
// 竖排：按列从右往左（midX 降序），同列内自上而下（midY 降序，Vision y 轴向上）
let avgH = lines.map { $0.height }.reduce(0, +) / CGFloat(max(lines.count, 1))
let vertical = avgH > 0.08  // 行框平均高度 > 8% 页面高度 → 判竖排

let output: String
if vertical {
    let sorted = lines.sorted { a, b in
        if abs(a.midX - b.midX) > 0.02 { return a.midX > b.midX }  // 列从右往左
        return a.midY > b.midY                                      // 列内自上而下
    }
    output = sorted.map { $0.text }.joined(separator: "\n")
} else {
    let sorted = lines.sorted { a, b in
        if abs(a.midY - b.midY) > 0.01 { return a.midY > b.midY }  // 行自上而下
        return a.midX < b.midX
    }
    output = sorted.map { $0.text }.joined(separator: "\n")
}

if let out = outPath {
    try? output.write(toFile: out, atomically: true, encoding: .utf8)
} else {
    print(output)
}
FileHandle.standardError.write("识别 \(lines.count) 行 · 版式: \(vertical ? "竖排" : "横排")\n".data(using: .utf8)!)
