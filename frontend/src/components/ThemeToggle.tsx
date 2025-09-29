import React from 'react';

import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const label = theme === 'light' ? 'Dark mode' : 'Light mode';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Activate ${label}`}
    >
      <span className="theme-toggle__icon" aria-hidden="true">
        {theme === 'light' ? '🌙' : '☀️'}
      </span>
      <span className="theme-toggle__label">{label}</span>
    </button>
  );
};

export default ThemeToggle;
