import React from 'react';
import { useTranslation } from 'react-i18next';
import { FeatureGuard, FeaturePackage, DrawingFeature, NestingFeature } from '../Feature';
import LanguageSelector from '../common/LanguageSelector';
import { RibbonButton, RibbonGroup, RibbonSeparator } from './RibbonCompact.primitives';
export { RibbonButton, RibbonGroup, RibbonSeparator } from './RibbonCompact.primitives';
interface RibbonCompactProps {
  className?: string;
  onRotateLeft?: () => void;
  onRotateRight?: () => void;
  onMirrorHorizontal?: () => void;
  onMirrorVertical?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitToView?: () => void;
  onEditProperties?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onStartNesting?: () => void;
  onManualNesting?: () => void;
  onOpenNestingSettings?: () => void;
  onStopNesting?: () => void;
  onExportDXF?: () => void;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  onExportAll?: () => void;
  onOpenExportSettings?: () => void;
  onOpenHotkeyConfig?: () => void;
  onPreprocess?: () => void;
  isNestingRunning?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  disabled?: boolean;
  partSpacing?: number;
  onPartSpacingChange?: (value: number) => void;
}

const RibbonCompact: React.FC<RibbonCompactProps> = ({
  className = '',
  onRotateLeft,
  onRotateRight,
  onMirrorHorizontal,
  onMirrorVertical,
  onZoomIn,
  onZoomOut,
  onFitToView,
  onEditProperties,
  onUndo,
  onRedo,
  onStartNesting,
  onManualNesting,
  onOpenNestingSettings,
  onStopNesting,
  onExportDXF,
  onExportExcel,
  onExportPDF,
  onExportAll,
  onOpenExportSettings,
  onOpenHotkeyConfig,
  onPreprocess,
  isNestingRunning = false,
  canUndo = false,
  canRedo = false,
  disabled = false,
  partSpacing = 5,
  onPartSpacingChange
}) => {
  const { t } = useTranslation();
  return (
    <div className={`h-11 bg-white border-b border-slate-200 flex items-center px-3 ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center gap-2 mr-4 pr-3 border-r border-slate-200">
        <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4-4m0 0l4 4m4 4v4H8m-4 0l4 4m4-4v4H8" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-slate-800">{t('app.title')}</span>
      </div>

      <FeatureGuard
        packageKey={FeaturePackage.NESTING}
        featureKey={NestingFeature.PART_ROTATION}
      >
        <RibbonGroup
          title={t('ribbon.modify')}
          hotkey="K"
          icon={<svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5m0 0l4-4m-4 4l-4-4" /></svg>}
        >
          <RibbonButton
            label={t('ribbon.rotateLeft')}
            icon={<svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>}
            onClick={onRotateLeft}
            hotkey="←"
            tooltip={t('ribbon.rotateLeftTooltip')}
          />
          <RibbonButton
            label={t('ribbon.rotateRight')}
            icon={<svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" /></svg>}
            onClick={onRotateRight}
            hotkey="→"
            tooltip={t('ribbon.rotateRightTooltip')}
          />
          <div className="border-t border-slate-200 my-1" />
          <RibbonButton
            label={t('ribbon.mirrorH')}
            icon={<svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
            onClick={onMirrorHorizontal}
            hotkey="H"
            tooltip={t('ribbon.mirrorHTooltip')}
          />
          <RibbonButton
            label={t('ribbon.mirrorV')}
            icon={<svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l4-4" /></svg>}
            onClick={onMirrorVertical}
            hotkey="V"
            tooltip={t('ribbon.mirrorVTooltip')}
          />
        </RibbonGroup>
      </FeatureGuard>

      <RibbonSeparator />

      <div className="flex items-center gap-1">
        <RibbonButton
          label={t('ribbon.zoomIn')}
          icon={<svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>}
          onClick={onZoomIn}
          hotkey="+"
          tooltip={t('ribbon.zoomIn')}
        />
        <RibbonButton
          label={t('ribbon.zoomOut')}
          icon={<svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>}
          onClick={onZoomOut}
          hotkey="-"
          tooltip={t('ribbon.zoomOut')}
        />
        <RibbonButton
          label={t('ribbon.fit')}
          icon={<svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>}
          onClick={onFitToView}
          hotkey="F"
          tooltip={t('ribbon.fitTooltip')}
        />
        <RibbonButton
          label={t('ribbon.edit')}
          icon={<svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
          onClick={onEditProperties}
          hotkey="Enter"
          tooltip={t('ribbon.editTooltip')}
        />
        <RibbonButton
          label={t('ribbon.undo')}
          icon={<svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>}
          onClick={onUndo}
          hotkey="Ctrl+Z"
          tooltip={t('ribbon.undo')}
          disabled={!canUndo}
        />
        <RibbonButton
          label={t('ribbon.redo')}
          icon={<svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" /></svg>}
          onClick={onRedo}
          hotkey="Ctrl+Y"
          tooltip={t('ribbon.redo')}
          disabled={!canRedo}
        />
      </div>

      <RibbonSeparator />

      <FeatureGuard
        packageKey={FeaturePackage.DRAWING}
        featureKey={DrawingFeature.PART_RECOGNITION}
      >
        <RibbonButton
          label={t('ribbon.preprocess')}
          icon={<svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
          onClick={onPreprocess}
          hotkey="P"
          tooltip={t('ribbon.preprocessTooltip')}
          variant={onPreprocess ? 'primary' : 'default'}
        />
      </FeatureGuard>

      <RibbonSeparator />

      <RibbonGroup
        title={t('ribbon.nesting')}
        hotkey="N"
        icon={<svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4-4m0 0l4 4m4 4v4H8m-4 0l4 4m4-4v4H8" /></svg>}
      >
        <RibbonButton
          label={t('ribbon.autoNesting')}
          icon={<svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4-4m0 0l4 4m4 4v4H8m-4 0l4 4m4-4v4H8" /></svg>}
          onClick={isNestingRunning ? onStopNesting : onStartNesting}
          variant="primary"
          hotkey="Space"
          tooltip={isNestingRunning ? t('ribbon.stopNesting') : t('ribbon.startNesting')}
        />
        <RibbonButton
          label={t('ribbon.manualNesting')}
          icon={<svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>}
          onClick={onManualNesting}
          hotkey="M"
          tooltip={t('ribbon.manualNestingTooltip')}
        />
        <div className="border-t border-slate-200 my-1" />
        <RibbonButton
          label={t('ribbon.nestingSettings')}
          icon={<svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c1.756.426 1.756-2.924 0-3.35a1.724 1.724 0 00-1.065-2.573c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-2.573-1.066c1.756-.426 1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>}
          onClick={onOpenNestingSettings}
          hotkey="Alt+N"
          tooltip={t('ribbon.nestingSettingsTooltip')}
        />
      </RibbonGroup>

      <div className="flex items-center gap-1 ml-1" title={t('ribbon.partSpacingTooltip') || '零件间距'}>
        <span className="text-[10px] text-slate-500">{t('ribbon.spacing') || '间距'}</span>
        <input
          type="number"
          value={partSpacing}
          onChange={(e) => onPartSpacingChange?.(Number(e.target.value))}
          min={0}
          max={50}
          step={0.5}
          className="w-12 h-6 px-1 text-xs text-center border border-slate-300 rounded hover:border-blue-400 focus:border-blue-500 focus:outline-none"
        />
        <span className="text-[10px] text-slate-400">mm</span>
      </div>

      <RibbonSeparator />

      <RibbonGroup
        title={t('ribbon.export')}
        hotkey="E"
        icon={<svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l4-4m4 4V4a2 2 0 00-2-2H8a2 2 0 00-2 2v12" /></svg>}
      >
        <RibbonButton
          label={t('ribbon.exportDXF')}
          icon={<svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          onClick={onExportDXF}
          hotkey="D"
          tooltip={t('ribbon.exportDXFTooltip')}
        />
        <RibbonButton
          label={t('ribbon.exportExcel')}
          icon={<svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          onClick={onExportExcel}
          hotkey="X"
          tooltip={t('ribbon.exportExcelTooltip')}
        />
        <RibbonButton
          label={t('ribbon.exportPDF')}
          icon={<svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
          onClick={onExportPDF}
          hotkey="P"
          tooltip={t('ribbon.exportPDFTooltip')}
        />
        <div className="border-t border-slate-200 my-1" />
        <RibbonButton
          label={t('ribbon.exportAll')}
          icon={<svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l4-4m4 4V4a2 2 0 00-2-2H8a2 2 0 00-2 2v12" /></svg>}
          onClick={onExportAll}
          hotkey="A"
          tooltip={t('ribbon.exportAllTooltip')}
        />
        <RibbonButton
          label={t('ribbon.exportSettings')}
          icon={<svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c1.756.426 1.756-2.924 0-3.35a1.724 1.724 0 00-1.065-2.573c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-2.573-1.066c1.756-.426 1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>}
          onClick={onOpenExportSettings}
          hotkey="Alt+E"
          tooltip={t('ribbon.exportSettingsTooltip')}
        />
      </RibbonGroup>

      <RibbonSeparator />

      <div className="flex items-center gap-1 ml-auto">
        <LanguageSelector />
        <RibbonButton
          label={t('ribbon.hotkeys')}
          icon={<svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c1.756.426 1.756-2.924 0-3.35a1.724 1.724 0 00-1.065-2.573c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-2.573-1.066c1.756-.426 1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>}
          onClick={onOpenHotkeyConfig}
          hotkey="H"
          tooltip={t('ribbon.hotkeysTooltip')}
        />
        <RibbonButton
          label={t('common.help')}
          icon={<svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.35 0a1.724 1.724 0 012.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-1.756.426-1.756-2.924 0-3.35a1.724 1.724 0 00-1.065-2.573c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-2.573-1.066c1.756-.426 1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>}
          hotkey="F1"
          tooltip={t('common.help')}
        />
      </div>
    </div>
  );
};

export default RibbonCompact;
