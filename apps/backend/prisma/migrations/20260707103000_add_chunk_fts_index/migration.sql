CREATE INDEX "chunks_content_fts_idx" ON "chunks" USING GIN (to_tsvector('simple', "content"));
