import type { ManifestOptions } from 'vite-plugin-pwa';

export const manifest: Partial<ManifestOptions> = {
  name: 'Trip Narrator',
  short_name: 'TripNarrator',
  description:
    'Plan rich road trips, explore curated points of interest, and hear narrated stories even when offline.',
  theme_color: '#0f172a',
  background_color: '#f8fafc',
  display: 'standalone',
  orientation: 'portrait-primary',
  scope: '/',
  start_url: '/',
  icons: [
    {
      src: '/pwa-icon.svg',
      sizes: '512x512',
      type: 'image/svg+xml',
      purpose: 'any maskable',
    },
  ],
  shortcuts: [
    {
      name: 'Resume last trip',
      short_name: 'Resume',
      url: '/?resume=latest',
      description: 'Jump straight to your most recent route and narration.',
    },
  ],
};

export default manifest;
