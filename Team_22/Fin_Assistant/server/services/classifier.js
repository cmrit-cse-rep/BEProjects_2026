
import fetch from 'node-fetch';
import { ruleBasedCategory, parseUpiLike } from '../utils/nlp.js';

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

export async function classifyTransaction(text, amountHint=null) {
  try {
    const upi = parseUpiLike(text || '');
    const payload = { text, amount: amountHint ?? upi.amount ?? null, merchant: upi.merchant || '' };
    // Try ML first
    const res = await fetch(`${ML_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      timeout: 1000
    });
    if (res.ok) {
      const data = await res.json();
      return { category: data.category, confidence: data.confidence, merchant: payload.merchant || data.merchant || '' };
    }
  } catch(e) {
    // ignore, will fallback
  }
  // Fallback to rules
  const cat = ruleBasedCategory(text);
  return { category: cat, confidence: 0.6 };
}
