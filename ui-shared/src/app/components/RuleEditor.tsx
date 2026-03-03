import React, { useState } from 'react';
import { useAppStore } from '../store';
import { applyRules, previewRules } from '../services/api';
import type { OptimizationRules, OptimizationPreview } from '@dxf-fix/shared';

const RuleEditor: React.FC = () => {
  const { rules, setRules, getActiveFile, previewMode, previewData, setPreviewMode, setPreviewData } = useAppStore();
  const [applying, setApplying] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const currentFile = getActiveFile();

  const handleToleranceChange = (value: number) => {
    setRules({ tolerance: value });
  };

  const handleToggleChange = (key: keyof OptimizationRules) => {
    setRules({ [key]: !rules[key] });
  };

  const handlePreviewRules = async () => {
    if (!currentFile) return;

    setPreviewing(true);
    try {
      const result = await previewRules(currentFile.id, rules);
      setPreviewData(result.preview);
      setPreviewMode(true);
    } catch (error) {
      console.error('Preview rules error:', error);
      alert('预览失败');
    } finally {
      setPreviewing(false);
    }
  };

  const handleConfirmRules = async () => {
    if (!currentFile) return;

    setApplying(true);
    try {
      await applyRules(currentFile.id, rules);
      setPreviewMode(false);
      setPreviewData(null);
      alert('规则应用成功');
    } catch (error) {
      console.error('Apply rules error:', error);
      alert('规则应用失败');
    } finally {
      setApplying(false);
    }
  };

  const handleCancelPreview = () => {
    setPreviewMode(false);
    setPreviewData(null);
  };

  const handleApplyRules = async () => {
    if (!currentFile) return;

    setApplying(true);
    try {
      await applyRules(currentFile.id, rules);
      alert('规则应用成功');
    } catch (error) {
      console.error('Apply rules error:', error);
      alert('规则应用失败');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        优化规则
      </h3>

      {/* 精度设置 */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">精度容差 (mm)</label>
        <input
          type="number"
          step="0.001"
          min="0"
          value={rules.tolerance}
          onChange={(e) => handleToleranceChange(parseFloat(e.target.value))}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* 自动化选项 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-700">自动合并相邻线</span>
          <button
            onClick={() => handleToggleChange('autoMergeLines')}
            className={`relative w-10 h-6 rounded-full transition-colors ${
              rules.autoMergeLines ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                rules.autoMergeLines ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-700">去除重复线</span>
          <button
            onClick={() => handleToggleChange('removeDuplicates')}
            className={`relative w-10 h-6 rounded-full transition-colors ${
              rules.removeDuplicates ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                rules.removeDuplicates ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-700">自动闭合轮廓</span>
          <button
            onClick={() => handleToggleChange('autoCloseContours')}
            className={`relative w-10 h-6 rounded-full transition-colors ${
              rules.autoCloseContours ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                rules.autoCloseContours ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {rules.autoCloseContours && (
          <div className="pl-2">
            <label className="block text-xs text-slate-600 mb-1">闭合缺口最大距离 (mm)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={rules.closeGapThreshold}
              onChange={(e) => setRules({ closeGapThreshold: parseFloat(e.target.value) })}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {/* 按钮组 */}
      <div className="space-y-2">
        {!previewMode ? (
          <>
            <button
              onClick={handlePreviewRules}
              disabled={previewing || !currentFile || currentFile.status !== 'ready'}
              className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                previewing || !currentFile || currentFile.status !== 'ready'
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {previewing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  预览中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  预览优化
                </>
              )}
            </button>
            <button
              onClick={handleApplyRules}
              disabled={applying || !currentFile || currentFile.status !== 'ready'}
              className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                applying || !currentFile || currentFile.status !== 'ready'
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {applying ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  应用中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  直接应用
                </>
              )}
            </button>
          </>
        ) : (
          <>
            {previewData && (
              <div className="bg-slate-100 p-3 rounded-lg text-sm space-y-1 border border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>重复线: <strong>{previewData.summary.duplicatesCount}</strong> 个</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>合并连接: <strong>{previewData.summary.mergesCount}</strong> 组</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>闭合轮廓: <strong>{previewData.summary.closuresCount}</strong> 个</span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-300 font-semibold text-slate-800">
                  预计减少实体: {previewData.summary.estimatedReduction} 个
                </div>
              </div>
            )}
            <button
              onClick={handleConfirmRules}
              disabled={applying}
              className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                applying
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {applying ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  应用中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  确认应用
                </>
              )}
            </button>
            <button
              onClick={handleCancelPreview}
              className="w-full py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 bg-slate-300 text-slate-700 hover:bg-slate-400"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              取消
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default RuleEditor;
