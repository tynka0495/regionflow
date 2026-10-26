import { useState } from 'react';
import type { Contact, Country, Material, RegionCode } from '../../types';
import { regionsOf, EU_COUNTRIES } from '../../types';
import { buildContactsTemplate, readSheet } from '../../lib/contactsSheet';
import { importDisabledReason, normalize, parseBool, parseCsv } from '../../lib/sheetUtils';
import '../sms/SmsModal.css';
import './CsvImportModal.css';

interface CsvImportModalProps {
  existingContacts: Contact[];
  allMaterials: Material[];
  onAddMaterial: (material: string) => void;
  onImport: (contacts: Contact[]) => void;
  onClose: () => void;
}

type RowStatus = 'new' | 'update' | 'same' | 'error';

interface ParsedRow {
  line: number;
  name: string;
  status: RowStatus;
  contact?: Contact;
  errors: string[];
  newMaterials: string[];
}

const STATUS_LABEL: Record<RowStatus, string> = {
  new: 'nový',
  update: 'změna',
  same: 'beze změny',
  error: 'chyba',
};

const comparable = (c: Contact) => JSON.stringify([
  c.name, c.phone, c.email ?? '', !!c.emailEnabled, c.country, c.region ?? '', c.euCountry ?? '',
  c.city, c.street, [...c.materials].sort(), c.smsEnabled,
]);

type Column = 'jmeno' | 'telefon' | 'email' | 'zeme' | 'kraj' | 'mesto' | 'ulice' | 'materialy' | 'sms' | 'email_souhlas';

const ALIASES: Record<string, Column> = {
  jmeno: 'jmeno', name: 'jmeno', 'jmeno a prijmeni': 'jmeno',
  telefon: 'telefon', phone: 'telefon', tel: 'telefon',
  email: 'email', 'e-mail': 'email', mail: 'email',
  zeme: 'zeme', stat: 'zeme', country: 'zeme',
  kraj: 'kraj', region: 'kraj',
  mesto: 'mesto', city: 'mesto', obec: 'mesto',
  ulice: 'ulice', street: 'ulice', adresa: 'ulice',
  materialy: 'materialy', material: 'materialy', materials: 'materialy', 'dalsi materialy': 'materialy',
  sms: 'sms', 'sms souhlas': 'sms', sms_souhlas: 'sms',
  email_souhlas: 'email_souhlas', 'email souhlas': 'email_souhlas', 'e-mail souhlas': 'email_souhlas', 'souhlas email': 'email_souhlas',
};

const digits = (s: string) => s.replace(/\D/g, '');

function parseCountry(value: string): { country: Country; euCountry?: string } | null {
  const v = normalize(value);
  if (['', 'cz', 'cr', 'cesko', 'ceska republika'].includes(v)) return { country: 'CZ' };
  if (['sk', 'sr', 'slovensko', 'slovenska republika'].includes(v)) return { country: 'SK' };
  const eu = EU_COUNTRIES.find(c => normalize(c.code) === v || normalize(c.name) === v);
  return eu ? { country: 'EU', euCountry: eu.code } : null;
}

function findRegion(country: Exclude<Country, 'EU'>, value: string): RegionCode | undefined {
  const v = normalize(value);
  if (!v) return undefined;
  return regionsOf(country).find(r => normalize(r.code) === v || normalize(r.name) === v || normalize(r.name).replace(/ kraj$|^kraj /, '') === v.replace(/ kraj$|^kraj /, ''))?.code;
}

