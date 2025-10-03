import React from 'react';

export const VoiceConversationScreen: React.FC = () => {
  return (
    <div className="flex h-full min-h-screen flex-col bg-background-light font-display text-white dark:bg-background-dark">
      <header className="flex shrink-0 items-center justify-between p-4">
        <div className="h-8 w-8" aria-hidden="true" />
        <h1 className="text-lg font-bold text-white/90">Roadtrip Companion</h1>
        <button type="button" className="text-white/90" aria-label="Open settings">
          <svg
            fill="currentColor"
            height="24"
            viewBox="0 0 256 256"
            width="24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M228.92,49.69a8,8,0,0,0-6.86-1.45L160.93,63.52,99.58,32.84a8,8,0,0,0-5.52-.6l-64,16A8,8,0,0,0,24,56V200a8,8,0,0,0,9.94,7.76l61.13-15.28,61.35,30.68A8.15,8.15,0,0,0,160,224a8,8,0,0,0,1.94-.24l64-16A8,8,0,0,0,232,200V56A8,8,0,0,0,228.92,49.69ZM104,52.94l48,24V203.06l-48-24ZM40,62.25l48-12v127.5l-48,12Zm176,131.5-48,12V78.25l48-12Z" />
          </svg>
        </button>
      </header>

      <main className="flex flex-grow flex-col items-center justify-center px-4 text-center">
        <div className="breathing-orb relative mb-6 flex h-48 w-48 items-center justify-center sm:h-56 sm:w-56">
          <div
            className="absolute h-full w-full animate-pulse rounded-full bg-primary/20"
            aria-hidden="true"
          />
          <div
            className="absolute h-full w-full animate-ping rounded-full bg-primary/30"
            aria-hidden="true"
          />
          <div className="flex h-40 w-40 items-center justify-center rounded-full bg-primary shadow-2xl shadow-primary/30 sm:h-48 sm:w-48">
            <svg
              className="text-white/80"
              fill="none"
              height="64"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="64"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="23" />
            </svg>
          </div>
        </div>

        <h2 className="mt-4 text-2xl font-bold text-white/90">What are you interested in?</h2>
        <p className="mt-2 mb-6 text-base text-white/60">
          Tell me, or choose from the options below.
        </p>

        <div className="w-full max-w-sm space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="e.g., 'historical landmarks', 'local folklore'"
              className="w-full rounded-lg border border-white/20 bg-background-dark/50 py-3 px-4 text-white placeholder-white/40 focus:border-amber focus:ring-2 focus:ring-amber transition-colors"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              aria-label="Submit interest"
            >
              <svg
                className="text-amber"
                fill="none"
                height="20"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="m12 15 3.5-3.5-3.5-3.5" />
                <path d="M15.5 11.5H2" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left">
            {['Museums', 'Parks', 'Restaurants', 'Viewpoints'].map((label) => (
              <label
                key={label}
                className="flex cursor-pointer items-center space-x-3 rounded-lg border border-white/20 bg-background-dark/50 p-3 transition-colors hover:bg-primary/20"
              >
                <input
                  type="radio"
                  name="poi-type"
                  className="form-radio bg-transparent text-amber focus:ring-amber"
                />
                <span className="text-white/80">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default VoiceConversationScreen;
