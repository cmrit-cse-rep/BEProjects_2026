
export function tokenize(text='') {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s₹\./-]/g,' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function parseUpiLike(text='') {
  // Extract ₹ or Rs amounts and common merchants
  const amtMatch = text.match(/(?:₹|rs\.?\s*)([0-9]+(?:\.[0-9]{1,2})?)/i);
  const amount = amtMatch ? parseFloat(amtMatch[1]) : null;

  // Very light merchant grab: first capitalized token or common brands
  const known = ['zomato','swiggy','amazon','flipkart','ola','uber','rapido','blinkit','bigbasket','paytm','phonepe','irctc','makeMyTrip','airtel','jio','vi','ikea','lenskart','mcdonalds','kfc','dominos'];
  const lower = text.toLowerCase();
  let merchant = '';
  for (const k of known) if (lower.includes(k)) { merchant = k.toUpperCase(); break; }
  if (!merchant) {
    const cap = text.match(/\b([A-Z][a-zA-Z]{2,})\b/);
    if (cap) merchant = cap[1];
  }
  return { amount, merchant };
}

export const CATEGORY_RULES = [
  { cat: 'Food', keys: ['zomato','swiggy','restaurant','cafe','food','meal','dinner','lunch','groceries','bigbasket','blinkit','dominos','kfc','mcdonalds'] },
  { cat: 'Groceries', keys: ['grocery','grocer','vegetable','bigbasket','blinkit','supermarket','mart'] },
  { cat: 'Transport', keys: ['uber','ola','rapido','metro','bus','train','fuel','petrol','diesel','cab','auto','parking','toll','irctc'] },
  { cat: 'Shopping', keys: ['amazon','flipkart','myntra','ajio','ikea','lenskart','laptop','phone','electronics','clothes','fashion'] },
  { cat: 'Bills', keys: ['electricity','water','gas','wifi','broadband','dth','airtel','jio','vi','rent','maintenance','recharge'] },
  { cat: 'Health', keys: ['pharmacy','medical','hospital','clinic','doctor','lab','medicine'] },
  { cat: 'Entertainment', keys: ['movie','netflix','hotstar','zee5','bookmyshow','concert','event'] },
  { cat: 'Education', keys: ['tuition','fees','course','udemy','coursera','books','exam'] },
  { cat: 'Income', keys: ['salary','stipend','refund','reimbursement','interest','dividend'] },
];

export function ruleBasedCategory(text='') {
  const t = text.toLowerCase();
  for (const r of CATEGORY_RULES) {
    if (r.keys.some(k => t.includes(k))) return r.cat;
  }
  return 'Uncategorized';
}

export function monthKey(d = new Date()) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
}
