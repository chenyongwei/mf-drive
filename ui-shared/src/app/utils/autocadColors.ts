// AutoCAD color index mapping
export const autocadColors: { [key: number]: string } = {
  0: '#ffffff', // ByBlock
  1: '#ff0000', // Red
  2: '#ffff00', // Yellow
  3: '#00ff00', // Green
  4: '#00ffff', // Cyan
  5: '#0000ff', // Blue
  6: '#ff00ff', // Magenta
  7: '#ffffff', // White/Black (depends on background)
  8: '#808080', // Gray
  9: '#c0c0c0', // Light Gray
};

// Convert AutoCAD color index or RGB value to CSS color
export function getAutocadColor(colorValue: number): string {
  // Check if it's a true color (RGB value > 255)
  if (colorValue > 255) {
    const r = (colorValue >> 16) & 0xFF;
    const g = (colorValue >> 8) & 0xFF;
    const b = colorValue & 0xFF;
    return `rgb(${r}, ${g}, ${b})`;
  }

  // AutoCAD color index (1-255)
  if (autocadColors[colorValue]) {
    return autocadColors[colorValue];
  }

  // For color indices >= 10, use AutoCAD's standard color palette
  if (colorValue >= 1 && colorValue <= 255) {
    // Simplified AutoCAD color palette
    const hue = ((colorValue - 1) % 6) * 60;
    const saturation = colorValue <= 9 ? 100 : 50;
    const lightness = colorValue <= 9 ? 50 : 60;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  return '#ffffff'; // Default white
}
