
import React, { useState } from 'react';
import { api } from './api.js';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('demo@fin.com');
  const [password, setPassword] = useState('demo123');
  const [name, setName] = useState('Deeksha');
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      let data;
      if (mode === 'login') data = await api.login(email, password);
      else data = await api.register(name, email, password);
      onLogin(data.user, data.token);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Fin Assistant</h1>
          <p>Manage, budget, and chat with your money AI.</p>
        </div>
        {error && <div className="error-message">{error}</div>}
        <form className="auth-form" onSubmit={submit}>
          {mode==='register' && (
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-control" value={name} onChange={e=>setName(e.target.value)} required />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          <button className="btn btn--primary btn--full-width" disabled={loading}>{loading?'Please wait...': (mode==='login'?'Login':'Create Account')}</button>
        </form>
        <div className="auth-divider"><span>or</span></div>
        <button className="btn btn--secondary btn--full-width" onClick={() => setMode(mode==='login'?'register':'login')}>
          {mode==='login' ? 'Create an account' : 'I already have an account'}
        </button>
        <div className="demo-credentials">
          <p>Tip: Create an account, then add some income & expenses.</p>
        </div>
      </div>
    </div>
  );
}
