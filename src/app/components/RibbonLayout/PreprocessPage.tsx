import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { inspectDrawing } from '../../services/api';
import type { InspectionIssue, InspectionResult } from '@dxf-fix/shared/types/inspection';
import type { PreprocessCADViewWebCADRef } from './PreprocessCADViewWebCAD';
import { importFilesWithPolling } from './PreprocessPage.import';
import { calculateTiledLayout } from './PreprocessPage.layout';
import type { ImportedFile, TiledLayout } from './PreprocessPage.types';
import { PreprocessPageView } from './PreprocessPage.view';

const PreprocessPage: React.FC = () => {
  const { t } = useTranslation();
  const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [tiledLayout, setTiledLayout] = useState<TiledLayout[]>([]);
  const [activeTab, setActiveTab] = useState<'files' | 'parts'>('files');
  const [showInspector, setShowInspector] = useState(false);
  const [inspectorTolerance, setInspectorTolerance] = useState(0.5);
  const [selectedIssueIds, setSelectedIssueIds] = useState<Set<string>>(new Set());
  const [hoveredIssueId, setHoveredIssueId] = useState<string | undefined>();
  const cadViewRef = useRef<PreprocessCADViewWebCADRef>(null);

  const triggerInspection = useCallback(async (fileId: string) => {
    try {
      setImportedFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, inspectionLoading: true } : f)));
      const result = await inspectDrawing(fileId, inspectorTolerance);
      setImportedFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, inspectionResult: result, inspectionLoading: false } : f)));
    } catch (error) {
      console.error('Inspection failed:', error);
      setImportedFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, inspectionLoading: false } : f)));
    }
  }, [inspectorTolerance]);

  const handleImportFiles = useCallback(async (files: File[]) => {
    await importFilesWithPolling({ files, setImportedFiles, triggerInspection });
  }, [triggerInspection]);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f: File) => f.name.toLowerCase().endsWith('.dxf'));
    if (files.length === 0) return;
    await handleImportFiles(files);
  }, [handleImportFiles]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    await handleImportFiles(files);
  }, [handleImportFiles]);

  const handlePartRecognition = useCallback(() => {
    if (selectedFileIds.size === 0) return;
    const selectedFiles = importedFiles.filter((f) => selectedFileIds.has(f.id));
    if (selectedFiles.length > 0) {
      const file = selectedFiles[0];
      window.location.href = `/part-recognition?fileId=${file.id}&fileName=${encodeURIComponent(file.name)}`;
    }
  }, [importedFiles, selectedFileIds]);

  const handleReinspect = useCallback(async (tolerance: number) => {
    setInspectorTolerance(tolerance);
    const selectedFiles = importedFiles.filter((f) => selectedFileIds.has(f.id) && f.status === 'ready');
    for (const file of selectedFiles) {
      await triggerInspection(file.id);
    }
  }, [importedFiles, selectedFileIds, triggerInspection]);

  const handleIssueClick = useCallback((issue: InspectionIssue) => {
    setSelectedIssueIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(issue.id)) {
        newSet.delete(issue.id);
      } else {
        newSet.add(issue.id);
      }

      setTimeout(() => {
        const selectedIssues = Array.from(newSet)
          .map((id) => {
            const file = importedFiles.find((f) => f.inspectionResult?.issues.some((i) => i.id === id));
            return file?.inspectionResult?.issues.find((i) => i.id === id);
          })
          .filter(Boolean) as InspectionIssue[];

        if (selectedIssues.length > 0 && cadViewRef.current) {
          cadViewRef.current.fitToIssues(selectedIssues);
        }
      }, 0);

      return newSet;
    });
  }, [importedFiles]);

  const handleIssueHover = useCallback((issue: InspectionIssue | null) => {
    setHoveredIssueId(issue?.id);
  }, []);

  const currentInspectionResult = useMemo(() => {
    if (selectedFileIds.size !== 1) return null;
    const selectedFile = importedFiles.find((f) => selectedFileIds.has(f.id));
    return selectedFile?.inspectionResult || null;
  }, [importedFiles, selectedFileIds]);

  const allInspectionIssues = useMemo(() => {
    const issues: Array<{ id: string; location: { position: { x: number; y: number } }; level: any }> = [];
    importedFiles.forEach((file) => {
      if (file.inspectionResult?.issues) {
        issues.push(...file.inspectionResult.issues);
      }
    });
    return issues;
  }, [importedFiles]);

  const currentInspectionLoading = useMemo(() => {
    if (selectedFileIds.size !== 1) return false;
    const selectedFile = importedFiles.find((f) => selectedFileIds.has(f.id));
    return selectedFile?.inspectionLoading || false;
  }, [importedFiles, selectedFileIds]);

  const handleFileSelect = useCallback((fileId: string) => {
    setSelectedFileIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  }, []);

  useEffect(() => {
    setTiledLayout(calculateTiledLayout(importedFiles, selectedFileIds));
  }, [importedFiles, selectedFileIds]);

  return (
    <PreprocessPageView
      t={t}
      importedFiles={importedFiles}
      selectedFileIds={selectedFileIds}
      isDragging={isDragging}
      activeTab={activeTab}
      showInspector={showInspector}
      tiledLayout={tiledLayout}
      currentInspectionResult={currentInspectionResult as InspectionResult | null}
      currentInspectionLoading={currentInspectionLoading}
      allInspectionIssues={allInspectionIssues}
      selectedIssueIds={selectedIssueIds}
      hoveredIssueId={hoveredIssueId}
      cadViewRef={cadViewRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onFileUpload={handleFileUpload}
      onToggleInspector={() => setShowInspector(!showInspector)}
      onPartRecognition={handlePartRecognition}
      onSetActiveTab={setActiveTab}
      onFileSelect={handleFileSelect}
      onIssueClick={handleIssueClick}
      onIssueHover={handleIssueHover}
      onReinspect={(tolerance) => { void handleReinspect(tolerance); }}
    />
  );
};

export default PreprocessPage;
