export interface Part {
  id: string;
  name: string;
  dimensions: { width: number; height: number };
  quantity: number;
  position?: { x: number; y: number };
  rotation?: number;
  status: 'nested' | 'pending';
}

export interface NestResult {
  id: string;
  name: string;
  utilization: number;
  sheetDimensions: { width: number; height: number };
  partsCount: number;
}

export interface CADCanvasProps {
  parts: Part[];
  nestResults: NestResult[];
  selectedPartIds: Set<string>;
  selectedResultIds: Set<string>;
  onPartClick: (partId: string) => void;
  onResultClick: (resultId: string) => void;
  viewMode: 'parts' | 'nesting' | 'multi' | 'empty';
  nestingSettings: {
    sheetWidth: number;
    sheetHeight: number;
    partSpacing: number;
    margin: number;
  };
  onPartPositionChange?: (partId: string, position: { x: number; y: number }) => void;
}

export interface RulerSize {
  top: number;
  left: number;
}
