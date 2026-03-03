import React from 'react';

interface ExplodeAnimationProps {
  points: { x: number; y: number }[];
  screenPoints?: { x: number; y: number }[];
  onComplete?: () => void;
}

const ExplodeAnimation: React.FC<ExplodeAnimationProps> = ({
  points = [],
  screenPoints = [],
}) => {
  const displayPoints = screenPoints.length > 0 ? screenPoints : points;
  if (displayPoints.length === 0) return null;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1000 }}>
      {displayPoints.map((point, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: point.x,
            top: point.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="explode-pulse" />
        </div>
      ))}
      <style>{`
        .explode-pulse {
          width: 8px;
          height: 8px;
          background-color: #ff9800;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(255, 152, 0, 0.6);
          animation: explode-breathe-anim 0.8s ease-in-out infinite;
        }

        @keyframes explode-breathe-anim {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.5);
            opacity: 1;
            box-shadow: 0 0 12px rgba(255, 152, 0, 0.8);
          }
        }
      `}</style>
    </div>
  );
};

export default ExplodeAnimation;
