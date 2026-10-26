export type MaterialType = string;

export interface Material {
  name: string;
  price?: number;
  unit?: 'kg' | 'ks' | 't';
  active?: boolean;
}

export type Country = 'CZ' | 'SK' | 'EU';

export const COUNTRY_NAMES: Record<Country, string> = {
  CZ: 'Česká republika',
  SK: 'Slovenská republika',
  EU: 'Jiná země EU',
};

export const EU_COUNTRIES: { code: string; name: string }[] = [
  { code: 'AT', name: 'Rakousko' },
  { code: 'BE', name: 'Belgie' },
  { code: 'BG', name: 'Bulharsko' },
  { code: 'CY', name: 'Kypr' },
  { code: 'HR', name: 'Chorvatsko' },
  { code: 'DK', name: 'Dánsko' },
  { code: 'EE', name: 'Estonsko' },
  { code: 'FI', name: 'Finsko' },
  { code: 'FR', name: 'Francie' },
  { code: 'IE', name: 'Irsko' },
  { code: 'IT', name: 'Itálie' },
  { code: 'LT', name: 'Litva' },
  { code: 'LV', name: 'Lotyšsko' },
  { code: 'LU', name: 'Lucembursko' },
  { code: 'HU', name: 'Maďarsko' },
  { code: 'MT', name: 'Malta' },
  { code: 'DE', name: 'Německo' },
  { code: 'NL', name: 'Nizozemsko' },
  { code: 'PL', name: 'Polsko' },
  { code: 'PT', name: 'Portugalsko' },
  { code: 'RO', name: 'Rumunsko' },
  { code: 'GR', name: 'Řecko' },
  { code: 'SI', name: 'Slovinsko' },
  { code: 'ES', name: 'Španělsko' },
  { code: 'SE', name: 'Švédsko' },
  { code: 'NO', name: 'Norsko' },
  { code: 'CH', name: 'Švýcarsko' },
  { code: 'GB', name: 'Velká Británie' },
  { code: 'RS', name: 'Srbsko' },
  { code: 'BA', name: 'Bosna a Hercegovina' },
  { code: 'ME', name: 'Černá Hora' },
  { code: 'MK', name: 'Severní Makedonie' },
  { code: 'AL', name: 'Albánie' },
];

export const euCountryName = (code?: string) => EU_COUNTRIES.find(c => c.code === code)?.name ?? code ?? '—';

export type CzRegionCode =
  | 'PHA' | 'STC' | 'JHC' | 'PLK' | 'KVK' | 'ULK'
  | 'LBK' | 'HKK' | 'PAK' | 'VYS' | 'JHM' | 'OLK'
  | 'ZLK' | 'MSK';

export type SkRegionCode = 'BA' | 'TT' | 'TN' | 'NR' | 'ZA' | 'BB' | 'PO' | 'KE';

export type RegionCode = CzRegionCode | SkRegionCode;

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  emailEnabled?: boolean;
  country: Country;
  region?: RegionCode;
  euCountry?: string;
  city: string;
  street: string;
  materials: string[];
  smsEnabled: boolean;
}

export interface Region {
  code: RegionCode;
  name: string;
  country: Country;
}

export type ActiveSection = 'contacts' | 'materials' | 'settings';

export interface UserSettings {
  smsTemplate?: string;
  darkMode?: boolean;
  language?: 'cs' | 'en';
  accentColor?: string;
}

export const REGIONS: Region[] = [
  { code: 'PHA', name: 'Praha', country: 'CZ' },
  { code: 'STC', name: 'Středočeský kraj', country: 'CZ' },
  { code: 'JHC', name: 'Jihočeský kraj', country: 'CZ' },
  { code: 'PLK', name: 'Plzeňský kraj', country: 'CZ' },
  { code: 'KVK', name: 'Karlovarský kraj', country: 'CZ' },
  { code: 'ULK', name: 'Ústecký kraj', country: 'CZ' },
  { code: 'LBK', name: 'Liberecký kraj', country: 'CZ' },
  { code: 'HKK', name: 'Královéhradecký kraj', country: 'CZ' },
  { code: 'PAK', name: 'Pardubický kraj', country: 'CZ' },
  { code: 'VYS', name: 'Kraj Vysočina', country: 'CZ' },
  { code: 'JHM', name: 'Jihomoravský kraj', country: 'CZ' },
  { code: 'OLK', name: 'Olomoucký kraj', country: 'CZ' },
  { code: 'ZLK', name: 'Zlínský kraj', country: 'CZ' },
  { code: 'MSK', name: 'Moravskoslezský kraj', country: 'CZ' },
  { code: 'BA', name: 'Bratislavský kraj', country: 'SK' },
  { code: 'TT', name: 'Trnavský kraj', country: 'SK' },
  { code: 'TN', name: 'Trenčiansky kraj', country: 'SK' },
  { code: 'NR', name: 'Nitriansky kraj', country: 'SK' },
  { code: 'ZA', name: 'Žilinský kraj', country: 'SK' },
  { code: 'BB', name: 'Banskobystrický kraj', country: 'SK' },
  { code: 'PO', name: 'Prešovský kraj', country: 'SK' },
  { code: 'KE', name: 'Košický kraj', country: 'SK' },
];

export const regionsOf = (country: Country) => REGIONS.filter(r => r.country === country);

export const MATERIALS: Material[] = [
  { name: 'železo', price: 4, unit: 'kg', active: true },
  { name: 'měď', price: 180, unit: 'kg', active: true },
  { name: 'hliník', price: 30, unit: 'kg', active: true },
  { name: 'mosaz', price: 110, unit: 'kg', active: true },
  { name: 'nerez', price: 25, unit: 'kg', active: true },
  { name: 'olovo', price: 35, unit: 'kg', active: true },
  { name: 'kabely', price: 60, unit: 'kg', active: true },
  { name: 'elektro šrot', price: 10, unit: 'kg', active: true },
  { name: 'autobaterie', price: 15, unit: 'kg', active: true },
  { name: 'papír', price: 2, unit: 'kg', active: true },
  { name: 'plasty', price: 3, unit: 'kg', active: true },
];
