import React from 'react';
import PreprocessCADViewWebCAD, { type PreprocessCADViewWebCADRef } from './PreprocessCADViewWebCAD';
import PartTree from './PartTree';
import { InspectorPanel } from '../DrawingInspector';
import type { InspectionIssue } from '@dxf-fix/shared/types/inspection';
import type { ImportedFile, TiledLayout } from './PreprocessPage.types';

type PreprocessPageViewProps = {
  t: (key: string, options?: any) => string;
  importedFiles: ImportedFile[];
  selectedFileIds: Set<string>;
  isDragging: boolean;
  activeTab: 'files' | 'parts';
  showInspector: boolean;
  tiledLayout: TiledLayout[];
  currentInspectionResult: any;
  currentInspectionLoading: boolean;
  allInspectionIssues: Array<{ id: string; location: { position: { x: number; y: number } }; level: any }>;
  selectedIssueIds: Set<string>;
  hoveredIssueId?: string;
  cadViewRef: React.RefObject<PreprocessCADViewWebCADRef>;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleInspector: () => void;
  onPartRecognition: () => void;
  onSetActiveTab: (tab: 'files' | 'parts') => void;
  onFileSelect: (fileId: string) => void;
  onIssueClick: (issue: InspectionIssue) => void;
  onIssueHover: (issue: InspectionIssue | null) => void;
  onReinspect: (tolerance: number) => void;
};

export const PreprocessPageView: React.FC<PreprocessPageViewProps> = ({
  t,
  importedFiles,
  selectedFileIds,
  isDragging,
  activeTab,
  showInspector,
  tiledLayout,
  currentInspectionResult,
  currentInspectionLoading,
  allInspectionIssues,
  selectedIssueIds,
  hoveredIssueId,
  cadViewRef,
  onDrop,
  onDragOver,
  onDragLeave,
  onFileUpload,
  onToggleInspector,
  onPartRecognition,
  onSetActiveTab,
  onFileSelect,
  onIssueClick,
  onIssueHover,
  onReinspect,
}) => {
  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-slate-500 hover:text-slate-700 transition-colors" title={t('preprocess.backToMain')}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </a>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">{t('preprocess.title')}</h1>
              <p className="text-sm text-slate-500 mt-1">{t('preprocess.description')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedFileIds.size > 0 && currentInspectionResult && (
              <button
                onClick={onToggleInspector}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${showInspector ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-slate-600 text-white hover:bg-slate-700'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {showInspector ? t('preprocess.hideInspection') : t('preprocess.showInspection')}
                {currentInspectionResult.summary.total > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-white text-orange-600 rounded-full text-xs font-bold">
                    {currentInspectionResult.summary.total}
                  </span>
                )}
              </button>
            )}
            {selectedFileIds.size > 0 && (
              <button onClick={onPartRecognition} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                {t('preprocess.partRecognition')} ({selectedFileIds.size})
              </button>
            )}
            <label className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l4-4m4 4V4a2 2 0 00-2-2H8a2 2 0 00-2 2v12" />
              </svg>
              {t('preprocess.uploadDrawing')}
              <input type="file" accept=".dxf" multiple onChange={onFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {importedFiles.length === 0 ? (
        <div
          className={`flex-1 flex items-center justify-center m-6 border-2 border-dashed rounded-xl transition-colors ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-white'}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-slate-400">
              <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-700 mb-2">{t('preprocess.dropFilesHere')}</h3>
            <p className="text-sm text-slate-500">{t('preprocess.orClickUpload')}</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => onSetActiveTab('files')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'files' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'}`}
              >
                {t('preprocess.importedDrawings')}
              </button>
              <button
                onClick={() => onSetActiveTab('parts')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'parts' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'}`}
              >
                {t('preprocess.partTree')}
              </button>
            </div>

            {activeTab === 'files' && (
              <>
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">{t('preprocess.filesCount', { count: importedFiles.length })}</span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {importedFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`border rounded-lg overflow-hidden transition-all ${file.status === 'error' ? 'border-red-300 bg-red-50' : file.status === 'uploading' || file.status === 'parsing' ? 'border-yellow-300 bg-yellow-50' : selectedFileIds.has(file.id) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <div className="p-3 flex items-start gap-3 cursor-pointer" onClick={() => onFileSelect(file.id)}>
                        {file.thumbnailUrl ? (
                          <img src={file.thumbnailUrl} alt={file.name} className="w-12 h-12 object-cover rounded border border-slate-200 flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : file.status === 'uploading' || file.status === 'parsing' ? (
                          <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                            <div className="w-8 h-8 border-2 border-yellow-400 border-t-yellow-600 rounded-full animate-spin" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 flex items-center justify-center flex-shrink-0 bg-slate-100 rounded border border-slate-200">
                            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedFileIds.has(file.id)}
                              onChange={(e) => { e.stopPropagation(); onFileSelect(file.id); }}
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 flex-shrink-0"
                            />
                            <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                            {file.status === 'uploading' ? <span>{t('preprocess.uploading', { progress: file.progress })}</span> : null}
                            {file.status === 'parsing' ? <><span>{t('preprocess.parsing')}</span><div className="w-4 h-4 border-2 border-yellow-400 border-t-yellow-600 rounded-full animate-spin"></div></> : null}
                            {file.status === 'error' ? <span className="text-red-600">{t('preprocess.parseFailed')}</span> : null}
                            {file.status === 'ready' ? <span>{t('preprocess.partsCount', { count: file.parts.length })}</span> : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 border-t border-slate-200">
                  <label className="w-full px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 cursor-pointer text-center flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('preprocess.continueImport')}
                    <input type="file" accept=".dxf" multiple onChange={onFileUpload} className="hidden" />
                  </label>
                </div>
              </>
            )}

            {activeTab === 'parts' && <PartTree />}
          </div>

          <div className="flex-1 bg-black relative overflow-hidden">
            <PreprocessCADViewWebCAD
              ref={cadViewRef}
              files={importedFiles}
              selectedFileIds={selectedFileIds}
              tiledLayout={tiledLayout}
              inspectionIssues={allInspectionIssues}
              selectedIssueIds={selectedIssueIds}
              hoveredIssueId={hoveredIssueId}
              onIssueClick={onIssueClick}
              onIssueHover={onIssueHover}
            />

            {showInspector && (
              <div className="absolute top-4 right-4 w-80 max-h-[calc(100vh-200px)] overflow-hidden rounded-lg shadow-2xl">
                <InspectorPanel
                  inspectionResult={currentInspectionResult}
                  loading={currentInspectionLoading}
                  onIssueClick={onIssueClick}
                  onIssueHover={onIssueHover}
                  onReinspect={onReinspect}
                  selectedIssueIds={selectedIssueIds}
                  hoveredIssueId={hoveredIssueId}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
