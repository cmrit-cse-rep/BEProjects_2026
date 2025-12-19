#!/usr/bin/env python3
"""
advanced_quiz_generator.py

Lightweight, robust quiz generator that consumes scraped content (JSON via stdin or --text)
and emits a JSON array of question objects to stdout. The script favors pure-Python
heuristics but will use optional NLP libraries when available (nltk, sentence-transformers).

This file is intended to be invoked by Node services as a child process. It will never
raise ModuleNotFoundError: missing optional libs are handled gracefully.

Output: JSON array, each element with keys: stem, options (list), correctIndex (int), evidence,
        difficulty, confidence, generatedBy

Usage examples:
  echo '{"content": "Your text here"}' | python services/advanced_quiz_generator.py --max 5
  python services/advanced_quiz_generator.py --text "Your text here" --max 5

Recommended pip packages (optional): nltk, sentence-transformers
If you install nltk, run: python -c "import nltk; nltk.download('punkt'); nltk.download('averaged_perceptron_tagger')"
"""

import sys
import json
import re
import random
import argparse
from typing import List

# Try optional imports (handle absence gracefully)
try:
    import nltk
    from nltk.tokenize import sent_tokenize, word_tokenize
    from nltk import pos_tag
    NLTK_AVAILABLE = True
except Exception:
    NLTK_AVAILABLE = False

try:
    from sentence_transformers import SentenceTransformer, util
    ST_AVAILABLE = True
    # lazy-load model when needed
    _st_model = None
except Exception:
    ST_AVAILABLE = False
    _st_model = None


def log(msg: str):
    try:
        print(f"[advanced_quiz_generator] {msg}", file=sys.stderr)
    except Exception:
        pass

log(f"Starting generator. NLTK_AVAILABLE={NLTK_AVAILABLE}, ST_AVAILABLE={ST_AVAILABLE}")


def naive_sent_tokenize(text: str) -> List[str]:
    if NLTK_AVAILABLE:
        try:
            return sent_tokenize(text)
        except Exception:
            pass
    # fallback: split on sentence-ending punctuation
    s = re.split(r'(?<=[.!?])\s+', text)
    return [seg.strip() for seg in s if seg.strip()]


def extract_candidate_answers(sent: str) -> List[str]:
    """Return short candidate answer strings from a sentence.

    Heuristics used (in order):
    - numeric expressions (years, numbers, percentages)
    - capitalized multiword phrases (simple proper-noun heuristics)
    - nouns via NLTK POS tagging (if available)
    """
    candidates = []
    # numbers, years, percents
    nums = re.findall(r"\b\d{1,4}(?:[.,]\d+)?%?\b", sent)
    candidates.extend(nums)

    # capitalized phrase heuristic (2+ letters words)
    caps = re.findall(r"\b([A-Z][a-zA-Z0-9]{2,}(?:\s+[A-Z][a-zA-Z0-9]{2,})*)\b", sent)
    candidates.extend(caps)

    # NLTK-based nouns if available
    if NLTK_AVAILABLE:
        try:
            tokens = word_tokenize(sent)
            tags = pos_tag(tokens)
            nouns = [t for t, p in tags if p.startswith('NN')]
            candidates.extend(nouns)
        except Exception:
            pass

    # normalize and deduplicate, keep reasonable candidates (no interrogatives/pronouns)
    seen = set()
    out = []
    for c in candidates:
        c = c.strip()
        if len(c) <= 1:
            continue
        # filter out interrogative words and pronouns
        if c.lower() in {'what', 'which', 'how', 'why', 'when', 'where', 'who', 'whom', 'whose', 'it', 'they', 'this', 'these', 'those'}:
            continue
        key = c.lower()
        if key not in seen:
            seen.add(key)
            out.append(c)
    return out


