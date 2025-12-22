"""
Advanced, optional NLP features. All functions are designed to:
- Lazy load models (only when first used)
- Fail gracefully and return structured errors without breaking the main app
- Use only free, open-source models/APIs
"""

from functools import lru_cache
from typing import Any, Dict, List, Optional
import asyncio
import os
import re
import json
import requests
# torch and transformers imported lazily in _safe_pipeline to avoid DLL loading errors
from feature_config import get_config


# --------- Utilities ---------

def _clean_text(text: str, limit: int = 12000) -> str:
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:limit]

def _truncate_for_model(text: str, max_tokens: int = 512) -> str:
    """Truncate text to fit within token limit (rough estimate: 1 token ≈ 4 chars)"""
    # Rough estimate: truncate to ~4x max_tokens characters to be safe
    char_limit = max_tokens * 3  # Conservative estimate
    if len(text) <= char_limit:
        return text
    # Truncate at word boundary
    truncated = text[:char_limit]
    last_space = truncated.rfind(' ')
    if last_space > char_limit * 0.8:  # If we can find a good break point
        return truncated[:last_space] + '...'
    return truncated + '...'


def _safe_pipeline(task: str, model: str, device: str = "cpu"):
    try:
        import torch
        from transformers import pipeline, AutoTokenizer, AutoModelForTokenClassification, AutoModelForSequenceClassification
        
        # Force CPU and avoid meta tensor issues completely
        # Strategy: Load model explicitly without device_map, then create pipeline
        try:
            # For NER tasks - Enable aggregation_strategy="simple" to auto-merge tokens
            if task == "ner":
                tokenizer = AutoTokenizer.from_pretrained(model)
                model_obj = AutoModelForTokenClassification.from_pretrained(
                    model,
                    torch_dtype=torch.float32,
                    low_cpu_mem_usage=False
                )
                model_obj = model_obj.to('cpu')
                return pipeline(task, model=model_obj, tokenizer=tokenizer, device=-1, aggregation_strategy="simple")
            
            # For text classification tasks (sentiment, emotion, bias)
            elif task == "text-classification":
                tokenizer = AutoTokenizer.from_pretrained(model)
                model_obj = AutoModelForSequenceClassification.from_pretrained(
                    model,
                    torch_dtype=torch.float32,
                    low_cpu_mem_usage=False
                )
                model_obj = model_obj.to('cpu')
                return pipeline(task, model=model_obj, tokenizer=tokenizer, device=-1)
            
            # For other tasks, use standard approach
            else:
                return pipeline(
                    task,
                    model=model,
                    device=-1,
                    torch_dtype=torch.float32,
                    model_kwargs={"low_cpu_mem_usage": False}
                )
        except Exception as inner_e:
            # Fallback to simple pipeline creation
            return pipeline(task, model=model, device=-1)
            
    except Exception as e:
        error_msg = str(e)
        return f"pipeline_error:{error_msg}"


def _pipeline_failed(obj: Any) -> bool:
    return isinstance(obj, str) and obj.startswith("pipeline_error:")


# --------- TTS (Google Text-to-Speech - works on macOS!) ---------

