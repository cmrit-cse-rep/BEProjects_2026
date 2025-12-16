
import React, { useState } from 'react';
import { api } from './api.js';

export default function Chatbot({ user }) {
  const [msgs, setMsgs] = useState([{ from: 'bot', text: 'Hi! Ask me about your spending, savings, or budgets.' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input) return;
    const my = { from: 'me', text: input };
    setMsgs(m => [...m, my]);
    setLoading(true);
    try {
      const r = await api.chat(user._id, input);
      setMsgs(m => [...m, { from: 'bot', text: r.reply }]);
    } finally {
      setLoading(false);
    }
    setInput('');
  };

  return (
    <section className="section active">
      <div className="section-header">
        <h1>Chatbot</h1>
        <p className="text-secondary">NLP‑powered personal finance chat</p>
      </div>

      <div className="card">
        <div className="card__body">
          <div style={{ maxHeight: 400, overflow: 'auto', marginBottom: 16 }}>
            {msgs.map((m, i) => (
              <div key={i} className={"insight-item " + (m.from==='me'?'indian-category':'')}>
                <div className="insight-icon">{m.from==='me' ? '🧑‍💻' : '🤖'}</div>
                <div>{m.text}</div>
              </div>
            ))}
            {loading && (
              <div className="insight-item">
                <div className="insight-icon">🤖</div>
                <div>Typing…</div>
              </div>
            )}
          </div>
          <div className="form-row" style={{ gridTemplateColumns: '1fr auto' }}>
            <input className="form-control" placeholder="e.g., How much did I spend on Food this month?" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') send(); }} />
            <button className="btn btn--primary" onClick={send} disabled={loading}>Send</button>
          </div>
          <div className="insights-grid" style={{ marginTop: 12 }}>
            {["What's my budget status this month?","How much can I safely spend per day?","Compare my spending to last month.","How should I invest my money?","How much did I spend on Food this month?"].map((q,i)=> (
              <button key={i} className="btn btn--secondary" onClick={()=>{ setInput(q); setTimeout(send, 0); }}>
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
