import { useState, useRef, useEffect } from 'react'; // useRef/useEffect used in MaterialModal
import { Layout } from '../layout/Layout';
import type { Contact, Material } from '../../types';
import { t } from '../../lib/i18n';
import './MaterialsSection.css';

interface MaterialsSectionProps {
  contacts: Contact[];
  allMaterials: Material[];
  onAddMaterial: (material: Material) => void;
  onUpdateMaterial: (oldName: string, updated: Material) => void;
  onDeleteMaterial: (name: string) => void;
}

const MATERIAL_COLORS: string[] = [
  '#6366f1', '#0ea5e9', '#f59e0b', '#10b981',
  '#8b5cf6', '#f43f5e', '#14b8a6', '#fb923c',
  '#a3e635', '#94a3b8',
];

const NAMED_COLORS: Record<string, string> = {
  kontakty: '#6366f1',
  desky: '#0ea5e9',
  konektory: '#f59e0b',
  mobily: '#10b981',
  elektronika: '#8b5cf6',
  kabely: '#f43f5e',
  cpu: '#14b8a6',
  ram: '#fb923c',
  hdd: '#a3e635',
  ostatní: '#94a3b8',
};

function getMaterialColor(name: string, index: number): string {
  return NAMED_COLORS[name] ?? MATERIAL_COLORS[index % MATERIAL_COLORS.length];
}

function formatPrice(price?: number, unit?: string): string {
  if (price === undefined) return '—';
  return `${price} Kč/${unit ?? 'kg'}`;
}

interface MaterialModalProps {
  material?: Material;
  onSave: (updated: Material) => void;
  onDelete?: () => void;
  onClose: () => void;
}

function MaterialModal({ material, onSave, onDelete, onClose }: MaterialModalProps) {
  const isNew = !material;
  const [name, setName] = useState(material?.name ?? '');
  const [price, setPrice] = useState<string>(material?.price !== undefined ? String(material.price) : '');
  const [unit, setUnit] = useState<'kg' | 'ks' | 't'>(material?.unit ?? 'kg');
  const [active, setActive] = useState(material?.active !== false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [nameError, setNameError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim().toLowerCase();
    if (!trimmedName) { setNameError(true); inputRef.current?.focus(); return; }
    const parsedPrice = price.trim() !== '' ? parseFloat(price) : undefined;
    onSave({
      name: trimmedName,
      price: parsedPrice && !isNaN(parsedPrice) ? parsedPrice : undefined,
      unit,
      active,
    });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal mat-edit-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isNew ? 'Nový materiál' : 'Upravit materiál'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-field">
              <label>Název materiálu *</label>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setNameError(false); }}
                placeholder="název materiálu"
                className={nameError ? 'error' : ''}
              />
              {nameError && <span className="field-error">Název je povinný</span>}
            </div>
            <label className="sms-toggle">
              <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
              <span className="sms-toggle-track" />
              <span className="sms-toggle-label">Materiál se aktuálně vykupuje</span>
            </label>
            <div className="form-row">
              <div className="form-field">
                <label>Výkupní cena (Kč)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="např. 12"
                />
              </div>
              <div className="form-field">
                <label>Jednotka</label>
                <select value={unit} onChange={e => setUnit(e.target.value as 'kg' | 'ks' | 't')}>
                  <option value="kg">kg</option>
                  <option value="ks">ks</option>
                  <option value="t">t</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            {!isNew && onDelete && (
              confirmDelete ? (
                <div className="footer-confirm">
                  <span className="footer-confirm-text">Opravdu smazat?</span>
                  <button type="button" className="btn-secondary" onClick={() => setConfirmDelete(false)}>Ne</button>
                  <button type="button" className="btn-danger" onClick={() => { onDelete(); onClose(); }}>Smazat</button>
                </div>
              ) : (
                <button type="button" className="btn-delete-inline" onClick={() => setConfirmDelete(true)}>
                  🗑 Smazat materiál
                </button>
              )
            )}
            <div className="footer-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>Zrušit</button>
              <button type="submit" className="btn-primary">
                {isNew ? 'Přidat' : 'Uložit'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


export function MaterialsSection({ contacts, allMaterials, onAddMaterial, onUpdateMaterial, onDeleteMaterial }: MaterialsSectionProps) {
  const lang = 'cs' as const;
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const contactCountByMaterial = allMaterials.reduce<Record<string, number>>((acc, m) => {
    acc[m.name] = contacts.filter(c => c.materials.includes(m.name)).length;
    return acc;
  }, {});

  return (
    <Layout
      title={t('materials_title', lang)}
      subtitle={`${allMaterials.length} ${t('materials_subtitle_types', lang)}`}
      actions={
        <button className="btn-primary" onClick={() => setAddModalOpen(true)}>
          {t('materials_add', lang)}
        </button>
      }
    >
      <div className="materials-grid-section">
        {allMaterials.map((material, index) => {
          const color = getMaterialColor(material.name, index);
          const count = contactCountByMaterial[material.name] ?? 0;
          return (
            <div
              key={material.name}
              className={`material-card ${material.active === false ? 'material-card-inactive' : ''}`}
              style={{ '--mat-color': color } as React.CSSProperties}
              onClick={() => setEditingMaterial(material)}
            >
              <div className="material-card-icon" style={{ background: `${color}18`, color }}>
                ♻️
              </div>
              <div className="material-card-body">
                <div className="material-card-name">{material.name}</div>
                <div className="material-card-count">
                  {count} {count === 1 ? 'kontakt' : count < 5 ? 'kontakty' : 'kontaktů'}
                </div>
              </div>
              <div className="material-card-price" style={{ color: material.active === false ? undefined : color }}>
                {formatPrice(material.price, material.unit)}
              </div>
              <button
                className={`mat-active-toggle ${material.active === false ? 'inactive' : 'active'}`}
                title={material.active === false ? 'Aktivovat' : 'Deaktivovat'}
                onClick={e => { e.stopPropagation(); onUpdateMaterial(material.name, { ...material, active: !(material.active !== false) }); }}
              >
                {material.active === false ? 'Neaktivní' : 'Aktivní'}
              </button>
            </div>
          );
        })}
      </div>

      {addModalOpen && (
        <MaterialModal
          onSave={m => { onAddMaterial(m); setAddModalOpen(false); }}
          onClose={() => setAddModalOpen(false)}
        />
      )}

      {editingMaterial && (
        <MaterialModal
          material={editingMaterial}
          onSave={updated => { onUpdateMaterial(editingMaterial.name, updated); setEditingMaterial(null); }}
          onDelete={() => { onDeleteMaterial(editingMaterial.name); setEditingMaterial(null); }}
          onClose={() => setEditingMaterial(null)}
        />
      )}
    </Layout>
  );
}
