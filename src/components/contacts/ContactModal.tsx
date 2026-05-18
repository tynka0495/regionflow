import { useState, useEffect, useRef } from 'react';
import type { Contact, RegionCode, Country } from '../../types';
import { REGIONS } from '../../types';
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
  country: 'CZ' as Country,
  region: '' as RegionCode | '',
  euCountry: '',
  city: '',
  street: '',
  materials: [] as string[],
  smsEnabled: false,
};

export function ContactModal({ contact, allMaterials, onAddMaterial, onSave, onDelete, onClose }: ContactModalProps) {
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
    if (!form.name.trim()) e.name = 'Jméno je povinné';
    if (!form.phone.trim()) e.phone = 'Telefon je povinný';
    if (!form.city.trim()) e.city = 'Město je povinné';
    if (form.country === 'CZ' && !form.region) e.region = 'Vyberte kraj';
    if (form.country === 'zahraničí' && !form.euCountry) e.euCountry = 'Vyberte zemi';
    if (form.materials.length === 0) e.materials = 'Vyberte alespoň jeden materiál';
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
      country: form.country,
      region: form.country === 'CZ' ? (form.region as RegionCode) : undefined,
      euCountry: form.country === 'zahraničí' ? form.euCountry : undefined,
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
          <h2>{isEdit ? 'Upravit kontakt' : 'Nový kontakt'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-field">
                <label>Jméno *</label>
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
                <label>Telefon *</label>
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

            <div className="form-row">
              <div className="form-field">
                <label>Země *</label>
                <select
                  value={form.country}
                  onChange={e => {
                    set('country', e.target.value as Country);
                    set('region', '');
                    set('euCountry', '');
                  }}
                >
                  <option value="CZ">Česká republika</option>
                  <option value="zahraničí">Zahraničí</option>
                </select>
              </div>

              {form.country === 'CZ' ? (
                <div className="form-field">
                  <label>Kraj *</label>
                  <select
                    value={form.region}
                    onChange={e => set('region', e.target.value as RegionCode)}
                    className={errors.region ? 'error' : ''}
                  >
                    <option value="">— vyberte kraj —</option>
                    {REGIONS.map(r => (
                      <option key={r.code} value={r.code}>{r.name}</option>
                    ))}
                  </select>
                  {errors.region && <span className="field-error">{errors.region}</span>}
                </div>
              ) : (
                <div className="form-field">
                  <label>Stát *</label>
                  <input
                    type="text"
                    value={form.euCountry}
                    onChange={e => set('euCountry', e.target.value.toUpperCase())}
                    placeholder="DE, AT, PL..."
                    maxLength={2}
                    className={errors.euCountry ? 'error' : ''}
                  />
                  {errors.euCountry && <span className="field-error">{errors.euCountry}</span>}
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Město *</label>
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
                <label>Ulice</label>
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
                Materiály *
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
                      placeholder="název materiálu"
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
                    + nový
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
              <span className="sms-toggle-label">Kontakt chce dostávat SMS upozornění na výkupy</span>
            </label>
          </div>

          <div className="modal-footer">
            {isEdit && onDelete && (
              confirmDelete ? (
                <div className="footer-confirm">
                  <span className="footer-confirm-text">Opravdu smazat?</span>
                  <button type="button" className="btn-secondary" onClick={() => setConfirmDelete(false)}>Ne</button>
                  <button type="button" className="btn-danger" onClick={() => { onDelete(); onClose(); }}>Smazat</button>
                </div>
              ) : (
                <button type="button" className="btn-delete-inline" onClick={() => setConfirmDelete(true)}>
                  🗑 Smazat kontakt
                </button>
              )
            )}
            <div className="footer-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>Zrušit</button>
              <button type="submit" className="btn-primary">
                {isEdit ? 'Uložit změny' : 'Přidat kontakt'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
