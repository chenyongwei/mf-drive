interface AdminSearchButtonProps {
  label?: string;
}

export function AdminSearchButton({ label = "Search" }: AdminSearchButtonProps) {
  return (
    <button
      type="submit"
      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      {label}
    </button>
  );
}

interface AdminErrorAlertProps {
  error: string | null;
}

export function AdminErrorAlert({ error }: AdminErrorAlertProps) {
  if (!error) {
    return null;
  }
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-red-600">{error}</p>
    </div>
  );
}

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (nextPage: number) => void;
}

export function AdminPagination({ page, totalPages, onPageChange }: AdminPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Previous
      </button>
      <span className="text-sm text-gray-600">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Next
      </button>
    </div>
  );
}

export function getStorageUsageColor(percent: number): string {
  if (percent >= 90) {
    return 'text-red-600 bg-red-100';
  }
  if (percent >= 70) {
    return 'text-yellow-600 bg-yellow-100';
  }
  return 'text-green-600 bg-green-100';
}
