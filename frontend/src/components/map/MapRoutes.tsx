import React, { useEffect, useMemo, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

import type { FeatureCollection, LineString, Point } from 'geojson';
import type { RouteSummary } from '../../../../shared/types/tripNarrator';

type MaplibreModule = typeof import('maplibre-gl');
type MapInstance = import('maplibre-gl').Map;
type GeoJsonSource = import('maplibre-gl').GeoJSONSource;
type MapLayerMouseEvent = import('maplibre-gl').MapLayerMouseEvent;

export interface MapRoutesProps {
  routes: RouteSummary[];
  selectedRouteId?: string;
  onSelect: (routeId: string) => void;
}

const ROUTE_COLORS = ['#6366F1', '#0EA5E9', '#F97316', '#22C55E', '#EC4899'];

const baseContainerStyle: React.CSSProperties = {
  display: 'grid',
  gap: '1.5rem',
  gridTemplateColumns: 'minmax(0, 1fr)',
};

const legendListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const mapWrapperStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '340px',
  borderRadius: '16px',
  overflow: 'hidden',
  border: '1px solid #E2E8F0',
  backgroundColor: '#F8FAFC',
};

const legendHeaderStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 600,
  marginBottom: '0.75rem',
};

const getRouteColor = (index: number): string => ROUTE_COLORS[index % ROUTE_COLORS.length];

const toRouteFeatures = (routes: RouteSummary[]) =>
  routes.map((route, index) => ({
    type: 'Feature' as const,
    geometry: route.geometry,
    properties: {
      routeId: route.routeId,
      color: getRouteColor(index),
      label: `Route ${index + 1}`,
    },
  }));

const toPoiFeatures = (routes: RouteSummary[]) =>
  routes.flatMap((route, routeIndex) =>
    route.pois.map((poi) => ({
      type: 'Feature' as const,
      geometry: poi.geometry ?? {
        type: 'Point',
        coordinates: [poi.coordinates.lng, poi.coordinates.lat],
      },
      properties: {
        poiId: poi.id ?? poi.poiId,
        routeId: route.routeId,
        name: poi.name,
        category: poi.category,
        color: getRouteColor(routeIndex),
      },
    })),
  );

const buildFeatureCollection = <T extends LineString | Point>(
  features: Array<{
    type: 'Feature';
    geometry: T;
    properties: Record<string, unknown>;
  }>,
): FeatureCollection<T> => ({
  type: 'FeatureCollection',
  features: features as FeatureCollection<T>['features'],
});

