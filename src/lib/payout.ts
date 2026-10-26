import type { Contact, Material } from '../types';
import { QTY_BY_MATERIAL } from '../types';

const FALLBACK_KG_PER_PICKUP = 25;
const FALLBACK_PIECES_PER_PICKUP = 4;

// Value paid out for one material per pickup; QTY_BY_MATERIAL is in kg, so prices per tonne are converted.
export function materialPayout(m: Material | undefined): number {
  if (!m?.price || m.active === false) return 0;
  if (m.unit === 'ks') return m.price * FALLBACK_PIECES_PER_PICKUP;
  const pricePerKg = m.unit === 't' ? m.price / 1000 : m.price;
  return pricePerKg * (QTY_BY_MATERIAL[m.name] ?? FALLBACK_KG_PER_PICKUP);
}

export function contactPayout(c: Contact, materialsByName: Map<string, Material>): number {
  return c.materials.reduce((sum, name) => sum + materialPayout(materialsByName.get(name)), 0);
}

export const formatKc = (n: number) => `${Math.round(n).toLocaleString('cs-CZ')} Kč`;

export const peopleLabel = (n: number) => (n === 1 ? 'člověk' : n >= 2 && n <= 4 ? 'lidé' : 'lidí');
