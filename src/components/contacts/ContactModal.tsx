import { useState, useEffect, useRef } from 'react';
import type { Contact, RegionCode, Country } from '../../types';
import { regionsOf, EU_COUNTRIES } from '../../types';
import { useLanguage } from '../../lib/LanguageContext';
import { t } from '../../lib/i18n';
import './ContactModal.css';

interface ContactModalProps {
  contact?: Contact;
  allMaterials: string[];
  onAddMaterial: (material: string) => void;
  onSave: (contact: Contact) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  emailEnabled: false,
  country: 'CZ' as Country,
  region: '' as RegionCode | '',
  euCountry: '',
  city: '',
  street: '',
  materials: [] as string[],
  smsEnabled: false,
};

export function ContactModal({ contact, allMaterials, onAddMaterial, onSave, onDelete, onClose }: ContactModalProps) {
  const lang = useLanguage();
  const isEdit = !!contact;
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newMaterial, setNewMaterial] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const newMaterialRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (contact) {
      setForm({
        name: contact.name,
        phone: contact.phone,
        email: contact.email ?? '',
        emailEnabled: contact.emailEnabled ?? false,
        country: contact.country,
        region: contact.region ?? '',
        euCountry: contact.euCountry ?? '',
        city: contact.city,
        street: contact.street,
        materials: contact.materials,
        smsEnabled: contact.smsEnabled,
      });
    }
  }, [contact]);

  useEffect(() => {
    if (showNewInput) newMaterialRef.current?.focus();
  }, [showNewInput]);

  const set = <K extends keyof typeof EMPTY_FORM>(key: K, value: typeof EMPTY_FORM[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const toggleMaterial = (m: string) => {
    setForm(prev => ({
      ...prev,
      materials: prev.materials.includes(m)
        ? prev.materials.filter(x => x !== m)
        : [...prev.materials, m],
    }));
    setErrors(prev => ({ ...prev, materials: '' }));
  };

  const handleAddNewMaterial = () => {
    const name = newMaterial.trim().toLowerCase();
    if (!name) return;
    if (!allMaterials.includes(name)) {
      onAddMaterial(name);
    }
    setForm(prev => ({
      ...prev,
      materials: prev.materials.includes(name) ? prev.materials : [...prev.materials, name],
    }));
    setNewMaterial('');
    setShowNewInput(false);
    setErrors(prev => ({ ...prev, materials: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t('err_name', lang);
    if (!form.phone.trim()) e.phone = t('err_phone', lang);
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = t('err_email', lang);
    if (!form.city.trim()) e.city = t('err_city', lang);
    if (form.country === 'EU' && !form.euCountry) e.euCountry = t('err_eu_country', lang);
    if (form.country !== 'EU' && !form.region) e.region = t('err_region', lang);
    if (form.materials.length === 0) e.materials = t('err_materials', lang);
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      id: contact?.id ?? crypto.randomUUID(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      emailEnabled: !!form.email.trim() && form.emailEnabled,
      country: form.country,
      region: form.country === 'EU' ? undefined : (form.region as RegionCode),
      euCountry: form.country === 'EU' ? form.euCountry : undefined,
      city: form.city.trim(),
      street: form.street.trim(),
      materials: form.materials,
      smsEnabled: form.smsEnabled,
    });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{isEdit ? t('modal_edit_contact', lang) : t('modal_new_contact', lang)}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-field">
                <label>{t('field_name', lang)}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Jan Novák"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>
              <div className="form-field">
                <label>{t('field_phone', lang)}</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="+420 602 123 456"
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>
            </div>

            <div className="form-field">
              <label>{t('field_email', lang)}</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="jan.novak@seznam.cz"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>{t('field_country', lang)}</label>
                <select
                  value={form.country}
                  onChange={e => {
                    set('country', e.target.value as Country);
                    set('region', '');
                    set('euCountry', '');
                  }}
                >
                  <option value="CZ">{t('filter_cz', lang)}</option>
                  <option value="SK">{t('filter_sk', lang)}</option>
                  <option value="EU">{t('filter_eu', lang)}</option>
                </select>
              </div>

              {form.country === 'EU' ? (
                <div className="form-field">
                  <label>{t('field_state', lang)}</label>
                  <select
                    value={form.euCountry}
                    onChange={e => set('euCountry', e.target.value)}
                    className={errors.euCountry ? 'error' : ''}
                  >
                    <option value="">{t('field_state_ph', lang)}</option>
                    {EU_COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                  {errors.euCountry && <span className="field-error">{errors.euCountry}</span>}
                </div>
              ) : (
                <div className="form-field">
                  <label>{t('field_region', lang)}</label>
                  <select
                    value={form.region}
                    onChange={e => set('region', e.target.value as RegionCode)}
                    className={errors.region ? 'error' : ''}
                  >
                    <option value="">{t('field_region_ph', lang)}</option>
                    {regionsOf(form.country).map(r => (
                      <option key={r.code} value={r.code}>{r.name}</option>
                    ))}
                  </select>
                  {errors.region && <span className="field-error">{errors.region}</span>}
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>{t('field_city', lang)}</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                  placeholder="Brno"
                  className={errors.city ? 'error' : ''}
                />
                {errors.city && <span className="field-error">{errors.city}</span>}
              </div>
              <div className="form-field">
                <label>{t('field_street', lang)}</label>
                <input
                  type="text"
                  value={form.street}
                  onChange={e => set('street', e.target.value)}
                  placeholder="Náměstí Svobody 1"
                />
              </div>
            </div>

            <div className="form-field">
              <label>
                {t('field_materials', lang)}
                {errors.materials && <span className="field-error">{errors.materials}</span>}
              </label>
              <div className="materials-grid">
                {allMaterials.map(m => (
                  <label key={m} className={`material-checkbox ${form.materials.includes(m) ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={form.materials.includes(m)}
                      onChange={() => toggleMaterial(m)}
                    />
                    {m}
                  </label>
                ))}

                {showNewInput ? (
                  <div className="new-material-input">
                    <input
                      ref={newMaterialRef}
                      type="text"
                      value={newMaterial}
                      onChange={e => setNewMaterial(e.target.value)}
                      placeholder={t('mat_new_ph', lang)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); handleAddNewMaterial(); }
                        if (e.key === 'Escape') { setShowNewInput(false); setNewMaterial(''); }
                      }}
                    />
                    <button type="button" className="new-material-confirm" onClick={handleAddNewMaterial}>✓</button>
                    <button type="button" className="new-material-cancel" onClick={() => { setShowNewInput(false); setNewMaterial(''); }}>✕</button>
                  </div>
                ) : (
                  <button type="button" className="add-material-btn" onClick={() => setShowNewInput(true)}>
                    {t('mat_add_new', lang)}
                  </button>
                )}
              </div>
            </div>

            <label className="sms-toggle">
              <input
                type="checkbox"
                checked={form.smsEnabled}
                onChange={e => set('smsEnabled', e.target.checked)}
              />
              <span className="sms-toggle-track" />
              <span className="sms-toggle-label">{t('field_sms_toggle', lang)}</span>
            </label>

            <label className="sms-toggle">
              <input
                type="checkbox"
                checked={form.emailEnabled}
                disabled={!form.email.trim()}
                onChange={e => set('emailEnabled', e.target.checked)}
              />
              <span className="sms-toggle-track" />
              <span className="sms-toggle-label">{t('field_email_toggle', lang)}</span>
            </label>
          </div>

          <div className="modal-footer">
            {isEdit && onDelete && (
              confirmDelete ? (
                <div className="footer-confirm">
                  <span className="footer-confirm-text">{t('btn_delete_confirm', lang)}</span>
                  <button type="button" className="btn-secondary" onClick={() => setConfirmDelete(false)}>{t('btn_no', lang)}</button>
                  <button type="button" className="btn-danger" onClick={() => { onDelete(); onClose(); }}>{t('btn_delete', lang)}</button>
                </div>
              ) : (
                <button type="button" className="btn-delete-inline" onClick={() => setConfirmDelete(true)}>
                  {t('btn_delete_contact', lang)}
                </button>
              )
            )}
            {!confirmDelete && (
              <div className="footer-actions">
                <button type="button" className="btn-secondary" onClick={onClose}>{t('btn_cancel', lang)}</button>
                <button type="submit" className="btn-primary">
                  {isEdit ? t('btn_save', lang) : t('btn_add_contact', lang)}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
