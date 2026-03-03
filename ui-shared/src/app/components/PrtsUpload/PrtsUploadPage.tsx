import React, { useState } from 'react';
import PrtsUpload from './PrtsUpload';
import PartViewerWebCAD from './PartViewerWebCAD';

const PrtsUploadPage: React.FC = () => {
  const [uploadedParts, setUploadedParts] = useState<any[]>([]);

  const handlePartsUploaded = (partsData: any[]) => {
    // Append new parts to existing list instead of replacing
    setUploadedParts(prevParts => [...prevParts, ...partsData]);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <h1 className="text-white text-xl font-semibold">零件上传与查看</h1>
        <p className="text-slate-400 text-sm mt-1">上传 .prts 文件转换为 JSON 并在 CADView 中查看</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 bg-slate-800 border-r border-slate-700 p-4 overflow-y-auto">
          <PrtsUpload onPartsUploaded={handlePartsUploaded} />

          {uploadedParts.length > 0 && (
            <div className="mt-4">
              <h3 className="text-white text-sm font-medium mb-2">已上传文件 ({uploadedParts.length})</h3>
              <div className="space-y-1">
                {uploadedParts.map((part, index) => (
                  <div key={part.partId} className="bg-slate-700/50 rounded px-3 py-2 text-xs text-slate-300">
                    {index + 1}. {part.originalFilename || part.partId}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden relative">
          {uploadedParts.length > 0 ? (
            <PartViewerWebCAD parts={uploadedParts} />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              <div className="text-center">
                <svg className="mx-auto h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg">请先上传 .prts 文件</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrtsUploadPage;
