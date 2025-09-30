import React from 'react';
import { motion } from 'framer-motion';

export interface HeroMapProps {
  routes: Array<{ id: string; color: string; path: string }>;
  highlights: Array<{ id: string; label: string; position: { x: number; y: number } }>;
}

export const HeroMap: React.FC<HeroMapProps> = ({ routes, highlights }) => {
  return (
    <div className="hero-map-overlay" role="presentation">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="poi-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        {routes.map((route, index) => (
          <motion.path
            key={route.id}
            d={route.path}
            stroke={route.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.85 }}
            transition={{ duration: 2, ease: 'easeInOut', delay: index * 0.35 }}
          />
        ))}
        {highlights.map((poi) => (
          <g key={poi.id} transform={`translate(${poi.position.x}, ${poi.position.y})`}>
            <circle r={18} fill="url(#poi-glow)" />
            <circle r={6} fill="#ffffff" />
            <text
              x={0}
              y={-26}
              textAnchor="middle"
              fontSize="28"
              fontWeight={600}
              fill="rgba(12, 20, 38, 0.82)"
            >
              {poi.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default HeroMap;
