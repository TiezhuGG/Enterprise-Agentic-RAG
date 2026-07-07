# TASK-010 Processing Sequence

# Success Flow

Document

status=PROCESSING

|

DocumentProcessorService

|

StorageService.getObject()

|

ParserFactory

|

Concrete Parser

|

Markdown Content

|

DocumentContentRepository

|

save(content)

|

DocumentRepository

|

status=READY

---

# Failed Flow

Document

|

Parser Exception

|

DocumentRepository

|

status=FAILED

记录error message

---

# Future AI Pipeline

READY

↓

Chunk

↓

Embedding

↓

Index