def _clean_text_for_tts(text: str) -> str:
    """
    Balanced cleaning - removes navigation/ads while keeping article content.
    """
    import re
    
    # Remove URLs and emails
    text = re.sub(r'http[s]?://\S+', '', text)
    text = re.sub(r'\S+@\S+', '', text)
    
    # Remove obvious noise (but not too aggressive)
    noise_patterns = [
        r'click\s+here',
        r'subscribe\s+now',
        r'sign\s+up',
        r'log\s*in',
        r'(share|follow)\s+(this|us)',
        r'facebook|twitter|instagram',
        r'copyright\s+©?\s*\d{4}',
        r'all\s+rights\s+reserved',
    ]
    
    for pattern in noise_patterns:
        text = re.sub(pattern, ' ', text, flags=re.IGNORECASE)
    
    # Process lines - keep substantial content
    lines = text.split('\n')
    content_lines = []
    
    for line in lines:
        line = line.strip()
        
        # Skip very short lines
        if len(line) < 15:
            continue
        
        # Skip pure dates/numbers
        if re.match(r'^[\d\s\-/:,°]+$', line):
            continue
        
        # Skip navigation keywords
        if line.lower().startswith(('menu', 'search', 'login', 'home')):
            continue
        
        # Skip if mostly non-letters
        alpha_count = sum(c.isalpha() for c in line)
        if alpha_count < len(line) * 0.4:  # Less than 40% letters
            continue
        
        content_lines.append(line)
    
    text = ' '.join(content_lines)
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Extract sentences
    sentences = re.split(r'[.!?]+\s+', text)
    good_sentences = []
    
    for sentence in sentences:
        sentence = sentence.strip()
        
        # Keep sentences with reasonable length
        if len(sentence) < 15:  # Lowered threshold
            continue
        
        words = sentence.split()
        if len(words) < 3:  # Lowered threshold
            continue
        
        # Skip obvious navigation
        skip_phrases = ['what\'s news', 'most read', 'related news', 'e-paper']
        if any(phrase in sentence.lower() for phrase in skip_phrases):
            continue
        
        good_sentences.append(sentence)
    
    # Take first 30 sentences
    clean_text = '. '.join(good_sentences[:30])
    
    if clean_text and not clean_text.endswith(('.', '!', '?')):
        clean_text += '.'
    
    return clean_text


def tts_generate(text: str, speed: float = 1.0, filename: str = "news_audio.mp3") -> Dict[str, Any]:
    """Generate audio using Google Text-to-Speech (gTTS) - works reliably on all platforms"""
    try:
        import os
        from gtts import gTTS
        
        # Save to audio_files directory
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        audio_dir = os.path.join(backend_dir, "audio_files")
        os.makedirs(audio_dir, exist_ok=True)
        filepath = os.path.join(audio_dir, filename)
        
        # Clean the text
        print(f"📝 Original: {len(text)} chars")
        text = _clean_text_for_tts(text)
        print(f"✂️ Cleaned: {len(text)} chars")
        
        if text and len(text) > 50:
            print(f"📄 Preview: {text[:150]}...")
        
        # Limit length
        words = text.split()
        if len(words) > 500:
            text = ' '.join(words[:500]) + "."
            print(f"⏱️ Truncated to 500 words")
        
        # Validate
        if not text or len(text.strip()) < 30:
            return {
                "ok": False, 
                "error": "Could not extract article content. Try pasting the article text directly."
            }
        
        # Generate
        print(f"🎤 Generating audio ({len(words)} words)...")
        tts = gTTS(text=text, lang='en', slow=False)
        tts.save(filepath)
        
        # Verify
        if os.path.exists(filepath) and os.path.getsize(filepath) > 100:
            print(f"✅ Audio: {os.path.getsize(filepath)} bytes")
            return {"ok": True, "file": filename, "url": f"/audio/{filename}"}
        else:
            return {"ok": False, "error": "Audio generation failed"}
                
    except ImportError:
        return {"ok": False, "error": "gTTS not installed. Run: pip install gtts"}
    except Exception as e:
        error_msg = str(e)
        if "connection" in error_msg.lower() or "network" in error_msg.lower():
            return {"ok": False, "error": "Network error: Check your internet connection"}
        return {"ok": False, "error": f"TTS error: {error_msg}"}


# --------- NER + simple reality check via Wikipedia ---------

@lru_cache(maxsize=1)
def _get_ner():
    cfg = get_config()
    return _safe_pipeline("ner", cfg["models"]["ner"], device=cfg["performance"]["device"])


def _wiki_exists(query: str) -> bool:
    """Fallback Wikipedia verification"""
    try:
        resp = requests.get(
            "https://en.wikipedia.org/w/api.php",
            params={"action": "query", "list": "search", "srsearch": query, "format": "json"},
            timeout=5,
        )
        data = resp.json()
        return bool(data.get("query", {}).get("search"))
    except Exception:
        return False


