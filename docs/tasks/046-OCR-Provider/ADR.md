# TASK-046：架构决策

## 决策

OCR 作为 `multimodal` 内部 provider 能力实现，不新增独立领域模块。

## 原因

- 当前多模态附件已经有上传、MinIO、Repository 和 Chat context 链路。
- OCR 的第一目标是为附件生成文本上下文，不是知识库索引。
- 保持 `Controller -> Service -> Provider` 边界，避免业务层依赖具体 OCR SDK。

## 取舍

- 采用 HTTP provider，而不是本地 Tesseract，降低部署复杂度。
- 第一版不做版面结构、页码和图片区域坐标。
- metadata fallback 保证没有真实 provider 时 demo 仍可运行。

## 后果

- 后续 TASK-049 可以复用 OCR provider 做 IMAGE 文档解析。
- 如果需要高质量版面 OCR，可以在 provider 返回 metadata 中扩展。
