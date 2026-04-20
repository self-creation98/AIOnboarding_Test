"""
Agent state definition for the LangGraph workflow.
"""

from typing import TypedDict


class AgentState(TypedDict, total=False):
    """State flowing through the agent graph."""
    # Input
    message: str
    employee_id: str
    conversation_id: str

    # Loaded context
    employee_context: dict       # {full_name, role, department, checklist_summary}

    # Intent classification
    intent: str                  # policy_question | checklist_help | action_request | greeting | escalation

    # RAG results
    retrieved_chunks: list       # [{content, source_title, similarity, ...}]

    # Generated output
    response: str
    sources: list                # [{title, chunk_id}]
    confidence: float            # 0.0 - 1.0
    actions_taken: list          # ["created_it_task", ...]

    # Sentiment
    sentiment: str               # positive | neutral | confused | frustrated | negative
    sentiment_confidence: float
    sentiment_topics: list
