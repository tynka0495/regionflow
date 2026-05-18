import { createClient } from '@supabase/supabase-js';
import type { Contact, Material, UserSettings } from '../types';
import type { Country, RegionCode } from '../types';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
);

export function rowToContact(row: Record<string, unknown>): Contact {
  return {
    id: row.id as string,
    name: row.name as string,
    phone: row.phone as string,
    country: row.country as Country,
    region: (row.region as RegionCode) ?? undefined,
    euCountry: (row.eu_country as string) ?? undefined,
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
    country: contact.country,
    region: contact.region ?? null,
    eu_country: contact.euCountry ?? null,
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