def _verify_entity_google(query: str, entity_type: str) -> dict:
    """Verify entity using Google Custom Search API"""
    try:
        api_key = os.getenv("GOOGLE_CSE_KEY")
        cx = os.getenv("GOOGLE_CSE_ID")
        
        if not api_key or not cx:
            # Fallback to Wikipedia if no Google credentials
            return {"verified": _wiki_exists(query), "source": "wikipedia"}
        
        # Search Google for the entity
        url = "https://www.googleapis.com/customsearch/v1"
        params = {"key": api_key, "cx": cx, "q": query, "num": 3}
        
        resp = requests.get(url, params=params, timeout=5)
        if resp.status_code != 200:
            return {"verified": _wiki_exists(query), "source": "wikipedia"}
        
        data = resp.json()
        items = data.get("items", [])
        
        # If we find 2+ results, consider it verified
        if len(items) >= 2:
            # Check if results are from credible sources
            credible_count = 0
            for item in items:
                domain = item.get("displayLink", "").lower()
                if any(d in domain for d in ["wikipedia", ".gov", ".edu", "britannica", "bbc", "reuters", "nationalgeographic"]):
                    credible_count += 1
            
            # If at least 1 credible source, mark as verified
            if credible_count >= 1:
                return {"verified": True, "source": "google_search", "results": len(items)}
        
        # Fallback to Wikipedia
        return {"verified": _wiki_exists(query), "source": "wikipedia"}
    except Exception as e:
        # Fallback to Wikipedia on any error
        return {"verified": _wiki_exists(query), "source": "wikipedia"}


def ner_reality_checker(text: str) -> Dict[str, Any]:
    text = _clean_text(text)
    ner = _get_ner()
    if _pipeline_failed(ner):
        error_msg = ner.split(":", 1)[1] if ":" in ner else str(ner)
        if "meta tensor" in error_msg.lower():
            return {"ok": False, "error": "Model loading error. Please restart the server."}
        return {"ok": False, "error": error_msg}
    
    # Truncate text to fit model's token limit
    text = _truncate_for_model(text, max_tokens=512)
    
    try:
        # Since we use aggregation_strategy="simple" in _safe_pipeline, 
        # the output is already merged into entities (PER, ORG, LOC, etc.)
        entities_raw = ner(text)
    except Exception as e:
        error_msg = str(e)
        if "meta tensor" in error_msg.lower():
            return {"ok": False, "error": "Model loading error. Please restart the server."}
        return {"ok": False, "error": f"NER processing error: {error_msg}"}
    
    if not isinstance(entities_raw, list):
        return {"ok": False, "error": "NER returned unexpected format"}
    
    # Filter and process entities
    entities = []
    seen = set()
    
    for ent in entities_raw:
        # With aggregation_strategy="simple", layout is:
        # {'entity_group': 'ORG', 'score': 0.99, 'word': 'Apple Inc', 'start': 0, 'end': 9}
        label = ent.get("entity_group") or ent.get("entity", "")
        text_val = ent.get("word", "").strip()
        
        if not label or not text_val:
            continue
            
        # Only keep PER, ORG, LOC
        if label not in ["PER", "ORG", "LOC"]:
            continue
            
        # Clean up text value (sometimes contains leading/trailing punctuation)
        text_clean = text_val.strip(" .,;:!?#")
        if len(text_clean) < 3:
            continue
            
        # Check against common noise words
        exclude_words = {"times", "of", "india", "edition", "english", "business", "news", "desk", 
                        "today", "market", "stock", "netflix", "bros", "des", "unknown", "the", "and"}
        if text_clean.lower() in exclude_words:
            continue
            
        # Deduplicate
        if text_clean.lower() in seen:
            continue
        seen.add(text_clean.lower())
        
        # Verify via Google Search (with Wikipedia fallback)
        verification = _verify_entity_google(text_clean, label)
        exists = verification.get("verified", False)
        source = verification.get("source", "unknown")
        
        # Only include verified entities to keep it clean
        if exists:
            # Create user-friendly status message
            if source == "google_search":
                status_msg = "verified via Google"
            elif source == "wikipedia":
                status_msg = "verified via Wikipedia"
            else:
                status_msg = "verified"
            
            entities.append({
                "text": text_clean,
                "label": label,
                "verified": True,
                "status": status_msg,  # This is what the frontend displays
                "source": source
            })
    
    # Sort: by label, then text
    entities.sort(key=lambda x: (x["label"], x["text"]))
    
    # Limit to top 10
    entities = entities[:10]
    
    # All entities shown are verified (we filtered unverified ones)
    verified = len(entities)
    score = 100 if verified > 0 else 0
    
    return {"ok": True, "entities": entities, "credibility_score": score}








