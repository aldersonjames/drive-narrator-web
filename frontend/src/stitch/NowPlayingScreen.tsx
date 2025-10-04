import React from 'react';
import AppNavigation from '../components/navigation/AppNavigation';

export const NowPlayingScreen: React.FC = () => {
  return (
    <div
      className="flex min-h-screen flex-col bg-background-light font-display text-zinc-900 dark:bg-background-dark dark:text-zinc-100"
      style={{ minHeight: 'max(884px, 100dvh)' }}
    >
      {/* Top Navigation */}
      <AppNavigation position="top" />
      
      <div className="flex-grow">
        <div
          className="relative h-80 bg-cover bg-center"
          style={{
            backgroundImage:
              'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDxlBHfAZZVjZnhHm_a_xBJDVfQpeftmN_bNNfKycfYrmscfOylV08utuikiHe3sJ6Z0XBGlYUTzS_LJts2sJ0DlKcK-97iMhGKeBf2bVvZywog5KglRZHogVOPEwEa4meokv37AeMysdrTX4LKYkr-JiOdPrQCqfGQ26BEoC9s9s7TmO59c9wCK3iyWI-1W30RGKBGD70KPHJ5q1rJqgMhf9hCkQld667vpz0Y9d3AR91Id2QoJEIwbFzuOHAcHV3h2fJq3VxpoXk")',
          }}
        >
          <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full bg-white/20">
                <div className="h-2 w-3/4 rounded-full bg-white" />
              </div>
              <p className="text-xs text-white">8 min left</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            The Whispering Pines Trail
          </h1>
          <p className="leading-relaxed text-zinc-800 dark:text-zinc-200">
            Embark on a journey through the Whispering Pines Trail, where ancient trees stand as
            silent witnesses to centuries of history. Feel the crisp mountain air as you traverse
            this path...
          </p>
        </div>

        <div
          className="mx-6 mb-8 h-16 bg-contain bg-center bg-no-repeat"
          style={{
            backgroundImage:
              'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDlLE2zz71Hbl2LHGTQ-NoTJAs45yqkZzeY4T_W4-v9o8H4TMMM9B9QenMjUe5Gs2zgUvoIE6gkm7vYokd7y4Z1_5Pq9qpt2XJ9wYk7EivMc3Y-o0l7Iwux3Wjjw1_KtHBaJ5z7XpTWzwy2bZa1TH1PUCbc2XL2uTsFQwDpLdaWB667bEXHM8sgJQ-CyfRmVTPg9E0kpXdi7E0c9kp-59qWd9BLu_FGz5oBvMgPOeIU3g5Dp-Ox2ifuFN8LSooVwmTdZ7gI40kTIsU")',
          }}
        />

        <div className="flex items-center justify-center gap-4 px-6 pb-6">
          <button
            type="button"
            className="p-3 text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            aria-label="Replay 10 seconds"
          >
            <span className="material-symbols-outlined text-4xl">replay_10</span>
          </button>
          <button
            type="button"
            className="p-3 text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            aria-label="Previous story"
          >
            <span className="material-symbols-outlined text-4xl">skip_previous</span>
          </button>
          <button
            type="button"
            className="rounded-full bg-primary p-5 text-white shadow-lg"
            aria-label="Pause story"
          >
            <span className="material-symbols-outlined text-5xl">pause</span>
          </button>
          <button
            type="button"
            className="p-3 text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            aria-label="Next story"
          >
            <span className="material-symbols-outlined text-4xl">skip_next</span>
          </button>
          <button
            type="button"
            className="p-3 text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            aria-label="Forward 30 seconds"
          >
            <span className="material-symbols-outlined text-4xl">forward_30</span>
          </button>
        </div>
      </div>
      {/* Bottom Navigation */}
      <div className="sticky bottom-0 bg-background-light/80 backdrop-blur-sm dark:bg-background-dark/80">
        <AppNavigation position="bottom" />
      </div>
    </div>
  );
};

export default NowPlayingScreen;
