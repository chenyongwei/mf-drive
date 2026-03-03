export interface ComparisonViewProps {
  fileId: string;
  version1: number;
  version2: number;
  theme: 'dark' | 'light';
  onClose: () => void;
}

export interface VersionData {
  version: number;
  operations: any[];
  loading: boolean;
  error: string | null;
}
