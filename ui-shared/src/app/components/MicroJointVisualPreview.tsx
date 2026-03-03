import React, { useRef, useEffect, useState } from 'react';
import { MicroJointConfig } from '@dxf-fix/shared';
import { drawOnCanvas2D } from './common/canvas2d';

interface MicroJointVisualPreviewProps {
  config: MicroJointConfig;
  contourLength: number;
  onPositionChange?: (positions: number[]) => void;
}

export const MicroJointVisualPreview: React.FC<MicroJointVisualPreviewProps> = ({
  config,
  contourLength,
  onPositionChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggedPoint, setDraggedPoint] = useState<number | null>(null);

  // 计算微连位置
  const jointPositions = React.useMemo(() => {
    if (config.distribution === 'EVEN') {
      const step = 100 / (config.count + 1);
      return Array.from({ length: config.count }, (_, i) => step * (i + 1));
    }
    return config.positions || [];
  }, [config]);

  // 绘制轮廓和微连
  useEffect(() => {
    drawOnCanvas2D(canvasRef, (ctx) => {
      // 绘制轮廓线
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(50, 80);
      ctx.lineTo(250, 80);
      ctx.stroke();

      // 绘制微连位置
      if (config.enabled) {
        jointPositions.forEach((pos, index) => {
          const x = 50 + (pos / 100) * 200;

          // 绘制微连标记
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(x, 80, 6, 0, Math.PI * 2);
          ctx.fill();

          // 绘制微连标签
          ctx.fillStyle = '#1f2937';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`微连${index + 1}`, x, 60);
        });
      }

      // 绘制刻度
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('0%', 50, 150);
      ctx.fillText('50%', 150, 150);
      ctx.fillText('100%', 250, 150);
    });
  }, [config, jointPositions]);

  // 处理拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    if (config.distribution !== 'MANUAL' || !onPositionChange) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 检查是否点击了某个微连点
    jointPositions.forEach((pos, index) => {
      const pointX = 50 + (pos / 100) * 200;
      if (Math.abs(x - pointX) < 15 && Math.abs(y - 80) < 15) {
        setDraggedPoint(index);
      }
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedPoint === null || config.distribution !== 'MANUAL' || !onPositionChange) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(50, Math.min(e.clientX - rect.left, 250));
    const pos = ((x - 50) / 200) * 100;

    const newPositions = [...jointPositions];
    newPositions[draggedPoint] = pos;
    onPositionChange(newPositions);
  };

  const handleMouseUp = () => {
    setDraggedPoint(null);
  };

  const handleMouseLeave = () => {
    setDraggedPoint(null);
  };

  const addPosition = () => {
    if (config.distribution !== 'MANUAL' || !onPositionChange) return;
    const newPos = 50;
    onPositionChange([...jointPositions, newPos]);
  };

  const removePosition = (index: number) => {
    if (config.distribution !== 'MANUAL' || !onPositionChange) return;
    onPositionChange(jointPositions.filter((_, i) => i !== index));
  };

  const updatePosition = (index: number, value: number) => {
    if (config.distribution !== 'MANUAL' || !onPositionChange) return;
    const newPositions = [...jointPositions];
    newPositions[index] = Math.max(0, Math.min(100, value));
    onPositionChange(newPositions);
  };

  return (
    <div className="micro-joint-visual-preview">
      <div className="preview-title">微连可视化预览</div>
      <canvas
        ref={canvasRef}
        width={300}
        height={160}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ border: '1px solid #e5e7eb', borderRadius: '4px' }}
      />
      {config.distribution === 'MANUAL' && (
        <div className="manual-distribution">
          <div className="position-list">
            {jointPositions.map((pos, index) => (
              <div key={index} className="position-item">
                <label>
                  微连{index + 1}位置:
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={pos.toFixed(1)}
                    onChange={(e) => updatePosition(index, parseFloat(e.target.value))}
                  />
                  %
                </label>
                <button onClick={() => removePosition(index)}>删除</button>
              </div>
            ))}
          </div>
          <div className="position-actions">
            <button onClick={addPosition} className="btn-small">
              + 添加位置
            </button>
            <button
              onClick={() => onPositionChange?.([])}
              className="btn-small btn-danger"
            >
              清除全部
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
