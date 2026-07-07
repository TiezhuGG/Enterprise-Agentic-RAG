# ADR-013 Document Parser Strategy Pattern

## Status

Accepted

---

# Context

知识库未来需要支持：

PDF

DOCX

IMAGE

AUDIO

VIDEO

如果DocumentService中直接写：

if(pdf)

else if(docx)

未来会快速失控。

---

# Decision

采用Parser Strategy Pattern。

Architecture:

DocumentProcessor

|

ParserFactory

|

Parser Interface

|

Concrete Parser

---

# Example

PDFParser

DOCXParser

TXTParser

---

# Benefits

## 1. 易扩展

新增格式：

只需要新增Parser。

---

## 2. 解耦

业务不知道：

文件如何解析。

---

## 3. 支持AI增强

未来：

ImageParser

↓

Vision Model

AudioParser

↓

ASR

VideoParser

↓

Video Understanding Model

---

# Consequence

增加抽象层。

但是换取长期可维护性。
