from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv
from groq import Groq
import asyncio
import platform
from gnews import GNews
import json
import re
import httpx
import requests
from bs4 import BeautifulSoup
from feature_config import get_config
from advanced_features import run_selected_features

load_dotenv()

# Ensure Windows supports asyncio subprocesses required by Playwright
if platform.system().lower() == "windows":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

app = FastAPI(title="News Detection API")

# Create audio directory if it doesn't exist
AUDIO_DIR = os.path.join(os.path.dirname(__file__), "audio_files")
os.makedirs(AUDIO_DIR, exist_ok=True)

# CORS middleware (must be before routes)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Custom audio endpoint to handle range requests properly
from fastapi.responses import FileResponse, StreamingResponse
from fastapi import Request

@app.get("/audio/{filename}")
async def serve_audio(filename: str, request: Request):
    """Serve audio files with proper range request support"""
    filepath = os.path.join(AUDIO_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    file_size = os.path.getsize(filepath)
    
    # Check if file is empty (TTS failed)
    if file_size == 0:
        raise HTTPException(
            status_code=500, 
            detail="Audio file is empty. TTS generation may have failed. Please try again."
        )
    
    range_header = request.headers.get("range")
    
    # If no range header, send entire file
    if not range_header:
        return FileResponse(
            filepath,
            media_type="audio/mpeg",
            headers={"Accept-Ranges": "bytes"}
        )
    
    # Parse range header
    try:
        byte_range = range_header.replace("bytes=", "").split("-")
        start = int(byte_range[0]) if byte_range[0] else 0
        end = int(byte_range[1]) if len(byte_range) > 1 and byte_range[1] else file_size - 1
        
        # Validate range
        if start >= file_size or end >= file_size or start > end:
            raise HTTPException(
                status_code=416,
                detail="Range not satisfiable",
                headers={"Content-Range": f"bytes */{file_size}"}
            )
        
        # Read requested range
        chunk_size = end - start + 1
        
        def file_iterator():
            with open(filepath, "rb") as f:
                f.seek(start)
                remaining = chunk_size
                while remaining > 0:
                    read_size = min(8192, remaining)
                    data = f.read(read_size)
                    if not data:
                        break
                    remaining -= len(data)
                    yield data
        
        return StreamingResponse(
            file_iterator(),
            status_code=206,
            media_type="audio/mpeg",
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(chunk_size),
            }
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid range header")

class NewsRequest(BaseModel):
    content: str
    input_type: str  # "title", "url", or "article"
    enable_features: Optional[dict] = None  # e.g., {"tts": true, "ner_reality_checker": false, ...}

class ArticleMetadata(BaseModel):
    title: Optional[str] = None
    source: Optional[str] = None
    url: Optional[str] = None
    author: Optional[str] = None
    summary: Optional[str] = None

class AnalysisResult(BaseModel):
    is_fake: bool
    fake_probability: float
    real_probability: float
    confidence_score: float
    red_flags: List[str]
    patterns: List[str]
    reasoning: str
    key_entities: Optional[List[str]] = None
    article_metadata: Optional[ArticleMetadata] = None
    sources_found: Optional[List[dict]] = None
    similar_articles: Optional[List[dict]] = None
    advanced_features: Optional[dict] = None  # holds optional outputs when requested

async def extract_article_from_url(url: str) -> tuple[str, ArticleMetadata]:
    """Extract article content and metadata from URL using requests + BeautifulSoup (Playwright-free for compatibility)."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
        }
        resp = requests.get(url, headers=headers, timeout=20)
        if resp.status_code >= 400:
            raise HTTPException(
                status_code=400,
                detail="Access denied or blocked by the source site. Please paste the full article text instead.",
            )

        soup = BeautifulSoup(resp.text, "lxml")

        # Remove scripts/styles
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()

        def meta(name: str):
            tag = soup.find("meta", attrs={"name": name}) or soup.find("meta", attrs={"property": name}) or soup.find(
                "meta", attrs={"property": f"og:{name}"}
            )
            return tag["content"] if tag and tag.has_attr("content") else None

        title = soup.title.string.strip() if soup.title and soup.title.string else None
        title = title or meta("title") or meta("og:title") or (soup.find("h1").get_text(strip=True) if soup.find("h1") else "Unknown Title")
        author = meta("author") or meta("article:author") or (soup.find(attrs={"rel": "author"}).get_text(strip=True) if soup.find(attrs={"rel": "author"}) else None)
        author = author or (soup.find(class_=re.compile("author", re.I)).get_text(strip=True) if soup.find(class_=re.compile("author", re.I)) else "Unknown Author")
        site_name = meta("og:site_name") or meta("site_name") or requests.utils.urlparse(url).hostname

        selectors = [
            "article",
            '[role="article"]',
            ".article-content",
            ".post-content",
            ".entry-content",
            ".story-body",
            "main article",
            "main",
            ".content",
        ]
        content = ""
        for sel in selectors:
            el = soup.select_one(sel)
            if el:
                text = el.get_text(separator=" ", strip=True)
                if len(text) > 100:
                    content = text
                    break
        if not content:
            content = soup.get_text(separator=" ", strip=True)

        content = re.sub(r"\s+", " ", content).strip()
        if len(content) < 50:
            raise HTTPException(status_code=400, detail="Could not extract meaningful content from URL. Please try pasting the article text directly.")

        metadata = ArticleMetadata(
            title=title,
            source=site_name,
            url=url,
            author=author,
            summary=None  # Will be generated by AI
        )

        return content[:15000], metadata

    except Exception as e:
        error_msg = str(e)
        if isinstance(e, HTTPException):
            raise
        if "timed out" in error_msg.lower():
            raise HTTPException(status_code=400, detail="The website took too long to load. Please try pasting the article text directly instead.")
        raise HTTPException(status_code=400, detail=f"Failed to extract article: {error_msg}")

async def search_news_title(title: str) -> List[dict]:
    """Search for news articles with similar titles using GNews and optionally Google CSE"""
    try:
        google_news = GNews(language='en', max_results=5)
        results = google_news.get_news(title)

        # Optionally enrich with Google Custom Search if configured
        extra = await search_google_cse(title, max_results=4)
        merged = merge_deduplicate_results(results, extra)
        return merged
    except Exception as e:
        print(f"GNews search error: {str(e)}")
        return []

async def get_similar_articles(content: str) -> List[dict]:
    """Get similar articles based on content using GNews and optionally Google CSE"""
    try:
        # Extract key terms from content for search
        words = content.split()[:50]  # First 50 words
        search_query = ' '.join(words)
        
        google_news = GNews(language='en', max_results=4)
        results = google_news.get_news(search_query)

        # Optionally enrich with Google Custom Search if configured
        extra = await search_google_cse(search_query, max_results=4)
        merged = merge_deduplicate_results(results, extra)
        return merged[:4]  # Return top 4 merged similar articles
    except Exception as e:
        print(f"Similar articles search error: {str(e)}")
        return []

async def search_google_cse(query: str, max_results: int = 5) -> List[dict]:
    """
    Optional: Search Google Programmable Search (Custom Search Engine) if env vars are present.
    Returns a list shaped like GNews items for downstream compatibility.
    """
    api_key = os.getenv("GOOGLE_CSE_KEY")
    cx = os.getenv("GOOGLE_CSE_ID")
    if not api_key or not cx:
        return []

    url = "https://www.googleapis.com/customsearch/v1"
    params = {"key": api_key, "cx": cx, "q": query, "num": max_results}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
            items = data.get("items", []) or []
            results = []
            for item in items:
                title = item.get("title")
                link = item.get("link")
                display_link = item.get("displayLink")
                if not title or not link:
                    continue
                results.append({
                    "title": title,
                    "url": link,
                    "publisher": {"title": display_link or "Unknown"}
                })
            return results
    except Exception as e:
        print(f"Google CSE search error: {str(e)}")
        return []

def merge_deduplicate_results(primary: List[dict], extra: List[dict]) -> List[dict]:
    """Merge two article lists, deduplicating by URL."""
    seen = set()
    merged = []

    def add_items(items: List[dict]):
        for itm in items or []:
            url = itm.get("url") or itm.get("link")
            if not url or url in seen:
                continue
            seen.add(url)
            merged.append(itm)

    add_items(primary)
    add_items(extra)
    return merged

async def verify_with_google_search(query: str, max_results: int = 10) -> dict:
    """
    Verify news/claims using real-time Google Custom Search Engine API.
    Returns search results and analysis to help determine if the claim is verified by credible sources.
    """
    try:
        print(f"🔍 Performing Google CSE Search for: {query}")
        
        # Use Google Custom Search Engine API (much more reliable than web scraping)
        api_key = os.getenv("GOOGLE_CSE_KEY")
        cx = os.getenv("GOOGLE_CSE_ID")
        
        if not api_key or not cx:
            print("⚠️ Google CSE credentials not found. Please set GOOGLE_CSE_KEY and GOOGLE_CSE_ID in .env")
            # Fallback: return empty but don't fail
            return {
                "total_results": 0,
                "credible_results": 0,
                "search_results": [],
                "credible_sources": [],
                "verification_summary": {
                    "found_sources": False,
                    "has_credible_sources": False,
                    "credibility_ratio": 0,
                    "error": "Google CSE credentials not configured"
                }
            }
        
        # Try multiple search variations for better results
        search_queries = [query]
        
        # Extract key terms for a keyword search (fallback)
        import re
        # Remove common words and extract key terms
        key_words = re.findall(r'\b[A-Z][a-z]+|\b\d+\b|\b(?:mountain|peak|discover|found|8000|meter|metre|Nepal)\b', query, re.IGNORECASE)
        if len(key_words) >= 3:
            keyword_query = ' '.join(list(dict.fromkeys(key_words)))[:200]  # deduplicate and limit
            if keyword_query != query:
                search_queries.append(keyword_query)
        
        all_search_results = []
        seen_urls = set()
        
        # Try each search query
        for search_query in search_queries:
            try:
                # Call Google Custom Search API
                url = "https://www.googleapis.com/customsearch/v1"
                params = {"key": api_key, "cx": cx, "q": search_query, "num": min(max_results, 10)}
                
                async with httpx.AsyncClient(timeout=15) as client:
                    resp = await client.get(url, params=params)
                    resp.raise_for_status()
                    data = resp.json()
                    
                    items = data.get("items", []) or []
                    print(f"📥 Query '{search_query[:50]}...' returned {len(items)} results")
                    
                    for item in items:
                        from urllib.parse import urlparse
                        title = item.get("title", "No title")
                        link = item.get("link", "")
                        display_link = item.get("displayLink", "")
                        snippet = item.get("snippet", "")
                        
                        if not link or link in seen_urls:
                            continue
                        
                        seen_urls.add(link)
                        domain = urlparse(link).netloc if link else display_link
                        
                        all_search_results.append({
                            "url": link,
                            "domain": domain,
                            "title": title,
                            "snippet": snippet
                        })
                
                # If we found good results, no need to try more queries
                if len(all_search_results) >= 5:
                    break
                    
            except Exception as e:
                print(f"⚠️ Search query '{search_query[:30]}...' failed: {str(e)}")
                continue
        
        # Analyze credibility of sources - comprehensive list
        credible_domains = [
            # International news agencies
            'bbc.', 'cnn.', 'reuters.', 'apnews.', 'afp.com', 'bloomberg.',
            # US news
            'nytimes.', 'washingtonpost.', 'wsj.', 'usatoday.', 'npr.org',
            'abc.', 'cbsnews.', 'nbcnews.', 'pbs.org', 'axios.com',
            # UK news
            'theguardian.', 'independent.co.uk', 'telegraph.co.uk', 'bbc.co.uk',
            # International
            'aljazeera.', 'france24.', 'dw.com', 'euronews.', 'swissinfo.ch',
            # Asian news
            'scmp.com', 'straitstimes.com', 'japantimes.', 'chinadaily.',
            'channelnewsasia.', 'todayonline.com', 'koreaherald.com',
            # Indian news
            'thehindu.', 'ndtv.', 'timesofindia.', 'hindustantimes.',
            'indianexpress.', 'scroll.in', 'thewire.in', 'news18.com',
            # Nepal news (IMPORTANT for your use case)
            'kathmandupost.', 'ekantipur.', 'myrepublica.', 'thehimalayantimes.',
            'onlinekhabar.', 'setopati.', 'nepalitime', 'nepalitimes.',
            # Other reputable
            'forbes.', 'economist.', 'time.com', 'newsweek.', 'theatlantic.',
            'nature.com', 'sciencemag.org', 'nationalgeographic.',
            # News aggregators (if from credible sources)
            'news.google.', 'infoplease.com'
        ]
        
        credible_sources = []
        for result in all_search_results:
            domain = result.get('domain', '').lower()
            # Check if any credible domain is in the result domain
            if any(cred_domain in domain for cred_domain in credible_domains):
                credible_sources.append(result)
                print(f"✅ Found credible source: {domain}")
        
        print(f"📊 Results: {len(all_search_results)} total, {len(credible_sources)} credible")
        
        return {
            "total_results": len(all_search_results),
            "credible_results": len(credible_sources),
            "search_results": all_search_results[:5],  # Top 5 for display
            "credible_sources": credible_sources[:5],  # Top 5 credible sources
            "verification_summary": {
                "found_sources": len(all_search_results) > 0,
                "has_credible_sources": len(credible_sources) > 0,
                "credibility_ratio": len(credible_sources) / len(all_search_results) if all_search_results else 0
            }
        }
    except Exception as e:
        print(f"❌ Google Search error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "total_results": 0,
            "credible_results": 0,
            "search_results": [],
            "credible_sources": [],
            "verification_summary": {
                "found_sources": False,
                "has_credible_sources": False,
                "credibility_ratio": 0,
                "error": str(e)
            }
        }

async def analyze_with_groq(content: str, input_type: str, sources: Optional[List[dict]] = None, google_verification: Optional[dict] = None) -> AnalysisResult:
    """Analyze news content using Groq's Llama 3.3 70B model with real-time Google Search verification"""

    
    # Prepare the prompt based on input type
    if input_type == "title":
        sources_info = ""
        if sources:
            sources_info = "\n\nRelated sources found:\n"
            for idx, source in enumerate(sources[:3], 1):
                sources_info += f"{idx}. {source.get('title', 'N/A')} - {source.get('publisher', {}).get('title', 'Unknown')}\n"
        
        # Add Google Search verification info
        google_info = ""
        if google_verification:
            verification = google_verification.get('verification_summary', {})
            credible_sources = google_verification.get('credible_sources', [])
            
            google_info = "\n\n🔍 REAL-TIME GOOGLE SEARCH VERIFICATION:\n"
            google_info += f"- Total search results found: {google_verification.get('total_results', 0)}\n"
            google_info += f"- Credible news sources found: {google_verification.get('credible_results', 0)}\n"
            google_info += f"- Credibility ratio: {verification.get('credibility_ratio', 0):.0%}\n"
            
            if credible_sources:
                google_info += "\nCredible sources reporting this:\n"
                for idx, source in enumerate(credible_sources[:5], 1):
                    google_info += f"{idx}. {source.get('title', 'N/A')} ({source.get('domain', 'Unknown')})\n"
                    google_info += f"   URL: {source.get('url', 'N/A')}\n"
            else:
                google_info += "\n⚠️ No credible news sources found reporting this claim.\n"
        
        prompt = f"""You are an expert fact-checker and misinformation analyst. Analyze the following news title for authenticity.

Title: "{content}"
{sources_info}
{google_info}

CRITICAL INSTRUCTIONS FOR VERIFICATION:
1. The Google Search results above are REAL-TIME data from the current web (as of today)
2. These results are MORE RELIABLE than your training data, which may be outdated
3. If you see 2+ credible news sources (BBC, Reuters, CNN, AP News, Kathmandu Post, etc.) reporting this, you MUST mark it as REAL (is_fake: false, real_probability: 70-90)
4. Your training data may NOT include recent events - TRUST the Google Search results over your memory
5. Common credible sources: BBC, Reuters, AP News, CNN, The Guardian, Kathmandu Post, Ekantipur, My Republica, The Himalayan Times

Provide a comprehensive analysis in JSON format with the following structure:
{{
    "is_fake": boolean,
    "fake_probability": float (0-100),
    "real_probability": float (0-100),
    "red_flags": [list of concerning elements],
    "patterns": [list of patterns detected],
    "reasoning": "detailed explanation of your analysis, MUST mention the Google Search findings and credible sources found",
    "key_entities": [list of main people/organizations mentioned or implied]
}}

Consider:
1. **Real-time Google Search results** (ABSOLUTE HIGHEST PRIORITY - this is verified current web data)
2. Number and credibility of sources reporting the claim
3. Number and quality of credible sources found
4. Sensationalism and clickbait indicators
5. Language patterns typical of fake news
6. Emotional manipulation tactics

Respond ONLY with valid JSON."""


    else:  # article or url
        # Add Google Search verification info for articles too
        google_info = ""
        if google_verification:
            verification = google_verification.get('verification_summary', {})
            credible_sources = google_verification.get('credible_sources', [])
            
            google_info = "\n\n🔍 REAL-TIME GOOGLE SEARCH VERIFICATION:\n"
            google_info += f"- Total search results found: {google_verification.get('total_results', 0)}\n"
            google_info += f"- Credible news sources found: {google_verification.get('credible_results', 0)}\n"
            google_info += f"- Credibility ratio: {verification.get('credibility_ratio', 0):.0%}\n"
            
            if credible_sources:
                google_info += "\nCredible sources with similar content:\n"
                for idx, source in enumerate(credible_sources[:3], 1):
                    google_info += f"{idx}. {source.get('title', 'N/A')} ({source.get('domain', 'Unknown')})\n"
            else:
                google_info += "\n⚠️ No credible news sources found with similar content.\n"
        
        prompt = f"""You are an expert fact-checker and misinformation analyst. Analyze the following news article for authenticity.

Article Content:
{content[:8000]}
{google_info}

IMPORTANT: I have performed a REAL-TIME Google Search to verify the claims in this article. The search results above are from the current web, NOT from your training data. Please prioritize these real-time search results when making your determination.

If credible news sources are reporting similar content, give weight to that in your analysis.

Provide a comprehensive analysis in JSON format with the following structure:
{{
    "is_fake": boolean,
    "fake_probability": float (0-100),
    "real_probability": float (0-100),
    "red_flags": [list of concerning elements],
    "patterns": [list of patterns detected],
    "reasoning": "detailed explanation of your analysis, mentioning the Google Search findings if available",
    "key_entities": [list of main people/organizations mentioned]
}}

Consider:
1. **Real-time Google Search results** (HIGHEST PRIORITY if available - this is current data from the web)
2. Credibility of sources reporting similar content
3. Writing quality and journalistic standards
4. Source citations and evidence
5. Bias and objectivity
6. Factual accuracy and consistency
7. Sensationalism and emotional manipulation
8. Logical fallacies and misleading information
9. Author credibility
10. Publication patterns

Respond ONLY with valid JSON."""


    try:
        # Call Groq API
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional fact-checker and misinformation analyst. Always respond with valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=2000,
        )
        
        response_text = chat_completion.choices[0].message.content.strip()
        print(f"AI Response: {response_text[:500]}")  # Debug logging
        
        # Extract JSON from response - handle markdown code blocks
        if "```json" in response_text:
            json_match = re.search(r'```json\s*(\{.*?\})\s*```', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(1)
        elif "```" in response_text:
            json_match = re.search(r'```\s*(\{.*?\})\s*```', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(1)
        else:
            # Try to find JSON object
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group()
        
        try:
            analysis = json.loads(response_text)
        except json.JSONDecodeError as e:
            print(f"JSON Parse Error: {str(e)}")
            print(f"Attempted to parse: {response_text}")
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to parse AI response as JSON. Response: {response_text[:200]}"
            )
        
        # Ensure probabilities sum to 100
        fake_prob = float(analysis.get("fake_probability", 50))
        real_prob = float(analysis.get("real_probability", 50))
        
        # Normalize if needed
        total = fake_prob + real_prob
        if total > 0:
            fake_prob = (fake_prob / total) * 100
            real_prob = (real_prob / total) * 100
        else:
            fake_prob = 50.0
            real_prob = 50.0
        
        # Calculate confidence score (0-100) based on how decisive the probabilities are
        confidence_score = abs(fake_prob - real_prob)
        
        # Ensure all required fields exist with defaults
        return AnalysisResult(
            is_fake=bool(analysis.get("is_fake", fake_prob > 50)),
            fake_probability=round(fake_prob, 2),
            real_probability=round(real_prob, 2),
            confidence_score=round(confidence_score, 2),
            red_flags=analysis.get("red_flags", []) if isinstance(analysis.get("red_flags"), list) else [],
            patterns=analysis.get("patterns", []) if isinstance(analysis.get("patterns"), list) else [],
            reasoning=str(analysis.get("reasoning", "Analysis completed.")),
            key_entities=analysis.get("key_entities", []) if isinstance(analysis.get("key_entities"), list) else [],
            article_metadata=None,  # Will be set in main endpoint
            sources_found=sources if input_type == "title" else None,
            similar_articles=None  # Will be set in main endpoint
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in analyze_with_groq: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/")
async def root():
    return {"message": "News Detection API is running"}

@app.post("/analyze", response_model=AnalysisResult)
async def analyze_news(request: NewsRequest):
    """Main endpoint to analyze news content"""
    
    content = request.content.strip()
    input_type = request.input_type.lower()
    
    if not content:
        raise HTTPException(status_code=400, detail="Content cannot be empty")
    
    if input_type not in ["title", "url", "article"]:
        raise HTTPException(status_code=400, detail="Invalid input_type. Must be 'title', 'url', or 'article'")
    
    sources = None
    metadata = None
    similar_articles = None
    
    try:
        if input_type == "url":
            # Extract article from URL with metadata
            content, metadata = await extract_article_from_url(content)
            
            # Generate summary using AI
            summary_prompt = f"Summarize the following article in one concise sentence (max 150 characters):\n\n{content[:2000]}"
            summary_response = groq_client.chat.completions.create(
                messages=[{"role": "user", "content": summary_prompt}],
                model="llama-3.3-70b-versatile",
                temperature=0.3,
                max_tokens=100,
            )
            metadata.summary = summary_response.choices[0].message.content.strip()
            
            # Get similar articles
            similar_articles = await get_similar_articles(content)
            
            input_type = "article"  # Treat as article after extraction
            
        elif input_type == "title":
            # Search for related news articles
            sources = await search_news_title(content)
        elif input_type == "article":
            # Get similar articles for pasted articles too
            similar_articles = await get_similar_articles(content)
        
        # Build fallback metadata when user pastes title or article
        if metadata is None:
            metadata = ArticleMetadata(
                title=content if input_type == "title" else content[:120] + ("..." if len(content) > 120 else ""),
                source="User provided",
                url=None,
                author="Unknown",
                summary=None
            )
        
        # 🔍 PERFORM REAL-TIME GOOGLE SEARCH VERIFICATION
        google_verification = None
        try:
            # Create search query based on input type
            if input_type == "title":
                search_query = content
            else:
                # For articles, extract key terms for search
                # Use first 100 characters or title if available
                search_query = metadata.title if metadata.title and len(metadata.title) < 200 else content[:100]
            
            print(f"🌐 Performing Google Search verification for: {search_query[:100]}...")
            google_verification = await verify_with_google_search(search_query, max_results=10)
            print(f"✅ Google Search complete: {google_verification.get('total_results', 0)} results, {google_verification.get('credible_results', 0)} credible sources")
        except Exception as e:
            print(f"⚠️ Google Search verification failed (will proceed without it): {str(e)}")
        
        # Analyze with Groq (now includes Google verification data)
        result = await analyze_with_groq(content, input_type, sources, google_verification)
        
        # 🎯 SMART VERIFICATION: Override LLM if credible sources confirm the news
        if google_verification:
            credible_count = google_verification.get('credible_results', 0)
            total_results = google_verification.get('total_results', 0)
            credibility_ratio = google_verification.get('verification_summary', {}).get('credibility_ratio', 0)
            
            print(f"📊 Verification Stats - Credible: {credible_count}, Total: {total_results}, Ratio: {credibility_ratio:.2%}")
            
            # Strong evidence of REAL news: 3+ credible sources with high ratio
            if credible_count >= 3 and credibility_ratio >= 0.3:
                print(f"✅ OVERRIDING LLM: {credible_count} credible sources confirm this news is REAL")
                result.is_fake = False
                result.real_probability = min(95.0, 60.0 + (credible_count * 7))  # Scale with credible sources
                result.fake_probability = 100.0 - result.real_probability
                result.confidence_score = abs(result.real_probability - result.fake_probability)
                
                # Update reasoning to explain the override
                override_msg = f"\n\n✅ VERIFICATION OVERRIDE: Found {credible_count} credible news sources confirming this story, including: "
                credible_sources = google_verification.get('credible_sources', [])
                override_msg += ", ".join([s.get('domain', 'Unknown') for s in credible_sources[:3]])
                override_msg += f". With a credibility ratio of {credibility_ratio:.0%}, this is confirmed as REAL news."
                result.reasoning = result.reasoning + override_msg
                
                # Add verification note to red flags
                result.red_flags = [f for f in result.red_flags if f]  # Clear placeholder flags
                if not result.red_flags or len(result.red_flags) == 0:
                    result.red_flags = ["Initial analysis suggested concerns, but verification confirmed authenticity"]
            
            # Moderate evidence: 1-2 credible sources
            elif credible_count >= 1 and credible_count < 3:
                print(f"⚖️ ADJUSTING: {credible_count} credible sources found, adjusting probabilities")
                # Shift probabilities towards real
                adjustment = credible_count * 15  # 15% per credible source
                result.real_probability = min(80.0, result.real_probability + adjustment)
                result.fake_probability = 100.0 - result.real_probability
                result.is_fake = result.fake_probability > result.real_probability
                result.confidence_score = abs(result.real_probability - result.fake_probability)
                
                # Update reasoning
                adjust_msg = f"\n\n⚖️ PROBABILITY ADJUSTED: Found {credible_count} credible source(s) reporting similar information. Adjusted real probability by +{adjustment}%."
                result.reasoning = result.reasoning + adjust_msg
            
            # No credible sources but results exist
            elif total_results >= 5 and credible_count == 0:
                print(f"⚠️ WARNING: {total_results} results found but NO credible sources")
                # Increase fake probability slightly
                result.fake_probability = min(95.0, result.fake_probability + 10)
                result.real_probability = 100.0 - result.fake_probability
                result.is_fake = True
                result.confidence_score = abs(result.real_probability - result.fake_probability)
                
                warning_msg = f"\n\n⚠️ NO CREDIBLE SOURCES: Found {total_results} search results but none from credible news organizations."
                result.reasoning = result.reasoning + warning_msg
        
        # Add metadata and similar articles to result
        result.article_metadata = metadata
        result.similar_articles = similar_articles

        # Run optional advanced features if requested
        if request.enable_features:
            # Merge user selection with config defaults (only truthy keys)
            selection = {k: bool(v) for k, v in request.enable_features.items()}
            adv = await run_selected_features(content, selection)
            result.advanced_features = adv
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "groq_api_configured": bool(os.getenv("GROQ_API_KEY"))}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)
