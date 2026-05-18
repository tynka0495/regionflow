import './EuropeGrid.css';

interface EuropeGridProps {
  selectedCountry: string | null;
  onCountrySelect: (code: string | null) => void;
  contactCountByCountry: Record<string, number>;
}

const EU_COUNTRIES: { code: string; name: string }[] = [
  { code: 'DE', name: 'Německo' },
  { code: 'AT', name: 'Rakousko' },
  { code: 'SK', name: 'Slovensko' },
  { code: 'PL', name: 'Polsko' },
  { code: 'HU', name: 'Maďarsko' },
  { code: 'FR', name: 'Francie' },
  { code: 'IT', name: 'Itálie' },
  { code: 'ES', name: 'Španělsko' },
  { code: 'NL', name: 'Nizozemsko' },
  { code: 'BE', name: 'Belgie' },
  { code: 'CH', name: 'Švýcarsko' },
  { code: 'SE', name: 'Švédsko' },
  { code: 'NO', name: 'Norsko' },
  { code: 'DK', name: 'Dánsko' },
  { code: 'FI', name: 'Finsko' },
  { code: 'PT', name: 'Portugalsko' },
  { code: 'RO', name: 'Rumunsko' },
  { code: 'BG', name: 'Bulharsko' },
  { code: 'HR', name: 'Chorvatsko' },
  { code: 'SI', name: 'Slovinsko' },
  { code: 'GR', name: 'Řecko' },
  { code: 'IE', name: 'Irsko' },
  { code: 'LT', name: 'Litva' },
  { code: 'LV', name: 'Lotyšsko' },
  { code: 'EE', name: 'Estonsko' },
  { code: 'GB', name: 'Velká Británie' },
  { code: 'RS', name: 'Srbsko' },
  { code: 'BA', name: 'Bosna' },
  { code: 'AL', name: 'Albánie' },
  { code: 'MK', name: 'Severní Makedonie' },
];

function CountryFlag({ code }: { code: string }) {
  const colors: Record<string, [string, string]> = {
    DE: ['#000', '#D00'],  AT: ['#ED2939', '#fff'],
    SK: ['#fff', '#0B4EA2'], PL: ['#fff', '#DC143C'],
    HU: ['#CE2939', '#fff'], FR: ['#0055A4', '#EF4135'],
    IT: ['#009246', '#CE2B37'], ES: ['#AA151B', '#F1BF00'],
    NL: ['#AE1C28', '#21468B'], BE: ['#000', '#FDDA24'],
    CH: ['#FF0000', '#fff'], SE: ['#006AA7', '#FECC02'],
    NO: ['#EF2B2D', '#002868'], DK: ['#C60C30', '#fff'],
    FI: ['#003580', '#fff'], PT: ['#006600', '#FF0000'],
    RO: ['#002B7F', '#FCD116'], BG: ['#fff', '#00966E'],
    HR: ['#FF0000', '#0093DD'], SI: ['#003DA5', '#FF0000'],
    GR: ['#0D5EAF', '#fff'], IE: ['#169B62', '#FF883E'],
    LT: ['#FDB913', '#006A44'], LV: ['#9E3039', '#fff'],
    EE: ['#0072CE', '#000'], GB: ['#012169', '#C8102E'],
    RS: ['#C6363C', '#0C4076'], BA: ['#002395', '#FFCD00'],
    AL: ['#E41E20', '#000'], MK: ['#CE2028', '#F7E116'],
  };

  const [c1, c2] = colors[code] ?? ['#94a3b8', '#cbd5e1'];

  return (
    <svg width="28" height="18" viewBox="0 0 28 18" className="country-flag">
      <rect width="28" height="18" fill={c1} rx="2" />
      <rect y="6" width="28" height="6" fill={c2} />
    </svg>
  );
}

export function EuropeGrid({ selectedCountry, onCountrySelect, contactCountByCountry }: EuropeGridProps) {
  const withContacts = EU_COUNTRIES.filter(c => contactCountByCountry[c.code]);
  const withoutContacts = EU_COUNTRIES.filter(c => !contactCountByCountry[c.code]);
  const sorted = [...withContacts, ...withoutContacts];

  return (
    <div className="europe-grid">
      {sorted.map(({ code, name }) => {
        const count = contactCountByCountry[code] ?? 0;
        const isSelected = selectedCountry === code;
        const hasContacts = count > 0;

        return (
          <button
            key={code}
            className={`country-card ${isSelected ? 'selected' : ''} ${!hasContacts ? 'empty' : ''}`}
            onClick={() => onCountrySelect(isSelected ? null : code)}
            disabled={!hasContacts}
          >
            <CountryFlag code={code} />
            <div className="country-card-info">
              <span className="country-card-name">{name}</span>
              {hasContacts && (
                <span className="country-card-count">{count}</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