# --------- Bias & Sentiment ---------

@lru_cache(maxsize=1)
def _get_sentiment():
    cfg = get_config()
    return _safe_pipeline("sentiment-analysis", cfg["models"]["sentiment"], device=cfg["performance"]["device"])


@lru_cache(maxsize=1)
def _get_emotion():
    cfg = get_config()
    return _safe_pipeline("text-classification", cfg["models"]["emotion"], device=cfg["performance"]["device"])


@lru_cache(maxsize=1)
def _get_bias():
    cfg = get_config()
    return _safe_pipeline("text-classification", cfg["models"]["bias"], device=cfg["performance"]["device"])


def bias_sentiment_analysis(text: str) -> Dict[str, Any]:
    text = _clean_text(text)
    sentiment = _get_sentiment()
    emotion = _get_emotion()
    bias = _get_bias()

    result = {"ok": True, "errors": []}

    # Truncate text properly for each model (most models have 512 token limit)
    text_sentiment = _truncate_for_model(text, max_tokens=512)
    text_emotion = _truncate_for_model(text, max_tokens=512)
    text_bias = _truncate_for_model(text, max_tokens=512)

    if _pipeline_failed(sentiment):
        error_msg = sentiment.split(":", 1)[1] if ":" in sentiment else str(sentiment)
        result["errors"].append(f"Sentiment: {error_msg}")
        sentiment_scores = []
    else:
        try:
            sentiment_scores = sentiment(text_sentiment)
            # Ensure it's a list
            if not isinstance(sentiment_scores, list):
                sentiment_scores = [sentiment_scores] if sentiment_scores else []
        except Exception as e:
            result["errors"].append(f"Sentiment processing: {str(e)}")
            sentiment_scores = []

    if _pipeline_failed(emotion):
        error_msg = emotion.split(":", 1)[1] if ":" in emotion else str(emotion)
        result["errors"].append(f"Emotion: {error_msg}")
        emotion_scores = []
    else:
        try:
            emotion_scores = emotion(text_emotion, top_k=3)
            if not isinstance(emotion_scores, list):
                emotion_scores = [emotion_scores] if emotion_scores else []
        except Exception as e:
            result["errors"].append(f"Emotion processing: {str(e)}")
            emotion_scores = []

    if _pipeline_failed(bias):
        error_msg = bias.split(":", 1)[1] if ":" in bias else str(bias)
        result["errors"].append(f"Bias: {error_msg}")
        bias_scores = []
    else:
        try:
            bias_scores = bias(text_bias, top_k=3)
            if not isinstance(bias_scores, list):
                bias_scores = [bias_scores] if bias_scores else []
        except Exception as e:
            result["errors"].append(f"Bias processing: {str(e)}")
            bias_scores = []

    result.update(
        {
            "sentiment": sentiment_scores,
            "emotion": emotion_scores,
            "bias": bias_scores,
        }
    )
    if result["errors"]:
        result["ok"] = False
        # If all models failed, provide a single error message
        if len(result["errors"]) >= 3:
            result["error"] = "All analysis models failed to load. Please check model installation."
    return result


# --------- AI Writer (disclaimer enforced) ---------

@lru_cache(maxsize=1)
def _get_writer():
    cfg = get_config()
    return _safe_pipeline("text2text-generation", cfg["models"]["writer"], device=cfg["performance"]["device"])


