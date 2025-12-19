import os
from typing import Dict, Any, List, Optional

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

# Default Gemini model – you said this works on free tier
DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash")


def get_gemini_llm(api_key: str, temperature: float = 0.4):
    """
    Single helper to create a Gemini chat LLM.
    """
    if not api_key:
        raise ValueError("Gemini API key is required for LLM calls.")

    return ChatGoogleGenerativeAI(
        model=DEFAULT_GEMINI_MODEL,
        google_api_key=api_key,
        temperature=temperature,
    )


def build_results_context(last_results: Dict[str, Any], max_posts: int = 30) -> str:
    """
    Convert stored analysis results into a compact text context
    for the LLM.
    """
    if not last_results:
        return ""

    query = last_results.get("query", "(unknown topic)")
    counts = last_results.get("counts", {}) or {}
    posts: List[Dict[str, Any]] = last_results.get("posts", []) or []

    pos = counts.get("positive", 0)
    neg = counts.get("negative", 0)
    neu = counts.get("neutral", 0)
    total = len(posts)

    header = (
        f"Most recent analysis topic: {query}\n"
        f"Total posts analyzed: {total}\n"
        f"Positive: {pos}, Negative: {neg}, Neutral: {neu}\n"
    )

    lines = [header, "\nSample of analyzed posts:\n"]

    for i, p in enumerate(posts[:max_posts]):
        sentiment = p.get("sentiment", "unknown")
        subreddit = p.get("subreddit", "unknown")
        title = p.get("title") or "(no title)"
        text = (p.get("selftext") or "").replace("\n", " ")
        snippet = text[:220] + ("..." if len(text) > 220 else "")
        lines.append(
            f"- [{sentiment}] r/{subreddit} | {title} | {snippet}"
        )

    return "\n".join(lines)


def route_or_answer(
    api_key: str,
    user_message: str,
    last_results: Optional[Dict[str, Any]] = None,
    qna_history: Optional[list] = None,
) -> Dict[str, Any]:
    """
    Single LLM that BOTH:
      - decides whether to fetch new posts or answer from existing context
      - and returns either:
          fetch:"search query for reddit"
        or
          answer:"natural language answer"

    Returns a dict:
      - if fetch:  {"mode": "fetch", "fetch_query": "..."}
      - if answer: {"mode": "answer", "answer": "..."}
    """

    llm = get_gemini_llm(api_key, temperature=0.4)

    analysis_available = bool(last_results)
    last_topic = last_results.get("query", "") if last_results else ""
    analysis_context = build_results_context(last_results) if last_results else ""

    # Build a compact Q&A context from previous turns
    qna_context = ""
    if qna_history:
        lines = ["Recent Q&A between user and assistant:"]
        # only last few turns for brevity
        for pair in qna_history[-6:]:
            um = (pair.get("user") or "").replace("\n", " ")
            am = (pair.get("ai") or "").replace("\n", " ")
            lines.append(f"User: {um}")
            lines.append(f"Assistant: {am}")
        qna_context = "\n".join(lines)


    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                (
                    "You are the reasoning engine behind a Reddit sentiment analysis dashboard.\n"
                    "You see:\n"
                    "- A topic that Reddit posts were collected about.\n"
                    "- Sentiment counts (positive, negative, neutral).\n"
                    "- A sample of labeled posts (with their sentiments).\n\n"
                    "You MUST respond in one of TWO formats ONLY:\n\n"
                    "1) To FETCH & ANALYZE NEW REDDIT POSTS for a topic, respond exactly as:\n"
                    '   fetch:\"<short reddit search query>\"\n'
                    "   - The search query should be concise, keyword-style, and good for Reddit search.\n"
                    "   - Remove filler words; keep only the core entities/topics.\n\n"
                    "2) To ANSWER a QUESTION based on the EXISTING ANALYSIS CONTEXT, respond exactly as:\n"
                    '   answer:\"<detailed natural language answer to the user>\"\n'
                    "   - You can interpret the user’s intent freely — they may ask for insights, opinions,\n"
                    "     strategies, predictions, comparisons, or creative interpretations.\n"
                    "   - Your response should be descriptive and well-structured: ideally several paragraphs\n"
                    "     or organized points (e.g., Overall sentiment, Key observations, Possible actions,\n"
                    "     and Notable patterns or implications).\n"
                    "   - Keep everything grounded in the analysis_context; if you infer or speculate,\n"
                    "     make it clear you are doing so based on patterns in the posts.\n\n"
                    "   - “If the provided analysis_context does not contain enough information to confidently answer the user’s question, conclude your response with a polite follow-up inviting the user to fetch additional posts related to the most relevant keywords you identified. \n"
                    "Rules:\n"
                    "- Do NOT include backticks, markdown code fences, or any extra wrapper text.\n"
                    "- The first word must be either fetch: or answer:.\n"
                    "- If no previous analysis is available, you MUST choose fetch:.\n"
                    "- When you choose fetch:, your job is ONLY to generate a good Reddit search query.\n"
                    "- When you choose answer:, you MUST answer ONLY based on the provided analysis_context\n"
                    "  and the user_message, and you must not invent facts that contradict the data.\n"
                ),
            ),
            (
                "human",
                (
                    "analysis_available: {analysis_available}\n"
                    "last_topic: {last_topic}\n"
                    "analysis_context:\n"
                    "------------------\n"
                    "{analysis_context}\n"
                    "------------------\n\n"
                    "recent_qna_history:\n"
                    "------------------\n"
                    "{qna_context}\n"
                    "------------------\n\n"
                    "user_message: {user_message}\n\n"
                    "Remember: respond with either fetch:\"...\" or answer:\"...\" and nothing else."
                ),
            ),
        ]
    )

    chain = prompt | llm
    result = chain.invoke(
        {
            "analysis_available": str(analysis_available),
            "last_topic": last_topic,
            "analysis_context": analysis_context,
            "qna_context": qna_context,
            "user_message": user_message,
        }
    )

    content = (result.content or "").strip()

    # Basic parsing: look for prefix fetch: or answer:
    lower = content.lower()
    if lower.startswith("fetch:"):
        # Remove prefix fetch: and surrounding quotes if present
        payload = content[len("fetch:") :].strip().strip()
        if payload.startswith('"') and payload.endswith('"'):
            payload = payload[1:-1]
        return {
            "mode": "fetch",
            "fetch_query": payload.strip(),
        }

    if lower.startswith("answer:"):
        payload = content[len("answer:") :].strip()

        # Preserve original line breaks from the model output
        payload = payload.replace("\\n", "\n").replace("\\t", "\t")
        
        if payload.startswith('"') and payload.endswith('"'):
            payload = payload[1:-1]
        return {
            "mode": "answer",
            "answer": payload.strip(),
        }

    # Fallback: if the format is weird, default to fetch using the raw user message
    return {
        "mode": "fetch",
        "fetch_query": user_message,
    }
