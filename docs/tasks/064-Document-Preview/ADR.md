# TASK-064：ADR

## 决策

新增 `GET /documents/:id/preview` 返回受限长度的解析内容预览，同时继续复用已有 `/documents/:id/file` 作为原文件预览/下载入口。

## 原因

- 原文件预览需要二进制流和浏览器能力。
- 解析内容预览需要权限过滤、截断和 metadata。
- 将两者拆开可以避免一个接口既返回 JSON 又返回二进制。

## 为什么限制 maxChars

`DocumentContent.content` 可能很大。预览接口第一版只用于演示和快速确认解析质量，不作为全文阅读器。

默认 20000 字符，最大 50000 字符，避免前端卡顿和过大响应。

## 权限边界

Preview 是文档读取能力，必须和文档详情、文件预览、metadata 使用同一套：

- tenant。
- Space role。
- Document accessScope。
- AccessPolicyService。

## 后果

- 用户可确认解析效果。
- 对 PDF/图片等原文件，仍可继续用浏览器预览。
- 对不支持原文件预览的音频/视频/Word，也能看到 parsed content fallback。
- 后续 TASK-065 Document Versioning 可以在 preview response 中加入 version 信息。
