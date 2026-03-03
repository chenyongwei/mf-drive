const PANTONE_COLORS = [
  '#FFD700', '#FFC125', '#FFD100', '#F8F32B', '#FFD347', '#F9D23C', '#FFDE59', '#FFC947',
  '#FFB347', '#FFA500', '#FF8C00', '#FF7F50', '#FF6347', '#FF4500', '#FF5733', '#FF6F61',
  '#E67E22', '#F39C12', '#F1C40F', '#FFA07A', '#FF0000', '#DC143C', '#B22222', '#FF6B6B',
  '#C0392B', '#E74C3C', '#FF5252', '#D32F2F', '#B71C1C', '#BE3455', '#FFC0CB', '#FFB6C1',
  '#FF69B4', '#FF1493', '#DB7093', '#C71585', '#F7CAC9', '#E8ADAA', '#D98194', '#E8B4BC',
  '#9370DB', '#8A2BE2', '#6A5ACD', '#5F4B8B', '#6667AB', '#7695FF', '#9D00FF', '#8B008B',
  '#9932CC', '#7B68EE', '#0000FF', '#00008B', '#1E90FF', '#00BFFF', '#4169E1', '#6495ED',
  '#0F4C81', '#4682B4', '#5F9EA0', '#87CEEB', '#4ecdc4', '#00CED1', '#40E0D0', '#008B8B',
  '#20B2AA', '#66CDAA', '#48D1CC', '#7FFFD4', '#00CED1', '#008080', '#00FF00', '#32CD32',
  '#90EE90', '#00FA9A', '#3CB371', '#228B22', '#88B04B', '#006400', '#2E8B57', '#8FBC8F',
  '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#964E38', '#8B7355', '#A0522D', '#CD853F',
  '#D2B48C', '#DEB887', '#939597', '#808080', '#696969', '#505050', '#C0C0C0', '#A9A9A9',
  '#D3D3D3', '#BEBEBE', '#778899', '#708090', '#FFFFFF', '#FFFAFA', '#F5F5F5', '#FFFEF0',
  '#FFFAF0', '#FDF5E6', '#FAF0E6', '#FFEFDB', '#FFE4C4', '#FFDAB9', '#000000', '#1A1A1A',
  '#2C2C2C', '#363636', '#404040', '#4A4A4A', '#545454', '#5E5E5E',
];

export function getRandomPantoneColor(partId: string): string {
  if (!partId) {
    return PANTONE_COLORS[0];
  }
  let hash = 0;
  for (let i = 0; i < partId.length; i += 1) {
    hash = partId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PANTONE_COLORS.length;
  return PANTONE_COLORS[index];
}
