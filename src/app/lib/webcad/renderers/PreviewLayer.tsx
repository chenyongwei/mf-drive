import React from 'react';
import { Line, Circle, Text } from 'react-konva';
import type { OptimizationPreview } from '@dxf-fix/shared';

interface PreviewLayerProps {
  duplicates: OptimizationPreview['duplicates'];
  merges: OptimizationPreview['merges'];
  closures: OptimizationPreview['closures'];
  viewZoom: number;
}

export const PreviewLayer: React.FC<PreviewLayerProps> = ({
  duplicates,
  merges,
  closures,
  viewZoom,
}) => {
  const flattenPoints = (points: any[]): number[] => {
    return points.flatMap((p) => [p.x, p.y]);
  };

  return (
    <>
      {/* 重复线 - 红色虚线 */}
      {duplicates.map((dup) => (
        <Line
          key={`dup-${dup.groupId}`}
          points={[
            dup.line.start.x,
            dup.line.start.y,
            dup.line.end.x,
            dup.line.end.y,
          ]}
          stroke="rgba(239, 68, 68, 0.7)"
          strokeWidth={2}
          dash={[8, 4]}
          opacity={0.7}
          globalCompositeOperation="source-over"
        />
      ))}

      {/* 合并连接 - 黄色虚线 + 圆点 */}
      {merges.map((merge) => (
        <React.Fragment key={`merge-${merge.groupId}`}>
          {/* 合并后的多边形 */}
          <Line
            points={flattenPoints(merge.mergedPolyline)}
            stroke="rgba(234, 179, 8, 0.6)"
            strokeWidth={3}
            dash={[10, 5]}
            opacity={0.8}
          />
          {/* 连接点 - 圆点标记 */}
          {merge.connectionPoints.map((point, idx) => (
            <Circle
              key={`conn-${merge.groupId}-${idx}`}
              x={point.x}
              y={point.y}
              radius={Math.max(3, 6 / viewZoom)}
              fill="rgba(234, 179, 8, 0.9)"
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth={1}
            />
          ))}
        </React.Fragment>
      ))}

      {/* 闭合轮廓 - 绿色虚线 + 标注 */}
      {closures.map((closure, idx) => (
        <React.Fragment key={`closure-${idx}`}>
          <Line
            points={[
              closure.closeLine.start.x,
              closure.closeLine.start.y,
              closure.closeLine.end.x,
              closure.closeLine.end.y,
            ]}
            stroke="rgba(34, 197, 94, 0.8)"
            strokeWidth={2}
            dash={[5, 3]}
            opacity={0.9}
          />
          {/* 间隙距离标注 */}
          <Text
            x={(closure.closeLine.start.x + closure.closeLine.end.x) / 2}
            y={(closure.closeLine.start.y + closure.closeLine.end.y) / 2 - 15 / viewZoom}
            text={`${closure.gapDistance.toFixed(3)}mm`}
            fontSize={Math.max(12, 16 / viewZoom)}
            fill="rgba(34, 197, 94, 1)"
            fontFamily="Arial"
            fontStyle="bold"
            offsetX={0}
            offsetY={0}
          />
        </React.Fragment>
      ))}
    </>
  );
};
