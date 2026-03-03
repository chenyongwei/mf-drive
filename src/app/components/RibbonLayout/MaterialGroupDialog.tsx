import React, { useState, useEffect } from 'react';

const commonMaterials = ['Steel', 'Stainless', 'Aluminum', 'Brass', 'Copper'];
const commonThicknesses = [1, 2, 3, 5, 8, 10, 15, 20];

interface MaterialGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (material: string, thickness: number) => void;
  existingGroups: { material: string; thickness: number }[];
  defaultMaterial?: string;
  defaultThickness?: number;
}

const MaterialGroupDialog: React.FC<MaterialGroupDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  existingGroups,
  defaultMaterial = '',
  defaultThickness
}) => {
  const [material, setMaterial] = useState(defaultMaterial);
  const [customMaterial, setCustomMaterial] = useState('');
  const [thickness, setThickness] = useState<number | string>(defaultThickness || '');
  const [customThickness, setCustomThickness] = useState('');
  const [isCustomMaterial, setIsCustomMaterial] = useState(!commonMaterials.includes(defaultMaterial));
  const [isCustomThickness, setIsCustomThickness] = useState(defaultThickness !== undefined);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsCustomMaterial(!commonMaterials.includes(defaultMaterial));
    setIsCustomThickness(defaultThickness !== undefined);
  }, [defaultMaterial, defaultThickness]);

  useEffect(() => {
    setError(null);

    if (!material || !thickness) return;

    const thicknessNum = Number(thickness);
    if (isNaN(thicknessNum) || thicknessNum <= 0) {
      setError('厚度必须是正数');
      return;
    }

    // Check for existing combination
    const exists = existingGroups.some(
      g => g.material.toLowerCase() === material.toLowerCase() && g.thickness === thicknessNum
    );

    if (exists) {
      setError(`材质 ${material} ${thicknessNum}mm 已存在！`);
    }
  }, [material, thickness, existingGroups]);

  const handleMaterialChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomMaterial(true);
      setMaterial(customMaterial);
    } else {
      setIsCustomMaterial(false);
      setMaterial(value);
    }
  };

  const handleThicknessChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomThickness(true);
      setThickness(customThickness);
    } else {
      setIsCustomThickness(false);
      setThickness(Number(value));
    }
  };

  const handleSave = () => {
    if (!material || !thickness) return;
    if (error) return;

    const thicknessNum = Number(thickness);
    onSave(material, thicknessNum);
    handleClose();
  };

  const handleClose = () => {
    setMaterial(defaultMaterial);
    setCustomMaterial('');
    setThickness(defaultThickness || '');
    setCustomThickness('');
    setIsCustomMaterial(!commonMaterials.includes(defaultMaterial));
    setIsCustomThickness(defaultThickness !== undefined);
    setError(null);
    onClose();
  };

  const isSaveDisabled = !material || !thickness || error !== null || isNaN(Number(thickness));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-white rounded-xl shadow-2xl w-[420px]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-500 to-emerald-600">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              新建材质厚度组
            </h2>
            <button onClick={handleClose} className="text-white/80 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Material Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              材质
            </label>
            <select
              value={isCustomMaterial ? 'custom' : material}
              onChange={(e) => handleMaterialChange(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {commonMaterials.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
              <option value="custom">自定义...</option>
            </select>
            {isCustomMaterial && (
              <input
                type="text"
                value={customMaterial}
                onChange={(e) => {
                  setCustomMaterial(e.target.value);
                  setMaterial(e.target.value);
                }}
                placeholder="输入材质名称"
                className="mt-2 w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
            )}
          </div>

          {/* Thickness Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              厚度 (mm)
            </label>
            <select
              value={isCustomThickness ? 'custom' : thickness}
              onChange={(e) => handleThicknessChange(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {commonThicknesses.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
              <option value="custom">自定义...</option>
            </select>
            {isCustomThickness && (
              <input
                type="number"
                value={customThickness}
                onChange={(e) => {
                  setCustomThickness(e.target.value);
                  setThickness(e.target.value);
                }}
                placeholder="输入厚度"
                min="0.1"
                step="0.1"
                className="mt-2 w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Info */}
          {!error && material && thickness && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2">
              <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-emerald-700">
                将创建: <strong>{material} {thickness}mm</strong> 材质厚度组
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isSaveDisabled}
            className="px-6 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            确定 (Space)
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaterialGroupDialog;
