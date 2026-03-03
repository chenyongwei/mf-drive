export type CadTextAlignH = 'left' | 'center' | 'right';
export type CadTextAlignV = 'top' | 'middle' | 'baseline' | 'bottom';
export type CadTextLineMode = 'single' | 'double';

export type CadTextData = {
  content: string;
  fontId?: string;
  fontSize?: number;
  lineHeight?: number;
  rotation?: number;
  alignH?: CadTextAlignH;
  alignV?: CadTextAlignV;
  lineMode?: CadTextLineMode;
  tolerance?: number;
};

export type CadTextBBox = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type CadTextPathSegment = {
  type: string;
  [key: string]: unknown;
};

export type CadTextRenderData = {
  paths: CadTextPathSegment[];
  bbox: CadTextBBox;
  localBBox: CadTextBBox;
};

export type CadTextVectorizeInput = {
  userId?: string | null;
  position: { x: number; y: number };
  textData: Partial<CadTextData>;
};

export type CadTextVectorizeOutput = {
  textData: CadTextData;
  textRender: CadTextRenderData;
};
