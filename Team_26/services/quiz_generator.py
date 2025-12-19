#!/usr/bin/env python3
"""
Advanced Quiz Generation Service
Generates adaptive MCQs using NLTK, ML models, and web scraping
"""

import sys
import os
import json
import re
import random
import math
import logging
from collections import defaultdict, Counter
from typing import List, Dict, Tuple, Optional

# Add the current directory to Python path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import nltk
import numpy as np
import pandas as pd
import requests
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS
import arxiv
import wikipediaapi
from sentence_transformers import SentenceTransformer, util
from transformers import pipeline, AutoTokenizer
from sklearn.cluster import KMeans

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Download NLTK data
try:
    nltk.data.path.append('/usr/local/share/nltk_data')
    for pkg in ['punkt', 'averaged_perceptron_tagger', 'stopwords', 'punkt_tab', 'averaged_perceptron_tagger_eng']:
        try:
            nltk.download(pkg, quiet=True)
        except:
            pass
except Exception as e:
    logger.warning(f"Could not download NLTK data: {e}")

from nltk import pos_tag
from nltk.corpus import stopwords

# Model configurations
EMB_MODEL_NAME = "all-MiniLM-L6-v2"
QG_PRIMARY_MODEL = "valhalla/t5-small-qa-qg-hl"
QG_FALLBACK_MODEL = "iarfmoose/t5-base-question-generator"
SUMM_MODEL_NAME = "sshleifer/distilbart-cnn-6-6"
ALT_SUMM_MODEL_NAME = "t5-small"

# Global variables
rng = random.Random(42)
np.random.seed(42)
STOP = set(stopwords.words("english"))

