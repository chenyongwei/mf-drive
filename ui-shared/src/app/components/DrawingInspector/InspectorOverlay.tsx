/**
 * Inspector Overlay Component
 * Renders markers on the canvas for inspection issues
 */

import React, { useRef, useEffect } from 'react';
import { InspectionIssue, InspectionLevel } from '@dxf-fix/shared/types/inspection';

interface InspectorOverlayProps {
  canvas: HTMLCanvasElement | null;
  issues: InspectionIssue[];
  selectedIssueIds?: Set<string>;
  hoveredIssueId?: string;
  onIssueClick?: (issue: InspectionIssue) => void;
  onIssueHover?: (issue: InspectionIssue | null) => void;
  worldToScreen?: (x: number, y: number) => { x: number; y: number } | null;
  visible: boolean;
}

export const InspectorOverlay: React.FC<InspectorOverlayProps> = ({
  canvas,
  issues,
  selectedIssueIds = new Set(),
  hoveredIssueId,
  onIssueClick,
  onIssueHover,
  worldToScreen,
  visible,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!visible || !canvas || !overlayRef.current || !worldToScreen) {
      // Clear all markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      return;
    }

    // Update markers
    updateMarkers();

    // Handle canvas resize
    const resizeObserver = new ResizeObserver(() => {
      updateMarkers();
    });
    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
    };
  }, [canvas, issues, visible, worldToScreen]);

  const updateMarkers = () => {
    if (!overlayRef.current || !canvas || !worldToScreen) return;

    // Get canvas position
    const canvasRect = canvas.getBoundingClientRect();
    overlayRef.current.style.left = `${canvasRect.left}px`;
    overlayRef.current.style.top = `${canvasRect.top}px`;
    overlayRef.current.style.width = `${canvasRect.width}px`;
    overlayRef.current.style.height = `${canvasRect.height}px`;

    // Update or create markers for each issue
    issues.forEach((issue) => {
      const screenPos = worldToScreen(
        issue.location.position.x,
        issue.location.position.y
      );

      if (!screenPos) return;

      let marker = markersRef.current.get(issue.id);

      if (!marker) {
        marker = document.createElement('div');
        marker.className = 'inspection-marker';
        overlayRef.current!.appendChild(marker);
        markersRef.current.set(issue.id, marker);

        // Add click handler
        marker.addEventListener('click', () => {
          onIssueClick?.(issue);
        });

        // Add hover handlers
        marker.addEventListener('mouseenter', () => {
          onIssueHover?.(issue);
        });

        marker.addEventListener('mouseleave', () => {
          onIssueHover?.(null);
        });
      }

      // Update marker position and style
      const isSelected = selectedIssueIds.has(issue.id);
      const isHovered = issue.id === hoveredIssueId;
      const size = isSelected ? 28 : isHovered ? 22 : 18;
      const color = getMarkerColor(issue.level);

      marker.style.cssText = `
        position: absolute;
        left: ${screenPos.x - size / 2}px;
        top: ${screenPos.y - size / 2}px;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-color: ${color};
        border: ${isSelected ? '3px' : '2px'} solid white;
        box-shadow: ${isSelected ? '0 0 12px rgba(59, 130, 246, 0.8)' : '0 2px 4px rgba(0,0,0,0.3)'};
        cursor: pointer;
        transition: all 0.2s ease;
        transform: ${isSelected ? 'scale(1.3)' : isHovered ? 'scale(1.15)' : 'scale(1)'};
        z-index: ${isSelected ? 100 : isHovered ? 50 : 10};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${isSelected ? '16px' : isHovered ? '12px' : '11px'};
        color: white;
        font-weight: bold;
      `;

      marker.textContent = getMarkerIcon(issue.level);

      // Add tooltip
      marker.title = issue.message;
    });

    // Remove markers for issues that no longer exist
    const currentIssueIds = new Set(issues.map((i) => i.id));
    markersRef.current.forEach((marker, issueId) => {
      if (!currentIssueIds.has(issueId)) {
        marker.remove();
        markersRef.current.delete(issueId);
      }
    });
  };

  const getMarkerColor = (level: InspectionLevel): string => {
    switch (level) {
      case InspectionLevel.ERROR:
        return '#dc2626'; // red-600
      case InspectionLevel.WARNING:
        return '#ca8a04'; // yellow-600
      case InspectionLevel.INFO:
        return '#2563eb'; // blue-600
      default:
        return '#6b7280'; // gray-500
    }
  };

  const getMarkerIcon = (level: InspectionLevel): string => {
    switch (level) {
      case InspectionLevel.ERROR:
        return '✕';
      case InspectionLevel.WARNING:
        return '!';
      case InspectionLevel.INFO:
        return '●';
      default:
        return '?';
    }
  };

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      className="inspection-overlay pointer-events-none fixed top-0 left-0"
      style={{ zIndex: 50 }}
    >
      <style>{`
        .inspection-marker:hover {
          transform: scale(1.2) !important;
          z-index: 60 !important;
        }
      `}</style>
    </div>
  );
};
