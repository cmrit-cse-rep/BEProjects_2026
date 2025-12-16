
import Transaction from '../models/Transaction.js';
import { monthKey } from '../utils/nlp.js';

/**
 * Dynamic budget allocation:
 * - Start with 50/30/20 baseline (Needs/Wants/Saving).
 * - Use last 3 months category averages to adjust caps.
 * - Constrain so sum(caps) <= income; allocate remainder to Savings.
 */
export async function generateDynamicBudget(userId, income, targetMonth = monthKey()) {
  const start = new Date(targetMonth + '-01T00:00:00Z');
  const histStart = new Date(start); 
  histStart.setMonth(histStart.getMonth()-3);

  // 1) Fetch last 3 months of expenses
  const agg = await Transaction.aggregate([
    { $match: { userId, type: 'expense', date: { $gte: histStart, $lt: start } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } }
  ]);

  const history = Object.fromEntries(agg.map(a => [a._id, a.total/3])); // monthly avg

  // 2) Baseline 50/30/20 style allocation (but broken down by category)
  const baseline = {
    'Food': 0.12,
    'Groceries': 0.10,
    'Transport': 0.08,
    'Bills': 0.12,
    'Shopping': 0.08,
    'Health': 0.05,
    'Entertainment': 0.05,
    'Education': 0.05,
    'Other': 0.05,
    'Savings': 0.30
  };

  // 3) Blend baseline % of income with last 3 months average spending
  const caps = {};
  let allocated = 0;
  for (const [cat, pct] of Object.entries(baseline)) {
    if (cat === 'Savings') continue;
    const hist = history[cat] || 0;
    const cap = Math.max(0, 0.6 * (pct*income) + 0.4 * hist); // blend
    caps[cat] = Math.round(cap);
    allocated += caps[cat];
  }

  // 4) Whatever is left over → Savings
  const savings = Math.max(0, Math.round(income - allocated));
  caps['Savings'] = savings;

  return caps;
}