def generate_distractors(answer: str, pool: List[str], max_d=3) -> List[str]:
    global _st_model
    # choose semantically similar or just other items from pool
    pool_candidates = [p for p in pool if p.lower() != answer.lower()]
    random.shuffle(pool_candidates)
    distractors = []
    # Quick pool-based distractors first (cheap)
    for p in pool_candidates:
        if len(distractors) >= max_d:
            break
        # avoid exact substring matches
        if answer.lower() in p.lower() or p.lower() in answer.lower():
            continue
        # avoid very short tokens
        if len(p) <= 2:
            continue
        distractors.append(p)

    # If sentence-transformers available, rank by embedding similarity (closer -> better distractor)
    if ST_AVAILABLE and _st_model is None:
        try:
            _st_model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception:
            _st_model = None

    if ST_AVAILABLE and _st_model is not None and pool_candidates:
        try:
            embeddings = _st_model.encode([answer] + pool_candidates, convert_to_tensor=True)
            sim = util.cos_sim(embeddings[0], embeddings[1:])[0]
            paired = list(zip(pool_candidates, sim.cpu().tolist() if hasattr(sim, 'cpu') else sim.tolist()))
            # prefer distractors that are moderately similar (not identical) -> score between 0.25 and 0.85
            paired = [(p, s) for p, s in paired if 0.25 <= s <= 0.85]
            paired.sort(key=lambda x: -x[1])
            chosen = [p for p, s in paired[:max_d]]
            if chosen:
                distractors = chosen
        except Exception:
            pass

    # If still not enough distractors, try to construct plausible ones
    def construct_from_answer(ans: str):
        parts = ans.split()
        if len(parts) > 1:
            # replace one token with a generic tech word or another token from pool
            substitutes = ['Protocol', 'Algorithm', 'Method', 'Structure', 'Technique', 'Model']
            new_opts = []
            for sub in substitutes:
                candidate = ' '.join(parts[:-1] + [sub])
                if candidate.lower() != ans.lower():
                    new_opts.append(candidate)
            return new_opts
        else:
            # single token, append common suffixes
            return [ans + ' Protocol', ans + ' Algorithm', ans + ' Method']

    idx = 0
    while len(distractors) < max_d and idx < len(pool_candidates):
        cand = pool_candidates[idx]
        if cand.lower() != answer.lower() and cand not in distractors:
            distractors.append(cand)
        idx += 1

    # Finally, try constructed distractors
    if len(distractors) < max_d:
        constructed = construct_from_answer(answer)
        for c in constructed:
            if len(distractors) >= max_d:
                break
            if c not in distractors and c.lower() != answer.lower():
                distractors.append(c)

    # As last resort, add generic options
    generic_pool = ['None of the above', 'All of the above', 'Not applicable']
    for g in generic_pool:
        if len(distractors) >= max_d:
            break
        if g not in distractors:
            distractors.append(g)

    return distractors


