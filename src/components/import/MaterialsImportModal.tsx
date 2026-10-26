import { useState } from 'react';
import type { Material } from '../../types';
import { buildMaterialsTemplate, MATERIALS_SHEET, readSheet } from '../../lib/contactsSheet';
import { normalize, parseBool, parseCsv, parseNumber } from '../../lib/sheetUtils';
import '../sms/SmsModal.css';
import './CsvImportModal.css';

interface MaterialsImportModalProps {
  allMaterials: Material[];
  onAddMaterial: (material: Material) => void;
  onUpdateMaterial: (oldName: string, updated: Material) => void;
  onClose: () => void;
}

type Status = 'new' | 'update' | 'same' | 'error';

interface ParsedMaterial {
  line: number;
  name: string;
  status: Status;
  material?: Material;
  existing?: Material;
  changes: string[];
  errors: string[];
}

type Column = 'name' | 'unit' | 'price' | 'active';

const ALIASES: Record<string, Column> = {
  material: 'name', nazev: 'name', 'nazev materialu': 'name',
  jednotka: 'unit', unit: 'unit',
  'vykupni cena': 'price', 'vykupni cena (kc)': 'price', cena: 'price', 'cena (kc)': 'price', price: 'price',
  'vykupuje se': 'active', aktivni: 'active', active: 'active',
};

const UNITS: NonNullable<Material['unit']>[] = ['kg', 'ks', 't'];

const formatPrice = (m?: Material) => (m?.price !== undefined ? `${m.price} Kč/${m.unit ?? 'kg'}` : '—');

function validateMaterials(table: string[][], existing: Material[]): { rows: ParsedMaterial[]; headerError?: string } {
  if (table.length < 2) return { rows: [], headerError: 'Soubor neobsahuje žádné řádky s materiály.' };
  const header = table[0].map(h => ALIASES[normalize(h)]);
  if (!header.includes('name')) return { rows: [], headerError: 'V hlavičce chybí sloupec „Materiál“. Stáhněte si šablonu materiálů.' };

  const seen = new Set<string>();
  const rows = table.slice(1).map((cells, i): ParsedMaterial => {
    const get = (col: Column) => (header.includes(col) ? (cells[header.indexOf(col)] ?? '').trim() : '');
    const name = get('name').toLowerCase();
    const errors: string[] = [];
    const base = { line: i + 2, name: name || '—', changes: [] as string[], errors };

    if (!name) errors.push('chybí název');
    else if (seen.has(normalize(name))) errors.push('materiál je v souboru dvakrát');

    const unitRaw = normalize(get('unit'));
    const unit = unitRaw ? UNITS.find(u => u === unitRaw) : undefined;
    if (unitRaw && !unit) errors.push(`neznámá jednotka „${get('unit')}“ (kg, ks, t)`);

    const priceRaw = get('price');
    const price = priceRaw ? parseNumber(priceRaw) : null;
    if (priceRaw && (price === null || price < 0)) errors.push(`neplatná cena „${priceRaw}“`);

    const activeRaw = get('active');
    const active = activeRaw ? parseBool(activeRaw) : null;
    if (activeRaw && active === null) errors.push('„Vykupuje se“ musí být ano/ne');

    if (errors.length) return { ...base, status: 'error' };
    seen.add(normalize(name));

    const current = existing.find(m => normalize(m.name) === normalize(name));
    if (!current) {
      return { ...base, status: 'new', material: { name, unit: unit ?? 'kg', price: price ?? undefined, active: active ?? true } };
    }

    // Empty cells keep the current value, so a partial price list never wipes data.
    const updated: Material = {
      ...current,
      unit: unit ?? current.unit,
      price: price ?? current.price,
      active: active ?? current.active,
    };
    const changes: string[] = [];
    if (updated.price !== current.price || updated.unit !== current.unit) changes.push(`${formatPrice(current)} → ${formatPrice(updated)}`);
    if ((updated.active !== false) !== (current.active !== false)) changes.push(updated.active === false ? 'přestane se vykupovat' : 'začne se vykupovat');

    return { ...base, name: current.name, status: changes.length ? 'update' : 'same', material: updated, existing: current, changes };
  });

  return { rows };
}

const STATUS_LABEL: Record<Status, string> = { new: 'nový', update: 'změna', same: 'beze změny', error: 'chyba' };

