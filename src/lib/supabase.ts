import { createClient } from '@supabase/supabase-js';
import type { Contact, Material, UserSettings } from '../types';
import type { Country, RegionCode } from '../types';

// The demo build (VITE_DEMO=true) never talks to Supabase, so it may run without its keys.
export const supabase = createClient(
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? 'http://localhost',
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? 'demo',
);

// DB keeps the original shape: 'CZ', or 'zahraničí' + eu_country code (Slovakia = 'SK').
function rowCountry(row: Record<string, unknown>): Country {
  if (row.country === 'CZ') return 'CZ';
  if (row.country === 'SK' || row.eu_country === 'SK') return 'SK';
  return 'EU';
}

export function rowToContact(row: Record<string, unknown>): Contact {
  return {
    id: row.id as string,
    name: row.name as string,
    phone: row.phone as string,
    email: (row.email as string) ?? undefined,
    emailEnabled: (row.email_enabled as boolean) ?? false,
    country: rowCountry(row),
    region: (row.region as RegionCode) ?? undefined,
    euCountry: rowCountry(row) === 'EU' ? (row.eu_country as string) ?? undefined : undefined,
    city: row.city as string,
    street: row.street as string,
    materials: (row.materials as string[]) ?? [],
    smsEnabled: row.sms_enabled as boolean,
  };
}

export function contactToRow(contact: Contact, userId: string) {
  return {
    id: contact.id,
    user_id: userId,
    name: contact.name,
    phone: contact.phone,
    country: contact.country === 'CZ' ? 'CZ' : 'zahraničí',
    region: contact.region ?? null,
    eu_country: contact.country === 'SK' ? 'SK' : contact.country === 'EU' ? contact.euCountry ?? null : null,
    city: contact.city,
    street: contact.street,
    materials: contact.materials,
    sms_enabled: contact.smsEnabled,
  };
}

export function rowToMaterial(row: Record<string, unknown>): Material {
  return {
    name: row.name as string,
    price: row.price != null ? Number(row.price) : undefined,
    unit: (row.unit as Material['unit']) ?? undefined,
    active: (row.active as boolean) ?? true,
  };
}

export function rowToSettings(row: Record<string, unknown>): UserSettings {
  return {
    smsTemplate: (row.sms_template as string) ?? undefined,
    darkMode: (row.dark_mode as boolean) ?? false,
    language: ((row.language as string) as 'cs' | 'en') ?? 'cs',
    accentColor: (row.accent_color as string) ?? undefined,
  };
}

export function settingsToRow(settings: UserSettings, userId: string) {
  return {
    user_id: userId,
    sms_template: settings.smsTemplate ?? null,
    dark_mode: settings.darkMode ?? false,
    language: settings.language ?? 'cs',
    accent_color: settings.accentColor ?? null,
  };
}
