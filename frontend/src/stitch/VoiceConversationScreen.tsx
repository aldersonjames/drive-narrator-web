import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import AppNavigation from '../components/navigation/AppNavigation';
import RealtimeVoiceInterface from '../components/voice/RealtimeVoiceInterface';
import { useDrivePlanner } from '../context/DrivePlannerContext';

// const MIN_ALERT_MINUTES = 1;
// const MAX_ALERT_MINUTES = 25;
// const MIN_VALID_SPEED_MPH = 5;
const MPH_FROM_MPS = 2.236936;

interface CoordinateSample {
  coords: [number, number];
  timestamp: number;
}

const VoiceConversationScreen: React.FC = () => {
  // const navigate = useNavigate();
  const location = useLocation();
  useDrivePlanner();

  // const [alertMinutes, setAlertMinutes] = useState<number>(5);
  const [locationLabel, setLocationLabel] = useState('Locating…');
  // const [position, setPosition] = useState<{ lat: number; lng: number }>();
  const [, setHeading] = useState<number>();
  const [avgSpeedMph, setAvgSpeedMph] = useState<number>(0);
  const speedSamplesRef = useRef<number[]>([]);
  const prevSampleRef = useRef<CoordinateSample | null>(null);

  // const profileId = 'traveler-001';
  const isFollowMode = location.search.includes('mode=follow');

  const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
  const toDegrees = (radians: number): number => (radians * 180) / Math.PI;

  const haversineDistanceMeters = useCallback(
    (a: [number, number], b: [number, number]): number => {
      const lat1 = toRadians(a[1]);
      const lat2 = toRadians(b[1]);
      const dLat = toRadians(b[1] - a[1]);
      const dLng = toRadians(b[0] - a[0]);

      const sinLat = Math.sin(dLat / 2);
      const sinLng = Math.sin(dLng / 2);

      const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
      return 2 * 6_371_000 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    },
    [],
  );

  const updateAverageSpeed = useCallback((mph: number) => {
    const samples = speedSamplesRef.current;
    samples.push(mph);
    if (samples.length > 5) {
      samples.shift();
    }
    const validSamples = samples.filter((value) => Number.isFinite(value) && value >= 0);
    if (!validSamples.length) {
      setAvgSpeedMph(0);
      return;
    }
    const avg = validSamples.reduce((sum, value) => sum + value, 0) / validSamples.length;
    setAvgSpeedMph(avg);
  }, []);

  const computeSpeedFromSamples = useCallback(
    (previous: CoordinateSample | null, nextCoords: [number, number], nextTimestamp: number) => {
      if (!previous) return undefined;
      const distanceMeters = haversineDistanceMeters(previous.coords, nextCoords);
      const timeSeconds = (nextTimestamp - previous.timestamp) / 1000;
      if (timeSeconds <= 0) return undefined;
      return distanceMeters / timeSeconds;
    },
    [haversineDistanceMeters],
  );

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocationLabel('Location unavailable');
      return;
    }

    let cancelled = false;

    const handlePosition = (pos: GeolocationPosition) => {
      if (cancelled) return;
      const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
      // setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });

      const literalLocation = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
      setLocationLabel(literalLocation);

      setHeading((prevHeading) => {
        if (Number.isFinite(pos.coords.heading)) {
          return pos.coords.heading ?? prevHeading ?? 0;
        }
        // Fallback for heading if not directly available from GPS
        if (prevSampleRef.current) {
          const [prevLng, prevLat] = prevSampleRef.current.coords;
          const y =
            Math.sin(toRadians(coords[0] - prevLng)) * Math.cos(toRadians(pos.coords.latitude));
          const x =
            Math.cos(toRadians(prevLat)) * Math.sin(toRadians(pos.coords.latitude)) -
            Math.sin(toRadians(prevLat)) *
              Math.cos(toRadians(pos.coords.latitude)) *
              Math.cos(toRadians(coords[0] - prevLng));
          const bearing = (toDegrees(Math.atan2(y, x)) + 360) % 360;
          return bearing;
        }
        return prevHeading ?? 0;
      });

      const speedMps =
        Number.isFinite(pos.coords.speed) && (pos.coords.speed ?? 0) > 0
          ? (pos.coords.speed as number)
          : computeSpeedFromSamples(prevSampleRef.current, coords, pos.timestamp);

      if (speedMps !== undefined && speedMps >= 0) {
        const mph = speedMps * MPH_FROM_MPS;
        updateAverageSpeed(mph);
      }

      prevSampleRef.current = { coords, timestamp: pos.timestamp };
    };

    const handleError = () => {
      if (!cancelled) {
        setLocationLabel('Location unavailable');
      }
    };

    const watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 2000,
    });

    return () => {
      cancelled = true;
      if (typeof watchId === 'number') {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [computeSpeedFromSamples, updateAverageSpeed, haversineDistanceMeters]);

  // const hasValidSpeed = avgSpeedMph >= MIN_VALID_SPEED_MPH;
  // const effectiveRadiusMiles = hasValidSpeed ? toMiles(alertMinutes, avgSpeedMph) : undefined;
  // const effectiveHeading = heading ?? 0;

  // const toMiles = (minutes: number, mph: number): number => {
  //   const hours = minutes / 60;
  //   return mph * hours;
  // };

  return (
    <div className="flex min-h-screen flex-col bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="flex-shrink-0 bg-background-light/5 backdrop-blur-sm dark:bg-background-dark/5">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <NavLink
              to="/"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Back
            </NavLink>
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isFollowMode ? 'Explore Drive' : 'Voice Conversation'}
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">{locationLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {avgSpeedMph.toFixed(0)} mph
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col">
        <RealtimeVoiceInterface className="flex-1" />
      </main>

      {/* Bottom Navigation */}
      <footer className="flex-shrink-0 bg-background-light/5 backdrop-blur-sm dark:bg-background-dark/5">
        <AppNavigation position="bottom" />
        <div className="h-safe-bottom" aria-hidden="true" />
      </footer>
    </div>
  );
};

export default VoiceConversationScreen;
