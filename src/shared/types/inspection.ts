import type { Point } from './base';

/**
 * Severity levels for inspection issues
 */
export enum InspectionLevel {
  INFO = 'info',       // Informational (e.g., unclosed lines)
  WARNING = 'warning', // Warning (e.g., duplicate lines)
  ERROR = 'error'      // Error (e.g., overlapping lines)
}

/**
 * Types of inspection issues
 */
export enum IssueType {
  UNCLOSED_CONTOUR = 'unclosed_contour',         // Unclosed contour (gap detected)
  DUPLICATE_LINES = 'duplicate_lines',           // Duplicate or near-duplicate lines
  OVERLAPPING_LINES = 'overlapping_lines',       // Lines that intersect/cross in middle
  SELF_INTERSECTION = 'self_intersection',       // Contour that intersects itself
  TINY_ENTITY = 'tiny_entity',                   // Entity too small to cut
  ZERO_LENGTH = 'zero_length'                    // Line with zero length
}

/**
 * A single inspection issue
 */
export interface InspectionIssue {
  id: string;
  type: IssueType;
  level: InspectionLevel;
  message: string;          // Human-readable description
  location: {
    position: Point;        // Position to highlight
    radius?: number;        // Highlight radius for zoom
  };
  entities?: string[];      // Entity IDs involved in this issue
  fileId?: string;          // File ID this issue belongs to (for batch inspection)
  data?: {                  // Additional issue-specific data
    gapDistance?: number;   // For unclosed contours (in mm)
    tolerance?: number;     // For duplicate lines (detected tolerance)
    overlapCount?: number;  // For overlapping lines (number of intersections)
    contourId?: string;     // For contour-related issues
  };
}

/**
 * Summary statistics for inspection results
 */
export interface InspectionSummary {
  total: number;
  info: number;
  warning: number;
  error: number;
}

/**
 * Complete inspection result for a file
 */
export interface InspectionResult {
  fileId: string;
  timestamp: number;
  tolerance: number;
  summary: InspectionSummary;
  issues: InspectionIssue[];
  recommendations?: string[];  // Optional suggestions for fixing issues
}

/**
 * Status of an ongoing inspection
 */
export interface InspectionStatus {
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;          // 0-100
  error?: string;
}
