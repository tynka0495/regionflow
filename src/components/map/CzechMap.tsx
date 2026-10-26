import { useState, useEffect, useMemo } from 'react';
import { geoPath, geoMercator } from 'd3-geo';
import type { FeatureCollection, Feature } from 'geojson';
import type { Country, RegionCode } from '../../types';
import './CzechMap.css';

interface RegionProperties {
  code: string;
  name: string;
}

type RegionFeature = Feature & { properties: RegionProperties };

interface CzechMapProps {
  country: Exclude<Country, 'EU'>;
  selectedRegion: RegionCode | null;
  onRegionSelect: (code: RegionCode | null) => void;
  contactCountByRegion: Record<string, number>;
}

const W = 700;
const H = 440;

const GEO_URL: Record<Exclude<Country, 'EU'>, string> = {
  CZ: '/czech-regions.geojson',
  SK: '/slovak-regions.geojson',
};

const SHORT_NAMES: Record<string, string> = {
  BA: 'Bratislavský',
  TT: 'Trnavský',
  TN: 'Trenčiansky',
  NR: 'Nitriansky',
  ZA: 'Žilinský',
  BB: 'Banskobystrický',
  PO: 'Prešovský',
  KE: 'Košický',
  PHA: 'Praha',
  STC: 'Středočeský',
  JHC: 'Jihočeský',
  PLK: 'Plzeňský',
  KVK: 'Karlovarský',
  ULK: 'Ústecký',
  LBK: 'Liberecký',
  HKK: 'Kr. Hradecký',
  PAK: 'Pardubický',
  VYS: 'Vysočina',
  JHM: 'Jihomoravský',
  OLK: 'Olomoucký',
  ZLK: 'Zlínský',
  MSK: 'Moravskoslezský',
};

const LABEL_OFFSETS: Record<string, [number, number]> = {
  PHA: [0, -16],
  STC: [55, -20],
  BA: [0, 33],
  TT: [10, -55],
};

export function CzechMap({ country, selectedRegion, onRegionSelect, contactCountByRegion }: CzechMapProps) {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  useEffect(() => {
    setGeoData(null);
    fetch(GEO_URL[country])
      .then(r => r.json())
      .then((data: FeatureCollection) => setGeoData(data))
      .catch(console.error);
  }, [country]);

  const { pathGen, features } = useMemo(() => {
    if (!geoData) return { pathGen: null, features: [] as RegionFeature[] };
    const projection = geoMercator().fitSize([W, H], geoData);
    return {
      pathGen: geoPath().projection(projection),
      features: geoData.features as RegionFeature[],
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
    <div className="czech-map-container">
      <svg viewBox={`0 0 ${W} ${H}`} className="czech-map-svg">
        {features.map(feature => {
          const code = feature.properties.code as RegionCode;
          const isSelected = selectedRegion === code;
          const isHovered = hoveredRegion === code;
          const count = contactCountByRegion[code] ?? 0;
          return (
            <path
              key={code}
              d={pathGen(feature) ?? ''}
              className={`map-region ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${count > 0 ? 'has-contacts' : ''}`}
              onClick={() => onRegionSelect(isSelected ? null : code)}
              onMouseEnter={() => setHoveredRegion(code)}
              onMouseLeave={() => setHoveredRegion(null)}
            />
          );
        })}

        {features.map(feature => {
          const code = feature.properties.code as RegionCode;
          const centroid = pathGen.centroid(feature);
          const label = SHORT_NAMES[code] ?? feature.properties.name;
          const [ox, oy] = LABEL_OFFSETS[code] ?? [0, 0];
          if (!centroid || isNaN(centroid[0])) return null;
          return (
            <text
              key={`label-${code}`}
              x={centroid[0] + ox}
              y={centroid[1] + oy}
              className={`map-label ${selectedRegion === code ? 'map-label-selected' : ''}`}
              textAnchor="middle"
              dominantBaseline="middle"
              pointerEvents="none"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
