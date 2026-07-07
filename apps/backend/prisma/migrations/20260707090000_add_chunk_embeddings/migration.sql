CREATE TABLE "chunk_embeddings" (
    "id" TEXT NOT NULL,
    "chunk_id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "dimension" INTEGER NOT NULL,
    "vector" DOUBLE PRECISION[] NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chunk_embeddings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "chunk_embeddings_chunk_id_key" ON "chunk_embeddings"("chunk_id");

CREATE INDEX "chunk_embeddings_model_idx" ON "chunk_embeddings"("model");

ALTER TABLE "chunk_embeddings" ADD CONSTRAINT "chunk_embeddings_chunk_id_fkey" FOREIGN KEY ("chunk_id") REFERENCES "chunks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
