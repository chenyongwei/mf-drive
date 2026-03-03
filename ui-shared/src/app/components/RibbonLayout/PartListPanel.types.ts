export interface Part {
  id: string;
  name: string;
  fileId: string;
  fileName: string;
  dimensions: { width: number; height: number };
  quantity: number;
  material?: string;
  thickness?: number;
  area?: number;
  status: 'nested' | 'pending';
  thumbnail?: string;
  thumbnailUrl?: string;
  fileThumbnailUrl?: string;
  importTime?: string;
}

export interface PartGroup {
  fileId: string;
  fileName: string;
  fileThumbnailUrl?: string;
  parts: Part[];
}

export interface PartListPanelProps {
  parts: Part[];
  totalParts: number;
  selectedPartIds: Set<string>;
  onPartSelect: (partId: string) => void;
  onPartMultiSelect: (partIds: string[]) => void;
  onSelectAll: () => void;
  onDelete: (partIds: string[]) => void;
  onImport: (files: FileList | File[]) => void;
  onEditProperties: (partId: string) => void;
  onDuplicate: (partIds: string[]) => void;
  displayMode: 'list' | 'thumbnail' | 'detail';
  onDisplayModeChange: (mode: 'list' | 'thumbnail' | 'detail') => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterMinArea?: number;
  filterMaxArea?: number;
  filterMinQuantity?: number;
  filterMaxQuantity?: number;
  filterStatus: 'all' | 'nested' | 'pending';
  onFilterMinAreaChange?: (value: number | undefined) => void;
  onFilterMaxAreaChange?: (value: number | undefined) => void;
  onFilterMinQuantityChange?: (value: number | undefined) => void;
  onFilterMaxQuantityChange?: (value: number | undefined) => void;
  onFilterStatusChange: (status: 'all' | 'nested' | 'pending') => void;
  onClearFilters: () => void;
}
