import { useMemo } from 'react';
import type { Contact, Material } from '../../types';
import { REGIONS, euCountryName } from '../../types';
import { contactPayout, formatKc, materialPayout, peopleLabel } from '../../lib/payout';
import './OverviewStats.css';

interface OverviewStatsProps {
  contacts: Contact[];
  allMaterials: Material[];
}

const TOP_SUPPLIERS = 10;

const areaName = (c: Contact) =>
  c.country === 'EU' ? euCountryName(c.euCountry) : REGIONS.find(r => r.code === c.region)?.name ?? '—';

const pct = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);

export function OverviewStats({ contacts, allMaterials }: OverviewStatsProps) {
  const stats = useMemo(() => {
    const byName = new Map(allMaterials.map(m => [m.name, m]));

    const sms = contacts.filter(c => c.smsEnabled);
    const email = contacts.filter(c => !!c.email && !!c.emailEnabled);
    const both = contacts.filter(c => c.smsEnabled && !!c.email && !!c.emailEnabled).length;
    const nobody = contacts.length - sms.length - email.length + both;

    const areas: Record<string, { name: string; count: number; sum: number }> = {};
    contacts.forEach(c => {
      const name = areaName(c);
      const a = (areas[name] ??= { name, count: 0, sum: 0 });
      a.count += 1;
      a.sum += contactPayout(c, byName);
    });
    const areaRows = Object.values(areas).sort((a, b) => b.count - a.count);
    const maxAreaCount = Math.max(1, ...areaRows.map(a => a.count));

    const suppliers = contacts
      .map(c => ({ c, value: contactPayout(c, byName) }))
      .filter(s => s.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, TOP_SUPPLIERS);

    const broughtCount: Record<string, number> = {};
    contacts.forEach(c => c.materials.forEach(m => {
      broughtCount[m] = (broughtCount[m] ?? 0) + 1;
    }));
    const notBought = Object.entries(broughtCount)
      .filter(([name]) => materialPayout(byName.get(name)) === 0)
      .sort((a, b) => b[1] - a[1]);
    const nobodyBrings = allMaterials
      .filter(m => materialPayout(m) > 0 && !broughtCount[m.name])
      .map(m => m.name);

    return { sms: sms.length, email: email.length, both, nobody, areaRows, maxAreaCount, suppliers, notBought, nobodyBrings };
  }, [contacts, allMaterials]);

  const total = contacts.length;

  return (
    <div className="overview-grid">
      <section className="card overview-card">
        <h3>Koho oslovíte</h3>
        <p className="overview-sub">Kolik lidí můžete kontaktovat, podle souhlasů</p>
        <div className="reach-bar">
          <span className="reach-seg reach-both" style={{ width: `${pct(stats.both, total)}%` }} />
          <span className="reach-seg reach-sms" style={{ width: `${pct(stats.sms - stats.both, total)}%` }} />
          <span className="reach-seg reach-email" style={{ width: `${pct(stats.email - stats.both, total)}%` }} />
        </div>
        <ul className="reach-legend">
          <li><span className="reach-dot reach-both" />SMS i e-mail <strong>{stats.both}</strong></li>
          <li><span className="reach-dot reach-sms" />jen SMS <strong>{stats.sms - stats.both}</strong></li>
          <li><span className="reach-dot reach-email" />jen e-mail <strong>{stats.email - stats.both}</strong></li>
          <li><span className="reach-dot reach-none" />nikdo, jen telefonát <strong>{stats.nobody}</strong></li>
        </ul>
        <p className="overview-note">SMS pošlete {stats.sms} lidem ({pct(stats.sms, total)} %), e-mail {stats.email} lidem ({pct(stats.email, total)} %).</p>
      </section>

      <section className="card overview-card">
        <h3>Příležitosti</h3>
        <p className="overview-sub">Co lidé nosí a vy nevykupujete – a naopak</p>
        <div className="opportunity">
          <span className="overview-label">Nosí, ale nevykupujete (bez ceny nebo vypnuto)</span>
          {stats.notBought.length === 0 ? (
            <p className="overview-empty">Nic – vykupujete všechno, co lidé nosí.</p>
          ) : (
            <ul className="chip-list">
              {stats.notBought.map(([name, count]) => (
                <li key={name} className="chip chip-warn">{name} · {count} {peopleLabel(count)}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="opportunity">
          <span className="overview-label">Vykupujete, ale nikdo nenosí</span>
          {stats.nobodyBrings.length === 0 ? (
            <p className="overview-empty">Nic – každý vykupovaný materiál někdo nosí.</p>
          ) : (
            <ul className="chip-list">
              {stats.nobodyBrings.map(name => <li key={name} className="chip">{name}</li>)}
            </ul>
          )}
        </div>
      </section>

      <section className="card overview-card">
        <h3>Kraje</h3>
        <p className="overview-sub">Kde máte nejvíc lidí a kolik jim průměrně vyplatíte</p>
        <ul className="area-list">
          {stats.areaRows.map(a => (
            <li key={a.name} className="area-row">
              <span className="area-row-name">{a.name}</span>
              <span className="area-row-bar"><span style={{ width: `${(a.count / stats.maxAreaCount) * 100}%` }} /></span>
              <span className="area-row-count">{a.count} {peopleLabel(a.count)}</span>
              <span className="area-row-avg">{formatKc(a.sum / a.count)} / člověk</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card overview-card">
        <h3>Top {TOP_SUPPLIERS} dodavatelů</h3>
        <p className="overview-sub">Komu za jeden výkup vyplatíte nejvíc – o ty stojí za to pečovat</p>
        <ol className="supplier-list">
          {stats.suppliers.map(({ c, value }) => (
            <li key={c.id} className="supplier-row">
              <div>
                <div className="supplier-name">{c.name}</div>
                <div className="supplier-meta">{c.city} · {c.materials.join(', ')}</div>
              </div>
              <span className="supplier-value">{formatKc(value)}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
