# 《断易大全》书影获取与版本核验记录

- 记录日期：2026-10-26（P19）。
- 目标：为卷一正文及“經驗卦例十五條”取得可逐页目视的书影；不以现代目录、网页断语或相关异本替代原文。

## 已确认来源

| 项目 | 记录 |
|---|---|
| Wikimedia Commons 文件 | `File:SSID-13319395 卜筮源流斷易大全.pdf` |
| 文件页 | https://commons.wikimedia.org/wiki/File:SSID-13319395_%E5%8D%9C%E7%AD%AE%E6%BA%90%E6%B5%81%E6%96%B7%E6%98%93%E5%A4%A7%E5%85%A8.pdf |
| 公开元数据 | 287 页；52.13 MB；683×1077 像素；PDF 1.5；出版者标作“锦章书局” |
| 原始文件字节数 | 54,666,851 bytes（HTTP `Content-Length`） |
| 原始文件直链 | https://upload.wikimedia.org/wikipedia/commons/9/9d/SSID-13319395_%E5%8D%9C%E7%AD%AE%E6%BA%90%E6%B5%81%E6%96%B7%E6%98%93%E5%A4%A7%E5%85%A8.pdf |
| 元数据时间 | 文件页载当前版本上传于 2022-12-26 05:51；本轮于 2026-10-26 复核 |

## 本地状态与边界

- 既有 `corpus/duanyi-daquan/SSID-13319395-duanyi-daquan.pdf` 只有 266,240 bytes，缺少 PDF 结束标记，`pypdf` 报 `EOF marker not found`，确为截断片段；保持原文件不动，不作底本。
- 分段保存在 `corpus/source-scans/duanyi-daquan/chunk1m/`。2026-10-27 经单线程退避续传，53/53 个 1 MiB 分段均通过大小校验，已合并为 `corpus/source-scans/duanyi-daquan/SSID-13319395-complete.pdf`；完整文件 **54,666,851 bytes**，`pypdf` 实测 **287 页**，无文本层。分段、完整扫描、联系图及逐页渲染均不提交 Git。
- 整文件 GET 多次超时；并发分段曾触发 HTTP 429。续传脚本已改为首次收到 429 即退出，不再继续请求其他分段或进入第二遍；后续按限时、单线程、退避方式完成，不以不完整文件拼造 PDF。
- 韩国学档案（율곡국학진흥원）卷一 `B005_01_B00448_001`、卷二 `B005_01_B00448_002` 的检索目录标作民国 21 年（1932）上海千顷堂石印本，与 Commons 本、国图老二酉堂本均须分立版本；viewer 文本可确认卷名，但页面图像计数为 0，本地 curl 返回 HTTP 204，内置浏览器为 `ERR_CONNECTION_CLOSED`，尚未取得可校录图像，未用该记录代填卦例或异文。
- 工具：`scripts/fetch-duanyi-daquan-scan.py` 负责续传与整卷校验；`scripts/render-duanyi-daquan-contact.py` 生成 18 张全书联系图；`scripts/ocr-duanyi-daquan.py` 渲染单页并可选 OCR。OCR 只辅助定位，不作正文底本。

## 版本与正文核验结果

1. PDF 1 封面题「卜筮源流断易大全」；PDF 3 内书名页题「改良断易大全」；PDF 4 为「断易大全序」；PDF 5—8 为目录。PDF 285—287 为正文末页，未见出版牌记。Commons 元数据虽标「锦章书局」，本条只将其作为平台元数据，不冒充书影自证。
2. 目录明确列「新增经验例十五条」；正文「经验卦例」起于 PDF 64（原叶下卅一），止于 PDF 68（原叶下卅三）「论六神赋」之前。逐页目视核得十五条，第 13 条跨 PDF 67—68。
3. 十五条叙事文字已人工初校，详见 `duanyi-daquan-collation-ledger.md` 与 `duanyi-daquan-transcript.md` 的 case-01 至 case-15。原书卦图只记录图位，未伪称完成图形数据化。
4. Commons 本与清京都老二酉堂刻本继续分立；目前只有 Commons 本正文图像，故不能宣称完成老二酉堂本对校，也不将十五条署作余兴国本原文。千顷堂本同样未获对校图像。
5. 第 4、14、15 条及少数句读保留待校说明；其余卷篇未因本次十五条校录而自动完成。