def generate_questions_from_text(text: str, max_questions: int = 10) -> List[dict]:
    sents = naive_sent_tokenize(text)
    log(f"Tokenized into {len(sents)} sentences")
    pool = []
    for s in sents:
        pool += extract_candidate_answers(s)
    log(f"Extracted {len(pool)} candidate answers (pre-unique)")
    # unique pool
    pool = list(dict.fromkeys([p for p in pool if len(p) > 0]))
    log(f"Unique candidate pool size: {len(pool)}")

    questions = []
    for s in sents:
        # ignore very short sentences
        if len(s.strip()) < 20:
            continue
        # Skip sentences that start with pronouns without resolvable noun
        if re.match(r'^(it|this|these|they|he|she)\b', s.strip().lower()):
            log(f"Skipping pronoun-led sentence: {s[:40]}...")
            continue

        # Special-case patterns (e.g., 'X stands for Y', 'X is used for Y') to produce better stems
        m = re.search(r"\b([A-Za-z0-9\-]{2,})\s+stands for\s+(.+?)(?:[.?!]|$)", s, flags=re.I)
        if m:
            abbr = m.group(1).strip()
            expansion = m.group(2).strip().rstrip('.')
            answer = expansion
            stem = f"What does {abbr} stand for?"
            distractors = generate_distractors(answer, pool, max_d=3)
        else:
            candidates = extract_candidate_answers(s)
            log(f"Sentence: {s[:80]}... candidates: {candidates}")
            if not candidates:
                continue
            # If embeddings are available, score candidates by semantic closeness to the sentence
            answer = None
            if ST_AVAILABLE and _st_model is None:
                try:
                    _st_model = SentenceTransformer('all-MiniLM-L6-v2')
                except Exception:
                    _st_model = None

            if ST_AVAILABLE and _st_model is not None:
                try:
                    # encode sentence and candidates
                    cand_texts = candidates
                    enc = _st_model.encode([s] + cand_texts, convert_to_tensor=True)
                    sims = util.cos_sim(enc[0], enc[1:])[0]
                    sims_list = sims.cpu().tolist() if hasattr(sims, 'cpu') else sims.tolist()
                    # pair candidate with score
                    paired = list(zip(cand_texts, sims_list))
                    # prefer candidates with higher sim and multi-word
                    paired.sort(key=lambda x: (-len(x[0].split()), -x[1], -len(x[0])))
                    answer = paired[0][0]
                except Exception:
                    answer = None

            # Fallback heuristic selection
            if not answer:
                # pick the most descriptive candidate (prefer multi-word, longer tokens)
                candidates.sort(key=lambda x: (-len(x.split()), -len(x)))
                answer = candidates[0]

            # avoid short function words accidentally picked
            if len(answer) <= 3 or re.match(r'^[^a-zA-Z0-9]+$', answer):
                log(f"Rejected short/invalid candidate answer: {answer}")
                continue
            # create a cloze or definition question
            if re.search(r'\b(is|are|refers to|means|describes|defines)\b', s, flags=re.I):
                # turn into definition question
                stem = f"What is {answer}?"
            else:
                # cloze-style
                stem = s.replace(answer, '_____') if answer in s else f"Which of the following best describes {answer}?"
            distractors = generate_distractors(answer, pool, max_d=3)
            # build options and confidence score
            options = [answer] + distractors
            # ensure options are unique and sane length
            uniq_opts = []
            for o in options:
                if o and o not in uniq_opts:
                    uniq_opts.append(o)
            # if not enough options, pad with constructed distractors
            if len(uniq_opts) < 4:
                more = generate_distractors(answer, pool + uniq_opts, max_d=4 - len(uniq_opts))
                for m in more:
                    if m not in uniq_opts:
                        uniq_opts.append(m)

            random.shuffle(uniq_opts)
            correct_index = uniq_opts.index(answer) if answer in uniq_opts else 0

            # Confidence: if embeddings available, base on candidate-sentence sim; otherwise default
            confidence = 0.6
            try:
                if ST_AVAILABLE and _st_model is not None:
                    enc = _st_model.encode([s, answer], convert_to_tensor=True)
                    simv = float(util.cos_sim(enc[0], enc[1]).cpu().item())
                    confidence = max(0.3, min(0.98, 0.4 + simv * 0.6))
            except Exception:
                pass

            q = {
                'stem': stem,
                'options': uniq_opts,
                'correctIndex': correct_index,
                'evidence': s,
                'difficulty': 'medium',
                'confidence': round(confidence, 3),
                'generatedBy': 'advanced_quiz_generator.py'
            }
        questions.append(q)
        if len(questions) >= max_questions:
            break

    log(f"Generated {len(questions)} questions")
    return questions


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--text', help='Raw content text')
    parser.add_argument('--max', type=int, default=10, help='Max questions to generate')
    args = parser.parse_args()

    data = None
    # Prefer JSON from stdin if present
    if not sys.stdin.isatty():
        try:
            data = json.load(sys.stdin)
        except Exception:
            data = None

    raw = ''
    if args.text:
        raw = args.text
    elif data:
        # common keys used by ingestion: 'content', 'transcript', 'chunks'
        if isinstance(data, dict):
            if 'content' in data and isinstance(data['content'], str):
                raw = data['content']
            elif 'transcript' in data and isinstance(data['transcript'], str):
                raw = data['transcript']
            elif 'chunks' in data and isinstance(data['chunks'], list):
                raw = ' '.join([c for c in data['chunks'] if isinstance(c, str)])
            else:
                # last resort: stringify
                raw = json.dumps(data)
        else:
            raw = str(data)

    if not raw or len(raw.strip()) == 0:
        log('No raw content received; outputting empty array')
        # output empty JSON array so Node caller can parse
        print('[]')
        return

    questions = generate_questions_from_text(raw, max_questions=args.max)
    # ensure valid JSON array output
    log(f"Outputting {len(questions)} questions as JSON")
    print(json.dumps(questions, ensure_ascii=False))


if __name__ == '__main__':
    main()
