import React, { useEffect, useRef } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

import type { LineString } from 'geojson';

import '../../styles/hero-map.css';

interface HeroRoute {
  id: string;
  color: string;
  geometry: LineString;
}

interface HeroCallout {
  id: string;
  label: string;
  detail?: string;
  coordinate: [number, number];
  color?: string;
}

interface HeroMapProps {
  routes: HeroRoute[];
  center: [number, number];
  zoom: number;
  currentLocation: {
    label: string;
    coordinate: [number, number];
  };
  callouts?: HeroCallout[];
  className?: string;
}

type MapLibreModule = typeof import('maplibre-gl');
type MapInstance = import('maplibre-gl').Map;
type StyleSpecification = import('maplibre-gl').StyleSpecification;

type CalloutFeature = {
  type: 'Feature';
  properties: { id: string; label: string; detail: string; color: string };
  geometry: { type: 'Point'; coordinates: [number, number] };
};

type RouteFeature = {
  type: 'Feature';
  properties: { routeId: string; color: string };
  geometry: LineString;
};

const haversineKm = ([lon1, lat1]: [number, number], [lon2, lat2]: [number, number]): number => {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const smoothRoute = (points: [number, number][]): [number, number][] => {
  if (points.length < 3) return points;
  const result: [number, number][] = [];
  const catmullRom = (p0: number, p1: number, p2: number, p3: number, t: number) => {
    const v0 = (p2 - p0) * 0.5;
    const v1 = (p3 - p1) * 0.5;
    return (
      (2 * p1 - 2 * p2 + v0 + v1) * t * t * t +
      (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t * t +
      v0 * t +
      p1
    );
  };
  const sample = 16;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[Math.min(i + 1, points.length - 1)];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    for (let j = 0; j < sample; j += 1) {
      const t = j / sample;
      result.push([
        catmullRom(p0[0], p1[0], p2[0], p3[0], t),
        catmullRom(p0[1], p1[1], p2[1], p3[1], t),
      ]);
    }
  }
  result.push(points[points.length - 1]);
  return result;
};
const totalDistanceKm = (coords: [number, number][]) => {
  let km = 0;
  for (let i = 1; i < coords.length; i += 1) {
    km += haversineKm(coords[i - 1], coords[i]);
  }
  return km;
};

const pointAlong = (coords: [number, number][], distanceKm: number): [number, number] => {
  if (coords.length === 0) return [0, 0];
  let travelled = 0;
  for (let i = 1; i < coords.length; i += 1) {
    const segment = haversineKm(coords[i - 1], coords[i]);
    if (travelled + segment >= distanceKm) {
      const ratio = (distanceKm - travelled) / segment;
      const [lon1, lat1] = coords[i - 1];
      const [lon2, lat2] = coords[i];
      return [lon1 + (lon2 - lon1) * ratio, lat1 + (lat2 - lat1) * ratio];
    }
    travelled += segment;
  }
  return coords[coords.length - 1];
};

const formatDetail = (km: number): string => {
  const mph = 55;
  const miles = km * 0.621371;
  const hours = miles / mph;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h ? `${h}h ` : ''}${m}m · ${Math.round(miles)} mi`;
};

const townFeatures: CalloutFeature[] = [
  {
    type: 'Feature',
    properties: { id: 'Waxhaw', label: 'Waxhaw', detail: '', color: '#ffffff' },
    geometry: { type: 'Point', coordinates: [-80.743, 34.924] },
  },
  {
    type: 'Feature',
    properties: { id: 'Charlotte', label: 'Charlotte', detail: '', color: '#ffffff' },
    geometry: { type: 'Point', coordinates: [-80.843, 35.227] },
  },
  {
    type: 'Feature',
    properties: { id: 'Gastonia', label: 'Gastonia', detail: '', color: '#ffffff' },
    geometry: { type: 'Point', coordinates: [-81.187, 35.262] },
  },
  {
    type: 'Feature',
    properties: { id: 'Lincolnton', label: 'Lincolnton', detail: '', color: '#ffffff' },
    geometry: { type: 'Point', coordinates: [-81.254, 35.473] },
  },
  {
    type: 'Feature',
    properties: { id: 'Statesville', label: 'Statesville', detail: '', color: '#ffffff' },
    geometry: { type: 'Point', coordinates: [-80.889, 35.781] },
  },
  {
    type: 'Feature',
    properties: { id: 'Hickory', label: 'Hickory', detail: '', color: '#ffffff' },
    geometry: { type: 'Point', coordinates: [-81.341, 35.733] },
  },
  {
    type: 'Feature',
    properties: { id: 'Lenoir', label: 'Lenoir', detail: '', color: '#ffffff' },
    geometry: { type: 'Point', coordinates: [-81.538, 35.914] },
  },
  {
    type: 'Feature',
    properties: { id: 'Wilkesboro', label: 'Wilkesboro', detail: '', color: '#ffffff' },
    geometry: { type: 'Point', coordinates: [-81.15, 36.145] },
  },
  {
    type: 'Feature',
    properties: { id: 'Blowing Rock', label: 'Blowing Rock', detail: '', color: '#ffffff' },
    geometry: { type: 'Point', coordinates: [-81.677, 36.135] },
  },
  {
    type: 'Feature',
    properties: { id: 'Boone', label: 'Boone', detail: '', color: '#ffffff' },
    geometry: { type: 'Point', coordinates: [-81.674, 36.216] },
  },
];
export const HeroMap: React.FC<HeroMapProps> = ({
  routes,
  callouts = [],
  currentLocation,
  className,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const mapLibRef = useRef<MapLibreModule>();

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    let cancelled = false;

    (async () => {
      const maplibregl = await import('maplibre-gl');
      if (cancelled || !mapContainerRef.current) return;

      mapLibRef.current = maplibregl;

      const style: StyleSpecification = {
        version: 8,
        name: 'transparent-overlay',
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {},
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: { 'background-color': 'rgba(0,0,0,0)' },
          },
        ],
      };

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style,
        center: currentLocation.coordinate,
        zoom: 10,
        attributionControl: false,
        interactive: false,
      });

      mapRef.current = map;

      map.on('load', () => {
        if (cancelled) return;

        const smoothedRoutes = routes.map((route) => ({
          ...route,
          coordinates: smoothRoute(route.geometry.coordinates as [number, number][]) as [
            number,
            number,
          ][],
        }));

        const routeFeatures: RouteFeature[] = smoothedRoutes.map((route) => ({
          type: 'Feature',
          properties: { routeId: route.id, color: route.color },
          geometry: { type: 'LineString', coordinates: route.coordinates },
        }));

        const calloutFeatures: CalloutFeature[] = smoothedRoutes.map((route) => {
          const km = totalDistanceKm(route.coordinates);
          const midpoint = pointAlong(route.coordinates, km / 2);
          const override = callouts.find((c) => c.id === route.id);
          return {
            type: 'Feature',
            properties: {
              id: route.id,
              label: override?.label ?? route.id,
              detail: formatDetail(km),
              color: override?.color ?? route.color,
            },
            geometry: { type: 'Point', coordinates: midpoint },
          };
        });

        callouts.forEach((callout) => {
          if (smoothedRoutes.some((route) => route.id === callout.id)) return;
          calloutFeatures.push({
            type: 'Feature',
            properties: {
              id: callout.id,
              label: callout.label,
              detail: callout.detail ?? '',
              color: callout.color ?? '#ffffff',
            },
            geometry: { type: 'Point', coordinates: callout.coordinate },
          });
        });

        map.addSource('hero-routes', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: routeFeatures },
        });

        map.addSource('hero-callouts', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: calloutFeatures },
        });

        map.addSource('hero-towns', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: townFeatures },
        });

        map.addSource('hero-location', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: currentLocation.coordinate },
                properties: {},
              },
            ],
          },
        });

        routes.forEach((route) => {
          map.addLayer({
            id: `${route.id}-glow`,
            type: 'line',
            source: 'hero-routes',
            filter: ['==', ['get', 'routeId'], route.id],
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': route.color,
              'line-width': 16,
              'line-opacity': 0.32,
              'line-blur': 10,
            },
          });

          map.addLayer({
            id: `${route.id}-core`,
            type: 'line',
            source: 'hero-routes',
            filter: ['==', ['get', 'routeId'], route.id],
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': route.color,
              'line-width': 6,
              'line-opacity': 0.95,
            },
          });
        });

        map.addLayer({
          id: 'hero-callout-glow',
          type: 'circle',
          source: 'hero-callouts',
          paint: {
            'circle-radius': 26,
            'circle-color': ['get', 'color'],
            'circle-opacity': 0.25,
            'circle-blur': 1.4,
          },
        });

        map.addLayer({
          id: 'hero-callout-bg',
          type: 'circle',
          source: 'hero-callouts',
          paint: {
            'circle-radius': 18,
            'circle-color': ['get', 'color'],
            'circle-opacity': 0.92,
          },
        });

        map.addLayer({
          id: 'hero-callout-text',
          type: 'symbol',
          source: 'hero-callouts',
          layout: {
            'text-field': ['format', ['get', 'label'], '\n', {}, ['get', 'detail']],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Regular'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 7, 12, 10, 14, 12, 17],
            'text-allow-overlap': true,
            'text-ignore-placement': true,
            'text-anchor': 'center',
          },
          paint: {
            'text-color': '#070c16',
          },
        });

        map.addLayer({
          id: 'hero-town-labels',
          type: 'symbol',
          source: 'hero-towns',
          layout: {
            'text-field': ['get', 'label'],
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 6, 11, 10, 14, 12, 18],
            'text-offset': [0, 0.8],
            'text-anchor': 'top',
          },
          paint: {
            'text-color': '#f8fafc',
            'text-halo-color': 'rgba(8, 11, 22, 0.75)',
            'text-halo-width': 1.4,
          },
        });
        map.addLayer({
          id: 'hero-location-glow',
          type: 'circle',
          source: 'hero-location',
          paint: {
            'circle-radius': 24,
            'circle-color': '#60a5fa',
            'circle-opacity': 0.18,
            'circle-blur': 1.5,
          },
        });

        map.addLayer({
          id: 'hero-location-core',
          type: 'circle',
          source: 'hero-location',
          paint: {
            'circle-radius': 10,
            'circle-color': '#1d4ed8',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.95,
          },
        });

        const maplibre = mapLibRef.current;
        if (maplibre) {
          const bounds = routes.reduce(
            (acc, route) => {
              route.geometry.coordinates.forEach((coord) => {
                if (!acc) {
                  acc = new maplibre.LngLatBounds(
                    coord as [number, number],
                    coord as [number, number],
                  );
                } else {
                  acc.extend(coord as [number, number]);
                }
              });
              return acc;
            },
            null as import('maplibre-gl').LngLatBounds | null,
          );

          if (bounds) {
            map.fitBounds(bounds, { padding: 90, duration: 900 });
          }
        }
      });
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      mapLibRef.current = undefined;
    };
  }, [routes, currentLocation, callouts]);

  return (
    <div
      ref={mapContainerRef}
      className={`hero-map-container${className ? ` ${className}` : ''}`}
    />
  );
};

export default HeroMap;
