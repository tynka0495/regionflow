import type { RegionCode, Country, Material } from '../../types';
import { COUNTRY_NAMES, regionsOf } from '../../types';
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
          onChange={e => {
            onCountryChange(e.target.value as Country | '');
            onRegionChange('');
          }}
          className="filter-select"
        >
          <option value="">{t('filter_all_countries', lang)}</option>
          <option value="CZ">{t('filter_cz', lang)}</option>
          <option value="SK">{t('filter_sk', lang)}</option>
          <option value="EU">{t('filter_eu', lang)}</option>
        </select>

        {filterCountry !== 'EU' && (
        <select
          value={filterRegion}
          onChange={e => onRegionChange(e.target.value as RegionCode | '')}
          className="filter-select"
        >
          <option value="">{t('filter_all_regions', lang)}</option>
          {(filterCountry ? [filterCountry] : (['CZ', 'SK'] as Country[])).map(country => (
            <optgroup key={country} label={COUNTRY_NAMES[country]}>
              {regionsOf(country).map(r => (
                <option key={r.code} value={r.code}>{r.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
        )}

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
