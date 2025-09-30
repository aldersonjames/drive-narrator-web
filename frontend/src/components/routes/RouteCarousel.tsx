import React, { useCallback, useEffect, useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { EmblaOptionsType } from 'embla-carousel';

import type { RouteSummary } from '../../../../shared/types/tripNarrator';

export interface RouteCarouselProps {
  routes: RouteSummary[];
  selectedRouteId?: string;
  onSelect?: (routeId: string) => void;
}

const carouselOptions: EmblaOptionsType = {
  align: 'start',
  dragFree: true,
  slidesToScroll: 1,
  containScroll: 'trimSnaps',
};

export const RouteCarousel: React.FC<RouteCarouselProps> = ({
  routes,
  selectedRouteId,
  onSelect,
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(carouselOptions);

  useEffect(() => {
    if (!emblaApi || !selectedRouteId) return;
    const index = routes.findIndex((route) => route.routeId === selectedRouteId);
    if (index >= 0) {
      emblaApi.scrollTo(index, true);
    }
  }, [emblaApi, routes, selectedRouteId]);

  const handleSelect = useCallback(
    (routeId: string) => {
      onSelect?.(routeId);
    },
    [onSelect],
  );

  const slides = useMemo(
    () =>
      routes.map((route, index) => {
        const isActive = route.routeId === selectedRouteId;
        return (
          <div className="carousel__slide" key={route.routeId}>
            <button
              type="button"
              className={`alt-route-card${isActive ? ' is-active' : ''}`}
              onClick={() => handleSelect(route.routeId)}
            >
              <span className="alt-route-rank">Route {index + 1}</span>
              <strong>
                {route.scoreBreakdown.interestAlignment >= 0.8
                  ? 'Cultural Highlights'
                  : 'Scenic Detour'}
              </strong>
              <div className="alt-route-meta">
                <span>{route.durationMinutes.toFixed(0)} min</span>
                <span>{route.distanceKm.toFixed(1)} km</span>
                <span>Score {route.scoreNormalized.toFixed(2)}</span>
              </div>
              <div className="alt-route-photos">
                {route.pois.slice(0, 3).map((poi) => (
                  <figure key={poi.poiId ?? poi.id} className="alt-route-photo">
                    <div className="photo-thumb" aria-hidden="true" />
                    <figcaption>{poi.name}</figcaption>
                  </figure>
                ))}
              </div>
            </button>
          </div>
        );
      }),
    [routes, selectedRouteId, handleSelect],
  );

  return (
    <div className="carousel-shell">
      <div className="carousel" ref={emblaRef}>
        <div className="carousel__container">{slides}</div>
      </div>
    </div>
  );
};

export default RouteCarousel;