export function MaterialsImportModal({ allMaterials, onAddMaterial, onUpdateMaterial, onClose }: MaterialsImportModalProps) {
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ParsedMaterial[]>([]);
  const [headerError, setHeaderError] = useState<string>();
  const [allowUpdate, setAllowUpdate] = useState(true);
  const [result, setResult] = useState<{ added: number; updated: number } | null>(null);

  const toAdd = rows.filter(r => r.status === 'new');
  const toUpdate = rows.filter(r => r.status === 'update');
  const errorRows = rows.filter(r => r.status === 'error');
  const actionable = toAdd.length + (allowUpdate ? toUpdate.length : 0);

  const downloadTemplate = async () => {
    const buffer = await buildMaterialsTemplate(allMaterials);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'materialy-sablona.xlsx';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    let table: string[][];
    try {
      table = /\.xlsx$/i.test(file.name) ? await readSheet(await file.arrayBuffer(), [MATERIALS_SHEET, 'Ceník']) : parseCsv(await file.text());
    } catch {
      setRows([]);
      setHeaderError('Soubor se nepodařilo přečíst. Použijte Excel (.xlsx) nebo CSV.');
      return;
    }
    const parsed = validateMaterials(table, allMaterials);
    setRows(parsed.rows);
    setHeaderError(parsed.headerError);
  };

  const handleImport = () => {
    toAdd.forEach(r => onAddMaterial(r.material!));
    if (allowUpdate) toUpdate.forEach(r => onUpdateMaterial(r.existing!.name, r.material!));
    setResult({ added: toAdd.length, updated: allowUpdate ? toUpdate.length : 0 });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal csv-modal">
        <div className="modal-header">
          <div>
            <h2>Import materiálů z Excelu</h2>
            <p className="modal-subtitle">Nové materiály i změny cen z vlastní šablony materiálů</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {result ? (
          <div className="sms-success">
            <div className="sms-success-icon">✓</div>
            <h3>Materiály nahrány</h3>
            <p>Přidáno {result.added}, aktualizováno {result.updated}.{errorRows.length > 0 && ` ${errorRows.length} řádků s chybou bylo přeskočeno.`}</p>
            <button className="btn-primary" onClick={onClose}>Zavřít</button>
          </div>
        ) : (
          <>
            <div className="modal-body">
              <div className="csv-help">
                <ol>
                  <li>Stáhněte si šablonu materiálů – už v ní jsou vaše současné materiály a ceny.</li>
                  <li>Upravte ceny, jednotky nebo „Vykupuje se“, případně přidejte nové řádky.</li>
                  <li>Nahrajte soubor sem. Prázdná buňka znamená „neměnit“.</li>
                </ol>
                <button type="button" className="btn-secondary" onClick={downloadTemplate}>⬇ Stáhnout šablonu materiálů</button>
              </div>

              <label className="csv-drop">
                <input type="file" accept=".xlsx,.csv" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                <span>{fileName ? `📄 ${fileName} (vybrat jiný)` : '📂 Vyberte soubor Excel (.xlsx) nebo CSV'}</span>
              </label>

              {headerError && <div className="csv-error-box">{headerError}</div>}

              {rows.length > 0 && (
                <>
                  <div className="csv-summary">
                    <span className="csv-ok">＋ {toAdd.length} nových</span>
                    <span className="csv-ok">✎ {toUpdate.length} změn</span>
                    {errorRows.length > 0 && <span className="csv-bad">✕ {errorRows.length} s chybou</span>}
                  </div>

                  <label className="sms-toggle csv-toggle">
                    <input type="checkbox" checked={allowUpdate} onChange={e => setAllowUpdate(e.target.checked)} />
                    <span className="sms-toggle-track" />
                    <span className="sms-toggle-label">Aktualizovat existující materiály (cena, jednotka, „Vykupuje se“)</span>
                  </label>

                  <div className="csv-table-wrap">
                    <table className="csv-table">
                      <thead>
                        <tr><th>Řádek</th><th>Materiál</th><th>Stav</th><th>Detail</th></tr>
                      </thead>
                      <tbody>
                        {rows.map(r => (
                          <tr key={r.line} className={r.status === 'error' ? 'csv-row-bad' : r.status === 'same' ? 'csv-row-muted' : ''}>
                            <td>{r.line}</td>
                            <td>{r.name}</td>
                            <td>{r.status === 'update' && !allowUpdate ? 'změna (přeskočí se)' : STATUS_LABEL[r.status]}</td>
                            <td>{r.status === 'error' ? r.errors.join(', ') : r.status === 'new' ? formatPrice(r.material) : r.changes.join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose}>Zrušit</button>
              <button className="btn-primary" onClick={handleImport} disabled={actionable === 0}>
                Nahrát {actionable > 0 && `(${actionable})`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
