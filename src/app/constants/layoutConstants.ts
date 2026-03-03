/**
 * CAD Layout Constants
 * 
 * Centralized configuration for CAD view layout parameters.
 * All layout-related constants should be defined here to ensure consistency.
 */

// Maximum width before wrapping to next row (in world units, mm)
export const ROW_WIDTH = 100000;

// Spacing between parts/files in layout (in mm)
export const SPACING = 200;

// Expansion around bounding box (in mm)
export const EXPANSION = 50;

// Minimum clearance between file frames (in mm)
export const FILE_FRAME_CLEARANCE_MM = 50;

// Part-specific spacing (used in PartViewerWebCAD)
export const PART_SPACING = 100;

// Part-specific expansion (used in PartViewerWebCAD)
export const PART_EXPANSION = 100;

// Group spacing for compare view (in mm)
export const GROUP_SPACING = 200;
