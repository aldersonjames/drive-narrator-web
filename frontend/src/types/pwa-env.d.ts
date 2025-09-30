declare module 'virtual:pwa-register' {
  interface RegisterSWOptions {
    immediate?: boolean;
    onOfflineReady?: () => void;
    onNeedRefresh?: () => void;
  }

  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => void;
}
