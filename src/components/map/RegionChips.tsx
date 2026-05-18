import { REGIONS } from '../../types';
import type { RegionCode } from '../../types';
import './RegionChips.css';

interface RegionChipsProps {
  selectedRegion: RegionCode | null;
  onRegionSelect: (code: RegionCode | null) => void;
  contactCountByRegion: Record<string, number>;
}

export function RegionChips({ selectedRegion, onRegionSelect, contactCountByRegion }: RegionChipsProps) {
  return (
    <div className="region-chips">
      {REGIONS.map(({ code, name }) => {
        const count = contactCountByRegion[code] ?? 0;
        const isSelected = selectedRegion === code;
        const shortName = name.replace(' kraj', '').replace('Kraj ', '');

        return (
          <button
            key={code}
            className={`region-chip ${isSelected ? 'selected' : ''} ${count === 0 ? 'empty' : ''}`}
            onClick={() => onRegionSelect(isSelected ? null : code)}
          >
            {shortName}
            {count > 0 && <span className="region-chip-count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
