import { useState } from 'react';
import type { Contact, Country, RegionCode } from '../../types';
import { regionsOf, EU_COUNTRIES } from '../../types';
import { buildContactsTemplate, readSheet } from '../../lib/contactsSheet';
import '../sms/SmsModal.css';
import './CsvImportModal.css';

interface CsvImportModalProps {
  existingContacts: Contact[];
  allMaterials: string[];
  onAddMaterial: (material: string) => void;
  onImport: (contacts: Contact[]) => void;
  onClose: () => void;
}

interface ParsedRow {
  line: number;
  name: string;
  contact?: Contact;
  errors: string[];
  newMaterials: string[];
}

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

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const digits = (s: string) => s.replace(/\D/g, '');

function parseBool(value: string): boolean | null {
  const v = normalize(value);
  if (['ano', 'a', 'yes', 'y', '1', 'true', 'x'].includes(v)) return true;
  if (['ne', 'n', 'no', '0', 'false', ''].includes(v)) return false;
  return null;
}

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

function parseCsv(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '');
  const firstLine = clean.split(/\r?\n/)[0] ?? '';
  const delimiter = [';', ',', '\t'].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(cell => cell.trim()));
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

  const knownPhones = new Set(existing.map(c => digits(c.phone)));
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
    else if (knownPhones.has(digits(phone))) errors.push('telefon už je v kontaktech');
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

    if (errors.length || !country) return { line: i + 2, name: name || '—', errors, newMaterials };

    knownPhones.add(digits(phone));
    return {
      line: i + 2,
      name,
      errors,
      newMaterials,
      contact: {
        id: crypto.randomUUID(),
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
      },
    };
  });

  return { rows };
}

export function CsvImportModal({ existingContacts, allMaterials, onAddMaterial, onImport, onClose }: CsvImportModalProps) {
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [headerError, setHeaderError] = useState<string>();
  const [importedCount, setImportedCount] = useState<number | null>(null);

  const valid = rows.filter(r => r.contact);
  const invalid = rows.filter(r => !r.contact);
  const newMaterials = [...new Set(valid.flatMap(r => r.newMaterials))];

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
    const result = validateRows(table, existingContacts, allMaterials);
    setRows(result.rows);
    setHeaderError(result.headerError);
  };

  const handleImport = () => {
    newMaterials.forEach(onAddMaterial);
    onImport(valid.map(r => r.contact!));
    setImportedCount(valid.length);
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

        {importedCount !== null ? (
          <div className="sms-success">
            <div className="sms-success-icon">✓</div>
            <h3>Importováno {importedCount} kontaktů</h3>
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
                    <span className="csv-ok">✓ {valid.length} připraveno k importu</span>
                    {invalid.length > 0 && <span className="csv-bad">✕ {invalid.length} s chybou (přeskočí se)</span>}
                  </div>
                  {newMaterials.length > 0 && (
                    <p className="csv-note">Nové materiály se přidají do seznamu: {newMaterials.join(', ')}</p>
                  )}
                  <div className="csv-table-wrap">
                    <table className="csv-table">
                      <thead>
                        <tr><th>Řádek</th><th>Jméno</th><th>SMS</th><th>E-mail</th><th>Stav</th></tr>
                      </thead>
                      <tbody>
                        {rows.map(r => (
                          <tr key={r.line} className={r.contact ? '' : 'csv-row-bad'}>
                            <td>{r.line}</td>
                            <td>{r.name}</td>
                            <td>{r.contact ? (r.contact.smsEnabled ? '✓' : '✕') : ''}</td>
                            <td>{r.contact ? (r.contact.emailEnabled ? `✓ ${r.contact.email}` : (r.contact.email ?? '—')) : ''}</td>
                            <td>{r.contact ? 'OK' : r.errors.join(', ')}</td>
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
              <button className="btn-primary" onClick={handleImport} disabled={valid.length === 0}>
                Importovat {valid.length > 0 && `(${valid.length})`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
