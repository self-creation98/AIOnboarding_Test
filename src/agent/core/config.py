"""
Agent configuration — OpenAI models + RAG parameters.
"""

import os
from src.config import OPENAI_API_KEY

# ─── LLM ───
LLM_MODEL = os.getenv("AGENT_LLM_MODEL", "gpt-4o-mini")
LLM_TEMPERATURE = float(os.getenv("AGENT_LLM_TEMPERATURE", "0.3"))
LLM_MAX_TOKENS = int(os.getenv("AGENT_LLM_MAX_TOKENS", "2048"))

# ─── Embedding ───
EMBEDDING_MODEL = os.getenv("AGENT_EMBEDDING_MODEL", "text-embedding-3-small")
EMBEDDING_DIMENSIONS = int(os.getenv("AGENT_EMBEDDING_DIMENSIONS", "768"))

# ─── RAG ───
CHUNK_SIZE = int(os.getenv("AGENT_CHUNK_SIZE", "400"))
CHUNK_OVERLAP = int(os.getenv("AGENT_CHUNK_OVERLAP", "80"))
TOP_K_RETRIEVAL = int(os.getenv("AGENT_TOP_K", "5"))
RRF_K = 60  # Reciprocal Rank Fusion constant

# ─── Thresholds ───
CONFIDENCE_THRESHOLD = float(os.getenv("AGENT_CONFIDENCE_THRESHOLD", "0.5"))
SENTIMENT_LABELS = ["positive", "neutral", "confused", "frustrated", "negative"]
