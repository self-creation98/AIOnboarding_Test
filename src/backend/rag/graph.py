import json
import logging
import time
import asyncio
from typing import TypedDict, List, Dict, Any, Literal, Optional
from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from pydantic import BaseModel, Field

from src.config import OPENAI_API_KEY, DEFAULT_MODEL

# import os
# from nemoguardrails import LLMRails, RailsConfig

logger = logging.getLogger(__name__)

# Import FAQ Cache (lazy — avoids circular imports)
_faq_cache = None

def _get_faq_cache():
    global _faq_cache
    if _faq_cache is None:
        from src.backend.rag.faq_cache import get_faq_cache
        _faq_cache = get_faq_cache()
    return _faq_cache

# Khởi tạo mô hình — ép dùng gpt-4o-mini nếu DEFAULT_MODEL là Claude
_model_name = DEFAULT_MODEL if DEFAULT_MODEL and DEFAULT_MODEL.startswith("gpt") else "gpt-4o-mini"
llm = ChatOpenAI(
    model=_model_name,
    api_key=OPENAI_API_KEY,
    temperature=0
)

# Khởi tạo NeMo Guardrails (Đã comment out để tối ưu)
# config_path = os.path.join(os.path.dirname(__file__), "guardrails_config")
# rails_config = RailsConfig.from_path(config_path)
# guardrails = LLMRails(rails_config)

# ==========================================
# Local Embedding Intent Classifier (Eager Preload)
# ==========================================
INTENT_EXAMPLES = {
    "policy": [
        "chính sách", "nghỉ phép", "thai sản", "sổ tay nhân viên",
        "quy định", "làm việc từ xa", "nghỉ mát", "bảo hiểm", "thời gian làm việc", "lương"
    ],
    "hr_update": [
        "cập nhật hồ sơ", "thông tin cá nhân", "tiến độ hồ sơ",
        "tài khoản ngân hàng", "đổi địa chỉ", "số điện thoại", "người phụ thuộc"
    ],
    "it_ticket": [
        "cấp laptop", "hỏng máy tính", "lỗi mạng", "vpn",
        "reset password", "quên mật khẩu", "cấp quyền truy cập",
        "cài phần mềm", "chuột", "bàn phím"
    ],
    "off_topic": [
        "thời tiết", "chào bạn", "ăn sáng chưa", "kể chuyện",
        "tổng thống", "bóng đá", "thơ", "hát", "chuyện cười", "tình yêu"
    ]
}

# Eager load: model được load 1 lần duy nhất khi module được import
_embedder = None
_intent_embeddings = {}
_cos_sim_fn = None

try:
    from sentence_transformers import util as st_util
    from src.backend.rag.embeddings import get_local_embeddings
    
    logger.info("Loading local embeddings for intent classification...")
    _embedder = get_local_embeddings()
    
    for _intent, _examples in INTENT_EXAMPLES.items():
        _intent_embeddings[_intent] = _embedder.embed_documents(_examples)
    _cos_sim_fn = st_util.cos_sim
    logger.info("✅ Local embedder for intent preloaded successfully.")
except ImportError:
    logger.error("sentence_transformers not found. Local intent classification will fallback to 'policy'.")
except Exception as e:
    logger.error(f"Failed to preload local embedder: {e}")

# ==========================================
# 1. Định nghĩa State của Graph
# ==========================================
class AgentState(TypedDict):
    employee_id: str
    original_message: str
    normalized_message: str
    employee_context: Dict[str, Any]

    # FAQ Cache
    faq_cache_hit: bool          # True nếu câu trả lời đến từ cache

    intent: str  # "policy", "hr_update", "it_ticket", "off_topic"

    search_query: str
    documents: List[Dict[str, Any]]
    relevant_documents: List[Dict[str, Any]]

    hr_data: Dict[str, Any]
    ticket_data: Dict[str, Any]

    final_answer: str
    sources: List[str]
    actions_taken: List[str]
    rewrite_count: int
    
    # Waterfall / Timings
    timings: Dict[str, Dict[str, float]]  # {node_name: {start: float, end: float, duration: float}}