def ai_write_article(prompt: str, max_tokens: int = 400) -> Dict[str, Any]:
    writer = _get_writer()
    if _pipeline_failed(writer):
        error_msg = writer.split(":", 1)[1] if ":" in writer else str(writer)
        if "meta tensor" in error_msg.lower():
            return {"ok": False, "error": "Model loading error. Please restart the server."}
        return {"ok": False, "error": error_msg}
    
    # Truncate prompt to fit model limits
    prompt = _truncate_for_model(prompt, max_tokens=256)
    prompt_text = f"Write a news article. Prompt: {prompt}\n\nInclude disclaimer: AI-GENERATED CONTENT."
    
    try:
        # Use proper parameters
        out = writer(
            prompt_text, 
            max_new_tokens=max_tokens, 
            num_return_sequences=1, 
            do_sample=False
        )
        # Handle different output formats
        text = None
        if isinstance(out, list) and len(out) > 0:
            if isinstance(out[0], dict):
                text = out[0].get("generated_text", str(out[0]))
            else:
                text = str(out[0])
        elif isinstance(out, dict):
            text = out.get("generated_text", str(out))
        elif isinstance(out, str):
            text = out
        else:
            text = str(out) if out else None
        
        if not text or len(text.strip()) < 20:
            return {"ok": False, "error": "Generated article too short or empty"}
        
        text = f"AI-GENERATED CONTENT\n\n{text}\n\nAI-GENERATED CONTENT"
        return {"ok": True, "article": text}
    except (IndexError, KeyError) as e:
        return {"ok": False, "error": f"Generation failed: {str(e)}"}
    except Exception as e:
        error_msg = str(e)
        if "meta tensor" in error_msg.lower():
            return {"ok": False, "error": "Model loading error. Please restart the server."}
        return {"ok": False, "error": error_msg}


# --------- Multi-style summarizer ---------

@lru_cache(maxsize=1)
def _get_summarizer():
    cfg = get_config()
    return _safe_pipeline("summarization", cfg["models"]["summarizer"], device=cfg["performance"]["device"])


SUMMARY_STYLES = [
    "bullet",
    "tweet",
    "eli5",
    "executive",
    "technical",
    "headline_oneliner",
    "story",
    "formal",
    "casual",
    "analytical",
]


def _style_transform(style: str, base: str) -> str:
    if style == "bullet":
        parts = [f"- {s.strip()}" for s in re.split(r"(?<=[.])\s+", base) if s.strip()][:5]
        return "\n".join(parts) if parts else f"- {base}"
    if style == "tweet":
        return (base[:260] + "…") if len(base) > 260 else base
    if style == "eli5":
        return "Imagine explaining to a friend: " + base
    if style == "executive":
        return "Executive summary: " + base
    if style == "technical":
        return "Technical details: " + base
    if style == "headline_oneliner":
        return "Headline + one-liner: " + base
    if style == "story":
        return "Story format: " + base
    if style == "formal":
        return "Formal summary: " + base
    if style == "casual":
        return "Casual take: " + base
    if style == "analytical":
        return "Analysis: " + base
    return base


def multi_style_summaries(text: str) -> Dict[str, Any]:
    summarizer = _get_summarizer()
    if _pipeline_failed(summarizer):
        error_msg = summarizer.split(":", 1)[1] if ":" in summarizer else str(summarizer)
        return {"ok": False, "error": error_msg}
    text = _clean_text(text, limit=6000)
    if len(text) < 100:
        return {"ok": False, "error": "Text too short for summarization (minimum 100 characters)"}
    
    # Truncate to model's token limit
    text = _truncate_for_model(text, max_tokens=1024)  # BART models typically support 1024
    
    try:
        # Use proper parameters
        result = summarizer(
            text, 
            max_length=160, 
            min_length=60, 
            do_sample=False
        )
        # Handle different return formats
        base = None
        if isinstance(result, list):
            if len(result) > 0:
                if isinstance(result[0], dict):
                    base = result[0].get("summary_text") or result[0].get("text") or str(result[0])
                elif isinstance(result[0], str):
                    base = result[0]
                else:
                    base = str(result[0])
            else:
                return {"ok": False, "error": "Summary generation returned empty result"}
        elif isinstance(result, dict):
            base = result.get("summary_text") or result.get("text") or str(result)
        elif isinstance(result, str):
            base = result
        else:
            base = str(result) if result else None
        
        if not base or len(base.strip()) < 10:
            return {"ok": False, "error": "Summary too short or empty. Try with longer text."}
    except (IndexError, KeyError) as e:
        return {"ok": False, "error": f"Summary generation failed. Text may be too short or model error: {str(e)}"}
    except Exception as e:
        error_msg = str(e)
        if "index out of range" in error_msg.lower():
            return {"ok": False, "error": "Summary generation failed. Text may be too short. Try with longer article text."}
        return {"ok": False, "error": f"Summary error: {error_msg}"}

    summaries = {}
    for style in SUMMARY_STYLES:
        summaries[style] = _style_transform(style, base)
    return {"ok": True, "base": base, "summaries": summaries}


