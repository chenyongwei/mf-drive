import type { CadTextVectorizeInput, CadTextVectorizeOutput } from './types';

export interface TextVectorizer {
  vectorize(input: CadTextVectorizeInput): Promise<CadTextVectorizeOutput>;
}

function toNumber(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export class NoopTextVectorizer implements TextVectorizer {
  async vectorize(input: CadTextVectorizeInput): Promise<CadTextVectorizeOutput> {
    const text = String(input.textData.content ?? '');
    const fontSize = toNumber(input.textData.fontSize, 24);
    const width = Math.max(fontSize, text.length * fontSize * 0.6);
    const height = fontSize;

    return {
      textData: {
        content: text,
        fontId: input.textData.fontId,
        fontSize,
        lineHeight: toNumber(input.textData.lineHeight, 1.2),
        rotation: toNumber(input.textData.rotation, 0),
        alignH: (input.textData.alignH as CadTextVectorizeOutput['textData']['alignH']) ?? 'left',
        alignV: (input.textData.alignV as CadTextVectorizeOutput['textData']['alignV']) ?? 'baseline',
        lineMode: (input.textData.lineMode as CadTextVectorizeOutput['textData']['lineMode']) ?? 'double',
        tolerance: toNumber(input.textData.tolerance, 0.35),
      },
      textRender: {
        paths: [],
        localBBox: {
          minX: 0,
          minY: -height,
          maxX: width,
          maxY: 0,
        },
        bbox: {
          minX: input.position.x,
          minY: input.position.y - height,
          maxX: input.position.x + width,
          maxY: input.position.y,
        },
      },
    };
  }
}
