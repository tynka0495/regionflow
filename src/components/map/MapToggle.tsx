import './MapToggle.css';

export type MapMode = 'CZ' | 'EU';

interface MapToggleProps {
  mode: MapMode;
  onChange: (mode: MapMode) => void;
}

function FlagCZ() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" className="flag-icon">
      <rect width="20" height="7" fill="#fff" />
      <rect y="7" width="20" height="7" fill="#D7141A" />
      <polygon points="0,0 10,7 0,14" fill="#11457E" />
    </svg>
  );
}

function FlagEU() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" className="flag-icon">
      <rect width="20" height="14" fill="#003399" />
      {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const x = 10 + 4.5 * Math.cos(angle);
        const y = 7 + 4.5 * Math.sin(angle);
        return <text key={i} x={x} y={y} fontSize="3" textAnchor="middle" dominantBaseline="middle" fill="#FFCC00">★</text>;
      })}
    </svg>
  );
}

export function MapToggle({ mode, onChange }: MapToggleProps) {
  return (
    <div className="map-toggle">
      <button
        className={`map-toggle-btn ${mode === 'CZ' ? 'active' : ''}`}
        onClick={() => onChange('CZ')}
      >
        <FlagCZ />
        Česká republika
      </button>
      <button
        className={`map-toggle-btn ${mode === 'EU' ? 'active' : ''}`}
        onClick={() => onChange('EU')}
      >
        <FlagEU />
        Zahraničí
      </button>
    </div>
  );
}