# --------- Headline generator ---------

@lru_cache(maxsize=1)
def _get_headline_model():
    cfg = get_config()
    return _safe_pipeline("text2text-generation", cfg["models"]["headline"], device=cfg["performance"]["device"])


def generate_headlines(text: str, num: int = 5) -> Dict[str, Any]:
    model = _get_headline_model()
    if _pipeline_failed(model):
        error_msg = model.split(":", 1)[1] if ":" in model else str(model)
        # If protobuf error, provide helpful message
        if "protobuf" in error_msg.lower():
            return {"ok": False, "error": "Protobuf library required. Install with: pip install protobuf"}
        if "meta tensor" in error_msg.lower():
            return {"ok": False, "error": "Model loading error. Please restart the server."}
        return {"ok": False, "error": error_msg}
    
    # Truncate text properly for headline generation
    text = _truncate_for_model(text, max_tokens=512)
    
    try:
        # Use proper parameters
        outputs = model(
            text, 
            max_new_tokens=32, 
            num_return_sequences=min(num, 5), 
            num_beams=min(4, num), 
            do_sample=False
        )
        # Handle different output formats
        headlines = []
        if isinstance(outputs, list):
            for o in outputs:
                if isinstance(o, dict):
                    headline = o.get("generated_text", str(o))
                elif isinstance(o, str):
                    headline = o
                else:
                    headline = str(o)
                if headline and headline.strip():
                    headlines.append(headline.strip())
        elif isinstance(outputs, dict):
            headline = outputs.get("generated_text", str(outputs))
            if headline and headline.strip():
                headlines.append(headline.strip())
        elif isinstance(outputs, str):
            if outputs.strip():
                headlines.append(outputs.strip())
        else:
            headline = str(outputs).strip()
            if headline:
                headlines.append(headline)
        
        # Clean and deduplicate headlines
        seen = set()
        unique_headlines = []
        for h in headlines:
            h_clean = h.strip()
            if h_clean and h_clean.lower() not in seen:
                seen.add(h_clean.lower())
                unique_headlines.append(h_clean)
        
        if not unique_headlines:
            return {"ok": False, "error": "No headlines generated. Try with longer text."}
        
        return {"ok": True, "headlines": unique_headlines[:num]}
    except Exception as e:
        error_msg = str(e)
        if "protobuf" in error_msg.lower():
            return {"ok": False, "error": "Protobuf library required. Install with: pip install protobuf"}
        if "meta tensor" in error_msg.lower():
            return {"ok": False, "error": "Model loading error. Please restart the server."}
        return {"ok": False, "error": error_msg}


# --------- Orchestrator ---------

async def run_selected_features(content: str, selection: Dict[str, bool]) -> Dict[str, Any]:
    """
    Run enabled features. Each feature is independent; failures are captured per-feature.
    Uses timeouts to prevent hanging.
    """
    tasks = []
    results: Dict[str, Any] = {}
    names = []

    async def run_with_timeout(func, timeout: float, *args):
        """Run a function with a timeout"""
        try:
            return await asyncio.wait_for(asyncio.to_thread(func, *args), timeout=timeout)
        except asyncio.TimeoutError:
            return {"ok": False, "error": f"Feature timed out after {timeout}s"}
        except Exception as e:
            return {"ok": False, "error": str(e)}

    # Add tasks with appropriate timeouts
    if selection.get("tts"):
        names.append("tts")
        tasks.append(run_with_timeout(tts_generate, 30.0, content))  # 30s for TTS
    if selection.get("ner_reality_checker"):
        names.append("ner_reality_checker")
        tasks.append(run_with_timeout(ner_reality_checker, 60.0, content))  # 60s for NER
    # Removed problematic features: bias_sentiment, ai_writer, multi_style_summarizer, headline_generator

    # Run concurrently; preserve ordering with names list
    gathered = await asyncio.gather(*tasks, return_exceptions=True)
    for name, out in zip(names, gathered):
        if isinstance(out, Exception):
            results[name] = {"ok": False, "error": str(out)}
        else:
            results[name] = out
    return results

