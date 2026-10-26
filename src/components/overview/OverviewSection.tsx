import { useMemo, useState } from 'react';
import { Layout } from '../layout/Layout';
import { ContactsFilter } from '../contacts/ContactsFilter';
import { ProfitEstimate } from './ProfitEstimate';
import { OverviewStats } from './OverviewStats';
import type { Contact, Country, Material, RegionCode } from '../../types';
import { REGIONS } from '../../types';
import { useLanguage } from '../../lib/LanguageContext';
import { t } from '../../lib/i18n';

interface OverviewSectionProps {
  contacts: Contact[];
  allMaterials: Material[];
}

export function OverviewSection({ contacts, allMaterials }: OverviewSectionProps) {
  const lang = useLanguage();
  const [filterRegion, setFilterRegion] = useState<RegionCode | ''>('');
  const [filterCountry, setFilterCountry] = useState<Country | ''>('');
  const [filterMaterial, setFilterMaterial] = useState('');

  const filtered = useMemo(() => contacts.filter(c => {
    if (filterRegion && c.region !== filterRegion) return false;
    if (filterCountry && c.country !== filterCountry) return false;
    if (filterMaterial && !c.materials.includes(filterMaterial)) return false;
    return true;
  }), [contacts, filterRegion, filterCountry, filterMaterial]);

  const scopeName = filterRegion ? REGIONS.find(r => r.code === filterRegion)?.name : null;

  return (
    <Layout title={t('nav_overview', lang)} subtitle="Kolik vyplatíte za výkup a kdo vám nosí co">
      <ContactsFilter
        filterRegion={filterRegion}
        onRegionChange={setFilterRegion}
        filterCountry={filterCountry}
        onCountryChange={setFilterCountry}
        filterMaterial={filterMaterial}
        onMaterialChange={setFilterMaterial}
        allMaterials={allMaterials}
      />
      <ProfitEstimate contacts={filtered} allMaterials={allMaterials} scopeName={scopeName} />
      <OverviewStats contacts={filtered} allMaterials={allMaterials} />
    </Layout>
  );
}
