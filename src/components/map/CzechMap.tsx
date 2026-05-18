import { useState, useEffect, useMemo } from 'react';
import { geoPath, geoMercator } from 'd3-geo';
import type { FeatureCollection, Feature } from 'geojson';
import type { RegionCode } from '../../types';
import './CzechMap.css';

interface RegionProperties {
  code: string;
  name: string;
}

type RegionFeature = Feature & { properties: RegionProperties };

interface CzechMapProps {
  selectedRegion: RegionCode | null;
  onRegionSelect: (code: RegionCode | null) => void;
  contactCountByRegion: Record<string, number>;
}

const W = 700;
const H = 440;


export function CzechMap({ selectedRegion, onRegionSelect, contactCountByRegion }: CzechMapProps) {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  useEffect(() => {
    fetch('/czech-regions.geojson')
      .then(r => r.json())
      .then((data: FeatureCollection) => setGeoData(data))
      .catch(console.error);
  }, []);

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
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="czech-map-svg"
      >
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

      </svg>
    </div>
  );
}
