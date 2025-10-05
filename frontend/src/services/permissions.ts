/**
 * Permission management service
 * Automatically requests and handles permissions on app load
 */

export interface PermissionStatus {
  location: 'granted' | 'denied' | 'prompt' | 'unavailable';
  microphone: 'granted' | 'denied' | 'prompt' | 'unavailable';
  audio: 'granted' | 'denied' | 'prompt' | 'unavailable';
}

type PermissionListener = (status: PermissionStatus) => void;

type PermissionState = PermissionStatus[keyof PermissionStatus];

type PermissionStateFromNavigator = PermissionState | 'prompt' | 'granted' | 'denied';

const mapPermissionState = (
  value: PermissionState | PermissionStateFromNavigator,
): PermissionState => {
  if (value === 'granted' || value === 'denied' || value === 'prompt') {
    return value;
  }
  return 'prompt';
};

type ExtendedWindow = typeof window & {
  webkitAudioContext?: typeof AudioContext;
};

const getAudioContextCtor = (): typeof AudioContext | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  const win = window as ExtendedWindow;
  return win.AudioContext ?? win.webkitAudioContext;
};

export class PermissionService {
  private static instance: PermissionService;

  private status: PermissionStatus = {
    location: 'unavailable',
    microphone: 'unavailable',
    audio: 'unavailable',
  };

  private listeners = new Set<PermissionListener>();

  private permissionHandles = new Map<PermissionName, PermissionState>();

  private constructor() {}

  static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  subscribe(listener: PermissionListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.status });
    return () => {
      this.listeners.delete(listener);
    };
  }

  async refreshStatus(): Promise<PermissionStatus> {
    const updates: Partial<PermissionStatus> = {};

    if (typeof navigator !== 'undefined') {
      const permissionsApi = (navigator as Navigator & { permissions?: Navigator['permissions'] })
        .permissions;
      if (permissionsApi && typeof permissionsApi.query === 'function') {
        await Promise.all([
          this.queryPermission('geolocation').then((state) => {
            updates.location = state;
          }),
          this.queryPermission('microphone').then((state) => {
            updates.microphone = state;
          }),
        ]);
      } else {
        if ('geolocation' in navigator) {
          updates.location =
            this.status.location === 'unavailable' ? 'prompt' : this.status.location;
        } else {
          updates.location = 'unavailable';
        }

        if ('mediaDevices' in navigator && navigator.mediaDevices?.getUserMedia) {
          updates.microphone =
            this.status.microphone === 'unavailable' ? 'prompt' : this.status.microphone;
        } else {
          updates.microphone = 'unavailable';
        }
      }

      updates.audio = this.resolveAudioAvailability();
    }

    this.setStatus(updates);
    return { ...this.status };
  }

  async requestAllPermissions(): Promise<PermissionStatus> {
    await this.requestLocationPermission();
    await this.requestMicrophonePermission();
    await this.requestAudioPermission();
    return { ...this.status };
  }

  async requestLocationPermission(): Promise<PermissionStatus> {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      this.setStatus({ location: 'unavailable' });
      return { ...this.status };
    }

    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          this.setStatus({ location: 'granted' });
          resolve();
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            this.setStatus({ location: 'denied' });
          } else {
            this.setStatus({ location: 'prompt' });
          }
          resolve();
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
      );
    });

    return { ...this.status };
  }

  async requestMicrophonePermission(): Promise<PermissionStatus> {
    if (
      typeof navigator === 'undefined' ||
      !('mediaDevices' in navigator) ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      this.setStatus({ microphone: 'unavailable' });
      return { ...this.status };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      this.setStatus({ microphone: 'granted' });
    } catch (error) {
      console.warn('Microphone permission denied:', error);
      this.setStatus({ microphone: 'denied' });
    }

    return { ...this.status };
  }

  async requestAudioPermission(): Promise<PermissionStatus> {
    try {
      const AudioContextCtor = getAudioContextCtor();

      if (!AudioContextCtor) {
        this.setStatus({ audio: 'unavailable' });
        return { ...this.status };
      }

      const audioContext = new AudioContextCtor();
      if (audioContext.state === 'suspended') {
        await audioContext.resume().catch(() => undefined);
      }
      this.setStatus({ audio: 'granted' });
      await audioContext.close();
    } catch (error) {
      console.warn('Audio permission denied:', error);
      this.setStatus({ audio: 'denied' });
    }

    return { ...this.status };
  }

  getStatus(): PermissionStatus {
    return { ...this.status };
  }

  hasAllPermissions(): boolean {
    return (
      this.status.location === 'granted' &&
      this.status.microphone === 'granted' &&
      this.status.audio === 'granted'
    );
  }

  hasLocationPermission(): boolean {
    return this.status.location === 'granted';
  }

  hasMicrophonePermission(): boolean {
    return this.status.microphone === 'granted';
  }

  hasAudioPermission(): boolean {
    return this.status.audio === 'granted';
  }

  private setStatus(partial: Partial<PermissionStatus>) {
    this.status = { ...this.status, ...partial };
    this.notify();
  }

  private notify() {
    const snapshot = { ...this.status };
    this.listeners.forEach((listener) => {
      listener(snapshot);
    });
  }

  private resolveAudioAvailability(): PermissionState {
    if (typeof window === 'undefined') return 'unavailable';
    const AudioContextCtor = getAudioContextCtor();
    if (!AudioContextCtor) {
      return 'unavailable';
    }
    if (this.status.audio === 'granted' || this.status.audio === 'denied') {
      return this.status.audio;
    }
    return 'prompt';
  }

  private async queryPermission(name: PermissionName): Promise<PermissionState> {
    if (!('permissions' in navigator) || !navigator.permissions?.query) {
      return 'prompt';
    }

    try {
      const descriptor = { name } as PermissionDescriptor;
      const status = await navigator.permissions.query(descriptor);
      if (!this.permissionHandles.has(name)) {
        status.onchange = () => {
          const nextState = mapPermissionState(status.state as PermissionStateFromNavigator);
          if (name === 'geolocation') {
            this.setStatus({ location: nextState });
          } else if (name === 'microphone') {
            this.setStatus({ microphone: nextState });
          }
        };
        this.permissionHandles.set(
          name,
          mapPermissionState(status.state as PermissionStateFromNavigator),
        );
      }
      return mapPermissionState(status.state as PermissionStateFromNavigator);
    } catch (error) {
      console.warn('Permission query failed:', name, error);
      return 'prompt';
    }
  }
}

export const permissionService = PermissionService.getInstance();
