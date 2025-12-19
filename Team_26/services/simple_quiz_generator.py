#!/usr/bin/env python3
"""
Simplified Quiz Generation Service
Lightweight version that works without large ML models
"""

import sys
import os
import json
import re
import random
import logging
from collections import defaultdict, Counter
from typing import List, Dict, Tuple, Optional

# Add the current directory to Python path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import nltk
import requests
from bs4 import BeautifulSoup
import wikipediaapi

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Download NLTK data
try:
    for pkg in ['punkt', 'averaged_perceptron_tagger', 'stopwords']:
        try:
            nltk.download(pkg, quiet=True)
        except:
            pass
except Exception as e:
    logger.warning(f"Could not download NLTK data: {e}")

from nltk import pos_tag
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize

# Global variables
STOP = set(stopwords.words("english"))

class SimpleQuizGenerator:
    def __init__(self):
        """Initialize the simplified quiz generator"""
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'EduBotQuizGenerator/1.0 (Educational Purpose)'
        })
    
    def clean_text(self, text: str, char_limit: int = 4000) -> str:
        """Clean and limit text length"""
        text = re.sub(r"==+.*?==+", " ", text)
        text = re.sub(r"\[[0-9]+\]", " ", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text[:char_limit]
    
    def fetch_wiki(self, topic: str, char_limit: int = 4000) -> str:
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
    
    def fetch_web_content(self, topic: str) -> str:
        """Fetch content from web search using DuckDuckGo HTML interface"""
        try:
            # Use DuckDuckGo instant answers
            url = f"https://api.duckduckgo.com/?q={topic}&format=json&no_html=1&skip_disambig=1"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                content = []
                
                # Extract abstract
                if data.get('Abstract'):
                    content.append(data['Abstract'])
                
                # Extract definition
                if data.get('Definition'):
                    content.append(data['Definition'])
                
                # Extract related topics
                if data.get('RelatedTopics'):
                    for topic_info in data['RelatedTopics'][:3]:
                        if isinstance(topic_info, dict) and topic_info.get('Text'):
                            content.append(topic_info['Text'])
                
                return self.clean_text(" ".join(content), 2000)
        except Exception as e:
            logger.warning(f"Web content fetch error for {topic}: {e}")
        return ""
    
    def fetch_learning_material(self, topic: str) -> Tuple[str, str]:
        """Fetch learning material from multiple sources"""
        wiki_text = self.fetch_wiki(topic)
        web_text = self.fetch_web_content(topic)
        
        combined = " ".join([wiki_text, web_text]).strip()
        
        if wiki_text and web_text:
            src = "Wikipedia+Web"
        elif wiki_text:
            src = "Wikipedia"
        elif web_text:
            src = "Web"
        else:
            src = "Unknown"
        
        return combined, src
    
    def chunk_text(self, text: str, target_sentences: int = 3) -> List[str]:
        """Split text into chunks for processing"""
        sentences = sent_tokenize(text)
        chunks = []
        
        for i in range(0, len(sentences), target_sentences):
            chunk = " ".join(sentences[i:i + target_sentences])
            if len(chunk.strip()) > 50:  # Only include substantial chunks
                chunks.append(chunk)
        
        return chunks
    
    def extract_key_terms(self, text: str, top_k: int = 15) -> List[str]:
        """Extract key terms using POS tagging"""
        try:
            words = word_tokenize(text.lower())
            words = [w for w in words if w.isalpha() and w not in STOP and len(w) > 2]
            
            tagged = pos_tag(words)
            # Extract nouns, adjectives, and important terms
            key_terms = [w for w, pos in tagged if pos.startswith(('NN', 'JJ', 'VB'))]
            
            # Count frequency and return top terms
            term_counts = Counter(key_terms)
            return [term for term, count in term_counts.most_common(top_k)]
        except:
            # Fallback: simple word extraction
            words = re.findall(r'\b\w{3,}\b', text.lower())
            words = [w for w in words if w not in STOP]
            return list(set(words))[:top_k]
    
    def generate_question_from_text(self, text: str, topic: str) -> Optional[Dict]:
        """Generate a question from text chunk"""
        try:
            sentences = sent_tokenize(text)
            if len(sentences) < 2:
                return None
            
            # Find a sentence with key terms
            key_terms = self.extract_key_terms(text, 10)
            if not key_terms:
                return None
            
            # Select a sentence that contains key terms
            target_sentence = None
            for sentence in sentences:
                sentence_lower = sentence.lower()
                if any(term in sentence_lower for term in key_terms[:5]):
                    target_sentence = sentence
                    break
            
            if not target_sentence:
                target_sentence = sentences[0]
            
            # Find a key term to replace
            words = word_tokenize(target_sentence)
            tagged = pos_tag(words)
            
            # Look for nouns or adjectives to replace
            replaceable_terms = []
            for word, pos in tagged:
                if pos.startswith(('NN', 'JJ')) and word.lower() in key_terms:
                    replaceable_terms.append(word)
            
            if not replaceable_terms:
                return None
            
            # Select a term to replace
            answer = random.choice(replaceable_terms)
            
            # Create question by replacing the answer with blank
            question = target_sentence.replace(answer, "_____")
            
            # Generate distractors from other key terms
            distractors = [term for term in key_terms if term.lower() != answer.lower()][:3]
            
            # If we don't have enough distractors, generate some
            while len(distractors) < 3:
                # Add some common wrong answers
                wrong_answers = ["function", "system", "process", "method", "technique", "approach"]
                for wrong in wrong_answers:
                    if wrong not in distractors and wrong != answer.lower():
                        distractors.append(wrong)
                        break
                if len(distractors) >= 3:
                    break
            
            options = distractors[:3] + [answer]
            random.shuffle(options)
            
            # Determine difficulty based on sentence length and complexity
            if len(question.split()) <= 15:
                difficulty = "easy"
            elif len(question.split()) <= 25:
                difficulty = "medium"
            else:
                difficulty = "hard"
            
            return {
                "question": question,
                "options": options,
                "correctAnswer": answer,
                "topic": topic,
                "subtopic": f"{topic}::General",
                "difficulty": difficulty,
                "skill": "understand",
                "source": "generated"
            }
            
        except Exception as e:
            logger.warning(f"Error generating question: {e}")
            return None
    
    def build_cold_start_quiz(self, selected_topics: List[str], per_topic_q: int = 8) -> List[Dict]:
        """Build a quiz from scratch using web content"""
        all_mcqs = []
        
        for topic in selected_topics:
            logger.info(f"Processing topic: {topic}")
            raw, src_tag = self.fetch_learning_material(topic)
            
            if not raw.strip():
                logger.warning(f"No material found for: {topic}")
                continue
            
            chunks = self.chunk_text(raw, target_sentences=3)
            
            if not chunks:
                continue
            
            questions_generated = 0
            for chunk in chunks:
                if questions_generated >= per_topic_q:
                    break
                
                question = self.generate_question_from_text(chunk, topic)
                if question:
                    question["source"] = src_tag
                    all_mcqs.append(question)
                    questions_generated += 1
            
            logger.info(f"Generated {questions_generated} questions for {topic}")
        
        return all_mcqs
    
    def build_adaptive_quiz(self, mcq_bank: List[Dict], student_perf: Dict, total_q: int = 12, difficulty_mix=(0.3, 0.5, 0.2)) -> List[Dict]:
        """Build an adaptive quiz based on student performance"""
        if not mcq_bank:
            return []
        
        # Calculate topic weights based on performance
        topics = list(set(q["topic"] for q in mcq_bank))
        weights = []
        
        for topic in topics:
            acc = student_perf.get("topic", {}).get(topic, {}).get("accuracy", 0.5)
            seen = student_perf.get("topic", {}).get(topic, {}).get("seen", 0)
            novelty_boost = 1.0 if seen < 10 else 0.8
            w = (1.0 - acc) * novelty_boost + 0.1
            weights.append(max(w, 0.05))
        
        # Normalize weights
        total_weight = sum(weights)
        if total_weight > 0:
            weights = [w / total_weight for w in weights]
        else:
            weights = [1.0 / len(topics)] * len(topics)
        
        # Calculate difficulty distribution
        n_easy = int(round(total_q * difficulty_mix[0]))
        n_med = int(round(total_q * difficulty_mix[1]))
        n_hard = total_q - n_easy - n_med
        
        final = []
        used_questions = set()
        
        # Select questions by difficulty
        for diff_label, n in [("easy", n_easy), ("medium", n_med), ("hard", n_hard)]:
            pool = [q for q in mcq_bank if q["difficulty"] == diff_label]
            if not pool:
                # If no questions of this difficulty, use any available
                pool = [q for q in mcq_bank if q not in final]
            
            selected = 0
            while selected < n and pool:
                # Weighted topic selection
                selected_topic = random.choices(topics, weights=weights)[0]
                topic_pool = [q for q in pool if q["topic"] == selected_topic]
                
                if not topic_pool:
                    topic_pool = pool
                
                question = random.choice(topic_pool)
                if question not in final:
                    final.append(question)
                    selected += 1
                
                pool.remove(question)
        
        return final

def main():
    """Main function for testing the quiz generator"""
    if len(sys.argv) < 2:
        print("Usage: python simple_quiz_generator.py <topics_json> [per_topic_q]")
        sys.exit(1)
    
    try:
        # Try to read from file first, then from command line
        topics_json = sys.argv[1]
        if topics_json.endswith('.json'):
            with open(topics_json, 'r') as f:
                topics = json.load(f)
        else:
            topics = json.loads(topics_json)
        per_topic_q = 3
        if len(sys.argv) >= 3:
            try:
                per_topic_q = int(sys.argv[2])
            except:
                pass
        
        generator = SimpleQuizGenerator()
        
        print("Building cold-start MCQ bank from web content...")
        mcq_bank = generator.build_cold_start_quiz(topics, per_topic_q=per_topic_q)
        
        print(f"MCQ bank size: {len(mcq_bank)} questions across {len(set(q['topic'] for q in mcq_bank))} topics")
        
        # Output the results as JSON
        print(json.dumps(mcq_bank, indent=2))
        
    except Exception as e:
        logger.error(f"Error in main: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
