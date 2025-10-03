import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

import { useVoiceConversation } from '../hooks/useVoiceConversation';
import BreathingOrb from '../components/voice/BreathingOrb';

export const VoiceConversationScreen: React.FC = () => {
  const conversation = useVoiceConversation();
  const [textInput, setTextInput] = useState('');
  const interestOptions = ['Museums', 'Parks', 'Restaurants', 'Viewpoints'];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = textInput.trim();
    if (!trimmed) return;
    void conversation.sendText(trimmed);
    setTextInput('');
  };

  const handleOptionClick = (label: string) => {
    void conversation.sendText(label);
  };

  return (
    <div
      className="flex h-full min-h-screen flex-col bg-background-light font-display text-white dark:bg-background-dark"
      style={{ minHeight: 'max(884px, 100dvh)' }}
    >
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
        <div className="mb-6">
          <BreathingOrb
            phase={conversation.orbState}
            onStartListening={conversation.startVoice}
            onStop={conversation.stopVoice}
            disabled={conversation.isProcessing}
            messages={{
              idle: conversation.error ? 'Ready when you are' : 'Tap to start listening',
              listening: 'Listening…',
              speaking: 'Narrating…',
              processing: 'Processing…',
              error: conversation.error ?? 'Microphone problem',
            }}
          />
        </div>

        <h2 className="mt-4 text-2xl font-bold text-white/90">What are you interested in?</h2>
        <p className="mt-2 mb-6 text-base text-white/60">
          Tell me, or choose from the options below.
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="e.g., 'historical landmarks', 'local folklore'"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-background-dark/50 py-3 px-4 text-white placeholder-white/40 focus:border-amber focus:ring-2 focus:ring-amber transition-colors"
            />
            <button
              type="submit"
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              aria-label="Submit interest"
              disabled={!textInput.trim() || conversation.isProcessing}
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
            {interestOptions.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => handleOptionClick(label)}
                className="flex items-center space-x-3 rounded-lg border border-white/20 bg-background-dark/50 p-3 transition-colors hover:bg-primary/20"
              >
                <span className="form-radio h-4 w-4 rounded-full border border-amber/50 bg-transparent" />
                <span className="text-white/80">{label}</span>
              </button>
            ))}
          </div>
        </form>
      </main>

      {conversation.error && (
        <div className="px-4 py-2 text-center text-sm text-red-400">{conversation.error}</div>
      )}

      <footer className="flex-shrink-0 border-t border-white/10 bg-background-light/5 backdrop-blur-sm dark:border-white/10 dark:bg-background-dark/5">
        <nav className="flex justify-around p-2">
          <NavLink
            to="/voice"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors ${
                isActive ? 'text-primary' : 'text-white/60 dark:text-white/60 hover:text-primary'
              }`
            }
          >
            <span className="material-symbols-outlined">home</span>
            <span className="text-xs font-medium">Home</span>
          </NavLink>
          <NavLink
            to="/discoveries"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors ${
                isActive ? 'text-primary' : 'text-white/60 dark:text-white/60 hover:text-primary'
              }`
            }
          >
            <span className="material-symbols-outlined">compass_calibration</span>
            <span className="text-xs font-medium">Discover</span>
          </NavLink>
          <NavLink
            to="/memories"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors ${
                isActive ? 'text-primary' : 'text-white/60 dark:text-white/60 hover:text-primary'
              }`
            }
          >
            <span className="material-symbols-outlined">history</span>
            <span className="text-xs font-medium">Memories</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors ${
                isActive ? 'text-primary' : 'text-white/60 dark:text-white/60 hover:text-primary'
              }`
            }
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="text-xs font-medium">Settings</span>
          </NavLink>
        </nav>
        <div className="h-safe-bottom" aria-hidden="true" />
      </footer>
    </div>
  );
};

export default VoiceConversationScreen;
