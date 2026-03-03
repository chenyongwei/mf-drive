import React, { useState, useEffect } from 'react';
import { PlanePart } from '@dxf-fix/shared';

interface PartRecognitionPageProps {
  fileId: string;
  fileName: string;
}

export const PartRecognitionPage: React.FC<PartRecognitionPageProps> = ({
  fileId,
  fileName,
}) => {
  const [parts, setParts] = useState<PlanePart[]>([]);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);

  const selectedPart = parts.find(p => p.id === selectedPartId) || null;

  const handleRecognize = async () => {
    setIsRecognizing(true);
    setProgress(0);
    setError(null);

    try {
      // 获取文件实体数据（使用status端点）
      const statusResponse = await fetch('/api/drawing/files/' + fileId + '/status');
      if (!statusResponse.ok) {
        throw new Error('无法获取文件数据');
      }
      const statusData = await statusResponse.json();

      if (statusData.status !== 'ready' || !statusData.entities) {
        throw new Error('文件未准备好或没有实体数据');
      }

      // 模拟进度
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // 执行识别
      const response = await fetch('/api/part-recognition/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entities: statusData.entities || [],
          fileName: fileName,
          options: {
            enableOptimization: true,
            optimizationOptions: {
              tolerance: 0.01,
              closeGapThreshold: 5,
              angleTolerance: 5
            }
          }
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      const result = await response.json();

      if (result.success) {
        setParts(result.data.parts || []);
        setSummary(result.data.summary || null);
      } else {
        setError(result.error || '识别失败');
      }
    } catch (err) {
      console.error('Recognition error:', err);
      setError(err instanceof Error ? err.message : '识别过程中发生错误');
    } finally {
      setIsRecognizing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleBack = () => {
    window.location.href = '/preprocess.html';
  };

  // 自动开始识别
  useEffect(() => {
    handleRecognize();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="返回"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">零件识别 - {fileName}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isRecognizing && (
            <div className="text-sm text-gray-600">
              识别中... {progress}%
            </div>
          )}
          <button
            onClick={handleRecognize}
            disabled={isRecognizing}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRecognizing ? '识别中...' : '重新识别'}
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex flex-1 overflow-hidden">
        {/* CAD图纸预览 */}
        <div className="flex-1 p-4">
          <div className="bg-white rounded-lg shadow h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium">CAD 图纸预览</p>
              <p className="text-sm mt-2">识别到 {parts.length} 个零件</p>
            </div>
          </div>
        </div>

        {/* 右侧面板 */}
        <div className="w-96 flex flex-col border-l bg-white shadow-lg">
          {/* 识别汇总 */}
          {summary && (
            <div className="p-4 border-b bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">识别汇总</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded border">
                  <div className="text-gray-500">总零件数</div>
                  <div className="text-lg font-semibold text-blue-600">{summary.totalParts}</div>
                </div>
                <div className="bg-white p-2 rounded border">
                  <div className="text-gray-500">规则零件</div>
                  <div className="text-lg font-semibold text-green-600">{summary.regularParts}</div>
                </div>
                <div className="bg-white p-2 rounded border">
                  <div className="text-gray-500">总面积</div>
                  <div className="text-sm font-semibold text-gray-800">{(summary.totalArea / 1000000).toFixed(2)}m²</div>
                </div>
                <div className="bg-white p-2 rounded border">
                  <div className="text-gray-500">处理时间</div>
                  <div className="text-sm font-semibold text-gray-800">{(summary.processingTime / 1000).toFixed(2)}s</div>
                </div>
              </div>
            </div>
          )}

          {/* 零件列表 */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">零件列表</h3>
              <span className="text-xs text-gray-500">{parts.length} 个</span>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-2">
              {parts.map((part) => (
                <div
                  key={part.id}
                  onClick={() => setSelectedPartId(part.id)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedPartId === part.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-blue-600">
                          {part.partNumber}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          part.type === 'REGULAR'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {part.type === 'REGULAR' ? '规则' : '不规则'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 mb-1">{part.name}</div>
                      <div className="text-xs text-gray-500">
                        尺寸: {part.width.toFixed(1)} × {part.height.toFixed(1)} mm
                      </div>
                      <div className="text-xs text-gray-500">
                        面积: {part.area.toFixed(0)} mm²
                      </div>
                    </div>
                    {part.holeCount > 0 && (
                      <div className="text-xs text-gray-500">
                        <span className="inline-block px-2 py-1 bg-gray-100 rounded">
                          {part.holeCount} 孔
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!isRecognizing && parts.length === 0 && !error && (
              <div className="text-center text-gray-400 py-8">
                <p>点击"重新识别"开始识别零件</p>
              </div>
            )}
          </div>

          {/* 零件详情 */}
          {selectedPart && (
            <div className="border-t p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-800 mb-3">零件详情</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">编号:</span>
                  <span className="font-medium">{selectedPart.partNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">名称:</span>
                  <span className="font-medium">{selectedPart.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">类型:</span>
                  <span className="font-medium">{selectedPart.shapeType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">宽度:</span>
                  <span className="font-medium">{selectedPart.width.toFixed(2)} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">高度:</span>
                  <span className="font-medium">{selectedPart.height.toFixed(2)} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">面积:</span>
                  <span className="font-medium">{selectedPart.area.toFixed(0)} mm²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">周长:</span>
                  <span className="font-medium">{selectedPart.perimeter.toFixed(0)} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">孔数:</span>
                  <span className="font-medium">{selectedPart.holeCount}</span>
                </div>
                {selectedPart.material && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">材质:</span>
                    <span className="font-medium">{selectedPart.material}</span>
                  </div>
                )}
                {selectedPart.thickness && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">厚度:</span>
                    <span className="font-medium">{selectedPart.thickness} mm</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">置信度:</span>
                  <span className="font-medium">{(selectedPart.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartRecognitionPage;