function validateRows(table: string[][], existing: Contact[], allMaterials: string[]): { rows: ParsedRow[]; headerError?: string } {
  if (table.length < 2) return { rows: [], headerError: 'Soubor neobsahuje žádné řádky s kontakty.' };

  const header = table[0].map(h => ALIASES[normalize(h)]);
  const materialColumns = table[0]
    .map((h, idx) => ({ idx, name: allMaterials.find(m => normalize(m) === normalize(h)) }))
    .filter((c): c is { idx: number; name: string } => !!c.name);
  const missing = (['jmeno', 'telefon', 'mesto'] as Column[]).filter(c => !header.includes(c));
  if (!header.includes('materialy') && materialColumns.length === 0) missing.push('materialy');
  if (missing.length) return { rows: [], headerError: `V hlavičce chybí sloupce: ${missing.join(', ')}. Stáhněte si šablonu.` };

  const existingByPhone = new Map(existing.map(c => [digits(c.phone), c]));
  const phonesInFile = new Set<string>();
  const knownMaterials = new Set(allMaterials);

  const rows = table.slice(1).map((cells, i): ParsedRow => {
    const get = (col: Column) => (cells[header.indexOf(col)] ?? '').trim();
    const errors: string[] = [];

    const name = get('jmeno');
    const phone = get('telefon');
    const email = get('email');
    const parsedCountry = parseCountry(get('zeme'));
    const country = parsedCountry?.country;
    const city = get('mesto');
    const materials = [...new Set([
      ...materialColumns.filter(c => parseBool(cells[c.idx] ?? '')).map(c => c.name),
      ...get('materialy').split(/[,|;]/).map(m => m.trim().toLowerCase()).filter(Boolean),
    ])];
    const sms = parseBool(get('sms'));
    const emailConsent = parseBool(get('email_souhlas'));

    if (!name) errors.push('chybí jméno');
    if (!phone) errors.push('chybí telefon');
    else if (phonesInFile.has(digits(phone))) errors.push('telefon je v souboru vícekrát');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('neplatný e-mail');
    if (!city) errors.push('chybí město');
    if (materials.length === 0) errors.push('chybí materiál');
    if (sms === null) errors.push('SMS musí být ano/ne');
    if (emailConsent === null) errors.push('souhlas s e-mailem musí být ano/ne');
    if (emailConsent && !email) errors.push('souhlas s e-mailem bez e-mailové adresy');

    const region = country && country !== 'EU' ? findRegion(country, get('kraj')) : undefined;
    if (!country) errors.push(`neznámá země „${get('zeme')}“ (CZ, SK nebo kód státu EU, např. HR)`);
    else if (country !== 'EU' && !region) errors.push(get('kraj') ? `neznámý kraj „${get('kraj')}“ pro ${country}` : 'chybí kraj');

    const newMaterials = materials.filter(m => !knownMaterials.has(m));

    if (errors.length || !country) return { line: i + 1, name: name || '—', status: 'error', errors, newMaterials };

    phonesInFile.add(digits(phone));
    const existingContact = existingByPhone.get(digits(phone));
    const contact: Contact = {
      ...existingContact,
      id: existingContact?.id ?? crypto.randomUUID(),
      name,
      phone,
      email: email || undefined,
      emailEnabled: !!email && !!emailConsent,
      country,
      region,
      euCountry: parsedCountry?.euCountry,
      city,
      street: get('ulice'),
      materials,
      smsEnabled: !!sms,
    };
    const status: RowStatus = !existingContact ? 'new' : comparable(existingContact) === comparable(contact) ? 'same' : 'update';
    return { line: i + 1, name, status, errors, newMaterials, contact };
  });

  return { rows };
}

