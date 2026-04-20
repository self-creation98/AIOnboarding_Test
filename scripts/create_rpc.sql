-- Supabase SQL: Create vector search RPC function
-- Run this in Supabase Dashboard → SQL Editor

-- Ensure pgvector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- RPC function for cosine similarity search on knowledge_chunks
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(768),
  match_count int DEFAULT 10,
  filter_department text DEFAULT NULL,
  filter_role text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  chunk_index int,
  document_id uuid,
  source_title text,
  similarity float
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.content,
    kc.chunk_index,
    kc.document_id,
    kd.title AS source_title,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  JOIN knowledge_documents kd ON kd.id = kc.document_id
  WHERE
    kc.embedding IS NOT NULL
    AND (filter_department IS NULL OR filter_department = ANY(kc.department_tags))
    AND (filter_role IS NULL OR filter_role = ANY(kc.role_tags))
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
