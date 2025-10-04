import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

interface AppNavigationProps {
  position?: 'top' | 'bottom';
  className?: string;
}

export const AppNavigation: React.FC<AppNavigationProps> = ({ 
  position = 'bottom', 
  className = '' 
}) => {
  const location = useLocation();
  const isFollowMode = location.pathname === '/voice' && location.search.includes('mode=follow');

  const navItems = [
    {
      to: '/voice',
      icon: 'podcasts',
      label: 'Narrate',
      isActive: (isActive: boolean) => isActive && !isFollowMode
    },
    {
      to: '/voice?mode=follow',
      icon: 'radar',
      label: 'Follow',
      isActive: (isActive: boolean) => isActive || isFollowMode
    },
    {
      to: '/drives',
      icon: 'bookmark',
      label: 'Drives',
      isActive: (isActive: boolean) => isActive
    },
    {
      to: '/settings',
      icon: 'settings',
      label: 'Settings',
      isActive: (isActive: boolean) => isActive
    }
  ];

  const baseClasses = `flex justify-around p-2 ${className}`;
  const positionClasses = position === 'top' 
    ? 'border-b border-white/10' 
    : 'border-t border-white/10';

  return (
    <nav className={`${baseClasses} ${positionClasses}`}>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors ${
              item.isActive(isActive)
                ? 'text-primary'
                : 'text-white/60 dark:text-white/60 hover:text-primary'
            }`
          }
        >
          <span className="material-symbols-outlined">{item.icon}</span>
          <span className="text-xs font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default AppNavigation;
