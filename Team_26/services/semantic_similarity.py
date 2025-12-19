#!/usr/bin/env python3
"""
semantic_similarity.py

Compute embedding-based semantic similarity between query strings and a set of source passages.

Input (stdin): JSON object { "source_passages": [str], "queries": [str] }
Output (stdout): JSON object { "similarities": [float] } where each float is the max cosine
similarity between the query and any source passage (0.0-1.0). If sentence-transformers
is not available, the script will fall back to simple substring matching (1.0 if substring,
0.0 otherwise) and include a `fallback` flag in the output.

Requires: sentence-transformers (optional, recommended). Model used: all-MiniLM-L6-v2
"""

import sys
import json
import math

try:
    from sentence_transformers import SentenceTransformer, util
    ST = True
except Exception:
    ST = False


def log(msg: str):
    try:
        print(f"[semantic_similarity] {msg}", file=sys.stderr)
    except Exception:
        pass


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception as e:
        print(json.dumps({"error": f"failed to parse stdin: {e}"}))
        return

    sources = payload.get('source_passages') or []
    queries = payload.get('queries') or []

    if not isinstance(sources, list) or not isinstance(queries, list):
        print(json.dumps({"error": "source_passages and queries must be lists"}))
        return

    if ST:
        try:
            log('Loading sentence-transformers model all-MiniLM-L6-v2')
            model = SentenceTransformer('all-MiniLM-L6-v2')
            # Encode in batches
            src_emb = model.encode(sources, convert_to_tensor=True, show_progress_bar=False)
            qry_emb = model.encode(queries, convert_to_tensor=True, show_progress_bar=False)
            sims = util.cos_sim(qry_emb, src_emb)  # shape: (len(queries), len(sources))
            out = []
            for i in range(sims.shape[0]):
                row = sims[i]
                # convert to python floats and take max
                max_sim = float(row.max().cpu().item()) if hasattr(row, 'cpu') else float(max(row))
                # clamp between 0 and 1
                max_sim = max(0.0, min(1.0, max_sim))
                out.append(max_sim)
            print(json.dumps({"similarities": out, "fallback": False}))
            return
        except Exception as e:
            # fall through to fallback mode
            log(f"Model-based similarity failed: {e}")

    # Fallback: simple substring match (case-insensitive)
    out = []
    src_joined = ' '.join([s.lower() for s in sources if isinstance(s, str)])
    for q in queries:
        try:
            qstr = (q or '').strip().lower()
            if not qstr:
                out.append(0.0)
                continue
            if qstr in src_joined:
                out.append(1.0)
            else:
                out.append(0.0)
        except Exception:
            out.append(0.0)

    print(json.dumps({"similarities": out, "fallback": True}))


if __name__ == '__main__':
    main()
