import type { Material } from '../types';
import { EU_COUNTRIES, QTY_BY_MATERIAL, REGIONS } from '../types';

const ROWS_WITH_DROPDOWNS = 500;

export const BASE_HEADERS = ['Jméno', 'Telefon', 'E-mail', 'Země', 'Kraj', 'Město', 'Ulice'];
export const TAIL_HEADERS = ['Další materiály', 'SMS souhlas', 'E-mail souhlas'];

const EXAMPLES: { base: string[]; materials: string[]; extra: string; sms: string; email: string }[] = [
  { base: ['Josef Kratochvíl', '+420 604 118 220', 'josef.kratochvil@seznam.cz', 'CZ', 'Zlínský kraj', 'Uherské Hradiště', 'Mařatice 15'], materials: ['železo', 'měď'], extra: '', sms: 'ano', email: 'ano' },
  { base: ['Lenka Šťastná', '+420 732 640 118', '', 'CZ', 'Jihomoravský kraj', 'Brno', 'Vídeňská 40'], materials: ['papír'], extra: '', sms: 'ano', email: 'ne' },
  { base: ['Autoservis Hrubý s.r.o.', '+420 777 902 310', 'servis@autohruby.cz', 'CZ', 'Praha', 'Praha 10', 'Průmyslová 12'], materials: ['autobaterie', 'kabely', 'hliník'], extra: '', sms: 'ne', email: 'ano' },
  { base: ['Ján Kováčik', '+421 905 331 442', 'jan.kovacik@azet.sk', 'SK', 'Trenčiansky kraj', 'Púchov', 'Hlavná 21'], materials: ['železo', 'nerez'], extra: '', sms: 'ano', email: 'ano' },
  { base: ['Marko Jurić', '+385 98 441 207', 'marko.juric@gmail.com', 'HR', '', 'Zagreb', 'Savska cesta 88'], materials: ['měď', 'mosaz'], extra: 'zinek', sms: 'ano', email: 'ne' },
];

const PURCHASE_EXAMPLES: (string | number)[][] = [
  ['2026-09-12', '+420 604 118 220', 'Josef Kratochvíl', 'Uherské Hradiště', 'železo', 320, 4],
  ['2026-09-12', '+420 604 118 220', 'Josef Kratochvíl', 'Uherské Hradiště', 'měď', 6.5, 180],
  ['2026-09-18', '+421 905 331 442', 'Ján Kováčik', 'Púchov', 'nerez', 14, 25],
  ['2026-10-03', '+420 732 640 118', 'Lenka Šťastná', 'Brno', 'papír', 140, 2],
];

type Sheet = import('exceljs').Worksheet;

function styleHeader(sheet: Sheet, colors: string[]) {
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  header.height = 32;
  colors.forEach((color, i) => {
    header.getCell(i + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
  });
}

export async function buildContactsTemplate(materialList: Material[]): Promise<ArrayBuffer> {
  const materials = materialList.map(m => m.name);
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Kontakty', { views: [{ state: 'frozen', ySplit: 1 }] });
  const prices = wb.addWorksheet('Ceník', { views: [{ state: 'frozen', ySplit: 1 }] });
  const purchases = wb.addWorksheet('Výkupy', { views: [{ state: 'frozen', ySplit: 1 }] });
  const help = wb.addWorksheet('Návod');
  const lists = wb.addWorksheet('Seznamy');

  const headers = [...BASE_HEADERS, ...materials, ...TAIL_HEADERS];
  sheet.addRow(headers);
  EXAMPLES.forEach(ex => sheet.addRow([
    ...ex.base,
    ...materials.map(m => (ex.materials.includes(m) ? 'ano' : '')),
    ex.extra,
    ex.sms,
    ex.email,
  ]));

  styleHeader(sheet, headers.map((_, i) => (i >= BASE_HEADERS.length && i < BASE_HEADERS.length + materials.length ? 'FF059669' : 'FF4F46E5')));

  const widths = [22, 18, 28, 8, 22, 18, 22];
  sheet.columns.forEach((col, i) => {
    col.width = widths[i] ?? (i < BASE_HEADERS.length + materials.length ? 12 : 18);
  });

  const countryCodes = ['CZ', 'SK', ...EU_COUNTRIES.map(c => c.code)];
  const countryLabels = ['Česká republika', 'Slovenská republika', ...EU_COUNTRIES.map(c => c.name)];
  prices.addRow(['Materiál', 'Jednotka', 'Výkupní cena (Kč)', 'Prodejní cena (Kč)', 'Marže (Kč)', 'Marže (%)', 'Průměrné množství na 1 výkup', 'Kdo doplní']);
  materialList.forEach((m, i) => {
    const r = i + 2;
    prices.addRow([m.name, m.unit ?? 'kg', m.price ?? null, null, { formula: `IF(D${r}="","",D${r}-C${r})` }, { formula: `IF(D${r}="","",(D${r}-C${r})/D${r})` }, QTY_BY_MATERIAL[m.name] ?? null, 'výkup: provozovna · prodej: controlling']);
    prices.getCell(r, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } };
  });
  styleHeader(prices, ['FF4F46E5', 'FF4F46E5', 'FF4F46E5', 'FFCA8A04', 'FF64748B', 'FF64748B', 'FF4F46E5', 'FF64748B']);
  [16, 10, 16, 18, 12, 11, 18, 36].forEach((w, i) => { prices.getColumn(i + 1).width = w; });
  prices.getColumn(6).numFmt = '0.0%';

  purchases.addRow(['Datum', 'Telefon dodavatele', 'Jméno / firma', 'Provozovna', 'Materiál', 'Množství (kg)', 'Výkupní cena (Kč/kg)', 'Vyplaceno (Kč)']);
  PURCHASE_EXAMPLES.forEach((row, i) => purchases.addRow([...row, { formula: `F${i + 2}*G${i + 2}` }]));
  styleHeader(purchases, Array(8).fill('FF0284C7'));
  [12, 18, 24, 18, 14, 14, 18, 15].forEach((w, i) => { purchases.getColumn(i + 1).width = w; });
  const materialDropdown = { type: 'list' as const, allowBlank: true, formulae: [`Ceník!$A$2:$A$${materialList.length + 1}`] };
  for (let r = 2; r <= ROWS_WITH_DROPDOWNS; r++) purchases.getCell(r, 5).dataValidation = materialDropdown;

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
    '',
    'List „Ceník“ – podklad pro skutečný odhad zisku',
    '• Výkupní cenu doplní provozovna, PRODEJNÍ cenu (žlutý sloupec – za kolik materiál prodáváte zpracovatelům) doplní controlling.',
    '• Marže se dopočítá sama. Průměrné množství na 1 výkup je náš odhad – upravte ho podle skutečnosti.',
    '',
    'List „Výkupy“ – evidence výkupů',
    '• Jeden řádek = jeden materiál z jednoho výkupu (stačí export z vážního systému nebo z výkupních dokladů).',
    '• Z výkupů se dá spočítat skutečný zisk na člověka, provozovnu i kraj a najít lidi, kteří dlouho nic nepřinesli.',
    '',
    'Pozn.: Aplikace zatím při importu načítá list „Kontakty“. Listy „Ceník“ a „Výkupy“ slouží jako podklad pro další krok.',
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
