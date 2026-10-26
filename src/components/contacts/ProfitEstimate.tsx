import { useMemo, useState } from 'react';
import type { Contact, Material } from '../../types';
import { QTY_BY_MATERIAL, REGIONS } from '../../types';
import './ProfitEstimate.css';

interface ProfitEstimateProps {
  contacts: Contact[];
  allMaterials: Material[];
  scopeName?: string | null;
}

const QTY_BY_UNIT: Record<NonNullable<Material['unit']>, number> = { kg: 25, ks: 4, t: 0.05 };
const qtyFor = (m: Material) => QTY_BY_MATERIAL[m.name] ?? QTY_BY_UNIT[m.unit ?? 'kg'];

const fmt = (n: number) => `${Math.round(n).toLocaleString('cs-CZ')} Kč`;

export function ProfitEstimate({ contacts, allMaterials, scopeName }: ProfitEstimateProps) {
  const [margin, setMargin] = useState(15);
  const [pickupsPerYear, setPickupsPerYear] = useState(4);

  const stats = useMemo(() => {
    const priceByName = new Map(allMaterials.filter(m => m.active !== false).map(m => [m.name, m]));
    const perPickup = (c: Contact) => c.materials.reduce((sum, name) => {
      const m = priceByName.get(name);
      if (!m?.price) return sum;
      return sum + m.price * qtyFor(m) * (margin / 100);
    }, 0);

    const values = contacts.map(c => ({ c, value: perPickup(c) }));
    const total = values.reduce((s, v) => s + v.value, 0);
    const avgPickup = values.length ? total / values.length : 0;

    const byRegion: Record<string, number> = {};
    values.forEach(({ c, value }) => {
      if (c.region) byRegion[c.region] = (byRegion[c.region] ?? 0) + value;
    });
    const bestRegion = Object.entries(byRegion).sort((a, b) => b[1] - a[1])[0];

    return {
      avgPickup,
      avgYear: avgPickup * pickupsPerYear,
      totalYear: total * pickupsPerYear,
      bestRegion: bestRegion ? { name: REGIONS.find(r => r.code === bestRegion[0])?.name ?? bestRegion[0], value: bestRegion[1] * pickupsPerYear } : null,
    };
  }, [contacts, allMaterials, margin, pickupsPerYear]);

  return (
    <div className="card profit-card">
      <div className="profit-header">
        <div>
          <h3>💰 Odhad zisku na člověka</h3>
          <p className="profit-sub">
            {scopeName ? `${scopeName} · ` : ''}{contacts.length} kontaktů · návrh podle výkupních cen materiálů
          </p>
        </div>
        <div className="profit-inputs">
          <label>
            Marže
            <input type="number" min={0} max={100} value={margin} onChange={e => setMargin(Number(e.target.value))} />
            %
          </label>
          <label>
            Výkupy / rok
            <input type="number" min={1} max={52} value={pickupsPerYear} onChange={e => setPickupsPerYear(Number(e.target.value))} />
          </label>
        </div>
      </div>

      <div className="profit-stats">
        <div className="profit-stat profit-stat-main">
          <span className="profit-label">Průměr na člověka / rok</span>
          <span className="profit-value">{fmt(stats.avgYear)}</span>
        </div>
        <div className="profit-stat">
          <span className="profit-label">Průměr na 1 výkup</span>
          <span className="profit-value">{fmt(stats.avgPickup)}</span>
        </div>
        <div className="profit-stat">
          <span className="profit-label">Potenciál celkem / rok</span>
          <span className="profit-value">{fmt(stats.totalYear)}</span>
        </div>
        {stats.bestRegion && (
          <div className="profit-stat">
            <span className="profit-label">Nejvýnosnější kraj</span>
            <span className="profit-value profit-value-sm">{stats.bestRegion.name}</span>
            <span className="profit-hint">{fmt(stats.bestRegion.value)} / rok</span>
          </div>
        )}
      </div>

      <p className="profit-note">
        Předpoklad na 1 výkup: např. železo 300 kg, papír 150 kg, měď 8 kg, mosaz 5 kg. Zisk = výkupní cena × množství × marže. Ceny jsou ukázkové – upravíte je v Materiálech.
      </p>
    </div>
  );
}