# ==========================================
# Cấu trúc cho Typed Outputs
# ==========================================
class IntentClassification(BaseModel):
    intent: Literal["policy", "hr_update", "it_ticket"] = Field(
        description=(
            "Phân loại yêu cầu của người dùng. "
            "'policy' nếu hỏi về chính sách/sổ tay, "
            "'hr_update' nếu tra cứu/cập nhật thông tin nhân sự, "
            "'it_ticket' nếu yêu cầu thiết bị/phần mềm/VPN."
        )
    )

class DocumentRelevance(BaseModel):
    is_relevant: bool = Field(
        description="Đánh giá xem tài liệu này có trả lời được câu hỏi không. True nếu có, False nếu không."
    )

# ==========================================
# Timing Helper
# ==========================================
def record_timing(state: AgentState, node_name: str, start_time: float):
    """Lưu thông tin timing vào state."""
    if "timings" not in state or state["timings"] is None:
        state["timings"] = {}
    
    end_time = time.time()
    state["timings"][node_name] = {
        "start": start_time,
        "end": end_time,
        "duration": round(end_time - start_time, 4)
    }

# ==========================================
# 2. Định nghĩa các Node Functions (tất cả async)
# ==========================================

async def normalize_input(state: AgentState) -> Dict[str, Any]:
    """1. XỬ LÝ ĐẦU VÀO: Normalize text."""
    start = time.time()
    logger.info("---NODE: NORMALIZE INPUT---")
    original = state.get("original_message", "")
    normalized = original.strip().lower()
    
    # Initialize timings if not exists
    timings = state.get("timings") or {}
    end = time.time()
    timings["normalize_input"] = {"start": start, "end": end, "duration": round(end - start, 4)}
    
    logger.info(f" > Normalize took {end - start:.4f}s")
    return {"normalized_message": normalized, "faq_cache_hit": False, "timings": timings}


async def faq_cache_check(state: AgentState) -> Dict[str, Any]:
    """1b. FAQ CACHE CHECK: Trả lời ngay nếu câu hỏi đã có trong cache."""
    start = time.time()
    logger.info("---NODE: FAQ CACHE CHECK---")
    question = state.get("normalized_message", "")
    timings = state.get("timings") or {}

    try:
        cache = _get_faq_cache()
        hit, result = await cache.lookup(question)
        if hit and result:
            end = time.time()
            timings["faq_cache_check"] = {"start": start, "end": end, "duration": round(end - start, 4)}
            logger.info(f" > Cache HIT — skipping full pipeline (took {end - start:.4f}s).")
            return {
                "faq_cache_hit": True,
                "final_answer": result["final_answer"],
                "sources": result["sources"],
                "actions_taken": result["actions_taken"],
                "relevant_documents": [],
                "timings": timings
            }
    except Exception as e:
        logger.warning(f" > FAQ cache check failed (skipping): {e}")

    end = time.time()
    timings["faq_cache_check"] = {"start": start, "end": end, "duration": round(end - start, 4)}
    logger.info(f" > FAQ cache check took {end - start:.4f}s")
    return {"faq_cache_hit": False, "timings": timings}


