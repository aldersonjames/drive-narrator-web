import React from 'react';
import { useNavigate } from 'react-router-dom';

export const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      className="relative flex h-screen flex-col items-center justify-between overflow-hidden bg-background-dark py-16 px-6 font-display text-white"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(17, 32, 33, 0) 0%, #112021 70%)',
        minHeight: 'max(884px, 100dvh)',
      }}
    >
      <div className="flex w-full flex-grow flex-col items-center justify-center text-center">
        <div className="mb-6 flex flex-col items-center">
          <svg
            className="mb-4 h-24 w-24 text-amber"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill="currentColor"
              opacity="0.3"
            />
            <path
              d="M3.75 8.25L12 16.5l8.25-8.25"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
            <path
              d="M12 3v13.5"
              stroke="#18a2aa"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
          <h1 className="text-4xl font-bold text-white">Trip Narrator</h1>
        </div>
        <p className="mb-12 text-lg text-white/70">Uncover stories, one mile at a time.</p>
        <div className="w-full max-w-xs space-y-4">
          <button
            type="button"
            onClick={() => navigate('/voice')}
            className="w-full rounded-lg bg-primary py-4 px-4 text-lg font-bold text-white transition-colors duration-300 hover:bg-primary/90"
          >
            Plan Your Trip
          </button>
          <button
            type="button"
            onClick={() => navigate('/discoveries')}
            className="w-full rounded-lg bg-white/10 py-4 px-4 text-lg font-bold text-white transition-colors duration-300 hover:bg-white/20"
          >
            Tutorial
          </button>
        </div>
      </div>
      <footer className="w-full text-center">
        <p className="text-xs text-white/40">Your personal storyteller for the road.</p>
      </footer>
    </div>
  );
};

export default WelcomeScreen;
