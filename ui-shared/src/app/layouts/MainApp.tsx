import React, { useState, useEffect } from 'react';
import FileList from '../components/FileList';
import LayerManager from '../components/LayerManager';
import WebCAD from '../components/WebCAD';
import RuleEditor from '../components/RuleEditor';
import FloatingPanel from '../components/FloatingPanel';
import { GCodeExportDialog } from '../components/GCodeExportDialog';
import { GCodeConfigManager } from '../components/GCodeConfigManager';
import NestingResultPanel from '../components/NestingResultPanel';
import ScrapLineEditor from '../components/ScrapLineEditor';
import NestingGCodeExportDialog from '../components/NestingGCodeExportDialog';
import { useAppStore } from '../store';
import { getGCodeConfigs } from '../services/api';
import type { GCodeConfig, ScrapLine } from '@dxf-fix/shared';
import { MainHeader } from './MainHeader';

export function MainApp() {
    const { getActiveFile, files, selectedLayout, setSelectedLayout, activePartId, setActivePart } = useAppStore();
    const currentFile = getActiveFile();
    const [activePanel, setActivePanel] = useState<'layers' | 'parts' | 'rules' | 'gcode' | 'nesting' | null>(null);
    const [showConfigManager, setShowConfigManager] = useState(false);
    const [showNestingPanel, setShowNestingPanel] = useState(false);
    const [showScrapLineEditor, setShowScrapLineEditor] = useState(false);
    const [showNestingExportDialog, setShowNestingExportDialog] = useState(false);
    const [gcodeConfigs, setGcodeConfigs] = useState<GCodeConfig[]>([]);

    // Get all parts from all files
    const allFiles = Array.from(files.values()).filter(f => f.status === 'ready' && f.parts);
    const allParts = allFiles.flatMap(f => f.parts || []);

    // Load G-code configs on mount
    useEffect(() => {
        loadGCodeConfigs();
    }, []);

    const loadGCodeConfigs = async () => {
        try {
            const configs = await getGCodeConfigs();
            setGcodeConfigs(configs);
        } catch (error) {
            console.error('Failed to load G-code configs:', error);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-slate-50">
            {/* Header */}
            <MainHeader
                currentFile={currentFile}
                activePanel={activePanel}
                setActivePanel={setActivePanel}
                setShowConfigManager={setShowConfigManager}
                setShowNestingPanel={setShowNestingPanel}
            />

            <main className="flex-1 flex overflow-hidden">
                {/* Left sidebar - File list */}
                <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
                    <div className="p-4 border-b border-slate-100">
                        <h2 className="text-sm font-semibold text-slate-800">文件列表</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <FileList />
                    </div>
                </aside>

                {/* Right side - WebCAD */}
                <section className="flex-1 bg-black relative">
                    <WebCAD />

                    {/* Floating panels */}
                    {activePanel === 'layers' && (
                        <FloatingPanel
                            title="图层管理"
                            onClose={() => setActivePanel(null)}
                            width={380}
                        >
                            <LayerManager />
                        </FloatingPanel>
                    )}

                    {activePanel === 'rules' && (
                        <FloatingPanel
                            title="规则配置"
                            onClose={() => setActivePanel(null)}
                            width={400}
                        >
                            <RuleEditor />
                        </FloatingPanel>
                    )}

                    {activePanel === 'gcode' && currentFile && currentFile.status === 'ready' && (
                        <FloatingPanel
                            title="导出G代码"
                            onClose={() => setActivePanel(null)}
                            width={600}
                        >
                            <GCodeExportDialog
                                isOpen={activePanel === 'gcode'}
                                onClose={() => setActivePanel(null)}
                            />
                        </FloatingPanel>
                    )}

                    <GCodeConfigManager
                        isOpen={showConfigManager}
                        onClose={() => setShowConfigManager(false)}
                    />

                    {/* Nesting Result Panel */}
                    {selectedLayout && (
                        <NestingResultPanel
                            layout={selectedLayout}
                            selectedPartId={activePartId}
                            onPartSelect={setActivePart}
                            onAddScrapLine={() => setShowScrapLineEditor(true)}
                            onDeleteScrapLine={(lineId) => {
                                if (selectedLayout.scrapLines) {
                                    const newLayout = {
                                        ...selectedLayout,
                                        scrapLines: selectedLayout.scrapLines.filter((l) => l.id !== lineId),
                                    };
                                    setSelectedLayout(newLayout);
                                }
                            }}
                            onExportGCode={() => setShowNestingExportDialog(true)}
                        />
                    )}

                    {/* Scrap Line Editor */}
                    <ScrapLineEditor
                        isOpen={showScrapLineEditor}
                        onClose={() => setShowScrapLineEditor(false)}
                        onAddScrapLine={(line: ScrapLine) => {
                            if (selectedLayout) {
                                const newLayout = {
                                    ...selectedLayout,
                                    scrapLines: [...(selectedLayout.scrapLines || []), line],
                                };
                                setSelectedLayout(newLayout);
                            }
                        }}
                        parts={allParts}
                    />

                    {/* Nesting G-code Export Dialog */}
                    <NestingGCodeExportDialog
                        isOpen={showNestingExportDialog}
                        onClose={() => setShowNestingExportDialog(false)}
                        layout={selectedLayout}
                        gcodeConfigs={gcodeConfigs}
                    />

                    {/* Status indicator */}
                    {currentFile && (
                        <div className="absolute bottom-4 left-4 bg-slate-800/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm shadow-lg">
                            <div className="flex items-center gap-4">
                                <span>{currentFile.name}</span>
                                <span className="text-slate-400">|</span>
                                {currentFile.entityCount !== undefined && (
                                    <span>实体: {currentFile.entityCount}</span>
                                )}
                                {currentFile.partCount !== undefined && (
                                    <>
                                        <span className="text-slate-400">|</span>
                                        <span>零件: {currentFile.partCount}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
