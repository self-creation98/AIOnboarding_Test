"""
LangGraph workflow builder — compiles the agent graph.

Flow:
  load_context → classify_intent → [routing]
    ├─ greeting/escalation → handle_simple → analyze_sentiment → END
    └─ policy/checklist/action → retrieve_and_generate → analyze_sentiment → END
"""

import logging
from langgraph.graph import StateGraph, END
from .state import AgentState
from .nodes import (
    load_context,
    classify_intent,
    retrieve_and_generate,
    analyze_sentiment,
    handle_simple,
)

logger = logging.getLogger(__name__)


def _route_by_intent(state: dict) -> str:
    """Route to different nodes based on classified intent."""
    intent = state.get("intent", "policy_question")
    if intent in ("greeting", "escalation"):
        return "handle_simple"
    return "retrieve_and_generate"


def build_agent_graph():
    """Build and compile the LangGraph agent."""
    graph = StateGraph(AgentState)

    # Add nodes
    graph.add_node("load_context", load_context)
    graph.add_node("classify_intent", classify_intent)
    graph.add_node("retrieve_and_generate", retrieve_and_generate)
    graph.add_node("handle_simple", handle_simple)
    graph.add_node("analyze_sentiment", analyze_sentiment)

    # Set entry point
    graph.set_entry_point("load_context")

    # Edges
    graph.add_edge("load_context", "classify_intent")

    # Conditional routing after intent classification
    graph.add_conditional_edges(
        "classify_intent",
        _route_by_intent,
        {
            "handle_simple": "handle_simple",
            "retrieve_and_generate": "retrieve_and_generate",
        },
    )

    # Both paths converge to sentiment analysis
    graph.add_edge("retrieve_and_generate", "analyze_sentiment")
    graph.add_edge("handle_simple", "analyze_sentiment")

    # Sentiment analysis → END
    graph.add_edge("analyze_sentiment", END)

    return graph.compile()


# Singleton compiled agent
_compiled_agent = None


def get_agent():
    """Get or create the compiled agent (singleton)."""
    global _compiled_agent
    if _compiled_agent is None:
        _compiled_agent = build_agent_graph()
    return _compiled_agent
