import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import './AuthPage.css';

type AuthMode = 'login' | 'register' | 'forgot';

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const reset = () => { setError(''); setSuccess(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setLoading(true);

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError('Nesprávný email nebo heslo.');
    } else if (mode === 'register') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError('Registrace se nezdařila: ' + error.message);
      else setSuccess('Účet vytvořen! Zkontroluj email pro potvrzení.');
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}`,
      });
      if (error) setError('Nepodařilo se odeslat email: ' + error.message);
      else setSuccess('Email s odkazem pro obnovu hesla byl odeslán.');
    }

    setLoading(false);
  };

  const goToMode = (m: AuthMode) => { setMode(m); reset(); };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">♻</span>
          <div>
            <div className="auth-logo-name">RegionFlow</div>
            <div className="auth-logo-sub">Správa výkupů</div>
          </div>
        </div>

        {mode !== 'forgot' && (
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => goToMode('login')}
            >Přihlášení</button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => goToMode('register')}
            >Registrace</button>
          </div>
        )}

        {mode === 'forgot' && (
          <div className="auth-forgot-header">
            <button className="auth-back" onClick={() => goToMode('login')}>← Zpět</button>
            <h2 className="auth-forgot-title">Zapomenuté heslo</h2>
            <p className="auth-forgot-hint">Zašleme Vám odkaz pro obnovu hesla.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vas@email.cz"
              required
              autoFocus
            />
          </div>
          {mode !== 'forgot' && (
            <div className="form-field">
              <label>Heslo</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading
              ? 'Chvíli strpení...'
              : mode === 'login'
                ? 'Přihlásit se'
                : mode === 'register'
                  ? 'Vytvořit účet'
                  : 'Odeslat odkaz'}
          </button>

          {mode === 'login' && !success && (
            <button type="button" className="auth-forgot-link" onClick={() => goToMode('forgot')}>
              Zapomenuté heslo?
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