async def llm_router(state: AgentState) -> Dict[str, Any]:
    """2. LLM ROUTER: Phân loại ý định sử dụng Local Embedding (nhanh & rẻ)."""
    start = time.time()
    logger.info("---NODE: LLM ROUTER---")
    question = state["normalized_message"]
    timings = state.get("timings") or {}

    intent = "policy"  # Default
    
    if _embedder and _cos_sim_fn:
        try:
            # Encode câu hỏi — CPU-bound nên chạy trong thread pool
            q_emb = await asyncio.to_thread(_embedder.embed_query, question)
            
            best_intent = "policy"
            best_score = -1.0
            
            for cat, emb_tensors in _intent_embeddings.items():
                cos_scores = _cos_sim_fn(q_emb, emb_tensors)[0]
                max_score = float(cos_scores.max())
                if max_score > best_score:
                    best_score = max_score
                    best_intent = cat
                    
            if best_score < 0.25:
                intent = "off_topic"
                logger.info(f" > Low similarity ({best_score:.4f}), defaulting to off_topic")
            else:
                intent = best_intent
                logger.info(f" > Local Intent: {intent} (score: {best_score:.4f})")
                
        except Exception as e:
            logger.warning(f" > Local intent classification failed, defaulting to 'policy': {e}")
    else:
        logger.warning(" > Local embedding not available, defaulting to 'policy'")

    result = {"intent": intent}
    
    if intent == "off_topic":
        result["final_answer"] = "Xin lỗi, tôi là trợ lý ảo hỗ trợ công việc nội bộ (Nhân sự, IT). Tôi không thể trả lời câu hỏi ngoài phạm vi này."
        result["actions_taken"] = state.get("actions_taken", []) + ["Blocked off-topic question"]

    end = time.time()
    timings["llm_router"] = {"start": start, "end": end, "duration": round(end - start, 4)}
    result["timings"] = timings
    return result


async def rewrite_query(state: AgentState) -> Dict[str, Any]:
    """3. REWRITE QUERY: Tối ưu câu hỏi RAG."""
    start = time.time()
    logger.info("---NODE: REWRITE QUERY---")
    current_query = state.get("search_query") or state.get("normalized_message", "")
    count = state.get("rewrite_count", 0) + 1
    timings = state.get("timings") or {}

    try:
        prompt = ChatPromptTemplate.from_messages([
            ("system",
             "Bạn là chuyên gia tìm kiếm. Viết lại câu hỏi để tối ưu Vector DB search.\n"
             "Chỉ trả về câu hỏi đã format, không giải thích."),
            ("user", "Câu hỏi gốc: {question}")
        ])
        chain = prompt | llm | StrOutputParser()
        new_query = await chain.ainvoke({"question": current_query})
        new_query = new_query.strip() or current_query
    except Exception as e:
        logger.warning(f" > Rewrite failed, using original query: {e}")
        new_query = current_query

    logger.info(f" > Rewritten query ({count}): {new_query}")
    
    end = time.time()
    node_key = f"rewrite_query_{count}" if count > 1 else "rewrite_query"
    timings[node_key] = {"start": start, "end": end, "duration": round(end - start, 4)}
    
    return {"search_query": new_query, "rewrite_count": count, "timings": timings}


async def retriever(state: AgentState) -> Dict[str, Any]:
    """4. RETRIEVER: Keyword search trên documents."""
    start = time.time()
    logger.info("---NODE: RETRIEVER---")
    from src.backend.rag.documents import search_documents

    query = state.get("search_query", "")
    timings = state.get("timings") or {}
    
    try:
        docs = await search_documents(query, top_k=3)
    except Exception as e:
        logger.warning(f" > Retriever error: {e}")
        docs = []

    logger.info(f" > Found {len(docs)} documents for: {query[:60]}")
    
    end = time.time()
    timings["retriever"] = {"start": start, "end": end, "duration": round(end - start, 4)}
    return {"documents": docs, "timings": timings}


