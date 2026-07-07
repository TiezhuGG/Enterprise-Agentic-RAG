# TASK-012 Embedding Sequence

# Index Flow

Document

|

DocumentContent

|

Chunk

|

EmbeddingService

|

EmbeddingProvider

|

Vector

|

PGVector

---

# Rebuild Flow

processEmbedding(documentId)

|

delete old embeddings

|

load chunks

|

generate vectors

|

save vectors

---

# Future Retrieval

User Query

|

Query Embedding

|

Vector Search

|

Top K Chunks
