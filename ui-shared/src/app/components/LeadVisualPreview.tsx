import React, { useRef, useEffect } from 'react';
import { LeadConfig as LeadConfigType, LeadType } from '@dxf-fix/shared';
import { drawOnCanvas2D } from './common/canvas2d';

interface LeadVisualPreviewProps {
  leadIn: LeadConfigType;
  leadOut: LeadConfigType;
  contourDirection: 'CW' | 'CCW';
  onTypeChange?: (lead: 'in' | 'out', type: LeadType) => void;
}

export const LeadVisualPreview: React.FC<LeadVisualPreviewProps> = ({
  leadIn,
  leadOut,
  contourDirection,
  onTypeChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawOnCanvas2D(canvasRef, (ctx, canvas) => {
      // 设置变换矩阵，将原点移到画布中心
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(1, -1); // 翻转Y轴

      // 绘制轮廓
      drawContour(ctx);

      // 绘制引入引线
      if (leadIn.enabled && leadIn.type !== 'NONE') {
        drawLead(ctx, leadIn, 'in', contourDirection);
      }

      // 绘制引出引线
      if (leadOut.enabled && leadOut.type !== 'NONE') {
        drawLead(ctx, leadOut, 'out', contourDirection);
      }

      // 重置变换
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // 绘制标签
      drawLabels(ctx, canvas);
    });
  }, [leadIn, leadOut, contourDirection]);

  const drawContour = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();

    // 绘制一个简单的矩形轮廓作为示例
    const width = 100;
    const height = 80;

    ctx.moveTo(-width / 2, -height / 2);
    ctx.lineTo(width / 2, -height / 2);
    ctx.lineTo(width / 2, height / 2);
    ctx.lineTo(-width / 2, height / 2);
    ctx.closePath();

    ctx.stroke();
  };

  const drawLead = (
    ctx: CanvasRenderingContext2D,
    leadConfig: LeadConfigType,
    leadType: 'in' | 'out',
    direction: 'CW' | 'CCW'
  ) => {
    const contourStart = { x: 0, y: -40 };
    const contourEnd = { x: 0, y: 40 };
    const startPoint = leadType === 'in' ? contourStart : contourEnd;
    const offsetAngle = leadType === 'in' ? 0 : Math.PI;

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const points = generateLeadPath(
      startPoint,
      leadConfig.type,
      leadConfig.length,
      leadConfig.angle,
      leadConfig.arcRadius || 5,
      leadConfig.spiralTurns || 1.5,
      offsetAngle
    );

    if (points.length > 0) {
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
    }

    ctx.stroke();

    // 绘制起点和终点标记
    ctx.fillStyle = '#ef4444';
    if (points.length > 0) {
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const generateLeadPath = (
    targetPoint: { x: number; y: number },
    type: LeadType,
    length: number,
    angle: number,
    arcRadius: number,
    spiralTurns: number,
    offsetAngle: number
  ): { x: number; y: number }[] => {
    const points: { x: number; y: number }[] = [];
    const angleRad = (angle * Math.PI) / 180;

    switch (type) {
      case 'NONE':
        return [];

      case 'LINEAR':
        const linearAngle = angleRad + offsetAngle;
        const linearStart = {
          x: targetPoint.x + Math.cos(linearAngle) * length,
          y: targetPoint.y + Math.sin(linearAngle) * length,
        };
        points.push(linearStart, targetPoint);
        break;

      case 'TANGENT':
        const tangentAngle = angleRad + Math.PI / 2 + offsetAngle;
        const tangentStart = {
          x: targetPoint.x + Math.cos(tangentAngle) * length,
          y: targetPoint.y + Math.sin(tangentAngle) * length,
        };
        points.push(tangentStart, targetPoint);
        break;

      case 'ARC':
        const segments = 20;
        const arcCenter = {
          x: targetPoint.x - arcRadius,
          y: targetPoint.y,
        };
        const startAngle = offsetAngle === 0 ? 0 : Math.PI;
        const endAngle = offsetAngle === 0 ? Math.PI / 2 : Math.PI * 1.5;
        const step = (endAngle - startAngle) / segments;

        for (let i = 0; i <= segments; i++) {
          const currentAngle = startAngle + step * i;
          points.push({
            x: arcCenter.x + arcRadius * Math.cos(currentAngle),
            y: arcCenter.y + arcRadius * Math.sin(currentAngle),
          });
        }
        break;

      case 'SPIRAL':
        const spiralSegments = 30;
        const totalAngle = 2 * Math.PI * spiralTurns;
        const spiralStep = totalAngle / spiralSegments;

        for (let i = 0; i <= spiralSegments; i++) {
          const currentAngle = spiralStep * i;
          const currentRadius = (arcRadius * i) / spiralSegments;
          points.push({
            x: targetPoint.x + currentRadius * Math.cos(currentAngle + offsetAngle),
            y: targetPoint.y + currentRadius * Math.sin(currentAngle + offsetAngle),
          });
        }
        break;

      default:
        return [];
    }

    return points;
  };

  const drawLabels = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.fillStyle = '#1f2937';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';

    // 引入引线标签
    if (leadIn.enabled) {
      ctx.fillText('引入', canvas.width / 2, 20);
    }

    // 引出引线标签
    if (leadOut.enabled) {
      ctx.fillText('引出', canvas.width / 2, canvas.height - 10);
    }

    // 类型选择按钮
    const startY = 40;
    const types: { value: LeadType; label: string }[] = [
      { value: 'NONE', label: '无' },
      { value: 'LINEAR', label: '直线' },
      { value: 'TANGENT', label: '切向' },
      { value: 'ARC', label: '圆弧' },
      { value: 'SPIRAL', label: '螺旋' },
    ];

    if (onTypeChange) {
      // 简单的按钮组（实际应该用组件实现）
      types.forEach((type, index) => {
        const x = 20 + index * 55;
        const y = canvas.height - 30;

        ctx.fillStyle = leadIn.type === type.value ? '#3b82f6' : '#e5e7eb';
        ctx.fillRect(x, y, 50, 24);

        ctx.fillStyle = leadIn.type === type.value ? '#ffffff' : '#1f2937';
        ctx.font = '11px sans-serif';
        ctx.fillText(type.label, x + 25, y + 16);
      });
    }
  };

  return (
    <div className="lead-visual-preview">
      <div className="preview-title">引线可视化预览</div>
      <canvas ref={canvasRef} width={300} height={200} />
    </div>
  );
};
