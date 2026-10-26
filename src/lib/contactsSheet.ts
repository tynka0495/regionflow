import type { Material } from '../types';
import { EU_COUNTRIES, REGIONS } from '../types';

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
  purchases.addRow(['Datum', 'Telefon dodavatele', 'Jméno / firma', 'Provozovna', 'Materiál', 'Množství (kg)', 'Výkupní cena (Kč/kg)', 'Vyplaceno (Kč)']);
  PURCHASE_EXAMPLES.forEach((row, i) => purchases.addRow([...row, { formula: `F${i + 2}*G${i + 2}` }]));
  styleHeader(purchases, Array(8).fill('FF0284C7'));
  [12, 18, 24, 18, 14, 14, 18, 15].forEach((w, i) => { purchases.getColumn(i + 1).width = w; });
  const materialDropdown = { type: 'list' as const, allowBlank: true, formulae: [`Seznamy!$D$2:$D$${materials.length + 1}`] };
  for (let r = 2; r <= ROWS_WITH_DROPDOWNS; r++) purchases.getCell(r, 5).dataValidation = materialDropdown;

  lists.addRow(['Kraje (CZ a SK)', 'Země', 'Název země', 'Materiály']);
  for (let i = 0; i < Math.max(REGIONS.length, countryCodes.length, materials.length); i++) {
    lists.addRow([REGIONS[i]?.name ?? '', countryCodes[i] ?? '', countryLabels[i] ?? '', materials[i] ?? '']);
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
    '• Materiály a jejich ceny mají vlastní šablonu – v aplikaci v sekci Materiály → Import z Excelu.',
    '',
    'List „Výkupy“ – evidence výkupů',
    '• Jeden řádek = jeden materiál z jednoho výkupu (stačí export z vážního systému nebo z výkupních dokladů).',
    '• Z výkupů se dá spočítat skutečná hodnota výkupů na člověka, provozovnu i kraj a najít lidi, kteří dlouho nic nepřinesli.',
    '',
    'Pozn.: List „Výkupy“ zatím slouží jako podklad pro další krok – aplikace ho zatím nenačítá.',
  ].forEach((line, i) => {
    help.addRow([line]);
    if (i === 0) help.getRow(1).font = { bold: true, size: 14 };
  });

  wb.views = [{ x: 0, y: 0, width: 20000, height: 12000, firstSheet: 0, activeTab: 0, visibility: 'visible' }];
  return wb.xlsx.writeBuffer() as Promise<ArrayBuffer>;
}

const MATERIAL_EXAMPLES: (string | number)[][] = [
  ['zinek', 'kg', 45, 'ano'],
  ['katalyzátory', 'ks', 900, 'ano'],
];

export const MATERIALS_SHEET = 'Materiály';

export async function buildMaterialsTemplate(materialList: Material[]): Promise<ArrayBuffer> {
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet(MATERIALS_SHEET, { views: [{ state: 'frozen', ySplit: 1 }] });
  const help = wb.addWorksheet('Návod');

  sheet.addRow(['Materiál', 'Jednotka', 'Výkupní cena (Kč)', 'Vykupuje se']);
  materialList.forEach(m => sheet.addRow([m.name, m.unit ?? 'kg', m.price ?? null, m.active === false ? 'ne' : 'ano']));
  const firstExample = sheet.rowCount + 1;
  MATERIAL_EXAMPLES.forEach(row => sheet.addRow(row));
  for (let r = firstExample; r < firstExample + MATERIAL_EXAMPLES.length; r++) {
    sheet.getRow(r).eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
      cell.font = { italic: true, color: { argb: 'FF047857' } };
    });
  }
  styleHeader(sheet, Array(4).fill('FF059669'));
  [22, 12, 18, 14].forEach((w, i) => { sheet.getColumn(i + 1).width = w; });

  const units = { type: 'list' as const, allowBlank: true, formulae: ['"kg,ks,t"'] };
  const yesNo = { type: 'list' as const, allowBlank: true, formulae: ['"ano,ne"'] };
  for (let r = 2; r <= ROWS_WITH_DROPDOWNS; r++) {
    sheet.getCell(r, 2).dataValidation = units;
    sheet.getCell(r, 4).dataValidation = yesNo;
  }

  help.getColumn(1).width = 110;
  [
    'Jak vyplnit tabulku materiálů',
    '',
    '• V listu „Materiály“ jsou vaše současné materiály a ceny z aplikace. Zelené řádky na konci jsou ukázky nových materiálů – přepište je nebo smažte.',
    '• Nový materiál: přidejte řádek s názvem, jednotkou a cenou.',
    '• Změna ceny: přepište výkupní cenu u existujícího materiálu.',
    '• Jednotka: kg, ks (kusy) nebo t (tuny). Cena je za tuto jednotku.',
    '• Vykupuje se: „ne“ = materiál zůstane v aplikaci, ale přestane se vykupovat.',
    '• Prázdná buňka znamená „neměnit“ – nemusíte vyplňovat všechno.',
    '• Materiály se nemažou: když řádek ze souboru vymažete, materiál v aplikaci zůstane.',
  ].forEach((line, i) => {
    help.addRow([line]);
    if (i === 0) help.getRow(1).font = { bold: true, size: 14 };
  });

  return wb.xlsx.writeBuffer() as Promise<ArrayBuffer>;
}

export async function readSheet(buffer: ArrayBuffer, preferredSheets: string[] = ['Kontakty']): Promise<string[][]> {
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const sheet = preferredSheets.map(name => wb.getWorksheet(name)).find(Boolean) ?? wb.worksheets[0];
  if (!sheet) return [];
  const rows: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, row => {
    const cells: string[] = [];
    for (let c = 1; c <= sheet.columnCount; c++) cells.push(row.getCell(c).text?.trim() ?? '');
    rows.push(cells);
  });
  return rows.filter(r => r.some(cell => cell));
}
