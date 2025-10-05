import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import AppNavigation from '../components/navigation/AppNavigation';
import RealtimeVoiceInterface from '../components/voice/RealtimeVoiceInterface';
import { useDrivePlanner } from '../context/DrivePlannerContext';
import { usePermissions } from '../hooks/usePermissions';

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
  const [addressLabel, setAddressLabel] = useState('Locating…');
  // const [position, setPosition] = useState<{ lat: number; lng: number }>();
  const [, setHeading] = useState<number>();
  const [avgSpeedMph, setAvgSpeedMph] = useState<number>(0);
  const speedSamplesRef = useRef<number[]>([]);
  const prevSampleRef = useRef<CoordinateSample | null>(null);

  // const profileId = 'traveler-001';
  const isFollowMode = location.search.includes('mode=follow');

  // Request permissions on load
  const {
    status: permissionStatus,
    isLoading: permissionsLoading,
    requestLocationPermission,
    hasLocationPermission,
  } = usePermissions();

  const locationPermissionState = permissionStatus.location;
  const needsLocationPrompt = !permissionsLoading && locationPermissionState === 'prompt';
  const locationDenied = !permissionsLoading && locationPermissionState === 'denied';

  const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
  const toDegrees = (radians: number): number => (radians * 180) / Math.PI;

  const resolveAddress = useCallback(async (lat: number, lng: number) => {
    try {
      // Use BigDataCloud reverse geocoding API
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      );
      const data = await response.json();

      console.log('Reverse geocoding response:', data); // Debug log

      if (data.streetName) {
        const number = data.streetNumber ? `${data.streetNumber} ` : '';
        setAddressLabel(`${number}${data.streetName}`);
        return;
      }

      if (data.locality) {
        setAddressLabel(data.locality);
        return;
      }

      if (data.principalSubdivision) {
        setAddressLabel(data.principalSubdivision);
        return;
      }

      // Fallback to coordinates if no address available
      setAddressLabel(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } catch (error) {
      console.error('Address resolution failed:', error);
      setAddressLabel('Location unavailable');
    }
  }, []);

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

  const updateAverageSpeed = useCallback((mph: number): number => {
    const samples = speedSamplesRef.current;
    samples.push(mph);
    if (samples.length > 5) {
      samples.shift();
    }
    const validSamples = samples.filter((value) => Number.isFinite(value) && value >= 0);
    if (!validSamples.length) {
      setAvgSpeedMph(0);
      return 0;
    }
    const avg = validSamples.reduce((sum, value) => sum + value, 0) / validSamples.length;
    setAvgSpeedMph(avg);
    return avg;
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
    // Don't start GPS until permissions are loaded and granted
    if (permissionsLoading) {
      return;
    }

    if (!hasLocationPermission) {
      const message = locationDenied
        ? 'Location permission denied'
        : 'Location permission required';
      setAddressLabel(message);
      return;
    }

    if (!('geolocation' in navigator)) {
      setAddressLabel('Location unavailable');
      return;
    }

    let cancelled = false;

    const handlePosition = (pos: GeolocationPosition) => {
      if (cancelled) return;
      const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
      // setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });

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
        updateAverageSpeed(mph); // keep smoothing for speed display even if unused for address
        // Resolve address using current coordinates (speed no longer affects formatting)
        void resolveAddress(pos.coords.latitude, pos.coords.longitude);
      }

      prevSampleRef.current = { coords, timestamp: pos.timestamp };
    };

    const handleError = () => {
      if (!cancelled) {
        setAddressLabel('Location unavailable');
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
  }, [
    computeSpeedFromSamples,
    updateAverageSpeed,
    haversineDistanceMeters,
    hasLocationPermission,
    permissionsLoading,
    locationDenied,
    resolveAddress,
  ]);

  const handleLocationRequest = () => {
    void requestLocationPermission();
  };

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
            <div className="flex justify-center mt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 dark:bg-white/5 rounded-full border border-white/20">
                <span className="material-symbols-outlined text-sm text-primary">place</span>
                <span className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                  {addressLabel}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {avgSpeedMph.toFixed(0)} mph
            </span>
          </div>
        </div>
      </header>

      {/* Permission prompt */}
      {!permissionsLoading && !hasLocationPermission && (
        <div className="mx-4 mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-100">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">
                {locationDenied
                  ? 'Location access is blocked'
                  : 'Enable location to follow your drive'}
              </p>
              <p className="text-sm opacity-80">
                {locationDenied
                  ? 'Update your browser or system settings to re-enable location access.'
                  : 'We use your location to calculate speed, heading, and nearby stories.'}
              </p>
            </div>
            {needsLocationPrompt && (
              <button
                type="button"
                onClick={handleLocationRequest}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
              >
                Allow location
              </button>
            )}
          </div>
        </div>
      )}

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