async def doc_grader(state: AgentState) -> Dict[str, Any]:
    """5. DOC GRADER: Đánh giá độ liên quan của tài liệu."""
    start = time.time()
    logger.info("---NODE: DOC GRADER---")
    query = state.get("search_query", "")
    docs = state.get("documents", [])
    timings = state.get("timings") or {}

    # Nếu không có docs, trả về rỗng ngay
    if not docs:
        logger.info(" > No documents to grade.")
        end = time.time()
        timings["doc_grader"] = {"start": start, "end": end, "duration": round(end - start, 4)}
        return {"relevant_documents": [], "timings": timings}

    prompt = ChatPromptTemplate.from_messages([
        ("system",
         "Bạn là người chấm điểm tài liệu. Đánh giá xem đoạn tài liệu có trả lời được câu hỏi không. "
         "Trả về True nếu liên quan, False nếu không."),
        ("user", "Câu hỏi: {question}\nTài liệu: {document}")
    ])
    grader_llm = llm.with_structured_output(DocumentRelevance)
    chain = prompt | grader_llm
    
    sem = asyncio.Semaphore(3)

    async def grade_one_doc(doc):
        async with sem:
            try:
                res = await chain.ainvoke({"question": query, "document": doc["content"]})
                return doc if res.is_relevant else None
            except Exception as e:
                logger.warning(f" > Doc grading failed for doc '{doc.get('id')}', assuming relevant: {e}")
                return doc

    # Run grading in parallel
    results = await asyncio.gather(*[grade_one_doc(doc) for doc in docs])
    relevant_docs = [r for r in results if r is not None]

    logger.info(f" > {len(relevant_docs)} relevant documents.")
    
    end = time.time()
    timings["doc_grader"] = {"start": start, "end": end, "duration": round(end - start, 4)}
    return {"relevant_documents": relevant_docs, "timings": timings}


async def hr_api_tool(state: AgentState) -> Dict[str, Any]:
    """6. HR API TOOL: Tra cứu Dashboard HR."""
    start = time.time()
    logger.info("---NODE: HR API TOOL---")
    timings = state.get("timings") or {}
    
    end = time.time()
    timings["hr_api_tool"] = {"start": start, "end": end, "duration": round(end - start, 4)}
    
    return {
        "hr_data": {"status": "success", "info": "Đã kiểm tra hệ thống HR."},
        "actions_taken": state.get("actions_taken", []) + ["Truy vấn API nhân sự"],
        "timings": timings
    }


async def ticket_api_tool(state: AgentState) -> Dict[str, Any]:
    """7. TICKET API TOOL: Tạo yêu cầu IT."""
    start = time.time()
    logger.info("---NODE: TICKET API TOOL---")
    timings = state.get("timings") or {}
    
    end = time.time()
    timings["ticket_api_tool"] = {"start": start, "end": end, "duration": round(end - start, 4)}
    
    return {
        "ticket_data": {"ticket_id": "IT-9999", "status": "created"},
        "actions_taken": state.get("actions_taken", []) + ["Tạo vé IT Support IT-9999"],
        "timings": timings
    }


async def generator(state: AgentState) -> Dict[str, Any]:
    """8. GENERATOR: Tổng hợp câu trả lời cuối cùng."""
    start = time.time()
    logger.info("---NODE: GENERATOR---")
    intent = state.get("intent", "policy")
    timings = state.get("timings") or {}

    # Chuẩn bị Context
    context_str = ""
    if intent == "policy":
        for doc in state.get("relevant_documents", []):
            context_str += doc["content"] + "\n"
        if not context_str:
            context_str = "Không tìm thấy tài liệu liên quan."
    elif intent == "hr_update":
        context_str = json.dumps(state.get("hr_data", {}), ensure_ascii=False)
    elif intent == "it_ticket":
        context_str = json.dumps(state.get("ticket_data", {}), ensure_ascii=False)

    prompt = ChatPromptTemplate.from_messages([
        ("system",
         "Bạn là trợ lý ảo Onboarding của công ty. Hãy trả lời thân thiện dựa vào Context bên dưới.\n"
         "Nếu Context không đủ thông tin, hãy trả lời theo hiểu biết chung và đề nghị liên hệ HR.\n\n"
         "Context:\n{context}"),
        ("user", "Yêu cầu: {question}")
    ])
    chain = prompt | llm | StrOutputParser()

    try:
        answer = await chain.ainvoke({
            "question": state.get("original_message", ""),
            "context": context_str,
        })
        answer = answer.strip() or "Xin lỗi, tôi không thể tạo câu trả lời lúc này."
    except Exception as e:
        logger.error(f" > Generator LLM failed: {e}")
        answer = "Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau."

    sources = (
        [doc["id"] for doc in state.get("relevant_documents", [])]
        if intent == "policy" else []
    )

    # Lưu kết quả mới vào FAQ cache để lần sau trả lời nhanh hơn
    try:
        original_question = state.get("original_message", "")
        if original_question and answer and "không thể" not in answer.lower()[:50]:
            cache = _get_faq_cache()
            await cache.store(
                question=original_question,
                answer=answer,
                sources=sources,
                actions_taken=state.get("actions_taken", []),
            )
    except Exception as e:
        logger.warning(f" > FAQ cache store failed: {e}")

    end = time.time()
    timings["generator"] = {"start": start, "end": end, "duration": round(end - start, 4)}
    
    return {"final_answer": answer, "sources": sources, "timings": timings}