export function CsvImportModal({ existingContacts, allMaterials, onAddMaterial, onImport, onClose }: CsvImportModalProps) {
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [headerError, setHeaderError] = useState<string>();
  const [allowUpdate, setAllowUpdate] = useState(true);
  const [result, setResult] = useState<{ added: number; updated: number } | null>(null);

  const toAdd = rows.filter(r => r.status === 'new');
  const toUpdate = rows.filter(r => r.status === 'update');
  const invalid = rows.filter(r => r.status === 'error');
  const toImport = [...toAdd, ...(allowUpdate ? toUpdate : [])];
  const newMaterials = [...new Set(toImport.flatMap(r => r.newMaterials))];
  const disabledReason = importDisabledReason({ rows: rows.length, added: toAdd.length, updated: toUpdate.length, errors: invalid.length, allowUpdate });

  const downloadTemplate = async () => {
    const buffer = await buildContactsTemplate(allMaterials);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'kontakty-sablona.xlsx';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    const isExcel = /\.xlsx$/i.test(file.name);
    let table: string[][];
    try {
      table = isExcel ? await readSheet(await file.arrayBuffer()) : parseCsv(await file.text());
    } catch {
      setRows([]);
      setHeaderError('Soubor se nepodařilo přečíst. Použijte Excel (.xlsx) nebo CSV.');
      return;
    }
    const result = validateRows(table, existingContacts, allMaterials.map(m => m.name));
    setRows(result.rows);
    setHeaderError(result.headerError);
  };

  const handleImport = () => {
    newMaterials.forEach(onAddMaterial);
    onImport(toImport.map(r => r.contact!));
    setResult({ added: toAdd.length, updated: allowUpdate ? toUpdate.length : 0 });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal csv-modal">
        <div className="modal-header">
          <div>
            <h2>Import kontaktů z Excelu</h2>
            <p className="modal-subtitle">Stejná pole jako u „Přidat kontakt“, včetně souhlasu se SMS a e-maily</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {result ? (
          <div className="sms-success">
            <div className="sms-success-icon">✓</div>
            <h3>Kontakty nahrány</h3>
            <p>Přidáno {result.added}, aktualizováno {result.updated}.</p>
            {invalid.length > 0 && <p>{invalid.length} řádků s chybou bylo přeskočeno.</p>}
            <button className="btn-primary" onClick={onClose}>Zavřít</button>
          </div>
        ) : (
          <>
            <div className="modal-body">
              <div className="csv-help">
                <ol>
                  <li>Stáhněte si šablonu v Excelu – každý údaj má vlastní sloupec.</li>
                  <li>Každý kontakt vyplňte na jeden řádek. Kraj, materiály a souhlasy vybíráte z nabídky (ano / ne).</li>
                  <li>Uložte soubor a nahrajte ho sem. Před importem uvidíte kontrolu všech řádků.</li>
                </ol>
                <button type="button" className="btn-secondary" onClick={downloadTemplate}>⬇ Stáhnout šablonu (Excel)</button>
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
                    {invalid.length > 0 && <span className="csv-bad">✕ {invalid.length} s chybou (přeskočí se)</span>}
                  </div>

                  <label className="sms-toggle csv-toggle">
                    <input type="checkbox" checked={allowUpdate} onChange={e => setAllowUpdate(e.target.checked)} />
                    <span className="sms-toggle-track" />
                    <span className="sms-toggle-label">Aktualizovat existující kontakty (podle telefonu)</span>
                  </label>
                  {newMaterials.length > 0 && (
                    <p className="csv-note">Nové materiály se přidají do seznamu: {newMaterials.join(', ')}</p>
                  )}
                  <div className="csv-table-wrap">
                    <table className="csv-table">
                      <thead>
                        <tr><th>Řádek</th><th>Jméno</th><th>Telefon / SMS</th><th>E-mail</th><th>Stav</th></tr>
                      </thead>
                      <tbody>
                        {rows.map(r => (
                          <tr key={r.line} className={r.status === 'error' ? 'csv-row-bad' : r.status === 'same' ? 'csv-row-muted' : ''}>
                            <td>{r.line}</td>
                            <td>{r.name}</td>
                            <td>{r.contact ? `${r.contact.smsEnabled ? '✓' : '✕'} ${r.contact.phone}` : ''}</td>
                            <td>{r.contact ? (r.contact.email ? `${r.contact.emailEnabled ? '✓' : '✕'} ${r.contact.email}` : '—') : ''}</td>
                            <td>{r.status === 'error' ? r.errors.join(', ') : r.status === 'update' && !allowUpdate ? 'změna (přeskočí se)' : STATUS_LABEL[r.status]}</td>
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
              <span className="import-btn-wrap" data-tooltip={disabledReason}>
                <button className="btn-primary" onClick={handleImport} disabled={!!disabledReason}>
                  Importovat {toImport.length > 0 && `(${toImport.length})`}
                </button>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
