import React from 'react';
import { Circle, Line, Text as KonvaText, Arc } from 'react-konva';

interface EntityRendererProps {
  entity: any;
  offsetX?: number;
  offsetY?: number;
}

// Comprehensive Pantone colors
const PANTONE_COLORS = [
  // Yellows
  '#FFD700', // Pantone Yellow C
  '#FFC125', // Pantone 116 C
  '#FFD100', // Pantone 109 C
  '#F8F32B', // Pantone 107 C
  '#FFD347', // Pantone 115 C
  '#F9D23C', // Pantone 120 C
  '#FFDE59', // Pantone 106 C
  '#FFC947', // Pantone 130 C
  '#FFB347', // Pantone 137 C
  '#FFA500', // Pantone 1375 C

  // Oranges
  '#FF8C00', // Pantone 130 C
  '#FF7F50', // Pantone 158 C
  '#FF6347', // Pantone 166 C
  '#FF4500', // Pantone 172 C
  '#FF5733', // Pantone 165 C
  '#FF6F61', // Pantone 1655 C
  '#E67E22', // Pantone 1665 C
  '#F39C12', // Pantone 1375 C
  '#F1C40F', // Pantone 115 C
  '#FFA07A', // Pantone 1585 C

  // Reds
  '#FF0000', // Pantone 186 C
  '#DC143C', // Pantone 186 C
  '#B22222', // Pantone 187 C
  '#FF6B6B', // Pantone 706 C
  '#C0392B', // Pantone 484 C
  '#E74C3C', // Pantone 186 C
  '#FF5252', // Pantone 706 C
  '#D32F2F', // Pantone 186 C
  '#B71C1C', // Pantone 186 C
  '#BE3455', // Pantone 706 C

  // Pinks
  '#FFC0CB', // Pantone 219 C
  '#FFB6C1', // Pantone 218 C
  '#FF69B4', // Pantone 236 C
  '#FF1493', // Pantone 219 C
  '#DB7093', // Pantone 238 C
  '#C71585', // Pantone 238 C
  '#F7CAC9', // Pantone 13-1520 TCX
  '#E8ADAA', // Pantone 16-1546 TCX
  '#D98194', // Pantone 17-1530 TCX
  '#E8B4BC', // Pantone 14-1911 TCX

  // Purples
  '#9370DB', // Pantone 2665 C
  '#8A2BE2', // Pantone 266 C
  '#6A5ACD', // Pantone 2716 C
  '#5F4B8B', // Pantone 266 C
  '#6667AB', // Pantone 17-3938 TCX
  '#7695FF', // Pantone 2728 C
  '#9D00FF', // Pantone 2665 C
  '#8B008B', // Pantone 260 C
  '#9932CC', // Pantone 2592 C
  '#7B68EE', // Pantone 2727 C

  // Blues
  '#0000FF', // Pantone 300 C
  '#00008B', // Pantone 287 C
  '#1E90FF', // Pantone 292 C
  '#00BFFF', // Pantone 298 C
  '#4169E1', // Pantone 280 C
  '#6495ED', // Pantone 292 C
  '#0F4C81', // Pantone 19-4052 TCX
  '#4682B4', // Pantone 284 C
  '#5F9EA0', // Pantone 286 C
  '#87CEEB', // Pantone 291 C

  // Cyans/Teals
  '#4ecdc4', // Pantone 325 C
  '#00CED1', // Pantone 326 C
  '#40E0D0', // Pantone 3255 C
  '#008B8B', // Pantone 320 C
  '#20B2AA', // Pantone 3265 C
  '#66CDAA', // Pantone 3268 C
  '#48D1CC', // Pantone 3252 C
  '#7FFFD4', // Pantone 304 C
  '#00CED1', // Pantone 326 C
  '#008080', // Pantone 318 C

  // Greens
  '#00FF00', // Pantone 348 C
  '#32CD32', // Pantone 7481 C
  '#90EE90', // Pantone 353 C
  '#00FA9A', // Pantone 3405 C
  '#3CB371', // Pantone 348 C
  '#228B22', // Pantone 347 C
  '#88B04B', // Pantone 15-0343 TCX
  '#006400', // Pantone 3425 C
  '#2E8B57', // Pantone 342 C
  '#8FBC8F', // Pantone 357 C

  // Browns/Tans
  '#8B4513', // Pantone 4625 C
  '#A0522D', // Pantone 4625 C
  '#CD853F', // Pantone 4615 C
  '#D2691E', // Pantone 7516 C
  '#964E38', // Pantone 19-1119 TCX
  '#8B7355', // Pantone 7516 C
  '#A0522D', // Pantone 4625 C
  '#CD853F', // Pantone 4615 C
  '#D2B48C', // Pantone 4685 C
  '#DEB887', // Pantone 462 C

  // Grays
  '#939597', // Pantone 17-5104 TCX
  '#808080', // Pantone Cool Gray 8 C
  '#696969', // Pantone Cool Gray 9 C
  '#505050', // Pantone Cool Gray 10 C
  '#C0C0C0', // Pantone Cool Gray 4 C
  '#A9A9A9', // Pantone Cool Gray 5 C
  '#D3D3D3', // Pantone Cool Gray 2 C
  '#BEBEBE', // Pantone Cool Gray 3 C
  '#778899', // Pantone Cool Gray 6 C
  '#708090', // Pantone Cool Gray 7 C

  // Whites/Off-whites
  '#FFFFFF', // Pantone White
  '#FFFAFA', // Pantone 905 C
  '#F5F5F5', // Pantone 905 C
  '#FFFEF0', // Pantone 905 C
  '#FFFAF0', // Pantone 905 C
  '#FDF5E6', // Pantone 905 C
  '#FAF0E6', // Pantone 905 C
  '#FFEFDB', // Pantone 905 C
  '#FFE4C4', // Pantone 905 C
  '#FFDAB9', // Pantone 905 C

  // Blacks
  '#000000', // Pantone Process Black
  '#1A1A1A', // Pantone Black C
  '#2C2C2C', // Pantone Black 2 C
  '#363636', // Pantone Black 3 C
  '#404040', // Pantone Black 4 C
  '#4A4A4A', // Pantone Black 5 C
  '#545454', // Pantone Black 6 C
  '#5E5E5E', // Pantone Black 7 C
];

