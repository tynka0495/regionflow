import type { RegionCode, Country, Material } from '../../types';
import { REGIONS } from '../../types';
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
          placeholder="Hledat podle jména, telefonu nebo města..."
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
          <option value="">Všechny země</option>
          <option value="CZ">Česká republika</option>
          <option value="zahraničí">Zahraničí</option>
        </select>

        <select
          value={filterRegion}
          onChange={e => onRegionChange(e.target.value as RegionCode | '')}
          className="filter-select"
        >
          <option value="">Všechny kraje</option>
          {REGIONS.map(r => (
            <option key={r.code} value={r.code}>{r.name}</option>
          ))}
        </select>

        <select
          value={filterMaterial}
          onChange={e => onMaterialChange(e.target.value)}
          className="filter-select"
        >
          <option value="">Všechny materiály</option>
          {allMaterials.map(m => (
            <option key={m.name} value={m.name}>{m.name.charAt(0).toUpperCase() + m.name.slice(1)}</option>
          ))}
        </select>

        {hasFilters && (
          <button className="filter-clear" onClick={clearAll}>
            ✕ Zrušit filtry
          </button>
        )}
      </div>
    </div>
  );
}
