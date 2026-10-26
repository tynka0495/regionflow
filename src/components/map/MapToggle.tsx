import type { Country } from '../../types';
import './MapToggle.css';

export type MapMode = Country;

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

function FlagSK() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" className="flag-icon">
      <rect width="20" height="14" fill="#fff" />
      <rect y="4.67" width="20" height="4.67" fill="#0B4EA2" />
      <rect y="9.33" width="20" height="4.67" fill="#EE1C25" />
      <path d="M3.2 3.2h4.6v4.6c0 2-1.2 3.2-2.3 3.8-1.1-.6-2.3-1.8-2.3-3.8z" fill="#EE1C25" stroke="#fff" strokeWidth="0.5" />
      <path d="M5.5 4.3v5.4M4.3 5.6h2.4M3.9 6.9h3.2" stroke="#fff" strokeWidth="0.6" />
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
        className={`map-toggle-btn ${mode === 'SK' ? 'active' : ''}`}
        onClick={() => onChange('SK')}
      >
        <FlagSK />
        Slovenská republika
      </button>
      <button
        className={`map-toggle-btn ${mode === 'EU' ? 'active' : ''}`}
        onClick={() => onChange('EU')}
      >
        <FlagEU />
        EU
      </button>
    </div>
  );
}
