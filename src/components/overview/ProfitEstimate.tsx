import { useMemo } from 'react';
import type { Contact, Material } from '../../types';
import { REGIONS } from '../../types';
import { contactPayout, formatKc as fmt, materialPayout as payoutOf, peopleLabel } from '../../lib/payout';
import './ProfitEstimate.css';

interface ProfitEstimateProps {
  contacts: Contact[];
  allMaterials: Material[];
  scopeName?: string | null;
}

// A region with one or two contacts would win the average by chance.
const MIN_CONTACTS_FOR_REGION = 3;

export function ProfitEstimate({ contacts, allMaterials, scopeName }: ProfitEstimateProps) {
  const stats = useMemo(() => {
    const byName = new Map(allMaterials.map(m => [m.name, m]));
    const materialPayout = (name: string) => payoutOf(byName.get(name));

    const values = contacts.map(c => ({ c, value: contactPayout(c, byName) }));
    const total = values.reduce((s, v) => s + v.value, 0);

    const byRegion: Record<string, { sum: number; count: number }> = {};
    values.forEach(({ c, value }) => {
      if (!c.region) return;
      const r = (byRegion[c.region] ??= { sum: 0, count: 0 });
      r.sum += value;
      r.count += 1;
    });
    const bestRegion = Object.entries(byRegion)
      .filter(([, r]) => r.count >= MIN_CONTACTS_FOR_REGION)
      .map(([code, r]) => ({ code, avg: r.sum / r.count, count: r.count }))
      .sort((a, b) => b.avg - a.avg)[0];

    const byMaterial: Record<string, number> = {};
    contacts.forEach(c => c.materials.forEach(name => {
      byMaterial[name] = (byMaterial[name] ?? 0) + 1;
    }));
    const materials = Object.entries(byMaterial)
      .map(([name, people]) => ({ name, people, payout: materialPayout(name) }))
      .filter(m => m.payout > 0)
      .sort((a, b) => b.people * b.payout - a.people * a.payout);
    const maxTotal = Math.max(1, ...materials.map(m => m.people * m.payout));

    return {
      avgPerPerson: values.length ? total / values.length : 0,
      bestRegion: bestRegion
        ? { name: REGIONS.find(r => r.code === bestRegion.code)?.name ?? bestRegion.code, avg: bestRegion.avg, count: bestRegion.count }
        : null,
      materials,
      maxTotal,
    };
  }, [contacts, allMaterials]);

  return (
    <div className="card profit-card">
      <div className="profit-header">
        <div>
          <h3>Hodnota výkupu na člověka</h3>
          <p className="profit-sub">
            {scopeName ? `${scopeName} · ` : ''}{contacts.length} kontaktů · odhad podle cen v Materiálech
          </p>
        </div>
      </div>

      <div className="profit-stats">
        <div className="profit-stat profit-stat-main">
          <span className="profit-label">Průměrně za 1 výkup na člověka</span>
          <span className="profit-value">{fmt(stats.avgPerPerson)}</span>
          <span className="profit-hint">kolik jednomu člověku vyplatíte, když přijde jednou</span>
        </div>
        {stats.bestRegion && (
          <div className="profit-stat">
            <span className="profit-label">Kraj s nejcennějšími dodavateli</span>
            <span className="profit-value profit-value-sm">{stats.bestRegion.name}</span>
            <span className="profit-hint">
              {fmt(stats.bestRegion.avg)} na člověka · {stats.bestRegion.count} {peopleLabel(stats.bestRegion.count)}
            </span>
          </div>
        )}
      </div>

      {stats.materials.length > 0 && (
        <div className="profit-materials">
          <span className="profit-label">Kdo nosí co</span>
          <ul>
            {stats.materials.map(m => (
              <li key={m.name} className="profit-material">
                <span className="profit-material-name">{m.name}</span>
                <span className="profit-material-bar">
                  <span style={{ width: `${(m.people * m.payout / stats.maxTotal) * 100}%` }} />
                </span>
                <span className="profit-material-people">{m.people} {peopleLabel(m.people)}</span>
                <span className="profit-material-payout">{fmt(m.payout)} / výkup</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="profit-note">
        Odhad: člověk přinese, co obvykle nosí (např. železo 300 kg, papír 150 kg, měď 8 kg), a vy mu vyplatíte podle cen v Materiálech. Pořadí materiálů = počet lidí × výplata za výkup. Kraje s méně než {MIN_CONTACTS_FOR_REGION} kontakty se nepočítají.
      </p>
    </div>
  );
}
