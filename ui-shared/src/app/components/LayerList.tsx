import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { getLayers } from '../services/api';
import type { LayerInfo } from '../store';
import { getAutocadColor } from '../utils/autocadColors';
import { getProcessTypeColor, getProcessTypeText } from '../layerManager/utils/processTypeDisplay';

const LayerList: React.FC = () => {
  const { getActiveFile, getActiveFileLayers, setLayers, setLayerMapping, getLayerMapping } = useAppStore();
  const currentFile = getActiveFile();
  const [localLayers, setLocalLayers] = useState<LayerInfo[]>([]);

  useEffect(() => {
    if (currentFile?.status === 'ready') {
      loadLayers();
    }
  }, [currentFile]);

  const loadLayers = async () => {
    if (!currentFile) return;

    try {
      const data = await getLayers(currentFile.id);
      setLocalLayers(data.layers);
      setLayers(currentFile.id, data.layers);
    } catch (error) {
      console.error('Load layers error:', error);
    }
  };

  if (localLayers.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <p>暂无图层数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          图层列表 ({localLayers.length})
        </h3>
      </div>

      <div className="space-y-2">
        {localLayers.map((layer) => {
          const processType = getLayerMapping(layer.name);
          const layerColor = getAutocadColor(layer.color);

          return (
            <div
              key={layer.name}
              className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* Color preview */}
                  <div
                    className="w-5 h-5 rounded border border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: layerColor }}
                    title={`AutoCAD颜色索引: ${layer.color}`}
                  />
                  {/* Layer name */}
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {layer.name}
                  </span>
                </div>

                {/* Process type selector */}
                <select
                  value={processType}
                  onChange={(e) => setLayerMapping(layer.name, e.target.value as any)}
                  className="text-xs px-2 py-1 rounded border border-gray-300 bg-white cursor-pointer hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="NONE">不加工</option>
                  <option value="CUT">切割</option>
                  <option value="MARK">打标</option>
                </select>
              </div>

              {/* Entity count and current process type */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>实体: {layer.entityCount}</span>
                <span className={`px-2 py-0.5 rounded-full ${getProcessTypeColor(processType)}`}>
                  {getProcessTypeText(processType)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-xs font-medium text-gray-600 mb-2">图例说明</h4>
        <div className="space-y-1 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-green-500"></div>
            <span>切割 - 绿色实线</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-cyan-400 border-dashed border-t-2 border-cyan-400"></div>
            <span>打标 - 青色虚线</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-gray-200"></div>
            <span>不加工 - 白色实线</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayerList;
