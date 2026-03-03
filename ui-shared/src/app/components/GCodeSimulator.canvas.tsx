import React from "react";
import { Circle, Layer, Line, Rect } from "react-konva";
import { GCodeCommand, Point } from "../services/gcodeParser";

interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface GCodeSimulatorCanvasProps {
  bbox: { minX: number; minY: number; maxX: number; maxY: number } | null;
  view: ViewState;
  commands: GCodeCommand[];
  currentIndex: number;
  transformPoint: (point: Point) => Point;
  transformedCurrentPos: Point;
}

function getCommandStroke(type: GCodeCommand["type"]): string {
  switch (type) {
    case "RAPID":
      return "#999";
    case "LINEAR":
      return "#ef4444";
    case "ARC_CW":
    case "ARC_CCW":
      return "#22c55e";
    default:
      return "#666";
  }
}

export const GCodeSimulatorCanvas: React.FC<GCodeSimulatorCanvasProps> = ({
  bbox,
  view,
  commands,
  currentIndex,
  transformPoint,
  transformedCurrentPos,
}) => {
  return (
    <Layer>
      {bbox && (
        <Rect
          x={bbox.minX * view.scale + view.offsetX}
          y={bbox.minY * view.scale + view.offsetY}
          width={(bbox.maxX - bbox.minX) * view.scale}
          height={(bbox.maxY - bbox.minY) * view.scale}
          stroke="#ccc"
          strokeWidth={1 / view.scale}
          dash={[5, 5]}
        />
      )}

      {commands.slice(0, currentIndex + 1).map((cmd, index) => {
        const points = cmd.arcPoints || [cmd.start, cmd.end];
        const transformedPoints = points.map((point) => transformPoint(point));
        return (
          <Line
            key={`done-${index}`}
            points={transformedPoints.flatMap((point) => [point.x, point.y])}
            stroke={getCommandStroke(cmd.type)}
            strokeWidth={2 / view.scale}
            dash={cmd.type === "RAPID" ? [5, 5] : []}
            lineCap="round"
            lineJoin="round"
          />
        );
      })}

      {commands.slice(currentIndex + 1).map((cmd, index) => {
        const points = cmd.arcPoints || [cmd.start, cmd.end];
        const transformedPoints = points.map((point) => transformPoint(point));
        return (
          <Line
            key={`future-${index}`}
            points={transformedPoints.flatMap((point) => [point.x, point.y])}
            stroke="#e0e0e0"
            strokeWidth={1 / view.scale}
            dash={[2, 2]}
            opacity={0.5}
          />
        );
      })}

      <Circle
        x={transformedCurrentPos.x}
        y={transformedCurrentPos.y}
        radius={8 / view.scale}
        fill="#3b82f6"
        stroke="#fff"
        strokeWidth={2 / view.scale}
      />
    </Layer>
  );
};