export const MapRoutes: React.FC<MapRoutesProps> = ({ routes, selectedRouteId, onSelect }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const mapLibRef = useRef<MaplibreModule>();
  const [mapReady, setMapReady] = useState(false);
  const lastFittedRoutesKeyRef = useRef<string>('');

  const routeFeatures = useMemo(() => toRouteFeatures(routes), [routes]);
  const poiFeatures = useMemo(() => toPoiFeatures(routes), [routes]);
  const routesKey = useMemo(() => routes.map((route) => route.routeId).join('|'), [routes]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    let isCancelled = false;

    (async () => {
      const maplibregl = await import('maplibre-gl');
      if (isCancelled || !mapContainerRef.current) {
        return;
      }

      mapLibRef.current = maplibregl;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        center: [-98.5795, 39.8283],
        zoom: 3.3,
        scrollZoom: false,
      });

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

      mapRef.current = map;

      map.on('load', () => {
        if (!isCancelled) {
          setMapReady(true);
        }
      });
    })();

    return () => {
      isCancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      mapLibRef.current = undefined;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = mapLibRef.current;
    if (!map || !mapReady || !maplibregl) {
      return;
    }

    const routeCollection = buildFeatureCollection<LineString>(routeFeatures);
    const poiCollection = buildFeatureCollection<Point>(poiFeatures);

    const ensureSource = (id: string, data: FeatureCollection<LineString | Point>) => {
      const source = map.getSource(id) as GeoJsonSource | undefined;
      if (source) {
        source.setData(data);
      } else {
        map.addSource(id, {
          type: 'geojson',
          data,
          promoteId: id === 'routes' ? 'routeId' : undefined,
        });
      }
    };

    ensureSource('routes', routeCollection);
    ensureSource('pois', poiCollection);

    if (!map.getLayer('routes-base')) {
      map.addLayer({
        id: 'routes-base',
        type: 'line',
        source: 'routes',
        paint: {
          'line-width': 4,
          'line-color': ['get', 'color'],
          'line-opacity': 0.65,
        },
      });
    }

    if (!map.getLayer('routes-selected')) {
      map.addLayer({
        id: 'routes-selected',
        type: 'line',
        source: 'routes',
        filter: ['==', ['get', 'routeId'], '__none__'],
        paint: {
          'line-width': 6,
          'line-color': ['get', 'color'],
          'line-opacity': 0.9,
        },
      });
    }

    if (!map.getLayer('pois-circle')) {
      map.addLayer({
        id: 'pois-circle',
        type: 'circle',
        source: 'pois',
        paint: {
          'circle-radius': 5,
          'circle-opacity': 0.9,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#FFFFFF',
          'circle-color': ['coalesce', ['get', 'color'], '#F97316'],
        },
      });
    }

    map.setFilter('routes-selected', ['==', ['get', 'routeId'], selectedRouteId ?? '__none__']);

    if (routeFeatures.length) {
      const firstCoordinates = routeFeatures[0]?.geometry?.coordinates?.[0];
      if (firstCoordinates) {
        const bounds = new maplibregl.LngLatBounds(
          firstCoordinates as [number, number],
          firstCoordinates as [number, number],
        );

        routeFeatures.forEach((feature) => {
          feature.geometry.coordinates.forEach((coord) => {
            bounds.extend(coord as [number, number]);
          });
        });

        const currentKey = routesKey;
        if (lastFittedRoutesKeyRef.current !== currentKey) {
          map.fitBounds(bounds, { padding: 64, maxZoom: 11, duration: 0 });
          lastFittedRoutesKeyRef.current = currentKey;
        }
      }
    }
  }, [mapReady, routeFeatures, poiFeatures, selectedRouteId, routesKey]);

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = mapLibRef.current;
    if (!map || !mapReady || !maplibregl) {
      return;
    }

    const handleRouteClick = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const routeId = feature?.properties?.routeId as string | undefined;
      if (routeId) {
        onSelect(routeId);
      }
    };

    const enter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const leave = () => {
      map.getCanvas().style.cursor = '';
    };

    map.on('click', 'routes-base', handleRouteClick);
    map.on('click', 'routes-selected', handleRouteClick);
    map.on('mouseenter', 'routes-base', enter);
    map.on('mouseleave', 'routes-base', leave);

    return () => {
      map.off('click', 'routes-base', handleRouteClick);
      map.off('click', 'routes-selected', handleRouteClick);
      map.off('mouseenter', 'routes-base', enter);
      map.off('mouseleave', 'routes-base', leave);
    };
  }, [mapReady, onSelect]);

  if (!routes.length) {
    return (
      <p role="note">No routes available yet. Try adjusting your interests or destinations.</p>
    );
  }

  return (
    <section aria-label="Candidate routes" style={baseContainerStyle}>
      <div aria-label="Map preview of candidate routes" role="application" style={mapWrapperStyle}>
        <div
          ref={mapContainerRef}
          style={{ position: 'absolute', inset: 0 }}
          data-testid="routes-map"
        />
      </div>

      <div>
        <h3 style={legendHeaderStyle}>Route Options</h3>
        <ul style={legendListStyle}>
          {routes.map((route, index) => {
            const isSelected = route.routeId === selectedRouteId;
            const color = getRouteColor(index);
            const buttonStyle: React.CSSProperties = {
              border: '1px solid',
              borderColor: isSelected ? color : '#CBD5F5',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              textAlign: 'left',
              background: isSelected ? 'rgba(99, 102, 241, 0.08)' : '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              cursor: 'pointer',
            };

            return (
              <li key={route.routeId}>
                <button
                  type="button"
                  onClick={() => onSelect(route.routeId)}
                  aria-pressed={isSelected}
                  style={buttonStyle}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '999px',
                        backgroundColor: color,
                        boxShadow: '0 0 0 2px rgba(255,255,255,0.9)',
                      }}
                    />
                    <strong style={{ fontSize: '1rem' }}>Route {index + 1}</strong>
                  </span>
                  <span style={{ fontSize: '0.95rem', color: '#334155' }}>
                    {route.durationMinutes.toFixed(0)} min · {route.distanceKm.toFixed(1)} km
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                    Score {route.score.toFixed(2)} · Normalised{' '}
                    {(route.scoreNormalized ?? 0).toFixed(2)}
                  </span>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }}>
                    {route.pois.slice(0, 3).map((poi) => {
                      const preview = poi.images?.[0]?.url;
                      return (
                        <div
                          key={poi.poiId ?? poi.id}
                          style={{
                            position: 'relative',
                            width: '58px',
                            height: '48px',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            background: preview
                              ? `url(${preview}) center/cover`
                              : 'linear-gradient(135deg, #6366F1, #0EA5E9)',
                          }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              left: '6px',
                              bottom: '6px',
                              fontSize: '0.6rem',
                              fontWeight: 600,
                              color: '#FFFFFF',
                              textShadow: '0 1px 3px rgba(15, 23, 42, 0.55)',
                            }}
                          >
                            {poi.category.split('.').pop()?.slice(0, 8)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default MapRoutes;
