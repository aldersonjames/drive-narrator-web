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

const ROUTE_COLORS = ['#00FFFF', '#FF6EC7', '#FFD400', '#7CFF91', '#9A7CFF'];

const getRouteColor = (index: number): string => ROUTE_COLORS[index % ROUTE_COLORS.length];

interface ImportMetaLite {
  env?: {
    VITE_MAPTILER_KEY?: string;
  };
}

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

const getCategoryLabel = (category: string): string => {
  const token = category.split('.').pop() ?? category;
  return token.replace(/[_-]/g, ' ');
};

const formatDistance = (distanceKm: number): string => {
  const miles = distanceKm * 0.621371;
  return `${miles.toFixed(1)} mi`;
};

const formatDuration = (durationMinutes: number): string => {
  if (durationMinutes < 60) {
    return `${Math.round(durationMinutes)} min`;
  }
  const wholeMinutes = Math.round(durationMinutes);
  const hours = Math.floor(wholeMinutes / 60);
  const minutes = wholeMinutes % 60;
  const hourLabel = hours === 1 ? 'hr' : 'hrs';
  if (minutes === 0) {
    return `${hours} ${hourLabel}`;
  }
  return `${hours} ${hourLabel} ${minutes} min`;
};

export const MapRoutes: React.FC<MapRoutesProps> = ({ routes, selectedRouteId, onSelect }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const mapLibRef = useRef<MaplibreModule>();
  const [mapReady, setMapReady] = useState(false);
  const lastFittedRoutesKeyRef = useRef<string>('');

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

  const routeFeatures = useMemo(() => toRouteFeatures(routes), [routes]);
  const poiFeatures = useMemo(() => toPoiFeatures(routes), [routes]);
  const routesKey = useMemo(() => routes.map((route) => route.routeId).join('|'), [routes]);

  const selectedRoute = useMemo(() => {
    if (!routes.length) return undefined;
    return selectedRouteId
      ? (routes.find((route) => route.routeId === selectedRouteId) ?? routes[0])
      : routes[0];
  }, [routes, selectedRouteId]);

  useEffect(() => {
    if (!selectedRouteId && routes[0]) {
      onSelect(routes[0].routeId);
    }
  }, [selectedRouteId, routes, onSelect]);

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
        style: styleUrl,
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
  }, [styleUrl]);

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
          'line-blur': 1.2,
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
          'line-blur': 0.6,
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
    return null;
  }

  const selectedIndex = selectedRoute ? routes.indexOf(selectedRoute) : -1;

  return (
    <section aria-label="Candidate routes" className="map-routes">
      <div
        aria-label="Map preview of candidate routes"
        role="application"
        className="route-map-wrapper"
      >
        <div ref={mapContainerRef} className="route-map-canvas" data-testid="routes-map" />
      </div>

      {selectedRoute ? (
        <div className="route-detail">
          <div className="route-switcher" role="tablist" aria-label="Route options">
            {routes.map((route, index) => {
              const color = getRouteColor(index);
              const isActive = route.routeId === selectedRoute.routeId;
              return (
                <button
                  key={route.routeId}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`route-pill${isActive ? ' route-pill--active' : ''}`}
                  style={{ borderColor: color, color: color }}
                  onClick={() => onSelect(route.routeId)}
                >
                  <span className="route-pill__swatch" style={{ backgroundColor: color }} />
                  Route {index + 1}
                </button>
              );
            })}
          </div>

          <div
            className="route-card route-card--active"
            data-testid={`route-card-${selectedRoute.routeId}`}
            style={{ borderColor: getRouteColor(selectedIndex >= 0 ? selectedIndex : 0) }}
          >
            <span style={{ fontSize: '1rem', fontWeight: 600 }}>Route {selectedIndex + 1}</span>
            <span style={{ fontSize: '0.95rem', color: '#334155' }}>
              {formatDuration(selectedRoute.durationMinutes)} ·{' '}
              {formatDistance(selectedRoute.distanceKm)}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#475569' }}>
              Score {selectedRoute.score.toFixed(2)} · Normalised{' '}
              {(selectedRoute.scoreNormalized ?? 0).toFixed(2)}
            </span>
            <div className="route-card__thumbs">
              {selectedRoute.pois.slice(0, 3).map((poi) => {
                const key = poi.poiId ?? poi.id;
                const preview = poi.images?.[0];
                const categoryLabel = getCategoryLabel(poi.category);
                const label = preview?.altText ?? `${poi.name} preview`;
                return (
                  <figure
                    key={key}
                    className={`route-card__thumb${preview ? '' : ' route-card__thumb--placeholder'}`}
                    aria-label={label}
                    title={poi.name}
                    data-testid="poi-photostrip-thumb"
                  >
                    {preview ? <img src={preview.url} alt={label} /> : null}
                    <span aria-hidden="true">{categoryLabel.slice(0, 8)}</span>
                  </figure>
                );
              })}
              {selectedRoute.pois.length > 3 ? (
                <span className="route-card__extra" data-testid="poi-photostrip-more">
                  +{selectedRoute.pois.length - 3}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default MapRoutes;
