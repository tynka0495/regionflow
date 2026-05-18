import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Layout } from '../layout/Layout';
import { useLanguage } from '../../lib/LanguageContext';
import { t } from '../../lib/i18n';
import type { UserSettings } from '../../types';
import './SettingsSection.css';

const ACCENT_COLORS = [
  { label: 'Indigo',   value: '#4f46e5', hover: '#4338ca' },
  { label: 'Violet',   value: '#7c3aed', hover: '#6d28d9' },
  { label: 'Sky',      value: '#0284c7', hover: '#0369a1' },
  { label: 'Emerald',  value: '#059669', hover: '#047857' },
  { label: 'Rose',     value: '#e11d48', hover: '#be123c' },
  { label: 'Amber',    value: '#d97706', hover: '#b45309' },
];

export const DEFAULT_SMS_TEMPLATE = 'Dobrý den, oznamujeme Vám nový výkup materiálů dne {datum}. Těšíme se na vaši spolupráci. Tým RegionFlow';

interface SettingsSectionProps {
  settings: UserSettings;
  onUpdateSettings: (updates: Partial<UserSettings>) => Promise<void>;
}

export function SettingsSection({ settings, onUpdateSettings }: SettingsSectionProps) {
  const lang = useLanguage();

  const [smsTemplate, setSmsTemplate] = useState(settings.smsTemplate ?? DEFAULT_SMS_TEMPLATE);
  const [smsSaved, setSmsSaved] = useState(false);
  const [smsSaving, setSmsSaving] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (settings.smsTemplate !== undefined) setSmsTemplate(settings.smsTemplate);
  }, [settings.smsTemplate]);

  const previewDate = new Date().toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
  const preview = smsTemplate.replace('{datum}', previewDate);

  const handleSmsSave = async () => {
    setSmsSaving(true);
    await onUpdateSettings({ smsTemplate });
    setSmsSaving(false);
    setSmsSaved(true);
    setTimeout(() => setSmsSaved(false), 2000);
  };

  const handleSmsReset = async () => {
    setSmsTemplate(DEFAULT_SMS_TEMPLATE);
    await onUpdateSettings({ smsTemplate: DEFAULT_SMS_TEMPLATE });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (newPassword !== confirmPassword) { setPwError(t('settings_pw_err_match', lang)); return; }
    if (newPassword.length < 6) { setPwError(t('settings_pw_err_short', lang)); return; }
    setPwLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { setPwError(t('settings_pw_err_user', lang)); setPwLoading(false); return; }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: oldPassword });
    if (signInError) { setPwError(t('settings_pw_err_wrong', lang)); setPwLoading(false); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPwError(error.message);
    } else {
      setPwSuccess(t('settings_pw_success', lang));
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setPwLoading(false);
  };

  const activeAccent = settings.accentColor ?? '#4f46e5';

  return (
    <Layout title={t('settings_title', lang)} subtitle={t('settings_subtitle', lang)}>
      <div className="settings-wrapper">

        <div className="settings-card card">
          <div className="settings-card-header">
            <div className="settings-card-icon">✉</div>
            <div>
              <h3>{t('settings_sms_title', lang)}</h3>
              <p>{t('settings_sms_hint', lang)}</p>
            </div>
          </div>
          <textarea
            className="settings-sms-textarea"
            value={smsTemplate}
            onChange={e => { setSmsTemplate(e.target.value); setSmsSaved(false); }}
            rows={4}
            maxLength={320}
          />
          <div className="settings-sms-preview-label">{t('settings_sms_preview', lang)}</div>
          <div className="settings-sms-preview">{preview}</div>
          <div className="settings-sms-actions">
            <button className="btn-secondary" onClick={handleSmsReset}>{t('settings_sms_reset', lang)}</button>
            <button className="btn-primary" onClick={handleSmsSave} disabled={smsSaving}>
              {smsSaved ? t('settings_sms_saved', lang) : smsSaving ? t('settings_sms_saving', lang) : t('settings_sms_save', lang)}
            </button>
          </div>
        </div>

        <div className="settings-card card">
          <div className="settings-card-header">
            <div className="settings-card-icon">🎨</div>
            <div>
              <h3>{t('settings_appearance_title', lang)}</h3>
              <p>{t('settings_appearance_hint', lang)}</p>
            </div>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-label">{t('settings_dark_label', lang)}</div>
              <div className="settings-hint">{t('settings_dark_hint', lang)}</div>
            </div>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.darkMode ?? false}
                onChange={e => onUpdateSettings({ darkMode: e.target.checked })}
              />
              <span className="settings-toggle-track" />
            </label>
          </div>
          <div className="settings-divider" />
          <div>
            <div className="settings-label">{t('settings_color_label', lang)}</div>
            <div className="settings-hint">{t('settings_color_hint', lang)}</div>
            <div className="settings-colors">
              {ACCENT_COLORS.map(c => (
                <button
                  key={c.value}
                  className={`settings-color-swatch ${activeAccent === c.value ? 'active' : ''}`}
                  style={{ background: c.value }}
                  title={c.label}
                  onClick={() => onUpdateSettings({ accentColor: c.value })}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="settings-card card">
          <div className="settings-card-header">
            <div className="settings-card-icon">🌐</div>
            <div>
              <h3>{t('settings_lang_title', lang)}</h3>
              <p>{t('settings_lang_hint', lang)}</p>
            </div>
          </div>
          <div className="settings-lang-body">
            {(['cs', 'en'] as const).map(l => (
              <button
                key={l}
                className={`settings-lang-btn ${(settings.language ?? 'cs') === l ? 'active' : ''}`}
                onClick={() => onUpdateSettings({ language: l })}
              >
                {l === 'cs' ? '🇨🇿 Čeština' : '🇬🇧 English'}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-card card">
          <div className="settings-card-header">
            <div className="settings-card-icon">🔒</div>
            <div>
              <h3>{t('settings_pw_title', lang)}</h3>
              <p>{t('settings_pw_hint', lang)}</p>
            </div>
          </div>
          <form className="settings-pw-form" onSubmit={handlePasswordChange}>
            <div className="form-field">
              <label>{t('settings_pw_old', lang)}</label>
              <input
                type="password"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="form-field">
              <label>{t('settings_pw_new', lang)}</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="form-field">
              <label>{t('settings_pw_confirm', lang)}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            {pwError && <div className="settings-error">{pwError}</div>}
            {pwSuccess && <div className="settings-success">{pwSuccess}</div>}
            <div className="settings-pw-actions">
              <button type="submit" className="btn-primary" disabled={pwLoading}>
                {pwLoading ? t('settings_pw_changing', lang) : t('settings_pw_change', lang)}
              </button>
            </div>
          </form>
        </div>

      </div>
    </Layout>
  );
}
