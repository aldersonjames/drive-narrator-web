import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  {
    to: '/voice',
    label: 'Home',
    icon: (
      <svg
        className="h-6 w-6"
        fill="currentColor"
        height="24"
        viewBox="0 0 256 256"
        width="24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11,16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77Z" />
      </svg>
    ),
  },
  {
    to: '/discoveries',
    label: 'Discover',
    icon: <span className="material-symbols-outlined">compass_calibration</span>,
  },
  {
    to: '/memories',
    label: 'Memories',
    icon: <span className="material-symbols-outlined">bookmark_border</span>,
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: <span className="material-symbols-outlined">settings</span>,
  },
];

export const BottomNav: React.FC = () => {
  return (
    <nav className="bg-background-light/90 pb-safe backdrop-blur-lg dark:bg-background-dark/90">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 rounded-full py-2 text-xs font-medium transition-colors ${
                isActive ? 'bg-primary/20 text-primary' : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
