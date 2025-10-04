import React, { useEffect, useMemo, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

import type { FeatureCollection, Polygon, Point } from 'geojson';

type MaplibreModule = typeof import('maplibre-gl');
type MapInstance = import('maplibre-gl').Map;
type GeoJsonSource = import('maplibre-gl').GeoJSONSource;

interface FollowDriveMapProps {
  position?: {
    lat: number;
    lng: number;
  };
  heading?: number;
  radiusMiles: number;
}

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
const toDegrees = (radians: number): number => (radians * 180) / Math.PI;
const EARTH_RADIUS_METERS = 6_371_000;

const projectPoint = ([lng, lat]: [number, number], distanceMeters: number, bearingDegrees: number): [number, number] => {
  const bearingRad = toRadians(bearingDegrees);
  const latRad = toRadians(lat);
  const lngRad = toRadians(lng);
  const angularDistance = distanceMeters / EARTH_RADIUS_METERS;

  const lat2 = Math.asin(
    Math.sin(latRad) * Math.cos(angularDistance) +
      Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearingRad),
  );
  const lng2 =
    lngRad +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(latRad),
      Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(lat2),
    );

  return [toDegrees(lng2), toDegrees(lat2)];
};

const buildConePolygon = (
  position?: { lat: number; lng: number },
  heading?: number,
  radiusMiles?: number,
): FeatureCollection<Polygon> => {
  if (!position || !heading || !radiusMiles || radiusMiles <= 0) {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[]],
          },
          properties: {},
        },
      ],
    };
  }

  const center: [number, number] = [position.lng, position.lat];
  const distanceMeters = radiusMiles * 1609.34;
  const halfAngle = 22.5;

  const bearings = [
    heading - halfAngle,
    heading,
    heading + halfAngle,
  ];

  const left = projectPoint(center, distanceMeters, bearings[0]);
  const forward = projectPoint(center, distanceMeters, bearings[1]);
  const right = projectPoint(center, distanceMeters, bearings[2]);

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[center, left, forward, right, center]],
        },
        properties: {},
      },
    ],
  };
};

const buildPositionPoint = (position?: { lat: number; lng: number }): FeatureCollection<Point> => ({
  type: 'FeatureCollection',
  features: position
    ? [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [position.lng, position.lat],
          },
          properties: {},
        },
      ]
    : [],
});

interface ImportMetaLite {
  env?: {
    VITE_MAPTILER_KEY?: string;
  };
}

export const FollowDriveMap: React.FC<FollowDriveMapProps> = ({ position, heading, radiusMiles }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const mapLibRef = useRef<MaplibreModule>();
  const [mapReady, setMapReady] = useState(false);
  const centerLat = position?.lat;
  const centerLng = position?.lng;

  const importMetaEnv = ((): ImportMetaLite['env'] => {
    if (typeof import.meta !== 'undefined') {
      return (import.meta as unknown as ImportMetaLite).env;
    }
    return undefined;
  })();

  const maptilerKey =
    importMetaEnv?.VITE_MAPTILER_KEY ??
    (typeof process !== 'undefined' ? process.env?.VITE_MAPTILER_KEY : undefined);

  const styleUrl = useMemo(() => {
    if (maptilerKey) {
      return `https://api.maptiler.com/maps/stardust-preview/style.json?key=${maptilerKey}`;
    }
    return 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
  }, [maptilerKey]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    let cancelled = false;

    (async () => {
      const maplibregl = await import('maplibre-gl');
      if (cancelled || !mapContainerRef.current) return;

      mapLibRef.current = maplibregl;
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: styleUrl,
        center: [centerLng ?? -98.5795, centerLat ?? 39.8283],
        zoom: Number.isFinite(centerLat) && Number.isFinite(centerLng) ? 11 : 3.5,
        scrollZoom: false,
      });

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

      mapRef.current = map;
      map.on('load', () => {
        if (cancelled) return;
        setMapReady(true);
      });
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      mapLibRef.current = undefined;
      setMapReady(false);
    };
  }, [styleUrl, centerLat, centerLng]);

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = mapLibRef.current;
    if (!map || !mapReady || !maplibregl) return;

    const positionCollection = buildPositionPoint(position);
    const coneCollection = buildConePolygon(position, heading, radiusMiles);

    const ensureSource = (id: string, data: FeatureCollection<Polygon | Point>) => {
      const source = map.getSource(id) as GeoJsonSource | undefined;
      if (source) {
        source.setData(data);
      } else {
        map.addSource(id, {
          type: 'geojson',
          data,
        });
      }
    };

    ensureSource('follow-position', positionCollection);
    ensureSource('follow-cone', coneCollection);

    if (!map.getLayer('follow-cone-fill')) {
      map.addLayer({
        id: 'follow-cone-fill',
        type: 'fill',
        source: 'follow-cone',
        paint: {
          'fill-color': 'rgba(0, 255, 255, 0.15)',
          'fill-outline-color': 'rgba(0, 255, 255, 0.4)',
        },
      });
    }

    if (!map.getLayer('follow-position-pulse')) {
      map.addLayer({
        id: 'follow-position-pulse',
        type: 'circle',
        source: 'follow-position',
        paint: {
          'circle-radius': 8,
          'circle-color': '#00FFFF',
          'circle-stroke-color': '#0EA5E9',
          'circle-stroke-width': 2,
          'circle-opacity': 0.9,
        },
      });
    }

    if (position) {
      map.easeTo({ center: [position.lng, position.lat], duration: 800 });
    }
  }, [mapReady, position, heading, radiusMiles]);

  return <div className="follow-map" ref={mapContainerRef} data-testid="follow-drive-map" />;
};

export default FollowDriveMap;
