import type { RegionCode, Country, Material } from '../../types';
import { REGIONS } from '../../types';
import { useLanguage } from '../../lib/LanguageContext';
import { t } from '../../lib/i18n';
import './ContactsFilter.css';

interface ContactsFilterProps {
  search: string;
  onSearchChange: (v: string) => void;
  filterRegion: RegionCode | '';
  onRegionChange: (v: RegionCode | '') => void;
  filterCountry: Country | '';
  onCountryChange: (v: Country | '') => void;
  filterMaterial: string;
  onMaterialChange: (v: string) => void;
  allMaterials: Material[];
}

export function ContactsFilter({
  search, onSearchChange,
  filterRegion, onRegionChange,
  filterCountry, onCountryChange,
  filterMaterial, onMaterialChange,
  allMaterials,
}: ContactsFilterProps) {
  const lang = useLanguage();
  const hasFilters = search || filterRegion || filterCountry || filterMaterial;

  const clearAll = () => {
    onSearchChange('');
    onRegionChange('');
    onCountryChange('');
    onMaterialChange('');
  };

  return (
    <div className="contacts-filter card">
      <div className="filter-search">
        <span className="filter-search-icon">🔍</span>
        <input
          type="text"
          placeholder={t('filter_search_ph', lang)}
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="filter-input"
        />
      </div>

      <div className="filter-selects">
        <select
          value={filterCountry}
          onChange={e => onCountryChange(e.target.value as Country | '')}
          className="filter-select"
        >
          <option value="">{t('filter_all_countries', lang)}</option>
          <option value="CZ">{t('filter_cz', lang)}</option>
          <option value="zahraničí">{t('filter_foreign', lang)}</option>
        </select>

        <select
          value={filterRegion}
          onChange={e => onRegionChange(e.target.value as RegionCode | '')}
          className="filter-select"
        >
          <option value="">{t('filter_all_regions', lang)}</option>
          {REGIONS.map(r => (
            <option key={r.code} value={r.code}>{r.name}</option>
          ))}
        </select>

        <select
          value={filterMaterial}
          onChange={e => onMaterialChange(e.target.value)}
          className="filter-select"
        >
          <option value="">{t('filter_all_materials', lang)}</option>
          {allMaterials.map(m => (
            <option key={m.name} value={m.name}>{m.name}</option>
          ))}
        </select>

        {hasFilters && (
          <button className="filter-clear" onClick={clearAll}>
            {t('filter_clear', lang)}
          </button>
        )}
      </div>
    </div>
  );
}
