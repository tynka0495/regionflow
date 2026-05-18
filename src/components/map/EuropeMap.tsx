import { useState, useEffect, useMemo } from 'react';
import { geoPath, geoMercator } from 'd3-geo';
import type { FeatureCollection, Feature } from 'geojson';
import './EuropeMap.css';

interface CountryProperties {
  code: string;
  name: string;
}

type CountryFeature = Feature & { properties: CountryProperties };

interface EuropeMapProps {
  selectedCountry: string | null;
  onCountrySelect: (code: string | null) => void;
  contactCountByCountry: Record<string, number>;
}

const W = 700;
const H = 500;

const EXCLUDED = ['RU', 'BY', 'UA', 'TR', 'GE', 'AM', 'AZ', 'IL'];

export function EuropeMap({ selectedCountry, onCountrySelect, contactCountByCountry }: EuropeMapProps) {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string; count: number } | null>(null);

  useEffect(() => {
    fetch('/europe-countries.geojson')
      .then(r => r.json())
      .then((data: FeatureCollection) => {
        const filtered = {
          ...data,
          features: data.features.filter(
            (f: Feature) => !EXCLUDED.includes((f as CountryFeature).properties.code)
          ),
        };
        setGeoData(filtered);
      })
      .catch(console.error);
  }, []);

  const { pathGen, features } = useMemo(() => {
    if (!geoData) return { pathGen: null, features: [] as CountryFeature[] };
    const projection = geoMercator()
      .center([13, 52])
      .scale(650)
      .translate([W / 2, H / 2]);
    return {
      pathGen: geoPath().projection(projection),
      features: geoData.features as CountryFeature[],
    };
  }, [geoData]);

  if (!geoData || !pathGen) {
    return (
      <div className="map-loading">
        <div className="map-loading-spinner" />
        <span>Načítám mapu...</span>
      </div>
    );
  }

  return (
    <div className="europe-map-container">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="europe-map-svg"
        onMouseLeave={() => { setTooltip(null); setHoveredCountry(null); }}
      >
        {features.map(feature => {
          const code = feature.properties.code;
          const isSelected = selectedCountry === code;
          const isHovered = hoveredCountry === code;
          const pathD = pathGen(feature) ?? '';
          const count = contactCountByCountry[code] ?? 0;

          return (
            <path
              key={code}
              d={pathD}
              className={`europe-region ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${count > 0 ? 'has-contacts' : ''}`}
              onClick={() => onCountrySelect(isSelected ? null : code)}
              onMouseEnter={e => {
                setHoveredCountry(code);
                const svgEl = (e.currentTarget as SVGPathElement).closest('svg')!;
                const rect = svgEl.getBoundingClientRect();
                setTooltip({
                  x: (e.clientX - rect.left) * (W / rect.width),
                  y: (e.clientY - rect.top) * (H / rect.height) - 24,
                  name: feature.properties.name,
                  count,
                });
              }}
              onMouseLeave={() => { setHoveredCountry(null); setTooltip(null); }}
            />
          );
        })}

        {tooltip && (
          <g pointerEvents="none">
            <rect
              x={Math.min(tooltip.x - 65, W - 135)}
              y={Math.max(tooltip.y - 30, 4)}
              width={130}
              height={tooltip.count > 0 ? 38 : 24}
              rx={6}
              fill="#1e293b"
              opacity={0.93}
            />
            <text
              x={Math.min(tooltip.x, W - 70)}
              y={Math.max(tooltip.y - 18, 16)}
              textAnchor="middle"
              fill="#fff"
              fontSize={11}
              fontWeight={600}
            >
              {tooltip.name}
            </text>
            {tooltip.count > 0 && (
              <text
                x={Math.min(tooltip.x, W - 70)}
                y={Math.max(tooltip.y - 5, 29)}
                textAnchor="middle"
                fill="#a5b4fc"
                fontSize={10}
              >
                {tooltip.count} {tooltip.count === 1 ? 'kontakt' : 'kontakty'}
              </text>
            )}
          </g>
        )}
      </svg>
    </div>
  );
}
