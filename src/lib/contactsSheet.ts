import { EU_COUNTRIES, REGIONS } from '../types';

const ROWS_WITH_DROPDOWNS = 500;

export const BASE_HEADERS = ['Jméno', 'Telefon', 'E-mail', 'Země', 'Kraj', 'Město', 'Ulice'];
export const TAIL_HEADERS = ['Další materiály', 'SMS souhlas', 'E-mail souhlas'];

const EXAMPLES: { base: string[]; materials: string[]; extra: string; sms: string; email: string }[] = [
  { base: ['Jan Novák', '+420 602 123 456', 'jan.novak@seznam.cz', 'CZ', 'Středočeský kraj', 'Kladno', 'Masarykova 12'], materials: ['železo', 'měď'], extra: '', sms: 'ano', email: 'ano' },
  { base: ['Petra Malá', '+420 731 222 333', '', 'CZ', 'Jihomoravský kraj', 'Brno', 'Husova 5'], materials: ['papír'], extra: '', sms: 'ano', email: 'ne' },
  { base: ['Ivan Horvat', '+385 91 234 5678', 'ivan.horvat@gmail.com', 'HR', '', 'Split', 'Ulica kralja Zvonimira 4'], materials: ['hliník', 'kabely'], extra: '', sms: 'ano', email: 'ne' },
  { base: ['Marek Horváth', '+421 905 123 456', 'marek.horvath@azet.sk', 'SK', 'Žilinský kraj', 'Martin', 'Hviezdoslavova 8'], materials: ['mosaz', 'nerez'], extra: '', sms: 'ne', email: 'ano' },
];

export async function buildContactsTemplate(materials: string[]): Promise<ArrayBuffer> {
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Kontakty', { views: [{ state: 'frozen', ySplit: 1 }] });
  const lists = wb.addWorksheet('Seznamy');
  const help = wb.addWorksheet('Návod');

  const headers = [...BASE_HEADERS, ...materials, ...TAIL_HEADERS];
  sheet.addRow(headers);
  EXAMPLES.forEach(ex => sheet.addRow([
    ...ex.base,
    ...materials.map(m => (ex.materials.includes(m) ? 'ano' : '')),
    ex.extra,
    ex.sms,
    ex.email,
  ]));

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  header.height = 30;
  headers.forEach((_, i) => {
    const isMaterial = i >= BASE_HEADERS.length && i < BASE_HEADERS.length + materials.length;
    header.getCell(i + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isMaterial ? 'FF059669' : 'FF4F46E5' } };
  });

  const widths = [22, 18, 28, 8, 22, 18, 22];
  sheet.columns.forEach((col, i) => {
    col.width = widths[i] ?? (i < BASE_HEADERS.length + materials.length ? 12 : 18);
  });

  const countryCodes = ['CZ', 'SK', ...EU_COUNTRIES.map(c => c.code)];
  const countryLabels = ['Česká republika', 'Slovenská republika', ...EU_COUNTRIES.map(c => c.name)];
  lists.addRow(['Kraje (CZ a SK)', 'Země', 'Název země']);
  for (let i = 0; i < Math.max(REGIONS.length, countryCodes.length); i++) {
    lists.addRow([REGIONS[i]?.name ?? '', countryCodes[i] ?? '', countryLabels[i] ?? '']);
  }
  lists.getColumn(1).width = 24;
  lists.getColumn(3).width = 22;
  lists.getRow(1).font = { bold: true };

  const yesNo = { type: 'list' as const, allowBlank: true, formulae: ['"ano,ne"'] };
  const regionList = { type: 'list' as const, allowBlank: true, formulae: [`Seznamy!$A$2:$A$${REGIONS.length + 1}`] };
  const countryList = { type: 'list' as const, allowBlank: true, formulae: [`Seznamy!$B$2:$B$${countryCodes.length + 1}`] };
  const regionCol = BASE_HEADERS.indexOf('Kraj') + 1;
  const countryCol = BASE_HEADERS.indexOf('Země') + 1;
  for (let r = 2; r <= ROWS_WITH_DROPDOWNS; r++) {
    sheet.getCell(r, regionCol).dataValidation = regionList;
    sheet.getCell(r, countryCol).dataValidation = countryList;
    for (let c = BASE_HEADERS.length + 1; c <= headers.length; c++) {
      if (headers[c - 1] === 'Další materiály') continue;
      sheet.getCell(r, c).dataValidation = yesNo;
    }
  }

  help.getColumn(1).width = 110;
  [
    'Jak vyplnit tabulku kontaktů',
    '',
    '• Každý kontakt = jeden řádek v listu „Kontakty“. Ukázkové řádky přepište nebo smažte.',
    '• Povinné: Jméno, Telefon, Země, Město, aspoň jeden materiál a u CZ/SK i Kraj.',
    '• Země: CZ (Česko), SK (Slovenská republika) nebo kód jiného státu (HR Chorvatsko, AT Rakousko, DE Německo…) – vyberte ze seznamu.',
    '• Kraj vyplňte jen u CZ a SK – musí patřit k vybrané zemi. U ostatních států nechte prázdné.',
    '• Materiály (zelené sloupce): u materiálu, který člověk nosí, vyberte „ano“, ostatní nechte prázdné.',
    '• Další materiály: materiál, který v tabulce není (např. „zinek“) – přidá se do aplikace automaticky.',
    '• SMS souhlas / E-mail souhlas: „ano“ jen pokud člověk souhlasil se zasíláním zpráv. Bez souhlasu mu nic neposíláme.',
    '• Kontakt s telefonem, který už v aplikaci je, se při importu přeskočí.',
  ].forEach((line, i) => {
    help.addRow([line]);
    if (i === 0) help.getRow(1).font = { bold: true, size: 14 };
  });

  wb.views = [{ x: 0, y: 0, width: 20000, height: 12000, firstSheet: 0, activeTab: 0, visibility: 'visible' }];
  return wb.xlsx.writeBuffer() as Promise<ArrayBuffer>;
}

export async function readSheet(buffer: ArrayBuffer): Promise<string[][]> {
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const sheet = wb.getWorksheet('Kontakty') ?? wb.worksheets[0];
  if (!sheet) return [];
  const rows: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, row => {
    const cells: string[] = [];
    for (let c = 1; c <= sheet.columnCount; c++) cells.push(row.getCell(c).text?.trim() ?? '');
    rows.push(cells);
  });
  return rows.filter(r => r.some(cell => cell));
}
