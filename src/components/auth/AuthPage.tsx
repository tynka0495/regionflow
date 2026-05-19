import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../lib/LanguageContext';
import { t } from '../../lib/i18n';
import './AuthPage.css';

type AuthMode = 'login' | 'register' | 'forgot';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthPage() {
  const lang = useLanguage();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');

  const clearError = (field: string) =>
    setErrors(prev => ({ ...prev, [field]: '' }));

  const reset = () => { setErrors({}); setSuccess(''); };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!email.trim()) {
      e.email = t('auth_err_email_required', lang);
    } else if (!EMAIL_RE.test(email)) {
      e.email = t('auth_err_email_invalid', lang);
    }
    if (mode !== 'forgot') {
      if (!password) {
        e.password = t('auth_err_password_required', lang);
      } else if (password.length < 6) {
        e.password = t('auth_err_password_short', lang);
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    if (!validate()) return;
    setLoading(true);

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErrors({ email: ' ', password: t('auth_err_wrong', lang) });
    } else if (mode === 'register') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setErrors({ email: t('auth_err_register', lang) + error.message });
      else setSuccess(t('auth_success_register', lang));
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}`,
      });
      if (error) setErrors({ email: t('auth_err_forgot', lang) + error.message });
      else setSuccess(t('auth_success_forgot', lang));
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
            <div className="auth-logo-sub">{t('auth_logo_sub', lang)}</div>
          </div>
        </div>

        {mode !== 'forgot' && (
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => goToMode('login')}
            >{t('auth_tab_login', lang)}</button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => goToMode('register')}
            >{t('auth_tab_register', lang)}</button>
          </div>
        )}

        {mode === 'forgot' && (
          <div className="auth-forgot-header">
            <button className="auth-back" onClick={() => goToMode('login')}>{t('auth_back', lang)}</button>
            <h2 className="auth-forgot-title">{t('auth_forgot_title', lang)}</h2>
            <p className="auth-forgot-hint">{t('auth_forgot_hint', lang)}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-field">
            <label>{t('auth_email', lang)}</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); clearError('email'); }}
              placeholder={t('auth_email_ph', lang)}
              className={errors.email && errors.email.trim() ? 'error' : ''}
              autoFocus
            />
            {errors.email && errors.email.trim() && (
              <span className="field-error">{errors.email}</span>
            )}
          </div>

          {mode !== 'forgot' && (
            <div className="form-field">
              <label>{t('auth_password', lang)}</label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); clearError('password'); }}
                placeholder="••••••••"
                className={errors.password ? 'error' : ''}
              />
              {errors.password && (
                <span className="field-error">{errors.password}</span>
              )}
            </div>
          )}

          {success && <div className="auth-success">{success}</div>}

          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading
              ? t('auth_loading', lang)
              : mode === 'login'
                ? t('auth_submit_login', lang)
                : mode === 'register'
                  ? t('auth_submit_register', lang)
                  : t('auth_submit_forgot', lang)}
          </button>

          {mode === 'login' && !success && (
            <button type="button" className="auth-forgot-link" onClick={() => goToMode('forgot')}>
              {t('auth_forgot_link', lang)}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
