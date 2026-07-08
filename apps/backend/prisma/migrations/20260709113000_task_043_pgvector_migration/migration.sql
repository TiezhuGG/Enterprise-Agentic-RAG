CREATE EXTENSION IF NOT EXISTS vector;

DROP INDEX IF EXISTS "chunk_embeddings_vector_cosine_idx";

ALTER TABLE "chunk_embeddings"
ALTER COLUMN "vector" TYPE vector(768)
USING ('[' || array_to_string("vector", ',') || ']')::vector;

CREATE INDEX IF NOT EXISTS "chunk_embeddings_vector_cosine_idx"
ON "chunk_embeddings"
USING ivfflat ("vector" vector_cosine_ops)
WITH (lists = 100);
