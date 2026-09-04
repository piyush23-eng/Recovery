import React from 'react';

export const HatchSvgDefs: React.FC = () => (
  <svg width="0" height="0" className="absolute pointer-events-none">
    <defs>
      {/* Pattern 1: Diagonal Hatch */}
      <pattern id="diagonalHatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="6" stroke="#FFFFFF" strokeWidth="1.6" strokeOpacity="0.35" />
      </pattern>

      {/* Linear Gradients */}
      <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7BA0F2" />
        <stop offset="100%" stopColor="#3B6FE0" />
      </linearGradient>

      <linearGradient id="blueSolidGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#5B8BF5" />
        <stop offset="100%" stopColor="#295CD6" />
      </linearGradient>

      <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7CD494" />
        <stop offset="100%" stopColor="#3FA85C" />
      </linearGradient>

      <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FAD18C" />
        <stop offset="100%" stopColor="#E8A23D" />
      </linearGradient>

      <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F7A3BE" />
        <stop offset="100%" stopColor="#E85D8A" />
      </linearGradient>
    </defs>
  </svg>
);
