import React from 'react';
import { UserDropdown } from '../components/Auth';
import FileUpload from '../components/FileUpload';

interface MainHeaderProps {
    currentFile: any;
    activePanel: 'layers' | 'parts' | 'rules' | 'gcode' | 'nesting' | null;
    setActivePanel: (panel: 'layers' | 'parts' | 'rules' | 'gcode' | 'nesting' | null) => void;
    setShowConfigManager: (show: boolean) => void;
    setShowNestingPanel: (show: boolean) => void;
}

export function MainHeader({
    currentFile,
    activePanel,
    setActivePanel,
    setShowConfigManager,
    setShowNestingPanel
}: MainHeaderProps) {
    return (
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-lg font-semibold text-slate-800">CloudNest</h1>
                    <p className="text-xs text-slate-500">Order Management and Drawing, Nesting, Reporting</p>
                </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2">
                <a
                    href="/preprocess.html"
                    className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    预处理
                </a>
                <FileUpload buttonMode />
                {currentFile && currentFile.status === 'ready' && (
                    <>
                        <button
                            onClick={() => setActivePanel(activePanel === 'layers' ? null : 'layers')}
                            className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${activePanel === 'layers'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            图层
                        </button>
                        <button
                            onClick={() => setShowNestingPanel(true)}
                            className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4-4m0 0l4 4m4 4v4H8m-4 0l4 4m4-4v4H8" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M17 7v10M7 17v-10" />
                            </svg>
                            排样
                        </button>
                        <button
                            onClick={() => setActivePanel(activePanel === 'rules' ? null : 'rules')}
                            className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${activePanel === 'rules'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-1.756.426-1.756-2.924 0-3.35a1.724 1.724 0 00-1.065-2.573c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-2.573-1.066c1.756-.426 1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            规则
                        </button>
                        <button
                            onClick={() => setActivePanel(activePanel === 'gcode' ? null : 'gcode')}
                            className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${activePanel === 'gcode'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l4-4m4 4V4a2 2 0 00-2-2H8a2 2 0 00-2 2v12" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h3" />
                            </svg>
                            导出G代码
                        </button>
                        <button
                            onClick={() => setShowConfigManager(true)}
                            className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-1.756.426-1.756-2.924 0-3.35a1.724 1.724 0 00-1.065-2.573c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-2.573-1.066c1.756-.426 1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.5 13.5L17 18" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 13.5l-5.5 5.5" />
                            </svg>
                            配置
                        </button>
                    </>
                )}
                {/* User Dropdown */}
                <UserDropdown />
            </div>
        </header>
    );
}