class QuizGenerator:
    def __init__(self):
        """Initialize the quiz generator with ML models"""
        self.embedder = None
        self.summarizer = None
        self.qg = None
        self.qg_mode = None
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize ML models with error handling and fallbacks"""
        try:
            # Initialize sentence transformer
            self.embedder = SentenceTransformer(EMB_MODEL_NAME)
            logger.info(f"Initialized embedder: {EMB_MODEL_NAME}")
        except Exception as e:
            logger.error(f"Failed to initialize embedder: {e}")
            raise
        
        # Initialize summarizer
        try:
            self.summarizer = pipeline("summarization", model=SUMM_MODEL_NAME)
            logger.info(f"Initialized summarizer: {SUMM_MODEL_NAME}")
        except Exception as e:
            logger.warning(f"Failed to load {SUMM_MODEL_NAME}: {e}")
            try:
                self.summarizer = pipeline("summarization", model=ALT_SUMM_MODEL_NAME)
                logger.info(f"Using fallback summarizer: {ALT_SUMM_MODEL_NAME}")
            except Exception as e_alt:
                logger.error(f"Failed to load {ALT_SUMM_MODEL_NAME}: {e_alt}")
                self.summarizer = None
        
        # Initialize question generator
        try:
            self.qg = pipeline("multitask-qa-qg", model=QG_PRIMARY_MODEL)
            self.qg_mode = "valhalla"
            logger.info(f"Initialized QG: {QG_PRIMARY_MODEL}")
        except Exception as e:
            logger.warning(f"Failed to load {QG_PRIMARY_MODEL}: {e}")
            try:
                self.qg = pipeline("text2text-generation", model=QG_FALLBACK_MODEL)
                self.qg_mode = "text2text"
                logger.info(f"Using fallback QG: {QG_FALLBACK_MODEL}")
            except Exception as e_alt:
                logger.error(f"Failed to load {QG_FALLBACK_MODEL}: {e_alt}")
                raise
    
    def safe_sent_tokenize(self, text: str) -> List[str]:
        """Safe sentence tokenization with fallback"""
        try:
            from nltk.tokenize import sent_tokenize
            return sent_tokenize(text)
        except:
            return re.split(r'(?<=[.!?]) +', text)
    
    def safe_word_tokenize(self, text: str) -> List[str]:
        """Safe word tokenization with fallback"""
        try:
            from nltk.tokenize import word_tokenize
            return word_tokenize(text)
        except:
            return re.findall(r'\b\w+\b', text)
    
    def clean_text(self, text: str, char_limit: int = 6000) -> str:
        """Clean and limit text length"""
        text = re.sub(r"==+.*?==+", " ", text)
        text = re.sub(r"\[[0-9]+\]", " ", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text[:char_limit]
    
    def fetch_wiki(self, topic: str, char_limit: int = 6000) -> str:
        """Fetch content from Wikipedia"""
        try:
            wiki = wikipediaapi.Wikipedia(
                language='en',
                user_agent='EduBotQuizGenerator/1.0'
            )
            page = wiki.page(topic)
            if page.exists():
                return self.clean_text(page.text, char_limit)
        except Exception as e:
            logger.warning(f"Wikipedia fetch error for {topic}: {e}")
        return ""
    
    def fetch_arxiv(self, topic: str, max_results: int = 2) -> str:
        """Fetch content from arXiv"""
        try:
            search = arxiv.Search(query=topic, max_results=max_results, sort_by=arxiv.SortCriterion.Relevance)
            return self.clean_text(" ".join([res.summary for res in search.results()]))
        except Exception as e:
            logger.warning(f"arXiv fetch error for {topic}: {e}")
            return ""
    
    def fetch_web_snippets(self, topic: str, num_results: int = 3) -> str:
        """Fetch content from web search"""
        bodies = []
        try:
            with DDGS() as ddgs:
                for r in ddgs.text(topic, max_results=num_results):
                    if "body" in r and r["body"]:
                        bodies.append(r["body"])
        except Exception as e:
            logger.warning(f"DuckDuckGo fetch error for {topic}: {e}")
        return self.clean_text(" ".join(bodies))
    
    def fetch_learning_material(self, topic: str) -> Tuple[str, str]:
        """Fetch learning material from multiple sources"""
        wiki_text = self.fetch_wiki(topic)
        arxiv_text = self.fetch_arxiv(topic)
        web_text = self.fetch_web_snippets(topic)
        
        combined = " ".join([wiki_text, arxiv_text, web_text]).strip()
        
        if wiki_text and arxiv_text and web_text:
            src = "Wikipedia+arXiv+Web"
        elif wiki_text and arxiv_text:
            src = "Wikipedia+arXiv"
        elif wiki_text and web_text:
            src = "Wikipedia+Web"
        elif wiki_text:
            src = "Wikipedia"
        elif web_text:
            src = "Web"
        else:
            src = "Unknown"
        
        return combined, src
    
    def summarize_text(self, text: str, max_len=220, min_len=80) -> str:
        """Summarize text using ML model"""
        if self.summarizer is None:
            logger.warning("Summarization model not loaded. Skipping summarization.")
            return text
        
        if not text or len(self.safe_word_tokenize(text)) < min_len:
            return text
        
        try:
            summary = self.summarizer(text, max_length=max_len, min_length=min_len, do_sample=False)[0]["summary_text"]
            return summary
        except Exception as e:
            logger.warning(f"Summarization error: {e}. Returning original text.")
            return text
    
    def chunk_text(self, text: str, target_tokens: int = 160) -> List[str]:
        """Split text into chunks for processing"""
        sents = [s.strip() for s in self.safe_sent_tokenize(text) if s.strip()]
        chunks, buff, count = [], [], 0
        
        for s in sents:
            toks = self.safe_word_tokenize(s)
            if count + len(toks) > target_tokens and buff:
                chunks.append(" ".join(buff))
                buff, count = [], 0
            buff.append(s)
            count += len(toks)
        
        if buff:
            chunks.append(" ".join(buff))
        
        return chunks
    
    def _normalize_qa_pairs(self, text_chunk: str) -> List[Dict]:
        """Generate question-answer pairs from text"""
        if self.qg_mode == "valhalla":
            try:
                return [x for x in self.qg(text_chunk) if isinstance(x, dict) and x.get("question") and x.get("answer")]
            except:
                return []
        else:
            toks = [w for w in self.safe_word_tokenize(text_chunk) if w.isalpha()]
            if len(toks) < 6:
                return []
            
            tagged = pos_tag(toks)
            nouns = [w for w, pos in tagged if pos.startswith("NN")]
            answer = nouns[0] if nouns else toks[0]
            q = text_chunk.replace(answer, "_____")[:512]
            return [{"question": q, "answer": answer}]
    
    def key_terms_from_chunk(self, chunk: str, top_k: int = 8) -> List[str]:
        """Extract key terms from text chunk"""
        toks = [w for w in self.safe_word_tokenize(chunk) if w.isalpha() and w.lower() not in STOP]
        tagged = pos_tag(toks)
        cands = [w for w, pos in tagged if pos.startswith("NN") or pos.startswith("JJ")]
        freq = Counter([w.lower() for w in cands])
        return [w for w, _ in freq.most_common(top_k)]
    
    def candidate_distractors(self, answer: str, terms: List[str], embeddings_cache: Dict) -> List[str]:
        """Generate candidate distractors using embeddings"""
        pool = [t for t in terms if t.lower() != answer.lower() and 2 <= len(t) <= 30]
        if not pool or not answer.strip():
            return []
        
        try:
            if answer not in embeddings_cache:
                embeddings_cache[answer] = self.embedder.encode(answer, convert_to_tensor=True)
            ans_emb = embeddings_cache[answer]
            
            vecs, keep = [], []
            for t in pool:
                if t not in embeddings_cache:
                    embeddings_cache[t] = self.embedder.encode(t, convert_to_tensor=True)
                vecs.append(embeddings_cache[t])
                keep.append(t)
            
            sims = [float(util.pytorch_cos_sim(ans_emb, v)[0]) for v in vecs]
            ranked = [keep[i] for i in np.argsort(sims)[::-1]]
            return ranked[:6]
        except Exception as e:
            logger.warning(f"Embedding error for '{answer}': {e}")
            return []
    
    def make_mcqs_from_chunk(self, chunk: str, topic_label: str, subtopic: str, source_tag: str, max_q: int = 5) -> List[Dict]:
        """Generate MCQs from a text chunk"""
        if not chunk.strip():
            return []
        
        qa_pairs = self._normalize_qa_pairs(chunk)
        if not qa_pairs:
            return []
        
        terms, emb_cache = self.key_terms_from_chunk(chunk, top_k=20), {}
        mcqs = []
        
        for qa in qa_pairs[:max_q]:
            question, answer = qa.get("question", "").strip(), qa.get("answer", "").strip()
            if not question or not answer or len(answer.split()) > 6:
                continue
            
            dist_cands = self.candidate_distractors(answer, terms, emb_cache)
            if len(dist_cands) < 3:
                words = [w for w in self.safe_word_tokenize(chunk) if w.isalpha()]
                rng.shuffle(words)
                for w in words:
                    if w.lower() != answer.lower() and w not in dist_cands:
                        dist_cands.append(w)
                    if len(dist_cands) >= 3:
                        break
            
            distractors = [w for w in dist_cands if w.lower() != answer.lower()][:3]
            if len(distractors) < 3:
                continue
            
            options = distractors + [answer]
            rng.shuffle(options)
            
            q_len, a_len = len(question.split()), len(answer.split())
            if q_len <= 8 and a_len <= 2:
                difficulty, bloom = "easy", "remember"
            elif q_len <= 18:
                difficulty, bloom = "medium", "understand"
            else:
                difficulty, bloom = "hard", "apply"
            
            mcqs.append({
                "question": question,
                "options": options,
                "correctAnswer": answer,
                "topic": topic_label,
                "subtopic": subtopic,
                "difficulty": difficulty,
                "skill": bloom,
                "source": source_tag
            })
        
        return mcqs
    
    def subtopic_labels(self, chunks: List[str], topic_label: str, k: int = 4) -> List[str]:
        """Generate subtopic labels using clustering"""
        if not chunks:
            return []
        
        vecs = self.embedder.encode(chunks, convert_to_tensor=False)
        k = min(k, len(chunks)) if len(chunks) > 1 else 1
        
        if k <= 1:
            return [f"{topic_label}::General"] * len(chunks)
        
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = km.fit_predict(vecs)
        names = {}
        
        for c in range(k):
            idxs = [i for i, l in enumerate(labels) if l == c]
            text_join = " ".join([chunks[i] for i in idxs])
            terms = self.key_terms_from_chunk(text_join, top_k=3)
            pretty = ", ".join(terms) if terms else f"Cluster-{c}"
            names[c] = f"{topic_label}::{pretty}"
        
        return [names[l] for l in labels]
    
    def build_cold_start_quiz(self, selected_topics: List[str], per_topic_q: int = 8) -> List[Dict]:
        """Build a quiz from scratch using web content"""
        all_mcqs = []
        
        for topic in selected_topics:
            logger.info(f"Processing topic: {topic}")
            raw, src_tag = self.fetch_learning_material(topic)
            
            if not raw.strip():
                logger.warning(f"No material found for: {topic}")
                continue
            
            cleaned = self.summarize_text(raw)
            chunks = self.chunk_text(cleaned, target_tokens=140)
            
            if not chunks:
                continue
            
            subs = self.subtopic_labels(chunks, topic, k=min(4, max(1, len(chunks) // 2)))
            
            for chunk, sub in zip(chunks, subs):
                all_mcqs.extend(self.make_mcqs_from_chunk(chunk, topic_label=topic, subtopic=sub, source_tag=src_tag, max_q=3))
            
            # Limit questions per topic
            topic_mcqs = [q for q in all_mcqs if q["topic"] == topic]
            if len(topic_mcqs) > per_topic_q:
                by_sub = defaultdict(list)
                for q in topic_mcqs:
                    by_sub[q["subtopic"]].append(q)
                
                picked = []
                while len(picked) < per_topic_q and any(by_sub.values()):
                    for ksub in list(by_sub.keys()):
                        if by_sub[ksub] and len(picked) < per_topic_q:
                            picked.append(by_sub[ksub].pop(0))
                
                all_mcqs = [q for q in all_mcqs if q["topic"] != topic] + picked
        
        return all_mcqs
    
    def build_adaptive_quiz(self, mcq_bank: List[Dict], student_perf: Dict, total_q: int = 12, difficulty_mix=(0.3, 0.5, 0.2)) -> List[Dict]:
        """Build an adaptive quiz based on student performance"""
        if not mcq_bank:
            return []
        
        df = pd.DataFrame(mcq_bank)
        topics = df["topic"].unique().tolist()
        
        # Calculate topic weights based on performance
        weights = []
        for t in topics:
            acc = student_perf.get("topic", {}).get(t, {}).get("accuracy", 0.5)
            seen = student_perf.get("topic", {}).get(t, {}).get("seen", 0)
            novelty_boost = 1.0 if seen < 10 else 0.8
            w = (1.0 - acc) * novelty_boost + 0.1
            weights.append(max(w, 0.05))
        
        weights = np.array(weights) / (np.sum(weights) if np.sum(weights) > 0 else 1.0)
        
        # Calculate difficulty distribution
        n_easy = int(round(total_q * difficulty_mix[0]))
        n_med = int(round(total_q * difficulty_mix[1]))
        n_hard = total_q - n_easy - n_med
        
        df = df.reset_index().rename(columns={"index": "idx"})
        final = []
        
        for diff_lbl, n in [("easy", n_easy), ("medium", n_med), ("hard", n_hard)]:
            pool = df[df["difficulty"] == diff_lbl]
            if pool.empty:
                continue
            
            picks, used_idxs = 0, set()
            while picks < n and len(used_idxs) < len(pool):
                t = rng.choices(topics, weights=weights, k=1)[0]
                subset = pool[pool["topic"] == t]
                candidate_pool = subset if not subset.empty else pool
                
                if candidate_pool.empty:
                    break
                
                row = candidate_pool.sample(1, random_state=rng.randint(0, 10_000)).iloc[0]
                if row["idx"] in used_idxs:
                    continue
                
                final.append(row.to_dict())
                used_idxs.add(row["idx"])
                picks += 1
        
        return final

def main():
    """Main function for testing the quiz generator"""
    if len(sys.argv) < 2:
        print("Usage: python quiz_generator.py <topics_json>")
        sys.exit(1)
    
    try:
        topics = json.loads(sys.argv[1])
        generator = QuizGenerator()
        
        print("🔎 Building cold-start MCQ bank from multi-source internet text...")
        mcq_bank = generator.build_cold_start_quiz(topics, per_topic_q=8)
        
        print(f"✅ MCQ bank size: {len(mcq_bank)} questions across {len(set(q['topic'] for q in mcq_bank))} topics")
        
        # Output the results as JSON
        print(json.dumps(mcq_bank, indent=2))
        
    except Exception as e:
        logger.error(f"Error in main: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