// Get random fill color based on partId (so same part always gets same color)
const getFillColor = (partId: string): string => {
  if (!partId) return 'transparent';

  // Simple hash to get consistent color for same partId
  let hash = 0;
  for (let i = 0; i < partId.length; i++) {
    hash = partId.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % PANTONE_COLORS.length;
  return PANTONE_COLORS[index];
};

const EntityRenderer: React.FC<EntityRendererProps> = ({ entity, offsetX = 0, offsetY = 0 }) => {
  const getLayerColor = (channelport: number): string => {
    const colors: Record<number, string> = {
      1: '#00ff00',      // 正常切割 - 绿色
      2: '#ff6b6b',      // 慢速切割 - 红色
      3: '#4ecdc4',      // 打标/除锈/去膜 - 青色
      4: '#ffe66d',      // 切断线 - 黄色
    };
    return colors[channelport] || '#888888';
  };

  const color = getLayerColor(entity.channelport);
  // 内轮廓（孔）不填充
  const isInnerContour = entity.isInnerContour === true;
  const fillColor = isInnerContour ? 'transparent' : getFillColor(entity.partId);
  const fillEnabled = !isInnerContour;


  switch (entity.type) {
    case 'lwpolyline':
      return <LwPolylineRenderer entity={entity} color={color} fillColor={fillColor} fillEnabled={fillEnabled} offsetX={offsetX} offsetY={offsetY} />;
    case 'circle':
      return <CircleRenderer entity={entity} color={color} fillColor={fillColor} fillEnabled={fillEnabled} offsetX={offsetX} offsetY={offsetY} />;
    case 'arc':
      return <ArcRenderer entity={entity} color={color} offsetX={offsetX} offsetY={offsetY} />;
    case 'line':
      return <LineRenderer entity={entity} color={color} offsetX={offsetX} offsetY={offsetY} />;
    case 'text':
      return <TextRenderer entity={entity} color={color} offsetX={offsetX} offsetY={offsetY} />;
    default:
      return null;
  }
};

const LwPolylineRenderer: React.FC<{ entity: any; color: string; fillColor?: string; fillEnabled?: boolean; offsetX?: number; offsetY?: number }> = ({ entity, color, fillColor = 'transparent', fillEnabled = true, offsetX = 0, offsetY = 0 }) => {
  const { points } = entity;
  const flatPoints: number[] = [];

  points.forEach((point: any) => {
    flatPoints.push(point.x + offsetX, point.y + offsetY);
    // Handle bulge for arcs in polyline
    if (point.bulge !== undefined && point.bulge !== 0) {
      const nextIndex = (points.indexOf(point) + 1) % points.length;
      const nextPoint = points[nextIndex];

      // Simplified: just add next point
      // TODO: Implement proper arc generation from bulge
      if (nextPoint) {
        flatPoints.push(nextPoint.x + offsetX, nextPoint.y + offsetY);
      }
    }
  });

  return (
    <Line
      points={flatPoints}
      stroke={color}
      strokeWidth={0.5}
      fill={fillColor}
      fillEnabled={fillEnabled}
      closed={entity.polyflag === 1}
    />
  );
};

const CircleRenderer: React.FC<{ entity: any; color: string; fillColor?: string; fillEnabled?: boolean; offsetX?: number; offsetY?: number }> = ({ entity, color, fillColor = 'transparent', fillEnabled = true, offsetX = 0, offsetY = 0 }) => {
  // 使用潘通色填充外轮廓，边框用 layer color
  // isInnerContour=true 表示内轮廓（孔），不填充
  return (
    <Circle
      x={entity.center.x + offsetX}
      y={entity.center.y + offsetY}
      radius={entity.radius}
      stroke={color}
      strokeWidth={0.5}
      fill={fillColor}
      fillEnabled={fillEnabled}
    />
  );
};

const ArcRenderer: React.FC<{ entity: any; color: string; offsetX?: number; offsetY?: number }> = ({ entity, color, offsetX = 0, offsetY = 0 }) => {
  const startAngleRad = (entity.startangle * Math.PI) / 180;
  const endAngleRad = ((entity.startangle + entity.anglesweep) * Math.PI) / 180;

  return (
    <Arc
      x={entity.center.x + offsetX}
      y={entity.center.y + offsetY}
      innerRadius={entity.radius - 0.25}
      outerRadius={entity.radius}
      angle={entity.anglesweep}
      rotation={entity.startangle}
      stroke={color}
      strokeWidth={0.5}
    />
  );
};

const LineRenderer: React.FC<{ entity: any; color: string; offsetX?: number; offsetY?: number }> = ({ entity, color, offsetX = 0, offsetY = 0 }) => {
  return (
    <Line
      points={[entity.start.x + offsetX, entity.start.y + offsetY, entity.end.x + offsetX, entity.end.y + offsetY]}
      stroke={color}
      strokeWidth={0.5}
    />
  );
};

const TextRenderer: React.FC<{ entity: any; color: string; offsetX?: number; offsetY?: number }> = ({ entity, color, offsetX = 0, offsetY = 0 }) => {
  return (
    <KonvaText
      x={entity.alignpos.x + offsetX}
      y={entity.alignpos.y + offsetY}
      text={entity.content}
      fontSize={entity.height || 5}
      fontFamily="Arial"
      fill={color}
      width={entity.content.length * entity.height}
    />
  );
};

export default EntityRenderer;
