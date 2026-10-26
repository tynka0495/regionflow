export const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function parseBool(value: string): boolean | null {
  const v = normalize(value);
  if (['ano', 'a', 'yes', 'y', '1', 'true', 'x'].includes(v)) return true;
  if (['ne', 'n', 'no', '0', 'false', ''].includes(v)) return false;
  return null;
}

export function parseCsv(text: string): string[][] {
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

export function parseNumber(value: string): number | null {
  const cleaned = value.replace(/\s/g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

// Explains why the import button is disabled, or returns undefined when there is something to import.
export function importDisabledReason(counts: { rows: number; added: number; updated: number; errors: number; allowUpdate: boolean }): string | undefined {
  if (counts.rows === 0) return 'Nejdřív vyberte soubor.';
  if (counts.added > 0 || (counts.allowUpdate && counts.updated > 0)) return undefined;
  if (counts.updated > 0) return 'Jsou tu jen změny existujících záznamů – zapněte „Aktualizovat existující“.';
  if (counts.errors === counts.rows) return 'Žádný řádek nejde nahrát – opravte chyby v souboru.';
  return 'Nic se nezměnilo – data v souboru jsou stejná jako současná.';
}
