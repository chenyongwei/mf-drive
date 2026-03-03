interface ViewerErrorStateProps {
  error: string;
}

export function ViewerLoadingState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 mt-4">加载中...</p>
      </div>
    </div>
  );
}

export function ViewerErrorState({ error }: ViewerErrorStateProps) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-red-400">加载失败: {error}</p>
      </div>
    </div>
  );
}
