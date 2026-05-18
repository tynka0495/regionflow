export type MaterialType = string;

export interface Material {
  name: string;
  price?: number;
  unit?: 'kg' | 'ks' | 't';
  active?: boolean;
}

export type Country = 'CZ' | 'zahraničí';

export type RegionCode =
  | 'PHA' | 'STC' | 'JHC' | 'PLK' | 'KVK' | 'ULK'
  | 'LBK' | 'HKK' | 'PAK' | 'VYS' | 'JHM' | 'OLK'
  | 'ZLK' | 'MSK';

export interface Contact {
  id: string;
  name: string;
  phone: string;
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
}

export type ActiveSection = 'contacts' | 'materials' | 'settings';

export interface UserSettings {
  smsTemplate?: string;
  darkMode?: boolean;
  language?: 'cs' | 'en';
  accentColor?: string;
}

export const REGIONS: Region[] = [
  { code: 'PHA', name: 'Praha' },
  { code: 'STC', name: 'Středočeský kraj' },
  { code: 'JHC', name: 'Jihočeský kraj' },
  { code: 'PLK', name: 'Plzeňský kraj' },
  { code: 'KVK', name: 'Karlovarský kraj' },
  { code: 'ULK', name: 'Ústecký kraj' },
  { code: 'LBK', name: 'Liberecký kraj' },
  { code: 'HKK', name: 'Královéhradecký kraj' },
  { code: 'PAK', name: 'Pardubický kraj' },
  { code: 'VYS', name: 'Kraj Vysočina' },
  { code: 'JHM', name: 'Jihomoravský kraj' },
  { code: 'OLK', name: 'Olomoucký kraj' },
  { code: 'ZLK', name: 'Zlínský kraj' },
  { code: 'MSK', name: 'Moravskoslezský kraj' },
];

export const MATERIALS: Material[] = [
  { name: 'kontakty', price: 5, unit: 'kg', active: true },
  { name: 'desky', price: 12, unit: 'kg', active: true },
  { name: 'konektory', price: 8, unit: 'kg', active: true },
  { name: 'mobily', price: 150, unit: 'ks', active: true },
  { name: 'elektronika', price: 10, unit: 'kg', active: true },
  { name: 'kabely', price: 6, unit: 'kg', active: true },
  { name: 'cpu', price: 200, unit: 'ks', active: true },
  { name: 'ram', price: 80, unit: 'ks', active: true },
  { name: 'hdd', price: 50, unit: 'ks', active: true },
  { name: 'ostatní', price: 3, unit: 'kg', active: true },
];
