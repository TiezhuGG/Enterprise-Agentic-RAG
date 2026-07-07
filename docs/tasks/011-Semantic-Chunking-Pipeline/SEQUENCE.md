# TASK-011 Chunking Sequence

# Success Flow

DocumentContent

|

ChunkingService

|

MarkdownSplitter

|

TokenSplitter

|

Chunk Entity

|

ChunkRepository

|

Database

---

# Rebuild Flow

processChunks(documentId)

|

delete old chunks

|

generate new chunks

|

save chunks

---

# Future Flow

Chunk

|

Embedding Service

|

Vector Storage
