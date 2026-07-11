ALTER TYPE "PipelineJobStatus" ADD VALUE IF NOT EXISTS 'QUEUED';

CREATE INDEX IF NOT EXISTS "chunk_embeddings_vector_cosine_idx"
ON "chunk_embeddings"
USING ivfflat ("vector" vector_cosine_ops)
WITH (lists = 100);
