import React, { useState } from 'react';
import type { ScrapLine, ScrapLineType, Point } from '@dxf-fix/shared';
import { SCRAP_LINE_EDITOR_CSS } from './ScrapLineEditor.styles';

interface ScrapLineEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onAddScrapLine: (line: ScrapLine) => void;
  parts?: Array<{ id: string; name: string; contour?: any }>;
}

const ScrapLineEditor: React.FC<ScrapLineEditorProps> = ({
  isOpen,
  onClose,
  onAddScrapLine,
  parts = [],
}) => {
  const [lineType, setLineType] = useState<ScrapLineType>('LINE');
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [center, setCenter] = useState<Point>({ x: 100, y: 100 });
  const [radius, setRadius] = useState(50);
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(50);

  if (!isOpen) return null;

  const handleAddScrapLine = () => {
    const scrapLine: ScrapLine = {
      id: `scrap_${Date.now()}`,
      type: lineType,
      points: [],
      area: 0,
      createdAt: new Date().toISOString(),
    };

    switch (lineType) {
      case 'LINE':
        scrapLine.points = [
          { x: 0, y: 0 },
          { x: width, y: 0 },
        ];
        break;
      case 'TRIANGLE':
        scrapLine.points = [
          { x: width / 2, y: 0 },
          { x: 0, y: height },
          { x: width, y: height },
        ];
        scrapLine.area = (width * height) / 2;
        break;
      case 'TRAPEZOID':
        const topWidth = width * 0.6;
        scrapLine.points = [
          { x: (width - topWidth) / 2, y: 0 },
          { x: (width + topWidth) / 2, y: 0 },
          { x: width, y: height },
          { x: 0, y: height },
        ];
        scrapLine.area = (width + topWidth) * height / 2;
        break;
      case 'CIRCLE':
        scrapLine.center = center;
        scrapLine.radius = radius;
        scrapLine.area = Math.PI * radius * radius;
        break;
      case 'PART_OUTER':
        const selectedPart = parts.find(p => p.id === selectedPartId);
        if (selectedPart?.contour) {
          // Extract contour points from part
          scrapLine.points = extractContourPoints(selectedPart.contour);
        }
        break;
    }

    onAddScrapLine(scrapLine);
    onClose();
  };

  const extractContourPoints = (contour: any): Point[] => {
    // Mock implementation - in real app, extract actual contour points
    return [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
      { x: 50, y: 100 },
      { x: 0, y: 50 },
    ];
  };

  return (
    <>
      <style>{SCRAP_LINE_EDITOR_CSS}</style>
      <div className="scrap-line-editor-overlay">
        <div className="scrap-line-editor">
          {/* Header */}
          <div className="editor-header">
            <h2>添加余料线</h2>
          </div>

          {/* Content */}
          <div className="editor-content">
            {/* Shape Type Selection */}
            <div className="form-section">
              <div className="form-section-title">余料线形状</div>
              <div className="form-group">
                <select
                  value={lineType}
                  onChange={(e) => {
                    setLineType(e.target.value as ScrapLineType);
                  }}
                >
                  <option value="LINE">直线</option>
                  <option value="TRIANGLE">三角形</option>
                  <option value="TRAPEZOID">梯形</option>
                  <option value="CIRCLE">圆形</option>
                  <option value="PART_OUTER">提取零件轮廓</option>
                </select>
              </div>

              {/* Shape Preview */}
              <div className="shape-preview">
                {lineType === 'LINE' && <div className="preview-line" />}
                {lineType === 'TRIANGLE' && <div className="preview-triangle" />}
                {lineType === 'TRAPEZOID' && <div className="preview-trapezoid" />}
                {lineType === 'CIRCLE' && <div className="preview-circle" />}
                {lineType === 'PART_OUTER' && (
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>
                    选择零件以提取其外轮廓
                  </div>
                )}
              </div>
            </div>

            {/* Shape Parameters */}
            {lineType === 'LINE' && (
              <div className="form-section">
                <div className="form-section-title">直线参数</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>宽度 (mm)</label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                      min="10"
                      max="2000"
                    />
                  </div>
                </div>
              </div>
            )}

            {lineType === 'TRIANGLE' && (
              <div className="form-section">
                <div className="form-section-title">三角形参数</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>底边 (mm)</label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                      min="10"
                      max="2000"
                    />
                  </div>
                  <div className="form-group">
                    <label>高度 (mm)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      min="10"
                      max="2000"
                    />
                  </div>
                </div>
              </div>
            )}

            {lineType === 'TRAPEZOID' && (
              <div className="form-section">
                <div className="form-section-title">梯形参数</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>底边 (mm)</label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                      min="10"
                      max="2000"
                    />
                  </div>
                  <div className="form-group">
                    <label>高度 (mm)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      min="10"
                      max="2000"
                    />
                  </div>
                </div>
              </div>
            )}

            {lineType === 'CIRCLE' && (
              <div className="form-section">
                <div className="form-section-title">圆形参数</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>圆心X (mm)</label>
                    <input
                      type="number"
                      value={center.x}
                      onChange={(e) => setCenter({ ...center, x: Number(e.target.value) })}
                      min="0"
                      max="5000"
                    />
                  </div>
                  <div className="form-group">
                    <label>圆心Y (mm)</label>
                    <input
                      type="number"
                      value={center.y}
                      onChange={(e) => setCenter({ ...center, y: Number(e.target.value) })}
                      min="0"
                      max="5000"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>半径 (mm)</label>
                  <input
                    type="number"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    min="5"
                    max="1000"
                  />
                </div>
              </div>
            )}

            {lineType === 'PART_OUTER' && (
              <div className="form-section">
                <div className="form-section-title">选择零件</div>
                <div className="form-group">
                  <select
                    value={selectedPartId}
                    onChange={(e) => setSelectedPartId(e.target.value)}
                  >
                    <option value="">请选择零件</option>
                    {parts.map((part) => (
                      <option key={part.id} value={part.id}>
                        {part.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="editor-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              取消
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAddScrapLine}
              disabled={lineType === 'PART_OUTER' && !selectedPartId}
            >
              添加余料线
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ScrapLineEditor;
