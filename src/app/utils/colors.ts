/**
 * Get color based on utilization percentage
 */
export function getUtilizationColor(percentage: number): string {
  if (percentage >= 90) return '#22c55e'; // green
  if (percentage >= 75) return '#84cc16'; // lime
  if (percentage >= 60) return '#eab308'; // yellow
  if (percentage >= 40) return '#f97316'; // orange
  return '#ef4444'; // red
}

/**
 * Get color based on status
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    success: '#22c55e',
    completed: '#22c55e',
    ready: '#22c55e',

    warning: '#eab308',
    pending: '#eab308',
    processing: '#3b82f6',

    error: '#ef4444',
    failed: '#ef4444',
    rejected: '#ef4444',

    info: '#3b82f6',
    loading: '#6b7280',

    default: '#6b7280',
  };

  return colors[status.toLowerCase()] || colors.default;
}

/**
 * Lighten color by amount
 */
export function lightenColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);

  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
  const b = Math.min(255, (num & 0x0000FF) + amount);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Darken color by amount
 */
export function darkenColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);

  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
  const b = Math.max(0, (num & 0x0000FF) - amount);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Convert hex to RGBA
 */
export function hexToRgba(hex: string, alpha: number): string {
  const hexValue = hex.replace('#', '');
  const r = parseInt(hexValue.substring(0, 2), 16);
  const g = parseInt(hexValue.substring(2, 4), 16);
  const b = parseInt(hexValue.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
