/**
 * Issue Marker Component
 *
 * Renders a visual marker for a single inspection issue on the canvas.
 * Different issue types have different colors and icons.
 */

import React, { useState } from 'react';
import { InspectionIssue, IssueType, InspectionLevel } from '@dxf-fix/shared/types/inspection';

interface IssueMarkerProps {
  issue: InspectionIssue;
  screenX: number; // Screen coordinates (pixels)
  screenY: number;
  onClick?: (issue: InspectionIssue) => void;
  isHighlighted?: boolean;
}

// Color scheme for different issue levels
const LEVEL_COLORS = {
  [InspectionLevel.ERROR]: {
    primary: '#f44336', // Red
    secondary: 'rgba(244, 67, 54, 0.2)',
    glow: 'rgba(244, 67, 54, 0.5)',
  },
  [InspectionLevel.WARNING]: {
    primary: '#ff9800', // Orange
    secondary: 'rgba(255, 152, 0, 0.2)',
    glow: 'rgba(255, 152, 0, 0.5)',
  },
  [InspectionLevel.INFO]: {
    primary: '#2196f3', // Blue
    secondary: 'rgba(33, 150, 243, 0.2)',
    glow: 'rgba(33, 150, 243, 0.5)',
  },
};

// Icons for different issue types (SVG paths)
const ISSUE_ICONS: Record<IssueType, string> = {
  [IssueType.UNCLOSED_CONTOUR]: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', // Open box
  [IssueType.DUPLICATE_LINES]: 'M8 4h8M8 8h8M8 12h8M8 16h8', // Parallel lines
  [IssueType.OVERLAPPING_LINES]: 'M3 12h18M12 3v18', // Cross
  [IssueType.SELF_INTERSECTION]: 'M12 2L2 22h20L12 2z', // Triangle with intersection
  [IssueType.TINY_ENTITY]: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2zm0-8h2v6h-2z', // Small circle
  [IssueType.ZERO_LENGTH]: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z', // X mark
};

const IssueMarker: React.FC<IssueMarkerProps> = ({
  issue,
  screenX,
  screenY,
  onClick,
  isHighlighted = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const colors = LEVEL_COLORS[issue.level];

  const handleClick = () => {
    if (onClick) {
      onClick(issue);
    }
  };

  return (
    <div
      data-testid="issue-marker"
      data-issue-id={issue.id}
      data-issue-type={issue.type}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        left: screenX,
        top: screenY,
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        pointerEvents: 'auto',
        zIndex: isHighlighted ? 1100 : 1000,
      }}
    >
      {/* Outer glow when highlighted or hovered */}
      {(isHighlighted || isHovered) && (
        <div
          style={{
            position: 'absolute',
            left: -20,
            top: -20,
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: colors.glow,
            animation: 'pulse 1.5s infinite',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Main marker circle */}
      <div
        style={{
          position: 'relative',
          width: isHighlighted || isHovered ? 32 : 24,
          height: isHighlighted || isHovered ? 32 : 24,
          borderRadius: '50%',
          backgroundColor: colors.primary,
          border: '2px solid #fff',
          boxShadow: `0 2px 8px ${colors.glow}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Issue type icon */}
        <svg
          width={isHighlighted || isHovered ? 20 : 16}
          height={isHighlighted || isHovered ? 20 : 16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={ISSUE_ICONS[issue.type] || ISSUE_ICONS[IssueType.UNCLOSED_CONTOUR]} />
        </svg>
      </div>

      {/* Tooltip on hover */}
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            left: 40,
            top: 0,
            minWidth: 200,
            maxWidth: 300,
            padding: '8px 12px',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: '#fff',
            borderRadius: '6px',
            fontSize: '12px',
            lineHeight: '1.4',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none',
            zIndex: 1200,
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px', color: colors.primary }}>
            {issue.type.replace(/_/g, ' ').toUpperCase()}
          </div>
          <div>{issue.message}</div>

          {/* Additional data */}
          {issue.data && (
            <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              {issue.data.gapDistance !== undefined && (
                <div>缺口距离: {issue.data.gapDistance.toFixed(3)}mm</div>
              )}
              {issue.data.tolerance !== undefined && (
                <div>容差: {issue.data.tolerance.toFixed(3)}mm</div>
              )}
              {issue.data.overlapCount !== undefined && (
                <div>交点数: {issue.data.overlapCount}</div>
              )}
            </div>
          )}

          {/* Severity indicator */}
          <div
            style={{
              marginTop: '6px',
              padding: '2px 6px',
              borderRadius: '3px',
              backgroundColor: colors.secondary,
              color: colors.primary,
              fontSize: '10px',
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            {issue.level.toUpperCase()}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default IssueMarker;
