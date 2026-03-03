/**
 * Utility functions for RibbonLayoutV2 component
 */

/**
 * Generate a simple thumbnail placeholder as SVG data URL
 */
export const generateThumbnailPlaceholder = (
  partName: string,
  width: number,
  height: number
): string => {
  const svg = `
    <svg width="120" height="80" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="80" fill="#f3f4f6"/>
      <rect x="10" y="10" width="100" height="60" fill="#d1d5db" rx="4"/>
      <text x="60" y="40" font-size="10" fill="#4b5563" text-anchor="middle" dominant-baseline="middle">${partName.substring(
      0,
      8
    )}</text>
      <text x="60" y="55" font-size="8" fill="#6b7280" text-anchor="middle">${width.toFixed(
      0
    )}×${height.toFixed(0)}</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * Calculate view mode based on selections
 */
export const calculateViewMode = (
  selectedResultIds: Set<string>,
  selectedPartIds: Set<string>
): 'parts' | 'nesting' | 'multi' | 'empty' => {
  if (selectedResultIds.size > 1) {
    return 'multi';
  } else if (selectedResultIds.size === 1) {
    return 'nesting';
  } else if (selectedPartIds.size > 0) {
    return 'parts';
  } else {
    return 'empty';
  }
};
