import React from 'react';

export const PenetrationModeBadge: React.FC<{
  visible: boolean;
  x: number;
  y: number;
  scale?: number;
}> = ({ visible, x, y, scale = 1 }) => {
  if (!visible) return null;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        x={-60}
        y={-15}
        width={120}
        height={30}
        fill="#7c3aed"
        opacity={0.9}
        rx={4}
      />
      <text
        x={0}
        y={0}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12 * scale}
        fill="white"
        fontWeight="bold"
      >
        PENETRATION MODE
      </text>
      <rect
        x={-60}
        y={-15}
        width={120}
        height={30}
        fill="none"
        stroke="#7c3aed"
        strokeWidth={2}
        rx={4}
      >
        <animate
          attributeName="stroke-opacity"
          values="1;0.3;1"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </rect>
    </g>
  );
};