# ==========================================
# 3. Conditional Edges
# ==========================================

def route_intent(state: AgentState) -> Literal["policy", "hr_update", "it_ticket", "off_topic"]:
    """Điều hướng dựa trên intent."""
    intent = state.get("intent", "policy")
    # Đảm bảo luôn trả về giá trị hợp lệ
    return intent if intent in ("policy", "hr_update", "it_ticket", "off_topic") else "policy"


def check_doc_relevance(state: AgentState) -> Literal["valid", "invalid"]:
    """Kiểm tra tài liệu có liên quan không. Nếu không → rewrite (tối đa 2 lần)."""
    relevant_docs = state.get("relevant_documents", [])
    rewrite_count = state.get("rewrite_count", 0)

    if len(relevant_docs) == 0 and rewrite_count < 2:
        logger.info(" -> No relevant docs, retrying rewrite...")
        return "invalid"
    return "valid"


# ==========================================
# 4. Conditional Edge — FAQ Cache Router
# ==========================================

def route_faq_cache(state: AgentState) -> Literal["cache_hit", "cache_miss"]:
    """Sau khi check cache: nếu hit → kết thúc ngay, nếu miss → chạy full pipeline."""
    return "cache_hit" if state.get("faq_cache_hit") else "cache_miss"


# ==========================================
# 5. Build Graph
# ==========================================

def build_graph():
    workflow = StateGraph(AgentState)

    workflow.add_node("normalize_input", normalize_input)
    workflow.add_node("faq_cache_check", faq_cache_check)   # NEW
    workflow.add_node("llm_router", llm_router)
    workflow.add_node("rewrite_query", rewrite_query)
    workflow.add_node("retriever", retriever)
    workflow.add_node("doc_grader", doc_grader)
    workflow.add_node("hr_api_tool", hr_api_tool)
    workflow.add_node("ticket_api_tool", ticket_api_tool)
    workflow.add_node("generator", generator)

    # normalize → cache check
    workflow.add_edge(START, "normalize_input")
    workflow.add_edge("normalize_input", "faq_cache_check")

    # cache check → hit: END, miss: full pipeline
    workflow.add_conditional_edges(
        "faq_cache_check",
        route_faq_cache,
        {
            "cache_hit": END,           # Trả lời ngay, không gọi LLM nào
            "cache_miss": "llm_router", # Chạy full pipeline
        },
    )

    workflow.add_conditional_edges(
        "llm_router",
        route_intent,
        {
            "policy": "rewrite_query",
            "hr_update": "hr_api_tool",
            "it_ticket": "ticket_api_tool",
            "off_topic": END,
        },
    )

    workflow.add_edge("rewrite_query", "retriever")
    workflow.add_edge("retriever", "doc_grader")

    workflow.add_conditional_edges(
        "doc_grader",
        check_doc_relevance,
        {
            "invalid": "rewrite_query",
            "valid": "generator",
        },
    )

    workflow.add_edge("hr_api_tool", "generator")
    workflow.add_edge("ticket_api_tool", "generator")
    workflow.add_edge("generator", END)

    return workflow.compile()


# Initialize the graph (module-level singleton)
chatbot_graph = build_graph()
