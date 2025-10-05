import type { RouteSummary } from '../../../shared/types/tripNarrator';
import { narrationTimeline as fallbackTimeline } from '../mock/demoData';

type TimelineEntry = {
  id: string;
  title: string;
  eta: string;
  distance: string;
  categories: string[];
};

export const STORY_TIMELINE_LIMIT = 6;

const formatCategoryLabel = (category: string) =>
  category
    .split(/[.:]/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');

const formatEtaLabel = (minutesAhead: number) => {
  if (minutesAhead < 60) {
    return `In ${Math.max(1, Math.round(minutesAhead))} min`;
  }
  const hours = Math.floor(minutesAhead / 60);
  const minutes = Math.round(minutesAhead % 60);
  if (minutes === 0) {
    return `In ${hours}h`;
  }
  return `In ${hours}h ${minutes.toString().padStart(2, '0')}m`;
};

export const buildStoryTimeline = (
  route: RouteSummary | undefined,
  fallback: TimelineEntry[] = fallbackTimeline,
): TimelineEntry[] => {
  if (!route?.pois?.length) {
    return fallback;
  }

  const totalMinutes = Number.isFinite(route.durationMinutes)
    ? Math.max(route.durationMinutes, 1)
    : 60;
  const denom = route.pois.length + 1;

  return route.pois.slice(0, STORY_TIMELINE_LIMIT).map((poi, index) => {
    const progress = (index + 1) / denom;
    const etaMinutes = progress * totalMinutes;
    const narrative = (poi.narrationPreview ?? poi.summary ?? '').replace(/\s+/g, ' ').trim();
    const snippet = narrative
      ? `${narrative.slice(0, 58)}${narrative.length > 58 ? '…' : ''}`
      : `Story stop ${index + 1}`;

    return {
      id: poi.id ?? poi.poiId ?? `story-${index}`,
      title: poi.name,
      eta: formatEtaLabel(etaMinutes),
      distance: snippet,
      categories: (poi.categories ?? [])
        .slice(0, 3)
        .map((category) => formatCategoryLabel(category))
        .filter(Boolean),
    } satisfies TimelineEntry;
  });
};

export default buildStoryTimeline;
