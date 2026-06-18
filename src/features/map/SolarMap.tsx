import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { HourlyValue } from '@/types/solar';

interface Props {
  lat: number;
  lon: number;
  solar: HourlyValue[];
  currentHour: number;
}

// CartoDB dark raster tiles — free, attribution required, no API key
const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [{ id: 'base', type: 'raster', source: 'carto' }],
};

export default function SolarMap({ lat, lon, solar, currentHour }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // Current production intensity (0–1) for visual scaling
  const maxKW = Math.max(...solar.map((h) => h.value), 1) / 1000;
  const currentKW = (solar[currentHour]?.value ?? 0) / 1000;
  const intensity = maxKW > 0 ? currentKW / maxKW : 0;

  // Outer glow radius scales with intensity: 40–120 meters (visual metaphor, not data)
  const glowRadius = 40 + intensity * 80;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center: [lon, lat],
      zoom: 8.5,
      interactive: false, // non-interactive widget
      attributionControl: false,
    });

    map.on('load', () => {
      // User location source
      map.addSource('loc', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lon, lat] },
          properties: {},
        },
      });

      // Outer warm glow (scales with solar intensity)
      map.addLayer({
        id: 'glow-outer',
        type: 'circle',
        source: 'loc',
        paint: {
          'circle-radius': glowRadius,
          'circle-color': '#10B981',
          'circle-opacity': 0.08 + intensity * 0.10,
          'circle-blur': 1,
        },
      });

      // Inner pulse circle
      map.addLayer({
        id: 'glow-inner',
        type: 'circle',
        source: 'loc',
        paint: {
          'circle-radius': 12,
          'circle-color': '#10B981',
          'circle-opacity': 0.85,
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#86efac',
          'circle-stroke-opacity': 0.7,
        },
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Run once per lat/lon change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon]);

  // Update glow radius when intensity changes without remounting
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    map.setPaintProperty('glow-outer', 'circle-radius', glowRadius);
    map.setPaintProperty('glow-outer', 'circle-opacity', 0.08 + intensity * 0.10);
  }, [glowRadius, intensity]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ height: 210, border: '1px solid rgba(255,255,255,0.10)' }}
    >
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />

      {/* Fade bottom edge into page bg */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
        style={{
          background: 'linear-gradient(to bottom, transparent, rgba(6,58,42,0.7))',
        }}
      />

      {/* Label */}
      <div className="absolute bottom-2.5 right-3">
        <span
          className="rounded-full px-2 py-0.5 text-[9px] text-warm/40"
          style={{ background: 'rgba(6,58,42,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          Jouw locatie · © OSM · CARTO
        </span>
      </div>
    </div>
  );
}
