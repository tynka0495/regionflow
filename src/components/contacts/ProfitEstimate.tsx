import { useMemo } from 'react';
import type { Contact, Material } from '../../types';
import { QTY_BY_MATERIAL, REGIONS } from '../../types';
import './ProfitEstimate.css';

interface ProfitEstimateProps {
  contacts: Contact[];
  allMaterials: Material[];
  scopeName?: string | null;
}

const FALLBACK_KG_PER_PICKUP = 25;
const FALLBACK_PIECES_PER_PICKUP = 4;

// Value paid out per pickup; QTY_BY_MATERIAL is in kg, so prices per tonne are converted.
function payoutPerPickup(m: Material & { price: number }): number {
  if (m.unit === 'ks') return m.price * FALLBACK_PIECES_PER_PICKUP;
  const pricePerKg = m.unit === 't' ? m.price / 1000 : m.price;
  return pricePerKg * (QTY_BY_MATERIAL[m.name] ?? FALLBACK_KG_PER_PICKUP);
}

const fmt = (n: number) => `${Math.round(n).toLocaleString('cs-CZ')} Kč`;

export function ProfitEstimate({ contacts, allMaterials, scopeName }: ProfitEstimateProps) {
  const stats = useMemo(() => {
    const priceByName = new Map(allMaterials.filter(m => m.active !== false).map(m => [m.name, m]));
    const perPickup = (c: Contact) => c.materials.reduce((sum, name) => {
      const m = priceByName.get(name);
      if (!m?.price) return sum;
      return sum + payoutPerPickup({ ...m, price: m.price });
    }, 0);

    const values = contacts.map(c => ({ c, value: perPickup(c) }));
    const total = values.reduce((s, v) => s + v.value, 0);

    const byRegion: Record<string, number> = {};
    values.forEach(({ c, value }) => {
      if (c.region) byRegion[c.region] = (byRegion[c.region] ?? 0) + value;
    });
    const bestRegion = Object.entries(byRegion).sort((a, b) => b[1] - a[1])[0];

    return {
      avgPerPerson: values.length ? total / values.length : 0,
      total,
      bestRegion: bestRegion ? { name: REGIONS.find(r => r.code === bestRegion[0])?.name ?? bestRegion[0], value: bestRegion[1] } : null,
    };
  }, [contacts, allMaterials]);

  return (
    <div className="card profit-card">
      <div className="profit-header">
        <div>
          <h3>💰 Hodnota výkupu na člověka</h3>
          <p className="profit-sub">
            {scopeName ? `${scopeName} · ` : ''}{contacts.length} kontaktů · odhad podle cen v Materiálech
          </p>
        </div>
      </div>

      <div className="profit-stats">
        <div className="profit-stat profit-stat-main">
          <span className="profit-label">Průměrně za 1 výkup na člověka</span>
          <span className="profit-value">{fmt(stats.avgPerPerson)}</span>
        </div>
        <div className="profit-stat">
          <span className="profit-label">Když přinesou všichni</span>
          <span className="profit-value">{fmt(stats.total)}</span>
        </div>
        {stats.bestRegion && (
          <div className="profit-stat">
            <span className="profit-label">Nejsilnější kraj</span>
            <span className="profit-value profit-value-sm">{stats.bestRegion.name}</span>
            <span className="profit-hint">{fmt(stats.bestRegion.value)} za 1 výkup</span>
          </div>
        )}
      </div>

      <p className="profit-note">
        Kolik za materiál průměrně vyplatíte jednomu člověku, když jednou přinese to, co obvykle nosí (např. železo 300 kg, papír 150 kg, měď 8 kg). Ceny upravíte v Materiálech.
      </p>
    </div>
  );
}
