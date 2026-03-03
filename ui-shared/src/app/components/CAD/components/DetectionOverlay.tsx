/**
 * Detection Overlay Component
 *
 * Renders inspection issue markers on top of the CAD canvas.
 * Transforms world coordinates to screen coordinates based on viewport.
 */

import React, { useMemo, useCallback } from 'react';
import { InspectionIssue, InspectionLevel } from '@dxf-fix/shared/types/inspection';
import { Viewport } from '../../../contexts/ViewportContext';
import { mapIssuePointToScreenPosition } from "../../../utils/inspectionCoordinates";
import IssueMarker from './IssueMarker';

interface DetectionOverlayProps {
  issues: InspectionIssue[];
  viewport: Viewport;
  highlightedIssueId?: string | null;
  onIssueClick?: (issue: InspectionIssue) => void;
  showOnlyLevel?: InspectionLevel | null; // Filter by severity level
  fileOffsets?: Record<string, { x: number; y: number }>;
  coordinateSpace?: "local" | "world";
}

const DetectionOverlay: React.FC<DetectionOverlayProps> = ({
  issues,
  viewport,
  highlightedIssueId,
  onIssueClick,
  showOnlyLevel = null,
  fileOffsets = {},
  coordinateSpace = "local",
}) => {
  // Transform world coordinates to screen coordinates
  const worldToScreen = useCallback((worldX: number, worldY: number, fileId?: string) => {
    return mapIssuePointToScreenPosition({
      worldX,
      worldY,
      viewport,
      fileId,
      fileOffsets,
      coordinateSpace,
    });
  }, [coordinateSpace, viewport, fileOffsets]);

  // Filter issues by severity level if specified
  const filteredIssues = useMemo(() => {
    if (!showOnlyLevel) {
      return issues;
    }
    return issues.filter(issue => issue.level === showOnlyLevel);
  }, [issues, showOnlyLevel]);

  // Check if an issue is visible on screen
  const isIssueVisible = useCallback((screenX: number, screenY: number) => {
    // Simple bounds check - markers are visible if they're within reasonable range
    // (allow some overflow for markers near edges)
    return screenX >= -50 && screenY >= -50; // Minimum bounds
  }, []);

  // Handle issue marker click
  const handleIssueClick = useCallback((issue: InspectionIssue) => {
    if (onIssueClick) {
      onIssueClick(issue);
    }
  }, [onIssueClick]);

  if (filteredIssues.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none', // Let clicks pass through to canvas
        zIndex: 1000,
      }}
    >
      {filteredIssues.map((issue) => {
        // Transform world coordinates to screen coordinates
        const screenPos = worldToScreen(
          issue.location.position.x,
          issue.location.position.y,
          issue.fileId
        );

        // Skip if off-screen
        if (!isIssueVisible(screenPos.x, screenPos.y)) {
          return null;
        }

        // Keep marker close to the issue point, slightly above for readability.
        const markerY = screenPos.y - 2;

        return (
          <IssueMarker
            key={issue.id}
            issue={issue}
            screenX={screenPos.x}
            screenY={markerY}
            onClick={handleIssueClick}
            isHighlighted={issue.id === highlightedIssueId}
          />
        );
      })}
    </div>
  );
};

export default DetectionOverlay;
