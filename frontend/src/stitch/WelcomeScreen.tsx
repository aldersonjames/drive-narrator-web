import React from 'react';
import { useNavigate } from 'react-router-dom';

const SteeringWheelIcon: React.FC = () => (
  <svg
    className="mb-4 h-24 w-24 text-primary"
    fill="none"
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-hidden="true"
  >
    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" opacity="0.4" />
    <circle cx="32" cy="32" r="7" stroke="currentColor" strokeWidth="4" />
    <path
      d="M10 33.5c6.3-4.4 13.6-6.7 22-6.7s15.7 2.3 22 6.7"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      opacity="0.7"
    />
    <path
      d="M26.7 38.5 19 53m18.3-14.5L45 53"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      opacity="0.65"
    />
  </svg>
);

export const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      className="relative flex h-screen flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-[#081316] via-[#0c1d21] to-[#081316] py-16 px-6 font-display text-white"
      style={{ minHeight: 'max(884px, 100dvh)' }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute left-1/2 top-[-20%] h-80 w-80 -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute right-[-10%] top-1/3 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
      </div>

      <div className="relative flex w-full flex-grow flex-col items-center justify-center text-center">
        <SteeringWheelIcon />
        <div className="mb-6 flex flex-col items-center gap-2">
          <h1 className="text-4xl font-bold tracking-wide text-white">Drive Narrator</h1>
          <p className="max-w-md text-lg text-white/70">
            Curate the stories you want to hear before you roll out, then let Drive Narrator guide the ride.
          </p>
        </div>
        <div className="w-full max-w-xs space-y-4">
          <button
            type="button"
            onClick={() => navigate('/voice')}
            className="w-full rounded-xl bg-primary py-4 px-4 text-lg font-semibold text-white shadow-lg shadow-primary/30 transition-colors duration-300 hover:bg-primary/90"
          >
            Narrate My Drive
          </button>
          <button
            type="button"
            onClick={() => navigate('/trips')}
            className="w-full rounded-xl bg-white/10 py-4 px-4 text-lg font-semibold text-white transition-colors duration-300 hover:bg-white/20"
          >
            Open a Saved Trip
          </button>
          <button
            type="button"
            onClick={() => navigate('/discoveries')}
            className="w-full rounded-xl bg-white/10 py-4 px-4 text-lg font-semibold text-white transition-colors duration-300 hover:bg-white/20"
          >
            Tutorial
          </button>
        </div>
      </div>
      <footer className="relative w-full text-center text-xs text-white/40">
        Tailored narration for every mile.
      </footer>
    </div>
  );
};

export default WelcomeScreen;
