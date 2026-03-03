import React, { useState } from 'react';
import MixedUpload from './MixedUpload';
import CompareViewerWebCAD from './CompareViewerWebCAD';

const CompareUploadPage: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const handleFilesUploaded = (filesData: any[]) => {
    // Append new files to existing list instead of replacing
    setUploadedFiles(prevFiles => [...prevFiles, ...filesData]);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <h1 className="text-white text-xl font-semibold">图纸与零件对比查看</h1>
        <p className="text-slate-400 text-sm mt-1">上传 .dxf 和 .prts 文件，相同文件名的文件将并排对比显示</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 bg-slate-800 border-r border-slate-700 p-4 overflow-y-auto">
          <MixedUpload onFilesUploaded={handleFilesUploaded} />

          {uploadedFiles.length > 0 && (
            <div className="mt-4">
              <h3 className="text-white text-sm font-medium mb-2">已上传文件 ({uploadedFiles.length})</h3>
              <div className="space-y-1">
                {uploadedFiles.map((file, index) => {
                  const fileType = file.fileType || (file.originalFilename?.toLowerCase().endsWith('.dxf') ? 'DXF' : 'PRTS');
                  const colorClass = fileType === 'DXF' ? 'text-blue-400' : 'text-green-400';
                  return (
                    <div key={file.partId || file.id} className={`bg-slate-700/50 rounded px-3 py-2 text-xs ${colorClass}`}>
                      {index + 1}. {file.originalFilename || file.name || file.partId} ({fileType})
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden relative">
          {uploadedFiles.length > 0 ? (
            <CompareViewerWebCAD files={uploadedFiles} />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              <div className="text-center">
                <svg className="mx-auto h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg">请先上传 .dxf 或 .prts 文件</p>
                <p className="text-sm mt-2">相同文件名的 DXF 和 PRTS 将自动并排对比</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompareUploadPage;
