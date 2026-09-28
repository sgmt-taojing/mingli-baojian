// ocr-vision-batch.swift — 批量 Vision OCR（每张图输出一个 .txt，横竖排自适应）
// 用法: ocr-vision-batch <img_dir> [out_dir]
// stdout 进度: <文件名>\t<N>字 ；全文在 out_dir/<文件名>.txt（含换行）
import Foundation
import Vision

let args = CommandLine.arguments
guard args.count >= 2 else {
    FileHandle.standardError.write("usage: ocr-vision-batch <img_dir> [out_dir]\n".data(using: .utf8)!)
    exit(2)
}
let imgDir = args[1]
let outDir = args.count > 2 ? args[2] : imgDir + "-out"
try? FileManager.default.createDirectory(atPath: outDir, withIntermediateDirectories: true)

let exts: Set<String> = ["jpg", "jpeg", "png", "tif", "tiff", "bmp"]
let files = (try? FileManager.default.contentsOfDirectory(atPath: imgDir))?
    .filter { exts.contains(($0 as NSString).pathExtension.lowercased()) }.sorted() ?? []

struct Line { let text: String; let midX: CGFloat; let midY: CGFloat; let height: CGFloat; let width: CGFloat }

for f in files {
    let url = URL(fileURLWithPath: imgDir + "/" + f)
    let req = VNRecognizeTextRequest()
    req.recognitionLevel = .accurate
    req.recognitionLanguages = ["zh-Hant", "zh-Hans", "en"]
    if #available(macOS 13.0, *) { req.revision = VNRecognizeTextRequestRevision3 }
    let handler = VNImageRequestHandler(url: url, options: [:])
    do { try handler.perform([req]) } catch {
        FileHandle.standardError.write("\(f) 识别失败: \(error)\n".data(using: .utf8)!)
        continue
    }
    var lines: [Line] = []
    for obs in req.results ?? [] {
        guard let cand = obs.topCandidates(1).first else { continue }
        let b = obs.boundingBox
        lines.append(Line(text: cand.string, midX: b.midX, midY: b.midY, height: b.height, width: b.width))
    }
    let avgH = lines.map { $0.height }.reduce(0, +) / CGFloat(max(lines.count, 1))
    // 横竖排判定看行框宽高比中位数：横排行宽>高，竖排列高>宽
    let aspects = lines.map { $0.height / max($0.width, 0.0001) }.sorted()
    let medAspect = aspects.isEmpty ? 0 : aspects[aspects.count / 2]
    let vertical = medAspect > 1.0
    // 行桶化排序：按行高分桶保证传递性
    let bucket = max(avgH * 0.6, 0.01)
    let sorted = vertical
        ? lines.sorted {
            let ca = Int($0.midX / bucket), cb = Int($1.midX / bucket)
            return ca != cb ? ca > cb : $0.midY > $1.midY
        }
        : lines.sorted {
            let ra = Int($0.midY / bucket), rb = Int($1.midY / bucket)
            return ra != rb ? ra > rb : $0.midX < $1.midX
        }
    let output = sorted.map { $0.text }.joined(separator: "\n")
    let outFile = outDir + "/" + (f as NSString).deletingPathExtension + ".txt"
    try? output.write(toFile: outFile, atomically: true, encoding: .utf8)
    print("\(f)\t\(output.count)字")
}
