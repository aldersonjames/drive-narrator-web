import { useCallback, useEffect, useState } from 'react';
import { permissionService, type PermissionStatus } from '../services/permissions';

const DEFAULT_STATUS: PermissionStatus = {
  location: 'unavailable',
  microphone: 'unavailable',
  audio: 'unavailable',
};

export function usePermissions() {
  const [status, setStatus] = useState<PermissionStatus>(DEFAULT_STATUS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = permissionService.subscribe((next) => {
      setStatus(next);
    });

    permissionService
      .refreshStatus()
      .catch((error) => {
        console.error('Failed to refresh permissions:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      unsubscribe();
    };
  }, []);

  const runWithLoading = useCallback(async (fn: () => Promise<PermissionStatus>) => {
    setIsLoading(true);
    try {
      return await fn();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestLocationPermission = useCallback(() => {
    return runWithLoading(() => permissionService.requestLocationPermission());
  }, [runWithLoading]);

  const requestMicrophonePermission = useCallback(() => {
    return runWithLoading(() => permissionService.requestMicrophonePermission());
  }, [runWithLoading]);

  const requestAudioPermission = useCallback(() => {
    return runWithLoading(() => permissionService.requestAudioPermission());
  }, [runWithLoading]);

  const refreshPermissions = useCallback(() => {
    return runWithLoading(() => permissionService.refreshStatus());
  }, [runWithLoading]);

  return {
    status,
    isLoading,
    refreshPermissions,
    requestLocationPermission,
    requestMicrophonePermission,
    requestAudioPermission,
    hasAllPermissions: permissionService.hasAllPermissions(),
    hasLocationPermission: status.location === 'granted',
    hasMicrophonePermission: status.microphone === 'granted',
    hasAudioPermission: status.audio === 'granted',
  };
}
